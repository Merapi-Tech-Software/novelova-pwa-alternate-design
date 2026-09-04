import { Check } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { isApiError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { PASSWORD_MIN } from '@/lib/limits'
import { PasswordMeter } from '../components/PasswordMeter'
import { useRegister } from '../hooks/useRegister'

/** Email dinilai dengan pola PRD, bukan `type="email"` peramban (FR-AUTH-05). */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

interface Draft {
  name: string
  email: string
  password: string
  agree: boolean
}

/**
 * Urutannya mengikat: nama → email → kata sandi → **persetujuan terakhir**
 * (FR-AUTH-05, FR-AUTH-07). Persetujuan diperiksa paling akhir supaya pengguna
 * tidak diminta menyetujui ketentuan untuk formulir yang ternyata belum sah.
 */
export function firstError(draft: Draft): string | null {
  if (!draft.name.trim()) return t('auth.errName')
  if (!EMAIL.test(draft.email.trim())) return t('auth.errEmail')
  if (draft.password.length < PASSWORD_MIN) return t('auth.errPassword')(PASSWORD_MIN)
  if (!draft.agree) return t('auth.errAgree')
  return null
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')

  const clear =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setError('')
    }

  function submit(event: FormEvent) {
    event.preventDefault()

    const message = firstError({ name, email, password, agree })
    if (message) {
      setError(message)
      return
    }

    setError('')
    register.mutate(
      {
        displayName: name.trim(),
        email: email.trim(),
        password,
        acceptedTerms: true,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      },
      {
        // Akun baru selalu lewat pengenalan dulu (FR-AUTH-11), bukan langsung
        // ke beranda yang belum tahu apa pun tentang seleranya.
        onSuccess: () => navigate('/mulai', { replace: true }),
        onError: (failure) =>
          setError(isApiError(failure) ? failure.message : t('auth.errRegister')),
      },
    )
  }

  return (
    <form noValidate onSubmit={submit}>
      <h1 className="mb-5 font-display text-page font-bold">{t('auth.registerTitle')}</h1>

      <div className="space-y-4">
        <Input
          label={t('auth.displayName')}
          autoComplete="name"
          placeholder={t('auth.displayNamePlaceholder')}
          value={name}
          onChange={(e) => clear(setName)(e.target.value)}
        />
        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => clear(setEmail)(e.target.value)}
        />
        <Input
          label={t('auth.phone')}
          hint={t('auth.phoneOptional')}
          type="tel"
          autoComplete="tel"
          placeholder={t('auth.phonePlaceholder')}
          value={phone}
          onChange={(e) => clear(setPhone)(e.target.value)}
        />

        <div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label={t('auth.password')}
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('auth.passwordPlaceholder')(PASSWORD_MIN)}
                value={password}
                onChange={(e) => clear(setPassword)(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setShow((on) => !on)}
              className="h-11 shrink-0 rounded-nv-md border border-nv-line px-3 text-caption font-semibold text-nv-muted"
            >
              {show ? t('auth.hide') : t('auth.show')}
            </button>
          </div>
          <PasswordMeter password={password} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => clear(setAgree)(!agree)}
        aria-pressed={agree}
        className="mt-5 flex items-start gap-3 text-left text-body"
      >
        <span
          aria-hidden
          className={cx(
            'mt-0.5 grid size-5 shrink-0 place-items-center rounded-nv-sm border',
            agree ? 'border-nv-accent bg-nv-accent-soft text-nv-accent-strong' : 'border-nv-line',
          )}
        >
          {agree && <Check size={13} strokeWidth={3} />}
        </span>
        <span className="text-nv-muted">
          {t('auth.agreePrefix')}{' '}
          <Link to="/legal/ketentuan" className="font-semibold text-nv-accent-strong underline">
            {t('auth.terms')}
          </Link>{' '}
          {t('auth.and')}{' '}
          <Link to="/legal/privasi" className="font-semibold text-nv-accent-strong underline">
            {t('auth.privacy')}
          </Link>
          .
        </span>
      </button>

      <div role="alert" aria-live="polite" className="min-h-9 py-3 text-center">
        {error && <span className="text-caption font-semibold text-nv-danger">{error}</span>}
      </div>

      <Button type="submit" size="lg" block loading={register.isPending}>
        {t('auth.submitRegister')}
      </Button>

      <p className="mt-6 text-center text-caption text-nv-muted">
        {t('auth.haveAccount')}{' '}
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
