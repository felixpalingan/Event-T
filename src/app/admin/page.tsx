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
  Settings2,
  RefreshCw,
  Clock,
  MapPin,
  Lock,
  Unlock
} from "lucide-react";

interface RecentEvent {
  id: number;
  title: string;
  category: string;
  venue: string;
  quota: number;
  registeredCount: number;
  is_post_test_open: boolean;
  event_start_at: string;
}

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    totalCheckedIn: 0,
    totalCertificates: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Events
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, category, venue, quota, is_archived, is_post_test_open, event_start_at")
        .order("event_start_at", { ascending: false });

      // 2. Fetch Tickets
      const { data: ticketsData } = await supabase
        .from("tickets")
        .select("id, event_id, is_checked_in, status");

      // 3. Fetch Certificates / Scores
      const { data: certsData } = await supabase
        .from("certificates")
        .select("id");

      const allEvents = eventsData || [];
      const allTickets = ticketsData || [];
      const activeEv = allEvents.filter((e) => !e.is_archived);
      const checkedInTickets = allTickets.filter((t) => t.is_checked_in);

      setStats({
        totalEvents: allEvents.length,
        activeEvents: activeEv.length,
        totalRegistrations: allTickets.length,
        totalCheckedIn: checkedInTickets.length,
        totalCertificates: certsData?.length || 0,
      });

      // Map recent events with real ticket counts
      const mappedRecent: RecentEvent[] = allEvents.slice(0, 4).map((e) => {
        const count = allTickets.filter((t) => t.event_id === e.id).length;
        return {
          id: e.id,
          title: e.title,
          category: e.category,
          venue: e.venue,
          quota: e.quota,
          registeredCount: count,
          is_post_test_open: Boolean(e.is_post_test_open),
          event_start_at: e.event_start_at,
        };
      });

      setRecentEvents(mappedRecent);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const attendancePct = stats.totalRegistrations > 0 
    ? Math.round((stats.totalCheckedIn / stats.totalRegistrations) * 100) 
    : 0;

  return (
    <AppShell>
      {/* Page Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden" title="Kembali ke Beranda">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboardData}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
            title="Segarkan Data Real-Time"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <Link
            href="/admin/events/new"
            className="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Acara Baru</span>
          </Link>
        </div>
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
              {loading ? "..." : stats.totalEvents}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {stats.activeEvents} Aktif • {stats.totalEvents - stats.activeEvents} Arsip
            </span>
          </div>

          <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Pendaftar
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 block">
              {loading ? "..." : stats.totalRegistrations}
            </span>
            <span className="text-[11px] text-indigo-700 font-medium">
              Tiket Mahasiswa FTI
            </span>
          </div>

          <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kehadiran Pintu
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 block">
              {loading ? "..." : stats.totalCheckedIn}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {attendancePct}% Presensi Hadir
            </span>
          </div>

          <div className="p-4 md:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                E-Sertifikat Terbit
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 block">
              {loading ? "..." : stats.totalCertificates}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">
              Lulus Evaluasi Post-Test
            </span>
          </div>
        </div>

        {/* Administration Navigation Quick Actions (2x3 on desktop, 1-col on mobile) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
              Menu Tata Kelola Administrator
            </span>
            <span className="text-xs text-slate-500">
              Akses Tugas &amp; Supervisi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <Link
              href="/admin/events"
              className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm active:scale-98 transition-all flex items-center justify-between shadow-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center text-blue-700 font-bold shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">Kelola Katalog Acara</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tambah acara, kuota kursi, jadwal &amp; arsip</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/admin/events/new"
              className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm active:scale-98 transition-all flex items-center justify-between shadow-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">Buat Acara Baru</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Formulir penerbitan agenda langsung ke mahasiswa</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/admin/reports"
              className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm active:scale-98 transition-all flex items-center justify-between shadow-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center text-emerald-700 font-bold shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">Laporan &amp; Ekspor CSV</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Unduh data kehadiran &amp; skor mahasiswa untuk BAAK</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/panitia/control"
              className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-sm active:scale-98 transition-all flex items-center justify-between shadow-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center text-amber-700 font-bold shrink-0">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">Kontrol Sesi &amp; Gembok Test</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Buka / kunci akses ujian evaluasi sertifikat</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/panitia/attendees"
              className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-sm active:scale-98 transition-all flex items-center justify-between shadow-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center text-purple-700 font-bold shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">Checklist Presensi Hadir</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Verifikasi kehadiran manual &amp; pencarian NIM</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/panitia/scanner"
              className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm active:scale-98 transition-all flex items-center justify-between shadow-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 group-hover:bg-slate-700 group-hover:text-white transition-colors flex items-center justify-center text-slate-700 font-bold shrink-0">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">Scanner QR Kamera Pintu</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Supervisi pemindaian tiket kamera panitia</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Recent Events Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
              Agenda Acara FTI Terkini
            </span>
            <Link
              href="/admin/events"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Semua Acara</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 h-28 animate-pulse" />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              Belum ada acara yang tercatat. Silakan buat acara baru melalui tombol di atas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {recentEvents.map((ev) => {
                const date = new Date(ev.event_start_at);
                const fillPct = ev.quota > 0 ? Math.min(100, Math.round((ev.registeredCount / ev.quota) * 100)) : 0;

                return (
                  <div
                    key={ev.id}
                    className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 uppercase">
                          {ev.category.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          {ev.is_post_test_open ? (
                            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              Post-Test Terbuka
                            </span>
                          ) : (
                            <span className="text-slate-400 inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Post-Test Terkunci
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug truncate" title={ev.title}>
                        {ev.title}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {date.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] truncate max-w-[140px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      </div>

                      {/* Quota Progress */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>Kapasitas Terisi</span>
                          <span className="font-bold text-slate-800">{ev.registeredCount} / {ev.quota} Peserta ({fillPct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              fillPct >= 90 ? "bg-red-500" : fillPct >= 60 ? "bg-amber-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Drilldown Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <Link
                        href={`/admin/reports?eventId=${ev.id}`}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold text-center border border-emerald-200 transition-all flex items-center justify-center gap-1"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Data Peserta</span>
                      </Link>
                      <Link
                        href="/panitia/control"
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold text-center border border-blue-200 transition-all flex items-center justify-center gap-1"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Kelola Sesi</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}

