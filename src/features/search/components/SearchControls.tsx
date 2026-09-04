import { X } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { Select } from '@/components/ui/Field'
import { t } from '@/i18n/t'
import {
  FILTER_LABEL,
  FILTER_OPTIONS,
  FILTER_PARAMS,
  type FilterParam,
  SEARCH_SORTS,
} from '../searchConfig'

export interface SearchControlsProps {
  sort: string
  filters: Record<FilterParam, string>
  onChange: (patch: Record<string, string>) => void
}

/**
 * Bilah urutan & saringan · FR-SRCH-04.
 *
 * Bentuknya sengaja sama dengan bilah halaman lihat-semua \u2014 `sticky` dengan
 * latar buram \u2014 karena keduanya melakukan hal yang sama; dua bilah kontrol yang
 * berbeda rupa untuk pekerjaan yang sama membuat pembaca belajar dua kali.
 *
 * **Saringan aktif tampil sebagai pil yang bisa dilepas satu per satu.** Tanpa
 * itu, satu-satunya cara membatalkan sebuah saringan adalah membuka kembali
 * dropdown-nya dan mencari pilihan kosong \u2014 dan pembaca yang tidak sadar sedang
 * menyaring akan menyimpulkan katalognya yang kosong.
 */
export function SearchControls({ sort, filters, onChange }: SearchControlsProps) {
  const active = FILTER_PARAMS.filter((param) => filters[param])

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-nv-line border-b bg-nv-bg/95 px-4 pb-3 backdrop-blur">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label={t('home.sortLabel')}
          value={sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          options={SEARCH_SORTS}
        />
        {FILTER_PARAMS.map((param) => (
          <Select
            key={param}
            label={FILTER_LABEL[param]}
            value={filters[param]}
            onChange={(e) => onChange({ [param]: e.target.value })}
            options={[
              { value: '', label: t('home.allOf')(FILTER_LABEL[param]) },
              ...FILTER_OPTIONS[param],
            ]}
          />
        ))}
      </div>

      {active.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {active.map((param) => (
            <Chip key={param} selected onClick={() => onChange({ [param]: '' })}>
              {FILTER_LABEL[param]}: {filters[param]}
              <X size={12} aria-hidden />
              <span className="sr-only">{t('search.removeFilter')(FILTER_LABEL[param])}</span>
            </Chip>
          ))}
          <button
            type="button"
            onClick={() => onChange(Object.fromEntries(FILTER_PARAMS.map((p) => [p, ''])))}
            className="text-caption font-semibold text-nv-muted underline underline-offset-4"
          >
            {t('action.clearFilters')}
          </button>
        </div>
      )}
    </div>
  )
}
