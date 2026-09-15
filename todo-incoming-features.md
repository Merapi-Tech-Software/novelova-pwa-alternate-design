# Fitur yang belum lengkap — Novelova v2

> **Rumah tunggal untuk segala sesuatu yang belum utuh sebagai *fitur*.**
>
> Dibuat Langkah 80, atas permintaan pengguna: *"buat nama baru
> todo-incoming-features.md nah disini disimpan semua fitur yang masih belum
> lengkap dari aplikasi ini."*
>
> **Bedanya dengan berkas lain — jangan dicampur:**
>
> | Berkas | Isinya |
> |---|---|
> | `todo.md` | **Rencana per fase.** Fase 0–14 selesai; sisanya Fase 15 (persiapan rilis — CI, deploy, header keamanan, aset final). Bukan fitur. |
> | `todo-redesign.md` | Fase R, **tuntas**. 42 rute berkulit putaran 7. |
> | **berkas ini** | Fitur yang **belum lengkap**, dari sumber mana pun: celah yang ditemukan audit, hal yang menunggu backend, dan kandidat yang belum pernah diputuskan. |
>
> Aturan centangnya sama dengan `todo.md`: `[x]` berarti **sudah ada di repo dan
> lolos `npm run check` + `npm test`**, bukan sekadar direncanakan.

---

## A. Celah yang ditemukan audit Langkah 80

Delapan temuan — enam pada sapuan pertama, dua lagi saat pengguna meminta
cek profil publik (Langkah 81). Semuanya diverifikasi di kode — bukan dugaan — dan tidak satu pun
pernah masuk `todo.md`, karena tidak satu pun berasal dari daftar fase.

### A1 · Rating usia disimpan, tetapi tidak pernah ditegakkan · `P0`

**Terukur:** `AudienceSchema` (`'Remaja' | 'Semua Umur' | 'Dewasa 18+'`) diisi
penulis di formulir cerita dan tersimpan di `Story.audience` serta
`StoryFormValues.audience`. Lalu **tidak ada satu pun tempat yang membacanya** —
tidak di beranda, pencarian, jelajah, detail cerita, maupun ruang baca. Pengguna
juga tidak punya tanggal lahir sama sekali.

Akibatnya label "Dewasa 18+" tidak melakukan apa pun. Ia terbaca sebagai janji
kepada penulis dan kepada pembaca, dan janji itu tidak ditepati di mana pun.

- [ ] Tanggal lahir pada profil pengguna — **opsional saat daftar, wajib sebelum
      membuka cerita dewasa pertama**. Menuntutnya di layar pendaftaran menaikkan
      gesekan untuk semua orang demi aturan yang berlaku bagi sebagian.
- [ ] `audience` ikut **menyaring di server**, bukan disembunyikan di klien —
      cerita dewasa tidak dikirim ke akun yang tidak berhak, sejalan dengan
      §1.41 ("privasi ditegakkan dengan tidak mengirim")
- [ ] Layar peringatan sekali per cerita sebelum bab dewasa pertama, dengan
      pilihan mundur yang jelas
- [ ] Sakelar "tampilkan konten dewasa" di `/pengaturan/bahasa` atau pengaturan
      baru — bawaannya **mati**
- [ ] Lencana `18+` di kartu cerita dan di hero detail
- [ ] Keputusan produk yang perlu dijawab lebih dulu: **apakah verifikasi
      usianya cukup swa-deklarasi**, atau harus dokumen? Swa-deklarasi lazim di
      Indonesia dan jauh lebih murah, tetapi itu keputusan pemilik produk

> ⚠️ Ini satu-satunya butir di berkas ini yang risikonya **di luar teknis**.
> Kalau ada satu hal yang dikerjakan sebelum rilis, ini.

### A2 · Mengikuti penulis tidak menghasilkan apa pun · `P1`

**Terukur:** tabel `follows` hanya dibaca untuk tiga hal — jumlah pengikut,
keadaan tombol Ikuti, dan daftar `/profil/koneksi`. Tidak ada notifikasi, tidak
ada section beranda, tidak ada feed.

Dan katalog notifikasi memang tidak punya jenisnya: kesebelas jenis di
`lib/notif.ts` memuat `pengikut-baru` — yaitu *"seseorang mengikuti kamu"* —
tetapi **tidak ada** *"penulis yang kamu ikuti merilis cerita baru"*.

Jadi pembaca menekan Ikuti, angkanya naik, dan sesudah itu tidak terjadi apa-apa
selamanya. Tombol yang tidak melakukan apa pun lebih buruk daripada tombol yang
tidak ada — ia mengajari pengguna bahwa menekannya tidak berarti apa-apa.

- [ ] Jenis notifikasi baru `cerita-baru` di `NOTIF_KINDS` (`type: 'cerita'`,
      `group: 'cerita'`), dipicu saat cerita penulis yang diikuti terbit
- [ ] `emitNotification` dipanggil dari jalur terbit cerita — **lewat pintunya**,
      bukan menulis ke tabel langsung (§1.39)
- [ ] Section beranda "Dari penulis yang kamu ikuti", tunduk pada sakelar
      section yang sudah ada (FR-HOME-06)
- [ ] Keadaan kosongnya harus **ajakan mengikuti penulis**, bukan "tidak ada
      hasil" — pembaca baru pasti mengenainya (FR-CORE-03)

### A3 · Tautan yang dibagikan tidak punya pratinjau · `P1` · butuh keputusan arsitektur

**Terukur:** `index.html` hanya memuat satu `<meta name="description">` global.
Tidak ada `og:title`, `og:description`, `og:image`, maupun `twitter:card`.

Setiap cerita yang dibagikan ke WhatsApp, X, atau Telegram muncul sebagai tautan
polos berbunyi *"Baca novel Indonesia, satu bab setiap hari"* — bukan judul dan
sampul ceritanya. Untuk aplikasi yang pertumbuhannya bergantung pada berbagi,
itu mahal. Aksi "Bagikan" **sudah ada** di kartu jelajah, jadi yang hilang justru
di ujung yang menerima.

**Ini tidak bisa ditambal dari sisi klien.** Perayap tidak menjalankan JavaScript,
jadi `document.title` yang diubah React tidak pernah terbaca. Pilihannya:

- [ ] **Keputusan dulu**, sebelum satu baris kode: prerender halaman publik saat
      build · SSR · atau fungsi edge kecil yang menyajikan meta untuk perayap
      saja. Ketiganya menambah infrastruktur, dan itu bertabrakan dengan aturan
      "jangan tambah dependensi" — jadi **jangan dipilih diam-diam**
- [ ] Setelah diputuskan: `og:*` + `twitter:card` untuk `/cerita/:id` dan
      `/pengguna/:id`, memakai sampul dan sinopsis yang sudah ada
- [ ] `sitemap.xml` — sekarang **sengaja tidak ada**, dan `robots.txt` sudah
      tidak lagi menunjuk ke sana (menunjuk sitemap yang 404 terbaca perayap
      sebagai konfigurasi rusak). Ia lahir bersama deploy Fase 15

### A4 · Belum ada persetujuan analitik · `P1` · kepatuhan

`todo.md` Fase 15 merencanakan *"Error tracking (Sentry) + analytics dasar"*
tanpa satu pun langkah persetujuan. UU PDP menuntutnya.

Separuh kewajibannya justru **sudah** dipenuhi: ekspor data empat kategori dan
hapus akun sudah ada di `/pengaturan/keamanan` (FR-SET-05). Yang kurang bagian
paling sederhananya.

- [ ] Lembar persetujuan sekali, sebelum Sentry/analitik pertama menyala
- [ ] Pilihannya tersimpan dan **bisa diubah** di pengaturan — persetujuan yang
      tidak bisa ditarik bukan persetujuan
- [ ] Tanpa persetujuan, tidak satu pun peristiwa dikirim. Bukan dikirim lalu
      dibuang
- [ ] Halaman `/legal/privasi` menyebutkan apa yang dikumpulkan, bukan kalimat
      umum

### A5 · Laporan tidak bisa menyasar bab · `P2`

**Terukur:** `targetType: 'story' | 'review' | 'comment' | 'user'`.

Pembaca yang menemukan pelanggaran di **isi bab** — bukan di komentarnya —
terpaksa melaporkan seluruh ceritanya. Itu memaksa moderator menebak bab mana,
dan memaksa pelapor menuduh lebih luas daripada yang ia maksud.

- [ ] `'chapter'` masuk ke `targetType`
- [ ] Jalur masuknya dari ruang baca, memakai `ReportSheet` yang sudah ada
- [ ] Antrean tinjauan menampilkan nomor + judul babnya, bukan hanya ceritanya
- [ ] Ambang penyembunyian berlaku **per bab**, bukan menjatuhkan seluruh cerita
      — sejalan dengan §1.18 ("melapor bukan membungkam")

### A6 · FR-WALLET-13 dilewati tanpa catatan · `P3` · utang dokumen

Varian isi saldo berbasis **rupiah** (P2, `topup_restyled`): saldo dalam rupiah,
empat nominal berbonus rupiah, pemformatan ribuan berkoma.

Ia hampir pasti memang tidak diinginkan — ia bekerja dalam rupiah dan
bertabrakan langsung dengan ekonomi koin yang jadi inti aplikasi ini. Tetapi
**tidak ada satu baris pun yang mencatat bahwa ia sengaja dilewati**, dan aturan
proyek ini menuntut tiap penimpaan PRD dicatat di `architecture.md` §1.x.

- [ ] Putuskan: dibuang atau dibangun
- [ ] Kalau dibuang — catat di `architecture.md` §1.x beserta alasannya, dan
      beri catatan revisi bertanggal di `prd_09_wallet_rewards.md` **bila
      pengguna memintanya secara eksplisit**

### A7 · Profil publik nyaris tidak bisa dicapai · `P2`

**Halamannya ada dan berjalan** (`/pengguna/:userId`, FR-PROF-08 · FR-PROF-10):
kartu identitas, tombol Ikuti, strip tiga statistik, tiga tab yang **hilang**
bila pemiliknya mematikan kategorinya, plus tab Visibilitas yang menjelaskan
kenapa. Diukur bersih di 320 · 360 · 390 · 412 · 430 · 1280.

Yang kurang jalan masuknya. Hanya **dua** tempat menautinya: `UserRow` (dipakai
`/profil/koneksi`) dan hasil pencarian bagian Penulis.

**Detail cerita tidak termasuk.** `StoryHero` merender `{story.penName}` sebagai
`<p>` polos, bukan tautan — padahal itu jalan paling wajar menuju profil penulis,
dan `Story.authorId` sudah ada di kontraknya. Pembaca yang menyukai satu cerita
tidak punya cara melihat apa lagi yang ditulis orang itu.

- [ ] Nama pena di `StoryHero` jadi tautan ke `/pengguna/<authorId>`
      — **butuh persetujuan**: ia mengubah tampilan halaman yang paling sering
      dibuka, dan nama yang tiba-tiba bisa diketuk adalah keputusan desain
- [ ] Nama penulis di kartu cerita (`StoryCard`) — sengaja **tidak** diusulkan:
      seluruh kartunya sudah satu tautan ke ceritanya, dan tautan di dalam
      tautan bukan HTML yang sah (jebakan yang sama dengan tombol putar di
      `variant="list"`)

### A8 · Baris aktivitas koneksi seragam karena kolom seed-nya tidak pernah dibaca · `P3`

`FOLLOWER_ROWS` di `seed.ts` mendeklarasikan kolom keempat `act` dan mengisinya
dengan sepuluh kalimat berbeda — *"412 bab tahun ini"*, *"6 karya terbit"*,
*"88 ulasan ditulis"*. **Tidak ada yang membacanya**: keduanya pemakaiannya
mendestrukturisasi `[name, handle, role]` saja.

Akibatnya `activityLineOf` menurunkannya dari tabel `progress` — yang untuk
delapan pengguna itu kosong — jadi `/profil/koneksi` dan tiap profil publik
sama-sama berbunyi **"Belum ada bab selesai"** untuk semua orang.

Menurunkannya dari data nyata **benar** (§1.38). Yang salah cuma: data nyatanya
tidak ada, dan kolom yang menyiratkan sebaliknya dibiarkan menganggur.

- [ ] Putuskan salah satu — **jangan dua-duanya**:
      **(a)** hapus kolom `act` yang mati, terima bahwa seluruh baris berbunyi
      sama sampai ada backend · **(b)** semai `progress` untuk `f1`–`f8` supaya
      baris turunannya bervariasi. Yang kedua lebih bagus dilihat, tetapi
      **menambah data contoh bukan perubahan yang aman secara otomatis**
      (CLAUDE.md §8) — ia sudah dua kali melahirkan cacat di proyek ini

---

## B. Menunggu backend

Dipindahkan ke sini dari `todo.md` (bekas bagian *"Backlog — Setelah v1"*)
supaya "apa yang belum lengkap" punya **satu** daftar, bukan dua yang bisa
saling menyimpang.

Bentuk aplikasinya sudah benar untuk kesembilannya — yang belum ada servernya.
Rinciannya di `architecture.md` §17.

- [ ] **Backend nyata** — tulis `api/http/`, ubah satu env. Prasyarat semua yang
      di bawah, dan **satu-satunya** yang menutup batasan "data hanya per
      perangkat" tanpa mengubah kode aplikasi (§17 no. 3)
- [ ] Autentikasi & otorisasi nyata (§17 no. 1) — bentuk sesinya sudah benar,
      yang kurang server yang memverifikasi
- [ ] Payment gateway nyata (Midtrans/Xendit) + webhook (§17 no. 2, no. 9)
- [ ] SDK iklan berhadiah nyata (§17 no. 4)
- [ ] Web Push ber-VAPID (§17 no. 8) — izin, jam tenang, dan deep link **sudah
      berjalan**; yang palsu cuma transportnya
- [ ] Pengiriman **email** sungguhan — kanal Email sudah ada di preferensi
      notifikasi dan bisa dinyalakan pengguna, tetapi tidak ada satu pun email
      yang pernah dikirim. Sakelar yang menyalakan sesuatu yang tidak ada adalah
      janji kosong
- [ ] Panel admin untuk antrean tinjauan (§17 no. 7) — sisi penulis sudah lengkap
- [ ] Render PDF & cetak di server (§17 no. 6)
- [ ] Peringkat relevansi pencarian yang sebenarnya (§17 no. 10)

---

## C. Kandidat yang belum pernah diputuskan

**Tidak ada di PRD, tidak ada di kanvas.** Jangan dikerjakan sebelum pengguna
memilihnya — aturan §2 ("bertanya sebelum mengasumsi") berlaku penuh di sini.
Dicatat supaya tidak hilang, bukan supaya dikerjakan.

- [ ] **Traktir/dukung penulis** (tip koin di luar harga bab). Lazim di aplikasi
      novel Indonesia, dan seluruh perkakasnya sudah ada: dompet, buku besar,
      bagi hasil 80/20, dan pintu tunggal ke ledger (§1.39). Yang belum ada
      keputusannya
- [ ] **Impor naskah** `.txt` / `.docx` ke editor bab. Penulis yang pindah dari
      platform lain sekarang harus menempel per bab. Yang ada baru arah
      sebaliknya: unduh `.txt` saat autosave gagal (`DraftFailureNotice`)
- [ ] **Penanda & catatan di dalam bab** — posisi baca sudah dipulihkan per bab
      (§1.24), tetapi pembaca tidak bisa menandai kalimat atau menulis catatan
- [ ] **Pengelolaan banyak rekening bank** — PRD 08 §7 #6; sekarang satu rekening
- [ ] **Bahasa English penuh** (`i18n/en.ts` + provider) — jalurnya sudah
      terpasang sejak FR-CORE-04, tinggal isinya
- [ ] **Pencarian di dalam isi bab** — `/cari` mencari judul, penulis, tag, genre,
      dan sinopsis; isi babnya tidak ikut

---

## Yang **bukan** urusan berkas ini

- **Fase 15** (`todo.md`): CI, deploy, header keamanan, aset final, README,
  serah terima. Itu persiapan rilis, bukan fitur.
- **Batasan yang diketahui** (`architecture.md` §17, **12 butir**): daftar apa
  yang disimulasikan. Sebagian melahirkan butir di bagian B; sisanya memang
  konsekuensi keputusan "frontend dulu" dan bukan pekerjaan tertunda.
- **Safari & pembaca layar** (§17 no. 11 dan no. 12): keduanya **pemeriksaan**
  yang belum bisa dijalankan dari mesin ini, bukan fitur yang belum dibangun.
