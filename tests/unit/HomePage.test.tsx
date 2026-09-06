import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { api } from '@/api/client'
import HomePage from '@/features/home/pages/HomePage'
import { defaultVisibility, useHomeSections } from '@/stores/homeSections'

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('beranda', () => {
  it('merender section discovery beserta tautan lihat-semua', async () => {
    renderHome()

    expect(await screen.findByRole('heading', { name: 'Populer' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'See all' }).length).toBeGreaterThan(0)
  })

  it('memilih tab mengganti section tematiknya, dan tiga section pertama tetap', async () => {
    renderHome()
    await screen.findByRole('heading', { name: 'Sedang Ramai Dibicarakan' })

    await userEvent.click(screen.getByRole('button', { name: 'Fantasy' }))

    // Ekornya berganti mengikuti tab…
    expect(await screen.findByRole('heading', { name: 'Dunia Lain' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Sedang Ramai Dibicarakan' }),
    ).not.toBeInTheDocument()

    // …sementara tiga section pertama tetap ada, dan bacaan pribadi tidak
    // pernah ikut tersaring.
    expect(screen.getByRole('heading', { name: 'Populer' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paling Banyak Dibuka' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lanjut Membaca' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Semua' }))
    expect(
      await screen.findByRole('heading', { name: 'Sedang Ramai Dibicarakan' }),
    ).toBeInTheDocument()
  })
})

describe('pengaturan section · FR-HOME-06 · FR-HOME-16', () => {
  it('mematikan sakelar menghilangkan section-nya dari feed', async () => {
    // Bukan `localStorage.clear()`: cookie refresh server tiruan juga tinggal di
    // sana, dan menghapusnya membuat seluruh permintaan menjawab AUTH-401.
    localStorage.removeItem('home_section_visibility_v1')
    useHomeSections.setState({ visible: defaultVisibility() })
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    await userEvent.click(screen.getByRole('button', { name: 'Pengaturan section' }))
    await userEvent.click(screen.getByRole('switch', { name: 'Populer' }))

    expect(screen.queryByRole('heading', { name: 'Populer' })).not.toBeInTheDocument()
    // Sakelarnya sendiri tetap ada — pengaturan pengguna dan keadaan kosong
    // adalah dua hal berbeda (FR-HOME-16).
    expect(screen.getByRole('switch', { name: 'Populer' })).toBeInTheDocument()
  })

  it('kesembilan sakelar selalu ada, termasuk blok yang sedang kosong', async () => {
    // Bukan `localStorage.clear()`: cookie refresh server tiruan juga tinggal di
    // sana, dan menghapusnya membuat seluruh permintaan menjawab AUTH-401.
    localStorage.removeItem('home_section_visibility_v1')
    useHomeSections.setState({ visible: defaultVisibility() })
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    await userEvent.click(screen.getByRole('button', { name: 'Pengaturan section' }))
    expect(screen.getAllByRole('switch')).toHaveLength(9)
  })
})

describe('mengganti tab', () => {
  it('memicu tepat satu pemuatan ulang', async () => {
    const spy = vi.spyOn(api, 'getHomeFeed')
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const before = spy.mock.calls.length
    await userEvent.click(screen.getByRole('button', { name: 'My Kisah' }))
    await screen.findByRole('heading', { name: 'Kisah Pilu' })

    // Satu tab ditekan = satu permintaan. Dua berarti penyaringnya dikirim dua
    // kali, dan pembaca membayar dua kali menunggu untuk hasil yang sama.
    expect(spy.mock.calls.length - before).toBe(1)
    expect(spy).toHaveBeenLastCalledWith('My Kisah')

    spy.mockRestore()
  })
})

describe('susunan ulang beranda · §1.22', () => {
  it('tiga section prioritas mendahului banner, dan banner mendahului tab genre', async () => {
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    /*
     * Urutan diperiksa lewat **posisi DOM**, bukan lewat urutan larik section:
     * yang berubah di §1.22 adalah susunan yang dilihat pembaca, dan larik yang
     * benar dengan JSX yang salah tetap menghasilkan halaman yang salah.
     */
    const urutan = (a: Element, b: Element) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING

    const populer = screen.getByRole('heading', { name: 'Populer' })
    const banyakDibuka = screen.getByRole('heading', { name: 'Paling Banyak Dibuka' })
    const tabFantasy = screen.getByRole('button', { name: 'Fantasy' })

    expect(urutan(populer, banyakDibuka)).toBeTruthy()
    expect(urutan(banyakDibuka, tabFantasy)).toBeTruthy()
  })

  it('ganti tab tidak mengubah tiga section teratas, tetapi mengubah yang di bawahnya', async () => {
    renderHome()
    await screen.findByRole('heading', { name: 'Sedang Ramai Dibicarakan' })

    /*
     * Dibandingkan **antar dua tab**, bukan terhadap "Semua": di "Semua"
     * favorit onboarding menaikkan cerita bergenre favorit ke depan (§1.7), dan
     * itu tetap berlaku. Yang tidak boleh berubah adalah isinya karena tab.
     */
    const empatSampul = () =>
      screen
        .getAllByRole('button', { name: /^Perbesar sampul / })
        .slice(0, 4)
        .map((el) => el.getAttribute('aria-label'))

    await userEvent.click(screen.getByRole('button', { name: 'Fantasy' }))
    await screen.findByRole('heading', { name: 'Dunia Lain' })
    const diFantasy = empatSampul()

    await userEvent.click(screen.getByRole('button', { name: 'Mystery' }))
    await screen.findByRole('heading', { name: 'Kasus Tertutup' })

    // Ekornya berganti…
    expect(screen.queryByRole('heading', { name: 'Dunia Lain' })).not.toBeInTheDocument()
    // …dan empat sampul pertama Populer tidak berubah sama sekali.
    expect(empatSampul()).toEqual(diFantasy)
  })

  it('genre tanpa isi menyisakan tiga section teratas, dan pesannya di bawah tab', async () => {
    // Semua genre punya isi setelah §1.22, jadi keadaan kosongnya dipancing dari
    // seam — bukan dari data. Ini satu-satunya cara layarnya bisa diuji, dan
    // alasannya dicatat di architecture.md §1.22.
    const asli = await api.getHomeFeed()
    const spy = vi.spyOn(api, 'getHomeFeed').mockImplementation(async (tab?: string) => {
      if (!tab) return asli
      return {
        genre: tab,
        sections: asli.sections.filter((s) =>
          ['populer', 'terbaru', 'terbuka', 'banner', 'lanjut-baca'].includes(s.id),
        ),
      }
    })

    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })
    await userEvent.click(screen.getByRole('button', { name: 'Fantasy' }))

    expect(await screen.findByText('Belum ada cerita di genre ini')).toBeInTheDocument()
    // Yang tidak bergantung genre tetap berdiri — halamannya tidak dikosongkan.
    expect(screen.getByRole('heading', { name: 'Populer' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paling Banyak Dibuka' })).toBeInTheDocument()

    spy.mockRestore()
  })
})

describe('bentuk section · §1.22', () => {
  it('section genre jadi rel mendatar; Lanjut Membaca tetap daftar tegak', async () => {
    const { container } = renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const bagian = (judul: string) =>
      [...container.querySelectorAll('section')].find(
        (el) => el.querySelector('h2')?.textContent === judul,
      )

    // Rel: wadah yang menggulir mendatar, dan tiap sampulnya tombol zoom.
    const populer = bagian('Populer')
    expect(populer?.querySelector('.overflow-x-auto')).not.toBeNull()
    expect(populer?.querySelector('ul')).toBeNull()

    // Lanjut Membaca: daftar tegak, dengan batang progres yang butuh lebar penuh.
    const lanjut = bagian('Lanjut Membaca')
    expect(lanjut?.querySelector('ul')).not.toBeNull()
    expect(lanjut?.querySelector('.overflow-x-auto')).toBeNull()
    expect(lanjut?.querySelector('button[aria-label^="Perbesar sampul"]')).toBeNull()
  })
})

describe('perbaikan bugs_home_content_01', () => {
  it('kartu rel hanya membawa sampul dan judul — tanpa penulis, rating, atau jumlah baca', async () => {
    const { container } = renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const populer = [...container.querySelectorAll('section')].find(
      (el) => el.querySelector('h2')?.textContent === 'Populer',
    )
    const kartu = populer?.querySelector('button[aria-label^="Perbesar sampul"]')?.parentElement
    expect(kartu).toBeDefined()

    // Satu baris teks di bawah sampul, dan isinya judulnya.
    const baris = kartu?.querySelectorAll('a > span')
    expect(baris).toHaveLength(1)

    // Tidak ada angka rating maupun "baca" yang tersisa di kartunya.
    expect(kartu?.textContent).not.toMatch(/baca/i)
    expect(kartu?.textContent).not.toMatch(/\d,\d/)
  })

  it('judul dibatasi dua baris — line-clamp tidak boleh ditimpa `block` lagi', async () => {
    const { container } = renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const judul = container.querySelector(
      'button[aria-label^="Perbesar sampul"] + a > span',
    ) as HTMLElement | null
    expect(judul).not.toBeNull()

    /*
     * `line-clamp-2` **dan** tidak ada `block` di elemen yang sama. Keduanya
     * menyetel `display`, `block` menang, dan akibatnya judul tiga baris lolos
     * tanpa elipsis — jsdom tidak menghitung tata letak, jadi yang bisa dijaga
     * di sini adalah kelasnya. Tingginya diukur sungguhan di e2e.
     */
    expect(judul?.className).toContain('line-clamp-2')
    expect(judul?.className.split(/\s+/)).not.toContain('block')
  })

  it('tiga section teratas tidak punya slot iklan — keduanya di bawah tab genre', async () => {
    const { container } = renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const posisi = (el: Element | null | undefined) =>
      el ? [...container.querySelectorAll('*')].indexOf(el) : -1

    const tab = screen.getByRole('button', { name: 'Fantasy' })
    const iklan = [...container.querySelectorAll('*')].filter(
      (el) => el.children.length === 0 && /bersponsor/i.test(el.textContent ?? ''),
    )

    expect(iklan.length).toBeGreaterThan(0)
    for (const slot of iklan) {
      expect(posisi(slot), 'slot iklan mendahului tab genre').toBeGreaterThan(posisi(tab))
    }
  })

  it('rel memakai scroll-px-4 — tanpa itu snap menggulir padding kirinya habis', async () => {
    const { container } = renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const rel = container.querySelector('.overflow-x-auto')
    expect(rel?.className).toContain('snap-x')
    // Pasangan wajibnya. Terukur saat hilang: `scrollLeft: 16`, `kartu.left: 0`.
    expect(rel?.className).toContain('scroll-px-4')
  })
})

describe('ketuk sampul → sampul membesar · §1.22', () => {
  it('menekan sampul membuka lapisan dan tidak bernavigasi; judulnya tetap tautan', async () => {
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const sampul = screen.getAllByRole('button', { name: /^Perbesar sampul / })[0]
    expect(sampul).toBeDefined()
    // Nama tombolnya kini memuat lencana peringkat juga (`… #1`), supaya teks
    // yang terlihat di dalamnya ikut ke nama aksesibelnya — axe
    // `label-content-name-mismatch`. Yang dicari di sini judulnya saja.
    const judul = (sampul?.getAttribute('aria-label') ?? '')
      .replace('Perbesar sampul ', '')
      .replace(/\s+#\d+$/, '')

    /*
     * Judulnya tautan tersendiri — jalan ke ceritanya tidak hilang. Dicari lewat
     * isi teksnya, bukan lewat nama aksesibelnya: tautan itu membungkus judul,
     * nama pena, **dan** metriknya, jadi namanya bukan judulnya saja.
     */
    const tautanJudul = screen.getAllByRole('link').filter((el) => el.textContent?.includes(judul))
    expect(tautanJudul.length).toBeGreaterThan(0)
    expect(tautanJudul[0]).toHaveAttribute('href')

    await userEvent.click(sampul as HTMLElement)

    const lapisan = await screen.findByRole('dialog', { name: judul })
    expect(lapisan).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Buka cerita' }).getAttribute('href')).toMatch(
      /^\/cerita\//,
    )
  })

  it('prefers-reduced-motion: lapisannya tetap terbuka, hanya gerakannya yang mati', async () => {
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    await userEvent.click(
      screen.getAllByRole('button', { name: /^Perbesar sampul / })[0] as HTMLElement,
    )
    const lapisan = await screen.findByRole('dialog')

    /*
     * Yang diperiksa **kelasnya**, bukan gerakannya: jsdom tidak menjalankan
     * media query, jadi satu-satunya hal yang bisa dibuktikan di sini adalah
     * bahwa penonaktifannya benar-benar dipasang. Bahwa lapisannya tetap muncul
     * saat gerak dimatikan — itu yang diuji, dan itu bagian yang paling mudah
     * hilang saat seseorang "menyederhanakan" animasinya nanti.
     */
    expect(lapisan.className).toContain('motion-reduce:transition-none')
    const panel = lapisan.firstElementChild
    expect(panel?.className).toContain('motion-reduce:transition-none')
  })

  it('lapisan membawa rating dan jumlah baca — kartunya tetap bersih', async () => {
    const { container } = renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const sampul = screen.getAllByRole('button', { name: /^Perbesar sampul / })[0] as HTMLElement
    await userEvent.click(sampul)

    const lapisan = await screen.findByRole('dialog')
    // Rating berkoma dan jumlah baca, keduanya dari `story.stats` yang sama
    // dengan kartu bentuk daftar.
    expect(lapisan.textContent).toMatch(/\d,\d/)
    expect(lapisan.textContent).toMatch(/baca/)

    // Dan statistiknya **tidak** kembali ke kartunya.
    const kartu = container
      .querySelector('button[aria-label^="Perbesar sampul"]')
      ?.parentElement?.querySelector('a')
    expect(kartu?.textContent).not.toMatch(/baca/)
  })

  it('ketuk di mana saja menutup — kecuali `Buka cerita`', async () => {
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const sampul = screen.getAllByRole('button', { name: /^Perbesar sampul / })[0] as HTMLElement
    await userEvent.click(sampul)
    const lapisan = await screen.findByRole('dialog')

    /*
     * Sebelumnya hanya latarnya yang menutup, dan itu benar sampai lapisannya
     * diperbesar: setelah sampulnya memenuhi lebar layar, sisa latar di
     * kiri-kanan tinggal ~16px dan praktis tidak bisa dikenai jari.
     */
    const judul = lapisan.querySelector('p') as HTMLElement
    await userEvent.click(judul)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    /*
     * `Buka cerita` **dikecualikan**: ketukan padanya tidak boleh ikut menutup.
     * Harness ini tidak punya `<Routes>`, jadi yang dibuktikan bukan tujuannya
     * melainkan bahwa `onClose` tidak ikut terpanggil — dan itu memang bagian
     * yang bisa rusak. Tujuannya sendiri dijaga test tetangga lewat `href`, dan
     * ditekan sungguhan di e2e.
     */
    await userEvent.click(sampul)
    const lagi = await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('link', { name: 'Buka cerita' }))
    expect(lagi).toBeInTheDocument()
  })

  it('Escape menutup lapisan dan fokus kembali ke sampul yang ditekan', async () => {
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const sampul = screen.getAllByRole('button', { name: /^Perbesar sampul / })[0] as HTMLElement
    await userEvent.click(sampul)
    await screen.findByRole('dialog')

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(sampul).toHaveFocus()
  })
})
