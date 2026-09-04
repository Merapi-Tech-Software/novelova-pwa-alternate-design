import { useCallback } from 'react'
import { useNavigate } from 'react-router'

/**
 * Dua hal kecil seputar perpindahan halaman yang dipakai lintas fitur.
 */

/**
 * Tombol kembali yang tidak pernah jadi tombol mati · FR-CORE-05.
 *
 * `history.back()` polos tidak melakukan apa-apa saat halaman dibuka lewat
 * tautan langsung, notifikasi, atau hasil pencarian — dan prototipe memakainya
 * di mana-mana (PRD 02 §7 #5, PRD 10 §7 #5/#6). Pola PRD: mundur bila ada
 * riwayat, kalau tidak lompat ke induk yang masuk akal.
 */
export function useBackNavigation(fallback = '/'): () => void {
  const navigate = useNavigate()

  return useCallback(() => {
    if (window.history.length > 1) navigate(-1)
    else navigate(fallback)
  }, [navigate, fallback])
}

/**
 * Tujuan setelah masuk — **hanya path internal**.
 *
 * `?next=https://situs-lain` adalah open redirect: penyerang mengirim tautan
 * masuk yang sah ke aplikasi ini, lalu memindahkan pengguna ke tiruannya persis
 * setelah kredensial diketik. `//situs-lain` sama saja, hanya lebih halus.
 */
export function safeNext(next: string | null | undefined): string {
  return next?.startsWith('/') && !next.startsWith('//') ? next : '/'
}
