import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Create the connection
const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it's not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });

// Create the Drizzle instance
export const db = drizzle(client, { schema });

export type Database = typeof db;

// Export all tables and schemas for easy import
export * from "./schema";
