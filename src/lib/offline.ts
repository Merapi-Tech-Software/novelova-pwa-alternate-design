/**
 * Batas bab tersimpan offline · architecture.md §10.3.
 *
 * Di `lib/` karena **dua sisi memakainya**: server-mock menegakkannya saat
 * menyimpan, layar memakainya untuk memberi tahu batasnya sebelum tercapai.
 * Dua angka yang harus sama dan ditulis dua kali akan menyimpang, dan yang
 * menyimpang di sini membuat aplikasi menjanjikan ruang yang tidak ada.
 */
export const OFFLINE_MAX = 50
