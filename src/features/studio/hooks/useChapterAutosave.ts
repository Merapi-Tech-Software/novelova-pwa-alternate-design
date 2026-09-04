import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api/client'
import type { ChapterDraftInput, ChapterLangDraft } from '@/api/contracts'
import { chapterDraftKey, clearChapterDraft, writeChapterDraft } from '../chapterDraft'

/** Lokal: sekali per 3 detik setelah ketikan berhenti (FR-STUDIO-34). */
const LOCAL_MS = 3_000
/** Server: sekali per 30 detik, dan sekali lagi saat halaman ditinggalkan. */
const SERVER_MS = 30_000
/** Empat kegagalan berturut-turut memunculkan `DRAFT-409` (arch §1.4). */
export const FAIL_THRESHOLD = 4

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

export interface AutosaveArgs {
  chapterId: string | null
  storyId: string
  id: ChapterLangDraft
  en: ChapterLangDraft
  /** Bab baru mendapat id-nya dari penyimpanan pertama. */
  onChapterId: (id: string) => void
}

/**
 * Autosave dua lapis · FR-STUDIO-34.
 *
 * Lapis lokal menulis cepat dan sering karena murah; lapis server menulis
 * jarang karena mahal, **dan sekali lagi saat halaman ditinggalkan** — momen
 * yang paling sering menghilangkan tulisan.
 *
 * Kegagalan server **tidak pernah menghentikan lapis lokal**. Justru sebaliknya:
 * saat server bermasalah, satu-satunya salinan naskah ada di perangkat, dan itu
 * yang harus terus diperbarui.
 */
export function useChapterAutosave({ chapterId, storyId, id, en, onChapterId }: AutosaveArgs) {
  const [state, setState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [failures, setFailures] = useState(0)
  const [dirty, setDirty] = useState(false)

  // Ref, bukan state: timer autosave berjalan di luar render dan harus melihat
  // naskah terbaru tanpa memasang ulang dirinya pada tiap ketikan.
  const latest = useRef({ chapterId, storyId, id, en })
  latest.current = { chapterId, storyId, id, en }

  const save = useMutation({
    mutationFn: (input: ChapterDraftInput) => api.saveChapterDraft(input),
  })

  const toServer = useCallback(async () => {
    const current = latest.current
    setState('saving')
    try {
      const saved = await save.mutateAsync({
        chapterId: current.chapterId,
        storyId: current.storyId,
        id: current.id,
        en: current.en,
      })
      if (!current.chapterId) onChapterId(saved.chapterId)

      // Draf lokal dibuang **hanya** setelah server memastikan naskahnya ada.
      clearChapterDraft(chapterDraftKey(current.chapterId, current.storyId))
      setState('saved')
      setSavedAt(new Date())
      setFailures(0)
      setDirty(false)
    } catch {
      setState('failed')
      setFailures((n) => n + 1)
    }
  }, [save, onChapterId])

  /** Dipanggil tiap ketikan; jadwal lokal dan server berjalan sendiri-sendiri. */
  const touch = useCallback(() => setDirty(true), [])

  // `id` dan `en` memang dependensi, dan bukan karena dibaca di dalam efeknya:
  // keduanya ada supaya timer **dipasang ulang pada tiap ketikan**. Itulah arti
  // "tiga detik setelah ketikan berhenti" — tanpa keduanya, simpanan lokal
  // terjadi tiga detik setelah ketikan **pertama** lalu tidak pernah lagi.
  // biome-ignore lint/correctness/useExhaustiveDependencies: lihat catatan di atas
  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => {
      const current = latest.current
      writeChapterDraft(chapterDraftKey(current.chapterId, current.storyId), {
        id: current.id,
        en: current.en,
        storyId: current.storyId,
      })
    }, LOCAL_MS)
    return () => window.clearTimeout(timer)
  }, [dirty, id, en])

  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => void toServer(), SERVER_MS)
    return () => window.clearTimeout(timer)
  }, [dirty, toServer])

  useEffect(() => {
    // `pagehide`, bukan `beforeunload`: yang kedua tidak pernah menyala di
    // peramban ponsel saat tab ditutup dari daftar aplikasi.
    const flush = () => {
      if (!dirty) return
      const current = latest.current
      writeChapterDraft(chapterDraftKey(current.chapterId, current.storyId), {
        id: current.id,
        en: current.en,
        storyId: current.storyId,
      })
      void toServer()
    }
    const confirmLeave = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
    }

    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', confirmLeave)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', confirmLeave)
    }
  }, [dirty, toServer])

  return {
    state,
    savedAt,
    failures,
    dirty,
    touch,
    saveNow: toServer,
    /** Ambang `DRAFT-409` tercapai — sisipan tampil, editor **tetap hidup**. */
    exhausted: failures >= FAIL_THRESHOLD,
  }
}
