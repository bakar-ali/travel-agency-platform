import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

async function waitForDb(retries = 10) {
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

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("Checking database connection...");
  const ok = await waitForDb();
  if (!ok) {
    console.error("FATAL: Could not connect to database.");
    process.exit(1);
  }

  console.log("Applying database migrations...");
  try {
    run("node node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma");
  } catch {
    console.log("migrate deploy failed, trying db push...");
    run("node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --skip-generate --accept-data-loss");
  }

  const jsonPath = path.join(root, "data", "tours.json");
  if (fs.existsSync(jsonPath)) {
    console.log("Seeding tours...");
    run("node scripts/seed-tours.mjs");
  }

  console.log("Startup tasks complete.");
}

main().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
