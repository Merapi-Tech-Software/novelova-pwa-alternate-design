import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import StoryFormPage from '@/features/studio/pages/StoryFormPage'

function renderForm(mode: 'baru' | 'sunting', storyId = 'ms2') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const path = mode === 'baru' ? '/karya/baru' : `/karya/${storyId}/ubah`
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/karya/baru" element={<StoryFormPage mode="baru" />} />
            <Route path="/karya/:storyId/ubah" element={<StoryFormPage mode="sunting" />} />
            <Route path="/karya" element={<p>studio</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

/**
 * Diisi lewat `fireEvent.change`, bukan `userEvent.type`.
 *
 * Yang diuji di sini aturan validasinya, bukan pengetikannya — dan mengetik 74
 * karakter satu per satu menghabiskan tiga detik lebih per test, cukup untuk
 * menyentuh ambang lima detik saat mesinnya sedang sibuk.
 */
function fillSynopsis(value = VALID_SYNOPSIS) {
  fireEvent.change(screen.getByLabelText('Sinopsis'), { target: { value } })
}

const VALID_SYNOPSIS = 'Kalimat pembuka yang cukup panjang untuk lolos ambang lima puluh karakter.'

beforeEach(async () => {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })
  await db.stories.where('id').startsWith('ms-').delete()
  localStorage.removeItem('novelova:create-story-draft')
  localStorage.removeItem('novelova:edit-story-draft')
})

afterEach(() => {
  localStorage.removeItem('novelova:create-story-draft')
  localStorage.removeItem('novelova:edit-story-draft')
})

describe('penanda perubahan & penghitung · FR-STUDIO-12', () => {
  it('kedua tombol simpan nonaktif sampai ada perubahan nyata', async () => {
    renderForm('baru')

    const saves = await screen.findAllByRole('button', { name: 'Simpan' })
    expect(saves).toHaveLength(2)
    for (const button of saves) expect(button).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Judul story'), 'A')

    for (const button of screen.getAllByRole('button', { name: 'Simpan' })) {
      expect(button).toBeEnabled()
    }
  })

  it('penghitung judul dan sinopsis berubah saat mengetik', async () => {
    renderForm('baru')
    await userEvent.type(await screen.findByLabelText('Judul story'), 'Dua Puluh Lima Karakter!')

    expect(screen.getByText('24/100')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Sinopsis'), 'Baru sedikit')
    // Kekurangannya terlihat tanpa menekan Simpan lebih dulu.
    expect(screen.getByText(/kurang 38/)).toBeInTheDocument()
  })

  it('pratinjau sinopsis menyebut kosong, bukan menampilkan ruang hampa', async () => {
    renderForm('baru')
    expect(await screen.findByText('Sinopsis belum diisi.')).toBeInTheDocument()
  })
})

describe('validasi berurutan & inline · FR-STUDIO-16', () => {
  it('berhenti di kesalahan pertama, dan pesannya menempel di kolomnya', async () => {
    renderForm('baru')
    await userEvent.type(await screen.findByLabelText('Judul story'), 'x')
    await userEvent.clear(screen.getByLabelText('Judul story'))
    await userEvent.type(screen.getByLabelText('Sinopsis'), 'pendek')
    await userEvent.click(screen.getAllByRole('button', { name: 'Simpan' })[0] as HTMLElement)

    // Hanya satu pesan, dan hanya kolom judul yang ditandai salah.
    expect(screen.getByText('Judul story tidak boleh kosong')).toBeInTheDocument()
    expect(screen.queryByText(/Sinopsis minimal/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Judul story')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Sinopsis')).not.toHaveAttribute('aria-invalid')
  })

  it('lolos judul, lalu menuntut sinopsis 50 karakter, lalu nama pena', async () => {
    renderForm('baru')
    await userEvent.type(await screen.findByLabelText('Judul story'), 'Judul Sah')
    await userEvent.click(screen.getAllByRole('button', { name: 'Simpan' })[0] as HTMLElement)
    expect(screen.getByText('Sinopsis minimal 50 karakter')).toBeInTheDocument()

    fillSynopsis()
    await userEvent.click(screen.getAllByRole('button', { name: 'Simpan' })[0] as HTMLElement)
    expect(screen.getByText('Nama pena tidak boleh kosong')).toBeInTheDocument()
  })
})

describe('kategorisasi · FR-STUDIO-14', () => {
  it('genre tambahan berhenti di dua, dan mematikan satu membuka slotnya lagi', async () => {
    renderForm('baru')
    await screen.findByLabelText('Judul story')

    await userEvent.click(screen.getByRole('button', { name: 'Mystery' }))
    await userEvent.click(screen.getByRole('button', { name: 'Fantasy' }))
    await userEvent.click(screen.getByRole('button', { name: 'Drama' }))

    // Yang ketiga diabaikan — bukan menggantikan salah satu diam-diam.
    expect(screen.getByRole('button', { name: 'Drama' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'Mystery' }))
    await userEvent.click(screen.getByRole('button', { name: 'Drama' }))
    expect(screen.getByRole('button', { name: 'Drama' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('tag membuang tanda pagar, dan penolakan menyebut tag mana yang bentrok', async () => {
    renderForm('baru')
    const field = await screen.findByLabelText(/^Tag/)

    await userEvent.type(field, '#slowburn{Enter}')
    expect(screen.getByText('slowburn')).toBeInTheDocument()

    await userEvent.type(field, 'slowburn{Enter}')
    expect(screen.getByText('Tag "slowburn" sudah ada di daftar.')).toBeInTheDocument()
  })

  it('tag kesebelas ditolak dengan alasannya, bukan diabaikan diam-diam', async () => {
    renderForm('baru')
    const field = await screen.findByLabelText(/^Tag/)

    for (let i = 1; i <= 10; i += 1) await userEvent.type(field, `tag${i}{Enter}`)
    await userEvent.type(field, 'sebelas{Enter}')

    expect(screen.getByText(/Sudah 10 tag/)).toBeInTheDocument()
    expect(screen.queryByText('sebelas')).not.toBeInTheDocument()
  })
})

describe('monetisasi terbalik antara dua mode · FR-STUDIO-15 · arch §1.5', () => {
  it('mode baru memperingatkan saat tipenya bukan gratis', async () => {
    renderForm('baru')
    await userEvent.selectOptions(await screen.findByLabelText('Tipe story'), 'partial')

    expect(screen.getByText(/akan terkunci bagi pembaca/)).toBeInTheDocument()
  })

  it('mode sunting memperingatkan justru saat memilih gratis, dengan angka nyata', async () => {
    renderForm('sunting', 'ms1')
    await userEvent.selectOptions(await screen.findByLabelText('Tipe story'), 'free')

    // Kalimatnya menghitung akibatnya dari data cerita ini.
    expect(screen.getByText(/tidak mendapat refund/)).toBeInTheDocument()
    expect(screen.queryByText(/akan terkunci bagi pembaca/)).not.toBeInTheDocument()
  })

  it('harga akses penuh hanya muncul pada Premium', async () => {
    renderForm('baru')
    expect(screen.queryByLabelText(/Harga akses penuh/)).not.toBeInTheDocument()

    await userEvent.selectOptions(await screen.findByLabelText('Tipe story'), 'premium')
    expect(screen.getByLabelText(/Harga akses penuh/)).toBeInTheDocument()
  })
})

describe('zona bahaya hanya di mode sunting · FR-STUDIO-18 · arch §1.5', () => {
  it('tidak dirender saat membuat cerita baru', async () => {
    renderForm('baru')
    await screen.findByLabelText('Judul story')
    expect(screen.queryByText('Zona bahaya')).not.toBeInTheDocument()
  })

  it('tiga aksi, semuanya menyatakan akibatnya dengan angka', async () => {
    renderForm('sunting', 'ms1')
    expect(await screen.findByText('Zona bahaya')).toBeInTheDocument()

    for (const label of ['Arsipkan cerita', 'Tandai tamat', 'Hapus permanen']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    // Ketiganya lewat satu pola: tombol "Lanjutkan" lalu ketik ulang judulnya.
    expect(screen.getAllByRole('button', { name: 'Lanjutkan' })).toHaveLength(3)
    expect(screen.getByText(/dihapus permanen/)).toBeInTheDocument()
  })
})

describe('pemulihan draf · FR-STUDIO-17 · FR-STUDIO-34', () => {
  it('menyimpan isi formulir sejak ketikan pertama, bukan penanda kosong', async () => {
    renderForm('baru')
    await userEvent.type(await screen.findByLabelText('Judul story'), 'Naskah Setengah Jalan')

    const raw = localStorage.getItem('novelova:create-story-draft')
    expect(raw).not.toBeNull()
    const draft = JSON.parse(raw as string)
    // Prototipe menulis '1' di sini — cukup untuk memunculkan kotak, tidak
    // cukup untuk mengembalikan satu huruf pun.
    expect(draft.form.title).toBe('Naskah Setengah Jalan')
    expect(typeof draft.savedAt).toBe('string')
  })

  it('kotak pemulihan menyebut kapan drafnya dibuat, dan benar-benar memulihkan isinya', async () => {
    localStorage.setItem(
      'novelova:create-story-draft',
      JSON.stringify({
        form: { title: 'Judul Dari Draf', synopsis: VALID_SYNOPSIS, penName: 'Amelia' },
        savedAt: '2026-08-26T13:14:00.000Z',
        storyId: null,
      }),
    )
    renderForm('baru')

    expect(await screen.findByText(/Ada draf yang belum selesai dari/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Pulihkan' }))

    expect(screen.getByLabelText('Judul story')).toHaveValue('Judul Dari Draf')
  })

  it('draf mode sunting milik cerita lain diabaikan', async () => {
    localStorage.setItem(
      'novelova:edit-story-draft',
      JSON.stringify({
        form: { title: 'Punya Cerita Lain' },
        savedAt: new Date().toISOString(),
        storyId: 'ms9',
      }),
    )
    renderForm('sunting', 'ms2')
    await screen.findByLabelText('Judul story')

    expect(screen.queryByText(/Ada draf yang belum selesai/)).not.toBeInTheDocument()
  })
})

describe('simpan gagal & kotak sukses · arch §1.5 · FR-STUDIO-35', () => {
  it('gagal di server tidak mengosongkan formulir, dan menyimpan ulang tidak menggandakan cerita', async () => {
    // Tanpa profil penulis, server menolak membuat cerita (FORBIDDEN).
    await db.authorProfiles.delete(CURRENT_USER_ID)
    renderForm('baru')

    await userEvent.type(await screen.findByLabelText('Judul story'), 'Naskah Yang Gagal Simpan')
    fillSynopsis()
    await userEvent.type(screen.getByLabelText('Nama pena'), 'Amelia Putri')
    await userEvent.click(screen.getAllByRole('button', { name: 'Simpan' })[0] as HTMLElement)

    // Isinya utuh, dan tombolnya menawarkan mencoba lagi.
    expect(await screen.findAllByRole('button', { name: 'Coba simpan lagi' })).toHaveLength(2)
    expect(screen.getByLabelText('Judul story')).toHaveValue('Naskah Yang Gagal Simpan')
    expect(screen.getByLabelText('Sinopsis')).toHaveValue(VALID_SYNOPSIS)
    expect(await db.stories.where('id').startsWith('ms-').count()).toBe(0)

    // Setelah penyebabnya hilang, menyimpan ulang menghasilkan **satu** cerita.
    await db.authorProfiles.put({
      userId: CURRENT_USER_ID,
      tier: 'verified',
      payoutVerified: true,
      twoFactor: true,
      termsAcceptedAt: new Date().toISOString(),
    })
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Coba simpan lagi' }))[0] as HTMLElement,
    )

    await vi.waitFor(async () =>
      expect(await db.stories.where('id').startsWith('ms-').count()).toBe(1),
    )
  })

  it('kotak sukses menawarkan tiga langkah lanjutan, dengan menulis bab sebagai yang utama', async () => {
    renderForm('baru')
    await userEvent.type(await screen.findByLabelText('Judul story'), 'Cerita Baru Sekali')
    fillSynopsis()
    await userEvent.type(screen.getByLabelText('Nama pena'), 'Amelia Putri')
    await userEvent.click(screen.getAllByRole('button', { name: 'Simpan' })[0] as HTMLElement)

    expect(await screen.findByText('Cerita dibuat')).toBeInTheDocument()
    const first = screen.getByRole('link', { name: 'Tulis bab pertama' })
    expect(first).toHaveAttribute('href', expect.stringMatching(/^\/karya\/ms-.+\/bab\/baru$/))
    // Pilihan kedua menuju jadwal terpadu, bukan kelola bab (arch §1.5).
    expect(screen.getByRole('link', { name: 'Atur jadwal terbit' })).toHaveAttribute(
      'href',
      '/karya/jadwal',
    )
    expect(screen.getByRole('link', { name: 'Kembali ke Karya Saya' })).toHaveAttribute(
      'href',
      '/karya',
    )

    // Draf dibuang setelah simpan berhasil.
    expect(localStorage.getItem('novelova:create-story-draft')).toBeNull()
  })
})

describe('penanda kolom berubah · FR-STUDIO-12 efek ketiga', () => {
  it('hanya kolom yang benar-benar berubah yang ditandai, dan penandanya hilang saat dikembalikan', async () => {
    renderForm('baru')
    const title = await screen.findByLabelText('Judul story')
    const penName = screen.getByLabelText('Nama pena')

    await userEvent.type(title, 'Berubah')
    expect(title).toHaveClass('border-nv-accent')
    expect(penName).not.toHaveClass('border-nv-accent')

    // Mengetik lalu menghapusnya lagi berarti tidak ada yang berubah.
    await userEvent.clear(title)
    expect(title).not.toHaveClass('border-nv-accent')
  })
})
