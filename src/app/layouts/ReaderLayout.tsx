import { Outlet } from 'react-router'

/**
 * Ruang baca: layar penuh, tanpa nav dan tanpa bilah atas (FR-READ-14).
 *
 * Layout ini sengaja tidak menaruh apa pun di atas teks — kontrol bacanya milik
 * halaman itu sendiri dan muncul hanya saat diketuk.
 */
export function ReaderLayout() {
  return (
    // `<main>`, bukan `<div>`: tanpa landmark, seluruh ruang baca berada di luar
    // wilayah bernama, dan pembaca layar tidak punya cara melompat ke isinya.
    <main id="konten" tabIndex={-1} className="min-h-dvh bg-nv-paper">
      <Outlet />
    </main>
  )
}
