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
  Shield, 
  ScanLine, 
  User, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  AlertTriangle,
  QrCode
} from "lucide-react";

interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: "MAHASISWA" | "PANITIA" | "ADMIN";
  nimNidn: string;
  prodi: string;
  badge: string;
  badgeColor: string;
  cardBorder: string;
  cardBg: string;
  iconBg: string;
  iconColor: string;
  scenario: string;
  targetRoute: string;
  features: string[];
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "felix",
    name: "Felix",
    email: "felix@trisakti.ac.id",
    role: "MAHASISWA",
    nimNidn: "065002300016",
    prodi: "Teknik Informatika",
    badge: "Peserta Utama",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    cardBorder: "border-blue-200 hover:border-blue-400 focus:ring-blue-400",
    cardBg: "bg-gradient-to-br from-white to-blue-50/40",
    iconBg: "bg-blue-600 text-white",
    iconColor: "text-blue-600",
    scenario: "Sudah Check-In gerbang & lulus Pre-Test (80). Siap langsung uji kerjakan Post-Test & klaim Sertifikat SKPI!",
    targetRoute: "/events/seminar-ai-cloud-native-2026/test",
    features: ["Check-In: Sudah Hadir", "Pre-Test: 80 / 100", "Post-Test & E-Sertifikat Siap"]
  },
  {
    id: "dewanto",
    name: "Dewanto",
    email: "dewanto@trisakti.ac.id",
    role: "PANITIA",
    nimNidn: "065002100005",
    prodi: "Teknik Informatika",
    badge: "Panitia Lapangan",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    cardBorder: "border-emerald-200 hover:border-emerald-400 focus:ring-emerald-400",
    cardBg: "bg-gradient-to-br from-white to-emerald-50/40",
    iconBg: "bg-emerald-600 text-white",
    iconColor: "text-emerald-600",
    scenario: "Akses scanner kamera presensi pintu, pemilih acara aktif, & sakelar kontrol gembok post-test.",
    targetRoute: "/panitia/scanner",
    features: ["Scanner Kamera QR", "Pemilih Acara Aktif", "Buka/Tutup Gembok Soal"]
  },
  {
    id: "bayu",
    name: "Bayu",
    email: "bayu@trisakti.ac.id",
    role: "ADMIN",
    nimNidn: "198504122010121001",
    prodi: "Teknik Informatika",
    badge: "Administrator Fakultas",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    cardBorder: "border-purple-200 hover:border-purple-400 focus:ring-purple-400",
    cardBg: "bg-gradient-to-br from-white to-purple-50/40",
    iconBg: "bg-purple-700 text-white",
    iconColor: "text-purple-600",
    scenario: "Konsol Admin Dekanat: edit event, upload background template sertifikat, ekspor CSV BAAK, & broadcast pengumuman.",
    targetRoute: "/admin",
    features: ["Edit Event & Template PDF", "Ekspor CSV Data BAAK", "Broadcast Notifikasi Peserta"]
  },
  {
    id: "rayyan",
    name: "Rayyan",
    email: "rayyan@trisakti.ac.id",
    role: "MAHASISWA",
    nimNidn: "065002300042",
    prodi: "Sistem Informasi",
    badge: "Uji Scan Gerbang",
    badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
    cardBorder: "border-sky-200 hover:border-sky-400 focus:ring-sky-400",
    cardBg: "bg-gradient-to-br from-white to-sky-50/40",
    iconBg: "bg-sky-600 text-white",
    iconColor: "text-sky-600",
    scenario: "Terdaftar Seminar AI, status belum check-in. Buka tiket digital ini untuk di-scan oleh Panitia Dewanto!",
    targetRoute: "/tickets",
    features: ["Tiket Seminar AI Siap", "Status: Belum Check-In", "Uji Presensi Pintu Masuk"]
  },
  {
    id: "bambang",
    name: "Bambang",
    email: "bambang@trisakti.ac.id",
    role: "MAHASISWA",
    nimNidn: "064002300018",
    prodi: "Teknik Industri",
    badge: "Uji Tolak Beda Acara",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    cardBorder: "border-amber-200 hover:border-amber-400 focus:ring-amber-400",
    cardBg: "bg-gradient-to-br from-white to-amber-50/40",
    iconBg: "bg-amber-600 text-white",
    iconColor: "text-amber-600",
    scenario: "Tiket terdaftar di Workshop Next.js. Scan tiket ini saat Scanner di Acara AI untuk uji alert merah tolak tiket!",
    targetRoute: "/tickets",
    features: ["Tiket Workshop Next.js", "Acara Berbeda", "Uji Alert WRONG_EVENT"]
  }
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("felix@trisakti.ac.id");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [activeLoggingInId, setActiveLoggingInId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);

  // Instant 1-Click Fast Login
  const handleInstantLogin = async (account: DemoAccount) => {
    setActiveLoggingInId(account.id);
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Sign out any current stale session first
      await supabase.auth.signOut();

      // 2. Sign in as selected demo account
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
        }

        router.push(account.targetRoute);
        router.refresh();
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
        }

        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "PANITIA") {
          router.push("/panitia/scanner");
        } else {
          router.push("/events");
        }
        router.refresh();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error?.message || "Terjadi kendala koneksi.");
      setLoading(false);
    }
  };

  return (
    <AppShell showBottomNav={false}>
      {/* Top Academic Bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shadow-2xs">
            <Image
              src="/logo.png"
              alt="Logo Universitas Trisakti"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div>
            <span className="block font-extrabold text-xs tracking-tight text-slate-900 leading-tight">
              FTI Event!t
            </span>
            <span className="block text-[10px] text-slate-500 font-medium leading-tight">
              Universitas Trisakti
            </span>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
          Demo Showcase Mode
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-6 md:py-10 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Academic Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pilih Akun Cepat &amp; Uji Coba Fitur</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Portal Masuk Terpadu FTI Event!t
          </h1>
          <p className="text-xs md:text-sm text-slate-600 max-w-xl mx-auto">
            Klik salah satu akun demo di bawah ini untuk langsung masuk (1-klik) dan menjelajahi fitur sesuai peran sivitas akademik Fakultas Teknologi Industri.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* 1-Click Fast Demo Accounts Switcher Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Daftar Akun Demo Resmi FTI
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Kata Sandi Bersama: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">Password123!</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {DEMO_ACCOUNTS.map((acc) => {
              const isLoggingIn = activeLoggingInId === acc.id;

              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleInstantLogin(acc)}
                  disabled={loading}
                  className={`text-left p-4 rounded-2xl border ${acc.cardBorder} ${acc.cardBg} transition-all duration-200 hover:shadow-md active:scale-[0.98] flex flex-col justify-between relative overflow-hidden group disabled:opacity-60 shadow-2xs`}
                >
                  {/* Top Bar with Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl ${acc.iconBg} flex items-center justify-center font-bold text-sm shadow-xs`}>
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                              {acc.name}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${acc.badgeColor}`}>
                              {acc.badge}
                            </span>
                          </div>
                          <span className="block text-[11px] font-semibold text-slate-500">
                            {acc.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Academic Metadata */}
                    <div className="text-[11px] bg-white/80 border border-slate-200/80 rounded-xl p-2.5 space-y-1 mb-2.5">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400 font-medium">NIM / NIDN:</span>
                        <span className="font-mono font-bold text-slate-800">{acc.nimNidn}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400 font-medium">Program Studi:</span>
                        <span className="font-semibold text-blue-700">{acc.prodi}</span>
                      </div>
                    </div>

                    {/* Scenario Highlight */}
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                      {acc.scenario}
                    </p>
                  </div>

                  {/* Feature Tags & Action Button */}
                  <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Masuk Akun...</span>
                        </>
                      ) : (
                        <>
                          <span>Masuk sebagai {acc.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      1-Klik
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Collapsible Manual Form Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full py-2.5 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {showManualForm ? "Tutup Formulir Manual" : "Atau Masuk dengan Email & Kata Sandi Manual"}
            </span>
          </button>

          {showManualForm && (
            <div className="mt-3 bg-white border border-slate-200 p-5 rounded-3xl shadow-xs max-w-md mx-auto">
              <form className="space-y-4" onSubmit={handleFormLogin}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Akun (@trisakti.ac.id)
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
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs text-slate-900 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Akun</span>
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
