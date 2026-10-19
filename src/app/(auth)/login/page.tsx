"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  ChevronRight,
  GraduationCap,
  Building2,
  ScanLine,
  CheckCircle2,
  Award,
  Sparkles,
  Radio,
  KeyRound,
  FileSpreadsheet
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
  scenario: string;
  targetRoute: string;
  statusBadges: { icon: typeof CheckCircle2; label: string; tone: string }[];
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "felix",
    name: "Felix",
    email: "felix@trisakti.ac.id",
    role: "MAHASISWA",
    nimNidn: "065002300016",
    prodi: "Teknik Informatika",
    roleTitle: "KARTU TANDA MAHASISWA",
    badge: "Mahasiswa",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    cardClass: "border-blue-200 hover:border-blue-500 hover:shadow-[0_12px_30px_-8px_rgba(37,99,235,0.25)]",
    headerGradient: "from-blue-600 via-indigo-600 to-blue-700",
    avatarClass: "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/30",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20",
    scenario: "Sudah Check-In gerbang & lulus Pre-Test (80). Siap langsung uji kerjakan Post-Test & klaim Sertifikat SKPI!",
    targetRoute: "/events/seminar-ai-cloud-native-2026/test",
    statusBadges: [
      { icon: CheckCircle2, label: "Check-In: Sudah Hadir", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { icon: Award, label: "Pre-Test: 80 / 100", tone: "bg-blue-50 text-blue-700 border-blue-200" },
      { icon: Sparkles, label: "Post-Test & E-Sertifikat Siap", tone: "bg-amber-50 text-amber-700 border-amber-200" }
    ]
  },
  {
    id: "pani",
    name: "Pani",
    email: "pani@trisakti.ac.id",
    role: "PANITIA",
    nimNidn: "065002100005",
    prodi: "Teknik Informatika",
    roleTitle: "PASS PETUGAS LAPANGAN",
    badge: "Panitia",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    cardClass: "border-emerald-200 hover:border-emerald-500 hover:shadow-[0_12px_30px_-8px_rgba(16,185,129,0.25)]",
    headerGradient: "from-emerald-600 via-teal-600 to-emerald-700",
    avatarClass: "bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md shadow-emerald-500/30",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20",
    scenario: "Akses scanner kamera presensi pintu gerbang, pemilih acara aktif, & sakelar kontrol gembok post-test.",
    targetRoute: "/panitia/scanner",
    statusBadges: [
      { icon: ScanLine, label: "Scanner Kamera QR Aktif", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { icon: Radio, label: "Live Presensi Pintu Gerbang", tone: "bg-teal-50 text-teal-700 border-teal-200" },
      { icon: KeyRound, label: "Buka/Tutup Gembok Soal", tone: "bg-amber-50 text-amber-700 border-amber-200" }
    ]
  },
  {
    id: "admin",
    name: "Admin",
    email: "admin@trisakti.ac.id",
    role: "ADMIN",
    nimNidn: "198504122010121001",
    prodi: "Teknik Informatika",
    roleTitle: "KREDENSIAL DEKANAT",
    badge: "Administrator",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    cardClass: "border-purple-200 hover:border-purple-500 hover:shadow-[0_12px_30px_-8px_rgba(147,51,234,0.25)]",
    headerGradient: "from-purple-700 via-indigo-700 to-purple-800",
    avatarClass: "bg-gradient-to-tr from-purple-700 to-pink-500 text-white shadow-md shadow-purple-500/30",
    buttonClass: "bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-500/20",
    scenario: "Konsol Admin Dekanat: edit event, upload background template sertifikat, ekspor CSV BAAK, & broadcast notifikasi.",
    targetRoute: "/admin",
    statusBadges: [
      { icon: Building2, label: "Konsol Dekanat FTI", tone: "bg-purple-50 text-purple-700 border-purple-200" },
      { icon: FileSpreadsheet, label: "Ekspor Rekap CSV BAAK", tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      { icon: Sparkles, label: "Template Sertifikat & Broadcast", tone: "bg-pink-50 text-pink-700 border-pink-200" }
    ]
  }
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [activeLoggingInId, setActiveLoggingInId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

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

  return (
    <AppShell showDesktopNav={false} showBottomNav={false}>
      {/* Centered Main Area */}
      <main className="min-h-[90vh] flex flex-col justify-center items-center px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Academic Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center mx-auto border border-slate-200 shadow-md">
            <Image
              src="/logo.png"
              alt="Logo Universitas Trisakti"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>FTI Event!t — Universitas Trisakti</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pilih Profil Masuk
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
              Klik salah satu akun untuk langsung masuk (1-klik) dan menjelajahi fitur sesuai peran Anda.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs shadow-xs max-w-md w-full">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Gagal Masuk</span>
              <span className="font-medium">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* 3 Digital Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 w-full">
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
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${acc.avatarClass} flex items-center justify-center font-black text-lg`}>
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

                  {/* Metadata Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200/60 pb-1.5">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                        {acc.roleTitle}
                      </span>
                      <span className="font-mono font-bold text-slate-800">{acc.nimNidn}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-0.5">
                      <span className="text-slate-500 font-medium">Program Studi:</span>
                      <span className="font-bold text-blue-700">{acc.prodi}</span>
                    </div>
                  </div>

                  {/* Status Pills */}
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

                  {/* Scenario Note */}
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/60">
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

        {/* Password Hint */}
        <div className="text-center pt-2">
          <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            Kata Sandi Bersama: <code className="font-mono font-bold text-slate-800">Password123!</code>
          </span>
        </div>

      </main>
    </AppShell>
  );
}
