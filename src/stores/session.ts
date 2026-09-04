import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Session, User } from '@/api/contracts'

/**
 * Sesi · FR-AUTH-12 · architecture.md §7.
 *
 * Tiga tempat, tiga alasan:
 *
 * | Apa | Di mana | Kenapa |
 * |---|---|---|
 * | Token akses | variabel modul, memori | Tidak terbaca skrip pihak ketiga, hilang saat tab ditutup |
 * | Token refresh | cookie `HttpOnly` (disimulasikan di `api/mock`) | Klien tidak pernah menyentuhnya |
 * | Profil ringkas | `localStorage` | Supaya nama dan avatar tidak berkedip kosong selama sesi dihidrasi |
 *
 * Profil di `localStorage` **bukan bukti sesi**. Status baru menjadi
 * `authenticated` setelah `refresh()` berhasil; salinan basi dibuang begitu
 * hidrasi gagal. Ini juga sebabnya `stores/session.ts` tidak melanggar aturan
 * "stores tidak menyimpan apa yang dimiliki pengguna" — yang disimpan di sini
 * hanya cermin untuk render, bukan sumber kebenaran.
 */

let accessToken: string | null = null

/** Dipakai implementasi `api/http` untuk header `Authorization`. */
export function getAccessToken(): string | null {
  return accessToken
}

export type SessionStatus = 'unknown' | 'authenticated' | 'guest'

interface SessionState {
  /** `unknown` sampai hidrasi selesai — guard menunggu, tidak mengusir. */
  status: SessionStatus
  profile: User | null
  /** Kedaluwarsa token akses; dasar penjadwalan pembaruan otomatis. */
  expiresAt: string | null
  /**
   * Identitas terakhir yang dipakai masuk — **bukan kredensial**, hanya apa yang
   * diketik pengguna di kolom pertama. Disimpan supaya lembar masuk ulang tidak
   * menanyakan ulang siapa dia di tengah pekerjaan.
   */
  lastIdentity: string | null
  /**
   * Sesi putus di tengah pemakaian. Lembar masuk ulang, **bukan** redirect:
   * penulis yang sedang mengetik tidak boleh kehilangan naskahnya
   * (FR-AUTH-12 × FR-STUDIO-34).
   */
  reauthOpen: boolean
  setSession: (session: Session, identity?: string) => void
  clearSession: () => void
  requireReauth: () => void
  /** Menutup lembar tanpa masuk — pengguna boleh menyalin tulisannya dulu. */
  dismissReauth: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      status: 'unknown',
      profile: null,
      expiresAt: null,
      lastIdentity: null,
      reauthOpen: false,

      setSession: (session, identity) => {
        accessToken = session.accessToken
        set({
          status: 'authenticated',
          profile: session.user,
          expiresAt: session.expiresAt,
          reauthOpen: false,
          ...(identity ? { lastIdentity: identity } : {}),
        })
      },

      clearSession: () => {
        accessToken = null
        set({ status: 'guest', profile: null, expiresAt: null, reauthOpen: false })
      },

      requireReauth: () => {
        accessToken = null
        set({ reauthOpen: true })
      },

      dismissReauth: () => set({ reauthOpen: false }),
    }),
    {
      name: 'novelova:profile-v1',
      storage: createJSONStorage(() => localStorage),
      // Hanya profil dan identitas terakhir yang ikut. Token tidak pernah
      // menyentuh Web Storage, dan
      // `status` sengaja tidak dipersistensi supaya muat ulang selalu bertanya
      // ke server, bukan mempercayai isi peramban.
      partialize: (state) => ({ profile: state.profile, lastIdentity: state.lastIdentity }),
    },
  ),
)
