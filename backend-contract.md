# Kontrak API & Skema Database — Novelova v2

> Dokumen untuk **membangun backend sungguhan** menggantikan server-mock.
>
> Dibuat Langkah 82 atas permintaan pengguna: *"datanya sekarang berdasarkan
> mock. Nah saya ingin buat data nya sekarang asli … buat markdown isinya api
> contract dan field-field didatabase beserta type data nya."*
>
> **Sumber dokumen ini adalah kode, bukan ingatan.** Tiap tabel dan tiap
> endpoint di bawah diturunkan dari berkas nyata:
> `src/api/client.ts` (127 metode) · `src/api/contracts/*.ts` (10 berkas Zod) ·
> `src/api/mock/db.ts` (37 tabel Dexie) · `src/api/errors.ts` ·
> `src/api/mock/config.ts`. Kalau dokumen ini berselisih dengan kode, **kode yang
> benar** — dan selisihnya adalah cacat yang harus dilaporkan.

---

## 0. Tiga keputusan yang mengunci dokumen ini

Ditanyakan dan dijawab pengguna sebelum satu baris ditulis:

| | Pilihan | Akibatnya di dokumen ini |
|---|---|---|
| **Bentuk DB** | **Relasional — PostgreSQL** | Array di dalam baris dipecah jadi tabel sendiri; aturan jadi `CONSTRAINT`, bukan pengecekan di kode |
| **Gaya API** | **RPC 1:1 dengan seam** | Tiap metode `NovelovaApi` jadi satu `POST /rpc/<nama>`; folder `api/http/` jadi terjemahan mekanis, **nol perubahan di 42 halaman** |
| **Cakupan** | **Tabel + endpoint + bentuk turunan** | Bagian 5 menjelaskan apa yang **tidak** punya tabel dan dihitung dari apa |

### Kenapa RPC, dan apa konsekuensinya

Seam-nya sudah RPC sejak hari pertama (`api.getChapter(id)`), dan janji
arsitekturnya berbunyi *"ganti backend = tukar satu folder"*. Memetakannya ke
REST berarti 127 keputusan path + verb, dan sebagian memang bukan CRUD
(`claimCheckIn`, `resolveReviewAsAdmin`, `regeneratePrintFile`).

Konsekuensi yang harus diterima sadar:

- **Semua `POST`, termasuk yang membaca** (satu pengecualian bentuk: `submitAgeVerification` multipart). Tidak ada cache HTTP dari CDN. Kalau
  nanti perlu, naikkan metode baca tertentu jadi `GET /rpc/<nama>?<query>` —
  servernya boleh menerima keduanya.
- **Bukan REST**, jadi jangan mengarahkan perkakas yang menuntut REST (mis.
  generator klien OpenAPI bergaya resource) ke sini. OpenAPI tetap bisa ditulis;
  tiap operasi cuma kebetulan `POST` ke path bernama.

---

## 1. Konvensi yang berlaku di seluruh tabel

**Ikuti ini; kalau satu tabel menyimpang, alasannya ditulis di barisnya.**

### 1.1 Kunci primer

```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

UUID, **bukan** id pendek `s1`/`f1`/`a3` seperti di seed sekarang. Id pendek itu
artefak data contoh; id yang bisa ditebak pada sumber daya berbayar adalah
undangan untuk mencoba-coba.

> **UUID v7 kalau tersedia** (`pg_uuidv7`, atau dibuat di aplikasi). Ia terurut
> waktu, jadi indeks B-tree-nya tidak terfragmentasi seperti v4 — penting untuk
> tabel yang tumbuh tanpa henti: `transactions`, `notifications`, `comments`.

**Satu pengecualian yang disengaja:** nomor pesanan cetak berbentuk
`#SFT-20260906-001` / `#HDC-20260906-001` dan **terbaca manusia** — jenisnya
dibaca dari nomornya. Ia jadi kolom `order_number text UNIQUE`, bukan kunci
primer. PK-nya tetap uuid.

### 1.2 Waktu — dan satu jebakan yang mahal

Kontrak memakai **dua** tipe waktu, dan keduanya **tidak** boleh ditukar:

| Zod | Postgres | Arti | Dipakai di |
|---|---|---|---|
| `IsoDateTimeSchema` | `timestamptz` | Momen absolut, selalu UTC | `createdAt`, `publishAtUtc`, `expiresAt`, … |
| `LocalDateSchema` | `date` | **Tanggal kalender pengguna**, `YYYY-MM-DD` | `adQuota.date`, `rewards.lastCheckIn`, `progress.finishedAt`, `libraryEntry.savedAt`, `story.updatedAt` |

> ⚠️ **`date` di sini bukan "tanggal dari timestamp".** Ia tanggal menurut zona
> waktu **pengguna** (`locale_settings.timezone`). Menurunkannya dari
> `created_at AT TIME ZONE 'UTC'` adalah bug yang menolak klaim check-in yang sah
> **setiap pagi di WIB** — pukul 06.00 WIB masih hari kemarin di UTC. Klien sudah
> memakai `todayLocalISO()` justru untuk menghindari ini; servernya wajib ikut.
>
> Aturan praktisnya: **kuota harian, streak, dan misi harian dihitung dengan
> tanggal yang dikirim klien atau diturunkan dari zona waktu pengguna** — tidak
> pernah dari `now()` server.

### 1.3 Uang

- **Koin** `integer`. Tidak ada pecahan koin, di mana pun.
- **Rupiah** `integer`. IDR tidak punya sen; `numeric` cuma mengundang pembulatan
  yang berbeda antar bahasa.
- Saldo tidak boleh negatif — **ditegakkan constraint**, bukan kode:
  ```sql
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0)
  ```
- **Buku besar yang menentukan, bukan kolom saldo.** `wallets.balance` adalah
  materialisasi dari `transactions`; keduanya wajib berubah **dalam satu
  transaksi**. Rekonsiliasi berkala (`SUM(amount)` vs `balance`) adalah
  pemeriksaan wajib, bukan opsional.

### 1.4 Enum

Semua `z.enum` jadi **tipe enum Postgres**, bukan `text` + `CHECK`. Alasannya
praktis: `ALTER TYPE … ADD VALUE` tercatat di migrasi, sementara `CHECK` yang
berubah gampang luput dari review.

```sql
CREATE TYPE review_state    AS ENUM ('draft','in_review','rejected','published');
CREATE TYPE story_status    AS ENUM ('ongoing','completed','hiatus');
CREATE TYPE story_kind      AS ENUM ('fiksi','kisah');
CREATE TYPE visibility      AS ENUM ('public','unlisted','private');
CREATE TYPE monetize_type   AS ENUM ('free','partial','premium');
CREATE TYPE audience        AS ENUM ('Remaja','Semua Umur','Dewasa 18+');
CREATE TYPE content_lang    AS ENUM ('id','en');
CREATE TYPE genre           AS ENUM ('Romance','Mystery','Fantasy','Drama','Thriller','CEO','Horror');
CREATE TYPE content_label   AS ENUM ('kekerasan','bahasa-kasar','sensitif','spoiler-berat');
CREATE TYPE chapter_access  AS ENUM ('free','paid','private');
CREATE TYPE chapter_state   AS ENUM ('draft','scheduled','published','private');
CREATE TYPE ownership_source AS ENUM ('coin','bundle','full','ad','voucher');
CREATE TYPE tx_kind         AS ENUM ('topup','spend','reward','refund','pending');
CREATE TYPE tx_status       AS ENUM ('success','pending','failed','reversed');
CREATE TYPE tx_ref_type     AS ENUM ('chapter','bundle','story','topup','mission','checkin','withdrawal');
CREATE TYPE pay_method_type AS ENUM ('ewallet','qris','va');
CREATE TYPE topup_status    AS ENUM ('pending','paid','expired','declined','pending_reconciliation');
CREATE TYPE author_tier     AS ENUM ('none','registered','verified');
CREATE TYPE notif_kind      AS ENUM ('bab-baru','bab-terjadwal','cerita-terjadwal','cetak-status',
                                     'topup','checkin','voucher-kedaluwarsa','ulasan-komentar',
                                     'pengikut-baru','penarikan','keamanan',
                                     'cerita-baru');   -- A2, Langkah 83
CREATE TYPE age_verify_status AS ENUM ('none','pending','verified','rejected');  -- A1
CREATE TYPE adult_mode       AS ENUM ('gated','hidden');                          -- A1
CREATE TYPE notif_type      AS ENUM ('cerita','dompet','hadiah','sistem');
CREATE TYPE notif_group     AS ENUM ('cerita','dompetHadiah','karya','sistem');
CREATE TYPE report_reason   AS ENUM ('spam','spoiler','kasar','plagiat','dewasa','lainnya');
CREATE TYPE report_target   AS ENUM ('story','review','comment','user','chapter');  -- 'chapter' sejak A5
CREATE TYPE react_target    AS ENUM ('review','comment','chapter');
CREATE TYPE withdraw_status AS ENUM ('submitted','review','transferred','rejected');
CREATE TYPE voucher_scope   AS ENUM ('chapter','firstN','story','cross');
CREATE TYPE voucher_value   AS ENUM ('free','pct');
CREATE TYPE mission_kind    AS ENUM ('read','review','ad');
CREATE TYPE print_kind      AS ENUM ('soft','hard');
CREATE TYPE export_category AS ENUM ('identitas','aktivitas','dompet','penulis');
CREATE TYPE export_status   AS ENUM ('processing','ready','expired');
```

> `notif_type` dan `notif_group` sengaja **dua tipe berbeda walau nilainya mirip**
> — itu dua sumbu yang berbeda (`architecture.md` §1.36), dan menyatukannya
> memaksa salah satunya salah. Pemetaan jenis → saringan → kelompok ada di
> `src/lib/notif.ts`; **backend wajib memakai pemetaan yang sama**, bukan
> menuliskannya ulang.

### 1.5 Array: kapan dipecah, kapan tidak

Pilihan "relasional" berarti array **yang dicari atau disaring** dipecah jadi
tabel. Tetapi memecah semuanya adalah dogma, bukan rekayasa:

| Array di kontrak | Jadi | Alasan |
|---|---|---|
| `story.genres`, `story.tags`, `story.contentLabels` | **tabel join** | Dicari, disaring, dan dihitung (`storyCount` per tag) |
| `review.tags` | **tabel join** | Halaman ulasan menyaring per tag dan menghitung tag terpopuler |
| `voucher.storyIds`, `voucher.chapterIds` | **tabel join** | Menentukan di mana voucher berlaku — dicek tiap pemakaian |
| `readerPrefs.hiddenStoryIds` / `autoUnlockStoryIds` / `autoUnlockCounts` / `bundleOfferSeenStoryIds` | **satu tabel `reader_story_state`** | Keempatnya berkunci sama: (pembaca, cerita). Lihat §2.3 |
| `progress.finishedChapterIds` / `scrollByChapter` / `finishedAt` | **satu tabel `reading_progress_chapters`** | Ketiganya berkunci sama: (pembaca, bab). Lihat §2.3 |
| **`chapterContent.body`** | **tetap `text[]`** | ⚠️ Menyimpang, dan sengaja |

**Kenapa `body` tetap array.** Ia paragraf naskah: selalu dibaca utuh, tidak
pernah dicari per paragraf, tidak pernah difilter, tidak pernah di-join. Tabel
`chapter_paragraphs (chapter_id, lang, idx, text)` menambah satu join dan satu
`ORDER BY` pada **jalur terpanas aplikasi** — membuka bab — tanpa menjawab satu
pun pertanyaan baru. Pakai `text[]`; kalau nanti perlu pencarian di dalam isi
bab, yang menjawabnya indeks full-text (`tsvector`), bukan tabel paragraf.

### 1.6 Penghapusan

Aplikasi ini **hampir tidak pernah menghapus baris**, dan itu keputusan produk,
bukan kelalaian:

- `library_entries.removed` adalah **tombstone**, supaya "Urungkan" enam detik
  bisa mengembalikan tanggal simpan aslinya — bukan tanggal hari ini.
- Laporan **tidak menghapus** konten; ia menyembunyikannya setelah melewati
  ambang, dengan barisnya tetap di tempat (`architecture.md` §1.18).
- Blokir menyembunyikan **dari pemblokir saja**.
- Menghapus ulasan **tidak** menghapus ratingnya (§1.16).

`ON DELETE CASCADE` hanya dipasang pada relasi yang memang tidak punya arti
sendiri: tag cerita, paragraf, entri join. **Jangan** pasang pada apa pun yang
menyentuh uang — `transactions` dan `ownerships` harus selamat dari penghapusan
cerita, karena riwayat uang milik pengguna, bukan milik konten.

### 1.7 Penamaan

Kontrak TypeScript `camelCase`; Postgres `snake_case`. Terjemahannya di satu
tempat — lapisan `api/http/` — bukan di tiap query. Jangan mengutip identifier
ber-`camelCase` di SQL; itu memaksa tanda kutip selamanya.

---

## 2. Amplop RPC

### 2.1 Bentuk permintaan

```http
POST /rpc/<namaMetode>
Content-Type: application/json
Authorization: Bearer <access token>
X-Client-Version: 1.4.2

{ ...argumen metode }
```

**Argumennya persis parameter metode seam.** Metode berparameter tunggal objek
mengirim objek itu apa adanya; metode berparameter posisi dibungkus jadi objek
bernama:

```jsonc
// api.getChapter(storyId, chapterId)
POST /rpc/getChapter
{ "storyId": "...", "chapterId": "..." }

// api.markRead(ids)          ← argumen tunggal non-objek dibungkus "arg"
POST /rpc/markRead
{ "arg": ["n1","n2"] }        // atau { "arg": "all" }

// api.getWallet()            ← tanpa argumen
POST /rpc/getWallet
{}
```

> Aturannya harus **mekanis**, bukan per metode: begitu ada satu metode yang
> namanya diterjemahkan khusus, `api/http/` berhenti jadi terjemahan dan mulai
> jadi lapisan yang bisa salah sendiri.

### 2.2 Bentuk jawaban

**Berhasil — `200`**, badan = nilai kembalian metode, apa adanya:

```json
{ "id": "…", "balance": 20000, "bonus": 23, "updatedAt": "2026-09-06T…Z" }
```

Metode `Promise<void>` menjawab `200` dengan badan `null`.

**Gagal — status HTTP sesuai kelasnya**, badan selalu bentuk yang sama:

```json
{
  "error": {
    "code": "INSUFFICIENT_COINS",
    "message": "Koin kamu kurang 1.200 untuk membuka bab ini.",
    "retryable": false,
    "details": { "need": 1200, "balance": 300 }
  }
}
```

| Kelas | HTTP | `code` |
|---|---|---|
| Validasi gagal | `400` | `VALIDATION` |
| Belum masuk / token kedaluwarsa | `401` | `AUTH-401` |
| Tidak berhak | `403` | `FORBIDDEN` |
| Tidak ada | `404` | `NOT_FOUND` |
| Bentrok keadaan | `409` | `CONFLICT`, `SCHED-409`, `PRINT-409`, `DRAFT-409` |
| Kuota / rate limit | `429` | `QUOTA_EXCEEDED`, `AUTH-429` |
| Koin kurang | `402` | `INSUFFICIENT_COINS` |
| Versi klien terlalu tua | `426` | `APP-426` |
| Kegagalan server | `500` | `UNKNOWN` |

> `message` **ditampilkan ke pengguna** dan sudah berbahasa Indonesia di
> server-mock. Backend wajib meneruskan kebiasaan itu: pesan gagal di aplikasi
> ini menjawab tiga hal berurutan — apa yang terjadi → apakah uang/tulisanmu aman
> → satu tindakan (`architecture.md` §1.4).

### 2.3 Autentikasi

Bentuknya **sudah** benar di klien (FR-AUTH-12) dan tidak boleh diubah:

- **Access token di memori**, umur pendek (15 menit disarankan). Tidak pernah di
  `localStorage`.
- **Refresh token di cookie `HttpOnly; Secure; SameSite=Lax`**, tidak pernah
  terbaca JavaScript — karena itu ia **tidak muncul di kontrak mana pun**.
- `POST /rpc/refresh` menukar cookie jadi access token baru.
- **"Ingat saya"** (`LoginInput.remember`) menentukan umur refresh token: dicentang
  → panjang dengan pembaruan; tidak → sesi berakhir saat peramban ditutup.
- `401` + `code: "AUTH-401"` memicu lembar masuk ulang di klien. Jangan memakai
  `401` untuk hal lain.

### 2.4 Idempotency — wajib, bukan opsional

Setiap mutasi yang menyentuh uang membawa `idempotencyKey` (sudah ada di
kontrak: `UnlockInputSchema`, `TopupInputSchema`).

Aturan servernya:

1. Simpan `(idempotency_key, operation, user_id)` **sebelum** efeknya dijalankan.
2. Kunci yang sama + operasi yang sama → **kembalikan jawaban tersimpan**, jangan
   jalankan ulang. `UnlockResult.alreadyOwned = true`.
3. Kunci yang sama + operasi **berbeda** → `409 CONFLICT`. Itu bug klien, dan
   menyembunyikannya berarti membiarkan satu kunci memotong dua hal berbeda.
4. Simpan minimal 24 jam.

Tanpa ini, menekan "Buka bab" dua kali memotong koin dua kali (FR-READ-07).

---

## 3. Skema database

**38 tabel.** Kolom bertanda 🆕 **tidak ada di server-mock** — ia memang tidak
bisa ada di sana (kata sandi, token, langganan push), dan backend sungguhan
wajib menambahkannya.

Legenda kolom: **N** = boleh `NULL` · **D** = ada nilai bawaan.

### 3.1 Identitas & sesi

#### `users`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `display_name` | `varchar(50)` | | `ProfileUpdate.displayName` maks 50 |
| `username` | `citext` | | **UNIQUE**, 3–20 karakter |
| `avatar_url` | `text` | ✓ | |
| `bio` | `varchar(160)` | | D `''` |
| `role` | `text` | | `'reader' \| 'author'` — diturunkan dari `author_profiles.tier`, lihat §5 |
| `tier` | `smallint` | | 1–5, tingkat pembaca (bukan tingkat penulis) |
| `pen_name` | `varchar(50)` | ✓ | |
| `author_bio` | `varchar(300)` | | D `''` |
| `joined_year` | `smallint` | | Bisa diturunkan dari `created_at`; disimpan karena tampil di kartu profil |
| `birth_date` | `date` | ✓ | 🆕 **belum ada** — prasyarat gerbang usia, `todo-incoming-features.md` A1 |
| `created_at` | `timestamptz` | | D `now()` |
| `deleted_at` | `timestamptz` | ✓ | Penghapusan akun bertenggang; lihat `account_deletions` |

```sql
CREATE UNIQUE INDEX ON users (username) WHERE deleted_at IS NULL;
```

#### `credentials` 🆕

Server-mock **tidak menyimpan kata sandi sama sekali** — ia menerima apa pun yang
cocok dengan seed. Backend sungguhan wajib punya tabel ini.

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK, FK → `users` |
| `email` | `citext` | | **UNIQUE** |
| `email_verified_at` | `timestamptz` | ✓ | |
| `phone` | `varchar(20)` | ✓ | UNIQUE bila terisi; opsional saat daftar |
| `phone_verified_at` | `timestamptz` | ✓ | |
| `password_hash` | `text` | | **Argon2id**, bukan bcrypt |
| `password_changed_at` | `timestamptz` | | Faktor skor keamanan (§5.7) |
| `two_factor_secret` | `text` | ✓ | Terenkripsi saat istirahat |
| `accepted_terms_at` | `timestamptz` | | `RegisterInput.acceptedTerms` — dasar hukum, tidak boleh cuma centang di layar |

> **`identity` satu kolom, dua bentuk.** `LoginInput.identity` menerima email
> **atau** nomor HP, dan klien sengaja tidak menebak mana yang dimaksud. Servernya
> yang mencocokkan ke `email` lalu `phone`.

#### `refresh_tokens` 🆕

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `user_id` | `uuid` | | FK → `users` |
| `token_hash` | `text` | | **Hash**, bukan tokennya — pembobol basis data tidak boleh mendapat sesi |
| `device_session_id` | `uuid` | ✓ | FK → `device_sessions` |
| `remember` | `boolean` | | `LoginInput.remember` menentukan `expires_at` |
| `expires_at` | `timestamptz` | | |
| `revoked_at` | `timestamptz` | ✓ | Diisi `revokeDeviceSession` dan ganti kata sandi |
| `created_at` | `timestamptz` | | D `now()` |

#### `device_sessions`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `user_id` | `uuid` | | FK → `users` |
| `device` | `text` | | `"Chrome di Windows"` — diurai dari User-Agent |
| `location` | `text` | | Dari IP; perkiraan, dan layarnya menyebutnya perkiraan |
| `last_active_at` | `timestamptz` | | |
| `revoked_at` | `timestamptz` | ✓ | |

> `DeviceSession.current` **diturunkan**, bukan kolom: ia benar untuk sesi yang
> sedang memanggil. Menyimpannya berarti dua baris bisa sama-sama mengaku
> "current".

#### `login_attempts`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `identity` | `citext` | | Yang **diketik**, bukan user id — percobaan ke akun tak dikenal juga dihitung |
| `device_id` | `text` | ✓ | |
| `ip` | `inet` | ✓ | |
| `failed_at` | `timestamptz` | | |

Lima gagal dalam 15 menit → `429 AUTH-429`. Hitung **per identitas dan per IP**;
per identitas saja membuka penyapuan dari satu IP ke banyak akun.

#### `author_profiles`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK, FK → `users` |
| `tier` | `author_tier` | | D `'none'` |
| `payout_verified` | `boolean` | | D `false` |
| `two_factor` | `boolean` | | D `false` |
| `terms_accepted_at` | `timestamptz` | ✓ | |

> **Tingkatnya menegakkan uang.** Hanya `verified` boleh menetapkan bab berbayar
> dan mencairkan. Ini **ditegakkan server** — klien juga memeriksanya, tetapi
> pemeriksaan klien cuma demi pesan yang lebih baik.

#### `payout_accounts`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK, FK → `users` |
| `bank_name` | `text` | | |
| `owner_name` | `text` | | |
| `account_number_enc` | `bytea` | | **Terenkripsi.** Tidak pernah keluar dari server |
| `masked` | `text` | | `"•••• 4821"` — **hanya ini** yang dikirim ke klien |
| `verified_at` | `timestamptz` | ✓ | |

> `PayoutAccount` yang dikirim klien = `bank_name` + `owner_name` + `masked` +
> dua bendera dari `author_profiles`. Nomor penuh tidak pernah ikut
> (`architecture.md` §1.15).

#### `privacy_settings`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK, FK → `users` |
| `reading_activity` | `boolean` | | D `true` |
| `library` | `boolean` | | D `true` |
| `reviews` | `boolean` | | D `true` |
| `wallet` | `boolean` | | D `false` — **dipaksa `false` di server**, aturan platform bukan preferensi |

```sql
wallet boolean NOT NULL DEFAULT false CHECK (wallet = false)
```

> Constraint-nya bukan hiasan: `setPrivacySettings` di server-mock **memaksa**
> `wallet: false` apa pun yang dikirim klien (§1.41). Menaruhnya di basis data
> membuat aturan itu selamat dari handler yang lupa.

#### `locale_settings`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK, FK → `users` |
| `ui_lang` | `text` | | D `'id'` |
| `translation_priority` | `text` | | |
| `content_region` | `text` | | D `'ID'` |
| `currency` | `text` | | `'IDR' \| 'USD'`, D `'IDR'` |
| `timezone` | `text` | | D `'Asia/Jakarta'` — **dipakai jam tenang, streak, kuota harian** |

#### `reader_prefs`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK, FK → `users` |
| `onboarded_at` | `timestamptz` | ✓ | `null` = belum. Melewati onboarding juga mengisinya |
| `show_adult_content` | `boolean` | | D `false` — sakelar "tampilkan cerita 18+" (A1). **Bukan izin**: hanya berarti bila akunnya terverifikasi dewasa |

#### `age_verifications` · A1

Verifikasi **dokumen (KTP)** — keputusan pengguna, bukan swa-deklarasi. Berkasnya
milik object storage; yang ada di sini rujukannya dan keputusannya.

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK, FK → `users` |
| `status` | `age_verify_status` | | D `'none'` |
| `birth_date` | `date` | ✓ | Diisi pengguna, **dikonfirmasi peninjau** dari dokumen |
| `document_key` | `text` | ✓ | Kunci di object storage. **Tidak pernah** dikirim ke klien; klien cuma menerima `document_name` |
| `document_name` | `text` | ✓ | |
| `document_size` | `integer` | ✓ | |
| `submitted_at` | `timestamptz` | ✓ | |
| `decided_at` | `timestamptz` | ✓ | |
| `decided_by` | `uuid` | ✓ | Peninjau — jejak audit, tidak dikirim ke klien |
| `reject_reason` | `text` | ✓ | **Wajib** saat `rejected` |

```sql
CHECK (status <> 'rejected' OR reject_reason IS NOT NULL),
CHECK (status <> 'pending'  OR document_key IS NOT NULL)
```

> **`isAdult` tidak disimpan** — ia `status = 'verified' AND age(birth_date) >= 18`
> dihitung **hari ini** (§5). Akun yang diverifikasi pada 17 tahun 11 bulan jadi
> dewasa sebulan kemudian tanpa ada yang menulis apa pun. Aturan usianya satu
> berkas, dua pembaca: `src/lib/age.ts`.
>
> Dokumen KTP adalah data pribadi paling sensitif di aplikasi ini. Enkripsi di
> object storage, umur simpan terbatas setelah keputusan, dan **tidak pernah**
> ikut ekspor data pengguna lain.

#### `content_policy` · A1

Kebijakan platform, **satu baris**, diatur admin — bukan pengguna. Pengguna
meminta *"nanti dari backend bisa diatur cara hidden-nya"*.

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `smallint` | | PK, selalu `1` |
| `adult_mode` | `adult_mode` | | D `'gated'`. `gated`: kartu & detail tampil berlencana 18+, **isi bab** ditahan · `hidden`: tidak dikirim sama sekali, tautan langsung `NOT_FOUND` |
| `updated_at` | `timestamptz` | | |

Genre favoritnya pindah ke tabel sendiri karena **berurutan**:

#### `reader_genre_prefs`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `genre` | `genre` | | PK bersama |
| `rank` | `smallint` | | Urutan pilihan — ia **mengurutkan** beranda, tidak menyaring |

#### `follows`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `follower_id` | `uuid` | | PK bersama, FK → `users` |
| `followee_id` | `uuid` | | PK bersama, FK → `users` |
| `created_at` | `timestamptz` | | D `now()` |

```sql
PRIMARY KEY (follower_id, followee_id),
CHECK (follower_id <> followee_id)
```

#### `blocks`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama — yang memblokir |
| `blocked_user_id` | `uuid` | | PK bersama |
| `created_at` | `timestamptz` | | D `now()` |

> Blokir **searah**: menyembunyikan dari pemblokir saja, tidak memengaruhi orang
> lain, dan tidak menghapus apa pun (§1.18).

---

### 3.2 Katalog

#### `stories`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `author_id` | `uuid` | | FK → `users` |
| `title` | `varchar(100)` | | **100**, bukan 80 — PRD menang atas kanvas |
| `synopsis` | `varchar(1000)` | | **1000**, bukan 1200 |
| `cover_url` | `text` | ✓ | Rasio 2:3, toleransi ±0,12 |
| `banner_url` | `text` | ✓ | Lanskap; terpisah karena rasionya berbeda |
| `pen_name` | `text` | | Nama pena **saat terbit** — sengaja disalin, bukan join |
| `audience` | `audience` | | |
| `language` | `text` | | `'Indonesia' \| 'English' \| 'Malay'` |
| `status` | `story_status` | | |
| `kind` | `story_kind` | | `fiksi` / `kisah` — **tegak lurus genre** |
| `review` | `review_state` | | |
| `reject_reason` | `text` | ✓ | Wajib terisi saat `review = 'rejected'` |
| `visibility` | `visibility` | | |
| `monetize_type` | `monetize_type` | | |
| `full_access_coins` | `integer` | ✓ | Harga akses penuh |
| `badge` | `text` | ✓ | `"HOT"`, `"BARU"` |
| `comments_enabled` | `boolean` | | D `true` |
| `moderate_comments` | `boolean` | | D `false` |
| `allow_translation` | `boolean` | | D `false` |
| `allow_fanfiction` | `boolean` | | D `false` |
| `dedication` | `text` | | D `''` |
| `author_note` | `text` | | D `''` |
| `editor_note` | `text` | ✓ | Hanya di halaman detail |
| `growth_note` | `text` | ✓ | |
| `published_at` | `timestamptz` | ✓ | |
| `updated_at` | `date` | | ⚠️ `LocalDate` — tanggal yang ditampilkan, bukan stempel |
| `created_at` | `timestamptz` | | D `now()` |
| `deleted_at` | `timestamptz` | ✓ | |

```sql
CHECK (review <> 'rejected' OR reject_reason IS NOT NULL)
```

> **`pen_name` disalin, dan itu disengaja.** Penulis boleh mengganti nama
> penanya; cerita yang sudah terbit tidak boleh berubah atribusinya surut.

#### `story_genres` · `story_tags` · `story_content_labels`

| Tabel | Kolom | Catatan |
|---|---|---|
| `story_genres` | `story_id uuid`, `genre genre` | PK bersama. **Minimal satu** — ditegakkan aplikasi; SQL tidak bisa menuntut baris anak minimal |
| `story_tags` | `story_id uuid`, `tag citext` | PK bersama. Maks 10 per cerita |
| `story_content_labels` | `story_id uuid`, `label content_label` | PK bersama |

```sql
CREATE INDEX ON story_tags (tag);      -- "berapa cerita per tag" di hasil pencarian
CREATE INDEX ON story_genres (genre);  -- tab beranda
```

#### `chapters`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `story_id` | `uuid` | | FK → `stories` |
| `number` | `integer` | | **UNIQUE bersama `story_id`** |
| `title` | `text` | | |
| `access` | `chapter_access` | | |
| `price_coins` | `integer` | | D `0`, **dijepit 1–50 saat `access='paid'`** |
| `read_minutes` | `integer` | | D `0` |
| `word_count` | `integer` | | D `0` |
| `state` | `chapter_state` | | |
| `review` | `review_state` | | |
| `publish_at` | `timestamptz` | ✓ | UTC |
| `publish_tz` | `text` | ✓ | **Zona penulis saat menjadwalkan** — disimpan bersama UTC |
| `preview_pct` | `smallint` | | D `0`, `CHECK (preview_pct BETWEEN 0 AND 50)` |
| `access_changed_at` | `timestamptz` | ✓ | |
| `private_reason` | `text` | ✓ | |
| `private_until` | `date` | ✓ | ⚠️ `LocalDate` |
| `withdrawn_at` | `timestamptz` | ✓ | → `CONTENT-410` + refund otomatis |
| `edited_at` | `timestamptz` | | |
| `created_at` | `timestamptz` | | D `now()` |

```sql
UNIQUE (story_id, number),
CHECK (access <> 'paid' OR price_coins BETWEEN 1 AND 50)
```

> `views`, `rating`, `comment_count` **tidak disimpan di sini** — ketiganya
> turunan. Lihat §5.

#### `chapter_contents`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `chapter_id` | `uuid` | | PK bersama, FK → `chapters` |
| `lang` | `content_lang` | | PK bersama. Versi `id` **wajib**, `en` opsional |
| `title` | `text` | | Judul dalam bahasa itu |
| `body` | `text[]` | | Paragraf. Lihat §1.5 — **sengaja tetap array** |
| `author_note` | `text` | ✓ | |
| `updated_at` | `timestamptz` | | Autosave server tiap 30 detik |

> **"Lengkap atau tidak ada"** (FR-STUDIO-19): baris `en` yang judulnya terisi
> tetapi badannya kosong harus ditolak, bukan disimpan setengah.

---

### 3.3 Pembaca

#### `ownerships`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `chapter_id` | `uuid` | | PK bersama |
| `source` | `ownership_source` | | Bagaimana didapat |
| `acquired_at` | `timestamptz` | | D `now()` |

```sql
PRIMARY KEY (user_id, chapter_id)   -- inilah yang membuat potongan ganda mustahil
```

> **PK gabungannya adalah pengaman uang.** Idempotency mencegah permintaan kembar;
> PK ini mencegah segalanya yang lain. Jangan menggantinya dengan `id` + indeks
> unik terpisah yang bisa lupa dipasang.

#### `library_entries`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `story_id` | `uuid` | | PK bersama |
| `saved_at` | `date` | | ⚠️ `LocalDate`. **Tidak berubah** saat "Urungkan" |
| `notify` | `boolean` | | D `true` — sakelar notifikasi per cerita |
| `following` | `boolean` | | D `false` — Simpan ≠ Ikuti |
| `removed` | `boolean` | | D `false` — **tombstone**, bukan hapus baris |
| `last_visited_at` | `timestamptz` | ✓ | Dasar titik "bab baru" |

#### `reading_progress`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `story_id` | `uuid` | | PK bersama |
| `last_chapter_id` | `uuid` | ✓ | Tujuan "Lanjut Baca" |
| `scroll_pct` | `real` | | D `0`, 0–1. Posisi **bab terakhir** |
| `updated_at` | `timestamptz` | | |

#### `reading_progress_chapters`

**Menggantikan tiga `Record` sekaligus** — `finishedChapterIds`,
`scrollByChapter`, dan `finishedAt` berkunci sama: (pembaca, bab).

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `chapter_id` | `uuid` | | PK bersama |
| `story_id` | `uuid` | | Redundan, dan sengaja: seluruh kueri menyaring per cerita |
| `scroll_pct` | `real` | | D `0` — posisi **per bab** (§1.24) |
| `finished_at` | `date` | ✓ | ⚠️ `LocalDate`. `NULL` = belum selesai. **Misi harian dibaca dari sini** |

```sql
CREATE INDEX ON reading_progress_chapters (user_id, finished_at);  -- misi "3 bab hari ini"
CREATE INDEX ON reading_progress_chapters (user_id, story_id);
```

#### `reader_story_state`

**Menggantikan empat kolom `ReaderPrefs` sekaligus.** Keempatnya berkunci sama:
(pembaca, cerita).

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `story_id` | `uuid` | | PK bersama |
| `hidden` | `boolean` | | D `false` — disembunyikan lewat aksi geser |
| `auto_unlock` | `boolean` | | D `false` — **izin memotong koin**, karena itu milik server |
| `auto_unlock_count` | `integer` | | D `0` — bab yang dibuka **aplikasi**, bukan pembaca |
| `bundle_offer_seen` | `boolean` | | D `false` — supaya "sekali per cerita" benar-benar sekali |

> Baris ini **memberi wewenang memotong koin**. Ia tidak boleh hidup di
> perangkat (aturan struktur #5): izin yang tertinggal di ponsel lama berarti
> koin terpotong di satu perangkat tanpa jejak di perangkat lain.

#### `offline_chapters`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `chapter_id` | `uuid` | | PK bersama |
| `story_id` | `uuid` | | |
| `saved_at` | `timestamptz` | | |
| `last_opened_at` | `timestamptz` | | **Dasar LRU** — yang paling lama tidak dibuka dilepas lebih dulu |

> Batas **50 bab per pengguna**, ditegakkan server. `storyTitle` dan
> `chapterLabel` di kontrak adalah hasil join, bukan kolom.

---

### 3.4 Uang

#### `wallets`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK, FK → `users` |
| `balance` | `integer` | | D `0`, `CHECK (balance >= 0)` |
| `bonus` | `integer` | | D `0`, `CHECK (bonus >= 0)` — **masa berlakunya sendiri**, karena itu dipisah |
| `updated_at` | `timestamptz` | | |

#### `transactions`

**Buku besar. Tidak pernah di-`UPDATE`, tidak pernah di-`DELETE`** — refund
adalah baris balik, bukan pembatalan baris lama.

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `user_id` | `uuid` | | FK → `users` |
| `kind` | `tx_kind` | | |
| `amount` | `integer` | | **Positif menambah, negatif mengurangi** |
| `title` | `text` | | |
| `ref_type` | `tx_ref_type` | | |
| `ref_id` | `uuid` | ✓ | |
| `method` | `text` | ✓ | Hanya pada baris isi koin |
| `status` | `tx_status` | | |
| `balance_before` | `integer` | | Direkam **saat itu**, bukan dihitung ulang |
| `balance_after` | `integer` | | |
| `receipt_number` | `text` | ✓ | |
| `related_order_id` | `uuid` | ✓ | FK → `topup_orders` |
| `price_rupiah` | `integer` | ✓ | Hanya baris isi koin |
| `bonus_coins` | `integer` | ✓ | `0` = tidak ada; `NULL` = bukan isi koin |
| `note` | `text` | ✓ | |
| `created_at` | `timestamptz` | | D `now()` |

```sql
CREATE INDEX ON transactions (user_id, created_at DESC);
CREATE INDEX ON transactions (user_id, kind);
CREATE INDEX ON transactions (user_id, status);
```

> **`balance_before` / `balance_after` disimpan, bukan diturunkan.** Menghitung
> ulang saldo historis dari jumlah kumulatif berarti satu baris yang salah
> menggeser seluruh riwayat sesudahnya — dan pengguna melihatnya sebagai
> "riwayat saya berubah sendiri".
>
> `refLabel` dan `refLink` di `TransactionDetail` **diturunkan** dari
> `ref_type`+`ref_id`, bukan kolom.

#### `topup_orders`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `user_id` | `uuid` | | FK → `users` |
| `coins` | `integer` | | |
| `bonus` | `integer` | | D `0` |
| `price_rupiah` | `integer` | | |
| `method` | `text` | | |
| `method_type` | `pay_method_type` | | |
| `status` | `topup_status` | | |
| `payload` | `text` | ✓ | Deeplink / string QR / nomor VA — beda per tipe |
| `bank` | `text` | ✓ | Label bank untuk layar VA |
| `expires_at` | `timestamptz` | | 15 mnt e-wallet · 30 QRIS · 1440 VA |
| `reconcile_at` | `timestamptz` | ✓ | Saat `pending_reconciliation` |
| `failure_code` | `text` | ✓ | `PAY-402` · `PAY-410` · `PAY-504` |
| `idempotency_key` | `text` | | **UNIQUE bersama `user_id`** |
| `return_route` | `text` | ✓ | Ke mana pengguna kembali setelah bayar |
| `return_chapter_id` | `uuid` | ✓ | |
| `return_need_coins` | `integer` | ✓ | |
| `created_at` | `timestamptz` | | D `now()` |

> **`pending_reconciliation` bukan "gagal".** Penyedia tidak menjawab, jadi
> uangnya **mungkin** sudah berpindah. Selama status ini, server **menolak
> pesanan baru** dari pengguna yang sama — membayar dua kali lebih merugikan
> daripada menunggu sepuluh menit (`architecture.md` §1.4).

#### `pay_methods` · `coin_packages`

Keduanya **konfigurasi**, bukan data pengguna. Di server-mock keduanya konstanta
di `lib/coin.ts` dan `seed.ts`; di backend ia tabel supaya harga dan bonus bisa
berubah **tanpa rilis aplikasi**.

| `pay_methods` | Tipe | Catatan |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | `"GoPay"`, `"BCA Virtual Account"` |
| `type` | `pay_method_type` | |
| `expiry_minutes` | `integer` | |
| `bank` | `text` ✓ | |
| `active` | `boolean` | D `true` — nonaktifkan, jangan hapus: pesanan lama menunjuk ke sini |

| `coin_packages` 🆕 | Tipe | Catatan |
|---|---|---|
| `id` | `uuid` | PK |
| `coins` | `integer` | |
| `price_rupiah` | `integer` | |
| `bonus_coins` | `integer` | D `0` |
| `note` | `text` | |
| `sort_order` | `smallint` | |
| `active` | `boolean` | D `true` |

#### `ad_quotas`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `date` | `date` | | PK bersama. ⚠️ **Tanggal lokal pengguna**, bukan UTC |
| `used` | `integer` | | D `0` |
| `max` | `integer` | | Disimpan, bukan konstanta — batasnya bisa berbeda per pengguna |

#### `idempotency_keys`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `key` | `text` | | PK bersama |
| `user_id` | `uuid` | | PK bersama — kunci milik satu pengguna |
| `operation` | `text` | | Nama metode. Kunci sama + operasi beda → `409` |
| `response` | `jsonb` | | Jawaban tersimpan, dikembalikan apa adanya |
| `created_at` | `timestamptz` | | D `now()`; bersihkan setelah 24 jam |

---

### 3.5 Sosial

#### `ratings`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `story_id` | `uuid` | | PK bersama |
| `stars` | `smallint` | | `CHECK (stars BETWEEN 1 AND 5)` |
| `updated_at` | `timestamptz` | | |

> **Rating ≠ ulasan, dan arahnya tidak simetris** (§1.16): memberi bintang tanpa
> teks sah, dan **menghapus ulasan tidak menghapus ratingnya**. Dua tabel, bukan
> satu dengan teks opsional.
>
> Memberi rating menuntut **sudah membaca satu bab** — dicek server dari
> `reading_progress_chapters`.

#### `reviews`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `user_id` | `uuid` | | |
| `story_id` | `uuid` | | |
| `stars` | `smallint` | | 1–5 |
| `text` | `text` | | D `''` — kosong berarti rating tanpa teks |
| `spoiler` | `boolean` | | D `false` |
| `under_review` | `boolean` | | D `false` |
| `edited_at` | `timestamptz` | ✓ | |
| `created_at` | `timestamptz` | | D `now()` |

```sql
CREATE UNIQUE INDEX ON reviews (user_id, story_id);  -- satu ulasan per pasangan
```

#### `review_tags` · `review_replies`

| `review_tags` | `review_id uuid`, `tag citext` | PK bersama. **Maks 3** |
|---|---|---|

| `review_replies` | Tipe | Catatan |
|---|---|---|
| `review_id` | `uuid` | **PK** — satu tanggapan per ulasan |
| `author_id` | `uuid` | Hanya pemilik cerita; ditegakkan server |
| `text` | `text` | |
| `updated_at` | `timestamptz` | |

#### `comments`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `chapter_id` | `uuid` | | |
| `user_id` | `uuid` | | |
| `parent_id` | `uuid` | ✓ | FK → `comments` |
| `text` | `varchar(500)` | | |
| `spoiler` | `boolean` | | D `false` |
| `under_review` | `boolean` | | D `false` — barisnya **tetap ada**, isinya diganti keterangan |
| `created_at` | `timestamptz` | | D `now()` |

> **Kedalaman satu tingkat, ditegakkan server.** `parentId` boleh menunjuk
> balasan; server menaikkannya ke induk teratas, sehingga utas tidak pernah lebih
> dalam dari satu tingkat **tanpa klien perlu tahu aturannya**.
>
> ```sql
> CHECK (parent_id IS NULL OR parent_id <> id)
> ```
> Kedalaman sebenarnya tidak bisa dijamin SQL biasa; tegakkan di jalur tulis, dan
> lindungi dengan trigger bila mau ikat pinggang ganda.

#### `reactions`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK bersama |
| `target_type` | `react_target` | | PK bersama |
| `target_id` | `uuid` | | PK bersama |
| `created_at` | `timestamptz` | | D `now()` |

> `helpfulCount` / `likeCount` **diturunkan** dari tabel ini. Kalau kelak jadi
> beban, materialisasikan sebagai kolom penghitung — tetapi **dalam transaksi
> yang sama**, jangan lewat kerja terjadwal.

#### `reports`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `reporter_id` | `uuid` | | |
| `target_type` | `report_target` | | `'chapter'` sejak A5: ambang berlaku **per bab** → `chapters.review = 'in_review'` |
| `target_id` | `uuid` | | |
| `reason` | `report_reason` | | |
| `note` | `text` | | D `''`. **Wajib terisi** saat `reason='lainnya'` |
| `status` | `text` | | `'open' \| 'resolved'` |
| `created_at` | `timestamptz` | | D `now()` |

```sql
CREATE UNIQUE INDEX ON reports (reporter_id, target_type, target_id);
CHECK (reason <> 'lainnya' OR length(btrim(note)) > 0)
```

> **Melapor bukan membungkam.** Konten tetap tampil sampai melewati ambang, lalu
> disembunyikan sambil menunggu tinjauan — bukan dihapus (§1.18).

---

### 3.6 Notifikasi

#### `notifications`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `user_id` | `uuid` | | |
| `kind` | `notif_kind` | | **Disimpan**, bukan diturunkan dari `deep_link` |
| `type` | `notif_type` | | Saringan. Diturunkan dari `kind` lewat tabel di `lib/notif.ts` |
| `title` | `text` | | |
| `body` | `text` | | |
| `deep_link` | `text` | | **Selalu ada** — tidak ada notifikasi yang hanya bisa dibaca |
| `group_key` | `text` | ✓ | `NULL` = tidak pernah digabung |
| `group_count` | `integer` | | D `1` |
| `read_at` | `timestamptz` | ✓ | |
| `created_at` | `timestamptz` | | D `now()` |

```sql
CREATE INDEX ON notifications (user_id, created_at DESC);
CREATE INDEX ON notifications (user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX ON notifications (user_id, group_key) WHERE group_key IS NOT NULL;
```

> **Penggabungan terjadi saat menulis, bukan saat membaca** (FR-NOTIF-02).
> Notifikasi berkunci sama dalam 24 jam menaikkan `group_count` baris yang sudah
> ada **dan mengembalikan `read_at` ke `NULL`** — bab ketiga yang terbit setelah
> pembaca membuka barisnya adalah kabar baru.
>
> Lebih lama dari **90 hari** tidak ditampilkan.

#### `notification_prefs` · `notification_pref_channels`

| `notification_prefs` | Tipe | Catatan |
|---|---|---|
| `user_id` | `uuid` | PK |
| `quiet_hours_enabled` | `boolean` | D `true` |
| `quiet_hours_from` | `smallint` | D `22`, 0–23 |
| `quiet_hours_to` | `smallint` | D `7`, 0–23 |

| `notification_pref_channels` | Tipe | Catatan |
|---|---|---|
| `user_id` | `uuid` | PK bersama |
| `group` | `notif_group` | PK bersama |
| `in_app` | `boolean` | |
| `push` | `boolean` | |
| `email` | `boolean` | |

```sql
-- keamanan tidak bisa dimatikan; email boleh, karena ia salinan bukan peringatan
CHECK ("group" <> 'sistem' OR (in_app AND push))
```

> **Jam tenang menunda push, bukan notifikasinya.** Barisnya tetap ditulis saat
> itu juga; yang diputuskan hanya apakah perangkat berdering. Jendelanya **boleh
> melintasi tengah malam** (22→7), dan jamnya dibaca dari
> `locale_settings.timezone` — bukan jam server.

#### `push_subscriptions` 🆕

Kontraknya sudah ada (`PushSubscriptionSchema`), **tabelnya tidak pernah ada**.

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `user_id` | `uuid` | | |
| `endpoint` | `text` | | **UNIQUE** |
| `p256dh` | `text` | | |
| `auth` | `text` | | |
| `user_agent` | `text` | ✓ | |
| `created_at` | `timestamptz` | | D `now()` |
| `last_success_at` | `timestamptz` | ✓ | |

> Endpoint yang dijawab `404`/`410` oleh layanan push **dihapus**, bukan dicoba
> lagi. Langganan mati yang dipertahankan akan memperlambat setiap pengiriman
> berikutnya.

---

### 3.7 Studio, jadwal & penghasilan

#### `schedule_entries`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `story_id` | `uuid` | | |
| `chapter_id` | `uuid` | ✓ | `NULL` = jadwal ceritanya, bukan babnya |
| `publish_at_utc` | `timestamptz` | ✓ | |
| `author_tz` | `text` | | **Zona penulis, disimpan bersama UTC** |
| `cadence` | `text` | | `"mingguan"`, `"2x seminggu"` |
| `note` | `text` | ✓ | |

> `kind` (`ok` / `gap` / `clash`) **diturunkan** saat dibaca — lihat §5.
>
> Zona waktu ikut disimpan karena `SCHED-200`: bila zona penulis berubah, momen
> terbitnya **tetap**, hanya tampilannya bergeser. Itu peringatan, bukan
> kegagalan — dan tanpa `author_tz` ia tidak bisa dibedakan dari jadwal yang
> memang salah.

#### `print_orders`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `order_number` | `text` | | **UNIQUE**, `#SFT-20260906-001` / `#HDC-…` |
| `user_id` | `uuid` | | |
| `story_id` | `uuid` | | |
| `story_title` | `text` | | Disalin — judul boleh berubah, pesanan tidak |
| `kind` | `print_kind` | | |
| `spec` | `text` | | |
| `status` | `text` | | Enum `print_status` |
| `stage_index` | `smallint` | ✓ | 0–5 pada enam tahap PRD; `NULL` untuk softcopy |
| `cost_quoted` | `integer` | ✓ | Rupiah |
| `cost_final` | `integer` | ✓ | Berbeda dari quoted → `PRINT-402`, produksi berhenti |
| `reject_reason` | `text` | ✓ | Konkret — mis. syarat minimum 10 bab aktif |
| `tracking_number` | `text` | ✓ | |
| `eta_note` | `text` | ✓ | |
| `file_name` | `text` | ✓ | |
| `file_size` | `text` | ✓ | |
| `file_expires_at` | `timestamptz` | ✓ | 30 hari → `PRINT-410` |
| `note` | `text` | ✓ | |
| `created_at` | `timestamptz` | | D `now()` |

> **Pembatalan dibatasi tahap**, dan tombolnya **tetap ada**: yang menolak
> servernya, beserta biayanya. Tombol yang hilang tidak menjelaskan apa pun.

#### `withdrawals`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `user_id` | `uuid` | | |
| `amount` | `integer` | | Rupiah kotor |
| `fee` | `integer` | | D `5000` — **disalin saat pengajuan**, bukan dibaca dari config saat tampil |
| `net` | `integer` | | `amount - fee`, `CHECK (net > 0)` |
| `purpose` | `text` | | Tiga tujuan tetap |
| `bank_name` | `text` | | Disalin dari `payout_accounts` |
| `bank_account_masked` | `text` | | **Tersamar**, selalu |
| `status` | `withdraw_status` | | |
| `reason` | `text` | ✓ | **Wajib saat `rejected`** |
| `proof_url` | `text` | ✓ | |
| `requested_at` | `timestamptz` | | D `now()` |
| `settled_at` | `timestamptz` | ✓ | |

```sql
CHECK (status <> 'rejected' OR reason IS NOT NULL)
```

> **Biaya dan kurs disalin ke barisnya.** Kebijakan boleh berubah; riwayat
> pencairan tidak boleh ikut berubah surut. Ini kesalahan yang sangat mudah
> dibuat dengan membaca `SERVER_CONFIG` saat menampilkan.
>
> Saldo tersedia **sudah dikurangi** pengajuan yang masih diproses — ditahan
> sejak pengajuan berhasil, bukan saat ditransfer.

---

### 3.8 Hadiah

#### `rewards`

Hanya yang **tidak bisa dihitung ulang** (§1.38).

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK |
| `check_in_streak` | `integer` | | D `0` |
| `last_check_in` | `date` | ✓ | ⚠️ **Tanggal lokal pengguna** |
| `referral_code` | `text` | | **UNIQUE** |

> Streak yang **berlaku** dihitung dari `last_check_in` vs hari ini — bukan
> dibaca mentah. Menyimpan streak turunan berarti ia basi tanpa ada yang tahu,
> dan streak basi berarti hadiah yang bisa diambil dua kali. Tidak ada kerja
> tengah malam yang dibutuhkan.

#### `mission_catalog` · `mission_claims`

| `mission_catalog` | Tipe | Catatan |
|---|---|---|
| `id` | `uuid` | PK |
| `kind` | `mission_kind` | **Menentukan dari mana progresnya dibaca** — disimpan, bukan ditebak dari judul |
| `title` · `description` | `text` | Boleh diubah copywriter kapan saja |
| `target` | `integer` | |
| `reward_coins` | `integer` | |
| `action_link` · `action_label` | `text` | |
| `active` | `boolean` | D `true` |

| `mission_claims` | Tipe | Catatan |
|---|---|---|
| `user_id` | `uuid` | PK bersama |
| `mission_id` | `uuid` | PK bersama |
| `local_date` | `date` | PK bersama — ⚠️ tanggal lokal |
| `claimed_at` | `timestamptz` | |

> **Progres misi tidak disimpan.** `read` dihitung dari
> `reading_progress_chapters.finished_at = hari ini`, `review` dari `reviews`
> hari ini, `ad` dari `ad_quotas.used`. Yang disimpan cuma klaimnya.

#### `referral_invites`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `inviter_id` | `uuid` | | PK bersama — yang mengundang |
| `invitee_id` | `uuid` | | PK bersama — yang diundang |
| `joined_at` | `timestamptz` | | |
| `read_first_chapter` | `boolean` | | D `false` |
| `rewarded_coins` | `integer` | | D `0` |

> Dua kolom id, dan namanya **harus** berbeda. Di server-mock keduanya sempat
> bernama `userId`, dan satu nama untuk dua arti lolos typecheck lalu muncul
> sebagai kunci React ganda di peramban (§1.40).
>
> Hadiah baru cair setelah teman **mendaftar dan menyelesaikan bab pertamanya**.

#### `vouchers` · `voucher_stories` · `voucher_chapters`

| `vouchers` | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `code` | `citext` | | **UNIQUE** |
| `owner_id` | `uuid` | ✓ | `NULL` = voucher publik, belum diklaim |
| `title` | `text` | | |
| `scope` | `voucher_scope` | | |
| `value` | `voucher_value` | | |
| `percent_off` | `smallint` | ✓ | Wajib saat `value='pct'`, 1–100 |
| `first_n` | `integer` | ✓ | Wajib saat `scope='firstN'` |
| `unlock_cond` | `text` | ✓ | Syarat sebelum bisa dipakai |
| `max_uses` | `integer` | | D `1` |
| `used_count` | `integer` | | D `0`, `CHECK (used_count <= max_uses)` |
| `expires_at` | `timestamptz` | | |

```sql
CHECK (value <> 'pct'    OR percent_off IS NOT NULL),
CHECK (scope <> 'firstN' OR first_n     IS NOT NULL)
```

`voucher_stories (voucher_id, story_id)` dan
`voucher_chapters (voucher_id, chapter_id)` — PK bersama masing-masing.

> `Voucher.locked` **diturunkan server**, bukan kolom: yang tahu apakah
> `unlock_cond` terpenuhi cuma server. Klien yang menghitungnya sendiri akan
> menghidupkan tombol yang servernya tolak.

---

### 3.9 Kepatuhan & operasional 🆕

Ketiganya punya kontrak atau kebutuhan, **tidak punya tabel** di server-mock.

#### `data_exports`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `id` | `uuid` | | PK |
| `user_id` | `uuid` | | |
| `categories` | `export_category[]` | | Empat kategori; array, karena tidak pernah dicari |
| `status` | `export_status` | | |
| `file_url` | `text` | ✓ | Ditandatangani, berumur pendek |
| `requested_at` | `timestamptz` | | D `now()` |
| `expires_at` | `timestamptz` | ✓ | |

#### `account_deletions`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK |
| `requested_at` | `timestamptz` | | |
| `purge_at` | `timestamptz` | | Tenggang — `DeletionCheck.graceDays` |
| `cancelled_at` | `timestamptz` | ✓ | Masuk kembali membatalkannya |

> **Penghapusan ditahan** bila masih ada pencairan diproses atau pesanan cetak
> berjalan, dan **alasannya dikirim** — bukan sekadar bendera.

#### `analytics_consent`

| Kolom | Tipe | N | Catatan |
|---|---|---|---|
| `user_id` | `uuid` | | PK |
| `analytics` | `boolean` | | D `false` |
| `error_tracking` | `boolean` | | D `false` |
| `decided_at` | `timestamptz` | | |

> Belum ada di mana pun (`todo-incoming-features.md` A4). **Tanpa persetujuan,
> tidak satu pun peristiwa dikirim** — bukan dikirim lalu dibuang.

---

### 3.10 Satu tabel yang **tidak** perlu dibuat

`reviewQueue` **ada di Dexie tetapi tidak pernah ditulis maupun dibaca satu
handler pun** — diperiksa, nol rujukan. Ia peninggalan sebelum §1.11 memutuskan
antrean tinjauan **diturunkan** dari sumbernya. **Jangan dibuat di Postgres**;
membuatnya berarti dua tempat menyimpan keadaan tinjauan yang sama, dan cepat
atau lambat keduanya berselisih.

---

## 4. Ringkasan tabel

| Domain | Tabel |
|---|---|
| Identitas | `users` · `credentials`🆕 · `refresh_tokens`🆕 · `device_sessions` · `login_attempts` · `author_profiles` · `payout_accounts` · `privacy_settings` · `locale_settings` · `reader_prefs` · `reader_genre_prefs` · `age_verifications` · `follows` · `blocks` |
| Kebijakan | `content_policy` |
| Katalog | `stories` · `story_genres` · `story_tags` · `story_content_labels` · `chapters` · `chapter_contents` |
| Pembaca | `ownerships` · `library_entries` · `reading_progress` · `reading_progress_chapters` · `reader_story_state` · `offline_chapters` |
| Uang | `wallets` · `transactions` · `topup_orders` · `pay_methods` · `coin_packages`🆕 · `ad_quotas` · `idempotency_keys` |
| Sosial | `ratings` · `reviews` · `review_tags` · `review_replies` · `comments` · `reactions` · `reports` |
| Notifikasi | `notifications` · `notification_prefs` · `notification_pref_channels` · `push_subscriptions`🆕 |
| Studio | `schedule_entries` · `print_orders` · `withdrawals` |
| Hadiah | `rewards` · `mission_catalog` · `mission_claims` · `referral_invites` · `vouchers` · `voucher_stories` · `voucher_chapters` |
| Kepatuhan | `data_exports`🆕 · `account_deletions`🆕 · `analytics_consent`🆕 |

---

## 5. Yang **tidak** punya tabel

Bagian ini sama pentingnya dengan skemanya. Semua di bawah **dihitung saat
diminta**. Menyimpannya berarti angka yang berselisih dengan sumbernya begitu
satu baris berubah — dan yang salah selalu yang dilihat pengguna.

### 5.1 Status cerita (tujuh) dan status bab (enam)

Diturunkan dari **`review × status × visibility × jadwal`**, bukan kolom
tersendiri (`architecture.md` §1.9). Kolom status yang berdiri sendiri akan
berselisih dengan `review` pada transisi berikutnya.

### 5.2 Antrean tinjauan

Diturunkan dari empat sumber: `stories.review='in_review'`, `chapters.review`,
`reports.status='open'`, `print_orders.status`. **Memperbaiki ceritanya menghapus
barisnya sendiri** — tanpa ada yang perlu menghapusnya (§1.11).

### 5.3 Statistik cerita (`StoryStats`)

| Field | Dihitung dari |
|---|---|
| `reads` | Pembukaan bab |
| `readers` | Pembaca unik — **berbeda dari `reads`** |
| `saves` | `library_entries` yang `removed = false` |
| `rating` · `ratingCount` | `AVG`/`COUNT` atas `ratings` |
| `chapterCount` | `chapters` yang **terbit** |
| `weeklyReads` | Pembaca baru tujuh hari terakhir |
| `commentCount` | `comments` di seluruh bab |
| `unlockCount` | `ownerships` bersumber koin — dasar section "Paling Banyak Dibuka" |
| `coinsEarned` | **Dari buku besar**, bukan `unlockCount × authorSharePct` |

> ⚠️ `coinsEarned` **tidak boleh** dihitung dari konstanta bagi hasil.
> `lib/coin.ts` melarangnya tegas (FR-EARN-12): bagiannya bisa berubah tanpa
> rilis, dan penghasilan yang dihitung dengan bagi hasil hari ini atas transaksi
> tahun lalu adalah angka yang salah.
>
> Kesembilannya mahal bila dihitung tiap permintaan. Materialisasikan
> (`MATERIALIZED VIEW` atau kolom penghitung), tetapi **jangan** jadikan ia
> kebenaran — segarkan dari sumbernya, dan pastikan segarnya terukur.

### 5.4 `StoryDetail` — empat angka yang wajib dari server

`readMinutesTotal`, `freeChapterCount`, `paidPriceFrom`, `continueChapterId`.

Keempatnya **tidak boleh** dihitung klien: daftar bab datang 20 per halaman, jadi
menghitungnya di layar menjawab "berapa yang gratis" dari 20 bab pertama saja —
dan jawabannya berubah tiap pembaca menekan "muat lagi".

### 5.5 `LibraryItem`

`state`, `finishedCount`, `totalChapters`, `pct`, `continueChapterId`,
`hasNewChapter`, `chapterUpdatedAt` — semuanya join `stories` × `chapters` ×
`reading_progress_chapters`. Menghitungnya di klien berarti mengirim 120 bab per
kartu hanya untuk satu batang progres.

> `progress` di section beranda `lanjut-baca` **wajib memakai fungsi yang sama**
> dengan `/pustaka`. Dua perhitungan yang "seharusnya konsisten" akan menyimpang;
> satu-satunya yang tidak bisa lapuk adalah satu fungsi di dua tempat (§1.14).

### 5.6 Hadiah

`checkIn` (kalender tujuh hari), `claimedToday`, streak yang berlaku, progres
tiap misi, `coinsThisPeriod`, `voucherCount`, `expiringSoon`, `Voucher.locked`,
dan seluruh `RewardHistoryEntry`.

> `coinsThisPeriod` adalah **jumlah `transactions.kind='reward'` bulan berjalan**,
> bukan saldo kedua. Angka kedua yang mengaku saldo adalah cara tercepat membuat
> pengguna berhenti mempercayai keduanya.

### 5.7 Skor keamanan

`score` dijumlahkan dari lima faktor berbobot — **bobotnya satu tabel, dan
`SECURITY_MAX` dijumlahkan dari daftar itu, bukan ditulis sebagai angka** (§1.42).
`tips` lahir dari faktor yang belum terpenuhi, bukan daftar tetap.

### 5.8 Sisanya

`PublicProfile.tabs` (dari `privacy_settings` — **tab hilang, bukan kosong**) ·
`WeeklyRecap` · `ReaderStats` · `ActivityEntry` (dari `reviews`) ·
`ScheduleEntry.kind` (`ok`/`gap`/`clash`) · `ChapterBoard` · seluruh
`StoryAnalytics` dan `AuthorAnalytics` · `UnlockOption` · `BundleOffer` ·
`DeletionCheck` · `PayoutRate.example`.

---

## 6. Kontrak API — 130 endpoint

Semua `POST /rpc/<nama>`. Kolom **Request** adalah badan JSON; kolom **Response**
adalah badan jawaban `200`.

### 6.1 Sesi & akun — 7

| Metode | Request | Response |
|---|---|---|
| `login` | `LoginInput` | `Session` |
| `register` | `RegisterInput` | `Session` |
| `requestReset` | `{ identity }` | `ResetRequest` |
| `refresh` | `{}` (cookie) | `Session` |
| `logout` | `{}` | `null` |
| `listDeviceSessions` | `{}` | `DeviceSession[]` |
| `revokeDeviceSession` | `{ arg: string \| "all-others" }` | `null` |

### 6.2 Onboarding & beranda — 6

| Metode | Request | Response |
|---|---|---|
| `getReaderPrefs` | `{}` | `ReaderPrefs` |
| `finishOnboarding` | `{ arg: string[] }` | `ReaderPrefs` |
| `getStarterPicks` | `{ arg: string[] }` | `Story[]` |
| `getHomeFeed` | `{ tab? }` | `HomeFeed` |
| `getSection` | `{ id, params: SectionParams }` | `Paged<Story>` |
| `getTrendingQueries` | `{}` | `string[]` |

### 6.3 Pencarian — 2

| Metode | Request | Response |
|---|---|---|
| `search` | `{ q, params: SearchParams }` | `SearchResult` |
| `getSuggestions` | `{ arg: string }` | `Suggestion[]` |

### 6.4 Cerita & bab — 8

| Metode | Request | Response |
|---|---|---|
| `getStory` | `{ storyId }` | `StoryDetail` |
| `getChapters` | `{ storyId, params: ListParams }` | `Paged<ChapterSummary>` |
| `getChapter` | `{ storyId, chapterId }` | `Chapter` |
| `getUnlockOptions` | `{ chapterId }` | `UnlockOption[]` |
| `unlockChapter` | `UnlockInput` 🔑 | `UnlockResult` |
| `getBundleOffer` | `{ storyId, chapterId }` | `BundleOffer \| null` |
| `dismissBundleOffer` | `{ storyId }` | `null` |
| `setAutoUnlock` | `{ storyId, on }` | `null` |

🔑 = wajib `idempotencyKey`.

> **`getChapter` hanya mengirim isi bila babnya dimiliki.** Bab terkunci menerima
> `preview` saja. Menyaring di klien berarti naskah berbayar sudah sampai di
> perangkat sebelum dibayar — itu bukan cacat yang bisa ditambal di layar.

### 6.5 Progres & perpustakaan — 13

| Metode | Request | Response |
|---|---|---|
| `saveProgress` | `ProgressInput` | `null` |
| `getProgress` | `{ storyId }` | `ReadingProgress \| null` |
| `listProgress` | `{}` | `ReadingProgress[]` |
| `getReaderStats` | `{}` | `ReaderStats` |
| `listLibrary` | `{ params: ListParams }` | `Paged<Story>` |
| `getLibrary` | `{ params: LibraryParams }` | `Paged<LibraryItem>` |
| `getLibrarySummary` | `{}` | `LibrarySummary` |
| `toggleLibrary` | `{ storyId }` | `LibraryEntry` |
| `toggleFollow` | `{ storyId }` | `LibraryEntry` |
| `toggleNotify` | `{ storyId }` | `LibraryEntry` |
| `removeFromLibrary` | `{ storyId }` | `null` |
| `undoRemove` | `{ storyId }` | `LibraryEntry` |
| `hideStory` | `{ storyId }` | `null` |

> `saveProgress` dikirim maksimal **sekali per 10 detik**. Server harus tahan
> terhadap kiriman yang lebih rapat — ia idempoten secara alami (tulis nilai
> terbaru), jadi tidak butuh kunci.

### 6.6 Dompet — 9

| Metode | Request | Response |
|---|---|---|
| `getWallet` | `{}` | `Wallet` |
| `listPayMethods` | `{}` | `PayMethod[]` |
| `createTopupOrder` | `TopupInput` 🔑 | `TopupOrder` |
| `getTopupOrder` | `{ orderId }` | `TopupOrder` |
| `confirmTopupOrder` | `{ orderId }` | `TopupOrder` |
| `cancelTopupOrder` | `{ orderId }` | `TopupOrder` |
| `listTransactions` | `{ params: TxListParams }` | `Paged<Transaction>` |
| `getTransaction` | `{ txId }` | `TransactionDetail` |
| `getAdQuota` | `{}` | `AdQuota` |

> `confirmTopupOrder` **ada karena pembayarannya disimulasikan.** Dengan penyedia
> nyata, yang memindahkan status adalah **webhook**, dan endpoint ini berubah jadi
> "tanya status sekarang" — bukan "nyatakan lunas". Klien boleh tetap
> memanggilnya; servernya yang berhenti mempercayainya.

### 6.7 Voucher di jalur baca — 2

| Metode | Request | Response |
|---|---|---|
| `redeemVoucher` | `{ arg: string }` | `Voucher` |
| `applyVoucher` | `{ voucherId, storyId }` | `RedeemResult` |

### 6.8 Sosial — 15

| Metode | Request | Response |
|---|---|---|
| `rateStory` | `{ storyId, stars }` | `Rating` |
| `getMyRating` | `{ storyId }` | `Rating \| null` |
| `deleteRating` | `{ storyId }` | `null` |
| `submitReview` | `ReviewInput` | `Review` |
| `deleteReview` | `{ storyId }` | `null` |
| `listReviews` | `{ storyId, params: ReviewParams }` | `ReviewPage` |
| `replyToReview` | `{ reviewId, text }` | `Review` |
| `listComments` | `{ chapterId, params: CommentParams }` | `Paged<Comment>` |
| `postComment` | `CommentInput` | `Comment` |
| `react` | `{ target: ReactTarget, on }` | `null` |
| `report` | `ReportInput` | `null` |
| `hasReported` | `{ targetType, targetId }` | `boolean` |
| `blockUser` | `{ userId, on }` | `null` |
| `listBlocks` | `{}` | `string[]` |
| `listActivity` | `{ userId, respectPrivacy }` | `ActivityEntry[]` |

### 6.9 Notifikasi — 5

| Metode | Request | Response |
|---|---|---|
| `listNotifications` | `{ params: NotifParams }` | `Paged<Notification>` |
| `getUnreadCount` | `{}` | `number` |
| `markRead` | `{ arg: string[] \| "all" }` | `null` |
| `getNotificationPrefs` | `{}` | `NotificationPrefs` |
| `setNotificationPrefs` | `{ prefs: NotificationPrefs }` | `null` |

> `markRead: "all"` hanya menyentuh yang **masih terlihat** (≤ 90 hari).
> Menandai yang tidak pernah dilihat pengguna adalah mengubah data atas nama
> tindakan yang tidak ia lakukan.

### 6.10 Studio — 21

| Metode | Request | Response |
|---|---|---|
| `getAuthorProfile` | `{}` | `AuthorProfile` |
| `registerAuthor` | `AuthorSignupInput` | `AuthorProfile` |
| `getMyStories` | `{ params: StudioParams }` | `Paged<StudioStory>` |
| `getStudioSummary` | `{}` | `StudioSummary` |
| `createStory` | `{ form: StoryForm }` | `Story` |
| `updateStory` | `{ storyId, form: StoryForm }` | `Story` |
| `deleteStory` | `{ storyId }` | `null` |
| `scheduleStory` | `ScheduleStoryInput` | `StudioStory` |
| `getChaptersForAuthor` | `{ storyId, params }` | `Paged<AuthorChapter>` |
| `getChapterBoard` | `{ storyId }` | `ChapterBoard` |
| `publishChapter` | `{ chapterId }` | `AuthorChapter` |
| `scheduleChapter` | `ScheduleChapterInput` | `AuthorChapter` |
| `unscheduleChapter` | `{ chapterId }` | `AuthorChapter` |
| `deleteChapter` | `{ chapterId }` | `null` |
| `getChapterDraft` | `{ chapterId }` | `ChapterDraft` |
| `saveChapterDraft` | `ChapterDraftInput` | `ChapterDraft` |
| `getChapterAccess` | `{ chapterId }` | `ChapterAccessInfo` |
| `setChapterAccess` | `ChapterAccessInput` | `ChapterAccessInfo` |
| `getStoryAnalytics` | `{ storyId, params: AnalyticsParams }` | `StoryAnalytics` |
| `listSchedule` | `{}` | `ScheduleEntry[]` |
| `cancelScheduleEntry` | `{ entryId }` | `null` |

### 6.11 Tinjauan & cetak — 8

| Metode | Request | Response |
|---|---|---|
| `listReviewQueue` | `{}` | `ReviewQueueItem[]` |
| `submitForReview` | `{ target: ReviewTarget }` | `ReviewQueueItem` |
| `withdrawFromReview` | `{ target: ReviewTarget }` | `null` |
| `createPrintOrder` | `PrintOrderInput` | `PrintOrder` |
| `listPrintOrders` | `{ params: PrintOrderParams }` | `Paged<PrintOrder>` |
| `cancelPrintOrder` | `{ orderId }` | `PrintOrder` |
| `approvePrintCost` | `{ orderId }` | `PrintOrder` |
| `regeneratePrintFile` | `{ orderId, parts }` | `PrintOrder[]` |

### 6.12 Penghasilan — 6

| Metode | Request | Response |
|---|---|---|
| `getAuthorAnalytics` | `{ params: AuthorAnalyticsParams }` | `AuthorAnalytics` |
| `getPayoutBalance` | `{}` | `{ available, pending }` |
| `getPayoutRate` | `{}` | `PayoutRate` |
| `getPayoutAccount` | `{}` | `PayoutAccount` |
| `requestWithdrawal` | `WithdrawInput` 🔑 | `Withdrawal` |
| `listWithdrawals` | `{ params: ListParams }` | `Paged<Withdrawal>` |

### 6.13 Hadiah — 7

| Metode | Request | Response |
|---|---|---|
| `getRewards` | `{}` | `Reward` |
| `claimCheckIn` | `{}` 🔑 | `Reward` |
| `claimMission` | `{ missionId }` 🔑 | `Reward` |
| `getReferral` | `{}` | `Referral` |
| `listVouchers` | `{}` | `Voucher[]` |
| `listVoucherTargets` | `{ voucherId }` | `VoucherTarget[]` |
| `listRewardHistory` | `{}` | `RewardHistoryEntry[]` |

> `claimCheckIn` dan `claimMission` **menambah koin**, jadi keduanya menyentuh
> uang — meski kontraknya belum menuntut kunci idempotency. Backend wajib
> menolak klaim kedua pada tanggal lokal yang sama.

### 6.14 Profil & pengaturan — 14

| Metode | Request | Response |
|---|---|---|
| `listConnections` | `{ kind, params: ListParams }` | `Paged<UserRowData>` |
| `toggleFollowUser` | `{ userId }` | `{ following }` |
| `updateProfile` | `ProfileUpdateInput` | `UserRowData` |
| `getPublicProfile` | `{ userId }` | `PublicProfile` |
| `getWeeklyRecap` | `{}` | `WeeklyRecap` |
| `getPrivacySettings` | `{}` | `PrivacySettings` |
| `setPrivacySettings` | `{ settings }` | `PrivacySettings` |
| `getLocaleSettings` | `{}` | `LocaleSettings` |
| `setLocaleSettings` | `{ settings }` | `LocaleSettings` |
| `getSecurityOverview` | `{}` | `SecurityOverview` |
| `clearReadingHistory` | `{}` | `null` |
| `getDeletionCheck` | `{}` | `DeletionCheck` |
| `requestDataExport` | `{ arg: ExportCategory[] }` | `DataExport` |
| `requestAccountDeletion` | `{}` | `{ purgeAt }` |

> `clearReadingHistory` menghapus **`reading_progress` dan
> `reading_progress_chapters` saja** — `library_entries` tidak disentuh. Rak
> adalah pilihan pembaca; riwayat adalah jejaknya (§1.43).

### 6.15 Verifikasi usia · A1 — 3

| Metode | Request | Response |
|---|---|---|
| `getAgeVerification` | `{}` | `AgeVerification` (dengan `isAdult` turunan) |
| `submitAgeVerification` | `AgeVerificationInput` + berkas (multipart) | `AgeVerification` |
| `setShowAdultContent` | `{ arg: boolean }` | `ReaderPrefs` |

> `submitAgeVerification` adalah **satu-satunya endpoint berkas** di seam. Di
> klien v1 berkasnya tidak dikirim (belum ada penyimpanan); backend menerima
> `multipart/form-data` dengan kolom `birthDate` + `document`. Ditolak `409`
> bila sudah `pending` atau `verified`. Keputusan peninjau **bukan** metode seam
> — ia milik panel admin (§17 no. 7).

### 6.16 Baca offline — 4

| Metode | Request | Response |
|---|---|---|
| `listOfflineChapters` | `{}` | `OfflineChapter[]` |
| `saveChapterOffline` | `{ chapterId }` | `OfflineChapter[]` |
| `removeChapterOffline` | `{ chapterId }` | `OfflineChapter[]` |
| `touchOfflineChapter` | `{ chapterId }` | `null` |

> `saveChapterOffline` **menolak bab yang belum dimiliki**. LRU dijalankan
> **sesudah** menyimpan — yang baru saja diminta pengguna tidak boleh jadi korban
> batas yang dilanggarnya sendiri.

---

## 7. Kode error

### Ditampilkan ke pengguna

| Kode | HTTP | Arti |
|---|---|---|
| `PAY-402` | 402 | Bank menolak. **Tidak ada dana terpotong** |
| `PAY-504` | 200† | Penyedia tidak menjawab 90 detik → `pending_reconciliation` |
| `PAY-410` | 409 | Kode bayar / VA lewat batas waktu |
| `AUTH-401` | 401 | Sesi berakhir |
| `AUTH-429` | 429 | 5 percobaan gagal → tahan 15 menit |
| `APP-426` | 426 | Versi aplikasi di bawah minimum |
| `DRAFT-409` | 409 | Autosave gagal berulang. **Editor tidak dibekukan** |
| `CONTENT-410` | 410 | Bab ditarik penulis. **Refund otomatis** |
| `PRINT-504` | 504 | Pembuatan PDF lewat batas waktu |
| `PRINT-410` | 410 | Berkas PDF lewat masa simpan 30 hari |
| `PRINT-409` | 409 | Pesanan sudah produksi — tidak bisa dibatalkan |
| `PRINT-402` | 409 | Biaya berubah; produksi berhenti sampai disetujui |
| `SCHED-409` | 409 | Dua bab di slot yang sama |
| `SCHED-422` | 422 | Waktu terbit sudah lewat |
| `SCHED-200` | 200 | Zona berubah — **peringatan, bukan kegagalan** |

† `PAY-504` dijawab `200` dengan pesanan berstatus `pending_reconciliation`:
transaksinya **belum gagal**, dan menjawabnya sebagai error membuat klien
menampilkan "gagal" untuk uang yang mungkin sudah berpindah.

### Internal

`NETWORK` · `TIMEOUT` · `OFFLINE` · `NOT_FOUND` · `VALIDATION` · `CONTRACT` ·
`FORBIDDEN` · `CONFLICT` · `INSUFFICIENT_COINS` · `QUOTA_EXCEEDED` ·
`NOT_IMPLEMENTED` · `UNKNOWN`

**Boleh dicoba ulang otomatis:** `NETWORK`, `TIMEOUT`, `OFFLINE`, `UNKNOWN`,
`PAY-402`, `DRAFT-409`, `PRINT-504`. Sisanya **tidak** — mencoba ulang
`INSUFFICIENT_COINS` hanya menghasilkan penolakan yang sama dengan lebih berisik.

---

## 8. Konstanta kebijakan

Sekarang di `src/api/mock/config.ts`. Di backend ia **tabel konfigurasi**, bukan
konstanta — §1.13 sudah menetapkan angka kebijakan harus bisa berubah tanpa
rilis baru.

| Kunci | Nilai sekarang | Dipakai |
|---|---|---|
| `authorSharePct` | `80` | Bagi hasil penulis/platform |
| `coinRateRupiah` | `130` | Rupiah per koin saat dicairkan |
| `withdrawFeeRupiah` | `5000` | Biaya admin per pengajuan |
| `withdrawMinRupiah` | `100000` | Batas minimum pengajuan |
| `bundleOfferAfter` | `10` | Bab terbuka otomatis sebelum tawaran bundel |

Batas lain yang sudah hidup di kode: notifikasi **90 hari** · penggabungan
notifikasi **24 jam** · bab offline **50** · komentar **500 karakter** · tag
ulasan **3** · tag cerita **10** · judul cerita **100** · sinopsis **1000** ·
harga bab **1–50 koin** · pratinjau bab **0–50%** · bab baru digratiskan ditahan
**7 hari**.

> ⚠️ **Skala harga bab vs paket koin tidak mungkin benar bersamaan** — ini sudah
> diketahui dan sengaja dibiarkan di v1 (`architecture.md` §1.21). Backend
> sungguhan adalah saat yang tepat memutuskannya, bukan menyalinnya.

---

## 9. Aturan yang **wajib** ditegakkan server

Klien juga memeriksa sebagian, tetapi **hanya demi pesan yang lebih baik**.
Melewati klien tidak boleh melewati aturannya.

1. **Bab terkunci tidak pernah mengirim isinya.** Hanya `preview`.
2. **Potongan koin transaksional.** Saldo, `ownerships`, dan `transactions`
   berubah dalam satu transaksi, atau tidak sama sekali.
3. **Idempotency pada tiap mutasi uang.** §2.4.
4. **Hanya penulis `verified`** boleh menetapkan bab berbayar dan mencairkan.
5. **Harga bab dijepit 1–50 koin**; bab pertama tidak bisa diprivatkan; bab yang
   baru digratiskan ditahan 7 hari.
6. **Kedalaman komentar satu tingkat** — server menaikkan `parentId` ke induk
   teratas, bukan menolak.
7. **Bab terkunci menolak membaca *dan* menulis** komentar.
8. **Satu ulasan per (pengguna, cerita)**; satu rating per pasangan; satu laporan
   per pasangan; satu tanggapan penulis per ulasan.
9. **Rating menuntut sudah membaca satu bab.**
10. **`privacy_settings.wallet` dipaksa `false`**, apa pun yang dikirim klien.
11. **Tab profil publik hilang, bukan kosong** — isinya tidak pernah dikirim untuk
    kategori yang dimatikan (§1.41).
12. **Tangga validasi pencairan lima tingkat**, ditegakkan dari **berkas yang
    sama** dengan yang dipakai layar (`lib/payout.ts`) — bukan disalin (§1.15).
13. **Saldo tersedia sudah dikurangi** pengajuan yang masih diproses.
14. **Satu pesanan top-up berjalan per pengguna**; `pending_reconciliation`
    menolak pesanan baru sampai selesai.
15. **Kuota iklan per tanggal lokal pengguna**, bukan per sesi.
16. **Check-in sekali per tanggal lokal.**
17. **Jam tenang menunda push saja**; notifikasi dalam aplikasi tetap tercatat
    saat itu juga.
18. **Kanal notifikasi keamanan tidak bisa dimatikan** (in-app + push).
19. **Batas 50 bab offline**, LRU menurut `last_opened_at`, dan hanya bab yang
    dimiliki.
20. **Penghapusan akun ditahan** bila ada pencairan/cetak berjalan, **dengan
    alasannya**.
21. **Cerita 18+ (A1):** isi bab hanya dikirim ke akun `verified` berusia ≥ 18
    **hari ini**; `unlockChapter` menolaknya sebelum satu koin terpotong;
    deretan (beranda, pencarian, jelajah, pilihan awal) hanya memuatnya bila
    `isAdult AND show_adult_content`; mode `hidden` menjawab `NOT_FOUND` di
    detail dan bab. Satu penyaring, semua daftar — daftar yang lupa adalah cara
    cerita 18+ bocor ke beranda anak.
23. **Laporan bab (A5):** ambang 3 laporan menaruh bab **terbit** ke
    `review = 'in_review'` — keluar dari daftar bab pembaca, masuk antrean
    penulis dengan nomor & judul babnya; `getChapter` mengirimnya **tanpa isi**
    dengan `underReview = true`. Ceritanya tidak disentuh.
22. **Cerita tayang → pengikut penulisnya diberi tahu (A2)** lewat pintu
    notifikasi yang sama (`notif_kind = 'cerita-baru'`, `group_key` per penulis),
    dipicu di satu-satunya tempat cerita jadi `published`: keputusan tinjauan.

---

## 10. Urutan migrasi yang disarankan

Backend dibangun bertahap; klien bisa pindah per domain lewat `VITE_API_MODE`
dan satu sakelar per modul bila perlu.

| Tahap | Isi | Kenapa urutannya begini |
|---|---|---|
| **1** | `users` · `credentials` · `refresh_tokens` · `device_sessions` · `login_attempts` | Semua yang lain butuh pemilik. Tanpa auth nyata, tidak ada yang bisa diuji jujur |
| **2** | `stories` + tabel anaknya · `chapters` · `chapter_contents` | Katalog hanya-baca. Aplikasinya sudah bisa dipakai membaca bab gratis |
| **3** | `wallets` · `transactions` · `ownerships` · `idempotency_keys` · `topup_orders` | **Uang.** Sekaligus tahap paling berisiko — kerjakan saat katalog sudah stabil |
| **4** | `library_entries` · `reading_progress*` · `reader_story_state` | Retensi. Baru bermakna setelah ada akun nyata |
| **5** | `ratings` · `reviews*` · `comments` · `reactions` · `reports` · `blocks` | Sosial |
| **6** | `notifications*` · `push_subscriptions` | Butuh hampir semua pemicu sudah ada |
| **7** | Studio · jadwal · cetak · `withdrawals` · `payout_accounts` | Sisi penulis |
| **8** | Hadiah · voucher · referral | Paling banyak turunannya; paling enak dibangun terakhir |
| **9** | `data_exports` · `account_deletions` · `analytics_consent` | Kepatuhan — **sebelum rilis publik**, bukan sesudah |

**Cara memindahkan satu domain:** tulis handler-nya di `src/api/http/`, ganti
`VITE_API_MODE=http`, jalankan `npm test` dan `npx playwright test`. Test-nya
tidak tahu implementasi mana yang dipakai — itulah gunanya seam.

---

## 11. Yang dokumen ini **tidak** jawab

Ditulis terang supaya tidak dikira sudah diputuskan:

- **Penyimpanan berkas** (sampul, avatar, PDF cetak, bukti transfer). Semua kolom
  `*_url` di sini mengasumsikan ada object storage; yang mana, belum diputuskan.
- **Pencarian.** `search` sekarang pencocokan substring berbobot tetap.
  Peringkat relevansi sungguhnya pekerjaan backend — `tsvector` Postgres cukup
  untuk lama, tetapi itu keputusan tersendiri.
- **Penyedia pembayaran.** Antarmuka `PaymentProvider` sudah ada dan tidak
  mengenal koin sama sekali; yang belum ada webhook-nya.
- **Pratinjau tautan (A3).** v1 menulis `dist/cerita/<id>/index.html` saat
  build dari katalog contoh (`scripts/prerender.mjs`). Dengan backend, halaman
  itu harus **dinamis** — SSR ringan atau fungsi edge yang menyuntik `og:*` dari
  `stories` — dan skrip build itu dihapus. Datanya sudah ada di tabel; yang
  belum diputuskan tempat merendernya.
- **Tinjauan KTP (A1).** Endpoint keputusannya (`approve`/`reject` + alasan)
  milik panel admin yang belum ada (§17 no. 7). Sampai panel itu ada, tidak
  satu pun akun bisa jadi `verified` di produksi — dan itu berarti **cerita 18+
  tidak terbaca siapa pun**. Panel admin naik prioritas karenanya.
