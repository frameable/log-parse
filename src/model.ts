import { Dayjs } from "dayjs"

export type ColumnIndex = {
  name: string
  unique: boolean
}

export type Context = {
  entryFields: Set<string>              // sqlite fields to create and fill
  entryRegex: RegExp                    // regex expression for parsing log entry lines. Should extract a body and a timestamp
  sqliteTable: string                   // sqlite table to address
  sqliteRoot: string                    // root directory for sqlite files
  sqliteInMemory: boolean               // open sqlite in memory database?
  sqliteColumnIndexes: ColumnIndex[]    // collection of column unique-ness markers
  logfileRoot: string                   // root directory for reading log files
  logfileBefore: Dayjs | null           // collect files before this date, or null for most recent
  logfileAfter: Dayjs | null            // collect files after this date, or null for forever ago
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
