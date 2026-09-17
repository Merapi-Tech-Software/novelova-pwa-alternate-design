/**
 * Membuat ikon PWA dan splash iOS dari **tanda logo** di
 * `public/assets/logo-novelova/` · todo.md Fase 14b-d.
 *
 * Folder logo itu **sumber**; `public/icons/` **turunan**. Jangan menyunting
 * `public/icons/` dengan tangan — ubah sumbernya, lalu jalankan skrip ini.
 * Sebelum Fase 14b skrip ini menggambar huruf "N" penampung; sekarang ia
 * membaca kipas emasnya langsung, jadi ikon di layar utama ponsel dan layar
 * pembuka di dalam aplikasi tidak bisa berselisih.
 *
 * **Playwright, bukan dependensi baru.** Ia sudah terpasang untuk e2e, dan
 * merender SVG lalu memotretnya adalah cara paling murah mendapat PNG berukuran
 * persis — menambah `sharp` atau `canvas` demi tugas yang dijalankan sekali
 * setiap beberapa bulan adalah dependensi yang harus dirawat selamanya.
 *
 * Dijalankan manual: `node scripts/buat-ikon.mjs`. Hasilnya di-commit, jadi
 * `npm ci` di mesin bersih tidak perlu menjalankannya.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

/** `--nv-bg` di `tokens.css`. Satu-satunya hex di sini; sisanya milik SVG sumber. */
const KERTAS = '#f4f2ef'
const SUMBER = new URL('../public/assets/logo-novelova/', import.meta.url)
const OUT = new URL('../public/icons/', import.meta.url)

/** Isi sebuah SVG sumber tanpa pembungkus `<svg>` dan `<title>`-nya, siap ditempel di `<g>`. */
async function isiTanda(nama) {
  const svg = await readFile(new URL(nama, SUMBER), 'utf8')
  return svg.replace(/<\/?svg[^>]*>/g, '').replace(/<title>.*?<\/title>/g, '')
}

const TANDA = await isiTanda('mark-terang.svg')
const TANDA_MONO = await isiTanda('favicon.svg')

/**
 * Satu lambang, dua bentuk.
 *
 * `padding` dalam persen: ikon biasa nyaris penuh, `maskable` menyisakan zona
 * aman 20 % karena Android memotongnya jadi lingkaran, kotak membulat, atau
 * bentuk lain yang tidak bisa kita tahu sebelumnya.
 *
 * Tanda sumber hidup di ruang 64×64 dengan kipas dari y≈14 sampai punggung di
 * y=57 — pusat visualnya ±35, bukan 32 — jadi digeser naik sedikit supaya
 * terlihat di tengah, bukan cuma terhitung di tengah.
 */
function svg(size, { padding = 8, bulat = 0.22, mono = false } = {}) {
  const p = (size * padding) / 100
  const dalam = size - p * 2
  const skala = dalam / 64
  const naik = -3.4 * skala

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Novelova">
  <title>Novelova</title>
  <rect width="${size}" height="${size}" rx="${size * bulat}" fill="${KERTAS}"/>
  <g transform="translate(${p} ${p + naik}) scale(${skala})">${mono ? TANDA_MONO : TANDA}</g>
</svg>`
}

/** Layar pembuka iOS: lambang kecil di tengah kanvas sewarna kertas — sambungannya ke layar pembuka `index.html` tak terlihat. */
function splashSvg(w, h) {
  const lambang = Math.round(Math.min(w, h) * 0.28)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${KERTAS}"/>
  <g transform="translate(${(w - lambang) / 2} ${(h - lambang) / 2})">
    ${svg(lambang, { padding: 0, bulat: 0 })
      .replace(/<\/?svg[^>]*>/g, '')
      .replace(/<title>.*?<\/title>/g, '')}
  </g>
</svg>`
}

async function potret(page, markup, w, h, nama) {
  await page.setViewportSize({ width: w, height: h })
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>${markup}`,
  )
  // `path` harus string: Playwright menebak formatnya dari ekstensi, dan
  // objek `URL` membuatnya melempar `lastIndexOf is not a function`.
  await page.screenshot({ path: fileURLToPath(new URL(nama, OUT)), omitBackground: false })
  return nama
}

const IKON = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  // Zona aman 20 % dan **tanpa sudut membulat**: Android yang menerapkan
  // maskingnya sendiri di atas ikon yang sudah membulat menghasilkan sudut ganda.
  ['icon-512-maskable.png', 512, { padding: 20, bulat: 0 }],
  ['apple-touch-icon.png', 180, { bulat: 0 }],
]

/**
 * Empat ukuran iPhone yang paling luas cakupannya.
 *
 * iOS hanya menampilkan splash bila media query-nya **cocok persis**, jadi
 * daftar parsial berarti sebagian perangkat tetap mendapat layar kosong — sama
 * seperti sekarang, tidak lebih buruk. Empat ini menutup SE sampai Pro Max.
 */
const SPLASH = [
  ['splash-750x1334.png', 750, 1334],
  ['splash-1125x2436.png', 1125, 2436],
  ['splash-1170x2532.png', 1170, 2532],
  ['splash-1290x2796.png', 1290, 2796],
]

const browser = await chromium.launch()
const page = await browser.newPage()
await mkdir(fileURLToPath(OUT), { recursive: true })

const dibuat = []
for (const [nama, size, opts] of IKON) {
  dibuat.push(await potret(page, svg(size, opts), size, size, nama))
}
for (const [nama, w, h] of SPLASH) {
  dibuat.push(await potret(page, splashSvg(w, h), w, h, nama))
}

// Favicon tetap SVG: satu berkas, tajam di semua ukuran. Versi mono 7 halaman,
// karena di 16–32 px gradasi dan kilau cuma jadi noda (aturan logo: <24 px mono).
await writeFile(fileURLToPath(new URL('favicon.svg', OUT)), svg(64, { mono: true }), 'utf8')
dibuat.push('favicon.svg')

await browser.close()
console.log(
  `✓ ${dibuat.length} berkas ikon dibuat di public/icons/ dari public/assets/logo-novelova/`,
)
for (const n of dibuat) console.log(`  · ${n}`)
