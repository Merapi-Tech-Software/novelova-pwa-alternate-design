import { useParams, useSearchParams } from 'react-router'
import { ChapterComments } from '@/components/patterns/ChapterComments'
import { useChapter } from '@/hooks/useChapter'

/**
 * Komentar bab `/cerita/:storyId/bab/:chapterId/komentar` · FR-SOCIAL-05 ·
 * mockup `7t`.
 *
 * Menggantikan tautan menggantung `chapter_comments_thread_best_ads.html` —
 * tautan kedua dari tiga yang di prototipe menuju fitur yang tidak pernah ada.
 *
 * **Halaman ini tinggal wadah.** Isinya `ChapterComments`, yang juga dirender
 * sebagai lembar di atas ruang baca (`7w`) — brief §8 menuntut keduanya
 * menampilkan isi yang sama, dan satu-satunya cara itu tidak bisa lapuk adalah
 * satu komponen dipakai dua kali.
 *
 * Yang tinggal di sini: **urutan dan jumlah muat hidup di URL**, supaya tombol
 * kembali memulihkan tampilan yang sama dan tautannya bisa dibagikan. Lembar di
 * ruang baca memakai keadaan lokal — ia tidak punya alamat sendiri untuk
 * dibagikan.
 *
 * Dan karena tautannya memang bisa dibagikan, **rujukan babnya ikut dicetak**
 * (`7t`): bilah atas hanya berbunyi "Komentar bab", yang tidak menyebut bab yang
 * mana. Lembar `7w` tidak memerlukannya — di sana babnya sedang terbuka di
 * belakang lembar. Datanya biasanya sudah ada di cache dari ruang baca; yang
 * membayar satu permintaan hanyalah pembuka tautan langsung.
 */
export default function CommentsPage() {
  const { storyId = '', chapterId = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const chapter = useChapter(storyId, chapterId)

  function patch(key: string, value: string) {
    const query = new URLSearchParams(search)
    query.set(key, value)
    setSearch(query, { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10">
      {chapter.data && (
        <p className="truncate pb-3 font-display text-card text-nv-text-2">
          {`Bab ${chapter.data.number} · ${chapter.data.title}`}
        </p>
      )}
      <ChapterComments
        storyId={storyId}
        chapterId={chapterId}
        composerAt="top"
        sort={search.get('urut') ?? 'newest'}
        onSort={(next) => patch('urut', next)}
        pageSize={Number(search.get('muat') ?? 20)}
        onMore={(next) => patch('muat', String(next))}
      />
    </div>
  )
}
