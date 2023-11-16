import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import dayjs from "dayjs"
import { v4 as uuid } from "uuid"
import { createGzip } from "node:zlib"

import { collectLogFiles, iterLogs } from "./read-file"
import { ctx } from ".."

describe("log-iter", () => {
  const logfileRoot = path.join(os.tmpdir(), uuid())

  beforeEach(() => {
    fs.mkdirSync(logfileRoot, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(logfileRoot, { recursive: true })
  })

  test("current.log", async () => {
    const logWant = uuid()
    fs.writeFileSync(path.join(logfileRoot, "current.log"), logWant)

    const iter = iterLogs(ctx({ logfileRoot, logfileAfter: dayjs().subtract(1, "day") }))
    const next = await iter.next()
    if (next.done) throw "done"
    expect(next.value.line).toEqual(0)
    expect(next.value.content).toEqual(logWant)
    expect((await iter.next()).done).toEqual(true)
  })

  test("file.YYYYMMDD.log", async () => {
    const logWant = uuid()
    fs.writeFileSync(path.join(logfileRoot, `file.${dayjs().format("YYYYMMDD")}.log`), logWant)

    const next = await iterLogs(ctx({ logfileRoot, logfileAfter: dayjs().subtract(1, "day") })).next()
    if (next.done) throw "done"
    expect(next.value.content).toEqual(logWant)
  })

  test("exclude file.YYYYMMDD.log", async () => {
    const logWant = uuid()
    fs.writeFileSync(path.join(logfileRoot, "current.log"), logWant)
    fs.writeFileSync(path.join(logfileRoot, `file.${dayjs().subtract(2, "day").format("YYYYMMDD")}.log`), uuid())

    const iter = iterLogs(ctx({ logfileRoot, logfileAfter: dayjs().subtract(1, "day") }))
    const next = await iter.next()

    if (next.done) throw "done"
    expect(next.value.content).toEqual(logWant)
    expect((await iter.next()).done).toEqual(true)
  })

  // this test is broken because we can't create the gzip path on github runner 
  test.skip("file.YYYYMMDD.log.gz", async () => {
    const logWant = uuid()
    const gzip = createGzip()
    fs.writeFileSync(path.join(logfileRoot, `file.${dayjs().format("YYYYMMDD")}.log.gz`), "")
    gzip.pipe(fs.createWriteStream(path.join(logfileRoot, `file.${dayjs().format("YYYYMMDD")}.log.gz`)))

    if (!gzip.write(logWant, "utf-8"))
      await new Promise(resolve => gzip.once("drain", resolve))

    await new Promise(resolve => gzip.end(resolve))

    const iter = iterLogs(ctx({ logfileRoot, logfileAfter: dayjs().subtract(1, "day") }))
    const next = await iter.next()
    if (next.done) throw "done"
    expect(next.value.content).toEqual(logWant)
    expect((await iter.next()).done).toEqual(true)
  })
})

describe("collect-log-files", () => {
  const logfileDaysTotal = 10
  const logfileRoot = path.join(os.tmpdir(), uuid())

  beforeEach(() => {
    fs.mkdirSync(logfileRoot, { recursive: true })
    for (let i = 0; i < logfileDaysTotal; i++)
      fs.writeFileSync(path.join(logfileRoot, `file.${dayjs().subtract(i, "day").format("YYYYMMDD")}.log`), "")

  })

  afterEach(() => {
    fs.rmSync(logfileRoot, { recursive: true })
  })

  test("dates", () => {
    expect(collectLogFiles(ctx({ logfileRoot })).length).toEqual(logfileDaysTotal)

    const logfileBefore = dayjs().subtract(3, "day")
    const before = collectLogFiles(ctx({ logfileRoot, logfileBefore }))
    expect(before.length).toEqual(logfileDaysTotal - 3)
    for (const logfile of before) expect(logfile.date.isBefore(logfileBefore)).toBeTruthy()

    const logfileAfter = dayjs().subtract(3, "day")
    const after = collectLogFiles(ctx({ logfileRoot, logfileAfter }))
    expect(after.length).toEqual(3)
    for (const logfile of after) expect(logfile.date.isAfter(logfileAfter)).toBeTruthy()
  })
})