import { useEffect } from 'react'
import { api } from '@/api/client'
import { isApiError, VISIBLE_CODES } from '@/api/errors'
import { ACCESS_REFRESH_SKEW_S } from '@/lib/limits'
import { useSession } from '@/stores/session'

/**
 * Menghidrasi sesi dari cookie refresh, lalu menjaganya tetap hidup.
 *
 * **"Ingat saya" tidak muncul di sini, dan itu disengaja.** Yang membedakan sesi
 * panjang dari sesi sekali pakai adalah umur cookie di server, bukan perilaku
 * klien. Klien selalu memperbarui sebelum token akses habis; kalau cookienya
 * cookie sesi dan peramban sudah ditutup, permintaan itu gagal — dan itulah
 * persis arti "berakhir saat peramban ditutup".
 */
export function useSessionBootstrap(): void {
  const status = useSession((s) => s.status)
  const expiresAt = useSession((s) => s.expiresAt)

  useEffect(() => {
    if (status !== 'unknown') return

    let alive = true
    api.refresh().then(
      (session) => {
        if (alive) useSession.getState().setSession(session)
      },
      () => {
        // Hidrasi gagal karena alasan apa pun berarti tidak ada yang bisa
        // dilakukan sebagai pengguna masuk: tamu, dan profil basi dibuang.
        if (alive) useSession.getState().clearSession()
      },
    )
    return () => {
      alive = false
    }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated' || !expiresAt) return

    const delay = Math.max(0, Date.parse(expiresAt) - Date.now() - ACCESS_REFRESH_SKEW_S * 1_000)
    const timer = setTimeout(() => {
      api.refresh().then(
        (session) => {
          useSession.getState().setSession(session)
        },
        (error: unknown) => {
          // Sesi yang benar-benar berakhir memunculkan **lembar masuk ulang**,
          // bukan mengeluarkan pengguna: halaman yang sedang dibuka tetap utuh
          // (FR-AUTH-12 × FR-STUDIO-34). Jaringan putus tidak melakukan apa-apa
          // — permintaan berikutnya yang menolak akan mengurus dirinya sendiri.
          if (isApiError(error) && error.code === VISIBLE_CODES.AUTH_EXPIRED) {
            useSession.getState().requireReauth()
          }
        },
      )
    }, delay)

    return () => clearTimeout(timer)
  }, [status, expiresAt])
}
