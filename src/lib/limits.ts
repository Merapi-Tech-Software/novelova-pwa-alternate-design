/**
 * Batas dan ambang yang datang dari requirement, bukan dari selera.
 * architecture.md §6.3. Angka ekonomi koin ada di `coin.ts`.
 */

// ── daftar & paginasi ────────────────────────────────────────────────────────
/** Seragam di seluruh aplikasi — satu ukuran halaman, bukan enam. */
export const PAGE_SIZE = 20

// ── pencarian · prd_11 ───────────────────────────────────────────────────────
/** Di bawah ini tidak ada permintaan yang dikirim sama sekali. FR-SRCH-02. */
export const SEARCH_MIN_CHARS = 2
export const SEARCH_DEBOUNCE_MS = 300
export const SEARCH_HISTORY_MAX = 10
export const SUGGESTION_MAX = 8

// ── ruang baca · FR-READ-03 ─────────────────────────────────────────────────
/** Ukuran huruf bacaan, dijepit di kedua ujungnya. Di bawah 16 tidak terbaca di
 *  HP; di atas 22 satu baris hanya memuat beberapa kata. */
export const READER_FONT_MIN = 16
export const READER_FONT_MAX = 22
export const READER_FONT_DEFAULT = 18

// ── progres baca · FR-READ-16 ────────────────────────────────────────────────
export const PROGRESS_THROTTLE_MS = 10_000
/** ≥90% dianggap bab selesai. */
export const CHAPTER_DONE_PCT = 0.9

// ── naskah · FR-STUDIO-34 ────────────────────────────────────────────────────
/** Draf lokal: maksimal sekali per 3 detik setelah ketikan berhenti. */
export const AUTOSAVE_LOCAL_MS = 3_000
/** Server: maksimal sekali per 30 detik, plus sekali saat halaman ditinggalkan. */
export const AUTOSAVE_SERVER_MS = 30_000

// ── sosial · prd_12 ──────────────────────────────────────────────────────────
export const REVIEW_MIN_CHARS = 20
export const REVIEW_MAX_CHARS = 1_000
export const REVIEW_TAGS_MAX = 3
export const COMMENT_MAX_CHARS = 500
/** Balasan satu tingkat saja — tanpa utas bercabang. FR-SOCIAL-05. */
export const COMMENT_DEPTH_MAX = 1

// ── notifikasi · prd_11 ──────────────────────────────────────────────────────
export const NOTIF_RETENTION_DAYS = 90
/** Di atasnya lencana ditulis "9+". */
export const UNREAD_BADGE_MAX = 9
/** Jam tenang, waktu lokal pengguna. FR-NOTIF-04. */
export const QUIET_HOURS = { from: 22, to: 7 } as const

// ── akun · FR-SET-05 ─────────────────────────────────────────────────────────
export const DELETE_GRACE_DAYS = 30

// ── keadaan gagal · §1.4 — di luar PRD, dari kanvas seksi 7a ─────────────────
export const TOAST_MS = 4_000
/** Percobaan ke-3 memakai label berbeda ("Coba sekali lagi"). */
export const RETRY_ESCALATE_AT = 2
/** Autosave gagal 4× → tawarkan salin & unduh naskah. */
export const AUTOSAVE_FAIL_ALERT = 4
/** Penyedia tidak menjawab dalam 90 detik → PAY-504. */
export const PAY_CONFIRM_TIMEOUT_S = 90
/** Server-mock merekonsiliasi pesanan menggantung setelah 10 menit. */
export const PAY_RECONCILE_MIN = 10
/**
 * Satu kebijakan kata sandi untuk masuk **dan** daftar.
 *
 * PRD 02 menetapkan 6 karakter di `login` dan 8 di `register`, lalu §7 #1
 * mencatatnya sendiri sebagai cacat: "tetapkan satu kebijakan (disarankan 8
 * karakter)". Angka yang lebih ketat menang — menurunkan kebijakan kata sandi
 * demi konsistensi adalah cara yang salah untuk konsisten.
 */
export const PASSWORD_MIN = 8
/** Onboarding langkah 1 — di luar rentang ini pilihan diabaikan (FR-AUTH-11). */
export const ONBOARDING_GENRES_MIN = 1
export const ONBOARDING_GENRES_MAX = 5
/** Masa berlaku tautan reset kata sandi. Mengikat untuk produksi (FR-AUTH-08). */
export const RESET_LINK_MIN = 15
export const LOGIN_ATTEMPTS_MAX = 5
export const LOGIN_LOCKOUT_MIN = 15
export const SESSION_IDLE_DAYS = 30
/**
 * Umur token akses. **Bukan angka PRD** — pilihan implementasi: cukup pendek
 * supaya token yang bocor tidak berumur panjang, cukup panjang supaya pembaruan
 * otomatis tidak jadi lalu lintas tersendiri.
 */
export const ACCESS_TOKEN_MIN = 15
/** Pembaruan otomatis dijalankan sekian detik sebelum token akses habis. */
export const ACCESS_REFRESH_SKEW_S = 60

// ── formulir cerita · §1.5 — angka dari PRD, bukan dari kanvas ───────────────
export const STORY_TITLE_MAX = 100
export const STORY_SYNOPSIS_MAX = 1_000
export const STORY_SYNOPSIS_MIN = 50
export const COVER_MAX_BYTES = 5 * 1024 * 1024
export const COVER_RATIO = 2 / 3
/** Di luar toleransi cover **disarankan** diganti, bukan ditolak. FR-STUDIO-13. */
export const COVER_RATIO_TOLERANCE = 0.12
export const EXTRA_GENRES_MAX = 2
export const STORY_TAGS_MAX = 10

// ── cetak & jadwal · FR-STUDIO-32/37 · §1.5 ─────────────────────────────────
export const PDF_RETENTION_DAYS = 30
/** Lewat batas → PRINT-504, tawarkan pecah berkas. */
export const PDF_BUILD_TIMEOUT_MIN = 15
/** Syarat kelayakan jilid; menjadi alasan penolakan yang konkret. */
export const PRINT_MIN_CHAPTERS = 10
/** Dua penerbitan cerita yang sama berjarak < 1 jam dianggap bentrok. */
export const SCHEDULE_CLASH_MIN = 60

/**
 * Target kata satu bab, dasar batang progres draf (FR-STUDIO-08).
 *
 * **Perkiraan, dan disebut perkiraan di layar.** Yang tahu sebuah bab selesai
 * hanya penulisnya; angka ini cuma memberi bentuk pada "sudah sejauh mana".
 */
export const CHAPTER_TARGET_WORDS = 1_500
