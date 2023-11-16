import { ctx } from "."
import * as fs from "node:fs"
import * as path from "node:path"

describe("ctx", () => {
  test("writable defaults", () => {
    const context = ctx()
    fs.mkdirSync(context.logfileRoot, { recursive: true })
    fs.mkdirSync(context.sqliteRoot, { recursive: true })

    const logfile = path.join(context.logfileRoot, "current.log")
    const line = "buggin' out on the mainframe!"
    fs.writeFileSync(logfile, line)
    expect(fs.readFileSync(logfile, { encoding: "utf-8" })).toEqual(line)

    fs.rmSync(context.logfileRoot, { recursive: true, force: true })
    fs.rmSync(context.sqliteRoot, { recursive: true, force: true })
  })

  test("no undefined keys", () => {
    expect(ctx({ sqliteTable: undefined }).sqliteTable).toEqual("logs")
  })
})
