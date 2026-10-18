import http from 'node:http'

const html = `<!doctype html>
<meta charset="utf-8">
<title>Kelimeler taşınıyor</title>
<body style="font-family:sans-serif;padding:2rem;max-width:36rem">
<p id="msg">Kelimeler aranıyor…</p>
<script>
const KEY = 'aslan-kelime-v1'
const COPIED = 'aslan-kelime-copied'
const msg = document.getElementById('msg')
const force = new URLSearchParams(location.search).has('yeniden')

if (localStorage.getItem(COPIED) === '1' && !force) {
  msg.textContent = 'Kelimeler daha önce taşındı. Uygulamaya dönülüyor…'
  location.replace('http://localhost:5199/')
} else {
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    msg.innerHTML = 'Bu tarayıcıda eski kelime kaydı yok. Kelimeleri eklediğiniz tarayıcıda (Chrome veya Edge) <b>http://localhost:5173/</b> adresini açın.'
  } else {
    fetch('http://localhost:5199/api/migrate-stash', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ raw }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.token) throw new Error('token')
        localStorage.setItem(COPIED, '1')
        msg.textContent = 'Kelimeler bulundu. Uygulamaya dönülüyor…'
        location.replace('http://localhost:5199/?geri=' + data.token)
      })
      .catch(() => {
        msg.textContent = 'Taşıma başarısız. http://localhost:5199 açık mı diye bakıp sayfayı yenileyin.'
      })
  }
}
</script>
</body>`

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(html)
})

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.log('5173 zaten açık')
    process.exit(0)
  }
  console.error(err)
  process.exit(1)
})

server.listen(5173, () => {
  console.log('Eski kelime köprüsü: http://localhost:5173/')
})
