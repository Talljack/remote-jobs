import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

import * as schema from "./schema";

// Initialize Drizzle ORM with Vercel Postgres
// @vercel/postgres will automatically use DATABASE_URL or POSTGRES_URL
// Set DATABASE_URL in your environment
if (process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

export const db = drizzle(sql, { schema });

// Export schema for use in queries
export * from "./schema";
