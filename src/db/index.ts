import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & { trueapplyDb?: Database };

export function getDb(): Database {
  if (globalForDb.trueapplyDb) return globalForDb.trueapplyDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }

  const db = drizzle(neon(connectionString), { schema });
  if (process.env.NODE_ENV !== "production") globalForDb.trueapplyDb = db;
  return db;
}
