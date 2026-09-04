# PRD Novelova — Design System (Warna, Tipografi, Komponen)

> ## Salinan `novelova-v2/`
>
> **Diganti hampir seluruhnya.** Palet dan tipografi produksi v2 adalah putaran 7, bukan rose-gold PRD 01.
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Dokumen ini merekam sistem visual **apa adanya** dari 34 halaman di `original/fix_ui/`, lengkap dengan angka terukur (frekuensi pemakaian tiap warna/font), lalu memberi rekomendasi konsolidasi untuk produksi.
> Induk: [`prd_00_overview.md`](prd_00_overview.md).

---

## 0. Design system v2 — putaran 7 · **ini yang berlaku**

> Ditetapkan permintaan produk 4 September 2026. Menggantikan §3 (warna) dan §4
> (tipografi) di bawah untuk `novelova-v2/`. Alasan lengkapnya
> [`../architecture.md`](../architecture.md) §1.20; acuan gambarnya 27 PNG di
> `Novel reader UI redesign/putaran7/`.
>
> §1–§9 di bawah **tetap dipertahankan** sebagai survei terukur atas prototipe —
> ia catatan yang masih benar tentang apa yang dulu ada, dan dari sanalah angka
> frekuensi pemakaian warna berasal. Yang berubah cuma statusnya: bukan lagi
> acuan produksi.

### 0.1 Permukaan & garis

| Peran | Nilai | Catatan |
|---|---|---|
| Kertas halaman | `#f4f2ef` | |
| Panel putih | `#ffffff` | |
| Permukaan baca | `#faf8f5` | Sedikit lebih hangat dari kertas |
| Malam — halaman | `#171513` | Mode baca malam (`7g`) |
| Malam — panel | `#211d19` | |
| Pembatas | `#e6e2db` | Garis di dalam daftar |
| Tepi wadah | `#e2ddd5` | |
| Garis bawah input | `#dcd6cd` | 1,5px |

**Garis menggantikan bayangan.** Bayangan hanya boleh di **sampul buku**
(`0 4px 12px rgb(28 26 24 / .14)`) dan di elemen yang benar-benar melayang
(modal, popover, toast, FAB, bilah reader mengambang). Panel diberi garis.

### 0.2 Tinta

| Peran | Nilai | Kontras di kertas |
|---|---|---|
| Utama | `#1c1a18` | 15,4:1 |
| Sekunder | `#4a443e` | 8,6:1 |
| Metadata | `#6f6862` | **4,9:1** |
| Nonaktif | `#c4bcb2` | — |
| Isi bab (malam) | `#ddd6cd` | Sengaja lebih redup dari teks antarmuka |

**Dua koreksi terhadap mockup, dan keduanya wajib.** Mockup memakai `#8a827a`
untuk teks metadata (**3,38:1**) dan `#b8b0a8` untuk label `BERSPONSOR`
(**2,3:1**); keduanya gagal AA. Dinaikkan ke tinta metadata di atas. Preseden
identik sudah ada di §9.2 rekomendasi #8, yang menaikkan muted rose-gold dari
`#928582` ke `#6f6462` atas alasan yang sama.

### 0.3 Aksen — dan emas ada **dua**

| Token | Nilai | Dipakai untuk |
|---|---|---|
| Aksi | `#1c1a18` | Tombol utama, tab aktif, garis bawah tab. **Bukan emas** |
| Emas teks | `#7d5411` | Saldo koin, rating, harga bab terkunci, `See all`, `+23 bonus` — **5,98:1** |
| Emas garis | `#b68235` | Garis judul bab, batang progres, titik tab aktif, seluruh aksen malam |

**Emas tidak pernah jadi isi besar.** Dan menukar kedua emas itu membuat setiap
angka koin, rating, dan harga di aplikasi gagal AA sekaligus — `#b68235` hanya
3,01:1 di atas kertas.

Brief putaran 7 sendiri **tidak pernah menyebut hex emasnya**; kedua nilai di
atas diambil dari piksel mockup.

### 0.4 Tipografi — dua muka, satu tugas masing-masing

| Muka | Tugas |
|---|---|
| **Lora** (serif) | Yang *adalah* cerita: judul cerita, judul bab, isi bab, isi komentar, judul layar, dan angka di dalam blok statistik |
| **Plus Jakarta Sans** (sans) | Yang dikatakan aplikasi tentang dirinya: label, metadata, tombol, chip, penghitung, teks status |

Menggantikan Cormorant Garamond + Manrope. Tetap self-host lewat `@fontsource`
(syarat offline §4.2 tetap berlaku), dan **runtime tetap 12 paket** — tukar dua,
bukan tambah dua.

**Satu pengecualian ukuran huruf.** §4.4 menetapkan 12px sebagai lantai karena
prototipe memakai 9–11px sebanyak 298×. Putaran 7 menetapkan kepala section
**9,5px / 800 / `.16em` huruf besar**. Keduanya berlaku: 9,5px **hanya** untuk
label pendek berbobot 800 berjarak huruf lebar (`POPULER`, `BERSPONSOR`,
`KOIN KAMU`, `PRATINJAU TERSENSOR`); 12px tetap lantai untuk kalimat.

### 0.5 Bentuk

- **Sampul**: potret 2:3, radius **4–6px**, satu bayangan. Ubin "album art"
  membulat dilarang. Tanpa artwork → **jaket satu huruf** di atas salah satu dari
  tiga dasar gelap, dipilih dari judulnya sendiri.
- **Tombol**: utama isi `#1c1a18` pill · sekunder pill garis rambut · tersier
  teks tebal tinta redup. **Destruktif tidak pernah isi merah.**
- **Saringan**: tab teks bergaris bawah 2px. Pil **hanya** di tempat mockup
  menggambar pil (genre tambahan, tag, saran pencarian).
- **Sakelar**: jalur 44×26, knob 20, jarak tempuh 18px. Nyala `#1c1a18`, atau
  emas di baca-malam.
- **Formulir**: satu baris → garis bawah 1,5px dengan teks serif; banyak baris →
  kotak garis rambut membulat. Penghitung rata kanan **di baris label**.
- **Daftar mengalahkan kartu.** Kartu hanya untuk banner, editor's picks, slot
  iklan, grup formulir, lembar pengaturan, dan gerbang bab terkunci.

### 0.6 Yang dilarang

Bayangan berat · gradien di luar satu glow radial sampul gelap · **emoji** ·
warna aksen baru · sampul membulat ala album.

---

## 1. Prinsip Visual

| Prinsip | Wujud di UI |
|---|---|
| **Hangat & kertas** | Latar krem/beige, bukan putih murni. Teks cokelat gelap, bukan hitam. Kesan buku cetak. |
| **Rose gold sebagai identitas** | Aksen merah-muda keemasan (`#d09a93` / `#c98b83`) untuk aksi utama, badge, dan status aktif. |
| **Frame HP eksplisit** | Setiap halaman menggambar "bodi ponsel" di tengah viewport desktop, lengkap dengan sudut membulat dan bayangan tebal. |
| **Kartu bertumpuk** | Konten dipecah jadi kartu radius besar dengan bayangan lembut di atas latar krem. |
| **Serif untuk judul, sans untuk UI** | Cormorant Garamond untuk judul cerita/heading, Manrope untuk label & tombol. |
| **Pill & lingkaran** | Radius `999px` adalah radius paling sering dipakai (112×) — chip, tombol, badge, avatar. |

---

## 2. Tiga Sub-Sistem Desain (kondisi saat ini)

Folder ini **bukan** satu sistem desain tunggal. Ada tiga keluarga visual yang hidup berdampingan — berbeda pada font, ukuran frame, dan radius. **Latar halaman sudah diseragamkan** (§2.0); sisanya masih berbeda dan dicatat di bawah sebagai temuan, bukan requirement.

### 2.0 Backdrop halaman — SERAGAM di 34 halaman

Latar di luar frame ponsel memakai satu nilai yang sama di seluruh halaman:

```css
background:
  radial-gradient(circle at 18% 8%, #f2c9a8 0 14%, transparent 36%),
  linear-gradient(135deg, #ead9cb, #f8f0e7 46%, #b8957c);
```

Nilai ini diambil dari `home_tabs`, `profile`, dan `topup_koin` — tiga halaman yang disentuh commit desain terakhir, sehingga mewakili arah visual terbaru.

Sebelum diseragamkan, folder ini memuat **12 nilai latar berbeda**: sembilan halaman krem datar `#eee7e1`, dua `#efe8e2`, tujuh varian gradien krem yang berbeda tipis (titik pusat 14–84%, sudut 135–145°, warna akhir `#b8957c`/`#c9ad98`/`#ccb19d`/`#d9c5b7`/`#d6c1b4`/`#cfb39f`), satu pasang gradien khusus reader–detail cerita, tiga halaman gelap rata `#0e0e0f`, dan satu gradien gelap pada `topup_restyled`.

Setiap `body` juga dijamin setinggi layar (`min-height:100vh` atau `height:100%`) agar gradien selalu memenuhi halaman.

Bersamaan dengan itu, **bayangan frame yang masih hitam pekat ikut diganti** — `see_all_*` (×3), `profile`, `chapter_read_locked_story_stage`, dan `topup_restyled` sebelumnya memakai `rgba(0,0,0,.46–.55)` yang dirancang untuk latar gelap. Rinciannya di §5.4.

> Latar **di dalam** frame (`.phone`) tetap berbeda per sub-sistem dan tidak ikut diseragamkan — lihat §2.1–§2.3.

### 2.1 Klasik `fix_ui` — 26 halaman

Mayoritas halaman. Krem, Google Fonts, frame tinggi tetap.

- **Halaman:** `login`, `register`, `forgot_password`, `settings_language`, `settings_security`, `privacy`, `terms`, `help_center`, `edit_profile`, `other_user_profile`, `my_library`, `my_stories`, `manage_chapters`, `create_story`, `edit_story`, `create_chapter`, `edit_chapter`, `chapter_access`, `story_analytics`, `story_print_history`, `transaction_history`, `rewards_center`, `author_analytics`, `author_withdraw`, `topup_koin`, `topup_detail`
- **Backdrop:** backdrop seragam (lihat §2.0)
- **Frame:** `width:min(420px,100%)` · `height:820px` (tetap) · `border-radius:26–28px` · `border:1px solid #d8c5b9 / #dfd2ca / #d4bdaa` · `box-shadow:0 20–24px 60–72px rgba(48,40,37,.18–.24)` · latar `#fcf8f2` / `#fbf8f5` / `#fbf6ef`
- **Body:** `display:grid; place-items:center; padding:20px`
- **Font:** `Manrope, Arial, sans-serif` (body) + `"Cormorant Garamond", serif` (judul)
- **Warna teks:** `#302825`

### 2.2 Restyled Rose-Gold — 5 halaman

Token CSS bernama, bottom-nav SVG, radius lebih besar.

| Halaman | Frame | Aksen |
|---|---|---|
| `home_tabs` | `min(420px,100%)` × `min(820px, 100vh-36px)`, radius **30px**, border `#d4bdaa` | `--accent:#D09A93` |
| `profile` | `.container` sejenis | `--rose-gold:#d09a93` |
| `see_all_popular` | `min(420px,100%)` × `min(920px, 100vh-36px)`, radius **34px**, tanpa border | `--accent:#d09a93` |
| `see_all_new_trending` | idem | `--accent:#55a7b1` (teal) |
| `see_all_editors_picks` | idem | `--accent:#9f7a54` (bronze) |

- **Token bersama:** `--bg:#f4efea` · `--card:#fffdfc` · `--text:#2e2625` · `--muted:#928582` · `--line:rgba(46,38,37,.08)` · `--shadow:0 10px 24–30px rgba(30,30,30,.07–.08)`
- **Font:** `home_tabs` & trio `see_all_*` memakai **system stack** `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial` dan **tidak memuat Google Fonts sama sekali**. `profile` memakai Manrope + `--font-display: "Cormorant Garamond", "Iowan Old Style", Georgia, serif`.

> **Catatan penting:** trio `see_all_*` memakai **aksen berbeda per halaman**. Ini disengaja sebagai penanda kategori, tetapi menyimpang dari identitas rose-gold tunggal.

### 2.3 Frame Sempit Gelap — 2 halaman

- **Halaman:** `chapter_read_locked_story_stage` (reader), `topup_restyled`
- **Frame:** `width:360px` · `height:min(790px, 100vh-32px)` · `border-radius:28px` · `background:linear-gradient(180deg,var(--paper-2),var(--paper))` · `box-shadow:0 24px 64–68px rgba(0,0,0,.46–.48)`
- **Backdrop:** seragam (§2.0). Reader tetap mendukung tema gelap di dalam frame lewat kelas `.phone.dark`.
- **Font:** `"Trebuchet MS","Segoe UI",sans-serif` untuk UI; reader memakai `"Georgia","Times New Roman",serif` untuk isi bab
- **Tanpa Google Fonts.**

### 2.4 Halaman lain

`detail_story_alternatif_unified_cover_first` memakai Google Fonts (Cormorant + Manrope) dengan frame 390px — jembatan antara klasik dan restyled.

---

## 3. Sistem Warna

> **Digantikan §0.1–§0.3 untuk `novelova-v2/`.** Angka frekuensi di bawah tetap benar sebagai survei prototipe.

### 3.1 Token Semantik (yang seharusnya dipakai produksi)

| Token | Nilai | Peran |
|---|---|---|
| `--bg` | `#f4efea` | Latar layar aplikasi |
| `--card` | `#fffdfc` | Permukaan kartu |
| `--paper` | `#fffdfa` (gelap: `#161a20`) | Permukaan halaman reader/sheet |
| `--paper-2` | `#fff8f4` / `#f8f2ec` (gelap: `#1b2028`) | Gradien atas permukaan |
| `--text` / `--ink` | `#2e2625` · `#302825` · `#4a342e` (gelap: `#efe9e6`) | Teks utama |
| `--muted` | `#928582` · `#867f7e` · `#837b79` (gelap: `#b4adb0`) | Teks sekunder |
| `--line` | `rgba(46,38,37,.08)` – `rgba(39,35,34,.12)` | Garis pemisah |
| `--line-soft` | `rgba(46,43,43,.055–.07)` | Garis sangat halus |
| `--accent` | `#d09a93` (rose gold) / `#c98b83` | Aksi utama, status aktif |
| `--accent-2` | `#f0c9c2` | Aksen terang, latar badge |
| `--accent-soft` | `rgba(208,154,147,.18)` / `rgba(201,139,131,.15–.16)` | Latar chip aktif |
| `--accent-strong` / `--accent-deep` | `#b8695f` · `#b56e65` · `#c38e87` | Hover / tekanan |
| `--coin` | `#d7ad64` · `#bf8f46` · `#c99b6c` | Ikon & angka koin |
| `--shadow` | `0 10px 24–30px rgba(30,30,30,.07–.08)` (frame: `0 24–30px 64–90px rgba(0,0,0,.46–.55)`) | Elevasi |

### 3.2 Warna Terukur (frekuensi nyata di seluruh folder)

| Hex | Dipakai | Peran |
|---|---|---|
| `#fff` | **292×** | Permukaan & teks di atas aksen |
| `#302825` | **236×** | Ink utama sistem klasik; latar tombol primer |
| `#eadbd0` | 59× | Garis/latar lembut |
| `#77665c` | 55× | Teks sekunder klasik |
| `#927a6b` | 42× | Teks tersier / ikon |
| `#e3d0c0` | 41× | Border kartu |
| `#9b604b` | 40× | Aksen cokelat (top-up, koin) |
| `#fff7ef` | 31× | Latar kartu hangat |
| `#fffaf4` | 26× | Latar kartu hangat alternatif |
| `#e0cdbc` | 26× | Border |
| `#766862` | 26× | Teks muted |
| `#d4bdaa` | 24× | Border frame |
| `#e7dbd4` | 21× | Garis |
| `#76513f` | 20× | Teks cokelat tua |
| `#3f8e60` | 20× | **Status sukses** (hijau) |
| `#fbf8f5` | 19× | Latar frame |
| `#eee4df` | 19× | Latar sekunder |
| `#fbf6ef` | 17× | Latar frame |
| `#a34436` | 17× | **Status bahaya/gagal** (merah) |
| `#c99494` | 12× | Aksen rose |
| `#8d615c` | 10× | Warna tautan |
| `#eee7e1` | 9× | Latar halaman |
| `#487083` | 9× | Aksen info (biru) |
| `#c99b6c` | 7× | Koin |
| `#f4efea` | 5× | Latar restyled |
| `#c98b83` | 5× | Aksen reader/top-up |
| `#f2c9a8` · `#ead9cb` · `#f8f0e7` · `#b8957c` | 34 halaman | Backdrop seragam di luar frame (§2.0) |

### 3.3 Warna Status

| Status | Warna | Latar lembut |
|---|---|---|
| Sukses / terbit | `#3f8e60` | `#e8f3e9` |
| Bahaya / gagal / hapus | `#a34436` | `#f6d9d2` · `#f4e3dc` |
| Menunggu / draft | `#9b604b` · `#a0682e` | `#f5e2d0` · `#f3d0ad` |
| Info | `#487083` · `#1b5c64` | — |
| Koin | `#c99b6c` · `#d7ad64` | — |

### 3.4 Aksen per Kategori (trio `see_all_*`)

| Halaman | `--accent` | `--accent2` | `--soft` |
|---|---|---|---|
| Popular | `#d09a93` | `#f0c9c2` | `rgba(208,154,147,.18)` |
| New & Trending | `#55a7b1` | `#bfe9e8` | `rgba(85,167,177,.16)` |
| Editor's Picks | `#9f7a54` | `#ead1ab` | `rgba(159,122,84,.16)` |

---

## 4. Tipografi

> **Digantikan §0.4 untuk `novelova-v2/`**, kecuali lantai 12px di §4.4 yang tetap berlaku.

### 4.1 Keluarga Font

| Font | Deklarasi | Peran | Halaman |
|---|---|---|---|
| **Cormorant Garamond** | **107×** | Judul cerita, heading, angka besar, nama penulis | 28 halaman (semua yang memuat Google Fonts) |
| **Manrope** | **29×** | Seluruh UI: label, tombol, body, angka | 28 halaman yang sama |
| **Trebuchet MS** | **16×** | UI di frame sempit gelap | `chapter_read_locked_story_stage`, `topup_restyled` |
| **Georgia** | 1× | **Isi bab** di reader (+1 pemakaian di `profile`) | `chapter_read_locked_story_stage` |
| **System stack** `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial` | 4× | Seluruh UI | `home_tabs`, trio `see_all_*` |
| **`ui-monospace, Consolas, monospace`** | 1× | Nomor virtual account / kode | `topup_koin` |

### 4.2 Sumber Font

- **28 file** memuat Google Fonts lewat `<link>`, dua varian URL:
  - `css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap` (22×)
  - varian dengan `Manrope:…;800;900` (6×)
- **6 file tidak memuat Google Fonts sama sekali:** `home_tabs`, trio `see_all_*`, `chapter_read_locked_story_stage`, `topup_restyled`.
- **Alias:** `profile` mendefinisikan `--font-display: "Cormorant Garamond", "Iowan Old Style", Georgia, serif` dan memakainya 6×.

> **Requirement produksi:** font harus di-*self-host* (lihat `../../pwa/pwa_implementation_plan.md`) agar aplikasi bisa berjalan offline dan tidak bergantung CDN pihak ketiga.

### 4.3 Bobot yang Dipakai

| Bobot | Frekuensi | Catatan |
|---|---|---|
| 900 | **243×** | Bobot paling dominan — dipakai untuk hampir semua label & judul |
| 700 | 137× | Penekanan sedang |
| 800 | 107× | Judul kartu |
| 750 / 760 / 780 / 820 / 850 / 950 | 28× total | Bobot variabel Manrope, dipakai sporadis |

> **Temuan:** bobot 900 dipakai berlebihan sehingga hierarki tipografi tipis (semuanya terasa tebal). Rekomendasi konsolidasi ada di §9.

### 4.4 Skala Ukuran (terukur)

| Ukuran | Frekuensi | Peran umum |
|---|---|---|
| 9px | 42× | Micro-label, badge |
| 10px | **135×** | Caption, meta, label chip |
| 11px | **121×** | Teks sekunder |
| 12px | **91×** | Body kecil, label tombol |
| 13px | 41× | Body |
| 14–16px | 36× | Body besar, judul kartu |
| 18px | 9× | **Ukuran default isi bab reader** (`--reader-font-size:18px`) |
| 20–22px | 36× | Judul section |
| 24–27px | 56× | Judul halaman |
| 28–32px | 18× | Judul besar |
| 38–42px | 19× | Angka statistik & judul hero cover |

> **Temuan aksesibilitas:** 9–11px adalah ukuran paling sering dipakai (298× gabungan). Untuk produksi, body minimum sebaiknya 12–14px agar terbaca di layar HP.

---

## 5. Layout & Frame

### 5.1 Spesifikasi Frame

| Sub-sistem | Lebar | Tinggi | Radius | Border | Shadow |
|---|---|---|---|---|---|
| Klasik | `min(420px, 100%)` | `820px` (tetap) | 26–28px | `1px solid #d8c5b9 / #dfd2ca / #d4bdaa` | `0 20–24px 60–72px rgba(48,40,37,.18–.24)` |
| Restyled (home/profile) | `min(420px, 100%)` | `min(820px, 100vh − 36px)` | 30px | `1px solid #d4bdaa` | `0 26px 76px rgba(48,40,37,.26)` |
| Restyled (see_all) | `min(420px, 100%)` | `min(920px, 100vh − 36px)` | 34px | — | `0 30px 90px rgba(0,0,0,.55)` |
| Frame sempit gelap | `360px` (`max-width:100%`) | `min(790px, 100vh − 32px)` | 28px | — | `0 24px 64–68px rgba(0,0,0,.46–.48)` |

### 5.2 Struktur Dalam Frame

```
.phone
 ├─ .safe-top      (22px, gradien bayangan halus — opsional)
 ├─ .app  (flex column, height:100%)
 │   ├─ header / topbar   (sticky, tinggi ±56px)
 │   ├─ .content          (flex:1; overflow:auto; padding 14px 14px 140px)
 │   └─ bottom nav        (5 tab, sticky bawah)
 └─ .safe-bottom  (18px)
```

Padding bawah `.content` **140px** menyisakan ruang untuk bottom nav + FAB.

### 5.3 Skala Radius

| Nilai | Frekuensi | Dipakai untuk |
|---|---|---|
| `999px` | **112×** | Pill: chip, badge, tombol bulat, tab |
| `50%` | 64× | Avatar, ikon bulat |
| `18px` | 53× | Kartu utama (`--radius-lg`) |
| `14px` | 49× | Kartu kecil, input (`--radius-md`) |
| `16px` | 43× | Kartu sedang |
| `10–13px` | 56× | Elemen kecil (`--radius-sm:12px`) |
| `20–24px` | 48× | Kartu besar, sheet (`--radius-xl:22px`) |
| `26–34px` | 40× | Frame ponsel |
| `28px 28px 0 0` | 6× | **Bottom sheet** (sudut atas saja) |

### 5.4 Elevasi

| Token | Nilai | Dipakai |
|---|---|---|
| `--shadow-soft` | `0 6–8px 16–18px rgba(30,30,30,.06)` | Kartu |
| `--shadow` | `0 10–12px 24–30px rgba(30,30,30,.07–.08)` | Kartu menonjol, popover |
| Frame | `0 20–26px 60–76px rgba(48,40,37,.18–.26)` — seluruhnya bernada hangat | Bodi ponsel |

Bayangan frame **tidak boleh memakai hitam murni**. Enam halaman sebelumnya memakai `rgba(0,0,0,.46–.55)` — sisa dari masa ketika latarnya gelap; di atas latar krem bayangan itu tampak sebagai noda gelap. Seluruhnya sudah diganti ke nilai frame yang paling sering dipakai, `0 20px 60px rgba(48,40,37,.18)`.

Hitam murni tetap boleh dipakai untuk dua hal: bayangan di dalam **tema gelap** reader (`.phone.dark`), dan **kartu modal** yang mengambang di atas overlay gelap.

---

## 6. Komponen

| Komponen | Anatomi | Halaman |
|---|---|---|
| **Top bar** | Tombol kembali (chevron kiri, lingkaran) + judul tengah + aksi kanan opsional; sticky | Semua kecuali beranda |
| **Header beranda** | Sapaan "Hi, Anna" + ikon Search / Notifications / Section settings | `home_tabs` |
| **Bottom nav** | 5 tab ikon SVG + label, tab aktif memakai `--accent`; `role="button"` + `tabindex` (mendukung klik & Enter/Space) | 7 halaman |
| **Kartu cerita (grid)** | Cover 2:3, judul (serif), penulis, meta rating/views, badge HOT/NEW | Beranda, see_all, library |
| **Kartu cerita (list)** | Cover kecil kiri + teks kanan + progress bar | Top Romance, Continue Reading, library |
| **Banner carousel** | Hero full-width, judul besar, rating, tombol "Read now", indikator titik | `home_tabs` |
| **Chip / tab genre** | Pill `999px`, scroll horizontal, fade tepi kiri/kanan saat scrollable | `home_tabs`, filter |
| **Chapter row** | Nomor + judul + meta; state terkunci = gembok + harga koin, state gratis = chevron | Detail cerita, manage_chapters |
| **Bottom sheet** | Radius `28px 28px 0 0`, handle bar, judul, isi, tombol aksi ganda | Scheduler, print, publish, konfirmasi |
| **Modal tengah** | Kartu radius besar + overlay gelap; dipakai untuk voucher & sukses | Detail cerita, top-up |
| **Overlay pembayaran** | Layar penuh dalam frame: loading / menunggu + timer / QRIS / VA / sukses / gagal | `topup_koin` |
| **Toast** | Bar bawah, muncul-hilang, teks status singkat | Hampir semua halaman |
| **Toggle / switch** | Pill `999px` dengan knob lingkaran, kelas `.on` | Popover section, privasi, keamanan, reader |
| **Badge status** | Pill kecil warna status (§3.3) | Draft/Terbit/Terjadwal, status transaksi |
| **Coin chip** | Ikon koin (`--coin`) + angka + label saldo | Reader, top-up, profil |
| **FAB** | Tombol bulat mengambang kanan-bawah di atas bottom nav | `home_tabs` (top-up) |
| **Kartu iklan** | Slot banner & native ad dengan label "Ad" di sudut | `home_tabs`, reader |
| **Empty / autosave notice** | Kartu tipis dengan tombol aksi ("Pulihkan draft") | create/edit story |
| **Confetti** | Partikel warna-warni saat sukses (unlock voucher, top-up) | Detail cerita, `topup_koin` |

---

## 7. Ikonografi

| Sumber | Dipakai di | Catatan |
|---|---|---|
| **FontAwesome 6.5.x** (cdnjs) | `login`, `register`, `chapter_read_locked_story_stage` | Versi tidak seragam: 6.5.1 vs 6.5.2 |
| **Inline SVG** | `home_tabs`, `profile`, trio `see_all_*`, bottom nav di semua halaman restyled | Stroke-based, mengikuti `currentColor` |
| **Glyph teks** | Chevron `‹`, bintang `★` | Tersebar |

**Requirement produksi:** satukan ke satu set ikon inline SVG (hilangkan ketergantungan CDN FontAwesome), ukuran grid 16/20/24px.

---

## 8. Aset & Dependensi Eksternal

| Sumber | Jumlah rujukan | Isi |
|---|---|---|
| `fonts.googleapis.com` | 28 | Cormorant Garamond + Manrope |
| `cdnjs.cloudflare.com` | 3 | FontAwesome 6.5.1 / 6.5.2 |
| `picsum.photos` | 3 | Placeholder gambar |
| `img.icons8.com` | 2 | Ikon |
| `randomuser.me` | 1 | Foto avatar |
| `../../assets/cover_story.webp` | lokal | Cover cerita default |

Seluruh sumber eksternal harus di-*self-host* sebelum rilis (kebutuhan offline PWA + privasi + stabilitas).

---

## 9. Aturan Penggunaan & Rekomendasi Konsolidasi

### 9.1 Aturan yang berlaku sekarang

1. Teks di atas cover selalu diberi `linear-gradient(to top, rgba(0,0,0,.75), transparent)` agar kontras terjaga.
2. Tombol primer = latar ink `#302825` + teks `#fff` (klasik) atau latar `--accent` + teks `#fff` (restyled).
3. Tombol destruktif memakai `#a34436`; tidak pernah dipakai untuk aksi non-destruktif.
4. Chip/tab aktif = latar `--accent-soft` + teks `--accent`; tidak pernah hanya beda bobot font.
5. Setiap elemen interaktif non-`<button>` diberi `role="button"` + `tabindex="0"` + handler `keydown` (Enter/Space).
6. Nomor VA & kode memakai `ui-monospace` agar mudah dibaca dan disalin.

### 9.2 Rekomendasi untuk produksi

| # | Rekomendasi | Alasan |
|---|---|---|
| 1 | **Satukan tiga sub-sistem** menjadi satu token set (`--bg`, `--card`, `--text`, `--muted`, `--line`, `--accent`, …) di satu berkas global — *backdrop halaman sudah selesai (§2.0), tersisa font, ukuran frame, dan radius* | Sekarang token yang sama punya tiga nilai berbeda; CSS terduplikasi di 34 file |
| 2 | **Pilih satu aksen** `#d09a93` sebagai identitas; aksen kategori (`#55a7b1`, `#9f7a54`) jadikan token turunan `--accent-category-*` | Tiga aksen tanpa aturan merusak konsistensi merek |
| 3 | **Hapus frame HP** saat migrasi ke PWA; konten mengisi viewport | Frame hanya alat presentasi mockup |
| 4 | **Turunkan pemakaian bobot 900**; pakai 500/600 untuk body, 700/800 untuk judul | Hierarki tipografi terlalu rata |
| 5 | **Naikkan body minimum ke 12–14px** | 9–11px terlalu kecil untuk mobile |
| 6 | **Self-host font & ikon**, satukan versi FontAwesome atau ganti seluruhnya ke SVG inline | Offline-first + versi seragam |
| 7 | **Ekstrak komponen berulang** (`TopBar`, `BottomNav`, `StoryCard`, `ChapterRow`, `Sheet`, `Toast`, `CoinChip`) | CSS komponen ini disalin di puluhan file |
| 8 | **Verifikasi kontras WCAG AA** untuk `--muted` (`#928582`) di atas `--bg` (`#f4efea`) | Rasio berisiko di bawah 4.5:1 untuk teks kecil |
