import type {
  ActivityEntry,
  AdQuota,
  AnalyticsParams,
  AuthorAnalytics,
  AuthorAnalyticsParams,
  AuthorChapter,
  AuthorChapterParams,
  AuthorProfile,
  AuthorSignupInput,
  BundleOffer,
  Chapter,
  ChapterAccessInfo,
  ChapterAccessInput,
  ChapterBoard,
  ChapterDraft,
  ChapterDraftInput,
  ChapterSummary,
  Comment,
  CommentInput,
  CommentParams,
  DeviceSession,
  HomeFeed,
  LibraryEntry,
  LibraryItem,
  LibraryParams,
  LibrarySummary,
  ListParams,
  LocaleSettings,
  LoginInput,
  Notification,
  NotificationPrefs,
  NotifParams,
  Paged,
  PayMethod,
  PayoutAccount,
  PayoutRate,
  PrintOrder,
  PrintOrderInput,
  PrintOrderParams,
  PrivacySettings,
  ProgressInput,
  Rating,
  ReactTarget,
  ReaderPrefs,
  ReaderStats,
  ReadingProgress,
  RedeemResult,
  RegisterInput,
  ReportInput,
  ResetRequest,
  Review,
  ReviewInput,
  ReviewPage,
  ReviewParams,
  ReviewQueueItem,
  ReviewTarget,
  Reward,
  ScheduleChapterInput,
  ScheduleEntry,
  ScheduleStoryInput,
  SearchParams,
  SearchResult,
  SectionId,
  SectionParams,
  Session,
  Story,
  StoryAnalytics,
  StoryDetail,
  StoryForm,
  StudioParams,
  StudioStory,
  StudioSummary,
  Suggestion,
  TopupInput,
  TopupOrder,
  Transaction,
  TransactionDetail,
  TxListParams,
  UnlockInput,
  UnlockOption,
  UnlockResult,
  UserRowData,
  Voucher,
  Wallet,
  Withdrawal,
  WithdrawInput,
} from './contracts'

/**
 * **Satu-satunya permukaan data aplikasi** (architecture.md §5).
 *
 * Aturan yang membuat janji "ganti backend = tukar satu folder" benar:
 * kontrak ini tidak pernah menyebut Dexie, tabel, atau `fetch`. Ia hanya bicara
 * domain. Komponen tidak pernah memanggilnya langsung — hanya folder `hooks/`
 * di dalam tiap feature yang boleh.
 */
export interface NovelovaApi {
  // ── sesi · FR-AUTH-12 ─────────────────────────────────────────────────────
  login(input: LoginInput): Promise<Session>
  /** Sukses langsung membuat sesi — pengguna baru tidak disuruh masuk lagi. */
  register(input: RegisterInput): Promise<Session>
  /**
   * **Tidak pernah menolak**, apa pun identitasnya (FR-AUTH-08). Menjawab
   * "email itu tidak terdaftar" berarti memberi tahu siapa pun akun mana yang
   * ada — dan pengguna yang salah ketik tetap tidak tertolong.
   */
  requestReset(identity: string): Promise<ResetRequest>
  /** Memakai cookie `HttpOnly`; tidak menerima token sebagai argumen. */
  refresh(): Promise<Session>
  logout(): Promise<void>
  listDeviceSessions(): Promise<DeviceSession[]>
  revokeDeviceSession(sessionId: string | 'all-others'): Promise<void>

  // ── onboarding · FR-AUTH-11 ───────────────────────────────────────────────
  getReaderPrefs(): Promise<ReaderPrefs>
  /** Menyelesaikan **dan** melewati sama-sama memanggil ini; `[]` berarti dilewati. */
  finishOnboarding(genres: string[]): Promise<ReaderPrefs>
  /** Tiga cerita pembuka berdasarkan genre terpilih. */
  getStarterPicks(genres: string[]): Promise<Story[]>

  // ── discovery · prd_03 ────────────────────────────────────────────────────
  /** `tab` adalah tab beranda, **bukan selalu genre** — "My Kisah" menyaring `Story.kind`. */
  getHomeFeed(tab?: string): Promise<HomeFeed>
  getSection(id: SectionId, params: SectionParams): Promise<Paged<Story>>

  // ── pencarian · prd_11 ────────────────────────────────────────────────────
  search(q: string, params: SearchParams): Promise<SearchResult>
  /** Maksimal 8 (`SUGGESTION_MAX`). */
  getSuggestions(q: string): Promise<Suggestion[]>
  getTrendingQueries(): Promise<string[]>

  // ── cerita & bab · prd_04 · prd_05 ───────────────────────────────────────
  getStory(storyId: string): Promise<StoryDetail>
  getChapters(storyId: string, params: ListParams): Promise<Paged<ChapterSummary>>
  getChapter(storyId: string, chapterId: string): Promise<Chapter>
  /** Idempoten — dua panggilan dengan kunci sama memotong saldo sekali. */
  /** Tiga pilihan berbayar beserta angkanya, dihitung server (FR-READ-07). */
  getUnlockOptions(chapterId: string): Promise<UnlockOption[]>
  unlockChapter(input: UnlockInput): Promise<UnlockResult>
  redeemVoucher(code: string): Promise<Voucher>
  applyVoucher(voucherId: string, storyId: string): Promise<RedeemResult>
  /** Di-throttle 10 detik oleh pemanggil (`PROGRESS_THROTTLE_MS`). */
  saveProgress(input: ProgressInput): Promise<void>
  getProgress(storyId: string): Promise<ReadingProgress | null>

  // ── perpustakaan · prd_06 ─────────────────────────────────────────────────
  listLibrary(params: ListParams): Promise<Paged<Story>>
  /** Optimistis: berubah seketika, dikembalikan **disertai pesan** bila gagal. */
  toggleLibrary(storyId: string): Promise<LibraryEntry>
  /** Progres seluruh cerita yang pernah dibaca — satu permintaan, bukan per kartu. */
  listProgress(): Promise<ReadingProgress[]>
  /** Menyembunyikan cerita dari rekomendasi pembaca ini (FR-HOME-14). */
  hideStory(storyId: string): Promise<void>

  /**
   * Tiga angka kepala profil · `7i`. **Diturunkan**, bukan penghitung tersimpan.
   */
  getReaderStats(): Promise<ReaderStats>

  /**
   * Izin buka-otomatis **per cerita** · FR-READ-09 · `architecture.md` §1.19.
   *
   * Di seam, bukan di `stores/`: ia memberi wewenang memotong koin, dan izin
   * seperti itu harus ikut saat pengguna berganti perangkat (aturan struktur #5).
   */
  setAutoUnlock(storyId: string, on: boolean): Promise<void>
  /**
   * Tawaran bundel setelah sepuluh bab dibuka otomatis · FR-READ-19 · §1.21.
   * `null` bila belum waktunya — **server yang memutuskan**, bukan layar.
   */
  getBundleOffer(storyId: string, chapterId: string): Promise<BundleOffer | null>
  /** Ditolak berarti tidak muncul lagi di cerita itu · FR-READ-19. */
  dismissBundleOffer(storyId: string): Promise<void>
  toggleFollow(storyId: string): Promise<LibraryEntry>
  /**
   * Perpustakaan · FR-LIB-11.
   *
   * Cerita **beserta progresnya**, disaring, dicari, diurutkan, dan dipotong di
   * server. `listLibrary` yang lama tetap ada untuk yang hanya perlu id-nya.
   */
  getLibrary(params: LibraryParams): Promise<Paged<LibraryItem>>
  /** Empat metrik agregat — sengaja tidak ikut saringan (FR-LIB-01). */
  getLibrarySummary(): Promise<LibrarySummary>
  /** Sakelar notifikasi bab baru per cerita · FR-LIB-08. */
  toggleNotify(storyId: string): Promise<LibraryEntry>
  /** Hapus dari koleksi · FR-LIB-09. Tombstone, bukan penghapusan baris. */
  removeFromLibrary(storyId: string): Promise<void>
  /** Urungkan penghapusan — **tanggal simpan aslinya utuh** (FR-LIB-09). */
  undoRemove(storyId: string): Promise<LibraryEntry>

  // ── dompet · prd_09 ───────────────────────────────────────────────────────
  /** Satu-satunya sumber saldo di seluruh aplikasi (FR-WALLET-17). */
  getWallet(): Promise<Wallet>
  listPayMethods(): Promise<PayMethod[]>
  createTopupOrder(input: TopupInput): Promise<TopupOrder>
  getTopupOrder(orderId: string): Promise<TopupOrder>
  /**
   * "Cek status" / "Saya sudah transfer" · FR-WALLET-06/08.
   *
   * **Satu-satunya tempat koin bertambah.** Bertanya ke penyedia, lalu
   * menyelesaikan pesanan secara transaksional bila jawabannya `paid`. Aman
   * dipanggil berkali-kali: pesanan yang sudah lunas dikembalikan apa adanya.
   */
  confirmTopupOrder(orderId: string): Promise<TopupOrder>
  /**
   * Membatalkan pesanan yang sedang berjalan · FR-WALLET-12.
   *
   * Pesanan yang dibatalkan **tidak bisa dilunasi lagi** — tanpa ini, menekan
   * "Saya sudah transfer" setelah membatalkan tetap akan mencetak koin.
   */
  cancelTopupOrder(orderId: string): Promise<TopupOrder>
  listTransactions(params: TxListParams): Promise<Paged<Transaction>>
  getTransaction(txId: string): Promise<TransactionDetail>
  getAdQuota(): Promise<AdQuota>

  // ── sosial · prd_12 ───────────────────────────────────────────────────────
  /**
   * Beri atau ubah rating · FR-SOCIAL-01.
   *
   * Menuntut pembaca **sudah membaca minimal satu bab**. Penolakannya berupa
   * ajakan membaca, bukan diam — rating dari orang yang belum membuka satu bab
   * pun tidak mengukur apa pun.
   */
  rateStory(storyId: string, stars: 1 | 2 | 3 | 4 | 5): Promise<Rating>
  /** Rating pengguna saat ini, atau `null`. `[LUAR]` */
  getMyRating(storyId: string): Promise<Rating | null>
  /**
   * Hapus rating · FR-SOCIAL-01. `[LUAR]`
   *
   * Terpisah dari `deleteReview`: menghapus ulasan **tidak** menghapus
   * ratingnya, dan sebaliknya menghapus rating ikut menghapus ulasannya —
   * ulasan tanpa bintang tidak sah (FR-SOCIAL-02).
   */
  deleteRating(storyId: string): Promise<void>
  submitReview(input: ReviewInput): Promise<Review>
  deleteReview(storyId: string): Promise<void>
  /** Halaman ulasan · FR-SOCIAL-03. Saringan dan urutan dijalankan **server**. */
  listReviews(storyId: string, params: ReviewParams): Promise<ReviewPage>
  /**
   * Utas komentar satu bab · FR-SOCIAL-05.
   *
   * **Bab terkunci menolak keduanya** — membaca maupun menulis. Komentar bab
   * penuh berisi isi babnya, jadi membukanya untuk yang belum membeli sama
   * dengan membocorkan cerita lewat pintu samping.
   */
  listComments(chapterId: string, params: CommentParams): Promise<Paged<Comment>>
  postComment(input: CommentInput): Promise<Comment>
  /**
   * Tanggapan penulis atas satu ulasan · FR-SOCIAL-04. `[LUAR]`
   *
   * Hanya pemilik cerita, dan **satu per ulasan** — menanggapi lagi menyunting
   * yang lama.
   */
  replyToReview(reviewId: string, text: string): Promise<Review>
  react(target: ReactTarget, on: boolean): Promise<void>
  /**
   * Laporkan cerita, ulasan, atau komentar · FR-SOCIAL-07.
   *
   * **Satu laporan per pasangan (pelapor, objek).** Pelapor mendapat konfirmasi
   * diterima dan tidak pernah dapat kabar hasilnya — kabar hasil akan berubah
   * jadi kanal balas dendam antar pengguna.
   */
  report(input: ReportInput): Promise<void>
  /** Benar bila pengguna ini sudah pernah melaporkan objek itu. `[LUAR]` */
  hasReported(targetType: ReportInput['targetType'], targetId: string): Promise<boolean>
  /**
   * Blokir pengguna · FR-SOCIAL-07. `[LUAR]`
   *
   * Menyembunyikan komentar dan ulasannya **dari tampilan pemblokir saja** —
   * bukan menghapus, dan tidak memengaruhi apa yang dilihat orang lain.
   */
  blockUser(userId: string, on: boolean): Promise<void>
  listBlocks(): Promise<string[]>
  /**
   * Feed aktivitas · FR-SOCIAL-08. `[LUAR]`
   *
   * Diturunkan dari ulasan. `respectPrivacy` benar saat feed dibaca **orang
   * lain**: sakelar "Ulasan dan reaksi" yang mati menyembunyikannya dari profil
   * publik, tetapi ulasannya tetap tampil di halaman ulasan cerita — dua hal
   * berbeda (FR-PROF-10).
   */
  listActivity(userId: string, respectPrivacy: boolean): Promise<ActivityEntry[]>

  // ── notifikasi · prd_11 ───────────────────────────────────────────────────
  listNotifications(params: NotifParams): Promise<Paged<Notification>>
  getUnreadCount(): Promise<number>
  markRead(ids: string[] | 'all'): Promise<void>
  getNotificationPrefs(): Promise<NotificationPrefs>
  setNotificationPrefs(prefs: NotificationPrefs): Promise<void>

  // ── studio · prd_07 ───────────────────────────────────────────────────────
  getAuthorProfile(): Promise<AuthorProfile>
  /** Mendaftar sebagai penulis · FR-STUDIO-33. */
  registerAuthor(input: AuthorSignupInput): Promise<AuthorProfile>
  /** Karya penulis, disaring dan diurutkan di server · FR-STUDIO-03. */
  getMyStories(params: StudioParams): Promise<Paged<StudioStory>>
  /** Empat metrik agregat — sengaja tidak ikut saringan (FR-STUDIO-01). */
  getStudioSummary(): Promise<StudioSummary>
  createStory(form: StoryForm): Promise<Story>
  updateStory(storyId: string, form: StoryForm): Promise<Story>
  deleteStory(storyId: string): Promise<void>
  /** Menjadwalkan **cerita utuh**, bukan bab tertentu · FR-STUDIO-04. */
  scheduleStory(input: ScheduleStoryInput): Promise<StudioStory>
  /** Pesanan cetak softcopy/hardcopy · FR-STUDIO-05. */
  createPrintOrder(input: PrintOrderInput): Promise<PrintOrder>

  // ── kelola bab · prd_07 B ────────────────────────────────────────────
  /** Daftar bab bagi penulisnya — status, metrik, dan progres draf. */
  getChaptersForAuthor(storyId: string, params: AuthorChapterParams): Promise<Paged<AuthorChapter>>
  /** Tiga penghitung + pemberitahuan tindak lanjut · FR-STUDIO-07. */
  getChapterBoard(storyId: string): Promise<ChapterBoard>
  /** Terbitkan sekarang — juga jalan "Tampilkan" bagi bab privat. */
  publishChapter(chapterId: string): Promise<AuthorChapter>
  scheduleChapter(input: ScheduleChapterInput): Promise<AuthorChapter>
  /** Batalkan jadwal — babnya kembali menjadi draf, bukan hilang. */
  unscheduleChapter(chapterId: string): Promise<AuthorChapter>
  deleteChapter(chapterId: string): Promise<void>
  /** Naskah bab untuk editor — kedua bahasa beserta catatan penulisnya. */
  getChapterDraft(chapterId: string): Promise<ChapterDraft>
  /**
   * Autosave lapis server · FR-STUDIO-34.
   *
   * `chapterId` `null` berarti bab baru: server membuatkan barisnya lalu
   * mengembalikan id-nya, jadi editor tidak perlu membuat bab kosong lebih dulu
   * hanya supaya punya sesuatu untuk disimpan.
   */
  saveChapterDraft(input: ChapterDraftInput): Promise<ChapterDraft>
  /** Keadaan akses satu bab beserta konteksnya · FR-STUDIO-36. */
  getChapterAccess(chapterId: string): Promise<ChapterAccessInfo>
  /**
   * Mengubah akses bab · FR-STUDIO-23..26.
   *
   * Empat aturan ditegakkan **di sini**, bukan hanya di layar: bab pertama tidak
   * bisa diprivatkan, bab berbayar menuntut penulis terverifikasi, harga dijepit
   * 1–50, dan bab yang baru digratiskan ditahan tujuh hari.
   */
  setChapterAccess(input: ChapterAccessInput): Promise<ChapterAccessInfo>
  /**
   * Analitik satu cerita · FR-STUDIO-27..31.
   *
   * Rentang waktu **menyaring di server**, bukan di layar: kalau tidak, memilih
   * "3 bulan" hanya mengganti label di atas angka yang tidak berubah. Urutan
   * performa bab juga di sini (PRD 07 §7 #9 — di prototipe kontrolnya mati).
   */
  getStoryAnalytics(storyId: string, params: AnalyticsParams): Promise<StoryAnalytics>
  /** Riwayat cetak dengan empat tab yang **disaring server** · FR-STUDIO-32. */
  listPrintOrders(params: PrintOrderParams): Promise<Paged<PrintOrder>>
  /**
   * Batalkan pesanan · `PRINT-409`.
   *
   * Dibatasi tahap: boleh sebelum produksi (tanpa biaya), ditolak sesudahnya —
   * dan penolakannya **menjelaskan alasannya**, bukan tombol yang dimatikan
   * diam-diam. Ini pula jalan menolak biaya baru (`PRINT-402`): pesanan yang
   * biayanya berubah belum masuk produksi, jadi membatalkannya tidak menagih
   * apa pun. Satu aturan, bukan dua.
   */
  cancelPrintOrder(orderId: string): Promise<PrintOrder>
  /** Setujui biaya baru — produksi berjalan lagi dari tahap yang sama. */
  approvePrintCost(orderId: string): Promise<PrintOrder>
  /**
   * Buat ulang berkas softcopy · `PRINT-504` / `PRINT-410`. `[LUAR]`
   *
   * `parts` > 1 memecah naskah jadi beberapa berkas supaya tidak melewati batas
   * waktu pemrosesan. Rentang babnya dihitung **server** — klien tidak tahu
   * berapa bab yang aktif, dan menebaknya akan menghasilkan berkas bolong.
   */
  regeneratePrintFile(orderId: string, parts: number): Promise<PrintOrder[]>
  /**
   * Jadwal terbit terpadu · FR-STUDIO-37.
   *
   * Bentrok dan celah **dihitung di sini**, bukan disimpan: keduanya adalah
   * hubungan antar entri, dan keadaan yang disimpan akan basi begitu satu entri
   * digeser.
   */
  listSchedule(): Promise<ScheduleEntry[]>
  /** Membatalkan satu entri jadwal — cerita maupun bab · FR-STUDIO-37. */
  cancelScheduleEntry(entryId: string): Promise<void>
  /** Antrean tinjauan, diturunkan dari empat sumbernya · FR-STUDIO-38. */
  listReviewQueue(): Promise<ReviewQueueItem[]>
  /** Mengirim cerita atau bab untuk ditinjau · FR-STUDIO-38. */
  submitForReview(target: ReviewTarget): Promise<ReviewQueueItem>
  /** Membatalkan pengiriman — kembali ke draf, bukan hilang · FR-STUDIO-38. */
  withdrawFromReview(target: ReviewTarget): Promise<void>

  // ── penghasilan · prd_08 ──────────────────────────────────────────────────
  /**
   * Analitik penulis · FR-EARN-01..05.
   *
   * Rentang **dan** sudut pandang menyaring di server. Di prototipe pemilih
   * sudut pandang hanya mengganti gaya aktif, sehingga dua dari tiga sudut
   * pandang tidak pernah terlihat (PRD 08 §7 #4).
   */
  getAuthorAnalytics(params: AuthorAnalyticsParams): Promise<AuthorAnalytics>
  /** Saldo tersedia **sudah dikurangi** pengajuan yang masih diproses. */
  getPayoutBalance(): Promise<{ available: number; pending: number }>
  requestWithdrawal(input: WithdrawInput): Promise<Withdrawal>
  listWithdrawals(params: ListParams): Promise<Paged<Withdrawal>>
  /**
   * Konversi koin → rupiah · FR-EARN-12. `[LUAR]`
   *
   * Kurs, bagi hasil, dan **contoh perhitungan** datang dari server, bukan
   * dihitung layar: rantai "pembaca membayar → potongan platform → koin penulis
   * → rupiah" adalah kebijakan, dan kebijakan yang dihitung ulang di klien akan
   * berselisih dengan yang benar-benar dibayarkan.
   */
  getPayoutRate(): Promise<PayoutRate>
  /**
   * Rekening tujuan beserta status verifikasinya · FR-EARN-07. `[LUAR]`
   *
   * Nomornya sudah tersamar saat meninggalkan server. Membawa `payoutVerified`
   * dan `twoFactor` sekalian, karena keduanya tingkat 4 dan 5 tangga validasi.
   */
  getPayoutAccount(): Promise<PayoutAccount>

  // ── hadiah · prd_09 E ─────────────────────────────────────────────────────
  getRewards(): Promise<Reward>
  claimCheckIn(): Promise<Reward>
  listVouchers(): Promise<Voucher[]>

  // ── profil & pengaturan · prd_10 ──────────────────────────────────────────
  listConnections(kind: 'followers' | 'following', params: ListParams): Promise<Paged<UserRowData>>
  toggleFollowUser(userId: string): Promise<{ following: boolean }>
  getPrivacySettings(): Promise<PrivacySettings>
  setPrivacySettings(settings: PrivacySettings): Promise<PrivacySettings>
  getLocaleSettings(): Promise<LocaleSettings>
  setLocaleSettings(settings: LocaleSettings): Promise<LocaleSettings>
  requestDataExport(categories: string[]): Promise<{ id: string }>
  requestAccountDeletion(): Promise<{ purgeAt: string }>
}

/**
 * Implementasi dipilih saat modul dimuat, sekali.
 *
 * `import()` dinamis membuat implementasi yang tidak dipakai tidak ikut ke dalam
 * bundel — build produksi mode `mock` tidak membawa kode `http`, dan sebaliknya.
 */
const mode = import.meta.env.VITE_API_MODE ?? 'mock'

const impl = mode === 'http' ? await import('./http') : await import('./mock')

export const api: NovelovaApi = impl.api

export const apiMode = mode
