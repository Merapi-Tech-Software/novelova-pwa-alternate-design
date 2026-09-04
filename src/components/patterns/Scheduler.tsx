import { useState } from 'react'
import { todayLocalISO } from '@/lib/date'
import { Chip } from '../ui/Chip'
import { Input, Select } from '../ui/Field'

export interface ScheduleValue {
  date: string
  time: string
  repeat: string
}

export interface SchedulerProps {
  value: ScheduleValue
  onChange: (next: ScheduleValue) => void
  /** Kesalahan inline, mis. `SCHED-422` saat waktunya sudah lewat. */
  error?: string
}

/** Jam yang paling sering dipakai penulis — pintasan, bukan pengganti input. */
const QUICK_HOURS = ['07:00', '12:00', '19:00', '20:00', '21:00'] as const

const REPEATS = [
  'Sekali',
  'Setiap hari',
  'Setiap minggu',
  'Senin & Kamis',
  'Setiap dua minggu',
] as const

/**
 * Penjadwal terbit.
 *
 * Tanggal minimumnya **hari ini menurut zona waktu pengguna** (`todayLocalISO`),
 * bukan hari ini menurut UTC — di WIB pagi, keduanya berbeda dan penjadwal akan
 * menolak "hari ini" sebagai masa lalu (FR-STUDIO-04).
 */
export function Scheduler({ value, onChange, error }: SchedulerProps) {
  const [min] = useState(() => todayLocalISO())

  const set = (patch: Partial<ScheduleValue>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Tanggal terbit"
          type="date"
          min={min}
          value={value.date}
          onChange={(e) => set({ date: e.target.value })}
          {...(error ? { error } : {})}
        />
        <Input
          label="Jam"
          type="time"
          value={value.time}
          onChange={(e) => set({ time: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_HOURS.map((h) => (
          <Chip key={h} selected={value.time === h} onClick={() => set({ time: h })}>
            {h.replace(':', '.')}
          </Chip>
        ))}
      </div>

      <Select
        label="Pengulangan"
        options={REPEATS}
        value={value.repeat}
        onChange={(e) => set({ repeat: e.target.value })}
      />

      <p className="text-caption text-nv-muted">
        Waktu disimpan dalam UTC beserta zona waktumu, lalu ditampilkan mengikuti zona waktu pembaca
        — jadi bab tetap terbit pada momen yang sama di mana pun mereka berada.
      </p>
    </div>
  )
}
