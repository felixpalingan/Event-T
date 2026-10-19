"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  Loader2, 
  LogIn, 
  ShieldCheck, 
  ScanLine, 
  User, 
  ChevronRight,
  Sparkles,
  GraduationCap,
  Building2,
  QrCode,
  Award,
  KeyRound,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  MapPin,
  Ticket,
  Maximize2,
  X,
  Radio,
  Eye,
  EyeOff
} from "lucide-react";

interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: "MAHASISWA" | "PANITIA" | "ADMIN";
  nimNidn: string;
  prodi: string;
  roleTitle: string;
  badge: string;
  badgeClass: string;
  cardClass: string;
  headerGradient: string;
  avatarClass: string;
  buttonClass: string;
  accentGlow: string;
  scenario: string;
  targetRoute: string;
  statusBadges: { icon: typeof CheckCircle2; label: string; tone: string }[];
  targetLabel: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "felix",
    name: "Felix",
    email: "felix@trisakti.ac.id",
    role: "MAHASISWA",
    nimNidn: "065002300016",
    prodi: "Teknik Informatika",
    roleTitle: "KARTU TANDA MAHASISWA DIGITAL",
    badge: "Mahasiswa / Peserta",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    cardClass: "border-blue-200/90 hover:border-blue-500 hover:shadow-[0_12px_30px_-8px_rgba(37,99,235,0.22)]",
    headerGradient: "from-blue-600 via-indigo-600 to-blue-700",
    avatarClass: "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-blue-500/30",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
    accentGlow: "bg-blue-500/10",
    scenario: "Sudah Check-In di gerbang acara & lulus Pre-Test (80). Siap langsung uji kerjakan Post-Test & klaim Sertifikat SKPI!",
    targetRoute: "/events/seminar-ai-cloud-native-2026/test",
    statusBadges: [
      { icon: CheckCircle2, label: "Check-In Gerbang: Hadir", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { icon: Award, label: "Pre-Test: 80/100 Lulus", tone: "bg-blue-50 text-blue-700 border-blue-200" },
      { icon: Sparkles, label: "Post-Test & E-Sertifikat Siap", tone: "bg-amber-50 text-amber-700 border-amber-200" }
    ],
    targetLabel: "Uji Post-Test & Sertifikat"
  },
  {
    id: "pani",
    name: "Pani",
    email: "pani@trisakti.ac.id",
    role: "PANITIA",
    nimNidn: "065002100005",
    prodi: "Teknik Informatika",
    roleTitle: "CREW PASS & FIELD SCANNER",
    badge: "Panitia Lapangan",
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    cardClass: "border-emerald-200/90 hover:border-emerald-500 hover:shadow-[0_12px_30px_-8px_rgba(16,185,129,0.22)]",
    headerGradient: "from-emerald-600 via-teal-600 to-emerald-700",
    avatarClass: "bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-emerald-500/30",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
    accentGlow: "bg-emerald-500/10",
    scenario: "Pusat kendali presensi gerbang: scanner kamera QR real-time, filter acara aktif, & sakelar buka/tutup gembok soal ujian.",
    targetRoute: "/panitia/scanner",
    statusBadges: [
      { icon: ScanLine, label: "Scanner Kamera QR Aktif", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { icon: Radio, label: "Live Presensi Pintu Gerbang", tone: "bg-teal-50 text-teal-700 border-teal-200" },
      { icon: KeyRound, label: "Buka/Tutup Gembok Soal", tone: "bg-amber-50 text-amber-700 border-amber-200" }
    ],
    targetLabel: "Buka Scanner Kamera"
  },
  {
    id: "admin",
    name: "Admin",
    email: "admin@trisakti.ac.id",
    role: "ADMIN",
    nimNidn: "198504122010121001",
    prodi: "Teknik Informatika",
    roleTitle: "DEKANAT EXECUTIVE CREDENTIAL",
    badge: "Administrator Fakultas",
    badgeClass: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    cardClass: "border-purple-200/90 hover:border-purple-500 hover:shadow-[0_12px_30px_-8px_rgba(147,51,234,0.22)]",
    headerGradient: "from-purple-700 via-indigo-700 to-purple-800",
    avatarClass: "bg-gradient-to-tr from-purple-700 to-pink-500 text-white shadow-purple-500/30",
    buttonClass: "bg-purple-700 hover:bg-purple-800 text-white shadow-purple-500/20",
    accentGlow: "bg-purple-500/10",
    scenario: "Otoritas tertinggi fakultas: manajemen poster & kuota, upload background sertifikat PDF, broadcast peserta, & ekspor BAAK.",
    targetRoute: "/admin",
    statusBadges: [
      { icon: Building2, label: "Konsol Dekanat FTI", tone: "bg-purple-50 text-purple-700 border-purple-200" },
      { icon: FileSpreadsheet, label: "Ekspor Rekap CSV BAAK", tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      { icon: Sparkles, label: "Template Sertifikat & Broadcast", tone: "bg-pink-50 text-pink-700 border-pink-200" }
    ],
    targetLabel: "Buka Konsol Dekanat"
  }
];

const SHOWCASE_POSTERS = [
  {
    id: 1,
    title: "Seminar Nasional: Rekayasa AI & Cloud Native FTI 2026",
    category: "SEMINAR",
    categoryTone: "bg-blue-600 text-white",
    skpi: "15 Poin SKPI",
    mode: "HYBRID",
    venue: "Auditorium Gedung Hery Hartanto Lt. 8",
    date: "19 Okt 2026",
    src: "/posters/seminar-ai-cloud.jpg"
  },
  {
    id: 2,
    title: "Hands-on Workshop: Modern Web Architecture & Cloud 2026",
    category: "WORKSHOP",
    categoryTone: "bg-emerald-600 text-white",
    skpi: "25 Poin SKPI",
    mode: "HYBRID",
    venue: "Lab Riset Informatika & Cloud Trisakti",
    date: "22 Okt 2026",
    src: "/posters/workshop-web-cloud.jpg"
  },
  {
    id: 3,
    title: "Kompetisi Nasional: FTI AI & Informatics Hackathon 2026",
    category: "LOMBA",
    categoryTone: "bg-purple-600 text-white",
    skpi: "35 Poin SKPI",
    mode: "OFFLINE",
    venue: "Gedung FTI & Exhibition Hall Trisakti",
    date: "28 Okt 2026",
    src: "/posters/hackathon-fti.jpg"
  }
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("felix@trisakti.ac.id");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeLoggingInId, setActiveLoggingInId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<typeof SHOWCASE_POSTERS[0] | null>(null);

  // Instant 1-Click Fast Login
  const handleInstantLogin = async (account: DemoAccount) => {
    setActiveLoggingInId(account.id);
    setLoading(true);
    setErrorMsg("");

    try {
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: "Password123!",
      });

      if (error) {
        setErrorMsg(error.message || "Gagal masuk dengan akun demo.");
        setLoading(false);
        setActiveLoggingInId(null);
        return;
      }

      if (data?.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("user_role", account.role);
          window.dispatchEvent(new Event("role_changed"));
          window.location.href = account.targetRoute;
        } else {
          router.push(account.targetRoute);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error?.message || "Terjadi kendala koneksi.");
      setLoading(false);
      setActiveLoggingInId(null);
    }
  };

  // Form submit manual login
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMsg(error.message || "Email atau kata sandi tidak valid.");
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", data.user.id)
          .single();

        const userRole = (profile?.role as string) || "MAHASISWA";
        if (typeof window !== "undefined") {
          localStorage.setItem("user_role", userRole);
          window.dispatchEvent(new Event("role_changed"));

          const target = userRole === "ADMIN" ? "/admin" : userRole === "PANITIA" ? "/panitia/scanner" : "/events";
          window.location.href = target;
        } else {
          router.push(userRole === "ADMIN" ? "/admin" : userRole === "PANITIA" ? "/panitia/scanner" : "/events");
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error?.message || "Terjadi kendala koneksi.");
      setLoading(false);
    }
  };

  return (
    <AppShell showDesktopNav={false} showBottomNav={false}>
      {/* Top Academic Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shadow-2xs">
            <Image
              src="/logo.png"
              alt="Logo Universitas Trisakti"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-slate-900 leading-tight">
                FTI Event!t
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                Resmi
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium leading-tight block">
              Fakultas Teknologi Industri Universitas Trisakti
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem Live</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 py-6 md:py-10 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Dynamic Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-slate-800">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>PORTAL TIKET, PRESENSI &amp; SERTIFIKASI MAHASISWA</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Satu Akses Digital untuk Seluruh Kegiatan Resmi FTI
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Cukup klik salah satu akun di bawah untuk langsung mencoba alur nyata: pendaftaran tiket, verifikasi scanner kamera panitia, hingga ujian post-test dan terbitnya E-Sertifikat SKPI.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <QrCode className="w-3.5 h-3.5 text-cyan-400" /> Tiket QR Dinamis
              </span>
              <span className="flex items-center gap-1.5 font-semibold bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <ScanLine className="w-3.5 h-3.5 text-emerald-400" /> Scanner Kamera Panitia
              </span>
              <span className="flex items-center gap-1.5 font-semibold bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <Award className="w-3.5 h-3.5 text-amber-400" /> E-Sertifikat &amp; Poin SKPI
              </span>
            </div>
          </div>
        </section>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs shadow-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Gagal Masuk</span>
              <span className="font-medium">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* SECTION 1: 1-Click Role Switcher (Digital Identity Passes) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Pilih Kartu Akses Instan (1-Klik Masuk)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Ganti peran kapan saja untuk menguji alur kerja mahasiswa, panitia, maupun dekanat.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 self-start sm:self-auto font-medium">
              <span>Kata Sandi Bersama:</span>
              <code className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded shadow-2xs">
                Password123!
              </code>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isLoggingIn = activeLoggingInId === acc.id;

              return (
                <div
                  key={acc.id}
                  className={`bg-white rounded-3xl border-2 ${acc.cardClass} p-5 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden shadow-xs hover:-translate-y-1`}
                >
                  {/* Decorative Header Strip */}
                  <div className={`h-2.5 w-full bg-gradient-to-r ${acc.headerGradient} absolute top-0 left-0`} />

                  <div className="pt-2 space-y-3.5">
                    {/* Top Credential Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl ${acc.avatarClass} flex items-center justify-center font-black text-lg shadow-md`}>
                          {acc.role === "MAHASISWA" ? (
                            <GraduationCap className="w-6 h-6" />
                          ) : acc.role === "PANITIA" ? (
                            <ShieldCheck className="w-6 h-6" />
                          ) : (
                            <Building2 className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                              {acc.name}
                            </h3>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${acc.badgeClass}`}>
                              {acc.badge}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {acc.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Smart Badge Chip & Meta Details */}
                    <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200/60 pb-1.5">
                        <span className="font-bold tracking-wider uppercase text-[10px] text-slate-400">
                          {acc.roleTitle}
                        </span>
                        <span className="font-mono font-bold text-slate-800">{acc.nimNidn}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Program Studi:</span>
                        <span className="font-bold text-blue-700">{acc.prodi}</span>
                      </div>
                    </div>

                    {/* Status Highlights */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-0.5">
                        Status &amp; Fitur Tersedia
                      </span>
                      <div className="space-y-1">
                        {acc.statusBadges.map((badge, idx) => {
                          const IconComp = badge.icon;
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold ${badge.tone}`}
                            >
                              <IconComp className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{badge.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Scenario Description */}
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/60">
                      {acc.scenario}
                    </p>
                  </div>

                  {/* 1-Click Action Button */}
                  <div className="pt-4 mt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleInstantLogin(acc)}
                      disabled={loading}
                      className={`w-full py-3 px-4 rounded-2xl ${acc.buttonClass} font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg disabled:opacity-60`}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mempersiapkan Sesi...</span>
                        </>
                      ) : (
                        <>
                          <span>Masuk sebagai {acc.name}</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Realistic Poster Showcase Gallery */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Ticket className="w-3 h-3" />
                <span>Showcase Kegiatan Kampus</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Mockup Poster Resmi Kegiatan FTI Trisakti
              </h2>
              <p className="text-xs text-slate-500">
                Lihat visual poster acara yang siap diikuti sivitas akademik. Klik poster untuk melihat resolusi penuh.
              </p>
            </div>
            <Link
              href="/events"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Buka Katalog Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {SHOWCASE_POSTERS.map((poster) => (
              <div
                key={poster.id}
                onClick={() => setSelectedPoster(poster)}
                className="group cursor-pointer rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                {/* Poster Image Container */}
                <div className="relative aspect-[3/4] w-full bg-slate-950 overflow-hidden">
                  <Image
                    src={poster.src}
                    alt={poster.title}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Glassmorphic Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md ${poster.categoryTone}`}>
                      {poster.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>{poster.skpi}</span>
                    </span>
                  </div>

                  {/* Expand Hint on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Perbesar Poster</span>
                    </span>
                  </div>

                  {/* Bottom Text in Image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[11px] font-semibold text-cyan-300 block mb-0.5">
                      {poster.date} • Mode {poster.mode}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold line-clamp-2 leading-tight">
                      {poster.title}
                    </h4>
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px] truncate mr-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{poster.venue}</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    GRATIS
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modal Lightbox for Poster Preview */}
        {selectedPoster && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedPoster(null)}
          >
            <div 
              className="bg-slate-900 text-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                    {selectedPoster.category} • {selectedPoster.skpi}
                  </span>
                  <h3 className="text-sm font-bold truncate max-w-sm">
                    {selectedPoster.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPoster(null)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-[3/4] w-full flex-1 bg-black">
                <Image
                  src={selectedPoster.src}
                  alt={selectedPoster.title}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <span>{selectedPoster.venue}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPoster(null);
                    const felix = DEMO_ACCOUNTS.find(a => a.id === "felix");
                    if (felix) handleInstantLogin(felix);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <span>Daftar / Klaim Tiket</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Manual Login Form */}
        <div className="pt-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {showManualForm ? "Tutup Formulir Manual" : "Atau Masuk dengan Email & Kata Sandi Manual"}
            </span>
          </button>

          {showManualForm && (
            <div className="mt-3 bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-sm space-y-4">
              <form className="space-y-4" onSubmit={handleFormLogin}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Akun Sivitas Trisakti
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@trisakti.ac.id"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs text-slate-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs text-slate-900 transition-colors shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Akun FTI</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

      </main>
    </AppShell>
  );
}
