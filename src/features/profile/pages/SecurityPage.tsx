import { Check, ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'
import type { ExportCategory } from '@/api/contracts'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { formatDate, formatRelative } from '@/lib/format'
import {
  useClearHistory,
  useDeletionCheck,
  useRequestDeletion,
  useRequestExport,
  useRevokeSession,
  useSecurity,
} from '../hooks/useSettings'

const EXPORTS: Array<[ExportCategory, string]> = [
  ['identitas', t('settings.exportIdentity')],
  ['aktivitas', t('settings.exportActivity')],
  ['dompet', t('settings.exportWallet')],
  ['penulis', t('settings.exportAuthor')],
]

const LEVEL_LABEL = {
  kuat: t('settings.levelStrong'),
  sedang: t('settings.levelMedium'),
  lemah: t('settings.levelWeak'),
} as const

/**
 * Keamanan `/pengaturan/keamanan` · FR-SET-02 · FR-SET-03 · FR-SET-05.
 *
 * **Skornya dihitung dari faktor nyata**, dan sarannya lahir dari keadaan yang
 * sama — jadi tidak mungkin ada saran yang menyarankan sesuatu yang sudah
 * menyala. Daftar saran tetap yang tidak melihat keadaan adalah daftar yang
 * pengguna belajar abaikan.
 *
 * Blok **Data & akun** ada **di dalam** halaman ini, bukan rute sendiri:
 * FR-SET-05 menyebut `settings_security`, dan kanvas layar 29 menggambarnya
 * begitu.
 */
export default function SecurityPage() {
  const security = useSecurity()
  const revoke = useRevokeSession()
  const clearHistory = useClearHistory()
  const deletionCheck = useDeletionCheck()
  const requestExport = useRequestExport()
  const requestDeletion = useRequestDeletion()
  const toast = useToast()

  const [pilihEkspor, setPilihEkspor] = useState<ExportCategory[]>([])
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false)
  const [frasa, setFrasa] = useState('')

  return (
    <div className="space-y-8 px-4 pb-10">
      <AsyncState
        loading={security.isPending}
        error={security.error}
        data={security.data}
        onRetry={() => void security.refetch()}
        empty={{ title: t('settings.securityTitle'), description: t('settings.scoreTitle') }}
      >
        {(data) => (
          <>
            {/* ── skor · FR-SET-02 ──────────────────────────────────────── */}
            <section className="nv-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-card font-semibold">{t('settings.scoreTitle')}</h2>
                <Badge
                  tone={
                    data.level === 'kuat'
                      ? 'success'
                      : data.level === 'sedang'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {LEVEL_LABEL[data.level]}
                </Badge>
              </div>

              <p className="pt-2 font-display font-semibold text-nv-text text-stat tabular-nums">
                {t('settings.scoreOf')(data.score)}
              </p>

              {/* Batang skor memakai emas garis — ini bukan tombol, dan tinta
                  di sini membuatnya terbaca sebagai kontrol. */}
              <div className="mt-3 h-1.5 overflow-hidden rounded-nv-pill bg-nv-paper-2">
                <div className="h-full bg-nv-gold-line" style={{ width: `${data.score}%` }} />
              </div>

              <h3 className="nv-section-label pt-4 pb-2">{t('settings.factorsTitle')}</h3>
              <ul className="space-y-1.5">
                {data.factors.map((faktor) => (
                  <li key={faktor.id} className="flex items-center gap-2 text-body">
                    {faktor.met ? (
                      <Check size={15} className="shrink-0 text-nv-gold" aria-hidden />
                    ) : (
                      <X size={15} className="shrink-0 text-nv-muted" aria-hidden />
                    )}
                    <span className={faktor.met ? 'text-nv-text' : 'text-nv-muted'}>
                      {faktor.label}
                    </span>
                    <span className="ml-auto shrink-0 text-caption text-nv-muted tabular-nums">
                      {faktor.weight}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── saran · FR-SET-02 ─────────────────────────────────────── */}
            <section>
              <SectionHeader label={t('settings.tipsTitle')} className="mb-2" />
              {data.tips.length === 0 ? (
                <p className="text-body text-nv-muted">{t('settings.noTips')}</p>
              ) : (
                <ul className="space-y-2">
                  {data.tips.map((tip) => (
                    <li key={tip.id} className="nv-card flex items-start gap-3 p-3">
                      <ShieldAlert size={16} aria-hidden className="mt-0.5 shrink-0 text-nv-gold" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-body text-nv-text">{tip.title}</span>
                        <span className="block pt-0.5 text-caption text-nv-muted">{tip.body}</span>
                      </span>
                      {tip.points > 0 && (
                        <span className="shrink-0 text-caption font-semibold text-nv-gold tabular-nums">
                          {t('settings.tipPoints')(tip.points)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── sesi · FR-SET-03 ──────────────────────────────────────── */}
            <section>
              <SectionHeader
                label={t('settings.sessionsTitle')}
                className="mb-1"
                action={
                  data.sessions.some((s) => !s.current) ? (
                    <button
                      type="button"
                      className="nv-tap text-caption font-semibold text-nv-gold"
                      onClick={() =>
                        revoke.mutate('all-others', {
                          onSuccess: () =>
                            toast.show(t('settings.revokedAll'), { tone: 'success' }),
                        })
                      }
                    >
                      {t('settings.revokeAll')}
                    </button>
                  ) : null
                }
              />
              <ul className="divide-y divide-nv-line">
                {data.sessions.map((sesi) => (
                  <li key={sesi.id} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-body text-nv-text">{sesi.device}</span>
                      <span className="block pt-0.5 text-caption text-nv-muted">
                        {[
                          sesi.location,
                          t('settings.lastActive')(formatRelative(new Date(sesi.lastActiveAt))),
                        ].join(' · ')}
                      </span>
                    </span>
                    {sesi.current ? (
                      <Badge tone="accent">{t('settings.sessionCurrent')}</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={revoke.isPending}
                        onClick={() =>
                          revoke.mutate(sesi.id, {
                            onSuccess: () => toast.show(t('settings.revoked'), { tone: 'success' }),
                          })
                        }
                      >
                        {t('settings.revoke')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </AsyncState>

      {/* ── data & akun · FR-SET-05 ───────────────────────────────────────── */}
      <section>
        <SectionHeader label={t('settings.dataTitle')} className="mb-3" />

        <div className="nv-card p-4">
          <h3 className="font-display text-card font-semibold">{t('settings.clearHistory')}</h3>
          <p className="pt-1 text-caption text-nv-muted">{t('settings.clearHistoryBody')}</p>
          <Button
            variant="secondary"
            className="mt-3"
            disabled={clearHistory.isPending}
            onClick={() => {
              if (!window.confirm(t('settings.clearHistoryConfirm'))) return
              clearHistory.mutate(undefined, {
                onSuccess: () => toast.show(t('settings.clearHistoryDone'), { tone: 'success' }),
              })
            }}
          >
            {t('settings.clearHistory')}
          </Button>
        </div>

        <div className="nv-card mt-3 p-4">
          <h3 className="font-display text-card font-semibold">{t('settings.exportTitle')}</h3>
          <p className="pt-1 text-caption text-nv-muted">{t('settings.exportBody')}</p>

          <ul className="space-y-2 pt-3">
            {EXPORTS.map(([id, label]) => (
              <li key={id}>
                <label className="nv-tap flex items-center gap-2.5 text-body">
                  <input
                    type="checkbox"
                    checked={pilihEkspor.includes(id)}
                    onChange={(event) =>
                      setPilihEkspor((prev) =>
                        event.target.checked ? [...prev, id] : prev.filter((x) => x !== id),
                      )
                    }
                    className="size-4 rounded-nv-sm accent-nv-accent"
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>

          <Button
            variant="secondary"
            className="mt-3"
            disabled={requestExport.isPending}
            onClick={() => {
              if (pilihEkspor.length === 0) {
                toast.show(t('settings.exportPickOne'), { tone: 'danger' })
                return
              }
              requestExport.mutate(pilihEkspor, {
                onSuccess: () => {
                  toast.show(t('settings.exportQueued'), { tone: 'success' })
                  setPilihEkspor([])
                },
              })
            }}
          >
            {t('settings.exportRequest')}
          </Button>
        </div>

        {/* ── hapus akun · pengaman terkuat di aplikasi ini ─────────────── */}
        <div className="nv-card mt-3 border-nv-danger/40 p-4">
          <h3 className="font-display text-card font-semibold text-nv-danger">
            {t('settings.deleteTitle')}
          </h3>
          <p className="pt-1 text-caption text-nv-muted">{t('settings.deleteBody')}</p>

          {deletionCheck.data && !deletionCheck.data.allowed ? (
            <div className="mt-3 rounded-nv-md bg-nv-danger-bg p-3">
              <p className="font-semibold text-body text-nv-danger">
                {t('settings.deleteBlocked')}
              </p>
              <ul className="list-disc space-y-1 pt-1 pl-4 text-caption text-nv-text-2">
                {deletionCheck.data.blockers.map((alasan) => (
                  <li key={alasan}>{alasan}</li>
                ))}
              </ul>
            </div>
          ) : (
            <Button variant="danger" className="mt-3" onClick={() => setKonfirmasiHapus(true)}>
              {t('settings.deleteTitle')}
            </Button>
          )}
        </div>
      </section>

      {konfirmasiHapus && deletionCheck.data && (
        <Modal open onClose={() => setKonfirmasiHapus(false)} title={t('settings.deleteTitle')}>
          {/*
            **Konsekuensi dibaca sebelum konfirmasi**, bukan sesudah. Dialog yang
            hanya bertanya "yakin?" memindahkan tanggung jawab tanpa memberi
            informasi untuk memikulnya.
          */}
          <p className="text-body text-nv-text-2">{t('settings.deleteConsequences')}</p>
          <ul className="list-disc space-y-1 pt-2 pl-4 text-body text-nv-text-2">
            {deletionCheck.data.consequences.map((baris) => (
              <li key={baris}>{baris}</li>
            ))}
          </ul>

          <p className="pt-3 text-caption text-nv-muted">
            {t('settings.deleteGrace')(deletionCheck.data.graceDays)}
          </p>

          <div className="pt-4">
            <Input
              label={t('settings.deleteTypeName')(deletionCheck.data.confirmPhrase)}
              value={frasa}
              onChange={(event) => setFrasa(event.target.value)}
            />
          </div>

          <Button
            variant="danger"
            className="mt-4 w-full"
            disabled={frasa !== deletionCheck.data.confirmPhrase || requestDeletion.isPending}
            onClick={() =>
              requestDeletion.mutate(undefined, {
                onSuccess: (hasil) => {
                  toast.show(t('settings.deleteQueued')(formatDate(new Date(hasil.purgeAt))), {
                    tone: 'success',
                  })
                  setKonfirmasiHapus(false)
                  setFrasa('')
                },
                onError: (error) => {
                  toast.show(error instanceof Error ? error.message : t('settings.deleteBlocked'), {
                    tone: 'danger',
                  })
                },
              })
            }
          >
            {t('settings.deleteConfirm')}
          </Button>
        </Modal>
      )}
    </div>
  )
}
