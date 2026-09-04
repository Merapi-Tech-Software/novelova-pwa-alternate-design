import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'
import { Modal } from '../ui/Modal'

export interface DangerAction {
  id: string
  label: string
  /** Akibatnya, dengan angka nyata: *"120 bab dan 985rb pembaca dihapus permanen"*. */
  consequence: string
  onConfirm: () => void
}

export interface DangerZoneProps {
  /** Teks yang harus diketik ulang persis — biasanya judul cerita. */
  confirmPhrase: string
  actions: readonly DangerAction[]
  title?: string
}

/**
 * Kelompok aksi tak-terbalikkan di dasar formulir (kanvas layar 38, arch §1.5).
 *
 * **Satu pola konfirmasi untuk semuanya**: ketik ulang judul persis sama.
 * FR-STUDIO-18 hanya mensyaratkannya untuk hapus permanen, tetapi memakai satu
 * pola untuk ketiganya lebih murah daripada memelihara dua — dan mengarsipkan
 * cerita dengan 985rb pembaca juga bukan hal yang pantas terjadi karena salah
 * ketuk.
 */
export function DangerZone({ confirmPhrase, actions, title = 'Zona bahaya' }: DangerZoneProps) {
  const [pending, setPending] = useState<DangerAction | null>(null)
  const [typed, setTyped] = useState('')

  const matches = typed.trim() === confirmPhrase.trim()

  const close = () => {
    setPending(null)
    setTyped('')
  }

  return (
    <section className="rounded-nv-lg border border-nv-danger/40 bg-nv-danger-bg/30 p-4">
      <h2 className="font-display text-section font-bold text-nv-danger">{title}</h2>
      <p className="mt-1 text-caption text-nv-muted">
        Tindakan di bawah tidak bisa dibatalkan. Masing-masing minta kamu mengetik ulang judulnya.
      </p>

      <ul className="mt-3 space-y-2">
        {actions.map((action) => (
          <li
            key={action.id}
            className="flex items-center gap-3 rounded-nv-md border border-nv-line bg-nv-card px-3.5 py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold">{action.label}</span>
              <span className="block text-caption text-nv-muted">{action.consequence}</span>
            </span>
            <Button variant="danger" size="sm" onClick={() => setPending(action)}>
              Lanjutkan
            </Button>
          </li>
        ))}
      </ul>

      <Modal
        open={pending !== null}
        onClose={close}
        title={pending?.label ?? ''}
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={!matches}
              onClick={() => {
                pending?.onConfirm()
                close()
              }}
            >
              {pending?.label}
            </Button>
          </>
        }
      >
        <p className="text-body text-nv-muted">{pending?.consequence}</p>
        <div className="pt-3">
          <Input
            label={`Ketik ulang judulnya untuk melanjutkan`}
            hint={confirmPhrase}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
        </div>
        {typed.length > 0 && !matches && (
          <p className="mt-1.5 text-caption text-nv-muted">
            Belum sama persis. Konfirmasi dibatalkan bila tidak cocok.
          </p>
        )}
      </Modal>
    </section>
  )
}
