# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Mahasiswa FTI Universitas Trisakti (Utama)**: Mengakses portal dari smartphone di lingkungan kampus untuk mengeksplorasi seminar/workshop, mengklaim tiket 1-klik, menunjukkan tiket QR offline di pintu aula, mengerjakan kuis pre/post-test, dan mengunduh E-Sertifikat ber-SKPI.
2. **Panitia Acara / Himpunan Mahasiswa (Operator)**: Mengoperasikan scanner kamera QR via browser smartphone atau laptop di meja registrasi untuk mencatat kehadiran peserta secara instan (<150ms) dan mengaktifkan akses post-test saat materi selesai.
3. **Pimpinan / Admin Fakultas**: Mengelola publikasi acara, mengawasi kuota dan metrik kehadiran, serta mengekspor rekap data peserta ke CSV/Excel untuk pelaporan kemahasiswaan.
4. **Peserta Eksternal / Mahasiswa Luar (Sekunder)**: Partisipan umum pada event terbuka berskala nasional.

## Product Purpose

FTI Event!t menyatukan seluruh siklus hidup kegiatan akademik dan kemahasiswaan Fakultas Teknologi Informasi ke dalam satu platform Progressive Web App (PWA) terpadu. Sistem ini menggantikan proses presensi manual kertas dan distribusi sertifikat konvensional dengan alur otomatis: pendaftaran 1-klik, presensi QR instan, evaluasi kompetensi, dan penerbitan sertifikat digital terverifikasi.

## Positioning

Satu-satunya portal kegiatan fakultas yang menggabungkan:
- **PWA Standalone Universal**: Langsung terpasang di layar utama iPhone (Safari) dan Android (Chrome) tanpa biaya toko aplikasi ($99 Apple Dev / $25 Google Play).
- **Offline-First Ticket Access**: Tiket QR tersimpan di cache lokal (*Service Worker*) sehingga tetap terbuka dan dapat divalidasi meski gedung auditorium kampus mengalami *dead zone* koneksi internet.
- **Sertifikasi Berbasis Syarat Ketat (Mode B)**: E-Sertifikat dan poin SKPI hanya dapat diunduh jika mahasiswa benar-benar hadir (diverifikasi oleh scanner panitia) dan telah menuntaskan evaluasi pemahaman (post-test).

## Operating Context

- **Lokasi Utama**: Auditorium FTI, Lab Komputer, Gedung Kampus A Universitas Trisakti, dan webinar daring (Zoom/Google Meet).
- **Situasi Lapangan**: Antrean padat menjelang jam mulai acara (membutuhkan respon scanner <150ms dengan audio beep feedback untuk kelancaran antrean pintu masuk).
- **Koneksi Jaringan**: Fluktuatif di ruang tertutup/auditorium kampus; mewajibkan tiket dan QR code dapat di-render tanpa sambungan internet aktif.
- **Perangkat**: Mayoritas mahasiswa menggunakan smartphone (iOS Safari & Android Chrome), panitia menggunakan smartphone/tablet/laptop.

## Capabilities and Constraints

- **Autentikasi Cepat**: Registrasi mahasiswa berbasis NIM, Program Studi (Teknik Informatika, Sistem Informasi, Teknik Komputer, MTI), Angkatan, dan Email langsung aktif tanpa friksi verifikasi email di fase MVP.
- **Klaim Tiket Atomik**: Proteksi kuota tingkat database (PostgreSQL transaction) yang mencegah *overbooking* saat ratusan mahasiswa berebut slot seminar populer secara serentak.
- **Anti-Double Check-In**: Setiap tiket memiliki kode UUID unik dengan constraint database `unique(ticket_id)` pada log presensi.
- **Evaluasi 5 Soal Terpadu**: Bank soal pilihan ganda A–D dengan penilaian otomatis 0–100 untuk mengukur pemahaman sebelum (Pre-Test) dan sesudah acara (Post-Test).
- **Generator PDF Langsung di Klien**: Pembuatan sertifikat PDF beresolusi tinggi menggunakan `jspdf` dengan nomor lisensi resmi tanpa membebani server.

## Brand Commitments

- **Nama Resmi**: FTI Event!t — Fakultas Teknologi Informasi Universitas Trisakti.
- **Aset Visual Terkonfirmasi**: Logo resmi Universitas Trisakti (`/public/logo.png`, `Trisakti_Stacked Logo_Black.png`).
- **Palet Warna Inti**: Slate 950 (Latar Gelap / Deep Space), Royal Blue 600–800 (Warna Institusi FTI Trisakti), Electric Indigo & Cyan (Aksen Teknologi & Interaktivitas), Emerald (Status Hadir/Valid), Amber (Status Siap Di-scan & Poin SKPI).
- **Tipografi**: Inter (Modern, tajam, mudah dibaca di layar kecil ponsel).
- **Gaya Bahasa**: Profesional, energik, khas sivitas akademika teknologi modern.

## Evidence on Hand

- Dokumen spesifikasi arsitektur: `fti_event_pwa_implementation_plan.md`.
- Logo resmi Trisakti: `public/logo.png`.
- Skema migrasi Supabase: `supabase/migrations/20261019000000_initial_schema.sql`.
- File manifest PWA: `public/manifest.json`.
- File service worker: `public/sw.js`.

## Product Principles

1. **Kecepatan di Pintu Masuk adalah Prioritas Tertinggi**: Halaman tiket dan scanner kamera tidak boleh *hang* atau menuntut loading jaringan lambat saat ratusan mahasiswa mengantre di pintu aula.
2. **Integritas Sertifikasi Tanpa Kompromi**: E-Sertifikat dan poin SKPI memiliki bobot akademik; tidak ada jalan pintas untuk mengunduh sertifikat tanpa presensi hadir fisik/virtual dan penyelesaian evaluasi.
3. **Zero Install Friction**: Mengutamakan kapabilitas web modern (PWA) agar mahasiswa cukup memindai tautan/poster dan langsung dapat menggunakan aplikasi tanpa harus mengunduh 70MB file APK.
4. **Kejelasan Status Real-Time**: Mahasiswa selalu mengetahui status tiket mereka secara visual (Siap Di-scan vs Sudah Hadir) dan apa langkah selanjutnya yang harus dilakukan.

## Accessibility & Inclusion

- Kontras warna teks tinggi memenuhi standar WCAG AA di atas latar gelap.
- Ukuran target sentuh tombol minimal 44x44px untuk kenyamanan jempol di layar ponsel.
- Umpan balik audio (*synthesized Web Audio beep*) dan visual berwarna ganda (ikon + teks) pada scanner panitia agar ramah bagi pengguna di lingkungan bising maupun pengguna dengan keterbatasan penglihatan warna.
