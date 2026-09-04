import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '@/api/client'
import type { ChapterAccessInfo, PrivateReason } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, Skeleton } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { todayLocalISO } from '@/lib/date'

type Access = ChapterAccessInfo['access']

const PRICE_MIN = 1
const PRICE_MAX = 50

const TYPES: Array<{ id: Access; label: string; desc: string }> = [
  { id: 'free', label: t('chapterAccess.tFree'), desc: t('chapterAccess.dFree') },
  { id: 'paid', label: t('chapterAccess.tPaid'), desc: t('chapterAccess.dPaid') },
  { id: 'private', label: t('chapterAccess.tPrivate'), desc: t('chapterAccess.dPrivate') },
]

const CONTEXT: Record<Access, string> = {
  free: t('chapterAccess.ctxFree'),
  paid: t('chapterAccess.ctxPaid'),
  private: t('chapterAccess.ctxPrivate'),
}

const REASONS: Array<{ value: PrivateReason; label: string }> = [
  { value: 'revisi', label: t('chapterAccess.rRevisi') },
  { value: 'sensitif', label: t('chapterAccess.rSensitif') },
  { value: 'ditarik', label: t('chapterAccess.rDitarik') },
  { value: 'lainnya', label: t('chapterAccess.rLainnya') },
]

export default function ChapterAccessPage() {
  const { chapterId } = useParams()
  const info = useQuery({
    queryKey: ['chapter-access', chapterId],
    queryFn: () => api.getChapterAccess(chapterId as string),
    enabled: chapterId !== undefined,
  })

  // Menunggu datanya turun: seluruh nilai awal halaman ini datang dari bab yang
  // sedang diatur, dan merendernya lebih dulu berarti menampilkan "Berbayar,
  // 3 koin" untuk bab mana pun — persis cacat prototipe (FR-STUDIO-36).
  if (!info.data) return <Skeleton lines={8} className="m-4" />
  return <AccessBody info={info.data} />
}

function AccessBody({ info }: { info: ChapterAccessInfo }) {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [access, setAccess] = useState<Access>(info.access)
  const [price, setPrice] = useState(info.access === 'paid' ? info.priceCoins : 3)
  const [previewPct, setPreviewPct] = useState(info.previewPct)
  const [reason, setReason] = useState<PrivateReason>(info.privateReason ?? 'revisi')
  const [autoReturn, setAutoReturn] = useState(info.privateUntil !== null)
  const [returnDate, setReturnDate] = useState(info.privateUntil ?? todayLocalISO())
  const [pending, setPending] = useState<Access | null>(null)

  const save = useMutation({
    mutationFn: () =>
      api.setChapterAccess({
        chapterId: info.chapterId,
        access,
        priceCoins: price,
        previewPct,
        privateReason: access === 'private' ? reason : null,
        privateUntil: access === 'private' && autoReturn ? returnDate : null,
      }),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['chapter-access'] })
      void queryClient.invalidateQueries({ queryKey: ['studio'] })
      toast.show(
        saved.access === 'free'
          ? t('chapterAccess.savedFree')
          : saved.access === 'paid'
            ? t('chapterAccess.savedPaid')(saved.priceCoins)
            : t('chapterAccess.savedPrivate'),
        { tone: 'success' },
      )
    },
    onError: (error) =>
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' }),
  })

  /**
   * Tombol simpan **membandingkan dengan nilai awal** · FR-STUDIO-23.
   *
   * Bukan mendeteksi interaksi: mengubah tipe lalu mengembalikannya harus
   * membuat tombolnya nonaktif lagi, karena memang tidak ada yang berubah.
   */
  const changed =
    access !== info.access ||
    previewPct !== info.previewPct ||
    (access === 'paid' && price !== info.priceCoins) ||
    (access === 'private' &&
      (reason !== (info.privateReason ?? 'revisi') ||
        (autoReturn ? returnDate : null) !== info.privateUntil))

  const paidBlocked = !info.authorVerified || info.freeLockDaysLeft > 0

  /**
   * Tiga transisi berisiko ditahan konfirmasi · FR-STUDIO-24.
   *
   * Tipe tujuan disimpan di `pending` dan **baru diterapkan setelah disetujui** —
   * membatalkan tidak boleh meninggalkan jejak apa pun. Memilih tipe yang sama
   * dengan yang sedang aktif diabaikan: konfirmasi tanpa perubahan nyata hanya
   * mengajari penulis menekan "ya" tanpa membaca.
   */
  function request(next: Access) {
    if (next === access) return
    if (next === 'paid' && paidBlocked) return
    if (next === 'private' && !info.canBePrivate) return

    // Tiga transisi yang ditahan; Gratis → Berbayar tidak, karena ia tidak
    // merugikan siapa pun.
    const risky =
      (access === 'paid' && next === 'free') || next === 'private' || access === 'private'

    if (risky) setPending(next)
    else setAccess(next)
  }

  const confirmCopy = {
    free: {
      title: t('chapterAccess.confirmFreeTitle'),
      body: t('chapterAccess.confirmFreeBody')(info.buyers),
    },
    private: {
      title: t('chapterAccess.confirmPrivateTitle'),
      body: t('chapterAccess.confirmPrivateBody'),
    },
    paid: {
      title: t('chapterAccess.confirmShowTitle'),
      body: t('chapterAccess.confirmShowBody'),
    },
  }[pending ?? 'free']

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10">
      {/* Tanpa `<h1>` dan tanpa tombol kembali sendiri: keduanya sudah dirender
          `TopBarLayout`. Halaman kedalaman kedua yang menulis ulang keduanya
          menghasilkan **dua `<h1>`** dan dua panah kembali bertumpuk. */}
      <p className="text-body text-nv-muted">
        {t('chapterAccess.forChapter')(info.number, info.title)}
      </p>

      <div className="grid grid-cols-1 gap-2.5 pt-5">
        {TYPES.map((type) => {
          const on = access === type.id
          const blocked =
            (type.id === 'paid' && paidBlocked) || (type.id === 'private' && !info.canBePrivate)

          return (
            <button
              key={type.id}
              type="button"
              aria-pressed={on}
              disabled={blocked}
              onClick={() => request(type.id)}
              className={cx(
                'rounded-nv-lg border p-3.5 text-left transition disabled:opacity-50',
                on ? 'border-nv-accent bg-nv-accent-soft' : 'border-nv-line bg-nv-card',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-body text-nv-text">{type.label}</span>
                {on && (
                  <span className="rounded-nv-pill bg-nv-accent px-2 py-0.5 text-caption text-nv-card">
                    {t('chapterAccess.active')}
                  </span>
                )}
              </span>
              <span className="block pt-0.5 text-caption text-nv-muted">{type.desc}</span>

              {/* Opsi yang ditahan menyebut **alasannya**, bukan sekadar mati. */}
              {type.id === 'private' && !info.canBePrivate && (
                <span className="block pt-1.5 text-caption text-nv-danger">
                  {t('chapterAccess.firstChapterLocked')}
                </span>
              )}
              {type.id === 'paid' && info.freeLockDaysLeft > 0 && (
                <span className="block pt-1.5 text-caption text-nv-danger">
                  {t('chapterAccess.freeLocked')(info.freeLockDaysLeft)}
                </span>
              )}
              {type.id === 'paid' && !info.authorVerified && (
                <span className="block pt-1.5 text-caption text-nv-danger">
                  {t('chapterAccess.needVerified')}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {!info.authorVerified && (
        <p className="pt-2">
          <Link
            to="/karya/daftar-penulis"
            className="text-caption font-semibold text-nv-accent underline"
          >
            {t('chapterAccess.verifyNow')}
          </Link>
        </p>
      )}

      <p className="pt-4 text-caption text-nv-muted">{CONTEXT[access]}</p>

      {access === 'paid' && (
        <Card className="mt-4 p-4">
          <p className="font-semibold text-body text-nv-text">{t('chapterAccess.price')}</p>
          <div className="flex items-center gap-3 pt-2">
            <IconButton
              label={t('chapterAccess.priceDown')}
              size="sm"
              onClick={() => setPrice((p) => Math.max(PRICE_MIN, p - 1))}
            >
              <Minus size={16} />
            </IconButton>
            <span className="font-display text-title font-bold text-nv-text tabular-nums">
              {price}
            </span>
            <span className="text-caption text-nv-muted">{t('chapterAccess.priceUnit')}</span>
            <IconButton
              label={t('chapterAccess.priceUp')}
              size="sm"
              onClick={() => setPrice((p) => Math.min(PRICE_MAX, p + 1))}
            >
              <Plus size={16} />
            </IconButton>
          </div>
          <p className="pt-2 text-caption text-nv-muted">
            {t('chapterAccess.priceSuggestion')(info.wordCount)}
          </p>

          {/* Bagi hasilnya datang dari server (`authorSharePct`), bukan dari
              konstanta klien — `lib/coin.ts` melarang tegas memakai
              `AUTHOR_SHARE` untuk angka penghasilan yang ditampilkan. */}
          <dl className="mt-3 rounded-nv-md bg-nv-surface p-3">
            <p className="pb-1 font-semibold text-caption text-nv-muted">
              {t('chapterAccess.earnTitle')}
            </p>
            {[
              { label: t('chapterAccess.earnGross'), value: price * 100 },
              {
                label: t('chapterAccess.earnPlatform')(info.authorSharePct),
                value: Math.round((price * 100 * (100 - info.authorSharePct)) / 100),
              },
              {
                label: t('chapterAccess.earnAuthor')(info.authorSharePct),
                value: Math.round((price * 100 * info.authorSharePct) / 100),
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-0.5">
                <dt className="text-caption text-nv-muted">{row.label}</dt>
                <dd className="font-semibold text-caption text-nv-text tabular-nums">
                  {row.value.toLocaleString('id-ID')}
                </dd>
              </div>
            ))}
          </dl>

          <label className="mt-4 block">
            <span className="font-semibold text-body text-nv-text">
              {t('chapterAccess.preview')} · {previewPct}%
            </span>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={previewPct}
              onChange={(e) => setPreviewPct(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--nv-accent)]"
            />
          </label>
          <p className="pt-1 text-caption text-nv-muted">{t('chapterAccess.previewHint')}</p>
        </Card>
      )}

      {access === 'private' && (
        <Card className="mt-4 p-4">
          <p className="text-caption text-nv-muted">{t('chapterAccess.pNote')}</p>
          <Select
            label={t('chapterAccess.pReason')}
            className="mt-3"
            value={reason}
            options={REASONS}
            onChange={(e) => setReason(e.target.value as PrivateReason)}
          />
          <Select
            label={t('chapterAccess.pDuration')}
            className="mt-3"
            value={autoReturn ? 'auto' : 'manual'}
            options={[
              { value: 'manual', label: t('chapterAccess.pUntilManual') },
              { value: 'auto', label: t('chapterAccess.pUntilDate') },
            ]}
            onChange={(e) => setAutoReturn(e.target.value === 'auto')}
          />
          {autoReturn && (
            <Input
              label={t('chapterAccess.pReturnDate')}
              className="mt-3"
              type="date"
              value={returnDate}
              min={todayLocalISO()}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          )}
        </Card>
      )}

      <Button
        block
        className="mt-6"
        disabled={!changed || save.isPending}
        onClick={() => save.mutate()}
      >
        {changed ? t('chapterAccess.save') : t('chapterAccess.noChange')}
      </Button>

      {/* Jalan kembali **ke posisi bab ini** tetap ada (FR-STUDIO-36) — sebagai
          tautan di dalam isi, bukan panah kedua di kepala halaman. Tombol
          kembali bilah atas memakai riwayat peramban, yang tidak tahu jangkar
          babnya saat halaman dibuka lewat tautan langsung. */}
      <p className="pt-4 text-center">
        <Link
          to={`/karya/${info.storyId}/bab#bab-${info.number}`}
          className="text-body text-nv-accent underline"
        >
          {t('chapterAccess.back')}
        </Link>
      </p>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={confirmCopy.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {t('action.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (pending) setAccess(pending)
                setPending(null)
              }}
            >
              {t('chapterAccess.confirmYes')}
            </Button>
          </>
        }
      >
        <p className="text-body text-nv-muted">{confirmCopy.body}</p>
      </Modal>
    </div>
  )
}
