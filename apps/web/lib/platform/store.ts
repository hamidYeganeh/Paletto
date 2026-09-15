import { MongoClient } from "mongodb"
import { mkdir, readFile, writeFile, rename } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import type { State } from "@/features/platform/types"
import { seed } from "./seed"

const empty = (): State => ({
  memberships: [],
  users: [],
  galleries: [],
  events: [],
  artworks: [],
  orders: [],
  campaigns: [],
  requests: [],
  sessions: [],
  saves: [],
  visits: [],
  audit: [],
})
const globalStore = globalThis as typeof globalThis & {
  palettoQueue?: Promise<unknown>
  palettoMongo?: Promise<MongoClient>
}
const file = resolve(process.env.PALETTO_DATA_FILE || ".data/paletto.json")
export async function transaction<T>(
  fn: (state: State) => T | Promise<T>
): Promise<T> {
  if (process.env.MONGODB_URI) {
    globalStore.palettoMongo ??= new MongoClient(
      process.env.MONGODB_URI
    ).connect()
    const client = await globalStore.palettoMongo
    const db = client.db(process.env.MONGODB_DB || "paletto")
    const revision = db.collection<{ _id: string; version: number }>(
      "_revision"
    )
    await revision.updateOne(
      { _id: "main" },
      { $setOnInsert: { version: 0 } },
      { upsert: true }
    )
    const session = client.startSession()
    try {
      return (await session.withTransaction(
        async () => {
          // Serializes invariant-changing transactions across application instances.
          // Mongo retries a conflicting snapshot; no external side effects belong in fn.
          await revision.updateOne(
            { _id: "main" },
            { $inc: { version: 1 } },
            { session }
          )
          const state = empty()
          const keys = Object.keys(state) as (keyof State)[]
          const snapshots = new Map<string, Map<string, string>>()
          const recordKey = (name: string, record: unknown, i: number) => {
            const value = record as Record<string, unknown>
            return String(
              value.id ||
                (name === "sessions"
                  ? value.hash
                  : name === "saves"
                    ? `${value.userId}:${value.targetId}:${value.kind}`
                    : name === "visits"
                      ? `${value.campaignId}:${value.visitorHash}:${value.day}`
                      : i)
            )
          }
          for (const name of keys) {
            const rows = await db
              .collection<{ _id: string; value: unknown }>(name)
              .find({}, { session })
              .toArray()
            ;(state[name] as unknown[]) = rows.map((row) => row.value)
            snapshots.set(
              name,
              new Map(rows.map((row) => [row._id, JSON.stringify(row.value)]))
            )
          }
          state.memberships ??= []
          const result = await fn(state)
          for (const name of keys) {
            const previous = snapshots.get(name)!
            const current = new Map(
              (state[name] as unknown[]).map((value, i) => [
                recordKey(name, value, i),
                value,
              ])
            )
            const collection = db.collection<{ _id: string; value: unknown }>(
              name
            )
            for (const [key, value] of current) {
              if (previous.get(key) !== JSON.stringify(value))
                await collection.replaceOne(
                  { _id: key },
                  { value },
                  { session, upsert: true }
                )
            }
            const removed = [...previous.keys()].filter(
              (key) => !current.has(key)
            )
            if (removed.length)
              await collection.deleteMany(
                { _id: { $in: removed } },
                { session }
              )
          }
          return result
        },
        {
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          maxCommitTimeMS: 15000,
        }
      )) as T
    } finally {
      await session.endSession()
    }
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.PALETTO_ALLOW_LOCAL_STORE !== "true"
  )
    throw new Error("MONGODB_URI is required in production")
  const run = async () => {
    let state: State
    try {
      state = JSON.parse(await readFile(file, "utf8"))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
      state = process.env.PALETTO_DEMO === "true" ? seed() : empty()
    }
    state.memberships ??= []
    const result = await fn(state)
    await mkdir(dirname(file), { recursive: true })
    const temp = `${file}.${randomUUID()}.tmp`
    await writeFile(temp, JSON.stringify(state), { mode: 0o600 })
    await rename(temp, file)
    return result
  }
  const next = (globalStore.palettoQueue || Promise.resolve()).then(run, run)
  globalStore.palettoQueue = next.catch(() => undefined)
  return next
}

export async function closeStore() {
  if (globalStore.palettoMongo) {
    await (await globalStore.palettoMongo).close()
    delete globalStore.palettoMongo
  }
}
