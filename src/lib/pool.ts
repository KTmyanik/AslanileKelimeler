import { useStore } from '../store'
import type { Word } from '../types'
import { wordsInList } from './learning'

/** Snapshot (non-reactive) so a running game isn't reshuffled when answers update the store. */
export function getPool(): { pool: Word[]; all: Word[] } {
  const { words, activeList } = useStore.getState()
  const pool = wordsInList(words, activeList)
  return { pool: pool.length ? pool : words, all: words }
}
