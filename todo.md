# Novelova PWA — Rencana Kerja

> **Dokumen yang berlaku untuk `novelova-v2/`.**
>
> Berisi seluruh keputusan v1 yang **ikut terbawa lewat salinan kodenya**,
> ditambah semua yang khas v2. Requirement-nya di
> [`PRD Novelova/`](PRD%20Novelova/) — salinan v2, bukan yang di akar repo.
>
> Yang di akar (`../todo.md` · `../architecture.md` · `../PRD Novelova/`) milik
> **`novelova/` v1** dan sudah dibersihkan dari segala hal v2. Keduanya tidak
> saling menyalin lagi: v1 berhenti, v2 jalan.
>
> Salinan dari akar repo pada **Langkah 47**, saat `novelova/` dibekukan.
> Sejak itu **hanya berkas ini yang disunting**; yang di akar
> ([`../architecture.md`](../architecture.md) · [`../todo.md`](../todo.md))
> dibiarkan sebagai catatan keadaan v1 dan tidak lagi diperbarui.
>
> Isi Fase 0–15 di bawah menggambarkan pekerjaan yang **sudah selesai di v1 dan
> ikut terbawa ke v2** lewat salinan kodenya. Yang baru untuk v2 ada di
> **Fase R** dan sesudahnya.

> Task breakdown dari nol sampai siap dipakai. Arsitektur & keputusan teknis: [`architecture.md`](architecture.md).
> Referensi requirement: `PRD Novelova/prd_00..12` — **12 modul**. Setiap tugas menyebut FR yang dipenuhinya.
> Acuan visual: `Novelova.dc.html` — **41 layar** · `NovelovaNav.dc.html` — bilah nav · data contoh: `novelova-data.js` (25 koleksi). Cakupannya di §Pembaruan Desain.

**Legenda prioritas:** `P0` inti produk · `P1` penting, ada jalur alternatif · `P2` pelengkap
**Penanda `[BARU]`** = tugas yang lahir dari revisi PRD (requirement bertanda `Status: BARU`).
**Penanda `[DESAIN]`** = tugas yang lahir dari pembaruan desain, **bukan dari PRD** — sebagian besar dari dua seksi keadaan gagal (`architecture.md` §1.4 dan §1.5).
**Penanda `[LUAR]`** = tugas yang muncul saat mengerjakan, tidak ada di rencana awal (mis. Docker, `.env`).
**Penanda `[PRODUK]`** = permintaan produk yang datang di luar PRD dan kanvas, dan boleh **menimpa** keduanya (lihat Fase 3b).
Tugas tanpa penanda sudah ada di rencana sebelumnya.
**Estimasi** = hari kerja untuk satu developer full-time. Sesuaikan dengan tim Anda.

> **Kemajuan.** Kode hidup di [`novelova/`](../novelova/). Riwayat per permintaan ada di
> [`novelova/CHANGELOG.md`](../novelova/CHANGELOG.md). Kotak `[x]` di bawah berarti
> **sudah ada di repo dan lolos `npm run check` + `npm test`**, bukan sekadar
> direncanakan.
>
> Terakhir: **Langkah 41** — **redesign putaran 7 dimulai**. `novelova-v2/`
> lahir sebagai salinan `novelova/` pada commit `26fdb68`; `npm run check`
> bersih dan **543 test lulus** di salinan sebelum satu baris pun diubah.
> **Fase R** di bawah menjabarkan redesign-nya, dan **Fase 5b diserap ke R4**.
> Keputusan terkunci #1 (palet rose-gold PRD 01) dibatalkan **untuk
> `novelova-v2/` saja** — alasannya `architecture.md` §1.20.
> Berikutnya **R1**: token, tipografi & primitif.
>
> **Dua folder, dua trek.** Fase 0–15 milik `novelova/` (rose-gold, selesai
> sampai Fase 10). Fase R milik `novelova-v2/` (putaran 7). Riwayat per
> permintaan untuk trek baru ada di
> [`novelova-v2/CHANGELOG.md`](CHANGELOG.md).

---

## Perubahan dari Revisi PRD

Revisi menambahkan **2 modul** (`prd_11` pencarian & notifikasi, `prd_12` sosial) dan **56 requirement baru**. Dampaknya pada rencana ini:

| Yang berubah | Sebelum | Sesudah |
|---|---|---|
| Jumlah fase | 13 | **16** |
| Fase baru | — | **4** Pencarian · **10** Sosial · **11** Notifikasi |
| Fase yang dipecah | 3 (Beranda + Pencarian + Lihat-semua) | 3 Beranda & lihat-semua · 4 Pencarian |
| Estimasi total | ~67–89 hari | **~95–124** → **~96–125** setelah pembaruan desain → **~99–129** setelah koreksi Fase 8 |
| Backlog | 15 butir | **10 butir** — enam butir naik jadi requirement |

Enam hal yang tadinya di backlog kini punya fase karena PRD menetapkannya P0/P1: pusat notifikasi · daftar pengikut · riwayat penarikan · ekspor data & hapus akun · lihat-semua Top Romance · halaman ulasan & komentar bab.

Empat requirement lintas-modul (`FR-CORE-01..05`) tidak punya fase sendiri — mereka **tersebar sebagai aturan** ke setiap fase, dan masuk ke Definition of Done di bawah.

---

## Pembaruan Desain

Kanvas sudah diperbarui tiga kali: **13 → 23** layar mengikuti revisi PRD, **23 → 37** pada pembaruan desain, lalu **37 → 41** pada seksi `8a`. Tambahannya tiga kelompok:

- **Klaster akun** (layar 24–31) — profil, ubah profil, profil publik, pengikut, bahasa & wilayah, keamanan, bantuan, legal. Ini persis Fase 13, yang sebelumnya satu-satunya fase tanpa mockup.
- **Keadaan gagal** (layar 32–37) — seksi yang menyatakan dirinya **“di luar PRD”**. Bukan salinan requirement; ini keputusan desain baru. Rinciannya di bawah.
- **Tiga sisa Author Studio** (layar 38–41) — formulir cerita, riwayat cetak, jadwal terpadu, plus satu layar khusus keadaan gagal ketiganya. Ini yang menutup Fase 8.

**Design system tetap sama.** Kanvas masih memakai `_ds/classical-…` (emas `#b68235`, Cormorant Garamond + Lora, radius 2/4/7px). Token-nya identik; berkasnya hanya diekspor ulang. Keputusan lama berlaku: **kanvas untuk struktur, anatomi, dan copy — palet & tipografi dari PRD 01 rose-gold** (`architecture.md` §9.1).

**`NovelovaNav.dc.html` menetapkan isi bilah nav bawah:** lima tab **Beranda · Isi Koin · Pustaka · Karya · Profil**. Sebelumnya rencana ini hanya menyebut “5 tab” tanpa daftarnya (Fase 1).

### Fase mana yang punya mockup

| Fase | Cakupan mockup |
|---|---|
| 1 Design system | ✅ nav bawah kini punya komponennya sendiri |
| 2 Sesi & onboarding | ✅ 4 layar + **3 varian kegagalan sesi** (layar 36) |
| 3 Beranda & lihat-semua | ✅ 2 layar + **sisipan gagal memuat** (layar 32) |
| 4 Pencarian | ✅ 1 layar |
| 5 Detail & ruang baca | ✅ 2 layar + **bab ditarik penulis** (layar 37) |
| 6 Dompet | ✅ 2 layar + **3 varian kegagalan bayar** (layar 34) — detail transaksi belum |
| 7 Perpustakaan | ✅ 1 layar |
| 8 Author Studio | ✅ **7 dari 8** + draf gagal tersimpan (layar 35) + **8 keadaan gagal cetak & jadwal** (layar 41) — hanya onboarding penulis yang belum |
| 9 Penghasilan | ✅ 2 layar — riwayat penarikan belum |
| 10 Sosial | ✅ 2 layar |
| 11 Notifikasi | ✅ 1 layar (preferensi digambar sebagai lembar di dalamnya) |
| 12 Pusat hadiah | ✅ 1 layar |
| 13 Profil & pengaturan | ✅ **8 layar — dari nol jadi lengkap** |
| 14 PWA & push | ✅ **layar tanpa koneksi** (layar 33) |

**Yang tersisa tanpa mockup tinggal tiga rute:** onboarding & verifikasi penulis · detail transaksi · riwayat pencairan. Satu alur pendaftaran dan dua tabel riwayat — polanya sudah ditetapkan layar lain, jadi tidak ada lagi keputusan visual besar yang tertunda.

### Keadaan gagal — pekerjaan baru yang tidak ada di PRD

Seksi `7a` kanvas menambahkan sistem pesan gagal yang tidak diminta requirement mana pun. Alasannya dinyatakan langsung: aplikasi ini memegang **uang** dan **tulisan yang belum tersimpan**, dua hal yang paling ditakutkan hilang. Ini diperlakukan sebagai bagian dari kontrak.

Setiap pesan gagal menjawab tiga hal berurutan: **apa yang terjadi → apakah uang/tulisanmu aman → satu tindakan berikutnya.** Kode teknis selalu ada tapi selalu kecil dan di bawah — untuk dibacakan ke dukungan, bukan untuk dipahami pengguna.

Empat tingkat penyampaian, dipilih dari seberapa banyak yang masih bisa dikerjakan: **Inline** (satu kolom salah) · **Toast** (aksi gagal, halaman utuh) · **Sisipan** (satu bagian gagal) · **Layar penuh** (tidak ada yang bisa dikerjakan). Detail lengkap di `architecture.md` §1.4.

Empat di antaranya menuntut keadaan baru di kode — tugasnya sudah dimasukkan ke fase yang bersangkutan:

| Layar | Yang harus ada | Fase |
|---|---|---|
| 34 Pembayaran belum dipastikan | Status pesanan **`pending_reconciliation`**; tombol bayar dikunci selama itu | 6 |
| 35 Draf gagal tersimpan | Editor **tidak dibekukan** + salin naskah + unduh berkas | 8 |
| 36 Terlalu banyak percobaan masuk | Rate limit 5 percobaan / 15 menit dengan waktu buka kembali | 2 |
| 37 Bab ditarik penulis | **Refund otomatis** ke ledger + langganan pemberitahuan terbit ulang | 5 |

### Tiga layar terakhir — dan dua tabrakan dengan PRD

Seksi `8a` menutup Fase 8. Layar 38 menggabungkan `/karya/baru` dan `/karya/:id/ubah` menjadi **satu layar dua mode**, karena formulir cerita memikul tujuh FR sekaligus dan keduanya berbagi hampir seluruh isinya. Yang berbeda cuma tiga hal, dan ketiganya penting: peringatan monetisasi **terbalik** antara kedua mode, zona bahaya **hanya ada di mode sunting**, dan kotak sukses hanya muncul setelah cerita baru dibuat.

Berbeda dengan tiga tempat di bawah — di mana kanvas hanya lebih ringkas — di sini kanvas **bertentangan** dengan PRD. Putusannya sudah diambil, dan rencana ini memakai putusan itu:

| Hal | Kanvas | PRD | Dipakai |
|---|---|---|---|
| Batas judul · sinopsis | 80 · 1200 | **100 · 1000** | **PRD** |
| Cover rasio meleset | Ditolak | **Diterima + saran**, toleransi ±0,12 | **PRD** |
| Bahasa cerita, pengaturan lanjutan, status & visibilitas | Tidak digambar | Disyaratkan FR-STUDIO-14/15/18 | **PRD** |
| Genre utama | … Thriller | … Horror | **Kanvas** — kosakatanya konsisten di lima layar lain |
| Lini masa pesanan cetak | 4 langkah | **6 tahap** + nomor `#HDC-`/`#SFT-` + invoice | **PRD** |
| PDF gagal · berkas kedaluwarsa · batal sebelum produksi · biaya berubah | Digambar lengkap | Tidak ada | **Kanvas** — pekerjaan baru |

Aturan umumnya: **kanvas menentukan susunan, anatomi, dan copy; PRD menentukan angka dan aturan validasi.** Rinciannya di `architecture.md` §1.5.

**Delapan kode kegagalan baru** dari layar 41, semuanya masuk Fase 8:

| Kode | Tingkat | Fase |
|---|---|---|
| `PRINT-504` PDF gagal dibuat → tawarkan pecah 3 berkas | Sisipan | 8g |
| `PRINT-410` berkas lewat 30 hari → buat ulang gratis | Inline | 8g |
| `PRINT-409` sudah produksi → jalur klaim, bukan batal | Toast | 8g |
| `PRINT-402` biaya berubah → **belum ada yang ditagihkan** | Layar penuh | 8g |
| `SCHED-409` dua bab satu slot → yang kedua ditahan | Sisipan | 8f |
| `SCHED-422` waktu sudah lewat → bab tetap draf | Inline | 8f |
| `SCHED-200` zona waktu berubah → momen terbit tidak bergeser | Toast | 8f |
| `SCHED-000` celah jadwal — **peringatan, bukan kegagalan** | Sisipan | 8f |

Kegagalan formulir cerita seluruhnya **inline**, dan kalau simpan gagal di server **formulir tidak dikosongkan** — aturan yang sama dengan editor bab.

### Tiga tempat mockup lebih ringkas daripada PRD

**PRD yang berlaku.** Jangan berhenti saat tampilan sudah menyerupai kanvas — ketiganya justru bagian dari alur yang terputus:

| Kanvas | PRD | FR · Fase |
|---|---|---|
| Tautan *“Saldo kurang? Isi koin dulu”* | Lembar berisi kekurangan koin yang tepat + saldo + tombol berkonteks + alternatif iklan | FR-READ-17 · Fase 5 |
| Daftar bab tanpa tombol lanjutan | Tombol utama **“Lanjutkan — Bab N”** / **“Mulai dari Bab 1”** | FR-DETAIL-14 · Fase 5 |
| Ruang baca membuka bab dari awal | Tawaran **“Lanjutkan dari posisi terakhir”** | FR-READ-16 · Fase 5 |

### Satu koreksi rute

Ekspor data dan hapus akun sebelumnya direncanakan punya rute sendiri (`/pengaturan/data`). Kanvas menggambarnya sebagai blok **“Data & akun” di dalam layar Keamanan**, dan FR-SET-05 memang menyebut `settings_security` sebagai tempatnya. Rute terpisah dihapus — satu halaman keamanan, bukan dua.

---

## Ringkasan Fase

| Fase | Isi | Est. | Milestone |
|---|---|---|---|
| 0 | Fondasi proyek | 4–5 h | |
| 1 | Design system & komponen inti | 7–9 h | |
| 2 | Sesi, shell & onboarding | 5–6 h | |
| 3 | Beranda & lihat-semua | 6–8 h | |
| 4 | **Pencarian katalog** `[BARU]` | 3–4 h | |
| 5 | Detail cerita & ruang baca | 10–13 h | **M1 — bisa baca** |
| 6 | Dompet: isi koin, transaksi, konteks kembali | 9–11 h | **M2 — loop ekonomi tertutup** |
| 7 | Perpustakaan | 4–5 h | **M3 — loop retensi tertutup** |
| 8 | Author Studio | 20–26 h | |
| 9 | Penghasilan penulis | 4–5 h | **M4 — sisi penulis lengkap** |
| 10 | **Sosial: rating, ulasan, komentar** `[BARU]` | 5–7 h | |
| 11 | **Notifikasi** `[BARU]` | 4–5 h | |
| 12 | Pusat hadiah & voucher terpadu | 4–6 h | |
| 13 | Profil, pengaturan, bantuan, legal | 6–8 h | |
| 14 | Pengerasan PWA & push | 5–7 h | |
| 15 | Persiapan rilis | 3–4 h | **M5 — siap dipakai** |
| | | **~99–129 h** | ≈ 20–26 minggu solo |
| **R** | **Redesign putaran 7** — trek terpisah di `novelova-v2/` `[PRODUK]` | 21–31 h | menyerap Fase 5b |

**Fase R tidak dijumlahkan ke total di atas.** Ia trek terpisah di folder lain, berjalan di atas salinan yang sudah selesai sampai Fase 10 — bukan pekerjaan tambahan pada jalur yang sama. Fase 5b juga tidak dihitung dua kali: mockup `7x`…`7aa` menggambarnya persis, jadi ia dikerjakan di dalam **R4**.

**Perubahan estimasi dari pembaruan desain:** Fase 1 dan 6 masing-masing **+1 hari** untuk sistem keadaan gagal (komponen `FailureNotice` dan tiga varian kegagalan bayar); Fase 13 **−1 hari** karena delapan layarnya kini punya mockup. Selebihnya tidak berubah — layar-layar baru itu sudah dihitung dari teks PRD sejak awal.

**Seksi `8a` tidak menggeser total, tetapi menggeser isi Fase 8.** Formulir cerita (8c) turun **−1 hari** — tujuh FR-nya kini punya mockup lengkap dengan copy kedua modenya, jadi tidak ada lagi yang dirancang dari teks. Riwayat cetak (8g) naik **+1 hari** untuk empat keadaan gagal cetak yang sebelumnya tidak ada di rencana mana pun, termasuk satu alur persetujuan biaya berlayar penuh. Bersih nol — isi Fase 8 yang berubah, bukan panjangnya.

**Koreksi terpisah, bukan dari desain:** kepala Fase 8 tertulis 17–22 hari sementara ketujuh sub-bagiannya berjumlah **20–26**. Selisih tiga sampai empat hari itu salah hitung, bukan asumsi kerja paralel — tidak ada catatan yang menyatakannya. Kepala fase dan total sekarang mengikuti jumlah bagiannya: **~99–129 hari**. Ini satu-satunya fase yang punya sub-estimasi, jadi tidak ada tempat lain yang perlu diperiksa ulang.

### Hubungan dengan urutan yang disarankan PRD

PRD `prd_00` §12 memberi urutannya sendiri dalam 7 tahap. Urutan itu disusun untuk **menambal prototipe yang sudah berjalan** — karena itu ia menaruh loop uang paling depan. Kita membangun dari nol, jadi urutannya bergeser pada satu titik: beranda harus ada sebelum detail cerita punya jalan masuk. Isinya sama, letaknya berbeda.

| Tahap PRD | Isi | Fase di sini |
|---|---|---|
| 1. Fondasi | FR-CORE-01 · FR-AUTH-12 · FR-WALLET-17 | 0, 2, 6 |
| 2. Loop uang | FR-READ-17 · FR-WALLET-18 · FR-WALLET-19 | 5, 6 |
| 3. Loop retensi | FR-DETAIL-13 · FR-LIB-11 · FR-READ-15/16 | 5, 7 |
| 4. Penemuan | FR-SRCH-* · FR-HOME-13/14 | 3, 4 |
| 5. Keamanan pekerjaan penulis | FR-STUDIO-34/33 · FR-EARN-10 | 8, 9 |
| 6. Sosial & notifikasi | prd_12 · FR-NOTIF-* | 10, 11 |
| 7. Sisanya | FR-SET-04/05 · FR-PROF-09 · FR-STUDIO-37 · FR-CORE-04 | 8, 13 |

**Satu pengecualian yang disengaja:** FR-WALLET-17 (dompet tunggal) ada di tahap 1 PRD, tapi di sini dikerjakan di Fase 6. Alasannya — `Wallet` sebagai satu-satunya sumber saldo sudah ditegakkan sejak Fase 0 lewat model data dan seam API; yang tersisa di Fase 6 hanyalah menampilkannya seragam di enam titik. Tidak ada saldo hardcoded yang pernah ditulis, jadi tidak ada yang perlu dibongkar.

---

## Fase 0 — Fondasi Proyek · 4–5 hari

Tanpa fase ini, semua fase lain akan ditulis ulang.

- [x] Scaffold Vite 6 + React 19 + TypeScript strict; hapus boilerplate bawaan
- [x] Pasang dependensi runtime (11): `react-router` · `@tanstack/react-query` · `zustand` · `zod` · `react-hook-form` · `@hookform/resolvers` · `dexie` · `lucide-react` · `@fontsource-variable/manrope` · `@fontsource/cormorant-garamond`
- [x] Pasang dev deps: `vite-plugin-pwa` · `tailwindcss@4` + `@tailwindcss/vite` · `vitest` · `@testing-library/react` · `@playwright/test` · `@biomejs/biome` · `fake-indexeddb`
- [x] Konfigurasi Biome (lint + format) + script `check` di `package.json`
- [x] Path alias `@/` → `src/`; `tsconfig` strict, `noUncheckedIndexedAccess`
- [x] Struktur folder lengkap sesuai `architecture.md` §3 (folder kosong + `.gitkeep`)
- [x] `vite.config.ts` + VitePWA mode `injectManifest`, `devOptions.enabled` untuk uji SW di dev
- [x] `src/lib/coin.ts` — seluruh konstanta produk + `calcPrice()` + `formatCompactCoin()`
- [x] `src/lib/limits.ts` — konstanta revisi PRD (arch §6.3): paginasi, pencarian, progres, autosave, sosial, notifikasi · `[BARU]`
- [x] `src/lib/limits.ts` blok kedua — konstanta keadaan gagal (arch §6.3): `TOAST_MS` · `RETRY_ESCALATE_AT` · `AUTOSAVE_FAIL_ALERT` · `PAY_CONFIRM_TIMEOUT_S` · `PAY_RECONCILE_MIN` · `LOGIN_ATTEMPTS_MAX` · `LOGIN_LOCKOUT_MIN` · `SESSION_IDLE_DAYS` · `[DESAIN]`
- [x] `src/lib/format.ts` — rupiah, angka, tanggal relatif, semua lewat `Intl` `id-ID`
- [x] `src/lib/date.ts` — `todayLocalISO()` dengan koreksi `getTimezoneOffset()` (FR-STUDIO-04, FR-RWD-07)
- [x] `src/lib/similar.ts` — jarak Levenshtein untuk saran ejaan (FR-SRCH-05) · `[BARU]`
- [x] **Test:** unit `coin.ts` — `15300→"15.3rb"`, `12000→"12rb"` (bukan `12.0rb`), `1500000→"1.5jt"`, `800→"800"`, `calcPrice(150)→19500`
- [x] **Test:** unit `date.ts` — `todayLocalISO()` benar di UTC+7 (kasus yang bikin bug tanggal kemarin)
- [x] `src/api/contracts/` — skema Zod untuk `Story`, `Chapter`, `Wallet`, `Transaction`, `User` (arch §6.1)
- [x] `src/api/contracts/` — tambahan `social.ts`, `notification.ts`, `search.ts` (arch §6.1 tabel kedua) · `[BARU]`
- [x] `src/api/client.ts` — antarmuka `NovelovaApi` + pemilihan implementasi lewat `VITE_API_MODE`
- [x] `src/api/errors.ts` — `ApiError { code, message, retryable }`; `retryable` yang membedakan "coba lagi" dari "kosong" (FR-CORE-03) · `[BARU]`
- [x] `ApiError.code` memakai kode yang **sama persis** dengan yang tampil di layar (`PAY-402`, `PAY-504`, `PAY-410`, `AUTH-401`, `AUTH-429`, `APP-426`, `DRAFT-409`, `CONTENT-410`, `PRINT-504`, `PRINT-410`, `PRINT-409`, `PRINT-402`, `SCHED-409`, `SCHED-422`, `SCHED-200`) — supaya yang dibacakan pengguna ke dukungan cocok dengan log · arch §1.4 · `[DESAIN]`
- [x] `src/api/mock/db.ts` — skema Dexie **~33 tabel** (arch §6.1, kedua tabel entitas)
- [x] `src/api/mock/seed.ts` — **salin dari `novelova-data.js`** (25 koleksi, seluruhnya Bahasa Indonesia): 8 cerita · 8 bab berharga 0/1.500/1.800/2.000 · 5 paragraf prosa + 2 pratinjau · 6 paket koin · 4 grup metode bayar · 6 entri perpustakaan · 9 notifikasi 4 jenis · 6 ulasan · 5 komentar · 5 karya penulis · 7 bab penulis
- [x] Seed klaster akun dari 11 koleksi baru: 24 pengguna `FOLLOWERS` (satu bertanda `hidden`) · `FOLLOWING_IDX` 8 · 5 `PROF_ACTIVITY` · 4 `VIS_CATS` · 3 `SESSIONS` (satu `current`, satu `stale`) · 4 `HELP_CATS` + 3 `FAQS` · `LANG_OPTS` 5 daftar · 5 `TERMS` + 4 `DATA_MAP` + 5 `RIGHTS` · `[DESAIN]`
- [x] Seed Author Studio dari 2 koleksi terakhir: 6 `PRINT_JOBS` menutupi **seluruh** keadaan pesanan (PDF selesai · dikirim · produksi · gagal dibuat · menunggu admin · kedaluwarsa) · 6 `UNI_SCHEDULE` (3 normal, 2 celah, 1 bentrok) · `[DESAIN]`
- [x] Saat menyalin `PRINT_JOBS`, petakan `stage` 0–5 kanvas ke **lini masa enam tahap PRD** dan bangkitkan nomor `#HDC-`/`#SFT-` yang kanvas tidak gambar · arch §1.5 · `[DESAIN]`
- [x] Normalisasi saat menyalin: kunci pendek kanvas (`t`, `a`, `g`, `r`, `st`) → nama field domain (arch §6.1); nilai terformat (`readsL: '985rb'`) **dibuang**, simpan angka mentah
- [x] Lengkapi seed dengan yang belum ada di kanvas: `AuthorProfile` 3 tingkat · status tinjauan `in_review`/`rejected` · voucher berjenis cakupan · riwayat penarikan termasuk satu **Ditolak** · `PrivacySettings` + `LocaleSettings` · dompet 15.300 koin + 23 bonus · 6 transaksi · `[BARU]`
- [x] **Aturan lint: `dexie` tidak boleh diimpor di luar `src/api/mock/`** — menjaga seam tetap utuh (arch §5) · `[BARU]`
- [x] `src/api/http/` — stub yang melempar `NOT_IMPLEMENTED` (agar seam terbukti dua sisi)
- [x] `src/i18n/id.ts` + `t.ts` dengan `Key` bertipe literal
- [x] `src/i18n/content.ts` — teks legal, kategori bantuan, FAQ, pilihan bahasa, kategori visibilitas. **Copy, bukan data pengguna**, jadi tidak masuk IndexedDB · `[LUAR]`
- [x] `src/vite-env.d.ts` — `ImportMetaEnv` bertipe, supaya `VITE_API_MODE` bukan `string` bebas · `[LUAR]`
- [x] Setup Vitest + `fake-indexeddb` untuk test handler mock
- [x] Git init, `.gitignore`, README singkat berisi cara menjalankan
- [x] `.env.example` + `.env` lokal — mode seam API, provider bayar/iklan, VAPID, versi minimum · `[LUAR]`
- [x] Docker: `Dockerfile` 4 tahap (deps → dev → build → prod), `docker/nginx.conf` (fallback SPA, `sw.js` & manifest anti-cache), `docker-compose.yml` profil `dev`/`prod` · `[LUAR]`
- [x] `.gitattributes` — akhir baris LF, supaya diff tetap bersih antara Windows dan container · `[LUAR]`
- [x] `src/sw.ts` — precache app shell + `SKIP_WAITING`; runtime caching menyusul di Fase 14 · `[LUAR]`
- [x] **Test:** unit `format.ts` — waktu relatif, kepala kelompok hari, hitung mundur, dan jebakan spasi tanpa-putus pada `Rp` · `[LUAR]`
- [x] **Test:** unit `similar.ts` — jarak edit + ambang toleransi menurut panjang kata · `[LUAR]`

---

## Fase 1 — Design System & Komponen Inti · 7–9 hari

Dibangun **sebelum** layar mana pun. Membangun layar dulu berarti me-restyle 34 layar nanti.

- [x] `src/styles/tokens.css` — seluruh token dari `architecture.md` §9.1, termasuk blok `[data-theme='dark']`
- [x] `src/styles/base.css` — reset, `@font-face` self-host, `@theme` Tailwind memetakan token jadi utility
- [x] Aturan lint: hex warna dilarang di luar `tokens.css` — Biome tidak punya aturannya, jadi dipakai `scripts/check-tokens.mjs` yang ikut jalan di `npm run check`
- [x] Skala tipografi §9.2 sebagai utility (`text-caption`, `text-body`, `text-title`, …); **bobot 900 tidak tersedia**
- [x] Primitif: `Button` (primary/secondary/ghost/danger, 3 ukuran, keadaan disabled & loading)
- [x] Primitif: `IconButton`, `Chip`, `Badge` (varian status §9.1), `CoinChip`
- [x] Primitif: `Switch` (kelas `on`, `aria-checked`, label ikut berubah), `Slider`, `Tabs`
- [x] Primitif: `Card`, `Skeleton` (animasi `pulse` 1,4 dtk), `ProgressBar`
- [x] Primitif: `Input`, `TextArea`, `Select`, `SearchInput`, `CharCounter` (`"25/100"`)
- [x] **`AsyncState`** — empat keadaan: memuat (skeleton) · berhasil · kosong · gagal. Gagal dan kosong **wajib berbeda tampilan** · `P0` — FR-CORE-03 · `[BARU]`
- [x] **`FailureNotice`** — satu komponen, empat tingkat: `inline` · `toast` · `inset` · `fullscreen`. Tingkat dipilih pemanggil, karena hanya pemanggil yang tahu seberapa banyak halaman ikut mati · `P0` — arch §1.4 · `[DESAIN]`
- [x] Tata letak copy `FailureNotice` **selalu sama**: apa yang terjadi → apakah uang/tulisan aman → satu aksi → kode teknis kecil di bawah. Tidak ada pesan yang berhenti di “terjadi kesalahan” atau menyalahkan pengguna · `P0` · `[DESAIN]`
- [x] Label coba-lagi **naik** setelah dua kegagalan berturut-turut (“Coba lagi” → “Coba sekali lagi”); hitungan retry adalah state komponen · `P1` · `[DESAIN]`
- [x] `AsyncState` memakai `FailureNotice` untuk varian gagalnya — satu tampilan kegagalan di seluruh aplikasi · `P0` · `[DESAIN]`
- [x] **`EmptyState` dua varian** — *belum ada isinya* (penjelasan + 1 aksi utama + tautan alternatif) vs *tidak ada hasil saringan* (tawarkan hapus saringan) · `P0` — FR-CORE-02 · `[BARU]`
- [x] Kontrol cari/saring disembunyikan saat daftar **benar-benar** kosong · `P1` — FR-CORE-02 · `[BARU]`
- [x] Overlay: `Modal` — focus trap, Esc, klik backdrop, fokus balik ke pemicu
- [x] Overlay: `Sheet` — bottom sheet di `<640`, **dialog terpusat di `≥640`**, handle bar, radius `28px 28px 0 0`
- [x] Overlay: `Popover` — tutup saat klik luar & saat konten digulir, tapi **tidak** saat klik di dalam (FR-HOME-06)
- [x] `Toast` + `ToastProvider` — `role="status"`, `aria-live="polite"`, 2.600 ms, timer lama selalu dibatalkan (FR-READ-10)
- [x] `Confetti` — parameter jumlah/palet/durasi; hormati `prefers-reduced-motion` (FR-DETAIL-12)
- [x] Pola: `TopBar` (kembali + judul + aksi kanan, sticky)
- [x] Pola: `BottomNav` — **Beranda · Isi Koin · Pustaka · Karya · Profil** (`<1024`) & `SideNav` (`≥1024`); tab aktif dari prefix path · sumber: `NovelovaNav.dc.html`
- [x] Pola: `StoryCard` varian `grid` & `list` (cover 2:3, badge, meta, progres)
- [x] Pola: `ChapterRow` (gratis: chevron · terkunci: harga + gembok, tanpa statistik)
- [x] Pola: **`FilterableList`** — cari + tab filter + urut + penghitung tunggal/jamak + keadaan kosong; state di URL
- [x] `FilterableList` **digerakkan server**: baca saringan dari URL → kueri berpaginasi 20; tidak menyembunyikan baris di DOM · `P0` — FR-LIB-11, prd_11 §7 #1 · `[BARU]`
- [x] Pola: `Scheduler` — tanggal (min = hari ini lokal) + jam (default 19:00) + chip jam + pengulangan
- [x] Pola: `AdSlot` — `role="complementary"`, label "Bersponsor", `loading="lazy"`
- [x] Pola: **`StarRating`** — masukan 1–5 bulat, tampilan rata-rata berdesimal, keadaan read-only · `P0` — FR-SOCIAL-01 · `[BARU]`
- [x] Pola: **`SpoilerVeil`** — memakai ulang gaya `.lock-preview`; buram + "Spoiler — ketuk untuk melihat" + `aria-hidden` selama tertutup · `P1` — FR-SOCIAL-06 · `[BARU]`
- [x] Pola: **`ReportSheet`** — 6 alasan + keterangan untuk "Lainnya"; dipakai cerita, ulasan, komentar · `P0` — FR-SOCIAL-07 · `[BARU]`
- [x] Pola: **`ReviewStatusBadge`** — `Dalam tinjauan` / `Ditolak` + alasan; dipakai cerita, bab, pesanan cetak · `P0` — FR-STUDIO-38 · `[BARU]`
- [x] Pola: **`UserRow`** — avatar inisial · nama · handle · lencana peran · baris aktivitas · tombol Ikuti optimistis. Dipakai pengikut, mengikuti, dan hasil pencarian pengguna · `P1` — FR-PROF-09 · `[DESAIN]`
- [x] Pola: **`SettingRow`** — judul · keterangan · kontrol di kanan (switch/select/chevron). Memikul hampir seluruh layar bahasa & keamanan · `P1` · `[DESAIN]`
- [x] Pola: **`ScoreRing`** — cincin skor + angka + label tingkat; dipakai skor keamanan · `P2` — FR-SET-02 · `[DESAIN]`
- [x] Pola: **`StageTrack`** — lini masa berurutan dengan tahap selesai / tahap kini / tahap belum dijalani. Enam tahap untuk pesanan hardcopy, dipakai ulang untuk tangga verifikasi penulis · `P1` — FR-STUDIO-32/33 · `[DESAIN]`
- [x] Pola: **`DangerZone`** — kelompok aksi tak-terbalikkan di dasar formulir, satu pola konfirmasi ketik-ulang judul untuk semuanya · `P1` — FR-STUDIO-18 · `[DESAIN]`
- [x] `useFocusTrap`, `useDismissable` di `lib/a11y.ts`
- [x] `useOptimistic()` — pembungkus mutasi TanStack Query: ubah seketika, kembalikan **disertai pesan** bila gagal · `P0` — FR-CORE-03 · `[BARU]`
- [x] Halaman `/dev/kitchen-sink` (dev only) — semua komponen dalam satu halaman untuk uji visual & tema gelap
- [x] **Test:** komponen `FilterableList` — filter+cari bersifat AND, penghitung "1 cerita" vs "6 cerita", keadaan kosong
- [x] **Test:** komponen `AsyncState` — permintaan gagal merender keadaan gagal + tombol coba lagi, **bukan** keadaan kosong · `[BARU]`
- [x] `lib/cx.ts` — penggabung className tujuh baris, menggantikan `clsx` · `[LUAR]`
- [x] `lib/a11y.ts` juga memuat `useScrollLock` dan `prefersReducedMotion` · `[LUAR]`
- [x] `QueryProvider` — retry berhenti untuk kegagalan permanen; mutasi tidak pernah diulang otomatis · `[LUAR]`
- [x] `ErrorBoundary` — render yang melempar jadi layar penuh berkode `RENDER-500`, bukan halaman putih · `[LUAR]`
- [x] `AppShell` + pohon rute awal dengan penampung per tab · `[LUAR]`
- [x] **Test:** `FailureNotice` tingkat `inset` hanya mengganti bagiannya — sisa halaman tetap terender · `[DESAIN]`

---

## Fase 2 — Sesi, Shell & Onboarding · 5–6 hari

- [x] `AppShell` — bottom nav `<1024`, sidebar 240px `≥1024`, `padding-bottom: 96px` pada konten
- [x] `TopBarLayout`, `ReaderLayout`, `AuthLayout` — judul `TopBarLayout` dibaca dari `handle` rute, jadi nama halaman hanya ditulis sekali
- [x] Route tree lengkap (arch §8, **41 rute**) dengan `lazy()` per modul + skeleton fallback — tabel rute sebagai **data** (`ROUTES`); 41 rute terjangkau semuanya (diuji). `lazy()` menyusul per modul saat halamannya ada, mekanisme + `Suspense` fallback sudah terpasang
- [x] `guards.ts` — `requireAuth` & `requireGuest` — berkasnya `guards.tsx`: guard ditulis sebagai **komponen**, bukan `loader`, supaya alurnya bisa diuji di jsdom (data router gagal bernavigasi di sana)
- [x] **Redirect membawa tujuan asal**: `/masuk?next=<path>`; setelah masuk mendarat di halaman yang tadi dituju · `P0` — FR-AUTH-12 · `[BARU]` — `next` hanya menerima path internal; `https://…` dan `//…` ditolak (open redirect)
- [x] **Guard `penulis` tiga tingkat** (`none` / `registered` / `verified`); `none` → ajakan mendaftar, bukan halaman kosong · `P0` — FR-STUDIO-33 · `[BARU]` — `registered` yang membuka halaman uang **tidak diusir**, hanya diberi ajakan verifikasi
- [x] `stores/session.ts` — **token akses di memori**, refresh lewat cookie `HttpOnly`; localStorage hanya menyimpan profil ringkas untuk render · `P0` — FR-AUTH-12 · `[BARU]` — kunci `novelova:profile-v1`; `status` sengaja tidak ikut dipersistensi supaya muat ulang selalu bertanya ke server
- [x] Masa berlaku sesi mengikuti "Ingat saya": dicentang → sesi panjang + pembaruan otomatis; tidak → berakhir saat peramban ditutup · `P0` — FR-AUTH-12 · `[BARU]` — mekanismenya utuh dan diuji (cookie persisten vs cookie sesi + pembaruan otomatis sebelum token habis); **kotak centangnya** ikut layar `/masuk`
- [x] Handler mock sesi: `login`, `refresh`, `logout` — cookie refresh disimulasikan Web Storage (`localStorage` = "Ingat saya", `sessionStorage` = cookie sesi) · `[LUAR]`
- [x] Handler mock `getAuthorProfile` — ditulis lebih awal karena guard tiga tingkat membutuhkannya; sisa handler studio tetap di Fase 8 · `[LUAR]`
- [x] `SessionProvider` + `useSessionBootstrap` — hidrasi sesi sekali di akar, lalu pembaruan otomatis sebelum token akses habis · `[LUAR]`
- [x] Target build `es2022` — seam API memilih implementasi lewat top-level `await import()`, dan target bawaan Vite masih melarangnya · `[LUAR]`
- [x] **Test:** setiap dari 41 rute benar-benar terjangkau, tidak tertutup rute lain · `[LUAR]`
- [x] **Lembar masuk ulang saat sesi kedaluwarsa di tengah pemakaian** — bukan redirect yang menghapus naskah penulis · `P0` — FR-AUTH-12 × FR-STUDIO-34 · `[BARU]` — menutup lembar pun tidak mengeluarkan pengguna; permintaan berikutnya yang ditolak memunculkannya lagi, jadi tulisan bisa disalin dulu
- [x] Pesan sesi berakhir menyebutkan **apa yang tetap aman** (“Progres baca, koin, dan draf bab tersimpan di akun”) — bukan hanya menyuruh masuk lagi · `P0` — `AUTH-401` · `[DESAIN]`
- [x] **Rate limit masuk**: 5 percobaan gagal per perangkat → tahan 15 menit, layar penuh menyebut **waktu buka kembali** dan menawarkan pemulihan kata sandi · `P0` — `AUTH-429` · `[DESAIN]` — dicek **sebelum** kredensial disentuh: kata sandi yang benar pun ditolak selama penahanan
- [x] Pesan rate limit menegaskan akun masih aman bila bukan pengguna yang mencoba, dan mengajak segera mengubah kata sandi · `P1` · `[DESAIN]`
- [x] **Versi aplikasi terlalu lama** — layar penuh saat SW mendeteksi versi di bawah minimum; menyatakan bacaan & koin tidak terpengaruh · `P2` — `APP-426` · `[DESAIN]` — pemicunya `VITE_MIN_SUPPORTED_VERSION` (dan `APP-426` dari server), bukan service worker: SW tidak tahu versi minimum yang ditetapkan server
- [x] `useBackNavigation()` — `history.length > 1 ? navigate(-1) : navigate(fallback)`, dipakai di **semua** tombol kembali · `P0` — FR-CORE-05 — di `lib/nav.ts` bersama `safeNext`; `TopBar` memakainya
- [x] `ErrorBoundary` + halaman 404 · `P1` — 404 kini berpindah lewat router, bukan `window.location`, supaya sesi dan cache tidak ikut dibuang
- [x] **Masuk** `/masuk` — identitas (email/HP) + kata sandi, "Ingat saya" default aktif, toggle lihat sandi · `P0` — FR-AUTH-01/02/03 — catatan di bawah "Ingat saya" menyebut konsekuensinya (sesi panjang vs berakhir saat peramban ditutup)
- [x] Validasi berurutan + satu area error `min-height` agar layout tidak melompat · `P0` — FR-AUTH-09 — ikut karena satu formulir; ditulis tangan, bukan RHF: satu-area-pesan berlawanan dengan model error per-kolom
- [x] `ApiError.retryAt` — kapan boleh dicoba lagi, supaya layar `AUTH-429` bisa menyebut jamnya alih-alih menguburnya di dalam kalimat · `[LUAR]`
- [x] Penanganan global `AUTH-401` dan `APP-426` di `QueryProvider` — keduanya berlaku untuk seluruh aplikasi, bukan per pemanggil · `[LUAR]`
- [x] `LoginInput.email` → `identity` — satu kolom menerima email maupun nomor HP (FR-AUTH-01) · `[LUAR]`
- [x] Copy tiga kegagalan sesi disamakan dengan kanvas seksi 7a, dan `FailureNotice` layar penuh memberi jaminan kotaknya sendiri ("Yang tetap aman") · `[LUAR]` · `[DESAIN]`
- [x] Kontrol sesi di `/dev/kitchen-sink` — keluar, sesi berakhir, versi kedaluwarsa. Tanpa itu tiga layar ini hanya bisa dilihat dengan menunggu berhari-hari · `[LUAR]`
- [x] Tombol OAuth Google & Facebook (warna merek dipertahankan, aksi stub) · `P1` — FR-AUTH-04 — hanya di `/masuk` (kanvas layar 19 & PRD menempatkannya di sana); warna merek jadi token `--nv-brand-*`, satu-satunya warna di `tokens.css` yang bukan milik Novelova
- [x] **Daftar** `/daftar` — 4 kolom, HP opsional, validasi berurutan · `P0` — FR-AUTH-05
- [x] Meter kekuatan kata sandi 0–4 (4 kriteria, 5 warna, 5 label) · `P1` — FR-AUTH-06 — lima warnanya token `--nv-strength-0..4`; meter informasional, yang memblokir submit tetap hanya panjang minimum
- [x] Checkbox persetujuan + tautan ke `/legal/*`; dicek **terakhir** · `P0` — FR-AUTH-07 — persetujuan ikut ke server (`acceptedTerms`), bukan hanya centang di layar yang dibuang setelah submit
- [x] **Lupa sandi** `/lupa-sandi` — indikator 3 langkah, catatan berlaku 15 menit · `P0` — FR-AUTH-08 — tidak pernah menolak, termasuk saat kolomnya kosong: menjawab "email itu tidak terdaftar" membocorkan akun mana yang ada
- [x] Kebijakan kata sandi **8 karakter** di masuk & daftar (memperbaiki PRD 02 §7 #1) · `P0` — `PASSWORD_MIN` di `lib/limits.ts`, dipakai kontrak Zod dan formulir
- [x] **Onboarding** `/mulai` — 3 langkah, **seluruhnya dapat dilewati**, "Lewati" selalu terlihat · `P1` — FR-AUTH-11 · `[BARU]`
- [x] Langkah 1: pilih genre favorit, min 1 maks 5, dari daftar yang sama dengan tab genre beranda · `P1` — FR-AUTH-11 · `[BARU]` — daftarnya `GENRE_TABS` di `i18n/content.ts`; **bukan** `GenreSchema`: "My Kisah" adalah tab pembaca, tidak pernah jadi genre sebuah cerita
- [x] Langkah 2: bahasa & wilayah, nilai awal dari perangkat, disimpan ke `LocaleSettings` · `P1` — FR-AUTH-11 · `[BARU]` — mendarat di penyimpanan yang sama dengan halaman pengaturan (FR-SET-04), bukan tempat terpisah
- [x] Langkah 3: 3 rekomendasi cerita berdasarkan genre terpilih + aksi simpan ke perpustakaan · `P1` — FR-AUTH-11 · `[BARU]` — selalu tiga, termasuk saat genre dilewati
- [x] Onboarding hanya sekali; melewati = menyelesaikan; akun OAuth baru juga melewatinya · `P1` — FR-AUTH-11 · `[BARU]` — penandanya `ReaderPrefs.onboardedAt` **di server**: penanda di peramban berarti pengguna mengulanginya di tiap perangkat baru
- [x] `ReaderPrefs` di server — genre favorit + penanda onboarding, plus handler `getReaderPrefs` · `finishOnboarding` · `getStarterPicks` · `[LUAR]`
- [x] Handler `getLocaleSettings` · `setLocaleSettings` · `toggleLibrary` — dituntut onboarding langkah 2 dan 3; layar pemakainya menyusul di Fase 13 dan Fase 7 · `[LUAR]`
- [x] `GENRE_TABS`, `RESET_STEPS`, `ONBOARDING_LANGUAGES`, `ONBOARDING_REGIONS` di `i18n/content.ts` — daftar, bukan kalimat, jadi bukan urusan `id.ts` · `[LUAR]`
- [x] Genre terpilih memengaruhi urutan section beranda, **tidak mengunci** — seluruh katalog tetap dapat dijelajahi · `P1` — FR-AUTH-11 · `[BARU]`
      ↳ Terwujud di **dua tempat**: urutan tab genre (favorit di depan) dan isi tiap section (cerita bergenre favorit naik ke depan). **Susunan section-nya sendiri tetap** — FR-HOME-04 menahannya, dan kriteria penerimaan FR-AUTH-11 memang berbunyi "section yang **mengutamakan** genre tersebut". Tidak mengunci: seluruh tab tetap ada, dan cerita di luar favorit tetap tampil.
- [x] Handler mock auth: `login`, `register`, `requestReset`, `refresh`, `logout`
- [x] **Test:** komponen — kesalahan pertama menang, area error dikosongkan sebelum navigasi
- [x] **Test:** rute terlindungi tanpa sesi → `/masuk?next=…`, dan kembali ke tujuan setelah masuk · `[BARU]` — dua test: guard menaruh `next`, formulir mendarat di sana
- [x] **Test:** percobaan masuk gagal ke-6 dalam 15 menit ditolak sebelum menyentuh kredensial · `[DESAIN]`

---

## Fase 3 — Beranda & Lihat-Semua · 6–8 hari

> Beranda adalah tempat pertama tingkat **Sisipan** dipakai: satu section gagal dimuat, sisanya tetap jalan (arch §1.4, layar 32). Pakai `FailureNotice` tingkat `inset` per section — jangan menjatuhkan seluruh halaman.

- [x] Handler mock: `getHomeFeed(genre?)` — enam section, penyaringan genre, dan aturan "kosong = tidak dikirim"
- [x] Handler mock: `getSection` dengan paginasi & parameter genre/urut/filter — dipakai halaman lihat-semua — urutan bawaannya **sama persis** dengan section beranda (termasuk favorit onboarding); chip periode menyusul bersama FR-HOME-14
- [x] `SectionId` diperbaiki — daftar lama memakai kosakata halaman lihat-semua, bukan blok beranda FR-HOME-06 · `[LUAR]`
- [x] `src/hooks/` untuk state server lintas fitur (`useReaderPrefs`) — `features/*` tidak boleh saling impor, jadi yang dipakai bersama naik ke atas · `[LUAR]`
- [x] `stores/homeSections.ts` — kunci `home_section_visibility_v1`, merge di atas default, `catch` → default · `P0` — FR-HOME-06 — ditulis tangan, **bukan** `zustand/persist`: persist membungkus nilai dalam `{ state, version }` dan bentuk itu tidak terbaca oleh peta datar yang sudah tersimpan di perangkat pengguna lama
- [x] **Beranda** `/` — header sapaan + 3 ikon urutan Cari→Notifikasi→Pengaturan · `P1` — FR-HOME-01 — ikon pengaturan masih nonaktif sampai popover-nya ada (FR-HOME-06)
- [x] Ikon Cari → `/cari`; ikon lonceng → `/notifikasi` (halaman lengkap menyusul di Fase 11) · `P0` — FR-SRCH-01, FR-NOTIF-01 · `[BARU]` — keduanya **tautan**, bukan tombol: klik-tengah dan "buka di tab baru" harus tetap bekerja
- [x] Banner carousel 3 slide, scroll-snap, tombol "Baca sekarang" dengan `stopPropagation` · `P0` — FR-HOME-02 — seluruh kartu **satu `Link`** dan "Baca sekarang" label di dalamnya, jadi navigasi ganda tidak pernah terjadi dan `stopPropagation` tidak diperlukan; tombol di dalam tautan juga bukan HTML yang sah
- [x] Tab genre + fade tepi kiri/kanan (`maxScroll ≤ 1` → tanpa fade), listener `scroll` passive + `resize` via rAF · `P1` — FR-HOME-03
- [x] **Genre benar-benar menyaring** Popular · New & Trending · Editor's Picks · Top Romance · `P0` — FR-HOME-13 · `[BARU]` — penyaringan di server, bukan `filter()` di klien: yang kedua berbohong begitu katalognya lebih besar dari satu halaman
- [x] Banner, Continue Reading, dan slot iklan **tidak ikut tersaring**; keadaan "Semua" sebagai posisi awal · `P0` — FR-HOME-13 · `[BARU]` — aturannya di `getHomeFeed` dan diuji; **tampilan** banner carousel dan dua slot iklan menyusul bersama FR-HOME-02/05
- [x] Section tanpa cerita pada genre itu **disembunyikan**, bukan judul di atas ruang kosong; skeleton selama memuat · `P0` — FR-HOME-13 · `[BARU]` — plus keadaan kosong satu layar saat tidak ada section discovery yang tersisa, dinilai dari section discovery saja karena Continue Reading tidak ikut tersaring
- [x] Genre terpilih ikut ke tautan "See all"; urutan tab mengikuti favorit onboarding; pilihan **tidak disimpan** (sementara per kunjungan) · `P1` — FR-HOME-13 · `[BARU]` — genre hidup di URL (`?genre=`): tidak tersimpan antar kunjungan, tetapi tombol kembali dan tautan yang dibagikan tetap membawa saringannya
- [x] 5 section: Popular · New & Trending · Editor's Picks · Top Romance · Continue Reading · `P0` — FR-HOME-04 — Top Romance tetap Romance walau tab lain aktif: penyaring mempersempit section, bukan mengganti isinya
- [x] 2 slot iklan (`sec-ad1` setelah Popular, `sec-ad2` setelah Editor's Picks) · `P1` — FR-HOME-05 — `AdSlot` dapat varian `slim` dan `native`; keduanya `<aside>` bernama "Konten bersponsor"
- [x] Popover pengaturan section: 9 sakelar, simpan seketika tanpa tombol Simpan · `P0` — FR-HOME-06
- [x] **Beranda pengguna baru**: Continue Reading disembunyikan penuh bila belum ada riwayat baca; muncul otomatis setelah bab pertama selesai · `P1` — FR-HOME-16 · `[BARU]`
- [x] Popover tetap menampilkan **sembilan** pilihan termasuk yang sedang kosong — pengaturan ≠ keadaan kosong · `P1` — FR-HOME-16 · `[BARU]` — daftarnya statis, bukan diturunkan dari isi feed; sakelar yang hilang saat datanya kebetulan kosong terbaca sebagai pengaturan yang hilang
- [x] Judul section jadi Bahasa Indonesia — PRD menulisnya dalam bahasa Inggris karena prototipe begitu; kanvas yang menentukan copy, dan keputusan #3 menetapkan UI berbahasa Indonesia · `[LUAR]` · `[DESAIN]`
- [x] Urutan section diperbaiki — Lanjut Membaca jadi **penutup**, sesuai tabel FR-HOME-04 dan kanvas; sebelumnya ia muncul kedua · `[LUAR]`
- [x] Katalog contoh diperluas jadi **40 cerita**, dan tiap section beranda menampilkan **20** — delapan cerita menyisakan baris setengah kosong di layar lebar. Delapan pertama tetap dari `novelova-data.js` · `[LUAR]`
- [x] Gambar contoh dari `sample_data/` — sampul potret untuk kartu cerita, gambar lanskap untuk banner; dua kumpulan terpisah karena rasionya berbeda · `[LUAR]`
- [x] `Story.bannerUrl` + token `--nv-scrim` / `--nv-on-scrim` supaya judul banner terbaca di atas gambar apa pun · `[LUAR]`
- [x] FAB top-up (`≥1024` jadi tombol di sidebar, bukan FAB) · `P1` — FR-HOME-08 — disembunyikan saat pengguna sudah di `/koin`; konten diberi `pb-36` supaya baris terakhir tidak tertutup FAB **dan** bilah bawah
- [x] Semua kartu cerita dapat diaktifkan lewat klik & keyboard · `P0` — FR-HOME-07 — `StoryCard` sudah berupa `Link`, jadi keyboard dan klik-tengah gratis
- [x] **Lihat semua** `/jelajah/:kategori` — judul + jumlah cerita, aksen kategori dari token turunan · `P0` — FR-HOME-10 — empat kategori: `populer` · `terbaru` · `pilihan` · `romance`; genre aktif dari beranda ikut lewat `?genre=`
- [x] **Kategori keempat: `romance`** — tata letak daftar vertikal dengan progres; "View more" Top Romance tidak lagi menuju detail satu cerita · `P1` — FR-HOME-15 · `[BARU]` — progres datang dari `listProgress()`: satu permintaan untuk seluruh daftar, bukan satu per kartu
- [x] Aksen ketiga halaman lihat-semua diseragamkan ke rose-gold `#d09a93` (PRD 01 §9.2) · `P1` — FR-HOME-15 · `[BARU]` — ikut karena satu halaman: tiga aksen berbeda untuk daftar yang bentuknya identik membuat produk terasa seperti tiga produk
- [x] **Kontrol lihat-semua berfungsi nyata**: urutan, chip periode, 2 dropdown, tombol Filter — memuat ulang dari server, halaman pertama, dengan skeleton · `P0` — FR-HOME-14 · `[BARU]` — pilihannya per kategori (`browseConfig.ts`), persis tabel FR-HOME-11; chip Pilihan Editor jadi jenis kurasi, bukan periode
- [x] Kombinasi filter & urutan **ikut ke URL** sehingga dapat dibagikan dan tombol kembali peramban bekerja · `P0` — FR-HOME-14 · `[BARU]` — komponen kontrolnya tidak menyimpan apa pun; seluruh nilainya dibaca dari URL
- [x] Tombol "+ Simpan" per kartu → aksi yang sama dengan Add to Library; berubah jadi "Tersimpan" · `P1` — FR-HOME-14, FR-DETAIL-13 · `[BARU]` — id yang sudah tersimpan diambil sekali untuk seluruh daftar; dua puluh kartu tidak berarti dua puluh permintaan
- [x] Aksi geser (Save · Share · Hide) yang sudah digambar di CSS **diaktifkan**; Hide menyembunyikan cerita dari rekomendasi · `P2` — FR-HOME-14 · `[BARU]` — laci yang sama dibuka tombol **Aksi**: yang hanya bisa dijangkau dengan jari tidak ada bagi pengguna papan tik. `Hide` disimpan di server (`ReaderPrefs.hiddenStoryIds`), jadi tidak kembali saat ganti perangkat
- [x] Kolom pencarian pintasan di halaman lihat-semua → `/cari` · `P1` — FR-SRCH-01 · `[BARU]` — tautan berbentuk kolom cari, bukan kotak cari kedua yang perilakunya berbeda dari `/cari`
- [x] Grid responsif 2/3/4 kolom; skeleton di akhir daftar + infinite scroll 20 per muat · `P2` — FR-HOME-12 — **1/2/3 kolom**, bukan 2/3/4: barisnya memakai anatomi kanvas (sampul 66px + judul + meta + tombol simpan), dan dua kolom di layar ponsel menyisakan ~180px per baris
- [x] **Test:** unit — `homeSections` merge parsial, JSON rusak → default
- [x] **Test:** komponen — ganti genre memicu satu pemuatan ulang, dan section kosong hilang · `[BARU]`

---

## Fase 3b — Section per Genre · 2–3 hari · `[PRODUK]`

> **Bukan dari PRD maupun kanvas.** Ini permintaan produk yang datang setelah
> Fase 3 selesai, lewat diskusi 1 September 2026, dan ia **menimpa** tiga hal
> yang tertulis di PRD:
>
> | Yang tertulis | Yang berlaku sekarang |
> |---|---|
> | FR-HOME-04: susunan section **tetap** | Empat blok pertama tetap; **ekornya berganti mengikuti tab** |
> | FR-HOME-04/06/10/11: **Editor's Picks** | **Paling Banyak Dibuka** — bab yang dibuka pakai koin, bukan kurasi manual |
> | FR-HOME-03: "My Kisah" salah satu dari tujuh genre | **Bukan genre.** Kisah nyata yang bisa bergenre apa pun |
>
> Empat keputusan diambil lewat pertanyaan langsung dan mengikat: section
> tematik = **2 generik + 2 kurasi** · My Kisah = **kolom `kind` baru**, tegak
> lurus dengan genre · Most Unlocked dihitung dari **bab yang dibuka pakai
> koin** · tab "Semua" memakai **kurasi umum lintas genre**.

**Susunan feed yang berlaku**, di tab mana pun:

| # | Section | Ikut tersaring tab? |
|---|---|---|
| 1 | Unggulan (banner) | tidak |
| 2 | **Populer** | ya |
| 3 | **Baru & Naik Cepat** | ya |
| — | iklan `sec-ad1` | — |
| 4 | **Paling Banyak Dibuka** | ya |
| — | iklan `sec-ad2` | — |
| 5–6 | dua section generik | ya |
| 7–8 | dua section kurasi | ya |
| 9 | Lanjut Membaca | tidak |

Generik: **Tamat & Siap Dibaca** · **Gratis Hari Ini**. Kurasi per tab:

| Tab | Dua section kurasi |
|---|---|
| Romance | Kantor & CEO · Musuh Jadi Cinta |
| My Kisah | Kisah Pilu · Kisah Lucu |
| Fantasy | Dunia Lain · Sihir & Ramalan |
| Mystery | Kasus Tertutup · Twist di Bab Akhir |
| Drama | Keluarga · Kehilangan & Pulih |
| CEO | Pernikahan Kontrak · Balas Dendam Karier |
| Thriller | Kejar-kejaran · Psikologis |
| Semua | Sedang Ramai Dibicarakan · Pilihan Pembaca Baru |

- [x] `Story.kind: 'fiksi' | 'kisah'` — tab My Kisah menyaring kolom ini, **bukan** genre; sebuah kisah nyata tetap boleh bergenre Horor · `P0`
- [x] `StoryStats.unlockCount` — bab yang dibuka pakai koin; dasar section Paling Banyak Dibuka · `P0` — cerita gratis bernilai 0, jadi ia tidak pernah nyasar ke section ini
- [x] **Tag cerita jadi data sungguhan** — keempat puluh cerita contoh sekarang bertag identik, dan section kurasi di atasnya akan menghasilkan delapan section yang isinya sama persis · `P0` — kosakata tag per genre di `seed.ts`; tag kisah (`tragedi`/`komedi`) bergantian, bukan menempel pada satu nilai saja
- [x] Sebagian cerita contoh bermonetisasi **gratis** — tanpa itu section "Gratis Hari Ini" selalu kosong dan selalu tersembunyi · `P1`
- [x] `SectionId` berhenti jadi enum enam nilai; satu **registry section** di sisi server tiruan memetakan id → judul, aturan penyaring, dan tautan lihat-semua · `P0` — `api/mock/handlers/sections.ts`, dibaca perakit feed **dan** `getSection`, jadi halaman lihat-semua tidak mungkin memakai aturan yang berbeda
- [x] `getHomeFeed(genre?)` → `getHomeFeed(tab?)`, dan `?genre=` di URL → `?tab=` — saringan tab bukan lagi sekadar nama genre · `P0`
- [x] **Paling Banyak Dibuka** menggantikan Pilihan Editor; kunci sakelarnya tetap `sec-editor` supaya pilihan yang sudah tersimpan tidak terbuang, rutenya `/jelajah/pilihan` → `/jelajah/terbuka` · `P0`
- [x] Judulnya **"Paling Banyak Dibuka"**, bukan "Most Unlocked" — UI berbahasa Indonesia (keputusan #3) · `P1`
- [x] "Romansa Teratas" keluar dari susunan tetap; ia jadi section kurasi tab Romance · `P1` — tepatnya dua: Kantor & CEO dan Musuh Jadi Cinta
- [x] Section tematik **tidak punya sakelar sendiri** di popover — sembilan sakelar tetap mengurus blok tetap saja, kalau tidak daftarnya berubah tiap ganti tab · `P1` — seluruhnya berbagi satu sakelar, bekas `sec-toprom`, yang labelnya jadi "Section tematik"
- [x] Tiap section tematik otomatis punya halaman lihat-semua lewat registry yang sama · `P1` — id section **adalah** kata rutenya, jadi tidak ada tabel pemetaan yang harus dijaga sinkron
- [x] **Test:** tiga section pertama tetap ada di seluruh tab, termasuk tab yang isinya sedikit
- [x] **Test:** tab My Kisah menyaring `kind`, bukan genre — dan isinya tetap bergenre macam-macam
- [x] **Test:** section kurasi tiap tab benar-benar berbeda isinya

---

## Fase 4 — Pencarian Katalog · 3–4 hari · `[BARU]`

Modul baru (`prd_11`). Katalog 328 + 96 + 54 cerita saat ini **hanya bisa ditelusuri lewat kurasi beranda** — tidak ada jalan sama sekali menemukan cerita yang judulnya sudah diketahui. Tiga pencarian yang sudah ada (`my_library`, `my_stories`, `manage_chapters`) semuanya mencari **milik sendiri**, bukan katalog.

- [x] Handler mock: `search`, `getSuggestions`, `getTrendingQueries` — **penyaringan di sisi seam**, berpaginasi (prd_11 §7 #1) — kata kunci populer diturunkan dari tag yang paling banyak dipakai katalog, bukan daftar tulis tangan yang bisa mengantar ke hasil kosong
- [x] **Halaman** `/cari` — kolom masukan **sudah terfokus** saat dibuka, papan ketik langsung muncul · `P0` — FR-SRCH-01
- [x] Tombol kembali bertingkat, cadangan beranda, memulihkan posisi gulir sebelumnya · `P0` — FR-SRCH-01 — posisi gulir lewat `ScrollRestoration` di rute akar baru; React Router hanya bisa melakukannya sekali di satu tempat
- [x] Cakupan pencarian: judul · penulis/pen name · tag · genre · sinopsis (bobot terendah) · `P0` — FR-SRCH-02 — judul yang diawali kueri mendapat tambahan bobot; sinopsis paling rendah supaya kata yang kebetulan lewat tidak naik ke atas
- [x] Hasil dikelompokkan **Cerita · Penulis · Tag**; kelompok kosong tidak ditampilkan · `P0` — FR-SRCH-02 — satu permintaan mengembalikan ketiganya; yang kosong tetap ada di muatan, komponen yang memutuskan tidak menampilkannya
- [x] Tidak peka huruf besar-kecil, spasi tepi diabaikan — konsisten dengan FR-LIB-03 · `P0` — FR-SRCH-02
- [x] **Minimum 2 karakter** sebelum kueri dikirim; debounce **300 ms** setelah ketikan terakhir · `P0` — FR-SRCH-02 — ikut karena halaman tanpa aturan ini mengirim satu permintaan per ketukan; aturannya juga ditegakkan server, bukan hanya klien
- [x] Kartu hasil cerita memakai anatomi `see_all_*` (cover 66×88, judul, penulis, meta, rating) · `P1` — FR-SRCH-02 — komponen yang sama persis dengan halaman lihat-semua, bukan tiruannya
- [x] Tujuan hasil: cerita → detail · penulis → profil · tag → hasil tersaring tag itu · `P0` — FR-SRCH-02 — tag menjalankan pencariannya **di tempat** dan mengisi kolomnya, bukan berpindah halaman ke pencarian yang sama
- [x] Paginasi 20 per muat + gulir tak terbatas dengan skeleton · `P1` — FR-SRCH-02 — hanya kelompok **Cerita** yang berpaginasi; penulis dan tag datang utuh di halaman pertama, karena keduanya daftar pendek yang justru aneh kalau terpotong
- [x] `stores/searchHistory.ts` — kunci `novelova:search-history-v1`, maks 10, terbaru di depan, tanpa duplikat, `try/catch` → array kosong · `P1` — FR-SRCH-03 — isinya `string[]` polos seperti tertulis di `architecture.md` §7.1, jadi bukan `zustand/persist` yang membungkusnya dalam `{ state, version }`. Perbedaan huruf besar-kecil bukan entri baru
- [x] Hapus per entri + "Hapus semua"; blok riwayat **tidak tampil** bila belum pernah mencari · `P1` — FR-SRCH-03 — riwayat dicatat saat pengguna **benar-benar mencari** (Enter, riwayat, pil, tag), bukan tiap ketikan yang kebetulan berhenti 300 ms: riwayat berisi "r", "ro", "rom" bukan riwayat
- [x] Kata kunci populer dari server sebagai pil; menekannya langsung menjalankan pencarian · `P1` — FR-SRCH-03
- [x] Saran sambil mengetik, maks 8, bagian yang cocok ditebalkan · `P1` — FR-SRCH-03 — potongan yang ditebalkan datang dari server (`matchStart`/`matchLength`), bukan ditebak ulang dengan `indexOf` yang akan meleset begitu pencocokannya lebih pintar daripada substring persis
- [x] Saring genre · status (Ongoing/Completed/Hiatus) · bahasa; urut relevan/terbanyak dibaca/rating/terbaru · `P1` — FR-SRCH-04 — saringan dipasang **sebelum** skor dipakai: mengurutkan lalu membuang membuat `total` menghitung cerita yang tidak pernah tampil
- [x] Bilah kontrol sticky dengan `backdrop-filter` — identik `see_all_*` · `P1` — FR-SRCH-04
- [x] Saringan aktif sebagai pil yang bisa dilepas satu per satu; ganti saringan mengulang dari halaman pertama · `P1` — FR-SRCH-04 — tanpa pil itu, satu-satunya cara membatalkan saringan adalah membuka dropdown-nya dan mencari pilihan kosong, dan pembaca yang lupa sedang menyaring akan menyimpulkan katalognya yang kosong
- [x] **Kueri & saringan ikut ke URL** (`?q=&genre=&status=&lang=&sort=`) — hasil dapat dibagikan, tombol kembali bekerja · `P1` — FR-SRCH-04 — URL jadi satu-satunya sumber kebenaran; ketikan memakai `replace` supaya tiap huruf tidak jadi entri riwayat peramban, sementara pencarian yang **disengaja** menambah satu entri
- [x] Keadaan kosong: kueri disebut ulang + saran ejaan "Maksud Anda …?" (`lib/similar.ts`) + tautan ke kategori populer · `P1` — FR-SRCH-05
- [x] Kosong **karena saringan** → tawarkan "Hapus semua saringan" lebih dulu · `P1` — FR-SRCH-05 — dua keadaan kosong yang berbeda sebabnya: kueri yang tidak menemukan apa pun, dan kueri benar yang tersaring habis
- [x] Kegagalan jaringan ditangani **terpisah** dari hasil kosong: pesan + tombol Coba lagi · `P0` — FR-SRCH-05, FR-CORE-03 — sudah ikut bersama halamannya di langkah sebelumnya
- [x] **Test:** ketik cepat 5 karakter → tepat **satu** permintaan terkirim setelah 300 ms
- [x] **Test:** 1 karakter → tidak ada permintaan sama sekali
- [x] **Test:** unit `searchHistory` — kueri sama dua kali muncul sekali di posisi teratas; entri ke-11 membuang yang terlama

---

## Fase 5 — Detail Cerita & Ruang Baca · 10–13 hari · **M1**

Bagian paling bernilai dan paling berisiko. Dikerjakan sebagai satu blok karena keduanya berbagi model bab, kepemilikan, dan progres.

### 5a. Detail cerita

- [x] Handler mock: `getStory`, `getChapters` (paginasi), `redeemVoucher`, `applyVoucher`, `toggleLibrary`, `toggleFollow` — keenamnya; cakupan voucher dihormati server (daftar `chapterId` yang berhak, memperbaiki PRD 04 §7 #3)
- [x] **Hero sampul** — gambar penuh + overlay gradien, pita, judul, baris penulis + lencana ber-`aria-label` · `P0` — FR-DETAIL-01
- [x] Bilah statistik 3 metrik (Views · Ratings · Followers), angka disingkat, **bersumber dari data nyata** · `P1` — FR-DETAIL-02, FR-SOCIAL-08 — metrik ketiga berbunyi **"Disimpan"**, bukan "Pengikut": yang benar-benar dihitung model ini `stats.saves`, dan angka yang dikarang di layar detail adalah janji yang akan ditagih penulis
- [x] Aksi utama "Simpan" & "Ikuti" dengan keadaan aktif/nonaktif · `P0` — FR-DETAIL-03
- [x] **Simpan ≠ Ikuti**: dua aksi terpisah; menyimpan otomatis menyalakan Follow, melepas Follow tidak mengeluarkan dari koleksi · `P0` — FR-DETAIL-13 · `[BARU]` — satu baris `LibraryEntry`: `removed` menandai koleksi, `notify` menandai follow
- [x] Keadaan tombol dimuat dari server saat halaman dibuka; perubahan **optimistis dengan pengembalian** · `P0` — FR-DETAIL-13 · `[BARU]`
- [x] Melepas simpanan memakai konfirmasi yang sama dengan Unsave di perpustakaan · `P1` — FR-DETAIL-13 · `[BARU]` — modalnya lahir di sini; perpustakaan (Fase 7) memakai yang sama, bukan menulis kembarannya
- [x] Aksi sekunder Rate · Review · Share · Report · `P1` — FR-DETAIL-04 — Rate dan Review satu pintu ke `/cerita/:id/ulasan`; lembar rating sendiri ikut Fase 10 yang memang memilikinya
- [x] **Bagikan** — Web Share API bila tersedia, jika tidak lembar tautan + tombol salin; dua tombol bagikan berperilaku **identik**; menyertakan kode referral bila ada · `P2` — FR-DETAIL-15 · `[BARU]` — satu fungsi `share()` dipakai semua pemicu, jadi "berperilaku identik" berlaku secara konstruksi. Kode referral belum punya sumber datanya (Fase 12)
- [x] Sinopsis buka/tutup dengan `aria-expanded` sinkron sejak inisialisasi · `P1` — FR-DETAIL-05
- [x] Tag dipisah secara visual: status & harga sebagai lencana, genre sebagai pil · `P2` — FR-DETAIL-06
- [x] Daftar bab: status kunci dari `Ownership`, bukan atribut DOM · `P0` — FR-DETAIL-07/08
- [x] **Daftar bab penuh** — 20 per muat, urutan dapat dibalik (default bab pertama dulu) · `P0` — FR-DETAIL-14 · `[BARU]`
- [x] Tiga penanda per baris di luar status kunci: sudah dibaca · sedang dibaca · belum dibaca · `P0` — FR-DETAIL-14 · `[BARU]`
- [x] Tombol utama **"Lanjutkan — Bab N"** di atas daftar; belum pernah baca → **"Mulai dari Bab 1"** · `P0` — FR-DETAIL-14 · `[BARU]`
- [x] Kolom pencarian bab muncul bila bab > 20 · `P1` — FR-DETAIL-14 · `[BARU]` — menerima judul maupun nomor babnya
- [x] **Harga bab per bab dari server**, bukan konstanta — menutup selisih `1.5rb`/`1.8rb` vs 1.500 yang ditagih · `P0` — FR-DETAIL-14 · `[BARU]`
- [x] **Voucher** — modal reset saat dibuka, fokus setelah 150 ms, kode tidak peka huruf besar, maks 20 karakter · `P0` — FR-DETAIL-09
- [x] Kode salah: getar (reflow paksa agar bisa diulang) + pesan `role="alert"`, modal tetap terbuka · `P0` — kelas getar dilepas dulu lalu dipasang lagi lewat `requestAnimationFrame`; tanpa itu kode salah kedua kali tidak bergetar sama sekali
- [x] **Voucher yang dimiliki ditampilkan di atas kolom kode**, dapat dipilih tanpa mengetik · `P0` — FR-RWD-06 · `[BARU]`
- [x] Kode yang ditukar **masuk ke daftar voucher** lalu dipakai — dua langkah yang terlihat sebagai satu aksi · `P0` — FR-RWD-06 · `[BARU]`
- [x] Server-mock menghormati cakupan voucher → mengembalikan daftar `chapterId` yang berhak (memperbaiki PRD 04 §7 #3) · `P0` — `firstN` menghitung **bab pertama cerita**, bukan bab berbayar pertama: "5 bab pertama gratis" pada cerita yang tiga bab awalnya gratis berarti dua bab yang terbuka
- [x] Modal sukses: pesan dinamis "Bab 4–5" vs "Bab 4", confetti 36 partikel, dibersihkan setelah 3.400 ms · `P0` — FR-DETAIL-10

- [x] Bab untuk **seluruh katalog**, bukan hanya cerita pertama — halaman yang mengaku punya 120 bab lalu menampilkan delapan terbaca sebagai kerusakan · `[LUAR]`

### 5b. Ruang baca

- [x] `stores/readerSettings.ts` — kunci `novelova-reader-settings-v1`, penjepitan `Math.min(22, Math.max(16, …))` · `P0` — FR-READ-03 — objek datar seperti di prototipe, jadi bukan `zustand/persist`
- [x] Pengaturan dipulihkan **sebelum** teks dirender (tanpa kedipan tema terang) · `P0` — FR-READ-04 — `applyReaderSettings()` dipanggil di `main.tsx` sebelum `createRoot().render()`; kedipan putih paling menyakitkan justru bagi yang memilih tema gelap karena membaca di tempat gelap
- [x] `ReaderLayout` — bilah atas (kembali · judul+status · saldo · dengarkan · pengaturan), tanpa nav bawah · `P0` — FR-READ-01/14 — bilahnya dirender halaman, bukan layout: hanya halaman yang tahu bab mana yang sedang dibaca. Tombol "dengarkan" sudah di tempatnya tetapi nonaktif sampai TTS ada, supaya susunan bilah tidak bergeser nanti
- [x] Isi bab `--nv-font-read` Georgia; `--reader-font-size` di elemen akar; `max-width: 68ch` terpusat · `P0`
- [x] Panel pengaturan: `hidden` sebagai penanda, `aria-expanded` sinkron, klik dalam panel tidak menutup · `P0` — FR-READ-02
- [x] Di `≥1024` panel jadi sidebar kanan menempel, bukan popover · `P1`
- [x] Tema gelap `[data-theme='dark']` menyeluruh (bilah, panel, sheet, teks, chip) · `P0` — FR-READ-04 — sakelarnya di panel baca, tetapi berlakunya seluruh aplikasi; itu dinyatakan di keterangan sakelarnya
- [x] Handler mock `getChapter` — pratinjau selalu dikirim, isi lengkap **hanya** bila babnya dimiliki: mengirimnya lalu menyembunyikannya di CSS berarti naskah berbayar ada dalam jangkauan siapa pun yang membuka panel jaringan · `[LUAR]`
- [x] Handler mock `getWallet` + `hooks/useWallet` — saldo di bilah baca butuh angkanya, dan satu kunci cache membuat seluruh tampilan saldo sepakat · `[LUAR]`
- [x] `Switch` dan `Slider` akhirnya punya nama aksesibel — `<label>` tidak menamai `<button>`, jadi selama ini sakelar tanpa `hideLabel` tidak punya nama sama sekali bagi pembaca layar · `[LUAR]`
- [x] Saldo koin di 4 titik tampil, diperbarui bersamaan; bonus tidak ikut berkurang · `P0` — FR-READ-05 — satu kunci cache `['wallet']` dipakai bilah baca, gerbang, lembar saldo kurang, dan FAB, jadi membuka satu bab memperbarui keempatnya sekaligus
- [x] **Gerbang bab terkunci** — lencana, harga awal, panduan, pratinjau buram `aria-hidden="true"`, overlay pilihan · `P0` — FR-READ-06 — naskah bab terkunci **tidak dirender sama sekali**; yang buram hanyalah pratinjau yang memang dikirim server
- [x] Handler mock `unlockChapter` — idempoten, cek saldo, tulis `Ownership` **sesuai cakupan** (1 / 10 / semua) + baris ledger · `P0` — FR-READ-07 — satu transaksi Dexie untuk saldo, kepemilikan, ledger, dan kuota: tidak ada keadaan "saldo terpotong tetapi bab tetap terkunci"
- [x] Tiga opsi berbayar + lencana hemat 5% / 10% · `P0` — FR-READ-07 — persentasenya **dihitung server** dari harga satuan sungguhan (`getUnlockOptions`), bukan dipatok 5/10: harga bab berbeda-beda, dan angka hemat yang meleset adalah kebohongan yang ditagih pengguna belakangan
- [x] **Saldo kurang → lembar, bukan toast**: kekurangan koin yang tepat (`"Kurang 1.200 koin"`) · saldo saat ini · tombol "Isi koin" · alternatif iklan bila kuota ada · `P0` — FR-READ-17 · `[BARU]`
- [x] "Isi koin" membawa konteks `?return=&chapter_id=&need=`; batal → kembali ke bab yang sama dengan gerbang masih terbuka · `P0` — FR-READ-17 · `[BARU]`
- [x] Auto-unlock aktif tapi saldo kurang → lembar ini yang muncul, menggantikan diamnya sistem sekarang · `P1` — FR-READ-17 · `[BARU]`
- [x] **Layar iklan dengan hitung mundur**; bab dibuka **hanya setelah** tayangan selesai · `P0` — FR-READ-18 · `[BARU]`
- [x] **Kuota dipotong setelah tayangan selesai**, bukan saat tombol ditekan; batal di tengah → bab tidak terbuka, kuota tidak berkurang · `P0` — FR-READ-18 · `[BARU]` — `onFinish` dipanggil dari timer, bukan dari `onClick`; itu yang membuat aturannya benar secara konstruksi
- [x] Iklan gagal dimuat → pesan + tawaran coba lagi atau pakai koin; kuota tidak berkurang · `P1` — FR-READ-18 · `[BARU]` — kuota memang tidak bisa berkurang saat gagal: server hanya memotongnya di dalam transaksi yang berhasil
- [x] Kuota iklan per `(user, tanggal)` **di server-mock**, tanggal dari zona waktu pengguna; lencana `"2/3 hari ini"` · `P0` — FR-READ-18, FR-RWD-07 — lencananya berbunyi "Sisa N kali hari ini"
- [x] **Auto-unlock** — `IntersectionObserver` ambang 0,35 + evaluasi langsung saat sakelar dinyalakan; 4 pengaman; selalu harga satuan · `P1` — FR-READ-09 — empat pengamannya: sakelar menyala · bab memang terkunci · belum pernah dicoba untuk bab ini · tidak ada permintaan berjalan. Membeli bundel tanpa diminta adalah hal terakhir yang boleh dilakukan otomatis
- [x] Fallback bila `IntersectionObserver` tidak ada · `P1` — gerbang yang sudah terlihat dievaluasi sekali saja
- [x] Slot iklan di 3 titik (akhir bab 1, tengah, akhir) · `P1` — FR-READ-12
- [x] **TTS** — Web Speech API `speechSynthesis` suara `id-ID`; kalimat hanya dari bab terbuka; kecepatan 1× → 1,25× → 1,5× → 1× · `P1` — FR-READ-11 — tombolnya mati pada bab terkunci: bab tanpa isi tidak punya apa pun untuk dibacakan
- [x] **Navigasi bab** di dua tempat: tombol besar "Bab berikutnya" + judul tujuan di akhir bab, dan panah + posisi `Bab 18 / 120` di bilah bawah · `P0` — FR-READ-15 · `[BARU]` — judul tujuannya dikirim server (`nextTitle`), karena pembaca bisa masuk lewat tautan langsung tanpa pernah memuat daftar bab
- [x] Bab pertama: "sebelumnya" **dinonaktifkan, bukan disembunyikan** — tata letak tetap stabil · `P0` — FR-READ-15 · `[BARU]`
- [x] Bab terakhir terbit: "berikutnya" → "Kembali ke daftar bab", atau keterangan jadwal bab berikutnya · `P1` — FR-READ-15 · `[BARU]`
- [x] Bab berikutnya yang terkunci **tetap dapat dibuka** — reader memuatnya beserta gerbang, tidak menolak navigasi · `P0` — FR-READ-15 · `[BARU]`
- [x] Pindah bab mereset gulir, TTS, dan indikator kalimat — tapi **tidak** mereset pengaturan baca · `P0` — FR-READ-15 · `[BARU]`
- [x] Setiap bab punya URL sendiri lewat `chapter_id` dan dapat dibagikan · `P0` — FR-READ-15 · `[BARU]`
- [x] **`ReadingProgress` dua tingkat**: bab terakhir dibuka + posisi gulir **sebagai persentase** (tetap benar meski ukuran huruf berubah) · `P0` — FR-READ-16 · `[BARU]`
- [x] Dikirim ke server throttle **maks sekali per 10 detik** + sekali lagi saat halaman ditinggalkan · `P0` — FR-READ-16 · `[BARU]` — `pagehide`, bukan `beforeunload`: yang kedua tidak pernah menyala di peramban ponsel saat tab ditutup dari daftar aplikasi
- [x] Bab **selesai** saat mencapai ≥90% isinya — angka inilah yang mengisi `"Bab 45 dari 120 — 38%"` · `P0` — FR-READ-16 · `[BARU]`
- [x] Membuka bab yang pernah dibaca sebagian → tawaran **"Lanjutkan dari posisi terakhir"**, bukan melompat otomatis · `P1` — FR-READ-16 · `[BARU]`
- [x] Progres **per akun, bukan per perangkat**; jadi syarat kelayakan memberi rating (Fase 10) · `P0` — FR-READ-16, FR-CORE-01 · `[BARU]`
- [x] Baris reaksi + tautan komentar bab → `/cerita/:id/bab/:id/komentar` (halaman lengkap di Fase 10), menampilkan jumlah komentar · `P1` — FR-READ-13, FR-SOCIAL-05 — `ReactTarget` dapat nilai `chapter`; sebelumnya hanya ulasan dan komentar yang bisa direaksi
- [x] **Bab ditarik penulis** — layar penuh menyebut tanggal penarikan dan bahwa bab akan tampil kembali dengan nomor yang sama · `P1` — `CONTENT-410` · `[DESAIN]`
- [x] Bab ditarik yang **sudah dibeli → refund otomatis**: satu baris ledger balik, saldo kembali, bukan penanganan manual · `P0` · `[DESAIN]` — idempoten lewat id barisnya, dan kepemilikannya dihapus: membiarkannya berarti pembaca "memiliki" bab yang uangnya sudah kembali
- [x] Tiga jalan keluar dari layar itu: lanjut ke bab berikutnya · kembali ke daftar bab · **“Beri tahu saya”** saat bab terbit ulang (memakai kanal notifikasi Fase 11) · `P1` — FR-NOTIF-02 · `[DESAIN]` — "Beri tahu saya" menyalakan follow cerita itu, jadi ia sudah benar-benar bekerja sekarang
- [x] `getUnlockOptions` — tiga pilihan beserta jumlah bab yang dicakup dan total harga satuannya, dihitung server. Pilihan yang tidak mencakup bab apa pun atau tidak lebih murah tidak dikirim · `[LUAR]`
- [x] `hooks/useStory` naik ke `src/hooks/` — ruang baca memakainya juga, dan `features/*` tidak boleh saling impor · `[LUAR]`
- [x] **Test:** handler — beli dua kali dengan `idempotencyKey` sama → saldo turun sekali
- [x] **Test:** handler — saldo 15.300, beli "sampai tamat" 36.900 → ditolak, saldo tidak berubah
- [x] **Test:** handler — bundle 10 bab menulis 10 baris `Ownership`
- [x] **Test:** handler — batal di tengah iklan → tidak ada `Ownership`, `AdQuota.used` tidak bertambah · `[BARU]` — diuji dari sisi aturannya: kuota hanya berubah saat `unlockChapter` dipanggil, dan pembatalan tidak pernah memanggilnya
- [x] **Test:** muat ulang setelah membeli bab → bab tetap terbuka, saldo tetap berkurang (FR-CORE-01) · `[BARU]`
- [x] **Test:** menarik bab yang sudah dibeli → saldo pengguna kembali persis sebesar harga belinya, satu baris ledger · `[DESAIN]`
- [x] **Test e2e #1:** masuk → onboarding → beranda → detail → baca bab gratis — `playwright.config.ts` lahir di sini: sebelumnya `npm run e2e` tidak punya konfigurasi sama sekali. Masuk dan onboarding dilewati karena perangkat memang mulai dalam keadaan sudah masuk, dan keduanya sudah punya test sendiri

> **M1 tercapai:** pengguna bisa menemukan cerita, mencarinya, membuka detailnya, membaca, berpindah bab, dan progresnya tercatat. Bab terkunci sudah punya gerbang yang berfungsi beserta jalan keluar yang jelas — tinggal butuh cara mengisi koin.

---

## Fase 5b — Auto-unlock per Cerita · 1–2 hari · `[PRODUK]`

> **Diserap ke Fase R4, dikerjakan di `novelova-v2/`.** Mockup putaran 7
> `7x`…`7aa` menggambar fase ini persis — gerbang empat pilihan, sakelar per
> cerita tercentang default, lembar saldo kurang tiga jalan keluar. Membangunnya
> dua kali di dua folder tidak ada gunanya. Rencana di bawah tetap berlaku apa
> adanya; kotak-kotaknya dicentang lewat R4.

**Permintaan produk 4 September**, menimpa FR-READ-09. Diputuskan lewat diskusi, bukan dibaca dari PRD — alasan lengkapnya di `architecture.md` §1.19.

Masalahnya nyata: auto-unlock di PRD **default mati** dan tersembunyi sebagai sakelar di Pengaturan Pembaca, jadi hampir tidak ada pembaca yang menemukannya. Akibatnya tiap bab berbayar memutus alur baca dengan dialog. Tetapi menghapus gerbang sepenuhnya juga salah: gerbang itu satu-satunya tempat **bundel 10 bab (12.000)**, **paket tamat**, dan **iklan gratis** pernah terlihat — dan auto-unlock selalu memakai harga satuan, yang **25% lebih mahal** untuk sepuluh bab.

Jalan tengahnya: setuju sekali per cerita, lalu mulus.

- [ ] **Gerbang tetap muncul di bab berbayar pertama tiap cerita** — empat pilihan lengkap (1 bab · bundel · tamat · iklan) · `P0` · `[PRODUK]`
- [ ] Sakelar **"Buka otomatis untuk cerita ini"** di dalam gerbang, **tercentang default** — pembaca tetap menekan tombol beli secara sadar, tetapi cukup sekali · `P0` · `[PRODUK]`
- [ ] Bab berbayar berikutnya di cerita yang sama **terbuka sendiri** saat gerbangnya terlihat — ambang 0,35 yang sudah ada, harga satuan · `P0` · `[PRODUK]`
- [ ] Izin per cerita disimpan **di server** (`readerPrefs.autoUnlockStoryIds`), bukan `localStorage` — ia menyentuh uang, dan aturan struktur #5 melarang `stores/` menyimpannya · `P0` · `[PRODUK]`
  ↳ Konsekuensinya izin ikut berpindah perangkat. Kalau kelak diputuskan harus ditanya ulang tiap perangkat, yang berubah hanya tempat penyimpanannya.
- [ ] **Sakelar global auto-unlock di Pengaturan Pembaca dihapus** — fungsinya digantikan sakelar per cerita, dan dua sakelar untuk hal yang sama saling membingungkan · `P1` · `[PRODUK]`
- [ ] Lembar **saldo kurang** menawarkan tiga jalan keluar: isi koin · voucher · tonton iklan (bila kuota harian masih ada) · `P0` · `[PRODUK]`
  ↳ Voucher sekarang hanya hidup di detail cerita; ini pertama kalinya ia muncul di ruang baca. Iklan dipertahankan karena ia satu-satunya jalan gratis — tanpanya pembaca tanpa koin benar-benar buntu.
- [ ] Auto-unlock **tetap tidak pernah membeli bundel atau paket tamat** — aturan FR-READ-09 yang tidak berubah · `P0`
- [ ] **Test:** bab pertama menampilkan gerbang; bab kedua di cerita yang sama terbuka tanpa dialog; bab pertama di cerita **lain** menampilkan gerbang lagi
- [ ] **Test:** menolak sakelar → tiap bab tetap menampilkan gerbang; saldo kurang → tiga jalan keluar, bukan diam
- [ ] **Test e2e:** bab pertama → setuju → bab berikutnya mulus → koin habis → topup/voucher/iklan, di dua lebar layar

---

## Fase R — Redesign Putaran 7 · 21–31 hari · `[PRODUK]`

**Permintaan produk 4 September.** Kode hidup di [`novelova-v2/`](./) — salinan
`novelova/` pada commit `26fdb68`, dibangun ulang dengan bahasa visual "reading-first".
`novelova/` **tidak disentuh** dan tetap rose-gold.

Acuan: [`redesign-novelova.md`](../redesign-novelova.md) + **27 PNG** di
`Novel reader UI redesign/putaran7/`. Tiga berkas `.dc.html` yang disebut §0 doc-nya
(`Novel Reader Redesign` · `ModernTabBar` · `PrintRow`) **tidak ada di folder ini**, jadi
PNG-nya yang berlaku — sesuai aturan doc sendiri: *"where a mockup and this document
disagree, follow the mockup"*.

Ini **membatalkan keputusan terkunci #1** (palet rose-gold PRD 01). Alasannya, dan dua
tempat di mana mockup-nya sendiri gagal AA, dicatat di `architecture.md` §1.20. PRD 01
**tidak disunting**.

> **Pecahan per halaman ada di [`novelova-v2/todo-redesign.md`](todo-redesign.md)** —
> 42 rute, satu bagian masing-masing, **300 kotak**, dengan penanda mana yang
> punya mockup (hanya 14 dari 42) dan mana yang harus diturunkan dari bahasa
> desainnya. Bagian di bawah ini menyusun pekerjaan menurut **urutan bangun**;
> berkas itu menyusunnya menurut **apa yang dibuka pengguna**. Dua sudut pandang
> atas pekerjaan yang sama — bukan dua rencana.

> **Kenapa fase sendiri, bukan sekadar ganti token.** Doc §7 memecah ruang baca jadi
> **dua tipe** — Type A tanpa chrome sampai diketuk, Type B dengan chrome permanen dan
> empat pilihan harga. Itu perilaku, bukan warna. Dan Type B **adalah** Fase 5b: gerbang
> per cerita, auto-unlock tercentang default, lembar saldo kurang tiga jalan keluar.
> Fase 5b dikerjakan di sini, bukan dua kali.

### R1 — Token, tipografi & primitif · 2–3 hari · **selesai**

- [x] `tokens.css` ditulis ulang ke palet putaran 7 — kertas `#f4f2ef`, baca `#faf8f5`, panel putih, malam `#171513`/`#211d19` · `P0` · `[PRODUK]`
- [x] **Dua emas, bukan satu** — `#7d5411` untuk teks (saldo, rating, harga terkunci, `See all`) dan `#b68235` untuk garis, batang progres, titik tab, badge · `P0` · `[PRODUK]`
  ↳ Diambil dari piksel mockup, bukan dari doc — doc hanya menulis `var(--color-accent)` tanpa hex. Emas dekoratif `#b68235` cuma 3,0:1 di atas kertas; sebagai teks ia melanggar AA, dan mockup-nya sendiri memang memakai yang gelap untuk teks.
- [x] **Tinta aksi jadi `#1c1a18`, bukan emas** — tombol utama, tab aktif, garis bawah tab. Emas tidak pernah jadi isi besar (doc §1) · `P0` · `[PRODUK]`
- [x] Tinta metadata dinaikkan dari mockup `#8a827a` (3,4:1) ke `#6f6862` (4,9:1) — preseden sama dengan PRD 01 §9.2 rec #8 · `P0` · `[DESAIN]`
- [x] Lora + Plus Jakarta Sans menggantikan Cormorant Garamond + Manrope; self-host `@fontsource`, **runtime tetap 12 paket** · `P0` · `[PRODUK]`
- [x] **Dua tipografi satu tugas masing-masing** (doc §1): serif untuk yang *adalah* cerita — judul, isi bab, isi komentar, judul layar, angka di blok statistik. Sans untuk yang dikatakan aplikasi tentang dirinya · `P0` · `[PRODUK]`
- [x] Garis menggantikan bayangan — hairline `#e6e2db`/`#e2ddd5`; bayangan **hanya** di sampul buku · `P0` · `[PRODUK]`
- [x] Sampul radius 4–6px potret + jaket satu huruf saat tanpa artwork; **tidak ada lagi ubin "album" radius 16** · `P0` · `[PRODUK]`
- [x] Token mati dibuang — `nv-cat-popular/trending/editors` nol pemakai di `.tsx` · `P2` · `[LUAR]`
- [x] Primitif: kepala section (9,5px/800/`.16em` + garis 1px + aksi kanan) dan `Cover`; `ModernTabBar` lima tab dengan titik emas 5px · `P0` · `[PRODUK]`
  ↳ Baris daftar berpembatas **tidak** jadi komponen — yang sama di empat daftarnya cuma pembatasnya, dan itu satu utility. Alasannya di `novelova-v2/todo-redesign.md`.
- [x] Tombol tiga tingkat: utama isi `#1c1a18` pill · sekunder hairline pill · tersier teks tebal tinta redup. **Destruktif tetap abu, tidak pernah isi merah** · `P0` · `[PRODUK]`
- [x] Sakelar 44×26, padding 3, knob 20, jarak 18px; nyala `#1c1a18` (emas di baca-malam) · `P1` · `[PRODUK]`
- [x] Formulir: input satu baris jadi garis bawah `1.5px #dcd6cd` dengan teks serif; multi-baris kotak hairline; penghitung rata kanan di baris label · `P0` · `[PRODUK]`
- [x] `/dev/kitchen-sink` menampilkan seluruh primitif baru, terang dan malam · `P0`
- [x] **Test:** `check-tokens.mjs` tetap bersih — nol hex di luar `tokens.css`

### R2 — Beranda & discovery · 2–3 hari · mockup `7a` · **selesai**

- [x] Kepala: "Hi, Anna" serif + "Enjoy your reading today", chip koin, ikon urut **Cari → Notifikasi → Pengaturan section** · `P0`
- [x] Karusel banner tiga cerita — kartu hairline, sampul 66×88, baris caption, pill `Read now`. Seluruh kartu bisa diketuk dan **pill tidak menembak navigasi dua kali** · `P0`
- [x] Tab genre teks dengan fade tepi kanan yang **muncul hanya saat strip benar-benar bisa digulir** · `P1`
- [x] `POPULAR` baris 112px: sampul + badge peringkat, judul serif, penulis, `★ rating` + jumlah baca, `See all` di kepala · `P0`
- [x] `NEW & TRENDING` dengan badge `Rising`/`New`/`Hot` + garis pertumbuhan emas · `P0`
- [x] `EDITOR'S PICKS` kartu lebih lebar dengan kutipan serif italic satu baris per cerita · `P0`
- [x] `TOP ROMANCE` daftar vertikal berperingkat · `CONTINUE READING` daftar dengan batang progres hairline, persentase, tombol play terisi · `P0`
- [x] Dua slot iklan berlabel `BERSPONSOR`: pita ramping dan satu yang berbentuk baris cerita · `P0`
- [x] FAB koin lingkaran 48px **kiri bawah** — ia tidak boleh duduk di bawah `See all` yang rata kanan · `P0` · `[PRODUK]`
- [x] Padding bawah feed ≥158px supaya baris terakhir lolos dari FAB dan bilah tab · `P0`
  ↳ `AppShell` memakai `var(--nv-bottom-nav)` + 4,75rem = **162px**. Angkanya turunan, bukan tulisan tangan: menaikkan tinggi bilah nav otomatis menaikkan ruang bawahnya juga.
- [x] Genre menyaring blok 4·6·7·8 saja — **banner, iklan, dan Lanjut Membaca tidak pernah tersaring** · `P0`
- [x] Section kosong **disembunyikan seluruhnya**, bukan menyisakan kepala kosong — tetapi barisnya tetap ada di lembar pengaturan · `P0` · `[PRODUK]`
- [x] **Test:** genre menyaring empat blok dan meninggalkan tiga; section tanpa isi hilang dari feed tapi tetap di lembar pengaturan

### R2b — Susunan ulang beranda · 2–3 hari · `[PRODUK]` · §1.22 · **selesai**

**Permintaan produk 5 September**, enam keputusannya dikonfirmasi lewat
pertanyaan langsung sebelum kotak-kotak ini ditulis. Ia menimpa sebagian `7a`
dan **membatalkan aturan brief §4 ("daftar mengalahkan kartu") untuk beranda
saja**; alasan, batas, dan apa yang hilang ada di `architecture.md` §1.22. Yang
tetap dari `7a`: kepala, chip koin, tab teks, kepala section. Yang ditimpa:
**urutan blok, bentuk section, ukuran sampul**.

Ia juga **menimpa sebagian §1.6** — tiga section teratas tidak lagi ikut
tersaring tab.

Dikerjakan sesudah R3 (selesai) dan boleh mendahului R4; tidak ada yang saling
menunggu.

#### R2b-a — Data contoh · **dikerjakan pertama**

Section tidak bisa ditata sebelum isinya cukup. Simulasi seed hari ini
(`scripts/cek-beranda.mjs`) menemukan **11 dari 26 section di bawah tab berisi
kurang dari 4 cerita** — tidak cukup mengisi satu baris sampul 80px. Sebagai
daftar tegak itu tidak kelihatan; sebagai rel mendatar, ruang kosong di kanan
terbaca sebagai gagal memuat. Yang terburuk: Fantasy "Dunia Lain" **1 cerita**,
Mystery dan CEO "Tamat & Siap Dibaca" **1 cerita**.

- [x] `FILLER` berhenti jadi `[judul, genres]` dan membawa **`status`, `monetize`, dan `tags` sendiri** · `P0` · `[LUAR]`
  ↳ Hari ini ketiganya **diturunkan dari indeks** di `seed.ts`: `i % 5 === 3` menentukan gratis, `FILLER_STATUS[(i-8) % 4]` menentukan status, dan `tagsFor(genres, i)` memilih `pool[i % pool.length]`. Artinya isi sebuah section tidak bisa diatur tanpa menghitung mundur posisi tiap judul — dan judul baru yang disisipkan di tengah menggeser atribut semua yang sesudahnya. Selama atributnya turunan indeks, "tiap section ≥ 6" adalah target yang tidak bisa dipegang.
- [x] Katalog contoh ditambah sampai **tiap section di bawah tab berisi ≥ 6 cerita** · `P0` · `[PRODUK]`
  ↳ Dari 40 judul sekarang ke sekitar 60. Yang perlu diisi paling banyak: `Tamat & Siap Dibaca` untuk Fantasy · Mystery · CEO · Thriller · My Kisah (empat di antaranya 0 atau 1), lalu tag `dunia lain`, `kasus tertutup`, `pernikahan kontrak`, `kejar-kejaran`, `kehilangan`, `musuh jadi cinta`.
- [x] Tiap judul baru dapat **sinopsis sendiri** yang kalimat pertamanya berdiri sendiri · `P0`
  ↳ Aturan Langkah 46, dan masih berlaku walau `PullQuote` dihapus dari beranda: kalimat pertama sinopsis tetap dipakai di tempat lain, dan 40 cerita yang berbagi satu sinopsis pernah lolos sampai ada layar yang menampilkannya.
- [x] Semuanya masuk `src/api/mock/data/catalog.ts`, **bukan** `seed.ts` · `P0`
- [x] Ambang "tiap section ≥ 6" dijaga **`tests/unit/beranda-data.test.ts`**, bukan skrip · `P0` · `[LUAR]`
  ↳ Rencananya `scripts/cek-beranda.mjs` di `npm run check`; jadi test karena test bisa **mengimpor modulnya** dan memanggil `getHomeFeed` yang sungguhan. Skrip harus mem-parse `catalog.ts` sebagai teks, dan parser seperti itu tetap hijau sambil salah begitu aturan penyusunan section berubah. Ia tetap satu cek yang bisa dijalankan, hanya lewat `npm test`.
- [x] **Keadaan kosong genre dijaga test unit saja** — tidak ada sakelar dev · `P1` · `[PRODUK]`
  ↳ Dikonfirmasi. Konsekuensinya disebut terang: setelah katalog ditambah, **tidak ada genre yang benar-benar kosong**, jadi layarnya tidak akan pernah terlihat di aplikasi yang jalan. Ia hanya hidup di test.
- [x] `Cover.tsx` dapat **`onError` yang membuang `src`**, sehingga sampul gagal-muat jatuh ke jaket satu hurufnya · `P0` · `[PRODUK]`
  ↳ Sampul contoh adalah URL jarak jauh (`assets.kbm-cdn.com`). Tanpa ini, CDN mati atau perangkat offline memunculkan ikon gambar rusak — bukan jaket. Beranda 80px memuat ~30 gambar, bukan ~12 seperti sekarang, dan seluruh inti fitur zoom adalah gambarnya.
- [x] **Test:** sampul yang `onError` menampilkan huruf jaketnya, bukan `<img>` kosong

#### R2b-b — Susunan blok & tiga section global

- [x] Urutan baru: **3 section prioritas → banner → tab genre → section lainnya → Lanjut Membaca** · `P0` · `[PRODUK]`
  ↳ Sekarang kebalikannya: `HomePage.tsx` merender `GenreTabs`, lalu `BannerCarousel`, lalu seluruh section menurut urutan server. Dua berkas berubah: susunan JSX di `HomePage.tsx` dan larik `sections` di `handlers/home.ts:97`.
- [x] Tiga section prioritas = `FIXED` yang sudah ada — **Populer · Baru & Naik Cepat · Paling Banyak Dibuka** (`handlers/sections.ts:37`). Tidak ada section baru dibuat · `P0`
- [x] **Ketiganya berhenti tersaring tab** — dibangun dari `all`, bukan `inTab`, sejajar dengan `BANNER` dan `CONTINUE` · `P0` · `[PRODUK]`
  ↳ Inilah yang membuat urutan barunya masuk akal: tab genre duduk **di bawah** ketiganya, jadi kalau isinya ikut berubah, pembaca menekan kontrol yang mengubah sesuatu di luar layar. Ini **menimpa §1.6**, yang menandai ketiganya "ikut tersaring: ya".
- [x] `sectionsFor()` dipecah — `FIXED` tidak lagi ikut di dalamnya, karena ia kini dibangun dari kolam cerita yang berbeda · `P0`
  ↳ `findSection()` (dipakai `getSection` untuk `/jelajah`) tetap harus menemukan ketiganya; memecah `sectionsFor` tanpa memperbaiki `findSection` mematikan halaman lihat-semua ketiga section itu, dan gejalanya muncul jauh dari sini.
- [x] Docstring `handlers/home.ts` aturan 1 & 2 diperbarui — sekarang ia menulis "tiga section pertama … tetap ikut tersaring tab itu", dan itu jadi salah · `P1`
- [x] Banner tetap tidak tersaring, dan sakelar `sec-banner` tetap mematikannya di posisi barunya · `P1`
- [x] `SectionSettings` menampilkan barisnya **menurut urutan baru** — daftar sakelar yang urutannya beda dari halaman yang diaturnya bukan pengaturan · `P1`

#### R2b-c — Keadaan kosong pindah ke bawah tab

- [x] Genre tanpa isi **tidak lagi mengosongkan seluruh beranda**: tiga section atas dan banner tetap tampil, dan pesan kosongnya muncul **tepat di bawah tab genre** · `P0` · `[PRODUK]`
- [x] `hasDiscovery` (`HomePage.tsx`) dinilai dari **section di bawah tab saja** — `GENERIC` + `CURATED`. Dengan ketiga section atas kini selalu ada, menilainya dari seluruh feed membuat pesan kosong tidak pernah muncul · `P0`
- [x] Pesannya tetap membawa tombol kembali ke `Semua`, dan tetap `EmptyState`, bukan `FailureNotice` — kosong ≠ gagal (FR-CORE-03) · `P0`

#### R2b-d — Semua section genre jadi rel mendatar

- [x] `shapeOf()` (`StorySection.tsx:22`) menyusut jadi **dua bentuk**: `rail` untuk seluruh section genre, `continue` untuk Lanjut Membaca · `P0` · `[PRODUK]`
  ↳ `ranked` (daftar tegak bernomor) dan `rail-wide` (160px + kutipan) dihapus. Empat bentuk jadi dua.
- [x] **Lanjut Membaca tetap daftar tegak** — ia membawa batang progres, "Bab 45 dari 120", dan tombol lanjut; ketiganya butuh lebar satu baris penuh · `P0` · `[PRODUK]`
- [x] Nomor peringkat `#1 #2 #3` milik bekas `ranked` pindah ke **badge sampul**, mekanisme yang sudah dipakai Populer · `P0`
- [x] `PullQuote` **dihapus** beserta pemakaiannya — tiga baris serif miring tidak terbaca di bawah sampul 80px · `P1` · `[PRODUK]`
  ↳ Kehilangan nyata dari `7a` §7, dikonfirmasi. Kalimat pertama sinopsis tetap dipakai di tempat lain, jadi sinopsis seed tidak perlu ditulis ulang.
- [x] `GrowthNote` (`+N baca minggu ini`) bertahan — satu baris pendek, masih muat · `P1`
- [x] Rel tetap `snap-x` + `overflow-x-auto` + `-mx-4 px-4`, dan tetap **tidak menggeser badan halaman** di 320px · `P0`
- [x] Tiap kartu di rel tetap bisa dicapai keyboard · `P0`

#### R2b-e — Sampul 80px

- [x] Sampul rel jadi **80px** (`w-20`, tinggi 120px pada rasio 2:3), dari 112px sekarang · `P0` · `[PRODUK]`
  ↳ Angkanya dipilih dari lebar tersempit yang wajib lulus: di **360px** ia memberi **3,9 sampul** (sekarang 2,9), di 320px **3,4**.
- [x] Huruf jaket ikut mengecil sendiri — `Cover.tsx` memakai `text-[2.6em]`, relatif; tidak ada yang perlu disentuh · `P1`
- [x] Judul kartu dua baris; `★ rating` + jumlah baca tetap satu baris di bawahnya · `P0`
- [x] Badge sampul (`#1 Populer`, `Rising`, `Hot`) tetap terbaca di 80px — kalau tidak, **badge-nya** yang dipendekkan, bukan sampulnya yang dibesarkan lagi · `P1`

#### R2b-f — Ketuk sampul → sampul membesar · `[PRODUK]`

- [x] **Sampul jadi target sendiri**: menekannya membuka lapisan sampul besar di tengah layar dengan latar diredupkan. **Judul di bawahnya tetap tautan** ke `/cerita/:id` · `P0` · `[PRODUK]`
  ↳ Perubahan **struktur kartu**, bukan sekadar handler: sekarang seluruh `StoryCard` satu `<a>`. Sampul harus jadi `<button>` **di luar** tautan judulnya — tombol di dalam tautan bukan HTML yang sah.
- [x] `StoryCard` dapat prop opsional `onCoverClick`; **hanya beranda yang mengopernya** · `P0`
  ↳ Menaruh lapisannya di `StoryCard` berarti `/jelajah`, `/pustaka`, dan `/cari` ikut berubah tanpa diminta. Lapisannya sendiri tinggal di `features/home/`.
- [x] Lapisannya membawa **jalan ke ceritanya**: judul, penulis, dan tombol `Buka cerita` · `P0`
- [x] Animasi **zoom-in**: sampul tumbuh dari posisi & ukurannya di rel menuju ukuran besar di tengah, ~180ms, `ease-out` · `P0` · `[PRODUK]`
- [x] **`prefers-reduced-motion` mematikan animasinya** — lapisannya tetap muncul, hanya tanpa tumbuh · `P0`
  ↳ Bukan kesopanan: brief §8 melarang apa pun "membesar", dan §1.22 mencatat kenapa larangan itu ditimpa. Menimpanya juga untuk yang memintanya mati adalah dua pelanggaran, bukan satu.
- [x] Esc menutup, ketuk latar menutup, fokus terkunci selama terbuka lalu **kembali ke sampul yang ditekan** · `P0`
- [x] Gulir halaman terkunci lewat `useScrollLock` yang sudah ada (`lib/a11y.ts`) — jangan tulis yang baru · `P1`
- [x] Cerita tanpa artwork membuka **jaket satu hurufnya** yang diperbesar, bukan lapisan kosong · `P1`

#### R2b-g — Test

- [x] **Test:** urutan blok — tiga section prioritas mendahului banner, banner mendahului tab genre
- [x] **Test:** ganti tab **tidak** mengubah isi ketiga section atas, dan **mengubah** section di bawah tab
- [x] **Test:** genre tanpa isi → pesan kosong muncul di bawah tab, sementara tiga section atas dan banner **tetap tampil**
- [x] **Test:** tiap section genre adalah rel mendatar; Lanjut Membaca tetap daftar tegak berbatang progres
- [x] **Test:** menekan sampul membuka lapisan dan **tidak** bernavigasi; menekan judul bernavigasi ke `/cerita/:id`
- [x] **Test:** Esc menutup lapisan dan fokus kembali ke sampul yang ditekan
- [x] **Test:** dengan `prefers-reduced-motion: reduce`, lapisan tetap terbuka tanpa kelas animasinya
- [x] **Test:** `/jelajah`, `/pustaka`, `/cari` **tidak** ikut punya lapisan zoom — sampulnya tetap bagian dari tautan
- [x] **Test e2e:** beranda tidak menggeser badan halaman di **kelima lebar** setelah susunan baru

### R3 — Detail cerita, reader Type A & komentar · 4–5 hari · mockup `7b` `7u` `7v` `7f` `7g` `7t` `7w` · **selesai**

- [x] Detail cerita: panel kepala putih (sampul 94×136, judul serif, penulis, pill genre) · `P0`
- [x] **Strip statistik empat sel** `★ RATING` · `BAB` · `DURASI BACA` · `STATUS` — durasi baca menggantikan metrik pamer · `P0` · `[PRODUK]`
- [x] Kartu monetisasi hairline ("7 bab pertama gratis" + harga per bab dan akses penuh) · `P0`
  ↳ Dua angka baru dari server (`freeChapterCount`, `paidPriceFrom`), alasan sama dengan durasi baca: daftar bab datang 20 per halaman. Bab gratis dihitung sebagai **awalan**, bukan jumlah — copy-nya berbunyi "N bab *pertama* gratis", dan itu bohong kalau yang gratis tersebar di tengah.
- [x] `DAFTAR BAB`: nomor, judul serif, durasi/status, lalu **centang (sudah dibaca) atau harga emas + gembok (terkunci)** · `P0`
- [x] Bilah bawah lengket menyebut bab terakhir dibaca + tombol `Lanjutkan` · `P0`
  ↳ `bottom-[var(--nv-bottom-nav)]`, bukan `bottom-0` (`CLAUDE.md` §8). FAB koin tidak lagi dirender di halaman `/cerita/*` — dua elemen melayang di sudut yang sama saling menindih, dan `7b` juga tidak menggambarnya.
- [x] **Type A — chrome tersembunyi sejak awal.** Hanya pembuka bab (`BAB 3`, judul serif, garis emas), badan serif, dan hairline progres 1,5px di dasar layar · `P0` · `[PRODUK]`
  ↳ Bab **terkunci** dikecualikan: bilah atasnya selalu terlihat (`7x`). Tanpa itu bab terkunci tidak punya tombol kembali sampai pembaca menebak bahwa layar bisa diketuk.
- [x] **Satu ketukan pada teks membuka kontrol** — bilah atas melayang (kembali, judul cerita, `Bab 3 dari 120 · 7 menit`, chip koin) dan bilah bawah melayang (bab sebelumnya · progres `3 / 120` · bab berikutnya) · `P0` · `[PRODUK]`
- [x] Baris kedua bilah bawah: **`Komentar bab` + jumlahnya**, pengaturan, penanda, dengarkan. Pill petunjuk "Ketuk teks sekali lagi untuk menyembunyikan" · `P0` · `[PRODUK]`
- [x] **Tombol komentar hanya hidup di overlay ini — tidak pernah di akhir bab.** Menekannya membuka lembar komentar di atas teks, posisi baca tidak pernah hilang · `P0` · `[PRODUK]`
  ↳ Tautan komentar di akhir bab **dicabut**, dan test-nya dibalik jadi menjaga aturan itu. Isinya satu komponen `ChapterComments` yang dirender halaman `7t` **dan** lembar `7w` — dan karena ruang baca tidak boleh mengimpor dari `features/story` (aturan struktur #2), komponen, `CommentRow`, `ModerationActions`, serta hook-nya naik ke `components/patterns/` dan `hooks/`.
- [x] Pengaturan baca jadi panel hairline **di dalam alur**, bukan lembar terpisah: slider ukuran font dengan nilai px, sakelar Serif/Sans/Lega, tema gelap, buka-bab-otomatis · `P0`
- [x] Baca-malam: `#171513` halaman, `#211d19` panel, `#ddd6cd` badan, aksen emas termasuk tombol `Bab 4 ›` · `P0`
- [x] Slot bersponsor di antara paragraf sebagai pita hairline, **tidak pernah kartu** · `P1`
- [x] Komentar bab dalam **dua wadah isi sama** — halaman penuh `7t` dan lembar di atas reader `7w`. Di lembar, komposer menempel di dasar dan menutupnya mengembalikan posisi gulir **persis** · `P0` · `[PRODUK]`
- [x] Baris aksi komentar: `Suka` (hitungan emas) · `Balas` · `Laporkan` · `Blokir pengguna`; balasan menjorok di balik garis 1px dengan baris aksinya sendiri yang lebih kecil · `P0`
- [x] **Test:** satu ketukan membuka kontrol, ketukan kedua menutupnya; membuka lembar komentar lalu menutupnya mengembalikan `scrollTop` yang sama
- [x] **Test:** ukuran font dan tema bertahan lintas bab **dan** lintas muat ulang
- [x] Sisa kulit yang hanya terlihat dari sudut pandang per halaman: sinopsis & judul voucher jadi serif, badan ulasan `RateSheet` jadi serif di wadah `--nv-line-soft`, dan halaman komentar mencetak **rujukan babnya** · `P1` · `[LUAR]`
  ↳ Ketiganya tidak ada di daftar R3 ini tetapi ada di `todo-redesign.md`, yang memandang pekerjaan yang sama per halaman — brief §2 menaruh sinopsis, judul voucher, dan isi ulasan di sisi "yang *adalah* cerita", jadi ketiganya Lora. Rujukan bab hanya perlu di halaman `7t`: lembar `7w` punya babnya terbuka di belakangnya. `useChapter` ikut naik ke `src/hooks/` dengan alasan yang sama seperti `useComments` di R3c — aturan struktur #2.

### R4 — Reader Type B & ekonomi buka bab · 4–6 hari · mockup `7x` `7y` `7z` `7aa` `7h` · **selesai — menutup Fase 5b**

Aturan dan alasannya di `architecture.md` **§1.19** (izin per cerita) dan **§1.21**
(auto-unlock jadi alur utama + pita bundling, beserta keadaan kode sekarang).

**Urutannya mengikat: server dulu, layar belakangan.** Empat kolom data dan tiga
metode seam di bawah dipakai hampir semua kotak sesudahnya; membangun layarnya
lebih dulu berarti menulisnya dua kali.

> **Dua hal yang tidak seperti dikira** — diperiksa, bukan diasumsikan:
> `readerPrefs.autoUnlockStoryIds` **belum ada** (§1.19 menyebutnya sebagai
> rencana), dan izin buka-otomatis hari ini adalah **sakelar global di
> `stores/readerSettings.ts`** — yang berarti sebuah izin memotong koin sedang
> melanggar aturan struktur #5. R4a dan R4b menutup keduanya.

#### R4a — Data & seam · **dikerjakan pertama**

- [x] `ReaderPrefsSchema` (`api/contracts/user.ts:68`) + tiga kolom: `autoUnlockStoryIds` · `autoUnlockCounts` (`Record<storyId, number>`) · `bundleOfferSeenStoryIds`, semuanya `.default(...)` · `P0` · `[PRODUK]`
- [x] **`emptyReaderPrefs()` di `api/mock/defaults.ts` jadi satu-satunya bentuk awal**; seed, pembuatan akun, fallback onboarding, dan berkas test memakainya · `P0` · `[LUAR]`
  ↳ Rencananya mengisi ketiga tempat itu satu per satu. Diganti satu pabrik karena jebakannya justru pengulangannya: melewatkan salah satu tempat membuat pengguna baru punya `undefined` di jalur uang, dan gejalanya muncul jauh dari sebabnya. Tempat keempat memang ada dan tidak disebut rencana — berkas test.
- [x] `SERVER_CONFIG.bundleOfferAfter = 10` di `api/mock/config.ts` — **bukan** `lib/coin.ts`: ia tuas kebijakan, dan §1.13 sudah menetapkan angka kebijakan harus bisa berubah tanpa rilis · `P0` · `[PRODUK]`
- [x] `UnlockInputSchema` + `enableAutoUnlock?: boolean` — beli bab **dan** nyalakan izinnya dalam **satu** panggilan. Di gerbang itu memang satu tindakan; memecahnya membuka keadaan "koin terpotong, izin gagal tersimpan" · `P0` · `[PRODUK]`
- [x] `UnlockInputSchema` + `auto?: boolean` — menandai pembukaan yang dilakukan aplikasi sendiri. **Satu-satunya gunanya menaikkan penghitung** · `P0`
- [x] `unlockChapter` menaikkan `autoUnlockCounts[storyId]` **hanya bila `auto === true` dan `alreadyOwned === false`** · `P0`
  ↳ Kunci idempotency yang terpakai ulang tidak memotong koin; menaikkan penghitung di sana mendekatkan pembaca ke tawaran belanja tanpa ia membayar apa pun.
- [x] `setAutoUnlock(storyId, on)` — mengikuti pola `hideStory(storyId)` yang sudah ada: mutator sempit, bukan `updatePrefs` serba bisa · `P0`
- [x] `BundleOfferSchema` + `getBundleOffer(storyId, chapterId)` — mengembalikan `null` bila belum waktunya. **Server yang memutuskan**, karena ambangnya kebijakan dan angka hematnya harus dari harga bab sungguhan · `P0` · `[PRODUK]`
- [x] `getBundleOffer` memakai **`scopeOf(userId, chapter, 'bundle')` yang sudah ada** dan mengembalikan `individualCoins` — tidak ada aritmetika harga baru di mana pun · `P0`
- [x] `dismissBundleOffer(storyId)` menulis `bundleOfferSeenStoryIds` · `P1`
- [x] Ketiganya terdaftar di `api/client.ts` dan ikut lewat spread `unlockHandlers`; jumlah metode `NovelovaApi` **109 → 112** (dihitung ulang dari berkasnya) · `P0`
  ↳ Tidak ada `handlers/index.ts` — perakitnya `mock/index.ts`, dan registrasinya otomatis lewat spread. Yang menahan kalau sebuah metode lupa didaftarkan adalah `Pick<NovelovaApi, …>` di tiap berkas handler, bukan daftar manual.
- [x] **Test unit handler:** izin tersimpan per cerita · penghitung naik sekali per pembukaan otomatis · **tidak** naik pada pemakaian ulang kunci idempotency · `getBundleOffer` `null` sebelum ambang dan berisi sesudahnya · cerita lain menghitung dari nol

#### R4b — Cabut sakelar global auto-unlock

- [x] Lima berkas, sekaligus: `stores/readerSettings.ts` · `lib/coin.ts:86` (`READER_DEFAULTS.autoUnlock`) · `features/reader/components/ReaderSettingsPanel.tsx:52-55` · `i18n/id.ts:47-48` · `tests/unit/readerSettings.test.ts` · `P1` · `[PRODUK]`
  ↳ Dua sakelar untuk satu hal saling membingungkan, dan yang global melanggar aturan struktur #5.
- [x] `ReaderPage.tsx:130` membaca izin dari **`getReaderPrefs()`**, bukan dari store · `P0`

#### R4c — Gerbang Type B · mockup `7x`

- [x] **Bilah atas selalu terlihat** — kembali → judul + `Lanjutan Terkunci` → chip koin `15,3rb +23` → dengarkan → pengaturan. Type A menyembunyikannya; Type B tidak boleh · `P0` · `[PRODUK]`
- [x] Bagian gratis membaca persis seperti Type A, lalu berhenti di blok gerbang · `P0`
- [x] Gerbang: badge mahkota `PREMIUM CONTINUATION`, `mulai 1.5rb koin + bonus` rata kanan, kalimat penuntun · `P0`
- [x] Label `PRATINJAU TERSENSOR` **tidak diburamkan**; paragraf di bawahnya buram, memudar ke permukaan, dan **`aria-hidden="true"`** · `P0`
- [x] Gerbang membawa `aria-label="Locked continuation gate"` · `P0`
- [x] **Ringkasan saldo di dalam gerbang** (`15.3rb koin` + `+23 bonus`) — supaya pembaca tidak perlu melihat ke atas untuk memutuskan · `P0` · `[PRODUK]`
- [x] Empat pilihan **berurutan**: `Chapter ini` (utama, terisi) · `10 chapter` · `Buka sampai tamat` · `Tonton iklan` dengan kuota `2/3 hari ini` · `P0`
- [x] Harga dan lencana hemat tiap pilihan dari **`getUnlockOptions`**, tidak pernah dari konstanta — `PRICE_SINGLE` sudah jadi kode mati dan harga bab berbeda-beda per bab · `P0`
- [x] Pilihan yang tidak mencakup bab apa pun **tidak dirender** — handler sudah membuangnya; layar tidak boleh mengembalikannya · `P1`
- [x] **`Buka otomatis untuk cerita ini` menutup gerbang, tercentang default**, dengan satu baris keterangan bahwa bab berbayar berikutnya terbuka sendiri · `P0` · `[PRODUK]`
- [x] Menekan `Chapter ini` dengan kotak tercentang mengirim **satu** panggilan `unlockChapter({ source: 'coin', enableAutoUnlock: true })` · `P0`

#### R4d — Setelah terbuka · mockup `7y`

- [x] Buram hilang, badge jadi `CHAPTER TERBUKA` + gembok terbuka + `−1.5rb koin` · `P0`
- [x] **Saldo berubah di semua tempat sekaligus** — bilah atas, gerbang, chip beranda · `P0`
  ↳ Jebakan lama: layar sukses membaca saldo dari hasil pesanan sementara bilah atas menunggu `['wallet']` diambil ulang. Assertion yang memotret keduanya sekaligus gagal sesekali (`CLAUDE.md` §8).
- [x] Toast `Chapter dibuka · −1.5rb koin` (2,6 dtk, `role="status"`) · `P0`
- [x] Baris status auto menawarkan **`Matikan`** → `setAutoUnlock(storyId, false)`. Izin memotong koin tanpa tombol mati bukan izin · `P0`
- [x] Toast auto-unlock **berbunyi beda**: `Chapter dibuka otomatis · −1.5rb koin` · `P1` · `[PRODUK]`
- [x] Buka bab **idempoten**: ketukan kedua setelah berhasil tidak pernah menagih lagi · `P0`
- [x] Setelah terbuka, permukaan bacanya **berperilaku sebagai Type A** · `P0`

#### R4e — Saldo kurang · mockup `7z`

- [x] **Lembar, bukan toast** — kekurangan tepatnya sebagai judul serif (`Kurang 1.200 koin`), harga dan saldo di bawahnya · `P0`
- [x] **Tiga** jalan keluar: `Isi koin` (menyorot paket terkecil yang cukup) · `Pakai voucher` (dengan jumlah voucher aktif) · `Tonton iklan` (dengan kuota) · `P0`
  ↳ Permintaan produk 4 September menyebut dua; voucher tetap ada karena ia satu-satunya jalan yang tidak menuntut uang **maupun** menonton iklan, dan lembar buntu yang menawarkan lebih sedikit melanggar §1.4.
- [x] Menyatakan **membatalkan mengembalikan ke bab yang sama dengan gerbang masih terbuka** · `P0`
- [x] Lembar yang **sama** muncul saat auto-unlock menyala tetapi saldo kurang — tidak pernah diam, tidak pernah membeli tanpa izin · `P0`
- [x] Saldo **tidak diperiksa klien**: klien memanggil, server menolak dengan `INSUFFICIENT_COINS`, lembar dibuka dari kekurangannya · `P0`
  ↳ Harga ada di `Chapter.priceCoins` dan berbeda per bab; klien yang memeriksa sendiri harus menebak harganya (§1.21).
- [x] Lembar voucher (`7h`) dijangkau dari sini **dan** dari detail cerita — pertama kalinya voucher muncul di ruang baca · `P0`

#### R4f — Buka lewat iklan · mockup `7aa`

- [x] Chip hitung mundur, garis progres, "Bab dibuka setelah tayangan selesai" · `P0`
- [x] Catatan bahwa **kuota dipotong hanya setelah selesai** dan membatalkan tidak berbiaya · `P0`
- [x] Kartu gagal-muat menawarkan `Coba lagi` **dan** `Pakai 1.500 koin` · `P0`

#### R4g — Pita tawaran bundling · `[PRODUK]` · §1.21

- [x] **Pita non-blocking di pembuka bab**, bukan lembar dan bukan dialog — alur ini menjanjikan baca tanpa terputus · `P0` · `[PRODUK]`
- [x] Isinya dari `getBundleOffer`: harga bundel, jumlah bab, dan **hemat dihitung dari `individualCoins`** · `P0`
  ↳ Tidak boleh persentase tetap: `prd_00` §6 **dan** `prd_05` §2 langkah 5 sama-sama menulis "5%" padahal sepuluh bab seed berjumlah 17.200 melawan bundel 12.000 — **30%**. Yang membawa catatan "angkanya nominal" baru `prd_00`; jangan membaca `prd_05` apa adanya di titik ini.
- [x] Dua aksi: ambil bundel (`unlockChapter({ source: 'bundle' })`, **pembelian eksplisit**) dan tolak (`dismissBundleOffer`) · `P0`
- [x] Muncul **sekali per cerita**; ditolak berarti tidak muncul lagi di cerita itu · `P1` · `[PRODUK]`
- [x] Auto-unlock tetap **tidak pernah** membeli bundel atau paket tamat sendiri (FR-READ-09) · `P0`
- [x] Setelah bundel dibeli, sepuluh bab berikutnya **tidak dipotong lagi** — pengaman "bab belum terbuka" sudah menanganinya, jadi tidak ada saldo bundel yang perlu disimpan · `P0`
- [x] **Sakelar dev di `/dev/kitchen-sink`** yang melompatkan `autoUnlockCounts` ke ambangnya · `P0` · `[LUAR]`
  ↳ Tanpa itu pitanya nyaris tidak pernah terlihat saat dicoba dengan tangan: saldo contoh 15.300 habis di bab ke-12, **dua bab sebelum ambang**. Hitungannya di §1.21.

#### R4h — Test

- [x] **Test:** bab pertama bergerbang; bab kedua cerita yang sama terbuka tanpa dialog; bab pertama cerita **lain** bergerbang lagi
- [x] **Test:** menolak sakelar → tiap bab tetap bergerbang
- [x] **Test:** saldo kurang → lembar tiga jalan keluar, bukan diam
- [x] **Test:** ketukan kedua tidak menagih dua kali
- [x] **Test:** izin bertahan setelah muat ulang — **uji ulang paling murah untuk aturan struktur #5**
- [x] **Test:** pita muncul setelah pembukaan otomatis ke-10, tidak sebelumnya; ditolak → tidak muncul lagi di cerita itu; cerita lain menghitung dari nol
- [x] **Test:** membeli bundel dari pita → sepuluh bab berikutnya terbuka tanpa potongan tambahan, dan saldo berkurang **tepat** sekali
- [x] **Test e2e:** bab pertama → setuju → bab berikutnya mulus → koin habis → topup/voucher/iklan, **di dua lebar layar**
- [x] `/cerita/:id/bab/:id` masuk daftar sapuan lima lebar di `tests/e2e/isi-koin-di-hp.spec.ts` — gerbang, lembar, dan pita semuanya baru

> **Skala harga bab sengaja dibiarkan.** Paket koin terbesar (2.000) hanya cukup
> untuk satu bab, dan penulis cuma boleh mematok 1–50 koin — dua skala yang tidak
> mungkin benar bersamaan. Diputuskan dikerjakan belakangan; akibat yang bisa
> dihitung ada di `architecture.md` §1.21.

### R4b — Ruang baca menerus · 3–4 hari · `[PRODUK]` · §1.25 · **selesai**

**Permintaan produk 5 September**, diklarifikasi lewat diskusi setelah R4
selesai. Ia **menimpa bentuk navigasi bab** yang dibangun di R3b dan R4: bab
tidak lagi berhalaman, ia mengalir.

Empat keputusannya dikonfirmasi lewat pertanyaan langsung dan dicatat di §1.25.
**Yang paling penting dibaca lebih dulu:** ini menimpa §1.4 di satu titik —
potongan koin berhenti punya jejak di layar. Daftar apa yang **tidak** boleh ikut
dicabut ada di §1.25.

#### R4b-a — Rangka gulir menerus

- [x] Ruang baca memuat **beberapa bab dalam satu halaman**, disambung ke bawah · `P0` · `[PRODUK]`
- [x] Pemisah antar bab **garis rambut polos**, tanpa nomor dan tanpa judul · `P0` · `[PRODUK]`
  ↳ Pembuka bab besar (`BAB 6` + judul serif + garis emas) dari R3b **dicabut** untuk bab kedua dan seterusnya. Bab yang dibuka lewat tautan langsung tetap punya pembukanya — ia awal bacaan, bukan sambungan.
- [x] Bab berikutnya dimuat saat pembaca mendekati ujung bab sekarang, bukan saat menyentuhnya · `P0`
- [x] **Batas bab yang dimuat sekaligus**, dan yang terlama dilepas · `P1`
  ↳ `ponytail:` cerita 120 bab yang seluruhnya disambung menghabiskan memori dan membuat gulirnya tersendat. Virtualisasi penuh baru perlu kalau batas sederhana terbukti tidak cukup.
- [x] Ujung cerita tetap punya keadaan penutupnya sendiri — gulir yang berhenti tanpa kabar terbaca sebagai gagal memuat · `P0`

#### R4b-b — Bab terkunci di tengah gulir

- [x] **Izin ada + saldo cukup → dibeli diam-diam**, isinya langsung disambung tanpa jeda visual · `P0` · `[PRODUK]`
- [x] **Izin belum ada → gerbang `7x` disisipkan sebagai blok** di tempat isi babnya, bukan halaman baru · `P0`
  ↳ Ini momen persetujuannya, dan ia tetap wajib: tanpa gerbang, "tidak sadar" berubah jadi memotong koin tanpa izin.
- [x] **Izin ada + saldo kurang → lembar `7z`**, dan ini satu-satunya yang menginterupsi · `P0`
- [x] Toast `Chapter dibuka otomatis` dan lencana `CHAPTER TERBUKA` **dicabut** · `P0` · `[PRODUK]`
- [x] `READER_UNLOCK_FEEDBACK` disiapkan dengan dua nilai — `'none'` (bawaan) dan `'balance'` · `P1` · `[PRODUK]`
  ↳ Diminta pengguna: mode kedua belum dipakai, tetapi jalurnya disiapkan sekarang supaya menghidupkannya nanti tidak menuntut menulis ulang alurnya. Satu konstanta, satu tempat dibaca.
- [x] Baris status `Buka otomatis aktif` + `Matikan` **tetap ada** · `P0`
- [x] Buku besar tetap mencatat tiap potongan, dan chip saldo tetap satu angka dari `useWallet` · `P0`

#### R4b-c — Yang mengikuti bab yang terlihat

- [x] **Satu sumber "bab yang sedang terlihat"**, bukan empat pengamat · `P0`
  ↳ Ia menggerakkan judul bilah atas, tombol komentar, progres baca, dan URL sekaligus. Empat `IntersectionObserver` untuk satu pertanyaan adalah empat tempat yang bisa berselisih.
- [x] URL berganti lewat **`history.replaceState`**, bukan `navigate()` · `P0`
  ↳ `navigate()` melepas halaman dan membuang posisi gulirnya — persis yang alur ini berusaha hilangkan. Akibatnya tombol kembali peramban tidak menyusuri tiap bab yang dilewati, dan itu benar: pembaca tidak "pergi ke" bab 6.
- [x] Tombol bab sebelumnya/berikutnya dan penutup bab `Bab 4 ›` **dibuang** · `P0` · `[PRODUK]`
- [x] Bilah bawah tinggal komentar, pengaturan, dan dengarkan · `P0`
- [x] `Komentar bab` membuka komentar **bab yang terlihat**, dan jumlahnya ikut berganti · `P0`
- [x] TTS membaca bab yang terlihat · `P1`
- [x] Progres baca disimpan per bab yang terlihat, memakai `scrollByChapter` yang sudah ada (§1.24) · `P0`

#### R4b-d — Test

- [x] **Test:** dua bab tersambung dalam satu halaman, dipisah garis, tanpa tombol di antaranya
- [x] **Test:** melewati batas bab mengganti URL **tanpa** melepas halaman — posisi gulirnya tidak berubah
- [x] **Test:** izin ada + saldo cukup → bab terkunci tersambung tanpa gerbang dan tanpa toast
- [x] **Test:** izin belum ada → gerbang muncul sebagai blok di tengah gulir, bukan halaman baru
- [x] **Test:** saldo kurang → lembar `7z`, dan gulirnya berhenti di sana
- [x] **Test:** tombol komentar mengikuti bab yang terlihat
- [x] **Test:** `READER_UNLOCK_FEEDBACK = 'balance'` memunculkan perubahan saldo; `'none'` tidak memunculkan apa pun
- [x] **Test e2e:** membaca menerus melewati tiga bab di **dua lebar**, dan tidak ada satu pun tombol lanjut yang ditekan

### R5 — Pustaka, pencarian, lihat-semua, profil · 2–3 hari · mockup `7c` `7e` `7d` `7i` `7s` · **selesai**

- [x] Pustaka: judul serif + baris hitungan, tab teks (Semua · Sedang dibaca · Selesai · Belum dimulai), lalu **satu daftar berpembatas** — sampul, judul serif, kata status rata kanan, penulis, batang progres `Bab 8 / 88`. **Tanpa kartu, tanpa blok hero** · `P0` · `[PRODUK]`
- [x] Pencarian: kueri serif di atas garis bawah, saran hidup (label + tipe `Cerita`/`Tag` di kanan), pill saringan, daftar `CERITA` dengan jumlah hasil, grup pill `TAG TERKAIT` · `P0`
- [x] Lihat-semua: **satu tata letak untuk empat kategori** — hanya judul, baris hitungan, dan badge yang berganti. Tab periode teks, urut sebagai aksi rata kanan, tiap baris membawa peringkat, sampul, judul serif, `★`/baca/bab, pill `Simpan` ↔ `Tersimpan`, dan `···` · `P0`
- [x] Saringan + urutan tetap hidup di URL; 20 per muat dengan baris skeleton · `P0`
- [x] Profil: label `PROFIL`, avatar, nama serif, baris keanggotaan, `Sunting` hairline; panel koin putih (`KOIN KAMU`, saldo serif, jumlah voucher aktif, `Isi Koin` terisi); strip tiga sel; daftar `AKUN` enam baris; `Keluar` sebagai teks redup · `P0`
- [x] Lembar pengaturan section: sembilan baris berketerangan + sakelar, berlaku dan tersimpan seketika, `Selesai` dan `Atur ulang` di dasar. **Kesembilan baris tetap terdaftar walau section-nya sedang disembunyikan karena kosong** · `P0` · `[PRODUK]`

### R6 — Author studio, buat cerita, riwayat cetak · 3–4 hari · mockup `7j` `7m` `7n` `7k` `7l` `7o`–`7r` · **selesai**

- [x] Studio: "Studio penulis" serif, strip empat sel di atas putih (Story · Dibaca · Pengikut · Koin emas), `Buat story baru` terisi, baris tautan cepat hairline, tab status teks · `P0`
- [x] Daftar karya: sampul, judul serif, kata status berwarna status, genre + tanggal, baca/rating/bab, **alasan penolakan dikutip di balik garis bernuansa merah**, baris aksi Edit · Bab · Pratinjau · Analisa dengan `Hapus` didorong ke kanan sebagai teks redup · `P0`
- [x] Jadwal terbit: strip tiga penghitung, tab saringan, entri sebagai **kolom tanggal (`AGU 31 · 20.00`) di samping detail bab** dengan `Ubah jadwal`/`Batalkan`, dan dua catatan kaki serif tentang penyimpanan UTC · `P0`
- [x] Antrean tinjauan: dua penghitung, lalu per butir label jenis, judul serif, karya sumber, stempel waktu pengajuan, kata status, alasan penolakan bila ada, aksi yang tersedia; ditutup catatan kaki serif tentang empat sumber antrean · `P0`
- [x] Buat cerita: alur empat langkah dengan **garis progres empat segmen** di bawah kepala dan `Simpan` selalu tersedia · `P0`
- [x] Langkah 1: pengunggah sampul (slot putus-putus 2:3 + aturan), `Judul story` (garis bawah serif, `0/100`), `Sinopsis` (kotak, `0/1000`), `Nama pena`, kategorisasi (genre & bahasa sebagai select garis bawah, genre tambahan & tag sebagai pill dengan grup `SARAN`), lalu pratinjau langkah tersisa · `P0`
  ↳ Batas **100 · 1000 tetap dari PRD**, bukan dari mockup — aturan lama `architecture.md` §1.5 masih berlaku: mockup menentukan susunan, PRD menentukan angka.
- [x] Langkah 2: Status & visibilitas, Monetisasi (+ catatan bisa berubah jadi sebagian berbayar setelah 10 bab), Pengaturan lanjutan (`Dedikasi` `0/300`, `Catatan penulis` `0/1000`), lalu `Simpan` dengan `Batalkan` redup · `P0`
  ↳ Kolom, batas, dan urutannya sudah sesuai sejak Fase 8. Yang berubah di R6 hanya kepala section-nya: judul serif besar → label 9,5px + garis, sepola dengan seluruh aplikasi.
- [x] Riwayat cetak: **satu komponen baris, empat tampilan tersaring** — hanya baris hitungan dan isi daftar yang berubah · `P0`
- [x] Baris cetak: judul serif, jenis (`PDF` emas / `HARDCOPY` redup), baris spesifikasi, status + id pesanan + tanggal, lalu **bersyarat**: pelacak enam tahap (selesai terisi gelap, tahap kini emas, **tanpa garis penghubung setelah tahap terakhir**), catatan serif di balik garis emas, baris berkas dengan ukuran & kedaluwarsa, harga dengan resi/ETA, dan pill aksi (yang pertama terisi) · `P0`

### R7 — Lintas-fitur · 1–2 hari · doc §14 · **selesai**

- [x] **Bertahan lintas muat ulang:** ukuran font & tema baca, visibilitas section beranda, saringan pustaka, dan izin auto-unlock (server). Posisi baca dipulihkan per bab · `P0`
- [x] Keadaan kosong & memuat: baris skeleton **setinggi barisnya**; kosong = satu kalimat polos tinta redup, **tanpa ilustrasi** · `P0`
- [x] Aksesibilitas: pratinjau buram `aria-hidden`; toast `role="status" aria-live="polite"`; baris cerita adalah tautan yang bisa dicapai keyboard dengan Enter **dan** Space; tiap target ketuk ≥44px; pemicu pengaturan menjaga `aria-expanded` · `P0`
  ↳ Ambang 44px punya **satu** penyebab, ditemukan saat R3: `Button`/`IconButton` ukuran `sm` tingginya 36px (`Button.tsx:25,85`), dan itulah ukuran baris aksi komentar, bilah melayang ruang baca, serta hampir tiap lembar. Naikkan di primitifnya sekali — menambalnya per halaman berarti ~30 tempat, dan halaman berikutnya akan memakai `sm` lagi karena primitifnya masih 36px.
- [x] Gerak: lembar naik sambil meredupkan latar; overlay reader **cross-fade**; tidak ada yang memantul atau membesar · `P1`
- [x] **Tidak boleh masuk:** bayangan berat, gradien di luar satu glow radial sampul gelap, emoji, warna aksen baru, sampul "album art" membulat · `P0`
- [x] `tests/e2e/isi-koin-di-hp.spec.ts` diperbarui — kini **25 halaman × 5 lebar** (320 · 360 · 390 · 412 · 430), bukan 22 halaman × 1 lebar · `P0` · `[LUAR]`
  ↳ Dikerjakan lebih awal, di Langkah 44, karena pengguna memintanya: sapuannya menemukan 10 kombinasi rusak — semuanya di ≤390px, nol di 412 ke atas. Tata letak baru tiap halaman tetap diperiksa ulang saat halamannya digarap.
- [x] **Test:** muat ulang setelah tiap perubahan yang bertahan; empat keadaan di tiap layar baru

**Definition of done per layar** (doc §15): struktur, copy, peran tipografi, dan pemakaian
aksen cocok dengan PNG di `putaran7/`; perilaku fitur di bagiannya jalan; aturan §14 di
atas terpenuhi.

**Untuk R8 dan R9 tidak ada PNG-nya**, jadi "cocok dengan mockup" tidak berlaku
di sana. Gantinya: cocok dengan `PRD Novelova/prd_01_design_system.md` **§0** —
permukaan, lima tingkat tinta, dua emas beserta jatah perannya, dua muka huruf,
dan daftar larangan. Kalau sebuah halaman butuh pola yang belum ada, **tanyakan
dulu**.

### R8 — Auth & dompet · 3–4 hari · **tanpa mockup**

Tujuh rute yang **tidak tergambar putaran 7 sama sekali** — brief §15 hanya
menyusun urutan bangun untuk layar yang punya PNG, dan 27 PNG cuma menutup 14
dari 42 rute. Acuannya `PRD Novelova/prd_01_design_system.md` **§0**, dan aturan
di `todo-redesign.md` berlaku penuh: kalau sebuah halaman butuh pola yang belum
ada, **tanyakan dulu** — jangan mengarang komponen baru.

Anatomi per halaman ada di [`todo-redesign.md`](todo-redesign.md) grup **A** dan
**E**. Yang di bawah urutan kerjanya.

> **Selesai 5 September 2026.** Tidak ada komponen baru yang dikarang: yang
> dipakai `Field`, `Button`, `Tabs`, `SectionHeader`, `StageTrack`, `Cover`, dan
> `CoinChip` — dua yang terakhir bertambah satu-dua prop, bukan bertambah varian.
> Satu berkas baru, `PasswordToggle`, dan itu **penggabungan** kontrol yang sudah
> ditulis dua kali, bukan pola baru.
>
> **Empat cacat yang bukan soal kulit ikut ketahuan** dan diperbaiki di
> penyebabnya, bukan di halamannya — `architecture.md` §1.27:
> `bg-nv-surface` yang mati sejak R1 (16 panel dirender transparan),
> `formatCompactCoin` yang memakai titik alih-alih koma,
> **`/mulai` yang tidak pernah tampil kepada akun baru mana pun**, dan
> `AuthLayout` yang memakai `grid` tanpa kolom eksplisit.

#### R8a — Empat halaman auth

- [x] Input email, sandi, dan nama jadi **garis bawah 1,5px teks serif** lewat `Field` yang sudah berganti bentuk di R1 — tidak ada gaya baru yang perlu ditulis · `P0`
- [x] Tombol utama jadi pill isi `#1c1a18`; tautan sekunder jadi teks tebal tinta redup · `P0`
- [x] Tombol OAuth jadi pill garis rambut — **warna merek Google/Facebook tetap**, satu-satunya pengecualian palet dan alasannya tidak berubah · `P0`
- [x] Meter kekuatan kata sandi tetap lima token kekuatan, **bukan emas** — emas sudah punya enam peran dan ini bukan salah satunya · `P1`
- [x] `/mulai`: indikator langkah jadi **garis bersegmen** seperti `7k`/`7l`, bukan titik; pilihan genre tetap pil · `P1`
- [x] Tiga kegagalan sesi ikut kulit baru dan tetap tiga tingkat berbeda: lembar masuk ulang (`AUTH-401`) · penahanan lima percobaan (`AUTH-429`) · layar versi kedaluwarsa (`APP-426`) · `P0`
- [x] Validasi berurutan **tetap satu area pesan** — jangan dipecah jadi pesan per kolom saat menata ulang · `P0`

#### R8b — Isi koin `/koin`

> **Layar uang.** Alur, timer kedaluwarsa, idempotency, dan ledger tidak boleh
> disederhanakan demi tampilan — keputusan terkunci #4.

- [x] Enam paket jadi **daftar berpembatas atau kartu garis rambut**, bukan ubin bergradien · `P0`
- [x] Kolom kustom tiga keadaan jadi input garis bawah teks serif · `P0`
- [x] Paket & kustom **tetap saling menonaktifkan**, dan jalan kembalinya tetap ada (`architecture.md` §1.8) · `P0`
- [x] Empat grup metode + "Terakhir digunakan" dari buku besar ikut kulit baru · `P0`
- [x] Empat overlay pembayaran, hitung mundur bersama, layar sukses, dan layar gagal berkode teknis · `P0`
- [x] Confetti dipertahankan tetapi **tanpa emoji dan tanpa warna aksen baru** (brief §14) · `P1`
- [x] Chip koin, format saldo ringkas, dan **koin bonus terpisah** identik dengan seluruh aplikasi · `P0`
- [x] Datang dari gerbang bab tetap menyorot paket terkecil yang mencukupi, dan tombol sukses tetap "Lanjutkan membaca" ke bab yang sama · `P0`
- [x] Tiga jalan gagal bayar tetap berbeda aksinya: `PAY-402` · `PAY-504` · `PAY-410` · `P0`

#### R8c — Buku besar `/koin/transaksi` + `/koin/transaksi/:txId`

- [x] Brankas saldo jadi panel putih dengan angka **serif** · `P0`
- [x] Empat saringan jadi **tab teks**; tetap meminta ulang barisnya ke server · `P0`
- [x] Daftar transaksi jadi baris berpembatas; nominal masuk/keluar memakai **tinta, bukan hijau/merah penuh** · `P0`
- [x] Dua panel analitik ikut kulit baru; ekspor CSV tetap menghasilkan berkas nyata · `P1`
- [x] Detail transaksi: empat status tetap dibaca **dari data**, bukan dari `?status=` · `P0`
- [x] Lini masanya memakai pola pelacak `7o`–`7r`: tahap selesai terisi gelap, tahap kini emas, **tanpa garis penghubung setelah tahap terakhir** · `P0`
- [x] Nomor VA tetap `--nv-font-mono` · `P1`
- [x] Ketujuh rute masuk daftar sapuan lima lebar di `tests/e2e/isi-koin-di-hp.spec.ts` · `P0`

---

### R9 — Penghasilan & sisa studio · 3–5 hari · **tanpa mockup**

Sepuluh rute sisanya. Anatomi per halaman di [`todo-redesign.md`](todo-redesign.md)
grup **C** (ulasan), **F** (studio), dan **G** (penghasilan).

> **Selesai 5 September 2026 — Fase R tuntas.** Nol komponen baru dikarang:
> yang dipakai `Tabs`, `SectionHeader`, `StageTrack`, `Slider`, `SettingRow`,
> `Input`/`TextArea`, dan `Cover`. `lib/payout.ts` tidak disentuh satu baris pun.
>
> **Empat cacat data & isi ikut ketahuan** dan diperbaiki di penyebabnya
> (`architecture.md` §1.30): sembilan bab milik penulis contoh yang **tidak punya
> naskah sama sekali**, jumlah baca **negatif** pada sembilan belas cerita,
> persentase perubahan yang dipatok sehingga layarnya bisa berbunyi
> "0% · naik 4%", dan panel sentimen yang menyebut sumber yang salah.

#### R9a — Tiga halaman penghasilan

> **Uang lagi, dan kali ini uang penulis.** Tangga validasi pencairan lima
> tingkat ditegakkan **dua kali dari satu berkas** (`architecture.md` §1.15) —
> menata ulang layarnya tidak boleh menyentuh `lib/payout.ts`.

- [x] `/penulis/analitik`: tiga KPI jadi strip sel dengan angka **serif**; empat rentang waktu dan tiga sudut pandang jadi **tab teks**, keduanya tetap menyaring di server · `P0`
- [x] Kurva pendapatan tujuh batang memakai **emas dekoratif**, dan **angka per batang tetap ada untuk pembaca layar** · `P0`
- [x] Kurs koin → rupiah dan bagi hasil 80/20 tetap **dinyatakan terang**, keduanya dari `api/mock/config.ts` · `P0`
- [x] Saldo tersedia tetap **sudah dikurangi** pengajuan yang masih diproses · `P0`
- [x] Corong pembaca empat tahap tetap dijepit monoton; heatmap rilis tetap **tabel yang terbaca pembaca layar**, bukan grid warna saja · `P0`
- [x] `/penulis/penarikan`: saldo, batas minimum, dan estimasi tetap tampil **sebelum** formulir; kolom jumlah jadi input garis bawah serif · `P0`
- [x] Ringkasan tiga baris tetap dihitung tiap ketikan, bersih tetap **dijepit ≥ 0**, dan tombol tetap mati sebelum ditekan bila tidak sah · `P0`
- [x] `/penulis/penarikan/riwayat`: daftar berpembatas; lini masa tiga tahap **hanya untuk yang masih di jalurnya** — pengajuan ditolak membawa alasannya, bukan lini masa yang menyiratkan uangnya masih jalan · `P0`
- [x] Rekening tetap tersamar dan **tidak pernah dikirim penuh** · `P0`

#### R9b — Enam rute studio yang tidak tergambar

- [x] `/karya/daftar-penulis`: input garis bawah; tiga tingkat penulis tetap ditegakkan **server** · `P1`
- [x] `/karya/:id/bab`: tiga penghitung jadi strip sel dan **tetap merangkap pintasan saringan**; daftar bab enam status jadi daftar berpembatas dengan kata status berwarna status · `P0`
- [x] Empat pemberitahuan tindak lanjut dan menu aksi tetap **dihitung dari keadaan bab**, bukan didaftar manual · `P0`
- [x] `/karya/:id/bab/baru` · `/ubah`: area tulis jadi **serif**, lebar terkendali; bilah alat markdown dan mode fokus ikut kulit baru · `P0`
- [x] **Autosave dua lapis tidak disentuh sama sekali** — lokal 3 detik, server 30 detik + sekali lagi saat halaman ditinggalkan · `P0`
  ↳ Halaman ini memegang naskah yang belum tersimpan. `DRAFT-409` tetap **tidak membekukan editor**, dan pesan gagalnya tetap menyatakan **tulisanmu aman** (`architecture.md` §1.4).
- [x] `/karya/:id/bab/:id/akses`: tiga tipe akses jadi daftar pilihan berpembatas; tombol simpan tetap **membandingkan nilai awal**; tiga dialog konfirmasi **tanpa isi merah** · `P0`
- [x] `/karya/:id/analitik`: lima rentang jadi tab teks; empat kartu metrik jadi strip sel angka serif; grafik SVG memakai emas dekoratif dan **tetap menolak dimatikan seluruhnya beserta alasannya** · `P0`
- [x] Dua ekspor tetap menghasilkan berkas nyata (`window.print()` · `<canvas>` → PNG) — **diperiksa ulang setelah warna berganti**, karena keduanya merender warna sendiri · `P0`

#### R9c — Halaman ulasan

- [x] `/cerita/:id/ulasan`: sebaran 5★…1★ jadi batang garis rambut dengan angka emas, dan **tetap tidak ikut tersaring** · `P0`
- [x] Baris ulasan memakai anatomi `7t`: nama, waktu, **isi ulasan serif**, lalu baris aksi · `P0`
- [x] Tiga saringan + empat urutan jadi tab teks, tetap menyaring di server · `P0`
- [x] Tombol "Membantu" tetap tidak berlaku untuk ulasan sendiri; tanggapan penulis tetap berlencana; tirai spoiler tetap `aria-hidden` selama tertutup · `P1`

#### R9d — Penutup

- [x] Sepuluh rute R9 masuk daftar sapuan lima lebar di `tests/e2e/isi-koin-di-hp.spec.ts` · `P0`
- [x] **Nol halaman v1 tersisa tanpa kulit putaran 7** — diperiksa dengan menghitung ulang `todo-redesign.md`: ketiga puluh rute `ADA` tercentang


---
## Fase 6 — Dompet: Isi Koin, Transaksi & Konteks Kembali · 9–11 hari · **M2**

Menutup loop ekonomi. Dikerjakan tepat setelah reader karena reader-lah yang menciptakan kebutuhannya.

- [x] `payments/provider.ts` + `payments/mock.ts` (arch §11.1); `midtrans.ts` sebagai stub
- [x] Handler mock: `createTopupOrder` (idempoten), `getTopupOrder`, `listTransactions`, `getTransaction`
- [x] **Dompet tunggal** — satu sumber saldo di server-mock; **tidak ada halaman yang menyimpan saldo sendiri atau memakai angka hardcoded** · `P0` — FR-WALLET-17 · `[BARU]`
- [ ] Saldo tampil seragam di 6 titik: reader · isi koin · riwayat transaksi · pusat hadiah · **profil (baru)** · FAB beranda · `P0` — FR-WALLET-17 · `[BARU]`
  ↳ Reader, isi koin, riwayat transaksi, dan FAB beranda sudah; pusat hadiah (Fase 12) dan profil (Fase 13) menunggu halamannya.
- [ ] "420 koin hadiah" di pusat hadiah dijadikan **metrik periode berjalan**, bukan saldo kedua · `P0` — FR-WALLET-17 · `[BARU]`
  ↳ Menunggu pusat hadiah (Fase 12).
- [x] Format ringkas seragam (`formatCompactCoin`) dan rupiah seragam (`toLocaleString('id-ID')`) di seluruh modul · `P0` — FR-WALLET-17
- [x] Saldo disegarkan setiap halaman dibuka dan setelah setiap transaksi berhasil; perubahan saldo **atomik** di server-mock · `P0` — FR-WALLET-17 · `[BARU]`
- [x] **Isi koin** `/koin` — saldo di bilah atas + spanduk promo 500→+50 · `P0` — FR-WALLET-01
- [x] Langkah 1: 6 paket koin (50/100/250/500/1.000/2.000) · `P0` — FR-WALLET-02
- [x] Kolom kustom: 3 keadaan (netral / tidak valid <100 / valid), harga `Math.round(coins*130/100)*100` · `P0` — FR-WALLET-03
- [x] Paket & kustom saling meniadakan; mundur ke tidak valid **menutup** langkah berikutnya · `P0` — FR-WALLET-03
- [x] **Paket & kustom saling menonaktifkan, bukan sekadar saling mengosongkan** — menimpa FR-WALLET-02/03 · `[PRODUK]`
  ↳ Jalan kembalinya: menekan paket yang sudah terpilih membatalkannya, dan mengosongkan kolom kustom menghidupkan kartu paket lagi. Tanpa itu, menonaktifkan berarti mengunci.
- [x] Flake `TopupPage` ditemukan dan diperbaiki: saldo bilah atas menunggu `['wallet']` diambil ulang, jadi assertion-nya harus menanti · `[LUAR]`
- [x] **Konteks masuk** `?return=&chapter_id=&need=`: sorot **paket terkecil yang mencukupi** + keterangan "Cukup untuk membuka bab ini"; paket lain tetap dapat dipilih · `P0` — FR-WALLET-18 · `[BARU]`
- [x] Langkah 2: 4 grup metode + grup "Terakhir digunakan"; membuka ulang langkah selalu mengosongkan pilihan · `P0` — FR-WALLET-04
- [x] Langkah 3: ringkasan 4 baris (baris bonus hanya bila `coins === 500`), tombol bayar aktif hanya bila lengkap · `P0` — FR-WALLET-05
- [x] Overlay e-wallet: layar menghubungkan 1.800 ms → layar menunggu + hitung mundur 15 mnt · `P0` — FR-WALLET-06
- [x] Overlay QRIS: kode QR + hitung mundur 30 mnt + Simpan/Bagikan QR · `P0` — FR-WALLET-07
- [x] Overlay VA: nomor monospace + tombol Salin (Clipboard API nyata) + "Saya sudah transfer" + **hitung mundur 24 jam** · `P0` — FR-WALLET-08
- [x] Hitung mundur bersama: format `HH:MM:SS` vs `MM:SS`, hanya satu aktif, dihentikan di 3 peristiwa · `P0` — FR-WALLET-09
- [x] Layar sukses: total koin + saldo baru + confetti 28 partikel; saldo di bilah atas ikut berubah · `P0` — FR-WALLET-10
- [x] **Tombol utama layar sukses menyesuaikan konteks**: dari reader → "Lanjutkan membaca" ke bab itu · dari detail → "Kembali ke cerita" · tanpa konteks → "Mulai baca" · `P0` — FR-WALLET-18 · `[BARU]`
- [x] Batal atau tombol kembali mengembalikan ke **halaman asal**, bukan beranda; "Riwayat" tetap jadi pilihan kedua · `P0` — FR-WALLET-18 · `[BARU]`
- [x] Layar gagal: alasan spesifik per metode; "Coba lagi" mempertahankan pilihan; "Ganti metode" kembali utuh · `P0` — FR-WALLET-11
- [x] **Tiga varian kegagalan bayar** yang digambar kanvas, masing-masing punya copy dan aksinya sendiri · `P0` — arch §1.4 · `[DESAIN]`
  - [x] **Ditolak bank** (`PAY-402`) — nyatakan tidak ada dana terpotong dan saldo tetap; aksi: pakai metode lain / coba metode yang sama
  - [x] **Belum dipastikan** (`PAY-504`) — penyedia tidak menjawab dalam 90 detik; **“Jangan bayar dua kali”**; aksi: periksa status / buka riwayat
  - [x] **Kedaluwarsa** (`PAY-410`) — kode VA lewat batas 24 jam; aksi: buat pesanan baru / “Saya sudah transfer”
- [x] Status pesanan **`pending_reconciliation`** ditambahkan ke `TopupOrder`; selama status itu tombol bayar **dikunci** dan pesanan tidak bisa diulang · `P0` · `[DESAIN]`
- [x] Server-mock merekonsiliasi sendiri setelah 10 menit → koin masuk + notifikasi terkirim, tanpa aksi pengguna · `P0` · `[DESAIN]`
- [x] Setiap layar gagal menampilkan **kode teknis kecil di bawah** (`PAY-402 · GoPay · 21.44 WIB`) — untuk dibacakan ke dukungan, bukan untuk dipahami pengguna · `P1` · `[DESAIN]`
- [x] Batal tersedia di keempat overlay; **hentikan timer dulu**, baru tutup · `P1` — FR-WALLET-12
- [x] Di `≥640` overlay jadi kartu terpusat, bukan layar penuh · `P1`
- [x] `confirmTopupOrder` + `cancelTopupOrder` ditambahkan ke seam — pelunasan dan pembatalan tidak bisa dititipkan ke `getTopupOrder` tanpa membuat pembacaan biasa mengubah saldo · `[LUAR]`
- [x] `prefersReducedMotion` memeriksa `matchMedia`, bukan hanya `window` — peramban dan jsdom yang tidak punya `matchMedia` dijatuhkan oleh confetti · `[LUAR]`
- [x] **Riwayat transaksi** `/koin/transaksi` — brankas + 4 saringan, keterangan berubah ikut saringan · `P0` — FR-WALLET-15
- [x] Baris di-query ulang tiap saring (memperbaiki PRD 09 §7 #7) · `P0`
- [x] **Setiap baris menautkan ke detailnya** — `?id=<transaction_id>`; status dibaca dari data transaksi, bukan dari `?status=` · `P0` — FR-WALLET-19 · `[BARU]`
- [x] Baris **pengeluaran koin** punya varian detail sendiri: cerita & bab yang dibuka, koin, saldo sebelum–sesudah · `P0` — FR-WALLET-19 · `[BARU]`
- [x] Baris **hadiah** menautkan ke pusat hadiah; `id` tidak ditemukan → keadaan kosong yang sopan, bukan sukses palsu · `P1` — FR-WALLET-19 · `[BARU]`
- [x] **Detail transaksi** `/koin/transaksi/:txId` — 4 status, aturan koin per status, ID `INV-NVL-YYYYMMDD-NNNN` · `P0` — FR-WALLET-14
- [x] Ekspor kuitansi menghasilkan **berkas PDF/CSV nyata** untuk rentang yang dipilih · `P2` — FR-WALLET-16/19
- [x] 2 panel analitik (peta pengeluaran, status kuitansi) · `P2`
- [x] Sakelar hasil pembayaran di `/dev/kitchen-sink` — ketiga jalan gagal hanya terjadi berbulan-bulan sekali, jadi tanpa sakelarnya tidak satu pun layarnya pernah sempat diperiksa · `[LUAR]`
- [x] **Test:** handler — order dua kali dengan kunci sama → satu order, satu baris ledger
- [x] **Test:** unit — promo hanya berlaku pada `coins === 500`, tidak pada 501
- [x] **Test:** handler — tidak ada dua pembacaan saldo yang berbeda setelah beli + top-up berurutan (FR-WALLET-17) · `[BARU]`
- [x] **Test:** pesanan berstatus `pending_reconciliation` menolak percobaan bayar ulang; setelah timer rekonsiliasi, koin masuk **satu kali** · `[DESAIN]`
- [x] **Test e2e #2:** bab terkunci → saldo kurang → topup dengan konteks → bayar → **kembali ke bab yang sama**, bab terbuka

> **M2 tercapai:** loop ekonomi tertutup penuh — temukan, baca, kehabisan koin, beli, **kembali ke bab yang sama**, lanjut baca. Aplikasi sudah bisa didemokan sebagai produk.
> `topup_restyled.html` **tidak** dibawa (PRD 09 §7 #5 — memakai satuan rupiah, bertentangan dengan ekonomi koin).

---

## Fase 7 — Perpustakaan · 4–5 hari · **M3**

Ringan karena `FilterableList` (Fase 1) dan `ReadingProgress` (Fase 5) sudah ada. Fase ini yang **menghidupkan** keduanya.

- [x] Handler mock: `getLibrary`, `toggleNotify`, `removeFromLibrary`, `undoRemove`
- [x] **Koleksi bersumber tunggal dari Add to Library** — tidak ada cerita yang bisa muncul tanpa aksi eksplisit pembaca · `P0` — FR-LIB-11 · `[BARU]`
- [x] **Progres bersumber dari `ReadingProgress`**: `data-state`, "Bab 45 dari 120", persentase, penanda bab baru, `data-updated`, `data-saved` · `P0` — FR-LIB-11 · `[BARU]`
- [x] Aturan status: `not-started` = 0 bab selesai · `reading` = 1..kurang dari semua · `finished` = seluruh bab terbit selesai · `P0` — FR-LIB-11 · `[BARU]`
- [x] Cerita `finished` yang mendapat bab baru **kembali menjadi** `reading` · `P0` — FR-LIB-11 · `[BARU]`
- [x] **Penyaringan, pencarian, dan pengurutan pindah ke server** dengan paginasi — perilaku sama persis, tapi tidak lagi terbatas pada kartu yang kebetulan ada di DOM · `P0` — FR-LIB-11 · `[BARU]`
- [x] Unsave, sakelar notifikasi, dan status baca **disimpan di server** — bertahan setelah muat ulang, konsisten lintas perangkat · `P0` — FR-LIB-11, FR-CORE-01 · `[BARU]`
- [x] Ringkasan koleksi 4 metrik dihitung dari data nyata, bukan konstanta; tidak ikut berubah saat menyaring · `P1` — FR-LIB-01/11
- [x] Kartu cerita: lencana status terbit, titik bab baru, batang progres, tanggal simpan · `P0` — FR-LIB-02
- [x] Pencarian mencakup judul + penulis + genre, substring, tidak peka huruf besar · `P0` — FR-LIB-03
- [x] `getLibrarySummary` sebagai panggilan terpisah — menurunkan empat metrik dari daftar yang sedang tampil membuatnya ikut berubah saat menyaring, dan itu penghitung hasil, bukan ringkasan koleksi · `[LUAR]`
- [x] 4 tab status + 4 opsi urutan; filter & cari bersifat AND · `P0` — FR-LIB-04/05
- [x] Penghitung tunggal/jamak · `P1` — FR-LIB-06
  ↳ Bahasa Indonesia tidak menandai jamak — "1 cerita" dan "6 cerita". Aturan yang berlaku (penghitung menampilkan hasil terlihat, bukan total koleksi) tetap dibangun.
- [x] **Dua keadaan kosong yang berbeda**: koleksi benar-benar kosong (ajakan + "Jelajahi cerita" + tautan kategori populer) vs tidak ada hasil saringan · `P1` — FR-LIB-12, FR-CORE-02 · `[BARU]`
- [x] Saat koleksi kosong, kontrol cari/saring/urut **disembunyikan**; ringkasan tetap tampil dengan angka nol · `P1` — FR-LIB-12 · `[BARU]`
- [x] **Tombol baca menuju bab terakhir yang dibaca**, bukan bab pertama; `not-started` → bab 1 · `P0` — FR-LIB-07/11
- [x] Sakelar notifikasi per cerita; `aria-label` ikut berubah (memperbaiki PRD 06 §7 #3) · `P1` — FR-LIB-08
- [x] Hapus dengan **toast "Urungkan" 6 detik** (memperbaiki PRD 06 §7 #2) · `P1` — FR-LIB-09
- [ ] Penanda "tersedia offline" pada cerita yang punya bab tersimpan · `P2`
  ↳ Menunggu simpan-offline (Fase 14, arch §10.3) — belum ada data bab tersimpan untuk ditandai.
- [x] `Toast` menerima `durationMs` per panggilan — "Urungkan" yang lenyap dalam 2,6 detik adalah tombol yang tidak pernah sempat ditekan · `[LUAR]`
- [x] Wadah tab memakai `fieldset` + `legend`, bukan `div role="group"` — elemen aslinya sudah membawa peran itu tanpa ARIA · `[LUAR]`
- [x] **Bilah bayar `/koin` tertutup navigasi bawah di HP** — dua bilah `fixed bottom-0` di layar yang sama; tinggi navigasinya kini satu token `--nv-bottom-nav` yang dipakai bilah itu sendiri, ruang bawah `AppShell`, FAB, dan bilah aksi · `[LUAR]`
- [x] `Skeleton lines` menaruh `className` di wadahnya, bukan di tiap baris — `m-6` bertumpuk dengan `w-full` membuat setiap halaman bergeser 24px ke samping selama pemuatan · `[LUAR]`
- [x] **Test e2e #3:** viewport HP — tombol bayar benar-benar bisa ditekan, dan lima halaman tidak menggeser badan halaman ke samping · `[LUAR]`
- [x] **Test:** handler — bab selesai ke-3 dari 120 → status `reading` dengan persentase benar; bab terakhir selesai → `finished`; bab baru terbit → kembali `reading` · `[BARU]`

> **M3 tercapai:** loop retensi tertutup — simpan cerita, baca, progres tercatat, Continue Reading di beranda terisi, "Lanjut Baca" menuju bab yang benar. Tiga alur yang di prototipe sama sekali tidak punya sumber data kini punya.

---

## Fase 8 — Author Studio · 20–26 hari

Modul terbesar: kini **12 halaman, 38 FR**. Tidak ada satu pun jalur pembaca yang bergantung padanya — itu sebabnya ia dikerjakan setelah M3. PRD menaruhnya di tahap 5 dengan alasan yang tepat: **risiko kehilangan naskah adalah risiko data terbesar di aplikasi ini**, jadi 8c dan 8d tidak boleh ditunda lebih jauh dari titik ini.

> Seksi `8a` kanvas menutup tiga dari empat lubang mockup fase ini (layar 38–41). Di beberapa tempat kanvas **bertentangan** dengan PRD — batas karakter, validasi cover, dan model lini masa cetak. Yang berlaku sudah diputuskan dan tertulis di tugasnya masing-masing; ringkasannya di §Pembaruan Desain dan `architecture.md` §1.5. Jangan menyalin angka dari mockup.

### 8a. Onboarding penulis & daftar cerita `/karya` · 4–5 h

- [x] Handler mock: `getMyStories`, `createStory`, `updateStory`, `deleteStory`, `scheduleStory`, `getAuthorProfile`
- [x] **Onboarding penulis** `/karya/daftar-penulis` — 3 prasyarat yang sudah dinyatakan prototipe: identitas pencairan · verifikasi 2 langkah · persetujuan ketentuan penulis · `P0` — FR-STUDIO-33 · `[BARU]`
- [x] **Tiga tingkat status penulis** ditegakkan: belum mendaftar (baca saja) · terdaftar (menulis + terbit gratis) · terverifikasi (bab berbayar + pencairan) · `P0` — FR-STUDIO-33 · `[BARU]`
- [x] Onboarding **tidak memblokir menulis** — verifikasi baru diminta saat menyentuh monetisasi atau pencairan · `P0` — FR-STUDIO-33 · `[BARU]`
- [x] `/karya` bagi pembaca yang belum mendaftar → **ajakan menjadi penulis**, bukan daftar kosong · `P0` — FR-STUDIO-33, FR-CORE-02 · `[BARU]`
- [ ] Status penulis & langkah yang belum selesai ditampilkan di `/profil` kelompok Akun · `P1` — FR-STUDIO-33 · `[BARU]`
  ↳ Menunggu halaman profil (Fase 13). Tingkat penulis dan langkah yang belum selesai sudah tampil di `/karya/daftar-penulis`.
- [x] Ringkasan studio 4 metrik + tautan riwayat cetak · `P1` — FR-STUDIO-01
- [x] **Metrik "Coins" menjadi tautan** ke analitik penulis + tautan "Penghasilan & Pencairan" · `P0` — FR-EARN-10 · `[BARU]`
- [x] Kartu cerita 5 status × 6 metrik; aksi kondisional per status · `P0` — FR-STUDIO-02
- [x] **Aturan Analisa dibalik**: tampil untuk `published` & `completed` (memperbaiki PRD 07 §7 #1) · `P0`
- [x] Cari (judul) + 6 tab status + 3 urutan lewat `FilterableList` · `P0` — FR-STUDIO-03
  ↳ **Delapan tab, bukan enam**: FR-STUDIO-38 menambahkan `Dalam tinjauan` dan `Ditolak` yang *melengkapi* lima status FR-STUDIO-02. `architecture.md` §1.9.
- [x] **Keadaan kosong penulis baru** — pola yang sama dengan perpustakaan kosong · `P1` — FR-STUDIO-33, FR-CORE-02 · `[BARU]`
- [x] Sheet penjadwal cerita 4 langkah; tanggal min = hari ini lokal · `P0` — FR-STUDIO-04
- [x] Sheet cetak 2 tab (Softcopy / Hardcopy) — konfigurasi, formulir pengiriman, ringkasan biaya · `P1` — FR-STUDIO-05
- [x] Hapus cerita: `confirm`; cerita **terbit & berbayar** wajib lewat konfirmasi refund · `P1` — FR-STUDIO-06
- [x] `getStudioSummary`, `registerAuthor`, dan `createPrintOrder` ditambahkan ke seam — ringkasan agregat, pendaftaran, dan pesanan cetak tidak punya metode di rencana awal · `[LUAR]`
- [x] `StoryStats` mendapat `readers` dan `coinsEarned` — dua metrik kartu studio yang tidak bisa diturunkan di klien; `lib/coin.ts` melarang tegas menghitung penghasilan dari `AUTHOR_SHARE` · `[LUAR]`
- [x] `FilterableList` mendapat `shown` — keterangan "menampilkan 20 dari 42" tetap berbunyi 20 setelah "Muat lagi" ditekan · `[LUAR]`
- [x] Formulir pendaftaran penulis menunggu profilnya turun — `useState` hanya membaca argumennya sekali, jadi tiga sakelarnya menampilkan keadaan yang tidak pernah ada · `[LUAR]`
- [x] **Test e2e #4:** alur studio yang sama dijalankan di dua lebar layar (HP dan desktop), plus lembar jadwal dan lembar cetak yang benar-benar ditekan di viewport HP · `[LUAR]`

### 8b. Kelola bab `/karya/:id/bab` · 2–3 h

- [x] Handler mock: `getChaptersForAuthor`, `publishChapter`, `scheduleChapter`, `deleteChapter`
- [x] 3 penghitung status yang juga jadi pintasan saringan + 4 notifikasi tindak lanjut · `P1` — FR-STUDIO-07
- [x] Daftar bab 4 status, informasi & aksi cepat berbeda per status · `P0` — FR-STUDIO-08
- [x] Cari + 4 tab + 4 urutan; **pesan kosong menyesuaikan saringan aktif** · `P0` — FR-STUDIO-09
  ↳ **Tujuh tab, bukan empat**: `Privat` dan dua status tinjauan ikut, dengan alasan yang sama seperti §1.9 — status tanpa saringan adalah status yang tidak akan pernah ditemukan penulisnya.
- [x] Sheet menu aksi dibangun dinamis per status; aksi "hapus" bergaya danger · `P0` — FR-STUDIO-10
- [x] Penjadwal bab (terpisah dari penjadwal cerita), dibuka dari 3 tempat · `P0` — FR-STUDIO-11
- [x] **Dua status tinjauan baru** di tingkat bab: `Dalam tinjauan` & `Ditolak`, ikut dalam saringan tab · `P0` — FR-STUDIO-38 · `[BARU]`
- [x] `getChapterBoard`, `unscheduleChapter` ditambahkan ke seam — penghitung + pemberitahuan agregat, dan pembatalan jadwal yang mengembalikan bab jadi draf · `[LUAR]`
- [x] `ChapterSummary` mendapat `editedAt`, `views`, `rating`, `commentCount` — empat angka yang dituntut daftar bab penulis dan tidak satu pun bisa diturunkan di klien · `[LUAR]`
- [x] Jenis elemen menu aksi jadi bagian **datanya**, bukan ditebak dari kata di labelnya seperti prototipe — tebakan itu pecah pada terjemahan pertama · `[LUAR]`
- [x] Empat test penjadwalan diperbaiki: memakai tanggal hari ini membuatnya bergantung jam dinding dalam dua arah sekaligus · `[LUAR]`
- [x] **Test e2e #5:** alur kelola bab dijalankan di dua lebar layar, termasuk lembar penjadwal yang dibuka **dari dalam** lembar menu · `[LUAR]`

### 8c. Formulir cerita `/karya/baru` · `/karya/:id/ubah` · 2–3 h

> **Satu layar, dua mode** (kanvas layar 38) — `baru` dan `sunting` berbagi hampir seluruh isinya. Bangun sebagai satu komponen dengan prop mode, bukan dua halaman kembar; PRD sendiri menyebut keduanya “berbagi struktur, gaya, dan sebagian besar logika”.

- [x] Formulir 5 section + penghitung karakter (100 / 1000) + `markDirty` (4 efek) · `P0` — FR-STUDIO-12
- [x] **Angka dari PRD, bukan dari mockup** — kanvas menggambar 80/1200; yang benar 100/1000 (`STORY_TITLE_MAX`, `STORY_SYNOPSIS_MAX`) · `P0` — arch §1.5 · `[DESAIN]`
- [x] Tombol simpan nonaktif sampai ada perubahan nyata · `P0`
- [x] Unggah cover: format JPG/PNG/WEBP, maks 5MB, rasio 2:3 toleransi ±0,12 (**saran**, bukan tolak) · `P1` — FR-STUDIO-13
- [x] Pesan rasio menyebut **contoh ukuran yang benar** (“rasio 2:3 — mis. 800×1200”), bukan sekadar menyatakan salah · `P2` · `[DESAIN]`
- [x] Genre utama + bahasa + genre tambahan maks 2 + tag maks 10 + target pembaca · `P0` — FR-STUDIO-14
- [x] Monetisasi 3 tipe dengan kolom & peringatan yang berbeda per halaman · `P1` — FR-STUDIO-15
- [x] **Peringatan monetisasi terbalik antara kedua mode** · `P1` — FR-STUDIO-15 · `[DESAIN]`
  - [x] Mode `baru` → muncul saat tipe **bukan** “Gratis Semua”: bab berbayar akan terkunci sampai dibeli
  - [x] Mode `sunting` → muncul saat memilih **“Gratis Semua”**, dengan akibat yang dihitung dari data cerita: berapa bab ikut terbuka dan berapa pembeli tidak mendapat refund
- [x] Validasi berurutan: judul → sinopsis ≥50 → nama pena · `P0` — FR-STUDIO-16
- [x] **Draft menyimpan isi formulir**, bukan penanda `'1'` — kunci `novelova:create-story-draft` / `:edit-story-draft` · `P0` — FR-STUDIO-34
- [x] Kotak pemulihan menyebut **kapan** draf itu dibuat (*“Ada draf yang belum selesai dari 26 Agu 20.14”*) dan menawarkan Pulihkan / Mulai baru · `P1` · `[DESAIN]`
- [x] Status & visibilitas + zona bahaya; `confirm` "Completed" **sebelum** lencana berubah · `P0` — FR-STUDIO-18
- [x] Hapus permanen: ketik ulang judul persis sama · `P0` — FR-STUDIO-18
- [x] **`DangerZone` hanya dirender pada mode `sunting`** — tiga aksi (arsipkan · tandai tamat · hapus), masing-masing menyatakan akibatnya dengan angka nyata · `P0` · `[DESAIN]`
- [x] Ketiganya lewat **satu pola konfirmasi** ketik-ulang judul, bukan tiga pola berbeda · `P0` · `[DESAIN]`
- [x] **Kotak sukses setelah cerita dibuat** — 3 pilihan berurutan: "Tulis bab pertama" (utama) → **"Atur jadwal terbit"** → "Kembali ke Karya Saya" · `P1` — FR-STUDIO-35 · `[BARU]`
- [x] Pilihan kedua diarahkan ke **jadwal terpadu** (8f), bukan kelola bab — kanvas mengubahnya, dan alasannya masuk akal: ritme rilis ditentukan sebelum bab menumpuk · `P2` · `[DESAIN]`
- [x] **Seluruh kegagalan formulir bertingkat `inline`** — satu kolom salah tidak menandai sembilan kolom lain · `P0` — arch §1.5 · `[DESAIN]`
- [x] Penghitung sinopsis berubah **saat mengetik**, jadi kekurangannya terlihat tanpa menekan Simpan · `P1` · `[DESAIN]`
- [x] Penolakan tag duplikat **menyebut tag mana** yang bentrok, bukan “tag sudah ada” · `P2` · `[DESAIN]`
- [x] **Simpan gagal di server → formulir tidak dikosongkan**; tombol berubah jadi “Coba simpan lagi” · `P0` · `[DESAIN]`
- [x] **Test:** simpan gagal → seluruh isi formulir masih ada, dan menyimpan ulang tidak membuat cerita ganda · `[DESAIN]`
- [x] Setelah bab pertama terbit, `/karya` menampilkan ajakan berikutnya: jadwalkan bab kedua atau atur akses · `P2` — FR-STUDIO-35 · `[BARU]`
- [x] `Story` mendapat tujuh pengaturan penulis (komentar · moderasi · terjemahan · fanfiction · label konten · dedikasi · catatan) — formulir yang kolomnya tidak bisa pulang ke server bukan formulir · `[LUAR]`
- [x] `StudioStory.publishedChapters` — dasar ajakan setelah bab pertama terbit; `stats.chapterCount` ikut menghitung draf · `[LUAR]`
- [x] Pemulihan draf ditumpuk **di atas nilai awal** — draf dari versi lama aplikasi kehilangan kolom yang sejak itu ditambahkan, dan formulir yang menerimanya mentah pecah di kolom pertama yang hilang · `[LUAR]`
- [x] Test formulir memakai `fireEvent.change` untuk teks panjang — mengetik 74 karakter satu per satu menghabiskan 3,5 detik per test, cukup untuk menyentuh ambang lima detik saat mesin sibuk · `[LUAR]`
- [x] **Test e2e #6:** formulir baru dan zona bahaya dijalankan di dua lebar layar; tombol simpan **bawah** yang ditekan · `[LUAR]`

### 8d. Editor bab `/karya/:id/bab/baru` · `.../ubah` · 4–5 h

Risiko kehilangan data terbesar di aplikasi. Autosave dikerjakan **lebih dulu**, sebelum fitur editor lain.

- [x] **Autosave dua lapis**: lokal tiap **3 detik** setelah ketikan berhenti · server tiap **30 detik** dan sekali lagi saat halaman ditinggalkan · `P0` — FR-STUDIO-34 · `[BARU]`
- [x] Kunci lokal **per bab**: `novelova:chapter-draft-<chapter_id>` — draf beberapa bab tidak saling menimpa · `P0` — FR-STUDIO-34 · `[BARU]`
- [x] Yang disimpan mencakup **kedua bahasa** + catatan penulis · `P0` — FR-STUDIO-34 · `[BARU]`
- [x] **Indikator keadaan** di bilah alat: `Menyimpan…` · `Tersimpan <waktu relatif>` · `Gagal menyimpan — coba lagi` · `P0` — FR-STUDIO-34 · `[BARU]`
- [x] **Autosave gagal 4× → sisipan `DRAFT-409`** yang menyatakan berapa kata tersimpan lengkap di perangkat ini · `P0` — arch §1.4 · `[DESAIN]`
- [x] **Editor tidak boleh dibekukan** saat penyimpanan gagal — menghalangi penulis mengetik justru memperbesar kemungkinan tulisannya hilang · `P0` · `[DESAIN]`
- [x] Tiga jalan keluar wajib pada sisipan itu: **Simpan sekarang** · **Salin seluruh naskah** (Clipboard API) · **Unduh sebagai berkas** (Blob `.txt`, judul bab jadi nama berkas) · `P0` · `[DESAIN]`
- [x] **Pemulihan**: draf lokal lebih baru dari server → tawaran memulihkan **isi** beserta pratinjau selisih waktu · `P0` — FR-STUDIO-34 · `[BARU]`
- [x] Meninggalkan halaman dengan perubahan belum tersimpan → konfirmasi peramban; draf lokal dihapus setelah tersimpan di server · `P0` — FR-STUDIO-34 · `[BARU]`
- [x] `create_chapter` dibuka dari kotak sukses menampilkan **judul cerita induk** di kepala halaman · `P1` — FR-STUDIO-35 · `[BARU]`
- [x] Editor dwibahasa: panel ID + panel EN yang mulai dari kartu ajakan · `P0` — FR-STUDIO-19
- [x] `hasEnglish()` mengubah label tombol terbit, penanda tab, dan alur konfirmasi · `P0`
- [x] Penghitung kata di 3 tempat; naskah kosong = 0 · `P1` — FR-STUDIO-20
- [x] Mode fokus; mengetuk area konten mematikannya · `P1` — FR-STUDIO-20
- [x] 4 aturan validasi — versi EN harus **lengkap atau tidak ada** · `P0` — FR-STUDIO-21
- [x] Sheet "Simpan atau terbitkan?" + konfirmasi "Publish tanpa English?" dengan 2 jalan keluar · `P0` — FR-STUDIO-21
- [x] Catatan penulis per bahasa + jadwal terbit dari dalam editor · `P1` — FR-STUDIO-22
- [x] Bilah alat pemformatan **berfungsi**: bold/italic/kutip/paragraf via `contenteditable` + markdown · `P1`
  ↳ Dibangun lewat **markdown pada `textarea`**, bukan `contenteditable`: `execCommand` sudah usang dan hasilnya HTML, sementara `ChapterContent.body` menyimpan **paragraf teks**. Markdown menjaga apa yang diketik sama dengan apa yang disimpan.
- [x] **Test:** autosave — ketik → tutup tab → buka lagi → tawaran pemulihan berisi naskah yang benar · `[BARU]`
- [x] **Test:** simpan server gagal 4× → sisipan muncul, editor **tetap menerima ketikan**, dan draf lokal masih utuh · `[DESAIN]`
- [ ] **Test e2e #3:** tulis bab dwibahasa → atur akses → kirim terbit → tinjau → tayang
  ↳ Bagian yang bisa dijalankan sudah: **tulis bab dwibahasa → terbitkan → tayang di daftar bab**, di dua lebar layar. "Atur akses" menunggu 8e dan "tinjau" menunggu 8f.
- [x] `getChapterDraft` + `saveChapterDraft` ditambahkan ke seam — `chapterId` boleh `null` supaya bab baru lahir di penyimpanan pertama, bukan saat editor dibuka · `[LUAR]`
- [x] Sakelar kegagalan autosave di `/dev/kitchen-sink` — `DRAFT-409` menuntut empat kegagalan berturut-turut dan mustahil dipicu tangan di server yang selalu berhasil · `[LUAR]`
- [x] `TextArea` menerima `ref` — bilah alat pemformatan perlu tahu di mana kursornya · `[LUAR]`
- [x] **Test e2e #7:** editor bab dwibahasa dijalankan di dua lebar layar · `[LUAR]`

### 8e. Akses bab `/karya/:id/bab/:id/akses` · 2 h

- [x] **Halaman tahu bab mana yang sedang diatur** — dibuka dengan `?chapter_id=`, judul + nomor bab di kepala halaman · `P0` — FR-STUDIO-36 · `[BARU]`
  ↳ Memakai **parameter rute** `/karya/:id/bab/:babId/akses` seperti tabel rute §8, bukan `?chapter_id=` — keduanya membawa konteks yang sama, dan yang pertama sudah jadi bentuk seluruh rute studio.
- [x] Tipe akses awal, harga, dan porsi pratinjau **dimuat dari data bab**, bukan selalu "Berbayar" dan 3 koin · `P0` — FR-STUDIO-36 · `[BARU]`
- [x] *"Chapter pertama tidak bisa diprivatkan"* **ditegakkan**: opsi Privat nonaktif bila bab nomor 1, disertai alasan · `P0` — FR-STUDIO-36 · `[BARU]`
- [x] Jumlah pembeli pada konfirmasi ubah-ke-gratis diambil dari data bab, bukan angka tetap · `P0` — FR-STUDIO-36 · `[BARU]`
- [x] Batas "tidak bisa dibatalkan dalam 7 hari" dihitung dari tanggal perubahan terakhir bab itu; masih dalam masa itu → opsi ditahan + sisa hari · `P0` — FR-STUDIO-36 · `[BARU]`
- [x] Menetapkan **Berbayar** mensyaratkan status penulis **terverifikasi** · `P0` — FR-STUDIO-33/36 · `[BARU]`
- [x] Tombol kembali mengembalikan ke kelola bab **pada posisi bab tersebut** · `P1` — FR-STUDIO-36 · `[BARU]`
- [x] 3 tipe akses + panel yang muncul sesuai pilihan + teks konteks per tipe · `P0` — FR-STUDIO-23
- [x] Tombol simpan **membandingkan dengan nilai awal**, bukan mendeteksi interaksi · `P0` — FR-STUDIO-23
- [x] 3 dialog konfirmasi transisi berisiko; tipe tujuan ditahan di `pending` sampai disetujui · `P0` — FR-STUDIO-24
- [x] Harga 1–50 koin dengan penjepitan + estimasi pendapatan 80/20 + saran harga · `P0` — FR-STUDIO-25
- [x] Penggeser pratinjau gratis 0–50%, awal 20% · `P0` — FR-STUDIO-25
- [x] Panel privat: alasan, durasi, tanggal tampil kembali (min hari ini) · `P1` — FR-STUDIO-26
- [x] `ChapterSummary` mendapat `previewPct`, `accessChangedAt`, `privateReason`, `privateUntil` — empat kolom yang menjadikan aturan konteks bisa ditegakkan, bukan sekadar tertulis di layar · `[LUAR]`
- [x] `getChapterAccess` + `setChapterAccess` di seam; keempat aturannya ditegakkan **server**, bukan hanya menonaktifkan tombol · `[LUAR]`
- [x] Bagi hasil penulis datang dari server (`authorSharePct`), bukan `AUTHOR_SHARE` di `lib/coin.ts` — berkas itu melarang tegas memakainya untuk angka yang ditampilkan (FR-EARN-12) · `[LUAR]`
- [x] **Test e2e #8:** alur akses bab dijalankan di dua lebar layar · `[LUAR]`

### 8f. Jadwal terpadu & antrean tinjauan · 3–4 h · `[BARU]`

- [x] **Jadwal terbit terpadu** `/karya/jadwal` — satu daftar terurut waktu: cerita akan terbit, bab akan terbit, bab privat yang dijadwalkan tampil kembali · `P1` — FR-STUDIO-37
- [x] Setiap entri: cerita · bab · tanggal & jam · pengulangan · ubah jadwal · batalkan · `P1` — FR-STUDIO-37
- [x] **Tiga metrik ringkas di kepala halaman**: Terjadwal · Celah · Bentrok, dihitung dari daftar · `P1` · `[DESAIN]`
- [x] Tiga tab: Semua · Terjadwal · **Perlu tindakan** (celah + bentrok jadi satu tab, karena keduanya menuntut keputusan) · `P1` · `[DESAIN]`
- [x] Tombol **batalkan** per entri — diminta PRD, tidak digambar kanvas · `P1` — FR-STUDIO-37
- [x] **Peringatan bentrok** bila dua penerbitan cerita yang sama berjarak < 1 jam · `P1` — FR-STUDIO-37
- [x] **Peringatan celah** bila cerita rutin tidak punya jadwal berikutnya · `P1` — FR-STUDIO-37
- [x] Ketiga penjadwal lama tetap berfungsi sebagai jalur cepat — ini ringkasan, bukan pengganti · `P1` — FR-STUDIO-37
- [x] Rekomendasi waktu terbaik dari analitik penulis (*"Sabtu 20.00"*) sebagai pintasan pengisian · `P2` — FR-STUDIO-37
  ↳ Ditutup di Langkah 31 dengan angka nyata: hari terbaik dihitung dari deret views cerita itu. Muncul di **dua tempat** — catatan entri celah pada jadwal terpadu, dan chip pengisi di penjadwal bab yang benar-benar mengisi tanggal & jamnya.
- [x] **Waktu disimpan UTC + zona waktu penulis**, ditampilkan mengikuti zona waktu pengguna (menutup PRD 07 §7 #12) · `P0` — FR-STUDIO-37
- [x] **Empat keadaan gagal jadwal** (kanvas layar 41), masing-masing dengan tingkat penyampaiannya sendiri · `P1` — arch §1.5 · `[DESAIN]`
  - [x] `SCHED-409` dua bab pada slot sama → **sisipan**; nyatakan bab kedua ditahan, bukan terbit dua kali; aksi menggeser satu jam
  - [x] `SCHED-422` waktu sudah lewat → **inline**; bab tetap draf, tawarkan slot terdekat
  - [x] `SCHED-200` zona waktu pengguna berubah → **toast**; nyatakan momen terbit **tidak bergeser**, hanya tampilannya
  - [x] `SCHED-000` celah jadwal → **sisipan bernada peringatan, bukan kegagalan** — hiatus yang disengaja tidak perlu diperbaiki
- [x] **Test:** dua bab cerita sama berjarak 30 menit → bentrok; mengubah zona waktu perangkat tidak mengubah momen terbit yang tersimpan · `[DESAIN]`
- [x] **Antrean tinjauan** — dua status baru pada cerita: `Dalam tinjauan` (batalkan pengiriman · edit → kembali ke draft) dan `Ditolak` (lihat alasan · perbaiki & kirim ulang) · `P0` — FR-STUDIO-38
- [x] **Alasan penolakan spesifik & dapat ditindaklanjuti** — mengikuti contoh baik di riwayat cetak · `P0` — FR-STUDIO-38
- [x] Cerita & bab dalam tinjauan **tidak tampil ke pembaca** · `P0` — FR-STUDIO-38
- [x] **Satu antrean untuk empat sumber**: cerita, bab, laporan pembaca (Fase 10), pesanan cetak menunggu konfirmasi · `P0` — FR-STUDIO-38
- [ ] Penulis menerima notifikasi saat status tinjauan berubah (jalurnya di Fase 11) · `P1` — FR-STUDIO-38
  ↳ Menunggu **Fase 11**. Keputusan tinjauan sendiri sudah tercatat lengkap beserta alasannya, jadi yang kurang hanya kanal pengantarnya.
- [x] `cancelScheduleEntry` · `submitForReview` · `withdrawFromReview` ditambahkan ke seam — tiga aksi yang dituntut PRD tetapi belum punya metode · `[LUAR]`
- [x] Rute baru `/karya/tinjauan` (jadi **42 rute**) — antrean tinjauan tidak digambar kanvas dan tidak ada di tabel rute §8 · `[LUAR]`
- [x] `publishChapter` kini **melewatkan naskah baru ke tinjauan**, bukan menayangkannya seketika — tanpa itu FR-STUDIO-38 hanya berlaku untuk cerita, dan babnya menyelinap lewat · `[LUAR]`
  ↳ Bab yang sudah pernah lolos tinjauan tetap terbit langsung. Aturannya di `architecture.md` §1.11.
- [x] Tombol admin **"Setujui seluruh antrean"** di `/dev/kitchen-sink` — penulis tidak boleh menyetujui karyanya sendiri, jadi tanpa tombol ini antrean tinjauan adalah layar yang tidak pernah bisa kosong · `[LUAR]`
- [x] **Kepala halaman ganda di delapan halaman `topbar`** — `TopBarLayout` sudah merender `<h1>` beserta tombol kembali, dan tiap halaman sejak Fase 6 menambahkan miliknya sendiri · `[LUAR]`
  ↳ Ditemukan oleh e2e 8f sebagai *strict mode violation* — dua `<h1>` pada satu layar. Cacat aksesibilitas yang sudah berumur empat fase dan tidak pernah terlihat karena kedua judulnya berbunyi sama.
- [x] `/karya/jadwal` dan `/karya/tinjauan` masuk sapuan HP (**15 halaman**), dan alur jadwal + tinjauan diuji di dua lebar layar · `[LUAR]`

### 8g. Analitik cerita & riwayat cetak · 3–4 h

- [x] 5 rentang waktu + panel custom (maks hari ini) + 4 kartu metrik dengan gulir mulus ke bagian tujuan · `P0` — FR-STUDIO-27
- [x] Grafik SVG 2 lapisan; **jaga minimal satu lapisan aktif** · `P1` — FR-STUDIO-28
- [x] Performa per bab + lencana "Drop" + sheet detail; **urutan berfungsi** · `P0` — FR-STUDIO-29
- [x] Sentimen komentar · asal pembaca · kalender aktivitas publish · `P2` — FR-STUDIO-30
- [x] **Sentimen & jumlah komentar dihitung dari data nyata** setelah Fase 10 (sebelum itu dari seed) · `P2` — FR-SOCIAL-08 · `[BARU]`
  ↳ Ditutup di Langkah 38. Sentimen kini **diturunkan dari bintang ulasan cerita itu** — empat ke atas positif, tiga netral, dua ke bawah negatif. Bukan analisis nada, dan `ponytail:`-nya menyebut batas itu; tetapi sinyalnya nyata dan dipilih pembacanya sendiri. Tanpa ulasan sama sekali ketiganya nol, bukan angka karangan.
- [x] Ekspor PDF & kartu pencapaian → berkas nyata dari klien (Canvas → PNG, `window.print()` → PDF) · `P2` — FR-STUDIO-31
- [x] Riwayat cetak: 3 keadaan pesanan + lini masa 6 tahap (`StageTrack`); format `#HDC-`/`#SFT-`; Download Invoice; Hubungi Admin · `P1` — FR-STUDIO-32
- [x] **Lini masa dari PRD, bukan dari mockup** — kanvas menggambar empat langkah; yang benar enam tahap Diajukan → Dikonfirmasi → Dibayar → Dicetak → Dikirim → Diterima · `P1` — arch §1.5 · `[DESAIN]`
- [x] Alasan penolakan konkret dan menyebut kebijakannya (*minimum 10 bab aktif agar layak dijilid*) · `P1` — FR-STUDIO-32
- [x] Empat tab saringan: Semua · PDF · Hardcopy · Berjalan, masing-masing dengan keadaan kosongnya sendiri · `P2` · `[DESAIN]`
- [x] **Pembatalan dibatasi tahap**: boleh sebelum produksi (tanpa biaya), ditolak sesudahnya — dan **penolakannya menjelaskan alasannya**, bukan tombol yang dimatikan diam-diam · `P1` · `[DESAIN]`
- [x] **Empat keadaan gagal cetak** (kanvas layar 41) · `P1` — arch §1.5 · `[DESAIN]`
  - [x] `PRINT-504` PDF gagal dibuat → **sisipan**; naskah asli tidak tersentuh, tidak ada biaya; jalan keluarnya **memecah jadi 3 berkas**, bukan sekadar coba lagi
  - [x] `PRINT-410` berkas lewat masa simpan 30 hari → **inline**; buat ulang gratis dan tidak memotong kuota
  - [x] `PRINT-409` sudah masuk produksi → **toast**; biaya sudah terkonfirmasi, jalurnya klaim cetak lewat dukungan
  - [x] `PRINT-402` biaya diubah admin → **layar penuh**; nyatakan **belum ada yang ditagihkan**, produksi berhenti sampai penulis menyetujui biaya baru
- [x] **Test:** membatalkan pesanan pada tahap Dicetak ditolak beserta alasannya; menyetujui biaya baru meneruskan pesanan ke produksi, menolaknya tidak menagih apa pun · `[DESAIN]`

---

- [x] `getStoryAnalytics` ditambahkan ke seam — analitik sama sekali belum punya metode; seluruh angkanya **diturunkan**, tidak ada tabel baru · `[LUAR]`
- [x] `listPrintOrders` menerima `PrintOrderParams` — keempat tab menyaring di server, bukan memotong daftar di layar · `[LUAR]`
- [x] `regeneratePrintFile` ditambahkan ke seam — rentang bab saat memecah berkas dihitung server; klien tidak tahu berapa bab yang aktif · `[LUAR]`
- [x] `/karya/:id/analitik` dan `/karya/cetak` dinaikkan dari guard `auth` ke `penulis` — aturannya sudah tertulis tepat di atas tabel rute, hanya penampungnya yang belum mengikutinya · `[LUAR]`
- [x] Seed: satu pesanan **ditolak** beserta alasan kebijakannya; `SEED_VERSION` 10 → 11 — keadaan ketiga PRD tidak punya satu pun baris contoh · `[LUAR]`
- [x] **`SCHED-200` tidak lagi dipicu tombol.** Pemicunya kini keadaan sungguhan: zona waktu perangkat berbeda dari zona waktu penulis saat entri dijadwalkan · `[LUAR]`
  ↳ Tombol yang memicu pemberitahuan tentang keadaan nyata adalah pemberitahuan yang tidak pernah muncul saat keadaan itu benar-benar terjadi.
- [x] Sisipan `PRINT-402` benar-benar **menghentikan halaman**, bukan spanduk di atas daftar yang tetap terlihat · `[LUAR]`
  ↳ Ketahuan dari test: tombol "Setujui biaya baru" muncul dua kali untuk pesanan yang sama. Tingkat "layar penuh" yang isinya masih bisa dipakai bukan layar penuh.
- [x] Penghentian biaya dibaca dari daftar **tanpa saringan** — memilih tab "PDF" tidak boleh menyembunyikan pesanan hardcopy yang produksinya sedang berhenti · `[LUAR]`
- [x] `/karya/ms1/analitik` dan `/karya/cetak` masuk sapuan HP (**17 halaman**), dan alur analitik + cetak diuji di dua lebar layar · `[LUAR]`

## Fase 9 — Penghasilan Penulis · 4–5 hari · **M4**

- [x] Handler mock: `getAuthorAnalytics`, `getPayoutBalance`, `requestWithdrawal` (idempoten), `listWithdrawals`
- [ ] **Tiga pintu masuk baru** — metrik Coins di `/karya` · tautan "Penghasilan & Pencairan" · menu di `/profil` (hanya untuk penulis terdaftar) · `P0` — FR-EARN-10 · `[BARU]`
  ↳ **Dua dari tiga sudah** dan keduanya kini menuju halaman sungguhan, bukan penampung: metrik Coins dan tautan "Penghasilan & Pencairan" di `/karya`. Menu di `/profil` menunggu **Fase 13** — halaman profilnya belum ada, jadi tidak ada tempat untuk menaruhnya. Fase 13 punya itemnya sendiri untuk tautan ini ("tautan Pusat Hadiah & Penghasilan Penulis"), jadi keduanya dibangun sekaligus di sana.
- [ ] Tautan Payout identity di ubah-profil diarahkan ke penarikan lokal; tombol kembali analitik → `/karya` · `P0` — FR-EARN-10 · `[BARU]`
  ↳ **Separuh kedua sudah**: tombol kembali analitik pulang ke `/karya` lewat `fallback` rutenya. Tautan Payout identity menunggu **Fase 13** bersama layar ubah-profil.
- [x] Ringkasan 3 KPI + pemilih rentang **yang sama dengan analitik cerita** · `P0` — FR-EARN-01
- [x] Pemilih sudut pandang Pendapatan/Retensi/Traffic yang **benar-benar mengganti isi** · `P1` — FR-EARN-02
- [x] Kartu metrik + kurva pendapatan 7 batang · `P0` — FR-EARN-03
- [x] Corong pembaca 4 tahap · `P0` — FR-EARN-04
- [x] Heatmap rilis + catatan aksi; tautan langsung ke penjadwal dengan waktu terisi · `P1` — FR-EARN-05
- [x] Penarikan: saldo + syarat min Rp 100.000 + estimasi 1–3 hari kerja, tampil **sebelum** formulir · `P0` — FR-EARN-06
- [x] Rekening tersamar `**** 4481` + status terverifikasi + tujuan penarikan · `P0` — FR-EARN-07
- [x] Perhitungan otomatis: non-digit dibuang, fee Rp 5.000, bersih dijepit ≥ 0 · `P0` — FR-EARN-08
- [x] **Tangga validasi 5 tingkat, berhenti pada kesalahan pertama** — jumlah > 0 → ≥ Rp 100.000 → ≤ saldo → rekening terverifikasi → verifikasi 2 langkah aktif (+ tautan ke keamanan) · `P0` — FR-EARN-11 · `[BARU]`
- [x] Tombol pengajuan **nonaktif** selama jumlah belum valid — bukan menolak setelah ditekan · `P0` — FR-EARN-11 · `[BARU]`
- [x] Pintasan **"Tarik semua"** mengisi kolom dengan saldo tersedia · `P1` — FR-EARN-11 · `[BARU]`
- [x] Setelah pengajuan berhasil, saldo tersedia **langsung ditahan** sehingga dana yang sama tidak bisa diajukan dua kali · `P0` — FR-EARN-11 · `[BARU]`
- [x] Lini masa 3 tahap + pengajuan · `P0` — FR-EARN-09
- [x] **Riwayat penarikan** `/penulis/penarikan/riwayat` — tanggal · diminta · biaya · diterima bersih · rekening tersamar · status · `P1` — FR-EARN-12 · `[BARU]`
- [x] Status 4 tahap: Diajukan → Ditinjau → Ditransfer, plus **Ditolak dengan alasan**; bukti transfer dapat diunduh · `P1` — FR-EARN-12 · `[BARU]`
- [x] **Kurs koin → rupiah dinyatakan eksplisit** beserta contoh perhitungan — sampai sekarang tidak ada kurs yang terlihat di mana pun · `P1` — FR-EARN-12 · `[BARU]`
- [x] Bagi hasil 80/20 ditampilkan ulang di sini: pembaca membayar → potongan platform → koin penulis → rupiah · `P1` — FR-EARN-12 · `[BARU]`
- [x] Kurs & bagi hasil dari **konfigurasi server-mock**, bukan konstanta di kode · `P1` — FR-EARN-12 · `[BARU]`
- [x] **Test:** unit — `3000` → bersih Rp 0 (bukan negatif); huruf → 0 tanpa error
- [x] **Test:** handler — Rp 50.000 ditolak di tingkat 2; Rp 200.000 dengan saldo Rp 150.000 ditolak di tingkat 3 · `[BARU]`

> **M4 tercapai:** sisi penulis lengkap — daftar, tulis (tanpa risiko kehilangan naskah), jadwalkan, kunci, kirim tinjauan, pantau, cairkan, dan lihat riwayatnya.

---

- [x] `src/api/mock/config.ts` — kurs koin, bagi hasil, biaya admin, dan batas minimum jadi **satu konfigurasi server-mock** · `[LUAR]`
  ↳ `AUTHOR_SHARE_PCT` sempat hidup sendirian di `handlers/chapters.ts`; handler penghasilan yang menyalinnya akan berselisih diam-diam pada perubahan kebijakan berikutnya. Ini juga mendahului sebagian tugas "kurs & bagi hasil dari konfigurasi server-mock" di bawah — mekanismenya sudah ada, layarnya belum.
- [x] **Seed penarikan diperbaiki**: jumlahnya melebihi penghasilan seumur hidup penulis contoh, jadi saldo tersedia selalu terjepit nol · `SEED_VERSION` 11 → 12 · `[LUAR]`
  ↳ Rp 7,7 juta ditarik dari Rp 3,57 juta yang pernah dihasilkan. Alur pencairan mustahil dicoba, dan tidak ada satu pun test yang bisa lulus tanpa ikut berbohong.
- [x] Judul rute `/penulis/analitik` jadi **"Penghasilan"** — "Analitik penulis" bertabrakan dengan analitik cerita di kepala halaman · `[LUAR]`
- [x] `/penulis/analitik` masuk sapuan HP (**18 halaman**), dan alur penghasilan diuji di dua lebar layar · `[LUAR]`

- [x] `getPayoutRate` ditambahkan ke seam — kurs, bagi hasil, biaya, minimum, **dan contoh perhitungannya** datang dari server · `[LUAR]`
  ↳ Contohnya memakai harga bab berbayar sungguhan milik penulis itu, bukan angka bulat: penulis yang menjual babnya 5 koin perlu melihat 5 koin, karena itu yang ia cocokkan dengan buku besarnya.
- [x] **Tingkat buka dikoreksi jadi per-cerita**, bukan agregat — FR-EARN-04 menuntutnya konsisten dengan tahap "Bayar" corong · `[LUAR]`
  ↳ Koreksi atas Langkah 32. Cara menepatinya yang tidak bisa lapuk: **tidak pernah menghitungnya dua kali**. Aturannya di `architecture.md` §1.14.
- [x] **Corong dijepit monoton**, dan tahap tengah menyebut bab yang benar-benar dipakai · `[LUAR]`
  ↳ Ketahuan dari test: cerita yang bab premiumnya adalah bab pertama membuat tahap Premium melompati tahap sebelumnya. Corong yang naik berhenti masuk akal sebagai gambar.
- [x] **Satu sumber "hari terbaik"** — kurva pendapatan, heatmap, jadwal terpadu, dan penjadwal bab kini membacanya dari `weekdayWeights` yang sama · `[LUAR]`
  ↳ Sebelumnya bobot kurva adalah array tetap, jadi penulis bisa membaca "Sabtu 20.00" di satu layar dan hari lain di layar berikutnya.
- [x] `?jadwalkan=terbaik` pada kelola bab — penjadwal terbuka dengan waktu terbaik **sudah terisi**, diturunkan dari URL tanpa efek penyalin · `[LUAR]`
- [x] **Tiga sisa `toISOString().slice(0,10)` diperbaiki** — dua di test dan satu di nama berkas ekspor CSV · `[LUAR]`
  ↳ Jebakan §8 yang sudah tercatat menggigit test buatan sendiri: ia lulus lima hari lalu gagal saat tanggalnya berganti. Nama berkas kuitansi juga akan bertanggal kemarin tiap pagi WIB.
- [x] `/penulis/penarikan/riwayat` masuk sapuan HP (**19 halaman**), dan alur penghasilan di dua lebar layar diperluas sampai riwayat pencairan · `[LUAR]`

- [x] `src/lib/payout.ts` — pembersihan masukan, hitung bersih, dan **tangga lima tingkat** sebagai fungsi murni · `[LUAR]`
  ↳ Aturannya ditegakkan **dua kali**: layar memakainya untuk mematikan tombol sebelum ditekan, server memakainya untuk menolak layar yang dilewati. Satu berkas supaya keduanya tidak pernah berbeda kalimat.
- [x] `getPayoutAccount` ditambahkan ke seam — rekening tersamar beserta `payoutVerified` & `twoFactor` · `[LUAR]`
  ↳ Nomor penuhnya **tidak pernah meninggalkan server**. Kedua bendera ikut karena keduanya tingkat 4 dan 5 tangga validasi, dan layar perlu tahu untuk mematikan tombolnya lebih dulu.
- [x] `WithdrawInput.purpose` — tujuan pencairan ikut tercatat di pengajuan · `[LUAR]`
- [x] Pesan penolakan memakai `Rp 100.000` dengan **spasi biasa**, bukan `formatRupiah` · `[LUAR]`
  ↳ `Intl` menyisipkan non-breaking space, dan pesan ini dibandingkan sebagai string di test serta digabung ke kalimat server — spasi yang terlihat sama tetapi berbeda kode adalah kegagalan yang mustahil dibaca.
- [x] `/penulis/penarikan` masuk sapuan HP (**20 halaman**), dan alur pengajuan diuji di dua lebar layar dengan tombol dok bawah yang **benar-benar ditekan** · `[LUAR]`

## Fase 10 — Sosial: Rating, Ulasan & Komentar · 5–7 hari · `[BARU]`

Modul baru (`prd_12`). Rating dan ulasan **dikonsumsi di enam tempat tetapi tidak diproduksi di satu tempat pun** — tiga tautan menggantung menuju fitur yang sama, ditambah satu misi hadiah yang tidak bisa diselesaikan.

- [x] Handler mock: `rateStory`, `submitReview`, `listReviews`, `listComments`, `react`, `report`
  ↳ Keenamnya ada. `react` melayani dua sasaran sekaligus — "membantu" pada ulasan dan suka pada komentar — dengan aturan berbeda: ulasan sendiri tidak bisa ditandai membantu, komentar sendiri boleh disukai.
- [x] **Beri rating** — skala 1–5 **bilangan bulat** (rata-rata boleh berdesimal, masukan tidak) · `P0` — FR-SOCIAL-01
- [x] **Syarat kelayakan: sudah membaca minimal satu bab** — bila belum, tampilkan ajakan membaca dulu, bukan menolak diam-diam · `P0` — FR-SOCIAL-01
- [x] Rating dapat diubah kapan saja dan dihapus; rata-rata cerita dihitung ulang setiap kali · `P0` — FR-SOCIAL-01
- [x] Tombol Rate menampilkan keadaan: `Rate` bila belum menilai, bintang yang diberikan bila sudah · `P0` — FR-SOCIAL-01
- [x] Setelah memberi bintang, ajakan **opsional** menulis ulasan — memberi bintang saja sudah sah · `P0` — FR-SOCIAL-01
- [x] **Tulis ulasan** — wajib disertai rating; 20–1000 karakter dengan penghitung langsung · `P0` — FR-SOCIAL-02
- [x] Tag deskriptif dari daftar tersedia, maks 3 (`slow burn`, `chemistry`, `plot twist`) · `P1` — FR-SOCIAL-02
- [x] Satu ulasan per pasangan (pengguna, cerita); menulis lagi = menyunting; ulasan tersunting diberi penanda "disunting" · `P0` — FR-SOCIAL-02
- [x] **Menghapus ulasan tidak menghapus ratingnya** — keduanya terpisah · `P0` — FR-SOCIAL-02
- [x] Draf ulasan belum terkirim disimpan lokal (`novelova:review-draft-<storyId>`) · `P1` — FR-SOCIAL-02
- [x] **Halaman ulasan** `/cerita/:id/ulasan` — menggantikan tautan menggantung `detail_story_tabs.html#reviews-panel` · `P0` — FR-SOCIAL-03, FR-CORE-05
- [x] Ringkasan atas: rata-rata + jumlah penilai + **grafik sebaran 5★…1★** dengan batang proporsional · `P0` — FR-SOCIAL-03
- [x] Tag terpopuler sebagai pil dengan jumlah pemakaian; menekannya menyaring ulasan bertag itu · `P1` — FR-SOCIAL-03
- [x] Saring: semua · per bintang · hanya yang ada teksnya. Urut: paling membantu (default) · terbaru · rating tertinggi · terendah · `P1` — FR-SOCIAL-03
- [x] Kartu ulasan: avatar & nama · bintang · tanggal · tag · teks · jumlah "membantu" · tanggapan penulis · `P0` — FR-SOCIAL-03
- [x] Ulasan sendiri **selalu paling atas** dengan tombol sunting & hapus; paginasi 20; keadaan kosong = ajakan jadi pengulas pertama · `P1` — FR-SOCIAL-03
- [x] Tombol **"Membantu"** dengan penghitung, satu kali per pengguna, dapat dibatalkan, **tidak bisa** untuk ulasan sendiri · `P1` — FR-SOCIAL-04
- [x] **Tanggapan penulis** menempel di bawah ulasan dengan lencana **Penulis** berwarna aksen; satu per ulasan; hanya pemilik cerita · `P1` — FR-SOCIAL-04
- [x] **Komentar bab** `/cerita/:id/bab/:id/komentar` — menggantikan tautan menggantung `chapter_comments_thread_best_ads.html` · `P0` — FR-SOCIAL-05, FR-CORE-05
- [x] Komentar terikat pada **satu bab**, bukan cerita — konsisten dengan analitik yang menghitung komentar per bab · `P0` — FR-SOCIAL-05
- [x] **Bab terkunci → komentarnya tidak bisa dibaca maupun ditulis** — mencegah bocornya isi cerita ke pembaca yang belum membeli · `P0` — FR-SOCIAL-05
- [x] Maks 500 karakter; **balasan satu tingkat saja** (balasan atas balasan digabung ke utas yang sama) · `P0` — FR-SOCIAL-05
- [x] Urut: terbaru (default) · paling disukai · terlama. Reaksi suka per komentar. Paginasi 20 · `P1` — FR-SOCIAL-05
- [x] Komentar **sedang ditinjau** tetap menempati barisnya, isinya diganti keterangan alasan — tidak hilang diam-diam (kanvas layar 18) · `P1` — FR-SOCIAL-07 · `[BARU]`
- [x] Komentar penulis cerita diberi lencana **Penulis** · `P1` — FR-SOCIAL-05
- [x] Baris reaksi di reader menautkan ke sini dengan `chapter_id` dan menampilkan jumlah komentar bab · `P0` — FR-SOCIAL-05
- [x] **Penanda spoiler** pada ulasan & komentar — buram + "Spoiler — ketuk untuk melihat"; membuka satu tidak membuka yang lain · `P1` — FR-SOCIAL-06
- [x] Spoiler tertutup diberi `aria-hidden`; tag `plot twist` **tidak** otomatis menandai spoiler · `P1` — FR-SOCIAL-06
- [x] **Laporkan** — 6 alasan (Spam · Pelecehan · Spoiler tanpa penanda · Konten dewasa · Plagiarisme · Lainnya + keterangan) · `P0` — FR-SOCIAL-07
- [x] Satu laporan per pasangan (pengguna, objek); pelapor dapat konfirmasi diterima, **tidak** dapat kabar hasil · `P0` — FR-SOCIAL-07
- [x] Konten dilaporkan **tetap tampil** sampai ditinjau, kecuali melewati ambang laporan · `P0` — FR-SOCIAL-07
- [x] Laporan masuk ke **antrean tinjauan yang sama** dengan Fase 8f · `P0` — FR-SOCIAL-07, FR-STUDIO-38
- [x] **Blokir pengguna** — komentar & ulasan pengguna terblokir disembunyikan dari tampilannya · `P1` — FR-SOCIAL-07
- [x] Tombol Report di detail cerita memakai alur yang sama · `P0` — FR-SOCIAL-07
- [x] **Integrasi ke fitur yang sudah ada** — misi "Tulis satu ulasan" jadi 100% dapat diklaim · entri feed aktivitas profil dibuat otomatis · rating pada semua kartu & statbar dari data nyata · `P1` — FR-SOCIAL-08
- [x] Misi ulasan hanya dapat diselesaikan **satu kali per hari**, bukan per cerita — mencegah ulasan asal demi koin · `P1` — FR-SOCIAL-08
- [x] **Visibilitas dihormati, dua hal berbeda**: ulasan tetap tampil di halaman ulasan cerita (konten publik cerita), tetapi **tidak** di profil publik penulisnya bila sakelarnya mati · `P1` — FR-SOCIAL-08, FR-PROF-10
- [x] **Test:** handler — satu ulasan per pasangan; menulis kedua kali menyunting yang lama · `[BARU]`
- [x] **Test:** handler — hapus ulasan → rating tetap ada, rata-rata cerita tidak berubah · `[BARU]`
- [x] **Test:** handler — menilai cerita yang belum pernah dibaca → ditolak dengan ajakan, bukan error · `[BARU]`
- [x] **Test e2e #5:** baca bab → beri rating → tulis ulasan → misi hadiah selesai

---

- [x] `getMyRating`, `deleteRating`, dan `replyToReview` ditambahkan ke seam · `[LUAR]`
  ↳ Tombol Rate perlu tahu keadaannya, dan **rating bisa ada tanpa ulasan** — jadi `listReviews().myReview` saja tidak cukup.
- [x] `ReviewParams` — saring bintang, saring "ada teksnya", saring tag, dan empat urutan, semuanya **menyaring di server** · `[LUAR]`
- [x] `ReviewPage.canReply` dari server — layar tidak menghitung ulang siapa yang boleh menanggapi · `[LUAR]`
  ↳ Aturannya sudah hidup di `replyToReview`; menghitungnya lagi di klien berarti dua tempat yang bisa berselisih.
- [x] **Menghapus rating ikut menghapus ulasannya** — arahnya sengaja tidak simetris · `[LUAR]`
  ↳ Ulasan wajib disertai rating (FR-SOCIAL-02), jadi ulasan tanpa bintang tidak boleh tertinggal. Sebaliknya menghapus ulasan tidak menyentuh ratingnya sama sekali.
- [x] Modul ulasan ditaruh di `features/story/`, bukan `features/social/` · `[LUAR]`
  ↳ Detail cerita memakai lembar rating, dan `features/*` tidak boleh mengimpor `features/*` lain (aturan struktur #2). Rating & ulasan memang milik cerita — rutenya pun `/cerita/:id/…`.
- [x] Label textarea ulasan jadi **"Tulis ulasanmu"**, berbeda dari judul section "Ulasanmu" · `[LUAR]`
  ↳ Dua arti yang sama bunyinya membuat pembaca layar menyebut hal berbeda dengan nama sama — dan membuat e2e menabrak dua elemen sekaligus.
- [x] `db.reactions` hanya berindeks `[userId+targetType+targetId]` — `where('userId')` melempar `DataError` yang tidak menyebut kolomnya · `[LUAR]`
- [x] `/cerita/s1/ulasan` masuk sapuan HP (**21 halaman**), dan alur ulasan diuji di dua lebar layar · `[LUAR]`

- [x] `CommentParams` & `CommentInput` ditambahkan ke seam — urutan menyaring di server, dan `postComment` menerima satu bentuk masukan · `[LUAR]`
  ↳ Tanda tangan lama `postComment(chapterId, text, parentId?)` tidak punya tempat untuk penanda spoiler.
- [x] **`parentId` dinaikkan server, bukan dicegah layar** — membalas sebuah balasan tetap mendarat di utas yang sama · `[LUAR]`
  ↳ Layar yang lupa aturannya akan membuat pohon dalam yang tidak bisa dirender komponennya. Aturannya di `architecture.md` §1.17.
- [x] **Kepemilikan bab dicari lewat indeks `[userId+chapterId]`**, bukan menebak bentuk id primernya · `[LUAR]`
  ↳ Baris seed bernama `own1`, `own2`, sementara yang dibuat runtime memakai pola lain — menebaknya membuat **setiap** bab terbaca sebagai terkunci.
- [x] Pemecah seri `id` pada urutan komentar · `[LUAR]`
  ↳ Dua komentar yang lahir pada milidetik sama punya `createdAt` identik; tanpa pemecah, daftarnya menyusun ulang dirinya sendiri antar pembacaan dan terlihat seperti komentar yang hilang.
- [x] `/cerita/s1/bab/s1-c5/komentar` masuk sapuan HP (**22 halaman**), dan alur komentar diuji di dua lebar layar · `[LUAR]`

- [x] `hasReported`, `blockUser`, `listBlocks`, dan `listActivity` ditambahkan ke seam · `[LUAR]`
- [x] `getRewards` diimplementasikan — progres misi ulasan **diturunkan dari tanggal ulasan**, bukan angka tersimpan · `[LUAR]`
  ↳ Misi yang menyimpan progresnya sendiri akan tetap 100% keesokan harinya. Layar pusat hadiahnya tetap Fase 12; yang dibangun di sini hanya sumber angkanya.
- [x] **Baris `reports` di Dexie dilengkapi** — `targetType`, `note`, `status`, `createdAt` · `[LUAR]`
  ↳ Tipenya semula hanya empat kolom, tidak cukup untuk antrean tinjauan maupun untuk memisahkan laporan cerita dari komentar yang kebetulan ber-id sama.
- [x] **`getChapter` mencatat "bab dibuka"** — progres tidak lagi menunggu gulir pertama · `[LUAR]`
  ↳ Cacat nyata yang ketahuan dari e2e #5: `useReadingProgress` hanya mengirim setelah ada gulir, jadi bab pendek yang muat satu layar tidak pernah meninggalkan jejak — dan pembacanya ditolak saat hendak menilai, dengan alasan yang terdengar salah. Baris progres yang sudah ada **tidak disentuh**. Aturannya di `architecture.md` §1.18.
- [x] Panel progres misi di `/dev/kitchen-sink` — tanpa itu langkah terakhir e2e #5 tidak bisa diperiksa sampai ujung · `[LUAR]`
- [x] Alur laporan & blokir diuji di dua lebar layar; lembar enam alasan mudah melebihi tinggi 390px · `[LUAR]`

## Fase 11 — Notifikasi · 4–5 hari · `[BARU]`

Empat fitur yang sudah dibangun **memicu** notifikasi — sakelar per cerita, penjadwal bab, status cetak, check-in harian — tetapi belum ada tempat menerimanya. Dikerjakan di sini karena mayoritas pemicunya baru ada setelah Fase 10.

- [ ] Handler mock: `listNotifications`, `getUnreadCount`, `markRead`, `getNotificationPrefs`, `setNotificationPrefs`
- [ ] **Pusat notifikasi** `/notifikasi` — terurut terbaru, dikelompokkan kepala hari: **Hari ini · Kemarin · <tanggal>** · `P0` — FR-NOTIF-01
- [ ] Lima saringan: Semua (default) · Cerita · Dompet · Hadiah · Sistem · `P0` — FR-NOTIF-01
- [ ] Baris: ikon jenis · judul · keterangan singkat · waktu relatif (`12 menit lalu`, `Kemarin`) · `P0` — FR-NOTIF-01
- [ ] Menekan notifikasi melakukan **dua hal**: menandainya terbaca **dan** membuka tujuannya · `P0` — FR-NOTIF-01
- [ ] "Tandai semua terbaca"; paginasi 20; notifikasi > **90 hari** tidak ditampilkan · `P1` — FR-NOTIF-01
- [ ] Keadaan kosong: belum ada pemberitahuan + penjelasan kapan notifikasi akan muncul · `P1` — FR-NOTIF-01, FR-CORE-02
- [ ] **11 jenis notifikasi**, masing-masing dengan pemicu yang sudah ada dan **tujuan buka yang spesifik** (tabel FR-NOTIF-02) · `P0` — FR-NOTIF-02
- [ ] Tidak boleh ada notifikasi yang hanya bisa dibaca tanpa tindak lanjut · `P0` — FR-NOTIF-02
- [ ] Notifikasi bab baru hanya dikirim untuk cerita yang **sakelar notifikasinya aktif** — sakelar perpustakaan jadi sumber kebenaran · `P0` — FR-NOTIF-02
- [ ] **Penggabungan di server-mock**: notifikasi sejenis dari cerita yang sama dalam 24 jam jadi satu baris (*"3 bab baru di …"*) · `P1` — FR-NOTIF-02
- [ ] **Lencana belum dibaca** pada ikon lonceng; **> 9 ditulis `9+`**; disembunyikan penuh saat nol (bukan `0`) · `P0` — FR-NOTIF-03
- [ ] Baris belum dibaca berlatar `--nv-accent-soft` + titik penanda; baris terbaca latar kartu biasa · `P0` — FR-NOTIF-03
- [ ] Jumlah disegarkan saat beranda dibuka dan saat aplikasi kembali dari latar belakang · `P1` — FR-NOTIF-03
- [ ] Menandai terbaca bersifat **optimistis** dengan pengembalian bila gagal · `P0` — FR-NOTIF-03, FR-CORE-03
- [ ] **Preferensi per jenis** — **rute modal** `/notifikasi/pengaturan`: dirender sebagai lembar di atas `/notifikasi` (seperti kanvas layar 16) tetapi tetap punya URL sendiri agar dapat ditautkan dari profil · 3 kanal (Dalam aplikasi · Push · Email) × 4 kelompok jenis · `P1` — FR-NOTIF-04
- [ ] **Notifikasi keamanan tidak dapat dimatikan** — sakelar tetap aktif disertai penjelasan · `P0` — FR-NOTIF-04
- [ ] Sakelar per cerita **lebih spesifik** daripada pengaturan global: mematikan global mematikan semua; menyalakan tetap menghormati sakelar per cerita · `P1` — FR-NOTIF-04
- [ ] Preferensi **disimpan di server**, berlaku lintas perangkat; menu menuju ke sini ditambahkan di kelompok Akun profil · `P1` — FR-NOTIF-04, FR-CORE-01
- [ ] **Test:** lencana — 3 belum dibaca → `3`; 15 → `9+`; 0 → lencana tidak dirender · `[BARU]`
- [ ] **Test:** handler — sakelar cerita mati → bab baru tidak menghasilkan notifikasi · `[BARU]`
- [ ] **Test:** handler — 3 bab satu hari dari cerita sama → satu baris tergabung · `[BARU]`

---

## Fase 12 — Pusat Hadiah & Voucher Terpadu · 4–6 hari

- [ ] Handler mock: `getRewards`, `claimCheckIn`, `claimMission`, `getReferral`, `listVouchers`
- [ ] Ringkasan 3 angka: koin hadiah periode berjalan (bukan saldo kedua) · voucher + peringatan hampir kedaluwarsa · streak · `P1` — FR-RWD-01, FR-WALLET-17
- [ ] Check-in 7 hari dengan hadiah menaik; hari ke-7 = voucher bundle · `P0` — FR-RWD-02
- [ ] **Klaim dicatat per akun per tanggal**, tanggal dari **zona waktu pengguna**; klaim kedua ditolak **server**, bukan hanya tombol nonaktif · `P0` — FR-RWD-07 · `[BARU]`
- [ ] **Aturan streak**: melewatkan satu hari → kembali ke Hari 1; hari ke-7 memberi voucher lalu siklus mulai ulang · `P0` — FR-RWD-07 · `[BARU]`
- [ ] Misi harian dengan batang progres; tombol berubah sesuai keadaan · `P1` — FR-RWD-03
- [ ] **Progres misi dari aktivitas nyata**: "Baca 3 chapter" dari bab selesai · "Tulis satu ulasan" dari ulasan terkirim · "Tonton iklan" dari tayangan selesai · `P0` — FR-RWD-07 · `[BARU]`
- [ ] Misi mereset setiap hari mengikuti tanggal pengguna · `P1` — FR-RWD-07 · `[BARU]`
- [ ] Referral: kode read-only + Salin; **hadiah 200 koin baru diberikan setelah teman mendaftar DAN menyelesaikan bab pertamanya** · `P1` — FR-RWD-04/07 · `[BARU]`
- [ ] **Voucher terpadu** — satu tempat menyimpan, dua cara memperoleh (hadiah sistem · tukar kode luar) · `P0` — FR-RWD-06 · `[BARU]`
- [ ] Setiap voucher membawa aturannya: cakupan (bab tertentu / N bab pertama / seluruh cerita / lintas cerita) · nilai (gratis / diskon %) · masa berlaku · syarat buka · batas pakai · `P0` — FR-RWD-06 · `[BARU]`
- [ ] Tombol "Gunakan" membuka **pemilih cerita yang berlaku** lalu menerapkan voucher — bukan lagi `#` · `P0` — FR-RWD-06 · `[BARU]`
- [ ] Voucher terkunci menampilkan syarat pembukanya dan **tidak dapat dipilih**; voucher kedaluwarsa pindah ke riwayat klaim · `P1` — FR-RWD-06 · `[BARU]`
- [ ] **Pemakaian voucher tercatat di riwayat transaksi** sebagai mutasi bernilai nol koin dengan keterangan voucher · `P1` — FR-RWD-06 · `[BARU]`
- [ ] Setiap perolehan koin dari hadiah menulis baris `Transaction` kind `reward` — riwayat klaim dan buku besar tidak pernah berbeda · `P0` — FR-RWD-07
- [ ] Tombol misi "Lanjut" diarahkan ke reader, memperbaiki tautan menggantung · `P0` — FR-RWD-07, FR-CORE-05
- [ ] Tautan masuk dari `/profil` dan beranda · `P0` — FR-CORE-05
- [ ] **Test:** handler — klaim check-in dua kali pada tanggal yang sama → ditolak server · `[BARU]`
- [ ] **Test:** handler — voucher cakupan "5 bab pertama" hanya menulis 5 `Ownership`, bukan seluruh bab terkunci · `[BARU]`

---

## Fase 13 — Profil, Pengaturan, Bantuan, Legal · 6–8 hari

**Fase yang paling berubah karena pembaruan desain.** Sebelumnya satu-satunya fase tanpa acuan visual; kini **delapan layar penuh** (kanvas 24–31) plus 11 koleksi data contoh. Estimasi turun satu hari karena keputusan visual yang tadinya harus diambil di sini sudah diambil di kanvas.

Bangun `SettingRow` dan `UserRow` (Fase 1) lebih dulu — keduanya memikul hampir seluruh fase ini.

- [ ] Handler mock: `getProfile`, `updateProfile`, `getPublicProfile`, `getSessions`, `revokeSession`, `listFollows`, `getPrivacy`, `setPrivacy`, `getLocale`, `setLocale`
- [ ] **Profil** `/profil` — identitas + 3 statistik bertautan · `P0` — FR-PROF-01
- [ ] Rekap mingguan + aktivitas terbaru berlabel "HANYA KAMU" · `P1` — FR-PROF-02
- [ ] Pintasan dompet **menampilkan saldo** (profil saat ini tidak menampilkannya sama sekali) + tautan Pusat Hadiah & Penghasilan Penulis · `P1` — FR-PROF-03, FR-WALLET-17 · `[BARU]`
- [ ] Menu Akun & Dukungan; **Keluar dengan konfirmasi**, terutama bila ada draf belum tersimpan · `P0` — FR-PROF-05, FR-AUTH-12
- [ ] Tombol "Pasang aplikasi" (muncul setelah ≥3 sesi) · `P1`
- [ ] **Ubah profil** `/profil/ubah` — 2 tab, batas karakter, ganti foto, validasi nama wajib · `P0` — FR-PROF-07
- [ ] **Profil pengguna lain** `/pengguna/:id` — 3 tab; data dompet **tidak pernah** tampil · `P1` — FR-PROF-08
- [ ] **Daftar pengikut & mengikuti** `/profil/koneksi` — dua tab; tab terbuka ditentukan statistik mana yang ditekan · `P1` — FR-PROF-09 · `[BARU]`
- [ ] Baris: avatar · nama · handle · lencana peran · tombol Ikuti/Mengikuti yang bekerja **langsung dari daftar** dengan pembaruan optimistis · `P1` — FR-PROF-09 · `[BARU]`
- [ ] Pencarian dalam daftar bila > 20; paginasi 20; pengikut yang menyembunyikan aktivitas tetap muncul, tanpa ringkasan aktivitas · `P1` — FR-PROF-09 · `[BARU]`
- [ ] Kontrol visibilitas publik 4 kategori + sakelar induk + indikator `SEMUA PUBLIK`/`KUSTOM` · `P0` — FR-PROF-04
- [ ] **Visibilitas disimpan di server** — pengaturan privasi harus berlaku di semua perangkat dan tidak boleh hilang karena data peramban dibersihkan · `P0` — FR-PROF-10, FR-CORE-01 · `[BARU]`
- [ ] **Setiap sakelar benar-benar mengendalikan bagian tertentu** di profil publik: aktivitas → tab Activity · perpustakaan → tab Books · ulasan → entri ulasan · `P0` — FR-PROF-10 · `[BARU]`
- [ ] Bagian yang disembunyikan **tabnya ikut hilang**, bukan tab kosong · `P0` — FR-PROF-10 · `[BARU]`
- [ ] Tab Visibility di profil orang lain menampilkan keadaan nyata, bukan teks statis · `P1` — FR-PROF-10 · `[BARU]`
- [ ] **Data dompet selalu tersembunyi** di profil orang lain apa pun nilai sakelarnya — aturan platform, bukan preferensi; menyalakan sakelar dompet minta konfirmasi · `P0` — FR-PROF-10 · `[BARU]`
- [ ] **Bahasa & wilayah** `/pengaturan/bahasa` — 5 pengaturan + panel pratinjau · `P1` — FR-SET-01
- [ ] **Pilihan benar-benar berdampak & tersimpan di server**: bahasa antarmuka · prioritas terjemahan bab dwibahasa · wilayah konten · mata uang & metode bayar · zona waktu · `P1` — FR-SET-04, FR-CORE-01 · `[BARU]`
- [ ] **Panel pratinjau diperbarui langsung** saat pilihan berubah; perubahan bahasa berlaku seketika tanpa muat ulang · `P1` — FR-SET-04 · `[BARU]`
- [ ] **Zona waktu jadi acuan tunggal** untuk klaim check-in, kuota iklan harian, jadwal terbit, dan jam tenang push · `P0` — FR-SET-04 · `[BARU]`
- [ ] **Konsistensi bahasa** — terjemahkan `edit_profile`, `other_user_profile`, `help_center`; ganti label campur (Popular, New & Trending, Editor's Picks, Continue Reading, "Hi, Anna", My Library, My Stories, tab status karya) · `P0` — FR-CORE-04 · `[BARU]`
- [ ] Aturan lint: tidak ada teks yang terlihat pengguna tertanam di markup — semua lewat `t()` · `P1` — FR-CORE-04 · `[BARU]`
- [ ] **Keamanan** `/pengaturan/keamanan` — skor perlindungan dihitung dari faktor nyata + 4 kartu · `P0` — FR-SET-02
- [ ] Skor dari **lima faktor berbobot** (kanvas layar 29): kata sandi 20 · verifikasi 2 langkah 25 · peringatan masuk 20 · kontak pemulihan 20 · sesi aktif 15; ambang label ≥85 kuat, ≥60 sedang · `P1` · `[DESAIN]`
- [ ] Saran keamanan **muncul dari keadaan nyata**, bukan daftar statis — 2FA mati, ada sesi ≥12 hari tidak aktif, nomor HP belum terverifikasi · `P1` · `[DESAIN]`
- [ ] Kelola sesi aktif; sesi saat ini tidak dapat dicabut dari sini; **mencabut sesi benar-benar mengakhirinya** · `P0` — FR-SET-03, FR-AUTH-12
- [ ] **Hapus riwayat membaca** — mengosongkan progres & Continue Reading, tetapi **tidak** mengeluarkan cerita dari perpustakaan · `P1` — FR-SET-05 · `[BARU]`
- [ ] **Ekspor data** — blok “Data & akun” **di dalam** `/pengaturan/keamanan` (bukan rute sendiri; FR-SET-05 menyebut `settings_security`, dan kanvas layar 29 menggambarnya begitu) · `P0` — FR-SET-05 · `[BARU]`
- [ ] Empat kategori ekspor (identitas · aktivitas membaca · catatan dompet · alat penulis), diproses asinkron, pemberitahuan saat berkas siap · `P0` — FR-SET-05 · `[BARU]`
- [ ] **Keluar dari semua perangkat** — mengakhiri seluruh sesi kecuali yang sedang dipakai · `P1` — FR-SET-03 · `[DESAIN]`
- [ ] Tautan unduh berlaku terbatas dan hanya untuk pemilik akun · `P0` — FR-SET-05 · `[BARU]`
- [ ] **Penghapusan akun** — pengaman terkuat: ketik ulang nama akun; **masa tenggang 30 hari** (dinonaktifkan dulu, pulih dengan masuk kembali) · `P0` — FR-SET-05 · `[BARU]`
- [ ] Peringatan konsekuensi **wajib sebelum konfirmasi**: saldo koin hangus · karya terbit & pembacanya · penghasilan belum dicairkan · ulasan & komentar · `P0` — FR-SET-05 · `[BARU]`
- [ ] Penghapusan **ditahan** bila masih ada penarikan diproses atau pesanan cetak berjalan, disertai penjelasan · `P0` — FR-SET-05 · `[BARU]`
- [ ] **Pusat bantuan** `/bantuan` — pencarian artikel nyata, 4 kategori → tautan lokal, FAQ `<details>` · `P1` — FR-HELP-01
- [ ] Setiap kategori bantuan menautkan ke **halaman nyata di aplikasi** (riwayat cetak, riwayat transaksi, pengaturan keamanan), bukan artikel buntu · `P1` — FR-HELP-01, FR-CORE-05 · `[DESAIN]`
- [ ] Tiket dukungan + 2 saluran kontak · `P1` — FR-HELP-02
- [ ] **Legal** `/legal/ketentuan` & `/legal/privasi`; bagian ke-5 Ketentuan ditulis; tombol kembali bertingkat · `P0` — FR-HELP-03, FR-CORE-05
- [ ] **Test:** privasi — mematikan sakelar Books → tab Books hilang dari profil publik, bukan tampil kosong · `[BARU]`
- [ ] **Test:** hapus akun ditahan saat ada penarikan berstatus Ditinjau · `[BARU]`
- [ ] **Test:** skor keamanan naik persis 25 poin saat 2FA dinyalakan, dan sarannya ikut hilang · `[DESAIN]`

---

## Fase 14 — Pengerasan PWA & Push · 5–7 hari

- [ ] `manifest.webmanifest` lengkap; `orientation: any` (bukan portrait — desktop harus nyaman)
- [ ] Ikon: 192, 512, 512-maskable, apple-touch-180 + splash iOS
- [ ] Service worker `injectManifest` dengan strategi cache per tipe aset (arch §10.2)
- [ ] `offline.html` sebagai fallback navigasi
- [ ] Toast "Versi baru tersedia — Muat ulang"; **tanpa `skipWaiting` diam-diam**
- [ ] Install prompt ditahan, muncul di Profil setelah ≥3 sesi
- [ ] **Baca offline** — tandai bab yang dimiliki untuk disimpan; batas 50 bab LRU; penanda di Perpustakaan
- [ ] **Bab yang sudah pernah dibuka tetap terbaca saat offline** — kewajiban, bukan fitur opsional · `P0` — FR-CORE-03 · `[BARU]`
- [ ] Aksi yang butuh jaringan **ditahan disertai penjelasan**, bukan gagal diam-diam · `P0` — FR-CORE-03 · `[BARU]`
- [ ] Background Sync untuk mutasi yang gagal saat offline
- [ ] Indikator status jaringan (banner tipis saat offline)
- [ ] **Layar penuh tanpa koneksi** (kanvas layar 33) — jalan keluarnya adalah **daftar bab yang tersimpan offline**, bukan tombol muat ulang · `P1` — arch §1.4 · `[DESAIN]`
- [ ] Layar itu dipulihkan sendiri oleh listener `online`, tanpa pengguna menekan apa pun · `P1` · `[DESAIN]`
- [ ] **Push notification** — handler `push` + `notificationclick` di SW yang sudah ada · `P2` — FR-NOTIF-05 · `[BARU]`
- [ ] **Izin diminta pada momen relevan**, bukan saat pertama membuka aplikasi: saat menyalakan sakelar notifikasi cerita pertama, atau menjadwalkan bab pertama · `P2` — FR-NOTIF-05 · `[BARU]`
- [ ] Izin ditolak → **tidak pernah diminta ulang**; halaman notifikasi menampilkan petunjuk lewat pengaturan sistem · `P2` — FR-NOTIF-05 · `[BARU]`
- [ ] Menekan push membuka **tujuan spesifik** (deep link), bukan beranda · `P2` — FR-NOTIF-05 · `[BARU]`
- [ ] **Jam tenang 22.00–07.00 waktu lokal pengguna** — push ditunda, notifikasi dalam aplikasi tetap tercatat saat itu juga · `P2` — FR-NOTIF-05 · `[BARU]`
- [ ] Audit aksesibilitas: focus trap, urutan tab, kontras AA, target sentuh 44px, skip-link, `aria-hidden` spoiler
- [ ] Uji pembaca layar pada 4 alur: baca bab, beli koin, tulis bab, baca notifikasi
- [ ] Audit performa: Lighthouse ≥90 di semua kategori; bundel awal <200KB gzip
- [ ] Code splitting per rute terverifikasi (41 rute); analisis bundel
- [ ] Uji responsif nyata di 360 / 390 / 768 / 1024 / 1440 px
- [ ] Uji lintas peramban: Chrome, Safari iOS, Firefox, Edge
- [ ] **Test e2e #4:** instal PWA → putus jaringan → baca bab tersimpan

---

## Fase 15 — Persiapan Rilis · 3–4 hari · **M5**

- [ ] Aset nyata menggantikan seluruh placeholder (cover, avatar, gambar iklan) — tidak ada lagi rujukan CDN
- [ ] Konten legal final ditinjau (bukan lorem)
- [ ] **Pemeriksa tautan internal di CI** — setiap tujuan navigasi harus cocok dengan satu rute (arch §8) · `P0` — FR-CORE-05 · `[BARU]`
- [ ] `.env.example` + dokumentasi `VITE_API_MODE`
- [ ] README: cara jalan, arsitektur singkat, cara mengganti mock → backend nyata
- [ ] CI: `biome check` + `tsc --noEmit` + `vitest run` + `playwright test` pada setiap PR
- [ ] Deploy ke static host (Vercel / Netlify / Cloudflare Pages) + header keamanan (CSP, HSTS)
- [ ] Error tracking (Sentry) + analytics dasar
- [ ] Uji instalasi PWA nyata di Android & iOS
- [ ] **Serah terima:** daftar batasan yang diketahui (arch §17, **10 butir**) disampaikan eksplisit ke pemangku kepentingan

> **M5 tercapai:** PWA siap dipakai pengguna nyata — dengan catatan bahwa autentikasi, pembayaran, tinjauan admin, dan push masih simulasi (arch §17).

---

## Backlog — Setelah v1

Revisi PRD memindahkan enam butir backlog lama ke dalam fase. Yang tersisa:

- [ ] **Backend nyata** — tulis `api/http/`, ubah satu env. Prasyarat untuk semua yang di bawah, dan **satu-satunya** yang menutup batasan "data hanya per perangkat" tanpa mengubah kode aplikasi.
- [ ] Autentikasi & otorisasi nyata (arch §17 batasan 1) — bentuk sesinya sudah benar, yang kurang server yang memverifikasi
- [ ] Payment gateway nyata (Midtrans/Xendit) + webhook (batasan 2)
- [ ] SDK iklan berhadiah nyata (batasan 4)
- [ ] Web Push nyata dengan VAPID (batasan 8) — izin, jam tenang, dan deep link sudah berjalan
- [ ] Panel admin untuk antrean tinjauan (batasan 7) — sisi penulis sudah lengkap
- [ ] Pengelolaan banyak rekening bank — PRD 08 §7 #6
- [ ] Peringkat relevansi pencarian yang sebenarnya (batasan 9)
- [ ] Render PDF & cetak di server — batasan 6
- [ ] Bahasa English penuh (`i18n/en.ts` + provider) — jalurnya sudah terpasang sejak FR-CORE-04

---

## Definition of Done per Tugas

Sebuah kotak baru boleh dicentang bila **semuanya** terpenuhi:

1. Acceptance criteria FR terkait di PRD terpenuhi.
2. Responsif diuji di 360px dan 1440px.
3. Bisa dioperasikan penuh dengan keyboard; fokus terlihat.
4. **Empat keadaan tertangani, dan kosong ≠ gagal** — memuat (skeleton) · berhasil · kosong (ajakan) · gagal (pesan + coba lagi). `[BARU]` FR-CORE-02, FR-CORE-03
5. **Tidak ada state milik pengguna yang disimpan di `stores/`** — kepemilikan, uang, progres, naskah, dan privasi lewat seam API. `[BARU]` FR-CORE-01
6. **Tidak ada teks yang terlihat pengguna tertanam di markup** — semua lewat `t()`. `[BARU]` FR-CORE-04
7. **Setiap tautan yang ditambahkan punya tujuan yang ada** di tabel rute. `[BARU]` FR-CORE-05
8. **Kegagalan disampaikan pada tingkat yang benar** — satu kolom salah tidak menjatuhkan halaman; satu bagian gagal tidak menjatuhkan layar. `[DESAIN]` arch §1.4
9. **Kalau tugasnya menyentuh uang atau naskah, pesan gagalnya menyatakan uang/tulisan aman** — eksplisit, walau jawabannya “ya”. `[DESAIN]`
10. Tidak ada hex warna baru di luar `tokens.css`.
11. Logika non-trivial meninggalkan satu cek yang bisa dijalankan.
12. `biome check` dan `tsc --noEmit` bersih.

**Uji ulang paling murah untuk butir 5:** lakukan aksinya, lalu muat ulang halaman. Kalau hasilnya hilang, tugasnya belum selesai. Inilah tepatnya yang gagal di prototipe pada 11 dari 24 alur yang terputus.
