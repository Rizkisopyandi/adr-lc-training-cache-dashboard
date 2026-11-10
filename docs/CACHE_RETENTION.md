# Retensi satu snapshot aktif

Setelah opt-in pemilik project, worker mempertahankan snapshot aktif selama refresh. Snapshot lama baru dihapus setelah manifest/report baru dan lokasi seluruh halaman cache tervalidasi. Cache L1 berjalan independen dengan aturan yang sama. Indeks Kalender dan Analisis milik snapshot training usang ikut dibersihkan; indeks tersebut dapat dibangun kembali oleh worker existing. Angka KPI, filter, UI, akses publik dan spreadsheet sumber tidak berubah.

Pembersihan memakai Advanced Drive v3 `Drive.Files.remove`: **penghapusan permanen**, bukan memindahkan ke Trash. Tidak ada rollback ke cache sebelumnya setelah pembersihan berhasil. Data sumber tetap tersedia untuk rebuild. Pertumbuhan data sumber masih dapat memperbesar snapshot aktif; kebijakan ini membatasi jumlah salinan, bukan ukuran tetap.

Hanya folder dengan nama/lokasi cache aplikasi dan nama file hasil generate yang diproses. File/folder asing dilewati. Staging berstatus running/publishing dipertahankan. Staging terminal yang gagal dibersihkan, termasuk ketika belum pernah ada snapshot aktif. Checkpoint job kecil tetap disimpan untuk status/diagnostik; payload agregasi besar dikosongkan setelah terminal. Pembersihan dibatasi 40 penghapusan/10 detik per panggilan dan dilanjutkan pada tick berikutnya. Error cleanup tidak menggagalkan publikasi cache; status disimpan di ADR_CACHE_RETENTION_STATUS.

## Rilis setelah persetujuan production

1. Terapkan CacheRetention.gs serta perubahan kecil worker CacheEngine.gs, L1Cache.gs, CalendarCache.gs dan DashboardInsights.gs ke project Executive existing. Jangan menimpa Code.gs/AdminSetup.gs atau bridge attendance live yang memiliki tambahan khusus production.
2. Tambahkan layanan **Drive API v3**, identifier **Drive**, melalui Services editor Apps Script. Jika memakai standard Cloud project, pastikan Drive API aktif pada project tersebut. Gabungkan dependencies manifest dengan konfigurasi live; jangan menimpa manifest live keseluruhan. Scope Drive existing tetap dipakai.
3. Buat versi/deployment backend sesuai prosedur existing. Backup cache lama terlebih dahulu jika dibutuhkan; backup manual berada di luar kebijakan ini.
4. Jalankan `enableSingleSnapshotRetention()` dari editor dengan akun owner yang sudah dikonfigurasi melalui adminSetupCheck_. Fungsi ini mengaktifkan kebijakan dan langsung menjalankan cleanup pertama. Tidak tersedia action web untuk mengaktifkan penghapusan.
5. Jalankan `checkSingleSnapshotRetention()` dan periksa log. Status complete berarti putaran cleanup selesai, pending akan dilanjutkan, blocked memuat alasan kegagalan. Uji refresh training/L1 live dan rekonsiliasi angka sebelum/sesudah. Pengujian live/penghapusan belum dilakukan oleh PR ini.

Untuk menghentikan cleanup berikutnya, hapus Script Property ADR_CACHE_RETENTION_SINGLE atau ubah menjadi 0. Ini tidak mengembalikan file yang sudah dihapus. Kebijakan default disabled sehingga merge/deploy saja belum menghapus cache.

## Validasi lokal

`npm test`, `npm run typecheck`, `npm run build`. Tes retention memakai Drive simulasi untuk opt-in, batas folder/nama, cache aktif, staging berjalan/gagal, retry error, batas penghapusan, L1 dan indeks Kalender. Tes existing memeriksa resume worker, publikasi lengkap, kegagalan refresh dan laporan. Belum menggantikan uji izin Advanced Drive serta refresh pada Apps Script live setelah persetujuan.
