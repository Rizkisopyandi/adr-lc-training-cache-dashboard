# Menjalankan versi Vercel

Repo terpisah: Rizkisopyandi/adr-lc-training-cache-dashboard.

1. Import repo tersebut ke project Vercel baru. Root Directory kosong (root repo), Framework Vite. `vercel.json` sudah menetapkan build dan output `dist`.
2. Tambahkan tiga Environment Variables untuk Production dan Preview melalui dashboard Vercel:
   - GOOGLE_APPS_SCRIPT_URL: URL /exec Apps Script Executive.
   - ADR_API_TOKEN: nilai ADR_API_TOKEN pada Script Properties Apps Script. Jangan mengganti dengan API_SHARED_SECRET dari project lain; kontraknya berbeda.
   - ADR_DASHBOARD_PASSWORD: kata sandi baru minimal 16 karakter untuk akses dashboard. Jangan kirim secret melalui chat atau commit ke repo. Bagikan melalui saluran internal kepada pembaca yang berhak.
3. Redeploy setelah environment diisi. Masuk dengan kata sandi dashboard. Sesi memakai cookie HttpOnly berlaku 8 jam; semua endpoint data memeriksa sesi. Mengganti password mencabut sesi lama. Password bersama bukan sistem akun/peran individual.
4. Pertahankan Deployment Protection Vercel bila tersedia. Preview tanpa konfigurasi tetap bisa membuka mode simulasi lewat `/?demo=1#/dashboard`. Mode simulasi tidak mengakses data nyata.
5. Backend masih perlu dipasang: salin empat GS dari folder apps-script ke project Executive, jalankan setupExecutiveAccess_ dan installExecutiveCache_, serta atur kolom NIP ganda sesuai MULAI_DI_SINI.md. Deploy ulang endpoint /exec. Untuk server Vercel endpoint JSON harus dapat dijangkau tanpa login Google; verifikasi token tetap wajib. Spreadsheet sumber tidak perlu publik.
6. Tunggu cache lima sumber lengkap. Dashboard baru menghitung dari snapshot v3, bukan sepuluh baris preview. Tidak ada migrasi ke All DataBase atau penulisan ke sumber.

Pada arsitektur ini website berjalan di Vercel; Apps Script tetap menjadi worker cache dan penghubung spreadsheet. Update UI berikutnya cukup push ke GitHub untuk build Vercel. Perubahan kode backend tetap perlu update deployment Apps Script.

Lokal: npm install, salin .env.example menjadi .env dan isi sendiri, npm run dev. Uji: npm test, npm run typecheck, npm run build:vercel. npm run build juga menghasilkan apps-script/Index.html untuk jalur hosting Apps Script lama.

Source dan hasil uji tidak menyertakan nilai environment produksi. Live connection belum dapat dinyatakan berhasil sebelum pemilik memasang backend serta mengisi environment baru.

## Pelanjutan dan pemeriksaan cache awal

AdminSetup.gs pada src/backend menyediakan fungsi publik untuk dropdown editor. Isi ownerEmail sesuai akun pemilik sebelum menjalankannya. configureTrainingNipCache memverifikasi header, menyimpan pilihan NIP PTU=13/PTO=12/Otomasi=12, lalu meminta refresh. Jangan menjalankan fungsi konfigurasi berulang saat job berjalan. continueTrainingCache hanya melanjutkan job aktif, memakai batch manual 2.000 baris dan menunggu worker lain selesai; tidak memulai ulang job yang sudah complete. checkTrainingCache membaca snapshot dan memvalidasi lima sumber, cube v3, ukuran laporan serta metrik rentang tiga bulan dan satu bulan. Tidak ada penulisan ke spreadsheet sumber. Worker trigger reguler tetap memakai batch 500 baris.
