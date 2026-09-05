import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'

export interface OnboardingStepsProps {
  step: number
  total: number
  onSkip: () => void
}

/**
 * Kepala onboarding: posisi, dan **"Lewati" yang selalu terlihat** (FR-AUTH-11).
 *
 * Tombol lewati sengaja ada di tiap langkah, bukan hanya di langkah pertama:
 * onboarding yang tidak bisa ditinggalkan di tengah adalah dinding, bukan
 * perkenalan.
 */
export function OnboardingSteps({ step, total, onSkip }: OnboardingStepsProps) {
  return (
    <header className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <span className="nv-section-label tabular-nums">{t('auth.stepOf')(step, total)}</span>
        <button
          type="button"
          onClick={onSkip}
          className="nv-tap text-caption font-semibold text-nv-muted underline underline-offset-4"
        >
          {t('auth.skip')}
        </button>
      </div>

      {/* **Garis bersegmen `7k`**, bukan titik: segmen yang sudah dilewati
          memakai emas garis — emas dijatah, dan "batang progres" salah satu
          perannya (brief §1). Sampai R8 segmennya memakai tinta, yang membuatnya
          tidak bisa dibedakan dari garis bawah tab aktif. */}
      <ol className="flex gap-1.5 pt-3">
        {Array.from({ length: total }, (_, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: titik langkah tidak punya identitas selain posisinya
            key={i}
            aria-current={i + 1 === step ? 'step' : undefined}
            className={cx(
              'h-0.5 flex-1 rounded-nv-pill',
              i + 1 <= step ? 'bg-nv-gold-line' : 'bg-nv-line',
            )}
          >
            <span className="sr-only">{t('auth.stepOf')(i + 1, total)}</span>
          </li>
        ))}
      </ol>
    </header>
  )
}
