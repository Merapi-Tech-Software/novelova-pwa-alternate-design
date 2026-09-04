import { useCallback, useEffect, useRef, useState } from 'react'

/** Siklus kecepatan yang ditetapkan FR-READ-11. */
const RATES = [1, 1.25, 1.5] as const

/**
 * Pembacaan suara · FR-READ-11.
 *
 * Memakai `speechSynthesis` bawaan peramban — tidak ada berkas audio, tidak ada
 * permintaan jaringan, dan tidak ada dependensi baru. Suaranya dipilih dari
 * `id-ID` bila ada; kalau tidak ada, peramban memakai suara bawaannya dan
 * teksnya tetap terbaca.
 *
 * **Hanya kalimat dari bab yang terbuka** yang pernah masuk ke sini: pemanggil
 * mengirim isi bab, dan bab terkunci tidak punya isi untuk dikirim.
 */
export function useTts(sentences: string[]) {
  const [speaking, setSpeaking] = useState(false)
  const [rateIndex, setRateIndex] = useState(0)
  const [current, setCurrent] = useState(-1)
  const cancelled = useRef(false)

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const rate = RATES[rateIndex] ?? 1

  const stop = useCallback(() => {
    if (!supported) return
    cancelled.current = true
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setCurrent(-1)
  }, [supported])

  // Pindah bab menghentikan suara dan indikator kalimatnya (FR-READ-15).
  useEffect(() => {
    stop()
    return stop
  }, [stop])

  const speak = useCallback(() => {
    if (!supported || sentences.length === 0) return

    cancelled.current = false
    setSpeaking(true)

    const voice =
      window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('id')) ?? null

    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence)
      utterance.lang = 'id-ID'
      utterance.rate = rate
      if (voice) utterance.voice = voice
      utterance.onstart = () => setCurrent(index)
      utterance.onend = () => {
        if (index === sentences.length - 1 && !cancelled.current) {
          setSpeaking(false)
          setCurrent(-1)
        }
      }
      window.speechSynthesis.speak(utterance)
    })
  }, [sentences, rate, supported])

  /** Kecepatan berputar 1× → 1,25× → 1,5× → 1×, dan bacaan dimulai ulang. */
  const cycleRate = useCallback(() => {
    setRateIndex((i) => (i + 1) % RATES.length)
    if (speaking) {
      stop()
      // Peramban perlu satu tick untuk benar-benar melepas antreannya.
      setTimeout(() => setSpeaking(false), 0)
    }
  }, [speaking, stop])

  return { supported, speaking, rate, current, speak, stop, cycleRate }
}
