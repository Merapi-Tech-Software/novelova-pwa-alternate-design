/**
 * Prerender halaman publik · todo-incoming-features.md A3.
 *
 * Perayap WhatsApp, X, dan Telegram **tidak menjalankan JavaScript**, jadi
 * `og:title` yang dipasang React tidak pernah terbaca — tiap cerita yang
 * dibagikan tampil sebagai tautan polos berdeskripsi aplikasi. Skrip ini
 * menulis satu `index.html` per cerita dan per penulis ke `dist/`, berisi
 * kerangka SPA yang sama **plus** meta pratinjaunya. Aplikasinya tetap menyala
 * seperti biasa di atasnya; yang berbeda cuma apa yang dilihat perayap.
 *
 * Jalan **sesudah** `vite build`, dan urutan itu disengaja: precache Workbox
 * dihitung saat build, jadi 70+ berkas HTML ini tidak ikut ke precache — tidak
 * ada gunanya di sana, dan navigasi offline sudah jatuh ke kerangka (§1.45).
 *
 * Datanya dari katalog contoh, lewat `ssrLoadModule` Vite supaya alias `@/`,
 * TypeScript, dan impor JSON diselesaikan alat yang sama dengan aplikasinya —
 * bukan disalin ke sini. Saat backend nyata ada, langkah ini harus jadi dinamis
 * (edge/SSR); itu batas yang sudah ditulis di keputusannya.
 *
 * Jalankan: `npm run build` (sudah termasuk) · atau `node scripts/prerender.mjs`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const ORIGIN = 'https://novelova.merapiapp.my.id'

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/index.html belum ada — jalankan `vite build` lebih dulu.')
  process.exit(1)
}

const shell = readFileSync(join(DIST, 'index.html'), 'utf8')

/**
 * Server Vite dalam mode middleware, **tanpa mendengarkan port**: cuma dipakai
 * sebagai pemuat modul yang memahami `@/`, `.ts`, dan `.json`.
 */
const vite = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

let halaman = []
try {
  const catalog = await vite.ssrLoadModule('/src/api/mock/data/catalog.ts')
  const images = await vite.ssrLoadModule('/src/api/mock/sampleImages.ts')

  // Pemetaan id & sampul **sama persis** dengan `seed.ts` — kalau seed berubah,
  // yang ini ikut salah, dan `check:build` yang menangkapnya.
  const semua = [
    ...catalog.CATALOG.map((s) => ({ id: s.id, title: s.title, synopsis: s.synopsis ?? '' })),
    ...catalog.FILLER.map((s, i) => ({ id: `s${i + 9}`, title: s.title, synopsis: s.synopsis })),
  ]
  const cerita = semua.map((s, i) => ({
    ...s,
    path: `/cerita/${s.id}`,
    image: images.pickImage(images.COVER_URLS, i),
    type: 'book',
  }))
  const penulis = catalog.CATALOG_AUTHORS.map((name, i) => ({
    id: `a${i + 1}`,
    title: `${name} — penulis di Novelova`,
    synopsis: `Cerita-cerita karya ${name}.`,
    path: `/pengguna/a${i + 1}`,
    image: null,
    type: 'profile',
  }))
  halaman = [...cerita, ...penulis]
} finally {
  await vite.close()
}

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

/** Sinopsis dipotong 160 karakter — panjang yang masih ditampilkan utuh oleh pratinjau WhatsApp. */
const ringkas = (s) => (s.length > 160 ? `${s.slice(0, 157).trimEnd()}…` : s)

function render(p) {
  const title = `${p.title} · Novelova`
  const desc = ringkas(p.synopsis)
  const url = ORIGIN + p.path
  const meta = [
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${p.type}" />`,
    `<meta property="og:site_name" content="Novelova" />`,
    `<meta property="og:title" content="${esc(p.title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    p.image ? `<meta property="og:image" content="${esc(p.image)}" />` : '',
    `<meta name="twitter:card" content="${p.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(p.title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    p.image ? `<meta name="twitter:image" content="${esc(p.image)}" />` : '',
  ]
    .filter(Boolean)
    .join('\n    ')

  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*\/>/, meta)
}

let n = 0
for (const p of halaman) {
  const dir = join(DIST, p.path)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), render(p))
  n += 1
}

// Sitemap lahir di sini juga: daftarnya sama, dan `robots.txt` menunjuknya.
const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${ORIGIN}/</loc><lastmod>${today}</lastmod></url>
${halaman.map((p) => `  <url><loc>${esc(ORIGIN + p.path)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync(join(DIST, 'sitemap.xml'), sitemap)

console.log(`✓ prerender: ${n} halaman publik + sitemap.xml ditulis ke ${dirname(DIST)}/dist`)
