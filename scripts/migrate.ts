/**
 * Direct SQL migration script to add new schema changes
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";

// Manually load .env.local
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const envFile = readFileSync(envPath, "utf-8");

  envFile.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  console.error("❌ Failed to read .env.local:", error);
  process.exit(1);
}

async function migrate() {
  console.log("📦 Running database migration...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found");
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false });

  try {
    console.log("1️⃣  Creating enums...");

    // Create enums if they don't exist
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE experience_level AS ENUM('ENTRY', 'MID', 'SENIOR', 'LEAD', 'STAFF', 'PRINCIPAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE skill_category AS ENUM('LANGUAGE', 'FRAMEWORK', 'DATABASE', 'CLOUD', 'TOOL', 'SOFT_SKILL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("✅ Enums created\n");

    console.log("2️⃣  Adding job_source enum values...");

    // Add new job sources
    const newSources = [
      "REMOTEOK",
      "WEWORKREMOTELY",
      "VUEJOBS",
      "RUANYF_WEEKLY",
      "HIMALAYAS",
      "REMOTIVE",
      "BOSS_ZHIPIN",
      "XIAOHONGSHU",
      "LAGOU",
      "INDEED",
    ];

    for (const source of newSources) {
      try {
        await sql.unsafe(`ALTER TYPE job_source ADD VALUE IF NOT EXISTS '${source}'`);
      } catch (error: any) {
        if (!error.message?.includes("already exists")) {
          console.warn(`   Warning adding ${source}:`, error.message);
        }
      }
    }

    console.log("✅ Job sources updated\n");

    console.log("3️⃣  Creating tables...");

    // Create job_categories table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS job_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        parent_id uuid REFERENCES job_categories(id),
        description text,
        icon text,
        count integer DEFAULT 0 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create skills table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS skills (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL UNIQUE,
        slug text NOT NULL UNIQUE,
        category skill_category,
        count integer DEFAULT 0 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create job_skill_relations table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS job_skill_relations (
        job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        PRIMARY KEY (job_id, skill_id)
      )
    `);

    console.log("✅ Tables created\n");

    console.log("4️⃣  Adding new columns to jobs table...");

    // Add new columns to jobs table
    const newColumns = [
      { name: "category_id", type: "uuid REFERENCES job_categories(id)" },
      { name: "experience_level", type: "experience_level" },
      { name: "timezone", type: "text" },
      { name: "benefits", type: "text[]" },
      { name: "application_deadline", type: "timestamp" },
    ];

    for (const column of newColumns) {
      try {
        await sql.unsafe(`
          ALTER TABLE jobs
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
        console.log(`   ✓ Added ${column.name}`);
      } catch (error: any) {
        if (!error.message?.includes("already exists")) {
          console.warn(`   Warning adding ${column.name}:`, error.message);
        }
      }
    }

    console.log("✅ Columns added\n");

    console.log("5️⃣  Creating indexes...");

    // Create indexes
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS jobs_category_idx ON jobs(category_id)
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS jobs_experience_idx ON jobs(experience_level)
    `);

    console.log("✅ Indexes created\n");

    console.log("🎉 Migration completed successfully!");

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    await sql.end();
    process.exit(1);
  }
}

migrate();
