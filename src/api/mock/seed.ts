import { AD_QUOTA_MAX, PROMO } from '@/lib/coin'
import { todayLocalISO } from '@/lib/date'
import type {
  AdQuota,
  AuthorProfile,
  ChapterContent,
  ChapterSummary,
  Comment,
  DeviceSession,
  Follow,
  LibraryEntry,
  LocaleSettings,
  Notification,
  NotificationPrefs,
  Ownership,
  PayMethod,
  PrintOrder,
  PrivacySettings,
  Rating,
  ReaderPrefs,
  ReadingProgress,
  Review,
  Reward,
  ScheduleEntry,
  Story,
  Transaction,
  User,
  Voucher,
  Wallet,
  Withdrawal,
} from '../contracts'
import {
  CATALOG,
  CATALOG_AUTHORS,
  FILLER,
  FILLER_BADGES,
  MY_SYNOPSES,
  type StorySeed,
  SYNOPSES,
} from './data/catalog'
import { CHAPTER_SEED, PAID_PRICES, PROSE } from './data/chapters'
import { db } from './db'
import { emptyReaderPrefs } from './defaults'
import { BANNER_URLS, COVER_URLS, pickImage } from './sampleImages'

/**
 * Data awal server tiruan, disalin dari `novelova-data.js` — dataset yang sama
 * yang dipakai mockup. Memakainya berarti aplikasi dan kanvas menampilkan cerita,
 * bab, dan ulasan yang sama, sehingga perbandingan visual jujur.
 *
 * **Dinormalkan saat disalin** (architecture.md §6.4): kunci pendek kanvas
 * (`t`, `a`, `g`, `r`, `st`) menjadi nama field domain, dan nilai yang sudah
 * diformat (`readsL: '985rb'`) **dibuang** — angka mentah disimpan, formatnya
 * dihasilkan `formatCompactCoin`.
 *
 * Yang **tidak** ada di sini: teks legal, kategori bantuan, FAQ, daftar pilihan
 * bahasa, dan kategori visibilitas. Semua itu **copy, bukan data pengguna**, jadi
 * tempatnya `src/i18n/content.ts`. Menaruhnya di IndexedDB berarti menyalin
 * kalimat ke database dan menuntut migrasi setiap kali ada typo.
 */

const ME = 'u1'
const now = Date.now()
const iso = (msAgo: number) => new Date(now - msAgo).toISOString()
const minutes = (n: number) => n * 60_000
const hours = (n: number) => n * 3_600_000
const days = (n: number) => n * 86_400_000

// ── pengguna ────────────────────────────────────────────────────────────────

/** `FOLLOWERS` kanvas: 24 pengguna, empat di antaranya menyembunyikan aktivitas. */
const FOLLOWER_ROWS: Array<
  [name: string, handle: string, role: 'reader' | 'author', act: string | null]
> = [
  ['Rina Ayu', 'rinaayu', 'reader', '412 bab tahun ini'],
  ['Dwi Prakoso', 'dwipra', 'author', '6 karya terbit'],
  ['Bagas Nugroho', 'bagasn', 'reader', null],
  ['Sekar Wulan', 'sekarwulan', 'reader', '88 ulasan ditulis'],
  ['Fajar Alim', 'fajaralim', 'author', '2 karya terbit'],
  ['Nadia Puspa', 'nadiapuspa', 'reader', '31 cerita tersimpan'],
  ['Yoga Saputra', 'yogas', 'reader', null],
  ['Intan Permata', 'intanp', 'author', '14 karya terbit'],
  ['Rizky Amelia', 'rizkyamelia', 'reader', '204 bab tahun ini'],
  ['Hendra Wijaya', 'hendraw', 'reader', '12 ulasan ditulis'],
  ['Tari Lestari', 'tarilestari', 'reader', '77 cerita tersimpan'],
  ['Adi Kurniawan', 'adikurnia', 'author', '3 karya terbit'],
  ['Maya Anggraini', 'mayaa', 'reader', '156 bab tahun ini'],
  ['Bimo Santoso', 'bimos', 'reader', null],
  ['Citra Dewanti', 'citrad', 'author', '9 karya terbit'],
  ['Galih Pratama', 'galihp', 'reader', '44 ulasan ditulis'],
  ['Wulan Sari', 'wulansari', 'reader', '19 cerita tersimpan'],
  ['Eko Prasetyo', 'ekop', 'reader', '301 bab tahun ini'],
  ['Lina Handayani', 'linah', 'author', '5 karya terbit'],
  ['Putra Ramadhan', 'putrar', 'reader', '62 bab tahun ini'],
  ['Sari Utami', 'sariutami', 'reader', '27 ulasan ditulis'],
  ['Dimas Aryo', 'dimasaryo', 'author', '11 karya terbit'],
  ['Ratna Kusuma', 'ratnak', 'reader', '98 cerita tersimpan'],
  ['Arif Setiawan', 'arifs', 'reader', null],
]

/** Indeks pengikut yang **juga** diikuti balik oleh pengguna ini. */
const FOLLOWING_IDX = [1, 3, 4, 7, 11, 14, 18, 21]

const users: User[] = [
  {
    id: ME,
    displayName: 'Anna Maharani',
    username: 'annamaharani',
    avatarUrl: null,
    role: 'author',
    tier: 3,
    joinedYear: 2024,
    penName: 'Amelia Putri',
  },
  ...FOLLOWER_ROWS.map<User>(([name, handle, role], i) => ({
    id: `f${i + 1}`,
    displayName: name,
    username: handle,
    avatarUrl: null,
    role,
    tier: 1,
    joinedYear: 2025,
    penName: role === 'author' ? name : null,
  })),
  ...CATALOG_AUTHORS.map<User>((name, i) => ({
    id: `a${i + 1}`,
    displayName: name,
    username: name.toLowerCase().replace(/\s+/g, ''),
    avatarUrl: null,
    role: 'author',
    tier: 4,
    joinedYear: 2023,
    penName: name,
  })),
]

const follows: Array<Follow & { id: string }> = [
  // Mereka mengikuti pengguna ini.
  ...FOLLOWER_ROWS.map((_, i) => ({
    id: `fw-in-${i + 1}`,
    followerId: `f${i + 1}`,
    followeeId: ME,
    createdAt: iso(days(30 - (i % 30))),
  })),
  // Delapan di antaranya diikuti balik.
  ...FOLLOWING_IDX.map((idx) => ({
    id: `fw-out-${idx}`,
    followerId: ME,
    followeeId: `f${idx + 1}`,
    createdAt: iso(days(20 - (idx % 20))),
  })),
]

// ── katalog ─────────────────────────────────────────────────────────────────

/** `'+24rb pembaca minggu ini'` → `24_000`. Urutan tidak bisa dibangun di atas teks. */
function weeklyReadsOf(growth: string): number {
  const match = /\+(\d+)(rb|jt)?/.exec(growth)
  if (!match) return 0
  const value = Number(match[1] ?? 0)
  return match[2] === 'jt' ? value * 1_000_000 : match[2] === 'rb' ? value * 1_000 : value
}

const CATALOG_FILLER: StorySeed[] = FILLER.map((seed, i) => {
  /*
   * **Menurun sampai 60rb, bukan menurun 21rb per judul.**
   *
   * Rumus lamanya `890_000 - i * 21_000` benar selama `FILLER` berisi 32 judul:
   * yang terakhir mendapat 239rb. Begitu R2b menumbuhkannya jadi 62,
   * judul ke-43 dan seterusnya jatuh **di bawah nol** — dan `/cari` mencetaknya
   * apa adanya sebagai `−160rb baca`. Sembilan belas cerita punya jumlah baca
   * negatif selama dua fase tanpa satu pun test gagal.
   *
   * Sekarang jaraknya dibagi rata sepanjang daftar, jadi menambah judul tidak
   * pernah bisa menembus dasar lagi. Urutannya tetap menurun — dan itulah yang
   * dipakai section "Populer".
   */
  const reads = 890_000 - Math.round((i / Math.max(1, FILLER.length - 1)) * 830_000)
  const day = new Date(Date.parse('2026-08-23') - i * 3 * 86_400_000)
  return {
    id: `s${i + 9}`,
    title: seed.title,
    authorIdx: i % CATALOG_AUTHORS.length,
    genres: seed.genres,
    rating: Math.round((4.9 - (i % 12) * 0.05) * 10) / 10,
    reads,
    saves: Math.round(reads / 8),
    // Ketiganya **dibaca dari seed**, bukan dihitung dari `i`. Alasannya
    // architecture.md §1.22: selama atributnya turunan indeks, isi sebuah
    // section beranda hanya bisa diatur dengan menghitung mundur posisi tiap
    // judul — dan satu judul yang disisipkan di tengah menggeser semuanya.
    status: seed.status,
    free: seed.free === true,
    kisah: seed.kisah === true,
    tags: seed.tags,
    synopsis: seed.synopsis,
    badge: FILLER_BADGES[i % FILLER_BADGES.length] ?? 'BARU',
    updatedAt: day.toISOString().slice(0, 10),
    chapterCount: 12 + (i % 9) * 3,
    growth: `+${2 + (i % 9)}rb pembaca minggu ini`,
    note: 'Pengisi katalog contoh.',
  }
})

/**
 * Tag delapan cerita kanvas.
 *
 * Dulu diturunkan `tagsFor(genres, i)`; ditulis di sini setelah §1.22 menuntut
 * isi tiap section kurasi bisa diatur. Delapan, sependek itu, jadi tidak perlu
 * ikut pindah ke `data/catalog.ts` bersama enam puluh dua pengisinya.
 */
const CANVAS_TAGS: string[][] = [
  ['kantor', 'pernikahan kontrak'],
  ['kasus tertutup', 'keluarga'],
  ['twist', 'psikologis'],
  ['kehilangan', 'cinta pertama'],
  ['balas dendam', 'kantor'],
  ['dunia lain', 'sihir'],
  ['musuh jadi cinta', 'slow burn'],
  ['kejar-kejaran', 'kasus tertutup'],
]

const catalogStories: Story[] = [...CATALOG, ...CATALOG_FILLER].map((s, i) => ({
  id: s.id,
  title: s.title,
  synopsis: s.synopsis ?? SYNOPSES[i] ?? '',
  coverUrl: pickImage(COVER_URLS, i),
  bannerUrl: pickImage(BANNER_URLS, i),
  authorId: `a${s.authorIdx + 1}`,
  penName: CATALOG_AUTHORS[s.authorIdx] ?? 'Penulis Novelova',
  genres: s.genres,
  // Delapan cerita kanvas tetap fiksi; sebagian pengisi jadi kisah nyata —
  // dan yang mana, ditulis di seed-nya, bukan dihitung dari posisinya.
  kind: s.kisah === true ? 'kisah' : 'fiksi',
  tags: s.tags ?? CANVAS_TAGS[i] ?? [],
  audience: 'Remaja',
  language: i % 9 === 4 ? 'English' : 'Indonesia',
  status: s.status,
  review: 'published',
  rejectReason: null,
  visibility: 'public',
  // Sebagian gratis — tanpa itu section "Gratis Hari Ini" selalu kosong.
  monetizeType: s.free === true ? 'free' : 'partial',
  fullAccessCoins: 300,
  badge: s.badge,
  updatedAt: s.updatedAt,
  commentsEnabled: true,
  moderateComments: false,
  allowTranslation: false,
  allowFanfiction: false,
  contentLabels: [],
  dedication: '',
  authorNote: '',
  stats: {
    reads: s.reads,
    saves: s.saves,
    rating: s.rating,
    ratingCount: Math.round(s.reads / 260),
    chapterCount: s.chapterCount,
    weeklyReads: weeklyReadsOf(s.growth),
    commentCount: Math.round(s.reads / 310),
    // Cerita gratis tidak punya bab yang dibuka pakai koin.
    // Dijepit nol: pengurangnya bisa melebihi jumlahnya pada judul di ekor
    // daftar, dan "bab dibuka −4.200 kali" bukan angka yang bisa berarti apa pun.
    unlockCount: i % 5 === 3 ? 0 : Math.max(0, Math.round(s.reads / 12) - i * 900),
    readers: Math.round(s.reads * 0.42),
    coinsEarned: i % 5 === 3 ? 0 : Math.round(s.reads / 11),
  },
}))

/**
 * Karya milik pengguna ini (`AUTHOR_STORIES` kanvas) — lima status berbeda,
 * termasuk dua yang **tidak ada di kanvas**: satu `in_review` dan satu
 * `rejected`, karena FR-STUDIO-38 menuntut keduanya terlihat.
 */
/** Tag empat karya penulis contoh; dulu diturunkan `tagsFor`. */
const MY_TAGS: string[][] = [
  ['kasus tertutup', 'twist'],
  ['keluarga', 'kehilangan'],
  ['psikologis', 'kejar-kejaran'],
  ['kehilangan', 'slow burn'],
]

const myStories: Story[] = [
  {
    id: 'ms1',
    title: 'Velvet Alibi',
    status: 'completed',
    review: 'published' as const,
    chapters: 74,
    reads: 268_000,
    rating: 4.5,
    updatedAt: '2026-07-30',
    genres: ['Mystery', 'Drama'] as Story['genres'],
    reject: null,
  },
  {
    id: 'ms2',
    title: 'Musim yang Tidak Kembali',
    status: 'ongoing',
    review: 'draft' as const,
    chapters: 6,
    reads: 0,
    rating: 0,
    updatedAt: '2026-08-26',
    genres: ['Drama'] as Story['genres'],
    reject: null,
  },
  {
    id: 'ms3',
    title: 'Perjamuan Terakhir Nyonya A',
    status: 'ongoing',
    review: 'in_review' as const,
    chapters: 14,
    reads: 0,
    rating: 0,
    updatedAt: '2026-08-25',
    genres: ['Thriller', 'Drama'] as Story['genres'],
    reject: null,
  },
  {
    id: 'ms4',
    title: 'Surat yang Tidak Dikirim',
    status: 'ongoing',
    review: 'rejected' as const,
    chapters: 22,
    reads: 41_000,
    rating: 4.1,
    updatedAt: '2026-05-11',
    genres: ['Drama'] as Story['genres'],
    reject: 'Bab 3 memuat kutipan panjang tanpa sumber. Sunting bagian itu lalu kirim ulang.',
  },
].map<Story>((s, i) => ({
  id: s.id,
  title: s.title,
  synopsis: MY_SYNOPSES[i] ?? '',
  // Digeser dari katalog supaya karya penulis tidak memakai sampul yang sama.
  coverUrl: pickImage(COVER_URLS, CATALOG.length + CATALOG_FILLER.length + i),
  bannerUrl: pickImage(BANNER_URLS, CATALOG.length + CATALOG_FILLER.length + i),
  authorId: ME,
  penName: 'Amelia Putri',
  genres: s.genres,
  kind: 'fiksi',
  tags: MY_TAGS[i] ?? [],
  audience: 'Remaja',
  language: 'Indonesia',
  status: s.status as Story['status'],
  review: s.review,
  rejectReason: s.reject,
  visibility: s.review === 'draft' ? 'private' : 'public',
  monetizeType: 'partial',
  fullAccessCoins: 300,
  badge: null,
  updatedAt: s.updatedAt,
  commentsEnabled: true,
  moderateComments: false,
  allowTranslation: false,
  allowFanfiction: false,
  contentLabels: [],
  dedication: '',
  authorNote: '',
  stats: {
    reads: s.reads,
    saves: Math.round(s.reads / 8),
    rating: s.rating,
    ratingCount: Math.round(s.reads / 260),
    chapterCount: s.chapters,
    weeklyReads: Math.round(s.reads / 40),
    commentCount: Math.round(s.reads / 310),
    unlockCount: Math.round(s.reads / 14),
    readers: Math.round(s.reads * 0.42),
    coinsEarned: Math.round(s.reads / 9),
  },
}))

function chaptersFor(story: Story): ChapterSummary[] {
  const seeded = story.id === 's1' ? CHAPTER_SEED : []

  return Array.from({ length: story.stats.chapterCount }, (_, i) => {
    const n = i + 1
    const canvas = seeded.find(([number]) => number === n)
    const price = canvas ? canvas[3] : n <= 3 ? 0 : (PAID_PRICES[n % PAID_PRICES.length] ?? 1_500)

    return {
      id: `${story.id}-c${n}`,
      storyId: story.id,
      number: n,
      title: canvas ? canvas[1] : `Bab ${n}`,
      access: price === 0 ? ('free' as const) : ('paid' as const),
      priceCoins: price,
      readMinutes: canvas ? canvas[2] : 7 + (n % 6),
      state: 'published' as const,
      review: 'published' as const,
      publishAt: iso(days(Math.max(0, story.stats.chapterCount - n))),
      publishTz: 'Asia/Jakarta',
      wordCount: 1_100 + (n % 20) * 40,
      previewPct: 20,
      accessChangedAt: null,
      privateReason: null,
      privateUntil: null,
      editedAt: iso(days(Math.max(0, story.stats.chapterCount - n))),
      views: price === 0 ? Math.round(story.stats.reads / 40) : Math.round(story.stats.reads / 90),
      rating: story.stats.rating,
      commentCount: Math.round(story.stats.commentCount / Math.max(1, story.stats.chapterCount)),
      owned: price === 0,
      // Dua bab pertama cerita pertama sudah selesai dibaca — sama dengan
      // progres yang di-seed, supaya penanda di daftar bab tidak berselisih.
      finished: story.id === 's1' && n <= 2,
      withdrawnAt: null,
    }
  })
}

const chapters: ChapterSummary[] = catalogStories.flatMap(chaptersFor)

/**
 * Naskah contoh sepanjang kira-kira `target` kata, dirakit dari `PROSE`.
 *
 * Dipakai **hanya** untuk bab milik penulis contoh. Sampai R9b kesembilan bab
 * itu tidak punya satu pun baris isi, sementara ringkasannya mengaku 620–2.040
 * kata: `/karya/ms1/bab` menulis *"sekitar 620 kata · 41%"* dan editornya
 * terbuka **kosong**. Sisi pembaca tidak terkena karena `getChapter` punya
 * naskah cadangan; sisi penulis tidak punya, dan memang tidak boleh punya —
 * naskah cadangan di editor berarti penulis menyunting tulisan yang bukan
 * miliknya.
 *
 * Jumlah katanya lalu **dihitung dari naskah ini**, bukan dipatok: angka yang
 * dipatok akan berselisih lagi pada perubahan berikutnya
 * (`CLAUDE.md` §8, "seed harus rekonsiliasi").
 */
function naskahSepanjang(target: number): string[] {
  const out: string[] = []
  let kata = 0
  for (let i = 0; kata < target && i < 400; i += 1) {
    const paragraf = PROSE[i % PROSE.length]
    if (!paragraf) break
    out.push(paragraf)
    kata += paragraf.split(/\s+/).length
  }
  return out
}

const hitungKata = (body: string[]): number => body.reduce((n, p) => n + p.split(/\s+/).length, 0)

/** `ms1-c51` → naskahnya. Dibangun sekali, dipakai dua kali: ringkasan dan isi. */
const authorBodies = new Map<string, string[]>()

/**
 * Bab milik penulis (`AUTHOR_CHAPTERS`) — empat keadaan: draf, terjadwal,
 * terbit, privat. Bab 49 dan 50 sengaja berbagi slot Kamis 19.00 supaya
 * peringatan bentrok `SCHED-409` punya datanya.
 */
const authorChapters: ChapterSummary[] = (
  [
    {
      n: 51,
      t: 'Sarapan Pukul Empat Pagi',
      state: 'draft',
      words: 620,
      at: null,
      edited: 0,
      views: 0,
      rating: 0,
      comments: 0,
    },
    // Draf yang sudah lama tidak disentuh — pemicu pemberitahuan "belum diedit
    // lima hari" (FR-STUDIO-07).
    {
      n: 50,
      t: 'Nama yang Tidak Boleh Disebut',
      state: 'draft',
      words: 1_180,
      at: null,
      edited: 7,
      views: 0,
      rating: 0,
      comments: 0,
    },
    // Dua status tinjauan tingkat bab (FR-STUDIO-38) — tanpa datanya, saringannya
    // tidak pernah bisa diperiksa.
    {
      n: 44,
      t: 'Pertemuan yang Tidak Dicatat',
      state: 'draft',
      words: 1_500,
      at: null,
      edited: 2,
      views: 0,
      rating: 0,
      comments: 0,
      review: 'in_review',
    },
    {
      n: 43,
      t: 'Kunci Kamar 1408',
      state: 'draft',
      words: 1_320,
      at: null,
      edited: 9,
      views: 0,
      rating: 0,
      comments: 0,
      review: 'rejected',
    },
    {
      n: 49,
      t: 'Hujan di Parkiran Basement',
      state: 'scheduled',
      words: 1_900,
      at: '2026-08-27T12:00:00.000Z',
      edited: 1,
      views: 0,
      rating: 0,
      comments: 0,
    },
    {
      n: 48,
      t: 'Dua Tanda Tangan',
      state: 'scheduled',
      words: 1_820,
      at: '2026-08-29T12:00:00.000Z',
      edited: 2,
      views: 0,
      rating: 0,
      comments: 0,
    },
    {
      n: 47,
      t: 'Tawaran di Lantai Tiga Puluh',
      state: 'published',
      words: 2_040,
      at: '2026-08-20T12:00:00.000Z',
      edited: 6,
      views: 14_200,
      rating: 4.8,
      comments: 318,
    },
    {
      n: 46,
      t: 'Nomor yang Tidak Tersimpan',
      state: 'published',
      words: 1_960,
      at: '2026-08-17T12:00:00.000Z',
      edited: 9,
      views: 9_400,
      rating: 4.6,
      comments: 204,
    },
    {
      n: 45,
      t: 'Kopi yang Selalu Dingin',
      state: 'private',
      words: 1_740,
      at: null,
      edited: 4,
      views: 0,
      rating: 0,
      comments: 0,
    },
  ] as Array<{
    n: number
    t: string
    state: ChapterSummary['state']
    words: number
    at: string | null
    edited: number
    views: number
    rating: number
    comments: number
    review?: ChapterSummary['review']
  }>
).map<ChapterSummary>((c) => {
  const id = `ms1-c${c.n}`
  const body = naskahSepanjang(c.words)
  authorBodies.set(id, body)
  // Jumlah kata **dihitung dari naskahnya**, bukan dari angka yang diketik di
  // atas: angka yang dipatok akan berselisih lagi pada perubahan berikutnya.
  const words = hitungKata(body)

  return {
    id,
    storyId: 'ms1',
    number: c.n,
    title: c.t,
    access: c.state === 'private' ? 'private' : c.n % 2 === 1 ? 'paid' : 'free',
    priceCoins: c.state === 'private' ? 0 : c.n % 2 === 1 ? 1_800 : 0,
    readMinutes: Math.round(words / 200),
    state: c.state,
    // Bab **privat** pernah terbit lalu disembunyikan — ia sudah lolos tinjauan.
    // Menandainya `draft` membuat "Tampilkan" mengirimnya ke antrean lagi.
    review: c.review ?? (c.state === 'published' || c.state === 'private' ? 'published' : 'draft'),
    publishAt: c.at,
    publishTz: 'Asia/Jakarta',
    wordCount: words,
    previewPct: 20,
    accessChangedAt: null,
    privateReason: c.state === 'private' ? 'Sedang direvisi' : null,
    privateUntil: null,
    editedAt: iso(days(c.edited)),
    views: c.views,
    rating: c.rating,
    commentCount: c.comments,
    owned: true,
    finished: false,
    withdrawnAt: null,
  }
})

export const CHAPTER_PREVIEW = [
  'Arden akhirnya berbalik. Ada sesuatu di matanya yang tidak pernah muncul dalam rapat mana pun, sesuatu yang membuat Kaia lupa pada urutan kalimat yang sudah ia susun sepanjang malam.',
  'Dan ketika pria itu menyebut satu nama yang seharusnya sudah lama terkubur bersama seluruh arsip tahun itu, seluruh ruangan terasa menyempit sampai hanya cukup untuk dua orang dan satu rahasia.',
]

/**
 * Isi bab hanya di-seed untuk bab kanvas.
 *
 * Empat puluh cerita berarti ~1.300 bab, dan menuliskan isi untuk semuanya
 * membuat pemuatan pertama aplikasi menunggu ribuan baris yang paragrafnya sama
 * persis. `getChapter` memakai `PROSE` sebagai isi bawaan bila barisnya tidak
 * ada — hasilnya identik di layar, seeding-nya jauh lebih ringan.
 */
const chapterContents: Array<ChapterContent & { id: string }> = [
  ...chapters
    .filter((c) => c.storyId === 's1')
    .map<ChapterContent & { id: string }>((c) => ({
      id: `${c.id}-id`,
      chapterId: c.id,
      lang: 'id',
      title: c.title,
      body: PROSE,
      authorNote: c.number === 1 ? 'Terima kasih sudah memulai cerita ini.' : null,
    })),
  // Bab milik penulis contoh **wajib** punya isi: editornya tidak punya naskah
  // cadangan, dan tidak boleh punya. Lihat `naskahSepanjang` di atas.
  ...authorChapters.map<ChapterContent & { id: string }>((c) => ({
    id: `${c.id}-id`,
    chapterId: c.id,
    lang: 'id',
    title: c.title,
    body: authorBodies.get(c.id) ?? PROSE,
    authorNote: null,
  })),
]

// ── dompet ──────────────────────────────────────────────────────────────────

/** 15.300 koin + 23 bonus — angka yang dipakai kanvas di enam layar. */
/*
 * **Saldo contoh 20.000** — permintaan produk 5 September, menimpa keputusan
 * §1.21 yang menahannya di 15.300 demi kecocokan dengan mockup.
 *
 * Angkanya dihitung dari harga bab sungguhan, bukan dibulatkan asal:
 *
 * | Bab berbayar | Kumulatif | Yang terjadi |
 * |---|---|---|
 * | ke-10 | 17.200 | **tawaran bundel muncul** |
 * | ke-11 | 18.700 | masih terbuka, sisa 1.300 |
 * | ke-12 | 20.200 | **kurang 200 koin → lembar isi koin** |
 *
 * Jadi satu sesi baca menerus melewati **kedua** fitur yang perlu dilihat:
 * tawaran bundelnya, lalu saldo habis beserta jalan keluarnya. Menahan saldo di
 * 15.300 membuat yang pertama tidak pernah tercapai — habis di bab ke-12, dua
 * bab sebelum ambangnya.
 */
const wallet: Wallet = { userId: ME, balance: 20_000, bonus: 23, updatedAt: iso(minutes(4)) }

const PKG_SEED: Array<[coins: number, price: number, note: string]> = [
  [50, 7_000, 'Rp 140/koin'],
  [100, 13_000, 'Rp 130/koin'],
  [250, 30_000, 'Rp 120/koin'],
  [500, 55_000, `+${PROMO.bonus} koin bonus`],
  [1_000, 99_000, 'Rp 99/koin'],
  [2_000, 185_000, 'Rp 92,5/koin'],
]

export const COIN_PACKAGES = PKG_SEED.map(([coins, priceRupiah, note], i) => ({
  id: `pkg${i + 1}`,
  coins,
  priceRupiah,
  bonusCoins: coins === PROMO.coins ? PROMO.bonus : 0,
  note,
}))

const payMethods: PayMethod[] = [
  { id: 'gopay', name: 'GoPay', type: 'ewallet', expiryMinutes: 15, bank: null },
  { id: 'ovo', name: 'OVO', type: 'ewallet', expiryMinutes: 15, bank: null },
  { id: 'dana', name: 'DANA', type: 'ewallet', expiryMinutes: 15, bank: null },
  { id: 'shopeepay', name: 'ShopeePay', type: 'ewallet', expiryMinutes: 15, bank: null },
  { id: 'qris', name: 'QRIS', type: 'qris', expiryMinutes: 30, bank: null },
  { id: 'va-bca', name: 'BCA Virtual Account', type: 'va', expiryMinutes: 1_440, bank: 'Bank BCA' },
  { id: 'va-bni', name: 'BNI Virtual Account', type: 'va', expiryMinutes: 1_440, bank: 'Bank BNI' },
  {
    id: 'va-mandiri',
    name: 'Mandiri Virtual Account',
    type: 'va',
    expiryMinutes: 1_440,
    bank: 'Bank Mandiri',
  },
  { id: 'va-bri', name: 'BRI Virtual Account', type: 'va', expiryMinutes: 1_440, bank: 'Bank BRI' },
]

/** Enam mutasi menutupi lima jenis — termasuk satu refund bab yang ditarik. */
const transactions: Transaction[] = [
  {
    id: 'tx1',
    userId: ME,
    kind: 'topup',
    amount: 550,
    title: 'Top-up 500 koin + 50 bonus',
    refType: 'topup',
    refId: 'inv1',
    method: 'GoPay',
    status: 'success',
    createdAt: iso(hours(1)),
  },
  {
    id: 'tx2',
    userId: ME,
    kind: 'spend',
    amount: -1_800,
    title: 'Buka Bab 47 · Cinta di Balik Kontrak',
    refType: 'chapter',
    refId: 's1-c7',
    method: null,
    status: 'success',
    createdAt: iso(hours(5)),
  },
  {
    id: 'tx3',
    userId: ME,
    kind: 'reward',
    amount: 30,
    title: 'Check-in hari ke-5',
    refType: 'checkin',
    refId: null,
    method: null,
    status: 'success',
    createdAt: iso(hours(9)),
  },
  {
    id: 'tx4',
    userId: ME,
    kind: 'spend',
    amount: -12_000,
    title: 'Bundel 10 bab · Velvet Alibi',
    refType: 'bundle',
    refId: 'ms1',
    method: null,
    status: 'success',
    createdAt: iso(days(2)),
  },
  {
    id: 'tx5',
    userId: ME,
    kind: 'refund',
    amount: 3,
    title: 'Refund otomatis · bab ditarik penulis',
    refType: 'chapter',
    refId: 's3-c12',
    method: null,
    status: 'reversed',
    createdAt: iso(days(4)),
  },
  {
    id: 'tx6',
    userId: ME,
    kind: 'topup',
    amount: 0,
    title: 'Top-up 250 koin · menunggu konfirmasi',
    refType: 'topup',
    refId: 'inv2',
    method: 'BCA Virtual Account',
    status: 'pending',
    createdAt: iso(days(5)),
  },
]

const adQuota: AdQuota & { id: string } = {
  id: `${ME}-${todayLocalISO()}`,
  userId: ME,
  date: todayLocalISO(),
  used: 1,
  max: AD_QUOTA_MAX,
}

// ── perpustakaan, kepemilikan, progres ──────────────────────────────────────

const LIB_SEED: Array<[storyId: string, at: number, of: number, saved: string, notify: boolean]> = [
  ['s1', 45, 120, '2026-08-20', true],
  ['s3', 12, 96, '2026-08-18', true],
  ['s4', 74, 74, '2026-07-28', false],
  ['s6', 0, 60, '2026-08-24', true],
  ['s8', 30, 88, '2026-08-22', false],
  ['s5', 0, 110, '2026-08-26', true],
]

const libraryEntries: Array<LibraryEntry & { id: string }> = LIB_SEED.map(
  ([storyId, , , savedAt, notify]) => ({
    id: `${ME}-${storyId}`,
    userId: ME,
    storyId,
    savedAt,
    notify,
    removed: false,
  }),
)

const progress: Array<ReadingProgress & { id: string }> = LIB_SEED.map(([storyId, at]) => ({
  id: `${ME}-${storyId}`,
  userId: ME,
  storyId,
  lastChapterId: at > 0 ? `${storyId}-c${Math.min(at, 8)}` : null,
  scrollByChapter: {},
  scrollPct: at > 0 ? 0.42 : 0,
  finishedChapterIds:
    at > 0 ? Array.from({ length: Math.min(at, 8) }, (_, i) => `${storyId}-c${i + 1}`) : [],
  updatedAt: iso(hours(12)),
}))

const ownerships: Array<Ownership & { id: string }> = [
  { id: 'own1', userId: ME, chapterId: 's1-c4', source: 'coin', acquiredAt: iso(days(3)) },
  { id: 'own2', userId: ME, chapterId: 's1-c5', source: 'coin', acquiredAt: iso(days(3)) },
  { id: 'own3', userId: ME, chapterId: 's1-c6', source: 'ad', acquiredAt: iso(days(1)) },
  { id: 'own4', userId: ME, chapterId: 's1-c7', source: 'coin', acquiredAt: iso(hours(5)) },
]

// ── sosial ──────────────────────────────────────────────────────────────────

const REVIEW_SEED: Array<{
  id: string
  who: string
  userId: string
  stars: number
  daysAgo: number
  tags: string[]
  text: string
  helpful: number
  spoiler?: boolean
  edited?: boolean
  reply?: string
}> = [
  {
    id: 'rv0',
    who: 'Anna Maharani',
    userId: ME,
    stars: 5,
    daysAgo: 6,
    tags: ['slow burn', 'chemistry'],
    text: 'Ketegangan dibangun perlahan lewat percakapan yang tidak pernah menyebut inti masalahnya. Bab 47 mengubah cara saya membaca seluruh paruh pertama.',
    helpful: 24,
    edited: true,
  },
  {
    id: 'rv1',
    who: 'Rina Ayu',
    userId: 'f1',
    stars: 5,
    daysAgo: 7,
    tags: ['slow burn', 'plot twist'],
    text: 'Dialog di lantai tiga puluh itu ditulis dengan sabar. Tidak ada yang berteriak, tapi semuanya berubah.',
    helpful: 128,
    reply:
      'Terima kasih sudah membaca sejauh ini. Bab 51 akan menjawab pertanyaan soal sarapan itu.',
  },
  {
    id: 'rv2',
    who: 'Dwi Prakoso',
    userId: 'f2',
    stars: 4,
    daysAgo: 8,
    tags: ['chemistry'],
    text: 'Kuat di dua pertiga awal. Bagian tengah agak melambat, tapi tetap saya lanjutkan sampai bab terakhir.',
    helpful: 46,
  },
  {
    id: 'rv3',
    who: 'Bagas Nugroho',
    userId: 'f3',
    stars: 5,
    daysAgo: 9,
    tags: ['plot twist'],
    text: 'Yang menandatangani kontrak kedua ternyata bukan Arga, dan itu menjelaskan kenapa dia tidak pernah menjawab telepon di bab 30.',
    helpful: 31,
    spoiler: true,
  },
  {
    id: 'rv4',
    who: 'Sekar Wulan',
    userId: 'f4',
    stars: 2,
    daysAgo: 10,
    tags: [],
    text: 'Premisnya menarik tapi konfliknya berulang. Tiga bab terakhir terasa seperti versi lain dari bab sepuluh.',
    helpful: 12,
  },
  // Rating tanpa teks — membuktikan rating ≠ ulasan (FR-SOCIAL-01/03).
  {
    id: 'rv5',
    who: 'Nadia Puspa',
    userId: 'f6',
    stars: 3,
    daysAgo: 11,
    tags: [],
    text: '',
    helpful: 0,
  },
]

const reviews: Review[] = REVIEW_SEED.map((r) => ({
  id: r.id,
  userId: r.userId,
  userName: r.who,
  storyId: 's1',
  stars: r.stars,
  text: r.text,
  tags: r.tags,
  spoiler: r.spoiler ?? false,
  helpfulCount: r.helpful,
  markedHelpful: false,
  editedAt: r.edited ? iso(days(r.daysAgo - 1)) : null,
  createdAt: iso(days(r.daysAgo)),
  reply: r.reply
    ? {
        reviewId: r.id,
        authorId: 'a1',
        authorName: 'Amelia Putri',
        text: r.reply,
        updatedAt: iso(days(r.daysAgo - 1)),
      }
    : null,
}))

const ratings: Array<Rating & { id: string }> = REVIEW_SEED.map((r) => ({
  id: `${r.userId}-s1`,
  userId: r.userId,
  storyId: 's1',
  stars: r.stars,
  updatedAt: iso(days(r.daysAgo)),
}))

const comments: Comment[] = [
  {
    id: 'c1',
    chapterId: 's1-c5',
    userId: 'f1',
    userName: 'Rina Ayu',
    isAuthor: false,
    parentId: null,
    text: 'Kalimat "dua tanda tangan" di akhir bab ini bikin saya balik ke bab 12 dan baca ulang.',
    spoiler: false,
    likeCount: 214,
    liked: false,
    underReview: false,
    createdAt: iso(minutes(18)),
  },
  {
    id: 'c1r1',
    chapterId: 's1-c5',
    userId: 'a1',
    userName: 'Amelia Putri',
    isAuthor: true,
    parentId: 'c1',
    text: 'Bab 12 memang ditulis supaya bisa dibaca dua kali dengan arti berbeda.',
    spoiler: false,
    likeCount: 41,
    liked: false,
    underReview: false,
    createdAt: iso(minutes(9)),
  },
  {
    id: 'c1r2',
    chapterId: 's1-c5',
    userId: 'f2',
    userName: 'Dwi Prakoso',
    isAuthor: false,
    parentId: 'c1',
    text: 'Baru sadar setelah komentar ini. Detail cangkirnya juga sama.',
    spoiler: false,
    likeCount: 8,
    liked: false,
    underReview: false,
    createdAt: iso(minutes(4)),
  },
  {
    id: 'c2',
    chapterId: 's1-c5',
    userId: 'f3',
    userName: 'Bagas Nugroho',
    isAuthor: false,
    parentId: null,
    text: 'Arga menolak tawaran itu karena dia sudah tahu isi kontrak keduanya sejak bab 30.',
    spoiler: true,
    likeCount: 88,
    liked: false,
    underReview: false,
    createdAt: iso(hours(1)),
  },
  {
    id: 'c3',
    chapterId: 's1-c5',
    userId: 'f4',
    userName: 'Sekar Wulan',
    isAuthor: false,
    parentId: null,
    text: 'Bagian rapat di lantai tiga puluh itu terlalu cepat menurut saya. Tapi kalimat penutupnya bagus.',
    spoiler: false,
    likeCount: 41,
    liked: false,
    underReview: false,
    createdAt: iso(hours(3)),
  },
  {
    id: 'c3r1',
    chapterId: 's1-c5',
    userId: 'f1',
    userName: 'Rina Ayu',
    isAuthor: false,
    parentId: 'c3',
    text: 'Justru cepatnya itu yang bikin terasa seperti benar-benar rapat kantor.',
    spoiler: false,
    likeCount: 12,
    liked: false,
    underReview: false,
    createdAt: iso(hours(2)),
  },
  // Komentar dilaporkan tetap menempati barisnya (FR-SOCIAL-07, kanvas layar 18).
  {
    id: 'c4',
    chapterId: 's1-c5',
    userId: 'f7',
    userName: 'Yoga Saputra',
    isAuthor: false,
    parentId: null,
    text: 'Komentar ini sedang ditinjau moderator.',
    spoiler: false,
    likeCount: 0,
    liked: false,
    underReview: true,
    createdAt: iso(hours(5)),
  },
  {
    id: 'c5',
    chapterId: 's1-c5',
    userId: 'f5',
    userName: 'Fajar Alim',
    isAuthor: false,
    parentId: null,
    text: 'Sudah tiga bab saya tunggu Arga bicara jujur. Ternyata jawabannya lewat tanda tangan, bukan kalimat.',
    spoiler: false,
    likeCount: 156,
    liked: false,
    underReview: false,
    createdAt: iso(days(1)),
  },
]

// ── notifikasi ──────────────────────────────────────────────────────────────

const NOTIF_SEED: Array<{
  id: string
  type: Notification['type']
  title: string
  body: string
  link: string
  msAgo: number
  unread: boolean
  group?: [key: string, count: number]
}> = [
  {
    id: 'n1',
    type: 'cerita',
    title: '3 bab baru di Cinta di Balik Kontrak',
    body: 'Digabung dari tiga rilis hari ini',
    link: '/cerita/s1/bab/s1-c8',
    msAgo: minutes(12),
    unread: true,
    group: ['story-s1-chapter', 3],
  },
  {
    id: 'n2',
    type: 'dompet',
    title: 'Top-up 500 koin berhasil',
    body: 'Saldo bertambah 550 koin termasuk bonus',
    link: '/koin/transaksi/tx1',
    msAgo: hours(1),
    unread: true,
  },
  {
    id: 'n3',
    type: 'hadiah',
    title: 'Check-in hari ke-5 tersedia',
    body: 'Klaim 30 koin sebelum tengah malam',
    link: '/hadiah',
    msAgo: hours(3),
    unread: true,
  },
  {
    id: 'n4',
    type: 'cerita',
    title: 'Ulasan baru di Velvet Alibi',
    body: 'Rina Ayu menulis ulasan 5 bintang',
    link: '/cerita/ms1/ulasan',
    msAgo: hours(5),
    unread: false,
  },
  {
    id: 'n5',
    type: 'sistem',
    title: 'Masuk dari perangkat baru',
    body: 'Chrome · Jakarta',
    link: '/pengaturan/keamanan',
    msAgo: days(1),
    unread: false,
  },
  {
    id: 'n6',
    type: 'dompet',
    title: 'Penarikan Rp 6.500.000 selesai',
    body: 'Masuk ke BCA **** 4481',
    link: '/penulis/penarikan/riwayat',
    msAgo: days(1) + hours(2),
    unread: false,
  },
  {
    id: 'n7',
    type: 'hadiah',
    title: '2 voucher hampir kedaluwarsa',
    body: 'Berakhir dalam 3 hari',
    link: '/hadiah',
    msAgo: days(1) + hours(6),
    unread: false,
  },
  {
    id: 'n8',
    type: 'cerita',
    title: 'Bab 49 terjadwal terbit besok 19.00',
    body: 'Hujan di Parkiran Basement',
    link: '/karya/ms1/bab',
    msAgo: days(4),
    unread: false,
  },
  {
    id: 'n9',
    type: 'sistem',
    title: 'Pesanan cetak Velvet Alibi dikirim',
    body: 'Resi JNE 004821194',
    link: '/karya/cetak',
    msAgo: days(4) + hours(3),
    unread: false,
  },
]

const notifications: Notification[] = NOTIF_SEED.map((n) => ({
  id: n.id,
  userId: ME,
  type: n.type,
  title: n.title,
  body: n.body,
  deepLink: n.link,
  groupKey: n.group?.[0] ?? null,
  groupCount: n.group?.[1] ?? 1,
  readAt: n.unread ? null : iso(n.msAgo - minutes(5)),
  createdAt: iso(n.msAgo),
}))

const notificationPrefs: NotificationPrefs = {
  userId: ME,
  cerita: { inApp: true, push: true, email: false },
  dompet: { inApp: true, push: true, email: true },
  hadiah: { inApp: true, push: false, email: false },
  // Kanal keamanan terkunci `true` — tidak boleh dimatikan (FR-NOTIF-04).
  sistem: { inApp: true, push: true, email: true },
  quietHours: { enabled: true, from: 22, to: 7 },
}

// ── studio, penghasilan, hadiah ─────────────────────────────────────────────

const authorProfile: AuthorProfile = {
  userId: ME,
  tier: 'verified',
  payoutVerified: true,
  twoFactor: true,
  termsAcceptedAt: iso(days(300)),
}

/**
 * `PRINT_JOBS` kanvas, dipetakan ke **lini masa enam tahap PRD** dan diberi
 * nomor pesanan `#SFT-`/`#HDC-` yang kanvas tidak gambar (arch §1.5).
 * Enam baris menutupi seluruh keadaan, termasuk empat yang hanya ada di kanvas.
 */
const printOrders: PrintOrder[] = [
  {
    id: '#SFT-20260826-001',
    userId: ME,
    storyId: 'ms1',
    storyTitle: 'Velvet Alibi',
    kind: 'soft',
    spec: 'Bab 1–74 · A4 · sampul + daftar isi',
    status: 'received',
    stageIndex: null,
    costQuoted: null,
    costFinal: null,
    rejectReason: null,
    trackingNumber: null,
    etaNote: null,
    fileName: 'Velvet Alibi - Bab 1-74.pdf',
    fileSize: '4,2 MB',
    fileExpiresAt: iso(-days(25)),
    note: null,
    createdAt: iso(days(5)),
  },
  {
    id: '#HDC-20260824-001',
    userId: ME,
    storyId: 'ms1',
    storyTitle: 'Velvet Alibi',
    kind: 'hard',
    spec: '3 eksemplar · A5 · soft cover · HVS 80gr',
    status: 'shipped',
    stageIndex: 4,
    costQuoted: 285_000,
    costFinal: 285_000,
    rejectReason: null,
    trackingNumber: 'JNE 004821194',
    etaNote: 'Tiba 29–30 Agu',
    fileName: null,
    fileSize: null,
    fileExpiresAt: null,
    note: null,
    createdAt: iso(days(7)),
  },
  {
    id: '#HDC-20260822-001',
    userId: ME,
    storyId: 'ms4',
    storyTitle: 'Surat yang Tidak Dikirim',
    kind: 'hard',
    spec: '1 eksemplar · A5 · hard cover · book paper',
    status: 'printing',
    stageIndex: 3,
    costQuoted: 148_000,
    costFinal: 148_000,
    rejectReason: null,
    trackingNumber: null,
    etaNote: null,
    fileName: null,
    fileSize: null,
    fileExpiresAt: null,
    note: 'Sedang dicetak · masuk antrean produksi',
    createdAt: iso(days(9)),
  },
  // PRINT-504 — naskah 120 bab melewati batas 15 menit pemrosesan.
  {
    id: '#SFT-20260820-001',
    userId: ME,
    storyId: 's1',
    storyTitle: 'Cinta di Balik Kontrak',
    kind: 'soft',
    spec: 'Bab 1–120 · A4 · sampul + daftar isi',
    status: 'build_failed',
    stageIndex: null,
    costQuoted: null,
    costFinal: null,
    rejectReason: null,
    trackingNumber: null,
    etaNote: null,
    fileName: 'Cinta di Balik Kontrak - Bab 1-120.pdf',
    fileSize: null,
    fileExpiresAt: null,
    note: 'Naskah 120 bab melewati batas 15 menit pemrosesan',
    createdAt: iso(days(11)),
  },
  // PRINT-402 — admin menyesuaikan biaya; belum ada yang ditagihkan.
  {
    id: '#HDC-20260818-001',
    userId: ME,
    storyId: 'ms2',
    storyTitle: 'Musim yang Tidak Kembali',
    kind: 'hard',
    spec: '2 eksemplar · A5 · soft cover',
    status: 'cost_changed',
    stageIndex: 1,
    costQuoted: 196_000,
    costFinal: 214_000,
    rejectReason: null,
    trackingNumber: null,
    etaNote: null,
    fileName: null,
    fileSize: null,
    fileExpiresAt: null,
    note: 'Biaya berubah karena jenis kertas berbeda. Belum ada yang ditagihkan.',
    createdAt: iso(days(13)),
  },
  // Keadaan ketiga PRD: **ditolak**, dan alasannya menyebut kebijakannya —
  // bukan "pesanan tidak dapat diproses" yang tidak bisa ditindaklanjuti.
  {
    id: '#HDC-20260815-001',
    userId: ME,
    storyId: 'ms3',
    storyTitle: 'Kota yang Tidak Tidur',
    kind: 'hard',
    spec: '1 eksemplar · A5 · soft cover',
    status: 'rejected',
    stageIndex: null,
    costQuoted: 148_000,
    costFinal: 0,
    rejectReason:
      'Cerita ini baru punya 6 bab aktif. Kebijakan penjilidan menuntut minimum 10 bab aktif agar punggung buku cukup tebal. Tidak ada biaya yang ditagihkan.',
    trackingNumber: null,
    etaNote: null,
    fileName: null,
    fileSize: null,
    fileExpiresAt: null,
    note: null,
    createdAt: iso(days(16)),
  },
  // PRINT-410 — berkas lewat masa simpan 30 hari.
  {
    id: '#SFT-20260511-001',
    userId: ME,
    storyId: 'ms1',
    storyTitle: 'Velvet Alibi',
    kind: 'soft',
    spec: 'Bab 1–40 · A4 · tanpa daftar isi',
    status: 'expired',
    stageIndex: null,
    costQuoted: null,
    costFinal: null,
    rejectReason: null,
    trackingNumber: null,
    etaNote: null,
    fileName: 'Velvet Alibi - Bab 1-40.pdf',
    fileSize: null,
    fileExpiresAt: iso(days(77)),
    note: 'Berkas kedaluwarsa setelah 30 hari',
    createdAt: iso(days(107)),
  },
]

/** `UNI_SCHEDULE` — tiga normal, dua celah, satu bentrok. */
const scheduleEntries: ScheduleEntry[] = [
  {
    id: 'sch1',
    storyId: 's1',
    storyTitle: 'Cinta di Balik Kontrak',
    chapterId: 'ms1-c49',
    chapterLabel: 'Bab 49 · Hujan di Parkiran Basement',
    publishAtUtc: '2026-08-27T12:00:00.000Z',
    authorTz: 'Asia/Jakarta',
    cadence: 'Rutin Senin & Kamis',
    kind: 'ok',
    note: null,
  },
  {
    id: 'sch2',
    storyId: 's1',
    storyTitle: 'Cinta di Balik Kontrak',
    chapterId: 'ms1-c48',
    chapterLabel: 'Bab 48 · Dua Tanda Tangan',
    publishAtUtc: '2026-08-29T12:00:00.000Z',
    authorTz: 'Asia/Jakarta',
    cadence: 'Rutin Senin & Kamis',
    kind: 'ok',
    note: null,
  },
  {
    id: 'sch3',
    storyId: 'ms3',
    storyTitle: 'Perjamuan Terakhir Nyonya A',
    chapterId: null,
    chapterLabel: 'Bab 14 · Kursi yang Dikosongkan',
    publishAtUtc: '2026-08-31T13:00:00.000Z',
    authorTz: 'Asia/Jakarta',
    cadence: 'Terbit sekali',
    kind: 'ok',
    note: null,
  },
  {
    id: 'sch4',
    storyId: 'ms1',
    storyTitle: 'Velvet Alibi',
    chapterId: null,
    chapterLabel: null,
    publishAtUtc: null,
    authorTz: 'Asia/Jakarta',
    cadence: 'Biasanya rutin mingguan',
    kind: 'gap',
    note: 'Tidak ada jadwal berikutnya selama 27 hari',
  },
  {
    id: 'sch5',
    storyId: 'ms2',
    storyTitle: 'Musim yang Tidak Kembali',
    chapterId: null,
    chapterLabel: null,
    publishAtUtc: null,
    authorTz: 'Asia/Jakarta',
    cadence: 'Belum pernah terbit',
    kind: 'gap',
    note: '6 draf menumpuk',
  },
  // Bentrok: slot yang sama dengan sch1 (SCHED-409).
  {
    id: 'sch6',
    storyId: 's1',
    storyTitle: 'Cinta di Balik Kontrak',
    chapterId: 'ms1-c50',
    chapterLabel: 'Bab 50 · Nama yang Tidak Boleh Disebut',
    publishAtUtc: '2026-08-27T12:00:00.000Z',
    authorTz: 'Asia/Jakarta',
    cadence: 'Dua bab pada slot yang sama',
    kind: 'clash',
    note: 'Bentrok dengan Bab 49',
  },
]

/** Termasuk satu **Ditolak** beserta alasannya — penolakan harus bisa ditindaklanjuti. */
/**
 * Pencairan contoh · prd_08.
 *
 * Jumlahnya sengaja **lebih kecil daripada penghasilan seumur hidup penulis
 * contoh** (~Rp 3,5 juta dari 34.334 koin). Versi sebelumnya mencatat penarikan
 * Rp 7,7 juta, jadi saldo tersedia selalu terjepit ke nol dan alur pencairan
 * mustahil dicoba — seed yang membantah dirinya sendiri.
 */
const withdrawals: Withdrawal[] = [
  {
    id: 'wd1',
    userId: ME,
    amount: 1_500_000,
    fee: 5_000,
    net: 1_495_000,
    bankName: 'BCA',
    bankAccountMasked: '**** 4481',
    status: 'transferred',
    reason: null,
    proofUrl: null,
    requestedAt: iso(days(8)),
    settledAt: iso(days(1)),
  },
  {
    id: 'wd2',
    userId: ME,
    amount: 400_000,
    fee: 5_000,
    net: 395_000,
    bankName: 'BCA',
    bankAccountMasked: '**** 4481',
    status: 'review',
    reason: null,
    proofUrl: null,
    requestedAt: iso(days(2)),
    settledAt: null,
  },
  {
    id: 'wd3',
    userId: ME,
    amount: 300_000,
    fee: 5_000,
    net: 295_000,
    bankName: 'Mandiri',
    bankAccountMasked: '**** 1902',
    status: 'rejected',
    reason: 'Nama rekening tidak cocok dengan identitas pencairan.',
    proofUrl: null,
    requestedAt: iso(days(20)),
    settledAt: iso(days(18)),
  },
]

const rewards: Reward = {
  userId: ME,
  checkInStreak: 4,
  lastCheckIn: null,
  missions: [
    {
      id: 'm1',
      title: 'Baca 3 bab hari ini',
      description: 'Bab apa pun, dari cerita mana pun',
      progress: 2,
      target: 3,
      rewardCoins: 15,
      claimedAt: null,
    },
    {
      id: 'm2',
      title: 'Tulis satu ulasan',
      description: 'Minimal 20 karakter',
      progress: 1,
      target: 1,
      rewardCoins: 25,
      claimedAt: iso(days(6)),
    },
    {
      id: 'm3',
      title: 'Simpan 5 cerita',
      description: 'Bangun perpustakaanmu',
      progress: 6,
      target: 5,
      rewardCoins: 20,
      claimedAt: null,
    },
  ],
  referralCode: 'ANNA2026',
}

/** Empat cakupan voucher — tanpa cakupan, voucher hanya diskon yang buta. */
const vouchers: Voucher[] = [
  {
    id: 'v1',
    code: 'BACAGRATIS',
    ownerId: ME,
    title: 'Satu bab gratis',
    scope: 'chapter',
    storyIds: ['s1'],
    chapterIds: ['s1-c8'],
    value: 'free',
    percentOff: null,
    firstN: null,
    unlockCond: null,
    maxUses: 1,
    usedCount: 0,
    expiresAt: iso(-days(3)),
  },
  {
    id: 'v2',
    code: 'MULAI5',
    ownerId: ME,
    title: '5 bab pertama gratis',
    scope: 'firstN',
    storyIds: ['s6'],
    chapterIds: [],
    value: 'free',
    percentOff: null,
    firstN: 5,
    unlockCond: null,
    maxUses: 1,
    usedCount: 0,
    expiresAt: iso(-days(10)),
  },
  {
    id: 'v3',
    code: 'TAMAT30',
    ownerId: ME,
    title: 'Diskon 30% akses penuh',
    scope: 'story',
    storyIds: ['s4'],
    chapterIds: [],
    value: 'pct',
    percentOff: 30,
    firstN: null,
    unlockCond: 'Selesaikan 10 bab cerita ini',
    maxUses: 1,
    usedCount: 0,
    expiresAt: iso(-days(21)),
  },
  {
    id: 'v4',
    code: 'ROMANSA',
    ownerId: ME,
    title: 'Diskon 20% seluruh Romance',
    scope: 'cross',
    storyIds: ['s1', 's8'],
    chapterIds: [],
    value: 'pct',
    percentOff: 20,
    firstN: null,
    unlockCond: null,
    maxUses: 3,
    usedCount: 1,
    expiresAt: iso(-days(14)),
  },
]

// ── profil & pengaturan ─────────────────────────────────────────────────────

const privacySettings: PrivacySettings = {
  userId: ME,
  readingActivity: true,
  library: true,
  reviews: true,
  // Data dompet mati secara bawaan — ini kategori sensitif.
  wallet: false,
}

const localeSettings: LocaleSettings = {
  userId: ME,
  uiLang: 'Bahasa Indonesia',
  translationPriority: 'Asli + terjemahan Indonesia',
  contentRegion: 'Indonesia',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
}

/** Satu sesi kini, satu wajar, satu **basi 12 hari** — pemicu saran keamanan. */
const deviceSessions: DeviceSession[] = [
  {
    id: 'ds1',
    device: 'Windows · Chrome',
    location: 'Jakarta, Indonesia',
    lastActiveAt: iso(minutes(1)),
    current: true,
  },
  {
    id: 'ds2',
    device: 'iPhone · Safari',
    location: 'Bandung, Indonesia',
    lastActiveAt: iso(days(3)),
    current: false,
  },
  {
    id: 'ds3',
    device: 'Android · Aplikasi Novelova',
    location: 'Surabaya, Indonesia',
    lastActiveAt: iso(days(12)),
    current: false,
  },
]

// ── penulisan ke Dexie ──────────────────────────────────────────────────────

export const CURRENT_USER_ID = ME

const readerPrefs: ReaderPrefs = {
  ...emptyReaderPrefs(ME),
  genres: ['Romance', 'CEO'],
  // Akun contoh sudah lama memakai aplikasi, jadi onboarding-nya sudah lewat.
  onboardedAt: iso(days(300)),
}

/** Dinaikkan bila bentuk seed berubah, supaya database lama ditulis ulang. */
const SEED_VERSION = 16

/**
 * Mengisi database bila kosong atau versinya usang.
 *
 * Idempoten: dipanggil berkali-kali tidak menggandakan baris. Dijalankan dalam
 * satu transaksi supaya tidak ada keadaan setengah-terisi kalau tab ditutup di
 * tengah proses.
 */
export async function seedIfNeeded(): Promise<void> {
  const stamp = await db.kv.get('seed:version')
  if (stamp?.value === SEED_VERSION) return

  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))

    await db.users.bulkAdd(users)
    await db.follows.bulkAdd(follows)
    await db.stories.bulkAdd([...catalogStories, ...myStories])
    await db.chapters.bulkAdd([...chapters, ...authorChapters])
    await db.chapterContents.bulkAdd(chapterContents)

    await db.ownerships.bulkAdd(ownerships)
    await db.libraryEntries.bulkAdd(libraryEntries)
    await db.progress.bulkAdd(progress)

    await db.wallets.add(wallet)
    await db.payMethods.bulkAdd(payMethods)
    await db.transactions.bulkAdd(transactions)
    await db.adQuotas.add(adQuota)

    await db.ratings.bulkAdd(ratings)
    await db.reviews.bulkAdd(reviews)
    await db.comments.bulkAdd(comments)

    await db.notifications.bulkAdd(notifications)
    await db.notificationPrefs.add(notificationPrefs)

    await db.authorProfiles.add(authorProfile)
    await db.printOrders.bulkAdd(printOrders)
    await db.scheduleEntries.bulkAdd(scheduleEntries)
    await db.withdrawals.bulkAdd(withdrawals)

    await db.rewards.add(rewards)
    await db.vouchers.bulkAdd(vouchers)

    await db.privacySettings.add(privacySettings)
    await db.readerPrefs.add(readerPrefs)
    await db.localeSettings.add(localeSettings)
    await db.deviceSessions.bulkAdd(deviceSessions)

    await db.kv.put({ key: 'seed:version', value: SEED_VERSION })
  })
}

/** Dipakai test dan tombol "reset data contoh" di halaman dev. */
export async function resetDatabase(): Promise<void> {
  await db.delete()
  await db.open()
  await seedIfNeeded()
}
