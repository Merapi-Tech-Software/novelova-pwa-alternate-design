import { useState } from 'react'
import type { AuthorChapter, ScheduleChapterInput, StoryAnalytics } from '@/api/contracts'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Modal'
import { t } from '@/i18n/t'
import { todayLocalISO } from '@/lib/date'

const HOURS = ['07:00', '12:00', '19:00', '21:00']

const CADENCES: Array<{ id: ScheduleChapterInput['cadence']; label: string }> = [
  { id: 'once', label: t('chapters.schedOnce') },
  { id: 'every-3-days', label: t('chapters.sched3Days') },
  { id: 'weekly', label: t('chapters.schedWeekly') },
  { id: 'mon-thu', label: t('chapters.schedMonThu') },
]

export interface ChapterScheduleSheetProps {
  chapter: AuthorChapter | null
  onClose: () => void
  onSave: (input: ScheduleChapterInput) => void
  saving: boolean
  /**
   * Waktu terbit terbaik dari analitik cerita ini · FR-STUDIO-37. Membawa
   * slotnya, bukan hanya kalimatnya — rekomendasi yang masih harus
   * diterjemahkan sendiri ke tanggal bukan pintasan.
   */
  bestTime?: StoryAnalytics['bestTime'] | undefined
  /**
   * Benar bila penjadwal dibuka lewat tautan rekomendasi (FR-EARN-05): waktunya
   * **langsung terisi**, bukan menunggu penulis menekan chipnya.
   */
  applyBestTime?: boolean | undefined
}

/**
 * Penjadwal **bab** · FR-STUDIO-11.
 *
 * Sengaja terpisah dari penjadwal cerita, dan keterangannya menegaskan itu:
 * satu menerbitkan cerita sebagai karya, satu lagi merilis bab per bab. Dua alur
 * yang tampak mirip tetapi berbeda akibatnya adalah tempat paling mudah salah
 * tekan.
 *
 * Dibuka dari tiga tempat (FR-STUDIO-11): tombol Jadwalkan pada draf, Ubah
 * Jadwal pada bab terjadwal, dan aksi Jadwalkan di menu — ketiganya memanggil
 * komponen yang sama, jadi tidak ada versi yang tertinggal saat aturannya
 * berubah.
 */
export function ChapterScheduleSheet({
  chapter,
  onClose,
  onSave,
  saving,
  bestTime,
  applyBestTime,
}: ChapterScheduleSheetProps) {
  const today = todayLocalISO()
  const [date, setDate] = useState(applyBestTime && bestTime ? bestTime.date : today)
  const [time, setTime] = useState(applyBestTime && bestTime ? bestTime.time : '19:00')
  const [cadence, setCadence] = useState<ScheduleChapterInput['cadence']>('once')

  if (!chapter) return null

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('chapters.schedTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button
            disabled={saving || date < today}
            onClick={() => onSave({ chapterId: chapter.id, date, time, cadence })}
          >
            {t('chapters.schedSave')}
          </Button>
        </>
      }
    >
      <p className="font-semibold text-body text-nv-accent">
        Bab {chapter.number} · {chapter.title}
      </p>
      <p className="pt-1 text-caption text-nv-muted">{t('chapters.schedOnlyChapter')}</p>

      {bestTime && (
        <p className="flex flex-wrap items-center gap-2 pt-3 text-caption text-nv-muted">
          {t('schedule.suggestion')(bestTime.label)}
          <Chip
            onClick={() => {
              setDate(bestTime.date)
              setTime(bestTime.time)
            }}
          >
            {t('schedule.suggestionUse')}
          </Chip>
        </p>
      )}

      <Input
        label={t('chapters.schedDate')}
        type="date"
        value={date}
        min={today}
        onChange={(e) => setDate(e.target.value)}
        className="mt-4"
      />

      <Input
        label={t('chapters.schedTime')}
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="mt-3"
      />
      <div className="flex flex-wrap gap-2 pt-2">
        {HOURS.map((hour) => (
          <Chip key={hour} selected={time === hour} onClick={() => setTime(hour)}>
            {hour}
          </Chip>
        ))}
      </div>

      <p className="pt-4 font-semibold text-body text-nv-text">{t('chapters.schedRepeat')}</p>
      <div className="flex flex-wrap gap-2 pt-2">
        {CADENCES.map((option) => (
          <Chip
            key={option.id}
            selected={cadence === option.id}
            onClick={() => setCadence(option.id)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </Sheet>
  )
}
