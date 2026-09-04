import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { MOCK_PASSWORD } from '@/api/mock/handlers/session'
import SignInPage from '@/features/auth/pages/SignInPage'
import { LOGIN_ATTEMPTS_MAX } from '@/lib/limits'

const IDENTITY = 'annamaharani@example.com'

/**
 * Percobaan gagal dicatat di sisi server tiruan dan bertahan antar test, jadi
 * tabelnya dibersihkan lebih dulu — kalau tidak, urutan test yang menentukan
 * hasilnya, bukan kodenya.
 */
beforeEach(async () => {
  await db.loginAttempts.clear()
  localStorage.clear()
  sessionStorage.clear()
})

function renderSignIn(path = '/masuk?next=/karya/jadwal') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/masuk" element={<SignInPage />} />
          <Route path="/karya/jadwal" element={<p>halaman jadwal</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('formulir masuk · FR-AUTH-09', () => {
  it('kesalahan pertama menang — dua isian salah, satu pesan', async () => {
    renderSignIn()
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Masukkan email atau nomor HP.')
    expect(screen.queryByText(/Kata sandi minimal/)).not.toBeInTheDocument()
  })

  it('kata sandi pendek ditolak dengan kebijakan 8 karakter', async () => {
    renderSignIn()
    await userEvent.type(screen.getByLabelText('Email atau nomor HP'), IDENTITY)
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Kata sandi minimal 8 karakter.')
  })

  it('area pesan dikosongkan sebelum berpindah, dan tujuan asal yang dituju', async () => {
    renderSignIn()

    // Gagal dulu, supaya ada pesan yang benar-benar harus dibersihkan.
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Masukkan email atau nomor HP.')

    await userEvent.type(screen.getByLabelText('Email atau nomor HP'), IDENTITY)
    await userEvent.type(screen.getByLabelText('Kata sandi'), MOCK_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByText('halaman jadwal')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('penahanan percobaan masuk · AUTH-429', () => {
  it('percobaan ke-6 ditolak sebelum kredensial disentuh', async () => {
    for (let i = 0; i < LOGIN_ATTEMPTS_MAX; i++) {
      await expect(
        api.login({ identity: IDENTITY, password: 'salah-sekali', remember: false }),
      ).rejects.toMatchObject({ code: 'VALIDATION' })
    }

    // Kata sandi yang **benar** pun ditolak: penahanan berlaku pada perangkat,
    // bukan pada tebakan. Itu yang membedakannya dari sekadar pesan kesalahan.
    await expect(
      api.login({ identity: IDENTITY, password: MOCK_PASSWORD, remember: false }),
    ).rejects.toMatchObject({ code: 'AUTH-429' })
  })

  it('kegagalan yang ditahan menyebutkan jam buka kembali', async () => {
    for (let i = 0; i < LOGIN_ATTEMPTS_MAX; i++) {
      await api.login({ identity: IDENTITY, password: 'salah', remember: false }).catch(() => {})
    }

    const failure = await api
      .login({ identity: IDENTITY, password: 'salah', remember: false })
      .catch((e: unknown) => e)

    expect(failure).toMatchObject({ code: 'AUTH-429' })
    const retryAt = (failure as { retryAt?: string }).retryAt
    expect(retryAt).toBeDefined()
    expect(Date.parse(retryAt ?? '')).toBeGreaterThan(Date.now())
  })

  it('masuk yang berhasil menghapus riwayat percobaan gagal', async () => {
    await api.login({ identity: IDENTITY, password: 'salah', remember: false }).catch(() => {})
    await api.login({ identity: IDENTITY, password: MOCK_PASSWORD, remember: true })

    expect(await db.loginAttempts.count()).toBe(0)
  })
})
