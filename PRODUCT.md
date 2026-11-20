# SiRekap Unit — Daftar Fitur dan Catatan Awal

Dokumen ini merangkum daftar fitur dari PRD **Aplikasi Pengelolaan Data dan Otomatisasi Laporan Unit Kerja (SiRekap Unit v0.1)** beserta catatan hal yang perlu diperjelas sebelum desain dan pembangunan dimulai.

## Daftar Fitur

| Kode | Nama Fitur | Prioritas | Ketergantungan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **FT-01** | Autentikasi & Manajemen Sesi RBAC | Must | - | Selesai |
| **FT-02** | Manajemen Data Master (Pegawai & Kategori) | Must | FT-01 | Selesai |
| **FT-03** | Pencatatan & Pengelolaan Pekerjaan (Admin CRUD) | Must | FT-01, FT-02 | Selesai |
| **FT-04** | Validasi Link Dokumentasi & Penanda Terlambat | Must | FT-03 | Selesai |
| **FT-05** | Portal Monitoring Pekerjaan Pegawai | Must | FT-01, FT-03, FT-04 | Selesai |
| **FT-06** | Dashboard Monitoring Pimpinan & Unit | Must | FT-01, FT-03, FT-04 | Selesai |
| **FT-07** | Eksplorasi & Filter Data Pekerjaan Unit | Must | FT-01, FT-03, FT-04 | Selesai |
| **FT-08** | Detail Pekerjaan & Riwayat Perubahan | Should | FT-03, FT-04 | Selesai |
| **FT-09** | Otomatisasi Laporan Rekapitulasi (PDF & Excel) | Must | FT-01, FT-03, FT-04, FT-06 | Selesai |

## Hal yang Bertentangan, Ambigu, atau Belum Tertulis

### 1. Penyesuaian terhadap batasan tanpa server dan database
- **Di PRD:** Tertera validasi hak akses di server (mengembalikan kode 403 pada `/api/tasks/...`) dan penyimpanan data di database dengan `password_hash`.
- **Ketentuan proyek:** Aplikasi ini berjalan sepenuhnya di browser tanpa server dan tanpa database.
- **Usulan pengganti:** Seluruh data (pengguna contoh, kategori, pekerjaan, riwayat perubahan, dan pengaturan unit) disimpan di penyimpanan lokal browser (`localStorage`), sedangkan pembatasan peran (Admin, Pegawai, Pimpinan) dijaga langsung di lapisan logika aplikasi agar setiap peran hanya bisa melihat dan menjalankan aksi sesuai haknya.

### 2. Acuan tanggal pada filter periode dashboard dan laporan
- **Di PRD (Bagian 12):** Tertulis filter periode memakai Tanggal Tenggat (`due_date`) *atau* Tanggal Mulai (`start_date`).
- **Yang perlu diputuskan:** Pilih satu aturan baku agar angka dashboard, PDF, dan Excel selalu konsisten.

### 3. Pengaturan kop laporan (`UnitSetting`)
- **Di PRD (Bagian 11 & 12):** Ada entitas `UnitSetting` berisi nama unit kerja, nama pimpinan, dan NIP pimpinan untuk kop laporan PDF/Excel, tetapi belum masuk daftar fitur.
- **Yang perlu diputuskan:** Cara Admin mengelola informasi kop laporan tersebut.

### 4. Detail lain yang dicatat untuk tahap spec fitur
- **Format persentase penyelesaian:** PRD memberi contoh `69,57%` dan `75%`, sehingga akan dipakai format maksimal dua angka desimal tanpa angka nol berlebih di belakang koma.
- **Tanggal selesai manual (`completed_at`):** BL-03 menyebut tanggal selesai terisi otomatis kecuali Admin mengisinya manual, tetapi kolom tanggal selesai belum tercantum pada deskripsi formulir FT-03. Hal ini akan ditegaskan pada spec FT-03.
- **Data awal contoh:** Agar aplikasi langsung bisa diuji saat dibuka, perlu disediakan data contoh awal untuk akun Admin, Pegawai, Pimpinan, kategori, dan beberapa pekerjaan.

## Keputusan Tahap 1 (Disetujui Pengguna)

1. **Cara masuk aplikasi (1A):** Menggunakan form username dan kata sandi dengan akun contoh siap pakai serta tombol pilih cepat peran (Admin, Pegawai, Pimpinan).
2. **Acuan filter periode laporan & dashboard (2A):** Menggunakan Tanggal Tenggat (`due_date`) yang jatuh di dalam rentang tanggal yang dipilih.
3. **Pengaturan kop laporan (`UnitSetting`) (3A):** Disediakan menu atau panel Pengaturan Unit khusus Admin (digabungkan dalam pengelolaan master data pada FT-02).
