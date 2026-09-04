import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { SettingRow } from '@/components/patterns/SettingRow'
import { IconButton } from '@/components/ui/Button'
import { Popover } from '@/components/ui/Popover'
import { Switch } from '@/components/ui/Switch'
import { t } from '@/i18n/t'
import { type SectionKey, useHomeSections } from '@/stores/homeSections'

/**
 * Sembilan blok beranda, urutannya persis urutan tampilnya di layar. Label dan
 * keterangannya dari kanvas — ia yang menentukan copy.
 */
const ROWS: Array<[key: SectionKey, label: string, hint: string]> = [
  ['sec-banner', 'Banner', 'Carousel bagian atas'],
  ['sec-genres', 'Genre', 'Deret kategori'],
  ['sec-popular', 'Populer', 'Kurasi terlaris'],
  ['sec-ad1', 'Iklan banner', 'Slot setelah Populer'],
  ['sec-trending', 'Baru & Naik Cepat', 'Cerita yang sedang naik'],
  ['sec-editor', 'Paling Banyak Dibuka', 'Bab yang dibuka pakai koin'],
  ['sec-ad2', 'Iklan native', 'Slot setelah Paling Banyak Dibuka'],
  ['sec-toprom', 'Section tematik', 'Kurasi mengikuti tab genre'],
  ['sec-continue', 'Lanjut Membaca', 'Progres bacaan kamu'],
]

/**
 * Pengaturan tampil/sembunyi section · FR-HOME-06 · FR-HOME-16.
 *
 * **Kesembilan pilihan selalu ada di daftar ini**, termasuk blok yang sedang
 * kosong dan karena itu tidak tampil di beranda: pengaturan pengguna dan
 * keadaan kosong adalah dua hal berbeda, dan sakelar yang menghilang saat
 * datanya kebetulan kosong terbaca sebagai pengaturan yang hilang.
 *
 * Tidak ada tombol Simpan — tiap sakelar langsung menulis.
 */
export function SectionSettings() {
  const [open, setOpen] = useState(false)
  const visible = useHomeSections((s) => s.visible)
  const toggle = useHomeSections((s) => s.toggle)

  return (
    <div className="relative">
      <IconButton
        label={t('home.sectionSettings')}
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((on) => !on)}
      >
        <SlidersHorizontal size={18} />
      </IconButton>

      <Popover open={open} onClose={() => setOpen(false)} label={t('home.sectionsTitle')}>
        <p className="font-display text-section font-semibold">{t('home.sectionsTitle')}</p>
        <p className="pt-0.5 pb-2 text-caption text-nv-muted">{t('home.sectionsHint')}</p>

        <ul className="divide-y divide-nv-line-soft">
          {ROWS.map(([key, label, hint]) => (
            <li key={key}>
              <SettingRow
                title={label}
                description={hint}
                control={
                  <Switch
                    checked={visible[key]}
                    onChange={() => toggle(key)}
                    label={label}
                    hideLabel
                  />
                }
              />
            </li>
          ))}
        </ul>
      </Popover>
    </div>
  )
}
