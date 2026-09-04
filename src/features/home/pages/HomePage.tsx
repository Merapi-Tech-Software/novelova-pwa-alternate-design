import { Bell, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { AdSlot } from '@/components/patterns/AdSlot'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/i18n/t'
import type { SectionKey } from '@/stores/homeSections'
import { useHomeSections } from '@/stores/homeSections'
import { useSession } from '@/stores/session'
import { BannerCarousel } from '../components/BannerCarousel'
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
/** Bentuk `IconButton` varian ghost, untuk ikon yang sebenarnya tautan. */
const ICON_LINK =
  'grid size-9 shrink-0 place-items-center rounded-nv-pill border border-nv-line bg-nv-card text-nv-muted transition hover:text-nv-accent-strong'

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab')
  const tabs = useGenreTabs()
  const feed = useHomeFeed(tab)
  const profile = useSession((s) => s.profile)
  const visible = useHomeSections((s) => s.visible)

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
  // Keadaan kosong dinilai dari section **discovery** saja: Continue Reading
  // tidak ikut tersaring, jadi kehadirannya tidak berarti tab ini punya isi.
  const hasDiscovery = sections.some((s) => s.seeAll !== null)

  return (
    <div>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-page font-bold">
            {t('home.greeting')(profile?.displayName.split(' ')[0] ?? 'Pembaca')}
          </h1>
          <p className="text-body text-nv-muted">{t('home.greetingSub')}</p>
        </div>

        {/* Urutan ikon mengikat: Cari → Notifikasi → Pengaturan (FR-HOME-01).
            Dua yang pertama **tautan**, bukan tombol: keduanya berpindah halaman,
            jadi klik-tengah dan "buka di tab baru" harus tetap bekerja. */}
        <div className="flex shrink-0 items-center gap-1">
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
      </header>

      {visible['sec-genres'] && (
        <div className="mb-5">
          <GenreTabs tabs={tabs} value={tab} onChange={pickTab} />
        </div>
      )}

      {banner && <BannerCarousel stories={banner.stories} />}

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

      {feed.isSuccess && !hasDiscovery && (
        <EmptyState
          variant="no-results"
          title={t('home.noGenreResultsTitle')}
          description={t('home.noGenreResultsBody')}
          action={{ label: t('home.backToAll'), onClick: () => pickTab(null) }}
        />
      )}

      {sections
        .filter((section) => section.id !== 'banner')
        .map((section) => (
          <div key={section.id}>
            <StorySection section={section} tab={tab} />

            {/* Slot iklan menempel pada section di atasnya (FR-HOME-05). */}
            {section.id === 'populer' && visible['sec-ad1'] && (
              <AdSlot
                variant="slim"
                className="mb-7"
                title={t('home.adSlimTitle')}
                actionLabel={t('home.adSlimAction')}
                onClick={() => {}}
              />
            )}
            {section.id === 'terbuka' && visible['sec-ad2'] && (
              <AdSlot
                variant="native"
                className="mb-7"
                title={t('home.adNativeTitle')}
                source={t('home.adNativeSource')}
              />
            )}
          </div>
        ))}
    </div>
  )
}
