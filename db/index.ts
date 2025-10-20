import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

import * as schema from "./schema";

// Initialize Drizzle ORM with Vercel Postgres
export const db = drizzle(sql, { schema });

// Export schema for use in queries
export * from "./schema";
