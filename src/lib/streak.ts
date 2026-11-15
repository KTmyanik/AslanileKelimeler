import { todayKey } from './learning'

/** Days to play in one week (Monday to Sunday) to reach the weekly goal. */
export const WEEK_GOAL = 5

function shift(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function mondayOf(d: Date): Date {
  return shift(d, -((d.getDay() + 6) % 7))
}

/** Days in a row up to today. A streak that ended yesterday still counts until today is over. */
export function currentStreak(days: readonly string[], now = new Date()): number {
  const set = new Set(days)
  let d = set.has(todayKey(now)) ? now : shift(now, -1)
  let n = 0
  while (set.has(todayKey(d))) {
    n++
    d = shift(d, -1)
  }
  return n
}

export function longestStreak(days: readonly string[]): number {
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const key of [...new Set(days)].sort()) {
    run = prev !== null && todayKey(shift(parseKey(key), -1)) === prev ? run + 1 : 1
    best = Math.max(best, run)
    prev = key
  }
  return best
}

/** This week's days, Monday first. */
export function weekKeys(now = new Date()): string[] {
  const monday = mondayOf(now)
  return Array.from({ length: 7 }, (_, i) => todayKey(shift(monday, i)))
}

/** How many weeks reached the weekly goal. */
export function weeksAtGoal(days: readonly string[]): number {
  const perWeek = new Map<string, number>()
  for (const key of new Set(days)) {
    const week = todayKey(mondayOf(parseKey(key)))
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1)
  }
  return [...perWeek.values()].filter((n) => n >= WEEK_GOAL).length
}
