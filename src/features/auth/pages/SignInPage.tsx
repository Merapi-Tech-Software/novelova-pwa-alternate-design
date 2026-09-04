import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { isApiError, VISIBLE_CODES } from '@/api/errors'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { t } from '@/i18n/t'
import { formatTimeZoned } from '@/lib/format'
import { PASSWORD_MIN } from '@/lib/limits'
import { safeNext } from '@/lib/nav'
import { OAuthButtons } from '../components/OAuthButtons'
import { SignInFields } from '../components/SignInFields'
import { useSignIn } from '../hooks/useSignIn'

/**
 * Masuk · FR-AUTH-01/02/03/09.
 *
 * Validasinya ditulis tangan, bukan React Hook Form: FR-AUTH-09 menuntut **satu
 * area pesan** dengan kesalahan pertama yang menang, dan itu justru model yang
 * berlawanan dengan error per-kolom milik RHF. Dua kolom tidak sepadan dengan
 * satu resolver; RHF tetap dipakai di formulir studio yang aturannya berlapis.
 */
export function firstError(identity: string, password: string): string | null {
  if (!identity.trim()) return t('auth.errIdentity')
  if (password.length < PASSWORD_MIN) return t('auth.errPassword')(PASSWORD_MIN)
  return null
}

export default function SignInPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const signIn = useSignIn()

  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [lockedUntil, setLockedUntil] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()

    const message = firstError(identity, password)
    if (message) {
      setError(message)
      return
    }

    // Dikosongkan sebelum berpindah halaman, bukan sesudah (FR-AUTH-09).
    setError('')
    signIn.mutate(
      { identity: identity.trim(), password, remember },
      {
        onSuccess: () => navigate(safeNext(params.get('next')), { replace: true }),
        onError: (failure) => {
          if (isApiError(failure) && failure.code === VISIBLE_CODES.AUTH_RATE_LIMITED) {
            setLockedUntil(failure.retryAt ?? new Date().toISOString())
            return
          }
          setError(isApiError(failure) ? failure.message : t('auth.errUnknown'))
        },
      },
    )
  }

  if (lockedUntil) {
    const reopens = t('auth.lockedUntil')(formatTimeZoned(new Date(lockedUntil)))
    return (
      <FailureNotice
        level="fullscreen"
        title={t('failure.rateLimitedTitle')}
        body={t('failure.rateLimitedBody')}
        safety={t('failure.rateLimitedSafe')}
        onRetry={() => navigate('/lupa-sandi')}
        retryLabel={t('auth.recoverPassword')}
        actions={
          <Button variant="secondary" onClick={() => setLockedUntil(null)}>
            {t('action.back')}
          </Button>
        }
        code={`${VISIBLE_CODES.AUTH_RATE_LIMITED} · ${reopens}`}
      />
    )
  }

  return (
    <form noValidate onSubmit={submit}>
      <p className="mb-6 text-body text-nv-muted">{t('auth.signInLead')}</p>

      <SignInFields
        identity={identity}
        onIdentity={(value) => {
          setIdentity(value)
          setError('')
        }}
        password={password}
        onPassword={(value) => {
          setPassword(value)
          setError('')
        }}
        show={show}
        onToggleShow={() => setShow((on) => !on)}
      />

      <div className="mt-4 flex items-start justify-between gap-3">
        <Switch
          checked={remember}
          onChange={setRemember}
          label={t('auth.remember')}
          description={remember ? t('auth.sessionLong') : t('auth.sessionShort')}
        />
        <Link
          to="/lupa-sandi"
          className="shrink-0 pt-1 text-caption font-semibold text-nv-accent underline underline-offset-2"
        >
          {t('auth.forgot')}
        </Link>
      </div>

      <div role="alert" aria-live="polite" className="min-h-9 py-3 text-center">
        {error && <span className="text-caption font-semibold text-nv-danger">{error}</span>}
      </div>

      <Button type="submit" size="lg" block loading={signIn.isPending}>
        {t('auth.signIn')}
      </Button>

      <OAuthButtons onStub={setError} />

      <p className="mt-6 text-center text-caption text-nv-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/daftar" className="font-semibold text-nv-accent underline underline-offset-2">
          {t('auth.register')}
        </Link>
      </p>
    </form>
  )
}
