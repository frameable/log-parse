import { tmpdir } from "node:os";
import { join, sep } from "node:path"
import { writeFile, mkdtemp } from "node:fs/promises"
import { ctx, iterLogs } from "..";

const main = async () => {
  const context = ctx()

  await writeFile(join(context.logRoot, "current.log"), `\
some log data
some more log data
whew that's a lot of logs`)

  for await (const log of iterLogs(context)) {
    console.log(`${log.line}: ${log.content}`)
  }
}

main()
