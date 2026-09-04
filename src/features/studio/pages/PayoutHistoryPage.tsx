import { Link } from 'react-router'
import type { Withdrawal } from '@/api/contracts'
import { StageTrack } from '@/components/patterns/StageTrack'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { t } from '@/i18n/t'
import { formatDate, formatRupiah } from '@/lib/format'
import { usePayoutRate, useWithdrawals } from '../hooks/useEarnings'

/**
 * Tiga tahap pengajuan · FR-EARN-09 & FR-EARN-12. **Ditolak bukan tahap
 * keempat** — ia keluar dari jalur, dan menggambarkannya sebagai kelanjutan
 * membuat penulis mengira uangnya masih berjalan.
 */
const STAGES = [t('payout.sSubmitted'), t('payout.sReview'), t('payout.sTransferred')] as const

const STAGE_INDEX: Record<Withdrawal['status'], number> = {
  submitted: 0,
  review: 1,
  transferred: 2,
  rejected: 0,
}

/**
 * Riwayat pencairan `/penulis/penarikan/riwayat` · FR-EARN-12.
 *
 * Prototipe tidak punya riwayat sama sekali (PRD 08 §7 #8): penulis tidak bisa
 * melacak pencairan sebelumnya, dan penolakan hilang tanpa jejak. Halaman ini
 * juga tempat **rantai koin → rupiah** dijelaskan utuh, karena di sinilah
 * pertanyaan itu benar-benar muncul.
 */
export default function PayoutHistoryPage() {
  const rows = useWithdrawals()
  const rate = usePayoutRate()

  /**
   * Bukti transfer · FR-EARN-12. Berkas nyata dari klien, pola yang sama dengan
   * invoice cetak.
   *
   * ponytail: teks polos, bukan PDF berkop. Seluruh datanya sudah ada di klien,
   * dan bukti resmi datang dari server bersama backend aslinya.
   */
  function downloadProof(withdrawal: Withdrawal) {
    const lines = [
      `BUKTI TRANSFER ${withdrawal.id}`,
      `Tanggal    : ${formatDate(new Date(withdrawal.settledAt ?? withdrawal.requestedAt))}`,
      `Diminta    : ${formatRupiah(withdrawal.amount)}`,
      `Biaya admin: ${formatRupiah(withdrawal.fee)}`,
      `Diterima   : ${formatRupiah(withdrawal.net)}`,
      `Rekening   : ${withdrawal.bankName} ${withdrawal.bankAccountMasked}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `novelova-bukti-${withdrawal.id}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      {/* Judul dan tombol kembali sudah dirender `TopBarLayout`. */}
      <p className="text-body text-nv-muted">{t('payout.subtitle')(rows.data?.total ?? 0)}</p>

      <AsyncState
        loading={rows.isPending}
        error={rows.error}
        data={rows.data?.items}
        isEmpty={(items) => items.length === 0}
        onRetry={() => void rows.refetch()}
        empty={{
          title: t('payout.emptyTitle'),
          description: t('payout.emptyBody'),
          secondary: (
            <Link to="/penulis/penarikan" className="text-body text-nv-accent-strong underline">
              {t('payout.toWithdraw')}
            </Link>
          ),
        }}
      >
        {(items) => (
          <ol className="pt-2">
            {items.map((row) => (
              <li key={row.id}>
                <PayoutRow row={row} onProof={() => downloadProof(row)} />
              </li>
            ))}
          </ol>
        )}
      </AsyncState>

      {/* Rantai konversi · FR-EARN-12. Ditaruh **di bawah riwayat**, bukan di
          atasnya: pertanyaan "kenapa angkanya segini" muncul setelah penulis
          melihat angkanya, bukan sebelum. */}
      {rate.data && (
        <Card className="mt-6">
          <h2 className="font-display text-section">{t('payout.convTitle')}</h2>
          <p className="pt-1 text-body text-nv-muted tabular-nums">
            {t('payout.rate')(formatRupiah(rate.data.coinRateRupiah))}
          </p>
          <p className="pt-1 text-caption text-nv-muted">{t('payout.chain')}</p>

          <ol className="list-inside list-decimal pt-3 text-body tabular-nums">
            <li>{t('payout.step1')(rate.data.example.readerPaysCoins)}</li>
            <li>
              {t('payout.step2')(rate.data.example.platformCoins, rate.data.platformSharePct)}
            </li>
            <li>{t('payout.step3')(rate.data.example.authorCoins, rate.data.authorSharePct)}</li>
            <li>{t('payout.step4')(formatRupiah(rate.data.example.authorRupiah))}</li>
          </ol>

          <p className="pt-3 text-caption text-nv-muted tabular-nums">
            {t('payout.terms')(
              formatRupiah(rate.data.minRupiah),
              formatRupiah(rate.data.feeRupiah),
            )}
          </p>
        </Card>
      )}
    </div>
  )
}

/** Satu pengajuan: angka, lini masa, dan — bila ditolak — alasannya. */
function PayoutRow({ row, onProof }: { row: Withdrawal; onProof: () => void }) {
  return (
    <Card className="mt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-section tabular-nums">{formatRupiah(row.amount)}</p>
        <span
          className={
            row.status === 'rejected'
              ? 'rounded-nv-pill border border-nv-danger px-2 py-0.5 text-caption text-nv-danger'
              : 'rounded-nv-pill border border-nv-line px-2 py-0.5 text-caption text-nv-muted'
          }
        >
          {row.status === 'rejected' ? t('payout.sRejected') : STAGES[STAGE_INDEX[row.status]]}
        </span>
      </div>
      <p className="pt-0.5 text-caption text-nv-muted tabular-nums">
        {formatDate(new Date(row.requestedAt))} · {row.bankName} {row.bankAccountMasked}
      </p>

      {/* Lini masa hanya untuk yang masih di jalurnya. Menggambar tiga tahap di
          bawah pengajuan yang ditolak menyiratkan ia masih bergerak. */}
      {row.status !== 'rejected' && (
        <StageTrack stages={STAGES} current={STAGE_INDEX[row.status]} className="pt-3" />
      )}

      <dl className="grid grid-cols-3 gap-2 pt-3 text-caption tabular-nums">
        <div>
          <dt className="text-nv-muted">{t('payout.requested')}</dt>
          <dd>{formatRupiah(row.amount)}</dd>
        </div>
        <div>
          <dt className="text-nv-muted">{t('payout.fee')}</dt>
          <dd>{formatRupiah(row.fee)}</dd>
        </div>
        <div>
          <dt className="text-nv-muted">{t('payout.net')}</dt>
          <dd>{formatRupiah(row.net)}</dd>
        </div>
      </dl>

      {row.reason && (
        <p className="mt-3 rounded-nv-md border border-nv-danger p-3 text-body text-nv-danger">
          {row.reason}
        </p>
      )}

      {row.status === 'transferred' && (
        <Button size="sm" variant="secondary" className="mt-3" onClick={onProof}>
          {t('payout.proof')}
        </Button>
      )}
    </Card>
  )
}
