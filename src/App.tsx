import { Suspense } from 'react'
import { RouterProvider } from 'react-router'
import { ErrorBoundary } from './app/ErrorBoundary'
import { QueryProvider } from './app/providers/QueryProvider'
import { SessionProvider } from './app/providers/SessionProvider'
import { MuatRute } from './components/patterns/MuatRute'
import { ToastProvider } from './components/ui/Toast'
import { router } from './routes'

/**
 * Pohon provider. Urutannya penting: `ErrorBoundary` di luar supaya kegagalan
 * provider mana pun tetap tertangkap, dan `ToastProvider` di dalam `QueryProvider`
 * karena `useOptimistic` memakai keduanya sekaligus. `SessionProvider` ada di dalam
 * `QueryProvider` karena guard penulis membaca tingkatnya lewat query.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <SessionProvider>
            {/*
              Fallback ini hanya untuk modul halaman yang belum ada — muat
              pertama, muat ulang, tautan langsung. Perpindahan di dalam
              aplikasi tidak sampai ke sini: React Router 7 menahan halaman
              lama selama transisi (Fase 14b-c).
            */}
            <Suspense fallback={<MuatRute />}>
              <RouterProvider router={router} />
            </Suspense>
          </SessionProvider>
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
