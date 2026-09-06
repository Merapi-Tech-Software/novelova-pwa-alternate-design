import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { PrivacySettings } from '@/api/contracts'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Chip'
import { CharCounter, Input, TextArea } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Switch } from '@/components/ui/Switch'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { VISIBILITY_CATEGORIES } from '@/i18n/content'
import { t } from '@/i18n/t'
import { useSession } from '@/stores/session'
import { usePrivacy, useSavePrivacy, useUpdateProfile } from '../hooks/useSettings'

const LIMIT = { displayName: 50, username: 20, bio: 160, penName: 50, authorBio: 300 }

/**
 * Ubah profil `/profil/ubah` · FR-PROF-07 · FR-PROF-04 · FR-PROF-10.
 *
 * Dua tab — Pembaca dan Penulis — **plus** blok visibilitas publik di bawahnya.
 * Visibilitas ditaruh di sini, bukan di halaman sendiri, karena ia menjawab
 * pertanyaan yang sama dengan tab di atasnya: *"apa yang orang lain lihat
 * tentang saya"*. Memisahkannya berarti pengguna harus tahu lebih dulu bahwa
 * keduanya berhubungan.
 */
export default function EditProfilePage() {
  const navigate = useNavigate()
  const profile = useSession((s) => s.profile)
  const update = useUpdateProfile()
  const privacy = usePrivacy()
  const savePrivacy = useSavePrivacy()
  const toast = useToast()

  const [tab, setTab] = useState<'reader' | 'author'>('reader')
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [bio, setBio] = useState('')
  const [penName, setPenName] = useState(profile?.penName ?? '')
  const [authorBio, setAuthorBio] = useState('')
  const [sentuh, setSentuh] = useState(false)

  const namaKosong = displayName.trim() === ''

  function ubahPrivasi(patch: Partial<PrivacySettings>) {
    if (!privacy.data) return
    savePrivacy.mutate({ ...privacy.data, ...patch })
  }

  return (
    <div className="pb-10">
      <Tabs
        items={[
          { value: 'reader', label: t('settings.tabReader') },
          { value: 'author', label: t('settings.tabAuthor') },
        ]}
        value={tab}
        onChange={(next) => setTab(next as 'reader' | 'author')}
        label={t('settings.editProfile')}
        className="px-4"
      />

      <form
        className="space-y-4 px-4 pt-4"
        onSubmit={(event) => {
          event.preventDefault()
          setSentuh(true)
          if (namaKosong) return

          update.mutate(
            {
              displayName,
              username,
              bio,
              avatarUrl: profile?.avatarUrl ?? null,
              penName,
              authorBio,
            },
            {
              onSuccess: () => {
                toast.show(t('settings.saved'), { tone: 'success' })
                navigate('/profil')
              },
              onError: (error) => {
                toast.show(error instanceof Error ? error.message : t('settings.saveFailed'), {
                  tone: 'danger',
                })
              },
            },
          )
        }}
      >
        {tab === 'reader' ? (
          <>
            <Input
              label={t('settings.displayName')}
              value={displayName}
              maxLength={LIMIT.displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              // **Nama wajib**, dan pesannya baru muncul setelah disentuh:
              // kolom yang merah sebelum pengguna mengetik apa pun terbaca
              // sebagai tuduhan, bukan bantuan.
              {...(sentuh && namaKosong ? { error: t('settings.nameRequired') } : {})}
              counter={<CharCounter value={displayName} max={LIMIT.displayName} />}
            />
            <Input
              label={t('settings.username')}
              value={username}
              maxLength={LIMIT.username}
              onChange={(event) => setUsername(event.target.value)}
              counter={<CharCounter value={username} max={LIMIT.username} />}
            />
            <TextArea
              label={t('settings.bio')}
              value={bio}
              rows={3}
              maxLength={LIMIT.bio}
              onChange={(event) => setBio(event.target.value)}
              counter={<CharCounter value={bio} max={LIMIT.bio} />}
            />
          </>
        ) : (
          <>
            <Input
              label={t('settings.penName')}
              value={penName}
              maxLength={LIMIT.penName}
              onChange={(event) => setPenName(event.target.value)}
              counter={<CharCounter value={penName} max={LIMIT.penName} />}
            />
            <TextArea
              label={t('settings.authorBio')}
              value={authorBio}
              rows={4}
              maxLength={LIMIT.authorBio}
              onChange={(event) => setAuthorBio(event.target.value)}
              counter={<CharCounter value={authorBio} max={LIMIT.authorBio} />}
            />

            {/*
              **Identitas pencairan menuju halaman lokal** · FR-EARN-10. Di
              prototipe tautannya menggantung; rekening dan verifikasinya memang
              hidup di halaman pencairan, dan menyalinnya ke sini berarti dua
              tempat yang bisa berselisih tentang rekening yang sama.
            */}
            <Link
              to="/penulis/penarikan"
              className="nv-tap flex items-center gap-3 rounded-nv-md border border-nv-line-soft px-3 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-body text-nv-text">{t('settings.payoutIdentity')}</span>
                <span className="block pt-0.5 text-caption text-nv-muted">
                  {t('settings.payoutIdentityNote')}
                </span>
              </span>
              <ChevronRight size={16} aria-hidden className="shrink-0 text-nv-muted" />
            </Link>
          </>
        )}

        <Button type="submit" className="w-full" disabled={update.isPending}>
          {t('action.save')}
        </Button>
      </form>

      {/* ── visibilitas publik · FR-PROF-04 · FR-PROF-10 ──────────────────── */}
      <div className="px-4 pt-8">
        <AsyncState
          loading={privacy.isPending}
          error={privacy.error}
          data={privacy.data}
          onRetry={() => void privacy.refetch()}
          empty={{
            title: t('settings.visibilityTitle'),
            description: t('settings.visibilityNote'),
          }}
        >
          {(data) => {
            const semuaPublik = data.readingActivity && data.library && data.reviews
            return (
              <>
                <SectionHeader
                  label={t('settings.visibilityTitle')}
                  className="mb-1"
                  action={
                    <Badge tone={semuaPublik ? 'accent' : 'neutral'}>
                      {semuaPublik ? t('settings.visibilityAll') : t('settings.visibilityCustom')}
                    </Badge>
                  }
                />
                <p className="pb-3 text-caption text-nv-muted">{t('settings.visibilityNote')}</p>

                <ul className="space-y-4">
                  {VISIBILITY_CATEGORIES.map((kategori) => {
                    const key = kategori.key as keyof PrivacySettings
                    const dompet = kategori.key === 'wallet'
                    return (
                      <li key={kategori.key}>
                        <Switch
                          checked={dompet ? false : Boolean(data[key])}
                          disabled={dompet}
                          onChange={(next) =>
                            ubahPrivasi({ [key]: next } as Partial<PrivacySettings>)
                          }
                          label={kategori.title}
                          description={`${kategori.description} · ${kategori.control}`}
                        />
                      </li>
                    )
                  })}
                </ul>

                {/*
                  Dompet bukan preferensi. Sakelarnya **ada tetapi mati** —
                  menghilangkannya sama sekali membuat pengguna mengira ia bisa
                  dinyalakan di suatu tempat lain, dan mencarinya di tempat yang
                  tidak ada.
                */}
                <p className="mt-4 rounded-nv-md bg-nv-paper-2 p-3 text-caption text-nv-text-2">
                  <b className="font-semibold">{t('settings.walletNeverPublic')}</b>{' '}
                  {t('settings.walletNeverPublicBody')}
                </p>
                <p className="pt-2 text-caption text-nv-muted">
                  {t('settings.visibilityServerNote')}
                </p>
              </>
            )
          }}
        </AsyncState>
      </div>
    </div>
  )
}
