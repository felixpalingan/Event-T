"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  User, 
  ShieldCheck, 
  LogOut, 
  ArrowLeft, 
  Check, 
  Lock, 
  Smartphone, 
  Shield, 
  BadgeCheck, 
  ChevronRight,
  ScanLine,
  LayoutDashboard
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
  const [profile, setProfile] = useState<Profile>({
    id: "demo-user",
    name: "Felix Palingan",
    nim_nidn: "065002100012",
    email: "felix@std.trisakti.ac.id",
    prodi: "Teknik Informatika",
    angkatan: 2024,
    phone_number: "081234567890",
    role: "MAHASISWA",
  });
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data as Profile);
        }
      }
    } catch {
      // Fallback demo profile
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = async (newRole: "MAHASISWA" | "PANITIA" | "ADMIN") => {
    setUpdatingRole(true);
    setFeedback(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ role: newRole })
          .eq("id", user.id);
      }

      setProfile((prev) => ({ ...prev, role: newRole }));
      setFeedback(`Peran berhasil diubah menjadi ${newRole}! Tampilan otomatis disesuaikan.`);
      
      // Dispatch storage event to notify other components like BottomNav
      if (typeof window !== "undefined") {
        localStorage.setItem("user_role", newRole);
        window.dispatchEvent(new Event("role_changed"));
      }
    } catch (err) {
      console.error(err);
      setFeedback("Gagal memperbarui peran.");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight">Profil Akun &amp; Otorisasi Peran</h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Manajemen Data Mahasiswa FTI &amp; Pengaturan Hak Akses
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
        {/* User Identity Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 font-bold text-lg">
              {profile.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {profile.name}
                </h2>
                {profile.role === "ADMIN" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    ADMIN
                  </span>
                )}
                {profile.role === "PANITIA" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    PANITIA
                  </span>
                )}
                {profile.role === "MAHASISWA" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    MAHASISWA
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-blue-700 font-semibold mt-0.5">
                NIM: {profile.nim_nidn}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile.prodi} • Angkatan {profile.angkatan}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Email</span>
              <span className="truncate block font-medium text-slate-700">{profile.email}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">WhatsApp</span>
              <span className="font-medium text-slate-700">{profile.phone_number || "-"}</span>
            </div>
          </div>
        </div>

        {/* Quick Access Portals based on current role */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1">
            Area Kerja Anda Saat Ini
          </span>

          {profile.role === "ADMIN" && (
            <Link
              href="/admin"
              className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 hover:bg-blue-50 active:scale-98 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Konsol Admin Fakultas</h4>
                  <p className="text-[11px] text-blue-700">Kelola event, bank soal, dan ekspor CSV</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          )}

          {(profile.role === "PANITIA" || profile.role === "ADMIN") && (
            <Link
              href="/scanner"
              className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-50 active:scale-98 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Scanner Kamera Panitia</h4>
                  <p className="text-[11px] text-emerald-700">Validasi presensi tiket peserta di pintu</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          )}

          {profile.role === "MAHASISWA" && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Anda terdaftar sebagai <strong>Mahasiswa Peserta</strong>. Menu navigasi Anda difokuskan pada eksplorasi event, passbook tiket QR, dan evaluasi post-test untuk mengunduh e-sertifikat.
            </div>
          )}
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            {feedback}
          </div>
        )}

        {/* Live Role Switcher Tool (Interactive Verification) */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Uji Coba Tampilan Peran (RBAC)
            </span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Pengujian Langsung
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Pilih salah satu peran di bawah untuk mengubah tampilan dan hak akses secara instan:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Mahasiswa Option */}
            <button
              onClick={() => handleSwitchRole("MAHASISWA")}
              disabled={updatingRole}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                profile.role === "MAHASISWA"
                  ? "bg-blue-50 border-blue-600 text-blue-900 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold block">Peserta</span>
              <span className="text-[10px] text-slate-500 block leading-tight">Mahasiswa</span>
            </button>

            {/* Panitia Option */}
            <button
              onClick={() => handleSwitchRole("PANITIA")}
              disabled={updatingRole}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                profile.role === "PANITIA"
                  ? "bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ScanLine className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold block">Panitia</span>
              <span className="text-[10px] text-slate-500 block leading-tight">Scanner Pintu</span>
            </button>

            {/* Admin Option */}
            <button
              onClick={() => handleSwitchRole("ADMIN")}
              disabled={updatingRole}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                profile.role === "ADMIN"
                  ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Shield className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-bold block">Admin</span>
              <span className="text-[10px] text-slate-500 block leading-tight">Fakultas / BEM</span>
            </button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
