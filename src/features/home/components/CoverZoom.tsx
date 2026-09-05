import { Star, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Story } from '@/api/contracts'
import { Cover } from '@/components/patterns/Cover'
import { useScrollLock } from '@/lib/a11y'
import { formatCompactCoin } from '@/lib/coin'

export interface CoverZoomTarget {
  story: Story
  /** Sampul yang ditekan — titik tumbuh animasinya, dan tujuan fokus saat tutup. */
  origin: HTMLElement
}

/**
 * Sampul yang membesar · permintaan produk 5 September · `architecture.md` §1.22.
 *
 * **Ini satu-satunya tempat di aplikasi yang boleh membesar.** Brief §8 melarang
 * apa pun memantul atau membesar; §1.22 mencatat kenapa larangannya ditimpa di
 * sini, dan pengecualiannya dibatasi pada satu gerakan di satu halaman.
 *
 * Animasinya tumbuh **dari kotak sampul yang ditekan** menuju ukuran besar di
 * tengah, bukan dari titik tengah layar. Sampul di rel berjejer rapat, dan
 * lapisan yang muncul entah dari mana tidak memberi tahu sampul mana yang
 * dibuka.
 *
 * `prefers-reduced-motion` mematikan gerakannya sepenuhnya — lapisannya tetap
 * muncul. Menimpa aturan gerak untuk pengguna yang sudah menyatakan tidak mau
 * adalah dua pelanggaran, bukan satu.
 */
export function CoverZoom({ target, onClose }: { target: CoverZoomTarget; onClose: () => void }) {
  const { story, origin } = target
  const panel = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const [masuk, setMasuk] = useState(false)

  useScrollLock(true)

  /*
   * Kotak asalnya diukur **sekali saat dibuka**, bukan tiap render: gulir
   * halaman sudah terkunci, jadi angkanya tidak bisa basi — dan mengukurnya
   * ulang di tengah animasi justru membuat lapisannya melompat.
   */
  const [asal] = useState(() => origin.getBoundingClientRect())

  /*
   * **Lebar panelnya diukur, bukan dihitung ulang di JS.** Ukurannya ditentukan
   * CSS (`w-[min(...)]` di bawah), dan menyalin rumusnya ke sini berarti dua
   * tempat yang akan berselisih pada perubahan berikutnya — dan yang berselisih
   * adalah titik awal animasinya, jadi sampulnya akan melompat.
   *
   * `offsetWidth`, bukan `getBoundingClientRect()`: yang kedua ikut menghitung
   * `transform`, dan pada render pertama panel ini memang sedang diperkecil.
   *
   * `useLayoutEffect` supaya pengukurannya selesai **sebelum** peramban
   * menggambar; dengan `useEffect` sampulnya sempat tampil seukuran penuh satu
   * frame sebelum mengecil, dan kedipan itu justru yang paling terlihat.
   */
  const [lebar, setLebar] = useState(0)
  useLayoutEffect(() => setLebar(panel.current?.offsetWidth ?? 0), [])

  useEffect(() => {
    // Satu frame supaya peramban sempat memasang keadaan awalnya sebelum
    // transisi dimulai; tanpa ini lapisan langsung muncul di ukuran akhir.
    const id = requestAnimationFrame(() => setMasuk(true))
    closeButton.current?.focus()
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return

      // Fokus terkunci di dalam lapisan: di belakangnya ada seluruh beranda,
      // dan Tab yang keluar dari lapisan membawa fokus ke tautan yang tidak
      // terlihat.
      const bisa = panel.current.querySelectorAll<HTMLElement>('a[href], button')
      const pertama = bisa[0]
      const terakhir = bisa[bisa.length - 1]
      if (!pertama || !terakhir) return

      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault()
        terakhir.focus()
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault()
        pertama.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Fokus kembali ke sampul yang ditekan, bukan ke awal halaman — pembaca
  // sedang di tengah rel, dan mengembalikannya ke atas berarti kehilangan tempat.
  useEffect(() => () => origin.focus?.(), [origin])

  const skala = lebar > 0 && asal.width > 0 ? asal.width / lebar : 1
  const geserX = asal.left + asal.width / 2 - window.innerWidth / 2
  const geserY = asal.top + asal.height / 2 - window.innerHeight / 2
  // Sebelum terukur, panelnya dibiarkan di tempatnya — bukan diperkecil dengan
  // angka tebakan yang akan meleset dari titik asalnya.
  const awal = lebar > 0

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: penutup latar; Escape sudah ditangani di atas
    <div
      role="dialog"
      aria-modal="true"
      aria-label={story.title}
      /*
       * **Ketukan di mana saja menutup** — sampulnya, judulnya, statistiknya,
       * latarnya. Satu-satunya yang dikecualikan `Buka cerita`, dan itu cukup
       * diperiksa lewat `closest('a')`: tombol `Tutup` memang menutup juga.
       *
       * Dulu hanya latarnya yang menutup, dan itu benar sampai lapisannya
       * diperbesar: setelah sampulnya memenuhi lebar layar, sisa latar di
       * kiri-kanan tinggal ~20px dan praktis tidak bisa dikenai jari.
       */
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('a')) onClose()
      }}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-nv-scrim p-4 transition-opacity duration-200 motion-reduce:transition-none"
      style={{ opacity: masuk ? 1 : 0 }}
    >
      <div
        ref={panel}
        /*
         * **Sebesar yang muat, dijepit dua arah.** `100%` menjaga marginnya di
         * layar sempit; suku kedua menjepitnya dengan tinggi layar supaya judul,
         * statistik, dan kedua tombol tidak pernah terdorong keluar — sampul 2:3
         * yang hanya dibatasi lebar akan tumbuh 1,5× lebih tinggi daripada
         * lebarnya dan mendorong tombolnya keluar layar di ponsel pendek atau
         * mode lanskap.
         *
         * `21rem` adalah ruang yang disisakan untuk judul, nama pena, baris
         * statistik, dua tombol, dan padding lapisannya. Ia **ikut naik** saat
         * teksnya diperbesar — cadangan yang tidak diperbarui bersamanya
         * mendorong tombolnya keluar layar di ponsel pendek. `dvh`, bukan `vh`:
         * bilah peramban seluler yang muncul-hilang mengubah tinggi yang
         * sebenarnya bisa dipakai.
         *
         * **`max(11rem, …)` adalah lantainya, dan ia bukan hiasan.** Menjepit
         * lebar dengan tinggi juga meremas teksnya, dan teks yang teremas justru
         * tumbuh tinggi: di lanskap 844×390 tanpa lantai ini panelnya jadi
         * 866px di layar setinggi 390 — judul dan tombolnya pecah jadi belasan
         * baris. Lantai itu menjaga teksnya tetap terbaca, dan `overflow-y-auto`
         * di lapisannya menjaga tombolnya tetap **terjangkau** pada bentuk layar
         * yang tetap tidak muat.
         */
        className="w-[min(100%,max(11rem,calc((100dvh-21rem)/1.5)))] origin-center transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{
          transform:
            masuk || !awal
              ? 'translate(0px, 0px) scale(1)'
              : `translate(${geserX}px, ${geserY}px) scale(${skala})`,
        }}
      >
        <Cover src={story.coverUrl} title={story.title} />

        {/*
          Semuanya **satu tingkat lebih besar** daripada di kartu: judul 20 → 26,
          nama pena dan statistik 12 → 14. Naik di dalam skala yang sudah ada,
          bukan angka baru — skalanya keputusan terkunci (§1.20), dan lapisan ini
          bukan alasan untuk menambah ukuran ketujuh.
        */}
        <p className="pt-4 text-center font-display text-page font-bold text-nv-on-scrim">
          {story.title}
        </p>
        <p className="pt-1 text-center text-body text-nv-on-scrim/75">{story.penName}</p>

        {/*
          Statistik pindah **ke sini**, bukan kembali ke kartunya: kartu di rel
          sengaja tinggal sampul dan judul, dan lapisan ini justru tempat
          pembaca berhenti untuk memutuskan. Angkanya dari `story.stats` yang
          sama dengan `Meta` di kartu bentuk daftar — bukan hitungan sendiri.

          Emasnya `--nv-gold-line`, bukan `--nv-gold`: yang kedua emas gelap
          untuk teks di atas kertas, dan di atas scrim gelap ia nyaris hilang.
        */}
        <p className="flex items-center justify-center gap-3 pt-2.5 text-body text-nv-on-scrim">
          <span className="inline-flex items-center gap-1 font-semibold">
            <Star size={15} className="fill-current text-nv-gold-line" aria-hidden />
            <span className="tabular-nums">{story.stats.rating.toFixed(1).replace('.', ',')}</span>
          </span>
          <span aria-hidden className="text-nv-on-scrim/40">
            ·
          </span>
          <span className="tabular-nums text-nv-on-scrim/75">
            {formatCompactCoin(story.stats.reads)} baca
          </span>
        </p>

        <div className="flex flex-col items-center gap-2 pt-5">
          <Link
            to={`/cerita/${story.id}`}
            className="flex h-11 w-full items-center justify-center rounded-nv-pill bg-nv-on-scrim px-5 text-body font-bold text-nv-text"
          >
            Buka cerita
          </Link>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="flex h-11 items-center gap-1.5 px-4 text-body font-semibold text-nv-on-scrim/80"
          >
            <X size={16} aria-hidden />
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
