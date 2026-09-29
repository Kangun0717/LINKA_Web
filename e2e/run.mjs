#!/usr/bin/env node
// End-to-end tests against a local stack only (see e2e/README.md).
//
//   npm run test:e2e                      Chrome, then WebKit (iPhone 13 profile)
//   npm run test:e2e -- --browser webkit  one browser
//   npm run test:e2e -- --app-dir <dist>  test an already-built app (built against the local gateway)
import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

import { E2E } from './lib/config.mjs'
import { stopPostgres } from './lib/db.mjs'
import { prepare } from './lib/prepare.mjs'

const { values } = parseArgs({ options: { browser: { type: 'string', default: 'all' }, 'app-dir': { type: 'string' }, only: { type: 'string' } } })
const browsers = values.browser === 'all' ? ['chrome', 'webkit'] : [values.browser]

const { server } = await prepare({ appDir: values['app-dir'] })
const specs = readdirSync(join(E2E, 'specs'))
  .filter((f) => f.endsWith('.test.mjs') && (!values.only || f.includes(values.only)))
  .map((f) => join(E2E, 'specs', f))

let failed = false
try {
  for (const browser of browsers) {
    console.log(`\n━━━ ${browser === 'webkit' ? 'WebKit · iPhone 13 profile' : 'Chrome · phone width'} ━━━`)
    // One file at a time: every file gets its own fresh database on the same ports.
    // Spawned asynchronously: this process serves the app, so it must keep running.
    const run = spawn(process.execPath, ['--test', '--test-concurrency=1', '--test-timeout=120000', '--test-reporter=spec', ...specs], {
      stdio: 'inherit',
      env: { ...process.env, E2E_BROWSER: browser },
    })
    const status = await new Promise((resolve) => run.once('exit', resolve))
    if (status !== 0) failed = true
  }
} finally {
  await server.close()
  stopPostgres()
}
process.exit(failed ? 1 : 0)
