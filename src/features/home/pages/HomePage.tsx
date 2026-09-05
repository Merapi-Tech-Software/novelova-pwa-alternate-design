import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { Story } from '@/api/contracts'
import { AdSlot } from '@/components/patterns/AdSlot'
import { CoinChip } from '@/components/patterns/CoinChip'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { EmptyState } from '@/components/ui/EmptyState'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import type { SectionKey } from '@/stores/homeSections'
import { useHomeSections } from '@/stores/homeSections'
import { useSession } from '@/stores/session'
import { BannerCarousel } from '../components/BannerCarousel'
import { CoverZoom, type CoverZoomTarget } from '../components/CoverZoom'
import { GenreTabs } from '../components/GenreTabs'
import { SectionSettings } from '../components/SectionSettings'
import { SectionSkeleton, StorySection } from '../components/StorySection'
import { useGenreTabs, useHomeFeed } from '../hooks/useHomeFeed'

/**
 * Sakelar FR-HOME-06 memakai `data-target` prototipe; ini jembatannya.
 *
 * Blok tetap punya sakelarnya masing-masing; **seluruh section tematik berbagi
 * satu sakelar** (`sec-toprom`, bekas Romansa Teratas). Kalau tiap section
 * tematik punya sakelar sendiri, daftarnya ikut berubah tiap ganti tab dan
 * tumbuh jadi puluhan — dan sakelar yang datang-pergi bukan pengaturan.
 *
 * `sec-editor` dipertahankan walau section-nya kini "Paling Banyak Dibuka":
 * mengganti kuncinya membuang pilihan yang sudah tersimpan di perangkat.
 */
const SWITCH_OF: Record<string, SectionKey> = {
  banner: 'sec-banner',
  populer: 'sec-popular',
  terbaru: 'sec-trending',
  terbuka: 'sec-editor',
  'lanjut-baca': 'sec-continue',
}

/**
 * Beranda · FR-HOME-01 · FR-HOME-04 · FR-HOME-13.
 *
 * Tab aktif hidup di URL, bukan di penyimpanan: pilihannya **sementara per
 * kunjungan** (FR-HOME-13), tetapi tombol kembali dan tautan yang dibagikan
 * tetap membawa saringan yang sama.
 */
/**
 * Bentuk `IconButton` varian ghost, untuk ikon yang sebenarnya tautan.
 *
 * Tanpa kotak sejak putaran 7 (`7a`): ikon di kepala berdiri sendiri. Target
 * ketuknya tetap 44px lewat `size-11` — yang hilang cuma garisnya.
 */
const ICON_LINK =
  'grid size-11 shrink-0 place-items-center rounded-nv-pill text-nv-text transition hover:bg-nv-accent-soft'

/**
 * Tiga section prioritas, di paling atas dan **tidak ikut tersaring tab**
 * (`architecture.md` §1.22). Id-nya, bukan judulnya: judul berganti mengikuti
 * tab sejak Fase 3b.
 */
const PRIORITAS = ['populer', 'terbaru', 'terbuka']

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab')
  const tabs = useGenreTabs()
  const feed = useHomeFeed(tab)
  const profile = useSession((s) => s.profile)
  const wallet = useWallet()
  const visible = useHomeSections((s) => s.visible)
  const [zoom, setZoom] = useState<CoverZoomTarget | null>(null)

  /** Sampul ditekan · §1.22. `origin` dipakai sebagai titik tumbuh animasinya. */
  const buka: (story: Story, origin: HTMLElement) => void = (story, origin) =>
    setZoom({ story, origin })

  function pickTab(next: string | null) {
    setParams(
      (current) => {
        const draft = new URLSearchParams(current)
        if (next) draft.set('tab', next)
        else draft.delete('tab')
        return draft
      },
      { replace: true },
    )
  }

  // Dua penyaring bertumpuk, dan keduanya berbeda arti: server membuang section
  // yang **kosong**, pengguna membuang section yang **tidak ia inginkan**.
  const sections = (feed.data?.sections ?? []).filter(
    (s) => visible[SWITCH_OF[s.id] ?? 'sec-toprom'],
  )
  const banner = sections.find((s) => s.id === 'banner')
  const prioritas = sections.filter((s) => PRIORITAS.includes(s.id))
  const lanjut = sections.find((s) => s.id === 'lanjut-baca')
  // Ekor yang **benar-benar tersaring tab** — satu-satunya kelompok yang isinya
  // berubah saat pembaca menekan tab genre.
  const ekor = sections.filter(
    (s) => !PRIORITAS.includes(s.id) && s.id !== 'banner' && s.id !== 'lanjut-baca',
  )
  /*
   * Keadaan kosong dinilai dari **ekor saja**, dan sejak §1.22 itu bukan lagi
   * penghalusan: tiga section prioritas kini selalu ada di tab mana pun, jadi
   * menilainya dari seluruh feed membuat pesan "genre ini belum ada isinya"
   * tidak pernah muncul — dan genre kosong berubah jadi halaman yang diam-diam
   * terlihat normal.
   */
  const adaIsi = ekor.length > 0

  return (
    <div>
      {/* Sapaan dan baris ikon berbagi satu baris; **subjudulnya turun ke bawah
          keduanya** dan memakai lebar penuh (`7a`). Menaruh subjudul di dalam
          kolom kiri membuatnya terjepit chip koin + tiga ikon dan pecah jadi
          dua baris di 390px. */}
      <header className="mb-5">
        <div className="flex items-center justify-between gap-2">
          {/* Tanpa `truncate`, dan mengecil di bawah 360px: di 320 baris ikon
              memakan 192px, dan sapaan yang dipotong jadi `Hi,…` adalah `<h1>`
              halaman yang hilang — lebih buruk daripada huruf yang lebih kecil. */}
          <h1 className="min-w-0 font-display text-section font-bold min-[360px]:text-page">
            {t('home.greeting')(profile?.displayName.split(' ')[0] ?? 'Pembaca')}
          </h1>

          {/* Urutan ikon mengikat: Cari → Notifikasi → Pengaturan (FR-HOME-01).
            Dua yang pertama **tautan**, bukan tombol: keduanya berpindah halaman,
            jadi klik-tengah dan "buka di tab baru" harus tetap bekerja. */}
          <div className="flex shrink-0 items-center gap-0.5">
            {/* Chip saldo — titik saldo "beranda" FR-WALLET-17 sejak `7a`
              memindahkannya dari FAB ke kepala. Angkanya dari `useWallet` yang
              sama dengan ruang baca dan halaman isi koin. */}
            {wallet.data && (
              <CoinChip
                amount={wallet.data.balance}
                size="sm"
                className="mr-1 rounded-nv-pill border border-nv-line-soft px-2.5 py-1.5"
              />
            )}
            <Link
              to="/cari"
              aria-label={t('home.search')}
              title={t('home.search')}
              className={ICON_LINK}
            >
              <Search size={18} aria-hidden />
            </Link>
            <Link
              to="/notifikasi"
              aria-label={t('home.notifications')}
              title={t('home.notifications')}
              className={ICON_LINK}
            >
              <Bell size={18} aria-hidden />
            </Link>
            <SectionSettings />
          </div>
        </div>
        <p className="pt-0.5 text-body text-nv-muted">{t('home.greetingSub')}</p>
      </header>

      {/*
        Susunan `architecture.md` §1.22: **tiga section prioritas lebih dulu**,
        lalu banner, lalu tab genre, lalu ekor yang tersaring, lalu bacaan
        pribadi. Tab duduk di bawah ketiga section teratas justru karena
        ketiganya berhenti tersaring — kalau tidak, menekannya akan mengubah isi
        yang berada di luar layar.
      */}
      {feed.isPending && (
        <>
          <SectionSkeleton />
          <SectionSkeleton />
        </>
      )}

      {feed.isError && (
        <FailureNotice
          level="inset"
          title={t('failure.genericTitle')}
          body={t('failure.genericBody')}
          safety={t('failure.genericSafe')}
          onRetry={() => void feed.refetch()}
        />
      )}

      {/*
        **Tiga section teratas bersih dari iklan** — permintaan produk 5
        September. Kedua slotnya pindah ke bawah tab genre; jumlahnya di halaman
        tetap dua, hanya tidak ada lagi yang mendahului banner.
      */}
      {prioritas.map((section) => (
        <StorySection key={section.id} section={section} tab={tab} onCoverClick={buka} />
      ))}

      {banner && <BannerCarousel stories={banner.stories} />}

      {visible['sec-genres'] && (
        <div className="mb-5">
          <GenreTabs tabs={tabs} value={tab} onChange={pickTab} />
        </div>
      )}

      {feed.isSuccess && !adaIsi && (
        <EmptyState
          variant="no-results"
          title={t('home.noGenreResultsTitle')}
          description={t('home.noGenreResultsBody')}
          action={{ label: t('home.backToAll'), onClick: () => pickTab(null) }}
        />
      )}

      {ekor.map((section, i) => (
        <div key={section.id}>
          <StorySection section={section} tab={tab} onCoverClick={buka} />
          {i === 0 && visible['sec-ad1'] && (
            <AdSlot
              variant="slim"
              className="mb-4"
              title={t('home.adSlimTitle')}
              actionLabel={t('home.adSlimAction')}
              onClick={() => {}}
            />
          )}
          {i === 1 && visible['sec-ad2'] && (
            <AdSlot
              variant="native"
              className="mb-4"
              title={t('home.adNativeTitle')}
              source={t('home.adNativeSource')}
            />
          )}
        </div>
      ))}

      {lanjut && <StorySection section={lanjut} tab={tab} />}

      {zoom && <CoverZoom target={zoom} onClose={() => setZoom(null)} />}
    </div>
  )
}
