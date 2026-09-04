import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { RESET_STEPS } from '@/i18n/content'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { RESET_LINK_MIN } from '@/lib/limits'
import { useSession } from '@/stores/session'
import { useRequestReset } from '../hooks/useRequestReset'

/**
 * Pulihkan akun · FR-AUTH-08.
 *
 * Halaman ini menjalankan **langkah pertama saja**; indikator tiga langkah ada
 * supaya pengguna tahu ia belum selesai dan masih akan menerima tautan.
 *
 * Tombolnya tidak pernah menolak — termasuk saat kolomnya kosong. Menjawab
 * "email itu tidak terdaftar" hanya memberi tahu penebak akun mana yang ada.
 */
export default function ForgotPasswordPage() {
  const lastIdentity = useSession((s) => s.lastIdentity)
  const [identity, setIdentity] = useState(lastIdentity ?? '')
  const request = useRequestReset()

  function submit(event: FormEvent) {
    event.preventDefault()
    request.mutate(identity)
  }

  return (
    <form noValidate onSubmit={submit}>
      <h1 className="mb-4 font-display text-page font-bold">{t('auth.recoverTitle')}</h1>

      <ol className="flex gap-2">
        {RESET_STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === 0 ? 'step' : undefined}
            className={cx(
              'flex-1 rounded-nv-md border px-2 py-2 text-center',
              index === 0
                ? 'border-nv-accent text-nv-accent-strong'
                : 'border-nv-line text-nv-muted',
            )}
          >
            <span className="block font-display text-card font-semibold tabular-nums">
              {index + 1}
            </span>
            <span className="block text-caption tracking-wide uppercase">{label}</span>
          </li>
        ))}
      </ol>

      <p className="py-4 text-body text-nv-muted">{t('auth.recoverLead')}</p>

      <Input
        label={t('auth.recoverIdentity')}
        autoComplete="username"
        placeholder={t('auth.identityPlaceholder')}
        value={identity}
        onChange={(e) => setIdentity(e.target.value)}
      />

      <Button type="submit" size="lg" block className="mt-4" loading={request.isPending}>
        {t('auth.sendResetLink')}
      </Button>

      <p
        role="status"
        aria-live="polite"
        className={cx(
          'min-h-9 py-3 text-body',
          request.data ? 'font-semibold text-nv-success' : 'text-nv-muted',
        )}
      >
        {request.data ? t('auth.resetSent')(request.data.sentTo) : t('auth.resetNotSent')}
      </p>

      <div className="rounded-nv-md border border-nv-line p-4">
        <p className="text-caption tracking-wide text-nv-muted uppercase">
          {t('auth.securityNote')}
        </p>
        <p className="pt-2 text-body">{t('auth.securityNoteBody')(RESET_LINK_MIN)}</p>
      </div>

      <p className="mt-6 text-center text-caption text-nv-muted">
        <Link
          to="/masuk"
          className="font-semibold text-nv-accent-strong underline underline-offset-2"
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </form>
  )
}
