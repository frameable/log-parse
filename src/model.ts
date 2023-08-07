export type ColumnIndex = {
  name: string
  unique: boolean
}

export type Context = {
  entryFields: Set<string>
  entryRegex: RegExp
  sqliteTable: string
  sqliteRoot: string
  sqliteInMemory: boolean
  sqliteColumnIndexes: ColumnIndex[]
  logRoot: string
  logDaysAgo: number
}

export type LogLine = {
  line: number
  content: string
}

export type Entry = {
  identifier: number;
  timestamp: Date;
  body: { [key: string]: any };
  source?: LogLine;
}

export type EntryIterFunc = (service: string, iter: AsyncGenerator<LogLine>, ctx: Context) => AsyncGenerator<Entry>
export type EntryIter = AsyncGenerator<Entry>
