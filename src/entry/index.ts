import { Entry } from "../../model"
export { makeKVEntry } from "./entry-kv"
export { makeLoggerheadEntry } from "./entry-loggerhead"
export { makeNginxEntry } from "./entry-nginx"
export { makePinoEntry } from "./entry-pino"

async function* filterID(id: number, iter: AsyncGenerator<Entry>) {
  for await (const entry of iter) {
    if (entry.identifier > id) yield entry
  }
}

export async function* chunkEntries(iter: AsyncGenerator<Entry>, size: number, notBeforeID: number) {
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
