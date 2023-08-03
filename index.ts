export declare type Context = {
  sqliteTable: string
  entryFields: Set<string>
  sqliteRoot: string
  sqliteInMemory: boolean
  sqliteColumnIndexes: ColumnIndex[]
  logsRoot: string
  logsDaysAgo: number
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

export const ctx = (part: Partial<Context> & Pick<Context, "entryFields">): Context => ({
  sqliteTable: "logs",
  sqliteRoot: "/tmp",
  sqliteInMemory: false,
  sqliteColumnIndexes: [],
  logsRoot: "/tmp",
  logsDaysAgo: 1,
  ...part,
})
