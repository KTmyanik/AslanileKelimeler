import { useEffect, useRef, useState } from 'react'
import { Lion } from '../components/Lion'
import { KidButton, LionTalk, SpeakButton, TopBar } from '../components/ui'
import { celebrate } from '../lib/celebrate'
import { distractors, shuffle } from '../lib/learning'
import { getPool } from '../lib/pool'
import { sfx } from '../lib/sfx'
import { speak } from '../lib/speech'
import { useStore } from '../store'
import type { LionMood, Word } from '../types'

const LIMIT = 60

interface Round {
  target: Word
  options: Word[]
}

function canPlay(): boolean {
  const { all } = getPool()
  return all.length >= 2
}

function nextRound(avoidId?: string): Round | null {
  const { pool, all } = getPool()
  const source = pool.length ? pool : all
  if (!canPlay() || !source.length) return null
  let target = source[Math.floor(Math.random() * source.length)]
  if (source.length > 1 && target.id === avoidId) target = source.find((word) => word.id !== avoidId) ?? target
  return { target, options: shuffle([target, ...distractors(all, target, Math.min(3, all.length - 1))]) }
}

export function RecordGame({ onHome }: { onHome: () => void }) {
  const best = useStore((s) => s.listenBest)
  const setListenBest = useStore((s) => s.setListenBest)
  const recordAnswer = useStore((s) => s.recordAnswer)
  const finishSession = useStore((s) => s.finishSession)
  const outfit = useStore((s) => s.outfit)
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready')
  const [round, setRound] = useState<Round | null>(null)
  const [roundKey, setRoundKey] = useState(0)
  const [time, setTime] = useState(LIMIT)
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [mood, setMood] = useState<LionMood>('happy')
  const [isBest, setIsBest] = useState(false)
  const scoreRef = useRef(0)
  const missesRef = useRef(0)
  const ended = useRef(false)
  const stopRef = useRef(() => {})

  const stop = () => {
    if (ended.current) return
    ended.current = true
    const finalScore = scoreRef.current
    finishSession(missesRef.current === 0 && finalScore > 0)
    const beat = finalScore > useStore.getState().listenBest
    if (beat) {
      setListenBest(finalScore)
      setIsBest(true)
      celebrate(true)
    }
    sfx.win()
    setPhase('done')
  }
  stopRef.current = stop

  useEffect(() => {
    if (phase !== 'play') return
    const endAt = Date.now() + LIMIT * 1000
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setTime((current) => (current === left ? current : left))
      if (left <= 0) {
        window.clearInterval(id)
        stopRef.current()
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [phase])

  const start = () => {
    const first = nextRound()
    if (!first) return
    ended.current = false
    scoreRef.current = 0
    missesRef.current = 0
    setScore(0)
    setMisses(0)
    setTime(LIMIT)
    setMood('happy')
    setIsBest(false)
    setRound(first)
    setPhase('play')
  }

  if (!canPlay()) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
        <TopBar title="Rekor" subtitle="Your best" onBack={onHome} />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <LionTalk mood="think" text={<span>Bu oyun için en az 2 kelime lazım.<br />Need more words!</span>} />
          <KidButton onClick={onHome}>🏠 Ana Sayfa</KidButton>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <TopBar
        title="Rekor"
        subtitle={phase === 'play' ? 'Dinle ve seç' : `En iyi ${best}`}
        onBack={onHome}
        right={
          phase === 'play' ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 text-xl font-extrabold text-leaf">{score}</span>
              <Timer time={time} />
            </div>
          ) : undefined
        }
      />
      {phase === 'ready' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <LionTalk mood="happy" text={<span>1 dakika!<br />One minute!</span>} />
          <p className="text-xl font-bold text-ink-soft">Doğru resmi seç. En iyi skorun: {best}</p>
          <KidButton color="red" onClick={start}>
            Başla
          </KidButton>
        </div>
      )}
      {phase === 'play' && round && (
        <Play
          key={roundKey}
          round={round}
          outfit={outfit}
          mood={mood}
          onAnswer={(ok) => {
            if (ended.current) return
            recordAnswer(round.target.id, ok)
            if (ok) {
              scoreRef.current += 1
              setScore(scoreRef.current)
              sfx.correct()
              setMood('cheer')
              celebrate()
            } else {
              missesRef.current += 1
              setMisses(missesRef.current)
              sfx.wrong()
              setMood('sad')
            }
            window.setTimeout(() => {
              if (ended.current) return
              const following = nextRound(round.target.id)
              if (!following) return
              setMood('happy')
              setRoundKey((n) => n + 1)
              setRound(following)
            }, ok ? 650 : 450)
          }}
        />
      )}
      {phase === 'done' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <LionTalk
            mood="cheer"
            text={
              <span>
                {isBest ? 'Yeni rekor!' : 'Süre bitti!'}
                <br />
                {isBest ? 'New record!' : "Time's up!"}
              </span>
            }
          />
          <div className="card-soft flex items-center gap-8 px-8 py-5">
            <div>
              <div className="text-4xl font-extrabold text-leaf">{score}</div>
              <div className="font-bold text-ink-soft">Bugün</div>
            </div>
            <div className="h-12 w-px bg-ink/10" />
            <div>
              <div className="text-4xl font-extrabold text-sun-dark">{Math.max(best, score)}</div>
              <div className="font-bold text-ink-soft">En iyi</div>
            </div>
          </div>
          {misses > 0 && <p className="font-bold text-ink-soft">{misses} yanlış</p>}
          <div className="flex flex-wrap justify-center gap-3">
            <KidButton color="red" onClick={start}>
              🔁 Tekrar
            </KidButton>
            <KidButton onClick={onHome}>🏠 Ana Sayfa</KidButton>
          </div>
        </div>
      )}
    </div>
  )
}

function Timer({ time }: { time: number }) {
  return (
    <div className={`rounded-full bg-white px-4 py-1.5 text-2xl font-extrabold shadow ${time <= 10 ? 'text-lion-red' : 'text-ink'}`}>
      {time}
    </div>
  )
}

function Play({
  round,
  outfit,
  mood,
  onAnswer,
}: {
  round: Round
  outfit: 'none' | 'scarf' | 'crown'
  mood: LionMood
  onAnswer: (ok: boolean) => void
}) {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => speak(round.target.en), 250)
    return () => window.clearTimeout(t)
  }, [round])

  return (
    <div className="flex flex-1 flex-col items-center gap-5 px-4 py-4">
      <div className="flex items-center gap-3">
        <Lion mood={mood} outfit={outfit} size={90} />
        <SpeakButton size="lg" onClick={() => speak(round.target.en)} />
        <div>
          <div className="text-2xl font-extrabold">{mood === 'sad' ? 'Olmadı' : mood === 'cheer' ? 'Doğru!' : 'Dinle ve seç'}</div>
          <div className="text-lg font-bold text-ink-soft">{mood === 'cheer' ? round.target.en : 'Listen and choose'}</div>
        </div>
      </div>
      <div className="grid w-full max-w-xl grid-cols-2 gap-3">
        {round.options.map((word) => {
          const show = locked && word.id === round.target.id
          return (
            <button
              key={word.id}
              disabled={locked}
              onClick={() => {
                setLocked(true)
                onAnswer(word.id === round.target.id)
              }}
              className={`card-soft flex aspect-square flex-col items-center justify-center gap-2 border-[5px] p-3 ${
                show ? 'border-leaf bg-leaf/10' : 'border-transparent hover:border-sun'
              }`}
            >
              <span className="emoji text-7xl">{word.emoji}</span>
              <span className="text-xl font-bold text-ink-soft">{word.tr}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
