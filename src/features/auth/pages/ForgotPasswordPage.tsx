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

      {/*
        **Garis bersegmen, bukan tiga kotak** (`7k`). Kotak bernomor terbaca
        sebagai tiga tombol yang bisa dipilih, padahal halaman ini menjalankan
        langkah pertama saja — dua sisanya terjadi di email, bukan di sini.
        Bentuknya sama persis dengan `/mulai` dan formulir cerita: satu pola,
        tiga tempat.
      */}
      <ol className="flex gap-1.5" aria-label={t('auth.recoverTitle')}>
        {RESET_STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === 0 ? 'step' : undefined}
            className={cx(
              'h-0.5 flex-1 rounded-nv-pill',
              index === 0 ? 'bg-nv-gold-line' : 'bg-nv-line',
            )}
          >
            <span className="sr-only">{`${t('auth.stepOf')(index + 1, RESET_STEPS.length)} · ${label}`}</span>
          </li>
        ))}
      </ol>
      <p className="pt-2.5 nv-section-label">
        {t('auth.stepOf')(1, RESET_STEPS.length)} · {RESET_STEPS[0]}
      </p>

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

      {/* Bukan kartu: kartu dijatah enam peran (brief §1) dan "catatan" bukan
          salah satunya. Yang memisahkannya dari isi halaman cukup garis. */}
      <div className="border-nv-line border-t pt-4">
        <p className="nv-section-label">{t('auth.securityNote')}</p>
        <p className="pt-2 text-body text-nv-text-2">
          {t('auth.securityNoteBody')(RESET_LINK_MIN)}
        </p>
      </div>

      <p className="mt-6 text-center text-caption text-nv-muted">
        <Link
          to="/masuk"
          className="nv-tap font-semibold text-nv-text underline underline-offset-4"
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </form>
  )
}
