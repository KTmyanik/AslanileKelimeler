import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const STASH_TTL_MS = 5 * 60 * 1000
const STASH_MAX_BYTES = 20_000_000

/** Holds a one-time copy of the localhost:5173 browser store so it can be written into localhost:5199. */
function migrateStash(): Plugin {
  const stash = new Map<string, string>()

  const allow = (res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
  }

  const isLocal = (req: IncomingMessage) => {
    const address = req.socket.remoteAddress ?? ''
    return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
  }

  return {
    name: 'migrate-stash',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/migrate-stash')) return next()
        if (!isLocal(req)) {
          res.statusCode = 403
          res.end()
          return
        }
        allow(res)
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method === 'POST') {
          const chunks: Buffer[] = []
          let size = 0
          req.on('data', (chunk: Buffer) => {
            size += chunk.length
            if (size > STASH_MAX_BYTES) {
              res.statusCode = 413
              res.end()
              req.destroy()
              return
            }
            chunks.push(chunk)
          })
          req.on('end', () => {
            if (res.writableEnded) return
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { raw?: unknown }
              if (typeof body.raw !== 'string') throw new Error('raw')
              const token = randomBytes(16).toString('hex')
              stash.set(token, body.raw)
              setTimeout(() => stash.delete(token), STASH_TTL_MS).unref()
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ token }))
            } catch {
              res.statusCode = 400
              res.end('{}')
            }
          })
          return
        }
        if (req.method === 'GET') {
          const token = new URL(url, 'http://localhost').searchParams.get('token') ?? ''
          const raw = stash.get(token)
          if (!raw) {
            res.statusCode = 404
            res.end('{}')
            return
          }
          stash.delete(token)
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ raw }))
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), migrateStash()],
  server: { host: true, port: 5199, strictPort: true },
  preview: { host: true, port: 5199, strictPort: true },
})
