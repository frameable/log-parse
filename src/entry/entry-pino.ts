import { Context, LogLine } from "../../model";
import { entriesKV } from "./entry-kv";

export async function* entriesPino(service: string, iter: AsyncGenerator<LogLine>, ctx: Context) {
  for await (const entry of entriesKV(service, iter, ctx)) {
    try {
      const log = JSON.parse(entry.body.log)
      const noLog = Object.fromEntries(Object.entries(entry.body)
        .filter(([key]) => key !== "log"))

      yield { ...entry, body: { ...noLog, ...log } }
    } catch (err) { yield entry }
  }
}
