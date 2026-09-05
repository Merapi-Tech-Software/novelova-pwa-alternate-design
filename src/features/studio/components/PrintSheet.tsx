import { useState } from 'react'
import type { PrintOrder, PrintOrderInput, StudioStory } from '@/api/contracts'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Input, Select } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { t } from '@/i18n/t'
import { formatRupiah } from '@/lib/format'

const SIZES = [
  { value: 'A5', label: 'A5' },
  { value: 'A4', label: 'A4' },
  { value: 'Pocket Book', label: 'Pocket Book' },
]
const COVERS = [
  { value: 'Soft Cover', label: 'Soft Cover' },
  { value: 'Hard Cover', label: 'Hard Cover' },
]
const PAPERS = [
  { value: 'HVS 80gr', label: 'HVS 80gr' },
  { value: 'HVS 70gr', label: 'HVS 70gr' },
  { value: 'Art Paper', label: 'Art Paper' },
]
const BINDINGS = [
  { value: 'Lem', label: 'Lem' },
  { value: 'Spiral', label: 'Spiral' },
  { value: 'Staples', label: 'Staples' },
]

/** Perkiraan per eksemplar; angka finalnya dikonfirmasi tim (FR-STUDIO-05). */
const UNIT_COST = 285_000

export interface PrintSheetProps {
  item: StudioStory | null
  onClose: () => void
  onSubmit: (input: PrintOrderInput) => Promise<PrintOrder>
  submitting: boolean
}

/**
 * Cetak PDF & pesan hardcopy · FR-STUDIO-05.
 *
 * Dua tab dalam satu lembar, karena keduanya menjawab pertanyaan yang sama
 * ("ubah cerita ini jadi sesuatu yang bisa dipegang") dengan hasil yang berbeda.
 * Hanya tersedia untuk cerita **tamat** — memaketkan cerita yang masih berjalan
 * menghasilkan buku yang usang sebelum sampai.
 */
export function PrintSheet({ item, onClose, onSubmit, submitting }: PrintSheetProps) {
  const [tab, setTab] = useState('soft')
  const [size, setSize] = useState('A5')
  const [cover, setCover] = useState('Soft Cover')
  const [paper, setPaper] = useState('HVS 80gr')
  const [binding, setBinding] = useState('Lem')
  const [copies, setCopies] = useState('3')
  const [extras, setExtras] = useState<string[]>(['cover', 'toc', 'watermark'])
  const [ship, setShip] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    note: '',
  })
  const [file, setFile] = useState<PrintOrder | null>(null)

  if (!item) return null

  const copyCount = Math.max(1, Number.parseInt(copies, 10) || 1)
  const shipReady =
    ship.name.trim() !== '' &&
    ship.phone.trim().length >= 6 &&
    ship.address.trim().length >= 10 &&
    ship.city.trim() !== '' &&
    ship.postalCode.trim().length >= 4

  const toggleExtra = (id: string) =>
    setExtras((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('studio.printTitle')}
      footer={
        tab === 'soft' ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t('action.close')}
            </Button>
            <Button
              disabled={submitting}
              onClick={async () => {
                setFile(
                  await onSubmit({
                    storyId: item.story.id,
                    kind: 'soft',
                    spec: `${size} · ${extras.join(' · ')}`,
                    copies: 1,
                    shipping: null,
                  }),
                )
              }}
            >
              {t('studio.generate')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t('action.cancel')}
            </Button>
            <Button
              disabled={submitting || !shipReady}
              onClick={async () => {
                await onSubmit({
                  storyId: item.story.id,
                  kind: 'hard',
                  spec: `${size} · ${cover} · ${paper} · ${binding}`,
                  copies: copyCount,
                  shipping: ship,
                })
                onClose()
              }}
            >
              {t('studio.submitOrder')}
            </Button>
          </>
        )
      }
    >
      <p className="text-caption text-nv-muted">{t('studio.printFor')(item.story.title)}</p>

      <Tabs
        className="pt-3"
        label={t('studio.printTitle')}
        value={tab}
        onChange={setTab}
        items={[
          { value: 'soft', label: t('studio.tabSoft') },
          { value: 'hard', label: t('studio.tabHard') },
        ]}
      />

      {tab === 'soft' ? (
        <div className="pt-4">
          <Select
            label={t('studio.printSize')}
            value={size}
            options={SIZES}
            onChange={(e) => setSize(e.target.value)}
          />
          <p className="pt-3 font-semibold text-caption text-nv-muted">{t('studio.printExtras')}</p>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {[
              { id: 'cover', label: t('studio.extraCover') },
              { id: 'toc', label: t('studio.extraToc') },
              { id: 'watermark', label: t('studio.extraWatermark') },
            ].map((extra) => (
              <Chip
                key={extra.id}
                selected={extras.includes(extra.id)}
                onClick={() => toggleExtra(extra.id)}
              >
                {extra.label}
              </Chip>
            ))}
          </div>

          {file && (
            <div className="mt-4 rounded-nv-lg bg-nv-success-bg p-3.5">
              <p className="font-semibold text-body text-nv-success">
                {t('studio.generated')(file.fileName ?? '', file.fileSize ?? '')}
              </p>
              <p className="pt-1 text-caption text-nv-text">{t('studio.keptDays')}</p>
              <div className="flex flex-wrap gap-2 pt-2.5">
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  {t('studio.download')}
                </Button>
                {/* Tombol bagikan memang ada di sini, bukan disisipkan JavaScript
                    ke dalam markup seperti prototipe — elemen yang lahir di luar
                    render tidak pernah ikut diuji. */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void navigator.clipboard?.writeText(file.fileName ?? '')}
                >
                  {t('studio.share')}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={t('studio.printSize')}
              value={size}
              options={SIZES}
              onChange={(e) => setSize(e.target.value)}
            />
            <Select
              label={t('studio.cover')}
              value={cover}
              options={COVERS}
              onChange={(e) => setCover(e.target.value)}
            />
            <Select
              label={t('studio.paper')}
              value={paper}
              options={PAPERS}
              onChange={(e) => setPaper(e.target.value)}
            />
            <Select
              label={t('studio.binding')}
              value={binding}
              options={BINDINGS}
              onChange={(e) => setBinding(e.target.value)}
            />
            <Input
              label={t('studio.copies')}
              type="number"
              min={1}
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
            />
          </div>

          <div className="grid gap-3 pt-3 sm:grid-cols-2">
            <Input
              label={t('studio.shipName')}
              value={ship.name}
              onChange={(e) => setShip({ ...ship, name: e.target.value })}
            />
            <Input
              label={t('studio.shipPhone')}
              inputMode="tel"
              value={ship.phone}
              onChange={(e) => setShip({ ...ship, phone: e.target.value })}
            />
            <Input
              label={t('studio.shipCity')}
              value={ship.city}
              onChange={(e) => setShip({ ...ship, city: e.target.value })}
            />
            <Input
              label={t('studio.shipPostal')}
              inputMode="numeric"
              value={ship.postalCode}
              onChange={(e) => setShip({ ...ship, postalCode: e.target.value })}
            />
          </div>
          <Input
            label={t('studio.shipAddress')}
            className="mt-3"
            value={ship.address}
            onChange={(e) => setShip({ ...ship, address: e.target.value })}
          />
          <Input
            label={t('studio.shipNote')}
            className="mt-3"
            value={ship.note}
            onChange={(e) => setShip({ ...ship, note: e.target.value })}
          />

          <dl className="mt-4 rounded-nv-lg bg-nv-paper-2 p-3.5">
            <div className="flex items-center justify-between">
              <dt className="text-body text-nv-muted">{t('studio.costEstimate')}</dt>
              <dd className="font-semibold text-body text-nv-text tabular-nums">
                {formatRupiah(UNIT_COST * copyCount)}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-1">
              <dt className="text-body text-nv-muted">{t('studio.eta')}</dt>
              <dd className="text-body text-nv-text">7–10 hari kerja</dd>
            </div>
            <p className="pt-2 text-caption text-nv-muted">{t('studio.costNote')}</p>
          </dl>
        </div>
      )}
    </Sheet>
  )
}
