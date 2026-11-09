# Dashboard Analisis + Ringkasan Existing

Implementasi 9 November 2026. Baseline production: `b1cbbd019e14251d74416fb1f90735f84c39e8ce`.

## Perubahan

- Menu Dashboard menyediakan **Dashboard Analisis** dan **Ringkasan Existing**. Ringkasan lama tetap memakai komponen, rumus, filter, dan ekspor yang sama; state tetap tersedia saat berpindah kedua pilihan.
- Desain Dashboard, chart/donut, filter, section CEO/L1/L2/Supervisor, dan modal diambil dari ZIP AI Studio pengguna. Semua ditempatkan pada `src/analysis-design/` untuk menghindari penggantian App, navigasi, styling global, atau halaman lain.
- Hanya satu penggunaan Dashboard pada App diganti menjadi DashboardShell. Meetdir tetap menggunakan TrainingDashboard dengan prop meetdir existing.
- Mode operasional memakai adapter snapshot yang sudah dimuat CachePanel; tidak menambah request sumber, endpoint, dependency, autentikasi, atau perubahan backend.
- Mode `?demo=1` menyediakan desain lengkap AI Studio dengan data simulasi serta pilihan untuk menguji adapter dengan fixture snapshot existing. Data simulasi tidak dipakai sebagai fallback mode operasional. Dataset/desain demo dimuat melalui chunk terpisah.
- Persentase legenda donut dibulatkan dengan metode largest remainder agar tepat 100%. Angka sumbu biaya diformat agar tidak menampilkan pecahan floating-point panjang. Legenda/segmen drill-down dapat diakses keyboard.

## Data yang tersedia sekarang

Dashboard operasional menampilkan kelas unik laporan, partisipasi, jam peserta, komposisi sumber, tren periode, distribusi kategori, dan rincian pembentuk angka dari kubus executive versi 3. Filter periode/sumber/divisi mengikuti data agregat tersebut.

Kehadiran memakai indeks kalender dari snapshot yang sama, dengan sumber dan bulan tanggal mulai yang sesuai. Jadwal sebelum hari ini saja dihitung; jadwal hari ini, mendatang, dan dibatalkan dikeluarkan. Indeks menyimpan attended/invited, bukan rincian izin/absen/kosong, sehingga kategori pelengkap bernama **Belum tercatat hadir**, bukan Tidak hadir.

Indeks kalender belum memiliki divisi. Jika filter divisi dipilih, kehadiran dan temuan agenda tidak ditampilkan sebagai angka tersaring; penjelasan cakupan ditampilkan. Indeks yang belum siap atau tidak cocok snapshot juga tidak digunakan.

Temuan operasional dibatasi pada trainer/tempat/waktu yang belum tersedia di jadwal hari ini/mendatang dan status kosong pada jadwal lewat. Tidak mengarang temuan posttest kosong atau kehadiran kosong dari angka agregat.

## Data yang belum tersedia melalui kontrak Dashboard

- L1: spreadsheet/instrumen, populasi wajib isi, dan respons belum dihubungkan.
- Biaya/anggaran/manfaat finansial: belum ada dalam snapshot operasional.
- L2: nilai individu pretest/posttest belum diekspos oleh cache report yang tersedia ke frontend.
- Rencana resmi dan mapping status aktual: belum tersedia sebagai populasi plan vs actual terverifikasi.
- Departemen: kubus existing hanya menyediakan Divisi.

Bagian tersebut menampilkan **belum tersedia**, bukan nol atau angka simulasi. Integrasi saat ini tidak mengklaim seluruh KPI AI Studio sudah menggunakan data live. Tahap berikutnya memerlukan kontrak data tambahan yang read-only, pemetaan kolom raw tiap sumber, serta spreadsheet L1/biaya dari pengguna.

Periode laporan mengikuti Filter Bulan + tahun valid existing. Agenda mengikuti bulan tanggal mulai. Kelas unik laporan tidak diberi nama kelas terlaksana. Kelas dapat tidak aditif antarbaris; total menggunakan gabungan ID sesuai rumus existing.

## File utama

- `src/App.tsx`: memasang DashboardShell hanya untuk halaman Dashboard.
- `src/components/DashboardShell.tsx`: pilihan analisis/existing.
- `src/components/AnalysisDashboard.tsx`: mode operasional, bagian sesuai desain, filter/target pribadi, drill-down, dan unavailable states.
- `src/components/analysis-dashboard.css`: styling terbatas pada Dashboard analisis.
- `src/services/dashboardAnalysis.ts`: adapter pure snapshot; parity agregasi existing, validasi sumber, cakupan kalender, dan bukti temuan.
- `src/analysis-design/`: komponen Dashboard/chart/modal, tipe, kalkulasi, dan fixture dari ZIP; tidak menyalin App, halaman Meetdir/Database/Kalender/Training, env, atau CSS global ZIP.
- `tests/dashboard-analysis.cjs`: regresi data/rumus/cakupan dan pembulatan donut.
- `tests/dashboard-browser.cjs`: skenario browser otomatis untuk dijalankan di host yang mendukung browser headless.
- `tests/browser.cjs`, `tests/calendar-browser.cjs`: masuk ke Ringkasan Existing sebelum pemeriksaan regresi dashboard lama.
- `package.json`: menambahkan test adapter ke npm test; dependency tetap sama.

## Validasi

- `npm test`: lulus, termasuk metrik/cache/gateway/kalender existing dan test adapter baru.
- `npm run typecheck`: lulus.
- `npm run build`: lulus frontend, server, dan paket Apps Script.
- `npm run build:vercel`: lulus; tidak melakukan deploy.
- Browser aplikasi pada hasil build lokal: desain AI Studio, target KPI mengubah status, sembunyikan grafik, filter sumber/divisi, drill-down, pilihan existing, Meetdir dan periode independen, unduhan PDF, Kalender/Training/Database, dan akses gate non-demo berhasil diperiksa.
- Desktop dan lebar 390px diperiksa; screenshot simulasi disediakan. Tidak ada error console yang tercatat pada pemeriksaan tersebut.
- Fingerprint 12 file terlindungi diperiksa tetap sama: komponen legacy/Meetdir, kalender, navigasi, controller cache, akses, processor metrik, PDF, CSS global, gateway, dan backend GAS.
- Runner browser headless dari shell tidak dapat meluncurkan Edge pada pembatasan lingkungan Windows ini. Karena itu pemeriksaan browser dilakukan melalui browser aplikasi; script otomatis tidak diklaim lulus penuh.
- Data production belum diverifikasi setelah integrasi. Tidak ada deploy production atau perubahan Google Sheets.

Paket Apps Script yang dihasilkan build adalah output generator frontend, bukan perubahan manual GAS. Integrasi Dashboard ini tidak membutuhkan pembaruan backend untuk metrik yang sudah didukung. Jangan mengganti backend production hanya untuk memasang tampilan ini.
