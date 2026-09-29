// A local stand-in for the Supabase gateway, for tests only. It is never part
// of the app: the app is built unmodified and simply pointed at this URL.
//
//   /rest/v1/*    → the real PostgREST on the local test database, so RLS,
//                   column grants and constraints are the real ones
//   /auth/v1/*    → just enough Auth for the app: password sign-in for the
//                   temporary test users, /user, /settings, /logout
//   /storage/v1/* → an in-memory private bucket that enforces "the first
//                   folder is your user id", like the memory-photos policies
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import http from 'node:http'

import { JWT_SECRET, PASSWORD, PHOTO, PORTS, USERS } from './config.mjs'

const b64 = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')

export function jwt(payload) {
  const head = b64({ alg: 'HS256', typ: 'JWT' })
  const body = b64({ exp: Math.floor(Date.now() / 1000) + 86400, ...payload })
  return `${head}.${body}.${createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url')}`
}

function verify(token) {
  const [head, body, signature] = (token ?? '').split('.')
  if (!signature || createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url') !== signature) return null
  return JSON.parse(Buffer.from(body, 'base64url').toString())
}

const byEmail = Object.fromEntries(Object.values(USERS).map((u) => [u.email, u]))

export function userOf(email) {
  return {
    id: byEmail[email].id, aud: 'authenticated', role: 'authenticated', email,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { password_set: true },
    created_at: '2026-09-01T00:00:00Z',
  }
}

/** A session exactly as supabase-js stores it. */
export function sessionOf(email) {
  const user = userOf(email)
  return {
    access_token: jwt({ sub: user.id, role: 'authenticated', aud: 'authenticated', email }),
    token_type: 'bearer', expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: `refresh-${email}`, user,
  }
}

export const anonKey = () => jwt({ role: 'anon' })

/**
 * The uploaded file's bytes. supabase-js sends a Blob as multipart form data
 * (a `cacheControl` field and the file); Supabase Storage stores just the
 * file, so this does too.
 */
function fileBody(contentType, raw) {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType)
  if (!contentType.startsWith('multipart/form-data') || !boundary) return raw
  const delimiter = Buffer.from(`--${boundary[1] ?? boundary[2]}`)
  let at = raw.indexOf(delimiter)
  while (at !== -1) {
    const next = raw.indexOf(delimiter, at + delimiter.length)
    if (next === -1) break
    const part = raw.subarray(at + delimiter.length + 2, next - 2) // skip CRLF after the delimiter and before the next
    const split = part.indexOf('\r\n\r\n')
    const headers = part.subarray(0, split).toString()
    if (/filename=|content-type:\s*image\//i.test(headers)) return part.subarray(split + 4)
    at = next
  }
  return raw
}

export function startGateway() {
  const files = new Map()
  const photo = readFileSync(PHOTO)

  const read = (req) => new Promise((resolve) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
  })
  const send = (res, status, data, type = 'application/json') => {
    res.writeHead(status, { 'content-type': type })
    res.end(type === 'application/json' ? JSON.stringify(data) : data)
  }
  const claimsOf = (req) => verify((req.headers.authorization ?? '').replace(/^Bearer /, ''))

  const server = http.createServer(async (req, res) => {
    res.setHeader('access-control-allow-origin', req.headers.origin ?? '*')
    res.setHeader('access-control-allow-credentials', 'true')
    res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers'] ?? '*')
    res.setHeader('access-control-allow-methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD')
    res.setHeader('access-control-expose-headers', 'content-range,content-profile,preference-applied')
    if (req.method === 'OPTIONS') return res.writeHead(204).end()
    const url = new URL(req.url, 'http://gateway')
    const raw = await read(req)

    if (url.pathname.startsWith('/rest/v1/')) {
      const headers = {}
      for (const name of ['authorization', 'prefer', 'content-type', 'accept', 'range', 'accept-profile', 'content-profile']) {
        if (req.headers[name]) headers[name] = req.headers[name]
      }
      if (!headers.authorization) headers.authorization = `Bearer ${anonKey()}`
      const upstream = await fetch(`http://127.0.0.1:${PORTS.postgrest}${url.pathname.slice('/rest/v1'.length)}${url.search}`, {
        method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : raw,
      })
      const pass = {}
      for (const name of ['content-type', 'content-range', 'preference-applied']) {
        const value = upstream.headers.get(name)
        if (value) pass[name] = value
      }
      res.writeHead(upstream.status, pass)
      return res.end(Buffer.from(await upstream.arrayBuffer()))
    }

    if (url.pathname === '/auth/v1/settings') return send(res, 200, { external: { email: true, phone: false } })
    if (url.pathname === '/auth/v1/token') {
      const input = JSON.parse(raw.toString() || '{}')
      const grant = url.searchParams.get('grant_type')
      if (grant === 'password' && byEmail[input.email] && input.password === PASSWORD) return send(res, 200, sessionOf(input.email))
      if (grant === 'refresh_token') {
        const email = String(input.refresh_token ?? '').replace(/^refresh-/, '')
        if (byEmail[email]) return send(res, 200, sessionOf(email))
      }
      return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', code: 'invalid_credentials' })
    }
    if (url.pathname === '/auth/v1/user') {
      const claims = claimsOf(req)
      const user = claims && Object.values(USERS).find((u) => u.id === claims.sub)
      return user ? send(res, 200, userOf(user.email)) : send(res, 401, { message: 'invalid JWT' })
    }
    if (url.pathname === '/auth/v1/logout') return res.writeHead(204).end()

    const storage = url.pathname.match(/^\/storage\/v1\/object\/(sign\/)?memory-photos\/?(.*)$/)
    if (storage) {
      const [, signed, rest] = storage
      const path = decodeURIComponent(rest)
      if (signed && req.method === 'GET') {
        // Objects the seed refers to (legacy photos) are served as the fixture photo.
        const bytes = files.get(path) ?? (path.endsWith('/legacy.jpg') ? photo : null)
        return bytes ? send(res, 200, bytes, 'image/jpeg') : send(res, 404, { message: 'not found' })
      }
      const claims = claimsOf(req)
      if (!claims?.sub) return send(res, 401, { message: 'unauthorized' })
      const own = (p) => p.split('/')[0] === claims.sub
      if (signed && req.method === 'POST') {
        const { paths } = JSON.parse(raw.toString())
        return send(res, 200, paths.map((p) => (own(p)
          ? { path: p, signedURL: `/object/sign/memory-photos/${p}?token=e2e`, error: null }
          : { path: p, signedURL: null, error: 'Either the object does not exist or you do not have access to it' })))
      }
      if (req.method === 'POST' && path) {
        if (!own(path)) return send(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' })
        if (files.has(path)) return send(res, 409, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' })
        files.set(path, fileBody(req.headers['content-type'] ?? '', raw))
        return send(res, 200, { Key: `memory-photos/${path}`, Id: path })
      }
      if (req.method === 'DELETE') {
        const { prefixes } = JSON.parse(raw.toString())
        return send(res, 200, prefixes.filter((p) => own(p) && files.delete(p)).map((name) => ({ name })))
      }
    }
    send(res, 404, { message: `no e2e route for ${req.method} ${url.pathname}` })
  })

  return new Promise((resolve) => server.listen(PORTS.gateway, '127.0.0.1', () => resolve({
    close: () => new Promise((done) => {
      server.closeAllConnections()
      server.close(done)
    }),
    storedPaths: () => [...files.keys()],
  })))
}
