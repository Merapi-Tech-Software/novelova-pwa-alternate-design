/**
 * **Data contoh bab — bukan logika.**
 *
 * Delapan bab `s1` beserta judul, durasi baca, dan harganya datang apa adanya
 * dari `novelova-data.js`. `PROSE` adalah badan bab contoh; ia teks, bukan
 * aturan, jadi tempatnya di sini dan bukan di `seed.ts`.
 */

/** `CHAPTERS` kanvas — delapan bab pertama `s1`, harga 0/1.500/1.800/2.000. */
export const CHAPTER_SEED: Array<[n: number, title: string, min: number, price: number]> = [
  [1, 'Perjanjian Malam Itu', 8, 0],
  [2, 'Kopi yang Selalu Dingin', 9, 0],
  [3, 'Nomor yang Tidak Tersimpan', 7, 0],
  [4, 'Tawaran di Lantai Tiga Puluh', 10, 1_500],
  [5, 'Dua Tanda Tangan', 11, 1_500],
  [6, 'Hujan di Parkiran Basement', 9, 1_800],
  [7, 'Nama yang Tidak Boleh Disebut', 12, 1_800],
  [8, 'Sarapan Pukul Empat Pagi', 10, 2_000],
]

/**
 * Bab untuk **seluruh katalog**, bukan hanya cerita pertama.
 *
 * Delapan bab `s1` datang apa adanya dari `novelova-data.js` — judul, durasi
 * baca, dan **harga per babnya** yang berbeda-beda (0 · 1.500 · 1.800 · 2.000).
 * Sisanya dibangkitkan dari `stats.chapterCount` cerita itu, karena halaman
 * detail yang mengaku punya 120 bab lalu menampilkan delapan terbaca sebagai
 * kerusakan.
 *
 * Tiga bab pertama tiap cerita gratis: itu pola pancingan yang dipakai
 * requirement, dan yang membuat gerbang bab terkunci bisa dicoba tanpa koin.
 */
export const PAID_PRICES = [1_500, 1_500, 1_800, 1_800, 2_000]

/** `PROSE` dan `PREVIEW` kanvas — lima paragraf isi, dua paragraf pratinjau. */
export const PROSE = [
  'Lift itu berhenti di lantai tiga puluh, dan untuk pertama kalinya Kaia menyadari bahwa gedung ini tidak pernah benar-benar sunyi. Ada suara mesin di balik dinding, ada langkah yang tertahan di ujung koridor, ada napasnya sendiri yang terlalu cepat untuk seseorang yang datang hanya untuk mengantar berkas.',
  'Di ujung ruangan, Arden Wibawa berdiri membelakangi jendela. Kota di bawahnya tampak seperti peta yang belum selesai digambar, penuh titik lampu yang tidak saling mengenal.',
  '"Kamu terlambat empat menit," katanya tanpa menoleh. "Untuk orang yang datang meminta perpanjangan kontrak, itu bukan pembukaan yang baik."',
  'Kaia meletakkan berkasnya di meja, rapi, sudutnya sejajar dengan tepi kayu. Ia sudah belajar bahwa di ruangan ini ketenangan adalah satu-satunya mata uang yang dihargai, dan ia sudah menabungnya sejak pagi.',
  '"Saya tidak datang untuk meminta," jawabnya. "Saya datang untuk menawar."',
]
