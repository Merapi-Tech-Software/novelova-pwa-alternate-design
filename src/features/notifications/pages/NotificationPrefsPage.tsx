import { Info, Lock } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { NotifChannel, NotificationPrefs, NotifPrefGroup } from '@/api/contracts'
import { AsyncState } from '@/components/ui/AsyncState'
import { Sheet } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { kindsInGroup, NOTIF_GROUP_LABEL, NOTIF_GROUP_LIST, NOTIF_KINDS } from '@/lib/notif'
import { useNotifPrefs, useSaveNotifPrefs } from '../hooks/useNotifications'
import NotificationsPage from './NotificationsPage'

const CHANNELS: Array<[key: keyof NotifChannel, label: string]> = [
  ['inApp', t('notif.channelInApp')],
  ['push', t('notif.channelPush')],
  ['email', t('notif.channelEmail')],
]

/**
 * Preferensi notifikasi `/notifikasi/pengaturan` · FR-NOTIF-04.
 *
 * **Rute modal**: lembar di atas `/notifikasi`, tetapi punya URL sendiri supaya
 * bisa ditautkan dari profil (kelompok "Akun"). Karena itu halaman di bawahnya
 * benar-benar dirender — membuka tautan ini langsung dari profil tidak boleh
 * menghasilkan lembar yang melayang di atas layar kosong, dan menutupnya harus
 * mendarat di pusat notifikasi, bukan di halaman putih.
 *
 * Tiga kanal × empat kelompok, dan kelompoknya **bukan** kelima saringan:
 * saringan menjawab "apa yang ingin saya lihat", kelompok menjawab "apa yang
 * boleh mengganggu saya" (`lib/notif.ts`).
 */
export default function NotificationPrefsPage() {
  const navigate = useNavigate()
  const prefs = useNotifPrefs()
  const save = useSaveNotifPrefs()
  const toast = useToast()

  function setChannel(
    current: NotificationPrefs,
    group: NotifPrefGroup,
    channel: keyof NotifChannel,
    next: boolean,
  ) {
    // Kanal keamanan tidak pernah dikirim mati. Layar mengunci sakelarnya, dan
    // server memaksanya menyala lagi — dua kali, karena sakelar yang hanya
    // dikunci di layar tetap bisa dimatikan lewat permintaan langsung.
    if (group === 'sistem' && channel !== 'email') return

    // **Dua langkah, dan urutannya bukan gaya penulisan.** Menaruh `sistem:`
    // sebagai kunci literal di objek yang sama dengan `[group]:` membuat yang
    // literal menang saat `group === 'sistem'` — dan perubahan Email dibuang
    // diam-diam sebelum sempat dikirim. Ditemukan e2e, bukan typecheck: kedua
    // bentuknya sah-sah saja bagi TypeScript.
    const merged: NotificationPrefs = {
      ...current,
      [group]: { ...current[group], [channel]: next },
    } as NotificationPrefs

    save.mutate({ ...merged, sistem: { ...merged.sistem, inApp: true, push: true } })
  }

  return (
    <>
      <NotificationsPage />

      <Sheet open onClose={() => navigate('/notifikasi')} title={t('notif.settings')}>
        <AsyncState
          loading={prefs.isPending}
          error={prefs.error}
          data={prefs.data}
          onRetry={() => void prefs.refetch()}
          empty={{ title: t('notif.settings'), description: t('notif.prefsIntro') }}
        >
          {(data) => (
            <div className="space-y-5">
              <p className="text-body text-nv-muted">{t('notif.prefsIntro')}</p>

              {NOTIF_GROUP_LIST.map((group) => {
                const locked = group === 'sistem'
                return (
                  /*
                   * `<fieldset>` + `<legend>`, bukan `<section>` + judul.
                   *
                   * Tanpa kelompok bernama, tiap sakelar harus membawa nama
                   * kelompoknya sendiri ("Dompet & Hadiah · Push") supaya tidak
                   * ambigu bagi pembaca layar — dan dua belas baris yang
                   * mengulang judul tepat di atasnya membuat panel ini terbaca
                   * dua kali lebih panjang daripada isinya. `<legend>`
                   * menyelesaikan keduanya: konteksnya diumumkan sekali saat
                   * masuk, dan sakelarnya cukup bernama "Push".
                   *
                   * `min-inline-size: 0` untuk `fieldset` sudah dipasang sekali
                   * di `base.css` — tanpa itu ia mengalahkan wadah yang
                   * menyusut dan mendorong lembar ini ke samping di 320px.
                   */
                  <fieldset key={group} className="border-nv-line border-t pt-4">
                    <legend className="flex items-center gap-1.5 font-display text-card font-semibold">
                      {NOTIF_GROUP_LABEL[group]}
                      {locked && <Lock size={13} className="text-nv-muted" aria-hidden />}
                    </legend>

                    {/* Apa yang sebenarnya ikut mati — dibaca dari katalog, bukan
                        ditulis ulang, supaya daftar ini tidak bisa menyimpang
                        dari yang benar-benar disaring servernya. */}
                    <p className="pt-0.5 text-caption text-nv-muted">
                      {kindsInGroup(group)
                        .map((kind) => NOTIF_KINDS[kind].label)
                        .join(' · ')}
                    </p>

                    <div className="space-y-3 pt-3">
                      {CHANNELS.map(([channel, label]) => (
                        <Switch
                          key={channel}
                          checked={data[group][channel]}
                          lockedOn={locked && channel !== 'email'}
                          onChange={(next) => {
                            setChannel(data, group, channel, next)
                            toast.show(t('notif.saved'), { tone: 'success' })
                          }}
                          label={label}
                        />
                      ))}
                    </div>

                    {locked && (
                      <p className="mt-3 flex gap-2 rounded-nv-md bg-nv-paper-2 p-3 text-caption text-nv-text-2">
                        <Info size={14} className="mt-0.5 shrink-0 text-nv-muted" aria-hidden />
                        <span>
                          <b className="font-semibold">{t('notif.lockedTitle')}</b>{' '}
                          {t('notif.lockedBody')}
                        </span>
                      </p>
                    )}
                  </fieldset>
                )
              })}

              <p className="border-nv-line border-t pt-4 text-caption text-nv-muted">
                {t('notif.perStoryNote')}
              </p>
              <p className="text-caption text-nv-muted">
                {t('notif.quietHours')(data.quietHours.from, data.quietHours.to)}
              </p>
            </div>
          )}
        </AsyncState>
      </Sheet>
    </>
  )
}
