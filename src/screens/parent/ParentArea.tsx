import { useState, type ReactNode } from 'react'
import { Lion } from '../../components/Lion'
import { DEFAULT_PIN, useStore } from '../../store'
import { AddWords } from './AddWords'
import { Progress } from './Progress'
import { Settings } from './Settings'
import { Sentences } from './Sentences'
import { WordList } from './WordList'

type Tab = 'add' | 'words' | 'sentences' | 'progress' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'add', label: 'Kelime Ekle', icon: '➕' },
  { id: 'words', label: 'Kelimeler', icon: '📚' },
  { id: 'sentences', label: 'Cümleler', icon: '🔤' },
  { id: 'progress', label: 'İlerleme', icon: '📈' },
  { id: 'settings', label: 'Ayarlar', icon: '⚙️' },
]

export function ParentArea({ onExit }: { onExit: () => void }) {
  const [unlocked, setUnlocked] = useState(false)
  const [tab, setTab] = useState<Tab>('add')

  if (!unlocked) return <PinGate onOk={() => setUnlocked(true)} onExit={onExit} />

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pt-4 pb-12 sm:px-6">
      <header className="flex items-center gap-3">
        <Lion size={56} animate={false} />
        <div className="flex-1">
          <h1 className="text-2xl leading-tight font-extrabold">Ebeveyn Paneli</h1>
          <p className="text-sm font-semibold text-ink-soft">Kelime ekleyin, ilerlemeyi takip edin</p>
        </div>
        <button
          onClick={onExit}
          className="btn-3d rounded-xl px-4 py-2 font-bold text-white [--c:var(--color-lion-red)] [--s:var(--color-lion-red-dark)]"
        >
          Çocuk moduna dön
        </button>
      </header>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl bg-white/70 p-1.5 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-bold whitespace-nowrap transition ${
              tab === t.id ? 'bg-sun text-ink shadow' : 'text-ink-soft hover:bg-sun-light/50'
            }`}
          >
            <span className="emoji">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'add' && <AddWords onSaved={() => setTab('words')} />}
      {tab === 'words' && <WordList />}
      {tab === 'sentences' && <Sentences />}
      {tab === 'progress' && <Progress />}
      {tab === 'settings' && <Settings />}
    </div>
  )
}

function PinGate({ onOk, onExit }: { onOk: () => void; onExit: () => void }) {
  const pin = useStore((s) => s.pin)
  const [entry, setEntry] = useState('')
  const [error, setError] = useState(false)

  const press = (d: string) => {
    if (entry.length >= 4) return
    const next = entry + d
    setEntry(next)
    setError(false)
    if (next.length === 4) {
      if (next === pin) onOk()
      else
        setTimeout(() => {
          setError(true)
          setEntry('')
        }, 200)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 p-6">
      <Lion mood="think" size={110} />
      <h1 className="text-3xl font-extrabold">Ebeveyn Girişi</h1>
      <p className="font-semibold text-ink-soft">4 haneli PIN kodunu girin</p>
      <div className={`flex gap-3 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`size-5 rounded-full border-4 ${i < entry.length ? 'border-lion-red bg-lion-red' : 'border-ink/20'}`}
          />
        ))}
      </div>
      {error && <p className="font-bold text-lion-red">PIN yanlış</p>}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <PinKey key={d} onClick={() => press(d)}>{d}</PinKey>
        ))}
        <PinKey onClick={onExit}>✕</PinKey>
        <PinKey onClick={() => press('0')}>0</PinKey>
        <PinKey onClick={() => setEntry((e) => e.slice(0, -1))}>⌫</PinKey>
      </div>
      {pin === DEFAULT_PIN && (
        <p className="max-w-xs text-center text-sm font-semibold text-ink-soft">
          İlk PIN: <b>1234</b> — Ayarlar bölümünden değiştirmeniz önerilir.
        </p>
      )}
    </div>
  )
}

function PinKey({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn-3d size-18 rounded-2xl text-3xl font-extrabold [--c:white] [--s:rgb(74_44_22/0.15)]"
    >
      {children}
    </button>
  )
}
