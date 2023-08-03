import { Context, Entry, EntryIter, EntryIterFunc, LogLine } from "../../model"
import { makeKVEntry } from "./entry-kv"
import { makeLoggerheadEntry } from "./entry-loggerhead"
import { makeNginxEntry } from "./entry-nginx"
import { makePinoEntry } from "./entry-pino"

const entryLookup: [RegExp, EntryIterFunc][] = [
  [/^.+.nginx.error$/, makeNginxEntry],
  [/^loggerhead$/, makeLoggerheadEntry],
  [/^loggerhead-.+\.systemd$/, makeLoggerheadEntry],
  [/^frameable-beta-grackle.*/, makePinoEntry],
  [/^grackle.*/, makePinoEntry],
  [/peacock/, makePinoEntry],
]

export const makeEntries = (service: string, logIter: AsyncGenerator<LogLine>, ctx: Context): EntryIter => {
  for (const [match, maker] of entryLookup) {
    if (service.match(match)) {
      return maker(service, logIter, ctx)
    }
  }

  return makeKVEntry(service, logIter, ctx)
}

async function* filterID(id: number, iter: AsyncGenerator<Entry>) {
  for await (const entry of iter) {
    if (entry.identifier > id) yield entry
  }
}

export async function* makeEntryChunks(iter: AsyncGenerator<Entry>, size: number, notBeforeID: number) {
  const filterIter = filterID(notBeforeID, iter)
  while (true) {
    const buffer: Entry[] = []

    for (let i = 0; i < size; i++) {
      const nextLine = await filterIter.next()
      if (!!nextLine.done) {
        if (buffer.length) yield buffer
        return
      }

      buffer.push(nextLine.value)
    }

    if (buffer.length) yield buffer
  }
}
