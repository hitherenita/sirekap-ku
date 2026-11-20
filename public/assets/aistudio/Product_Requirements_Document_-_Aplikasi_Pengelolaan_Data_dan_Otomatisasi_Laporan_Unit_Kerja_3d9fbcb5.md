# **Product Requirements Document — Aplikasi Pengelolaan Data dan Otomatisasi Laporan Unit Kerja**

Dokumen Spesifikasi Persyaratan Produk (PRD) — Sistem Informasi Manajemen Kerja dan Otomatisasi Rekapitulasi Pelaporan Unit.

# **1\. Document Information**

| Parameter | Detail Informasi |
| :---- | :---- |
| **Product Name** | Aplikasi Pengelolaan Data dan Otomatisasi Laporan Unit Kerja (Working Title: **SiRekap Unit**) |
| **Product Type** | Internal Web Application (Work Tracking, Monitoring & Automated Reporting) |
| **Primary Platform** | Web Desktop (Responsive untuk tampilan mobile monitoring) |
| **Target MVP Version** | v0.1 |
| **PRD Status** | Draft — Siap untuk Implementasi |

# **2\. Problem Background**

* **Inti Permasalahan:** Pencatatan penugasan dan realisasi pekerjaan pegawai di unit kerja masih tersebar (di grup percakapan, spreadsheet terpisah, atau catatan manual). Selain itu, penyimpanan berkas langsung di server aplikasi internal menimbulkan risiko keamanan data, pembengkakan kapasitas penyimpanan (*storage*), dan potensi kebocoran dokumen sensitif.  
* **Persona Terdampak:**  
  * **Admin / Sekretariat:** Kesulitan menghimpun data dari berbagai sumber, memastikan kelengkapan bukti kerja, dan menyusun rekapitulasi laporan periodik secara manual.  
  * **Pegawai:** Tidak memiliki satu portal terpusat untuk memantau daftar tugas yang tercatat atas nama dirinya beserta status dan tenggat waktunya.  
  * **Pimpinan:** Kesulitan memantau beban kerja, progres penyelesaian tugas secara *real-time*, dan mengidentifikasi pekerjaan yang tertunda/terlambat tanpa meminta rekap manual terlebih dahulu.  
* **Solusi Manual Saat Ini:** Sekretariat merekap data ke dalam Excel secara berkala, menagih *link* bukti dokumentasi satu per satu, lalu menyusun format laporan PDF secara manual setiap akhir periode.  
* **Konsekuensi Jika Tidak Ditangani:** Tinggi risiko keterlambatan pelaporan unit kerja, ketidakakuratan data capaian pegawai, lambatnya pengambilan keputusan pimpinan terhadap tugas yang macet, serta risiko keamanan akibat unggah file langsung ke sistem yang belum tersertifikasi penyimpanan dokumen sensitif.

# **3\. Product Goals & Success Indicators**

| Goal ID | Objective | Success Indicator | Target | Measurement Method |
| :---- | :---- | :---- | :---- | :---- |
| **GL-01** | Memusatkan pencatatan dan kendali mutu data pekerjaan | Persentase data pekerjaan unit kerja yang tercatat terpusat melalui portal oleh Admin/Sekretariat | **100%** penugasan unit tercatat di sistem | Audit log pencatatan pekerjaan per periode |
| **GL-02** | Menjaga keamanan data tanpa penyimpanan file fisik (Zero File Storage) | Seluruh bukti pekerjaan tersimpan sebagai tautan URL valid yang terverifikasi sebelum status Selesai | **0** file fisik tersimpan di server aplikasi; **100%** tugas Selesai memiliki link valid | Validasi sistem pada entitas Task & pengecekan storage server |
| **GL-03** | Mempercepat penyusunan laporan periodik unit kerja | Waktu yang dibutuhkan untuk menghasilkan rekapitulasi PDF dan Excel siap saji | **Kurang dari 1 menit** per generasi laporan (turun dari proses manual berjam-jam) | Pengukuran waktu eksekusi fitur Export Report |
| **GL-04** | Meningkatkan transparansi monitoring bagi Pegawai dan Pimpinan | Kemudahan akses pemantauan status, tenggat waktu, dan statistik capaian secara real-time | Waktu muat (*load time*) dashboard **\< 3 detik**; **100%** isolasi hak akses peran berjalan akurat | Pengujian UAT & Role-Based Access Control (RBAC) |

# **4\. Target Users & Roles**

| Peran Pengguna | Tanggung Jawab Utama | Tujuan (Goals) | Hambatan Utama (Friction Points) | Hak Akses Sistem (RBAC) |
| :---- | :---- | :---- | :---- | :---- |
| **Admin / Sekretariat** *(Pengelola)* | Bertanggung jawab penuh atas validitas input, pembaruan status, kelengkapan tautan dokumentasi, dan master data unit. | Mencatat dan memperbarui data pekerjaan dengan cepat tanpa duplikasi, serta mencetak rekapitulasi laporan akurat. | Kesalahan input status selesai tanpa bukti link; kesulitan mengelompokkan laporan per pegawai dan kategori. | **Full CRUD:** Tambah/Edit/Hapus pekerjaan semua pegawai, tambah link dokumentasi, ubah status, kelola master Pegawai & Kategori, lihat dashboard unit, unduh laporan PDF & Excel. |
| **Pegawai** *(Pengguna)* | Melaksanakan pekerjaan yang ditugaskan dan memastikan bukti kerja tersedia di penyimpanan cloud resmi untuk ditautkan oleh Admin. | Mengetahui daftar tugas yang tercatat atas namanya, memantau tenggat waktu, serta memeriksa riwayat dan status pekerjaannya. | Kebingungan soal status terbaru pekerjaannya di catatan sekretariat atau lupa tenggat waktu tugas. | **Read-Only (Terbatas Diri Sendiri):** Lihat daftar, detail, status, tenggat waktu, riwayat pekerjaan milik sendiri, dan buka link dokumentasi. Dilarang tambah/edit/hapus data atau melihat tugas pegawai lain. |
| **Pimpinan** *(Monitoring)* | Mengawasi kinerja operasional unit kerja, memantau hambatan tugas, dan mengevaluasi distribusi beban kerja. | Melihat ringkasan capaian unit secara instan, mendeteksi pekerjaan terlambat/tertunda, dan mengunduh laporan resmi kapan saja. | Harus menunggu rekap manual dari sekretariat untuk mengetahui progres tim atau pekerjaan yang belum selesai. | **Read-Only (Seluruh Unit):** Lihat seluruh data pekerjaan, filter per pegawai/kategori/status, lihat statistik & grafik, pantau tugas belum selesai, buka link dokumentasi, unduh laporan PDF & Excel. Dilarang mengubah data. |

# **5\. Business Logic & Rules**

## **BL-01: Otorisasi & Isolasi Hak Akses Berbasis Peran (RBAC)**

* **Trigger:** Setiap kali pengguna mengakses halaman, API, atau melakukan aksi pada data.  
* **Input:** `user_id`, `role` (`ADMIN`, `PEGAWAI`, `PIMPINAN`), dan `target_resource`.  
* **Processing:**  
  * Jika `role == ADMIN`: Izinkan akses baca dan tulis (*Create, Read, Update, Delete*) ke seluruh entitas (`Tasks`, `Employees`, `Categories`, `Reports`).  
  * Jika `role == PEGAWAI`: Terapkan filter wajib `WHERE employee_id == current_user.employee_id` pada seluruh query baca. Tolak seluruh request `POST`, `PUT`, `PATCH`, `DELETE` pada data pekerjaan maupun master data (HTTP 403 Forbidden).  
  * Jika `role == PIMPINAN`: Izinkan akses baca (`GET`) ke seluruh data pekerjaan unit dan generasi laporan (PDF/Excel). Tolak seluruh request mutasi data (`POST`, `PUT`, `PATCH`, `DELETE`) dengan HTTP 403 Forbidden.  
* **Expected Output:** Pengguna hanya melihat dan melakukan aksi sesuai matriks kewenangannya.  
* **Exceptions:** Admin tidak dapat menghapus akun dirinya sendiri atau menghapus master Pegawai/Kategori yang masih memiliki relasi aktif dengan data pekerjaan (gunakan mekanisme *soft-delete* / status Nonaktif).

## **BL-02: Validasi Tautan Dokumentasi & Zero File Upload**

* **Trigger:** Admin menyimpan data pekerjaan baru atau memperbarui data pekerjaan yang sudah ada.  
* **Input:** `documentation_url` (string, opsional saat status bukan Selesai, wajib saat status Selesai).  
* **Processing:**  
  1. Sistem menolak segala bentuk unggahan biner/file fisik (tidak ada endpoint upload file).  
  2. Jika `documentation_url` diisi, sistem memvalidasi format URL menggunakan standar URI valid dengan skema `http://` atau `https://` serta struktur domain yang sah (contoh valid: `https://drive.google.com/file/d/xyz`, `https://docs.google.com/...`, `https://intranet.instansi.go.id/doc/123`).  
  3. **Aturan Wajib Selesai:** Jika `status == 'Selesai'`, field `documentation_url` tidak boleh kosong (`null` atau string kosong). Jika kosong, proses simpan diblokir dan sistem menampilkan pesan error validasi.  
* **Expected Output:** Data tersimpan dengan URL valid yang dapat diklik (*clickable link* terbuka di tab baru) oleh Admin, Pegawai terkait, dan Pimpinan.  
* **Exceptions:** Untuk status Belum Dimulai, Dalam Proses, Ditunda, dan Dibatalkan, field `documentation_url` bersifat opsional (boleh kosong).

## **BL-03: Manajemen Status Pekerjaan & Penanda Keterlambatan Otomatis (Overdue)**

* **Trigger:** Pembuatan tugas, pembaruan status oleh Admin, atau pengecekan tanggal sistem harian/saat halaman dimuat.  
* **Input:** `status` (Belum Dimulai, Dalam Proses, Selesai, Ditunda, Dibatalkan), `due_date` (Tanggal Tenggat), `completed_at` (Tanggal Selesai), dan `current_date` (Tanggal Hari Ini).  
* **Processing:**  
  1. Status utama hanya dapat diubah secara manual oleh Admin.  
  2. Jika Admin mengubah status menjadi Selesai, sistem otomatis mencatat `completed_at = current_timestamp` (kecuali Admin menginput tanggal selesai aktual secara manual). Jika status diubah kembali dari Selesai ke status lain, `completed_at` di-reset menjadi `null`.  
  3. **Kalkulasi Flag Keterlambatan (`is_overdue`):**  
     * `is_overdue = TRUE` jika `current_date > due_date` **DAN** status berada dalam himpunan {Belum Dimulai, Dalam Proses, Ditunda}.  
     * `is_overdue = FALSE` jika status adalah Selesai atau Dibatalkan, atau jika `current_date <= due_date`.  
  4. **Kalkulasi Keterlambatan Penyelesaian (`is_completed_late`):**  
     * `is_completed_late = TRUE` jika `status == 'Selesai'` **DAN** `DATE(completed_at) > due_date`.  
* **Contoh Konkret:**  
  * *Kasus 1:* Tugas A memiliki `due_date` \= 18 November 2026, status Dalam Proses. Pada tanggal 20 November 2026, sistem tetap menampilkan status utama Dalam Proses dengan lencana peringatan merah **Terlambat (2 hari)**.  
  * *Kasus 2:* Tugas B memiliki `due_date` \= 18 November 2026, status diubah menjadi Dibatalkan pada 19 November 2026\. Status tampil sebagai Dibatalkan dan tidak lagi dihitung sebagai pekerjaan aktif yang terlambat.  
* **Expected Output:** Status pekerjaan selalu akurat dan pekerjaan yang melewati tenggat waktu langsung teridentifikasi di dashboard Pimpinan, Pegawai, maupun Admin.

## **BL-04: Kalkulasi Statistik Dashboard & Rekapitulasi Laporan (Opsi A)**

* **Trigger:** Admin atau Pimpinan membuka halaman Dashboard atau mengekspor laporan untuk rentang periode tertentu (`start_date` s.d. `end_date`).  
* **Input:** Filter periode tanggal (`start_date`, `end_date`), filter opsional `employee_id`, `category_id`, dan `status`.  
* **Processing:**  
  1. **Ringkasan Eksekutif Unit:**  
     * Total Pekerjaan \= Jumlah seluruh tugas dalam periode filter.  
     * Selesai \= Jumlah tugas berstatus Selesai.  
     * Dalam Proses \= Jumlah tugas berstatus Dalam Proses.  
     * Belum Dimulai \= Jumlah tugas berstatus Belum Dimulai.  
     * Ditunda \= Jumlah tugas berstatus Ditunda.  
     * Dibatalkan \= Jumlah tugas berstatus Dibatalkan.  
     * Terlambat Aktif \= Jumlah tugas dengan `is_overdue == TRUE`.  
     * **Tingkat Penyelesaian (%)** \= `(Jumlah Selesai / (Total Pekerjaan - Jumlah Dibatalkan)) x 100%` *(Tugas dibatalkan dikeluarkan dari pembagi target efektif agar persentase kinerja tidak terdistorsi; jika pembagi \= 0, hasil \= 0%)*.  
  2. **Rekapitulasi Per Pegawai:** Mengelompokkan seluruh tugas berdasarkan `employee_id` untuk menghitung total tugas, rincian per status (Selesai, Dalam Proses, Belum Dimulai, Ditunda, Dibatalkan), jumlah Terlambat, dan Tingkat Penyelesaian (%) masing-masing pegawai.  
  3. **Rekapitulasi Per Kategori Pekerjaan:** Mengelompokkan seluruh tugas berdasarkan `category_id` untuk menghitung distribusi volume pekerjaan dan tingkat penyelesaian per jenis kategori.  
* **Contoh Numerik:**  
  * Dalam bulan November 2026, Unit Kerja memiliki 25 tugas tercatat: 16 Selesai, 4 Dalam Proses, 2 Belum Dimulai, 1 Ditunda, dan 2 Dibatalkan.  
  * Pembagi efektif \= 25 \- 2 \= 23 tugas.  
  * Tingkat Penyelesaian \= (16 / 23\) x 100% \= **69,57%**.  
* **Expected Output:** Data agregat yang identik antara tampilan Dashboard, berkas unduhan Excel (`.xlsx`), dan dokumen cetak PDF (`.pdf`).

## **BL-05: Pencatatan Riwayat Perubahan Pekerjaan (Audit Trail)**

* **Trigger:** Setiap aksi pembuatan pekerjaan baru, perubahan status, perubahan tenggat waktu, atau penambahan/perubahan `documentation_url` oleh Admin.  
* **Input:** `task_id`, `changed_by` (Admin ID), `field_changed`, `old_value`, `new_value`, `notes` (opsional, misal alasan penundaan/pembatalan), dan `timestamp`.  
* **Processing:** Sistem otomatis menyisipkan baris log baru ke tabel riwayat tanpa menimpa log sebelumnya.  
* **Expected Output:** Pegawai, Admin, dan Pimpinan dapat melihat kronologi status pekerjaan di halaman detail tugas (misal: kapan tugas dibuat, kapan mulai dikerjakan, kapan ditunda beserta alasannya, hingga kapan diselesaikan).

# **6\. Feature Requirements**

| Feature Code | Feature Name | Requirement Description | Related Business Logic | Priority | Target Version |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **FT-01** | Autentikasi & Manajemen Sesi RBAC | Halaman login pengguna dengan validasi kredensial dan pengalihan otomatis ke tampilan dashboard sesuai peran (Admin, Pegawai, Pimpinan). | BL-01 | **Must** | v0.1 |
| **FT-02** | Manajemen Data Master (Pegawai & Kategori) | Halaman khusus Admin untuk menambah, mengubah, dan menonaktifkan data Pegawai (Nama, NIP/ID, Jabatan, Email/Username, Role) serta Master Kategori Pekerjaan. | BL-01 | **Must** | v0.1 |
| **FT-03** | Pencatatan & Pengelolaan Pekerjaan (Admin CRUD) | Formulir tambah dan edit data pekerjaan oleh Admin mencakup: Judul Pekerjaan, Deskripsi, Pegawai Pelaksana, Kategori, Tanggal Mulai, Tenggat Waktu (`due_date`), Status, Catatan Status, dan Link Dokumentasi (URL). Dilengkapi fitur hapus dengan konfirmasi. | BL-01, BL-02, BL-03, BL-05 | **Must** | v0.1 |
| **FT-04** | Validasi Link Dokumentasi & Penanda Terlambat | Validasi format URL (http/https), blokir penyimpanan status Selesai jika link kosong, serta kalkulasi otomatis indikator Terlambat pada daftar dan detail tugas. | BL-02, BL-03 | **Must** | v0.1 |
| **FT-05** | Portal Monitoring Pekerjaan Pegawai | Tampilan daftar tugas aktif, filter status, indikator tenggat waktu, akses klik langsung ke link dokumentasi, serta tab riwayat pekerjaan selesai khusus milik pegawai yang sedang login. | BL-01, BL-03, BL-05 | **Must** | v0.1 |
| **FT-06** | Dashboard Monitoring Pimpinan & Unit | Visualisasi kartu ringkasan statistik (Total, Selesai, Proses, Ditunda, Dibatalkan, Terlambat), grafik distribusi per kategori & status, serta tabel pemantauan cepat pekerjaan yang belum selesai/terlambat. | BL-01, BL-03, BL-04 | **Must** | v0.1 |
| **FT-07** | Eksplorasi & Filter Data Pekerjaan Unit | Tabel daftar seluruh pekerjaan unit kerja bagi Admin dan Pimpinan dengan pencarian kata kunci serta multi-filter (Rentang Tanggal, Pegawai, Kategori, Status, Keterlambatan). | BL-01, BL-03 | **Must** | v0.1 |
| **FT-08** | Detail Pekerjaan & Riwayat Perubahan | Halaman/modal detail pekerjaan yang menampilkan seluruh atribut tugas, tombol buka link dokumentasi di tab baru, serta lini masa (*timeline*) riwayat perubahan status. | BL-02, BL-05 | **Should** | v0.1 |
| **FT-09** | Otomatisasi Laporan Rekapitulasi (PDF & Excel) | Generator laporan otomatis berdasarkan periode tanggal yang dipilih dengan struktur Opsi A: (1) Ringkasan Statistik Unit, (2) Rekapitulasi per Pegawai, (3) Rekapitulasi per Kategori, dan (4) Lampiran Rincian Pekerjaan beserta tautan dokumentasi. | BL-01, BL-04 | **Must** | v0.1 |

# **7\. Main User Flow**

```
+-----------------------------------------------------------------------------------+
|                                 LOGIN PENGGUNA                                    |
+-----------------------------------------------------------------------------------+
                                          |
                                  [ Cek Peran/Role ]
                                          |
     +------------------------------------+------------------------------------+
     |                                    |                                    |
     v                                    v                                    v
[ ADMIN / SEKRETARIAT ]               [ PEGAWAI ]                         [ PIMPINAN ]
     |                                    |                                    |
     +--> Dashboard Admin                 +--> Portal Tugas Saya               +--> Dashboard Unit
     |                                    |    - Lihat Tugas Aktif             |    - Grafis & Ringkasan
     +--> Kelola Master Data              |    - Cek Tenggat Waktu             |    - Pantau Tugas Terlambat
     |    (Pegawai & Kategori)            |    - Buka Link Bukti               |    - Filter per Pegawai/Kategori
     |                                    |    - Lihat Riwayat Selesai         |
     +--> Input / Edit Pekerjaan          +------------------------------------+    +--> Buat & Export Laporan
     |    |                                                                    |    - Cetak PDF
     |    v                                                                    |    - Unduh Excel (.xlsx)
     |  [ Status == Selesai? ]                                                 |
     |    |-- YA  --> Cek Link URL Valid? --(TIDAK)--> Show Error              |
     |    |           |--(YA)--> Simpan & Audit Log                            |
     |    |-- TIDAK -> Format URL Valid?  --(TIDAK)--> Show Error              |
     |                |--(YA)--> Simpan & Audit Log                            |
     |                                                                         |
     +--> Export Laporan (PDF/Excel) <-----------------------------------------+
```

# **8\. Acceptance Criteria**

| AC ID | Related Feature | Condition | Expected Behavior | Pass Criteria |
| :---- | :---- | :---- | :---- | :---- |
| **AC-01** | FT-01 | Pengguna login menggunakan akun dengan peran Pegawai | Sistem mengarahkan pengguna ke halaman Tugas Saya dan menyembunyikan menu Manajemen Master, Tambah Tugas, serta data tugas pegawai lain. | Pengguna tidak dapat melihat tugas milik pegawai lain maupun mengakses halaman/API mutasi data (mendapat respons 403 jika dipaksa via URL/API). |
| **AC-02** | FT-01 | Pengguna login menggunakan akun dengan peran Pimpinan | Sistem menampilkan seluruh data pekerjaan unit, grafik statistik, dan tombol unduh laporan, tanpa tombol Tambah, Edit, atau Hapus pekerjaan. | Pimpinan dapat melihat semua data unit dan mengunduh PDF/Excel, namun tidak memiliki kontrol pengubahan data apa pun. |
| **AC-03** | FT-03, FT-04 | Admin menyimpan pekerjaan dengan status Selesai tetapi field Link Dokumentasi dikosongkan | Sistem menolak penyimpanan data dan menampilkan pesan peringatan yang jelas pada kolom link dokumentasi. | Data tidak tersimpan ke database hingga URL yang valid dimasukkan. |
| **AC-04** | FT-03, FT-04 | Admin memasukkan teks bukan URL (contoh: "sudah dikirim via WA" atau "C:\\dokumen\\file.pdf") pada field Link Dokumentasi | Sistem menolak input karena bukan tautan web valid (http\:// atau https\://). | Muncul validasi error "Masukkan tautan URL yang valid (diawali http\:// atau https\://)". |
| **AC-05** | FT-03, FT-04 | Admin menyimpan pekerjaan dengan status Ditunda atau Dibatalkan tanpa link dokumentasi | Sistem mengizinkan penyimpanan data dan mencatat status sesuai pilihan. | Data tersimpan dengan status Ditunda/Dibatalkan dan `documentation_url` bernilai kosong/null. |
| **AC-06** | FT-04 | Tanggal saat ini melewati `due_date` pekerjaan yang berstatus Belum Dimulai, Dalam Proses, atau Ditunda | Sistem menampilkan penanda visual Terlambat beserta selisih hari keterlambatan pada tabel dan detail tugas. | Indikator Terlambat muncul otomatis tanpa perlu Admin mengubah status secara manual. |
| **AC-07** | FT-05 | Pegawai membuka halaman monitoring pribadinya | Sistem menampilkan daftar pekerjaan yang ditugaskan kepadanya, memisahkan/memfilter pekerjaan aktif dan riwayat selesai, serta menyediakan tautan aktif ke link dokumentasi. | Seluruh tugas milik pegawai tampil akurat; mengklik link dokumentasi membuka tab baru menuju URL terkait. |
| **AC-08** | FT-06, FT-09 | Admin atau Pimpinan mengunduh laporan PDF dan Excel untuk periode tertentu (misal: 1–30 November 2026\) | Sistem menghasilkan file `.pdf` dan `.xlsx` yang memuat ringkasan statistik unit, tabel rekapitulasi per pegawai, tabel rekapitulasi per kategori, dan daftar rincian pekerjaan. | Angka total, persentase penyelesaian, dan jumlah per status di file PDF dan Excel 100% cocok dengan data di Dashboard untuk periode yang sama. |

# **9\. Validation Test Scenarios**

| Test ID | Related Requirement | Scenario | Test Input | Expected Result | Test Type |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **TC-01** | BL-02, FT-04 | Simpan pekerjaan status Selesai dengan URL Google Drive valid | `status` \= "Selesai", `documentation_url` \= "https\://drive.google.com/file/d/123abc/view" | Pekerjaan berhasil disimpan, `completed_at` terisi otomatis, link dapat diklik. | Happy Path |
| **TC-02** | BL-02, FT-04 | Simpan pekerjaan status Selesai tanpa link dokumentasi | `status` \= "Selesai", `documentation_url` \= "" | Sistem memblokir penyimpanan dan menampilkan pesan error wajib isi link dokumentasi. | Error |
| **TC-03** | BL-02, FT-04 | Input URL tidak valid pada pekerjaan status Dalam Proses | `status` \= "Dalam Proses", `documentation_url` \= "folder-bersama-drive" | Sistem menolak penyimpanan karena format URL tidak valid. | Error |
| **TC-04** | BL-03, FT-04 | Pengecekan tugas tepat pada hari tenggat waktu (`due_date == current_date`) | `due_date` \= "2026-11-20", `current_date` \= "2026-11-20", `status` \= "Dalam Proses" | Tugas belum ditandai Terlambat (batas akhir masih hari ini). | Boundary |
| **TC-05** | BL-03, FT-04 | Pengecekan tugas H+1 setelah tenggat waktu pada status Ditunda | `due_date` \= "2026-11-19", `current_date` \= "2026-11-20", `status` \= "Ditunda" | Tugas tampil dengan status Ditunda dan lencana Terlambat (1 hari). | Boundary |
| **TC-06** | BL-04, FT-09 | Kalkulasi persentase penyelesaian saat ada tugas Dibatalkan | 10 tugas: 6 Selesai, 2 Dalam Proses, 2 Dibatalkan | Total \= 10, Target Efektif \= 8, Tingkat Penyelesaian \= **75%** (6/8). | Happy Path |
| **TC-07** | BL-04, FT-09 | Export laporan PDF & Excel pada rentang tanggal yang tidak memiliki data | `start_date` \= "2026-01-01", `end_date` \= "2026-01-07" (0 data) | File laporan tetap terunduh rapi dengan nilai angka 0 dan keterangan "Tidak ada data pekerjaan pada periode ini" (tidak crash/error 500). | Boundary |
| **TC-08** | BL-01, FT-05 | Pegawai mencoba mengakses API edit pekerjaan milik sendiri atau orang lain | Request `PATCH /api/tasks/101` dengan token sesi `role` \= "PEGAWAI" | Server menolak permintaan dengan status kode **403 Forbidden** dan data tidak berubah. | Error |

# **10\. Constraints & Out of Scope**

## **Business Constraints**

* **Single Point of Data Entry:** Hanya peran Admin / Sekretariat yang berwenang menginput dan mengubah data pekerjaan untuk menjaga standar penamaan, validitas tautan, dan disiplin pelaporan.  
* **Zero File Hosting Policy:** Aplikasi dilarang keras menyediakan fitur upload berkas lokal (PDF, DOCX, gambar, ZIP) ke server aplikasi demi keamanan data dan efisiensi infrastruktur. Seluruh bukti kerja dikelola di penyimpanan cloud eksternal milik organisasi/pegawai dan ditautkan melalui URL.

## **Technical & Platform Constraints**

* **Autentikasi & Keamanan Sesi:** Seluruh pertukaran data wajib menggunakan protokol HTTPS dengan validasi otorisasi sisi server (*server-side RBAC enforcement*), bukan sekadar menyembunyikan tombol di antarmuka (*UI hiding*).  
* **Kompatibilitas Ekspor:** File Excel harus menggunakan format standar `.xlsx` (terbuka rapi di Microsoft Excel, LibreOffice Calc, dan Google Sheets), sedangkan file PDF harus menggunakan tata letak portrait/landscape standar A4 yang siap dicetak.

## **Explicit Out of Scope (Tidak Termasuk di MVP v0.1)**

* Penyimpanan file fisik (*cloud storage engine* internal) atau preview isi file di dalam aplikasi.  
* Fitur pegawai menginput/mengajukan laporan kerja mandiri atau alur persetujuan (*approval workflow*) bertingkat.  
* Integrasi notifikasi otomatis ke WhatsApp/Email/Telegram (pada v0.1 notifikasi keterlambatan ditampilkan langsung di dalam dashboard aplikasi).  
* Penilaian angka kredit atau perhitungan tunjangan kinerja (Tukin/KPI kompleks) otomatis.

# **11\. Data Entities & Storage Requirements**

1. **Entitas User (Pengguna & Pegawai):**  
   * **Atribut Utama:** `id`, `nip_or_employee_code` (unik), `full_name`, `position` (Jabatan), `email_or_username` (unik), `password_hash`, `role` (`ADMIN`, `PEGAWAI`, `PIMPINAN`), `is_active` (boolean, default true), `created_at`, `updated_at`.  
   * **Aturan Validasi:** Email/username dan kode pegawai tidak boleh duplikat. Akun dengan `is_active = false` tidak dapat login tetapi riwayat pekerjaannya tetap terjaga di laporan historis.  
2. **Entitas WorkCategory (Kategori Pekerjaan):**  
   * **Atribut Utama:** `id`, `category_name` (unik), `description`, `is_active` (boolean, default true), `created_at`.  
   * **Aturan Validasi:** Nama kategori wajib diisi dan unik.  
3. **Entitas WorkTask (Data Pekerjaan):**  
   * **Atribut Utama:** `id` (Primary Key), `title` (Judul Pekerjaan — wajib, maks. 200 karakter), `description` (Rincian/Output yang diharapkan — opsional), `employee_id` (Relasi ke User — wajib), `category_id` (Relasi ke WorkCategory — wajib), `start_date` (Tanggal Mulai — wajib), `due_date` (Tanggal Tenggat — wajib, `due_date >= start_date`), `status` (Belum Dimulai, Dalam Proses, Selesai, Ditunda, Dibatalkan — default Belum Dimulai), `status_note` (Catatan tambahan, misal alasan penundaan/pembatalan — opsional), `documentation_url` (Tautan bukti kerja — wajib jika `status == 'Selesai'`, harus valid URL http/https), `completed_at` (Timestamp penyelesaian — terisi otomatis saat status menjadi Selesai), `created_by` (Relasi ke User Admin pembuat), `created_at`, `updated_at`.  
4. **Entitas TaskAuditLog (Riwayat Perubahan Pekerjaan):**  
   * **Atribut Utama:** `id`, `task_id` (Relasi ke WorkTask), `changed_by` (Relasi ke User Admin), `action_type` (`CREATED`, `STATUS_CHANGED`, `LINK_UPDATED`, `DETAILS_UPDATED`), `old_value`, `new_value`, `note`, `created_at`.  
5. **Konfigurasi Laporan & Unit Kerja (UnitSetting):**  
   * **Atribut Utama:** `unit_name` (Nama Unit Kerja untuk kop laporan PDF/Excel), `leader_name` (Nama Pimpinan penanda tangan laporan), `leader_nip` (NIP/ID Pimpinan).

# **12\. Assumptions, Risks & Open Items**

## **Asumsi Utama**

* **\[Proposed Assumption\]** Admin/Sekretariat merangkap akun sebagai pengelola data; jika seorang Admin juga memiliki tugas pribadi, akunnya tetap dapat dipilih pada daftar `employee_id` saat pencatatan tugas.  
* **\[Proposed Assumption\]** Tautan dokumentasi yang dilampirkan Admin sudah diatur izin aksesnya (*permission sharing* di Google Drive/OneDrive/intranet) agar dapat dibuka oleh Pimpinan dan Pegawai yang bersangkutan.  
* **\[Proposed Assumption\]** Filter periode pada Laporan Otomatis (PDF & Excel) menggunakan acuan Tanggal Tenggat (`due_date`) atau Tanggal Mulai (`start_date`) yang berada dalam rentang tanggal laporan yang dipilih.

## **Risiko Operasional & Mitigasi**

* **Risiko Tautan Mati (*Broken Link*) atau Terkunci (*Access Denied*):** Karena aplikasi hanya menyimpan URL, ada kemungkinan tautan eksternal dihapus atau lupa dibuka aksesnya.  
  * *Mitigasi:* Menyediakan tombol **"Buka / Uji Tautan"** langsung di formulir input Admin sebelum menyimpan.  
* **Risiko Beban Input pada Admin:** Jika volume pekerjaan harian sangat tinggi, Admin bisa kewalahan mencatat satu per satu.  
  * *Mitigasi:* Antarmuka form dirancang ringkas dengan fitur duplikasi tugas (untuk tugas rutin berulang) pada iterasi berikutnya.

## **Open Items (Non-Kritis untuk v0.1)**

* Penentuan format kop surat/header resmi instansi pada template ekspor PDF (dapat dikonfigurasi melalui tabel `UnitSetting`).

# **13\. Requirement Traceability Matrix**

| Business Logic (BL) | Feature Code (FT) | Acceptance Criteria (AC) | Test Case (TC) |
| :---- | :---- | :---- | :---- |
| **BL-01** (Otorisasi & Isolasi RBAC) | FT-01, FT-02, FT-03, FT-05, FT-06, FT-07, FT-09 | AC-01, AC-02 | TC-08 |
| **BL-02** (Validasi URL & Wajib Link Selesai) | FT-03, FT-04, FT-08 | AC-03, AC-04, AC-05 | TC-01, TC-02, TC-03 |
| **BL-03** (Manajemen Status & Flag Terlambat) | FT-03, FT-04, FT-05, FT-06, FT-07 | AC-05, AC-06, AC-07 | TC-04, TC-05 |
| **BL-04** (Kalkulasi Statistik & Rekap Opsi A) | FT-06, FT-09 | AC-08 | TC-06, TC-07 |
| **BL-05** (Audit Trail & Riwayat Tugas) | FT-03, FT-05, FT-08 | AC-07 | TC-01 |

