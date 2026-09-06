import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { DATA_MAP, TERMS, USER_RIGHTS } from '@/i18n/content'
import { t } from '@/i18n/t'

/**
 * Halaman legal · FR-HELP-03.
 *
 * **Satu komponen, dua rute.** Ketentuan dan Privasi punya anatomi yang persis
 * sama — daftar pasal berjudul — dan menulisnya dua kali berarti dua tempat yang
 * bisa menyimpang pada perubahan gaya pertama.
 *
 * Judul halaman tidak ditulis di sini: `TopBarLayout` sudah merender `<h1>` dan
 * tombol kembali. Tombol itu **bertingkat** — legal dibuka dari bantuan, dan
 * dari profil, dan dari pendaftaran; `fallback` di tabel rute yang menentukan ke
 * mana ia pulang saat dibuka lewat tautan langsung.
 */
export default function LegalPage({ kind }: { kind: 'terms' | 'privacy' }) {
  return (
    <div className="px-4 pb-10">
      <p className="pb-4 text-caption text-nv-muted">{t('settings.lastUpdated')}</p>

      {kind === 'terms' ? (
        <ol className="space-y-5">
          {TERMS.map((pasal, i) => (
            <li key={pasal.title}>
              <h2 className="font-display text-card font-semibold text-nv-text">
                {i + 1}. {pasal.title}
              </h2>
              <p className="pt-1.5 text-body text-nv-text-2 leading-relaxed">{pasal.body}</p>
            </li>
          ))}
        </ol>
      ) : (
        <>
          <SectionHeader label={t('settings.dataMapTitle')} className="mb-3" />
          <ul className="space-y-4">
            {DATA_MAP.map((baris) => (
              <li key={baris.title}>
                <h2 className="font-display text-card font-semibold text-nv-text">{baris.title}</h2>
                <p className="pt-1 text-body text-nv-text-2 leading-relaxed">{baris.body}</p>
              </li>
            ))}
          </ul>

          {/*
            **Hak yang menautkan ke alurnya.** Kebijakan privasi yang menjanjikan
            hak tanpa memberi jalannya adalah janji kosong — jadi tiap hak di
            sini adalah tautan ke halaman yang benar-benar menjalankannya.
          */}
          <SectionHeader label={t('settings.rightsTitle')} className="mt-8 mb-1" />
          <ul className="divide-y divide-nv-line">
            {USER_RIGHTS.map((hak) => (
              <li key={hak.title}>
                <Link to={hak.to} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-body text-nv-text">{hak.title}</span>
                    <span className="block pt-0.5 text-caption text-nv-muted">
                      {hak.description}
                    </span>
                  </span>
                  <ChevronRight size={16} aria-hidden className="shrink-0 text-nv-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
