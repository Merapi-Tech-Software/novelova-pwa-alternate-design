import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import type { Transaction } from '@/api/contracts'
import { Badge, type BadgeTone } from '@/components/ui/Chip'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'
import { cx } from '@/lib/cx'
import { formatRelative } from '@/lib/format'

const TONE: Record<Transaction['status'], BadgeTone> = {
  success: 'success',
  pending: 'warning',
  failed: 'danger',
  reversed: 'info',
}

/**
 * Label empat status, **diekspor**: panel "Status kuitansi" di halaman buku
 * besar dulu mencetak nilai enum-nya apa adanya (`success`, `reversed`), dan
 * dua tempat yang menamai keadaan yang sama harus memakai satu daftar.
 */
export const TX_STATUS_LABEL: Record<Transaction['status'], string> = {
  success: t('tx.rowSuccess'),
  pending: t('tx.rowPending'),
  failed: t('tx.rowFailed'),
  reversed: t('tx.rowReversed'),
}

/** Alasan koin bergerak. Dipakai baris **dan** peta pengeluaran. */
export const TX_REF_LABEL: Record<Transaction['refType'], string> = {
  chapter: t('tx.refChapter'),
  bundle: t('tx.refBundle'),
  story: t('tx.refStory'),
  topup: t('tx.refTopup'),
  mission: t('tx.refMission'),
  checkin: t('tx.refCheckin'),
  withdrawal: t('tx.refWithdrawal'),
}

/**
 * Satu baris buku besar · FR-WALLET-15 · FR-WALLET-19.
 *
 * **Setiap baris menuju ke suatu tempat.** Baris hadiah ke pusat hadiah, sisanya
 * ke halaman detailnya — prototipe hanya menautkan baris top-up, sehingga
 * pengeluaran koin tidak punya alamat sama sekali.
 *
 * Tandanya datang dari `amount`, bukan dari jenisnya: refund berjenis `refund`
 * tetapi menambah saldo, dan membaca tandanya dari jenis akan membuatnya tampil
 * merah.
 *
 * **Nominalnya tinta, bukan hijau/merah penuh** (R8c). Yang membedakan masuk
 * dari keluar adalah tandanya — `+` dan `−` — dan tanda itu sudah cukup. Warna
 * penuh di setiap baris membuat buku besar terbaca sebagai daftar peringatan,
 * dan di halaman ini tidak ada satu pun baris yang berbahaya. Merah tetap
 * dipakai, tetapi hanya di tempat yang memang gagal: lencana statusnya.
 */
export function TransactionRow({ tx }: { tx: Transaction }) {
  const positive = tx.amount >= 0
  const to = tx.kind === 'reward' ? '/hadiah' : `/koin/transaksi/${tx.id}`

  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-nv-line border-b px-4 py-3 transition last:border-0 hover:bg-nv-paper-2"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-body text-nv-text">{tx.title}</p>
        <p className="pt-0.5 text-caption text-nv-muted">
          {[tx.method, formatRelative(new Date(tx.createdAt))].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cx(
            'font-semibold text-body tabular-nums',
            positive ? 'text-nv-text' : 'text-nv-text-2',
          )}
        >
          {positive ? '+' : '−'}
          {formatCompactCoin(Math.abs(tx.amount))}
        </p>
        {tx.status !== 'success' && (
          <Badge tone={TONE[tx.status]} className="mt-1">
            {TX_STATUS_LABEL[tx.status]}
          </Badge>
        )}
      </div>

      <ChevronRight size={16} className="shrink-0 text-nv-muted" aria-hidden />
    </Link>
  )
}
