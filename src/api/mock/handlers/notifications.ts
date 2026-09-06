import {
  dalamJamTenang,
  groupOfKind,
  jamDiZona,
  NOTIF_MAX_AGE_DAYS,
  NOTIF_MERGE_WINDOW_MS,
  typeOfKind,
} from '@/lib/notif'
import type { NovelovaApi } from '../../client'
import type {
  Notification,
  NotificationPrefs,
  NotifKind,
  NotifParams,
  Paged,
} from '../../contracts'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Notifikasi · FR-NOTIF-01..04.
 *
 * Tiga aturan yang membuat handler ini lebih dari sekadar daftar:
 *
 * 1. **Sakelar per cerita menang atas preferensi global** (FR-NOTIF-04).
 *    Mematikan kelompok "Cerita" mematikan semuanya; menyalakannya tetap
 *    menghormati sakelar per cerita di `/pustaka`. Urutan pemeriksaannya
 *    penting: global dulu, per cerita kemudian.
 * 2. **Penggabungan terjadi saat menulis, bukan saat membaca** (FR-NOTIF-02).
 *    Notifikasi sejenis dari cerita yang sama dalam 24 jam menaikkan
 *    `groupCount` baris yang sudah ada, bukan menambah baris baru. Menggabung
 *    saat membaca berarti tiap saringan dan tiap halaman harus menggabung
 *    ulang — dan penghitung belum-dibaca akan berbeda dari yang terlihat.
 * 3. **Notifikasi yang digabung kembali jadi belum dibaca.** Bab ketiga yang
 *    terbit setelah pembaca membuka barisnya adalah kabar baru, bukan kabar
 *    yang sama.
 */

const MAX_AGE_MS = NOTIF_MAX_AGE_DAYS * 24 * 60 * 60 * 1000

/** Baris yang boleh tampil: milik pengguna ini dan belum lewat 90 hari. */
async function visibleFor(userId: string, now = Date.now()): Promise<Notification[]> {
  const rows = await db.notifications.where('userId').equals(userId).toArray()
  return rows
    .filter((n) => now - Date.parse(n.createdAt) <= MAX_AGE_MS)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

/** Preferensi tersimpan, atau bawaan bila pengguna belum pernah menyentuhnya. */
async function prefsOf(userId: string): Promise<NotificationPrefs> {
  const saved = await db.notificationPrefs.get(userId)
  if (saved) return saved
  return {
    userId,
    cerita: { inApp: true, push: true, email: false },
    dompetHadiah: { inApp: true, push: true, email: true },
    karya: { inApp: true, push: true, email: false },
    sistem: { inApp: true, push: true, email: true },
    quietHours: { enabled: true, from: 22, to: 7 },
  }
}

/**
 * "Push" versi 1 · architecture.md §10.4.
 *
 * Tanpa backend tidak ada Web Push ber-VAPID, jadi yang dikirim adalah
 * notifikasi lokal lewat **service worker yang sama** — pemicunya tetap
 * server-mock, jadi keputusan mengirim tetap milik server, bukan layar. Bentuk
 * datanya persis yang dibaca `notificationclick` di `sw.ts`, supaya menukar
 * transportnya nanti tidak menyentuh apa pun selain isi fungsi ini.
 *
 * Diam bila izinnya belum diberikan: meminta izin adalah keputusan layar, di
 * momen yang relevan (FR-NOTIF-05), bukan efek samping notifikasi pertama.
 *
 * ponytail: transport lokal; ganti isinya dengan panggilan Web Push saat
 * backend ada.
 */
async function kirimPush(row: Notification): Promise<void> {
  if (globalThis.Notification?.permission !== 'granted') return
  const reg = await navigator.serviceWorker?.ready
  await reg?.showNotification(row.title, {
    body: row.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    // `tag` menyatukan push sejenis di baki, sejalan dengan penggabungan 24 jam.
    ...(row.groupKey ? { tag: row.groupKey } : {}),
    data: { deepLink: row.deepLink },
  })
}

export interface EmitInput {
  kind: NotifKind
  title: string
  body: string
  deepLink: string
  /**
   * Id tetap untuk pemicu yang bisa berjalan lebih dari sekali · idempotency.
   * Rekonsiliasi dompet memakainya supaya pembacaan kedua tidak melahirkan
   * baris kembar. Tanpa ini, id-nya acak.
   */
  id?: string
  /**
   * Kunci penggabungan · FR-NOTIF-02. Dua notifikasi berkunci sama dalam 24 jam
   * jadi satu baris. `null` berarti tidak pernah digabung — top-up berhasil dua
   * kali adalah dua kabar, bukan satu kabar berjumlah dua.
   */
  groupKey?: string | null
  /** Diisi hanya untuk `bab-baru`: sakelar per cerita diperiksa dari sini. */
  storyId?: string
  at?: number
}

/**
 * Menerbitkan satu notifikasi, atau menolaknya · FR-NOTIF-02, FR-NOTIF-04.
 *
 * Mengembalikan baris yang tertulis, atau `null` bila preferensi menolaknya —
 * pemanggil tidak perlu tahu alasannya, tetapi test perlu bisa membedakan
 * "tidak ada notifikasi" dari "ada tapi kosong".
 *
 * Diekspor karena pemicunya tersebar di fase lain (penjadwal bab, status cetak,
 * top-up, check-in). Yang memanggilnya cukup tahu jenisnya dan tujuannya.
 */
export async function emitNotification(
  userId: string,
  input: EmitInput,
): Promise<Notification | null> {
  const now = input.at ?? Date.now()
  const prefs = await prefsOf(userId)
  const group = groupOfKind(input.kind)

  // Kelompok yang dimatikan menghentikan semuanya lebih dulu — termasuk cerita
  // yang sakelar pribadinya menyala. "Lebih spesifik" hanya berlaku ke arah
  // mempersempit, tidak ke arah menghidupkan kembali (FR-NOTIF-04).
  if (!prefs[group].inApp) return null

  // Sakelar per cerita adalah **sumber kebenaran** untuk bab baru (FR-NOTIF-02).
  // Cerita yang sudah dikeluarkan dari rak juga berhenti mengirim: ia tidak
  // dihapus, hanya ditandai, dan sakelarnya masih menyala di barisnya.
  if (input.kind === 'bab-baru' && input.storyId !== undefined) {
    const entry = await db.libraryEntries
      .where('[userId+storyId]')
      .equals([userId, input.storyId])
      .first()
    if (!entry || entry.removed || !entry.notify) return null
  }

  /*
   * **Jam tenang menunda push, bukan notifikasinya** · FR-NOTIF-05.
   *
   * Baris di bawah tetap ditulis apa pun jawabannya — yang diputuskan di sini
   * cuma apakah perangkat berdering sekarang. Menahan keduanya berarti kabar
   * pukul 23.00 baru punya jejak pukul 07.00, dan pembaca yang membuka aplikasi
   * pukul 02.00 melihat daftar yang berbohong.
   *
   * Zonanya milik **pengguna** (`LocaleSettings.timezone`), bukan server: jam
   * tenang yang memakai jam server salah untuk semua orang di luar zona itu.
   *
   * ponytail: v1 hanya memutuskan, tidak mengirim — Web Push ber-VAPID menunggu
   * backend (§10.4). Yang dibangun nyata di sini aturannya, dan aturannya yang
   * tidak boleh salah saat transportnya menyusul.
   */
  const locale = await db.localeSettings.get(userId)
  const jam = jamDiZona(locale?.timezone ?? 'Asia/Jakarta', new Date(now))
  const pushSekarang =
    prefs[group].push &&
    !(prefs.quietHours.enabled && dalamJamTenang(jam, prefs.quietHours.from, prefs.quietHours.to))

  const groupKey = input.groupKey ?? null
  if (groupKey !== null) {
    const existing = (await visibleFor(userId, now)).find(
      (n) => n.groupKey === groupKey && now - Date.parse(n.createdAt) <= NOTIF_MERGE_WINDOW_MS,
    )
    if (existing) {
      const merged: Notification = {
        ...existing,
        title: input.title,
        body: input.body,
        deepLink: input.deepLink,
        groupCount: existing.groupCount + 1,
        // Kabar baru di baris lama: penandanya kembali menyala.
        readAt: null,
        createdAt: new Date(now).toISOString(),
      }
      await db.notifications.put(merged)
      if (pushSekarang) void kirimPush(merged)
      return merged
    }
  }

  const row: Notification = {
    id: input.id ?? `n-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    kind: input.kind,
    type: typeOfKind(input.kind),
    title: input.title,
    body: input.body,
    deepLink: input.deepLink,
    groupKey,
    groupCount: 1,
    readAt: null,
    createdAt: new Date(now).toISOString(),
  }
  // `put`, bukan `add`: pemicu ber-id tetap boleh berjalan dua kali tanpa
  // melahirkan baris kembar, dan yang tanpa id tidak pernah bertabrakan.
  await db.notifications.put(row)
  if (pushSekarang) void kirimPush(row)
  return row
}

export const notificationHandlers: Pick<
  NovelovaApi,
  | 'listNotifications'
  | 'getUnreadCount'
  | 'markRead'
  | 'getNotificationPrefs'
  | 'setNotificationPrefs'
> = {
  /**
   * Daftar notifikasi · FR-NOTIF-01.
   *
   * Menyaring **di sini**, bukan di layar: saringan yang menyembunyikan baris
   * yang sudah diambil akan berhenti benar begitu ada halaman kedua.
   */
  async listNotifications(params: NotifParams): Promise<Paged<Notification>> {
    const userId = currentUserId()
    let rows = await visibleFor(userId)

    if (params.type) rows = rows.filter((n) => n.type === params.type)
    if (params.unreadOnly) rows = rows.filter((n) => n.readAt === null)

    const start = (params.page - 1) * params.pageSize
    const items = rows.slice(start, start + params.pageSize)
    return {
      items,
      total: rows.length,
      page: params.page,
      pageSize: params.pageSize,
      hasMore: start + items.length < rows.length,
    }
  },

  /** Jumlah belum dibaca untuk lencana lonceng · FR-NOTIF-03. */
  async getUnreadCount(): Promise<number> {
    const rows = await visibleFor(currentUserId())
    return rows.filter((n) => n.readAt === null).length
  },

  /**
   * Menandai terbaca · FR-NOTIF-03.
   *
   * `'all'` hanya menyentuh yang **masih terlihat**: notifikasi berumur lebih
   * dari 90 hari tidak ditampilkan, jadi menandainya terbaca akan mengubah data
   * yang pengguna tidak pernah lihat.
   */
  async markRead(ids: string[] | 'all'): Promise<void> {
    const userId = currentUserId()
    const rows = await visibleFor(userId)
    const at = new Date().toISOString()
    const target = ids === 'all' ? rows : rows.filter((n) => ids.includes(n.id))
    const changed = target.filter((n) => n.readAt === null).map((n) => ({ ...n, readAt: at }))
    if (changed.length > 0) await db.notifications.bulkPut(changed)
  },

  async getNotificationPrefs(): Promise<NotificationPrefs> {
    return prefsOf(currentUserId())
  },

  /**
   * Menyimpan preferensi · FR-NOTIF-04.
   *
   * Kanal keamanan **dipaksa menyala di server**, bukan hanya dinonaktifkan di
   * layar: sakelar yang tidak boleh dimatikan harus tetap tidak bisa dimatikan
   * oleh permintaan yang melewati layarnya.
   */
  async setNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
    const userId = currentUserId()
    await db.notificationPrefs.put({
      ...prefs,
      userId,
      sistem: { ...prefs.sistem, inApp: true, push: true },
    })
  },
}
