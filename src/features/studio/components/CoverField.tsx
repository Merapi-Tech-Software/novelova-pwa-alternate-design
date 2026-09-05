import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n/t'
import { COVER_MAX_BYTES, COVER_RATIO, COVER_RATIO_TOLERANCE } from '@/lib/limits'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export interface CoverFieldProps {
  value: string | null
  onChange: (next: string | null) => void
  /** Teks placeholder berbeda antar mode: "Unggah sampul" vs "Sampul bawaan". */
  placeholder: string
}

/**
 * Unggah sampul · FR-STUDIO-13.
 *
 * **Format dan ukuran menolak; rasio hanya menyarankan.** Itu pembagian yang
 * disengaja: berkas 8 MB berformat GIF memang tidak bisa dipakai, sedangkan
 * gambar persegi tetap tampil — hanya kurang bagus. Menolak yang kedua berarti
 * menahan penulis karena selera tata letak.
 *
 * Dan sarannya menyebut **ukuran yang benar**, bukan sekadar menyatakan salah:
 * "rasio 2:3 — misalnya 800×1200" bisa langsung dikerjakan; "rasio tidak sesuai"
 * tidak.
 */
export function CoverField({ value, onChange, placeholder }: CoverFieldProps) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [advice, setAdvice] = useState('')

  function pick(file: File | undefined) {
    if (!file) return
    setError('')
    setAdvice('')

    if (!ACCEPTED.includes(file.type) || file.size > COVER_MAX_BYTES) {
      setError(t('storyForm.coverRejected'))
      return
    }

    const url = URL.createObjectURL(file)
    const probe = new Image()
    probe.onload = () => {
      // Rasio dibaca dari dimensi gambar yang sudah dimuat, bukan dari nama
      // berkasnya — nama berkas bisa berbohong, piksel tidak.
      const ratio = probe.width / probe.height
      if (Math.abs(ratio - COVER_RATIO) > COVER_RATIO_TOLERANCE) {
        setAdvice(t('storyForm.coverRatioHint'))
      }
      onChange(url)
    }
    probe.onerror = () => setError(t('storyForm.coverRejected'))
    probe.src = url
  }

  return (
    <div>
      <p className="nv-section-label border-nv-line border-b pb-1.5">{t('storyForm.cover')}</p>

      <div className="flex items-start gap-3 pt-3">
        {value ? (
          <img src={value} alt="" className="w-[86px] rounded-nv-md object-cover" />
        ) : (
          /*
            **Slot putus-putus rasio 2:3** (`7k`), bukan kotak abu solid: garis
            putus-putus dibaca sebagai "belum diisi, taruh sesuatu di sini",
            sementara kotak solid dibaca sebagai gambar yang gagal dimuat. Dan
            rasionya sama dengan sampul sungguhan, jadi penulis melihat bentuk
            yang akan ia dapat sebelum mengunggah apa pun.
          */
          <span className="grid aspect-[2/3] w-[86px] shrink-0 place-items-center rounded-nv-md border border-nv-line border-dashed px-2 text-center text-caption text-nv-muted">
            {placeholder}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <input
            ref={input}
            type="file"
            accept={ACCEPTED.join(',')}
            className="sr-only"
            aria-label={t('storyForm.coverUpload')}
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => input.current?.click()}>
              {t('storyForm.coverUpload')}
            </Button>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(null)
                  setAdvice('')
                  setError('')
                }}
              >
                {t('storyForm.coverRemove')}
              </Button>
            )}
          </div>
          <p className="pt-2 text-caption text-nv-muted">{t('storyForm.coverHint')}</p>
          {error && <p className="pt-1 text-caption text-nv-danger">{error}</p>}
          {advice && <p className="pt-1 text-caption text-nv-warning">{advice}</p>}
        </div>
      </div>
    </div>
  )
}
