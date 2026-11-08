# Hasil validasi v3

- TypeScript: `tsc --noEmit` lulus.
- Build frontend, server preview, dan inline HTML Apps Script lulus.
- Uji aturan: ID kosong dikeluarkan, formula hasil kosong tidak dihitung, angka 0/tanda - dihitung sebagai isian, duplikat baris tetap dihitung, ID sama lintas sumber dihitung sekali, jam peserta, bulan/tahun invalid, filter sumber, lintas tahun, dan penolakan cache versi lama/rusak.
- Uji cache dengan simulasi Drive/Spreadsheet: 4.195 record diproses di lima sumber, checkpoint dapat dilanjutkan setelah kegagalan penulisan halaman, tiga kegagalan menghentikan job, snapshot lengkap sebelumnya tetap dibaca, rotasi folder dan pembacaan laporan tanpa scan ulang sumber.
- Uji browser Edge: tiga menu, perubahan filter mengubah KPI, visibilitas grafik, download PDF, panel Meetdir independen, pemulihan rentang invalid, ponsel 390px tanpa luapan horizontal, cold cache tanpa KPI palsu, serta jalur adapter RPC. Tidak ada page error.
- PDF simulasi dibuka ulang dengan parser dan dirender untuk pemeriksaan tampilan.

Belum diuji pada deployment Google nyata atau dibandingkan dengan angka produksi. Pemilihan kolom NIP ganda harus diselesaikan administrator berdasarkan data sumber. Tidak ada perubahan pada lima spreadsheet atau Database Enterprise, tidak ada deploy/push GitHub.

Untuk uji browser opsional: install Playwright (`npm install --no-save playwright`), siapkan Edge/Chromium, lalu jalankan `node tests/browser.cjs`. Sesi pembuatan memakai runtime browser lokal; tes tersebut bukan syarat menjalankan aplikasi.
