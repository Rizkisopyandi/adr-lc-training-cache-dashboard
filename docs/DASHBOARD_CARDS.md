# Dashboard satu halaman: seluruh training, QO, PTO

Ketiga kartu berada dalam Dashboard Analisis, berurutan ke bawah. Evaluasi L1, ringkasan existing, Meetdir, Kalender, dan Database tetap tersedia. Tidak ada halaman/tab baru untuk memisahkan ketiga kartu.

## Data nyata dan cakupan

Dashboard Insights memproses **seluruh halaman cache lima sumber yang sudah dipublikasikan**, bukan 10 baris preview atau data simulasi. Tidak membaca/menulis spreadsheet sumber. Job terpisah, checkpoint per halaman, retry tiga kegagalan halaman, satu checkpoint dan dua slot hasil. Hasil hanya diterbitkan lengkap dan tidak boleh ditempelkan pada snapshot training berbeda. Kegagalan indeks tidak memblokir laporan existing.

- Identitas kelas: sumber + kolom ID kelas + batch jika dipetakan. Default ID_Training untuk PTU/PTO/Otomasi dan No Und untuk Staff/Eksternal. Kelas antar-sumber tidak diasumsikan identik. Definisi ini berbeda dari gabungan ID global ringkasan existing; tidak mengubah rumus existing.
- Rencana: kelas dengan ID, judul dan tanggal rencana valid dalam halaman cache yang tersedia. Ini belum merupakan rekonsiliasi dengan populasi rencana resmi Looker. Baris yang sebelumnya tidak lolos kriteria cache sumber tidak dapat dipulihkan oleh indeks ini.
- Aktual: status eksekusi eksplisit yang dipetakan ke actual. Kehadiran tidak dijadikan bukti kelas terlaksana. Status kosong/tidak dikenal/konflik dipisahkan. Rasio realisasi ditahan jika pemetaan status tidak lengkap atau ada status tidak dikenal.
- Bulan grafik mengikuti **tanggal rencana**. Aktual adalah realisasi dari cohort rencana bulan tersebut, bukan jumlah pelaksanaan menurut tanggal aktual yang berbeda. Semua bulan tahun terpilih tetap terlihat; memilih batang menyaring rincian dan ketiga kartu.
- Rencana mendatang tidak otomatis dianggap batal. Alasan reschedule belum diekspos; tidak diisi dari dugaan.
- Jika satu identitas kelas memiliki tanggal/judul/jenis/kategori berbeda, kelas ditandai konflik metadata dan dikeluarkan dari kartu analisis, dengan jumlah pengecualian terlihat.
- PTO menghitung baris keikutsertaan, bukan karyawan unik; tidak menghapus peserta berulang. Kehadiran pada kartu PTO mencakup seluruh status kelas terpilih, dengan status per kelas ditampilkan saat drill-down. Kehadiran kartu seluruh training hanya kelas berstatus actual.
- Hanya peserta Hadir yang masuk penilaian. Nilai 0 valid; kosong dan nilai nonnumerik/di luar 0–100 dipisahkan. Nilai kosong tidak dianggap gagal.
- Batch, kolom nilai, batas lulus, dan rumus/target QO **belum dipetakan** sesuai keputusan pengguna. Kategori tidak diasumsikan batch. Belum dipetakan tampil sebagai penjelasan/—, bukan angka 0 atau target simulasi.
- Grafik hasil per program memilih rata-rata nilai atau persentase lulus sesuai pemetaan. Rata-rata memakai SUM nilai / jumlah nilai valid; kelulusan memakai lulus / jumlah dinilai. Tidak merata-ratakan persentase antarkelas.
- Tidak menghubungkan L1 ke batch/training sebelum ada kunci yang diverifikasi. Tidak ada nama/NIP peserta atau komentar evaluasi pada agregat baru.

## Aktivasi backend (sebelum rilis frontend operasional)

1. Backup source Executive live. Tambahkan **hanya** `src/backend/DashboardInsights.gs` sebagai file baru. Jangan mengganti seluruh Code.gs, AdminSetup.gs, manifest, atau bridge kehadiran live.
2. Pada action `cacheStatus` existing, tambahkan sebelum return:

   ```js
   state.insightsVersion =
     (PropertiesService.getScriptProperties().getProperty('ADR_INSIGHTS_VERSION') || '') + '|' +
     (PropertiesService.getScriptProperties().getProperty('ADR_INSIGHTS_PROGRESS') || '');
   ```

3. Pada action `cacheReport` existing, di dalam cabang `report.success`, setelah pemasangan calendar:

   ```js
   if (typeof DashboardInsights !== 'undefined')
     report.insights = DashboardInsights.report(report.snapshotId);
   ```

   Pertahankan action L1 dan attendanceManifest/attendancePage serta semua dispatch live lain. Diff Code.gs dalam branch memperlihatkan lokasi perubahan; jangan menyalinnya secara wholesale ke live.

4. Jalankan `installDashboardInsights()` di editor Executive sebagai administrator yang sudah diotorisasi oleh mekanisme admin existing. Installer menggunakan pemeriksaan admin existing; jangan menimpa nilai pemilik atau allowlist dengan placeholder repository. Izin Drive/trigger tetap mengikuti akun tersebut. Installer membuat subfolder Dashboard Insights di root cache Executive dan satu trigger per menit.
5. Konfigurasi awal boleh kosong. Script Property **ADR_DASHBOARD_MAPPING** bersifat opsional; `{}` menghasilkan kehadiran/kelas nyata, tanpa asumsi batch/nilai/target.
6. Setelah header batch dipastikan, misalnya, gunakan pemetaan header **persis**, bukan nomor kolom. Contoh struktur saja:

   ```json
   {"sources":{"pto":{"batch":"HEADER_BATCH_YANG_SUDAH_DIVERIFIKASI"}},"passThreshold":null,"excellentThreshold":null,"objectives":[]}
   ```

   Jangan menempel placeholder sebagai header nyata. Kolom yang salah menghentikan job dan mempertahankan hasil lengkap sebelumnya. Header opsional per sumber: classId, date, program, type, category, status, attendance, batch, score. Semua override memakai nama header exact. Score hanya nilai numerik 0–100; tidak menganggap skala 1–5 sebagai persentase.
7. Sesudah aturan disepakati, `passThreshold` dan `excellentThreshold` dapat diisi angka 0–100 (excellent >= pass). `objectives` merupakan daftar `{label, metric, target, source?, type?, category?}`; metric hanya passRate, attendanceRate, atau realizationRate. target angka 0–100. Jangan memakai contoh 70/85/95 dari tes sebagai kebijakan tanpa persetujuan.
8. `statusMap` opsional mengganti pemetaan default. Kunci status dinormalisasi tanpa spasi/underscore/hyphen; nilai hanya actual/cancelled/rescheduled/planned. Default mengenali Done/Completed/Terlaksana/Selesai, Cancel/Batal, Reschedule, Plan/Terjadwal. Nilai lain tetap unknown. Pastikan istilah sumber cocok sebelum mengunci rasio.
9. Perubahan mapping otomatis memicu build ulang pada tick berikutnya. `rebuildDashboardInsights()` untuk mengulang job gagal sesudah penyebabnya diperbaiki. Snapshot training baru juga memicu indeks baru. Job membaca maksimal delapan halaman cache per tick dengan batas kerja sekitar 20 detik; tidak menjanjikan durasi tetap.
10. Perbarui versi deployment Apps Script existing melalui alur rilis yang disetujui, lalu deploy frontend dari branch teruji. Tidak ada URL/token baru. Frontend lama tetap bekerja bila indeks belum dipasang; frontend baru menunjukkan status belum tersedia bila backend belum diperbarui.

## Verifikasi rilis nyata

- Pastikan snapshotId indeks sama dengan cache lima sumber dan progres complete.
- Cocokkan satu bulan lintas sumber serta satu program/batch PTO terhadap data sumber, termasuk ID, status kosong, rencana mendatang, nilai 0/kosong/invalid.
- Bandingkan definisi kelas dan bulan dengan Looker sebelum menuntut parity total.
- Pastikan perubahan filter PTO tidak mengubah kartu seluruh training/QO; periode dashboard memang berlaku ke ketiganya.
- Pastikan QO tetap belum dipetakan sampai indikator, denominator, target dan cakupan ditetapkan.
- Uji akun pembaca, penolakan anonim, laporan existing, Kalender, Meetdir, L1 dan bridge kehadiran. Tidak ada penggantian data nyata dengan demo.
- Rollback frontend saja boleh; file indeks terpisah dapat tetap ada. Jangan menghapus cache training, L1 atau bridge untuk rollback fitur ini.

## Pengujian implementasi

- Typecheck, build frontend/server/HTML Apps Script dan dashboard-build: lulus pada Node 24.
- training-insights.cjs: checkpoint/retry, retensi hasil, batch, nilai 0/kosong/invalid, konfigurasi eksplisit, konflik metadata, rekonsiliasi dan isolasi snapshot.
- training-insights-browser.cjs: tiga kartu dalam satu halaman, alur respons API ke UI dengan fixture, reset filter bertingkat, isolasi PTO, drill-down, ukuran grafik, 390px, pemetaan kosong dan snapshot mismatch. Browser memakai **data sintetis**, bukan bukti angka production.
- Regresi training-metrics, vercel-gateway, calendar, l1-cache dan cache-engine lulus.
- Suite existing dashboard-analysis, training-two-days dan l1-evaluation memerlukan esbuild bundling; pada sandbox audit ini resolver native gagal membaca direktori induk. Tidak diklaim lulus. Tidak ada perubahan source ketiga suite atau kalkulasi existing tersebut.
- Tidak ada pengujian worker Google/deployment nyata untuk fitur baru ini. Tidak ada perubahan sumber, merge main, atau rilis production oleh implementasi lokal.

Untuk browser: install Playwright di lingkungan pengujian atau set PLAYWRIGHT_MODULE ke instalasi yang tersedia; jalankan sesudah build: `node tests/training-insights-browser.cjs`. Membutuhkan Edge headless. TEST_OUTPUT_DIR dapat menunjuk folder screenshot.
