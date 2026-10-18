import confetti from 'canvas-confetti'

const COLORS = ['#FDB913', '#C8102E', '#FFE08A', '#FF6B6B', '#ffffff']

export function celebrate(big = false) {
  void confetti({ particleCount: big ? 160 : 70, spread: big ? 100 : 70, origin: { y: 0.6 }, colors: COLORS })
  if (big) {
    setTimeout(() => void confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 }, colors: COLORS }), 250)
    setTimeout(() => void confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 }, colors: COLORS }), 400)
  }
}
