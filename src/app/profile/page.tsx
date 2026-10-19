"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  User, 
  LogOut, 
  ArrowLeft, 
  ChevronRight,
  ScanLine,
  LayoutDashboard,
  Shield,
  FileSpreadsheet,
  QrCode,
  Award
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  nim_nidn: string;
  email: string;
  prodi: string;
  angkatan: number;
  phone_number: string;
  role: "MAHASISWA" | "PANITIA" | "ADMIN";
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_role");
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight">Profil Pengguna</h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Identitas Sivitas Akademika Universitas Trisakti
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 space-y-5 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 animate-pulse">
            <div className="h-6 w-1/3 bg-slate-100 rounded"></div>
            <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
            <div className="h-16 bg-slate-100 rounded-xl"></div>
          </div>
        ) : profile ? (
          <>
            {/* User Identity Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-start gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 font-bold text-lg">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 truncate">
                      {profile.name}
                    </h2>
                    {profile.role === "ADMIN" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                        ADMIN
                      </span>
                    )}
                    {profile.role === "PANITIA" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        PANITIA
                      </span>
                    )}
                    {profile.role === "MAHASISWA" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        MAHASISWA
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-blue-700 font-semibold mt-0.5">
                    NIM / NIDN: {profile.nim_nidn}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {profile.prodi} • Angkatan {profile.angkatan}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Email Akun</span>
                  <span className="truncate block font-medium text-slate-700">{profile.email}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">WhatsApp</span>
                  <span className="font-medium text-slate-700">{profile.phone_number || "-"}</span>
                </div>
              </div>
            </div>

            {/* Quick Access Portals based on current verified role */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1">
                Area Kerja Hak Akses Anda
              </span>

              {profile.role === "ADMIN" && (
                <div className="space-y-2">
                  <Link
                    href="/admin"
                    className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 hover:bg-purple-50 active:scale-98 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Konsol Admin Fakultas</h4>
                        <p className="text-[11px] text-purple-700">Kelola event kampus, kuota, dan jadwal</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/admin/reports"
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Rekapitulasi &amp; Ekspor CSV</h4>
                        <p className="text-[11px] text-slate-500">Laporan presensi dan nilai post-test seluruh peserta</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              )}

              {profile.role === "PANITIA" && (
                <div className="space-y-2">
                  <Link
                    href="/panitia/scanner"
                    className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-50 active:scale-98 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                        <ScanLine className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Scanner Kamera QR Gate</h4>
                        <p className="text-[11px] text-emerald-700">Validasi presensi tiket peserta di pintu aula</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/panitia/attendees"
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Daftar Kehadiran Peserta</h4>
                        <p className="text-[11px] text-slate-500">Presensi manual dan statistik masuk ruangan</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              )}

              {profile.role === "MAHASISWA" && (
                <div className="space-y-2">
                  <Link
                    href="/tickets"
                    className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 hover:bg-blue-50 active:scale-98 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Tiket &amp; Boarding Pass QR</h4>
                        <p className="text-[11px] text-blue-700">Buka tiket digital untuk presensi pintu masuk</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/certificates"
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Klaim E-Sertifikat</h4>
                        <p className="text-[11px] text-slate-500">Unduh PDF sertifikat kelulusan kegiatan</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </AppShell>
  );
}
