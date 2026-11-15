import { TopBar } from '../components/ui'
import { statusOf } from '../lib/learning'
import { sfx } from '../lib/sfx'
import { speak } from '../lib/speech'
import { listsByAge, useStore } from '../store'
import type { Word } from '../types'

const TILT = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3', 'rotate-1', '-rotate-2']

export function Album({ onHome }: { onHome: () => void }) {
  const words = useStore((s) => s.words)
  const learned = words.filter((w) => statusOf(w) === 'learned').length

  return (
    <div className="mx-auto flex max-w-3xl flex-col pb-10">
      <TopBar title="Çıkartmalarım" subtitle={`My stickers · ${learned}/${words.length}`} onBack={onHome} />
      <p className="mx-4 mt-2 rounded-2xl bg-white/70 p-3 text-center font-bold text-ink-soft">
        Bir kelimeyi 3 kez üst üste bilince çıkartması açılır. Learn a word to get its sticker!
      </p>
      {listsByAge(words).map((list) => {
        const ws = words.filter((w) => w.list === list)
        const got = ws.filter((w) => statusOf(w) === 'learned').length
        return (
          <section key={list} className="mt-5 px-4">
            <h2 className="mb-2 flex items-baseline justify-between text-xl font-extrabold">
              {list}
              <span className="text-base text-ink-soft">
                {got}/{ws.length}
              </span>
            </h2>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {ws.map((w, i) => (
                <Sticker key={w.id} word={w} tilt={TILT[i % TILT.length]} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Sticker({ word, tilt }: { word: Word; tilt: string }) {
  const status = statusOf(word)
  if (status !== 'learned') {
    return (
      <div className="grid aspect-square place-items-center rounded-2xl border-4 border-dashed border-ink/15 bg-white/40">
        {status === 'learning' ? (
          <span className="emoji text-3xl opacity-25 grayscale">{word.emoji}</span>
        ) : (
          <span className="text-3xl font-extrabold text-ink/20">?</span>
        )}
      </div>
    )
  }
  return (
    <button
      onClick={() => {
        sfx.flip()
        speak(word.en)
      }}
      className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl border-4 border-white bg-sun-light p-1 shadow-[0_5px_0_rgb(74_44_22/0.12)] transition hover:rotate-0 ${tilt}`}
    >
      <span className="emoji text-4xl">{word.emoji}</span>
      <span className="w-full truncate text-center text-xs font-extrabold text-lion-red sm:text-sm">{word.en}</span>
    </button>
  )
}
