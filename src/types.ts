export interface Word {
  id: string
  en: string
  tr: string
  emoji: string
  category: string
  list: string
  createdAt: number
  correct: number
  wrong: number
  streak: number
  lastSeen: number | null
  /** Optional English hint used after the word is learned. */
  clue?: string
}

export interface Sentence {
  id: string
  en: string
  tr: string
  createdAt: number
}

export interface DailyMission {
  date: string
  wordIds: string[]
  doneIds: string[]
}

export interface WordDraft {
  en: string
  tr: string
  emoji: string
  category: string
}

export type WordStatus = 'new' | 'learning' | 'learned'

export type Outfit = 'none' | 'scarf' | 'glasses' | 'bowtie' | 'crown' | 'party' | 'wizard'

/** How much help the games give: each word's picture, or its text alone. */
export type GameLevel = 'picture' | 'text'

export type LionMood = 'happy' | 'cheer' | 'think' | 'sad'

export type Screen = 'home' | 'cards' | 'listen' | 'match' | 'memory' | 'spell' | 'sentence' | 'daily' | 'hint' | 'record' | 'rewards' | 'map' | 'album' | 'parent'
