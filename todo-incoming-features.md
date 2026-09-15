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

**Diputuskan pengguna (Langkah 83):** verifikasi **dokumen KTP** — bukan
swa-deklarasi — dan mode tampilannya **diatur server** (`gated` / `hidden`),
keduanya dibangun. Rinciannya `architecture.md` §1.52.

- [x] Tanggal lahir + foto KTP diajukan di `/pengaturan/verifikasi-usia`
      (`AgeVerification`: none → pending → verified/rejected, penolakan wajib
      beralasan, pengajuan ulang setelah ditolak)
  ↳ Unggahan **disimulasikan** — v1 tidak punya penyimpanan berkas; hanya nama &
    ukuran yang tercatat, dan layarnya mengatakannya terang. Keputusan peninjau
    ada di `/dev/kitchen-sink`, seperti keputusan admin atas antrean tinjauan.
- [x] `audience` **menyaring di server** — satu penyaring (`feedFilterFor`) untuk
      beranda, section, pencarian, dan pilihan awal; `getChapter` mengirim bab
      18+ **tanpa isi dan tanpa pratinjau**; `unlockChapter` menolak sebelum koin
      terpotong. `isAdult` diturunkan dari tanggal lahir **hari ini**, tidak
      disimpan (`lib/age.ts`)
- [x] Gerbang usia di ruang baca — bukan gerbang koin dengan kata lain: tidak
      memperlihatkan apa pun, tidak menjual apa pun, satu jalan (verifikasi) dan
      satu jaminan (koin tidak terpotong). Rantai baca menerus berhenti di sana
- [x] Sakelar "Tampilkan cerita 18+" di `/pengaturan/bahasa` (bagian Konten),
      bawaan mati, terkunci beserta tautan verifikasi bila belum berhak.
      **Sakelar ≠ izin**: ia hanya menjawab "mau lihat di deretan atau tidak"
- [x] Lencana `18+` di deret genre hero detail dan di baris metrik kartu, plus
      pemberitahuan di detail dengan tautan verifikasi; baris "Verifikasi usia"
      di `/profil`
- [x] Mode `hidden` — cerita 18+ menjawab `NOT_FOUND` di detail & bab bagi akun
      yang tidak berhak, dan **halaman detail kini punya pesan NOT_FOUND sendiri**
      ("Cerita ini tidak ditemukan" + Ke beranda) alih-alih pesan jaringan
      generik ber-"Coba lagi" · `[LUAR]`
- [x] Dua cerita contoh berlabel 18+ (`s16`, `s31`) ditulis di `catalog.ts`

> ⚠️ Yang tetap terbuka: **tidak ada panel admin**, jadi di produksi tidak ada
> yang bisa menyetujui KTP — dan cerita 18+ tidak terbaca siapa pun sampai panel
> itu ada (bagian B). Prioritasnya naik karenanya.

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

- [x] Jenis notifikasi kedua belas `cerita-baru` (`type: 'cerita'`,
      `group: 'cerita'`) — ikon, saringan, dan kelompok preferensinya dari
      tabel `lib/notif.ts` yang sama
- [x] Dipicu **lewat `emitNotification`** di satu-satunya tempat cerita jadi
      `published` — keputusan tinjauan — jadi preferensi dan jam tenang tetap
      berlaku; `groupKey` per penulis
- [x] Section "Dari Penulis yang Kamu Ikuti" (`sec-following`, sakelar
      kesepuluh) — global seperti Lanjut Membaca, tanpa halaman lihat-semua
      (isinya bergantung siapa yang membaca; registry section tidak mengenal
      pembacanya — `ponytail:` cabang ber-`userId` di `getSection` kalau perlu)
- [x] Keadaan kosongnya **dikirim server** (`keepEmpty`) dan digambar sebagai
      ajakan + tombol "Cari penulis"
- [x] **Dua cacat lama ketahuan saat tombolnya diberi akibat** · `[LUAR]`:
      tombol Ikuti di profil publik **tidak pernah bekerja** (`useToggleFollow`
      mengira snapshot-nya daftar, `previous.items.map` melempar di `onMutate`),
      dan berhenti mengikuti baris seed tidak pernah menghapus apa pun
      (`delete` memakai id tebakan, bukan `existing.id`). Keduanya diperbaiki

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

- [x] **Diputuskan pengguna: prerender saat build** dari katalog contoh —
      tanpa dependensi baru (`scripts/prerender.mjs` memakai `ssrLoadModule`
      Vite sebagai pemuat TS/alias/JSON)
- [x] `og:*` + `twitter:card` + `canonical` untuk 70 cerita dan 8 penulis →
      `dist/cerita/<id>/index.html`, `dist/pengguna/<id>/index.html`; kerangka
      SPA yang sama, jadi aplikasinya tetap menyala di atasnya
- [x] `sitemap.xml` ditulis skrip yang sama; `robots.txt` menunjuknya lagi
- [x] Berjalan **sesudah** `vite build` supaya 78 HTML itu tidak masuk precache
      Workbox; `vite preview` diberi middleware `prerenderIndex` karena sirv tidak
      mencari `index.html` untuk path tanpa garis miring — nginx produksi bisa,
      dan `check:build` kini memeriksa `og:title` lewat HTTP mentah, seperti
      perayap
  ↳ **Batasnya ditulis:** datanya data contoh. Saat backend nyata ada, langkah
    ini harus jadi dinamis (edge/SSR) dan skripnya dihapus (`backend-contract.md`
    §11)

### A4 · Belum ada persetujuan analitik · `P1` · kepatuhan

`todo.md` Fase 15 merencanakan *"Error tracking (Sentry) + analytics dasar"*
tanpa satu pun langkah persetujuan. UU PDP menuntutnya.

Separuh kewajibannya justru **sudah** dipenuhi: ekspor data empat kategori dan
hapus akun sudah ada di `/pengaturan/keamanan` (FR-SET-05). Yang kurang bagian
paling sederhananya.

**Diputuskan pengguna (Langkah 84): ditunda sampai Fase 15** — dibangun
bersama Sentry/analitik, supaya lembarnya lahir bersama hal yang ia gerbangi.
Kotak-kotaknya tetap di sini, tidak dicentang. Tabel `analytics_consent` sudah
ada di `backend-contract.md` §3.9.

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

- [x] `'chapter'` masuk ke `targetType` (kontrak, Dexie, `backend-contract.md`)
- [x] Tombol **Laporkan** di baris reaksi ujung bab, memakai `ModerationActions`
      + `ReportSheet` yang sudah ada; lembarnya berjudul "Laporkan Bab N" —
      dari `data.number`, bukan bab yang sedang terlihat (di ujung bab pengamat
      sudah menunjuk bab berikutnya)
- [x] Antrean tinjauan menampilkan `Bab N · judul` di konteks laporan, dan
      tautannya menuju editor bab itu — bukan formulir ceritanya
- [x] Ambang tiga laporan menaruh **bab itu saja** ke `review: 'in_review'`:
      keluar dari daftar bab pembaca, `getChapter` mengirimnya tanpa isi dengan
      `underReview`, ruang baca menggambar pemberitahuan "sedang ditinjau" tanpa
      tombol, rantai baca berhenti di sana. Ceritanya tidak disentuh; keputusan
      admin memulihkannya lewat pintu antrean yang sudah ada
- [x] Iklan native & baris Suka/Laporkan **tidak digambar** di bawah bab yang
      ditahan gerbang usia atau tinjauan — dua kontrol untuk sesuatu yang tidak
      ada di layar · `[LUAR]`

### A6 · FR-WALLET-13 dilewati tanpa catatan · `P3` · utang dokumen

Varian isi saldo berbasis **rupiah** (P2, `topup_restyled`): saldo dalam rupiah,
empat nominal berbonus rupiah, pemformatan ribuan berkoma.

Ia hampir pasti memang tidak diinginkan — ia bekerja dalam rupiah dan
bertabrakan langsung dengan ekonomi koin yang jadi inti aplikasi ini. Tetapi
**tidak ada satu baris pun yang mencatat bahwa ia sengaja dilewati**, dan aturan
proyek ini menuntut tiap penimpaan PRD dicatat di `architecture.md` §1.x.

**Diputuskan pengguna (Langkah 84): "jangan dikerjakan A6."** Tidak dibuang,
tidak dibangun, tidak dicatat sebagai penimpaan — ia tetap terbuka di sini
sampai ada keputusan lain. PRD tidak disentuh.

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

- [x] Nama pena di `StoryHero` jadi tautan ke `/pengguna/<authorId>` —
      disetujui pengguna (Langkah 85). Garis bawah putus-putus warna garis,
      bukan tombol: ia terbaca sebagai tautan tanpa bersaing dengan Simpan/Ikuti
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

- [x] **Diputuskan pengguna: (b)** — kolom `act` dihapus **dan** `progress`
      disemai untuk enam dari delapan pengguna (`FOLLOWER_PROGRESS`, 11 baris);
      dua sengaja tanpa progres karena koneksi yang belum membaca apa pun adalah
      keadaan yang sah. Barisnya tetap diturunkan `activityLineOf` (§1.38), jadi
      "21 bab selesai" adalah angka yang bisa dibuktikan dari datanya
  ↳ Tanggal selesainya kemarin dan sebelumnya — **bukan hari ini** — supaya misi
    harian akun contoh tidak dihitung dari bab orang lain
- [x] Baris `UserRow` di 320px diperbaiki · `[LUAR]`: nama dan lencana *Penulis*
      berbagi satu baris dengan tombol Mengikuti, jadi "Adi Kurniawan" jadi
      "Ad…" — cacat lama yang baru terlihat setelah barisnya berisi. Lencana
      turun ke baris keterangan, keterangan boleh tiga baris

---

## B. Menunggu backend

> **Skemanya sudah ditulis.** `backend-contract.md` (Langkah 82) memuat 36 tabel
> Postgres beserta tipe tiap kolom, ke-127 endpoint RPC, bentuk yang **tidak**
> punya tabel, dan urutan migrasi sembilan tahap. Mulai dari sana, bukan dari
> membaca ulang `contracts/`.


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
