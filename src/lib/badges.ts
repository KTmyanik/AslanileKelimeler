import type { Outfit } from '../types'

export interface BadgeStats {
  stars: number
  learned: number
  sessions: number
  perfectGames: number
  days: number
}

export interface Badge {
  id: string
  emoji: string
  title: string
  subtitle: string
  hint: string
  test: (s: BadgeStats) => boolean
}

export const BADGES: Badge[] = [
  { id: 'first-star', emoji: '⭐', title: 'İlk Yıldız', subtitle: 'First star!', hint: '1 yıldız topla', test: (s) => s.stars >= 1 },
  { id: 'stars-25', emoji: '🌟', title: '25 Yıldız', subtitle: 'Shining!', hint: '25 yıldız topla', test: (s) => s.stars >= 25 },
  { id: 'stars-100', emoji: '💫', title: '100 Yıldız', subtitle: 'Super star!', hint: '100 yıldız topla', test: (s) => s.stars >= 100 },
  { id: 'stars-250', emoji: '🏆', title: 'Yıldız Avcısı', subtitle: 'Champion!', hint: '250 yıldız topla', test: (s) => s.stars >= 250 },
  { id: 'learned-5', emoji: '🧠', title: '5 Kelime', subtitle: 'Smart lion!', hint: '5 kelime öğren', test: (s) => s.learned >= 5 },
  { id: 'learned-20', emoji: '📚', title: '20 Kelime', subtitle: 'Bookworm!', hint: '20 kelime öğren', test: (s) => s.learned >= 20 },
  { id: 'learned-50', emoji: '🎓', title: '50 Kelime', subtitle: 'Word master!', hint: '50 kelime öğren', test: (s) => s.learned >= 50 },
  { id: 'perfect-1', emoji: '💯', title: 'Hatasız!', subtitle: 'Perfect!', hint: 'Bir oyunu hatasız bitir', test: (s) => s.perfectGames >= 1 },
  { id: 'sessions-5', emoji: '💪', title: 'Çalışkan Aslan', subtitle: 'Hard worker!', hint: '5 oyun bitir', test: (s) => s.sessions >= 5 },
  { id: 'sessions-20', emoji: '🔥', title: 'Durdurulamaz', subtitle: 'On fire!', hint: '20 oyun bitir', test: (s) => s.sessions >= 20 },
  { id: 'days-3', emoji: '📅', title: '3 Gün', subtitle: 'Great habit!', hint: '3 farklı gün çalış', test: (s) => s.days >= 3 },
  { id: 'days-7', emoji: '🦁', title: 'Aslan Kalpli', subtitle: 'Lion heart!', hint: '7 farklı gün çalış', test: (s) => s.days >= 7 },
]

export interface OutfitInfo {
  id: Outfit
  name: string
  emoji: string
  stars: number
}

export const OUTFITS: OutfitInfo[] = [
  { id: 'none', name: 'Sade', emoji: '🦁', stars: 0 },
  { id: 'scarf', name: 'Sarı-Kırmızı Atkı', emoji: '🧣', stars: 30 },
  { id: 'crown', name: 'Şampiyon Tacı', emoji: '👑', stars: 100 },
]
