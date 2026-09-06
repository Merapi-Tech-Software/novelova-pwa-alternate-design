import { useSearchParams } from 'react-router'
import type { ListParams } from '@/api/contracts'
import { UserRow } from '@/components/patterns/UserRow'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Tabs'
import { t } from '@/i18n/t'
import { useConnections, useToggleFollow } from '../hooks/useSettings'

const PAGE_SIZE = 20

/** Dua tab · FR-PROF-09. Yang terbuka ditentukan statistik mana yang ditekan. */
const TABS = [
  { value: 'followers', label: t('settings.followers') },
  { value: 'following', label: t('settings.following') },
] as const

/**
 * Pengikut & mengikuti `/profil/koneksi` · FR-PROF-09.
 *
 * Tab, pencarian, dan halaman **hidup di URL**: menekan "Pengikut" di profil
 * membuka tab yang benar lewat `?tab=followers`, dan tombol kembali peramban
 * mengembalikan keadaan yang sama.
 *
 * Menyaring dan memaginasi **di server** — daftar yang disaring di layar
 * berhenti benar begitu ada halaman kedua, dan halaman kedua muncul di 21 baris.
 */
export default function ConnectionsPage() {
  const [params, setParams] = useSearchParams()

  const tab = params.get('tab') === 'following' ? 'following' : 'followers'
  const q = params.get('q') ?? ''
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)

  const listParams: ListParams = { page: 1, pageSize: page * PAGE_SIZE, q }
  const query = useConnections(tab, listParams)
  const follow = useToggleFollow(['connections', tab, listParams])

  function ubah(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <div className="pb-8">
      <Tabs
        items={TABS.map((item) => ({ value: item.value, label: item.label }))}
        value={tab}
        onChange={(next) => ubah({ tab: next })}
        label={t('settings.connections')}
        className="px-4"
      />

      {/* Pencarian dalam daftar · FR-PROF-09. Muncul begitu daftarnya panjang —
          kotak cari di atas tiga baris hanya menambah kontrol tanpa gunanya. */}
      {(query.data?.total ?? 0) > 20 || q !== '' ? (
        <div className="px-4 pt-3">
          <SearchInput
            value={q}
            onChange={(next) => ubah({ q: next })}
            label={t('settings.searchConnections')}
            placeholder={t('settings.searchConnections')}
          />
        </div>
      ) : null}

      <AsyncState
        loading={query.isPending}
        error={query.error}
        data={query.data}
        isEmpty={(paged) => paged.items.length === 0}
        onRetry={() => void query.refetch()}
        empty={
          q === ''
            ? {
                variant: 'first-run',
                title: t('settings.connectionsEmpty'),
                description: t('settings.connectionsEmptyBody'),
              }
            : {
                variant: 'no-results',
                title: t('settings.noSearchResults'),
                description: t('settings.connectionsEmptyBody'),
                action: { label: t('action.clearFilters'), onClick: () => ubah({ q: null }) },
              }
        }
      >
        {(paged) => (
          <>
            <ul className="divide-y divide-nv-line pt-2">
              {paged.items.map((row) => (
                <li key={row.id} className="px-4">
                  <UserRow
                    user={row}
                    onToggleFollow={(userId) => follow.mutate(userId)}
                    pending={follow.isPending}
                  />
                </li>
              ))}
            </ul>

            {paged.hasMore && (
              <div className="px-4 pt-4">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    const next = new URLSearchParams(params)
                    next.set('page', String(page + 1))
                    setParams(next, { replace: true })
                  }}
                >
                  {t('settings.loadMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </AsyncState>
    </div>
  )
}
