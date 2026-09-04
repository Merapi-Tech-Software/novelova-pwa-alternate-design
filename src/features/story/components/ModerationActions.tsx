import { useState } from 'react'
import type { ReportInput } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { ReportSheet } from '@/components/patterns/ReportSheet'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { useBlocks, useBlockUser, useReport } from '../hooks/useModeration'

export interface ModerationActionsProps {
  targetType: ReportInput['targetType']
  targetId: string
  targetLabel: string
  /** Pemilik konten; `null` untuk cerita, yang tidak bisa "diblokir". */
  ownerId: string | null
  ownerName?: string
}

/**
 * Laporkan & blokir · FR-SOCIAL-07.
 *
 * Satu komponen untuk cerita, ulasan, dan komentar — alur yang sama, sasaran
 * yang berbeda. Tombol **Report di detail cerita memakai ini juga**, menutup
 * tautan yang di prototipe tidak punya handler sama sekali.
 */
export function ModerationActions({
  targetType,
  targetId,
  targetLabel,
  ownerId,
  ownerName,
}: ModerationActionsProps) {
  const toast = useToast()
  const report = useReport()
  const block = useBlockUser()
  const blocks = useBlocks()
  const [open, setOpen] = useState(false)

  const isBlocked = ownerId !== null && (blocks.data ?? []).includes(ownerId)

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {t('moderation.report')}
      </Button>

      {ownerId && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            void block.mutateAsync({ userId: ownerId, on: !isBlocked }).then(() => {
              const name = ownerName ?? ''
              toast.show(
                isBlocked ? t('moderation.unblocked')(name) : t('moderation.blocked')(name),
              )
            })
          }
        >
          {isBlocked ? t('moderation.unblock') : t('moderation.block')}
        </Button>
      )}

      <ReportSheet
        open={open}
        onClose={() => setOpen(false)}
        targetLabel={targetLabel}
        submitting={report.isPending}
        onSubmit={(reason, note) => {
          void report
            .mutateAsync({ targetType, targetId, reason, note })
            .then(() => {
              setOpen(false)
              // Konfirmasi diterima — dan **menyatakan tidak ada kabar hasil**,
              // supaya pelapor tidak menunggu balasan yang memang tidak ada.
              toast.show(t('moderation.sent'))
            })
            .catch((error: unknown) => {
              setOpen(false)
              toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), {
                tone: 'danger',
              })
            })
        }}
      />
    </>
  )
}
