import { Download, Printer } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Transaction, TxListParams } from '@/api/contracts'
import { CoinChip } from '@/components/patterns/CoinChip'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { todayLocalISO } from '@/lib/date'
import { formatDateTime } from '@/lib/format'
import { TransactionRow, TX_REF_LABEL, TX_STATUS_LABEL } from '../components/TransactionRow'
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

    // Dikelompokkan lewat labelnya, bukan lewat nilai enum-nya: yang dibaca
    // pengguna adalah "Buka bab", dan dua enum yang berbeda tidak pernah
    // memetakan ke label yang sama, jadi pengelompokannya tetap setara.
    const byRef = new Map<string, number>()
    for (const tx of spend) {
      const label = TX_REF_LABEL[tx.refType]
      byRef.set(label, (byRef.get(label) ?? 0) + Math.abs(tx.amount))
    }
    return [...byRef.entries()]
      .map(([label, coins]) => ({ label, pct: Math.round((coins / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
  }, [rows])

  const receiptStatus = useMemo(() => {
    // Dihitung atas **label**-nya, bukan atas nilai enum-nya: panel ini dibaca
    // pengguna, dan `success`/`reversed` adalah satu-satunya bahasa Inggris yang
    // sempat tersisa di layar — tepat di halaman uang.
    const counts = new Map<string, number>()
    for (const tx of rows) {
      const label = TX_STATUS_LABEL[tx.status]
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    return [...counts.entries()]
  }, [rows])

  function setFilter(id: (typeof FILTERS)[number]['id']) {
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

      {/*
        **Brankas: panel putih, angka serif** (`7i`). Ia satu-satunya blok putih
        di halaman ini, dan itu disengaja — ia satu-satunya yang menyatakan saldo.
        Angkanya serif karena brief §1 menaruh angka di dalam blok statistik pada
        muka yang sama dengan judul cerita; label di sekelilingnya tetap sans.
      */}
      <section className="mx-4 mt-4 flex items-start justify-between gap-4 rounded-nv-lg bg-nv-card p-4">
        <div className="min-w-0">
          <p className="nv-section-label">{t('tx.available')}</p>
          <p className="pt-1">
            <CoinChip
              amount={wallet.data?.balance ?? 0}
              bonus={wallet.data?.bonus ?? 0}
              className="font-display text-page"
            />
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="nv-section-label">{t('tx.thisMonth')}</p>
          <p className="pt-1 font-display text-card font-bold text-nv-text tabular-nums">
            {thisMonth >= 0 ? '+' : '−'}
            {Math.abs(thisMonth).toLocaleString('id-ID')}
          </p>
        </div>
      </section>

      {/* **Tab teks bergaris bawah 2px, bukan pil** (brief §1 aturan 5): saringan
          adalah tab teks di seluruh aplikasi ini, dan pil dipakai hanya di tempat
          mockup memang menggambar pil. Yang tidak berubah: menekannya tetap
          **meminta ulang barisnya ke server**, bukan menyembunyikan baris. */}
      <Tabs
        items={FILTERS.map((f) => ({ value: f.id, label: f.label }))}
        value={active.id}
        onChange={setFilter}
        label={t('tx.title')}
        className="mt-4 px-4"
      />

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
              {/* Baris berpembatas tanpa kotak: daftar mengalahkan kartu, dan
                  garisnya sendiri sudah memisahkan baris satu dari lainnya. */}
              <div className="-mx-0 border-nv-line border-y">
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

      <div className="grid grid-cols-1 gap-5 px-4 pt-6 sm:grid-cols-2">
        <section>
          <SectionHeader label={t('tx.spendMap')} />
          {spendMap.length === 0 ? (
            <p className="pt-2 text-caption text-nv-muted">{t('tx.noSpend')}</p>
          ) : (
            <dl className="pt-1">
              {spendMap.map((slice) => (
                <div
                  key={slice.label}
                  className="flex items-center justify-between gap-3 border-nv-line border-b py-2 last:border-0"
                >
                  <dt className="min-w-0 truncate text-body text-nv-text-2">{slice.label}</dt>
                  <dd className="shrink-0 font-semibold text-body text-nv-text tabular-nums">
                    {slice.pct}%
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section>
          <SectionHeader label={t('tx.receiptStatus')} />
          <dl className="pt-1">
            {receiptStatus.map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between gap-3 border-nv-line border-b py-2 last:border-0"
              >
                <dt className="min-w-0 truncate text-body text-nv-text-2">{status}</dt>
                <dd className="shrink-0 font-semibold text-body text-nv-text tabular-nums">
                  {count}
                </dd>
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
