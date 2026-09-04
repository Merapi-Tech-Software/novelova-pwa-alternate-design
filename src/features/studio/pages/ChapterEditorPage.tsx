import { useQuery } from '@tanstack/react-query'
import { Bold, Italic, Maximize2, MoreHorizontal, Quote } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '@/api/client'
import type { ChapterLangDraft, ScheduleChapterInput } from '@/api/contracts'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, Skeleton } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Input, TextArea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { todayLocalISO } from '@/lib/date'
import { formatDateTime, formatRelative } from '@/lib/format'
import {
  chapterDraftKey,
  clearChapterDraft,
  countWords,
  hasEnglish,
  readChapterDraft,
} from '../chapterDraft'
import { DraftFailureNotice } from '../components/DraftFailureNotice'
import { usePublishChapter, useScheduleChapter } from '../hooks/useAuthorChapters'
import { useChapterAutosave } from '../hooks/useChapterAutosave'

const EMPTY_LANG: ChapterLangDraft = { title: '', body: '', authorNote: '' }

export default function ChapterEditorPage({ mode }: { mode: 'baru' | 'ubah' }) {
  const { storyId, chapterId } = useParams()

  const draft = useQuery({
    queryKey: ['chapter-draft', chapterId],
    queryFn: () => api.getChapterDraft(chapterId as string),
    enabled: mode === 'ubah' && chapterId !== undefined,
  })

  const story = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => api.getStory(storyId as string),
    enabled: mode === 'baru' && storyId !== undefined,
  })

  if (mode === 'ubah' && !draft.data) return <Skeleton lines={10} className="m-4" />
  if (mode === 'baru' && !story.data) return <Skeleton lines={10} className="m-4" />

  return (
    <EditorBody
      mode={mode}
      storyId={storyId ?? ''}
      initialChapterId={draft.data?.chapterId ?? null}
      storyTitle={draft.data?.storyTitle ?? story.data?.title ?? ''}
      serverUpdatedAt={draft.data?.updatedAt ?? null}
      initialId={draft.data?.id ?? EMPTY_LANG}
      initialEn={draft.data?.en ?? EMPTY_LANG}
    />
  )
}

interface EditorBodyProps {
  mode: 'baru' | 'ubah'
  storyId: string
  initialChapterId: string | null
  storyTitle: string
  serverUpdatedAt: string | null
  initialId: ChapterLangDraft
  initialEn: ChapterLangDraft
}

/**
 * Editor bab · FR-STUDIO-19..22 · FR-STUDIO-34 · FR-STUDIO-35.
 *
 * Autosave dibangun **lebih dulu**, sebelum fitur editor mana pun — ini layar
 * dengan risiko kehilangan data terbesar di aplikasi, dan setiap fitur lain di
 * sini tidak ada artinya kalau naskahnya bisa hilang.
 */
function EditorBody({
  mode,
  storyId,
  initialChapterId,
  storyTitle,
  serverUpdatedAt,
  initialId,
  initialEn,
}: EditorBodyProps) {
  const navigate = useNavigate()
  const toast = useToast()

  const [chapterId, setChapterId] = useState(initialChapterId)
  const [id, setId] = useState(initialId)
  const [en, setEn] = useState(initialEn)
  const [lang, setLang] = useState<'id' | 'en'>('id')
  const [enOpen, setEnOpen] = useState(hasEnglish(initialEn))
  const [focus, setFocus] = useState(false)
  const [error, setError] = useState('')
  const [sheet, setSheet] = useState<'menu' | 'note' | 'schedule' | 'choose' | 'confirm' | null>(
    null,
  )

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const publish = usePublishChapter()

  const autosave = useChapterAutosave({
    chapterId,
    storyId,
    id,
    en,
    onChapterId: setChapterId,
  })

  /**
   * Draf lokal yang **lebih baru dari versi server** · FR-STUDIO-34.
   *
   * Dibaca sekali saat editor dibuka. Kalau server sudah lebih baru, tidak ada
   * yang ditawarkan — menawarkan memulihkan naskah lama adalah cara menawarkan
   * penulis untuk menimpa karyanya sendiri.
   */
  const [recovery, setRecovery] = useState(() => {
    const local = readChapterDraft(chapterDraftKey(initialChapterId, storyId))
    if (!local) return null
    if (serverUpdatedAt && Date.parse(local.savedAt) <= Date.parse(serverUpdatedAt)) return null
    return local
  })

  function patchId(next: Partial<ChapterLangDraft>) {
    setId((current) => ({ ...current, ...next }))
    autosave.touch()
    setError('')
  }

  function patchEn(next: Partial<ChapterLangDraft>) {
    setEn((current) => ({ ...current, ...next }))
    autosave.touch()
    setError('')
  }

  const active = lang === 'id' ? id : en
  const words = { id: countWords(id.body), en: countWords(en.body) }
  const englishExists = hasEnglish(en)

  /** Empat aturan, berurutan, berhenti di yang pertama gagal · FR-STUDIO-21. */
  function validate(): string | null {
    if (id.title.trim() === '') return t('chapterEditor.vTitleId')
    if (id.body.trim() === '') return t('chapterEditor.vBodyId')
    // Aturan 3 dan 4 saling melengkapi: versi English harus **lengkap atau
    // tidak ada** — separuh versi lebih buruk daripada tidak ada versi.
    if (en.title.trim() !== '' && en.body.trim() === '') return t('chapterEditor.vEnBody')
    if (en.body.trim() !== '' && en.title.trim() === '') return t('chapterEditor.vEnTitle')
    return null
  }

  async function onPublishPressed() {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    if (mode === 'ubah') {
      await autosave.saveNow()
      toast.show(t('chapterEditor.savedEdit'), { tone: 'success' })
      return
    }
    setSheet('choose')
  }

  async function doPublish() {
    await autosave.saveNow()
    const saved = chapterId
    if (saved) await publish.mutateAsync(saved)
    setSheet(null)
    toast.show(t('chapterEditor.published'), { tone: 'success' })
    navigate(`/karya/${storyId}/bab`)
  }

  /**
   * Bilah alat pemformatan yang **berfungsi**, lewat markdown pada `textarea`.
   *
   * Bukan `contenteditable` + `execCommand`: yang terakhir sudah usang, dan
   * hasilnya HTML — sementara naskah bab disimpan sebagai **paragraf teks**
   * (`ChapterContent.body`). Markdown menjaga apa yang diketik tetap sama dengan
   * apa yang disimpan, dan tetap terbaca kalau bilah alatnya tidak dipakai.
   */
  function wrap(before: string, after = before) {
    const area = bodyRef.current
    if (!area) return
    const { selectionStart: start, selectionEnd: end, value } = area
    const next = `${value.slice(0, start)}${before}${value.slice(start, end)}${after}${value.slice(end)}`
    if (lang === 'id') patchId({ body: next })
    else patchEn({ body: next })
    queueMicrotask(() => {
      area.focus()
      area.setSelectionRange(start + before.length, end + before.length)
    })
  }

  const saveLabel =
    autosave.state === 'saving'
      ? t('chapterEditor.saving')
      : autosave.state === 'failed'
        ? t('chapterEditor.saveFailed')
        : autosave.savedAt
          ? t('chapterEditor.savedAt')(formatRelative(autosave.savedAt))
          : t('chapterEditor.saveIdle')

  return (
    <div className={cx('mx-auto w-full max-w-3xl px-4 pt-4 pb-10', focus && 'max-w-2xl')}>
      {/* Tanpa `<h1>` dan tombol kembali sendiri — `TopBarLayout` sudah
          merendernya. Yang tersisa di sini justru yang tidak diketahui bilah
          atas: cerita induknya (FR-STUDIO-35) dan menu editornya. */}
      <header className={cx('flex items-center gap-3', focus && 'hidden')}>
        <p className="min-w-0 flex-1 truncate text-body text-nv-muted">
          {t('chapterEditor.forStory')(storyTitle)}
        </p>
        <IconButton label={t('chapterEditor.menu')} size="sm" onClick={() => setSheet('menu')}>
          <MoreHorizontal size={18} />
        </IconButton>
      </header>

      {recovery && (
        <Card className="mt-4 p-3.5">
          <p className="text-body text-nv-text">
            {t('chapterEditor.draftFound')(formatDateTime(new Date(recovery.savedAt)))}
          </p>
          <p className="pt-0.5 text-caption text-nv-muted">
            {t('chapterEditor.draftAhead')(
              Math.floor(
                (Date.parse(recovery.savedAt) - Date.parse(serverUpdatedAt ?? recovery.savedAt)) /
                  60_000,
              ),
            )}
          </p>
          <div className="flex flex-wrap gap-2 pt-2.5">
            <Button
              size="sm"
              onClick={() => {
                setId({ ...EMPTY_LANG, ...recovery.id })
                setEn({ ...EMPTY_LANG, ...recovery.en })
                setEnOpen(hasEnglish({ ...EMPTY_LANG, ...recovery.en }))
                setRecovery(null)
                toast.show(t('chapterEditor.draftRestored'))
              }}
            >
              {t('chapterEditor.draftRestore')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearChapterDraft(chapterDraftKey(chapterId, storyId))
                setRecovery(null)
              }}
            >
              {t('chapterEditor.draftDiscard')}
            </Button>
          </div>
        </Card>
      )}

      {autosave.exhausted && (
        <div className="pt-4">
          <DraftFailureNotice id={id} en={en} onSaveNow={() => void autosave.saveNow()} />
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-4 mt-4 flex flex-wrap items-center gap-2 border-nv-line border-b bg-nv-bg/95 px-4 py-2 backdrop-blur">
        <IconButton label={t('chapterEditor.bold')} size="sm" onClick={() => wrap('**')}>
          <Bold size={16} />
        </IconButton>
        <IconButton label={t('chapterEditor.italic')} size="sm" onClick={() => wrap('*')}>
          <Italic size={16} />
        </IconButton>
        <IconButton label={t('chapterEditor.quote')} size="sm" onClick={() => wrap('\n> ', '')}>
          <Quote size={16} />
        </IconButton>
        <IconButton label={t('chapterEditor.paragraph')} size="sm" onClick={() => wrap('\n\n', '')}>
          <span aria-hidden className="text-caption font-bold">
            ¶
          </span>
        </IconButton>

        {/* Bilah alat menampilkan hitungan **bahasa aktif saja** (FR-STUDIO-20). */}
        <span className="text-caption text-nv-muted tabular-nums">
          {lang === 'id'
            ? t('chapterEditor.words')(words.id)
            : t('chapterEditor.wordsEn')(words.en)}
        </span>

        <span
          className={cx(
            'ml-auto text-caption tabular-nums',
            autosave.state === 'failed' ? 'text-nv-danger' : 'text-nv-muted',
          )}
        >
          {saveLabel}
        </span>

        <IconButton
          label={t('chapterEditor.focus')}
          size="sm"
          onClick={() => setFocus((on) => !on)}
        >
          <Maximize2 size={16} />
        </IconButton>
      </div>

      <p className="pt-2 text-caption text-nv-muted tabular-nums">
        {englishExists
          ? t('chapterEditor.countBoth')(words.id, words.en)
          : t('chapterEditor.countId')(words.id)}
      </p>

      <Tabs
        className="pt-3"
        label={t('chapterEditor.menu')}
        value={lang}
        onChange={(next) => setLang(next)}
        items={[
          { value: 'id', label: t('chapterEditor.tabId') },
          {
            value: 'en',
            label: englishExists ? `${t('chapterEditor.tabEn')} ●` : t('chapterEditor.tabEn'),
          },
        ]}
      />

      {lang === 'en' && !enOpen ? (
        <Card className="mt-4 p-4">
          <h2 className="font-semibold text-body text-nv-text">
            {t('chapterEditor.enInviteTitle')}
          </h2>
          <p className="pt-1 text-caption text-nv-muted">{t('chapterEditor.enInviteBody')}</p>
          <div className="flex flex-wrap gap-2 pt-3">
            <Button size="sm" onClick={() => setEnOpen(true)}>
              {t('chapterEditor.enStart')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLang('id')}>
              {t('chapterEditor.enSkip')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 pt-4">
          <Input
            label={lang === 'id' ? t('chapterEditor.fTitleId') : t('chapterEditor.fTitleEn')}
            value={active.title}
            maxLength={100}
            counter={`${active.title.length}/100`}
            error={error}
            onChange={(e) =>
              lang === 'id'
                ? patchId({ title: e.target.value })
                : patchEn({ title: e.target.value })
            }
          />
          <TextArea
            ref={bodyRef}
            label={lang === 'id' ? t('chapterEditor.fBodyId') : t('chapterEditor.fBodyEn')}
            value={active.body}
            rows={focus ? 22 : 14}
            placeholder={t('chapterEditor.bodyPlaceholder')}
            // Mengetuk area konten mematikan mode fokus, jadi penulis tidak
            // pernah terjebak di dalamnya (FR-STUDIO-20).
            onClick={() => setFocus(false)}
            onChange={(e) =>
              lang === 'id' ? patchId({ body: e.target.value }) : patchEn({ body: e.target.value })
            }
          />
        </div>
      )}

      <div className={cx('flex flex-wrap gap-2 pt-6', focus && 'hidden')}>
        <Button onClick={() => void onPublishPressed()}>
          {englishExists ? t('chapterEditor.publishWithEn') : t('chapterEditor.publish')}
        </Button>
        <Button variant="secondary" onClick={() => void autosave.saveNow()}>
          {t('chapterEditor.saveDraft')}
        </Button>
      </div>

      {sheet === 'menu' && (
        <Sheet open onClose={() => setSheet(null)} title={t('chapterEditor.menu')}>
          <p className="text-caption text-nv-muted tabular-nums">
            {englishExists
              ? t('chapterEditor.countBoth')(words.id, words.en)
              : t('chapterEditor.countId')(words.id)}
          </p>
          <ul className="pt-3">
            {[
              { id: 'schedule' as const, label: t('chapterEditor.mSchedule'), sub: '' },
              {
                id: 'note' as const,
                label: t('chapterEditor.mNote'),
                sub: t('chapterEditor.mNoteSub')(
                  id.authorNote.trim() === ''
                    ? t('chapterEditor.empty')
                    : t('chapterEditor.filled'),
                  en.authorNote.trim() === ''
                    ? t('chapterEditor.empty')
                    : t('chapterEditor.filled'),
                ),
              },
            ].map((item) => (
              <li key={item.id} className="border-nv-line border-b last:border-0">
                <button
                  type="button"
                  // Membuka satu lembar dari lembar lain selalu menutup asalnya
                  // lebih dulu (FR-STUDIO-22) — di sini otomatis, karena hanya
                  // ada satu keadaan `sheet`.
                  onClick={() => setSheet(item.id)}
                  className="block w-full py-3 text-left"
                >
                  <span className="block text-body text-nv-text">{item.label}</span>
                  {item.sub && <span className="block text-caption text-nv-muted">{item.sub}</span>}
                </button>
              </li>
            ))}
            <li className="border-nv-line border-b last:border-0">
              <Link
                to={`/cerita/${storyId}/bab/${chapterId ?? ''}`}
                onClick={() => setSheet(null)}
                className="block py-3 text-body text-nv-text"
              >
                {t('chapterEditor.mPreviewId')}
              </Link>
            </li>
          </ul>
        </Sheet>
      )}

      {sheet === 'note' && (
        <Sheet open onClose={() => setSheet(null)} title={t('chapterEditor.noteTitle')}>
          <p className="text-caption text-nv-muted">{t('chapterEditor.noteBody')}</p>
          <Tabs
            className="pt-3"
            label={t('chapterEditor.noteTitle')}
            value={lang}
            onChange={(next) => setLang(next)}
            items={[
              { value: 'id', label: t('chapterEditor.tabId') },
              { value: 'en', label: t('chapterEditor.tabEn') },
            ]}
          />
          <TextArea
            label={t('chapterEditor.noteTitle')}
            className="mt-3"
            rows={5}
            value={active.authorNote}
            placeholder={t('chapterEditor.notePlaceholder')}
            onChange={(e) =>
              lang === 'id'
                ? patchId({ authorNote: e.target.value })
                : patchEn({ authorNote: e.target.value })
            }
          />
        </Sheet>
      )}

      {sheet === 'schedule' && chapterId && (
        <ChapterScheduleFromEditor
          chapterId={chapterId}
          onClose={() => setSheet(null)}
          onDone={(at) => {
            setSheet(null)
            toast.show(t('chapterEditor.scheduled')(at), { tone: 'success' })
          }}
        />
      )}

      {sheet === 'choose' && (
        <Sheet
          open
          onClose={() => setSheet(null)}
          title={t('chapterEditor.sheetChoose')}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  void autosave.saveNow()
                  setSheet(null)
                  toast.show(t('chapterEditor.savedDraft'))
                }}
              >
                {t('chapterEditor.saveDraft')}
              </Button>
              <Button
                onClick={() => {
                  // Versi English ada → terbit ID+EN langsung. Tidak ada →
                  // konfirmasi dulu, karena itu keputusan yang tidak bisa
                  // ditarik setelah pembaca melihatnya.
                  if (englishExists) void doPublish()
                  else setSheet('confirm')
                }}
              >
                {t('chapterEditor.publish')}
              </Button>
            </>
          }
        >
          <p className="text-body text-nv-muted">{t('chapterEditor.sheetChooseBody')}</p>
        </Sheet>
      )}

      {sheet === 'confirm' && (
        <Sheet
          open
          onClose={() => setSheet(null)}
          title={t('chapterEditor.confirmNoEn')}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setSheet(null)
                  setLang('en')
                  setEnOpen(true)
                }}
              >
                {t('chapterEditor.addEnFirst')}
              </Button>
              <Button onClick={() => void doPublish()}>{t('chapterEditor.publishIdOnly')}</Button>
            </>
          }
        >
          <p className="text-body text-nv-muted">{t('chapterEditor.confirmNoEnBody')}</p>
        </Sheet>
      )}
    </div>
  )
}

/**
 * Jadwal terbit dari **dalam** editor · FR-STUDIO-22.
 *
 * Memakai penjadwal bab yang sama dengan halaman kelola bab — komponennya
 * berbeda karena kepalanya berbeda (saran waktu terbaik), tetapi mutasinya satu,
 * sehingga aturan "waktu lewat ditolak" tidak punya dua versi.
 */
function ChapterScheduleFromEditor({
  chapterId,
  onClose,
  onDone,
}: {
  chapterId: string
  onClose: () => void
  onDone: (at: string) => void
}) {
  const schedule = useScheduleChapter()
  const today = todayLocalISO()
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('19:00')
  const [cadence, setCadence] = useState<ScheduleChapterInput['cadence']>('once')

  /** Senin berikutnya pukul 19.00 — saran yang bisa langsung dipakai. */
  function useSuggestion() {
    const at = new Date()
    const daysToMonday = (8 - at.getDay()) % 7 || 7
    at.setDate(at.getDate() + daysToMonday)
    setDate(todayLocalISO(at))
    setTime('19:00')
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('chapterEditor.schedTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button
            disabled={schedule.isPending || date < today}
            onClick={async () => {
              const saved = await schedule.mutateAsync({ chapterId, date, time, cadence })
              onDone(
                saved.publishAt ? formatDateTime(new Date(saved.publishAt)) : `${date} ${time}`,
              )
            }}
          >
            {t('chapterEditor.schedSave')}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption text-nv-muted">{t('chapterEditor.schedSuggestion')}</p>
        <Button variant="secondary" size="sm" onClick={useSuggestion}>
          {t('chapterEditor.schedUseSuggestion')}
        </Button>
      </div>

      <Input
        label={t('chapterEditor.schedDate')}
        type="date"
        className="mt-3"
        value={date}
        min={today}
        onChange={(e) => setDate(e.target.value)}
      />
      <Input
        label={t('chapterEditor.schedTime')}
        type="time"
        className="mt-3"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />

      <p className="pt-4 font-semibold text-body text-nv-text">{t('chapterEditor.schedRepeat')}</p>
      <div className="flex flex-wrap gap-2 pt-2">
        {(
          [
            ['once', t('chapterEditor.schedNone')],
            ['every-3-days', t('chapterEditor.sched3Days')],
            ['weekly', t('chapterEditor.schedWeekly')],
          ] as const
        ).map(([value, label]) => (
          <Chip key={value} selected={cadence === value} onClick={() => setCadence(value)}>
            {label}
          </Chip>
        ))}
      </div>
    </Sheet>
  )
}
