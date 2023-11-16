import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Context } from "./src/model";

export { ColumnIndex, Context, LogLine, Entry, EntryIterFunc, EntryIter } from "./src/model"
export { insert, insertFunc, latestLogStat, getDatabase } from "./src/insert"
export { iterLogs } from "./src/read-file"

export const ctx = (part?: Partial<Context>): Context => ({
  entryFields: new Set<string>(),
  entryRegex: /^(?<timestamp>[^\t ]+)[\t ](?<body>.+)$/,
  sqliteTable: "logs",
  sqliteRoot: mkdtempSync(join(tmpdir(), "/")),
  sqliteInMemory: false,
  sqliteColumnIndexes: [],
  logfileRoot: mkdtempSync(join(tmpdir(), "/")),
  logDaysAgo: 1,
  ...Object.fromEntries(Object.entries(part || {}).filter(([_, value]) => value !== undefined)),
})
