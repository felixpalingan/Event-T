"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  UserPlus
} from "lucide-react";

const PRODI_OPTIONS = [
  "Teknik Informatika",
  "Sistem Informasi",
  "Teknik Komputer",
  "Magister Teknik Informatika",
  "Fakultas Lain / Umum",
];

const ANGKATAN_OPTIONS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [prodi, setProdi] = useState(PRODI_OPTIONS[0]);
  const [angkatan, setAngkatan] = useState(2024);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            nim_nidn: nim.trim().toUpperCase(),
            phone_number: phoneNumber.trim(),
            prodi: prodi,
            angkatan: Number(angkatan),
            role: "MAHASISWA",
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || "Gagal melakukan registrasi.");
        setLoading(false);
        return;
      }

      if (data.user) {
        if (!data.session) {
          try {
            await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password,
            });
          } catch {
            // Continue
          }
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("user_role", "MAHASISWA");
          window.dispatchEvent(new Event("role_changed"));
        }

        setSuccessMsg(true);
        setTimeout(() => {
          router.push("/events");
          router.refresh();
        }, 1500);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error?.message || "Terjadi kesalahan koneksi server.");
      setLoading(false);
    }
  };

  return (
    <AppShell showDesktopNav={false} showBottomNav={false}>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform flex items-center gap-1 text-xs">
          <ArrowLeft className="w-5 h-5" />
          <span>Beranda</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">Pendaftaran Akun</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-xs border border-slate-200 shrink-0">
            <Image
              src="/logo.png"
              alt="Logo Universitas Trisakti"
              width={34}
              height={34}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Registrasi Mahasiswa
            </h1>
            <p className="text-[11px] text-slate-500">FTI Event!t — Akun Kegiatan Kampus</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Registrasi berhasil! Mengalihkan ke katalog event...</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleRegister}>
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Sesuai KTM"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:bg-white focus:border-blue-600 outline-none transition-colors"
                />
              </div>
            </div>

            {/* NIM & Angkatan */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  NIM / NIDN
                </label>
                <input
                  type="text"
                  required
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="065002100012"
                  className="block w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:bg-white focus:border-blue-600 outline-none transition-colors uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Angkatan
                </label>
                <select
                  value={angkatan}
                  onChange={(e) => setAngkatan(Number(e.target.value))}
                  className="block w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:bg-white focus:border-blue-600 outline-none transition-colors"
                >
                  {ANGKATAN_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Program Studi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Program Studi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <select
                  value={prodi}
                  onChange={(e) => setProdi(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:bg-white focus:border-blue-600 outline-none transition-colors"
                >
                  {PRODI_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* No. WhatsApp & Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                No. WhatsApp (Aktif)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="081234567890"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:bg-white focus:border-blue-600 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email
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
                  placeholder="mahasiswa@std.trisakti.ac.id"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:bg-white focus:border-blue-600 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:bg-white focus:border-blue-600 outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Ulangi Sandi
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:bg-white focus:border-blue-600 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || successMsg}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Selesaikan Pendaftaran</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-4">
              Masuk di sini
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
