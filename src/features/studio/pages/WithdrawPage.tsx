import { useState } from 'react'
import { Link } from 'react-router'
import { PAYOUT_PURPOSES } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { StageTrack } from '@/components/patterns/StageTrack'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { formatRupiah } from '@/lib/format'
import { netAfterFee, parseAmountInput, refusePayout } from '@/lib/payout'
import {
  usePayoutAccount,
  usePayoutBalance,
  usePayoutRate,
  useRequestWithdrawal,
} from '../hooks/useEarnings'

const STAGES = [t('withdraw.s1'), t('withdraw.s2'), t('withdraw.s3')] as const

/**
 * Pengajuan pencairan `/penulis/penarikan` · FR-EARN-06..09 & FR-EARN-11.
 *
 * Prototipe menerima **apa pun**: Rp 0 lolos, jumlah melebihi saldo lolos, dan
 * batas minimum hanya kalimat keterangan (PRD 08 §7 #2 dan #3). Di sini tangga
 * lima tingkat menegakkannya — dan menegakkannya **dua kali**, di layar untuk
 * mematikan tombol lebih dulu, di server untuk menolak layar yang dilewati.
 * Aturannya satu berkas, `lib/payout.ts`, supaya keduanya tidak pernah berbeda.
 */
export default function WithdrawPage() {
  const toast = useToast()
  const balance = usePayoutBalance()
  const account = usePayoutAccount()
  const rate = usePayoutRate()
  const submit = useRequestWithdrawal()

  const [raw, setRaw] = useState('')
  const [purpose, setPurpose] = useState<string>(PAYOUT_PURPOSES[0])
  const [note, setNote] = useState<string | null>(null)

  const amount = parseAmountInput(raw)
  const fee = rate.data?.feeRupiah ?? 0
  const min = rate.data?.minRupiah ?? 0
  const available = balance.data?.available ?? 0

  // Ringkasan dihitung ulang tiap ketikan · FR-EARN-08, dan bersihnya dijepit
  // nol supaya jumlah di bawah biaya admin tidak tampil negatif.
  const net = netAfterFee(amount, fee)

  const refusal =
    balance.data && account.data && rate.data
      ? refusePayout({
          amount,
          available,
          min,
          payoutVerified: account.data.payoutVerified,
          twoFactor: account.data.twoFactor,
        })
      : { level: 1 as const, message: '' }

  async function onSubmit() {
    if (refusal) return
    try {
      const saved = await submit.mutateAsync({
        amount,
        bankAccountId: 'bank1',
        purpose,
        idempotencyKey: crypto.randomUUID(),
      })
      setRaw('')
      setNote(t('withdraw.done')(formatRupiah(saved.amount)))
    } catch (error) {
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' })
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-28">
      {/* Judul dan tombol kembali sudah dirender `TopBarLayout`. */}
      <AsyncState
        loading={balance.isPending || account.isPending || rate.isPending}
        error={balance.error ?? account.error ?? rate.error}
        data={balance.data && account.data && rate.data ? true : undefined}
        onRetry={() => void balance.refetch()}
        empty={{ title: '', description: '' }}
      >
        {() => (
          <>
            {/* Saldo dan **kedua syaratnya** tampil sebelum formulir · FR-EARN-06:
                penulis tidak boleh mengisi lalu ditolak karena aturan yang baru
                ia baca sesudahnya. */}
            <Card>
              <p className="text-caption tracking-widest text-nv-muted uppercase">
                {t('withdraw.balance')}
              </p>
              <p className="pt-0.5 font-display text-stat tabular-nums">
                {formatRupiah(available)}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 border-nv-line border-t pt-3 text-caption">
                <div>
                  <dt className="tracking-widest text-nv-muted uppercase">{t('withdraw.min')}</dt>
                  <dd className="pt-0.5 tabular-nums">{formatRupiah(min)}</dd>
                </div>
                <div>
                  <dt className="tracking-widest text-nv-muted uppercase">{t('withdraw.eta')}</dt>
                  <dd className="pt-0.5">{t('withdraw.etaValue')}</dd>
                </div>
              </dl>
              <p className="pt-2 text-caption text-nv-muted">{t('withdraw.beforeForm')}</p>
            </Card>

            {balance.data && balance.data.pending > 0 && (
              <p className="pt-3 text-caption text-nv-muted tabular-nums">
                {t('withdraw.heldTitle')}: {t('withdraw.held')(formatRupiah(balance.data.pending))}
              </p>
            )}

            <StageTrack stages={STAGES} current={0} className="pt-4" />
            <p className="pt-2 text-caption text-nv-muted">{t('withdraw.stepsNote')}</p>

            {/* Rekening tujuan · FR-EARN-07. Nomornya **sudah tersamar dari
                server** — yang tidak pernah dikirim penuh tidak bisa bocor. */}
            <Card className="mt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-section">{account.data?.bankName}</h2>
                <span
                  className={
                    account.data?.payoutVerified
                      ? 'rounded-nv-pill border border-nv-accent px-2 py-0.5 text-caption text-nv-accent uppercase'
                      : 'rounded-nv-pill border border-nv-danger px-2 py-0.5 text-caption text-nv-danger uppercase'
                  }
                >
                  {account.data?.payoutVerified ? t('withdraw.verified') : t('withdraw.unverified')}
                </span>
              </div>
              <p className="pt-1 text-body">{account.data?.ownerName}</p>
              <p className="text-body text-nv-muted tabular-nums">{account.data?.masked}</p>
            </Card>

            <fieldset className="pt-4">
              <legend className="text-caption tracking-widest text-nv-muted uppercase">
                {t('withdraw.purpose')}
              </legend>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {PAYOUT_PURPOSES.map((option) => (
                  <Chip
                    key={option}
                    selected={purpose === option}
                    onClick={() => setPurpose(option)}
                  >
                    {option}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <label className="block pt-4" htmlFor="jumlah">
              <span className="text-caption tracking-widest text-nv-muted uppercase">
                {t('withdraw.amount')}
              </span>
              {/* `inputMode="numeric"` dengan `type="text"`: papan ketik angka di
                  HP, tetapi titik dan spasi tetap boleh diketik dan dibuang
                  `parseAmountInput` — `type="number"` menolaknya mentah-mentah. */}
              <input
                id="jumlah"
                type="text"
                inputMode="numeric"
                value={raw}
                placeholder="0"
                onChange={(e) => setRaw(e.target.value)}
                className="mt-1 h-14 w-full rounded-nv-md border border-nv-line bg-nv-card px-3 font-display text-page text-nv-text tabular-nums"
              />
            </label>
            <p className="pt-1 text-caption text-nv-muted">{t('withdraw.amountHint')}</p>

            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              disabled={available <= 0}
              onClick={() => setRaw(String(available))}
            >
              {t('withdraw.all')}
            </Button>

            <Card className="mt-4">
              <dl className="text-body tabular-nums">
                <div className="flex justify-between py-0.5">
                  <dt>{t('withdraw.requested')}</dt>
                  <dd>{formatRupiah(amount)}</dd>
                </div>
                <div className="flex justify-between py-0.5">
                  <dt>{t('withdraw.fee')}</dt>
                  <dd>{formatRupiah(fee)}</dd>
                </div>
                <div className="mt-2 flex justify-between border-nv-line border-t pt-2 text-nv-accent">
                  <dt>{t('withdraw.net')}</dt>
                  <dd>{formatRupiah(net)}</dd>
                </div>
              </dl>
            </Card>

            {/* Satu pesan, kesalahan pertama saja · FR-EARN-11. Lima keluhan
                sekaligus membuat penulis memperbaiki lima hal padahal satu pun
                belum tentu benar. Kolom kosong tidak dianggap kesalahan. */}
            {refusal && amount > 0 && (
              <p
                role="alert"
                className="mt-3 rounded-nv-md border border-nv-danger p-3 text-body text-nv-danger"
              >
                {refusal.message}
                {refusal.link && (
                  <Link to={refusal.link} className="block pt-1 underline">
                    {t('withdraw.fixIt')}
                  </Link>
                )}
              </p>
            )}

            <p className="pt-3 text-body text-nv-muted" role="status">
              {note ?? t('withdraw.idle')}
            </p>

            <Link
              to="/penulis/penarikan/riwayat"
              className="mt-3 inline-block text-body text-nv-accent underline"
            >
              {t('withdraw.history')}
            </Link>

            {/* Dok bawah, selalu terlihat · FR-EARN-09. `--nv-bottom-nav` bukan
                `bottom-0`: layar ini hidup di dalam `topbar`, tetapi polanya
                sama dan menaruhnya di nol adalah cara tercepat menutupi tombol
                uang di HP (CLAUDE.md §8). */}
            <div className="fixed inset-x-0 bottom-0 border-nv-line border-t bg-nv-card p-3">
              <div className="mx-auto flex max-w-2xl items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-caption text-nv-muted tabular-nums">
                  {t('withdraw.net')} {formatRupiah(net)}
                </span>
                <Button
                  className="shrink-0"
                  disabled={refusal !== null || submit.isPending}
                  onClick={() => void onSubmit()}
                >
                  {submit.isPending ? t('withdraw.submitting') : t('withdraw.submit')}
                </Button>
              </div>
            </div>
          </>
        )}
      </AsyncState>
    </div>
  )
}
