import { useEffect, useState } from 'react'
import { Lion } from '../components/Lion'
import { SpeechBubble, StarCounter } from '../components/ui'
import { statusOf, todayKey, wordsInList } from '../lib/learning'
import { currentStreak, WEEK_GOAL, weekKeys } from '../lib/streak'
import { markPortMoveDone, portMovePending } from '../migrate'
import { useLists, useStore } from '../store'
import type { GameLevel, Screen } from '../types'

const LEVELS: { id: GameLevel; emoji: string; tr: string; en: string }[] = [
  { id: 'picture', emoji: '🖼️', tr: 'Resimli', en: 'With pictures' },
  { id: 'text', emoji: '🙈', tr: 'Resimsiz', en: 'No pictures' },
]

/** With more lists than this, the home page links to the road map instead of listing them all. */
const MAX_CHIPS = 6

const WEEKDAYS =['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

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
  const level = useStore((s) => s.level)
  const setLevel = useStore((s) => s.setLevel)
  const earned = useStore((s) => s.earnedBadges.length)
  const playDays = useStore((s) => s.playDays)
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
  const learnedAll = words.filter((w) => statusOf(w) === 'learned').length
  const pct = scoped.length ? Math.round((learned / scoped.length) * 100) : 0
  const missionIds = (daily?.wordIds ?? []).filter((id) => words.some((word) => word.id === id))
  const missionDone = (daily?.doneIds ?? []).filter((id) => missionIds.includes(id)).length
  const missionReady = missionIds.length > 0 && missionDone >= missionIds.length
  const streak = currentStreak(playDays)
  const today = todayKey()
  const week = weekKeys()
  const weekDone = week.filter((d) => playDays.includes(d)).length
  const playedToday = playDays.includes(today)

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
        {lists.length > MAX_CHIPS && (
          <button
            onClick={() => go('map')}
            className="mt-4 flex w-full items-center gap-2 rounded-2xl bg-cream px-4 py-2.5 text-left font-bold text-ink-soft"
          >
            <span className="emoji text-2xl">🗺️</span>
            <span className="min-w-0 flex-1 truncate">
              Şu an: <span className="text-ink">{activeList ?? '🌈 Hepsi'}</span>
            </span>
            <span className="text-lion-red">Değiştir ›</span>
          </button>
        )}
        {lists.length > 1 && lists.length <= MAX_CHIPS && (
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

      <section className="card-soft flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className={`emoji text-5xl ${streak ? '' : 'opacity-30 grayscale'}`}>🔥</span>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-extrabold">
              {streak ? `${streak} gün seri!` : 'Seriye başla!'}
            </div>
            <div className="font-bold text-ink-soft">
              {streak && !playedToday ? 'Bugün oyna, seri bozulmasın!' : streak ? `${streak} days in a row` : 'Play today to start'}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-extrabold ${weekDone >= WEEK_GOAL ? 'text-leaf' : 'text-sun-dark'}`}>
              {weekDone}/{WEEK_GOAL}
            </div>
            <div className="text-sm font-bold text-ink-soft">bu hafta</div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d, i) => {
            const played = playDays.includes(d)
            return (
              <div
                key={d}
                className={`flex flex-col items-center rounded-xl py-1.5 text-sm font-extrabold ${
                  played ? 'bg-sun text-ink' : d === today ? 'border-2 border-dashed border-sun bg-white text-ink-soft' : 'bg-cream text-ink-soft'
                }`}
              >
                <span>{WEEKDAYS[i]}</span>
                <span className="emoji text-lg">{played ? '⭐' : '·'}</span>
              </div>
            )
          })}
        </div>
        {weekDone >= WEEK_GOAL && (
          <p className="text-center font-extrabold text-leaf">🎉 Haftalık hedef tamam! Weekly goal done!</p>
        )}
      </section>

      <section className="card-soft p-5">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-xl font-extrabold">Seviye</span>
          <span className="font-bold text-ink-soft">Level</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              aria-pressed={level === l.id}
              className={`flex flex-col items-center gap-1 rounded-2xl border-4 p-3 transition sm:flex-row sm:justify-center sm:gap-3 sm:text-left ${
                level === l.id ? 'border-lion-red bg-sun-light' : 'border-transparent bg-cream'
              }`}
            >
              <span className="emoji text-4xl">{l.emoji}</span>
              <span>
                <span className="block text-xl leading-tight font-extrabold">{l.tr}</span>
                <span className="block text-sm font-bold text-ink-soft">{l.en}</span>
              </span>
            </button>
          ))}
        </div>
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

      <section className="grid grid-cols-2 gap-4">
        <button
          onClick={() => go('map')}
          className="btn-3d flex flex-col items-center justify-center gap-1 rounded-[2rem] p-4 text-white [--c:var(--color-leaf)] [--s:var(--color-leaf-dark)]"
        >
          <span className="emoji text-5xl">🗺️</span>
          <span className="text-xl font-extrabold">Yol Haritası</span>
          <span className="text-sm font-bold opacity-85">My map</span>
        </button>
        <button
          onClick={() => go('album')}
          className="btn-3d flex flex-col items-center justify-center gap-1 rounded-[2rem] p-4 text-white [--c:var(--color-tangerine)] [--s:var(--color-tangerine-dark)]"
        >
          <span className="emoji text-5xl">📒</span>
          <span className="text-xl font-extrabold">Çıkartmalarım</span>
          <span className="text-sm font-bold opacity-85">My stickers · {learnedAll}</span>
        </button>
      </section>
    </div>
  )
}
