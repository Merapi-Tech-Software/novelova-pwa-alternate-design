# PRD Novelova — Modul Dompet & Hadiah

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya **sama dengan v1**; yang berubah hanya kulitnya (putaran 7).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Halaman: `topup_koin.html` · `topup_detail.html` · `topup_restyled.html` · `transaction_history.html` · `rewards_center.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_topup.md`, `../../docs/api_transaction_history.md`, `../../docs/api_rewards_center.md`

---

## 1. Ringkasan Modul

Seluruh perputaran koin: cara mendapatkannya dengan uang (top-up), cara mendapatkannya gratis (hadiah), dan cara melihat ke mana perginya (riwayat). `topup_koin.html` adalah halaman terbesar kedua di aplikasi dan satu-satunya yang mensimulasikan alur pembayaran lengkap dari pemilihan sampai status akhir.

| Aspek | Nilai |
|---|---|
| **Aktor** | Pembaca |
| **Halaman** | `topup_koin` (763 baris), `topup_restyled` (545), `topup_detail` (263), `transaction_history` (107), `rewards_center` (108) |
| **Prasyarat** | Pengguna sudah masuk |
| **State persisten** | Tidak ada |
| **Sub-sistem desain** | `topup_koin`, `topup_detail`, `transaction_history`, `rewards_center` memakai klasik `fix_ui`; **`topup_restyled` memakai frame sempit gelap 360px dengan Trebuchet MS** |

### Peran tiap halaman

| Halaman | Peran |
|---|---|
| `topup_koin` | Alur beli koin tiga langkah + seluruh simulasi pembayaran — **halaman utama** |
| `topup_restyled` | Varian tampilan top-up yang jauh lebih sederhana (nominal rupiah, bukan koin) |
| `topup_detail` | Halaman status satu transaksi, ditentukan parameter URL |
| `transaction_history` | Buku besar seluruh mutasi koin |
| `rewards_center` | Jalur mendapat koin tanpa membayar: check-in, misi, referral, voucher |

---

## 2. Flow

### 2.1 Beli koin (`topup_koin`)

1. Pembaca membuka halaman; saldo saat ini dan promo aktif tampil di atas.
2. **Langkah 1 — Pilih jumlah:** pilih salah satu dari enam paket **atau** ketik jumlah koin sendiri (minimum 100).
3. Memilih jumlah membuka **Langkah 2 — Pilih metode**: e-wallet, QRIS, atau virtual account.
4. Memilih metode membuka **Langkah 3 — Ringkasan** dan mengaktifkan tombol bayar.
5. **Percabangan menurut jenis pembayaran:**
   - **E-wallet** → layar menghubungkan (1,8 detik) → layar menunggu dengan hitung mundur sesuai batas metode.
   - **QRIS** → layar QR dengan hitung mundur 30 menit.
   - **Virtual account** → layar nomor VA dengan tombol salin dan konfirmasi transfer.
6. **Akhir:** pembayaran dikonfirmasi → layar sukses (confetti + saldo baru) · hitung mundur habis → layar gagal → coba lagi atau ganti metode.
7. Dari layar sukses: **Mulai baca** → beranda, atau **Riwayat** → `transaction_history.html`.

### 2.2 Mendapat koin gratis (`rewards_center`)

Check-in harian (streak 7 hari) · menyelesaikan misi · mengundang teman lewat kode referral · menukar voucher. Setiap perolehan tercatat di riwayat klaim dan dompet.

### 2.3 Menelusuri riwayat

`transaction_history` → saring menurut jenis (isi ulang / keluar / menunggu) → buka `topup_detail` untuk melihat status dan rincian satu transaksi.

---

## 3. Daftar Requirement

| ID | Nama | Halaman | Prioritas |
|---|---|---|---|
| FR-WALLET-01 | Saldo & promo aktif | `topup_koin` | P0 |
| FR-WALLET-02 | Pilih paket koin | `topup_koin` | P0 |
| FR-WALLET-03 | Jumlah koin kustom dengan validasi | `topup_koin` | P0 |
| FR-WALLET-04 | Pilih metode pembayaran | `topup_koin` | P0 |
| FR-WALLET-05 | Ringkasan pembelian & tombol bayar | `topup_koin` | P0 |
| FR-WALLET-06 | Pembayaran e-wallet | `topup_koin` | P0 |
| FR-WALLET-07 | Pembayaran QRIS | `topup_koin` | P0 |
| FR-WALLET-08 | Pembayaran virtual account | `topup_koin` | P0 |
| FR-WALLET-09 | Hitung mundur kedaluwarsa | `topup_koin` | P0 |
| FR-WALLET-10 | Pembayaran berhasil | `topup_koin` | P0 |
| FR-WALLET-11 | Pembayaran gagal & coba lagi | `topup_koin` | P0 |
| FR-WALLET-12 | Batalkan pembayaran | `topup_koin` | P1 |
| FR-WALLET-13 | Varian tampilan isi saldo | `topup_restyled` | P2 |
| FR-WALLET-14 | Detail transaksi menurut status | `topup_detail` | P0 |
| FR-WALLET-15 | Buku besar & saring transaksi | `transaction_history` | P0 |
| FR-WALLET-16 | Ekspor kuitansi | `transaction_history` | P2 |
| FR-RWD-01 | Ringkasan hadiah | `rewards_center` | P1 |
| FR-RWD-02 | Check-in harian & streak | `rewards_center` | P0 |
| FR-RWD-03 | Misi harian | `rewards_center` | P1 |
| FR-RWD-04 | Program referral | `rewards_center` | P1 |
| FR-RWD-05 | Voucher & riwayat klaim | `rewards_center` | P1 |
| FR-WALLET-17 | **[BARU]** Dompet tunggal lintas halaman | semua | P0 |
| FR-WALLET-18 | **[BARU]** Konteks kembali setelah top-up | `topup_koin` | P0 |
| FR-WALLET-19 | **[BARU]** Riwayat → detail transaksi | `transaction_history` → `topup_detail` | P0 |
| FR-RWD-06 | **[BARU]** Voucher terpadu: miliki, pakai, tukar | `rewards_center`, `detail_story_…` | P0 |
| FR-RWD-07 | **[BARU]** Streak, kuota & klaim tersimpan | `rewards_center` | P0 |

---

## 4. Detail Requirement

## A. Beli Koin (`topup_koin.html`)

### FR-WALLET-01 — Saldo & promo aktif · P0

**Deskripsi.** Bilah atas menampilkan saldo koin saat ini, dan tepat di bawahnya spanduk promo yang sedang berjalan.

**User story.** Sebagai pembaca, saya ingin melihat saldo saya dan promo yang sedang berlaku sebelum memilih paket, agar bisa memilih yang paling menguntungkan.

**Aturan bisnis.**
- Saldo ditampilkan sebagai lencana dengan ikon koin `✦` (prototype: **240 koin**).
- **Promo aktif:** paket **500 koin mendapat bonus 50 koin** (`promoActive`, `promoCoins: 500`, `promoBonus: 50`).
- Bonus **hanya berlaku bila jumlah koin persis sama dengan `promoCoins`** — pembelian 500 lewat kolom kustom juga mendapat bonus, tetapi 501 tidak.
- Saldo di bilah atas diperbarui langsung setelah pembayaran berhasil.
- Tombol kembali menuju `home_tabs.html`.

**Hook implementasi.** `topup_koin.html:473` objek `state`; `:159` `#currentBalance`; `:168` `#promoBanner`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat bilah atas, **then** saldo koin saat ini tampil.
- **Given** halaman dimuat, **when** pembaca melihat bawah bilah atas, **then** spanduk promo bonus 50 koin untuk paket 500 tampil.

---

### FR-WALLET-02 — Pilih paket koin · P0

**Deskripsi.** Enam paket koin siap pilih dalam bentuk kartu, masing-masing menampilkan jumlah koin dan harganya.

**User story.** Sebagai pembaca, saya ingin memilih paket koin siap pakai agar tidak perlu menghitung sendiri berapa yang harus saya beli.

**Aturan bisnis.**

| Koin | Harga | Harga per koin | Catatan |
|---|---|---|---|
| 50 | Rp 7.000 | Rp 140 | — |
| 100 | Rp 13.000 | Rp 130 | — |
| 250 | Rp 30.000 | Rp 120 | — |
| **500** | Rp 55.000 | Rp 110 | **+50 koin bonus promo** |
| 1.000 | Rp 99.000 | Rp 99 | — |
| 2.000 | Rp 185.000 | Rp 92,5 | — |

- Harga per koin **menurun seiring besarnya paket** — insentif membeli lebih banyak.
- Tepat satu paket terpilih pada satu waktu.
- **Memilih paket mengosongkan kolom kustom sepenuhnya** (nilai, gaya aktif, gaya tidak valid, harga terhitung, dan pesan kesalahan) — kedua cara memilih jumlah tidak pernah aktif bersamaan.
- Memilih paket langsung membuka langkah pemilihan metode.

**Hook implementasi.** `topup_koin.html:181-213` `.pkg-card[data-coins][data-price]`; listener `:517`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat langkah pertama, **then** enam paket tampil dengan jumlah koin dan harga masing-masing.
- **Given** pembaca memilih paket 250, **when** pilihan diterapkan, **then** hanya paket itu bergaya terpilih dan langkah metode terbuka.
- **Given** pembaca sudah mengetik jumlah kustom lalu memilih paket, **when** pilihan diterapkan, **then** kolom kustom kosong dan harga terhitungnya hilang.

---

### FR-WALLET-03 — Jumlah koin kustom dengan validasi · P0

**Deskripsi.** Kolom untuk mengetik jumlah koin sendiri, dengan harga terhitung langsung dan validasi minimum.

**User story.** Sebagai pembaca, saya ingin membeli koin dalam jumlah persis yang saya butuhkan agar tidak membayar lebih dari perlu.

**Aturan bisnis.**
- **Kurs dasar: `COIN_RATE = 130`** rupiah per koin.
- **Rumus harga:** `Math.round(coins × 130 / 100) × 100` — hasilnya selalu **dibulatkan ke kelipatan Rp 100 terdekat**, sehingga tidak pernah muncul harga berakhiran ganjil.
- **Minimum 100 koin.**
- **Tiga keadaan kolom:**

  | Kondisi masukan | Keadaan | Akibat |
  |---|---|---|
  | Kosong, bukan angka, atau < 1 | Netral | Kartu direset, harga & petunjuk dikosongkan, pesan kesalahan disembunyikan, pilihan dibatalkan, langkah metode & ringkasan **ditutup** |
  | 1–99 | Tidak valid | Kartu bergaya tidak valid, pesan kesalahan tampil, pilihan dibatalkan, langkah metode & ringkasan **ditutup** |
  | ≥ 100 | Valid | Kartu bergaya aktif, harga terhitung tampil, petunjuk `Rp 130/koin` tampil, langkah metode terbuka |

- **Mengetik di kolom kustom mengosongkan pilihan paket** — kebalikan dari FR-WALLET-02.
- Nilai diurai dengan `parseInt(raw, 10)` sehingga masukan campuran huruf-angka diambil bagian angkanya saja.
- Validasi berjalan pada tiap ketikan (event `input`).
- Mundur dari jumlah valid ke tidak valid **menutup kembali** langkah yang sudah terbuka — pembaca tidak bisa membayar jumlah yang tidak sah.

**Hook implementasi.** `topup_koin.html:534` `COIN_RATE`; `:541:calcPrice(coins)`; listener `:543`; `#customCoinInput`, `#customCard`, `#customPriceVal`, `#customRateHint`, `#customError`.

**Acceptance criteria.**
- **Given** pembaca mengetik `100`, **when** validasi berjalan, **then** harga Rp 13.000 tampil dan langkah metode terbuka.
- **Given** pembaca mengetik `150`, **when** validasi berjalan, **then** harga Rp 19.500 tampil (19.500 sudah kelipatan 100).
- **Given** pembaca mengetik `77`, **when** validasi berjalan, **then** harga tidak dihitung, pesan minimum tampil, dan langkah metode tertutup.
- **Given** pembaca sudah memilih metode lalu mengubah jumlah menjadi `50`, **when** validasi berjalan, **then** langkah metode dan ringkasan tertutup kembali.
- **Given** pembaca mengosongkan kolom kustom, **when** validasi berjalan, **then** seluruh tampilan kembali netral tanpa pesan kesalahan.
- **Given** pembaca memilih paket lalu mengetik jumlah kustom, **when** validasi berjalan, **then** pilihan paket dibatalkan.

---

### FR-WALLET-04 — Pilih metode pembayaran · P0

**Deskripsi.** Daftar metode pembayaran yang dikelompokkan, masing-masing membawa jenis dan batas waktu pembayarannya sendiri.

**User story.** Sebagai pembaca, saya ingin memilih metode pembayaran yang saya punya, dan melihat metode yang terakhir saya pakai lebih dulu.

**Aturan bisnis.**

| Grup | Metode | Jenis | Batas waktu |
|---|---|---|---|
| Terakhir digunakan | GoPay | `ewallet` | 15 menit |
| E-Wallet | GoPay · OVO · DANA · ShopeePay | `ewallet` | 15 menit |
| QRIS | QRIS | `qris` | 30 menit |
| Transfer Bank / VA | BCA · BNI · Mandiri · BRI Virtual Account | `va` | 1440 menit (24 jam) |

- Grup **"Terakhir digunakan"** mengulang metode terakhir di posisi teratas sebagai pintasan.
- Jenis default bila `data-type` tidak ada: `ewallet`.
- Memilih metode menyimpan `{ method, icon, limit, type, bank }`, memperbarui ringkasan, menyinkronkan tombol bayar, dan membuka ringkasan.
- Tepat satu metode terpilih pada satu waktu.
- **Membuka ulang langkah metode (karena jumlah berubah) selalu mengosongkan metode terpilih** — pembaca harus memilih ulang, sehingga ringkasan tidak pernah menampilkan kombinasi lama.
- Langkah metode digulir ke tampilan (`scrollIntoView` mulus) setelah 50 ms agar transisi pembukaan terlihat.

**Hook implementasi.** `topup_koin.html:238-310` `.pay-row[data-method][data-limit][data-type][data-bank]`; listener `:585`; `:507:openPaymentStep()`.

**Acceptance criteria.**
- **Given** langkah metode terbuka, **when** pembaca melihat daftar, **then** empat grup tampil dengan metode terakhir digunakan di paling atas.
- **Given** pembaca memilih "OVO", **when** pilihan diterapkan, **then** ringkasan menampilkan OVO dan tombol bayar menjadi aktif.
- **Given** pembaca sudah memilih metode lalu mengganti jumlah koin, **when** langkah metode dibuka ulang, **then** tidak ada metode terpilih dan tombol bayar kembali nonaktif.
- **Given** pembaca memilih paket, **when** langkah metode terbuka, **then** halaman menggulir mulus ke bagian metode.

---

### FR-WALLET-05 — Ringkasan pembelian & tombol bayar · P0

**Deskripsi.** Panel ringkasan menempel di bawah layar berisi rincian akhir pembelian, dengan tombol bayar yang hanya aktif bila jumlah dan metode sudah lengkap.

**User story.** Sebagai pembaca, saya ingin memeriksa berapa koin yang saya dapat dan berapa yang saya bayar sebelum menekan tombol bayar.

**Aturan bisnis.**
- **Empat baris ringkasan:** jumlah koin · **baris bonus (hanya bila promo berlaku)** · total koin diterima · metode · harga.
- Baris bonus disembunyikan sepenuhnya bila jumlah koin bukan `promoCoins`.
- Total koin = jumlah koin + bonus (bila berlaku).
- Format angka: `Rp 55.000` (`toLocaleString('id-ID')`) dan `✦ 550 koin`.
- **Tombol bayar nonaktif** selama `selectedPkg` **atau** `selectedMethod` masih kosong (`syncPayBtn()`); dipanggil ulang setiap kali salah satunya berubah.
- Ringkasan hanya diperbarui bila kedua data lengkap — mencegah menampilkan data setengah.

**Hook implementasi.** `topup_koin.html:503:syncPayBtn()`; `:603:updateSummary()`; `:484:fmt()`, `:485:fmtCoins()`; `#summaryStickyEl`, `#sumBonusRow`, `#sumTotalCoins`, `#payNowBtn`.

**Acceptance criteria.**
- **Given** pembaca baru memilih paket tanpa metode, **when** tombol bayar dirender, **then** tombol nonaktif.
- **Given** pembaca memilih paket 500 dan sebuah metode, **when** ringkasan dirender, **then** baris bonus tampil dan total koin berbunyi 550.
- **Given** pembaca memilih paket 250 dan sebuah metode, **when** ringkasan dirender, **then** baris bonus disembunyikan dan total koin berbunyi 250.
- **Given** jumlah dan metode lengkap, **when** ringkasan dirender, **then** tombol bayar menjadi aktif.

---

### FR-WALLET-06 — Pembayaran e-wallet · P0

**Deskripsi.** Alur dua layar: menghubungkan ke aplikasi dompet digital, lalu menunggu konfirmasi dengan hitung mundur.

**User story.** Sebagai pembaca, saya ingin tahu bahwa aplikasi sedang menghubungkan saya ke dompet digital dan berapa lama waktu saya untuk menyelesaikan pembayaran.

**Aturan bisnis.**
- **Layar menghubungkan** tampil lebih dulu dengan pesan `"Menghubungkan ke <metode>...\nJangan tutup halaman ini"`, selama **1.800 ms**.
- Lalu **layar menunggu** menampilkan `<metode> · <harga>`, batas waktu, dan hitung mundur.
- **Format batas waktu:** `≥1440` menit ditulis `"24 jam"`; selain itu `"<n> menit"` — sehingga 1440 tidak pernah tampil sebagai "1440 menit".
- Hitung mundur habis → layar gagal dengan alasan `"Waktu pembayaran <metode> habis"`.
- Tombol **Cek status** menghentikan hitung mundur dan menampilkan layar sukses.

**Hook implementasi.** `topup_koin.html:634-643` cabang e-wallet; `#overlayLoading`, `#loadingLabel`, `#overlayWaiting`, `#waitMethod`, `#waitLimit`, `#waitTimer`, `#btnCheckStatus`.

**Acceptance criteria.**
- **Given** pembaca memilih DANA dan menekan bayar, **when** layar muncul, **then** layar menghubungkan tampil menyebut DANA.
- **Given** layar menghubungkan tampil, **when** 1,8 detik berlalu, **then** layar menunggu tampil dengan hitung mundur 15 menit.
- **Given** metode berbatas 1440 menit, **when** layar menunggu tampil, **then** batas ditulis "24 jam".
- **Given** layar menunggu tampil, **when** pembaca menekan "Cek status", **then** hitung mundur berhenti dan layar sukses tampil.

---

### FR-WALLET-07 — Pembayaran QRIS · P0

**Deskripsi.** Layar berisi kode QR untuk dipindai, dengan nominal, masa berlaku, hitung mundur, dan aksi menyimpan atau membagikan QR.

**User story.** Sebagai pembaca, saya ingin memindai kode QR dengan aplikasi bank apa pun, dan bisa menyimpan QR-nya bila ingin membayar dari perangkat lain.

**Aturan bisnis.**
- Keterangan menampilkan `<harga> · Berlaku 30 menit`.
- Hitung mundur **30 menit** (1.800 detik) dimulai bersamaan dengan tampilnya layar.
- Kedaluwarsa → layar gagal dengan alasan `"Waktu pembayaran QRIS habis"`.
- Aksi tambahan: **Simpan QR** dan **Bagikan QR**, masing-masing menampilkan pesan konfirmasi.
- Tombol **Cek status** memakai jalur yang sama dengan e-wallet.

**Hook implementasi.** `topup_koin.html:621-627` cabang QRIS; `:728-729` simpan/bagikan; `#overlayQRIS`, `#qrisInfo`, `#qrisTimer`.

**Acceptance criteria.**
- **Given** pembaca memilih QRIS dan menekan bayar, **when** layar muncul, **then** kode QR tampil dengan nominal dan keterangan berlaku 30 menit.
- **Given** layar QRIS tampil, **when** hitung mundur mencapai nol, **then** layar gagal tampil dengan alasan waktu QRIS habis.
- **Given** layar QRIS tampil, **when** pembaca menekan "Simpan QR", **then** pesan konfirmasi penyimpanan tampil.

---

### FR-WALLET-08 — Pembayaran virtual account · P0

**Deskripsi.** Layar berisi nomor virtual account bank terpilih, nominal yang harus persis, tombol salin, panduan, dan konfirmasi transfer.

**User story.** Sebagai pembaca yang membayar lewat transfer bank, saya ingin nomor VA yang mudah disalin dan tahu nominal persis yang harus saya transfer.

**Aturan bisnis.**
- Label bank diisi dari `data-bank` metode terpilih (`"Bank BCA"`, dst.).
- **Nominal ditegaskan harus persis:** `"Nominal tepat: <harga>"` — transfer dengan nominal berbeda tidak akan tercocokkan otomatis.
- Tombol **Salin** menampilkan pesan `"Nomor VA disalin ke clipboard!"`.
- Tombol **Cara transfer** menampilkan pesan panduan.
- **Tombol "Saya Sudah Transfer" dibuat secara dinamis oleh JavaScript** dan disisipkan ke layar VA — tidak ada di markup. Menekannya menghentikan hitung mundur dan menampilkan layar sukses.
- Nomor VA ditampilkan dengan font monospace agar mudah dibaca dan disalin.
- Layar VA **tidak memulai hitung mundur** meski batas metodenya 24 jam (lihat §7).

**Hook implementasi.** `topup_koin.html:628-632` cabang VA; `:741-746` tombol dinamis; `#overlayVA`, `#vaBankLabel`, `#vaNominal`, `#btnCopyVA`, `#btnHowVA`.

**Acceptance criteria.**
- **Given** pembaca memilih BNI Virtual Account dan menekan bayar, **when** layar muncul, **then** label berbunyi "Bank BNI" dan nominal tepat tampil.
- **Given** layar VA tampil, **when** pembaca menekan salin, **then** pesan konfirmasi penyalinan tampil.
- **Given** layar VA tampil, **when** pembaca melihat tombol aksi, **then** tombol "Saya Sudah Transfer" tersedia.
- **Given** pembaca menekan "Saya Sudah Transfer", **when** aksi dijalankan, **then** layar sukses tampil.

---

### FR-WALLET-09 — Hitung mundur kedaluwarsa · P0

**Deskripsi.** Satu mekanisme hitung mundur dipakai bersama seluruh metode berbatas waktu, dengan format yang menyesuaikan durasi.

**User story.** Sebagai pembaca, saya ingin tahu berapa lama lagi waktu saya untuk menyelesaikan pembayaran agar tidak kehabisan tanpa sadar.

**Aturan bisnis.**
- **Format tampilan menyesuaikan durasi:** `HH:MM:SS` bila masih ada jam tersisa, `MM:SS` bila kurang dari satu jam. Setiap bagian selalu dua digit (`padStart`).
- Berjalan tiap **1.000 ms**; mencapai nol menghentikan interval dan memanggil aksi kedaluwarsa.
- **Hanya ada satu hitung mundur aktif** — memulai yang baru selalu menghentikan yang lama (`clearInterval`), sehingga berganti metode tidak meninggalkan hitungan hantu.
- Dihentikan pada tiga peristiwa: pembayaran dikonfirmasi, pembayaran dibatalkan, dan kedaluwarsa.
- Elemen target dijaga null-check sehingga hitung mundur tetap berjalan meski elemennya tidak ada.

**Hook implementasi.** `topup_koin.html:647:startTimer(elId, seconds, onEnd)`; `:658:updateTimerEl(id, sec)`; `:668:pad(n)`.

**Acceptance criteria.**
- **Given** hitung mundur 30 menit dimulai, **when** tampilan dirender, **then** formatnya `29:59` (tanpa bagian jam).
- **Given** hitung mundur 24 jam dimulai, **when** tampilan dirender, **then** formatnya `23:59:59`.
- **Given** sebuah hitung mundur berjalan, **when** pembaca membatalkan lalu memulai pembayaran lain, **then** hanya satu hitung mundur yang berjalan.
- **Given** hitung mundur mencapai nol, **when** interval berhenti, **then** layar gagal tampil dengan alasan sesuai metode.

---

### FR-WALLET-10 — Pembayaran berhasil · P0

**Deskripsi.** Layar keberhasilan menampilkan koin yang diterima, saldo baru, animasi confetti, dan dua jalan lanjut.

**User story.** Sebagai pembaca yang baru membeli koin, saya ingin melihat saldo baru saya dan langsung kembali membaca.

**Aturan bisnis.**
- Total koin dihitung ulang dengan aturan bonus yang sama seperti ringkasan.
- **Saldo baru = saldo saat ini + total koin**, dan **saldo di bilah atas ikut diperbarui** — bukan hanya di layar sukses.
- Pesan: `"<total> sudah masuk ke akunmu"` beserta saldo baru dalam format `✦ n koin`.
- **Confetti:** 28 partikel, palet `#9b604b`, `#c99b6c`, `#302825`, `#487083`, `#3f8e60`, `#f5e2d0`; posisi horizontal acak; jeda mulai acak 0–0,8 detik; durasi 1–1,8 detik; ukuran acak 6–14 px; seluruh wadah dikosongkan setelah **2.200 ms**.
- Wadah confetti dikosongkan **sebelum** partikel baru dibuat, sehingga pembelian berturut-turut tidak menumpuk partikel.
- Dua jalan lanjut: **Mulai baca** → `home_tabs.html` · **Riwayat** → `transaction_history.html`.
- Fungsi berhenti aman bila tidak ada paket terpilih (`if (!pkg) return`).

**Hook implementasi.** `topup_koin.html:677:showSuccess()`; `:697:spawnConfetti()`; `:725-726` jalan lanjut; `#overlaySuccess`, `#successCoins`, `#newBalance`, `#confetti`.

**Acceptance criteria.**
- **Given** saldo 240 dan pembaca membeli paket 500 (bonus 50), **when** layar sukses tampil, **then** koin diterima 550 dan saldo baru 790.
- **Given** layar sukses tampil, **when** pembaca menutupnya dan melihat bilah atas, **then** saldo di bilah atas sudah menjadi saldo baru.
- **Given** layar sukses tampil, **when** confetti selesai, **then** partikel dibersihkan dari DOM setelah 2,2 detik.
- **Given** layar sukses tampil, **when** pembaca menekan "Riwayat", **then** `transaction_history.html` terbuka.

---

### FR-WALLET-11 — Pembayaran gagal & coba lagi · P0

**Deskripsi.** Layar kegagalan menampilkan alasan spesifik dan dua pilihan pemulihan.

**User story.** Sebagai pembaca yang pembayarannya gagal, saya ingin tahu penyebabnya dan bisa langsung mencoba lagi tanpa mengulang dari awal.

**Aturan bisnis.**
- **Alasan bersifat spesifik**, bukan pesan umum: `"Waktu pembayaran QRIS habis"`, `"Waktu pembayaran <metode> habis"`. Alasan cadangan: `"Transaksi tidak dapat diselesaikan."`
- **Dua pilihan pemulihan:**
  - **Coba lagi** — menutup seluruh layar lalu **memicu ulang tombol bayar**, sehingga jumlah dan metode yang sama dipakai kembali tanpa memilih ulang.
  - **Ganti metode** — kembali ke halaman utama dengan pilihan tetap utuh.
- Layar gagal tidak pernah mengubah saldo.

**Hook implementasi.** `topup_koin.html:691:showFailed(reason)`; `:720-724` tombol pemulihan; `#overlayFailed`, `#failReason`, `#btnRetry`, `#btnTryOther`.

**Acceptance criteria.**
- **Given** hitung mundur QRIS habis, **when** layar gagal tampil, **then** alasan menyebut QRIS secara spesifik.
- **Given** layar gagal tampil, **when** pembaca menekan "Coba lagi", **then** alur pembayaran dimulai ulang dengan jumlah dan metode yang sama.
- **Given** layar gagal tampil, **when** pembaca menekan "Ganti metode", **then** halaman kembali ke tampilan utama dengan pilihan sebelumnya masih ada.
- **Given** pembayaran gagal, **when** pembaca melihat bilah atas, **then** saldo tidak berubah.

---

### FR-WALLET-12 — Batalkan pembayaran · P1

**Deskripsi.** Setiap layar pembayaran menyediakan pembatalan yang menghentikan hitung mundur dan mengembalikan pembaca ke halaman utama.

**User story.** Sebagai pembaca, saya ingin membatalkan pembayaran yang sedang berjalan tanpa harus menutup aplikasi.

**Aturan bisnis.**
- Pembatalan tersedia di **keempat** layar: menghubungkan, menunggu, QRIS, dan VA.
- Membatalkan selalu **menghentikan hitung mundur** lebih dulu, baru menutup seluruh layar — mencegah hitungan tetap berjalan di latar dan memicu layar gagal setelah dibatalkan.
- Pilihan jumlah dan metode dipertahankan sehingga pembaca dapat membayar ulang tanpa memilih dari awal.
- `showOverlay()` selalu menutup seluruh layar lain sebelum membuka satu — tidak pernah ada dua layar bertumpuk.

**Hook implementasi.** `topup_koin.html:711:cancelToMain()`; `:493:showOverlay()`; `:498:hideAllOverlays()`; `#btnCancelLoading`, `#btnCancelWait`, `#btnCancelQRIS`, `#btnCancelVA`.

**Acceptance criteria.**
- **Given** layar menunggu dengan hitung mundur berjalan, **when** pembaca membatalkan, **then** layar tertutup dan hitung mundur berhenti.
- **Given** pembaca membatalkan pembayaran, **when** menunggu melewati batas waktu semula, **then** layar gagal **tidak** muncul.
- **Given** pembaca membatalkan, **when** halaman utama tampil, **then** paket dan metode yang dipilih sebelumnya masih terpilih.

---

## B. Varian Isi Saldo (`topup_restyled.html`)

### FR-WALLET-13 — Varian tampilan isi saldo · P2

**Deskripsi.** Tampilan alternatif pengisian saldo yang jauh lebih sederhana: bekerja dalam **rupiah**, bukan koin, dengan pemformatan angka otomatis dan tanpa alur pembayaran.

**User story.** Sebagai pembaca, saya ingin mengisi saldo dengan nominal rupiah yang saya kenal, dengan angka yang terformat rapi saat saya mengetik.

**Aturan bisnis.**
- Menampilkan **saldo dalam rupiah** (prototype: Rp 150.000), bukan koin.
- Empat pilihan nominal dengan bonus rupiah:

  | Nominal | Bonus |
  |---|---|
  | Rp 50.000 | Isi cepat (tanpa bonus) |
  | Rp 100.000 | + Rp 10rb |
  | Rp 250.000 | + Rp 30rb |
  | Rp 500.000 | + Rp 60rb |

- **Pemformatan angka:** masukan dibersihkan dari non-digit, lalu dipisah ribuan dengan **koma** (`1,000,000`) memakai lookahead — berbeda dari `topup_koin` yang memakai `toLocaleString('id-ID')` dengan titik. Lihat §7.
- Digit bersih disimpan pada `dataset.raw` sehingga nilai asli tetap tersedia terpisah dari tampilan.
- Pemformatan dijalankan pada event `input` **dan** `blur`.
- **Memilih kartu nominal mengisi kolom** dengan angka kartu tersebut, menandainya terpilih, dan memutar ulang animasi denyut dengan memaksa *reflow* (`void card.offsetWidth`) sehingga animasi tetap terlihat saat kartu yang sama ditekan berulang.
- Kelas animasi dilepas pada `animationend` agar dapat dipicu lagi.
- **Tombol bayar langsung menuju `home_tabs.html`** — tidak ada alur pembayaran sama sekali.
- Tombol kembali memakai `history.back()` dengan cadangan `home_tabs.html`.

**Hook implementasi.** `topup_restyled.html:495:digitsOnly(value)`, `:499:formatWithCommas(digits)`, `:503:setNominalValue(rawDigits)`; listener `:509`, `:517`, `:537`.

**Acceptance criteria.**
- **Given** pembaca mengetik `1000000`, **when** pemformatan berjalan, **then** kolom menampilkan `1,000,000`.
- **Given** pembaca mengetik `Rp 50.000`, **when** pemformatan berjalan, **then** kolom menampilkan `50,000` dan huruf serta titik dibuang.
- **Given** pembaca menekan kartu Rp 250.000, **when** aksi dijalankan, **then** kolom terisi nominal itu dan hanya kartu tersebut bergaya terpilih.
- **Given** pembaca menekan kartu yang sama dua kali, **when** aksi kedua dijalankan, **then** animasi denyut terlihat lagi.
- **Given** pembaca menekan "Lanjutkan Pembayaran", **when** aksi dijalankan, **then** `home_tabs.html` terbuka.

---

## C. Detail Transaksi (`topup_detail.html`)

### FR-WALLET-14 — Detail transaksi menurut status · P0

**Deskripsi.** Satu halaman yang menampilkan rincian lengkap sebuah transaksi, dengan seluruh isinya ditentukan oleh **parameter URL `?status=`**.

**User story.** Sebagai pembaca, saya ingin melihat rincian lengkap sebuah transaksi beserta apa yang harus saya lakukan berikutnya, apa pun status pembayarannya.

**Aturan bisnis.**
- Status dibaca dari `?status=` lewat `URLSearchParams`; nilai yang tidak dikenal atau tidak ada **jatuh ke `success`** sebagai cadangan.
- **Empat status yang didukung:**

  | Status | Judul | Koin | Sebelum → Sesudah | Tombol aksi |
  |---|---|---|---|---|
  | `success` | Koin sudah masuk | 1.200 | 940 → 2.140 | Top up lagi |
  | `pending` | *(menunggu konfirmasi provider)* | 500 | 2.140 → 2.140 | **Bayar ulang** |
  | `failed` | Pembayaran gagal | 0 | tidak berubah | *(sesuai status)* |
  | `expired` | *(invoice kedaluwarsa)* | 0 | tidak berubah | *(sesuai status)* |

- **17 elemen halaman diisi dari satu objek status**, termasuk kelas papan status, label, judul, deskripsi, jumlah koin, nominal dibayar, waktu, ID transaksi, metode, platform, nomor VA, bukti bank, saldo sebelum dan sesudah, promo, keterangan promo, catatan, dan **teks tombol aksi**.
- **Format ID transaksi:** `INV-NVL-YYYYMMDD-NNNN`.
- Aturan koin per status bersifat mengikat: **hanya `success` yang menambah koin**; `pending` menahan saldo tetap; `failed` dan `expired` memberi 0 koin dan tidak mengubah saldo.
- Bonus promo hanya diterapkan setelah pembayaran berhasil — pada `pending` tertulis eksplisit bahwa bonus menyusul.
- Aksi: **Salin ID Transaksi** dan **Download invoice PDF** menampilkan pesan yang **memuat ID transaksi tersebut**; **Bantuan / CS** → `help_center.html`; tombol aksi utama → `topup_koin.html`.
- Navigasi bawah: **History** → `transaction_history.html` · **Top up** → `topup_koin.html`.

**Hook implementasi.** `topup_detail.html:150` objek `data`; `:236-238` pembacaan parameter; `:239-259` pengisian elemen; `#statusBoard`, `#statusLabel`, `#transactionId`, `#retryBtn`.

**Acceptance criteria.**
- **Given** halaman dibuka dengan `?status=pending`, **when** halaman dirender, **then** papan status bergaya pending dan tombol aksi berbunyi "Bayar ulang".
- **Given** halaman dibuka tanpa parameter, **when** halaman dirender, **then** status sukses ditampilkan.
- **Given** halaman dibuka dengan `?status=tidakdikenal`, **when** halaman dirender, **then** status sukses ditampilkan tanpa error.
- **Given** status `failed` ditampilkan, **when** pembaca melihat rincian, **then** koin diterima 0 dan saldo sebelum sama dengan sesudah.
- **Given** pembaca menekan "Salin ID Transaksi", **when** aksi dijalankan, **then** pesan konfirmasi memuat ID transaksi yang sedang ditampilkan.

---

## D. Riwayat Transaksi (`transaction_history.html`)

### FR-WALLET-15 — Buku besar & saring transaksi · P0

**Deskripsi.** Daftar seluruh mutasi koin yang disajikan seperti buku akun, dengan penyaringan menurut jenis dan panel ringkasan.

**User story.** Sebagai pembaca, saya ingin memeriksa ke mana koin saya masuk dan keluar agar bisa mencocokkan pengeluaran saya.

**Aturan bisnis.**
- **Ringkasan brankas:** koin tersedia (1.240) dan perubahan bulan ini (+1.060).
- **Empat saringan:** Semua · **Isi ulang** (`topup`) · **Keluar** (`spend`) · **Menunggu** (`pending`).
- Setiap baris memakai `data-kind` yang dicocokkan dengan `data-filter` tombol; `all` menampilkan semua.
- Baris disembunyikan dengan `display: none` dan ditampilkan dengan `display: grid` — nilai `grid` **wajib**, karena tata letak baris memakai CSS grid dan mengembalikannya ke `block` akan merusak susunan kolom.
- **Keterangan berubah mengikuti saringan aktif:** `"Menampilkan catatan <label saringan huruf kecil> dari buku besar dompet."`
- **Jenis mutasi dan tandanya:**

  | Jenis | Tanda | Contoh |
  |---|---|---|
  | Isi ulang | `+` **tinta** | Paket Nilai Terbaik +1.200 (QRIS, Berhasil) |
  | Keluar | `−` **tinta** | Buka Chapter 18 −120 · Bundle lima chapter −520 |
  | Hadiah | `+` | Hadiah misi harian +55 (Diklaim) |
  | Menunggu | `+` dengan pil menunggu | Isi ulang transfer bank +500 |

> **Revisi 5 September 2026 · nominal buku besar memakai tinta.** Versi lama
> menulis isi ulang `+` **hijau** dan keluar `−` **merah**. Sejak putaran 7,
> `prd_01` §0 menetapkan destruktif tidak pernah memakai isi berwarna — dan buku
> besar yang penuh baris hijau-merah terbaca sebagai daftar peringatan, padahal
> tidak ada satu baris pun di sana yang berbahaya. Yang membedakan masuk dari
> keluar tetap **tandanya** (`+` / `−`), dan itu sudah cukup. Merah tetap
> dipakai, tetapi hanya di lencana status transaksi yang memang gagal — di sana
> ia berarti sesuatu. Diterapkan di R8c. `architecture.md` §1.29.

- Setiap baris membawa keterangan kontekstual (metode pembayaran, judul cerita, alasan diskon).
- Baris transaksi top-up berupa tautan menuju halaman detail; baris pengeluaran tidak.
- **Dua panel analitik:** peta pengeluaran (Chapter 72% · Bundle 24% · Tips 4%) dan status kuitansi (Berhasil 4 · Menunggu 1 · Sengketa 0).
- Daftar baris **dikumpulkan sekali saat halaman dimuat**, sehingga baris yang ditambahkan kemudian tidak akan ikut tersaring (lihat §7).

**Hook implementasi.** `transaction_history.html:94` pengumpulan baris; listener `:96`; `.tx[data-kind]`, `.filters button[data-filter]`, `#note`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat daftar, **then** seluruh transaksi tampil dan saringan "Semua" aktif.
- **Given** pembaca menekan saringan "Keluar", **when** daftar diperbarui, **then** hanya transaksi pengeluaran tampil dan keterangan menyebut "keluar".
- **Given** pembaca menyaring lalu kembali ke "Semua", **when** daftar diperbarui, **then** seluruh baris tampil kembali dengan tata letak kolom utuh.
- **Given** pembaca melihat transaksi pengeluaran, **when** baris dirender, **then** jumlahnya bertanda minus dan bergaya keluar.

---

### FR-WALLET-16 — Ekspor kuitansi · P2

**Deskripsi.** Tombol untuk mengunduh riwayat transaksi sebagai berkas.

**User story.** Sebagai pembaca, saya ingin menyimpan riwayat transaksi saya untuk keperluan pencatatan pribadi.

**Aturan bisnis.**
- Menampilkan pesan `"Ekspor kuitansi diantrekan. Produk akhir dapat mengunduh ini sebagai PDF atau CSV."` — menyatakan format yang direncanakan: **PDF atau CSV**.
- Tautan **"Hubungi dukungan"** menuju `help_center.html`.
- Belum menghasilkan berkas nyata.

**Hook implementasi.** `transaction_history.html:104` `#exportBtn`.

**Acceptance criteria.**
- **Given** pembaca menekan "Ekspor kuitansi", **when** aksi dijalankan, **then** pesan antrean ekspor tampil.
- **Given** ekspor selesai *(produksi)*, **when** berkas siap, **then** berkas PDF atau CSV dapat diunduh.

---

## E. Pusat Hadiah (`rewards_center.html`)

### FR-RWD-01 — Ringkasan hadiah · P1

**Deskripsi.** Tiga angka ringkas di kepala halaman: saldo koin hadiah, jumlah voucher, dan posisi streak.

**User story.** Sebagai pembaca, saya ingin melihat berapa koin bonus dan voucher yang saya punya agar tahu apa yang bisa saya pakai.

**Aturan bisnis.**
- **Saldo hadiah** (420 koin) dengan keterangan bahwa koin bonus dapat membuka bab premium dan bundle.
- **Voucher** (4) dengan peringatan **2 hampir kedaluwarsa** — mendorong pemakaian sebelum hangus.
- **Streak** (4/7) dengan pengingat klaim setiap hari.
- Tombol kembali menuju `profile.html`.

**Hook implementasi.** `rewards_center.html:53` `.summary`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat ringkasan, **then** saldo hadiah, jumlah voucher, dan streak tampil.
- **Given** ada voucher yang akan kedaluwarsa, **when** ringkasan dirender, **then** peringatan jumlahnya tampil.

---

### FR-RWD-02 — Check-in harian & streak · P0

**Deskripsi.** Kalender tujuh hari dengan hadiah menaik, tombol klaim untuk hari berjalan, dan hadiah puncak di hari ketujuh.

**User story.** Sebagai pembaca, saya ingin mendapat koin gratis setiap hari saya membuka aplikasi, dan hadiah yang lebih besar bila saya konsisten.

**Aturan bisnis.**
- **Struktur hadiah tujuh hari:**

  | Hari | H1 | H2 | H3 | H4 | H5 | H6 | H7 |
  |---|---|---|---|---|---|---|---|
  | Hadiah | 10 | 10 | 15 | **20** | 20 | 25 | **Voucher bundle** |

- Hadiah **menaik** sepanjang minggu; puncaknya bukan koin melainkan **voucher bundle** — insentif menyelesaikan seluruh siklus.
- Hari yang sudah diklaim ditandai selesai; posisi saat ini adalah hari berikutnya yang belum diklaim.
- **Menekan klaim menjalankan empat hal sekaligus:** mengubah teks tombol menjadi `"Diklaim"`, **menonaktifkan tombol** (mencegah klaim ganda), menandai hari ke-4 sebagai selesai, dan menampilkan pesan `"Hari ke-4 berhasil diklaim. +20 koin bonus ditambahkan dalam prototipe."`.
- Keterangan menegaskan hubungan streak dengan hadiah: hari ke-7 membuka voucher bundle.
- Tautan **Riwayat** menuju `transaction_history.html`.

**Hook implementasi.** `rewards_center.html:61-67` `.check-row`, `.week`, `.day`; listener `:98` `#claimBtn`.

**Acceptance criteria.**
- **Given** pembaca belum klaim hari ini, **when** halaman dirender, **then** tombol klaim aktif dan menyebut hari yang bisa diklaim.
- **Given** pembaca menekan klaim, **when** aksi dijalankan, **then** tombol berbunyi "Diklaim", menjadi nonaktif, dan hari ke-4 ditandai selesai.
- **Given** pembaca sudah klaim, **when** menekan tombol lagi, **then** tidak terjadi apa-apa.
- **Given** kalender dirender, **when** pembaca melihat hari ketujuh, **then** hadiahnya berupa voucher, bukan koin.

---

### FR-RWD-03 — Misi harian · P1

**Deskripsi.** Daftar tugas dengan batang progres dan tombol yang berubah mengikuti keadaan penyelesaian.

**User story.** Sebagai pembaca, saya ingin tahu tugas apa yang bisa saya selesaikan hari ini untuk mendapat koin tambahan.

**Aturan bisnis.**

| Misi | Progres | Tombol |
|---|---|---|
| Baca 3 chapter | 2 dari 3 (66%) | **Lanjut** → halaman baca |
| Tulis satu ulasan | 0% | **Ulasan** |
| Tonton iklan berbayar | 100% — siap diklaim | **Klaim** |

- Misi yang **belum selesai** menampilkan tombol yang membawa pembaca ke tempat menyelesaikannya; misi yang **sudah 100%** menampilkan tombol klaim.
- Menekan klaim menampilkan pesan `"Misi iklan berbayar berhasil diklaim."`.
- Tautan "Cari lebih" menuju `topup_koin.html`.
- Tombol "Lanjut" menuju `chapter_read_unlocked.html` — halaman ini tidak ada (lihat §7).

**Hook implementasi.** `rewards_center.html:72-74` `.row`, `.progress`; listener `:104` `[data-toast]`.

**Acceptance criteria.**
- **Given** misi baru selesai sebagian, **when** barisnya dirender, **then** batang progres terisi sebagian dan tombol mengarah ke tempat menyelesaikannya.
- **Given** misi sudah 100%, **when** barisnya dirender, **then** tombol berbunyi "Klaim".
- **Given** pembaca menekan klaim pada misi yang selesai, **when** aksi dijalankan, **then** pesan keberhasilan klaim tampil.

---

### FR-RWD-04 — Program referral · P1

**Deskripsi.** Kode undangan yang bisa disalin, dengan syarat perolehan hadiah yang dinyatakan jelas.

**User story.** Sebagai pembaca, saya ingin mengundang teman dan mendapat koin, serta tahu persis kapan koin itu saya terima.

**Aturan bisnis.**
- **Hadiah: 200 koin**, diberikan setelah teman **mendaftar dan membaca bab pertama mereka** — bukan sekadar mendaftar.
- Kode ditampilkan dalam kolom **hanya-baca** (prototype: `ANNA-READS-200`) sehingga tidak bisa diubah tetapi tetap dapat diseleksi.
- Tombol **Salin** menampilkan pesan `"Kode referral disalin dalam prototipe."`.
- Tautan "Bagikan" tersedia di kepala blok.

**Hook implementasi.** `rewards_center.html:79` `.ref`, `#refCode`; listener `:105` `#copyBtn`.

**Acceptance criteria.**
- **Given** halaman dirender, **when** pembaca melihat blok referral, **then** kode dan syarat 200 koin tampil.
- **Given** pembaca menekan Salin, **when** aksi dijalankan, **then** pesan konfirmasi penyalinan tampil.
- **Given** pembaca mencoba mengetik di kolom kode, **when** kolom difokuskan, **then** isinya tidak dapat diubah.

---

### FR-RWD-05 — Voucher & riwayat klaim · P1

**Deskripsi.** Daftar voucher yang dimiliki beserta keadaannya, dan catatan perolehan hadiah terakhir.

**User story.** Sebagai pembaca, saya ingin tahu voucher apa yang saya punya, mana yang masih terkunci, dan hadiah apa yang sudah saya terima.

**Aturan bisnis.**
- **Voucher menampilkan keadaannya, bukan hanya isinya:**

  | Voucher | Keadaan |
  |---|---|
  | Buka chapter diskon 50% | **2 hari** tersisa |
  | Bundle 5 chapter gratis | **Terkunci** sampai streak Hari ke-7 |

- Voucher terkunci menyebut **syarat pembukanya**, menghubungkan blok voucher dengan check-in harian (FR-RWD-02).
- **Riwayat klaim** menampilkan perolehan terakhir beserta jumlah koin: check-in Hari ke-3 (+15), hadiah referral (+200).
- Tautan "Dompet" pada riwayat klaim menuju `transaction_history.html` — perolehan hadiah juga tercatat di buku besar dompet.

**Hook implementasi.** `rewards_center.html:82-92` blok voucher & riwayat klaim.

**Acceptance criteria.**
- **Given** sebuah voucher akan kedaluwarsa, **when** barisnya dirender, **then** sisa waktunya tampil.
- **Given** sebuah voucher terkunci, **when** barisnya dirender, **then** syarat pembukanya tampil.
- **Given** pembaca menekan "Dompet" pada riwayat klaim, **when** aksi dijalankan, **then** `transaction_history.html` terbuka.

---

## F. Penutup Alur (FR baru)

### FR-WALLET-17 — Dompet tunggal lintas halaman · P0

**Status: BARU.** Saat ini ada **empat saldo berbeda** untuk satu dompet: reader 15.300 · `topup_koin` 240 · `transaction_history` 1.240 · `rewards_center` 420 koin hadiah. Selama ini berlaku, tidak ada satu pun alur ekonomi yang bisa diuji dari ujung ke ujung.

**Deskripsi.** Satu saldo koin, satu sumber kebenaran, ditampilkan seragam di setiap halaman yang menyentuh koin.

**User story.** Sebagai pembaca, saya ingin saldo koin saya sama di mana pun saya melihatnya, agar saya bisa mempercayai angkanya saat memutuskan membeli.

**Aturan bisnis.**
- **Satu sumber kebenaran di server.** Tidak ada halaman yang boleh menyimpan saldo sendiri atau memakai nilai hardcoded.
- **Koin hadiah bukan dompet terpisah.** Nilai 420 koin di `rewards_center` adalah *koin yang diperoleh dari hadiah dalam periode berjalan* — sebuah metrik, bukan saldo. Saldo yang bisa dibelanjakan hanya satu.
- **Titik tampil saldo yang wajib seragam:**

  | Halaman | Letak |
  |---|---|
  | `chapter_read_locked_story_stage` | Chip bilah atas + ringkasan di gerbang unlock |
  | `topup_koin` | Lencana bilah atas + saldo baru pada layar sukses |
  | `transaction_history` | Kotak "Koin tersedia" |
  | `rewards_center` | Ringkasan saldo |
  | `profile` | **Ditambahkan** pada blok Dompet — saat ini profil tidak menampilkan saldo sama sekali |
  | `home_tabs` | Opsional pada FAB top-up |

- **Format ringkas seragam** memakai aturan `formatCompactCoin` dari reader (lihat [`prd_05_reader.md`](prd_05_reader.md) FR-READ-05): ≥1jt → `Xjt`, ≥1.000 → `Xrb`, sisanya angka apa adanya.
- **Format mata uang seragam** memakai `toLocaleString('id-ID')` (titik sebagai pemisah ribuan) di seluruh modul — menutup ketidakkonsistenan pada §7 no. 6.
- Saldo disegarkan setiap halaman dibuka dan setelah setiap transaksi berhasil.
- Perubahan saldo bersifat **atomik di server**: pembelian bab, top-up, dan klaim hadiah tidak boleh menghasilkan saldo yang berbeda antar halaman meski dilakukan bersamaan.

**Acceptance criteria.**
- **Given** saldo pengguna 1.240, **when** membuka reader, top-up, riwayat, hadiah, dan profil, **then** kelima halaman menampilkan angka yang sama.
- **Given** pembaca membeli bab seharga 1.500, **when** membuka `transaction_history`, **then** saldo tersedia sudah berkurang 1.500 dan mutasinya tercatat.
- **Given** pembaca menyelesaikan top-up, **when** kembali ke reader, **then** saldo pada chip bilah atas sudah bertambah.
- **Given** saldo 12.000, **when** dirender di halaman mana pun, **then** ditampilkan sebagai `12rb`, bukan `12.0rb` atau `12,000`.
- **Given** pembaca membuka profil, **when** blok Dompet dirender, **then** saldo koin tampil.

---

### FR-WALLET-18 — Konteks kembali setelah top-up · P0

**Status: BARU.** Saat ini layar sukses hanya menawarkan "Mulai baca" → beranda, sehingga pembaca yang terhenti di bab tertentu dilempar ke beranda dan harus menelusuri ulang.

**Deskripsi.** Top-up mengingat dari mana pembaca datang dan apa yang ingin dilakukannya, lalu mengembalikannya ke sana setelah pembayaran berhasil.

**User story.** Sebagai pembaca yang mengisi koin karena ingin membuka satu bab, saya ingin langsung kembali ke bab itu setelah membayar.

**Aturan bisnis.**
- `topup_koin` menerima konteks lewat parameter: `?return=<halaman asal>&chapter_id=<id>&need=<koin yang kurang>`.
- **Bila `need` diberikan**, halaman menyorot **paket terkecil yang mencukupi** dan menampilkan keterangan `"Cukup untuk membuka bab ini"`. Paket lain tetap dapat dipilih.
- **Tombol utama layar sukses menyesuaikan konteks:**

  | Asal | Tombol utama |
  |---|---|
  | Reader (bab terkunci) | **"Lanjutkan membaca"** → bab tersebut |
  | Detail cerita | **"Kembali ke cerita"** |
  | Tanpa konteks | **"Mulai baca"** → `home_tabs.html` *(perilaku sekarang)* |

- Tombol **Riwayat** tetap tersedia sebagai pilihan kedua pada semua kasus.
- Membatalkan top-up atau menekan tombol kembali mengembalikan pembaca ke halaman asal, bukan ke beranda.
- Konteks juga dipakai oleh FAB top-up di beranda (tanpa konteks) dan lembar saldo kurang di reader (lihat [`prd_05_reader.md`](prd_05_reader.md) FR-READ-17).

**Acceptance criteria.**
- **Given** pembaca menekan "Isi koin" dari lembar saldo kurang pada bab 18, **when** `topup_koin` terbuka, **then** paket terkecil yang mencukupi tersorot.
- **Given** pembayaran berhasil dengan konteks reader, **when** layar sukses dirender, **then** tombol utama berbunyi "Lanjutkan membaca".
- **Given** pembaca menekan "Lanjutkan membaca", **when** reader terbuka, **then** bab 18 yang dimuat, bukan bab pertama.
- **Given** pembaca membuka top-up dari FAB beranda, **when** layar sukses dirender, **then** tombol utama berbunyi "Mulai baca" seperti sebelumnya.
- **Given** pembaca membatalkan top-up yang dibuka dari reader, **when** menekan kembali, **then** kembali ke bab tersebut.

---

### FR-WALLET-19 — Riwayat → detail transaksi · P0

**Status: BARU.** `topup_detail.html` sudah lengkap dengan empat status, tetapi **tidak ada satu pun tautan menujunya** di seluruh aplikasi.

**Deskripsi.** Setiap baris di riwayat transaksi membuka halaman detailnya, dan setiap transaksi punya alamat sendiri.

**User story.** Sebagai pembaca, saya ingin membuka rincian sebuah transaksi untuk memeriksa nomor invoice atau menghubungi dukungan bila ada masalah.

**Aturan bisnis.**
- Setiap baris riwayat menjadi tautan `topup_detail.html?id=<transaction_id>`; status dibaca dari data transaksi, **bukan** dari parameter `?status=` seperti sekarang. Parameter status tetap didukung untuk keperluan pratinjau.
- Baris **pengeluaran koin** (buka bab, bundle) juga punya halaman detail dengan varian tampilan sendiri: cerita dan bab yang dibuka, jumlah koin, dan saldo sebelum–sesudah.
- Baris **hadiah** menautkan ke `rewards_center.html`.
- `topup_detail` menerima `id` yang tidak ditemukan dengan keadaan kosong yang sopan, bukan jatuh ke status sukses palsu seperti perilaku sekarang.
- Notifikasi status pembayaran (lihat [`prd_11_search_notifications.md`](prd_11_search_notifications.md) FR-NOTIF-02) menautkan ke halaman detail yang sama.
- Tombol **Ekspor kuitansi** (FR-WALLET-16) benar-benar menghasilkan berkas PDF atau CSV berisi rentang transaksi yang dipilih.

**Acceptance criteria.**
- **Given** pembaca menekan baris top-up di riwayat, **when** halaman terbuka, **then** `topup_detail` menampilkan transaksi tersebut berdasarkan id-nya.
- **Given** pembaca menekan baris pengeluaran "Buka Chapter 18", **when** halaman terbuka, **then** detail menampilkan cerita, bab, jumlah koin, dan saldo sebelum–sesudah.
- **Given** id transaksi tidak ditemukan, **when** halaman dirender, **then** keadaan kosong tampil, bukan data transaksi lain.
- **Given** pembaca menerima notifikasi top-up gagal, **when** menekannya, **then** halaman detail transaksi itu terbuka.

---

### FR-RWD-06 — Voucher terpadu: miliki, pakai, tukar · P0

**Status: BARU.** Saat ini ada **dua sistem voucher yang tidak saling kenal**: `rewards_center` memiliki 4 voucher dengan tombol "Gunakan" → `#`, sementara `detail_story_…` meminta kode diketik manual. Voucher yang dimiliki tidak bisa dipakai.

**Deskripsi.** Satu sistem voucher: voucher yang diperoleh dari hadiah tersimpan di akun dan dapat dipakai langsung, sementara kode dari luar tetap bisa ditukarkan.

**User story.** Sebagai pembaca, saya ingin memakai voucher yang sudah saya dapatkan tanpa mengetik kode, dan tetap bisa menukar kode promo yang saya terima dari luar aplikasi.

**Aturan bisnis.**
- **Dua cara memperoleh voucher, satu tempat menyimpannya:**

  | Cara | Contoh |
  |---|---|
  | Hadiah dari sistem | Hadiah streak Hari ke-7 (bundle 5 chapter gratis) · hadiah misi |
  | Tukar kode dari luar | Kode promo kampanye (`promo` pada prototype) |

- Modal voucher di halaman detail cerita **menampilkan voucher yang dimiliki dan berlaku untuk cerita itu** di atas kolom kode. Pembaca dapat memilih salah satunya tanpa mengetik.
- Kolom kode tetap ada untuk menukar kode dari luar; kode yang berhasil ditukar **masuk ke daftar voucher** pengguna, lalu dipakai — dua langkah yang terlihat sebagai satu aksi.
- **Setiap voucher membawa aturannya sendiri**, dan sistem menghormatinya alih-alih membuka seluruh bab terkunci seperti sekarang:

  | Atribut voucher | Fungsi |
  |---|---|
  | Cakupan | Bab tertentu · N bab pertama yang terkunci · seluruh cerita · lintas cerita |
  | Nilai | Gratis penuh atau diskon persentase |
  | Masa berlaku | Tanggal kedaluwarsa (`rewards_center` sudah menampilkan `"2 hari"`) |
  | Syarat buka | Mis. terkunci sampai streak Hari ke-7 |
  | Batas pakai | Sekali pakai atau beberapa kali |

- Tombol **"Gunakan"** di `rewards_center` membuka pemilih cerita yang berlaku, lalu menerapkan voucher — bukan lagi `#`.
- Voucher terkunci menampilkan syarat pembukanya dan **tidak dapat dipilih**.
- Voucher kedaluwarsa hilang dari daftar aktif dan tercatat di riwayat klaim.
- Pemakaian voucher tercatat di `transaction_history` sebagai mutasi bernilai nol koin dengan keterangan voucher — sehingga pembaca dapat menelusuri bab mana yang terbuka lewat voucher.
- Modal sukses dan confetti yang sudah ada (lihat [`prd_04_story_detail.md`](prd_04_story_detail.md) FR-DETAIL-10) dipertahankan, dengan pesan yang mencerminkan cakupan voucher sebenarnya.

**Acceptance criteria.**
- **Given** pembaca punya voucher yang berlaku untuk cerita ini, **when** membuka modal voucher, **then** voucher itu tampil untuk dipilih tanpa mengetik kode.
- **Given** pembaca memilih voucher bercakupan 5 bab, **when** voucher diterapkan, **then** tepat 5 bab terkunci pertama terbuka — bukan seluruhnya.
- **Given** pembaca menukar kode promo yang valid, **when** kode diterima, **then** voucher masuk ke daftar miliknya dan langsung diterapkan.
- **Given** sebuah voucher masih terkunci sampai streak Hari ke-7, **when** daftar voucher dirender, **then** voucher tidak dapat dipilih dan syaratnya tampil.
- **Given** pembaca menekan "Gunakan" di `rewards_center`, **when** aksi dijalankan, **then** pemilih cerita yang berlaku terbuka.
- **Given** voucher sudah dipakai, **when** pembaca membuka `transaction_history`, **then** pemakaiannya tercatat sebagai mutasi bernilai nol koin.

---

### FR-RWD-07 — Streak, kuota & klaim tersimpan · P0

**Status: BARU.** Saat ini check-in dapat diklaim ulang cukup dengan menyegarkan halaman.

**Deskripsi.** Seluruh perolehan hadiah dicatat per akun per tanggal di server sehingga tidak dapat diulang.

**User story.** Sebagai penyelenggara, saya ingin hadiah harian benar-benar harian; sebagai pembaca, saya ingin streak saya tercatat dan tidak hilang.

**Aturan bisnis.**
- **Klaim check-in dicatat per akun per tanggal.** Tanggal ditentukan dari zona waktu pengguna (`settings_language`, lihat [`prd_10_profile_settings_help.md`](prd_10_profile_settings_help.md) FR-SET-01), bukan zona waktu server.
- Klaim kedua pada hari yang sama ditolak server, bukan hanya dicegah tombol nonaktif di layar.
- **Aturan streak:** melewatkan satu hari mengembalikan streak ke Hari 1. Hari ke-7 memberi voucher bundle lalu siklus dimulai ulang.
- Progres misi dihitung dari aktivitas nyata: misi *"Baca 3 chapter"* memakai bab selesai dari progres baca (lihat [`prd_05_reader.md`](prd_05_reader.md) FR-READ-16); misi *"Tulis satu ulasan"* memakai ulasan terkirim (lihat [`prd_12_social.md`](prd_12_social.md) FR-SOCIAL-08); misi *"Tonton iklan"* memakai tayangan iklan selesai (FR-READ-18).
- Misi mereset setiap hari mengikuti tanggal pengguna.
- **Hadiah referral** diberikan setelah teman yang diundang mendaftar **dan** menyelesaikan bab pertamanya — bukan sekadar mendaftar (aturan sudah dinyatakan di FR-RWD-04, requirement ini yang menegakkannya).
- Setiap perolehan koin dari hadiah tercatat di `transaction_history` sebagai mutasi masuk, sehingga riwayat klaim dan buku besar dompet tidak pernah berbeda.
- Tombol misi *"Lanjut"* diarahkan ke `chapter_read_locked_story_stage.html`, memperbaiki tautan menggantung `chapter_read_unlocked.html`.

**Acceptance criteria.**
- **Given** pembaca sudah klaim check-in hari ini, **when** menyegarkan halaman, **then** tombol tetap dalam keadaan sudah diklaim.
- **Given** pembaca melewatkan satu hari, **when** membuka `rewards_center`, **then** streak kembali ke Hari 1.
- **Given** pembaca menyelesaikan bab ketiga hari itu, **when** membuka `rewards_center`, **then** misi "Baca 3 chapter" berprogres 100% dan dapat diklaim.
- **Given** pembaca mengklaim hadiah 20 koin, **when** membuka `transaction_history`, **then** mutasi masuk 20 koin tercatat dan saldo bertambah.
- **Given** teman yang diundang baru mendaftar tanpa membaca, **when** hadiah referral diperiksa, **then** hadiah belum diberikan.

---

## 5. State & Persistensi

**Tidak ada `localStorage` di seluruh modul.**

| State | Tempat | Konsekuensi saat dimuat ulang |
|---|---|---|
| Paket & metode terpilih | Objek `state` | Kembali kosong |
| Saldo koin | `state.currentBalance` | **Kembali ke 240** — pembelian hilang |
| Hitung mundur | `state.timerInterval` | Berhenti dan hilang |
| Status klaim check-in | Kelas DOM | **Dapat diklaim ulang** |
| Saringan riwayat transaksi | Kelas `active` | Kembali ke "Semua" |
| Nominal `topup_restyled` | Nilai input + `dataset.raw` | Kosong lagi |

---

## 6. Navigasi

**Masuk ke modul:** tab "Topup" dari halaman ber-navigasi bawah · FAB top-up di beranda · `profile.html` → `topup_koin` & `transaction_history` · `rewards_center` → `topup_koin` · `manage_chapters`, `my_library`, `my_stories`, `detail_story_*` → `topup_koin` · `home_tabs` → `topup_koin`.

**Internal:** `topup_koin` → `transaction_history` · `topup_detail` → `topup_koin` / `transaction_history` · `rewards_center` → `transaction_history` / `topup_koin`.

**Keluar dari modul:** `home_tabs.html` · `help_center.html` · `profile.html` · `my_library.html` · `my_stories.html` · `chapter_read_unlocked.html` *(menggantung, dari rewards)*.

**Tidak dapat dijangkau:** `topup_detail.html` dan `topup_restyled.html` tidak dirujuk halaman mana pun.

---

## 7. Catatan Prototype vs Produksi

| # | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | **Seluruh pembayaran disimulasikan** — "Cek status" dan "Saya Sudah Transfer" langsung menandakan berhasil | Tidak ada verifikasi pembayaran sama sekali | Integrasikan payment gateway; status hanya boleh berubah lewat webhook/polling ke server |
| 2 | **Saldo tidak persisten** — kembali ke 240 setiap kali dimuat ulang | Pembelian tidak nyata | Simpan dompet di server (lihat `../../docs/api_topup.md`) |
| 3 | **Layar VA tidak memulai hitung mundur** meski batasnya 24 jam | Pembaca tidak tahu sisa waktu bayar | Mulai hitung mundur seperti QRIS dan e-wallet |
| 4 | **`topup_detail` dan `topup_restyled` tidak dapat dijangkau** dari halaman mana pun | Dua halaman jadi kode mati | Tautkan `topup_detail` dari baris riwayat transaksi; putuskan nasib `topup_restyled` |
| 5 | **`topup_restyled` memakai satuan rupiah, bukan koin** — bertentangan dengan seluruh ekonomi aplikasi | Membingungkan bila keduanya dipertahankan | Pilih satu; bila varian ini dipakai, ubah ke satuan koin |
| 6 | **Pemisah ribuan tidak konsisten**: `topup_koin` memakai titik (`Rp 55.000`, format Indonesia), `topup_restyled` memakai koma (`1,000,000`), `topup_detail` memakai koma (`Rp 25,000`) | Format angka tidak seragam di satu modul yang sama | Seragamkan ke format Indonesia (`toLocaleString('id-ID')`) |
| 7 | **Riwayat transaksi mengumpulkan baris sekali saat dimuat** | Baris yang ditambahkan kemudian tidak ikut tersaring | Kueri ulang saat menyaring, atau saring di server |
| 8 | **Check-in dapat diklaim ulang setelah halaman dimuat ulang** | Hadiah dapat dieksploitasi | Catat klaim per akun per tanggal di server |
| 9 | **Kuota, streak, dan progres misi tidak tersimpan** | Sistem hadiah tidak berjalan nyata | Sambungkan ke Gamification Service |
| 10 | **Tombol misi "Lanjut" menuju `chapter_read_unlocked.html` yang tidak ada** | Menuju 404 | Arahkan ke `chapter_read_locked_story_stage.html` |
| 11 | **Riwayat transaksi tidak menautkan ke `topup_detail`** dengan parameter status | Detail transaksi tidak dapat dibuka dari riwayat | Tautkan tiap baris ke `topup_detail.html?status=<status>&id=<id>` |
| 12 | **Ekspor kuitansi, invoice PDF, simpan/bagikan QR, dan salin VA hanya menampilkan pesan** | Tidak ada aksi nyata | Implementasikan Clipboard API dan pembuatan berkas di server |
| 13 | **Nomor VA, kode QR, dan ID transaksi hardcoded** | Setiap pengguna melihat nomor yang sama | Ambil dari respons pembuatan order |
| 14 | **Harga paket dan kurs koin hardcoded** | Perubahan harga butuh ubah kode | Ambil dari endpoint konfigurasi (`coin_packages`, `topup_config`) |
| 15 | **Promo hanya berlaku untuk satu jumlah persis (500)** | Tidak fleksibel untuk kampanye lain | Dukung aturan promo berbasis rentang dan periode |
| 16 | **Tidak ada penanganan idempotensi** — menekan bayar berulang bisa membuat order ganda | Risiko tagihan ganda | Kirim `Idempotency-Key` per order (lihat `../../microservices/content_service_full_spec.md`) |
