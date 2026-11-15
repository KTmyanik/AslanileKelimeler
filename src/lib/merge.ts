import type { DailyMission, Outfit, Sentence, Word } from '../types'
import { normalizeEn } from './learning'
import { SEED_LIST } from './seed'

/** The part of the store that is shared between devices. Level and the chosen list stay per device. */
export interface SyncedState {
  words: Word[]
  stars: number
  pin: string
  childName: string
  earnedBadges: string[]
  sessions: number
  perfectGames: number
  playDays: string[]
  outfit: Outfit
  sentences: Sentence[]
  daily: DailyMission | null
  listenBest: number
  listenBestText: number
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Plain three-way pick: whichever side changed wins; if both did, `local` wins. */
function pick<T>(base: T, local: T, server: T): T {
  return same(local, base) ? server : local
}

/** Counters: keep what each side added since the last sync (a reset on one side still counts as a change). */
function count(base: number, local: number, server: number): number {
  return Math.max(0, server + local - base)
}

/** Records: if both sides beat the old value, the higher one stays. */
function best(base: number, local: number, server: number): number {
  if (local !== base && server !== base) return Math.max(local, server)
  return pick(base, local, server)
}

function setMerge(base: string[], local: string[], server: string[]): string[] {
  const removed = new Set(base.filter((x) => !local.includes(x)))
  const out = server.filter((x) => !removed.has(x))
  for (const x of local) if (!base.includes(x) && !out.includes(x)) out.push(x)
  return out
}

/** Field-by-field merge of one record that both sides changed. */
function mergeRecord<T extends object>(base: T, local: T, server: T, preferLocal: boolean): T {
  const keys = new Set([...Object.keys(server), ...Object.keys(local)]) as Set<keyof T>
  const out = {} as T
  for (const k of keys) {
    const lc = !same(local[k], base[k])
    const sc = !same(server[k], base[k])
    out[k] = lc && sc ? (preferLocal ? local[k] : server[k]) : lc ? local[k] : server[k]
  }
  return out
}

function byId<T extends { id: string }>(base: T[], local: T[], server: T[], both: (b: T, l: T, s: T) => T): T[] {
  const b = new Map(base.map((x) => [x.id, x]))
  const l = new Map(local.map((x) => [x.id, x]))
  const s = new Map(server.map((x) => [x.id, x]))
  const out: T[] = []
  for (const sv of server) {
    const bv = b.get(sv.id)
    const lv = l.get(sv.id)
    if (lv) out.push(bv ? both(bv, lv, sv) : lv)
    // Deleted here: drop it, unless the other device changed it since.
    else if (!bv || !same(sv, bv)) out.push(sv)
  }
  for (const lv of local) {
    if (s.has(lv.id)) continue
    const bv = b.get(lv.id)
    if (!bv || !same(lv, bv)) out.push(lv)
  }
  return out
}

const tries = (w: Word) => w.correct + w.wrong

/** Two devices may add the same pack; keep one copy of each English word, the one with more practice. */
function dedupeWords(words: Word[]): Word[] {
  const keep = new Map<string, Word>()
  for (const w of words) {
    const key = normalizeEn(w.en)
    const prev = keep.get(key)
    if (!prev || tries(w) > tries(prev)) keep.set(key, w)
  }
  return words.filter((w) => keep.get(normalizeEn(w.en)) === w)
}

function mergeWord(b: Word, l: Word, s: Word): Word {
  const lc = !same(l, b)
  const sc = !same(s, b)
  if (!lc || !sc) return lc ? l : s
  const merged = mergeRecord(b, l, s, (l.lastSeen ?? 0) >= (s.lastSeen ?? 0))
  merged.correct = count(b.correct, l.correct, s.correct)
  merged.wrong = count(b.wrong, l.wrong, s.wrong)
  merged.lastSeen = Math.max(l.lastSeen ?? 0, s.lastSeen ?? 0) || null
  return merged
}

function mergeDaily(b: DailyMission | null, l: DailyMission | null, s: DailyMission | null) {
  if (l && s && !same(l, b) && !same(s, b) && l.date === s.date && same(l.wordIds, s.wordIds)) {
    return { ...s, doneIds: [...new Set([...s.doneIds, ...l.doneIds])] }
  }
  return pick(b, l, s)
}

/** Merges this device's changes and the saved copy's changes since the last time they matched (`base`). */
export function merge3(base: SyncedState, local: SyncedState, server: SyncedState): SyncedState {
  return {
    words: dedupeWords(byId(base.words, local.words, server.words, mergeWord)),
    stars: count(base.stars, local.stars, server.stars),
    pin: pick(base.pin, local.pin, server.pin),
    childName: pick(base.childName, local.childName, server.childName),
    earnedBadges: setMerge(base.earnedBadges, local.earnedBadges, server.earnedBadges),
    sessions: count(base.sessions, local.sessions, server.sessions),
    perfectGames: count(base.perfectGames, local.perfectGames, server.perfectGames),
    playDays: setMerge(base.playDays, local.playDays, server.playDays).sort(),
    outfit: pick(base.outfit, local.outfit, server.outfit),
    sentences: byId(base.sentences, local.sentences, server.sentences, (b, l, s) => pick(b, l, s)),
    daily: mergeDaily(base.daily, local.daily, server.daily),
    listenBest: best(base.listenBest, local.listenBest, server.listenBest),
    listenBestText: best(base.listenBestText, local.listenBestText, server.listenBestText),
  }
}

/** A device that was never used: only the starter words, nothing played. */
export function isUntouched(s: SyncedState): boolean {
  return (
    s.stars === 0 &&
    s.sessions === 0 &&
    s.sentences.length === 0 &&
    s.words.every((w) => w.list === SEED_LIST && tries(w) === 0)
  )
}

/**
 * First meeting of this device and the saved copy, with no shared history to compare against.
 * Nothing is thrown away: words are joined (the more practiced copy wins) and totals take the higher value.
 */
export function mergeFirst(local: SyncedState, server: SyncedState): SyncedState {
  if (isUntouched(local)) return server
  const sentenceKeys = new Set(server.sentences.map((x) => x.en.trim().toLowerCase()))
  return {
    ...server,
    words: dedupeWords([...server.words, ...local.words]),
    stars: Math.max(local.stars, server.stars),
    childName: server.childName || local.childName,
    earnedBadges: [...new Set([...server.earnedBadges, ...local.earnedBadges])],
    sessions: Math.max(local.sessions, server.sessions),
    perfectGames: Math.max(local.perfectGames, server.perfectGames),
    playDays: [...new Set([...server.playDays, ...local.playDays])].sort(),
    sentences: [...server.sentences, ...local.sentences.filter((x) => !sentenceKeys.has(x.en.trim().toLowerCase()))],
    listenBest: Math.max(local.listenBest, server.listenBest),
    listenBestText: Math.max(local.listenBestText, server.listenBestText),
  }
}
