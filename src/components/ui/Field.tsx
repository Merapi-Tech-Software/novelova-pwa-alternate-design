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

const CONTROL =
  'w-full rounded-nv-md border border-nv-line bg-nv-card px-3.5 py-2.5 text-body ' +
  'placeholder:text-nv-muted focus:border-nv-accent focus:outline-none ' +
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
          className={cx(CONTROL, error && 'border-nv-danger', className)}
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
          className={cx(CONTROL, 'resize-y', error && 'border-nv-danger', className)}
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
          className={cx(CONTROL, 'cursor-pointer', error && 'border-nv-danger', className)}
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
}

/** Kolom pencarian dengan tombol hapus. Dipakai `FilterableList` dan `/cari`. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari…',
  label,
  autoFocus,
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        size={16}
        aria-hidden
        className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3.5 text-nv-muted"
      />
      <input
        type="search"
        aria-label={label}
        value={value}
        // biome-ignore lint/a11y/noAutofocus: FR-SRCH-01 meminta papan ketik langsung muncul di halaman pencarian
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cx(CONTROL, 'pr-10 pl-10')}
      />
      {value && (
        <button
          type="button"
          aria-label="Hapus pencarian"
          onClick={() => onChange('')}
          className="-translate-y-1/2 absolute top-1/2 right-3 text-nv-muted hover:text-nv-accent-strong"
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
