import Link from "next/link";
import Image from "next/image";
import { 
  Calendar, 
  QrCode, 
  Award, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  ScanLine
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
              <Image 
                src="/logo.png" 
                alt="Logo Trisakti" 
                width={32} 
                height={32} 
                className="object-contain" 
              />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                FTI Event!t
              </span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Fakultas Teknologi Informasi
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/events" className="hover:text-blue-400 transition-colors">Katalog Event</Link>
            <Link href="/tickets" className="hover:text-blue-400 transition-colors">Tiket Saya</Link>
            <Link href="/scanner" className="hover:text-blue-400 transition-colors flex items-center gap-1.5 text-emerald-400">
              <ScanLine className="w-4 h-4" /> Mode Panitia
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs md:text-sm font-semibold px-4 py-2 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition-all"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="text-xs md:text-sm font-semibold px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all"
            >
              Daftar Mahasiswa
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center text-center">
        {/* Campus Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs md:text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Platform Resmi Kegiatan & Seminar Mahasiswa FTI</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Satu Aplikasi untuk Seluruh{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            Event, Seminar & Workshop
          </span>{" "}
          Kampus
        </h1>

        <p className="mt-5 text-sm md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Klaim tiket 1-klik, akses QR tiket secara <strong>offline</strong> di aula kampus, 
          kerjakan evaluasi pre/post-test langsung di ponsel, dan unduh E-Sertifikat ber-SKPI otomatis.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/events"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition-all"
          >
            <span>Jelajahi Event FTI</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/tickets"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-sm transition-all"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Buka Tiket Saya (Offline)</span>
          </Link>
        </div>

        {/* Key Features Grid */}
        <section className="mt-16 md:mt-24 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tiket QR Anti-Macet</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tiket tersimpan di memori perangkat melalui Service Worker. Tetap bisa discan panitia meski sinyal internet di auditorium mati total.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">E-Sertifikat & Poin SKPI</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Otomatis terbit setelah mahasiswa hadir dan menyelesaikan evaluasi post-test. Lengkap dengan nomor lisensi dan barcode verifikasi keaslian.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
              <ScanLine className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Scanner Kamera Terpadu</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Panitia tidak perlu install aplikasi tambahan. Buka kamera scanner langsung di browser smartphone atau laptop dengan respon instan &lt;150ms.
            </p>
          </div>
        </section>

        {/* PWA Benefits Banner */}
        <div className="mt-12 w-full p-6 md:p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/50 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-bold text-white">Dapat Di-install di iPhone &amp; Android (PWA)</h4>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Buka di Safari (iOS) atau Chrome (Android) lalu pilih <strong>&quot;Add to Home Screen&quot;</strong> untuk sensasi aplikasi native tanpa download Play Store.
              </p>
            </div>
          </div>
          <Link
            href="/events"
            className="shrink-0 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-semibold transition-all shadow-md"
          >
            Mulai Sekarang
          </Link>
        </div>
      </main>

      {/* Mobile Sticky Bottom Navigation (PWA Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-6 py-2.5 flex items-center justify-around text-xs">
        <Link href="/" className="flex flex-col items-center gap-1 text-blue-400 font-semibold">
          <Calendar className="w-5 h-5" />
          <span>Beranda</span>
        </Link>
        <Link href="/events" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <Users className="w-5 h-5" />
          <span>Event</span>
        </Link>
        <Link href="/tickets" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <QrCode className="w-5 h-5" />
          <span>Tiket</span>
        </Link>
        <Link href="/scanner" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <ScanLine className="w-5 h-5" />
          <span>Scanner</span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 pb-20 md:pb-6">
        <p>&copy; 2026 FTI Event!t — Fakultas Teknologi Informasi Universitas Trisakti. All rights reserved.</p>
      </footer>
    </div>
  );
}
