import type { Word, WordStatus } from '../types'

export const LEARNED_STREAK = 3

export function statusOf(w: Word): WordStatus {
  if (w.correct + w.wrong === 0) return 'new'
  if (w.streak >= LEARNED_STREAK) return 'learned'
  return 'learning'
}

export const STATUS_LABEL: Record<WordStatus, string> = {
  new: 'Yeni',
  learning: 'Öğreniyor',
  learned: 'Öğrendi',
}

export const STATUS_STYLE: Record<WordStatus, string> = {
  new: 'bg-sky/15 text-sky-dark',
  learning: 'bg-tangerine/15 text-tangerine-dark',
  learned: 'bg-leaf/15 text-leaf-dark',
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function weightOf(w: Word, now: number): number {
  const base = { new: 3, learning: 4, learned: 1 }[statusOf(w)]
  const daysAgo = w.lastSeen ? (now - w.lastSeen) / 86_400_000 : 7
  return base + Math.min(daysAgo, 7) * 0.3
}

/** Weighted sampling without replacement: struggling and unseen words come up more often. */
export function pickWords(words: readonly Word[], n: number): Word[] {
  const now = Date.now()
  const pool = words.map((w) => ({ w, weight: weightOf(w, now) }))
  const out: Word[] = []
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, p) => s + p.weight, 0)
    let r = Math.random() * total
    let idx = 0
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].weight
      if (r <= 0) break
    }
    out.push(pool[idx].w)
    pool.splice(idx, 1)
  }
  return out
}

/** Distractors that look different from the target (different emoji and meaning). */
export function distractors(all: readonly Word[], target: Word, n: number): Word[] {
  const distinct = all.filter(
    (w) => w.id !== target.id && w.emoji !== target.emoji && w.tr !== target.tr,
  )
  const fallback = all.filter((w) => w.id !== target.id && !distinct.includes(w))
  return [...shuffle(distinct), ...shuffle(fallback)].slice(0, n)
}

export function wordsInList(words: readonly Word[], list: string | null): Word[] {
  return list ? words.filter((w) => w.list === list) : [...words]
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function normalizeEn(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}
