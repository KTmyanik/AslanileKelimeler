const PREFERRED_EN = ['Google US English', 'Samantha', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira', 'Karen']

const voices: Partial<Record<string, SpeechSynthesisVoice>> = {}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (voices[lang]) return voices[lang]
  const all = window.speechSynthesis?.getVoices() ?? []
  const prefix = lang.slice(0, 2)
  const candidates = all.filter((v) => v.lang.replace('_', '-').startsWith(prefix))
  const v =
    (prefix === 'en' &&
      PREFERRED_EN.map((n) => candidates.find((c) => c.name.includes(n))).find(Boolean)) ||
    candidates.find((c) => c.lang.replace('_', '-') === lang) ||
    candidates[0]
  if (v) voices[lang] = v
  return v
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    for (const k of Object.keys(voices)) delete voices[k]
  }
}

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text: string, lang: 'en-US' | 'tr-TR' = 'en-US', rate = 0.8) {
  if (!canSpeak || !text) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = rate
  u.pitch = 1.05
  const v = pickVoice(lang)
  if (v) u.voice = v
  synth.speak(u)
}
