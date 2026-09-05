import { useEffect, useRef, useState } from 'react'
import type { TopupOrder } from '@/api/contracts'
import { CoinChip } from '@/components/patterns/CoinChip'
import { Button } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'
import { Sheet } from '@/components/ui/Modal'
import { t } from '@/i18n/t'
import { formatCountdown, formatRupiah } from '@/lib/format'

/** Enam keadaan yang bisa menutupi layar isi koin. Hanya satu aktif. */
export type PayPhase = 'connecting' | 'waiting' | 'qris' | 'va' | 'success' | 'failed'

/**
 * Tiga jalan gagal yang berbeda · arch §1.4.
 *
 * Dipisah karena **akibatnya bagi pengguna berbeda**, bukan karena kodenya
 * berbeda: `declined` berarti uangnya jelas tidak berpindah, `unconfirmed`
 * berarti uangnya **mungkin** sudah berpindah — dan hanya yang kedua membuat
 * "coba lagi" jadi saran yang berbahaya.
 */
export type FailureKind = 'declined' | 'unconfirmed' | 'expired' | 'unknown'

export interface PaymentFailure {
  kind: FailureKind
  body?: string
  /** `"PAY-410 · GoPay · 21.44 WIB"` — kecil, untuk dibacakan ke dukungan. */
  code?: string
}

const FAIL_COPY: Record<FailureKind, { title: string; safety: string }> = {
  declined: { title: t('wallet.failDeclinedTitle'), safety: t('wallet.failDeclinedSafe') },
  unconfirmed: { title: t('wallet.failUnconfirmedTitle'), safety: t('wallet.failUnconfirmedSafe') },
  expired: { title: t('wallet.failExpiredTitle'), safety: t('wallet.failExpiredSafe') },
  unknown: { title: t('wallet.failedTitle'), safety: t('wallet.failedSafe') },
}

export interface PaymentOverlayProps {
  phase: PayPhase | null
  order: TopupOrder | null
  balance: number
  failure: PaymentFailure | null
  confirming: boolean
  onCancel: () => void
  onConfirm: () => void
  onExpire: () => void
  onRetry: () => void
  onOtherMethod: () => void
  /** Kedaluwarsa: pesanan lama tidak bisa dihidupkan, jadi mulai yang baru. */
  onNewOrder: () => void
  /** Belum dipastikan: tanya lagi tanpa membayar apa pun. */
  onRecheck: () => void
  onHistory: () => void
  onCopyVa: () => void
  onHowVa: () => void
  onSaveQr: () => void
  onShareQr: () => void
  /** Tujuan utama setelah sukses — berbeda tergantung dari mana pembaca datang. */
  successPrimary: { label: string; onClick: () => void }
}

const TIMED: ReadonlySet<PayPhase> = new Set<PayPhase>(['waiting', 'qris', 'va'])

/**
 * Hitung mundur bersama · FR-WALLET-09.
 *
 * **Satu interval untuk seluruh metode**, dan hanya hidup selama komponennya
 * terpasang — berganti metode atau membatalkan melepas komponen ini, jadi tidak
 * ada hitungan hantu yang memunculkan layar gagal setelah dibatalkan.
 * `formatCountdown` yang memilih `HH:MM:SS` atau `MM:SS`.
 */
function Countdown({ until, onEnd }: { until: string; onEnd: () => void }) {
  const [left, setLeft] = useState(() => Date.parse(until) - Date.now())
  const ended = useRef(false)

  useEffect(() => {
    ended.current = false
    const id = window.setInterval(() => {
      const ms = Date.parse(until) - Date.now()
      setLeft(ms)
      if (ms <= 0 && !ended.current) {
        ended.current = true
        window.clearInterval(id)
        onEnd()
      }
    }, 1_000)
    return () => window.clearInterval(id)
  }, [until, onEnd])

  return (
    <div className="mt-4 flex items-center justify-between rounded-nv-lg bg-nv-paper-2 px-3.5 py-2.5">
      <span className="text-caption text-nv-muted">{t('wallet.timeLeft')}</span>
      <span className="font-semibold text-body text-nv-text tabular-nums">
        {formatCountdown(left)}
      </span>
    </div>
  )
}

/**
 * Kode QR simulasi.
 *
 * ponytail: pola deterministik dari payload, bukan QR yang benar-benar bisa
 * dipindai. Batas atasnya jelas — begitu penyedia sungguhan dipasang, ia
 * mengembalikan gambar QR-nya sendiri dan komponen ini diganti `<img>`.
 */
function QrPattern({ payload }: { payload: string }) {
  const cells: boolean[] = []
  let hash = 7
  for (const ch of payload) hash = (hash * 31 + ch.charCodeAt(0)) % 2_147_483_647
  for (let i = 0; i < 441; i += 1) {
    hash = (hash * 1_103_515_245 + 12_345) % 2_147_483_647
    cells.push(hash % 3 !== 0)
  }

  return (
    <div
      aria-hidden
      className="mx-auto mt-4 grid w-44 gap-px rounded-nv-lg bg-nv-card p-3 shadow-nv"
      style={{ gridTemplateColumns: 'repeat(21, minmax(0, 1fr))' }}
    >
      {cells.map((on, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: pola tetap, tidak pernah diurut ulang
          key={i}
          className={on ? 'aspect-square bg-nv-text' : 'aspect-square bg-transparent'}
        />
      ))}
    </div>
  )
}

/**
 * Satu lembar untuk seluruh alur bayar · FR-WALLET-06..12.
 *
 * Enam keadaan, satu komponen: `showOverlay()` prototipe menutup semua layar
 * lain sebelum membuka satu, dan cara paling murah menjamin itu adalah tidak
 * pernah punya dua. Di `≥640` `Sheet` sudah menjadi kartu terpusat, bukan layar
 * penuh (architecture.md §9.4).
 */
export function PaymentOverlay({
  phase,
  order,
  balance,
  failure,
  confirming,
  onCancel,
  onConfirm,
  onExpire,
  onRetry,
  onOtherMethod,
  onNewOrder,
  onRecheck,
  onHistory,
  onCopyVa,
  onHowVa,
  onSaveQr,
  onShareQr,
  successPrimary,
}: PaymentOverlayProps) {
  if (!phase || !order) return null

  const price = formatRupiah(order.priceRupiah)
  const received = order.coins + order.bonus

  const copy = {
    connecting: {
      kicker: t('wallet.connectingKicker'),
      title: t('wallet.connectingTitle')(order.method),
      body: t('wallet.connectingBody')(order.method),
    },
    waiting: {
      kicker: t('wallet.waitingKicker'),
      title: `${order.method} · ${price}`,
      body: t('wallet.waitingBody')(order.method),
    },
    qris: { kicker: t('wallet.qrisKicker'), title: price, body: t('wallet.qrisBody') },
    va: { kicker: t('wallet.vaKicker'), title: price, body: t('wallet.vaBody') },
    success: {
      kicker: t('wallet.successKicker'),
      title: t('wallet.successTitle'),
      body: t('wallet.successBody'),
    },
    failed: {
      kicker: t('wallet.failedKicker'),
      title: FAIL_COPY[failure?.kind ?? 'unknown'].title,
      body: failure?.body ?? t('wallet.failedFallback'),
    },
  }[phase]

  // Membatalkan tersedia di keempat layar pembayaran (FR-WALLET-12); menutup
  // komponennya sekaligus menghentikan hitung mundurnya.
  const cancelButton = (
    <Button variant="ghost" onClick={onCancel}>
      {t('action.cancel')}
    </Button>
  )

  const footer = {
    connecting: cancelButton,
    waiting: (
      <>
        {cancelButton}
        <Button onClick={onConfirm} disabled={confirming}>
          {t('wallet.checkStatus')}
        </Button>
      </>
    ),
    qris: (
      <>
        {cancelButton}
        <Button onClick={onConfirm} disabled={confirming}>
          {t('wallet.checkStatus')}
        </Button>
      </>
    ),
    va: (
      <>
        {cancelButton}
        <Button onClick={onConfirm} disabled={confirming}>
          {t('wallet.iTransferred')}
        </Button>
      </>
    ),
    success: (
      <>
        <Button variant="ghost" onClick={onHistory}>
          {t('wallet.history')}
        </Button>
        <Button onClick={successPrimary.onClick}>{successPrimary.label}</Button>
      </>
    ),
    failed: (
      <FailedActions
        kind={failure?.kind ?? 'unknown'}
        onOtherMethod={onOtherMethod}
        onRetry={onRetry}
        onNewOrder={onNewOrder}
        onRecheck={onRecheck}
        onConfirm={onConfirm}
        onHistory={onHistory}
        confirming={confirming}
      />
    ),
  }[phase]

  return (
    // Nama lembarnya menggabungkan kicker dan judul — "Pembayaran berhasil ·
    // Koin sudah masuk" memberi tahu keadaan sekaligus isinya, dan tidak
    // mengulang judul yang sudah terlihat tepat di bawahnya.
    <Sheet
      open
      onClose={onCancel}
      title={`${copy.kicker} · ${copy.title}`}
      hideTitle
      footer={footer}
    >
      <Confetti active={phase === 'success'} count={28} durationMs={2_200} />

      <p className="text-caption text-nv-muted uppercase tracking-wide">{copy.kicker}</p>
      <h2 className="pt-1 font-display text-section font-bold text-nv-text">{copy.title}</h2>
      <p className="pt-2 text-body text-nv-muted">{copy.body}</p>

      {TIMED.has(phase) && <Countdown until={order.expiresAt} onEnd={onExpire} />}

      {phase === 'qris' && order.payload && <QrPattern payload={order.payload} />}

      {phase === 'qris' && (
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSaveQr}>
            {t('wallet.saveQr')}
          </Button>
          <Button variant="secondary" size="sm" onClick={onShareQr}>
            {t('wallet.shareQr')}
          </Button>
        </div>
      )}

      {phase === 'va' && (
        <div className="mt-4 rounded-nv-lg border border-nv-line p-3.5">
          <p className="text-caption text-nv-muted">{order.bank ?? t('wallet.vaKicker')}</p>
          <p className="pt-1 font-mono text-section font-semibold text-nv-text tabular-nums">
            {order.payload}
          </p>
          <p className="pt-1 text-caption text-nv-muted">{t('wallet.vaExact')(price)}</p>
          <div className="flex gap-2 pt-3">
            <Button variant="secondary" size="sm" onClick={onCopyVa}>
              {t('wallet.copyVa')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onHowVa}>
              {t('wallet.howVa')}
            </Button>
          </div>
        </div>
      )}

      {phase === 'success' && (
        <dl className="mt-4 rounded-nv-lg bg-nv-paper-2 p-3.5">
          <div className="flex items-center justify-between">
            <dt className="text-body text-nv-muted">{t('wallet.successCoins')}</dt>
            <dd>
              <CoinChip amount={received} format="exact" />
            </dd>
          </div>
          <div className="flex items-center justify-between pt-2">
            <dt className="text-body text-nv-muted">{t('wallet.successBalance')}</dt>
            <dd>
              <CoinChip amount={balance} format="exact" />
            </dd>
          </div>
        </dl>
      )}

      {phase === 'failed' && (
        <>
          <p className="pt-3 text-body font-semibold text-nv-success">
            {FAIL_COPY[failure?.kind ?? 'unknown'].safety}
          </p>
          {/* Kecil, di bawah, dan selalu ada: untuk dibacakan ke dukungan —
              bukan untuk dipahami pengguna. */}
          {failure?.code && <p className="pt-2 text-caption text-nv-muted">{failure.code}</p>}
        </>
      )}
    </Sheet>
  )
}

/**
 * Aksi pemulihan per jalan gagal · FR-WALLET-11 · `[DESAIN]`.
 *
 * Tiap jalan punya pasangannya sendiri karena **tindakan yang benar berbeda**:
 * yang ditolak bank boleh langsung diulang, yang belum dipastikan justru tidak
 * boleh — mengulangnya adalah cara membayar dua kali — dan yang kedaluwarsa
 * butuh pesanan baru, bukan pesanan lama yang dihidupkan.
 */
function FailedActions({
  kind,
  onOtherMethod,
  onRetry,
  onNewOrder,
  onRecheck,
  onConfirm,
  onHistory,
  confirming,
}: {
  kind: FailureKind
  onOtherMethod: () => void
  onRetry: () => void
  onNewOrder: () => void
  onRecheck: () => void
  onConfirm: () => void
  onHistory: () => void
  confirming: boolean
}) {
  if (kind === 'unconfirmed') {
    return (
      <>
        <Button variant="ghost" onClick={onHistory}>
          {t('wallet.history')}
        </Button>
        <Button onClick={onRecheck}>{t('wallet.actRecheck')}</Button>
      </>
    )
  }

  if (kind === 'expired') {
    return (
      <>
        <Button variant="ghost" onClick={onNewOrder}>
          {t('wallet.actNewOrder')}
        </Button>
        <Button onClick={onConfirm} disabled={confirming}>
          {t('wallet.iTransferred')}
        </Button>
      </>
    )
  }

  return (
    <>
      <Button variant="ghost" onClick={onOtherMethod}>
        {t('wallet.otherMethod')}
      </Button>
      <Button onClick={onRetry}>
        {kind === 'declined' ? t('wallet.actSameMethod') : t('wallet.retry')}
      </Button>
    </>
  )
}
