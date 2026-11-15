import type { GameLevel, Word } from '../types'

/**
 * Whether a word's picture may be shown before the answer is found.
 * A word with no Turkish meaning keeps its picture on the text level too,
 * because nothing else on the screen would tell it apart.
 */
export function showsPicture(word: Word, level: GameLevel): boolean {
  return level === 'picture' || !word.tr.trim()
}
