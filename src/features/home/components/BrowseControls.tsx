import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import type { BrowseConfig } from '../browseConfig'
import { GENRE_OPTIONS } from '../browseConfig'

export interface BrowseFilters {
  sort: string
  chip: string
  /** Tab beranda — genre, atau "My Kisah" yang menyaring `Story.kind`. */
  tab: string
  extra: string
}

export interface BrowseControlsProps {
  config: BrowseConfig
  value: BrowseFilters
  onChange: (patch: Partial<BrowseFilters>) => void
}

/**
 * Kontrol lihat-semua · FR-HOME-11 · FR-HOME-14.
 *
 * Urutan dan chip selalu terlihat; dua penyaring bersembunyi di balik tombol
 * **Saring** seperti yang digambar kanvas. Bilahnya `sticky` supaya kontrolnya
 * tetap terjangkau saat daftar sudah panjang — daftar yang harus digulir ke
 * atas dulu sebelum bisa disaring adalah daftar yang tidak disaring siapa pun.
 *
 * Komponen ini tidak menyimpan apa pun: seluruh nilainya datang dari URL, dan
 * setiap perubahan dikembalikan lewat `onChange`.
 */
export function BrowseControls({ config, value, onChange }: BrowseControlsProps) {
  const [open, setOpen] = useState(false)
  const active = value.tab || value.extra ? 1 : 0

  return (
    <div className="-mx-4 mb-4 px-4">
      {/* `7d`: chip periode jadi **tab teks bergaris bawah**, bukan deret pil. */}
      <div className="flex gap-5 overflow-x-auto border-nv-line border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {config.chips.map((chip) => {
          const on = value.chip === chip.value
          return (
            <button
              key={chip.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange({ chip: chip.value })}
              className={cx(
                '-mb-px shrink-0 border-b-2 px-0.5 pt-1 pb-2.5 text-body transition',
                on
                  ? 'border-nv-accent font-bold text-nv-text'
                  : 'border-transparent font-medium text-nv-muted hover:text-nv-text-2',
              )}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* Kepala `URUTAN` + pengurut sebagai aksi emas rata kanan (`7d`). */}
      <SectionHeader
        label={t('home.sortLabel')}
        className="mt-4 mb-1"
        action={
          <span className="relative inline-flex shrink-0 items-center gap-1 font-bold text-caption text-nv-gold">
            {config.sorts.find((s) => s.value === value.sort)?.label ?? config.sorts[0]?.label}
            <ChevronDown size={12} aria-hidden />
            <select
              aria-label={t('home.sortLabel')}
              value={value.sort}
              onChange={(e) => onChange({ sort: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {config.sorts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </span>
        }
      />

      <div className="flex justify-end pt-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen((on) => !on)}
          aria-expanded={open}
          iconLeft={<SlidersHorizontal size={14} />}
        >
          {active > 0 ? t('home.filterActive') : t('home.filter')}
        </Button>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Select
            label={t('home.genreFilter')}
            value={value.tab}
            onChange={(e) => onChange({ tab: e.target.value })}
            options={[{ value: '', label: t('home.allGenres') }, ...GENRE_OPTIONS]}
          />
          {config.extra && (
            <Select
              label={config.extra.label}
              value={value.extra}
              onChange={(e) => onChange({ extra: e.target.value })}
              options={[
                { value: '', label: t('home.allOf')(config.extra.label) },
                ...config.extra.options,
              ]}
            />
          )}
        </div>
      )}
    </div>
  )
}
