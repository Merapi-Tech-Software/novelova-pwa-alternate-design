/**
 * Konten statis: teks legal, kategori bantuan, FAQ, daftar pilihan bahasa, dan
 * kategori visibilitas.
 *
 * **Ini copy, bukan data pengguna** — karena itu tempatnya di sini, bukan di
 * IndexedDB. Menaruhnya di database berarti menyalin kalimat ke tabel dan
 * menuntut migrasi setiap kali ada typo. Sumbernya `novelova-data.js`
 * (`TERMS`, `DATA_MAP`, `RIGHTS`, `HELP_CATS`, `FAQS`, `LANG_OPTS`, `VIS_CATS`).
 */

/** Empat kategori visibilitas profil publik. FR-PROF-04/10. */
export const VISIBILITY_CATEGORIES = [
  {
    key: 'readingActivity',
    title: 'Aktivitas membaca',
    description: 'Buku dibaca, progres bab, streak, jam baca',
    control: 'Tab Activity di profil publik',
    sensitive: false,
  },
  {
    key: 'library',
    title: 'Perpustakaan dan cerita tersimpan',
    description: 'Rak publik, favorit, cerita selesai',
    control: 'Tab Books di profil publik',
    sensitive: false,
  },
  {
    key: 'reviews',
    title: 'Ulasan dan reaksi',
    description: 'Rating, teks ulasan, reaksi komentar, tag',
    control: 'Entri ulasan di tab Activity',
    sensitive: false,
  },
  {
    key: 'wallet',
    title: 'Data dompet',
    description: 'Data sensitif. Matikan kecuali kamu mengizinkan data publik penuh.',
    control: 'Ringkasan agregat di profil sendiri saja',
    sensitive: true,
  },
] as const

/**
 * Kategori bantuan. Setiap kategori menautkan ke **halaman nyata di aplikasi**,
 * bukan artikel buntu (FR-HELP-01 × FR-CORE-05).
 */
export const HELP_CATEGORIES = [
  { title: 'Cetak cerita', description: 'PDF, hardcopy, verifikasi admin', to: '/karya/cetak' },
  { title: 'Pembayaran', description: 'Top up, refund, riwayat koin', to: '/koin/transaksi' },
  {
    title: 'Keamanan',
    description: 'Kata sandi, perangkat, peringatan masuk',
    to: '/pengaturan/keamanan',
  },
  { title: 'Alat penulis', description: 'Penerbitan, pencairan, insight', to: '/karya' },
] as const

export const FAQS = [
  {
    q: 'Bagaimana melacak pesanan cetak hardcopy?',
    a: 'Buka Profil lalu Cetak cerita. Statusnya melewati enam tahap: Diajukan, Dikonfirmasi, Dibayar, Dicetak, Dikirim, dan Diterima. Nomor resi muncul pada tahap Dikirim.',
  },
  {
    q: 'Kenapa berkas PDF saya belum siap?',
    a: 'Cerita dengan banyak bab butuh waktu lebih lama karena sampul dan daftar isi dibuat ulang tiap permintaan. Berkas tersimpan di riwayat cetak selama 30 hari setelah siap.',
  },
  {
    q: 'Bagaimana menyembunyikan aktivitas membaca saya?',
    a: 'Buka Profil lalu bagian Visibilitas publik, dan matikan Aktivitas membaca. Tab Activity akan hilang sepenuhnya dari profil publikmu, bukan hanya dikosongkan.',
  },
] as const

/**
 * Tujuh tab genre beranda (FR-HOME-03), dan **daftar yang sama** dipakai
 * onboarding (FR-AUTH-11).
 *
 * Ini bukan `GenreSchema`. Genre cerita adalah kosakata penulis saat mengisi
 * formulir cerita; ini kosakata pembaca saat menjelajah — di dalamnya ada
 * "My Kisah" yang tidak pernah jadi genre sebuah cerita. Menyatukan keduanya
 * berarti salah satunya harus berbohong.
 */
export const GENRE_TABS = [
  'Romance',
  'My Kisah',
  'Fantasy',
  'Mystery',
  'Drama',
  'CEO',
  'Thriller',
] as const

/** Tiga langkah pemulihan akun; `/lupa-sandi` menjalankan yang pertama saja. */
export const RESET_STEPS = ['Identifikasi', 'Verifikasi', 'Reset'] as const

/**
 * Pilihan ringkas onboarding langkah 2. Bentuk panjangnya ada di
 * `LANGUAGE_OPTIONS` (halaman pengaturan) — di onboarding cukup dua pilihan
 * bahasa dan tiga wilayah, karena sisanya bisa diubah kapan saja setelahnya.
 */
export const ONBOARDING_LANGUAGES = [
  { label: 'Indonesia', uiLang: 'Bahasa Indonesia' },
  { label: 'English', uiLang: 'English (US)' },
] as const

export const ONBOARDING_REGIONS = [
  { label: 'Indonesia (WIB)', contentRegion: 'Indonesia', timezone: 'Asia/Jakarta' },
  { label: 'Indonesia (WITA)', contentRegion: 'Indonesia', timezone: 'Asia/Makassar' },
  { label: 'Malaysia (MYT)', contentRegion: 'Global', timezone: 'Asia/Kuala_Lumpur' },
] as const

export const LANGUAGE_OPTIONS = {
  app: ['Bahasa Indonesia', 'English (US)', 'English (UK)'],
  translation: [
    'Asli + terjemahan Indonesia',
    'Bahasa asli lebih dulu',
    'Konten terjemahan lebih dulu',
  ],
  region: ['Indonesia', 'Global', 'Amerika Serikat'],
  currency: ['IDR - Rupiah', 'USD - Dollar'],
  timezone: ['Asia/Jakarta', 'UTC', 'America/New_York'],
} as const

/** Lima pasal ketentuan — termasuk pasal kelima yang di prototipe hilang. */
export const TERMS = [
  {
    title: 'Tanggung jawab akun',
    body: 'Satu akun dipakai satu orang. Kamu bertanggung jawab menjaga kata sandi dan kode verifikasi, serta atas seluruh aktivitas yang terjadi lewat akunmu. Beri tahu kami bila melihat aktivitas masuk yang tidak kamu kenali.',
  },
  {
    title: 'Koin dan konten premium',
    body: 'Koin adalah saldo digital untuk membuka fitur berbayar, bab, bundle, dan hadiah. Koin tidak dapat ditukar kembali menjadi uang, tidak dapat dipindahkan antar akun, dan koin bonus dari promosi memiliki masa berlaku yang dinyatakan saat pembelian.',
  },
  {
    title: 'Penerbitan kreator',
    body: 'Penulis wajib mengirimkan karya orisinal dan memegang hak atas seluruh isinya. Karya yang terbit tunduk pada ketentuan tinjauan, pencairan, hak cipta, dan moderasi. Bagi hasil koin mengikuti ketentuan yang berlaku saat bab dibeli.',
  },
  {
    title: 'Keamanan komunitas',
    body: 'Komentar, ulasan, dan profil publik dapat dimoderasi bila melanggar standar keamanan komunitas. Konten yang dilaporkan tetap tampil sampai ditinjau, kecuali mencapai ambang laporan tertentu.',
  },
  {
    title: 'Pengembalian dana dan perselisihan',
    body: 'Pembelian koin dapat diajukan pengembalian dalam 7 hari bila koin belum terpakai dan transaksi tercatat gagal atau ganda. Bab yang sudah dibuka tidak dapat dikembalikan, kecuali bab tersebut ditarik penulisnya sebelum kamu selesai membacanya. Perselisihan yang tidak selesai lewat dukungan diselesaikan menurut hukum yang berlaku di Republik Indonesia.',
  },
] as const

/** Empat kategori data — sama persis dengan yang bisa diekspor pengguna. */
export const DATA_MAP = [
  {
    title: 'Data identitas',
    body: 'Nama, username, avatar, email, nomor HP, penyedia masuk',
  },
  {
    title: 'Aktivitas membaca',
    body: 'Simpanan perpustakaan, progres membaca, penanda, ulasan, komentar, streak',
  },
  {
    title: 'Catatan dompet',
    body: 'Riwayat top-up, saldo koin, riwayat unlock, hadiah, pengembalian dana, kuitansi',
  },
  {
    title: 'Alat penulis',
    body: 'Draf cerita, analitik, identitas pencairan, permintaan cetak, status tinjauan',
  },
] as const

/**
 * Lima hak pengguna, masing-masing dengan alurnya di aplikasi.
 * Kebijakan privasi yang menjanjikan hak tanpa memberi jalannya adalah janji
 * kosong (FR-SET-05, PRD 10 §7 #7).
 */
export const USER_RIGHTS = [
  {
    title: 'Mengatur visibilitas',
    description: 'Empat kategori data di profil publik',
    to: '/profil',
  },
  {
    title: 'Menghapus riwayat membaca',
    description: 'Progres dan Lanjut Baca dikosongkan, cerita tetap tersimpan',
    to: '/pengaturan/keamanan',
  },
  {
    title: 'Meninjau catatan transaksi',
    description: 'Seluruh mutasi koin beserta kuitansinya',
    to: '/koin/transaksi',
  },
  {
    title: 'Mengekspor data',
    description: 'Empat kategori di atas dikirim sebagai satu berkas',
    to: '/pengaturan/keamanan',
  },
  {
    title: 'Mengajukan penghapusan akun',
    description: 'Masa tenggang 30 hari sebelum permanen',
    to: '/pengaturan/keamanan',
  },
] as const
