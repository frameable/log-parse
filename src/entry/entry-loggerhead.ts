import { Context, EntryIter, LogLine } from "../model";
import { entriesKV } from "./entry-kv";

const messageKeys: [number, string][] = [
  [0, "client_timestamp"],
  [1, "error_message"],
  [2, "error_stack"],
  [3, "vendor"],
  [4, "platform"],
  [5, "user_agent"],
  [6, "url"],
  [7, "commit_sha"],
  [8, "email"],
  [9, "event_id"],
  [10, "room_id"],
  [11, "display_name"],
  [12, "is_host"],
  [13, "user_uuid"],
  [14, "user_agent_short"],
  [15, "severity"],
]

export async function* entriesLoggerhead(service: string, iter: AsyncGenerator<LogLine>, ctx: Context): EntryIter {
  for await (const entry of entriesKV(service, iter, ctx)) {
    const messageParts = entry.body.MESSAGE.split("\t")
    const messageEntries = messageKeys
      .map(([index, key]) => [key, messageParts[index] || null])

    yield {
      ...entry, body: {
        ...entry.body,
        ...Object.fromEntries(messageEntries)
      },
    }
  }
}
