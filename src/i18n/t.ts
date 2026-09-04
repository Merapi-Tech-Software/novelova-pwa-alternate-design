import { type Dict, id } from './id'

/**
 * Pengambil string bertipe. `t('nav.home')` benar; `t('nav.hom')` gagal compile.
 *
 * Tidak ada library i18n (keputusan #3) — dan tidak ada interpolasi string ala
 * `{{name}}` di sini. String yang butuh nilai ditulis sebagai fungsi di
 * `id.ts`, sehingga argumennya ikut diperiksa compiler:
 * `t('coin.needMore')(1200)` menolak `t('coin.needMore')('1200')`.
 */

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string | ((...args: never[]) => string)
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type Key = Leaves<Dict>

type ValueAt<T, P extends string> = P extends `${infer Head}.${infer Rest}`
  ? Head extends keyof T
    ? ValueAt<T[Head], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never

export function t<K extends Key>(key: K): ValueAt<Dict, K> {
  let node: unknown = id
  for (const part of key.split('.')) {
    node = (node as Record<string, unknown>)[part]
  }
  return node as ValueAt<Dict, K>
}

/** Kamus mentah, untuk kasus yang perlu menelusuri satu cabang sekaligus. */
export { id as dict }
