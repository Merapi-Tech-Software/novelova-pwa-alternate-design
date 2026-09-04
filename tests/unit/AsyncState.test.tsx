import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/errors'
import { AsyncState } from '@/components/ui/AsyncState'

const EMPTY = {
  title: 'Perpustakaanmu masih kosong',
  description: 'Cerita yang kamu simpan muncul di sini.',
}

describe('AsyncState', () => {
  it('membedakan gagal dari kosong — ini kontraknya, bukan preferensi', () => {
    render(
      <AsyncState
        loading={false}
        error={new ApiError('NETWORK', 'Bagian ini tidak bisa dimuat')}
        data={undefined}
        onRetry={() => {}}
        empty={EMPTY}
      >
        {() => <p>tidak seharusnya terender</p>}
      </AsyncState>,
    )

    expect(screen.getByText('Bagian ini tidak bisa dimuat')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
    // FR-CORE-03: "tidak ada hasil" saat jaringan putus adalah kebohongan.
    expect(screen.queryByText(EMPTY.title)).not.toBeInTheDocument()
  })

  it('merender keadaan kosong tanpa tombol coba lagi', () => {
    render(
      <AsyncState
        loading={false}
        error={null}
        data={[] as string[]}
        isEmpty={(d) => d.length === 0}
        empty={EMPTY}
      >
        {() => <p>tidak seharusnya terender</p>}
      </AsyncState>,
    )

    expect(screen.getByText(EMPTY.title)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument()
  })

  it('tidak menawarkan coba lagi untuk kegagalan yang permanen', () => {
    render(
      <AsyncState
        loading={false}
        error={new ApiError('VALIDATION', 'Nama pena wajib diisi')}
        data={undefined}
        onRetry={() => {}}
        empty={EMPTY}
      >
        {() => null}
      </AsyncState>,
    )

    expect(screen.getByText('Nama pena wajib diisi')).toBeInTheDocument()
    // Mengulang permintaan yang pasti ditolak hanya menunda pesan yang sama.
    expect(screen.queryByRole('button', { name: /Coba/ })).not.toBeInTheDocument()
  })

  it('merender kerangka saat memuat, bukan keadaan kosong', () => {
    const { container } = render(
      <AsyncState loading error={null} data={undefined} empty={EMPTY}>
        {() => null}
      </AsyncState>,
    )

    expect(screen.queryByText(EMPTY.title)).not.toBeInTheDocument()
    expect(container.querySelector('[aria-hidden]')).toBeTruthy()
  })

  it('merender data saat berhasil', () => {
    render(
      <AsyncState
        loading={false}
        error={null}
        data={['Cinta di Balik Kontrak']}
        isEmpty={(d) => d.length === 0}
        empty={EMPTY}
      >
        {(stories) => <p>{stories[0]}</p>}
      </AsyncState>,
    )

    expect(screen.getByText('Cinta di Balik Kontrak')).toBeInTheDocument()
  })
})
