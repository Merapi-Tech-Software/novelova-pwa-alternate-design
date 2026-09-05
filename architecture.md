# Novelova PWA — Arsitektur

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

> Rancangan teknis untuk membangun ulang prototipe Novelova (34 halaman HTML statis) menjadi satu Progressive Web App yang responsif di HP dan desktop.
> Sumber requirement: `PRD Novelova/prd_00..12` — **12 modul**, termasuk revisi yang menambahkan `prd_11` (pencarian & notifikasi), `prd_12` (sosial), dan 56 requirement baru.
> Sumber visual: `prd_01_design_system.md` §3–§6. Referensi struktur layar: `Novelova.dc.html` — **41 layar** (13 → 23 → 37 → 41), `NovelovaNav.dc.html` untuk bilah nav, dan `novelova-data.js` (25 koleksi) sebagai data contohnya.
> Pendamping: [`todo.md`](todo.md) — rencana kerja bertahap.
>
> **Revisi terakhir: §1.9 dan §1.10 — status studio yang diturunkan, dan dua penyimpangan implementasi dari kalimat PRD.** Dampak PRD di §1.1 · cakupan desain di §1.2 · tempat mockup lebih ringkas dari PRD di §1.3 · keadaan gagal (di luar PRD) di §1.4 · tiga layar terakhir dan dua tempat kanvas bertentangan dengan PRD di §1.5 · **dua perubahan produk yang menimpa PRD di §1.6 dan §1.8** · dua requirement PRD yang bertabrakan di §1.7 · status studio yang diturunkan di §1.9 · **dua penyimpangan implementasi di §1.10**.

---

## 1. Keputusan Pokok

Empat keputusan yang mengunci seluruh dokumen ini:

| # | Keputusan | Konsekuensi |
|---|---|---|
| 1 | **Design system = PRD 01 (rose-gold)** — krem `#f4efea`, aksen `#d09a93`, Manrope untuk UI, Cormorant Garamond untuk judul, radius pill `999px` | 41 layar di `Novelova.dc.html` dipakai sebagai acuan **struktur & copy**, bukan warna/tipografi. Palet Classical (`_ds/`) tidak dipakai. |
| 2 | **Frontend dulu, API mock** | Ada satu *seam* API bertipe kuat. Implementasi mock menyimpan data nyata di IndexedDB. Ganti ke backend nyata = tukar satu folder, komponen tidak disentuh. |
| 3 | **Bahasa UI: Indonesia saja, siap i18n** | Semua string di `src/i18n/id.ts`. Tanpa library i18n. Konten bab tetap dwibahasa ID/EN (FR-STUDIO-19) — itu model data, bukan UI. |
| 4 | **Pembayaran & iklan disimulasikan, provider dapat ditukar** | Alur UI, timer kedaluwarsa, idempotency, dan pencatatan ledger dibangun **nyata**. Hanya panggilan ke provider yang palsu. |

**Yang secara sadar dibuang dari prototipe:** frame ponsel di tengah viewport (PRD 01 §9.2 rec #3 — itu alat presentasi mockup, bukan produk), tiga sub-sistem desain yang hidup berdampingan (§2), dan seluruh dependensi CDN (Google Fonts, FontAwesome, picsum, icons8, randomuser).

### 1.1 Dampak revisi PRD

Revisi menambahkan **dua modul baru** dan **56 requirement bertanda `Status: BARU`**. Empat di antaranya mengubah arsitektur, sisanya menambah permukaan.

| # | Yang berubah | Sebabnya | Konsekuensi di dokumen ini |
|---|---|---|---|
| 1 | **Batas server/perangkat jadi tegas** | FR-CORE-01 | Kepemilikan, uang, progres, koleksi, naskah, privasi, dan bahasa **wajib di balik seam API** — bukan di Zustand. Dexie adalah *server tiruan*, bukan cache klien. §7 ditulis ulang. |
| 2 | **Sesi nyata dengan penjaga rute** | FR-AUTH-12 | Token akses di memori, refresh di cookie `HttpOnly`. Sesi kedaluwarsa → lembar masuk ulang, **bukan** redirect yang menghapus naskah. §8 + §17 batasan 1. |
| 3 | **Empat keadaan render jadi kontrak, bukan kebiasaan** | FR-CORE-02, FR-CORE-03 | Memuat · berhasil · **kosong** · **gagal** — kosong dan gagal tidak boleh sama. Mutasi memakai pembaruan optimistis dengan pengembalian. Komponen `AsyncState` + `EmptyState` naik ke §9.3. |
| 4 | **Daftar besar disaring di server** | FR-LIB-11, FR-SRCH-02, prd_11 §7 #1 | `FilterableList` berubah dari penyaring DOM menjadi penyaji yang digerakkan parameter URL → kueri server berpaginasi. Penyaringan klien hanya untuk daftar yang pasti kecil. |
| 5 | Dua modul baru: **pencarian & notifikasi** (prd_11), **sosial** (prd_12) | — | 4 halaman baru + 6 halaman yang menutup alur menggantung. §8 bertambah 11 rute. |

**Catatan urutan.** PRD §12 memberi urutan pengerjaannya sendiri (7 tahap). Urutan itu disusun untuk **menambal prototipe yang sudah ada** — karena itu ia menaruh loop uang di depan penemuan. Kita membangun dari nol, jadi urutan dependensinya berbeda: beranda harus ada sebelum detail cerita punya jalan masuk. Pemetaan keduanya ada di [`todo.md`](todo.md) §Ringkasan Fase.

### 1.2 Cakupan desain

`Novelova.dc.html` sudah diperbarui tiga kali: **13 → 23** layar mengikuti revisi PRD, **23 → 37** pada pembaruan desain, lalu **37 → 41** pada seksi `8a`. Kanvas kini punya delapan seksi:

| Seksi | Isi | Layar |
|---|---|---|
| `1a` Novelova | Delapan layar inti pembaca | 01–08 |
| `2a` Sisi Penulis | Rantai kerja penulis | 09–13 |
| `3a` Penghasilan Penulis | Bagi hasil & pencairan | 14–15 |
| `4a` Notifikasi & Sosial | Pusat notifikasi, ulasan, komentar | 16–18 |
| `5a` Gerbang Masuk & Hadiah | Auth, onboarding, hadiah | 19–23 |
| `6a` Akun, Pengaturan & Bantuan | **Baru** — klaster profil sampai legal | 24–31 |
| `7a` Keadaan Gagal | Dinyatakan “di luar PRD” — lihat §1.4 | 32–37 |
| `8a` Tiga Sisa & Errornya | **Baru** — tiga rute Author Studio terakhir + spesifikasi kegagalannya, lihat §1.5 | 38–41 |

**Keputusan design system tidak berubah.** Kanvas masih memakai `_ds/classical-…` — krem `#f3f2f2`, aksen emas `#b68235`, Cormorant Garamond + Lora, radius 2/4/7px. Token-nya identik dengan dua revisi sebelumnya; berkasnya hanya diekspor ulang. Jadi keputusan #1 tetap berlaku: **kanvas dipakai sebagai acuan struktur, anatomi layar, dan copy — bukan warna, tipografi, atau radius.** Produksi memakai palet rose-gold PRD 01 (§9.1).

**Berkas kedua: `NovelovaNav.dc.html`.** Komponen tersendiri berisi bilah nav bawah lima tab dengan satu prop `active` — **Beranda · Isi Koin · Pustaka · Karya · Profil**. Ini menetapkan isi `BottomNav` (§9.3, §9.4), yang sebelumnya hanya disebut “lima tab” tanpa daftar. Perhatikan tab ketiga berlabel **Pustaka**, bukan “Perpustakaan” — label pendek untuk nav, judul panjang untuk halaman.

**41 layar yang punya acuan visual**, dipetakan ke rute (§8):

| # | Layar | Rute | # | Layar | Rute |
|---|---|---|---|---|---|
| 01 | Beranda | `/` | 20 | Daftar | `/daftar` |
| 02 | Pencarian | `/cari` | 21 | Lupa kata sandi | `/lupa-sandi` |
| 03 | Populer — lihat semua | `/jelajah/:kategori` | 22 | Pengenalan | `/mulai` |
| 04 | Detail cerita | `/cerita/:id` | 23 | Pusat hadiah | `/hadiah` |
| 05 | Ruang baca | `/cerita/:id/bab/:id` | 24 | Profil | `/profil` |
| 06 | Perpustakaan | `/pustaka` | 25 | Ubah profil | `/profil/ubah` |
| 07 | Isi koin | `/koin` | 26 | Profil publik | `/pengguna/:userId` |
| 08 | Riwayat dompet | `/koin/transaksi` | 27 | Pengikut & mengikuti | `/profil/koneksi` |
| 09 | Karya saya | `/karya` | 28 | Bahasa & wilayah | `/pengaturan/bahasa` |
| 10 | Kelola bab | `/karya/:id/bab` | 29 | Keamanan | `/pengaturan/keamanan` |
| 11 | Editor bab | `/karya/:id/bab/:id/ubah` | 30 | Pusat bantuan | `/bantuan` |
| 12 | Akses bab | `/karya/:id/bab/:id/akses` | 31 | Legal | `/legal/ketentuan` · `/legal/privasi` |
| 13 | Analitik cerita | `/karya/:id/analitik` | 32 | Gagal memuat | sisipan · semua rute |
| 14 | Penghasilan | `/penulis/analitik` | 33 | Tanpa koneksi | layar penuh · global |
| 15 | Tarik penghasilan | `/penulis/penarikan` | 34 | Pembayaran gagal | `/koin` |
| 16 | Notifikasi | `/notifikasi` (+ pengaturan sebagai lembar) | 35 | Draf gagal tersimpan | editor bab |
| 17 | Ulasan cerita | `/cerita/:id/ulasan` | 36 | Sesi & akses | global |
| 18 | Komentar bab | `/cerita/:id/bab/:id/komentar` | 37 | Bab ditarik | `/cerita/:id/bab/:id` |
| 19 | Masuk | `/masuk` | 38 | Formulir cerita | `/karya/baru` · `/karya/:id/ubah` |
| 39 | Riwayat cetak | `/karya/cetak` | 40 | Jadwal terpadu | `/karya/jadwal` |
| 41 | Keadaan gagal tiga fitur di atas | spesifikasi, bukan rute | | | |

**Yang tersisa tanpa acuan visual — tiga rute, dibangun dari teks PRD saja:** onboarding & verifikasi penulis (`/karya/daftar-penulis`) · detail transaksi (`/koin/transaksi/:txId`) · riwayat pencairan (`/penulis/penarikan/riwayat`).

Kesenjangannya menutup dari dua arah. Pembaruan sebelumnya melengkapi klaster profil–pengaturan–bantuan–legal (delapan layar, dari nol); seksi `8a` melengkapi Author Studio (tiga layar). Yang tersisa adalah satu alur pendaftaran dan dua halaman riwayat — seluruhnya formulir dan tabel yang polanya sudah ditetapkan layar lain, jadi tidak ada lagi keputusan visual besar yang tertunda.

**Satu koreksi rute yang datang dari desain.** Ekspor data dan penghapusan akun sebelumnya diberi rute sendiri (`/pengaturan/data`). Kanvas menggambarnya sebagai blok **“Data & akun” di dalam layar Keamanan** — dan FR-SET-05 memang menyebut `settings_security` sebagai tempatnya. Rute terpisah itu dihapus; §8 diperbarui.

### 1.3 Di mana desain lebih ringkas daripada PRD

Mockup menyederhanakan tiga hal yang PRD tetapkan lebih tegas. **PRD yang berlaku** — jangan berhenti saat tampilan sudah menyerupai kanvas:

| Yang ada di kanvas | Yang PRD minta | FR |
|---|---|---|
| Tautan *"Saldo kurang? Isi koin dulu"* di gerbang unlock | Lembar berisi kekurangan koin yang tepat (`"Kurang 1.200 koin"`), saldo saat ini, tombol Isi koin **berkonteks** (`?return=&chapter_id=&need=`), dan alternatif iklan | FR-READ-17 |
| Daftar bab tanpa tombol lanjutan | Tombol utama **"Lanjutkan — Bab N"** di atas daftar, atau **"Mulai dari Bab 1"** bila belum pernah membaca | FR-DETAIL-14 |
| Ruang baca membuka bab dari awal | Tawaran **"Lanjutkan dari posisi terakhir"** saat membuka bab yang pernah dibaca sebagian | FR-READ-16 |

Ketiganya adalah bagian dari alur yang terputus di §15.1 (nomor 1, 3, dan 4) — justru bagian yang paling tidak boleh ikut disederhanakan.

### 1.4 Keadaan gagal — bagian desain yang mendahului PRD

Seksi `7a` kanvas menyatakan dirinya **“di luar PRD”**: tidak ada requirement yang memintanya. Ia ada karena aplikasi ini memegang dua hal yang pengguna takut kehilangan — **uang dalam bentuk koin, dan tulisan yang belum tersimpan.** Karena itu ia diperlakukan sebagai bagian dari kontrak, bukan hiasan.

**Kontrak copy.** Setiap pesan gagal menjawab tiga hal dalam urutan tetap:

1. **Apa yang terjadi** — kalimat lugas, tanpa jargon.
2. **Apakah uang atau tulisanmu aman** — selalu dinyatakan eksplisit, walau jawabannya “ya”.
3. **Satu tindakan berikutnya** — tombol, bukan saran.

Pada tingkat **layar penuh**, jaminan itu mendapat kotaknya sendiri berlabel “Yang tetap aman” (kanvas layar 36) — di situlah mata berhenti, dan itu satu-satunya kalimat yang benar-benar menjawab *“uangku bagaimana?”*. Pada tingkat lain ia satu baris.

Kode teknis (`PAY-504`, `AUTH-429`, …) selalu ada tetapi **selalu sekunder**: ia untuk dibacakan ke tim dukungan, bukan untuk dipahami pengguna. Tidak ada pesan yang menyalahkan pengguna, dan tidak ada yang berhenti di “terjadi kesalahan”.

**Empat tingkat penyampaian**, dipilih menurut seberapa banyak yang masih bisa dikerjakan pengguna — inilah yang memberi `AsyncState` varian gagalnya (§9.3):

| Tingkat | Kapan | Perilaku |
|---|---|---|
| **Inline** | Satu kolom salah | Menempel di kolomnya. Sisa formulir tidak bergerak. |
| **Toast** | Aksi gagal, halaman tetap utuh | Muncul 4 detik, membawa satu tombol coba lagi. |
| **Sisipan** | Satu bagian gagal, sisanya jalan | Mengganti bagian itu saja, bukan seluruh layar. |
| **Layar penuh** | Tidak ada yang bisa dikerjakan | Menghentikan segalanya — **wajib** menawarkan jalan keluar. |

**Enam layar, dan konsekuensi arsitekturnya.** Ini bukan sekadar salinan teks — empat di antaranya menuntut keadaan yang harus ada di model domain:

| Layar | Isi | Yang harus ada di kode |
|---|---|---|
| 32 Gagal memuat | Sisipan menggantikan bagian rekomendasi | `AsyncState` per-section, bukan per-halaman. Label coba-lagi **naik** setelah dua kegagalan (*“Coba sekali lagi”*) — hitungan retry adalah state komponen. |
| 33 Tanpa koneksi | Layar penuh + daftar bab tersimpan offline | `navigator.onLine` + listener `online`/`offline`; jalan keluarnya adalah bacaan offline (§10.3), bukan tombol muat ulang. |
| 34 Pembayaran gagal | Tiga varian: **ditolak bank** (`PAY-402`) · **belum dipastikan** (`PAY-504`) · **kedaluwarsa** (`PAY-410`) | `TopUpOrder.status` butuh nilai **`pending_reconciliation`**, bukan sekadar gagal. Selama status itu tombol bayar **dikunci**: *“Jangan bayar dua kali”*. Server-mock merekonsiliasi sendiri setelah 10 menit, lalu memicu notifikasi. |
| 35 Draf gagal tersimpan | `DRAFT-409` setelah autosave gagal 4× | **Editor tidak boleh dibekukan.** Tiga jalan keluar wajib: Simpan sekarang · Salin seluruh naskah (clipboard) · Unduh sebagai berkas (Blob `.txt`). Menghalangi penulis mengetik saat penyimpanan gagal justru memperbesar kemungkinan tulisannya hilang. |
| 36 Sesi & akses | Tiga varian: **kedaluwarsa** (`AUTH-401`, 30 hari) · **terlalu banyak percobaan** (`AUTH-429`, 5 gagal → tahan 15 menit) · **versi terlalu lama** (`APP-426`) | Rate limit masuk dicatat per perangkat di server-mock beserta waktu buka kembali, dan dicek **sebelum** kredensial disentuh — kata sandi yang benar pun ditolak selama penahanan. Waktu buka kembali ikut di `ApiError.retryAt`, bukan terkubur di dalam kalimat pesannya. Versi minimum datang dari server (`APP-426`) atau `VITE_MIN_SUPPORTED_VERSION`; **bukan** dari service worker — SW tidak tahu batas yang ditetapkan server. |
| 37 Bab ditarik | `CONTENT-410` — penulis menarik bab yang sudah dibeli | **Refund otomatis**: satu baris ledger balik, bukan penanganan manual. Plus “Beri tahu saya” saat bab terbit ulang (FR-NOTIF-02) dan tautan lanjut ke bab berikutnya. |

Konsekuensinya pada seam (§5 aturan 2): `ApiError.code` bukan string bebas. Ia memakai kode yang sama dengan yang tampil di layar, sehingga apa yang dibacakan pengguna ke dukungan cocok dengan apa yang ada di log.


### 1.5 Tiga layar terakhir — dan dua tempat kanvas bertentangan dengan PRD

Seksi `8a` menutup tiga rute Author Studio yang selama dua revisi hanya punya teks PRD, plus satu layar yang menspesifikasikan kegagalan ketiganya. Kanvas menyatakan alasan pengelompokannya sendiri: formulir cerita memikul **tujuh FR sekaligus**, jadi ia dibuat **satu layar dua mode** — `baru` dan `sunting` — alih-alih dua halaman kembar.

| # | Layar | Rute | FR |
|---|---|---|---|
| 38 | Formulir cerita, mode `baru` & `sunting` | `/karya/baru` · `/karya/:id/ubah` | FR-STUDIO-12..18, 35 |
| 39 | Riwayat cetak | `/karya/cetak` | FR-STUDIO-32 |
| 40 | Jadwal terpadu | `/karya/jadwal` | FR-STUDIO-37 |
| 41 | Keadaan gagal ketiganya | — spesifikasi, bukan rute | §1.4 |

**Apa yang membedakan kedua mode formulir.** Bukan kosmetik — tiga hal berubah:

- **Peringatan monetisasi terbalik.** Mode `baru` memperingatkan saat tipe **bukan** “Gratis Semua” (*“Bab yang ditandai berbayar akan terkunci bagi pembaca sampai mereka membelinya”*); mode `sunting` memperingatkan justru saat memilih **“Gratis Semua”**, dengan akibat yang dihitung: *“membuka 120 bab untuk semua pembaca. 412 pembeli tidak mendapat refund dan monetisasi berhenti.”* FR-STUDIO-15 menyebut pembalikan ini; kanvas memberi kalimatnya.
- **Zona bahaya hanya ada di mode `sunting`** — arsipkan · tandai tamat · hapus, masing-masing dengan akibat yang dinyatakan (*“120 bab dan 985rb pembaca dihapus permanen”*). Ketiganya lewat konfirmasi **ketik-ulang judul**; FR-STUDIO-18 mensyaratkannya untuk hapus saja, tetapi memakai satu pola untuk ketiganya lebih murah daripada memelihara dua.
- **Kotak sukses** memberi tiga langkah lanjutan (FR-STUDIO-35): tulis bab pertama → atur jadwal terbit → kembali ke Karya Saya. Pemulihan draf memulihkan **isi** beserta stempel waktunya, sesuai §7.1.

**Dua tempat kanvas bertentangan dengan PRD.** Berbeda dengan §1.3 — di mana kanvas hanya lebih ringkas — di sini angkanya berbeda dan modelnya berbeda. Putusannya sudah diambil; tabel di bawah adalah yang berlaku.

**(a) Formulir cerita — kanvas menentukan susunan, PRD menentukan angka.**

| Hal | Kanvas | PRD | Yang berlaku |
|---|---|---|---|
| Batas judul | 80 | **100** · FR-STUDIO-12, AC *“25/100”* | **PRD** |
| Batas sinopsis | 1200 | **1000** · FR-STUDIO-12 | **PRD** |
| Cover rasio meleset | Ditolak | **Tetap diterima** + saran, toleransi ±0,12 · FR-STUDIO-13 | **PRD** |
| Format & ukuran cover | Tidak digambar | JPG/PNG/WEBP, maks 5 MB | **PRD** |
| Bahasa cerita | Tidak digambar | Indonesia · English · Malay · FR-STUDIO-14 | **PRD** |
| Pengaturan lanjutan | Tidak digambar | Terjemahan · fanfiction · label konten · dedikasi · catatan penulis · FR-STUDIO-15 | **PRD** |
| Status & visibilitas | Tidak digambar | Chip status + visibilitas, panel hiatus, peringatan privat · FR-STUDIO-18 | **PRD** |
| Wajib minimal satu tag | Divalidasi | Tidak disyaratkan | **PRD** — validasi tetap tiga langkah: judul → sinopsis ≥50 → nama pena |
| Genre utama | Romance · Mystery · Fantasy · Drama · **Thriller** | Romance · Fantasy · **Horror** · Mystery · Drama | **Kanvas** — kosakata genrenya dipakai konsisten di beranda, pencarian, dan detail cerita; daftar PRD memotret prototipe lama |

Aturannya perpanjangan §1.3, bukan aturan baru: **kanvas menentukan susunan, anatomi, dan copy; PRD menentukan angka dan aturan validasi.** Satu pengecualian di baris terakhir, karena di situ kanvas konsisten dengan dirinya sendiri di lima layar lain sementara PRD tidak.

**(b) Riwayat cetak — lini masa PRD, keadaan gagal kanvas.** Keduanya memodelkan siklus pesanan secara berbeda; yang berlaku adalah gabungannya.

| Bagian | Sumber | Isi |
|---|---|---|
| Lini masa hardcopy | **PRD** FR-STUDIO-32 | Enam tahap: Diajukan → Dikonfirmasi → Dibayar → Dicetak → Dikirim → Diterima — bukan empat langkah kanvas |
| Identitas pesanan | **PRD** | `#HDC-YYYYMMDD-NNN` · `#SFT-YYYYMMDD-NNN`, Download Invoice, Hubungi Admin |
| Alasan penolakan | **PRD** | Konkret dan menyebut kebijakannya — *minimum 10 bab aktif agar layak dijilid* |
| Saringan & keadaan kosong per tab | **Kanvas** | Semua · PDF · Hardcopy · Berjalan. PRD menyebut halaman ini “tidak memiliki JavaScript” — itu deskripsi prototipe, bukan target |
| PDF gagal dibuat | **Kanvas** | `PRINT-504` — naskah 120 bab melewati batas 15 menit; jalan keluarnya **memecah jadi 3 berkas**, bukan sekadar coba lagi |
| Berkas kedaluwarsa | **Kanvas** | `PRINT-410` — masa simpan 30 hari yang sudah ada di PRD kini punya keadaan akhirnya; buat ulang gratis, tidak memotong kuota |
| Batal sebelum produksi | **Kanvas** | Boleh pada tahap Dikonfirmasi, ditolak setelah Dicetak — penolakannya **menjelaskan alasannya**, bukan sekadar menonaktifkan tombol |
| Biaya berubah | **Kanvas** | `PRINT-402`, layar penuh — admin menyesuaikan biaya; **belum ada yang ditagihkan**, penulis harus menyetujui sebelum produksi |

Empat baris terakhir tidak ada di PRD mana pun. Semuanya menyentuh uang penulis, jadi semuanya tunduk pada kontrak copy §1.4.

**Jadwal terpadu sejalan dengan PRD.** Layar 40 memenuhi FR-STUDIO-37 tanpa pertentangan: waktu disimpan **UTC beserta zona waktu penulis** lalu ditampilkan menurut zona pembaca, bentrok dan celah menjadi dua jenis peringatan terpisah, rekomendasi *“Sabtu 20.00”* datang dari analitik penulis, dan penutupnya menyatakan hal yang sama dengan PRD — *“Tiga penjadwal yang sudah ada tetap berfungsi. Tampilan ini merangkumnya, bukan menggantikannya.”* Satu hal yang PRD minta dan kanvas belum gambar: tombol **batalkan** per entri.

**Delapan kode kegagalan baru** (layar 41), seluruhnya mengikuti kontrak §1.4:

| Kode | Tingkat | Yang dijaga kalimatnya |
|---|---|---|
| `PRINT-504` | Sisipan | Naskah asli tidak tersentuh; tidak ada biaya untuk PDF |
| `PRINT-410` | Inline | Membuat ulang gratis dan tidak memotong kuota apa pun |
| `PRINT-409` | Toast | Biaya sudah terkonfirmasi → jalurnya klaim cetak, bukan pembatalan |
| `PRINT-402` | Layar penuh | Belum ada yang ditagihkan sebelum penulis menyetujui biaya baru |
| `SCHED-409` | Sisipan | Tidak ada bab yang terbit dua kali; yang kedua ditahan |
| `SCHED-422` | Inline | Bab tetap draf — tidak ada yang terbit tanpa jadwal yang sah |
| `SCHED-200` | Toast | Waktu tersimpan UTC, jadi momen terbit tidak bergeser — hanya tampilannya |
| `SCHED-000` | Sisipan | **Peringatan, bukan kegagalan** — hiatus yang disengaja tidak perlu diperbaiki |

Kegagalan formulir cerita seluruhnya **inline**: hanya satu kolom yang salah, sembilan kolom lain tidak perlu ikut ditandai. Dan bila penyimpanan gagal di sisi server, **formulir tidak dikosongkan** — isinya tetap dan tombol Simpan berubah menjadi *“Coba simpan lagi”*. Ini aturan yang sama dengan editor bab (layar 35): jangan menghukum penulis atas kegagalan jaringan dengan menghapus tulisannya.

---

### 1.6 Section beranda per tab — perubahan produk yang menimpa PRD

> **Ditimpa sebagian oleh §1.22 (5 September).** Tiga section teratas —
> Populer, Baru & Naik Cepat, Paling Banyak Dibuka — **berhenti ikut tersaring
> tab**; tabel di bawah masih menandainya "ya". Sisanya berlaku.

Permintaan produk 1 September 2026, di luar PRD dan kanvas. **Tiap tab punya section tematiknya sendiri**, dengan empat blok pertama yang tidak pernah berubah:

| # | Section | Ikut tersaring tab? |
|---|---|---|
| 1 | Unggulan (banner) | tidak — kurasi editorial |
| 2 | Populer | ya |
| 3 | Baru & Naik Cepat | ya |
| 4 | **Paling Banyak Dibuka** | ya |
| 5–6 | Tamat & Siap Dibaca · Gratis Hari Ini | ya |
| 7–8 | dua section kurasi khas tab | ya |
| 9 | Lanjut Membaca | tidak — bacaan pribadi |

Tiga hal yang ditimpanya, dan alasannya:

| Yang tertulis di PRD | Yang berlaku | Kenapa |
|---|---|---|
| FR-HOME-04: susunan section **tetap** | Kepala tetap, ekor mengikuti tab | Tab genre yang isinya sama persis dengan tab lain, hanya disaring, tidak memberi alasan berpindah tab |
| FR-HOME-04/06/10/11: **Editor's Picks** | **Paling Banyak Dibuka** — `stats.unlockCount` | Angka ekonomi yang jujur, bukan kurasi yang tidak ada redaksinya. Judulnya Bahasa Indonesia (keputusan #3) |
| FR-HOME-03: "My Kisah" salah satu dari tujuh genre | `Story.kind: 'fiksi' \| 'kisah'`, **tegak lurus** dengan genre | Kisah nyata bisa bergenre horor maupun drama; sebagai genre, kombinasi itu mustahil |

Dua batasan yang menyertainya. Kunci sakelar `sec-editor` **dipertahankan** walau nama section-nya berubah — menggantinya membuang pilihan yang sudah tersimpan di `home_section_visibility_v1` milik pengguna. Dan seluruh section tematik **berbagi satu sakelar** (bekas `sec-toprom`): sakelar yang datang-pergi mengikuti tab bukan pengaturan.

Registry-nya di `api/mock/handlers/sections.ts`, dibaca perakit feed **dan** `getSection`, sehingga halaman lihat-semua tidak mungkin memakai aturan yang berbeda dari section yang baru saja diketuk. Id section sekaligus kata rutenya (`/jelajah/romance-kantor`), jadi tiap section tematik otomatis punya halaman daftarnya sendiri tanpa tabel pemetaan yang harus dijaga sinkron.

---

### 1.7 Satu tempat dua requirement PRD bertabrakan

FR-AUTH-11 menulis *"genre terpilih memengaruhi **urutan section** beranda"*, sementara FR-HOME-04 menulis *"urutan section di feed bersifat **tetap** dan tidak dapat diubah pengguna"*. Keduanya tidak bisa benar apa adanya.

Yang menyelesaikannya adalah kriteria penerimaan FR-AUTH-11 sendiri: *"beranda menampilkan section yang **mengutamakan** genre tersebut"* — yang diutamakan **isinya**, bukan posisi section-nya. Jadi favorit onboarding bekerja di dua tempat:

1. **Urutan tab genre** — favorit di depan (FR-HOME-13 menyebutkannya eksplisit).
2. **Isi tiap section** — cerita bergenre favorit naik ke depan, tanpa membuang yang lain.

Susunan **kepala** section tetap (lihat §1.6): Unggulan · Populer · Baru & Naik Cepat · Paling Banyak Dibuka, dengan dua slot iklan menempel setelah Populer dan setelah Paling Banyak Dibuka. Yang berganti mengikuti tab adalah ekornya. Judulnya berbahasa Indonesia — PRD menuliskannya dalam bahasa Inggris karena prototipe begitu, tetapi kanvas yang menentukan copy dan keputusan #3 menetapkan UI berbahasa Indonesia. Dan tidak ada yang terkunci — seluruh tab tetap tersedia, cerita di luar favorit tetap tampil, dan tiap cerita tetap dapat dibuka lewat pencarian maupun tautan langsung.

### 1.8 Paket koin vs kolom kustom — perubahan produk yang menimpa PRD

Permintaan produk 1 September 2026. FR-WALLET-02/03 menetapkan kedua cara memilih jumlah koin **saling mengosongkan**: memilih paket menghapus isi kolom kustom, mengetik di kolom membatalkan pilihan paket, dan keduanya tetap dapat ditekan kapan saja. Yang berlaku sekarang: yang tidak terpakai **dinonaktifkan**.

| Keadaan | Kartu paket | Kolom kustom |
|---|---|---|
| Belum memilih apa pun | hidup | hidup |
| Satu paket terpilih | hidup — yang terpilih menjadi tombol batal | **nonaktif** |
| Kolom kustom berisi | **nonaktif** | hidup |

**Jalan kembalinya wajib ada, dan itu bagian dari keputusannya.** Menonaktifkan tanpa jalan kembali berarti mengunci pembaca di cara yang terlanjur ia pilih — pertanyaan yang tidak dijawab PRD maupun kanvas, dan yang karenanya ditanyakan lebih dulu. Yang dipilih: **menekan paket yang sudah terpilih membatalkannya**, dan mengosongkan kolom kustom menghidupkan kembali kartu paket. Tidak ada kontrol baru di layar yang sudah punya tiga langkah.

Kartu paket mati **begitu kolomnya berisi**, termasuk saat isinya belum sah (mis. `7`) — di situlah pembaca justru sedang mengetik, dan menunggu angkanya sah lebih dulu akan membuat enam kartu berkedip hidup-mati per ketikan.

`aria-label` paket terpilih berubah menjadi *"Batalkan pilihan paket 500 koin"*: fungsi gandanya harus terbaca juga tanpa melihat layar.

Yang **tidak** berubah: seluruh aturan angka FR-WALLET-03 tetap berlaku apa adanya — minimum 100 koin, `Math.round(coins × 130 / 100) × 100`, tiga keadaan kolom, dan mundur ke jumlah tidak sah tetap menutup langkah berikutnya.

---

### 1.9 Tujuh status cerita, bukan lima — dan delapan tab, bukan enam

Dua requirement PRD saling melengkapi, dan yang ketiga lupa ikut menyesuaikan.

FR-STUDIO-02 menyebut **lima** status kartu (`published` · `draft` · `scheduled` · `completed` · `archived`), dan FR-STUDIO-03 membangun **enam tab** di atasnya (lima + "Semua"). Lalu FR-STUDIO-38 menambahkan dua status baru dengan kalimatnya sendiri: *"Dua status baru **melengkapi** lima status cerita yang sudah ada (FR-STUDIO-02)."* — `Dalam tinjauan` dan `Ditolak`.

Yang tidak ikut diperbarui adalah daftar tab FR-STUDIO-03. Membiarkannya berarti **cerita yang ditolak tidak punya satu pun saringan yang menampilkannya**, dan penulisnya tidak pernah menemukan alasan penolakan yang FR-STUDIO-38 sendiri wajibkan spesifik. Jadi yang berlaku: tujuh status, delapan tab.

Statusnya **diturunkan, bukan disimpan.** Tidak ada kolom `studioStatus` di basis data; server menghitungnya dari `review × status × visibility × jadwal terbit`, dengan urutan yang bukan selera:

| Urutan periksa | Hasil | Alasan |
|---|---|---|
| `review === 'in_review'` | `in_review` | Cerita yang sedang ditinjau belum tentu draf |
| `review === 'rejected'` | `rejected` | Sama — penolakan mendahului segalanya |
| `review === 'draft'` + ada jadwal | `scheduled` | Draf berjadwal adalah draf yang sudah punya tanggal |
| ada jadwal di masa depan | `scheduled` | |
| `visibility === 'private'` | `archived` | Hanya bagi cerita yang **pernah** terbit; draf privat tetap draf |
| `status === 'completed'` | `completed` | |
| selain itu | `published` | |

Satu keadaan yang ditulis di dua tempat cepat atau lambat berselisih dengan dirinya sendiri; menurunkannya berarti tidak ada yang bisa lupa memperbaruinya.

**Aturan yang sama berlaku di tingkat bab.** FR-STUDIO-08 menyebut empat status bab (`draft` · `scheduled` · `published` · `private`) dan FR-STUDIO-09 membangun **empat tab** di atasnya — tetapi hanya tiga: Semua · Draft · Terjadwal · Publish. `private` punya statusnya sendiri di FR-STUDIO-08 namun tidak punya tab, dan FR-STUDIO-38 menambahkan `Dalam tinjauan` dan `Ditolak` yang *"ikut dalam saringan tab"*. Yang berlaku: **enam status bab, tujuh tab.** Alasannya identik — status tanpa saringan adalah status yang penulisnya tidak akan pernah temukan.

Diturunkan juga, dari `state` × `review`: tinjauan mendahului keadaan terbit, karena bab yang sedang ditinjau tersimpan sebagai `draft` tetapi yang perlu dilihat penulisnya adalah bahwa ia sedang menunggu keputusan.

Aturan **Analisa dibalik** dari prototipe di sini juga (PRD 07 §7 #1): di sana justru cerita terbit yang kehilangan tautan analitiknya — padahal hanya cerita terbit yang punya angka untuk dianalisa. Yang berlaku: Analisa tampil untuk `published` dan `completed`.

---

### 1.10 Dua tempat implementasi menyimpang dari kalimat PRD

Berbeda dengan §1.6 dan §1.8 — di sana **produk** yang memutuskan lain. Di sini kalimat PRD-nya diikuti maksudnya, bukan mekanismenya, karena mekanisme yang disebut bertentangan dengan model data yang sudah dipilih.

**(a) Bilah alat editor bab: markdown, bukan `contenteditable`.**

Rencana kerja menyebut *"bold/italic/kutip/paragraf via `contenteditable` + markdown"*. Yang dibangun **hanya markdown pada `textarea`**, dan itu keputusan sadar dengan dua alasan:

- `document.execCommand` — satu-satunya cara praktis memformat di `contenteditable` — sudah **usang** dan perilakunya berbeda antar peramban.
- Hasilnya HTML, sementara `ChapterContent.body` menyimpan **larik paragraf teks**. Menyimpan HTML berarti pembaca merender markup yang ditulis editor, dan `ChapterContent` berhenti jadi teks.

Markdown pada `textarea` menjaga apa yang diketik sama dengan apa yang disimpan, dan naskahnya tetap terbaca kalau bilah alatnya tidak pernah disentuh. FR-STUDIO-19 sendiri hanya mensyaratkan bilah alat itu **berfungsi**; mekanismenya tidak disebut PRD.

**(b) Konteks bab dibawa parameter rute, bukan `?chapter_id=`.**

FR-STUDIO-36 menulis halaman akses *"dibuka dengan `?chapter_id=<id>`"*. Yang dipakai `/karya/:storyId/bab/:chapterId/akses` — bentuk yang sudah jadi pola seluruh rute studio di tabel rute §8, dan yang membuat guard rute serta `fallback` bekerja tanpa kasus khusus.

Yang dituntut FR-STUDIO-36 sebenarnya bukan bentuk URL-nya, melainkan bahwa halaman itu **tahu bab mana yang sedang diatur** — dan seluruh aturannya (bab pertama, jumlah pembeli, masa tahan tujuh hari, gerbang verifikasi) ditegakkan dari bab itu. Itu terpenuhi.

---

---

### 1.11 Tinjauan berlaku untuk bab juga — dan antreannya diturunkan

FR-STUDIO-38 menulis alur tinjauan dengan subjek **cerita**: dikirim, ditinjau, disetujui atau ditolak beserta alasannya. Kalimat itu diikuti apa adanya sampai Fase 8f, dan hasilnya sebuah lubang: `publishChapter` menayangkan bab seketika, sehingga penulis yang ceritanya sudah lolos tinjauan bisa menerbitkan naskah apa pun setelahnya tanpa dilihat siapa pun. Yang dijaga PRD adalah **isi yang sampai ke pembaca**, bukan baris basis datanya.

Jadi `publishChapter` kini bercabang pada satu pertanyaan: **apakah bab ini pernah lolos tinjauan?**

| Keadaan bab | Hasil menekan "Terbitkan" |
|---|---|
| `review === 'published'` (pernah lolos) | Langsung tayang; bab privat ikut jadi `free` |
| selain itu (naskah baru, atau ditolak) | `review: 'in_review'`, `state: 'draft'`, `publishAt: null` |

Bab yang sudah pernah tayang lalu disunting tidak ditahan ulang. Itu batas yang disengaja: menahan setiap perbaikan salah ketik akan membuat penulis berhenti memperbaikinya. Kalau kelak revisi besar perlu ditinjau ulang, pembandingnya adalah panjang naskah, bukan fakta bahwa ia berubah.

**Antreannya tidak disimpan.** Sama alasannya dengan tujuh status cerita di §1.9: `listReviewQueue` menghitung barisnya dari empat sumber pada tiap pembacaan — cerita `in_review`/`rejected`, bab `in_review`/`rejected`, laporan pembaca (Fase 10), dan pesanan cetak yang menunggu konfirmasi. Tabel antrean tersendiri akan punya dua kebenaran yang bisa berselisih, dan yang salah selalu yang dilihat admin. Konsekuensinya lurus: memperbaiki ceritanya menghapus barisnya sendiri, tanpa ada yang perlu ingat menghapusnya.

**Keputusan admin sengaja bukan metode seam.** Penulis tidak boleh menyetujui karyanya sendiri, jadi `resolveReviewAsAdmin` hidup di `handlers/schedule.ts` sebagai fungsi dev, dijalankan dari `/dev/kitchen-sink` — bukan lewat `api/client`. Tanpa satu pun cara menjalankannya, antrean tinjauan akan jadi layar yang **tidak pernah bisa kosong**, dan rantai e2e #3 tidak akan pernah bisa diuji sampai ujung.

---

### 1.12 Analitik diturunkan, dan empat temuan PRD 07 §7 ditutup di sini

Analitik cerita mengikuti aturan yang sama dengan §1.9 dan §1.11: **tidak ada satu pun angkanya yang disimpan.** Views, pembaca baru, komentar, pembelian, retensi, kalender publish, dan rekomendasi waktu terbit dihitung ulang dari cerita, bab, dan kepemilikan pada tiap pembacaan. Menerbitkan satu bab langsung menggeser seluruh halaman itu tanpa ada yang perlu ingat memperbaruinya.

Satu bagian **tidak** bisa diturunkan: server tiruan tidak menyimpan event baca, jadi tidak ada penghitung harian untuk dibagi menurut rentang. Deret hariannya dibangkitkan dari `id cerita + tanggal` — stabil antar pembacaan, dan dasar hariannya berjangkar pada `story.stats.reads` yang nyata. Ditandai `ponytail:` di `handlers/analytics.ts`; batas atasnya jelas (pola hariannya bukan perilaku pembaca sungguhan) dan jalur peningkatannya satu tabel `storyDailyStats` yang diisi dari event, tanpa mengubah bentuk seam sama sekali.

Alternatif yang ditolak: menyaring rentang **di klien**. Ia menghasilkan pemilih rentang yang hanya mengganti label di atas angka yang sama — persis cacat yang membuat kontrol prototipe terasa rusak.

**Empat temuan PRD 07 §7 ditutup bersama halaman ini**, dan ketiganya soal kontrol yang tampak berfungsi padahal tidak:

| §7 | Temuan prototipe | Yang berlaku sekarang |
|---|---|---|
| #9 | Urutan performa bab tidak tersambung ke apa pun | Kelima urutan dijalankan **server**; ikut *query key*, jadi benar-benar meminta ulang datanya |
| #10 | Kedua lapisan grafik boleh mati bersamaan → kotak kosong | Lapisan terakhir ditahan, **beserta alasannya** — bukan klik yang diabaikan diam-diam |
| #11 | Ekspor, unduh invoice, dan bagikan semuanya hanya pesan | Berkas nyata dari klien: `window.print()`, `<canvas>` → PNG, `Blob` → invoice |
| #15 | Bagi hasil dan biaya cetak di-hardcode | Angka yang **ditampilkan** datang dari jawaban server (sudah sejak §8e untuk bagi hasil) |

**Pembatalan cetak dibatasi tahap, dan tombolnya tetap ada.** Sesudah tahap `Dicetak` (indeks 3 pada `PRINT_STAGES`) server menolak dengan `PRINT-409` yang menyebut biayanya dan menawarkan klaim lewat dukungan. Tombol yang dimatikan diam-diam tidak pernah menjelaskan kenapa, dan mengajari penulis bahwa aplikasinya rusak. Aturan yang sama menutup `PRINT-402`: pesanan yang biayanya berubah masih di bawah tahap produksi, jadi **menolak biaya baru = membatalkan**, tanpa tagihan. Satu aturan, bukan dua.

---

### 1.13 Koin bertemu rupiah di satu tempat, dan kebijakannya milik server

PRD 08 §7 #9 mencatat celah yang mudah terlewat: analitik penulis memakai **koin**, pencairan memakai **rupiah**, dan tidak ada kurs yang terlihat di layar mana pun. Penulis karena itu tidak pernah tahu berapa nilai karyanya sampai uangnya masuk rekening.

`/penulis/analitik` adalah tempat keduanya bertemu, dan kursnya dinyatakan terang di sana. Dua angka kebijakan — kurs koin dan bagi hasil 80/20 — datang dari `src/api/mock/config.ts`, bukan dari `lib/coin.ts`. Bedanya penting: `lib/coin.ts` menyimpan nilai bawaan untuk perhitungan sisi pembaca, sedangkan angka yang **ditampilkan sebagai kebijakan** harus bisa berubah tanpa rilis (§7 #7 dan #15). Sebelumnya `AUTHOR_SHARE_PCT` hidup sendirian di `handlers/chapters.ts`; handler penghasilan yang menyalinnya akan berselisih diam-diam pada perubahan berikutnya, dan yang salah adalah angka yang dibaca penulis.

**Saldo tersedia menahan pengajuan yang sedang diproses.** `getPayoutBalance` mengurangi penarikan berstatus `submitted` dan `review` dari saldo kotor, jadi dana yang sama tidak bisa diajukan dua kali — aturan itu hidup di server, bukan di layar, karena layar bisa dilewati. Ini juga yang membuat `requestWithdrawal` cukup memeriksa satu plafon alih-alih menghitung ulang riwayat di setiap pemanggil.

**Rentang waktu kedua halaman analitik memakai enum yang sama** (`'7h' | '30h' | '3b' | '1t' | 'custom'`), menutup §7 #5. Dua halaman analitik dengan pemilih rentang berbeda memaksa penulis belajar dua kali untuk pertanyaan yang sama, dan angkanya jadi tidak bisa dibandingkan.

**Catatan data seed.** Penarikan contoh semula berjumlah Rp 7,7 juta padahal penulis contoh baru menghasilkan ~Rp 3,57 juta seumur hidup. Akibatnya saldo tersedia selalu terjepit ke nol dan alur pencairan mustahil dicoba. Seed bukan sekadar pengisi layar: begitu satu aturan menghitung sesuatu darinya, ia harus **rekonsiliasi**.

---

### 1.14 Satu angka, satu sumber — tiga tempat PRD menuntut konsistensi

prd_08 menyebut konsistensi tiga kali, dan ketiganya mudah dilanggar tanpa ada yang menyadarinya sampai penulis membandingkan dua layar sendiri.

**(a) Tahap "Bayar" = "Tingkat buka"** (FR-EARN-04). Corong dihitung untuk **satu cerita**, sedangkan KPI di kepala halaman agregat seluruh karya (FR-EARN-01). Di Langkah 32 tingkat buka ikut dihitung agregat, dan itu membuat kedua angka mustahil cocok. Bacaan yang menepati keduanya cuma satu: **tingkat buka milik cerita yang sama dengan corong**, sementara KPI tetap agregat — keduanya memang menjawab pertanyaan berbeda. Cara menepatinya yang tidak bisa lapuk bukan menghitung dua kali lalu membandingkan, melainkan `funnelOf()` mengembalikan `payPct` yang **dipakai langsung** sebagai `openRatePct`.

Cerita fokusnya adalah cerita paling banyak dibaca yang punya bab premium terbit, dan ia menentukan **empat hal sekaligus**: corong, tingkat buka, heatmap, dan tautan penjadwal. Satu cerita, bukan empat pilihan berbeda yang kebetulan sering sama.

**(b) Sel terpanas heatmap = `peakHours`** (FR-EARN-05). Heatmap yang menunjuk satu jam sementara kalimat di bawahnya menyebut jam lain membuat keduanya berhenti bisa dipercaya. Intensitas sel karena itu dihitung dari bobot slot yang puncaknya **adalah** `peakHours`, dan hari terbaiknya mendapat dorongan supaya sel terpanas jatuh persis pada `bestTime`.

**(c) "Hari terbaik" punya satu sumber.** `weekdayWeights()` di `handlers/analytics.ts` dibaca empat tempat: rekomendasi analitik cerita, catatan celah jadwal terpadu, kurva pendapatan penulis, dan heatmap rilis. Sebelumnya kurva pendapatan memakai array bobot tetap, jadi penulis bisa membaca "Sabtu 20.00" di satu layar dan hari lain di layar berikutnya — dua kebenaran untuk satu pertanyaan.

**Corong tidak bisa naik.** Tiap tahap adalah bagian dari tahap sebelumnya, jadi persentasenya dijepit monoton. Tanpa itu, cerita yang bab premiumnya kebetulan bab pertama membuat tahap Premium melompati tahap sebelumnya dan gambarnya berhenti masuk akal. Tahap tengah juga menyebut **bab yang benar-benar dipakai**: pada cerita dengan dua bab, label "Bab 3" adalah kebohongan kecil yang tidak perlu.

---

### 1.15 Aturan uang ditegakkan dua kali, dari satu berkas

PRD 08 §7 mencatat tiga cacat yang semuanya satu keluarga: batas minimum Rp 100.000 hanya kalimat keterangan (#2), jumlah tidak dibatasi saldo (#3), dan pengajuan Rp 0 pun diterima. Prototipe menerima apa pun lalu membiarkan penulis menunggu penolakan yang sudah pasti.

**Tangga lima tingkat FR-EARN-11 hidup di `src/lib/payout.ts` sebagai fungsi murni**, dan dipanggil dua tempat:

- **Layar** memakainya untuk mematikan tombol pengajuan **sebelum** ditekan, dan menampilkan satu pesan — kesalahan pertama saja.
- **Server** memakainya di `requestWithdrawal` untuk menolak, karena layar bisa dilewati.

Satu berkas, bukan dua salinan: kalimat penolakan yang berbeda antara layar dan server membuat penulis mengira ada dua aturan berbeda. Ini pola yang sama dengan §1.14 — yang harus konsisten jangan ditulis dua kali.

**Urutan tangganya bukan selera.** Jumlah diperiksa lebih dulu (tingkat 1–3), syarat akun terakhir (4–5), karena memperbaiki syarat akun menuntut pergi ke layar lain — tidak sopan menyuruh penulis ke sana kalau jumlahnya toh belum valid. Berhenti pada kesalahan pertama mengikuti pola formulir cerita (FR-STUDIO-16): lima keluhan sekaligus membuat penulis memperbaiki lima hal padahal satu pun belum tentu benar.

**Dua hal yang sengaja tidak dijepit di tempat yang sama.** Bersih (`netAfterFee`) dijepit minimum nol supaya jumlah di bawah biaya admin tidak tampil negatif — angka merah di ringkasan pencairan terbaca seperti utang. Tetapi jumlah itu sendiri **tidak** ditolak di situ; penolakannya datang dari tangga, dengan kalimatnya sendiri.

**Pesan penolakan memakai spasi biasa, bukan `formatRupiah`.** `Intl` menyisipkan non-breaking space antara `Rp` dan angkanya, dan pesan ini dibandingkan sebagai string di test serta digabung ke kalimat server. Spasi yang terlihat sama tetapi berbeda kode adalah kegagalan yang mustahil dibaca (CLAUDE.md §8).

**Rekening tidak pernah dikirim penuh.** `getPayoutAccount` mengirim `**** 4481` — bentuk tersamarnya dibuat server. Yang tidak pernah meninggalkan server tidak bisa bocor dari klien.

---

### 1.16 Rating dan ulasan adalah dua hal, dan arah penghapusannya tidak simetris

prd_12 membuka dengan temuan yang paling menjelaskan seluruh modul: rating **dikonsumsi di enam tempat tetapi tidak diproduksi di satu tempat pun**. Kartu cerita, statbar, detail, pencarian, analitik, dan misi hadiah semuanya membaca angka yang tidak pernah bisa ditulis siapa pun.

**Keduanya disimpan terpisah** — `ratings` dan `reviews`, bukan satu baris dengan `text` kosong. FR-SOCIAL-01 dan FR-SOCIAL-02 menuntut memberi bintang tanpa menulis apa pun tetap sah, dan menghapus ulasan **tidak** menghapus ratingnya. Satu tabel dengan kolom teks opsional akan membuat "hapus ulasan" dan "hapus rating" jadi operasi yang sama.

Arahnya **sengaja tidak simetris**:

| Aksi | Ratingnya | Ulasannya |
|---|---|---|
| Hapus ulasan | tetap | hilang |
| Hapus rating | hilang | **ikut hilang** |

Alasannya satu kalimat di PRD: ulasan **wajib disertai rating**. Ulasan tanpa bintang tidak sah, jadi ia tidak boleh tertinggal saat bintangnya dicabut.

**Rata-rata cerita tidak pernah disimpan sebagai kebenaran kedua.** `recomputeAverage` menghitungnya ulang dari seluruh rating setiap kali ada yang menilai, lalu menuliskannya ke `story.stats.rating` — kolom itu cache tampilan, bukan sumber. Pola yang sama dengan §1.9 dan §1.12.

**Sebaran bintang dihitung dari seluruh rating, bukan dari ulasan yang lolos saringan.** Grafik yang ikut menyusut saat pembaca menyaring "hanya 5★" berhenti menggambarkan ceritanya — ia berubah jadi gambar tentang saringannya sendiri. Karena itu `breakdown` selalu datang dari `ratings`, tidak pernah dari `items`.

**Ulasan sendiri tidak pernah ikut tersaring** dan naik ke `myReview`. Penulisnya harus selalu bisa menemukan miliknya untuk disunting, termasuk saat sedang menyaring bintang lain.

**Kelayakan menilai ditegakkan server, dan penolakannya berupa ajakan.** Syaratnya sudah membaca minimal satu bab, dibaca dari `progress` — bukan dari kepemilikan bab, karena membeli tanpa membuka bukan membaca dan bab gratis tidak pernah menghasilkan baris kepemilikan sama sekali.

**Modulnya hidup di `features/story/`, bukan `features/social/`.** Detail cerita memakai lembar ratingnya, dan `features/*` tidak boleh mengimpor `features/*` lain (aturan struktur #2). Rating dan ulasan memang milik cerita — rutenya pun `/cerita/:id/ulasan`.

---

### 1.17 Kedalaman utas ditegakkan server, dan bab terkunci menutup komentarnya

**Balasan satu tingkat.** FR-SOCIAL-05 melarang utas bercabang dalam — alasannya layar 390px, di mana tiap tingkat indentasi memakan lebar yang tidak ada. Aturannya ditegakkan **dua lapis**:

- **Tipe.** `CommentSchema` membungkus `CommentBaseSchema`, jadi `replies` tidak bisa punya `replies`. Skemanya sengaja tidak rekursif.
- **Server.** `postComment` menaikkan `parentId` ke induk teratas: membalas sebuah balasan mendarat di utas yang sama, bukan ditolak. Layar tidak perlu tahu aturannya sama sekali.

Menaruhnya di layar akan bekerja sampai layar kedua lupa — dan hasilnya pohon dalam yang komponennya tidak bisa merender.

**Bab terkunci menolak membaca, bukan hanya menulis.** Komentar bab penuh berisi isi babnya; membuka utasnya untuk yang belum membeli sama dengan membocorkan cerita lewat pintu samping. `listComments` dan `postComment` karena itu memakai penjaga yang sama, dan halamannya menampilkan satu sisipan beserta jalan keluarnya — bukan daftar kosong yang terlihat seperti "belum ada komentar".

**Kepemilikan dicari lewat indeks, bukan dengan menebak id primer.** `ownerships` di seed bernama `own1`, `own2`, sementara baris yang dibuat runtime memakai pola lain. Menebak bentuk id membuat **setiap** bab terbaca sebagai terkunci — gejalanya muncul jauh dari sebabnya, sebagai "semua komentar ditolak".

**Urutan komentar punya pemecah seri.** Dua komentar yang lahir pada milidetik yang sama punya `createdAt` identik; tanpa pemecah, urutannya berubah antar pembacaan dan daftarnya terlihat menyusun ulang dirinya sendiri. `id` dipakai sebagai pemecah — tidak mencerminkan urutan pembuatan saat stempelnya bertabrakan, tetapi **deterministik**, dan itu yang menentukan apakah daftar terasa stabil.

**Komentar yang sedang ditinjau tetap menempati barisnya**, isinya diganti keterangan (FR-SOCIAL-07, kanvas layar 18). Pembaca lain melihat ada sesuatu di sana dan sedang diproses — bukan konten yang hilang diam-diam, yang selalu terbaca sebagai sensor.

---

### 1.18 Moderasi: melapor bukan membungkam, memblokir bukan menghapus

**Konten yang dilaporkan tetap tampil sampai melewati ambang** (FR-SOCIAL-07). Menyembunyikan sejak laporan pertama menjadikan tombol laporkan senjata: satu orang bisa membungkam siapa pun tanpa satu pun manusia melihat kontennya. Ambangnya `REPORT_THRESHOLD = 3`, ditandai `ponytail:` — ambang sungguhan seharusnya ikut reputasi pelapor dan umur akun, dan itu menuntut data yang belum ada.

Begitu ambangnya tercapai, kontennya **disembunyikan sambil menunggu tinjauan, bukan dihapus**: barisnya tetap ada dengan isinya diganti keterangan (§1.17).

**Satu laporan per pasangan (pelapor, objek).** Melaporkan dua kali ditolak dengan menyebut bahwa laporan pertama sudah masuk — bukan diterima diam-diam, yang membuat pelapor mengira laporannya hilang. Pelapor menerima konfirmasi diterima dan **tidak pernah dapat kabar hasilnya**; kabar hasil akan berubah jadi kanal balas dendam antar pengguna.

**Blokir menyembunyikan dari pemblokir saja.** Ia bukan penghapusan dan tidak memengaruhi apa yang dilihat orang lain — `listComments` dan `listReviews` menyaringnya per pembaca. Barisnya tetap utuh di basis data, dan membuka blokir mengembalikannya seketika.

**Laporan mengalir ke antrean tinjauan Fase 8f.** `listReviewQueue` sudah punya sumber `report` sejak §1.11; Fase 10 yang mengisinya — dan hanya untuk cerita atau komentar di bab milik penulis itu. Laporan atas komentar orang lain bukan urusannya.

### Dua angka yang akhirnya punya sumber

**Sentimen komentar** (FR-STUDIO-30) diturunkan dari **bintang ulasan cerita itu**: empat ke atas positif, tiga netral, dua ke bawah negatif. Bukan analisis nada — batas itu ditandai `ponytail:` — tetapi sinyalnya nyata dan dipilih pembacanya sendiri. Tanpa ulasan sama sekali ketiganya nol, bukan angka karangan yang terlihat meyakinkan.

**Progres misi ulasan** (FR-SOCIAL-08) diturunkan dari **tanggal ulasan hari ini**, bukan angka tersimpan. Misi yang menyimpan progresnya sendiri akan tetap 100% keesokan harinya, dan batas "satu kali per hari" jadi tidak berarti.

**Feed aktivitas** diturunkan dari ulasan, bukan tabel event: entri "Menulis ulasan 5 bintang" adalah tampilan lain dari ulasan yang sama. Tabel event akan basi begitu ulasannya disunting atau dihapus.

### Membuka bab sudah tercatat

Ditemukan saat menulis e2e #5: kelayakan menilai menuntut "sudah membaca satu bab", tetapi `useReadingProgress` hanya mengirim **setelah ada gulir**. Bab pendek yang muat satu layar karena itu tidak pernah meninggalkan jejak, dan pembacanya ditolak dengan alasan yang terdengar salah.

`getChapter` kini menulis baris progres saat bab **dibuka** — dan hanya bila belum ada. Menimpa baris yang sudah ada dengan nol akan membuang posisi baca yang sebenarnya, yang jauh lebih mahal daripada masalah yang sedang diperbaiki.

---

### 1.19 Auto-unlock jadi izin per cerita — **PRD direvisi**, bukan ditimpa

**Permintaan produk 4 September**, diputuskan lewat diskusi. Belum diimplementasikan saat catatan ini ditulis; rencananya di `todo.md` **Fase 5b**.

**Ini satu-satunya §1.x yang PRD-nya ikut disunting.** Atas permintaan pengguna, `prd_05_reader.md` FR-READ-09 ditulis ulang dan `prd_00_overview.md` diselaraskan — keduanya membawa catatan revisi bertanggal. Jadi bagian ini **bukan penimpaan**: ia mencatat *kenapa* revisinya diambil dan alternatif yang ditolak, yang tidak seluruhnya masuk ke PRD.

FR-READ-09 versi lama sudah menggambarkan mekanismenya dengan tepat — `IntersectionObserver` ambang 0,35, bab terbuka tanpa interaksi, selalu harga satuan. Yang direvisi hanya **siapa yang menyalakannya**:

| Hal | FR-READ-09 lama | FR-READ-09 revisi |
|---|---|---|
| Bentuk | Satu sakelar global di Pengaturan Pembaca | Sakelar **per cerita**, di dalam gerbang bab |
| Default | Nonaktif | **Tercentang** di gerbang bab berbayar pertama |
| Gerbang manual | Jalur utama, muncul tiap bab | Muncul di **bab berbayar pertama tiap cerita** saja |

**Kenapa bukan sekadar menyalakan default globalnya.** Karena auto-unlock memotong koin tanpa ketukan, dan sakelar global yang menyala sejak awal berarti pembaca yang menggulir cepat melewati lima bab kehilangan 7.500 koin tanpa pernah menyetujui satu pun pembelian. Aturan proyek sendiri menyebut *"mutasi uang tidak pernah optimistis"*.

**Kenapa gerbangnya tidak dihapus sama sekali** — usulan awal yang dibahas. Gerbang adalah satu-satunya tempat tiga hal pernah terlihat: **bundel 10 bab (12.000)**, **paket tamat (36.900)**, dan **iklan berkuota**. Auto-unlock memakai harga satuan 1.500, jadi menghapus gerbang membuat pembaca sepuluh bab membayar 15.000 — **25% lebih mahal**, justru sebagai akibat alur yang dipermulus. Dan pembaca tanpa koin kehilangan satu-satunya jalan gratisnya.

Jalan tengahnya menepati keduanya: friksinya dibayar **sekali per cerita**, bukan tiap bab, dan yang dibayar sekali itu justru saat pilihan hemat paling berguna — sebelum bab-bab berikutnya dibeli satuan.

**Izin disimpan di server**, bukan `localStorage`: ia menyentuh uang, dan aturan struktur #5 melarang `stores/` menyimpan apa yang dimiliki pengguna. Tempatnya `readerPrefs.autoUnlockStoryIds`, sebelah `hiddenStoryIds` — **kolom itu rencana, bukan keadaan**; sampai R4a ia belum ada, dan izin buka-otomatis masih berupa sakelar global di `stores/readerSettings.ts`. Rinciannya §1.21.

**Lembar saldo kurang menawarkan tiga jalan keluar**: isi koin · voucher · tonton iklan. Voucher sebelumnya hanya hidup di detail cerita; iklan dipertahankan karena tanpanya pembaca tanpa koin benar-benar buntu, dan lembar kegagalan yang tidak menawarkan jalan keluar melanggar §1.4.

### 1.20 Redesign putaran 7 — **keputusan terkunci #1 dibatalkan**, di satu folder saja

**Permintaan produk 4 September**, diputuskan lewat pertanyaan langsung. Berlaku **hanya untuk `novelova-v2/`**; `novelova/` tidak disentuh dan tetap rose-gold PRD 01. Rencananya di `todo.md` **Fase R**.

Keputusan #1 dulu memilih palet PRD 01 rose-gold dan **menolak** design system Classical di `_ds/`. Redesign ini membalikkannya: emas `#b68235` yang dipakai putaran 7 **adalah emas Classical yang dulu ditolak**, dan tipografinya pindah dari Cormorant Garamond + Manrope ke **Lora + Plus Jakarta Sans**. Yang tidak berubah: seluruh seam API, aturan struktur, dan kontrak perilaku. Ini penggantian kulit dan dua perilaku ruang baca, bukan arsitektur baru.

**PRD 01 tidak disunting.** Bawaan Langkah 24 berlaku lagi di sini: PRD tetap catatan jujur tentang apa yang semula diminta, dan penimpaannya hidup di bagian ini. (Pengecualian FR-READ-09 di §1.19 tetap satu-satunya PRD yang direvisi.)

#### Acuannya PNG, karena berkas kanvasnya tidak ada

`redesign-novelova.md` §0 merujuk `Novel Reader Redesign.dc.html`, `ModernTabBar.dc.html`, dan `PrintRow.dc.html`. **Ketiganya tidak ada di folder kerja.** Yang ada 27 PNG di `Novel reader UI redesign/putaran7/`. Doc-nya sendiri menetapkan urutan otoritas — *"where a mockup and this document disagree, follow the mockup"* — jadi PNG-nya yang berlaku, dan setiap nilai yang tidak disebut doc diambil dari piksel PNG-nya.

#### Dua emas, bukan satu — dan doc-nya tidak menyebut hex-nya

Doc §1 hanya menulis `var(--color-accent)`. Sampel piksel menunjukkan mockup-nya memakai **dua** nilai dengan pembagian tugas yang tegas:

| Token | Nilai | Dipakai untuk | Kontras di `#f4f2ef` |
|---|---|---|---|
| `--nv-gold` | `#7d5411` | **Teks**: saldo koin, rating, harga bab terkunci, `See all`, `+23 bonus`, badge mahkota | **5,98:1** ✓ |
| `--nv-gold-line` | `#b68235` | **Bukan teks**: garis emas judul bab, batang progres, titik tab aktif, aksen malam | 3,01:1 — dan tidak apa-apa, ia bukan teks |

Pembagian ini bukan penemuan baru: `--nv-coin` / `--nv-coin-icon` di `novelova/` sudah memecah persis hal yang sama, dengan alasan yang sama. Di `novelova-v2/` keduanya berganti nama karena emasnya kini juga dipakai rating dan `See all` — bukan cuma koin.

**Aksen utamanya bukan emas sama sekali.** Doc §1 menyebutnya lugas: emas *"never for large fills"*, dan tombol utama adalah isi `#1c1a18`. Jadi `--nv-accent` di `novelova-v2/` adalah **tinta gelap**, dan 191 pemakaian `nv-accent` yang dulu rose-gold ikut benar tanpa disentuh satu per satu.

#### Dua tempat mockup-nya sendiri gagal AA

Diperbaiki, dan disebut di sini supaya tidak dikira salah salin:

| Peran | Nilai mockup | Kontras | Dipakai | Alasan |
|---|---|---|---|---|
| Teks metadata (penulis, caption, label section) | `#8a827a` | 3,38:1 | **`#6f6862`** (4,90:1) | Preseden identik sudah ada: PRD 01 §9.2 rec #8 menaikkan `--nv-muted` dari `#928582` ke `#6f6462` karena alasan yang sama |
| Label `BERSPONSOR` | `#b8b0a8` | 2,3:1 | **`--nv-muted`** | Label iklan yang tidak terbaca bukan sekadar cacat kontras |

`#c4bcb2` tetap dipakai apa adanya sebagai `--nv-disabled` — WCAG 1.4.3 memang mengecualikan kontrol nonaktif.

#### Yang bukan sekadar warna

Doc §7 memecah ruang baca jadi **dua tipe yang berbagi tipografi dan panel pengaturan, dan tidak berbagi apa pun lagi**:

- **Type A** (bab yang sudah dimiliki) — chrome **tersembunyi sejak awal**; satu ketukan pada teks membukanya, ketukan kedua menyembunyikannya. Tombol komentar hidup **hanya di overlay itu**, tidak pernah di akhir bab, dan membukanya tidak pernah menghilangkan posisi baca.
- **Type B** (bab berbayar) — bilah atas **selalu terlihat**, saldo ikut di dalam gerbang, empat pilihan harga berurutan, dan saldo kurang adalah **lembar tiga jalan keluar**, bukan toast.

Type B **adalah** Fase 5b. Gerbang per cerita, `Buka otomatis untuk cerita ini` tercentang default, izin di server — semuanya sudah diputuskan di §1.19 dan digambar di `7x`…`7aa`. Dikerjakan sekali, di Fase R, bukan dua kali.

### 1.21 Auto-unlock jadi alur utama, dan tawaran bundling setelah sepuluh bab

**Permintaan produk 4 September**, diputuskan lewat diskusi. Belum diimplementasikan saat catatan ini ditulis; rencananya `todo.md` **Fase R4**.

**Empat dari lima butir permintaannya sudah jadi FR-READ-09 versi revisi** dan tidak berubah sama sekali: gerbang di bab berbayar pertama tiap cerita · sakelar per cerita tercentang default · bab berikutnya terbuka sendiri sampai saldo tidak cukup · pindah cerita mengulang alurnya. Bagian ini mencatat **yang benar-benar baru** dan tiga temuan yang muncul saat jalur uangnya ditelusuri.

#### Yang baru: tawaran bundling setelah sepuluh bab

Setelah pembaca membuka **sepuluh bab** secara otomatis di satu cerita, muncul tawaran membeli bundel.

| Hal | Putusan | Kenapa begitu |
|---|---|---|
| Ambang | **10 bab**, dan **dapat diatur** | Angkanya milik `SERVER_CONFIG` di `api/mock/config.ts`, bukan `lib/coin.ts` — ia tuas kebijakan, dan §1.13 sudah menetapkan angka kebijakan harus bisa berubah tanpa rilis |
| Isi | **Selalu bundel 10 bab** | Disederhanakan dengan sadar. Ambangnya dapat diatur, jadi bentuk lain bisa menyusul tanpa membongkar apa pun |
| Tampilan | **Pita non-blocking di pembuka bab** | Alur ini menjanjikan baca tanpa terputus; lembar yang menghentikan gulir membatalkan janji itu di tempat yang paling terasa |
| Frekuensi | Sekali per cerita | Tawaran belanja yang datang berulang berhenti jadi tawaran dan mulai jadi gangguan |

**Yang tidak boleh berubah**, dan ketiganya gampang hilang saat alurnya dipermulus:

- **Lembar saldo kurang tetap tiga jalan keluar** — isi koin · voucher · tonton iklan (FR-READ-17). Permintaannya menyebut dua; voucher tetap ada karena lembar buntu yang menawarkan lebih sedikit jalan keluar melanggar §1.4, dan voucher adalah satu-satunya jalan yang tidak menuntut uang **maupun** menonton iklan.
- **Sakelar mematikan tetap terlihat** (`7y`, baris status auto dengan `Matikan`). Izin memotong koin tanpa tombol mati bukan izin.
- **Auto-unlock tetap tidak pernah membeli bundel atau paket tamat sendiri** (FR-READ-09). Tawaran bundling adalah pembelian **eksplisit**; kalau ia bisa terjadi otomatis, seluruh alasan gerbang pertama dipertahankan runtuh.

**Membeli bundelnya tidak menuntut mekanisme baru.** `scopeOf(userId, chapter, 'bundle')` sudah membuka sepuluh bab terkunci berikutnya sekaligus, jadi bab-bab itu langsung dimiliki — dan pengaman kedua auto-unlock ("bab belum terbuka") membuatnya melewatinya tanpa memotong koin lagi. Tidak ada saldo bundel yang perlu disimpan.

#### Tiga temuan di jalur harga bab

Ditemukan saat menelusuri alur ini, bukan dicari. Ketiganya sudah ada sejak `novelova/` v1.

**1. `PRICE_SINGLE = 1_500` sudah jadi kode mati.** Nol pemakai di seluruh `src/`. Gerbang memakai `Chapter.priceCoins` milik tiap bab — dan itu **benar**, sudah diperbaiki sebagai cacat PRD 05 §7 #12. Akibatnya kalimat FR-READ-09 *"selalu memakai harga satuan 1.500"* tidak lagi menggambarkan kodenya: harga bab di seed **1.500 · 1.800 · 2.000**, dan auto-unlock menguras saldo dengan laju yang berubah-ubah.

**2. Lencana hemat PRD tidak cocok dengan aritmetikanya sendiri.** `prd_00` §6 menulis bundel "hemat ±5%" dan **`prd_05` §2 langkah 5 mengulangnya** ("hemat 5%") — hanya `prd_00` yang sudah membawa catatan bahwa angkanya nominal, `prd_05` belum. Sepuluh bab satuan pada harga seed berjumlah **17.200** melawan bundel **12.000** — **30%**. Kodenya sudah benar: `UnlockOption.individualCoins` menghitung total satuan sungguhan. **Konsekuensi untuk pita tawaran:** angkanya wajib datang dari `individualCoins`, tidak boleh persentase tetap.

**3. Skala harga bab tidak cocok dengan skala paket koin — sengaja dibiarkan.**

| | Koin |
|---|---|
| Paket isi koin terbesar | **2.000** (Rp 185.000) |
| Buka satu bab | **1.500 – 2.000** |
| Bundel 10 bab | **12.000** |
| Sampai tamat | **36.900** |
| Harga bab yang boleh dipatok penulis (`prd_07`, ditegakkan kode) | **1 – 50** |

Paket terbesar hanya cukup untuk satu bab, dan bab seharga 1.500 koin mustahil dibuat lewat UI penulis. Dugaan yang paling cocok dengan semua angkanya: **1.500 / 12.000 / 36.900 di prototipe adalah rupiah**, dan dibagi kurs 130 hasilnya ~12 · ~92 · ~285 koin — ketiganya masuk akal terhadap paket 50–2.000 dan terhadap rentang penulis 1–50.

**Diputuskan: dibiarkan apa adanya untuk sekarang**, alurnya dikerjakan lebih dulu. Yang harus diketahui siapa pun yang menyentuhnya nanti adalah akibatnya, karena akibatnya konkret dan bisa dihitung.

#### Akibat yang bisa dihitung: tawaran sepuluh bab tidak terjangkau dari saldo contoh

Tiga bab pertama tiap cerita gratis, jadi auto-unlock mulai di bab 4. Harga sepuluh bab berbayar pertama mengikuti `PAID_PRICES` yang berulang tiap lima bab:

| Bab | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|
| Harga | 2.000 | 1.500 | 1.500 | 1.800 | 1.800 | 2.000 | 1.500 | 1.500 | 1.800 | 1.800 |
| Kumulatif | 2.000 | 3.500 | 5.000 | 6.800 | 8.600 | 10.600 | 12.100 | 13.600 | **15.400** | 17.200 |

Saldo contoh **15.300**. Kumulatif melewatinya di bab ke-12 — pembaca contoh kehabisan koin setelah **delapan** pembukaan otomatis, dua bab sebelum ambang tawarannya.

**Itu bukan cacat: itu alurnya bekerja.** Lembar saldo kurang muncul, pembaca mengisi koin, lalu melanjutkan — persis yang diminta. Yang jadi masalah cuma satu: **pita tawaran bundling nyaris tidak akan pernah terlihat saat mencoba dengan tangan.**

Jalan keluarnya mengikuti kebiasaan yang sudah ada di proyek ini, bukan mengubah produk: **satu sakelar dev di `/dev/kitchen-sink`** yang melompatkan penghitung bab ke ambangnya. Itu tempat yang sama dengan tiga sakelar sesi, tiga hasil pembayaran, kegagalan autosave, dan keputusan admin antrean tinjauan — semuanya ada karena layar yang jarang muncul harus tetap bisa diperiksa.

**Saldo seed sengaja tidak dinaikkan.** Angka `15,3rb` tercetak di `7a`, `7x`, dan `7i`; menaikkannya demi kenyamanan menguji berarti seluruh mockup berhenti cocok dengan aplikasinya.

#### Keadaan kode sekarang — dan dua hal yang tidak seperti dikira

Ditelusuri sebelum spec ini ditulis, karena §1.19 menyebut beberapa hal seolah sudah ada.

**1. `readerPrefs.autoUnlockStoryIds` belum ada.** §1.19 menulis *"Tempatnya `readerPrefs.autoUnlockStoryIds`, sebelah `hiddenStoryIds`"* — itu rencana, bukan keadaan. `ReaderPrefsSchema` (`api/contracts/user.ts:68`) hanya punya empat kolom: `userId` · `genres` · `hiddenStoryIds` · `onboardedAt`.

**2. Izin buka-otomatis hari ini adalah sakelar global di klien — dan itu melanggar aturan struktur #5.** Ia hidup di `stores/readerSettings.ts`, dibaca `ReaderPage.tsx:130`, dan disetel `ReaderSettingsPanel.tsx:52`. Aturan #5 berbunyi: *"Kalau harus ikut saat pengguna berganti perangkat, ia bukan urusan `stores/`."* Sakelar ini **memberi wewenang memotong koin**; ia jelas harus ikut berpindah perangkat. Pelanggaran ini lahir sebelum §1.19 memutuskan sebaliknya, dan R4-lah yang menutupnya — jadi memindahkannya bukan pekerjaan tambahan, melainkan bagian dari pekerjaan yang sama.

Yang **sudah** berdiri dan tidak perlu dibangun ulang: `getUnlockOptions` beserta `UnlockOption.individualCoins`, `scopeOf(userId, chapter, source)` yang sudah membuka cakupan bab berbeda per pilihan, `unlockChapter` yang sudah idempoten, dan komponen `ChapterGate` · `InsufficientCoins` · `AdUnlockScreen` · `ReaderBar`.

#### Model data — tiga kolom baru di `ReaderPrefs`

Ketiganya di server, dan ketiganya karena alasan yang sama: mereka menyentuh uang.

| Kolom | Bentuk | Kenapa server |
|---|---|---|
| `autoUnlockStoryIds` | `string[]` | Izin memotong koin. Aturan struktur #5 |
| `autoUnlockCounts` | `Record<storyId, number>` | Memicu tawaran belanja; kalau di klien, membersihkan data peramban mengulang tawarannya |
| `bundleOfferSeenStoryIds` | `string[]` | "Sekali per cerita" harus bertahan lintas perangkat, atau ia bukan sekali |

**Kenapa `bundleOfferSeenStoryIds` ada padahal penghitungnya sudah cukup.** Menyalakan pita saat `count === ambang` memang menyala tepat sekali — sampai pembaca menutup aplikasi. Kembali besok dengan penghitung masih 10 menampilkannya lagi. "Sekali per cerita" yang bergantung pada pembaca terus membaca bukan sekali per cerita.

#### Seam — tiga metode baru dan satu masukan diperluas

`NovelovaApi` **109 → 112**.

| Metode | Kenapa berbentuk begini |
|---|---|
| `setAutoUnlock(storyId, on)` | Mengikuti pola `hideStory(storyId)` yang sudah ada: mutator sempit, bukan `updatePrefs` serba bisa. Dipakai baris `Matikan` di `7y` |
| `getBundleOffer(storyId, chapterId)` | **Server yang memutuskan**, bukan klien: ambangnya kebijakan (`SERVER_CONFIG`), dan angka hematnya harus dari harga bab sungguhan. Mengembalikan `null` bila belum waktunya. Memakai `scopeOf(…, 'bundle')` yang sudah ada |
| `dismissBundleOffer(storyId)` | Menulis `bundleOfferSeenStoryIds` |

**`UnlockInput` diperluas dua bendera, dan keduanya punya alasan yang tepat:**

- `enableAutoUnlock?: boolean` — **beli bab ini dan nyalakan izinnya dalam satu panggilan.** Di gerbang itu memang satu tindakan pengguna (menekan "Chapter ini" dengan kotak tercentang). Memecahnya jadi dua panggilan membuka keadaan yang mustahil dijelaskan: koin terpotong, izin gagal tersimpan.
- `auto?: boolean` — menandai pembukaan yang dilakukan sendiri oleh aplikasi. **Satu-satunya gunanya menaikkan penghitung**; teks toast yang berbeda sudah diketahui klien tanpa perlu bertanya.

**Penghitung naik hanya bila benar-benar ada potongan.** `UnlockResult.alreadyOwned === true` berarti kunci idempotency-nya terpakai ulang — menaikkan penghitung di sana membuat satu ketukan yang diulang mendekatkan pembaca ke tawaran belanja tanpa ia membayar apa pun.

#### Pengaman auto-unlock: saldo **tidak** diperiksa klien

Empat pengaman klien tetap: izin cerita ini aktif · bab memang terkunci · bab ini belum pernah dicoba · tidak ada permintaan berjalan.

Pengaman kelima — saldo cukup — **ditegakkan server, dan klien bereaksi pada `INSUFFICIENT_COINS`**, seperti yang sudah dilakukan `ReaderPage.tsx` hari ini. Itu bukan kelalaian melainkan satu-satunya cara yang benar: harga bab ada di `Chapter.priceCoins` dan berbeda-beda per bab, sedangkan `PRICE_SINGLE` sudah jadi kode mati. Klien yang memeriksa saldo sendiri harus menebak harganya, dan tebakan di jalur uang adalah tebakan yang ditagihkan.

#### Yang dihapus, dan berkasnya

Sakelar global auto-unlock dicabut seluruhnya — sisa satu sakelar akan bersaing dengan izin per cerita untuk hal yang sama:

`stores/readerSettings.ts` (kolom `autoUnlock`) · `lib/coin.ts:86` (`READER_DEFAULTS.autoUnlock`) · `features/reader/components/ReaderSettingsPanel.tsx:52-55` · `i18n/id.ts:47-48` (`reader.autoUnlock`, `reader.autoUnlockHint`) · `tests/unit/readerSettings.test.ts`.



### 1.22 Beranda disusun ulang — tiga section global, semua mendatar, sampul 80px

**Permintaan produk 5 September 2026.** Enam keputusannya ditanyakan langsung
sebelum sebaris pun ditulis, karena lima di antaranya menimpa sesuatu yang sudah
diputuskan. Rencananya `todo.md` **R2b**; belum diimplementasikan saat catatan
ini ditulis.

#### Apa yang berubah

| | Sebelum | Sesudah |
|---|---|---|
| Urutan | tab genre → banner → 3 tetap → generik → kurasi → Lanjut Membaca | **3 prioritas → banner → tab genre** → generik → kurasi → Lanjut Membaca |
| 3 section teratas | ikut tersaring tab | **tidak tersaring** — peringkat global |
| Bentuk section | 4 bentuk (`rail`, `rail-wide`, `ranked`, `continue`) | **2** (`rail`, `continue`) |
| Sampul di rel | 112px · 160px | **80px**, seragam |
| Ketuk sampul | membuka `/cerita/:id` | **membesar** jadi lapisan; judulnya yang membuka cerita |

#### Tiga penimpaan, dan kenapa masing-masing diterima

**1. §1.6 ditimpa sebagian: tiga section teratas berhenti tersaring.** §1.6
mencatatnya sebagai "ikut tersaring: ya" untuk Populer, Baru & Naik Cepat, dan
Paling Banyak Dibuka. Yang memaksanya berubah adalah **urutan barunya**, bukan
selera: tab genre kini duduk *di bawah* ketiganya. Kalau isinya tetap ikut
tersaring, menekan sebuah tab mengubah isi yang berada di luar layar — kontrol
yang efeknya tidak terlihat saat ditekan terbaca sebagai kontrol yang rusak.
Ketiganya jadi sejajar dengan `BANNER` dan `CONTINUE`: dibangun dari seluruh
katalog, bukan dari `inTab`.

**Konsekuensinya bukan cuma satu baris.** Beranda tidak akan pernah benar-benar
kosong lagi, jadi keadaan kosong "genre ini belum ada isinya" harus dinilai dari
**section di bawah tab saja** dan dirender di sana juga. Menilainya dari seluruh
feed membuat pesannya tidak pernah muncul, dan genre kosong berubah jadi halaman
yang diam-diam kelihatan normal.

**2. Brief §4 dibatalkan untuk beranda: "daftar mengalahkan kartu" tidak berlaku
di sini.** Aturan putaran 7 menyuruh konten berulang jadi daftar berpembatas, dan
`7a` memang menggambar section tematik sebagai daftar tegak bernomor. Permintaan
produknya persis kebalikannya, dengan alasan yang sah: **daftar tegak menampilkan
3–4 cerita per layar, rel mendatar 80px menampilkan hampir 4 per baris tanpa
memakan tinggi.** Untuk beranda — satu-satunya halaman yang tugasnya *penemuan* —
melihat banyak judul sekaligus lebih penting daripada membaca satu baris dengan
tenang. **Aturannya tetap berlaku penuh di halaman lain**; `/jelajah` dan
`/pustaka` baru saja jadi daftar tegak di Langkah 51 dan tidak ikut berubah.

**Yang hilang, dan diterima:** kutipan serif `7a` §7 di "Paling Banyak Dibuka".
Tiga baris serif miring tidak terbaca di bawah sampul 80px, dan mempertahankannya
berarti satu section memakai sampul lebih besar sendiri — persis kebalikan dari
yang diminta.

**3. Brief §8 dibatalkan setipis mungkin: satu hal boleh membesar.** Aturannya
berbunyi "tidak ada yang memantul atau membesar", dan fitur baru ini adalah
animasi membesar. Pengecualiannya dibatasi pada **satu gerakan, satu tempat**:
sampul yang ditekan di beranda tumbuh ke tengah layar, ~180ms, `ease-out`. Tidak
ada yang lain yang boleh membesar.

**`prefers-reduced-motion` tetap mematikannya.** Menimpa aturan gerak untuk
seluruh pengguna termasuk yang sudah menyatakan tidak mau adalah dua pelanggaran,
bukan satu — dan yang kedua tidak diminta siapa pun.

#### Kenapa sampul jadi target sendiri, dan apa akibatnya pada struktur kartu

Seluruh `StoryCard` hari ini adalah satu `<a>` ke `/cerita/:id`. Menaruh tombol
di dalamnya bukan HTML yang sah, jadi sampulnya harus keluar dari tautan itu:
**sampul jadi `<button>`, judul tetap `<a>`.** Itu perubahan struktur, bukan
penambahan handler — dan itulah bagian termahal dari fitur ini.

**Lapisannya membawa tombol `Buka cerita`.** Tanpa itu, ketukan pada sampul
menghapus satu-satunya jalan yang dulu ia punya, dan sampul adalah target
terbesar di kartu.

**Zoom hanya di beranda.** `StoryCard` dipakai `/jelajah`, `/pustaka`, `/cari`,
dan beranda; menaruh lapisannya di dalam `StoryCard` mengubah keempatnya tanpa
diminta. Karena itu `StoryCard` cuma menerima prop opsional `onCoverClick`, dan
hanya beranda yang mengopernya — halaman lain tidak berubah sama sekali, sampulnya
tetap bagian dari tautan.

#### Data contoh belum sanggup memikul bentuk barunya

Diperiksa dengan mensimulasikan `seed.ts`, bukan diperkirakan. **11 dari 26
section di bawah tab berisi kurang dari 4 cerita** — tidak cukup mengisi satu
baris sampul 80px:

| Tab | Section | Isi |
|---|---|---|
| Fantasy | Dunia Lain | **1** |
| Mystery · CEO | Tamat & Siap Dibaca | **1** |
| Fantasy | Gratis Hari Ini | 2 |
| Thriller · My Kisah | Tamat & Siap Dibaca | **0** — dibuang server |
| lima lainnya | tag & Gratis | 3 |

**Cacat ini dibuat oleh perubahan ini, dan tidak ada hari ini.** Daftar tegak
berisi tiga cerita terbaca wajar; rel mendatar berisi tiga sampul dengan ruang
kosong di kanannya terbaca sebagai gagal memuat. Bentuk `ranked` selama ini
menyembunyikannya.

**Yang menghalangi perbaikannya bukan jumlah judul, melainkan dari mana
atributnya datang.** `status`, `monetizeType`, dan tag tiap cerita pengisi
**diturunkan dari indeksnya** di `seed.ts` — `i % 5 === 3` untuk gratis,
`FILLER_STATUS[(i-8) % 4]` untuk status, `tagsFor(genres, i)` memilih
`pool[i % pool.length]`. Selama begitu, isi sebuah section hanya bisa diatur
dengan menghitung mundur posisi tiap judul, dan satu judul yang disisipkan di
tengah menggeser atribut semua yang sesudahnya. `FILLER` karena itu harus
membawa `status`, `monetize`, dan `tags`-nya sendiri sebelum katalognya ditambah.

**Aturan "tiap section ≥ 6" dijaga skrip, bukan hitungan tangan** —
`scripts/cek-beranda.mjs`, ikut `npm run check`. Tanpa itu ia lapuk pada judul
berikutnya yang ditambahkan, dan gejalanya muncul sebagai satu section yang
terlihat rusak di satu tab saja.

#### Perbaikan 5 September sore · `bugs/bugs_home_content_01.png`

Empat penyesuaian setelah berandanya dilihat di preview mobile. Dua di antaranya
**cacat sungguhan**, dan keduanya tidak meluber sedikit pun — jadi sapuan lima
lebar yang ada tidak akan pernah menangkapnya.

**1. `snap-x` tanpa `scroll-px-4` memakan padding kiri rel.** Peramban
menempelkan kartu pertama ke tepi wadah, menggulir rel-nya sendiri saat dimuat,
dan padding kirinya hilang bersama gulirannya. Terukur: `scrollLeft: 16`,
`kartu.left: 0`, sementara kepala section-nya tetap di 16. Akibatnya sampul
pertama menempel persis di tepi layar. **Setiap rel bersnap wajib membawa
`scroll-px-*` yang sepadan dengan paddingnya.**

**2. `block` menimpa `line-clamp-2`.** Keduanya menyetel `display`, dan `block`
menang — jadi `line-clamp-2` tidak melakukan apa pun dan judul panjang tumbuh
jadi tiga baris tanpa elipsis. Terukur: tinggi judul 66px (tiga baris) walau
`webkitLineClamp` terbaca `2`. Sekarang 44px dan seragam untuk seluruh 140 kartu.

**3. Kartu bentuk grid tinggal sampul dan judul.** Nama pena, ★ rating, jumlah
baca, dan garis "+N baca minggu ini" dicabut dari beranda. Ketiganya tetap hidup
di `variant="list"`, yang punya lebar satu baris penuh. **Lencana di pojok sampul
tidak ikut dicabut** — ia menempel pada gambarnya, bukan baris data di bawahnya.
Prop `note` jadi mati dan ikut dihapus.

**4. Tiga section teratas bersih dari iklan**, dan jarak antar section **28 → 16px**
(sempat dicoba 14, dikembalikan ke 16).
Kedua slot iklan pindah ke bawah tab genre; jumlahnya di halaman tetap dua.
`SectionSettings` ikut disusun ulang lagi supaya urutan sakelarnya tetap
mengikuti halamannya.

#### Lapisan zoom diperbesar · `bugs/feedback_home_content_01.png`

Sampulnya **240×360 → 350×525** di layar 390px (+46%), dan **rating + jumlah
baca ditambahkan ke lapisannya** — bukan dikembalikan ke kartunya. Kartu di rel
tetap tinggal sampul dan judul; lapisan inilah tempat pembaca berhenti untuk
memutuskan, jadi di sinilah angkanya berguna.

**Ukurannya dijepit dua arah, dan itu bukan kehati-hatian berlebihan.** Sampul
2:3 yang hanya dibatasi lebar tumbuh 1,5× lebih tinggi daripada lebarnya, dan di
ponsel pendek tombolnya terdorong keluar layar. Rumusnya
`min(100%, max(11rem, (100dvh − 19rem) / 1.5))`, dan ketiga sukunya menjawab satu
bentuk layar masing-masing:

| Suku | Untuk apa | Terlihat di |
|---|---|---|
| `100%` | margin di layar sempit | 320px potret |
| `(100dvh − 19rem) / 1.5` | tombol tidak terdorong keluar | 320×568 |
| `max(11rem, …)` | teks tidak teremas | lanskap 844×390 |

**Lantai `11rem` ditemukan lewat pengukuran, bukan diperkirakan.** Menjepit lebar
dengan tinggi juga meremas teksnya, dan teks yang teremas justru tumbuh tinggi:
tanpa lantai itu, lanskap 844×390 menghasilkan panel setinggi **866px di layar
setinggi 390** — judul dan tombolnya pecah jadi belasan baris. Percobaan pertama
memakai `13rem` dan itu terlalu tinggi ke arah sebaliknya: 320×568 jadi perlu
digulir padahal sebelumnya muat.

**Satu cacat lama ikut tertutup.** Lapisannya tidak punya `overflow-y-auto`, jadi
pada bentuk layar yang tidak muat, isinya **terpotong dan tombolnya tidak bisa
dicapai sama sekali** — bukan sekadar perlu digulir. Terukur di 320×568 sebelum
perubahan ini.

#### Teks lapisan diperbesar, dan ketukan di mana saja menutupnya

Judul 20 → 26, nama pena dan statistik 12 → 14 — **naik di dalam skala yang
sudah ada**, bukan angka baru; skalanya keputusan terkunci §1.20 dan lapisan ini
bukan alasan menambah ukuran ketujuh.

**Ketukan di mana saja menutup**, kecuali `Buka cerita`. Dulu hanya latarnya, dan
itu benar sampai lapisannya diperbesar: setelah sampulnya memenuhi lebar layar,
sisa latar di kiri-kanan tinggal ~16px dan praktis tidak bisa dikenai jari.
Tombol `Tutup` tetap ada — ia satu-satunya kontrol tutup yang punya nama untuk
pembaca layar.

**Cadangan tinggi ikut naik 19 → 21rem.** Teks yang lebih besar memakan ruang
yang sama; cadangan yang tidak diperbarui bersamanya mendorong tombolnya keluar
layar di ponsel pendek.

**Satu bentuk layar sengaja dibiarkan menggulir: 320×568.** Di sana sampul 2:3
ditambah judul 26px dan dua tombol 44px memang tidak muat tanpa mengecilkan
sampulnya ke ~150px — dan itu membatalkan seluruh maksud "diperbesar". Sisa
ruangnya 2px, jadi perubahan metrik font sedikit saja akan membuatnya menggulir.
Itu **bukan kerusakan**: `overflow-y-auto` menjaga tombolnya tetap terjangkau,
dan itulah yang dituntut `CLAUDE.md` §2. Lanskap 844×390 juga menggulir, dengan
alasan yang sama.

#### Dua akibat yang diterima dengan sadar

**1. Keadaan kosong genre tidak akan pernah terlihat di aplikasi yang jalan.**
Setelah katalog ditambah, tidak ada genre yang benar-benar kosong — dan
diputuskan **tidak** dibuatkan sakelar dev (berbeda dari pita bundling §1.21,
yang dapat satu). Layarnya hanya hidup di test unit. Disebut di sini supaya sesi
berikutnya tidak menyimpulkan layarnya rusak karena tidak pernah muncul.

**2. Sampul gagal-muat jatuh ke jaket satu huruf.** Sampul contoh adalah URL
jarak jauh (`assets.kbm-cdn.com`); `Cover.tsx` tidak punya `onError`, jadi CDN
mati atau perangkat offline memunculkan ikon gambar rusak. Diperbaiki bersama
R2b, bukan ditunda: beranda 80px memuat ~30 gambar alih-alih ~12, dan seluruh
inti fitur zoom adalah gambarnya.

#### Angka 80px bukan selera

Dipilih dari lebar tersempit yang wajib lulus (`CLAUDE.md` §2). Pada lebar konten
344px dengan `gap-3`:

| Lebar sampul | Terlihat di 360px | Terlihat di 320px |
|---|---|---|
| 112 (sekarang) | 2,9 | 2,5 |
| 96 | 3,3 | 2,9 |
| **80** | **3,9** | **3,4** |
| 72 | 4,2 | 3,7 |

96px hanya menambah 0,4 sampul untuk pekerjaan yang sama besarnya; 72px memaksa
judul jadi satu baris terpotong dan membuat `★ rating` + jumlah baca tidak lagi
muat berdampingan. 80px satu-satunya yang mengubah kesan tanpa membuang
metadata.


---

## 2. Stack

| Kebutuhan | Pilihan | Alasan | Yang ditolak & kenapa |
|---|---|---|---|
| Build & dev server | **Vite 6** | HMR cepat, config sedikit, plugin PWA resmi | Next.js — SSR tidak dibutuhkan, app ini murni klien di balik login |
| UI | **React 19 + TypeScript** | Ekosistem terbesar, paling mudah cari orang | Svelte/Vue — bagus, tapi ekosistem pendukung lebih tipis |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest + service worker + precache dari satu plugin | SW tulis tangan — banyak kasus tepi (update, skipWaiting, navigation fallback) |
| Routing | **React Router v7** | Membosankan, semua orang tahu, nested layout + lazy route bawaan | TanStack Router — tipe lebih ketat, kurva belajar tak sepadan di sini |
| Server state | **TanStack Query v5** | Cache, retry, optimistic update, invalidation. Kunci untuk unlock bab & saldo koin | `useEffect` + `useState` — akan berakhir jadi Query versi lebih buruk |
| Client state | **Zustand + persist** | 3 store kecil; `persist` menggantikan try/catch localStorage tulis tangan | Redux — boilerplate tanpa manfaat di skala ini |
| Styling | **Tailwind CSS v4** | `@theme` memetakan token PRD jadi utility. Satu file token = PRD 01 §9.2 rec #1 | CSS Modules — konsisten, tapi 34 layar berarti ratusan file CSS |
| Form & validasi | **React Hook Form + Zod** | Validasi berat di studio/topup/withdraw; Zod dipakai ulang untuk kontrak API | Validasi manual — aturan PRD terlalu banyak dan berurutan |
| Persistensi mock | **Dexie (IndexedDB)** | Skema + migrasi 3 baris; query berindeks untuk daftar bab/transaksi | `localStorage` — kena batas ~5MB begitu naskah bab masuk |
| Ikon | **lucide-react** | Inline SVG, `currentColor`, tree-shakeable, self-host | FontAwesome CDN — gagal offline, versi tak seragam (PRD 01 §7) |
| Font | **@fontsource** — `novelova/`: Manrope + Cormorant Garamond · `novelova-v2/`: **Lora + Plus Jakarta Sans** (§1.20) | Self-host — syarat offline PWA (PRD 01 §4.2) | Google Fonts CDN — melanggar syarat offline |
| Angka & tanggal | **`Intl` bawaan** | `Intl.NumberFormat('id-ID')` menyelesaikan seluruh format rupiah | dayjs / date-fns — tidak ada kebutuhan yang tak tertangani `Intl` |
| Grafik | **Inline SVG tulis tangan** | Grafik PRD sederhana: 2-layer line, 7 bar, funnel, heatmap, kalender | Recharts / Chart.js — ~90KB untuk lima grafik statis |
| Lint & format | **Biome** | Satu alat, satu config, cepat | ESLint + Prettier — dua konfigurasi yang saling bertengkar |
| Test | **Vitest + Testing Library**, **Playwright** untuk 4 alur kritis | Vitest sekonfigurasi dengan Vite | Jest — perlu konfigurasi terpisah |

**Target build `es2022`, bukan "baseline" bawaan Vite.** Seam API memilih implementasinya dengan `await import()` di tingkat modul (§5), dan top-level await baru sah mulai `es2022` — Chrome 89+, Edge 89+, Firefox 89+, Safari 15+. Semuanya jauh di bawah syarat minimum PWA ini, dan alternatifnya (membungkus seluruh permukaan API dalam promise) merusak justru bagian yang membuat seam ini rapi.

**Total dependensi runtime: 11.** Tanpa library i18n, tanpa library tanggal, tanpa library grafik, tanpa UI kit, tanpa MSW.

**Revisi PRD tidak menambah satu pun dependensi.** Yang diminta modul baru sudah tersedia sebagai kemampuan bawaan platform: berbagi cerita (FR-DETAIL-15) → **Web Share API**; push (FR-NOTIF-05) → **Push API + Notifications API** lewat service worker yang sudah ada; saran ejaan *"Maksud Anda…?"* (FR-SRCH-05) → jarak Levenshtein ±15 baris di `lib/`; pencarian itu sendiri berjalan di server (prd_11 §7 #1), bukan sebagai indeks klien. Tidak ada library komentar, tidak ada library rating.

> **Catatan tentang MSW.** Opsi yang Anda pilih menyebut MSW. Saya ganti mekanismenya: implementasi mock dipanggil **langsung sebagai fungsi async**, bukan lewat service worker MSW. Alasannya konkret — MSW dan service worker PWA sama-sama mendaftar di scope `/`, dan build PWA dengan MSW aktif menghasilkan dua SW yang saling menimpa. Kontrak, seed, dan janji "ganti satu folder" tetap sama persis. MSW bisa ditambahkan nanti khusus untuk menguji implementasi HTTP.

---

## 3. Struktur Folder

```
novelova/
├─ public/
│  ├─ icons/                        # 192, 512, maskable, apple-touch
│  ├─ assets/                       # cover default, gambar iklan lokal
│  └─ offline.html                  # fallback navigasi saat offline
│
├─ src/
│  ├─ main.tsx                      # entry: mount + registrasi SW
│  ├─ App.tsx                       # provider tree + router
│  │
│  ├─ app/
│  │  ├─ providers/
│  │  │  ├─ QueryProvider.tsx
│  │  │  ├─ SessionProvider.tsx     # guard rute + hidrasi sesi
│  │  │  └─ ToastProvider.tsx       # satu host toast global (FR-READ-10)
│  │  ├─ layouts/
│  │  │  ├─ AppShell.tsx            # bottom nav (HP) / sidebar (desktop)
│  │  │  ├─ TopBarLayout.tsx        # top bar + tombol kembali, tanpa nav
│  │  │  ├─ ReaderLayout.tsx        # layar penuh, tanpa nav (FR-READ-14)
│  │  │  └─ AuthLayout.tsx
│  │  └─ ErrorBoundary.tsx
│  │
│  ├─ routes/
│  │  ├─ index.tsx                  # definisi route tree (lazy per modul)
│  │  └─ guards.ts                  # requireAuth
│  │
│  ├─ features/                     # satu folder per modul PRD
│  │  ├─ auth/                      # prd_02  (+ onboarding, FR-AUTH-11)
│  │  ├─ home/                      # prd_03  (beranda + see-all)
│  │  ├─ search/                    # prd_11  (pencarian katalog)
│  │  ├─ notifications/             # prd_11  (pusat notifikasi + preferensi)
│  │  ├─ story/                     # prd_04
│  │  ├─ reader/                    # prd_05
│  │  ├─ library/                   # prd_06
│  │  ├─ social/                    # prd_12  (rating, ulasan, komentar, laporan)
│  │  ├─ studio/                    # prd_07  (modul terbesar)
│  │  ├─ earnings/                  # prd_08
│  │  ├─ wallet/                    # prd_09  (topup, transaksi, detail)
│  │  ├─ rewards/                   # prd_09  (pusat hadiah + voucher terpadu)
│  │  └─ profile/                   # prd_10  (profil, pengaturan, bantuan, legal)
│  │
│  │     setiap feature berisi:
│  │        pages/        komponen level rute
│  │        components/   komponen khusus feature
│  │        hooks/        useXxxQuery / useXxxMutation
│  │        schema.ts     skema Zod khusus form feature ini
│  │
│  ├─ components/
│  │  ├─ ui/                        # primitif design system (§9.3)
│  │  └─ patterns/                  # komposisi lintas-feature (§9.3)
│  │
│  ├─ api/                          # ── SATU-SATUNYA SEAM KE DATA ──
│  │  ├─ client.ts                  # permukaan fungsi bertipe (dipakai UI)
│  │  ├─ contracts/                 # skema Zod + tipe hasil inferensi
│  │  │  └─ story.ts chapter.ts wallet.ts user.ts studio.ts rewards.ts
│  │  │     social.ts notification.ts search.ts
│  │  ├─ mock/
│  │  │  ├─ db.ts                   # skema Dexie
│  │  │  ├─ seed.ts                 # data awal dari PRD
│  │  │  └─ handlers/               # implementasi mock per modul
│  │  ├─ http/                      # implementasi fetch (stub di v1)
│  │  └─ errors.ts                  # ApiError bertipe
│  │
│  ├─ payments/
│  │  ├─ provider.ts                # antarmuka PaymentProvider
│  │  ├─ mock.ts                    # v1 — timer + status palsu
│  │  └─ midtrans.ts                # v2 — stub
│  │
│  ├─ ads/
│  │  ├─ provider.ts                # antarmuka AdProvider
│  │  ├─ mock.ts                    # v1
│  │  └─ admob.ts                   # v2 — stub
│  │
│  ├─ stores/                       # HANYA preferensi tampilan & kenyamanan (FR-CORE-01)
│  │  ├─ session.ts                 # token di memori; refresh lewat cookie HttpOnly
│  │  ├─ readerSettings.ts          # novelova-reader-settings-v1  (kunci PRD)
│  │  ├─ homeSections.ts            # home_section_visibility_v1   (kunci PRD)
│  │  ├─ searchHistory.ts           # novelova:search-history-v1   (FR-SRCH-03)
│  │  ├─ drafts.ts                  # cadangan lokal naskah & ulasan (FR-STUDIO-34)
│  │  └─ ui.ts                      # tema, toast queue, sheet stack
│  │
│  ├─ hooks/                      # state server LINTAS FITUR (useReaderPrefs)
│  ├─ i18n/
│  │  ├─ id.ts                      # seluruh string UI
│  │  └─ t.ts                       # t('key') + interpolasi sederhana
│  │
│  ├─ lib/
│  │  ├─ coin.ts                    # formatCompactCoin, calcPrice, konstanta
│  │  ├─ format.ts                  # rupiah, angka, tanggal relatif (Intl)
│  │  ├─ date.ts                    # todayLocalISO() — koreksi timezone
│  │  ├─ idempotency.ts             # kunci idempotency per order
│  │  ├─ similar.ts                 # jarak Levenshtein → "Maksud Anda…?" (FR-SRCH-05)
│  │  └─ a11y.ts                    # useFocusTrap, useDismissable
│  │
│  ├─ styles/
│  │  ├─ tokens.css                 # ← SATU-SATUNYA sumber warna/ukuran
│  │  └─ base.css                   # reset, font-face, @theme Tailwind
│  │
│  └─ types/
│
├─ tests/
│  ├─ unit/                         # lib, store, handler mock
│  └─ e2e/                          # 4 alur kritis (§14)
│
├─ index.html
├─ vite.config.ts                   # + VitePWA
├─ tsconfig.json
├─ biome.json
└─ package.json
```

**Aturan struktur:**

- `features/*` **tidak boleh** mengimpor dari `features/*` lain. Yang dipakai bersama naik ke `components/patterns/`, `lib/`, atau — khusus state server yang dibaca lebih dari satu fitur — `hooks/`. Contohnya `useReaderPrefs`: onboarding menulisnya, beranda membacanya untuk mengurutkan tab.
- Hanya `features/*/hooks/` yang memanggil `api/client`. Komponen tidak pernah memanggil API langsung.
- `components/ui/` tidak tahu apa pun tentang domain — tidak ada kata "cerita", "bab", atau "koin" di dalamnya.
- Satu warna hex hanya boleh ditulis di `styles/tokens.css`. Hex di luar file itu = bug lint.
- **`stores/` tidak boleh menyimpan apa yang dimiliki pengguna** (FR-CORE-01). Saldo, kepemilikan bab, koleksi, progres, naskah, privasi, dan bahasa hidup di balik `api/client`. Kalau sesuatu harus ikut saat pengguna berganti perangkat, ia bukan urusan `stores/`.

---

## 4. Lapisan

```
┌──────────────────────────────────────────────────────────┐
│  Pages / Components         React, tanpa logika data      │
├──────────────────────────────────────────────────────────┤
│  Hooks (per feature)        TanStack Query + Zustand      │
├──────────────────────────────────────────────────────────┤
│  api/client.ts              ← SEAM. Fungsi async bertipe  │
├─────────────────┬────────────────────────────────────────┤
│  api/mock/      │  api/http/       ← ditukar lewat env    │
│  Dexie          │  fetch           VITE_API_MODE          │
└─────────────────┴────────────────────────────────────────┘
         ↕                        ↕
    payments/provider        ads/provider
    (mock | midtrans)        (mock | admob)
```

Arah impor selalu ke bawah. Tidak ada lapisan yang mengimpor lapisan di atasnya.

---

## 5. Seam API

Inti dari keputusan "frontend dulu". Seluruh aplikasi berbicara ke satu permukaan fungsi:

```ts
// src/api/client.ts
export interface NovelovaApi {
  // sesi                                                     FR-AUTH-12
  login(input: LoginInput): Promise<Session>
  refresh(): Promise<Session>                                 // cookie HttpOnly
  logout(): Promise<void>

  // discovery
  getHomeFeed(genre?: GenreId): Promise<HomeFeed>             // FR-HOME-13
  getSection(id: SectionId, params: ListParams): Promise<Paged<Story>>

  // pencarian                                                prd_11
  search(q: string, params: SearchParams): Promise<SearchResult>  // cerita+penulis+tag
  getSuggestions(q: string): Promise<Suggestion[]>            // maks 8
  getTrendingQueries(): Promise<string[]>

  // cerita & bab
  getStory(storyId: string): Promise<StoryDetail>
  getChapters(storyId: string, params: ListParams): Promise<Paged<ChapterSummary>>
  getChapter(storyId: string, chapterId: string): Promise<Chapter>
  unlockChapter(input: UnlockInput): Promise<UnlockResult>    // idempoten
  redeemVoucher(code: string): Promise<Voucher>               // menukar → memiliki
  applyVoucher(voucherId: string, storyId: string): Promise<RedeemResult>
  saveProgress(input: ProgressInput): Promise<void>           // throttle 10 dtk
  toggleLibrary(storyId: string): Promise<LibraryEntry>       // optimistis
  toggleFollow(storyId: string): Promise<LibraryEntry>        // optimistis

  // dompet
  getWallet(): Promise<Wallet>                                // satu-satunya saldo
  createTopupOrder(input: TopupInput): Promise<TopupOrder>
  getTopupOrder(orderId: string): Promise<TopupOrder>
  listTransactions(params: TxParams): Promise<Paged<Transaction>>
  getTransaction(txId: string): Promise<TransactionDetail>    // FR-WALLET-19

  // sosial                                                   prd_12
  rateStory(storyId: string, stars: 1|2|3|4|5): Promise<Rating>
  submitReview(input: ReviewInput): Promise<Review>           // satu per (user, cerita)
  listReviews(storyId: string, params: ReviewParams): Promise<ReviewPage>
  listComments(chapterId: string, params: ListParams): Promise<Paged<Comment>>
  react(target: ReactTarget, on: boolean): Promise<void>      // optimistis
  report(input: ReportInput): Promise<void>

  // notifikasi                                               prd_11
  listNotifications(params: NotifParams): Promise<Paged<Notification>>
  getUnreadCount(): Promise<number>
  markRead(ids: string[] | 'all'): Promise<void>              // optimistis
  getNotificationPrefs(): Promise<NotificationPrefs>
  setNotificationPrefs(p: NotificationPrefs): Promise<void>

  // ... library, studio, earnings, rewards, profile
}

const impl = import.meta.env.VITE_API_MODE === 'http'
  ? await import('./http')
  : await import('./mock')

export const api: NovelovaApi = impl.api
```

**Aturan seam:**

1. Setiap respons **divalidasi Zod** di batas seam, di kedua implementasi. Data rusak gagal di satu tempat, bukan menyebar jadi `undefined` di JSX.
2. Setiap error dinormalkan jadi `ApiError { code, message, retryable, detail?, retryAt? }`. UI tidak pernah melihat objek error mentah. `retryAt` ada untuk kegagalan yang menahan pengguna sampai jam tertentu (`AUTH-429`, kode bayar kedaluwarsa): layarnya wajib menyebut jamnya, dan itu hanya mungkin kalau waktunya ikut di error.
3. Mutasi yang menyentuh uang (`unlockChapter`, `createTopupOrder`, `requestWithdrawal`) **wajib menerima `idempotencyKey`**. Dijalankan dua kali dengan kunci sama = satu efek. Ini menutup PRD 09 §7 #16, sekaligus menegakkan FR-READ-07 aturan 1 (menekan dua kali tidak memotong saldo dua kali).
4. Kontrak tidak pernah menyebut Dexie, tabel, atau `fetch`. Ia hanya bicara domain.
5. **Mutasi yang punya pasangan tampilan langsung memakai pembaruan optimistis dengan pengembalian** (FR-CORE-03): simpan ke perpustakaan, follow, sakelar notifikasi, reaksi "membantu"/suka, dan tandai terbaca. Berubah seketika di layar; bila server menolak, dikembalikan **disertai pesan** — bukan diam-diam. Mutasi uang **tidak** optimistis: saldo hanya berubah setelah server mengonfirmasi.
6. **Penyaringan, pencarian, dan pengurutan daftar besar dikerjakan di seam, bukan di komponen** (prd_11 §7 #1, FR-LIB-11). Katalog ratusan cerita tidak akan sanggup disaring dari DOM. `ListParams` selalu membawa `page`, `sort`, dan saringan; komponen hanya merender apa yang dikembalikan.

**Implementasi mock menjalankan aturan bisnis sungguhan**: saldo dikurangi secara transaksional, ledger dicatat, kuota iklan dicek per tanggal, kepemilikan bab disimpan, klaim check-in ditolak bila sudah ada untuk tanggal itu. Yang palsu hanya *sumber* data (Dexie, bukan server) dan *konfirmasi pembayaran* (timer, bukan webhook).

> **Dexie ada di sisi server dari seam, bukan sisi klien.** Ini penting sejak FR-CORE-01: yang disimpan di sana adalah data yang *seharusnya* di server, dan ia dibaca **hanya** oleh `api/mock/`. Komponen tidak pernah membuka Dexie. Kalau suatu saat ada komponen yang meng-`import 'dexie'`, seam-nya sudah bocor dan janji "ganti satu folder" batal.

Saat backend nyata siap: tulis `api/http/`, ubah satu variabel env. Tidak ada komponen yang berubah.

---

## 6. Model Domain

### 6.1 Entitas

| Entitas | Field kunci | Sumber PRD |
|---|---|---|
| `User` | id, displayName, username, avatar, role, tier, joinedYear, penName | prd_10 |
| `Story` | id, title, synopsis, coverUrl, **bannerUrl**, **kind** (`fiksi`\|`kisah`), authorId, penName, genres[], tags[], status, **review** (`draft`\|`in_review`\|`rejected`\|`published`), rejectReason, visibility, monetizeType, language, audience, stats | prd_04, prd_07, FR-STUDIO-38 |
| `Chapter` | id, storyId, number, title, access, priceCoins, previewPct, state, **review**, publishAt, publishTz, wordCount, stats | prd_04, prd_07, FR-STUDIO-36/38 |
| `ChapterContent` | chapterId, lang (`id`\|`en`), title, body, authorNote | FR-STUDIO-19 |
| `Wallet` | userId, balance, bonus, updatedAt | prd_05, prd_09 |
| `Transaction` | id, userId, kind (`topup`\|`spend`\|`reward`\|`pending`), amount, refType, refId, method, status, createdAt | FR-WALLET-15 |
| `Ownership` | userId, chapterId, source (`coin`\|`bundle`\|`full`\|`ad`\|`voucher`), acquiredAt | FR-READ-07 |
| `LibraryEntry` | userId, storyId, savedAt, notify, removed | prd_06 |
| `ReadingProgress` | userId, storyId, lastChapterId, scrollPct, finishedChapterIds[], updatedAt | FR-READ-16, FR-LIB-11 |
| `AdQuota` | userId, date (`YYYY-MM-DD`), used, max | FR-READ-08, FR-READ-18 |
| `Voucher` | id, code, ownerId, scope (`chapter`\|`firstN`\|`story`\|`cross`), storyIds[], chapterIds[], value (`free`\|`pct`), expiresAt, unlockCond, maxUses, usedCount | FR-RWD-06 |
| `Reward` | userId, checkInStreak, lastCheckIn (`YYYY-MM-DD` zona pengguna), missions[], referralCode | prd_09 E, FR-RWD-07 |
| `PrintOrder` | id (`HDC-`\|`SFT-`), storyId, type, config, shipping, **status** `submitted`\|`confirmed`\|`paid`\|`printing`\|`shipped`\|`received`\|`rejected`\|`cancelled`\|`build_failed`\|`expired`\|`cost_changed`, timeline[], costQuoted, costFinal, rejectReason, fileUrl, fileExpiresAt | FR-STUDIO-32, §1.5 |
| `Withdrawal` | id, userId, amount, fee, net, bankAccount, status (`submitted`\|`review`\|`transferred`\|`rejected`), reason, proofUrl, requestedAt | prd_08, FR-EARN-12 |
| `TopupOrder` | id (`INV-NVL-`), coins, bonus, price, method, type, **status** `pending`\|`paid`\|`expired`\|`declined`\|`pending_reconciliation`, expiresAt, idempotencyKey, returnCtx | prd_09, FR-WALLET-18, §1.4 |

**Ditambahkan oleh revisi PRD:**

| Entitas | Field kunci | Sumber PRD |
|---|---|---|
| `Rating` | userId, storyId, stars (1–5 bulat), updatedAt | FR-SOCIAL-01 |
| `Review` | id, userId, storyId, ratingRef, text (20–1000), tags[] (maks 3), spoiler, editedAt, helpfulCount | FR-SOCIAL-02/06 |
| `AuthorReply` | reviewId, authorId, text, updatedAt — satu per ulasan | FR-SOCIAL-04 |
| `Comment` | id, chapterId, userId, parentId (satu tingkat), text (maks 500), spoiler, likeCount, createdAt | FR-SOCIAL-05 |
| `Reaction` | userId, targetType (`review`\|`comment`), targetId — satu per pasangan | FR-SOCIAL-04/05 |
| `Report` | id, reporterId, targetType, targetId, reason, note, createdAt — satu per pasangan | FR-SOCIAL-07 |
| `Block` | userId, blockedUserId | FR-SOCIAL-07 |
| `ReviewQueueItem` | id, kind (`story`\|`chapter`\|`report`\|`print`), refId, status, reason, decidedAt | FR-STUDIO-38 |
| `Notification` | id, userId, type, title, body, deepLink, groupKey, readAt, createdAt | FR-NOTIF-01/02 |
| `NotificationPrefs` | userId, per-jenis `{ inApp, push, email }` — keamanan terkunci `true` | FR-NOTIF-04 |
| `PushSubscription` | userId, endpoint, keys, createdAt | FR-NOTIF-05 |
| `Follow` | followerId, followeeId, createdAt | FR-PROF-09 |
| `AuthorProfile` | userId, tier (`none`\|`registered`\|`verified`), payoutVerified, twoFactor, termsAcceptedAt | FR-STUDIO-33 |
| `ReaderPrefs` | `userId` · `genres[]` · `hiddenStoryIds[]` · `onboardedAt` | Preferensi onboarding (FR-AUTH-11). **Di server**, karena "sudah pernah onboarding" yang hanya hidup di satu peramban membuat pengguna mengulanginya di tiap perangkat baru. `genres` mengurutkan, tidak menyaring. |
| `PrivacySettings` | userId, `{ readingActivity, library, reviews, wallet }` — **di server** | FR-PROF-10 |
| `LocaleSettings` | userId, uiLang, translationPriority, contentRegion, currency, timezone | FR-SET-04 |
| `ScheduleEntry` | id, storyId, chapterId?, publishAtUtc, authorTz, repeat | FR-STUDIO-37 |
| `DataExport` | id, userId, status, categories[], downloadUrl, expiresAt | FR-SET-05 |
| `AccountDeletion` | userId, requestedAt, purgeAt (+30 hari), blockedReason | FR-SET-05 |

### 6.2 Relasi yang menentukan perilaku

- `Ownership` adalah **satu-satunya** penentu apakah bab terbuka. Bukan flag di `Chapter`, bukan `data-lock` di DOM. Menutup PRD 04 §7 #1 dan PRD 05 §7 #1.
- Membeli bundle 10 bab menulis **10 baris** `Ownership`, bukan satu. Membeli "sampai tamat" menulis baris untuk seluruh bab. Menutup PRD 05 §7 #4 — perbedaan satuan/bundle/tamat jadi nyata.
- `Transaction` adalah buku besar. Setiap perubahan saldo **wajib** punya baris di sini. Saldo di `Wallet` adalah cache dari jumlah ledger, bukan sumber kebenaran.
- `AdQuota` berkunci `(userId, date)`. Muat ulang halaman tidak mengembalikan kuota — menutup PRD 05 §7 #2. Kuota dipotong **setelah** tayangan selesai, bukan saat tombol ditekan (FR-READ-18).
- **`Rating` dan `Review` terpisah** (FR-SOCIAL-02). Ulasan wajib punya rating; menghapus ulasan **tidak** menghapus ratingnya. Alasannya di prd_12 §7 #2: banyak pembaca mau memberi bintang tapi tidak mau menulis — menggabungkan keduanya menekan jumlah rating drastis.
- **`LibraryEntry.savedAt` dan `.notify` adalah dua hal berbeda** (FR-DETAIL-13). Menyimpan cerita otomatis menyalakan `notify`; mematikan `notify` **tidak** mengeluarkan cerita dari koleksi.
- **`Voucher` membawa aturannya sendiri.** Menerapkannya menghasilkan daftar `chapterId` yang berhak sesuai `scope` — bukan membuka seluruh bab terkunci seperti prototipe (FR-RWD-06, menutup PRD 04 §7 #3). Kode yang ditukar **masuk dulu** ke daftar voucher pengguna, baru dipakai: dua langkah yang terlihat sebagai satu aksi.
- **`ReviewQueueItem` adalah satu antrean untuk empat sumber** (FR-STUDIO-38): cerita dikirim terbit, bab dikirim terbit, laporan pembaca (FR-SOCIAL-07), dan pesanan cetak menunggu konfirmasi. Penulis melihat satu jenis status tinjauan di seluruh studio, bukan tiga mekanisme berbeda.
- **`Notification.groupKey`** menggabungkan notifikasi sejenis dari cerita yang sama dalam 24 jam (*"3 bab baru di …"*). Penggabungan dilakukan di sisi server-mock, bukan saat render — supaya daftar dalam aplikasi dan push selalu sama (prd_11 §7 #3).
- **`PrivacySettings` dan aturan platform bukan hal yang sama** (FR-PROF-10). Sakelar mengendalikan tab Activity, Books, dan ulasan di profil publik. Data dompet **selalu tersembunyi** di profil orang lain apa pun nilai sakelarnya — itu aturan platform, bukan preferensi.
- **Semua tanggal harian memakai zona waktu pengguna** dari `LocaleSettings.timezone`, bukan zona waktu server (FR-CORE-01, FR-SET-04): klaim check-in, kuota iklan harian, reset misi, dan jam tenang push.

### 6.3 Konstanta produk

Terkunci di `src/lib/coin.ts`, tidak boleh diduplikasi di tempat lain:

```ts
export const COIN_RATE = 130              // Rp per koin
export const MIN_CUSTOM_COINS = 100
export const PRICE_SINGLE = 1_500
export const PRICE_BUNDLE_10 = 12_000     // hemat ±5%
export const PRICE_FULL = 36_900          // hemat ±10%
export const AD_QUOTA_MAX = 3
export const PROMO = { coins: 500, bonus: 50 }
export const EXPIRY_MIN = { ewallet: 15, qris: 30, va: 1440 }
export const AUTHOR_SHARE = 0.8           // 80/20
export const WITHDRAW_MIN = 100_000
export const WITHDRAW_FEE = 5_000
export const READER_DEFAULTS = { fontSize: 18, darkTheme: false, autoUnlock: false }

// Rp, dibulatkan ke kelipatan 100 terdekat  (FR-WALLET-03)
export const calcPrice = (coins: number) => Math.round(coins * COIN_RATE / 100) * 100

// FR-READ-05: 15300 → "15.3rb" · 12000 → "12rb" · 1500000 → "1.5jt" · 800 → "800"
export function formatCompactCoin(v: number): string { /* ... */ }
```

Konstanta yang ditambahkan revisi PRD — `src/lib/limits.ts`:

```ts
// daftar & paginasi
export const PAGE_SIZE = 20               // seragam di seluruh aplikasi

// pencarian                              prd_11
export const SEARCH_MIN_CHARS = 2         // di bawah ini: tidak ada permintaan
export const SEARCH_DEBOUNCE_MS = 300
export const SEARCH_HISTORY_MAX = 10
export const SUGGESTION_MAX = 8

// progres baca                           FR-READ-16
export const PROGRESS_THROTTLE_MS = 10_000
export const CHAPTER_DONE_PCT = 0.9       // ≥90% = bab selesai

// naskah                                 FR-STUDIO-34
export const AUTOSAVE_LOCAL_MS = 3_000
export const AUTOSAVE_SERVER_MS = 30_000

// sosial                                 prd_12
export const REVIEW_MIN_CHARS = 20
export const REVIEW_MAX_CHARS = 1_000
export const REVIEW_TAGS_MAX = 3
export const COMMENT_MAX_CHARS = 500
export const COMMENT_DEPTH_MAX = 1        // balasan satu tingkat saja

// notifikasi                             prd_11
export const NOTIF_RETENTION_DAYS = 90
export const UNREAD_BADGE_MAX = 9         // di atasnya ditulis "9+"
export const QUIET_HOURS = { from: 22, to: 7 }   // waktu lokal pengguna

// akun                                   FR-SET-05
export const DELETE_GRACE_DAYS = 30

// keadaan gagal                          §1.4 — di luar PRD, dari kanvas seksi 7a
export const TOAST_MS = 4_000
export const RETRY_ESCALATE_AT = 2        // percobaan ke-3 memakai label berbeda
export const AUTOSAVE_FAIL_ALERT = 4      // gagal 4× → tawarkan salin & unduh
export const PAY_CONFIRM_TIMEOUT_S = 90
export const PAY_RECONCILE_MIN = 10
export const LOGIN_ATTEMPTS_MAX = 5
export const LOGIN_LOCKOUT_MIN = 15
export const SESSION_IDLE_DAYS = 30

// formulir cerita                        §1.5 — angka dari PRD, bukan dari kanvas
export const STORY_TITLE_MAX = 100
export const STORY_SYNOPSIS_MAX = 1_000
export const STORY_SYNOPSIS_MIN = 50
export const COVER_MAX_BYTES = 5 * 1024 * 1024
export const COVER_RATIO = 2 / 3
export const COVER_RATIO_TOLERANCE = 0.12 // di luar toleransi: disarankan, tidak ditolak
export const EXTRA_GENRES_MAX = 2
export const STORY_TAGS_MAX = 10

// cetak & jadwal                         FR-STUDIO-32/37 · §1.5
export const PDF_RETENTION_DAYS = 30
export const PDF_BUILD_TIMEOUT_MIN = 15   // lewat batas → PRINT-504, tawarkan pecah berkas
export const PRINT_MIN_CHAPTERS = 10      // syarat kelayakan jilid; jadi alasan penolakan
export const SCHEDULE_CLASH_MIN = 60      // dua terbit < 1 jam pada cerita sama = bentrok
```

Angka yang **sengaja tidak** jadi konstanta: kurs koin→rupiah dan bagi hasil 80/20 pada layar penghasilan. FR-EARN-12 mensyaratkan keduanya datang dari konfigurasi server, karena keduanya bisa berubah tanpa rilis aplikasi. `AUTHOR_SHARE` di atas hanya dipakai sebagai nilai bawaan seed.

### 6.4 Data seed

Pembaruan desain membawa `novelova-data.js` — dataset contoh yang dipakai kanvas, seluruhnya berbahasa Indonesia. **Inilah sumber `src/api/mock/seed.ts`**, bukan angka karangan sendiri: memakainya berarti mockup dan aplikasi menampilkan cerita, bab, dan ulasan yang sama, sehingga perbandingan visual jadi jujur.

**Gambarnya datang dari `sample_data/`**, dua berkas JSON dengan peran yang tidak bisa ditukar: `new_kbm_main.content_data.json` (100 sampul potret → `Story.coverUrl`) dan `new_kbm_main.media.json` (20 gambar lanskap → `Story.bannerUrl`). Keduanya diimpor sebagai modul oleh `src/api/mock/sampleImages.ts`, bukan diambil lewat `fetch`: seed harus siap sebelum permintaan pertama dijawab. Karena hanya `api/mock` yang mengimpornya, keduanya tidak ikut ke bundel mode `http`. Pemasangannya berputar (`index % pool.length`), bukan acak — seed yang menghasilkan gambar berbeda tiap kali dijalankan membuat perbandingan visual antar sesi tidak berarti.

| Koleksi | Isi | Yang dibuktikannya |
|---|---|---|
| `STORIES` | 8 cerita — judul, penulis, genre, rating, jumlah baca, status (Berjalan/Tamat/Hiatus), lencana, tanggal update. Seed **menambah 32 cerita pengisi** di belakangnya: beranda menampilkan 20 per section, dan delapan cerita menyisakan baris setengah kosong di layar lebar. Delapan pertama tidak berubah — itulah yang membuat perbandingan dengan kanvas jujur | Kartu cerita di 5 layar berbeda |
| `CHAPTERS` | 8 bab dengan harga **0 · 1.500 · 1.800 · 2.000** | Harga per bab, bukan konstanta (FR-DETAIL-14) |
| `PROSE` · `PREVIEW` | 5 paragraf isi bab + 2 paragraf pratinjau tersensor | Gerbang bab terkunci (FR-READ-06) |
| `PKGS` · `METHOD_GROUPS` | 6 paket koin, 4 grup metode bayar | FR-WALLET-02/04 |
| `LIB_SEED` | 6 entri perpustakaan dengan status `reading`/`finished`/`not-started` | Aturan status FR-LIB-11 |
| `NOTIFS` | 9 notifikasi, **4 jenis** (`cerita`·`dompet`·`hadiah`·`sistem`), 3 belum dibaca, satu tergabung (*"3 bab baru di…"*) | Saringan + lencana + penggabungan (FR-NOTIF-01/02/03) |
| `REVIEWS` | 6 ulasan — 1 milik sendiri (tersunting), 1 bertanda spoiler, 1 dengan tanggapan penulis, **1 rating tanpa teks** | Rating ≠ ulasan, saringan "hanya yang ada teksnya" (FR-SOCIAL-01/02/03) |
| `COMMENTS` | 5 komentar, 3 balasan (satu tingkat), **1 ditandai moderator** | Kedalaman balasan + konten dilaporkan (FR-SOCIAL-05/07) |
| `AUTHOR_STORIES` | 5 karya menutupi 5 status | Aksi kondisional per status (FR-STUDIO-02) |
| `AUTHOR_CHAPTERS` | 7 bab: `draft`·`scheduled`·`published`·`private` | FR-STUDIO-08 |

Pembaruan desain final menambah **11 koleksi** untuk klaster profil, pengaturan, bantuan, dan legal (12 → 23):

| Koleksi | Isi | Yang dibuktikannya |
|---|---|---|
| `FOLLOWERS` · `FOLLOWING_IDX` | 24 pengguna · 8 di antaranya diikuti; satu bertanda `hidden: true` (*“Aktivitas disembunyikan”*) | Dua tab dari satu koleksi + privasi yang benar-benar berlaku ke pengunjung (FR-PROF-09/10) |
| `PROF_ACTIVITY` | 5 aktivitas berjenis `baca`·`ulasan`·`unlock` | Tab Activity profil publik, disaring `VIS_CATS` |
| `VIS_CATS` | 4 kategori visibilitas — aktivitas baca · rak · ulasan · dompet | Sakelar induk + konfirmasi khusus untuk dompet (FR-PROF-10) |
| `SESSIONS` | 3 perangkat: satu `current`, satu `stale` 12 hari | Daftar sesi aktif + saran keamanan (FR-SET-02) |
| `HELP_CATS` · `FAQS` | 4 kategori bantuan · 3 FAQ dengan satu terbuka | Akordeon + tautan silang ke halaman yang dirujuk |
| `LANG_OPTS` | 5 daftar pilihan — bahasa · prioritas terjemahan · wilayah · mata uang · zona waktu | FR-SET-01/04, termasuk mata uang USD dan zona non-WIB |
| `TERMS` · `DATA_MAP` · `RIGHTS` | 5 pasal ketentuan · 4 kategori data · 5 hak pengguna | Halaman legal — **termasuk pasal kelima yang di prototipe hilang** (§15, PRD 10 §7 #7) |

`HELP_CATS` dan `RIGHTS` membawa `href` ke layar tujuan; entri **tanpa** `href` (“riwayat cetak”) menandai persis rute yang saat itu belum punya mockup — kanvas jujur soal lubangnya sendiri. Seksi `8a` menutup lubang itu, jadi `href`-nya kini bisa diisi.

Seksi `8a` menambah **2 koleksi** (23 → 25):

| Koleksi | Isi | Yang dibuktikannya |
|---|---|---|
| `PRINT_JOBS` | 6 pesanan cetak menutupi **seluruh keadaan**: PDF selesai (4,2 MB, berlaku 30 hari) · hardcopy dikirim (resi + ETA) · hardcopy sedang produksi · PDF gagal dibuat · hardcopy menunggu konfirmasi admin · berkas kedaluwarsa | Setiap tahap lini masa punya aksi yang berbeda, dan pembatalan hanya boleh sebelum produksi (§1.5) |
| `UNI_SCHEDULE` | 6 entri jadwal: 3 terjadwal normal, 2 celah (satu cerita rutin tanpa jadwal berikutnya, satu dengan 6 draf menumpuk), 1 bentrok | Tiga jenis baris jadwal terpadu — termasuk celah yang hanya terlihat lintas cerita (FR-STUDIO-37) |

`PRINT_JOBS` memakai `stage` numerik 0–5 sesuai keadaan yang digambar kanvas; saat disalin ke `seed.ts` ia dipetakan ke lini masa **enam tahap PRD** dan diberi nomor pesanan `#HDC-`/`#SFT-` yang kanvas tidak gambar (§1.5).

**Yang perlu ditambahkan ke seed** karena kanvas belum memuatnya: `AuthorProfile` bertingkat (`none`/`registered`/`verified`), status tinjauan `in_review`/`rejected` pada cerita & bab (FR-STUDIO-38), voucher berjenis cakupan (FR-RWD-06), riwayat penarikan termasuk satu berstatus **Ditolak** (kanvas sudah memuat contohnya: *"Ditolak · rekening tidak cocok"*), dan `PrivacySettings` + `LocaleSettings`.

Seed dinormalkan saat disalin: kanvas memakai kunci pendek (`t`, `a`, `g`, `r`, `st`) untuk menghemat ukuran berkas; `seed.ts` memakai nama field domain penuh sesuai §6.1. Nilai yang sudah diformat (`readsL: '985rb'`) **tidak** ikut disalin — angka mentah disimpan, formatnya dihasilkan `formatCompactCoin` dan `Intl`.

---

## 7. State Management

FR-CORE-01 menetapkan garis yang sebelumnya tidak ada di prototipe: **apa yang boleh di perangkat dan apa yang wajib di server.** Aturan sederhananya — *kalau harus ikut saat pengguna berganti perangkat, ia bukan urusan `stores/`.*

| Lapisan | Alat | Isi | Kapan hilang |
|---|---|---|---|
| **Server state** | TanStack Query di atas `api/client` | Kepemilikan bab · saldo & ledger · koleksi & follow · progres baca · streak, kuota iklan, misi · naskah cerita & bab · privasi · bahasa/wilayah/zona waktu · rating, ulasan, komentar · notifikasi & preferensinya | Cache TTL / invalidation — **datanya sendiri tidak pernah hilang** |
| **Client persisten** | Zustand `persist` | **Hanya preferensi tampilan & kenyamanan**: pengaturan pembaca, visibilitas section beranda, riwayat pencarian, cadangan draf lokal, tema | Sampai data peramban dibersihkan |
| **Client sementara** | `useState` / `useReducer` | Sheet terbuka, tab aktif, isi form belum disimpan, langkah wizard | Pindah halaman |
| **URL** | `useSearchParams` | Kueri pencarian, saringan, urutan, halaman, `chapter_id`, konteks kembali top-up | — (bisa dibagikan, aman untuk tombol back) |

**Yang pindah dari klien ke server karena revisi ini:** saldo koin (FR-WALLET-17 — prototipe punya **empat** saldo berbeda untuk satu dompet), kepemilikan bab, isi perpustakaan, progres baca, kuota iklan & klaim check-in, isi naskah bab, dan pengaturan privasi. Semuanya sebelumnya hidup di memori halaman dan hilang saat muat ulang; itulah sebabnya tidak ada satu pun alur prototipe yang bisa dijalankan dua kali berturut-turut dan menghasilkan keadaan berbeda.

**Sesi tidak masuk lapisan mana pun di atas** (FR-AUTH-12): token akses hidup **di memori**, refresh token di cookie `HttpOnly`. Tidak di `localStorage` — supaya tidak terbaca skrip pihak ketiga. `stores/session.ts` hanya memegang salinan profil ringkas untuk render, bukan kredensial.

### 7.1 Kunci localStorage

Dua kunci dipertahankan **byte-exact** dari prototipe supaya state pengguna lama ikut terbawa:

| Kunci | Bentuk | PRD |
|---|---|---|
| `novelova-reader-settings-v1` | `{ fontSize, darkTheme, autoUnlock }` | FR-READ-03/04/09 |
| `home_section_visibility_v1` | `{ "sec-banner": true, … }` — sembilan blok. Ditulis tangan, **bukan** lewat `zustand/persist`: persist membungkus nilai dalam `{ state, version }`, dan bentuk itu tidak terbaca oleh peta datar yang sudah ada di perangkat pengguna lama | FR-HOME-06 |

Ditambahkan oleh revisi:

| Kunci | Bentuk | PRD |
|---|---|---|
| `novelova:search-history-v1` | `string[]`, maks 10, terbaru di depan, tanpa duplikat | FR-SRCH-03 |
| `novelova:chapter-draft-<chapterId>` | Isi editor bab dua bahasa + catatan penulis — **per bab**, agar draf tidak saling menimpa | FR-STUDIO-34 |
| `novelova:create-story-draft` · `novelova:edit-story-draft` | Isi formulir, **bukan** penanda `'1'` | FR-STUDIO-34, menutup PRD 07 §7 #3 |
| `novelova:review-draft-<storyId>` | Draf ulasan belum terkirim | FR-SOCIAL-02 |
| `novelova:visibility-v1` | `{ baca, rak, ulasan, dompet }` — sakelar visibilitas profil publik, **cermin lokal** dari nilai server | FR-PROF-10 |
| `novelova:profile-v1` | `{ profile, lastIdentity }` — **profil ringkas dan identitas terakhir yang diketik**, bukan kredensial, supaya nama dan avatar tidak berkedip kosong selama sesi dihidrasi. Bukan bukti sesi: status baru `authenticated` setelah `refresh()` berhasil, dan salinan basi dibuang saat hidrasi gagal | FR-AUTH-12 |

**Perilaku yang wajib dipertahankan pada semua kunci** (FR-CORE-01 menaikkan ini dari kebiasaan menjadi aturan): hasil parse **digabung di atas default** (`{ ...defaults, ...parsed }`) sehingga kunci baru otomatis aktif; JSON rusak → kembali ke default **tanpa error yang terlihat**; kegagalan tulis (mode privat / kuota penuh) ditelan diam-diam. Pola ini sudah benar di `home_tabs` dan reader; sekarang berlaku di mana pun.

Draf adalah **cadangan, bukan sumber kebenaran.** Naskah tetap dikirim ke server tiap 30 detik; draf lokal ada untuk kasus jaringan mati dan dihapus begitu versi server tersimpan (FR-STUDIO-34).

**Halaman lihat-semua adalah contoh terlengkapnya** (FR-HOME-14): urutan, chip periode, genre, dan penyaring kedua semuanya hidup di `?sort=&chip=&genre=&status=`. Komponen kontrolnya tidak menyimpan apa pun — itulah yang membuat tombol kembali peramban memulihkan saringan sebelumnya dan tautan hasil saringan bisa dikirim ke orang lain.

### 7.2 Kenapa filter/urut/cari pindah ke URL

Prototipe menyimpannya di memori DOM, jadi hilang saat kembali dari halaman detail (PRD 06 §5, PRD 07 §5). Di URL: tombol back mengembalikan hasil saring, dan tautan bisa dibagikan. Gratis — tinggal `useSearchParams`.

---

## 8. Routing

URL berbahasa Indonesia, konsisten dengan keputusan bahasa UI.

| Path | Layar | Modul | Layout | Guard |
|---|---|---|---|---|
| `/masuk` | Masuk | prd_02 | Auth | tamu |
| `/daftar` | Daftar | prd_02 | Auth | tamu |
| `/lupa-sandi` | Lupa kata sandi | prd_02 | Auth | — |
| `/mulai` | Onboarding 3 langkah (genre · bahasa · cerita pertama) | prd_02 | Auth | auth, sekali |
| `/` | Beranda | prd_03 | AppShell | auth |
| `/cari` | Pencarian katalog | prd_11 | AppShell | auth |
| `/notifikasi` | Pusat notifikasi | prd_11 | TopBar | auth |
| `/notifikasi/pengaturan` | Preferensi notifikasi per jenis — **rute modal** di atas `/notifikasi` | prd_11 | (sheet) | auth |
| `/jelajah/:kategori` | Lihat semua (`populer`\|`terbaru`\|`pilihan`\|`romance`) | prd_03 | TopBar | auth |
| `/cerita/:storyId` | Detail cerita | prd_04 | AppShell | auth |
| `/cerita/:storyId/ulasan` | Ulasan cerita | prd_12 | TopBar | auth |
| `/cerita/:storyId/bab/:chapterId` | Ruang baca | prd_05 | **Reader** | auth |
| `/cerita/:storyId/bab/:chapterId/komentar` | Komentar bab | prd_12 | TopBar | auth |
| `/pustaka` | Perpustakaan | prd_06 | AppShell | auth |
| `/koin` | Isi koin (`?return=&chapter_id=&need=`) | prd_09 | AppShell | auth |
| `/koin/transaksi` | Riwayat transaksi | prd_09 | TopBar | auth |
| `/koin/transaksi/:txId` | Detail transaksi | prd_09 | TopBar | auth |
| `/hadiah` | Pusat hadiah & voucher | prd_09 | TopBar | auth |
| `/karya` | Karya saya | prd_07 | AppShell | auth |
| `/karya/baru` | Buat cerita | prd_07 | TopBar | auth |
| `/karya/:storyId/ubah` | Ubah cerita | prd_07 | TopBar | auth |
| `/karya/:storyId/bab` | Kelola bab | prd_07 | AppShell | auth |
| `/karya/:storyId/bab/baru` | Tulis bab | prd_07 | TopBar | auth |
| `/karya/:storyId/bab/:chapterId/ubah` | Ubah bab | prd_07 | TopBar | auth |
| `/karya/:storyId/bab/:chapterId/akses` | Akses bab | prd_07 | TopBar | auth |
| `/karya/:storyId/analitik` | Analitik cerita | prd_07 | TopBar | auth |
| `/karya/jadwal` | Jadwal terbit terpadu | prd_07 | TopBar | penulis |
| `/karya/cetak` | Riwayat cetak | prd_07 | TopBar | auth |
| `/karya/daftar-penulis` | Onboarding & verifikasi penulis | prd_07 | TopBar | auth |
| `/penulis/analitik` | Analitik penulis | prd_08 | TopBar | penulis |
| `/penulis/penarikan` | Tarik penghasilan | prd_08 | TopBar | penulis |
| `/penulis/penarikan/riwayat` | Riwayat pencairan | prd_08 | TopBar | penulis |
| `/profil` | Profil | prd_10 | AppShell | auth |
| `/profil/ubah` | Ubah profil | prd_10 | TopBar | auth |
| `/profil/koneksi` | Pengikut & mengikuti (2 tab) | prd_10 | TopBar | auth |
| `/pengguna/:userId` | Profil pengguna lain | prd_10 | TopBar | auth |
| `/pengaturan/bahasa` | Bahasa & wilayah | prd_10 | TopBar | auth |
| `/pengaturan/keamanan` | Keamanan — termasuk blok **Data & akun**: ekspor data, hapus riwayat baca, keluar dari semua perangkat, hapus akun | prd_10 | TopBar | auth |
| `/bantuan` | Pusat bantuan | prd_10 | TopBar | auth |
| `/legal/ketentuan` · `/legal/privasi` | Legal | prd_10 | TopBar | — |

**Aturan:**

- Setiap modul di-`lazy()` per route → bundel awal hanya berisi shell + beranda.
- Tombol kembali memakai pola PRD: `history.length > 1 ? navigate(-1) : navigate(fallback)`. Menutup PRD 02 §7 #5, PRD 10 §7 #5/#6, dan FR-CORE-05.
- Tab nav bawah aktif ditentukan dari prefix path, bukan hardcode. Menutup PRD 04 §7 #7 dan FR-CORE-05.
- **Guard `auth`** (FR-AUTH-12): semua rute kecuali `/masuk`, `/daftar`, `/lupa-sandi`, dan `/legal/*`. Masuk tanpa sesi → `/masuk?next=<tujuan asal>`, sehingga setelah masuk pengguna mendarat di halaman yang tadi dituju — bukan di beranda.
- **Guard `penulis`** (FR-STUDIO-33): tiga tingkat, bukan satu sakelar. `none` → diarahkan ke `/karya/daftar-penulis` dengan ajakan; `registered` → boleh menulis dan menerbitkan gratis; `verified` → boleh menetapkan bab berbayar dan mencairkan. Guard **tidak memblokir menulis** — verifikasi baru diminta saat menyentuh uang.
- **Sesi kedaluwarsa di tengah pemakaian** menampilkan lembar masuk ulang di atas halaman, bukan redirect. Penulis yang sedang mengetik tidak boleh kehilangan naskahnya (FR-AUTH-12 × FR-STUDIO-34).
- **Setiap notifikasi punya rute tujuan yang spesifik** (FR-NOTIF-02) — tidak ada notifikasi yang hanya bisa dibaca. Push memakai rute yang sama sebagai *deep link* (FR-NOTIF-05).
- **Guard adalah komponen, bukan `loader`.** `createMemoryRouter` membuat `Request` pada tiap navigasi dan `AbortSignal` jsdom ditolak `Request` bawaan Node — dengan loader, alur "rute terlindungi → `/masuk?next=…` → kembali ke tujuan" tidak bisa diuji sama sekali. Guard sebagai komponen berjalan di `MemoryRouter` biasa. Berkasnya karena itu `routes/guards.tsx`.
- **Tabel di atas hidup sebagai data**, bukan JSX bersarang: `ROUTES` di `routes/index.tsx` memuat path, judul, layout, dan guard tiap rute; router dan pemeriksaan tautan membaca tabel yang sama. Judul halaman ikut lewat `handle`, jadi nama halaman hanya ditulis sekali.
- **`next` hanya menerima path internal.** `next=https://…` dan `next=//…` dibuang ke `/`. Tujuan setelah masuk adalah tempat yang bagus untuk open redirect kalau dibiarkan.
- **Pemeriksaan tautan otomatis di CI** (FR-CORE-05): setiap `to=` / `href` internal harus cocok dengan satu entri tabel ini. Prototipe punya 9 rujukan ke halaman yang tidak pernah ada; regresi yang sama tidak boleh lolos dua kali.
- **Ekspor data dan penghapusan akun tidak punya rute sendiri.** FR-SET-05 menempatkannya di `settings_security`, dan kanvas (layar 29) menggambarnya sebagai blok “Data & akun” di halaman yang sama. Rute `/pengaturan/data` yang sempat direncanakan dihapus — satu halaman keamanan, bukan dua.
- **Rute modal** dirender sebagai `Sheet` di atas rute induknya, tetapi tetap punya URL sendiri sehingga dapat ditautkan langsung. Dipakai oleh `/notifikasi/pengaturan` — FR-NOTIF-04 menempatkannya *di* halaman notifikasi sekaligus dapat dijangkau dari menu profil, dan kanvas (layar 16) memang menggambarnya sebagai lembar, bukan halaman terpisah.

---

## 9. Design System

### 9.1 Token

`src/styles/tokens.css` — satu-satunya tempat warna hidup. Diambil dari `prd_01_design_system.md` §3.1 dan §5.

```css
:root {
  /* permukaan */
  --nv-bg:          #f4efea;
  --nv-card:        #fffdfc;
  --nv-paper:       #fffdfa;
  --nv-paper-2:     #fff8f4;

  /* teks */
  --nv-text:        #2e2625;
  --nv-muted:       #6f6462;   /* dinaikkan dari #928582 — lihat catatan di bawah */
  --nv-line:        rgb(46 38 37 / .08);
  --nv-line-soft:   rgb(46 43 43 / .06);

  /* aksen */
  --nv-accent:        #d09a93;
  --nv-accent-2:      #f0c9c2;
  --nv-accent-soft:   rgb(208 154 147 / .18);
  --nv-accent-strong: #b8695f;

  /* domain */
  --nv-coin:        #bf8f46;   /* dinaikkan dari #d7ad64 untuk kontras teks */
  --nv-coin-icon:   #d7ad64;   /* nilai asli PRD, khusus ikon */

  /* status */
  --nv-success: #3f8e60;  --nv-success-bg: #e8f3e9;
  --nv-danger:  #a34436;  --nv-danger-bg:  #f6d9d2;
  --nv-warning: #9b604b;  --nv-warning-bg: #f5e2d0;
  --nv-info:    #487083;

  /* aksen kategori — token turunan, PRD 01 §9.2 rec #2 */
  --nv-cat-popular:  var(--nv-accent);
  --nv-cat-trending: #55a7b1;
  --nv-cat-editors:  #9f7a54;

  /* radius */
  --nv-r-pill: 999px;  --nv-r-sm: 12px;  --nv-r-md: 14px;
  --nv-r-lg:   18px;   --nv-r-xl: 22px;  --nv-r-sheet: 28px 28px 0 0;

  /* elevasi */
  --nv-shadow-soft: 0 6px 16px rgb(30 30 30 / .06);
  --nv-shadow:      0 10px 26px rgb(30 30 30 / .08);

  /* tipografi */
  --nv-font-ui:      'Manrope Variable', system-ui, sans-serif;
  --nv-font-display: 'Cormorant Garamond', 'Iowan Old Style', Georgia, serif;
  --nv-font-read:    Georgia, 'Times New Roman', serif;   /* isi bab, FR-READ-01 */
  --nv-font-mono:    ui-monospace, Consolas, monospace;   /* nomor VA */
}

[data-theme='dark'] {
  --nv-paper: #161a20;  --nv-paper-2: #1b2028;
  --nv-text:  #efe9e6;  --nv-muted:   #b4adb0;
  --nv-line:  rgb(238 230 226 / .24);
}
```

Tailwind v4 memetakan ini lewat `@theme` di `base.css`, sehingga `bg-nv-card`, `text-nv-muted`, `rounded-nv-lg` langsung tersedia.

**Dua penyesuaian sadar dari PRD**, keduanya soal aksesibilitas dan sudah ditandai PRD sendiri:

- `--nv-muted` dari `#928582` → `#6f6462`. PRD 01 §9.2 rec #8 memang menandai rasio kontras `#928582` di atas `#f4efea` berisiko di bawah 4.5:1. Nilai baru lolos AA.
- `--nv-coin` dari `#d7ad64` → `#bf8f46` untuk alasan sama. `#d7ad64` tetap dipakai sebagai warna **ikon**, bukan teks.

Dua kelompok token ditambahkan Fase 2, keduanya karena angkanya datang dari requirement:

- **`--nv-strength-0..4`** — lima warna meter kekuatan kata sandi, persis nilai FR-AUTH-06.
- **`--nv-brand-google`, `--nv-brand-facebook`** — warna merek penyedia OAuth (FR-AUTH-04). Satu-satunya warna di `tokens.css` yang bukan milik Novelova, dan tetap di sana karena aturannya tidak mengenal pengecualian: hex hanya boleh ada di berkas itu.

### 9.2 Skala tipografi

PRD 01 §4.4 mencatat 9–11px dipakai 298×, terlalu kecil untuk HP, dan §9.2 rec #5 meminta minimum dinaikkan. Skala yang dipakai:

| Peran | Ukuran | Bobot |
|---|---|---|
| Caption / meta | 12px | 500 |
| Body kecil | 13px | 500 |
| Body | 14px | 500 |
| Judul kartu | 16px | 700 |
| Judul section | 20px | 700 (display) |
| Judul halaman | 26px | 600 (display) |
| Angka statistik | 32–40px | 600 (display) |
| Isi bab | 16–22px, default 18px | 400 (`--nv-font-read`) |

Bobot 900 dihapus sepenuhnya — PRD 01 §9.2 rec #4 mencatat bobot itu dipakai 243× sehingga hierarki jadi rata. Yang dipakai: 400 / 500 / 600 / 700.

### 9.3 Komponen

**Primitif** (`components/ui/`) — tidak tahu domain:
`Button` (primary/secondary/ghost/danger) · `IconButton` · `Chip` · `Badge` · `Switch` · `Slider` · `Card` · `Sheet` · `Modal` · `Popover` · `Toast` · `Skeleton` · `Input` · `Select` · `TextArea` · `SearchInput` · `CharCounter` · `ProgressBar` · `EmptyState` · `Confetti` · `Tabs`

**Pola** (`components/patterns/`) — tahu domain, dipakai lintas feature:
`TopBar` · `BottomNav` / `SideNav` · `StoryCard` (varian grid & list) · `ChapterRow` · `CoinChip` · `FilterableList` · `Scheduler` · `AdSlot` · `StatBar` · `StarRating` · `ReviewCard` · `CommentThread` · `NotificationRow` · `SpoilerVeil` · `ReportSheet` · `ReviewStatusBadge` · `FailureNotice` · `UserRow` · `SettingRow` · `ScoreRing` · `StageTrack` · `DangerZone`

Isi `BottomNav` ditetapkan `NovelovaNav.dc.html`: lima tab **Beranda · Isi Koin · Pustaka · Karya · Profil**, tab aktif dari prefix path. `UserRow` (avatar inisial · nama · handle · peran · aktivitas · tombol ikuti) dipakai di daftar pengikut, daftar mengikuti, dan hasil pencarian pengguna — satu baris, satu perilaku follow optimistis. `SettingRow` (judul · keterangan · kontrol di kanan) memikul hampir seluruh layar 28–29. `StageTrack` merender lini masa berurutan dengan tahap selesai, tahap kini, dan tahap yang belum dijalani — enam tahap untuk pesanan hardcopy (FR-STUDIO-32) dan dipakai ulang untuk tangga verifikasi penulis (FR-STUDIO-33). `DangerZone` mengelompokkan aksi tak-terbalikkan di dasar formulir dengan satu pola konfirmasi ketik-ulang judul (§1.5, layar 38).

`FilterableList` menutup PRD 07 §7 #14 — prototipe punya **tiga cara berbeda** menyembunyikan baris (`style.display`, kelas `hidden`, kelas `removed`) di tiga halaman berpola sama. Satu komponen, satu perilaku, dipakai di see-all, pencarian, perpustakaan, karya saya, kelola bab, ulasan, dan notifikasi.

**Revisi PRD mengubah cara kerjanya.** `FilterableList` tidak lagi menyembunyikan baris di DOM: ia membaca saringan dari URL, memanggil kueri berpaginasi, dan merender hasilnya (§5 aturan 6). Penyaringan klien hanya untuk daftar yang pasti kecil — misalnya 9 sakelar section beranda. Katalog, perpustakaan, dan hasil pencarian selalu lewat server.

**Tiga primitif yang naik pangkat karena FR-CORE-02 dan FR-CORE-03:**

- **`AsyncState`** membungkus empat keadaan yang wajib dibedakan: memuat (skeleton) · berhasil · kosong · gagal. Kosong dan gagal **tidak boleh memakai tampilan yang sama** — "tidak ada hasil" saat sebenarnya jaringan putus adalah kebohongan yang membuat pengguna berhenti mencoba.
- **`EmptyState`** selalu memuat tiga hal: penjelasan singkat fungsi halaman · satu aksi utama yang mengisinya · tautan alternatif. Ia punya **dua varian**: *belum ada isinya* (ajakan) dan *tidak ada hasil saringan* (tawarkan hapus saringan). Prototipe hanya punya varian kedua di tiga halaman, sehingga pengguna hari pertama disambut pesan kegagalan pencarian.
- **`FailureNotice`** merender satu kegagalan pada salah satu dari empat tingkat §1.4 (`inline` · `toast` · `inset` · `fullscreen`) dengan tata letak copy yang sama: apa yang terjadi → apakah uang/tulisan aman → satu aksi → kode teknis kecil di bawah. `AsyncState` memakainya untuk varian gagalnya; **tingkatnya dipilih pemanggil**, karena hanya pemanggil yang tahu seberapa banyak halaman yang ikut mati.
- **`SpoilerVeil`** memakai ulang gaya `.lock-preview` dari gerbang bab terkunci (prd_12 §7 #6) — buram + label "Spoiler — ketuk untuk melihat" + `aria-hidden` selama tertutup. Tidak ada komponen baru untuk ini.

`CommentThread` punya satu keadaan tambahan yang tidak disebut PRD tetapi digambar kanvas (layar 18) dan konsisten dengan FR-SOCIAL-07: komentar yang **sedang ditinjau** tetap menempati barisnya, dengan isinya diganti keterangan singkat alasannya. Konten dilaporkan tidak hilang diam-diam — pembaca lain melihat bahwa ada sesuatu di sana dan sedang diproses.

Saat daftar benar-benar kosong, kontrol pencarian dan saringan **disembunyikan** — tidak ada gunanya menyaring nol baris (FR-CORE-02, FR-LIB-12).

### 9.4 Responsif

Frame ponsel dibuang. Aplikasi mengisi viewport dan berubah bentuk:

| Lebar | Navigasi | Konten | Sheet & modal |
|---|---|---|---|
| `<640` HP | Bottom nav 5 tab, fixed | 1 kolom, padding 16, `padding-bottom: 96px` | Bottom sheet naik dari bawah |
| `640–1023` tablet | Bottom nav | Grid 2–3 kolom, max-width 720 | Bottom sheet |
| `≥1024` desktop | **Sidebar kiri 240px**, persisten | Max-width 1200, grid 3–4 kolom | **Dialog terpusat** |

**Ruang baca** diperlakukan khusus di semua ukuran: tanpa navigasi (FR-READ-14), lebar teks dibatasi `max-width: 68ch` dan terpusat. Di `≥1024` panel pengaturan pembaca menjadi sidebar kanan yang menempel, bukan popover.

**Overlay pembayaran** yang di prototipe menutupi seluruh frame menjadi kartu terpusat di `≥640` — layar penuh di desktop terasa salah.

Grid see-all: 2 kolom `<640`, 3 kolom `<1024`, 4 kolom di atasnya.

---

## 10. PWA

### 10.1 Manifest

```
name         Novelova
short_name   Novelova
display      standalone
orientation  any            ← bukan portrait; desktop harus nyaman
theme_color  #d09a93
background   #f4efea
start_url    /
scope        /
icons        192 · 512 · 512-maskable · apple-touch-180
shortcuts    Perpustakaan · Isi koin
```

### 10.2 Strategi service worker

`vite-plugin-pwa` mode `injectManifest`, supaya bagian yang perlu bisa ditulis sendiri:

| Aset | Strategi | Alasan |
|---|---|---|
| App shell (JS, CSS, HTML) | Precache + `CacheFirst` | Buka instan, bahkan offline |
| Font (self-host) | `CacheFirst`, 1 tahun | Tidak pernah berubah |
| Cover & gambar | `StaleWhileRevalidate`, maks 200 entri | Cepat, boleh sedikit basi |
| `GET` API discovery | `NetworkFirst`, timeout 3 dtk, fallback cache | Feed boleh basi saat sinyal buruk |
| `GET` isi bab | `CacheFirst` + entri eksplisit "simpan offline" | Baca offline adalah nilai utama PWA untuk aplikasi novel |
| Mutasi (`POST`/`PATCH`) | **Tidak pernah dicache**; antre lewat Background Sync | Uang tidak boleh disajikan dari cache |
| Navigasi gagal | `offline.html` | Bukan layar error browser |

**Update:** SW baru tidak `skipWaiting` diam-diam. Muncul toast "Versi baru tersedia — Muat ulang". Menghindari layar berubah di tengah bab.

**Install prompt:** `beforeinstallprompt` ditahan; tombol "Pasang aplikasi" muncul di Profil setelah pengguna membuka ≥3 sesi. Tidak menyembur di kunjungan pertama.

### 10.3 Baca offline

Setiap bab yang sudah dimiliki (`Ownership`) bisa ditandai "simpan offline". Isinya masuk ke Cache Storage, metadata ke Dexie. Perpustakaan menandai cerita yang punya bab tersimpan. Batas: 50 bab, LRU.

FR-CORE-03 menaikkan sebagian ini dari fitur menjadi kewajiban: **bab yang sudah pernah dibuka tetap dapat dibaca saat offline**, dan aksi yang butuh jaringan ditahan disertai penjelasan — bukan gagal diam-diam. Mutasi yang gagal karena offline masuk antrean Background Sync (§10.2).

### 10.4 Push notification · FR-NOTIF-05 · P2

Service worker yang sudah ada menangani `push` dan `notificationclick`. Tidak perlu library.

- **Izin tidak diminta saat pertama membuka aplikasi.** Permintaan muncul pada momen yang relevan: saat pengguna menyalakan sakelar notifikasi cerita pertama kali, atau menjadwalkan bab pertama. Prompt di kunjungan pertama adalah cara tercepat mendapat penolakan permanen.
- **Izin ditolak → tidak pernah diminta ulang.** Halaman notifikasi menampilkan petunjuk mengaktifkannya lewat pengaturan sistem.
- **`notificationclick` membuka rute tujuan notifikasi**, bukan beranda (§8) — memakai `deepLink` dari entitas `Notification`.
- **Jam tenang 22.00–07.00 waktu lokal pengguna** (`LocaleSettings.timezone`). Push ditunda; notifikasi dalam aplikasi tetap tercatat saat itu juga.
- v1 memakai `AdProvider`-style stub: langganan disimpan, pengiriman disimulasikan dari server-mock. Web Push nyata (VAPID) menunggu backend.

---

## 11. Provider yang Dapat Ditukar

### 11.1 Pembayaran

```ts
export interface PaymentProvider {
  createCharge(o: TopupOrder): Promise<Charge>          // { id, type, payload, expiresAt }
  getStatus(chargeId: string): Promise<ChargeStatus>    // pending | paid | expired | failed
  cancel(chargeId: string): Promise<void>
}
```

`payload` berbeda per tipe: `ewallet` → deeplink · `qris` → string QR · `va` → nomor VA + bank.

**Nyata di v1:** tiga langkah pemilihan, aturan promo, timer kedaluwarsa per metode (15/30/1440 menit), format `HH:MM:SS` vs `MM:SS`, layar gagal dengan alasan spesifik, "coba lagi" yang mempertahankan pilihan, penulisan ledger, kunci idempotency.

**Palsu di v1:** `MockProvider.getStatus()` mengembalikan `paid` setelah tombol "Cek status" / "Saya sudah transfer" ditekan.

Dua cacat prototipe ditutup di sini: layar VA **memulai hitung mundur** (PRD 09 §7 #3), dan pemisah ribuan seragam `toLocaleString('id-ID')` di seluruh modul (§7 #6).

### 11.2 Iklan

```ts
export interface AdProvider {
  loadRewarded(): Promise<AdHandle>
  show(h: AdHandle): Promise<{ completed: boolean }>
}
```

Bab hanya terbuka bila `completed === true` — menutup PRD 05 §7 #3, di mana menekan tombol langsung membuka bab tanpa iklan diputar. `MockProvider` menampilkan overlay hitung mundur 5 detik yang tidak bisa dilewati.

Kuota disimpan di server-mock per `(userId, tanggal)`, bukan di memori.

---

## 12. i18n

Tanpa library. Satu file, satu fungsi:

```ts
// src/i18n/id.ts
export const id = {
  'home.greeting':      'Hai, {name}',
  'reader.insufficient':'Saldo tidak cukup untuk opsi ini',
  'wallet.coin':        '{n} koin',
  // ...
} as const

// src/i18n/t.ts
export type Key = keyof typeof id
export const t = (k: Key, vars?: Record<string, string | number>) => /* interpolasi {var} */
```

`Key` bertipe literal → salah ketik kunci gagal saat kompilasi. Menambah English nanti = tambah `en.ts` dengan tipe sama + satu provider; komponen tidak disentuh.

**FR-CORE-04 memperluas cakupannya.** Yang harus masuk `id.ts` bukan hanya teks yang jelas-jelas kalimat, tapi juga label yang di prototipe kebetulan berbahasa Inggris di tengah aplikasi berbahasa Indonesia:

- **Tiga halaman utuh:** `edit_profile`, `other_user_profile`, `help_center`.
- **Label campur di halaman berbahasa Indonesia:** judul section beranda (*Popular*, *New & Trending*, *Editor's Picks*, *Continue Reading*), sapaan *"Hi, Anna"*, judul *"My Library"* dan *"My Stories"*, dan tab status karya (*Published*, *Draft*, *Scheduled*, *Completed*, *Archived*).
- **Tidak ada teks tertanam di markup.** Kalau sebuah string terlihat pengguna, ia berasal dari `id.ts` — ini yang membuat `en.ts` nanti benar-benar cukup satu file.

**Yang tidak diterjemahkan:** nama merek, judul cerita, nama penulis, dan isi bab.

Bahasa aktif berasal dari `LocaleSettings.uiLang` **di server** (FR-SET-04), dengan bawaan mengikuti bahasa perangkat. Perubahan berlaku seketika tanpa muat ulang. Di v1 hanya `id` yang aktif — tapi seluruh jalurnya sudah terpasang, sehingga menambahkan English adalah pekerjaan menerjemahkan, bukan pekerjaan arsitektur.

**Terpisah dari ini:** konten bab dwibahasa (FR-STUDIO-19) adalah model data — `ChapterContent` berkunci `(chapterId, lang)`. Aturan "lengkap atau tidak ada sama sekali" ditegakkan di skema Zod, bukan di UI. `LocaleSettings.translationPriority` menentukan versi bahasa mana yang ditampilkan lebih dulu pada bab dwibahasa.

---

## 13. Aksesibilitas

Prototipe sudah memuat pola bagus yang **wajib dipertahankan** (PRD 01 §9.1 aturan 5):

- Setiap elemen interaktif non-`<button>` mendapat `role`, `tabindex="0"`, handler Enter/Space dengan `preventDefault()`. Lebih baik lagi: pakai `<button>`/`<a>` asli sehingga tidak perlu menirunya.
- Toast: `role="status"` + `aria-live="polite"`.
- Pesan kesalahan voucher: `role="alert"`.
- Pratinjau bab terkunci diberi `aria-hidden="true"` — pembaca layar tidak membacakan konten berbayar (FR-READ-06).
- `aria-expanded` selalu sinkron dengan keadaan panel, termasuk saat inisialisasi (FR-DETAIL-05).
- Slot iklan: `role="complementary"` + label "Bersponsor".
- `@media (prefers-reduced-motion: reduce)` mematikan confetti dan getar, tanpa menghilangkan pesan (FR-DETAIL-12).

Yang **ditambahkan**:

- Focus trap di semua modal & sheet; fokus dikembalikan ke pemicu saat ditutup.
- `aria-label` sakelar notifikasi diperbarui saat keadaan berubah — menutup PRD 06 §7 #3.
- Target sentuh minimum 44×44 px.
- **Konten spoiler yang belum dibuka diberi `aria-hidden`** (FR-SOCIAL-06) — pembaca layar tidak boleh membacakan apa yang sengaja disembunyikan, persis seperti pratinjau bab terkunci.
- **Lencana belum dibaca disembunyikan saat nol**, bukan menampilkan `0` (FR-NOTIF-03) — dan jumlahnya diumumkan lewat `aria-label` pada ikon lonceng, bukan hanya sebagai titik warna.
- **Keadaan gagal punya `role="alert"` dan tombol coba lagi yang bisa difokus** (FR-CORE-03). Keadaan kosong tidak — ia bukan kejutan.
- **Tingkat kegagalan menentukan cara mengumumkannya** (§1.4): `toast` dan `inset` memakai `aria-live="polite"`; `fullscreen` memindahkan fokus ke judulnya. Pesan gagal yang tidak terdengar pembaca layar sama saja dengan tidak ada — dan di layar bayar, itu berarti pengguna bisa membayar dua kali.
- **Kolom pencarian terfokus otomatis saat halaman pencarian dibuka** (FR-SRCH-01), tetapi fokus tidak dicuri kembali saat hasil dimuat.
- Kontras minimum AA untuk seluruh teks (§9.1).
- Skip-link ke konten utama.

---

## 14. Testing

Lapis tipis, ditaruh di tempat yang benar-benar berbahaya:

| Lapis | Alat | Cakupan |
|---|---|---|
| Unit | Vitest | `lib/coin.ts` (format ringkas, pembulatan harga), `lib/date.ts` (koreksi timezone), `lib/similar.ts` (saran ejaan), reducer store |
| Handler mock | Vitest + `fake-indexeddb` | Aturan bisnis: unlock idempoten, saldo kurang, kuota iklan per tanggal, cakupan bundle, cakupan voucher, klaim check-in per tanggal, tangga validasi penarikan |
| Komponen | Testing Library | `FilterableList`, `AsyncState` (kosong ≠ gagal), `Scheduler`, gerbang unlock, form dengan validasi berurutan, pembaruan optimistis yang dikembalikan |
| E2E | Playwright | **Lima alur saja:** (1) masuk → onboarding → beranda → detail → baca bab gratis; (2) bab terkunci → saldo kurang → topup dengan konteks → bayar → **kembali ke bab yang sama**; (3) tulis bab dwibahasa → atur akses → kirim terbit → tinjau → tayang; (4) instal PWA → putus jaringan → baca bab tersimpan; (5) baca bab → beri rating → tulis ulasan → misi hadiah selesai |

Aturan: setiap logika non-trivial (percabangan, loop, jalur uang) meninggalkan **satu** cek yang bisa dijalankan. Bukan suite per fungsi.

**Cek tambahan yang diminta revisi PRD** — kecil, tapi masing-masing menjaga satu cacat prototipe agar tidak kembali:

| Cek | Menjaga |
|---|---|
| Pemeriksa tautan internal di CI | FR-CORE-05 — 9 rujukan ke halaman yang tidak ada |
| Muat ulang setelah membeli bab → bab tetap terbuka, saldo tetap berkurang | FR-CORE-01 |
| Kegagalan jaringan pada daftar → keadaan **gagal**, bukan keadaan kosong | FR-CORE-03 |
| Klaim check-in dua kali pada tanggal yang sama → ditolak **server**, bukan hanya tombol nonaktif | FR-RWD-07 |
| Batal di tengah tayangan iklan → bab tidak terbuka **dan** kuota tidak berkurang | FR-READ-18 |
| Ketik cepat 5 karakter → tepat satu permintaan pencarian terkirim | FR-SRCH-02 |
| Satu ulasan per pasangan (pengguna, cerita); menghapus ulasan tidak menghapus rating | FR-SOCIAL-02 |
| Tidak ada `import` dari `dexie` di luar `src/api/mock/` — aturan lint | §5, janji "ganti satu folder" |

**Cek yang diminta pembaruan desain** (§1.4) — empat jalur di mana kegagalan bisa merugikan pengguna secara nyata:

| Cek | Menjaga |
|---|---|
| Pesanan berstatus `pending_reconciliation` menolak percobaan bayar ulang; setelah rekonsiliasi, koin masuk **satu kali** | Bayar ganda — kerugiannya lebih besar daripada menunggu 10 menit |
| Simpan server gagal 4× → sisipan muncul, editor **tetap menerima ketikan**, draf lokal utuh | Naskah penulis (layar 35) |
| Menarik bab yang sudah dibeli → saldo kembali persis sebesar harga belinya, satu baris ledger | Refund otomatis `CONTENT-410` |
| Percobaan masuk gagal ke-6 dalam 15 menit ditolak sebelum menyentuh kredensial | Rate limit `AUTH-429` |

**Cek yang diminta seksi `8a`** (§1.5) — tiga di antaranya menjaga putusan PRD-di-atas-kanvas agar tidak tergerus saat orang membandingkan layar dengan mockup:

| Cek | Menjaga |
|---|---|
| Cover 600×600 diterima disertai saran rasio; cover 8 MB ditolak | FR-STUDIO-13 — kanvas menolak rasio meleset, PRD tidak (§1.5) |
| Judul 100 karakter tersimpan utuh; penghitung berbunyi `100/100` | FR-STUDIO-12 — batas kanvas 80 tidak boleh bocor ke kode |
| Membatalkan pesanan hardcopy pada tahap Dicetak ditolak **beserta alasannya** | §1.5 — penolakan yang menjelaskan, bukan tombol mati |
| Biaya cetak berubah → pesanan berhenti sebelum produksi sampai penulis menyetujui | `PRINT-402` — tidak ada penagihan tanpa persetujuan |
| Dua bab cerita yang sama berjarak 30 menit → bentrok; zona waktu diubah → momen terbit tidak bergeser | FR-STUDIO-37, `SCHED-409`/`SCHED-200` |

---

## 15. Cacat PRD yang Diperbaiki

PRD mendokumentasikan cacat prototipenya sendiri di §7 tiap dokumen. Yang berikut diperbaiki sebagai perilaku default — bukan tugas terpisah:

| PRD | Cacat | Perbaikan |
|---|---|---|
| 00 §8.1 | 9 rujukan ke `chapter_read_unlocked.html` yang tidak ada | Semua tautan baca ke `/cerita/:id/bab/:id` |
| 02 §7 #1 | Kata sandi min 6 di masuk, 8 di daftar | Satu kebijakan: **8 karakter** di keduanya |
| 02 §7 #5 | Tombol kembali `forgot_password` ke halaman salah | `history.back()` + fallback |
| 03 §7 #1 | Ikon Cari & Notifikasi tanpa handler | Layar `/cari` dibangun; lonceng → pusat notifikasi (P2) |
| 03 §7 #2 | Tab genre tidak menyaring apa pun | Genre jadi parameter kueri feed |
| 04 §7 #1 | Hasil voucher hilang saat muat ulang | `Ownership` persisten |
| 04 §7 #3 | Voucher membuka **seluruh** bab tanpa memandang cakupan | Server-mock mengembalikan daftar `chapterId` yang berhak |
| 04 §7 #7 | Tab "Library" ditandai aktif di halaman detail | Tab aktif dari prefix path |
| 05 §7 #2 | Kuota iklan pulih setiap muat ulang | `AdQuota` per `(user, tanggal)` |
| 05 §7 #3 | Iklan tidak diputar, bab langsung terbuka | Bab terbuka hanya setelah `completed: true` |
| 05 §7 #4 | Bundle/tamat membuka blok yang sama | Cakupan pembelian nyata di `Ownership` |
| 05 §7 #7 | Tidak ada navigasi bab berikutnya/sebelumnya | Ditambahkan di akhir bab |
| 05 §7 #8 | Posisi baca tidak disimpan | `ReadingProgress` |
| 05 §7 #12 | Harga di detail (1.5rb/1.8rb) beda dari reader (selalu 1.500) | Harga dari `Chapter.priceCoins` |
| 06 §7 #2 | Hapus tanpa konfirmasi/urungkan | Toast dengan "Urungkan" 6 detik |
| 07 §7 #1 | Tombol "Analisa" **dihapus** dari cerita terbit | Dibalik: tampil untuk terbit & tamat |
| 07 §7 #2 | Naskah bab hilang saat pindah halaman | Autosave draft ke IndexedDB tiap 3 detik |
| 07 §7 #3 | Draft hanya menyimpan penanda `'1'` | Menyimpan isi formulir |
| 07 §7 #4 | Konfirmasi "Completed" dievaluasi setelah lencana berubah | `confirm` sebelum perubahan |
| 07 §7 #12 | Tanggal terbit tanpa zona waktu meski UI menulis "WIB" | Simpan UTC + zona waktu penulis |
| 08 §7 #2/#3 | Penarikan Rp 0 diterima; tidak dibatasi saldo | Validasi min Rp 100.000 dan ≤ saldo |
| 09 §7 #3 | Layar VA tanpa hitung mundur | Hitung mundur 24 jam |
| 09 §7 #6 | Pemisah ribuan tidak konsisten (titik vs koma) | `toLocaleString('id-ID')` di semua tempat |
| 09 §7 #8 | Check-in bisa diklaim ulang setelah muat ulang | Klaim per `(user, tanggal)` |
| 09 §7 #16 | Tidak ada idempotensi — bayar ganda mungkin | `idempotencyKey` per order |
| 10 §7 #3 | `edit_profile` tanpa validasi, nama kosong diterima | Nama tampilan wajib |
| 10 §7 #4 | Keluar tanpa konfirmasi | Konfirmasi, terutama bila ada draft |
| 10 §7 #7 | Daftar isi Ketentuan menyebut 5 butir, isinya 4 | Bagian "Pengembalian dana & perselisihan" ditulis |

### 15.1 Dua puluh empat alur yang terputus

Revisi PRD memetakan seluruh alur yang tidak menutup pada prototipe (prd_00 §12) beserta requirement yang menutupnya. Tabel berikut menambahkan **di fase mana** masing-masing dikerjakan — inilah yang menghubungkan PRD dengan [`todo.md`](todo.md).

| # | Alur yang terputus | Ditutup oleh | Fase |
|---|---|---|---|
| 1 | Kehabisan koin → beli → lanjut baca | FR-READ-17 · FR-WALLET-17/18 | 5, 6 |
| 2 | Temukan cerita → simpan → perpustakaan | FR-DETAIL-13 · FR-LIB-11 | 5, 7 |
| 3 | Baca → progres tercatat → lanjut baca | FR-READ-16 · FR-LIB-11 | 5, 7 |
| 4 | Selesai bab → bab berikutnya | FR-READ-15 | 5 |
| 5 | Baca → beri nilai / ulasan / komentar | prd_12 seluruhnya | 10 |
| 6 | Cari cerita tertentu | FR-SRCH-01…05 | 4 |
| 7 | Peristiwa terjadi → pengguna diberi tahu | FR-NOTIF-01…05 | 11, 14 |
| 8 | Tonton iklan → dapat bab | FR-READ-18 | 5 |
| 9 | Dapat voucher → pakai voucher | FR-RWD-06 | 12 |
| 10 | Lihat transaksi → periksa detail | FR-WALLET-19 | 6 |
| 11 | Klaim hadiah → tercatat | FR-RWD-07 | 12 |
| 12 | Jadi penulis → terbitkan → cairkan | FR-STUDIO-33 · FR-EARN-10/11 | 8, 9 |
| 13 | Tulis naskah → tersimpan | FR-STUDIO-34 | 8 |
| 14 | Buat cerita → tulis bab pertama | FR-STUDIO-35 | 8 |
| 15 | Kirim terbit → ditinjau → tayang | FR-STUDIO-38 | 8 |
| 16 | Atur akses bab tertentu | FR-STUDIO-36 | 8 |
| 17 | Pilih genre → beranda menyesuaikan | FR-HOME-13 | 3 |
| 18 | Saring kategori → hasil menyesuaikan | FR-HOME-14 | 3 |
| 19 | Atur privasi → berlaku ke pengunjung | FR-PROF-10 | 13 |
| 20 | Atur bahasa → aplikasi berubah | FR-SET-04 · FR-CORE-04 | 13 |
| 21 | Lihat pengikut | FR-PROF-09 | 13 |
| 22 | Ekspor data / hapus akun | FR-SET-05 | 13 |
| 23 | Daftar → beranda yang relevan | FR-AUTH-11 · FR-HOME-16 | 2, 3 |
| 24 | Buka halaman → wajib masuk | FR-AUTH-12 | 2 |

**Seluruh 24 alur masuk v1.** Ini perubahan dari revisi sebelumnya dokumen ini, yang menaruh pusat notifikasi, daftar pengikut, riwayat penarikan, ekspor data, penghapusan akun, dan lihat-semua Top Romance di backlog. PRD kini menetapkan semuanya sebagai requirement P0/P1, jadi semuanya punya fase.

**Yang tetap di luar v1:** pengelolaan banyak rekening bank (PRD 08 §7 #6) · panel admin untuk antrean tinjauan — penulis melihat status tinjauannya, tetapi yang meninjau adalah proses di luar aplikasi ini · Bahasa English penuh (jalurnya siap, terjemahannya belum) · Web Push nyata dengan VAPID (menunggu backend; §10.4).

---

## 16. Konvensi Kode

- **TypeScript strict**, tanpa `any`. Tipe domain berasal dari inferensi Zod (`z.infer`), tidak ditulis dua kali.
- Nama file: komponen `PascalCase.tsx`, sisanya `camelCase.ts`.
- Prosa & string UI Bahasa Indonesia; nama variabel, fungsi, tipe, dan endpoint Bahasa Inggris — mengikuti konvensi PRD §9.4.
- Satu komponen per file. Komponen >150 baris dipecah.
- Tidak ada hex warna di luar `tokens.css`.
- Penyederhanaan yang disengaja ditandai komentar `ponytail:` yang menyebutkan batas dan jalur peningkatannya.
- Commit: Conventional Commits (`feat(reader): ...`).

---

## 17. Batasan yang Diketahui

Dinyatakan terbuka supaya tidak dianggap sudah selesai:

1. **Tidak ada autentikasi nyata.** Bentuk sesinya benar sejak awal — token akses di memori, refresh lewat cookie, penjaga rute, lembar masuk ulang (FR-AUTH-12) — tetapi yang memverifikasinya adalah server-mock. Siapa pun bisa mengedit `Ownership` di IndexedDB dan membuka semua bab. Konsekuensi langsung dari keputusan "frontend dulu"; **harus** ditutup sebelum uang nyata masuk.
2. **Tidak ada verifikasi pembayaran.** Status berubah karena pengguna menekan tombol, bukan karena webhook.
3. **Data hanya per perangkat, meski arsitekturnya sudah menganggapnya milik server.** FR-CORE-01 dipatuhi *bentuknya* — kepemilikan, saldo, progres, dan naskah semua hidup di balik seam, tidak di `stores/`. Tetapi implementasi mock menaruhnya di IndexedDB perangkat ini, jadi ganti peramban = mulai dari nol. Janji "berpindah perangkat tetap melanjutkan" baru benar-benar berlaku setelah `api/http/` ada. Ini satu-satunya batasan yang **tidak** butuh perubahan kode di sisi aplikasi untuk ditutup.
4. **Iklan berhadiah di web terbatas.** Bahkan dengan provider nyata, rewarded ads di PWA jauh lebih terbatas daripada di aplikasi native.
5. **Analitik memakai data seed statis.** Bentuk grafik nyata, angkanya belum. Sejak FR-SOCIAL-08, sentimen komentar dan jumlah rating **dihitung dari data nyata** di server-mock — tapi data nyatanya berasal dari seed.
6. **Cetak PDF & hardcopy disimulasikan seluruhnya.** Berkas PDF dibuat contoh dari klien — produksi butuh render di server. Sisi hardcopy lebih jauh lagi: konfirmasi admin, perubahan biaya (`PRINT-402`), status produksi, dan nomor resi semuanya digerakkan seed, bukan vendor cetak atau kurir. Bentuk keadaan dan aturan pembatalannya (§1.5) sudah benar; yang menggerakkannya belum ada.
7. **Antrean tinjauan tidak punya sisi admin.** FR-STUDIO-38 memberi penulis status *Dalam tinjauan* / *Ditolak* beserta alasannya, dan laporan pembaca masuk ke antrean yang sama — tetapi yang memutuskan adalah proses di luar aplikasi ini. Di v1 keputusan disimulasikan dari seed.
8. **Push notification disimulasikan.** Izin, jam tenang, deep link, dan preferensi per jenis semuanya nyata dan berjalan; pengirimannya dari server-mock, bukan Web Push berVAPID (§10.4).
9. **Rekonsiliasi pembayaran disimulasikan.** Status `pending_reconciliation` (§1.4, layar 34) berubah sendiri setelah timer 10 menit di server-mock, bukan karena webhook penyedia. Bentuk keadaan dan penguncian tombol bayar-ulang sudah benar; yang belum nyata adalah yang mengonfirmasinya.
10. **Pencarian memakai pencocokan sederhana.** Server-mock mencari substring pada judul, penulis, tag, genre, dan sinopsis dengan bobot tetap. Peringkat relevansi yang sebenarnya adalah pekerjaan backend, bukan frontend.
