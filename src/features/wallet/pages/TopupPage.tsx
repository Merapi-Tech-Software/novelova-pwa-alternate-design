import { Check, ChevronLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { PayMethod, TopupOrder } from '@/api/contracts'
import { ApiError } from '@/api/errors'
import { CoinChip } from '@/components/patterns/CoinChip'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
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
    /*
      Ruang bawah menampung **dua** bilah yang sama-sama menempel di dasar layar:
      bilah bayar dan bilah navigasi. `pb-28` hanya menampung yang pertama, jadi
      baris terakhir halaman (keterangan kurs) tertutup bilah bayar. Di `lg`
      bilah bayarnya ikut mengalir, jadi ruangnya kembali normal.
    */
    <div className="mx-auto w-full max-w-2xl pb-40 lg:pb-10">
      {/* Membungkus di bawah 360px: chip saldo membawa saldo **dan** koin bonus,
          jadi lebarnya ~140px — cukup untuk memeras judul "Isi Koin" jadi dua
          baris dan `Rp 130 per koin` jadi tiga di layar 320px. Yang turun ke
          baris sendiri chip-nya, bukan judulnya. */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 pb-3">
        <Link
          to={returnTo ?? '/'}
          aria-label={t('action.back')}
          className="relative grid size-9 shrink-0 place-items-center rounded-nv-pill border border-nv-line text-nv-text after:absolute after:-inset-1 after:content-['']"
        >
          <ChevronLeft size={18} aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-section font-bold text-nv-text">{t('wallet.title')}</h1>
          <p className="text-caption text-nv-muted">{t('wallet.rate')}</p>
        </div>
        {/* Chip saldo **sama persis dengan `7a` dan `7i`**: pil bergaris rambut,
            glyph emas, saldo ringkas — dan koin bonus ditulis terpisah, karena
            ia tidak pernah bisa dibelanjakan (FR-WALLET-17). */}
        <CoinChip
          amount={balance}
          pill
          bonus={wallet.data?.bonus ?? 0}
          className="shrink-0 max-[359px]:order-last max-[359px]:basis-full max-[359px]:justify-center"
        />
      </header>

      <section className="mx-4 flex items-center justify-between gap-3 rounded-nv-lg bg-nv-paper-2 px-4 py-3">
        <div className="min-w-0">
          <p className="nv-section-label">{t('wallet.promoTitle')}</p>
          <p className="pt-0.5 text-body font-semibold text-nv-text">{t('wallet.promoBody')}</p>
        </div>
        <span className="shrink-0 rounded-nv-pill bg-nv-accent px-3 py-1 font-semibold text-caption text-nv-card tabular-nums">
          {t('wallet.promoBadge')}
        </span>
      </section>

      {need > 0 && (
        <p className="mx-4 pt-3 text-body font-semibold text-nv-text tabular-nums">
          {t('wallet.needMore')(need)}
        </p>
      )}

      <SectionHeader label={t('wallet.step1')} className="px-4 pt-5" />
      {/*
        **Daftar berpembatas, bukan ubin.** Brief §1 aturan 4: konten berulang
        jadi daftar, dan kartu dijatah enam peran yang tidak memuat "paket koin".
        Ubin dua kolom juga yang membuat `Rp 92,5/koin` pecah dua baris di 320px.

        Barisnya `aria-pressed`, bukan radio: menekan paket yang sudah terpilih
        **membatalkannya**, dan itulah jalan kembali dari kolom kustom yang
        dinonaktifkan (`architecture.md` §1.8).
      */}
      <ul className="mx-4 mt-2 border-nv-line border-t">
        {COIN_PACKAGES.map((p) => {
          const active = pkgId === p.id
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => pickPackage(p.id)}
                aria-pressed={active}
                disabled={customTyped}
                {...(active ? { 'aria-label': t('wallet.deselect')(formatNumber(p.coins)) } : {})}
                className="flex w-full items-center gap-3 border-nv-line border-b py-3 text-left transition disabled:opacity-40"
              >
                <span
                  aria-hidden
                  className={cx(
                    'grid size-5 shrink-0 place-items-center rounded-nv-pill border',
                    active ? 'border-nv-accent bg-nv-accent text-nv-card' : 'border-nv-line',
                  )}
                >
                  {active && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <CoinChip amount={p.coins} format="exact" />
                  <span className="block pt-0.5 text-caption text-nv-muted">{p.note}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span
                    className={cx(
                      'block text-body text-nv-text tabular-nums',
                      active ? 'font-bold' : 'font-semibold',
                    )}
                  >
                    {formatRupiah(p.priceRupiah)}
                  </span>
                  {suggested?.id === p.id && (
                    <span className="block pt-0.5 text-caption font-semibold text-nv-text-2">
                      {t('wallet.fitsChapter')}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

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
          <SectionHeader label={t('wallet.step2')} className="px-4 pt-6" />
          {groups.map((group) => (
            <div key={group.label} className="px-4">
              <p className="nv-section-label pt-3 pb-1">{group.label}</p>
              <ul className="border-nv-line border-t">
                {group.methods.map((m) => (
                  <li key={`${group.label}-${m.id}`}>
                    <button
                      type="button"
                      onClick={() => setMethodId(m.id)}
                      aria-pressed={methodId === m.id}
                      className="flex w-full items-center gap-3 border-nv-line border-b py-3 text-left transition"
                    >
                      <span
                        aria-hidden
                        className={cx(
                          'grid size-5 shrink-0 place-items-center rounded-nv-pill border',
                          methodId === m.id
                            ? 'border-nv-accent bg-nv-accent text-nv-card'
                            : 'border-nv-line',
                        )}
                      >
                        {methodId === m.id && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 text-body text-nv-text">{m.name}</span>
                      <span className="shrink-0 text-caption text-nv-muted tabular-nums">
                        {t('wallet.limitMinutes')(m.expiryMinutes)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {coins !== null && method && (
        <>
          <SectionHeader label={t('wallet.step3')} className="px-4 pt-5" />
          <dl className="mx-4 mt-2 rounded-nv-lg border border-nv-line-soft p-3.5">
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
