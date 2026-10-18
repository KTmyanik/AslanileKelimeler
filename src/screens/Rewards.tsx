import { Lion } from '../components/Lion'
import { TopBar } from '../components/ui'
import { BADGES, OUTFITS } from '../lib/badges'
import { useStore } from '../store'

export function Rewards({ onHome }: { onHome: () => void }) {
  const stars = useStore((s) => s.stars)
  const earned = useStore((s) => s.earnedBadges)
  const outfit = useStore((s) => s.outfit)
  const setOutfit = useStore((s) => s.setOutfit)

  return (
    <div className="mx-auto flex max-w-3xl flex-col pb-10">
      <TopBar title="Ödüllerim" subtitle="My rewards" onBack={onHome} />

      <section className="card-soft mx-4 mt-3 flex flex-col items-center gap-4 p-5 sm:mx-6 sm:flex-row">
        <Lion mood="cheer" outfit={outfit} size={150} />
        <div className="flex flex-1 flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Aslanını giydir! <span className="text-lion-red">Dress up!</span></h2>
          <div className="grid grid-cols-3 gap-3">
            {OUTFITS.map((o) => {
              const unlocked = stars >= o.stars
              const active = outfit === o.id
              return (
                <button
                  key={o.id}
                  disabled={!unlocked}
                  onClick={() => setOutfit(o.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-4 p-3 transition ${
                    active ? 'border-lion-red bg-sun-light' : 'border-transparent bg-cream'
                  } ${unlocked ? '' : 'opacity-60 grayscale'}`}
                >
                  <span className="emoji text-4xl">{unlocked ? o.emoji : '🔒'}</span>
                  <span className="text-center text-sm leading-tight font-bold">{o.name}</span>
                  {!unlocked && <span className="text-sm font-extrabold text-sun-dark">{o.stars} ⭐</span>}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <h2 className="mx-6 mt-6 mb-3 text-2xl font-extrabold">
        Rozetler <span className="text-ink-soft">· {earned.length}/{BADGES.length}</span>
      </h2>
      <section className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-6">
        {BADGES.map((b) => {
          const has = earned.includes(b.id)
          return (
            <div
              key={b.id}
              className={`card-soft flex flex-col items-center gap-1 p-4 text-center ${has ? '' : 'opacity-70'}`}
            >
              <div
                className={`emoji grid size-20 place-items-center rounded-full text-5xl ${
                  has ? 'bg-sun-light shadow-[inset_0_-6px_0_rgb(0_0_0/0.08)]' : 'bg-ink/5 grayscale'
                }`}
              >
                {has ? b.emoji : '❔'}
              </div>
              <span className="text-lg leading-tight font-extrabold">{b.title}</span>
              <span className="text-sm font-bold text-ink-soft">{has ? b.subtitle : b.hint}</span>
            </div>
          )
        })}
      </section>
    </div>
  )
}
