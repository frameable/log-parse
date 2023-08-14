import { ctx } from "."
import * as fs from "node:fs"
import * as path from "node:path"

describe("ctx", () => {
  test("writable defaults", () => {
    const context = ctx()
    fs.mkdirSync(context.logRoot, { recursive: true })
    fs.mkdirSync(context.sqliteRoot, { recursive: true })

    fs.writeFileSync(path.join(context.logRoot, "current.log"), "buggin' out on the mainframe!")

    fs.rmSync(context.logRoot, { recursive: true, force: true })
    fs.rmSync(context.sqliteRoot, { recursive: true, force: true })
  })
})
