# Novelova v2 — Todo Redesign per Halaman

> Satu bagian per rute. Ini pecahan halaman-per-halaman dari **Fase R** di
> [`todo.md`](todo.md) — bukan rencana kedua yang berdiri sendiri. Fase R
> menyusun pekerjaan menurut urutan bangun; berkas ini menyusunnya menurut apa
> yang dibuka pengguna.
>
> **Acuan:** [`../redesign-novelova.md`](../redesign-novelova.md) +
> 27 PNG di `../Novel reader UI redesign/putaran7/`.
> **Kenapa palet berubah:** [`architecture.md`](architecture.md) §1.20.
>
> `[x]` berarti **sudah ada di repo dan lolos `npm run check` + `npm test`** —
> aturan yang sama dengan `todo.md`.

---

## Cara membaca berkas ini

**`ADA`** = halamannya sudah berisi dan lengkap; pekerjaannya **mengganti kulit**.
**`PENAMPUNG`** = rutenya hidup tetapi isinya masih `<Placeholder>`; ia tidak
bisa "diredesign". Yang berlaku: **kalau dibangun, dibangun langsung dengan
bahasa putaran 7** — jangan pernah menulis layar baru dengan palet lama.

**Mockup** menyebut id frame di `putaran7/`. Halaman **tanpa mockup** diturunkan
dari `redesign-novelova.md` §1 saja, dan itu bukan izin berimprovisasi: §1
menetapkan permukaan, garis, tinta, tipografi, tombol, chip, sakelar, formulir,
dan kapan sesuatu boleh jadi kartu. Kalau sebuah halaman tanpa mockup butuh pola
yang belum ada, **tanyakan dulu** — jangan mengarang komponen baru.

### Pemeriksaan baku

Sembilan hal ini berlaku di **setiap** halaman. Ditulis sekali di sini supaya
tidak jadi 270 kotak yang sama; tiap halaman cuma punya satu kotak
"Pemeriksaan baku" yang merujuk daftar ini.

1. **Permukaan & garis** — kertas `#f4f2ef`, panel putih, hairline `#e6e2db`
   (pembatas) / `#e2ddd5` (wadah). **Bayangan dihapus**; satu-satunya yang boleh
   bertahan ada di sampul buku.
2. **Dua tipografi, satu tugas masing-masing** — Lora untuk yang *adalah*
   cerita (judul cerita, judul bab, isi bab, isi komentar, judul layar, dan
   angka di dalam blok statistik). Plus Jakarta Sans untuk yang dikatakan
   aplikasi tentang dirinya (label, metadata, tombol, chip, penghitung).
3. **Kepala section** — 9,5px / 800 / `.16em` huruf besar + garis 1px + aksi
   rata kanan bila ada.
4. **Daftar mengalahkan kartu** — konten berulang jadi daftar berpembatas.
   Kartu hanya untuk: banner, editor's picks, slot iklan, grup formulir, lembar
   pengaturan, dan gerbang bab terkunci.
5. **Tombol & saringan** — utama isi `#1c1a18` pill · sekunder hairline pill ·
   tersier teks tebal tinta redup. **Destruktif tetap abu, tidak pernah isi
   merah.** Saringan jadi tab teks bergaris bawah 2px; pill hanya di tempat
   mockup memakai pill.
6. **Emas dijatah** — `--nv-gold` (`#7d5411`) hanya untuk saldo koin, rating,
   harga bab terkunci, tahap aktif pelacak cetak, tautan `See all`, dan garis
   bawah tab aktif saringan pesanan berjalan. `--nv-gold-line` (`#b68235`) hanya
   untuk garis, batang progres, titik tab, dan aksen malam. **Emas tidak pernah
   jadi isi besar.**
7. **Empat keadaan** — memuat (skeleton **setinggi barisnya**) · berhasil ·
   kosong (satu kalimat polos tinta redup, **tanpa ilustrasi**) · gagal (pesan +
   tindakan). Aturan lama tetap: **kosong ≠ gagal**.
8. **Aksesibilitas & gerak** — tiap target ketuk ≥44px, fokus terlihat, baris
   cerita bisa dicapai keyboard dengan Enter **dan** Space, `aria-expanded`
   sinkron, toast `role="status" aria-live="polite"`. Lembar naik sambil
   meredupkan latar; **tidak ada yang memantul atau membesar**.

9. **Lulus di lima lebar telepon** — **320 · 360 · 390 · 412 · 430**. Tidak ada
   halaman yang menggeser badan halaman ke samping, dan tidak ada kontrol yang
   tertutup bilah lain. Ditegakkan `tests/e2e/isi-koin-di-hp.spec.ts`; halaman
   baru **ditambahkan ke daftar di sana**, bukan ke berkas e2e baru.
   ↳ 320 dan 360 yang menemukan cacatnya, bukan 412. Aturan lengkapnya di
   `../CLAUDE.md` §2.

**Yang tidak boleh masuk di halaman mana pun:** bayangan berat, gradien di luar
satu glow radial sampul gelap, emoji, warna aksen baru, sampul "album art"
membulat.

> **Butir 8 belum bisa dipenuhi halaman mana pun, dan bukan salah halamannya.**
> `Button`/`IconButton` ukuran `sm` tingginya **36px** (`Button.tsx:25,85`), di
> bawah ambang 44px — dan itulah ukuran yang dipakai baris aksi komentar, bilah
> melayang ruang baca, dan hampir tiap lembar. Menaikkannya per halaman berarti
> menambalnya di ~30 tempat; menaikkannya di primitifnya sekali menyentuh
> seluruh aplikasi, jadi ia **R7 (lintas-fitur)** — yang memang sudah
> menyebutkan ambang 44px — bukan pekerjaan per halaman.
> Sampai itu terjadi, "Pemeriksaan baku" tetap kosong walau delapan butir
> lainnya sudah terpenuhi.

---

## Kemajuan

**Fase R tuntas — 5 September 2026.** **Ketiga puluh rute `ADA` berkulit putaran
7, nol kotak tersisa.** Yang masih kosong hanya dua belas rute `PENAMPUNG`, dan
kotaknya sengaja **tidak** dicentang: halaman yang isinya masih `<Placeholder>`
tidak bisa "sudah diredesign". Ketiganya menunggu fasenya sendiri — Fase 11
(notifikasi), Fase 12 (hadiah), Fase 13 (profil, pengaturan, bantuan, legal).

**Fondasi selesai** (R1), dan butir 8 `Pemeriksaan baku` — target ketuk 44px yang
dulu menahan **setiap** halaman — sudah ditutup di primitifnya sejak R7.

| Grup | Rute | Punya mockup | Sudah berisi |
|---|---|---|---|
| Fondasi (bukan halaman) | — | — | — |
| A · Auth & onboarding | 4 | 0 | 4 |
| B · Beranda & penemuan | 3 | **3** | 3 |
| C · Cerita & ruang baca | 4 | **3** | 4 |
| D · Perpustakaan | 1 | **1** | 1 |
| E · Dompet | 3 | 0 | 3 |
| F · Author studio | 12 | **6** | 12 |
| G · Penghasilan penulis | 3 | 0 | 3 |
| H · Profil & pengaturan | 6 | **1** | 0 |
| I · Sosial, notifikasi, hadiah | 3 | 0 | 0 |
| J · Bantuan & legal | 3 | 0 | 0 |
| K · Dev & 404 | 2 | — | 2 |
| **Total** | **42** (+2) | **14** | **30** |

**Dua pertiga rute tidak punya mockup.** 27 PNG putaran 7 hanya menutup 14 dari
42 rute — dan yang tidak tergambar justru berisi hal yang paling mahal kalau
salah: seluruh alur uang (`/koin`, transaksi, ketiga halaman pencairan), editor
bab yang memegang naskah belum tersimpan, dan analitik. Di sana **§1 yang
berlaku, bukan improvisasi**, dan kalau sebuah pola belum ada — tanyakan.

Sampai Langkah 49 ke-17 rute itu **tidak punya fase sama sekali**: Fase R disusun
dari urutan bangun brief §15, dan §15 hanya menyebut layar yang punya PNG.
**R8** dan **R9** menutupnya.

**318 kotak** di seluruh berkas ini. Seluruh kotak rute `ADA` sudah dicentang;
yang tersisa hanya kotak rute `PENAMPUNG`, yang bukan pekerjaan Fase R.

---

# Fondasi — dikerjakan sebelum halaman mana pun · Fase R1

Bukan halaman, tetapi tiap kotak di bawahnya bergantung pada ini. Mengerjakan
halaman lebih dulu berarti menulis ulang halaman itu dua kali.

- [x] `src/styles/tokens.css` ditulis ulang: permukaan, garis, lima tingkat
      tinta, dua emas, radius sampul 4–6px
- [x] `--nv-accent` jadi tinta `#1c1a18`, bukan emas — 191 pemakaiannya ikut
      benar tanpa disentuh satu per satu
- [x] `--nv-coin` → `--nv-gold` (`#7d5411`) · `--nv-coin-icon` → `--nv-gold-line`
      (`#b68235`); pembagiannya sudah benar sejak awal, namanya saja yang terlalu
      sempit sekarang emas juga dipakai rating dan `See all`
- [x] Tinta metadata `#6f6862`, **bukan `#8a827a` seperti mockup** — mockup-nya
      3,38:1 dan gagal AA (`architecture.md` §1.20)
- [x] Token mati dibuang: `--nv-cat-popular/trending/editors` nol pemakai
- [x] `base.css`: `@fontsource/lora` + `@fontsource-variable/plus-jakarta-sans`
      menggantikan Cormorant Garamond + Manrope. **Tukar dua, bukan tambah dua**
      — runtime tetap 12 paket
- [x] `h1..h3` dan `--nv-font-read` mengikuti peran baru; `body` pindah ke sans
- [x] Primitif baru: `SectionHeader` (+ `SeeAllAction`) dan `Cover` — `Cover`
      **diangkat** dari komponen privat di dalam `StoryCard`, bukan ditulis ulang
- [x] ~~`ListRow`~~ **sengaja tidak dibuat.** Empat daftar yang seharusnya ia
      layani (`7a` Top Romance, `7c` pustaka, `7d` lihat-semua, `7j` karya)
      berbeda terlalu jauh — peringkat, batang progres, kata status, baris aksi —
      sehingga satu komponen bersama hanya jadi selusin prop. Yang benar-benar
      sama cuma pembatasnya, dan itu sudah berupa satu utility
      (`divide-y divide-nv-line`). Kotak ini dibuka lagi bila R2 dan R5 ternyata
      menulis anatomi baris yang persis sama dua kali
- [x] `Nav.tsx` → `ModernTabBar`: putih, 86px, lima tab, label + **titik emas
      5px** di bawah tab aktif. Hanya di layar bertab — **tidak pernah di ruang
      baca, halaman komentar, atau lembar**
- [x] `Button` tiga tingkat; `Chip`/`Tabs` jadi tab teks bergaris bawah 2px;
      `Switch` 44×26 knob 20 jarak 18; `Field` jadi garis bawah `1.5px #dcd6cd`
      dengan teks serif, multi-baris tetap kotak hairline
- [x] Bayangan dicabut dari `nv-card` dan seluruh primitif; disimpan hanya untuk
      sampul
- [x] `/dev/kitchen-sink` menampilkan seluruh primitif baru, terang **dan** malam
- [x] `npm run check` bersih — nol hex di luar `tokens.css`
- [x] `npm test` — **543 test masih lulus**, nol yang perlu disesuaikan: tidak ada
      satu pun test yang menguji warna atau nama kelas
- [x] **Sapuan lima lebar telepon** (320 · 360 · 390 · 412 · 430) — nol luberan di
      26 halaman, dan penjaganya dipasang permanen di
      `tests/e2e/isi-koin-di-hp.spec.ts`. Dua akar yang ditemukan **sudah ada
      sejak `novelova/` v1**: `grid gap-*` tanpa `grid-cols-*`, dan `<fieldset>`
      yang mengalahkan `overflow-x: auto` (`../CLAUDE.md` §8)

---

# A · Auth & onboarding — 4 halaman, tanpa mockup

> **Urutan kerjanya di [`todo.md`](todo.md) R8a.** Tanpa mockup, jadi acuannya `PRD Novelova/prd_01_design_system.md` §0.

Tidak ada frame putaran 7 untuk auth. Diturunkan dari §1: kertas, panel putih,
input garis bawah, tombol utama isi gelap. **Jangan mengarang layar baru** —
struktur dan copy-nya sudah benar, yang berganti kulitnya.

## `/masuk` — Masuk · `ADA` · tanpa mockup · **selesai R8**

- [x] Pemeriksaan baku
- [x] Input email & sandi jadi **garis bawah `1.5px`** dengan teks serif; label
      sans di atasnya
- [x] Tombol masuk jadi pill isi `#1c1a18`; tautan "Lupa sandi" jadi teks tebal
      tinta redup
- [x] Tombol OAuth jadi pill hairline — **warna merek Google/Facebook tetap**,
      itu satu-satunya pengecualian palet dan alasannya tidak berubah
- [x] Tiga kegagalan sesi tetap jalan dan ikut kulit baru: lembar masuk ulang
      (`AUTH-401`), penahanan lima percobaan (`AUTH-429`), layar versi
      kedaluwarsa (`APP-426`)
- [x] Satu area pesan berurutan tetap satu area — jangan dipecah jadi pesan per
      kolom

## `/daftar` — Daftar · `ADA` · tanpa mockup · **selesai R8**

- [x] Pemeriksaan baku
- [x] Input garis bawah; meter kekuatan kata sandi memakai lima token kekuatan
      yang sudah ada, **bukan emas**
- [x] Validasi berurutan satu-area-pesan tetap seperti sekarang

## `/lupa-sandi` — Lupa kata sandi · `ADA` · tanpa mockup · **selesai R8**

- [x] Pemeriksaan baku
- [x] Satu kolom, satu tombol; keadaan terkirim jadi kalimat polos, bukan kartu

## `/mulai` — Onboarding tiga langkah · `ADA` · tanpa mockup · **selesai R8**

- [x] Pemeriksaan baku
- [x] Indikator langkah jadi **garis bersegmen** seperti `7k`/`7l`, bukan titik
- [x] Pilihan genre favorit jadi pill — ini salah satu tempat pill memang benar
- [x] Sampul di langkah pratinjau ikut aturan sampul baru (potret, radius 4–6px)

---

# B · Beranda & penemuan — 3 halaman

## `/` — Beranda · `ADA` · mockup **`7a`** + lembar **`7s`**

Halaman terpadat dan yang paling banyak memakai primitif — dikerjakan lebih dulu
di antara halaman, persis seperti saran urutan bangun brief §15.

- [x] Pemeriksaan baku
- [x] Kepala: "Hi, Anna" **serif** + "Enjoy your reading today" sans, chip koin,
      lalu ikon urut **Cari → Notifikasi → Pengaturan section**
  ↳ Subjudul melebar penuh **di bawah** baris ikon; di dalam kolom kiri ia terjepit chip + tiga ikon dan pecah dua baris di 390px. Di 320px sapaannya mengecil, bukan terpotong.
- [x] Karusel banner: tiga cerita, kartu hairline, sampul 66×88, baris caption,
      pill `Read now`
- [x] **Seluruh kartu banner bisa diketuk dan pill-nya tidak menembak navigasi
      dua kali** — dua target di satu kartu adalah cacat klasiknya
- [x] Tab genre jadi tab teks; fade tepi kanan **muncul hanya saat strip benar-
      benar bisa digulir**, bukan selalu
- [x] `POPULAR`: baris horizontal kartu 112px — sampul + badge peringkat
      (`#1 Popular`…`HOT`), judul serif, penulis, `★ rating` + jumlah baca,
      `See all` emas di kepala
- [x] `NEW & TRENDING`: badge `Rising`/`New`/`Hot` + garis pertumbuhan emas
      (`+24rb baca minggu ini`)
- [x] `EDITOR'S PICKS`: kartu lebih lebar, satu **kutipan serif italic** per cerita
  ↳ Sempat dilepas karena keempat puluh cerita contoh berbagi satu `const SYNOPSIS`
     dan ketiga kartunya menampilkan kalimat identik. Diselesaikan di seed:
     `SYNOPSES` (40) + `MY_SYNOPSES` (4), kalimat pertamanya ditulis supaya
     berdiri sendiri. Halaman detail cerita ikut berhenti seragam.
- [x] `TOP ROMANCE`: daftar vertikal berperingkat
- [x] `CONTINUE READING`: daftar vertikal dengan batang progres hairline,
      persentase, dan tombol play terisi
- [x] Dua slot iklan: pita ramping `BERSPONSOR` + `Lihat`, dan satu yang
      **berbentuk baris cerita** tetapi tetap berlabel jelas
- [x] Label `BERSPONSOR` memakai tinta metadata, **bukan `#b8b0a8` mockup** —
      2,3:1, dan label iklan yang tidak terbaca bukan sekadar cacat kontras
- [x] FAB koin lingkaran 48px pindah ke **kiri bawah** — ia tidak boleh duduk di
      bawah `See all` yang rata kanan
  ↳ **Diperiksa di 320px juga.** Bentuknya sekarang pil `15,3rb` selebar ~110px
     di kanan bawah, dan di 320px ia menutupi baris tab saringan di `/karya` dan
     `/karya/:id/bab`. Memindahkannya ke kiri **tanpa** mengecilkannya jadi
     lingkaran 48px cuma menukar siapa yang tertutup — keduanya harus sekaligus.
- [x] Padding bawah feed ≥158px supaya baris terakhir lolos dari FAB **dan**
      bilah tab
- [x] Genre menyaring blok Populer · Baru & Naik Cepat · Editor's Picks · iklan
      native saja — **banner, iklan banner, dan Lanjut Membaca tidak pernah
      tersaring**
- [x] Section kosong **hilang seluruhnya dari feed**, bukan menyisakan kepala
      kosong
- [x] Lembar pengaturan section (`7s`): sembilan baris berketerangan + sakelar,
      `Selesai` dan `Atur ulang` di dasar, berlaku dan tersimpan seketika
- [x] **Kesembilan baris tetap terdaftar di lembar walau section-nya sedang
      hilang karena kosong** — kalau tidak, pengguna tidak punya cara
      menyalakannya kembali
- [x] Urutan section tetap tidak ikut favorit onboarding (`architecture.md` §1.7
      belum berubah)
- [x] **Test:** genre menyaring empat blok dan meninggalkan tiga
- [x] **Test:** section tanpa isi hilang dari feed tetapi barisnya tetap ada di
      lembar; sakelarnya bertahan setelah muat ulang

### Susunan ulang 5 September · **R2b** · §1.22

Beranda sempat **nol sisa** setelah R2. Permintaan produk 5 September membukanya
lagi: urutan blok, bentuk section, ukuran sampul, dan satu fitur baru. Enam
keputusannya dikonfirmasi lewat pertanyaan langsung; yang ditimpa dari `7a`
dicatat di `architecture.md` §1.22.

- [x] **Data contoh dulu** (`todo.md` R2b-a): 11 dari 26 section di bawah tab
      berisi < 4 cerita, dan sebagai rel mendatar itu terlihat seperti gagal
      memuat. Katalog 40 → ~60 judul, dan `Cover` dapat `onError`
- [x] Urutan: **3 section prioritas → banner → tab genre → section lainnya → Lanjut Membaca**
- [x] Ketiga section prioritas **berhenti tersaring tab** — jadi peringkat global
      (menimpa §1.6)
- [x] Pesan "genre ini belum ada isinya" pindah ke **bawah tab genre**; tiga
      section atas dan banner tetap tampil
- [x] Semua section genre jadi **rel mendatar**; `ranked` dan `rail-wide` dihapus
- [x] **Lanjut Membaca tetap daftar tegak** — batang progres, "Bab 45 dari 120",
      dan tombol lanjut butuh lebar satu baris penuh
- [x] Sampul seragam **80px** (dari 112/160) — 3,9 sampul terlihat di 360px
- [x] Kutipan serif `7a` §7 di "Paling Banyak Dibuka" **dihapus** — tidak terbaca
      di bawah sampul 80px
- [x] Nomor peringkat bekas `ranked` pindah ke **badge sampul**
- [x] **Ketuk sampul → sampul membesar** ke tengah layar, ~180ms `ease-out`;
      judul di bawahnya tetap tautan ke ceritanya
- [x] Lapisannya membawa `Buka cerita`, Esc menutup, fokus kembali ke sampul yang
      ditekan
- [x] `prefers-reduced-motion` mematikan animasinya — lapisannya tetap muncul
- [x] Zoom **hanya di beranda**: `StoryCard` menerima `onCoverClick` opsional,
      dan hanya beranda yang mengopernya
- [x] **Test:** urutan blok · tab tidak mengubah tiga section atas · genre kosong
      menyisakan tiga section atas · sampul membesar tanpa bernavigasi ·
      `/jelajah` `/pustaka` `/cari` tidak ikut berubah
- [x] **Test e2e:** beranda tidak menggeser badan halaman di kelima lebar setelah
      susunan baru

## `/cari` — Pencarian · `ADA` · mockup **`7e`**

- [x] Pemeriksaan baku
- [x] Kueri jadi **teks serif di atas garis bawah**, bukan kotak
  ↳ Tombol hapus bawaan peramban disembunyikan di `base.css`. `type="search"` **dipertahankan** — ia yang memberi `role="searchbox"`, dan 17 test beserta pembaca layar bergantung padanya.
- [x] Daftar saran sambil mengetik: label kiri + tipe (`Cerita` / `Tag`) rata
      kanan
- [x] Pill saringan `Paling relevan` · `Semua genre` · `Semua status` · `Bahasa`
      — di sini pill memang benar
  ↳ Tiap pil membungkus `<select>` asli yang ditumpuk transparan: yang terlihat pil, yang ditekan tetap kontrol peramban — navigasi papan ketik dan ketik-huruf tidak perlu ditulis ulang.
- [x] Hasil `CERITA` dengan jumlah hasil, memakai **anatomi baris yang sama**
      dengan halaman lain
- [x] Grup pill `TAG TERKAIT`
- [x] Riwayat pencarian & pil kata kunci populer ikut kulit baru
- [x] Kueri + tiga saringan + urutan tetap seluruhnya hidup di URL
- [x] Dua keadaan kosong yang sudah ada tetap **berbeda** dan tetap bukan
      kegagalan

## `/jelajah/:kategori` — Lihat semua · `ADA` · mockup **`7d`**

- [x] Pemeriksaan baku
- [x] **Satu tata letak untuk empat kategori** — hanya judul, baris hitungan, dan
      badge yang berganti. Aksen per kategori dihapus; putaran 7 tidak punya
      warna per kategori
- [x] Tab periode jadi tab teks; urut jadi aksi rata kanan (`Paling banyak
      dibaca ⌄`), bukan dropdown berkotak
  ↳ Urutan chip dibalik: `Sepanjang masa` jadi yang pertama. Chip pertama adalah bawaannya, dan selama `Hari ini` di depan halaman ini **selalu terbuka dengan "0 cerita"** — pembaca yang menekan `See all` mendarat di keadaan kosong.
- [x] Tiap baris: peringkat, sampul, judul serif, penulis, `★ rating` / baca /
      bab, pill `Simpan` ↔ `Tersimpan` (**terisi saat tersimpan**), dan `···`
  ↳ Lencana `HOT`/`BARU` pindah dari sampul ke tepi kanan baris (`7d`); `badge={null}` meniadakan yang di sampul supaya satu cerita tidak membawa dua lencana.
- [x] Aksi geser (Simpan · Bagikan · Sembunyikan) dipertahankan dan ikut kulit
      baru
- [x] Saringan + urutan tetap di URL; 20 per muat dengan **baris skeleton
      setinggi barisnya**

---

# C · Cerita & ruang baca — 4 halaman

Bagian terberat: dua dari empat halaman berubah **perilakunya**, bukan cuma
kulitnya.

## `/cerita/:storyId` — Detail cerita · `ADA` · mockup **`7b`** + lembar **`7h`**

- [x] Pemeriksaan baku
- [x] Panel kepala putih: sampul 94×136, judul serif, penulis, pill genre
- [x] **Strip statistik empat sel** `★ RATING` · `BAB` · `DURASI BACA` ·
      `STATUS` — durasi baca **menggantikan** metrik pamer yang ada sekarang
  ↳ `readMinutesTotal` ditambahkan ke `StoryDetail` dan dihitung **server**: halaman ini memuat bab 20 per halaman, jadi menjumlahkannya di layar menampilkan durasi cerita 120 bab dari 20 bab pertamanya saja.
- [x] Sinopsis serif dengan `Selengkapnya` (buka-tutup tetap, `aria-expanded`
      tetap sinkron)
- [x] Kartu monetisasi hairline: "7 bab pertama gratis" + harga per bab + harga
      akses penuh
- [x] `DAFTAR BAB`: nomor, judul serif, durasi/status, lalu **centang bila sudah
      dibaca atau harga emas + gembok bila terkunci**
  ↳ Ketiga penanda FR-DETAIL-14 pindah ke sel kanan; kolom ikon kedua di kiri dihapus karena satu baris bisa membawa dua ikon yang mengatakan hal yang sama.
- [x] Daftar bab 20-per-muat, pencarian, pembalik urutan, dan penanda baca tetap
      jalan
- [x] Bilah bawah lengket: bab terakhir dibaca + tombol `Lanjutkan`
- [x] Simpan ≠ Ikuti tetap optimistis dan tetap dua tombol berbeda
- [x] Lembar voucher (`7h`): tiap voucher dengan judul serif, baris masa
      berlaku, tombol `Pakai` hairline; lalu kolom kode + `Tukar & pakai`
- [x] `RateSheet` ikut kulit baru — rating 1–5 tetap menuntut sudah membaca satu
      bab, dan penolakannya tetap **ajakan, bukan tombol mati**
  ↳ Satu-satunya yang belum putaran 7 di lembar ini adalah **badan ulasannya**, yang masih sans di dalam kotak bergaris `--nv-line`. Ulasan adalah tulisan pembaca tentang cerita, jadi ia serif dan wadahnya `--nv-line-soft` seperti kolom banyak-baris lain (brief §2, `Field.tsx` `CONTROL_BOX`).

## `/cerita/:storyId/ulasan` — Ulasan · `ADA` · tanpa mockup · **selesai R9**

> Dikerjakan di [`todo.md`](todo.md) **R9c** — sempat tidak punya fase sama sekali sampai Langkah 49.

Brief tidak menggambar halaman ini. Anatominya diturunkan dari `7t` (komentar),
yang isinya paling mirip.

- [x] Pemeriksaan baku
- [x] Sebaran 5★…1★ jadi batang hairline dengan angka emas; **tetap tidak ikut
      tersaring**
- [x] Tag terpopuler jadi grup pill
- [x] Baris ulasan memakai anatomi `7t`: nama, waktu, **isi ulasan serif**, lalu
      baris aksi
- [x] Tombol "Membantu" tetap tidak berlaku untuk ulasan sendiri
- [x] Tanggapan penulis tetap berlencana; lencananya jadi pill hairline kecil
- [x] Tiga saringan + empat urutan tetap menyaring di server dan tetap tab teks
- [x] Tirai spoiler tetap `aria-hidden` selama tertutup

## `/cerita/:storyId/bab/:chapterId` — Ruang baca · `ADA` · mockup **`7u` `7v` `7f` `7g`** (Type A) dan **`7x` `7y` `7z` `7aa`** (Type B)

**Dua tipe, satu layar.** Berbagi tipografi dan panel pengaturan; selebihnya
tidak berbagi apa pun. Ini perubahan perilaku, bukan kulit — dan Type B
**adalah** Fase 5b.

### Type A — bab yang sudah dimiliki

- [x] Pemeriksaan baku
- [x] **Chrome tersembunyi sejak awal.** Hanya pembuka bab (`BAB 3`, judul
      serif, garis emas), badan serif, dan hairline progres 1,5px di dasar
      layar. Tanpa bilah atas, tanpa bilah tab, tanpa tombol
- [x] **Satu ketukan pada teks membuka kontrol, ketukan kedua menyembunyikannya**
- [x] Bilah atas melayang: kembali, judul cerita, `Bab 3 dari 120 · 7 menit`,
      chip koin
- [x] Bilah bawah melayang baris 1: bab sebelumnya · progres + `3 / 120` · bab
      berikutnya
- [x] Bilah bawah baris 2: **`Komentar bab` + jumlahnya**, pengaturan, penanda,
      dengarkan
- [x] Pill petunjuk "Ketuk teks sekali lagi untuk menyembunyikan"
- [x] **Tombol komentar hanya hidup di overlay ini — tidak pernah di akhir bab.**
      Menekannya membuka lembar `7w` di atas teks dan posisi baca tidak pernah
      hilang
- [x] Pengaturan (`7f`) jadi **panel hairline di dalam alur**, bukan lembar
      terpisah: slider ukuran font dengan nilai px, sakelar Serif/Sans/Lega,
      tema gelap, buka-bab-otomatis
- [x] Pengaturan tetap dipasang **sebelum render pertama** — jangan sampai
      redesign mengembalikan kedipan tema
- [x] Malam (`7g`): `#171513` halaman, `#211d19` panel, `#ddd6cd` badan, aksen
      emas termasuk tombol `Bab 4 ›`
- [x] Slot bersponsor di antara paragraf jadi **pita hairline, tidak pernah
      kartu**
- [x] TTS, navigasi bab dua tempat, progres baca dua tingkat, dan layar
      bab-ditarik beserta refund otomatisnya tetap jalan
- [x] **Test:** satu ketukan membuka kontrol, ketukan kedua menutupnya
- [x] **Test:** ukuran font dan tema bertahan lintas bab **dan** lintas muat ulang
- [x] **Test:** posisi baca dipulihkan per bab
  ↳ **Bukan sekadar test yang belum ditulis — perilakunya memang belum ada.** `useReadingProgress` hanya **menyimpan** `scrollPct` (`useReadingProgress.ts:35`); tidak ada yang membacanya kembali saat bab dibuka lagi, jadi tiap pembukaan mulai dari atas. Itu perilaku, bukan kulit, dan permintaan yang sedang berjalan membatasi diri pada tampilan. Sudah punya rumah: `todo.md` **R7** baris pertama menyebutnya bersama hal-hal lain yang harus bertahan lintas muat ulang.

### Type B — bab berbayar · menutup **Fase 5b**

> **Daftar kerja yang berlaku ada di [`todo.md`](todo.md) R4a–R4h**, tersusun
> menurut urutan pengerjaan dan menyebut berkasnya. Yang di bawah ini daftar
> **anatomi layarnya** — apa yang harus terlihat, bukan urutan membangunnya.
> Dua sudut pandang, satu pekerjaan.
>
> Dua hal yang baru sejak `architecture.md` §1.21: **pita tawaran bundling
> setelah sepuluh bab**, dan pemindahan izin buka-otomatis dari
> `stores/readerSettings.ts` ke server — sebuah izin memotong koin yang selama
> ini melanggar aturan struktur #5.

- [x] **Bilah atas selalu terlihat** — kembali → judul + `Lanjutan Terkunci` →
      chip koin `15,3rb +23` → dengarkan → pengaturan. Type A menyembunyikannya;
      Type B tidak boleh
- [x] Bagian gratis membaca persis seperti Type A, lalu berhenti di blok gerbang
- [x] Gerbang: badge mahkota `PREMIUM CONTINUATION`, `mulai 1.5rb koin + bonus`
      rata kanan, kalimat penuntun
- [x] Label `PRATINJAU TERSENSOR` **tidak diburamkan**; paragraf di bawahnya
      buram, memudar ke permukaan, dan **`aria-hidden="true"`**
- [x] Gerbang membawa `aria-label="Locked continuation gate"`
- [x] **Ringkasan saldo di dalam gerbang** (`15.3rb koin` + `+23 bonus`) — supaya
      pembaca tidak perlu melihat ke atas untuk memutuskan
- [x] Empat pilihan **berurutan**: `Chapter ini` 1.500 (utama, terisi) ·
      `10 chapter` 12.000 `5% Off` `1.2rb / bab` · `Buka sampai tamat` 36.900
      `10% Off` · `Tonton iklan` dengan kuota `2/3 hari ini`
- [x] **`Buka otomatis untuk cerita ini` menutup gerbang, tercentang default**,
      dengan satu baris keterangan bahwa bab berbayar berikutnya terbuka 1.500
      masing-masing
- [x] Izin per cerita disimpan **di server** (`readerPrefs.autoUnlockStoryIds`) —
      ia memberi wewenang memotong koin, dan aturan struktur #5 melarang
      `stores/`
- [x] **Sakelar global auto-unlock di panel pengaturan dihapus** — dua sakelar
      untuk satu hal saling membingungkan
- [x] Setelah terbuka (`7y`): buram hilang, badge jadi `CHAPTER TERBUKA` + gembok
      terbuka + `−1.5rb koin`, **saldo berubah di semua tempat sekaligus**
- [x] Toast `Chapter dibuka · −1.5rb koin` (2,6 dtk, `role="status"`), dan baris
      status auto menawarkan `Matikan`
- [x] Toast auto-unlock **berbunyi beda**: `Chapter dibuka otomatis · −1.5rb koin`
- [x] **Saldo kurang adalah lembar (`7z`), bukan toast** — kekurangan tepatnya
      sebagai judul serif (`Kurang 1.200 koin`), harga dan saldo di bawahnya
- [x] Tiga jalan keluar di lembar itu: `Isi koin` (menyorot paket terkecil yang
      cukup) · `Pakai voucher` (dengan jumlah voucher aktif) · `Tonton iklan`
      (dengan kuota)
- [x] Lembar itu menyatakan **membatalkan mengembalikan ke bab yang sama dengan
      gerbang masih terbuka**
- [x] Lembar yang **sama** muncul saat auto-unlock menyala tetapi saldo kurang —
      tidak pernah diam, tidak pernah membeli tanpa izin
- [x] Layar iklan (`7aa`): chip hitung mundur, garis progres, "Bab dibuka setelah
      tayangan selesai", catatan bahwa **kuota dipotong hanya setelah selesai**
      dan membatalkan tidak berbiaya
- [x] Kartu gagal-muat iklan menawarkan `Coba lagi` **dan** `Pakai 1.500 koin`
- [x] Auto-unlock **tetap tidak pernah membeli bundel atau paket tamat** — aturan
      FR-READ-09 yang tidak berubah
- [x] Buka bab **idempoten**: ketukan kedua setelah berhasil tidak pernah menagih
      lagi
- [x] Setelah terbuka, permukaan bacanya **berperilaku sebagai Type A**
- [x] **Test:** bab pertama bergerbang; bab kedua cerita yang sama terbuka tanpa
      dialog; bab pertama cerita **lain** bergerbang lagi
- [x] **Test:** menolak sakelar → tiap bab tetap bergerbang
- [x] **Test:** saldo kurang → lembar tiga jalan keluar, bukan diam
- [x] **Test:** ketukan kedua tidak menagih dua kali
- [x] **Test e2e:** bab pertama → setuju → bab berikutnya mulus → koin habis →
      topup/voucher/iklan, **di dua lebar layar**
- [x] **Pita tawaran bundling** di pembuka bab setelah sepuluh pembukaan
      otomatis — non-blocking, sekali per cerita, hemat dihitung dari
      `individualCoins`, dan menerimanya adalah pembelian **eksplisit**

## `/cerita/:storyId/bab/:chapterId/komentar` — Komentar bab · `ADA` · mockup **`7t`** (halaman) + **`7w`** (lembar)

**Isi yang sama dalam dua wadah.** Tulis sekali, render dua kali — bukan dua
komponen yang kebetulan mirip.

- [x] Pemeriksaan baku
- [x] Kepala: `Komentar bab` serif, rujukan bab, baris hitungan
      `1 KOMENTAR DI BAB INI`, urut `Terbaru ⌄`
- [x] Komposer: `Bagikan pendapatmu tentang bab ini…` **serif**, penghitung
      `0/500` rata kanan di baris label, sakelar `Mengandung spoiler`, `Kirim`
- [x] Utas: nama, `baru saja`, **isi komentar serif**, lalu baris aksi `Suka`
      (hitungan emas) · `Balas` · `Laporkan` · `Blokir pengguna`
- [x] Balasan menjorok di balik **garis 1px** dengan baris aksinya sendiri yang
      lebih kecil
- [x] Daftar utas ditutup `1 dari 1 utas`
- [x] **Varian lembar (`7w`)**: komposer menempel di dasar lembar, latar adalah
      reader yang diredupkan
- [x] **Menutup lembar mengembalikan reader ke posisi gulir yang persis sama**
- [x] Balasan satu tingkat tetap ditegakkan **server**; membalas sebuah balasan
      tetap mendarat di utas yang sama, bukan ditolak
- [x] Bab terkunci tetap **menolak membaca dan menulis** beserta jalan keluarnya
- [x] Komentar yang sedang ditinjau tetap **menempati barisnya** dengan isinya
      diganti keterangan
- [x] **Bilah tab tidak pernah muncul di halaman ini**
- [x] **Test:** buka lembar dari reader lalu tutup → `scrollTop` tidak berubah

---

# D · Perpustakaan — 1 halaman

## `/pustaka` — Perpustakaan · `ADA` · mockup **`7c`**

- [x] Pemeriksaan baku
- [x] Judul `Pustaka` serif + baris hitungan
- [x] Tab teks: Semua · Sedang dibaca · Selesai · Belum dimulai
- [x] **Satu daftar berpembatas** — sampul, judul serif, kata status rata kanan,
      penulis, batang progres hairline dengan `Bab 8 / 88`
- [x] **Empat metrik agregat dan blok hero dihapus** — `7c` tidak punya keduanya,
      dan §1 menyebut daftar mengalahkan kartu
  ↳ Angkanya tidak hilang, ia pindah ke baris hitungan — dan tetap `<dl>` dengan
     empat pasang `<dt>`/`<dd>`. Menggabungnya jadi satu string terlihat sama, dan
     itu justru masalahnya: pembaca layar kehilangan pasangan label–angkanya, dan
     assertion yang menjaga urutan FR-LIB-02 kehilangan pegangannya.
- [x] Progres tetap dihitung dari `ReadingProgress`, bukan disimpan kedua kalinya
- [x] Titik bab baru, "Lanjut Baca", sakelar notifikasi, dan hapus ber-"Urungkan"
      enam detik tetap jalan
- [x] Dua keadaan kosong tetap **berbeda** dan tetap satu kalimat polos
- [x] Saringan pustaka tetap bertahan setelah muat ulang

---

# E · Dompet — 3 halaman

> **Urutan kerjanya di [`todo.md`](todo.md) R8b–R8c.** Layar uang: alur, timer kedaluwarsa, idempotency, dan ledger tidak boleh disederhanakan demi tampilan.

Hanya chip koin yang punya frame. Sisanya diturunkan dari §1 dan §9 brief.

## `/koin` — Isi Koin · `ADA` · tanpa mockup layar penuh · **selesai R8**

- [x] Pemeriksaan baku
- [x] Chip koin sama persis dengan `7a`/`7i`/Type B: glyph emas + saldo ringkas
- [x] **Format saldo seragam di seluruh aplikasi**: `15,3rb` · `12rb` bukan
      `12.0rb` · `800` telanjang
- [x] **Koin bonus tampil terpisah (`+23`) dan tidak pernah dibelanjakan**
- [x] Enam kartu paket jadi **daftar berpembatas atau kartu hairline**, bukan
      ubin bergradien
- [x] Kolom kustom tiga keadaan jadi input garis bawah dengan teks serif
- [x] Paket & kustom tetap saling **menonaktifkan**, dan jalan kembalinya tetap
      ada (`architecture.md` §1.8)
- [x] Empat grup metode + "Terakhir digunakan" ikut kulit baru
- [x] Empat overlay pembayaran, hitung mundur bersama, layar sukses, dan layar
      gagal berkode teknis ikut kulit baru
- [x] Confetti dipertahankan tetapi **tanpa emoji dan tanpa warna aksen baru**
- [x] Datang dari gerbang bab tetap menyorot paket terkecil yang mencukupi, dan
      tombol utama layar sukses tetap "Lanjutkan membaca" ke bab yang sama
- [x] Tiga jalan gagal bayar tetap berbeda aksinya: `PAY-402` · `PAY-504` ·
      `PAY-410`

## `/koin/transaksi` — Riwayat transaksi · `ADA` · tanpa mockup · **selesai R8**

- [x] Pemeriksaan baku
- [x] Brankas saldo jadi panel putih dengan angka **serif**
- [x] Empat saringan jadi tab teks; tetap **meminta ulang barisnya ke server**
- [x] Daftar transaksi jadi baris berpembatas; nominal masuk/keluar memakai tinta,
      **bukan hijau/merah penuh**
- [x] Dua panel analitik ikut kulit baru
- [x] Ekspor CSV tetap menghasilkan berkas nyata

## `/koin/transaksi/:txId` — Detail transaksi · `ADA` · tanpa mockup · **selesai R8**

- [x] Pemeriksaan baku
- [x] Empat status tetap dibaca **dari data**, bukan dari `?status=`
- [x] Lini masa memakai pola pelacak yang sama dengan `7o`–`7r`: tahap selesai
      terisi gelap, tahap kini emas, **tanpa garis penghubung setelah tahap
      terakhir**
- [x] Nomor VA tetap `--nv-font-mono`

---

# F · Author studio — 12 halaman

## `/karya` — Studio penulis · `ADA` · mockup **`7j`**

- [x] Pemeriksaan baku
- [x] Judul `Studio penulis` serif
- [x] Strip **empat sel** di atas putih: Story · Dibaca · Pengikut · **Koin
      (emas)** — angkanya serif
- [x] `Buat story baru` jadi tombol isi gelap
- [x] Baris tautan cepat hairline: Penghasilan · Jadwal terbit · Antrean tinjauan
      · Riwayat cetak
- [x] Delapan tab status jadi tab teks bergaris bawah
- [x] Daftar karya: sampul, judul serif, **kata status berwarna status**, genre +
      tanggal, baca/rating/bab
- [x] **Alasan penolakan dikutip di balik garis bernuansa merah** — garis, bukan
      isi merah
- [x] Baris aksi Edit · Bab · Pratinjau · Analisa, dengan **`Hapus` didorong ke
      kanan sebagai teks redup**
- [x] Tujuh status cerita tetap **diturunkan**, tidak disimpan
      (`architecture.md` §1.9)
- [x] Tiga keadaan kosong tetap berbeda

## `/karya/daftar-penulis` — Daftar sebagai penulis · `ADA` · tanpa mockup · **selesai R9**

> Dikerjakan di [`todo.md`](todo.md) **R9b**.

- [x] Pemeriksaan baku
- [x] Formulir jadi input garis bawah; tingkat penulis tetap ditegakkan **server**

## `/karya/baru` · `/karya/:storyId/ubah` — Formulir cerita · `ADA` · mockup **`7k` `7l`**

Satu komponen dua mode — jangan dipecah saat meredesign.

- [x] Pemeriksaan baku
- [x] **Garis progres empat segmen** di bawah kepala; `Simpan` selalu tersedia
- [x] Langkah 1: pengunggah sampul (slot putus-putus **2:3** + aturan), `Judul
      story` garis bawah serif `0/100`, `Sinopsis` kotak hairline `0/1000` +
      petunjuk panjang minimum, `Nama pena`
- [x] Kategorisasi: genre utama & bahasa jadi **select garis bawah**; genre
      tambahan & tag jadi pill dengan grup `SARAN`
- [x] Pratinjau daftar langkah tersisa di dasar langkah 1
- [x] Langkah 2: Status & visibilitas (target pembaca, visibilitas tiga arah,
      sakelar komentar)
- [x] Langkah 2: Monetisasi + catatan bahwa ia bisa berubah jadi sebagian
      berbayar setelah 10 bab
- [x] Langkah 2: Pengaturan lanjutan (terjemahan, fanfiction, label konten,
      `Dedikasi` `0/300`, `Catatan penulis` `0/1000`)
- [x] `Simpan` isi gelap dengan `Batalkan` sebagai teks redup
- [x] **Batas 100 · 1000 tetap dari PRD, bukan dari mockup** — aturan
      `architecture.md` §1.5 masih berlaku: mockup menentukan susunan, PRD
      menentukan angka
- [x] Penghitung karakter rata kanan **di baris label**, bukan di bawah kolom
- [x] Peringatan monetisasi tetap **terbalik** antara dua mode
- [x] Zona bahaya tetap hanya di mode sunting, dan tetap lewat pola ketik-ulang
      judul — **tanpa isi merah**
- [x] `markDirty` empat efek dan draf yang menyimpan isinya tetap jalan

## `/karya/:storyId/bab` — Kelola bab · `ADA` · tanpa mockup · **selesai R9**

> Dikerjakan di [`todo.md`](todo.md) **R9b**.

- [x] Pemeriksaan baku
- [x] Tiga penghitung tetap merangkap pintasan saringan; jadi strip sel seperti
      `7j`
- [x] Empat pemberitahuan tindak lanjut ikut kulit baru
- [x] Daftar bab enam status jadi daftar berpembatas dengan kata status berwarna
      status
- [x] Menu aksi tetap dibangun dari status
- [x] Penjadwal khusus bab tetap terpisah dari penjadwal cerita

## `/karya/:storyId/bab/baru` · `/karya/:storyId/bab/:chapterId/ubah` — Editor bab · `ADA` · tanpa mockup · **selesai R9**

> Dikerjakan di [`todo.md`](todo.md) **R9b**.

Halaman paling berisiko: yang dipegangnya naskah yang belum tersimpan.

- [x] Pemeriksaan baku
- [x] Area tulis jadi **serif**, ukuran nyaman baca, lebar terkendali
- [x] Bilah alat markdown ikut kulit baru
- [x] Mode fokus menyembunyikan chrome — pola yang sama dengan reader Type A
- [x] **Autosave dua lapis tidak disentuh sama sekali**: lokal 3 detik, server
      30 detik + sekali lagi saat halaman ditinggalkan
- [x] `DRAFT-409` tetap **tidak membekukan editor**, dan tiga jalan keluarnya
      tetap ada
- [x] Pesan gagal tetap menyatakan **tulisanmu aman** — `architecture.md` §1.4
- [x] Panel dwibahasa dengan aturan "lengkap atau tidak ada" tetap jalan

## `/karya/:storyId/bab/:chapterId/akses` — Akses bab · `ADA` · tanpa mockup · **selesai R9**

> Dikerjakan di [`todo.md`](todo.md) **R9b**.

- [x] Pemeriksaan baku
- [x] Tiga tipe akses jadi daftar pilihan berpembatas dengan panel per tipe
- [x] Tombol simpan tetap **membandingkan nilai awal**
- [x] Tiga dialog konfirmasi transisi berisiko ikut kulit baru — **tanpa isi
      merah**
- [x] Empat aturan konteks tetap ditegakkan server

## `/karya/:storyId/analitik` — Analitik cerita · `ADA` · tanpa mockup · **selesai R9**

> Dikerjakan di [`todo.md`](todo.md) **R9b**.

- [x] Pemeriksaan baku
- [x] Lima rentang waktu jadi tab teks; tetap menyaring **di server**
- [x] Empat kartu metrik jadi strip sel; angkanya **serif**
- [x] Grafik SVG dua lapisan: garis dan isi memakai emas dekoratif, **bukan emas
      teks**
- [x] Grafik tetap **menolak dimatikan seluruhnya beserta alasannya**
- [x] Performa per bab jadi daftar berpembatas dengan lencana `Drop`
- [x] Kalender publish tetap diturunkan dari `publishAt`
- [x] Dua ekspor tetap menghasilkan berkas nyata (`window.print()` · `<canvas>`
      → PNG) — **periksa ulang setelah warna berganti**

## `/karya/jadwal` — Jadwal terbit · `ADA` · mockup **`7m`**

- [x] Pemeriksaan baku
- [x] Strip **tiga penghitung**: Terjadwal · Celah · Bentrok
- [x] Tab saringan jadi tab teks
- [x] Tiap entri jadi **kolom tanggal (`AGU 31 · 20.00`) di samping detail bab**,
      dengan `Ubah jadwal` / `Batalkan`
- [x] Dua **catatan kaki serif** tentang penyimpanan UTC dan penjadwal lama
- [x] Waktu tetap disimpan UTC + zona penulis, ditampilkan menurut zona pembaca
- [x] Empat keadaan gagal tetap beda tingkat penyampaiannya: `SCHED-409` sisipan
      · `SCHED-422` inline · `SCHED-200` toast · `SCHED-000` **peringatan, bukan
      kegagalan**

## `/karya/tinjauan` — Antrean tinjauan · `ADA` · mockup **`7n`**

- [x] Pemeriksaan baku
- [x] **Dua penghitung**: Dalam tinjauan · Perlu perbaikan
- [x] Tiap butir: label jenis, judul serif, karya sumber, stempel waktu
      pengajuan, kata status, alasan penolakan bila ada, aksi yang tersedia
- [x] Ditutup **catatan kaki serif** tentang empat sumber antrean
- [x] Antrean tetap **diturunkan** — memperbaiki ceritanya menghapus barisnya
      sendiri (`architecture.md` §1.11)

## `/karya/cetak` — Riwayat cetak · `ADA` · mockup **`7o` `7p` `7q` `7r`**

Empat frame, **satu komponen baris**. Kalau berakhir jadi empat komponen,
redesign-nya salah.

- [x] Pemeriksaan baku
- [x] Saringan jadi tab teks; **hanya baris hitungan dan isi daftar yang
      berubah** antar keempat tampilan
- [x] Garis bawah tab aktif di saringan ini memakai **emas** — satu-satunya tab
      yang begitu (§1)
- [x] Baris: judul serif, jenis (`PDF` emas / `HARDCOPY` redup), baris
      spesifikasi, status + id pesanan + tanggal
- [x] **Pelacak enam tahap**: selesai terisi gelap, tahap kini emas, **tanpa
      garis penghubung setelah tahap terakhir**
- [x] Catatan serif di balik garis emas
- [x] Baris berkas dengan ukuran & kedaluwarsa; harga dengan resi/ETA
- [x] Pill aksi dengan **yang pertama terisi**
- [x] Keadaan kosong tetap **berbeda per tab**
- [x] Invoice `Blob` tetap benar-benar terunduh
- [x] Empat keadaan gagal tetap beda tingkat: `PRINT-504` sisipan · `PRINT-410`
      inline · `PRINT-409` toast · `PRINT-402` **layar penuh yang benar-benar
      menghentikan halaman**
- [x] Peringatan biaya tetap dibaca dari daftar **tanpa saringan** — saringan
      tampilan tidak boleh menyembunyikan keadaan uang

---

# G · Penghasilan penulis — 3 halaman, tanpa mockup

> **Urutan kerjanya di [`todo.md`](todo.md) R9a.** Tangga validasi pencairan lima tingkat ditegakkan dua kali dari satu berkas — menata ulang layarnya tidak boleh menyentuh `lib/payout.ts`.

Brief tidak menggambar satu pun. Diturunkan dari `7j` (strip sel) dan `7o`–`7r`
(lini masa). **Uang: jangan sederhanakan apa pun di sini.**

## `/penulis/analitik` — Penghasilan · `ADA` · tanpa mockup · **selesai R9**

- [x] Pemeriksaan baku
- [x] Tiga KPI berurutan tetap (Pendapatan · Dibaca · Rating) jadi strip sel,
      angka serif
- [x] Empat rentang waktu tetap memakai **enum yang sama** dengan analitik cerita
- [x] Tiga sudut pandang jadi tab teks dan tetap **benar-benar mengganti isi**
- [x] Kurva pendapatan tujuh batang memakai emas dekoratif; **angka per batang
      tetap ada untuk pembaca layar**
- [x] Kurs koin → rupiah dan bagi hasil 80/20 tetap **dinyatakan terang**
- [x] Saldo tersedia tetap **sudah dikurangi** pengajuan yang masih diproses
- [x] Corong pembaca empat tahap tetap dijepit monoton dan tetap menyebut
      ceritanya
- [x] Heatmap rilis tetap **tabel yang terbaca pembaca layar**; sel terpanas
      memakai emas dekoratif bertingkat, bukan skala warna baru
- [x] Tautan ke penjadwal tetap membuka dengan waktunya **sudah terisi**

## `/penulis/penarikan` — Tarik penghasilan · `ADA` · tanpa mockup · **selesai R9**

- [x] Pemeriksaan baku
- [x] Saldo, batas minimum, dan estimasi 1–3 hari kerja tetap tampil **sebelum**
      formulir
- [x] Rekening tersamar + status verifikasinya; **rekening tidak pernah dikirim
      penuh**
- [x] Kolom jumlah jadi input garis bawah serif, tetap menerima format apa pun
- [x] Ringkasan tiga baris tetap dihitung tiap ketikan, bersih tetap **dijepit
      ≥ 0**
- [x] **Tangga validasi lima tingkat tidak disentuh** — berhenti di kesalahan
      pertama, mematikan tombol sebelum ditekan, ditegakkan server dari berkas
      yang sama (`architecture.md` §1.15)
- [x] Saldo tetap langsung ditahan setelah pengajuan berhasil

## `/penulis/penarikan/riwayat` — Riwayat pencairan · `ADA` · tanpa mockup · **selesai R9**

- [x] Pemeriksaan baku
- [x] Daftar berpembatas: tanggal, jumlah, biaya, bersih, rekening tersamar,
      status
- [x] Lini masa tiga tahap memakai pola pelacak `7o`–`7r`, dan tetap **hanya
      untuk yang masih di jalurnya** — pengajuan ditolak membawa alasannya, bukan
      lini masa yang menyiratkan uangnya masih jalan
- [x] Bukti transfer tetap terunduh sebagai berkas nyata
- [x] Rantai koin → rupiah tetap dijelaskan utuh dengan contoh nyata

---

# H · Profil & pengaturan — 6 halaman, semuanya `PENAMPUNG`

Belum pernah dibangun; rencananya Fase 13. **Dua di antaranya punya mockup
putaran 7**, jadi keduanya dibangun sekarang di R5 — brief §10 memintanya, dan
membangunnya nanti berarti membangunnya dua kali.

## `/profil` — Profil · `PENAMPUNG` · mockup **`7i`** · dibangun di R5

- [x] Label `PROFIL`, avatar, **nama serif**, baris keanggotaan, `Sunting`
      hairline
- [x] Panel koin putih: `KOIN KAMU`, **saldo serif**, jumlah voucher aktif,
      tombol `Isi Koin` terisi
- [x] Strip tiga sel statistik
- [x] Daftar `AKUN`: Riwayat transaksi · Voucher saya · Pengaturan baca ·
      Notifikasi · Karya saya · Bantuan — ikon, label, nilai rata kanan, chevron
- [x] `Keluar` sebagai **teks redup**, bukan tombol merah
- [x] Saldo di sini adalah **titik ke-5** dari enam yang dijanjikan FR-WALLET-17
      — dibaca dari server, tidak pernah disimpan halaman
- [x] Pemeriksaan baku
- [x] **Test:** saldo di profil sama dengan saldo di bilah atas dan di `/koin`

## `/profil/ubah` — Ubah profil · `PENAMPUNG` · tanpa mockup

- [ ] Kalau dibangun: input garis bawah, unggah avatar mengikuti pola pengunggah
      sampul `7k`

## `/profil/koneksi` — Pengikut & mengikuti · `PENAMPUNG` · tanpa mockup

- [ ] Kalau dibangun: dua tab teks + daftar `UserRow` berpembatas

## `/pengguna/:userId` — Profil pengguna · `PENAMPUNG` · tanpa mockup

- [ ] Kalau dibangun: anatomi `7i` tanpa panel koin dan tanpa daftar `AKUN`

## `/pengaturan/bahasa` — Bahasa & wilayah · `PENAMPUNG` · tanpa mockup

- [ ] Kalau dibangun: daftar pilihan berpembatas, bukan kartu

## `/pengaturan/keamanan` — Keamanan · `PENAMPUNG` · tanpa mockup

- [ ] Kalau dibangun: blok "Data & akun" tetap **di dalam halaman ini**, bukan
      rute sendiri
- [ ] Hapus akun tetap lewat pola ketik-ulang, **tanpa isi merah**

---

# I · Sosial, notifikasi & hadiah — 3 halaman, semuanya `PENAMPUNG`

Tidak ada frame putaran 7 dan belum pernah dibangun. Bukan pekerjaan Fase R —
dicatat di sini supaya tidak ada yang membangunnya dengan palet lama.

## `/notifikasi` — Notifikasi · `PENAMPUNG` · Fase 11

- [ ] Kalau dibangun: daftar berpembatas, penanda belum-dibaca berupa **titik
      emas**, bukan latar berwarna

## `/notifikasi/pengaturan` — Preferensi notifikasi · `PENAMPUNG` · Fase 11

- [ ] Kalau dibangun: baris sakelar seperti lembar `7s`

## `/hadiah` — Pusat hadiah · `PENAMPUNG` · Fase 12

- [ ] Kalau dibangun: "420 koin hadiah" jadi **metrik periode berjalan**, bukan
      saldo kedua
- [ ] Saldo di sini adalah **titik ke-6** dari enam yang dijanjikan FR-WALLET-17

---

# J · Bantuan & legal — 3 halaman, semuanya `PENAMPUNG`

## `/bantuan` — Pusat bantuan · `PENAMPUNG` · Fase 13

- [ ] Kalau dibangun: daftar FAQ buka-tutup berpembatas, isi jawaban **serif**

## `/legal/ketentuan` — Ketentuan Layanan · `PENAMPUNG` · Fase 13

- [ ] Kalau dibangun: satu kolom teks **serif**, lebar terkendali

## `/legal/privasi` — Kebijakan Privasi · `PENAMPUNG` · Fase 13

- [ ] Kalau dibangun: sama dengan `/legal/ketentuan`

---

# K · Dev & 404

## `/dev/kitchen-sink` — Kitchen sink · `ADA`

- [x] Seluruh primitif baru tampil di sini, **terang dan malam**, sebelum
      halaman mana pun memakainya
- [x] Enam sakelar dev yang sudah ada tetap jalan: tiga sesi, tiga hasil
      pembayaran, kegagalan autosave, keputusan admin antrean tinjauan
- [x] Halaman ini tetap mahal dimuat pertama kali — e2e yang melewatinya tetap
      butuh `test.setTimeout` sendiri

## `*` — 404 · `ADA`

- [x] Satu kalimat polos tinta redup + satu tombol kembali. **Tanpa ilustrasi.**

---

## Setelah semuanya

- [x] `tests/e2e/isi-koin-di-hp.spec.ts` — **dua puluh delapan halaman** di lima
      lebar, ditambah **empat halaman auth** yang perlu keluar dulu dan sembilan
      halaman di sapuan target ketuk; tambahkan halaman baru ke daftar itu,
      **bukan berkas e2e baru**
- [x] Bilah aksi apa pun di dalam `AppShell` tetap memakai
      `bottom-[var(--nv-bottom-nav)]`, bukan `bottom-0`
- [x] Halaman `topbar` tetap **tidak menulis kepala halamannya sendiri** —
      `TopBarLayout` sudah merender `<h1>` dan tombol kembali
- [x] `npm run check` bersih dan `npm test` lulus di tiap akhir bagian, bukan
      sekali di akhir semuanya
