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
  /** Diisi pengisi katalog; delapan cerita kanvas memakai `SYNOPSES`. */
  synopsis?: string
  /** Diisi pengisi katalog; lihat `FillerSeed`. */
  free?: boolean
  kisah?: boolean
  tags?: string[]
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
export type FillerSeed = {
  title: string
  genres: Story['genres']
  status: Story['status']
  /** Masuk section "Gratis Hari Ini". Tanpa kolom ini ia turunan indeks. */
  free?: boolean
  /** `kind: 'kisah'` — ikut tab "My Kisah", yang menyaring `kind`, bukan genre. */
  kisah?: boolean
  /** Section kurasi dibangun di atas tag, jadi tag ditulis, bukan diturunkan. */
  tags: string[]
  synopsis: string
}

/**
 * Katalog contoh · **atributnya ditulis, bukan diturunkan dari indeks**.
 *
 * Sampai Langkah 55, `status`, `monetizeType`, dan tag tiap cerita di sini
 * dihitung dari posisinya di dalam larik — `i % 5 === 3` untuk gratis,
 * `FILLER_STATUS[i % 4]` untuk status, `pool[i % pool.length]` untuk tag. Itu
 * berhenti sanggup begitu beranda berubah jadi rel mendatar (`architecture.md`
 * §1.22): isi sebuah section hanya bisa diatur dengan menghitung mundur posisi
 * tiap judul, dan satu judul yang disisipkan di tengah menggeser atribut semua
 * yang sesudahnya.
 *
 * **Aturannya sekarang: tiap section di bawah tab beranda berisi ≥ 6 cerita**,
 * dan yang menjaganya `scripts/cek-beranda.mjs`, bukan hitungan tangan. Section
 * berisi tiga cerita tidak kelihatan salah sebagai daftar tegak; sebagai rel
 * mendatar 80px ia menyisakan ruang kosong yang terbaca sebagai gagal memuat.
 *
 * Sinopsis ikut di sini, bukan di larik `SYNOPSES` terpisah yang dipasangkan
 * menurut urutan — pasangan yang bergantung pada urutan akan meleset seluruhnya
 * pada judul pertama yang disisipkan di tengah.
 */
export const FILLER: FillerSeed[] = [
  {
    title: 'Perjanjian Musim Hujan',
    genres: ['Romance', 'Drama'],
    status: 'ongoing',
    free: true,
    tags: ['kantor', 'keluarga'],
    synopsis:
      'Perjanjiannya berlaku sampai musim hujan berakhir, dan tidak ada yang memberi tahu bahwa tahun itu hujannya tidak berhenti-berhenti. Keduanya sudah terlanjur menandatangani.',
  },
  {
    title: 'Rahasia Lantai Dua Belas',
    genres: ['Mystery', 'CEO'],
    status: 'ongoing',
    kisah: true,
    tags: ['twist', 'pernikahan kontrak', 'tragedi'],
    synopsis:
      'Lift gedung itu berhenti di lantai sebelas dan tiga belas, tidak pernah dua belas. Karyawan baru diminta tidak bertanya, dan sebagian besar menurut.',
  },
  {
    title: 'Nyala di Ujung Koridor',
    genres: ['Fantasy'],
    status: 'completed',
    tags: ['dunia lain'],
    synopsis:
      'Lampu di ujung koridor menyala hanya untuk orang yang sedang dicari seseorang. Malam itu ia menyala untuk Sena.',
  },
  {
    title: 'Kekasih yang Tak Diundang',
    genres: ['Romance'],
    status: 'hiatus',
    tags: ['slow burn'],
    synopsis:
      'Ia datang ke pernikahan itu tanpa undangan, duduk di baris paling belakang, dan tidak seorang pun bertanya siapa dia. Pengantin perempuannya tahu persis.',
  },
  {
    title: 'Serpihan Kaca Bulan Juni',
    genres: ['Drama'],
    status: 'ongoing',
    tags: ['keluarga'],
    synopsis:
      'Cermin itu pecah pada bulan Juni, dan sejak itu setiap serpihannya memantulkan ruangan yang berbeda. Ibu menyimpannya di kotak, bukan membuangnya.',
  },
  {
    title: 'Kontrak Sunyi',
    genres: ['Romance', 'CEO'],
    status: 'ongoing',
    free: true,
    kisah: true,
    tags: ['musuh jadi cinta', 'balas dendam', 'komedi'],
    synopsis:
      'Pasal terakhir kontrak itu melarang keduanya bicara di luar jam kerja. Selama sebelas bulan aturan itu dipatuhi dengan sempurna.',
  },
  {
    title: 'Jalan Pulang ke Selasar',
    genres: ['Drama', 'Romance'],
    status: 'completed',
    tags: ['keluarga', 'cinta pertama'],
    synopsis:
      'Rumah itu masih berdiri, tetapi jalan menuju ke sana sudah berganti nama tiga kali. Bimo pulang dengan alamat yang tidak lagi ada.',
  },
  {
    title: 'Malam Tanpa Rembulan',
    genres: ['Mystery', 'Thriller'],
    status: 'hiatus',
    tags: ['twist', 'psikologis'],
    synopsis:
      'Pada malam tanpa rembulan, desa itu mengunci pintu sebelum azan magrib selesai. Tahun ini ada satu pintu yang terbuka.',
  },
  {
    title: 'Bunga Api di Meja Rapat',
    genres: ['Romance', 'CEO'],
    status: 'ongoing',
    tags: ['kantor', 'balas dendam'],
    synopsis:
      'Rapat itu dijadwalkan empat puluh menit dan berakhir dalam sembilan. Yang tersisa di ruangan cuma dua orang dan satu proposal yang belum dibacakan.',
  },
  {
    title: 'Suara dari Kamar 803',
    genres: ['Horror', 'Mystery'],
    status: 'ongoing',
    kisah: true,
    tags: ['teror perlahan', 'twist', 'tragedi'],
    synopsis:
      'Tamu kamar 803 mengeluhkan suara mengetik sepanjang malam, padahal kamar sebelahnya kosong sejak 2019. Resepsionis mencatatnya sebagai keluhan kesembilan.',
  },
  {
    title: 'Hujan yang Tak Selesai',
    genres: ['Romance', 'Drama'],
    status: 'completed',
    free: true,
    tags: ['cinta pertama', 'keluarga'],
    synopsis:
      'Hujan sore itu turun selama empat jam, dan keduanya berteduh di emper yang sama tanpa saling menyapa. Itu pertemuan pertama dari sebelas.',
  },
  {
    title: 'Kastil Angin Utara',
    genres: ['Fantasy', 'Romance'],
    status: 'hiatus',
    tags: ['sihir', 'slow burn'],
    synopsis:
      'Kastil itu hanya terlihat ketika angin bertiup dari utara, dan hanya oleh orang yang sedang kehilangan sesuatu. Elara melihatnya sejak umur tujuh.',
  },
  {
    title: 'Detak Kedua',
    genres: ['Thriller'],
    status: 'ongoing',
    tags: ['kejar-kejaran'],
    synopsis:
      'Jantungnya berdetak dua kali untuk setiap satu detak orang lain, dan dokter menyebutnya kebetulan. Yang mengejarnya menyebutnya bukti.',
  },
  {
    title: 'Aroma Kopi Pagi Itu',
    genres: ['Romance'],
    status: 'ongoing',
    kisah: true,
    tags: ['musuh jadi cinta', 'komedi'],
    synopsis:
      'Ia mengenali seseorang dari aroma kopinya, bukan dari wajahnya. Pagi itu aromanya datang dari orang yang salah.',
  },
  {
    title: 'Perempuan di Halte Terakhir',
    genres: ['Drama', 'Mystery'],
    status: 'completed',
    tags: ['keluarga', 'kasus tertutup'],
    synopsis:
      'Perempuan itu menunggu bus di halte terakhir setiap sore, dan bus terakhir sudah berhenti beroperasi enam bulan lalu. Tidak ada yang berani memberitahunya.',
  },
  {
    title: 'Naga Kecil dari Timur',
    genres: ['Fantasy'],
    status: 'hiatus',
    free: true,
    tags: ['sihir'],
    synopsis:
      'Naga itu sebesar kucing dan menolak makan apa pun kecuali kata-kata yang belum diucapkan. Yura memberinya satu setiap malam.',
  },
  {
    title: 'Janji yang Tertinggal',
    genres: ['Romance', 'Drama'],
    status: 'ongoing',
    tags: ['kantor', 'keluarga'],
    synopsis:
      'Mereka berjanji bertemu lagi di tempat yang sama sepuluh tahun kemudian, dan hanya satu yang mencatat tanggalnya. Tempat itu sudah jadi tempat parkir.',
  },
  {
    title: 'Sepuluh Menit Sebelum Tengah Malam',
    genres: ['Thriller', 'Mystery'],
    status: 'ongoing',
    kisah: true,
    tags: ['psikologis', 'twist', 'tragedi'],
    synopsis:
      'Rekaman CCTV gedung itu utuh sepanjang hari kecuali sepuluh menit sebelum tengah malam. Setiap malam, sepuluh menit yang sama.',
  },
  {
    title: 'Direktur dan Sekretaris Sementara',
    genres: ['Romance', 'CEO'],
    status: 'completed',
    tags: ['cinta pertama', 'kantor'],
    synopsis:
      'Ia dikontrak dua minggu untuk menggantikan sekretaris yang cuti, dan bertahan dua tahun. Tidak ada yang pernah memperbarui kontraknya.',
  },
  {
    title: 'Perpustakaan yang Menghilang',
    genres: ['Fantasy', 'Mystery'],
    status: 'hiatus',
    tags: ['sihir', 'twist'],
    synopsis:
      'Perpustakaan itu ada di peta kota terbitan 1998 dan tidak di peta mana pun sesudahnya. Kartu anggotanya masih berlaku.',
  },
  {
    title: 'Setelah Musim Kelima',
    genres: ['Drama'],
    status: 'ongoing',
    free: true,
    tags: ['keluarga'],
    synopsis:
      'Keluarga itu menghitung waktu dengan musim, bukan tahun, dan musim kelima tidak pernah dibicarakan. Anak bungsunya lahir di musim itu.',
  },
  {
    title: 'Pelukan Terakhir Bulan Desember',
    genres: ['Romance'],
    status: 'ongoing',
    kisah: true,
    tags: ['musuh jadi cinta', 'komedi'],
    synopsis:
      'Desember itu ia berpamitan di bandara dengan pelukan yang terlalu lama untuk perpisahan biasa. Penerbangannya tidak pernah tercatat berangkat.',
  },
  {
    title: 'Kabut di Puncak Ijen',
    genres: ['Horror'],
    status: 'completed',
    tags: ['rumah angker'],
    synopsis:
      'Kabut naik pukul dua pagi, dan pemandu melarang siapa pun menghitung jumlah rombongan setelah itu. Malam itu ada yang menghitung.',
  },
  {
    title: 'Tuan Muda dan Kucing Liarnya',
    genres: ['Romance', 'CEO'],
    status: 'hiatus',
    tags: ['slow burn', 'balas dendam'],
    synopsis:
      'Kucing liar itu masuk lewat jendela lantai dua puluh, yang tidak pernah dibuka. Tuan muda pemilik ruangan memutuskan tidak bertanya.',
  },
  {
    title: 'Simfoni Tanpa Penonton',
    genres: ['Drama', 'Romance'],
    status: 'ongoing',
    tags: ['keluarga', 'kantor'],
    synopsis:
      'Orkestra itu berlatih setiap malam untuk konser yang tanggalnya tidak pernah diumumkan. Kursinya tetap dibersihkan satu per satu.',
  },
  {
    title: 'Bayangan di Balik Cermin',
    genres: ['Horror', 'Thriller'],
    status: 'ongoing',
    free: true,
    kisah: true,
    tags: ['teror perlahan', 'psikologis', 'tragedi'],
    synopsis:
      'Bayangannya berkedip setengah detik lebih lambat, dan hanya di cermin kamar mandi. Ia menutup cermin itu dengan handuk selama tiga bulan.',
  },
  {
    title: 'Sepasang Payung Merah',
    genres: ['Romance'],
    status: 'completed',
    tags: ['cinta pertama'],
    synopsis:
      'Dua payung merah tertinggal di rak yang sama selama dua musim hujan. Tidak ada yang mengambil, dan tidak ada yang membuang.',
  },
  {
    title: 'Peta Menuju Rumah',
    genres: ['Fantasy', 'Drama'],
    status: 'hiatus',
    tags: ['sihir', 'kehilangan'],
    synopsis:
      'Peta itu tidak menunjukkan jalan, melainkan orang-orang yang harus ditemui sebelum sampai. Nama terakhir di daftar adalah namanya sendiri.',
  },
  {
    title: 'Rapat Terakhir Hari Jumat',
    genres: ['CEO', 'Thriller'],
    status: 'ongoing',
    tags: ['pernikahan kontrak', 'kejar-kejaran'],
    synopsis:
      'Setiap Jumat pukul empat ada rapat yang tidak tercantum di kalender siapa pun. Undangannya datang lewat amplop, bukan surel.',
  },
  {
    title: 'Sebelum Kamu Bertanya',
    genres: ['Romance'],
    status: 'ongoing',
    kisah: true,
    tags: ['musuh jadi cinta', 'komedi'],
    synopsis:
      'Ia menyiapkan jawaban selama tujuh tahun untuk satu pertanyaan yang tidak pernah diajukan. Sore itu pertanyaannya datang, dengan susunan kata yang salah.',
  },
  {
    title: 'Lagu Lama di Radio Tua',
    genres: ['Drama', 'Romance'],
    status: 'completed',
    free: true,
    tags: ['keluarga', 'cinta pertama'],
    synopsis:
      'Radio itu hanya menangkap satu siaran, dan siarannya selalu lagu yang sama dari tahun 1974. Penyiarnya menyebut nama pendengarnya.',
  },
  {
    title: 'Ekspedisi ke Selatan Angin',
    genres: ['Fantasy', 'Thriller'],
    status: 'hiatus',
    tags: ['sihir', 'psikologis'],
    synopsis:
      'Tidak ada peta yang menunjukkan selatan angin, dan tujuh ekspedisi sebelumnya tidak pernah kembali untuk menjelaskan kenapa. Yang kedelapan berangkat pekan depan.',
  },
  {
    title: 'Gerbang di Balik Air Terjun',
    genres: ['Fantasy'],
    status: 'completed',
    free: true,
    tags: ['dunia lain'],
    synopsis:
      'Air terjun itu berhenti mengalir tepat pukul empat setiap sore, dan selama dua menit ada pintu di baliknya. Warga desa sudah lama sepakat untuk tidak menghitung siapa yang belum kembali.',
  },
  {
    title: 'Penenun Ramalan Terakhir',
    genres: ['Fantasy'],
    status: 'completed',
    free: true,
    tags: ['sihir', 'dunia lain'],
    synopsis:
      'Setiap kain yang ia tenun menjadi kenyataan, jadi ia berhenti menenun wajah orang yang dicintainya. Benang terakhirnya sudah tiga tahun tergantung tanpa diselesaikan.',
  },
  {
    title: 'Kota yang Tidur Seribu Tahun',
    genres: ['Fantasy'],
    status: 'completed',
    free: true,
    tags: ['dunia lain'],
    synopsis:
      'Seluruh penduduknya tertidur di tengah kalimat, dan seribu tahun kemudian kalimat itu diteruskan seolah tidak ada jeda. Hanya satu anak yang sadar bahwa dunia di luar sudah berganti.',
  },
  {
    title: 'Mantra untuk Adikku',
    genres: ['Fantasy', 'Drama'],
    status: 'completed',
    free: true,
    tags: ['sihir', 'kehilangan'],
    synopsis:
      'Ia menukar seluruh ingatan tentang ibunya demi satu mantra yang bisa menyembuhkan adiknya. Adiknya sembuh, lalu bertanya kenapa kakaknya tidak lagi menangis di makam.',
  },
  {
    title: 'Peta Bintang Nenek Moyang',
    genres: ['Fantasy'],
    status: 'completed',
    tags: ['dunia lain'],
    synopsis:
      'Peta itu menunjukkan jalan pulang ke tempat yang belum pernah ia datangi. Kakeknya bilang semua orang di keluarga mereka lahir dua kali.',
  },
  {
    title: 'Ratu Tanpa Mahkota',
    genres: ['Fantasy', 'Romance'],
    status: 'ongoing',
    free: true,
    tags: ['sihir', 'musuh jadi cinta'],
    synopsis:
      'Ia dinobatkan pada pagi hari dan diburu pada malam harinya oleh panglima yang menobatkannya. Keduanya tahu persis siapa yang lebih dulu berbohong.',
  },
  {
    title: 'Anak Panah dari Utara',
    genres: ['Fantasy', 'Thriller'],
    status: 'ongoing',
    tags: ['dunia lain', 'kejar-kejaran'],
    synopsis:
      'Panah itu selalu tiba sehari sebelum orangnya, dan kali ini ia menancap di pintu rumah sendiri. Sena punya waktu satu malam untuk memutuskan lari ke mana.',
  },
  {
    title: 'Tujuh Hari Sebelum Sidang',
    genres: ['Thriller'],
    status: 'completed',
    free: true,
    tags: ['kejar-kejaran', 'psikologis'],
    synopsis:
      'Saksi kuncinya menghilang enam hari sebelum sidang, dan pengacaranya mulai menerima teleponnya sendiri dari nomor tak dikenal. Suara di seberang tahu isi berkas yang belum ia serahkan.',
  },
  {
    title: 'Saksi yang Tidak Pernah Ada',
    genres: ['Thriller', 'Mystery'],
    status: 'completed',
    free: true,
    tags: ['psikologis', 'kasus tertutup'],
    synopsis:
      'Seluruh berkas menyebut namanya, tetapi tidak ada satu pun foto, alamat, atau kerabat. Penyidik yang mencarinya berhenti bertugas dua minggu kemudian.',
  },
  {
    title: 'Nomor yang Salah Sambung',
    genres: ['Thriller'],
    status: 'completed',
    free: true,
    tags: ['kejar-kejaran'],
    synopsis:
      'Panggilan itu salah sambung, dan orang di seberang menyebut alamat rumahnya dengan benar. Ia pindah malam itu juga, dan teleponnya berdering lagi keesokan paginya.',
  },
  {
    title: 'Rumah Aman Terakhir',
    genres: ['Thriller'],
    status: 'completed',
    tags: ['kejar-kejaran', 'psikologis'],
    synopsis:
      'Ada enam rumah aman dalam daftar itu, dan lima sudah terbakar dalam urutan yang sama persis dengan daftarnya. Ia berdiri di depan yang keenam sambil menghitung mundur.',
  },
  {
    title: 'Dua Menit Setiap Malam',
    genres: ['Thriller', 'Horror'],
    status: 'completed',
    free: true,
    tags: ['psikologis'],
    synopsis:
      'Rekaman kamera rumahnya kosong selama dua menit setiap pukul satu pagi, dan hanya dua menit itu. Ia mulai begadang untuk melihat apa yang tidak mau direkam.',
  },
  {
    title: 'Berkas yang Dibakar Setengah',
    genres: ['Thriller', 'CEO'],
    status: 'completed',
    free: true,
    tags: ['balas dendam', 'kejar-kejaran'],
    synopsis:
      'Separuh berkas itu terbakar, dan separuh yang tersisa cukup untuk menjatuhkan tiga direktur. Yang membakarnya jelas tahu bagian mana yang harus disisakan.',
  },
  {
    title: 'Album Foto Tanpa Wajah',
    genres: ['Mystery'],
    status: 'completed',
    free: true,
    tags: ['kasus tertutup', 'twist'],
    synopsis:
      'Setiap wajah di album keluarga itu digunting rapi, kecuali satu. Nenek bilang album itu memang dibeli dalam keadaan begitu.',
  },
  {
    title: 'Hilang di Peron Tiga',
    genres: ['Mystery'],
    status: 'completed',
    free: true,
    tags: ['kasus tertutup'],
    synopsis:
      'Kereta itu berangkat dengan seratus dua penumpang dan tiba dengan seratus satu. Tidak ada yang mengaku kehilangan siapa pun.',
  },
  {
    title: 'Surat Wasiat Kedua',
    genres: ['Mystery', 'Drama'],
    status: 'completed',
    free: true,
    tags: ['twist', 'keluarga'],
    synopsis:
      'Wasiat pertama membagi semuanya rata, dan wasiat kedua ditemukan sehari setelah semuanya ditandatangani. Notarisnya mengaku baru pertama kali melihat yang kedua.',
  },
  {
    title: 'Kamar Terkunci di Loteng',
    genres: ['Mystery', 'Horror'],
    status: 'completed',
    free: true,
    tags: ['kasus tertutup', 'twist'],
    synopsis:
      'Kuncinya hilang tiga puluh tahun lalu, dan debu di depan pintunya selalu bersih. Pemilik baru rumah itu memutuskan bertanya pada tetangga sebelum mendobrak.',
  },
  {
    title: 'Jam yang Berhenti Pukul Tiga',
    genres: ['Mystery'],
    status: 'ongoing',
    free: true,
    tags: ['twist'],
    synopsis:
      'Semua jam di rumah itu berhenti di angka yang sama, termasuk yang baru dibeli kemarin. Ayahnya menolak memperbaikinya dan tidak pernah menjelaskan kenapa.',
  },
  {
    title: 'Pewaris yang Dipulangkan',
    genres: ['CEO', 'Romance'],
    status: 'completed',
    free: true,
    tags: ['pernikahan kontrak', 'kantor'],
    synopsis:
      'Ia dipanggil pulang untuk menikahi seseorang yang belum pernah ia temui, demi satu tanda tangan di akta perusahaan. Calon istrinya membawa daftar syarat yang lebih panjang dari kontraknya.',
  },
  {
    title: 'Rapat Umum Pemegang Saham',
    genres: ['CEO'],
    status: 'completed',
    free: true,
    tags: ['balas dendam', 'kantor'],
    synopsis:
      'Ia membeli satu lembar saham perusahaan yang memecat ayahnya, lalu datang ke rapat tahunan selama sembilan tahun berturut-turut. Tahun kesepuluh ia datang membawa mayoritas.',
  },
  {
    title: 'Istri Sementara Tuan Arga',
    genres: ['CEO', 'Romance'],
    status: 'completed',
    free: true,
    tags: ['pernikahan kontrak', 'musuh jadi cinta'],
    synopsis:
      'Kontraknya berlaku enam bulan, dan pasal ketujuh melarang keduanya saling jatuh cinta. Pasal itu yang pertama kali dilanggar, dan keduanya sepakat tidak membicarakannya.',
  },
  {
    title: 'Kursi Kosong di Lantai Puncak',
    genres: ['CEO'],
    status: 'completed',
    free: true,
    tags: ['balas dendam'],
    synopsis:
      'Direktur utamanya menghilang di hari pengumuman merger, dan kursinya dibiarkan kosong selama satu tahun penuh. Yang menolak mengisinya adalah orang yang paling diuntungkan.',
  },
  {
    title: 'Tanda Tangan Terakhir Ayah',
    genres: ['CEO', 'Drama'],
    status: 'ongoing',
    tags: ['pernikahan kontrak', 'keluarga', 'kehilangan'],
    synopsis:
      'Ayahnya menandatangani satu dokumen terakhir sebelum dirawat, dan isinya menyerahkan segalanya kepada orang asing. Keluarga itu punya sembilan puluh hari untuk membuktikan tangan siapa yang menulisnya.',
  },
  {
    title: 'Ibu Menabung Diam-diam',
    genres: ['Drama'],
    status: 'completed',
    free: true,
    kisah: true,
    tags: ['tragedi', 'keluarga'],
    synopsis:
      'Selama dua belas tahun ibu menyisihkan uang belanja ke dalam kaleng biskuit, dan tidak seorang pun di rumah tahu. Kaleng itu dibuka pada hari ia sudah tidak ada.',
  },
  {
    title: 'Tetangga Sebelah Rumah',
    genres: ['Drama'],
    status: 'completed',
    free: true,
    kisah: true,
    tags: ['komedi', 'keluarga'],
    synopsis:
      'Pagar kami dan pagar mereka berselisih tujuh sentimeter, dan perang dingin itu berlangsung enam tahun. Yang mendamaikan akhirnya seekor kucing yang tidak jelas milik siapa.',
  },
  {
    title: 'Hari Pertama Jadi Ojek',
    genres: ['Drama'],
    status: 'completed',
    free: true,
    kisah: true,
    tags: ['komedi'],
    synopsis:
      'Penumpang pertama saya minta diantar ke alamat yang ternyata rumah saya sendiri. Ia menawar, dan saya kalah menawar di depan rumah saya sendiri.',
  },
  {
    title: 'Surat dari Perantauan',
    genres: ['Drama'],
    status: 'completed',
    kisah: true,
    tags: ['tragedi', 'kehilangan'],
    synopsis:
      'Bapak menulis surat setiap bulan selama sembilan tahun merantau, dan semuanya sampai. Yang terakhir sampai tiga hari setelah kabar duka itu.',
  },
  {
    title: 'Warung Bu Sri',
    genres: ['Drama'],
    status: 'completed',
    kisah: true,
    tags: ['komedi'],
    synopsis:
      'Warung itu tidak pernah punya daftar harga, dan Bu Sri menghitung dari wajah pembelinya. Anak kos dihitung setengah, dan tidak ada yang berani protes.',
  },
  {
    title: 'Anak Kos dan Rice Cooker',
    genres: ['Drama'],
    status: 'completed',
    free: true,
    kisah: true,
    tags: ['komedi'],
    synopsis:
      'Satu rice cooker dipakai bertujuh untuk memasak apa pun kecuali nasi. Yang paling sering dimasak di dalamnya adalah mi, dan sekali pernah kaus kaki.',
  },
  {
    title: 'Sepatu Bekas Kakak',
    genres: ['Drama'],
    status: 'completed',
    kisah: true,
    tags: ['tragedi', 'kehilangan'],
    synopsis:
      'Sepatu itu kebesaran dua nomor, dan saya memakainya tiga tahun sampai akhirnya pas. Kakak sudah tidak sempat melihat kaki saya cukup besar untuk memakainya dengan benar.',
  },
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
]

/** Sinopsis empat karya milik pengguna. Alasan yang sama dengan `SYNOPSES`. */
export const MY_SYNOPSES: string[] = [
  'Setiap tersangka punya alibi yang sempurna, dan semuanya diberikan oleh orang yang sama. Detektif Rania mulai dari sana, bukan dari mayatnya.',
  'Ada satu musim yang dilewati kota itu setiap tahun, dan tidak seorang pun ingat pernah menjalaninya. Arsip cuaca mencatatnya kosong.',
  'Undangan makan malam itu menyebut delapan nama, dan meja disiapkan untuk sembilan. Nyonya A menolak menjelaskan kursi yang tersisa.',
  'Ia menulis surat setiap minggu selama sebelas tahun dan tidak pernah mengirim satu pun. Anaknya menemukan semuanya dalam satu kardus.',
]
