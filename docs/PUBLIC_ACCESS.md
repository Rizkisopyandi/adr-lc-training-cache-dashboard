# Akses publik tanpa login

Perubahan ini menghapus login aplikasi Vercel/Express untuk seluruh menu existing sesuai permintaan pengguna. AccessGate langsung merender aplikasi, tanpa pemeriksaan sesi atau tombol Keluar. Gateway menerima permintaan tanpa cookie/password. GET /api/session tetap tersedia sebagai kontrak kompatibilitas dan mengembalikan mode public; POST/DELETE sesi tidak lagi digunakan.

## Cakupan publikasi

Seluruh Dashboard, Ringkasan Existing, Kalender, Training Hari Ini & Besok, Meetdir, Database, Test API, Preview Data dan tombol refresh tetap tersedia. Data yang semula terlihat melalui Preview Data akan dapat dibaca pengunjung anonim, termasuk nama/NIP/kolom peserta jika dikembalikan sumber. Nama trainer dan hasil evaluasi juga tetap terlihat. Pengunjung dapat meminta pembaruan cache melalui POST dari aplikasi. Tidak ada peran/admin terpisah dalam mode ini.

Token ADR_API_TOKEN dan GOOGLE_APPS_SCRIPT_URL tetap hanya dipakai server untuk upstream tetap. Spreadsheet tidak dijadikan publik dan endpoint Apps Script tetap memerlukan token/allowlist existing. Source spreadsheet tetap hanya dibaca. Filter action/source/rentang, no-store, POST-only dan penolakan origin asing untuk refresh dipertahankan. Ini bukan pembatasan pengguna: pengunjung publik tetap dapat mengakses action yang disediakan aplikasi.

## Rilis

Merge dan deployment production memerlukan persetujuan rilis terpisah. Tidak perlu mengubah Apps Script, izin Drive/Sheets, token, atau proteksi preview Vercel. ADR_DASHBOARD_PASSWORD tidak lagi digunakan aplikasi; nilai environment tidak dihapus oleh perubahan ini. Domain production existing menjadi pintu akses publik setelah rilis. URL preview masih dapat meminta autentikasi Vercel sesuai konfigurasi platform existing.

## Validasi

npm run typecheck, npm test dan npm run build:vercel. Tes gateway memakai upstream simulasi dan memverifikasi akses tanpa cookie/password, token tidak dikirim ke client, action/source/rentang invalid ditolak, refresh GET/origin asing ditolak dan konfigurasi upstream kosong menghasilkan 503. Pengujian browser tanpa sesi pada production perlu dilakukan sesudah persetujuan rilis. Angka laporan, desain dashboard dan pemetaan KPI tidak diubah.
