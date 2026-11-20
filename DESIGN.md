# Keputusan Desain — SiRekap Unit

Dokumen ini mencatat seluruh keputusan desain visual dan interaksi yang telah disetujui pengguna untuk aplikasi **SiRekap Unit**.

## Keputusan Desain Pengguna

1. **Kesan visual:** Formal dan tenang, menggunakan jenis huruf **IBM Plex Sans** (ketebalan 400, 500, dan 600) yang dipasang secara lokal lewat paket npm.
2. **Warna aksen:** Biru (`blue`), dipakai khusus untuk tombol utama, elemen terpilih, cincin fokus, dan penanda penting.
3. **Sapaan pengguna:** Anda.
4. **Susunan halaman:** Satu halaman bergulir dengan menu navigasi bagian di bagian atas sesuai peran pengguna.
5. **Posisi aksi utama:** Di bagian atas atau akhir konten terkait.
6. **Gambar:** Tanpa gambar; hanya menggunakan ikon sederhana (`lucide-react`) dan teks.

## Token Visual Tetap

- **Latar halaman:** `bg-neutral-50`
- **Permukaan kartu dan panel:** `bg-white rounded-2xl` (tidak menaruh kartu di dalam kartu; garis tepi `border-neutral-200` hanya untuk input, tabel, dan pemisah)
- **Tombol dan input:** `rounded-xl`, tinggi area sentuh minimal 44 × 44 px, ukuran teks input minimal 16 px (`text-base`)
- **Badge status (`rounded-full`):** selalu memuat ikon dan label teks:
  - Selesai: `bg-emerald-50 text-emerald-800`
  - Dalam Proses: `bg-blue-50 text-blue-800`
  - Belum Dimulai: `bg-neutral-100 text-neutral-800`
  - Ditunda: `bg-amber-50 text-amber-800`
  - Dibatalkan / Terlambat: `bg-red-50 text-red-800`
- **Tombol utama:** `bg-blue-700 hover:bg-blue-800 text-white`
- **Cincin fokus:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2`
- **Tipografi:** judul halaman `text-2xl`, judul bagian `text-lg`, isi `text-base`, label `text-sm`, angka utama `text-3xl tabular-nums`
- **Gerak:** hanya `transform` dan `opacity` dengan durasi 150–250 ms `ease-out`, menghormati `motion-reduce:`, tanpa `transition-all`.
- **Aksesibilitas & tampilan:** dirancang mulai lebar 360 px dengan aksi utama terlihat tanpa menggulir pada layar 360 × 740 px, kontras teks minimal 4,5:1, dan setiap input memiliki label yang selalu terlihat.
