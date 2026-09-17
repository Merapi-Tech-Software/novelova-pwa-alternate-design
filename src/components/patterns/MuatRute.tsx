import { type CSSProperties, useEffect, useState } from 'react'
import { t } from '@/i18n/t'
import { MUAT_RUTE_TUNDA_MS } from '@/lib/limits'

/**
 * Indikator muat rute · todo.md Fase 14b-c.
 *
 * Fallback `Suspense` di akar aplikasi: tampil saat modul halaman belum ada
 * — muat pertama, muat ulang keras, dan tautan langsung. **Bukan** untuk
 * perpindahan di dalam aplikasi: React Router 7 membungkus navigasi dalam
 * transisi, jadi halaman lama tetap tergambar sampai modul barunya tiba, dan
 * fallback ini tidak pernah dipanggil di sana. Itu perilaku yang lebih baik
 * daripada indikator mana pun, dan sengaja dibiarkan.
 *
 * Dua keputusan yang membentuknya:
 *
 * 1. **Tidak menggambar apa pun selama `MUAT_RUTE_TUNDA_MS`.** Modul yang tiba
 *    dalam 180 md tidak perlu diumumkan; yang diumumkan hanya penantian yang
 *    terasa.
 * 2. **Siluet yang sama dengan layar pembuka, gerakan yang sama** — supaya
 *    keduanya terbaca sebagai satu aplikasi. Warnanya lewat `currentColor` dan
 *    token, bukan hex: SVG logo di `public/` tidak boleh disalin ke sini
 *    (aturan struktur #1, `npm run check` menjaganya).
 *
 * Menempati area konten, bukan lapisan di atas segalanya: lapisan penuh layar
 * menghalangi ketukan, dan sapuan e2e yang **menekan** tombol akan gagal
 * berselang-seling dengan gejala yang terbaca seperti cacat produk.
 */

/** Tujuh halaman kipas: urutan, sudut lipat awal, dan jalurnya (`mark-mono-emas.svg`). */
const HALAMAN: ReadonlyArray<readonly [sudut: number, jalur: string]> = [
  [78, 'M32 49L-0.03 40.8Q0.62 37.6 1.26 36.81Z'],
  [54, 'M32 49L6.07 28.48Q7.48 25.72 8.88 25.36Z'],
  [28, 'M32 49L16.66 19.71Q18.58 17.65 20.5 18Z'],
  [0, 'M32 49L29.9 16Q32 14.8 34.1 16Z'],
  [-28, 'M32 49L43.5 18Q45.42 17.65 47.34 19.71Z'],
  [-54, 'M32 49L55.12 25.36Q56.52 25.72 57.93 28.48Z'],
  [-78, 'M32 49L62.74 36.81Q63.38 37.6 64.03 40.8Z'],
]

const PUNGGUNG = 'M7 50Q19.5 44.5 32 50Q44.5 44.5 57 50V57Q44.5 51.5 32 57Q19.5 51.5 7 57Z'

export function MuatRute() {
  const [tampil, setTampil] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setTampil(true), MUAT_RUTE_TUNDA_MS)
    return () => clearTimeout(id)
  }, [])

  if (!tampil) return null

  return (
    <div role="status" className="grid min-h-[60dvh] place-items-center px-6">
      <svg viewBox="0 0 64 64" className="w-16 text-nv-gold-line" aria-hidden>
        {HALAMAN.map(([sudut, jalur], i) => (
          <path
            key={jalur}
            d={jalur}
            fill="currentColor"
            className="origin-[32px_49px] [transform-box:view-box] animate-[nvKembang_.55s_cubic-bezier(.2,.7,.2,1)_both,nvDenyut_2.4s_ease-in-out_infinite] motion-reduce:animate-none"
            style={
              {
                '--r': sudut,
                animationDelay: `${i * 55}ms, ${900 + i * 55}ms`,
              } as CSSProperties
            }
          />
        ))}
        <path d={PUNGGUNG} className="fill-nv-accent" />
      </svg>
      <span className="sr-only">{t('state.loading')}</span>
    </div>
  )
}
