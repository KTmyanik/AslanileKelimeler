import { create } from 'zustand'
import { merge3, mergeFirst, type SyncedState } from './lib/merge'
import { useStore } from './store'

/**
 * Keeps the store in step with the progress file on the computer running the app (server/progress.ts).
 * The browser copy stays as a cache, so the app still works for a while if the computer can't be reached.
 */

const BASE_KEY = 'aslan-kelime-sync'
const PUSH_DELAY_MS = 1500
const PULL_EVERY_MS = 20_000
const FIRST_SYNC_WAIT_MS = 3000

interface Saved {
  rev: number
  state: SyncedState | null
}

/** The last copy this device and the file agreed on; merges compare both sides against it. */
interface Base {
  rev: number
  state: SyncedState
}

export type SyncStatus = 'connecting' | 'ok' | 'offline' | 'unavailable'

export const useSync = create<{ status: SyncStatus; savedAt: number | null }>(() => ({
  status: 'connecting',
  savedAt: null,
}))

function readBase(): Base | null {
  try {
    const b = JSON.parse(localStorage.getItem(BASE_KEY) ?? 'null') as Base | null
    return b && typeof b.rev === 'number' && Array.isArray(b.state?.words) ? b : null
  } catch {
    return null
  }
}

let base = readBase()

function setBase(next: Base) {
  base = next
  try {
    localStorage.setItem(BASE_KEY, JSON.stringify(next))
  } catch {
    /* Without it the next start simply does a first-time merge, which loses nothing. */
  }
}

function snapshot(): SyncedState {
  const s = useStore.getState()
  return {
    words: s.words,
    stars: s.stars,
    pin: s.pin,
    childName: s.childName,
    earnedBadges: s.earnedBadges,
    sessions: s.sessions,
    perfectGames: s.perfectGames,
    playDays: s.playDays,
    outfit: s.outfit,
    sentences: s.sentences,
    daily: s.daily,
    listenBest: s.listenBest,
    listenBestText: s.listenBestText,
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Folds the file's copy into this device and makes it the new common ground. */
function absorb(saved: Saved & { state: SyncedState }) {
  const local = snapshot()
  const merged = base ? merge3(base.state, local, saved.state) : mergeFirst(local, saved.state)
  if (!same(merged, local)) {
    const { activeList } = useStore.getState()
    const listGone = activeList !== null && !merged.words.some((w) => w.list === activeList)
    useStore.setState(listGone ? { ...merged, activeList: null } : merged)
  }
  setBase({ rev: saved.rev, state: saved.state })
}

const status = (s: SyncStatus) => useSync.setState(s === 'ok' ? { status: s, savedAt: Date.now() } : { status: s })

let busy = false
let again = false
let timer: ReturnType<typeof setTimeout> | undefined

async function push(): Promise<void> {
  if (busy) {
    again = true
    return
  }
  busy = true
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const state = snapshot()
      if (base && same(state, base.state)) break
      const res = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ baseRev: base?.rev ?? 0, state }),
      })
      if (res.ok) {
        const { rev } = (await res.json()) as { rev: number }
        setBase({ rev, state })
        status('ok')
        continue
      }
      if (res.status === 409) {
        const saved = (await res.json()) as Saved
        if (!saved.state) break
        absorb(saved as Saved & { state: SyncedState })
        continue
      }
      status(res.status === 404 ? 'unavailable' : 'offline')
      return
    }
  } catch {
    status('offline')
  } finally {
    busy = false
    if (again) {
      again = false
      schedule()
    }
  }
}

async function pull(): Promise<void> {
  if (busy) return
  try {
    const res = await fetch('/api/state', { cache: 'no-store' })
    if (!res.ok) {
      status(res.status === 404 ? 'unavailable' : 'offline')
      return
    }
    const saved = (await res.json()) as Saved
    if (!saved.state) {
      // Nothing saved yet (first run, or the file was removed): this device's copy becomes the file.
      base = null
    } else if (!base || base.rev !== saved.rev) {
      absorb(saved as Saved & { state: SyncedState })
    }
    status('ok')
    await push()
  } catch {
    status('offline')
  }
}

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(() => void push(), PUSH_DELAY_MS)
}

/** Runs the first sync (waiting a few seconds at most), then keeps syncing in the background. */
export async function startSync(): Promise<void> {
  await Promise.race([pull(), new Promise((r) => setTimeout(r, FIRST_SYNC_WAIT_MS))])

  useStore.subscribe((s, prev) => {
    // Level, chosen list and badge pop-ups belong to this device only.
    if (s.words !== prev.words || s.stars !== prev.stars || s.pin !== prev.pin || s.childName !== prev.childName ||
      s.earnedBadges !== prev.earnedBadges || s.sessions !== prev.sessions || s.perfectGames !== prev.perfectGames ||
      s.playDays !== prev.playDays || s.outfit !== prev.outfit || s.sentences !== prev.sentences ||
      s.daily !== prev.daily || s.listenBest !== prev.listenBest || s.listenBestText !== prev.listenBestText) {
      schedule()
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void pull()
    else {
      clearTimeout(timer)
      void push()
    }
  })
  setInterval(() => {
    if (document.visibilityState === 'visible') void pull()
  }, PULL_EVERY_MS)
}
