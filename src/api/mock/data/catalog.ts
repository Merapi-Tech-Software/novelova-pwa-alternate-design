import type { Story } from '../../contracts'

/**
 * **Data contoh katalog — bukan logika.**
 *
 * Dipisah dari `seed.ts` supaya isi dan cara memasukkannya tidak bercampur:
 * `seed.ts` menyusun dan menulis ke Dexie, berkas ini hanya menyimpan apa yang
 * ditulis. Menambah cerita contoh tidak lagi menuntut menyentuh berkas seeding.
 *
 * Delapan judul pertama datang apa adanya dari `novelova-data.js` — dataset yang
 * sama dengan mockup, supaya perbandingan visual jujur. Sisanya pengisi katalog.
 */

/** Penulis katalog — nama dari `STORIES[].a`. */
export const CATALOG_AUTHORS = [
  'Amelia Putri',
  'Rani Kusuma',
  'Soraya Lin',
  'Dian Hastari',
  'Nadia Ardhani',
  'Bening Ayu',
  'Yudha Prasetya',
  'Laras Wangi',
]

export type StorySeed = {
  id: string
  title: string
  authorIdx: number
  genres: Story['genres']
  rating: number
  reads: number
  saves: number
  status: Story['status']
  badge: string
  updatedAt: string
  chapterCount: number
  /** `'+24rb pembaca minggu ini'` — kalimat kanvas; angkanya diambil ulang di bawah. */
  growth: string
  note: string
}

export const CATALOG: StorySeed[] = [
  {
    id: 's1',
    title: 'Cinta di Balik Kontrak',
    authorIdx: 0,
    genres: ['Romance', 'CEO'],
    rating: 4.8,
    reads: 985_000,
    saves: 128_000,
    status: 'ongoing',
    badge: 'HOT',
    updatedAt: '2026-08-24',
    chapterCount: 120,
    growth: '+24rb pembaca minggu ini',
    note: 'Dialog tajam, tempo rapi.',
  },
  {
    id: 's2',
    title: 'Surat dari Bandung',
    authorIdx: 1,
    genres: ['Drama'],
    rating: 4.6,
    reads: 412_000,
    saves: 61_000,
    status: 'ongoing',
    badge: 'BARU',
    updatedAt: '2026-08-25',
    chapterCount: 64,
    growth: '+18rb pembaca minggu ini',
    note: 'Surat-surat yang tak pernah dikirim.',
  },
  {
    id: 's3',
    title: 'Jejak Hujan Semalam',
    authorIdx: 2,
    genres: ['Mystery', 'Romance'],
    rating: 4.7,
    reads: 723_000,
    saves: 88_000,
    status: 'ongoing',
    badge: 'HOT',
    updatedAt: '2026-08-22',
    chapterCount: 96,
    growth: '+12rb pembaca minggu ini',
    note: 'Misteri kecil di kota kecil.',
  },
  {
    id: 's4',
    title: 'Kembang Api Terakhir',
    authorIdx: 3,
    genres: ['Drama', 'Romance'],
    rating: 4.5,
    reads: 268_000,
    saves: 44_000,
    status: 'completed',
    badge: 'TAMAT',
    updatedAt: '2026-07-30',
    chapterCount: 74,
    growth: '+6rb pembaca minggu ini',
    note: 'Penutup yang tidak menghibur, tapi jujur.',
  },
  {
    id: 's5',
    title: 'Rahasia Nyonya Muda',
    authorIdx: 4,
    genres: ['CEO', 'Drama'],
    rating: 4.4,
    reads: 512_000,
    saves: 52_000,
    status: 'ongoing',
    badge: 'NAIK',
    updatedAt: '2026-08-26',
    chapterCount: 110,
    growth: '+31rb pembaca minggu ini',
    note: 'Politik keluarga di ruang rapat.',
  },
  {
    id: 's6',
    title: 'Mata Air Terlarang',
    authorIdx: 5,
    genres: ['Fantasy'],
    rating: 4.9,
    reads: 190_000,
    saves: 39_000,
    status: 'ongoing',
    badge: 'PERMATA',
    updatedAt: '2026-08-21',
    chapterCount: 60,
    growth: '+9rb pembaca minggu ini',
    note: 'Bangunan dunia yang sabar.',
  },
  {
    id: 's7',
    title: 'Jangan Pulang Malam Ini',
    authorIdx: 6,
    genres: ['Thriller', 'Mystery'],
    rating: 4.3,
    reads: 141_000,
    saves: 21_000,
    status: 'hiatus',
    badge: 'BARU',
    updatedAt: '2026-08-12',
    chapterCount: 38,
    growth: '+4rb pembaca minggu ini',
    note: 'Tegang tanpa banyak darah.',
  },
  {
    id: 's8',
    title: 'Kopi, Hujan, dan Kamu',
    authorIdx: 7,
    genres: ['Romance'],
    rating: 4.6,
    reads: 356_000,
    saves: 47_000,
    status: 'ongoing',
    badge: 'HOT',
    updatedAt: '2026-08-25',
    chapterCount: 88,
    growth: '+15rb pembaca minggu ini',
    note: 'Manis, tapi tidak kelewatan.',
  },
]

/**
 * Katalog diperluas jadi 40 cerita.
 *
 * Delapan pertama datang dari `novelova-data.js` dan tidak boleh berubah —
 * itulah yang membuat perbandingan dengan kanvas jujur. Sisanya **pengisi**:
 * beranda menampilkan 20 cerita per section, dan di layar lebar delapan cerita
 * meninggalkan baris yang setengah kosong.
 *
 * Angkanya diturunkan dari indeks, bukan diacak — seed harus menghasilkan urutan
 * yang sama setiap kali dijalankan.
 */
export const FILLER: Array<[title: string, genres: Story['genres']]> = [
  ['Perjanjian Musim Hujan', ['Romance', 'Drama']],
  ['Rahasia Lantai Dua Belas', ['Mystery', 'CEO']],
  ['Nyala di Ujung Koridor', ['Fantasy']],
  ['Kekasih yang Tak Diundang', ['Romance']],
  ['Serpihan Kaca Bulan Juni', ['Drama']],
  ['Kontrak Sunyi', ['Romance', 'CEO']],
  ['Jalan Pulang ke Selasar', ['Drama', 'Romance']],
  ['Malam Tanpa Rembulan', ['Mystery', 'Thriller']],
  ['Bunga Api di Meja Rapat', ['Romance', 'CEO']],
  ['Suara dari Kamar 803', ['Horror', 'Mystery']],
  ['Hujan yang Tak Selesai', ['Romance', 'Drama']],
  ['Kastil Angin Utara', ['Fantasy', 'Romance']],
  ['Detak Kedua', ['Thriller']],
  ['Aroma Kopi Pagi Itu', ['Romance']],
  ['Perempuan di Halte Terakhir', ['Drama', 'Mystery']],
  ['Naga Kecil dari Timur', ['Fantasy']],
  ['Janji yang Tertinggal', ['Romance', 'Drama']],
  ['Sepuluh Menit Sebelum Tengah Malam', ['Thriller', 'Mystery']],
  ['Direktur dan Sekretaris Sementara', ['Romance', 'CEO']],
  ['Perpustakaan yang Menghilang', ['Fantasy', 'Mystery']],
  ['Setelah Musim Kelima', ['Drama']],
  ['Pelukan Terakhir Bulan Desember', ['Romance']],
  ['Kabut di Puncak Ijen', ['Horror']],
  ['Tuan Muda dan Kucing Liarnya', ['Romance', 'CEO']],
  ['Simfoni Tanpa Penonton', ['Drama', 'Romance']],
  ['Bayangan di Balik Cermin', ['Horror', 'Thriller']],
  ['Sepasang Payung Merah', ['Romance']],
  ['Peta Menuju Rumah', ['Fantasy', 'Drama']],
  ['Rapat Terakhir Hari Jumat', ['CEO', 'Thriller']],
  ['Sebelum Kamu Bertanya', ['Romance']],
  ['Lagu Lama di Radio Tua', ['Drama', 'Romance']],
  ['Ekspedisi ke Selatan Angin', ['Fantasy', 'Thriller']],
]

export const FILLER_BADGES = ['HOT', 'BARU', 'NAIK', 'PERMATA', 'TAMAT'] as const

export const FILLER_STATUS: Array<Story['status']> = ['ongoing', 'ongoing', 'completed', 'hiatus']

/**
 * Kosakata tag · Fase 3b.
 *
 * Section kurasi dibangun di atas tag, jadi tag harus **benar-benar berbeda**
 * antar cerita. Sebelumnya keempat puluh cerita contoh bertag identik, dan
 * delapan section kurasi di atasnya akan menampilkan isi yang sama persis.
 */
export const TAGS_BY_GENRE: Record<string, string[]> = {
  Romance: ['kantor', 'musuh jadi cinta', 'cinta pertama', 'slow burn'],
  CEO: ['pernikahan kontrak', 'balas dendam', 'kantor'],
  Mystery: ['kasus tertutup', 'twist'],
  Fantasy: ['dunia lain', 'sihir'],
  Drama: ['keluarga', 'kehilangan'],
  Thriller: ['kejar-kejaran', 'psikologis'],
  Horror: ['rumah angker', 'teror perlahan'],
}

/** Tag khas kisah nyata; genre-nya tetap apa adanya. */
export const KISAH_TAGS = ['tragedi', 'komedi']

/**
 * Satu sinopsis per cerita — **bukan satu sinopsis untuk empat puluh cerita**.
 *
 * Alasannya persis sama dengan kosakata tag di bawah: begitu ada layar yang
 * *menampilkan* teksnya, seed yang seragam berhenti terbaca sebagai data contoh
 * dan mulai terlihat sebagai kerusakan. Kutipan serif di section Editor's Picks
 * (`7a` §7) mengambil **kalimat pertama** tiap sinopsis, jadi tiga kartu
 * bersebelahan akan menampilkan kalimat yang identik kalau daftarnya seragam.
 *
 * Karena itu kalimat pertamanya ditulis supaya berdiri sendiri: satu baris yang
 * tetap masuk akal dibaca tanpa kalimat keduanya.
 */
export const SYNOPSES: string[] = [
  'Kaia datang ke lantai tiga puluh untuk memperpanjang satu kontrak, dan pulang membawa perjanjian yang tidak pernah ia baca sampai habis. Di gedung ini ketenangan adalah satu-satunya mata uang yang dihargai.',
  'Surat itu berkop hotel yang sudah tutup delapan tahun lalu, dan tulisannya jelas tulisan ibunya. Nara berangkat ke Bandung untuk menanyakan satu hal, dan pulang membawa tiga pertanyaan baru.',
  'Hujan berhenti pukul empat, dan sepasang sepatu basah masih berdiri rapi di depan pintu yang tidak pernah dibuka. Tidak ada yang mengaku datang malam itu.',
  'Mereka berjanji menonton kembang api bersama setiap tahun, dan tahun ini hanya satu yang datang. Langit tetap terang seolah tidak ada yang berubah.',
  'Seluruh kota memanggilnya Nyonya Muda, dan tidak seorang pun tahu nama yang tertulis di akta kelahirannya. Ia membiarkannya begitu selama dua belas tahun.',
  'Air di lembah itu menyembuhkan apa saja, asal peminumnya bersedia melupakan satu orang. Warga desa sudah lupa siapa yang mereka tukar.',
  'Pesan itu masuk pukul 23.47 dari nomor yang sudah dihapusnya setahun lalu. Bunyinya cuma empat kata, dan Laras tetap pulang.',
  'Kedai itu hanya ramai saat hujan, dan hanya satu meja yang tidak pernah kosong. Pemiliknya menghafal pesanannya sebelum ia sempat duduk.',
  'Perjanjiannya berlaku sampai musim hujan berakhir, dan tidak ada yang memberi tahu bahwa tahun itu hujannya tidak berhenti-berhenti. Keduanya sudah terlanjur menandatangani.',
  'Lift gedung itu berhenti di lantai sebelas dan tiga belas, tidak pernah dua belas. Karyawan baru diminta tidak bertanya, dan sebagian besar menurut.',
  'Lampu di ujung koridor menyala hanya untuk orang yang sedang dicari seseorang. Malam itu ia menyala untuk Sena.',
  'Ia datang ke pernikahan itu tanpa undangan, duduk di baris paling belakang, dan tidak seorang pun bertanya siapa dia. Pengantin perempuannya tahu persis.',
  'Cermin itu pecah pada bulan Juni, dan sejak itu setiap serpihannya memantulkan ruangan yang berbeda. Ibu menyimpannya di kotak, bukan membuangnya.',
  'Pasal terakhir kontrak itu melarang keduanya bicara di luar jam kerja. Selama sebelas bulan aturan itu dipatuhi dengan sempurna.',
  'Rumah itu masih berdiri, tetapi jalan menuju ke sana sudah berganti nama tiga kali. Bimo pulang dengan alamat yang tidak lagi ada.',
  'Pada malam tanpa rembulan, desa itu mengunci pintu sebelum azan magrib selesai. Tahun ini ada satu pintu yang terbuka.',
  'Rapat itu dijadwalkan empat puluh menit dan berakhir dalam sembilan. Yang tersisa di ruangan cuma dua orang dan satu proposal yang belum dibacakan.',
  'Tamu kamar 803 mengeluhkan suara mengetik sepanjang malam, padahal kamar sebelahnya kosong sejak 2019. Resepsionis mencatatnya sebagai keluhan kesembilan.',
  'Hujan sore itu turun selama empat jam, dan keduanya berteduh di emper yang sama tanpa saling menyapa. Itu pertemuan pertama dari sebelas.',
  'Kastil itu hanya terlihat ketika angin bertiup dari utara, dan hanya oleh orang yang sedang kehilangan sesuatu. Elara melihatnya sejak umur tujuh.',
  'Jantungnya berdetak dua kali untuk setiap satu detak orang lain, dan dokter menyebutnya kebetulan. Yang mengejarnya menyebutnya bukti.',
  'Ia mengenali seseorang dari aroma kopinya, bukan dari wajahnya. Pagi itu aromanya datang dari orang yang salah.',
  'Perempuan itu menunggu bus di halte terakhir setiap sore, dan bus terakhir sudah berhenti beroperasi enam bulan lalu. Tidak ada yang berani memberitahunya.',
  'Naga itu sebesar kucing dan menolak makan apa pun kecuali kata-kata yang belum diucapkan. Yura memberinya satu setiap malam.',
  'Mereka berjanji bertemu lagi di tempat yang sama sepuluh tahun kemudian, dan hanya satu yang mencatat tanggalnya. Tempat itu sudah jadi tempat parkir.',
  'Rekaman CCTV gedung itu utuh sepanjang hari kecuali sepuluh menit sebelum tengah malam. Setiap malam, sepuluh menit yang sama.',
  'Ia dikontrak dua minggu untuk menggantikan sekretaris yang cuti, dan bertahan dua tahun. Tidak ada yang pernah memperbarui kontraknya.',
  'Perpustakaan itu ada di peta kota terbitan 1998 dan tidak di peta mana pun sesudahnya. Kartu anggotanya masih berlaku.',
  'Keluarga itu menghitung waktu dengan musim, bukan tahun, dan musim kelima tidak pernah dibicarakan. Anak bungsunya lahir di musim itu.',
  'Desember itu ia berpamitan di bandara dengan pelukan yang terlalu lama untuk perpisahan biasa. Penerbangannya tidak pernah tercatat berangkat.',
  'Kabut naik pukul dua pagi, dan pemandu melarang siapa pun menghitung jumlah rombongan setelah itu. Malam itu ada yang menghitung.',
  'Kucing liar itu masuk lewat jendela lantai dua puluh, yang tidak pernah dibuka. Tuan muda pemilik ruangan memutuskan tidak bertanya.',
  'Orkestra itu berlatih setiap malam untuk konser yang tanggalnya tidak pernah diumumkan. Kursinya tetap dibersihkan satu per satu.',
  'Bayangannya berkedip setengah detik lebih lambat, dan hanya di cermin kamar mandi. Ia menutup cermin itu dengan handuk selama tiga bulan.',
  'Dua payung merah tertinggal di rak yang sama selama dua musim hujan. Tidak ada yang mengambil, dan tidak ada yang membuang.',
  'Peta itu tidak menunjukkan jalan, melainkan orang-orang yang harus ditemui sebelum sampai. Nama terakhir di daftar adalah namanya sendiri.',
  'Setiap Jumat pukul empat ada rapat yang tidak tercantum di kalender siapa pun. Undangannya datang lewat amplop, bukan surel.',
  'Ia menyiapkan jawaban selama tujuh tahun untuk satu pertanyaan yang tidak pernah diajukan. Sore itu pertanyaannya datang, dengan susunan kata yang salah.',
  'Radio itu hanya menangkap satu siaran, dan siarannya selalu lagu yang sama dari tahun 1974. Penyiarnya menyebut nama pendengarnya.',
  'Tidak ada peta yang menunjukkan selatan angin, dan tujuh ekspedisi sebelumnya tidak pernah kembali untuk menjelaskan kenapa. Yang kedelapan berangkat pekan depan.',
]

/** Sinopsis empat karya milik pengguna. Alasan yang sama dengan `SYNOPSES`. */
export const MY_SYNOPSES: string[] = [
  'Setiap tersangka punya alibi yang sempurna, dan semuanya diberikan oleh orang yang sama. Detektif Rania mulai dari sana, bukan dari mayatnya.',
  'Ada satu musim yang dilewati kota itu setiap tahun, dan tidak seorang pun ingat pernah menjalaninya. Arsip cuaca mencatatnya kosong.',
  'Undangan makan malam itu menyebut delapan nama, dan meja disiapkan untuk sembilan. Nyonya A menolak menjelaskan kursi yang tersisa.',
  'Ia menulis surat setiap minggu selama sebelas tahun dan tidak pernah mengirim satu pun. Anaknya menemukan semuanya dalam satu kardus.',
]
