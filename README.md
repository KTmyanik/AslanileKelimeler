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
- **Seviye (Resimli / Resimsiz):** Ana sayfadan seçilir ve cihazda hatırlanır. Resimsiz seviyede resimler ipucu vermez:
  - Kartlar'da resim kartın arkasına geçer. Diğer oyunlarda yalnızca yazı görünür; resim doğru cevap bulununca ortaya çıkar.
  - Türkçe anlamı boş olan kelimelerde resim yerinde kalır, çünkü kelimeyi ayırt edecek başka bir şey yoktur.
  - İpucu oyununda resim yalnızca kendi İngilizce ipucu yazılmış kelimelerde gizlenir (Kelimeler › Düzenle). Kategori ipucu tek başına cevabı göstermez.
  - Rekor oyununda her seviyenin rekoru ayrı tutulur.
- **Ödüllerim:** Toplanan yıldızlar ve rozetler burada görünür. Yıldızlarla aslan için kostümler açılır: atkı (30 ⭐), güneş gözlüğü (60), papyon (80), taç (100), parti şapkası (150), büyücü şapkası (250).
- **Seri ve haftalık hedef:** Ana sayfada üst üste kaç gün çalışıldığı ve bu haftanın günleri görünür. Haftalık hedef 5 gündür. Seri ve haftalık hedef için de rozetler vardır.
- **Yol Haritası:** Her liste bir duraktır; öğrenilen kelime oranına göre 1-3 yıldız alır. Durağa dokununca oyunlar o listeyle oynanır. Liste sayısı 6'yı geçince ana sayfadaki liste düğmeleri yerine haritaya giden bir bağlantı çıkar.
- **Çıkartmalarım:** Öğrenilen her kelime bir çıkartma olur. Öğrenilmekte olanlar soluk, hiç çalışılmamışlar "?" görünür.

**Ebeveyn paneli** (ilk PIN: `1234`, Ayarlar'dan değiştirin)
- **Kelime Ekle:**
  - Ekran görüntüsü seçilebilir, sürüklenebilir veya Ctrl+V ile yapıştırılabilir.
  - Excel dosyası yüklenebilir. İlk sütun İngilizce, ikinci sütun Türkçe olmalı; Türkçe boş bırakılabilir.
  - Kelimeler elle de yazılabilir.
  - Kaydetmeden önce liste kontrol edilip düzenlenebilir.
- **Paketler:**
  - **Ders kitabı: Cambridge Primary Path 1 (2. baskı).** 9 ünite, ünite başına 21 kelime. Kelimeler Cambridge'in bu kitap için yayımladığı içerik tablosundaki (Level 1 Teacher's Edition, ISBN 978-1-009-79808-2) ünite anahtar kelimeleridir; Türkçe anlamlar ve resimler sonradan eklendi. Her ünite "Unit 1 · Aile" gibi bir liste olur. Başlangıç listesinde ya da konu paketlerinde zaten olan bir kelime, ilerlemesiyle birlikte üniteye taşınır. Ebeveynin kendi oluşturduğu listelere dokunulmaz.
  - **Ek konu paketleri.** 16 paket, 191 kelime: hayvanlar, renkler, sayılar, okul, giysiler, yiyecekler ve diğerleri. Kelimeler Cambridge Pre A1 Starters konularından seçilmiştir; resmî listenin tamamı değildir. Zaten kayıtlı kelimeler atlanır.
  - Her iki grubun da hedef çubuğu vardır (İlerleme bölümünde de görünür). Yol Haritası'ndaki "Büyük hedef", kitaptan bir ünite eklendiyse kitabı, eklenmediyse konu paketlerini gösterir.
- **Kelimeler:** Arama, filtreleme, düzenleme ve silme.
- **İlerleme:** Öğrenilen kelimeler, zorlanılan kelimeler, listelere göre durum ve son 14 günün takvimi.
- **Ayarlar:** Çocuğun adı, PIN, yapay zekâ bağlantı testi, yedek alma ve geri yükleme, ilerlemeyi sıfırlama.

**Öğrenme kuralı:** Bir kelime arka arkaya 3 kez doğru bilinince "Öğrendi" sayılır. Yanlış yapılan kelime tekrar "Öğreniyor" durumuna döner ve oyunlarda daha sık çıkar.

## Notlar

- **Veriler ve eşitleme:** İlerleme, uygulamayı çalıştıran bilgisayarda `data/ilerleme.json` dosyasında tutulur. Dosya git'e eklenmez.
  - Aynı Wi-Fi ağındaki tablet ve telefonlar bu dosyayla eşitlenir. Bir cihazdaki değişiklik birkaç saniye içinde kaydedilir. Diğer cihazlar en geç 20 saniye içinde ya da uygulamaya geri dönülünce yeni durumu alır.
  - İki cihaz aynı anda kullanılırsa değişiklikler birleştirilir. Yıldızlar ve doğru/yanlış sayıları toplanır, silinen kelimeler silinmiş kalır, iki cihazda eklenen kelimeler tek kopya olur.
  - Bir cihaz ilk kez bağlandığında kendi ilerlemesi dosyadakiyle birleştirilir; hiçbir şey kaybolmaz.
  - Tarayıcıdaki kopya önbellek olarak kalır. Bilgisayara ulaşılamazsa çocuk oynamaya devam eder; değişiklikler bağlantı gelince gönderilir. Tarayıcı verisi silinirse ilerleme dosyadan geri gelir.
  - Seviye (Resimli / Resimsiz) ve seçili liste her cihazda ayrıdır.
  - Dosyanın günlük kopyası `data/yedek/` klasöründe tutulur (son 14 gün). Bir güne geri dönmek için Ayarlar › "Yedekten geri yükle" ile o günün dosyasını seçin; tüm cihazlar o hale döner.
  - Durum, Ebeveyn › Ayarlar › Cihazlar arası eşitleme kartında görünür.
- Gemini API anahtarı `.env.local` dosyasındadır ve git'e eklenmez. Kullanılacak model `VITE_GEMINI_MODEL` ile seçilir. Bu model yoğunsa veya kapatılmışsa uygulama sırayla yedek modelleri dener.
- Sesli okuma tarayıcının kendi sesini kullanır. En iyi sonuç Chrome veya Edge'de alınır.
