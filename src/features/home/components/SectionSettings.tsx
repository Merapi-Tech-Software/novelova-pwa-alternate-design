import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { IconButton } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { t } from '@/i18n/t'
import { type SectionKey, useHomeSections } from '@/stores/homeSections'

/**
 * Sembilan blok beranda, urutannya persis urutan tampilnya di layar. Label dan
 * keterangannya dari mockup `7s` — ia yang menentukan copy.
 */
/**
 * Urutannya **mengikuti halaman**, bukan urutan historis kuncinya.
 *
 * Disusun ulang di §1.22 bersama berandanya: daftar sakelar yang urutannya beda
 * dari halaman yang diaturnya memaksa pembaca mencocokkan dua daftar di kepala,
 * dan itu bukan pengaturan. Kuncinya sendiri **tidak** diganti — mengganti
 * `sec-editor` jadi sesuatu yang lebih cocok akan membuang pilihan yang sudah
 * tersimpan di perangkat.
 */
const ROWS: Array<[key: SectionKey, label: string, hint: string]> = [
  ['sec-popular', 'Populer', 'Kurasi terlaris'],
  ['sec-trending', 'Baru & Naik Cepat', 'Cerita yang sedang naik'],
  ['sec-editor', 'Paling Banyak Dibuka', 'Bab yang dibuka pakai koin'],
  ['sec-banner', 'Banner', 'Carousel setelah tiga section teratas'],
  ['sec-genres', 'Genre', 'Deret kategori'],
  ['sec-toprom', 'Section tematik', 'Kurasi mengikuti tab genre'],
  ['sec-ad1', 'Iklan banner', 'Slot setelah section tematik pertama'],
  ['sec-ad2', 'Iklan native', 'Slot setelah section tematik kedua'],
  ['sec-continue', 'Lanjut Membaca', 'Progres bacaan kamu'],
]

/**
 * Pengaturan tampil/sembunyi section · FR-HOME-06 · FR-HOME-16 · mockup `7s`.
 *
 * **Lembar, bukan popover.** Sembilan baris berlabel serif dengan keterangannya
 * masing-masing tidak muat di popover sudut layar, dan `7s` menggambarnya naik
 * dari dasar layar menutupi separuh beranda.
 *
 * **Kesembilan pilihan selalu ada di daftar ini**, termasuk blok yang sedang
 * kosong dan karena itu tidak tampil di beranda: pengaturan pengguna dan
 * keadaan kosong adalah dua hal berbeda, dan sakelar yang menghilang saat
 * datanya kebetulan kosong terbaca sebagai pengaturan yang hilang.
 *
 * Tidak ada tombol Simpan — tiap sakelar langsung menulis. `Selesai` hanya
 * menutup, dan itulah kenapa ia tidak pernah bisa membatalkan apa pun.
 */
export function SectionSettings() {
  const [open, setOpen] = useState(false)
  const visible = useHomeSections((s) => s.visible)
  const toggle = useHomeSections((s) => s.toggle)
  const reset = useHomeSections((s) => s.reset)

  return (
    <>
      <IconButton
        label={t('home.sectionSettings')}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal size={20} />
      </IconButton>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('home.sectionsTitle')}
        footer={
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-nv-pill bg-nv-accent px-5 py-3 text-body font-bold text-nv-card"
            >
              {t('home.sectionsDone')}
            </button>
            <button
              type="button"
              onClick={reset}
              className="shrink-0 text-body font-bold text-nv-muted"
            >
              {t('home.sectionsReset')}
            </button>
          </div>
        }
      >
        <p className="-mt-1 pb-1 text-caption text-nv-muted">{t('home.sectionsHint')}</p>

        <ul className="divide-y divide-nv-line">
          {ROWS.map(([key, label, hint]) => (
            <li key={key} className="flex items-center gap-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="font-display text-card font-semibold">{label}</p>
                <p className="pt-0.5 text-caption text-nv-muted">{hint}</p>
              </div>
              <Switch checked={visible[key]} onChange={() => toggle(key)} label={label} hideLabel />
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  )
}
