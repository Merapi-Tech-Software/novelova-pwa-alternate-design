import { Component, type ErrorInfo, type ReactNode } from 'react'
import { FailureNotice } from '@/components/patterns/FailureNotice'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Jaring terakhir. Kalau render melempar, pengguna melihat layar kegagalan
 * dengan jalan keluar — bukan halaman putih.
 *
 * Tingkatnya `fullscreen` karena pada titik ini memang tidak ada yang bisa
 * dikerjakan: pohon komponennya sudah tidak bisa dirender (arch §1.4).
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[render]', error, info.componentStack)
  }

  override render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <FailureNotice
        level="fullscreen"
        title="Halaman ini berhenti bekerja"
        body="Ada bagian aplikasi yang gagal dirender."
        safety="Tidak ada data yang hilang. Koin, progres baca, dan draf tetap tersimpan di akunmu."
        onRetry={() => window.location.reload()}
        retryLabel="Muat ulang halaman"
        code={`RENDER-500 · ${error.name}`}
      />
    )
  }
}
