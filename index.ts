import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Context } from "./model";

export { Context, ColumnIndex, LogLine, Entry, EntryIterFunc, EntryIter } from "./model"
export { insert, insertFunc, latestLogStat, getDatabase } from "./src/insert"
export { iterLogs } from "./src/read-file"

export const ctx = (part?: Partial<Context>): Context => ({
  entryFields: new Set<string>(),
  sqliteTable: "logs",
  sqliteRoot: mkdtempSync(join(tmpdir(), "")),
  sqliteInMemory: false,
  sqliteColumnIndexes: [],
  logsRoot: mkdtempSync(join(tmpdir(), "")),
  logsDaysAgo: 1,
  ...part,
})
