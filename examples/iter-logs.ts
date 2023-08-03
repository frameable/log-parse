import { tmpdir } from "node:os";
import { join, sep } from "node:path"
import { writeFile, mkdtemp } from "node:fs/promises"
import { ctx, iterLogs } from "..";

const main = async () => {
  const context = ctx({ entryFields: new Set(["log"]), logsRoot: await mkdtemp(join(tmpdir(), "")) })
  writeFile(join(context.logsRoot, "current.log"), `\
some log data
some more log data
whew that's a lot of logs`)

  for await (const log of iterLogs(context)) {
    console.log(`${log.line}: ${log.content}`)
  }
}

main()
