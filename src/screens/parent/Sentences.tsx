import { useState } from 'react'
import { sentenceTokens } from '../../lib/sentence'
import { useStore } from '../../store'

export function Sentences() {
  const sentences = useStore((s) => s.sentences)
  const addSentence = useStore((s) => s.addSentence)
  const deleteSentence = useStore((s) => s.deleteSentence)
  const [en, setEn] = useState('')
  const [tr, setTr] = useState('')
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    const tokens = sentenceTokens(en)
    if (tokens.length < 2) {
      setError('İngilizce cümlede en az iki kelime olmalı.')
      return
    }
    addSentence(en, tr)
    setEn('')
    setTr('')
    setError(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft flex flex-col gap-3 p-5">
        <h2 className="text-lg font-extrabold">Cümle ekle</h2>
        <p className="text-sm font-semibold text-ink-soft">
          Çocuk kelimeleri karışık görür ve doğru sıraya dizer. Nokta koymasan da olur.
        </p>
        <input
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="The lion is happy"
          className="rounded-xl border-2 border-sun-light bg-cream px-4 py-2 font-bold outline-none focus:border-sun"
        />
        <input
          value={tr}
          onChange={(e) => setTr(e.target.value)}
          placeholder="Aslan mutlu"
          className="rounded-xl border-2 border-sun-light bg-cream px-4 py-2 font-bold outline-none focus:border-sun"
        />
        {error && <p className="font-bold text-lion-red">{error}</p>}
        <button
          onClick={save}
          className="btn-3d self-start rounded-xl px-5 py-2 font-extrabold text-white [--c:var(--color-leaf)] [--s:var(--color-leaf-dark)]"
        >
          Kaydet
        </button>
      </section>

      <p className="px-1 text-sm font-bold text-ink-soft">{sentences.length} cümle</p>

      <section className="flex flex-col gap-2">
        {sentences.map((sentence) => (
          <div key={sentence.id} className="card-soft flex items-center gap-3 !rounded-2xl p-4">
            <div className="min-w-0 flex-1">
              <div className="text-lg font-extrabold">{sentence.en}</div>
              <div className="font-semibold text-ink-soft">{sentence.tr || '—'}</div>
            </div>
            <button
              onClick={() => confirm('Bu cümle silinsin mi?') && deleteSentence(sentence.id)}
              className="rounded-xl bg-lion-red/10 p-2 text-xl"
              aria-label="Sil"
            >
              🗑️
            </button>
          </div>
        ))}
      </section>
    </div>
  )
}
