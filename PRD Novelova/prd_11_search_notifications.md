# PRD Novelova — Modul Pencarian & Notifikasi

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya **sama dengan v1**; yang berubah hanya kulitnya (putaran 7).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> **Status modul: BELUM ADA di prototype.** Seluruh dokumen ini adalah spesifikasi baru untuk menutup dua alur yang terputus.
> Halaman baru yang perlu dibuat: `search.html` · `notifications.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_home_tabs.md` (§2.2 user, §2.7 history)

---

## 1. Ringkasan Modul

Dua fungsi yang **sudah punya tombolnya di beranda tetapi belum punya halamannya**: ikon Cari dan ikon Notifikasi di `home_tabs.html:728` dan `:735` tidak memiliki handler sama sekali.

Akibatnya dua alur besar tidak menutup:

| Alur | Kondisi sekarang |
|---|---|
| **Menemukan cerita yang sudah diketahui judulnya** | Tidak ada jalan sama sekali. Katalog 328 + 96 + 54 cerita hanya bisa ditelusuri lewat kurasi beranda. Pencarian yang ada (`my_library`, `my_stories`, `manage_chapters`) semuanya mencari **milik sendiri**, bukan katalog. |
| **Menerima pemberitahuan** | Empat fitur **memicu** notifikasi — sakelar notifikasi per cerita (`my_library`), penjadwal terbit bab (`manage_chapters`), status cetak (`story_print_history`: *"push notification akan dikirim saat status berubah"*), dan check-in harian (`rewards_center`). Tidak ada satu pun tempat untuk menerimanya. |

| Aspek | Nilai |
|---|---|
| **Aktor** | Pembaca · Penulis |
| **Halaman baru** | `search.html`, `notifications.html` |
| **Prasyarat** | Pengguna sudah masuk |
| **State persisten** | `novelova:search-history-v1` (baru) + status baca notifikasi di server |
| **Sub-sistem desain** | Ikuti `home_tabs` (restyled rose-gold, navigasi bawah lima tab) karena keduanya dibuka dari beranda |

---

## 2. Flow

### 2.1 Pencarian

1. Pembaca menekan ikon Cari di header beranda → `search.html`.
2. Keadaan awal menampilkan **riwayat pencarian** dan **kata kunci populer** — bukan halaman kosong.
3. Pembaca mengetik; saran muncul sambil mengetik.
4. Pembaca menekan Enter atau memilih saran → hasil tampil, dikelompokkan menurut jenis (cerita · penulis · tag).
5. Pembaca mempersempit dengan saringan genre, status, dan bahasa, atau mengubah urutan.
6. Pembaca menekan hasil → halaman detail cerita atau profil penulis.
7. Bila tidak ada hasil: saran ejaan, kata kunci alternatif, dan jalan keluar ke kategori populer.

### 2.2 Notifikasi

1. Pembaca menekan ikon lonceng (dengan penanda jumlah belum dibaca) → `notifications.html`.
2. Notifikasi tampil terurut terbaru, dikelompokkan per hari, dengan penanda belum dibaca.
3. Pembaca menyaring menurut jenis: Semua · Cerita · Dompet · Hadiah · Sistem.
4. Menekan notifikasi menandainya terbaca **dan** membuka halaman tujuannya.
5. Dari sini pembaca dapat membuka pengaturan notifikasi untuk mengatur kanal per jenis.

---

## 3. Daftar Requirement

| ID | Nama | Halaman | Prioritas |
|---|---|---|---|
| FR-SRCH-01 | Pintu masuk pencarian | `home_tabs` → `search` | P0 |
| FR-SRCH-02 | Pencarian katalog | `search` | P0 |
| FR-SRCH-03 | Riwayat & saran pencarian | `search` | P1 |
| FR-SRCH-04 | Saring & urutkan hasil | `search` | P1 |
| FR-SRCH-05 | Keadaan kosong & pemulihan | `search` | P1 |
| FR-NOTIF-01 | Pusat notifikasi | `notifications` | P0 |
| FR-NOTIF-02 | Jenis notifikasi & sumber pemicunya | `notifications` | P0 |
| FR-NOTIF-03 | Penanda belum dibaca | `home_tabs`, `notifications` | P0 |
| FR-NOTIF-04 | Preferensi notifikasi per jenis | `notifications`, `profile` | P1 |
| FR-NOTIF-05 | Push notification | lintas halaman | P2 |

---

## 4. Detail Requirement

### FR-SRCH-01 — Pintu masuk pencarian · P0

**Status: BARU.** Tombolnya sudah ada, handler-nya belum.

**Deskripsi.** Ikon Cari di header beranda membuka halaman pencarian dengan kolom yang sudah terfokus.

**User story.** Sebagai pembaca, saya ingin menekan ikon cari dan langsung bisa mengetik, tanpa satu ketukan tambahan.

**Aturan bisnis.**
- Ikon Cari di `home_tabs.html:728` menjadi tautan/handler menuju `search.html`.
- Halaman pencarian membuka kolom masukan dalam keadaan **sudah terfokus** sehingga papan ketik langsung muncul di perangkat sentuh.
- Tombol kembali memakai pola bertingkat yang sama dengan halaman lain: `history.back()` bila ada riwayat, cadangan `home_tabs.html`.
- Pintu masuk kedua: kolom pencarian juga muncul di halaman lihat-semua (`see_all_*`) sebagai pintasan ke pencarian penuh.

**Acceptance criteria.**
- **Given** pembaca berada di beranda, **when** menekan ikon Cari, **then** `search.html` terbuka dengan kolom masukan terfokus.
- **Given** pembaca tiba dari beranda, **when** menekan tombol kembali, **then** kembali ke beranda pada posisi gulir sebelumnya.

---

### FR-SRCH-02 — Pencarian katalog · P0

**Status: BARU.**

**Deskripsi.** Pencarian atas seluruh katalog cerita, bukan hanya koleksi pribadi, dengan hasil dikelompokkan menurut jenis entitas.

**User story.** Sebagai pembaca yang sudah tahu judul atau penulis yang saya cari, saya ingin menemukannya langsung tanpa menelusuri kurasi beranda.

**Aturan bisnis.**
- **Cakupan pencarian:** judul cerita · nama penulis / pen name · tag · genre · sinopsis (bobot terendah).
- **Pengelompokan hasil:** Cerita · Penulis · Tag. Kelompok kosong tidak ditampilkan.
- **Seluruh keadaan pencarian hidup di URL** — kueri, tiga saringan, dan urutan. Halaman hasil karena itu bisa dibagikan apa adanya.
- **Dua keadaan kosong yang berbeda:** belum mengetik apa pun, dan sudah mencari tetapi tidak ada hasil. Keduanya bukan pesan gagal (FR-CORE-03).

> **Catatan 5 September 2026 · diperiksa, dua butir ditambahkan.** Seluruh
> requirement pencairan di berkas ini **cocok dengan yang dibangun** — pengelompokan,
> jeda ketik 300 ms, ambang dua huruf, dan muat bertahap 20 semuanya berjalan; tidak
> ada yang perlu dikoreksi.
>
> Dua butir di atas adalah **tambahan**, bukan perbaikan: keduanya dibangun di R2–R3
> dan tidak pernah tertulis di sini. Dicatat sekarang supaya PRD ini tidak diam soal
> perilaku yang sudah dijanjikan aplikasi kepada pembacanya.
>
> Bagian **notifikasi** di berkas ini belum dibangun sama sekali — rutenya hidup,
> isinya masih penampung, dan pekerjaannya dijadwalkan di Fase 11.
- Tidak peka huruf besar-kecil; spasi tepi diabaikan — konsisten dengan `my_library` (lihat [`prd_06_library.md`](prd_06_library.md) FR-LIB-03).
- **Minimum 2 karakter** sebelum kueri dikirim, untuk mencegah permintaan berlebihan.
- Kueri dikirim dengan penundaan **300 ms** setelah ketikan terakhir (*debounce*).
- Kartu hasil cerita memakai anatomi yang sama dengan `see_all_*`: cover 66×88, judul, penulis, meta genre–status, rating–jumlah baca.
- Hasil cerita → `detail_story_alternatif_unified_cover_first.html`; hasil penulis → `other_user_profile.html`; hasil tag → hasil pencarian tersaring tag itu.
- Paginasi: 20 hasil per muat, dilanjutkan dengan gulir tak terbatas memakai kartu skeleton yang sudah ada di `see_all_*` (lihat [`prd_03_home_discovery.md`](prd_03_home_discovery.md) FR-HOME-12).

**Acceptance criteria.**
- **Given** pembaca mengetik `ceo`, **when** hasil dimuat, **then** cerita yang judul, tag, atau genrenya memuat "ceo" tampil dalam kelompok Cerita.
- **Given** pembaca mengetik nama penulis, **when** hasil dimuat, **then** kelompok Penulis tampil di atas atau di bawah kelompok Cerita, dan menekannya membuka profil penulis.
- **Given** pembaca mengetik satu karakter, **when** ketikan berhenti, **then** tidak ada permintaan yang dikirim.
- **Given** pembaca mengetik cepat lima karakter, **when** ketikan berhenti, **then** hanya satu permintaan dikirim setelah 300 ms.
- **Given** hasil melebihi 20 cerita, **when** pembaca menggulir ke bawah, **then** 20 hasil berikutnya dimuat.

---

### FR-SRCH-03 — Riwayat & saran pencarian · P1

**Status: BARU.**

**Deskripsi.** Sebelum mengetik, halaman menampilkan pencarian terakhir pengguna dan kata kunci yang sedang populer.

**User story.** Sebagai pembaca, saya ingin mengulang pencarian yang pernah saya lakukan tanpa mengetik ulang, dan melihat apa yang sedang dicari orang lain.

**Aturan bisnis.**
- **Riwayat pencarian** disimpan di `localStorage['novelova:search-history-v1']` sebagai array kueri.
- Maksimal **10 entri**; entri terbaru di depan; kueri yang sama tidak diduplikasi (yang lama dinaikkan ke atas).
- Setiap entri punya tombol hapus, ditambah tautan **"Hapus semua"**.
- Pembacaan dibungkus `try/catch` dan jatuh ke array kosong bila JSON rusak — pola yang sama dengan `home_tabs` (lihat [`prd_03_home_discovery.md`](prd_03_home_discovery.md) FR-HOME-06) dan reader (lihat [`prd_05_reader.md`](prd_05_reader.md) §5.1).
- **Kata kunci populer** diambil dari server, ditampilkan sebagai pil; menekannya langsung menjalankan pencarian.
- **Saran sambil mengetik** (*autocomplete*) menampilkan maksimal 8 saran dengan bagian yang cocok ditebalkan.

**Acceptance criteria.**
- **Given** pembaca belum pernah mencari, **when** halaman dibuka, **then** hanya kata kunci populer yang tampil, tanpa blok riwayat kosong.
- **Given** pembaca mencari `romance` lalu kembali ke halaman pencarian, **when** halaman dibuka, **then** `romance` muncul di paling atas riwayat.
- **Given** pembaca mencari kueri yang sama dua kali, **when** riwayat dirender, **then** kueri itu muncul sekali saja di posisi teratas.
- **Given** riwayat sudah berisi 10 entri, **when** pembaca mencari kueri baru, **then** entri terlama dibuang.
- **Given** pembaca menekan "Hapus semua", **when** aksi dijalankan, **then** riwayat kosong dan penyimpanan lokal dibersihkan.

---

### FR-SRCH-04 — Saring & urutkan hasil · P1

**Status: BARU.**

**Deskripsi.** Kontrol penyaringan dan pengurutan hasil, memakai pola yang sama dengan halaman lihat-semua agar pembaca tidak perlu belajar dua kali.

**User story.** Sebagai pembaca, saya ingin mempersempit hasil pencarian menurut genre, status, dan bahasa, seperti yang bisa saya lakukan di halaman kategori.

**Aturan bisnis.**
- **Urutan:** Paling relevan *(default)* · Paling banyak dibaca · Rating tertinggi · Terbaru diupdate.
- **Saringan:** Genre · Status (Ongoing / Completed / Hiatus) · Bahasa (Indonesia / English).
- Kontrol memakai bilah **sticky** dengan `backdrop-filter` — identik dengan `see_all_*` (lihat [`prd_03_home_discovery.md`](prd_03_home_discovery.md) FR-HOME-11).
- Saringan aktif ditampilkan sebagai pil yang bisa dilepas satu per satu.
- **Saringan dan urutan ikut ke URL** (`?q=…&genre=…&sort=…`) sehingga hasil dapat dibagikan dan tombol kembali peramban bekerja.
- Mengganti saringan mengulang pencarian dari halaman pertama.

**Acceptance criteria.**
- **Given** ada hasil pencarian, **when** pembaca memilih genre Romance, **then** hanya cerita bergenre itu tampil dan pil saringan aktif muncul.
- **Given** dua saringan aktif, **when** pembaca melepas salah satu pil, **then** hasil dimuat ulang dengan satu saringan tersisa.
- **Given** pembaca menyaring lalu menekan tombol kembali peramban, **when** halaman dirender, **then** keadaan saringan sebelumnya dipulihkan.
- **Given** pembaca menyalin URL hasil pencarian, **when** URL dibuka di tab lain, **then** kueri dan saringan yang sama termuat.

---

### FR-SRCH-05 — Keadaan kosong & pemulihan · P1

**Status: BARU.**

**Deskripsi.** Ketika tidak ada hasil, halaman menawarkan jalan keluar, bukan sekadar memberi tahu bahwa hasilnya nihil.

**User story.** Sebagai pembaca yang salah ketik atau mencari sesuatu yang tidak ada, saya ingin diberi alternatif agar pencarian saya tidak berakhir buntu.

**Aturan bisnis.**
- Keadaan kosong menampilkan **tiga hal**: pernyataan tidak ada hasil untuk kueri tersebut · saran ejaan (*"Maksud Anda …?"*) bila ada kandidat mirip · tautan ke kategori populer (`see_all_popular.html`).
- Bila saringan aktif menyebabkan hasil kosong, tawarkan **"Hapus semua saringan"** lebih dulu sebelum menyarankan kata kunci lain.
- Kegagalan jaringan ditangani terpisah dari hasil kosong: pesan kegagalan + tombol **Coba lagi** (lihat [`prd_00_overview.md`](prd_00_overview.md) §11 FR-CORE-03).

**Acceptance criteria.**
- **Given** kueri tidak menghasilkan apa pun, **when** keadaan kosong dirender, **then** kueri yang dicari disebut ulang dan tautan ke kategori populer tersedia.
- **Given** hasil kosong karena saringan, **when** keadaan kosong dirender, **then** tombol "Hapus semua saringan" tampil.
- **Given** permintaan gagal karena jaringan, **when** halaman dirender, **then** pesan kegagalan dan tombol Coba lagi tampil — bukan pesan "tidak ada hasil".

---

### FR-NOTIF-01 — Pusat notifikasi · P0

**Status: BARU.** Ikonnya sudah ada di `home_tabs.html:735`, halamannya belum.

**Deskripsi.** Daftar seluruh pemberitahuan untuk pengguna, terurut terbaru, dikelompokkan per hari, dengan penyaringan menurut jenis.

**User story.** Sebagai pengguna, saya ingin satu tempat untuk melihat semua pemberitahuan agar tidak melewatkan bab baru, status pesanan, atau hadiah yang bisa diklaim.

**Aturan bisnis.**
- Ikon lonceng di beranda menjadi tautan ke `notifications.html`.
- Notifikasi **terurut terbaru di atas**, dikelompokkan dengan kepala hari: **Hari ini** · **Kemarin** · **<tanggal>**.
- **Lima saringan:** Semua *(default)* · Cerita · Dompet · Hadiah · Sistem.
- Setiap baris memuat: ikon jenis · judul · keterangan singkat · waktu relatif (`12 menit lalu`, `Kemarin`) — memakai format waktu relatif yang sama dengan feed aktivitas profil (lihat [`prd_10_profile_settings_help.md`](prd_10_profile_settings_help.md) FR-PROF-02).
- Menekan notifikasi melakukan **dua hal**: menandainya terbaca dan membuka halaman tujuannya.
- Tersedia aksi **"Tandai semua terbaca"**.
- Paginasi 20 per muat; notifikasi lebih lama dari **90 hari** tidak ditampilkan.
- Keadaan kosong: pernyataan belum ada pemberitahuan + penjelasan singkat kapan notifikasi akan muncul.

**Acceptance criteria.**
- **Given** pembaca menekan ikon lonceng, **when** halaman terbuka, **then** notifikasi tampil terurut terbaru dengan kepala hari.
- **Given** pembaca menekan sebuah notifikasi bab baru, **when** aksi dijalankan, **then** notifikasi itu menjadi terbaca dan halaman detail cerita terbuka.
- **Given** pembaca menyaring ke "Dompet", **when** daftar diperbarui, **then** hanya notifikasi dompet tampil.
- **Given** pembaca menekan "Tandai semua terbaca", **when** aksi dijalankan, **then** seluruh penanda belum dibaca hilang dan lencana di beranda menjadi kosong.
- **Given** pengguna baru tanpa notifikasi, **when** halaman dibuka, **then** keadaan kosong tampil dengan penjelasan.

---

### FR-NOTIF-02 — Jenis notifikasi & sumber pemicunya · P0

**Status: BARU.**

**Deskripsi.** Katalog jenis notifikasi, masing-masing dengan pemicu yang **sudah ada di aplikasi** dan tujuan bukanya.

**User story.** Sebagai pengguna, saya ingin pemberitahuan yang benar-benar berkaitan dengan tindakan saya, dan menekannya membawa saya tepat ke tempat yang dimaksud.

**Aturan bisnis.**

| Jenis | Pemicu (sudah ada di aplikasi) | Tujuan buka |
|---|---|---|
| **Bab baru** | Sakelar notifikasi per cerita di `my_library` (lihat [`prd_06_library.md`](prd_06_library.md) FR-LIB-08) | Reader pada bab baru |
| **Bab terjadwal terbit** | Penjadwal bab di `manage_chapters` (FR-STUDIO-11) | `manage_chapters.html` |
| **Cerita terjadwal terbit** | Penjadwal cerita di `my_stories` (FR-STUDIO-04) | `my_stories.html` |
| **Status pesanan cetak berubah** | `story_print_history` menyatakan *"push notification akan dikirim saat status berubah"* (FR-STUDIO-32) | `story_print_history.html` |
| **Top-up berhasil / gagal / kedaluwarsa** | Status order di `topup_detail` (FR-WALLET-14) | `topup_detail.html?status=…` |
| **Check-in harian tersedia** | Streak di `rewards_center` (FR-RWD-02) | `rewards_center.html` |
| **Voucher akan kedaluwarsa** | `rewards_center` menandai *"2 hampir kadaluarsa"* (FR-RWD-01) | `rewards_center.html` |
| **Ulasan / komentar baru pada karya** | Modul sosial (lihat [`prd_12_social.md`](prd_12_social.md)) | Halaman ulasan / komentar bab |
| **Pengikut baru** | Aksi Follow di `other_user_profile` (FR-PROF-08) | Profil pengikut |
| **Penarikan diproses / selesai** | Pengajuan di `author_withdraw` (FR-EARN-09) | `author_withdraw.html` |
| **Sistem / keamanan** | Peringatan masuk di `settings_security` (FR-SET-02) | `settings_security.html` |

- **Setiap notifikasi wajib punya tujuan buka yang spesifik** — tidak boleh ada notifikasi yang hanya bisa dibaca tanpa tindak lanjut.
- Notifikasi bab baru **hanya dikirim** untuk cerita yang sakelar notifikasinya aktif — sakelar di `my_library` menjadi sumber kebenarannya.
- Notifikasi sejenis dari cerita yang sama digabung bila lebih dari satu dalam 24 jam (mis. *"3 bab baru di The CEO's Secret Lover"*).

**Acceptance criteria.**
- **Given** pembaca mematikan notifikasi sebuah cerita di perpustakaan, **when** cerita itu merilis bab baru, **then** tidak ada notifikasi yang diterima.
- **Given** sebuah cerita merilis tiga bab dalam satu hari, **when** notifikasi dirender, **then** ketiganya digabung menjadi satu baris.
- **Given** pesanan cetak berubah menjadi "Dikirim", **when** notifikasi diterima dan ditekan, **then** `story_print_history.html` terbuka.
- **Given** top-up gagal, **when** notifikasi ditekan, **then** `topup_detail.html` terbuka dengan status gagal.

---

### FR-NOTIF-03 — Penanda belum dibaca · P0

**Status: BARU.**

**Deskripsi.** Lencana jumlah notifikasi belum dibaca pada ikon lonceng, dan penanda visual pada tiap baris yang belum dibaca.

**User story.** Sebagai pengguna, saya ingin tahu ada yang baru tanpa harus membuka halaman notifikasi.

**Aturan bisnis.**
- Lencana pada ikon lonceng menampilkan jumlah belum dibaca; **lebih dari 9 ditulis `9+`**.
- Lencana disembunyikan sepenuhnya saat jumlahnya nol — bukan menampilkan `0`.
- Baris belum dibaca diberi latar aksen lembut (`--accent-soft`) dan titik penanda; baris terbaca memakai latar kartu biasa.
- Jumlah belum dibaca disegarkan saat beranda dibuka dan saat aplikasi kembali dari latar belakang.
- Menandai terbaca bersifat **optimistis**: penanda hilang seketika di layar, lalu disinkronkan ke server; bila gagal, penanda dikembalikan.

**Acceptance criteria.**
- **Given** ada 3 notifikasi belum dibaca, **when** beranda dirender, **then** lencana menampilkan `3`.
- **Given** ada 15 notifikasi belum dibaca, **when** lencana dirender, **then** tertulis `9+`.
- **Given** tidak ada notifikasi belum dibaca, **when** beranda dirender, **then** lencana tidak tampil.
- **Given** pembaca membuka sebuah notifikasi, **when** kembali ke beranda, **then** jumlah lencana berkurang satu.

---

### FR-NOTIF-04 — Preferensi notifikasi per jenis · P1

**Status: BARU.**

**Deskripsi.** Pengaturan kanal pengiriman untuk setiap jenis notifikasi, ditempatkan di halaman notifikasi dan diakses juga dari profil.

**User story.** Sebagai pengguna, saya ingin memilih pemberitahuan mana yang masuk lewat push dan mana yang cukup muncul di aplikasi, agar ponsel saya tidak berisik.

**Aturan bisnis.**
- Tiga kanal per jenis: **Dalam aplikasi** · **Push** · **Email**.
- Jenis yang dapat diatur mengikuti tabel FR-NOTIF-02, dikelompokkan menjadi: **Cerita** · **Dompet & Hadiah** · **Karya saya** · **Sistem & Keamanan**.
- **Notifikasi keamanan tidak dapat dimatikan** — sejalan dengan `settings_security` yang menyatakan peringatan masuk aktif (FR-SET-02).
- Sakelar notifikasi per cerita di `my_library` tetap berlaku dan **lebih spesifik** daripada pengaturan global: mematikan jenis "Bab baru" secara global mematikan semuanya; menyalakannya tetap menghormati sakelar per cerita.
- Pengaturan **disimpan di server**, bukan per perangkat — konsisten dengan rekomendasi pada [`prd_10_profile_settings_help.md`](prd_10_profile_settings_help.md) §7 no. 1.
- Menu menuju pengaturan ini ditambahkan pada kelompok "Akun" di `profile.html` (FR-PROF-05).

**Acceptance criteria.**
- **Given** pengguna mematikan push untuk jenis "Bab baru", **when** cerita yang diikuti merilis bab, **then** notifikasi tetap muncul di aplikasi tetapi tidak dikirim sebagai push.
- **Given** pengguna mencoba mematikan notifikasi keamanan, **when** sakelar ditekan, **then** sakelar tetap aktif disertai penjelasan.
- **Given** pengguna mengubah preferensi di satu perangkat, **when** membuka aplikasi di perangkat lain, **then** preferensi yang sama berlaku.

---

### FR-NOTIF-05 — Push notification · P2

**Status: BARU.**

**Deskripsi.** Pengiriman pemberitahuan ke perangkat saat aplikasi tidak dibuka, beserta permintaan izinnya.

**User story.** Sebagai pembaca, saya ingin diberi tahu saat bab baru terbit meski aplikasi sedang tertutup, agar tidak tertinggal cerita yang saya ikuti.

**Aturan bisnis.**
- **Izin tidak diminta saat pertama membuka aplikasi.** Permintaan izin muncul pada momen yang relevan: saat pengguna menyalakan sakelar notifikasi cerita pertama kali, atau saat menjadwalkan bab pertama.
- Bila izin ditolak, aplikasi **tidak meminta ulang**; sebagai gantinya halaman notifikasi menampilkan petunjuk mengaktifkannya lewat pengaturan sistem.
- Menekan push membuka aplikasi tepat pada tujuan notifikasi tersebut (*deep link*), bukan pada beranda.
- Jam tenang: push tidak dikirim antara **22.00–07.00** waktu lokal pengguna, mengikuti zona waktu pada `settings_language` (FR-SET-01); notifikasi tetap masuk ke daftar dalam aplikasi.
- Terhubung dengan rencana PWA di `../../pwa/pwa_implementation_plan.md`.

**Acceptance criteria.**
- **Given** pengguna baru membuka aplikasi pertama kali, **when** beranda dimuat, **then** tidak ada permintaan izin notifikasi.
- **Given** pengguna menyalakan sakelar notifikasi cerita pertama kali, **when** aksi dijalankan, **then** permintaan izin push muncul disertai penjelasan manfaatnya.
- **Given** pengguna menolak izin, **when** membuka halaman notifikasi, **then** petunjuk mengaktifkan lewat pengaturan sistem tampil, tanpa permintaan izin ulang.
- **Given** bab baru terbit pukul 23.00 waktu pengguna, **when** notifikasi diproses, **then** push ditunda sampai pukul 07.00 sementara notifikasi dalam aplikasi tetap tercatat.

---

## 5. State & Persistensi

| State | Penyimpanan | Kunci | Umur |
|---|---|---|---|
| Riwayat pencarian | `localStorage` | `novelova:search-history-v1` | Maks 10 entri, sampai dihapus |
| Kueri & saringan aktif | URL | `?q=&genre=&status=&lang=&sort=` | Selama sesi halaman |
| Status baca notifikasi | **Server** | — | Permanen |
| Preferensi notifikasi | **Server** | — | Permanen, lintas perangkat |
| Izin push | Peramban / sistem | — | Sampai dicabut pengguna |

---

## 6. Navigasi

**Masuk ke modul:** ikon Cari dan ikon Notifikasi di header `home_tabs.html` · kolom pencarian pintasan di `see_all_*` · menu preferensi notifikasi di `profile.html`.

**Keluar dari modul:** `detail_story_alternatif_unified_cover_first.html` · `other_user_profile.html` · `chapter_read_locked_story_stage.html` · `topup_detail.html` · `rewards_center.html` · `story_print_history.html` · `manage_chapters.html` · `my_stories.html` · `author_withdraw.html` · `settings_security.html` · `see_all_popular.html` (dari keadaan kosong).

---

## 7. Catatan Implementasi

| # | Catatan |
|---|---|
| 1 | Pencarian **harus di server** sejak awal — jangan mengulang pola penyaringan klien seperti `my_library` dan `my_stories`, yang tidak akan sanggup untuk katalog ratusan cerita |
| 2 | Riwayat pencarian sengaja disimpan lokal (bukan server) karena bersifat pribadi dan tidak perlu lintas perangkat; preferensi notifikasi sebaliknya |
| 3 | Penggabungan notifikasi sejenis dilakukan **di server** agar konsisten antara daftar dalam aplikasi dan push |
| 4 | Jam tenang memakai zona waktu pengguna dari `settings_language` — pastikan pengaturan itu sudah benar-benar tersimpan (lihat [`prd_10_profile_settings_help.md`](prd_10_profile_settings_help.md) §7 no. 2) |
| 5 | Ikon Cari dan lonceng sudah berupa SVG inline di `home_tabs.html` — cukup tambahkan handler, tidak perlu aset baru |
