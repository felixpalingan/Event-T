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
      {/* Page Header (Mobile: sticky, Desktop: clean spacious card) */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Konsol Tata Kelola Administrator FTI</span>
            </h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Pusat Manajemen Kegiatan Kampus &amp; Pelaporan BAAK
            </span>
          </div>
        </div>

        <Link
          href="/admin/events/new"
          className="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Acara Baru</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 space-y-5 md:space-y-6">
        {/* Metric Cards (2x2 on mobile, 4 in a row on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Acara
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 block">
              {stats.totalEvents}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              3 Aktif • 1 Arsip
            </span>
          </div>

          <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pendaftar
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 block">
              {stats.totalRegistrations}
            </span>
            <span className="text-[11px] text-indigo-700 font-medium">
              Mahasiswa FTI
            </span>
          </div>

          <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kehadiran
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 block">
              {stats.totalCheckedIn}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              Tervalidasi di Pintu
            </span>
          </div>

          <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                E-Sertifikat
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 block">
              {stats.totalCertificates}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">
              Lulus Post-Test
            </span>
          </div>
        </div>

        {/* Administration Navigation Quick Actions (1-col on mobile, 3-col on desktop) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
              Menu Tata Kelola Administrator
            </span>
            <span className="text-xs text-slate-500">
              Akses Cepat Pengelolaan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <Link
              href="/admin/events"
              className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm active:scale-98 transition-all flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">Kelola Katalog Acara</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tambah acara baru, atur kuota, dan arsip</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </Link>

            <Link
              href="/admin/reports"
              className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm active:scale-98 transition-all flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">Laporan &amp; Ekspor CSV</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Unduh data kehadiran &amp; skor mahasiswa untuk BAAK</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </Link>

            <Link
              href="/panitia/scanner"
              className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm active:scale-98 transition-all flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">Uji Coba Scanner Pintu</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Supervisi pemindaian tiket kamera panitia</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
