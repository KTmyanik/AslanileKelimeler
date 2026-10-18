import { useEffect, useState } from 'react'
import { GameResult, KidButton, NotEnoughWords, ProgressDots, SpeakButton, TopBar } from '../components/ui'
import { celebrate } from '../lib/celebrate'
import { pickWords } from '../lib/learning'
import { getPool } from '../lib/pool'
import { sfx } from '../lib/sfx'
import { speak } from '../lib/speech'
import { useStore } from '../store'
import type { Word } from '../types'

const DECK_SIZE = 10

export function Cards({ onHome }: { onHome: () => void }) {
  const recordAnswer = useStore((s) => s.recordAnswer)
  const finishSession = useStore((s) => s.finishSession)
  const [deck, setDeck] = useState<Word[]>(() => pickWords(getPool().pool, DECK_SIZE))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [done, setDone] = useState(false)

  const word = deck[idx]

  useEffect(() => {
    if (!word || done) return
    const t = setTimeout(() => speak(word.en), 450)
    return () => clearTimeout(t)
  }, [word, done])

  if (!deck.length) return <NotEnoughWords need={1} onBack={onHome} />

  const restart = () => {
    setDeck(pickWords(getPool().pool, DECK_SIZE))
    setIdx(0)
    setFlipped(false)
    setKnown(0)
    setDone(false)
  }

  const flip = () => {
    sfx.flip()
    if (!flipped) setTimeout(() => speak(word.tr, 'tr-TR', 0.95), 350)
    setFlipped((f) => !f)
  }

  const answer = (ok: boolean) => {
    recordAnswer(word.id, ok)
    if (ok) sfx.correct()
    const nextKnown = known + (ok ? 1 : 0)
    setKnown(nextKnown)
    if (idx + 1 >= deck.length) {
      finishSession(nextKnown === deck.length)
      sfx.win()
      celebrate(true)
      setDone(true)
      return
    }
    setFlipped(false)
    setTimeout(() => setIdx((i) => i + 1), 250)
  }

  if (done) {
    return (
      <>
        <TopBar title="Kartlar" subtitle="Cards" onBack={onHome} />
        <GameResult correct={known} total={deck.length} starsEarned={known} onAgain={restart} onHome={onHome} />
      </>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <TopBar title="Kartlar" subtitle="Karta dokun, anlamını gör!" onBack={onHome} />
      <ProgressDots total={deck.length} current={idx} />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6">
        <div
          className="flip aspect-[4/5] w-full max-w-sm cursor-pointer"
          onClick={flip}
          role="button"
          aria-label="Kartı çevir"
        >
          <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
            <div className="flip-face card-soft flex flex-col items-center justify-center gap-4 border-[6px] border-sun p-6">
              <span className="emoji text-[7rem] sm:text-[8rem]">{word.emoji}</span>
              <span className="text-center text-5xl font-extrabold break-words text-lion-red sm:text-6xl">{word.en}</span>
              <SpeakButton onClick={() => speak(word.en)} />
              <span className="absolute bottom-4 text-base font-bold text-ink-soft">👆 Çevir · Flip</span>
            </div>
            <div className="flip-face flip-back flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border-[6px] border-lion-red bg-sun-light p-6 shadow-xl">
              <span className="emoji text-7xl">{word.emoji}</span>
              <span className="text-2xl font-bold text-ink-soft">{word.en} =</span>
              <span className="text-center text-5xl font-extrabold break-words sm:text-6xl">{word.tr}</span>
              <span className="rounded-full bg-white/70 px-4 py-1 text-base font-bold text-ink-soft">{word.category}</span>
            </div>
          </div>
        </div>

        <div className={`flex w-full max-w-sm gap-3 transition-opacity ${flipped ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <KidButton color="white" className="flex-1 !px-3 text-lg" onClick={() => answer(false)}>
            🤔 Tekrar bakayım
          </KidButton>
          <KidButton color="leaf" className="flex-1 !px-3 text-lg" onClick={() => answer(true)}>
            👍 Biliyorum!
          </KidButton>
        </div>
      </div>
    </div>
  )
}
