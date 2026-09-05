import type { ReactNode } from 'react'
import { Input } from '@/components/ui/Field'
import { t } from '@/i18n/t'
import { PASSWORD_MIN } from '@/lib/limits'
import { PasswordToggle } from './PasswordToggle'

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

      <div className="mt-5">
        <Input
          label={t('auth.password')}
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder={t('auth.passwordPlaceholder')(PASSWORD_MIN)}
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          counter={<PasswordToggle show={show} onToggle={onToggleShow} />}
        />
      </div>

      {children}
    </>
  )
}
