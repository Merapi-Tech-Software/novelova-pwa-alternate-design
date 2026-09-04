import type { ReactNode } from 'react'
import { isApiError } from '@/api/errors'
import { type FailureLevel, FailureNotice } from '../patterns/FailureNotice'
import { Skeleton } from './Card'
import { EmptyState, type EmptyStateProps } from './EmptyState'

/**
 * Empat keadaan render sebagai kontrak, bukan kebiasaan (FR-CORE-02, FR-CORE-03):
 * **memuat · berhasil · kosong · gagal.**
 *
 * `kosong` dan `gagal` wajib berbeda tampilan. Menampilkan "tidak ada hasil"
 * saat sebenarnya jaringan putus membuat pengguna berhenti mencoba — itulah
 * sebabnya komponen ini memaksa memilih antara `EmptyState` dan `FailureNotice`,
 * bukan menyediakan satu tampilan untuk keduanya.
 */

export interface AsyncStateProps<T> {
  loading: boolean
  error: unknown
  data: T | undefined
  /** Benar bila `data` ada tetapi tidak berisi apa pun. */
  isEmpty?: (data: T) => boolean
  onRetry?: () => void
  /**
   * Tingkat kegagalan. Bawaannya `inset` — satu bagian gagal tidak boleh
   * menjatuhkan seluruh layar.
   */
  failureLevel?: FailureLevel
  skeleton?: ReactNode
  empty: EmptyStateProps
  children: (data: T) => ReactNode
}

export function AsyncState<T>({
  loading,
  error,
  data,
  isEmpty,
  onRetry,
  failureLevel = 'inset',
  skeleton,
  empty,
  children,
}: AsyncStateProps<T>) {
  if (loading) {
    return <>{skeleton ?? <Skeleton lines={4} />}</>
  }

  if (error !== undefined && error !== null) {
    const api = isApiError(error) ? error : null
    return (
      <FailureNotice
        level={failureLevel}
        title={api?.message ?? 'Bagian ini tidak bisa dimuat'}
        body="Permintaannya tidak sampai ke server."
        safety="Tidak ada data yang berubah."
        {...(api?.retryable !== false && onRetry ? { onRetry } : {})}
        {...(api?.isVisibleCode ? { code: api.detail ?? api.code } : {})}
      />
    )
  }

  if (data === undefined) return null
  if (isEmpty?.(data)) return <EmptyState {...empty} />

  return <>{children(data)}</>
}
