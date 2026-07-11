import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import { createPgPool } from "../src/lib/pgPool.js";

dotenv.config();

type MigrationFile = {
  name: string;
  filePath: string;
  checksum: string;
  sql: string;
};

type DbClient = {
  query: (
    queryText: string,
    values?: unknown[],
  ) => Promise<{ rows: Array<{ name: string; checksum: string }> }>;
  release: () => void;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");
const appliedMigrationsTable = '"_custom_migrations"';
const baselineExistingDb = process.env.BASELINE_EXISTING_DB === "true";

function checksum(contents: string): string {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

async function loadMigrationFiles(): Promise<MigrationFile[]> {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });

  const migrationDirectories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const migrations: MigrationFile[] = [];

  for (const directoryName of migrationDirectories) {
    const filePath = path.join(migrationsDir, directoryName, "migration.sql");
    const sql = await fs.readFile(filePath, "utf8");

    migrations.push({
      name: directoryName,
      filePath,
      checksum: checksum(sql),
      sql,
    });
  }

  return migrations;
}

async function ensureAppliedMigrationsTable(client: DbClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${appliedMigrationsTable} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client: DbClient) {
  const result = await client.query(
    `SELECT name, checksum FROM ${appliedMigrationsTable} ORDER BY id ASC;`,
  );

  return new Map(result.rows.map((row) => [row.name, row.checksum]));
}

async function applyMigration(client: DbClient, migration: MigrationFile) {
  await client.query("BEGIN");

  try {
    await client.query(migration.sql);
    await client.query(
      `INSERT INTO ${appliedMigrationsTable} (name, checksum)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = NOW();`,
      [migration.name, migration.checksum],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function markMigrationApplied(
  client: DbClient,
  migration: MigrationFile,
) {
  await client.query(
    `INSERT INTO ${appliedMigrationsTable} (name, checksum)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = NOW();`,
    [migration.name, migration.checksum],
  );
}

async function main() {
  const pool = createPgPool();
  const client = (await pool.connect()) as DbClient;

  try {
    await ensureAppliedMigrationsTable(client);

    const migrations = await loadMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(client);
    const firstMigration = migrations[0];

    if (
      baselineExistingDb &&
      appliedMigrations.size === 0 &&
      firstMigration
    ) {
      console.log(`Baselining existing database with ${firstMigration.name}`);
      await markMigrationApplied(client, firstMigration);
      appliedMigrations.set(firstMigration.name, firstMigration.checksum);
    }

    for (const migration of migrations) {
      const appliedChecksum = appliedMigrations.get(migration.name);

      if (appliedChecksum) {
        if (appliedChecksum !== migration.checksum) {
          throw new Error(
            `Migration checksum mismatch for ${migration.name}. The database has a different version than ${migration.filePath}.`,
          );
        }

        console.log(`Skipping already applied migration ${migration.name}`);
        continue;
      }

      console.log(`Applying migration ${migration.name}`);
      await applyMigration(client, migration);
    }

    console.log("Database schema sync complete");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
