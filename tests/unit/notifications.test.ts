import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import type { NotificationPrefs } from '@/api/contracts'
import { db } from '@/api/mock/db'
import { emitNotification } from '@/api/mock/handlers/notifications'
import { CURRENT_USER_ID as ME, SEED_NOTIFICATIONS } from '@/api/mock/seed'
import {
  badgeCount,
  dalamJamTenang,
  jamDiZona,
  NOTIF_GROUP_LIST,
  NOTIF_KIND_LIST,
  NOTIF_KINDS,
} from '@/lib/notif'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const ALL = { page: 1, pageSize: 100, unreadOnly: false as const }

/**
 * Kotak kosong tiap test. Seed punya sebelas notifikasi contoh dan itu bagus
 * untuk layarnya, tetapi menghitung penggabungan di atas data yang sudah ada
 * membuat angkanya bergantung pada seed alih-alih pada aturannya.
 */
beforeEach(async () => {
  await db.notifications.where('userId').equals(ME).delete()
  await db.notificationPrefs.delete(ME)
  await db.libraryEntries.where('userId').equals(ME).delete()
})

async function shelve(storyId: string, notify: boolean, removed = false) {
  await db.libraryEntries.put({
    id: `lib-${ME}-${storyId}`,
    userId: ME,
    storyId,
    savedAt: '2026-08-20',
    notify,
    removed,
  })
}

const babBaru = (storyId: string, at: number) => ({
  kind: 'bab-baru' as const,
  title: 'Bab baru',
  body: 'Bab terbaru sudah terbit',
  deepLink: `/cerita/${storyId}`,
  groupKey: `story-${storyId}-chapter`,
  storyId,
  at,
})

// ── FR-NOTIF-03 · lencana ───────────────────────────────────────────────────

describe('lencana belum dibaca', () => {
  it('menulis angkanya apa adanya sampai sembilan', () => {
    expect(badgeCount(3)).toBe('3')
    expect(badgeCount(9)).toBe('9')
  })

  it('menulis `9+` di atas sembilan', () => {
    expect(badgeCount(10)).toBe('9+')
    expect(badgeCount(15)).toBe('9+')
  })

  it('mengembalikan null saat nol — lencana tidak dirender, bukan menulis `0`', () => {
    expect(badgeCount(0)).toBeNull()
    expect(badgeCount(-1)).toBeNull()
  })

  it('jumlahnya ikut turun setelah satu baris ditandai terbaca', async () => {
    await shelve('s1', true)
    const row = await emitNotification(ME, babBaru('s1', Date.now()))
    expect(await api.getUnreadCount()).toBe(1)

    await api.markRead([row?.id ?? ''])
    expect(await api.getUnreadCount()).toBe(0)
  })
})

// ── FR-NOTIF-02 · sakelar per cerita ────────────────────────────────────────

describe('sakelar notifikasi per cerita', () => {
  it('cerita yang sakelarnya mati tidak menghasilkan notifikasi bab baru', async () => {
    await shelve('s1', false)

    const row = await emitNotification(ME, babBaru('s1', Date.now()))

    expect(row).toBeNull()
    expect((await api.listNotifications(ALL)).items).toHaveLength(0)
  })

  it('cerita yang sakelarnya menyala tetap menghasilkan notifikasi', async () => {
    await shelve('s1', true)

    const row = await emitNotification(ME, babBaru('s1', Date.now()))

    expect(row).not.toBeNull()
    expect((await api.listNotifications(ALL)).items).toHaveLength(1)
  })

  it('cerita yang sudah dikeluarkan dari rak berhenti mengirim, walau sakelarnya masih menyala', async () => {
    await shelve('s1', true, true)

    expect(await emitNotification(ME, babBaru('s1', Date.now()))).toBeNull()
  })

  it('kelompok "Cerita" yang dimatikan mengalahkan sakelar per cerita yang menyala', async () => {
    await shelve('s1', true)
    const prefs = await api.getNotificationPrefs()
    await api.setNotificationPrefs({
      ...prefs,
      cerita: { inApp: false, push: false, email: false },
    })

    expect(await emitNotification(ME, babBaru('s1', Date.now()))).toBeNull()
  })
})

// ── FR-NOTIF-02 · penggabungan ──────────────────────────────────────────────

describe('penggabungan notifikasi sejenis', () => {
  it('tiga bab dari cerita yang sama dalam satu hari jadi satu baris', async () => {
    await shelve('s1', true)
    const now = Date.now()

    await emitNotification(ME, babBaru('s1', now - 6 * HOUR))
    await emitNotification(ME, babBaru('s1', now - 3 * HOUR))
    await emitNotification(ME, {
      ...babBaru('s1', now),
      title: '3 bab baru di Cinta di Balik Kontrak',
    })

    const page = await api.listNotifications(ALL)
    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.groupCount).toBe(3)
    expect(page.items[0]?.title).toBe('3 bab baru di Cinta di Balik Kontrak')
  })

  it('cerita yang berbeda tidak ikut tergabung', async () => {
    await shelve('s1', true)
    await shelve('s2', true)
    const now = Date.now()

    await emitNotification(ME, babBaru('s1', now - HOUR))
    await emitNotification(ME, babBaru('s2', now))

    expect((await api.listNotifications(ALL)).items).toHaveLength(2)
  })

  it('lewat 24 jam ia baris baru, bukan gabungan', async () => {
    await shelve('s1', true)
    const now = Date.now()

    await emitNotification(ME, babBaru('s1', now - 2 * DAY))
    await emitNotification(ME, babBaru('s1', now))

    const page = await api.listNotifications(ALL)
    expect(page.items).toHaveLength(2)
    expect(page.items.every((n) => n.groupCount === 1)).toBe(true)
  })

  it('baris yang sudah dibaca kembali belum dibaca saat kabar berikutnya masuk', async () => {
    await shelve('s1', true)
    const now = Date.now()

    const first = await emitNotification(ME, babBaru('s1', now - HOUR))
    await api.markRead([first?.id ?? ''])
    expect(await api.getUnreadCount()).toBe(0)

    await emitNotification(ME, babBaru('s1', now))
    expect(await api.getUnreadCount()).toBe(1)
  })

  it('tanpa `groupKey` tidak pernah digabung — dua top-up adalah dua kabar', async () => {
    const now = Date.now()
    const topup = (at: number) => ({
      kind: 'topup' as const,
      title: 'Top-up berhasil',
      body: '500 koin masuk',
      deepLink: '/koin/transaksi/tx1',
      at,
    })

    await emitNotification(ME, topup(now - HOUR))
    await emitNotification(ME, topup(now))

    expect((await api.listNotifications(ALL)).items).toHaveLength(2)
  })
})

// ── FR-NOTIF-01 · daftar, saringan, umur ────────────────────────────────────

describe('daftar notifikasi', () => {
  it('menyaring menurut jenis di server', async () => {
    const now = Date.now()
    await emitNotification(ME, {
      kind: 'topup',
      title: 'Top-up',
      body: '.',
      deepLink: '/koin',
      at: now,
    })
    await emitNotification(ME, {
      kind: 'checkin',
      title: 'Check-in',
      body: '.',
      deepLink: '/hadiah',
      at: now - HOUR,
    })

    const dompet = await api.listNotifications({ ...ALL, type: 'dompet' })
    expect(dompet.items).toHaveLength(1)
    expect(dompet.items[0]?.kind).toBe('topup')
  })

  it('terurut terbaru di atas', async () => {
    const now = Date.now()
    await emitNotification(ME, {
      kind: 'topup',
      title: 'lama',
      body: '.',
      deepLink: '/koin',
      at: now - 5 * HOUR,
    })
    await emitNotification(ME, {
      kind: 'topup',
      title: 'baru',
      body: '.',
      deepLink: '/koin',
      at: now,
    })

    const page = await api.listNotifications(ALL)
    expect(page.items.map((n) => n.title)).toEqual(['baru', 'lama'])
  })

  it('notifikasi lebih tua dari 90 hari tidak ditampilkan', async () => {
    const now = Date.now()
    await emitNotification(ME, {
      kind: 'topup',
      title: 'terlalu lama',
      body: '.',
      deepLink: '/koin',
      at: now - 91 * DAY,
    })
    await emitNotification(ME, {
      kind: 'topup',
      title: 'masih muat',
      body: '.',
      deepLink: '/koin',
      at: now - 89 * DAY,
    })

    const page = await api.listNotifications(ALL)
    expect(page.items.map((n) => n.title)).toEqual(['masih muat'])
  })

  it('memberi tahu masih ada halaman berikutnya', async () => {
    const now = Date.now()
    for (let i = 0; i < 3; i += 1) {
      await emitNotification(ME, {
        kind: 'topup',
        title: `n${i}`,
        body: '.',
        deepLink: '/koin',
        at: now - i * HOUR,
      })
    }

    const first = await api.listNotifications({ page: 1, pageSize: 2, unreadOnly: false })
    expect(first.items).toHaveLength(2)
    expect(first.hasMore).toBe(true)

    const second = await api.listNotifications({ page: 2, pageSize: 2, unreadOnly: false })
    expect(second.items).toHaveLength(1)
    expect(second.hasMore).toBe(false)
  })

  it('"tandai semua" mengosongkan lencana', async () => {
    const now = Date.now()
    await emitNotification(ME, {
      kind: 'topup',
      title: 'a',
      body: '.',
      deepLink: '/koin',
      at: now,
    })
    await emitNotification(ME, {
      kind: 'checkin',
      title: 'b',
      body: '.',
      deepLink: '/hadiah',
      at: now - HOUR,
    })
    expect(await api.getUnreadCount()).toBe(2)

    await api.markRead('all')
    expect(await api.getUnreadCount()).toBe(0)
  })
})

// ── FR-NOTIF-02 · katalog sebelas jenis ─────────────────────────────────────

describe('katalog jenis', () => {
  it('punya sebelas jenis, sesuai tabel FR-NOTIF-02', () => {
    expect(NOTIF_KIND_LIST).toHaveLength(11)
  })

  it('setiap jenis memetakan ke satu saringan dan satu kelompok preferensi', () => {
    for (const kind of NOTIF_KIND_LIST) {
      const def = NOTIF_KINDS[kind]
      expect(['cerita', 'dompet', 'hadiah', 'sistem']).toContain(def.type)
      expect(NOTIF_GROUP_LIST).toContain(def.group)
      expect(def.label.length).toBeGreaterThan(0)
    }
  })

  it('setiap kelompok preferensi benar-benar memuat jenis — tidak ada sakelar kosong', () => {
    for (const group of NOTIF_GROUP_LIST) {
      const kinds = NOTIF_KIND_LIST.filter((k) => NOTIF_KINDS[k].group === group)
      expect(kinds.length).toBeGreaterThan(0)
    }
  })

  it('kesebelas jenis benar-benar ada di data contoh, masing-masing dengan tujuan buka', () => {
    // Dibaca dari seed, bukan dari tabel: `beforeEach` mengosongkan tabelnya,
    // dan yang diperiksa di sini memang isi contohnya — bukan sisa test lain.
    const kinds = new Set(SEED_NOTIFICATIONS.map((n) => n.kind))
    expect([...kinds].sort()).toEqual([...NOTIF_KIND_LIST].sort())

    // FR-NOTIF-02: tidak ada notifikasi yang hanya bisa dibaca tanpa tindak lanjut.
    for (const notif of SEED_NOTIFICATIONS) {
      expect(notif.deepLink.startsWith('/')).toBe(true)
      expect(notif.type).toBe(NOTIF_KINDS[notif.kind].type)
    }
  })
})

// ── FR-NOTIF-04 · preferensi ────────────────────────────────────────────────

describe('preferensi notifikasi', () => {
  it('kanal keamanan dipaksa menyala server, walau permintaannya mematikannya', async () => {
    const prefs = await api.getNotificationPrefs()

    await api.setNotificationPrefs({
      ...prefs,
      sistem: { inApp: false, push: false, email: false },
    } as unknown as NotificationPrefs)

    const saved = await api.getNotificationPrefs()
    expect(saved.sistem.inApp).toBe(true)
    expect(saved.sistem.push).toBe(true)
    // Email tetap boleh dimatikan: ia salinannya, bukan peringatannya.
    expect(saved.sistem.email).toBe(false)
  })

  it('tersimpan di server, jadi terbaca lagi setelah dibaca ulang', async () => {
    const prefs = await api.getNotificationPrefs()
    await api.setNotificationPrefs({
      ...prefs,
      dompetHadiah: { inApp: true, push: false, email: false },
    })

    expect((await api.getNotificationPrefs()).dompetHadiah.push).toBe(false)
  })

  it('mematikan satu kelompok tidak menghentikan kelompok lain', async () => {
    const prefs = await api.getNotificationPrefs()
    await api.setNotificationPrefs({
      ...prefs,
      dompetHadiah: { inApp: false, push: false, email: false },
    })
    const now = Date.now()

    expect(
      await emitNotification(ME, {
        kind: 'topup',
        title: 'Top-up',
        body: '.',
        deepLink: '/koin',
        at: now,
      }),
    ).toBeNull()

    expect(
      await emitNotification(ME, {
        kind: 'keamanan',
        title: 'Masuk dari perangkat baru',
        body: '.',
        deepLink: '/pengaturan/keamanan',
        at: now,
      }),
    ).not.toBeNull()
  })
})

// ── FR-STUDIO-38 · keputusan tinjauan memicu notifikasi ─────────────────────

describe('notifikasi keputusan tinjauan', () => {
  it('penolakan mengabari penulis **beserta alasannya**', async () => {
    const { resolveReviewAsAdmin } = await import('@/api/mock/handlers/schedule')
    const chapter = (await db.chapters.where('storyId').equals('ms1').toArray())[0]
    expect(chapter).toBeDefined()

    await resolveReviewAsAdmin(
      { kind: 'chapter', refId: chapter?.id ?? '' },
      'reject',
      'Alasan penolakan yang spesifik.',
    )

    const page = await api.listNotifications(ALL)
    const baris = page.items.find((n) => n.title.includes('perlu diperbaiki'))
    expect(baris).toBeDefined()
    // **Alasannya ikut**: notifikasi yang cuma berkata "ditolak" memaksa penulis
    // membuka halaman lain untuk tahu apa yang harus diperbaiki.
    expect(baris?.body).toBe('Alasan penolakan yang spesifik.')
    expect(baris?.deepLink).toContain('/karya/ms1/bab')
  })

  it('persetujuan juga mengabari, dan menuju halaman babnya', async () => {
    const { resolveReviewAsAdmin } = await import('@/api/mock/handlers/schedule')
    const chapter = (await db.chapters.where('storyId').equals('ms1').toArray())[1]

    await resolveReviewAsAdmin({ kind: 'chapter', refId: chapter?.id ?? '' }, 'approve')

    const page = await api.listNotifications(ALL)
    expect(page.items.some((n) => n.title.includes('disetujui dan tayang'))).toBe(true)
  })
})

describe('jam tenang · FR-NOTIF-05', () => {
  it('jendela 22→7 membungkus tengah malam', () => {
    // Bentuk bawaannya `from > to`. Kalau ini dibaca sebagai rentang biasa,
    // hasilnya rentang kosong — dan jam tenang diam-diam tidak pernah berlaku.
    for (const jam of [22, 23, 0, 3, 6]) expect(dalamJamTenang(jam, 22, 7)).toBe(true)
    for (const jam of [7, 12, 21]) expect(dalamJamTenang(jam, 22, 7)).toBe(false)
  })

  it('jendela biasa dan jendela kosong', () => {
    expect(dalamJamTenang(13, 12, 14)).toBe(true)
    expect(dalamJamTenang(14, 12, 14)).toBe(false) // batas atas eksklusif
    expect(dalamJamTenang(5, 9, 9)).toBe(false) // from === to bukan "sepanjang hari"
  })

  it('jamnya milik zona pengguna, bukan zona mesin', () => {
    // 2026-09-06T17.00Z = 00.00 WIB (tenang) tetapi 10.00 di Los Angeles (tidak).
    const at = new Date('2026-09-06T17:00:00Z')
    expect(jamDiZona('Asia/Jakarta', at)).toBe(0)
    expect(jamDiZona('America/Los_Angeles', at)).toBe(10)
    expect(dalamJamTenang(jamDiZona('Asia/Jakarta', at), 22, 7)).toBe(true)
    expect(dalamJamTenang(jamDiZona('America/Los_Angeles', at), 22, 7)).toBe(false)
  })

  it('zona yang tidak dikenal jatuh ke jam mesin, bukan melempar', () => {
    const at = new Date('2026-09-06T17:00:00Z')
    expect(jamDiZona('Bulan/Kawah_Tycho', at)).toBe(at.getHours())
  })

  it('jam tenang tidak menahan notifikasi dalam aplikasi', async () => {
    // Yang ditunda cuma push. Baris ini wajib tetap ada saat itu juga —
    // menahan keduanya membuat daftar berbohong ke pembaca yang membuka
    // aplikasi pukul 02.00.
    await db.localeSettings.put({
      userId: ME,
      uiLang: 'id',
      translationPriority: 'id',
      contentRegion: 'ID',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
    })
    const at = new Date('2026-09-06T17:00:00Z').getTime() // 00.00 WIB

    const row = await emitNotification(ME, {
      kind: 'topup',
      title: 'Top-up berhasil',
      body: '100 koin masuk.',
      deepLink: '/koin',
      at,
    })

    expect(row).not.toBeNull()
    expect(row?.createdAt).toBe(new Date(at).toISOString())
  })
})
