// Once per run: the local database template, the app built against the local
// gateway, and a static server for it (with the SPA fallback Vite preview has).
import { execFileSync } from 'node:child_process'
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import http from 'node:http'
import { extname, join, normalize } from 'node:path'

import { CACHE, GATEWAY_URL, PORTS, ROOT } from './config.mjs'
import { buildTemplate, startPostgres } from './db.mjs'
import { anonKey } from './gateway.mjs'
import { ensurePostgrest } from './stack.mjs'

/**
 * Build the app for tests. The production URL and key in .env are overridden
 * (Vite gives existing environment variables precedence), and the output is
 * refused if it still mentions the linked production project anywhere.
 */
export function buildApp(outDir = join(CACHE, 'app'), sourceDir = ROOT) {
  execFileSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'warn'], {
    cwd: sourceDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_SUPABASE_URL: GATEWAY_URL, VITE_SUPABASE_PUBLISHABLE_KEY: anonKey() },
  })
  assertNoProductionProject(outDir)
  return outDir
}

export function assertNoProductionProject(dir) {
  const refFile = join(ROOT, 'supabase/.temp/project-ref')
  const ref = existsSync(refFile) ? readFileSync(refFile, 'utf8').trim() : null
  const files = readdirSync(join(dir, 'assets')).map((f) => join(dir, 'assets', f))
  for (const file of [join(dir, 'index.html'), ...files]) {
    if (ref && readFileSync(file, 'latin1').includes(ref)) {
      throw new Error(`Test build ${file} references the production project — refusing to run`)
    }
  }
  if (!files.some((file) => readFileSync(file, 'latin1').includes(GATEWAY_URL))) {
    throw new Error('Test build does not point at the local gateway — refusing to run')
  }
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' }

/** Serve a built app like Vite preview: files as-is, everything else → index.html. */
export function serveApp(dir) {
  const server = http.createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://app').pathname)).replace(/^(\.\.[/\\])+/, '')
    let file = join(dir, path)
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(dir, 'index.html')
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    createReadStream(file).pipe(res)
  })
  return new Promise((resolve) => server.listen(PORTS.app, '127.0.0.1', () => resolve({
    close: () => new Promise((done) => {
      server.closeAllConnections()
      server.close(done)
    }),
  })))
}

/** Database template + PostgREST binary + app, ready for specs, perf or visual runs. */
export async function prepare({ appDir } = {}) {
  startPostgres()
  const migrations = buildTemplate()
  await ensurePostgrest()
  const dir = appDir ?? buildApp()
  if (appDir) assertNoProductionProject(appDir)
  const server = await serveApp(dir)
  return { migrations, appDir: dir, server }
}
