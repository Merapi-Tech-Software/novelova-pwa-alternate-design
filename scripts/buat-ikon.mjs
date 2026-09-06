/**
 * Membuat ikon PWA dan splash iOS dari satu sumber SVG.
 *
 * **Playwright, bukan dependensi baru.** Ia sudah terpasang untuk e2e, dan
 * merender SVG lalu memotretnya adalah cara paling murah mendapat PNG berukuran
 * persis — menambah `sharp` atau `canvas` demi tugas yang dijalankan sekali
 * setiap beberapa bulan adalah dependensi yang harus dirawat selamanya.
 *
 * Dijalankan manual: `node scripts/buat-ikon.mjs`. Hasilnya di-commit, jadi
 * `npm ci` di mesin bersih tidak perlu menjalankannya.
 *
 * Warnanya dari `src/styles/tokens.css` putaran 7 — kertas, tinta, emas garis.
 * Ikon yang warnanya tertinggal satu putaran adalah hal pertama yang dilihat
 * pengguna di layar utamanya.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const KERTAS = '#f4f2ef'
const TINTA = '#1c1a18'
const EMAS = '#b68235'
const OUT = new URL('../public/icons/', import.meta.url)

/**
 * Satu lambang, dua bentuk.
 *
 * `padding` dalam persen: ikon biasa nyaris penuh, `maskable` menyisakan zona
 * aman 20 % karena Android memotongnya jadi lingkaran, kotak membulat, atau
 * bentuk lain yang tidak bisa kita tahu sebelumnya.
 */
function svg(size, { padding = 8, bulat = 0.22 } = {}) {
  const p = (size * padding) / 100
  const inner = size - p * 2
  const font = inner * 0.62
  const garisY = p + inner * 0.82
  const garisW = inner * 0.42

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Novelova">
  <title>Novelova</title>
  <rect width="${size}" height="${size}" rx="${size * bulat}" fill="${KERTAS}"/>
  <text x="50%" y="${p + inner * 0.66}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-weight="600"
        font-size="${font}" fill="${TINTA}">N</text>
  <rect x="${(size - garisW) / 2}" y="${garisY}" width="${garisW}" height="${Math.max(2, inner * 0.045)}"
        rx="${Math.max(1, inner * 0.022)}" fill="${EMAS}"/>
</svg>`
}

/** Layar pembuka iOS: lambang kecil di tengah kanvas sewarna kertas. */
function splashSvg(w, h) {
  const lambang = Math.round(Math.min(w, h) * 0.28)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${KERTAS}"/>
  <g transform="translate(${(w - lambang) / 2} ${(h - lambang) / 2})">
    ${svg(lambang, { padding: 0, bulat: 0.22 })
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

// Favicon tetap SVG: satu berkas, tajam di semua ukuran, tanpa PNG tambahan.
await writeFile(fileURLToPath(new URL('favicon.svg', OUT)), svg(64), 'utf8')
dibuat.push('favicon.svg')

await browser.close()
console.log(`✓ ${dibuat.length} berkas ikon dibuat di public/icons/`)
for (const n of dibuat) console.log(`  · ${n}`)
