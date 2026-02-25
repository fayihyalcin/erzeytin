const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) {
    return {};
  }

  const env = {};
  const lines = fs.readFileSync(filepath, 'utf8').split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex < 0) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function buildDbConfig() {
  const envFromFile = loadEnvFile(path.resolve(process.cwd(), '.env'));
  const env = { ...envFromFile, ...process.env };
  const port = Number(env.DB_PORT ?? '5432');

  if (Number.isNaN(port)) {
    throw new Error(`DB_PORT is not a valid number: ${env.DB_PORT}`);
  }

  return {
    host: env.DB_HOST ?? 'localhost',
    port,
    user: env.DB_USER ?? 'postgres',
    password: env.DB_PASSWORD || undefined,
    database: env.DB_NAME ?? 'zeytin_admin',
    ssl: (env.DB_SSL ?? 'false').toLowerCase() === 'true',
  };
}

function readJournalEntries(migrationsRoot) {
  const journalPath = path.join(migrationsRoot, 'meta', '_journal.json');
  const journalRaw = fs.readFileSync(journalPath, 'utf8');
  const journal = JSON.parse(journalRaw);
  return [...journal.entries].sort((a, b) => a.idx - b.idx);
}

function computeHash(contentBuffer) {
  return crypto.createHash('sha256').update(contentBuffer).digest('hex');
}

async function ensureMigrationsTable(client) {
  await client.query('CREATE SCHEMA IF NOT EXISTS drizzle');
  await client.query(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);
}

async function markMigrationApplied(client, hash, createdAt) {
  const existing = await client.query(
    'SELECT id FROM drizzle.__drizzle_migrations WHERE hash = $1 LIMIT 1',
    [hash],
  );

  if (existing.rows.length > 0) {
    return false;
  }

  await client.query(
    'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
    [hash, String(createdAt)],
  );
  return true;
}

async function main() {
  const migrationsRoot = path.resolve(process.cwd(), 'drizzle', 'migrations');
  const entries = readJournalEntries(migrationsRoot);
  const dbConfig = buildDbConfig();
  const client = new Client(dbConfig);

  await client.connect();
  await ensureMigrationsTable(client);

  let insertedCount = 0;

  for (const entry of entries) {
    const sqlPath = path.join(migrationsRoot, `${entry.tag}.sql`);
    const sqlBuffer = fs.readFileSync(sqlPath);
    const hash = computeHash(sqlBuffer);
    const createdAt = entry.when ?? Date.now();
    const inserted = await markMigrationApplied(client, hash, createdAt);

    if (inserted) {
      insertedCount += 1;
      console.log(`marked as applied: ${entry.tag}`);
    } else {
      console.log(`already applied: ${entry.tag}`);
    }
  }

  await client.end();
  console.log(`baseline complete, inserted: ${insertedCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
