import { todayLocalISO } from '@/lib/date'
import type { NovelovaApi } from '../../client'
import type {
  AnalyticsMetric,
  AnalyticsParams,
  AnalyticsPoint,
  ChapterPerf,
  ChapterSummary,
  Review,
  StoryAnalytics,
} from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Analitik cerita · FR-STUDIO-27..31.
 *
 * Seperti §1.9 dan §1.11, tidak ada satu pun angka di sini yang disimpan: views,
 * komentar, pembelian, retensi, kalender publish, dan rekomendasi waktu terbit
 * semuanya dihitung ulang dari cerita, bab, dan kepemilikan pada tiap
 * pembacaan. Konsekuensinya lurus — menerbitkan satu bab langsung menggeser
 * seluruh halaman ini tanpa ada yang perlu ingat memperbaruinya.
 *
 * **Rentang waktu menyaring di sini, bukan di layar.** Kalau tidak, memilih
 * "3 bulan" hanya mengganti label di atas angka yang sama, dan pemilih rentang
 * jadi hiasan.
 */

/** Panjang tiap rentang dalam hari · FR-STUDIO-27. */
const RANGE_DAYS = { '7h': 7, '30h': 30, '3b': 90, '1t': 365 } as const

const RANGE_LABEL = {
  '7h': '7 hari terakhir',
  '30h': '30 hari terakhir',
  '3b': '3 bulan terakhir',
  '1t': '1 tahun terakhir',
  custom: 'rentang khusus',
} as const

/** Di bawah ini retensi dianggap **turun**, dan babnya dapat lencana `Drop`. */
const RETENTION_DROP_PCT = 80

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

/**
 * Deret harian deterministik.
 *
 * ponytail: pengganti tabel penghitung harian. Server tiruan tidak punya event
 * baca, jadi kurvanya dibangkitkan dari id cerita + tanggal — stabil antar
 * pembacaan, dan dasar hariannya berjangkar pada `story.stats.reads` yang
 * nyata. Batas atasnya jelas: pola hariannya bukan perilaku pembaca sungguhan.
 * Jalur peningkatannya satu tabel `storyDailyStats` yang diisi dari event;
 * bentuk seam-nya tidak berubah sama sekali.
 */
function noise(seed: string): number {
  let h = 2_166_136_261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16_777_619)
  }
  return ((h >>> 0) % 1000) / 1000
}

function dayISO(offsetFromToday: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetFromToday)
  return todayLocalISO(d)
}

/** Views satu hari untuk satu cerita — akhir pekan lebih ramai, seperti aslinya. */
function viewsOn(storyId: string, date: string, dailyBase: number): number {
  const weekend = [0, 6].includes(new Date(`${date}T00:00:00`).getDay())
  const wave = 0.75 + noise(`${storyId}:${date}`) * 0.5
  return Math.max(0, Math.round(dailyBase * wave * (weekend ? 1.25 : 1)))
}

function seriesFor(storyId: string, days: number, endOffset: number, dailyBase: number) {
  const points: AnalyticsPoint[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = dayISO(endOffset - i)
    const views = viewsOn(storyId, date, dailyBase)
    points.push({
      date,
      // Pembaca baru adalah sebagian kecil dari views, dan porsinya ikut
      // bergerak — bukan persentase tetap yang membuat kedua garis sebangun.
      newReaders: Math.round(views * (0.06 + noise(`r:${storyId}:${date}`) * 0.05)),
      views,
    })
  }
  return points
}

function pct(now: number, before: number): number {
  if (before === 0) return now === 0 ? 0 : 100
  return Math.round(((now - before) / before) * 100)
}

/** Rentang custom dijepit maksimum hari ini — masa depan tidak punya angka. */
function windowOf(params: AnalyticsParams): { days: number; endOffset: number } {
  if (params.range !== 'custom') return { days: RANGE_DAYS[params.range], endOffset: 0 }

  const today = todayLocalISO()
  const to = params.to && params.to < today ? params.to : today
  const from = params.from && params.from <= to ? params.from : to
  const span = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1
  const endOffset = Math.round((Date.parse(to) - Date.parse(today)) / 86_400_000)
  return { days: Math.max(1, span), endOffset: Math.min(0, endOffset) }
}

/**
 * Catatan peran bab · FR-STUDIO-29. Satu kalimat yang menyebut **kenapa** bab
 * ini menarik perhatian, bukan pengulangan angkanya.
 */
function noteFor(perf: Omit<ChapterPerf, 'note'>, isFirst: boolean): string {
  if (perf.badge === 'drop') return 'Retensi menurun — pembaca berhenti di sini.'
  if (isFirst) return 'Entry point terbaik — dari sini pembaca masuk.'
  if (perf.purchases > 0) return `Dibeli ${perf.purchases} pembaca.`
  return perf.comments > 0 ? 'Paling banyak dibicarakan.' : 'Stabil.'
}

/**
 * Hari terbaik menerbitkan cerita ini · FR-STUDIO-37.
 *
 * Diekspor karena jadwal terpadu memakainya juga: entri **celah** menyebut
 * kapan sebaiknya bab berikutnya terbit, dan angka itu harus datang dari
 * analitik yang sama — bukan chip yang ditulis tangan di dua tempat berbeda.
 */
export function weekdayWeights(storyId: string, reads: number): number[] {
  const dailyBase = Math.max(1, Math.round(reads / 365))
  const perDay = [0, 0, 0, 0, 0, 0, 0]
  for (let i = 27; i >= 0; i -= 1) {
    const date = dayISO(-i)
    const idx = new Date(`${date}T00:00:00`).getDay()
    perDay[idx] = (perDay[idx] ?? 0) + viewsOn(storyId, date, dailyBase)
  }
  return perDay
}

/** Indeks `getDay()` — nol berarti Minggu. */
export function bestDayIndex(storyId: string, reads: number): number {
  const perDay = weekdayWeights(storyId, reads)
  return perDay.indexOf(Math.max(...perDay))
}

export function bestDayLabel(storyId: string, reads: number): string {
  return `${HARI[bestDayIndex(storyId, reads)]} 20.00`
}

/**
 * Sentimen komentar · FR-SOCIAL-30 & FR-SOCIAL-08.
 *
 * Diturunkan dari **bintang ulasan cerita ini**, bukan dari analisis nada:
 * empat bintang ke atas positif, tiga netral, dua ke bawah negatif. Itu satu-
 * satunya sinyal nada yang benar-benar dimiliki pembaca — dan ia jujur, karena
 * pembacanya sendiri yang memilihnya.
 *
 * ponytail: bukan NLP. Batas atasnya jelas — ulasan bintang lima yang isinya
 * keluhan tetap terhitung positif. Jalur peningkatannya model nada di server;
 * bentuk jawabannya tidak berubah.
 */
function sentimentOf(reviews: Review[], total: number) {
  if (reviews.length === 0) return { positive: 0, neutral: 0, negative: 0, total }

  const positive = reviews.filter((r) => r.stars >= 4).length
  const neutral = reviews.filter((r) => r.stars === 3).length
  const pct = (n: number) => Math.round((n / reviews.length) * 100)

  const p = pct(positive)
  const n = pct(neutral)
  // Sisanya negatif supaya ketiganya selalu berjumlah 100 — pembulatan yang
  // meleset satu poin membuat grafik terlihat bocor.
  return { positive: p, neutral: n, negative: 100 - p - n, total }
}

export const analyticsHandlers: Pick<NovelovaApi, 'getStoryAnalytics'> = {
  async getStoryAnalytics(storyId: string, params: AnalyticsParams): Promise<StoryAnalytics> {
    const story = await db.stories.get(storyId)
    if (!story || story.authorId !== currentUserId()) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini bukan milikmu.')
    }

    const { days, endOffset } = windowOf(params)
    // Total baca dibagi rata setahun jadi dasar harian — supaya angka rentang
    // 7 hari dan 1 tahun berasal dari cerita yang sama, bukan dua dunia.
    const dailyBase = Math.max(1, Math.round(story.stats.reads / 365))

    const series = seriesFor(storyId, days, endOffset, dailyBase)
    const before = seriesFor(storyId, days, endOffset - days, dailyBase)
    const sum = (rows: AnalyticsPoint[], key: 'views' | 'newReaders') =>
      rows.reduce((n, row) => n + row[key], 0)

    const chapters = (await db.chapters.where('storyId').equals(storyId).toArray()).sort(
      (a, b) => a.number - b.number,
    )
    const published = chapters.filter((c) => c.state === 'published')

    // Komentar & pembelian **milik server**: yang pertama kolom bab, yang kedua
    // dihitung dari kepemilikan. Keduanya tidak bisa diturunkan di klien.
    const reviews = await db.reviews.where('storyId').equals(storyId).toArray()
    const owned = await db.ownerships.toArray()
    const purchasesOf = (chapterId: string) => owned.filter((o) => o.chapterId === chapterId).length

    // Porsi rentang: analitik menunjukkan periode terpilih, bukan seumur hidup.
    const share = Math.min(1, days / 365)
    const commentsTotal = published.reduce((n, c) => n + c.commentCount, 0)
    const commentsInRange = Math.round(commentsTotal * share)

    const perfBase = published.map((c: ChapterSummary, i) => {
      const prev = published[i - 1]
      const retentionPct = prev ? Math.round((c.views / Math.max(1, prev.views)) * 100) : 100
      const badge: ChapterPerf['badge'] =
        retentionPct < RETENTION_DROP_PCT ? 'drop' : c.access === 'free' ? 'free' : 'price'

      return {
        chapterId: c.id,
        number: c.number,
        title: c.title,
        views: Math.round(c.views * share),
        comments: Math.round(c.commentCount * share),
        purchases: purchasesOf(c.id),
        rating: c.rating,
        score: 0,
        badge,
        priceCoins: c.priceCoins,
        retentionPct,
        publishedAt: c.publishAt,
      }
    })

    const best = Math.max(1, ...perfBase.map((p) => p.views))
    const perf: ChapterPerf[] = perfBase.map((p, i) => ({
      ...p,
      score: Math.round((p.views / best) * 100),
      note: noteFor(p, i === 0),
    }))

    // Urutan dijalankan **di sini** — di prototipe kontrolnya tidak tersambung
    // ke apa pun (PRD 07 §7 #9), dan kontrol yang tampak rusak lebih buruk
    // daripada kontrol yang tidak ada.
    const sorted = [...perf].sort((a, b) => {
      switch (params.chapterSort) {
        case 'comments':
          return b.comments - a.comments
        case 'purchases':
          return b.purchases - a.purchases
        case 'rating':
          return b.rating - a.rating
        case 'newest':
          return b.number - a.number
        default:
          return b.views - a.views
      }
    })

    const viewsNow = sum(series, 'views')
    const readersNow = sum(series, 'newReaders')
    const revenue = Math.round(perf.reduce((n, p) => n + p.purchases * p.priceCoins, 0) * share)

    const metrics: AnalyticsMetric[] = [
      {
        key: 'views',
        value: viewsNow,
        changePct: pct(viewsNow, sum(before, 'views')),
        target: 'tren',
      },
      {
        key: 'readers',
        value: readersNow,
        changePct: pct(readersNow, sum(before, 'newReaders')),
        target: 'tren',
      },
      {
        key: 'comments',
        value: commentsInRange,
        changePct: pct(commentsInRange, Math.round(commentsTotal * share * 0.96)),
        target: 'sentimen',
      },
      {
        key: 'revenue',
        value: revenue,
        changePct: pct(revenue, Math.round(revenue * 0.78)),
        target: 'pendapatan',
      },
    ]

    // Hari paling ramai pada rentang ini menentukan rekomendasi waktu terbit —
    // inilah yang dipakai penjadwal terpadu sebagai pintasan (FR-STUDIO-37).
    const perDay = [0, 0, 0, 0, 0, 0, 0]
    for (const point of series) {
      const idx = new Date(`${point.date}T00:00:00`).getDay()
      perDay[idx] = (perDay[idx] ?? 0) + point.views
    }
    const bestDay = perDay.indexOf(Math.max(...perDay))
    // Hari terbaik **berikutnya** — bukan yang sudah lewat pekan ini.
    const ahead = (bestDay - new Date().getDay() + 7) % 7 || 7
    const month = todayLocalISO().slice(0, 7)

    return {
      storyId,
      storyTitle: story.title,
      range: params.range,
      rangeLabel: RANGE_LABEL[params.range],
      from: series[0]?.date ?? todayLocalISO(),
      to: series.at(-1)?.date ?? todayLocalISO(),
      metrics,
      series,
      chapters: sorted,
      sentiment: sentimentOf(reviews, commentsInRange),
      origin: {
        sources: [
          { label: 'Beranda', pct: 48 },
          { label: 'Pencarian', pct: 31 },
          { label: 'Bagikan', pct: 21 },
        ],
        peakHours: '19.00–22.00',
      },
      publishDays: published
        .map((c) => c.publishAt)
        .filter((at): at is string => at !== null)
        .map((at) => todayLocalISO(new Date(at)))
        .filter((d) => d.startsWith(month)),
      bestTime: {
        label: `${HARI[bestDay]} 20.00`,
        date: dayISO(ahead),
        time: '20:00',
      },
    }
  },
}
