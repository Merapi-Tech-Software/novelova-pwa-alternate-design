import { useRef } from 'react'
import { Slider, Switch } from '@/components/ui/Switch'
import { t } from '@/i18n/t'
import { useDismissable } from '@/lib/a11y'
import { READER_FONT_MAX, READER_FONT_MIN } from '@/lib/limits'
import { useReaderSettings } from '@/stores/readerSettings'

/**
 * Panel pengaturan baca · FR-READ-02 · FR-READ-03 · FR-READ-04.
 *
 * **`hidden` yang menentukan tampil-tidaknya**, bukan kelas CSS: dengan atribut
 * itu, panel yang tertutup benar-benar hilang dari pohon aksesibilitas, bukan
 * sekadar tak terlihat mata.
 *
 * Klik **di dalam** panel tidak menutupnya — sakelar ukuran huruf harus bisa
 * digeser berkali-kali tanpa panelnya kabur setiap kali. Di layar `≥1024` ia
 * menempel sebagai sidebar kanan, bukan popover yang menutupi teks yang sedang
 * dibaca.
 */
export function ReaderSettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLFieldSetElement>(null)
  const settings = useReaderSettings()

  useDismissable(ref, open, onClose, { onScroll: false })

  return (
    <fieldset
      ref={ref}
      hidden={!open}
      aria-label={t('reader.settings')}
      className="fixed inset-x-3 top-16 z-40 rounded-nv-lg border border-nv-line bg-nv-card p-4 shadow-nv lg:inset-x-auto lg:top-14 lg:right-0 lg:bottom-0 lg:w-72 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-none"
    >
      <p className="mb-3 font-display text-section font-semibold">{t('reader.settings')}</p>

      <Slider
        label={t('reader.fontSize')}
        min={READER_FONT_MIN}
        max={READER_FONT_MAX}
        value={settings.fontSize}
        valueText={`${settings.fontSize}px`}
        onChange={settings.setFontSize}
      />

      <div className="mt-4 space-y-4">
        <Switch
          checked={settings.darkTheme}
          onChange={settings.toggleDarkTheme}
          label={t('reader.darkTheme')}
          description={t('reader.darkThemeHint')}
        />
        <Switch
          checked={settings.autoUnlock}
          onChange={settings.toggleAutoUnlock}
          label={t('reader.autoUnlock')}
          description={t('reader.autoUnlockHint')}
        />
      </div>
    </fieldset>
  )
}
