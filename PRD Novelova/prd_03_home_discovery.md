# PRD Novelova — Modul Beranda & Discovery

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya tetap; **anatomi layarnya** mengikuti mockup `7a` dan `7s`.
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Halaman: `home_tabs.html` · `see_all_popular.html` · `see_all_new_trending.html` · `see_all_editors_picks.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_home_tabs.md`, `../../docs/api_see_all.md`


> ### Anatomi v2 — mockup `7a` dan `7s`
>
> Kesembilan blok dan urutannya **tidak berubah**. Yang berubah bentuknya:
> banner jadi kartu garis rambut dengan sampul 66×88 di kiri (bukan gambar penuh
> berscrim) · tab genre jadi tab teks bergaris bawah 2px (bukan pil) · kepala
> section jadi label 9,5px huruf besar + garis 1px + `See all` emas · kartu
> membawa `★ rating` dan jumlah baca (bukan lencana genre) · Baru & Naik Cepat
> menambah garis pertumbuhan emas dari `weeklyReads` · Editor's Picks membawa
> kutipan serif per cerita · section tematik jadi daftar tegak bernomor · Lanjut
> Membaca jadi daftar dengan batang progres, persentase, dan tombol putar · slot
> iklan jadi pita garis rambut · FAB koin jadi lingkaran 48px di **kiri** bawah.
>
> Lembar pengaturan section (`7s`) tetap sembilan baris, dan **kesembilannya tetap
> terdaftar** walau section-nya sedang disembunyikan karena kosong.
>
> ### Revisi 6 September 2026 · lima kalimat di atas sudah dilewati R2b
>
> Blok ini merekam putaran 7 apa adanya. Permintaan produk 5 September mengubah
> lima hal yang disebutnya, dan koreksinya baru masuk ke §2.1 dan FR-HOME-04 —
> bukan ke sini, sehingga blok pembuka berkas ini **membantah isi berkasnya
> sendiri** selama satu putaran:
>
> | Yang tertulis di atas | Yang berlaku |
> |---|---|
> | "**urutannya tidak berubah**" | tiga section prioritas naik ke paling atas, tab genre turun ke bawah banner (§2.1). Kesembilan **bloknya** memang tetap sembilan |
> | kartu membawa `★ rating` dan jumlah baca | kartu beranda tinggal **sampul + judul**; nama pena, rating, dan jumlah baca pindah ke lapisan zoom sampul (FR-HOME-04) |
> | Baru & Naik Cepat bergaris pertumbuhan emas | dicabut bersama bentuk kartu lebarnya |
> | Editor's Picks membawa kutipan serif per cerita | dicabut bersama bentuk rel 160px |
> | section tematik jadi daftar tegak bernomor | rel mendatar sampul 80px seperti section genre lain; nomor tinggal di Populer dan Paling Banyak Dibuka |
>
> Yang **tetap benar** dari daftar di atas: bentuk banner, tab teks bergaris bawah
> 2px, anatomi kepala section, Lanjut Membaca sebagai daftar berbatang progres,
> pita iklan garis rambut, FAB 48px di kiri bawah, dan sembilan baris lembar
> pengaturan. `architecture.md` §1.22.
---

## 1. Ringkasan Modul

Beranda adalah layar pertama setelah masuk dan pusat penemuan cerita. Isinya sembilan blok yang dapat ditampilkan atau disembunyikan pengguna, dan preferensi itu **tersimpan permanen**. Dari beranda, setiap kartu cerita menuju halaman detail, dan setiap section punya halaman "lihat semua" dengan filter, urutan, dan chip periode.

| Aspek | Nilai |
|---|---|
| **Aktor** | Pembaca |
| **Halaman** | `home_tabs.html` (1.342 baris), `see_all_popular.html` (29), `see_all_new_trending.html` (23), `see_all_editors_picks.html` (23) |
| **Prasyarat** | Pengguna sudah masuk (FR-AUTH-01/05) |
| **State persisten** | `localStorage['home_section_visibility_v1']` |
| **Sub-sistem desain** | Restyled rose-gold; backdrop halaman seragam di keempat halaman, tetapi trio "lihat semua" masih memakai aksen berbeda per kategori |

---

## 2. Flow

### 2.1 Discovery di beranda

1. Pengguna mendarat di `home_tabs.html`.
2. Aplikasi membaca preferensi visibilitas section dari `localStorage` dan menerapkannya **sebelum** pengguna berinteraksi.
3. Pengguna menggulir melewati blok: **Popular → New & Trending → Editor's Picks → Banner → Genre → section tematik → Iklan → Continue Reading**.

> **Revisi 5 September 2026 · susunan beranda.** Versi lama menaruh Banner dan
> Genre paling atas, lalu tiga section utama. Sejak permintaan produk 5
> September, **tiga section prioritas naik ke paling atas** dan tab genre turun
> ke bawah banner. Konsekuensinya ketiganya **berhenti tersaring tab** — kontrol
> yang mengubah isi di luar layar terbaca sebagai kontrol yang rusak. Kedua slot
> iklan juga pindah ke bawah tab genre. `architecture.md` §1.22, yang menimpa
> sebagian §1.6.
4. Percabangan:
   - Ketuk kartu/banner/baris cerita → `detail_story_alternatif_unified_cover_first.html`.
   - Ketuk "See all" pada Popular / New & Trending / Editor's Picks → halaman lihat-semua terkait.
   - Ketuk "See all" pada Continue Reading → `my_library.html`.
   - Ketuk FAB koin → `topup_koin.html`.
   - Ketuk tab bawah → halaman tab terkait.

### 2.2 Personalisasi section

1. Ketuk ikon slider di header (setelah ikon notifikasi) → popover terbuka.
2. Popover menampilkan 9 baris, tiap baris berisi nama section, penjelasan singkat, dan sebuah switch.
3. Ketuk switch → section langsung disembunyikan/ditampilkan **dan** preferensi disimpan seketika.
4. Popover tertutup bila: ikon ditekan lagi, pengguna mengetuk di luar popover, atau konten digulir.

### 2.3 Lihat semua

1. Dari section beranda → halaman lihat-semua.
2. Halaman menampilkan judul kategori, jumlah cerita, kontrol urutan + filter, chip periode, dua dropdown penyaring, lalu daftar kartu cerita.
3. Ketuk kartu → detail cerita. Ketuk tombol kembali → `home_tabs.html`.

---

## 3. Daftar Requirement

| ID | Nama | Halaman | Prioritas |
|---|---|---|---|
| FR-HOME-01 | Header sapaan & aksi cepat | `home_tabs` | P1 |
| FR-HOME-02 | Banner carousel unggulan | `home_tabs` | P0 |
| FR-HOME-03 | Tab genre dengan fade tepi | `home_tabs` | P1 |
| FR-HOME-04 | Section discovery cerita | `home_tabs` | P0 |
| FR-HOME-05 | Slot iklan dalam feed | `home_tabs` | P1 |
| FR-HOME-06 | Personalisasi tampil/sembunyi section (tersimpan) | `home_tabs` | P0 |
| FR-HOME-07 | Routing kartu cerita ke detail | `home_tabs`, see_all | P0 |
| FR-HOME-08 | Tombol pintas top-up (FAB) | `home_tabs` | P1 |
| FR-HOME-09 | Navigasi bawah lima tab | `home_tabs` | P0 |
| FR-HOME-10 | Halaman lihat-semua per kategori | see_all ×3 | P0 |
| FR-HOME-11 | Urutkan, saring, dan chip periode | see_all ×3 | P1 |
| FR-HOME-12 | Skeleton pemuatan & keadaan kosong | see_all ×3 | P2 |
| FR-HOME-13 | **[BARU]** Tab genre benar-benar menyaring | `home_tabs` | P0 |
| FR-HOME-14 | **[BARU]** Kontrol lihat-semua berfungsi | see_all ×3 | P0 |
| FR-HOME-15 | **[BARU]** Lihat-semua untuk Top Romance | `home_tabs` | P1 |
| FR-HOME-16 | **[BARU]** Beranda pengguna baru | `home_tabs` | P1 |

---

## 4. Detail Requirement

### FR-HOME-01 — Header sapaan & aksi cepat · P1

**Deskripsi.** Baris teratas berisi sapaan personal beserta subjudul, dan tiga ikon aksi di kanan: Cari, Notifikasi, dan Pengaturan Section.

**User story.** Sebagai pembaca, saya ingin melihat sapaan personal dan pintasan pencarian/notifikasi agar beranda terasa milik saya dan aksi penting mudah dijangkau.

**Aturan bisnis.**
- Sapaan: `"Hi, <nama>"` (prototype: "Hi, Anna"); subjudul `"Enjoy your reading today ✨"`.
- Urutan ikon **wajib**: Cari → Notifikasi → Pengaturan Section. Ikon pengaturan sengaja diletakkan **setelah** notifikasi.
- Ikon Cari dan Notifikasi belum memiliki handler pada prototype (lihat §7).
- Seluruh ikon berupa SVG inline `stroke="currentColor"` sehingga mengikuti warna tema.

**Hook implementasi.** `home_tabs.html:721` — `.header`, `.icon-row#iconRow`, `#sectionSettingsBtn`.

**Acceptance criteria.**
- **Given** beranda dimuat, **when** pengguna melihat header, **then** sapaan dan tiga ikon tampil dengan urutan Cari–Notifikasi–Pengaturan.
- **Given** pengguna menekan ikon pengaturan, **when** aksi dijalankan, **then** popover section terbuka (FR-HOME-06).

---

### FR-HOME-02 — Banner carousel unggulan · P0

**Deskripsi.** Carousel horizontal berisi tiga banner cerita unggulan. Tiap banner menampilkan cover, judul, keterangan, dan tombol ajakan membaca.

**User story.** Sebagai pembaca, saya ingin melihat cerita unggulan yang menonjol di bagian atas agar langsung punya pilihan bacaan tanpa mencari.

**Aturan bisnis.**
- Tiga banner pada prototype: **Rosebound Promise** (`New episodes available • Romance / Drama`), **Crimson Letters** (`Trending now • Mystery / Drama`), **A Winter Pact** (`New release • CEO / Romance`).
- Seluruh area banner dapat diketuk (FR-HOME-07), termasuk tombol "Read now".
- Tombol "Read now" memanggil `preventDefault()` **dan** `stopPropagation()` agar tidak memicu handler banner dua kali.
- Section id `sec-banner`, dapat disembunyikan lewat FR-HOME-06.
- `aria-label="Featured banners"` pada wadah carousel.

**Hook implementasi.** `home_tabs.html:838` — `.hero-carousel#sec-banner`, `.hero`, `.hero .cta`; handler di `home_tabs.html:1205`.

**Acceptance criteria.**
- **Given** beranda dimuat dan section banner aktif, **when** pengguna melihat bagian atas, **then** tiga banner tersedia untuk digulir horizontal.
- **Given** pengguna menekan tombol "Read now" pada sebuah banner, **when** aksi dijalankan, **then** halaman berpindah ke detail cerita **satu kali** (tanpa navigasi ganda).
- **Given** pengguna menekan area banner di luar tombol, **when** aksi dijalankan, **then** halaman berpindah ke detail cerita.

---

### FR-HOME-03 — Tab genre dengan fade tepi · P1

**Deskripsi.** Deretan tab genre yang dapat digulir horizontal, masing-masing dengan ikon SVG. Tepi kiri/kanan diberi gradien memudar **hanya** saat deret benar-benar bisa digulir, sebagai petunjuk masih ada isi di luar layar.

**User story.** Sebagai pembaca, saya ingin menyaring beranda menurut genre favorit dan melihat dengan jelas bahwa masih ada genre lain di samping.

**Aturan bisnis.**
- Tujuh genre: **Romance** (aktif secara default), **My Kisah**, **Fantasy**, **Mystery**, **Drama**, **CEO**, **Thriller**.
- Ketuk tab → tab lain kehilangan kelas `active`, tab yang diketuk mendapatkannya. Satu tab aktif pada satu waktu.
- Logika fade (`updateTabFade`):
  - `maxScroll = scrollWidth − clientWidth`; bila `maxScroll ≤ 1`, kedua kelas fade dilepas (tidak ada isi tersembunyi).
  - `fade-left` aktif bila `scrollLeft > 1`.
  - `fade-right` aktif bila `scrollLeft < maxScroll − 1`.
- Dipanggil saat inisialisasi, saat `scroll` (listener `passive`), dan saat `resize` (dibungkus `requestAnimationFrame`).
- Pemilihan genre **belum** menyaring isi section (lihat §7).
- Section id `sec-genres`.

**Hook implementasi.** `home_tabs.html:1326:updateTabFade()`; `.tab-bar#sec-genres`, `.tab`, kelas `fade-left` / `fade-right`.

**Acceptance criteria.**
- **Given** beranda dimuat dan deret genre lebih lebar dari layar, **when** posisi gulir di paling kiri, **then** hanya `fade-right` yang aktif.
- **Given** pengguna menggulir deret genre ke ujung kanan, **when** gulir berhenti, **then** hanya `fade-left` yang aktif.
- **Given** seluruh genre muat tanpa gulir, **when** halaman dirender, **then** tidak ada kelas fade yang aktif.
- **Given** pengguna menekan tab "Fantasy", **when** aksi dijalankan, **then** "Fantasy" menjadi satu-satunya tab dengan kelas `active`.
- **Given** ukuran jendela berubah, **when** `resize` terjadi, **then** status fade dihitung ulang.

---

### FR-HOME-04 — Section discovery cerita · P0

**Deskripsi.** Lima section berisi kurasi cerita dengan tata letak berbeda sesuai perannya, masing-masing berjudul dan memiliki tautan lihat-semua.

**User story.** Sebagai pembaca, saya ingin menemukan cerita lewat beberapa sudut pandang berbeda (populer, baru, pilihan editor, genre favorit, lanjutan bacaan) agar selalu ada alasan membuka beranda.

**Aturan bisnis.**

| Section | Id | Tata letak | Tersaring tab? | Tautan lihat-semua |
|---|---|---|---|---|
| Popular | `sec-popular` | **Rel mendatar, sampul 80px** | **tidak** | `see_all_popular.html` |
| New & Trending | `sec-trending` | Rel mendatar | **tidak** | `see_all_new_trending.html` |
| Editor's Picks | `sec-editor` | Rel mendatar | **tidak** | `see_all_editors_picks.html` |
| Section tematik | `sec-toprom` | Rel mendatar | ya | per kategori |
| Continue Reading | `sec-continue` | **Daftar vertikal** dengan progres | tidak | `my_library.html` |

> **Revisi 5 September 2026 · bentuk section.** Versi lama menulis tiga section
> teratas sebagai "kartu horizontal" dan dua sisanya sebagai "daftar vertikal".
> Sekarang **seluruh section genre berbentuk rel mendatar dengan sampul seragam
> 80px** — tiga bentuk jadi dua. Yang tetap daftar vertikal hanya Continue
> Reading: ia membawa batang progres, "Bab 45 dari 120", dan tombol lanjut, dan
> ketiganya butuh lebar satu baris penuh.
>
> **Kartu tinggal sampul dan judul.** Nama penulis, ★ rating, dan jumlah baca
> dicabut dari kartu beranda; ketiganya muncul saat sampulnya diketuk. Kolom
> "tersaring tab" di atas juga baru — sebelumnya tiga section teratas ikut
> tersaring. `architecture.md` §1.22.

- Urutan section di feed bersifat tetap dan **tidak** dapat diubah pengguna (hanya bisa disembunyikan).
- Judul section memakai label bahasa Inggris; label ini juga muncul di popover pengaturan.
- Setiap kartu di semua section dapat diketuk (FR-HOME-07).
- **Menekan sampul membesarkannya** menjadi lapisan di tengah layar beserta judul, nama penulis, ★ rating, dan jumlah baca; judul di bawah sampul tetap tautan ke ceritanya. Berlaku **hanya di beranda**. Ketukan di mana saja pada lapisan itu menutupnya. Animasinya dimatikan bila pengguna meminta gerak dikurangi. *(Baru — permintaan produk 5 September 2026, `architecture.md` §1.22.)*

**Acceptance criteria.**
- **Given** beranda dimuat dengan seluruh section aktif, **when** pengguna menggulir, **then** kelima section tampil sesuai urutan tabel di atas.
- **Given** pengguna menekan "See all" pada New & Trending, **when** aksi dijalankan, **then** `see_all_new_trending.html` terbuka.
- **Given** pengguna menekan "See all" pada Continue Reading, **when** aksi dijalankan, **then** `my_library.html` terbuka.

---

### FR-HOME-05 — Slot iklan dalam feed · P1

**Deskripsi.** Dua slot iklan disisipkan di antara section konten: satu banner ramping dan satu iklan native yang menyerupai kartu cerita.

**User story.** Sebagai penyelenggara, saya ingin menempatkan iklan di titik yang wajar dalam feed agar monetisasi berjalan tanpa merusak alur penemuan cerita.

**Aturan bisnis.**
- Slot 1 (`sec-ad1`): banner ramping, ditempatkan **setelah section tematik pertama** — di bawah tab genre.
- Slot 2 (`sec-ad2`): iklan native, ditempatkan **setelah section tematik kedua**.
- **Tidak ada iklan sebelum banner.** Ketiga section prioritas di paling atas bersih dari slot iklan.

> **Revisi 6 September 2026 · kedua slot iklan pindah ke bawah tab genre.** Versi
> lama menaruh slot 1 setelah Popular dan slot 2 setelah Editor's Picks. Sejak
> §1.22 menaikkan ketiga section prioritas ke paling atas, penempatan itu berarti
> menyisipkan iklan **di antara tiga section teratas** — tepat di bidang yang
> menentukan kesan pertama beranda. Jumlah slot di halaman tetap dua; yang
> berubah hanya tidak ada lagi yang mendahului banner.
>
> Perpindahannya sudah tercatat di §2.1 sejak 5 September, tetapi aturan bisnis
> di sini **tidak ikut disunting** pada giliran yang sama — dan dua bagian berkas
> yang saling membantah lebih buruk daripada satu bagian yang usang.
> `architecture.md` §1.22.
- Keduanya memakai `role="complementary"` dan `aria-label` yang menyebut "Sponsored", sehingga pembaca layar dapat membedakannya dari konten.
- Keduanya termasuk dalam kontrol visibilitas FR-HOME-06 — pengguna boleh menyembunyikan iklan.

**Hook implementasi.** `home_tabs.html:978` (`.ad-slim#sec-ad1`), `home_tabs.html:1051` (`.ad-native#sec-ad2`).

**Acceptance criteria.**
- **Given** seluruh section aktif, **when** pengguna menggulir melewati section tematik pertama, **then** banner iklan tampil sebelum section tematik berikutnya.
- **Given** seluruh section aktif, **when** pengguna melihat tiga section teratas, **then** tidak ada slot iklan di antaranya.
- **Given** pengguna mematikan switch "Ad", **when** popover ditutup, **then** slot iklan tersebut tidak lagi tampil di feed.
- **Given** pembaca layar membaca feed, **when** mencapai slot iklan, **then** area diumumkan sebagai konten bersponsor.

---

### FR-HOME-06 — Personalisasi tampil/sembunyi section (tersimpan) · P0

**Deskripsi.** Popover berisi sembilan switch yang mengontrol tampil-tidaknya tiap blok beranda. Perubahan berlaku seketika dan bertahan setelah aplikasi ditutup.

**User story.** Sebagai pembaca, saya ingin menyembunyikan bagian beranda yang tidak saya pakai agar layar utama hanya berisi hal yang saya butuhkan, dan pilihan itu tetap tersimpan.

**Aturan bisnis.**

Sembilan target yang dapat diatur (nilai `data-target`):

| # | `data-target` | Blok |
|---|---|---|
| 1 | `sec-banner` | Banner — "Carousel bagian atas" |
| 2 | `sec-genres` | Genre / kategori |
| 3 | `sec-popular` | Popular |
| 4 | `sec-ad1` | Iklan banner |
| 5 | `sec-trending` | New & Trending |
| 6 | `sec-editor` | Editor's Picks |
| 7 | `sec-ad2` | Iklan native |
| 8 | `sec-toprom` | Top Romance |
| 9 | `sec-continue` | Continue Reading |

- **Default: semua aktif.** `defaultMap()` membangun peta seluruh `data-target` bernilai `true`.
- **Pemuatan:** `loadMap()` membaca `localStorage['home_section_visibility_v1']`. Bila kosong → default. Bila ada → hasil parse **digabung di atas default** (`{ ...defaultMap(), ...parsed }`), sehingga section baru yang belum pernah tersimpan otomatis tampil. Bila JSON rusak → `catch` mengembalikan default (tidak pernah melempar error ke pengguna).
- **Penerapan:** `applyVisibility()` menganggap nilai aktif kecuali persis `false` (`visibility[id] !== false`), lalu menyetel kelas `on` pada switch dan `style.display` pada elemen section (`''` atau `'none'`).
- **Penyimpanan:** setiap klik switch langsung membalik nilai, menulis seluruh peta ke `localStorage`, lalu memanggil `applyVisibility()`. Tidak ada tombol "Simpan".
- **Perilaku popover:**
  - Ikon pengaturan → `togglePopover()`; klik memanggil `stopPropagation()` agar tidak langsung tertutup oleh handler dokumen.
  - Klik di mana pun di dokumen menutup popover, **kecuali** klik di dalam popover atau pada ikon pengaturan.
  - Menggulir `.content` menutup popover (listener `passive`) agar terasa seperti aplikasi native.
  - Klik pada switch memanggil `stopPropagation()` sehingga mengubah switch tidak menutup popover.
- Popover memakai `role="dialog"` dengan `aria-label="Home section settings"`.

**Hook implementasi.** `home_tabs.html:1242` `STORAGE_KEY`; `:1244:defaultMap()`, `:1250:loadMap()`, `:1263:applyVisibility()`, `:1276:openPopover()`, `:1280:closePopover()`, `:1283:togglePopover()`; elemen `#sectionSettingsBtn`, `#sectionPopover`, `.switch[data-target]`.

**Acceptance criteria.**
- **Given** pengguna belum pernah mengubah pengaturan, **when** beranda dimuat, **then** kesembilan section tampil dan seluruh switch dalam keadaan aktif.
- **Given** popover terbuka, **when** pengguna mematikan switch "Banner", **then** carousel langsung hilang dari feed dan switch kehilangan status aktif.
- **Given** pengguna telah mematikan "Banner", **when** halaman dimuat ulang, **then** carousel tetap tersembunyi.
- **Given** nilai `home_section_visibility_v1` berisi JSON tidak valid, **when** beranda dimuat, **then** seluruh section tampil (kembali ke default) tanpa error yang terlihat pengguna.
- **Given** peta tersimpan hanya memuat sebagian kunci, **when** beranda dimuat, **then** section yang tidak tercantum tetap tampil.
- **Given** popover terbuka, **when** pengguna mengetuk area feed di luar popover, **then** popover tertutup.
- **Given** popover terbuka, **when** pengguna menggulir konten, **then** popover tertutup.
- **Given** popover terbuka, **when** pengguna mengubah sebuah switch, **then** popover tetap terbuka.

---

### FR-HOME-07 — Routing kartu cerita ke detail · P0

**Deskripsi.** Setiap elemen yang mewakili sebuah cerita — banner, kartu grid, dan baris daftar — berperilaku sebagai tautan yang dapat diakses lewat sentuhan maupun papan ketik.

**User story.** Sebagai pembaca, saya ingin mengetuk cerita mana pun di beranda dan langsung sampai ke halamannya, termasuk saat memakai papan ketik.

**Aturan bisnis.**
- Selektor yang diperlakukan sebagai cerita: `.hero`, `.book-card`, `.list-item`.
- Setiap elemen tersebut diberi secara programatis: `cursor: pointer`, `role="link"`, `tabindex="0"`.
- Aktivasi lewat `click` **dan** `keydown` dengan tombol **Enter** atau **Space** (`preventDefault()` dipanggil agar Space tidak menggulir halaman).
- Tujuan tunggal: konstanta `STORY_DETAIL_URL = 'detail_story_alternatif_unified_cover_first.html'`.
- Di halaman lihat-semua, kartu cerita adalah `<a>` biasa menuju tujuan yang sama.

**Hook implementasi.** `home_tabs.html:1188` `STORY_DETAIL_URL`; `:1189:goToStoryDetail()`; loop `:1192`.

**Acceptance criteria.**
- **Given** pengguna mengetuk kartu di section Popular, **when** aksi dijalankan, **then** `detail_story_alternatif_unified_cover_first.html` terbuka.
- **Given** fokus papan ketik berada pada sebuah kartu cerita, **when** pengguna menekan Enter, **then** halaman detail terbuka.
- **Given** fokus berada pada kartu cerita, **when** pengguna menekan Space, **then** halaman detail terbuka dan halaman **tidak** ikut tergulir.
- **Given** pembaca layar menelusuri feed, **when** mencapai kartu cerita, **then** elemen diumumkan sebagai tautan dan dapat difokuskan.

---

### FR-HOME-08 — Tombol pintas top-up (FAB) · P1

**Deskripsi.** Tombol bulat mengambang di atas navigasi bawah yang membawa pengguna langsung ke pembelian koin.

**User story.** Sebagai pembaca, saya ingin mengisi koin kapan saja dari beranda agar tidak kehabisan saat menemukan bab terkunci.

**Aturan bisnis.**
- Id `#topupFab`, `aria-label="Top up"`, tujuan `topup_koin.html`.
- Selalu terlihat di atas konten; `.content` diberi `padding-bottom: 140px` agar isi terakhir tidak tertutup FAB dan navigasi bawah.
- FAB **tidak** termasuk dalam kontrol visibilitas section.

**Hook implementasi.** `home_tabs.html:1183` — listener `click` pada `#topupFab`.

**Acceptance criteria.**
- **Given** pengguna berada di beranda, **when** menekan FAB koin, **then** `topup_koin.html` terbuka.
- **Given** pengguna menggulir ke ujung bawah feed, **when** melihat konten terakhir, **then** konten tidak tertutup FAB maupun navigasi bawah.

---

### FR-HOME-09 — Navigasi bawah lima tab · P0

**Deskripsi.** Bilah navigasi tetap berisi lima tujuan utama aplikasi, dipetakan menurut urutan posisi.

**User story.** Sebagai pengguna, saya ingin berpindah antar area utama aplikasi dari mana pun tanpa harus kembali ke beranda dulu.

**Aturan bisnis.**
- Rute dipetakan **berdasarkan indeks** elemen `.bottom-nav .nav-item`:

  | Indeks | Label | Tujuan |
  |---|---|---|
  | 0 | Home | `home_tabs.html` |
  | 1 | Topup | `topup_koin.html` |
  | 2 | Library | `my_library.html` |
  | 3 | Stories | `my_stories.html` |
  | 4 | Profile | `profile.html` |

- Tab tanpa rute padanan diabaikan (`if (!target) return;`) — menambah tab tanpa menambah rute tidak menyebabkan error.
- Setiap tab diberi `role="link"`, `tabindex="0"`, `cursor: pointer`, serta handler `click` dan `keydown` (Enter/Space) yang identik.
- Tab halaman aktif ditandai kelas `active` dengan warna `--accent`.

**Hook implementasi.** `home_tabs.html:1214` `bottomNavRoutes`; loop `:1222`; `navigate()` `:1225`.

**Acceptance criteria.**
- **Given** pengguna berada di beranda, **when** menekan tab "Library", **then** `my_library.html` terbuka.
- **Given** fokus papan ketik ada pada tab "Profile", **when** pengguna menekan Enter, **then** `profile.html` terbuka.
- **Given** pengguna berada di beranda, **when** melihat navigasi bawah, **then** tab "Home" ditandai aktif.
- **Given** jumlah tab melebihi jumlah rute, **when** halaman dimuat, **then** tidak terjadi error dan tab berlebih tidak melakukan navigasi.

---

### FR-HOME-10 — Halaman lihat-semua per kategori · P0

**Deskripsi.** Tiga halaman daftar penuh, satu per kategori kurasi, dengan identitas warna masing-masing dan jumlah cerita yang eksplisit.

**User story.** Sebagai pembaca, saya ingin melihat seluruh isi sebuah kategori dalam daftar penuh agar bisa menelusuri lebih jauh dari yang muat di beranda.

**Aturan bisnis.**

| Halaman | Judul | Jumlah | Aksen | Badge kartu |
|---|---|---|---|---|
| `see_all_popular` | Popular | 328 stories | `#d09a93` (rose) | `#1 Popular`, `#2 Popular`, `#3 Popular`, `HOT` |
| `see_all_new_trending` | New & Trending | 96 stories | `#55a7b1` (teal) | `Rising`, `New`, `Hot` |
| `see_all_editors_picks` | Editor's Picks | 54 stories | `#9f7a54` (bronze) | `Hidden Gem`, `Editor's Choice`, `New Talent` |

- Struktur kartu seragam: cover 66×88 (gradien aksen), badge peringkat, judul, penulis, meta (genre–status, rating–jumlah baca), dan pada Popular tambahan baris pertumbuhan (mis. `+24K reads minggu ini`).
- Tiap kartu memiliki tombol **"+ Simpan"** dan petunjuk aksi geser tersembunyi (`Save · Share · Hide`) di sisi kanan.
- Tombol kembali (`<`) selalu menuju `home_tabs.html`.
- Bilah kontrol bersifat **sticky** di bawah judul dengan `backdrop-filter: blur(14px)`.
- Ketiga halaman **tidak memuat JavaScript apa pun** (lihat §7).

**Hook implementasi.** `see_all_popular.html:13-27` dan padanannya; `.story`, `.badge`, `.save`, `.sticky`.

**Acceptance criteria.**
- **Given** pengguna menekan "See all" pada Editor's Picks, **when** halaman terbuka, **then** judul "Editor's Picks" dan teks "54 stories" tampil.
- **Given** pengguna berada di halaman New & Trending, **when** melihat elemen beraksen, **then** warna aksen teal `#55a7b1` dipakai, bukan rose.
- **Given** pengguna menekan sebuah kartu cerita, **when** aksi dijalankan, **then** `detail_story_alternatif_unified_cover_first.html` terbuka.
- **Given** pengguna menekan tombol kembali, **when** aksi dijalankan, **then** `home_tabs.html` terbuka.
- **Given** pengguna menggulir daftar, **when** daftar bergerak, **then** bilah urutan/filter tetap menempel di atas.

---

### FR-HOME-11 — Urutkan, saring, dan chip periode · P1

**Deskripsi.** Setiap halaman lihat-semua menyediakan satu dropdown urutan, satu tombol filter, satu deret chip periode/kurasi, dan dua dropdown penyaring — dengan pilihan yang disesuaikan per kategori.

**User story.** Sebagai pembaca, saya ingin mengurutkan dan menyaring daftar kategori agar bisa menemukan cerita yang sesuai selera dan periode yang saya inginkan.

**Aturan bisnis.**

| Halaman | Opsi urutan | Chip | Dropdown penyaring |
|---|---|---|---|
| Popular | Paling Banyak Dibaca · Rating Tertinggi · Paling Banyak Disimpan · Terbaru Diupdate | Hari ini *(aktif)* · Minggu ini · Bulan ini · Sepanjang Masa | Genre · Status (Ongoing/Completed) |
| New & Trending | Pertumbuhan Tercepat · Terbaru Dipublish · Rating Tertinggi · Paling Banyak Dikomentari | Minggu ini *(aktif)* · Bulan ini · 3 Bulan ini | Genre · Bahasa (Indonesia/English) |
| Editor's Picks | Pilihan Editor · Rating Tertinggi · Paling Banyak Disimpan | Semua *(aktif)* · Karya Terbaik · Hidden Gem · Penulis Baru · Pilihan Bulan Ini | Genre · (satu penyaring tambahan) |

- Tepat **satu** chip aktif pada satu waktu; chip aktif memakai latar `#241f1e` dan teks putih.
- Opsi urutan pertama adalah default kategori masing-masing.
- Deret chip dapat digulir horizontal dengan scrollbar disembunyikan.
- **Belum berfungsi pada prototype** — tidak ada JavaScript yang membaca kontrol ini (lihat §7).

**Acceptance criteria.**
- **Given** halaman Popular terbuka, **when** pengguna melihat deret chip, **then** hanya "Hari ini" yang bergaya aktif.
- **Given** halaman New & Trending terbuka, **when** pengguna membuka dropdown urutan, **then** "Pertumbuhan Tercepat" menjadi pilihan pertama.
- **Given** pengguna memilih urutan lain, **when** pilihan berubah, **then** *(produksi)* daftar dimuat ulang sesuai urutan tersebut.
- **Given** pengguna memilih genre pada dropdown penyaring, **when** pilihan berubah, **then** *(produksi)* daftar hanya menampilkan cerita bergenre itu.

---

### FR-HOME-12 — Skeleton pemuatan & keadaan kosong · P2

**Deskripsi.** Daftar menyediakan placeholder berdenyut saat data dimuat dan pesan khusus saat tidak ada hasil yang cocok.

**User story.** Sebagai pembaca, saya ingin tahu bahwa daftar sedang dimuat atau memang kosong agar tidak mengira aplikasi rusak.

**Aturan bisnis.**
- Skeleton: kartu setinggi 112px dengan animasi `pulse` 1,4 detik berulang (opacity turun ke 0,52 di tengah siklus).
- Keadaan kosong: `"Tidak ada story yang cocok dengan filter ini."` dengan garis putus-putus; `display: none` secara default dan hanya ditampilkan saat hasil saring kosong.
- Skeleton diletakkan sebagai item terakhir daftar untuk menandakan masih ada data yang dimuat (pola *infinite scroll*).

**Hook implementasi.** `.skeleton`, `.empty`, `@keyframes pulse` pada ketiga halaman lihat-semua.

**Acceptance criteria.**
- **Given** daftar sedang memuat data tambahan, **when** pengguna menggulir ke bawah, **then** kartu skeleton berdenyut tampil di akhir daftar.
- **Given** kombinasi filter tidak menghasilkan cerita, **when** daftar dirender, **then** pesan keadaan kosong tampil dan daftar disembunyikan.
- **Given** ada hasil yang cocok, **when** daftar dirender, **then** pesan keadaan kosong tetap tersembunyi.

---

### FR-HOME-13 — Tab genre benar-benar menyaring · P0

**Status: BARU.** Saat ini menekan tab genre hanya memindahkan kelas `active`; isi section tidak berubah sama sekali, sehingga pembaca mengira filternya rusak.

**Deskripsi.** Memilih genre menyaring seluruh section discovery, dengan keadaan yang jelas saat sedang memuat dan saat tidak ada hasil.

**User story.** Sebagai pembaca, saya ingin menekan genre favorit dan melihat beranda benar-benar berisi cerita genre itu.

**Aturan bisnis.**
- Memilih genre memuat ulang section **Popular**, **New & Trending**, **Editor's Picks**, dan **Top Romance** dengan genre tersebut sebagai penyaring.
- **Banner**, **Continue Reading**, dan slot iklan **tidak ikut tersaring** — banner adalah kurasi editorial dan Continue Reading adalah bacaan pribadi pembaca.
- Tersedia keadaan **"Semua"** sebagai posisi awal, sehingga pembaca dapat kembali ke beranda tanpa penyaring.
- Selama memuat, section menampilkan kartu skeleton; section yang tidak punya cerita pada genre itu **disembunyikan**, bukan menampilkan judul di atas ruang kosong.
- Genre terpilih ikut ke tautan "See all", sehingga halaman lihat-semua terbuka dengan penyaring yang sama.
- Genre yang dipilih saat onboarding (lihat [`prd_02_auth.md`](prd_02_auth.md) FR-AUTH-11) menentukan urutan tab, dengan favorit pengguna di depan.
- Pilihan genre bersifat sementara per kunjungan — tidak disimpan, karena pengguna sering berganti-ganti.

**Acceptance criteria.**
- **Given** pembaca menekan tab "Fantasy", **when** section dimuat ulang, **then** Popular, New & Trending, Editor's Picks, dan Top Romance hanya berisi cerita fantasi.
- **Given** genre "Fantasy" aktif, **when** halaman dirender, **then** banner dan Continue Reading tetap menampilkan isi aslinya.
- **Given** genre yang dipilih tidak punya cerita di Editor's Picks, **when** beranda dirender, **then** section itu disembunyikan seluruhnya.
- **Given** genre "Fantasy" aktif, **when** pembaca menekan "See all" pada Popular, **then** halaman lihat-semua terbuka dengan penyaring genre fantasi.
- **Given** section sedang dimuat, **when** halaman dirender, **then** kartu skeleton tampil menggantikan kartu cerita.

---

### FR-HOME-14 — Kontrol lihat-semua berfungsi · P0

**Status: BARU.** Ketiga halaman lihat-semua **tidak memuat JavaScript sama sekali** — urutan, filter, chip periode, tombol "+ Simpan", dan aksi geser semuanya statis.

**Deskripsi.** Seluruh kontrol yang sudah tergambar di halaman lihat-semua benar-benar bekerja.

**User story.** Sebagai pembaca, saya ingin mengurutkan dan menyaring daftar kategori seperti yang dijanjikan kontrolnya.

**Aturan bisnis.**
- Kontrol yang harus berfungsi mengikuti daftar pada FR-HOME-11: **urutan** · **chip periode** · **dua dropdown penyaring** · tombol **Filter**.
- Setiap perubahan memuat ulang daftar dari server, dari halaman pertama, dengan kartu skeleton selama menunggu.
- **Kombinasi filter dan urutan ikut ke URL** sehingga dapat dibagikan dan tombol kembali peramban bekerja — pola yang sama dengan pencarian (lihat [`prd_11_search_notifications.md`](prd_11_search_notifications.md) FR-SRCH-04).
- Tombol **"+ Simpan"** pada kartu menjalankan aksi yang sama dengan "Add to Library" di halaman detail (lihat [`prd_04_story_detail.md`](prd_04_story_detail.md) FR-DETAIL-13), dan berubah menjadi "Tersimpan" setelah berhasil.
- **Aksi geser** (`Save · Share · Hide`) yang sudah digambar di CSS diaktifkan: geser kartu ke kiri memunculkan ketiganya. **Hide** menyembunyikan cerita dari rekomendasi pengguna tersebut.
- Keadaan kosong dan skeleton yang sudah ada (FR-HOME-12) dipakai untuk hasil penyaringan.
- Daftar dimuat bertahap 20 per muat.

**Acceptance criteria.**
- **Given** pembaca memilih urutan "Rating Tertinggi", **when** daftar dimuat ulang, **then** cerita berating tertinggi berada di atas.
- **Given** pembaca menekan chip "Bulan ini", **when** daftar dimuat ulang, **then** hanya chip itu aktif dan daftar mengikuti periode tersebut.
- **Given** kombinasi filter tidak menghasilkan cerita, **when** daftar dirender, **then** keadaan kosong tampil.
- **Given** pembaca menekan "+ Simpan" pada sebuah kartu, **when** aksi berhasil, **then** tombol berubah menjadi "Tersimpan" dan cerita masuk ke perpustakaan.
- **Given** pembaca menggeser kartu ke kiri, **when** aksi geser muncul, **then** tiga aksi Save, Share, dan Hide tersedia.
- **Given** pembaca menyaring lalu menekan tombol kembali peramban, **when** halaman dirender, **then** keadaan saringan sebelumnya dipulihkan.

---

### FR-HOME-15 — Lihat-semua untuk Top Romance · P1

**Status: BARU.** Tautan "View more" pada Top Romance menuju **halaman detail satu cerita**, bukan daftar — satu-satunya section yang tautan lihat-semuanya salah sasaran.

**Deskripsi.** Top Romance mendapat halaman daftar penuhnya sendiri, konsisten dengan tiga section lain.

**User story.** Sebagai pembaca, saya ingin menelusuri seluruh cerita Top Romance seperti yang bisa saya lakukan pada Popular dan Editor's Picks.

**Aturan bisnis.**
- Tautan "View more" diarahkan ke halaman lihat-semua bergaya sama dengan trio yang sudah ada, memakai tata letak **daftar vertikal dengan progres** seperti tampilannya di beranda.
- Judul dan jumlah cerita ditampilkan seperti halaman lihat-semua lain (lihat FR-HOME-10).
- Kontrol urutan dan filter mengikuti FR-HOME-14.
- Aksen halaman ini memakai rose-gold `#d09a93` — bukan aksen baru — sekaligus menjadi kesempatan menyeragamkan aksen ketiga halaman lihat-semua yang sekarang berbeda-beda (lihat [`prd_01_design_system.md`](prd_01_design_system.md) §9.2).
- Tautan "See all" pada Continue Reading tetap menuju `my_library.html` — itu memang perpustakaan pembaca, bukan kategori.

**Acceptance criteria.**
- **Given** pembaca menekan "View more" pada Top Romance, **when** halaman terbuka, **then** daftar penuh Top Romance tampil, bukan halaman detail satu cerita.
- **Given** halaman Top Romance terbuka, **when** dirender, **then** judul kategori dan jumlah cerita tampil.
- **Given** pembaca menekan "See all" pada Continue Reading, **when** aksi dijalankan, **then** `my_library.html` yang terbuka.

---

### FR-HOME-16 — Beranda pengguna baru · P1

**Status: BARU.** Beranda saat ini mengasumsikan pengguna sudah punya riwayat baca — section "Continue Reading" tidak punya versi kosong.

**Deskripsi.** Tampilan beranda bagi pengguna yang belum membaca apa pun.

**User story.** Sebagai pengguna baru, saya ingin beranda yang mengajak saya memulai, bukan section kosong yang membingungkan.

**Aturan bisnis.**
- Section **Continue Reading** disembunyikan sepenuhnya bila belum ada riwayat baca — bukan menampilkan judul di atas ruang kosong.
- Section discovery lain tetap tampil dengan isi berdasarkan genre pilihan onboarding (lihat [`prd_02_auth.md`](prd_02_auth.md) FR-AUTH-11).
- Setelah pembaca menyelesaikan bab pertamanya, Continue Reading muncul otomatis pada kunjungan berikutnya.
- Popover pengaturan section tetap menampilkan seluruh sembilan pilihan, termasuk yang sedang tersembunyi karena kosong — pengaturan pengguna dan keadaan kosong adalah dua hal berbeda.

**Acceptance criteria.**
- **Given** pengguna baru belum membaca apa pun, **when** beranda dirender, **then** section Continue Reading tidak tampil.
- **Given** pengguna menyelesaikan bab pertamanya, **when** membuka beranda lagi, **then** Continue Reading tampil berisi cerita itu.
- **Given** Continue Reading tersembunyi karena kosong, **when** pengguna membuka popover pengaturan, **then** pilihan Continue Reading tetap ada dalam daftar.

---

## 5. State & Persistensi

| State | Penyimpanan | Kunci | Bentuk | Umur |
|---|---|---|---|---|
| Visibilitas section beranda | `localStorage` | `home_section_visibility_v1` | `{"sec-banner":true,"sec-genres":false,…}` | Permanen sampai dihapus |
| Genre aktif | Memori DOM | — | kelas `active` | Hilang saat pindah halaman |
| Posisi gulir carousel/tab | Memori DOM | — | — | Hilang saat pindah halaman |
| Status popover | Memori DOM | — | kelas `open` | Hilang saat pindah halaman |
| Urutan/filter lihat-semua | **Tidak disimpan** | — | — | — |

**Kebutuhan produksi:** sinkronkan `home_section_visibility_v1` ke akun pengguna (lihat `../../docs/api_home_tabs.md` §2.9) agar preferensi ikut berpindah perangkat.

---

## 6. Navigasi

**Masuk ke modul:** `login.html` / `register.html` (setelah berhasil) · tab "Home" dari halaman mana pun · tombol kembali dari `see_all_*` · tautan kembali dari `manage_chapters`, `my_library`, `my_stories`, `topup_koin`, `transaction_history`, `detail_story_*`.

**Keluar dari modul:** `detail_story_alternatif_unified_cover_first.html` · `see_all_popular.html` · `see_all_new_trending.html` · `see_all_editors_picks.html` · `topup_koin.html` · `my_library.html` · `my_stories.html` · `profile.html`.

---

## 7. Catatan Prototype vs Produksi

| # | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | **Ikon Cari dan Notifikasi tanpa handler** | Dua aksi utama header tidak berfungsi | Buat halaman pencarian & pusat notifikasi, lalu sambungkan |
| 2 | **Tab genre tidak menyaring konten** — hanya mengubah gaya aktif | Pengguna mengira filter rusak | Sambungkan pemilihan genre ke pemuatan ulang section |
| 3 | **Halaman lihat-semua tanpa JavaScript sama sekali** — urutan, filter, chip, tombol "+ Simpan", dan aksi geser (Save/Share/Hide) semuanya statis | Seluruh FR-HOME-11 belum dapat diuji | Implementasikan sebagai state klien + parameter kueri ke API |
| 4 | **Aksen berbeda per halaman lihat-semua** (rose/teal/bronze) | Menyimpang dari identitas merek tunggal | Jadikan token `--accent-category-*` dengan aturan eksplisit (lihat `prd_01_design_system.md` §9.2) |
| 5 | ~~Backdrop halaman lihat-semua gelap `#0e0e0f`~~ — **sudah diperbaiki**: latar diseragamkan ke gradien krem di seluruh halaman (lihat [`prd_01_design_system.md`](prd_01_design_system.md) §2.0) | — | Selesai |
| 6 | Seluruh isi section hardcoded (judul, penulis, rating, jumlah baca) | Tidak mencerminkan data nyata | Sambungkan ke endpoint di `../../docs/api_home_tabs.md` |
| 7 | Tautan "View more" pada Top Romance menuju **detail satu cerita**, bukan daftar | Tidak konsisten dengan section lain | Buat halaman lihat-semua untuk Top Romance |
| 8 | Preferensi visibilitas hanya per-perangkat | Hilang saat ganti perangkat | Sinkronkan ke akun |
| 9 | Beranda memakai *system font stack* dan tidak memuat Google Fonts, berbeda dari 28 halaman lain | Judul beranda tidak memakai Cormorant seperti halaman lain | Seragamkan saat ekstraksi token global |
| 10 | Sapaan "Hi, Anna" dan seluruh label section berbahasa Inggris di UI berbahasa Indonesia | Bahasa campur | Seragamkan mengikuti `settings_language.html` |
