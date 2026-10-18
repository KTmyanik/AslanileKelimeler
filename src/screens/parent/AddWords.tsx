import { useEffect, useRef, useState } from 'react'
import { Lion } from '../../components/Lion'
import { downloadTemplate, wordsFromSpreadsheet } from '../../lib/excel'
import { enrichWords, hasAI, wordsFromImage } from '../../lib/gemini'
import { fileToBase64Image } from '../../lib/image'
import { normalizeEn } from '../../lib/learning'
import { SEED_LIST } from '../../lib/seed'
import { useLists, useStore } from '../../store'
import type { WordDraft } from '../../types'

type Source = 'image' | 'excel' | 'manual'

interface Row extends WordDraft {
  key: string
  selected: boolean
  duplicate: boolean
}

const ENRICH_CHUNK = 40

async function fillMissing(drafts: WordDraft[]): Promise<WordDraft[]> {
  if (!hasAI) return drafts
  const out: WordDraft[] = []
  for (let i = 0; i < drafts.length; i += ENRICH_CHUNK) {
    const chunk = drafts.slice(i, i + ENRICH_CHUNK)
    if (chunk.every((d) => d.tr && d.emoji && d.category)) {
      out.push(...chunk)
      continue
    }
    const enriched = await enrichWords(chunk.map(({ en, tr }) => ({ en, tr })))
    out.push(
      ...chunk.map((d, j) => ({
        en: d.en,
        tr: d.tr || enriched[j].tr,
        emoji: d.emoji || enriched[j].emoji,
        category: d.category || enriched[j].category,
      })),
    )
  }
  return out
}

function parseManual(text: string): WordDraft[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [en, ...rest] = line.split(/\s*(?:=|:|\t|\s-\s|,|;)\s*/)
      return { en: en.trim(), tr: rest.join(', ').trim(), emoji: '', category: '' }
    })
    .filter((d) => d.en)
}

export function AddWords({ onSaved }: { onSaved: () => void }) {
  const words = useStore((s) => s.words)
  const addWords = useStore((s) => s.addWords)
  const lists = useLists()
  const [list, setList] = useState(() => lists.filter((l) => l !== SEED_LIST).at(-1) ?? 'Ünite 1')
  const [source, setSource] = useState<Source>('image')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [manual, setManual] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const excelInput = useRef<HTMLInputElement>(null)

  const toRows = (drafts: WordDraft[]) => {
    const existing = new Set(words.map((w) => normalizeEn(w.en)))
    const seen = new Set<string>()
    const out: Row[] = []
    for (const d of drafts) {
      const k = normalizeEn(d.en)
      if (!k || seen.has(k)) continue
      seen.add(k)
      const duplicate = existing.has(k)
      out.push({ ...d, key: `${k}-${Date.now()}-${out.length}`, selected: !duplicate, duplicate })
    }
    return out
  }

  const run = async (label: string, job: () => Promise<WordDraft[]>) => {
    setBusy(label)
    setError(null)
    setSaved(null)
    try {
      const drafts = await job()
      const next = toRows(drafts)
      setRows((prev) => {
        const keys = new Set(prev.map((r) => normalizeEn(r.en)))
        return [...prev, ...next.filter((r) => !keys.has(normalizeEn(r.en)))]
      })
      if (!next.length) setError('Hiç kelime bulunamadı. Başka bir görsel veya dosya deneyin.')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const handleImages = (files: Blob[]) => {
    if (!files.length || !hasAI) return
    void run(`Aslan ${files.length > 1 ? `${files.length} görseli` : 'görseli'} okuyor...`, async () => {
      const all: WordDraft[] = []
      for (const f of files) {
        const img = await fileToBase64Image(f)
        setPreviews((p) => [...p, img.previewUrl])
        all.push(...(await wordsFromImage(img)))
      }
      return all
    })
  }

  const handleImagesRef = useRef(handleImages)
  useEffect(() => {
    handleImagesRef.current = handleImages
  })

  useEffect(() => {
    if (source !== 'image') return
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (files.length) {
        e.preventDefault()
        handleImagesRef.current(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [source])

  const handleExcel = (file: File) =>
    run(hasAI ? 'Excel okunuyor, eksik anlamlar tamamlanıyor...' : 'Excel okunuyor...', async () =>
      fillMissing(await wordsFromSpreadsheet(file)),
    )

  const handleManual = () =>
    run(hasAI ? 'Aslan anlamları buluyor...' : 'Hazırlanıyor...', async () => {
      const drafts = await fillMissing(parseManual(manual))
      setManual('')
      return drafts
    })

  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const selected = rows.filter((r) => r.selected && r.en.trim())
  const missingMeaning = selected.some((r) => !r.tr.trim())

  const save = () => {
    const name = list.trim() || 'Genel'
    const { added, skipped } = addWords(
      selected.map(({ en, tr, emoji, category }) => ({ en, tr, emoji, category })),
      name,
    )
    setRows([])
    previews.forEach(URL.revokeObjectURL)
    setPreviews([])
    setSaved(`${added} kelime "${name}" listesine eklendi${skipped ? ` (${skipped} tanesi zaten vardı)` : ''}.`)
  }

  return (
    <div className="flex flex-col gap-4">
      {!hasAI && (
        <div className="rounded-2xl bg-lion-red/10 p-4 font-semibold text-lion-red-dark">
          Yapay zekâ anahtarı bulunamadı. Ekran görüntüsünden okuma ve otomatik anlam bulma kapalı; Excel ve elle ekleme çalışır.
        </div>
      )}

      <section className="card-soft flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <label className="font-extrabold" htmlFor="list-name">
          Hangi listeye eklensin?
        </label>
        <input
          id="list-name"
          list="lists"
          value={list}
          onChange={(e) => setList(e.target.value)}
          placeholder="Örn. Ünite 2 - Hayvanlar"
          className="flex-1 rounded-xl border-2 border-sun-light bg-cream px-4 py-2.5 text-lg font-bold outline-none focus:border-sun"
        />
        <datalist id="lists">
          {lists.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </section>

      <section className="card-soft p-5">
        <div className="mb-4 grid grid-cols-3 gap-2">
          {([
            ['image', '📸', 'Ekran görüntüsü'],
            ['excel', '📊', 'Excel dosyası'],
            ['manual', '✍️', 'Elle yaz'],
          ] as const).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setSource(id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-4 p-3 font-bold transition sm:flex-row sm:justify-center sm:gap-2 ${
                source === id ? 'border-sun bg-sun-light/60' : 'border-transparent bg-cream text-ink-soft'
              }`}
            >
              <span className="emoji text-3xl">{icon}</span>
              <span className="text-sm sm:text-base">{label}</span>
            </button>
          ))}
        </div>

        {source === 'image' && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleImages(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')))
            }}
            onClick={() => hasAI && imageInput.current?.click()}
            className={`flex flex-col items-center gap-2 rounded-2xl border-4 border-dashed border-sun p-8 text-center ${
              hasAI ? 'cursor-pointer hover:bg-sun-light/30' : 'opacity-50'
            }`}
          >
            <span className="emoji text-5xl">🖼️</span>
            <p className="text-lg font-extrabold">Görsel seçin, sürükleyin veya yapıştırın (Ctrl+V)</p>
            <p className="text-sm font-semibold text-ink-soft">
              Ders kitabı sayfası, çalışma kâğıdı veya öğretmenin gönderdiği liste. Birden fazla görsel seçebilirsiniz.
            </p>
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleImages(Array.from(e.target.files ?? []))
                e.target.value = ''
              }}
            />
          </div>
        )}

        {source === 'excel' && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-4 border-dashed border-sun p-8 text-center">
            <span className="emoji text-5xl">📊</span>
            <p className="text-lg font-extrabold">Excel (.xlsx, .xls) veya CSV dosyası yükleyin</p>
            <p className="max-w-lg text-sm font-semibold text-ink-soft">
              İlk sütun İngilizce, ikinci sütun Türkçe olsun. Başlık satırı olabilir (İngilizce / Türkçe / Kategori).
              Türkçe anlamı boş bırakırsanız {hasAI ? 'yapay zekâ doldurur' : 'sonra elle doldurabilirsiniz'}.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => excelInput.current?.click()}
                className="btn-3d rounded-xl px-5 py-2.5 font-extrabold [--c:var(--color-sun)] [--s:var(--color-sun-dark)]"
              >
                Dosya seç
              </button>
              <button onClick={() => void downloadTemplate()} className="rounded-xl bg-cream px-5 py-2.5 font-bold text-ink-soft">
                ⬇️ Örnek şablon indir
              </button>
            </div>
            <input
              ref={excelInput}
              type="file"
              accept=".xlsx,.xls,.csv,.ods"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleExcel(f)
                e.target.value = ''
              }}
            />
          </div>
        )}

        {source === 'manual' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-ink-soft">
              Her satıra bir kelime yazın. Anlamı yanına <b>=</b> ile yazabilir ya da {hasAI ? 'boş bırakıp yapay zekâya buldurabilirsiniz' : 'sonra doldurabilirsiniz'}.
            </p>
            <textarea
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              rows={6}
              placeholder={'elephant = fil\nblue = mavi\norange'}
              className="rounded-xl border-2 border-sun-light bg-cream p-4 font-mono text-lg outline-none focus:border-sun"
            />
            <button
              disabled={!manual.trim() || !!busy}
              onClick={() => void handleManual()}
              className="btn-3d self-end rounded-xl px-6 py-2.5 font-extrabold disabled:opacity-50 [--c:var(--color-sun)] [--s:var(--color-sun-dark)]"
            >
              Listeye hazırla
            </button>
          </div>
        )}

        {previews.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {previews.map((p) => (
              <img key={p} src={p} alt="" className="h-24 rounded-xl border-2 border-sun-light object-cover" />
            ))}
          </div>
        )}
      </section>

      {busy && (
        <div className="card-soft flex items-center justify-center gap-4 p-5">
          <Lion mood="think" size={80} />
          <p className="text-lg font-extrabold">{busy}</p>
        </div>
      )}
      {error && <div className="rounded-2xl bg-lion-red/10 p-4 font-bold text-lion-red-dark">{error}</div>}
      {saved && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-leaf/15 p-4 font-bold text-leaf-dark">
          <span>✅ {saved}</span>
          <button onClick={onSaved} className="rounded-xl bg-white px-4 py-2 text-ink">
            Kelimeleri gör
          </button>
        </div>
      )}

      {rows.length > 0 && (
        <section className="card-soft flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">Kontrol edin ({rows.length} kelime bulundu)</h2>
            <div className="flex gap-2 text-sm font-bold">
              <button onClick={() => setRows((rs) => rs.map((r) => ({ ...r, selected: true })))} className="rounded-lg bg-cream px-3 py-1.5">
                Hepsini seç
              </button>
              <button onClick={() => setRows([])} className="rounded-lg bg-cream px-3 py-1.5 text-lion-red">
                Temizle
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <div
                key={r.key}
                className={`grid grid-cols-[auto_3.5rem_1fr_1fr] items-center gap-2 rounded-xl p-2 sm:grid-cols-[auto_3.5rem_1fr_1fr_10rem] ${
                  r.selected ? 'bg-sun-light/30' : 'bg-ink/5 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={r.selected}
                  onChange={(e) => update(r.key, { selected: e.target.checked })}
                  className="size-6 accent-lion-red"
                />
                <input
                  value={r.emoji}
                  onChange={(e) => update(r.key, { emoji: e.target.value })}
                  className="emoji w-full rounded-lg bg-white p-1.5 text-center text-2xl"
                  aria-label="Emoji"
                />
                <div className="min-w-0">
                  <input
                    value={r.en}
                    onChange={(e) => update(r.key, { en: e.target.value })}
                    className="w-full rounded-lg bg-white px-3 py-2 font-bold"
                    aria-label="İngilizce"
                  />
                  {r.duplicate && <span className="text-xs font-bold text-tangerine-dark">Zaten kayıtlı</span>}
                </div>
                <input
                  value={r.tr}
                  onChange={(e) => update(r.key, { tr: e.target.value })}
                  placeholder="Türkçe anlamı"
                  className={`w-full rounded-lg bg-white px-3 py-2 font-semibold ${!r.tr && r.selected ? 'ring-2 ring-lion-red-light' : ''}`}
                  aria-label="Türkçe"
                />
                <input
                  value={r.category}
                  onChange={(e) => update(r.key, { category: e.target.value })}
                  placeholder="Kategori"
                  className="hidden w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold sm:block"
                  aria-label="Kategori"
                />
              </div>
            ))}
          </div>

          {missingMeaning && (
            <p className="text-sm font-bold text-lion-red">Bazı kelimelerin Türkçe anlamı boş. Doldurmanız önerilir.</p>
          )}
          <button
            disabled={!selected.length}
            onClick={save}
            className="btn-3d self-end rounded-xl px-6 py-3 text-lg font-extrabold text-white disabled:opacity-50 [--c:var(--color-leaf)] [--s:var(--color-leaf-dark)]"
          >
            ✅ {selected.length} kelimeyi kaydet
          </button>
        </section>
      )}
    </div>
  )
}
