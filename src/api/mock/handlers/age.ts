import { isAdultNow, isAdultStory } from '@/lib/age'
import { todayLocalISO } from '@/lib/date'
import type { NovelovaApi } from '../../client'
import type { AgeVerification, AgeVerificationInput, ReaderPrefs, Story } from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { SERVER_CONFIG } from '../config'
import { db } from '../db'
import { readerPrefsOf } from '../defaults'
import { currentUserId } from './session'

/**
 * Verifikasi usia & gerbang konten dewasa · todo-incoming-features.md A1.
 *
 * Tiga aturan yang menentukan seluruh berkas ini:
 *
 * 1. **`isAdult` diturunkan saat dibaca**, dari status + tanggal lahir + hari
 *    ini (`lib/age.ts`). Tidak ada bendera tersimpan yang bisa basi.
 * 2. **Mode tampilannya milik server** (`adultContentMode`): `gated` menahan
 *    isi bab saja, `hidden` menahan ceritanya sama sekali. Keduanya dibangun
 *    karena pengguna memintanya begitu; yang memilih backend, bukan layar.
 * 3. **Sakelar pembaca ≠ izin.** `showAdultContent` cuma menjawab "mau lihat
 *    di beranda atau tidak"; yang menjawab "boleh atau tidak" adalah
 *    verifikasinya. Sakelar yang menyala tanpa verifikasi tidak menampilkan
 *    apa pun — dan itu bukan cacat, itu aturannya.
 */

type AdultMode = (typeof SERVER_CONFIG)['adultContentMode']

/** Mode dari `kv` bila `/dev/kitchen-sink` menukarnya; selebihnya konfigurasi. */
export async function adultMode(): Promise<AdultMode> {
  const row = await db.kv.get('policy:adultMode')
  return row?.value === 'hidden' || row?.value === 'gated'
    ? row.value
    : SERVER_CONFIG.adultContentMode
}

/** Pintasan `/dev/kitchen-sink` — bukan metode seam, karena ini kebijakan platform. */
export async function setAdultModeAsDev(mode: AdultMode): Promise<void> {
  await db.kv.put({ key: 'policy:adultMode', value: mode })
}

function kosong(userId: string): Omit<AgeVerification, 'isAdult'> {
  return {
    userId,
    status: 'none',
    birthDate: null,
    documentName: null,
    documentSize: null,
    submittedAt: null,
    decidedAt: null,
    rejectReason: null,
  }
}

async function verificationOf(userId: string): Promise<AgeVerification> {
  const row = (await db.ageVerifications.get(userId)) ?? kosong(userId)
  return { ...row, isAdult: isAdultNow(row, todayLocalISO()) }
}

/**
 * Apa yang boleh dilihat akun ini dari konten 18+ — **dihitung sekali per
 * permintaan**, dipakai beranda, pencarian, detail, dan ruang baca.
 *
 * - `canRead`  — boleh membuka isinya: terverifikasi dan ≥ 18 hari ini.
 * - `inFeeds`  — ikut tampil di beranda/pencarian/jelajah: `canRead` **dan**
 *   sakelarnya menyala. Sakelar mati menyembunyikan dari deretan, tidak dari
 *   tautan langsung — itu pilihan tampilan, bukan larangan.
 * - `canView`  — boleh melihat halaman detailnya: tergantung mode.
 */
export async function adultAccessOf(userId: string): Promise<{
  canRead: boolean
  inFeeds: boolean
  canView: boolean
  mode: AdultMode
}> {
  const [v, prefs, mode] = await Promise.all([
    verificationOf(userId),
    readerPrefsOf(userId),
    adultMode(),
  ])
  const canRead = v.isAdult
  return {
    canRead,
    inFeeds: canRead && prefs.showAdultContent,
    canView: mode === 'gated' || canRead,
    mode,
  }
}

/**
 * Penyaring deretan · dipakai **semua** daftar cerita (beranda, section,
 * pencarian, pilihan awal). Satu fungsi, supaya tidak ada satu daftar pun yang
 * lupa — daftar yang lupa adalah cara cerita 18+ bocor ke beranda anak.
 */
export async function feedFilterFor(userId: string): Promise<(story: Story) => boolean> {
  const access = await adultAccessOf(userId)
  return (story) => !isAdultStory(story) || access.inFeeds
}

/** Melempar `NOT_FOUND` bila mode `hidden` dan akun ini tidak berhak — cerita itu memang "tidak ada" baginya. */
export async function assertStoryViewable(userId: string, story: Story): Promise<void> {
  if (!isAdultStory(story)) return
  const access = await adultAccessOf(userId)
  if (!access.canView) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini tidak ada.')
}

/** Benar bila bab dari cerita ini harus dikirim **tanpa isi** ke akun ini. */
export async function chapterAgeRestricted(userId: string, story: Story): Promise<boolean> {
  if (!isAdultStory(story)) return false
  return !(await adultAccessOf(userId)).canRead
}

/**
 * Keputusan peninjau · pintasan `/dev/kitchen-sink`, bukan metode seam.
 *
 * Alasan yang sama dengan `resolveReviewAsAdmin`: pengguna tidak boleh
 * memverifikasi dirinya sendiri, jadi tanpa tombol dev keadaan `verified` dan
 * `rejected` tidak pernah bisa dilihat. Penolakan **wajib beralasan**.
 */
export async function decideAgeVerificationAsDev(
  userId: string,
  decision: 'approve' | 'reject' | 'reset',
  reason = 'Foto KTP buram — nama dan tanggal lahir tidak terbaca.',
): Promise<void> {
  if (decision === 'reset') {
    await db.ageVerifications.delete(userId)
    return
  }
  const row = (await db.ageVerifications.get(userId)) ?? kosong(userId)
  await db.ageVerifications.put({
    ...row,
    status: decision === 'approve' ? 'verified' : 'rejected',
    decidedAt: new Date().toISOString(),
    rejectReason: decision === 'approve' ? null : reason,
  })
}

export const ageHandlers: Pick<
  NovelovaApi,
  'getAgeVerification' | 'submitAgeVerification' | 'setShowAdultContent'
> = {
  async getAgeVerification(): Promise<AgeVerification> {
    return verificationOf(currentUserId())
  },

  /**
   * Mengajukan dokumen. v1 **tidak menyimpan berkasnya** — belum ada penyimpanan
   * berkas — hanya nama dan ukurannya, supaya layar bisa menyebut apa yang
   * diajukan. Pengajuan ulang setelah ditolak diizinkan; saat masih `pending`
   * ditolak, supaya dua dokumen tidak antre untuk satu akun.
   */
  async submitAgeVerification(input: AgeVerificationInput): Promise<AgeVerification> {
    const userId = currentUserId()
    const current = await db.ageVerifications.get(userId)
    if (current?.status === 'pending') {
      throw new ApiError(
        INTERNAL_CODES.CONFLICT,
        'Dokumenmu masih ditinjau. Tunggu keputusannya sebelum mengajukan lagi.',
      )
    }
    if (current?.status === 'verified') {
      throw new ApiError(INTERNAL_CODES.CONFLICT, 'Usiamu sudah terverifikasi.')
    }

    await db.ageVerifications.put({
      userId,
      status: 'pending',
      birthDate: input.birthDate,
      documentName: input.documentName,
      documentSize: input.documentSize,
      submittedAt: new Date().toISOString(),
      decidedAt: null,
      rejectReason: null,
    })
    return verificationOf(userId)
  },

  async setShowAdultContent(on: boolean): Promise<ReaderPrefs> {
    const userId = currentUserId()
    const prefs = { ...(await readerPrefsOf(userId)), showAdultContent: on }
    await db.readerPrefs.put(prefs)
    return prefs
  },
}
