import { Suspense } from 'react'
import { RouterProvider } from 'react-router'
import { ErrorBoundary } from './app/ErrorBoundary'
import { QueryProvider } from './app/providers/QueryProvider'
import { SessionProvider } from './app/providers/SessionProvider'
import { Skeleton } from './components/ui/Card'
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
            <Suspense fallback={<Skeleton lines={6} className="m-6" />}>
              <RouterProvider router={router} />
            </Suspense>
          </SessionProvider>
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
