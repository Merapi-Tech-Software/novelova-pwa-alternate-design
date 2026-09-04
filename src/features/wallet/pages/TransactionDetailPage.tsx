import { Copy, Printer } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { TransactionDetail, TxStatus } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { CoinChip } from '@/components/patterns/CoinChip'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { useTransaction } from '../hooks/useTopup'

/**
 * Papan status · FR-WALLET-14.
 *
 * **Statusnya dibaca dari data transaksi, bukan dari `?status=`** — prototipe
 * mengambilnya dari URL, sehingga siapa pun bisa membuka transaksi gagal sebagai
 * "berhasil" dan halaman itu percaya (FR-WALLET-19).
 */
const BOARD: Record<TxStatus, { label: string; desc: string; tone: BadgeTone }> = {
  success: { label: t('tx.statusSuccess'), desc: t('tx.descSuccess'), tone: 'success' },
  pending: { label: t('tx.statusPending'), desc: t('tx.descPending'), tone: 'warning' },
  failed: { label: t('tx.statusFailed'), desc: t('tx.descFailed'), tone: 'danger' },
  reversed: { label: t('tx.statusReversed'), desc: t('tx.descReversed'), tone: 'info' },
}

export default function TransactionDetailPage() {
  const { txId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const query = useTransaction(txId)

  const notFound = isApiError(query.error) && query.error.code === 'NOT_FOUND'

  return (
    <div className="mx-auto w-full max-w-2xl pb-10">
      {/* Tanpa `<h1>` sendiri: `TopBarLayout` sudah merendernya. Dua `<h1>` di
          satu halaman membuat pembaca layar mengumumkan dua judul berbeda. */}

      {/* Id yang tidak ditemukan mendapat keadaan kosong yang sopan — bukan
          jatuh ke status sukses palsu seperti perilaku prototipe. */}
      {notFound && (
        <EmptyState
          variant="no-results"
          title={t('tx.notFoundTitle')}
          description={t('tx.notFoundBody')}
          action={{ label: t('tx.backToList'), onClick: () => navigate('/koin/transaksi') }}
        />
      )}

      {!notFound && query.error !== null && query.error !== undefined && (
        <FailureNotice
          level="inset"
          title="Detail transaksi tidak bisa dimuat"
          body="Permintaannya tidak sampai ke server."
          safety="Saldo dan buku besarmu tidak berubah."
          onRetry={() => void query.refetch()}
        />
      )}

      {query.data && <Detail tx={query.data} onCopy={(id) => void copyId(id, toast)} />}
    </div>
  )
}

async function copyId(id: string, toast: { show: (m: string) => void }) {
  try {
    await navigator.clipboard.writeText(id)
    toast.show(t('tx.copied')(id))
  } catch {
    toast.show(t('wallet.vaCopyFailed'))
  }
}

function Detail({ tx, onCopy }: { tx: TransactionDetail; onCopy: (id: string) => void }) {
  const board = BOARD[tx.status] ?? BOARD.success
  const displayId = tx.receiptNumber ?? tx.id
  const positive = tx.amount >= 0

  return (
    <>
      <section className="mx-4 rounded-nv-lg bg-nv-surface p-4">
        <Badge tone={board.tone}>{board.label}</Badge>
        <p className="pt-2 text-body text-nv-muted">{board.desc}</p>
      </section>

      <dl className="mx-4 mt-4 rounded-nv-lg border border-nv-line p-3.5">
        <Row label={positive ? t('tx.coinsIn') : t('tx.coinsOut')}>
          {/* Hanya `success` yang benar-benar memindahkan koin (FR-WALLET-14). */}
          <CoinChip amount={tx.status === 'success' ? Math.abs(tx.amount) : 0} format="exact" />
        </Row>

        {tx.priceRupiah !== null && (
          <Row label={t('tx.paid')}>
            <span className="text-body text-nv-text tabular-nums">
              {formatRupiah(tx.priceRupiah)}
            </span>
          </Row>
        )}

        {tx.bonusCoins !== null && tx.bonusCoins > 0 && (
          <Row label={t('tx.promo')}>
            <span className="text-body text-nv-text tabular-nums">+{tx.bonusCoins}</span>
          </Row>
        )}

        <Row label={t('tx.time')}>
          <span className="text-body text-nv-text">{formatDateTime(new Date(tx.createdAt))}</span>
        </Row>

        <Row label={t('tx.txId')}>
          <span className="font-mono text-caption text-nv-text">{displayId}</span>
        </Row>

        {tx.method && (
          <Row label={t('tx.method')}>
            <span className="text-body text-nv-text">{tx.method}</span>
          </Row>
        )}

        {tx.refLabel && (
          <Row label={t('tx.forWhat')}>
            {tx.refLink ? (
              <Link to={tx.refLink} className="text-body text-nv-accent underline">
                {tx.refLabel}
              </Link>
            ) : (
              <span className="text-body text-nv-text">{tx.refLabel}</span>
            )}
          </Row>
        )}

        <Row label={t('tx.balanceBefore')}>
          <CoinChip amount={tx.balanceBefore} format="exact" />
        </Row>
        <Row label={t('tx.balanceAfter')}>
          <CoinChip amount={tx.balanceAfter} format="exact" />
        </Row>
      </dl>

      {tx.status === 'pending' && (
        <p className="px-4 pt-2 text-caption text-nv-muted">{t('tx.promoPending')}</p>
      )}

      <div className="flex flex-wrap gap-2 px-4 pt-4">
        <Button variant="secondary" size="sm" onClick={() => onCopy(displayId)}>
          <Copy size={14} aria-hidden /> {t('tx.copyId')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.print()}>
          <Printer size={14} aria-hidden /> {t('tx.invoice')}
        </Button>
        <Link to="/bantuan" className="self-center text-body text-nv-accent underline">
          {t('tx.support')}
        </Link>
      </div>

      <div className="px-4 pt-4">
        <Link
          to="/koin"
          className="inline-flex h-11 items-center rounded-nv-pill bg-nv-accent px-4.5 text-body font-semibold text-nv-card"
        >
          {tx.status === 'pending' ? t('tx.payAgain') : t('tx.topupAgain')}
        </Link>
      </div>
    </>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <dt className="shrink-0 text-body text-nv-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right">{children}</dd>
    </div>
  )
}
