import type { ChapterLangDraft } from '@/api/contracts'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { countWords } from '../chapterDraft'

export interface DraftFailureNoticeProps {
  id: ChapterLangDraft
  en: ChapterLangDraft
  onSaveNow: () => void
}

/**
 * `DRAFT-409` · arch §1.4 · FR-STUDIO-34.
 *
 * Muncul setelah **empat** kegagalan autosave berturut-turut — bukan yang
 * pertama: satu kegagalan jaringan adalah hal biasa, empat berarti ada yang
 * benar-benar salah dan penulis perlu tahu.
 *
 * **Editornya tidak dibekukan.** Menghalangi penulis mengetik saat penyimpanan
 * gagal justru memperbesar kemungkinan tulisannya hilang; yang benar adalah
 * memberi tiga jalan keluar yang semuanya bekerja tanpa jaringan sama sekali.
 */
export function DraftFailureNotice({ id, en, onSaveNow }: DraftFailureNoticeProps) {
  const toast = useToast()
  const words = countWords(id.body) + countWords(en.body)

  const plain = [id.title, id.body, en.title, en.body]
    .filter((part) => part.trim() !== '')
    .join('\n\n')

  async function copy() {
    try {
      await navigator.clipboard.writeText(plain)
      toast.show(t('chapterEditor.copied'), { tone: 'success' })
    } catch {
      toast.show(t('chapterEditor.copyFailed'), { tone: 'danger' })
    }
  }

  function download() {
    // Blob + tautan unduh: berkas sungguhan, dan tidak menyentuh jaringan sama
    // sekali — justru itu gunanya di layar ini.
    const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${id.title.trim() === '' ? 'naskah-bab' : id.title}.txt`
    link.click()
    URL.revokeObjectURL(url)
    toast.show(t('chapterEditor.downloaded'), { tone: 'success' })
  }

  return (
    <FailureNotice
      level="inset"
      title={t('chapterEditor.failTitle')}
      body={t('chapterEditor.failBody')(words)}
      safety={t('chapterEditor.failSafe')}
      code="DRAFT-409"
      actions={
        <>
          <Button size="sm" onClick={onSaveNow}>
            {t('chapterEditor.failSaveNow')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void copy()}>
            {t('chapterEditor.failCopy')}
          </Button>
          <Button variant="ghost" size="sm" onClick={download}>
            {t('chapterEditor.failDownload')}
          </Button>
        </>
      }
    />
  )
}
