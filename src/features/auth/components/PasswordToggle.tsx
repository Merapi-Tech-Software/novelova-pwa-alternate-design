import { t } from '@/i18n/t'

/**
 * Sakelar "Lihat / Sembunyikan" kata sandi · FR-AUTH-01, FR-AUTH-05.
 *
 * **Teks tebal tinta redup, bukan kotak di samping kolom.** Sampai R8 ia berupa
 * tombol bergaris rambut setinggi 44px yang berdiri di sebelah kolom, dan itu
 * salah dua kali: brief §1 menempatkan aksi tersier sebagai teks, dan kotak
 * setinggi itu di samping kolom yang hanya bergaris bawah membuat garis
 * bawahnya berhenti di tengah baris.
 *
 * Tempatnya di slot `counter` milik `Field` — sejajar label, di ujung kanan.
 * Slot itu memang untuk keterangan sebaris label, dan memakainya di sini berarti
 * nol gaya baru. Kotak sentuh 44px lewat `nv-tap`, bukan lewat ukuran yang
 * terlihat (`prd_01` §0.9).
 */
export function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={show}
      className="nv-tap text-caption font-semibold text-nv-muted hover:text-nv-text"
    >
      {show ? t('auth.hide') : t('auth.show')}
    </button>
  )
}
