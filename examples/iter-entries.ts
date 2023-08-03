import { tmpdir } from "node:os";
import { join, sep } from "node:path"
import { writeFile, mkdtemp } from "node:fs/promises"
import { ctx, iterLogs } from "..";
import { entriesKV } from "../src/entry/entry-kv";

const main = async () => {
  const context = ctx()

  await writeFile(join(context.logsRoot, "current.log"), `\
10-13-2018\t{"ghosts": 10}
10-17-2018\t{"ghosts": 14}
10-20-2018\t{"ghosts": 43}
10-24-2018\t{"ghosts": 81}
10-27-2018\t{"ghosts": 215}
10-31-2018\t{"ghosts": 99999}`)

  for await (const entry of entriesKV("ghost-watch", iterLogs(context), context)) {
    console.log(`spotted ${entry.body.ghosts} ghosts on the ${entry.timestamp.getDate()}th`)
  }
}

main()
