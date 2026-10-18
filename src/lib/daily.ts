import type { Word } from '../types'
import { todayKey } from './learning'

export const DAILY_GOAL = 5

function dayOf(ts: number): string {
  return todayKey(new Date(ts))
}

function yesterdayKey(now: Date): string {
  const day = new Date(now)
  day.setDate(day.getDate() - 1)
  return todayKey(day)
}

/**
 * Today's five words: ones missed yesterday come first,
 * then words the child has not seen for the longest time.
 */
export function pickDailyWords(words: readonly Word[], n = DAILY_GOAL, now = new Date()): Word[] {
  if (!words.length || n <= 0) return []
  const yesterday = yesterdayKey(now)
  const missed = words.filter(
    (word) => word.lastSeen !== null && dayOf(word.lastSeen) === yesterday && word.streak === 0 && word.wrong > 0,
  )
  const missedIds = new Set(missed.map((word) => word.id))
  const rest = words.filter((word) => !missedIds.has(word.id)).sort((a, b) => (a.lastSeen ?? 0) - (b.lastSeen ?? 0))
  return [...missed, ...rest].slice(0, Math.min(n, words.length))
}
