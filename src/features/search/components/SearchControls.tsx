import { ChevronDown, X } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
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

/**
 * Satu pil saringan · `7e`.
 *
 * `<select>` aslinya dibiarkan hidup dan ditumpuk transparan di atas pil: yang
 * terlihat pil, yang ditekan tetap kontrol peramban. Menggantinya dengan menu
 * buatan sendiri berarti menulis ulang navigasi papan ketik, pencarian
 * ketik-huruf, dan perilaku layar sentuh — tiga hal yang sudah benar.
 */
function FilterPill({
  label,
  value,
  options,
  selected,
  onChange,
}: {
  label: string
  value: string
  options: readonly { value: string; label: string }[] | readonly string[]
  selected: boolean
  onChange: (next: string) => void
}) {
  const shown = options.find((o) => (typeof o === 'string' ? o : o.value) === value)
  const text = shown ? (typeof shown === 'string' ? shown : shown.label) : label

  return (
    <span
      className={cx(
        'relative inline-flex shrink-0 items-center gap-1.5 rounded-nv-pill border px-3.5 py-2 text-caption font-semibold transition',
        selected
          ? 'border-nv-accent bg-nv-accent text-nv-card'
          : 'border-nv-line-soft bg-nv-card text-nv-text-2',
      )}
    >
      {text}
      <ChevronDown size={12} aria-hidden />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          return (
            <option key={v} value={v}>
              {l}
            </option>
          )
        })}
      </select>
    </span>
  )
}

export function SearchControls({ sort, filters, onChange }: SearchControlsProps) {
  const active = FILTER_PARAMS.filter((param) => filters[param])

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-nv-line border-b bg-nv-bg/95 px-4 pb-3 backdrop-blur">
      {/*
        `7e`: satu baris pil mendatar yang bisa digulir, bukan empat select
        bertumpuk. Tiap pil membungkus `<select>` asli — labelnya terlihat di
        permukaan pil, kontrolnya tetap kontrol asli peramban, jadi papan ketik
        dan pembaca layar tetap mendapat menu yang sama.
      */}
      <div className="flex gap-2 overflow-x-auto pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          {
            param: 'sort' as const,
            label: t('home.sortLabel'),
            value: sort,
            options: SEARCH_SORTS,
          },
        ].map((f) => (
          <FilterPill key={f.param} {...f} onChange={(v) => onChange({ sort: v })} selected />
        ))}
        {FILTER_PARAMS.map((param) => (
          <FilterPill
            key={param}
            label={FILTER_LABEL[param]}
            value={filters[param]}
            selected={Boolean(filters[param])}
            options={[
              { value: '', label: t('home.allOf')(FILTER_LABEL[param]) },
              ...FILTER_OPTIONS[param],
            ]}
            onChange={(v) => onChange({ [param]: v })}
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
