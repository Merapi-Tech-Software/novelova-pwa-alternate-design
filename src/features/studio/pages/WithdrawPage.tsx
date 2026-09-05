import { Check } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PAYOUT_PURPOSES } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { StageTrack } from '@/components/patterns/StageTrack'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
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
 *
 * **R9a mengganti kulitnya saja.** `lib/payout.ts` tidak disentuh satu baris pun,
 * dan urutan layarnya tidak berubah: saldo dan kedua syaratnya tetap tampil
 * **sebelum** formulir.
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
            {/* Brankas: panel putih, angka serif — pola yang sama dengan
                `7i` dan buku besar dompet. Ia satu-satunya blok putih di
                halaman ini, dan itu disengaja: ia satu-satunya yang menyatakan
                berapa uang yang benar-benar ada. */}
            <section className="rounded-nv-lg bg-nv-card p-4">
              <p className="nv-section-label">{t('withdraw.balance')}</p>
              <p className="pt-1 font-display text-stat font-bold text-nv-gold tabular-nums">
                {formatRupiah(available)}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 border-nv-line border-t pt-3">
                <div>
                  <dt className="nv-section-label">{t('withdraw.min')}</dt>
                  <dd className="pt-1 font-display text-card font-bold tabular-nums">
                    {formatRupiah(min)}
                  </dd>
                </div>
                <div>
                  <dt className="nv-section-label">{t('withdraw.eta')}</dt>
                  <dd className="pt-1 font-display text-card font-bold">
                    {t('withdraw.etaValue')}
                  </dd>
                </div>
              </dl>
              <p className="pt-3 text-caption text-nv-muted">{t('withdraw.beforeForm')}</p>
            </section>

            {balance.data && balance.data.pending > 0 && (
              <p className="pt-3 text-caption text-nv-muted tabular-nums">
                {t('withdraw.heldTitle')}: {t('withdraw.held')(formatRupiah(balance.data.pending))}
              </p>
            )}

            <StageTrack stages={STAGES} current={0} className="pt-4" />
            <p className="pt-2 text-caption text-nv-muted">{t('withdraw.stepsNote')}</p>

            {/* Rekening tujuan · FR-EARN-07. Nomornya **sudah tersamar dari
                server** — yang tidak pernah dikirim penuh tidak bisa bocor. */}
            <div className="mt-5 border-nv-line border-y py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-section font-bold">{account.data?.bankName}</h2>
                <span
                  className={cx(
                    'rounded-nv-pill border px-2.5 py-0.5 font-semibold text-caption',
                    account.data?.payoutVerified
                      ? 'border-nv-line-soft text-nv-text-2'
                      : 'border-nv-danger text-nv-danger',
                  )}
                >
                  {account.data?.payoutVerified ? t('withdraw.verified') : t('withdraw.unverified')}
                </span>
              </div>
              <p className="pt-1 text-body">{account.data?.ownerName}</p>
              <p className="text-body text-nv-muted tabular-nums">{account.data?.masked}</p>
            </div>

            {/* Tiga pilihan → daftar berpembatas, bentuk yang sama dengan
                daftar metode pembayaran di `/koin`. Pil dipakai hanya di tempat
                mockup menggambar pil (brief §1 aturan 5). */}
            <SectionHeader label={t('withdraw.purpose')} className="pt-6" />
            <ul className="mt-2 border-nv-line border-t">
              {PAYOUT_PURPOSES.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => setPurpose(option)}
                    aria-pressed={purpose === option}
                    className="flex w-full items-center gap-3 border-nv-line border-b py-3 text-left"
                  >
                    <span
                      aria-hidden
                      className={cx(
                        'grid size-5 shrink-0 place-items-center rounded-nv-pill border',
                        purpose === option
                          ? 'border-nv-accent bg-nv-accent text-nv-card'
                          : 'border-nv-line',
                      )}
                    >
                      {purpose === option && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1 text-body text-nv-text">{option}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Kolom garis bawah serif lewat `Input` yang sudah ada — nol gaya
                baru. `inputMode="numeric"` dengan `type="text"`: papan ketik
                angka di HP, tetapi titik dan spasi tetap boleh diketik dan
                dibuang `parseAmountInput` — `type="number"` menolaknya
                mentah-mentah. */}
            <div className="pt-6">
              <Input
                label={t('withdraw.amount')}
                type="text"
                inputMode="numeric"
                value={raw}
                placeholder="0"
                onChange={(e) => setRaw(e.target.value)}
                hint={t('withdraw.amountHint')}
                className="text-page tabular-nums"
                counter={
                  <button
                    type="button"
                    disabled={available <= 0}
                    onClick={() => setRaw(String(available))}
                    className="nv-tap text-caption font-semibold text-nv-muted disabled:opacity-50 hover:text-nv-text"
                  >
                    {t('withdraw.all')}
                  </button>
                }
              />
            </div>

            <dl className="mt-6 border-nv-line border-y text-body tabular-nums">
              <div className="flex justify-between border-nv-line border-b py-2.5">
                <dt className="text-nv-muted">{t('withdraw.requested')}</dt>
                <dd>{formatRupiah(amount)}</dd>
              </div>
              <div className="flex justify-between border-nv-line border-b py-2.5">
                <dt className="text-nv-muted">{t('withdraw.fee')}</dt>
                <dd>{formatRupiah(fee)}</dd>
              </div>
              <div className="flex justify-between py-2.5 font-bold">
                <dt>{t('withdraw.net')}</dt>
                <dd className="text-nv-gold">{formatRupiah(net)}</dd>
              </div>
            </dl>

            {/* Satu pesan, kesalahan pertama saja · FR-EARN-11. Lima keluhan
                sekaligus membuat penulis memperbaiki lima hal padahal satu pun
                belum tentu benar. Kolom kosong tidak dianggap kesalahan. */}
            {refusal && amount > 0 && (
              <p role="alert" className="mt-4 border-nv-danger border-l-2 pl-3 text-body">
                <span className="font-semibold text-nv-danger">{refusal.message}</span>
                {refusal.link && (
                  <Link
                    to={refusal.link}
                    className="nv-tap block pt-1 font-semibold text-nv-text underline underline-offset-4"
                  >
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
              className="nv-tap mt-3 inline-block font-semibold text-body text-nv-muted underline underline-offset-4"
            >
              {t('withdraw.history')}
            </Link>

            {/* Dok bawah, selalu terlihat · FR-EARN-09.
                `bottom-0` **benar di sini**: layar ini hidup di `TopBarLayout`,
                yang tidak punya bilah navigasi bawah. Di dalam `AppShell` ia
                harus `bottom-[var(--nv-bottom-nav)]`, dan menaruhnya di nol
                adalah cara tercepat menutupi tombol uang di HP
                (`CLAUDE.md` §8). Komentar lama menyebut yang sebaliknya dan
                membantah kodenya sendiri; diperbaiki di R9a. */}
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
