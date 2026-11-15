import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BADGES, type BadgeStats } from './lib/badges'
import { pickDailyWords } from './lib/daily'
import { normalizeEn, statusOf, todayKey, wordsInList } from './lib/learning'
import { SEED_LIST, SEED_WORDS } from './lib/seed'
import { longestStreak, weeksAtGoal } from './lib/streak'
import type { DailyMission, GameLevel, Outfit, Sentence, Word, WordDraft } from './types'

export const DEFAULT_PIN = '1234'

interface PersistedState {
  words: Word[]
  stars: number
  pin: string
  childName: string
  earnedBadges: string[]
  sessions: number
  perfectGames: number
  playDays: string[]
  activeList: string | null
  outfit: Outfit
  sentences: Sentence[]
  daily: DailyMission | null
  listenBest: number
  /** Best "Rekor" score on the text level; reading is slower than spotting a picture, so it has its own record. */
  listenBestText: number
  level: GameLevel
}

interface State extends PersistedState {
  newBadges: string[]
  addWords: (drafts: WordDraft[], list: string) => { added: number; skipped: number }
  /** Adds a pack as its own list; words already in one of `takeFrom` lists move into it with their progress. */
  addPack: (drafts: WordDraft[], list: string, takeFrom: readonly string[]) => { added: number; moved: number }
  updateWord: (id: string, patch: Partial<Omit<Word, 'id'>>) => void
  deleteWord: (id: string) => void
  deleteList: (list: string) => void
  recordAnswer: (id: string, ok: boolean, star?: boolean) => void
  finishSession: (perfect: boolean) => void
  dismissBadge: () => void
  setPin: (pin: string) => void
  setChildName: (name: string) => void
  setActiveList: (list: string | null) => void
  setOutfit: (outfit: Outfit) => void
  resetProgress: () => void
  importBackup: (data: Partial<PersistedState>) => void
  grantStars: (n: number) => void
  addSentence: (en: string, tr: string) => void
  deleteSentence: (id: string) => void
  ensureDaily: () => void
  markDailyDone: (id: string) => void
  setListenBest: (score: number, level: GameLevel) => void
  setLevel: (level: GameLevel) => void
}

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

function makeWord(d: WordDraft, list: string): Word {
  return {
    id: uid(),
    en: d.en.trim(),
    tr: d.tr.trim(),
    emoji: d.emoji.trim() || '📘',
    category: d.category.trim() || 'Diğer',
    list,
    createdAt: Date.now(),
    correct: 0,
    wrong: 0,
    streak: 0,
    lastSeen: null,
  }
}

function statsOf(s: PersistedState): BadgeStats {
  return {
    stars: s.stars,
    learned: s.words.filter((w) => statusOf(w) === 'learned').length,
    sessions: s.sessions,
    perfectGames: s.perfectGames,
    days: s.playDays.length,
    streak: longestStreak(s.playDays),
    weekGoals: weeksAtGoal(s.playDays),
  }
}

/** Returns badge-related fields to merge after any change that can unlock a badge. */
function withBadges(s: State, next: Partial<PersistedState>): Partial<State> {
  const merged = { ...s, ...next }
  const stats = statsOf(merged)
  const fresh = BADGES.filter((b) => !merged.earnedBadges.includes(b.id) && b.test(stats)).map(
    (b) => b.id,
  )
  if (!fresh.length) return next
  return {
    ...next,
    earnedBadges: [...merged.earnedBadges, ...fresh],
    newBadges: [...s.newBadges, ...fresh],
  }
}

const initial: PersistedState = {
  words: SEED_WORDS.map((d) => makeWord(d, SEED_LIST)),
  stars: 0,
  pin: DEFAULT_PIN,
  childName: '',
  earnedBadges: [],
  sessions: 0,
  perfectGames: 0,
  playDays: [],
  activeList: null,
  outfit: 'none',
  sentences: [],
  daily: null,
  listenBest: 0,
  listenBestText: 0,
  level: 'picture',
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      newBadges: [],

      addWords: (drafts, list) => {
        const existing = new Set(get().words.map((w) => normalizeEn(w.en)))
        const fresh: Word[] = []
        for (const d of drafts) {
          const key = normalizeEn(d.en)
          if (!key || existing.has(key)) continue
          existing.add(key)
          fresh.push(makeWord(d, list))
        }
        set((s) => ({ words: [...s.words, ...fresh] }))
        return { added: fresh.length, skipped: drafts.length - fresh.length }
      },

      addPack: (drafts, list, takeFrom) => {
        const keys = new Set(drafts.map((d) => normalizeEn(d.en)))
        const movable = new Set([SEED_LIST, ...takeFrom])
        let moved = 0
        const words = get().words.map((w) => {
          if (w.list === list || !movable.has(w.list) || !keys.has(normalizeEn(w.en))) return w
          moved++
          return { ...w, list }
        })
        set({ words })
        const { added } = get().addWords(drafts, list)
        return { added, moved }
      },

      updateWord: (id, patch) =>
        set((s) => ({ words: s.words.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

      deleteWord: (id) => set((s) => ({ words: s.words.filter((w) => w.id !== id) })),

      deleteList: (list) =>
        set((s) => ({
          words: s.words.filter((w) => w.list !== list),
          activeList: s.activeList === list ? null : s.activeList,
        })),

      recordAnswer: (id, ok, star = ok) =>
        set((s) => {
          const today = todayKey()
          const words = s.words.map((w) =>
            w.id !== id
              ? w
              : {
                  ...w,
                  correct: w.correct + (ok ? 1 : 0),
                  wrong: w.wrong + (ok ? 0 : 1),
                  streak: ok ? w.streak + 1 : 0,
                  lastSeen: Date.now(),
                },
          )
          return withBadges(s, {
            words,
            stars: s.stars + (star ? 1 : 0),
            playDays: s.playDays.includes(today) ? s.playDays : [...s.playDays, today],
          })
        }),

      finishSession: (perfect) =>
        set((s) =>
          withBadges(s, {
            sessions: s.sessions + 1,
            perfectGames: s.perfectGames + (perfect ? 1 : 0),
          }),
        ),

      dismissBadge: () => set((s) => ({ newBadges: s.newBadges.slice(1) })),
      setPin: (pin) => set({ pin }),
      setChildName: (childName) => set({ childName }),
      setActiveList: (activeList) => set({ activeList }),
      setOutfit: (outfit) => set({ outfit }),

      resetProgress: () =>
        set((s) => ({
          words: s.words.map((w) => ({ ...w, correct: 0, wrong: 0, streak: 0, lastSeen: null })),
          stars: 0,
          earnedBadges: [],
          newBadges: [],
          sessions: 0,
          perfectGames: 0,
          playDays: [],
          outfit: 'none',
          listenBest: 0,
          listenBestText: 0,
          daily: null,
        })),

      grantStars: (n) =>
        set((s) => {
          if (n <= 0) return s
          const today = todayKey()
          return withBadges(s, {
            stars: s.stars + n,
            playDays: s.playDays.includes(today) ? s.playDays : [...s.playDays, today],
          })
        }),

      addSentence: (en, tr) =>
        set((s) => ({
          sentences: [{ id: uid(), en: en.trim(), tr: tr.trim(), createdAt: Date.now() }, ...s.sentences],
        })),

      deleteSentence: (id) => set((s) => ({ sentences: s.sentences.filter((sentence) => sentence.id !== id) })),

      ensureDaily: () => {
        const today = todayKey()
        const { daily, words, activeList } = get()
        const pool = wordsInList(words, activeList)
        const source = pool.length ? pool : words
        const stillThere = daily?.date === today && daily.wordIds.some((id) => source.some((word) => word.id === id))
        if (stillThere) return
        const picked = pickDailyWords(source)
        set({ daily: { date: today, wordIds: picked.map((word) => word.id), doneIds: [] } })
      },

      markDailyDone: (id) =>
        set((s) => {
          if (!s.daily || s.daily.doneIds.includes(id) || !s.daily.wordIds.includes(id)) return s
          return { daily: { ...s.daily, doneIds: [...s.daily.doneIds, id] } }
        }),

      setListenBest: (score, level) =>
        set((s) => {
          if (level === 'text') return score > s.listenBestText ? { listenBestText: score } : s
          return score > s.listenBest ? { listenBest: score } : s
        }),

      setLevel: (level) => set({ level }),

      importBackup: (data) =>
        set(() => ({
          ...initial,
          ...data,
          words: Array.isArray(data.words) ? data.words : initial.words,
          sentences: Array.isArray(data.sentences) ? data.sentences : initial.sentences,
          listenBest: typeof data.listenBest === 'number' ? data.listenBest : initial.listenBest,
          listenBestText: typeof data.listenBestText === 'number' ? data.listenBestText : initial.listenBestText,
          level: data.level === 'picture' || data.level === 'text' ? data.level : initial.level,
          daily: data.daily?.date ? data.daily : initial.daily,
          newBadges: [],
        })),
    }),
    {
      name: 'aslan-kelime-v1',
      partialize: (s): PersistedState => ({
        words: s.words,
        stars: s.stars,
        pin: s.pin,
        childName: s.childName,
        earnedBadges: s.earnedBadges,
        sessions: s.sessions,
        perfectGames: s.perfectGames,
        playDays: s.playDays,
        activeList: s.activeList,
        outfit: s.outfit,
        sentences: s.sentences,
        daily: s.daily,
        listenBest: s.listenBest,
        listenBestText: s.listenBestText,
        level: s.level,
      }),
    },
  ),
)

/** The "Rekor" best score that counts on the given level. */
export function recordBest(s: Pick<PersistedState, 'listenBest' | 'listenBestText'>, level: GameLevel): number {
  return level === 'text' ? s.listenBestText : s.listenBest
}

/** Lists in the order they were added, so the road map follows the school year. */
export function listsByAge(words: readonly Word[]): string[] {
  // Lists added in one go share a timestamp; the order of the words then keeps them in sequence.
  const first = new Map<string, { at: number; index: number }>()
  words.forEach((w, index) => {
    const seen = first.get(w.list)
    if (!seen) first.set(w.list, { at: w.createdAt, index })
    else if (w.createdAt < seen.at) seen.at = w.createdAt
  })
  return [...first.keys()].sort((a, b) => first.get(a)!.at - first.get(b)!.at || first.get(a)!.index - first.get(b)!.index)
}

export function useLists(): string[] {
  const words = useStore((s) => s.words)
  return [...new Set(words.map((w) => w.list))].sort((a, b) => a.localeCompare(b, 'tr'))
}

export function backupOf(s: State): PersistedState {
  const { words, stars, pin, childName, earnedBadges, sessions, perfectGames, playDays, activeList, outfit, sentences, daily, listenBest, listenBestText, level } = s
  return { words, stars, pin, childName, earnedBadges, sessions, perfectGames, playDays, activeList, outfit, sentences, daily, listenBest, listenBestText, level }
}
