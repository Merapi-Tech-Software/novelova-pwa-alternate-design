import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { GENRE_TABS } from '@/i18n/content'

/**
 * Data contoh beranda · `architecture.md` §1.22.
 *
 * **Ini pemeriksaan data, bukan pemeriksaan kode** — dan ia ada karena bentuk
 * beranda berubah. Section berisi tiga cerita tidak kelihatan salah sebagai
 * daftar tegak bernomor; sebagai rel mendatar sampul 80px ia menyisakan ruang
 * kosong di kanannya, dan ruang kosong itu terbaca sebagai gagal memuat.
 *
 * Sebelum §1.22, **11 dari 26 section** di bawah tab berisi kurang dari empat
 * cerita — terburuk Fantasy "Dunia Lain" dengan satu. Ambangnya enam: cukup
 * untuk mengisi satu baris di 360px (3,9 sampul) **dan** menyisakan sesuatu
 * untuk digulir, karena rel yang tidak bisa digulir juga bohong.
 *
 * Diperiksa lewat `getHomeFeed` yang sungguhan, bukan dengan membaca
 * `catalog.ts` — kalau aturan penyusunan section berubah, pemeriksaan yang
 * mem-parse data mentah akan tetap hijau sambil salah.
 */

/** Section yang **tidak** ikut tersaring tab; isinya seluruh katalog. */
const GLOBAL = ['populer', 'terbaru', 'terbuka', 'banner', 'lanjut-baca']

const MIN_PER_SECTION = 6

describe('data contoh beranda · §1.22', () => {
  it('tiap section yang tersaring tab berisi minimal enam cerita', async () => {
    const tipis: string[] = []

    for (const tab of GENRE_TABS) {
      const feed = await api.getHomeFeed(tab)
      const tersaring = feed.sections.filter((s) => !GLOBAL.includes(s.id))

      // Tab yang tidak menyisakan satu pun section tersaring juga cacat data:
      // pembaca menekan tab lalu mendapat halaman yang isinya persis sama.
      expect(tersaring.length, `${tab} tidak punya section tersaring`).toBeGreaterThan(0)

      for (const section of tersaring) {
        if (section.stories.length < MIN_PER_SECTION) {
          tipis.push(`${tab} › ${section.title} = ${section.stories.length}`)
        }
      }
    }

    expect(tipis, `section di bawah ambang ${MIN_PER_SECTION}:\n${tipis.join('\n')}`).toEqual([])
  })

  it('tab "Semua" juga memenuhi ambang yang sama', async () => {
    const feed = await api.getHomeFeed()
    const tersaring = feed.sections.filter((s) => !GLOBAL.includes(s.id))

    expect(tersaring.length).toBeGreaterThan(0)
    for (const section of tersaring) {
      expect(section.stories.length, section.title).toBeGreaterThanOrEqual(MIN_PER_SECTION)
    }
  })

  it('tiga section prioritas terisi penuh di tab mana pun — mereka tidak tersaring', async () => {
    for (const tab of [undefined, ...GENRE_TABS]) {
      const feed = await api.getHomeFeed(tab)
      const prioritas = feed.sections.filter((s) =>
        ['populer', 'terbaru', 'terbuka'].includes(s.id),
      )

      expect(prioritas.map((s) => s.id)).toEqual(['populer', 'terbaru', 'terbuka'])
      for (const section of prioritas) {
        expect(
          section.stories.length,
          `${tab ?? 'Semua'} › ${section.title}`,
        ).toBeGreaterThanOrEqual(MIN_PER_SECTION)
      }
    }
  })
})
