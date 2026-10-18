import { STATUS_LABEL, STATUS_STYLE, statusOf, todayKey } from '../../lib/learning'
import { useLists, useStore } from '../../store'
import type { WordStatus } from '../../types'

const BAR: Record<WordStatus, string> = { new: 'bg-sky', learning: 'bg-tangerine', learned: 'bg-leaf' }

export function Progress() {
  const words = useStore((s) => s.words)
  const stars = useStore((s) => s.stars)
  const sessions = useStore((s) => s.sessions)
  const playDays = useStore((s) => s.playDays)
  const badges = useStore((s) => s.earnedBadges.length)
  const lists = useLists()

  const count = (st: WordStatus, ws = words) => ws.filter((w) => statusOf(w) === st).length
  const totals = { new: count('new'), learning: count('learning'), learned: count('learned') }

  const hard = words
    .filter((w) => w.wrong > 0 && statusOf(w) !== 'learned')
    .sort((a, b) => b.wrong / (b.correct + b.wrong) - a.wrong / (a.correct + a.wrong) || b.wrong - a.wrong)
    .slice(0, 10)

  const recentLearned = words
    .filter((w) => statusOf(w) === 'learned')
    .sort((a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0))
    .slice(0, 12)

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return { key: todayKey(d), label: d.toLocaleDateString('tr-TR', { weekday: 'narrow' }), day: d.getDate() }
  })

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="📚" label="Toplam kelime" value={words.length} />
        <Stat icon="✅" label="Öğrendi" value={totals.learned} tone="text-leaf" />
        <Stat icon="⭐" label="Yıldız" value={stars} tone="text-sun-dark" />
        <Stat icon="🎮" label="Bitirilen oyun" value={sessions} />
        <Stat icon="🔄" label="Öğreniyor" value={totals.learning} tone="text-tangerine-dark" />
        <Stat icon="🆕" label="Henüz çalışılmadı" value={totals.new} tone="text-sky-dark" />
        <Stat icon="📅" label="Çalışılan gün" value={playDays.length} />
        <Stat icon="🏅" label="Rozet" value={badges} />
      </section>

      <section className="card-soft flex flex-col gap-3 p-5">
        <h2 className="text-lg font-extrabold">Genel durum</h2>
        <StatusBar counts={totals} />
        <div className="flex flex-wrap gap-3 text-sm font-bold">
          {(Object.keys(totals) as WordStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`size-3 rounded-full ${BAR[s]}`} />
              {STATUS_LABEL[s]}: {totals[s]}
            </span>
          ))}
        </div>
        <p className="text-sm font-semibold text-ink-soft">
          Bir kelime arka arkaya 3 kez doğru bilindiğinde “Öğrendi” sayılır. Yanlış yapılan kelimeler oyunlarda daha sık çıkar.
        </p>
      </section>

      {lists.length > 0 && (
        <section className="card-soft flex flex-col gap-3 p-5">
          <h2 className="text-lg font-extrabold">Listelere göre</h2>
          {lists.map((l) => {
            const ws = words.filter((w) => w.list === l)
            const c = { new: count('new', ws), learning: count('learning', ws), learned: count('learned', ws) }
            return (
              <div key={l} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm font-bold">
                  <span>{l}</span>
                  <span className="text-ink-soft">
                    {c.learned}/{ws.length} öğrendi
                  </span>
                </div>
                <StatusBar counts={c} thin />
              </div>
            )
          })}
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-soft flex flex-col gap-3 p-5">
          <h2 className="text-lg font-extrabold">😓 Zorlandığı kelimeler</h2>
          {hard.length === 0 ? (
            <p className="font-semibold text-ink-soft">Şimdilik zorlandığı bir kelime yok.</p>
          ) : (
            hard.map((w) => (
              <div key={w.id} className="flex items-center gap-3 rounded-xl bg-cream p-2">
                <span className="emoji text-2xl">{w.emoji}</span>
                <span className="flex-1 font-bold">
                  {w.en} <span className="font-semibold text-ink-soft">· {w.tr}</span>
                </span>
                <span className="text-sm font-extrabold text-lion-red">
                  {w.wrong} yanlış / {w.correct} doğru
                </span>
              </div>
            ))
          )}
        </section>

        <section className="card-soft flex flex-col gap-3 p-5">
          <h2 className="text-lg font-extrabold">🎉 Son öğrendikleri</h2>
          {recentLearned.length === 0 ? (
            <p className="font-semibold text-ink-soft">Henüz “öğrendi” durumuna gelen kelime yok.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recentLearned.map((w) => (
                <span key={w.id} className={`rounded-full px-3 py-1 font-bold ${STATUS_STYLE.learned}`}>
                  {w.emoji} {w.en}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card-soft flex flex-col gap-3 p-5">
        <h2 className="text-lg font-extrabold">Son 14 gün</h2>
        <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
          {days.map((d) => {
            const played = playDays.includes(d.key)
            return (
              <div
                key={d.key}
                className={`flex flex-col items-center rounded-xl py-2 text-xs font-bold ${
                  played ? 'bg-sun text-ink' : 'bg-cream text-ink-soft'
                }`}
              >
                <span>{d.label}</span>
                <span className="text-base">{d.day}</span>
                <span className="emoji">{played ? '⭐' : '·'}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Stat({ icon, label, value, tone = '' }: { icon: string; label: string; value: number; tone?: string }) {
  return (
    <div className="card-soft flex flex-col gap-1 !rounded-2xl p-4">
      <span className="emoji text-2xl">{icon}</span>
      <span className={`text-3xl font-extrabold ${tone}`}>{value}</span>
      <span className="text-sm font-bold text-ink-soft">{label}</span>
    </div>
  )
}

function StatusBar({ counts, thin }: { counts: Record<WordStatus, number>; thin?: boolean }) {
  const total = counts.new + counts.learning + counts.learned || 1
  return (
    <div className={`flex overflow-hidden rounded-full bg-cream ${thin ? 'h-3' : 'h-6'}`}>
      {(['learned', 'learning', 'new'] as WordStatus[]).map((s) => (
        <div key={s} className={`${BAR[s]} transition-all`} style={{ width: `${(counts[s] / total) * 100}%` }} />
      ))}
    </div>
  )
}
