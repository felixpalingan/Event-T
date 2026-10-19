"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ShieldAlert, ArrowLeft, QrCode, Home } from "lucide-react";
import { Suspense } from "react";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get("required") || "PETUGAS";

  return (
    <main className="flex-1 px-5 py-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 uppercase tracking-wider mb-2">
        Akses Dibatasi
      </span>

      <h1 className="text-xl font-bold text-slate-900 leading-snug">
        Halaman Khusus {requiredRole === "ADMIN" ? "Administrator Fakultas" : "Panitia Acara"}
      </h1>

      <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
        {requiredRole === "ADMIN"
          ? "Halaman ini hanya dapat diakses oleh Administrator / Pimpinan Fakultas untuk pengelolaan acara dan rekapitulasi data."
          : "Halaman ini dikhususkan bagi Panitia Lapangan untuk melakukan pemindaian tiket presensi di pintu masuk aula."}
      </p>

      <div className="mt-8 w-full max-w-xs space-y-2.5">
        <Link
          href="/tickets"
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <QrCode className="w-4 h-4" />
          <span>Buka Tiket Saya (QR Peserta)</span>
        </Link>

        <Link
          href="/"
          className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-700 text-xs font-semibold transition-all border border-slate-200 flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="mt-8 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 max-w-xs">
        Jika Anda adalah panitia atau admin yang bertugas, pastikan akun Anda telah diberikan wewenang di database atau hubungi ketua pelaksana acara.
      </div>
    </main>
  );
}

export default function UnauthorizedPage() {
  return (
    <AppShell showBottomNav={false}>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform flex items-center gap-1 text-xs">
          <ArrowLeft className="w-5 h-5" />
          <span>Beranda</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">Pemberitahuan Wewenang</span>
      </header>

      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memeriksa izin...</div>}>
        <UnauthorizedContent />
      </Suspense>
    </AppShell>
  );
}
