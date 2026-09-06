#!/usr/bin/env node
/**
 * Menegakkan aturan struktur #1: **satu warna hex hanya boleh ditulis di
 * `src/styles/tokens.css`** (architecture.md §3).
 *
 * Biome tidak punya aturan untuk ini, dan aturannya terlalu penting untuk
 * dititipkan pada disiplin — begitu satu hex bocor ke komponen, tema gelap dan
 * penggantian palet berhenti bekerja secara diam-diam di satu tempat saja.
 *
 * Dijalankan sebagai bagian dari `npm run check`.
 */
import { readFileSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * `fileURLToPath`, **bukan `.pathname`**.
 *
 * `new URL('..', import.meta.url).pathname` mengembalikan
 * `/C:/Novelova/Mobile%20app%20module%20selection/novelova-v2/` — spasinya
 * ter-persen-encode dan ada garis miring di depan. Sebagai `cwd` untuk `glob`
 * itu direktori yang tidak ada, jadi glob-nya menghasilkan **nol berkas** dan
 * pemeriksaan ini melaporkan "bersih" tanpa pernah membaca satu baris pun.
 *
 * Terukur saat audit Fase 14: nol dari 256 berkas terpindai, dan sudah begitu
 * sejak skrip ini ada. Nama folder proyek ini memang berspasi — itulah yang
 * membedakannya dari mesin lain.
 */
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ALLOWED = new Set(['src/styles/tokens.css'])

/** `#fff`, `#ffffff`, `#ffffff80` — tetapi bukan `#fragment` di URL atau id JSX. */
const HEX = /#[0-9a-fA-F]{3,8}\b/g

const violations = []
let terpindai = 0

for await (const file of glob('src/**/*.{ts,tsx,css}', { cwd: ROOT })) {
  terpindai += 1
  const path = file.split('\\').join('/')
  if (ALLOWED.has(path)) continue

  const lines = readFileSync(`${ROOT}${file}`, 'utf8').split('\n')
  lines.forEach((line, i) => {
    /*
     * **Baris komentar dilewati.** Proyek ini menulis alasan di dekat kodenya,
     * dan alasan soal warna sering menyebut hex-nya — "bukan `#b8b0a8` mockup",
     * "`--nv-accent-soft` di atas kertas = #e7e5e2". Melarangnya berarti
     * melarang penjelasan, bukan melarang warna keras.
     */
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return

    for (const match of line.matchAll(HEX)) {
      const value = match[0]
      // Hanya panjang yang sah sebagai warna; `#f1` atau `#abcdefghi` bukan.
      if (![4, 5, 7, 9].includes(value.length)) continue
      // Fragment URL seperti `#bab-12` bukan warna. Komentar lama sudah
      // menjanjikan pengecualian ini; sampai audit Fase 14 ia tidak pernah ada.
      if (line[(match.index ?? 0) + value.length] === '-') continue
      violations.push({ path, line: i + 1, value, text: line.trim() })
    }
  })
}

/*
 * **Nol berkas terpindai bukan "bersih".** Pemeriksaan yang tidak menemukan apa
 * pun untuk diperiksa harus berteriak, bukan menghijau — itu persis cara cacat
 * di atas bertahan tanpa terlihat.
 */
if (terpindai === 0) {
  console.error('✗ token: nol berkas terpindai — pola atau ROOT salah, bukan berarti bersih.')
  process.exit(1)
}

if (violations.length === 0) {
  console.log(`✓ token: tidak ada hex warna di luar src/styles/tokens.css (${terpindai} berkas)`)
  process.exit(0)
}

console.error(`\n✗ ${violations.length} hex warna di luar src/styles/tokens.css:\n`)
for (const v of violations) {
  console.error(`  ${relative('.', v.path)}:${v.line}  ${v.value}`)
  console.error(`    ${v.text.slice(0, 100)}`)
}
console.error('\nPakai token: var(--nv-…) di CSS, atau utility bg-nv-… / text-nv-… di JSX.')
console.error('Kalau warnanya memang baru, tambahkan sebagai token di tokens.css lebih dulu.\n')
process.exit(1)
