import { useEffect, useRef, useState } from 'react'
import { api } from '@/api/client'
import { PROGRESS_THROTTLE_MS } from '@/lib/limits'

/**
 * Merekam posisi baca · FR-READ-16.
 *
 * **Persentase, bukan piksel.** Piksel berubah artinya begitu pembaca menggeser
 * ukuran huruf, dan progres yang meleset setelah mengubah pengaturan terasa
 * seperti kehilangan tempat.
 *
 * Dikirim maksimal sekali per 10 detik, **plus sekali lagi saat halaman
 * ditinggalkan** — tanpa yang kedua, sepuluh detik terakhir bacaan hilang tiap
 * kali pembaca menutup tab, dan itu justru bagian yang paling ia ingat.
 *
 * Mengembalikan persentase yang sama untuk **hairline progres** di dasar layar
 * Type A (`7u`). Dikembalikan dari sini, bukan dari pendengar `scroll` kedua di
 * halaman: dua pendengar untuk satu angka adalah dua tempat yang bisa berselisih,
 * dan yang satu sudah menghitungnya.
 */
export function useReadingProgress(
  storyId: string | undefined,
  chapterId: string | undefined,
  enabled: boolean,
): number {
  const latest = useRef(0)
  const sentAt = useRef(0)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (!enabled || !storyId || !chapterId) return

    const send = () => {
      if (latest.current <= 0) return
      void api.saveProgress({ storyId, chapterId, scrollPct: latest.current })
    }

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      latest.current = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 1
      setPct(latest.current)

      const now = Date.now()
      if (now - sentAt.current >= PROGRESS_THROTTLE_MS) {
        sentAt.current = now
        send()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // `pagehide`, bukan `beforeunload`: yang kedua tidak pernah menyala di
    // peramban ponsel saat tab ditutup dari daftar aplikasi.
    window.addEventListener('pagehide', send)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', send)
      send()
    }
  }, [storyId, chapterId, enabled])

  return pct
}
