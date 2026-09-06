import { useSyncExternalStore } from 'react'

/**
 * Status jaringan · FR-CORE-03 · architecture.md §10.3.
 *
 * `useSyncExternalStore`, bukan `useState` + `useEffect`: ia membaca nilainya
 * **saat render**, jadi tidak ada satu frame pun ketika layar mengira masih
 * online padahal tidak. Untuk keadaan yang menentukan apakah sebuah tombol boleh
 * ditekan, satu frame salah sudah cukup untuk satu ketukan yang gagal diam-diam.
 *
 * `navigator.onLine` **tidak menjamin internet** — ia cuma tahu ada antarmuka
 * jaringan yang menyala. Yang `false` pasti offline; yang `true` belum tentu
 * sampai. Karena itu ia dipakai untuk **menahan** aksi disertai penjelasan, bukan
 * untuk menyatakan semuanya baik-baik saja.
 */

function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    // Di server / prarender tidak ada `navigator`: anggap online supaya tidak
    // ada layar "tanpa koneksi" yang tergambar sebelum peramban sempat menjawab.
    () => true,
  )
}
