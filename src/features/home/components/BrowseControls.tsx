import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Select } from '@/components/ui/Field'
import { t } from '@/i18n/t'
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
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-nv-line border-b bg-nv-bg/95 px-4 pb-3 backdrop-blur">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Select
            label={t('home.sortLabel')}
            value={value.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
            options={config.sorts}
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => setOpen((on) => !on)}
          aria-expanded={open}
          iconLeft={<SlidersHorizontal size={15} />}
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

      <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {config.chips.map((chip) => (
          <Chip
            key={chip.value}
            selected={value.chip === chip.value}
            onClick={() => onChange({ chip: chip.value })}
          >
            {chip.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
