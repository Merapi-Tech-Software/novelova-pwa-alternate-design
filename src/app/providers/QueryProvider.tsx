import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { isApiError, VISIBLE_CODES } from '@/api/errors'
import { useApp } from '@/stores/app'
import { useSession } from '@/stores/session'

/**
 * Dua kegagalan tidak boleh ditangani per pemanggil, karena keduanya berlaku
 * untuk **seluruh aplikasi sekaligus**:
 *
 * - `AUTH-401` → lembar masuk ulang di atas halaman yang sedang dibuka. Bukan
 *   redirect: penulis yang sedang mengetik tidak boleh kehilangan naskahnya
 *   (FR-AUTH-12 × FR-STUDIO-34).
 * - `APP-426` → layar penuh "versi terlalu lama". Tidak ada gunanya menampilkan
 *   satu bagian yang gagal kalau seluruh klien memang ditolak server.
 *
 * Sisanya tetap urusan pemanggil — hanya ia yang tahu seberapa banyak halaman
 * yang ikut mati, dan itu yang menentukan tingkat `FailureNotice` (§1.4).
 */
function handleGlobalFailure(error: unknown): void {
  if (!isApiError(error)) return
  if (error.code === VISIBLE_CODES.AUTH_EXPIRED) useSession.getState().requireReauth()
  if (error.code === VISIBLE_CODES.APP_OUTDATED) useApp.getState().markOutdated()
}

/**
 * Satu `QueryClient` untuk seluruh aplikasi.
 *
 * Retry-nya **tidak** membabi buta: kegagalan yang jelas permanen (validasi,
 * tidak ditemukan, saldo kurang) tidak diulang. Mengulanginya hanya menunda
 * pesan yang sudah pasti sama, dan pada jalur uang bisa berbahaya.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleGlobalFailure }),
        mutationCache: new MutationCache({ onError: handleGlobalFailure }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (isApiError(error) && !error.retryable) return false
              return failureCount < 2
            },
          },
          mutations: {
            // Mutasi tidak pernah diulang otomatis — idempotency dijamin kunci,
            // bukan tebakan klien (architecture.md §5 aturan 3).
            retry: false,
          },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
