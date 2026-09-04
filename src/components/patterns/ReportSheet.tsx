import { useState } from 'react'
import type { ReportReason } from '@/api/contracts'
import { Button } from '../ui/Button'
import { TextArea } from '../ui/Field'
import { Sheet } from '../ui/Modal'

const REASONS: Array<{ value: ReportReason; label: string; hint: string }> = [
  { value: 'spam', label: 'Spam atau promosi', hint: 'Tautan jualan, akun palsu' },
  { value: 'spoiler', label: 'Spoiler tanpa peringatan', hint: 'Membocorkan jalan cerita' },
  { value: 'kasar', label: 'Kasar atau melecehkan', hint: 'Menyerang orang, bukan karya' },
  { value: 'plagiat', label: 'Plagiat', hint: 'Karya orang lain tanpa izin' },
  { value: 'dewasa', label: 'Konten dewasa tanpa label', hint: 'Tidak sesuai target pembaca' },
  { value: 'lainnya', label: 'Lainnya', hint: 'Jelaskan di kolom di bawah' },
]

export interface ReportSheetProps {
  open: boolean
  onClose: () => void
  onSubmit: (reason: ReportReason, note: string) => void
  /** Apa yang dilaporkan — muncul di judul supaya tidak salah sasaran. */
  targetLabel: string
  submitting?: boolean
}

/**
 * Lembar laporan — dipakai cerita, ulasan, dan komentar (FR-SOCIAL-07).
 *
 * "Lainnya" **wajib** disertai keterangan; tanpa itu laporannya tidak bisa
 * ditindaklanjuti dan hanya menumpuk di antrean tinjauan.
 */
export function ReportSheet({
  open,
  onClose,
  onSubmit,
  targetLabel,
  submitting = false,
}: ReportSheetProps) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [note, setNote] = useState('')

  const needsNote = reason === 'lainnya'
  const canSubmit = reason !== null && (!needsNote || note.trim().length > 0)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Laporkan ${targetLabel}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={!canSubmit}
            loading={submitting}
            onClick={() => reason && onSubmit(reason, note.trim())}
          >
            Kirim laporan
          </Button>
        </>
      }
    >
      <fieldset className="space-y-2">
        <legend className="pb-2 text-caption text-nv-muted">
          Laporan ditinjau moderator. Konten tetap tampil sampai ada keputusan.
        </legend>

        {REASONS.map((r) => (
          <label
            key={r.value}
            className="flex cursor-pointer items-start gap-3 rounded-nv-md border border-nv-line px-3.5 py-3 transition has-checked:border-nv-accent has-checked:bg-nv-accent-soft"
          >
            <input
              type="radio"
              name="report-reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="mt-0.5 accent-[var(--nv-accent)]"
            />
            <span className="min-w-0">
              <span className="block text-body font-semibold">{r.label}</span>
              <span className="block text-caption text-nv-muted">{r.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {needsNote && (
        <div className="pt-3">
          <TextArea
            label="Keterangan"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Apa yang membuatmu melaporkan ini?"
            hint="Wajib diisi untuk alasan Lainnya."
          />
        </div>
      )}
    </Sheet>
  )
}
