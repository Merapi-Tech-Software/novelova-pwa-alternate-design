import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { isApiError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Modal'
import { t } from '@/i18n/t'
import { useSession } from '@/stores/session'
import { useSignIn } from '../hooks/useSignIn'
import { SignInFields } from './SignInFields'

/**
 * Sesi berakhir di tengah pemakaian · FR-AUTH-12 × FR-STUDIO-34.
 *
 * **Lembar, bukan redirect.** Penulis yang sedang mengetik bab kehilangan
 * naskahnya kalau halamannya diganti; di sini halaman tetap utuh di belakang.
 * Menutup lembar juga tidak mengeluarkan siapa pun — permintaan berikutnya yang
 * ditolak memunculkannya lagi. Itu jalan keluar bagi yang ingin menyalin
 * tulisannya dulu sebelum masuk lagi.
 */
export function ReauthSheet() {
  const open = useSession((s) => s.reauthOpen)
  const profile = useSession((s) => s.profile)
  const lastIdentity = useSession((s) => s.lastIdentity)

  const signIn = useSignIn()
  const [identity, setIdentity] = useState(lastIdentity ?? '')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  // Lembar ini ikut hidup sejak aplikasi dimuat, jadi nilai awalnya diambil saat
  // ia benar-benar terbuka — pengguna yang baru masuk tadi tidak menemukan
  // kolom identitas kosong hanya karena komponennya lebih tua dari sesinya.
  useEffect(() => {
    if (open && lastIdentity) setIdentity((current) => current || lastIdentity)
  }, [open, lastIdentity])

  function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    signIn.mutate(
      { identity: identity.trim(), password, remember: true },
      {
        onSuccess: () => setPassword(''),
        onError: (failure) =>
          setError(isApiError(failure) ? failure.message : t('auth.errUnknown')),
      },
    )
  }

  return (
    <Sheet
      open={open}
      onClose={() => useSession.getState().dismissReauth()}
      title={t('failure.sessionExpiredTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={() => useSession.getState().clearSession()}>
            {t('auth.signOut')}
          </Button>
          <Button onClick={submit} loading={signIn.isPending}>
            {t('auth.reauthSubmit')}
          </Button>
        </>
      }
    >
      <form noValidate onSubmit={submit}>
        <p className="text-body text-nv-muted">{t('failure.sessionExpiredBody')}</p>
        <p className="mt-2 text-body font-semibold text-nv-success">
          {t('failure.sessionExpiredSafe')}
        </p>

        <p className="mt-4 mb-3 text-body">
          {profile ? t('auth.reauthLead')(profile.displayName) : t('auth.signInLead')}
        </p>

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

        <div role="alert" aria-live="polite" className="min-h-9 pt-3">
          {error && <span className="text-caption font-semibold text-nv-danger">{error}</span>}
        </div>
      </form>
    </Sheet>
  )
}
