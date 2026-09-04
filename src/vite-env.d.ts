/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** `mock` = Dexie di perangkat ini · `http` = backend nyata. architecture.md §5. */
  readonly VITE_API_MODE: 'mock' | 'http'
  readonly VITE_API_BASE_URL: string
  /** Jeda buatan balasan mock, supaya keadaan "memuat" terlihat saat membangun UI. */
  readonly VITE_MOCK_LATENCY_MS: string
  readonly VITE_PAYMENT_PROVIDER: 'mock' | 'midtrans'
  readonly VITE_AD_PROVIDER: 'mock' | 'admob'
  readonly VITE_MIDTRANS_CLIENT_KEY: string
  readonly VITE_VAPID_PUBLIC_KEY: string
  readonly VITE_APP_VERSION: string
  readonly VITE_MIN_SUPPORTED_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
