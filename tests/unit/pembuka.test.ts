import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Layar pembuka di `index.html` · Fase 14b-e.
 *
 * `<style>`-nya inline dan berwarna hex literal — satu-satunya tempat di
 * proyek ini yang boleh punya hex di luar `tokens.css`, karena ia harus
 * tergambar sebelum berkas CSS mana pun termuat. `check-tokens.mjs` hanya
 * memindai `src/**`, jadi ia tidak melihatnya; berarti ia juga satu-satunya
 * tempat yang bisa menyimpang dari token tanpa ada yang tahu. Penjaganya test
 * ini, bukan niat.
 */

const html = readFileSync('index.html', 'utf8')
const tokens = readFileSync('src/styles/tokens.css', 'utf8')

const gaya = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? ''
const pembuka = /<div id="pembuka"[\s\S]*?<\/div>\n/.exec(html)?.[0] ?? ''

function token(nama: string, gelap = false): string {
  const blok = gelap ? tokens.slice(tokens.indexOf('[data-theme="dark"]')) : tokens
  const m = new RegExp(`--${nama}:\\s*(#[0-9a-fA-F]{6})`).exec(blok)
  if (!m?.[1]) throw new Error(`token --${nama} tidak ditemukan`)
  return m[1].toLowerCase()
}

describe('layar pembuka · index.html', () => {
  it('markup dan gayanya ada, di luar #root', () => {
    expect(pembuka).toContain('role="status"')
    expect(pembuka).toContain('aria-label="Memuat Novelova"')
    // Di luar `#root`: `layarGagal()` menolak menggambar bila `#root` berisi,
    // dan layar pembuka di dalamnya membungkam layar gagal `APP-INIT-TIMEOUT`.
    expect(html.indexOf('<div id="pembuka"')).toBeLessThan(html.indexOf('<div id="root">'))
    expect(pembuka).not.toContain('id="root"')
  })

  it('warnanya persis token putaran 7 — terang dan malam', () => {
    const latar = /#pembuka\{[^}]*background:(#[0-9a-fA-F]{6})/.exec(gaya)?.[1]?.toLowerCase()
    const halaman = /#pembuka \.h\{[^}]*fill:(#[0-9a-fA-F]{6})/.exec(gaya)?.[1]?.toLowerCase()
    const punggung = /#pembuka \.p\{fill:(#[0-9a-fA-F]{6})/.exec(gaya)?.[1]?.toLowerCase()
    const malam =
      /prefers-color-scheme:dark\)\{#pembuka\{background:(#[0-9a-fA-F]{6})\}#pembuka \.p\{fill:(#[0-9a-fA-F]{6})/.exec(
        gaya,
      )

    expect(latar).toBe(token('nv-bg'))
    expect(halaman).toBe(token('nv-gold-line'))
    expect(punggung).toBe(token('nv-accent'))
    expect(malam?.[1]?.toLowerCase()).toBe(token('nv-bg', true))
    expect(malam?.[2]?.toLowerCase()).toBe(token('nv-text-2', true))
  })

  it('theme-color sama dengan latar layar pembuka', () => {
    const themeColor = /<meta name="theme-color" content="(#[0-9a-fA-F]{6})"/.exec(html)?.[1]
    expect(themeColor?.toLowerCase()).toBe(token('nv-bg'))
  })

  it('menghormati gerak dikurangi, dan berukuran kecil', () => {
    expect(gaya).toMatch(/prefers-reduced-motion:reduce\)\{#pembuka \.h\{animation:none/)
    // Tiap byte di sini terkalikan 78 halaman prerender (A3).
    const ukuran = Buffer.byteLength(gaya) + Buffer.byteLength(pembuka)
    expect(ukuran).toBeLessThan(2_048)
  })
})
