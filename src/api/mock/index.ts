import type { NovelovaApi } from '../client'
import { withNotImplemented } from '../errors'
import { analyticsHandlers } from './handlers/analytics'
import {
  chapterAccessHandlers,
  chapterDraftHandlers,
  chapterStudioHandlers,
} from './handlers/chapters'
import { earningsHandlers } from './handlers/earnings'
import { homeHandlers } from './handlers/home'
import { libraryHandlers } from './handlers/library'
import { moderationHandlers } from './handlers/moderation'
import { notificationHandlers } from './handlers/notifications'
import { offlineHandlers } from './handlers/offline'
import { onboardingHandlers } from './handlers/onboarding'
import { printHandlers } from './handlers/print'
import { profileHandlers } from './handlers/profile'
import { rewardHandlers } from './handlers/rewards'
import { reviewHandlers, scheduleHandlers } from './handlers/schedule'
import { searchHandlers } from './handlers/search'
import { ensureSeedSession, sessionHandlers } from './handlers/session'
import { socialHandlers } from './handlers/social'
import { storyHandlers } from './handlers/story'
import { studioHandlers } from './handlers/studio'
import { unlockHandlers } from './handlers/unlock'
import { walletHandlers } from './handlers/wallet'
import { seedIfNeeded } from './seed'

/**
 * Implementasi server tiruan.
 *
 * Handler ditulis per fase (`todo.md` Fase 2 dan seterusnya) dan didaftarkan di
 * sini. Yang belum ada melempar `NOT_IMPLEMENTED` dengan nama fungsinya — jauh
 * lebih jelas daripada `undefined is not a function`, dan tidak menuntut puluhan
 * metode kosong hanya supaya berkas ini lolos typecheck.
 *
 * Aturan bisnisnya **sungguhan**: saldo dikurangi secara transaksional, ledger
 * dicatat, kuota iklan dicek per tanggal. Yang palsu hanya *sumber* datanya
 * (Dexie, bukan server) dan *konfirmasi pembayaran* (timer, bukan webhook).
 */

await seedIfNeeded()
await ensureSeedSession()

const handlers: Partial<NovelovaApi> = {
  // Fase 2 → sesi · Fase 3 → discovery · Fase 5 → cerita & bab · Fase 6 → dompet.
  ...sessionHandlers,
  ...onboardingHandlers,
  ...homeHandlers,
  ...searchHandlers,
  ...storyHandlers,
  ...unlockHandlers,
  ...libraryHandlers,
  ...walletHandlers,
  ...studioHandlers,
  ...chapterStudioHandlers,
  ...chapterDraftHandlers,
  ...chapterAccessHandlers,
  ...scheduleHandlers,
  ...reviewHandlers,
  // Fase 8g → analitik cerita & riwayat cetak.
  ...analyticsHandlers,
  ...printHandlers,
  // Fase 9 → penghasilan penulis.
  ...earningsHandlers,
  // Fase 10 → rating & ulasan.
  ...socialHandlers,
  ...moderationHandlers,
  // Fase 11 → notifikasi.
  ...notificationHandlers,
  // Fase 12 → pusat hadiah & voucher.
  ...rewardHandlers,
  // Fase 13 → profil, koneksi, privasi, keamanan.
  ...profileHandlers,
  // Fase 14 → baca offline.
  ...offlineHandlers,
}

export const api = withNotImplemented<NovelovaApi>(handlers, 'mock')
