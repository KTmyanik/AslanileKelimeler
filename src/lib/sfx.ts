let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + start
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

export const sfx = {
  correct() {
    tone(660, 0, 0.15, 'triangle')
    tone(990, 0.1, 0.25, 'triangle')
  },
  wrong() {
    tone(260, 0, 0.18, 'sine', 0.12)
    tone(200, 0.12, 0.25, 'sine', 0.1)
  },
  flip() {
    tone(520, 0, 0.08, 'triangle', 0.08)
  },
  win() {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle'))
  },
}
