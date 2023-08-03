import { Context, LogLine } from "../../model"

export async function* makeKVEntry(service: string, iter: AsyncGenerator<LogLine>, ctx: Context) {
  for await (const { line, content } of iter) {
    const [rawTime, body] = content.split("\t");
    const timestamp = new Date(rawTime)
    const identifier = timestamp.getTime() + line
    if (!body) {
      continue
    }

    yield {
      identifier,
      timestamp,
      body: JSON.parse(body),
      source: { line, content },
    };
  }
}
