import { ChevronRight, Copy, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { Voucher } from '@/api/contracts'
import { CoinChip } from '@/components/patterns/CoinChip'
import { Cover } from '@/components/patterns/Cover'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Modal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useToast } from '@/components/ui/Toast'
import { useVouchers } from '@/hooks/useVouchers'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'
import { formatRelative } from '@/lib/format'
import { CheckInWeek, MissionRow, VoucherCard } from '../components/RewardBlocks'
import {
  useApplyVoucher,
  useClaimCheckIn,
  useClaimMission,
  useReferral,
  useRewardHistory,
  useRewards,
  useVoucherTargets,
} from '../hooks/useRewards'

/**
 * Pusat hadiah `/hadiah` · FR-RWD-01..07.
 *
 * **Tidak ada satu angka pun yang dihitung di sini.** Streak, kalender, progres
 * misi, dan ringkasan tiga angka semuanya datang dari server, karena semuanya
 * juga menentukan apa yang server izinkan — dan layar yang menghitung sendiri
 * akan menghidupkan tombol yang servernya tolak.
 *
 * Judul halaman tidak ditulis di sini: `TopBarLayout` sudah merender `<h1>` dan
 * tombol kembali.
 */
export default function RewardsPage() {
  const rewards = useRewards()
  const referral = useReferral()
  const history = useRewardHistory()
  const claimCheckIn = useClaimCheckIn()
  const claimMission = useClaimMission()
  const wallet = useWallet()
  const toast = useToast()

  const [pakai, setPakai] = useState<Voucher | null>(null)

  return (
    <div className="pb-8">
      <AsyncState
        loading={rewards.isPending}
        error={rewards.error}
        data={rewards.data}
        onRetry={() => void rewards.refetch()}
        empty={{ title: t('rewards.title'), description: t('rewards.checkInNote') }}
      >
        {(data) => (
          <div className="space-y-6 px-4">
            {/*
              Tiga angka · FR-RWD-01. Yang pertama **bukan saldo kedua** — ia
              perolehan periode berjalan, dan keterangannya menyebut itu terang.
              Dua angka yang sama-sama mengaku saldo adalah cara tercepat membuat
              pengguna berhenti mempercayai keduanya.
            */}
            <section className="nv-card grid grid-cols-3 divide-x divide-nv-line">
              <div className="px-3 py-4 text-center">
                <p className="font-display font-semibold text-nv-gold text-section tabular-nums">
                  {formatCompactCoin(data.coinsThisPeriod)}
                </p>
                <p className="pt-1 text-caption text-nv-muted">{t('rewards.summaryCoins')}</p>
              </div>
              <div className="px-3 py-4 text-center">
                <p className="font-display font-semibold text-nv-text text-section tabular-nums">
                  {data.voucherCount}
                </p>
                <p className="pt-1 text-caption text-nv-muted">{t('rewards.summaryVouchers')}</p>
                {data.expiringSoon > 0 && (
                  <p className="pt-0.5 text-caption text-nv-gold">
                    {t('rewards.summaryExpiring')(data.expiringSoon)}
                  </p>
                )}
              </div>
              <div className="px-3 py-4 text-center">
                <p className="font-display font-semibold text-nv-text text-section tabular-nums">
                  {t('rewards.summaryStreakOf')(data.checkInStreak)}
                </p>
                <p className="pt-1 text-caption text-nv-muted">{t('rewards.summaryStreak')}</p>
              </div>
            </section>
            <p className="-mt-4 text-caption text-nv-muted">{t('rewards.summaryCoinsNote')}</p>

            {/*
              **Saldo dompet — titik keenam FR-WALLET-17.**

              Ia sengaja berdiri terpisah dari strip di atas, bukan jadi kolom
              keempat: angka pertama strip itu perolehan *bulan ini*, dan
              menaruh saldo di sebelahnya sebagai kolom sejajar justru membuat
              keduanya terbaca sebagai dua saldo — persis yang kalimat di atas
              berusaha cegah. Di sini ia baris tersendiri yang menyebut dirinya
              saldo, dan menautkan ke tempat menambahnya.
            */}
            <Link
              to="/koin"
              className="nv-tap flex items-center justify-between gap-3 rounded-nv-md border border-nv-line-soft px-3 py-2.5"
            >
              <span className="text-body text-nv-muted">{t('rewards.walletBalance')}</span>
              <span className="flex shrink-0 items-center gap-2">
                <CoinChip amount={wallet.data?.balance ?? 0} size="sm" />
                <ChevronRight size={15} aria-hidden className="text-nv-muted" />
              </span>
            </Link>

            {/* ── check-in · FR-RWD-02 ───────────────────────────────────── */}
            <section>
              <SectionHeader label={t('rewards.checkInTitle')} className="mb-3" />
              <CheckInWeek days={data.checkIn} />
              <p className="pt-3 text-caption text-nv-muted">{t('rewards.checkInNote')}</p>
              <p className="pt-1 text-caption text-nv-muted">{t('rewards.checkInMissNote')}</p>

              <div className="pt-3">
                {data.claimedToday ? (
                  <p className="text-body text-nv-muted">{t('rewards.claimedToday')}</p>
                ) : (
                  <Button
                    className="w-full"
                    disabled={claimCheckIn.isPending}
                    onClick={() => {
                      claimCheckIn.mutate(undefined, {
                        onSuccess: (next) => {
                          const hari = next.checkIn.findLast((d) => d.claimed)
                          toast.show(
                            hari?.voucherTitle
                              ? t('rewards.claimVoucherSuccess')(hari.voucherTitle)
                              : t('rewards.claimSuccess')(hari?.coins ?? 0),
                            { tone: 'success' },
                          )
                        },
                        onError: (error) => {
                          toast.show(
                            error instanceof Error ? error.message : t('failure.genericTitle'),
                            { tone: 'danger' },
                          )
                        },
                      })
                    }}
                  >
                    {t('rewards.claim')}
                  </Button>
                )}
              </div>
            </section>

            {/* ── misi · FR-RWD-03 ───────────────────────────────────────── */}
            <section>
              <SectionHeader label={t('rewards.missionsTitle')} className="mb-1" />
              <p className="pb-2 text-caption text-nv-muted">{t('rewards.missionsNote')}</p>
              <ul>
                {data.missions.map((mission) => (
                  <MissionRow
                    key={mission.id}
                    mission={mission}
                    claiming={claimMission.isPending}
                    onClaim={(id) =>
                      claimMission.mutate(id, {
                        onSuccess: () => {
                          const m = data.missions.find((x) => x.id === id)
                          toast.show(t('rewards.missionSuccess')(m?.rewardCoins ?? 0), {
                            tone: 'success',
                          })
                        },
                        onError: (error) => {
                          toast.show(
                            error instanceof Error ? error.message : t('failure.genericTitle'),
                            { tone: 'danger' },
                          )
                        },
                      })
                    }
                  />
                ))}
              </ul>
            </section>

            {/* ── voucher · FR-RWD-06 ────────────────────────────────────── */}
            <section>
              <SectionHeader label={t('rewards.vouchersTitle')} className="mb-3" />
              <Vouchers onUse={setPakai} />
            </section>

            {/* ── referral · FR-RWD-04 ───────────────────────────────────── */}
            <section>
              <SectionHeader label={t('rewards.referralTitle')} className="mb-3" />
              {referral.data && (
                <div className="nv-card p-4">
                  <p className="text-body text-nv-text">
                    {t('rewards.referralReward')(referral.data.rewardCoins)}
                  </p>
                  <p className="pt-1 text-caption text-nv-muted">{referral.data.condition}</p>

                  <label className="block pt-3 text-caption text-nv-muted" htmlFor="ref-code">
                    {t('rewards.referralCodeLabel')}
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="ref-code"
                      readOnly
                      value={referral.data.code}
                      className="min-w-0 flex-1 rounded-nv-md border border-nv-line-soft bg-nv-paper-2 px-3 py-2 font-mono text-body text-nv-text"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      iconLeft={<Copy size={14} aria-hidden />}
                      onClick={() => {
                        // Clipboard bisa ditolak peramban (izin, konteks tidak
                        // aman). Kolomnya sengaja tetap bisa diseleksi, jadi
                        // jalan keluarnya nyata — bukan sekadar pesan gagal.
                        navigator.clipboard
                          ?.writeText(referral.data.code)
                          .then(() => toast.show(t('rewards.copied'), { tone: 'success' }))
                          .catch(() => toast.show(t('rewards.copyFailed'), { tone: 'danger' }))
                      }}
                    >
                      {t('rewards.copy')}
                    </Button>
                  </div>

                  <p className="pt-3 text-caption text-nv-muted">
                    {[
                      t('rewards.referralEarned')(referral.data.earnedCoins),
                      referral.data.pendingCount > 0
                        ? t('rewards.referralPending')(referral.data.pendingCount)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  {referral.data.invites.length === 0 ? (
                    <p className="pt-3 text-caption text-nv-muted">{t('rewards.referralEmpty')}</p>
                  ) : (
                    <ul className="pt-2">
                      {referral.data.invites.map((invite) => (
                        <li
                          key={invite.inviteeId}
                          className="flex items-center justify-between gap-3 border-nv-line border-t py-2 text-caption"
                        >
                          <span className="min-w-0 truncate text-nv-text">{invite.name}</span>
                          <span
                            className={invite.readFirstChapter ? 'text-nv-gold' : 'text-nv-muted'}
                          >
                            {invite.readFirstChapter
                              ? t('rewards.referralDone')
                              : t('rewards.referralWaiting')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            {/* ── riwayat klaim · FR-RWD-05 ──────────────────────────────── */}
            <section>
              <SectionHeader
                label={t('rewards.historyTitle')}
                className="mb-1"
                action={
                  <Link
                    to="/koin/transaksi"
                    className="nv-tap text-caption font-semibold text-nv-gold"
                  >
                    {t('rewards.openWallet')}
                  </Link>
                }
              />
              <p className="pb-2 text-caption text-nv-muted">{t('rewards.historyNote')}</p>
              {history.data && history.data.length > 0 ? (
                <ul>
                  {history.data.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-3 border-nv-line border-b py-2.5 last:border-0"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-body text-nv-text">{row.title}</span>
                        <span className="block text-caption text-nv-muted">
                          {formatRelative(new Date(row.at))}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-body text-nv-text tabular-nums">
                        {row.coins > 0
                          ? `+${formatCompactCoin(row.coins)}`
                          : t('rewards.freeUnlock')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-caption text-nv-muted">
                  <Wallet size={14} aria-hidden />
                  {t('rewards.historyEmpty')}
                </p>
              )}
            </section>
          </div>
        )}
      </AsyncState>

      {pakai && <VoucherUseSheet voucher={pakai} onClose={() => setPakai(null)} />}
    </div>
  )
}

/** Daftar voucher aktif · FR-RWD-06. */
function Vouchers({ onUse }: { onUse: (v: Voucher) => void }) {
  const vouchers = useVouchers()

  return (
    <AsyncState
      loading={vouchers.isPending}
      error={vouchers.error}
      data={vouchers.data}
      isEmpty={(rows) => rows.length === 0}
      onRetry={() => void vouchers.refetch()}
      empty={{
        variant: 'first-run',
        title: t('rewards.vouchersEmpty'),
        description: t('rewards.vouchersEmptyBody'),
      }}
    >
      {(rows) => (
        <ul className="space-y-2">
          {rows.map((v) => (
            <VoucherCard key={v.id} voucher={v} onUse={onUse} />
          ))}
        </ul>
      )}
    </AsyncState>
  )
}

/**
 * Pemilih cerita · FR-RWD-06 — pengganti tombol `"Gunakan"` yang dulu `#`.
 *
 * Yang ditawarkan **hanya cerita tempat voucher ini benar-benar berlaku**,
 * beserta berapa bab yang akan terbuka. Daftar yang memuat cerita yang tidak
 * berlaku memindahkan penolakannya ke sesudah ketukan, dan penolakan yang
 * datang sesudah memilih terasa seperti cacat.
 */
function VoucherUseSheet({ voucher, onClose }: { voucher: Voucher; onClose: () => void }) {
  const targets = useVoucherTargets(voucher.id)
  const apply = useApplyVoucher()
  const toast = useToast()

  return (
    <Sheet open onClose={onClose} title={t('rewards.pickStory')}>
      <p className="pb-3 text-caption text-nv-muted">{t('rewards.pickStoryNote')}</p>

      <AsyncState
        loading={targets.isPending}
        error={targets.error}
        data={targets.data}
        isEmpty={(rows) => rows.length === 0}
        onRetry={() => void targets.refetch()}
        empty={{
          variant: 'no-results',
          title: t('rewards.pickStoryEmpty'),
          description: t('rewards.pickStoryEmptyBody'),
        }}
      >
        {(rows) => (
          <ul className="divide-y divide-nv-line">
            {rows.map((target) => (
              <li key={target.storyId}>
                <button
                  type="button"
                  disabled={apply.isPending}
                  className="nv-tap flex w-full items-center gap-3 py-3 text-left"
                  onClick={() =>
                    apply.mutate(
                      { voucherId: voucher.id, storyId: target.storyId },
                      {
                        onSuccess: (result) => {
                          toast.show(result.message, { tone: 'success' })
                          onClose()
                        },
                        onError: (error) => {
                          toast.show(
                            error instanceof Error ? error.message : t('failure.genericTitle'),
                            { tone: 'danger' },
                          )
                        },
                      },
                    )
                  }
                >
                  <Cover src={target.coverUrl} title={target.title} className="w-11 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body text-nv-text">{target.title}</span>
                    <span className="block text-caption text-nv-gold">
                      {t('rewards.willUnlock')(target.unlockCount)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </AsyncState>
    </Sheet>
  )
}
