# Changelog

Satu entri per permintaan. Format: tanggal, permintaan apa adanya, lalu apa yang
benar-benar berubah — termasuk yang **tidak** dikerjakan dan alasannya.

---

## 2026-09-05 · Langkah 69 — Fase R9 selesai, dan Fase R tuntas

> "oke sekarang lanjutkan redesign. Kerjakan semua Fase R9, dan jangan lupa untuk
> selalu test di preview mobile dan website untuk memastikan semua func berjalan
> dan tampilan clean di layar apapun"

`npm run check` bersih · **588 test unit** (naik dari 586) · **83 e2e** (naik dari
80). Diperiksa di peramban sungguhan pada **320 · 360 · 390 · 412 · 430** dan
**1280**.

**23 kotak R9 selesai** — R9a tiga halaman penghasilan, R9b enam rute studio,
R9c halaman ulasan, R9d penutup. Di `todo-redesign.md`: 79 kotak, dan dengan itu
**ketiga puluh rute `ADA` tercentang**. **Fase R tuntas.**

Yang **tidak** dicentang: 13 kotak milik rute `PENAMPUNG` (`/profil/ubah`,
`/notifikasi`, `/hadiah`, `/bantuan`, `/legal/*`, dua halaman pengaturan). Isinya
masih `<Placeholder>`, dan halaman yang belum ada tidak bisa "sudah diredesign".
Ketiganya menunggu Fase 11–13.

### Nol komponen baru

Aturan R8–R9 sama: rute tanpa mockup diturunkan dari `prd_01` §0, dan pola yang
belum ada harus ditanyakan dulu. Yang dipakai semuanya sudah berdiri — `Tabs`,
`SectionHeader`, `StageTrack`, `Slider`, `SettingRow`, `Input`/`TextArea`, dan
`Cover`. Tidak ada berkas komponen baru sama sekali di R9, dan **`lib/payout.ts`
tidak disentuh satu baris pun** — tangga validasi lima tingkatnya tetap
ditegakkan dua kali dari satu berkas.

### R9a — tiga halaman penghasilan

- `/penulis/analitik`: empat rentang dan tiga sudut pandang jadi **tab teks**;
  tiga KPI jadi strip sel `7j` di atas satu panel putih — `Rp 293.485` sebelumnya
  **terpotong** di dalam kartunya sendiri.
- Kurva pendapatan, batang corong, batang sumber, dan sel terpanas heatmap semua
  pindah ke **emas garis**: batang progres memang salah satu dari enam peran
  emas, dan tinta membuat grafiknya terbaca sebagai deretan tombol.
- Aksi uang jadi tombol utama; sebelumnya ketiga aksinya bergaris rambut, jadi
  tidak ada yang menunjukkan ke mana halaman itu menuju.
- `/penulis/penarikan`: brankas panel putih angka serif, kolom jumlah jadi input
  **garis bawah serif** lewat `Input` yang sudah ada, tiga tujuan jadi daftar
  berpembatas, ringkasan jadi baris berpembatas. Tangga validasinya tidak
  disentuh.
- `/penulis/penarikan/riwayat`: kartu → daftar berpembatas; alasan penolakan jadi
  garis di tepi, bukan kotak merah.

### R9b — enam rute studio

- `/karya/daftar-penulis`: tiga prasyarat → `SettingRow`, daftar berpembatas.
- `/karya/:id/bab`: tiga penghitung jadi strip sel di satu panel putih dan tetap
  merangkap pintasan saringan — penandanya kini **garis bawah**, bukan latar.
  Daftar bab jadi baris berpembatas dengan **kata status berwarna status**, bukan
  enam lencana terisi.
- `/karya/:id/bab/:id/ubah`: area tulis dapat jarak baris prosa dan lebar ukur
  ~70 karakter. **Tanpa token ukuran baru** — `TextArea` sudah Lora 16px.
- `/karya/:id/bab/:id/akses`: tiga tipe akses jadi daftar pilihan berpembatas
  dengan bulatan tercentang — bentuk yang sama dengan paket koin dan metode
  bayar. Penggeser pratinjau naik ke primitif `Slider`, jadi nilainya akhirnya
  dibacakan lewat `aria-valuetext`.
- `/karya/:id/analitik`: lima rentang jadi tab teks, empat metrik jadi strip sel,
  garis grafik jadi emas garis, dan pengurut bab turun ke barisnya sendiri —
  di slot aksi kepala section ia mendorong halaman **21px keluar layar di
  320px**. Terukur, bukan ditebak.
- Kedua ekspor diperiksa ulang setelah warnanya berganti dan tetap menghasilkan
  berkas nyata.

### R9c — halaman ulasan

Sebaran 5★…1★ jadi batang garis rambut berangka emas dan tetap **tidak ikut
tersaring**. Baris ulasan memakai anatomi `7t`: nama, waktu, **isi serif**, lalu
baris aksi, dipisah garis rambut — enam kartu putih beruntun membuat halaman ini
terbaca sebagai enam pengumuman, bukan satu percakapan. Tanggapan penulis dapat
garis emas di tepi dan lencana pil garis rambut. Tujuh saringan dan empat urutan
jadi dua deret tab teks, keduanya tetap menyaring **di server**.

Satu perubahan perilaku yang disengaja: saringan jadi **satu pilihan aktif** —
"Ada teksnya" dan sebuah bintang tidak lagi bisa menyala bersamaan. Itu memang
yang sudah disiratkan tombol "Semua" sejak awal.

### Empat cacat data & isi — diperbaiki di penyebabnya

Rincian di `architecture.md` **§1.30**.

1. **Sembilan bab milik penulis contoh tidak punya naskah sama sekali.** Sisi
   pembaca punya naskah cadangan; sisi penulis tidak — dan tidak boleh punya.
   Jadi `/karya/ms1/bab` menulis *"sekitar 620 kata · 41%"* sementara editornya
   **terbuka kosong**, dan autosave, hitungan kata, serta mode fokus mustahil
   dicoba dengan tangan. Naskahnya kini di-seed, dan `wordCount`-nya dihitung
   dari naskah itu.
2. **Sembilan belas cerita punya jumlah baca negatif.** `890_000 - i * 21_000`
   benar untuk 32 judul; R2b menumbuhkan katalog jadi 62, dan sejak judul ke-43
   angkanya menembus nol — `/cari` mencetaknya sebagai **`−160rb baca`**. Kelas
   cacat yang sama dengan `IntersectionObserver`: muncul karena **datanya**
   bertambah, bukan karena kodenya berubah.
3. **"0% · naik 4%".** Tingkat buka diturunkan, perubahannya dipatok konstanta —
   jadi layar penghasilan bisa menyatakan angka nol yang naik empat persen.
   Keduanya kini lewat satu `pct()` yang mengembalikan nol untuk nol lawan nol.
4. **Panel sentimen menyebut sumber yang salah.** Persentasenya dari bintang
   ulasan, keterangannya berbunyi "Dari 10 komentar" — dan pada cerita tanpa
   ulasan layarnya membaca "0% · 0% · 0% · Dari 10 komentar".

### Dua penyempurnaan kecil (§1.31)

**404** berhenti memakai `FailureNotice` layar penuh: kotak R9d menuntut satu
kalimat dan satu tombol **tanpa ilustrasi**, dan panel "koinmu aman" di bawah
tautan yang salah ketik justru menyiratkan ada yang bisa hilang. **Bab yang
ditolak** berhenti berkata "Belum ada bab di sini" — kalimat keadaan-kosong yang
muncul di bawah bab yang jelas-jelas ada.

### Test

- Sepuluh rute R9 **sudah ada** di sapuan lima lebar sejak fase-fase sebelumnya;
  diperiksa ulang dengan menghitungnya, bukan diasumsikan. Sapuan target ketuk
  bertambah `/penulis/analitik`, `/karya/ms1/bab`, dan `/cerita/s1/ulasan`.
- Dua test unit baru untuk **pemulihan posisi baca per bab** — sisi server sudah
  diuji sejak R7, sisi yang dilihat pembaca belum. Keduanya bisa benar di
  database dan tetap salah di layar.
- Empat belas test yang aturannya sengaja berubah **dibalik, bukan dilonggarkan**:
  pil → tab (`role="tab"`), kartu → `<li>`, `progressPct` 41 → 43 karena kini
  diturunkan, dan penyebut sentimen yang berpindah dari komentar ke ulasan.
- Penghitung `/karya/:id/bab` mendapat `aria-label` eksplisit: angkanya kini di
  atas labelnya, dan nama yang dirakit dari urutan DOM ("2 Draf") berubah arti
  tiap kali susunannya digeser — sekaligus ambigu bagi pembaca layar.

### Yang tidak dikerjakan

- **`AuthorChapter` tidak diberi kolom alasan penolakan.** Baris bab yang ditolak
  kini menyebut langkah berikutnya, bukan alasannya, karena alasannya memang
  belum ada di kontrak. Menambah kolomnya pekerjaan tersendiri, bukan pekerjaan
  ganti kulit.
- **`Button` tidak dijadikan polimorfik.** Tiga tautan yang berperan sebagai
  tombol memakai kelas yang ditulis sekali di berkasnya — sama seperti yang sudah
  dilakukan `ProfilePage` dan detail transaksi. Menyentuh primitif yang dipakai
  ~190 tempat demi tiga tautan bukan tukaran yang masuk akal.

---

## 2026-09-05 · Langkah 68 — Fase R8 selesai: auth & dompet

> "oke sekarang lanjutkan redesign. Kerjakan semua Fase R8, dan jangan lupa untuk
> selalu test di preview mobile dan website untuk memastikan semua func berjalan
> dan tampilan clean di layar apapun"

`npm run check` bersih · **586 test unit** (naik dari 583) · **80 e2e** (naik
dari 75). Diperiksa di peramban sungguhan pada **320 · 360 · 390 · 412 · 430**
dan **1280**.

**24 kotak R8 selesai seluruhnya** — R8a empat halaman auth, R8b `/koin`, R8c
buku besar dan detail transaksi. Di `todo-redesign.md`: grup **A** 15 kotak,
grup **E** 22 kotak.

### Tidak ada komponen baru yang dikarang

Aturannya eksplisit di R8: tujuh rute ini tanpa mockup, dan pola yang belum ada
harus ditanyakan dulu. Yang dipakai semuanya sudah berdiri — `Field` (garis bawah
serif), `Button`, `Tabs`, `SectionHeader`, `StageTrack`, `Cover`, `CoinChip`.
Dua primitif bertambah **prop**, bukan varian: `CoinChip` mendapat `pill` (bentuk
`7a`, yang sebelumnya ditempel lewat kelas di beranda saja) dan `bonus`. Satu
berkas baru, `PasswordToggle`, dan itu penggabungan kontrol yang sudah ditulis
dua kali — bukan pola baru.

### R8a — empat halaman auth

- `/masuk` akhirnya punya `<h1>`. `AuthLayout` merender nama aplikasi sebagai
  `<p>`, jadi selama ini halaman itu **tidak punya judul sama sekali** bagi
  pembaca layar; `/daftar` dan `/lupa-sandi` sudah punya.
- Tombol OAuth jadi **pil bergaris rambut**; warna merek Google/Facebook tetap.
- Sakelar "Lihat / Sembunyikan" kata sandi pindah ke slot `counter` milik
  `Field` — sejajar label, teks tebal tinta redup. Sebelumnya kotak setinggi
  44px di samping kolom, yang memotong garis bawah kolom di tengah baris.
- `/lupa-sandi`: tiga kotak bernomor → **garis bersegmen `7k`** + keterangan
  `LANGKAH 1 DARI 3 · IDENTIFIKASI`. Catatan keamanan berhenti jadi kartu.
- `/mulai`: segmen langkah jadi **emas garis**, dan langkah tiga berhenti jadi
  tumpukan kartu — kini daftar berpembatas yang **benar-benar menampilkan
  sampulnya**. Sampai R8 baris rekomendasi itu cuma judul dan nama pena.
- Ketiga kegagalan sesi diperiksa satu per satu di peramban dan tetap tiga
  tingkat berbeda: lembar `AUTH-401`, layar penuh `AUTH-429`, layar `APP-426`.

### R8b — `/koin`

- Enam paket: ubin dua kolom → **daftar berpembatas** (brief §1 aturan 4). Ubin
  itu juga yang memecah `Rp 92,5/koin` jadi dua baris di 320px.
- Metode pembayaran ikut jadi daftar berpembatas dengan kepala section per grup.
- Chip saldo di kepala halaman **sama persis dengan `7a`**, dan koin bonus
  ditulis terpisah (`+23 bonus`) karena ia tidak pernah bisa dibelanjakan.
- Ruang bawah halaman dinaikkan: `pb-28` hanya menampung bilah bayar, sehingga
  baris kurs terakhir tertutup olehnya.
- Empat overlay, hitung mundur, layar sukses, dan **ketiga jalan gagal** dibuka
  satu per satu di peramban. `PAY-402` menawarkan ganti metode atau ulangi;
  `PAY-504` hanya "Periksa status" — tidak pernah "coba lagi"; `PAY-410` menuntut
  pesanan baru. Confetti tetap ada, tanpa emoji dan tanpa warna di luar token.

### R8c — buku besar & detail transaksi

- Brankas saldo jadi **panel putih dengan angka serif** (`7i`), lengkap dengan
  koin bonus terpisah.
- Empat saringan: pil → **tab teks bergaris bawah 2px**. Yang tidak berubah:
  menekannya tetap meminta ulang barisnya ke server.
- Nominal baris jadi **tinta**, bukan hijau/merah penuh. Yang membedakan masuk
  dari keluar adalah tandanya; merah tinggal di lencana status yang memang gagal.
- Panel "Status kuitansi" berhenti mencetak nilai enum (`success`, `reversed`) —
  satu-satunya bahasa Inggris yang tersisa di layar pembaca, dan itu ada di
  halaman uang. Peta pengeluaran ikut memakai label yang sama.
- **Detail transaksi mendapat lini masanya** — `StageTrack`, komponen yang sama
  dengan riwayat cetak `7o`–`7r`. Tahap selesai tinta, tahap kini **emas**, dan
  tahap terakhir tidak menumbuhkan garis penghubung.
- Lini masa **hanya untuk yang masih di jalurnya**: `failed` dan `reversed`
  tidak mendapat satu pun tahap. Aturan yang sama sudah dipegang riwayat
  pencairan sejak Fase 9.

### Empat cacat yang bukan soal kulit — diperbaiki di penyebabnya

Rincian di `architecture.md` **§1.27**.

1. **`bg-nv-surface` sudah mati sejak R1.** Putaran 7 mengganti nama tokennya;
   16 tempat masih memakai kelas lama, dan Tailwind tidak mengeluh untuk kelas
   yang tidak dikenal. Terukur di peramban: `backgroundColor: rgba(0, 0, 0, 0)`.
   Enam belas panel dirender **transparan** selama tiga fase — brankas saldo,
   panel status transaksi, kotak hitung mundur, batang progres perpustakaan.
   Diganti sekali ke `--nv-paper-2`.
2. **`formatCompactCoin` memakai titik sebagai desimal.** Di Indonesia titik
   adalah pemisah ribuan, jadi `15.3rb` terbaca sebagai lima belas ribu tiga
   ratus **ribu**. Mockup `7a` dan `7i` mencetak `15,3rb`; kodenya yang meleset.
3. **Tidak ada satu pun akun baru yang pernah melihat `/mulai`.** React Query
   menunggu `onSuccess` milik mutasinya — tempat `setSession` dipanggil —
   sebelum `onSuccess` milik halaman, jadi `RequireGuest` menyala satu render
   sebelum `navigate('/mulai')` sempat jalan dan melempar pendaftar ke beranda.
   Onboarding tiga langkah **tidak pernah tampil kepada siapa pun**. Diperbaiki
   di guard-nya, bukan di halaman daftar: yang memutuskan ke mana pengguna yang
   sudah masuk pergi memang `RequireGuest`.
4. **`AuthLayout` memakai `grid` tanpa kolom eksplisit.** Track `auto` tidak
   pernah turun di bawah min-content anaknya, jadi satu baris `truncate` di
   langkah tiga `/mulai` melebarkan wadahnya jadi **343px di dalam layar 320px** —
   dan luberannya muncul di header, jauh dari penyebabnya. Jebakan yang sama
   sudah menyentuh 13 tempat di v1; `AuthLayout` luput karena keempat halamannya
   belum pernah disapu lima lebar sampai R8 memasukkannya.

### Pelacak tahap diseragamkan (§1.28)

`StageTrack` dipakai empat tempat. Tahap kini jadi **emas** — brief §1 menjatah
emas enam peran dan "tahap aktif pelacak" salah satunya, dan `7o`–`7r`
menggambarnya begitu. Sampai R8 tahap kini memakai tinta juga, sehingga satu-
satunya beda dari tahap selesai adalah centangnya. Berlaku sekaligus untuk
riwayat cetak, riwayat pencairan, dan pengajuan pencairan.

### Test

- **Sapuan lima lebar** bertambah `/koin/transaksi/tx1` dan satu test baru untuk
  keempat halaman auth. Halaman auth harus terpisah: perangkat contoh memulai
  dalam keadaan sudah masuk, jadi `goto('/masuk')` mendarat di beranda dan
  sapuan itu akan diam-diam mengukur halaman yang salah.
- Test auth itu **mendaftar akun baru** untuk sampai ke `/mulai`, jadi ia
  sekaligus regresi atas cacat nomor 3 di atas.
- **Sapuan target ketuk** bertambah `/koin`, `/koin/transaksi`, dan
  `/koin/transaksi/tx1`. Ia langsung menangkap tombol kembali `/koin` yang
  36×36; kotak sentuhnya diperluas lewat `::after`, ukuran yang terlihat tidak
  berubah. Tombol kembar di `/karya/:id/bab` ikut diperbaiki.
- Dua test unit baru untuk lini masa transaksi: kapan ia ada, dan **kapan ia
  tidak boleh ada**.

### Probe target ketuk yang lulus di atas kerangka

`expect.poll(...).toEqual([])` selesai pada sampel kosong yang **pertama** — dan
halaman yang masih memuat memang belum punya satu pun tombol. Jadi probe itu bisa
lulus tanpa pernah mengukur halaman yang sudah jadi, persis jebakan "menunggu hal
yang sudah benar sejak awal" (`CLAUDE.md` §8). Ketahuan karena `/pustaka` — yang
lulus berkali-kali — gagal sekali dengan **tiga target sungguhan**: judul cerita
(140×17), `Lanjut Baca` (95×36), dan sakelar notifikasi (44×26). Ketiganya ada
sejak R5.

Probe-nya kini menjawab `['(masih memuat)']` selama masih ada kerangka di layar,
jadi ia tidak pernah bisa lulus terlalu dini. Ketiga targetnya diperbaiki lewat
`::after` — sakelarnya di **primitifnya**, jadi seluruh `Switch` di aplikasi ikut
benar, dan jalurnya tetap 26px seperti yang brief minta.

### Satu flake e2e ditutup, bukan dilonggarkan

`baca menerus melewati tawaran bundel` lulus sendirian dan gagal di suite penuh.
Sebabnya pengukur, bukan produk: pitanya setinggi ~90px sementara pemeriksanya
memotret dari luar tiap 80 ms sesudah gulir 2000px — satu gulir bisa melewatinya
utuh di antara dua potret. Pengamatnya dipindah **ke dalam halaman** dan berjalan
tiap `requestAnimationFrame`, jadi tidak ada celah pengambilan sampel sama
sekali. Tuntutannya tidak dilemahkan: pita tetap harus benar-benar masuk layar.

### Yang tidak dikerjakan

- **`/dev/kitchen-sink` tidak ikut ditata ulang.** Ia halaman dev, dan tiga
  kotaknya bukan bagian R8. Yang disentuh hanya satu kalimat yang menyesatkan:
  sakelar hasil pembayaran hidup di memori modul, jadi memuat ulang `/koin`
  mengembalikannya ke `Lunas` — teksnya dulu menyuruh "buka `/koin`", yang persis
  cara kehilangan sakelarnya.
- **Kotak `Pemeriksaan baku` halaman lain tidak ikut dicentang.** R8 menyentuh
  primitif bersama (`StageTrack`, `CoinChip`, `bg-nv-surface`), tetapi mencentang
  kotak halaman yang belum diperiksa satu per satu akan membuat berkas rencana
  berbohong.

---

## 2026-09-05 · Langkah 67 — saldo contoh 20.000, dan tiga cacat rantai baca

> "saya tidak suka ini, mengapa koinya anda lebihkan saja hingga bisa buka lebih
> dari 10 chapter kemudian baru opsi penawaran muncul, dan ketika koin habis baru
> muncul untuk opsi melakukan topup"

`npm run check` bersih · **583 test unit** · **75 e2e** (naik dari 74).

### Saldo contoh 15.300 → 20.000

Angkanya dihitung dari harga bab sungguhan, bukan dibulatkan asal: sepuluh bab
berbayar berjumlah **17.200** (tawaran bundel muncul), bab ke-11 masih terbuka,
bab ke-12 kurang. Satu sesi baca menerus kini melewati **kedua** fitur uangnya.

**Ini membatalkan keputusan §1.21** yang menahan saldo di 15.300 demi kecocokan
dengan mockup. Akibat yang diterima: angka `15,3rb` yang tercetak di `7a`, `7x`,
dan `7i` berhenti cocok — ketiga mockup itu jadi usang pada satu angka. `prd_05`
dan `prd_00` ikut direvisi pada giliran yang sama.

Sakelar dev tidak dihapus; alasannya berubah. Dulu ia satu-satunya cara melihat
pitanya, sekarang ia untuk **mencoba ulang** setelah tawarannya ditolak.

### Terukur, dengan satu ketukan saja

Masuk di bab 8, setuju sekali di gerbang, lalu **hanya menggulir**: pita tawaran
bundel muncul di **bab 17** (*"Sudah 10 bab terbuka otomatis · 12.000 koin —
satuannya 17.200 koin"*), dan lembar isi koin di **bab 18** (*"Kurang 1.200 koin
· Bab 18 butuh 1.800 koin"*).

### Tiga cacat yang ditemukan sepanjang jalan

Ketiganya lolos typecheck, lolos 583 test unit, dan lolos e2e yang ada — semuanya
hanya terlihat dengan benar-benar menggulir. Rinciannya `architecture.md` §1.26.

1. **Sentinel penyambung berhenti menyala** setelah menetap di layar. Bacaan
   mandek di bab kedua; 250 kali gulir tidak memajukannya.
2. **Memangkas bab dari depan menarik pembaca mundur**, dan kompensasi gulir
   tidak menyelamatkannya. Pemangkasannya dibuang.
3. **Pita bundel dirender di pembuka bacaan** — tempat pembaca sudah lama
   tinggalkan saat pitanya "didapat".

### Satu koreksi atas pengukuran saya sendiri

Saya sempat melaporkan pitanya ada di −6.828px. Pemilih yang saya pakai
(`article aside`) juga mengenai slot iklan, jadi yang terukur bukan pitanya.
Kesimpulannya kebetulan benar; pengukurannya tidak.

---

## 2026-09-05 · Langkah 66 — PRD v2 diselaraskan dengan kode

> "tolong update prd juga di folder PRD Novelova di project novelova-v2"

**Enam berkas PRD disunting, sembilan catatan revisi bertanggal.** Nol baris kode
berubah; `npm run check` bersih dan 583 test tetap lulus.

Ini penyuntingan yang **diminta eksplisit**, jadi aturan `CLAUDE.md` §5 berlaku
penuh: tiap suntingan membawa catatan revisi bertanggal yang menyebut versi
lamanya, dan berkas lain yang menyinggung hal sama diselaraskan pada giliran yang
sama.

| Berkas | Yang direvisi |
|---|---|
| `prd_05` | Alur baca **menerus** menggantikan alur berhalaman · **FR-READ-15 dicabut dan diganti** · posisi baca per bab · lembar saldo kurang menggantikan toast |
| `prd_03` | Susunan beranda (tiga section prioritas naik, berhenti tersaring tab) · seluruh section genre jadi rel 80px · kartu tinggal sampul + judul · zoom sampul |
| `prd_00` | Lencana hemat "±5%" dicabut dari tabel harga · rujukan FR-READ-15 diberi keterangan |
| `prd_01` | **§0.9 baru** — target ketuk 44px lewat kotak sentuh, bukan tombol yang dibesarkan |
| `prd_10` | Tiga statistik profil diganti dan **diturunkan**, bukan penghitung · panel koin · nama depan · `Keluar` teks redup |
| `prd_07` | **Catatan selisih yang belum ditutup**: rentang harga bab 1–50 vs 1.500–2.000 di dua PRD lain |

### Satu yang tidak diperbaiki, dan disebut terang

Rentang harga bab `1–50` di `prd_07` **tidak mungkin benar bersamaan** dengan
1.500–2.000 di `prd_00` dan `prd_05`, maupun dengan paket koin terbesar yang
hanya 2.000. Ia sengaja dibiarkan sejak R4 dirancang. Yang berubah hari ini
hanyalah bahwa selisihnya kini **tertulis di PRD-nya sendiri**, bukan hanya di
`architecture.md` §1.21 — supaya siapa pun yang menyentuh angka itu tahu ada tiga
tempat yang harus berubah bersamaan.

---

## 2026-09-05 · Langkah 65 — R4b selesai: ruang baca menerus

> "kerjakan sekarang dulu yang perubahan chapter unlock"

`npm run check` bersih · **583 test unit** · **74 e2e** (naik dari 72).

### Terukur di peramban, bukan diasumsikan

Masuk lewat bab 1, lalu **menggulir saja**: URL berjalan sendiri sampai bab 8,
lima garis pemisah muncul, dan **tepat satu gerbang**. Setuju sekali di gerbang
itu, lanjut menggulir tanpa satu pun ketukan lagi: URL berjalan dari **bab 8 ke
bab 15** — tujuh bab terbeli diam-diam.

### Yang dibuang

Tombol `Bab sebelumnya`/`Bab berikutnya`, penutup bab `Bab 4 ›`, toast
`Chapter dibuka otomatis`, dan lencana `CHAPTER TERBUKA` untuk pembukaan
otomatis. Pembukaan yang **ditekan pembaca** tetap berbunyi — ia menekan sesuatu
dan berhak tahu apa yang terjadi.

### Yang tidak dibuang, dan tidak boleh

Gerbang `7x` di bab berbayar pertama tiap cerita, baris status `Buka otomatis
aktif` + `Matikan`, catatan buku besar, dan lembar `7z` saat saldo habis.

`READER_UNLOCK_FEEDBACK` disiapkan dengan dua nilai — `'none'` (bawaan) dan
`'balance'` — satu konstanta di `lib/coin.ts`.

### Tiga cacat yang hanya terlihat dengan menggulir

1. **Pengamat tidak pernah terpasang** — efek berdeps `[]` membaca `ref.current`
   saat halaman masih menampilkan skeleton. Rantainya tidak pernah tumbuh.
   Diperbaiki dengan callback ref.
2. **Enam gerbang bertumpuk** — rantai terus tumbuh melewati bab terkunci.
   Gerbang sekarang jadi dinding.
3. **Gerbang di tengah rantai tidak punya harga** — `useUnlockOptions` masih
   mengikuti bab entri, jadi tombol `Chapter ini` tidak pernah muncul.

Tidak satu pun muncul di typecheck maupun test yang ada.

### Tiga test lama dibalik

Dua di `ReaderPage.test.tsx` dan satu di `baca-bab-gratis.spec.ts` menjaga
keberadaan tombol prev/next. Sekarang mereka menjaga **ketiadaannya** — test
yang dihapus tidak menahan apa pun.

---

## 2026-09-05 · Langkah 64 — rencana ruang baca menerus (R4b)

> "mengapa konsep auto unlock nya otomatis terbuka setiap next chapter? yang saya
> inginkan adalah misal user start chapter 5, dan di chapter 6 terkunci nah itu
> proses pergantian chapter jangan ada opsi button buka berikutnya. YANG SAYA MAU
> DIA BACA TERUS MENERUS SECARA VERTICAL DAN DIKASIH GARIS TIPIS UNTUK TANDAI
> BAHWA INI SUDAH ADA DI NEXT CHAPTER. TUJUAN SAYA ADALAH INGIN USER TERUS
> MEMBACA DAN TIDAK SADAR BAHWA KOIN NYA OTOMATIS MEMBUKA CHAPTER YANG TERKUNCI."

**Rencana, belum implementasi.** `todo.md` **R4b** (30 kotak) dan
`architecture.md` **§1.25**. Nol baris kode berubah.

### Apa yang salah saya pahami di R4

R4 membangun auto-unlock sebagai **pembukaan per halaman**: tiap bab punya
alamatnya sendiri, dan bab berikutnya terbuka sendiri di halaman baru. Itu
memenuhi kalimat "buka terus menerus sampai koin habis" tetapi melewatkan
intinya — perpindahan babnya masih terasa, dan itu justru yang harus hilang.

### Empat keputusan, dikonfirmasi

Jejak potongan koin: **tidak ada sama sekali** · pemisah bab: **garis rambut
polos** · tombol bab: **dibuang**, URL ikut bab yang terlihat · komentar:
mengikuti bab yang terlihat.

Ditambah satu permintaan: **sakelar mode disiapkan sekarang, dipakai nanti** —
`READER_UNLOCK_FEEDBACK` dengan nilai `'none'` (bawaan) dan `'balance'`.

### Ini menimpa §1.4, dan itu disebut terang

§1.4 dan FR-CORE-01 menuntut mutasi uang selalu terlihat. Toast `−1.5rb koin`
dan lencana `CHAPTER TERBUKA` dicabut — keduanya justru yang membuat pembaca
sadar, dan "tidak sadar" adalah tujuan yang dinyatakan.

**Empat hal tidak ikut dicabut, dan tidak boleh:** gerbang `7x` di bab berbayar
pertama tiap cerita (itu momen persetujuannya), baris status `Buka otomatis
aktif` beserta tombol `Matikan`, catatan buku besar, dan lembar `7z` saat saldo
habis — satu-satunya interupsi yang tersisa, dan ia memang harus menginterupsi.

Tanpa keempatnya, "tidak sadar" berhenti jadi kenyamanan dan berubah jadi
memotong koin tanpa izin.

---

## 2026-09-05 · Langkah 63 — jalur iklan membuang izin buka-otomatis

> "ada yang perlu saya tanyakan ke anda. Mengapa pas proses chapter unlock dia
> tidak auto unlock?"

**Satu cacat nyata ditemukan, dan diukur bukan ditebak.** Sakelar "Buka otomatis
untuk cerita ini" tercentang bawaan di gerbang, tetapi hanya jalur **koin** yang
mengirimkannya ke server. Jalur **iklan** membuangnya diam-diam.

| Jalur | Izin tersimpan | Bab berikutnya |
|---|---|---|
| Chapter ini / bundel / tamat | `["s1"]` | terbuka sendiri |
| **Tonton iklan** (sebelum) | `[]` | **bergerbang lagi** |
| Tonton iklan (sesudah) | `["s1"]` | terbuka sendiri |

Akibatnya bagi pembaca: ia menyetujui di gerbang, menonton iklan sampai habis,
lalu bab berikutnya menagihnya lagi seolah ia tidak pernah menyetujui apa pun.

`npm run check` bersih · **583 test unit** · **72 e2e**.

### Tiga hal lain yang bisa terlihat seperti cacat yang sama

Disebut di sini supaya tidak dicari dua kali:

1. **Gerbang pertama tiap cerita memang selalu muncul** (FR-READ-09). Kalau yang
   dicoba hanya satu bab, itu perilaku yang benar, bukan kegagalan.
2. **`SEED_VERSION` naik ke 13 di Langkah 62.** Perangkat yang sudah punya basis
   data lama ditulis ulang saat dibuka, dan izin yang diberikan sebelum itu ikut
   hilang — sekali, lalu tidak lagi.
3. **Saldo habis menghentikan alurnya**, dan itu memang yang dijanjikan: lembar
   `7z` muncul alih-alih pembukaan diam-diam.

---

## 2026-09-05 · Langkah 62 — R5, R6, R7 selesai

> "oke sekarang lanjutkan redesign untuk phase R5, R6, dan R7. Dan pastikan
> ketika dijakankan dalam preview mobile, semua func nya berjalan dan hasil
> tampilan rapih dan clean. Begitu juga untuk preview window"

`npm run check` bersih · **582 test unit** · **72 e2e** (naik dari 65).

### R7 dikerjakan **lebih dulu**, dan itu disengaja

Butir 44px adalah satu perubahan primitif yang membuka kotak `Pemeriksaan baku`
di **setiap** halaman. Mengerjakannya belakangan berarti R5 dan R6 dibangun di
atas primitif yang salah, lalu ditambal lagi.

Ukuran `sm` tetap 36px — menaikkannya menghapus perbedaan `sm` dan `md` yang
dipakai seluruh aplikasi. Yang diperluas **kotak sentuhnya** lewat `::after`
transparan. Rinciannya `architecture.md` §1.23.

**Sapuan barunya langsung menemukan satu yang lolos selama ini:** tautan
`See all` di tiap kepala section beranda berukuran **38×22**. Ia lolos
pemeriksaan pertama hanya karena diukur sebelum section-nya selesai dirender;
`expect.poll` yang membuat pengukurannya menunggu tata letak tenang yang membuka
kedoknya.

### R5 — profil `7i`

Satu-satunya halaman R5 yang masih `<Placeholder>`; pustaka, pencarian, dan
lihat-semua sudah ditata ulang di Langkah 51, lembar section di R2.

Tiga angka kepalanya **diturunkan server** lewat `getReaderStats` baru
(seam 112 → 113): cerita dibaca dari `progress`, jam baca dari `readMinutes` bab
yang selesai, ulasan dari baris `reviews`. Penghitung tersimpan akan berselisih
dengan sumbernya pada penghapusan pertama — dan yang berselisih di halaman profil
adalah klaim tentang pengguna sendiri.

FAB koin **tidak lagi dirender** di `/profil`, `/karya`, dan `/penulis`: ketiganya
punya aksi utamanya sendiri, dan pintasan yang menutupi baris terakhir bukan
pintasan.

### R6 — studio, jadwal, tinjauan, formulir, cetak

Studio `7j`: strip empat sel di atas satu panel putih (Koin emas), `Buat story
baru` selebar halaman, tautan cepat jadi pil garis rambut berlabel pendek, dan
daftar karya jadi **baris berpembatas** — kata status berwarna menggantikan
lencana berlatar, alasan penolakan dikutip di balik garis merah, `Hapus` didorong
ke kanan sebagai teks redup.

Jadwal `7m`: kolom tanggal (`AGU 31 · 20.00`) di samping detail bab, dua catatan
kaki serif. Tinjauan `7n`: label jenis 9,5px, kata status, alasan di balik garis.
Formulir `7k`: garis progres empat segmen, slot sampul putus-putus rasio 2:3,
kepala section jadi label + garis. Cetak `7o`–`7r`: baris berpembatas, jenis
sebagai kata (`PDF` emas / `HARDCOPY` redup).

### R7 — sisanya

**Posisi baca kini disimpan per bab.** Koreksi atas yang saya laporkan di
Langkah 52: pemulihannya **sudah ada**, tetapi hanya untuk bab terakhir —
`ReadingProgress` cuma menyimpan satu `scrollPct` per cerita. Sekarang ada
`scrollByChapter`, dan `SEED_VERSION` naik ke 13. Rinciannya §1.24.

### Delapan test lama diperbarui, bukan dilonggarkan

Enam locator berubah karena markup-nya memang berubah: nama aksesibel sel `Koin`
(angka kini mendahului label), label nav yang dipendekkan, dan baris pesanan
cetak yang bukan `.nv-card` lagi. Satu berubah karena **regexnya terlalu longgar
sejak awal** — `/koin$/i` juga mengenai tautan "Isi Koin" di bilah navigasi.

---

## 2026-09-05 · Langkah 61 — R4 selesai: reader Type B & ekonomi buka bab

> "oke sekarang lanjutkan redesign untuk phase r4. Semua 1/2 steps yang ada di
> phase R4 dikerjakan saja. Dan pastikan ketika dijakankan dalam preview mobile,
> semua func nya berjalan dan hasil tampilan rapih dan clean. Begitu juga untuk
> preview window"

**Seluruh 57 kotak R4 selesai — dan ia menutup Fase 5b.** `npm run check` bersih
· **581 test unit** (naik dari 563) · **65 e2e** (naik dari 62).

### Server dulu, layar belakangan

Seam **109 → 112 metode**: `setAutoUnlock` · `getBundleOffer` ·
`dismissBundleOffer`. `ReaderPrefs` dapat tiga kolom jalur uang
(`autoUnlockStoryIds`, `autoUnlockCounts`, `bundleOfferSeenStoryIds`), dan
`UnlockInput` dua bendera (`enableAutoUnlock`, `auto`).

**Penghitung naik hanya bila `auto === true` dan pembukaannya sungguhan.**
Pemakaian ulang kunci idempotency tidak memotong koin, dan menaikkan penghitung
di sana mendekatkan pembaca ke tawaran belanja tanpa ia membayar apa pun.

### Sakelar global dicabut — pelanggaran aturan struktur #5 ditutup

`stores/readerSettings.ts` berhenti menyimpan `autoUnlock`. Izin itu memberi
wewenang **memotong koin**, jadi ia harus ikut saat pengguna berganti perangkat.
Sekarang per cerita, di server, dan diminta **di gerbang babnya** — tempat
pembaca memang sedang memutuskan soal uang, bukan di panel pengaturan.

### Empat layar

`7x` gerbang Type B (bilah atas selalu terlihat, mahkota `PREMIUM CONTINUATION`,
pratinjau tersensor yang `aria-hidden` sementara labelnya tidak, saldo diulang di
dalam gerbang, empat pilihan, izin tercentang bawaan) · `7y` bab terbuka
(lencana + baris status berikut tombol `Matikan`) · `7z` saldo kurang (**tiga**
jalan keluar) · `7aa` iklan (hitung mundur, aturan kuota, kartu gagal-muat).

Plus **pita tawaran bundel** — pita, bukan lembar: alur ini menjanjikan membaca
tanpa terputus, dan menghentikan pembaca dengan layar penuh untuk menawarinya
belanja adalah kebalikan dari yang dibelinya.

### Tiga hal yang tidak seperti rencana

1. **Bentuk awal `ReaderPrefs` jadi satu pabrik**, bukan tiga tempat ditambal
   satu per satu — dan ada tempat **keempat** yang tidak disebut rencana: berkas
   test.
2. **`useUnlockChapter` harus ikut membatalkan `['reader','prefs']`.** Ketahuan
   hanya karena alurnya **ditekan** di e2e: izinnya tersimpan, tetapi baris
   status tidak pernah muncul. Gejalanya persis seperti izin yang gagal
   tersimpan, padahal yang gagal cuma kabarnya.
3. **Bagian gratis bab terkunci dibaca normal**, bukan ikut diburamkan. Halaman
   yang isinya blok abu-abu seluruhnya terbaca sebagai kerusakan, bukan sebagai
   batas berbayar.

### Alur e2e lama ditulis ulang, bukan ditambal

`isi-koin-lalu-buka-bab.spec.ts` dulu membeli bab satu per satu lewat gerbangnya
masing-masing. Itu **bukan lagi alurnya**: gerbang muncul sekali per cerita, dan
bab berikutnya terbuka sendiri. Test-nya sekarang berjalan maju sampai lembar
saldo kurang muncul, alih-alih menghitung bab di muka — jumlah bab yang muat di
saldo 15.300 bergantung harga tiap bab, dan angka yang ditulis di muka akan lapuk
pada perubahan harga berikutnya.

### Diperiksa di mobile dan window

Bab terkunci masuk sapuan lima lebar. Alur gerbang → beli → izin dijalankan di
**390 dan 1280** lewat satu fungsi yang dipanggil dua kali, dan tombolnya
**ditekan**, bukan sekadar dilihat.

**Satu angka yang layak dilihat:** lencana hemat "Buka sampai tamat" berbunyi
**81%**, bukan 10% seperti `7x` menuliskannya. Itu bukan cacat — itu
`individualCoins` yang bekerja: 113 bab satuan melawan satu harga paket.

### Sakelar dev

`/dev/kitchen-sink` dapat **"Siapkan tawaran bundel (s1)"**. Tanpa itu pitanya
nyaris tidak pernah terlihat saat dicoba dengan tangan: saldo contoh 15.300 habis
di bab ke-12, dua bab sebelum ambang sepuluh (§1.21). Menaikkan saldo seed bukan
pilihan — `15,3rb` tercetak di tiga mockup.

---

## 2026-09-05 · Langkah 60 — jarak antar section kembali 16px

> "oh ya untuk jarak antar section sebelumnya pernah diubah menjadi 14 sekarang
> dibalikin lagi aja jadi 16"

Membatalkan Langkah 57. Empat tempat yang sama: dua bentuk `<section>` di
`StorySection` dan dua slot iklan di `HomePage`. Terukur di peramban:
`marginBottom: 16px` di keempat section pertama.

`npm run check` bersih · **563 test unit** · **62 e2e**.

---

## 2026-09-05 · Langkah 59 — teks lapisan diperbesar, ketukan di mana saja menutup

> "oke bagus, mungkin masih case sama untuk title, nama author, rating, total
> view bisa diperbesar. sama misal ingin tutup kan masih harus klik/pilih
> \"Tutup\" mungkin lebih baik user bisa melakukan itu tanpa harus klik/pilih
> tutup."

`npm run check` bersih · **563 test unit** · **62 e2e**.

### Teks

Judul **20 → 26**, nama pena dan statistik **12 → 14**. Naik di dalam skala yang
sudah ada, bukan angka baru — skalanya keputusan terkunci §1.20.

Cadangan tinggi panel ikut naik **19 → 21rem**, dan padding lapisannya turun
20 → 16px. Teks yang lebih besar memakan ruang yang sama; cadangan yang tidak
diperbarui bersamanya mendorong tombolnya keluar layar di ponsel pendek.

### Menutup

**Ketukan di mana saja menutup** — sampul, judul, statistik, latar. Yang
dikecualikan hanya `Buka cerita`. Dulu hanya latarnya yang menutup, dan itu benar
sampai lapisannya diperbesar: setelah sampulnya memenuhi lebar layar, sisa latar
tinggal ~16px dan praktis tidak bisa dikenai jari.

Tombol `Tutup` **tetap ada** (dikonfirmasi) — ia satu-satunya kontrol tutup yang
punya nama untuk pembaca layar.

### Ukuran akhir, terukur

| Layar | Sampul |
|---|---|
| 320×568 | 176×264 · sisa 2px |
| 320×844 | 288×432 |
| 360×640 | 203×304 |
| 390×844 | 339×508 |
| 430×932 | **397×596** |

### Satu bentuk layar sengaja dibiarkan menggulir

Di **320×568**, sampul 2:3 ditambah judul 26px dan dua tombol 44px memang tidak
muat tanpa mengecilkan sampulnya ke ~150px — dan itu membatalkan seluruh maksud
"diperbesar". Percobaan menurunkan lantai lebar ke `10rem` justru **memperburuk**
: panel yang lebih sempit membuat judulnya wrap jadi tiga baris, dan panelnya
malah lebih tinggi. Sisa ruangnya sekarang 2px, jadi ia bisa sewaktu-waktu
menggulir — dan itu bukan kerusakan: `overflow-y-auto` menjaga tombolnya
terjangkau.

---

## 2026-09-05 · Langkah 58 — lapisan zoom diperbesar, statistiknya ditambahkan

> "saya ingin kamu buka folder bugs, dan cari file image
> feedback_home_content_01.png. Nah saya ingin saat diklik gambar ukuran gambar
> diperbesar lagi. Kemudian statistik ditambahkan lagi total view dan rating."

`npm run check` bersih · **562 test unit** · **62 e2e**.

### Ukuran

| Layar | Sebelum | Sesudah |
|---|---|---|
| 320×568 | 240×360, **terpotong** | 176×264, muat |
| 320×844 | 240×360 | 280×420 |
| 390×844 | 240×360 | **350×525** |
| 430×932 | 240×360 | 390×585 |

Dijepit **dua arah**: `min(100%, max(11rem, (100dvh − 19rem) / 1.5))`. Sampul 2:3
yang hanya dibatasi lebar tumbuh 1,5× lebih tinggi daripada lebarnya, dan di
ponsel pendek tombolnya terdorong keluar layar.

**Lantai `11rem` ditemukan lewat pengukuran.** Menjepit lebar dengan tinggi juga
meremas teksnya, dan teks yang teremas justru tumbuh tinggi: tanpa lantai itu,
lanskap 844×390 menghasilkan panel **866px di layar setinggi 390**. Percobaan
pertama memakai `13rem`, dan itu terlalu tinggi ke arah sebaliknya — 320×568 jadi
perlu digulir padahal sebelumnya muat.

### Statistik

★ rating dan jumlah baca ditambahkan **ke lapisannya**, bukan dikembalikan ke
kartunya — kartu di rel tetap tinggal sampul dan judul. Emasnya `--nv-gold-line`,
bukan `--nv-gold`: yang kedua emas gelap untuk teks di atas kertas, dan di atas
scrim gelap ia nyaris hilang.

### Satu cacat lama ikut tertutup

Lapisannya tidak punya `overflow-y-auto`, jadi pada bentuk layar yang tidak muat
isinya **terpotong dan `Buka cerita` tidak bisa dicapai sama sekali** — bukan
sekadar perlu digulir. Terukur di 320×568 sebelum perubahan ini, dan itu salah
satu dari lima lebar yang wajib lulus.

### Satu penyederhanaan yang menghapus duplikasi

Skala awal animasinya dulu menghitung ulang lebar panel di JS
(`Math.min(240, innerWidth - 64)`) — rumus yang sama dengan CSS-nya, di dua
tempat. Sekarang lebarnya **diukur** lewat `offsetWidth` di `useLayoutEffect`,
jadi CSS tetap satu-satunya yang menentukan ukuran dan animasinya tidak bisa
melenceng dari titik asalnya.

---

## 2026-09-05 · Langkah 57 — jarak antar section 16 → 14px

> "coba jarak antar section sebelumnya 16px coba diubah menjadi 14px"

Satu nilai, empat tempat: dua bentuk `<section>` di `StorySection` dan dua slot
iklan di `HomePage` — slot iklan ikut supaya jaraknya tidak berselisih dengan
section di sekitarnya. Terukur di peramban: `marginBottom: 14px` di kelima
section pertama.

`npm run check` bersih · **561 test unit** · **62 e2e**.

---

## 2026-09-05 · Langkah 56 — empat perbaikan beranda dari `bugs/`

> "saya ada buat folder baru di project novelova-v2 yaitu bugs. Yang isinya
> adalah file image untuk perbaikan tambahan yang saya inginkan. Didalam file
> gambar bugs_home_content_01.png itu ada tanda garis merah untuk memberikan
> informasi bahwa ketika aplikasi dibuka dalam preview mobile jarak batas kiri
> dengan story terlalu menempel. dikasih space sedikit supaya tidak kelihatan
> menempel. Kemudian untuk di daerah home content saya kasih tanda hijau untuk
> memberitahu bahwa data yang tampil hanya titleStory dan Cover Image. dan saya
> ingin pada title yang panjang diberikan batas 2 saja lebih dari itu dikasin …
> Dan saya ingin untuk 3 section utama jangan ada iklan, lalu jarak antar
> section (semua section) jangan terlalu jauh."

`npm run check` bersih · **561 test unit** (naik dari 557) · **62 e2e**.

### Dua di antaranya cacat sungguhan, dan keduanya tidak meluber

Sapuan lima lebar yang ada tidak akan pernah menangkap keduanya — tidak ada
halaman yang menggeser ke samping. Keduanya diukur, bukan ditebak:

**Tepi kiri.** `snap-x` tanpa `scroll-px-4`: peramban menempelkan kartu pertama
ke tepi wadah, menggulir rel-nya **16px sendiri saat dimuat**, dan padding
kirinya tergulir habis. Terukur `scrollLeft: 16`, `kartu.left: 0`, sementara
kepala section-nya tetap di 16 — persis garis merah di gambarnya. Sekarang
keduanya 16.

**Judul tiga baris.** `line-clamp-2` **tidak melakukan apa pun**: kelas `block`
di elemen yang sama menimpa `display: -webkit-box` yang dibutuhkannya. Terukur
tinggi judul 66px walau `webkitLineClamp` terbaca `2`. Sekarang 44px, seragam
untuk seluruh 140 kartu, dan terpotong dengan elipsis.

### Dua sisanya perubahan tampilan

Kartu bentuk grid tinggal **sampul dan judul**; nama pena, ★ rating, jumlah baca,
dan garis "+N baca minggu ini" dicabut dari beranda — semuanya tetap hidup di
`variant="list"`. Prop `note` jadi mati dan ikut dihapus.

Tiga section teratas bersih dari iklan (kedua slotnya pindah ke bawah tab genre,
jumlahnya tetap dua), dan jarak antar section **28 → 16px**.

### Satu keputusan yang saya ambil dari jawaban "dibiarkan saja"

Lencana di pojok sampul — `#1 #2 #3` dan `HOT`/`BARU`/`PERMATA` — **tidak
dicabut**. Ia menempel pada gambar sampulnya, bukan baris data di bawahnya, dan
itu batas yang saya pakai untuk membaca "hanya title dan cover image".

### Dijaga supaya tidak balik

Empat test unit baru (kartu hanya satu baris teks · `line-clamp-2` tanpa `block`
· kedua slot iklan sesudah tab genre · rel membawa `scroll-px-4`), dan e2e lima
lebar + desktop kini **mengukur** tepi kiri rel, gulirannya, dan tinggi judulnya
— bukan hanya luberan halaman.

---

## 2026-09-05 · Langkah 55 — R2b dikerjakan: beranda disusun ulang

> "jika sudah selesai implementasi aja dulu R2b semua step nya. Dan pastikan
> selalu test di preview mobile dari berbagai macam layar supaya func nya
> berjalan sama dengan preview website"

**Seluruh 46 kotak R2b selesai.** `npm run check` bersih · **557 test unit**
(naik dari 543) · **62 e2e** (naik dari 61).

### Data lebih dulu, dan itu memang yang paling banyak berubah

Katalog contoh **40 → 70 cerita**. Tapi yang penting bukan jumlahnya:
`status`, `monetizeType`, dan tag tiap cerita pengisi dulu **diturunkan dari
indeksnya** di `seed.ts`. Selama begitu, isi sebuah section hanya bisa diatur
dengan menghitung mundur posisi tiap judul, dan satu judul yang disisipkan di
tengah menggeser atribut semua yang sesudahnya. `FILLER` sekarang membawa
atributnya sendiri, sinopsisnya ikut di entrinya, dan larik `SYNOPSES` yang
dipasangkan menurut urutan tinggal untuk delapan cerita kanvas.

**Ambang "tiap section ≥ 6" dijaga test, bukan skrip.** Rencananya
`scripts/cek-beranda.mjs` di `npm run check`; jadi `tests/unit/beranda-data.test.ts`
karena test bisa memanggil `getHomeFeed` yang sungguhan. Skrip harus mem-parse
`catalog.ts` sebagai teks, dan parser seperti itu tetap hijau sambil salah
begitu aturan penyusunan section berubah.

Checker itu langsung bekerja: percobaan pertama menyisakan empat section di
bawah ambang (Mystery "Gratis Hari Ini" = 3), dan yang diperbaiki **datanya**,
bukan ambangnya.

### Susunan, bentuk, ukuran

Urutan baru: **tiga section prioritas → banner → tab genre → section tersaring →
Lanjut Membaca**. Ketiga section teratas berhenti tersaring tab; keadaan kosong
"genre ini belum ada isinya" pindah ke bawah tab, dan tiga section teratas
beserta banner tetap berdiri di sana.

Empat bentuk section jadi **dua**. Sampul seragam **80px** — 3,9 sampul terlihat
di 360px, dari 2,9. `SectionSettings` ikut disusun ulang: daftar sakelar yang
urutannya beda dari halaman yang diaturnya bukan pengaturan.

### Ketuk sampul → sampul membesar

`StoryCard` dipecah: sampul jadi `<button>`, judul tetap `<a>`. Lapisannya tumbuh
**dari kotak sampul yang ditekan**, bukan dari tengah layar — sampul di rel
berjejer rapat, dan lapisan yang muncul entah dari mana tidak memberi tahu sampul
mana yang dibuka. Esc menutup, fokus kembali ke sampul itu.

**Hanya di beranda.** `StoryCard` dipakai empat halaman; ia menerima
`onCoverClick` opsional dan hanya beranda yang mengopernya. Dijaga test:
`/jelajah`, `/pustaka`, dan `/cari` harus tetap punya satu tautan per kartu.

### Satu cacat lama ketahuan karena datanya bertambah

`/cari` dan `/jelajah` memanggil `new IntersectionObserver(...)` **tanpa
pengaman**, sementara `ReaderPage` sudah memeriksanya sejak awal. Keduanya lolos
bertahun-tahun hanya karena katalog contohnya terlalu kecil untuk pernah punya
halaman kedua — begitu katalognya jadi 70 cerita, `hasNextPage` jadi benar dan
keduanya **menjatuhkan seluruh halaman**. Gejalanya menyesatkan: dua test
`SearchPage` gagal dengan "element could not be focused", jauh dari sebabnya.

Diperbaiki di akarnya: `onVisible()` di `lib/a11y.ts`, satu pengaman untuk
keduanya. Tanpa observer, muat-bertahapnya diam — dan tombol "Muat lagi" tetap
ada sebagai jalan manual.

`Cover` juga dapat `onError`, dan yang disimpan **URL yang gagal**, bukan sebuah
bendera: dengan begitu sampul baru tidak mewarisi kegagalan sampul lama saat
komponennya dipakai ulang di rel, dan tidak perlu efek yang mereset apa pun.

### Diuji di lima lebar **dan** desktop

Sapuan lebar yang lama cuma membuktikan halamannya tidak menggeser ke samping.
Yang ditambahkan R2b bisa rusak tanpa meluber sedikit pun, jadi ada satu test
baru di berkas yang sama yang menjalankan alurnya di **320 · 360 · 390 · 412 ·
430 · 1280**: susunan blok diperiksa lewat posisi DOM, sampulnya **ditekan**,
lapisannya diperiksa tidak meluber, lalu `Buka cerita` **ditekan** juga — elemen
yang tertutup tetap lolos `toBeVisible()`, yang gagal adalah kliknya.

### Empat test lama diperbarui, bukan dihapus

Empat test `home.test.ts` menjaga aturan §1.6 yang baru saja ditimpa. Dua di
antaranya sempat saya perbaiki salah arah — membandingkan tab lawan "Semua",
padahal di "Semua" favorit onboarding memang mengurutkan ulang isinya (§1.7).
Yang benar: membandingkan **antar dua tab**.

---

## 2026-09-05 · Langkah 54 — kesiapan data contoh untuk R2b

> "saya konfirmasi untuk data mock nya sudah siap?"

**Belum, dan yang menahannya dibuat oleh R2b sendiri.** Diperiksa dengan
mensimulasikan `seed.ts`, bukan diperkirakan. R2b bertambah **8 kotak** di
sub-bagian baru **R2b-a — Data contoh, dikerjakan pertama**; `architecture.md`
§1.22 bertambah dua bagian. Nol baris kode berubah.

### Yang sudah siap

40 cerita, semua `published` · **100 sampul potret 2:3** dan 20 banner dengan URL
sungguhan yang terjangkau (HTTP 200, 0,32 dtk) — jadi fitur zoom punya gambar
nyata · tiga section prioritas menarik dari seluruh katalog, jadi setelah berhenti
tersaring ketiganya selalu penuh · Lanjut Membaca punya data progres.

### Yang belum

**11 dari 26 section di bawah tab berisi kurang dari 4 cerita** — tidak cukup
mengisi satu baris sampul 80px. Terburuk: Fantasy "Dunia Lain" **1**, Mystery dan
CEO "Tamat & Siap Dibaca" **1**, Thriller dan My Kisah "Tamat" **0**.

**Cacat ini tidak ada hari ini.** Daftar tegak berisi tiga cerita terbaca wajar;
rel mendatar berisi tiga sampul dengan ruang kosong di kanannya terbaca sebagai
gagal memuat. Bentuk `ranked` selama ini menyembunyikannya.

**Dan yang menghalangi perbaikannya bukan jumlah judul.** `status`,
`monetizeType`, dan tag tiap cerita pengisi diturunkan dari **indeksnya** di
`seed.ts`, jadi isi sebuah section hanya bisa diatur dengan menghitung mundur
posisi tiap judul — dan satu judul yang disisipkan di tengah menggeser atribut
semua yang sesudahnya. `FILLER` harus membawa atributnya sendiri sebelum
katalognya ditambah.

### Tiga keputusan pengguna

1. **Katalog ditambah sampai tiap section ≥ 6** — 40 → ~60 judul, masing-masing
   dengan sinopsisnya sendiri. Dijaga `scripts/cek-beranda.mjs` yang ikut
   `npm run check`, bukan hitungan tangan.
2. **Keadaan kosong genre cukup dijaga test unit** — tidak ada sakelar dev.
   Konsekuensinya disebut terang di §1.22: layarnya tidak akan pernah terlihat di
   aplikasi yang jalan.
3. **`Cover.tsx` dapat `onError`** yang menjatuhkan sampul gagal-muat ke jaket
   satu hurufnya. Sampulnya URL jarak jauh, dan tanpa ini CDN mati memunculkan
   ikon gambar rusak — di halaman yang setelah R2b memuat ~30 gambar.

---

## 2026-09-05 · Langkah 53 — rencana susunan ulang beranda (R2b)

> "oke sekarang saya ada adjustment todo untuk home-content di novelova v2. Home
> content terdapat redesign. Jadi urutan nya adalah 3 section prioritas yang
> dincer oleh penulis. Kemudian setelah itu terdapat banner dan home category dan
> section lainya. Saya ingin setiap section diberbagai genre selalu story diurut
> secara horizontal. Dan saya ingin ukuran cover diperkecil aja supaya pas user
> lihat terlihat banyak list story di setiap section. Konsep untuk section di
> setiap kategory tetap dipakai (3 section prioritas tetap muncul walau genre
> berganti). Jika ada yang bingung dari todo ini dikabarkan saja. Dan ada
> tambahan fitur yaitu jika user klik cover image di home content maka gambar itu
> akan diperbesar dan tambahkan animasi seperti zoom in. SELALU TANYAKAN JIKA ADA
> KEPUTUSAN YANG INGIN ANDA BUAT SUPAYA TIDAK TERJADI HAL YANG TIDAK DIINGINKAN"

**Rencana, belum implementasi.** Yang bertambah: `todo.md` **R2b** (38 kotak),
`architecture.md` **§1.22**, dan 14 kotak di bagian beranda `todo-redesign.md`.
Tidak ada satu baris kode pun yang berubah.

### Satu kesalahan proses, dan koreksinya

Percobaan pertama saya menulis R2b dengan **tujuh keputusan yang saya buat
sendiri** — termasuk apakah tiga section teratas tetap tersaring genre, dan
bagaimana pembaca membuka cerita setelah sampul dipakai untuk zoom. Pengguna
menghentikannya dan menambahkan kalimat yang sekarang berlaku seterusnya:
*"SELALU TANYAKAN JIKA ADA KEPUTUSAN YANG INGIN ANDA BUAT."* Draf itu dibuang dan
R2b ditulis ulang setelah **enam pertanyaan dijawab**.

### Enam keputusan, semuanya dari pengguna

1. **Tiga section teratas berhenti tersaring genre** — jadi peringkat global.
2. **Hanya section genre yang jadi rel mendatar**; Lanjut Membaca tetap daftar
   tegak, karena batang progres, "Bab 45 dari 120", dan tombol lanjut butuh lebar
   satu baris penuh.
3. **Sampul 80px** — 3,9 sampul terlihat di layar 360px, dari 2,9 sekarang.
4. **Judul tetap tautan, sampul jadi tombol zoom**, dan lapisannya membawa tombol
   `Buka cerita`.
5. **Genre kosong diberi pesannya di bawah tab**, bukan mengosongkan seluruh
   beranda — tiga section atas dan banner tetap tampil.
6. **Kutipan serif dihapus**, semua section seragam 80px.

### Tiga hal yang ditimpa, dicatat di §1.22

- **§1.6** menandai tiga section teratas "ikut tersaring: ya". Tidak lagi. Yang
  memaksanya adalah urutan barunya: tab genre kini duduk **di bawah** ketiganya,
  dan kontrol yang efeknya di luar layar terbaca sebagai kontrol yang rusak.
- **Brief §4 ("daftar mengalahkan kartu") dibatalkan untuk beranda saja.** `7a`
  menggambar section tematik sebagai daftar tegak; permintaannya kebalikannya.
  Alasannya sah: beranda satu-satunya halaman yang tugasnya penemuan. Aturannya
  **tetap berlaku penuh** di `/jelajah` dan `/pustaka`, yang baru jadi daftar
  tegak di Langkah 51.
- **Brief §8 ("tidak ada yang membesar") dibatalkan setipis mungkin** — satu
  gerakan, satu tempat, dan `prefers-reduced-motion` tetap mematikannya.

### Dua akibat yang tidak diminta tetapi tidak bisa dihindari

- **Keadaan kosong harus dipindah.** Dengan tiga section teratas selalu ada,
  beranda tidak pernah benar-benar kosong; menilai "genre ini kosong" dari seluruh
  feed membuat pesannya tidak pernah muncul.
- **`StoryCard` harus dipecah.** Seluruh kartu hari ini satu `<a>`, dan tombol di
  dalam tautan bukan HTML yang sah. Sampul keluar jadi `<button>`, judul tetap
  `<a>` — perubahan struktur, dan bagian termahal dari fitur zoom-nya.

### Yang sengaja tidak berubah

Zoom **hanya di beranda**. `StoryCard` dipakai empat halaman; menaruh lapisannya
di dalam komponen itu mengubah keempatnya tanpa diminta. Ia cuma menerima prop
opsional `onCoverClick`, dan hanya beranda yang mengopernya.

---

## 2026-09-05 · Langkah 52 — R2 & R3: detail cerita, ruang baca Type A, komentar bab

> "oke sekarang lanjutkan untuk melakukan redesign tampilan saja dulu. Ikti todo
> untuk lakukan perubahan untuk R2 dan R3. Dan pastikan saat di test di preview
> mobile itu aman dan semua fitur berjalan"

**R2 ternyata sudah selesai** — beranda `7a` dan lembar section `7s` dikerjakan
di Langkah 50, testnya ada, dan ruang bawah `AppShell` (86 + 76 = 162px) sudah
melebihi tinggi bilah + FAB. Yang dilakukan cuma memverifikasi lalu
mencentangnya. Jadi permintaan ini nyaris seluruhnya **R3**.

### R3a · Detail cerita `7b`

Panel kepala putih dengan **strip statistik empat sel** (`★ RATING` · `BAB` ·
`DURASI BACA` · `STATUS`) — durasi baca menggantikan metrik pamer. Kartu
monetisasi hairline menjawab satu pertanyaan: berapa gratis, berapa sisanya.
Bilah bawah lengket menyebut bab terakhir dibaca.

**Tiga angka baru dihitung server, bukan layar** — `readMinutesTotal`,
`freeChapterCount`, `paidPriceFrom`. Alasannya sama untuk ketiganya: daftar bab
datang 20 per halaman, jadi menghitungnya di layar akan menjawab pertanyaan
tentang cerita 120 bab dari 20 bab pertamanya saja. `freeChapterCount` dihitung
sebagai **awalan** dan berhenti di bab berbayar pertama, karena copy-nya berbunyi
"N bab *pertama* gratis" — dan itu bohong kalau yang gratis tersebar di tengah.

Bilahnya memakai `bottom-[var(--nv-bottom-nav)]`, bukan `bottom-0`
(`CLAUDE.md` §8), dan **FAB koin tidak lagi dirender di `/cerita/*`**: dua elemen
melayang di sudut yang sama saling menindih, dan `7b` juga tidak menggambarnya.

### R3b · Ruang baca Type A `7u` `7v` `7f` `7g`

**Chrome tersembunyi sejak awal.** Yang tampil hanya pembuka bab (`BAB 3`, judul
serif, garis emas), badan serif, dan hairline progres 1,5px. Satu ketukan pada
teks memunculkan bilah atas dan bawah melayang; ketukan kedua menyembunyikannya
lagi. Ketukan pada tautan, tombol, atau kolom **tidak** ikut menutup chrome.

**Bab terkunci dikecualikan** — bilah atasnya selalu terlihat (`7x`). Tanpa itu
bab terkunci tidak punya tombol kembali sampai pembaca menebak bahwa layar bisa
diketuk, dan itu jebakan.

### R3c · Komentar bab `7t` + `7w`

Satu komponen `ChapterComments`, dua wadah: halaman penuh dan lembar di atas
ruang baca. Brief §8 menuntut isi yang sama di keduanya, dan satu-satunya cara
itu tidak bisa lapuk adalah satu komponen dipakai dua kali — dua komponen yang
kebetulan mirip akan berselisih pada perubahan berikutnya, dan yang berselisih
adalah aturan moderasi.

Karena `features/reader` tidak boleh mengimpor `features/story` (aturan struktur
#2), `ChapterComments`, `CommentRow`, `ModerationActions`, `useComments`, dan
`useModeration` naik ke `components/patterns/` dan `src/hooks/`.

**Tautan komentar di akhir bab dicabut** (brief §7) — tombolnya hanya hidup di
overlay. Test yang dulu menjaga keberadaannya **dibalik** jadi menjaga
ketiadaannya, karena test yang dihapus tidak menahan apa pun.

### Sisa kulit yang hanya terlihat per halaman

`todo-redesign.md` memandang pekerjaan yang sama per halaman, dan sudut itu
menemukan empat hal yang tidak ada di daftar R3:

- **Sinopsis, judul voucher, dan badan ulasan `RateSheet` jadi serif.** Brief §2
  menaruh ketiganya di sisi "yang *adalah* cerita", bukan "yang dikatakan
  aplikasi tentang dirinya".
- **Halaman komentar mencetak rujukan babnya.** Bilah atas cuma berbunyi
  "Komentar bab", yang tidak menyebut bab yang mana — dan tautannya memang bisa
  dibagikan. Lembar `7w` tidak memerlukannya: di sana babnya terbuka di
  belakangnya. `useChapter` ikut naik ke `src/hooks/`, alasan yang sama dengan
  R3c; datanya biasanya sudah di cache dari ruang baca, jadi yang membayar satu
  permintaan hanyalah pembuka tautan langsung.

### Satu test yang balapan, diperbaiki di akarnya

`LibraryPage › pencarian menyaring di server` gagal **tiga kali** di suite penuh
dan lulus tiap kali dijalankan sendirian. Bukan flake: `useShelf` memakai
`keepPreviousData` dan tidak ada debounce, jadi `findByText(judul s1)` selesai
**seketika** — s1 ada di daftar lama maupun daftar tersaring — lalu
`queryByText(judul s3)` berjalan sinkron selagi permintaan terakhir masih di
udara. Persis jebakan `CLAUDE.md` §8: *menunggu hal yang sudah benar sejak awal
berarti tidak menunggu apa pun.* Yang ditunggu sekarang adalah baris yang
**hilang**, bukan baris yang bertahan.

### Yang tidak dikerjakan, dan kenapa

- **`Pemeriksaan baku` tetap kosong di keempat halaman selesai** — delapan dari
  sembilan butirnya terpenuhi. Yang menahan butir 8: `Button`/`IconButton`
  ukuran `sm` tingginya **36px** (`Button.tsx:25,85`), di bawah ambang 44px, dan
  itulah ukuran baris aksi komentar, bilah melayang ruang baca, serta hampir tiap
  lembar. Menambalnya per halaman berarti ~30 tempat dan halaman berikutnya akan
  memakai `sm` lagi; menaikkannya di primitifnya sekali menyentuh seluruh
  aplikasi. Ia **R7**, yang memang sudah menyebutkan ambang itu — sekarang
  beserta penyebabnya.
- **Posisi baca belum dipulihkan per bab.** Bukan test yang belum ditulis:
  `useReadingProgress` hanya **menyimpan** `scrollPct` dan tidak ada yang
  membacanya kembali, jadi tiap pembukaan mulai dari atas. Itu perilaku, bukan
  kulit, dan permintaan ini membatasi diri pada tampilan. Sudah punya rumah di
  **R7** baris pertama.
- **R4 tidak disentuh** — reader Type B, auto-unlock, dan pita bundling adalah
  jalur uang, dan permintaan ini menyebut "redesign tampilan saja dulu".

### Verifikasi

`npm run check` bersih · **543 test unit** · **61 e2e**, termasuk sapuan
**25 halaman × 5 lebar** (320 · 360 · 390 · 412 · 430) dengan nol luberan.
Lembar komentar diukur langsung: `awal 500 → ketuk 500 → lembar buka 500 →
lembar tutup 500`.

---

## 2026-09-04 · Langkah 51 — lihat-semua `7d` dan pustaka `7c`

> "ya" (lanjut ke pustaka `7c` + lihat-semua `7d` + profil `7i`)

**Dua halaman selesai; profil `7i` belum tersentuh** — ia satu-satunya dari
ketiganya yang masih `<Placeholder>`, jadi ia bukan penggantian kulit melainkan
halaman baru, dan itu pekerjaan sendiri.

### Lihat-semua `/jelajah/:kategori` · `7d`

Grid dua–tiga kolom jadi **daftar tegak berpembatas bernomor**. Chip periode jadi
**tab teks bergaris bawah**; pengurut pindah ke kepala `URUTAN` sebagai aksi emas
rata kanan. Pintasan cari jadi pil. Lencana `HOT`/`BARU` pindah dari sampul ke
tepi kanan baris — `badge={null}` meniadakan yang di sampul, karena satu cerita
yang membawa dua lencana di baris yang sama membingungkan.

**Satu cacat lama ikut ketahuan dan diperbaiki.** Chip pertama adalah bawaannya,
dan urutannya `Hari ini` lebih dulu — jadi halaman ini **selalu terbuka dengan
"0 cerita"**. Pembaca yang menekan `See all` mendarat di keadaan kosong dan
menyimpulkan kategorinya memang kosong. `7d` menaruh `Sepanjang masa` sebagai tab
aktif, dan sekarang begitu pula urutannya.

### Perpustakaan `/pustaka` · `7c`

Empat kartu metrik dan blok hero dihapus; yang tersisa judul serif, **satu baris
hitungan**, tab teks, lalu satu daftar berpembatas. Kolom cari jadi pil, pengurut
jadi aksi satu baris.

**Baris hitungannya tetap `<dl>` dengan empat pasang `<dt>`/`<dd>`.**
Menggabungnya jadi satu string terlihat persis sama — dan itu justru masalahnya:
pembaca layar kehilangan pasangan label–angkanya, dan tiga test yang menjaga
urutan FR-LIB-02 kehilangan pegangannya. Percobaan pertama saya memang begitu,
dan ketiganya langsung gagal.

`LibraryCard` jadi `<li>` karena raknya kini `<ul>`; kartu bergaris dan berlatar
sendiri dilepas.

### Dua primitif bertambah kecil

- `SearchInput` dapat `variant`: **`line`** untuk bilah atas pencarian (`7e`),
  **`box`** untuk pil di dalam halaman (`7d`, `/pustaka`, studio). Dua bentuk
  karena keduanya menempati tempat berbeda — yang di bilah atas **adalah** judul
  halamannya.
- `StoryCard` dapat `trailing` (sel kanan baris) dan `badge` yang bisa `null`.

### Verifikasi

`npm run check` bersih · **543 test unit** · **nol luberan** di lima halaman
(`/`, `/cerita/s1`, `/cari`, `/pustaka`, `/jelajah/populer`) × lima lebar
(320 · 360 · 390 · 412 · 430).

### Satu kelas flake ditutup, bukan dilewati

E2E gagal tiga kali berturut-turut di **spec yang berganti-ganti** — dua kali di
Langkah 50 (`karya-dua-lebar`, `rantai-ulasan`), sekali di sini (`/cerita/s1`,
`/koin/transaksi`) — dan **semuanya lulus saat dijalankan sendirian**. Pola itu
yang menunjuk penyebabnya: bukan cacat produk, melainkan pengukuran yang terlalu
dini.

Sapuan lebar mengukur `scrollWidth - clientWidth` **sekali**, tepat setelah
`networkidle` dan `fonts.ready`. Keduanya bisa tercapai saat React Query masih
menukar kerangka dengan isinya, dan luberan sesaat di tengah pertukaran itu
bukan cacat yang dilihat siapa pun.

Sekarang memakai `expect.poll`. Itu **tidak** melemahkan pemeriksaannya — luberan
sungguhan tetap gagal sampai batas waktunya habis; yang berubah cuma bahwa yang
diperiksa adalah **tata letak yang sudah tenang**, dan itu memang yang
dijanjikan. **61 e2e lulus** sesudahnya. Masuk `CLAUDE.md` §8.

### Yang **belum**

- **Profil `7i`** — masih penampung.
- **FAB koin masih menutupi konten** di semua halaman. Butir R2 yang tercatat:
  harus jadi lingkaran 48px **dan** pindah ke kiri sekaligus; salah satu saja
  cuma menukar siapa yang tertutup.
- Susunan detail cerita belum penuh `7b` (bilah bawah lengket, kartu monetisasi).
- Studio, dompet, penghasilan: belum disentuh.

---

## 2026-09-04 · Langkah 50 — R3 & R5 sebagian: detail cerita dan pencarian

> "oke sekarang lanjutkan untuk melakukan redesign tampilan saja dulu. Cuman
> pastikan saat di test di preview mobile itu aman dan semua fitur berjalan"

**Tampilan saja** — perilaku ruang baca (Type A/B, auto-unlock, pita bundling)
ditahan seluruhnya untuk R4.

### Detail cerita `/cerita/:id` · mockup `7b`

**Kepala dibalik bentuknya.** Dari gambar penuh berscrim jadi **panel putih
dengan sampul kecil di kiri** — sampul jadi benda di atas panel, bukan latar yang
ditimpa teks. Itu sekaligus menghapus satu-satunya gradien besar di layar ini.

**Strip statistik jadi empat sel** — `★ RATING` · `BAB` · `DURASI BACA` ·
`STATUS`. Sel ketiganya baru dan butuh data: `readMinutesTotal` ditambahkan ke
`StoryDetail` dan **dihitung server**. Alasannya bukan kerapian — halaman ini
memuat bab 20 per halaman, jadi menjumlahkannya di layar akan menampilkan durasi
cerita 120 bab dari 20 bab pertamanya saja, **dan angkanya bertambah tiap pembaca
menekan "muat lagi"**. Hanya bab terbit yang ikut dihitung.

**Daftar bab jadi daftar berpembatas**, judul serif, dan **ketiga penanda
FR-DETAIL-14 pindah ke sel kanan**: centang (sudah dibaca) · titik emas (sedang
dibaca) · chevron (belum). Sebelumnya penanda "sedang dibaca" berupa kolom ikon
kedua di sebelah kiri, sehingga satu baris bisa membawa **dua ikon yang
mengatakan hal yang sama**. Kepala sectionnya kini label 9,5px + garis + pengurut
rata kanan, dan jumlah bab tidak lagi diulang di sana — ia sudah ada di strip
statistik.

### Pencarian `/cari` · mockup `7e`

**Dua cacat nyata, bukan sekadar kulit.**

**1. Tombol hapus muncul dua kali.** Chromium merender tombol hapusnya sendiri di
dalam `input[type="search"]`, dan `SearchInput` sudah punya satu. Hasilnya dua
tanda silang bersebelahan — yang satu tidak bisa ditata dan tidak punya nama bagi
pembaca layar.

Perbaikan pertama saya salah: `type` diganti jadi `text`, dan **17 test langsung
gagal**. `type="search"` itulah yang memberi `role="searchbox"` — pembaca layar
bergantung padanya sama seperti test-nya. Perbaikan yang benar menyembunyikan
tombol bawaan lewat `::-webkit-search-cancel-button` di `base.css`, sekali, di
tempat semua pemakainya lewat.

**2. Saringan masih empat select bertumpuk**, bukan baris pil `7e`. Sekarang satu
baris pil mendatar yang bisa digulir — dan tiap pil **membungkus `<select>` asli**
yang ditumpuk transparan di atasnya. Yang terlihat pil, yang ditekan tetap kontrol
peramban: navigasi papan ketik, pencarian ketik-huruf, dan perilaku layar sentuh
tidak perlu ditulis ulang.

Saran sambil mengetik jadi daftar berpembatas dengan ikon kaca pembesar; hasil
`CERITA` mendapat kepala section + penghitung rata kanan; baris hasil memakai
anatomi yang sama dengan seluruh aplikasi.

### Satu test diperbarui, dan itu benar

`StoryDetailPage.test.tsx` menguji tiga metrik lama (`Dibaca`, `Disimpan`) yang
memang diganti empat sel. Assertion-nya diperbarui ke keempat label baru plus
durasi baca — dan durasinya dibaca **dari selnya**, bukan dari seluruh halaman:
baris bab juga berbunyi "8 menit", dan pencarian global menemukan keduanya.

### Verifikasi

`npm run check` bersih · **543 test unit** · **nol luberan** di empat halaman
(`/cerita/s1`, `/cari`, `/pustaka`, `/jelajah/populer`) × lima lebar
(320 · 360 · 390 · 412 · 430).

### Yang **belum**, dan ini masih terlihat di layar

- **Susunan detail cerita belum mengikuti `7b` sepenuhnya.** Mockup: sampul →
  statistik → sinopsis → kartu monetisasi → daftar bab → **bilah bawah lengket**
  berisi bab terakhir dibaca. Sekarang tombol `Lanjutkan — Bab 8` masih blok
  besar di tengah halaman, dan kartu monetisasi belum ada.
- **FAB koin masih menutupi konten** di ketiga halaman — butir R2 yang sudah
  tercatat: harus jadi lingkaran 48px **dan** pindah ke kiri sekaligus.
- Pustaka, lihat-semua, profil, studio, dompet, penghasilan: belum disentuh.

---

## 2026-09-04 · Langkah 49 — R8 & R9: tujuh belas rute yang tidak punya fase

> "oke untuk todo melakukan redesign sampai halaman di phase 10 apakah sudah
> selesai semua?" · "iya tambahkan keduanya"

**Pertanyaannya menemukan lubang di rencananya sendiri.** Jawaban atas
pertanyaan pertama: **belum, dan jauh** — 1 dari 42 halaman selesai (beranda),
36 dari 303 kotak. Tetapi yang lebih penting muncul saat menghitungnya:

**Fase R hanya menjangkau 13 dari 30 halaman yang sudah dibangun v1.** Tujuh
belas sisanya ada di `todo-redesign.md` tetapi **tidak punya rumah di fase mana
pun**:

| Grup | Rute |
|---|---|
| Auth | `/masuk` · `/daftar` · `/lupa-sandi` · `/mulai` |
| Dompet | `/koin` · `/koin/transaksi` · `/koin/transaksi/:txId` |
| Penghasilan | `/penulis/analitik` · `/penulis/penarikan` · `/penulis/penarikan/riwayat` |
| Ulasan | `/cerita/:id/ulasan` |
| Studio | `daftar-penulis` · kelola bab · editor bab ×2 · akses bab · analitik cerita |

**Penyebabnya bisa disebut persis, dan itu kesalahan saya.** Fase R saya susun
dari urutan bangun brief §15 — dan §15 hanya menyebut layar yang **punya PNG**.
Saya memperlakukan brief sebagai rencana lengkap padahal 27 PNG cuma menutup 14
dari 42 rute. Yang jatuh di luarnya justru yang paling mahal kalau salah:
**seluruh alur uang** dan **editor bab yang memegang naskah belum tersimpan**.

### Yang ditambahkan

**R8 — Auth & dompet · 3–4 hari** (R8a auth · R8b `/koin` · R8c buku besar).
**R9 — Penghasilan & sisa studio · 3–5 hari** (R9a pencairan · R9b enam rute
studio · R9c ulasan · R9d penutup).

Keduanya **tanpa mockup**, jadi "cocok dengan PNG" tidak berlaku di sana;
gantinya `PRD Novelova/prd_01_design_system.md` **§0**, dan aturan lama tetap:
kalau butuh pola yang belum ada, **tanyakan dulu**.

Tiga pagar dibawa masuk ke kotaknya, bukan diserahkan pada ingatan:

- **`/koin`** layar uang — alur, timer kedaluwarsa, idempotency, dan ledger tidak
  boleh disederhanakan demi tampilan (keputusan terkunci #4).
- **Pencairan** — tangga validasi lima tingkat ditegakkan dua kali dari satu
  berkas; menata ulang layarnya tidak boleh menyentuh `lib/payout.ts` (§1.15).
- **Editor bab** — autosave dua lapis **tidak disentuh sama sekali**, `DRAFT-409`
  tetap tidak membekukan editor, dan pesan gagalnya tetap menyatakan tulisanmu
  aman (§1.4).

Estimasi Fase R **15–22 → 21–31 hari**. Kotak Fase R **110 → 154**.

### Empat cacat kecil di `todo-redesign.md` ikut diperbaiki

Ditemukan saat memeriksa berkasnya, bukan dicari: butir 9 Pemeriksaan baku
menyelip **sebelum** butir 8 · teks tautan masih tertulis `../todo.md` padahal
targetnya sudah satu folder · jumlah kotak masih tertulis 300 padahal 303 ·
paragraf "dua pertiga rute tidak punya mockup" tidak menyebut siapa yang
mengerjakannya. Jumlahnya sekarang **dihitung ulang dari berkasnya**, bukan
ditulis dari ingatan.

### Yang **belum** dikerjakan

- **Nol perubahan kode.** Ini penambahan rencana; R3–R9 semuanya masih kosong.

---

## 2026-09-04 · Langkah 48 — pemisahan v1/v2 diperbaiki, PRD diduplikat, data contoh dipisah dari seeder

> "oke saya tidak suka cara anda. Anda tidak ikuti saran saya untuk buat file
> duplikat todo.md untuk project novelova-v2. Dan untuk data-data kebutuhan tidak
> dijadikan mocky dan datanya anda taro asal. Sekarang yang ingin saya mau adalah
> duplikat file todo.md dan architecture.md untuk versi project novelova-v2.
> Sebelumnya ubah untuk file todo.md dan architecture.md untuk project novelova
> di adjust jika ada yang berhubungan dengan novelova-v2 supaya lebih rapih.
> Kemudian untuk folder PRD Novelova juga diduplikat untuk menyesuaikan kebutuhan
> fungsi novelova-v2. Paham?"

**Keluhannya benar pada ketiga hal, dan akarnya satu: urutan kerjanya terbalik.**
Fase R, §1.20, dan §1.21 saya tulis ke berkas akar **lebih dulu**, baru saya
duplikat. Hasilnya bukan pemisahan melainkan penggandaan — kedua salinan
sama-sama berisi hal v2, dan berkas v1 penuh rujukan ke folder yang bukan
miliknya.

### 1. Berkas akar dipulihkan jadi v1 murni

Bukan ditambal jejak per jejak: `git checkout HEAD -- todo.md architecture.md`
mengembalikan versi sebelum satu baris v2 pun masuk. Diperiksa sesudahnya —
**nol** kecocokan untuk `novelova-v2`, `Fase R`, dan `putaran 7` di keduanya.

Yang ditambahkan cuma **satu blok penunjuk** di kepala masing-masing: v1 berhenti
di Fase 10, pekerjaan dilanjutkan di `novelova-v2/`, dan tidak ada keputusan v2
yang dicatat di sini — itu disengaja.

### 2. Dokumen v2 berdiri sendiri

`novelova-v2/todo.md` dan `novelova-v2/architecture.md` kini satu-satunya yang
hidup, dengan banner yang menyebut ke mana requirement-nya menunjuk. Keduanya
tetap membawa seluruh keputusan v1 — itu benar, karena kodenya memang salinan v1.

### 3. `PRD Novelova/` diduplikat dan disesuaikan

Tiga belas berkas ke `novelova-v2/PRD Novelova/`. Ketiga belasnya dapat kepala
yang menyebut statusnya; **empat** benar-benar disesuaikan karena fungsinya
memang berubah:

| Berkas | Yang berubah |
|---|---|
| `prd_01_design_system.md` | **§0 baru** memuat design system putaran 7 yang sebenarnya — permukaan, lima tingkat tinta, **dua emas** beserta kontrasnya, dua muka huruf, bentuk, dan daftar larangan. §3 dan §4 ditandai **digantikan**, tetapi tetap dipertahankan: ia survei terukur atas prototipe dan masih benar sebagai catatan |
| `prd_05_reader.md` | **FR-READ-19 baru** (tawaran bundel setelah sepuluh bab) lengkap dengan aturan bisnis dan lima acceptance criteria, plus catatan bahwa ruang baca kini dipecah **dua tipe** dan auto-unlock jadi alur utama |
| `prd_00_overview.md` | Catatan v2 di atas tabel konstanta: skala harga bab yang tidak mungkin benar bersamaan, lencana hemat yang nominal, dan design system yang tidak lagi rose-gold |
| `prd_03_home_discovery.md` | Anatomi beranda putaran 7 — kesembilan blok tetap, bentuknya yang berganti |

Sisanya bertanda "requirement fungsionalnya sama dengan v1; yang berubah hanya
kulitnya" — jujur, dan lebih berguna daripada menyunting sembilan berkas tanpa
alasan.

### 4. Data contoh dipisah dari logika seeding

Keluhan yang paling tepat sasaran. Empat puluh sinopsis yang ditulis di Langkah 46
saya tempel **langsung ke `seed.ts`**, padahal rantai yang sudah didokumentasikan
adalah `novelova-data.js` → `seed.ts`. Dan `seed.ts` sendiri memang sudah
mencampur keduanya: 1.891 baris berisi delapan belas blok data literal berselang
dengan logika penulisan ke Dexie.

Sekarang ada **`src/api/mock/data/`**:

| Berkas | Isi |
|---|---|
| `catalog.ts` | `StorySeed` · penulis · katalog delapan cerita kanvas · 32 pengisi · **`SYNOPSES` (40)** · **`MY_SYNOPSES` (4)** · kosakata tag |
| `chapters.ts` | Delapan bab `s1` kanvas beserta harganya · `PAID_PRICES` · `PROSE` |

`seed.ts` **1.891 → 1.597 baris** dan sekarang hanya menyusun serta menulis;
isinya diimpor. Menambah cerita contoh tidak lagi menuntut menyentuh berkas
seeding. `CLAUDE.md` §1 menyebut folder itu beserta aturannya: **konten baru
masuk ke sana, bukan ke `seed.ts`.**

### Yang **tidak** dikerjakan, dan alasannya

- **Lima blok data lain tetap di `seed.ts`** — `FOLLOWER_ROWS`, `LIB_SEED`,
  `REVIEW_SEED`, `NOTIF_SEED`, `PKG_SEED`. Yang dipindah adalah **isi cerita dan
  bab**, yaitu tempat data saya tadi mendarat dan bagian yang paling sering
  bertambah. Memindahkan sisanya sekaligus menggandakan risiko pada langkah yang
  tujuannya justru merapikan; polanya sudah berdiri, dan pemindahan berikutnya
  tinggal mengikuti.
- **Sembilan PRD lain tidak disunting isinya.** Fungsinya memang tidak berubah di
  v2; kepala berkasnya menyatakan itu apa adanya.
- **`CLAUDE.md` §2 diperbaiki**: aturan changelog masih menunjuk
  `novelova/CHANGELOG.md`, folder yang sudah beku.

---

## 2026-09-04 · Langkah 47 — dokumen dipisah ke `novelova-v2/`, dan tiga temuan di jalur harga

> "oke saya mau diskusi untuk proses chapter unlock ada update seperti ini …
> Nah ini untuk novelova-v2 saja jadi saya prefer untuk buat duplikat todo dan
> architecture untuk novelova-v2 supaya lebih rapih"

### Dokumen

`architecture.md` dan `todo.md` disalin ke `novelova-v2/`. Tujuh tautan relatif
di dalamnya diperbaiki supaya tidak menunjuk berkas yang salah setelah turun satu
tingkat, dan `todo-redesign.md` ikut disesuaikan (`../todo.md` → `todo.md`).

**Salinannya diberi tanda, bukan dibiarkan kembar.** Yang di `novelova-v2/`
bertanda **HIDUP**; yang di akar bertanda **BEKU — milik `novelova/` v1, jangan
disunting**. Alasannya aturan yang sudah ada di `CLAUDE.md` §5 untuk berkas PRD:
dua dokumen yang saling membantah lebih buruk daripada satu yang usang. Karena
`novelova/` memang beku, hanya ada satu dokumen hidup — duplikasinya aman selama
yang lama benar-benar berhenti disunting.

`CLAUDE.md` §1 kini menunjuk ke salinan v2 sebagai yang berlaku.

### Tiga temuan di jalur harga bab

Ditemukan saat menelusuri alur unlock untuk permintaan di atas, **bukan dicari**.
Ketiganya sudah ada sejak `novelova/` v1.

**1. `PRICE_SINGLE = 1_500` sudah jadi kode mati.** Nol pemakai di seluruh `src/`.
Gerbang memakai `Chapter.priceCoins` masing-masing bab — dan itu **benar**, sudah
diperbaiki sebagai cacat PRD 05 §7 #12. Akibatnya FR-READ-09 yang berbunyi
*"selalu memakai harga satuan 1.500"* tidak lagi menggambarkan kodenya: harga
bab di seed bervariasi **1.500 · 1.800 · 2.000**.

Ini penting justru untuk alur baru: "auto unlock sampai koin habis" menguras
saldo dengan **laju yang berubah-ubah**, dan pembaca tidak bisa menghitungnya
dari satu angka.

**2. Lencana hemat PRD tidak cocok dengan aritmetikanya sendiri.** `prd_00` §6
menulis bundel "hemat ±5%" dan tamat "±10%". Dengan harga seed, sepuluh bab
satuan ≈ 15.000–20.000 melawan bundel 12.000 — **20–40%**, bukan 5%. Kodenya
sudah benar: `UnlockOption.individualCoins` menghitung total satuan sungguhan dan
lencananya diturunkan dari situ, dengan komentar yang menyebut alasannya. Jadi
aplikasi jujur dan angka PRD-nya yang nominal. **Konsekuensi untuk fitur baru:**
copy "tawaran menarik" harus mengambil angka dari `individualCoins`, tidak boleh
menulis persentase tetap.

**3. Skala harga bab tidak cocok dengan skala paket koin — dan ini yang berat.**

| | Koin |
|---|---|
| Paket isi koin **terbesar** | **2.000** (Rp 185.000) |
| Buka **satu** bab | **1.500 – 2.000** |
| Bundel 10 bab | **12.000** |
| Buka sampai tamat | **36.900** |

Paket terbesar yang bisa dibeli hanya cukup untuk **satu bab**. Bundel sepuluh
bab menuntut membeli paket terbesar **enam kali** (Rp 1.110.000), dan akses penuh
satu novel Rp 2.049.000.

Di sisi lain `prd_07` FR-STUDIO menetapkan penulis mematok harga bab **1–50 koin,
bawaan 3** — dan kodenya menegakkan itu (`PRICE_MIN = 1`, `PRICE_MAX = 50`).
Jadi bab seharga 1.500 koin **tidak mungkin dibuat lewat UI penulis**.

Dugaan yang paling cocok dengan semua angkanya: **1.500 / 12.000 / 36.900 di
prototipe adalah rupiah, bukan koin.** Dibagi kurs 130 hasilnya ~11,5 · ~92 ·
~284 koin — ketiganya masuk akal terhadap paket 50–2.000 koin, dan ~11,5 masuk
rentang penulis 1–50.

**Kenapa ini menghalangi fitur yang diminta.** Inti permintaannya adalah
"buka terus sampai koin habis". Dengan konstanta sekarang, seluruh isi paket
terbesar habis **sebelum bab kedua**, dan lembar "saldo kurang" akan muncul di
tiap bab — persis kebalikan dari alur mulus yang diminta. Ditanyakan sebelum satu
baris pun ditulis.

### Keputusan yang diambil di diskusi ini

| Pertanyaan | Jawaban |
|---|---|
| Skala harga bab | **Dibiarkan dulu**, alurnya dikerjakan lebih dulu |
| Kapan tawaran bundling muncul | **Setelah 10 bab** |
| Isi tawaran | **Selalu bundel 10**, tetapi ambangnya **dapat diatur** |
| Bentuk tawaran | **Pita non-blocking di pembuka bab** |

Ditulis jadi `architecture.md` §**1.21** dan sepuluh kotak baru di `todo.md`
**Fase R4**.

**Satu akibat yang baru terlihat setelah keputusannya digabung.** Membiarkan
skala harga + ambang di 10 membuat pita tawarannya **tidak terjangkau dari saldo
contoh**: tiga bab pertama gratis, sepuluh bab berbayar berikutnya berjumlah
17.200, sementara saldo contoh 15.300 — pembaca kehabisan koin di bab ke-12, dua
bab sebelum ambang.

Itu bukan cacat; itu alurnya bekerja, dan lembar saldo kurang memang muncul.
Yang tidak bekerja cuma **mencobanya dengan tangan**. Jalan keluarnya mengikuti
kebiasaan yang sudah ada — satu sakelar dev di `/dev/kitchen-sink`, tempat yang
sama dengan tiga sakelar sesi dan tiga hasil pembayaran. **Saldo seed sengaja
tidak dinaikkan**: `15,3rb` tercetak di `7a`, `7x`, dan `7i`.

### Spec disiapkan sampai tingkat berkas

> "dipersiapkan todo nya dan architecture nya biar pasti pas implementasi"

Kode ditelusuri lebih dulu, dan **dua hal ternyata tidak seperti dikira**:

**1. `readerPrefs.autoUnlockStoryIds` belum ada.** §1.19 menulisnya seolah
keadaan (*"Tempatnya `readerPrefs.autoUnlockStoryIds`, sebelah
`hiddenStoryIds`"*) padahal itu rencana. `ReaderPrefsSchema` hanya punya empat
kolom. §1.19 diberi koreksi di tempatnya supaya tidak menyesatkan sesi
berikutnya.

**2. Izin buka-otomatis hari ini melanggar aturan struktur #5.** Ia sakelar
global di `stores/readerSettings.ts`, dibaca `ReaderPage.tsx:130`. Aturan #5:
*"Kalau harus ikut saat pengguna berganti perangkat, ia bukan urusan
`stores/`."* Sakelar ini memberi wewenang **memotong koin**. Pelanggarannya
lahir sebelum §1.19 memutuskan sebaliknya, dan R4b yang menutupnya — jadi
memindahkannya bukan pekerjaan tambahan, melainkan bagian dari pekerjaan yang
sama.

**`architecture.md` §1.21 bertambah lima bagian:** keadaan kode sekarang · model
data (tiga kolom baru di `ReaderPrefs`, beserta alasan kenapa
`bundleOfferSeenStoryIds` tetap perlu walau penghitungnya sudah ada) · seam (tiga
metode baru, `NovelovaApi` **109 → 112**, dan dua bendera di `UnlockInput` yang
masing-masing punya alasan tepat) · kenapa **saldo tidak diperiksa klien** ·
daftar berkas yang sakelar globalnya dicabut.

**Fase R4 ditulis ulang: 30 → 57 kotak, delapan sub-langkah berurutan**
(R4a data & seam → R4b cabut sakelar → R4c gerbang → R4d setelah terbuka →
R4e saldo kurang → R4f iklan → R4g pita bundling → R4h test). Urutannya mengikat:
server dulu, layar belakangan — empat kolom data dan tiga metode seam dipakai
hampir semua kotak sesudahnya. Estimasi Fase R naik **14–19 → 15–22 hari**.

`todo-redesign.md` diberi penunjuk ke R4a–R4h supaya jelas mana daftar urutan
kerja dan mana daftar anatomi layar.

### Yang **belum** dikerjakan

- **Nol perubahan kode.** Yang berubah di langkah ini hanya dokumen: dua salinan,
  §1.21 beserta lima bagian tekniknya, R4 yang ditulis ulang, dan koreksi §1.19.
- Empat dari lima butir alur yang dijelaskan pengguna **sudah jadi FR-READ-09
  versi revisi 4 September** dan sudah terencana di Fase R4. Yang benar-benar baru
  hanya **tawaran bundling setelah N bab**.

---

## 2026-09-04 · Langkah 46 — R2: beranda dibangun ulang mengikuti `7a` dan `7s`

> "bukan seperti itu design saya mau. coba lihat folder Novel reader UI
> redesign\putaran7 untuk design refersnsi"
>
> "fokus dibagian itu"

**Benar, dan keluhannya tepat.** Langkah 43 hanya mengganti token dan primitif —
warna dan huruf berubah, susunan halamannya tidak. Beranda masih memakai pil
sebagai tab genre, banner masih kartu bergambar penuh berscrim, kepala section
masih judul serif besar, dan FAB koin masih pil di kanan bawah. Tidak satu pun
dari itu ada di `7a`.

### Delapan hal yang berubah, semuanya dari `7a`

| | Sebelum | Sekarang |
|---|---|---|
| Kepala | sapaan + 3 ikon berkotak | sapaan serif, **chip koin**, tiga ikon polos; subjudul melebar penuh di bawahnya |
| Tab genre | deret **pil** | **tab teks bergaris bawah 2px** |
| Banner | gambar penuh + scrim + gradien | **kartu garis rambut**: sampul 66×88 kiri, judul serif, caption, pil `Baca sekarang` terisi |
| Kepala section | `<h2>` serif 20px | label 9,5px/800/`.16em` + garis 1px + `See all` emas |
| Kartu Populer | sampul + judul + **lencana genre** | lencana peringkat `#1 Populer`, judul serif, penulis, **`★ rating` emas + jumlah baca** |
| Baru & Naik Cepat | sama dengan Populer | + **garis pertumbuhan emas** dari `weeklyReads` |
| Section tematik | deret mendatar | **daftar tegak bernomor** |
| Lanjut Membaca | kartu daftar | daftar tegak + **batang progres garis rambut, persentase, tombol putar terisi** |
| Iklan | kartu putus-putus | **pita garis rambut** berlabel `BERSPONSOR` |
| FAB koin | pil `15,3rb` di **kanan** bawah | **lingkaran 48px di kiri bawah** |
| Pengaturan section | popover sudut | **lembar** `7s`: judul serif, sembilan baris berpembatas, `Selesai` + `Atur ulang` |

### Progres "Lanjut Membaca" — satu angka, satu sumber

`7a` §9 menuntut batang progres di baris Lanjut Membaca, dan `HomeSection` tidak
punya datanya. Yang **tidak** dilakukan: menghitungnya di klien dari
`chapterCount`. Itu akan membuat beranda dan `/pustaka` menampilkan bar yang
sama untuk cerita yang sama dari dua perhitungan berbeda — persis jebakan yang
sudah tercatat di `CLAUDE.md` §8.

Yang dilakukan: perhitungan di `handlers/library.ts` diangkat jadi
**`readingCounts()`**, dipakai `/pustaka` **dan** handler beranda. `HomeSection`
mendapat satu kolom `progress` yang hanya diisi `lanjut-baca`. Handler beranda
sudah memuat `db.progress` sejak dulu, jadi datanya memang sudah ada di sana.

### Dua hal yang sempat tertahan, dan bagaimana keduanya selesai

**1. Kutipan serif Editor's Picks (`7a` §7) sempat dilepas.** Satu-satunya sumber
teks di kontrak adalah `synopsis`, dan seluruh **40 cerita contoh berbagi satu
`const SYNOPSIS`** di `seed.ts` — ketiga kartunya menampilkan kalimat yang persis
sama. Sudah dipasang, dilihat hasilnya, lalu dilepas: kutipan identik tiga kali
terbaca sebagai kerusakan, bukan kurasi.

Ditanyakan, dan jawabannya **tulis sinopsis per cerita di seed**. Sekarang ada
`SYNOPSES` (40) dan `MY_SYNOPSES` (4), masing-masing dua kalimat, dan **kalimat
pertamanya ditulis supaya berdiri sendiri** — itulah yang diambil jadi kutipan.
Alasannya sudah punya preseden di berkas yang sama: kosakata tag dulu diseragamkan
lalu harus dibedakan begitu delapan section kurasi dibangun di atasnya.

Efek sampingnya bagus dan gratis: halaman detail cerita berhenti menampilkan
sinopsis yang sama untuk empat puluh judul berbeda.

**2. Label section tetap Bahasa Indonesia.** Brief §0 menyatakan `POPULAR`,
`NEW & TRENDING`, `EDITOR'S PICKS`, `TOP ROMANCE`, `CONTINUE READING` final karena
*"they come from the home PRD"*. **`prd_03_home_discovery.md` tidak memuat satu pun
label itu** — sudah diperiksa. Jadi ini bukan mockup-vs-PRD melainkan brief yang
keliru menyebut sumbernya, dan menimpa aturan terkunci #3 (UI Bahasa Indonesia)
atas klaim yang tidak terbukti bukan keputusan yang boleh diambil sendiri.

Ditanyakan, dan jawabannya **tetap Bahasa Indonesia**. Judul dari server dipakai
apa adanya; yang berubah cuma gayanya — huruf besar 9,5px oleh kepala section.
Keputusan #3 utuh.

### Emoji dibuang

`greetingSub` berbunyi `'Enjoy your reading today ✨'`. Brief §14 melarang emoji
tanpa syarat. Satu-satunya di seluruh `i18n/id.ts`.

### Satu cacat lama yang ketahuan di jalan

Suite unit lulus **543/543 tetapi keluar dengan kode 1**: `ToastProvider`
memasang `setTimeout` dan **tidak pernah membatalkannya saat unmount**, jadi
`setToast` berjalan pada provider yang sudah dilepas. Di aplikasi akibatnya cuma
no-op — itulah kenapa ia tidak pernah terlihat. Di test ia muncul sebagai
kesalahan **setelah environment dibongkar**, dilaporkan atas nama berkas test
yang kebetulan berjalan terakhir (`AnalyticsPage.test.tsx`), jauh dari
penyebabnya. Berkas itu lulus bersih saat dijalankan sendirian.

Diperbaiki dengan `useEffect(() => () => clearTimeout(timer.current), [])`.

### Verifikasi

`npm run check` bersih · **543 test unit** · **61 e2e** · beranda **nol luberan**
di 320 · 360 · 430. Diperiksa dengan mata di 320 dan 390: di 320 sapaan
`Hi, Anna` turun jadi dua baris alih-alih terpotong jadi `Hi,…` — `<h1>` halaman
yang terpenggal lebih buruk daripada huruf yang lebih kecil.

**Halaman lain belum disentuh.** R2 hanya beranda; `/cari`, `/jelajah`, detail
cerita, ruang baca, dan seluruh studio masih tata letak lama dengan kulit baru.

---

## 2026-09-04 · Langkah 45 — port dev `novelova-v2/` jadi 1311

> "ubah port nya menjadi 1311 untuk novelova-v2"

Enam berkas, satu angka — tetapi angkanya hidup di enam tempat, dan melewatkan
satu di antaranya membuat gejalanya muncul jauh dari sebabnya.

| Berkas | Dari | Jadi |
|---|---|---|
| `vite.config.ts` | `server.port: 5173` | **1311** + `strictPort: true` |
| `playwright.config.ts` | `baseURL` & `webServer.url` :5173 | **:1311** |
| `docker-compose.yml` | `'5173:5173'` | **`'1311:1311'`** |
| `Dockerfile` | `EXPOSE 5173` | **`EXPOSE 1311`** |
| `README.md` | dua sebutan :5173 | **:1311** |
| `../CLAUDE.md` §7 | perintah jalan + catatan `--port 5174` | **:1311**, catatan manualnya dihapus |

**`novelova/` tetap di 5173**, jadi keduanya boleh hidup bersamaan — dan catatan
lama di `CLAUDE.md` yang menyuruh menambahkan `--port 5174` untuk folder kedua
sudah tidak berlaku, jadi dihapus supaya tidak ada yang mengikutinya.

### Kenapa `strictPort` ikut ditambahkan

Ini satu-satunya baris yang tidak diminta, dan alasannya spesifik untuk keadaan
sekarang: ada **dua** aplikasi Novelova di mesin ini. Tanpa `strictPort`, Vite
diam-diam pindah ke port berikutnya saat 1311 terpakai. Playwright menunggu di
1311 dengan `reuseExistingServer: true`, menemukan apa pun yang kebetulan ada di
sana, dan **lulus dengan tenang sambil menguji aplikasi yang salah**. Gagal keras
di detik pertama jauh lebih murah daripada suite hijau yang bohong.

### Yang **tidak** diubah

- **Profil `prod` tetap `:8080`** di kedua folder. Permintaannya satu port, dan
  yang dibuka sehari-hari adalah dev server. Kalau kedua profil prod perlu hidup
  bersamaan, sebutkan — itu satu baris di `docker-compose.yml`.
- **`.env.example` `VITE_API_BASE_URL=http://localhost:8080/api`** dibiarkan: itu
  alamat **backend** yang kelak menggantikan mock, bukan port aplikasi ini.

`npm run check` bersih · **543 test unit** · **61 e2e lulus di port 1311** —
e2e-nya menjalankan dev server sendiri, jadi lulusnya sekaligus membuktikan port
barunya benar-benar terpasang.

---

## 2026-09-04 · Langkah 44 — lima lebar telepon, dan dua cacat yang sudah ada sejak v1

> "apakah sudah pastikan ketika berjalan di layar smartphone (large, xlarge,
> medium, small) tidak rusak design nya. Saya ingin tidak rusak saat di layar
> tertentu."
>
> "Ini dimasukan ke CLAUDE.md untuk pengingat"

**Belum, dan ternyata memang ada yang rusak.** Di Langkah 43 saya memeriksa 390px
saja lalu melaporkannya sebagai sudah diperiksa, dengan catatan "belum diperiksa
di 1440px" — kalimat yang menyembunyikan bahwa 320px dan 360px juga belum pernah
dibuka.

### Sapuannya

26 halaman × 7 lebar (320 · 360 · 390 · 430 · 480 · 768 · 1440), mengukur
`scrollWidth − clientWidth` **dan** mencari elemen yang tepi kanannya melewati
lebar layar. Elemen yang memang menggulir sendiri (carousel) tidak dihitung
sebagai cacat — luberan tanpa nama penyebabnya hanya memberi tahu bahwa ada yang
salah, bukan di mana.

**Hasil awal: 10 kombinasi rusak dari 182.** Semuanya di empat halaman Author
Studio, dan **semuanya di ≤390px** — nol di 412px ke atas. Itu persis
menjelaskan kenapa e2e yang ada tidak pernah menangkapnya: ia hanya diuji di
Pixel 7 (412px), lebar yang paling pemaaf.

**Sapuan yang sama terhadap `novelova/` v1 menemukan 7 kombinasi rusak di
halaman yang sama.** Cacatnya sudah ada sebelum redesign; R1 hanya melebarkan
sedikit sehingga ikut muncul di 390px.

### Dua akar

**1. `grid gap-*` tanpa `grid-cols-*`.** Grid tanpa kolom eksplisit membuat satu
track `auto`, dan track `auto` tidak pernah turun di bawah min-content anaknya.
Jejak penelusurannya lugas:

```
256px  <div class="space-y-3">
256px  <div class="grid gap-2.5">   grid-cols: 369.797px   ← track 370px di kotak 256px
370px  <article>                    ← MELUBER
340px  <div class="flex flex-wrap"> ← tidak pernah membungkus, karena muat di 370
```

Tiga belas tempat diberi `grid-cols-1` (= `minmax(0,1fr)`, minimumnya nol).
Satu-satunya yang dilewati adalah matriks QR di `PaymentOverlay`, yang memang
punya `gridTemplateColumns` sendiri.

**2. `<fieldset>` mengalahkan `overflow-x: auto`.** Stylesheet bawaan peramban
memberinya `min-inline-size: min-content`, jadi deretan chip rentang waktu
mendorong badan halaman alih-alih menggulir sendiri — `overflow-x-auto` terlihat
sudah dipasang dan tetap tidak bekerja. Diperbaiki **sekali** di `base.css`,
bukan 17 kali di tiap `<fieldset>`.

**Sapuan ulang: 0 dari 182.** `npm run check` bersih, **543 test unit lulus**, dan **61 e2e lulus** — naik dari 58 karena tiga halaman ditambahkan ke daftar sapuan.

### Penjaga permanennya

`tests/e2e/isi-koin-di-hp.spec.ts` — daftar halamannya dipertahankan dan
**ditambah tiga** (`/jelajah/populer`, `/cerita/s1`, ruang baca), lalu tiap
halaman disapu di **lima lebar**: 320 · 360 · 390 · 412 · 430. Lima lebar dalam
satu test per halaman, bukan 125 test terpisah — pesan gagalnya sudah menyebut
lebar mana yang rusak, dan memecahnya hanya membuat suite lima kali lebih lambat
tanpa memberi tahu apa pun yang baru.

### Yang dicatat sebagai pengingat

Atas permintaan pengguna, aturannya masuk **`CLAUDE.md` §2** beserta kalimat
aslinya, tabel lima lebar, dan catatan bahwa **320 dan 360 yang menemukan
cacatnya, bukan 412**. Kedua akar di atas masuk **§8 Jebakan**. Butir kesembilan
"lulus di lima lebar" ditambahkan ke Pemeriksaan baku di `todo-redesign.md`,
jadi ia berlaku untuk keempat puluh dua halaman, bukan cuma yang sedang
dikerjakan.

### Yang **tidak** diperbaiki, dan kenapa

**FAB koin masih menutupi baris tab saringan di 320px** (`/karya`,
`/karya/:id/bab`). Bentuknya sekarang pil `15,3rb` selebar ~110px di kanan bawah;
brief §2 memintanya jadi **lingkaran 48px di kiri bawah**. Memindahkannya ke kiri
tanpa sekaligus mengecilkannya hanya menukar siapa yang tertutup — di 320px
tab `Semua` justru ada di kiri. Keduanya harus sekaligus, dan itu sudah jadi
butir **R2**; catatan "diperiksa di 320px juga" ditambahkan ke sana.

Ini juga bukan cacat khusus layar sempit: FAB-nya menutupi hal yang sama di 390
dan 412, dan menggulir mengeluarkannya. Yang membuatnya layak diperbaiki bukan
lebarnya, melainkan brief-nya.

---

## 2026-09-04 · Langkah 43 — R1 selesai: token, tipografi & primitif putaran 7

> "oke sekarang lanjutkan perubahan novelova-v2 untuk redesign nya"

**Seluruh aplikasi berganti kulit dalam satu langkah**, dan `npm run check`
bersih dengan **543 test masih lulus** — nol test yang perlu disesuaikan, karena
tidak ada satu pun yang menguji warna atau nama kelas.

### Token

`tokens.css` ditulis ulang. Yang membuatnya murah: **satu nilai `--nv-accent`
mengubah 191 pemakaian sekaligus.** Aksennya sekarang tinta `#1c1a18`, bukan
emas — brief §1 menyebutnya lugas, tombol utama isi gelap dan emas *"never for
large fills"*. Jadi tombol, tab aktif, dan garis bawah tab ikut benar tanpa satu
pun komponen disentuh.

Empat nama token diganti karena perannya melebar, lewat satu lintasan `sed`:

| Lama | Baru | Kenapa |
|---|---|---|
| `--nv-coin` | `--nv-gold` `#7d5411` | emas teks kini juga dipakai rating dan `See all`, bukan cuma koin |
| `--nv-coin-icon` | `--nv-gold-line` `#b68235` | emas garis: batang progres, titik tab, garis judul bab |
| `--nv-accent-strong` | `--nv-accent` | putaran 7 tidak punya "aksen yang lebih kuat" — dua nama untuk satu hex |
| `--nv-accent-2` | `--nv-gold-line` | dua pemakainya (garis sisipan, konfeti) memang menginginkan emas |

Pembagian `--nv-coin` / `--nv-coin-icon` yang lama ternyata **sudah** memecah
persis hal yang benar, dengan alasan yang sama. Yang berubah cuma namanya.

Tiga token dibuang karena nol pemakai di `.tsx`: `--nv-cat-popular`,
`--nv-cat-trending`, `--nv-cat-editors`. Tiga ditambah: `--nv-text-2`,
`--nv-disabled`, `--nv-read-ink`. Ditambah `--nv-jacket-1..3` untuk sampul tanpa
artwork, yang membawa **satu-satunya gradien yang diizinkan brief §14**.

**Tema gelap = mode malam `7g`, bukan inversi mekanis.** Di sana emaslah yang
jadi aksi — sakelar nyala dan tombol `Bab 4 ›` — dan isi bab sengaja lebih redup
(`--nv-read-ink` `#ddd6cd`) daripada teks antarmuka, supaya tidak menyilaukan.

### Tipografi

`@fontsource-variable/lora` + `@fontsource-variable/plus-jakarta-sans`
menggantikan Manrope + Cormorant Garamond. **Tukar dua, bukan tambah dua.**

### Primitif

- **`Tabs` jadi tab teks bergaris bawah 2px**, bukan pil. Brief §1 memisahkan
  keduanya tegas; `Chip` tetap pil dan yang terpilih kini **terisi**, bukan
  sekadar berlatar samar.
- **`Field` pecah jadi dua bentuk**: satu baris → garis bawah 1,5px teks serif;
  banyak baris → kotak garis rambut. Keduanya **tidak lagi mematikan `outline`**
  — dengan kolom yang cuma bergaris bawah, perubahan warna garis saja terlalu
  tipis sebagai satu-satunya penanda fokus.
- **`Switch`** 44×26, knob 20. Angka brief menyebut padding 3, tetapi garis 1px
  memakan tepi di keempat sisi, jadi paddingnya jadi 2 — yang tetap persis
  adalah **jarak tempuhnya**, 18px.
- **`BottomNav` → `ModernTabBar`**: putih penuh, 86px, titik emas 5px di bawah
  tab aktif. Titiknya `aria-hidden` (yang menyampaikan "halaman ini" adalah
  `aria-current`) dan tetap dirender saat tab tidak aktif dengan `opacity-0`,
  supaya tinggi barisnya tidak berubah saat tab berpindah.
- **`IconButton` melepas kotaknya** — ikon di `7a`, `7v`, `7x` berdiri sendiri.
  Target ketuk tetap ≥44px.
- **`danger` tidak lagi terisi merah**, jadi pil bergaris. Brief menyebutnya
  lugas; tetapi tetap dibedakan, karena tombol hapus yang tidak bisa dibedakan
  dari tombol batal adalah cacat yang lain lagi.
- **Bayangan dicabut dari `nv-card`.** Yang tersisa dua: `shadow-nv-soft` untuk
  sampul, `shadow-nv` untuk yang benar-benar melayang.

### Dua primitif baru — dan satu yang sengaja tidak dibuat

**`Cover` diangkat, bukan ditulis ulang.** Ia sudah ada sebagai komponen privat
di dalam `StoryCard`; yang dilakukan memindahkannya keluar dan menaikkannya ke
spesifikasi putaran 7 — radius 5px, bayangan sampul, dan **jaket satu huruf**
menggantikan ikon buku generik yang membuat sepuluh cerita terlihat sebagai
sepuluh salinan. Hurufnya diambil dari huruf pertama yang *terlihat*, bukan
`title[0]`: judul boleh diawali tanda kutip, dan jaket bertuliskan `"` tidak
menandai apa pun.

**`SectionHeader`** (+ `SeeAllAction`) — label 9,5px/800/`.16em`, garis 1px yang
mengisi sisa lebar, aksi rata kanan.

**`ListRow` sengaja tidak dibuat.** Empat daftar yang seharusnya ia layani —
`7a` Top Romance, `7c` pustaka, `7d` lihat-semua, `7j` karya — berbeda terlalu
jauh: peringkat, batang progres, kata status, baris aksi. Satu komponen bersama
hanya akan jadi selusin prop. Yang benar-benar sama cuma pembatasnya, dan itu
sudah berupa satu utility (`divide-y divide-nv-line`). Dibuka lagi kalau R2 dan
R5 ternyata menulis anatomi baris yang persis sama dua kali.

### Satu pengecualian ukuran huruf yang perlu diketahui

PRD 01 §4.4 menetapkan **12px sebagai lantai** karena prototipe memakai 9–11px
sebanyak 298×. Brief putaran 7 §1 menetapkan kepala section **9,5px** / 800 /
`.16em` huruf besar. Keduanya dipertahankan: `--text-label` 9,5px ada dan
**hanya** untuk label pendek berbobot 800 dengan jarak huruf lebar
(`POPULAR`, `BERSPONSOR`, `KOIN KAMU`) — 12px tetap lantai untuk kalimat.

### Satu kesalahan lama yang ditemukan dan diperbaiki

`CLAUDE.md` §9 dan `architecture.md` menyebut **"runtime tetap 11 paket"**.
Hitungannya salah sejak dulu: `novelova/` punya **12** dependensi runtime, dan
`novelova-v2/` juga 12 setelah pertukaran font. Empat berkas dikoreksi. Tidak
ada dependensi yang ditambah — yang salah cuma angkanya.

### Yang **belum** dikerjakan

- **Halaman belum ditata ulang.** Beranda masih memakai `Chip` sebagai tab genre,
  banner masih kartu bergambar penuh, kepala section masih judul serif besar, dan
  FAB koin masih di kanan bawah. Semuanya isi **R2** — R1 hanya menyentuh token
  dan primitif.
- Diperiksa dengan mata di `/`, `/pustaka`, `/cari`, dan `/dev/kitchen-sink`,
  terang dan gelap, di viewport 390px. Belum diperiksa di 1440px.

---

## 2026-09-04 · Langkah 42 — todo redesign per halaman

> "oke di novelova-v2 buat todo untuk setiap halaman untuk dilakukan redesign"

**`todo-redesign.md`** lahir di `novelova-v2/`: **42 rute, satu bagian
masing-masing, 300 kotak.** Daftar rutenya diambil dari
`src/routes/index.tsx`, bukan dikarang — termasuk status tiap rute
(`ADA` vs `PENAMPUNG`), yang membedakan "ganti kulit" dari "bangun baru".

Fase R di `../todo.md` tidak diganti. Ia menyusun pekerjaan menurut **urutan
bangun**; berkas baru ini menyusunnya menurut **apa yang dibuka pengguna**. Dua
sudut pandang atas pekerjaan yang sama, dan Fase R kini menaut ke sana.

### Tiga hal yang baru terlihat setelah dipetakan per rute

**1. Hanya 14 dari 42 rute punya mockup.** 27 PNG putaran 7 terdengar banyak
sampai dipetakan ke rute: `7o`–`7r` semuanya satu halaman, `7u`/`7v`/`7f`/`7g`/
`7x`/`7y`/`7z`/`7aa` semuanya satu halaman. Yang **tidak** tergambar justru yang
paling mahal kalau salah — seluruh alur uang (`/koin`, riwayat transaksi, dan
ketiga halaman pencairan), editor bab yang memegang naskah belum tersimpan, dan
kedua halaman analitik. Semuanya diberi tanda "tanpa mockup" dan diikat ke §1
brief, dengan aturan tegas: kalau butuh pola yang belum ada, **tanya dulu**.

**2. `/profil` adalah penampung yang punya mockup.** Brief §10 memintanya
dibangun, jadi ia maju dari Fase 13 ke R5 — membangunnya nanti berarti
membangunnya dua kali. Ia juga menutup **titik ke-5 dari enam** yang dijanjikan
FR-WALLET-17. Titik ke-6 (pusat hadiah) tetap menunggu Fase 12.

**3. Sebelas penampung lain tidak punya mockup dan bukan pekerjaan Fase R.**
Tetap didaftar, dengan satu kotak "kalau dibangun" masing-masing — supaya tidak
ada sesi berikutnya yang membangunnya dengan palet lama.

### Yang **tidak** dikerjakan

- **Masih nol perubahan kode.** Ini berkas rencana; R1 belum disentuh.
- **Tidak ada 8 × 42 kotak pemeriksaan baku.** Delapan aturan yang berlaku di
  semua halaman ditulis **sekali** di kepala berkas; tiap halaman merujuknya
  dengan satu kotak. 240 kotak identik bukan ketelitian, itu kebisingan.
- **`/karya/baru` + `/karya/:id/ubah` dan kedua rute editor bab digabung** satu
  bagian masing-masing — keduanya memang satu komponen dua mode, dan memecahnya
  di todo mengundang orang memecahnya di kode.

---

## 2026-09-04 · Langkah 41 — `novelova-v2/` lahir: redesign putaran 7 dimulai

> "Nah disini kan ada folder novelova yang isinya adalah pwa, akan tetapi disini
> saya merasa desain nya kurang menarik jadi saya ingin kamu buat folder baru
> kemudian isinya adalah copy an dari folder novelova. Untuk planning design nya
> bisa cek file redesign-novelova.md ini untuk color yang saya inginkan.
> Kemudian untuk preview tampilan bisa cek di folder Novel reader UI
> redesign/putaran7. Itu adalah contoh tampilan yang ingin saya redesign. Untuk
> todo ikuti terakhir di file todo.md. Jika ada yang kurang paham tolong selalu
> konfirmasi"

**Belum ada satu baris desain yang berubah.** Langkah ini hanya membuat
salinannya dan menuliskan rencananya. Itu disengaja: garis dasar yang bisa
di-`git diff` lebih berguna daripada commit pertama yang sudah campur aduk.

### Yang dikerjakan

- **`novelova-v2/`** — salinan `novelova/` pada commit `26fdb68`, tanpa
  `node_modules`, `dist`, `test-results`, dan riwayat git-nya. 341 berkas di
  kedua sisi, dihitung dan dicocokkan.
- `npm ci` lalu **verifikasi sebelum menyentuh apa pun**: `npm run check` bersih
  (biome 277 berkas · `tsc --noEmit` · nol hex di luar `tokens.css`) dan
  **543 test lulus di 51 berkas**. Angka yang sama dengan asalnya.
- `git init` + satu commit garis dasar. Repo baru, riwayat `novelova/` tidak
  ikut — sesuai pilihan.
- **`todo.md` → Fase R** (14–19 hari, tujuh bagian R1–R7) beserta barisnya di
  Ringkasan Fase, dan blok kemajuan di kepala berkas yang kini menyebut dua
  trek.
- **`architecture.md` §1.20** — pembatalan keputusan terkunci #1, ruang
  lingkupnya, dan tiga hal yang diputuskan sendiri karena doc-nya tidak
  menyebutkan (di bawah).

### Empat pertanyaan yang ditanyakan lebih dulu

Aturannya dipakai lagi, dan sekali lagi membayar dirinya: dua dari empat
jawabannya bukan yang paling saya duga.

| Pertanyaan | Jawaban |
|---|---|
| Kulit saja, atau termasuk perilaku yang disebut doc? | **Kulit + perilaku** — doc §7 memecah ruang baca jadi dua tipe, dan Type B **adalah** Fase 5b |
| Keputusan #1 dibatalkan — dicatat di mana? | **`architecture.md` saja.** PRD 01 tidak disunting |
| Nama folder & git? | **`novelova-v2`**, repo baru |
| "ikuti terakhir di todo.md" maksudnya? | **Tulis fase redesign baru di `todo.md`** |

### Tiga hal yang tidak ada di dokumen dan harus diputuskan

Disebut di sini karena ketiganya akan terlihat seperti salah salin kalau tidak
dicatat.

**1. Tiga berkas acuan yang dirujuk doc tidak ada.** `redesign-novelova.md` §0
menyebut `Novel Reader Redesign.dc.html`, `ModernTabBar.dc.html`, dan
`PrintRow.dc.html` — tidak satu pun ada di folder kerja. Yang ada 27 PNG di
`Novel reader UI redesign/putaran7/`. Doc-nya sendiri menetapkan urutan
otoritasnya: *"where a mockup and this document disagree, follow the mockup"*.
Jadi PNG-nya yang berlaku, dan nilai yang tidak disebut doc diambil dari
pikselnya.

**2. Doc tidak pernah menyebut hex emasnya** — hanya `var(--color-accent)`.
Sampel piksel menunjukkan mockup-nya memakai **dua** emas dengan pembagian tugas
yang tegas:

| Nilai | Dipakai untuk | Kontras di `#f4f2ef` |
|---|---|---|
| `#7d5411` | **teks** — saldo koin, rating, harga terkunci, `See all`, `+23 bonus`, badge mahkota | **5,98:1** ✓ |
| `#b68235` | **bukan teks** — garis emas judul bab, batang progres, titik tab aktif, seluruh aksen malam | 3,01:1, dan itu tidak apa-apa |

Kalau `#b68235` dipakai untuk teks — bacaan paling wajar dari doc yang hanya
menyebut satu "accent (gold)" — seluruh angka koin, rating, dan harga di
aplikasi ini gagal AA sekaligus.

**3. Mockup-nya sendiri gagal AA di dua tempat**, dan itu diperbaiki:

| Peran | Mockup | Kontras | Dipakai |
|---|---|---|---|
| Teks metadata — penulis, caption, label section | `#8a827a` | 3,38:1 | `#6f6862` (4,90:1) |
| Label `BERSPONSOR` | `#b8b0a8` | 2,3:1 | tinta metadata yang sama |

Preseden identik sudah ada di berkas yang sama: `--nv-muted` dulu dinaikkan dari
`#928582` ke `#6f6462` atas alasan yang persis sama (PRD 01 §9.2 rec #8).
`#c4bcb2` tetap apa adanya sebagai `--nv-disabled` — WCAG 1.4.3 memang
mengecualikan kontrol nonaktif.

### Yang **tidak** dikerjakan, dan kenapa

- **Tidak ada satu pun perubahan visual.** Diminta "buat folder baru berisi
  salinan" lebih dulu; redesign-nya dipecah jadi R1–R7 supaya bisa diverifikasi
  per tahap seperti fase-fase sebelumnya.
- **`novelova/` tidak disentuh** — tetap rose-gold, tetap 543 test. Entri
  Langkah 40 di `novelova/CHANGELOG.md` masih belum di-commit di repo itu, dan
  saya biarkan apa adanya.
- **PRD tidak disunting.** Bawaan Langkah 24 berlaku lagi; §1.19 (FR-READ-09)
  tetap satu-satunya PRD yang pernah direvisi.
- **Belum ada paket font baru.** `@fontsource/lora` +
  `@fontsource-variable/plus-jakarta-sans` menggantikan Cormorant Garamond +
  Manrope di R1, bukan sekarang — runtime tetap **12 paket**, tukar dua, bukan
  tambah dua.

---

## 2026-09-04 · Langkah 40 — PRD Reader direvisi: auto-unlock jadi izin per cerita

> "oke kalau gitu prd untuk chapter read/unlock tolong diadjust sesuai permintaan
> saya"

**Tidak ada kode yang berubah.** Yang disunting berkas PRD-nya — dan itu
membalik keputusan Langkah 24.

### Aturan yang dilonggarkan

Langkah 24 menetapkan: *"Berkas PRD tidak pernah disunting."* Saya mengangkatnya
di giliran sebelumnya, permintaannya ditegaskan, jadi aturannya diubah — bukan
dilanggar diam-diam.

Bunyinya sekarang: **PRD disunting hanya bila pengguna memintanya secara
eksplisit.** Bawaannya tetap sama, dan bila disunting, suntingannya wajib
membawa **catatan revisi bertanggal** yang menyebut versi lamanya. Seluruh berkas
PRD lain yang menyinggung hal yang sama diselaraskan pada giliran yang sama —
dua berkas PRD yang saling membantah lebih buruk daripada satu berkas yang usang.

### Yang disunting di `prd_05_reader.md`

**FR-READ-09 ditulis ulang** dan naik dari `P1` ke `P0`:

| Hal | Versi lama | Versi revisi |
|---|---|---|
| Bentuk | Sakelar global di Pengaturan Pembaca | Sakelar **per cerita**, di dalam gerbang |
| Default | Nonaktif | **Tercentang** di bab berbayar pertama |
| Gerbang | Jalur utama, muncul tiap bab | Bab berbayar **pertama tiap cerita** |
| Penyimpanan | `localStorage` | **Server** — ia memberi wewenang memotong koin |
| Saldo kurang | Lembar dengan isi koin + iklan | Ditambah **voucher** |

Enam tempat lain di berkas yang sama ikut diselaraskan: alur §2, tabel indeks FR,
panel Pengaturan Pembaca (tiga kontrol → dua), aturan reset antar bab, lembar
saldo kurang beserta kriteria terimanya, dan tabel state persisten.

FR-READ-09 juga sekarang memuat **alternatif yang ditolak** — menghapus gerbang
sepenuhnya — beserta alasannya: gerbang satu-satunya tempat bundle, paket tamat,
dan iklan gratis pernah terlihat, dan sepuluh bab satuan 25% lebih mahal
daripada bundle.

### `prd_00_overview.md` ikut diselaraskan

Tiga tempat menyebut `autoUnlock` di sana: daftar lapisan unlock, pengaturan
reader default, dan tabel kunci `localStorage`. Ketiganya diperbarui, dan yang
kedua diberi catatan kenapa izinnya pindah ke server.

Tidak ada lagi `autoUnlock` tersisa di seluruh folder PRD.

### Yang berubah di dokumen lain

- `architecture.md` **§1.19** — judulnya kini berbunyi "**PRD direvisi**, bukan
  ditimpa", dan tabelnya membandingkan FR-READ-09 lama dengan revisinya. Bagian
  itu tetap ada karena ia memuat alasan dan alternatif yang tidak seluruhnya
  masuk ke PRD.
- `CLAUDE.md` §5 — aturan penyuntingan PRD ditulis ulang; baris tabel
  kanvas-vs-PRD kini menyebut tidak ada lagi selisih.
- `todo.md` **Fase 5b** tidak berubah: sepuluh tugasnya tetap belum dikerjakan.

### Verifikasi

Perubahan dokumen saja. `npm run check` bersih · **543 test unit** · **58 e2e** ·
`npm run build` jadi.

---

## 2026-09-04 · Langkah 39 — keputusan produk: auto-unlock jadi izin per cerita

> "oke sebelum dimulai saya mau diskusi dengan anda, pada halaman chapter read
> bukan kah di prd dituliskan chapter itu bakal otomatis unlock sendiri setiap
> scroll. Jadi misal user baca chapter 5 nah dia bakal otomatis baca terus-terusan
> dan misal ada koin dia otomatis auto unlock bukan ada opsi button unlock nya.
> Nah Nanti misal koin habis baru muncul sebuah tampilan seperti chapter unlock
> saat ini. cuman pemberitahuanya adalah topup dan opsi buka dengan voucher. Ini
> Diskuis"
>
> "ini mending update prd. dibanding lansung implementasi"

**Tidak ada kode yang berubah.** Diskusi ini menghasilkan satu keputusan produk,
dan keputusannya dicatat — bukan dikerjakan.

### Yang ternyata benar dan yang ternyata beda

FR-READ-09 memang menggambarkan mekanismenya persis seperti yang ditanyakan:
`IntersectionObserver` ambang 0,35, bab terbuka tanpa interaksi, selalu harga
satuan. Itu sudah jalan di kode sejak Fase 5.

Bedanya satu: PRD menjadikannya **sakelar global yang default mati** di
Pengaturan Pembaca. Jadi hampir tidak ada pembaca yang menemukannya, dan tiap bab
berbayar tetap memutus alur baca. Usulan untuk membuatnya perilaku bawaan karena
itu bukan pembacaan PRD melainkan **perubahan produk**, sekelas §1.6 dan §1.8.

### Tiga hal yang nyaris ikut hilang

Usulan awalnya menghapus gerbang sepenuhnya. Yang saya angkat: gerbang adalah
satu-satunya tempat **bundel 10 bab (12.000)**, **paket tamat**, dan **iklan
berkuota** pernah terlihat. Auto-unlock memakai harga satuan 1.500, jadi
menghapusnya membuat pembaca sepuluh bab membayar 15.000 — **25% lebih mahal**,
justru sebagai akibat alur yang dipermulus. Dan pembaca tanpa koin kehilangan
satu-satunya jalan gratisnya.

Ditambah satu hal yang menyentuh aturan kita sendiri: auto-unlock yang menyala
sejak awal memotong koin tanpa ketukan. Menggulir cepat melewati lima bab =
7.500 koin, tanpa pembaca pernah menyetujui satu pun pembelian.

### Yang diputuskan

**Setuju sekali per cerita, lalu mulus.** Gerbang tetap muncul di bab berbayar
**pertama tiap cerita** dengan empat pilihan lengkap, plus sakelar "Buka otomatis
untuk cerita ini" yang tercentang default. Bab berikutnya di cerita itu terbuka
sendiri. Saat koin habis: **isi koin · voucher · tonton iklan**.

Friksinya dibayar sekali, dan dibayar tepat saat pilihan hemat paling berguna.

### Kenapa PRD-nya tidak disunting

Permintaannya berbunyi "update prd". Aturan yang ditetapkan di Langkah 24 dan
dikonfirmasi ulang di Langkah 29 berbunyi: **berkas PRD tidak pernah disunting**;
ia tetap catatan jujur tentang apa yang semula diminta, dan setiap penimpaan
dicatat di `architecture.md` §1.x. Saya membacanya sebagai "dokumentasikan dulu,
jangan langsung ngoding" — dan mengerjakannya lewat jalur itu, sambil menawarkan
untuk benar-benar menyunting PRD bila memang itu yang dimaksud.

### Yang berubah di dokumen

- `architecture.md` **§1.19** — keputusannya beserta alasan menolak dua alternatif
- `CLAUDE.md` §5 — baris baru di tabel kanvas-vs-PRD dan indeks §1.x, keduanya
  ditandai **belum diimplementasikan**
- `todo.md` **Fase 5b** — sepuluh tugas `[PRODUK]`, mengikuti preseden Fase 3b

### Verifikasi

Perubahan dokumen saja. `npm run check` bersih · **543 test unit** · **58 e2e** ·
`npm run build` jadi.

---

## 2026-09-04 · Langkah 38 — Fase 10 selesai: laporan, blokir & integrasi

> "oke lanjutkan lagi semua todo di fase 10. dan pastikan saat tampilan mobile.
> semua flow sama dan tidak ada bug dengan tampilan dekstop."

Sebelas tugas, **nol sisa**. Satu tugas Fase 8 yang menunggu fase ini juga ikut
ditutup.

### Melapor bukan membungkam

Konten yang dilaporkan **tetap tampil sampai melewati ambang**. Menyembunyikan
sejak laporan pertama menjadikan tombol laporkan senjata: satu orang bisa
membungkam siapa pun tanpa satu pun manusia melihat kontennya. Begitu ambangnya
tercapai (tiga laporan), kontennya disembunyikan **sambil menunggu tinjauan,
bukan dihapus** — barisnya tetap ada dengan isinya diganti keterangan.

Melaporkan dua kali ditolak dengan menyebut laporan pertama sudah masuk, bukan
diterima diam-diam. Dan pelapor **tidak pernah dapat kabar hasilnya**: kabar
hasil akan berubah jadi kanal balas dendam antar pengguna. Konfirmasinya
menyatakan itu terang-terangan, supaya tidak ada yang menunggu balasan yang
memang tidak ada.

### Memblokir bukan menghapus

Blokir menyembunyikan komentar dan ulasan **dari tampilan pemblokir saja** —
`listComments` dan `listReviews` menyaringnya per pembaca. Barisnya tetap utuh di
basis data, orang lain tetap melihatnya, dan membuka blokir mengembalikannya
seketika. Ada testnya untuk ketiga bagian itu.

Laporan mengalir ke **antrean tinjauan Fase 8f** — sumbernya sudah disiapkan
sejak §1.11 dan baru sekarang terisi, dan hanya untuk cerita atau komentar di bab
milik penulis itu.

### Cacat yang ditemukan e2e #5

Rantai `baca bab → rating → ulasan → misi selesai` gagal di langkah kedua dengan
*"Baca dulu minimal satu bab"* — padahal babnya baru saja dibuka.

Sebabnya: `useReadingProgress` hanya mengirim **setelah ada gulir**. Bab pendek
yang muat satu layar tidak pernah meninggalkan jejak, jadi pembacanya ditolak
dengan alasan yang terdengar salah. Ini bukan masalah test — ini syarat
tersembunyi yang tidak pernah dinyatakan di mana pun.

`getChapter` kini menulis baris progres saat bab **dibuka**, dan hanya bila belum
ada. Menimpa baris yang sudah ada dengan nol akan membuang posisi baca yang
sebenarnya — jauh lebih mahal daripada masalah yang sedang diperbaiki.

### Tiga angka yang akhirnya punya sumber

**Progres misi ulasan** diturunkan dari tanggal ulasan hari ini, bukan angka
tersimpan. Misi yang menyimpan progresnya sendiri akan tetap 100% keesokan
harinya, dan batas "satu kali per hari" jadi tidak berarti. Testnya menggeser
tanggal ulasan ke kemarin dan memastikan misinya kembali nol tanpa ada yang
menulis ulang.

**Feed aktivitas** diturunkan dari ulasan, bukan tabel event: entri "Menulis
ulasan 5 bintang" adalah tampilan lain dari ulasan yang sama, dan tabel event
akan basi begitu ulasannya disunting atau dihapus.

**Sentimen komentar** — sisa Fase 8 yang menunggu fase ini — kini diturunkan dari
bintang ulasan cerita itu: empat ke atas positif, tiga netral, dua ke bawah
negatif. Bukan analisis nada, dan `ponytail:`-nya menyebut batas itu; tetapi
sinyalnya nyata dan dipilih pembacanya sendiri. Tanpa ulasan sama sekali,
ketiganya nol — bukan angka karangan yang terlihat meyakinkan.

### Visibilitas: dua hal yang mudah dikira satu

Sakelar "Ulasan dan reaksi" yang mati menyembunyikan ulasan dari **profil publik
penulisnya**, tetapi ulasannya **tetap tampil di halaman ulasan cerita** — karena
itu konten publik ceritanya, bukan milik profilnya. `listActivity` menerima
`respectPrivacy` yang membedakan siapa yang sedang membaca.

### Dua penyesuaian test

Alasan laporan ternyata `<input type="radio">`, bukan tombol — jadi e2e memakai
`.check()`. Dan tombol "Kirim laporan" sudah `disabled` sejak awal, sehingga
memilih "Lainnya" tanpa keterangan tetap menahannya; itu justru yang diuji.

### Yang tidak dikerjakan

Tidak ada. Fase 10 nol sisa. Panel progres misi di `/dev/kitchen-sink` sengaja
ditambahkan sebagai jendela sementara: pusat hadiah baru dibangun di Fase 12, dan
tanpa itu langkah terakhir e2e #5 tidak bisa diperiksa sampai ujung — alasan yang
sama dengan tombol admin antrean tinjauan di Langkah 30.

### Verifikasi

`npm run check` bersih · **543 test unit** (+16) · **58 e2e** (+4) · `npm run
build` jadi. Alur laporan & blokir dan **rantai e2e #5** diuji di dua lebar
layar; lembar enam alasan mudah melebihi tinggi 390px, jadi tombol kirimnya
benar-benar ditekan di sana.

---

## 2026-09-04 · Langkah 37 — komentar bab & penanda spoiler

> "oke lanjutkan lagi semua todo di fase 10 sebanyak 1/2 saja. dan pastikan saat
> tampilan mobile. semua flow sama dan tidak ada bug dengan tampilan dekstop."

Sisa Fase 10 tepat 21 tugas, jadi separuhnya lagi ≈ 10. Saya ambil blok yang
berdiri utuh: **seluruh komentar bab beserta penanda spoiler**. Laporan, blokir,
integrasi misi hadiah, dan e2e #5 jadi potongan terakhir.

### Kedalaman utas ditegakkan server, bukan layar

FR-SOCIAL-05 melarang utas bercabang dalam — alasannya layar 390px, di mana tiap
tingkat indentasi memakan lebar yang tidak ada.

Aturannya dijaga **dua lapis**. `CommentSchema` membungkus `CommentBaseSchema`
sehingga `replies` tidak bisa punya `replies` — skemanya sengaja tidak rekursif,
dan itu sudah begitu sejak Fase 2. Yang baru: `postComment` **menaikkan
`parentId` ke induk teratas**. Membalas sebuah balasan mendarat di utas yang
sama, bukan ditolak, dan layar tidak perlu tahu aturannya sama sekali.

Menaruhnya di layar akan bekerja sampai layar kedua lupa — dan hasilnya pohon
dalam yang komponennya tidak bisa merender.

### Bab terkunci menolak membaca, bukan hanya menulis

Komentar bab penuh berisi isi babnya. Membuka utasnya untuk yang belum membeli
sama dengan membocorkan cerita lewat pintu samping, jadi `listComments` dan
`postComment` memakai penjaga yang sama.

Halamannya menampilkan satu sisipan beserta jalan keluarnya — bukan daftar kosong
yang terlihat seperti "belum ada komentar". Kolom tulisnya tidak dirender sama
sekali, bukan sekadar dimatikan.

### Bug yang membuat semua bab terbaca terkunci

Penjaga itu awalnya mencari kepemilikan dengan menebak bentuk id primernya —
`own-${userId}-${chapterId}`. Baris seed ternyata bernama `own1`, `own2`.
Hasilnya setiap bab terbaca sebagai terkunci, dan sembilan test gagal sekaligus
dengan pesan yang tidak menyebut sebabnya sama sekali.

Diperbaiki dengan memakai indeks `[userId+chapterId]` yang memang sudah ada.

### Daftar yang menyusun ulang dirinya sendiri

Dua komentar yang dibuat dalam milidetik yang sama punya `createdAt` identik.
Tanpa pemecah seri, urutannya berubah antar pembacaan — dan daftar yang
menyusun ulang dirinya sendiri terlihat seperti komentar yang hilang.

`id` sekarang jadi pemecahnya. Ia tidak mencerminkan urutan pembuatan saat
stempelnya bertabrakan, tetapi **deterministik**, dan itu yang menentukan apakah
daftar terasa stabil. Testnya membedakan stempel waktu secara eksplisit alih-alih
bersandar pada resolusi jam mesin.

### Spoiler: komponennya sudah ada sejak Fase 1

`SpoilerVeil` sudah menyimpan `aria-hidden` selama tertutup dan menyimpan
state-nya per instance, jadi membuka satu tidak membuka yang lain. Yang perlu
ditambahkan hanya sakelar "Mengandung spoiler" di kolom tulis komentar — ulasan
sudah mendapatkannya di Langkah 36.

Tag `plot twist` tetap **tidak** otomatis menandai spoiler; penandaan selalu
eksplisit oleh penulisnya (FR-SOCIAL-06).

### Dua test yang saya perbaiki cara mengujinya

**"Saring ada teksnya"** semula membandingkan jumlah sebelum dan sesudah. Berapa
banyak rating tanpa teks yang tersisa bergantung pada berkas test lain yang
berbagi basis data, jadi ia lulus sendirian dan gagal di suite penuh. Sekarang ia
menguji **aturannya**: setiap yang tampil punya teks.

**Komentar spoiler dan komentar yang ditinjau** semula saya sisipkan sendiri,
padahal seed sudah punya keduanya — hasilnya "found multiple elements". Sekarang
memakai yang dari seed.

### Yang tidak dikerjakan, dan kenapa

- **Laporkan & blokir** (FR-SOCIAL-07) dan **integrasi misi hadiah + feed
  profil** (FR-SOCIAL-08) — potongan terakhir. `report` adalah satu-satunya
  handler seam sosial yang belum ada.
- **E2E #5** (baca → rating → ulasan → misi selesai) menunggu integrasi misi
  hadiah.
- Baris reaksi di reader **sudah** menautkan ke halaman komentar beserta jumlah
  komentarnya sejak Fase 5; kini tautannya menuju halaman sungguhan.

### Verifikasi

`npm run check` bersih · **527 test unit** (+19) · **54 e2e** (+3) · `npm run
build` jadi. Alur komentar diuji di **dua lebar layar** — utas dengan balasan
menjorok adalah bentuk yang paling mudah pecah di 390px — dan halaman komentar
masuk sapuan HP yang kini menjaga **22 halaman** tidak menggeser badan halaman ke
samping.

---

## 2026-09-04 · Langkah 36 — separuh Fase 10: rating & ulasan

> "oke lanjutkan lagi semua todo di fase 10 sebanyak 1/2 saja. dan pastikan saat
> tampilan mobile. semua flow sama dan tidak ada bug dengan tampilan dekstop."

Fase 10 punya 42 tugas, jadi separuhnya 21. Saya ambil blok yang berdiri utuh:
**seluruh rating & ulasan**, dari produksi sampai halaman konsumsinya, plus tiga
test handler yang memang menguji blok itu. Komentar bab, spoiler, laporan,
blokir, dan integrasi misi hadiah disisakan.

### Angka yang dibaca enam tempat tapi tidak bisa ditulis siapa pun

prd_12 membuka dengan itu: rating dikonsumsi di kartu cerita, statbar, detail,
pencarian, analitik, dan misi hadiah — dan tidak diproduksi di satu tempat pun.
Tiga tautan menggantung menuju fitur yang sama, ditambah satu misi hadiah yang
mustahil diselesaikan.

Sekarang jalurnya ada, dan `story.stats.rating` **benar-benar bergerak** setiap
kali ada yang menilai.

### Dua hal, bukan satu baris dengan teks kosong

Rating dan ulasan disimpan di tabel terpisah. Memberi bintang tanpa menulis apa
pun sah (FR-SOCIAL-01), dan menghapus ulasan tidak menghapus ratingnya
(FR-SOCIAL-02). Satu tabel dengan kolom teks opsional akan membuat kedua
penghapusan itu jadi operasi yang sama.

Arahnya sengaja **tidak simetris**:

| Aksi | Ratingnya | Ulasannya |
|---|---|---|
| Hapus ulasan | tetap | hilang |
| Hapus rating | hilang | **ikut hilang** |

Alasannya satu kalimat di PRD: ulasan wajib disertai rating. Ulasan tanpa bintang
tidak sah, jadi ia tidak boleh tertinggal saat bintangnya dicabut. Ada testnya
untuk kedua arah.

### Sebaran yang tidak ikut menyusut saat disaring

Grafik 5★…1★ dihitung dari **seluruh rating**, bukan dari ulasan yang lolos
saringan. Kalau ia ikut menyusut saat pembaca memilih "hanya 5★", ia berhenti
menggambarkan ceritanya dan berubah jadi gambar tentang saringannya sendiri.
Testnya membandingkan `breakdown` sebelum dan sesudah menyaring — keduanya harus
identik.

Ulasan sendiri juga tidak pernah ikut tersaring; ia naik ke `myReview` dan duduk
di atas. Penulisnya harus selalu bisa menemukan miliknya untuk disunting,
termasuk saat sedang menyaring bintang lain.

### Penolakan yang berupa ajakan

Menilai menuntut sudah membaca minimal satu bab. Dibaca dari progres baca, bukan
dari kepemilikan bab: membeli tanpa membuka bukan membaca, dan bab gratis tidak
pernah menghasilkan baris kepemilikan sama sekali.

Penolakannya berbunyi *"Baca dulu minimal satu bab sebelum menilai cerita ini."*
dengan tautan ke ceritanya — bukan tombol yang mati diam-diam. Testnya bahkan
memastikan kalimatnya tidak mengandung kata "error" atau "gagal".

### Tempat modulnya, dan kenapa bukan `features/social/`

Saya sempat menaruhnya di `features/social/`, lalu sadar detail cerita perlu
memakai lembar ratingnya — dan `features/*` tidak boleh mengimpor `features/*`
lain (aturan struktur #2). Rating dan ulasan memang milik cerita; rutenya pun
`/cerita/:id/ulasan`. Seluruh modul pindah ke `features/story/`.

### Tiga hal kecil yang ketahuan dari test

**`db.reactions` tidak punya indeks tunggal `userId`.** Indeksnya
`[userId+targetType+targetId]`, jadi `where('userId')` melempar `DataError` yang
pesannya tidak menyebut kolomnya sama sekali. Diganti `toArray()` + filter.

**Bintang masukan adalah `<input type="radio">` yang `sr-only`.** Playwright
menolak mengkliknya karena tidak terlihat — dan itu benar: pengguna sungguhan
menekan **labelnya**, bukan inputnya. E2E-nya menyesuaikan, bukan memaksa dengan
`force: true`.

**"Ulasanmu" dipakai dua arti.** Judul section di halaman ulasan dan label
textarea di lembar. Pembaca layar menyebut dua hal berbeda dengan nama sama, dan
e2e menabrak keduanya sekaligus. Labelnya jadi "Tulis ulasanmu".

### Yang tidak dikerjakan, dan kenapa

- **Komentar bab** (FR-SOCIAL-05), **spoiler pada komentar** (FR-SOCIAL-06),
  **laporan & blokir** (FR-SOCIAL-07), dan **integrasi misi hadiah + feed
  profil** (FR-SOCIAL-08) — separuh kedua, di luar potongan ini.
- **`listComments` dan `report`** karena itu belum diimplementasikan; keduanya
  ikut potongan berikutnya bersama layarnya. Empat dari enam handler yang
  diminta sudah ada.
- **E2E #5** (baca → rating → ulasan → misi selesai) menunggu integrasi misi
  hadiah; separuh rantainya sudah dijaga `tests/e2e/ulasan-dua-lebar.spec.ts`.

Spoiler pada **ulasan** ikut sekarang karena kontraknya sudah punya `spoiler` dan
`SpoilerVeil` sudah berdiri sejak Fase 1 — membiarkan ulasan spoiler telanjang di
halaman yang baru dibuat akan jadi cacat, bukan pekerjaan yang ditunda.

### Verifikasi

`npm run check` bersih · **508 test unit** (+26) · **51 e2e** (+3) · `npm run
build` jadi. Alur beri rating & tulis ulasan diuji di **dua lebar layar**, dan
`/cerita/s1/ulasan` masuk sapuan HP yang kini menjaga **21 halaman** tidak
menggeser badan halaman ke samping.

---

## 2026-09-04 · Langkah 35 — dua sisa Fase 9: jawaban & koreksi nomor fase

> "di fase 9 ada 2 step yang terlewat. kenapa tidak dikerjakan?"

Keduanya memang sengaja tidak dikerjakan, dan alasannya masih berlaku. Tetapi
saat memeriksa ulang, saya menemukan **nomor fase yang saya sebut salah** di
delapan tempat.

### Dua item itu, dan buktinya

| Item | Bagian yang **sudah** | Bagian yang tertahan |
|---|---|---|
| Tiga pintu masuk (FR-EARN-10) | Metrik Coins dan tautan "Penghasilan & Pencairan" di `/karya` — keduanya kini menuju halaman sungguhan | Menu "Penghasilan penulis" di `/profil` |
| Payout identity (FR-EARN-10) | Tombol kembali analitik → `/karya`, lewat `fallback` rutenya | Tautan Payout identity di `/profil/ubah` |

Yang menahan keduanya sama: **halaman profil belum ada.** `routes/index.tsx`
mendaftarkan `/profil` dan `/profil/ubah` tanpa `element`, dan
`src/features/profile/` masih berisi tiga berkas `.gitkeep` — tidak ada satu pun
layar untuk menaruh menunya.

### Nomor fasenya salah

Saya menulis **Fase 12** di `todo.md`, `CLAUDE.md`, dan tiga entri changelog.
Yang benar **Fase 13** — Fase 12 adalah Pusat Hadiah & Voucher. Sesi berikutnya
akan mencari halaman profil di fase yang salah dan tidak menemukan apa pun.
Kedelapan rujukan sudah dikoreksi.

Catatan yang lebih tua justru sudah benar (`todo.md:578` menyebut "pusat hadiah
(Fase 12) dan profil (Fase 13)"); kesalahannya baru muncul di Langkah 32.

### Yang juga terlihat saat memeriksa

Fase 13 punya itemnya sendiri yang **menutupi hal yang sama**:

> Pintasan dompet menampilkan saldo + tautan Pusat Hadiah & **Penghasilan
> Penulis** · `P1` — FR-PROF-03

Jadi tautan itu akan dibangun di sana bersama halamannya, bukan ditambal ke
penampung. Catatan `↳` di `todo.md` sudah menyebut tumpang tindih ini supaya
tidak dikerjakan dua kali.

### Kenapa tidak dimajukan saja

Membangun halaman profil sekarang berarti mengerjakan Fase 13 di luar
permintaan, dan halaman profil penampung yang "hidup" hanya demi satu baris menu
akan ditulis ulang begitu fasenya tiba — sekaligus membuat orang mengira profil
sudah jadi. Kalau memang diinginkan lebih awal, itu keputusan cakupan yang perlu
diminta, bukan diputuskan sendiri.

### Verifikasi

Perubahan dokumen saja; tidak ada kode yang berubah. `npm run check` bersih ·
**482 test unit** · **48 e2e** · `npm run build` jadi.

---

## 2026-09-04 · Langkah 34 — Fase 9 selesai: alur pengajuan pencairan · **M4**

> "oke lanjutkan lagi semua todo di fase 9 semua task yang tersisa. dan pastikan
> saat tampilan mobile. semua flow sama dan tidak ada bug dengan tampilan
> dekstop."

Sepuluh tugas, seluruh sisa Fase 9 kecuali dua yang menunggu Fase 12. **M4
tercapai**: sisi penulis lengkap dari mendaftar sampai mencairkan uangnya.

### Tiga cacat PRD 08 §7 yang satu keluarga

Batas minimum hanya kalimat keterangan (#2), jumlah tidak dibatasi saldo (#3),
dan pengajuan Rp 0 pun diterima. Prototipe menerima apa pun lalu membiarkan
penulis menunggu penolakan yang sudah pasti.

Tangga lima tingkat FR-EARN-11 sekarang menegakkannya — dan menegakkannya **dua
kali**, dari satu berkas:

- **Layar** memakainya untuk mematikan tombol pengajuan *sebelum* ditekan, dan
  menampilkan satu pesan: kesalahan pertama saja.
- **Server** memakainya di `requestWithdrawal` untuk menolak, karena layar bisa
  dilewati.

`src/lib/payout.ts` jadi satu-satunya tempat aturannya ditulis. Dua salinan
berarti kalimat penolakan yang berbeda antara layar dan server, dan penulis akan
mengira ada dua aturan berbeda.

### Urutan tangganya bukan selera

Jumlah diperiksa lebih dulu (tingkat 1–3), syarat akun terakhir (4–5). Alasannya
sederhana: memperbaiki syarat akun menuntut pergi ke layar lain, dan tidak sopan
menyuruh penulis ke sana kalau jumlahnya toh belum valid. Ada testnya — mengisi
Rp 1.000 dengan 2FA mati tetap dilaporkan sebagai tingkat 2, bukan 5.

### Dua penjepitan yang sengaja dipisah

**Bersih dijepit minimum nol.** Rp 3.000 dikurangi biaya admin Rp 5.000 tidak
boleh tampil sebagai −Rp 2.000: angka merah di ringkasan pencairan terbaca
seperti utang.

Tetapi jumlah itu sendiri **tidak** ditolak di situ. Penolakannya datang dari
tangga, dengan kalimatnya sendiri. Dua tanggung jawab, dua tempat.

### Masukan yang menerima format apa pun

`1.000.000`, `1 000 000`, dan `Rp 1.000.000` terbaca sama — seluruh non-digit
dibuang. Huruf bernilai nol, bukan `NaN`: angka yang bocor sebagai `NaN` akan
menjalar ke seluruh ringkasan biaya. Kolomnya `type="text"` dengan
`inputMode="numeric"`, karena `type="number"` menolak titik mentah-mentah.

### Rekening tidak pernah dikirim penuh

`getPayoutAccount` mengirim `**** 4481` — bentuk tersamarnya dibuat server. Yang
tidak pernah meninggalkan server tidak bisa bocor dari klien. Metode itu sekalian
membawa `payoutVerified` dan `twoFactor`, karena keduanya tingkat 4 dan 5 tangga
validasi dan layar perlu tahu untuk mematikan tombolnya lebih dulu.

### Tombol uang di dok bawah, ditekan sungguhan

Layar ini punya dok bawah yang selalu terlihat — persis bentuk yang pernah
dilaporkan pengguna sebagai cacat pada layar bayar: tombolnya tertutup bilah
navigasi dan hanya di HP. Karena itu e2e-nya **menekan** tombolnya di 412px,
bukan sekadar memastikannya terlihat. Assertion "terlihat" tidak pernah
membuktikan sebuah tombol bisa ditekan.

### Non-breaking space, dua harness, dua aturan

Test halaman gagal mencari `'Rp\u00a01.000.000'` padahal teksnya ada. Testing
Library menormalkan whitespace pada teks **DOM** tetapi tidak pada string
pencariannya — jadi NBSP di query justru yang membuatnya tidak pernah cocok.
Kebalikan dari jebakan `Intl` yang sudah tercatat, dan sekarang keduanya ada di
§8.

Sekalian: pesan penolakan di `lib/payout.ts` memakai `Rp 100.000` dengan spasi
biasa, bukan `formatRupiah`. Pesan itu dibandingkan sebagai string di test dan
digabung ke kalimat server; spasi yang terlihat sama tetapi berbeda kode adalah
kegagalan yang mustahil dibaca.

### Yang tidak dikerjakan, dan kenapa

- **Menu "Penghasilan penulis" di `/profil`** dan **tautan Payout identity di
  ubah-profil** · `P0` — menunggu **Fase 13**. Halaman profil dan ubah-profil
  belum ada, jadi tidak ada tempat untuk menaruhnya. Dua pintu masuk lain sudah
  hidup dari `/karya`, dan tangga validasi sudah menautkan ke `/profil/ubah`
  serta `/pengaturan/keamanan` begitu keduanya berdiri.
- **Pengelolaan banyak rekening** (PRD 08 §7 #6) — di luar rencana Fase 9;
  ditandai `ponytail:` di handlernya beserta jalur peningkatannya.

### Verifikasi

`npm run check` bersih · **482 test unit** (+26) · **48 e2e** (+3) · `npm run
build` jadi. Alur pengajuan diuji di **dua lebar layar** dengan tombol dok bawah
yang benar-benar ditekan, dan `/penulis/penarikan` masuk sapuan HP yang kini
menjaga **20 halaman** tidak menggeser badan halaman ke samping.

---

## 2026-09-04 · Langkah 33 — seperempat kedua Fase 9: corong, heatmap & riwayat pencairan

> "oke lanjutkan lagi semua todo di fase 9 sebanyak 1/4 saja. dan pastikan saat
> tampilan mobile. semua flow sama dan tidak ada bug dengan tampilan dekstop."

Tujuh tugas. Dua menutup layar analitik penulis — corong pembaca dan heatmap
rilis — dan lima menutup FR-EARN-12 seutuhnya: riwayat pencairan beserta rantai
koin → rupiah. Alur **pengajuan** pencairan tetap disisakan utuh untuk potongan
terakhir.

### PRD menuntut konsistensi tiga kali

Ketiganya mudah dilanggar tanpa ada yang menyadarinya sampai penulis
membandingkan dua layar sendiri.

**Tahap "Bayar" harus sama dengan "Tingkat buka"** (FR-EARN-04). Tapi corong
dihitung untuk *satu cerita*, sedangkan KPI di kepala halaman agregat seluruh
karya. Di Langkah 32 saya menghitung tingkat buka agregat juga — dan itu membuat
kedua angka mustahil cocok. Bacaan yang menepati keduanya cuma satu: tingkat buka
milik cerita yang sama dengan corong, sementara KPI tetap agregat, karena
keduanya memang menjawab pertanyaan berbeda.

Cara menepatinya yang tidak bisa lapuk bukan menghitung dua kali lalu
membandingkan di test. `funnelOf()` mengembalikan `payPct`, dan itu **dipakai
langsung** sebagai `openRatePct`. Satu angka, dua tempat.

**Sel terpanas heatmap harus sama dengan jam paling ramai** yang ditulis
halamannya sendiri. Heatmap yang menunjuk satu jam sementara kalimat di bawahnya
menyebut jam lain membuat keduanya berhenti bisa dipercaya.

**"Hari terbaik" sekarang punya satu sumber.** `weekdayWeights()` dibaca empat
tempat: rekomendasi analitik cerita, catatan celah jadwal terpadu, kurva
pendapatan penulis, dan heatmap rilis. Sebelumnya bobot kurva adalah array tetap,
jadi penulis bisa membaca "Sabtu 20.00" di satu layar dan hari lain di layar
berikutnya.

### Corong yang naik

Test pertama gagal dengan `Premium: expected 100 to be less than or equal to 0`.
Bukan test yang salah: cerita fokus punya dua bab terbit, jadi tahap "Bab 3"
jatuh ke nol, lalu tahap Premium — yang kebetulan bab pertama — melompat kembali
ke 100.

Dua perbaikan. Corong **dijepit monoton**, karena tiap tahap memang bagian dari
tahap sebelumnya. Dan tahap tengah menyebut **bab yang benar-benar dipakai**:
pada cerita dengan dua bab, label "Bab 3" adalah kebohongan kecil yang tidak
perlu.

### Rekomendasi yang benar-benar bisa dijalankan

FR-EARN-05 menuntut catatan aksi berupa rekomendasi, bukan pengamatan. Karena itu
ia membawa tautannya: `?jadwalkan=terbaik` membuka penjadwal bab dengan tanggal
dan jam **sudah terisi**. Rekomendasi yang masih menuntut penulis mencari sendiri
babnya lalu mengetik tanggalnya bukan rekomendasi yang bisa dijalankan.

Keadaannya diturunkan dari URL, bukan disalin ke `useState` lewat efek — Biome
yang menunjukkannya, dengan memperingatkan dependensi yang hilang. Efek penyalin
itu akan berjalan lagi setiap kali daftar bab diambil ulang.

### Heatmap sebagai tabel

Empat slot × tujuh hari. Ditulis sebagai `<table>` dengan `<th scope>`, bukan
grid `<div>`: tiap sel punya hari, slot, dan intensitasnya, dan hanya tabel yang
membuat ketiganya terbaca pembaca layar tanpa menulis ulang labelnya di 28 sel.

### Jebakan sendiri yang menggigit lima hari kemudian

`npm test` gagal di test yang sama sekali tidak saya sentuh:

```
Expected: max="2026-09-03"
Received: max="2026-09-04"
```

Test analitik cerita dari Langkah 31 memakai `toISOString().slice(0,10)` — persis
jebakan yang sudah tercatat di `CLAUDE.md` §8. Halamannya benar (ia memakai
`todayLocalISO()`); testnya yang salah, dan ia lulus lima hari sebelum tanggalnya
berganti.

Saya sapu sisanya: dua test penjadwal yang memakai "besok menurut UTC" — di WIB
pagi itu masih hari ini, dan penjadwal menolaknya sebagai waktu yang lewat — dan
nama berkas ekspor CSV dompet, yang akan bertanggal kemarin setiap pagi.

### Yang tidak dikerjakan, dan kenapa

- **Seluruh alur pengajuan pencairan** (FR-EARN-06..09, FR-EARN-11) — di luar
  seperempat ini, dan sengaja disisakan utuh. Handler beserta validasi minimum
  dan plafon saldo sudah ada dan teruji sejak Langkah 32.
- **Menu profil & tautan Payout identity** · `P0` — masih menunggu **Fase 13**.

### Verifikasi

`npm run check` bersih · **456 test unit** (+17) · **45 e2e** (+1) · `npm run
build` jadi. Alur penghasilan diuji di **dua lebar layar** sampai riwayat
pencairan, dan `/penulis/penarikan/riwayat` masuk sapuan HP yang kini menjaga
**19 halaman** tidak menggeser badan halaman ke samping.

---

## 2026-09-03 · Langkah 32 — seperempat Fase 9: lapisan data & analitik penulis

> "oke lanjutkan lagi semua todo di fase 9 sebanyak 1/4 saja. dan pastikan saat
> tampilan mobile. semua flow sama dan tidak ada bug dengan tampilan dekstop."

Fase 9 punya 23 tugas, jadi seperempatnya **6**. Saya ambil enam yang berdiri
sendiri: seluruh lapisan data penghasilan, dua dari tiga pintu masuk, dan layar
`/penulis/analitik`. Alur pencairan **sengaja tidak disentuh** — memotongnya di
tengah akan meninggalkan formulir uang yang setengah tervalidasi, dan itu jenis
setengah jadi yang paling mahal.

### Koin akhirnya bertemu rupiah

PRD 08 §7 #9 mencatat celah yang mudah terlewat: analitik penulis memakai
**koin**, pencairan memakai **rupiah**, dan tidak ada kurs yang terlihat di layar
mana pun. Penulis karena itu tidak pernah tahu berapa nilai karyanya sampai
uangnya masuk rekening.

`/penulis/analitik` adalah tempat keduanya bertemu, dan kursnya dinyatakan terang
di sana: *"1 koin = Rp 130 · bagi hasil penulis 80%. Keduanya dari konfigurasi
server."* Kalimat terakhirnya bukan hiasan — kedua angka itu memang datang dari
`src/api/mock/config.ts`, menutup §7 #7 dan #15 sekaligus.

### Satu konstanta yang sempat hidup sendirian

`AUTHOR_SHARE_PCT = 80` ada di `handlers/chapters.ts`, dipakai panel harga bab.
Handler penghasilan butuh angka yang sama, dan menyalinnya berarti dua tempat
yang akan berselisih diam-diam pada perubahan kebijakan berikutnya — dengan yang
salah selalu angka yang dibaca penulis. Jadi keempat angka kebijakan (bagi hasil,
kurs, biaya admin, batas minimum) naik ke satu `SERVER_CONFIG`, dan
`handlers/chapters.ts` ikut membacanya.

`lib/coin.ts` tetap menyimpan nilai bawaan untuk perhitungan sisi pembaca. Bedanya
disengaja: yang **ditampilkan sebagai kebijakan** harus bisa berubah tanpa rilis.

### Sudut pandang yang benar-benar mengganti isi

PRD 08 §7 #4: di prototipe, ketiga tombol sudut pandang hanya membalik gaya
aktif, jadi dua dari tiga sudut pandang tidak pernah terlihat sama sekali.
Sekarang rentang **dan** sudut pandang ikut *query key*, dan server mengirim
ketiga bagiannya — Pendapatan, Retensi, Traffic — masing-masing dengan isinya
sendiri.

Rentang waktunya juga memakai **enum yang sama** dengan analitik cerita (§7 #5).
Dua halaman analitik dengan pemilih rentang berbeda memaksa penulis belajar dua
kali untuk pertanyaan yang sama, dan angkanya jadi tidak bisa dibandingkan.

### Seed yang membantah dirinya sendiri

Test pencairan pertama gagal dengan pesan yang aneh: *"melebihi saldo tersedia
Rp 0"*. Penyebabnya bukan aturannya — penarikan contoh berjumlah **Rp 7,7 juta**
padahal penulis contoh baru menghasilkan **~Rp 3,57 juta** seumur hidup (34.334
koin × Rp 130 × 80%).

Jadi saldo tersedia selalu terjepit ke nol, alur pencairan mustahil dicoba
dengan tangan, dan tidak ada satu pun test yang bisa lulus tanpa ikut berbohong.
Yang saya perbaiki angkanya, bukan aturannya: `SEED_VERSION` 11 → 12. Seed bukan
sekadar pengisi layar — begitu satu aturan menghitung sesuatu darinya, ia harus
**rekonsiliasi**.

### Saldo tersedia menahan yang sedang diproses

`getPayoutBalance` mengurangi penarikan berstatus `submitted` dan `review` dari
saldo kotor, jadi dana yang sama tidak bisa diajukan dua kali. Aturannya hidup di
**server**, bukan di layar, karena layar bisa dilewati — dan itu pula yang
membuat `requestWithdrawal` cukup memeriksa satu plafon alih-alih menghitung
ulang riwayat di setiap pemanggil.

`requestWithdrawal` idempoten sejak sekarang, seperti seluruh mutasi uang:
permintaan berulang dengan kunci yang sama mengembalikan pengajuan yang sama,
bukan membuat yang kedua. Ada testnya.

### Grafik yang bisa dibaca pembaca layar

Kurva pendapatan tujuh batang punya satu label untuk seluruh grafik — dan itu
menyembunyikan tujuh angka sekaligus. Tiap batang karena itu membawa nilainya
sendiri di `sr-only` (*"Sab: 2.140 koin"*), sementara batang visualnya
`aria-hidden`.

### Yang tidak dikerjakan, dan kenapa

- **Seluruh alur pencairan** (FR-EARN-06..09, FR-EARN-11..12) — di luar
  seperempat ini. Handler dan validasi minimum + plafon saldo **sudah** ada, jadi
  potongan berikutnya membangun layarnya di atas lapisan yang sudah teruji.
- **Corong pembaca & heatmap rilis** (FR-EARN-04, FR-EARN-05) — juga di luar
  seperempat ini.
- **Menu "Penghasilan penulis" di `/profil`** · `P0` — menunggu **Fase 13**.
  Halaman profilnya belum ada, jadi tidak ada tempat untuk menaruhnya. Dua pintu
  masuk lain sudah, dan keduanya kini menuju halaman sungguhan.
- **Tautan Payout identity di ubah-profil** · `P0` — menunggu **Fase 13** bersama
  layar ubah-profil. Separuh keduanya sudah: tombol kembali analitik pulang ke
  `/karya`.

### Verifikasi

`npm run check` bersih · **439 test unit** (+17) · **44 e2e** (+3) · `npm run
build` jadi. Alur penghasilan diuji di **dua lebar layar** — dua baris pil yang
mudah bertabrakan di 390px — dan `/penulis/analitik` masuk sapuan HP yang kini
menjaga **18 halaman** tidak menggeser badan halaman ke samping.

---

## 2026-09-03 · Langkah 31 — Fase 8g: analitik cerita & riwayat cetak

> "oke lanjutkan lagi semua todo di fase 8g. dan pastikan saat tampilan mobile.
> semua flow sama dan tidak ada bug dengan tampilan dekstop."

Enam belas tugas dicentang, satu sisa. **Fase 8 selesai seluruhnya.** Dan
empat temuan PRD 07 §7 ikut ditutup di sini — keempatnya soal kontrol yang
tampak berfungsi padahal tidak.

### Rentang waktu yang benar-benar menyaring

Godaan terbesar halaman analitik adalah menyaring di klien: ambil semuanya
sekali, potong menurut rentang di layar. Hasilnya pemilih rentang yang hanya
mengganti label di atas angka yang sama. Di sini rentang dan urutan performa bab
ikut **query key**, jadi keduanya meminta ulang datanya ke server — dan testnya
membuktikannya dengan cara yang paling lugas: views 30 hari harus lebih besar
daripada views 7 hari.

Urutan performa bab diuji **per kunci**, bukan dengan membandingkan dua urutan.
Pada cerita dengan sedikit bab, dua aturan urut yang berbeda bisa kebetulan
menghasilkan susunan yang sama — dan test seperti itu lulus tanpa membuktikan
apa pun. Saya sempat menulisnya begitu, dan ia gagal justru karena benar.

### Angkanya diturunkan; yang tidak bisa, ditandai

Views, komentar, pembelian, retensi, kalender publish, dan rekomendasi waktu
terbit semuanya dihitung ulang dari cerita, bab, dan kepemilikan — sama aturannya
dengan §1.9 dan §1.11.

Satu bagian tidak bisa: server tiruan tidak menyimpan event baca, jadi tidak ada
penghitung harian untuk dibagi menurut rentang. Deret hariannya dibangkitkan dari
`id cerita + tanggal`, stabil antar pembacaan, dan dasar hariannya berjangkar
pada `story.stats.reads` yang nyata. Ditandai `ponytail:` beserta batas atas dan
jalur peningkatannya. Menyembunyikan itu di balik angka yang tampak meyakinkan
akan jauh lebih buruk daripada menyebutnya.

### Empat kontrol rusak yang diperbaiki

| PRD 07 §7 | Di prototipe | Sekarang |
|---|---|---|
| #9 | Urutan bab tidak tersambung ke apa pun | Kelima urutan dijalankan server |
| #10 | Kedua lapisan grafik boleh mati → kotak kosong | Lapisan terakhir ditahan **beserta alasannya** |
| #11 | Ekspor & unduh hanya pesan | Berkas nyata: `window.print()`, `<canvas>` → PNG, `Blob` → invoice |
| #15 | Biaya cetak & bagi hasil di-hardcode | Angka yang ditampilkan datang dari server |

Untuk #10, yang penting bukan menolaknya — melainkan **mengatakan kenapa**. Klik
yang diabaikan diam-diam terasa seperti tombol rusak, persis masalah yang
sedang diperbaiki.

### Pembatalan cetak: tombolnya tetap ada

Sesudah tahap **Dicetak**, server menolak pembatalan dengan `PRINT-409` yang
menyebut biayanya dan menawarkan klaim lewat dukungan. Tombolnya sengaja tidak
dimatikan: tombol mati tanpa penjelasan tidak pernah mengatakan kenapa, dan
mengajari penulis bahwa aplikasinya rusak.

Aturan yang sama menutup `PRINT-402` tanpa kode tambahan. Pesanan yang biayanya
berubah masih di bawah tahap produksi, jadi **menolak biaya baru = membatalkan**,
dan pembatalan sebelum produksi memang tidak menagih apa pun. Satu aturan, bukan
dua — dan satu test lebih sedikit untuk basi.

### Dua cacat yang ditemukan testnya sendiri

**`PRINT-402` bukan layar penuh.** Test gagal karena tombol "Setujui biaya baru"
muncul dua kali untuk pesanan yang sama: sekali di sisipannya, sekali di baris
daftarnya. Sisipan tingkat "layar penuh" yang isinya masih bisa dipakai bukan
layar penuh — ia spanduk. Sekarang ia benar-benar menggantikan daftarnya, dengan
satu jalan keluar yang tidak menyetujui apa pun.

**Saringan tampilan menyembunyikan keadaan uang.** Penghentian biaya semula
dibaca dari daftar yang sedang tersaring, jadi memilih tab "PDF" membuat pesanan
hardcopy yang produksinya berhenti hilang dari layar. Sekarang ia dibaca dari
daftar tanpa saringan.

### Sisa Fase 8f yang ikut ditutup

Rekomendasi waktu terbit akhirnya punya angka nyata — hari terbaik dihitung dari
deret views cerita itu. Ia muncul di dua tempat: catatan entri **celah** pada
jadwal terpadu, dan chip pengisi di penjadwal bab yang benar-benar mengisi
tanggal dan jamnya. Rekomendasi yang masih harus diterjemahkan sendiri ke tanggal
bukan pintasan.

Sekalian: `SCHED-200` dulu dipicu sebuah tombol. Sekarang pemicunya keadaan yang
sesungguhnya — zona waktu perangkat berbeda dari zona waktu penulis saat entri
itu dijadwalkan. Tombol yang memicu pemberitahuan tentang keadaan nyata adalah
pemberitahuan yang tidak pernah muncul saat keadaan itu benar-benar terjadi.

### Yang tidak dikerjakan, dan kenapa

- **Sentimen komentar dari data nyata** · `P2` — menunggu **Fase 10**. Separuhnya
  sudah: jumlah komentarnya nyata, dibaca dari kolom bab dan diporsikan menurut
  rentang. Pecahan nadanya masih dari seed, karena sentimen menuntut reaksi
  komentar yang belum ada. Ditandai `ponytail:` supaya tidak lolos jadi angka
  yang dikira nyata.
- **Invoice masih teks polos**, bukan PDF berkop. Seluruh datanya ada di klien,
  jadi satu `Blob` cukup dan tidak menambah dependensi apa pun; invoice resmi
  datang dari server bersama backend aslinya. Ditandai `ponytail:`.

### Verifikasi

`npm run check` bersih · **422 test unit** (+34) · **41 e2e** (+4) · `npm run
build` jadi. Alur analitik dan riwayat cetak diuji di **dua lebar layar**, dan
kedua halaman barunya masuk sapuan HP yang kini menjaga **17 halaman** tidak
menggeser badan halaman ke samping.

---

## 2026-09-03 · Langkah 30 — Fase 8f: jadwal terpadu & antrean tinjauan

> "oke lanjutkan lagi semua todo di fase 8f. dan pastikan saat tampilan mobile.
> semua flow sama dan tidak ada bug dengan tampilan dekstop."

Sembilan belas tugas dicentang, dua sisa — keduanya menunggu fase lain, bukan
menunggu waktu. Dan satu tugas Fase 8d yang tertunda sejak Langkah 27 akhirnya
bisa ditutup.

### Lubang yang baru terlihat setelah antreannya dibangun

FR-STUDIO-38 menulis alur tinjauan dengan subjek **cerita**. Kalimat itu diikuti
apa adanya sampai fase ini — dan begitu antreannya berdiri, lubangnya kelihatan:
`publishChapter` menayangkan bab **seketika**. Penulis yang ceritanya sudah lolos
tinjauan bisa menerbitkan naskah apa pun sesudahnya tanpa dilihat siapa pun.

Yang dijaga PRD adalah isi yang sampai ke pembaca, bukan baris basis datanya.
Jadi `publishChapter` sekarang bercabang pada satu pertanyaan — **apakah bab ini
pernah lolos tinjauan?**

| Keadaan bab | Menekan "Terbitkan" |
|---|---|
| pernah lolos (`review === 'published'`) | langsung tayang; bab privat ikut jadi `free` |
| naskah baru, atau pernah ditolak | masuk `in_review`, kembali jadi draf, `publishAt` dikosongkan |

Bab yang sudah tayang lalu disunting **tidak** ditahan ulang. Itu batas yang
disengaja: menahan setiap perbaikan salah ketik akan membuat penulis berhenti
memperbaikinya. Aturannya di `architecture.md` §1.11.

Perubahan ini mematahkan tiga test yang lama, dan ketiganya memang menguji
perilaku yang sekarang salah. Yang diperbaiki assertion-nya, bukan aturannya.

### Antreannya diturunkan, tidak disimpan

Sama alasannya dengan tujuh status cerita di §1.9: `listReviewQueue` menghitung
barisnya dari empat sumber pada tiap pembacaan — cerita, bab, laporan pembaca
(jalurnya Fase 10), dan pesanan cetak yang menunggu konfirmasi. Tabel antrean
tersendiri akan punya dua kebenaran yang bisa berselisih, dan yang salah selalu
yang dilihat admin.

Hal yang sama berlaku untuk `kind` pada jadwal: bentrok dan celah **dihitung
ulang tiap pembacaan**, sehingga menggeser satu entri langsung memperbaiki
peringatan tetangganya tanpa ada yang perlu ingat.

### Keputusan admin sengaja bukan metode seam

Penulis tidak boleh menyetujui karyanya sendiri, jadi `resolveReviewAsAdmin`
hidup sebagai fungsi dev dan dijalankan dari `/dev/kitchen-sink`. Tanpa satu pun
cara menjalankannya, antrean tinjauan jadi layar yang **tidak pernah bisa
kosong** — dan e2e #3 tidak akan pernah bisa diuji sampai ujung.

### E2E #3 akhirnya utuh

`tests/e2e/rantai-tinjauan.spec.ts` menjalankan rantai penuh **tulis bab
dwibahasa → atur akses → kirim terbit → tinjau → tayang**, di dua lebar layar.
Sejak Langkah 27 rantai ini hanya bisa berjalan separuh; akses bab (8e) dan
antrean tinjauan (8f) menutup sisanya. Ia juga membuktikan sisi negatifnya: bab
yang masih di antrean **tidak** muncul untuk pembaca.

### Cacat lintas halaman yang ditemukan e2e-nya

E2E baru gagal dengan *strict mode violation* — dua `<h1>` bertuliskan "Jadwal
Terbit" pada satu layar. `TopBarLayout` sudah merender judul beserta tombol
kembali, dan **delapan** halaman yang dibangun sejak Fase 6 menambahkan miliknya
sendiri di atasnya. Cacat aksesibilitas berumur empat fase yang tidak pernah
terlihat justru karena kedua judulnya berbunyi sama.

Kepala halaman dicabut dari kedelapannya, menyisakan hanya yang tidak bisa
diketahui bilah atas: tautan `#bab-N` presisi di halaman akses, baris "Untuk
cerita" di editor bab, subjudul dan tombol simpan di formulir cerita.

### Yang tidak dikerjakan, dan kenapa

- **Rekomendasi waktu terbaik ("Sabtu 20.00")** · `P2` — menunggu **8g**.
  Angkanya harus datang dari analitik penulis yang sesungguhnya; chip yang
  ditulis tangan hanya menyamar jadi rekomendasi.
- **Notifikasi saat status tinjauan berubah** · `P1` — menunggu **Fase 11**.
  Keputusannya sudah tercatat lengkap beserta alasannya; yang kurang hanya kanal
  pengantarnya.

### Verifikasi

`npm run check` bersih · **388 test unit** (+22) · **37 e2e** (+6) · `npm run
build` jadi. Alur jadwal dan tinjauan diuji di **dua lebar layar**, dan kedua
halaman barunya masuk sapuan HP yang kini menjaga **15 halaman** tidak menggeser
badan halaman ke samping.

---

## 2026-09-02 · Langkah 29 — Fase 8e: akses bab

> "oke lanjutkan lagi semua todo di fase 8e. dan pastikan saat tampilan mobile.
> semua flow sama dan tidak ada bug dengan tampilan dekstop."

Tiga belas tugas, nol sisa. Layar kecil dengan aturan paling banyak: setiap
angka di sini datang dari bab yang benar-benar sedang diatur.

### Cacat prototipe yang paling telanjang

`chapter_access.html` **tidak tahu bab mana yang sedang diatur**. Tidak ada judul,
tidak ada parameter, dan isinya selalu "Berbayar, 3 koin, 412 pembeli" dari mana
pun halaman itu dibuka. Empat aturan yang tertulis di teksnya — bab pertama tidak
bisa diprivatkan, tujuh hari tidak bisa dibatalkan, jumlah pembeli, verifikasi
untuk bab berbayar — semuanya hanya kalimat.

Sekarang keempatnya **ditegakkan server**, bukan sekadar menonaktifkan tombol:

| Aturan | Yang menolaknya |
|---|---|
| Bab pertama tidak bisa diprivatkan | `CONFLICT` — ia pintu masuk cerita |
| Bab berbayar menuntut penulis terverifikasi | `FORBIDDEN` |
| Bab yang baru digratiskan ditahan 7 hari | `CONFLICT` beserta sisa harinya |
| Harga 1–50 koin | dijepit di server |

Layar tetap menonaktifkan opsinya lebih dulu — itu kesopanan — tetapi yang
menolak permintaannya adalah server, karena layar bisa dilewati dan server tidak.

Dan **setiap opsi yang ditahan menyebut alasannya**. Tombol mati tanpa penjelasan
mengajari penulis bahwa aplikasinya rusak.

### Satu detail yang mudah lolos

Stempel `accessChangedAt` hanya bergerak saat **tipenya** berubah. Mengubah harga
atau porsi pratinjau tidak boleh memperpanjang masa tahan tujuh hari — kalau ia
bergerak setiap penyimpanan, penulis yang menyesuaikan harganya tiap hari tidak
akan pernah bisa keluar dari masa itu. Ada testnya.

### Tombol simpan membandingkan, bukan mendeteksi

Mengubah tipe lalu mengembalikannya membuat tombolnya **nonaktif lagi**, karena
memang tidak ada yang berubah. Mendeteksi interaksi lebih mudah ditulis dan
salah: ia menyalakan tombol simpan untuk perubahan yang tidak ada.

### Bagi hasil datang dari server

Panel harga menampilkan estimasi 80/20. Godaannya memakai `AUTHOR_SHARE` dari
`lib/coin.ts` — dan berkas itu melarangnya dengan tegas, karena FR-EARN-12
mensyaratkan angka yang **ditampilkan** datang dari konfigurasi server yang bisa
berubah tanpa rilis. Jadi `authorSharePct` ikut di jawaban server, dan panelnya
menghitung dari situ.

### Konfirmasi hanya untuk yang benar-benar berisiko

Tiga transisi ditahan: berbayar → gratis (pembeli tidak dapat refund) · apa pun →
privat (bab hilang dari daftar) · privat → tampil lagi. **Gratis → berbayar tidak
dikonfirmasi** — ia tidak merugikan siapa pun, dan dialog yang muncul untuk hal
yang tidak berbahaya mengajari orang menekan "ya" tanpa membaca.

Tipe tujuannya ditahan di `pending` sampai disetujui, jadi membatalkan tidak
meninggalkan jejak apa pun. Ada testnya.

### Mobile

Alur akses bab dijalankan di dua lebar: buka → ubah ke gratis lewat konfirmasi →
simpan → opsi berbayar berubah jadi tertahan tujuh hari. Di layar sempit tiga
kartu tipe, panelnya, dan dialog konfirmasi menumpuk vertikal dengan tombol
simpan berakhir di dasar halaman — semuanya ditekan, bukan sekadar dilihat.
`/karya/ms1/bab/ms1-c47/akses` masuk sapuan overflow (kini 13 halaman). Tidak ada
cacat tata letak baru.

### Tentang e2e #3

Rantai *tulis bab dwibahasa → atur akses → kirim terbit → tinjau → tayang* kini
tinggal satu langkah: **"tinjau"**, yang menunggu antrean tinjauan di 8f. Tiga
langkah pertama sudah punya e2e-nya masing-masing di dua lebar layar. Itemnya
tetap tidak dicentang sampai rantainya benar-benar utuh.

### Ke mana penyimpangan dicatat — lagi

Ditanyakan pengguna sesudahnya: *"apakah todo yang sudah diupdate ini sudah anda
perbarui juga di prd nya?"* Jawabannya sama seperti di Langkah 24 — **PRD tidak
pernah disunting**, dan `git log` atas `PRD Novelova/` masih satu commit.

Tetapi pertanyaannya menemukan gap yang nyata. Sejak Langkah 26 ada **tiga**
penyimpangan dari kalimat PRD yang saya catat **hanya di `todo.md`**:

| Penyimpangan | Sekarang di |
|---|---|
| Tab bab tujuh, bukan empat — §1.9 hanya bicara status cerita | §1.9 diperluas ke tingkat bab |
| Bilah alat markdown, bukan `contenteditable` | §1.10 (a) |
| Konteks bab lewat parameter rute, bukan `?chapter_id=` | §1.10 (b) |

`todo.md` adalah **rencana kerja** — ia kehilangan relevansinya begitu semuanya
dicentang. `architecture.md` yang dibaca sesi berikutnya. Ketiganya dipindahkan
ke sana, dan `CLAUDE.md` §5 kini punya tabel indeks seluruh §1.x penimpaan plus
satu aturan alur kerja: setiap `↳` di `todo.md` yang menyangkut **aturan** —
bukan sekadar "menunggu fase lain" — harus punya pasangannya di §1.x.

**Verifikasi:** `npm run check` bersih, **366 test unit + 31 e2e lulus**
(344 → 366, 28 → 31), `npm run build` berhasil. `todo.md`: 433 → 450 tugas
dicentang.

---

## 2026-09-02 · Langkah 28 — Fase 8d: editor bab & autosave naskah

> "oke lanjutkan lagi semua todo di fase 8d. dan pastikan saat tampilan mobile.
> semua flow sama dan tidak ada bug dengan tampilan dekstop."

Dua puluh dari 21 tugas. Autosave dibangun **lebih dulu**, sebelum fitur editor
mana pun — PRD menyebut layar ini risiko kehilangan data terbesar di aplikasi,
dan setiap fitur lain di sini tidak ada artinya kalau naskahnya bisa hilang.

### Dua lapis, dan keduanya perlu

**Lokal** menulis 3 detik setelah ketikan berhenti — murah, jadi sering, dan
bertahan meski jaringan mati. **Server** menulis maksimal sekali per 30 detik dan
**sekali lagi saat halaman ditinggalkan** — mahal, jadi jarang, tetapi bertahan
meski perangkatnya hilang.

Aturan yang mengikat keduanya: **kegagalan server tidak pernah menghentikan lapis
lokal.** Justru sebaliknya — saat server bermasalah, satu-satunya salinan naskah
ada di perangkat, dan itu yang paling perlu terus diperbarui.

Kunci lokalnya **per bab** (`novelova:chapter-draft-<chapter_id>`). Satu kunci
bersama berarti membuka bab kedua menimpa draf bab pertama, dan penulis baru
menyadarinya saat mencoba memulihkan.

Debounce tiga detiknya bergantung pada dependensi efek yang linter anggap
berlebihan — dan memang berlebihan kalau dibaca sebagai "nilai yang dipakai di
dalam efek". Fungsinya bukan itu: keduanya ada supaya timer **dipasang ulang pada
tiap ketikan**. Tanpa itu, simpanan lokal terjadi tiga detik setelah ketikan
*pertama* lalu tidak pernah lagi. Ditandai dengan alasannya, bukan dimatikan
diam-diam.

### `DRAFT-409`: editornya tidak dibekukan

Muncul setelah **empat** kegagalan berturut-turut, bukan yang pertama: satu
kegagalan jaringan itu biasa, empat berarti ada yang benar-benar salah.

Dan yang paling penting — **editornya tetap hidup**. Menghalangi penulis mengetik
saat penyimpanan gagal justru memperbesar kemungkinan tulisannya hilang. Tiga
jalan keluarnya semua bekerja tanpa jaringan sama sekali: simpan sekarang · salin
seluruh naskah (Clipboard API) · unduh sebagai berkas (`Blob` `.txt`, judul bab
jadi nama berkasnya).

Sisipannya menyebut **berapa kata tersimpan lengkap di perangkat ini**. Angka itu
yang menenangkan; "gagal menyimpan" saja tidak.

### Pemulihan hanya kalau draf lokalnya benar-benar lebih baru

Kalau server sudah lebih baru, tidak ada yang ditawarkan. Menawarkan memulihkan
naskah lama adalah menawarkan penulis untuk menimpa karyanya sendiri.

### Bab baru lahir di penyimpanan pertama

`chapterId` boleh `null` di seam. Membuat baris bab saat editor dibuka berarti
daftar bab penuh bab hantu dari editor yang dibuka lalu ditinggalkan; server yang
membuatkannya saat ada yang benar-benar disimpan, lalu mengembalikan id-nya.

### Versi English: lengkap atau tidak ada

Empat aturan validasi, dan dua di antaranya saling melengkapi — judul English
tanpa isi ditolak, isi English tanpa judul juga. Separuh versi lebih buruk
daripada tidak ada versi: pembaca yang membuka tab English dan menemukan judul
tanpa naskah akan mengira babnya rusak.

Panel English mulai dari **kartu ajakan**, bukan kolom kosong, dengan dua
pilihan: mulai menulis, atau lewati. Dan `hasEnglish()` mengubah tiga hal
sekaligus — label tombol terbit, penanda pada tab, dan apakah konfirmasi
"terbitkan tanpa English?" muncul.

### Bilah alat: markdown, bukan `contenteditable`

Rencananya menyebut `contenteditable` + markdown. Yang dibangun **hanya**
markdown pada `textarea`, dan itu keputusan sadar: `execCommand` sudah usang, dan
hasilnya HTML — sementara `ChapterContent.body` menyimpan **paragraf teks**.
Markdown menjaga apa yang diketik sama dengan apa yang disimpan, dan tetap
terbaca kalau bilah alatnya tidak pernah disentuh.

### Satu test saya sendiri yang menunggu hal yang salah

Test "menyimpan ke server membuang draf lokalnya" menunggu kunci `localStorage`
menjadi `null`. Kuncinya sudah `null` sejak `beforeEach` — jadi penantiannya
selesai seketika, dan pemeriksaan berikutnya balapan dengan mutasinya. Gagal satu
kali dari empat.

Diperbaiki dengan menunggu **hasil yang sebenarnya**: isi bab di basis data.
Menaikkan timeout tidak akan menolong sama sekali di sini — yang ditunggu memang
bukan yang dimaksud.

### Mobile

Alur editor bab dwibahasa dijalankan di dua lebar: tulis Indonesia → tambah
English → terbitkan → tayang di daftar bab. Tiga hal yang paling mudah pecah di
layar sempit semuanya ditekan — bilah alat yang menempel di atas, dua lembar
bertingkat pada alur terbit, dan tombol terbit di dasar naskah. `/karya/ms1/bab/baru`
dan `/karya/ms1/bab/ms1-c51/ubah` masuk sapuan overflow. Tidak ada cacat baru.

### Yang tidak selesai, dan kenapa

**E2E #3 utuh** — *tulis bab dwibahasa → atur akses → kirim terbit → tinjau →
tayang* — belum bisa dijalankan penuh: "atur akses" adalah layar 8e dan "tinjau"
adalah antrean 8f. Bagian yang bisa dijalankan sudah ada dan lulus di dua lebar
layar; sisanya menyusul begitu kedua layar itu berdiri.

**Verifikasi:** `npm run check` bersih, **344 test unit + 28 e2e lulus**
(331 → 344, 24 → 28), `npm run build` berhasil. `todo.md`: 409 → 433 tugas
dicentang.

---

## 2026-09-02 · Langkah 27 — Fase 8c: formulir cerita

> "oke lanjutkan lagi semua todo di fase 8c. dan pastikan saat tampilan mobile.
> semua flow sama dan tidak ada bug dengan tampilan dekstop."

Dua puluh empat tugas, nol sisa. Layar terpanjang di seluruh aplikasi: lima
section, tujuh FR, dan **satu komponen untuk dua mode**.

### Satu layar, dua mode — dan hanya tiga hal yang berbeda

PRD sendiri menyebut `create_story` dan `edit_story` *"berbagi struktur, gaya,
dan sebagian besar logika"*. Jadi ia satu komponen dengan prop `mode`, bukan dua
halaman kembar yang perlahan menyimpang. Yang benar-benar berbeda cuma tiga:

1. **Peringatan monetisasi terbalik.** Mode `baru` memperingatkan saat tipenya
   **bukan** gratis — pembaca akan menemui bab terkunci. Mode `sunting`
   memperingatkan justru saat memilih **gratis**, dan akibatnya **dihitung dari
   data cerita itu**: berapa bab ikut terbuka, berapa pembeli yang tidak
   mendapat refund. Kalimat umum tidak akan menahan siapa pun; angka menahan.
2. **Zona bahaya hanya di mode sunting.** Tidak ada yang bisa diarsipkan atau
   dihapus dari cerita yang belum ada.
3. **Kotak sukses hanya setelah cerita baru dibuat**, dengan tiga langkah
   berurutan.

### `markDirty` punya empat efek, dan yang ketiga paling mudah dilupakan

Menandai kotor · mengaktifkan **kedua** tombol simpan · menulis draf · dan
**menandai kolom mana yang berubah**. Yang terakhir itu yang membuat formulir
lima section bisa dipakai: "ada yang berubah" saja tidak memberi tahu penulis
*mana*.

Penandanya dibandingkan terhadap nilai awal, bukan disimpan sebagai bendera —
mengetik lalu menghapusnya lagi berarti tidak ada yang berubah, dan penanda yang
tersisa di situ berbohong.

### Draf menyimpan isinya, bukan penanda

Prototipe menulis `'1'` ke `localStorage` — cukup untuk memunculkan kotak "ada
draf", tidak cukup untuk mengembalikan satu huruf pun. Tawaran memulihkan yang
tidak bisa memulihkan apa-apa lebih buruk daripada tidak menawarkan.

Kuncinya persis seperti prototipe (`novelova:create-story-draft` /
`:edit-story-draft`) supaya draf yang sudah ada di perangkat tidak hilang saat
aplikasi ini menggantikannya — dan karena itu ditulis langsung, bukan lewat
`zustand/persist` yang membungkus nilainya dalam `{ state, version }`.

Dua penjagaan yang lahir dari memikirkan draf yang *tidak* cocok:

- Draf mode `sunting` milik cerita **lain** diabaikan. Memulihkan isi cerita A ke
  formulir cerita B adalah cara tercepat menimpa naskah yang benar.
- Draf ditumpuk **di atas nilai awal**, bukan menggantikannya. Draf dari versi
  lama aplikasi kehilangan kolom yang sejak itu ditambahkan, dan formulir yang
  menerimanya mentah pecah di kolom pertama yang hilang — persis yang terjadi
  saat saya menulis testnya.

### Tiga penolakan yang menyebut penyebabnya

- **Cover**: format dan ukuran **menolak**; rasio hanya **menyarankan** — dan
  sarannya menyebut ukuran yang benar (*"misalnya 800×1200"*), bukan sekadar
  menyatakan salah. Yang pertama bisa langsung dikerjakan; yang kedua tidak.
- **Tag kembar** menyebut tag mana yang bentrok. "Tag sudah ada" memaksa penulis
  memindai sepuluh chip mencari yang mana.
- **Batas sepuluh tag** menyebut bahwa satu harus dihapus dulu. Prototipe
  mengabaikannya diam-diam, dan penulis mengira tombolnya rusak.

### Satu cacat prototipe yang dibalik urutannya

Konfirmasi "Apakah cerita ini benar-benar sudah tamat?" dievaluasi **sebelum**
statusnya berubah. Di prototipe ia dievaluasi sesudah, jadi membatalkan
konfirmasi tetap meninggalkan lencana pada "Tamat" (PRD 07 §7).

### Simpan gagal tidak menghukum penulis

Formulir **tidak dikosongkan**, dan tombolnya berubah menjadi "Coba simpan lagi".
Testnya membuktikan keduanya sekaligus: setelah gagal, seluruh isi masih ada dan
**nol** cerita tercipta; setelah penyebabnya hilang, menyimpan ulang menghasilkan
tepat satu.

### `Story` mendapat tujuh kolom, dan itu bukan pelebaran sembarangan

Komentar · moderasi · terjemahan · fanfiction · label konten · dedikasi · catatan
penulis. Formulir bisa mengatur ketujuhnya, tetapi server tidak punya tempat
menyimpannya — formulir yang kolomnya tidak bisa pulang bukan formulir.
Ketujuhnya juga **terlihat pembaca**, jadi tempatnya memang di `Story` dan bukan
tabel terpisah.

### Mobile

Dua alur baru di dua lebar: **formulir baru** dan **zona bahaya**. Yang pertama
sengaja menekan tombol simpan **bawah** — yang paling berisiko tertutup bilah
navigasi di layar sempit; yang kedua membuktikan zona bahaya di dasar formulir
terpanjang aplikasi ini benar-benar terjangkau, beserta dialog ketik-ulang
judulnya. `/karya/baru` dan `/karya/ms1/ubah` juga masuk sapuan overflow. Tidak
ada cacat tata letak baru.

### Satu perbaikan test yang layak disebut

Test formulir mengetik sinopsis 74 karakter dengan `userEvent.type` — satu per
satu, 3,5 detik per test, cukup untuk menyentuh ambang lima detik saat mesinnya
sibuk, dan itu memang terjadi sekali. Diganti `fireEvent.change`: yang diuji
aturan validasinya, bukan pengetikannya. 3.557 ms → 708 ms.

**Verifikasi:** `npm run check` bersih, **331 test unit + 24 e2e lulus**
(312 → 331, 18 → 24), `npm run build` berhasil. `todo.md`: 381 → 409 tugas
dicentang.

---

## 2026-09-02 · Langkah 26 — Fase 8b: kelola bab

> "oke lanjutkan lagi semua todo di fase 8b. dan pastikan saat tampilan mobile.
> semua flow sama dan tidak ada bug dengan tampilan dekstop."

Tujuh tugas, nol sisa. `/karya/:id/bab` berdiri: penghitung yang merangkap
pintasan saringan, daftar bab yang berbeda isinya per status, menu aksi dinamis,
dan penjadwal khusus bab.

### Penghitung yang benar-benar menyaring

Tiga penghitung di kepala halaman **adalah** pintasan saringan (FR-STUDIO-07), dan
tab di bawahnya ikut menyorot. Bukan karena keduanya saling memberi tahu — karena
keduanya membaca `?tab=` yang sama. Dua kontrol yang menyaring hal yang sama
tetapi menyimpan keadaannya masing-masing adalah cara tercepat membuat penulis
ragu mana yang sedang berlaku.

### Pemberitahuan yang lahir dari data

Empat jenis, semuanya dihitung server dari keadaan bab: terbit dalam 24 jam ·
draf tak disentuh lima hari · bab privat · bab menembus sepuluh ribu pembacaan.
Dan **setiap satu punya tujuan** — daftar yang menyoroti masalah tanpa memberi
jalan ke sana hanya memindahkan pekerjaan mencari ke penulisnya.

Yang penting: pemberitahuan ini tidak ditulis tangan. Yang tidak lahir dari data
akan tetap berbunyi lama setelah penyebabnya hilang.

### Tujuh tab, bukan empat

Alasan yang sama persis dengan §1.9 di langkah sebelumnya. PRD menyebut empat tab
(Semua · Draft · Terjadwal · Publish), tetapi FR-STUDIO-08 sendiri punya status
`private`, dan FR-STUDIO-38 menambahkan `Dalam tinjauan` dan `Ditolak` yang
*"ikut dalam saringan tab"*. Status tanpa saringan adalah status yang penulisnya
tidak akan pernah temukan.

### Menu aksi: jenis elemen adalah data, bukan tebakan

Prototipe menentukan apakah sebuah aksi jadi `<a>` atau `<button>` dari **teks
labelnya** — memuat kata "Edit" atau "Akses" berarti tautan. Tebakan itu pecah
pada terjemahan pertama, dan pecahnya diam: tombol yang seharusnya menavigasi
tiba-tiba tidak melakukan apa-apa.

Di sini jenisnya bagian dari datanya. Daftarnya juga dibangun dari `chapter` yang
sedang dibuka, jadi membuka menu bab lain tidak pernah menyisakan aksi bab
sebelumnya — yang di prototipe dijaga dengan mengosongkan DOM secara manual.

### Empat test saya sendiri yang bergantung jam dinding

Ini temuan yang paling layak dicatat. E2E kelola bab gagal sekali dari enam kali
jalan, dan penyebabnya **bukan** infrastruktur:

Penjadwal memakai tanggal **hari ini** dan mengklik chip jam. Itu membuat testnya
bergantung jam dinding **dalam dua arah sekaligus**:

- Lewat jam yang dipilih → server menolaknya sebagai waktu yang sudah lewat,
  lembar tidak menutup, assertion `toBeHidden` gagal.
- Sebelum jam itu → babnya masuk pemberitahuan "terbit dalam 24 jam", judulnya
  muncul dua kali di halaman, dan locator-nya melanggar strict mode.

Jadi ada dua jendela gagal berbeda dalam satu hari, dan keduanya lolos di sebagian
besar jam. Diperbaiki di empat tempat — dua e2e, dua unit test — dengan mengisi
tanggalnya tiga hari ke depan. Enam kali suite e2e penuh bersih sesudahnya.

Pelajarannya bukan "tambah timeout": timeout yang saya naikkan lebih dulu hanya
menyamarkan separuh masalahnya. Yang benar adalah membuang ketergantungan pada
jam.

### Mobile

`karya-dua-lebar.spec.ts` kini menjalankan **dua** alur di dua lebar: daftar karya
dan kelola bab. Yang terakhir sengaja menekan bagian yang paling mudah pecah di
layar sempit — **lembar penjadwal yang dibuka dari dalam lembar menu aksi**,
lembar di atas lembar. `/karya/ms1/bab` juga masuk sapuan "tidak menggeser badan
halaman ke samping". Tidak ada cacat tata letak baru.

**Verifikasi:** `npm run check` bersih, **312 test unit + 18 e2e lulus**
(285 → 312, 15 → 18), `npm run build` berhasil. `todo.md`: 369 → 381 tugas
dicentang.

---

## 2026-09-02 · Langkah 25 — Fase 8a: onboarding penulis & daftar karya

> "oke lanjutkan lagi semua todo di fase 8a. dan pastikan saat tampilan mobile.
> semua flow sama dan tidak ada bug dengan tampilan dekstop."

Empat belas dari lima belas tugas. Author Studio punya pintu masuknya: dari
pembaca biasa, mendaftar, sampai daftar karya yang bisa dijadwalkan, dicetak,
dan dihapus.

### Tujuh status, bukan lima — dan itu bacaan PRD, bukan selera

FR-STUDIO-02 menyebut lima status kartu; FR-STUDIO-03 membangun enam tab di
atasnya. Lalu FR-STUDIO-38 menambahkan dua status baru dengan kalimatnya
sendiri: *"Dua status baru **melengkapi** lima status cerita yang sudah ada."*

Yang lupa ikut menyesuaikan adalah daftar tab. Membiarkannya berarti **cerita
yang ditolak tidak punya satu pun saringan yang menampilkannya** — dan
penulisnya tidak pernah menemukan alasan penolakan yang FR-STUDIO-38 sendiri
wajibkan spesifik. Jadi: tujuh status, delapan tab. Diputuskan dengan membaca,
bukan dengan menebak, dan dicatat di `architecture.md` §1.9 lengkap dengan tabel
urutan pemeriksaannya.

Statusnya **diturunkan, bukan disimpan.** Tidak ada kolom `studioStatus`; server
menghitungnya dari `review × status × visibility × jadwal`. Satu keadaan yang
ditulis di dua tempat cepat atau lambat berselisih dengan dirinya sendiri.

### Tiga tingkat penulis, ditegakkan server

Guard rute hanya memilih layar; yang menolak membuat cerita tanpa pendaftaran
adalah handler. Dan yang membuat FR-STUDIO-33 bukan sekadar formulir: **hanya
prasyarat pertama yang menahan.** Menyetujui ketentuan sudah cukup untuk mulai
menulis; identitas pencairan dan 2FA baru dituntut saat menyentuh uang. Meminta
ketiganya di depan berarti menolak penulis yang belum tentu akan pernah menerima
uang.

`/karya` karenanya punya **tiga** keadaan kosong yang berbeda, dan menyamakannya
adalah cacat yang ditutup di sini: belum mendaftar → ajakan menjadi penulis ·
sudah mendaftar tetapi belum menulis → ajakan membuat cerita pertama · saringan
tidak menemukan apa pun → jalan keluar dari saringannya.

### Aksi kartu: yang tidak berlaku tidak ditampilkan

Empat aksi selalu ada (Edit · Bab · Pratinjau · Hapus). Tiga sisanya muncul
hanya bila berlaku — bukan muncul-lalu-dinonaktifkan. Tombol mati yang tetap
terlihat mengajari penulis mencoba hal yang tidak akan pernah bekerja.

Aturan **Analisa dibalik** dari prototipe (PRD 07 §7 #1): di sana justru cerita
terbit yang kehilangan tautan analitiknya — padahal hanya cerita terbit yang
punya angka untuk dianalisa.

Menghapus cerita **terbit yang babnya sudah dibeli** ditolak server, dengan
alasan konkret berisi jumlah bab yang sudah dibayar. Pembaca yang sudah membayar
tidak boleh kehilangan miliknya karena satu ketukan di studio.

### `FilterableList` akhirnya dipakai

Pola cari + tab + urut + penghitung + sembunyi-saat-kosong dibangun di Fase 1
dan **tidak pernah dipakai sekali pun**. Studio memakainya sekarang, seperti yang
memang tertulis di rencana.

Ia juga mendapat satu perbaikan: `shown`. Keterangannya dulu selalu berbunyi
"menampilkan 20 dari 42" — termasuk setelah pembaca menekan "Muat lagi" tiga
kali.

> Catatan jujur: `/pustaka` dan `/koin/transaksi` masih memakai kontrol
> tangan-sendiri yang menduplikasi pola ini. Keduanya bekerja dan bertest, jadi
> saya **tidak** memigrasikannya di langkah ini — di luar permintaan. Layak
> dibereskan saat fase masing-masing disentuh lagi.

### Dua metrik yang tidak boleh dikarang

Kartu studio menuntut enam angka, dua di antaranya tidak bisa diturunkan di
klien: pembaca unik dan koin yang dihasilkan. Godaannya menghitung koin dari
`unlockCount × AUTHOR_SHARE` — dan `lib/coin.ts` melarangnya dengan tegas, karena
FR-EARN-12 mensyaratkan bagi hasilnya datang dari konfigurasi server yang bisa
berubah tanpa rilis. Jadi keduanya jadi kolom `StoryStats` yang datang dari
server, bukan aritmetika di layar.

### Satu cacat React yang klasik

Formulir pendaftaran mengambil nilai awal tiga sakelarnya dari profil penulis —
lewat `useState`, yang **hanya membaca argumennya sekali**. Saat query masih
berjalan, `profile.data?.termsAcceptedAt !== null` bernilai `true` karena
`undefined !== null`, jadi "Menyetujui ketentuan" tampil tercentang untuk orang
yang belum pernah mendaftar. Diperbaiki dengan menunggu profilnya turun sebelum
formulirnya dirender.

### Mobile: alur yang sama, dibuktikan berdampingan

Permintaannya eksplisit, jadi buktinya juga: `karya-dua-lebar.spec.ts` memanggil
**satu fungsi alur** dua kali — 412px dan 1280px. Bukan dua test yang kebetulan
mirip; kalau kelak salah satu lebar menyimpang, yang gagal adalah lebar itu saja
dan namanya langsung menyebut mana.

Ditambah tiga pemeriksaan di viewport HP: lembar jadwal dan lembar cetak dua tab
yang tombolnya benar-benar **ditekan**, dan dua halaman studio masuk ke sapuan
"tidak menggeser badan halaman ke samping". Tidak ada cacat baru yang ditemukan —
`--nv-bottom-nav` dari Langkah 23 sudah menutup kelas cacat yang sama.

### Yang tidak dikerjakan, dan kenapa

**Status penulis di `/profil` kelompok Akun** (P1) menunggu halaman profil di
Fase 13. Tingkat penulis dan langkah yang belum selesai sudah tampil di
`/karya/daftar-penulis`, jadi informasinya tidak hilang — hanya belum ada di
tempat kedua.

**Verifikasi saat menyentuh monetisasi** ditegakkan server untuk pembuatan
cerita; gerbang bab berbayarnya sendiri (FR-STUDIO-23) ada di 8d bersama layar
akses bab.

**Verifikasi:** `npm run check` bersih, **285 test unit + 15 e2e lulus**
(258 → 285, 9 → 15 e2e), `npm run build` berhasil. `todo.md`: 350 → 369 tugas
dicentang.

---

## 2026-09-01 · Langkah 24 — Paket & kustom saling menonaktifkan · `[PRODUK]`

> "oke ini ada minor tampilan. Masih di fase 7 ketika user memilih koin, maka
> opsi untuk memasukan custom coin itu disable. Begitu sebaliknya"

Permintaan ini **menimpa PRD**, jadi dicatat sebagai keputusan produk, bukan
perbaikan cacat. FR-WALLET-02/03 menetapkan keduanya saling *mengosongkan* —
memilih paket menghapus isi kolom kustom, mengetik di kolom membatalkan pilihan
paket, dan **keduanya tetap hidup**. Sekarang yang tidak terpakai dimatikan.

### Satu pertanyaan yang harus ditanyakan dulu

Menonaktifkan memunculkan jalan buntu yang tidak dijawab PRD maupun kanvas:
**bagaimana pengguna kembali?** Kalau kolom kustom mati begitu paket dipilih,
tanpa jalan kembali pembaca terkunci di paket yang terlanjur ditekan.

Jawaban yang dipilih: **menekan paket yang sudah terpilih membatalkannya.** Tidak
ada kontrol baru di layar yang sudah punya tiga langkah, dan tidak ada jalan
buntu. Sisi sebaliknya simetris: mengosongkan kolom kustom menghidupkan kembali
kartu paket.

### Yang berubah

| Keadaan | Paket | Kolom kustom |
|---|---|---|
| Belum memilih apa pun | hidup | hidup |
| Satu paket terpilih | hidup (yang terpilih = tombol batal) | **mati** |
| Kolom kustom berisi | **mati** | hidup |

Kartu paket mati **begitu kolomnya berisi**, termasuk saat isinya belum sah —
karena di situlah pembaca justru sedang mengetik. Petunjuk kecil menyebut jalan
keluarnya di kedua arah, dan `aria-label` paket terpilih berubah menjadi
"Batalkan pilihan paket 500 koin" supaya fungsi keduanya jelas juga tanpa
melihat layar.

### Flake lama akhirnya ketemu

Di Langkah 22 saya melaporkan satu test gagal sekali lalu tidak bisa
direproduksi. Ia muncul lagi di sini, dan kali ini sempat tertangkap:
`TopupPage` \u203a "setelah bayar, tombol utamanya kembali ke bab yang sama".

Penyebabnya bukan cacat produk. Layar sukses tahu saldo barunya dari pesanan,
sedangkan **bilah atas menunggu `['wallet']` diambil ulang** — keduanya benar,
tetapi tidak tiba pada render yang sama. Assertion-nya yang salah: ia memotret,
bukan menanti. Sekarang memakai `vi.waitFor`, dan lulus enam kali berturut-turut.

### Ke mana penimpaan PRD dicatat

Ditanyakan pengguna sesudahnya — dan jawabannya membuka satu kelalaian.

**Berkas PRD tidak pernah disunting** di proyek ini; `git log` atas
`PRD Novelova/` hanya punya commit awal. Ia sengaja tetap jadi catatan jujur
tentang apa yang semula diminta, sementara setiap penimpaan dicatat di
`architecture.md` §1.x beserta alasannya — seperti §1.6 untuk section beranda per
tab.

Yang terlewat bukan PRD-nya, melainkan pasangan §1.x itu: saya menulis ke tabel
§5 `CLAUDE.md` tanpa membuat seksinya di `architecture.md`. Ditutup dengan
**§1.8**, lengkap dengan tabel keadaan, alasan jalan kembalinya wajib ada, dan
catatan bahwa seluruh aturan angka FR-WALLET-03 tetap berlaku apa adanya.
`CLAUDE.md` §5 kini juga menyebut konvensinya secara eksplisit, supaya sesi
berikutnya tidak perlu menebak apakah PRD boleh disunting.

**Verifikasi:** `npm run check` bersih, **258 test unit + 9 e2e lulus**,
`npm run build` berhasil. `todo.md`: 348 → 350 tugas dicentang.

---

## 2026-09-01 · Langkah 23 — Dua cacat tata letak di layar HP

> "oke masih ada bugs pada fase 7. ketika saya test di tampilan handphone button
> untuk melakukan proses bayar tidak bisa muncul. jika tampilan dekstop dia
> muncul"

Terkonfirmasi, dan penyebabnya persis seperti yang digambarkan: **hanya di
`<1024`**. Satu catatan kecil — tombolnya ada di halaman isi koin (`/koin`,
Fase 6), bukan di perpustakaan; yang Fase 7 hanyalah waktu ditemukannya.

Mencarinya menemukan cacat kedua yang lebih luas, dan keduanya diperbaiki di
akarnya.

### 1. Dua bilah yang sama-sama ingin `bottom: 0`

Navigasi bawah `fixed inset-x-0 bottom-0 z-40`; bilah bayar `fixed inset-x-0
bottom-0 z-30`. Posisi sama, lapisan lebih rendah — jadi navigasi menutupinya
seluruhnya. Di `≥1024` navigasi berubah jadi sidebar dan bilah bayar jadi
`static`, sehingga cacatnya tidak terlihat sama sekali di layar besar.

**Yang tidak diperbaiki** adalah menaikkan `z-index` bilah bayar: itu hanya
menukar siapa yang tertutup. Yang diperbaiki adalah **angka yang tidak pernah
dibagi**: tinggi bilah navigasi. Sekarang ia satu token, `--nv-bottom-nav`,
dengan empat pemakai:

| Pemakai | Sebelumnya |
|---|---|
| Bilah navigasi (`min-height`) | tinggi implisit dari isinya |
| Ruang bawah `AppShell` | `pb-36` |
| FAB isi koin | `bottom-24` |
| Bilah bayar `/koin` | `bottom-0` ← **cacatnya** |

Tokennya memuat `env(safe-area-inset-bottom)`, karena tinggi itu memang berubah
di perangkat berponi — angka tetap akan meleset di sana saja, dan meleset
diam-diam.

### 2. Kerangka pemuatan menggeser setiap halaman 24px

Ketahuan saat menyapu lebar halaman di viewport HP: `/koin/transaksi` sesekali
menggeser badan halaman ke samping. "Sesekali" karena pelakunya hanya hidup
sepersekian detik — **kerangka pemuatan Suspense**.

`<Skeleton lines={6} className="m-6" />` meneruskan `className` ke **tiap
baris**, sehingga `m-6` bertumpuk dengan `w-full` pada elemen yang sama: lebar
penuh, lalu digeser 24px. Sekarang `className` menempel di wadahnya — yang
memang arti wajar sebuah kerangka multi-baris — dan cacatnya hilang untuk semua
pemanggil sekaligus, bukan hanya untuk yang ini.

Cacat ini menyentuh **setiap halaman**, bukan hanya riwayat transaksi. Ia
bertahan lama justru karena berumur pendek.

### Cara membuktikannya

Test ditulis **sebelum** perbaikan, dan gagal seperti yang seharusnya:

```
<a href="/pustaka"> from <nav aria-label="Navigasi utama"> subtree
intercepts pointer events
```

Kuncinya **menekan** tombolnya, bukan memeriksa ia ada. Elemen yang tertutup
tetap "terlihat" bagi assertion biasa; yang gagal adalah kliknya — dan itulah
yang benar-benar dialami pengguna.

E2E ketiga lahir dari sini: satu berkas di viewport Pixel 7 yang menekan tombol
bayar, memastikan aksi utama kartu perpustakaan bisa ditekan, dan memeriksa lima
halaman tidak menggeser badan halaman ke samping.

**Verifikasi:** `npm run check` bersih, **258 test unit + 9 e2e lulus**
(2 → 9 e2e), `npm run build` berhasil.

---

## 2026-09-01 · Langkah 22 — Fase 7 selesai · **M3**

> "oke lanjutkan sisa fase 7"

Sembilan tugas terakhir. **Loop retensi tertutup**: simpan cerita, baca, progres
tercatat, dan "Lanjut Baca" membawa ke bab yang benar.

### Dua keadaan kosong yang berbeda

Ini yang paling sering disamakan, dan paling merugikan kalau disamakan. Rak yang
**benar-benar kosong** mendapat ajakan — penjelasan singkat, "Jelajahi cerita",
dan tautan ke kategori populer. Saringan yang **tidak menemukan apa pun**
mendapat jalan keluar: hapus saringannya.

Menyamakan keduanya berarti menyambut pengguna hari pertama dengan pesan
kegagalan pencarian, yang persis dilarang FR-CORE-02.

Bedanya dibaca dari **ringkasan koleksi, bukan dari daftar yang sedang tampil**.
Daftar kosong karena saringan bukan rak kosong, dan hanya ringkasan yang tahu
bedanya. Saat rak kosong, kontrol cari/saring/urut disembunyikan — tidak ada
gunanya menyaring nol cerita — sementara ringkasannya tetap tampil dengan angka
nol.

### "Lanjut Baca" yang benar-benar melanjutkan

Label mengikuti progres: **Lanjut Baca** · **Mulai Baca** · **Baca Ulang**. Dan
tujuannya bab terakhir yang dibaca, bukan bab pertama — janji yang di prototipe
diingkari satu ketukan setelah diucapkan, karena tautannya menuju halaman yang
bahkan tidak ada di folder.

### Dua cacat prototipe yang ditutup

1. **`aria-label` sakelar notifikasi kini ikut berubah** (PRD 06 §7 #3).
   Sebelumnya labelnya tetap, jadi pembaca layar selalu mendengar keadaan yang
   salah setelah ketukan pertama.
2. **Hapus punya "Urungkan"** (PRD 06 §7 #2). Enam detik, dan servernya memang
   menyediakannya: `removeFromLibrary` menandai, tidak menghapus, jadi tanggal
   simpan aslinya kembali utuh.

Toast bawaan hanya 2,6 detik, dan "Urungkan" yang lenyap dalam 2,6 detik adalah
tombol yang tidak pernah sempat ditekan. Jadi `Toast` menerima `durationMs` per
panggilan — satu bidang opsional di tempat yang benar, bukan toast khusus di
perpustakaan.

### Penghitung: satu catatan kejujuran

FR-LIB-06 menuntut bentuk tunggal/jamak (`"1 story"` vs `"6 stories"`). **Bahasa
Indonesia tidak menandai jamak** — "1 cerita" dan "6 cerita" — jadi satu fungsi
menutup keduanya. Yang tetap dibangun adalah aturan yang benar-benar berlaku:
penghitung menampilkan hasil yang **terlihat**, bukan total koleksi. Itu tugas
ringkasan di kepala halaman, dan keduanya sengaja tidak saling menurunkan.

### Yang tidak dikerjakan, dan kenapa

**Penanda "tersedia offline"** (P2) menunggu Fase 14. Arch §10.3 menaruh metadata
bab tersimpan di Dexie beserta Cache Storage-nya, dan keduanya belum ada —
membangun penandanya sekarang berarti lencana yang selamanya mati.

### Catatan aksesibilitas

Wadah tab semula `div role="group"` beraria-label. Diganti `fieldset` +
`legend` sr-only: empat tombol saringan memang satu kelompok kontrol, dan elemen
aslinya sudah membawa peran itu tanpa ARIA sama sekali.

**Verifikasi:** `npm run check` bersih, **258 test unit + 2 e2e lulus**
(251 → 258), `npm run build` berhasil. `todo.md`: 336 → 345 tugas dicentang.
**Fase 7 tuntas kecuali satu tugas yang terhalang — M3 tercapai.**

---

## 2026-09-01 · Langkah 21 — Fase 7, paruh pertama

> "oke lanjutkan fase 7 dan kerjakan 1/2 todo di fase tersebut"

Sebelas dari 22 tugas. **Rak pembaca akhirnya punya sumber data.** Di prototipe,
perpustakaan tidak punya cara diisi dan progresnya tidak punya asal — kedua alur
itu ditutup di langkah ini.

### Status baca dihitung, bukan ditulis

Tiga status, satu aturan: `not-started` = nol bab selesai · `finished` = seluruh
bab **terbit** selesai · `reading` = di antaranya.

Yang menarik justru apa yang **tidak** ditulis. "Cerita tamat yang merilis bab
baru kembali menjadi *sedang dibaca*" tidak punya kode sendiri — ia jatuh dari
aturannya: pembaginya bertambah, pembilangnya tidak. Aturan yang menghitung ulang
tidak bisa lupa; penanda yang disimpan bisa.

Dua hal kecil yang mudah keliru:

- **Bab yang ditarik penulisnya tidak ikut dihitung selesai.** Tanpa penyaringan
  itu, cerita bisa tampil lebih dari 100% selesai.
- **Titik "bab baru" menuntut dua syarat**: terbit setelah kunjungan terakhir
  **dan** belum dibaca. Untuk cerita yang belum pernah dibuka, pembandingnya
  tanggal simpan — kalau tidak, setiap cerita yang baru disimpan langsung
  bertitik merah dan titiknya berhenti berarti apa-apa.

### Cari, saring, urut — pindah ke server

Perilakunya sama persis seperti FR-LIB-03 sampai FR-LIB-05, tapi tidak lagi
terbatas pada kartu yang kebetulan ada di DOM. Prototipe menyaring elemen yang
sudah dirender, jadi cerita ke-43 tidak pernah ikut tersaring apa pun
saringannya.

Urutannya **selalu** dijalankan sebelum pemotongan halaman. Mengurutkan setelah
memotong berarti halaman dua berisi cerita yang seharusnya di halaman satu —
cacat yang tidak terlihat sampai koleksinya lewat dua puluh.

### `getLibrarySummary` terpisah, dan itu disengaja

Empat metrik kepala halaman **tidak boleh ikut berubah saat menyaring**
(FR-LIB-01). Menurunkannya dari daftar yang sedang tampil akan membuatnya
berubah — dan itu penghitung hasil, bukan ringkasan koleksi. Dua hal berbeda,
dua panggilan berbeda. Seam-nya kini 80 metode.

### Urungkan yang benar-benar mengurungkan

`removeFromLibrary` menandai, tidak menghapus, dan `undoRemove` **tidak menyentuh
`savedAt`**. Mengurungkan penghapusan bukan menyimpan ulang: urutan "terbaru
disimpan" tidak boleh berubah hanya karena pembaca salah tekan.

### Halaman: kepala, ringkasan, kartu, pencarian

`/pustaka` hidup dengan empat metrik, kolom pencarian yang kuerinya ada di URL,
dan kartu yang setiap angkanya datang dari server — lencana status terbit, titik
bab baru, batang progres, "Bab 45 dari 120", persentase, dan tanggal simpan.

Satu cacat aksesibilitas ketahuan lewat linter: titik merah bab baru diberi
`aria-label` pada `<span>` telanjang, dan pembaca layar mengabaikannya. Sekarang
ia `role="img"`.

### Yang belum — paruh kedua

Empat tab status, empat opsi urutan, penghitung tunggal/jamak, **dua keadaan
kosong yang berbeda**, tombol "Lanjut Baca" ke bab terakhir yang dibaca, sakelar
notifikasi per kartu, hapus dengan toast "Urungkan" enam detik, dan penanda
tersedia offline. **Servernya sudah menyediakan semuanya** — yang tersisa
kontrolnya di layar.

**Verifikasi:** `npm run check` bersih, **251 test unit + 2 e2e lulus**
(233 → 251, dua berkas baru), `npm run build` berhasil. `todo.md`: 324 → 336
tugas dicentang.

---

## 2026-09-01 · Langkah 20 — Fase 6 selesai · **M2**

> "oke lanjutkan sisa fase 6"

Tujuh belas tugas terakhir. **Loop ekonomi tertutup penuh**: temukan, baca,
kehabisan koin, beli, kembali ke bab yang sama, lanjut baca — dan e2e kedua
menjalankannya dari ujung ke ujung di Chromium sungguhan.

### Tiga jalan gagal, karena akibatnya bertiga berbeda

Bukan tiga kode untuk satu layar. Yang membedakannya adalah **apa yang benar
dilakukan pengguna berikutnya**:

| Kode | Artinya | Aksi yang ditawarkan |
|---|---|---|
| `PAY-402` | Bank menolak — uangnya **jelas** tidak berpindah | Ganti metode · Coba metode yang sama |
| `PAY-504` | Penyedia tidak menjawab — uangnya **mungkin** sudah berpindah | Buka riwayat · Periksa status |
| `PAY-410` | Batas waktu habis | Buat pesanan baru · Saya sudah transfer |

Perbedaannya bukan kosmetik. Pada `PAY-402` mengulang itu benar; pada `PAY-504`
mengulang **adalah** cara membayar dua kali. Karena itu tombol "coba lagi" tidak
ada di layar kedua — yang ada "periksa status", yang membaca tanpa membayar
apa pun.

### `pending_reconciliation` ditegakkan server, bukan disarankan layar

Pesanan yang statusnya tidak diketahui menutup dua pintu sekaligus: pesanan itu
sendiri menolak dilunasi, dan **pesanan baru mana pun ditolak** selama ia belum
selesai. Layar isi koin ikut mengunci tombol bayarnya, tetapi kunci itu hanya
lapisan kedua — penandanya lokal dan hilang saat halaman dimuat ulang, sementara
penolakan servernya tidak.

Sepuluh menit kemudian server-mock **menyelesaikannya sendiri**: koin masuk, satu
baris ledger berubah status, dan satu notifikasi dompet terkirim menautkan ke
detail transaksinya. Tidak ada tombol yang perlu ditekan — itulah yang membuat
"jangan bayar dua kali" jadi saran yang bisa diikuti, bukan jalan buntu.

Pemicunya pembacaan dompet berikutnya, bukan kerja terjadwal. Server sungguhan
memakai cron; di server-mock, `getWallet` dan `listTransactions` yang jadi
detaknya.

### Kedaluwarsa bukan berarti uangnya hangus

Transfer VA bisa mendarat setelah jendelanya tutup. Jadi "Saya sudah transfer"
pada pesanan yang kedaluwarsa **tidak ditolak** — ia dipindahkan ke rekonsiliasi.
Yang tetap ditolak keras adalah pesanan yang **dibatalkan pengguna**; keduanya
berstatus `expired`, dan penanda `CANCELLED` yang membedakannya. Tanpa pembedaan
itu, membatalkan lalu menekan "Saya sudah transfer" akan mencetak koin.

### Buku besar dompet

`/koin/transaksi`: brankas saldo, empat saringan yang **meminta ulang barisnya ke
server**, dua panel analitik, dan ekspor. Prototipe mengumpulkan barisnya sekali
saat halaman dimuat lalu menyembunyikan sebagian dengan CSS — sehingga transaksi
yang lahir sesudah itu tidak pernah ikut tersaring (PRD 09 §7 #7). Saringannya
hidup di URL, jadi satu tautan membawa pandangan yang sama.

Ekspor kuitansi menghasilkan **berkas CSV sungguhan** lewat `Blob` dan tautan
unduh — nol dependensi baru. PDF-nya memakai cetak peramban; ditandai `ponytail:`
beserta batasnya, karena tata letak kuitansi yang persis memang butuh pustaka.

### Setiap baris punya alamat

`/koin/transaksi/:txId`. Empat status dengan aturan koin yang mengikat: **hanya
`success` yang menggeser saldo** — `pending`, `failed`, dan `reversed` punya saldo
sebelum dan sesudah yang sama persis.

Tiga cacat prototipe ditutup di sini:

1. **Status dibaca dari data transaksi, bukan dari `?status=`.** Sebelumnya siapa
   pun bisa membuka transaksi gagal sebagai "berhasil" dan halaman itu percaya.
2. **Baris pengeluaran punya halaman detailnya sendiri** — menyebut cerita dan
   babnya serta menautkan ke sana. Sebelumnya hanya baris top-up yang tertaut,
   jadi pembelian bab tidak punya alamat sama sekali.
3. **`id` yang tidak ditemukan mendapat keadaan kosong yang sopan**, bukan jatuh
   ke status sukses palsu.

`balanceAfter` dihitung mundur dari saldo sekarang, bukan disimpan per baris:
saldo tersimpan yang menyimpang dari jumlah ledgernya adalah cacat yang tidak
bisa diperbaiki tanpa tahu mana yang benar.

### E2E kedua

Bab terkunci → gerbang → dua pembelian yang menurunkan saldo lewat antarmuka →
saldo kurang → isi koin membawa `?return=&chapter_id=&need=` → paket terkecil
yang mencukupi tersorot → QRIS → bayar → "Lanjutkan membaca" → **bab yang sama**,
dan babnya terbuka.

Dua pembelian di awal itu bukan basa-basi: itulah cara sah menurunkan saldo akun
contoh (15.300 koin) ke bawah harga satu bab tanpa menyentuh basis data dari
luar. Dan satu hal ketahuan justru karenanya — harga bab **tidak seragam**
(1.500 · 1.800 · 2.000 bergiliran), jadi versi pertama testnya menghitung salah.

Satu tambahan di luar rencana: `/dev/kitchen-sink` kini punya sakelar hasil
pembayaran. Ketiga jalan gagal hanya terjadi berbulan-bulan sekali di dunia
nyata — tanpa sakelarnya, tidak satu pun layarnya pernah sempat diperiksa. Sama
alasannya dengan tiga tombol sesi yang sudah ada di sana.

### Yang tidak dikerjakan, dan kenapa

Dua tugas tersisa, keduanya menunggu halaman fase lain — bukan dilewati:

- **Saldo di 6 titik** baru empat: reader, isi koin, riwayat transaksi, FAB
  beranda. Pusat hadiah (Fase 12) dan profil (Fase 13) belum ada halamannya.
- **"420 koin hadiah" jadi metrik periode berjalan** menunggu pusat hadiah.

**Verifikasi:** `npm run check` bersih, **233 test unit + 2 e2e lulus**
(219 → 233), `npm run build` berhasil. `todo.md`: 310 → 324 tugas dicentang.
**Fase 0–6 tuntas kecuali dua tugas yang terhalang — M2 tercapai.**

---

## 2026-09-01 · Langkah 19 — Fase 6, paruh pertama

> "oke sekarang lanjutkan fase 6. dan kerjakan 1/2 todo didalam fase tersebut"

Dua puluh enam dari 43 tugas. Seluruh alur isi koin berdiri: tiga langkah
pemilihan, empat overlay pembayaran, layar sukses, dan layar gagal. **Konteks
kembali yang dikirim gerbang bab sejak Fase 5 akhirnya ada yang menerimanya.**

### Penyedia pembayaran yang dapat ditukar · arch §11.1

`payments/provider.ts` sengaja **tidak mengenal koin, bonus, atau `TopupOrder`**.
Ia menerima `ChargeRequest` — nomor pesanan, rupiah, tipe, batas waktu — dan
mengembalikan `Charge`. Arah impornya jadi tetap ke bawah, dan `midtrans.ts`
nanti cukup menulis tiga fungsi tanpa menyentuh satu pun berkas alur.

`midtrans.ts` **melempar**, tidak mengembalikan nilai kosong. Penyedia yang
diam-diam menjawab `pending` untuk semua orang jauh lebih berbahaya daripada yang
gagal keras saat dipasang setengah jalan.

### Koin hanya bertambah di satu tempat

`createTopupOrder` membuat pesanan dan **satu baris ledger berstatus `pending`**;
`confirmTopupOrder` mengubah status baris itu, bukan menambah baris kedua. Satu
pesanan berarti satu baris di buku besar, selamanya.

Harga, bonus, dan masa berlaku **dihitung server**. `TopupInput` hanya membawa
jumlah koin dan id metode — klien yang boleh menyebut harganya sendiri adalah
klien yang boleh membeli 2.000 koin seharga seribu rupiah.

Urutan pemeriksaan di `confirmTopupOrder` bukan kebetulan: pesanan yang sudah
lunas dikembalikan lebih dulu, lalu kedaluwarsa — **sebelum penyedia ditanya sama
sekali**. "Saya sudah transfer" pada pesanan yang batasnya sudah lewat tidak boleh
mencetak koin, apa pun jawaban penyedianya.

### Dua metode yang tidak ada di rencana

Membiarkan `getTopupOrder` yang menyelesaikan pembayaran berarti **membaca
pesanan bisa mengubah saldo**. Jadi lahir `confirmTopupOrder` dan
`cancelTopupOrder`; seam-nya kini 75 metode. Pembatalan menandai pesanan
`expired`, bukan menghapusnya — status itulah yang membuat "Saya sudah transfer"
sesudah membatalkan ditolak, dan tanpanya pembatalan hanya menyembunyikan
tombolnya.

### Tiga langkah yang saling mengunci ke belakang

Mengubah jumlah menutup pilihan metode **dan** ringkasannya; mundur dari 150 ke
77 menutup keduanya lagi. Tanpa itu ringkasan bisa menampilkan kombinasi yang
tidak pernah dipilih siapa pun. Kolom kustom diurai persis seperti PRD — `parseInt`
pada nilai mentah — sehingga masukan campuran huruf-angka diambil bagian angkanya.

Datang dari gerbang bab menyorot **paket terkecil yang mencukupi** beserta
keterangannya. Menyorot, bukan mengunci: paket lain tetap dapat dipilih, dan
tombol utama di layar sukses berbunyi "Lanjutkan membaca" yang membawa pembaca
kembali ke bab yang sama.

### Satu lembar untuk enam keadaan

Prototipe punya `showOverlay()` yang menutup semua layar lain sebelum membuka
satu. Cara termurah menjamin itu adalah **tidak pernah punya dua**: satu `Sheet`,
satu `phase`. Hitung mundurnya ikut hidup dan mati bersama komponennya, jadi
membatalkan tidak meninggalkan hitungan hantu yang memunculkan layar gagal
setelahnya.

Kode QR-nya pola deterministik, bukan QR yang bisa dipindai — ditandai
`ponytail:` beserta jalan keluarnya (penyedia sungguhan mengembalikan gambarnya
sendiri). Salin nomor VA memakai Clipboard API yang benar-benar dipanggil, dengan
pesan gagal sendiri saat peramban menolaknya.

### Dua cacat yang ketahuan sambil jalan

1. **`prefersReducedMotion` memanggil `matchMedia` tanpa memeriksanya ada.**
   Confetti menjatuhkan seluruh halaman di jsdom dan di webview lama. Diperbaiki
   di `lib/a11y.ts` — satu penjaga untuk semua pemanggil, bukan satu per
   pemanggil.
2. **Lembar dengan `hideTitle` merender judulnya dua kali** — sekali sebagai
   `aria-label`, sekali sebagai `<h2 class="sr-only">`. Nama lembar bayar kini
   menggabungkan kicker dan judul ("Pembayaran berhasil · Koin sudah masuk"),
   jadi tidak ada yang dibacakan dua kali.

### Yang tidak dikerjakan, dan kenapa

- **Saldo di 6 titik** baru tiga: reader, isi koin, FAB beranda. Riwayat
  transaksi, pusat hadiah, dan profil belum punya halaman.
- **"420 koin hadiah" jadi metrik periode berjalan** menunggu pusat hadiah
  (Fase 12).
- **Tiga varian kegagalan bayar**, **`pending_reconciliation`**, rekonsiliasi
  sepuluh menit, **riwayat transaksi**, **detail transaksi**, ekspor kuitansi, dan
  **e2e #2** adalah paruh kedua — sesuai permintaan.

**Verifikasi:** `npm run check` bersih, **219 test unit + 1 e2e lulus**
(204 → 219, dua berkas baru), `npm run build` berhasil. `todo.md`: 282 → 310
tugas dicentang.

Satu koreksi pembukuan: dokumen menyebut "630 tugas" sejak lama, padahal
menghitung ulang memberi **646** kotak tingkat atas (659 bila sub-item ikut
dihitung). Angka lamanya salah, bukan berkurang — `CLAUDE.md` sudah diperbaiki.

---

## 2026-09-01 · Langkah 18 — Fase 5 selesai · **M1**

> "oke lanjutkan sisa fase 5"

Dua puluh empat tugas terakhir. **Fase 5 nol sisa, dan M1 tercapai**: pengguna
bisa menemukan cerita, mencarinya, membuka detailnya, membaca, berpindah bab,
dan progresnya tercatat.

### Auto-unlock · FR-READ-09

Empat pengaman, dan semuanya perlu: sakelarnya menyala · babnya memang terkunci
· belum pernah dicoba untuk bab ini · tidak ada permintaan yang sedang berjalan.
**Selalu harga satuan** — membeli bundel tanpa diminta adalah hal terakhir yang
boleh dilakukan otomatis. Dievaluasi saat gerbangnya terlihat 35%, dan **langsung
saat sakelarnya dinyalakan**; peramban tanpa `IntersectionObserver` mengevaluasi
sekali saja. Saldo kurang memunculkan lembar yang sama dengan pembelian manual,
bukan diam.

### Navigasi bab · FR-READ-15

Dua tempat, dan keduanya perlu: tombol besar **beserta judul tujuannya** di akhir
bab untuk yang baru selesai membaca, dan panah + posisi `Bab 18 / 120` di bilah
bawah untuk yang ingin melompat kapan saja. Judul tujuan dikirim server
(`nextTitle`) karena pembaca bisa masuk lewat tautan langsung tanpa pernah
memuat daftar bab.

Bab pertama **menonaktifkan** "sebelumnya", tidak menyembunyikannya — tombol
yang lenyap menggeser tata letak dan memindahkan panah berikutnya. Bab terakhir
menawarkan kembali ke daftar bab. Bab berikutnya yang terkunci tetap dibuka
beserta gerbangnya, bukan ditolak.

### Progres baca · FR-READ-16

**Persentase, bukan piksel** — piksel berubah artinya begitu pembaca menggeser
ukuran huruf, dan progres yang meleset setelah mengubah pengaturan terasa
seperti kehilangan tempat. Dikirim maksimal sekali per 10 detik plus sekali lagi
saat halaman ditinggalkan, lewat `pagehide` (bukan `beforeunload`, yang tidak
pernah menyala di peramban ponsel saat tab ditutup dari daftar aplikasi).

≥ 90% menandai bab selesai. Membuka kembali bab yang pernah dibaca sebagian
**menawarkan** melanjutkan, tidak melompat sendiri.

### TTS · FR-READ-11

`speechSynthesis` bawaan peramban dengan suara `id-ID` bila ada — tanpa berkas
audio, tanpa permintaan jaringan, tanpa dependensi baru. Kecepatan berputar
1× → 1,25× → 1,5×, kalimat yang sedang dibaca disorot, dan tombolnya **mati
pada bab terkunci**: bab tanpa isi tidak punya apa pun untuk dibacakan.

### Bab ditarik penulisnya · CONTENT-410

Layar penuh menyebut tanggal penarikannya dan bahwa babnya akan kembali dengan
nomor yang sama, dengan tiga jalan keluar — termasuk **"Beri tahu saya"** yang
menyalakan follow cerita itu, jadi ia benar-benar bekerja sekarang.

**Refundnya otomatis**: satu baris ledger balik, idempoten lewat id barisnya, dan
kepemilikannya dihapus — membiarkannya berarti pembaca "memiliki" bab yang
uangnya sudah kembali.

### E2E pertama benar-benar berjalan

`playwright.config.ts` lahir di langkah ini; sebelumnya `npm run e2e` tercantum
di README tanpa konfigurasi sama sekali. Alur beranda → detail → baca bab gratis
kini lulus di Chromium sungguhan.

Dua hal ketahuan justru karena e2e itu:

1. **Seed terlalu berat.** Empat puluh cerita berarti ~1.300 bab, dan menuliskan
   isi untuk semuanya membuat pemuatan pertama menunggu ribuan baris yang
   paragrafnya sama persis. Isi bab kini hanya di-seed untuk bab kanvas;
   `getChapter` memakai naskah contoh bawaan untuk sisanya — identik di layar,
   jauh lebih ringan.
2. **Locator yang cocok dengan enam elemen gagal seketika**, tanpa menunggu
   perpindahan halaman. Judul cerita muncul juga sebagai `h3` di tiap kartu
   beranda, jadi assertion-nya harus menyebut `level: 1`.

**Verifikasi:** `npm run check` bersih, **204 test unit + 1 e2e lulus**
(195 → 204), `npm run build` berhasil. `todo.md`: 258 → 282 tugas dicentang.
**Fase 0–5 nol sisa — M1 tercapai.**

---

## 2026-09-01 · Langkah 17 — Fase 5, seperempat ketiga

> "oke lanjutkan lagi 1/4 berikutnya dari fase 5"

Sembilan tugas: gerbang bab terkunci beserta **seluruh** jalan keluarnya.

### `unlockChapter` · FR-READ-07

Tiga sifat yang membuatnya bukan sekadar "kurangi saldo":

1. **Idempoten.** Kunci yang sama dijalankan dua kali memotong saldo sekali.
   Tombol yang diketuk dua kali karena jaringan lambat tidak boleh berarti
   membayar dua kali — dan pengguna tidak punya cara membuktikan sebaliknya.
2. **Transaksional.** Saldo, kepemilikan, baris ledger, dan kuota iklan ditulis
   dalam satu transaksi Dexie: tidak ada keadaan "saldo terpotong tetapi bab
   tetap terkunci".
3. **Bonus tidak ikut berkurang.** Ia punya masa berlaku sendiri, dan
   memotongnya diam-diam membuat saldo bonus mustahil ditelusuri.

### Angka gerbangnya dihitung server

`getUnlockOptions` mengembalikan tiga pilihan beserta **jumlah bab yang dicakup
dan total harga satuannya**. Rencananya menyebut "lencana hemat 5% / 10%";
angkanya sekarang dihitung dari harga sungguhan, karena harga bab berbeda-beda
(1.500 · 1.800 · 2.000) dan persentase yang dipatok akan meleset. Gerbang ini
layar uang — angka yang meleset di sini ditagih pengguna belakangan.

Pilihan yang tidak mencakup bab apa pun, atau yang tidak lebih murah daripada
membeli satuan, **tidak dikirim sama sekali**: "beli 10 bab" pada cerita yang
tinggal dua bab terkunci adalah tawaran yang menipu.

### Gerbangnya sendiri · FR-READ-06

Naskah bab terkunci **tidak dirender sama sekali** — yang buram hanyalah
pratinjau dua paragraf yang memang dikirim server, dan ia `aria-hidden`: mata
melihat ada teks di baliknya, pembaca layar tidak dibacakan potongan kalimat
yang tidak lengkap.

### Saldo kurang · FR-READ-17

**Lembar, bukan toast.** Toast hilang sebelum sempat dibaca, sementara yang
perlu disampaikan ada empat: berapa kurangnya (angka pastinya, bukan harga
penuhnya), berapa saldonya sekarang, ke mana mengisinya, dan bahwa **tidak ada
koin yang terpotong**. Tombol "Isi koin" membawa `?return=&chapter_id=&need=`,
jadi setelah mengisi — atau setelah membatalkannya — pembaca mendarat kembali
di bab yang sama.

### Iklan · FR-READ-18

Hitung mundur, dan **`onFinish` dipanggil dari timer, bukan dari `onClick`**.
Itu yang membuat aturannya benar secara konstruksi: membatalkan di detik ketiga
tidak mengambil apa pun — tidak babnya, tidak kuotanya. Kuota hidup di server
per `(pengguna, tanggal)` dengan tanggal dari **zona waktu pengguna**: kuota
harian yang berganti pukul tujuh pagi WIB bukan kuota harian.

### Satu perbaikan struktur

`useStory` naik ke `src/hooks/` — ruang baca memakainya juga (bilah atasnya
perlu judul dan jumlah bab), dan `features/*` tidak boleh saling impor. Impor
lintas fitur itu sudah sempat masuk di langkah sebelumnya; sekarang dibetulkan.

**Verifikasi:** `npm run check` bersih, **195 test lulus** (184 → 195), `npm run
build` berhasil. `todo.md`: 243 → 258 tugas dicentang. Sisa Fase 5: auto-unlock,
TTS, slot iklan dalam bab, dan navigasi antar bab.

---

## 2026-09-01 · Langkah 16 — Fase 5, seperempat kedua

> "oke lanjutkan lagi 1/4 berikutnya dari fase 5"

Tiga belas tugas: modul voucher (**5a selesai**) dan kerangka ruang baca.

### Voucher · FR-DETAIL-09 · FR-DETAIL-10 · FR-RWD-06

- **Voucher yang dimiliki ada di atas kolom kode**, dan bisa dipakai tanpa
  mengetik apa pun — mengetik ulang kode yang sudah ada di akun sendiri adalah
  pekerjaan yang tidak seorang pun minta.
- Menukar lalu memakai adalah dua panggilan server yang **terlihat sebagai satu
  aksi**: pengguna yang baru mengetik kode tidak punya alasan menekan tombol
  kedua untuk memakai apa yang baru ia tukar.
- Lembar direset tiap kali dibuka, fokus setelah 150 ms (memfokuskan di tengah
  transisi membuat sebagian peramban menggulir halaman di belakangnya), kode
  maksimal 20 karakter dan tidak peka huruf besar-kecil.
- **Kode salah tidak menutup lembarnya**, dan getarnya bisa terjadi berulang:
  kelasnya dilepas dulu lalu dipasang lagi lewat `requestAnimationFrame`. Tanpa
  itu kode salah kedua kali tidak bergetar sama sekali.
- Pesan suksesnya dinamis — "Bab 4–5" saat lebih dari satu, "Bab 4" saat satu —
  dengan confetti 36 partikel yang dibersihkan setelah 3.400 ms.

Satu koreksi aturan di server: **`firstN` menghitung bab pertama cerita**, bukan
bab berbayar pertama. "5 bab pertama gratis" pada cerita yang tiga bab awalnya
memang gratis berarti dua bab yang terbuka, bukan lima. Versi pertama saya
membalik urutannya dan memberi lima — ketahuan lewat testnya.

### Kerangka ruang baca · FR-READ-01 sampai FR-READ-06

- `stores/readerSettings.ts` dengan kunci `novelova-reader-settings-v1` dan isi
  objek datar seperti prototipe. Ukuran huruf **dijepit 16–22**, bukan ditolak.
- **`applyReaderSettings()` dipanggil di `main.tsx` sebelum React merender apa
  pun.** Tanpa itu pembaca bertema gelap melihat kedipan putih tiap membuka
  aplikasi — dan kedipan itu paling menyakitkan justru bagi orang yang memilih
  tema gelap karena membaca di tempat gelap.
- Bilah atas lima bagian: kembali · judul dan posisi bab · saldo · dengarkan ·
  pengaturan, tanpa nav bawah. Bilahnya dirender **halaman**, bukan
  `ReaderLayout`, karena hanya halaman yang tahu bab mana yang sedang dibaca.
  Tombol "dengarkan" sudah di tempatnya tetapi nonaktif sampai TTS ada, supaya
  susunan bilah tidak bergeser saat ia hidup nanti.
- Teksnya Georgia lewat `--nv-font-read`, ukurannya dari `--reader-font-size` di
  elemen akar, lebarnya dijepit **68ch** — baris yang lebih panjang membuat mata
  kehilangan awal baris berikutnya, dan itu terasa sebagai "susah dibaca" tanpa
  pembacanya tahu kenapa.
- Panel pengaturan memakai atribut **`hidden`**, jadi saat tertutup ia benar-benar
  hilang dari pohon aksesibilitas. Klik di dalamnya tidak menutup, dan di
  `≥1024` ia menempel sebagai sidebar kanan alih-alih menutupi teks.

### Tiga hal yang muncul saat mengerjakan

- **`getChapter`**: pratinjau selalu dikirim, isi lengkap **hanya** bila babnya
  dimiliki. Mengirim seluruh naskah lalu menyembunyikannya di CSS berarti isi
  berbayar ada dalam jangkauan siapa pun yang membuka panel jaringan.
- **`getWallet` + `hooks/useWallet`**: bilah baca menampilkan saldo, dan satu
  kunci cache membuat semua tampilan saldo di layar itu sepakat (FR-WALLET-17).
- **`Switch` dan `Slider` akhirnya punya nama aksesibel.** `<label>` tidak
  menamai `<button>`, jadi selama ini setiap sakelar tanpa `hideLabel` tidak
  punya nama sama sekali bagi pembaca layar. Ketahuan karena testnya mencarinya
  lewat nama.

**Verifikasi:** `npm run check` bersih, **184 test lulus** (169 → 184), `npm run
build` 57 entri precache. `todo.md`: 227 → 243 tugas dicentang. **5a nol sisa**;
sisa 5b: gerbang bab terkunci, buka dengan koin atau iklan, TTS, navigasi bab.

---

## 2026-09-01 · Langkah 15 — Fase 5, seperempat pertama

> "oke lanjutkan fase 5 dengan mengerjakan todo sebanyak 1/4"

Tujuh belas tugas teratas dari 67 — seluruh halaman detail cerita kecuali
voucher.

### Katalog akhirnya punya bab

Sebelum ini hanya `s1` yang punya baris bab (delapan), sementara statistiknya
mengaku 120. Halaman detail yang mengaku punya 120 bab lalu menampilkan delapan
terbaca sebagai kerusakan, jadi bab kini dibangkitkan untuk **seluruh katalog**
dari `stats.chapterCount` masing-masing — sekitar 1.300 baris. Delapan bab
kanvas tetap apa adanya: judulnya, durasi bacanya, dan **harga per babnya** yang
memang berbeda-beda (0 · 1.500 · 1.800 · 2.000). Tiga bab pertama tiap cerita
gratis, karena itu pola pancingan yang dipakai requirement dan yang membuat
gerbang bab terkunci bisa dicoba tanpa koin.

### Lima handler baru

`getStory` · `getChapters` · `toggleFollow` · `redeemVoucher` · `applyVoucher`.
Dua hal yang menentukan bentuknya:

- **Status kunci datang dari `Ownership`, bukan dari harga.** Bab berbayar yang
  sudah dibeli tetap terbuka setelah muat ulang, di perangkat mana pun — dan itu
  satu-satunya alasan tabel kepemilikan ada.
- **Cakupan voucher dihormati server**: yang dikembalikan daftar `chapterId`
  yang benar-benar berhak, bukan seluruh bab cerita itu (memperbaiki PRD 04
  §7 #3).

### Simpan ≠ Ikuti · FR-DETAIL-13

Dua tombol terpisah di atas satu baris `LibraryEntry`: `removed` menandai
koleksi, `notify` menandai follow. Menyimpan menyalakan follow; melepas follow
**tidak** mengeluarkan cerita dari koleksi. Ketiganya diuji, karena aturan ini
justru yang paling mudah rusak diam-diam.

Perubahannya **optimistis dengan pengembalian** — tombolnya berubah seketika,
dan kalau server menolak keadaannya kembali persis seperti semula. Melepas
simpanan minta konfirmasi: menyimpan satu ketukan, kehilangan koleksi juga satu
ketukan bukan pertukaran yang adil.

### Daftar bab · FR-DETAIL-14

Dua puluh per muat, urutan dapat dibalik (bawaannya bab pertama dulu — pembaca
baru membuka halaman ini untuk memulai), kolom pencarian yang muncul hanya bila
babnya lebih dari 20 dan menerima judul maupun nomor, tiga penanda baca per
baris, dan tombol "Lanjutkan — Bab N" yang datang dari progres tersimpan, bukan
dari tebakan.

### Satu pembetulan kecil pada requirement

FR-DETAIL-02 menyebut metrik ketiga "Followers". Yang benar-benar dihitung model
ini adalah `stats.saves`, jadi labelnya **"Disimpan"** — angka yang dikarang di
layar detail adalah janji yang akan ditagih penulis.

**Verifikasi:** `npm run check` bersih, **169 test lulus** (157 → 169), `npm run
build` berhasil. `todo.md`: 209 → 227 tugas dicentang. Sisa 5a: modul voucher.

---

## 2026-09-01 · Langkah 14 — Fase 4 selesai

> "oke lanjutkan sisa fase 4"

Tujuh tugas terakhir. **Fase 4 nol sisa.**

### Saran sambil mengetik · FR-SRCH-03

Maksimal delapan, dan **bagian yang cocok ditebalkan dari potongan yang
dikirim server** (`matchStart`/`matchLength`) — bukan ditebak ulang di komponen
dengan `indexOf`, yang akan meleset begitu pencocokannya lebih pintar daripada
"substring persis". Urutannya cerita → penulis → tag, sama dengan urutan
kelompok hasilnya, supaya saran tidak mengajarkan urutan yang berbeda.

### Saringan & urutan · FR-SRCH-04

- Tiga penyaring (genre · status · bahasa) dan empat urutan, di bilah `sticky`
  berlatar buram yang bentuknya sama dengan halaman lihat-semua — dua bilah
  kontrol yang berbeda rupa untuk pekerjaan yang sama membuat pembaca belajar
  dua kali.
- **Saringan dipasang sebelum skor dipakai.** Mengurutkan lalu membuang membuat
  `total` menghitung cerita yang tidak pernah tampil.
- **Saringan aktif tampil sebagai pil yang bisa dilepas satu per satu.** Tanpa
  itu, satu-satunya cara membatalkan sebuah saringan adalah membuka kembali
  dropdown-nya dan mencari pilihan kosong — dan pembaca yang lupa sedang
  menyaring akan menyimpulkan katalognya yang kosong.
- **Seluruh keadaan pindah ke URL**: `?q=&genre=&status=&lang=&sort=`. Ketikan
  menulis dengan `replace` supaya tiap huruf tidak menumpuk jadi entri riwayat
  peramban, sementara pencarian yang **disengaja** (Enter, saran, riwayat, pil,
  tag) menambah satu entri — itulah yang membuat tombol kembali memulihkan
  pencarian sebelumnya, bukan huruf sebelumnya.

### Dua keadaan kosong yang berbeda sebabnya · FR-SRCH-05

- **Kosong karena saringan** menawarkan "Hapus semua saringan" lebih dulu:
  kuerinya sendiri mungkin sudah benar.
- **Kosong karena kueri** menyebut ulang kuerinya, menawarkan ejaan terdekat
  ("Maksud Anda …?", dari `lib/similar.ts`), dan menyediakan tautan ke kategori
  populer — keadaan kosong yang tidak menawarkan jalan keluar hanya memberi tahu
  pembaca bahwa ia buntu.

**Verifikasi:** `npm run check` bersih, **157 test lulus** (149 → 157), `npm run
build` 48 entri precache. `todo.md`: 202 → 209 tugas dicentang. **Fase 0–4 nol
sisa**; berikutnya Fase 5 — detail cerita & ruang baca (M1).

---

## 2026-09-01 · Langkah 13 — Fase 4, seperempat kedua

> "oke lanjutkan lagi 1/4 berikutnya dari fase 4"

Empat tugas berikutnya: gulir tak terbatas, riwayat pencarian, dan pil kata
kunci populer — yang bersama-sama mengisi layar pencarian **sebelum** ada kueri.

### Gulir tak terbatas · FR-SRCH-02

Dua puluh per muat lewat `useInfiniteQuery` + `IntersectionObserver`, dengan
skeleton di ujung daftar yang sekaligus jadi pemicunya dan tombol "Muat lagi"
untuk yang tidak menggulir sampai ujung.

**Hanya kelompok Cerita yang berpaginasi.** Penulis dan tag datang utuh di
halaman pertama: keduanya daftar pendek, dan daftar pendek yang terpotong di
tengah lalu bertambah saat digulir justru membingungkan.

### Riwayat pencarian · FR-SRCH-03

- Kunci `novelova:search-history-v1`, isinya **`string[]` polos** seperti
  tertulis di `architecture.md` §7.1 — jadi bukan `zustand/persist`, yang
  membungkus nilai dalam `{ state, version }` dan tidak akan terbaca oleh siapa
  pun yang membuka penyimpanan peramban.
- Terbaru di depan, maksimal sepuluh, tanpa duplikat, dan **perbedaan huruf
  besar-kecil bukan entri baru**. Kueri yang sama diketik dua kali naik ke atas,
  bukan menambah baris kedua.
- Isi penyimpanan yang rusak dibaca sebagai riwayat kosong, tanpa error yang
  terlihat pengguna.
- **Riwayat dicatat saat pengguna benar-benar mencari** — menekan Enter,
  riwayat, pil kata kunci, atau tag — bukan pada tiap ketikan yang kebetulan
  berhenti 300 ms. Riwayat yang berisi "r", "ro", "rom" bukan riwayat, dan itu
  diuji.
- Blok riwayat **tidak ditampilkan sama sekali** sebelum pengguna pernah
  mencari: judul "Pencarian terakhir" di atas ruang kosong menagih sesuatu yang
  belum pernah terjadi.

### Kata kunci populer

Pil dari `getTrendingQueries()`; menekannya **langsung menjalankan
pencariannya**, bukan sekadar mengisi kolom lalu menunggu ketukan berikutnya.

### Satu tugas yang ternyata sudah selesai

"Kegagalan jaringan ditangani terpisah dari hasil kosong" (P0) sudah ikut
bersama halamannya di langkah sebelumnya — dicentang sekarang, bukan dikerjakan
ulang.

**Verifikasi:** `npm run check` bersih, **149 test lulus** (137 → 149), `npm run
build` 48 entri precache. `todo.md`: 196 → 202 tugas dicentang. Fase 4 tersisa
7 tugas: saran sambil mengetik, saringan genre/status/bahasa yang ikut ke URL,
dan keadaan kosong dengan saran ejaan.

---

## 2026-09-01 · Langkah 12 — Fase 4, seperempat pertama

> "oke sekarang lanjutkan fase 4, dengam mengerjakan 1/4 dari todo.md"

Enam tugas teratas dari 24, plus tiga yang tidak bisa dipisahkan darinya.

### Pencarian di sisi seam · prd_11 §7 #1

`search` · `getSuggestions` · `getTrendingQueries` hidup di server tiruan, bukan
sebagai `filter()` di komponen. Menyaring array di klien hanya bekerja selama
seluruh katalog muat di memori; begitu katalognya lebih besar dari satu halaman,
hasilnya berbohong tanpa ada yang tahu.

Bobotnya mengikuti FR-SRCH-02: **judul > penulis > tag > genre > sinopsis**,
dengan tambahan bobot untuk judul yang **diawali** kueri. Sinopsis paling rendah
dengan sengaja — sebuah kata yang kebetulan lewat di paragraf sinopsis bukan
alasan cerita itu naik ke atas.

**Kata kunci populer diturunkan dari tag yang paling banyak dipakai katalog**,
bukan daftar yang ditulis tangan. Kata kunci yang tidak berhubungan dengan isi
katalog mengantar pembaca ke hasil kosong, dan itu diuji: tiap kata kunci yang
dikembalikan harus benar-benar menghasilkan sesuatu.

### Halaman `/cari`

- **Kolomnya sudah terfokus saat dibuka.** Halaman yang hanya berisi satu kolom
  cari lalu meminta pengguna mengetuknya dulu menambah satu ketukan tanpa alasan.
- **Debounce 300 ms di atas minimum dua huruf.** Kolomnya berubah seketika; yang
  tertunda hanya permintaannya. Aturan dua huruf ditegakkan **di kedua sisi** —
  satu huruf cocok dengan hampir seluruh katalog, dan jawabannya tidak berguna
  bagi siapa pun.
- Hasil terkelompok **Cerita · Penulis · Tag** dari satu permintaan, bukan tiga.
  Kelompok kosong tidak ditampilkan: judul "Penulis" di atas ruang kosong membuat
  pembaca mengira pencariannya rusak, padahal ia hanya tidak menemukan penulis
  dengan nama itu.
- Kartu ceritanya komponen yang sama persis dengan halaman lihat-semua, bukan
  tiruannya.
- Menekan tag **menjalankan pencarian tag itu di tempat** dan mengisi kolomnya,
  bukan berpindah ke halaman pencarian yang sama dengan kueri berbeda.
- Gagal memuat ditangani terpisah dari "tidak ada hasil" (FR-CORE-03): keduanya
  terlihat mirip di layar dan artinya berlawanan.

### Rute akar baru

`ScrollRestoration` menuntut satu tempat di seluruh aplikasi, jadi pohon rute
mendapat akar tanpa path. Kembali dari `/cari` atau dari detail cerita kini
mendarat di posisi gulir yang sama, bukan di puncak daftar yang baru saja
digulir jauh.

### Yang belum

Riwayat pencarian (`novelova:search-history-v1`), saran sambil mengetik di layar,
pil kata kunci populer, saringan genre/status/bahasa, kueri & saringan di URL,
paginasi hasil, dan keadaan kosong dengan saran ejaan. Handler-nya sudah
mengembalikan `didYouMean` dan `getSuggestions`; yang belum ada layarnya.

**Verifikasi:** `npm run check` bersih, **137 test lulus** (120 → 137), `npm run
build` 48 entri precache. `todo.md`: 185 → 196 tugas dicentang. Fase 4 tersisa
13 tugas.

---

## 2026-09-01 · Langkah 11 — Fase 3b selesai

> Lanjutan dari entri di bawah: *"setelah itu baru memulai proses code
> adjustment"*.

### Yang sekarang berlaku di beranda

Kepala tetap di tab mana pun — **Unggulan · Populer · Baru & Naik Cepat ·
Paling Banyak Dibuka** — lalu dua section generik (Tamat & Siap Dibaca · Gratis
Hari Ini) dan dua kurasi khas tabnya, ditutup Lanjut Membaca. Banner dan Lanjut
Membaca tetap tidak ikut tersaring.

Tab **Semua** memakai kurasi lintas genre: Sedang Ramai Dibicarakan · Pilihan
Pembaca Baru.

### Tiga perubahan model data

- **`Story.kind: 'fiksi' | 'kisah'`** — tab My Kisah menyaring kolom ini, bukan
  genre. Isinya tetap bergenre macam-macam, dan itu diuji: kalau "My Kisah" jadi
  genre biasa, "kisah nyata yang horor" mustahil ditulis.
- **`StoryStats.unlockCount`** — dasar Paling Banyak Dibuka. Cerita gratis
  bernilai 0, jadi ia tidak pernah nyasar ke section itu.
- **Tag jadi data sungguhan.** Kosakata tag per genre, dan tag kisah
  (`tragedi`/`komedi`) bergantian — versi pertama saya menempel pada satu nilai
  saja karena indeksnya selalu ganjil, sehingga "Kisah Pilu" kosong dan
  tersembunyi. Ketahuan saat memeriksa isi tiap tab satu per satu.

### Registry section

`api/mock/handlers/sections.ts` memetakan id → judul, aturan penyaring, dan
apakah ia punya halaman daftar. Dibaca perakit feed **dan** `getSection`, jadi
halaman lihat-semua tidak mungkin memakai aturan berbeda dari section yang baru
saja diketuk. **Id section sekaligus kata rutenya** (`/jelajah/romance-kantor`),
jadi tiap section tematik otomatis punya halaman daftarnya sendiri — tidak ada
tabel pemetaan yang harus dijaga tetap sinkron.

`SectionId` karena itu berhenti jadi enum enam nilai. Daftar yang mengunci
nilainya berarti menambah satu section kurasi menuntut perubahan kontrak.

### Dua batasan yang dipegang

- Kunci sakelar **`sec-editor` dipertahankan** walau section-nya kini "Paling
  Banyak Dibuka" — menggantinya membuang pilihan yang sudah tersimpan di
  perangkat pengguna.
- Seluruh section tematik **berbagi satu sakelar** (bekas `sec-toprom`, labelnya
  jadi "Section tematik"). Sakelar yang datang-pergi mengikuti tab bukan
  pengaturan.

### Yang ikut berubah

`?genre=` di URL jadi `?tab=` — saringan tab bukan lagi sekadar nama genre.
Dropdown "Genre" di halaman lihat-semua menulis ke parameter yang sama, jadi
saringan yang dibawa dari beranda dan yang dipilih di halaman itu adalah satu
hal, bukan dua yang bisa berselisih.

**Verifikasi:** `npm run check` bersih, **120 test lulus** (116 → 120), `npm run
build` 46 entri precache. `todo.md`: 171 → 185 tugas dicentang, **Fase 3b nol
sisa**.

---

## 2026-09-01 · Rencana Fase 3b — section per genre

> "jadi ada perubahan saya ingin di setiap genre itu ada section yang
> berhubungan tema genre tersebut… Akan tetapi saya ingin 3 section di pertama
> itu selalu ada (Populer, Baru & Naik Cepat, Pilihan Editor [diganti menjadi
> Most Unlocked]) tetap ada walaupun pindah genre"
>
> Menyusul: *"sekarang di adjust saja dulu perubahan ini di bagian todo dan
> changelog. Dan setelah itu baru memulai proses code adjustment"*

Belum ada kode yang berubah pada entri ini — yang berubah **rencananya**:
`todo.md` dapat **Fase 3b** beserta penanda baru `[PRODUK]`.

### Kenapa ini bukan tugas biasa

Ia **menimpa PRD**, dan itu perlu dicatat supaya tidak terbaca sebagai kelalaian
di kemudian hari:

| Yang tertulis di PRD | Yang berlaku sekarang |
|---|---|
| FR-HOME-04: susunan section **tetap** | Empat blok pertama tetap; ekornya berganti mengikuti tab |
| FR-HOME-04/06/10/11: **Editor's Picks** | **Paling Banyak Dibuka** — bab yang dibuka pakai koin |
| FR-HOME-03: "My Kisah" satu dari tujuh genre | **Bukan genre**; kisah nyata yang bisa bergenre apa pun |

### Empat keputusan, diambil lewat pertanyaan langsung

1. **Section tematik = 2 generik + 2 kurasi.** Dua section yang sama di semua tab
   (Tamat & Siap Dibaca · Gratis Hari Ini) plus dua yang khas genre itu — tiap
   tab punya wajah sendiri tanpa harus menulis daftar panjang untuk tujuh genre.
2. **"My Kisah" jadi kolom `kind: 'fiksi' | 'kisah'`**, tegak lurus dengan genre.
   Itu satu-satunya bentuk yang membuat "kisah nyata yang horor" mungkin — dan
   contoh itu datang dari pertanyaannya sendiri.
3. **"Paling Banyak Dibuka" dihitung dari bab yang dibuka pakai koin.** Angka
   ekonomi yang jujur dan langsung berhubungan dengan pendapatan penulis, bukan
   proxy yang kelihatan ramai.
4. **Tab "Semua" memakai kurasi umum lintas genre** — Sedang Ramai Dibicarakan ·
   Pilihan Pembaca Baru.

### Dua hal yang saya putuskan sendiri

- Labelnya **"Paling Banyak Dibuka"**, bukan "Most Unlocked": UI berbahasa
  Indonesia (keputusan #3), dan itu akan jadi satu-satunya judul section
  berbahasa Inggris kalau dibiarkan.
- Kunci sakelarnya tetap **`sec-editor`** walau namanya berubah — menggantinya
  membuang pilihan yang sudah tersimpan di `home_section_visibility_v1` milik
  pengguna. Rute lihat-semuanya yang berubah: `/jelajah/pilihan` →
  `/jelajah/terbuka`.

### Satu batasan yang diusulkan dan diterima

**Section tematik tidak punya sakelar sendiri** di popover. Sembilan sakelar
tetap mengurus blok tetap saja; kalau tidak, daftar sakelarnya ikut berubah tiap
ganti tab dan tumbuh jadi puluhan.

### Pekerjaan terbesarnya bukan di UI

Tag cerita harus jadi data sungguhan lebih dulu: keempat puluh cerita contoh
sekarang bertag identik (`slow burn`, `chemistry`, `plot twist`), dan section
kurasi di atasnya akan menghasilkan delapan section yang isinya sama persis.
Sebagian cerita juga perlu bermonetisasi **gratis**, kalau tidak "Gratis Hari
Ini" selalu kosong dan karena itu selalu tersembunyi.

---

## 2026-09-01 · Langkah 10 — Fase 3 selesai

> "oke sekarang selesaikan semua sisa todo di fase 3"

Delapan tugas terakhir. **Fase 3 nol sisa.**

### Kontrol lihat-semua yang benar-benar bekerja · FR-HOME-11 · FR-HOME-14

- Pilihan urutan, chip, dan dua penyaring **berbeda per kategori**, persis tabel
  FR-HOME-11, dan seluruhnya duduk di satu berkas (`browseConfig.ts`) — menambah
  kategori berarti menambah satu baris, bukan menyunting empat komponen.
- Chip pada Pilihan Editor bukan periode melainkan **jenis kurasi** (Karya
  terbaik · Hidden gem · Penulis baru · Pilihan bulan ini), dan tiap aturannya
  bisa dijelaskan ke pembaca: chip yang menyaring dengan cara yang tidak bisa
  diterangkan sama saja dengan chip yang tidak berfungsi.
- **Seluruh keadaan saringan ada di URL.** Komponen kontrolnya tidak menyimpan
  apa pun; itu yang membuat tombol kembali peramban memulihkan saringan
  sebelumnya dan tautan hasil saringan bisa dikirim ke orang lain.
- Dua urutan menuntut angka yang belum ada: "Pertumbuhan tercepat" dan "Paling
  banyak dikomentari". `StoryStats` dapat `weeklyReads` dan `commentCount` —
  urutan tidak bisa dibangun di atas kalimat `'+24rb pembaca minggu ini'`.

### Simpan, bagikan, sembunyikan · FR-HOME-14

- Tombol **"+ Simpan"** per kartu memanggil aksi yang sama dengan Add to Library
  dan berubah jadi "Tersimpan". Id yang sudah tersimpan diambil **sekali untuk
  seluruh daftar**: dua puluh kartu tidak berarti dua puluh permintaan.
- **Aksi geser** menyingkap Simpan · Bagikan · Sembunyikan. Laci yang sama
  dibuka tombol **Aksi** — aksi yang hanya bisa dijangkau dengan jari tidak ada
  bagi pengguna papan tik.
- **Bagikan** memakai Web Share API bila ada, jatuh ke papan klip bila tidak.
- **Sembunyikan** disimpan di server (`ReaderPrefs.hiddenStoryIds`), bukan di
  perangkat: yang sudah ditolak sekali tidak boleh muncul lagi hanya karena
  pengguna berganti ponsel. Cerita itu hilang dari beranda **dan** dari seluruh
  halaman lihat-semua.

### Muat bertahap dan progres

- Infinite scroll 20 per muat lewat `useInfiniteQuery` + `IntersectionObserver`,
  dengan kartu skeleton di ujung daftar yang sekaligus jadi pemicunya — plus
  tombol "Muat lagi" untuk yang tidak menggulir sampai ujung.
- Romansa Teratas kini menampilkan **baris progres**, datanya dari `listProgress()`:
  satu permintaan untuk seluruh daftar, bukan satu per kartu.
- Kolom pencarian pintasan berupa **tautan** ke `/cari`, bukan kotak cari kedua
  yang perilakunya berbeda dari halaman pencarian.

### Satu penyimpangan yang disengaja

Rencananya menyebut grid **2/3/4 kolom**; yang dibangun **1/2/3**. Barisnya
memakai anatomi kanvas (sampul 66px + judul + penulis + meta + tombol simpan),
dan dua kolom di layar ponsel menyisakan sekitar 180px per baris — tidak satu
pun dari itu muat.

**Verifikasi:** `npm run check` bersih, **116 test lulus** (109 → 116), `npm run
build` 46 entri precache. `todo.md`: 163 → 171 tugas dicentang. **Fase 3 nol
sisa**; berikutnya Fase 4 — pencarian katalog.

---

## 2026-09-01 · Langkah 9 — Fase 3: lihat-semua, FAB, dan katalog 40 cerita

> "oke sekarang lanjut lagi di fase 3 dan kerjakan dulu sebanyak 1/4 di todo"
>
> Menyusul di tengah pengerjaan: *"untuk cerita di setiap section saya ingin
> tampilkan sebanyak 20 setiap section. supaya jika dilihat di dekstop tidak ada
> space kosong"*

### Dua puluh cerita per section — dan katalog yang cukup untuk mengisinya

Menaikkan batas dari 6 ke 20 saja tidak menyelesaikan apa pun: seed hanya punya
delapan cerita, jadi barisnya tetap setengah kosong. Katalog contoh diperluas
jadi **40 cerita**. Delapan pertama tetap persis dari `novelova-data.js` —
itulah yang membuat perbandingan dengan kanvas jujur — dan 32 sisanya pengisi
dengan angka yang **diturunkan dari indeks, bukan diacak**, supaya seed
menghasilkan urutan yang sama setiap kali dijalankan.

### Lihat semua · `/jelajah/:kategori` · FR-HOME-10 · FR-HOME-15

- Empat kategori: `populer` · `terbaru` · `pilihan` · `romance`, judul dan
  jumlah cerita yang eksplisit, dan grid 2/3/4 kolom — kecuali Romansa Teratas
  yang memakai daftar vertikal seperti di beranda.
- **Aksennya rose-gold untuk keempatnya.** Prototipe memberi tiap halaman warna
  sendiri (teal, perunggu); FR-HOME-15 memakai kedatangan halaman keempat
  sebagai kesempatan menyeragamkannya, dan tiga aksen berbeda untuk tiga daftar
  yang bentuknya identik memang hanya membuat produk terasa seperti tiga produk.
- Genre aktif dari beranda ikut lewat `?genre=` — pembaca tidak kehilangan
  penyaring yang baru saja ia pilih.

### `getSection` berpaginasi

Urutan bawaannya **sama persis** dengan section beranda, termasuk favorit
onboarding: halaman lihat-semua yang urutannya berbeda dari section yang baru
saja diketuk terbaca sebagai kesalahan, bukan sebagai halaman lain. Urutan
pilihan pembaca (`sort=rating|reads|saved|updated`) mengalahkan favorit, sama
seperti tab genre mengalahkannya di beranda. `total` dihitung dari seluruh hasil,
bukan dari halaman yang sedang tampil — penghitung "40 cerita" harus jujur walau
yang terlihat baru 20.

### FAB isi koin · FR-HOME-08

Mengambang di atas bilah bawah pada HP, dan **menjadi tombol biasa di sidebar**
pada `≥1024` — di layar lebar tidak ada bilah bawah untuk ditumpangi, dan
tombol mengambang di sudut layar besar hanya menutupi konten. Disembunyikan saat
pengguna sudah berada di `/koin`; konten diberi `pb-36` supaya baris terakhir
tidak tertutup FAB maupun nav.

### Yang tidak dikerjakan

Kontrol urut/saring lihat-semua beserta chip periode (FR-HOME-14), tombol
"+ Simpan" per kartu, aksi geser, kolom pencarian pintasan, dan infinite scroll.
Satu tugas nyaris selesai: kategori `romance` sudah punya rute dan tata letak
vertikalnya — yang tersisa hanya baris progres, dan itu menunggu progres baca
ikut di muatan daftar.

**Verifikasi:** `npm run check` bersih, **109 test lulus** (103 → 109), `npm run
build` 44 entri precache. `todo.md`: 158 → 163 tugas dicentang. Fase 3 tersisa
8 tugas.

---

## 2026-09-01 · Gambar beranda dari `sample_data/`

> "oke di home content tolong di mock api untuk banner dan home content
> gambarnya load data json di folder sample_data… gunakan dari situ aja"

Dua berkas, dua peran, dan sengaja **tidak** ditukar:

| Berkas | Isi | Dipakai |
|---|---|---|
| `new_kbm_main.content_data.json` | 100 sampul potret | `Story.coverUrl` — kartu cerita |
| `new_kbm_main.media.json` | 20 gambar lanskap | `Story.bannerUrl` — banner unggulan |

`Story` karena itu dapat kolom baru **`bannerUrl`**. Sampul 2:3 yang dipakai
sebagai banner harus dipotong sampai judulnya sendiri hilang — dan berkas kedua
memang berisi gambar lanskap, jadi memisahkannya bukan tambahan, melainkan
membaca data yang diberikan apa adanya.

- `src/api/mock/sampleImages.ts` mengimpor keduanya **sebagai modul**, bukan
  `fetch`: seed harus siap sebelum permintaan pertama dijawab. Karena hanya
  `api/mock` yang mengimpornya, keduanya tidak ikut ke bundel mode `http`.
- Pemasangannya **berputar** (`index % pool.length`), bukan acak. Seed yang
  menghasilkan gambar berbeda tiap kali dijalankan membuat perbandingan visual
  antar sesi tidak berarti. Karya penulis digeser sejauh panjang katalog supaya
  tidak memakai sampul yang sama.
- Bentuk JSON-nya dibaca apa adanya (`[{ data: [{ cover_img: { url } }] }]` dan
  `[{ url }]`), dengan entri tanpa `url` dilewati — berkasnya bisa diganti kapan
  saja tanpa menyunting kode.
- `SEED_VERSION` naik ke 3, jadi database lama ditulis ulang saat aplikasi dibuka.

Satu tambahan yang tidak bisa dihindari: judul banner berdiri **di atas gambar**,
jadi kontrasnya tidak lagi ditentukan tema. Dua token baru — `--nv-scrim`
(gradien gelap) dan `--nv-on-scrim` (teks terang) — nilainya sama di tema terang
maupun gelap, karena yang menentukan kontras di sana gambarnya.

Tidak ada CSP maupun aturan service worker yang menghalangi gambar lintas domain
ini, dan `.dockerignore` tidak membuang `sample_data/` — keduanya sudah diperiksa.

**Verifikasi:** `npm run check` bersih, **103 test lulus** (101 → 103; dua test
baru memastikan setiap cerita memakai gambar dari berkas contoh, dan banner tidak
pernah memakai sampul potret), `npm run build` 42 entri precache.

---

## 2026-09-01 · Langkah 8 — Fase 3, seperempat berikutnya

> "oke sekarang lanjut ke fase 3 kerjakan dulu sebanyak 1/4 di todo"

Lima tugas dari 18 yang tersisa — yang membuat beranda **lengkap**: banner,
iklan, dan pengaturan section beserta penyimpanannya. Satu tugas di urutan
teratas sengaja dilewati: `getSection` berpaginasi tidak punya pemakai sampai
halaman lihat-semua ada, jadi ia ikut chunk itu.

### Banner unggulan · FR-HOME-02

Tiga kartu, scroll-snap horizontal, `aria-label` pada wadahnya. **Seluruh kartu
satu `Link`**, dan "Baca sekarang" adalah label di dalamnya — bukan tombol
kedua. Prototipe memakai dua handler bertumpuk dan karena itu butuh
`stopPropagation()` supaya tidak berpindah dua kali; dengan satu tautan,
masalahnya tidak pernah ada. Tombol di dalam tautan juga bukan HTML yang sah.

### Dua slot iklan · FR-HOME-05

`AdSlot` dapat dua varian baru: `slim` (satu baris + ajakan, setelah Populer)
dan `native` (menyerupai kartu cerita, setelah Pilihan Editor). Keduanya
`<aside>` bernama "Konten bersponsor" supaya pembaca layar bisa melewatinya, dan
keduanya ikut kontrol visibilitas — pengguna boleh mematikan iklan.

### Pengaturan section · FR-HOME-06 · FR-HOME-16

- Popover sembilan sakelar, **menyimpan seketika** tanpa tombol Simpan.
- **Kesembilan pilihan selalu ada**, termasuk blok yang sedang kosong dan karena
  itu tidak tampil di beranda. Daftarnya statis, bukan diturunkan dari isi feed:
  sakelar yang menghilang saat datanya kebetulan kosong terbaca sebagai
  pengaturan yang hilang.
- `stores/homeSections.ts` ditulis tangan, **bukan** `zustand/persist`. Kuncinya
  `home_section_visibility_v1` byte-exact dari prototipe supaya pilihan pengguna
  lama ikut pindah — dan persist membungkus nilai dalam `{ state, version }`,
  bentuk yang tidak akan terbaca oleh peta datar yang sudah tersimpan. Hasil
  parse digabung di atas default (blok baru otomatis tampil), JSON rusak kembali
  ke default tanpa error yang terlihat, kegagalan menulis ditelan diam-diam.
- Dua penyaring kini bertumpuk di beranda, dan artinya berbeda: **server**
  membuang section yang kosong, **pengguna** membuang section yang tidak ia
  inginkan.

### Dua koreksi pada pekerjaan langkah sebelumnya

- **Judul section jadi Bahasa Indonesia** — Unggulan · Populer · Baru & Naik
  Cepat · Pilihan Editor · Romansa Teratas · Lanjut Membaca. PRD menuliskannya
  dalam bahasa Inggris karena prototipe begitu, tetapi kanvas yang menentukan
  copy dan keputusan #3 menetapkan UI berbahasa Indonesia.
- **Urutan section diperbaiki**: Lanjut Membaca adalah **penutup**, sesuai tabel
  FR-HOME-04 dan kanvas. Langkah sebelumnya menaruhnya di urutan kedua.

**Verifikasi:** `npm run check` bersih, **101 test lulus** (95 → 101), `npm run
build` 42 entri precache. `todo.md`: 148 → 156 tugas dicentang. Fase 3 tersisa
12 tugas: FAB top-up, `getSection`, dan halaman lihat-semua.

---

## 2026-09-01 · `baseUrl` dibuang dari tsconfig

> "kenapa di file tsconfig.json terdapat baris code error pada `baseUrl` —
> Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0…"

Bukan kesalahan konfigurasi kita: TypeScript menandai `baseUrl` sebagai usang.
Ia dulu menjadi dasar resolusi *bare specifier*, dan itu cara lama yang tidak
lagi cocok dengan `moduleResolution: "bundler"`. Sejak TS 4.1, `paths` bisa
berdiri sendiri — targetnya dihitung relatif terhadap letak `tsconfig.json`.

`baseUrl` dihapus, dan target `paths` diberi awalan `./` (tanpa `baseUrl`,
TypeScript menolak path non-relatif — `TS5090`):

```json
"paths": { "@/*": ["./src/*"] }
```

Tidak ada satu pun impor yang berubah: seluruh berkas memakai `@/` atau path
relatif, tidak ada yang mengandalkan resolusi dari akar proyek. Alias Vite di
`vite.config.ts` memang terpisah dan tidak tersentuh.

**Verifikasi:** `npm run check` bersih, 95 test lulus, `npm run build` berhasil.

---

## 2026-09-01 · Langkah 7 — Fase 2 nol sisa, dan bagian Fase 3 yang memakainya

> "oke sekarang lanjutin fase 3, tetapi fase 2 kan ada yang belum dikerjakan,
> dibagian Genre terpilih memengaruhi urutan section beranda… nah sekarang
> kerjakan fase 2 bagian itu dan fase 3 yang berhubungan dengan itu"

### Dua requirement PRD yang bertabrakan — dan bagaimana diselesaikan

FR-AUTH-11: *"genre terpilih memengaruhi **urutan section** beranda"*.
FR-HOME-04: *"urutan section bersifat **tetap** dan tidak dapat diubah pengguna"*.

Yang menyelesaikannya kriteria penerimaan FR-AUTH-11 sendiri: *"beranda
menampilkan section yang **mengutamakan** genre tersebut"* — yang diutamakan
isinya, bukan posisi section-nya. Jadi favorit onboarding bekerja di **dua
tempat**: urutan tab genre (favorit di depan) dan isi tiap section (cerita
bergenre favorit naik ke depan, tanpa membuang yang lain). Susunan section tetap.
Dicatat di `architecture.md` §1.6. **Kalau yang dimaksud memang menggeser urutan
section-nya, bilang saja — perubahannya kecil dan terpusat di satu fungsi.**

### Beranda · FR-HOME-01 · 04 · 07 · 13 · 16

- **`getHomeFeed(genre?)`** — enam section berurutan tetap: Banner · Continue
  Reading · Popular · New & Trending · Editor's Picks · Top Romance.
- **Genre menyaring empat section**, dan **banner serta Continue Reading tidak
  ikut**: yang pertama kurasi editorial, yang kedua bacaan pribadi pembaca.
  Menyaring Continue Reading berarti menyembunyikan bacaan pengguna sendiri
  karena ia menekan sebuah tab.
- Penyaringan **di server**, bukan `filter()` di klien — yang kedua berbohong
  begitu katalognya lebih besar dari satu halaman.
- **Section kosong tidak dikirim sama sekali**; judul di atas ruang kosong
  terbaca sebagai kerusakan, bukan sebagai hasil nol. Saat tidak ada satu pun
  section discovery yang tersisa, beranda menampilkan keadaan kosong bervarian
  `no-results` — bukan `FailureNotice`.
- **Top Romance tetap Romance** walau tab lain aktif: penyaring mempersempit
  section, bukan mengganti isinya. Romance × Fantasy yang kosong berarti
  section-nya hilang — persis kriteria FR-HOME-13.
- Tab genre dengan fade tepi yang muncul **hanya bila deretnya benar-benar bisa
  digulir**, `?genre=` di URL (tidak tersimpan antar kunjungan, tetapi tombol
  kembali dan tautan yang dibagikan tetap membawa saringannya), dan genre aktif
  ikut ke tautan "See all".
- **Continue Reading hilang penuh bagi pengguna tanpa riwayat baca** (FR-HOME-16).

### Yang muncul saat mengerjakan

- **`SectionId` diperbaiki.** Daftar lama (`baru-terbit`, `tamat`,
  `gratis-hari-ini`, `rekomendasi`) memakai kosakata halaman lihat-semua, bukan
  blok beranda FR-HOME-06. Sekarang: enam blok yang benar-benar membawa cerita,
  dengan `/jelajah/:kategori` memetakan kata rutenya.
- **`src/hooks/`** untuk state server lintas fitur. `useReaderPrefs` dibaca dua
  fitur (onboarding menulis, beranda membaca) dan `features/*` tidak boleh saling
  impor — jadi ia naik ke atas, sama seperti komponen bersama naik ke
  `components/patterns/`. Dicatat di `architecture.md` §3.
- `HomeSection` dapat `seeAll`, dan `HomeFeed.genre` jadi `string` — kosakata tab
  beranda memuat "My Kisah" yang tidak pernah jadi genre sebuah cerita.

### Yang tidak dikerjakan

Sisa Fase 3 yang tidak berhubungan dengan genre: banner carousel (FR-HOME-02),
dua slot iklan (FR-HOME-05), popover pengaturan section (FR-HOME-06), FAB
top-up, `getSection` berpaginasi, dan seluruh halaman lihat-semua. Ikon
pengaturan di header sengaja nonaktif sampai popover-nya ada.

**Verifikasi:** `npm run check` bersih, **95 test lulus** (83 → 95), `npm run
build` 41 entri precache. `todo.md`: 134 → 148 tugas dicentang. **Fase 2 nol
sisa**; Fase 3 tersisa 18 tugas.

---

## 2026-09-01 · Langkah 6 — Fase 2 selesai

> "oke sekarang selesaikan semua fase 2"

Sebelas tugas terakhir Fase 2. **Satu tidak bisa diselesaikan di sini** —
dijelaskan di bawah.

### Daftar · `/daftar` · FR-AUTH-05/06/07

- Empat kolom (nama tampilan · email · **HP opsional** · kata sandi), validasi
  berurutan yang berhenti pada kesalahan pertama, dan **persetujuan diperiksa
  paling akhir**: pengguna tidak diminta menyetujui ketentuan untuk formulir
  yang ternyata belum sah.
- Persetujuan ikut ke server sebagai `acceptedTerms`, bukan sekadar centang di
  layar yang dibuang setelah submit — dasar hukum pemakaian data tidak boleh
  hanya hidup di DOM.
- **Meter kekuatan kata sandi**: empat kriteria independen, lima warna, lima
  label, lebar `skor × 25%`. Warnanya token `--nv-strength-0..4`. Meter ini
  **informasional** — yang memblokir submit tetap hanya panjang minimum.

### Lupa sandi · `/lupa-sandi` · FR-AUTH-08

Indikator tiga langkah (halaman ini menjalankan yang pertama), catatan keamanan
15 menit, dan tombol yang **tidak pernah menolak** — termasuk saat kolomnya
kosong, yang memakai frasa pengganti "kontak akunmu". Menjawab *"email itu tidak
terdaftar"* memberi tahu siapa pun akun mana yang ada, dan pengguna yang salah
ketik tetap tidak tertolong olehnya.

### Onboarding · `/mulai` · FR-AUTH-11

- Tiga langkah, **seluruhnya dapat dilewati**, dengan "Lewati" terlihat di
  setiap langkah — onboarding yang tidak bisa ditinggalkan di tengah adalah
  dinding, bukan perkenalan.
- **Langkah 1** genre 1–5 dari `GENRE_TABS`. Daftar ini **bukan** `GenreSchema`:
  "My Kisah" adalah tab pembaca dan tidak pernah jadi genre sebuah cerita.
  Menyatukan keduanya berarti salah satunya harus berbohong.
- **Langkah 2** bahasa & wilayah, nilai awal dari perangkat (`navigator.language`
  dan zona waktu), disimpan ke `LocaleSettings` — penyimpanan yang **sama**
  dengan halaman pengaturan, supaya keduanya tidak pernah berbeda.
- **Langkah 3** tiga rekomendasi berdasarkan genre terpilih, dengan aksi simpan
  ke perpustakaan. Selalu tiga, termasuk saat genre dilewati: pengguna yang
  melewati tidak boleh mendapat layar kosong.
- **Hanya sekali**, dan penandanya `ReaderPrefs.onboardedAt` **di server**.
  Penanda di peramban berarti pengguna mengulangi onboarding di setiap perangkat
  baru. Melewati dan menyelesaikan sama-sama menandainya selesai.

### OAuth · FR-AUTH-04

Dua tombol di `/masuk` saja (di situlah kanvas dan PRD menempatkannya). Warna
merek jadi token `--nv-brand-google` dan `--nv-brand-facebook` — satu-satunya
warna di `tokens.css` yang bukan milik Novelova, dan tetap di sana karena
aturannya tidak mengenal pengecualian. Aksinya stub, dan **dinyatakan apa
adanya** di layar alih-alih membuka jendela yang tidak akan pernah kembali.

### Yang muncul saat mengerjakan

- Kontrak `RegisterInput`, `ReaderPrefs`, `ResetRequest`; tabel Dexie
  `readerPrefs` (versi 2, bukan menyunting versi 1 — peramban yang sudah
  memegang database lama harus bisa ikut naik).
- Handler `getLocaleSettings` · `setLocaleSettings` · `toggleLibrary` ditulis
  lebih awal: onboarding langkah 2 dan 3 memerlukannya. Layar pemakainya
  menyusul di Fase 13 dan Fase 7.
- **Koreksi angka lama.** `CLAUDE.md` menyebut `NovelovaApi` punya 56 metode;
  hitungan sebenarnya 65 sebelum langkah ini dan **70** sesudahnya. Salah
  hitung, bukan perubahan cakupan — dokumennya diperbaiki.

### Satu tugas yang tidak selesai, dan kenapa

**"Genre terpilih memengaruhi urutan section beranda"** menunggu berandanya.
Preferensinya sudah tersimpan di server dan dibaca `getReaderPrefs`; yang
memakainya adalah tugas Fase 3 — *"urutan tab mengikuti favorit onboarding"*.
Tidak ada yang bisa dikerjakan lebih dulu tanpa layar beranda, dan mencentangnya
sekarang berarti `[x]` yang tidak bisa dibuktikan. Tugasnya ditandai di
`todo.md` beserta rujukan silangnya.

**Verifikasi:** `npm run check` bersih, **83 test lulus** (69 → 83), `npm run
build` 38 entri precache. `todo.md`: 120 → 134 tugas dicentang. Fase 2 tersisa
satu tugas.

---

## 2026-09-01 · Langkah 5 — Fase 2, seperempat kedua

> "oke lanjutkan lagi fase 2 dan kerjakan todo nya sebanyak 1/4"

Delapan tugas berikutnya dari 33 — semuanya soal **apa yang terjadi saat sesi
tidak berjalan mulus**, ditutup layar `/masuk` yang pertama.

### Masuk · FR-AUTH-01/02/03/09

- `/masuk` mengikuti kanvas layar 19: satu kolom identitas (email **atau** nomor
  HP), toggle "Lihat"/"Sembunyikan", "Ingat saya" **default aktif** dengan
  catatan konsekuensinya tepat di bawahnya — *"Sesi panjang dengan pembaruan
  otomatis."* vs *"Sesi berakhir saat peramban ditutup."*
- **Satu area pesan, kesalahan pertama menang**, ruangnya selalu ada supaya
  tinggi formulir tidak melompat, dan dikosongkan **sebelum** berpindah halaman.
  Ditulis tangan alih-alih React Hook Form: satu-area-pesan justru berlawanan
  dengan model error per-kolom milik RHF, dan dua kolom tidak sepadan dengan
  satu resolver.
- **Kebijakan kata sandi 8 karakter** di satu tempat (`PASSWORD_MIN`), dipakai
  kontrak Zod sekaligus formulir. PRD 02 menetapkan 6 di `login` dan 8 di
  `register`, lalu §7 #1 mencatatnya sendiri sebagai cacat — angka yang lebih
  ketat menang.
- `LoginInput.email` → `identity`. Bentuknya sengaja **tidak** divalidasi di
  klien: menebak apakah `081…` itu nomor HP atau email salah ketik hanya
  menghasilkan penolakan yang keliru.

### Tiga cara sesi gagal, tiga perlakuan berbeda

- **`AUTH-401` — lembar masuk ulang, bukan redirect.** Halaman yang sedang
  dibuka tetap utuh di belakangnya, dan menutup lembar pun tidak mengeluarkan
  siapa pun; permintaan berikutnya yang ditolak memunculkannya lagi. Itu jalan
  keluar bagi penulis yang ingin menyalin naskahnya dulu (FR-AUTH-12 ×
  FR-STUDIO-34).
- **`AUTH-429` — penahanan lima percobaan.** Dicatat per perangkat di server
  tiruan dan dicek **sebelum kredensial disentuh**: kata sandi yang benar pun
  ditolak selama penahanan. Layar penuhnya menyebut jam buka kembali, yang bisa
  dilakukan karena `ApiError` sekarang membawa `retryAt`.
- **`APP-426` — versi terlalu lama.** Layar penuh yang menggantikan seluruh
  aplikasi. Pemicunya `VITE_MIN_SUPPORTED_VERSION` atau kode `APP-426` dari
  server — **bukan** service worker seperti tertulis di rencana: SW tidak tahu
  batas minimum yang ditetapkan server. `architecture.md` §1.4 dikoreksi.

`AUTH-401` dan `APP-426` ditangani sekali di `QueryProvider`, bukan di tiap
pemanggil: keduanya berlaku untuk seluruh aplikasi sekaligus. Sisanya tetap
urusan pemanggil — hanya ia yang tahu berapa banyak halaman yang ikut mati.

### Yang lain

- `useBackNavigation` di `lib/nav.ts`, dipakai `TopBar` — satu perilaku untuk
  semua tombol kembali (FR-CORE-05). `safeNext` pindah ke sana juga, supaya
  fitur tidak perlu mengimpor dari `routes/`.
- Halaman 404 berpindah lewat router, bukan `window.location`: memuat ulang
  seluruh aplikasi demi satu tautan salah ketik membuang sesi dan cache.
- Copy tiga kegagalan sesi disamakan dengan kanvas seksi 7a, dan `FailureNotice`
  tingkat layar penuh kini memberi jaminan itu kotaknya sendiri — "Yang tetap
  aman", seperti kanvas layar 36.
- **Kontrol sesi di `/dev/kitchen-sink`**: keluar · sesi berakhir · versi
  kedaluwarsa. Tanpa itu ketiga layar tadi hanya bisa dilihat dengan menunggu
  berhari-hari — dan yang tidak bisa dilihat tidak akan pernah diperiksa.

### Yang tidak dikerjakan, dan kenapa

- **Tombol OAuth Google & Facebook** (P1). Warna mereknya (`#DB4437`, `#1877F2`)
  adalah hex di luar `tokens.css`, jadi ia butuh dua token merek lebih dulu —
  keputusan kecil yang lebih baik diambil bersama layar `/daftar` yang memakai
  tombol yang sama.
- `/daftar`, `/lupa-sandi`, onboarding `/mulai`, dan handler mock `register` ·
  `requestReset`: seperempat berikutnya.
- Konfirmasi saat **keluar** dengan draf belum tersimpan (FR-AUTH-12) menunggu
  editor bab — belum ada draf yang bisa hilang.

**Verifikasi:** `npm run check` bersih, **69 test lulus** (57 → 69), `npm run
build` 32 entri precache. `todo.md`: 102 → 120 tugas dicentang.

Dua tugas yang ikut karena satu formulir tidak bisa setengah jadi: validasi
berurutan (17) dan kebijakan 8 karakter (23). Tiga test yang dicentang (31, 32,
33) adalah cek untuk yang dibangun langkah ini, bukan pekerjaan yang dimajukan.

---

## 2026-09-01 · Langkah 4 — Fase 2, seperempat teratas

> "oke sekarang lanjutkan fase 2 dengan kerjakan 1/4 step teratas dari tood.md"

Fase 2 punya 33 tugas; seperempat teratas berarti **delapan tugas pertama** —
kerangka layar, pohon rute, penjaga rute, dan sesi. Layar `/masuk`, `/daftar`,
`/lupa-sandi`, dan onboarding **tidak** dikerjakan: itu tiga perempat sisanya.

### Sesi yang benar-benar ada · FR-AUTH-12

- **`stores/session.ts`** — tiga tempat, tiga alasan: token akses di **variabel
  modul** (memori), token refresh di **cookie `HttpOnly`** (disimulasikan sisi
  server), profil ringkas di `localStorage` (`novelova:profile-v1`) supaya nama
  dan avatar tidak berkedip kosong. Profil itu **bukan bukti sesi** — status
  baru `authenticated` setelah `refresh()` berhasil.
- **`api/mock/handlers/session.ts`** — handler mock pertama yang jalan:
  `login`, `refresh`, `logout`. Cookie refresh disimulasikan Web Storage, dan
  pemetaannya lurus: **"Ingat saya" → `localStorage`** (bertahan setelah
  peramban ditutup), **tanpa → `sessionStorage`** (mati bersama peramban).
  Kedaluwarsa 30 hari dihitung dari **pemakaian terakhir**, bukan dari saat masuk.
- **`useSessionBootstrap`** — hidrasi sekali di akar, lalu pembaruan otomatis
  60 detik sebelum token akses habis. Pembaruan yang gagal karena jaringan
  **tidak** mengeluarkan pengguna; hanya `AUTH-401` yang melakukannya. Penulis
  yang sedang mengetik tidak boleh kehilangan naskahnya karena wifi berkedip.

### Pohon rute — 41 rute, semuanya terjangkau

- `routes/index.tsx` memuat **tabel `ROUTES`**: path, judul, layout, guard —
  `architecture.md` §8 dalam bentuk data. Router membacanya, dan nanti
  pemeriksaan tautan CI membaca tabel yang sama.
- Empat layout: `AppShell` (sudah ada), **`TopBarLayout`**, **`ReaderLayout`**,
  **`AuthLayout`**. Judul bilah atas datang dari `handle` rute, jadi nama halaman
  hanya ditulis sekali.
- Rute yang layarnya belum ada memakai penampung ber-`EmptyState`, **bukan**
  `FailureNotice` — belum dibangun bukan kegagalan (FR-CORE-03).

### Penjaga rute · FR-AUTH-12 · FR-STUDIO-33

- `RequireAuth` → `/masuk?next=<tujuan asal>`; `RequireGuest` mengembalikan yang
  sudah masuk ke `next`. **`next` hanya menerima path internal** — `https://…`
  dan `//…` dibuang ke `/`, karena tujuan setelah masuk adalah tempat yang
  bagus untuk open redirect kalau dibiarkan.
- `RequireAuthor` tiga tingkat: `none` → halaman pendaftaran penulis (halaman
  itu **adalah** ajakannya), `registered` → boleh menulis, `verified` → boleh
  menyentuh uang. Yang tingkatnya kurang **tidak diusir** — hanya dijelaskan apa
  yang kurang.
- Guard-nya **komponen**, bukan `loader`: data router membuat `Request` tiap
  navigasi dan `AbortSignal` jsdom ditolak `Request` bawaan Node, jadi dengan
  loader alur ini tidak bisa diuji sama sekali. Berkasnya `guards.tsx`, bukan
  `guards.ts` seperti tertulis di rencana.

### Yang muncul saat mengerjakan

- **`getAuthorProfile`** ditulis lebih awal (`handlers/studio.ts`): tiga tingkat
  penulis tidak bisa dijawab dari `User.role` yang hanya mengenal
  `reader`/`author`. Sisa handler studio tetap di Fase 8.
- **Target build `es2022`.** `vite build` gagal begitu ada yang benar-benar
  mengimpor `api/client`: seam memilih implementasinya dengan top-level `await
  import()`, dan target bawaan Vite masih melarangnya. Ini bukan kegagalan baru,
  hanya kegagalan yang selama ini tidak pernah terpicu karena belum ada satu pun
  komponen yang memakai API.
- **Perangkat mulai dalam keadaan sudah masuk** sebagai akun contoh (Anna
  Maharani) — sekali saja, ditandai di `kv`. Tanpa itu seluruh aplikasi terkunci
  di `/masuk` yang layarnya baru dibangun langkah berikutnya. Setelah keluar, ia
  tetap keluar. Kata sandi contoh: `novelova123`.

### Yang tidak dikerjakan, dan kenapa

- **Penahanan `AUTH-429`** (5× gagal → 15 menit) ditulis bersama layar `/masuk`,
  supaya waktu buka kembali bisa langsung terlihat di layar. Tabelnya
  (`loginAttempts`) sudah ada.
- **Kotak centang "Ingat saya"** ikut layar `/masuk`; mekanismenya sudah utuh dan
  diuji lewat `api.login({ remember })`.
- **`lazy()` per modul** belum terpasang karena belum ada satu pun halaman
  sungguhan. Mekanisme dan `Suspense` fallback-nya sudah berdiri.
- Komponen di `components/` masih memakai string harfiah, bukan `t()`. Kode baru
  langkah ini memakai `t()`; menyapu yang lama sekaligus akan dilakukan saat
  layar pertama memakainya kembali — bukan sebagai perubahan tersendiri.

**Verifikasi:** `npm run check` bersih, **57 test lulus** (47 → 57), `npm run
build` menghasilkan 29 entri precache. `todo.md`: 89 → 102 tugas dicentang.

---

## 2026-08-31 · Langkah 3 — Fase 0 & Fase 1 selesai

> "oke saya ingin kamu selesaikan fase0 dan fase 1 dulu"
>
> Menyusul: *"dan jangan lupa todo anda update yang sudah dikerjakan"* — 89 tugas
> dicentang di `../todo.md`, dan Fase 0 serta Fase 1 kini nol sisa.

### Seam API — dua sisi, satu kontrak

- **`api/errors.ts`** — `ApiError { code, message, retryable }`. Lima belas kode
  yang **tampil ke pengguna** (`PAY-402`, `PAY-504`, `AUTH-429`, `PRINT-504`,
  `SCHED-409`, …) ditulis persis seperti di kanvas, supaya yang dibacakan
  pengguna ke dukungan cocok dengan log.
- **`api/contracts/`** — 10 berkas skema Zod menutupi seluruh entitas
  `architecture.md` §6.1.
- **`api/client.ts`** — antarmuka `NovelovaApi` dengan 56 metode, implementasi
  dipilih `VITE_API_MODE` lewat `import()` dinamis (mode `mock` tidak membawa
  kode `http` ke bundel).
- **`api/mock/db.ts`** — Dexie 33 tabel, indeks majemuk di tempat yang
  benar-benar disaring.
- **`api/mock/seed.ts`** — 25 koleksi dari `novelova-data.js`, dinormalkan.
- **`api/http/index.ts`** — stub `NOT_IMPLEMENTED`.
- **`i18n/id.ts` + `t.ts`** — `t('nav.home')` bertipe; salah ketik gagal compile.
- **`i18n/content.ts`** — legal, bantuan, FAQ, pilihan bahasa, kategori
  visibilitas.

### Design system — 22 komponen

Primitif `Button` · `IconButton` · `Chip` · `Badge` · `Switch` · `Slider` ·
`Tabs` · `Card` · `Skeleton` · `ProgressBar` · `Input` · `TextArea` · `Select` ·
`SearchInput` · `CharCounter` · `EmptyState` · `AsyncState` · `Modal` · `Sheet` ·
`Popover` · `Toast` · `Confetti`.

Pola `FailureNotice` · `TopBar` · `BottomNav`/`SideNav` · `StoryCard` ·
`ChapterRow` · `CoinChip` · `FilterableList` · `Scheduler` · `AdSlot` ·
`StarRating` · `SpoilerVeil` · `ReportSheet` · `ReviewStatusBadge` · `UserRow` ·
`SettingRow` · `ScoreRing` · `StageTrack` · `DangerZone`.

Plus `lib/a11y.ts` (focus trap, dismissable, scroll lock), `lib/cx.ts`,
`lib/useOptimistic.ts`, `QueryProvider`, `ErrorBoundary`, `AppShell`, pohon rute,
dan halaman **`/dev/kitchen-sink`** yang memuat semuanya dalam satu layar.

### Keputusan yang diambil

- **Skema komentar sengaja tidak rekursif.** `CommentSchema` membungkus
  `CommentBaseSchema`, jadi balasan tidak bisa punya balasan. Aturan
  `COMMENT_DEPTH_MAX = 1` ditegakkan tipe, bukan pemeriksaan runtime yang bisa
  lupa dipanggil. (TypeScript menolak versi rekursifnya — penolakannya benar.)
- **Teks legal, FAQ, dan kategori bantuan tidak masuk IndexedDB.** Itu copy,
  bukan data pengguna. Menaruhnya di database berarti menuntut migrasi setiap
  kali ada typo.
- **`withNotImplemented` melengkapi kedua sisi seam.** Handler ditulis per fase;
  yang belum ada melempar `NOT_IMPLEMENTED` **dengan nama fungsinya**, bukan
  `undefined is not a function` — dan tidak menuntut puluhan metode kosong
  hanya supaya berkasnya lolos typecheck.
- **`StarRating` memakai `<input type="radio">` sungguhan**, bukan
  `<button role="radio">`. Navigasi panah, pengelompokan `name`, dan pengiriman
  formulir jadi gratis dari peramban, dan hanya bilangan bulat yang bisa
  terkirim. Lint yang menandainya benar.
- **`DangerZone` memakai satu pola konfirmasi untuk ketiga aksinya.**
  FR-STUDIO-18 hanya mensyaratkan ketik-ulang judul untuk hapus permanen, tetapi
  mengarsipkan cerita dengan 985rb pembaca juga bukan hal yang pantas terjadi
  karena salah ketuk.
- **`useOptimistic` bukan untuk mutasi uang.** Saldo hanya berubah setelah server
  mengonfirmasi — menampilkan angka yang lalu ditarik kembali adalah cara
  tercepat membuat pengguna berhenti mempercayainya.
- **Aturan hex ditegakkan skrip, bukan Biome.** Biome tidak punya aturannya;
  `scripts/check-tokens.mjs` memindai `src/**` dan ikut jalan di `npm run check`.

### Ditemukan saat mengerjakan

- **`features/*/hooks/` di dalam blok komentar menutup komentarnya.** Urutan
  `*/` di tengah path membuat sisa berkas jadi kode. Ini gagal dengan pesan
  "Unterminated template literal" di baris terakhir — 100 baris dari
  penyebabnya. Kalimatnya ditulis ulang tanpa pola itu.
- **Data router React Router gagal bernavigasi di jsdom.** Ia membuat `Request`
  tiap navigasi, dan `AbortSignal` milik jsdom ditolak `Request` bawaan Node.
  Test `FilterableList` memakai `MemoryRouter` biasa — komponennya memang hanya
  butuh `useSearchParams`.
- **Empat temuan a11y dari lint diperbaiki, bukan dibungkam:** peran redundan di
  `<aside>` dan `<input type="search">`, serta dua pada `StarRating`.

### Diverifikasi

`biome check` bersih · `tsc --noEmit` bersih · cek token bersih · **47 test lulus**
(7 berkas) · `vite build` berhasil (precache 26 entri, 806 KiB) · rute `/`,
`/pustaka`, dan `/dev/kitchen-sink` merespons 200.

### Belum dikerjakan (Fase 2 dan seterusnya)

- Handler mock per modul — `handlers` di `api/mock/index.ts` masih kosong
- Sesi nyata, penjaga rute, layar produk
- Runtime caching service worker — tetap dijadwalkan Fase 14

---

## 2026-08-31 · Langkah 2 — konstanta produk & `lib/`

> "oke lanjutkan lagi"

### Ditambahkan

- **`lib/coin.ts`** — seluruh konstanta ekonomi koin (`COIN_RATE` 130,
  `PRICE_SINGLE`, `PRICE_BUNDLE_10`, `PRICE_FULL`, `AD_QUOTA_MAX`, `EXPIRY_MIN`,
  `WITHDRAW_MIN/FEE`, …), `calcPrice()`, dan `formatCompactCoin()`.
- **`lib/limits.ts`** — 68 batas dari requirement dalam delapan kelompok:
  paginasi · pencarian · progres baca · autosave · sosial · notifikasi · akun ·
  keadaan gagal (§1.4) · formulir cerita, cetak & jadwal (§1.5).
- **`lib/date.ts`** — `todayLocalISO()` dengan koreksi `getTimezoneOffset()`,
  plus `startOfLocalDay`, `isSameLocalDay`, `localDaysBetween`, `localTimeZone`.
- **`lib/format.ts`** — rupiah, angka, tanggal, jam, waktu relatif, kepala
  kelompok hari, dan hitung mundur kedaluwarsa. Seluruhnya `Intl` `id-ID`.
- **`lib/similar.ts`** — jarak Levenshtein dua baris + `suggest()` untuk
  *“Maksud Anda …?”* (FR-SRCH-05).
- **33 unit test** di empat berkas — seluruhnya lulus.

### Keputusan yang diambil

- **`formatCompactCoin` memotong, bukan membulatkan.** `15.390` → `"15.3rb"`,
  bukan `"15.4rb"`. Angka yang menyangkut uang tidak boleh terlihat lebih besar
  daripada aslinya — dan pemotongan sekaligus mencegah `999.999` menjadi
  `"1000rb"`.
- **Waktu relatif ditulis tangan, bukan `Intl.RelativeTimeFormat`.** ICU
  menghasilkan *“12 menit **yang** lalu”* sementara PRD menetapkan *“12 menit
  lalu”* (FR-PROF-02, FR-NOTIF-01). Itu keputusan copy, bukan locale. Sisanya
  — angka, uang, tanggal, jam — tetap `Intl`.
- **Batas hari memakai hari kalender lokal, bukan selisih 24 jam.** Sesuatu pada
  pukul 23.50 disebut “Kemarin” pada pukul 00.10, bukan “20 menit lalu”.
- **`suggest()` diam untuk kata ≤3 huruf.** Pada kata sependek itu jarak 2 sudah
  menghasilkan kata lain sama sekali; saran yang salah lebih buruk daripada tidak
  ada saran.
- **`AUTHOR_SHARE` ditandai sebagai nilai seed saja.** FR-EARN-12 mensyaratkan
  bagi hasil datang dari konfigurasi server; komentarnya melarang memakainya
  untuk menghitung penghasilan yang ditampilkan.

### Ditemukan lewat test

`Intl` menyisipkan **non-breaking space** (U+00A0) antara `Rp` dan angkanya —
sengaja, supaya “Rp” tidak tertinggal sendirian di ujung baris. Test sempat
gagal dengan pesan yang terlihat identik (`'Rp 148.000'` vs `'Rp 148.000'`).
Perilakunya dipertahankan; tesnya memakai ` ` eksplisit dan mencatat jebakan
itu, supaya perbandingan string berikutnya tidak menghabiskan waktu yang sama.

### Belum dikerjakan (menyusul)

- Kontrak Zod `api/contracts/`, `api/client.ts`, `api/errors.ts`
- Dexie `api/mock/db.ts` + seed 25 koleksi dari `novelova-data.js`
- `i18n/id.ts` — ditunda sampai ada string nyata; membuat kunci sebelum ada
  layarnya berarti menebak

---

## 2026-08-31 · Langkah 1 — fondasi proyek

> "oke sekarang waktunya untuk memulai code dari todo dan architecture.md yang sudah
> disepakati. buat folder baru novelova dan mulai code didalam project tersebut.
> siapkan git ignore dan env dan juga docker yang diperlukan. dan jangan lupa untuk
> stack yang digunakan sesuai dengan md yang telah dibuat. dibuat perstep. Buatlah
> desain nya sesuai kesepakantan dan moderen"
>
> Koreksi menyusul: *"sepertinya anda salah paham maksudnya buat nya didalam folder
> ini, tetapi create folder baru 'novelova'"* — proyek dipindahkan dari
> `C:\Novelova\novelova` ke `…\Mobile app module selection\novelova`.
>
> Dan: *"jangan lupa buat changelog dari setiap prompt saya berikan"* — berkas ini.

### Ditambahkan

- **Scaffold** Vite 6 + React 19 + TypeScript strict. `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, alias `@/` → `src/`.
- **11 dependensi runtime** persis seperti `architecture.md` §2 — tidak lebih:
  react-router · @tanstack/react-query · zustand · zod · react-hook-form ·
  @hookform/resolvers · dexie · lucide-react · @fontsource-variable/manrope ·
  @fontsource/cormorant-garamond.
- **Struktur folder lengkap** `architecture.md` §3 — 13 `features/`, `api/` dengan
  `contracts`·`mock`·`http`, `payments/`, `ads/`, `stores/`, `i18n/`, `lib/`,
  `styles/`, `tests/`. Folder kosong dijaga `.gitkeep`.
- **`src/styles/tokens.css`** — palet rose-gold PRD 01, satu-satunya tempat hex
  hidup. Termasuk dua koreksi kontras yang PRD sendiri tandai (§9.1): `--nv-muted`
  `#928582` → `#6f6462`, `--nv-coin` `#d7ad64` → `#bf8f46` (nilai asli disimpan
  sebagai `--nv-coin-icon` khusus ikon).
- **`src/styles/base.css`** — `@theme` Tailwind v4 memetakan token jadi utility
  (`bg-nv-card`, `text-nv-muted`, `rounded-nv-lg`), skala tipografi §9.2 dengan
  lantai 12px, reset, dan `prefers-reduced-motion`.
- **`vite.config.ts`** — VitePWA mode `injectManifest`, `registerType: 'prompt'`,
  manifest §10.1 lengkap dengan shortcut Perpustakaan & Isi Koin. `devOptions`
  aktif supaya service worker bisa diuji di dev.
- **`src/sw.ts`** — precache app shell + penanganan `SKIP_WAITING`.
- **`biome.json`** — lint + format, dan **aturan lint yang melarang `import 'dexie'`
  di luar `src/api/mock/`** (menjaga seam API, §5).
- **`.gitignore`**, **`.env.example`** + `.env` lokal. `.env.example` menjelaskan
  tiap variabel dan menegaskan tidak boleh berisi rahasia — seluruh isinya
  ter-bundel ke browser.
- **Docker** — `Dockerfile` empat tahap (`deps` → `dev` → `build` → `prod`),
  `docker/nginx.conf` (fallback SPA, `sw.js` & manifest tanpa cache, aset ber-hash
  cache setahun), `docker-compose.yml` dengan profil `dev` dan `prod`,
  `.dockerignore`.
- **`README.md`** — cara menjalankan + lima aturan yang tidak boleh dilanggar.
- **Halaman bukti fondasi** (`src/App.tsx`) — token warna, skala tipografi, nada
  status, tombol, dan bilah nav lima tab (Beranda · Isi Koin · Pustaka · Karya ·
  Profil, dari `NovelovaNav.dc.html`), plus sakelar terang/gelap. Bukan layar
  produk; ia ada supaya keputusan visual bisa dilihat sebelum satu fitur ditulis.

### Diverifikasi

- `tsc --noEmit` bersih · `biome check` bersih · `vite build` berhasil
  (precache 25 entri, 532 KiB) · dev server merespons HTTP 200.

### Belum dikerjakan (menyusul)

- `lib/coin.ts`, `lib/limits.ts`, `lib/format.ts`, `lib/date.ts`, `lib/similar.ts`
- Kontrak Zod, `api/client.ts`, `api/errors.ts`, Dexie + seed 25 koleksi
- Router, layout, primitif `components/ui/` — Langkah 3–4
- Runtime caching service worker (font, cover, isi bab, `offline.html`) dan toast
  "Versi baru tersedia" — dijadwalkan Fase 14, ditandai `ponytail:` di `sw.ts`
  dan `main.tsx`

---

## Sebelum kode — fase dokumen

Tiga permintaan yang menghasilkan `../todo.md` dan `../architecture.md`. Dicatat
di sini karena keputusannya mengikat seluruh kode di bawah.

### 2026-08-31 · Pembaruan desain ketiga (seksi `8a`)

> "oke update lagi todo dan architecture nya. saya ada update lagi tampilanya"

Kanvas 37 → **41 layar**; `novelova-data.js` 23 → 25 koleksi. Menutup tiga rute
Author Studio terakhir (formulir cerita, riwayat cetak, jadwal terpadu).
Dua tabrakan kanvas ⇄ PRD diputuskan: **angka dan aturan validasi ikut PRD**
(judul 100, sinopsis 1000, cover rasio meleset tetap diterima), **lini masa cetak
ikut PRD** (enam tahap + nomor pesanan), sementara empat keadaan gagal cetak dan
empat keadaan gagal jadwal yang hanya ada di kanvas menjadi pekerjaan baru.
Estimasi dikoreksi ~96–125 → **~99–129 hari** setelah salah hitung Fase 8
ditemukan (kepala fase 17–22 vs sub-bagiannya 20–26).

### 2026-08-31 · Pembaruan desain kedua

> "oke sekarang update lagi markdown nya, ada pembaruan file yang baru saya
> tambahkan dan update final"

Kanvas 23 → 37 layar. Klaster akun (8 layar) dan **seksi keadaan gagal yang
menyatakan dirinya "di luar PRD"** — kontrak copy tiga bagian (apa yang terjadi →
apakah uang/tulisanmu aman → satu tindakan) dan empat tingkat penyampaian
(inline · toast · sisipan · layar penuh). Satu koreksi rute: `/pengaturan/data`
dilebur ke `/pengaturan/keamanan`.

### 2026-08-30 · Pembaruan desain pertama & revisi PRD

> "oke saya ada pembaruan design bisa anda cek dalam folder tersebut…"
> "oke saya ada pembaruan PRD nah anda cek penambahan/update yang baru…"

Kanvas 13 → 23 layar. PRD bertambah dua modul (pencarian & notifikasi, sosial)
dan 56 requirement baru; empat di antaranya mengubah arsitektur — batas
server/perangkat (FR-CORE-01), sesi nyata dengan penjaga rute (FR-AUTH-12), empat
keadaan render sebagai kontrak (FR-CORE-02/03), dan daftar besar disaring di
server.

### 2026-08-29 · Empat keputusan pokok

Ditetapkan lewat pertanyaan langsung, dan mengikat sampai sekarang:

1. **Design system = PRD 01 rose-gold.** Kanvas dipakai untuk struktur, anatomi,
   dan copy — bukan warna. Palet Classical di `_ds/` tidak dipakai.
2. **Frontend dulu, API mock.** Satu seam bertipe kuat; ganti backend = tukar satu
   folder.
3. **Bahasa UI Indonesia saja, siap i18n.** Semua string di `src/i18n/id.ts`,
   tanpa library.
4. **Pembayaran & iklan disimulasikan, provider dapat ditukar.** Alur UI, timer
   kedaluwarsa, idempotency, dan ledger dibangun nyata — hanya panggilan ke
   penyedia yang palsu.
