import { X } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/i18n/t'
import { useSearchHistory } from '@/stores/searchHistory'

export interface SearchIdleProps {
  /** Apa yang sudah diketik — di bawah dua huruf, ini bukan keadaan kosong. */
  typed: string
  trending: string[]
  onPick: (query: string) => void
}

/**
 * Layar pencarian sebelum ada kueri · FR-SRCH-03.
 *
 * Dua blok, dan keduanya boleh tidak ada: **riwayat tidak ditampilkan sama
 * sekali** bila pengguna belum pernah mencari — judul "Pencarian terakhir" di
 * atas ruang kosong menagih sesuatu yang belum pernah terjadi.
 *
 * Menekan riwayat maupun kata kunci populer **langsung menjalankan
 * pencariannya**, bukan sekadar mengisi kolom lalu menunggu ketukan berikutnya.
 */
export function SearchIdle({ typed, trending, onPick }: SearchIdleProps) {
  const entries = useSearchHistory((s) => s.entries)
  const forget = useSearchHistory((s) => s.forget)
  const clear = useSearchHistory((s) => s.clear)

  return (
    <div>
      {entries.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-section font-semibold">{t('search.recent')}</h2>
            <button
              type="button"
              onClick={clear}
              className="text-caption font-semibold text-nv-muted underline underline-offset-4"
            >
              {t('search.clearAll')}
            </button>
          </div>

          <ul className="divide-y divide-nv-line-soft">
            {entries.map((entry) => (
              <li key={entry} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPick(entry)}
                  className="min-w-0 flex-1 truncate py-2.5 text-left text-body"
                >
                  {entry}
                </button>
                <button
                  type="button"
                  onClick={() => forget(entry)}
                  aria-label={t('search.forget')(entry)}
                  className="shrink-0 rounded-nv-pill p-2 text-nv-muted"
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trending.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 font-display text-section font-semibold">{t('search.trending')}</h2>
          <div className="flex flex-wrap gap-2">
            {trending.map((query) => (
              <Chip key={query} onClick={() => onPick(query)}>
                {query}
              </Chip>
            ))}
          </div>
        </section>
      )}

      <EmptyState
        title={t('search.idleTitle')}
        description={typed.length === 0 ? t('search.idleBody') : t('search.tooShort')(2)}
      />
    </div>
  )
}
