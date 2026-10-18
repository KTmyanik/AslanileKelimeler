import { useState } from 'react'
import { STATUS_LABEL, STATUS_STYLE, statusOf } from '../../lib/learning'
import { speak } from '../../lib/speech'
import { useLists, useStore } from '../../store'
import type { Word, WordStatus } from '../../types'

export function WordList() {
  const words = useStore((s) => s.words)
  const deleteWord = useStore((s) => s.deleteWord)
  const deleteList = useStore((s) => s.deleteList)
  const lists = useLists()
  const [query, setQuery] = useState('')
  const [list, setList] = useState<string>('')
  const [status, setStatus] = useState<WordStatus | ''>('')
  const [editing, setEditing] = useState<Word | null>(null)

  const q = query.trim().toLocaleLowerCase('tr-TR')
  const filtered = words
    .filter((w) => !list || w.list === list)
    .filter((w) => !status || statusOf(w) === status)
    .filter((w) => !q || w.en.toLowerCase().includes(q) || w.tr.toLocaleLowerCase('tr-TR').includes(q))
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft flex flex-col gap-3 p-4 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Kelime ara..."
          className="flex-1 rounded-xl border-2 border-sun-light bg-cream px-4 py-2 font-semibold outline-none focus:border-sun"
        />
        <select value={list} onChange={(e) => setList(e.target.value)} className="rounded-xl border-2 border-sun-light bg-cream px-3 py-2 font-bold">
          <option value="">Tüm listeler</option>
          {lists.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as WordStatus | '')}
          className="rounded-xl border-2 border-sun-light bg-cream px-3 py-2 font-bold"
        >
          <option value="">Tüm durumlar</option>
          {(Object.keys(STATUS_LABEL) as WordStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </section>

      {list && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (confirm(`"${list}" listesindeki tüm kelimeler silinsin mi?`)) {
                deleteList(list)
                setList('')
              }
            }}
            className="rounded-xl bg-lion-red/10 px-4 py-2 text-sm font-bold text-lion-red"
          >
            🗑️ "{list}" listesini sil
          </button>
        </div>
      )}

      <p className="px-1 text-sm font-bold text-ink-soft">{filtered.length} kelime</p>

      <section className="flex flex-col gap-2">
        {filtered.map((w) => {
          const st = statusOf(w)
          const tries = w.correct + w.wrong
          return (
            <div key={w.id} className="card-soft flex items-center gap-3 !rounded-2xl p-3">
              <span className="emoji w-12 text-center text-4xl">{w.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-lg font-extrabold">{w.en}</span>
                  <span className="font-semibold text-ink-soft">{w.tr || '—'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                  <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLE[st]}`}>{STATUS_LABEL[st]}</span>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-ink-soft">{w.list}</span>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-ink-soft">{w.category}</span>
                  {w.clue?.trim() && <span className="rounded-full bg-cream px-2 py-0.5 text-ink-soft">💡 ipucu</span>}
                  {tries > 0 && (
                    <span className="rounded-full bg-cream px-2 py-0.5 text-ink-soft">
                      ✔ {w.correct} · ✘ {w.wrong}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => speak(w.en)} className="rounded-xl bg-sky/15 p-2 text-xl" aria-label="Dinle">
                🔊
              </button>
              <button onClick={() => setEditing(w)} className="rounded-xl bg-sun-light/60 p-2 text-xl" aria-label="Düzenle">
                ✏️
              </button>
              <button
                onClick={() => confirm(`"${w.en}" silinsin mi?`) && deleteWord(w.id)}
                className="rounded-xl bg-lion-red/10 p-2 text-xl"
                aria-label="Sil"
              >
                🗑️
              </button>
            </div>
          )
        })}
      </section>

      {editing && <EditWord word={editing} lists={lists} onClose={() => setEditing(null)} />}
    </div>
  )
}

function EditWord({ word, lists, onClose }: { word: Word; lists: string[]; onClose: () => void }) {
  const updateWord = useStore((s) => s.updateWord)
  const [form, setForm] = useState({
    en: word.en,
    tr: word.tr,
    emoji: word.emoji,
    category: word.category,
    list: word.list,
    clue: word.clue ?? '',
  })
  const field = (key: keyof typeof form, label: string) => (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-bold text-ink-soft">{label}</span>
      <input
        value={form[key]}
        list={key === 'list' ? 'edit-lists' : undefined}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className={`rounded-xl border-2 border-sun-light bg-cream px-3 py-2 font-bold outline-none focus:border-sun ${key === 'emoji' ? 'emoji text-2xl' : ''}`}
      />
    </label>
  )
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card-soft animate-pop flex max-h-[90dvh] w-full max-w-md flex-col gap-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-extrabold">Kelimeyi düzenle</h2>
        {field('en', 'İngilizce')}
        {field('tr', 'Türkçe')}
        <div className="grid grid-cols-2 gap-3">
          {field('emoji', 'Emoji')}
          {field('category', 'Kategori')}
        </div>
        {field('list', 'Liste')}
        {field('clue', 'İngilizce ipucu (isteğe bağlı)')}
        <datalist id="edit-lists">
          {lists.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <div className="mt-2 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl bg-cream px-4 py-2 font-bold">
            Vazgeç
          </button>
          <button
            disabled={!form.en.trim()}
            onClick={() => {
              updateWord(word.id, {
                en: form.en.trim(),
                tr: form.tr.trim(),
                emoji: form.emoji.trim() || '📘',
                category: form.category.trim() || 'Diğer',
                list: form.list.trim() || word.list,
                clue: form.clue.trim(),
              })
              onClose()
            }}
            className="btn-3d rounded-xl px-5 py-2 font-extrabold text-white [--c:var(--color-leaf)] [--s:var(--color-leaf-dark)]"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
