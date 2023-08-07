## log-parse

log-parse is a library for parsing fluentd logs, and getting them into sqlite databases

## Getting started

To add log-parse to your project, `npm install --save @frameable/log-parse`

Example code can be found [`examples`](examples/)


#### The ctx function

#### Reading logs 

Given a directory with some logs, you can open a log iterator there. It will iterate all of the files in that directory, in order of most recently dated ( the date being determined by the filenanme - (I should write more docs for this )), and yield each log line. It will decompress gzipped files.

For example, consider the following directory that contains logs
```shell
$ pwd 
/var/log/my-app/

$ head current.log
2023-08-04T00:10:26+00:00 {"status": "OK"}
2023-08-04T00:10:27+00:00 {"status": "OK"}
2023-08-04T00:10:28+00:00 {"status": "OK"}
2023-08-04T00:10:29+00:00 {"status": "NOT OK", "message": "the server tripped and fell!"}

$ head file.20230803.log.gz | gunzip
2023-08-03T00:10:26+00:00 {"status": "OK"}
2023-08-03T00:10:27+00:00 {"status": "DEGRADED", "message": "the server is getting sleepy..."}
2023-08-03T00:10:28+00:00 {"status": "DEGRADED", "pending_events": 42}
2023-08-03T00:10:29+00:00 {"status": "ASLEEP", "message": "the server is conked out!"}
```

We can iterate those logs as they are. We're using the `ctx` function to specify a default context but with `logRoot` set to our target directory. The `Context` struct is going to be the interface to most of the API

```ts
for await (const log of iterLogs(ctx({logRoot: "/var/log/my-app"}))) {
  console.log(log.content) 
}
```

#### Parsing logs

If we want to parse out the JSON body, we can. The built-in generator `entriesKV` is perfect for this - it will regex match for a `body`. By default, it uses the expression `/^(?<timestamp>[^\t ]+)[\t ](?<body>.+)$/`, but any expression that matches a `body` and `timestamp` can be used with `entryRegex`

```ts
for await (const entry of entriesKV("my-app", iterLogs(ctx({logRoot: "/var/log/my-app"})), ctx())) {
  console.log(entry.body.status)
}
```

The function `chunkEntries` can be used to read and parse chunks of log lines at once, where those chunks are then yielded.

#### Putting logs in SQL

To actually get this stuff in the database we need to have a database. We can also make it on the disk at `sqliteRoot`

```ts
const database = makeDatabase("year-digits", ctx({sqliteInMemory: true}))
```

We can either use insert with the database and some data directly

```ts
const entries = const entries = await chunkEntries(entriesKV("year-digit", iterLogs(ctx({logRoot: "/var/log/my-app"})), ctx()), 4, 0).next() // the first chunk of 4
insert(entries.value, database, ctx({sqliteInMemory: true, entryFields: new Set("status", "message")}))
```

We can also create an `insertFunc` to call later on other collections of entries

```ts
const insFunc = insertFunc(database, ctx({sqliteInMemory: true, entryFields: new Set("status", "message")}))
for await (const chunk of chunkEntries(entriesKV("year-digit", iterLogs(ctx({logRoot: "/var/log/my-app"})), ctx()), 4, 0)) {
  insFunc(chunk)
}
```

`entryFields` describes what fields to create columns for. log-parse also creates meta fields:
  - `identifier` uniquely identifies a single log entry in the scope of all of the files in its `logRoot`. identifier is in chronological order 
  - `timestamp` comes from the value captured by `entryRegex`, which is then parsed into a `Date`
  - `data` has a json blob with any entry kv pairs that weren't an `entryField`

Now we have a database that we can interface with regularly. By default our table is `logs`, that can be set with `sqliteTable`.

```sql
select * from logs;
-- 1691021426000|2023-08-03T00:10:26.000Z|{}|OK|
-- 1691021427001|2023-08-03T00:10:27.000Z|{}|DEGRADED|the server is getting sleepy...
-- 1691021428002|2023-08-03T00:10:28.000Z|{"pending_events":42}|DEGRADED|
-- 1691021429003|2023-08-03T00:10:29.000Z|{}|ASLEEP|the server is conked out!
-- 1691107826004|2023-08-04T00:10:26.000Z|{}|OK|
-- 1691107827005|2023-08-04T00:10:27.000Z|{}|OK|
-- 1691107828006|2023-08-04T00:10:28.000Z|{}|OK|
-- 1691107829007|2023-08-04T00:10:29.000Z|{}|NOT OK|the server tripped and fell!

select count(status), status from logs group by status;
-- 1|ASLEEP
-- 2|DEGRADED
-- 1|NOT OK
-- 4|OK

select json(data) from logs where data != '{}';
-- {"pending_events":42}
```
