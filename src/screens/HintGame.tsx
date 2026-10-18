import { useState } from 'react'
import { GameResult, KidButton, LionTalk, ProgressDots, SpeakButton, TopBar } from '../components/ui'
import { celebrate } from '../lib/celebrate'
import { clueFor, hintChoices } from '../lib/clue'
import { pickWords, statusOf } from '../lib/learning'
import { getPool } from '../lib/pool'
import { sfx } from '../lib/sfx'
import { speak } from '../lib/speech'
import { useStore } from '../store'
import type { Word } from '../types'

const ROUNDS = 6
const OPTIONS = 4

interface Round {
  target: Word
  options: Word[]
}

function buildRounds(): Round[] {
  const { pool, all } = getPool()
  const learned = pool.filter((word) => statusOf(word) === 'learned')
  return pickWords(learned, ROUNDS).map((target) => ({
    target,
    options: hintChoices(all, target, Math.min(OPTIONS, all.length)),
  }))
}

export function HintGame({ onHome }: { onHome: () => void }) {
  const recordAnswer = useStore((s) => s.recordAnswer)
  const finishSession = useStore((s) => s.finishSession)
  const [rounds, setRounds] = useState(buildRounds)
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (!rounds.length) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
        <TopBar title="İpucuyla Bul" subtitle="Find by clue" onBack={onHome} />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <LionTalk mood="think" text={<span>Önce birkaç kelime öğren.<br />Learn a few words first!</span>} />
          <p className="max-w-md text-lg font-semibold text-ink-soft">
            Bir kelime arka arkaya 3 kez doğru bilinince burada çıkar. Türkçesi gizlenir; resim ve İngilizce ipucu kalır.
          </p>
          <KidButton onClick={onHome}>🏠 Ana Sayfa</KidButton>
        </div>
      </div>
    )
  }

  const restart = () => {
    setRounds(buildRounds())
    setIdx(0)
    setScore(0)
    setDone(false)
  }

  const onSolved = (firstTry: boolean) => {
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
        <TopBar title="İpucuyla Bul" subtitle="Find by clue" onBack={onHome} />
        <GameResult correct={score} total={rounds.length} starsEarned={score} onAgain={restart} onHome={onHome} />
      </>
    )
  }

  const round = rounds[idx]
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <TopBar title="İpucuyla Bul" subtitle="Find by clue" onBack={onHome} />
      <ProgressDots total={rounds.length} current={idx} />
      <ClueRound
        key={round.target.id + idx}
        round={round}
        onMiss={() => recordAnswer(round.target.id, false)}
        onSolved={(firstTry) => {
          if (firstTry) recordAnswer(round.target.id, true)
          onSolved(firstTry)
        }}
      />
    </div>
  )
}

function ClueRound({
  round,
  onSolved,
  onMiss,
}: {
  round: Round
  onSolved: (firstTry: boolean) => void
  onMiss: () => void
}) {
  const clue = clueFor(round.target)
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [solved, setSolved] = useState(false)

  const choose = (word: Word) => {
    if (solved || wrongIds.includes(word.id)) return
    const firstTry = wrongIds.length === 0
    if (word.id !== round.target.id) {
      sfx.wrong()
      if (firstTry) onMiss()
      setWrongIds((ids) => [...ids, word.id])
      return
    }
    sfx.correct()
    setSolved(true)
    if (firstTry) celebrate()
    window.setTimeout(() => speak(round.target.en), 200)
    window.setTimeout(() => onSolved(firstTry), 1300)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-6">
      <div className="emoji text-8xl">{round.target.emoji}</div>
      <div className="flex items-center gap-3">
        <SpeakButton onClick={() => speak(clue)} />
        <div>
          <div className="text-2xl font-extrabold">{clue}</div>
          <div className="text-lg font-bold text-ink-soft">{solved ? `${round.target.en} = ${round.target.tr}` : 'Which word is it?'}</div>
        </div>
      </div>
      <div className="grid w-full max-w-xl grid-cols-2 gap-3">
        {round.options.map((word) => {
          const isWrong = wrongIds.includes(word.id)
          const isRight = solved && word.id === round.target.id
          return (
            <button
              key={word.id}
              onClick={() => choose(word)}
              className={`card-soft border-[5px] px-3 py-6 text-2xl font-extrabold ${
                isRight
                  ? 'border-leaf bg-leaf/10 text-leaf-dark'
                  : isWrong
                    ? 'animate-shake border-lion-red text-lion-red opacity-50'
                    : solved
                      ? 'border-transparent opacity-40'
                      : 'border-transparent hover:border-sun'
              }`}
            >
              {word.en}
            </button>
          )
        })}
      </div>
    </div>
  )
}
