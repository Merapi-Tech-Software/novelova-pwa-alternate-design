import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { PAGE_SIZE } from '@/lib/limits'
import { SearchInput } from '../ui/Field'
import { type TabItem, Tabs } from '../ui/Tabs'

/**
 * Kerangka daftar tersaring: cari + tab + urut + penghitung + keadaan kosong.
 *
 * **Digerakkan server, bukan DOM.** Prototipe punya tiga cara berbeda
 * menyembunyikan baris (`style.display`, kelas `hidden`, kelas `removed`) di
 * tiga halaman berpola sama (PRD 07 §7 #14). Yang lebih penting: katalog
 * ratusan cerita tidak akan sanggup disaring dari DOM (FR-LIB-11, prd_11 §7 #1).
 *
 * Jadi komponen ini **tidak menyaring apa pun.** Ia menyimpan saringan di URL —
 * sehingga tombol back mengembalikan hasil dan tautannya bisa dibagikan — lalu
 * merender apa pun yang dikembalikan kueri berpaginasi.
 */

export interface FilterableListProps<T extends string> {
  /** Kata benda untuk penghitung: `"cerita"` → `"1 cerita"` / `"6 cerita"`. */
  noun: string
  total: number
  tabs?: readonly TabItem<T>[]
  tabsLabel?: string
  sorts?: readonly { value: string; label: string }[]
  searchLabel?: string
  searchPlaceholder?: string
  /**
   * Benar bila daftar **benar-benar** kosong, bukan sekadar tersaring kosong.
   * Saat itu kontrol cari dan saring disembunyikan — tidak ada gunanya menyaring
   * nol baris (FR-CORE-02, FR-LIB-12).
   */
  pristine?: boolean
  /**
   * Berapa baris yang **benar-benar dirender** sekarang. Halaman yang memuat
   * bertahap melewati angkanya; tanpa itu keterangannya tetap berbunyi
   * "menampilkan 20" setelah pembaca menekan "Muat lagi" tiga kali.
   */
  shown?: number
  children: ReactNode
}

export interface ListQuery {
  q: string
  tab: string
  sort: string
  page: number
}

/** Membaca saringan aktif dari URL. Dipakai hook feature untuk membangun kueri. */
export function useListQuery(defaults: Partial<ListQuery> = {}): ListQuery {
  const [params] = useSearchParams()
  return {
    q: params.get('q') ?? defaults.q ?? '',
    tab: params.get('tab') ?? defaults.tab ?? 'all',
    sort: params.get('sort') ?? defaults.sort ?? 'terbaru',
    page: Number(params.get('page') ?? defaults.page ?? 1),
  }
}

export function FilterableList<T extends string>({
  noun,
  total,
  tabs,
  tabsLabel = 'Saringan',
  sorts,
  searchLabel = 'Cari',
  searchPlaceholder,
  pristine = false,
  shown = PAGE_SIZE,
  children,
}: FilterableListProps<T>) {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const tab = (params.get('tab') ?? tabs?.[0]?.value ?? '') as T
  const sort = params.get('sort') ?? sorts?.[0]?.value ?? ''

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    // Mengubah saringan selalu kembali ke halaman pertama.
    next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <div className="space-y-3">
      {!pristine && (
        <>
          <SearchInput
            label={searchLabel}
            value={q}
            onChange={(v) => update('q', v)}
            {...(searchPlaceholder ? { placeholder: searchPlaceholder } : {})}
          />

          {tabs && tabs.length > 0 && (
            <Tabs items={tabs} value={tab} onChange={(v) => update('tab', v)} label={tabsLabel} />
          )}

          <div className="flex items-center justify-between gap-3">
            {/* Bahasa Indonesia tidak punya bentuk jamak — satu string cukup. */}
            <p className="text-caption text-nv-muted tabular-nums">
              {total} {noun}
            </p>

            {sorts && sorts.length > 0 && (
              <label className="flex items-center gap-2 text-caption text-nv-muted">
                Urutkan
                <select
                  value={sort}
                  onChange={(e) => update('sort', e.target.value)}
                  className="rounded-nv-sm border border-nv-line bg-nv-card px-2 py-1 text-caption"
                >
                  {sorts.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </>
      )}

      {children}

      {total > shown && (
        <p className="pt-2 text-center text-caption text-nv-muted">
          Menampilkan {Math.min(total, shown)} dari {total}
        </p>
      )}
    </div>
  )
}
