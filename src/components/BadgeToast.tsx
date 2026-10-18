import { useEffect } from 'react'
import { BADGES } from '../lib/badges'
import { sfx } from '../lib/sfx'
import { useStore } from '../store'
import { Lion } from './Lion'
import { celebrate } from '../lib/celebrate'
import { KidButton } from './ui'

export function BadgeToast() {
  const badgeId = useStore((s) => s.newBadges[0])
  const dismiss = useStore((s) => s.dismissBadge)
  const outfit = useStore((s) => s.outfit)
  const badge = BADGES.find((b) => b.id === badgeId)

  useEffect(() => {
    if (!badge) return
    const t = setTimeout(() => {
      sfx.win()
      celebrate(true)
    }, 300)
    return () => clearTimeout(t)
  }, [badge])

  if (!badge) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-6 backdrop-blur-sm">
      <div className="card-soft animate-pop flex w-full max-w-sm flex-col items-center gap-3 p-8 text-center">
        <p className="text-lg font-extrabold tracking-wide text-lion-red uppercase">Yeni Rozet! New badge!</p>
        <div className="emoji grid size-32 place-items-center rounded-full bg-sun-light text-7xl shadow-[inset_0_-8px_0_rgb(0_0_0/0.08)]">
          {badge.emoji}
        </div>
        <h2 className="text-3xl font-extrabold">{badge.title}</h2>
        <p className="text-xl font-bold text-ink-soft">{badge.subtitle}</p>
        <Lion mood="cheer" outfit={outfit} size={90} />
        <KidButton color="red" onClick={dismiss} className="w-full">
          Süper! 🎉
        </KidButton>
      </div>
    </div>
  )
}
