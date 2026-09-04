# PRD Novelova — Modul Autentikasi

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya **sama dengan v1**; yang berubah hanya kulitnya (putaran 7).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Halaman: `login.html` · `register.html` · `forgot_password.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_settings.md`

---

## 1. Ringkasan Modul

Modul gerbang masuk aplikasi. Pengguna baru mendaftar, pengguna lama masuk, dan pengguna yang lupa kata sandi memulihkan akun. Tidak ada state persisten di modul ini — seluruh autentikasi masih disimulasikan (form valid → langsung berpindah ke beranda).

| Aspek | Nilai |
|---|---|
| **Aktor** | Pengunjung (belum terautentikasi) |
| **Halaman** | `login.html` (111 baris), `register.html` (125 baris), `forgot_password.html` (59 baris) |
| **Prasyarat** | Tidak ada — ini titik masuk aplikasi |
| **Keluaran** | Sesi terautentikasi → `home_tabs.html` |
| **Sub-sistem desain** | Klasik `fix_ui` (krem, Cormorant + Manrope, FontAwesome 6.5.1) |

---

## 2. Flow

### 2.1 Masuk

1. Pengguna membuka `login.html`.
2. Isi **Email atau nomor HP** dan **Kata sandi**.
3. Opsional: aktifkan "Ingat saya" (aktif secara default), tekan "Lihat" untuk melihat kata sandi.
4. Tekan **Masuk**.
   - Identitas kosong → error `"Masukkan email atau nomor HP."`, tetap di halaman.
   - Kata sandi < 6 karakter → error `"Kata sandi minimal 6 karakter."`, tetap di halaman.
   - Valid → pindah ke `home_tabs.html`.
5. Jalur alternatif: **Google** / **Facebook** → pesan status (prototype), tidak berpindah halaman.
6. Jalur lain: **Lupa kata sandi?** → `forgot_password.html` · **Daftar** → `register.html`.

### 2.2 Daftar

1. Pengguna membuka `register.html`.
2. Isi **Nama tampilan**, **Email**, **Nomor HP (opsional)**, **Kata sandi**.
3. Saat mengetik kata sandi, meter kekuatan diperbarui langsung.
4. Centang persetujuan **Ketentuan Layanan** + **Kebijakan Privasi**.
5. Tekan **Buat akun**.
   - Nama kosong → `"Isi nama tampilan."`
   - Format email salah → `"Format email tidak valid."`
   - Kata sandi < 8 karakter → `"Kata sandi minimal 8 karakter."`
   - Belum menyetujui ketentuan → `"Setujui ketentuan untuk melanjutkan."`
   - Valid → pindah ke `home_tabs.html`.

### 2.3 Reset Kata Sandi

1. Dari `login.html` atau `settings_security.html` → `forgot_password.html`.
2. Halaman menampilkan indikator 3 langkah: **Identifikasi → Verifikasi → Reset** (langkah 1 aktif).
3. Kolom identitas terisi awal `anna.maharani@example.com`; pengguna bisa mengubah.
4. Tekan **Kirim tautan reset** → teks status berubah menjadi konfirmasi pengiriman.
5. Catatan keamanan tetap tampil: tautan berlaku **15 menit**, OTP/tautan tidak boleh dibagikan.

---

## 3. Daftar Requirement

| ID | Nama | Halaman | Prioritas |
|---|---|---|---|
| FR-AUTH-01 | Masuk dengan identitas + kata sandi | `login` | P0 |
| FR-AUTH-02 | Tampilkan/sembunyikan kata sandi | `login`, `register` | P1 |
| FR-AUTH-03 | Opsi "Ingat saya" | `login` | P2 |
| FR-AUTH-04 | Masuk lewat penyedia pihak ketiga (OAuth) | `login` | P1 |
| FR-AUTH-05 | Daftar akun baru | `register` | P0 |
| FR-AUTH-06 | Indikator kekuatan kata sandi | `register` | P1 |
| FR-AUTH-07 | Persetujuan Ketentuan & Privasi | `register` | P0 |
| FR-AUTH-08 | Kirim tautan reset kata sandi | `forgot_password` | P0 |
| FR-AUTH-09 | Umpan balik kesalahan inline | `login`, `register` | P0 |
| FR-AUTH-10 | Navigasi antar halaman autentikasi | ketiganya | P1 |
| FR-AUTH-11 | **[BARU]** Onboarding pembaca baru | setelah `register` | P1 |
| FR-AUTH-12 | **[BARU]** Sesi, penjaga rute & keluar | lintas halaman | P0 |

---

## 4. Detail Requirement

### FR-AUTH-01 — Masuk dengan identitas + kata sandi · P0

**Deskripsi.** Pengguna terdaftar masuk memakai email **atau** nomor HP beserta kata sandi. Satu kolom identitas menerima kedua format sehingga pengguna tidak perlu memilih jenis identitas terlebih dahulu.

**User story.** Sebagai pembaca terdaftar, saya ingin masuk dengan email atau nomor HP saya agar bisa melanjutkan bacaan, dompet koin, dan dasbor penulis saya.

**Aturan bisnis.**
- Kolom identitas wajib diisi (setelah `trim()`); kosong → tolak.
- Kata sandi minimal **6 karakter**. *(Catatan: `register` mensyaratkan 8 — lihat §7.)*
- Validasi berjalan di sisi klien sebelum submit; form memakai `novalidate` sehingga validasi bawaan browser dimatikan dan pesan sepenuhnya dikendalikan aplikasi.
- Sukses → arahkan ke `home_tabs.html` (tanpa pemeriksaan kredensial pada prototype).
- `autocomplete="username"` dan `autocomplete="current-password"` harus dipertahankan agar pengelola kata sandi bekerja.

**Hook implementasi.** `login.html:97` — listener `submit` pada `#loginForm`; input `#identity`, `#password`; `login.html:fail()`; `login.html:$()` (helper `getElementById`).

**Acceptance criteria.**
- **Given** pengguna berada di `login.html` dengan kolom identitas kosong, **when** menekan "Masuk", **then** muncul pesan `"Masukkan email atau nomor HP."` di area error dan halaman tidak berpindah.
- **Given** identitas terisi dan kata sandi 5 karakter, **when** menekan "Masuk", **then** muncul `"Kata sandi minimal 6 karakter."` dan halaman tidak berpindah.
- **Given** identitas terisi dan kata sandi ≥6 karakter, **when** menekan "Masuk", **then** area error dikosongkan dan browser berpindah ke `home_tabs.html`.
- **Given** form dikirim, **when** submit terjadi, **then** halaman tidak melakukan reload default (`preventDefault` aktif).

---

### FR-AUTH-02 — Tampilkan/sembunyikan kata sandi · P1

**Deskripsi.** Tombol teks di dalam kolom kata sandi mengubah `type` input antara `password` dan `text`, sekaligus mengganti labelnya.

**User story.** Sebagai pengguna, saya ingin melihat kata sandi yang saya ketik agar tidak salah ketik saat masuk atau mendaftar.

**Aturan bisnis.**
- Label tombol: `"Lihat"` saat tersembunyi → `"Sembunyikan"` saat terlihat.
- Berlaku identik di `login.html` dan `register.html`.
- Status awal selalu tersembunyi.

**Hook implementasi.** `login.html:91` dan `register.html:87` — listener `click` pada `#toggle`, target `#password`.

**Acceptance criteria.**
- **Given** kata sandi tersembunyi, **when** menekan "Lihat", **then** karakter terlihat dan label tombol menjadi "Sembunyikan".
- **Given** kata sandi terlihat, **when** menekan "Sembunyikan", **then** karakter kembali tersamar dan label kembali "Lihat".

---

### FR-AUTH-03 — Opsi "Ingat saya" · P2

**Deskripsi.** Checkbox yang menandakan sesi harus dipertahankan setelah browser ditutup.

**User story.** Sebagai pengguna yang memakai perangkat pribadi, saya ingin tetap masuk agar tidak perlu login berulang.

**Aturan bisnis.**
- Default **tercentang** (`checked`).
- Pada prototype nilainya tidak dibaca saat submit — implementasi produksi harus memetakannya ke masa berlaku refresh token.

**Hook implementasi.** `login.html:71` — `#remember`.

**Acceptance criteria.**
- **Given** halaman `login.html` baru dimuat, **when** pengguna melihat baris opsi, **then** "Ingat saya" dalam keadaan tercentang.
- **Given** pengguna menghilangkan centang, **when** halaman dikirim, **then** nilai checkbox tersedia untuk dikirim ke backend (produksi).

---

### FR-AUTH-04 — Masuk lewat penyedia pihak ketiga (OAuth) · P1

**Deskripsi.** Dua tombol alternatif masuk: Google dan Facebook, dipisahkan dari form utama oleh pemisah "ATAU".

**User story.** Sebagai pengguna baru, saya ingin masuk memakai akun Google atau Facebook agar tidak perlu membuat kata sandi baru.

**Aturan bisnis.**
- Penyedia yang didukung: **Google** dan **Facebook** (tepat dua).
- Prototype hanya menuliskan pesan `"Masuk via <Provider> (prototipe)."` ke area error dan **tidak** berpindah halaman.
- Warna merek dipertahankan pada ikon: Google `#DB4437`, Facebook `#1877F2`.
- Produksi: alihkan ke alur OAuth penyedia, lalu kembali ke `home_tabs.html`.

**Hook implementasi.** `login.html:108:oauth(provider)`; tombol `.oauth .g` dan `.oauth .f` dengan `onclick="oauth('Google'|'Facebook')"`.

**Acceptance criteria.**
- **Given** pengguna di `login.html`, **when** menekan tombol Google, **then** area status menampilkan `"Masuk via Google (prototipe)."`.
- **Given** pengguna menekan tombol Facebook, **when** aksi dijalankan, **then** pesan menyebut penyedia "Facebook" dan halaman tetap di `login.html`.

---

### FR-AUTH-05 — Daftar akun baru · P0

**Deskripsi.** Formulir pendaftaran empat kolom (nama tampilan, email, nomor HP opsional, kata sandi) dengan validasi berurutan dan penghentian pada kesalahan pertama.

**User story.** Sebagai pengunjung, saya ingin membuat akun Novelova agar bisa menyimpan bacaan, membeli koin, dan menerbitkan cerita.

**Aturan bisnis.**

| Kolom | Wajib | Aturan |
|---|---|---|
| Nama tampilan (`#name`) | Ya | Tidak boleh kosong setelah `trim()` |
| Email (`#email`) | Ya | Harus cocok `/^[^@\s]+@[^@\s]+\.[^@\s]+$/` |
| Nomor HP (`#phone`) | Tidak | Bebas; `type="tel"` |
| Kata sandi (`#password`) | Ya | Minimal **8 karakter** |
| Persetujuan (`#agree`) | Ya | Lihat FR-AUTH-07 |

- Validasi dievaluasi berurutan; kesalahan pertama menghentikan proses.
- Sukses → arahkan ke `home_tabs.html`.
- `autocomplete="new-password"` dipertahankan agar pengelola kata sandi menawarkan kata sandi kuat.

**Hook implementasi.** `register.html:109` — listener `submit` pada `#regForm`; `register.html:122:fail()`.

**Acceptance criteria.**
- **Given** nama tampilan kosong, **when** menekan "Buat akun", **then** muncul `"Isi nama tampilan."` dan tidak berpindah halaman.
- **Given** email `anna@example` (tanpa titik domain), **when** menekan "Buat akun", **then** muncul `"Format email tidak valid."`.
- **Given** kata sandi 7 karakter, **when** menekan "Buat akun", **then** muncul `"Kata sandi minimal 8 karakter."`.
- **Given** seluruh kolom valid dan persetujuan tercentang, **when** menekan "Buat akun", **then** browser berpindah ke `home_tabs.html`.
- **Given** nomor HP dikosongkan sementara kolom lain valid, **when** menekan "Buat akun", **then** pendaftaran tetap berhasil.

---

### FR-AUTH-06 — Indikator kekuatan kata sandi · P1

**Deskripsi.** Meter batang di bawah kolom kata sandi yang menghitung skor 0–4 dari empat kriteria independen, lalu memperbarui lebar, warna, dan label secara langsung saat mengetik.

**User story.** Sebagai pengguna baru, saya ingin tahu seberapa kuat kata sandi saya agar bisa memilih yang lebih aman.

**Aturan bisnis.**

| Kriteria | Menambah skor |
|---|---|
| Panjang ≥ 8 karakter | +1 |
| Mengandung huruf besar **dan** huruf kecil | +1 |
| Mengandung angka | +1 |
| Mengandung karakter non-alfanumerik | +1 |

- Lebar batang = `skor × 25%`.
- Warna per skor: `0 → #d9b3ac` · `1 → #d9a37f` · `2 → #cbb46a` · `3 → #7fb08a` · `4 → #5a9e6e`.
- Label per skor: `0 → "Kekuatan kata sandi"` · `1 → "Lemah"` · `2 → "Cukup"` · `3 → "Bagus"` · `4 → "Kuat"`.
- Saat kolom kosong, label kembali ke `"Kekuatan kata sandi"` apa pun skornya.
- Meter bersifat **informasional**; tidak memblokir submit (yang memblokir hanya panjang minimum 8).

**Hook implementasi.** `register.html:100:strength(pw)`; listener `input` pada `#password`; elemen `#meterBar`, `#meterLabel`.

**Acceptance criteria.**
- **Given** kolom kata sandi kosong, **when** halaman dimuat, **then** label berbunyi "Kekuatan kata sandi" dan batang berlebar 0%.
- **Given** pengguna mengetik `abcdefgh`, **when** input berubah, **then** skor = 1 (panjang saja), batang 25%, label "Lemah".
- **Given** pengguna mengetik `Abcdef1!`, **when** input berubah, **then** skor = 4, batang 100%, label "Kuat", warna `#5a9e6e`.
- **Given** kata sandi berskor 4, **when** pengguna menghapus seluruh isi, **then** label kembali "Kekuatan kata sandi".

---

### FR-AUTH-07 — Persetujuan Ketentuan & Privasi · P0

**Deskripsi.** Checkbox wajib berisi tautan ke dokumen legal, yang harus dicentang sebelum akun dapat dibuat.

**User story.** Sebagai penyelenggara layanan, saya ingin pengguna menyetujui ketentuan sebelum akun dibuat agar dasar hukum penggunaan data jelas.

**Aturan bisnis.**
- Default **tidak** tercentang.
- Submit ditolak bila belum tercentang, dengan pesan `"Setujui ketentuan untuk melanjutkan."`.
- Pemeriksaan dilakukan **terakhir**, setelah seluruh validasi kolom lolos.
- Tautan: `terms.html` (Ketentuan Layanan) dan `privacy.html` (Kebijakan Privasi) — keduanya harus dapat dibuka tanpa kehilangan isi form.

**Hook implementasi.** `register.html:76` — `#agree`; pemeriksaan di `register.html:117`.

**Acceptance criteria.**
- **Given** seluruh kolom valid namun persetujuan belum dicentang, **when** menekan "Buat akun", **then** muncul `"Setujui ketentuan untuk melanjutkan."` dan akun tidak dibuat.
- **Given** pengguna menekan tautan "Ketentuan Layanan", **when** tautan dibuka, **then** `terms.html` tampil.
- **Given** persetujuan dicentang dan kolom valid, **when** menekan "Buat akun", **then** pendaftaran diteruskan.

---

### FR-AUTH-08 — Kirim tautan reset kata sandi · P0

**Deskripsi.** Halaman pemulihan akun satu langkah: pengguna memastikan identitas, menekan kirim, dan menerima konfirmasi. Indikator tiga langkah memberi konteks posisi pengguna dalam proses.

**User story.** Sebagai pengguna yang lupa kata sandi, saya ingin menerima tautan reset ke kontak akun saya agar bisa masuk kembali.

**Aturan bisnis.**
- Indikator langkah: **1 Identifikasi · 2 Verifikasi · 3 Reset**; hanya langkah 1 yang dijalankan di halaman ini.
- Kolom identitas terisi awal `anna.maharani@example.com` (data contoh prototype).
- Bila kolom dikosongkan, teks konfirmasi memakai frasa pengganti `"kontak akunmu"` — tombol tidak pernah menolak.
- Teks status awal: `"Tautan pemulihan belum dikirim."`; setelah dikirim: `"Tautan reset telah dikirim ke <identitas> dalam prototipe."`.
- **Masa berlaku tautan reset: 15 menit** (dinyatakan di catatan keamanan) — nilai ini mengikat untuk implementasi produksi.
- Catatan keamanan wajib tetap tampil: OTP dan tautan reset tidak boleh dibagikan.

**Hook implementasi.** `forgot_password.html:53` — listener `click` pada `#sendBtn`; input `#identity`; elemen `#status`.

**Acceptance criteria.**
- **Given** halaman baru dimuat, **when** pengguna melihat area status, **then** tertulis `"Tautan pemulihan belum dikirim."`.
- **Given** kolom identitas berisi `anna@example.com`, **when** menekan "Kirim tautan reset", **then** status menampilkan konfirmasi yang memuat `anna@example.com`.
- **Given** kolom identitas dikosongkan, **when** menekan "Kirim tautan reset", **then** status memuat frasa `"kontak akunmu"`.
- **Given** halaman ditampilkan, **when** pengguna membaca catatan keamanan, **then** tertera masa berlaku 15 menit.

---

### FR-AUTH-09 — Umpan balik kesalahan inline · P0

**Deskripsi.** Satu area pesan terpusat di bawah form menampilkan kesalahan validasi. Tidak ada `alert()`; area selalu menyediakan ruang sehingga tata letak tidak melompat saat pesan muncul.

**User story.** Sebagai pengguna, saya ingin tahu persis apa yang salah pada isian saya agar bisa memperbaikinya tanpa menebak.

**Aturan bisnis.**
- Satu area error per halaman (`#err`), rata tengah, `min-height:14px` agar tinggi form stabil.
- Warna teks kesalahan `#a2564f`.
- Area dikosongkan setiap kali validasi berhasil, sebelum berpindah halaman.
- Hanya **satu** pesan tampil pada satu waktu (kesalahan pertama menang).

**Hook implementasi.** `login.html:107:fail(msg)` · `register.html:122:fail(msg)` · elemen `#err` di kedua halaman.

**Acceptance criteria.**
- **Given** terjadi dua kesalahan sekaligus (nama kosong dan email salah), **when** menekan submit, **then** hanya pesan kesalahan pertama (`"Isi nama tampilan."`) yang tampil.
- **Given** pesan kesalahan sedang tampil, **when** pengguna memperbaiki isian dan submit berhasil, **then** area pesan dikosongkan sebelum perpindahan halaman.
- **Given** area pesan kosong, **when** halaman dirender, **then** tinggi form tidak berubah saat pesan muncul kemudian.

---

### FR-AUTH-10 — Navigasi antar halaman autentikasi · P1

**Deskripsi.** Tautan silang yang menghubungkan ketiga halaman autentikasi dan dokumen legal.

**User story.** Sebagai pengunjung, saya ingin berpindah antara masuk, daftar, dan pemulihan akun tanpa harus kembali ke awal.

**Aturan bisnis.**

| Dari | Tautan | Ke |
|---|---|---|
| `login` | "Lupa kata sandi?" | `forgot_password.html` |
| `login` | "Daftar" | `register.html` |
| `register` | "Masuk" | `login.html` |
| `register` | "Ketentuan Layanan" / "Kebijakan Privasi" | `terms.html` / `privacy.html` |
| `forgot_password` | tombol kembali (‹) | `settings_security.html` |

- Tombol kembali `forgot_password` mengarah ke `settings_security.html`, **bukan** `login.html` — konsekuensinya pengguna yang datang dari halaman masuk akan mendarat di halaman pengaturan keamanan. Lihat §7.

**Acceptance criteria.**
- **Given** pengguna di `login.html`, **when** menekan "Daftar", **then** `register.html` terbuka.
- **Given** pengguna di `register.html`, **when** menekan "Masuk", **then** `login.html` terbuka.
- **Given** pengguna di `forgot_password.html`, **when** menekan tombol kembali, **then** `settings_security.html` terbuka.

---

### FR-AUTH-11 — Onboarding pembaca baru · P1

**Status: BARU.** Saat ini pendaftaran berhasil langsung melompat ke `home_tabs.html`, tanpa pernah menanyakan apa pun — padahal seluruh mekanisme penemuan cerita di beranda dibangun di atas genre.

**Deskripsi.** Beberapa langkah singkat setelah pendaftaran untuk mengumpulkan preferensi awal, agar beranda pengguna baru tidak kosong makna.

**User story.** Sebagai pengguna baru, saya ingin beranda saya langsung berisi cerita yang sesuai selera, bukan daftar acak yang harus saya saring sendiri.

**Aturan bisnis.**
- **Tiga langkah, seluruhnya dapat dilewati** — tombol "Lewati" selalu tersedia dan mendaratkan pengguna di beranda dengan pilihan bawaan:
  1. **Pilih genre favorit** — minimal 1, maksimal 5, dari daftar yang sama dengan tab genre beranda: Romance · My Kisah · Fantasy · Mystery · Drama · CEO · Thriller (lihat [`prd_03_home_discovery.md`](prd_03_home_discovery.md) FR-HOME-03).
  2. **Bahasa & wilayah** — nilai awal dari perangkat, dapat diubah; disimpan ke pengaturan bahasa (lihat [`prd_10_profile_settings_help.md`](prd_10_profile_settings_help.md) FR-SET-04).
  3. **Cerita pertama** — tiga rekomendasi berdasarkan genre yang dipilih, dengan aksi simpan ke perpustakaan (lihat [`prd_04_story_detail.md`](prd_04_story_detail.md) FR-DETAIL-13).
- Genre terpilih memengaruhi urutan section beranda dan isi rekomendasi; **tidak** mengunci pengguna — seluruh katalog tetap dapat dijelajahi.
- Preferensi dapat diubah kemudian lewat tab genre beranda dan pengaturan bahasa.
- Onboarding hanya tampil **satu kali**; menyelesaikannya atau melewatinya sama-sama menandainya selesai.
- Pengguna yang masuk lewat OAuth (FR-AUTH-04) juga melewati alur ini bila akunnya baru.

**Acceptance criteria.**
- **Given** pendaftaran berhasil, **when** akun dibuat, **then** langkah pemilihan genre tampil sebelum beranda.
- **Given** pengguna memilih 3 genre, **when** melanjutkan, **then** beranda menampilkan section yang mengutamakan genre tersebut.
- **Given** pengguna menekan "Lewati" pada langkah pertama, **when** aksi dijalankan, **then** beranda terbuka dengan urutan section bawaan.
- **Given** pengguna mencoba memilih genre keenam, **when** aksi dijalankan, **then** pilihan diabaikan.
- **Given** pengguna sudah menyelesaikan onboarding, **when** masuk lagi di lain waktu, **then** onboarding tidak tampil lagi.
- **Given** pengguna menyimpan cerita pada langkah ketiga, **when** membuka perpustakaan, **then** cerita itu sudah ada di koleksinya.

---

### FR-AUTH-12 — Sesi, penjaga rute & keluar · P0

**Status: BARU.** Saat ini tidak ada token, tidak ada sesi, dan setiap halaman dapat dibuka langsung tanpa masuk.

**Deskripsi.** Sesi terautentikasi yang menentukan halaman mana yang boleh dibuka, beserta perilaku saat sesi berakhir.

**User story.** Sebagai pengguna, saya ingin data pribadi saya hanya terbuka setelah saya masuk, dan tidak perlu masuk berulang selama sesi saya masih berlaku.

**Aturan bisnis.**
- **Token akses disimpan di memori**, refresh token pada cookie `HttpOnly` — bukan di `localStorage`, agar tidak terbaca skrip pihak ketiga.
- **Masa berlaku sesi mengikuti opsi "Ingat saya"** (FR-AUTH-03): dicentang → sesi panjang dengan pembaruan otomatis; tidak dicentang → sesi berakhir saat peramban ditutup.
- **Halaman yang wajib terautentikasi:** seluruh halaman kecuali `login`, `register`, `forgot_password`, `terms`, dan `privacy`. Membukanya tanpa sesi mengalihkan ke `login.html` beserta tujuan asal, sehingga setelah masuk pengguna mendarat di halaman yang tadi dituju.
- **Sesi kedaluwarsa di tengah pemakaian** menampilkan lembar masuk ulang, bukan melempar ke halaman login dan menghilangkan pekerjaan — penting bagi penulis yang sedang mengetik (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-34).
- **Keluar** meminta konfirmasi, terlebih bila ada draf belum tersimpan, lalu membatalkan sesi di server dan membersihkan state lokal.
- Sesi yang aktif muncul di daftar sesi `settings_security` (lihat [`prd_10_profile_settings_help.md`](prd_10_profile_settings_help.md) FR-SET-03); mencabut sesi di sana benar-benar mengakhirinya.

**Acceptance criteria.**
- **Given** pengguna belum masuk, **when** membuka `my_library.html` langsung, **then** dialihkan ke `login.html`.
- **Given** pengguna dialihkan dari `my_library`, **when** berhasil masuk, **then** mendarat di `my_library.html`, bukan beranda.
- **Given** pengguna membuka `terms.html` tanpa masuk, **when** halaman dimuat, **then** halaman tampil normal.
- **Given** sesi kedaluwarsa saat penulis mengetik bab, **when** kedaluwarsa terdeteksi, **then** lembar masuk ulang tampil dan naskah tetap ada.
- **Given** pengguna menekan Keluar dengan draf belum tersimpan, **when** aksi dijalankan, **then** konfirmasi tampil sebelum sesi diakhiri.
- **Given** pengguna mencabut sebuah sesi di halaman keamanan, **when** perangkat itu memuat halaman berikutnya, **then** perangkat itu diminta masuk kembali.

---

## 5. State & Persistensi

**Tidak ada** `localStorage`, `sessionStorage`, cookie, atau token pada modul ini.

| State | Lingkup | Hilang saat |
|---|---|---|
| Isi form | Memori DOM | Halaman dimuat ulang / berpindah |
| Visibilitas kata sandi | Memori DOM | Halaman dimuat ulang |
| Skor kekuatan kata sandi | Dihitung ulang tiap `input` | — |
| Pesan kesalahan | Memori DOM | Submit berikutnya |

**Kebutuhan produksi:** penyimpanan token akses (memori) + refresh token (cookie `HttpOnly`), masa berlaku sesi mengikuti FR-AUTH-03, dan penjaga rute untuk seluruh halaman `/me/*`.

---

## 6. Navigasi

**Masuk ke modul:** titik awal aplikasi · `profile.html` → "Keluar" → `login.html` · `settings_security.html` → `forgot_password.html`.

**Keluar dari modul:** `home_tabs.html` (setelah masuk/daftar berhasil) · `terms.html` · `privacy.html` · `settings_security.html`.

---

## 7. Catatan Prototype vs Produksi

| # | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | **Panjang minimum kata sandi tidak konsisten**: `login` 6 karakter, `register` 8 karakter | Pengguna yang mendaftar dengan 8 karakter tidak terpengaruh, tetapi aturan ganda membingungkan dan menandakan kebijakan yang belum tetap | Tetapkan satu kebijakan (disarankan **8 karakter** mengikuti pendaftaran) dan terapkan di kedua halaman |
| 2 | Tidak ada verifikasi kredensial — form valid langsung masuk | Tidak bisa dites sebagai autentikasi nyata | Sambungkan ke endpoint auth; tangani 401 dengan pesan `#err` |
| 3 | OAuth hanya menulis teks, tidak mengalihkan | Alur pihak ketiga belum bisa diuji | Implementasikan redirect OAuth + callback |
| 4 | Tautan reset tidak benar-benar dikirim | — | Implementasikan pengiriman email/SMS, hormati masa berlaku 15 menit |
| 5 | Tombol kembali `forgot_password` menuju `settings_security.html` | Pengguna dari `login.html` mendarat di halaman yang salah | Gunakan riwayat browser (`history.back()`) atau parameter asal |
| 6 | "Ingat saya" tidak dibaca saat submit | Preferensi pengguna diabaikan | Petakan ke masa berlaku refresh token |
| 7 | Tidak ada perlindungan brute force, rate limit, atau CAPTCHA | Risiko keamanan di produksi | Tambahkan rate limit per identitas + IP, dan penguncian sementara |
| 8 | Bergantung pada FontAwesome 6.5.1 dari CDN | Gagal saat offline | Self-host atau ganti ke SVG inline (lihat `prd_01_design_system.md` §7) |
