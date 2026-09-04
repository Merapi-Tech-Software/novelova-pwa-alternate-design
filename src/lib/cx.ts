/**
 * Penggabung className. Menggantikan `clsx` — tujuh baris, nol dependensi
 * (architecture.md §2: stdlib dulu, baru library).
 */
export type ClassValue = string | false | null | undefined

export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
