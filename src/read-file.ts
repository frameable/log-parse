import dayjs, { Dayjs } from "dayjs";
import * as path from "node:path";
import * as fs from "node:fs";
import * as zlib from "node:zlib";
import * as readline from "node:readline";

import { Context, LogLine } from "./model";

const filenameDate = (filename: string): Dayjs => {
  // file.<year><month><day>.<extension>
  const match_date = /^file\.(\d{4})(\d{2})(\d{2})\.(log(?:\.gz)?)$/;
  const dateMatch = filename.match(match_date);

  const match_current = /current\.(log(?:\.gz)?)$/;
  if (filename.match(match_current) || !dateMatch) {
    return dayjs().startOf("day");
  }

  const [year, month, day] = dateMatch
    .slice(1, 4)
    .map((it) => parseInt(it));

  return dayjs(new Date(year, month - 1, day)).startOf("day");
};

async function* textLines(filepath: string) {
  const reader = readline.createInterface({
    input: fs.createReadStream(filepath)
  })

  let index = 0
  for await (const content of reader) {
    yield { line: index++, content }
  }
}

async function* gzTextLines(filepath: string) {
  const reader = readline.createInterface({
    input: fs.createReadStream(filepath).pipe(zlib.createGunzip())
  })

  let index = 0
  for await (const content of reader) {
    yield { line: index++, content }
  }
}

async function* logLines(filepath: string) {
  const pathParts = filepath.split(".")
  const extension = pathParts[pathParts.length - 1]

  switch (extension) {
    case "log":
      yield* textLines(filepath)
      break
    case "gz":
      yield* gzTextLines(filepath)
      break
    default:
      throw `I don't know what ${filepath} is!`
  }
}

const collectLogFiles = (ctx: Context): { filepath: string, date: Dayjs }[] =>
  fs.readdirSync(ctx.logfileRoot)
    .map((basename) => ({ filepath: path.join(ctx.logfileRoot, basename), date: filenameDate(basename) }))
    .filter(file => file.date >= dayjs().subtract(ctx.logDaysAgo, "day"))
    .filter(file => fs.existsSync(file.filepath))


export async function* iterLogs(ctx: Context): AsyncGenerator<LogLine> {
  for (const { filepath } of collectLogFiles(ctx)) {
    for await (const { line, content } of logLines(filepath)) {
      yield { line, content }
    }
  }
}
