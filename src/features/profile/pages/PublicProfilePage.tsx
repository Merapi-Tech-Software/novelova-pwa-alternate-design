import { Check, X } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import type { PublicProfileTab } from '@/api/contracts'
import { Cover } from '@/components/patterns/Cover'
import { StarRating } from '@/components/patterns/StarRating'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { VISIBILITY_CATEGORIES } from '@/i18n/content'
import { t } from '@/i18n/t'
import { formatRelative } from '@/lib/format'
import { usePublicProfile, useToggleFollow } from '../hooks/useSettings'

const LABEL: Record<PublicProfileTab, string> = {
  activity: t('settings.tabActivity'),
  books: t('settings.tabBooks'),
  reviews: t('settings.tabReviews'),
}

/**
 * Profil pengguna lain `/pengguna/:userId` · FR-PROF-08 · FR-PROF-10.
 *
 * **Tabnya datang dari server**, bukan disaring di sini: kategori privasi yang
 * dimatikan membuat tabnya **hilang**, dan yang tahu nilai sakelarnya cuma
 * server. Layar yang menyaring sendiri akan merender tab yang isinya tidak
 * pernah datang — tab kosong, persis yang FR-PROF-10 larang.
 *
 * **Data dompet tidak pernah ada di halaman ini**, apa pun nilai sakelarnya. Itu
 * aturan platform, bukan preferensi, dan tab Visibility di bawah menyebutnya
 * terang supaya pembaca tahu itu memang tidak bisa dinyalakan.
 */
export default function PublicProfilePage() {
  const { userId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const profile = usePublicProfile(userId)
  const follow = useToggleFollow(['public-profile', userId])

  return (
    <div className="pb-8">
      <AsyncState
        loading={profile.isPending}
        error={profile.error}
        data={profile.data}
        onRetry={() => void profile.refetch()}
        empty={{ title: t('settings.noPublicTabs'), description: t('settings.noPublicTabsBody') }}
      >
        {(data) => {
          // Tab Visibility selalu ada — ia menjelaskan **kenapa** tab lain
          // hilang, jadi menyembunyikannya bersama yang lain justru menghapus
          // satu-satunya penjelasan yang tersisa.
          const tabs = [...data.tabs, 'visibility' as const]
          const aktif = tabs.includes((params.get('tab') ?? '') as never)
            ? (params.get('tab') as string)
            : (tabs[0] as string)

          return (
            <>
              <header className="px-4 pb-4">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="grid size-14 shrink-0 place-items-center rounded-nv-pill bg-nv-accent-soft font-display font-semibold text-nv-accent text-section"
                  >
                    {data.user.displayName.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-page font-semibold">
                      {data.user.displayName}
                    </h2>
                    <p className="text-caption text-nv-muted">@{data.user.username}</p>
                    {data.user.activity && (
                      <p className="pt-0.5 text-caption text-nv-muted">{data.user.activity}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={data.user.isFollowing ? 'secondary' : 'primary'}
                    disabled={follow.isPending}
                    onClick={() => follow.mutate(userId)}
                  >
                    {data.user.isFollowing ? t('settings.unfollow') : t('settings.follow')}
                  </Button>
                </div>

                <dl className="grid grid-cols-3 divide-x divide-nv-line pt-4 text-center">
                  <Statistik label={t('settings.followers')} value={data.followerCount} />
                  <Statistik label={t('settings.following')} value={data.followingCount} />
                  <Statistik label={t('settings.storiesRead')} value={data.storiesRead} />
                </dl>
              </header>

              <Tabs
                items={tabs.map((tab) => ({
                  value: tab,
                  label: tab === 'visibility' ? t('settings.tabVisibility') : LABEL[tab],
                }))}
                value={aktif}
                onChange={(next) => {
                  const q = new URLSearchParams(params)
                  q.set('tab', next)
                  setParams(q, { replace: true })
                }}
                label={t('settings.tabVisibility')}
                className="px-4"
              />

              <div className="px-4 pt-4">
                {aktif === 'activity' && (
                  <ul className="divide-y divide-nv-line">
                    {data.activity.map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                        <span className="min-w-0 truncate text-body text-nv-text">{row.text}</span>
                        <span className="shrink-0 text-caption text-nv-muted">
                          {formatRelative(new Date(row.at))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {aktif === 'books' && (
                  <ul className="grid grid-cols-3 gap-3">
                    {data.books.map((book) => (
                      <li key={book.storyId}>
                        <Link to={`/cerita/${book.storyId}`}>
                          <Cover src={book.coverUrl} title={book.title} />
                          <span className="line-clamp-2 pt-1.5 text-caption text-nv-text">
                            {book.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {aktif === 'reviews' && (
                  <ul className="divide-y divide-nv-line">
                    {data.reviews.map((review) => (
                      <li key={review.id} className="py-3">
                        <div className="flex items-center gap-2">
                          <StarRating value={review.stars} size={13} />
                          <span className="min-w-0 truncate text-caption text-nv-muted">
                            {review.storyTitle}
                          </span>
                        </div>
                        <p className="pt-1 font-display text-body text-nv-text-2">{review.text}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {/*
                  Tab Visibility menampilkan **keadaan nyata**, bukan teks statis
                  (FR-PROF-10). Dompet ikut ditampilkan justru karena ia selalu
                  mati: sakelar yang tidak pernah muncul membuat pembaca mengira
                  ia bisa dinyalakan di suatu tempat.
                */}
                {aktif === 'visibility' && (
                  <ul className="divide-y divide-nv-line">
                    {VISIBILITY_CATEGORIES.map((kategori) => {
                      const key = kategori.key as keyof typeof data.visibility
                      const tampil = data.visibility[key]
                      return (
                        <li key={kategori.key} className="flex items-start gap-3 py-3">
                          <span className="shrink-0 pt-0.5">
                            {tampil ? (
                              <Check size={16} className="text-nv-gold" aria-hidden />
                            ) : (
                              <X size={16} className="text-nv-muted" aria-hidden />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-body text-nv-text">{kategori.title}</span>
                            <span className="block pt-0.5 text-caption text-nv-muted">
                              {tampil ? t('settings.shownPublicly') : t('settings.hiddenByOwner')}
                              {' · '}
                              {kategori.control}
                            </span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {data.tabs.length === 0 && aktif === 'visibility' && (
                  <EmptyState
                    variant="no-results"
                    className="mt-6"
                    title={t('settings.noPublicTabs')}
                    description={t('settings.noPublicTabsBody')}
                  />
                )}
              </div>
            </>
          )
        }}
      </AsyncState>
    </div>
  )
}

function Statistik({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2">
      <dd className="font-display font-semibold text-nv-text text-section tabular-nums">{value}</dd>
      <dt className="pt-0.5 text-caption text-nv-muted">{label}</dt>
    </div>
  )
}
