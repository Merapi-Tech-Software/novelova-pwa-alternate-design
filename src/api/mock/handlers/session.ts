import {
  ACCESS_TOKEN_MIN,
  LOGIN_ATTEMPTS_MAX,
  LOGIN_LOCKOUT_MIN,
  RESET_LINK_MIN,
  SESSION_IDLE_DAYS,
} from '@/lib/limits'
import type { NovelovaApi } from '../../client'
import type { LoginInput, RegisterInput, ResetRequest, Session } from '../../contracts'
import { ApiError, INTERNAL_CODES, VISIBLE_CODES } from '../../errors'
import { db } from '../db'
import { CURRENT_USER_ID } from '../seed'

/**
 * Sesi server tiruan · FR-AUTH-12.
 *
 * **Cookie refresh disimulasikan dengan Web Storage.** Di server sungguhan,
 * `writeCookie` adalah satu baris `Set-Cookie: refresh=…; HttpOnly; Max-Age=…`
 * yang tidak pernah bisa dibaca klien. Pemetaan "Ingat saya" jadi lurus:
 *
 * | "Ingat saya" | Cookie sungguhan | Tiruannya di sini |
 * |---|---|---|
 * | dicentang | `Max-Age` 30 hari | `localStorage` — bertahan setelah peramban ditutup |
 * | tidak | cookie sesi | `sessionStorage` — mati bersama peramban |
 *
 * Yang penting: **klien tidak pernah menyentuh kunci ini.** Ia hidup di sisi
 * server dari seam, sama seperti Dexie.
 *
 * ponytail: satu kunci storage, bukan tabel sesi. Batas atasnya — sesi perangkat
 * lain tidak bisa dicabut dari sini. Saat `revokeDeviceSession` harus benar-benar
 * bekerja (Fase 13), sesi pindah ke tabel `deviceSessions` dan cookie cukup
 * berisi id-nya.
 */

const COOKIE = 'novelova:mock-refresh'

interface RefreshCookie {
  userId: string
  remember: boolean
  /** Dasar kedaluwarsa 30 hari **tanpa aktivitas**, bukan 30 hari sejak masuk. */
  lastUsedAt: string
}

/**
 * Kata sandi akun contoh. Bukan rahasia: server tiruan tidak menyimpan hash, dan
 * tidak ada apa pun di luar peramban ini yang bisa dibuka dengannya.
 */
export const MOCK_PASSWORD = 'novelova123'

function readCookie(): RefreshCookie | null {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const raw = store.getItem(COOKIE)
      if (raw) return JSON.parse(raw) as RefreshCookie
    } catch {
      // Storage diblokir atau isinya rusak → diperlakukan sebagai "tidak ada sesi".
    }
  }
  return null
}

function writeCookie(cookie: RefreshCookie): void {
  clearCookie()
  try {
    const store = cookie.remember ? localStorage : sessionStorage
    store.setItem(COOKIE, JSON.stringify(cookie))
  } catch {
    // Mode privat atau kuota penuh: sesi jadi seumur tab saja. Tidak ada yang
    // perlu dilaporkan ke pengguna — ia tetap masuk.
  }
}

function clearCookie(): void {
  try {
    localStorage.removeItem(COOKIE)
    sessionStorage.removeItem(COOKIE)
  } catch {
    // Sama seperti di atas: tidak bisa menghapus artinya memang tidak ada.
  }
}

function sessionExpired(): ApiError {
  return new ApiError(
    VISIBLE_CODES.AUTH_EXPIRED,
    'Sesi kamu sudah berakhir. Masuk lagi untuk melanjutkan.',
  )
}

/** "Middleware auth" server tiruan: siapa yang sedang memanggil. */
export function currentUserId(): string {
  const cookie = readCookie()
  if (!cookie) throw sessionExpired()
  return cookie.userId
}

async function issue(userId: string): Promise<Session> {
  const user = await db.users.get(userId)
  if (!user) throw sessionExpired()
  return {
    user,
    // Token tiruan; tidak ada yang memverifikasinya. Bentuknya sengaja bersegmen
    // seperti JWT supaya kode klien yang menaruhnya di header tidak perlu berubah.
    accessToken: `mock.${userId}.${Date.now().toString(36)}`,
    expiresAt: new Date(Date.now() + ACCESS_TOKEN_MIN * 60_000).toISOString(),
  }
}

/** Identitas perangkat — dasar penahanan `AUTH-429`, dibuat sekali per peramban. */
async function deviceId(): Promise<string> {
  const row = await db.kv.get('device:id')
  if (typeof row?.value === 'string') return row.value

  const id = crypto.randomUUID()
  await db.kv.put({ key: 'device:id', value: id })
  return id
}

/**
 * Penahanan brute force · `AUTH-429`.
 *
 * Lima kegagalan dalam 15 menit dari satu perangkat menahan percobaan
 * berikutnya sampai 15 menit setelah kegagalan **terakhir**. Mengembalikan
 * waktu buka kembali, karena layar penuhnya wajib menyebut jamnya — bukan
 * sekadar "coba lagi nanti".
 */
async function lockedUntil(device: string): Promise<string | null> {
  const windowStart = Date.now() - LOGIN_LOCKOUT_MIN * 60_000
  const rows = await db.loginAttempts.where('deviceId').equals(device).toArray()

  const stale = rows.filter((r) => Date.parse(r.failedAt) < windowStart)
  if (stale.length > 0) await db.loginAttempts.bulkDelete(stale.map((r) => r.id))

  const recent = rows.filter((r) => Date.parse(r.failedAt) >= windowStart)
  if (recent.length < LOGIN_ATTEMPTS_MAX) return null

  const last = Math.max(...recent.map((r) => Date.parse(r.failedAt)))
  return new Date(last + LOGIN_LOCKOUT_MIN * 60_000).toISOString()
}

/**
 * Satu kolom identitas menerima email maupun nomor HP (FR-AUTH-01). Data contoh
 * hanya punya `username`, jadi yang dicocokkan bagian sebelum `@`:
 * `annamaharani@example.com` dan `annamaharani` sama-sama masuk. Nomor HP belum
 * ada di seed — server sungguhan yang memutuskan identitas mana yang sah.
 */
function usernameOf(identity: string): string {
  return identity.trim().toLowerCase().split('@')[0] ?? ''
}

export const sessionHandlers: Pick<
  NovelovaApi,
  'login' | 'register' | 'requestReset' | 'refresh' | 'logout'
> = {
  async login(input: LoginInput): Promise<Session> {
    const device = await deviceId()

    // Dicek **sebelum** kredensial disentuh: perangkat yang sedang ditahan tidak
    // boleh dipakai menebak kata sandi, benar atau salah.
    const until = await lockedUntil(device)
    if (until) {
      throw new ApiError(
        VISIBLE_CODES.AUTH_RATE_LIMITED,
        'Terlalu banyak percobaan masuk dari perangkat ini.',
        { retryAt: until },
      )
    }

    const user = await db.users.where('username').equals(usernameOf(input.identity)).first()
    if (!user || input.password !== MOCK_PASSWORD) {
      await db.loginAttempts.add({
        id: crypto.randomUUID(),
        deviceId: device,
        failedAt: new Date().toISOString(),
      })
      throw new ApiError(INTERNAL_CODES.VALIDATION, 'Email, nomor HP, atau kata sandi tidak cocok.')
    }

    await db.loginAttempts.where('deviceId').equals(device).delete()
    writeCookie({ userId: user.id, remember: input.remember, lastUsedAt: new Date().toISOString() })
    return issue(user.id)
  },

  /**
   * Akun baru langsung punya sesi — pengguna yang baru saja mengetik kata
   * sandinya tidak disuruh mengetiknya lagi. Dompet kosong dibuat sekalian,
   * supaya layar dompet tidak menemui pengguna tanpa baris dompet sama sekali.
   */
  async register(input: RegisterInput): Promise<Session> {
    const username = usernameOf(input.email)
    const taken = await db.users.where('username').equals(username).first()
    if (taken) {
      throw new ApiError(INTERNAL_CODES.CONFLICT, 'Email ini sudah terdaftar. Coba masuk saja.')
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await db.users.add({
      id,
      displayName: input.displayName.trim(),
      username,
      avatarUrl: null,
      role: 'reader',
      tier: 1,
      joinedYear: new Date().getFullYear(),
      penName: null,
    })
    await db.wallets.add({ userId: id, balance: 0, bonus: 0, updatedAt: now })
    await db.readerPrefs.add({ userId: id, genres: [], hiddenStoryIds: [], onboardedAt: null })

    writeCookie({ userId: id, remember: true, lastUsedAt: now })
    return issue(id)
  },

  /**
   * Tautan reset · FR-AUTH-08. **Tidak pernah menolak.** Menjawab "email itu
   * tidak terdaftar" membocorkan akun mana yang ada kepada siapa pun yang mau
   * mencoba, dan pengguna yang salah ketik tetap tidak tertolong olehnya.
   */
  async requestReset(identity: string): Promise<ResetRequest> {
    return {
      sentTo: identity.trim() || 'kontak akunmu',
      expiresInMinutes: RESET_LINK_MIN,
    }
  },

  async refresh(): Promise<Session> {
    const cookie = readCookie()
    if (!cookie) throw sessionExpired()

    const idleMs = Date.now() - Date.parse(cookie.lastUsedAt)
    if (!Number.isFinite(idleMs) || idleMs > SESSION_IDLE_DAYS * 86_400_000) {
      clearCookie()
      throw sessionExpired()
    }

    // Setiap pemakaian menggeser jendela 30 hari.
    writeCookie({ ...cookie, lastUsedAt: new Date().toISOString() })
    return issue(cookie.userId)
  },

  async logout(): Promise<void> {
    clearCookie()
  },
}

/**
 * Menandai perangkat ini sudah masuk sebagai akun contoh — **sekali saja**.
 *
 * Tanpa ini seluruh aplikasi terkunci di `/masuk`, yang layarnya baru dibangun
 * pada langkah berikutnya. Penanda `kv` membuatnya tidak berulang: sekali
 * pengguna keluar, ia tetap keluar.
 */
export async function ensureSeedSession(): Promise<void> {
  if (await db.kv.get('session:seeded')) return
  await db.kv.put({ key: 'session:seeded', value: true })
  if (!readCookie()) {
    writeCookie({ userId: CURRENT_USER_ID, remember: true, lastUsedAt: new Date().toISOString() })
  }
}
