#!/usr/bin/env node
// Database tests, on the local test cluster only.
//
//   npm run test:db                                  every test in e2e/sql/tests
//   node e2e/db-test.mjs --test community_journal    one test
//   node e2e/db-test.mjs --pending <file>.sql --test <name>
//                                                    a migration not yet in supabase/migrations
//
// Builds the same template the e2e specs use (supabase/migrations + the legacy
// seed — the real migration history), optionally applies a pending migration
// on top as one transaction, then runs e2e/sql/tests/<test>.sql, whose t.ok /
// t.fails assertions print PASS / FAIL.
//
// Rollback: if supabase/migrations_pending holds a `<version>_<test>.down.sql`,
// it is run afterwards (it must refuse while past journal entries exist, then
// succeed), followed by e2e/sql/tests/<test>.down.sql. `--down <file>` names
// one explicitly; `--no-down` skips it.
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

import { DB, E2E, PORTS, ROOT } from './lib/config.mjs'
import { buildTemplate, pgBin, resetDatabase, startPostgres, stopPostgres } from './lib/db.mjs'

const { values } = parseArgs({
  options: { pending: { type: 'string' }, test: { type: 'string' }, down: { type: 'string' }, 'no-down': { type: 'boolean' } },
})

const TESTS = join(E2E, 'sql/tests')
const PENDING = join(ROOT, 'supabase/migrations_pending')
const env = { ...process.env, LC_ALL: 'C' }

function run(file, { single = true } = {}) {
  const args = ['-h', '127.0.0.1', '-p', String(PORTS.postgres), '-U', 'postgres', '-d', DB.test, '-v', 'ON_ERROR_STOP=1', '-X', '-q']
  const result = spawnSync(pgBin('psql'), [...args, ...(single ? ['--single-transaction'] : []), '-f', file], { encoding: 'utf8', env })
  const lines = `${result.stdout}\n${result.stderr}`.split('\n').filter((l) => /PASS|FAIL|ERROR/.test(l))
  return { ok: result.status === 0, lines: lines.map((l) => l.replace(/^psql:[^ ]+ (NOTICE|ERROR):\s+/, '')) }
}

const failedIn = (result) => !result.ok || result.lines.some((l) => l.includes('FAIL') || l.includes('ERROR'))
const print = (result) => result.lines.length && console.log(result.lines.map((l) => `  ${l}`).join('\n'))

/** The down-migration paired with a test, if one is kept in migrations_pending. */
function downFor(test) {
  if (values['no-down']) return null
  if (values.down) return values.down
  return readdirSync(PENDING).find((f) => f.endsWith(`_${test}.down.sql`)) ?? null
}

const tests = values.test
  ? [values.test]
  : readdirSync(TESTS).filter((f) => f.endsWith('.sql') && !f.startsWith('_') && !f.endsWith('.down.sql')).map((f) => f.replace(/\.sql$/, '')).sort()

startPostgres()
let failed = false
let passes = 0
try {
  buildTemplate()
  for (const test of tests) {
    console.log(`\n${test}`)
    resetDatabase()
    if (values.pending) {
      const applied = run(join(PENDING, values.pending))
      console.log(`${applied.ok ? '✔' : '✖'} applied pending ${values.pending}`)
      if (!applied.ok) {
        print(applied)
        failed = true
        continue
      }
    }
    run(join(TESTS, '_helpers.sql'), { single: false })
    const result = run(join(TESTS, `${test}.sql`), { single: false })
    print(result)
    passes += result.lines.filter((l) => l.includes('PASS')).length
    failed ||= failedIn(result)

    const down = downFor(test)
    if (!down) continue
    const file = join(PENDING, down)
    // With past journal entries present the down-migration must refuse (and change nothing).
    const refused = run(file)
    const guarded = !refused.ok && refused.lines.some((l) => l.includes('past journal entries exist'))
    console.log(`  ${guarded ? 'PASS' : 'FAIL'}: down refuses while past journal entries exist`)
    passes += guarded ? 1 : 0
    failed ||= !guarded
    spawnSync(pgBin('psql'), ['-h', '127.0.0.1', '-p', String(PORTS.postgres), '-U', 'postgres', '-d', DB.test, '-c', "delete from memories where kind = 'past'"], { env })
    const rolledBack = run(file)
    console.log(`${rolledBack.ok ? '✔' : '✖'} down ${down}`)
    if (!rolledBack.ok) print(rolledBack)
    const after = run(join(TESTS, `${test}.down.sql`), { single: false })
    print(after)
    passes += after.lines.filter((l) => l.includes('PASS')).length
    failed ||= !rolledBack.ok || failedIn(after)
  }
} finally {
  stopPostgres()
}
console.log(failed ? `\nFAILED (${passes} passed)` : `\nall passed (${passes})`)
process.exit(failed ? 1 : 0)
