import { useCallback, useEffect, useState } from 'react'
import { Lion } from '../components/Lion'
import { GameResult, NotEnoughWords, ProgressDots, SpeakButton, TopBar } from '../components/ui'
import { celebrate } from '../lib/celebrate'
import { distractors, pickWords, shuffle } from '../lib/learning'
import { getPool } from '../lib/pool'
import { sfx } from '../lib/sfx'
import { speak } from '../lib/speech'
import { useStore } from '../store'
import type { LionMood, Word } from '../types'

const ROUNDS = 8
const OPTIONS = 4

interface Round {
  target: Word
  options: Word[]
}

function buildRounds(): Round[] {
  const { pool, all } = getPool()
  if (all.length < OPTIONS) return []
  return pickWords(pool, ROUNDS).map((target) => ({
    target,
    options: shuffle([target, ...distractors(all, target, OPTIONS - 1)]),
  }))
}

export function ListenPick({ onHome }: { onHome: () => void }) {
  const recordAnswer = useStore((s) => s.recordAnswer)
  const finishSession = useStore((s) => s.finishSession)
  const outfit = useStore((s) => s.outfit)
  const [rounds, setRounds] = useState(buildRounds)
  const [idx, setIdx] = useState(0)
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const [mood, setMood] = useState<LionMood>('happy')
  const [done, setDone] = useState(false)

  const round = rounds[idx]
  const play = useCallback(() => round && speak(round.target.en), [round])

  useEffect(() => {
    if (done) return
    const t = setTimeout(play, 500)
    return () => clearTimeout(t)
  }, [play, done])

  if (!rounds.length) return <NotEnoughWords need={OPTIONS} onBack={onHome} />

  const restart = () => {
    setRounds(buildRounds())
    setIdx(0)
    setWrongIds([])
    setSolved(false)
    setScore(0)
    setMood('happy')
    setDone(false)
  }

  const choose = (w: Word) => {
    if (solved || wrongIds.includes(w.id)) return
    const firstTry = wrongIds.length === 0
    if (w.id !== round.target.id) {
      sfx.wrong()
      setMood('sad')
      setWrongIds((ids) => [...ids, w.id])
      if (firstTry) recordAnswer(round.target.id, false)
      return
    }
    sfx.correct()
    setMood('cheer')
    setSolved(true)
    if (firstTry) {
      recordAnswer(round.target.id, true)
      setScore((s) => s + 1)
      celebrate()
    }
    setTimeout(() => speak(round.target.en), 200)
    setTimeout(() => {
      if (idx + 1 >= rounds.length) {
        const finalScore = score + (firstTry ? 1 : 0)
        finishSession(finalScore === rounds.length)
        sfx.win()
        celebrate(true)
        setDone(true)
        return
      }
      setIdx((i) => i + 1)
      setWrongIds([])
      setSolved(false)
      setMood('happy')
    }, 1600)
  }

  if (done) {
    return (
      <>
        <TopBar title="Dinle ve Seç" subtitle="Listen and choose" onBack={onHome} />
        <GameResult correct={score} total={rounds.length} starsEarned={score} onAgain={restart} onHome={onHome} />
      </>
    )
  }

  const bubble = solved
    ? { tr: 'Doğru!', en: round.target.en }
    : mood === 'sad'
      ? { tr: 'Tekrar dene!', en: 'Try again!' }
      : { tr: 'Dinle ve doğru resmi seç', en: 'Listen and choose' }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <TopBar title="Dinle ve Seç" subtitle="Listen and choose" onBack={onHome} />
      <ProgressDots total={rounds.length} current={idx} />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
        <div className="flex items-center gap-4">
          <Lion mood={mood} outfit={outfit} size={110} />
          <SpeakButton size="lg" onClick={play} />
          <div className="min-w-0 text-left">
            <div className={`text-2xl font-extrabold sm:text-3xl ${solved ? 'text-leaf' : mood === 'sad' ? 'text-lion-red' : ''}`}>
              {bubble.tr}
            </div>
            <div className="text-xl font-bold text-ink-soft">{bubble.en}</div>
          </div>
        </div>

        <div key={idx} className="grid w-full max-w-xl grid-cols-2 gap-4">
          {round.options.map((w) => {
            const isWrong = wrongIds.includes(w.id)
            const isRight = solved && w.id === round.target.id
            return (
              <button
                key={w.id}
                onClick={() => choose(w)}
                className={`card-soft animate-pop flex aspect-square flex-col items-center justify-center gap-2 border-[5px] p-3 transition ${
                  isRight
                    ? 'scale-105 border-leaf bg-leaf/10'
                    : isWrong
                      ? 'animate-shake border-lion-red-light opacity-50'
                      : solved
                        ? 'border-transparent opacity-40'
                        : 'border-transparent hover:border-sun active:scale-95'
                }`}
              >
                <span className="emoji text-7xl sm:text-8xl">{w.emoji}</span>
                <span className="text-center text-xl font-bold text-ink-soft">{w.tr}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
