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

const ROOT = new URL('..', import.meta.url).pathname
const ALLOWED = new Set(['src/styles/tokens.css'])

/** `#fff`, `#ffffff`, `#ffffff80` — tetapi bukan `#fragment` di URL atau id JSX. */
const HEX = /#[0-9a-fA-F]{3,8}\b/g

const violations = []

for await (const file of glob('src/**/*.{ts,tsx,css}', { cwd: ROOT })) {
  const path = file.split('\\').join('/')
  if (ALLOWED.has(path)) continue

  const lines = readFileSync(`${ROOT}${file}`, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const match of line.matchAll(HEX)) {
      const value = match[0]
      // Hanya panjang yang sah sebagai warna; `#f1` atau `#abcdefghi` bukan.
      if (![4, 5, 7, 9].includes(value.length)) continue
      violations.push({ path, line: i + 1, value, text: line.trim() })
    }
  })
}

if (violations.length === 0) {
  console.log('✓ token: tidak ada hex warna di luar src/styles/tokens.css')
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
