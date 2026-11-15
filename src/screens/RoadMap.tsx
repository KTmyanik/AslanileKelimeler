import { Lion } from '../components/Lion'
import { TopBar } from '../components/ui'
import { statusOf } from '../lib/learning'
import { packGoal, packOfList } from '../lib/packs'
import { listsByAge, useStore } from '../store'
import type { Word } from '../types'

function starsFor(learned: number, total: number): number {
  const r = total ? learned / total : 0
  return r >= 1 ? 3 : r >= 2 / 3 ? 2 : r >= 1 / 3 ? 1 : 0
}

function iconOf(list: string, words: Word[]): string {
  return packOfList(list)?.emoji ?? words[0]?.emoji ?? '📘'
}

export function RoadMap({ onHome }: { onHome: () => void }) {
  const words = useStore((s) => s.words)
  const activeList = useStore((s) => s.activeList)
  const setActiveList = useStore((s) => s.setActiveList)
  const outfit = useStore((s) => s.outfit)
  const goal = packGoal(words)

  const stops = listsByAge(words).map((list) => {
    const ws = words.filter((w) => w.list === list)
    const learned = ws.filter((w) => statusOf(w) === 'learned').length
    return { list, icon: iconOf(list, ws), learned, total: ws.length, stars: starsFor(learned, ws.length) }
  })
  const done = stops.filter((s) => s.stars === 3).length

  const pick = (list: string | null) => {
    setActiveList(list)
    onHome()
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col pb-10">
      <TopBar title="Yol Haritası" subtitle={`${done}/${stops.length} durak tamam`} onBack={onHome} />

      {goal.added > 0 && (
        <section className="card-soft mx-4 mt-3 flex items-center gap-3 p-4">
          <span className="emoji text-4xl">🎯</span>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold">Büyük hedef · Big goal</div>
            <div className="mt-1 h-4 overflow-hidden rounded-full bg-cream">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sun to-leaf"
                style={{ width: `${Math.max(3, (goal.learned / goal.total) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xl font-extrabold text-leaf">
            {goal.learned}
            <span className="text-base text-ink-soft">/{goal.total}</span>
          </span>
        </section>
      )}

      <p className="mt-4 text-center font-bold text-ink-soft">Bir durağa dokun, oyunlar o kelimelerle oynansın.</p>

      <div className="relative mt-4 flex flex-col gap-6 px-4">
        <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 border-l-[6px] border-dashed border-sun" />
        {stops.map((s, i) => {
          const active = activeList === s.list
          return (
            <button
              key={s.list}
              onClick={() => pick(s.list)}
              className={`relative flex w-3/5 flex-col items-center gap-1 ${i % 2 ? 'self-end' : 'self-start'}`}
            >
              {active && (
                <Lion outfit={outfit} size={64} className="absolute -top-10 left-1/2 z-10 -translate-x-1/2" />
              )}
              <span
                className={`btn-3d emoji grid size-24 place-items-center rounded-full text-5xl ${
                  s.stars === 3
                    ? '[--c:var(--color-leaf)] [--s:var(--color-leaf-dark)]'
                    : active
                      ? '[--c:var(--color-sun)] [--s:var(--color-sun-dark)]'
                      : '[--c:white] [--s:rgb(74_44_22/0.15)]'
                } ${active ? 'ring-4 ring-lion-red ring-offset-4 ring-offset-cream' : ''}`}
              >
                {s.icon}
              </span>
              <span className="rounded-full bg-white/90 px-3 py-0.5 text-center text-lg leading-tight font-extrabold shadow-sm">
                {s.list}
              </span>
              <span className="emoji text-xl tracking-wider">
                {'⭐'.repeat(s.stars)}
                <span className="opacity-25 grayscale">{'⭐'.repeat(3 - s.stars)}</span>
              </span>
              <span className="text-sm font-bold text-ink-soft">
                {s.learned}/{s.total} kelime
              </span>
            </button>
          )
        })}
        <button onClick={() => pick(null)} className="relative flex flex-col items-center gap-1 self-center">
          <span
            className={`btn-3d emoji grid size-20 place-items-center rounded-full text-4xl [--c:var(--color-grape)] [--s:var(--color-grape-dark)] ${
              activeList === null ? 'ring-4 ring-lion-red ring-offset-4 ring-offset-cream' : ''
            }`}
          >
            🌈
          </span>
          <span className="rounded-full bg-white/90 px-3 py-0.5 text-lg font-extrabold shadow-sm">Hepsi · All</span>
        </button>
      </div>
    </div>
  )
}
