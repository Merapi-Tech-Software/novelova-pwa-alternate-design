import { expect, type Page, test } from '@playwright/test'

/**
 * Layar pembuka & indikator muat rute · todo.md Fase 14b-b, 14b-c, 14b-e.
 *
 * Tiga hal yang masing-masing bisa gagal diam-diam:
 *
 * 1. Layar pembuka **pergi**. Menguji kemunculannya saja lulus walau ia
 *    menutupi aplikasi selamanya — dan ia `position:fixed` di atas segalanya.
 * 2. `MuatRute` tampil saat modul halaman lambat, **di dalam** area konten,
 *    tanpa meluber di lebar mana pun.
 * 3. Perpindahan cepat **tidak** memunculkannya: modul yang sudah termuat tidak
 *    boleh berkedip.
 */

/** Lima lebar telepon wajib + desktop (CLAUDE.md §2). */
const LEBAR = [320, 360, 390, 412, 430, 1280] as const

async function tundaModulBeranda(page: Page, ms: number) {
  // Server dev menyajikan tiap halaman sebagai modul tersendiri; menunda satu
  // permintaan ini = "respons yang agak lama" persis seperti di permintaan.
  await page.route('**/HomePage.tsx*', async (route) => {
    await new Promise((r) => setTimeout(r, ms))
    await route.continue()
  })
}

test('layar pembuka tampil di frame pertama, lalu pergi setelah aplikasi tergambar', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'commit' })
  // Ada **sebelum** JS apa pun: `commit` = HTML diterima, modul belum jalan.
  await expect(page.locator('#pembuka')).toBeVisible()
  await expect(page.locator('#pembuka')).toHaveAttribute('aria-label', 'Memuat Novelova')

  // Lalu benar-benar dilepas dari DOM, bukan sekadar transparan — lapisan
  // transparan yang tertinggal tetap menelan setiap ketukan.
  await expect(page.locator('#pembuka')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.getByRole('main')).toBeVisible()
})

for (const lebar of LEBAR) {
  test(`modul lambat → MuatRute di area konten, tanpa luberan, lebar ${lebar}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: lebar, height: 800 })
    await tundaModulBeranda(page, 2_500)
    await page.goto('/')

    // Peran `status` tidak mengambil nama dari isinya (accname: "name from
    // author"), jadi `{ name: 'Memuat…' }` tidak pernah cocok. Saring lewat
    // teksnya, yang memang diumumkan pembaca layar sebagai isi region live.
    const muat = page.locator('#root').getByRole('status').filter({ hasText: 'Memuat…' })
    await expect(muat).toBeVisible({ timeout: 5_000 })
    await expect(muat.locator('path')).toHaveCount(8)

    const luber = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(luber, 'indikator meluber ke samping').toBe(0)

    // Bukan lapisan penuh: ia anak `#root`, dan lebarnya lebar konten.
    const kotak = await muat.boundingBox()
    expect(kotak?.width).toBeLessThanOrEqual(lebar)
    await expect(page.locator('#root').getByRole('status')).toHaveCount(1)

    // Dan hilang begitu modulnya tiba.
    await expect(muat).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByRole('main')).toBeVisible()
  })
}

test('perpindahan cepat tidak memunculkan indikator sama sekali', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()

  // Pantau dari dalam halaman: `status` "Memuat…" yang sempat muncul sekejap
  // pun tercatat, walau sudah hilang saat Playwright memeriksa.
  await page.evaluate(() => {
    const w = window as Window & { __muatTerlihat?: number }
    w.__muatTerlihat = 0
    new MutationObserver(() => {
      if (document.querySelector('#root [role="status"] svg path'))
        w.__muatTerlihat = (w.__muatTerlihat ?? 0) + 1
    }).observe(document.body, { childList: true, subtree: true })
  })

  // Dua perpindahan lewat navigasi bawah, bukan `goto`: yang diuji transisi
  // di dalam aplikasi — halaman lama bertahan sampai modul baru siap.
  await page
    .getByRole('link', { name: /Pustaka/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/pustaka$/)
  await page
    .getByRole('link', { name: /Beranda/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/$/)

  const terlihat = await page.evaluate(
    () => (window as Window & { __muatTerlihat?: number }).__muatTerlihat ?? -1,
  )
  expect(terlihat, 'MuatRute sempat muncul pada perpindahan cepat').toBe(0)
})
