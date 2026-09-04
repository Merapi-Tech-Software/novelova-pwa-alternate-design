/**
 * Saran ejaan untuk keadaan kosong pencarian — *"Maksud Anda …?"* (FR-SRCH-05).
 *
 * Jarak Levenshtein dua baris array, bukan matriks penuh: kandidatnya adalah
 * judul cerita dan tag, jadi masukannya pendek dan jumlahnya ratusan, bukan
 * jutaan. Tidak ada library untuk ini (architecture.md §2).
 */

/**
 * Jarak edit antara dua kata: jumlah sisip, hapus, dan ganti minimum.
 * Tidak peka huruf besar-kecil.
 */
export function editDistance(a: string, b: string): number {
  const s = a.toLowerCase()
  const t = b.toLowerCase()
  if (s === t) return 0
  if (s.length === 0) return t.length
  if (t.length === 0) return s.length

  let prev = Array.from({ length: t.length + 1 }, (_, i) => i)
  let curr = new Array<number>(t.length + 1)

  for (let i = 1; i <= s.length; i++) {
    curr[0] = i
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      // Non-null: indeks i-1/j-1 selalu dalam jangkauan karena loop dimulai dari 1.
      const deletion = (prev[j] ?? 0) + 1
      const insertion = (curr[j - 1] ?? 0) + 1
      const substitution = (prev[j - 1] ?? 0) + cost
      curr[j] = Math.min(deletion, insertion, substitution)
    }
    const swap = prev
    prev = curr
    curr = swap
  }

  return prev[t.length] ?? 0
}

/**
 * Ambang toleransi salah ketik menurut panjang kata.
 *
 * Kata pendek tidak boleh permisif — pada 3 huruf, jarak 2 sudah mengubahnya
 * jadi kata lain sama sekali ("bab" → "ibu"). Menyarankan yang salah lebih buruk
 * daripada tidak menyarankan apa pun.
 */
function tolerance(length: number): number {
  if (length <= 3) return 0
  if (length <= 5) return 1
  if (length <= 9) return 2
  return 3
}

/**
 * Kandidat termirip dari daftar, atau `null` bila tidak ada yang cukup dekat.
 *
 * @example
 * suggest('romanse', ['Romance', 'Mystery']) // "Romance"
 * suggest('xyz', ['Romance'])                // null
 */
export function suggest(query: string, candidates: readonly string[]): string | null {
  const q = query.trim()
  if (q.length < 2) return null

  const max = tolerance(q.length)
  if (max === 0) return null

  let best: string | null = null
  let bestDistance = max + 1

  for (const candidate of candidates) {
    const distance = editDistance(q, candidate)
    if (distance === 0) return null // ejaannya sudah benar — tidak ada yang perlu disarankan
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }

  return bestDistance <= max ? best : null
}
