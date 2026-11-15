import type { Word, WordDraft } from '../types'
import { normalizeEn, statusOf } from './learning'

/**
 * Ready-made word packs for primary school. The themes and words are a selection from
 * the topics of Cambridge Pre A1 Starters, not the official list itself.
 */
export interface Pack {
  id: string
  name: string
  emoji: string
  words: WordDraft[]
}

type Row = [en: string, tr: string, emoji: string, category?: string]

function pack(id: string, name: string, emoji: string, category: string, rows: Row[]): Pack {
  return { id, name, emoji, words: rows.map(([en, tr, e, c]) => ({ en, tr, emoji: e, category: c ?? category })) }
}

export const PACKS: Pack[] = [
  pack('animals', 'Hayvanlar', '🐾', 'Hayvanlar', [
    ['cat', 'kedi', '🐱'],
    ['dog', 'köpek', '🐶'],
    ['bird', 'kuş', '🐦'],
    ['fish', 'balık', '🐟'],
    ['horse', 'at', '🐴'],
    ['cow', 'inek', '🐮'],
    ['sheep', 'koyun', '🐑'],
    ['goat', 'keçi', '🐐'],
    ['duck', 'ördek', '🦆'],
    ['chicken', 'tavuk', '🐔'],
    ['frog', 'kurbağa', '🐸'],
    ['mouse', 'fare', '🐭'],
    ['monkey', 'maymun', '🐵'],
    ['elephant', 'fil', '🐘'],
    ['giraffe', 'zürafa', '🦒'],
    ['lion', 'aslan', '🦁'],
    ['tiger', 'kaplan', '🐯'],
    ['bear', 'ayı', '🐻'],
    ['zebra', 'zebra', '🦓'],
    ['snake', 'yılan', '🐍'],
    ['crocodile', 'timsah', '🐊'],
    ['hippo', 'su aygırı', '🦛'],
    ['spider', 'örümcek', '🕷️'],
  ]),
  pack('colors', 'Renkler', '🎨', 'Renkler', [
    ['red', 'kırmızı', '🔴'],
    ['blue', 'mavi', '🔵'],
    ['yellow', 'sarı', '🟡'],
    ['green', 'yeşil', '🟢'],
    ['orange', 'turuncu', '🟠'],
    ['purple', 'mor', '🟣'],
    ['pink', 'pembe', '🩷'],
    ['brown', 'kahverengi', '🟤'],
    ['black', 'siyah', '⚫'],
    ['white', 'beyaz', '⚪'],
    ['grey', 'gri', '🩶'],
  ]),
  pack('numbers', 'Sayılar', '🔢', 'Sayılar', [
    ['one', 'bir', '1️⃣'],
    ['two', 'iki', '2️⃣'],
    ['three', 'üç', '3️⃣'],
    ['four', 'dört', '4️⃣'],
    ['five', 'beş', '5️⃣'],
    ['six', 'altı', '6️⃣'],
    ['seven', 'yedi', '7️⃣'],
    ['eight', 'sekiz', '8️⃣'],
    ['nine', 'dokuz', '9️⃣'],
    ['ten', 'on', '🔟'],
  ]),
  pack('family', 'Aile ve Arkadaşlar', '👨‍👩‍👧', 'Aile', [
    ['mother', 'anne', '👩'],
    ['father', 'baba', '👨'],
    ['sister', 'kız kardeş', '👧'],
    ['brother', 'erkek kardeş', '👦'],
    ['baby', 'bebek', '👶'],
    ['grandmother', 'büyükanne', '👵'],
    ['grandfather', 'büyükbaba', '👴'],
    ['family', 'aile', '👪'],
    ['friend', 'arkadaş', '🧑‍🤝‍🧑'],
  ]),
  pack('body', 'Vücudumuz', '🧍', 'Vücut', [
    ['face', 'yüz', '😊'],
    ['eye', 'göz', '👁️'],
    ['ear', 'kulak', '👂'],
    ['nose', 'burun', '👃'],
    ['mouth', 'ağız', '👄'],
    ['teeth', 'dişler', '🦷'],
    ['hair', 'saç', '💇'],
    ['arm', 'kol', '💪'],
    ['hand', 'el', '✋'],
    ['leg', 'bacak', '🦵'],
    ['foot', 'ayak', '🦶'],
  ]),
  pack('fruit', 'Meyve ve Sebze', '🍎', 'Meyveler', [
    ['apple', 'elma', '🍎'],
    ['banana', 'muz', '🍌'],
    ['lemon', 'limon', '🍋'],
    ['grapes', 'üzüm', '🍇'],
    ['pear', 'armut', '🍐'],
    ['watermelon', 'karpuz', '🍉'],
    ['strawberry', 'çilek', '🍓'],
    ['carrot', 'havuç', '🥕', 'Yiyecekler'],
    ['tomato', 'domates', '🍅', 'Yiyecekler'],
    ['potato', 'patates', '🥔', 'Yiyecekler'],
  ]),
  pack('food', 'Yiyecek ve İçecek', '🍽️', 'Yiyecekler', [
    ['bread', 'ekmek', '🍞'],
    ['milk', 'süt', '🥛'],
    ['water', 'su', '💧'],
    ['juice', 'meyve suyu', '🧃'],
    ['egg', 'yumurta', '🥚'],
    ['cheese', 'peynir', '🧀'],
    ['cake', 'pasta', '🎂'],
    ['chocolate', 'çikolata', '🍫'],
    ['ice cream', 'dondurma', '🍦'],
    ['pizza', 'pizza', '🍕'],
    ['burger', 'hamburger', '🍔'],
    ['sandwich', 'sandviç', '🥪'],
    ['rice', 'pilav', '🍚'],
  ]),
  pack('school', 'Okul', '🏫', 'Okul', [
    ['school', 'okul', '🏫'],
    ['teacher', 'öğretmen', '🧑‍🏫'],
    ['book', 'kitap', '📕'],
    ['notebook', 'defter', '📓'],
    ['pencil', 'kurşun kalem', '✏️'],
    ['pen', 'tükenmez kalem', '🖊️'],
    ['crayon', 'pastel boya', '🖍️'],
    ['eraser', 'silgi', '🧽'],
    ['ruler', 'cetvel', '📏'],
    ['scissors', 'makas', '✂️'],
    ['bag', 'çanta', '🎒'],
    ['paper', 'kâğıt', '📄'],
    ['computer', 'bilgisayar', '💻'],
  ]),
  pack('clothes', 'Giysiler', '👕', 'Giysiler', [
    ['T-shirt', 'tişört', '👕'],
    ['shirt', 'gömlek', '👔'],
    ['dress', 'elbise', '👗'],
    ['trousers', 'pantolon', '👖'],
    ['shorts', 'şort', '🩳'],
    ['jacket', 'ceket', '🧥'],
    ['shoes', 'ayakkabı', '👟'],
    ['boots', 'çizme', '👢'],
    ['socks', 'çorap', '🧦'],
    ['hat', 'şapka', '👒'],
    ['cap', 'kasket', '🧢'],
    ['glasses', 'gözlük', '👓'],
  ]),
  pack('toys', 'Oyuncaklar', '🧸', 'Oyunlar', [
    ['ball', 'top', '⚽'],
    ['doll', 'oyuncak bebek', '🪆'],
    ['teddy bear', 'oyuncak ayı', '🧸'],
    ['kite', 'uçurtma', '🪁'],
    ['robot', 'robot', '🤖'],
    ['balloon', 'balon', '🎈'],
    ['puzzle', 'yapboz', '🧩'],
    ['game', 'oyun', '🎲'],
    ['guitar', 'gitar', '🎸'],
    ['piano', 'piyano', '🎹'],
    ['drum', 'davul', '🥁'],
  ]),
  pack('transport', 'Taşıtlar', '🚗', 'Taşıtlar', [
    ['car', 'araba', '🚗'],
    ['bus', 'otobüs', '🚌'],
    ['taxi', 'taksi', '🚕'],
    ['truck', 'kamyon', '🚚'],
    ['train', 'tren', '🚆'],
    ['plane', 'uçak', '✈️'],
    ['helicopter', 'helikopter', '🚁'],
    ['boat', 'tekne', '⛵'],
    ['ship', 'gemi', '🚢'],
    ['bike', 'bisiklet', '🚲'],
    ['motorbike', 'motosiklet', '🏍️'],
  ]),
  pack('home', 'Evimiz', '🏠', 'Ev', [
    ['house', 'ev', '🏠'],
    ['door', 'kapı', '🚪'],
    ['window', 'pencere', '🪟'],
    ['bed', 'yatak', '🛏️'],
    ['chair', 'sandalye', '🪑'],
    ['sofa', 'kanepe', '🛋️'],
    ['kitchen', 'mutfak', '🍳'],
    ['bathroom', 'banyo', '🛁'],
    ['garden', 'bahçe', '🌷'],
    ['clock', 'saat', '⏰'],
    ['lamp', 'lamba', '💡'],
    ['TV', 'televizyon', '📺'],
    ['phone', 'telefon', '📱'],
    ['key', 'anahtar', '🔑'],
  ]),
  pack('nature', 'Doğa ve Hava', '🌤️', 'Doğa', [
    ['sun', 'güneş', '☀️'],
    ['moon', 'ay', '🌙'],
    ['star', 'yıldız', '⭐'],
    ['tree', 'ağaç', '🌳'],
    ['flower', 'çiçek', '🌸'],
    ['sea', 'deniz', '🌊'],
    ['beach', 'plaj', '🏖️'],
    ['mountain', 'dağ', '⛰️'],
    ['cloud', 'bulut', '☁️', 'Hava Durumu'],
    ['rain', 'yağmur', '🌧️', 'Hava Durumu'],
    ['snow', 'kar', '❄️', 'Hava Durumu'],
    ['wind', 'rüzgâr', '💨', 'Hava Durumu'],
    ['rainbow', 'gökkuşağı', '🌈', 'Hava Durumu'],
    ['hot', 'sıcak', '🥵', 'Hava Durumu'],
    ['cold', 'soğuk', '🥶', 'Hava Durumu'],
  ]),
  pack('feelings', 'Duygular', '😀', 'Duygular', [
    ['happy', 'mutlu', '😀'],
    ['sad', 'üzgün', '😢'],
    ['angry', 'kızgın', '😠'],
    ['scared', 'korkmuş', '😨'],
    ['tired', 'yorgun', '😴'],
    ['hungry', 'aç', '🤤'],
  ]),
  pack('actions', 'Eylemler', '🏃', 'Eylemler', [
    ['run', 'koşmak', '🏃'],
    ['jump', 'zıplamak', '🤸'],
    ['swim', 'yüzmek', '🏊'],
    ['walk', 'yürümek', '🚶'],
    ['eat', 'yemek yemek', '🍽️'],
    ['drink', 'içmek', '🥤'],
    ['sleep', 'uyumak', '🛌'],
    ['sing', 'şarkı söylemek', '🎤'],
    ['dance', 'dans etmek', '💃'],
    ['read', 'okumak', '📖'],
    ['write', 'yazmak', '✍️'],
    ['draw', 'resim çizmek', '🖼️'],
    ['play', 'oynamak', '🎮'],
  ]),
  pack('greetings', 'Selamlaşma', '👋', 'Selamlaşma', [
    ['hello', 'merhaba', '👋'],
    ['goodbye', 'hoşça kal', '🙋'],
    ['good morning', 'günaydın', '🌅'],
    ['good night', 'iyi geceler', '🌃'],
    ['please', 'lütfen', '🥺'],
    ['thank you', 'teşekkür ederim', '🙏'],
    ['sorry', 'özür dilerim', '😔'],
    ['yes', 'evet', '✅'],
    ['no', 'hayır', '❌'],
  ]),
]

const PACK_KEYS = new Set(PACKS.flatMap((p) => p.words.map((w) => normalizeEn(w.en))))

/** The pack a list came from, matched by name. */
export function packOfList(list: string): Pack | undefined {
  return PACKS.find((p) => p.name === list)
}

/** Progress toward knowing every pack word, whichever list the word sits in. */
export function packGoal(words: readonly Word[]): { learned: number; added: number; total: number } {
  const inPacks = words.filter((w) => PACK_KEYS.has(normalizeEn(w.en)))
  return {
    learned: inPacks.filter((w) => statusOf(w) === 'learned').length,
    added: inPacks.length,
    total: PACK_KEYS.size,
  }
}
