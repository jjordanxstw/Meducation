/**
 * Destructive-script guard.
 *
 * Staging and production share one Supabase database, and the root `.env`
 * usually points at it. `db:reset` and the seed scripts must therefore refuse
 * to run against anything that is not a local Postgres (the Supabase CLI stack
 * or a Docker container), no matter which `.env` they picked up.
 */

/** Postgres of the Supabase CLI stack started by `pnpm db:local:start`. */
export const LOCAL_DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

/** `--local` on any db script targets the local stack, ignoring every .env file. */
export function localUrlFromArgs(): string | undefined {
  return process.argv.includes('--local') ? LOCAL_DB_URL : undefined;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal', 'db', 'supabase_db']);

export function databaseHost(dbUrl: string): string {
  try {
    return new URL(dbUrl).hostname;
  } catch {
    return 'unparseable-url';
  }
}

export function isLocalDatabase(dbUrl: string): boolean {
  return LOCAL_HOSTS.has(databaseHost(dbUrl));
}

/**
 * Exits the process unless `dbUrl` targets a local database. A remote target
 * is only accepted when `ALLOW_REMOTE_DB_WRITE` is set to that exact hostname,
 * so a stray `.env` can never wipe production by accident.
 */
export function assertLocalDatabase(dbUrl: string, scriptName: string): void {
  const host = databaseHost(dbUrl);
  if (isLocalDatabase(dbUrl)) return;

  if (process.env.ALLOW_REMOTE_DB_WRITE === host) {
    console.warn(`[${scriptName}] Remote target ${host} explicitly allowed via ALLOW_REMOTE_DB_WRITE.`);
    return;
  }

  console.error(`[${scriptName}] Refusing to run against remote database host "${host}".`);
  console.error('This script is destructive and only runs against a local Postgres (localhost / 127.0.0.1).');
  console.error('Start the local stack with `pnpm db:local:start` and point SUPABASE_DB_URL at it.');
  process.exit(1);
}
