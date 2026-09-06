# PRD Novelova — Modul Perpustakaan

> ## Salinan `novelova-v2/`
>
> Requirement fungsionalnya **sama dengan v1**; yang berubah hanya kulitnya (putaran 7).
>
> Induk keputusan teknisnya [`../architecture.md`](../architecture.md), rencananya
> [`../todo.md`](../todo.md). Yang di akar repo (`../../PRD Novelova/`) milik
> **`novelova/` v1** dan tidak lagi diubah — dua berkas PRD yang saling membantah
> lebih buruk daripada satu yang usang.

> Halaman: `my_library.html`
> Induk: [`prd_00_overview.md`](prd_00_overview.md) · Desain: [`prd_01_design_system.md`](prd_01_design_system.md) · Kontrak API: `../../docs/api_my_library.md`

---

## 1. Ringkasan Modul

Koleksi pribadi pembaca: cerita yang disimpan, progres bacanya, penanda bab baru, dan pengaturan notifikasi per cerita. Berbeda dari beranda yang menawarkan cerita baru, perpustakaan bertugas **mengembalikan pembaca ke cerita yang sudah dipilihnya**.

Modul ini menerapkan pola cari–saring–urutkan yang dipakai ulang di [`prd_07_author_studio.md`](prd_07_author_studio.md) untuk daftar cerita dan bab milik penulis.

| Aspek | Nilai |
|---|---|
| **Aktor** | Pembaca |
| **Halaman** | `my_library.html` (161 baris) |
| **Prasyarat** | Pengguna sudah masuk; ada cerita yang disimpan |
| **State persisten** | Tidak ada |
| **Sub-sistem desain** | Klasik `fix_ui` + navigasi bawah lima tab |

---

## 2. Flow

1. Pembaca membuka perpustakaan lewat tab "Library" atau tautan "See all" dari Continue Reading di beranda.
2. Ringkasan koleksi tampil: jumlah tersimpan, sedang dibaca, selesai, dan yang punya bab baru.
3. Pembaca mempersempit daftar dengan **pencarian bebas**, **tab status**, dan **urutan**.
4. Untuk tiap cerita, pembaca dapat:
   - Membuka halaman detailnya (lewat sampul).
   - Melanjutkan/memulai/mengulang baca (label tombol mengikuti progres).
   - Menyalakan atau mematikan notifikasi bab baru.
   - Menghapus cerita dari koleksi.
5. Bila tidak ada yang cocok, pesan keadaan kosong menggantikan daftar.

---

## 3. Daftar Requirement

| ID | Nama | Prioritas |
|---|---|---|
| FR-LIB-01 | Ringkasan koleksi | P1 |
| FR-LIB-02 | Kartu cerita tersimpan dengan progres | P0 |
| FR-LIB-03 | Pencarian judul, penulis, dan genre | P0 |
| FR-LIB-04 | Saring berdasarkan status baca | P0 |
| FR-LIB-05 | Urutkan daftar | P1 |
| FR-LIB-06 | Penghitung hasil & keadaan kosong | P1 |
| FR-LIB-07 | Lanjut membaca | P0 |
| FR-LIB-08 | Notifikasi bab baru per cerita | P1 |
| FR-LIB-09 | Hapus cerita dari koleksi | P1 |
| FR-LIB-10 | Navigasi & alat tambahan | P2 |
| FR-LIB-11 | **[BARU]** Sumber koleksi & progres nyata | P0 |
| FR-LIB-12 | **[BARU]** Perpustakaan kosong untuk pengguna baru | P1 |

---

## 4. Detail Requirement

### FR-LIB-01 — Ringkasan koleksi · P1

**Deskripsi.** Kepala halaman berisi penjelasan singkat fungsi perpustakaan dan empat angka ringkas tentang isi koleksi.

**User story.** Sebagai pembaca, saya ingin melihat gambaran koleksi saya sekilas agar tahu berapa banyak yang belum selesai dan berapa yang punya bab baru.

**Aturan bisnis.**
- Empat metrik dengan urutan tetap: **Saved**, **Reading**, **Done**, **New**.
- Data prototype: 42 · 9 · 11 · 6.
- Angka ini bersifat **agregat seluruh koleksi** dan tidak ikut berubah saat pembaca menyaring daftar — berbeda dari penghitung hasil di FR-LIB-06.

**Hook implementasi.** `my_library.html:67` — `.stats`, `.stat`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** pembaca melihat kepala halaman, **then** keempat metrik tampil dengan urutan Saved–Reading–Done–New.
- **Given** pembaca menyaring daftar ke "Selesai", **when** daftar dipersempit, **then** angka ringkasan koleksi tetap tidak berubah.

---

### FR-LIB-02 — Kartu cerita tersimpan dengan progres · P0

**Deskripsi.** Setiap cerita ditampilkan sebagai kartu lengkap: sampul, judul, penulis, status penerbitan, tag genre, rating, jumlah bab, batang progres, tanggal simpan, dan baris aksi.

**User story.** Sebagai pembaca, saya ingin melihat sejauh mana saya sudah membaca setiap cerita dan apakah ada bab baru, agar bisa memutuskan mana yang dilanjutkan.

**Aturan bisnis.**
- **Atribut data pada tiap kartu** — sekaligus menjadi sumber pencarian dan pengurutan:

  | Atribut | Isi | Dipakai untuk |
  |---|---|---|
  | `data-state` | `reading` · `finished` · `not-started` | Saring status (FR-LIB-04) |
  | `data-title` | judul huruf kecil | Cari & urut A–Z |
  | `data-author` | nama penulis huruf kecil | Cari |
  | `data-genre` | daftar genre huruf kecil dipisah spasi | Cari |
  | `data-rating` | angka, mis. `4.8` | Urut rating |
  | `data-saved` | `YYYY-MM-DD` | Urut terbaru disimpan |
  | `data-updated` | `YYYY-MM-DD` | Urut update terbaru |

- **Status penerbitan** ditampilkan sebagai lencana: `Ongoing` (default), `Completed`, `Hiatus` — masing-masing bergaya berbeda.
- **Penanda bab baru** berupa titik merah di sudut sampul dengan `aria-label="New chapter"`; hanya tampil bila ada bab yang belum dibaca.
- **Batang progres** menampilkan teks (`"Bab 45 dari 120"` atau `"Belum dimulai"`) dan persentase, dengan lebar batang sesuai persentase.
- Baris bawah memuat tanggal simpan, catatan status, dan tiga aksi: baca, notifikasi, hapus.
- Format tanggal `YYYY-MM-DD` pada atribut data dipilih agar pengurutan dapat memakai perbandingan string biasa tanpa mengurai tanggal.

**Hook implementasi.** `my_library.html:75-92` — `article.story[data-*]`, `.cover`, `.new-dot`, `.status`, `.progress`, `.bar`, `.story-foot`.

**Acceptance criteria.**
- **Given** sebuah cerita memiliki bab yang belum dibaca, **when** kartunya dirender, **then** titik merah tampil di sudut sampul.
- **Given** progres baca 38%, **when** kartu dirender, **then** teks berbunyi "Bab 45 dari 120", persentase "38%", dan batang terisi 38%.
- **Given** cerita berstatus Hiatus, **when** kartu dirender, **then** lencana status memakai gaya hiatus, bukan gaya ongoing.
- **Given** pembaca menekan sampul, **when** aksi dijalankan, **then** `detail_story_alternatif_unified_cover_first.html` terbuka.

---

### FR-LIB-03 — Pencarian judul, penulis, dan genre · P0

**Deskripsi.** Satu kolom pencarian menyaring daftar secara langsung sambil pengguna mengetik, mencakup tiga bidang sekaligus.

**User story.** Sebagai pembaca dengan koleksi besar, saya ingin mencari cerita dengan mengetik apa saja yang saya ingat — judul, nama penulis, atau genrenya.

**Aturan bisnis.**
- Kueri diproses dengan `trim()` + `toLowerCase()`, jadi **tidak peka huruf besar-kecil** dan mengabaikan spasi di tepi.
- Pencarian dilakukan pada gabungan `data-title`, `data-author`, dan `data-genre` dalam satu untai teks, memakai pencocokan **substring** (`includes`) — bukan awalan, dan bukan kata utuh.
- Kueri kosong berarti **semua lolos** — pencarian tidak pernah menyembunyikan segalanya hanya karena kosong.
- Berjalan pada event `input`, sehingga hasil diperbarui pada setiap ketikan.
- Pencarian dan saringan status bersifat **AND** — keduanya harus terpenuhi.
- Kolom memakai `type="search"` dengan `aria-label` deskriptif.

**Hook implementasi.** `my_library.html:113:visibleStories()`; `#searchInput`; listener `:146`.

**Acceptance criteria.**
- **Given** pembaca mengetik `ceo`, **when** hasil diperbarui, **then** hanya cerita yang judul/penulis/genrenya memuat "ceo" yang tampil.
- **Given** pembaca mengetik `SORAYA` dengan huruf besar, **when** hasil diperbarui, **then** cerita karya Soraya Lin tetap tampil.
- **Given** pembaca mengetik `mystery`, **when** hasil diperbarui, **then** cerita bergenre mystery tampil meski judulnya tidak memuat kata itu.
- **Given** kolom pencarian dikosongkan, **when** hasil diperbarui, **then** seluruh cerita (yang lolos saringan status) tampil kembali.
- **Given** tab "Sedang Dibaca" aktif dan pembaca mengetik `paper` (cerita berstatus selesai), **when** hasil diperbarui, **then** daftar kosong karena kedua syarat harus terpenuhi.

---

### FR-LIB-04 — Saring berdasarkan status baca · P0

**Deskripsi.** Empat tab yang mempersempit daftar menurut sejauh mana cerita sudah dibaca.

**User story.** Sebagai pembaca, saya ingin memisahkan cerita yang sedang saya baca dari yang sudah selesai agar bisa langsung melanjutkan tanpa terganggu koleksi lama.

**Aturan bisnis.**

| Tab | `data-filter` | Menampilkan |
|---|---|---|
| Semua | `all` | Semua cerita |
| Sedang Dibaca | `reading` | `data-state="reading"` |
| Selesai | `finished` | `data-state="finished"` |
| Belum Dimulai | `not-started` | `data-state="not-started"` |

- Default: **Semua** aktif.
- Tepat satu tab aktif; menekan tab lain memindahkan kelas `active`.
- Filter disimpan pada variabel `activeFilter` dan tetap berlaku saat pencarian atau pengurutan berubah.
- Wadah tab memakai `aria-label="Library filters"`.

**Hook implementasi.** `my_library.html:112` `activeFilter`; listener `:140`; `.tab[data-filter]`.

**Acceptance criteria.**
- **Given** halaman baru dimuat, **when** pembaca melihat tab, **then** "Semua" aktif dan seluruh cerita tampil.
- **Given** pembaca menekan "Selesai", **when** daftar diperbarui, **then** hanya cerita berstatus selesai yang tampil dan hanya tab itu yang bergaya aktif.
- **Given** tab "Sedang Dibaca" aktif, **when** pembaca mengganti urutan, **then** saringan status tetap berlaku.

---

### FR-LIB-05 — Urutkan daftar · P1

**Deskripsi.** Dropdown yang menyusun ulang urutan kartu secara fisik di dalam daftar.

**User story.** Sebagai pembaca, saya ingin mengurutkan koleksi menurut yang paling baru saya simpan, yang baru diperbarui, abjad, atau rating.

**Aturan bisnis.**

| Nilai | Label | Aturan |
|---|---|---|
| `saved` | Terbaru disimpan | `data-saved` **menurun** (terbaru dulu) — **default** |
| `updated` | Update terbaru | `data-updated` menurun |
| `az` | A-Z | `data-title` menaik memakai `localeCompare` |
| `rating` | Rating | `data-rating` menurun (numerik) |

- Pengurutan memindahkan elemen di DOM dengan `appendChild`, bukan sekadar mengubah gaya — sehingga urutan tetap benar saat kartu disaring maupun ditampilkan lagi.
- Setelah mengurutkan, penyaringan **selalu** dijalankan ulang agar penghitung dan keadaan kosong tetap tepat.
- `sortStories()` dipanggil sekali saat halaman dimuat sehingga urutan awal sudah sesuai default, bukan urutan penulisan HTML.
- Perbandingan tanggal memakai perbandingan string yang valid karena formatnya `YYYY-MM-DD`.

**Hook implementasi.** `my_library.html:128:sortStories()`; `#sortSelect`; listener `:147`; pemanggilan awal `:158`.

**Acceptance criteria.**
- **Given** halaman dimuat, **when** daftar dirender pertama kali, **then** cerita terurut dari yang paling baru disimpan.
- **Given** pembaca memilih "A-Z", **when** daftar disusun ulang, **then** judul terurut menaik menurut abjad.
- **Given** pembaca memilih "Rating", **when** daftar disusun ulang, **then** cerita berating tertinggi berada di atas.
- **Given** saringan "Sedang Dibaca" aktif, **when** pembaca mengganti urutan, **then** hanya cerita yang sedang dibaca tampil, dalam urutan baru.

---

### FR-LIB-06 — Penghitung hasil & keadaan kosong · P1

**Deskripsi.** Label jumlah hasil di atas daftar dan pesan khusus saat tidak ada yang cocok.

**User story.** Sebagai pembaca, saya ingin tahu berapa cerita yang cocok dengan saringan saya, dan mendapat pesan jelas bila tidak ada.

**Aturan bisnis.**
- Penghitung menampilkan jumlah kartu yang **benar-benar terlihat**, bukan total koleksi.
- **Bentuk tunggal/jamak diperhatikan:** `"1 story"` vs `"6 stories"`.
- Kartu yang sudah dihapus (kelas `removed`) tidak pernah dihitung.
- Keadaan kosong tampil (`display: block`) hanya saat jumlah terlihat = 0, dan disembunyikan saat ada hasil.
- Teks: `"Tidak ada story yang cocok dengan filter atau pencarian saat ini."`

**Hook implementasi.** `my_library.html:125-126`; `#countText`, `#emptyState`.

**Acceptance criteria.**
- **Given** enam cerita tampil, **when** penghitung dirender, **then** tertulis "6 stories".
- **Given** hanya satu cerita yang cocok, **when** penghitung dirender, **then** tertulis "1 story" (bentuk tunggal).
- **Given** pencarian tidak menghasilkan apa pun, **when** daftar dirender, **then** pesan keadaan kosong tampil dan penghitung menunjukkan "0 stories".
- **Given** pembaca menghapus sebuah cerita, **when** daftar dirender ulang, **then** penghitung berkurang satu.

---

### FR-LIB-07 — Lanjut membaca · P0

**Deskripsi.** Tombol utama pada setiap kartu yang membawa pembaca langsung ke halaman baca, dengan label yang menyesuaikan progres.

**User story.** Sebagai pembaca, saya ingin satu ketukan dari perpustakaan langsung membawa saya ke tempat terakhir saya berhenti membaca.

**Aturan bisnis.**
- Label tombol mengikuti progres: **"Lanjut Baca"** (sedang dibaca) · **"Mulai Baca"** (belum dimulai) · **"Baca Ulang"** (selesai).
- Tujuan saat ini: `chapter_read_unlocked.html` — **halaman ini tidak ada di folder** (lihat §7).
- Produksi harus membuka bab terakhir yang dibaca, bukan bab pertama.

**Hook implementasi.** `my_library.html:76` dan seterusnya — `a.read`.

**Acceptance criteria.**
- **Given** cerita berstatus sedang dibaca, **when** kartu dirender, **then** tombol berbunyi "Lanjut Baca".
- **Given** cerita belum dimulai, **when** kartu dirender, **then** tombol berbunyi "Mulai Baca".
- **Given** cerita sudah selesai, **when** kartu dirender, **then** tombol berbunyi "Baca Ulang".
- **Given** pembaca menekan "Lanjut Baca" *(produksi)*, **when** halaman baca terbuka, **then** bab yang terbuka adalah bab terakhir yang dibaca, **dan posisi gulir di dalam bab itu ikut dipulihkan**.

> **Revisi 5 September 2026 · posisi dipulihkan per bab.** Versi lama hanya
> menuntut bab yang benar. Sejak `prd_05` FR-READ-16 direvisi, posisi gulir
> disimpan **per bab**, bukan satu angka per cerita — jadi "Lanjut Baca"
> mengembalikan pembaca ke titik yang sama persis, dan kembali ke bab yang lebih
> awal juga membuka posisinya sendiri, bukan dari atas.
>
> Sebelum itu, kembali ke bab yang lebih awal selalu mulai dari atas — dan bagi
> pembaca itu tidak bisa dibedakan dari kehilangan tempat. `architecture.md`
> §1.24.

---

### FR-LIB-08 — Notifikasi bab baru per cerita · P1

**Deskripsi.** Sakelar pada setiap kartu yang mengatur apakah pembaca diberi tahu saat cerita itu merilis bab baru.

**User story.** Sebagai pembaca, saya ingin memilih cerita mana saja yang boleh mengirimi saya notifikasi agar tidak dibanjiri pemberitahuan dari seluruh koleksi.

**Aturan bisnis.**
- Sakelar per cerita, bukan pengaturan global.
- Menekan sakelar membalik kelas `on` dan menampilkan pesan status:
  - Aktif → `"Notifikasi update novel diaktifkan."`
  - Nonaktif → `"Notifikasi update novel dimatikan."`
- Keadaan awal berbeda per cerita (prototype: empat aktif, dua nonaktif).
- Sakelar memakai `aria-label` (`"Notification on"` / `"Notification off"`) — **label ini tidak ikut berubah saat sakelar ditekan** (lihat §7).

**Hook implementasi.** `my_library.html:148` listener; `.toggle`, kelas `on`.

**Acceptance criteria.**
- **Given** notifikasi sebuah cerita aktif, **when** pembaca menekan sakelarnya, **then** sakelar berpindah ke posisi mati dan pesan berbunyi "Notifikasi update novel dimatikan.".
- **Given** notifikasi nonaktif, **when** pembaca menekan sakelarnya, **then** sakelar aktif dan pesan berbunyi "Notifikasi update novel diaktifkan.".
- **Given** pembaca mengubah notifikasi satu cerita, **when** kartu lain dirender, **then** sakelar cerita lain tidak ikut berubah.

---

### FR-LIB-09 — Hapus cerita dari koleksi · P1

**Deskripsi.** Tombol "Unsave" mengeluarkan cerita dari perpustakaan dan memperbarui daftar seketika.

**User story.** Sebagai pembaca, saya ingin mengeluarkan cerita yang tidak lagi saya minati agar perpustakaan tetap relevan.

**Aturan bisnis.**
- Menekan tombol memasang kelas `removed` pada kartu; CSS `.story.removed { display: none }` menyembunyikannya.
- Kartu yang sudah dihapus **dilewati permanen** oleh penyaringan — mengganti filter atau pencarian tidak akan memunculkannya kembali.
- Daftar dan penghitung langsung diperbarui.
- Pesan status: `"Story dihapus dari daftar simpanan dalam prototype."`
- **Tidak ada konfirmasi dan tidak ada urungkan** (lihat §7).

**Hook implementasi.** `my_library.html:152` listener; `.remove`, kelas `removed`; CSS `:36`.

**Acceptance criteria.**
- **Given** pembaca menekan "Unsave" pada sebuah cerita, **when** aksi dijalankan, **then** kartu hilang dari daftar dan penghitung berkurang satu.
- **Given** sebuah cerita sudah dihapus, **when** pembaca mengganti tab saringan ke "Semua", **then** cerita itu tetap tidak muncul.
- **Given** seluruh cerita dihapus, **when** daftar dirender, **then** pesan keadaan kosong tampil.

---

### FR-LIB-10 — Navigasi & alat tambahan · P2

**Deskripsi.** Tombol kembali, tautan "Tools", navigasi bawah lima tab, dan catatan tentang gestur geser.

**User story.** Sebagai pembaca, saya ingin berpindah dari perpustakaan ke area lain aplikasi dengan mudah.

**Aturan bisnis.**
- Tombol kembali → `home_tabs.html`.
- Tautan "Tools" → `../../alt/library_search_sort.html`, **di luar folder ini** (lihat §7).
- Navigasi bawah: Home · Topup · **Library (aktif)** · Stories · Profile.
- Catatan permanen di bawah daftar menjelaskan bahwa gestur geser dapat dipetakan ke aksi Unsave, dan prototype sengaja memakai tombol agar alurnya terlihat.

**Acceptance criteria.**
- **Given** pembaca menekan tombol kembali, **when** aksi dijalankan, **then** `home_tabs.html` terbuka.
- **Given** pembaca berada di perpustakaan, **when** melihat navigasi bawah, **then** tab "Library" ditandai aktif.

---

### FR-LIB-11 — Sumber koleksi & progres nyata · P0

**Status: BARU.** Menutup dua alur yang selama ini buntu: perpustakaan tidak punya cara diisi, dan progres bacanya tidak punya sumber.

**Deskripsi.** Isi perpustakaan berasal dari aksi simpan pembaca, dan progres tiap cerita berasal dari aktivitas membaca yang tercatat.

**User story.** Sebagai pembaca, saya ingin perpustakaan saya benar-benar berisi cerita yang saya simpan, dengan progres yang mencerminkan bacaan saya.

**Aturan bisnis.**
- **Isi koleksi** bersumber tunggal dari **Add to Library** di halaman detail cerita (lihat [`prd_04_story_detail.md`](prd_04_story_detail.md) FR-DETAIL-13). Tidak ada cerita yang bisa muncul di perpustakaan tanpa aksi eksplisit pembaca.
- **Data progres** bersumber dari posisi baca yang tersimpan (lihat [`prd_05_reader.md`](prd_05_reader.md) FR-READ-16):

  | Elemen kartu | Sumber |
  |---|---|
  | `data-state` (`reading` / `finished` / `not-started`) | Dihitung dari jumlah bab selesai dibanding total bab |
  | `"Bab 45 dari 120"` dan persentase | Bab terakhir selesai / total bab terbit |
  | Penanda bab baru (titik merah) | Ada bab terbit setelah kunjungan terakhir pembaca |
  | `data-updated` | Tanggal bab terakhir terbit |
  | `data-saved` | Tanggal aksi simpan |

- **Aturan status:** `not-started` = 0 bab selesai · `reading` = 1 sampai kurang dari seluruh bab · `finished` = seluruh bab terbit sudah selesai. Cerita `finished` yang mendapat bab baru **kembali menjadi** `reading`.
- **Tombol baca menuju bab terakhir yang dibaca**, bukan bab pertama — memperbaiki tautan menggantung `chapter_read_unlocked.html` sekaligus (§7 no. 1). Untuk cerita `not-started`, menuju bab 1.
- **Unsave, sakelar notifikasi, dan status baca disimpan di server**, sehingga bertahan setelah halaman dimuat ulang dan konsisten lintas perangkat.
- Angka ringkasan koleksi (Saved · Reading · Done · New) dihitung dari data nyata, bukan konstanta.
- Penyaringan, pencarian, dan pengurutan **pindah ke server** dengan paginasi — perilakunya tetap sama persis seperti FR-LIB-03 sampai FR-LIB-05, tetapi tidak lagi terbatas pada kartu yang kebetulan ada di DOM.

**Acceptance criteria.**
- **Given** pembaca menyimpan sebuah cerita dari halaman detail, **when** membuka perpustakaan, **then** cerita itu tampil dengan status `not-started` dan progres 0%.
- **Given** pembaca menyelesaikan bab 18 dari 64, **when** perpustakaan dirender, **then** kartu menampilkan "Bab 18 dari 64" beserta persentasenya.
- **Given** seluruh bab sebuah cerita sudah selesai, **when** cerita itu merilis bab baru, **then** statusnya kembali menjadi "Sedang Dibaca" dan penanda bab baru tampil.
- **Given** pembaca menekan "Lanjut Baca", **when** reader terbuka, **then** bab yang dimuat adalah bab terakhir yang dibacanya.
- **Given** pembaca menghapus sebuah cerita, **when** halaman dimuat ulang, **then** cerita itu tetap tidak ada.
- **Given** koleksi berisi 42 cerita, **when** perpustakaan dibuka, **then** halaman pertama dimuat dengan paginasi, bukan seluruh 42 kartu sekaligus.

---

### FR-LIB-12 — Perpustakaan kosong untuk pengguna baru · P1

**Status: BARU.** Halaman saat ini mengasumsikan pembaca sudah punya 42 cerita tersimpan.

**Deskripsi.** Tampilan perpustakaan bagi pembaca yang belum menyimpan apa pun, yang mengarahkan mereka menemukan cerita pertama.

**User story.** Sebagai pengguna baru, saya ingin tahu apa gunanya perpustakaan dan bagaimana mengisinya, bukan disambut halaman kosong.

**Aturan bisnis.**
- Keadaan kosong **berbeda** dari keadaan "tidak ada hasil saringan" yang sudah ada (FR-LIB-06): yang ini muncul saat koleksi benar-benar kosong, dan menampilkan ajakan, bukan pesan kegagalan pencarian.
- Isi keadaan kosong: penjelasan singkat fungsi perpustakaan · tombol **"Jelajahi cerita"** → `home_tabs.html` · tautan ke kategori populer → `see_all_popular.html`.
- Saat koleksi kosong, **kontrol pencarian, saringan, dan urutan disembunyikan** — tidak ada gunanya menyaring nol cerita.
- Ringkasan koleksi tetap tampil dengan angka nol.
- Pola yang sama berlaku untuk `my_stories.html` bagi penulis yang belum punya karya (lihat [`prd_07_author_studio.md`](prd_07_author_studio.md) FR-STUDIO-33).

**Acceptance criteria.**
- **Given** pembaca baru belum menyimpan cerita apa pun, **when** membuka perpustakaan, **then** ajakan menjelajah tampil beserta tombol menuju beranda.
- **Given** koleksi kosong, **when** halaman dirender, **then** kolom pencarian dan tab saringan tidak tampil.
- **Given** pembaca menyimpan cerita pertamanya, **when** kembali ke perpustakaan, **then** keadaan kosong digantikan daftar berisi satu cerita beserta kontrol lengkapnya.

---

## 5. State & Persistensi

**Tidak ada `localStorage`.** Seluruh state hidup di DOM dan hilang saat halaman dimuat ulang.

| State | Tempat | Konsekuensi |
|---|---|---|
| Filter aktif | Variabel `activeFilter` | Kembali ke "Semua" |
| Kueri pencarian | Nilai input | Kosong lagi |
| Urutan | Nilai dropdown | Kembali ke "Terbaru disimpan" |
| Cerita terhapus | Kelas `removed` | **Cerita yang dihapus muncul kembali** |
| Notifikasi per cerita | Kelas `on` | Kembali ke keadaan awal HTML |

---

## 6. Navigasi

**Masuk ke modul:** tab "Library" dari `home_tabs`, `topup_koin`, `my_stories`, `manage_chapters`, `detail_story_*` · tautan "See all" pada Continue Reading di beranda · `profile.html`.

**Keluar dari modul:** `detail_story_alternatif_unified_cover_first.html` (sampul) · `chapter_read_unlocked.html` *(menggantung)* · `home_tabs.html` · `topup_koin.html` · `my_stories.html` · `profile.html` · `../../alt/library_search_sort.html` *(di luar folder)*.

---

## 7. Catatan Prototype vs Produksi

| # | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | **Tombol baca menuju `chapter_read_unlocked.html` yang tidak ada** (6 kartu) | Aksi utama modul ini menghasilkan 404 | Arahkan ke `chapter_read_locked_story_stage.html` dengan `chapter_id` bab terakhir yang dibaca |
| 2 | **Hapus tanpa konfirmasi dan tanpa urungkan** | Pembaca bisa kehilangan cerita karena salah tekan | Tambahkan konfirmasi atau toast dengan tombol "Urungkan" berdurasi beberapa detik |
| 3 | **`aria-label` sakelar notifikasi tidak diperbarui** saat keadaan berubah | Pembaca layar mendapat informasi yang salah | Perbarui `aria-label` (atau pakai `aria-pressed`) bersamaan dengan kelas `on` |
| 4 | **Seluruh state hilang saat dimuat ulang** — termasuk penghapusan dan notifikasi | Perubahan tidak nyata | Sambungkan ke endpoint perpustakaan (`../../docs/api_my_library.md`) |
| 5 | **Tautan "Tools" keluar folder** ke `../../alt/library_search_sort.html` | Keluar dari kumpulan halaman yang konsisten | Gabungkan fungsinya ke halaman ini atau arahkan ke halaman lokal |
| 6 | **Penyaringan dan pengurutan berjalan di klien** atas seluruh kartu di DOM | Tidak akan sanggup untuk koleksi 42 cerita ke atas | Pindahkan ke server dengan paginasi; pertahankan perilaku yang sama |
| 7 | Hanya 6 kartu ditampilkan padahal ringkasan menyebut 42 tersimpan | Angka ringkasan dan isi daftar tidak konsisten | Muat data nyata dengan paginasi |
| 8 | Data cerita hardcoded termasuk tanggal 2026 | — | Sambungkan ke API |
| 9 | Judul halaman "My Library" dan label tab berbahasa Inggris di UI berbahasa Indonesia | Bahasa campur | Seragamkan mengikuti pengaturan bahasa |
