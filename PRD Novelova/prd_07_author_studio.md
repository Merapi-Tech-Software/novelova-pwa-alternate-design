# PRD Novelova — Modul Author Studio

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya **sama dengan v1**; yang berubah hanya kulitnya (putaran 7).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Halaman: `my_stories.html` · `manage_chapters.html` · `create_story.html` · `edit_story.html` · `create_chapter.html` · `edit_chapter.html` · `chapter_access.html` · `story_analytics.html` · `story_print_history.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_my_stories.md`, `../../docs/api_author_content_editor.md`

---

## 1. Ringkasan Modul

Modul terbesar aplikasi: seluruh perkakas penulis, dari membuat cerita sampai mencetaknya menjadi buku fisik. Sembilan halaman yang membentuk satu rantai kerja: **kelola cerita → kelola bab → tulis → atur akses → jadwalkan → pantau → cetak**.

| Aspek | Nilai |
|---|---|
| **Aktor** | Penulis |
| **Halaman** | 9 halaman, total ±930 baris |
| **Prasyarat** | Pengguna sudah masuk |
| **State persisten** | `novelova:create-story-draft`, `novelova:edit-story-draft` |
| **Sub-sistem desain** | Klasik `fix_ui`; `my_stories` dan `manage_chapters` memakai navigasi bawah lima tab |

### Peta halaman

| Halaman | Peran |
|---|---|
| `my_stories` | Beranda studio: daftar cerita + aksi editorial + scheduler + cetak |
| `manage_chapters` | Daftar bab satu cerita + notifikasi + aksi per bab |
| `create_story` / `edit_story` | Formulir cerita (metadata, cover, kategori, monetisasi) |
| `create_chapter` / `edit_chapter` | Editor naskah dwibahasa |
| `chapter_access` | Tipe akses bab: gratis / berbayar / privat |
| `story_analytics` | Analitik satu cerita |
| `story_print_history` | Riwayat & status pesanan cetak |

---

## 2. Flow

### 2.1 Menerbitkan cerita baru

1. `my_stories` → **+ Buat Story Baru** → `create_story`.
2. Isi judul, sinopsis (≥50 karakter), nama pena, genre, tag, cover, monetisasi → **Simpan Draft**.
3. `manage_chapters` → **Tulis Chapter Baru** → `create_chapter`; tulis versi Indonesia (wajib), opsional English → **Publish Sekarang** atau **Simpan ke Draft**.
4. `chapter_access` → tentukan gratis / berbayar (harga + porsi pratinjau) / privat.
5. Kembali ke `my_stories` → **Scheduler** pada cerita draft → pilih tanggal & jam terbit → simpan.

### 2.2 Memantau dan mencetak

1. `my_stories` → **Analisa** → `story_analytics`: pilih rentang, telusuri metrik, buka detail per bab, ekspor laporan.
2. Untuk cerita berstatus **Completed** → **Cetak PDF** → pilih softcopy (unduh PDF) atau hardcopy (isi detail cetak & pengiriman → ajukan pesanan).
3. `story_print_history` → pantau status pesanan lewat lini masa enam tahap.

---

## 3. Daftar Requirement

| ID | Nama | Halaman | Prioritas |
|---|---|---|---|
| FR-STUDIO-01 | Ringkasan studio penulis | `my_stories` | P1 |
| FR-STUDIO-02 | Kartu cerita dengan metrik & aksi kontekstual | `my_stories` | P0 |
| FR-STUDIO-03 | Cari, saring, dan urutkan cerita | `my_stories` | P0 |
| FR-STUDIO-04 | Jadwalkan terbit cerita draft | `my_stories` | P0 |
| FR-STUDIO-05 | Cetak PDF & pesan hardcopy | `my_stories` | P1 |
| FR-STUDIO-06 | Hapus cerita | `my_stories` | P1 |
| FR-STUDIO-07 | Ringkasan & notifikasi bab | `manage_chapters` | P1 |
| FR-STUDIO-08 | Daftar bab dengan status & aksi cepat | `manage_chapters` | P0 |
| FR-STUDIO-09 | Cari, saring, dan urutkan bab | `manage_chapters` | P0 |
| FR-STUDIO-10 | Menu aksi bab kontekstual | `manage_chapters` | P0 |
| FR-STUDIO-11 | Jadwalkan terbit bab | `manage_chapters` | P0 |
| FR-STUDIO-12 | Formulir cerita & penanda perubahan | `create_story`, `edit_story` | P0 |
| FR-STUDIO-13 | Unggah cover dengan validasi | `create_story`, `edit_story` | P1 |
| FR-STUDIO-14 | Kategorisasi: genre, tag, target pembaca | `create_story`, `edit_story` | P0 |
| FR-STUDIO-15 | Monetisasi & pengaturan lanjutan | `create_story`, `edit_story` | P1 |
| FR-STUDIO-16 | Validasi & simpan | `create_story`, `edit_story` | P0 |
| FR-STUDIO-17 | Pemulihan draft otomatis | `create_story`, `edit_story` | P1 |
| FR-STUDIO-18 | Status, visibilitas & zona bahaya | `edit_story` | P0 |
| FR-STUDIO-19 | Editor bab dwibahasa | `create_chapter`, `edit_chapter` | P0 |
| FR-STUDIO-20 | Penghitung kata & mode fokus | `create_chapter`, `edit_chapter` | P1 |
| FR-STUDIO-21 | Validasi & pilihan terbit bab | `create_chapter`, `edit_chapter` | P0 |
| FR-STUDIO-22 | Catatan penulis & jadwal dari editor | `create_chapter`, `edit_chapter` | P1 |
| FR-STUDIO-23 | Pilih tipe akses bab | `chapter_access` | P0 |
| FR-STUDIO-24 | Konfirmasi perubahan akses berisiko | `chapter_access` | P0 |
| FR-STUDIO-25 | Harga bab & porsi pratinjau gratis | `chapter_access` | P0 |
| FR-STUDIO-26 | Pengaturan bab privat | `chapter_access` | P1 |
| FR-STUDIO-27 | Rentang waktu & ringkasan metrik | `story_analytics` | P0 |
| FR-STUDIO-28 | Grafik dengan lapisan data | `story_analytics` | P1 |
| FR-STUDIO-29 | Performa per bab | `story_analytics` | P0 |
| FR-STUDIO-30 | Sentimen, asal pembaca & aktivitas publish | `story_analytics` | P2 |
| FR-STUDIO-31 | Ekspor & bagikan laporan | `story_analytics` | P2 |
| FR-STUDIO-32 | Riwayat & lini masa pesanan cetak | `story_print_history` | P1 |
| FR-STUDIO-33 | **[BARU]** Onboarding penulis & verifikasi pencairan | `my_stories`, `profile` | P0 |
| FR-STUDIO-34 | **[BARU]** Autosave naskah bab | `create_chapter`, `edit_chapter` | P0 |
| FR-STUDIO-35 | **[BARU]** Lanjutan setelah cerita dibuat | `create_story` | P1 |
| FR-STUDIO-36 | **[BARU]** Konteks bab pada pengaturan akses | `chapter_access` | P0 |
| FR-STUDIO-37 | **[BARU]** Jadwal terbit terpadu | `my_stories`, `manage_chapters` | P1 |
| FR-STUDIO-38 | **[BARU]** Antrean tinjauan & status moderasi | `my_stories`, `manage_chapters` | P0 |

---

## 4. Detail Requirement

## A. Daftar Cerita (`my_stories.html`)

### FR-STUDIO-01 — Ringkasan studio penulis · P1

**Deskripsi.** Kepala halaman berisi penjelasan peran studio dan empat metrik agregat seluruh karya penulis.

**User story.** Sebagai penulis, saya ingin melihat pencapaian total karya saya begitu membuka studio agar tahu posisi saya secara keseluruhan.

**Aturan bisnis.**
- Empat metrik dengan urutan tetap: **Stories**, **Views**, **Subs**, **Coins** (prototype: 12 · 1.8M · 38K · 92K).
- Tautan **"Riwayat Cetak PDF & Hardcopy"** menuju `story_print_history.html`.
- Tombol **"+ Buat Story Baru"** di bilah atas menuju `create_story.html`.

**Hook implementasi.** `my_stories.html:55` bilah atas; `:57` `.studio`, `.studio-stats`, `.tracking-link`.

**Acceptance criteria.**
- **Given** penulis membuka studio, **when** melihat kepala halaman, **then** keempat metrik agregat tampil.
- **Given** penulis menekan "+ Buat Story Baru", **when** aksi dijalankan, **then** `create_story.html` terbuka.

---

### FR-STUDIO-02 — Kartu cerita dengan metrik & aksi kontekstual · P0

**Deskripsi.** Setiap cerita ditampilkan sebagai kartu berisi sampul, judul, tag, lencana status, tanggal, enam metrik, dan baris aksi yang **berbeda-beda tergantung status cerita**.

**User story.** Sebagai penulis, saya ingin hanya melihat aksi yang relevan dengan status cerita agar tidak salah memilih tindakan.

**Aturan bisnis.**
- **Lima status:** `published`, `draft`, `scheduled`, `completed`, `archived` — masing-masing punya gaya lencana sendiri.
- **Enam metrik per kartu:** Views · Readers · Rating · Comments · Coins · Chapters.
- **Aksi dasar semua status:** Edit → `edit_story.html` · Chapter → `manage_chapters.html` · Preview → `detail_story_alternatif_unified_cover_first.html` · Hapus.
- **Aturan aksi kondisional — dijalankan saat halaman dimuat, dengan menghapus tombol yang tidak berlaku:**

  | Aksi | Aturan |
  |---|---|
  | **Scheduler** | Hanya untuk `draft`; tombol **dihapus** dari kartu berstatus lain |
  | **Analisa** | Dihapus dari cerita berstatus `published` (dan `publish`) — hanya tampil pada draft/scheduled/completed/archived |
  | **Cetak PDF** | Hanya untuk `completed`; tombol **dihapus** dari kartu berstatus lain |

- Aturan Analisa berlawanan dengan intuisi (cerita terbit justru tidak punya tautan analitik) — lihat §7.
- Atribut data: `data-state`, `data-title`, `data-views` (angka mentah), `data-updated` (`YYYY-MM-DD`).
- Catatan permanen di bawah daftar menjelaskan bahwa scheduler hanya untuk cerita draft.

**Hook implementasi.** `my_stories.html:61-65` kartu; `:80` penghapusan tombol cetak; `:82-87` penghapusan scheduler; `:88` penghapusan analisa.

**Acceptance criteria.**
- **Given** sebuah cerita berstatus draft, **when** kartunya dirender, **then** tombol Scheduler tampil.
- **Given** sebuah cerita berstatus published, **when** kartunya dirender, **then** tombol Scheduler dan Analisa tidak ada.
- **Given** sebuah cerita berstatus completed, **when** kartunya dirender, **then** tombol "Cetak PDF" tampil.
- **Given** sebuah cerita berstatus archived, **when** kartunya dirender, **then** tombol "Cetak PDF" tidak ada.
- **Given** kartu apa pun dirender, **when** penulis melihat baris aksi, **then** Edit, Chapter, Preview, dan Hapus selalu tersedia.

---

### FR-STUDIO-03 — Cari, saring, dan urutkan cerita · P0

**Deskripsi.** Pencarian judul, enam tab status, dan tiga pilihan urutan yang bekerja bersamaan.

**User story.** Sebagai penulis dengan banyak karya, saya ingin cepat menemukan cerita tertentu atau melihat hanya yang berstatus draft.

**Aturan bisnis.**
- **Pencarian** hanya pada `data-title` (bukan tag atau genre), setelah `trim()` + `toLowerCase()`, memakai pencocokan substring.
- **Tab saringan:** Semua · Published · Draft · Scheduled · Completed · Archived. Satu aktif pada satu waktu; default "Semua".
- **Urutan:**

  | Nilai | Label | Aturan |
  |---|---|---|
  | `updated` | Terbaru diupdate | `data-updated` menurun — **default** |
  | `popular` | Terpopuler | `data-views` menurun (numerik) |
  | `az` | A-Z | `data-title` menaik (`localeCompare`) |

- Pencarian dan saringan bersifat **AND**.
- Penghitung menampilkan jumlah terlihat dengan bentuk tunggal/jamak (`"1 story"` / `"5 stories"`).
- Keadaan kosong: `"Tidak ada story yang cocok dengan filter atau pencarian."`
- `sortStories()` dijalankan sekali saat halaman dimuat.

**Hook implementasi.** `my_stories.html:75:visibleStories()`; `:76:sortStories()`; listener `:77-78`.

**Acceptance criteria.**
- **Given** penulis menekan tab "Draft", **when** daftar diperbarui, **then** hanya cerita draft tampil dan penghitung menyesuaikan.
- **Given** penulis memilih "Terpopuler", **when** daftar disusun ulang, **then** cerita dengan `data-views` terbesar berada di atas.
- **Given** penulis mengetik judul yang tidak ada, **when** daftar diperbarui, **then** pesan keadaan kosong tampil.
- **Given** penulis mencari nama genre, **when** daftar diperbarui, **then** tidak ada hasil — pencarian hanya mencakup judul.

---

### FR-STUDIO-04 — Jadwalkan terbit cerita draft · P0

**Deskripsi.** Bottom sheet empat langkah untuk menentukan kapan sebuah cerita draft berubah menjadi terbit. Menjadwalkan **cerita utuh**, bukan bab tertentu.

**User story.** Sebagai penulis, saya ingin menentukan tanggal dan jam terbit karya saya agar bisa merilisnya pada waktu pembaca paling aktif.

**Aturan bisnis.**
- Judul sheet berubah menjadi **"Terbitkan Story"** dan nama cerita diisi dari `data-story` tombol yang ditekan.
- **Empat langkah bernomor:**
  1. **Story yang akan diterbitkan** — ringkasan dengan penegasan bahwa yang diterbitkan adalah cerita sebagai satu karya, bukan bab tertentu.
  2. **Tanggal terbit** — input tanggal + empat pintasan (Today, 21 May, 22 May, 23 May).
  3. **Jam terbit** — input waktu (default **19:00**) + empat chip jam populer (07.00 · 12.00 · **19.00 aktif** · 21.00).
  4. **Terbit berulang** — Terbit sekali *(aktif)* · Rutin harian · Rutin mingguan · Senin & Kamis 19.00.
- **Tanggal minimum = hari ini menurut zona waktu lokal**, dihitung dengan mengoreksi `getTimezoneOffset()` sebelum `toISOString()` — sehingga pengguna di zona waktu Indonesia tidak salah mendapat tanggal kemarin. Nilai awal juga hari ini.
- Menekan chip jam mengisi input waktu dengan `data-time`-nya.
- Chip pintasan tanggal dan chip berulang memakai pola "aktif tunggal dalam satu induk".
- Menyimpan menutup sheet dan menampilkan pesan berisi tanggal dan jam yang dipilih.
- Menutup lewat tombol × atau **Batal** tidak menyimpan.

**Hook implementasi.** `my_stories.html:70` markup sheet; `:90-92` tanggal lokal + pembuka; `:100-102` chip & simpan; `#sheetBackdrop`, `#publishDate`, `#publishTime`, `#saveSchedule`.

**Acceptance criteria.**
- **Given** penulis menekan "Scheduler" pada cerita draft, **when** sheet terbuka, **then** judul berbunyi "Terbitkan Story" dan nama cerita sesuai kartu yang ditekan.
- **Given** sheet terbuka, **when** penulis membuka pemilih tanggal, **then** tanggal sebelum hari ini tidak dapat dipilih.
- **Given** penulis menekan chip "21.00", **when** aksi dijalankan, **then** input jam berubah menjadi 21:00 dan hanya chip itu yang aktif.
- **Given** penulis menekan "Simpan Schedule", **when** sheet tertutup, **then** pesan konfirmasi memuat tanggal dan jam yang dipilih.
- **Given** penulis menekan "Batal", **when** sheet tertutup, **then** tidak ada pesan konfirmasi jadwal.

---

### FR-STUDIO-05 — Cetak PDF & pesan hardcopy · P1

**Deskripsi.** Bottom sheet dua tab untuk mengubah cerita selesai menjadi berkas PDF atau buku fisik, lengkap dengan konfigurasi, formulir pengiriman, dan estimasi biaya.

**User story.** Sebagai penulis yang ceritanya sudah tamat, saya ingin mengubahnya menjadi PDF atau buku cetak agar bisa dibagikan atau dijual di luar aplikasi.

**Aturan bisnis.**
- **Hanya tersedia untuk cerita berstatus `completed`** (FR-STUDIO-02).
- Membuka sheet mengisi tiga tempat dengan judul cerita: keterangan sheet, nama pada ringkasan hardcopy, dan nama berkas PDF (`"<judul> - Chapter 1-50.pdf"`).
- **Tab Softcopy:**
  - Konfigurasi: cakupan bab (Semua / Range 1-50 / Pilih manual) · ukuran (A4 / Letter) · ukuran font (kecil/sedang/besar) · watermark.
  - Tambahan (chip aktif secara default): Include Cover · Daftar Isi · Watermark Author.
  - **Generate PDF** menampilkan kotak sukses berisi nama berkas dan ukuran (4.2 MB), serta pesan bahwa berkas tersimpan di riwayat cetak **30 hari**.
  - **Download Sekarang** menampilkan pesan unduhan dimulai.
  - Tombol **Bagikan** **dibuat secara dinamis oleh JavaScript** dan disisipkan di samping tombol unduh — tidak ada di markup.
- **Tab Hardcopy:**
  - Detail cetak: cakupan bab · jumlah eksemplar (angka, minimum 1, default 3) · ukuran (A5 / A4 / Pocket Book) · sampul (Soft / Hard Cover) · kertas (HVS 80gr / 70gr / Art Paper) · jilid (Lem / Spiral / Staples).
  - Detail pengiriman: nama penerima · nomor telepon · alamat lengkap · kota & kode pos · catatan.
  - Ringkasan pesanan dengan estimasi harga (Rp 285.000) dan waktu (7–10 hari kerja), disertai catatan bahwa harga final dikonfirmasi tim.
  - **Ajukan Pesanan** menutup sheet dan menampilkan status `"Menunggu Konfirmasi Admin"`.
- Tautan **"Buka halaman lacak status cetak"** dan **"Riwayat Cetak"** menuju `story_print_history.html`.
- Perpindahan tab memindahkan kelas `active` pada tab dan panel bersamaan (`data-print-tab` → `<id>Panel`).

**Hook implementasi.** `my_stories.html:71` markup sheet; `:80` pembuka; `:95` tab; `:96-99` aksi; `#printSheetBackdrop`, `#pdfSuccess`, `#pdfFileName`, `#hardcopyStoryName`.

**Acceptance criteria.**
- **Given** penulis menekan "Cetak PDF" pada cerita "Velvet Alibi", **when** sheet terbuka, **then** judul cerita muncul pada keterangan sheet, ringkasan hardcopy, dan nama berkas PDF.
- **Given** tab Softcopy aktif, **when** penulis menekan "Generate PDF", **then** kotak sukses tampil dengan nama berkas dan ukuran, dan pesan menyebut masa simpan 30 hari.
- **Given** penulis berpindah ke tab Hardcopy, **when** tab berganti, **then** panel softcopy tersembunyi dan panel hardcopy tampil.
- **Given** tab Hardcopy aktif, **when** penulis menekan "Ajukan Pesanan", **then** sheet tertutup dan status pesanan berbunyi "Menunggu Konfirmasi Admin".
- **Given** sheet softcopy terbuka, **when** penulis melihat baris aksi, **then** tombol "Bagikan" tersedia di samping tombol unduh.

---

### FR-STUDIO-06 — Hapus cerita · P1

**Deskripsi.** Menghapus cerita dari studio, dengan konfirmasi peramban sebelum dijalankan.

**User story.** Sebagai penulis, saya ingin menghapus karya yang tidak saya lanjutkan, tetapi tidak ingin terhapus karena salah tekan.

**Aturan bisnis.**
- Menampilkan `confirm('Hapus story ini dari prototype?')`; hanya lanjut bila disetujui.
- Kartu **dihapus dari DOM** (bukan disembunyikan), lalu daftar dan penghitung diperbarui.
- Pesan: `"Story dihapus dalam prototype."`
- Tersedia untuk **semua** status cerita, termasuk yang sudah terbit — lihat §7.

**Hook implementasi.** `my_stories.html:81` listener `.delete`.

**Acceptance criteria.**
- **Given** penulis menekan "Hapus", **when** dialog konfirmasi muncul dan dibatalkan, **then** cerita tetap ada.
- **Given** dialog konfirmasi disetujui, **when** aksi dijalankan, **then** kartu hilang dan penghitung berkurang satu.

---

## B. Kelola Bab (`manage_chapters.html`)

### FR-STUDIO-07 — Ringkasan & notifikasi bab · P1

**Deskripsi.** Kepala halaman berisi tiga penghitung status yang juga berfungsi sebagai pintasan saringan, diikuti daftar notifikasi yang menyoroti hal yang perlu ditindaklanjuti.

**User story.** Sebagai penulis, saya ingin langsung tahu bab mana yang butuh perhatian saya hari ini tanpa menelusuri seluruh daftar.

**Aturan bisnis.**
- Tiga penghitung: **Draft (3)** · **Jadwal (2)** · **Publish (42)**; masing-masing memakai `data-filter-short` sehingga menekannya **menerapkan saringan yang sama** dengan tab di bawahnya.
- **Empat jenis notifikasi** dengan tautan tindak lanjut:

  | Notifikasi | Tautan |
  |---|---|
  | Bab akan terbit besok | jangkar `#chapter-49` ke kartu babnya |
  | Draft belum diedit 5 hari | `edit_chapter.html` |
  | Bab sedang privat, dijadwalkan tampil kembali | `chapter_access.html` |
  | Bab mencapai 10rb views | `story_analytics.html` |

**Hook implementasi.** `manage_chapters.html:40-42` penghitung; `:65-70` `.notice-list`; listener `:148`.

**Acceptance criteria.**
- **Given** penulis menekan penghitung "Draft", **when** aksi dijalankan, **then** daftar tersaring ke bab draft dan tab "Draft" ikut menjadi aktif.
- **Given** penulis menekan "Lihat Detail" pada notifikasi bab terjadwal, **when** aksi dijalankan, **then** halaman menggulir ke kartu bab tersebut.

---

### FR-STUDIO-08 — Daftar bab dengan status & aksi cepat · P0

**Deskripsi.** Daftar bab dengan empat status, masing-masing menampilkan informasi dan tombol aksi yang berbeda.

**User story.** Sebagai penulis, saya ingin melihat seluruh bab beserta statusnya dan langsung menjalankan aksi paling umum untuk tiap status.

**Aturan bisnis.**

| Status | Informasi yang ditampilkan | Aksi cepat |
|---|---|---|
| `draft` | "Draft - Diedit N lalu - P% - sekitar N kata" + batang progres | **Lanjut Tulis** (`edit_chapter.html`) · **Terbitkan** · **Scheduler** · menu |
| `scheduled` | "Terjadwal <hari, tanggal> - <jam> WIB" (+ hitung mundur) | **Ubah Jadwal** · menu |
| `published` | Lencana akses (Gratis/Berbayar) + views + komentar + tanggal terbit | **Lihat** · menu |
| `private` | "Tersembunyi - tidak tampil ke pembaca" | **Tampilkan** · menu |

- Atribut data per bab: `data-state`, `data-title`, `data-number`, `data-edited`, `data-views`, `data-rating`.
- Bab berstatus terbit memiliki **lencana akses** terpisah dari lencana status: `Gratis` atau `Berbayar`.
- Tombol **Terbitkan** dan **Tampilkan** menampilkan pesan yang memuat nama bab dari `data-chapter`.
- Tombol **Lihat** menuju `chapter_read_unlocked.html` — halaman ini tidak ada (lihat §7).
- Keadaan kosong menampilkan judul, pesan **yang menyesuaikan saringan aktif** (lihat FR-STUDIO-09), dan tautan menulis bab baru.

**Hook implementasi.** `manage_chapters.html:74-115` kartu bab; listener `:158-159`.

**Acceptance criteria.**
- **Given** sebuah bab berstatus draft, **when** kartunya dirender, **then** batang progres dan tombol Lanjut Tulis, Terbitkan, serta Scheduler tampil.
- **Given** sebuah bab berstatus terjadwal, **when** kartunya dirender, **then** tanggal dan jam terbit tampil beserta tombol Ubah Jadwal.
- **Given** sebuah bab terbit berbayar, **when** kartunya dirender, **then** lencana "Berbayar" tampil bersama jumlah views dan komentar.
- **Given** penulis menekan "Terbitkan" pada bab draft, **when** aksi dijalankan, **then** pesan konfirmasi memuat nama bab tersebut.

---

### FR-STUDIO-09 — Cari, saring, dan urutkan bab · P0

**Deskripsi.** Pola yang sama dengan daftar cerita, dengan tambahan pesan keadaan kosong yang menyesuaikan saringan aktif.

**User story.** Sebagai penulis dengan puluhan bab, saya ingin menyaring menurut status dan mengurutkan menurut yang paling relevan bagi saya saat itu.

**Aturan bisnis.**
- **Tab saringan:** Semua · Draft · Terjadwal · Publish (default "Semua").
- **Pencarian** pada `data-title` saja, substring, tidak peka huruf besar-kecil.
- **Urutan:**

  | Nilai | Label | Aturan |
  |---|---|---|
  | `number` | Nomor chapter | `data-number` **menurun** (bab terbaru dulu) — **default** |
  | `edited` | Terbaru diedit | `data-edited` menurun |
  | `views` | Terbanyak views | `data-views` menurun (numerik) |
  | `rating` | Rating | `data-rating` menurun (numerik) |

- Penyembunyian memakai kelas `hidden` (berbeda dari `my_library` dan `my_stories` yang memakai `style.display`).
- **Pesan keadaan kosong menyesuaikan saringan aktif:**

  | Saringan | Pesan |
  |---|---|
  | Draft | `Belum ada draft. Mulai tulis chapter baru sekarang.` |
  | Terjadwal | `Belum ada chapter terjadwal. Jadwalkan chapter dari tab Draft.` |
  | Publish | `Belum ada chapter publish. Publish atau jadwalkan chapter pertamamu.` |
  | Semua | `Mulai tulis chapter baru sekarang.` |

- `setFilter()` menyinkronkan kelas `active` pada tab menurut nilai saringan — sehingga pintasan penghitung (FR-STUDIO-07) ikut menyorot tab yang benar.
- Penghitung memakai bentuk tunggal/jamak (`"1 chapter"` / `"7 chapters"`).

**Hook implementasi.** `manage_chapters.html:144:setFilter()`; `:145:visibleChapters()`; `:146:sortChapters()`.

**Acceptance criteria.**
- **Given** penulis menyaring ke "Terjadwal" dan tidak ada bab terjadwal, **when** daftar dirender, **then** pesan kosong berbunyi "Belum ada chapter terjadwal. Jadwalkan chapter dari tab Draft.".
- **Given** halaman baru dimuat, **when** daftar dirender, **then** bab terurut dari nomor terbesar ke terkecil.
- **Given** penulis memilih urutan "Terbanyak views", **when** daftar disusun ulang, **then** bab dengan views terbanyak berada di atas.
- **Given** penulis menekan penghitung pintasan "Publish", **when** saringan diterapkan, **then** tab "Publish" ikut bergaya aktif.

---

### FR-STUDIO-10 — Menu aksi bab kontekstual · P0

**Deskripsi.** Tombol "..." pada setiap bab membuka bottom sheet berisi daftar aksi yang **dibangun secara dinamis** sesuai status bab.

**User story.** Sebagai penulis, saya ingin satu menu berisi seluruh aksi yang mungkin untuk sebuah bab, tanpa memenuhi kartu dengan tombol.

**Aturan bisnis.**

**Daftar aksi per status:**

| Status | Aksi |
|---|---|
| `draft` | Edit / Lanjut Tulis · Terbitkan · Jadwalkan · Atur Akses · Preview · **Hapus** |
| `scheduled` | Edit Konten · Ubah Jadwal · Batalkan Jadwal · Atur Akses · Preview |
| `published` | Edit Konten · Atur Akses · Preview sebagai Pembaca · Lihat Statistik Chapter · **Hapus dengan konfirmasi refund** |
| `private` | Edit Konten · Atur Akses · Preview · Alasan Privat: Sedang direvisi · **Hapus** |

- Judul sheet diisi judul bab; sub-judul berbunyi `"Chapter ini masih draft."` untuk draft, atau `"Status chapter: <status>."` untuk lainnya (status `published` ditulis sebagai `publish`).
- **Jenis elemen ditentukan dari teks aksi:** aksi yang memuat "Edit", "Lanjut", atau "Akses" dibuat sebagai `<a>` dengan `href` (`edit_chapter.html` atau `chapter_access.html`); sisanya `<button>`.
- Aksi yang memuat kata "hapus" (tidak peka huruf besar-kecil) diberi gaya **danger**.
- Perilaku klik: tautan dibiarkan menavigasi; aksi yang memuat "Jadwal" menutup sheet dan membuka penjadwal bab; "Terbitkan" menampilkan pesan terbit; sisanya menampilkan pesan `"<aksi> dipilih dalam prototype."` dan menutup sheet.
- Daftar aksi dikosongkan dan dibangun ulang setiap kali menu dibuka.
- Aksi "Hapus dengan konfirmasi refund" pada bab terbit menandakan kebijakan produk: menghapus bab berbayar harus disertai pengembalian koin pembeli.

**Hook implementasi.** `manage_chapters.html:153` peta `actions`; listener `:154`; `#sheetBackdrop`, `#sheetActions`, `#sheetTitle`, `#sheetSub`.

**Acceptance criteria.**
- **Given** penulis membuka menu pada bab draft, **when** sheet tampil, **then** enam aksi draft tampil dan "Hapus" bergaya danger.
- **Given** penulis membuka menu pada bab terbit, **when** sheet tampil, **then** aksi terakhir berbunyi "Hapus dengan konfirmasi refund".
- **Given** menu terbuka, **when** penulis memilih "Atur Akses", **then** `chapter_access.html` terbuka.
- **Given** menu terbuka pada bab draft, **when** penulis memilih "Jadwalkan", **then** menu tertutup dan penjadwal bab terbuka dengan nama bab tersebut.
- **Given** penulis membuka menu pada bab A lalu menutupnya dan membuka menu bab B berstatus berbeda, **when** sheet tampil, **then** daftar aksi sesuai status bab B (tidak menyisakan aksi bab A).

---

### FR-STUDIO-11 — Jadwalkan terbit bab · P0

**Deskripsi.** Penjadwal khusus tingkat bab, terpisah dari penjadwal cerita di `my_stories`.

**User story.** Sebagai penulis, saya ingin menjadwalkan bab per bab agar rilis cerita saya berjalan teratur tanpa harus daring pada jam terbit.

**Aturan bisnis.**
- Keterangan sheet menegaskan bahwa alur ini **khusus bab, bukan cerita penuh**.
- Dibuka dari tiga tempat: tombol **Scheduler** pada bab draft, tombol **Ubah Jadwal** pada bab terjadwal, dan aksi "Jadwalkan" di menu (FR-STUDIO-10).
- Isi: nama bab · input tanggal + jam (default **19:00**) · chip jam populer (07.00 · 12.00 · **19.00 aktif** · 21.00) · pengaturan berulang (Sekali saja *(aktif)* · Setiap 3 hari · Mingguan · Senin & Kamis 19.00).
- **Tanggal minimum dan nilai awal = hari ini menurut zona waktu lokal** (koreksi `getTimezoneOffset()`).
- Menyimpan menutup sheet dan menampilkan pesan berisi tanggal dan jam.

**Hook implementasi.** `manage_chapters.html:152:openChapterScheduler(chapterName)`; `:151` tanggal lokal; `:162` simpan; `#scheduleSheet`, `#chapterPublishDate`, `#chapterPublishTime`.

**Acceptance criteria.**
- **Given** penulis menekan "Scheduler" pada bab draft, **when** sheet terbuka, **then** nama bab tersebut tampil pada ringkasan.
- **Given** sheet terbuka, **when** penulis membuka pemilih tanggal, **then** tanggal sebelum hari ini tidak dapat dipilih.
- **Given** penulis menekan chip "07.00" lalu menyimpan, **when** sheet tertutup, **then** pesan konfirmasi menyebut jam 07:00.

---

## C. Editor Cerita (`create_story.html` / `edit_story.html`)

> Kedua halaman berbagi struktur, gaya, dan sebagian besar logika. Perbedaannya dirinci pada FR-STUDIO-18.

### FR-STUDIO-12 — Formulir cerita & penanda perubahan · P0

**Deskripsi.** Formulir bersection dengan penanda visual pada setiap kolom yang diubah, penghitung karakter, pratinjau sinopsis, dan tombol simpan yang baru aktif setelah ada perubahan.

**User story.** Sebagai penulis, saya ingin melihat dengan jelas kolom mana saja yang sudah saya ubah dan tidak bisa menyimpan bila belum ada perubahan.

**Aturan bisnis.**
- **Section formulir:** Informasi Dasar · Kategorisasi · Status & Visibilitas · Monetisasi · Pengaturan Lanjutan.
- **Kolom dasar:** Judul (maks **100** karakter) · Sinopsis (maks **1000** karakter) · Nama pena.
- **Penghitung karakter** langsung: `"<panjang>/100"` dan `"<panjang>/1000"`, diperbarui pada tiap ketikan.
- **Sistem penandaan perubahan (`markDirty`)** — tiga efek sekaligus:
  1. Menandai formulir kotor (`dirty = true`).
  2. Mengaktifkan **kedua** tombol simpan (atas dan bawah), yang keadaan awalnya nonaktif.
  3. Menambahkan kelas `changed` pada kolom bersangkutan sehingga bordernya berubah.
  4. Menulis penanda draft ke `localStorage` (FR-STUDIO-17).
- Kolom yang dipantau ditandai kelas `.track`; input teks dipantau lewat event `input`, sedangkan `select` dan checkbox lewat `change`.
- **Pratinjau sinopsis** menampilkan isi sinopsis sebagaimana dilihat pembaca; pada `create_story` teks kosong diganti `"Sinopsis belum diisi."`.
- **Batal** menampilkan konfirmasi bila ada perubahan belum disimpan, lalu kembali ke `my_stories.html`.

**Hook implementasi.** `create_story.html:48:markDirty(el)`, `:51:updateCounters()`; `edit_story.html:50`, `:53`; `#titleInput`, `#synopsisInput`, `#penName`, `#toggleSynopsisPreview`, `#cancelBtn`.

**Acceptance criteria.**
- **Given** formulir baru dibuka, **when** penulis melihat tombol simpan, **then** keduanya nonaktif.
- **Given** penulis mengetik pada kolom judul, **when** perubahan terjadi, **then** kedua tombol simpan menjadi aktif dan kolom judul mendapat penanda berubah.
- **Given** penulis mengetik 25 karakter judul, **when** penghitung diperbarui, **then** tertulis "25/100".
- **Given** ada perubahan belum disimpan, **when** penulis menekan "Batalkan", **then** muncul konfirmasi sebelum meninggalkan halaman.
- **Given** tidak ada perubahan, **when** penulis menekan "Batalkan", **then** halaman langsung kembali ke `my_stories.html`.
- **Given** penulis menekan "Preview sebagai pembaca" dengan sinopsis kosong *(create_story)*, **when** panel tampil, **then** tertulis "Sinopsis belum diisi.".

---

### FR-STUDIO-13 — Unggah cover dengan validasi · P1

**Deskripsi.** Unggah gambar sampul dengan pemeriksaan format, ukuran berkas, dan rasio aspek sebelum pratinjau ditampilkan.

**User story.** Sebagai penulis, saya ingin diberi tahu bila cover saya salah format atau rasionya tidak pas agar tampilannya tidak rusak di daftar cerita.

**Aturan bisnis.**

| Pemeriksaan | Aturan | Akibat bila gagal |
|---|---|---|
| Format | Harus `image/jpeg`, `image/png`, atau `image/webp` | Ditolak — pesan `"Format harus JPG, PNG, WEBP dan maksimal 5MB."` |
| Ukuran berkas | Maksimal **5 MB** | Ditolak — pesan yang sama |
| Rasio aspek | Ideal **2:3**; toleransi penyimpangan **±0,12** | **Tetap diterima**, hanya diberi saran `"Disarankan rasio 2:3 untuk tampilan terbaik."` |

- Rasio dihitung dari dimensi gambar yang sudah dimuat (`img.width / img.height`), bukan dari nama berkas.
- Pratinjau dibuat lewat `URL.createObjectURL`.
- Unggahan yang berhasil memanggil `markDirty()`.
- **Hapus cover** mengembalikan pratinjau ke placeholder — teksnya berbeda antar halaman: `"Upload Cover"` (create) vs `"Default Cover"` (edit) — dan menandai perubahan.

**Hook implementasi.** `create_story.html:53` `coverInput.onchange`; `:54` `removeCover.onclick`; `edit_story.html:55-56`.

**Acceptance criteria.**
- **Given** penulis memilih berkas GIF, **when** validasi berjalan, **then** pesan format tampil dan pratinjau tidak berubah.
- **Given** penulis memilih JPG berukuran 8 MB, **when** validasi berjalan, **then** berkas ditolak dengan pesan yang sama.
- **Given** penulis memilih PNG berukuran 400×600 (rasio tepat 2:3), **when** gambar dimuat, **then** pratinjau tampil tanpa peringatan rasio.
- **Given** penulis memilih PNG persegi 600×600, **when** gambar dimuat, **then** pratinjau tetap tampil disertai saran rasio 2:3.
- **Given** cover sudah diunggah, **when** penulis menekan hapus cover, **then** pratinjau kembali ke placeholder dan formulir ditandai berubah.

---

### FR-STUDIO-14 — Kategorisasi: genre, tag, target pembaca · P0

**Deskripsi.** Pengaturan penemuan cerita: genre utama, bahasa, genre tambahan dengan batas, tag dengan batas, dan target pembaca.

**User story.** Sebagai penulis, saya ingin menempatkan cerita saya pada genre dan tag yang tepat agar ditemukan pembaca yang sesuai.

**Aturan bisnis.**
- **Genre utama:** satu pilihan (Romance · Fantasy · Horror · Mystery · Drama), default kosong (`"Pilih genre"`).
- **Bahasa:** Indonesia · English · Malay.
- **Genre tambahan: maksimal 2.** Penegakan batas dilakukan sebelum mengaktifkan chip — bila sudah ada 2 aktif dan penulis menekan chip **belum aktif**, aksi diabaikan. Menonaktifkan chip yang sudah aktif tetap boleh, sehingga penulis tidak terkunci.
- **Tag: maksimal 10.**
  - Ditambahkan lewat menekan Enter pada kolom tag, atau menekan chip saran (`#slowburn`, `#isekai`, `#revenge`).
  - Tanda pagar di depan dibuang dan spasi tepi dipangkas.
  - Tag kosong ditolak; penambahan melewati batas 10 diabaikan diam-diam.
  - Setiap chip tag punya tombol × untuk menghapus, ditangani lewat delegasi event pada wadah chip.
  - Kolom tag dikosongkan setelah tag ditambahkan lewat Enter, dan `preventDefault()` mencegah pengiriman formulir.
- **Target pembaca:** Remaja · Semua Umur · Dewasa 18+.

**Hook implementasi.** `create_story.html:56` handler chip; `:57:addTag(tag)`; `:58-59` input & hapus tag; `edit_story.html:57-60`.

**Acceptance criteria.**
- **Given** dua genre tambahan sudah aktif, **when** penulis menekan genre ketiga, **then** genre ketiga tidak aktif.
- **Given** dua genre tambahan aktif, **when** penulis menekan salah satu yang aktif, **then** genre itu nonaktif dan penulis dapat memilih genre lain.
- **Given** penulis mengetik `#slowburn` lalu menekan Enter, **when** tag ditambahkan, **then** chip berbunyi `slowburn` tanpa tanda pagar dan kolom dikosongkan.
- **Given** sudah ada 10 tag, **when** penulis menambah tag kesebelas, **then** tag tidak ditambahkan.
- **Given** penulis menekan tombol × pada sebuah chip tag, **when** aksi dijalankan, **then** chip hilang dan formulir ditandai berubah.
- **Given** kolom tag kosong, **when** penulis menekan Enter, **then** tidak ada chip yang ditambahkan.

---

### FR-STUDIO-15 — Monetisasi & pengaturan lanjutan · P1

**Deskripsi.** Pengaturan model harga cerita, hak turunan, label konten, dan catatan penulis — dengan kolom yang muncul/hilang mengikuti pilihan.

**User story.** Sebagai penulis, saya ingin menentukan model monetisasi dan batasan hak atas karya saya sebelum cerita terbit.

**Aturan bisnis.**
- **Tipe Story:** Gratis Semua · Sebagian Berbayar · Premium.
- **Kolom bergantung pilihan:**
  - `create_story`: **Harga Akses Penuh** hanya tampil untuk **Premium**; peringatan penguncian bab tampil untuk **selain "Gratis Semua"**.
  - `edit_story`: **Harga Akses Penuh** hanya untuk **Premium**; peringatan tampil justru saat memilih **"Gratis Semua"** (memperingatkan hilangnya monetisasi pada cerita yang sudah berjalan).
- **Status & Visibilitas** *(create_story)*: Aktifkan Komentar *(aktif)* · Moderasi Komentar.
- **Pengaturan Lanjutan:** Izinkan Story Diterjemahkan · Izinkan Fanfiction · **Label Konten** (Kekerasan · Bahasa Kasar · Konten Sensitif · Spoiler Berat) · Dedikasi · Catatan Author.
- **Early Access** ada tetapi disertai keterangan bahwa fitur diaktifkan nanti setelah ada bab terjadwal.
- Seluruh sakelar memakai pola membalik kelas `on` dan menandai perubahan.

**Hook implementasi.** `create_story.html:61` `monetizeType.onchange`; `edit_story.html:62`; `:60`/`:61` sakelar.

**Acceptance criteria.**
- **Given** penulis memilih tipe "Premium", **when** pilihan berubah, **then** kolom Harga Akses Penuh tampil.
- **Given** penulis memilih tipe "Gratis Semua" di `create_story`, **when** pilihan berubah, **then** peringatan penguncian bab disembunyikan.
- **Given** penulis memilih tipe "Gratis Semua" di `edit_story`, **when** pilihan berubah, **then** peringatan tampil.
- **Given** penulis menekan sakelar mana pun, **when** aksi dijalankan, **then** tombol simpan menjadi aktif.

---

### FR-STUDIO-16 — Validasi & simpan · P0

**Deskripsi.** Aturan validasi berurutan yang dijalankan sebelum penyimpanan, dengan pesan pada satu area yang sama.

**User story.** Sebagai penulis, saya ingin dicegah menyimpan cerita yang belum lengkap agar halaman cerita saya tidak tampil setengah jadi ke pembaca.

**Aturan bisnis.**

| Urutan | Aturan | Pesan | `create_story` | `edit_story` |
|---|---|---|---|---|
| 1 | Judul tidak boleh kosong | `Judul story tidak boleh kosong` | ✓ | ✓ |
| 2 | Sinopsis minimal **50 karakter** (setelah `trim()`) | `Sinopsis minimal 50 karakter` | ✓ | ✓ |
| 3 | Nama pena tidak boleh kosong | `Nama pena tidak boleh kosong` | ✓ | — |

- Validasi berhenti pada kesalahan pertama.
- **Penyimpanan berhasil:** menandai formulir bersih, menonaktifkan kembali kedua tombol simpan, menghapus penanda draft dari `localStorage`, dan menampilkan pesan berhasil. `create_story` juga menampilkan kotak sukses.
- Tombol **Preview** di `create_story` menjalankan validasi yang sama dan menampilkan pesan kesalahan bila belum lolos; di `edit_story` Preview langsung membuka halaman detail cerita.

**Hook implementasi.** `create_story.html:62:validate()`, `:63` simpan, `:64` preview; `edit_story.html:63-64`; `#saveTop`, `#saveBottom`, `#successBox`.

**Acceptance criteria.**
- **Given** judul kosong dan sinopsis 10 karakter, **when** penulis menekan Simpan, **then** hanya pesan `"Judul story tidak boleh kosong"` yang tampil.
- **Given** sinopsis 49 karakter, **when** penulis menekan Simpan, **then** muncul pesan minimal 50 karakter dan penyimpanan dibatalkan.
- **Given** nama pena kosong di `create_story`, **when** penulis menekan Simpan, **then** muncul pesan nama pena wajib.
- **Given** seluruh validasi lolos, **when** penulis menekan Simpan, **then** kedua tombol simpan kembali nonaktif dan pesan berhasil tampil.
- **Given** formulir belum valid, **when** penulis menekan Preview di `create_story`, **then** pesan kesalahan validasi tampil, bukan pesan pratinjau.

---

### FR-STUDIO-17 — Pemulihan draft otomatis · P1

**Deskripsi.** Penanda di penyimpanan lokal menandakan ada pekerjaan belum tersimpan, dan saat halaman dibuka kembali penulis ditawari untuk melanjutkannya.

**User story.** Sebagai penulis, saya ingin diingatkan bahwa saya punya pekerjaan yang belum tersimpan agar tidak kehilangan tulisan karena menutup halaman.

**Aturan bisnis.**
- Kunci berbeda per halaman: `novelova:create-story-draft` dan `novelova:edit-story-draft`.
- **Ditulis** setiap kali `markDirty()` dipanggil — jadi sejak ketikan pertama.
- **Dihapus** saat penyimpanan berhasil.
- Saat halaman dimuat, bila kunci ada, kotak pemulihan ditampilkan.
- Menekan **Pulihkan** menyembunyikan kotak, menampilkan pesan pemulihan, dan memanggil `markDirty()` sehingga tombol simpan langsung aktif.
- **Yang disimpan hanya penanda `'1'`, bukan isi formulir** — pemulihan sebenarnya belum ada (lihat §7).

**Hook implementasi.** `create_story.html:47` `draftKey`, `:52` pemulihan; `edit_story.html:49`, `:54`; `#autosaveBox`, `#restoreDraft`.

**Acceptance criteria.**
- **Given** penulis mengetik lalu menutup halaman tanpa menyimpan, **when** halaman dibuka kembali, **then** kotak pemulihan draft tampil.
- **Given** penulis menyimpan dengan sukses lalu membuka halaman lagi, **when** halaman dimuat, **then** kotak pemulihan tidak tampil.
- **Given** kotak pemulihan tampil, **when** penulis menekan "Pulihkan", **then** kotak hilang, pesan pemulihan tampil, dan tombol simpan menjadi aktif.

---

### FR-STUDIO-18 — Status, visibilitas & zona bahaya · P0

**Deskripsi.** Khusus `edit_story`: mengubah status penerbitan, visibilitas, serta dua aksi berisiko (arsip dan hapus permanen).

**User story.** Sebagai penulis, saya ingin menandai cerita sebagai tamat, menjeda, menyembunyikan, atau menghapusnya — dengan pengaman yang sepadan dengan risikonya.

**Aturan bisnis.**
- **Status** dipilih lewat chip `data-status`; lencana status di kepala halaman ikut berubah.
  - Memilih **Completed** menampilkan `confirm('Apakah cerita ini benar-benar sudah tamat?')`.
  - Memilih **Hiatus** menampilkan panel hiatus; status lain menyembunyikannya.
- **Visibilitas** dipilih lewat chip `data-visibility`; memilih **Privat** menampilkan peringatan.
- **Arsipkan** menampilkan pesan konfirmasi dan menandai formulir berubah.
- **Hapus permanen** memakai pengaman terkuat di seluruh aplikasi: `prompt('Ketik ulang judul story untuk hapus permanen:')`, dan penghapusan hanya diteruskan bila teks yang diketik **persis sama** dengan isi kolom judul. Bila tidak cocok → `"Konfirmasi hapus dibatalkan."`.
- **Catatan cacat:** konfirmasi status "Completed" dievaluasi **setelah** lencana status sudah diubah, sehingga membatalkan konfirmasi tetap meninggalkan lencana pada "Completed" (lihat §7).

**Hook implementasi.** `edit_story.html:57` chip status & visibilitas; `:66` `archiveBtn`; `:67` `deleteBtn`.

**Acceptance criteria.**
- **Given** penulis memilih status "Hiatus", **when** pilihan diterapkan, **then** panel hiatus tampil.
- **Given** penulis memilih visibilitas "Privat", **when** pilihan diterapkan, **then** peringatan privat tampil.
- **Given** penulis menekan Hapus dan mengetik judul yang berbeda, **when** dialog ditutup, **then** pesan berbunyi "Konfirmasi hapus dibatalkan." dan cerita tidak dihapus.
- **Given** penulis mengetik judul persis sama, **when** dialog ditutup, **then** pesan penghapusan permanen tampil.
- **Given** penulis memilih "Completed" lalu membatalkan konfirmasi, **when** halaman dirender, **then** *(perilaku yang diinginkan)* lencana status kembali ke nilai sebelumnya.

---

## D. Editor Bab (`create_chapter.html` / `edit_chapter.html`)

### FR-STUDIO-19 — Editor bab dwibahasa · P0

**Deskripsi.** Satu editor dengan dua panel bahasa — Indonesia sebagai versi wajib dan English sebagai versi opsional yang dimulai dari keadaan kosong dengan ajakan.

**User story.** Sebagai penulis, saya ingin menulis versi Indonesia dan English dalam satu tempat agar bisa menjangkau pembaca internasional tanpa berpindah halaman.

**Aturan bisnis.**
- Dua tab bahasa (`data-lang="id"` dan `"en"`); berpindah tab memasang kelas `en` pada frame, menyorot tab aktif, dan mengubah penanda bahasa di bilah alat (`ID` / `EN`).
- **Panel English mulai kosong** dengan kartu ajakan berisi dua pilihan: **"Mulai Tulis English"** (menampilkan editor dan memfokuskan kolom judul) dan **"Lewati - publish Indonesia saja"** (kembali ke panel Indonesia).
- Judul bab dibatasi **100 karakter** pada kedua bahasa.
- **`hasEnglish()`** mengembalikan benar bila judul **atau** isi English terisi — dipakai untuk mengubah label tombol terbit, menandai tab English, dan menentukan alur konfirmasi.
- Tab English mendapat penanda `has-en` saat versi English sudah ada isinya.
- Bilah alat pemformatan (B, I, U, kutip, paragraf, tautan) tersedia secara visual tetapi belum berfungsi (lihat §7).

**Hook implementasi.** `create_chapter.html:55:hasEnglish()`, `:57:switchLang(lang)`, `:59` mulai/lewati English; `edit_chapter.html:46`, `:48`.

**Acceptance criteria.**
- **Given** penulis membuka tab English pertama kali, **when** panel tampil, **then** kartu ajakan tampil, bukan editor.
- **Given** penulis menekan "Mulai Tulis English", **when** editor tampil, **then** fokus berada di kolom judul English.
- **Given** penulis menekan "Lewati - publish Indonesia saja", **when** aksi dijalankan, **then** editor kembali ke panel Indonesia.
- **Given** versi English sudah berisi judul, **when** tampilan diperbarui, **then** tab English mendapat penanda dan tombol terbit berbunyi "Publish Sekarang - ID+EN".

---

### FR-STUDIO-20 — Penghitung kata & mode fokus · P1

**Deskripsi.** Hitungan kata per bahasa yang diperbarui langsung, ditampilkan di tiga tempat, ditambah mode fokus yang menyembunyikan elemen di sekitar editor.

**User story.** Sebagai penulis, saya ingin memantau panjang naskah dan bisa menulis tanpa gangguan saat sedang mengalir.

**Aturan bisnis.**
- **Penghitungan kata:** teks dipangkas lalu dipecah pada rangkaian spasi, dan entri kosong dibuang — sehingga naskah kosong menghasilkan **0**, bukan 1.
- **Tiga tempat tampil:**
  - Baris hitungan utama: `"ID <n> kata"`, atau `"ID <n> kata - EN <n> words"` bila versi English ada.
  - Ringkasan pada sheet menu: sama dengan baris utama.
  - Bilah alat: hitungan **bahasa yang sedang aktif saja** (`"<n> kata"` atau `"<n> words"`).
- Diperbarui pada setiap ketikan di isi Indonesia, isi English, dan judul English.
- **Mode fokus:** tombol F membalik kelas `focus` pada frame; **mengetuk area konten mematikannya** sehingga penulis tidak terjebak di dalamnya.
- `refresh()` dipanggil sekali saat halaman dimuat agar hitungan awal benar (penting di `edit_chapter` yang sudah berisi naskah).

**Hook implementasi.** `create_chapter.html:54:words(v)`, `:56:refresh()`, `:60` mode fokus; `edit_chapter.html:45`, `:47`, `:50`.

**Acceptance criteria.**
- **Given** kolom isi kosong, **when** hitungan dirender, **then** tertulis "ID 0 kata".
- **Given** penulis mengetik tiga kata di isi Indonesia, **when** hitungan diperbarui, **then** ketiga tempat tampil menunjukkan angka 3.
- **Given** versi English berisi 5 kata dan tab aktif adalah English, **when** bilah alat dirender, **then** tertulis "5 words".
- **Given** mode fokus aktif, **when** penulis mengetuk area konten, **then** mode fokus mati.
- **Given** `edit_chapter` dibuka dengan naskah yang sudah ada, **when** halaman dimuat, **then** hitungan kata sudah benar tanpa perlu mengetik.

---

### FR-STUDIO-21 — Validasi & pilihan terbit bab · P0

**Deskripsi.** Empat aturan validasi yang menjaga kelengkapan tiap versi bahasa, lalu pilihan menyimpan sebagai draft atau menerbitkan.

**User story.** Sebagai penulis, saya ingin dicegah menerbitkan bab yang setengah jadi — terutama versi English yang hanya berjudul tanpa isi.

**Aturan bisnis.**

| Urutan | Aturan | Pesan |
|---|---|---|
| 1 | Judul Indonesia wajib | `Judul chapter Indonesia wajib diisi` |
| 2 | Isi Indonesia wajib | `Konten Indonesia wajib diisi sebelum publish` |
| 3 | Ada judul English tanpa isi English | `Konten English belum diisi. Lengkapi atau hapus judulnya` |
| 4 | Ada isi English tanpa judul English | `Tambahkan judul English untuk melengkapi versi ini` |

- Aturan 3 dan 4 saling melengkapi: versi English harus **lengkap atau tidak ada sama sekali** — tidak boleh separuh.
- **`create_chapter`** — validasi lolos membuka sheet **"Simpan atau terbitkan?"**:
  - **Simpan ke Draft** → pesan `"Chapter disimpan ke draft."`
  - **Terbitkan Sekarang** → bila versi English **ada**, langsung terbit ID+EN; bila **tidak ada**, muncul sheet konfirmasi **"Publish tanpa English?"** dengan dua pilihan: **Tambah English Dulu** (menutup konfirmasi, berpindah ke tab English, dan membuka editornya) atau **Publish Indonesia Saja**.
- **`edit_chapter`** — memakai empat aturan yang sama, tetapi langsung menyimpan tanpa sheet pilihan; pesan `"Perubahan chapter disimpan."`.

**Hook implementasi.** `create_chapter.html:64:validateBeforePublish()`, `:65-67` alur terbit; `edit_chapter.html:54` simpan.

**Acceptance criteria.**
- **Given** judul Indonesia kosong, **when** penulis menekan terbit, **then** muncul pesan judul wajib dan sheet pilihan tidak terbuka.
- **Given** judul English terisi tetapi isinya kosong, **when** penulis menekan terbit, **then** muncul pesan melengkapi atau menghapus judul English.
- **Given** isi English terisi tetapi judulnya kosong, **when** penulis menekan terbit, **then** muncul pesan menambahkan judul English.
- **Given** versi Indonesia lengkap dan tidak ada versi English, **when** penulis memilih "Terbitkan Sekarang", **then** muncul konfirmasi "Publish tanpa English?".
- **Given** konfirmasi tanpa English tampil, **when** penulis memilih "Tambah English Dulu", **then** konfirmasi tertutup, tab English aktif, dan editor English terbuka.
- **Given** kedua versi lengkap, **when** penulis memilih "Terbitkan Sekarang", **then** bab terbit ID+EN tanpa konfirmasi tambahan.

---

### FR-STUDIO-22 — Catatan penulis & jadwal dari editor · P1

**Deskripsi.** Menu editor berisi jadwal terbit, catatan penulis per bahasa, dan pratinjau tiap versi.

**User story.** Sebagai penulis, saya ingin menulis pesan untuk pembaca dan mengatur jadwal terbit tanpa keluar dari editor.

**Aturan bisnis.**
- Sheet menu memuat: **Jadwal Publish** · **Catatan Penulis** · **Preview Indonesia** · **Preview English**, dengan ringkasan hitungan kata di kepalanya.
- Sub-teks "Catatan Penulis" menunjukkan keadaan pengisian per bahasa (`"ID belum diisi - EN belum diisi"`).
- **Catatan penulis** punya tab bahasa sendiri — catatan boleh berbeda antar bahasa.
- **Jadwal Publish** memuat saran waktu terbaik (**Senin 19.00 WIB**) dengan tombol "Pakai Saran", input tanggal + jam (default 19:00), dan pilihan pengulangan (Tidak · Setiap 3 hari · Mingguan).
- **Tanggal minimum dan nilai awal = hari ini menurut zona waktu lokal.**
- Membuka satu sheet dari sheet lain selalu menutup sheet asal terlebih dahulu.
- Seluruh tombol ber-`data-action` menampilkan pesannya masing-masing lewat toast berdurasi 2.200 ms.

**Hook implementasi.** `create_chapter.html:44-46` markup sheet; `:61` pembuka/penutup; `:62:showToast()`; `edit_chapter.html:51-53`.

**Acceptance criteria.**
- **Given** penulis membuka menu editor, **when** sheet tampil, **then** ringkasan hitungan kata sesuai naskah saat itu.
- **Given** menu terbuka, **when** penulis memilih "Catatan Penulis", **then** menu tertutup dan sheet catatan terbuka.
- **Given** sheet jadwal terbuka, **when** penulis membuka pemilih tanggal, **then** tanggal sebelum hari ini tidak dapat dipilih.
- **Given** sheet catatan terbuka, **when** penulis berpindah ke tab English, **then** catatan English dapat diisi terpisah dari catatan Indonesia.

---

## E. Akses Bab (`chapter_access.html`)

### FR-STUDIO-23 — Pilih tipe akses bab · P0

**Deskripsi.** Tiga kartu tipe akses dengan tabel perbandingan, panel pengaturan yang muncul sesuai pilihan, dan teks konteks yang berubah mengikuti tipe.

**User story.** Sebagai penulis, saya ingin memahami perbedaan gratis, berbayar, dan privat sebelum memilih, agar tidak salah mengatur monetisasi.

**Aturan bisnis.**
- **Tiga tipe:**

  | Tipe | Penjelasan | Tampil di app | Bisa dibaca | Butuh koin |
  |---|---|---|---|---|
  | **Gratis** | Semua pembaca bisa baca tanpa koin | Ya | Ya | Tidak |
  | **Berbayar** | Bab tampil, tetapi butuh koin | Ya | Terkunci | Ya |
  | **Privat** | Bab disembunyikan sementara | Tidak | Tidak | Tidak |

- Tipe awal prototype: **Berbayar**.
- Kartu terpilih diberi kelas `active` dan disisipi label **"Aktif"**; label pada kartu lain dihapus lebih dahulu agar tidak menumpuk.
- Panel pengaturan tampil sesuai tipe: panel harga untuk berbayar, panel privat untuk privat, tidak ada panel untuk gratis.
- **Teks konteks berubah per tipe:**
  - Gratis → menarik pembaca baru; **pembeli lama tidak mendapat refund**.
  - Berbayar → pembeli lama tetap bisa akses meski harga diubah; ubah ke gratis tidak bisa dibatalkan **dalam 7 hari**.
  - Privat → **bab pertama tidak bisa diprivatkan**; pembaca yang sudah membeli tetap bisa akses.
- **Tombol simpan membandingkan dengan nilai awal**, bukan sekadar mendeteksi interaksi: labelnya `"Tidak ada perubahan"` (nonaktif) atau `"Simpan Pengaturan"` (aktif). Kembali ke tipe semula membuat tombol nonaktif lagi.
- Menyimpan menampilkan pesan sesuai tipe (`"Chapter diatur ke Gratis"`, `"Chapter dikunci - <n> koin"`, `"Chapter disembunyikan"`) lalu mengembalikan tombol ke keadaan nonaktif.

**Hook implementasi.** `chapter_access.html:50:markChanged()`, `:51:selectAccess(type)`, `:58` simpan; `.access-card[data-access]`, `#paidPanel`, `#privatePanel`, `#contextInfo`, `#saveAccess`.

**Acceptance criteria.**
- **Given** halaman baru dibuka, **when** penulis melihat tombol simpan, **then** tombol nonaktif dan berbunyi "Tidak ada perubahan".
- **Given** tipe berubah dari Berbayar ke Gratis, **when** perubahan diterapkan, **then** tombol menjadi aktif dan berbunyi "Simpan Pengaturan".
- **Given** penulis mengubah tipe lalu mengembalikannya ke Berbayar, **when** perubahan diterapkan, **then** tombol kembali nonaktif.
- **Given** tipe Berbayar aktif, **when** halaman dirender, **then** panel harga tampil dan panel privat tersembunyi.
- **Given** penulis menekan simpan pada tipe Berbayar dengan harga 3, **when** aksi dijalankan, **then** pesan berbunyi "Chapter dikunci - 3 koin" dan tombol kembali nonaktif.

---

### FR-STUDIO-24 — Konfirmasi perubahan akses berisiko · P0

**Deskripsi.** Tiga transisi akses yang berdampak pada pembaca dan pendapatan ditahan oleh dialog konfirmasi berisi konsekuensi yang konkret.

**User story.** Sebagai penulis, saya ingin diberi tahu dampak nyata sebelum mengubah akses bab, agar tidak merugikan pembaca yang sudah membeli atau kehilangan pendapatan tanpa sadar.

**Aturan bisnis.**

| Transisi | Judul konfirmasi | Isi |
|---|---|---|
| Berbayar → Gratis | `Ubah ke Gratis?` | `412 pembeli tidak mendapat refund. Perubahan ini tidak bisa dibatalkan dalam 7 hari.` |
| Apa pun → Privat | `Sembunyikan chapter ini?` | `Chapter tidak tampil ke pembaca baru. Pembaca yang sudah beli tetap bisa akses.` |
| Privat → non-privat | `Tampilkan chapter ini kembali?` | `Chapter akan muncul lagi di list untuk pembaca sesuai tipe akses baru.` |

- Memilih tipe yang **sama dengan tipe saat ini** langsung diabaikan — konfirmasi tidak pernah muncul tanpa perubahan nyata.
- Transisi **Gratis → Berbayar** tidak dikonfirmasi (tidak merugikan siapa pun).
- Tipe tujuan disimpan sementara (`pending`) dan **baru diterapkan setelah disetujui**.
- **Batalkan** membuang tipe tertunda dan menutup dialog tanpa perubahan apa pun.

**Hook implementasi.** `chapter_access.html:52:requestAccess(type)`; `:54-55` batal & setuju; `#confirmBackdrop`, `#confirmTitle`, `#confirmCopy`.

**Acceptance criteria.**
- **Given** tipe saat ini Berbayar, **when** penulis memilih Gratis, **then** dialog konfirmasi tampil menyebut 412 pembeli dan batas 7 hari.
- **Given** dialog konfirmasi tampil, **when** penulis menekan "Batalkan", **then** tipe tetap Berbayar dan tombol simpan tetap nonaktif.
- **Given** dialog konfirmasi tampil, **when** penulis menekan "Ya, lanjutkan", **then** tipe berubah ke Gratis dan tombol simpan menjadi aktif.
- **Given** tipe saat ini Berbayar, **when** penulis menekan kartu Berbayar lagi, **then** tidak ada dialog yang muncul.
- **Given** tipe saat ini Privat, **when** penulis memilih Berbayar, **then** dialog "Tampilkan chapter ini kembali?" tampil.

---

### FR-STUDIO-25 — Harga bab & porsi pratinjau gratis · P0

**Deskripsi.** Penentu harga bab dalam koin dengan batas, saran harga berdasarkan panjang naskah, estimasi pendapatan, dan pengatur porsi bab yang bisa dicicipi gratis.

**User story.** Sebagai penulis, saya ingin menentukan harga yang wajar dan tahu berapa yang benar-benar saya terima setelah potongan platform.

**Aturan bisnis.**
- Harga dalam **koin**, rentang **1–50**, nilai awal **3**.
- Tombol − dan + mengubah harga satu langkah dan **selalu dijepit** ke rentang (`Math.max(1, …)` dan `Math.min(50, …)`), sehingga tidak pernah keluar batas.
- Menekan − atau + langsung mengaktifkan tombol simpan.
- **Saran harga:** 3–5 koin untuk sekitar 847 kata.
- **Estimasi pendapatan** ditampilkan eksplisit: 100 pembeli → gross 300 koin, platform 60 koin, penulis 240 koin — menyatakan **bagi hasil 80% penulis / 20% platform**.
- **Pratinjau gratis** berupa penggeser 0–50% dengan nilai awal **20%**, disertai keterangan bahwa pembaca bisa mencicipi dulu.

**Hook implementasi.** `chapter_access.html:32` panel harga; `:56` tombol −/+; `#coinPrice`, `#paidPanel`.

**Acceptance criteria.**
- **Given** harga 1, **when** penulis menekan tombol −, **then** harga tetap 1.
- **Given** harga 50, **when** penulis menekan tombol +, **then** harga tetap 50.
- **Given** harga 3, **when** penulis menekan +, **then** harga menjadi 4 dan tombol simpan aktif.
- **Given** panel harga tampil, **when** penulis membacanya, **then** estimasi pendapatan penulis dan potongan platform tertera.

---

### FR-STUDIO-26 — Pengaturan bab privat · P1

**Deskripsi.** Panel khusus tipe privat berisi penjelasan konsekuensi, alasan, durasi, dan tanggal tampil kembali.

**User story.** Sebagai penulis, saya ingin menyembunyikan bab sementara untuk direvisi, dengan alasan tercatat dan tanggal kembali yang jelas.

**Aturan bisnis.**
- Penjelasan tetap: bab tidak muncul di daftar pembaca, tidak bisa dicari, tetapi penulis tetap bisa melihat dan mengeditnya; **pembaca yang sudah membeli tetap bisa akses**.
- **Alasan privat:** Sedang direvisi · Konten sensitif - perlu review · Sementara ditarik · Lainnya.
- **Durasi privat:** "Sampai saya aktifkan lagi" atau "Otomatis tampil kembali".
- **Tanggal tampil kembali** dengan **minimum dan nilai awal hari ini** menurut zona waktu lokal.

**Hook implementasi.** `chapter_access.html:33` `#privatePanel`; `:49` tanggal lokal; `#returnDate`.

**Acceptance criteria.**
- **Given** penulis memilih tipe Privat dan menyetujui konfirmasi, **when** panel dirender, **then** panel privat tampil dan panel harga tersembunyi.
- **Given** panel privat tampil, **when** penulis membuka pemilih tanggal tampil kembali, **then** tanggal sebelum hari ini tidak dapat dipilih.
- **Given** panel privat tampil, **when** penulis membacanya, **then** tertera bahwa pembeli lama tetap bisa mengakses bab.

---

## F. Analitik Cerita (`story_analytics.html`)

### FR-STUDIO-27 — Rentang waktu & ringkasan metrik · P0

**Deskripsi.** Pemilih rentang waktu lima pilihan dan empat kartu metrik ringkas yang berfungsi sebagai pintasan ke bagian rinciannya.

**User story.** Sebagai penulis, saya ingin melihat performa cerita pada periode tertentu dan langsung melompat ke rincian metrik yang menarik perhatian saya.

**Aturan bisnis.**
- **Lima rentang:** `7H` *(aktif)* · `30H` · `3B` · `1T` · `Custom`.
- Label rentang berubah mengikuti pilihan: `7 hari terakhir` · `30 hari terakhir` · `3 bulan terakhir` · `1 tahun terakhir` · `range custom`.
- Memilih **Custom** membuka panel tanggal mulai/selesai; pilihan lain menutupnya.
- Input tanggal custom dibatasi **maksimum hari ini** (zona waktu lokal), dengan nilai awal hari ini — mencegah memilih tanggal masa depan.
- **Empat kartu metrik** dengan arah perubahan:

  | Metrik | Nilai | Perubahan | Melompat ke |
  |---|---|---|---|
  | Views | 12.4rb | Naik 18% | Grafik views |
  | Pembaca baru | +892 | Naik 11% | Grafik views |
  | Komentar | 234 | Turun 4% | Sentimen komentar |
  | Pendapatan | 1.240 | Naik 32% | Pendapatan koin |

- Menekan kartu memanggil `preventDefault()` lalu menggulir mulus (`behavior: 'smooth'`) ke bagian tujuan — bukan lompatan jangkar biasa.

**Hook implementasi.** `story_analytics.html:231` pemilih rentang; `:237` kartu metrik; `#rangeText`, `#customRange`, `.metric-card[data-target]`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** penulis melihat pemilih rentang, **then** "7H" aktif dan label berbunyi "7 hari terakhir".
- **Given** penulis memilih "3B", **when** pilihan diterapkan, **then** label berbunyi "3 bulan terakhir" dan panel custom tertutup.
- **Given** penulis memilih "Custom", **when** panel terbuka, **then** tanggal setelah hari ini tidak dapat dipilih.
- **Given** penulis menekan kartu "Komentar", **when** aksi dijalankan, **then** halaman menggulir mulus ke bagian sentimen komentar.

---

### FR-STUDIO-28 — Grafik dengan lapisan data · P1

**Deskripsi.** Grafik tren dengan dua lapisan yang dapat dinyalakan dan dimatikan sendiri-sendiri.

**User story.** Sebagai penulis, saya ingin membandingkan atau memisahkan tren views dan pembaca baru agar bisa melihat pola masing-masing dengan jelas.

**Aturan bisnis.**
- Dua lapisan: **Views** dan **Pembaca baru**, keduanya aktif secara default.
- Tombol lapisan membalik kelas `active` dan menyembunyikan/menampilkan garis grafik terkait (`data-layer` → `#viewsLine` / `#readersLine`).
- Kedua lapisan boleh dimatikan bersamaan (tidak ada pengaman minimal satu lapisan) — lihat §7.

**Hook implementasi.** `story_analytics.html:241` listener `.toggle`; `#viewsLine`, `#readersLine`.

**Acceptance criteria.**
- **Given** kedua lapisan aktif, **when** penulis mematikan "Views", **then** garis views hilang dan garis pembaca baru tetap tampil.
- **Given** lapisan "Views" mati, **when** penulis menyalakannya lagi, **then** garis views tampil kembali.

---

### FR-STUDIO-29 — Performa per bab · P0

**Deskripsi.** Peringkat bab menurut performa, dengan penanda masalah dan detail yang dibuka lewat bottom sheet.

**User story.** Sebagai penulis, saya ingin tahu bab mana yang paling menarik pembaca dan bab mana yang membuat mereka berhenti membaca.

**Aturan bisnis.**
- Bab diberi peringkat (`#1`, `#2`, `#3`) dengan ringkasan views, komentar, dan pembelian.
- Setiap kartu punya **lencana harga**: harga koin, `Gratis`, atau **`Drop`** bergaya peringatan untuk bab yang retensinya menurun.
- Keterangan tambahan menyoroti peran bab (mis. `"entry point terbaik"`, `"retention menurun"`).
- **Batang rating** menampilkan skor relatif tiap bab.
- Pilihan urutan: Terbanyak dibaca · Terbanyak komentar · Terbanyak pembelian · Rating tertinggi · Terbaru — **belum berfungsi** (lihat §7).
- Menekan kartu membuka bottom sheet dengan judul bab tersebut, berisi detail performa **menurut rentang yang sedang dipilih**.

**Hook implementasi.** `story_analytics.html:144-146` kartu bab; `:247` pembuka sheet; `#chapterSheet`, `#sheetTitle`.

**Acceptance criteria.**
- **Given** penulis melihat daftar performa bab, **when** halaman dirender, **then** bab terurut menurut peringkat dengan views, komentar, dan pembelian.
- **Given** sebuah bab retensinya menurun, **when** kartunya dirender, **then** lencana "Drop" bergaya peringatan tampil.
- **Given** penulis menekan kartu bab, **when** sheet terbuka, **then** judul sheet sesuai bab yang ditekan.
- **Given** sheet terbuka, **when** penulis menekan tombol tutup, **then** sheet tertutup.

---

### FR-STUDIO-30 — Sentimen, asal pembaca & aktivitas publish · P2

**Deskripsi.** Tiga bagian analitik pendukung: nada komentar, sumber trafik dan jam aktif, serta kalender aktivitas penerbitan.

**User story.** Sebagai penulis, saya ingin memahami bagaimana pembaca merespons, dari mana mereka datang, dan seberapa konsisten saya menerbitkan.

**Aturan bisnis.**
- **Sentimen komentar** — ringkasan nada dari total komentar pada rentang terpilih (prototype: 234 komentar).
- **Asal pembaca** — sumber trafik dan waktu paling aktif.
- **Aktivitas publish** — kalender bulanan (prototype: Mei 2026) yang menunjukkan hari-hari penerbitan.
- Ketiganya bersifat tampilan; nilainya statis pada prototype.

**Acceptance criteria.**
- **Given** penulis menggulir ke bagian sentimen, **when** bagian dirender, **then** jumlah komentar yang dianalisis tampil.
- **Given** penulis menggulir ke aktivitas publish, **when** bagian dirender, **then** kalender bulan berjalan tampil.

---

### FR-STUDIO-31 — Ekspor & bagikan laporan · P2

**Deskripsi.** Dua cara membawa hasil analitik keluar aplikasi: laporan PDF dan kartu pencapaian untuk media sosial.

**User story.** Sebagai penulis, saya ingin menyimpan atau membagikan pencapaian cerita saya agar bisa dipakai di luar aplikasi.

**Aturan bisnis.**
- **Export PDF** — ringkasan analitik satu halaman.
- **Buat Kartu** — kartu statistik untuk media sosial.
- Tombol **Export** ringkas juga tersedia di bilah atas.
- Seluruhnya memakai pola `data-toast` dengan pesan masing-masing (durasi 2.200 ms); belum menghasilkan berkas nyata.

**Hook implementasi.** `story_analytics.html:57`, `:206`, `:253` — atribut `data-toast`.

**Acceptance criteria.**
- **Given** penulis menekan "Export PDF", **when** aksi dijalankan, **then** pesan pembuatan laporan tampil.
- **Given** penulis menekan "Buat Kartu", **when** aksi dijalankan, **then** pesan pembuatan kartu pencapaian tampil.

---

## G. Riwayat Cetak (`story_print_history.html`)

### FR-STUDIO-32 — Riwayat & lini masa pesanan cetak · P1

**Deskripsi.** Daftar pesanan cetak dengan status, rincian, lini masa enam tahap untuk hardcopy, dan aksi yang sesuai keadaan tiap pesanan.

**User story.** Sebagai penulis yang memesan cetak, saya ingin memantau posisi pesanan saya dan tahu apa yang harus saya lakukan berikutnya.

**Aturan bisnis.**
- **Format nomor pesanan:** `#HDC-YYYYMMDD-NNN` untuk hardcopy dan `#SFT-YYYYMMDD-NNN` untuk softcopy — jenis pesanan terbaca dari nomornya.
- **Tiga keadaan pesanan** dengan lencana dan aksi berbeda:

  | Status | Isi | Aksi |
  |---|---|---|
  | **Sedang Dicetak** (hardcopy) | Tipe, invoice, bukti bayar, no. resi, catatan admin, lini masa, estimasi selesai | **Hubungi Admin** (`help_center.html`) · Download Invoice |
  | **Selesai** (softcopy) | Nama berkas, ukuran, masa unduh | Download ulang · Bagikan |
  | **Dibatalkan** (hardcopy) | **Alasan penolakan** | **Kembali ke Stories** (`my_stories.html`) · Hubungi Admin |

- **Lini masa enam tahap:** Diajukan → Dikonfirmasi → Dibayar → **Dicetak** → Dikirim → Diterima, dengan penanda titik untuk tahap selesai, tahap saat ini, dan tahap yang belum dijalani, serta label posisi saat ini.
- **Masa unduh softcopy: 30 hari** — konsisten dengan pesan pada FR-STUDIO-05.
- Alasan penolakan bersifat konkret dan menyatakan kebijakan produk: **minimum 10 bab aktif agar layak dijilid**.
- Keterangan halaman menyatakan bahwa softcopy tersimpan untuk diunduh ulang selama 30 hari dan hardcopy menampilkan proses administrasi dari pengajuan sampai diterima.
- Estimasi penyelesaian disertai catatan bahwa notifikasi dikirim saat status berubah.
- Halaman ini **tidak memiliki JavaScript** — seluruh isinya statis.

**Hook implementasi.** `story_print_history.html:32-50` — `.order`, `.badge`, `.timeline`, `.track .dot`, `.labels`.

**Acceptance criteria.**
- **Given** ada pesanan hardcopy berjalan, **when** kartunya dirender, **then** lini masa enam tahap tampil dengan penanda posisi saat ini.
- **Given** pesanan softcopy sudah selesai, **when** kartunya dirender, **then** nama berkas, ukuran, dan masa unduh 30 hari tampil beserta tombol unduh ulang.
- **Given** pesanan ditolak, **when** kartunya dirender, **then** alasan penolakan tampil beserta tautan ke Stories dan bantuan.
- **Given** penulis menekan "Hubungi Admin", **when** aksi dijalankan, **then** `help_center.html` terbuka.

---

## H. Penutup Alur (FR baru)

### FR-STUDIO-33 — Onboarding penulis & verifikasi pencairan · P0

**Status: BARU.** Saat ini tab "Stories" langsung tersedia untuk semua orang, tanpa pendaftaran maupun verifikasi — padahal prasyaratnya sudah disebut di tiga tempat.

**Deskripsi.** Alur menjadi penulis: dari pembaca biasa, mendaftar, melengkapi identitas, sampai layak menerima pencairan.

**User story.** Sebagai pembaca yang ingin mulai menulis, saya ingin tahu apa saja syaratnya dan menyelesaikannya bertahap, bukan menemukan syarat itu saat pencairan ditolak.

**Aturan bisnis.**
- **Prasyarat yang sudah dinyatakan di prototype dan harus ditegakkan:**

  | Prasyarat | Sumber |
  |---|---|
  | Identitas pencairan | `edit_profile` — *"Payout identity — Required when author withdrawals are enabled"* |
  | Verifikasi 2 langkah | `settings_security` — *"Diperlukan untuk pencairan dan perubahan dompet"* |
  | Menyetujui ketentuan penulis | `terms.html` — *"Penulis wajib mengirimkan konten orisinal dan mengikuti ketentuan tinjauan, pencairan, hak cipta, dan moderasi"* |

- **Tiga tingkat status penulis**, masing-masing membuka kemampuan berbeda:

  | Status | Bisa dilakukan | Belum bisa |
  |---|---|---|
  | Belum mendaftar | Membaca saja | Membuat cerita |
  | Penulis terdaftar | Membuat cerita, menulis bab, menerbitkan gratis | Menetapkan bab berbayar |
  | Penulis terverifikasi | Semuanya, termasuk bab berbayar dan pencairan | — |

- Menetapkan bab **berbayar** di `chapter_access` (FR-STUDIO-23) mensyaratkan status terverifikasi — uang hanya boleh mengalir ke identitas yang sudah diperiksa.
- `my_stories` untuk pembaca yang belum mendaftar menampilkan **ajakan menjadi penulis**, bukan daftar kosong — pola keadaan kosong yang sama dengan perpustakaan (lihat [`prd_06_library.md`](prd_06_library.md) FR-LIB-12).
- Status penulis dan langkah yang belum selesai ditampilkan di `profile.html` pada kelompok Akun.
- Onboarding **tidak memblokir menulis**: penulis boleh langsung membuat cerita dan bab gratis; verifikasi baru diminta saat menyentuh monetisasi atau pencairan.

**Acceptance criteria.**
- **Given** pembaca belum mendaftar sebagai penulis, **when** membuka tab Stories, **then** ajakan menjadi penulis tampil, bukan daftar cerita kosong.
- **Given** penulis terdaftar tetapi belum terverifikasi, **when** mencoba menetapkan bab berbayar, **then** aksi ditahan disertai langkah verifikasi yang harus diselesaikan.
- **Given** penulis terdaftar, **when** menerbitkan bab gratis, **then** penerbitan berhasil tanpa verifikasi.
- **Given** penulis belum mengaktifkan 2FA, **when** membuka `author_withdraw`, **then** pengajuan ditahan disertai tautan ke `settings_security`.
- **Given** penulis sudah terverifikasi, **when** membuka profil, **then** status penulis terverifikasi tampil.

---

### FR-STUDIO-34 — Autosave naskah bab · P0

**Status: BARU.** Risiko kehilangan data terbesar di aplikasi: naskah bab tidak tersimpan sama sekali, dan berpindah halaman menghilangkan seluruh tulisan.

**Deskripsi.** Naskah bab tersimpan otomatis selama penulis mengetik, dengan indikator keadaan simpan dan pemulihan bila sesi terputus.

**User story.** Sebagai penulis, saya ingin tulisan saya aman meski aplikasi tertutup tiba-tiba, agar tidak kehilangan pekerjaan berjam-jam.

**Aturan bisnis.**
- **Dua lapis penyimpanan:**
  1. **Lokal** (`localStorage`), ditulis maksimal sekali per **3 detik** setelah ketikan berhenti — bertahan meski jaringan mati.
  2. **Server**, dikirim maksimal sekali per **30 detik** dan sekali lagi saat halaman ditinggalkan.
- Yang disimpan mencakup **kedua bahasa**: judul dan isi Indonesia, judul dan isi English, serta catatan penulis.
- **Indikator keadaan** di bilah alat: `Menyimpan…` · `Tersimpan <waktu relatif>` · `Gagal menyimpan — coba lagi`. Penulis harus selalu tahu apakah tulisannya aman.
- **Pemulihan:** membuka editor yang punya draf lokal lebih baru daripada versi server menampilkan tawaran memulihkan, dengan pratinjau perbedaan waktu — memakai pola kotak pemulihan yang sudah ada pada editor cerita (FR-STUDIO-17), tetapi memulihkan **isi**, bukan hanya penanda.
- Meninggalkan halaman dengan perubahan belum tersimpan memicu konfirmasi peramban.
- Draf lokal dihapus setelah naskah tersimpan di server.
- **Kunci penyimpanan per bab**: `novelova:chapter-draft-<chapter_id>` — draf beberapa bab tidak saling menimpa.
- Aturan yang sama berlaku untuk editor cerita: penanda `novelova:create-story-draft` dan `novelova:edit-story-draft` diganti menjadi penyimpan isi (menutup §7 no. 3).

**Acceptance criteria.**
- **Given** penulis mengetik lalu berhenti 3 detik, **when** autosave berjalan, **then** indikator berubah menjadi "Tersimpan".
- **Given** penulis menutup tab tanpa menyimpan, **when** membuka editor bab itu lagi, **then** tawaran memulihkan draf tampil dan isinya benar-benar kembali.
- **Given** jaringan terputus, **when** penulis terus mengetik, **then** draf tetap tersimpan lokal dan indikator menyatakan gagal menyimpan ke server.
- **Given** penulis menyunting dua bab berbeda, **when** keduanya punya draf, **then** draf keduanya tersimpan terpisah dan tidak saling menimpa.
- **Given** naskah sudah tersimpan di server, **when** penulis membuka editor lagi, **then** tidak ada tawaran pemulihan.
- **Given** ada perubahan belum tersimpan, **when** penulis menutup tab, **then** konfirmasi peramban muncul.

---

### FR-STUDIO-35 — Lanjutan setelah cerita dibuat · P1

**Status: BARU.** Setelah "Simpan Draft" di `create_story`, tidak ada tautan menuju penulisan bab pertama — penulis harus menempuh empat langkah untuk lanjutan yang paling wajar.

**Deskripsi.** Kotak sukses pembuatan cerita menawarkan langkah berikutnya secara langsung.

**User story.** Sebagai penulis yang baru membuat cerita, saya ingin langsung menulis bab pertama, bukan mencari jalannya sendiri.

**Aturan bisnis.**
- Kotak sukses menampilkan **tiga pilihan berurutan**: **"Tulis bab pertama"** (utama) → `create_chapter.html` dengan `story_id` cerita baru · **"Kelola bab"** → `manage_chapters.html` · **"Kembali ke daftar cerita"** → `my_stories.html`.
- `create_chapter` yang dibuka dari sini menampilkan judul cerita induknya di kepala halaman, sehingga penulis tahu sedang menulis untuk cerita mana.
- Pola yang sama diterapkan pada `manage_chapters` yang kosong: keadaan kosong sudah menyediakan tautan **"+ Tulis Chapter Baru"** (FR-STUDIO-08) — ini dipertahankan dan menjadi jalur kedua.
- Setelah bab pertama diterbitkan, `my_stories` menampilkan ajakan berikutnya: menjadwalkan bab kedua atau mengatur akses bab.

**Acceptance criteria.**
- **Given** penulis menyimpan draf cerita baru, **when** kotak sukses tampil, **then** tombol "Tulis bab pertama" tersedia.
- **Given** penulis menekan "Tulis bab pertama", **when** editor terbuka, **then** judul cerita induk tampil di kepala halaman.
- **Given** penulis memilih "Kembali ke daftar cerita", **when** `my_stories` terbuka, **then** cerita baru tampil dengan status draft.

---

### FR-STUDIO-36 — Konteks bab pada pengaturan akses · P0

**Status: BARU.** `chapter_access.html` tidak tahu bab mana yang sedang diatur — tidak ada judul bab, tidak ada parameter, dan isinya selalu bab yang sama dari mana pun dibuka.

**Deskripsi.** Halaman akses memuat bab tertentu, menampilkan identitasnya, dan menerapkan aturan yang bergantung pada posisi bab itu.

**User story.** Sebagai penulis, saya ingin yakin bahwa pengaturan akses yang saya ubah benar-benar berlaku untuk bab yang saya maksud.

**Aturan bisnis.**
- Halaman dibuka dengan `?chapter_id=<id>` dan menampilkan **judul bab beserta nomornya** di kepala halaman.
- Tipe akses awal, harga, dan porsi pratinjau dimuat dari data bab tersebut — bukan selalu "Berbayar" dan 3 koin seperti sekarang.
- **Aturan yang bergantung konteks dan sudah dinyatakan di teks halaman, kini benar-benar ditegakkan:**
  - *"Chapter pertama tidak bisa diprivatkan"* — opsi Privat dinonaktifkan bila bab bernomor 1, disertai alasannya.
  - Jumlah pembeli pada konfirmasi ubah-ke-gratis (`"412 pembeli"`) diambil dari data bab, bukan angka tetap.
  - Batas *"tidak bisa dibatalkan dalam 7 hari"* dihitung dari tanggal perubahan terakhir bab tersebut; bila masih dalam masa itu, opsi ditahan disertai sisa harinya.
- Menetapkan tipe **Berbayar** mensyaratkan status penulis terverifikasi (FR-STUDIO-33).
- Tombol kembali mengembalikan penulis ke `manage_chapters` pada posisi bab tersebut.

**Acceptance criteria.**
- **Given** penulis membuka pengaturan akses dari menu bab 47, **when** halaman terbuka, **then** judul dan nomor bab 47 tampil dan tipe aksesnya sesuai data bab itu.
- **Given** penulis membuka pengaturan akses bab nomor 1, **when** halaman dirender, **then** opsi Privat dinonaktifkan disertai alasannya.
- **Given** sebuah bab baru diubah menjadi gratis tiga hari lalu, **when** penulis mencoba mengubahnya lagi, **then** perubahan ditahan disertai sisa masa 4 hari.
- **Given** penulis belum terverifikasi, **when** memilih tipe Berbayar, **then** aksi ditahan disertai langkah verifikasi.

---

### FR-STUDIO-37 — Jadwal terbit terpadu · P1

**Status: BARU.** Saat ini ada **tiga UI penjadwalan terpisah** — cerita di `my_stories`, bab di `manage_chapters`, dan jadwal di editor bab — tanpa satu tempat untuk melihat apa yang akan terbit.

**Deskripsi.** Satu tampilan yang merangkum seluruh penerbitan terjadwal penulis, lintas cerita dan bab.

**User story.** Sebagai penulis dengan beberapa cerita berjalan, saya ingin melihat kalender penerbitan saya dalam satu layar agar bisa menjaga ritme rilis.

**Aturan bisnis.**
- Tampilan **daftar terurut waktu** memuat seluruh yang terjadwal: cerita akan terbit, bab akan terbit, dan bab privat yang dijadwalkan tampil kembali (`chapter_access` FR-STUDIO-26).
- Setiap entri memuat: cerita · bab (bila ada) · tanggal & jam · pengulangan · tombol ubah jadwal dan batalkan.
- **Peringatan bentrok** bila dua penerbitan pada cerita yang sama dijadwalkan dalam rentang kurang dari satu jam.
- **Peringatan celah** bila cerita yang biasanya rutin tidak punya jadwal berikutnya — melanjutkan pola notifikasi yang sudah ada di `manage_chapters` (*"Chapter 50 belum diedit 5 hari — lanjutkan sebelum jadwal kosong"*, FR-STUDIO-07).
- Ketiga penjadwal yang sudah ada tetap berfungsi sebagai jalur cepat; tampilan ini menjadi ringkasannya, bukan penggantinya.
- Rekomendasi waktu terbaik dari `author_analytics` (*"Sabtu pukul 20.00"*, lihat [`prd_08_author_earnings.md`](prd_08_author_earnings.md) FR-EARN-05) ditawarkan sebagai pintasan pengisian jadwal.
- Seluruh waktu disimpan sebagai UTC beserta zona waktu penulis, dan ditampilkan mengikuti zona waktu pengguna — menutup §7 no. 12.

**Acceptance criteria.**
- **Given** penulis punya tiga penerbitan terjadwal di dua cerita, **when** membuka jadwal terpadu, **then** ketiganya tampil terurut waktu.
- **Given** dua bab cerita yang sama dijadwalkan dalam selang 30 menit, **when** daftar dirender, **then** peringatan bentrok tampil.
- **Given** penulis mengubah jadwal dari tampilan ini, **when** perubahan disimpan, **then** jadwal pada `manage_chapters` ikut berubah.
- **Given** penulis berada di zona waktu berbeda dari saat menjadwalkan, **when** jadwal dirender, **then** waktu ditampilkan sesuai zona waktunya saat ini.

---

### FR-STUDIO-38 — Antrean tinjauan & status moderasi · P0

**Status: BARU.** Tiga tempat menyebut proses tinjauan — `terms.html` (*"mengikuti ketentuan tinjauan"*), `chapter_access` (alasan privat *"Konten sensitif - perlu review"*), `story_print_history` (*"Menunggu Konfirmasi Admin"*) — tetapi tidak ada satu pun status atau layar untuk itu.

**Deskripsi.** Status tinjauan menjadi keadaan yang terlihat pada cerita dan bab, dengan alasan yang jelas dan jalan perbaikan bila ditolak.

**User story.** Sebagai penulis, saya ingin tahu bila karya saya sedang ditinjau atau ditolak, beserta alasannya, agar bisa memperbaikinya.

**Aturan bisnis.**
- **Dua status baru** melengkapi lima status cerita yang sudah ada (FR-STUDIO-02):

  | Status | Arti | Aksi yang tersedia |
  |---|---|---|
  | **Dalam tinjauan** | Menunggu pemeriksaan admin setelah dikirim terbit | Batalkan pengiriman · Edit *(mengembalikan ke draft)* |
  | **Ditolak** | Tidak lolos tinjauan | Lihat alasan · Perbaiki dan kirim ulang |

- Status yang sama berlaku pada tingkat bab di `manage_chapters` dan ikut dalam saringan tab.
- **Alasan penolakan wajib spesifik dan dapat ditindaklanjuti** — mengikuti contoh yang sudah baik di `story_print_history`: *"Chapter aktif kurang dari minimum 10 chapter layak jilid."*
- Penulis menerima notifikasi saat status tinjauan berubah (lihat [`prd_11_search_notifications.md`](prd_11_search_notifications.md) FR-NOTIF-02).
- Cerita dan bab **dalam tinjauan tidak tampil ke pembaca**; bab yang sudah terbit dan kemudian dilaporkan tetap tampil sampai diputuskan, kecuali melewati ambang laporan (lihat [`prd_12_social.md`](prd_12_social.md) FR-SOCIAL-07).
- Laporan dari pembaca terhadap cerita, ulasan, atau komentar masuk ke antrean yang sama.
- Pesanan hardcopy yang menunggu konfirmasi admin memakai mekanisme antrean yang sama, sehingga penulis melihat satu jenis status tinjauan di seluruh studio.

**Acceptance criteria.**
- **Given** penulis mengirim cerita untuk terbit, **when** `my_stories` dirender, **then** cerita berstatus "Dalam tinjauan" dan tidak tampil ke pembaca.
- **Given** cerita ditolak, **when** penulis membuka kartunya, **then** alasan penolakan yang spesifik tampil beserta tombol perbaiki.
- **Given** status tinjauan berubah, **when** notifikasi diterima dan ditekan, **then** kartu cerita atau bab yang bersangkutan terbuka.
- **Given** sebuah bab berstatus "Dalam tinjauan", **when** penulis menyaring tab, **then** status itu tersedia sebagai saringan.
- **Given** penulis membatalkan pengiriman, **when** aksi dijalankan, **then** cerita kembali berstatus draft.

---

## 5. State & Persistensi

| State | Penyimpanan | Kunci | Umur |
|---|---|---|---|
| Penanda draft cerita baru | `localStorage` | `novelova:create-story-draft` | Sampai penyimpanan berhasil |
| Penanda perubahan cerita | `localStorage` | `novelova:edit-story-draft` | Sampai penyimpanan berhasil |
| Filter/urutan/pencarian daftar | Memori DOM | — | Hilang saat pindah halaman |
| Isi formulir & naskah bab | Memori DOM | — | **Hilang saat pindah halaman** |
| Tipe akses bab & harga | Memori DOM | — | Hilang saat pindah halaman |
| Cerita/bab yang dihapus | DOM | — | Muncul kembali saat dimuat ulang |
| Jadwal terbit | — | — | Tidak disimpan sama sekali |

---

## 6. Navigasi

**Masuk ke modul:** tab "Stories" dari halaman ber-navigasi bawah · `home_tabs` · `detail_story_*` · `author_analytics` → `my_stories` · `author_withdraw` → `my_stories` · `story_print_history` → `my_stories`.

**Rantai internal:** `my_stories` → `create_story` / `edit_story` / `manage_chapters` / `story_analytics` / `story_print_history` · `manage_chapters` → `create_chapter` / `edit_chapter` / `chapter_access` · `story_analytics` → `edit_story` / `my_stories`.

**Keluar dari modul:** `detail_story_alternatif_unified_cover_first.html` (preview) · `chapter_read_unlocked.html` *(menggantung)* · `help_center.html` · `home_tabs.html` · `topup_koin.html` · `my_library.html` · `profile.html`.

---

## 7. Catatan Prototype vs Produksi

| # | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | **Tombol "Analisa" dihapus dari cerita berstatus published** | Cerita yang paling butuh analitik justru tidak punya tautannya | Balik aturannya: tampilkan Analisa untuk published dan completed, sembunyikan untuk draft |
| 2 | **Naskah bab tidak tersimpan sama sekali** — pindah halaman menghilangkan tulisan | Risiko kehilangan pekerjaan terbesar di seluruh aplikasi | Autosave berkala ke server + draf lokal; pulihkan isi, bukan hanya penanda |
| 3 | **Pemulihan draft hanya menyimpan penanda `'1'`**, bukan isi formulir | Menekan "Pulihkan" tidak mengembalikan apa pun | Simpan isi formulir bersama penanda |
| 4 | **Konfirmasi status "Completed" dievaluasi setelah lencana diubah** | Membatalkan konfirmasi tetap meninggalkan lencana "Completed" | Pindahkan `confirm` ke sebelum perubahan status |
| 5 | **Hapus cerita tersedia untuk semua status**, termasuk terbit dan berbayar | Bisa menghapus karya berbayar tanpa penanganan refund | Terapkan aturan yang sama dengan bab: hapus terbit wajib melalui konfirmasi refund |
| 6 | **Jadwal terbit tidak tersimpan** — hanya menampilkan pesan | Fitur inti penulis belum nyata | Sambungkan ke penjadwal di Gamification Service (lihat `../../context_claude/CONTEXT_HANDOFF.md` §6) |
| 7 | **Tombol "Lihat" pada bab terbit menuju `chapter_read_unlocked.html` yang tidak ada** | Menuju 404 | Arahkan ke `chapter_read_locked_story_stage.html` |
| 8 | **Bilah alat pemformatan editor bab tidak berfungsi** (B, I, U, kutip, paragraf, tautan) | Naskah hanya bisa teks polos | Implementasikan editor kaya atau markdown |
| 9 | **Urutan pada daftar performa bab (`story_analytics`) tidak berfungsi** | Kontrol tampak rusak | Sambungkan ke pemuatan ulang data |
| 10 | **Kedua lapisan grafik boleh dimatikan bersamaan** | Grafik kosong tanpa penjelasan | Jaga minimal satu lapisan aktif, atau tampilkan keadaan kosong |
| 11 | **Ekspor PDF/CSV, unduh invoice, cetak, dan bagikan semuanya hanya pesan** | Tidak ada berkas nyata | Implementasikan pembuatan berkas di server |
| 12 | **Tanggal terbit tidak menyertakan zona waktu** meski UI menulis "WIB" | Ambigu untuk pengguna lintas zona waktu | Simpan sebagai UTC beserta zona waktu penulis |
| 13 | **Pencarian cerita hanya mencakup judul**, sedangkan perpustakaan pembaca juga mencakup penulis dan genre | Tidak konsisten antar daftar | Samakan cakupan pencarian |
| 14 | **Tiga cara berbeda menyembunyikan baris** (`style.display`, kelas `hidden`, kelas `removed`) di tiga halaman dengan pola sama | Perilaku sulit diprediksi saat komponen digabung | Satukan menjadi satu pola saat ekstraksi komponen |
| 15 | **Estimasi harga cetak dan bagi hasil di-hardcode** (Rp 285.000; 80/20) | Angka bisa menyesatkan | Ambil dari konfigurasi server |
| 16 | Seluruh data cerita, bab, dan analitik hardcoded | Tidak mencerminkan data nyata | Sambungkan ke `../../docs/api_my_stories.md` dan `../../docs/api_author_content_editor.md` |
