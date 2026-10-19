"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Lock, Mail, AlertCircle, Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMsg(error.message || "Email atau kata sandi tidak valid.");
        setLoading(false);
        return;
      }

      if (data.user) {
        router.push("/events");
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
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-slate-400 hover:text-white p-1 -ml-1 active:scale-95 transition-transform flex items-center gap-1 text-xs">
          <ArrowLeft className="w-5 h-5" />
          <span>Beranda</span>
        </Link>
        <span className="text-xs font-semibold text-slate-400">Portal Masuk</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 py-8 flex flex-col justify-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border border-slate-200 mb-3">
            <Image
              src="/logo.png"
              alt="Logo Universitas Trisakti"
              width={42}
              height={42}
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            FTI Event!t
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fakultas Teknologi Informasi Universitas Trisakti
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-2.5 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Kampus / Terdaftar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mahasiswa@trisakti.ac.id"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-base sm:text-sm focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-base sm:text-sm focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Akun</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Belum memiliki akun?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4">
              Daftar Mahasiswa
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
