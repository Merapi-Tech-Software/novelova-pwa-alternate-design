# PRD Novelova — Modul Sosial (Rating, Ulasan & Komentar)

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya **sama dengan v1**; yang berubah hanya kulitnya (putaran 7).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> **Status modul: BELUM ADA di prototype.** Seluruh dokumen ini adalah spesifikasi baru untuk menutup alur sosial yang terputus.
> Halaman baru yang perlu dibuat: `story_reviews.html` · `chapter_comments.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_story_detail.md`, `../../docs/api_chapter_read.md`

---

## 1. Ringkasan Modul

Rating, ulasan, dan komentar adalah **satu-satunya fitur di Novelova yang dikonsumsi di enam tempat tetapi tidak diproduksi di satu tempat pun**.

**Yang sudah menampilkan datanya:**

| Tempat | Data yang ditampilkan |
|---|---|
| Kartu cerita di beranda, see_all, library, my_stories | Rating (4.8, 4.9, …) |
| `detail_story_…` statbar | *"12.4K Ratings"* |
| `see_all_*` & `story_analytics` | Urutan "Rating tertinggi" |
| `story_analytics` | Sentimen 234 komentar; jumlah komentar per bab |
| `profile` feed aktivitas | *"Menulis ulasan 5 bintang — ditandai slow burn, chemistry, plot twist"* |
| `other_user_profile` | *"Posted a review — Rated Paper Crown 5 stars"* |
| `privacy.html` | *"Ulasan dan reaksi"* sebagai kategori data yang disimpan |

**Yang belum ada satu pun:**

| Jalur | Kondisi sekarang |
|---|---|
| Tombol **Rate** di detail cerita | Tidak punya handler |
| Tautan **Review** di detail cerita | Menggantung → `detail_story_tabs.html#reviews-panel` (halaman tidak ada) |
| Tautan **komentar bab** di reader | Menggantung → `chapter_comments_thread_best_ads.html` (halaman tidak ada) |
| Misi **"Tulis satu ulasan"** di `rewards_center` | Tombol → `#` |
| Sakelar visibilitas **"Ulasan dan reaksi"** di `profile` | Mengatur data yang tidak pernah bisa dibuat |

Tiga jalur menggantung menuju satu fitur yang sama, ditambah satu misi yang tidak bisa diselesaikan.

| Aspek | Nilai |
|---|---|
| **Aktor** | Pembaca (menulis & membaca) · Penulis (menanggapi & memantau) |
| **Halaman baru** | `story_reviews.html`, `chapter_comments.html` |
| **Prasyarat** | Pengguna sudah masuk; untuk menulis ulasan, sudah membaca minimal satu bab |
| **State persisten** | Seluruhnya di server |
| **Sub-sistem desain** | Ikuti `detail_story_…` (backdrop krem, Cormorant + Manrope) agar transisi dari halaman detail mulus |

---

## 2. Flow

### 2.1 Memberi rating & menulis ulasan

1. Pembaca selesai membaca beberapa bab, lalu membuka detail cerita.
2. Menekan **Rate** → lembar penilaian bintang muncul.
3. Setelah memberi bintang, pembaca ditawari menulis ulasan (opsional) beserta tag.
4. Ulasan terkirim → tampil di halaman ulasan cerita, tercatat di feed aktivitas profil, dan menyelesaikan misi "Tulis satu ulasan" di `rewards_center`.

### 2.2 Membaca ulasan

Detail cerita → **Review** → `story_reviews.html`: ringkasan sebaran bintang, saring menurut bintang, urutkan (paling membantu / terbaru), baca ulasan beserta tanggapan penulis.

### 2.3 Komentar bab

Reader → baris reaksi → **komentar** → `chapter_comments.html`: utas komentar untuk bab tersebut, balasan bertingkat satu level, reaksi, dan penandaan komentar berspoiler.

### 2.4 Penulis menanggapi

Penulis menerima notifikasi ulasan/komentar baru (lihat [`prd_11_search_notifications.md`](prd_11_search_notifications.md) FR-NOTIF-02) → membuka utasnya → membalas dengan lencana **Penulis** → sentimen agregatnya masuk ke `story_analytics` (FR-STUDIO-30).

---

## 3. Daftar Requirement

| ID | Nama | Halaman | Prioritas |
|---|---|---|---|
| FR-SOCIAL-01 | Beri rating cerita | `detail_story_…` | P0 |
| FR-SOCIAL-02 | Tulis & sunting ulasan | `detail_story_…`, `story_reviews` | P0 |
| FR-SOCIAL-03 | Halaman ulasan cerita | `story_reviews` | P0 |
| FR-SOCIAL-04 | Reaksi & tanggapan penulis | `story_reviews` | P1 |
| FR-SOCIAL-05 | Komentar per bab | `chapter_comments` | P0 |
| FR-SOCIAL-06 | Penanda spoiler | `chapter_comments`, `story_reviews` | P1 |
| FR-SOCIAL-07 | Laporkan & moderasi | keduanya | P0 |
| FR-SOCIAL-08 | Integrasi dengan misi, profil & analitik | lintas modul | P1 |

---

## 4. Detail Requirement

### FR-SOCIAL-01 — Beri rating cerita · P0

**Status: BARU.** Tombol **Rate** sudah ada di `detail_story_alternatif_unified_cover_first.html:364`, tanpa handler.

**Deskripsi.** Lembar penilaian bintang yang muncul dari tombol Rate, dengan syarat kelayakan dan kemungkinan mengubah penilaian.

**User story.** Sebagai pembaca, saya ingin memberi nilai pada cerita yang saya baca agar pembaca lain terbantu memilih.

**Aturan bisnis.**
- Skala **1–5 bintang**, bilangan bulat. Setengah bintang tidak didukung — angka rata-rata boleh berdesimal (4.8), masukan tidak.
- **Syarat kelayakan:** pembaca harus sudah membaca **minimal satu bab** cerita tersebut. Bila belum, lembar penilaian menampilkan ajakan membaca dulu, bukan menolak diam-diam.
- Rating dapat **diubah kapan saja**; nilai terakhir yang berlaku, dan rata-rata cerita dihitung ulang.
- Rating dapat **dihapus** — mengembalikan pembaca ke keadaan belum menilai.
- Setelah memberi bintang, tampilkan ajakan opsional menulis ulasan (FR-SOCIAL-02) — memberi bintang saja **sudah sah** tanpa ulasan.
- Tombol Rate menampilkan keadaan: `Rate` bila belum menilai, atau bintang yang sudah diberikan bila sudah.
- Statbar `12.4K Ratings` dan rating pada seluruh kartu cerita bersumber dari sini.

**Acceptance criteria.**
- **Given** pembaca belum membaca bab apa pun, **when** menekan Rate, **then** ajakan membaca dulu tampil dan bintang tidak dapat dikirim.
- **Given** pembaca sudah membaca satu bab, **when** memilih 4 bintang, **then** rating tersimpan dan tombol Rate menampilkan 4 bintang.
- **Given** pembaca sudah menilai 4, **when** mengubahnya menjadi 5, **then** hanya satu rating tersimpan dan rata-rata cerita diperbarui.
- **Given** pembaca memberi bintang lalu menutup lembar tanpa menulis ulasan, **when** lembar tertutup, **then** rating tetap tersimpan.
- **Given** pembaca menghapus ratingnya, **when** aksi dijalankan, **then** tombol kembali berbunyi "Rate" dan jumlah rating cerita berkurang satu.

---

### FR-SOCIAL-02 — Tulis & sunting ulasan · P0

**Status: BARU.**

**Deskripsi.** Formulir ulasan berisi teks bebas dan tag deskriptif, terikat pada rating yang sudah diberikan.

**User story.** Sebagai pembaca, saya ingin menjelaskan kenapa saya suka atau tidak suka sebuah cerita agar penilaian saya berguna bagi orang lain.

**Aturan bisnis.**
- **Ulasan wajib disertai rating** — tidak bisa menulis ulasan tanpa memberi bintang lebih dulu.
- Panjang teks: **minimal 20 karakter**, maksimal **1000 karakter**, dengan penghitung karakter langsung — pola yang sama dengan sinopsis cerita (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-12).
- **Tag deskriptif** dipilih dari daftar yang disediakan, maksimal **3**. Contoh yang sudah muncul di prototype: `slow burn`, `chemistry`, `plot twist` (feed aktivitas `profile.html:789`).
- Satu pembaca hanya boleh punya **satu ulasan per cerita**; menulis lagi berarti menyunting yang lama.
- Ulasan dapat disunting dan dihapus oleh penulisnya; ulasan yang disunting diberi penanda **"disunting"**.
- Menghapus ulasan **tidak** menghapus ratingnya — keduanya terpisah.
- Draf ulasan yang belum terkirim disimpan lokal agar tidak hilang bila halaman tertutup, mengikuti pola penanda draf pada editor cerita.

**Acceptance criteria.**
- **Given** pembaca belum memberi rating, **when** membuka formulir ulasan, **then** pembaca diminta memberi bintang lebih dulu.
- **Given** pembaca mengetik 15 karakter, **when** menekan kirim, **then** ulasan ditolak dengan pesan minimal 20 karakter.
- **Given** pembaca memilih 3 tag, **when** mencoba memilih tag keempat, **then** pilihan diabaikan.
- **Given** pembaca sudah punya ulasan, **when** membuka formulir lagi, **then** isi ulasan sebelumnya termuat untuk disunting.
- **Given** pembaca menyunting ulasannya, **when** ulasan dirender, **then** penanda "disunting" tampil.
- **Given** pembaca menghapus ulasannya, **when** halaman dirender, **then** ratingnya tetap ada.

---

### FR-SOCIAL-03 — Halaman ulasan cerita · P0

**Status: BARU.** Menggantikan tautan menggantung `detail_story_tabs.html#reviews-panel`.

**Deskripsi.** Halaman berisi seluruh ulasan sebuah cerita, diawali ringkasan sebaran bintang, dengan penyaringan dan pengurutan.

**User story.** Sebagai pembaca yang sedang mempertimbangkan sebuah cerita, saya ingin membaca pendapat pembaca lain dan melihat apakah nilainya merata atau terbelah.

**Aturan bisnis.**
- **Ringkasan di atas:** rata-rata rating (mis. 4.8), jumlah total penilai, dan **grafik sebaran per bintang** (5★ sampai 1★ dengan batang proporsional) — sebaran lebih informatif daripada satu angka rata-rata.
- **Tag terpopuler** ditampilkan sebagai pil dengan jumlah pemakaian; menekannya menyaring ulasan bertag itu.
- **Saringan:** semua · per bintang (1–5) · hanya yang ada teksnya.
- **Urutan:** Paling membantu *(default)* · Terbaru · Rating tertinggi · Rating terendah.
- Setiap kartu ulasan memuat: avatar & nama penulis ulasan · bintang · tanggal · tag · teks · jumlah "membantu" · tanggapan penulis bila ada.
- Ulasan pengguna sendiri **selalu ditampilkan paling atas** dengan tombol sunting dan hapus.
- Paginasi 20 per muat.
- Tautan **Review** di detail cerita diarahkan ke halaman ini, menggantikan `detail_story_tabs.html#reviews-panel`.
- Keadaan kosong: ajakan menjadi pengulas pertama.

**Acceptance criteria.**
- **Given** pembaca menekan Review di detail cerita, **when** halaman terbuka, **then** rata-rata rating dan sebaran per bintang tampil.
- **Given** pembaca menyaring ke 1 bintang, **when** daftar diperbarui, **then** hanya ulasan berbintang satu tampil.
- **Given** pembaca sudah menulis ulasan, **when** halaman dirender, **then** ulasannya tampil paling atas dengan tombol sunting.
- **Given** pembaca menekan sebuah tag populer, **when** daftar diperbarui, **then** hanya ulasan bertag itu tampil.
- **Given** cerita belum punya ulasan, **when** halaman dirender, **then** ajakan menjadi pengulas pertama tampil.

---

### FR-SOCIAL-04 — Reaksi & tanggapan penulis · P1

**Status: BARU.**

**Deskripsi.** Pembaca dapat menandai ulasan sebagai membantu, dan penulis cerita dapat membalas ulasan dengan identitas yang jelas.

**User story.** Sebagai pembaca, saya ingin ulasan yang benar-benar berguna naik ke atas. Sebagai penulis, saya ingin menanggapi pembaca saya.

**Aturan bisnis.**
- Tombol **"Membantu"** dengan penghitung; satu pengguna satu kali per ulasan, dapat dibatalkan.
- Urutan "Paling membantu" memakai jumlah ini.
- Pengguna **tidak dapat** menandai ulasannya sendiri sebagai membantu.
- **Tanggapan penulis** ditampilkan menjorok di bawah ulasan dengan garis emas di tepinya dan lencana **Penulis** berupa pil garis rambut kecil — pembaca harus bisa membedakannya sekilas dari balasan biasa.

> **Revisi 5 September 2026 · lencana penulis turun tingkat.** Versi lama menulis
> lencana "memakai warna aksen", dan implementasinya pil terisi tinta. Di halaman
> yang isinya ulasan pembaca, lencana terisi berteriak lebih keras daripada
> ulasan yang ia tanggapi. Sejak R9c ia pil **garis rambut** berteks emas, dan
> yang menandai tanggapan itu milik penulis adalah **garis emas di tepi
> kiri** — bukan bidang berwarna. Pembedaannya tetap sekilas.
- Satu ulasan hanya boleh punya **satu tanggapan penulis**; menulis lagi berarti menyunting.
- Hanya pemilik cerita yang dapat menanggapi.
- Penulis ulasan menerima notifikasi saat ulasannya ditanggapi (lihat [`prd_11_search_notifications.md`](prd_11_search_notifications.md) FR-NOTIF-02).

**Acceptance criteria.**
- **Given** pembaca menekan "Membantu" pada sebuah ulasan, **when** aksi dijalankan, **then** penghitung bertambah satu dan tombol menjadi keadaan aktif.
- **Given** pembaca sudah menandai membantu, **when** menekannya lagi, **then** tanda dibatalkan dan penghitung berkurang.
- **Given** pembaca melihat ulasannya sendiri, **when** kartu dirender, **then** tombol "Membantu" tidak tersedia.
- **Given** penulis cerita membalas sebuah ulasan, **when** ulasan dirender, **then** balasan tampil dengan lencana Penulis.
- **Given** pengguna biasa membuka ulasan, **when** kartu dirender, **then** tombol tanggapan penulis tidak tersedia.

---

### FR-SOCIAL-05 — Komentar per bab · P0

**Status: BARU.** Menggantikan tautan menggantung `chapter_comments_thread_best_ads.html`.

**Deskripsi.** Utas diskusi untuk satu bab, dibuka dari baris reaksi di reader.

**User story.** Sebagai pembaca, saya ingin membahas bab yang baru saya baca dengan pembaca lain, di tempat yang khusus untuk bab itu.

**Aturan bisnis.**
- Komentar **terikat pada satu bab**, bukan pada cerita — konsisten dengan `story_analytics` yang menghitung komentar per bab (mis. *"234 komentar"* pada Chapter 8).
- **Syarat menulis:** pembaca harus sudah membuka bab tersebut. Bab terkunci berarti komentarnya belum bisa dibaca maupun ditulis — mencegah bocornya isi cerita ke pembaca yang belum membeli.
- Panjang komentar maksimal **500 karakter**.
- **Balasan bertingkat satu level saja** — balasan atas balasan digabung ke utas yang sama agar tidak menjadi pohon dalam yang sulit dibaca di layar ponsel. **Ditegakkan server**, bukan hanya oleh layar: membalas sebuah balasan **mendarat di utas yang sama**, bukan ditolak.
- **Bab terkunci menolak membaca *dan* menulis komentarnya**, beserta jalan keluarnya. Komentar bab penuh berisi isi babnya, jadi membukanya untuk yang belum membeli sama dengan membocorkan cerita lewat pintu samping.
- **Urutan punya pemecah seri yang stabil** — tanpa itu, dua komentar berwaktu sama bertukar posisi tiap kali halaman dimuat.
- Komentar yang **sedang ditinjau tetap menempati barisnya**, isinya diganti keterangan — bukan hilang, karena baris yang lenyap terbaca sebagai komentar yang dihapus diam-diam.

> **Revisi 5 September 2026.** Empat butir di atas sebelumnya hanya hidup di
> `architecture.md` §1.17. Ditarik ke sini karena keempatnya **aturan produk**,
> bukan detail implementasi: yang pertama menentukan bentuk utasnya, yang kedua
> menutup kebocoran isi berbayar, dan dua terakhir menentukan apa yang pembaca
> lihat saat data bergerak.
- **Urutan:** Terbaru *(default)* · Paling disukai · Terlama.
- Reaksi suka per komentar dengan penghitung.
- Komentar penulis cerita diberi lencana **Penulis**, sama seperti FR-SOCIAL-04.
- Baris reaksi di reader (`chapter_read_locked_story_stage.html:765`) diarahkan ke halaman ini dengan `chapter_id`, dan menampilkan **jumlah komentar** bab tersebut.
- Paginasi 20 per muat.

**Acceptance criteria.**
- **Given** pembaca membuka bab yang sudah terbuka, **when** menekan tautan komentar, **then** utas komentar bab itu terbuka.
- **Given** bab masih terkunci, **when** pembaca mencoba membuka komentarnya, **then** akses ditolak dengan penjelasan bahwa bab harus dibuka dulu.
- **Given** pembaca membalas sebuah komentar, **when** balasan terkirim, **then** balasan tampil menjorok di bawah komentar induknya.
- **Given** pembaca membalas sebuah balasan, **when** balasan terkirim, **then** balasan tetap berada pada tingkat yang sama, tidak menjorok lebih dalam.
- **Given** penulis cerita berkomentar, **when** komentar dirender, **then** lencana Penulis tampil.
- **Given** reader dirender, **when** pembaca melihat baris reaksi, **then** jumlah komentar bab tersebut tampil.

---

### FR-SOCIAL-06 — Penanda spoiler · P1

**Status: BARU.**

**Deskripsi.** Penulis komentar atau ulasan dapat menandai tulisannya berisi bocoran, sehingga isinya disembunyikan sampai pembaca lain memilih membukanya.

**User story.** Sebagai pembaca yang belum selesai membaca, saya ingin terlindung dari bocoran di kolom komentar.

**Aturan bisnis.**
- Sakelar **"Mengandung spoiler"** tersedia saat menulis ulasan maupun komentar.
- Konten bertanda spoiler ditampilkan **buram dengan label "Spoiler — ketuk untuk melihat"**; membuka satu tidak membuka yang lain.
- Pola visual mengikuti pratinjau tersensor pada gerbang bab terkunci (lihat [`prd_05_reader.md`](prd_05_reader.md) FR-READ-06) agar bahasa visualnya konsisten.
- Konten spoiler yang belum dibuka diberi `aria-hidden` sehingga pembaca layar tidak membacakannya — sama seperti pratinjau tersensor.
- Tag ulasan `plot twist` **tidak otomatis** menandai spoiler; penandaan selalu eksplisit oleh penulisnya.

**Acceptance criteria.**
- **Given** sebuah komentar ditandai spoiler, **when** utas dirender, **then** isinya buram dengan label spoiler.
- **Given** pembaca membuka satu komentar spoiler, **when** komentar lain dirender, **then** komentar spoiler lainnya tetap tertutup.
- **Given** komentar spoiler belum dibuka, **when** pembaca layar membaca halaman, **then** isinya tidak dibacakan.

---

### FR-SOCIAL-07 — Laporkan & moderasi · P0

**Status: BARU.** Menghubungkan tombol **Report** di detail cerita (`detail_story_…:376`) yang belum punya handler dengan kebijakan moderasi di `terms.html`.

**Deskripsi.** Pengguna dapat melaporkan ulasan, komentar, atau cerita; laporan masuk ke antrean tinjauan admin.

**User story.** Sebagai pengguna, saya ingin melaporkan konten yang melanggar agar komunitas tetap aman.

**Aturan bisnis.**
- `terms.html` sudah menyatakan: *"Komentar, ulasan, dan profil publik dapat dimoderasi jika melanggar standar keamanan platform."* Requirement ini yang menjalankannya.
- **Alasan laporan:** Spam · Pelecehan · Spoiler tanpa penanda · Konten dewasa · Plagiarisme · Lainnya (dengan keterangan).
- Satu pengguna hanya dapat melaporkan satu objek **satu kali**.
- Pelapor menerima konfirmasi bahwa laporannya diterima; **tidak** menerima kabar hasil tinjauan.
- Konten yang dilaporkan **tetap tampil** sampai ditinjau — kecuali mencapai ambang laporan tertentu, lalu disembunyikan otomatis sambil menunggu tinjauan.
- Laporan masuk ke antrean tinjauan admin (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-37).
- Pengguna dapat **memblokir** pengguna lain: komentar dan ulasan pengguna terblokir disembunyikan dari tampilannya.
- Tombol **Report** di detail cerita memakai alur yang sama untuk melaporkan cerita.

**Acceptance criteria.**
- **Given** pembaca menekan laporkan pada sebuah komentar, **when** memilih alasan dan mengirim, **then** konfirmasi penerimaan laporan tampil.
- **Given** pembaca sudah melaporkan sebuah komentar, **when** membuka menu laporan lagi, **then** ditampilkan bahwa laporan sudah pernah dikirim.
- **Given** sebuah komentar mencapai ambang laporan, **when** utas dirender, **then** komentar disembunyikan dengan keterangan sedang ditinjau.
- **Given** pembaca memblokir seorang pengguna, **when** utas dirender, **then** komentar pengguna itu tidak tampil.

---

### FR-SOCIAL-08 — Integrasi dengan misi, profil & analitik · P1

**Status: BARU.**

**Deskripsi.** Aktivitas sosial mengaliri fitur-fitur yang sudah ada dan sekarang menampilkan data tanpa sumber.

**User story.** Sebagai pengguna, saya ingin ulasan yang saya tulis tercatat di profil saya dan menyelesaikan misi yang menjanjikan koin.

**Aturan bisnis.**

| Fitur yang sudah ada | Yang dialiri modul ini |
|---|---|
| Misi **"Tulis satu ulasan"** di `rewards_center` (tombol → `#`) | Progres menjadi 100% dan dapat diklaim setelah ulasan pertama terkirim |
| Feed aktivitas `profile` (*"Menulis ulasan 5 bintang"*) | Entri dibuat otomatis saat ulasan terkirim |
| Sakelar visibilitas **"Ulasan dan reaksi"** di `profile` (FR-PROF-04) | Menentukan apakah ulasan pengguna tampil di profil publiknya |
| `other_user_profile` tab Activity (*"Posted a review"*) | Diisi dari ulasan yang visibilitasnya diizinkan |
| **Sentimen komentar** di `story_analytics` (234 komentar) | Dihitung dari komentar dan ulasan nyata |
| **Rating** pada seluruh kartu cerita & statbar `12.4K Ratings` | Dihitung dari rating nyata |
| Urutan **"Terbanyak komentar"** & **"Rating tertinggi"** di `story_analytics` dan `see_all_*` | Memakai angka nyata |
| **Notifikasi** ulasan/komentar baru | Dipicu untuk penulis cerita (FR-NOTIF-02) |

- **Menghormati visibilitas:** ulasan pengguna yang mematikan sakelar "Ulasan dan reaksi" tetap tampil di halaman ulasan cerita (karena itu konten publik cerita), tetapi **tidak** muncul di profil publiknya. Dua hal berbeda.
- Rata-rata rating cerita dihitung ulang setiap ada rating baru, diubah, atau dihapus.
- Misi ulasan hanya dapat diselesaikan **satu kali per hari**, tidak per cerita — mencegah penulisan ulasan asal demi koin.

**Acceptance criteria.**
- **Given** pembaca mengirim ulasan pertamanya hari itu, **when** membuka `rewards_center`, **then** misi "Tulis satu ulasan" berprogres 100% dan dapat diklaim.
- **Given** pembaca sudah menyelesaikan misi ulasan hari ini, **when** menulis ulasan kedua, **then** misi tidak dapat diklaim dua kali pada hari yang sama.
- **Given** pembaca mengirim ulasan, **when** membuka profilnya, **then** entri aktivitas ulasan tampil di feed.
- **Given** pembaca mematikan sakelar "Ulasan dan reaksi", **when** orang lain membuka profil publiknya, **then** ulasannya tidak tampil di sana, tetapi tetap tampil di halaman ulasan cerita.
- **Given** sebuah rating baru masuk, **when** kartu cerita dirender di beranda, **then** rata-rata rating sudah mencerminkan nilai terbaru.

---

## 5. State & Persistensi

Seluruh state modul ini **wajib di server** — ini konten publik yang dilihat banyak pengguna, bukan preferensi perangkat.

| State | Tempat | Catatan |
|---|---|---|
| Rating per pengguna per cerita | Server | Satu nilai per pasangan pengguna–cerita |
| Ulasan | Server | Satu per pasangan pengguna–cerita; menyimpan riwayat suntingan |
| Komentar & balasan | Server | Terikat `chapter_id` |
| Reaksi "membantu" & suka | Server | Satu per pengguna per objek |
| Laporan & blokir | Server | — |
| Draf ulasan belum terkirim | `localStorage` | Satu-satunya state lokal; dihapus setelah terkirim |

---

## 6. Navigasi

**Masuk ke modul:** tombol **Rate** dan tautan **Review** di `detail_story_alternatif_unified_cover_first.html` · baris reaksi di `chapter_read_locked_story_stage.html` · misi ulasan di `rewards_center.html` · notifikasi ulasan/komentar baru · feed aktivitas di `profile.html` dan `other_user_profile.html`.

**Keluar dari modul:** `detail_story_alternatif_unified_cover_first.html` · `chapter_read_locked_story_stage.html` · `other_user_profile.html` (profil pengulas) · `rewards_center.html`.

---

## 7. Catatan Implementasi

| # | Catatan |
|---|---|
| 1 | **Perbaiki dua tautan menggantung sekaligus:** arahkan `#reviewLink` ke `story_reviews.html` dan baris reaksi reader ke `chapter_comments.html` — keduanya sudah punya tempat memanggil, hanya belum punya tujuan |
| 2 | Rating dan ulasan sengaja **dipisah**: banyak pembaca mau memberi bintang tetapi tidak mau menulis. Memaksa keduanya akan menekan jumlah rating drastis |
| 3 | Balasan dibatasi satu tingkat karena frame 360–420 px tidak menyediakan ruang untuk pohon komentar dalam |
| 4 | Syarat "sudah membaca satu bab" sebelum menilai membutuhkan progres baca yang tersimpan — bergantung pada FR-READ-16 di [`prd_05_reader.md`](prd_05_reader.md) |
| 5 | Sentimen komentar di `story_analytics` sebaiknya dihitung di server secara berkala, bukan saat halaman dibuka |
| 6 | Pola buram spoiler memakai kembali gaya `.lock-preview` yang sudah ada di reader — tidak perlu komponen baru |
