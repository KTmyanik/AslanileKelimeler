import { useState } from 'react'
import { normalizeEn } from '../../lib/learning'
import { BOOK, PACKS, TAKEOVER_LISTS, packGoal, type Goal, type Pack } from '../../lib/packs'
import { SEED_LIST } from '../../lib/seed'
import { useStore } from '../../store'

export function Packs() {
  const words = useStore((s) => s.words)
  const addWords = useStore((s) => s.addWords)
  const addPack = useStore((s) => s.addPack)
  const [msg, setMsg] = useState<string | null>(null)
  const listOf = new Map(words.map((w) => [normalizeEn(w.en), w.list]))

  const flash = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 4000)
  }

  /** Words of a book unit not yet in that unit's list (missing, or still in a list it may take over). */
  const bookPending = (p: Pack) =>
    p.words.filter((w) => {
      const list = listOf.get(normalizeEn(w.en))
      return list === undefined || (list !== p.name && (TAKEOVER_LISTS.includes(list) || list === SEED_LIST))
    }).length
  const topicMissing = (p: Pack) => p.words.filter((w) => !listOf.has(normalizeEn(w.en)))

  const addBook = (packs: Pack[]) => {
    let added = 0
    let moved = 0
    for (const p of packs) {
      const r = addPack(p.words, p.name, TAKEOVER_LISTS)
      added += r.added
      moved += r.moved
    }
    flash(`${added} kelime eklendi${moved ? `, ${moved} kelime ilerlemesiyle birlikte üniteye taşındı` : ''}.`)
  }

  const addTopics = (packs: Pack[]) => {
    let added = 0
    for (const p of packs) added += addWords(topicMissing(p), p.name).added
    flash(added ? `${added} kelime eklendi.` : 'Bu kelimelerin hepsi zaten vardı.')
  }

  const bookLeft = BOOK.packs.filter((p) => bookPending(p) > 0)
  const topicsLeft = PACKS.filter((p) => topicMissing(p).length > 0)

  return (
    <div className="flex flex-col gap-4">
      {msg && <div className="rounded-2xl bg-leaf/15 p-4 font-bold text-leaf-dark">✅ {msg}</div>}

      <section className="card-soft flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="emoji text-4xl">📘</span>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold">{BOOK.title}</h2>
            <p className="text-sm font-bold text-ink-soft">{BOOK.subtitle} · 9 ünite</p>
          </div>
        </div>
        <GoalBar goal={packGoal(words, BOOK.packs)} />
        <p className="text-sm font-semibold text-ink-soft">
          Kelimeler, Cambridge'in bu kitap için yayımladığı içerik tablosundaki ünite anahtar kelimeleridir. Türkçe anlamları
          ve resimleri biz ekledik; Kelimeler bölümünden değiştirebilirsiniz. Okul hangi ünitedeyse o üniteyi eklemeniz
          yeterli. Başlangıç listesinde ya da konu paketlerinde zaten olan kelimeler ilerlemesiyle birlikte üniteye taşınır.
        </p>
        {bookLeft.length > 1 && (
          <button
            onClick={() => addBook(bookLeft)}
            className="btn-3d self-start rounded-xl px-5 py-2 font-extrabold [--c:var(--color-sun)] [--s:var(--color-sun-dark)]"
          >
            Bütün üniteleri ekle
          </button>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {BOOK.packs.map((p) => (
            <PackCard key={p.id} pack={p} pending={bookPending(p)} onAdd={() => addBook([p])} />
          ))}
        </div>
      </section>

      <section className="card-soft flex flex-col gap-3 p-5">
        <h2 className="text-lg font-extrabold">🧺 Ek konu paketleri</h2>
        <GoalBar goal={packGoal(words, PACKS)} />
        <p className="text-sm font-semibold text-ink-soft">
          Kitabın dışında, Cambridge Pre A1 Starters konularından seçilmiş kelimeler; resmî listenin tamamı değildir. Kitapta
          da olan kelimeler kitap ünitesinde kalır, buraya tekrar eklenmez.
        </p>
        {topicsLeft.length > 1 && (
          <button
            onClick={() => addTopics(topicsLeft)}
            className="btn-3d self-start rounded-xl px-5 py-2 font-extrabold [--c:var(--color-sun)] [--s:var(--color-sun-dark)]"
          >
            Tüm konu paketlerini ekle
          </button>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {PACKS.map((p) => (
            <PackCard key={p.id} pack={p} pending={topicMissing(p).length} onAdd={() => addTopics([p])} />
          ))}
        </div>
      </section>
    </div>
  )
}

function PackCard({ pack, pending, onAdd }: { pack: Pack; pending: number; onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-cream p-4">
      <div className="flex items-center gap-3">
        <span className="emoji text-4xl">{pack.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-lg leading-tight font-extrabold">{pack.name}</div>
          <div className="text-sm font-bold text-ink-soft">{pack.words.length} kelime</div>
        </div>
        <button
          disabled={!pending}
          onClick={onAdd}
          className="btn-3d rounded-xl px-4 py-2 font-extrabold text-white disabled:opacity-50 [--c:var(--color-leaf)] [--s:var(--color-leaf-dark)]"
        >
          {pending ? 'Ekle' : 'Eklendi ✓'}
        </button>
      </div>
      <p className="text-sm font-semibold text-ink-soft">{pack.words.map((w) => w.en).join(', ')}</p>
    </div>
  )
}

export function GoalBar({ goal }: { goal: Goal }) {
  const pct = (n: number) => `${goal.total ? (n / goal.total) * 100 : 0}%`
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm font-bold">
        <span>
          {goal.learned}/{goal.total} öğrenildi
        </span>
        <span className="text-ink-soft">{goal.added} eklendi</span>
      </div>
      <div className="relative h-5 overflow-hidden rounded-full bg-white">
        <div className="absolute inset-y-0 left-0 rounded-full bg-sky/40" style={{ width: pct(goal.added) }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-leaf" style={{ width: pct(goal.learned) }} />
      </div>
    </div>
  )
}
