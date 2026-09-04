import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import type { SearchResult } from '@/api/contracts'
import { StoryCard } from '@/components/patterns/StoryCard'
import { Chip } from '@/components/ui/Chip'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { t } from '@/i18n/t'

/**
 * Tiga kelompok hasil · FR-SRCH-02.
 *
 * **Kelompok kosong tidak ditampilkan** — judul "Penulis" di atas ruang kosong
 * membuat pembaca mengira pencariannya rusak, padahal ia hanya tidak menemukan
 * penulis dengan nama itu.
 *
 * Tujuan tiap hasil berbeda dan disengaja: cerita menuju detailnya, penulis
 * menuju profilnya, tag menuju daftar yang tersaring tag itu.
 */
function Group({
  title,
  count,
  children,
}: {
  title: string
  count?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-6">
      <SectionHeader
        label={title}
        className="mb-1"
        {...(count
          ? { action: <span className="shrink-0 text-caption text-nv-muted">{count}</span> }
          : {})}
      />
      {children}
    </section>
  )
}

export function SearchResults({
  result,
  stories,
  onPickTag,
}: {
  /** Halaman pertama — sumber kelompok penulis dan tag, yang tidak berpaginasi. */
  result: SearchResult
  /** Cerita dari seluruh halaman yang sudah dimuat. */
  stories: SearchResult['stories']
  onPickTag: (tag: string) => void
}) {
  return (
    <div>
      {stories.length > 0 && (
        <Group title={t('search.groupStories')} count={t('search.resultCount')(stories.length)}>
          <ul className="divide-y divide-nv-line">
            {stories.map((story) => (
              <li key={story.id}>
                <StoryCard story={story} variant="list" />
              </li>
            ))}
          </ul>
        </Group>
      )}

      {result.authors.length > 0 && (
        <Group title={t('search.groupAuthors')}>
          <ul className="divide-y divide-nv-line">
            {result.authors.map((author) => (
              <li key={author.id}>
                <Link
                  to={`/pengguna/${author.id}`}
                  className="flex items-center gap-3 py-3 text-body"
                >
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-nv-pill bg-nv-paper-2 font-display text-card font-semibold text-nv-text"
                  >
                    {author.displayName.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {author.penName ?? author.displayName}
                    </span>
                    <span className="block truncate text-caption text-nv-muted">
                      @{author.username}
                    </span>
                  </span>
                  <ChevronRight size={16} aria-hidden className="shrink-0 text-nv-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      )}

      {result.tags.length > 0 && (
        <Group title={t('search.groupTags')}>
          <div className="flex flex-wrap gap-2 pt-3">
            {result.tags.map(({ tag, storyCount }) => (
              // Menjalankan pencarian tag itu di tempat, bukan berpindah
              // halaman: tujuannya sama, dan kolomnya ikut terisi.
              <Chip key={tag} onClick={() => onPickTag(tag)}>
                {tag} · <span className="tabular-nums">{t('search.tagCount')(storyCount)}</span>
              </Chip>
            ))}
          </div>
        </Group>
      )}
    </div>
  )
}
