import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import type { Connect, Plugin } from 'vite'

const MAX_BYTES = 20_000_000
const KEEP_BACKUPS = 14

interface Saved {
  rev: number
  savedAt: string
  state: unknown
}

/**
 * Keeps the child's progress in a file on this computer, so it survives browser data loss
 * and every device on the home network sees the same progress.
 *
 *   GET /api/state  → { rev, savedAt, state }   (rev 0 and state null when nothing is saved yet)
 *   PUT /api/state  { baseRev, state }  → { rev }, or 409 with the newer saved copy
 */
export function progressFile(dir: string): Plugin {
  const file = join(dir, 'ilerleme.json')
  const backups = join(dir, 'yedek')
  let current: Saved | null = null

  const load = (): Saved => {
    if (current) return current
    try {
      current = JSON.parse(readFileSync(file, 'utf8')) as Saved
    } catch {
      current = { rev: 0, savedAt: '', state: null }
    }
    return current
  }

  /** One copy per day, taken before the first save of that day. */
  const backupToday = () => {
    if (!existsSync(file)) return
    mkdirSync(backups, { recursive: true })
    const today = new Date().toLocaleDateString('sv-SE')
    const target = join(backups, `ilerleme-${today}.json`)
    if (existsSync(target)) return
    copyFileSync(file, target)
    const old = readdirSync(backups)
      .filter((f) => /^ilerleme-\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .slice(0, -KEEP_BACKUPS)
    for (const f of old) rmSync(join(backups, f), { force: true })
  }

  const save = (next: Saved) => {
    mkdirSync(dir, { recursive: true })
    backupToday()
    const text = JSON.stringify(next)
    const tmp = `${file}.tmp`
    writeFileSync(tmp, text)
    try {
      renameSync(tmp, file)
    } catch {
      // Windows can refuse the rename while another program (e.g. antivirus) has the file open.
      writeFileSync(file, text)
      rmSync(tmp, { force: true })
    }
    current = next
  }

  const send = (res: ServerResponse, status: number, body: unknown) => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json')
    res.setHeader('cache-control', 'no-store')
    res.end(JSON.stringify(body))
  }

  const handle: Connect.NextHandleFunction = (req: IncomingMessage, res: ServerResponse, next) => {
    if ((req.url ?? '').split('?')[0] !== '/api/state') return next()
    if (req.method === 'GET') return send(res, 200, load())
    if (req.method !== 'PUT') return send(res, 405, {})

    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BYTES) {
        send(res, 413, {})
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (res.writableEnded) return
      let body: { baseRev?: unknown; state?: { words?: unknown } }
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        return send(res, 400, {})
      }
      if (typeof body.baseRev !== 'number' || !Array.isArray(body.state?.words)) return send(res, 400, {})
      const saved = load()
      if (body.baseRev !== saved.rev) return send(res, 409, saved)
      try {
        save({ rev: saved.rev + 1, savedAt: new Date().toISOString(), state: body.state })
      } catch (err) {
        console.error('[ilerleme] kaydedilemedi:', err)
        return send(res, 500, {})
      }
      send(res, 200, { rev: saved.rev + 1 })
    })
  }

  return {
    name: 'progress-file',
    configureServer: (server) => void server.middlewares.use(handle),
    configurePreviewServer: (server) => void server.middlewares.use(handle),
  }
}
