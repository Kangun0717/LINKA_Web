// The pieces a test file runs against, all local:
//   PostgREST (pinned release, downloaded once into e2e/.cache) on a fresh
//   copy of the test database, and the gateway in front of it. The app itself
//   is built and served once per run by e2e/run.mjs.
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { arch, platform } from 'node:os'
import { join } from 'node:path'

import { CACHE, JWT_SECRET, PORTS, POSTGREST_VERSION } from './config.mjs'
import { libpqDir, resetDatabase, writePostgrestConfig } from './db.mjs'
import { startGateway } from './gateway.mjs'

/** Published digests of the PostgREST release assets; a download that does not match is refused. */
const POSTGREST_ASSETS = {
  'darwin-arm64': ['macos-aarch64', '5720fbde4a19ade9fb189791615c84beb9f0e58201b1b6d17fe3b698faf60776'],
  'darwin-x64': ['macos-x86-64', '9c50547cddf94ede6abf42dacc586caa18e17db4557aee386c6e45e6806aaed2'],
  'linux-x64': ['linux-static-x86-64', 'b47ecc82fce1dcebbbc4183d839e52f07f7630c9d7ad0f54db753d1939299354'],
  'linux-arm64': ['linux-static-aarch64', 'bf544f94f305a1ff37d82f5ef1298d584f1f98b51dfd8182d1437a02073d8731'],
}

export async function ensurePostgrest() {
  const bin = join(CACHE, 'bin', `postgrest-${POSTGREST_VERSION}`)
  if (existsSync(bin)) return bin
  const asset = POSTGREST_ASSETS[`${platform()}-${arch()}`]
  if (!asset) throw new Error(`No PostgREST ${POSTGREST_VERSION} build for ${platform()}-${arch()}`)
  const [name, digest] = asset
  const url = `https://github.com/PostgREST/postgrest/releases/download/${POSTGREST_VERSION}/postgrest-${POSTGREST_VERSION}-${name}.tar.xz`
  const bytes = Buffer.from(await (await fetch(url)).arrayBuffer())
  const actual = createHash('sha256').update(bytes).digest('hex')
  if (actual !== digest) throw new Error(`PostgREST download digest mismatch (${actual})`)
  mkdirSync(join(CACHE, 'bin'), { recursive: true })
  const archive = join(CACHE, 'bin', 'postgrest.tar.xz')
  writeFileSync(archive, bytes)
  execFileSync('tar', ['-xJf', archive, '-C', join(CACHE, 'bin')])
  execFileSync('mv', [join(CACHE, 'bin', 'postgrest'), bin])
  return bin
}

async function waitFor(url, tries = 100) {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`${url} did not come up`)
}

/** Fresh database, PostgREST and gateway for one test file. */
export async function startStack() {
  resetDatabase()
  const config = join(CACHE, 'postgrest.conf')
  writePostgrestConfig(config, JWT_SECRET)
  const bin = await ensurePostgrest()
  const postgrest = spawn(bin, [config], {
    env: { ...process.env, DYLD_FALLBACK_LIBRARY_PATH: libpqDir() },
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  let postgrestLog = ''
  postgrest.stderr.on('data', (chunk) => (postgrestLog += chunk))
  await waitFor(`http://127.0.0.1:${PORTS.postgrest}/`)
  const gateway = await startGateway()
  return {
    storedPaths: gateway.storedPaths,
    postgrestLog: () => postgrestLog,
    async stop() {
      await gateway.close()
      postgrest.kill()
      await new Promise((resolve) => (postgrest.exitCode !== null ? resolve() : postgrest.once('exit', resolve)))
    },
  }
}

export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
