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
> | **berkas ini** | Fitur yang **belum lengkap**, dari sumber mana pun: celah yang ditemukan audit (A), hal yang menunggu backend (B), kandidat yang belum pernah diputuskan (C), dan penyesuaian amplop respons backend (D). |
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
- [ ] **Indikator perpindahan yang sungguh lambat** (Fase 14b-c, §1.57) — React
      Router 7 menahan halaman lama selama modul baru dimuat, jadi tidak ada
      umpan balik sama sekali bila modulnya lambat. Jalannya `route.lazy` +
      `useNavigation` untuk 43 entri tabel rute; baru berarti kalau chunk
      **tidak** dari precache SW, mis. rilis baru yang belum terunduh

---

## D. Amplop respons backend — seluruh fitur, nol regresi

> Ditetapkan pengguna Langkah 86, diperluas Langkah 87: *"buat todo untuk semua
> fitur mengubah api mocknya, dan saya mau ketika dikerjakan tidak ada error
> disemua fitur yang sudah dibuat."*
>
> Backend menjawab **satu amplop** untuk semua: `{ success, code, message, data,
> meta, request_id }` — `code` angka status HTTP, `data`/`meta` tidak pernah
> `null`, koleksi = `data` array + `meta { total_count, limit, offset }`,
> **tanpa kode aplikasi** saat gagal. Kontraknya `backend-contract.md` §2.2 &
> §7; keputusan turunannya `architecture.md` §1.55.
>
> **TUNTAS — Langkah 88** (17 Sep 2026). 37 dari 37 kotak. `envelope.ts`
> membungkus dan membuka, `errorMap.ts` memulihkan kode dari `(metode, status)`,
> server-mock melewatinya di satu titik, dan `api/http/` bukan stub lagi.
> **754 test unit** (naik dari 678) + **124 e2e** hijau, `npm run check` dan
> `check:build` bersih. Empat temuan yang ternyata **mendahului** amplopnya
> dicatat di `architecture.md` §1.56.

### D0 · Aturan main — inilah yang menjamin "tidak ada error di semua fitur"

**Prinsip.** Halaman dan hook **tidak tahu ada amplop**. Tipe seam (`Paged<T>`,
`ApiError`, nilai kembalian tiap metode) tidak berubah sama sekali, jadi 12
folder `features/` dan 43 rute tidak disentuh. Yang berubah cuma dua sisi seam,
dan keduanya memakai **satu** pembuka amplop — pola "satu berkas, dua pembaca"
(§1.15, §1.36).

**Kenapa server-mock ikut dibungkus, padahal amplop itu urusan backend.** Kalau
hanya `api/http/` yang membukanya, tabel `(metode, code)` baru terbukti saat
backend sungguhan hidup — dan yang menemukan salahnya jadi pengguna, bukan
test. Dibungkus di mock, **678 unit + 124 e2e yang sudah ada berubah jadi jaring
regresi untuk amplopnya**: tiap metode, tiap kode error, tiap layar sudah
tercakup di sana. Itu satu-satunya cara permintaan "tidak ada error di semua
fitur" bisa dibuktikan, bukan dijanjikan.

**Definisi selesai — berlaku untuk setiap kotak, tanpa kecuali:**

1. `npm run check` bersih (biome + `tsc --noEmit` + token).
2. `npm test` hijau **seluruhnya** — bukan hanya test yang baru ditulis. Angka
   sekarang **754** (678 sebelum bagian D); kalau turun, ada yang dihapus
   diam-diam.
3. e2e domain yang bersangkutan hijau (daftarnya ada di tiap kotak D3).
4. Kotak yang menyentuh layar: **320 · 360 · 390 · 412 · 430 · 1280** (§2
   CLAUDE.md). Amplop seharusnya tidak mengubah tampilan — justru karena itu,
   satu layar yang berubah berarti ada yang bocor dari seam.
5. `npm run check:build` bersih sebelum kotak terakhir tiap bagian dicentang.

**Urutan wajib, dan alasannya.** D1 → D2 → D3 → D4 → D5. Membalik D2 dan D3
(membungkus per domain tanpa fondasi yang menyeluruh) berarti dua jalur hidup
bersamaan di seam yang sama, dan kegagalannya muncul sebagai metode yang
"kadang" mengembalikan amplop. D4 sesudah D3 karena `api/http/` menyalin peta
yang sudah terbukti di mock, bukan menebaknya.

**Satu commit per kotak D3**, dengan suite hijau di tiap commit. Kalau satu
domain jatuh, yang di-revert satu domain — bukan seluruh pekerjaan.

### D1 · Fondasi seam — 5 kotak

- [x] **`src/api/envelope.ts`** — `EnvelopeSchema` Zod (`success` boolean ·
      `code` int · `message` string · `data` objek/array · `meta` objek ·
      `request_id` string) dan dua fungsi: `bungkus(hasil | ApiError, metode)` →
      amplop, `buka(amplop, metode, skemaData)` → nilai seam atau **melempar**
      `ApiError`. Satu-satunya tempat `meta` dibaca dan `success` dipercaya
- [x] **Lima bentuk kembalian ditangani di `buka()`**, bukan di pemanggilnya —
      objek biasa · `void` (`{}` → `undefined`) · `Paged<T>` (`page = ⌊offset ÷
      limit⌋ + 1`, `hasMore = offset + data.length < total_count`) · nullable
      (`{}` → `null`, untuk `getProgress`/`getMyRating`/`getBundleOffer`) ·
      primitif (`{ value }` → nilainya, untuk `hasReported`/`getUnreadCount`).
      Kelimanya dari `backend-contract.md` §2.2
  ↳ Halaman terakhir dan `total_count = 0` ikut diuji di D1, bukan ditemukan di
    `/cari` — `hasMore` yang salah membuat `IntersectionObserver` memuat
    selamanya (CLAUDE.md §8)
- [x] **`src/api/errorMap.ts`** — tabel `(metode, code) → ErrorCode` persis §7:
      bawaan per status (400 `VALIDATION` · 401 `AUTH-401` · 402
      `INSUFFICIENT_COINS` · 403 `FORBIDDEN` · 404 `NOT_FOUND` · 409 `CONFLICT`
      · 426 `APP-426` · 429 `QUOTA_EXCEEDED` · 5xx `UNKNOWN`) + 11 penimpaan per
      metode. Arah sebaliknya (`ErrorCode → HTTP`) dari tabel yang **sama** —
      kode tampil `XXX-nnn` → `nnn`, jangan ditulis dua kali
- [x] **`ApiError.requestId`** — diisi `buka()`, dirender `FailureNotice` kecil
      di bawah pesan bersama kodenya (`PAY-402 · 3f9a…`), §1.4. `payFailure` di
      `wallet.ts` berhenti menyusun `${code} · ${order.method}` ke `detail`
- [x] **Dua fakta yang ikut di `data` saat gagal** — `retry_at` (`login` 429 →
      `ApiError.retryAt`, dibaca `SignInPage`) dan `withdrawn_at` (`getChapter`
      410 → `ApiError`, dibaca `ReaderPage`; sekarang menumpang `detail`, pindah
      ke field bernama). Selain dua itu `data` gagal = `{}`

### D2 · Server-mock dibungkus — 4 kotak

- [x] **Satu titik bungkus di `src/api/mock/index.ts`** — tiap handler dibungkus
      `bungkus()` lalu langsung `buka()`. Bukan 130 suntingan: satu `Proxy` atau
      satu `map` atas objek `handlers`, sejalan dengan `withNotImplemented` yang
      sudah ada di sana
- [x] **Skema per metode tersedia untuk `buka()`** — `buka` butuh skema `data`
      untuk membedakan `{}`-berarti-`void` dari `{}`-berarti-`null`. Ambil dari
      `contracts/` lewat satu tabel `metode → skema`; metode tanpa skema
      (`void`) terdaftar eksplisit, **bukan** jatuh ke `any`
- [x] **`request_id` mock** = `crypto.randomUUID()` (aturan LAN HTTP CLAUDE.md
      tetap berlaku — jangan diganti), `message` sukses = `''`
- [x] **Status per lemparan diselaraskan** — mock hari ini melempar `VALIDATION`
      (400) untuk "waktu terbit sudah lewat" padahal kodenya ada (`SCHED-422`),
      dan `SCHED-409` tidak pernah dilempar sama sekali. Jadwal → 409/422.
      `PRINT-504/410/402` dan `SCHED-200` tetap **status di data**, bukan error
      (§7.3). `PAY-410` dulu tercatat HTTP 409 — sekarang 410

### D3 · Sapuan per domain — 16 kotak, 130 metode

Satu kotak per bagian §6 `backend-contract.md`, karena pembagian itu sudah
diverifikasi 130 = 130. Tiap kotak: jalankan domainnya lewat amplop, periksa
bentuk kembalian yang khas di sana, dan **buka layarnya** — bukan cuma
menjalankan test.

- [x] **6.1 Sesi & akun — 7** · `login` 429 wajib membawa `retry_at`
      (`SignInPage` menampilkan jam buka kembali); `AUTH-401` dari metode mana
      pun tetap memicu lembar masuk ulang; `logout`/`revokeDeviceSession` `void`
      → `{}`. Layar: `/masuk` `/daftar` `/lupa-sandi` `/pengaturan/keamanan` ·
      test: `session.test.tsx`
- [x] **6.2 Onboarding & beranda — 6** · `getSection` `Paged` · `getTrendingQueries`
      `string[]` · `getHomeFeed` objek bersarang. Penyaring 18+ (A1) harus tetap
      berlaku sesudah amplop. Layar: `/` `/mulai` · test: `HomePage.test.tsx`,
      `beranda-data.test.ts` · e2e: `usia-dan-ikuti`
- [x] **6.3 Pencarian — 2** · `search` `Paged` + `getSuggestions` array.
      **`hasMore` yang salah di sini menggantung `IntersectionObserver`** —
      periksa halaman terakhir sungguhan, bukan halaman pertama. Layar: `/cari`
      `/jelajah/:kategori`
- [x] **6.4 Cerita & bab — 8** · `getChapter` 410 `CONTENT-410` + `withdrawn_at`
      (layar bab ditarik menyebut tanggalnya) · `getChapters` `Paged` ·
      `getBundleOffer` **nullable** · bab terkunci tetap tanpa isi. Layar:
      `/cerita/:id`, ruang baca · e2e: `baca-bab-gratis`
- [x] **6.5 Progres & perpustakaan — 13** · `getProgress` **nullable** — cerita
      yang belum pernah dibuka mengirim `{}`, dan itu `null`, bukan progres
      kosong · `listLibrary`/`getLibrary` `Paged` · `saveProgress` `void`.
      Layar: `/pustaka` · test: `library` + progres
- [x] **6.6 Dompet — 9** · tiga jalan gagal bayar yang **aksinya berbeda**
      (`PAY-402` 402 · `PAY-504` 504 · `PAY-410` 410) wajib tetap mendarat di
      layar masing-masing · `listTransactions` `Paged` · idempotency tidak
      berubah. Layar: `/koin` `/koin/transaksi` `/koin/transaksi/:txId` · e2e:
      `isi-koin-lalu-buka-bab`, `isi-koin-di-hp`
- [x] **6.7 Voucher di jalur baca — 2** · `redeemVoucher` 410 `PAY-410` vs 404
      `NOT_FOUND` vs 409 `CONFLICT` — tiga arti berbeda dari satu metode, dan
      peta `(metode, code)` harus memisahkannya
- [x] **6.8 Sosial — 15** · `getMyRating` **nullable** · `hasReported`
      **boolean** → `{ value }` · `listBlocks` `string[]` · `listComments`
      `Paged` · `react`/`report` `void`. Layar: `/cerita/:id/ulasan`,
      komentar bab · e2e: `rantai-ulasan`, `komentar-dua-lebar`, `laporkan-bab`
- [x] **6.9 Notifikasi — 5** · `getUnreadCount` **number** → `{ value }`; aturan
      "nol berarti lencana tidak dirender" tidak boleh berubah jadi lencana `0`
      · `listNotifications` `Paged` · `markRead` menerima `{ arg }` daftar atau
      `"all"`. Layar: `/notifikasi` `/notifikasi/pengaturan` · e2e:
      `notifikasi-dua-lebar`
- [x] **6.10 Studio — 21** · domain terbesar · `saveChapterDraft` `DRAFT-409`
      **tidak membekukan editor** · jadwal `SCHED-409`/`SCHED-422` (baru, D2) ·
      `SCHED-200` **peringatan di data, bukan error** · dua `Paged` · lima
      `void`. Layar: enam rute `/karya/*` · e2e: `karya-dua-lebar`
- [x] **6.11 Tinjauan & cetak — 8** · `cancelPrintOrder` 409 `PRINT-409` ·
      `PRINT-504/410/402` tetap `failure_code` di pesanan, **bukan** kegagalan
      RPC — kalau salah satunya berubah jadi error, layar `PRINT-402` penuh
      hilang. Layar: `/karya/tinjauan` `/karya/cetak` · e2e: `rantai-tinjauan`
- [x] **6.12 Penghasilan — 6** · tangga validasi pencairan lima tingkat tetap
      `VALIDATION` dengan pesannya yang spesifik — pesan itulah yang dirender,
      jadi `message` amplop wajib meneruskannya utuh · `listWithdrawals` `Paged`.
      Layar: tiga rute `/penulis/*`
- [x] **6.13 Hadiah — 7** · `claimCheckIn`/`claimMission` 409 `CONFLICT` dengan
      pesan berbeda per sebab (sudah diklaim vs belum selesai) · `listRewardHistory`
      array. Layar: `/hadiah` · e2e: `hadiah-dua-lebar`
- [x] **6.14 Profil & pengaturan — 14** · `listConnections` `Paged` ·
      `requestAccountDeletion` 409 membawa **alasan** yang dirender ·
      privasi: tab yang dimatikan tetap **tidak dikirim** (§1.41) — amplop tidak
      boleh mengubahnya jadi objek kosong yang terbaca "ada tapi kosong". Layar:
      `/profil` `/profil/ubah` `/pengguna/:id` `/profil/koneksi`
      `/pengaturan/*` · e2e: `profil-dua-lebar`, `usia-dan-ikuti`
- [x] **6.15 Verifikasi usia — 3** · `submitAgeVerification` **multipart**, satu-satunya
      pengecualian bentuk permintaan di seluruh kontrak (§0) — amplop
      jawabannya tetap sama. Layar: `/pengaturan/verifikasi-usia` · e2e:
      `usia-dan-ikuti`
- [x] **6.16 Baca offline — 4** · `saveChapterOffline` 403 `FORBIDDEN` untuk bab
      yang tidak dimiliki · **`networkMode: 'offlineFirst'` (§1.44) tetap
      berlaku** — amplop tidak boleh membuat kueri offline berhenti di kerangka.
      Layar: ruang baca offline, `/pustaka` · e2e: `offline-baca-tersimpan`

### D4 · `api/http/` — 4 kotak

- [x] **Satu fungsi `rpc(metode, args, skemaData)`** — `fetch`
      `POST ${VITE_API_BASE_URL}/rpc/${metode}`, `Authorization` dari token di
      memori, `Accept-Language`, `X-Client-Version`; jawaban → `buka()` yang
      sama dengan mock
- [x] **130 baris tipis** `(…args) => rpc('nama', bungkusArgs(args), Skema)`,
      dibangkitkan dari tabel §6 — bukan ditulis tangan satu per satu.
      Pembungkusan argumen mengikuti §2.1: objek tunggal apa adanya, posisi →
      objek bernama, non-objek → `{ arg }`
- [x] **Kegagalan yang bukan dari server** — tanpa jawaban / gagal parse /
      `success` berselisih dengan statusnya → `NETWORK` · `TIMEOUT` · `OFFLINE`
      · `CONTRACT`, **ditentukan klien** (§7.1)
- [x] **`401` → `refresh` sekali → ulangi permintaan**; gagal lagi → lembar
      masuk ulang (sudah ada di `SessionProvider`). Jangan mengulang lebih dari
      sekali: dua `refresh` beruntun adalah lingkaran

### D5 · Verifikasi menyeluruh — 6 kotak

- [x] **`tests/unit/envelope.test.ts`** — sukses objek · `void` → `undefined` ·
      `Paged` (halaman pertama, terakhir, dan `total_count = 0`) · nullable →
      `null` · primitif → nilainya · gagal 404 → `NOT_FOUND` · `login` 429 →
      `AUTH-429` + `retryAt` · `getChapter` 410 → `CONTENT-410` + tanggal ·
      `success: false` di atas 200 → `CONTRACT`
- [x] **Sapuan seluruh kode** — satu test yang mengambil `VISIBLE_CODES` ∪
      `INTERNAL_CODES` dan menuntut tiap kode punya jalan pulang di `errorMap`.
      Kode baru tanpa peta gagal di sini, bukan di produksi
- [x] **Sapuan seluruh metode** — satu test yang mengambil ke-130 nama metode
      dari seam dan menuntut tiap nama punya skema di tabel D2. Metode baru yang
      lupa didaftarkan gagal di sini, bukan sebagai `{}` diam-diam di layar
- [x] **`npm test` penuh hijau** — **754 test, bukan 754 dikurangi yang
      dinonaktifkan**; 678 di antaranya sudah ada sebelum bagian D dan lulus
      tanpa satu pun disunting untuk menyesuaikan diri dengan amplop. Ini kotak inti dari permintaan "tidak ada error di semua
      fitur": suite yang ada sudah menyentuh 130 metode dan 43 rute
- [x] **14 spec e2e hijau**, termasuk sapuan lebar `isi-koin-di-hp` (8 lebar) dan
      sapuan target ketuk
- [x] **`npm run build` + `npm run check:build`** — seam tidak boleh memakai
      top-level `await` (§1.32), dan `envelope.ts` yang mengimpor `contracts/`
      bisa melahirkan lingkar chunk yang **tidak** muncul di `npm run check`

### D6 · Dokumen — 2 kotak

- [x] **`architecture.md`** — §1.55 sudah memuat keputusannya; tambahkan yang
      ditemukan saat mengerjakan (jebakan baru masuk CLAUDE.md §8)
- [x] **`CLAUDE.md` §6 & `backend-contract.md` §11** — perbarui jumlah test dan
      apa yang akhirnya terjawab

### Yang sengaja **tidak** dilakukan

- **Komponen/hook membaca `success`, `meta`, atau `request_id` langsung** —
  amplop berhenti di `buka()`. Kalau satu layar butuh `request_id`, ia
  mendapatkannya lewat `ApiError`, bukan lewat respons mentah
- **Mengganti `Paged<T>` seam jadi `limit/offset`** — 37 berkas untuk nol
  manfaat
- **Mengirim kode aplikasi di amplop** (`error_code`) — **ditolak pengguna**.
  Kalau suatu hari satu metode butuh dua arti untuk satu status, itu sinyal
  membuka ulang keputusan ini, bukan menyelundupkannya di `message`
- **Sakelar env untuk mematikan amplop** — dua jalur hidup bersamaan adalah cara
  paling rapi menghasilkan cacat yang "kadang" muncul. Yang menjaga keamanannya
  satu commit per domain dengan suite hijau, bukan flag

---

## Yang **bukan** urusan berkas ini

- **Fase 15** (`todo.md`): CI, deploy, header keamanan, aset final, README,
  serah terima. Itu persiapan rilis, bukan fitur.
- **Batasan yang diketahui** (`architecture.md` §17, **12 butir**): daftar apa
  yang disimulasikan. Sebagian melahirkan butir di bagian B; sisanya memang
  konsekuensi keputusan "frontend dulu" dan bukan pekerjaan tertunda.
- **Safari & pembaca layar** (§17 no. 11 dan no. 12): keduanya **pemeriksaan**
  yang belum bisa dijalankan dari mesin ini, bukan fitur yang belum dibangun.
