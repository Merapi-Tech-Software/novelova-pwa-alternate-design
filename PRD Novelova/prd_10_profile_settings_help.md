# PRD Novelova — Modul Profil, Pengaturan, Bantuan & Legal

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya **sama dengan v1**; yang berubah hanya kulitnya (putaran 7).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Halaman: `profile.html` · `edit_profile.html` · `other_user_profile.html` · `settings_language.html` · `settings_security.html` · `help_center.html` · `privacy.html` · `terms.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_profile.md`, `../../docs/api_settings.md`, `../../docs/api_help_center.md`, `../../docs/api_legal.md`

---

## 1. Ringkasan Modul

Pusat akun pengguna. `profile.html` berperan sebagai **hub**: identitas, rekap aktivitas, pintasan dompet, kontrol privasi, dan gerbang menuju seluruh halaman pengaturan, bantuan, dan legal. Tujuh halaman lainnya adalah cabang dari hub ini.

| Aspek | Nilai |
|---|---|
| **Aktor** | Pembaca / Penulis (pemilik akun) · Pengunjung profil orang lain |
| **Halaman** | `profile` (1.002 baris), `other_user_profile` (116), `edit_profile` (98), `help_center` (62), `settings_security` (60), `settings_language` (53), `privacy` (45), `terms` (41) |
| **Prasyarat** | Pengguna sudah masuk |
| **State persisten** | Tidak ada |
| **Sub-sistem desain** | `profile` memakai restyled rose-gold dengan navigasi bawah; tujuh halaman lain memakai klasik `fix_ui` |
| **Bahasa UI** | Indonesia, **kecuali** `edit_profile`, `other_user_profile`, dan `help_center` yang berbahasa Inggris (lihat §7) |

---

## 2. Flow

### 2.1 Mengelola akun

1. Tab "Profile" → `profile.html`.
2. Identitas, rekap aktivitas mingguan, dan aktivitas terbaru tampil.
3. Pintasan dompet menuju top-up dan riwayat transaksi.
4. **Kontrol visibilitas publik** — pengguna menentukan apa yang boleh dilihat orang lain, dan dapat melihat pratinjaunya lewat `other_user_profile.html`.
5. Menu Akun → riwayat cetak · keamanan · bahasa. Menu Dukungan → pusat bantuan · keluar.
6. Ikon pengaturan atau avatar → `edit_profile.html` untuk mengubah identitas dan data akun.

### 2.2 Melihat profil pengguna lain

`profile` → pratinjau profil publik atau statistik pengikut → `other_user_profile.html` → telusuri tiga tab (Activity · Books · Visibility) → ikuti atau kirim pesan → buka cerita dari rak publik.

### 2.3 Mendapat bantuan

`profile` → `help_center.html` → cari artikel, lihat tiket terbuka, buka kategori bantuan, baca FAQ, atau hubungi dukungan.

---

## 3. Daftar Requirement

| ID | Nama | Halaman | Prioritas |
|---|---|---|---|
| FR-PROF-01 | Identitas & statistik pengguna | `profile` | P0 |
| FR-PROF-02 | Rekap & riwayat aktivitas | `profile` | P1 |
| FR-PROF-03 | Pintasan dompet | `profile` | P1 |
| FR-PROF-04 | Kontrol visibilitas publik dengan sakelar induk | `profile` | P0 |
| FR-PROF-05 | Menu akun & dukungan | `profile` | P0 |
| FR-PROF-06 | Navigasi bawah lima tab | `profile` | P0 |
| FR-PROF-07 | Ubah identitas & data akun | `edit_profile` | P0 |
| FR-PROF-08 | Profil publik pengguna lain | `other_user_profile` | P1 |
| FR-SET-01 | Pengaturan bahasa & wilayah | `settings_language` | P1 |
| FR-SET-02 | Pusat kendali keamanan | `settings_security` | P0 |
| FR-SET-03 | Kelola sesi aktif | `settings_security` | P0 |
| FR-HELP-01 | Pencarian & kategori bantuan | `help_center` | P1 |
| FR-HELP-02 | Tiket dukungan & kontak | `help_center` | P1 |
| FR-HELP-03 | Dokumen legal | `privacy`, `terms` | P0 |
| FR-PROF-09 | **[BARU]** Daftar pengikut & mengikuti | `profile` | P1 |
| FR-PROF-10 | **[BARU]** Visibilitas publik tersimpan & benar-benar berlaku | `profile`, `other_user_profile` | P0 |
| FR-SET-04 | **[BARU]** Bahasa & wilayah benar-benar diterapkan | `settings_language` | P1 |
| FR-SET-05 | **[BARU]** Ekspor data & penghapusan akun | `settings_security` | P0 |

---

## 4. Detail Requirement

## A. Profil (`profile.html`)

### FR-PROF-01 — Identitas & statistik pengguna · P0

**Deskripsi.** Kartu identitas berisi avatar yang bisa diganti, nama, handle, tahun bergabung, tingkat keanggotaan, dan tiga statistik yang berfungsi sebagai tautan.

**User story.** Sebagai pengguna, saya ingin melihat identitas saya dan langsung menuju perpustakaan atau daftar pengikut dari satu tempat.

**Aturan bisnis.**
- Isi kartu: avatar berinisial · **nama depan** · `Pembaca sejak <tahun>` · tombol `Sunting` bergaris rambut.
  > **Revisi 5 September 2026.** Versi lama menuntut nama lengkap, `@handle`, dan
  > lencana tingkat. Nama lengkap terpotong jadi "Anna Mahar…" di lebar 390px —
  > dan nama yang dipotong di halaman profil sendiri terbaca sebagai cacat, bukan
  > sebagai keringkasan. Handle dan lencana tingkat pindah ke `/profil/ubah`.
- **Panel koin** di bawah kartu identitas: label `KOIN KAMU`, saldo serif, jumlah voucher aktif, dan tombol `Isi Koin` terisi. Ia satu-satunya blok putih di halaman ini, dan itu disengaja — ia satu-satunya yang membawa uang. *(Baru — mockup `7i`.)*
- **`Keluar` berupa teks redup**, bukan tombol merah: ia bukan tindakan destruktif, dan tindakan yang bisa dibatalkan dengan masuk lagi tidak pernah memakai isi merah (`prd_01` §0).
- Avatar punya tombol edit tersendiri yang menuju `edit_profile.html`; ikon pengaturan di bilah atas juga menuju ke sana.
- **Tiga statistik, dan ketiganya diturunkan — bukan penghitung tersimpan:**

  | Statistik | Diturunkan dari |
  |---|---|
  | Cerita dibaca | `progress` — cerita yang minimal satu babnya selesai |
  | Jam baca | `readMinutes` bab yang selesai, dibulatkan ke jam |
  | Ulasan | jumlah baris `reviews` milik pengguna |

> **Revisi 5 September 2026 · statistik profil.** Versi lama menyebut tiga
> statistik **Perpustakaan · Pengikut · Mengikuti**, semuanya berupa tautan,
> dengan angka contoh dari prototipe. Yang dibangun: **Cerita dibaca · Jam baca ·
> Ulasan**, ketiganya angka rekam jejak pembaca dan bukan tautan.
>
> Alasannya dua. Pertama, ketiganya **diturunkan** lewat satu metode seam
> (`getReaderStats`), bukan disimpan sebagai penghitung — penghitung akan
> berselisih dengan sumbernya pada penghapusan pertama, dan yang berselisih di
> halaman profil adalah klaim tentang pengguna sendiri. Kedua, pengikut dan
> mengikuti punya halamannya sendiri (`/profil/koneksi`), dan mengulangnya di
> strip ini berarti dua tempat yang harus dijaga sepakat.
>
> Perpustakaan tetap dijangkau lewat bilah navigasi bawah; `Karya saya` ada di
> daftar `AKUN` di bawahnya. `architecture.md` — halaman ini dibangun di R5.

- Pengikut dan Mengikuti mengarah ke halaman profil **satu orang**, bukan daftar pengguna (lihat §7).

**Hook implementasi.** `profile.html:741` `.ident`; `:754` `.triplet`; `:735` ikon pengaturan.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pengguna melihat kartu identitas, **then** nama, handle, tahun bergabung, dan tingkat tampil.
- **Given** pengguna menekan statistik "Perpustakaan", **when** aksi dijalankan, **then** `my_library.html` terbuka.
- **Given** pengguna menekan ikon edit pada avatar, **when** aksi dijalankan, **then** `edit_profile.html` terbuka.

---

### FR-PROF-02 — Rekap & riwayat aktivitas · P1

**Deskripsi.** Ringkasan tiga angka aktivitas mingguan, diikuti daftar aktivitas terbaru yang ditandai jelas sebagai data pribadi.

**User story.** Sebagai pengguna, saya ingin melihat apa saja yang sudah saya lakukan minggu ini agar merasa progres membaca saya tercatat.

**Aturan bisnis.**
- **Rekap mingguan:** Chapter (17) · Ulasan (6) · Dibuka (3).
- Daftar aktivitas terbaru diberi label **"HANYA KAMU"** — menegaskan bahwa bagian ini tidak pernah tampil di profil publik, berbeda dari yang diatur pada FR-PROF-04.
- **Tiga jenis aktivitas** dengan ikon berbeda: menyelesaikan bab, menulis ulasan, dan membuka bab premium.
- Setiap baris memuat judul, keterangan kontekstual (judul cerita, jumlah koin, tag ulasan), dan waktu relatif (`12 menit lalu`, `Hari ini`, `Kemarin`).

**Hook implementasi.** `profile.html:762` `.activity-hero`; `:776` `.activity-feed`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pengguna melihat rekap, **then** ketiga angka mingguan tampil.
- **Given** daftar aktivitas dirender, **when** pengguna melihat kepalanya, **then** label "HANYA KAMU" tampil.
- **Given** aktivitas membuka bab premium dirender, **when** pengguna membacanya, **then** jumlah koin yang dipakai tertera.

---

### FR-PROF-03 — Pintasan dompet · P1

**Deskripsi.** Blok berisi dua pintasan menuju pembelian koin dan riwayat transaksi.

**User story.** Sebagai pengguna, saya ingin mengisi koin atau memeriksa riwayat transaksi langsung dari profil.

**Aturan bisnis.**
- Dua baris: **Top up koin** → `topup_koin.html` · **Riwayat transaksi** → `transaction_history.html`.
- Kepala blok memakai label keadaan (prototype: `BARU DIPERBARUI`).
- Setiap baris memakai pola konsisten: ikon · judul · keterangan · tanda panah.

**Hook implementasi.** `profile.html:804-825` — `.sh`, `.group`, `.li`.

**Acceptance criteria.**
- **Given** pengguna menekan "Top up koin", **when** aksi dijalankan, **then** `topup_koin.html` terbuka.
- **Given** pengguna menekan "Riwayat transaksi", **when** aksi dijalankan, **then** `transaction_history.html` terbuka.

---

### FR-PROF-04 — Kontrol visibilitas publik dengan sakelar induk · P0

**Deskripsi.** Empat kategori data yang dapat ditampilkan atau disembunyikan dari pengunjung profil, dikendalikan satu per satu atau sekaligus lewat sakelar induk, dengan indikator ringkasan yang selalu menyesuaikan.

**User story.** Sebagai pengguna, saya ingin mengatur persis apa yang orang lain lihat di profil saya, dan bisa mematikan semuanya sekaligus bila ingin privat.

**Aturan bisnis.**
- **Empat kategori yang dapat diatur:**

  | Kategori | Cakupan | Keadaan awal |
  |---|---|---|
  | Aktivitas membaca | Buku dibaca, progres bab, streak, jam baca | Aktif |
  | Perpustakaan dan cerita tersimpan | Rak publik, favorit, cerita selesai | Aktif |
  | Ulasan dan reaksi | Rating, teks ulasan, reaksi komentar, tag | Aktif |
  | **Data dompet** | — | **Nonaktif**, ditandai *"Data sensitif. Matikan kecuali pengguna mengizinkan data publik penuh."* |

- **Sakelar induk** (`data-master`) mengatur seluruh sakelar sekaligus: menyalakannya menyalakan semua, mematikannya mematikan semua. Sakelar biasa hanya mengubah dirinya sendiri.
- **Indikator ringkasan** menampilkan `SEMUA PUBLIK` bila **seluruh** sakelar aktif, dan `KUSTOM` bila tidak. Dihitung ulang setiap perubahan.
- Karena data dompet nonaktif secara default, keadaan awal halaman selalu `KUSTOM`.
- Data dompet ditandai sensitif — produksi sebaiknya memberi konfirmasi tambahan sebelum menyalakannya.
- **Pratinjau profil publik** menuju `other_user_profile.html` sehingga pengguna dapat memeriksa hasil pengaturannya.
- Sakelar induk ikut dihitung dalam `switches`, sehingga menyalakan seluruh sakelar satu per satu juga menghasilkan `SEMUA PUBLIK`.

**Hook implementasi.** `profile.html:832` `.privacy-card`; `:838` `[data-master]`; `:984:syncPrivacyState()`; listener `:989`; `#privacyState`.

**Acceptance criteria.**
- **Given** halaman baru dimuat, **when** indikator dirender, **then** tertulis `KUSTOM` karena data dompet nonaktif.
- **Given** pengguna mematikan sakelar induk, **when** perubahan diterapkan, **then** keempat sakelar kategori ikut mati.
- **Given** seluruh sakelar mati lalu pengguna menyalakan sakelar induk, **when** perubahan diterapkan, **then** seluruh sakelar menyala dan indikator berbunyi `SEMUA PUBLIK`.
- **Given** seluruh sakelar menyala, **when** pengguna mematikan satu kategori saja, **then** indikator berubah menjadi `KUSTOM`.
- **Given** pengguna menekan "Pratinjau profil pengguna lain", **when** aksi dijalankan, **then** `other_user_profile.html` terbuka.

---

### FR-PROF-05 — Menu akun & dukungan · P0

**Deskripsi.** Dua kelompok tautan menuju halaman pengaturan, bantuan, dan keluar akun.

**User story.** Sebagai pengguna, saya ingin menemukan seluruh pengaturan akun saya dalam satu daftar yang tertata.

**Aturan bisnis.**

| Kelompok | Menu | Tujuan |
|---|---|---|
| **Akun** | Cetak story / riwayat cetak | `story_print_history.html` |
| | Keamanan | `settings_security.html` |
| | Bahasa | `settings_language.html` |
| **Dukungan** | Pusat bantuan (*FAQ, kontak, masukan*) | `help_center.html` |
| | **Keluar** | `login.html` |

- Menu **Keluar** memakai gaya **danger** dan tidak memiliki tanda panah — membedakannya secara visual dari menu navigasi biasa.
- Setiap menu memuat judul dan keterangan singkat isi halamannya.
- **Keluar tidak meminta konfirmasi** (lihat §7).

**Hook implementasi.** `profile.html:863-886` — `.sh`, `.group`, `.li`, `.li.danger`.

**Acceptance criteria.**
- **Given** pengguna menekan "Keamanan", **when** aksi dijalankan, **then** `settings_security.html` terbuka.
- **Given** pengguna menekan "Pusat bantuan", **when** aksi dijalankan, **then** `help_center.html` terbuka.
- **Given** menu Keluar dirender, **when** pengguna melihatnya, **then** menu bergaya danger dan tanpa tanda panah.

---

### FR-PROF-06 — Navigasi bawah lima tab · P0

**Deskripsi.** Navigasi bawah dengan pemetaan rute yang sama seperti beranda, dibangun dari objek rute bernama.

**User story.** Sebagai pengguna, saya ingin berpindah dari profil ke area lain aplikasi tanpa harus kembali ke beranda dulu.

**Aturan bisnis.**
- Rute dipetakan berdasarkan indeks dari objek `ROUTES`: home · topup · library · stories · profile.
- Setiap tab diberi `role="link"`, `tabindex="0"`, serta handler `click` dan `keydown` (Enter/Space).
- Tab tanpa rute padanan diabaikan tanpa error.
- Tab "Profile" ditandai aktif.
- Berbeda dari `home_tabs` yang memakai array literal, halaman ini memakai **objek bernama** lalu menyusunnya menjadi array — memudahkan penyesuaian rute.

**Hook implementasi.** `profile.html:955-960` `bottomNavRoutes`; loop `:962`.

**Acceptance criteria.**
- **Given** pengguna berada di profil, **when** melihat navigasi bawah, **then** tab "Profile" ditandai aktif.
- **Given** pengguna menekan tab "Stories", **when** aksi dijalankan, **then** `my_stories.html` terbuka.
- **Given** fokus papan ketik pada sebuah tab, **when** pengguna menekan Enter, **then** halaman tujuan terbuka.

---

## B. Ubah Profil (`edit_profile.html`)

### FR-PROF-07 — Ubah identitas & data akun · P0

**Deskripsi.** Formulir dua tab: identitas yang dapat diedit, dan data akun yang dikelola lewat aksi terpisah.

**User story.** Sebagai pengguna, saya ingin mengubah nama tampilan, username, bio, peran, dan lokasi saya, serta memeriksa status verifikasi akun.

**Aturan bisnis.**
- **Tab Identity** — kolom yang dapat diedit:

  | Kolom | Batas | Nilai contoh |
  |---|---|---|
  | Display name | 40 karakter | Anna Maharani |
  | Username | 24 karakter | @anna_reads |
  | Bio | — | teks bebas |
  | Role | pilihan | Reader · Author · **Reader and author** |
  | Location | dua kolom | Jakarta · Indonesia |

- **Tab Account** — empat baris berstatus, dikelola lewat aksi terpisah, bukan diedit langsung:

  | Baris | Status/Aksi |
  |---|---|
  | Email | **Verified** |
  | Phone | tombol **Change** |
  | Google sign-in | tombol **Manage** |
  | Payout identity | tautan **Review** → `../../alt/author_withdraw.html` *(keluar folder)* |

- Perpindahan tab memindahkan kelas `active` pada tab **dan** panel bersamaan (`data-panel` → id panel).
- **Ganti foto** hanya mengubah inisial avatar menjadi `AM` dan menampilkan pesan `"Photo preview changed. Save changes to apply."` — menegaskan bahwa perubahan belum berlaku sebelum disimpan.
- **Simpan** membaca nama tampilan; bila kosong dipakai teks pengganti `"Unnamed reader"`, lalu menampilkan pesan `"<nama> profile changes saved in prototype."`.
- **Tidak ada validasi** — nama kosong tetap diterima (lihat §7).
- Keterangan akun menyatakan bahwa identitas ini tampil di ulasan, komentar, profil publik, dan alat penulis.

**Hook implementasi.** `edit_profile.html:80` tab; `:88` `#changePhoto`; `:92` `#saveBtn`; `#displayName`, `#note`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pengguna melihat tab, **then** tab "Identity" aktif dan panel identitas tampil.
- **Given** pengguna menekan tab "Account", **when** perpindahan terjadi, **then** panel akun tampil dan panel identitas tersembunyi.
- **Given** pengguna menekan "Change photo", **when** aksi dijalankan, **then** inisial avatar berubah dan pesan menyatakan perubahan belum diterapkan.
- **Given** nama tampilan diisi "Anna", **when** pengguna menekan simpan, **then** pesan memuat nama "Anna".
- **Given** nama tampilan dikosongkan, **when** pengguna menekan simpan, **then** pesan memakai "Unnamed reader" *(perilaku produksi seharusnya menolak — lihat §7)*.

---

## C. Profil Pengguna Lain (`other_user_profile.html`)

### FR-PROF-08 — Profil publik pengguna lain · P1

**Deskripsi.** Tampilan profil orang lain yang hanya menampilkan data yang diizinkan pemiliknya, dengan tiga tab dan dua aksi sosial.

**User story.** Sebagai pembaca, saya ingin melihat aktivitas dan rak buku pengguna lain agar bisa menemukan cerita lewat orang yang seleranya mirip.

**Aturan bisnis.**
- **Empat statistik publik:** Followers (2.4K) · Following (318) · Books (58) · Likes (1.1K).
- **Tiga tab:**

  | Tab | Isi |
  |---|---|
  | **Activity** | Aktivitas terbaru: menyelesaikan bab premium, memposting ulasan, menambah penanda — dengan waktu relatif |
  | **Books** | Rak buku publik; tiap buku menuju `detail_story_alternatif_unified_cover_first.html` |
  | **Visibility** | Apa yang dibagikan pemilik profil, ditandai `ON` / `OFF` |

- Panel dikendalikan atribut `hidden`, bukan kelas CSS.
- Keterangan berubah mengikuti tab aktif: `"Viewing <tab> information allowed by this user profile."`
- **Tab Visibility menegaskan aturan privasi produk:**

  | Data | Keadaan |
  |---|---|
  | Reading activity | Diizinkan pemilik, terlihat publik |
  | Book shelf | Rak publik, ulasan, penanda dapat ditampilkan |
  | **Wallet data** | **Tidak pernah** ditampilkan di profil orang lain |

- **Data dompet tidak pernah tampil di profil publik apa pun** — ini aturan platform, bukan preferensi pengguna, dan lebih kuat daripada sakelar pada FR-PROF-04.
- **Dua aksi sosial:** **Follow** → `"Follow request applied in prototype state."` · **Message** → `"Message composer would open after mutual permission check."`, menyiratkan bahwa pesan hanya terbuka setelah **izin dua arah**.
- Tombol kembali menuju `profile.html`.

**Hook implementasi.** `other_user_profile.html:68-72` tab; `:102-111` perpindahan panel; `:112-113` aksi sosial; `#followBtn`, `#messageBtn`, `#note`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pengguna melihat tab, **then** tab "Activity" aktif dan panelnya tampil.
- **Given** pengguna menekan tab "Books", **when** perpindahan terjadi, **then** hanya panel rak buku yang tampil dan keterangan menyebut "books".
- **Given** pengguna menekan sebuah buku di rak, **when** aksi dijalankan, **then** halaman detail cerita terbuka.
- **Given** pengguna membuka tab "Visibility", **when** panel dirender, **then** data dompet ditandai tidak pernah ditampilkan.
- **Given** pengguna menekan Follow, **when** aksi dijalankan, **then** pesan konfirmasi permintaan mengikuti tampil.

---

## D. Pengaturan (`settings_language.html` / `settings_security.html`)

### FR-SET-01 — Pengaturan bahasa & wilayah · P1

**Deskripsi.** Lima pengaturan lokalisasi yang saling terkait, disertai panel pratinjau yang menunjukkan dampaknya secara konkret.

**User story.** Sebagai pengguna, saya ingin mengatur bahasa, wilayah, mata uang, dan zona waktu, serta melihat langsung pengaruhnya terhadap harga dan jadwal.

**Aturan bisnis.**
- **Kepala halaman menyatakan cakupan dampak:** pengaturan ini memengaruhi **rekomendasi, harga, jadwal penulis, dan tampilan dompet** — bukan sekadar bahasa antarmuka.
- Ringkasan cepat: **IDR** (mata uang) · **WIB** (zona waktu) · **ID** (konten).
- **Lima pengaturan:**

  | Pengaturan | Pilihan |
  |---|---|
  | Bahasa aplikasi | Bahasa Indonesia · English (US) · English (UK) |
  | Prioritas terjemahan cerita | Asli + terjemahan Indonesia · Bahasa asli lebih dulu · Konten terjemahan lebih dulu |
  | Wilayah konten | Indonesia · Global · Amerika Serikat |
  | Mata uang dan pembayaran | IDR - Rupiah · USD - Dollar |
  | Zona waktu | Asia/Jakarta · UTC · America/New_York |

- **Panel pratinjau** menunjukkan tiga contoh dampak nyata:
  - Tampilan top-up → `Rp 119.000`, metode pembayaran lokal diprioritaskan.
  - Jadwal publikasi → pengingat rilis memakai `Asia/Jakarta` dan format tanggal lokal.
  - Rekomendasi → feed memprioritaskan cerita Indonesia dan Global.
- Pengaturan "Prioritas terjemahan cerita" terhubung langsung dengan editor bab dwibahasa (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-19).
- Pengaturan zona waktu terhubung dengan penjadwal terbit yang menampilkan label "WIB".
- **Halaman ini tidak memiliki JavaScript** — pilihan belum berpengaruh apa pun (lihat §7).

**Hook implementasi.** `settings_language.html:41` `.map-card`; `:42-48` `.form`; `:49` `.preview`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pengguna melihat ringkasan cepat, **then** IDR, WIB, dan ID tampil.
- **Given** halaman dimuat, **when** pengguna melihat panel pratinjau, **then** tiga contoh dampak tampil beserta labelnya.
- **Given** pengguna mengganti mata uang ke USD *(produksi)*, **when** pratinjau diperbarui, **then** contoh harga top-up berubah ke dolar.

---

### FR-SET-02 — Pusat kendali keamanan · P0

**Deskripsi.** Dasbor keamanan dengan skor risiko, empat kartu status perlindungan, dan blok tindakan berisiko tinggi.

**User story.** Sebagai pengguna, saya ingin tahu seberapa aman akun saya dan apa langkah berikutnya untuk memperkuatnya.

**Aturan bisnis.**
- **Skor perlindungan** ditampilkan sebagai cincin angka (prototype: **64**), disertai penjelasan `"Level perlindungan sedang"` dan **dua saran konkret**: aktifkan verifikasi 2 langkah dan tinjau sesi lama.
- **Empat kartu perlindungan:**

  | Kartu | Keterangan | Aksi |
  |---|---|---|
  | Kata sandi | Terakhir diubah 9 bulan lalu | **Ubah** → `forgot_password.html` |
  | Verifikasi 2 langkah | **Diperlukan untuk pencairan dan perubahan dompet** | **Aktifkan** |
  | Peringatan masuk | Peringatan email dan push aktif | status **Aktif** |
  | Kontak pemulihan | Email terverifikasi, nomor HP menunggu tinjauan | **Cek** |

- Verifikasi 2 langkah menyatakan aturan produk: **wajib untuk pencairan dan perubahan dompet** — terhubung dengan [`prd_08_author_earnings.md`](prd_08_author_earnings.md).
- **Tindakan berisiko tinggi:** *Keluar dari semua perangkat* — menghapus seluruh sesi kecuali perangkat saat ini, ditandai gaya danger.
- Seluruh aksi memakai pola `data-note` yang menulis pesan ke satu area pemberitahuan.
- Teks awal area pemberitahuan: `"Pilih tindakan keamanan untuk melihat pratinjau langkah berikutnya."`

**Hook implementasi.** `settings_security.html:46` `.dashboard`, `.risk`, `.ring`; `:47-52` `.tiles`; `:54` tindakan berisiko; `:58` listener `[data-note]`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pengguna melihat dasbor, **then** skor perlindungan dan saran penguatan tampil.
- **Given** pengguna menekan "Ubah" pada kartu kata sandi, **when** aksi dijalankan, **then** `forgot_password.html` terbuka.
- **Given** pengguna menekan "Aktifkan" pada verifikasi 2 langkah, **when** aksi dijalankan, **then** pesan pratinjau pengaturan autentikator tampil.
- **Given** pengguna membaca kartu verifikasi 2 langkah, **when** kartu dirender, **then** tertera bahwa fitur ini diperlukan untuk pencairan.

---

### FR-SET-03 — Kelola sesi aktif · P0

**Deskripsi.** Daftar perangkat yang sedang masuk beserta lokasi dan waktu, dengan aksi yang berbeda untuk sesi saat ini dan sesi lain.

**User story.** Sebagai pengguna, saya ingin melihat perangkat mana saja yang masuk ke akun saya dan mencabut yang tidak saya kenali.

**Aturan bisnis.**
- Setiap sesi menampilkan **jenis perangkat, lokasi, dan waktu terakhir aktif**: Windows Chrome (Jakarta, sesi saat ini) · iPhone Safari (Bandung, 3 hari lalu) · Aplikasi Android (Surabaya, 12 hari lalu).
- **Sesi saat ini tidak dapat dicabut dari halaman ini** — tombolnya berbunyi "Saat ini" dan pesannya menyatakan larangan tersebut secara eksplisit.
- Sesi lain dapat **Cabut** atau **Tinjau**.
- Untuk mengakhiri sesi saat ini, pengguna memakai *Keluar dari semua perangkat* atau menu Keluar di profil.

**Hook implementasi.** `settings_security.html:53` `.session`, `.device`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pengguna melihat daftar sesi, **then** setiap sesi menampilkan perangkat, lokasi, dan waktu.
- **Given** pengguna menekan tombol pada sesi saat ini, **when** aksi dijalankan, **then** pesan menyatakan sesi saat ini tidak dapat dicabut di sini.
- **Given** pengguna menekan "Cabut" pada sesi iPhone, **when** aksi dijalankan, **then** pesan konfirmasi pencabutan tampil.

---

## E. Bantuan & Legal

### FR-HELP-01 — Pencarian & kategori bantuan · P1

**Deskripsi.** Kolom pencarian artikel, empat kategori bantuan, dan daftar FAQ yang dapat dibuka-tutup.

**User story.** Sebagai pengguna yang mengalami masalah, saya ingin menemukan jawabannya sendiri secepat mungkin sebelum menghubungi dukungan.

**Aturan bisnis.**
- Pencarian menampilkan `"Searching for: <kueri>"`; kueri kosong diganti `"all topics"`.
- **Empat kategori bantuan:**

  | Kategori | Cakupan | Tujuan |
  |---|---|---|
  | Story print | PDF, hardcopy, verifikasi admin | `../../alt/story_print_manager.html` *(keluar folder)* |
  | Payments | Top up, refund, riwayat koin | `../../alt/transaction_history.html` *(keluar folder)* |
  | Security | Kata sandi, perangkat, peringatan masuk | `settings_security.html` |
  | Author tools | Penerbitan, pencairan, insight | `author_analytics.html` |

- **Tiga FAQ** memakai elemen `<details>` bawaan peramban; yang pertama terbuka secara default:
  - Cara melacak cetak hardcopy → menunjuk *Profile > Cetak story* dengan empat tahap status.
  - Mengapa PDF belum siap → cerita besar butuh waktu lebih lama.
  - Cara menyembunyikan aktivitas → menunjuk pengaturan visibilitas profil (FR-PROF-04).
- Jawaban FAQ **merujuk halaman lain secara spesifik**, bukan penjelasan umum.

**Hook implementasi.** `help_center.html:43` `.hero .search`; `:45-50` `.grid`; `:51` `.faq details`; `:58` `#searchBtn`.

**Acceptance criteria.**
- **Given** pengguna mengetik "refund" lalu menekan Search, **when** aksi dijalankan, **then** pesan memuat kata kunci tersebut.
- **Given** kolom pencarian kosong, **when** pengguna menekan Search, **then** pesan memakai "all topics".
- **Given** halaman dimuat, **when** pengguna melihat FAQ, **then** pertanyaan pertama sudah terbuka.
- **Given** pengguna menekan kategori "Security", **when** aksi dijalankan, **then** `settings_security.html` terbuka.

---

### FR-HELP-02 — Tiket dukungan & kontak · P1

**Deskripsi.** Kartu tiket dukungan yang sedang berjalan beserta statusnya, dan dua saluran kontak langsung.

**User story.** Sebagai pengguna yang sudah melapor, saya ingin melihat status laporan saya dan bisa menghubungi dukungan bila perlu.

**Aturan bisnis.**
- **Kartu tiket** menampilkan nomor tiket (`#NV-2041`), ringkasan masalah, dan status (`Open`).
- Ringkasan bersifat konkret dan menyatakan **apa yang sedang ditunggu** (mis. bukti pembayaran untuk permintaan hardcopy) — bukan sekadar "sedang diproses".
- **Dua saluran kontak:** **Live chat** (`"Live chat queue opened in prototype."`) dan **Send feedback** (`"Feedback form opened in prototype."`).
- Teks awal area pemberitahuan: `"Search help articles or open a support channel."`
- Prototype hanya menampilkan **satu** tiket; tidak ada daftar tiket atau riwayat.

**Hook implementasi.** `help_center.html:44` `.ticket`; `:52` `.contact`; `:59` listener `[data-note]`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pengguna melihat kartu tiket, **then** nomor tiket, ringkasan, dan status tampil.
- **Given** pengguna menekan "Live chat", **when** aksi dijalankan, **then** pesan antrean live chat tampil.
- **Given** pengguna menekan "Send feedback", **when** aksi dijalankan, **then** pesan formulir masukan tampil.

---

### FR-HELP-03 — Dokumen legal · P0

**Deskripsi.** Dua halaman dokumen hukum: syarat & ketentuan berdaftar isi, dan kebijakan privasi yang memetakan data yang dikumpulkan.

**User story.** Sebagai pengguna, saya ingin memahami aturan layanan dan data apa yang disimpan tentang saya, dalam bahasa yang bisa saya baca.

**Aturan bisnis.**

**`terms.html` — Syarat & Ketentuan**
- Diawali **daftar isi lima butir**: Tanggung jawab akun · Koin dan konten premium · Penerbitan kreator · Keamanan komunitas · Pengembalian dana dan perselisihan.
- Empat bagian isi tersedia; **butir kelima (pengembalian dana dan perselisihan) tercantum di daftar isi tetapi tidak punya bagian isi** (lihat §7).
- Pernyataan penting: **koin adalah saldo digital** untuk membuka fitur berbayar, bab, bundle, dan hadiah — dasar hukum ekonomi koin di [`prd_00_overview.md`](prd_00_overview.md) §6.
- Penulis wajib mengirim konten orisinal dan tunduk pada ketentuan tinjauan, pencairan, hak cipta, dan moderasi.
- Komentar, ulasan, dan profil publik dapat dimoderasi bila melanggar standar keamanan.

**`privacy.html` — Kebijakan Privasi**
- **Peta data empat kategori:**

  | Kategori | Isi |
  |---|---|
  | Data identitas | Nama, username, avatar, email, nomor HP, penyedia masuk |
  | Aktivitas membaca | Simpanan perpustakaan, progres membaca, penanda, ulasan, komentar, streak |
  | Catatan dompet | Riwayat top-up, saldo koin, riwayat unlock, hadiah, pengembalian dana, kuitansi |
  | Alat penulis | Draf cerita, analitik, identitas pencairan, permintaan cetak, status tinjauan |

- **Lima kontrol pengguna dinyatakan eksplisit:** mengatur visibilitas · menghapus riwayat membaca · meninjau catatan transaksi · **mengekspor data** · **mengajukan penghapusan akun**.
- Empat kategori data ini selaras dengan empat kategori visibilitas pada FR-PROF-04.
- **Navigasi cacat:** tombol kembali `privacy.html` menuju `terms.html`, sedangkan tombol kembali `terms.html` menuju `#` (tidak ke mana-mana) — lihat §7.
- Kedua halaman **tidak memiliki JavaScript**.

**Hook implementasi.** `terms.html:32-37` — `.doc-head`, `.toc`, `.section`; `privacy.html:34-41` — `.hero`, `.data-map`, `.rights`.

**Acceptance criteria.**
- **Given** pengguna membuka `terms.html`, **when** halaman dirender, **then** daftar isi lima butir tampil di atas isi dokumen.
- **Given** pengguna membuka `privacy.html`, **when** halaman dirender, **then** empat kategori data yang dikumpulkan tampil.
- **Given** pengguna membaca bagian kontrol pengguna, **when** bagian dirender, **then** hak mengekspor data dan menghapus akun tercantum.
- **Given** pengguna tiba dari halaman pendaftaran, **when** menekan tombol kembali di `terms.html`, **then** *(perilaku yang diinginkan)* pengguna kembali ke halaman asalnya.

---

## F. Penutup Alur (FR baru)

### FR-PROF-09 — Daftar pengikut & mengikuti · P1

**Status: BARU.** Saat ini statistik **Pengikut (1.2K)** dan **Mengikuti (345)** di `profile.html:756-757` keduanya menuju `other_user_profile.html` — halaman profil **satu orang**, bukan daftar pengguna.

**Deskripsi.** Dua daftar pengguna yang dapat ditelusuri, dengan aksi ikuti/berhenti mengikuti langsung dari daftar.

**User story.** Sebagai pengguna, saya ingin melihat siapa saja yang mengikuti saya dan siapa yang saya ikuti, agar bisa menemukan pembaca dengan selera serupa.

**Aturan bisnis.**
- Satu halaman dengan **dua tab**: **Pengikut** dan **Mengikuti**; tab yang terbuka ditentukan statistik mana yang ditekan.
- Setiap baris memuat: avatar · nama · handle · lencana peran (Pembaca / Penulis) · tombol **Ikuti** / **Mengikuti**.
- Menekan baris membuka `other_user_profile.html` untuk pengguna tersebut.
- Tombol ikuti bekerja **langsung dari daftar** tanpa membuka profil, dengan pembaruan optimistis.
- Pencarian dalam daftar tersedia bila jumlahnya lebih dari 20; paginasi 20 per muat.
- Daftar pengikut menghormati visibilitas: pengguna yang menyembunyikan aktivitasnya tetap muncul sebagai pengikut, tetapi tanpa ringkasan aktivitas.
- Aksi Follow di `other_user_profile` (FR-PROF-08) menjadi sumber isi daftar ini.
- Pengikut baru memicu notifikasi (lihat [`prd_11_search_notifications.md`](prd_11_search_notifications.md) FR-NOTIF-02).

**Acceptance criteria.**
- **Given** pengguna menekan statistik "Pengikut", **when** halaman terbuka, **then** tab Pengikut aktif dan daftarnya tampil.
- **Given** pengguna menekan statistik "Mengikuti", **when** halaman terbuka, **then** tab Mengikuti yang aktif.
- **Given** pengguna menekan "Ikuti" pada sebuah baris, **when** aksi dijalankan, **then** tombol berubah menjadi "Mengikuti" tanpa meninggalkan daftar.
- **Given** pengguna menekan sebuah baris, **when** aksi dijalankan, **then** profil publik pengguna itu terbuka.
- **Given** daftar berisi lebih dari 20 pengguna, **when** halaman dirender, **then** kolom pencarian tersedia dan daftar dimuat bertahap.

---

### FR-PROF-10 — Visibilitas publik tersimpan & benar-benar berlaku · P0

**Status: BARU.** Saat ini pengaturan visibilitas hilang setiap halaman dimuat ulang, dan tidak ada yang benar-benar membacanya — ini pengaturan privasi, bukan preferensi tampilan.

**Deskripsi.** Empat sakelar visibilitas disimpan di akun dan benar-benar menentukan apa yang dilihat pengunjung profil.

**User story.** Sebagai pengguna, saya ingin pengaturan privasi saya bertahan dan benar-benar berlaku, agar saya bisa mempercayainya.

**Aturan bisnis.**
- **Disimpan di server, bukan di perangkat** — pengaturan privasi harus berlaku sama di semua perangkat dan tidak boleh hilang karena data peramban dibersihkan.
- **Setiap sakelar mengendalikan bagian tertentu di `other_user_profile`:**

  | Sakelar | Mengendalikan |
  |---|---|
  | Aktivitas membaca | Tab **Activity** dan seluruh isinya |
  | Perpustakaan dan cerita tersimpan | Tab **Books** (rak publik) |
  | Ulasan dan reaksi | Entri ulasan di tab Activity + ulasan yang ditampilkan di profil (lihat [`prd_12_social.md`](prd_12_social.md) FR-SOCIAL-08) |
  | Data dompet | **Selalu tersembunyi** di profil orang lain, apa pun nilai sakelarnya |

- **Data dompet adalah aturan platform, bukan preferensi.** `other_user_profile` sudah menyatakan: *"Coins, transaction history, and payout data are never shown on other user profiles."* Sakelar dompet hanya mengatur ringkasan agregat pada profil sendiri, tidak pernah membuka data transaksi ke publik.
- Bagian yang disembunyikan **tidak ditampilkan sebagai tab kosong** — tabnya ikut hilang dari `other_user_profile`.
- Tab **Visibility** di `other_user_profile` menampilkan keadaan nyata dari sakelar pemilik profil, bukan teks statis.
- Perubahan berlaku seketika bagi pengunjung berikutnya; pengunjung yang sedang membuka halaman melihatnya pada pemuatan berikutnya.
- Menyalakan sakelar dompet menampilkan konfirmasi karena datanya ditandai sensitif.

**Acceptance criteria.**
- **Given** pengguna mematikan "Aktivitas membaca", **when** halaman dimuat ulang, **then** sakelar tetap mati.
- **Given** pengguna mematikan "Aktivitas membaca", **when** orang lain membuka profil publiknya, **then** tab Activity tidak tampil sama sekali.
- **Given** pengguna menyalakan seluruh sakelar termasuk dompet, **when** orang lain membuka profilnya, **then** data transaksi tetap tidak tampil.
- **Given** pengguna mengubah visibilitas di satu perangkat, **when** membuka aplikasi di perangkat lain, **then** pengaturan yang sama berlaku.
- **Given** pengguna menyalakan sakelar data dompet, **when** aksi dijalankan, **then** konfirmasi tampil sebelum diterapkan.

---

### FR-SET-04 — Bahasa & wilayah benar-benar diterapkan · P1

**Status: BARU.** `settings_language.html` tidak memiliki JavaScript sama sekali — kelima pilihannya tidak berpengaruh dan tidak tersimpan, padahal halaman itu sendiri menyatakan pengaturan ini memengaruhi rekomendasi, harga, jadwal penulis, dan tampilan dompet.

**Deskripsi.** Kelima pengaturan lokalisasi disimpan dan benar-benar mengubah perilaku aplikasi sesuai janji pada panel pratinjaunya.

**User story.** Sebagai pengguna, saya ingin memilih bahasa dan wilayah lalu melihat aplikasi benar-benar berubah, bukan hanya melihat contoh di panel pratinjau.

**Aturan bisnis.**
- **Dampak nyata tiap pengaturan:**

  | Pengaturan | Dampak |
  |---|---|
  | Bahasa aplikasi | Seluruh teks antarmuka; menyelesaikan tiga halaman berbahasa Inggris (`edit_profile`, `other_user_profile`, `help_center`) |
  | Prioritas terjemahan cerita | Versi bahasa mana yang ditampilkan lebih dulu pada bab dwibahasa (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-19) |
  | Wilayah konten | Cerita mana yang muncul di beranda dan hasil pencarian |
  | Mata uang & pembayaran | Format harga di seluruh modul dompet dan metode pembayaran yang ditawarkan |
  | Zona waktu | Jadwal terbit, jam tenang notifikasi, dan tanggal klaim harian |

- Disimpan **di server** agar berlaku lintas perangkat.
- **Panel pratinjau diperbarui langsung** saat pilihan berubah — panel yang sudah ada berubah dari ilustrasi statis menjadi umpan balik nyata.
- Perubahan bahasa berlaku seketika tanpa perlu memuat ulang halaman.
- Zona waktu menjadi acuan tunggal untuk seluruh perhitungan tanggal pengguna: klaim check-in (lihat [`prd_09_wallet_rewards.md`](prd_09_wallet_rewards.md) FR-RWD-07), kuota iklan harian (lihat [`prd_05_reader.md`](prd_05_reader.md) FR-READ-18), dan jam tenang push (lihat [`prd_11_search_notifications.md`](prd_11_search_notifications.md) FR-NOTIF-05).

**Acceptance criteria.**
- **Given** pengguna memilih "English (US)", **when** pilihan diterapkan, **then** teks antarmuka berubah tanpa memuat ulang halaman.
- **Given** pengguna mengganti mata uang ke USD, **when** panel pratinjau diperbarui, **then** contoh harga top-up ditampilkan dalam dolar.
- **Given** pengguna mengganti zona waktu, **when** membuka jadwal terbit, **then** waktu ditampilkan menurut zona waktu baru.
- **Given** pengguna mengubah pengaturan lalu membuka aplikasi di perangkat lain, **when** halaman dimuat, **then** pengaturan yang sama berlaku.
- **Given** pengguna memilih prioritas "Konten terjemahan lebih dulu", **when** membuka bab dwibahasa, **then** versi terjemahan yang ditampilkan lebih dulu.

---

### FR-SET-05 — Ekspor data & penghapusan akun · P0

**Status: BARU.** `privacy.html` menjanjikan lima kontrol pengguna — termasuk **mengekspor data** dan **mengajukan penghapusan akun** — tetapi tidak satu pun tersedia di antarmuka mana pun.

**Deskripsi.** Kedua hak yang dijanjikan kebijakan privasi diberi alurnya di halaman keamanan.

**User story.** Sebagai pengguna, saya ingin mengambil salinan data saya dan menghapus akun saya, seperti yang dijanjikan kebijakan privasi.

**Aturan bisnis.**
- **Ekspor data** mencakup empat kategori yang disebut `privacy.html`: data identitas · aktivitas membaca · catatan dompet · alat penulis.
  - Diproses asinkron; pengguna diberi tahu saat berkas siap (lihat [`prd_11_search_notifications.md`](prd_11_search_notifications.md) FR-NOTIF-02).
  - Tautan unduh berlaku terbatas dan hanya untuk pemilik akun.
- **Penghapusan akun** memakai pengaman terkuat, mengikuti pola konfirmasi hapus permanen pada `edit_story` (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-18): pengguna mengetik ulang nama akunnya.
  - **Masa tenggang 30 hari** — akun dinonaktifkan lebih dulu dan dapat dipulihkan dengan masuk kembali.
  - **Peringatan konsekuensi wajib ditampilkan sebelum konfirmasi:** saldo koin hangus · karya yang sudah terbit dan pembacanya · penghasilan yang belum dicairkan · ulasan dan komentar yang sudah ditulis.
  - Penghapusan **ditahan** bila masih ada penarikan yang sedang diproses atau pesanan cetak berjalan, disertai penjelasan.
- Ketiga kontrol lain yang dijanjikan `privacy.html` sudah punya rumah: mengatur visibilitas (FR-PROF-10) · menghapus riwayat membaca (ditambahkan ke halaman keamanan) · meninjau catatan transaksi (`transaction_history`).
- Menghapus riwayat membaca mengosongkan progres baca dan section "Continue Reading", tetapi **tidak** mengeluarkan cerita dari perpustakaan.

**Acceptance criteria.**
- **Given** pengguna meminta ekspor data, **when** permintaan diterima, **then** konfirmasi tampil dan notifikasi dikirim saat berkas siap.
- **Given** pengguna membuka alur penghapusan akun, **when** halaman dirender, **then** seluruh konsekuensi tampil sebelum tombol konfirmasi.
- **Given** pengguna mengetik nama akun yang salah, **when** menekan konfirmasi, **then** penghapusan dibatalkan.
- **Given** pengguna punya penarikan yang sedang diproses, **when** mengajukan penghapusan, **then** permintaan ditahan disertai penjelasan.
- **Given** akun dihapus lalu pengguna masuk dalam 30 hari, **when** masuk berhasil, **then** akun dipulihkan.
- **Given** pengguna menghapus riwayat membaca, **when** membuka perpustakaan, **then** cerita tetap tersimpan tetapi progresnya kosong.

---

## 5. State & Persistensi

**Tidak ada `localStorage` di seluruh modul.**

| State | Tempat | Konsekuensi saat dimuat ulang |
|---|---|---|
| Sakelar visibilitas publik | Kelas `on` | **Kembali ke keadaan awal HTML** |
| Tab aktif (`edit_profile`, `other_user_profile`) | Kelas `active` / atribut `hidden` | Kembali ke tab pertama |
| Isi formulir `edit_profile` | Nilai input | Kembali ke nilai awal |
| Pilihan `settings_language` | Nilai `select` | Kembali ke pilihan pertama |
| Pesan status | Teks elemen | Kembali ke teks awal |

---

## 6. Navigasi

**Masuk ke modul:** tab "Profile" dari halaman ber-navigasi bawah · `register.html` → `terms.html` / `privacy.html` · `login.html` (setelah keluar) · `topup_detail.html`, `transaction_history.html`, `story_print_history.html` → `help_center.html`.

**Internal:** `profile` → `edit_profile` · `other_user_profile` · `settings_security` · `settings_language` · `help_center` · `story_print_history` · `login` · `my_library` · `topup_koin` · `transaction_history`; `settings_security` → `forgot_password`; `privacy` → `terms`.

**Keluar dari modul:** `home_tabs.html` · `my_library.html` · `my_stories.html` · `topup_koin.html` · `transaction_history.html` · `story_print_history.html` · `author_analytics.html` · `detail_story_alternatif_unified_cover_first.html` · `login.html` · `forgot_password.html` · `../../alt/*` *(keluar folder)*.

---

## 7. Catatan Prototype vs Produksi

| # | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | **Pengaturan visibilitas publik tidak tersimpan** | Pengaturan privasi hilang setiap kali halaman dimuat ulang | Simpan ke server (`../../docs/api_profile.md`); ini pengaturan privasi, bukan preferensi tampilan |
| 2 | **`settings_language.html` tanpa JavaScript** — pilihan tidak berpengaruh dan tidak tersimpan | Halaman pengaturan bahasa tidak berfungsi sama sekali | Terapkan pilihan ke i18n aplikasi dan simpan ke akun |
| 3 | **`edit_profile` tanpa validasi** — nama kosong menghasilkan "Unnamed reader" | Data profil bisa kosong atau tidak valid | Wajibkan nama tampilan; validasi keunikan username |
| 4 | **Keluar tanpa konfirmasi** | Satu ketukan salah mengakhiri sesi | Tambahkan konfirmasi, terutama bila ada draf belum tersimpan |
| 5 | **Tombol kembali `terms.html` menuju `#`** | Pengguna terjebak di halaman syarat | Gunakan `history.back()` dengan tujuan cadangan |
| 6 | **`privacy.html` kembali ke `terms.html`**, bukan ke halaman asal | Pengguna dari pendaftaran mendarat di tempat salah | Sama seperti di atas |
| 7 | **Daftar isi `terms.html` menyebut lima butir, isinya hanya empat** — "Pengembalian dana dan perselisihan" tidak ada | Dokumen hukum tidak lengkap | Lengkapi bagian yang hilang |
| 8 | **Statistik Pengikut & Mengikuti menuju profil satu orang**, bukan daftar pengguna | Navigasi menyesatkan | Buat halaman daftar pengikut/mengikuti |
| 9 | **Tiga tautan keluar folder ke `../../alt/`** (`edit_profile` → author_withdraw; `help_center` → story_print_manager, transaction_history) padahal padanannya ada di folder ini | Keluar dari kumpulan halaman yang konsisten | Arahkan ke `author_withdraw.html`, `story_print_history.html`, dan `transaction_history.html` lokal |
| 10 | **Tiga halaman berbahasa Inggris** (`edit_profile`, `other_user_profile`, `help_center`) di aplikasi berbahasa Indonesia | Bahasa campur dalam satu modul | Terjemahkan ke Indonesia dan sambungkan ke `settings_language` |
| 11 | **`profile.html` memakai sub-sistem desain berbeda** dari tujuh halaman lainnya | Transisi visual terasa melompat | Konsolidasi token (lihat `prd_01_design_system.md` §9.2) |
| 12 | **Pencarian bantuan, live chat, dan formulir masukan hanya pesan** | Tidak ada saluran dukungan nyata | Sambungkan ke sistem tiket dan pencarian artikel |
| 13 | **Hanya satu tiket dukungan ditampilkan**, tanpa daftar atau riwayat | Pengguna dengan banyak laporan tidak terlayani | Tambahkan daftar tiket beserta riwayat percakapan |
| 14 | **Aksi keamanan (cabut sesi, aktifkan 2FA, keluar semua perangkat) hanya pesan** | Kontrol keamanan tidak nyata | Implementasikan pengelolaan sesi di server |
| 15 | **Skor keamanan hardcoded 64** tanpa perhitungan | Angka bisa menyesatkan | Hitung dari faktor nyata (2FA, umur kata sandi, sesi lama, kontak pemulihan) |
| 16 | **Hak "ekspor data" dan "penghapusan akun" dinyatakan di kebijakan privasi tetapi tidak ada di UI mana pun** | Janji kebijakan tidak dapat ditepati | Sediakan alurnya di `settings_security` atau `edit_profile` |
| 17 | Seluruh data profil, aktivitas, dan sesi hardcoded | Tidak mencerminkan data nyata | Sambungkan ke `../../docs/api_profile.md` dan `../../docs/api_settings.md` |
