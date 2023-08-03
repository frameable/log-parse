import { ctx } from ".."
import { makeDatabase, insert } from "./insert"

describe("insertion func", () => {
  test("insertion", () => {
    const entries = [
      { identifier: 0, timestamp: new Date(), body: { foo: "bard" } },
      { identifier: 1, timestamp: new Date(), body: { foo: "bread" } },
    ]

    const context = ctx({ entryFields: new Set(["foo"]) })
    const database = makeDatabase(":memory:", context)

    insert(entries, database, context)

    const { foo } = database.prepare(`SELECT foo FROM ${context.sqliteTable} WHERE identifier=1`).get() as { foo: string }
    expect(foo).toStrictEqual(entries[1].body.foo)
  })

  // test("insertion update", () => {
  //   const insert = { fields: ["identifier", "whatever"], values: [["0", "okay"], ["1", "you want"]] }
  //   const database = makeDatabase(":memory:", new Set(insert.fields))

  //   insert(insert, database)
  //   expect(database.prepare(`SELECT COUNT(*) AS records FROM ${value.DB_TABLE_NAME}`)
  //     .get().records).toStrictEqual(2)

  //   insert({ ...insert, values: [["2", "more stuff"], ["3", "oh wowo omgg  !!! !!"]] }, database)
  //   expect(database.prepare(`SELECT COUNT(*) AS records FROM ${value.DB_TABLE_NAME}`)
  //     .get().records).toStrictEqual(4)
  // })
})
