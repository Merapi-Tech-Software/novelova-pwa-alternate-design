import { render, screen } from '@testing-library/react'
import { MemoryRouter, matchRoutes, Route, Routes, useSearchParams } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { MOCK_PASSWORD } from '@/api/mock/handlers/session'
import { safeNext } from '@/lib/nav'
import { RequireAuth } from '@/routes/guards'
import { useSession } from '@/stores/session'

/**
 * `MemoryRouter`, bukan `createMemoryRouter` — lihat catatan di
 * `FilterableList.test.tsx`: data router membuat `Request` tiap navigasi dan
 * `AbortSignal` jsdom ditolak `Request` bawaan Node. Justru karena itu guard-nya
 * ditulis sebagai komponen, sehingga alur ini bisa diuji sama sekali.
 */
function Masuk() {
  const [params] = useSearchParams()
  return <p data-testid="tujuan">{params.get('next') ?? 'tanpa-next'}</p>
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/karya/jadwal" element={<p>halaman jadwal</p>} />
          <Route path="/" element={<p>beranda</p>} />
        </Route>
        <Route path="/masuk" element={<Masuk />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('penjaga rute', () => {
  it('tanpa sesi, tujuan asal ikut ke halaman masuk', () => {
    useSession.setState({ status: 'guest' })
    renderAt('/karya/jadwal?tab=mendatang')
    expect(screen.getByTestId('tujuan')).toHaveTextContent('/karya/jadwal?tab=mendatang')
  })

  it('beranda tidak menambah ?next= yang tidak berguna', () => {
    useSession.setState({ status: 'guest' })
    renderAt('/')
    expect(screen.getByTestId('tujuan')).toHaveTextContent('tanpa-next')
  })

  it('dengan sesi, halaman tampil apa adanya', () => {
    useSession.setState({ status: 'authenticated' })
    renderAt('/karya/jadwal')
    expect(screen.getByText('halaman jadwal')).toBeInTheDocument()
  })

  it('selama sesi belum diketahui, pengguna tidak diusir', () => {
    useSession.setState({ status: 'unknown' })
    renderAt('/karya/jadwal')
    expect(screen.queryByTestId('tujuan')).not.toBeInTheDocument()
    expect(screen.queryByText('halaman jadwal')).not.toBeInTheDocument()
  })

  it('tujuan dari luar aplikasi ditolak — bukan open redirect', () => {
    expect(safeNext('/koin/transaksi')).toBe('/koin/transaksi')
    expect(safeNext('https://situs-lain.example/ambil')).toBe('/')
    expect(safeNext('//situs-lain.example')).toBe('/')
    expect(safeNext(null)).toBe('/')
  })
})

/**
 * "Ingat saya" tidak diputuskan klien: ia adalah umur cookie refresh. Di server
 * tiruan cookie itu `localStorage` (bertahan) atau `sessionStorage` (mati
 * bersama peramban), jadi menutup peramban bisa disimulasikan dengan
 * `sessionStorage.clear()`.
 */
describe('masa berlaku sesi mengikuti "Ingat saya"', () => {
  const kredensial = { identity: 'annamaharani@example.com', password: MOCK_PASSWORD }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('tanpa dicentang, sesi berakhir saat peramban ditutup', async () => {
    await api.login({ ...kredensial, remember: false })
    expect(localStorage.getItem('novelova:mock-refresh')).toBeNull()

    sessionStorage.clear()
    await expect(api.refresh()).rejects.toMatchObject({ code: 'AUTH-401' })
  })

  it('dicentang, sesi bertahan setelah peramban ditutup', async () => {
    await api.login({ ...kredensial, remember: true })

    sessionStorage.clear()
    const session = await api.refresh()
    expect(session.user.username).toBe('annamaharani')
  })

  it('keluar menghapus cookie di kedua tempat', async () => {
    await api.login({ ...kredensial, remember: true })
    await api.logout()
    await expect(api.refresh()).rejects.toMatchObject({ code: 'AUTH-401' })
  })
})

/**
 * Mengimpor `@/routes` menjalankan `createBrowserRouter`, jadi konfigurasi rute
 * yang cacat gagal di sini — bukan di layar putih saat dibuka.
 */
describe('tabel rute', () => {
  it('memuat 42 rute — 41 dari §8 plus antrean tinjauan, tanpa path ganda', async () => {
    const { ROUTES } = await import('@/routes')

    // `/karya/tinjauan` tidak ada di tabel rute §8; FR-STUDIO-38 menuntut satu
    // tempat untuk empat sumber, dan menempelkannya ke layar jadwal akan
    // mencampur dua pertanyaan yang berbeda.
    expect(ROUTES).toHaveLength(42)
    expect(new Set(ROUTES.map((r) => r.path)).size).toBe(42)
    expect(ROUTES.map((r) => r.path)).toContain('/karya/tinjauan')
  })

  it('setiap rute benar-benar terjangkau, tidak ada yang tertutup rute lain', async () => {
    const { ROUTES, router } = await import('@/routes')
    for (const def of ROUTES) {
      const path = def.path.replace(/:\w+/g, 'contoh')
      const matched = matchRoutes(router.routes, path)?.at(-1)?.route.path
      expect(matched, `${def.path} tidak terjangkau`).toBe(def.path)
    }
  })
})

/**
 * Sesi yang putus di tengah pemakaian tidak boleh mengganti halaman: penulis
 * yang sedang mengetik kehilangan naskahnya kalau ia dilempar ke `/masuk`.
 */
describe('sesi berakhir di tengah pemakaian', () => {
  it('membuka lembar masuk ulang tanpa mengubah status jadi tamu', () => {
    useSession.setState({ status: 'authenticated', reauthOpen: false })
    useSession.getState().requireReauth()

    expect(useSession.getState().reauthOpen).toBe(true)
    expect(useSession.getState().status).toBe('authenticated')
  })

  it('menutup lembar tidak mengeluarkan pengguna', () => {
    useSession.getState().dismissReauth()

    expect(useSession.getState().reauthOpen).toBe(false)
    expect(useSession.getState().status).toBe('authenticated')
  })
})
