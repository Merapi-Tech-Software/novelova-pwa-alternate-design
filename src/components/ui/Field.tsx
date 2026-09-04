import { Search, X } from 'lucide-react'
import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'
import { cx } from '@/lib/cx'

/**
 * Dua bentuk kolom, brief §1 — dan pembagiannya bukan selera:
 *
 * - **Satu baris → garis bawah 1,5px, teks serif.** Judul cerita, nama pena,
 *   kode voucher, jumlah penarikan: semuanya isian pendek yang dibaca sebagai
 *   *isi*, bukan sebagai kontrol.
 * - **Banyak baris → kotak garis rambut membulat.** Sinopsis dan catatan
 *   penulis butuh batas yang terlihat karena tingginya berubah-ubah.
 *
 * Berbeda dari versi sebelumnya, keduanya **tidak** mematikan `outline`: dengan
 * kolom yang hanya bergaris bawah, perubahan warna garis saja terlalu tipis
 * sebagai satu-satunya penanda fokus.
 */
const CONTROL_LINE =
  'w-full border-nv-line-input border-b-[1.5px] bg-transparent px-0 py-2 font-display text-card ' +
  'placeholder:font-ui placeholder:text-body placeholder:text-nv-disabled focus:border-nv-accent ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const CONTROL_BOX =
  'w-full rounded-nv-md border border-nv-line-soft bg-nv-card px-3.5 py-2.5 font-display text-card ' +
  'placeholder:font-ui placeholder:text-body placeholder:text-nv-disabled focus:border-nv-accent ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

interface FieldShellProps {
  label: string
  /**
   * `| undefined` ditulis eksplisit karena `exactOptionalPropertyTypes` aktif:
   * ia membedakan "prop tidak dioper" dari "dioper bernilai undefined". Untuk
   * prop tampilan keduanya sama saja, dan tanpa ini setiap pemanggil harus
   * menulis spread bersyarat.
   */
  hint?: string | undefined
  /**
   * Pesan kesalahan **inline** — menempel di kolomnya, sisa formulir tidak
   * bergerak (arch §1.4 tingkat pertama).
   */
  error?: string | undefined
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode
  /** Penghitung karakter di kanan label, mis. `"25/100"`. */
  counter?: ReactNode | undefined
}

function FieldShell({ label, hint, error, counter, children }: FieldShellProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-body font-semibold">
          {label}
        </label>
        {counter}
      </div>
      {children({ id, describedBy })}
      {error ? (
        <p id={errorId} className="mt-1.5 text-caption font-semibold text-nv-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-caption text-nv-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  counter?: ReactNode
  /**
   * React 19 memperlakukan `ref` sebagai prop biasa, jadi tidak perlu
   * `forwardRef` — tapi tetap harus disebut di tipe. Dipakai kolom yang harus
   * difokuskan pemanggilnya, mis. kode voucher (FR-DETAIL-09).
   */
  ref?: Ref<HTMLInputElement>
}

export function Input({ label, hint, error, counter, className, ref, ...rest }: InputProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} counter={counter}>
      {({ id, describedBy }) => (
        <input
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(CONTROL_LINE, error && 'border-nv-danger', className)}
          {...rest}
        />
      )}
    </FieldShell>
  )
}

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  /**
   * Sama alasannya dengan `Input`: React 19 memperlakukan `ref` sebagai prop
   * biasa. Dipakai bilah alat pemformatan editor bab, yang perlu tahu di mana
   * kursornya untuk menyisipkan penanda markdown.
   */
  ref?: Ref<HTMLTextAreaElement>
  label: string
  hint?: string
  error?: string
  counter?: ReactNode
}

export function TextArea({ label, hint, error, counter, className, ref, ...rest }: TextAreaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} counter={counter}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          ref={ref}
          rows={5}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(CONTROL_BOX, 'resize-y', error && 'border-nv-danger', className)}
          {...rest}
        />
      )}
    </FieldShell>
  )
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  options: readonly string[] | readonly { value: string; label: string }[]
}

export function Select({ label, hint, error, options, className, ...rest }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(CONTROL_LINE, 'cursor-pointer', error && 'border-nv-danger', className)}
          {...rest}
        >
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.value
            const text = typeof opt === 'string' ? opt : opt.label
            return (
              <option key={value} value={value}>
                {text}
              </option>
            )
          })}
        </select>
      )}
    </FieldShell>
  )
}

export interface SearchInputProps {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  label: string
  autoFocus?: boolean
  /**
   * `line` — garis bawah di bilah atas pencarian (`7e`).
   * `box` — pil bergaris rambut di dalam halaman (`7d`, `/pustaka`, studio).
   *
   * Dua bentuk karena keduanya menempati tempat berbeda: yang di bilah atas
   * **adalah** judul halamannya, yang di dalam halaman satu kontrol di antara
   * kontrol lain.
   */
  variant?: 'line' | 'box'
}

/** Kolom pencarian dengan tombol hapus. Dipakai `FilterableList` dan `/cari`. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari…',
  label,
  autoFocus,
  variant = 'line',
}: SearchInputProps) {
  const box = variant === 'box'

  return (
    <div className="relative">
      <Search
        size={16}
        aria-hidden
        className={cx(
          '-translate-y-1/2 pointer-events-none absolute top-1/2 text-nv-muted',
          box ? 'left-4' : 'left-0',
        )}
      />
      <input
        // `type="search"` dipertahankan: ia yang memberi `role="searchbox"`.
        // Tombol hapus bawaan peramban yang datang bersamanya disembunyikan di
        // `base.css` — komponen ini sudah punya tombol hapus sendiri, dan dua
        // tanda silang bersebelahan bukan pilihan, itu cacat.
        type="search"
        aria-label={label}
        value={value}
        // biome-ignore lint/a11y/noAutofocus: FR-SRCH-01 meminta papan ketik langsung muncul di halaman pencarian
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          box
            ? 'w-full rounded-nv-pill border border-nv-line-soft bg-nv-card py-3 pr-10 pl-11 font-ui text-body placeholder:text-nv-muted'
            : cx(CONTROL_LINE, 'pr-9 pl-7'),
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Hapus pencarian"
          onClick={() => onChange('')}
          className={cx(
            '-translate-y-1/2 absolute top-1/2 text-nv-muted hover:text-nv-text',
            box ? 'right-4' : 'right-3',
          )}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export interface CharCounterProps {
  value: string
  max: number
  /** Bila diisi, penghitung berbunyi `"44/50 minimum"` sampai ambang terpenuhi. */
  min?: number
}

/**
 * Penghitung karakter. Berubah **saat mengetik**, sehingga kekurangannya
 * terlihat tanpa menekan Simpan (FR-STUDIO-12, arch §1.5).
 */
export function CharCounter({ value, max, min }: CharCounterProps) {
  const len = value.trim().length
  const belowMin = min !== undefined && len < min
  const overMax = len > max

  return (
    <span
      className={cx(
        'text-caption tabular-nums',
        overMax || (belowMin && len > 0) ? 'font-semibold text-nv-danger' : 'text-nv-muted',
      )}
    >
      {belowMin ? `${len}/${min} minimum` : `${len}/${max}`}
    </span>
  )
}
