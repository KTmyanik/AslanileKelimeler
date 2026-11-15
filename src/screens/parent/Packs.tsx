import { useState } from 'react'
import { normalizeEn } from '../../lib/learning'
import { PACKS, packGoal, type Pack } from '../../lib/packs'
import { useStore } from '../../store'

export function Packs() {
  const words = useStore((s) => s.words)
  const addWords = useStore((s) => s.addWords)
  const [msg, setMsg] = useState<string | null>(null)
  const existing = new Set(words.map((w) => normalizeEn(w.en)))
  const goal = packGoal(words)

  const missing = (p: Pack) => p.words.filter((w) => !existing.has(normalizeEn(w.en)))

  const add = (packs: Pack[]) => {
    let added = 0
    for (const p of packs) added += addWords(missing(p), p.name).added
    setMsg(added ? `${added} kelime eklendi.` : 'Bu kelimelerin hepsi zaten vardı.')
    setTimeout(() => setMsg(null), 3000)
  }

  const left = PACKS.filter((p) => missing(p).length > 0)

  return (
    <div className="flex flex-col gap-4">
      {msg && <div className="rounded-2xl bg-leaf/15 p-4 font-bold text-leaf-dark">✅ {msg}</div>}

      <section className="card-soft flex flex-col gap-3 p-5">
        <h2 className="text-lg font-extrabold">🎯 Paket hedefi</h2>
        <GoalBar goal={goal} />
        <p className="text-sm font-semibold text-ink-soft">
          Paketler, Cambridge Pre A1 Starters sınavının konularından seçilmiş {goal.total} kelimedir; resmî listenin tamamı
          değildir. Kelime, hangi listede olursa olsun öğrenilince hedefe sayılır.
        </p>
        {left.length > 0 && (
          <button
            onClick={() => add(left)}
            className="btn-3d self-start rounded-xl px-5 py-2 font-extrabold [--c:var(--color-sun)] [--s:var(--color-sun-dark)]"
          >
            Tüm paketleri ekle
          </button>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {PACKS.map((p) => {
          const need = missing(p).length
          return (
            <div key={p.id} className="card-soft flex flex-col gap-2 !rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className="emoji text-4xl">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-extrabold">{p.name}</div>
                  <div className="text-sm font-bold text-ink-soft">
                    {p.words.length} kelime{need < p.words.length ? ` · ${p.words.length - need} tanesi zaten var` : ''}
                  </div>
                </div>
                <button
                  disabled={!need}
                  onClick={() => add([p])}
                  className="btn-3d rounded-xl px-4 py-2 font-extrabold text-white disabled:opacity-50 [--c:var(--color-leaf)] [--s:var(--color-leaf-dark)]"
                >
                  {need ? 'Ekle' : 'Eklendi ✓'}
                </button>
              </div>
              <p className="text-sm font-semibold text-ink-soft">
                {p.words.map((w) => w.en).join(', ')}
              </p>
            </div>
          )
        })}
      </section>
    </div>
  )
}

export function GoalBar({ goal }: { goal: { learned: number; added: number; total: number } }) {
  const pct = (n: number) => `${goal.total ? (n / goal.total) * 100 : 0}%`
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm font-bold">
        <span>
          {goal.learned}/{goal.total} öğrenildi
        </span>
        <span className="text-ink-soft">{goal.added} eklendi</span>
      </div>
      <div className="relative h-5 overflow-hidden rounded-full bg-cream">
        <div className="absolute inset-y-0 left-0 rounded-full bg-sky/40" style={{ width: pct(goal.added) }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-leaf" style={{ width: pct(goal.learned) }} />
      </div>
    </div>
  )
}
