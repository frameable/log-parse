import { Context } from "./model";

export { Context, ColumnIndex, LogLine, Entry, EntryIterFunc, EntryIter } from "./model"
export { insert, insertFunc, latestLogStat, getDatabase } from "./src/insert"
export { iterLogs } from "./src/read-file"

export const ctx = (part: Partial<Context> & Pick<Context, "entryFields">): Context => ({
  sqliteTable: "logs",
  sqliteRoot: "/tmp",
  sqliteInMemory: false,
  sqliteColumnIndexes: [],
  logsRoot: "/tmp",
  logsDaysAgo: 1,
  ...part,
})
