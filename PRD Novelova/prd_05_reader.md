# PRD Novelova — Modul Reader (Baca Bab)

> ## Salinan `novelova-v2/`
>
> **Berubah paling banyak.** Ruang baca dipecah dua tipe, auto-unlock jadi alur utama, dan ada satu FR baru (FR-READ-19).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Halaman: `chapter_read_locked_story_stage.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_chapter_read.md`

---

## 1. Ringkasan Modul

Layar tempat pembaca menghabiskan waktu terlama, sekaligus tempat monetisasi terjadi. Halaman ini menggabungkan tiga hal dalam satu alur menggulir: **teks bab yang sudah terbuka**, **slot iklan**, dan **gerbang bab terkunci** dengan empat cara membukanya.

Ini adalah satu-satunya halaman reader yang aktif — seluruh tautan bab, gratis maupun terkunci, mengarah ke sini.

| Aspek | Nilai |
|---|---|
| **Aktor** | Pembaca |
| **Halaman** | `chapter_read_locked_story_stage.html` (1.206 baris) |
| **Prasyarat** | Datang dari daftar bab di halaman detail cerita, perpustakaan, atau kelola bab |
| **State persisten** | `localStorage['novelova-reader-settings-v1']` |
| **Sub-sistem desain** | Frame sempit 360px, Trebuchet MS untuk UI, **Georgia untuk isi bab**, mendukung tema gelap |
| **Saldo awal** | **20.000** koin + 23 bonus *(revisi 5 Sep 2026 — lihat catatan di bawah)* |

---

## 2. Flow

> **Revisi 5 September 2026 · alur baca menerus.** Versi lama menggambarkan
> ruang baca **berhalaman**: satu bab per layar, pembaca menekan "Bab berikutnya"
> di ujungnya, dan tiap perpindahan memuat halaman baru. Ia juga menulis
> *"saldo tidak cukup → toast peringatan"* dan lencana hemat `5%`/`10%` sebagai
> angka pasti. Ketiganya tidak lagi berlaku. Alasan dan batasnya di
> `architecture.md` §1.25 (baca menerus), §1.21 (lencana hemat dari harga
> sungguhan), dan mockup `7z` (lembar, bukan toast).

1. Pembaca membuka bab dari halaman detail cerita, perpustakaan, atau tautan langsung.
2. Pengaturan baca dipulihkan dari penyimpanan **sebelum** teks dirender (ukuran huruf, tema).
3. Pembaca membaca; di sela bacaan muncul slot iklan. Saat mendekati ujung bab, **bab berikutnya dimuat dan disambung di bawahnya** — dipisah garis rambut polos, tanpa nomor, tanpa judul, tanpa tombol.
4. Bab yang **terlihat di layar** menggerakkan empat hal sekaligus: judul di bilah atas, nomor bab, tombol komentar, dan alamat URL. URL berganti lewat `history.replaceState` — pembaca tidak "pergi ke" bab berikutnya, ia terus membaca.
5. Saat rantai sampai pada bab **terkunci**, ada tiga percabangan, dan hanya satu yang menghentikan bacaan:
   - **Izin buka otomatis cerita ini belum ada** → **gerbang disisipkan sebagai blok** di tempat isi babnya, dan **tidak ada yang dimuat melewatinya** sampai pembaca menjawab. Pratinjau di baliknya diburamkan dan diberi label "Pratinjau tersensor"; paragraf pembukanya tetap terbaca. Empat pilihan: **Chapter ini** · **10 chapter** · **Buka sampai tamat** · **Tonton iklan** — harga dan lencana hematnya **dihitung server** dari harga bab sungguhan, bukan persentase tetap.
   - **Izin sudah ada dan saldo cukup** → bab **dibeli diam-diam** dan isinya langsung disambung. Tidak ada toast, tidak ada lencana, tidak ada yang menghalangi (FR-READ-09).
   - **Izin sudah ada tetapi saldo kurang** → **lembar** saldo kurang dengan tiga jalan keluar, bukan toast. Ia satu-satunya interupsi yang tersisa, dan ia memang harus menginterupsi.
6. Pembukaan yang **ditekan pembaca** tetap berbunyi: buram hilang, lencana "Chapter Terbuka" tampil, toast konfirmasi muncul. Pembukaan **otomatis** tidak meninggalkan jejak apa pun di layar — itu tujuan yang dinyatakan permintaan produknya. Saldo tetap diperbarui di semua tempat, dan buku besar tetap mencatat tiap potongan.
7. Kapan saja pembaca dapat membuka pemutar **dengarkan chapter** untuk mendengar bagian yang sudah terbuka.

---

## 3. Daftar Requirement

| ID | Nama | Prioritas |
|---|---|---|
| FR-READ-01 | Kerangka baca & bilah atas | P0 |
| FR-READ-02 | Panel pengaturan pembaca | P0 |
| FR-READ-03 | Ukuran huruf yang tersimpan | P0 |
| FR-READ-04 | Tema gelap yang tersimpan | P0 |
| FR-READ-05 | Tampilan saldo koin & format ringkas | P0 |
| FR-READ-06 | Gerbang bab terkunci dengan pratinjau tersensor | P0 |
| FR-READ-07 | Buka bab dengan koin (satuan / bundle / sampai tamat) | P0 |
| FR-READ-08 | Buka bab gratis lewat iklan dengan kuota harian | P0 |
| FR-READ-09 | Buka otomatis per cerita, disetujui sekali di gerbang | P0 |
| FR-READ-10 | Notifikasi toast | P1 |
| FR-READ-11 | Pemutar dengarkan chapter (TTS) | P1 |
| FR-READ-12 | Slot iklan di dalam bacaan | P1 |
| FR-READ-13 | Reaksi & tautan komentar | P2 |
| FR-READ-14 | Navigasi kembali | P1 |
| FR-READ-15 | **[REVISI 5 Sep 2026]** ~~Navigasi bab~~ → **Baca menerus**, tanpa tombol pindah bab | P0 |
| FR-READ-16 | **[BARU]** Simpan & pulihkan posisi baca | P0 |
| FR-READ-17 | **[BARU]** Jalur ke top-up saat saldo kurang | P0 |
| FR-READ-18 | **[BARU]** Layar iklan sebelum bab dibuka | P1 |
| FR-READ-19 | **[V2]** Tawaran bundel setelah sepuluh bab dibuka otomatis | P1 |

---

## 4. Detail Requirement

### FR-READ-01 — Kerangka baca & bilah atas · P0

**Deskripsi.** Bilah atas tetap berisi tombol kembali, judul cerita dengan status bab, saldo koin, dan dua tombol aksi (dengarkan & pengaturan).

**User story.** Sebagai pembaca, saya ingin selalu tahu cerita apa yang saya baca dan berapa koin saya, tanpa harus keluar dari halaman baca.

**Aturan bisnis.**
- Isi bilah atas dari kiri ke kanan: **kembali** → **judul cerita + status bab** → **chip saldo koin** → **tombol dengarkan** → **tombol pengaturan**.
- Judul prototype: `"The CEO's Secret Lover"`, status `"Lanjutan Terkunci"`.
- Isi bab memakai **Georgia serif**, berbeda dari UI di sekitarnya yang memakai Trebuchet MS — pemisahan ini disengaja agar teks cerita terasa seperti buku.
- Ukuran teks bab dikendalikan variabel CSS `--reader-font-size` pada elemen frame, bukan pada tiap paragraf.
- Elemen `.endspace` di akhir halaman memberi ruang gulir agar paragraf terakhir tidak menempel di dasar layar.

**Hook implementasi.** `chapter_read_locked_story_stage.html:650` `#readerPhone`; `:652` `.left`; `:663` `.right`; `.storytitle`, `.chapmeta`, `.endspace`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat bilah atas, **then** judul cerita, status bab, dan saldo koin tampil bersamaan.
- **Given** pembaca menggulir isi bab, **when** halaman bergerak, **then** bilah atas tetap terlihat.
- **Given** pembaca mencapai akhir halaman, **when** gulir berhenti, **then** masih ada ruang kosong di bawah paragraf terakhir.

---

### FR-READ-02 — Panel pengaturan pembaca · P0

**Deskripsi.** Panel yang menampung seluruh pengaturan baca, tersembunyi secara default dan dibuka lewat tombol di bilah atas.

**User story.** Sebagai pembaca, saya ingin mengatur kenyamanan baca dari satu tempat tanpa panel itu mengganggu saat saya sedang membaca.

**Aturan bisnis.**
- Panel `#readerSettings` memakai atribut HTML `hidden` (bukan kelas CSS) sebagai penanda keadaan.
- Berjudul **"Pengaturan Pembaca"**, memuat dua kontrol: **Huruf** (penggeser) dan **tema gelap** (sakelar).
- Sakelar **"buka otomatis"** tidak lagi di sini: sejak revisi 4 September 2026 izinnya diberikan **per cerita** di dalam gerbang bab (FR-READ-09).
- `aria-expanded` pada tombol pemicu selalu sinkron dengan keadaan panel.
- **Perilaku menutup:**
  - Klik tombol pemicu lagi → panel tertutup.
  - Klik di mana pun di dokumen di luar panel → panel tertutup.
  - Klik **di dalam** panel tidak menutupnya (`stopPropagation` pada panel), sehingga mengubah pengaturan aman.
  - Klik tombol pemicu memanggil `stopPropagation` agar tidak langsung tertutup lagi oleh handler dokumen.

**Hook implementasi.** `chapter_read_locked_story_stage.html:988` listener tombol; `:995` listener panel; `:999` listener dokumen; `#readerSettingsBtn`, `#readerSettings`.

**Acceptance criteria.**
- **Given** halaman baru dimuat, **when** pembaca melihat layar, **then** panel pengaturan tersembunyi dan `aria-expanded="false"`.
- **Given** panel tertutup, **when** pembaca menekan tombol pengaturan, **then** panel tampil dan `aria-expanded="true"`.
- **Given** panel terbuka, **when** pembaca menggeser penggeser huruf, **then** panel tetap terbuka.
- **Given** panel terbuka, **when** pembaca mengetuk area teks bab, **then** panel tertutup.

---

### FR-READ-03 — Ukuran huruf yang tersimpan · P0

**Deskripsi.** Penggeser mengatur ukuran teks bab dalam rentang terbatas, berlaku seketika, dan tersimpan permanen.

**User story.** Sebagai pembaca, saya ingin mengatur besar huruf sesuai kenyamanan mata saya, dan tidak perlu mengaturnya ulang setiap membuka bab baru.

**Aturan bisnis.**
- Rentang: **16–22 px**, langkah **1 px**, nilai awal **18 px**.
- Nilai ditampilkan sebagai label (mis. `"18px"`) di samping penggeser.
- **Pengaman rentang:** nilai yang dipakai selalu dijepit `Math.min(22, Math.max(16, Number(fontSize) || 18))`. Nilai rusak, kosong, atau di luar rentang dari penyimpanan tidak akan merusak tampilan — jatuh ke 18 atau ke batas terdekat.
- Diterapkan lewat `--reader-font-size` pada elemen frame.
- Disimpan **setiap kali** penggeser bergerak (event `input`, bukan `change`), sehingga perubahan tersimpan bahkan bila pembaca menutup halaman saat masih menyeret.

**Hook implementasi.** `chapter_read_locked_story_stage.html:970:applySettings()`; `:980:saveSettings()`; `:1009` listener `input`; `#fontSizeRange`, `#fontSizeValue`.

**Acceptance criteria.**
- **Given** pembaca belum pernah mengubah pengaturan, **when** halaman dimuat, **then** ukuran huruf 18px dan label menampilkan "18px".
- **Given** pembaca menggeser ke 22, **when** penggeser bergerak, **then** teks bab langsung membesar dan label menjadi "22px".
- **Given** pembaca menyetel 22px lalu membuka bab lain, **when** halaman dimuat, **then** ukuran 22px tetap berlaku.
- **Given** nilai tersimpan `fontSize: 40`, **when** halaman dimuat, **then** ukuran dijepit menjadi 22px.
- **Given** nilai tersimpan `fontSize: "abc"`, **when** halaman dimuat, **then** ukuran kembali ke 18px tanpa error.

---

### FR-READ-04 — Tema gelap yang tersimpan · P0

**Deskripsi.** Sakelar yang mengubah seluruh palet halaman baca menjadi gelap, tersimpan permanen.

**User story.** Sebagai pembaca yang membaca malam hari, saya ingin tema gelap agar mata tidak silau, dan pilihan itu bertahan.

**Aturan bisnis.**
- Sakelar mengaktifkan kelas `dark` pada elemen frame; seluruh token warna (`--ink`, `--muted`, `--line`, `--paper`, `--paper-2`) ditulis ulang di dalam blok `.phone.dark`.
- Palet gelap: kertas `#161a20` / `#1b2028`, teks `#efe9e6`, muted `#b4adb0`, garis `rgba(238,230,226,.24)`.
- Komponen yang ikut menyesuaikan: bilah atas, tombol ikon, panel pengaturan, bottom sheet, teks bab, indikator titik, dan label chip koin.
- Disimpan pada event `change`.
- Default: **nonaktif** (terang).

**Hook implementasi.** `chapter_read_locked_story_stage.html:1015` listener; `:973` penerapan kelas; `#darkToggle`; blok CSS `.phone.dark` mulai `:54`.

**Acceptance criteria.**
- **Given** tema terang aktif, **when** pembaca menyalakan sakelar tema gelap, **then** latar, teks bab, bilah atas, dan panel pengaturan semuanya berubah gelap.
- **Given** tema gelap aktif, **when** pembaca membuka halaman ini lagi, **then** tema gelap langsung berlaku tanpa kedipan tema terang.
- **Given** tema gelap aktif, **when** pembaca membaca isi bab, **then** kontras teks terhadap latar tetap memadai.

---

### FR-READ-05 — Tampilan saldo koin & format ringkas · P0

**Deskripsi.** Saldo koin ditampilkan di dua tempat — chip di bilah atas dan ringkasan di dalam gerbang terkunci — dalam format singkat yang mudah dibaca, dan selalu diperbarui bersamaan.

**User story.** Sebagai pembaca, saya ingin tahu saldo koin saya saat memutuskan membuka bab, dan melihat saldo terpotong seketika setelah membeli.

**Aturan bisnis.**
- Sumber data: atribut `data-balance` dan `data-bonus` pada elemen saldo (prototype: **15300** dan **23**).
- **Aturan format ringkas (`formatCompactCoin`):**

  | Nilai | Hasil | Contoh |
  |---|---|---|
  | ≥ 1.000.000 | satu desimal + `jt`, `.0` dibuang | `1500000` → `1.5jt`, `2000000` → `2jt` |
  | ≥ 1.000 | satu desimal + `rb`, `.0` dibuang | `15300` → `15.3rb`, `12000` → `12rb` |
  | < 1.000 | angka apa adanya | `800` → `800` |

- **Empat titik tampilan** diperbarui bersamaan setiap saldo berubah: nilai di chip atas, chip bonus (`+23`), nilai di gerbang terkunci (`"15.3rb koin"`), dan bonus di gerbang (`"+23 bonus"`).
- Bonus bersifat **tetap** — tidak ikut berkurang saat bab dibeli.
- Setiap pembacaan elemen dijaga null-check (`if (element)`), sehingga menghapus salah satu tampilan saldo tidak merusak halaman.

**Hook implementasi.** `chapter_read_locked_story_stage.html:1030:formatCompactCoin(value)`; `:1062:renderCoins()`; `#coinBalanceValue`, `#coinBonusChip`, `#lockCoinBalanceValue`, `#lockCoinBonusValue`.

**Acceptance criteria.**
- **Given** saldo 20.000, **when** halaman dimuat, **then** chip atas dan gerbang menampilkan angka yang sama dalam bentuk ringkas.

> **Revisi 5 September 2026 · saldo contoh.** Prototipe memakai **15.300** koin,
> dan angka itu tercetak di mockup `7a`, `7x`, dan `7i`. Ia dinaikkan ke
> **20.000** atas permintaan produk, karena 15.300 habis di bab ke-12 — **dua bab
> sebelum** ambang tawaran bundel di bab ke-10 (17.200 kumulatif), sehingga
> fiturnya tidak pernah bisa dilihat dengan membaca biasa. Dengan 20.000, satu
> sesi baca menerus melewati keduanya: tawaran bundel di bab ke-10, lalu saldo
> habis di bab ke-12 beserta lembar isi koinnya. **Ketiga mockup itu jadi usang
> pada angka saldonya**, dan itu diterima.
- **Given** saldo 12.000, **when** dirender, **then** hasilnya `12rb` (bukan `12.0rb`).
- **Given** saldo 800, **when** dirender, **then** hasilnya `800` tanpa satuan.
- **Given** pembaca membeli bab seharga 1.500, **when** transaksi berhasil, **then** kedua tampilan saldo berubah menjadi `13.8rb` secara bersamaan.
- **Given** saldo berubah, **when** dirender ulang, **then** angka bonus tetap `+23`.

---

### FR-READ-06 — Gerbang bab terkunci dengan pratinjau tersensor · P0

**Deskripsi.** Batas antara bagian gratis dan berbayar ditampilkan sebagai blok khusus: teks di baliknya tetap ada tetapi diburamkan, dengan overlay berisi pilihan pembukaan di atasnya.

**User story.** Sebagai pembaca, saya ingin melihat bahwa cerita masih berlanjut dan seberapa dekat kelanjutannya, agar saya punya alasan kuat untuk membukanya.

**Aturan bisnis.**
- Struktur gerbang, berurutan: **lencana** `"Premium Continuation"` (ikon mahkota) + **label harga awal** `"mulai 1.5rb koin + bonus"` → **panduan** `"Bagian di bawah tersensor. Pilih cara membuka chapter untuk melanjutkan membaca."` → **tumpukan pratinjau** (label `"Pratinjau tersensor"` + teks buram) → **overlay pilihan pembukaan**.
- Pratinjau buram diberi `aria-hidden="true"` sehingga pembaca layar tidak membacakan teks yang belum dibeli.
- Gerbang memakai `aria-label="Locked continuation gate"`.
- Setelah bab dibuka, kelas `is-unlocked` dipasang pada blok: buram hilang, overlay pilihan disembunyikan, dan lencana berubah menjadi **"Chapter Terbuka"** dengan ikon gembok terbuka.
- Ringkasan saldo ditampilkan di dalam gerbang agar pembaca tidak perlu melihat ke bilah atas saat memutuskan.

**Hook implementasi.** `chapter_read_locked_story_stage.html:855` `.locked-block`; `.lock-badge`, `.lock-cost`, `.lock-guidance`, `.lock-preview-stack`, `.censor-label`, `.lock-preview`, `.lock-overlay`.

**Acceptance criteria.**
- **Given** bab belum dibuka, **when** pembaca mencapai gerbang, **then** teks lanjutan tampak buram dengan label "Pratinjau tersensor" dan pilihan pembukaan tampil di atasnya.
- **Given** bab belum dibuka, **when** pembaca layar membaca halaman, **then** isi pratinjau buram tidak dibacakan.
- **Given** bab berhasil dibuka, **when** tampilan diperbarui, **then** buram hilang, pilihan pembukaan menghilang, dan lencana berbunyi "Chapter Terbuka".

---

### FR-READ-07 — Buka bab dengan koin (satuan / bundle / sampai tamat) · P0

**Deskripsi.** Tiga tingkat pembelian berbayar dengan harga dan penghematan yang eksplisit, disusun dari komitmen paling kecil ke paling besar.

**User story.** Sebagai pembaca, saya ingin memilih antara membuka satu bab, sepuluh bab sekaligus, atau seluruh cerita agar bisa menyesuaikan pengeluaran dengan seberapa suka saya pada cerita ini.

**Aturan bisnis.**

| Opsi | Id | Harga | Lencana | Toast keberhasilan |
|---|---|---|---|---|
| Chapter ini | `#optSingle` | **1.500** | — | `Chapter dibuka - -1.5rb koin` |
| 10 chapter | `#optBundle` | **12.000** (`1.2rb/bab`) | **5% Off** | `10 chapter dibuka - -12rb koin` |
| Buka sampai tamat | `#optFull` | **36.900** | **10% Off** | `Semua chapter dibuka - -36.9rb koin` |

- Opsi "Chapter ini" bergaya primer; dua lainnya bergaya sekunder.
- **Alur `unlockChapter(cost, label)`:**
  1. Bila bab sudah terbuka → hentikan, kembalikan `true` (idempoten — menekan dua kali tidak memotong saldo dua kali).
  2. Bila `cost > 0` dan `balance < cost` → toast `"Saldo tidak cukup untuk opsi ini"`, kembalikan `false`, **tidak** ada perubahan apa pun.
  3. Bila `cost > 0` → kurangi saldo dan render ulang seluruh tampilan saldo.
  4. Tandai bab terbuka, pasang `is-unlocked`, ubah lencana, tampilkan toast keberhasilan.
- Harga dan penghematan mengikuti tabel konstanta di [`prd_00_overview.md`](prd_00_overview.md) §6.
- Prototype membuka **blok yang sama** untuk ketiga opsi; produksi harus benar-benar membuka cakupan bab yang berbeda.

**Hook implementasi.** `chapter_read_locked_story_stage.html:1086:unlockChapter(cost, label)`; listener `:1117-1119`; `SINGLE_PRICE` `:1071`.

**Acceptance criteria.**
- **Given** saldo 15.300, **when** pembaca menekan "Chapter ini", **then** saldo menjadi 13.800, bab terbuka, dan toast menyebut `-1.5rb koin`.
- **Given** saldo 15.300, **when** pembaca menekan "Buka sampai tamat" (36.900), **then** muncul toast `"Saldo tidak cukup untuk opsi ini"`, saldo tidak berubah, dan bab tetap terkunci.
- **Given** bab sudah terbuka, **when** pembaca menekan opsi pembelian lain, **then** saldo tidak berkurang lagi.
- **Given** saldo persis 12.000, **when** pembaca menekan "10 chapter", **then** pembelian berhasil dan saldo menjadi 0.
- **Given** pembaca melihat opsi bundle dan sampai tamat, **when** gerbang dirender, **then** lencana penghematan 5% dan 10% tampil.

---

### FR-READ-08 — Buka bab gratis lewat iklan dengan kuota harian · P0

**Deskripsi.** Pembaca dapat membuka satu bab tanpa koin dengan menonton iklan, dibatasi kuota harian yang ditampilkan terus-menerus.

**User story.** Sebagai pembaca yang kehabisan koin, saya ingin tetap bisa melanjutkan cerita dengan menonton iklan, dan tahu berapa kali lagi saya bisa melakukannya hari ini.

**Aturan bisnis.**
- Kuota awal **2**, maksimum **3** per hari (`adQuota` / `adMax`).
- Lencana menampilkan `"<sisa>/<maks> hari ini"` (prototype: `"2/3 hari ini"`) dan diperbarui setiap kali dipakai.
- Menekan opsi saat kuota **> 0**: kurangi kuota → render ulang lencana → `unlockChapter(0, "Chapter dibuka gratis - jatah iklan -1")`. Biaya 0 melewati pemeriksaan saldo, sehingga **selalu berhasil** meski saldo nol.
- Menekan opsi saat kuota **= 0**: tidak terjadi apa-apa (guard `return` di awal handler).
- Saat kuota habis: opsi diberi kelas `is-disabled` dan subteksnya berubah menjadi `"Jatah hari ini habis - reset besok"`.
- **Prototype belum benar-benar memutar iklan** — bab langsung terbuka (lihat §7).

**Hook implementasi.** `chapter_read_locked_story_stage.html:1101` `adQuota`/`adMax`; `:1105:renderAdQuota()`; listener `:1120`; `#adQuotaBadge`, `#optAd`, `#optAdSub`.

**Acceptance criteria.**
- **Given** kuota 2/3, **when** pembaca menekan opsi iklan, **then** bab terbuka gratis, lencana menjadi `1/3 hari ini`, dan saldo koin tidak berubah.
- **Given** saldo koin 0 dan kuota tersisa, **when** pembaca menekan opsi iklan, **then** bab tetap terbuka.
- **Given** kuota mencapai 0, **when** lencana dirender, **then** opsi tampak nonaktif dan subteks berbunyi `"Jatah hari ini habis - reset besok"`.
- **Given** kuota 0, **when** pembaca tetap menekan opsi iklan, **then** tidak terjadi perubahan apa pun.

---

### FR-READ-09 — Buka otomatis per cerita · P0

> **Di `novelova-v2/` inilah alur utamanya, bukan pengecualian.** Ruang baca
> dipecah dua tipe yang berbagi tipografi dan panel pengaturan, dan tidak berbagi
> apa pun lagi: **Type A** untuk bab yang sudah dimiliki — chrome tersembunyi
> sampai teks diketuk; **Type B** untuk bab berbayar — bilah atas selalu terlihat,
> saldo ikut di dalam gerbang, empat pilihan harga berurutan. Rinciannya
> `../architecture.md` §1.21 dan mockup `7u` `7v` `7x`…`7aa`.

> **Direvisi 4 September 2026** atas permintaan produk. Versi sebelumnya
> menjadikan auto-unlock sakelar global di Pengaturan Pembaca yang **default
> mati**; karena tersembunyi, hampir tidak ada pembaca yang menemukannya dan
> setiap bab berbayar tetap memutus alur baca dengan dialog. Mekanismenya tidak
> berubah — yang berubah adalah **siapa yang menyalakannya dan kapan**.

**Deskripsi.** Pembaca menyetujui pembukaan otomatis **sekali per cerita**, di
dalam gerbang bab berbayar pertamanya. Sesudah itu bab-bab berbayar berikutnya di
cerita yang sama terbuka sendiri saat gerbangnya terlihat, sehingga membaca tidak
lagi terputus tiap bab.

**User story.** Sebagai pembaca yang sedang menikmati cerita, saya ingin bab
berikutnya terbuka sendiri agar alur membaca saya tidak terputus — tetapi saya
tetap ingin tahu, sekali di awal, berapa yang akan keluar dan apakah ada pilihan
yang lebih hemat.

**Aturan bisnis.**

- **Gerbang tetap muncul di bab berbayar pertama tiap cerita**, dengan empat
  pilihan lengkap (FR-READ-06/07/08): 1 bab · bundle 10 bab · sampai tamat ·
  tonton iklan.
- Di dalam gerbang itu ada sakelar **"Buka otomatis untuk cerita ini"**, dan ia
  **tercentang secara default**. Pembaca tetap menekan tombol beli secara sadar,
  tetapi cukup sekali.
- Setelah izin diberikan, bab berbayar berikutnya **di cerita yang sama** terbuka
  otomatis. Pemicunya sama seperti sebelumnya:
  1. `IntersectionObserver` pada blok terkunci dengan **ambang 0,35**;
  2. saat izinnya baru diberikan (langsung dievaluasi tanpa menunggu gulir).
- **Empat pengaman** sebelum membuka otomatis: izin cerita ini aktif · bab belum
  terbuka · blok terkunci ada · **saldo ≥ 1.500**.
- Selalu memakai **harga satuan 1.500** — pembukaan otomatis tidak pernah membeli
  bundle atau paket tamat. Justru karena itu gerbang pertama dipertahankan: di
  sanalah bundle dan paket tamat pernah terlihat, dan sepuluh bab satuan
  (15.000) **25% lebih mahal** daripada bundle (12.000).
- **Izin bersifat per cerita, bukan global.** Membuka cerita lain menampilkan
  gerbangnya sendiri.
- **Izin disimpan di server**, bukan di penyimpanan peramban: ia memberi
  wewenang memotong koin, sehingga harus ikut berpindah perangkat dan tidak
  boleh hilang karena data peramban dibersihkan.
- **Fallback:** bila saldo di bawah 1.500, yang muncul adalah **lembar saldo
  kurang** (FR-READ-17) berisi tiga jalan keluar — isi koin, pakai voucher, atau
  tonton iklan bila kuota harian masih ada. Pembaca tidak pernah "terjebak" tanpa
  pilihan, dan tidak pernah dibiarkan diam tanpa penjelasan.
- Toast keberhasilan berbeda dari pembelian manual:
  `"Chapter dibuka otomatis - -1.5rb koin"`.
- `IntersectionObserver` dipakai hanya bila tersedia
  (`"IntersectionObserver" in window`), sehingga peramban lama tetap dapat
  memakai gerbang manual di setiap bab.

**Yang dihapus dari revisi ini.** Sakelar **"buka otomatis"** di panel Pengaturan
Pembaca (FR-READ-04) dihapus; fungsinya digantikan sakelar per cerita, dan dua
sakelar untuk hal yang sama saling membingungkan.

**Alternatif yang ditolak.** Menghapus gerbang sepenuhnya dan membuka setiap bab
otomatis sejak awal. Ia paling mulus, tetapi menghilangkan satu-satunya tempat
bundle, paket tamat, dan iklan gratis pernah terlihat — dan memotong koin tanpa
satu pun ketukan: menggulir cepat melewati lima bab menghabiskan 7.500 koin tanpa
pembaca pernah menyetujui satu pun pembelian.

**Acceptance criteria.**
- **Given** pembaca mencapai bab berbayar pertama sebuah cerita, **when** gerbang
  dirender, **then** empat pilihan tampil beserta sakelar "Buka otomatis untuk
  cerita ini" dalam keadaan tercentang.
- **Given** izin sudah diberikan dan saldo 15.300, **when** pembaca menggulir
  hingga gerbang bab berikutnya terlihat 35%, **then** bab terbuka otomatis,
  saldo menjadi 13.800, dan toast menyebut "otomatis".
- **Given** pembaca **mematikan** sakelar sebelum membeli, **when** ia mencapai
  bab berbayar berikutnya, **then** gerbang tampil lagi seperti biasa.
- **Given** izin aktif untuk cerita A, **when** pembaca membuka bab berbayar
  pertama cerita B, **then** gerbang cerita B tetap tampil.
- **Given** izin aktif dan saldo 1.000, **when** gerbang terlihat, **then** lembar
  saldo kurang tampil dengan tiga jalan keluar — bukan diam, dan bukan pembelian.
- **Given** izin aktif, **when** pembaca berganti perangkat, **then** izinnya
  masih berlaku.
- **Given** peramban tidak mendukung `IntersectionObserver`, **when** halaman
  dimuat, **then** tidak terjadi error dan gerbang manual tetap berfungsi.

---

### FR-READ-10 — Notifikasi toast · P1

**Deskripsi.** Pesan singkat yang muncul sesaat untuk mengonfirmasi pembelian atau memberitahukan kegagalan, tanpa memblokir bacaan.

**User story.** Sebagai pembaca, saya ingin konfirmasi jelas setelah membuka bab atau saat saldo saya kurang, tanpa harus menutup dialog.

**Aturan bisnis.**
- Satu elemen toast dipakai bersama seluruh pesan, memakai `role="status"` dan `aria-live="polite"` agar dibacakan pembaca layar tanpa memotong pembacaan lain.
- Durasi tampil: **2.600 ms**.
- Timer sebelumnya selalu dibatalkan saat toast baru muncul, sehingga pesan berurutan tidak saling memotong durasinya.
- Pesan yang dipakai: empat toast keberhasilan (satuan, bundle, tamat, iklan), satu toast otomatis, dan satu toast kegagalan (`"Saldo tidak cukup untuk opsi ini"`).

**Hook implementasi.** `chapter_read_locked_story_stage.html:1077:showToast(msg)`; `#unlockToast`, `#unlockToastText`.

**Acceptance criteria.**
- **Given** pembelian berhasil, **when** toast muncul, **then** pesan hilang sendiri setelah 2,6 detik.
- **Given** sebuah toast sedang tampil, **when** toast kedua dipicu, **then** pesan diganti dan durasinya dihitung ulang penuh.
- **Given** pembaca memakai pembaca layar, **when** toast muncul, **then** pesan diumumkan secara sopan.

---

### FR-READ-11 — Pemutar dengarkan chapter (TTS) · P1

**Deskripsi.** Pemutar ringkas yang membacakan bab kalimat demi kalimat, hanya untuk bagian yang sudah terbuka, dengan kontrol putar/jeda dan kecepatan.

**User story.** Sebagai pembaca yang sedang tidak bisa menatap layar, saya ingin mendengarkan bab agar tetap dapat mengikuti cerita.

**Aturan bisnis.**

**Sumber kalimat.**
- Diambil **hanya** dari paragraf bab terbuka (`.text p`) — pratinjau tersensor **tidak** ikut, sehingga pembacaan otomatis berhenti sebelum bagian berbayar.
- Setiap paragraf dinormalkan (spasi berturut dijadikan satu) lalu dipecah menjadi kalimat memakai pemisah setelah `.`, `!`, `?`, atau `"`.
- Kalimat kosong dibuang.

**Kontrol.**

| Kontrol | Perilaku |
|---|---|
| Tombol headphone (bilah atas) | Membuka/menutup pemutar; `aria-pressed` disinkronkan; menutup pemutar juga menghentikan pembacaan |
| Putar/Jeda | Saat berhenti → mulai dan tampilkan kalimat pertama seketika (tidak menunggu satu interval); saat berjalan → hentikan |
| Kecepatan | Berputar melalui **1× → 1,25× → 1,5× → 1×**; bila sedang berjalan, interval langsung dihitung ulang tanpa kehilangan posisi |
| Tutup | Menghentikan pembacaan, menyembunyikan pemutar, mengatur `aria-pressed="false"` |

- Interval per kalimat: **2.600 ms ÷ kecepatan** (2.600 · 2.080 · ±1.733 ms).
- Ikon tombol berganti `play` ↔ `pause` bersama `aria-label`-nya.
- Setelah kalimat terakhir: pembacaan berhenti dan teks berubah menjadi `"Selesai membacakan bagian yang tersedia."`.
- Menekan putar setelah selesai **mengulang dari awal** (indeks direset ke 0).
- Teks awal sebelum diputar: `"Ketuk play untuk mulai membacakan."`.
- **Prototype hanya menampilkan indikator kalimat, tanpa audio** — sudah ditandai `ponytail:` di kode (lihat §7).

**Hook implementasi.** `chapter_read_locked_story_stage.html:1157` `readableSentences`; `:1166:ttsStop()`, `:1171:ttsStep()`, `:1180:ttsPlayPause()`; `#ttsBtn`, `#ttsPlayer`, `#ttsPlay`, `#ttsSentence`, `#ttsSpeed`, `#ttsClose`.

**Acceptance criteria.**
- **Given** pemutar tertutup, **when** pembaca menekan tombol headphone, **then** pemutar tampil dan `aria-pressed="true"`.
- **Given** pemutar terbuka dan berhenti, **when** pembaca menekan putar, **then** kalimat pertama langsung tampil tanpa jeda dan ikon berubah menjadi jeda.
- **Given** pembacaan berjalan pada 1×, **when** pembaca menekan tombol kecepatan, **then** label menjadi `1.25x` dan kalimat berganti lebih cepat tanpa mengulang dari awal.
- **Given** kecepatan mencapai 1,5×, **when** tombol ditekan lagi, **then** kembali ke 1×.
- **Given** pembacaan mencapai kalimat terakhir bab terbuka, **when** interval berikutnya jatuh, **then** pembacaan berhenti dan teks berbunyi "Selesai membacakan bagian yang tersedia.".
- **Given** pembacaan sudah selesai, **when** pembaca menekan putar, **then** pembacaan mulai lagi dari kalimat pertama.
- **Given** bab masih terkunci, **when** pembacaan berjalan, **then** isi pratinjau tersensor tidak pernah dibacakan.
- **Given** pembacaan berjalan, **when** pembaca menutup pemutar, **then** pembacaan berhenti sepenuhnya.

---

### FR-READ-12 — Slot iklan di dalam bacaan · P1

**Deskripsi.** Tiga kartu iklan disisipkan pada titik jeda alami dalam bacaan, ditandai jelas sebagai konten bersponsor.

**User story.** Sebagai penyelenggara, saya ingin menayangkan iklan di halaman baca pada titik yang tidak memotong kalimat, agar monetisasi tidak merusak pengalaman membaca.

**Aturan bisnis.**
- Tiga penempatan: **akhir bab pertama**, **tengah bab**, dan **akhir bab**.
- Setiap kartu memuat: label `"Sponsored"`, gambar (`loading="lazy"`, `decoding="async"`), judul, salinan singkat, domain pengiklan, dan tombol ajakan.
- Setiap kartu memakai `aria-label` yang menyebutkan posisi penempatannya.
- Isi prototype: *Bonus Ending Collection* (`novelova-premium.com`), *Daily Coin Booster* (`coin.novelova.app`), *Night Mode Romance Pack* (`offers.novelova.app`).
- Gambar berasal dari `picsum.photos` (lihat §7).

**Hook implementasi.** `chapter_read_locked_story_stage.html:751`, `:808`, `:834` — `.ad-slot`, `.ad-badge`, `.ad-thumb`, `.ad-cta`.

**Acceptance criteria.**
- **Given** pembaca menggulir melewati akhir bab pertama, **when** slot iklan dirender, **then** label "Sponsored" tampil di kartu tersebut.
- **Given** pembaca layar menelusuri halaman, **when** mencapai slot iklan, **then** posisi penempatan diumumkan lewat `aria-label`.
- **Given** halaman dimuat, **when** gambar iklan belum terlihat, **then** gambar belum diunduh (pemuatan malas).

---

### FR-READ-13 — Reaksi & tautan komentar · P2

**Deskripsi.** Baris reaksi di akhir bab berisi tautan ke diskusi dan beberapa penanda reaksi.

**User story.** Sebagai pembaca, saya ingin bereaksi terhadap bab dan melihat pendapat pembaca lain agar terasa membaca bersama-sama.

**Aturan bisnis.**
- Elemen pertama adalah tautan menuju halaman diskusi bab; sisanya penanda reaksi statis.
- Tujuan tautan: `chapter_comments_thread_best_ads.html` — **tidak ada di folder ini** (lihat §7).
- Reaksi belum memiliki handler.

**Hook implementasi.** `chapter_read_locked_story_stage.html:765` — `.rx`.

**Acceptance criteria.**
- **Given** pembaca mencapai akhir bab terbuka, **when** melihat baris reaksi, **then** tautan diskusi dan penanda reaksi tampil.
- **Given** pembaca menekan reaksi *(produksi)*, **when** aksi berhasil, **then** jumlah reaksi bertambah dan keadaan tombol berubah.

---

### FR-READ-14 — Navigasi kembali · P1

**Deskripsi.** Tombol kembali memakai riwayat peramban bila ada, dengan tujuan cadangan ke halaman detail cerita.

**User story.** Sebagai pembaca, saya ingin kembali ke tempat asal saya, dan tetap mendarat di halaman yang masuk akal bila membuka bab lewat tautan langsung.

**Aturan bisnis.**
- Bila `history.length > 1` → `history.back()` dan navigasi tautan dibatalkan.
- Bila tidak → `href="detail_story_alternatif_unified_cover_first.html"`.
- Halaman ini **tidak memiliki navigasi bawah** — disengaja, agar layar baca tidak terganggu.

**Hook implementasi.** `chapter_read_locked_story_stage.html:653`.

**Acceptance criteria.**
- **Given** pembaca tiba dari halaman detail cerita, **when** menekan tombol kembali, **then** browser kembali ke halaman detail tersebut.
- **Given** halaman dibuka langsung tanpa riwayat, **when** pembaca menekan tombol kembali, **then** halaman detail cerita terbuka.
- **Given** pembaca sedang membaca, **when** melihat dasar layar, **then** tidak ada bilah navigasi yang menutupi teks.

---

### FR-READ-15 — ~~Navigasi bab berikutnya & sebelumnya~~ → **Baca menerus** · P0

> **Revisi 5 September 2026 · dicabut dan diganti.** Versi lama menuntut kontrol
> pindah bab di **dua tempat**: tombol besar "Bab berikutnya" beserta judul bab
> tujuan di akhir bab, dan panah sebelumnya/berikutnya di bilah bawah — dengan
> "sebelumnya" dinonaktifkan, bukan disembunyikan, di bab pertama. **Seluruhnya
> dihapus.** Permintaan produk 5 September berbunyi *"proses pergantian chapter
> jangan ada opsi button buka berikutnya"*: tombol lompat mengajarkan pembaca
> bahwa ada batas bab yang perlu dilewati, dan itu persis yang alur ini
> hilangkan. Alasan lengkapnya `architecture.md` §1.25.

**Deskripsi.** Bab mengalir dalam satu gulir vertikal. Tidak ada kontrol pindah bab.

**User story.** Sebagai pembaca, saya ingin terus membaca tanpa pernah berhenti
untuk menekan apa pun, agar cerita terasa satu kesatuan dan bukan potongan.

**Aturan bisnis.**
- **Tidak ada tombol "Bab berikutnya" maupun "Bab sebelumnya"** di mana pun — tidak di akhir bab, tidak di bilah bawah.
- Bab berikutnya dimuat saat pembaca **mendekati** ujung bab sekarang, bukan saat menyentuhnya; menunggu di depan layar kosong adalah jeda yang sama saja dengan tombol.
- Pemisah antar bab **garis rambut polos**: tanpa nomor, tanpa judul, tanpa garis emas. Apa pun yang ditulis di sana akan menghentikan mata.
- Hanya bab **tempat pembaca masuk** yang punya pembuka (label bab, judul serif, garis emas). Sambungannya tidak.
- **Nomor bab tetap ada** di bilah atas dan bilah bawah, dan keduanya mengikuti bab yang sedang terlihat — pembaca tetap punya satu tempat untuk tahu ia sedang di mana.
- URL mengikuti bab yang terlihat lewat `history.replaceState`, **bukan navigasi**: navigasi melepas halaman dan membuang posisi gulirnya. Akibatnya tombol kembali peramban tidak menyusuri tiap bab yang dilewati — dan itu benar, pembaca tidak "pergi ke" bab berikutnya.
- Bab tetap dimuat lewat parameter `chapter_id` sehingga setiap bab punya URL sendiri dan dapat dibagikan — ia **titik masuk**, bukan halaman terpisah.
- **Jumlah bab yang tersambung dibatasi**; yang terlama dilepas dari depan. Cerita 120 bab yang seluruhnya disambung akan menghabiskan memori dan membuat gulirnya tersendat.
- Ujung cerita punya keadaan penutupnya sendiri — gulir yang berhenti tanpa kabar terbaca sebagai gagal memuat, bukan sebagai habis.
- Pengaturan baca (ukuran huruf, tema) berlaku untuk seluruh rantai, dan izin buka otomatis cerita ini tetap berlaku (FR-READ-09).
- **Gerbang bab terkunci adalah dinding**: selama izin belum diberikan, tidak ada bab berikutnya yang dimuat. Tanpa aturan ini pembaca mendapat tumpukan gerbang, satu per bab.

**Acceptance criteria.**
- **Given** pembaca membuka sebuah bab, **when** halaman dirender, **then** tidak ada tombol "Bab berikutnya" maupun "Bab sebelumnya" di mana pun.
- **Given** pembaca menggulir sampai ujung bab, **when** ia terus menggulir, **then** bab berikutnya sudah tersambung di bawahnya tanpa satu pun ketukan.
- **Given** dua bab tersambung, **when** halaman diperiksa, **then** hanya ada satu pembuka bab, dan pemisahnya garis rambut tanpa teks.
- **Given** pembaca melewati batas bab, **when** URL diperiksa, **then** ia menunjuk bab yang sedang terlihat, dan posisi gulirnya tidak berubah.
- **Given** rantai mencapai bab terkunci yang izinnya belum diberikan, **when** pembaca terus menggulir, **then** hanya **satu** gerbang tampil dan tidak ada bab berikutnya yang dimuat.
- **Given** pembaca sampai di bab terakhir yang terbit, **when** gulir mencapai ujungnya, **then** keadaan penutup cerita tampil.

---

### FR-READ-16 — Simpan & pulihkan posisi baca · P0

**Status: BARU.** Belum ada di prototype — inilah sebab "Continue Reading" di beranda dan batang progres di perpustakaan tidak punya sumber data.

**Deskripsi.** Reader mencatat sampai mana pembaca membaca, lalu memulihkannya saat pembaca kembali.

**User story.** Sebagai pembaca, saya ingin kembali persis ke tempat saya berhenti, agar tidak perlu mencari-cari bagian terakhir yang saya baca.

**Aturan bisnis.**
- **Dua tingkat presisi:**
  - **Bab terakhir** yang dibuka pada sebuah cerita — dipakai oleh tombol "Lanjut Baca" di perpustakaan (lihat [`prd_06_library.md`](prd_06_library.md) FR-LIB-07) dan section "Continue Reading" di beranda (FR-HOME-04).
  - **Posisi gulir dalam bab**, disimpan sebagai persentase agar tetap benar meski ukuran huruf berubah, dan **per bab** — lihat catatan revisi di bawah.

> **Revisi 5 September 2026 · posisi per bab.** Versi lama menyimpan **satu**
> posisi gulir per cerita, yaitu posisi bab yang terakhir dibaca. Akibatnya
> kembali ke bab yang lebih awal selalu mulai dari atas — dan bagi pembaca itu
> tidak bisa dibedakan dari kehilangan tempat. Sekarang posisinya disimpan per
> bab; posisi bab terakhir tetap disimpan terpisah karena ia yang dipakai
> "Lanjut Baca". `architecture.md` §1.24.
- Progres dikirim ke server dengan penundaan (*throttle*) **maksimal sekali per 10 detik** dan sekali lagi saat halaman ditinggalkan, agar tidak membanjiri jaringan.
- Bab dianggap **selesai dibaca** saat pembaca mencapai ≥90% isinya — angka inilah yang mengisi persentase progres cerita (`"Bab 45 dari 120 — 38%"`).
- Saat membuka bab yang pernah dibaca sebagian, tampilkan tawaran **"Lanjutkan dari posisi terakhir"**, bukan langsung melompat — pembaca yang ingin mengulang dari awal tidak dipaksa.
- Progres tersimpan **per akun, bukan per perangkat**, sehingga berpindah perangkat tetap melanjutkan.
- Progres juga menjadi syarat kelayakan memberi rating (lihat [`prd_12_social.md`](prd_12_social.md) FR-SOCIAL-01) dan sumber rekap "Chapter 17" di profil (FR-PROF-02).

**Acceptance criteria.**
- **Given** pembaca membaca separuh bab lalu menutup halaman, **when** membuka bab itu lagi, **then** tawaran melanjutkan dari posisi terakhir tampil.
- **Given** pembaca memilih melanjutkan, **when** halaman dirender, **then** posisi gulir dipulihkan ke tempat terakhir.
- **Given** pembaca mengubah ukuran huruf lalu kembali, **when** posisi dipulihkan, **then** posisi tetap pada bagian teks yang sama, bukan pada piksel yang sama.
- **Given** pembaca mencapai 90% isi bab, **when** progres dikirim, **then** bab tercatat selesai dan persentase cerita bertambah.
- **Given** pembaca membaca di ponsel lalu membuka di perangkat lain, **when** perpustakaan dirender, **then** progres yang sama tampil.
- **Given** pembaca menggulir terus-menerus selama satu menit, **when** progres dikirim, **then** paling banyak enam permintaan terkirim.

---

### FR-READ-17 — Jalur ke top-up saat saldo kurang · P0

**Status: BARU.** Saat ini `unlockChapter` hanya menampilkan toast `"Saldo tidak cukup untuk opsi ini"` lalu berhenti — titik konversi paling penting di aplikasi berakhir buntu.

**Deskripsi.** Ketika saldo tidak mencukupi, pembaca ditawari mengisi koin dan **dikembalikan ke bab yang sama** setelah pembayaran berhasil.

**User story.** Sebagai pembaca yang kehabisan koin di tengah cerita, saya ingin langsung mengisi koin dan melanjutkan bab yang sama, tanpa kehilangan tempat saya.

**Aturan bisnis.**
- Kegagalan karena saldo kurang **tidak lagi berupa toast**, melainkan lembar yang memuat: kekurangan koin yang tepat (`"Kurang 1.200 koin"`) · saldo saat ini · **tiga jalan keluar** — tombol **"Isi koin"**, opsi **memakai voucher**, dan tombol menonton iklan bila kuota harian masih ada (FR-READ-08).
- Opsi voucher ditambahkan pada revisi 4 September 2026: sebelumnya voucher hanya dapat dipakai dari halaman detail cerita, sehingga pembaca yang kehabisan koin di tengah bab tidak punya cara memakainya tanpa keluar dari bacaannya.
- Tombol "Isi koin" menuju `topup_koin.html` dengan membawa **konteks kembali**: `chapter_id` bab yang ingin dibuka dan jumlah koin yang kurang.
- `topup_koin` memakai konteks itu untuk **menyarankan paket terkecil yang mencukupi** (lihat [`prd_09_wallet_rewards.md`](prd_09_wallet_rewards.md) FR-WALLET-18).
- Setelah pembayaran berhasil, tombol utama pada layar sukses berbunyi **"Lanjutkan membaca"** dan kembali ke bab tersebut — bukan ke beranda.
- Bila pembaca membatalkan top-up, ia kembali ke bab yang sama dengan gerbang unlock masih terbuka.
- Lembar ini menghormati izin buka otomatis: bila izinnya aktif tetapi saldo kurang, lembar inilah yang muncul — bukan diam, dan bukan pembelian (FR-READ-09).

**Acceptance criteria.**
- **Given** saldo 300 dan harga bab 1.500, **when** pembaca menekan "Chapter ini", **then** lembar saldo kurang tampil menyebut kekurangan 1.200 koin.
- **Given** lembar saldo kurang tampil dan kuota iklan masih ada, **when** lembar dirender, **then** opsi menonton iklan ikut ditawarkan.
- **Given** pembaca menekan "Isi koin", **when** `topup_koin` terbuka, **then** paket terkecil yang mencukupi sudah disarankan.
- **Given** pembayaran berhasil, **when** layar sukses dirender, **then** tombol utama berbunyi "Lanjutkan membaca" dan mengembalikan pembaca ke bab tersebut.
- **Given** pembaca membatalkan top-up, **when** kembali ke reader, **then** gerbang unlock bab yang sama masih terbuka.
- **Given** izin buka otomatis aktif dan saldo kurang, **when** gerbang terlihat, **then** lembar saldo kurang tampil dengan tiga jalan keluar, bukan diam tanpa penjelasan.

---

### FR-READ-18 — Layar iklan sebelum bab dibuka · P1

**Status: BARU.** Saat ini menekan opsi iklan langsung membuka bab tanpa menayangkan apa pun — nilai tukarnya nol.

**Deskripsi.** Iklan benar-benar ditayangkan sebelum bab dibuka, dengan aturan yang jelas soal batal dan gagal.

**User story.** Sebagai pembaca tanpa koin, saya ingin menukar waktu saya dengan satu bab — dan sebagai penyelenggara, saya ingin pertukaran itu benar-benar terjadi.

**Aturan bisnis.**
- Menekan opsi iklan membuka **layar iklan** dengan hitung mundur; bab dibuka **hanya setelah** tayangan selesai.
- **Kuota dipotong setelah tayangan selesai**, bukan saat tombol ditekan — berbeda dari perilaku sekarang.
- Membatalkan di tengah tayangan: bab **tidak** dibuka dan kuota **tidak** berkurang.
- Iklan gagal dimuat: bab tidak dibuka, kuota tidak berkurang, dan pembaca diberi pesan beserta tawaran mencoba lagi atau memakai koin.
- Kuota harian dicatat **per akun per tanggal di server**, sehingga menyegarkan halaman tidak mengembalikan kuota (menutup celah pada §7 no. 2).
- Batas kuota tetap **3 per hari** (lihat [`prd_00_overview.md`](prd_00_overview.md) §6).

**Acceptance criteria.**
- **Given** pembaca menekan opsi iklan, **when** layar iklan tampil, **then** bab belum terbuka sampai tayangan selesai.
- **Given** tayangan iklan selesai, **when** layar tertutup, **then** bab terbuka dan kuota berkurang satu.
- **Given** pembaca membatalkan di tengah tayangan, **when** layar tertutup, **then** bab tetap terkunci dan kuota tidak berkurang.
- **Given** iklan gagal dimuat, **when** pesan tampil, **then** kuota tidak berkurang dan pembaca ditawari mencoba lagi.
- **Given** pembaca memakai satu kuota lalu menyegarkan halaman, **when** gerbang dirender, **then** kuota tetap berkurang.

---

---

### FR-READ-19 — Tawaran bundel setelah sepuluh bab dibuka otomatis · P1 · **[V2]**

> **Baru di `novelova-v2/`**, permintaan produk 4 September 2026. Alasan dan
> keputusan rancangannya di [`../architecture.md`](../architecture.md) §1.21.

**Deskripsi.** Setelah pembaca membuka **sepuluh bab** secara otomatis di satu
cerita, muncul satu tawaran membeli bundel — sekali, tanpa menghentikan bacaan.

**User story.** Sebagai pembaca yang sudah jelas mengikuti sebuah cerita, saya
ingin ditawari harga yang lebih baik ketika kebiasaan membaca saya sudah
membuktikan bahwa saya akan melanjutkan — bukan ditanya di bab pertama, saat saya
sendiri belum tahu.

**Aturan bisnis.**

- **Ambangnya sepuluh, dan dapat diatur.** Angkanya milik konfigurasi server
  (`SERVER_CONFIG.bundleOfferAfter`), bukan konstanta klien: ia tuas kebijakan,
  dan mengubahnya tidak boleh menuntut rilis baru.
- Yang dihitung adalah **pembukaan otomatis di cerita ini**, disimpan server
  (`readerPrefs.autoUnlockCounts`). Penghitungnya **tidak naik** bila kunci
  idempotency dipakai ulang — pengulangan tidak memotong koin, jadi ia juga tidak
  boleh mendekatkan pembaca ke tawaran belanja.
- **Bentuknya pita non-blocking di pembuka bab**, bukan lembar dan bukan dialog.
  FR-READ-09 menjanjikan bacaan yang tidak terputus; tawaran yang menghentikan
  gulir membatalkan janji itu tepat di tempat yang paling terasa.
- **Angka hematnya dihitung dari harga bab sungguhan** (`UnlockOption.individualCoins`),
  tidak pernah persentase tetap. Harga bab berbeda-beda per bab, jadi persentase
  yang dicetak akan meleset dan yang menanggung selisihnya pembaca.
- **Muncul sekali per cerita.** Ditolak berarti tidak muncul lagi di cerita itu;
  keputusannya disimpan server supaya "sekali" tetap sekali di perangkat lain.
- **Menerimanya adalah pembelian eksplisit.** FR-READ-09 tidak berubah:
  pembukaan otomatis tidak pernah membeli bundel atau paket tamat sendiri.
- Setelah bundel dibeli, sepuluh bab berikutnya sudah dimiliki, sehingga
  pengaman "bab belum terbuka" membuat pembukaan otomatis melewatinya tanpa
  potongan tambahan. **Tidak ada saldo bundel yang perlu disimpan.**

**Acceptance criteria.**

- **Given** pembaca sudah membuka sembilan bab otomatis, **when** pembuka bab
  berikutnya dirender, **then** tidak ada pita tawaran.
- **Given** pembukaan otomatis kesepuluh baru saja berhasil, **when** pembaca
  masuk ke bab berikutnya, **then** pita tawaran tampil beserta harga bundel dan
  penghematannya, **dan** bacaan tidak terhenti.
- **Given** pita ditolak, **when** pembaca terus membaca cerita yang sama,
  **then** pita tidak muncul lagi.
- **Given** pembaca membuka cerita lain, **when** ia mulai membuka bab otomatis,
  **then** penghitungnya mulai dari nol.
- **Given** pembaca menerima tawaran, **when** sepuluh bab berikutnya dibuka,
  **then** saldo berkurang **tepat satu kali** sebesar harga bundel.

**Catatan keterjangkauan.** Dengan harga bab dan saldo contoh yang berlaku
sekarang, pembaca contoh kehabisan koin **dua bab sebelum ambang ini**.
Perhitungannya di `../architecture.md` §1.21; sebuah sakelar dev disediakan
supaya layarnya tetap bisa diperiksa.

## 5. State & Persistensi

### 5.1 Tersimpan permanen

**Kunci:** `localStorage['novelova-reader-settings-v1']`

```json
{ "fontSize": 18, "darkTheme": false }
```

| Perilaku | Aturan |
|---|---|
| Nilai awal | `{ fontSize: 18, darkTheme: false }` |
| Izin buka otomatis | **Tidak di sini.** Disimpan di server per cerita (FR-READ-09) — ia memberi wewenang memotong koin, jadi tidak boleh hilang karena data peramban dibersihkan |
| Pemuatan | Hasil parse **digabung di atas default**, sehingga kunci baru tetap punya nilai |
| JSON rusak | `catch` → kembali ke default, tanpa error terlihat |
| Penulisan gagal (mis. mode privat / kuota penuh) | `catch` kosong — aplikasi tetap berjalan, pengaturan hanya tidak tersimpan |
| Waktu simpan | Setiap perubahan penggeser (`input`) dan setiap perubahan sakelar (`change`) |

### 5.2 Hanya di memori (hilang saat dimuat ulang)

| State | Nilai awal | Konsekuensi |
|---|---|---|
| Saldo koin (`balance`) | 15.300 | Saldo kembali ke 15.300 setelah dimuat ulang |
| Status bab terbuka (`chapterUnlocked`) | `false` | **Bab yang sudah dibeli kembali terkunci** |
| Kuota iklan (`adQuota`) | 2 | Kuota kembali penuh setelah dimuat ulang |
| Posisi & kecepatan TTS | 0, 1× | — |

### 5.3 Wajib pindah ke server (FR baru)

| State | FR | Alasan |
|---|---|---|
| Saldo koin | FR-READ-17, FR-WALLET-17 | Satu dompet untuk seluruh aplikasi |
| Kepemilikan bab (status terbuka) | FR-READ-17 | Pembelian harus bertahan |
| Kuota iklan harian | FR-READ-18 | Mencegah reset dengan menyegarkan halaman |
| Posisi baca & bab terakhir | FR-READ-16 | Sumber data "Continue Reading" dan progres perpustakaan |

Pengaturan baca (`novelova-reader-settings-v1`) tetap boleh di perangkat — itu preferensi tampilan, bukan kepemilikan.

---

## 6. Navigasi

**Masuk ke modul:** `detail_story_alternatif_unified_cover_first.html` (bab gratis, bab terkunci, dan tombol "Lanjut Membaca" setelah voucher). Halaman `my_library`, `manage_chapters`, dan `rewards_center` **seharusnya** juga masuk ke sini, tetapi masih menunjuk `chapter_read_unlocked.html` yang tidak ada.

**Keluar dari modul:** `detail_story_alternatif_unified_cover_first.html` (kembali) · `chapter_comments_thread_best_ads.html` *(menggantung)*.

---

## 7. Catatan Prototype vs Produksi

| # | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | **Saldo dan status bab tidak persisten** — dimuat ulang mengembalikan saldo ke 15.300 dan mengunci bab lagi | Pembelian tidak nyata; tidak bisa diuji sebagai alur ekonomi | Simpan dompet dan kepemilikan bab di server; muat saat halaman dibuka |
| 2 | **Kuota iklan ulang tiap muat**, tidak ada penanda tanggal | Kuota harian dapat dilewati dengan menyegarkan halaman | Simpan kuota per akun per tanggal di server |
| 3 | **Iklan tidak benar-benar diputar** — menekan opsi langsung membuka bab | Nilai tukar "tonton iklan" belum ada | Integrasikan SDK iklan; buka bab hanya setelah callback selesai tayang |
| 4 | **Ketiga opsi berbayar membuka blok yang sama** | Perbedaan bundle vs satuan vs tamat belum terasa | Kirim cakupan pembelian ke server dan buka bab sesuai cakupannya |
| 5 | **TTS hanya indikator kalimat, tanpa audio** — sudah ditandai `ponytail:` | Fitur belum bermanfaat bagi tujuan aslinya | Gunakan Web Speech API (`speechSynthesis`) dengan pemilihan suara Bahasa Indonesia |
| 6 | **Tautan komentar menggantung** (`chapter_comments_thread_best_ads.html`) | Menuju 404 | Buat halaman diskusi bab atau hapus tautan |
| 7 | **Tidak ada navigasi bab berikutnya/sebelumnya** | Pembaca harus kembali ke daftar bab tiap ganti bab | Tambahkan navigasi bab di akhir halaman |
| 8 | **Posisi baca tidak disimpan** | Pembaca kehilangan tempat terakhir | Simpan progres baca dan pulihkan saat kembali |
| 9 | **Isi bab hardcoded**, satu bab saja | Tidak mencerminkan data nyata | Muat lewat `chapter_id` (lihat `../../docs/api_chapter_read.md`) |
| 10 | **Gambar iklan dari `picsum.photos`, ikon dari FontAwesome CDN 6.5.2** | Gagal saat offline; versi FontAwesome berbeda dari `login`/`register` (6.5.1) | Self-host dan seragamkan versi |
| 11 | Isi bab berbahasa Inggris sedangkan seluruh UI berbahasa Indonesia | Bahasa campur | Sesuaikan dengan konten nyata dan pengaturan bahasa |
| 12 | Harga bab di halaman detail (`1.5rb`, `1.8rb`) berbeda-beda, tetapi reader selalu memakai 1.500 | Harga yang ditampilkan bisa tidak cocok dengan yang ditagih | Ambil harga per bab dari server, bukan konstanta |
