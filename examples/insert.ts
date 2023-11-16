import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { ctx, insert, iterLogs } from ".."
import { entriesKV } from "../src/entry/entry-kv"
import { chunkEntries } from "../src/entry"
import { makeDatabase } from "../src/insert"

const main = async () => {
  const context = ctx({
    entryFields: new Set(["year", "uniq"]),
    sqliteInMemory: true
  })

  await writeFile(join(context.logfileRoot, "current.log"), `\
12-31-2019\t{"year": 2019, "uniq": 4}
12-31-2020\t{"year": 2020, "uniq": 2}
12-31-2021\t{"year": 2021, "uniq": 3}
12-31-2022\t{"year": 2022, "uniq": 2}`)


  const entries = await chunkEntries(entriesKV("year-digits", iterLogs(context), context), 4, 0).next()
  if (!entries.value) throw "that should not be the thing that happens"

  const database = makeDatabase("year-digits", context)
  insert(entries.value, database, context)

  const years = database.prepare(`SELECT year FROM ${context.sqliteTable} WHERE uniq>=3`).all() as string[]
  console.log(years)
}

main()
