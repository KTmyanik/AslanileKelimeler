import { useRef, useState, type ReactNode } from 'react'
import { hasAI, testConnection } from '../../lib/gemini'
import { canSpeak, speak } from '../../lib/speech'
import { backupOf, useStore } from '../../store'

export function Settings() {
  const childName = useStore((s) => s.childName)
  const setChildName = useStore((s) => s.setChildName)
  const setPin = useStore((s) => s.setPin)
  const resetProgress = useStore((s) => s.resetProgress)
  const importBackup = useStore((s) => s.importBackup)
  const [name, setName] = useState(childName)
  const [newPin, setNewPin] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [aiState, setAiState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const fileInput = useRef<HTMLInputElement>(null)

  const flash = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 3000)
  }

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(backupOf(useStore.getState()), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `aslan-kelime-yedek-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col gap-4">
      {msg && <div className="rounded-2xl bg-leaf/15 p-4 font-bold text-leaf-dark">✅ {msg}</div>}

      <Card title="👧 Çocuğun adı">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. Elif"
            className="flex-1 rounded-xl border-2 border-sun-light bg-cream px-4 py-2 font-bold outline-none focus:border-sun"
          />
          <Btn onClick={() => (setChildName(name.trim()), flash('Ad kaydedildi.'))}>Kaydet</Btn>
        </div>
        <p className="text-sm font-semibold text-ink-soft">Aslan ana sayfada çocuğa adıyla seslenir.</p>
      </Card>

      <Card title="🔒 Ebeveyn PIN kodu">
        <div className="flex gap-2">
          <input
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="Yeni 4 haneli PIN"
            className="flex-1 rounded-xl border-2 border-sun-light bg-cream px-4 py-2 font-bold tracking-widest outline-none focus:border-sun"
          />
          <Btn disabled={newPin.length !== 4} onClick={() => (setPin(newPin), setNewPin(''), flash('PIN değiştirildi.'))}>
            Değiştir
          </Btn>
        </div>
      </Card>

      <Card title="🤖 Yapay zekâ (Gemini)">
        <p className="font-semibold">
          Durum:{' '}
          {!hasAI
            ? '❌ Anahtar tanımlı değil'
            : aiState === 'ok'
              ? '✅ Bağlantı çalışıyor'
              : aiState === 'fail'
                ? '⚠️ Bağlantı kurulamadı'
                : aiState === 'testing'
                  ? '⏳ Test ediliyor...'
                  : '🔑 Anahtar tanımlı'}
        </p>
        {hasAI && (
          <Btn
            onClick={async () => {
              setAiState('testing')
              setAiState((await testConnection()) ? 'ok' : 'fail')
            }}
          >
            Bağlantıyı test et
          </Btn>
        )}
      </Card>

      <Card title="🔊 Ses">
        <p className="font-semibold">{canSpeak ? 'Tarayıcı sesli okumayı destekliyor.' : 'Bu tarayıcı sesli okumayı desteklemiyor.'}</p>
        {canSpeak && <Btn onClick={() => speak('Hello! I am a lion. Roar!')}>Sesi dene</Btn>}
      </Card>

      <Card title="💾 Yedek">
        <p className="text-sm font-semibold text-ink-soft">
          Tüm kelimeler ve ilerleme bu cihazın tarayıcısında saklanır. Başka bir cihaza taşımak için yedek alıp orada geri yükleyin.
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={exportBackup}>⬇️ Yedek indir</Btn>
          <Btn onClick={() => fileInput.current?.click()}>⬆️ Yedekten geri yükle</Btn>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              const data = JSON.parse(await f.text())
              if (!Array.isArray(data.words)) throw new Error()
              if (confirm(`${data.words.length} kelimelik yedek yüklensin mi? Mevcut veriler değişecek.`)) {
                importBackup(data)
                flash('Yedek yüklendi.')
              }
            } catch {
              alert('Bu dosya geçerli bir yedek değil.')
            }
          }}
        />
      </Card>

      <Card title="♻️ İlerlemeyi sıfırla">
        <p className="text-sm font-semibold text-ink-soft">Kelimeler kalır; yıldızlar, rozetler ve öğrenme durumu sıfırlanır.</p>
        <button
          onClick={() => confirm('Tüm ilerleme sıfırlansın mı?') && (resetProgress(), flash('İlerleme sıfırlandı.'))}
          className="self-start rounded-xl bg-lion-red/10 px-4 py-2 font-bold text-lion-red"
        >
          Sıfırla
        </button>
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card-soft flex flex-col gap-3 p-5">
      <h2 className="text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  )
}

function Btn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-3d self-start rounded-xl px-5 py-2 font-extrabold disabled:opacity-50 [--c:var(--color-sun)] [--s:var(--color-sun-dark)]"
    >
      {children}
    </button>
  )
}
