import { useEffect, useState } from 'react'
import { KidButton, LionTalk, ProgressDots, TopBar } from '../components/ui'
import { celebrate } from '../lib/celebrate'
import { distractors, shuffle } from '../lib/learning'
import { sfx } from '../lib/sfx'
import { speak } from '../lib/speech'
import { useStore } from '../store'
import type { Word } from '../types'

interface Step {
  target: Word
  options: Word[]
}

function buildQueue(): Step[] {
  const { daily, words } = useStore.getState()
  if (!daily) return []
  const byId = new Map(words.map((word) => [word.id, word]))
  const pending = daily.wordIds.filter((id) => !daily.doneIds.includes(id))
  return pending.flatMap((id) => {
    const target = byId.get(id)
    if (!target) return []
    const count = Math.min(4, words.length)
    return [{ target, options: shuffle([target, ...distractors(words, target, count - 1)]) }]
  })
}

export function DailyMission({ onHome }: { onHome: () => void }) {
  const ensureDaily = useStore((s) => s.ensureDaily)
  const markDailyDone = useStore((s) => s.markDailyDone)
  const recordAnswer = useStore((s) => s.recordAnswer)
  const finishSession = useStore((s) => s.finishSession)
  const daily = useStore((s) => s.daily)
  const words = useStore((s) => s.words)
  const [steps, setSteps] = useState<Step[]>([])
  const [ready, setReady] = useState(false)
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    ensureDaily()
    const queue = buildQueue()
    setSteps(queue)
    setDone(queue.length === 0)
    setReady(true)
  }, [ensureDaily])

  const ids = daily?.wordIds.filter((id) => words.some((word) => word.id === id)) ?? []
  const finished = daily?.doneIds.filter((id) => ids.includes(id)).length ?? 0

  if (!ready) return null

  if (!ids.length) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
        <TopBar title="Bugünün görevi" subtitle="Today's job" onBack={onHome} />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <LionTalk mood="think" text={<span>Bugün için kelime yok.<br />No words today!</span>} />
        </div>
      </div>
    )
  }

  const finish = (nextScore: number, total: number) => {
    finishSession(nextScore === total && total > 0)
    sfx.win()
    celebrate(true)
    setScore(nextScore)
    setDone(true)
  }

  const onSolved = (firstTry: boolean) => {
    const next = score + (firstTry ? 1 : 0)
    if (idx + 1 >= steps.length) {
      finish(next, steps.length)
      return
    }
    setScore(next)
    setIdx((i) => i + 1)
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
        <TopBar title="Bugünün görevi" subtitle={`${finished}/${ids.length}`} onBack={onHome} />
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <LionTalk mood="cheer" text={<span>Bugün tamam!<br />All done for today!</span>} />
          <p className="text-2xl font-extrabold text-leaf">
            {finished}/{ids.length}
          </p>
          {score > 0 && <p className="font-bold text-ink-soft">İlk denemede {score} yıldız</p>}
          <KidButton onClick={onHome}>🏠 Ana Sayfa</KidButton>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <TopBar title="Bugünün görevi" subtitle={`${finished}/${ids.length}`} onBack={onHome} />
      <ProgressDots total={steps.length} current={idx} />
      <StepView
        key={steps[idx].target.id}
        step={steps[idx]}
        onMiss={() => recordAnswer(steps[idx].target.id, false)}
        onSolved={(firstTry) => {
          markDailyDone(steps[idx].target.id)
          if (firstTry) recordAnswer(steps[idx].target.id, true)
          onSolved(firstTry)
        }}
      />
    </div>
  )
}

function StepView({
  step,
  onSolved,
  onMiss,
}: {
  step: Step
  onSolved: (firstTry: boolean) => void
  onMiss: () => void
}) {
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [solved, setSolved] = useState(false)

  const choose = (word: Word) => {
    if (solved || wrongIds.includes(word.id)) return
    const firstTry = wrongIds.length === 0
    if (word.id !== step.target.id) {
      sfx.wrong()
      if (firstTry) onMiss()
      setWrongIds((ids) => [...ids, word.id])
      return
    }
    sfx.correct()
    setSolved(true)
    if (firstTry) celebrate()
    window.setTimeout(() => speak(step.target.en), 200)
    window.setTimeout(() => onSolved(firstTry), 1200)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
      <div className="text-center">
        <div className="emoji text-8xl">{step.target.emoji}</div>
        <div className="mt-2 text-4xl font-extrabold">{step.target.tr || '???'}</div>
        <div className="mt-1 text-lg font-bold text-ink-soft">{solved ? step.target.en : 'İngilizcesini seç'}</div>
      </div>
      <div className="grid w-full max-w-xl grid-cols-2 gap-3">
        {step.options.map((word) => {
          const isWrong = wrongIds.includes(word.id)
          const isRight = solved && word.id === step.target.id
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
