# Kalender Training

Kalender bulanan berada di atas Ringkasan Eksekutif Training, dengan rincian tanggal terpilih dan hari berikutnya di bawah kalender. Pilih bulan, sumber, jenis, atau tanggal. Hari ini menggunakan zona waktu Asia/Jakarta. Jadwal dibatalkan disembunyikan secara default.

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

npm test; npm run typecheck; npm run build:vercel. tests/calendar-browser.cjs memeriksa UI demo pada localhost:3014 dengan Playwright/Edge. Preview bertanda SIMULASI bukan laporan aktual.
