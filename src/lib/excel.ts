import type { WordDraft } from '../types'

const loadXlsx = () => import('xlsx')

const HEADER_PATTERNS = {
  en: /^(ingilizce|english|kelime|word|en|eng)$/,
  tr: /^(türkçe|turkce|türkce|anlam[ıi]?|meaning|tr|turkish)$/,
  emoji: /^(emoji|resim|simge)$/,
  category: /^(kategori|category|konu|tema)$/,
}

type Col = keyof typeof HEADER_PATTERNS

const matchesHeader = (h: string, key: Col) =>
  HEADER_PATTERNS[key].test(h.toLowerCase()) || HEADER_PATTERNS[key].test(h.toLocaleLowerCase('tr-TR'))

/** CSVs saved by Excel on Turkish Windows are often Windows-1254, not UTF-8. */
function decodeText(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return new TextDecoder('windows-1254').decode(buf)
  }
}

export async function wordsFromSpreadsheet(file: File): Promise<WordDraft[]> {
  const XLSX = await loadXlsx()
  const buf = await file.arrayBuffer()
  const wb = /\.(csv|txt)$/i.test(file.name) || file.type === 'text/csv'
    ? XLSX.read(decodeText(buf), { type: 'string' })
    : XLSX.read(buf, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return []
  const rows = XLSX.utils
    .sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' })
    .map((r) => r.map((c) => String(c ?? '').trim()))
    .filter((r) => r.some(Boolean))
  if (!rows.length) return []

  const cols: Partial<Record<Col, number>> = {}
  rows[0].forEach((h, i) => {
    for (const key of Object.keys(HEADER_PATTERNS) as Col[]) {
      if (cols[key] === undefined && matchesHeader(h, key)) cols[key] = i
    }
  })
  const hasHeader = cols.en !== undefined || cols.tr !== undefined
  const data = hasHeader ? rows.slice(1) : rows
  const enCol = cols.en ?? 0
  const trCol = cols.tr ?? (enCol === 0 ? 1 : 0)

  return data
    .map((r) => ({
      en: r[enCol] ?? '',
      tr: r[trCol] ?? '',
      emoji: cols.emoji !== undefined ? (r[cols.emoji] ?? '') : '',
      category: cols.category !== undefined ? (r[cols.category] ?? '') : '',
    }))
    .filter((d) => d.en)
}

export async function downloadTemplate() {
  const XLSX = await loadXlsx()
  const ws = XLSX.utils.aoa_to_sheet([
    ['İngilizce', 'Türkçe', 'Kategori'],
    ['elephant', 'fil', 'Hayvanlar'],
    ['blue', 'mavi', 'Renkler'],
    ['orange', '', ''],
  ])
  ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kelimeler')
  XLSX.writeFile(wb, 'kelime-sablonu.xlsx')
}
