import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-nv-accent-strong text-nv-card hover:brightness-110 active:brightness-95',
  secondary: 'border border-nv-accent text-nv-accent-strong bg-transparent hover:bg-nv-accent-soft',
  ghost: 'text-nv-muted hover:bg-nv-accent-soft hover:text-nv-accent-strong',
  danger: 'bg-nv-danger text-nv-card hover:brightness-110',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-caption gap-1.5',
  md: 'h-11 px-4.5 text-body gap-2',
  lg: 'h-13 px-6 text-card gap-2.5',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Menonaktifkan tombol **dan** memberi indikator berputar. */
  loading?: boolean
  block?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  iconLeft,
  iconRight,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      // Tombol yang sedang memuat tetap terbaca screen reader sebagai sibuk,
      // bukan sekadar mati.
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center rounded-nv-pill font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Wajib — tombol tanpa teks tidak punya nama bagi screen reader. */
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
}

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'size-9',
  md: 'size-11',
  lg: 'size-13',
}

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'grid shrink-0 place-items-center rounded-nv-pill transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'ghost'
          ? 'border border-nv-line bg-nv-card text-nv-muted hover:text-nv-accent-strong'
          : VARIANT[variant],
        ICON_SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
