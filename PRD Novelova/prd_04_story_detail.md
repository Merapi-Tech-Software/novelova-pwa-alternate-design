# PRD Novelova — Modul Detail Cerita

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya **sama dengan v1**; yang berubah hanya kulitnya (putaran 7).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Halaman: `detail_story_alternatif_unified_cover_first.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_story_detail.md`, `../../docs/api_voucher.md`

---

## 1. Ringkasan Modul

Halaman keputusan. Di sinilah pembaca memutuskan akan membaca sebuah cerita atau tidak, dan di sinilah bab terkunci pertama kali terlihat beserta harganya. Tata letaknya **cover-first**: sampul mengisi bagian atas layar sebagai hero, dengan judul dan penulis melayang di atasnya.

Halaman ini adalah satu-satunya halaman detail cerita yang aktif — **seluruh** kartu cerita di aplikasi mengarah ke sini.

| Aspek | Nilai |
|---|---|
| **Aktor** | Pembaca |
| **Halaman** | `detail_story_alternatif_unified_cover_first.html` (651 baris) |
| **Prasyarat** | Datang dari beranda, halaman lihat-semua, perpustakaan, atau profil penulis |
| **State persisten** | Tidak ada — status buka bab hanya bertahan selama halaman terbuka |
| **Sub-sistem desain** | Backdrop krem gradien, Cormorant + Manrope, frame klasik |

---

## 2. Flow

1. Pembaca tiba dari kartu cerita mana pun.
2. Hero sampul tampil dengan judul, penulis, dan lencana penghargaan; statistik cerita menempel tepat di bawahnya.
3. Pembaca dapat: menyimpan ke perpustakaan, mengikuti cerita, memberi rating, membuka ulasan, membagikan, atau melaporkan.
4. Pembaca membaca sinopsis (terpotong) dan menekan "Read more" bila ingin utuh.
5. Pembaca menggulir ke daftar bab dan melihat mana yang gratis dan mana yang terkunci beserta harganya.
6. **Percabangan:**
   - **Bab gratis** → langsung ke reader.
   - **Bab terkunci** → ke reader dengan gerbang unlock (lihat [`prd_05_reader.md`](prd_05_reader.md)).

> **Revisi 5 September 2026 · yang menunggu di ujung tautan itu sudah berubah.**
> Halaman ini tidak berubah, tetapi ruang baca yang ditujunya berubah mendasar,
> dan pembaca PRD yang mengikuti tautan di atas akan menemukan sesuatu yang lain
> dari yang dibayangkannya:
>
> - Bab **tidak lagi berhalaman**. Ia mengalir dalam satu gulir, dipisah garis
>   rambut polos, tanpa satu pun tombol pindah bab (`prd_05` FR-READ-15,
>   dicabut dan diganti).
> - Gerbang bab terkunci **hanya tampil sekali per cerita**. Sesudah izinnya
>   diberikan, bab berikutnya dibeli diam-diam dan langsung menyambung — tanpa
>   toast, tanpa lencana, tanpa yang menghalangi (`prd_05` FR-READ-09).
>
> Akibatnya untuk halaman ini: **daftar bab di sini tetap jadi satu-satunya
> tempat pembaca melihat harga tiap bab sebelum memutuskan.** Di ruang baca,
> harga hanya muncul sekali. `architecture.md` §1.21, §1.25.
   - **Punya voucher** → buka modal voucher → masukkan kode:
     - Kode salah → input bergetar + pesan kesalahan, modal tetap terbuka.
     - Kode benar → seluruh bab terkunci dibuka → modal sukses + confetti → "Lanjut Membaca" → reader.

---

## 3. Daftar Requirement

| ID | Nama | Prioritas |
|---|---|---|
| FR-DETAIL-01 | Hero sampul dengan identitas cerita | P0 |
| FR-DETAIL-02 | Bilah statistik cerita | P1 |
| FR-DETAIL-03 | Aksi utama: simpan & ikuti | P0 |
| FR-DETAIL-04 | Aksi sekunder: rating, ulasan, bagikan, laporkan | P1 |
| FR-DETAIL-05 | Sinopsis dengan buka/tutup | P1 |
| FR-DETAIL-06 | Tag & label cerita | P2 |
| FR-DETAIL-07 | Daftar bab dengan status kunci dan harga | P0 |
| FR-DETAIL-08 | Buka bab dari daftar | P0 |
| FR-DETAIL-09 | Buka bab massal lewat kode voucher | P0 |
| FR-DETAIL-10 | Konfirmasi sukses & lanjut membaca | P0 |
| FR-DETAIL-11 | Navigasi kembali & navigasi bawah | P1 |
| FR-DETAIL-12 | Penghormatan preferensi kurangi animasi | P2 |
| FR-DETAIL-13 | **[BARU]** Simpan ke perpustakaan & ikuti cerita | P0 |
| FR-DETAIL-14 | **[BARU]** Daftar bab penuh dengan paginasi & lanjutan baca | P0 |
| FR-DETAIL-15 | **[BARU]** Bagikan cerita | P2 |

---

## 4. Detail Requirement

### FR-DETAIL-01 — Hero sampul dengan identitas cerita · P0

**Deskripsi.** Sampul cerita mengisi bagian atas layar sebagai gambar penuh, dilapisi gradien gelap dari bawah agar teks tetap terbaca. Di atasnya melayang tombol kembali dan bagikan; di bawahnya judul, penulis, dan lencana.

**User story.** Sebagai pembaca, saya ingin melihat sampul cerita sebesar mungkin agar bisa menilai suasana cerita dalam sekali pandang.

**Aturan bisnis.**
- Sumber gambar: `../../assets/cover_story.webp`, dimuat dengan `loading="lazy"` dan `decoding="async"`, dengan `alt` deskriptif.
- Overlay gradien wajib ada agar teks putih di atas sampul memenuhi kontras.
- Elemen dalam hero, dari atas ke bawah: tombol kembali (kiri) & bagikan (kanan) → pita **"Bestseller"** → judul cerita → baris penulis (avatar + nama + lencana penghargaan).
- Lencana penghargaan memakai `aria-label` lengkap (`"Penghargaan penulis: Top Author 2026"`), bukan hanya teks visual.
- Data prototype: judul **"The CEO's Secret Lover"**, penulis **Amelia Putri**, lencana **"Top Author 2026"**.
- Hero memakai `aria-label="Story cover"`.

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:321` — `.hero`, `.hero-cover-img`, `.hero-overlay`, `.hero-top`, `.hero-info`, `.ribbon`, `.story-title`, `.author-row`, `.award-badge`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat layar atas, **then** sampul tampil penuh dengan judul dan nama penulis terbaca di atasnya.
- **Given** sampul berwarna terang, **when** judul dirender, **then** gradien overlay menjaga teks tetap terbaca.
- **Given** pembaca layar membaca hero, **when** mencapai lencana, **then** teks penghargaan lengkap diumumkan.

---

### FR-DETAIL-02 — Bilah statistik cerita · P1

**Deskripsi.** Tiga angka ringkas yang menempel langsung di bawah sampul tanpa jarak, membentuk satu kesatuan visual dengan hero.

**User story.** Sebagai pembaca, saya ingin melihat seberapa populer sebuah cerita agar bisa memperkirakan kualitasnya sebelum mulai membaca.

**Aturan bisnis.**
- Tepat tiga metrik dengan urutan tetap: **Views**, **Ratings**, **Followers**.
- Data prototype: 985K · 12.4K · 78K.
- Angka disingkat (K/M) agar muat dalam satu baris.
- Wadah memakai `aria-label="Story stats"`.

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:346` — `.statbar`, `.stat-tile`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat area di bawah sampul, **then** ketiga metrik tampil dengan urutan Views–Ratings–Followers.
- **Given** angka melebihi 1.000, **when** dirender, **then** angka disingkat (mis. `985K`), bukan ditulis penuh.

---

### FR-DETAIL-03 — Aksi utama: simpan & ikuti · P0

**Deskripsi.** Dua tombol berdampingan berukuran sama: menambahkan cerita ke perpustakaan, dan mengikuti cerita untuk mendapat pemberitahuan bab baru.

**User story.** Sebagai pembaca, saya ingin menyimpan cerita ke perpustakaan dan mengikutinya agar mudah ditemukan lagi dan saya tahu saat ada bab baru.

**Aturan bisnis.**
- **"Add to Library"** bergaya primer (penekanan lebih tinggi); **"Follow Story"** bergaya sekunder.
- Keduanya berbagi lebar yang sama dalam grid dua kolom.
- Produksi: keduanya harus punya keadaan aktif/nonaktif (mis. "Saved" / "Following") dan mengubah state di server.
- **Belum berfungsi pada prototype** — tidak ada handler (lihat §7).

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:353` — `.actions-grid`, `.action-btn.primary`, `.action-btn`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat kartu aksi, **then** dua tombol berukuran sama tampil dengan "Add to Library" lebih menonjol.
- **Given** pembaca menekan "Add to Library", **when** aksi berhasil *(produksi)*, **then** tombol berubah menjadi keadaan tersimpan dan cerita muncul di `my_library.html`.
- **Given** pembaca menekan "Follow Story", **when** aksi berhasil *(produksi)*, **then** tombol berubah menjadi keadaan mengikuti.

---

### FR-DETAIL-04 — Aksi sekunder: rating, ulasan, bagikan, laporkan · P1

**Deskripsi.** Empat aksi kecil sejajar di bawah tombol utama, untuk interaksi yang lebih jarang dipakai.

**User story.** Sebagai pembaca, saya ingin memberi nilai, membaca ulasan, membagikan, atau melaporkan cerita tanpa aksi-aksi itu mengganggu tombol utama.

**Aturan bisnis.**
- Urutan tetap: **Rate → Review → Share → Report**.
- **Review** adalah satu-satunya yang berupa tautan nyata; tujuannya konstanta `REVIEW_PAGE_URL = "detail_story_tabs.html#reviews-panel"`.
- Handler Review memanggil `preventDefault()` lalu mengarahkan lewat `window.location.href` — atribut `href` tetap disetel agar dapat dibuka di tab baru dan terbaca pembaca layar.
- Rate, Share, dan Report belum memiliki handler (lihat §7).
- Tautan Review memakai `aria-label="Open review page"`.

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:542` `REVIEW_PAGE_URL`; `:543` `#reviewLink`; `.mini-actions`, `.mini-btn`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat baris aksi kecil, **then** empat aksi tampil dengan urutan Rate–Review–Share–Report.
- **Given** pembaca menekan "Review", **when** aksi dijalankan, **then** browser menuju `detail_story_tabs.html#reviews-panel`.
- **Given** pembaca membuka "Review" lewat menu konteks di tab baru, **when** tab terbuka, **then** tujuan yang sama termuat (atribut `href` tetap valid).

---

### FR-DETAIL-05 — Sinopsis dengan buka/tutup · P1

**Deskripsi.** Sinopsis ditampilkan terpotong dengan tombol yang memperluasnya menjadi teks penuh, dan label tombol berubah mengikuti keadaan.

**User story.** Sebagai pembaca, saya ingin membaca ringkasan singkat dulu dan memperluasnya bila tertarik, agar daftar bab tidak terdorong terlalu jauh ke bawah.

**Aturan bisnis.**
- Keadaan awal **terpotong**; kelas `expanded` pada `#synopsis` menentukan keadaan.
- Label tombol: `"Read more →"` saat terpotong ↔ `"Read less ↑"` saat terbuka.
- `aria-expanded` pada tombol harus selalu sinkron dengan keadaan (`"false"` / `"true"`), dan disetel juga saat inisialisasi — bukan hanya saat diklik.
- `aria-controls="synopsisText"` menghubungkan tombol dengan teks yang dikendalikannya.
- Seluruh blok hanya diinisialisasi bila kedua elemen ada (`if (synopsisRoot && synopsisToggle)`), sehingga aman bila salah satu dihapus.

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:531:updateSynopsisLabel(expanded)`; `#synopsis`, `#synopsisText`, `#synopsisToggle`.

**Acceptance criteria.**
- **Given** halaman baru dimuat, **when** pembaca melihat sinopsis, **then** teks terpotong, tombol berbunyi "Read more →", dan `aria-expanded="false"`.
- **Given** sinopsis terpotong, **when** pembaca menekan tombol, **then** teks penuh tampil, label menjadi "Read less ↑", dan `aria-expanded="true"`.
- **Given** sinopsis terbuka, **when** pembaca menekan tombol lagi, **then** teks kembali terpotong dan label kembali "Read more →".

---

### FR-DETAIL-06 — Tag & label cerita · P2

**Deskripsi.** Deretan pil berisi status, model harga, penghargaan, dan genre cerita.

**User story.** Sebagai pembaca, saya ingin melihat genre dan status cerita sekilas agar tahu apakah cerita sudah tamat dan apakah sesuai selera saya.

**Aturan bisnis.**
- Data prototype: `Ongoing` · `FREE` · `Bestseller` · `Drama` · `CEO` · `Romance`.
- Tag mencampur tiga jenis informasi: **status penerbitan**, **model harga**, dan **genre**. Produksi sebaiknya membedakannya secara visual (lihat §7).
- Wadah memakai `aria-label="Story tags"`.
- Tag belum dapat diketuk.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat kartu tag, **then** seluruh tag cerita tampil sebagai pil dan membungkus ke baris berikutnya bila tidak muat.
- **Given** cerita sudah tamat *(produksi)*, **when** halaman dirender, **then** tag status menampilkan "Completed", bukan "Ongoing".

---

### FR-DETAIL-07 — Daftar bab dengan status kunci dan harga · P0

**Deskripsi.** Daftar bab yang membedakan secara visual bab gratis dan bab berbayar. Bab gratis menampilkan panah, bab terkunci menampilkan harga koin dan ikon gembok.

**User story.** Sebagai pembaca, saya ingin langsung melihat bab mana yang bisa saya baca gratis dan berapa harga bab yang terkunci agar bisa memperkirakan biaya melanjutkan cerita.

**Aturan bisnis.**
- Judul panel: **"Chapters"** dengan pil jumlah total (prototype: **"120 Bab"**).
- Status kunci disimpan pada atribut `data-lock` bernilai `"true"` / `"false"` — atribut ini adalah **sumber kebenaran** yang dibaca ulang setiap kali bab diketuk.
- **Bab gratis** (`data-lock="false"`): nomor bab, judul, meta (durasi baca · label), statistik (jumlah suka & jumlah baca), dan panah di kanan.
- **Bab terkunci** (`data-lock="true"`): nomor bab, judul, meta — **tanpa** statistik — dengan pil harga (mis. `1.5rb`, `1.8rb`) dan ikon gembok di kanan.
- Prototype menampilkan 5 bab: 3 gratis dan 2 terkunci.
- Ikon gembok berasal dari `img.icons8.com` (lihat §7).

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:416` — `.chapter-list`, `.chapter-item[data-lock]`, `.chapter-badge`, `.unlock-chip`, `.lock-icon`, `.chapter-stats`.

**Acceptance criteria.**
- **Given** daftar bab dirender, **when** pembaca melihat bab gratis, **then** panah tampil di kanan dan tidak ada harga.
- **Given** pembaca melihat bab terkunci, **when** baris dirender, **then** harga koin dan ikon gembok tampil di kanan.
- **Given** sebuah bab terkunci, **when** baris dirender, **then** statistik suka/baca tidak ditampilkan.
- **Given** panel bab dimuat, **when** pembaca melihat kepala panel, **then** jumlah total bab tampil.

---

### FR-DETAIL-08 — Buka bab dari daftar · P0

**Deskripsi.** Setiap baris bab dapat diketuk maupun diaktifkan lewat papan ketik, dan tujuannya ditentukan oleh status kunci **pada saat diketuk**.

**User story.** Sebagai pembaca, saya ingin mengetuk bab mana pun dan langsung masuk ke halaman baca, tanpa perlu membedakan dulu bab gratis atau berbayar.

**Aturan bisnis.**
- Setiap `.chapter-item` diberi `role="link"` dan `tabindex="0"` secara programatis.
- Aktivasi lewat `click` maupun `keydown` **Enter** / **Space** (`preventDefault()` agar Space tidak menggulir halaman).
- Tujuan dihitung **saat aktivasi** dari `item.dataset.lock`, bukan disimpan saat inisialisasi. Ini penting: setelah voucher membuka bab (FR-DETAIL-09), baris yang sama otomatis mengarah sebagai bab gratis tanpa perlu memasang ulang handler.
- Konstanta tujuan: `FREE_CHAPTER_URL` dan `LOCKED_CHAPTER_URL` — **keduanya bernilai `chapter_read_locked_story_stage.html`**, karena reader itu sendiri yang menangani gerbang unlock.

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:552-553` konstanta; `:556:openChapter()`; loop `:555`.

**Acceptance criteria.**
- **Given** pembaca mengetuk bab gratis, **when** aksi dijalankan, **then** `chapter_read_locked_story_stage.html` terbuka.
- **Given** pembaca mengetuk bab terkunci, **when** aksi dijalankan, **then** halaman reader yang sama terbuka (gerbang unlock ditangani di sana).
- **Given** fokus papan ketik pada sebuah baris bab, **when** pembaca menekan Enter atau Space, **then** reader terbuka dan halaman tidak ikut tergulir.
- **Given** sebuah bab baru saja dibuka lewat voucher, **when** pembaca mengetuk baris itu, **then** tujuan dihitung dari status terbaru (`data-lock="false"`).

---

### FR-DETAIL-09 — Buka bab massal lewat kode voucher · P0

**Deskripsi.** Spanduk khusus di atas daftar bab membuka dialog pemasukan kode. Kode yang benar membuka **seluruh** bab terkunci sekaligus dan mengubah tampilannya menjadi bab gratis.

**User story.** Sebagai pembaca yang memegang kode promo, saya ingin menukarkannya di halaman cerita agar bisa langsung membaca bab-bab terkunci tanpa membeli koin.

**Aturan bisnis.**

**Membuka dialog.**
- Spanduk `#voucherOpen` bergaya garis putus-putus dengan teks `"Punya kode voucher? Buka di sini"` dan `aria-haspopup="dialog"`.
- Saat dibuka, dialog **selalu direset**: pesan kesalahan dikosongkan, isi input dikosongkan, kelas kesalahan dilepas.
- Fokus dipindahkan ke input setelah **150 ms** (menunggu animasi buka selesai).

**Validasi.**
- Kode dibandingkan setelah `trim()` dan `toLowerCase()` — jadi **tidak peka huruf besar-kecil** dan mengabaikan spasi di tepi.
- Kode valid pada prototype: **`promo`** (`VALID_VOUCHER_CODE`).
- Panjang input dibatasi **20 karakter**, `autocomplete="off"`.
- Kode salah:
  - Kelas `err` dilepas, lalu `void voucherCode.offsetWidth` memaksa *reflow* agar animasi getar dapat diputar ulang pada percobaan berturut-turut, lalu kelas `err` dipasang kembali.
  - Pesan: `Kode tidak valid. Coba gunakan "promo".` pada elemen ber-`role="alert"` sehingga langsung dibacakan pembaca layar.
  - Dialog **tetap terbuka**.

**Membuka bab (`unlockChapters()`).**
- Memilih seluruh `.chapter-item[data-lock="true"]`.
- Untuk tiap bab: setel `data-lock = "false"`, ganti isi `.chapter-right` menjadi panah (harga dan gembok hilang), dan kumpulkan nomor bab dari `.chapter-badge`.
- Mengembalikan array nomor bab **terurut menaik**.

**Cara menutup dialog.**

| Cara | Hasil |
|---|---|
| Tombol "Batal" | Dialog tertutup, tidak ada perubahan |
| Klik latar gelap di luar kartu | Dialog tertutup |
| Tombol "Terapkan Kode" dengan kode benar | Dialog tertutup, lanjut ke modal sukses |
| Tekan **Enter** di dalam input | Sama dengan menekan "Terapkan Kode" |

- Membuka/menutup modal juga menyetel `aria-hidden` (`"false"` / `"true"`) selain kelas `show`.

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:573` `VALID_VOUCHER_CODE`; `:581:openModal()`, `:582:closeModal()`, `:596:applyVoucher()`, `:611:unlockChapters()`; elemen `#voucherOpen`, `#voucherModal`, `#voucherCode`, `#voucherErr`, `#voucherApply`, `#voucherCancel`.

**Acceptance criteria.**
- **Given** pembaca menekan spanduk voucher, **when** dialog terbuka, **then** input kosong, tidak ada pesan kesalahan, dan fokus berada di input.
- **Given** pembaca memasukkan `PROMO` (huruf besar) dengan spasi di depan, **when** menekan "Terapkan Kode", **then** kode diterima.
- **Given** pembaca memasukkan `salah`, **when** menekan "Terapkan Kode", **then** input bergetar, pesan `Kode tidak valid. Coba gunakan "promo".` tampil, dan dialog tetap terbuka.
- **Given** pembaca memasukkan kode salah dua kali berturut-turut, **when** percobaan kedua gagal, **then** animasi getar tetap terlihat (tidak "macet" dari percobaan pertama).
- **Given** pembaca mengetik kode benar, **when** menekan **Enter** di dalam input, **then** kode diterapkan tanpa perlu menekan tombol.
- **Given** kode benar diterapkan, **when** proses selesai, **then** seluruh bab yang tadinya terkunci menampilkan panah dan tidak lagi menampilkan harga maupun gembok.
- **Given** dialog terbuka, **when** pembaca mengetuk area gelap di luar kartu, **then** dialog tertutup tanpa perubahan.
- **Given** dialog terbuka, **when** pembaca menekan "Batal", **then** dialog tertutup dan status bab tidak berubah.

---

### FR-DETAIL-10 — Konfirmasi sukses & lanjut membaca · P0

**Deskripsi.** Setelah voucher berhasil, muncul modal perayaan berisi jumlah bab yang terbuka, rentang nomornya, animasi confetti, dan satu tombol untuk langsung membaca.

**User story.** Sebagai pembaca yang baru menukarkan voucher, saya ingin melihat dengan jelas berapa bab yang saya dapat dan langsung mulai membaca agar momen keberhasilannya terasa.

**Aturan bisnis.**
- Pesan disusun dinamis: `"Anda mendapatkan <b>N chapter</b> gratis.<br><rentang> telah dibuka."`
- Format rentang:
  - **1 bab atau kurang** → `"Bab <nomor>"`.
  - **Lebih dari 1 bab** → `"Bab <terkecil>–<terbesar>"` (memakai tanda pisah en-dash).
- Ikon centang tampil dengan animasi `pop` 0,45 detik berkurva pantul.
- **Confetti:** 36 partikel, warna berulang dari palet `#c98b83`, `#e6b7af`, `#f0c9c2`, `#d9a37f`, `#ffffff`; posisi horizontal acak 0–100%; durasi jatuh acak **1,4–2,8 detik**; jeda mulai acak **0–0,4 detik**; setiap partikel dihapus dari DOM setelah **3.400 ms** sehingga tidak menumpuk.
- Tombol **"Lanjut Membaca"** menuju `firstUnlockedUrl`, yang bernilai `FREE_CHAPTER_URL` (`chapter_read_locked_story_stage.html`).

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:624:showSuccess(nums)`; `:636:launchConfetti(container)`; `#successModal`, `#successMsg`, `#successContinue`.

**Acceptance criteria.**
- **Given** voucher membuka bab 4 dan 5, **when** modal sukses tampil, **then** pesan menyebut "2 chapter" dan rentang "Bab 4–5".
- **Given** voucher membuka tepat satu bab, **when** modal sukses tampil, **then** pesan menyebut nomor bab tunggal tanpa tanda pisah.
- **Given** modal sukses tampil, **when** animasi berjalan, **then** confetti jatuh dan hilang dengan sendirinya tanpa menyisakan elemen di DOM.
- **Given** modal sukses tampil, **when** pembaca menekan "Lanjut Membaca", **then** `chapter_read_locked_story_stage.html` terbuka.

---

### FR-DETAIL-11 — Navigasi kembali & navigasi bawah · P1

**Deskripsi.** Tombol kembali melayang di atas sampul, plus bilah navigasi lima tab di bawah layar.

**User story.** Sebagai pembaca, saya ingin kembali ke halaman asal saya — bukan selalu ke beranda — dan tetap bisa berpindah ke area lain aplikasi.

**Aturan bisnis.**
- Tombol kembali memakai pola bertingkat: bila `history.length > 1` maka `history.back()` dan navigasi tautan dibatalkan; bila tidak, tautan `href="home_tabs.html"` yang berlaku. Dengan begitu pembaca kembali ke halaman asalnya (mis. halaman lihat-semua), dan tetap punya tujuan aman saat halaman dibuka langsung.
- Navigasi bawah: Home → `home_tabs.html`, Topup → `topup_koin.html`, Library *(ditandai aktif)* → halaman ini sendiri, Stories → `my_stories.html`, Profile → `../profile.html`.
- Tab "Library" ditandai aktif meski halaman ini bukan perpustakaan, dan Profile menunjuk ke luar folder — keduanya cacat (lihat §7).

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:325` tombol kembali; `:480` `.bottom-nav`.

**Acceptance criteria.**
- **Given** pembaca tiba dari `see_all_popular.html`, **when** menekan tombol kembali, **then** browser kembali ke `see_all_popular.html`.
- **Given** halaman dibuka langsung tanpa riwayat, **when** pembaca menekan tombol kembali, **then** `home_tabs.html` terbuka.
- **Given** pembaca menekan tab "Topup", **when** aksi dijalankan, **then** `topup_koin.html` terbuka.

---

### FR-DETAIL-12 — Penghormatan preferensi kurangi animasi · P2

**Deskripsi.** Bila sistem pengguna meminta pengurangan gerak, seluruh animasi dekoratif dimatikan tanpa menghilangkan fungsi apa pun.

**User story.** Sebagai pengguna yang sensitif terhadap gerakan, saya ingin animasi dekoratif dimatikan agar aplikasi tetap nyaman saya pakai.

**Aturan bisnis.**
Pada `@media (prefers-reduced-motion: reduce)`:
- Animasi getar input voucher dimatikan (`animation: none`) — pesan kesalahan teks tetap tampil.
- Animasi `pop` ikon centang dimatikan — ikon tetap tampil.
- Confetti disembunyikan sepenuhnya (`display: none`).

**Hook implementasi.** `detail_story_alternatif_unified_cover_first.html:311-315`.

**Acceptance criteria.**
- **Given** sistem pengguna menyetel "kurangi gerak", **when** kode voucher salah dimasukkan, **then** input tidak bergetar tetapi pesan kesalahan tetap muncul.
- **Given** preferensi yang sama aktif, **when** modal sukses tampil, **then** confetti tidak ditampilkan dan pesan tetap terbaca.

---

### FR-DETAIL-13 — Simpan ke perpustakaan & ikuti cerita · P0

**Status: BARU.** Kedua tombol sudah ada di `detail_story_alternatif_unified_cover_first.html:354` dan `:358` tetapi tidak punya handler — akibatnya perpustakaan pembaca tidak punya pintu masuk sama sekali.

**Deskripsi.** Dua aksi yang menghubungkan halaman detail dengan perpustakaan dan sistem notifikasi, masing-masing dengan keadaan aktif/nonaktif yang jelas.

**User story.** Sebagai pembaca, saya ingin menyimpan cerita agar mudah saya temukan lagi, dan mengikutinya agar diberi tahu saat ada bab baru.

**Aturan bisnis.**
- **Add to Library** dan **Follow Story** adalah **dua hal berbeda** dan harus dapat diaktifkan sendiri-sendiri:

  | Aksi | Efek |
  |---|---|
  | Add to Library | Cerita masuk ke `my_library.html`; menjadi sumber data satu-satunya bagi koleksi pembaca (lihat [`prd_06_library.md`](prd_06_library.md) FR-LIB-11) |
  | Follow Story | Menyalakan notifikasi bab baru untuk cerita itu; setara dengan sakelar notifikasi di perpustakaan (FR-LIB-08) |

- Menyimpan cerita **otomatis menyalakan** Follow; melepas Follow tidak mengeluarkan cerita dari perpustakaan.
- **Keadaan tombol berubah** setelah aksi: `Add to Library` → `Tersimpan` (dengan ikon terisi); `Follow Story` → `Mengikuti`. Menekan lagi membatalkan.
- Perubahan bersifat **optimistis**: tampilan berubah seketika, lalu disinkronkan ke server; bila gagal, keadaan dikembalikan disertai pesan.
- Keadaan awal tombol dimuat dari server saat halaman dibuka — pembaca yang sudah menyimpan cerita ini melihat "Tersimpan" sejak awal.
- Melepas simpanan dari halaman ini setara dengan **Unsave** di perpustakaan (FR-LIB-09) dan memakai konfirmasi yang sama.

**Acceptance criteria.**
- **Given** cerita belum tersimpan, **when** pembaca menekan "Add to Library", **then** tombol berubah menjadi "Tersimpan" dan cerita muncul di `my_library.html`.
- **Given** pembaca menyimpan cerita, **when** membuka perpustakaan, **then** sakelar notifikasi cerita itu dalam keadaan aktif.
- **Given** pembaca melepas Follow, **when** perpustakaan dirender, **then** cerita tetap ada di koleksi dengan notifikasi mati.
- **Given** cerita sudah tersimpan sebelumnya, **when** halaman detail dibuka, **then** tombol sudah menampilkan keadaan "Tersimpan".
- **Given** penyimpanan gagal karena jaringan, **when** kegagalan diterima, **then** tombol kembali ke keadaan semula disertai pesan.

---

### FR-DETAIL-14 — Daftar bab penuh dengan paginasi & lanjutan baca · P0

**Status: BARU.** Saat ini hanya 5 bab ditampilkan padahal panelnya menyebut "120 Bab".

**Deskripsi.** Daftar bab yang benar-benar memuat seluruh bab, dengan penanda bab yang sudah dibaca dan pintasan melanjutkan.

**User story.** Sebagai pembaca, saya ingin melihat seluruh bab, tahu mana yang sudah saya baca, dan langsung melompat ke tempat saya berhenti.

**Aturan bisnis.**
- Menampilkan **20 bab per muat** dengan tombol muat lebih banyak atau gulir tak terbatas, memakai kartu skeleton yang sudah ada di `see_all_*`.
- **Urutan dapat dibalik** (bab pertama dulu / bab terbaru dulu); default bab pertama dulu.
- **Tiga penanda keadaan per baris**, di luar status kunci yang sudah ada (FR-DETAIL-07): sudah dibaca · sedang dibaca (bab terakhir yang dibuka) · belum dibaca. Bersumber dari progres baca (lihat [`prd_05_reader.md`](prd_05_reader.md) FR-READ-16).
- **Tombol utama "Lanjutkan — Bab N"** di atas daftar, langsung menuju bab terakhir yang dibaca. Bila belum pernah membaca, tombol berbunyi **"Mulai dari Bab 1"**.
- Kolom pencarian bab muncul bila jumlah bab lebih dari 20.
- Harga bab terkunci diambil per bab dari server, bukan konstanta — menutup ketidaksesuaian antara harga yang ditampilkan (`1.5rb`, `1.8rb`) dan harga yang ditagih reader (selalu 1.500).

**Acceptance criteria.**
- **Given** cerita punya 120 bab, **when** daftar dirender, **then** 20 bab pertama tampil beserta jalan memuat sisanya.
- **Given** pembaca sudah membaca sampai bab 18, **when** halaman dirender, **then** tombol utama berbunyi "Lanjutkan — Bab 18".
- **Given** pembaca belum pernah membaca cerita ini, **when** halaman dirender, **then** tombol berbunyi "Mulai dari Bab 1".
- **Given** bab 1–17 sudah dibaca, **when** daftar dirender, **then** ketujuh belas bab itu bertanda sudah dibaca.
- **Given** pembaca membalik urutan, **when** daftar dirender ulang, **then** bab terbaru berada di atas.

---

### FR-DETAIL-15 — Bagikan cerita · P2

**Status: BARU.** Tombol bagikan ada di dua tempat (hero `:328` dan aksi kecil `:372`) tanpa handler.

**Deskripsi.** Membagikan tautan cerita lewat mekanisme berbagi bawaan perangkat.

**User story.** Sebagai pembaca, saya ingin merekomendasikan cerita ke teman lewat aplikasi apa pun yang saya pakai.

**Aturan bisnis.**
- Memakai **Web Share API** bila tersedia; bila tidak, tampilkan lembar berisi tautan beserta tombol salin.
- Isi yang dibagikan: judul cerita · nama penulis · tautan detail cerita.
- Dua tombol bagikan (di hero dan di aksi kecil) menjalankan aksi yang **sama persis** — tidak ada perbedaan perilaku.
- Bila pengguna punya kode referral aktif (lihat [`prd_09_wallet_rewards.md`](prd_09_wallet_rewards.md) FR-RWD-04), tautan menyertakannya.

**Acceptance criteria.**
- **Given** peramban mendukung Web Share API, **when** pembaca menekan bagikan, **then** lembar berbagi sistem terbuka berisi judul, penulis, dan tautan.
- **Given** peramban tidak mendukungnya, **when** pembaca menekan bagikan, **then** lembar berisi tautan dan tombol salin tampil.
- **Given** pembaca menekan tombol bagikan di hero maupun di aksi kecil, **when** aksi dijalankan, **then** keduanya menghasilkan perilaku yang sama.

---

## 5. State & Persistensi

**Tidak ada `localStorage`.** Seluruh state hidup di DOM.

| State | Tempat | Hilang saat |
|---|---|---|
| Status kunci per bab | Atribut `data-lock` pada `.chapter-item` | Halaman dimuat ulang |
| Sinopsis terbuka/tertutup | Kelas `expanded` | Halaman dimuat ulang |
| Modal terbuka | Kelas `show` + `aria-hidden` | Halaman dimuat ulang |
| Bab pertama yang terbuka | Variabel `firstUnlockedUrl` | Halaman dimuat ulang |

**Konsekuensi:** bab yang dibuka lewat voucher **kembali terkunci** setelah halaman dimuat ulang. Ini gap utama modul ini (lihat §7).

---

## 6. Navigasi

**Masuk ke modul:** `home_tabs.html` (semua kartu cerita) · `see_all_popular.html` · `see_all_new_trending.html` · `see_all_editors_picks.html` · `my_library.html` · `my_stories.html` · `other_user_profile.html` · `edit_story.html` · `topup_detail.html`.

**Keluar dari modul:** `chapter_read_locked_story_stage.html` (bab & lanjut baca) · `detail_story_tabs.html#reviews-panel` *(menggantung)* · `home_tabs.html` · `topup_koin.html` · `my_stories.html` · `../profile.html` *(menggantung)*.

---

## 7. Catatan Prototype vs Produksi

| # | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | **Status buka bab tidak bertahan** — hasil voucher hilang saat halaman dimuat ulang | Pembaca kehilangan bab yang sudah ditukar | Simpan kepemilikan bab di server; muat status saat halaman dibuka |
| 2 | **Kode voucher di-hardcode** (`"promo"`) — sudah ditandai `ponytail:` di kode | Siapa pun dapat menebak kode | Validasi ke Gamification Service (`../../docs/api_voucher.md`); kode sekali pakai, ada masa berlaku, terikat akun |
| 3 | **Voucher membuka SELURUH bab terkunci** tanpa memandang cakupan kode | Terlalu longgar untuk produksi | Kembalikan daftar `chapter_id` yang berhak dibuka dari server; buka hanya yang tercantum |
| 4 | **Add to Library, Follow, Rate, Share, Report tanpa handler** | Lima aksi tidak berfungsi | Sambungkan ke endpoint; tambahkan keadaan aktif/nonaktif |
| 5 | **Tautan Review menggantung** — `detail_story_tabs.html` tidak ada di folder | Menuju 404 | Buat halaman ulasan atau alihkan ke panel ulasan di halaman ini |
| 6 | **Tab Profile menunjuk `../profile.html`** yang tidak ada | Menuju 404 | Ubah ke `profile.html` |
| 7 | **Tab "Library" ditandai aktif** padahal halaman ini bukan perpustakaan | Indikator posisi menyesatkan | Nonaktifkan penanda aktif, atau tandai tab yang sesuai asal navigasi |
| 8 | **`FREE_CHAPTER_URL` dan `LOCKED_CHAPTER_URL` bernilai sama** | Perbedaan tujuan bab gratis vs terkunci tidak ada | Sengaja untuk prototype; produksi tetap boleh satu reader, tetapi kirim `chapter_id` sebagai parameter |
| 9 | **Ikon gembok dari `img.icons8.com`** | Gagal saat offline; ketergantungan pihak ketiga | Ganti dengan SVG inline |
| 10 | **Avatar penulis dari `randomuser.me`** | Sama seperti di atas | Ganti dengan aset atau URL dari API |
| 11 | Seluruh isi cerita, bab, dan statistik hardcoded | Tidak mencerminkan data nyata | Sambungkan ke `../../docs/api_story_detail.md` |
| 12 | Hanya 5 bab ditampilkan padahal jumlahnya 120 | Tidak ada paginasi | Tambahkan muat-lebih-banyak atau gulir tak terbatas |
| 13 | Tag mencampur status, harga, dan genre dalam satu deret | Sulit dipindai | Pisahkan secara visual (status/harga sebagai lencana, genre sebagai pil) |
| 14 | UI berbahasa Inggris bercampur dengan modal voucher berbahasa Indonesia | Bahasa campur | Seragamkan mengikuti pengaturan bahasa |
