import { Chrome, Facebook } from 'lucide-react'
import { t } from '@/i18n/t'

const PROVIDERS = [
  { id: 'Google', Icon: Chrome, className: 'text-nv-brand-google' },
  { id: 'Facebook', Icon: Facebook, className: 'text-nv-brand-facebook' },
] as const

/**
 * Masuk lewat penyedia pihak ketiga · FR-AUTH-04.
 *
 * **Pil bergaris rambut** sejak R8, bukan kotak radius sedang: brief §1 hanya
 * mengenal dua bentuk tombol, dan yang bergaris rambut adalah pil.
 *
 * **Aksinya stub**, dan itu dinyatakan apa adanya di layar alih-alih membuka
 * jendela yang tidak akan pernah kembali. Warna merek dipertahankan (token
 * `--nv-brand-*`): tombol ini dikenali dari warnanya, bukan dari tulisannya.
 */
export function OAuthButtons({ onStub }: { onStub: (message: string) => void }) {
  return (
    <>
      <div className="flex items-center gap-3 py-5">
        <span className="h-px flex-1 bg-nv-line" />
        <span className="text-caption tracking-widest text-nv-muted">{t('auth.or')}</span>
        <span className="h-px flex-1 bg-nv-line" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PROVIDERS.map(({ id, Icon, className }) => (
          <button
            key={id}
            type="button"
            onClick={() => onStub(t('auth.oauthStub')(id))}
            className="flex min-h-11 items-center justify-center gap-2 rounded-nv-pill border border-nv-line-soft px-3 py-3 text-body font-semibold transition hover:bg-nv-accent-soft"
          >
            <Icon size={16} className={className} aria-hidden />
            {id}
          </button>
        ))}
      </div>
    </>
  )
}
