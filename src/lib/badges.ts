import type { Outfit } from '../types'

export interface BadgeStats {
  stars: number
  learned: number
  sessions: number
  perfectGames: number
  days: number
  /** Longest run of days in a row. */
  streak: number
  /** Weeks that reached the weekly goal. */
  weekGoals: number
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
  { id: 'streak-3', emoji: '⚡', title: '3 Gün Seri', subtitle: 'Three in a row!', hint: '3 gün üst üste çalış', test: (s) => s.streak >= 3 },
  { id: 'streak-7', emoji: '🌈', title: '7 Gün Seri', subtitle: 'A whole week!', hint: '7 gün üst üste çalış', test: (s) => s.streak >= 7 },
  { id: 'week-goal', emoji: '🗓️', title: 'Haftalık Hedef', subtitle: 'Goal reached!', hint: 'Bir haftada 5 gün çalış', test: (s) => s.weekGoals >= 1 },
  { id: 'week-goal-4', emoji: '🏅', title: '4 Hafta Hedef', subtitle: 'Super steady!', hint: '4 hafta haftalık hedefe ulaş', test: (s) => s.weekGoals >= 4 },
  { id: 'learned-100', emoji: '🏰', title: '100 Kelime', subtitle: 'Word king!', hint: '100 kelime öğren', test: (s) => s.learned >= 100 },
  { id: 'sessions-50', emoji: '🥇', title: '50 Oyun', subtitle: 'Game hero!', hint: '50 oyun bitir', test: (s) => s.sessions >= 50 },
  { id: 'stars-500', emoji: '🚀', title: '500 Yıldız', subtitle: 'To the moon!', hint: '500 yıldız topla', test: (s) => s.stars >= 500 },
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
  { id: 'glasses', name: 'Güneş Gözlüğü', emoji: '🕶️', stars: 60 },
  { id: 'bowtie', name: 'Papyon', emoji: '🎀', stars: 80 },
  { id: 'crown', name: 'Şampiyon Tacı', emoji: '👑', stars: 100 },
  { id: 'party', name: 'Parti Şapkası', emoji: '🥳', stars: 150 },
  { id: 'wizard', name: 'Büyücü Şapkası', emoji: '🧙', stars: 250 },
]
