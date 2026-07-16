import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { slugify } from "../lib/utils";

async function main() {
  console.log("Adding slug column...");
  await db.execute(sql`ALTER TABLE "flow_sessions" ADD COLUMN IF NOT EXISTS "slug" text;`);

  console.log("Backfilling existing rows...");
  const sessions = await db.execute(sql`SELECT id, topic FROM "flow_sessions" WHERE slug IS NULL;`);
  const rows = sessions.rows ?? [];
  for (const s of rows) {
    const slug = slugify(s.topic) + "-" + Math.random().toString(36).slice(2, 6);
    await db.execute(sql`UPDATE "flow_sessions" SET slug = ${slug} WHERE id = ${s.id};`);
  }
  console.log(`Backfilled ${rows.length} rows`);

  console.log("Applying NOT NULL...");
  await db.execute(sql`ALTER TABLE "flow_sessions" ALTER COLUMN "slug" SET NOT NULL;`);

  console.log("Ensuring unique constraint...");
  try {
    await db.execute(sql`ALTER TABLE "flow_sessions" ADD CONSTRAINT "flow_sessions_slug_unique" UNIQUE("slug");`);
  } catch {
    console.log("Unique constraint already exists, skipping.");
  }

  console.log("Done!");
}

main().catch(console.error);
