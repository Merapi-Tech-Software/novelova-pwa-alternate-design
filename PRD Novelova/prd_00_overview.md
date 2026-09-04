# PRD Novelova — Overview & Indeks

> ## Salinan `novelova-v2/`
>
> Tabel konstanta §6 dan rujukan design system §-nya **disesuaikan** — lihat catatan v2 di bawah.
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> **Dokumen ini adalah pintu masuk PRD.** Berisi ringkasan produk, aktor, peta halaman, flow utama, konstanta produk, dan konvensi penulisan yang dipakai seluruh dokumen `prd_*.md`.
> Sumber kebenaran: 34 halaman HTML di `original/fix_ui/`. Setiap requirement diturunkan dari kode nyata, bukan asumsi.

---

## 1. Ringkasan Produk

**Novelova** adalah aplikasi baca novel berbasis mobile (portrait, frame HP) dengan model monetisasi **koin**. Pengguna membaca cerita bab per bab; sebagian bab gratis, sebagian terkunci dan dibuka dengan koin, bundle, voucher, atau menonton iklan. Pengguna juga bisa berperan sebagai **penulis**: membuat cerita, menulis bab dwibahasa, mengatur akses & jadwal terbit, memantau analitik, dan menarik penghasilan.

**Tujuan produk**
1. Membuat pembaca menemukan cerita yang relevan secepat mungkin (discovery multi-section yang bisa dipersonalisasi).
2. Membuat konversi baca → beli koin semulus mungkin (unlock berlapis: satuan, bundle, tamat, iklan, voucher, dan buka otomatis per cerita).
3. Memberi penulis studio mandiri: tulis, jadwalkan, kunci, analitik, cairkan.

**Bentuk prototype saat ini:** 34 file HTML mandiri (vanilla HTML + CSS inline + JS, ±8.100 baris). Tanpa framework, tanpa backend — semua data hardcoded, semua transaksi disimulasikan dengan timer/toast. Kontrak API & skema DB terpisah di `../../docs/api_*.md`; rencana migrasi ke PWA ada di `../../pwa/pwa_implementation_plan.md`.

---

## 2. Aktor / Persona

| Aktor | Deskripsi | Halaman inti |
|---|---|---|
| **Pembaca** | Pengguna utama. Mencari cerita, membaca bab, membeli/menghabiskan koin, mengoleksi di perpustakaan. | home_tabs, detail story, reader, my_library, topup, rewards |
| **Penulis** | Pembaca yang juga menerbitkan karya. Mengelola cerita & bab, akses, analitik, penarikan dana. | my_stories, manage_chapters, create/edit story & chapter, chapter_access, analytics, withdraw |
| **Pengunjung profil** | Pembaca yang melihat profil penulis lain (read-only). | other_user_profile |

Satu akun bisa merangkap Pembaca + Penulis; tidak ada pemisahan role di UI — menu penulis selalu tersedia dari bottom nav.

---

## 3. Peta Halaman → Modul (34 halaman)

| Modul | Dokumen PRD | Halaman |
|---|---|---|
| Autentikasi | [`prd_02_auth.md`](prd_02_auth.md) | `login`, `register`, `forgot_password` |
| Beranda & Discovery | [`prd_03_home_discovery.md`](prd_03_home_discovery.md) | `home_tabs`, `see_all_popular`, `see_all_new_trending`, `see_all_editors_picks` |
| Detail Cerita | [`prd_04_story_detail.md`](prd_04_story_detail.md) | `detail_story_alternatif_unified_cover_first` |
| Reader (Baca Bab) | [`prd_05_reader.md`](prd_05_reader.md) | `chapter_read_locked_story_stage` |
| Perpustakaan | [`prd_06_library.md`](prd_06_library.md) | `my_library` |
| Author Studio | [`prd_07_author_studio.md`](prd_07_author_studio.md) | `my_stories`, `manage_chapters`, `create_story`, `edit_story`, `create_chapter`, `edit_chapter`, `chapter_access`, `story_analytics`, `story_print_history` |
| Penghasilan Penulis | [`prd_08_author_earnings.md`](prd_08_author_earnings.md) | `author_analytics`, `author_withdraw` |
| Dompet & Hadiah | [`prd_09_wallet_rewards.md`](prd_09_wallet_rewards.md) | `topup_koin`, `topup_detail`, `topup_restyled`, `transaction_history`, `rewards_center` |
| Profil, Pengaturan & Bantuan | [`prd_10_profile_settings_help.md`](prd_10_profile_settings_help.md) | `profile`, `edit_profile`, `other_user_profile`, `settings_language`, `settings_security`, `help_center`, `privacy`, `terms` |

Desain visual lintas modul: [`prd_01_design_system.md`](prd_01_design_system.md).

**Total 34/34 halaman prototype tercakup, tanpa tumpang tindih.**

### Modul baru — halaman yang belum ada

Dua modul di bawah ini **belum punya halaman sama sekali** di prototype, tetapi sudah punya pemicu di halaman yang ada (tombol tanpa handler, tautan menggantung). Keduanya menutup alur yang selama ini terputus — lihat §12.

| Modul | Dokumen PRD | Halaman yang perlu dibuat | Pemicu yang sudah ada |
|---|---|---|---|
| Pencarian & Notifikasi | [`prd_11_search_notifications.md`](prd_11_search_notifications.md) | `search`, `notifications` | Ikon Cari & lonceng di beranda (tanpa handler) |
| Sosial (Rating, Ulasan, Komentar) | [`prd_12_social.md`](prd_12_social.md) | `story_reviews`, `chapter_comments` | Tombol Rate, tautan Review, tautan komentar bab (menggantung) |

---

## 4. Arsitektur Informasi

### 4.1 Bottom Navigation (5 tab, konsisten di halaman utama)

| Urutan | Tab | Tujuan |
|---|---|---|
| 1 | Home | `home_tabs.html` |
| 2 | Topup | `topup_koin.html` |
| 3 | Library | `my_library.html` |
| 4 | Stories | `my_stories.html` |
| 5 | Profile | `profile.html` |

Bottom nav muncul di: `home_tabs`, `topup_koin`, `my_library`, `my_stories`, `manage_chapters`, `profile`, `detail_story_alternatif_unified_cover_first`. Halaman lain memakai pola **top bar + tombol kembali** (chevron kiri) tanpa bottom nav.

### 4.2 Hierarki Navigasi

```
login ─┬─ register ─┬─ terms / privacy
       │            └─ home_tabs
       ├─ forgot_password ── settings_security
       └─ home_tabs
            ├─ see_all_popular / see_all_new_trending / see_all_editors_picks
            ├─ detail_story_alternatif_unified_cover_first
            │     └─ chapter_read_locked_story_stage
            ├─ topup_koin ── transaction_history
            ├─ my_library
            ├─ my_stories ─┬─ create_story
            │              ├─ edit_story ── story_analytics
            │              ├─ manage_chapters ─┬─ create_chapter
            │              │                   ├─ edit_chapter
            │              │                   └─ chapter_access
            │              └─ story_print_history
            └─ profile ─┬─ edit_profile
                        ├─ other_user_profile
                        ├─ settings_language
                        ├─ settings_security
                        ├─ transaction_history
                        ├─ story_print_history
                        └─ help_center
```

`rewards_center`, `author_analytics`, `author_withdraw`, `topup_detail`, `topup_restyled` saat ini **tidak punya entry point dari halaman mana pun** di dalam folder — hanya bisa dibuka langsung. Lihat §8.

---

## 5. Flow Utama End-to-End

### 5.1 Flow Pembaca — masuk sampai baca bab terkunci

1. **Masuk** — `login.html`: email + password, atau OAuth Google/Facebook. Gagal → pesan error inline. Sukses → `home_tabs.html`.
2. **Discovery** — `home_tabs.html`: banner carousel, tab genre, section Popular / New & Trending / Editor's Picks / Top Romance / Continue Reading, plus 2 slot iklan. Pengguna bisa menyembunyikan section apa pun lewat popover pengaturan (tersimpan).
3. **Lihat semua** — tombol "See all" per section → `see_all_*.html` (grid penuh 1 section).
4. **Detail cerita** — `detail_story_alternatif_unified_cover_first.html`: cover hero, statistik, aksi (Add to Library, Follow, Rate, Review, Share, Report), sinopsis, tag, daftar bab (gratis / terkunci berharga).
5. **Percabangan unlock:**
   - **Voucher** — masukkan kode di modal → valid → bab terbuka massal + konfirmasi confetti.
   - **Langsung baca** — klik bab gratis → reader.
   - **Bab terkunci** — klik → reader dengan blok terkunci.
6. **Reader** — `chapter_read_locked_story_stage.html`: atur ukuran font & tema, baca sampai batas preview, lalu gerbang unlock: satuan (1.500), bundle (12.000), tamat (36.900), atau tonton iklan (kuota 2/3 per hari). Saldo kurang → *(prototype: toast lalu buntu; lihat FR-READ-17 untuk jalur ke top-up)*.
7. **Top-up** — `topup_koin.html`: pilih paket/nominal kustom → metode bayar → bayar → sukses → saldo bertambah.
8. **Kembali membaca** — bab terbuka, saldo terpotong, transaksi tercatat di `transaction_history.html`.

### 5.2 Flow Penulis — dari cerita baru sampai pencairan

1. `my_stories.html` → **+ Cerita Baru** → `create_story.html` (judul, sinopsis ≥50 karakter, pen name, genre utama + maks 2 tambahan, tag maks 10, cover rasio 2:3) → simpan draft.
2. `manage_chapters.html` → **+ Bab** → `create_chapter.html` (editor dwibahasa ID wajib / EN opsional, mode fokus, hitung kata) → simpan draft atau terbitkan.
3. `chapter_access.html` → atur akses bab (gratis / koin / bundle / premium) dengan konfirmasi risiko saat menurunkan atau menaikkan akses.
4. Jadwalkan terbit lewat scheduler di `manage_chapters.html`.
5. Pantau performa di `story_analytics.html` (per cerita) dan `author_analytics.html` (agregat).
6. Cairkan penghasilan di `author_withdraw.html` (pilih metode, hitung biaya admin, konfirmasi).

### 5.3 Flow Dompet

`topup_koin.html` (3 langkah: jumlah → metode → ringkasan) → overlay sesuai tipe pembayaran (e-wallet menunggu / QRIS / virtual account) → sukses (confetti + saldo baru) atau gagal/kedaluwarsa → `topup_detail.html` menampilkan status akhir per transaksi → `transaction_history.html` merekap seluruh mutasi koin.

Jalur koin gratis: `rewards_center.html` (check-in harian, misi, referral, voucher).

---

## 6. Ekonomi Koin (konstanta produk)

Nilai-nilai ini **mengikat** dan harus identik di seluruh dokumen PRD serta implementasi.


> ### Catatan v2 atas tabel ini
>
> **Tiga angka unlock di bawah belum terselesaikan, dan itu diketahui.** Paket isi
> koin terbesar 2.000 koin, sementara satu bab berharga 1.500–2.000 — paket
> terbesar hanya cukup untuk satu bab, bundel sepuluh bab menuntut enam kali
> pembelian paket terbesar, dan `prd_07` menetapkan penulis hanya boleh mematok
> **1–50 koin** per bab. Ketiganya tidak mungkin benar bersamaan.
>
> Dugaan yang paling cocok dengan semua angkanya: **1.500 / 12.000 / 36.900 di
> prototipe adalah rupiah, bukan koin.** Dibagi kurs 130 hasilnya ~12 · ~92 · ~285
> koin — masuk akal terhadap paket 50–2.000 dan terhadap rentang penulis 1–50.
>
> **Diputuskan dibiarkan dulu** (4 September 2026); alur unlock dikerjakan lebih
> dahulu. Akibat yang bisa dihitung ada di `../architecture.md` §1.21.
>
> **Lencana hemat "±5%" dan "±10%" nominal.** Kode menghitung penghematan dari
> total harga satuan sungguhan (`UnlockOption.individualCoins`); pada harga contoh
> bundel sepuluh bab sebenarnya hemat **30%**, bukan 5%.
>
> **Design system tidak lagi rose-gold.** Untuk `novelova-v2/` yang berlaku
> putaran 7 — lihat [`prd_01_design_system.md`](prd_01_design_system.md) §0.

| Parameter | Nilai | Sumber |
|---|---|---|
| Kurs koin | **Rp 130 / koin** (`COIN_RATE`) | `topup_koin.html:534` |
| Pembelian kustom minimum | **100 koin** | `topup_koin.html` |
| Pembulatan harga | Ke kelipatan **Rp 100** terdekat (`Math.round(coins * 130 / 100) * 100`) | `topup_koin.html:541` |
| Promo bonus | Paket **500 koin → +50 koin bonus** | `topup_koin.html` |
| Unlock bab satuan | **1.500** | `chapter_read_locked_story_stage.html` |

| Unlock bundle (10 bab) | **12.000** (hemat ±5%) | `chapter_read_locked_story_stage.html` |
| Unlock sampai tamat | **36.900** (hemat ±10%) | `chapter_read_locked_story_stage.html` |
| Saldo awal prototype | **15.300** koin | `chapter_read_locked_story_stage.html:669` |
| Kuota buka via iklan | **2 dari 3** per hari (`adQuota` / `adMax`) | `chapter_read_locked_story_stage.html:1101` |
| Kode voucher valid | `promo` | `detail_story_alternatif_unified_cover_first.html:573` |
| Kedaluwarsa pembayaran | E-wallet 15 mnt · QRIS 30 mnt · VA 1440 mnt | `topup_koin.html` (`data-limit`) |

**Aturan validasi konten penulis**

| Aturan | Nilai | Sumber |
|---|---|---|
| Judul cerita | Wajib | `create_story.html` / `edit_story.html` |
| Sinopsis | Minimal **50 karakter** | idem |
| Pen name | Wajib | idem |
| Genre tambahan | Maksimal **2** | idem |
| Tag | Maksimal **10** | idem |
| Rasio cover | **2:3** (divalidasi saat unggah) | idem |
| Bahasa bab | **ID wajib**, EN opsional | `create_chapter.html` / `edit_chapter.html` |

**Pengaturan reader default:** `{ fontSize: 18, darkTheme: false }` (`chapter_read_locked_story_stage.html:958`).

> Sejak revisi 4 September 2026, izin **buka otomatis** tidak lagi ikut di sini. Ia diberikan **per cerita** di dalam gerbang bab dan disimpan di server, karena ia memberi wewenang memotong koin (prd_05 FR-READ-09).

---

## 7. State & Persistensi Global

Prototype menyimpan **4 key** di `localStorage`. Semua state lain hidup di memori dan hilang saat halaman dimuat ulang.

| Key | Isi | Dipakai di | Dokumen |
|---|---|---|---|
| `home_section_visibility_v1` | `{ "sec-banner": true, "sec-genres": true, … }` — peta section → tampil/sembunyi | `home_tabs.html` | prd_03 |
| `novelova-reader-settings-v1` | `{ fontSize, darkTheme }` | `chapter_read_locked_story_stage.html` | prd_05 |
| `novelova:create-story-draft` | Penanda `'1'` bahwa ada draft cerita baru | `create_story.html` | prd_07 |
| `novelova:edit-story-draft` | Penanda `'1'` bahwa ada perubahan cerita belum tersimpan | `edit_story.html` | prd_07 |

**Yang belum persisten (gap produksi):** saldo koin, status unlock bab, kuota iklan, isi perpustakaan, status follow, draft bab, filter/sort daftar, dan seluruh riwayat transaksi.

---

## 8. Batasan Prototype & Known Gaps

Dicatat supaya tidak dianggap requirement, dan supaya jadi backlog implementasi.

> Seluruh gap di bawah ini **sudah punya requirement penutupnya**. Pemetaan lengkap gap → FR ada di **§12 Peta Kelengkapan Alur**; aturan lintas-modul ada di **§11**.

### 8.1 Link menggantung (target tidak ada di `original/fix_ui/`)

| Target | Dirujuk dari | Dampak |
|---|---|---|
| `chapter_read_unlocked.html` (9 rujukan) | `my_library`, `manage_chapters`, `rewards_center` | Klik "lanjut baca" dari perpustakaan/kelola bab menghasilkan 404 |
| `detail_story_tabs.html#reviews-panel` | `detail_story_alternatif_unified_cover_first` | Tautan ulasan tidak sampai |
| `chapter_comments_thread_best_ads.html` | `chapter_read_locked_story_stage` | Tautan komentar bab tidak sampai |
| `../profile.html` | `detail_story_alternatif_unified_cover_first` | Path keluar folder, file tidak ada |

Rekomendasi: arahkan seluruh tautan baca ke `chapter_read_locked_story_stage.html` (halaman reader aktif) dan tautan profil ke `profile.html`.

### 8.2 Tautan keluar folder ke `../../alt/`

`edit_profile` → `alt/author_withdraw.html` · `help_center` → `alt/story_print_manager.html`, `alt/transaction_history.html` · `my_library` → `alt/library_search_sort.html`. Keempatnya duplikat halaman yang sudah ada di `fix_ui/`; sebaiknya diarahkan ke versi lokal.

### 8.3 Halaman tanpa entry point

`rewards_center`, `author_analytics`, `author_withdraw`, `topup_detail`, `topup_restyled` tidak dirujuk halaman mana pun di folder ini.

### 8.4 Simulasi, bukan fungsi nyata

Pembayaran (semua metode), text-to-speech, cetak/ekspor PDF & CSV, unggah cover, OAuth, pengiriman email reset password, dan seluruh angka analitik — semuanya toast/timer/data statis.

### 8.5 Inkonsistensi desain

Tiga sub-sistem visual hidup berdampingan (klasik cream, restyled rose-gold, frame sempit) — masih berbeda pada font, ukuran frame, dan radius. **Latar halaman sudah diseragamkan** ke satu nilai di 34 halaman; rinciannya di [`prd_01_design_system.md`](prd_01_design_system.md) §2.0.

### 8.6 Konsistensi bahasa UI

Mayoritas UI berbahasa Indonesia, tetapi `help_center`, `edit_profile`, dan `other_user_profile` masih berbahasa Inggris. Perlu diseragamkan (halaman `settings_language.html` sudah menyediakan pemilih bahasa).

---

## 9. Konvensi Penulisan PRD

### 9.1 Penomoran requirement

Format `FR-<MODUL>-<nn>`, nomor unik dan stabil dalam satu modul:

`FR-AUTH` · `FR-HOME` · `FR-DETAIL` · `FR-READ` · `FR-LIB` · `FR-STUDIO` · `FR-EARN` · `FR-WALLET` · `FR-RWD` · `FR-PROF` · `FR-SET` · `FR-HELP` · `FR-SRCH` · `FR-NOTIF` · `FR-SOCIAL` · `FR-CORE`

### 9.5 Penanda status

Setiap requirement bertanda **[BARU]** pada tabel ringkas, dan membuka detailnya dengan baris `**Status: BARU.**`, adalah **spesifikasi untuk pekerjaan yang belum ada di prototype** — biasanya menutup alur yang terputus (§12). Requirement tanpa penanda mendokumentasikan perilaku yang sudah berjalan.

### 9.2 Prioritas

| Level | Arti |
|---|---|
| **P0** | Inti produk. Tanpa ini modul tidak berfungsi / tidak layak rilis. |
| **P1** | Penting, tetapi ada jalur alternatif atau bisa menyusul. |
| **P2** | Pelengkap, kenyamanan, atau kosmetik. |

### 9.3 Struktur tiap dokumen modul

1. Ringkasan modul · 2. Flow · 3. Tabel ringkas FR · 4. Detail FR (Deskripsi, User story, Aturan bisnis, Hook implementasi, Acceptance criteria) · 5. State & persistensi · 6. Navigasi masuk/keluar · 7. Catatan prototype vs produksi.

### 9.4 Bahasa

Prosa Bahasa Indonesia; nama field, endpoint, fungsi, dan `id` elemen tetap Bahasa Inggris/asli seperti di kode. Referensi kode ditulis `nama_file.html:namaFungsi()` atau `nama_file.html:123`.

---

## 10. Indeks Dokumen

| # | Dokumen | Isi |
|---|---|---|
| 00 | `prd_00_overview.md` | Dokumen ini — produk, aktor, IA, flow, konstanta, gaps, konvensi |
| 01 | [`prd_01_design_system.md`](prd_01_design_system.md) | Warna, tipografi, komponen, layout, aset |
| 02 | [`prd_02_auth.md`](prd_02_auth.md) | Masuk, daftar, lupa password |
| 03 | [`prd_03_home_discovery.md`](prd_03_home_discovery.md) | Beranda, personalisasi section, halaman "lihat semua" |
| 04 | [`prd_04_story_detail.md`](prd_04_story_detail.md) | Detail cerita, daftar bab, voucher |
| 05 | [`prd_05_reader.md`](prd_05_reader.md) | Reader, pengaturan baca, gerbang unlock, iklan, TTS |
| 06 | [`prd_06_library.md`](prd_06_library.md) | Perpustakaan pembaca |
| 07 | [`prd_07_author_studio.md`](prd_07_author_studio.md) | Kelola cerita & bab, akses, jadwal, analitik cerita, cetak |
| 08 | [`prd_08_author_earnings.md`](prd_08_author_earnings.md) | Analitik penulis & penarikan dana |
| 09 | [`prd_09_wallet_rewards.md`](prd_09_wallet_rewards.md) | Top-up, status transaksi, riwayat, pusat hadiah |
| 10 | [`prd_10_profile_settings_help.md`](prd_10_profile_settings_help.md) | Profil, pengaturan, bantuan, legal |
| 11 | [`prd_11_search_notifications.md`](prd_11_search_notifications.md) | **[BARU]** Pencarian katalog & pusat notifikasi |
| 12 | [`prd_12_social.md`](prd_12_social.md) | **[BARU]** Rating, ulasan & komentar bab |

**Dokumen terkait di luar PRD:** kontrak API & skema DB → `../../docs/` · batas microservice → `../../microservices/` · rencana migrasi PWA → `../../pwa/pwa_implementation_plan.md` · konteks proyek → `../../context_claude/CONTEXT_HANDOFF.md`.

---

## 11. Persyaratan Lintas-Modul

Lima requirement yang tidak berumah di satu modul tertentu karena berlaku di seluruh aplikasi.

### FR-CORE-01 — Kontrak state pengguna · P0

**Status: BARU.**

**Deskripsi.** Aturan tegas tentang apa yang boleh disimpan di perangkat dan apa yang wajib di server.

**User story.** Sebagai pengguna, saya ingin apa yang saya miliki dan saya kerjakan tetap ada saat saya kembali atau berpindah perangkat.

**Aturan bisnis.**
- Prototype menyimpan **4 kunci `localStorage`, seluruhnya preferensi tampilan** (§7). Tidak ada satu pun yang menyimpan apa yang **dimiliki** pengguna. Akibatnya tidak ada alur di aplikasi ini yang dapat dijalankan dua kali berurutan dan menghasilkan keadaan berbeda.
- **Wajib di server** — kepemilikan, uang, dan pekerjaan:

  | State | FR terkait |
  |---|---|
  | Saldo koin & mutasinya | FR-WALLET-17 |
  | Kepemilikan bab (hasil beli, voucher, iklan) | FR-READ-17, FR-RWD-06 |
  | Isi perpustakaan & status follow | FR-DETAIL-13, FR-LIB-11 |
  | Progres baca & bab terakhir | FR-READ-16 |
  | Streak, kuota iklan, progres misi | FR-RWD-07, FR-READ-18 |
  | Naskah cerita & bab | FR-STUDIO-34 |
  | Pengaturan privasi & notifikasi | FR-PROF-10, FR-NOTIF-04 |
  | Bahasa, wilayah, zona waktu | FR-SET-04 |
  | Rating, ulasan, komentar | prd_12 §5 |

- **Boleh di perangkat** — preferensi tampilan dan kenyamanan: pengaturan baca (`novelova-reader-settings-v1`), visibilitas section beranda (`home_section_visibility_v1`), riwayat pencarian, dan draf lokal sebagai cadangan autosave.
- Seluruh pembacaan penyimpanan lokal dibungkus `try/catch` dengan nilai bawaan — pola yang sudah benar di `home_tabs` dan reader, dijadikan aturan.
- **Tanggal harian** (klaim check-in, kuota iklan, reset misi) dihitung dari zona waktu pengguna, bukan zona waktu server.

**Acceptance criteria.**
- **Given** pengguna membeli bab lalu memuat ulang halaman, **when** reader dirender, **then** bab tetap terbuka dan saldo tetap berkurang.
- **Given** pengguna membersihkan data peramban, **when** masuk kembali, **then** saldo, perpustakaan, dan progres bacanya utuh.
- **Given** pengguna berpindah perangkat, **when** membuka aplikasi, **then** pengaturan privasi dan bahasanya ikut.
- **Given** nilai penyimpanan lokal rusak, **when** halaman dimuat, **then** aplikasi memakai nilai bawaan tanpa error yang terlihat.

---

### FR-CORE-02 — Keadaan kosong untuk pengguna baru · P1

**Status: BARU.**

**Deskripsi.** Setiap daftar punya versi "belum ada isinya" yang mengarahkan, bukan sekadar memberi tahu.

**User story.** Sebagai pengguna baru, saya ingin tahu apa yang harus saya lakukan di halaman yang masih kosong.

**Aturan bisnis.**
- Seluruh prototype mengasumsikan pengguna sudah punya 42 cerita tersimpan, 12 karya, saldo, dan streak Hari ke-4. Tidak ada satu halaman pun yang punya versi hari pertama.
- **Keadaan kosong wajib memuat tiga hal:** penjelasan singkat fungsi halaman · satu aksi utama yang mengisinya · tautan alternatif.
- **Bedakan dua jenis kosong** — belum ada isinya sama sekali (ajakan) versus tidak ada hasil saringan (tawarkan hapus saringan). `my_library`, `my_stories`, dan `manage_chapters` saat ini hanya punya jenis kedua.
- Halaman yang memerlukannya: `my_library` (FR-LIB-12) · `my_stories` (FR-STUDIO-33) · `manage_chapters` *(sudah ada, dipertahankan)* · `transaction_history` · `rewards_center` · `notifications` (FR-NOTIF-01) · `story_reviews` (FR-SOCIAL-03) · Continue Reading di beranda (FR-HOME-16).
- Kontrol pencarian dan saringan disembunyikan saat daftar benar-benar kosong.

**Acceptance criteria.**
- **Given** pengguna baru membuka perpustakaan, **when** halaman dirender, **then** ajakan menjelajah tampil, bukan pesan "tidak ada hasil".
- **Given** koleksi berisi cerita tetapi saringan tidak cocok, **when** daftar dirender, **then** pesan hasil saringan kosong yang tampil.
- **Given** daftar benar-benar kosong, **when** halaman dirender, **then** kontrol pencarian dan saringan tidak tampil.

---

### FR-CORE-03 — Penanganan kegagalan & offline · P0

**Status: BARU.**

**Deskripsi.** Perilaku baku saat permintaan gagal, jaringan terputus, atau data tidak ditemukan.

**User story.** Sebagai pengguna, saya ingin tahu bahwa yang bermasalah adalah koneksi, bukan aplikasinya rusak, dan bisa mencoba lagi.

**Aturan bisnis.**
- Prototype hanya punya penanganan kegagalan pada alur pembayaran (lihat [`prd_09_wallet_rewards.md`](prd_09_wallet_rewards.md) FR-WALLET-11). Pola yang sama diberlakukan menyeluruh.
- **Empat keadaan yang dibedakan:** memuat (skeleton) · berhasil · **kosong** (FR-CORE-02) · **gagal** (pesan + tombol coba lagi). Gagal dan kosong tidak boleh memakai tampilan yang sama.
- Pesan kegagalan menyebut **apa yang gagal** dan langkah berikutnya, bukan kode teknis.
- **Aksi yang mengubah data memakai pembaruan optimistis dengan pengembalian**: tampilan berubah seketika, dan dikembalikan disertai pesan bila server menolak — berlaku untuk simpan ke perpustakaan, follow, sakelar notifikasi, reaksi, dan tandai terbaca.
- **Offline:** bab yang sudah dibuka tetap dapat dibaca (sejalan dengan rencana PWA di `../../pwa/pwa_implementation_plan.md`); aksi yang memerlukan jaringan ditahan disertai penjelasan.
- **Aksi transaksional wajib idempoten** — pembuatan order top-up, unlock bab, dan klaim hadiah memakai kunci idempotensi sehingga menekan dua kali tidak menagih dua kali.

**Acceptance criteria.**
- **Given** permintaan daftar gagal, **when** halaman dirender, **then** pesan kegagalan dan tombol coba lagi tampil — bukan keadaan kosong.
- **Given** pengguna menekan simpan ke perpustakaan lalu server menolak, **when** kegagalan diterima, **then** tombol kembali ke keadaan semula disertai pesan.
- **Given** perangkat offline, **when** pengguna membuka bab yang sudah pernah dibuka, **then** isi bab tetap dapat dibaca.
- **Given** pengguna menekan tombol bayar dua kali cepat, **when** permintaan diproses, **then** hanya satu order dibuat.

---

### FR-CORE-04 — Konsistensi bahasa antarmuka · P1

**Status: BARU.**

**Deskripsi.** Seluruh antarmuka memakai satu bahasa, mengikuti pengaturan pengguna.

**User story.** Sebagai pengguna berbahasa Indonesia, saya ingin seluruh aplikasi berbahasa Indonesia, tanpa halaman yang tiba-tiba berbahasa Inggris.

**Aturan bisnis.**
- **Tiga halaman masih berbahasa Inggris** di aplikasi berbahasa Indonesia: `edit_profile`, `other_user_profile`, `help_center`.
- **Label campur** juga terjadi di halaman berbahasa Indonesia: judul section beranda (Popular, New & Trending, Editor's Picks, Continue Reading), sapaan "Hi, Anna", judul "My Library" dan "My Stories", serta tab status (Published, Draft, Scheduled, Completed, Archived).
- Seluruh teks antarmuka dipindahkan ke berkas terjemahan; tidak ada teks tertanam di markup.
- Bahasa aktif mengikuti `settings_language` (FR-SET-04), dengan bawaan mengikuti bahasa perangkat.
- **Yang tidak diterjemahkan:** nama merek, judul cerita, nama penulis, dan isi bab.

**Acceptance criteria.**
- **Given** bahasa aplikasi Indonesia, **when** pengguna membuka `help_center`, **then** seluruh teks berbahasa Indonesia.
- **Given** bahasa aplikasi Indonesia, **when** beranda dirender, **then** judul section berbahasa Indonesia.
- **Given** pengguna mengganti bahasa ke English, **when** halaman dirender, **then** seluruh antarmuka berubah, sementara judul cerita tetap sebagaimana aslinya.

---

### FR-CORE-05 — Integritas navigasi · P0

**Status: BARU.**

**Deskripsi.** Tidak ada tautan yang menuju halaman tidak ada, dan tidak ada halaman yang tidak dapat dijangkau.

**User story.** Sebagai pengguna, saya ingin setiap tautan yang saya tekan benar-benar membawa saya ke suatu tempat.

**Aturan bisnis.**
- **Empat tautan menggantung** yang harus diperbaiki:

  | Tautan | Jumlah | Perbaikan |
  |---|---|---|
  | `chapter_read_unlocked.html` | 9 | → `chapter_read_locked_story_stage.html` beserta `chapter_id` (FR-LIB-11, FR-RWD-07, FR-STUDIO-08) |
  | `detail_story_tabs.html#reviews-panel` | 1 | → `story_reviews.html` (FR-SOCIAL-03) |
  | `chapter_comments_thread_best_ads.html` | 1 | → `chapter_comments.html` (FR-SOCIAL-05) |
  | `../profile.html` | 1 | → `profile.html` |

- **Empat tautan keluar folder** ke `../../alt/` diarahkan ke padanannya yang sudah ada di folder ini: `library_search_sort` → `my_library` · `author_withdraw` → `author_withdraw` lokal · `story_print_manager` → `story_print_history` · `transaction_history` → `transaction_history` lokal.
- **Lima halaman tanpa pintu masuk** diberi jalannya: `rewards_center` *(dari profil dan beranda)* · `author_analytics` & `author_withdraw` (FR-EARN-10) · `topup_detail` (FR-WALLET-19) · `topup_restyled` *(putuskan dipakai atau dihapus — lihat prd_09 §7 no. 5)*.
- **Tombol kembali memakai pola bertingkat** `history.back()` dengan tujuan cadangan yang masuk akal — pola yang sudah benar di detail cerita dan reader, dijadikan aturan. Menutup dua cacat: `forgot_password` yang selalu ke `settings_security`, dan `terms.html` yang kembali ke `#`.
- **Penanda tab aktif harus benar:** `detail_story_…` saat ini menandai tab "Library" sebagai aktif padahal bukan halaman perpustakaan.

**Acceptance criteria.**
- **Given** pengguna menekan "Lanjut Baca" di perpustakaan, **when** aksi dijalankan, **then** reader terbuka, bukan 404.
- **Given** pengguna menekan tautan Review di detail cerita, **when** aksi dijalankan, **then** halaman ulasan terbuka.
- **Given** pengguna membuka `terms.html` dari pendaftaran, **when** menekan kembali, **then** kembali ke halaman pendaftaran.
- **Given** pengguna berada di detail cerita, **when** navigasi bawah dirender, **then** tidak ada tab yang salah ditandai aktif.
- **Given** seluruh tautan dalam aplikasi ditelusuri, **when** pemeriksaan dijalankan, **then** tidak ada tujuan yang tidak ada.

---

## 12. Peta Kelengkapan Alur

Ringkasan alur yang belum menutup pada prototype dan requirement yang menutupnya. Dipakai untuk menentukan urutan pengerjaan.

| # | Alur yang terputus | Di mana putusnya | Ditutup oleh |
|---|---|---|---|
| 1 | **Kehabisan koin → beli → lanjut baca** | Toast "saldo tidak cukup" lalu buntu; sukses top-up melempar ke beranda; empat saldo berbeda | FR-READ-17 · FR-WALLET-17 · FR-WALLET-18 |
| 2 | **Temukan cerita → simpan → perpustakaan** | "Add to Library" tanpa handler, sehingga perpustakaan tidak punya pintu masuk | FR-DETAIL-13 · FR-LIB-11 |
| 3 | **Baca → progres tercatat → lanjut baca** | Reader tidak menulis progres; Continue Reading dan batang progres tanpa sumber data | FR-READ-16 · FR-LIB-11 |
| 4 | **Selesai bab → bab berikutnya** | Tidak ada navigasi bab di reader | FR-READ-15 |
| 5 | **Baca → beri nilai / ulasan / komentar** | Rate tanpa handler; dua tautan menggantung; misi ulasan → `#` | prd_12 seluruhnya |
| 6 | **Cari cerita tertentu** | Ikon Cari tanpa handler; tidak ada halaman pencarian | FR-SRCH-01 … FR-SRCH-05 |
| 7 | **Peristiwa terjadi → pengguna diberi tahu** | Empat fitur memicu notifikasi, tidak ada tempat menerimanya | FR-NOTIF-01 … FR-NOTIF-05 |
| 8 | **Tonton iklan → dapat bab** | Iklan tidak ditayangkan; kuota reset saat halaman dimuat ulang | FR-READ-18 |
| 9 | **Dapat voucher → pakai voucher** | Dua sistem voucher yang tidak saling kenal | FR-RWD-06 |
| 10 | **Lihat transaksi → periksa detail** | `topup_detail` tidak punya satu pun tautan masuk | FR-WALLET-19 |
| 11 | **Klaim hadiah → tercatat** | Check-in dapat diklaim ulang dengan menyegarkan halaman | FR-RWD-07 |
| 12 | **Jadi penulis → terbitkan → cairkan** | Tidak ada onboarding penulis; analitik & pencairan hanya terjangkau lewat Help Center | FR-STUDIO-33 · FR-EARN-10 · FR-EARN-11 |
| 13 | **Tulis naskah → tersimpan** | Naskah bab hilang saat pindah halaman | FR-STUDIO-34 |
| 14 | **Buat cerita → tulis bab pertama** | Tidak ada tautan lanjutan setelah cerita dibuat | FR-STUDIO-35 |
| 15 | **Kirim terbit → ditinjau → tayang** | Tinjauan disebut tiga kali, tidak punya status maupun layar | FR-STUDIO-38 |
| 16 | **Atur akses bab tertentu** | `chapter_access` tidak tahu bab mana yang sedang diatur | FR-STUDIO-36 |
| 17 | **Pilih genre → beranda menyesuaikan** | Tab genre hanya mengubah gaya aktif | FR-HOME-13 |
| 18 | **Saring kategori → hasil menyesuaikan** | Halaman lihat-semua tanpa JavaScript sama sekali | FR-HOME-14 |
| 19 | **Atur privasi → berlaku ke pengunjung** | Sakelar visibilitas tidak tersimpan dan tidak dibaca siapa pun | FR-PROF-10 |
| 20 | **Atur bahasa → aplikasi berubah** | `settings_language` tanpa JavaScript | FR-SET-04 · FR-CORE-04 |
| 21 | **Lihat pengikut** | Statistik pengikut menuju profil satu orang | FR-PROF-09 |
| 22 | **Ekspor data / hapus akun** | Dijanjikan kebijakan privasi, tidak ada di antarmuka | FR-SET-05 |
| 23 | **Daftar → beranda yang relevan** | Tidak ada onboarding; preferensi awal tidak pernah dikumpulkan | FR-AUTH-11 · FR-HOME-16 |
| 24 | **Buka halaman → wajib masuk** | Tidak ada sesi maupun penjaga rute | FR-AUTH-12 |

### Urutan pengerjaan yang disarankan

| Tahap | Isi | Alasan |
|---|---|---|
| **1. Fondasi** | FR-CORE-01 (state di server) · FR-AUTH-12 (sesi) · FR-WALLET-17 (dompet tunggal) | Tanpa ini tidak ada alur yang dapat diuji dua kali berturut-turut |
| **2. Loop uang** | FR-READ-17 · FR-WALLET-18 · FR-WALLET-19 | Jarak terpendek menuju pendapatan |
| **3. Loop retensi** | FR-DETAIL-13 · FR-LIB-11 · FR-READ-16 · FR-READ-15 | Menghidupkan perpustakaan dan Continue Reading yang sekarang kosong |
| **4. Penemuan** | FR-SRCH-* · FR-HOME-13 · FR-HOME-14 | Katalog ratusan cerita tanpa pencarian tidak dapat dipakai |
| **5. Keamanan pekerjaan penulis** | FR-STUDIO-34 · FR-STUDIO-33 · FR-EARN-10 | Menutup risiko kehilangan naskah dan memberi ujung pada rantai kerja penulis |
| **6. Sosial & notifikasi** | prd_12 · FR-NOTIF-* | Penting untuk pertumbuhan, tetapi tidak memblokir loop inti |
| **7. Sisanya** | FR-SET-04 · FR-SET-05 · FR-PROF-09 · FR-STUDIO-37 · FR-CORE-04 | Kelengkapan dan kepatuhan |
