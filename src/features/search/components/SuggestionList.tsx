import { Search } from 'lucide-react'
import type { Suggestion } from '@/api/contracts'
import { t } from '@/i18n/t'

const KIND_LABEL: Record<Suggestion['kind'], string> = {
  cerita: 'Cerita',
  penulis: 'Penulis',
  tag: 'Tag',
  riwayat: 'Riwayat',
}

/**
 * Saran sambil mengetik · FR-SRCH-03.
 *
 * **Bagian yang cocok ditebalkan**, dan potongannya datang dari server
 * (`matchStart`/`matchLength`) — bukan ditebak ulang di komponen dengan
 * `indexOf`, yang akan meleset begitu pencocokannya lebih pintar daripada
 * "substring persis".
 */
export function SuggestionList({
  suggestions,
  onPick,
}: {
  suggestions: Suggestion[]
  onPick: (label: string) => void
}) {
  if (suggestions.length === 0) return null

  return (
    <ul
      aria-label={t('search.suggestions')}
      className="mb-4 divide-y divide-nv-line border-nv-line border-b"
    >
      {suggestions.map((item) => {
        const before = item.label.slice(0, item.matchStart)
        const hit = item.label.slice(item.matchStart, item.matchStart + item.matchLength)
        const after = item.label.slice(item.matchStart + item.matchLength)

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onPick(item.label)}
              className="flex w-full items-center gap-3 py-3.5 text-left text-body"
            >
              <Search size={15} aria-hidden className="shrink-0 text-nv-muted" />
              <span className="min-w-0 flex-1 truncate">
                {before}
                <strong className="font-bold text-nv-text">{hit}</strong>
                {after}
              </span>
              <span className="shrink-0 text-caption text-nv-muted">{KIND_LABEL[item.kind]}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
