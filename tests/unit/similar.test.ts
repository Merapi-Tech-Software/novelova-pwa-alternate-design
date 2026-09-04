import { describe, expect, it } from 'vitest'
import { editDistance, suggest } from '@/lib/similar'

const GENRE = ['Romance', 'Mystery', 'Fantasy', 'Drama', 'Thriller']

describe('editDistance', () => {
  it('menghitung sisip, hapus, dan ganti', () => {
    expect(editDistance('romance', 'romance')).toBe(0)
    expect(editDistance('romanse', 'romance')).toBe(1) // ganti
    expect(editDistance('romace', 'romance')).toBe(1) // sisip
    expect(editDistance('romancee', 'romance')).toBe(1) // hapus
  })

  it('tidak peka huruf besar-kecil dan menangani string kosong', () => {
    expect(editDistance('ROMANCE', 'romance')).toBe(0)
    expect(editDistance('', 'drama')).toBe(5)
    expect(editDistance('drama', '')).toBe(5)
  })
})

describe('suggest', () => {
  it('menemukan kandidat mirip untuk salah ketik (FR-SRCH-05)', () => {
    expect(suggest('romanse', GENRE)).toBe('Romance')
    expect(suggest('mistery', GENRE)).toBe('Mystery')
  })

  it('diam saat ejaannya sudah benar', () => {
    // "Maksud Anda Romance?" untuk kueri "Romance" hanya bikin bingung.
    expect(suggest('Romance', GENRE)).toBeNull()
  })

  it('diam saat tidak ada yang cukup dekat', () => {
    expect(suggest('kuliner', GENRE)).toBeNull()
    expect(suggest('zzzzzzz', GENRE)).toBeNull()
  })

  it('tidak menyarankan apa pun untuk kata sangat pendek', () => {
    // Pada 3 huruf, jarak 2 sudah jadi kata lain sama sekali —
    // saran yang salah lebih buruk daripada tidak ada saran.
    expect(suggest('bab', ['ibu', 'bak'])).toBeNull()
    expect(suggest('a', GENRE)).toBeNull()
  })

  it('memilih yang paling dekat saat ada beberapa kandidat', () => {
    expect(suggest('dramaa', ['Drama', 'Thriller'])).toBe('Drama')
  })

  it('menangani daftar kandidat kosong', () => {
    expect(suggest('romanse', [])).toBeNull()
  })
})
