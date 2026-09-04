import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { api } from '@/api/client'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Button } from '@/components/ui/Button'
import { Card, Skeleton } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { GENRE_TABS, ONBOARDING_LANGUAGES, ONBOARDING_REGIONS } from '@/i18n/content'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'
import { localTimeZone } from '@/lib/date'
import { ONBOARDING_GENRES_MAX, ONBOARDING_GENRES_MIN } from '@/lib/limits'
import { OnboardingSteps } from '../components/OnboardingSteps'
import { useLocaleSettings, useSaveLocaleSettings } from '../hooks/useLocaleSettings'
import { useFinishOnboarding, useReaderPrefs, useStarterPicks } from '../hooks/useOnboarding'

const TOTAL = 3

/** Nilai awal diambil dari perangkat, lalu boleh diubah (FR-AUTH-11 langkah 2). */
function deviceLanguage(): string {
  return navigator.language.startsWith('id')
    ? ONBOARDING_LANGUAGES[0].label
    : ONBOARDING_LANGUAGES[1].label
}

function deviceRegion(): string {
  const zone = localTimeZone()
  return ONBOARDING_REGIONS.find((r) => r.timezone === zone)?.label ?? ONBOARDING_REGIONS[0].label
}

/**
 * Onboarding pembaca baru · FR-AUTH-11.
 *
 * Tiga langkah, **seluruhnya dapat dilewati**, dan melewatinya sama dengan
 * menyelesaikannya: keduanya menandai onboarding selesai supaya tidak pernah
 * muncul lagi. Preferensinya mengurutkan beranda, bukan mengunci katalog.
 */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const prefs = useReaderPrefs()
  const finish = useFinishOnboarding()
  const locale = useLocaleSettings()
  const saveLocale = useSaveLocaleSettings()

  const [step, setStep] = useState(1)
  const [genres, setGenres] = useState<string[]>([])
  const [error, setError] = useState('')
  const [language, setLanguage] = useState(deviceLanguage)
  const [region, setRegion] = useState(deviceRegion)
  const [saved, setSaved] = useState<string[]>([])

  const picks = useStarterPicks(genres, step === TOTAL)

  if (prefs.isPending) return <Skeleton lines={8} />
  if (prefs.isError) {
    return (
      <FailureNotice
        level="inset"
        title={t('failure.genericTitle')}
        body={t('failure.genericBody')}
        safety={t('failure.genericSafe')}
        onRetry={() => void prefs.refetch()}
      />
    )
  }
  // Sudah pernah dijalani — di perangkat mana pun, karena penandanya di server.
  if (prefs.data.onboardedAt) return <Navigate to="/" replace />

  function done(picked: string[]) {
    finish.mutate(picked, { onSuccess: () => navigate('/', { replace: true }) })
  }

  function toggleGenre(genre: string) {
    setError('')
    setGenres((current) => {
      if (current.includes(genre)) return current.filter((g) => g !== genre)
      if (current.length >= ONBOARDING_GENRES_MAX) {
        setError(t('auth.errGenreMax')(ONBOARDING_GENRES_MAX))
        return current
      }
      return [...current, genre]
    })
  }

  function next() {
    if (step === 1 && genres.length < ONBOARDING_GENRES_MIN) {
      setError(t('auth.errGenreMin'))
      return
    }
    if (step === 2) {
      const chosenLang = ONBOARDING_LANGUAGES.find((l) => l.label === language)
      const chosenRegion = ONBOARDING_REGIONS.find((r) => r.label === region)
      const current = locale.data
      if (current && chosenLang && chosenRegion) {
        saveLocale.mutate({
          ...current,
          uiLang: chosenLang.uiLang,
          contentRegion: chosenRegion.contentRegion,
          timezone: chosenRegion.timezone,
        })
      }
    }
    setError('')
    setStep((n) => Math.min(TOTAL, n + 1))
  }

  return (
    <div>
      <OnboardingSteps step={step} total={TOTAL} onSkip={() => done([])} />

      {step === 1 && (
        <section>
          <h1 className="font-display text-page font-bold">{t('auth.genreTitle')}</h1>
          <p className="pt-2 text-body text-nv-muted">{t('auth.genreLead')}</p>
          <p className="pt-1 pb-4 text-caption text-nv-muted tabular-nums">
            {t('auth.genreCount')(genres.length, ONBOARDING_GENRES_MAX)}
          </p>
          <div className="flex flex-wrap gap-2">
            {GENRE_TABS.map((genre) => (
              <Chip
                key={genre}
                selected={genres.includes(genre)}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="font-display text-page font-bold">{t('auth.localeTitle')}</h1>
          <p className="pt-2 pb-4 text-body text-nv-muted">{t('auth.localeLead')}</p>

          <p className="pb-2 text-caption tracking-wide text-nv-muted uppercase">
            {t('auth.uiLanguage')}
          </p>
          <div className="flex gap-2">
            {ONBOARDING_LANGUAGES.map((option) => (
              <Chip
                key={option.label}
                selected={language === option.label}
                onClick={() => setLanguage(option.label)}
              >
                {option.label}
              </Chip>
            ))}
          </div>

          <p className="pt-5 pb-2 text-caption tracking-wide text-nv-muted uppercase">
            {t('auth.regionTimezone')}
          </p>
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_REGIONS.map((option) => (
              <Chip
                key={option.label}
                selected={region === option.label}
                onClick={() => setRegion(option.label)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {step === TOTAL && (
        <section>
          <h1 className="font-display text-page font-bold">{t('auth.picksTitle')}</h1>
          <p className="pt-2 pb-4 text-body text-nv-muted">{t('auth.picksLead')}</p>

          {picks.isPending && <Skeleton lines={4} />}
          {picks.data?.map((story) => {
            const inLibrary = saved.includes(story.id)
            return (
              <Card key={story.id} className="mb-2 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-card font-semibold">{story.title}</p>
                  <p className="truncate text-caption text-nv-muted">{story.penName}</p>
                  <p className="text-caption text-nv-muted tabular-nums">
                    {story.genres.join(' · ')} · {formatCompactCoin(story.stats.reads)} pembaca
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={inLibrary ? 'secondary' : 'primary'}
                  disabled={inLibrary}
                  onClick={() => {
                    setSaved((current) => [...current, story.id])
                    void api.toggleLibrary(story.id)
                  }}
                >
                  {inLibrary ? t('auth.saved') : t('auth.save')}
                </Button>
              </Card>
            )
          })}
        </section>
      )}

      <div role="alert" aria-live="polite" className="min-h-9 py-3">
        {error && <span className="text-caption font-semibold text-nv-danger">{error}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          disabled={step === 1}
          onClick={() => {
            setError('')
            setStep((n) => Math.max(1, n - 1))
          }}
        >
          {t('action.back')}
        </Button>
        {step < TOTAL ? (
          <Button onClick={next}>{t('auth.next')}</Button>
        ) : (
          <Button loading={finish.isPending} onClick={() => done(genres)}>
            {t('auth.finish')}
          </Button>
        )}
      </div>
    </div>
  )
}
