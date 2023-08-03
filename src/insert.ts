import * as path from "path"
import dayjs, { Dayjs } from 'dayjs'
import sqlite3, { Database } from "better-sqlite3"

import { Context, Entry } from ".."

// make a new database, or open an existing database if it exists
export const makeDatabase = (name: string, ctx: Context): Database => {
  const database = ctx.sqliteInMemory ? sqlite3(":memory:") : sqlite3(path.join(ctx.sqliteRoot, `${name}.sqlite`))
  database.pragma('journal_mode = WAL')

  const { tableExists } = database
    .prepare(`SELECT COUNT(*)==1 as tableExists FROM sqlite_master WHERE type='table' AND name='${ctx.sqliteTable}'`)
    .get() as { tableExists: boolean }

  if (tableExists) return database

  const fieldString = ["identifier", "timestamp", "data", ...ctx.entryFields]
    .map(field => `"${field}" TEXT ${field === "identifier" ? "NOT NULL UNIQUE" : ""}`)
    .join(",")

  database.prepare(`CREATE TABLE IF NOT EXISTS "${ctx.sqliteTable}" (${fieldString})`).run()
  for (const col of ctx.sqliteColumnIndexes) {
    database
      .prepare(`CREATE ${col.unique ? "UNIQUE" : ""} INDEX IF NOT EXISTS ${col.name} on ${ctx.sqliteTable}(${col.name})`)
      .run()
  }

  return database
}

// get a database that exists on disk
export const getDatabase = (name: string, ctx: Context): Database => {
  const database = ctx.sqliteInMemory ? sqlite3("memory") : new sqlite3(path.join(ctx.sqliteRoot, `${name}.sqlite`), { fileMustExist: true })
  database.pragma('journal_mode = WAL')
  return database
}

// get the stat of the latest log if it exists
export const latestLogStat = async (database: Database, ctx: Context): Promise<[Dayjs, number]> => {
  const statement = `SELECT date(timestamp) as time, identifier as date FROM ${ctx.sqliteTable} ORDER BY identifier DESC LIMIT 1`
  try {
    const { time, identifier } = database.prepare(statement).get() as { time: string, identifier: string }
    const intID = parseInt(identifier)
    if (Number.isNaN(intID)) throw `${identifier} isn't a number!`

    return [dayjs(time), intID]
  } catch (err) {
    return [dayjs().subtract(ctx.logsDaysAgo, "day"), 0]
  }
}

// turns a json value into a string
const valueString = (value: any): string => {
  if (value === undefined || value === null) return ""
  if (typeof value == "string") return value
  return JSON.stringify(value)
}

// turns many entries into many lists of string values
// that are suitable to inserted with SQL
// this code collects the values for ["identifier", "timestamp", "data"]
const values = (entries: Entry[], ctx: Context): string[][] =>
  entries.map(entry => {
    const valuesKV = Object.entries(entry.body)
    const valuesMap = new Map(valuesKV)

    return [
      entry.identifier.toString(),
      entry.timestamp.toISOString(),
      JSON.stringify(Object.fromEntries(valuesKV.filter(([field, _]) => !ctx.entryFields.has(field)))),
      ...[...ctx.entryFields].map(field => valuesMap.get(field)),
    ].map(valueString)
  })

// returns a function that we can use to insert any number of entries later
export const insertFunc = (database: Database, ctx: Context): (entries: Entry[]) => void =>
  database.transaction((entries: Entry[]) => {
    const fieldsMeta = ["identifier", "timestamp", "data", ...ctx.entryFields]
    const fieldsNames = fieldsMeta.join(",")
    const fieldsBlank = fieldsMeta.fill("?").join(",")
    const insert = database.prepare(`INSERT OR IGNORE INTO "${ctx.sqliteTable}" (${fieldsNames}) VALUES (${fieldsBlank})`)

    values(entries, ctx).map((value: string[]) => insert.run(value))
  })

// it's a shortcut for when you maybe only want to insert a thing
export const insert = (entries: Entry[], database: Database, ctx: Context) =>
  insertFunc(database, ctx)(entries)
