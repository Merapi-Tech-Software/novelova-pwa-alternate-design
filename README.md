# Novelova

PWA baca novel Indonesia dengan ekonomi koin. Dibangun dari
[`../PRD Novelova/`](../PRD%20Novelova/) (12 modul), dengan rencana kerja di
[`../todo.md`](../todo.md) dan keputusan teknis di
[`../architecture.md`](../architecture.md).

## Menjalankan

```bash
cp .env.example .env      # sekali saja
npm install
npm run dev               # http://localhost:1311
```

| Perintah | Isi |
|---|---|
| `npm run dev` | Vite dev server + HMR. Service worker aktif di dev (`devOptions.enabled`) |
| `npm run build` | Typecheck lalu build produksi ke `dist/` |
| `npm run preview` | Menyajikan hasil build — dipakai untuk menguji PWA sungguhan |
| `npm run check` | Biome (lint + format) + `tsc --noEmit`. Wajib bersih sebelum commit |
| `npm test` | Vitest sekali jalan |
| `npm run e2e` | Playwright — lima alur kritis (`architecture.md` §14) |

## Docker

```bash
docker compose --profile dev  up            # dev + HMR di :1311
docker compose --profile prod up --build    # nginx statis di :8080
```

Variabel `VITE_*` dibaca **saat build**, bukan saat run — nilainya ikut ter-bundel.
Untuk produksi, oper lewat `build.args` di `docker-compose.yml`.

## Stack

Vite 6 · React 19 · TypeScript strict · React Router v7 · TanStack Query v5 ·
Zustand · Zod · React Hook Form · Dexie · Tailwind CSS v4 · vite-plugin-pwa ·
Biome · Vitest · Playwright. **11 dependensi runtime**, tanpa library i18n,
tanggal, grafik, atau UI kit — alasan tiap pilihan ada di `architecture.md` §2.

## Aturan yang tidak boleh dilanggar

Empat aturan struktur (`architecture.md` §3) yang menjaga proyek ini tetap bisa
dipindahkan ke backend nyata tanpa menyentuh UI:

1. **Satu hex warna hanya boleh ditulis di `src/styles/tokens.css`.** Hex di luar
   berkas itu adalah bug.
2. **`features/*` tidak mengimpor dari `features/*` lain.** Yang dipakai bersama
   naik ke `components/patterns/` atau `lib/`.
3. **Hanya `features/*/hooks/` yang memanggil `api/client`.** Komponen tidak
   pernah memanggil API langsung.
4. **`dexie` tidak boleh diimpor di luar `src/api/mock/`** — ditegakkan Biome.
   Dexie adalah *server tiruan*, bukan cache klien.

Dan satu aturan data (FR-CORE-01): **`stores/` tidak menyimpan apa yang dimiliki
pengguna.** Saldo, kepemilikan bab, koleksi, progres, dan naskah hidup di balik
`api/client`. Kalau sesuatu harus ikut saat pengguna berganti perangkat, ia bukan
urusan `stores/`.

## Seam API

`VITE_API_MODE` memilih implementasi:

- `mock` — Dexie/IndexedDB di perangkat ini, data awal dari `novelova-data.js`
- `http` — backend nyata; masih stub yang melempar `NOT_IMPLEMENTED`

Kontraknya sama persis di kedua sisi (Zod, `src/api/contracts/`), jadi berpindah
backend berarti menukar satu folder.

## Status

Lihat [`CHANGELOG.md`](CHANGELOG.md). Saat ini: **Langkah 1 — fondasi proyek.**
