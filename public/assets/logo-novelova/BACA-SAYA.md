# Novelova — logo 17a "Kipas" · palet putaran 7

Buku terbuka berpunggung tinta; sembilan halaman mengembang seperti kipas,
berselang foil emas dan tint emas muda; dua kilau di ujung.

> **Revisi 17 September 2026 (Fase 14b-a).** Versi pertama folder ini berpalet
> **rose gold** — bahasa visual v1 (`novelova/`). Aplikasi yang memakainya,
> `novelova-v2/`, sudah berpindah ke **dua emas** sejak redesign putaran 7
> (`architecture.md` §1.20), dan pengguna meminta logonya "disesuaikan dengan
> theme aplikasi". Bentuknya tidak diubah sedikit pun — sudut kipas, jumlah
> halaman, dan kilaunya persis; yang berganti hanya warnanya. Aturan lama *"jangan
> tambah warna di luar rose gold + kelabu"* dengan sendirinya gugur, dan diganti
> aturan di bawah.

## Folder ini adalah **sumber**; `public/icons/` adalah **turunan**

`public/icons/` (favicon, ikon PWA, splash iOS) **dibangkitkan** dari tanda di
sini oleh `scripts/buat-ikon.mjs`. Jangan menyunting `public/icons/` dengan
tangan — ubah di sini, lalu jalankan skripnya.

## Berkas

| Berkas | Untuk |
|---|---|
| `mark-terang.svg` | tanda utama, latar terang (punggung tinta `#1c1a18`) |
| `mark-gelap.svg` | latar gelap (punggung `#c4beb7`, emas gelap naik jadi `#b68235` — persis seperti `--nv-gold` di tema malam) |
| `mark-mono-emas.svg` · `mark-mono-tinta.svg` | satu warna, 7 halaman, tanpa kilau — cetak, stempel, dan **di bawah 24 px** |
| `ikon-aplikasi-emas.svg` · `ikon-aplikasi-malam.svg` | ikon aplikasi 1024, radius 14/64 — latar foil emas dengan halaman kertas · latar malam |
| `favicon.svg` | versi 7 halaman tanpa kilau, aman di 16–32 px |
| `lockup-terang.svg` · `lockup-gelap.svg` | tanda + NOVELOVA (Literata 500, spasi lebar) + tagline |

Nama `*-rose` dan `*-arang` lama tidak ada lagi: nama yang menyebut warna yang
sudah tidak dipakainya adalah nama yang berbohong.

## Warna — semuanya dari `src/styles/tokens.css`

| Peran | Hex | Token |
|---|---|---|
| Foil, warna utama kipas & kilau | `#b68235` | `--nv-gold-line` — emas **bukan-teks**; tanda logo bukan teks |
| Foil, sisi gelap | `#7d5411` | `--nv-gold` |
| Foil, sorot terang | `#fff3e4` | `--nv-gold-soft` |
| Halaman selang-seling & terang foil | `#daba8c` | **turunan**: titik tengah `#fff3e4` ↔ `#b68235`. Satu-satunya warna di luar token, karena foil butuh satu tint di antara sorot dan emasnya |
| Punggung buku, terang | `#1c1a18` | `--nv-accent` / tinta |
| Punggung buku, gelap | `#c4beb7` | `--nv-text-2` malam |
| Halaman ikon emas · latar ikon malam | `#f4f2ef` · `#171513` | `--nv-bg` terang · malam |
| Lockup gelap: wordmark · tagline | `#f0ece7` · `#8b857d` | `--nv-text` · `--nv-muted` malam |

Gradasi foil (135°): `#fff3e4 → #b68235 → #daba8c → #7d5411 → #fff3e4`.
Di varian gelap `#7d5411` diganti `#b68235`, sebab emas gelap tidak terbaca di
atas malam — alasan yang sama membuat `--nv-gold` ikut naik di tema gelap.

## Aturan singkat

- Ruang aman minimal ¼ tinggi tanda di sekelilingnya.
- Di bawah 24 px pakai versi mono (7 halaman, tanpa kilau).
- Jangan ubah sudut kipas atau jumlah halaman.
- **Jangan tambah warna di luar tabel di atas.** Butuh warna baru → tambahkan
  tokennya dulu di `tokens.css`, baru pakai di sini.
- Lockup memerlukan huruf Literata dan Plus Jakarta Sans terpasang; untuk
  pengiriman final, ubah teks menjadi outline.
- Jangan menyisipkan SVG ini sebagai markup inline di berkas `.tsx`:
  hex-nya akan melanggar aturan "satu hex hanya di `tokens.css`" dan
  `npm run check` gagal. Pakai `<img src>`; layar pembuka punya siluetnya
  sendiri yang ditulis tangan di `index.html`.

## Yang dibuang

Manifest **C2PA** (`<metadata>` ±7,5 KB per berkas) tidak ikut: ia tanda tangan
atas isi berkas, dan begitu warnanya diubah tanda tangan itu batal. Membiarkan
tanda tangan yang batal lebih menyesatkan daripada tidak ada tanda tangan.
Ukuran tiap berkas turun dari ±9 KB ke 1,1–1,9 KB.
