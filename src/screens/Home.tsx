import { useEffect, useState } from 'react'
import { Lion } from '../components/Lion'
import { SpeechBubble, StarCounter } from '../components/ui'
import { statusOf, wordsInList } from '../lib/learning'
import { markPortMoveDone, portMovePending } from '../migrate'
import { useLists, useStore } from '../store'
import type { Screen } from '../types'

const GREETINGS = [
  ["Let's learn!", 'Hadi öğrenelim!'],
  ['Hello, friend!', 'Merhaba arkadaşım!'],
  ['You can do it!', 'Sen yaparsın!'],
  ['Ready? Roar!', 'Hazır mısın? Kükre!'],
]

const TILES: { screen: Screen; emoji: string; tr: string; en: string; color: string; wide?: boolean }[] = [
  { screen: 'cards', emoji: '🃏', tr: 'Kartlar', en: 'Cards', color: '[--c:var(--color-sun)] [--s:var(--color-sun-dark)] text-ink' },
  { screen: 'listen', emoji: '👂', tr: 'Dinle ve Seç', en: 'Listen', color: '[--c:var(--color-lion-red)] [--s:var(--color-lion-red-dark)] text-white' },
  { screen: 'match', emoji: '🔗', tr: 'Eşleştir', en: 'Match', color: '[--c:var(--color-tangerine)] [--s:var(--color-tangerine-dark)] text-white' },
  { screen: 'memory', emoji: '🧩', tr: 'Hafıza', en: 'Memory', color: '[--c:var(--color-sky)] [--s:var(--color-sky-dark)] text-white' },
  { screen: 'spell', emoji: '✏️', tr: 'Yaz', en: 'Write', color: '[--c:var(--color-leaf)] [--s:var(--color-leaf-dark)] text-white', wide: true },
  { screen: 'sentence', emoji: '🔤', tr: 'Cümle Kur', en: 'Sentence', color: '[--c:var(--color-grape)] [--s:var(--color-grape-dark)] text-white' },
  { screen: 'hint', emoji: '💡', tr: 'İpucu', en: 'Clue', color: '[--c:var(--color-sky)] [--s:var(--color-sky-dark)] text-white' },
  { screen: 'record', emoji: '⏱️', tr: 'Rekor', en: 'Best', color: '[--c:var(--color-lion-red)] [--s:var(--color-lion-red-dark)] text-white', wide: true },
]

export function Home({ go }: { go: (s: Screen) => void }) {
  const words = useStore((s) => s.words)
  const childName = useStore((s) => s.childName)
  const outfit = useStore((s) => s.outfit)
  const activeList = useStore((s) => s.activeList)
  const setActiveList = useStore((s) => s.setActiveList)
  const earned = useStore((s) => s.earnedBadges.length)
  const lists = useLists()
  const daily = useStore((s) => s.daily)
  const ensureDaily = useStore((s) => s.ensureDaily)

  useEffect(() => {
    ensureDaily()
  }, [ensureDaily, words.length])

  const [[en, tr]] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
  const [showMove, setShowMove] = useState(portMovePending)
  const scoped = wordsInList(words, activeList)
  const learned = scoped.filter((w) => statusOf(w) === 'learned').length
  const pct = scoped.length ? Math.round((learned / scoped.length) * 100) : 0
  const missionIds = (daily?.wordIds ?? []).filter((id) => words.some((word) => word.id === id))
  const missionDone = (daily?.doneIds ?? []).filter((id) => missionIds.includes(id)).length
  const missionReady = missionIds.length > 0 && missionDone >= missionIds.length

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pt-4 pb-10 sm:px-6">
      <header className="flex items-center justify-between">
        <StarCounter />
        <button
          onClick={() => go('parent')}
          className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-ink-soft shadow-sm"
        >
          👨‍👩‍👧 Ebeveyn
        </button>
      </header>

      {showMove && (
        <section className="card-soft flex flex-col gap-3 p-5">
          <p className="text-lg font-extrabold">Eklediğiniz kelimeler duruyor</p>
          <p className="font-semibold text-ink-soft">
            Port değişince tarayıcı onları yeni adreste görmedi. Eski adresteki kayıt kopyalandıysa bu sayfayı yenileyince liste geri gelir.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => location.reload()}
              className="btn-3d rounded-xl px-5 py-2 font-extrabold text-ink [--c:var(--color-sun)] [--s:var(--color-sun-dark)]"
            >
              Sayfayı yenile
            </button>
            <button
              onClick={() => (markPortMoveDone(), setShowMove(false))}
              className="rounded-xl px-4 py-2 font-bold text-ink-soft"
            >
              Gizle
            </button>
          </div>
        </section>
      )}

      <section className="flex items-center justify-center gap-2 sm:gap-6">
        <Lion mood="happy" outfit={outfit} size={170} className="shrink-0" />
        <SpeechBubble>
          <div className="text-2xl sm:text-3xl">
            {childName ? `${tr.replace('!', '')}, ${childName}!` : tr}
          </div>
          <div className="text-lg text-lion-red sm:text-xl">{en}</div>
        </SpeechBubble>
      </section>

      <section className="card-soft p-5">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-xl font-extrabold">Öğrendiğin kelimeler</span>
          <span className="text-2xl font-extrabold text-leaf">
            {learned}
            <span className="text-lg text-ink-soft">/{scoped.length}</span>
          </span>
        </div>
        <div className="h-5 overflow-hidden rounded-full bg-sun-light/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sun to-leaf transition-all duration-700"
            style={{ width: `${Math.max(pct, 3)}%` }}
          />
        </div>
        {lists.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[null, ...lists].map((l) => (
              <button
                key={l ?? '__all'}
                onClick={() => setActiveList(l)}
                className={`rounded-full px-4 py-1.5 text-base font-bold transition ${
                  activeList === l ? 'bg-lion-red text-white shadow-md' : 'bg-cream text-ink-soft'
                }`}
              >
                {l ?? '🌈 Hepsi'}
              </button>
            ))}
          </div>
        )}
      </section>

      {missionIds.length > 0 && (
        <button
          onClick={() => go('daily')}
          className="btn-3d flex items-center gap-4 rounded-[2rem] px-5 py-4 text-left text-ink [--c:white] [--s:rgb(74_44_22/0.12)]"
        >
          <span className="emoji text-5xl">{missionReady ? '✅' : '🎯'}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-2xl font-extrabold">Bugünün görevi</span>
            <span className="block font-bold text-ink-soft">
              {missionReady ? 'Bugün bitti · All done' : "Today's job"}
            </span>
          </span>
          <span className="text-3xl font-extrabold text-leaf">
            {missionDone}/{missionIds.length}
          </span>
        </button>
      )}

      <section className="grid grid-cols-2 gap-4">
        {TILES.map((t) => (
          <button
            key={t.screen}
            onClick={() => go(t.screen)}
            className={`btn-3d flex items-center justify-center gap-1 rounded-[2rem] p-3 ${t.color} ${
              t.wide ? 'col-span-2 flex-row gap-4 py-5' : 'aspect-[5/4] flex-col'
            }`}
          >
            <span className="emoji text-6xl drop-shadow sm:text-7xl">{t.emoji}</span>
            <span className="text-2xl font-extrabold sm:text-3xl">{t.tr}</span>
            <span className="text-base font-bold opacity-80">{t.en}</span>
          </button>
        ))}
      </section>

      <button
        onClick={() => go('rewards')}
        className="btn-3d flex items-center justify-center gap-3 rounded-[2rem] p-4 text-white [--c:var(--color-grape)] [--s:var(--color-grape-dark)]"
      >
        <span className="emoji text-5xl">🏅</span>
        <span className="text-left">
          <span className="block text-2xl font-extrabold">Ödüllerim</span>
          <span className="block text-base font-bold opacity-85">My rewards · {earned} rozet</span>
        </span>
      </button>
    </div>
  )
}
