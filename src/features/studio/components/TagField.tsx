import { X } from 'lucide-react'
import { useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Field'
import { t } from '@/i18n/t'
import { STORY_TAGS_MAX } from '@/lib/limits'

const SUGGESTIONS = ['slowburn', 'isekai', 'revenge', 'enemies-to-lovers']

export interface TagFieldProps {
  value: string[]
  onChange: (next: string[]) => void
}

/**
 * Tag cerita · FR-STUDIO-14.
 *
 * Dua penolakan yang **menyebut penyebabnya**, bukan diam:
 *
 * - Tag kembar menyebut **tag mana** yang bentrok. "Tag sudah ada" memaksa
 *   penulis memindai sepuluh chip untuk mencari yang mana.
 * - Batas sepuluh menyebut bahwa satu harus dihapus dulu. Prototipe
 *   mengabaikannya diam-diam, dan penulis mengira tombolnya rusak.
 */
export function TagField({ value, onChange }: TagFieldProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  function add(raw: string) {
    // Tanda pagar di depan dibuang dan spasi tepi dipangkas.
    const tag = raw.trim().replace(/^#+/, '').trim()
    if (tag === '') return

    if (value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      setError(t('storyForm.tagDuplicate')(tag))
      return
    }
    if (value.length >= STORY_TAGS_MAX) {
      setError(t('storyForm.tagFull')(STORY_TAGS_MAX))
      return
    }

    setError('')
    setDraft('')
    onChange([...value, tag])
  }

  return (
    <div>
      <Input
        label={t('storyForm.fTags')(STORY_TAGS_MAX)}
        value={draft}
        placeholder={t('storyForm.tagPlaceholder')}
        counter={`${value.length}/${STORY_TAGS_MAX}`}
        error={error}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          // Tanpa ini, Enter mengirim formulirnya sebelum tag sempat masuk.
          e.preventDefault()
          add(draft)
        }}
      />

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2 pt-2">
          {value.map((tag) => (
            <li key={tag}>
              <span className="inline-flex items-center gap-1 rounded-nv-pill bg-nv-paper-2 py-1 pr-1 pl-3 text-caption text-nv-text">
                {tag}
                <button
                  type="button"
                  aria-label={t('storyForm.tagRemove')(tag)}
                  onClick={() => {
                    setError('')
                    onChange(value.filter((x) => x !== tag))
                  }}
                  className="grid size-5 place-items-center rounded-nv-pill text-nv-muted hover:text-nv-danger"
                >
                  <X size={12} aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="pt-2 text-caption text-nv-muted">{t('storyForm.tagSuggestions')}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {SUGGESTIONS.filter((s) => !value.includes(s)).map((suggestion) => (
          <Chip key={suggestion} onClick={() => add(suggestion)}>
            #{suggestion}
          </Chip>
        ))}
      </div>
    </div>
  )
}
