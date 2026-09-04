import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { PrintOrder } from '@/api/contracts'
import { PRINT_STAGES } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { StageTrack } from '@/components/patterns/StageTrack'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { formatDate, formatRupiah } from '@/lib/format'
import {
  useApprovePrintCost,
  useCancelPrintOrder,
  usePrintOrders,
  useRegeneratePrintFile,
} from '../hooks/useAnalytics'

const TABS = [
  { value: 'all', label: t('print.tabAll') },
  { value: 'soft', label: t('print.tabSoft') },
  { value: 'hard', label: t('print.tabHard') },
  { value: 'running', label: t('print.tabRunning') },
] as const

const EMPTY_BODY = {
  all: t('print.emptyAll'),
  soft: t('print.emptySoft'),
  hard: t('print.emptyHard'),
  running: t('print.emptyRunning'),
} as const

/**
 * Invoice sungguhan · FR-STUDIO-32, memperbaiki PRD 07 §7 #11 (di prototipe
 * seluruh unduhan hanya pesan).
 *
 * ponytail: teks polos, bukan PDF. Seluruh datanya sudah ada di klien, jadi
 * satu `Blob` cukup dan tidak menambah dependensi apa pun. Batas atasnya jelas —
 * ia tidak berkop dan tidak bermeterai; invoice PDF resmi datang dari server
 * bersama backend aslinya.
 */
function downloadInvoice(order: PrintOrder): void {
  const cost = order.costFinal ?? order.costQuoted ?? 0
  const lines = [
    `INVOICE ${order.id}`,
    `Tanggal   : ${formatDate(new Date(order.createdAt))}`,
    `Cerita    : ${order.storyTitle}`,
    `Jenis     : ${order.kind === 'soft' ? t('print.kindSoft') : t('print.kindHard')}`,
    `Spesifikasi: ${order.spec}`,
    `Status    : ${STATUS_LABEL[order.status]}`,
    `Biaya     : ${formatRupiah(cost)}`,
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `novelova-invoice-${order.id.replace('#', '')}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

const STATUS_LABEL: Record<PrintOrder['status'], string> = {
  submitted: 'Diajukan',
  confirmed: 'Dikonfirmasi',
  paid: 'Dibayar',
  printing: 'Sedang dicetak',
  shipped: 'Dikirim',
  received: 'Selesai',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
  build_failed: 'Gagal dibuat',
  expired: 'Kedaluwarsa',
  cost_changed: 'Menunggu persetujuan biaya',
}

/**
 * Riwayat & lini masa pesanan cetak · FR-STUDIO-32.
 *
 * Prototipe halaman ini **tidak punya JavaScript sama sekali** — seluruh isinya
 * statis, dan empat keadaan yang menyentuh uang penulis hanya disebut di dalam
 * toast. Di sini keempatnya jadi keadaan sungguhan dengan tingkat penyampaian
 * masing-masing (arch §1.4), dan pembatalan tunduk pada tahap produksi.
 */
export default function PrintHistoryPage() {
  const [search, setSearch] = useSearchParams()
  const toast = useToast()

  const tab = (TABS.find((x) => x.value === search.get('tab')) ?? TABS[0]).value
  const orders = usePrintOrders({ page: 1, pageSize: 50, tab })
  // Penghentian karena biaya berubah dibaca dari daftar **tanpa saringan**:
  // kalau tidak, memilih tab "PDF" menyembunyikan pesanan hardcopy yang
  // produksinya sedang berhenti — dan saringan tampilan tidak boleh mengubah
  // apa yang sedang terjadi pada uang penulis.
  const unfiltered = usePrintOrders({ page: 1, pageSize: 50, tab: 'all' })
  const cancel = useCancelPrintOrder()
  const approve = useApprovePrintCost()
  const regenerate = useRegeneratePrintFile()
  const [costDeferred, setCostDeferred] = useState(false)

  async function run(action: Promise<unknown>, done: string) {
    try {
      await action
      toast.show(done)
    } catch (error) {
      // `PRINT-409` sampai ke sini: pesan servernya **menyebut biayanya dan
      // jalan keluarnya**, jadi ia ditampilkan apa adanya.
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' })
    }
  }

  const items = orders.data?.items ?? []
  const costChanged = (unfiltered.data?.items ?? []).find((o) => o.status === 'cost_changed')

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      <p className="text-body text-nv-muted">{t('print.subtitle')(orders.data?.total ?? 0)}</p>

      <Tabs
        items={TABS}
        value={tab}
        onChange={(next) => {
          const params = new URLSearchParams(search)
          params.set('tab', next)
          setSearch(params, { replace: true })
        }}
        label={t('print.tabsLabel')}
        className="pt-3"
      />

      <AsyncState
        loading={orders.isPending}
        error={orders.error}
        data={items}
        isEmpty={(rows) => rows.length === 0}
        onRetry={() => void orders.refetch()}
        empty={{
          title: t('print.emptyTitle'),
          description: EMPTY_BODY[tab],
          secondary: (
            <Link to="/karya" className="text-body text-nv-accent-strong underline">
              {t('print.toStories')}
            </Link>
          ),
        }}
      >
        {(rows) => (
          <>
            {/* `PRINT-402` · **layar penuh**: produksi berhenti sampai penulis
                memutuskan. Jalan keluarnya tetap ada — menundanya tidak
                menyetujui apa pun, dan pesanannya tetap berhenti. */}
            {costChanged && !costDeferred ? (
              // Sengaja `return` — bukan sisipan di atas daftar. Tingkat "layar
              // penuh" berarti **menghentikan segalanya**; daftar yang tetap
              // terlihat di bawahnya membuatnya sekadar spanduk, dan tombol
              // setujui muncul dua kali untuk pesanan yang sama.
              <FailureNotice
                level="fullscreen"
                title="Biaya cetak berubah"
                body={`Admin menyesuaikan biaya ${costChanged.storyTitle} dari ${formatRupiah(costChanged.costQuoted ?? 0)} menjadi ${formatRupiah(costChanged.costFinal ?? 0)}.`}
                safety="Belum ada yang ditagihkan. Produksi berhenti sampai kamu menyetujui biaya baru."
                onRetry={() => void run(approve.mutateAsync(costChanged.id), t('print.approved'))}
                retryLabel={t('print.approve')}
                code={`PRINT-402 · ${costChanged.id}`}
                actions={
                  <>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void run(cancel.mutateAsync(costChanged.id), t('print.cancelled'))
                      }
                    >
                      {t('print.reject')}
                    </Button>
                    <Button variant="ghost" onClick={() => setCostDeferred(true)}>
                      Lihat riwayat dulu
                    </Button>
                  </>
                }
              />
            ) : (
              <>
                <ol className="pt-2">
                  {rows.map((order) => (
                    <li key={order.id}>
                      <PrintRow
                        order={order}
                        onCancel={() =>
                          void run(cancel.mutateAsync(order.id), t('print.cancelled'))
                        }
                        onApprove={() =>
                          void run(approve.mutateAsync(order.id), t('print.approved'))
                        }
                        onRegenerate={(parts) =>
                          void run(
                            regenerate.mutateAsync({ orderId: order.id, parts }),
                            t('print.regenerated'),
                          )
                        }
                      />
                    </li>
                  ))}
                </ol>

                <p className="pt-4 text-caption text-nv-muted">{t('print.note')}</p>
              </>
            )}
          </>
        )}
      </AsyncState>
    </div>
  )
}

interface PrintRowProps {
  order: PrintOrder
  onCancel: () => void
  onApprove: () => void
  onRegenerate: (parts: number) => void
}

/**
 * Satu pesanan. Isinya berbeda menurut keadaan — tiga keadaan PRD (sedang
 * dicetak · selesai · dibatalkan) plus empat keadaan gagal kanvas, masing-masing
 * dengan **aksi yang berbeda**, bukan tombol seragam yang kadang tidak berarti.
 */
function PrintRow({ order, onCancel, onApprove, onRegenerate }: PrintRowProps) {
  const isHard = order.kind === 'hard'
  const cost = order.costFinal ?? order.costQuoted

  return (
    <Card className="mt-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-section leading-tight">{order.storyTitle}</h2>
        <span className="shrink-0 rounded-nv-pill border border-nv-line px-2 py-0.5 text-caption text-nv-muted uppercase">
          {isHard ? t('print.kindHard') : t('print.kindSoft')}
        </span>
      </div>
      <p className="pt-1 text-caption text-nv-muted">{order.spec}</p>

      <p className="flex flex-wrap items-center gap-2 pt-2 text-caption text-nv-muted tabular-nums">
        <span className="rounded-nv-pill border border-nv-line px-2 py-0.5">
          {STATUS_LABEL[order.status]}
        </span>
        <span>{order.id}</span>
        <span>{formatDate(new Date(order.createdAt))}</span>
      </p>

      {/* Lini masa **enam tahap PRD**, bukan empat langkah kanvas (arch §1.5). */}
      {isHard && order.stageIndex !== null && (
        <StageTrack stages={PRINT_STAGES} current={order.stageIndex} className="pt-3" />
      )}

      {order.status === 'build_failed' && (
        <FailureNotice
          level="inset"
          title="PDF gagal dibuat"
          body={order.note ?? 'Naskah melewati batas waktu pemrosesan.'}
          safety="Tidak ada biaya untuk PDF. Naskah aslinya tidak tersentuh."
          onRetry={() => onRegenerate(3)}
          retryLabel={t('print.split')}
          code={`PRINT-504 · ${order.id}`}
          className="mt-3"
        />
      )}

      {order.status === 'expired' && (
        <FailureNotice
          level="inline"
          title="Berkas lewat masa simpan 30 hari"
          safety="Membuat ulang gratis dan tidak memotong kuota apa pun."
          onRetry={() => onRegenerate(1)}
          retryLabel={t('print.regenerate')}
          code={`PRINT-410 · ${order.id}`}
          className="mt-3"
        />
      )}

      {order.rejectReason && (
        <p className="mt-3 rounded-nv-md border border-nv-danger p-3 text-body text-nv-danger">
          {order.rejectReason}
        </p>
      )}

      {order.note && order.status !== 'build_failed' && (
        <p className="pt-2 text-body text-nv-muted">{order.note}</p>
      )}

      {order.kind === 'soft' && order.fileName && order.status !== 'expired' && (
        <p className="pt-2 text-body tabular-nums">
          {order.fileName}
          {order.fileSize && order.fileExpiresAt
            ? ` · ${t('print.fileInfo')(order.fileSize, formatDate(new Date(order.fileExpiresAt)))}`
            : ''}
        </p>
      )}

      {isHard && cost !== null && (
        <p className="pt-2 text-body tabular-nums">{formatRupiah(cost)}</p>
      )}
      {order.trackingNumber && (
        <p className="pt-1 text-body tabular-nums">
          {t('print.track')(order.trackingNumber)}
          {order.etaNote ? ` · ${order.etaNote}` : ''}
        </p>
      )}
      {order.etaNote && !order.trackingNumber && (
        <p className="pt-1 text-body text-nv-muted">
          {order.etaNote} · {t('print.etaNote')}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-3">
        {order.status === 'cost_changed' && (
          <>
            <Button size="sm" onClick={onApprove}>
              {t('print.approve')}
            </Button>
            <Button size="sm" variant="secondary" onClick={onCancel}>
              {t('print.reject')}
            </Button>
          </>
        )}

        {order.kind === 'soft' && order.status === 'received' && (
          <Button size="sm" variant="secondary" onClick={() => onRegenerate(1)}>
            {t('print.download')}
          </Button>
        )}

        {/* Tombol batal **tetap ada** setelah produksi. Yang menolak adalah
            server, dan penolakannya menyebut biayanya — tombol yang dimatikan
            diam-diam tidak pernah menjelaskan kenapa (PRINT-409). */}
        {isHard && !['cancelled', 'rejected', 'received'].includes(order.status) && (
          <Button size="sm" variant="secondary" onClick={onCancel}>
            {t('print.cancel')}
          </Button>
        )}

        {/* Invoice tersedia begitu ada biaya yang tercatat — juga untuk pesanan
            yang sudah selesai, karena itulah saat penulis paling sering
            memerlukannya. */}
        {isHard && cost !== null && cost > 0 && (
          <Button size="sm" variant="secondary" onClick={() => downloadInvoice(order)}>
            {t('print.invoice')}
          </Button>
        )}

        <Link
          to="/bantuan"
          className="inline-flex h-9 items-center rounded-nv-pill border border-nv-line px-3 text-body text-nv-muted"
        >
          {t('print.admin')}
        </Link>

        {/* Pesanan yang ditolak harus punya jalan keluar, bukan berakhir di
            kalimat penolakan (PRD 07 FR-STUDIO-32). */}
        {['rejected', 'cancelled'].includes(order.status) && (
          <Link
            to="/karya"
            className="inline-flex h-9 items-center rounded-nv-pill border border-nv-line px-3 text-body text-nv-muted"
          >
            {t('print.toStories')}
          </Link>
        )}
      </div>
    </Card>
  )
}
