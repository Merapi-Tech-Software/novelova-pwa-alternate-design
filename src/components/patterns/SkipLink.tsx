import { t } from '@/i18n/t'

/**
 * Lompat ke isi · WCAG 2.4.1 (Bypass Blocks) · audit Fase 14.
 *
 * Halaman bernavigasi menaruh sidebar atau bilah atas **sebelum** isinya di
 * urutan DOM. Bagi pemakai papan ketik dan pembaca layar itu berarti menekan Tab
 * belasan kali di setiap halaman untuk sampai ke hal yang ia datangi — tiap
 * kali, di tiap halaman.
 *
 * **Digeser keluar layar, bukan `sr-only`.** Keduanya menyembunyikan; bedanya
 * `not-sr-only` juga menyetel `padding: 0`, jadi tautan yang muncul kembali
 * datang setinggi 22px — terukur — dan target 22px melanggar aturan 44px yang
 * dijaga di tempat lain (§1.23). Menggeser dengan `translate` tidak menyentuh
 * kotaknya sama sekali: yang terlihat saat difokuskan persis yang dirancang.
 *
 * `fixed`, bukan `absolute`: tidak ada leluhur berposisi di atasnya, dan
 * halaman yang sudah digulir jauh tidak boleh memunculkannya di luar layar.
 *
 * Sasarannya `#konten`, id yang dipasang keempat layout pada `<main>`-nya —
 * `tabIndex={-1}` di sana yang membuat fokusnya benar-benar berpindah, bukan
 * cuma titik awal Tab berikutnya.
 */
export function SkipLink() {
  return (
    <a
      href="#konten"
      className="fixed top-2 left-2 z-[60] inline-flex min-h-11 items-center rounded-nv-md bg-nv-accent px-4 font-semibold text-body text-nv-card transition-transform -translate-y-[150%] focus:translate-y-0"
    >
      {t('a11y.skipToContent')}
    </a>
  )
}
