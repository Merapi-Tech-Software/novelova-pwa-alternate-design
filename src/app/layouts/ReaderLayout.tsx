import { Outlet } from 'react-router'

/**
 * Ruang baca: layar penuh, tanpa nav dan tanpa bilah atas (FR-READ-14).
 *
 * Layout ini sengaja tidak menaruh apa pun di atas teks — kontrol bacanya milik
 * halaman itu sendiri dan muncul hanya saat diketuk.
 */
export function ReaderLayout() {
  return (
    <div className="min-h-dvh bg-nv-paper">
      <Outlet />
    </div>
  )
}
