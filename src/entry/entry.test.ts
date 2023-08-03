import dayjs from "dayjs"
import { v4 as uuid } from "uuid"

import { LogLine, ctx } from "../.."
import { entriesLoggerhead, entriesKV, entriesNginx } from "."

async function* logIter(lines: { [key: string]: any }[]): AsyncGenerator<LogLine> {
  for (const index in lines)
    yield {
      content: `${dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ')}\t${JSON.stringify(lines[index])}`,
      line: parseInt(index),
    }
}

describe("entry-iter", () => {
  test("kv", async () => {
    const logRaw = { id: uuid() }

    const iter = entriesKV("no-match", logIter([logRaw]), ctx({ entryFields: new Set() }))
    const next = await iter.next()
    expect(next.done).toEqual(false)
    expect(next.value.body.id).toEqual(logRaw.id)

    expect((await iter.next()).done).toEqual(true)
  })

  test(`loggerhead`, async () => {
    const fields = [uuid(), uuid(), uuid()]
    const logRaw = { MESSAGE: fields.join("\t") }

    const iter = entriesLoggerhead("loggerhead", logIter([logRaw]), ctx({ entryFields: new Set() }))
    const next = await iter.next()
    expect(next.value.body.client_timestamp).toEqual(fields[0])
    expect(next.value.body.error_message).toEqual(fields[1])
    expect(next.value.body.error_stack).toEqual(fields[2])

    expect(next.value.body.email).toStrictEqual(null)
  })

  test("nginx error", async () => {
    const client = "000.000.000.000"
    const host = "alien.abduction.net"
    const message = 'holy shit we have "quotes in here"'
    const logRaw = [
      "2022/03/28 00:00:01 [warn] 20682#0:",
      `*4386573 ${message},`,
      `client: ${client},`,
      "server: ,",
      "request: \"GET /api/features HTTP/1.1\",",
      "upstream: \"http://127.0.0.1:8082/api/features\",",
      `host: \"${host}\",`,
      "referrer: \"https://alien.abduction.net/unauth-login-flow-h2wl0dsut7k/admin/theme\"",
    ].join(" ")

    const iter = entriesNginx("test.nginx.error", logIter([{ log: logRaw }]), ctx({ entryFields: new Set() }))
    const next = await iter.next()

    expect(next.value.body.client).toEqual(client)
    expect(next.value.body.host).toEqual(host)
    expect(next.value.body.message).toEqual(message)
  })
})
