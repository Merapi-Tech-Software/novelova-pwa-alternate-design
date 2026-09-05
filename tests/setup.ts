import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'
import { initApi } from '@/api/client'

/*
 * Seam API diisi sekali sebelum test mana pun berjalan.
 *
 * Dulu `api/client.ts` memuat implementasinya lewat top-level `await`, jadi
 * mengimpornya saja sudah cukup. Itu dibuang karena **mematikan build
 * produksi** (lingkar chunk + `await` = grafik modul yang tidak pernah selesai);
 * gantinya `initApi()`, dan di sinilah ia dipanggil untuk test.
 */
beforeAll(() => initApi())

afterEach(cleanup)
