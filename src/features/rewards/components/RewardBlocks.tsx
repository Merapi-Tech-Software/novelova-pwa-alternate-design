import { Check, Gift, Lock } from 'lucide-react'
import { Link } from 'react-router'
import type { CheckInDay, Mission, Voucher } from '@/api/contracts'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Chip'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { MISSION_SOURCE } from '@/lib/rewards'

/**
 * Kalender tujuh hari · FR-RWD-02.
 *
 * Tujuh sel dalam satu baris yang **boleh menyusut**, bukan grid tetap: di
 * 320px tujuh sel selebar 44px sudah 308px sebelum menghitung jarak, dan grid
 * yang tidak bisa menyusut akan mendorong halaman ke samping. Yang dijaga tetap
 * adalah rasio selnya, bukan lebarnya.
 */
export function CheckInWeek({ days }: { days: CheckInDay[] }) {
  return (
    <ol className="flex gap-1.5">
      {days.map((d) => (
        <li key={d.day} className="min-w-0 flex-1">
          <div
            className={cx(
              'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-nv-md border text-center',
              d.claimed && 'border-nv-gold-line bg-nv-gold-soft',
              d.claimable && !d.claimed && 'border-nv-accent border-2',
              !d.claimed && !d.claimable && 'border-nv-line bg-nv-paper-2',
            )}
          >
            {d.claimed ? (
              <Check size={14} className="text-nv-gold" aria-hidden />
            ) : d.voucherTitle ? (
              <Gift size={14} className="text-nv-gold-line" aria-hidden />
            ) : (
              <span className="font-semibold text-caption text-nv-text tabular-nums">
                {d.coins}
              </span>
            )}
          </div>
          <p className="pt-1 text-center text-[10px] text-nv-muted leading-none">
            {t('rewards.dayShort')(d.day)}
          </p>
        </li>
      ))}
    </ol>
  )
}

/**
 * Satu misi harian · FR-RWD-03 · FR-RWD-07.
 *
 * Tombolnya **berubah menurut keadaan**, dan ketiganya berbeda maksud: belum
 * selesai membawa ke tempat menyelesaikannya, selesai membuka klaim, sudah
 * diklaim berhenti jadi tombol sama sekali — kontrol mati yang tetap terlihat
 * seperti tombol mengajari pengguna bahwa menekannya tidak berarti apa-apa.
 */
export function MissionRow({
  mission,
  onClaim,
  claiming,
}: {
  mission: Mission
  onClaim: (id: string) => void
  claiming: boolean
}) {
  const done = mission.progress >= mission.target
  const claimed = mission.claimedAt !== null

  return (
    <li className="flex items-center gap-3 border-nv-line border-b py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-body text-nv-text">{mission.title}</p>
        <p className="pt-0.5 text-caption text-nv-muted">{MISSION_SOURCE[mission.kind]}</p>
        <div className="flex items-center gap-2 pt-2">
          <ProgressBar
            value={mission.target === 0 ? 0 : mission.progress / mission.target}
            label={mission.title}
            className="min-w-0 flex-1"
          />
          <span className="shrink-0 text-caption text-nv-muted tabular-nums">
            {t('rewards.missionProgress')(mission.progress, mission.target)}
          </span>
        </div>
      </div>

      <div className="shrink-0">
        {claimed ? (
          <span className="text-caption text-nv-muted">{t('rewards.missionClaimed')}</span>
        ) : done ? (
          <Button size="sm" disabled={claiming} onClick={() => onClaim(mission.id)}>
            {t('rewards.claim')}
          </Button>
        ) : (
          // Tautan yang **berbentuk** tombol sekunder, bukan `<Button>` yang
          // menavigasi lewat `onClick`: ini berpindah halaman, jadi klik-tengah
          // dan "buka di tab baru" harus tetap bekerja. Tinggi 36px = ukuran
          // `sm`, dan `nv-tap` yang membawa kotak sentuhnya ke 44 (`prd_01` §0.9).
          <Link
            to={mission.actionLink}
            className="nv-tap inline-flex h-9 items-center justify-center rounded-nv-pill border border-nv-line-soft px-3.5 text-caption font-semibold text-nv-text"
          >
            {mission.actionLabel}
          </Link>
        )}
      </div>
    </li>
  )
}

/** Label cakupan voucher · FR-RWD-06 — aturannya, bukan hanya judulnya. */
export function scopeLabel(v: Voucher): string {
  if (v.scope === 'chapter') return t('rewards.scopeChapter')
  if (v.scope === 'firstN') return t('rewards.scopeFirstN')(v.firstN ?? 0)
  if (v.scope === 'story') return t('rewards.scopeStory')
  return t('rewards.scopeCross')
}

export function valueLabel(v: Voucher): string {
  return v.value === 'free' ? t('rewards.valueFree') : t('rewards.valuePct')(v.percentOff ?? 0)
}

export function daysLeft(expiresAt: string): number {
  return Math.floor((Date.parse(expiresAt) - Date.now()) / 86_400_000)
}

/**
 * Satu voucher · FR-RWD-06.
 *
 * **Membawa aturannya sendiri**: cakupan, nilai, sisa waktu, dan — kalau masih
 * terkunci — syarat pembukanya. Voucher yang hanya menampilkan judulnya adalah
 * janji yang baru ketahuan batasnya setelah ditekan.
 */
export function VoucherCard({
  voucher,
  onUse,
}: {
  voucher: Voucher
  onUse: (voucher: Voucher) => void
}) {
  const sisa = daysLeft(voucher.expiresAt)

  return (
    <li className="nv-card p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-card font-semibold text-nv-text">{voucher.title}</p>
          <p className="pt-1 text-caption text-nv-muted">
            {[scopeLabel(voucher), valueLabel(voucher), t('rewards.expiresIn')(sisa)].join(' · ')}
          </p>
          {voucher.locked && voucher.unlockCond && (
            <p className="flex items-center gap-1.5 pt-1.5 text-caption text-nv-gold">
              <Lock size={12} aria-hidden />
              {t('rewards.lockedBy')(voucher.unlockCond)}
            </p>
          )}
        </div>

        <div className="shrink-0">
          {voucher.locked ? (
            // Lencana **"Terkunci"**, bukan "Gunakan" yang dimatikan: kata kerja
            // untuk sesuatu yang justru tidak bisa dilakukan membuat pengguna
            // menekannya berkali-kali sebelum menyimpulkan layarnya rusak.
            <Badge tone="neutral">{t('rewards.lockedShort')}</Badge>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => onUse(voucher)}>
              {t('rewards.use')}
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}
