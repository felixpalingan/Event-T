"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Award, 
  Plus, 
  FileSpreadsheet, 
  ScanLine, 
  ChevronRight,
  ShieldAlert
} from "lucide-react";

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalEvents: 4,
    totalRegistrations: 284,
    totalCheckedIn: 212,
    totalCertificates: 198,
  });

  return (
    <AppShell>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4 text-blue-700" />
              <span>Konsol Admin FTI</span>
            </h1>
            <span className="text-[10px] text-blue-700 font-semibold block">
              Pusat Manajemen Kegiatan Kampus
            </span>
          </div>
        </div>

        <Link
          href="/admin/events/new"
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white flex items-center gap-1 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Acara</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Metric Cards (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Acara
              </span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 block">
              {stats.totalEvents}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              3 Aktif • 1 Arsip
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pendaftar
              </span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 block">
              {stats.totalRegistrations}
            </span>
            <span className="text-[11px] text-indigo-700 font-medium">
              Mahasiswa FTI
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kehadiran
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 block">
              {stats.totalCheckedIn}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              Tervalidasi di Pintu
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                E-Sertifikat
              </span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 block">
              {stats.totalCertificates}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">
              Lulus Post-Test
            </span>
          </div>
        </div>

        {/* Administration Navigation Quick Actions */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1">
            Menu Tata Kelola
          </span>

          <Link
            href="/admin/events"
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-98 transition-all flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Kelola Katalog Acara</h4>
                <p className="text-[11px] text-slate-500">Tambah acara baru, atur kuota, dan arsip</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/admin/reports"
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 active:scale-98 transition-all flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Laporan &amp; Ekspor CSV</h4>
                <p className="text-[11px] text-slate-500">Unduh data kehadiran &amp; skor mahasiswa untuk BAAK</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/scanner"
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 active:scale-98 transition-all flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
                <ScanLine className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Uji Coba Scanner Pintu</h4>
                <p className="text-[11px] text-slate-500">Supervisi pemindaian tiket kamera panitia</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
