export declare type Context = {
  sqliteTable: string
  entryFields: Set<string>
  sqliteRoot: string
  sqliteInMemory: boolean
  sqliteColumnIndexes: ColumnIndex[]
  logRoot: string
  logDaysAgo: number
}

export declare type ColumnIndex = {
  name: string
  unique: boolean
}

export declare type LogLine = {
  line: number
  content: string
}

export declare type Entry = {
  identifier: number;
  timestamp: Date;
  body: { [key: string]: any };
  source?: LogLine;
}

export declare type EntryIterFunc = (service: string, iter: AsyncGenerator<LogLine>, ctx: Context) => AsyncGenerator<Entry>
export declare type EntryIter = AsyncGenerator<Entry>
