import { useState } from 'react'
import { GameResult, LionTalk, NotEnoughWords, TopBar } from '../components/ui'
import { celebrate } from '../lib/celebrate'
import { pickWords, shuffle } from '../lib/learning'
import { getPool } from '../lib/pool'
import { sfx } from '../lib/sfx'
import { speak } from '../lib/speech'
import { useStore } from '../store'
import type { LionMood, Word } from '../types'

const MIN = 3
const PAIRS = 6

interface Tile {
  key: string
  word: Word
  kind: 'en' | 'pic'
}

function buildTiles(): Tile[] {
  const words = pickWords(getPool().pool, PAIRS)
  if (words.length < MIN) return []
  return shuffle(words.flatMap((word) => [
    { key: `${word.id}-en`, word, kind: 'en' as const },
    { key: `${word.id}-pic`, word, kind: 'pic' as const },
  ]))
}

export function MemoryGame({ onHome }: { onHome: () => void }) {
  const recordAnswer = useStore((s) => s.recordAnswer)
  const finishSession = useStore((s) => s.finishSession)
  const [tiles, setTiles] = useState(buildTiles)
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [mood, setMood] = useState<LionMood>('happy')
  const [done, setDone] = useState(false)

  if (!tiles.length) return <NotEnoughWords need={MIN} onBack={onHome} />
  const pairs = tiles.length / 2

  const restart = () => {
    setTiles(buildTiles())
    setOpen([])
    setMatched([])
    setMoves(0)
    setMood('happy')
    setDone(false)
  }

  const flip = (i: number) => {
    const t = tiles[i]
    if (open.length >= 2 || open.includes(i) || matched.includes(t.word.id)) return
    sfx.flip()
    if (t.kind === 'en') speak(t.word.en)
    const next = [...open, i]
    setOpen(next)
    if (next.length < 2) return

    setMoves((m) => m + 1)
    const [a, b] = next.map((n) => tiles[n])
    if (a.word.id === b.word.id) {
      setTimeout(() => {
        sfx.correct()
        setMood('cheer')
        recordAnswer(a.word.id, true)
        const nextMatched = [...matched, a.word.id]
        setMatched(nextMatched)
        setOpen([])
        if (nextMatched.length === pairs) {
          setTimeout(() => {
            finishSession(moves + 1 === pairs)
            sfx.win()
            celebrate(true)
            setDone(true)
          }, 700)
        }
      }, 450)
    } else {
      setTimeout(() => {
        setMood('think')
        setOpen([])
      }, 1100)
    }
  }

  if (done) {
    return (
      <>
        <TopBar title="Hafıza" subtitle="Memory" onBack={onHome} />
        <GameResult correct={pairs} total={pairs} starsEarned={pairs} onAgain={restart} onHome={onHome} />
      </>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <TopBar title="Hafıza" subtitle={`Hamle · Moves: ${moves}`} onBack={onHome} />

      <div className="flex flex-1 flex-col items-center gap-5 px-4 py-4">
        <LionTalk
          mood={mood}
          size={90}
          text={mood === 'cheer' ? <>Buldun! <span className="text-leaf">You found it!</span></> : <>Kelimeyi ve resmini bul!</>}
        />

        <div className="grid w-full max-w-xl grid-cols-3 gap-3 sm:grid-cols-4">
          {tiles.map((t, i) => {
            const isMatched = matched.includes(t.word.id)
            const isOpen = isMatched || open.includes(i)
            return (
              <button key={t.key} onClick={() => flip(i)} className="flip aspect-[3/4] w-full" aria-label="Kart">
                <div className={`flip-inner ${isOpen ? 'flipped' : ''}`}>
                  <div className="flip-face grid place-items-center rounded-2xl border-4 border-lion-red bg-sun shadow-[0_5px_0_var(--color-sun-dark)]">
                    <span className="emoji text-4xl opacity-80">🐾</span>
                  </div>
                  <div
                    className={`flip-face flip-back flex flex-col items-center justify-center gap-1 rounded-2xl border-4 bg-white p-1 shadow-[0_5px_0_rgb(74_44_22/0.1)] ${
                      isMatched ? 'border-leaf bg-leaf/10' : 'border-sun'
                    }`}
                  >
                    {t.kind === 'en' ? (
                      <span className="text-center text-xl leading-tight font-extrabold break-words text-lion-red sm:text-2xl">
                        {t.word.en}
                      </span>
                    ) : (
                      <>
                        <span className="emoji text-4xl sm:text-5xl">{t.word.emoji}</span>
                        <span className="text-center text-sm leading-tight font-bold text-ink-soft">{t.word.tr}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
