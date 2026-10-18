# Aslan ile Kelimeler 🦁

2. sınıf öğrencisi için İngilizce kelime çalışma uygulaması. Kelimeler ekran görüntüsünden (yapay zekâ ile), Excel/CSV dosyasından veya elle eklenir; çocuk kartlar ve oyunlarla çalışır, ebeveyn ilerlemeyi takip eder.

## Çalıştırma

- **Kolay yol:** `baslat.bat` dosyasına çift tıklayın. Tarayıcıda `http://localhost:5199` açılır.
- **Terminalden:** `npm install` (ilk sefer) ve ardından `npm run dev`.

**Tablet veya telefondan açmak için:** Cihaz bilgisayarla aynı Wi-Fi ağında olmalı. Terminalde görünen `Network: http://192.168.x.x:5199` adresini cihazın tarayıcısında açın. Adres çubuğundaki menüden "Ana ekrana ekle" seçilirse uygulama gibi açılır.

## Bölümler

**Çocuk ekranı**
- **Kartlar:** İngilizce kelime, emoji ve sesli okunuş gösterilir. Karta dokununca Türkçe anlamı çıkar.
- **Dinle ve Seç:** Kelime sesli okunur, çocuk doğru resmi seçer.
- **Eşleştir:** İngilizce kelimeler resim ve anlamlarıyla eşleştirilir.
- **Hafıza:** Kelime kartı ile resim kartı çifti bulunur.
- **Ödüllerim:** Toplanan yıldızlar ve rozetler burada görünür. Aslan için atkı (30 ⭐) ve taç (100 ⭐) kostümleri açılır.

**Ebeveyn paneli** (ilk PIN: `1234`, Ayarlar'dan değiştirin)
- **Kelime Ekle:**
  - Ekran görüntüsü seçilebilir, sürüklenebilir veya Ctrl+V ile yapıştırılabilir.
  - Excel dosyası yüklenebilir. İlk sütun İngilizce, ikinci sütun Türkçe olmalı; Türkçe boş bırakılabilir.
  - Kelimeler elle de yazılabilir.
  - Kaydetmeden önce liste kontrol edilip düzenlenebilir.
- **Kelimeler:** Arama, filtreleme, düzenleme ve silme.
- **İlerleme:** Öğrenilen kelimeler, zorlanılan kelimeler, listelere göre durum ve son 14 günün takvimi.
- **Ayarlar:** Çocuğun adı, PIN, yapay zekâ bağlantı testi, yedek alma ve geri yükleme, ilerlemeyi sıfırlama.

**Öğrenme kuralı:** Bir kelime arka arkaya 3 kez doğru bilinince "Öğrendi" sayılır. Yanlış yapılan kelime tekrar "Öğreniyor" durumuna döner ve oyunlarda daha sık çıkar.

## Notlar

- Veriler cihazın tarayıcısında saklanır. Bilgisayar ve tablet ayrı verilere sahiptir; taşımak için Ayarlar'daki yedek alma ve geri yükleme özelliğini kullanın.
- Gemini API anahtarı `.env.local` dosyasındadır ve git'e eklenmez. Kullanılacak model `VITE_GEMINI_MODEL` ile seçilir. Bu model yoğunsa veya kapatılmışsa uygulama sırayla yedek modelleri dener.
- Sesli okuma tarayıcının kendi sesini kullanır. En iyi sonuç Chrome veya Edge'de alınır.
