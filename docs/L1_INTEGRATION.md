# Integrasi evaluasi L1

Sumber read-only: spreadsheet `10DgCSgbUayP9okBQ2l-3OLe_Nx_o4T4exwYHLWEvvPA`, tab `Form Responses 1`.
Header diverifikasi dari spreadsheet pada 9 November 2026. Sheet ringkasan existing tidak diubah.

## Definisi KPI

- Materi: E:G (tema, manfaat, kelengkapan); penyelenggara: H:K (layout, suasana, alat bantu, pelayanan).
- Trainer: nama M, V, AE; masing-masing enam aspek di N:S, W:AB, AF:AK. Setiap slot bernama merupakan satu penilaian trainer, bukan satu peserta unik.
- Persentase per aspek = jumlah nilai 4 dan 5 / jumlah respons dalam kelompok. Nilai kosong/invalid tetap dalam penyebut, sesuai COUNTIFS pada laporan existing, dan ditampilkan terpisah. Hasil tanpa respons = tidak tersedia, bukan nol.
- KPI kelompok = rata-rata persentase aspek. Lintas sesi, hitungan respons dijumlahkan sebelum menghitung persentase, sehingga tertimbang oleh respons; bukan rata-rata sederhana persentase kelas.
- Baris tanpa timestamp diabaikan; timestamp terisi tetapi materi/tanggal tidak valid dikarantina. Nama trainer kosong menyebabkan slot dikeluarkan, sementara respons materi/penyelenggara tetap dihitung.
- Gabungan materi + tanggal adalah kelompok respons, bukan ID kelas unik. Tidak melakukan deduplikasi peserta karena tidak ada ID responden. Komentar bebas, timestamp responden dan baris mentah tidak dikirim ke browser.
- Filter periode mengikuti tanggal pelaksanaan, bukan timestamp pengisian. Filter L1 independen dari filter sumber/divisi karena belum ada kunci pemetaan. Filter trainer hanya membatasi aspek trainer. Tren materi mengikuti materi dan menampilkan seluruh bulan yang memiliki respons.
- Target bersifat pribadi selama tab terbuka; bukan target organisasi. Cakupan pengisian, ROI, peningkatan kompetensi dan pemetaan departemen belum dihitung dari data ini.

## Pengambilan dan keamanan

Action baru `l1Report` melalui gateway existing, GET saja dan tetap memerlukan cookie sesi dashboard. Apps Script native tetap memakai `executiveAuthorize_`; endpoint token tetap memakai token server existing. Browser tidak dapat mengganti spreadsheet/tab tujuan.
Apps Script membaca maksimal 2.000 baris per permintaan dan mengirim hitungan agregat per materi/tanggal/trainer. UI menggabungkan halaman, memverifikasi jumlah baris, dan hanya menerbitkan hasil setelah semua halaman selesai. Kegagalan memutus proses dan membuang hasil parsial. Tidak ada write, trigger, izin OAuth tambahan, atau cache permanen untuk L1.
Jumlah baris sumber dikunci selama satu pembacaan. Perubahan jumlah baris menggagalkan pembacaan; edit isi sel saat jumlah baris tetap tidak dapat dideteksi. Karena itu waktu selesai pembacaan ditampilkan dan tidak diklaim sebagai snapshot atomik atau snapshot cache training yang sama. Hindari mengedit respons saat mengambil laporan resmi.

## Aktivasi setelah persetujuan rilis

1. Pada project Apps Script Executive existing, tambahkan `L1Evaluation.gs` dan perbarui `Code.gs` dari folder `apps-script`. Kedua file ini juga tersedia sebagai sumber di `src/backend`.
2. Pastikan akun eksekutor Apps Script mempunyai akses baca spreadsheet L1. Gunakan akses existing; jangan membuka spreadsheet ke publik atau mengganti konfigurasi token/akun yang diizinkan.
3. Buat versi baru pada deployment `/exec` existing setelah persetujuan. URL dan token tidak berubah. Untuk hosting native, `npm run build` menghasilkan `apps-script/Index.html` baru yang juga perlu diperbarui.
4. Rilis branch dashboard ke Vercel setelah persetujuan. Login dan klik **Muat data L1**. Backend versi lama menampilkan pesan belum tersedia tanpa mengganggu laporan lainnya.
5. Cocokkan materi/tanggal tertentu dan enam/tujuh aspek terhadap spreadsheet; periksa total respons, kosong/invalid, filter dan tabel rincian. Verifikasi API tanpa login ditolak. Pengujian live penuh baru dapat diselesaikan sesudah backend diperbarui.

## Berkas dan validasi

UI: `src/components/L1EvaluationPanel.tsx`, `AnalysisDashboard.tsx`.
Kontrak/perhitungan: `src/services/l1Evaluation.ts`.
Backend: `src/backend/L1Evaluation.gs`, `Code.gs`, salinan `apps-script`, dan `server/vercelGateway.ts`.
Tes: `tests/l1-evaluation.cjs`, `tests/vercel-gateway.cjs`, serta perintah test di `package.json`.
Build native tetap menghasilkan satu HTML mandiri; build Vercel tetap memakai lazy chunks.
Data demo L1 sengaja terpisah, berlabel simulasi, dan tidak dipakai sebagai fallback operasional.
