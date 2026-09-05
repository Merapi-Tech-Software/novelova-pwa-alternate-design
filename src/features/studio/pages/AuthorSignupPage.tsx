import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { AuthorProfile } from '@/api/contracts'
import { SettingRow } from '@/components/patterns/SettingRow'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { safeNext } from '@/lib/nav'
import { useAuthorProfile, useRegisterAuthor } from '../hooks/useAuthorProfile'

/**
 * Onboarding penulis · FR-STUDIO-33.
 *
 * Tiga prasyarat yang selama ini disebut di tiga tempat berbeda — profil,
 * keamanan, dan halaman ketentuan — dikumpulkan jadi satu layar.
 *
 * **Yang membuat layar ini bukan sekadar formulir**: hanya prasyarat pertama
 * yang menahan. Menyetujui ketentuan sudah cukup untuk mulai menulis; identitas
 * pencairan dan 2FA baru dituntut saat menyentuh uang. Meminta ketiganya di
 * depan berarti menolak penulis yang belum tentu akan pernah menerima uang.
 */
export default function AuthorSignupPage() {
  const profile = useAuthorProfile()

  // Formulirnya menunggu profilnya turun, dan itu bukan kerewelan: nilai awal
  // sakelar diambil dari data yang sudah ada, dan `useState` hanya membaca
  // argumennya sekali. Merendernya lebih dulu berarti tiga sakelar yang
  // menampilkan keadaan orang lain — atau keadaan yang tidak pernah ada.
  if (!profile.data) return <Skeleton lines={6} className="m-6" />
  return <SignupForm profile={profile.data} />
}

function SignupForm({ profile: loaded }: { profile: AuthorProfile }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const register = useRegisterAuthor()

  const [terms, setTerms] = useState(loaded.termsAcceptedAt !== null)
  const [payout, setPayout] = useState(loaded.payoutVerified)
  const [twoFactor, setTwoFactor] = useState(loaded.twoFactor)

  const tier = loaded.tier
  const next = safeNext(params.get('next'))

  async function submit() {
    const saved = await register.mutateAsync({
      termsAccepted: true,
      payoutVerified: payout,
      twoFactor,
    })
    toast.show(t('studio.signupDone'), { tone: 'success' })
    navigate(saved.tier === 'none' ? '/karya' : next)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10">
      {/* Tanpa `<h1>` sendiri: `TopBarLayout` sudah merendernya. Dua `<h1>` di
          satu halaman membuat pembaca layar mengumumkan dua judul berbeda. */}
      <p className="text-body text-nv-muted">{t('studio.signupBody')}</p>

      <p className="pt-3 font-semibold text-body text-nv-text">
        {tier === 'verified'
          ? t('studio.tierVerified')
          : tier === 'registered'
            ? t('studio.tierRegistered')
            : t('studio.tierNone')}
      </p>

      {/* Tiga prasyarat → **daftar berpembatas** lewat `SettingRow` yang sudah
          ada, bukan tiga kotak bergaris rambut: judul, keterangan, dan sakelar
          di kanan adalah persis bentuk baris itu. Nol komponen baru, dan
          bintang wajibnya tetap di judul. */}
      <SectionHeader label={t('studio.reqLabel')} className="pt-6" />
      <div className="pt-1">
        <SettingRow
          title={`${t('studio.reqTerms')} *`}
          description={t('studio.reqTermsBody')}
          control={
            <Switch checked={terms} onChange={setTerms} label={t('studio.reqTerms')} hideLabel />
          }
        />
        <SettingRow
          title={t('studio.reqPayout')}
          description={t('studio.reqPayoutBody')}
          control={
            <Switch checked={payout} onChange={setPayout} label={t('studio.reqPayout')} hideLabel />
          }
        />
        <SettingRow
          title={t('studio.reqTwoFactor')}
          description={t('studio.reqTwoFactorBody')}
          control={
            <Switch
              checked={twoFactor}
              onChange={setTwoFactor}
              label={t('studio.reqTwoFactor')}
              hideLabel
            />
          }
        />
      </div>

      <p className="pt-4 text-body text-nv-muted">
        {payout && twoFactor ? t('studio.allDone') : t('studio.canDo')}
      </p>
      {!(payout && twoFactor) && (
        <p className="pt-1 text-caption text-nv-muted">{t('studio.cannotYet')}</p>
      )}

      <Button
        block
        className="mt-5"
        disabled={!terms || register.isPending}
        onClick={() => void submit()}
      >
        {t('studio.signupSubmit')}
      </Button>
      {!terms && <p className="pt-2 text-caption text-nv-danger">{t('studio.signupNeedTerms')}</p>}

      <p className="pt-4 text-center">
        <Link
          to="/karya"
          className="nv-tap font-semibold text-body text-nv-muted underline underline-offset-4"
        >
          {t('studio.backToStudio')}
        </Link>
      </p>
    </div>
  )
}
