import type { ReactNode } from 'react'
import { useStore } from '../store'
import type { LionMood } from '../types'
import { Lion } from './Lion'

export function StarCounter({ className = '' }: { className?: string }) {
  const stars = useStore((s) => s.stars)
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xl font-extrabold text-sun-dark shadow-[0_4px_0_rgb(74_44_22/0.1)] ${className}`}
    >
      <span className="emoji text-2xl">⭐</span>
      <span key={stars} className="animate-pop inline-block">
        {stars}
      </span>
    </div>
  )
}

export function TopBar({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-4 pt-4 pb-2 sm:px-6">
      <button
        onClick={onBack}
        aria-label="Geri"
        className="btn-3d grid size-14 shrink-0 place-items-center rounded-2xl text-3xl text-white [--c:var(--color-lion-red)] [--s:var(--color-lion-red-dark)]"
      >
        ‹
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl leading-tight font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="truncate text-base font-semibold text-ink-soft">{subtitle}</p>}
      </div>
      {right ?? <StarCounter />}
    </header>
  )
}

export function SpeechBubble({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-3xl bg-white px-5 py-3 text-xl font-bold shadow-[0_6px_0_rgb(74_44_22/0.08)] sm:text-2xl ${className}`}
    >
      {children}
      <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rotate-45 rounded-sm bg-white" />
    </div>
  )
}

export function LionTalk({ mood, text, size = 110 }: { mood: LionMood; text: ReactNode; size?: number }) {
  const outfit = useStore((s) => s.outfit)
  return (
    <div className="flex items-center justify-center gap-4">
      <Lion mood={mood} outfit={outfit} size={size} className="shrink-0" />
      <SpeechBubble className="max-w-xs">{text}</SpeechBubble>
    </div>
  )
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 px-4">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-3 rounded-full transition-all duration-300 ${
            i < current ? 'w-6 bg-leaf' : i === current ? 'w-8 bg-sun' : 'w-3 bg-ink/15'
          }`}
        />
      ))}
    </div>
  )
}

export function KidButton({
  children,
  onClick,
  color = 'sun',
  className = '',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  color?: 'sun' | 'red' | 'leaf' | 'sky' | 'grape' | 'tangerine' | 'white'
  className?: string
  disabled?: boolean
}) {
  const palette = {
    sun: '[--c:var(--color-sun)] [--s:var(--color-sun-dark)] text-ink',
    red: '[--c:var(--color-lion-red)] [--s:var(--color-lion-red-dark)] text-white',
    leaf: '[--c:var(--color-leaf)] [--s:var(--color-leaf-dark)] text-white',
    sky: '[--c:var(--color-sky)] [--s:var(--color-sky-dark)] text-white',
    grape: '[--c:var(--color-grape)] [--s:var(--color-grape-dark)] text-white',
    tangerine: '[--c:var(--color-tangerine)] [--s:var(--color-tangerine-dark)] text-white',
    white: '[--c:white] [--s:rgb(74_44_22/0.15)] text-ink',
  }[color]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-3d rounded-2xl px-6 py-3 text-xl font-extrabold disabled:opacity-50 ${palette} ${className}`}
    >
      {children}
    </button>
  )
}

export function SpeakButton({ onClick, size = 'md' }: { onClick: () => void; size?: 'md' | 'lg' }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label="Dinle"
      className={`btn-3d grid shrink-0 place-items-center rounded-full [--c:var(--color-sky)] [--s:var(--color-sky-dark)] ${
        size === 'lg' ? 'size-24 text-5xl' : 'size-14 text-2xl'
      }`}
    >
      <span className="emoji">🔊</span>
    </button>
  )
}

export function NotEnoughWords({ need, onBack }: { need: number; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-16 text-center">
      <LionTalk mood="think" text={<>Bu oyun için en az {need} kelime lazım.<br />Need more words!</>} />
      <p className="max-w-md text-lg font-semibold text-ink-soft">
        Annen ya da baban Ebeveyn bölümünden yeni kelimeler ekleyebilir.
      </p>
      <KidButton onClick={onBack}>🏠 Ana Sayfa</KidButton>
    </div>
  )
}

export function GameResult({
  correct,
  total,
  starsEarned,
  onAgain,
  onHome,
}: {
  correct: number
  total: number
  starsEarned: number
  onAgain: () => void
  onHome: () => void
}) {
  const outfit = useStore((s) => s.outfit)
  const ratio = total ? correct / total : 0
  const [title, sub] =
    ratio === 1 ? ['Mükemmel!', 'Perfect!'] : ratio >= 0.7 ? ['Harika!', 'Great job!'] : ['Aferin!', 'Good try!']
  return (
    <div className="animate-pop flex flex-col items-center gap-5 px-6 py-8 text-center">
      <Lion mood="cheer" outfit={outfit} size={180} />
      <div>
        <h2 className="text-5xl font-extrabold text-lion-red">{title}</h2>
        <p className="text-2xl font-bold text-ink-soft">{sub}</p>
      </div>
      <div className="card-soft flex items-center gap-8 px-8 py-5">
        <div>
          <div className="text-4xl font-extrabold text-leaf">
            {correct}/{total}
          </div>
          <div className="font-bold text-ink-soft">Doğru</div>
        </div>
        <div className="h-12 w-px bg-ink/10" />
        <div>
          <div className="text-4xl font-extrabold text-sun-dark">+{starsEarned} ⭐</div>
          <div className="font-bold text-ink-soft">Yıldız</div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <KidButton color="leaf" onClick={onAgain}>
          🔁 Tekrar Oyna
        </KidButton>
        <KidButton onClick={onHome}>🏠 Ana Sayfa</KidButton>
      </div>
    </div>
  )
}
