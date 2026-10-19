"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  Users, 
  Archive, 
  ArchiveRestore, 
  Search, 
  Settings2, 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2,
  Edit,
  Bell,
  AlertTriangle,
  Loader2,
  X
} from "lucide-react";

interface EventItem {
  id: number;
  title: string;
  category: string;
  mode: string;
  venue: string;
  quota: number;
  is_archived: boolean;
  event_start_at: string;
  registeredCount: number;
}

export default function AdminEventsListPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [broadcastingId, setBroadcastingId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Soft-Delete Confirmation Modal State
  const [archiveModalEvent, setArchiveModalEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    fetchAdminEvents();
  }, []);

  const fetchAdminEvents = async () => {
    setLoading(true);
    try {
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, category, mode, venue, quota, is_archived, event_start_at")
        .order("event_start_at", { ascending: false });

      const { data: ticketsData } = await supabase
        .from("tickets")
        .select("event_id");

      if (eventsData) {
        const mapped = eventsData.map((ev) => {
          const regCount = ticketsData?.filter((t) => t.event_id === ev.id).length || 0;
          return {
            ...ev,
            registeredCount: regCount,
          };
        });
        setEvents(mapped);
      }
    } catch {
      // Clean fallback
    } finally {
      setLoading(false);
    }
  };

  // Toggle archive status with soft-delete safeguard
  const handleConfirmArchive = async () => {
    if (!archiveModalEvent) return;
    const eventId = archiveModalEvent.id;
    setActionLoadingId(eventId);

    try {
      const { error } = await supabase
        .from("events")
        .update({ is_archived: true })
        .eq("id", eventId);

      if (!error) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, is_archived: true } : e))
        );
        setFeedbackMsg(`Acara "${archiveModalEvent.title}" berhasil diarsipkan.`);
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    } catch {
      // Ignore
    } finally {
      setActionLoadingId(null);
      setArchiveModalEvent(null);
    }
  };

  const handleRestoreEvent = async (eventId: number, title: string) => {
    setActionLoadingId(eventId);
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_archived: false })
        .eq("id", eventId);

      if (!error) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, is_archived: false } : e))
        );
        setFeedbackMsg(`Acara "${title}" berhasil diaktifkan kembali ke katalog publik.`);
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    } catch {
      // Ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  // Broadcast in-app notification
  const handleBroadcastEvent = async (event: EventItem) => {
    if (!confirm(`Kirim notifikasi lonceng acara "${event.title}" ke SELURUH akun mahasiswa sekarang?`)) {
      return;
    }

    setBroadcastingId(event.id);
    try {
      const { data, error } = await supabase.rpc("broadcast_event_notification", {
        p_event_id: event.id,
      });

      if (!error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = data as any;
        setFeedbackMsg(res?.message || "Notifikasi berhasil disiarkan ke seluruh mahasiswa!");
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch {
      // Ignore
    } finally {
      setBroadcastingId(null);
    }
  };

  const categories = [
    { value: "ALL", label: "Semua Kategori" },
    { value: "SEMINAR", label: "Seminar" },
    { value: "WORKSHOP", label: "Workshop" },
    { value: "KULIAH_TAMU", label: "Kuliah Tamu" },
    { value: "LOMBA", label: "Lomba / Hackathon" },
  ];

  const filteredEvents = events.filter((ev) => {
    const matchSearch =
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.venue.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      selectedCategory === "ALL" || ev.category === selectedCategory;

    let matchStatus = true;
    if (statusFilter === "ACTIVE") matchStatus = !ev.is_archived;
    if (statusFilter === "ARCHIVED") matchStatus = ev.is_archived;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <AppShell>
      {/* Header & Breadcrumb */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/admin" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden" title="Kembali ke Dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <Link href="/admin" className="hover:text-blue-600 transition-colors">Dashboard Admin</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Kelola Katalog Acara</span>
            </div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Kelola Kegiatan Acara FTI</span>
            </h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Publikasi Acara, Penjadwalan &amp; Pengaturan Kuota
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAdminEvents}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
            title="Segarkan Daftar Acara"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <Link
            href="/admin/events/new"
            className="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Acara</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 space-y-4">
        {feedbackMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari judul acara atau ruangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 outline-none transition-colors shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 shadow-2xs"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "ARCHIVED")}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Aktif</option>
              <option value="ARCHIVED">Hanya Arsip</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-20 bg-slate-100 rounded-md"></div>
                  <div className="h-4 w-16 bg-slate-100 rounded-md"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-100 rounded-md"></div>
                <div className="pt-2 border-t border-slate-100 flex justify-between">
                  <div className="h-4 w-24 bg-slate-100 rounded"></div>
                  <div className="h-4 w-28 bg-slate-100 rounded"></div>
                </div>
                <div className="pt-2 flex gap-2">
                  <div className="h-9 flex-1 bg-slate-100 rounded-xl"></div>
                  <div className="h-9 flex-1 bg-slate-100 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center shadow-xs">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Belum Ada Acara di Database</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-sm mx-auto mb-5">
              Klik tombol di bawah untuk membuat dan mempublikasikan agenda kegiatan perdana.
            </p>
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Publikasikan Acara Sekarang</span>
            </Link>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
            <p className="text-xs md:text-sm text-slate-500">
              Tidak ada kegiatan yang cocok dengan kriteria pencarian atau filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => {
              const date = new Date(event.event_start_at);
              const fillPct = event.quota > 0 ? Math.min(100, Math.round((event.registeredCount / event.quota) * 100)) : 0;

              return (
                <div
                  key={event.id}
                  className={`p-5 rounded-3xl bg-white border shadow-xs flex flex-col justify-between space-y-3.5 transition-all ${
                    event.is_archived 
                      ? "border-slate-200/80 bg-slate-50/50 opacity-80" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 uppercase">
                        {event.category.replace("_", " ")}
                      </span>
                      {event.is_archived ? (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                          DIARSIPKAN
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          AKTIF
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug line-clamp-2" title={event.title}>
                      {event.title}
                    </h3>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {date.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[130px]">{event.venue}</span>
                        </div>
                      </div>

                      {/* Quota Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">Pendaftar</span>
                          <span className="text-slate-800">{event.registeredCount} / {event.quota} Kursi ({fillPct}%)</span>
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
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {/* Primary Actions: Edit, Data Peserta, Broadcast */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold text-center border border-blue-200 transition-all flex items-center justify-center gap-1 shadow-2xs"
                        title="Edit Informasi & Template Sertifikat"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit</span>
                      </Link>

                      <Link
                        href={`/admin/reports?eventId=${event.id}`}
                        className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold text-center border border-emerald-200 transition-all flex items-center justify-center gap-1 shadow-2xs"
                        title="Lihat Data Presensi & Nilai Peserta Acara Ini"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Peserta</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleBroadcastEvent(event)}
                        disabled={broadcastingId === event.id}
                        className="py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold text-center border border-amber-200 transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                        title="Broadcast Notifikasi Acara ke Mahasiswa"
                      >
                        {broadcastingId === event.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>Notif</span>
                      </button>
                    </div>

                    {/* Secondary Actions: Live Preview & Archive/Restore Toggle */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/events#event-${event.id}`}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold text-center border border-slate-200 transition-all flex items-center justify-center gap-1"
                        title="Pratinjau Halaman Mahasiswa"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                        <span>Katalog Publik</span>
                      </Link>

                      {event.is_archived ? (
                        <button
                          type="button"
                          onClick={() => handleRestoreEvent(event.id, event.title)}
                          disabled={actionLoadingId === event.id}
                          className="py-1.5 px-2.5 rounded-xl text-[11px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                          title="Aktifkan kembali ke katalog"
                        >
                          <ArchiveRestore className="w-3 h-3 text-emerald-600" />
                          <span>Pulihkan</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setArchiveModalEvent(event)}
                          className="py-1.5 px-2.5 rounded-xl text-[11px] font-semibold border bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all flex items-center gap-1 active:scale-95"
                          title="Arsipkan Acara (Soft-Delete)"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Arsipkan</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* SOFT-DELETE (ARSIP) CONFIRMATION MODAL */}
      {archiveModalEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm md:text-base font-bold text-slate-900">
                  Konfirmasi Pengarsipan Acara
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arsipkan <strong>&ldquo;{archiveModalEvent.title}&rdquo;</strong> dari publik?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setArchiveModalEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Acara akan <strong>disembunyikan dari katalog mahasiswa</strong>. Namun, <strong>seluruh data presensi pintu aula, nilai kuis mahasiswa, dan sertifikat yang telah diterbitkan tetap utuh</strong> di database dan laporan BAAK.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArchiveModalEvent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={actionLoadingId === archiveModalEvent.id}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {actionLoadingId === archiveModalEvent.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5" />
                )}
                <span>Ya, Arsipkan Acara</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
