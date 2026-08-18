import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function ensureDatabaseUrl() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    console.error("FATAL: DATABASE_URL is not set in Dokploy environment.");
    return null;
  }
  if (!url.includes("sslmode=")) {
    url += url.includes("?") ? "&sslmode=disable" : "?sslmode=disable";
    process.env.DATABASE_URL = url;
    console.log("Added sslmode=disable to DATABASE_URL");
  }
  return url;
}

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

function runSafe(cmd) {
  try {
    run(cmd);
    return true;
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    return false;
  }
}

async function waitForDb(retries = 15) {
  const prisma = new PrismaClient();
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect();
      await prisma.$disconnect();
      console.log("Database connection OK.");
      return true;
    } catch (err) {
      console.error(`DB connect attempt ${i}/${retries} failed:`, err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return false;
}

async function applySqlMigration() {
  const sqlPath = path.join(
    root,
    "prisma/migrations/20250818100000_init/migration.sql"
  );
  if (!fs.existsSync(sqlPath)) {
    console.error("Migration SQL file not found.");
    return false;
  }

  const sql = fs.readFileSync(sqlPath, "utf-8").replace(/^\uFEFF/, "");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  const prisma = new PrismaClient();
  try {
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(`${statement};`);
      } catch (err) {
        const msg = err.message || String(err);
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate key") ||
          msg.includes("42P07") ||
          msg.includes("42710")
        ) {
          continue;
        }
        throw err;
      }
    }
    console.log("SQL migration applied.");
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

async function applySchema() {
  if (
    runSafe(
      "node node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma"
    )
  ) {
    return true;
  }

  console.log("migrate deploy failed, trying db push...");
  if (
    runSafe(
      "node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --skip-generate --accept-data-loss"
    )
  ) {
    return true;
  }

  console.log("db push failed, trying raw SQL migration...");
  try {
    return await applySqlMigration();
  } catch (err) {
    console.error("Raw SQL migration failed:", err.message);
    return false;
  }
}

async function main() {
  if (!ensureDatabaseUrl()) {
    process.exit(1);
  }

  console.log("Checking database connection...");
  const connected = await waitForDb();
  if (!connected) {
    console.error(
      "WARNING: Could not connect to database. App will start but tours won't load."
    );
    console.error(
      "Check DATABASE_URL in Dokploy points to your PostgreSQL server."
    );
    return;
  }

  const schemaOk = await applySchema();
  if (!schemaOk) {
    console.error("WARNING: Could not apply database schema.");
  }

  const jsonPath = path.join(root, "data", "tours.json");
  if (fs.existsSync(jsonPath)) {
    console.log("Seeding tours...");
    runSafe("node scripts/seed-tours.mjs");
  }

  console.log("Startup tasks complete.");
}

main().catch((err) => {
  console.error("Startup error (continuing anyway):", err.message);
});
