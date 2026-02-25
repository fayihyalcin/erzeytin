import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'drizzle-kit';

function loadEnvFile(filepath: string) {
  if (!existsSync(filepath)) {
    return {};
  }

  const content = readFileSync(filepath, 'utf8');
  const env: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
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

const envFromFile = loadEnvFile(resolve(process.cwd(), '.env'));
const env = { ...envFromFile, ...process.env };
const dbPort = Number(env.DB_PORT ?? '5432');

if (Number.isNaN(dbPort)) {
  throw new Error(`DB_PORT is not a valid number: ${env.DB_PORT}`);
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    host: env.DB_HOST ?? 'localhost',
    port: dbPort,
    user: env.DB_USER ?? 'postgres',
    password: env.DB_PASSWORD && env.DB_PASSWORD.length > 0 ? env.DB_PASSWORD : undefined,
    database: env.DB_NAME ?? 'zeytin_admin',
    ssl: (env.DB_SSL ?? 'false').toLowerCase() === 'true',
  },
  strict: true,
  verbose: true,
});
