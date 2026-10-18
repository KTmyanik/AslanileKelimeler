import type { Word } from '../types'
import { pickWords } from './learning'

export type SpellLevel = 'easy' | 'mid' | 'hard'

export interface SpellCell {
  char: string
  blank: boolean
}

export interface SpellRound {
  word: Word
  cells: SpellCell[]
}

const LETTER = /^\p{L}$/u

export function isSpellLetter(ch: string): boolean {
  return LETTER.test(ch)
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Which letter indexes the child must type. Non-letters stay visible. */
export function blankIndexes(answer: string, level: SpellLevel, random = Math.random): number[] {
  const letters = [...answer].flatMap((ch, i) => (isSpellLetter(ch) ? [i] : []))
  if (letters.length === 0) return []
  if (level === 'hard' || letters.length === 1) return letters

  if (level === 'easy') {
    const hide = Math.max(1, Math.floor(letters.length / 2))
    return random() < 0.5 ? letters.slice(0, hide) : letters.slice(-hide)
  }

  const hide = Math.max(1, Math.min(letters.length - 1, Math.round(letters.length * 0.5)))
  const order = shuffle(letters, random)
  let chosen = order.slice(0, hide)
  const isBlock = (slice: number[]) => {
    const set = new Set(chosen)
    return slice.every((i) => set.has(i))
  }
  const looksLikeEasy =
    isBlock(letters.slice(0, chosen.length)) || isBlock(letters.slice(-chosen.length))
  if (looksLikeEasy && order.length > hide) chosen = [...chosen.slice(0, -1), order[hide]]
  return chosen
}

export function buildCells(answer: string, level: SpellLevel, random = Math.random): SpellCell[] {
  const hidden = new Set(blankIndexes(answer, level, random))
  return [...answer].map((char, i) => ({ char, blank: hidden.has(i) }))
}

export function buildSpellRounds(words: readonly Word[], level: SpellLevel, count: number): SpellRound[] {
  const usable = words.filter((w) => [...w.en.trim()].some(isSpellLetter))
  return pickWords(usable, count).map((word) => ({
    word,
    cells: buildCells(word.en.trim(), level),
  }))
}

/** English folding, so a Turkish locale does not turn I into ı. */
export function foldSpelling(text: string): string {
  return text.toLocaleLowerCase('en-US')
}

export function sameSpelling(typed: string, answer: string): boolean {
  return foldSpelling(typed) === foldSpelling(answer)
}
