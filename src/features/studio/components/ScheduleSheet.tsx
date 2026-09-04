import { useState } from 'react'
import type { ScheduleStoryInput, StudioStory } from '@/api/contracts'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Modal'
import { t } from '@/i18n/t'
import { todayLocalISO } from '@/lib/date'

const HOURS = ['07:00', '12:00', '19:00', '21:00']

const CADENCES: Array<{ id: ScheduleStoryInput['cadence']; label: string }> = [
  { id: 'once', label: t('studio.schedOnce') },
  { id: 'daily', label: t('studio.schedDaily') },
  { id: 'weekly', label: t('studio.schedWeekly') },
  { id: 'mon-thu', label: t('studio.schedMonThu') },
]

export interface ScheduleSheetProps {
  item: StudioStory | null
  onClose: () => void
  onSave: (input: ScheduleStoryInput) => void
  saving: boolean
}

/**
 * Penjadwal terbit cerita · FR-STUDIO-04.
 *
 * Empat langkah bernomor, dan langkah pertama ada justru untuk menegaskan apa
 * yang **tidak** dilakukan: yang diterbitkan adalah cerita sebagai satu karya,
 * bukan bab tertentu. Penjadwal bab punya layarnya sendiri.
 *
 * Tanggal minimum memakai `todayLocalISO()`, bukan `toISOString().slice(0,10)`.
 * Di WIB pukul enam pagi, UTC masih hari kemarin — dan penulis akan menemukan
 * tanggal hari ini ditolak tanpa penjelasan apa pun.
 */
export function ScheduleSheet({ item, onClose, onSave, saving }: ScheduleSheetProps) {
  const today = todayLocalISO()
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('19:00')
  const [cadence, setCadence] = useState<ScheduleStoryInput['cadence']>('once')

  if (!item) return null

  const shortcuts = Array.from({ length: 4 }, (_, i) =>
    todayLocalISO(new Date(Date.now() + i * 86_400_000)),
  )

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('studio.schedTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button
            disabled={saving || date < today}
            onClick={() => onSave({ storyId: item.story.id, date, time, cadence })}
          >
            {t('studio.schedSave')}
          </Button>
        </>
      }
    >
      <section>
        <h3 className="font-semibold text-body text-nv-text">{t('studio.schedStep1')}</h3>
        <p className="pt-1 font-semibold text-body text-nv-accent">{item.story.title}</p>
        <p className="pt-1 text-caption text-nv-muted">{t('studio.schedWhole')}</p>
      </section>

      <section className="pt-4">
        <h3 className="font-semibold text-body text-nv-text">{t('studio.schedStep2')}</h3>
        <Input
          label={t('studio.schedStep2')}
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1"
        />
        <div className="flex flex-wrap gap-2 pt-2">
          {shortcuts.map((day, i) => (
            <Chip key={day} selected={date === day} onClick={() => setDate(day)}>
              {i === 0 ? t('studio.schedToday') : day.slice(5)}
            </Chip>
          ))}
        </div>
      </section>

      <section className="pt-4">
        <h3 className="font-semibold text-body text-nv-text">{t('studio.schedStep3')}</h3>
        <Input
          label={t('studio.schedStep3')}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1"
        />
        <div className="flex flex-wrap gap-2 pt-2">
          {HOURS.map((hour) => (
            <Chip key={hour} selected={time === hour} onClick={() => setTime(hour)}>
              {hour}
            </Chip>
          ))}
        </div>
      </section>

      <section className="pt-4">
        <h3 className="font-semibold text-body text-nv-text">{t('studio.schedStep4')}</h3>
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
      </section>
    </Sheet>
  )
}
