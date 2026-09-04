import { Download, Printer } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Transaction, TxListParams } from '@/api/contracts'
import { CoinChip } from '@/components/patterns/CoinChip'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { useToast } from '@/components/ui/Toast'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { todayLocalISO } from '@/lib/date'
import { formatDateTime } from '@/lib/format'
import { TransactionRow } from '../components/TransactionRow'
import { useTransactions, useWalletSummary } from '../hooks/useTopup'

/** Empat saringan · FR-WALLET-15. "Menunggu" memilih status, bukan jenis. */
const FILTERS = [
  { id: 'all', label: t('tx.filterAll'), params: {} },
  { id: 'topup', label: t('tx.filterTopup'), params: { kind: 'topup' as const } },
  { id: 'spend', label: t('tx.filterSpend'), params: { kind: 'spend' as const } },
  { id: 'pending', label: t('tx.filterPending'), params: { status: 'pending' as const } },
] as const

const PAGE_SIZE = 20

function csvOf(rows: Transaction[]): string {
  const head = ['id', 'tanggal', 'jenis', 'judul', 'metode', 'status', 'koin']
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`
  const body = rows.map((tx) =>
    [tx.id, tx.createdAt, tx.kind, tx.title, tx.method ?? '', tx.status, String(tx.amount)]
      .map(quote)
      .join(','),
  )
  return [head.join(','), ...body].join('\n')
}

/**
 * Buku besar dompet · FR-WALLET-15 · FR-WALLET-16 · FR-WALLET-19.
 *
 * Saringannya hidup di URL dan **memicu permintaan baru ke server** — bukan
 * menyembunyikan baris yang sudah diambil dengan CSS. Prototipe mengumpulkan
 * barisnya sekali saat halaman dimuat, jadi transaksi yang lahir sesudah itu
 * tidak pernah ikut tersaring (PRD 09 §7 #7).
 */
export default function TransactionsPage() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()

  const active = FILTERS.find((f) => f.id === params.get('f')) ?? FILTERS[0]
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)

  const wallet = useWallet()
  const summary = useWalletSummary()
  const query = useTransactions({
    page: 1,
    pageSize: page * PAGE_SIZE,
    ...active.params,
  } as TxListParams)

  const rows = summary.data?.items ?? []

  /** Perubahan bulan berjalan — hanya baris yang benar-benar berhasil. */
  const thisMonth = useMemo(() => {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    return rows
      .filter((tx) => tx.status === 'success' && Date.parse(tx.createdAt) >= start.getTime())
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [rows])

  /** Peta pengeluaran: ke mana koin keluar, dalam persen. */
  const spendMap = useMemo(() => {
    const spend = rows.filter((tx) => tx.status === 'success' && tx.amount < 0)
    const total = spend.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    if (total === 0) return []

    const byRef = new Map<string, number>()
    for (const tx of spend) {
      byRef.set(tx.refType, (byRef.get(tx.refType) ?? 0) + Math.abs(tx.amount))
    }
    return [...byRef.entries()]
      .map(([label, coins]) => ({ label, pct: Math.round((coins / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
  }, [rows])

  const receiptStatus = useMemo(() => {
    const counts = new Map<string, number>()
    for (const tx of rows) counts.set(tx.status, (counts.get(tx.status) ?? 0) + 1)
    return [...counts.entries()]
  }, [rows])

  function setFilter(id: string) {
    const next = new URLSearchParams(params)
    next.set('f', id)
    next.delete('page')
    setParams(next, { replace: true })
  }

  function exportCsv() {
    // Berkas nyata, bukan pesan "diantrekan": Blob + tautan unduh, tanpa
    // dependensi apa pun (FR-WALLET-16, memperbaiki perilaku prototipe).
    const blob = new Blob([csvOf(rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    // `todayLocalISO`, bukan `toISOString()`: di WIB pagi berkasnya akan
    // bertanggal kemarin, dan itu menyesatkan saat diarsipkan.
    link.download = `novelova-kuitansi-${todayLocalISO()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.show(t('tx.exported')(rows.length), { tone: 'success' })
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-10">
      {/* Tanpa `<h1>` sendiri: `TopBarLayout` sudah merendernya. Dua `<h1>` di
          satu halaman membuat pembaca layar mengumumkan dua judul berbeda. */}
      <p className="px-4 pt-4 text-body text-nv-muted">{t('tx.subtitle')}</p>

      <section className="mx-4 flex items-center justify-between rounded-nv-lg bg-nv-surface px-4 py-3.5">
        <div>
          <p className="text-caption text-nv-muted">{t('tx.available')}</p>
          <CoinChip amount={wallet.data?.balance ?? 0} format="exact" className="pt-0.5 text-lg" />
        </div>
        <div className="text-right">
          <p className="text-caption text-nv-muted">{t('tx.thisMonth')}</p>
          <p className="pt-0.5 font-semibold text-body text-nv-success tabular-nums">
            {thisMonth >= 0 ? '+' : '−'}
            {Math.abs(thisMonth).toLocaleString('id-ID')}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 px-4 pt-4">
        {FILTERS.map((filter) => (
          <Chip
            key={filter.id}
            selected={filter.id === active.id}
            onClick={() => setFilter(filter.id)}
          >
            {filter.label}
          </Chip>
        ))}
      </div>

      <p className="px-4 pt-2.5 text-caption text-nv-muted">
        {t('tx.note')(active.label.toLowerCase())}
      </p>

      <div className="pt-2">
        <AsyncState
          loading={query.isPending}
          error={query.error}
          data={query.data}
          isEmpty={(page) => page.items.length === 0}
          onRetry={() => void query.refetch()}
          empty={
            active.id === 'all'
              ? { title: t('tx.emptyTitle'), description: t('tx.emptyBody') }
              : {
                  variant: 'no-results',
                  title: t('tx.emptyFilteredTitle'),
                  description: t('tx.emptyFilteredBody'),
                  action: { label: t('tx.filterAll'), onClick: () => setFilter('all') },
                }
          }
        >
          {(data) => (
            <>
              <div className="mx-4 overflow-hidden rounded-nv-lg border border-nv-line bg-nv-card">
                {data.items.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>

              {data.hasMore && (
                <div className="px-4 pt-3">
                  <Button
                    variant="secondary"
                    block
                    onClick={() => {
                      const next = new URLSearchParams(params)
                      next.set('page', String(page + 1))
                      setParams(next, { replace: true })
                    }}
                  >
                    {t('tx.more')}
                  </Button>
                </div>
              )}
            </>
          )}
        </AsyncState>
      </div>

      <div className="grid gap-3 px-4 pt-6 sm:grid-cols-2">
        <section className="rounded-nv-lg border border-nv-line p-3.5">
          <h2 className="font-semibold text-body text-nv-text">{t('tx.spendMap')}</h2>
          {spendMap.length === 0 ? (
            <p className="pt-2 text-caption text-nv-muted">{t('tx.noSpend')}</p>
          ) : (
            <dl className="pt-2">
              {spendMap.map((slice) => (
                <div key={slice.label} className="flex items-center justify-between py-0.5">
                  <dt className="text-body text-nv-muted capitalize">{slice.label}</dt>
                  <dd className="font-semibold text-body text-nv-text tabular-nums">
                    {slice.pct}%
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="rounded-nv-lg border border-nv-line p-3.5">
          <h2 className="font-semibold text-body text-nv-text">{t('tx.receiptStatus')}</h2>
          <dl className="pt-2">
            {receiptStatus.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-0.5">
                <dt className="text-body text-nv-muted capitalize">{status}</dt>
                <dd className="font-semibold text-body text-nv-text tabular-nums">{count}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="flex flex-wrap gap-2 px-4 pt-4">
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <Download size={14} aria-hidden /> {t('tx.exportCsv')}
        </Button>
        {/* ponytail: cetak peramban, bukan pustaka PDF. Hasilnya PDF sungguhan
            dan menambah nol dependensi; kalau nanti perlu tata letak kuitansi
            yang persis, di situlah pustaka baru bisa dibenarkan. */}
        <Button variant="ghost" size="sm" onClick={() => window.print()}>
          <Printer size={14} aria-hidden /> {t('tx.exportPdf')}
        </Button>
      </div>

      <p className="px-4 pt-3 text-caption text-nv-muted">
        {formatDateTime(new Date(wallet.data?.updatedAt ?? Date.now()))}
      </p>
    </div>
  )
}
