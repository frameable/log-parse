import { entriesKV } from "./entry-kv"
import { Context, EntryIter, LogLine } from "../model"

let bodyMatchers = [
  ["date", /(?<date>\d{4}\/\d{2}\/\d{2})/],
  ["time", /(?<time>\d{2}:\d{2}:\d{2})/],
  ["severity", /\[(?<severity>\w+)\]/],
  ["pid", /(?<pid>\d+)#/],
  ["tid", /(?<tid>\d+):/],
  ["cid", /\*(?<cid>\d+)/],
  ["message", /(?<=\*\d+ )(?<message>[^,]+),/],
]

const extraKVRegion = /(\*\d+[^,]+, )(?<extraKVRegion>.+)/
const extraKVMatchers = [
  new RegExp(/(?<key>[^ ^,]+): (?<value>(?:\\?"[^"]+")),?/g), // quoted
  new RegExp(/(?<key>[^ ^,]+): (?<value>[^,^"]+),?/g), // unquoted
  new RegExp(/(?<key>[^ ^,]+): (?<value>.{0}),/g), // no value
]

function parseNginxBody(body: { [key: string]: any }): { [key: string]: any } {
  const bodyFields = bodyMatchers
    .map(([key, matcher]): any => [key, body.log.match(matcher)[1]])

  const region: string = body.log.match(extraKVRegion).groups.extraKVRegion
  const extraFields = extraKVMatchers
    .flatMap(kvMatcher => [...region.matchAll(kvMatcher)]) // strip off quotes
    .map(each => [each?.groups?.key, each?.groups?.value.replace(/^"|"$/g, "")])
    .filter(([key, value]) => key && value)

  return {
    server: body.server,
    ...Object.fromEntries(bodyFields),
    ...Object.fromEntries(extraFields),
  }
}


export async function* entriesNginx(service: string, iter: AsyncGenerator<LogLine>, ctx: Context): EntryIter {
  for await (const entry of entriesKV(service, iter, ctx)) {
    try {
      yield { ...entry, body: parseNginxBody(entry.body) }
    } catch (err) {
      yield entry
    }
  }
}
