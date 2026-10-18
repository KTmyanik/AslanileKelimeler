import { useState } from 'react'
import { GameResult, KidButton, LionTalk, TopBar } from '../components/ui'
import { celebrate } from '../lib/celebrate'
import { sameOrder, sentenceTokens } from '../lib/sentence'
import { shuffle } from '../lib/learning'
import { sfx } from '../lib/sfx'
import { useStore } from '../store'
import type { Sentence } from '../types'

const ROUNDS = 6

interface Tile {
  key: string
  text: string
}

function playable(): Sentence[] {
  return shuffle(useStore.getState().sentences)
    .filter((sentence) => sentenceTokens(sentence.en).length >= 2)
    .slice(0, ROUNDS)
}

function deal(tokens: string[]): Tile[] {
  const tiles = tokens.map((text, index) => ({ key: `${index}-${text}`, text }))
  const bank = shuffle(tiles)
  if (bank.length > 1 && bank.every((tile, index) => tile.text === tokens[index])) {
    return [bank[1], bank[0], ...bank.slice(2)]
  }
  return bank
}

export function SentenceGame({ onHome }: { onHome: () => void }) {
  const grantStars = useStore((s) => s.grantStars)
  const finishSession = useStore((s) => s.finishSession)
  const [rounds, setRounds] = useState(playable)
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (!rounds.length) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
        <TopBar title="Cümle Kur" subtitle="Make a sentence" onBack={onHome} />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <LionTalk mood="think" text={<span>Henüz cümle yok.<br />No sentences yet!</span>} />
          <p className="max-w-md text-lg font-semibold text-ink-soft">
            Annen ya da baban Ebeveyn bölümündeki Cümleler’den kısa bir İngilizce cümle ekleyebilir.
          </p>
          <KidButton onClick={onHome}>🏠 Ana Sayfa</KidButton>
        </div>
      </div>
    )
  }

  const restart = () => {
    setRounds(playable())
    setIdx(0)
    setScore(0)
    setDone(false)
  }

  const onSolved = (firstTry: boolean) => {
    if (firstTry) grantStars(1)
    const next = score + (firstTry ? 1 : 0)
    setScore(next)
    if (idx + 1 >= rounds.length) {
      finishSession(next === rounds.length)
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
        <TopBar title="Cümle Kur" subtitle="Make a sentence" onBack={onHome} />
        <GameResult correct={score} total={rounds.length} starsEarned={score} onAgain={restart} onHome={onHome} />
      </>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <TopBar title="Cümle Kur" subtitle="Make a sentence" onBack={onHome} />
      <Round key={rounds[idx].id} sentence={rounds[idx]} index={idx} total={rounds.length} onSolved={onSolved} />
    </div>
  )
}

function Round({
  sentence,
  index,
  total,
  onSolved,
}: {
  sentence: Sentence
  index: number
  total: number
  onSolved: (firstTry: boolean) => void
}) {
  const tokens = sentenceTokens(sentence.en)
  const [bank, setBank] = useState(() => deal(tokens))
  const [placed, setPlaced] = useState<Tile[]>([])
  const [wrong, setWrong] = useState(false)
  const [missed, setMissed] = useState(false)
  const [solved, setSolved] = useState(false)

  const take = (tile: Tile) => {
    if (solved) return
    setWrong(false)
    setBank((rows) => rows.filter((item) => item.key !== tile.key))
    setPlaced((rows) => [...rows, tile])
  }

  const putBack = (tile: Tile) => {
    if (solved) return
    setWrong(false)
    setPlaced((rows) => rows.filter((item) => item.key !== tile.key))
    setBank((rows) => [...rows, tile])
  }

  const check = () => {
    if (solved || placed.length !== tokens.length) return
    if (!sameOrder(placed.map((tile) => tile.text), tokens)) {
      sfx.wrong()
      setWrong(true)
      setMissed(true)
      return
    }
    sfx.correct()
    setSolved(true)
    if (!missed) celebrate()
    window.setTimeout(() => onSolved(!missed), 1100)
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <p className="text-center text-sm font-bold text-ink-soft">
        {index + 1}/{total}
      </p>
      <div className="text-center">
        <div className="text-3xl font-extrabold">{sentence.tr || 'Kelimeleri sıraya diz'}</div>
        <div className="mt-1 text-lg font-bold text-ink-soft">{sentence.tr ? 'Put the words in order' : 'In the right order'}</div>
      </div>

      <div
        className={`card-soft flex min-h-28 flex-wrap content-start gap-2 p-4 ${wrong ? 'animate-shake' : ''} ${solved ? 'bg-leaf/10' : ''}`}
      >
        {placed.length === 0 && <span className="font-bold text-ink-soft">Cümle buraya gelsin</span>}
        {placed.map((tile) => (
          <Chip key={tile.key} text={tile.text} onClick={() => putBack(tile)} done={solved} />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {bank.map((tile) => (
          <Chip key={tile.key} text={tile.text} onClick={() => take(tile)} />
        ))}
      </div>

      <KidButton color="leaf" className="self-center" disabled={placed.length !== tokens.length || solved} onClick={check}>
        {solved ? 'Doğru!' : 'Kontrol et'}
      </KidButton>
    </div>
  )
}

function Chip({ text, onClick, done }: { text: string; onClick: () => void; done?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={done}
      className={`btn-3d rounded-2xl px-4 py-2 text-xl font-extrabold ${
        done
          ? 'text-white [--c:var(--color-leaf)] [--s:var(--color-leaf-dark)]'
          : 'text-ink [--c:white] [--s:rgb(74_44_22/0.16)]'
      }`}
    >
      {text}
    </button>
  )
}
