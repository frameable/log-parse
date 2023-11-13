import { Context, EntryIter, LogLine } from "../model";
import { entriesKV } from "./entry-kv";

const messageKeys: [number, string][] = [
  [0, "client_timestamp"],
  [1, "event_name"],
  [2, "context"],
  [3, "vendor"],
  [4, "platform"],
  [5, "user_agent"],
  [6, "url"],
  [7, "application_version"],
  [8, "email"],
  [9, "tenant_id"],
  [10, "application_name"],
  [11, "display_name"],
  [12, "timezone"],
  [13, "user_id"],
  [14, "user_agent_short"],
  [15, "log_level"],
  [16, "instance_id"],
  [17, "sequence_number"],
  [18, "unique_id"],
  [19, "details"],
  [20, "schema_version"],
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
