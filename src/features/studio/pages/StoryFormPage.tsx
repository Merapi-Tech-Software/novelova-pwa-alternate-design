import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '@/api/client'
import type { ContentLabel, Genre, Story, StoryForm } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { DangerZone } from '@/components/patterns/DangerZone'
import { Button } from '@/components/ui/Button'
import { Card, Skeleton } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Input, Select, TextArea } from '@/components/ui/Field'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { formatDateTime } from '@/lib/format'
import { STORY_SYNOPSIS_MAX, STORY_SYNOPSIS_MIN, STORY_TITLE_MAX } from '@/lib/limits'
import { CoverField } from '../components/CoverField'
import { TagField } from '../components/TagField'
import {
  clearStoryDraft,
  type FormMode,
  readStoryDraft,
  type StoryDraft,
  writeStoryDraft,
} from '../storyDraft'

/**
 * Kosakata genre dari **kanvas**, bukan PRD (arch §1.5): kanvas memakai
 * Thriller dan konsisten di lima layar lain; daftar PRD memotret prototipe lama.
 */
const GENRES: Genre[] = ['Romance', 'Mystery', 'Fantasy', 'Drama', 'Thriller']
const LANGUAGES = ['Indonesia', 'English', 'Malay'] as const
const AUDIENCES = ['Remaja', 'Semua Umur', 'Dewasa 18+'] as const
const EXTRA_GENRES_MAX = 2

const LABELS: Array<{ id: ContentLabel; label: string }> = [
  { id: 'kekerasan', label: t('storyForm.lKekerasan') },
  { id: 'bahasa-kasar', label: t('storyForm.lBahasaKasar') },
  { id: 'sensitif', label: t('storyForm.lSensitif') },
  { id: 'spoiler-berat', label: t('storyForm.lSpoiler') },
]

const EMPTY: StoryForm = {
  title: '',
  synopsis: '',
  penName: '',
  coverUrl: null,
  genre: 'Romance',
  extraGenres: [],
  tags: [],
  audience: 'Remaja',
  language: 'Indonesia',
  monetizeType: 'free',
  fullAccessCoins: null,
  visibility: 'public',
  status: 'ongoing',
  commentsEnabled: true,
  moderateComments: false,
  allowTranslation: false,
  allowFanfiction: false,
  contentLabels: [],
  dedication: '',
  authorNote: '',
}

function formOf(story: Story): StoryForm {
  const [genre, ...extra] = story.genres
  return {
    title: story.title,
    synopsis: story.synopsis,
    penName: story.penName,
    coverUrl: story.coverUrl,
    genre: genre ?? 'Romance',
    extraGenres: extra.slice(0, EXTRA_GENRES_MAX),
    tags: story.tags,
    audience: story.audience,
    language: story.language,
    monetizeType: story.monetizeType,
    fullAccessCoins: story.fullAccessCoins,
    visibility: story.visibility,
    status: story.status,
    commentsEnabled: story.commentsEnabled,
    moderateComments: story.moderateComments,
    allowTranslation: story.allowTranslation,
    allowFanfiction: story.allowFanfiction,
    contentLabels: story.contentLabels,
    dedication: story.dedication,
    authorNote: story.authorNote,
  }
}

/**
 * Formulir cerita · FR-STUDIO-12..18 · FR-STUDIO-35 · arch §1.5.
 *
 * **Satu layar, dua mode.** Bukan dua halaman kembar: PRD sendiri menyebut
 * keduanya *"berbagi struktur, gaya, dan sebagian besar logika"*, dan tiga hal
 * saja yang berbeda — peringatan monetisasi yang **terbalik**, zona bahaya yang
 * hanya ada saat menyunting, dan kotak sukses yang hanya muncul setelah cerita
 * baru dibuat.
 */
export default function StoryFormPage({ mode }: { mode: FormMode }) {
  const { storyId } = useParams()

  const existing = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => api.getStory(storyId as string),
    enabled: mode === 'sunting' && storyId !== undefined,
  })

  // Formulir menunggu ceritanya turun: nilai awalnya dibaca sekali oleh
  // `useState`, dan merender lebih dulu berarti sepuluh kolom kosong yang
  // sekejap kemudian terisi — persis cacat yang sama dengan halaman pendaftaran.
  if (mode === 'sunting' && !existing.data) return <Skeleton lines={10} className="m-4" />

  return (
    <FormBody
      mode={mode}
      storyId={storyId ?? null}
      initial={existing.data ? formOf(existing.data) : EMPTY}
      chapterCount={existing.data?.stats.chapterCount ?? 0}
      readers={existing.data?.stats.readers ?? 0}
      buyers={existing.data?.stats.unlockCount ?? 0}
    />
  )
}

interface FormBodyProps {
  mode: FormMode
  storyId: string | null
  initial: StoryForm
  chapterCount: number
  readers: number
  buyers: number
}

function FormBody({ mode, storyId, initial, chapterCount, readers, buyers }: FormBodyProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<StoryForm>(initial)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [failed, setFailed] = useState(false)
  const [created, setCreated] = useState<Story | null>(null)
  const [draft, setDraft] = useState<StoryDraft | null>(() => readStoryDraft(mode, storyId))

  /**
   * Satu jalur untuk setiap perubahan · FR-STUDIO-12 `markDirty`.
   *
   * Tiga efek sekaligus: menandai kotor, mengaktifkan **kedua** tombol simpan,
   * dan menulis draf ke penyimpanan lokal — **beserta isinya**, sejak ketikan
   * pertama.
   */
  function patch(next: Partial<StoryForm>) {
    setForm((current) => {
      const merged = { ...current, ...next }
      writeStoryDraft(mode, merged, storyId)
      return merged
    })
    setDirty(true)
    setError('')
  }

  const save = useMutation({
    mutationFn: (payload: StoryForm) =>
      mode === 'baru' ? api.createStory(payload) : api.updateStory(storyId as string, payload),
    onSuccess: (story) => {
      // Simpan berhasil: draf dibuang, formulir kembali bersih, dan kedua
      // tombol simpan nonaktif lagi.
      clearStoryDraft(mode)
      setDirty(false)
      setFailed(false)
      void queryClient.invalidateQueries({ queryKey: ['studio'] })
      void queryClient.invalidateQueries({ queryKey: ['story', storyId] })

      if (mode === 'baru') setCreated(story)
      else toast.show(t('storyForm.savedEdit'), { tone: 'success' })
    },
    onError: (err) => {
      // **Formulir tidak dikosongkan** (arch §1.5). Menghukum penulis atas
      // kegagalan jaringan dengan menghapus tulisannya adalah cara tercepat
      // kehilangan penulis.
      setFailed(true)
      setError(isApiError(err) ? err.message : t('failure.genericTitle'))
    },
  })

  const remove = useMutation({
    mutationFn: () => api.deleteStory(storyId as string),
    onSuccess: () => {
      clearStoryDraft(mode)
      toast.show(t('storyForm.deleted'))
      navigate('/karya')
    },
    onError: (err) =>
      toast.show(isApiError(err) ? err.message : t('failure.genericTitle'), { tone: 'danger' }),
  })

  /** Validasi **berurutan**, berhenti di kesalahan pertama · FR-STUDIO-16. */
  function firstError(): { field: 'title' | 'synopsis' | 'penName'; message: string } | null {
    if (form.title.trim() === '') {
      return { field: 'title', message: 'Judul story tidak boleh kosong' }
    }
    if (form.synopsis.trim().length < STORY_SYNOPSIS_MIN) {
      return { field: 'synopsis', message: `Sinopsis minimal ${STORY_SYNOPSIS_MIN} karakter` }
    }
    if (form.penName.trim() === '') {
      return { field: 'penName', message: 'Nama pena tidak boleh kosong' }
    }
    return null
  }

  const [errorField, setErrorField] = useState<'title' | 'synopsis' | 'penName' | null>(null)

  function submit() {
    const problem = firstError()
    setErrorField(problem?.field ?? null)
    if (problem) {
      // Inline, bukan satu spanduk di atas: satu kolom yang salah tidak
      // menandai sembilan kolom lain (arch §1.5).
      setError(problem.message)
      return
    }
    save.mutate(form)
  }

  function cancel() {
    if (dirty && !window.confirm(t('storyForm.cancelConfirm'))) return
    navigate('/karya')
  }

  /**
   * Efek ketiga `markDirty` · FR-STUDIO-12: **kolom yang berubah ditandai
   * sendiri.** Pada formulir lima section, "ada yang berubah" saja tidak cukup
   * — penulis perlu melihat *mana* sebelum menekan Simpan.
   *
   * Dibandingkan terhadap nilai awal, bukan disimpan sebagai bendera: mengetik
   * lalu menghapusnya lagi berarti tidak ada yang berubah, dan penanda yang
   * tersisa di situ berbohong.
   */
  const changed = (field: keyof StoryForm) =>
    form[field] !== initial[field] ? 'border-nv-accent' : ''

  const synopsisLength = form.synopsis.trim().length
  const saveLabel = save.isPending
    ? t('storyForm.saving')
    : failed
      ? t('storyForm.saveRetry')
      : t('storyForm.save')

  const SaveButton = ({ block = false }: { block?: boolean }) => (
    <Button block={block} disabled={!dirty || save.isPending} onClick={submit}>
      {saveLabel}
    </Button>
  )

  if (created) {
    // Kotak sukses · FR-STUDIO-35. Tiga pilihan **berurutan**, bukan sejajar:
    // yang paling wajar setelah membuat cerita adalah menulis babnya.
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-10">
        <Card className="p-5 text-center">
          <h1 className="font-display text-title font-bold text-nv-success">
            {t('storyForm.successTitle')}
          </h1>
          <p className="pt-2 text-body text-nv-muted">
            {t('storyForm.successBody')(created.title)}
          </p>

          <div className="grid grid-cols-1 gap-2 pt-5">
            <Link
              to={`/karya/${created.id}/bab/baru`}
              className="inline-flex h-11 items-center justify-center rounded-nv-pill bg-nv-accent font-semibold text-body text-nv-card"
            >
              {t('storyForm.successWriteFirst')}
            </Link>
            {/* Pilihan kedua menuju **jadwal terpadu**, bukan kelola bab:
                ritme rilis ditentukan sebelum bab menumpuk (arch §1.5). */}
            <Link
              to="/karya/jadwal"
              className="inline-flex h-11 items-center justify-center rounded-nv-pill border border-nv-line font-semibold text-body text-nv-text"
            >
              {t('storyForm.successSchedule')}
            </Link>
            <Link to="/karya" className="pt-1 text-body text-nv-accent underline">
              {t('storyForm.successBackToStudio')}
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10">
      {/* Tanpa `<h1>` sendiri — `TopBarLayout` sudah merendernya. */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 text-body text-nv-muted">
          {mode === 'baru' ? t('storyForm.subtitleNew') : t('storyForm.subtitleEdit')}
        </p>
        {/* Dua tombol simpan, atas dan bawah — formulir ini panjang, dan
            menggulir ke dasar hanya untuk menyimpan adalah pajak yang tidak
            perlu (FR-STUDIO-12). */}
        <SaveButton />
      </header>

      {draft && (
        <Card className="mt-4 p-3.5">
          <p className="text-body text-nv-text">
            {t('storyForm.draftFound')(formatDateTime(new Date(draft.savedAt)))}
          </p>
          <div className="flex flex-wrap gap-2 pt-2.5">
            <Button
              size="sm"
              onClick={() => {
                // Ditumpuk **di atas nilai awal**, bukan menggantikannya: draf
                // yang ditulis versi lama aplikasi bisa kehilangan kolom yang
                // sejak itu ditambahkan, dan formulir yang menerimanya mentah
                // akan pecah pada kolom pertama yang hilang.
                setForm({ ...initial, ...draft.form })
                setDirty(true)
                setDraft(null)
                toast.show(t('storyForm.draftRestored'))
              }}
            >
              {t('storyForm.draftRestore')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearStoryDraft(mode)
                setDraft(null)
              }}
            >
              {t('storyForm.draftDiscard')}
            </Button>
          </div>
        </Card>
      )}

      <Section title={t('storyForm.secBasic')}>
        <CoverField
          value={form.coverUrl}
          onChange={(coverUrl) => patch({ coverUrl })}
          placeholder={mode === 'baru' ? t('storyForm.coverUpload') : t('storyForm.coverDefault')}
        />

        <Input
          label={t('storyForm.fTitle')}
          value={form.title}
          maxLength={STORY_TITLE_MAX}
          counter={`${form.title.length}/${STORY_TITLE_MAX}`}
          error={errorField === 'title' ? error : ''}
          className={changed('title')}
          onChange={(e) => patch({ title: e.target.value })}
        />

        <TextArea
          label={t('storyForm.fSynopsis')}
          value={form.synopsis}
          rows={5}
          maxLength={STORY_SYNOPSIS_MAX}
          counter={`${form.synopsis.length}/${STORY_SYNOPSIS_MAX}`}
          // Penghitung berubah **saat mengetik**, jadi kekurangannya terlihat
          // tanpa harus menekan Simpan lebih dulu.
          hint={
            synopsisLength < STORY_SYNOPSIS_MIN
              ? t('storyForm.fSynopsisShort')(synopsisLength, STORY_SYNOPSIS_MIN)
              : t('storyForm.fSynopsisHint')(STORY_SYNOPSIS_MIN)
          }
          error={errorField === 'synopsis' ? error : ''}
          className={changed('synopsis')}
          onChange={(e) => patch({ synopsis: e.target.value })}
        />

        <div>
          <p className="font-semibold text-caption text-nv-muted">
            {t('storyForm.previewSynopsis')}
          </p>
          <p className="pt-1 text-body text-nv-text">
            {form.synopsis.trim() === '' ? t('storyForm.synopsisEmpty') : form.synopsis}
          </p>
        </div>

        <Input
          label={t('storyForm.fPenName')}
          value={form.penName}
          error={errorField === 'penName' ? error : ''}
          className={changed('penName')}
          onChange={(e) => patch({ penName: e.target.value })}
        />
      </Section>

      <Section title={t('storyForm.secCategory')}>
        <Select
          label={t('storyForm.fGenre')}
          value={form.genre}
          options={GENRES.map((g) => ({ value: g, label: g }))}
          onChange={(e) => patch({ genre: e.target.value as Genre })}
        />
        <Select
          label={t('storyForm.fLanguage')}
          value={form.language}
          options={LANGUAGES.map((l) => ({ value: l, label: l }))}
          onChange={(e) => patch({ language: e.target.value as StoryForm['language'] })}
        />

        <fieldset className="border-0">
          <legend className="font-semibold text-body text-nv-text">
            {t('storyForm.fExtraGenres')(EXTRA_GENRES_MAX)}
          </legend>
          <div className="flex flex-wrap gap-2 pt-2">
            {GENRES.filter((g) => g !== form.genre).map((genre) => {
              const on = form.extraGenres.includes(genre)
              return (
                <Chip
                  key={genre}
                  selected={on}
                  onClick={() => {
                    // Batas ditegakkan **sebelum** menyalakan: chip ketiga
                    // diabaikan, tetapi mematikan yang sudah menyala tetap
                    // boleh — jadi penulis tidak pernah terkunci.
                    if (on) patch({ extraGenres: form.extraGenres.filter((g) => g !== genre) })
                    else if (form.extraGenres.length < EXTRA_GENRES_MAX)
                      patch({ extraGenres: [...form.extraGenres, genre] })
                  }}
                >
                  {genre}
                </Chip>
              )
            })}
          </div>
        </fieldset>

        <TagField value={form.tags} onChange={(tags) => patch({ tags })} />

        <Select
          label={t('storyForm.fAudience')}
          value={form.audience}
          options={AUDIENCES.map((a) => ({ value: a, label: a }))}
          onChange={(e) => patch({ audience: e.target.value as StoryForm['audience'] })}
        />
      </Section>

      <Section title={t('storyForm.secStatus')}>
        {mode === 'sunting' && (
          <fieldset className="border-0">
            <legend className="font-semibold text-body text-nv-text">
              {t('storyForm.fStatus')}
            </legend>
            <div className="flex flex-wrap gap-2 pt-2">
              {(
                [
                  ['ongoing', t('storyForm.stOngoing')],
                  ['completed', t('storyForm.stCompleted')],
                  ['hiatus', t('storyForm.stHiatus')],
                ] as const
              ).map(([value, label]) => (
                <Chip
                  key={value}
                  selected={form.status === value}
                  onClick={() => {
                    // Konfirmasi dievaluasi **sebelum** lencananya berubah —
                    // prototipe melakukannya sesudah, sehingga membatalkan tetap
                    // meninggalkan status "Tamat" (PRD 07 §7).
                    if (value === 'completed' && !window.confirm(t('storyForm.completedConfirm')))
                      return
                    patch({ status: value })
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
            {form.status === 'hiatus' && (
              <p className="pt-2 text-caption text-nv-muted">{t('storyForm.hiatusPanel')}</p>
            )}
          </fieldset>
        )}

        <fieldset className="border-0">
          <legend className="font-semibold text-body text-nv-text">
            {t('storyForm.fVisibility')}
          </legend>
          <div className="flex flex-wrap gap-2 pt-2">
            {(
              [
                ['public', t('storyForm.visPublic')],
                ['unlisted', t('storyForm.visUnlisted')],
                ['private', t('storyForm.visPrivate')],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                selected={form.visibility === value}
                onClick={() => patch({ visibility: value })}
              >
                {label}
              </Chip>
            ))}
          </div>
          {form.visibility === 'private' && (
            <p className="pt-2 text-caption text-nv-warning">{t('storyForm.privateWarning')}</p>
          )}
        </fieldset>

        <Switch
          checked={form.commentsEnabled}
          onChange={(commentsEnabled) => patch({ commentsEnabled })}
          label={t('storyForm.fComments')}
        />
        <Switch
          checked={form.moderateComments}
          onChange={(moderateComments) => patch({ moderateComments })}
          label={t('storyForm.fModerate')}
        />
      </Section>

      <Section title={t('storyForm.secMonetize')}>
        <Select
          label={t('storyForm.fMonetize')}
          value={form.monetizeType}
          options={[
            { value: 'free', label: t('storyForm.mFree') },
            { value: 'partial', label: t('storyForm.mPartial') },
            { value: 'premium', label: t('storyForm.mPremium') },
          ]}
          onChange={(e) => patch({ monetizeType: e.target.value as StoryForm['monetizeType'] })}
        />

        {form.monetizeType === 'premium' && (
          <Input
            label={t('storyForm.fFullAccess')}
            type="number"
            min={0}
            value={String(form.fullAccessCoins ?? '')}
            onChange={(e) =>
              patch({ fullAccessCoins: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        )}

        {/*
          Peringatan **terbalik** antara kedua mode (arch §1.5).

          Mode `baru` memperingatkan saat tipenya bukan gratis: pembaca akan
          menemui bab terkunci. Mode `sunting` memperingatkan justru saat memilih
          gratis — dan akibatnya dihitung dari data cerita ini, bukan kalimat
          umum: berapa bab ikut terbuka, dan berapa pembeli yang tidak mendapat
          refund.
        */}
        {mode === 'baru' && form.monetizeType !== 'free' && (
          <p className="rounded-nv-lg bg-nv-warning-bg p-3.5 text-caption text-nv-text">
            {t('storyForm.warnLockNew')}
          </p>
        )}
        {mode === 'sunting' && form.monetizeType === 'free' && (
          <p className="rounded-nv-lg bg-nv-warning-bg p-3.5 text-caption text-nv-text">
            {t('storyForm.warnFreeEdit')(chapterCount, buyers)}
          </p>
        )}
      </Section>

      <Section title={t('storyForm.secAdvanced')}>
        <Switch
          checked={form.allowTranslation}
          onChange={(allowTranslation) => patch({ allowTranslation })}
          label={t('storyForm.fTranslation')}
        />
        <Switch
          checked={form.allowFanfiction}
          onChange={(allowFanfiction) => patch({ allowFanfiction })}
          label={t('storyForm.fFanfiction')}
        />

        <fieldset className="border-0">
          <legend className="font-semibold text-body text-nv-text">{t('storyForm.fLabels')}</legend>
          <div className="flex flex-wrap gap-2 pt-2">
            {LABELS.map((label) => (
              <Chip
                key={label.id}
                selected={form.contentLabels.includes(label.id)}
                onClick={() =>
                  patch({
                    contentLabels: form.contentLabels.includes(label.id)
                      ? form.contentLabels.filter((x) => x !== label.id)
                      : [...form.contentLabels, label.id],
                  })
                }
              >
                {label.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <Input
          label={t('storyForm.fDedication')}
          value={form.dedication}
          maxLength={300}
          counter={`${form.dedication.length}/300`}
          className={changed('dedication')}
          onChange={(e) => patch({ dedication: e.target.value })}
        />
        <TextArea
          label={t('storyForm.fAuthorNote')}
          value={form.authorNote}
          rows={3}
          maxLength={STORY_SYNOPSIS_MAX}
          counter={`${form.authorNote.length}/${STORY_SYNOPSIS_MAX}`}
          className={changed('authorNote')}
          onChange={(e) => patch({ authorNote: e.target.value })}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-2 pt-6">
        <SaveButton />
        <Button variant="ghost" onClick={cancel}>
          {t('storyForm.cancel')}
        </Button>
      </div>

      {/* Zona bahaya **hanya** di mode sunting: tidak ada yang bisa diarsipkan
          atau dihapus dari cerita yang belum ada. */}
      {mode === 'sunting' && storyId && (
        <div className="pt-8">
          <DangerZone
            title={t('storyForm.dangerTitle')}
            confirmPhrase={form.title}
            actions={[
              {
                id: 'archive',
                label: t('storyForm.dangerArchive'),
                consequence: t('storyForm.dangerArchiveWhy')(chapterCount, readers),
                onConfirm: () => {
                  patch({ visibility: 'private' })
                  save.mutate({ ...form, visibility: 'private' })
                  toast.show(t('storyForm.archived'))
                },
              },
              {
                id: 'complete',
                label: t('storyForm.dangerComplete'),
                consequence: t('storyForm.dangerCompleteWhy')(chapterCount),
                onConfirm: () => {
                  patch({ status: 'completed' })
                  save.mutate({ ...form, status: 'completed' })
                  toast.show(t('storyForm.completed'))
                },
              },
              {
                id: 'delete',
                label: t('storyForm.dangerDelete'),
                consequence: t('storyForm.dangerDeleteWhy')(chapterCount, readers),
                onConfirm: () => remove.mutate(),
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}

/** Satu section formulir — judul, lalu kolomnya berjarak seragam. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-6">
      <h2 className="font-display text-section font-bold text-nv-text">{title}</h2>
      <div className="grid grid-cols-1 gap-4 pt-3">{children}</div>
    </section>
  )
}
