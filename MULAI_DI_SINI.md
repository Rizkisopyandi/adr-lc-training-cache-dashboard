# ADR Learning Center — Executive Training Dashboard v3

Paket ini berisi source untuk Google AI Studio dan hasil build untuk Google Apps Script. Tidak ada database sumber, file Excel personalia, token, atau data karyawan di dalam ZIP. Gambar dan PDF preview memakai data simulasi.

## Isi dan hasil

- `src/`: dashboard, controller Database, perhitungan dan source backend.
- `apps-script/`: **hasil build siap ditempel** — `Index.html`, `Code.gs`, `DatabaseService.gs`, `CacheEngine.gs`, `MeetdirReport.gs`, dan `appsscript.json`.
- `dist/`: hasil build web untuk preview melalui server, bukan dibuka dengan klik file HTML.
- `server.ts`, `server-dist/`: server preview AI Studio. Tidak dipasang di Apps Script.
- `tests/`: pengujian perhitungan dan simulasi penyimpanan Drive; `VALIDASI.md`: hasil dan batas pengujian.

## A. Cara termudah: jalankan langsung di Apps Script

1. Backup deployment Executive yang sekarang. Gunakan **project Apps Script Executive terpisah**, bukan script operasional lima spreadsheet atau Database Enterprise.
2. Dari folder `apps-script`, buat/perbarui empat file `.gs` dengan nama yang sama. Buat file HTML bernama **Index** dan isi dari `Index.html`. Aktifkan tampilan manifest pada Project Settings lalu salin `appsscript.json`.
3. Jalankan **`setupExecutiveAccess_`** di editor. Izinkan permintaan Google. Pemilik otomatis dimasukkan ke `ADR_ALLOWED_EMAILS`; token untuk server dibuat tanpa ditampilkan di log.
4. Buka Project Settings → Script Properties. `ADR_ALLOWED_EMAILS` berisi email yang boleh membaca dashboard, dipisahkan koma. Jangan gunakan alamat kosong atau wildcard.
5. **Verifikasi kolom NIP ganda sebelum membangun cache.** PTU, PTO, dan Otomasi masing-masing mempunyai lebih dari satu header NIP. Pilih kolom yang mewakili NIP peserta dan set nomor kolom (mulai 1):

   | Property | Kandidat yang harus diperiksa pada sumber |
   |---|---|
   | `ADR_NIP_COLUMN_PTU` | A = 1 atau M = 13 |
   | `ADR_NIP_COLUMN_PTO` | A = 1 atau L = 12 |
   | `ADR_NIP_COLUMN_OTOMASI` | A = 1 atau L = 12 |

   Kolom dekat Nama adalah kandidat, belum bukti kesetaraan. Periksa beberapa peserta dan baris kosong terhadap header NIP pertama, kemudian tentukan. Sistem sengaja menolak hitungan jika pilihan belum diisi, bukan diam-diam memakai kolom A. Tidak perlu mengubah spreadsheet.
6. Jalankan **`installExecutiveCache_`** sekali. Fungsi membuat folder **ADR LC Executive - Cache** di My Drive akun yang menjalankannya serta trigger `executiveCacheTick_`. Tidak perlu membuat Drive baru atau menempel folder ID. Folder tidak dibagikan otomatis. Worker membaca sumber, menulis hanya ke folder cache, dan bekerja bertahap.
7. Deploy → Manage deployments → Edit → **New version** → Deploy. URL deployment lama tetap jika deployment yang sama diperbarui. URL `/exec` tanpa parameter membuka dashboard; tidak perlu menempel URL pada dashboard yang dihosting Apps Script.
8. Untuk Workspace internal: gunakan Execute as **Me** dan akses **domain organisasi**, lalu daftar email pada `ADR_ALLOWED_EMAILS`. Identitas aktif harus tersedia; jika Google tidak mengembalikan email, akses ditolak. Jangan mengakali dengan menerima email dari browser.
9. Jika akun di luar domain dan identitas tidak tersedia: gunakan Execute as **User accessing the web app**. Akun tersebut harus diizinkan di allowlist, memberi otorisasi, dan memiliki akses baca ke lima sumber serta folder cache yang diperlukan. Jalankan instalasi/trigger hanya sebagai pemilik. Uji satu akun pembaca sebelum membagikan aplikasi.
10. Buka Database dan tunggu lima sumber selesai. Kembali ke Dashboard dan Laporan Meetdir. Jika gagal, periksa pesan sumber; cache lengkap sebelumnya tidak dihapus. Cache versi lama tidak dipakai untuk angka v3.

## B. Mengembangkan/preview di Google AI Studio

1. Gunakan seluruh source dalam ZIP sebagai versi project baru atau backup dahulu lalu ganti source project dengan isi ZIP. **Jangan hanya mengganti `src`**, karena server dan proses build juga berubah. Jangan memasukkan ZIP workforce sebagai pengganti project training.
2. Install dependency (`npm install`), lalu `npm run dev`. Untuk build: `npm run build`; pemeriksaan: `npm run typecheck` dan `npm test`. Source package menggunakan Node untuk pengembangan saja.
3. Backend Apps Script tetap harus diperbarui mengikuti bagian A. Untuk akses lewat server preview, set Secrets/environment server:
   - `GOOGLE_APPS_SCRIPT_URL`: URL deployment Executive `/exec` yang benar.
   - `ADR_API_TOKEN`: salin nilai property dengan nama sama dari Apps Script. **Bukan** variabel berawalan `VITE_`, bukan kode frontend, dan jangan commit ke GitHub.
4. Jika memakai token server, endpoint JSON Apps Script harus dapat dijangkau server tanpa halaman login Google. Gunakan deployment Executive khusus API dengan akses jaringan yang sesuai dan token kuat. Jangan menjadikan spreadsheet publik. Akses token memberi server kewenangan baca; batasi akses aplikasi AI Studio/server karena token bukan login untuk setiap pengunjung server.
5. URL bawaan source mengikuti deployment yang diberikan sebelumnya. Jika deployment diganti, ubah `src/config/backend.ts` serta environment server. Tidak ada penempelan URL setiap kali aplikasi dibuka.
6. Untuk melihat contoh saja, buka `/?demo=1#/dashboard`. Banner kuning menyatakan SIMULASI. Hapus `?demo=1` untuk data cache nyata. Mode simulasi tidak melakukan sinkronisasi sumber.
7. Setelah mengedit UI: `npm run build` menghasilkan ulang `apps-script/Index.html` dan menyalin source backend. Update hasilnya di Apps Script dan deploy versi baru. **AI Studio tidak otomatis memperbarui project Apps Script.**

## Aturan perhitungan

- Baris sah: ID_Training hasil evaluasi terisi. Staff/Eksternal memakai No Und sebagai alias; bukan NIP atau nomor baris. Formula `=""` kosong, tetapi `0` dan `-` tetap terisi.
- Kehadiran harus Hadir dan Jenis Pelatihan terisi. Tidak ada penghapusan baris duplikat atau peserta dengan NIP berulang.
- Kelas: gabungan ID unik global pada pilihan filter. Subtotal kelas tidak selalu aditif dan tidak boleh dijumlahkan untuk mendapatkan total.
- Partisipasi rentang: NIP hasil evaluasi terisi; laporan bulanan Meetdir: Divisi terisi. Bukan jumlah karyawan unik.
- Jam peserta: SUM Durasi per baris yang memenuhi ketentuan. Durasi invalid tidak dipaksa menjadi angka; dicatat dalam audit.
- Filter Bulan menentukan bulan; tanggal sumber valid menentukan tahun. Bulan/tahun tidak valid dikeluarkan dari angka periode, tidak diberi fallback 2026.
- Rentang default adalah bulan laporan dan dua bulan sebelumnya, termasuk lintas tahun. Panel satu bulan terpisah. Dashboard dapat memilih basis dengan label eksplisit; perbandingan memakai basis serta filter yang sama.
- Internal dengan Hard/Soft Skill terlihat di rincian jenis/kategori. PTO Basic/Multi Skill tetap mengikuti nilai sumber. Tidak menambahkan induk ke anak saat menjumlahkan.

## Cache, error, dan laporan PDF

Worker membaca 500 baris per batch; beberapa batch per tick dengan batas waktu kerja. Seluruh sumber diproses, tanpa batas total 10/880/42.992. Snapshot dipublikasikan setelah lima sumber lengkap. Browser mengambil cube ringkas, bukan membaca ulang spreadsheet. Tidak ada nilai NIP/nama personal di cube, tetapi preview Database tetap menampilkan maksimal sepuluh baris dari cache untuk akun berizin.

Cache awal belum siap → tampil progres, bukan angka nol palsu. Pembaruan gagal → snapshot lengkap sebelumnya dipertahankan. Refresh terjadwal sekitar satu jam setelah publikasi. Polling status setiap 15 detik mengambil laporan hanya ketika snapshot berubah. Tidak ada janji bebas kuota Google atau skala tak terbatas; durasi total sinkronisasi tetap bergantung ukuran sheet, Drive, dan kuota akun. Perubahan isi sel saat scan tanpa perubahan header/jumlah baris belum dapat dideteksi sebagai satu transaksi lintas lima sheet.

PDF diunduh langsung, A4 landscape beberapa halaman. Memuat filter, basis, waktu cache, ID snapshot, metrik serta grafik batang yang dipilih; layout laporan sengaja berbeda dari screenshot halaman. Kontrol tampil/sembunyi Dashboard berlaku pada PDF; Meetdir selalu mengekspor dua panel. PDF memakai font bawaan dan transliterasi karakter di luar ASCII. File contoh PDF adalah simulasi, bukan laporan resmi.

## Sumber yang tetap hanya dibaca

PTU `DataBase`, PTO `DataBase`, Otomasi `DataBase`, Staff **`Database_2026`**, Eksternal `DataBase`. ID spreadsheet dipertahankan pada `DatabaseService.gs`. All DataBase, pivot, System Index, dan Database Enterprise tidak dipakai sebagai sumber runtime dan tidak ditulis oleh paket ini.

## Referensi Google

- HTML Service RPC: https://developers.google.com/apps-script/guides/html/communication
- Identitas pengguna dan keterbatasan email aktif: https://developers.google.com/apps-script/reference/base/session

Pengujian lokal tidak menggantikan uji deployment nyata pada akun Google organisasi. Paket belum diunggah, dideploy, atau didorong ke GitHub oleh sesi ini.
