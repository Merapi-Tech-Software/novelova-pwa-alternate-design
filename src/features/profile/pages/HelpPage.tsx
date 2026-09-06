import { ChevronRight, Mail, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, SearchInput, TextArea } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useToast } from '@/components/ui/Toast'
import { FAQS, HELP_CATEGORIES } from '@/i18n/content'
import { t } from '@/i18n/t'

/**
 * Pusat bantuan `/bantuan` · FR-HELP-01 · FR-HELP-02.
 *
 * **Pencariannya nyata**: ia menyaring kategori dan FAQ yang benar-benar ada,
 * bukan kotak yang tidak melakukan apa pun. Dan setiap kategori menautkan ke
 * **halaman nyata di aplikasi** (FR-CORE-05) — riwayat cetak, riwayat transaksi,
 * pengaturan keamanan — bukan artikel buntu yang harus ditulis belakangan.
 */
export default function HelpPage() {
  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const toast = useToast()

  const cari = q.trim().toLowerCase()

  const kategori = useMemo(
    () =>
      cari === ''
        ? HELP_CATEGORIES
        : HELP_CATEGORIES.filter(
            (k) =>
              k.title.toLowerCase().includes(cari) || k.description.toLowerCase().includes(cari),
          ),
    [cari],
  )

  const faq = useMemo(
    () =>
      cari === ''
        ? FAQS
        : FAQS.filter((f) => f.q.toLowerCase().includes(cari) || f.a.toLowerCase().includes(cari)),
    [cari],
  )

  const kosong = kategori.length === 0 && faq.length === 0

  return (
    <div className="px-4 pb-10">
      <SearchInput
        value={q}
        onChange={setQ}
        label={t('settings.helpSearch')}
        placeholder={t('settings.helpSearch')}
      />

      {kosong ? (
        <EmptyState
          variant="no-results"
          className="mt-6"
          title={t('settings.helpNoResults')}
          description={t('settings.helpNoResultsBody')}
          action={{ label: t('action.clearFilters'), onClick: () => setQ('') }}
        />
      ) : (
        <>
          {kategori.length > 0 && (
            <>
              <SectionHeader label={t('settings.helpCategories')} className="mt-6 mb-1" />
              <ul className="divide-y divide-nv-line">
                {kategori.map((k) => (
                  <li key={k.title}>
                    <Link to={k.to} className="flex items-center gap-3 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-body text-nv-text">{k.title}</span>
                        <span className="block pt-0.5 text-caption text-nv-muted">
                          {k.description}
                        </span>
                      </span>
                      <ChevronRight size={16} aria-hidden className="shrink-0 text-nv-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {faq.length > 0 && (
            <>
              <SectionHeader label={t('settings.helpFaq')} className="mt-8 mb-1" />
              <ul className="divide-y divide-nv-line">
                {faq.map((f) => (
                  <li key={f.q}>
                    {/* `<details>` bawaan peramban: buka-tutupnya, keyboard, dan
                        pembaca layarnya sudah benar tanpa satu baris JavaScript. */}
                    <details className="group py-3">
                      <summary className="nv-tap flex cursor-pointer list-none items-center gap-3 text-body text-nv-text marker:hidden">
                        <span className="min-w-0 flex-1">{f.q}</span>
                        <ChevronRight
                          size={16}
                          aria-hidden
                          className="shrink-0 text-nv-muted transition group-open:rotate-90"
                        />
                      </summary>
                      <p className="pt-2 text-body text-nv-text-2 leading-relaxed">{f.a}</p>
                    </details>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* ── tiket dukungan · FR-HELP-02 ───────────────────────────────────── */}
      <SectionHeader label={t('settings.ticketTitle')} className="mt-8 mb-3" />
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          toast.show(t('settings.ticketSent'), { tone: 'success' })
          setSubject('')
          setBody('')
        }}
      >
        <Input
          label={t('settings.ticketSubject')}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
        />
        <TextArea
          label={t('settings.ticketBody')}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
        />
        <Button type="submit" disabled={subject.trim() === '' || body.trim() === ''}>
          {t('settings.ticketSend')}
        </Button>
      </form>

      <SectionHeader label={t('settings.contactTitle')} className="mt-8 mb-1" />
      <ul className="divide-y divide-nv-line">
        <li>
          <a href="mailto:halo@novelova.id" className="flex items-center gap-3 py-3">
            <Mail size={17} aria-hidden className="shrink-0 text-nv-muted" />
            <span className="min-w-0 flex-1 text-body text-nv-text">
              {t('settings.contactEmail')}
            </span>
            <span className="shrink-0 text-caption text-nv-muted">halo@novelova.id</span>
          </a>
        </li>
        <li>
          <a href="https://wa.me/6281234567890" className="flex items-center gap-3 py-3">
            <MessageCircle size={17} aria-hidden className="shrink-0 text-nv-muted" />
            <span className="min-w-0 flex-1 text-body text-nv-text">
              {t('settings.contactWhatsApp')}
            </span>
            <span className="shrink-0 text-caption text-nv-muted">+62 812-3456-7890</span>
          </a>
        </li>
      </ul>
    </div>
  )
}
