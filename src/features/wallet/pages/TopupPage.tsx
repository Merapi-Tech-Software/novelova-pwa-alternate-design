import { ChevronLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { PayMethod, TopupOrder } from '@/api/contracts'
import { ApiError } from '@/api/errors'
import { CoinChip } from '@/components/patterns/CoinChip'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import {
  bonusFor,
  COIN_PACKAGES,
  calcPrice,
  MIN_CUSTOM_COINS,
  smallestPackageFor,
} from '@/lib/coin'
import { cx } from '@/lib/cx'
import { formatNumber, formatRupiah, formatTimeZoned } from '@/lib/format'
import { type PaymentFailure, PaymentOverlay, type PayPhase } from '../components/PaymentOverlay'
import {
  useCancelTopup,
  useConfirmTopup,
  useCreateTopupOrder,
  useLastTopupMethod,
  usePayMethods,
  useRecheckTopup,
} from '../hooks/useTopup'

/** Lama layar "menghubungkan" sebelum berganti ke layar menunggu · FR-WALLET-06. */
const CONNECTING_MS = 1_800

type CustomState = 'neutral' | 'invalid' | 'valid'

interface MethodGroup {
  label: string
  methods: PayMethod[]
}

/**
 * Isi koin · FR-WALLET-01..12, FR-WALLET-18.
 *
 * Tiga langkah yang **saling mengunci ke belakang**: mengubah jumlah menutup
 * pilihan metode dan ringkasannya, dan mundur dari jumlah sah ke tidak sah
 * menutup keduanya lagi. Tanpa itu, ringkasan bisa menampilkan kombinasi lama
 * yang tidak pernah dipilih siapa pun.
 *
 * Datang dari gerbang bab (`?return=&chapter_id=&need=`) menyorot paket terkecil
 * yang mencukupi — **menyorot, bukan mengunci**: paket lain tetap dapat dipilih,
 * dan tombol utama di layar sukses membawa pembaca kembali ke bab yang sama.
 */
export default function TopupPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const returnTo = params.get('return')
  const needCoins = Number.parseInt(params.get('need') ?? '', 10)
  const need = Number.isNaN(needCoins) ? 0 : needCoins
  const suggested = need > 0 ? smallestPackageFor(need) : null

  const wallet = useWallet()
  const methods = usePayMethods()
  const lastMethod = useLastTopupMethod()

  const [pkgId, setPkgId] = useState<string | null>(suggested?.id ?? null)
  const [custom, setCustom] = useState('')
  const [methodId, setMethodId] = useState<string | null>(null)
  const [order, setOrder] = useState<TopupOrder | null>(null)
  const [phase, setPhase] = useState<PayPhase | null>(null)
  const [failure, setFailure] = useState<PaymentFailure | null>(null)

  const [reconciling, setReconciling] = useState(false)
  const createOrder = useCreateTopupOrder()
  const confirm = useConfirmTopup()
  const cancel = useCancelTopup()
  const recheck = useRecheckTopup()
  const connectTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(connectTimer.current), [])

  // Diurai persis seperti PRD: `parseInt` pada nilai mentah, sehingga masukan
  // campuran huruf-angka diambil bagian angkanya saja.
  const customN = Number.parseInt(custom, 10)
  const customState: CustomState =
    custom.trim() === '' || Number.isNaN(customN) || customN < 1
      ? 'neutral'
      : customN < MIN_CUSTOM_COINS
        ? 'invalid'
        : 'valid'

  const pkg = COIN_PACKAGES.find((p) => p.id === pkgId) ?? null
  // Keduanya tidak pernah hidup bersamaan (`[PRODUK]`): kolom kustom mati selama
  // ada paket terpilih, dan kartu paket mati begitu kolomnya berisi — termasuk
  // saat isinya belum sah, karena di situlah pembaca justru sedang mengetik.
  const customTyped = custom.trim() !== ''
  const coins = pkg?.coins ?? (customState === 'valid' ? customN : null)
  const bonus = coins === null ? 0 : bonusFor(coins)
  const price = coins === null ? 0 : (pkg?.priceRupiah ?? calcPrice(coins))
  const method = methods.data?.find((m) => m.id === methodId) ?? null

  const groups = useMemo<MethodGroup[]>(() => {
    const all = methods.data ?? []
    const byType = (type: PayMethod['type']) => all.filter((m) => m.type === type)
    const recent = all.find((m) => m.name === lastMethod.data)

    return [
      ...(recent ? [{ label: t('wallet.lastUsed'), methods: [recent] }] : []),
      { label: t('wallet.groupEwallet'), methods: byType('ewallet') },
      { label: t('wallet.groupQris'), methods: byType('qris') },
      { label: t('wallet.groupVa'), methods: byType('va') },
    ].filter((g) => g.methods.length > 0)
  }, [methods.data, lastMethod.data])

  /**
   * Memilih paket — dan **menekan paket yang sama sekali lagi membatalkannya**
   * (`[PRODUK]`).
   *
   * Selama satu paket terpilih, kolom kustom dinonaktifkan; pembatalan inilah
   * jalan kembalinya. Tanpa itu, menonaktifkan kolom berarti mengunci pembaca di
   * paket yang terlanjur dipilih.
   *
   * Mengubah jumlah selalu mengosongkan metode — FR-WALLET-04.
   */
  function pickPackage(id: string) {
    setPkgId((current) => (current === id ? null : id))
    setCustom('')
    setMethodId(null)
  }

  function onCustomChange(value: string) {
    setCustom(value)
    setPkgId(null)
    setMethodId(null)
  }

  /** Kode penyedia → jalan gagal. Yang menentukan layar bukan pesannya, tapi kodenya. */
  const failFrom = useCallback((error: unknown, methodName: string): PaymentFailure => {
    const at = formatTimeZoned(new Date())
    if (error instanceof ApiError) {
      const kind =
        error.code === 'PAY-402'
          ? 'declined'
          : error.code === 'PAY-504'
            ? 'unconfirmed'
            : error.code === 'PAY-410'
              ? 'expired'
              : 'unknown'
      return { kind, body: error.message, code: `${error.code} · ${methodName} · ${at}` }
    }
    return { kind: 'unknown', body: t('wallet.failedFallback') }
  }, [])

  async function pay() {
    if (coins === null || !method) return
    setFailure(null)

    try {
      const created = await createOrder.mutateAsync({
        coins,
        methodId: method.id,
        returnCtx: returnTo
          ? { route: returnTo, chapterId: params.get('chapter_id'), needCoins: need || null }
          : null,
        idempotencyKey: crypto.randomUUID(),
      })
      setOrder(created)

      if (created.methodType === 'ewallet') {
        // Layar menghubungkan dulu, baru layar menunggu — pembaca perlu tahu
        // aplikasi dompetnya sedang dipanggil, bukan aplikasinya menggantung.
        setPhase('connecting')
        connectTimer.current = window.setTimeout(() => setPhase('waiting'), CONNECTING_MS)
      } else {
        setPhase(created.methodType)
      }
    } catch (error) {
      setFailure(failFrom(error, method.name))
      setPhase('failed')
    }
  }

  async function onConfirm() {
    if (!order) return
    try {
      const paid = await confirm.mutateAsync(order.id)
      setOrder(paid)
      setPhase('success')
    } catch (error) {
      const next = failFrom(error, order.method)
      // ponytail: penanda lokal, hilang saat halaman dimuat ulang. Servernya
      // tetap menolak pesanan baru selama rekonsiliasi berjalan, jadi yang
      // hilang cuma kuncinya — bukan pengamannya. Sebuah `listTopupOrders`
      // akan membuatnya bertahan.
      if (next.kind === 'unconfirmed') setReconciling(true)
      setFailure(next)
      setPhase('failed')
    }
  }

  /** Bertanya lagi tanpa membayar apa pun · FR-WALLET-11. */
  async function onRecheck() {
    if (!order) return
    const fresh = await recheck.mutateAsync(order.id)
    setOrder(fresh)
    if (fresh.status === 'paid') {
      setReconciling(false)
      setPhase('success')
      return
    }
    toast.show(t('wallet.stillChecking'))
  }

  /** Batal menghentikan hitung mundur lebih dulu, baru menutup — FR-WALLET-12. */
  function onCancel() {
    window.clearTimeout(connectTimer.current)
    setPhase(null)
    if (order && order.status === 'pending') cancel.mutate(order.id)
    setOrder(null)
    // Jumlah dan metode sengaja dipertahankan: membatalkan bukan mengulang.
  }

  function onExpire() {
    if (!order) return
    setFailure({
      kind: 'expired',
      body: t('wallet.expiredReason')(order.method),
      code: `PAY-410 · ${order.method} · ${formatTimeZoned(new Date())}`,
    })
    setPhase('failed')
  }

  const balance = wallet.data?.balance ?? 0

  /** Tombol utama layar sukses menyesuaikan asal pembaca · FR-WALLET-18. */
  const successPrimary = returnTo?.includes('/bab/')
    ? { label: t('wallet.continueReading'), onClick: () => navigate(returnTo) }
    : returnTo?.startsWith('/cerita/')
      ? { label: t('wallet.backToStory'), onClick: () => navigate(returnTo) }
      : { label: t('wallet.startReading'), onClick: () => navigate('/') }

  async function copyVa() {
    try {
      await navigator.clipboard.writeText((order?.payload ?? '').replaceAll(' ', ''))
      toast.show(t('wallet.vaCopied'), { tone: 'success' })
    } catch {
      toast.show(t('wallet.vaCopyFailed'), { tone: 'danger' })
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-28">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link
          to={returnTo ?? '/'}
          aria-label={t('action.back')}
          className="grid size-9 shrink-0 place-items-center rounded-nv-pill border border-nv-line text-nv-text"
        >
          <ChevronLeft size={18} aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-section font-bold text-nv-text">{t('wallet.title')}</h1>
          <p className="text-caption text-nv-muted">{t('wallet.rate')}</p>
        </div>
        <CoinChip amount={balance} format="exact" />
      </header>

      <section className="mx-4 flex items-center justify-between gap-3 rounded-nv-lg bg-nv-surface px-4 py-3">
        <div>
          <p className="text-caption text-nv-muted">{t('wallet.promoTitle')}</p>
          <p className="pt-0.5 text-body font-semibold text-nv-text">{t('wallet.promoBody')}</p>
        </div>
        <span className="rounded-nv-pill bg-nv-accent px-3 py-1 font-semibold text-caption text-nv-card">
          {t('wallet.promoBadge')}
        </span>
      </section>

      {need > 0 && (
        <p className="mx-4 pt-3 text-body font-semibold text-nv-danger tabular-nums">
          {t('wallet.needMore')(need)}
        </p>
      )}

      <h2 className="px-4 pt-5 pb-2 font-semibold text-body text-nv-muted">{t('wallet.step1')}</h2>
      <div className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-3">
        {COIN_PACKAGES.map((p) => {
          const active = pkgId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => pickPackage(p.id)}
              aria-pressed={active}
              disabled={customTyped}
              {...(active ? { 'aria-label': t('wallet.deselect')(formatNumber(p.coins)) } : {})}
              className={cx(
                'rounded-nv-lg border p-3 text-left transition disabled:opacity-50',
                active ? 'border-nv-accent bg-nv-accent-soft' : 'border-nv-line bg-nv-card',
              )}
            >
              <CoinChip amount={p.coins} format="exact" />
              <span className="block pt-1 font-semibold text-body text-nv-text tabular-nums">
                {formatRupiah(p.priceRupiah)}
              </span>
              <span className="block pt-0.5 text-caption text-nv-muted">{p.note}</span>
              {suggested?.id === p.id && (
                <span className="block pt-1 text-caption font-semibold text-nv-accent">
                  {t('wallet.fitsChapter')}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {customTyped && (
        <p className="px-4 pt-2 text-caption text-nv-muted">{t('wallet.packagesLocked')}</p>
      )}

      <div className="px-4 pt-4">
        <Input
          label={t('wallet.customLabel')}
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          inputMode="numeric"
          placeholder={t('wallet.customPlaceholder')}
          disabled={pkg !== null}
          hint={
            pkg !== null
              ? t('wallet.customLocked')
              : customState === 'valid'
                ? formatRupiah(calcPrice(customN))
                : customState === 'neutral'
                  ? t('wallet.customHint')
                  : ''
          }
          error={customState === 'invalid' ? t('wallet.customInvalid') : ''}
          className="disabled:opacity-50"
        />
      </div>

      {coins !== null && (
        <>
          <h2 className="px-4 pt-6 pb-2 font-semibold text-body text-nv-muted">
            {t('wallet.step2')}
          </h2>
          {groups.map((group) => (
            <div key={group.label} className="px-4 pb-3">
              <p className="pb-1.5 text-caption text-nv-muted">{group.label}</p>
              <div className="grid grid-cols-1 gap-2">
                {group.methods.map((m) => (
                  <button
                    key={`${group.label}-${m.id}`}
                    type="button"
                    onClick={() => setMethodId(m.id)}
                    aria-pressed={methodId === m.id}
                    className={cx(
                      'flex items-center justify-between rounded-nv-lg border px-3.5 py-3 text-left transition',
                      methodId === m.id
                        ? 'border-nv-accent bg-nv-accent-soft'
                        : 'border-nv-line bg-nv-card',
                    )}
                  >
                    <span className="text-body text-nv-text">{m.name}</span>
                    <span className="text-caption text-nv-muted">
                      {t('wallet.limitMinutes')(m.expiryMinutes)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {coins !== null && method && (
        <>
          <h2 className="px-4 pt-3 pb-2 font-semibold text-body text-nv-muted">
            {t('wallet.step3')}
          </h2>
          <dl className="mx-4 rounded-nv-lg border border-nv-line p-3.5">
            <Row label={t('wallet.sumCoins')}>
              <CoinChip amount={coins} format="exact" />
            </Row>
            {bonus > 0 && (
              <Row label={t('wallet.sumBonus')}>
                <CoinChip amount={bonus} format="exact" />
              </Row>
            )}
            <Row label={t('wallet.sumTotal')}>
              <CoinChip amount={coins + bonus} format="exact" />
            </Row>
            <Row label={t('wallet.sumMethod')}>
              <span className="text-body text-nv-text">{method.name}</span>
            </Row>
            <Row label={t('wallet.sumPaid')}>
              <span className="font-semibold text-body text-nv-text tabular-nums">
                {formatRupiah(price)}
              </span>
            </Row>
          </dl>
        </>
      )}

      {/* Menempel **di atas** bilah navigasi, bukan di dasar layar: keduanya
          `fixed`, dan yang di bawah akan menutupi yang di atasnya. */}
      <div className="fixed inset-x-0 bottom-[var(--nv-bottom-nav)] z-30 border-nv-line border-t bg-nv-card px-4 py-3 lg:static lg:border-0 lg:bg-transparent lg:pt-5">
        <div className="mx-auto max-w-2xl">
          {reconciling && (
            <p className="pb-2 text-caption text-nv-muted">{t('wallet.reconcileLocked')}</p>
          )}
          <Button
            block
            onClick={() => void pay()}
            disabled={coins === null || !method || createOrder.isPending || reconciling}
          >
            {coins !== null && method
              ? t('wallet.pay')(formatRupiah(price))
              : t('wallet.payIncomplete')}
          </Button>
        </div>
      </div>

      <PaymentOverlay
        phase={phase}
        order={order}
        balance={balance}
        failure={failure}
        confirming={confirm.isPending}
        onCancel={onCancel}
        onConfirm={() => void onConfirm()}
        onExpire={onExpire}
        onRetry={() => {
          setPhase(null)
          setOrder(null)
          void pay()
        }}
        onOtherMethod={() => {
          setPhase(null)
          setOrder(null)
          setMethodId(null)
        }}
        onNewOrder={() => {
          setPhase(null)
          setOrder(null)
        }}
        onRecheck={() => void onRecheck()}
        onHistory={() => navigate('/koin/transaksi')}
        onCopyVa={() => void copyVa()}
        onHowVa={() => toast.show(t('wallet.howVaToast'))}
        onSaveQr={() => toast.show(t('wallet.qrSaved'), { tone: 'success' })}
        onShareQr={() => toast.show(t('wallet.qrShared'), { tone: 'success' })}
        successPrimary={successPrimary}
      />
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <dt className="text-body text-nv-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
