/**
 * Perbandingan versi aplikasi · `APP-426`.
 *
 * Versi dibandingkan **per angka**, bukan sebagai string: `'2.10.0'` lebih baru
 * daripada `'2.9.0'`, sementara perbandingan string mengatakan sebaliknya. Itu
 * satu-satunya alasan berkas ini ada.
 */
export function isOutdated(current: string | undefined, minimum: string | undefined): boolean {
  if (!current || !minimum) return false

  const now = parts(current)
  const min = parts(minimum)
  for (let i = 0; i < Math.max(now.length, min.length); i++) {
    const a = now[i] ?? 0
    const b = min[i] ?? 0
    if (a !== b) return a < b
  }
  return false
}

function parts(version: string): number[] {
  return version.split('.').map((p) => Number.parseInt(p, 10) || 0)
}
