import type { WordDraft } from '../types'

const API_KEY: string = import.meta.env.VITE_GEMINI_API_KEY ?? ''
const MODELS: string[] = [
  ...new Set([
    import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
  ]),
]
const RETRYABLE = new Set([404, 429, 500, 503])
let preferred = 0

export const hasAI = API_KEY.length > 0

const CATEGORIES =
  'Hayvanlar, Renkler, Sayılar, Meyveler, Yiyecekler, Okul, Aile, Vücut, Giysiler, Doğa, Oyunlar, Ev, Duygular, Eylemler, Selamlaşma, Taşıtlar, Meslekler, Hava Durumu, Diğer'

const RULES = `Kurallar:
- "en": İngilizce kelime veya kısa ifade. Küçük harf kullan (yalnızca "I" ve özel isimler hariç).
- "tr": 7-8 yaşındaki bir çocuğun anlayacağı kısa, doğal Türkçe anlam. Görselde Türkçe anlam yazıyorsa onu kullan.
- "emoji": kelimeyi en iyi anlatan TEK bir emoji. Soyut kelimelerde bile en yakın emojiyi seç.
- "category": şu kategorilerden biri: ${CATEGORIES}.`

const SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      en: { type: 'STRING' },
      tr: { type: 'STRING' },
      emoji: { type: 'STRING' },
      category: { type: 'STRING' },
    },
    required: ['en', 'tr', 'emoji', 'category'],
    propertyOrdering: ['en', 'tr', 'emoji', 'category'],
  },
}

type Part = { text: string } | { inline_data: { mime_type: string; data: string } }

/** Models get retired or overloaded without notice, so walk the list until one answers. */
async function request(body: string): Promise<Response> {
  let last: Response | null = null
  for (let n = 0; n < MODELS.length; n++) {
    const i = (preferred + n) % MODELS.length
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELS[i]}:generateContent`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY }, body },
    )
    if (res.ok) {
      preferred = i
      return res
    }
    last = res
    if (!RETRYABLE.has(res.status)) break
  }
  const status = last?.status ?? 0
  if (status === 429) throw new Error('Yapay zekâ kotası doldu, biraz sonra tekrar deneyin.')
  if (status === 503) throw new Error('Yapay zekâ şu an çok yoğun, birkaç dakika sonra tekrar deneyin.')
  throw new Error(`Yapay zekâ hatası (${status}): ${(await last?.text())?.slice(0, 200) ?? ''}`)
}

async function generate(parts: Part[]): Promise<WordDraft[]> {
  if (!hasAI) throw new Error('Yapay zekâ anahtarı tanımlı değil (.env.local).')
  const res = await request(
    JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    }),
  )
  const json = await res.json()
  const text: string =
    json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  if (!text) throw new Error('Yapay zekâ boş yanıt döndü.')
  const parsed = JSON.parse(text) as WordDraft[]
  return parsed
    .filter((d) => d && typeof d.en === 'string' && d.en.trim())
    .map((d) => ({
      en: d.en.trim(),
      tr: (d.tr ?? '').trim(),
      emoji: (d.emoji ?? '').trim(),
      category: (d.category ?? '').trim(),
    }))
}

export async function wordsFromImage(image: { data: string; mimeType: string }): Promise<WordDraft[]> {
  return generate([
    {
      text: `Bu görsel, 2. sınıfa giden bir çocuğun İngilizce dersinden (ders kitabı, çalışma kâğıdı veya öğretmenin paylaştığı liste).
Görselde öğrenilmesi beklenen İngilizce kelimeleri ve kısa kalıpları çıkar.
Yönergeleri ("Listen and repeat", "Match" gibi), sayfa numaralarını, uzun cümleleri ve tekrarları DAHİL ETME.
Görselde hiç İngilizce kelime yoksa boş liste döndür.

${RULES}`,
    },
    { inline_data: { mime_type: image.mimeType, data: image.data } },
  ])
}

/** Fills in missing meaning / emoji / category, keeping the given meanings. Order is preserved. */
export async function enrichWords(items: { en: string; tr: string }[]): Promise<WordDraft[]> {
  const result = await generate([
    {
      text: `Aşağıdaki İngilizce kelimeler 2. sınıfa giden bir çocuk için. Her biri için aynı sırayla bir kayıt döndür.
"tr" alanı doluysa AYNEN koru, boşsa sen doldur. "en" alanını değiştirme.

${RULES}

Kelimeler:
${JSON.stringify(items)}`,
    },
  ])
  return items.map((it, i) => {
    const r = result.find((x) => x.en.toLowerCase() === it.en.toLowerCase()) ?? result[i]
    return {
      en: it.en,
      tr: it.tr || r?.tr || '',
      emoji: r?.emoji || '',
      category: r?.category || '',
    }
  })
}

export async function testConnection(): Promise<boolean> {
  try {
    const r = await enrichWords([{ en: 'cat', tr: '' }])
    return r.length === 1 && !!r[0].tr
  } catch {
    return false
  }
}
