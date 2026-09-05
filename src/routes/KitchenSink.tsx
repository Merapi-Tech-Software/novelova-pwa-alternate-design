import { useQuery } from '@tanstack/react-query'
import { Bookmark, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import type { ChapterSummary, Story, UserRowData } from '@/api/contracts'
import { PRINT_STAGES } from '@/api/contracts'
import { ApiError, VISIBLE_CODES } from '@/api/errors'
import { jumpAutoUnlockCountAsDev } from '@/api/mock/defaults'
import { setMockDraftSaveFails } from '@/api/mock/handlers/chapters'
import { approveAllPendingAsAdmin } from '@/api/mock/handlers/schedule'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { AdSlot } from '@/components/patterns/AdSlot'
import { ChapterRow } from '@/components/patterns/ChapterRow'
import { CoinChip } from '@/components/patterns/CoinChip'
import { Cover } from '@/components/patterns/Cover'
import { DangerZone } from '@/components/patterns/DangerZone'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { ReportSheet } from '@/components/patterns/ReportSheet'
import { ReviewStatusBadge } from '@/components/patterns/ReviewStatusBadge'
import { ScoreRing } from '@/components/patterns/ScoreRing'
import { SettingRow } from '@/components/patterns/SettingRow'
import { SpoilerVeil } from '@/components/patterns/SpoilerVeil'
import { StageTrack } from '@/components/patterns/StageTrack'
import { StarRating } from '@/components/patterns/StarRating'
import { StoryCard } from '@/components/patterns/StoryCard'
import { UserRow } from '@/components/patterns/UserRow'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, ProgressBar, Skeleton } from '@/components/ui/Card'
import { Badge, Chip } from '@/components/ui/Chip'
import { Confetti } from '@/components/ui/Confetti'
import { EmptyState } from '@/components/ui/EmptyState'
import { CharCounter, Input, SearchInput, Select, TextArea } from '@/components/ui/Field'
import { Modal, Sheet } from '@/components/ui/Modal'
import { Popover } from '@/components/ui/Popover'
import { SectionHeader, SeeAllAction } from '@/components/ui/SectionHeader'
import { Slider, Switch } from '@/components/ui/Switch'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { formatCompactCoin } from '@/lib/coin'
import { cx } from '@/lib/cx'
import { formatRelative, formatRupiah } from '@/lib/format'
import { setMockPaymentOutcome } from '@/payments/mock'
import { useApp } from '@/stores/app'
import { useSession } from '@/stores/session'

/**
 * Halaman uji visual untuk seluruh design system — **dev only**.
 *
 * Ia ada supaya tema gelap, keadaan fokus, dan varian komponen bisa diperiksa
 * dalam satu layar, bukan ditemukan rusak di layar ke-tiga puluh nanti.
 */

const DEMO_STORY: Story = {
  id: 's1',
  title: 'Cinta di Balik Kontrak',
  synopsis: 'Kaia datang untuk memperpanjang satu kontrak, dan pulang membawa perjanjian lain.',
  coverUrl: null,
  bannerUrl: null,
  authorId: 'a1',
  penName: 'Amelia Putri',
  genres: ['Romance', 'CEO'],
  tags: ['slow burn'],
  audience: 'Remaja',
  language: 'Indonesia',
  status: 'ongoing',
  kind: 'fiksi',
  review: 'published',
  rejectReason: null,
  visibility: 'public',
  monetizeType: 'partial',
  fullAccessCoins: 300,
  badge: 'HOT',
  updatedAt: '2026-08-24',
  commentsEnabled: true,
  moderateComments: false,
  allowTranslation: false,
  allowFanfiction: false,
  contentLabels: [],
  dedication: '',
  authorNote: '',
  stats: {
    reads: 985_000,
    saves: 128_000,
    rating: 4.8,
    ratingCount: 3_790,
    chapterCount: 120,
    readers: 412_000,
    coinsEarned: 92_000,
    weeklyReads: 24_000,
    commentCount: 3_204,
    unlockCount: 82_000,
  },
}

const DEMO_CHAPTERS: ChapterSummary[] = [
  {
    id: 's1-c3',
    storyId: 's1',
    number: 3,
    title: 'Nomor yang Tidak Tersimpan',
    access: 'free',
    priceCoins: 0,
    readMinutes: 7,
    state: 'published',
    review: 'published',
    publishAt: null,
    publishTz: null,
    wordCount: 1_200,
    owned: true,
    finished: true,
    withdrawnAt: null,
    editedAt: '2026-08-20T12:00:00.000Z',
    views: 14_200,
    rating: 4.8,
    commentCount: 318,
    previewPct: 20,
    accessChangedAt: null,
    privateReason: null,
    privateUntil: null,
  },
  {
    id: 's1-c4',
    storyId: 's1',
    number: 4,
    title: 'Tawaran di Lantai Tiga Puluh',
    access: 'paid',
    priceCoins: 1_500,
    readMinutes: 10,
    state: 'published',
    review: 'published',
    publishAt: null,
    publishTz: null,
    wordCount: 1_400,
    owned: false,
    finished: false,
    withdrawnAt: null,
    editedAt: '2026-08-20T12:00:00.000Z',
    views: 14_200,
    rating: 4.8,
    commentCount: 318,
    previewPct: 20,
    accessChangedAt: null,
    privateReason: null,
    privateUntil: null,
  },
]

const DEMO_USER: UserRowData = {
  id: 'f1',
  displayName: 'Rina Ayu',
  username: 'rinaayu',
  avatarUrl: null,
  role: 'reader',
  tier: 2,
  joinedYear: 2025,
  penName: null,
  activity: '412 bab tahun ini',
  isFollowing: false,
}

/**
 * Petak warna. Ada di sini, bukan di berkas token, supaya pergantian tema bisa
 * diperiksa dengan mata dalam satu tarikan — termasuk yang paling gampang
 * lolos: tinta metadata dan dua emas.
 */
const SWATCHES = [
  { name: 'text', className: 'bg-nv-text text-nv-card' },
  { name: 'text-2', className: 'bg-nv-text-2 text-nv-card' },
  { name: 'muted', className: 'bg-nv-muted text-nv-card' },
  { name: 'disabled', className: 'bg-nv-disabled text-nv-text' },
  { name: 'accent', className: 'bg-nv-accent text-nv-card' },
  { name: 'accent-soft', className: 'bg-nv-accent-soft text-nv-text' },
  { name: 'gold', className: 'bg-nv-gold text-nv-card' },
  { name: 'gold-line', className: 'bg-nv-gold-line text-nv-text' },
  { name: 'gold-soft', className: 'bg-nv-gold-soft text-nv-gold' },
  { name: 'card', className: 'bg-nv-card text-nv-text' },
  { name: 'paper', className: 'bg-nv-paper text-nv-text' },
  { name: 'paper-2', className: 'bg-nv-paper-2 text-nv-text' },
] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-section font-bold">{title}</h2>
      <Card className="space-y-3">{children}</Card>
    </section>
  )
}

export default function KitchenSink() {
  const missions = useQuery({ queryKey: ['dev', 'rewards'], queryFn: () => api.getRewards() })
  const toast = useToast()
  const [dark, setDark] = useState(false)
  const [tab, setTab] = useState<'semua' | 'gratis' | 'terkunci'>('semua')
  const [text, setText] = useState('')
  const [notify, setNotify] = useState(true)
  const [fontSize, setFontSize] = useState(18)
  const [modal, setModal] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [report, setReport] = useState(false)
  const [popover, setPopover] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [rating, setRating] = useState(0)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  return (
    <div className="space-y-6 pb-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption uppercase tracking-[0.18em] text-nv-muted">Dev</p>
          <h1 className="font-display text-page font-semibold">Kitchen sink</h1>
          <p className="text-body text-nv-muted">
            Semua komponen dalam satu halaman. Ganti tema untuk memeriksa kontras.
          </p>
        </div>
        <IconButton label={dark ? 'Mode terang' : 'Mode gelap'} onClick={() => setDark((d) => !d)}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
      </header>

      <Section title="Putaran 7 — dasar">
        <SectionHeader label="POPULAR" action={<SeeAllAction>See all</SeeAllAction>} />
        <div className="grid grid-cols-4 gap-3">
          <Cover title="Cinta di Balik Kontrak" badge="#1 Popular" />
          <Cover title="Perjanjian Musim Hujan" badge="#2 Popular" />
          <Cover title="Rahasia Lantai Dua Belas" badge="Hot" />
          <Cover title="“Senja” yang Tertunda" />
        </div>
        <p className="text-caption text-nv-muted">
          Sampul tanpa artwork memakai jaket satu huruf. Huruf keempat diambil dari huruf pertama
          yang <em>terlihat</em> — bukan tanda kutipnya.
        </p>

        <div className="space-y-1 border-nv-line border-t pt-3">
          <p className="font-display text-section">Serif — judul, isi bab, isi komentar</p>
          <p className="text-body text-nv-muted">
            Sans — label, metadata, tombol, chip, penghitung
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 border-nv-line border-t pt-3 text-caption">
          {SWATCHES.map(({ name, className }) => (
            <span
              key={name}
              className={cx(
                'rounded-nv-sm border border-nv-line px-2 py-1 font-semibold',
                className,
              )}
            >
              {name}
            </span>
          ))}
        </div>
        <p className="text-caption text-nv-muted">
          Dua emas, dua tugas: <span className="font-bold text-nv-gold">teks</span> memakai
          <code className="px-1">--nv-gold</code>, garis dan batang progres memakai
          <code className="px-1">--nv-gold-line</code>. Menukarnya membuat setiap angka koin,
          rating, dan harga gagal AA sekaligus.
        </p>
      </Section>

      <Section title="Tombol">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Aksi utama</Button>
          <Button variant="secondary">Sekunder</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Bahaya</Button>
          <Button loading>Memuat</Button>
          <Button disabled>Nonaktif</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Kecil</Button>
          <Button size="md">Sedang</Button>
          <Button size="lg">Besar</Button>
          <IconButton label="Simpan">
            <Bookmark size={16} />
          </IconButton>
        </div>
      </Section>

      <Section title="Chip, badge, koin">
        <div className="flex flex-wrap gap-2">
          <Chip selected onClick={() => {}}>
            Romance
          </Chip>
          <Chip onClick={() => {}}>Mystery</Chip>
          <Chip>Statis</Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">Populer</Badge>
          <Badge tone="success">Tersimpan</Badge>
          <Badge tone="warning">Menunggu</Badge>
          <Badge tone="danger">Ditolak</Badge>
          <Badge tone="info">Info</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <CoinChip amount={15_300} />
          <CoinChip amount={1_500} format="exact" />
          <span className="text-body text-nv-muted">
            {formatCompactCoin(985_230)} baca · {formatRupiah(148_000)}
          </span>
        </div>
      </Section>

      <Section title="Masukan">
        <Tabs
          label="Saringan bab"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'semua', label: 'Semua', count: 120 },
            { value: 'gratis', label: 'Gratis', count: 3 },
            { value: 'terkunci', label: 'Terkunci', count: 117 },
          ]}
        />
        <SearchInput label="Cari cerita" value={text} onChange={setText} />
        <Input
          label="Judul"
          placeholder="Judul cerita"
          counter={<CharCounter value={text} max={100} />}
        />
        <TextArea
          label="Sinopsis"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          counter={<CharCounter value={text} max={1_000} min={50} />}
          hint="Minimal 50 karakter."
        />
        <Input label="Nama pena" error="Nama pena wajib diisi" />
        <Select
          label="Genre utama"
          options={['Romance', 'Mystery', 'Fantasy', 'Drama', 'Thriller']}
        />
        <Switch
          checked={notify}
          onChange={setNotify}
          label="Pemberitahuan bab baru"
          description="Kirim notifikasi saat penulis merilis bab"
        />
        <Switch
          checked
          lockedOn
          onChange={() => {}}
          label="Peringatan keamanan"
          description="Tidak bisa dimatikan"
        />
        <Slider
          label="Ukuran teks"
          min={14}
          max={24}
          value={fontSize}
          onChange={setFontSize}
          valueText={`${fontSize} piksel`}
        />
      </Section>

      <Section title="Empat tingkat kegagalan">
        <FailureNotice level="inline" title="Sinopsis minimal 50 karakter · sekarang 44" />
        <FailureNotice level="toast" title="Gagal menyimpan penanda" onRetry={() => {}} />
        <FailureNotice
          level="inset"
          title="Bagian rekomendasi tidak bisa dimuat"
          body="Permintaannya tidak sampai ke server."
          safety="Tidak ada data yang berubah."
          onRetry={() => {}}
          code="HOME-503 · rekomendasi · 21.44 WIB"
        />
        <p className="text-caption text-nv-muted">
          Tekan "Coba lagi" tiga kali — labelnya naik jadi "Coba sekali lagi".
        </p>
      </Section>

      <Section title="Kegagalan yang menyentuh uang">
        <FailureNotice
          level="inset"
          title="Pembayaran belum bisa dipastikan"
          body="Penyedia pembayaran tidak menjawab dalam 90 detik."
          safety="Jangan bayar dua kali. Kalau dananya sudah terpotong, koin masuk otomatis dalam 10 menit."
          code={`${VISIBLE_CODES.PAY_UNCONFIRMED} · GoPay · 21.44 WIB`}
          actions={
            <>
              <Button size="sm" variant="secondary">
                Periksa status
              </Button>
              <Button size="sm" variant="ghost">
                Buka riwayat
              </Button>
            </>
          }
        />
      </Section>

      <Section title="Kosong ≠ gagal">
        <EmptyState
          title="Perpustakaanmu masih kosong"
          description="Cerita yang kamu simpan muncul di sini, lengkap dengan posisi baca terakhir."
          action={{ label: 'Jelajahi cerita', onClick: () => {} }}
          secondary={<span>atau lihat kategori populer</span>}
          icon={<Bookmark size={20} />}
        />
        <EmptyState
          variant="no-results"
          title="Tidak ada hasil untuk saringan ini"
          description="Coba longgarkan saringannya."
          action={{ label: 'Hapus semua saringan', onClick: () => {} }}
          icon={<Search size={20} />}
        />
      </Section>

      <Section title="Sesi (dev)">
        <p className="text-body text-nv-muted">
          Perangkat ini dimulai dalam keadaan sudah masuk sebagai akun contoh. Tiga tombol di bawah
          memunculkan keadaan yang kalau tidak begitu hanya terjadi berhari-hari sekali — dan
          karenanya tidak pernah sempat diperiksa.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void api.logout().then(() => useSession.getState().clearSession())
            }}
          >
            Keluar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => useSession.getState().requireReauth()}
          >
            Sesi berakhir (AUTH-401)
          </Button>
          <Button variant="secondary" size="sm" onClick={() => useApp.getState().markOutdated()}>
            Versi kedaluwarsa (APP-426)
          </Button>
        </div>
      </Section>

      <Section title="Pembayaran (dev)">
        <p className="text-body text-nv-muted">
          Jawaban penyedia tiruan untuk pembayaran berikutnya. Ketiga jalan gagalnya hanya terjadi
          berbulan-bulan sekali di dunia nyata — tanpa sakelar ini tidak satu pun layarnya pernah
          sempat diperiksa. Setelah memilih, buka <code>/koin</code> dan bayar.
        </p>
        <div className="flex flex-wrap gap-2">
          {(['paid', 'declined', 'unconfirmed'] as const).map((outcome) => (
            <Button
              key={outcome}
              variant="secondary"
              size="sm"
              onClick={() => setMockPaymentOutcome(outcome)}
            >
              {outcome === 'paid'
                ? 'Lunas'
                : outcome === 'declined'
                  ? 'Ditolak bank (PAY-402)'
                  : 'Tidak dijawab (PAY-504)'}
            </Button>
          ))}
        </div>

        <p className="pt-3 text-body text-nv-muted">
          Autosave naskah bab. `DRAFT-409` baru muncul setelah **empat** kegagalan berturut-turut —
          mustahil dipicu dengan tangan di server tiruan yang selalu berhasil.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMockDraftSaveFails(true)}>
            Autosave gagal (DRAFT-409)
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMockDraftSaveFails(false)}>
            Autosave normal
          </Button>
        </div>

        <p className="pt-3 text-body text-nv-muted">
          Keputusan admin atas antrean tinjauan. Penulis tidak boleh menyetujui karyanya sendiri,
          jadi ini **bukan** metode seam — tanpa tombolnya, antrean tinjauan adalah layar yang tidak
          pernah bisa kosong.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void approveAllPendingAsAdmin().then(() => window.location.reload())}
          >
            Setujui seluruh antrean
          </Button>
        </div>

        {/*
          Pita tawaran bundel · FR-READ-19 · §1.21. Tanpa tombol ini pitanya
          nyaris tidak pernah terlihat saat dicoba dengan tangan: saldo contoh
          15.300 habis di bab ke-12, **dua bab sebelum ambang sepuluh**.
        */}
        <p className="pt-3 text-body text-nv-muted">
          Melompatkan penghitung buka-otomatis <code>s1</code> ke ambangnya, lalu buka bab berbayar
          mana pun di cerita itu — pitanya muncul di pembuka bab.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              void jumpAutoUnlockCountAsDev('s1', CURRENT_USER_ID).then(() =>
                window.location.reload(),
              )
            }
          >
            Siapkan tawaran bundel (s1)
          </Button>
        </div>

        {/* Progres misi · FR-SOCIAL-08. Pusat hadiah baru dibangun di Fase 12,
            jadi tanpa panel ini rantai e2e #5 tidak bisa diperiksa sampai
            ujungnya — alasan yang sama dengan tombol admin di atas. */}
        <p className="pt-3 text-body text-nv-muted">
          Progres misi harian. Layarnya menyusul di Fase 12; ini jendela sementara ke angkanya.
        </p>
        <ul className="text-body tabular-nums">
          {(missions.data?.missions ?? []).map((mission) => (
            <li key={mission.id}>
              {mission.title} · {mission.progress}/{mission.target}
              {mission.claimedAt ? ' · sudah diklaim' : ''}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="AsyncState">
        <AsyncState
          loading={false}
          error={new ApiError('NETWORK', 'Bagian ini tidak bisa dimuat')}
          data={undefined}
          onRetry={() => {}}
          empty={{ title: 'Kosong', description: 'Tidak dipakai di contoh ini' }}
        >
          {() => null}
        </AsyncState>
        <Skeleton lines={3} />
        <ProgressBar value={0.42} label="Progres baca" showValue />
      </Section>

      <Section title="Pola cerita">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StoryCard story={DEMO_STORY} />
        </div>
        <StoryCard story={DEMO_STORY} variant="list" progress={0.375} />
        <div className="divide-y divide-nv-line">
          {DEMO_CHAPTERS.map((c) => (
            <ChapterRow key={c.id} chapter={c} />
          ))}
        </div>
      </Section>

      <Section title="Sosial">
        <div className="flex flex-wrap items-center gap-5">
          <StarRating value={4.8} showValue />
          <StarRating value={rating} onChange={setRating} />
        </div>
        <SpoilerVeil>
          <p className="text-body">
            Yang menandatangani kontrak kedua ternyata bukan Arga, dan itu menjelaskan seluruh bab
            30.
          </p>
        </SpoilerVeil>
        <UserRow user={DEMO_USER} onToggleFollow={() => {}} />
        <div className="flex flex-wrap gap-2">
          <ReviewStatusBadge state="in_review" />
          <ReviewStatusBadge state="rejected" reason="Bab 3 memuat kutipan tanpa sumber." />
        </div>
        <AdSlot />
      </Section>

      <Section title="Penulis">
        <StageTrack stages={PRINT_STAGES} current={3} />
        <div className="flex flex-wrap items-center gap-6">
          <ScoreRing score={72} label="Skor perlindungan" />
          <ScoreRing score={92} label="Skor perlindungan" size={72} />
        </div>
        <div className="rounded-nv-md border border-nv-line">
          <SettingRow
            title="Bahasa aplikasi"
            description="Bahasa Indonesia"
            to="/dev/kitchen-sink"
          />
          <SettingRow
            title="Peringatan masuk"
            description="Kirim email saat ada perangkat baru"
            control={<Switch checked hideLabel onChange={() => {}} label="Peringatan masuk" />}
          />
          <SettingRow
            title="Hapus akun"
            description="Masa tenggang 30 hari"
            tone="danger"
            onClick={() => {}}
          />
        </div>
        <DangerZone
          confirmPhrase="Cinta di Balik Kontrak"
          actions={[
            {
              id: 'archive',
              label: 'Arsipkan cerita',
              consequence: 'Hilang dari katalog, pembeli lama tetap bisa membaca.',
              onConfirm: () => toast.show('Cerita diarsipkan.'),
            },
            {
              id: 'delete',
              label: 'Hapus cerita',
              consequence: '120 bab dan 985rb pembaca dihapus permanen.',
              onConfirm: () => toast.show('Cerita dihapus.', { tone: 'danger' }),
            },
          ]}
        />
      </Section>

      <Section title="Overlay & umpan balik">
        <div className="relative flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setModal(true)}>
            Modal
          </Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Sheet
          </Button>
          <Button variant="secondary" onClick={() => setReport(true)}>
            Lembar laporan
          </Button>
          <Button variant="secondary" onClick={() => setPopover((p) => !p)}>
            Popover
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.show('Penanda tersimpan.', { tone: 'success' })}
          >
            Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setConfetti(true)
              window.setTimeout(() => setConfetti(false), 100)
            }}
          >
            Konfeti
          </Button>
          <Popover
            open={popover}
            onClose={() => setPopover(false)}
            label="Contoh popover"
            align="left"
          >
            <p className="text-caption text-nv-muted">
              Klik di dalam tidak menutup panel. Gulir halaman menutupnya.
            </p>
          </Popover>
        </div>
        <p className="text-caption text-nv-muted">
          Terakhir diperbarui {formatRelative(new Date(Date.now() - 12 * 60_000))}
        </p>
      </Section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Konfirmasi"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Batal
            </Button>
            <Button onClick={() => setModal(false)}>Lanjutkan</Button>
          </>
        }
      >
        <p className="text-body text-nv-muted">
          Fokus terkunci di dalam dialog ini. Escape menutupnya, dan fokus kembali ke tombol pemicu.
        </p>
      </Modal>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Buka bab ini?"
        footer={<Button onClick={() => setSheet(false)}>Buka — 1.500 koin</Button>}
      >
        <p className="text-body text-nv-muted">
          Naik dari bawah di HP, jadi dialog terpusat mulai lebar 640px.
        </p>
      </Sheet>

      <ReportSheet
        open={report}
        onClose={() => setReport(false)}
        targetLabel="komentar ini"
        onSubmit={() => {
          setReport(false)
          toast.show('Laporan terkirim.')
        }}
      />

      <Confetti active={confetti} />
    </div>
  )
}
