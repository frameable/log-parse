import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import dayjs from "dayjs"
import { v4 as uuid } from "uuid"
import { createGzip } from "zlib"

import { iterLogs } from "./read-file"
import { ctx } from ".."

describe("log-iter", () => {
  const logsRoot = path.join(os.tmpdir(), uuid())

  beforeEach(() => {
    fs.mkdirSync(logsRoot, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(logsRoot, { recursive: true })
  })

  test("current.log", async () => {
    const logWant = uuid()
    fs.writeFileSync(path.join(logsRoot, "current.log"), logWant)

    const iter = iterLogs(ctx({ logsRoot, logsDaysAgo: 1 }))
    const next = await iter.next()
    if (next.done) throw "done"
    expect(next.value.line).toEqual(0)
    expect(next.value.content).toEqual(logWant)
    expect((await iter.next()).done).toEqual(true)
  })

  test("file.YYYYMMDD.log", async () => {
    const logWant = uuid()
    fs.writeFileSync(path.join(logsRoot, `file.${dayjs().format("YYYYMMDD")}.log`), logWant)

    const next = await iterLogs(ctx({ logsRoot, logsDaysAgo: 1 })).next()
    if (next.done) throw "done"
    expect(next.value.content).toEqual(logWant)
  })

  test("exclude file.YYYYMMDD.log", async () => {
    const logWant = uuid()
    fs.writeFileSync(path.join(logsRoot, "current.log"), logWant)
    fs.writeFileSync(path.join(logsRoot, `file.${dayjs().subtract(2, "day").format("YYYYMMDD")}.log`), uuid())

    const iter = iterLogs(ctx({ logsRoot, logsDaysAgo: 1 }))
    const next = await iter.next()

    if (next.done) throw "done"
    expect(next.value.content).toEqual(logWant)
    expect((await iter.next()).done).toEqual(true)
  })

  test("file.YYYYMMDD.log.gz", async () => {
    const logWant = uuid()
    const gzip = createGzip()
    gzip.pipe(fs.createWriteStream(path.join(logsRoot, `file.${dayjs().format("YYYYMMDD")}.log.gz`)))

    if (!gzip.write(logWant, "utf-8"))
      await new Promise(resolve => gzip.once("drain", resolve))

    await new Promise(resolve => gzip.end(resolve))

    const iter = iterLogs(ctx({ logsRoot, logsDaysAgo: 1 }))
    const next = await iter.next()
    if (next.done) throw "done"
    expect(next.value.content).toEqual(logWant)
    expect((await iter.next()).done).toEqual(true)
  })
})
