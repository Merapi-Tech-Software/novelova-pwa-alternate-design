import { Settings2 } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { Notification, NotifType } from '@/api/contracts'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { formatDayGroup } from '@/lib/format'
import { pushPernahDitolak } from '@/stores/pwa'
import { NotificationRow, NotificationSkeleton } from '../components/NotificationRow'
import { useMarkRead, useNotifications } from '../hooks/useNotifications'

/** Lima saringan · FR-NOTIF-01. "Semua" bawaan, dan ia bukan sebuah `type`. */
const FILTERS = [
  { id: 'all', label: t('notif.filterAll'), type: undefined },
  { id: 'cerita', label: t('notif.filterStory'), type: 'cerita' as const },
  { id: 'dompet', label: t('notif.filterWallet'), type: 'dompet' as const },
  { id: 'hadiah', label: t('notif.filterRewards'), type: 'hadiah' as const },
  { id: 'sistem', label: t('notif.filterSystem'), type: 'sistem' as const },
] as const

const PAGE_SIZE = 20

/**
 * Mengelompokkan per hari kalender lokal · FR-NOTIF-01.
 *
 * Kepalanya `formatDayGroup` — fungsi yang sama dengan feed aktivitas profil,
 * supaya "Kemarin" berarti hal yang persis sama di kedua layar. Batas harinya
 * kalender lokal, bukan selisih 24 jam: sesuatu pukul 23.50 tidak boleh masih
 * disebut "Hari ini" pada pukul 00.10.
 */
function groupByDay(items: Notification[]): Array<[string, Notification[]]> {
  const out: Array<[string, Notification[]]> = []
  for (const notif of items) {
    const head = formatDayGroup(new Date(notif.createdAt))
    const last = out.at(-1)
    if (last && last[0] === head) last[1].push(notif)
    else out.push([head, [notif]])
  }
  return out
}

/**
 * Pusat notifikasi `/notifikasi` · FR-NOTIF-01 · FR-NOTIF-03.
 *
 * Saringan dan halaman hidup **di URL**, dan keduanya memicu permintaan baru ke
 * server — bukan menyembunyikan baris yang sudah diambil. Begitu ada halaman
 * kedua, saringan sisi klien berhenti benar.
 *
 * Judul halaman **tidak** ditulis di sini: `TopBarLayout` sudah merender `<h1>`
 * dan tombol kembali (arch §8). Yang ditulis hanya yang tidak bisa diketahui
 * bilah atas.
 */
export default function NotificationsPage() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const markRead = useMarkRead()

  const active = FILTERS.find((f) => f.id === params.get('f')) ?? FILTERS[0]
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)

  // Satu permintaan yang tumbuh, bukan halaman terpisah: "Muat lebih banyak"
  // menambah baris di bawah, jadi yang sudah dibaca mata tidak boleh hilang.
  const query = useNotifications({
    page: 1,
    pageSize: page * PAGE_SIZE,
    unreadOnly: false,
    ...(active.type ? { type: active.type as NotifType } : {}),
  })

  const items = query.data?.items ?? []
  const groups = useMemo(() => groupByDay(items), [items])
  const unreadHere = items.some((n) => n.readAt === null)

  function pick(id: string) {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('f')
    else next.set('f', id)
    next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <div className="pb-8">
      {/*
        Tab mendapat **lebar penuh**, dan aksinya turun ke baris sendiri.
        Berbagi baris dengan ikon pengaturan menyisakan 200px dari 320 untuk
        lima tab — terukur di peramban, dan pada lebar itu hanya dua setengah
        tab yang terlihat. Kelimanya tetap bisa digulir, tetapi tab yang harus
        digulir untuk ditemukan adalah tab yang tidak akan ditemukan.
      */}
      <Tabs
        items={FILTERS.map((f) => ({ value: f.id, label: f.label }))}
        value={active.id}
        onChange={pick}
        label={t('notif.title')}
        className="px-4"
      />

      {/*
        Izin push yang **pernah ditolak** tidak pernah diminta ulang · FR-NOTIF-05.
        Yang bisa dilakukan aplikasi tinggal menunjukkan di mana pengguna bisa
        menyalakannya sendiri — meminta ulang lewat kode akan ditolak peramban
        tanpa dialog, dan itu terbaca sebagai tombol yang rusak.
      */}
      {pushPernahDitolak() && (
        <p className="mx-4 mt-1 rounded-nv-md bg-nv-paper-2 p-3 text-caption text-nv-text-2">
          <b className="font-semibold">{t('pwa.pushDenied')}</b> {t('pwa.pushDeniedBody')}
        </p>
      )}

      <div className="flex items-center justify-end gap-1 px-4 pt-1 pb-2">
        {/*
          "Tandai semua terbaca" hanya muncul saat ada yang bisa ditandai.
          Tombol yang selalu ada tetapi tidak melakukan apa-apa mengajari
          pengguna bahwa menekannya tidak berarti apa-apa.
        */}
        {unreadHere && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              markRead.mutate('all', {
                onSuccess: () => toast.show(t('notif.markAllDone'), { tone: 'success' }),
              })
            }}
          >
            {t('notif.markAll')}
          </Button>
        )}
        <Link
          to="/notifikasi/pengaturan"
          aria-label={t('notif.settings')}
          title={t('notif.settings')}
          className="nv-tap shrink-0 justify-center text-nv-muted transition hover:text-nv-text"
        >
          <Settings2 size={18} aria-hidden />
        </Link>
      </div>

      <AsyncState
        loading={query.isPending}
        error={query.error}
        data={query.data}
        isEmpty={(page) => page.items.length === 0}
        onRetry={() => void query.refetch()}
        skeleton={<NotificationSkeleton />}
        empty={
          active.type
            ? {
                variant: 'no-results',
                title: t('notif.emptyFilteredTitle'),
                description: t('notif.emptyFilteredBody'),
                action: { label: t('notif.filterAll'), onClick: () => pick('all') },
              }
            : {
                variant: 'first-run',
                title: t('notif.emptyTitle'),
                description: t('notif.emptyBody'),
              }
        }
      >
        {(data) => (
          <>
            {groups.map(([head, rows]) => (
              <section key={head}>
                <h2 className="nv-section-label px-4 pt-4 pb-2">{head}</h2>
                <ul>
                  {rows.map((notif) => (
                    <li key={notif.id}>
                      <NotificationRow
                        notif={notif}
                        onOpen={(id) => {
                          if (notif.readAt === null) markRead.mutate([id])
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {data.hasMore && (
              <div className="px-4 pt-4">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    const next = new URLSearchParams(params)
                    next.set('page', String(page + 1))
                    setParams(next, { replace: true })
                  }}
                >
                  {t('notif.loadMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </AsyncState>
    </div>
  )
}
