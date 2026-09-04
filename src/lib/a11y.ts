import { type RefObject, useEffect, useRef } from 'react'

/**
 * Aksesibilitas overlay. Ini bukan bagian yang boleh disederhanakan: dialog yang
 * tidak menahan fokus membuat pengguna keyboard tersesat ke halaman di belakang
 * tanpa cara kembali.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Menahan fokus di dalam `ref` selama `active`, lalu **mengembalikannya ke
 * pemicu** saat ditutup — bagian terakhir ini yang paling sering terlupa.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
    // Fokus awal ke elemen pertama; kalau kosong, ke wadahnya sendiri.
    const first = focusables()[0]
    if (first) first.focus()
    else {
      node.tabIndex = -1
      node.focus()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (!firstItem || !lastItem) return

      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [ref, active])
}

export interface DismissOptions {
  /** Tutup saat Escape ditekan. Default `true`. */
  onEscape?: boolean
  /** Tutup saat klik di luar `ref`. Default `true`. */
  onOutsideClick?: boolean
  /**
   * Tutup saat halaman digulir. Popover memakainya; sheet dan modal tidak —
   * mereka justru mengunci gulir (FR-HOME-06).
   */
  onScroll?: boolean
}

/**
 * Menutup overlay lewat Escape, klik luar, atau gulir.
 *
 * Klik **di dalam** tidak pernah menutup — sakelar section beranda harus bisa
 * dinyalakan berkali-kali tanpa popover-nya kabur setiap kali (FR-HOME-06).
 */
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onDismiss: () => void,
  options: DismissOptions = {},
): void {
  const { onEscape = true, onOutsideClick = true, onScroll = false } = options
  const dismiss = useRef(onDismiss)
  dismiss.current = onDismiss

  useEffect(() => {
    if (!active) return

    const handleKey = (e: KeyboardEvent) => {
      if (onEscape && e.key === 'Escape') {
        e.stopPropagation()
        dismiss.current()
      }
    }

    const handlePointer = (e: PointerEvent) => {
      if (!onOutsideClick) return
      const node = ref.current
      if (node && !node.contains(e.target as Node)) dismiss.current()
    }

    const handleScroll = () => {
      if (onScroll) dismiss.current()
    }

    document.addEventListener('keydown', handleKey)
    // `pointerdown`, bukan `click`: menutup sebelum elemen di bawah bereaksi.
    document.addEventListener('pointerdown', handlePointer)
    if (onScroll) window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', handlePointer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [ref, active, onEscape, onOutsideClick, onScroll])
}

/** Mengunci gulir latar selama overlay terbuka, tanpa layar melompat. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const { overflow, paddingRight } = document.body.style
    const gap = window.innerWidth - document.documentElement.clientWidth

    /*
     * Posisi gulir disimpan **sebelum** dikunci, lalu dipulihkan saat dilepas.
     *
     * `overflow: hidden` meruntuhkan wadah gulirnya, dan peramban menyetel
     * `scrollY` ke nol pada saat itu. Tanpa memulihkannya, **menutup lembar atau
     * modal apa pun melemparkan pengguna ke puncak halaman** — dan di ruang baca
     * itu berarti kehilangan tempat membaca, yang persis dilarang brief §8.
     *
     * Diperbaiki di sini, bukan di lembar komentar saja: satu pengunci dipakai
     * setiap overlay di aplikasi ini, jadi cacatnya juga ada di lembar voucher,
     * rating, cetak, dan saldo kurang.
     */
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      // `documentElement.scrollTop`, bukan `window.scrollTo`: `scroll-behavior:
      // smooth` di `base.css` membuat yang kedua **menganimasikan** pemulihannya,
      // dan pengguna melihat halaman meluncur tiap kali menutup lembar.
      document.documentElement.scrollTop = scrollY
    }
  }, [active])
}

/**
 * Benar bila pengguna meminta gerak dikurangi. Dipakai `Confetti`.
 *
 * `matchMedia` ikut diperiksa, bukan hanya `window`: jsdom dan sebagian webview
 * lama punya `window` tanpa `matchMedia`, dan memanggilnya di sana melempar
 * — sebuah perayaan kecil tidak boleh menjatuhkan halaman yang memuatnya.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
