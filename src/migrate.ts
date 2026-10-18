const KEY = 'aslan-kelime-v1'
const DONE = 'aslan-kelime-port-ok'

interface PersistFile {
  state: {
    words: { en?: string }[]
  }
  version?: number
}

export function portMovePending(): boolean {
  return localStorage.getItem(DONE) !== '1'
}

export function markPortMoveDone(): void {
  localStorage.setItem(DONE, '1')
}

function parsePersist(raw: string | null): PersistFile | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as PersistFile
    if (!Array.isArray(data?.state?.words)) return null
    return data
  } catch {
    return null
  }
}

function norm(en: string | undefined): string {
  return (en ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

/** Old port is the source of truth. Words added only on 5199 are kept. */
export function mergePersist(currentRaw: string | null, oldRaw: string): string | null {
  const oldData = parsePersist(oldRaw)
  if (!oldData || oldData.state.words.length === 0) return null
  const current = parsePersist(currentRaw)
  const seen = new Set(oldData.state.words.map((word) => norm(word.en)))
  const extra = (current?.state.words ?? []).filter((word) => {
    const key = norm(word.en)
    return key.length > 0 && !seen.has(key)
  })
  if (extra.length) oldData.state.words.push(...extra)
  return JSON.stringify(oldData)
}

/** Pulls a one-time stash created by the page on port 5173 and writes it before the app store loads. */
export async function restoreFromToken(): Promise<void> {
  const params = new URLSearchParams(location.search)
  const token = params.get('geri')
  if (!token) return
  params.delete('geri')
  const query = params.toString()
  history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash)
  try {
    const res = await fetch(`/api/migrate-stash?token=${encodeURIComponent(token)}`)
    if (!res.ok) return
    const body = (await res.json()) as { raw?: unknown }
    if (typeof body.raw !== 'string') return
    const merged = mergePersist(localStorage.getItem(KEY), body.raw)
    if (!merged) return
    localStorage.setItem(KEY, merged)
    markPortMoveDone()
  } catch {
    /* The app still opens with whatever is already stored on this port. */
  }
}
