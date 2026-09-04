# PRD Novelova — Modul Penghasilan Penulis

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya **sama dengan v1**; yang berubah hanya kulitnya (putaran 7).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Halaman: `author_analytics.html` · `author_withdraw.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_author_earnings.md`

---

## 1. Ringkasan Modul

Sisi bisnis dari peran penulis: melihat performa **seluruh karya** secara agregat, lalu mencairkan penghasilan ke rekening bank. Berbeda dari `story_analytics` yang membahas **satu cerita**, `author_analytics` membahas **penulisnya**.

| Aspek | Nilai |
|---|---|
| **Aktor** | Penulis |
| **Halaman** | `author_analytics.html` (110 baris), `author_withdraw.html` (77 baris) |
| **Prasyarat** | Penulis memiliki karya yang menghasilkan koin |
| **State persisten** | Tidak ada |
| **Sub-sistem desain** | Klasik `fix_ui` |

> **Catatan penting:** kedua halaman ini **tidak dirujuk dari halaman mana pun** di dalam folder — hanya bisa dibuka langsung atau lewat `author_analytics` → `author_withdraw`. Lihat §7.

---

## 2. Flow

1. Penulis membuka `author_analytics.html`.
2. Ringkasan tiga KPI utama tampil: pendapatan, jumlah dibaca, rating rata-rata.
3. Penulis berpindah antar sudut pandang analisis: **Pendapatan** · **Retensi** · **Traffic**.
4. Penulis menelaah empat kartu: tingkat buka bab premium, penggemar baru, kurva pendapatan harian, corong pembaca, dan heatmap waktu rilis terbaik.
5. Dari catatan aksi, penulis mengetahui waktu rilis terkuat dan dapat menjadwalkan bab premium mendekati waktu itu.
6. Penulis menekan **Tarik penghasilan** → `author_withdraw.html`.
7. Penulis memeriksa saldo, memilih rekening, mengisi jumlah, dan melihat ringkasan biaya terhitung otomatis.
8. Penulis menekan **Ajukan penarikan** → status berubah menjadi menunggu verifikasi.

---

## 3. Daftar Requirement

| ID | Nama | Halaman | Prioritas |
|---|---|---|---|
| FR-EARN-01 | Ringkasan KPI penulis | `author_analytics` | P0 |
| FR-EARN-02 | Pemilih sudut pandang analisis | `author_analytics` | P1 |
| FR-EARN-03 | Kartu metrik & kurva pendapatan | `author_analytics` | P0 |
| FR-EARN-04 | Corong pembaca | `author_analytics` | P0 |
| FR-EARN-05 | Heatmap rilis & catatan aksi | `author_analytics` | P1 |
| FR-EARN-06 | Saldo & syarat penarikan | `author_withdraw` | P0 |
| FR-EARN-07 | Rekening tujuan terverifikasi | `author_withdraw` | P0 |
| FR-EARN-08 | Jumlah penarikan & perhitungan otomatis | `author_withdraw` | P0 |
| FR-EARN-09 | Pengajuan penarikan & lini masa proses | `author_withdraw` | P0 |
| FR-EARN-10 | **[BARU]** Pintu masuk penghasilan dari studio & profil | `my_stories`, `profile` | P0 |
| FR-EARN-11 | **[BARU]** Validasi pengajuan penarikan | `author_withdraw` | P0 |
| FR-EARN-12 | **[BARU]** Riwayat penarikan & konversi koin | `author_withdraw` | P1 |

---

## 4. Detail Requirement

### FR-EARN-01 — Ringkasan KPI penulis · P0

**Deskripsi.** Kepala halaman berperan sebagai "ruang kendali penerbitan": penjelasan singkat diikuti tiga angka utama yang mewakili kesehatan karier penulis.

**User story.** Sebagai penulis, saya ingin melihat pendapatan, jangkauan, dan kualitas karya saya dalam satu pandangan agar tahu arah perkembangan saya.

**Aturan bisnis.**
- Tiga KPI dengan urutan tetap: **Pendapatan** (Rp 8,4M) · **Dibaca** (1,2M) · **Rating** (4,8).
- Rentang waktu default **30 hari**, ditampilkan sebagai label di bilah atas.
- Angka mata uang dan desimal memakai format Indonesia (koma sebagai pemisah desimal, mis. `4,8` dan `Rp 8,4M`).
- Nilai bersifat agregat seluruh karya, bukan satu cerita.

**Hook implementasi.** `author_analytics.html:60` `.war-room`; `:64` `.hero-metrics`; `:58` label rentang.

**Acceptance criteria.**
- **Given** penulis membuka halaman, **when** kepala halaman dirender, **then** ketiga KPI tampil dengan urutan Pendapatan–Dibaca–Rating.
- **Given** halaman dimuat, **when** penulis melihat bilah atas, **then** rentang "30 hari" tertera.

---

### FR-EARN-02 — Pemilih sudut pandang analisis · P1

**Deskripsi.** Tiga tombol yang mengganti kerangka analisis halaman, masing-masing membawa penjelasan tentang apa yang ditampilkan.

**User story.** Sebagai penulis, saya ingin melihat data yang sama dari sudut pandang berbeda — uang, retensi, atau sumber pembaca — sesuai pertanyaan yang sedang saya cari jawabannya.

**Aturan bisnis.**

| Tombol | Keterangan |
|---|---|
| **Pendapatan** *(aktif)* | Menampilkan insight berbasis pendapatan untuk 30 hari terakhir |
| **Retensi** | Menampilkan analisis retensi dan drop-off per chapter |
| **Traffic** | Menampilkan sumber lalu lintas dan analisis waktu rilis |

- Tepat satu tombol aktif pada satu waktu.
- **Perpindahan hanya mengubah gaya aktif; isi halaman tidak berubah** (lihat §7).

**Hook implementasi.** `author_analytics.html:71` `.switcher`; listener `:102`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** penulis melihat pemilih, **then** "Pendapatan" aktif.
- **Given** penulis menekan "Retensi", **when** aksi dijalankan, **then** hanya tombol itu yang bergaya aktif.
- **Given** penulis menekan "Traffic" *(produksi)*, **when** aksi dijalankan, **then** kartu analisis berganti menjadi sumber trafik dan analisis waktu rilis.

---

### FR-EARN-03 — Kartu metrik & kurva pendapatan · P0

**Deskripsi.** Dua kartu metrik ringkas dengan arah perubahan, ditambah grafik batang tujuh hari yang menunjukkan konversi koin harian.

**User story.** Sebagai penulis, saya ingin tahu berapa persen pembaca membuka bab premium saya dan pada hari apa pendapatan saya paling tinggi.

**Aturan bisnis.**
- **Tingkat buka** — persentase pembaca yang membuka bab premium (38%), disertai perubahan (+4,2%).
- **Penggemar baru** — jumlah pengikut baru (6.812), disertai perubahan (+18%).
- **Kurva pendapatan** — grafik batang tujuh hari berlabel Sen–Min; tinggi tiap batang mewakili konversi koin hari itu (prototype: 46% · 58% · 42% · 76% · 64% · **92%** · 70%).
- Grafik memakai `aria-label="Grafik pendapatan"`.
- Puncak akhir pekan (Sabtu 92%) selaras dengan catatan aksi pada FR-EARN-05 — kedua bagian harus tetap konsisten satu sama lain.

**Hook implementasi.** `author_analytics.html:74-81` — `.card`, `.big`, `.delta`, `.chart`, `.bar`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** kartu metrik dirender, **then** tingkat buka dan penggemar baru tampil beserta arah perubahannya.
- **Given** grafik pendapatan dirender, **when** penulis melihatnya, **then** tujuh batang berlabel hari tampil dengan tinggi berbeda.
- **Given** pembaca layar membaca halaman, **when** mencapai grafik, **then** grafik diumumkan lewat labelnya.

---

### FR-EARN-04 — Corong pembaca · P0

**Deskripsi.** Empat tahap yang menunjukkan berapa banyak pembaca bertahan dari membuka cerita sampai membayar.

**User story.** Sebagai penulis, saya ingin tahu di tahap mana pembaca paling banyak berhenti agar bisa memperbaiki bagian cerita itu.

**Aturan bisnis.**
- **Empat tahap berurutan** dengan persentase menurun: **Dibuka 94%** → **Bab 3 78%** → **Premium 49%** → **Bayar 38%**.
- Setiap tahap ditampilkan sebagai batang horizontal berlabel dan berpersentase.
- Corong dihitung untuk **satu cerita** (prototype: *The CEO's Secret Lover*), ditampilkan sebagai sub-judul kartu.
- Persentase tahap terakhir (38%) sama dengan metrik "Tingkat buka" pada FR-EARN-03 — keduanya mengukur hal yang sama dan harus tetap konsisten.

**Hook implementasi.** `author_analytics.html:83-90` — `.funnel`, `.stage`, `.track`.

**Acceptance criteria.**
- **Given** kartu corong dirender, **when** penulis melihatnya, **then** empat tahap tampil berurutan dengan persentase menurun.
- **Given** kartu corong dirender, **when** penulis melihat sub-judulnya, **then** nama cerita yang dianalisis tertera.
- **Given** penulis membandingkan tahap "Bayar" dengan metrik tingkat buka, **when** keduanya dirender, **then** kedua angka konsisten.

---

### FR-EARN-05 — Heatmap rilis & catatan aksi · P1

**Deskripsi.** Peta panas waktu penerbitan yang diakhiri satu rekomendasi konkret tentang kapan menerbitkan bab premium berikutnya.

**User story.** Sebagai penulis, saya ingin diberi tahu waktu terbaik untuk merilis bab agar konversi pembelian saya lebih tinggi.

**Aturan bisnis.**
- Heatmap terdiri atas sel-sel bertingkat intensitas: normal · `mid` · `hot`.
- **Catatan aksi wajib berupa rekomendasi yang bisa dijalankan**, bukan sekadar pengamatan. Prototype: *"Sabtu pukul 20.00 adalah waktu terkuat"* + saran menjadwalkan bab premium berikutnya mendekati waktu itu.
- Rekomendasi ini terhubung langsung dengan penjadwal bab di [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-11 — produksi sebaiknya menyediakan tautan langsung ke penjadwal dengan waktu terisi otomatis.
- Dua tautan keluar di bawah halaman: **Tarik penghasilan** (`author_withdraw.html`) dan **Kelola cerita** (`my_stories.html`).

**Hook implementasi.** `author_analytics.html:92-95` — `.heat`, `.insight`, `.mark`; `:98` `.route`.

**Acceptance criteria.**
- **Given** kartu heatmap dirender, **when** penulis melihatnya, **then** sel dengan intensitas berbeda tampil.
- **Given** heatmap dirender, **when** penulis membaca catatan aksi, **then** waktu terbaik disebut spesifik beserta saran tindakannya.
- **Given** penulis menekan "Tarik penghasilan", **when** aksi dijalankan, **then** `author_withdraw.html` terbuka.

---

### FR-EARN-06 — Saldo & syarat penarikan · P0

**Deskripsi.** Kepala halaman penarikan menampilkan saldo yang bisa dicairkan beserta dua syarat yang mengikat: batas minimum dan estimasi waktu.

**User story.** Sebagai penulis, saya ingin tahu berapa yang bisa saya cairkan dan kapan uangnya sampai, sebelum saya mengisi apa pun.

**Aturan bisnis.**
- Saldo tersedia ditampilkan besar (prototype: **Rp 8.420.000**).
- **Penarikan minimum: Rp 100.000** — nilai mengikat untuk produksi.
- **Estimasi masuk: 1–3 hari kerja.**
- Kedua syarat tampil **sebelum** formulir, bukan setelahnya, agar penulis tidak mengisi lalu ditolak.

**Hook implementasi.** `author_withdraw.html:47` `.balance`.

**Acceptance criteria.**
- **Given** penulis membuka halaman penarikan, **when** kepala halaman dirender, **then** saldo tersedia, batas minimum, dan estimasi waktu tampil bersamaan.
- **Given** penulis membaca kepala halaman, **when** halaman dirender, **then** syarat minimum terbaca sebelum formulir.

---

### FR-EARN-07 — Rekening tujuan terverifikasi · P0

**Deskripsi.** Rekening bank tujuan ditampilkan dengan nama pemilik, nomor tersamar, dan status verifikasi.

**User story.** Sebagai penulis, saya ingin memastikan dana masuk ke rekening yang benar dan sudah terverifikasi sebelum saya mengajukan penarikan.

**Aturan bisnis.**
- Menampilkan: nama bank, nama pemilik rekening, nomor rekening **tersamar** (`**** 4481`), dan status **terverifikasi**.
- Nomor rekening tidak pernah ditampilkan penuh.
- Prototype hanya mendukung satu rekening dan belum bisa menambah atau mengganti (lihat §7).
- **Tujuan penarikan** dipilih dari tiga kategori: Pembayaran pendapatan penulis · Penyelesaian bulanan · Koreksi manual.

**Hook implementasi.** `author_withdraw.html:50` `.bank`; `:52` pemilih tujuan.

**Acceptance criteria.**
- **Given** halaman dirender, **when** penulis melihat bagian rekening, **then** nomor rekening tampil tersamar dan status terverifikasi tertera.
- **Given** halaman dirender, **when** penulis membuka pilihan tujuan penarikan, **then** tiga kategori tersedia.

---

### FR-EARN-08 — Jumlah penarikan & perhitungan otomatis · P0

**Deskripsi.** Kolom jumlah dengan ringkasan tiga baris yang dihitung ulang setiap ketikan: yang diminta, biaya admin, dan yang benar-benar diterima.

**User story.** Sebagai penulis, saya ingin melihat langsung berapa yang saya terima bersih setelah biaya admin, tanpa harus menghitung sendiri.

**Aturan bisnis.**
- **Pembersihan masukan:** seluruh karakter non-digit dibuang (`replace(/\D/g,'')`) sebelum dihitung — titik, koma, spasi, dan huruf diabaikan sehingga penulis boleh mengetik dalam format apa pun.
- Masukan kosong atau tidak valid dianggap **0**.
- **Biaya admin: Rp 5.000** — nilai tetap, tidak bergantung besar penarikan.
- **Diterima bersih = diminta − 5.000**, dijepit minimum **0** (`Math.max(0, …)`) sehingga tidak pernah negatif.
- Format tampilan memakai `toLocaleString('id-ID')` sehingga ribuan dipisah titik: `Rp 5.000.000`.
- Nilai awal: Rp 5.000.000 → diterima bersih Rp 4.995.000.
- Perhitungan berjalan pada event `input`, jadi diperbarui pada tiap ketikan.
- **Batas minimum Rp 100.000 belum diterapkan sebagai validasi** (lihat §7).

**Hook implementasi.** `author_withdraw.html:65` `format(value)`; `:66:recalc()`; listener `:71`; `#amount`, `#requested`, `#net`.

**Acceptance criteria.**
- **Given** penulis mengetik `5000000`, **when** ringkasan diperbarui, **then** tertulis "Rp 5.000.000" diminta dan "Rp 4.995.000" diterima bersih.
- **Given** penulis mengetik `1.000.000` dengan titik, **when** ringkasan diperbarui, **then** nilai terbaca 1.000.000 dan bersih Rp 995.000.
- **Given** penulis mengosongkan kolom jumlah, **when** ringkasan diperbarui, **then** diminta Rp 0 dan diterima bersih Rp 0 (bukan negatif).
- **Given** penulis mengetik `3000` (di bawah biaya admin), **when** ringkasan diperbarui, **then** diterima bersih Rp 0.
- **Given** penulis mengetik huruf, **when** ringkasan diperbarui, **then** nilai dianggap 0 tanpa error.

---

### FR-EARN-09 — Pengajuan penarikan & lini masa proses · P0

**Deskripsi.** Indikator tiga tahap yang menjelaskan alur pencairan, dan tombol pengajuan yang mengubah status menjadi menunggu verifikasi.

**User story.** Sebagai penulis, saya ingin tahu tahapan apa yang akan dilalui pengajuan saya dan mendapat konfirmasi bahwa pengajuan sudah masuk.

**Aturan bisnis.**
- **Tiga tahap:** **1 Ajukan** → **2 Tinjau** → **3 Transfer**. Halaman ini hanya menjalankan tahap 1.
- Teks status awal: `"Ajukan penarikan dan dana akan diproses dalam 1–3 hari kerja."`
- Setelah pengajuan: `"Permintaan penarikan berhasil diajukan untuk verifikasi dalam prototipe."`
- Tombol pengajuan berada di dok bawah, selalu terlihat.
- **Tidak ada validasi sebelum pengajuan** — jumlah nol atau di bawah minimum tetap diterima (lihat §7).

**Hook implementasi.** `author_withdraw.html:48` `.steps`; `:61` `#submitBtn`; listener `:72`; `#note`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** penulis melihat indikator tahap, **then** tiga tahap Ajukan–Tinjau–Transfer tampil.
- **Given** penulis menekan "Ajukan penarikan", **when** aksi dijalankan, **then** teks status berubah menjadi konfirmasi pengajuan.
- **Given** jumlah di bawah Rp 100.000 *(produksi)*, **when** penulis menekan ajukan, **then** pengajuan ditolak dengan pesan batas minimum.

---

### FR-EARN-10 — Pintu masuk penghasilan dari studio & profil · P0

**Status: BARU.** Saat ini `author_analytics` hanya dapat dijangkau lewat **Help Center → Author tools**, dan `author_withdraw` hanya dari `author_analytics`. Ujung dari seluruh rantai kerja penulis terkubur di halaman bantuan.

**Deskripsi.** Penghasilan dan pencairan mendapat pintu masuk yang wajar dari tempat penulis bekerja.

**User story.** Sebagai penulis, saya ingin menemukan penghasilan saya dari studio atau profil, bukan dengan menelusuri halaman bantuan.

**Aturan bisnis.**
- **Tiga pintu masuk baru:**

  | Dari | Bentuk |
  |---|---|
  | `my_stories` | Metrik **Coins** pada ringkasan studio (FR-STUDIO-01) menjadi tautan ke `author_analytics.html` |
  | `my_stories` | Tautan **"Penghasilan & Pencairan"** di samping tautan "Riwayat Cetak" yang sudah ada |
  | `profile` | Menu **"Penghasilan penulis"** pada kelompok Akun, tampil hanya bagi penulis terdaftar (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-33) |

- Tautan `edit_profile` → **Payout identity** diarahkan ke `author_withdraw.html` lokal, menggantikan `../../alt/author_withdraw.html` (menutup §7 no. 1).
- `author_analytics` menambahkan tombol kembali menuju `my_stories.html` yang sudah ada, dan mempertahankan tautan "Tarik penghasilan".
- Menu penghasilan **tidak tampil** bagi pengguna yang belum mendaftar sebagai penulis.

**Acceptance criteria.**
- **Given** penulis membuka `my_stories`, **when** menekan metrik Coins, **then** `author_analytics.html` terbuka.
- **Given** penulis membuka profil, **when** melihat kelompok Akun, **then** menu "Penghasilan penulis" tampil.
- **Given** pengguna belum mendaftar sebagai penulis, **when** membuka profil, **then** menu penghasilan tidak tampil.
- **Given** penulis membuka `edit_profile` dan menekan "Review" pada Payout identity, **when** aksi dijalankan, **then** `author_withdraw.html` di folder ini yang terbuka.

---

### FR-EARN-11 — Validasi pengajuan penarikan · P0

**Status: BARU.** Saat ini batas minimum Rp 100.000 hanya ditulis sebagai keterangan; pengajuan Rp 0 pun diterima, dan jumlah tidak dibatasi saldo.

**Deskripsi.** Pengajuan penarikan diperiksa terhadap batas minimum, saldo tersedia, dan kelengkapan syarat akun sebelum dikirim.

**User story.** Sebagai penulis, saya ingin dicegah mengajukan penarikan yang pasti ditolak, agar tidak menunggu sia-sia.

**Aturan bisnis.**

| Urutan | Aturan | Pesan |
|---|---|---|
| 1 | Jumlah > 0 | `Masukkan jumlah penarikan` |
| 2 | Jumlah ≥ **Rp 100.000** | `Penarikan minimum Rp 100.000` |
| 3 | Jumlah ≤ saldo tersedia | `Jumlah melebihi saldo tersedia` |
| 4 | Rekening tujuan terverifikasi | `Verifikasi rekening tujuan terlebih dahulu` |
| 5 | Verifikasi 2 langkah aktif | `Aktifkan verifikasi 2 langkah untuk mencairkan dana` + tautan ke `settings_security.html` |

- Validasi berhenti pada kesalahan pertama, memakai pola yang sama dengan editor cerita (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-16).
- Tombol pengajuan **nonaktif** selama jumlah belum valid — bukan menolak setelah ditekan.
- Syarat 4 dan 5 sudah dinyatakan di `edit_profile` dan `settings_security`; requirement ini yang menegakkannya.
- Tersedia pintasan **"Tarik semua"** yang mengisi kolom dengan saldo tersedia.
- Setelah pengajuan berhasil, saldo tersedia **langsung berkurang** sebesar jumlah yang diajukan (ditahan), sehingga penulis tidak dapat mengajukan dua kali atas dana yang sama.

**Acceptance criteria.**
- **Given** kolom jumlah kosong, **when** halaman dirender, **then** tombol pengajuan nonaktif.
- **Given** penulis mengisi Rp 50.000, **when** validasi berjalan, **then** pesan batas minimum tampil dan tombol tetap nonaktif.
- **Given** saldo Rp 8.420.000 dan penulis mengisi Rp 9.000.000, **when** validasi berjalan, **then** pesan melebihi saldo tampil.
- **Given** verifikasi 2 langkah belum aktif, **when** penulis menekan ajukan, **then** pengajuan ditahan disertai tautan ke halaman keamanan.
- **Given** penulis menekan "Tarik semua", **when** aksi dijalankan, **then** kolom terisi seluruh saldo tersedia dan ringkasan biaya diperbarui.
- **Given** pengajuan berhasil, **when** halaman dirender ulang, **then** saldo tersedia sudah berkurang sebesar jumlah yang diajukan.

---

### FR-EARN-12 — Riwayat penarikan & konversi koin · P1

**Status: BARU.** Saat ini tidak ada riwayat pencairan, dan tidak ada satu pun tempat yang menjelaskan bagaimana koin menjadi rupiah.

**Deskripsi.** Daftar pengajuan penarikan beserta statusnya, dan penjelasan konversi koin ke rupiah.

**User story.** Sebagai penulis, saya ingin melacak pencairan saya sebelumnya dan memahami bagaimana koin yang saya terima berubah menjadi rupiah.

**Aturan bisnis.**
- **Riwayat penarikan** menampilkan: tanggal pengajuan · jumlah diminta · biaya admin · diterima bersih · rekening tujuan (tersamar) · status.
- **Status mengikuti tiga tahap** yang sudah ada di halaman (FR-EARN-09): **Diajukan** → **Ditinjau** → **Ditransfer**, ditambah **Ditolak** dengan alasan.
- Bukti transfer dapat diunduh untuk pengajuan berstatus Ditransfer.
- **Konversi koin → rupiah dinyatakan eksplisit**: analitik penulis memakai satuan koin sedangkan penarikan memakai rupiah, dan sampai sekarang tidak ada kurs yang terlihat di mana pun. Halaman menampilkan kurs berlaku beserta contoh perhitungan.
- Bagi hasil **80% penulis / 20% platform** yang sudah dinyatakan di `chapter_access` (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-25) ditampilkan ulang di sini agar penulis melihat rantai lengkapnya: pembaca membayar → potongan platform → koin penulis → rupiah.
- Kurs dan bagi hasil diambil dari konfigurasi server, bukan konstanta.
- Penulis menerima notifikasi saat status penarikan berubah (lihat [`prd_11_search_notifications.md`](prd_11_search_notifications.md) FR-NOTIF-02).

**Acceptance criteria.**
- **Given** penulis pernah mengajukan penarikan, **when** membuka halaman penarikan, **then** riwayat pengajuan beserta statusnya tampil.
- **Given** sebuah penarikan berstatus Ditransfer, **when** penulis membuka rinciannya, **then** bukti transfer dapat diunduh.
- **Given** sebuah penarikan ditolak, **when** penulis membuka rinciannya, **then** alasan penolakan tampil.
- **Given** penulis melihat bagian konversi, **when** halaman dirender, **then** kurs koin ke rupiah dan bagi hasil 80/20 tampil beserta contoh perhitungan.

---

## 5. State & Persistensi

**Tidak ada `localStorage`.** Seluruh state hidup di DOM.

| State | Tempat | Hilang saat |
|---|---|---|
| Sudut pandang analisis aktif | Kelas `active` | Halaman dimuat ulang |
| Jumlah penarikan | Nilai input | Halaman dimuat ulang |
| Status pengajuan | Teks `#note` | Halaman dimuat ulang |

---

## 6. Navigasi

**Masuk ke modul:** `help_center.html` → `author_analytics.html` (satu-satunya tautan masuk dari dalam folder) · `edit_profile.html` → `../../alt/author_withdraw.html` *(keluar folder)*.

**Internal:** `author_analytics` → `author_withdraw` · `author_analytics` → `my_stories`.

**Keluar dari modul:** `my_stories.html` (tombol kembali pada kedua halaman).

---

## 7. Catatan Prototype vs Produksi

| # | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | **`author_withdraw` tidak dapat dijangkau dari dalam folder** kecuali lewat `author_analytics`; `edit_profile` justru menautkan versi di `../../alt/` | Fitur pencairan praktis tersembunyi | Tambahkan tautan dari `profile.html` dan `my_stories.html`; arahkan `edit_profile` ke halaman lokal |
| 2 | **Batas minimum Rp 100.000 tidak divalidasi** — pengajuan Rp 0 pun diterima | Pengajuan tidak valid masuk ke antrean | Tolak jumlah di bawah minimum dan yang melebihi saldo, dengan pesan jelas |
| 3 | **Jumlah penarikan tidak dibatasi saldo** | Penulis bisa mengajukan lebih dari yang dimiliki | Validasi terhadap saldo tersedia |
| 4 | **Pemilih sudut pandang tidak mengganti isi** — hanya gaya aktif | Dua dari tiga sudut pandang tidak pernah terlihat | Sambungkan ke pemuatan data per sudut pandang |
| 5 | **Rentang 30 hari tetap**, tidak bisa diubah — berbeda dari `story_analytics` yang punya lima rentang | Tidak konsisten antar halaman analitik | Samakan pemilih rentang dengan `story_analytics` |
| 6 | **Hanya satu rekening**, tidak bisa ditambah, diubah, atau diverifikasi ulang | Penulis terkunci pada satu rekening | Tambahkan pengelolaan rekening beserta alur verifikasi |
| 7 | **Biaya admin di-hardcode Rp 5.000** | Perubahan kebijakan biaya butuh ubah kode | Ambil dari konfigurasi server; dukung biaya berjenjang atau persentase |
| 8 | **Tidak ada riwayat penarikan** | Penulis tidak dapat melacak pencairan sebelumnya | Tambahkan daftar riwayat dengan status per pengajuan |
| 9 | **Tidak ada pemisahan koin dan rupiah** — analitik memakai koin, penarikan memakai rupiah, tanpa kurs yang terlihat | Penulis tidak tahu konversi koin ke rupiah | Tampilkan kurs koin → rupiah secara eksplisit |
| 10 | Seluruh angka analitik dan saldo hardcoded | Tidak mencerminkan data nyata | Sambungkan ke `../../docs/api_author_earnings.md` |
| 11 | Tidak ada informasi pajak atau potongan lain selain biaya admin | Tidak sesuai kebutuhan pembayaran nyata | Tambahkan rincian pajak bila berlaku |
