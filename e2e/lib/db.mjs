// The local test database: a throwaway PostgreSQL cluster under e2e/.cache,
// built from supabase/migrations exactly as production was. Never a remote one.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'

import { CACHE, DB, E2E, PORTS, ROOT } from './config.mjs'

const CLUSTER = join(CACHE, 'pg')
// pg_ctl refuses to start from a multithreaded parent without a valid locale.
const env = { ...process.env, LC_ALL: 'C', LANG: 'C' }

/** PostgreSQL client and server binaries: PG_BIN, else Homebrew's postgresql@17, else PATH. */
export function pgBin(name) {
  for (const dir of [process.env.PG_BIN, '/opt/homebrew/opt/postgresql@17/bin', '/usr/local/opt/postgresql@17/bin']) {
    if (dir && existsSync(join(dir, name))) return join(dir, name)
  }
  return name
}

/** Where libpq lives, for the PostgREST binary on macOS. */
export function libpqDir() {
  const prefix = execFileSync(pgBin('pg_config'), ['--libdir'], { env }).toString().trim()
  for (const dir of [prefix, join(prefix, 'postgresql')]) if (existsSync(join(dir, 'libpq.5.dylib'))) return dir
  return prefix
}

function psqlArgs(db) {
  return ['-h', '127.0.0.1', '-p', String(PORTS.postgres), '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-qtAX']
}

/** Run SQL and return its text output (one row per line, columns joined by |). */
export function sql(query, db = DB.test) {
  return execFileSync(pgBin('psql'), [...psqlArgs(db), '-c', query], { env }).toString().trim()
}

function sqlFile(file, db) {
  const run = spawnSync(pgBin('psql'), [...psqlArgs(db), '--single-transaction', '-f', file], { env, encoding: 'utf8' })
  if (run.status !== 0) throw new Error(`${file}\n${run.stderr}`)
}

function isRunning() {
  return spawnSync(pgBin('pg_ctl'), ['-D', CLUSTER, 'status'], { env }).status === 0
}

export function startPostgres() {
  if (!existsSync(join(CLUSTER, 'PG_VERSION'))) {
    mkdirSync(CACHE, { recursive: true })
    execFileSync(pgBin('initdb'), ['-D', CLUSTER, '-U', 'postgres', '-A', 'trust', '--no-locale', '-E', 'UTF8'], { env, stdio: 'ignore' })
    // TCP only: the socket path under a deep checkout can exceed the OS limit.
    appendFileSync(join(CLUSTER, 'postgresql.conf'), `\nlisten_addresses = '127.0.0.1'\nport = ${PORTS.postgres}\nunix_socket_directories = ''\nfsync = off\n`)
  }
  if (!isRunning()) execFileSync(pgBin('pg_ctl'), ['-D', CLUSTER, '-l', join(CACHE, 'pg.log'), '-w', 'start'], { env, stdio: 'ignore' })
}

export function stopPostgres() {
  if (isRunning()) execFileSync(pgBin('pg_ctl'), ['-D', CLUSTER, '-m', 'fast', '-w', 'stop'], { env, stdio: 'ignore' })
}

/**
 * The template every test starts from: Supabase-shaped roles and schemas,
 * then every migration in supabase/migrations in order — with the legacy
 * seed (touches and a memory from before visits existed) applied at the
 * point in history where that data really existed, so the visits migration
 * transforms it exactly as it transformed production.
 */
export function buildTemplate() {
  sql(`drop database if exists ${DB.test} with (force)`, 'postgres')
  sql(`drop database if exists ${DB.template} with (force)`, 'postgres')
  sql(`create database ${DB.template}`, 'postgres')
  sqlFile(join(E2E, 'sql/stubs.sql'), DB.template)
  const migrations = readdirSync(join(ROOT, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort()
  let seeded = false
  for (const file of migrations) {
    if (!seeded && file >= SEED_BEFORE) {
      sqlFile(join(E2E, 'sql/seed-legacy.sql'), DB.template)
      seeded = true
    }
    sqlFile(join(ROOT, 'supabase/migrations', file), DB.template)
  }
  if (!seeded) sqlFile(join(E2E, 'sql/seed-legacy.sql'), DB.template)
  // E2E_PENDING=<file in supabase/migrations_pending>: test the app against a
  // migration that is not applied anywhere yet (forward compatibility).
  if (process.env.E2E_PENDING) {
    sqlFile(join(ROOT, 'supabase/migrations_pending', process.env.E2E_PENDING), DB.template)
    migrations.push(process.env.E2E_PENDING)
  }
  return migrations
}

/** The legacy seed describes data as it existed before this migration. */
const SEED_BEFORE = '20260929100000'

/** A fresh copy of the template for one test file. */
export function resetDatabase() {
  sql(`drop database if exists ${DB.test} with (force)`, 'postgres')
  sql(`create database ${DB.test} template ${DB.template}`, 'postgres')
}

export function writePostgrestConfig(file, secret) {
  writeFileSync(file, [
    `db-uri = "postgres://authenticator@127.0.0.1:${PORTS.postgres}/${DB.test}"`,
    'db-schemas = "public"',
    'db-anon-role = "anon"',
    `jwt-secret = "${secret}"`,
    'server-host = "127.0.0.1"',
    `server-port = ${PORTS.postgrest}`,
    'db-pool = 4',
  ].join('\n'))
}
