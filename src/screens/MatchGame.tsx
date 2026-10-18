import { useState } from 'react'
import { GameResult, LionTalk, NotEnoughWords, ProgressDots, TopBar } from '../components/ui'
import { celebrate } from '../lib/celebrate'
import { pickWords, shuffle } from '../lib/learning'
import { getPool } from '../lib/pool'
import { sfx } from '../lib/sfx'
import { speak } from '../lib/speech'
import { useStore } from '../store'
import type { LionMood, Word } from '../types'

const MIN = 3

interface Board {
  left: Word[]
  right: Word[]
}

function buildBoards(): Board[] {
  const words = pickWords(getPool().pool, 8)
  if (words.length < MIN) return []
  const chunks = words.length <= 5 ? [words] : [words.slice(0, Math.ceil(words.length / 2)), words.slice(Math.ceil(words.length / 2))]
  return chunks.map((c) => ({ left: shuffle(c), right: shuffle(c) }))
}

export function MatchGame({ onHome }: { onHome: () => void }) {
  const recordAnswer = useStore((s) => s.recordAnswer)
  const finishSession = useStore((s) => s.finishSession)
  const [boards, setBoards] = useState(buildBoards)
  const [board, setBoard] = useState(0)
  const [selL, setSelL] = useState<string | null>(null)
  const [selR, setSelR] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [missed, setMissed] = useState<string[]>([])
  const [shake, setShake] = useState<[string, string] | null>(null)
  const [mood, setMood] = useState<LionMood>('happy')
  const [done, setDone] = useState(false)

  if (!boards.length) return <NotEnoughWords need={MIN} onBack={onHome} />

  const total = boards.reduce((s, b) => s + b.left.length, 0)
  const score = total - missed.length
  const current = boards[board]

  const restart = () => {
    setBoards(buildBoards())
    setBoard(0)
    setSelL(null)
    setSelR(null)
    setMatched([])
    setMissed([])
    setMood('happy')
    setDone(false)
  }

  const tryPair = (l: string, r: string) => {
    if (l === r) {
      sfx.correct()
      setMood('cheer')
      const firstTry = !missed.includes(l)
      recordAnswer(l, true, firstTry)
      const nextMatched = [...matched, l]
      setMatched(nextMatched)
      setSelL(null)
      setSelR(null)
      if (current.left.every((w) => nextMatched.includes(w.id))) {
        celebrate()
        setTimeout(() => {
          if (board + 1 >= boards.length) {
            finishSession(missed.length === 0)
            sfx.win()
            celebrate(true)
            setDone(true)
          } else {
            setBoard((b) => b + 1)
            setMood('happy')
          }
        }, 900)
      }
      return
    }
    sfx.wrong()
    setMood('sad')
    if (!missed.includes(l)) {
      setMissed((m) => [...m, l])
      recordAnswer(l, false)
    }
    setShake([l, r])
    setTimeout(() => {
      setShake(null)
      setSelL(null)
      setSelR(null)
    }, 600)
  }

  const pickLeft = (w: Word) => {
    if (matched.includes(w.id) || shake) return
    speak(w.en)
    setSelL(w.id)
    if (selR) tryPair(w.id, selR)
  }

  const pickRight = (w: Word) => {
    if (matched.includes(w.id) || shake) return
    sfx.flip()
    setSelR(w.id)
    if (selL) tryPair(selL, w.id)
  }

  if (done) {
    return (
      <>
        <TopBar title="Eşleştir" subtitle="Match" onBack={onHome} />
        <GameResult correct={score} total={total} starsEarned={score} onAgain={restart} onHome={onHome} />
      </>
    )
  }

  const tile = (id: string, side: 'l' | 'r') => {
    const isMatched = matched.includes(id)
    const isSel = side === 'l' ? selL === id : selR === id
    const isShake = shake?.[side === 'l' ? 0 : 1] === id
    return `card-soft flex min-h-24 w-full items-center justify-center gap-2 border-[5px] px-3 py-3 transition ${
      isMatched
        ? 'border-leaf bg-leaf/15 opacity-60 scale-95'
        : isShake
          ? 'animate-shake border-lion-red-light'
          : isSel
            ? 'border-sun bg-sun-light/60 -translate-y-1'
            : 'border-transparent active:scale-95'
    }`
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <TopBar title="Eşleştir" subtitle="Match the pairs" onBack={onHome} />
      <ProgressDots total={boards.length} current={board} />

      <div className="flex flex-1 flex-col items-center gap-5 px-4 py-5">
        <LionTalk
          mood={mood}
          size={90}
          text={
            mood === 'sad' ? (
              <>Tekrar dene! <span className="text-lion-red">Try again!</span></>
            ) : mood === 'cheer' ? (
              <>Süper! <span className="text-leaf">Great!</span></>
            ) : (
              <>Kelimeyi resmiyle eşleştir</>
            )
          }
        />

        <div key={board} className="grid w-full max-w-xl grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            {current.left.map((w) => (
              <button key={w.id} onClick={() => pickLeft(w)} className={tile(w.id, 'l')}>
                <span className="text-center text-2xl font-extrabold break-words text-lion-red sm:text-3xl">{w.en}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {current.right.map((w) => (
              <button key={w.id} onClick={() => pickRight(w)} className={tile(w.id, 'r')}>
                <span className="emoji text-4xl sm:text-5xl">{w.emoji}</span>
                <span className="text-left text-lg leading-tight font-bold text-ink-soft">{w.tr}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
