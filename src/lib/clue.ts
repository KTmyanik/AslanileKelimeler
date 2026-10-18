import type { Word } from '../types'
import { shuffle } from './learning'

const CATEGORY_CLUE: Record<string, string> = {
  Hayvanlar: 'It is an animal.',
  Renkler: 'It is a color.',
  Meyveler: 'It is a fruit. You can eat it.',
  Okul: 'You see it at school.',
  Sayılar: 'It is a number.',
  Doğa: 'You see it outside.',
  Oyunlar: 'You can play with it.',
  Aile: 'This person is in a family.',
  Selamlaşma: 'You say this to someone.',
  Diğer: 'Look at the picture.',
}

export function clueFor(word: Word): string {
  const custom = word.clue?.trim()
  if (custom) return custom
  return CATEGORY_CLUE[word.category] ?? 'Look at the picture.'
}

/** Other-category words first, so a category clue still points at one answer. */
export function hintChoices(all: readonly Word[], target: Word, n: number): Word[] {
  const others = all.filter((word) => word.id !== target.id)
  const far = shuffle(others.filter((word) => word.category !== target.category))
  const near = shuffle(others.filter((word) => word.category === target.category))
  return shuffle([target, ...[...far, ...near].slice(0, Math.max(0, n - 1))])
}
