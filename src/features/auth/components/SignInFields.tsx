import type { ReactNode } from 'react'
import { Input } from '@/components/ui/Field'
import { t } from '@/i18n/t'
import { PASSWORD_MIN } from '@/lib/limits'

export interface SignInFieldsProps {
  identity: string
  onIdentity: (value: string) => void
  password: string
  onPassword: (value: string) => void
  show: boolean
  onToggleShow: () => void
  /** Kolom identitas disembunyikan saat pengguna sudah dikenal (masuk ulang). */
  hideIdentity?: boolean
  children?: ReactNode
}

/**
 * Dua kolom yang sama dipakai layar `/masuk` dan lembar masuk ulang, jadi
 * ditulis sekali. `autocomplete` dipertahankan persis (FR-AUTH-01) — tanpa itu
 * pengelola kata sandi berhenti menawarkan isian, dan pengguna yang memakainya
 * justru yang paling sering terkunci.
 */
export function SignInFields({
  identity,
  onIdentity,
  password,
  onPassword,
  show,
  onToggleShow,
  hideIdentity = false,
  children,
}: SignInFieldsProps) {
  return (
    <>
      {!hideIdentity && (
        <Input
          label={t('auth.identity')}
          type="text"
          inputMode="email"
          autoComplete="username"
          placeholder={t('auth.identityPlaceholder')}
          value={identity}
          onChange={(e) => onIdentity(e.target.value)}
        />
      )}

      <div className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <Input
            label={t('auth.password')}
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={t('auth.passwordPlaceholder')(PASSWORD_MIN)}
            value={password}
            onChange={(e) => onPassword(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onToggleShow}
          className="h-11 shrink-0 rounded-nv-md border border-nv-line px-3 text-caption font-semibold text-nv-muted"
        >
          {show ? t('auth.hide') : t('auth.show')}
        </button>
      </div>

      {children}
    </>
  )
}
