# Kalender Training

Navigasi dipisahkan menjadi dua halaman:

- **Kalender** (`#/kalender`): kalender bulanan, pemilihan tanggal dan rincian tanggal terpilih.
- **Training Hari Ini & Besok** (`#/training`): Hanya Training Hari Ini dan Training Besok. Jumlah jadwal mengikuti dua tanggal tersebut. Jadwal setelah besok tetap bisa dilihat di Kalender.

Dashboard tetap berisi Ringkasan Eksekutif Training. Laporan Meetdir dan Database tetap tersedia.
Filter sumber, jenis, dan tampilkan dibatalkan dipakai bersama kedua halaman; pilihan bulan/tanggal kalender dipertahankan saat berpindah menu. Hari ini menggunakan Asia/Jakarta. Jadwal dibatalkan disembunyikan secara default.

Istilah berlangsung mengacu pada tanggal mulai hari ini, sesuai data existing. Tidak ada penentuan status realtime atau inferensi training lintas hari karena kontrak kalender existing hanya menyediakan tanggal mulai.

Pemisahan menu ini hanya mengubah frontend. Jika backend kalender existing sudah terpasang dan siap, tidak perlu memasang ulang backend atau membangun ulang cache untuk perubahan navigasi ini. Petunjuk berikut hanya untuk instalasi kalender yang sebelumnya belum tersedia.

Jadwal dibentuk dari halaman snapshot lengkap lima sumber yang sudah tersimpan di Drive. Kalender tidak membaca spreadsheet sumber saat halaman dibuka dan tidak mengubah perhitungan Meetdir. Indeks harus cocok dengan snapshot ringkasan; selama indeks belum selesai, pesan proses tampil dan ringkasan tetap tersedia.

Sesi dikelompokkan berdasarkan tanggal mulai, judul, jenis, trainer, tempat, waktu, dan status pembatalan. Undangan menghitung baris peserta, tanpa menghapus NIP berulang. Hadir mengikuti nilai Kehadiran pada waktu snapshot, bukan absensi realtime. Sesi dengan waktu/trainer/tempat berbeda tetap terpisah.

## Memasang pada backend dashboard yang sudah berjalan

1. Tambahkan src/backend/CalendarCache.gs sebagai CalendarCache.gs pada project Apps Script khusus dashboard. Pertahankan AdminSetup.gs yang sudah diisi akun pemilik.
2. Ganti Code.gs dengan src/backend/Code.gs. File backend lain dan kelima database sumber tidak perlu diubah.
3. Simpan, jalankan installTrainingCalendar satu kali. Fungsi ini membuat indeks terpisah di folder cache serta trigger setiap menit. continueTrainingCalendar dapat dijalankan untuk mempercepat pekerjaan yang masih berjalan.
4. Jalankan checkTrainingCalendar. Tunggu ready:true dan snapshotId yang sama dengan cache dashboard.
5. Deploy > Manage deployments > Edit > New version > Deploy pada deployment yang sama. URL /exec tetap.
6. Deploy source frontend ini ke Vercel pada project yang sama. Environment produksi yang sudah ada tetap digunakan. Jika hosting langsung pada Apps Script, gunakan apps-script/Index.html hasil build juga.

Tidak perlu membangun ulang cache lima sumber hanya untuk penambahan kalender. Ketika snapshot sumber berikutnya terbit, worker kalender membuat indeks yang sesuai secara bertahap. Data kalender mencakup jadwal dari baris dengan ID valid yang masuk snapshot; baris tanpa ID valid tetap mengikuti aturan cache sebelumnya.

## Validasi

npm test; npm run typecheck; npm run build:vercel. tests/calendar-browser.cjs menjalankan server hasil build lokal pada port 3015 dan memeriksa kedua halaman dengan Playwright/Edge. Jalankan setelah npm run build. PLAYWRIGHT_MODULE dapat menunjuk modul Playwright yang tersedia; TEST_BASE_URL opsional untuk server yang sudah berjalan. Pengujian membekukan tanggal pada 9 November 2026 agar fixture tetap deterministik. Preview bertanda SIMULASI bukan laporan aktual.
