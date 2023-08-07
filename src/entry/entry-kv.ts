import { Context, EntryIter, LogLine } from "../model"

export async function* entriesKV(service: string, iter: AsyncGenerator<LogLine>, ctx: Context): EntryIter {
  for await (const { line, content } of iter) {
    const match = content.match(ctx.entryRegex)
    if (!(match && match.groups && match.groups.timestamp && match.groups.body))
      throw `the log did not parse, or a required named group is missing! line ${line}: ${content}`

    const timestamp = new Date(match.groups.timestamp)
    const identifier = timestamp.getTime() + line

    yield {
      identifier,
      timestamp,
      body: JSON.parse(match.groups.body),
      source: { line, content },
    };
  }
}
