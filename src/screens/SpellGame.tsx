import { useEffect, useRef, useState } from 'react'
import { Lion } from '../components/Lion'
import { GameResult, KidButton, NotEnoughWords, ProgressDots, SpeakButton, TopBar } from '../components/ui'
import { celebrate } from '../lib/celebrate'
import { getPool } from '../lib/pool'
import { sfx } from '../lib/sfx'
import { buildSpellRounds, foldSpelling, isSpellLetter, sameSpelling, type SpellCell, type SpellLevel, type SpellRound } from '../lib/spell'
import { speak } from '../lib/speech'
import { useStore } from '../store'
import type { LionMood } from '../types'

const ROUNDS = 6
const KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

const LEVELS: {
  id: SpellLevel
  emoji: string
  tr: string
  en: string
  hint: string
  sample: string[]
  color: string
}[] = [
  {
    id: 'easy',
    emoji: '🌱',
    tr: 'Kolay',
    en: 'Easy',
    hint: 'Başı ya da sonu eksik',
    sample: ['c', 'a', '_'],
    color: '[--c:var(--color-leaf)] [--s:var(--color-leaf-dark)] text-white',
  },
  {
    id: 'mid',
    emoji: '🌿',
    tr: 'Orta',
    en: 'Medium',
    hint: 'Bazı harfler eksik',
    sample: ['c', '_', 't'],
    color: '[--c:var(--color-sun)] [--s:var(--color-sun-dark)] text-ink',
  },
  {
    id: 'hard',
    emoji: '🔥',
    tr: 'Zor',
    en: 'Hard',
    hint: 'Kelimenin tamamı',
    sample: ['_', '_', '_'],
    color: '[--c:var(--color-lion-red)] [--s:var(--color-lion-red-dark)] text-white',
  },
]

const LEVEL_NAME: Record<SpellLevel, { tr: string; en: string }> = {
  easy: { tr: 'Kolay', en: 'Easy' },
  mid: { tr: 'Orta', en: 'Medium' },
  hard: { tr: 'Zor', en: 'Hard' },
}

function taskHint(level: SpellLevel, cells: SpellCell[]): { tr: string; en: string } {
  if (level === 'hard') return { tr: 'Kelimeyi yaz', en: 'Write the word' }
  if (level === 'mid') return { tr: 'Boş harfleri yaz', en: 'Fill the letters' }
  const letters = cells.filter((c) => isSpellLetter(c.char))
  const last = letters[letters.length - 1]
  if (letters[0]?.blank && !last?.blank) return { tr: 'Başını tamamla', en: 'Write the start' }
  if (last?.blank && !letters[0]?.blank) return { tr: 'Sonunu tamamla', en: 'Write the end' }
  return { tr: 'Eksik yeri tamamla', en: 'Fill the gap' }
}

export function SpellGame({ onHome }: { onHome: () => void }) {
  const [level, setLevel] = useState<SpellLevel | null>(null)
  if (!level) return <LevelPick onHome={onHome} onPick={setLevel} />
  return <SpellPlay level={level} onBack={() => setLevel(null)} onHome={onHome} />
}

function LevelPick({ onHome, onPick }: { onHome: () => void; onPick: (level: SpellLevel) => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <TopBar title="Yaz" subtitle="Önce bir seviye seç" onBack={onHome} />
      <div className="flex flex-1 flex-col justify-center gap-4 px-4 py-6">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onPick(level.id)}
            className={`btn-3d flex items-center gap-4 rounded-[2rem] px-5 py-4 text-left ${level.color}`}
          >
            <span className="emoji text-5xl">{level.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-3xl font-extrabold">{level.tr}</span>
              <span className="block text-lg font-bold opacity-80">
                {level.en} · {level.hint}
              </span>
              <span className="mt-2 flex gap-1">
                {level.sample.map((ch, i) => (
                  <span
                    key={i}
                    className={`grid size-9 place-items-center rounded-lg text-lg font-extrabold ${
                      ch === '_' ? 'border-2 border-dashed border-current bg-white/20' : 'bg-white/75 text-ink'
                    }`}
                  >
                    {ch === '_' ? '' : ch}
                  </span>
                ))}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SpellPlay({ level, onBack, onHome }: { level: SpellLevel; onBack: () => void; onHome: () => void }) {
  const finishSession = useStore((s) => s.finishSession)
  const [rounds, setRounds] = useState(() => buildSpellRounds(getPool().pool, level, ROUNDS))
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const name = LEVEL_NAME[level]

  if (!rounds.length) return <NotEnoughWords need={1} onBack={onBack} />

  const restart = () => {
    setRounds(buildSpellRounds(getPool().pool, level, ROUNDS))
    setIdx(0)
    setScore(0)
    setDone(false)
  }

  const onSolved = (firstTry: boolean) => {
    const nextScore = score + (firstTry ? 1 : 0)
    setScore(nextScore)
    if (idx + 1 >= rounds.length) {
      finishSession(nextScore === rounds.length)
      sfx.win()
      celebrate(true)
      setDone(true)
      return
    }
    setIdx((i) => i + 1)
  }

  if (done) {
    return (
      <>
        <TopBar title="Yaz" subtitle={`${name.tr} · ${name.en}`} onBack={onBack} />
        <GameResult correct={score} total={rounds.length} starsEarned={score} onAgain={restart} onHome={onHome} />
      </>
    )
  }

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col overflow-hidden">
      <TopBar title="Yaz" subtitle={`${name.tr} · ${name.en}`} onBack={onBack} />
      <ProgressDots total={rounds.length} current={idx} />
      <RoundBoard key={`${level}-${idx}`} round={rounds[idx]} level={level} onSolved={onSolved} />
    </div>
  )
}

function RoundBoard({
  round,
  level,
  onSolved,
}: {
  round: SpellRound
  level: SpellLevel
  onSolved: (firstTry: boolean) => void
}) {
  const recordAnswer = useStore((s) => s.recordAnswer)
  const outfit = useStore((s) => s.outfit)
  const blanks = round.cells.flatMap((cell, i) => (cell.blank ? [i] : []))
  const [values, setValues] = useState<string[]>(() => round.cells.map(() => ''))
  const [active, setActive] = useState(blanks[0] ?? 0)
  const [solved, setSolved] = useState(false)
  const [mood, setMood] = useState<LionMood>('think')
  const [wrongCount, setWrongCount] = useState(0)
  const missed = useRef(false)
  const locked = useRef(false)
  const valuesRef = useRef(values)
  const activeRef = useRef(active)
  const timers = useRef<number[]>([])
  const api = useRef<{ put: (ch: string) => void; back: () => void; check: () => void }>({
    put() {},
    back() {},
    check() {},
  })
  valuesRef.current = values
  activeRef.current = active

  const answer = round.word.en.trim()
  const hint = solved
    ? { tr: 'Doğru!', en: answer }
    : mood === 'sad'
      ? { tr: 'Tekrar dene!', en: 'Try again!' }
      : taskHint(level, round.cells)
  const filled = blanks.every((i) => values[i])
  const many = round.cells.length > 10

  const put = (ch: string) => {
    const index = activeRef.current
    if (locked.current || !blanks.includes(index)) return
    const letter = foldSpelling(ch)
    if (!isSpellLetter(letter)) return
    setMood('think')
    const next = [...valuesRef.current]
    next[index] = letter
    valuesRef.current = next
    setValues(next)
    const following = blanks[blanks.indexOf(index) + 1]
    if (following !== undefined) {
      activeRef.current = following
      setActive(following)
    }
  }

  const back = () => {
    const index = activeRef.current
    if (locked.current || !blanks.includes(index)) return
    setMood('think')
    const next = [...valuesRef.current]
    if (next[index]) {
      next[index] = ''
      valuesRef.current = next
      setValues(next)
      return
    }
    const previous = blanks[blanks.indexOf(index) - 1]
    if (previous === undefined) return
    next[previous] = ''
    valuesRef.current = next
    activeRef.current = previous
    setValues(next)
    setActive(previous)
  }

  const check = () => {
    const current = valuesRef.current
    const complete = blanks.every((i) => current[i])
    if (locked.current || !complete) return
    const typed = round.cells.map((cell, i) => (cell.blank ? current[i] : cell.char)).join('')
    if (!sameSpelling(typed, answer)) {
      sfx.wrong()
      setMood('sad')
      setWrongCount((n) => n + 1)
      if (!missed.current) {
        missed.current = true
        recordAnswer(round.word.id, false)
      }
      return
    }
    locked.current = true
    sfx.correct()
    setMood('cheer')
    setSolved(true)
    const revealed = round.cells.map((cell) => foldSpelling(cell.char))
    valuesRef.current = revealed
    setValues(revealed)
    if (!missed.current) {
      recordAnswer(round.word.id, true)
      celebrate()
    }
    timers.current.push(window.setTimeout(() => speak(answer), 200))
    timers.current.push(window.setTimeout(() => onSolved(!missed.current), 1400))
  }

  api.current = { put, back, check }

  useEffect(() => {
    const t = window.setTimeout(() => speak(answer), 450)
    const pending = timers.current
    return () => {
      window.clearTimeout(t)
      pending.forEach((id) => window.clearTimeout(id))
    }
  }, [answer])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Backspace') {
        e.preventDefault()
        api.current.back()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        api.current.check()
      } else if (e.key.length === 1 && isSpellLetter(e.key)) {
        e.preventDefault()
        api.current.put(e.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const extras = [
    ...new Set(
      round.cells
        .filter((cell) => cell.blank && !/^[a-z]$/i.test(cell.char))
        .map((cell) => foldSpelling(cell.char)),
    ),
  ]

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Lion mood={mood} outfit={outfit} size={96} className="shrink-0" />
          <div className="min-w-0 text-left">
            <div className={`text-2xl font-extrabold ${solved ? 'text-leaf' : mood === 'sad' ? 'text-lion-red' : ''}`}>
              {hint.tr}
            </div>
            <div className="text-lg font-bold text-ink-soft">{hint.en}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="emoji text-6xl">{round.word.emoji}</span>
          <div>
            <div className="text-3xl font-extrabold">{round.word.tr || '—'}</div>
            <SpeakButton onClick={() => speak(answer)} />
          </div>
        </div>

        <div key={wrongCount} className={`flex max-w-full flex-wrap justify-center gap-1.5 ${wrongCount ? 'animate-shake' : ''}`}>
          {round.cells.map((cell, i) => (
            <LetterBox
              key={i}
              cell={cell}
              value={values[i]}
              active={i === active && !solved}
              wrong={wrongCount > 0 && cell.blank && foldSpelling(values[i]) !== foldSpelling(cell.char)}
              solved={solved}
              compact={many}
              onClick={() => !solved && cell.blank && setActive(i)}
            />
          ))}
        </div>

        <KidButton color="leaf" disabled={!filled || solved} onClick={check} className="mt-1">
          Kontrol et
        </KidButton>
      </div>

      <div className="shrink-0 px-2 pt-1 pb-3">
        {extras.length > 0 && (
          <div className="mb-2 flex justify-center gap-2">
            {extras.map((key) => (
              <KeyCap key={key} label={key} disabled={solved} onClick={() => put(key)} />
            ))}
          </div>
        )}
        <div className="mx-auto grid max-w-xl grid-cols-7 gap-1.5">
          {KEYS.map((key) => (
            <KeyCap key={key} label={key} disabled={solved} onClick={() => put(key)} />
          ))}
          <button
            type="button"
            disabled={solved}
            onClick={back}
            aria-label="Sil"
            className="btn-3d col-span-2 rounded-xl py-2 text-lg font-extrabold text-white disabled:opacity-40 sm:py-3 sm:text-xl [--c:var(--color-ink-soft)] [--s:var(--color-ink)]"
          >
            ⌫
          </button>
        </div>
      </div>
    </>
  )
}

function LetterBox({
  cell,
  value,
  active,
  wrong,
  solved,
  compact,
  onClick,
}: {
  cell: SpellCell
  value: string
  active: boolean
  wrong: boolean
  solved: boolean
  compact: boolean
  onClick: () => void
}) {
  if (cell.char === ' ') return <span className="w-3" />
  if (!cell.blank && !isSpellLetter(cell.char)) {
    return <span className="px-0.5 text-3xl font-extrabold">{cell.char}</span>
  }

  const shown = cell.blank ? value : foldSpelling(cell.char)
  const size = compact ? 'h-12 w-8 text-xl' : 'h-14 w-11 text-2xl sm:h-16 sm:w-12 sm:text-3xl'
  return (
    <button
      type="button"
      disabled={!cell.blank || solved}
      aria-label={cell.blank ? (value ? value : 'Boş harf') : undefined}
      onClick={onClick}
      className={`grid place-items-center rounded-xl font-extrabold ${size} ${
        solved
          ? 'border-4 border-leaf bg-leaf/15 text-leaf-dark'
          : !cell.blank
            ? 'bg-sun-light text-ink'
            : wrong
              ? 'border-4 border-lion-red bg-lion-red/10 text-lion-red'
              : active
                ? 'border-4 border-sun bg-white shadow-[0_4px_0_var(--color-sun-dark)]'
                : 'border-4 border-dashed border-ink/20 bg-white'
      }`}
    >
      {shown}
    </button>
  )
}

function KeyCap({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="btn-3d rounded-xl py-2 text-lg font-extrabold text-ink disabled:opacity-40 sm:py-3 sm:text-xl [--c:white] [--s:rgb(74_44_22/0.16)]"
    >
      {label.toLocaleUpperCase('en-US')}
    </button>
  )
}
