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
      className="mb-4 overflow-hidden rounded-nv-lg border border-nv-line bg-nv-card"
    >
      {suggestions.map((item) => {
        const before = item.label.slice(0, item.matchStart)
        const hit = item.label.slice(item.matchStart, item.matchStart + item.matchLength)
        const after = item.label.slice(item.matchStart + item.matchLength)

        return (
          <li key={item.id} className="border-nv-line-soft border-b last:border-b-0">
            <button
              type="button"
              onClick={() => onPick(item.label)}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-body"
            >
              <span className="min-w-0 truncate">
                {before}
                <strong className="font-semibold text-nv-accent-strong">{hit}</strong>
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
