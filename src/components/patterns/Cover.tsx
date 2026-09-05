import type { ReactNode } from 'react'
import { useState } from 'react'
import { cx } from '@/lib/cx'

export interface CoverProps {
  /**
   * Kosong berarti jaket satu huruf, bukan kotak abu-abu. `null` ikut diterima
   * karena itulah yang dikirim seam API untuk cerita tanpa sampul — memaksa
   * pemanggil menulis `?? undefined` cuma memindahkan pekerjaannya.
   */
  src?: string | null | undefined
  /** Dipakai untuk huruf jaket **dan** untuk memilih warna dasarnya. */
  title: string
  /** Ditempel di pojok kiri atas — badge peringkat, `Rising`, `Hot`. */
  badge?: ReactNode
  className?: string
}

/**
 * Sampul cerita: **potret 2:3, radius kecil, satu bayangan**.
 *
 * Tiga aturan brief §1 yang semuanya ada di sini:
 * ubin "album art" membulat dilarang, jadi radiusnya 5px bukan 16;
 * bayangan hanya boleh di sampul, supaya sampul terbaca sebagai benda fisik;
 * dan sampul tanpa artwork memakai **jaket satu huruf**, bukan ikon buku
 * generik yang membuat sepuluh cerita terlihat sebagai sepuluh salinan.
 *
 * Rasio 2:3 di sini adalah rasio yang sama yang divalidasi saat penulis
 * mengunggahnya (toleransi ±0,12, `architecture.md` §1.5) — bukan kebetulan.
 */
export function Cover({ src, title, badge, className }: CoverProps) {
  /*
   * **Sampul yang gagal dimuat jatuh ke jaket hurufnya, bukan ke ikon rusak.**
   * Sampul contoh adalah URL jarak jauh, dan sejak beranda memakai sampul 80px
   * satu layar memuat ~30 gambar alih-alih ~12 — CDN yang mati atau perangkat
   * yang offline dulu menghasilkan sebaris ikon patah. Jaketnya sudah ada untuk
   * cerita tanpa artwork; ini cuma memakainya untuk satu kegagalan lagi.
   */
  // Yang disimpan **URL yang gagal**, bukan sebuah bendera. Dengan begitu sampul
  // baru tidak mewarisi kegagalan sampul lama saat komponennya dipakai ulang di
  // rel atau saat daftarnya diurut ulang — dan tidak perlu efek yang mereset
  // apa pun, karena tidak ada yang perlu direset.
  const [gagal, setGagal] = useState<string | null>(null)
  const image = src && src !== gagal ? src : null

  return (
    // `<span class="block">`, bukan `<div>`: hampir setiap pemakainya menaruh
    // sampul ini di dalam `<a>`, dan elemen blok di dalam elemen inline bukan
    // HTML yang sah.
    <span
      className={cx(
        'relative block aspect-[2/3] shrink-0 overflow-hidden rounded-nv-cover shadow-nv-soft',
        className,
      )}
      style={image ? undefined : { background: jacketOf(title) }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          onError={() => setGagal(image)}
          className="size-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="grid size-full place-items-center font-display text-[2.6em] text-nv-gold-line leading-none"
        >
          {firstLetterOf(title)}
        </span>
      )}
      {badge && (
        <span className="absolute top-1.5 left-1.5 rounded-nv-pill bg-nv-card/92 px-2 py-0.5 font-bold text-[10px] text-nv-text uppercase tracking-wide">
          {badge}
        </span>
      )}
    </span>
  )
}

/**
 * Huruf pertama yang **terlihat**, bukan `title[0]`: judul boleh diawali kutip,
 * tanda tanya, atau spasi, dan jaket bertuliskan `"` tidak menandai apa pun.
 */
function firstLetterOf(title: string): string {
  const match = title.match(/\p{L}|\p{N}/u)
  return (match?.[0] ?? '?').toUpperCase()
}

/**
 * Tiga dasar jaket, dipilih dari judulnya sendiri — jadi satu cerita selalu
 * mendapat warna yang sama, di halaman mana pun, tanpa menyimpan apa pun.
 *
 * ponytail: jumlah huruf, bukan hash sungguhan. Sebarannya cukup untuk tiga
 * keranjang dan tidak ada yang bergantung pada keseragamannya; kalau kelak
 * jaketnya perlu lebih dari tiga warna, ganti ini dengan hash yang benar.
 */
function jacketOf(title: string): string {
  const i = (title.length % 3) + 1
  return `var(--nv-jacket-${i})`
}
