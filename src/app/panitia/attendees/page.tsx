"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  Users, 
  UserCheck, 
  ScanLine, 
  Loader2,
  Calendar,
  Filter,
  RotateCcw
} from "lucide-react";

interface AttendeeItem {
  ticket_id: number;
  ticket_code: string;
  is_checked_in: boolean;
  checked_in_at: string | null;
  student_name: string;
  nim: string;
  prodi: string;
  event_id: number;
  event_title: string;
}

interface EventFilterItem {
  id: number;
  title: string;
  category: string;
}

function AttendeesChecklistContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialEventParam = searchParams.get("eventId");

  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [events, setEvents] = useState<EventFilterItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventParam || "ALL");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ATTENDED" | "PENDING">("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (initialEventParam) {
      setSelectedEventId(initialEventParam);
    }
  }, [initialEventParam]);

  useEffect(() => {
    fetchEventsList();
    fetchAttendees(true);

    // Setup Realtime Listener on tickets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    try {
      channel = supabase
        .channel("panitia_attendees_sync")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tickets",
          },
          () => {
            fetchAttendees(false);
          }
        )
        .subscribe();
    } catch {
      // Ignore
    }

    const interval = setInterval(() => {
      fetchAttendees(false);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchEventsList = async () => {
    try {
      const { data } = await supabase
        .from("events")
        .select("id, title, category")
        .eq("is_archived", false)
        .order("id", { ascending: false });

      if (data) {
        setEvents(data);
      }
    } catch {
      // Ignore
    }
  };

  const fetchAttendees = async (showLoading = true) => {
    if (showLoading && attendees.length === 0) setLoading(true);

    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_code,
          is_checked_in,
          checked_in_at,
          created_at,
          event_id,
          profile:profiles!tickets_user_id_fkey (
            name,
            nim_nidn,
            prodi
          ),
          event:events!tickets_event_id_fkey (
            id,
            title
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: AttendeeItem[] = data.map((t: any) => ({
          ticket_id: t.id,
          ticket_code: t.ticket_code,
          is_checked_in: t.is_checked_in,
          checked_in_at: t.checked_in_at,
          student_name: t.profile?.name || "Mahasiswa",
          nim: t.profile?.nim_nidn || "-",
          prodi: t.profile?.prodi || "Teknik Informatika",
          event_id: t.event?.id || t.event_id,
          event_title: t.event?.title || "Kegiatan FTI",
        }));
        setAttendees(mapped);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (item: AttendeeItem) => {
    setUpdatingId(item.ticket_id);
    try {
      const { data, error } = await supabase.rpc("process_ticket_checkin", {
        p_ticket_code: item.ticket_code,
        p_event_id: item.event_id,
      });

      if (!error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = data as any;
        if (res?.success || res?.code === "ALREADY_CHECKED_IN") {
          setAttendees((prev) =>
            prev.map((a) =>
              a.ticket_id === item.ticket_id
                ? { ...a, is_checked_in: true, checked_in_at: new Date().toISOString() }
                : a
            )
          );
        }
      }
    } catch {
      // Fallback
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter by event, status, and search keyword
  const filtered = attendees.filter((a) => {
    // Event filter
    if (selectedEventId !== "ALL" && a.event_id.toString() !== selectedEventId) {
      return false;
    }

    // Status filter
    if (filter === "ATTENDED" && !a.is_checked_in) return false;
    if (filter === "PENDING" && a.is_checked_in) return false;

    // Search query
    const matchSearch =
      a.student_name.toLowerCase().includes(search.toLowerCase()) ||
      a.nim.toLowerCase().includes(search.toLowerCase()) ||
      a.prodi.toLowerCase().includes(search.toLowerCase()) ||
      a.event_title.toLowerCase().includes(search.toLowerCase());

    return matchSearch;
  });

  const currentEventAttendees = selectedEventId === "ALL"
    ? attendees
    : attendees.filter((a) => a.event_id.toString() === selectedEventId);

  const attendedCount = currentEventAttendees.filter((a) => a.is_checked_in).length;

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Daftar Kehadiran Peserta</span>
            </h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Laporan Presensi Pintu &amp; Check-In Manual Panitia
            </span>
          </div>
        </div>

        <Link
          href="/panitia/scanner"
          className="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
        >
          <ScanLine className="w-4 h-4" />
          <span>Buka Scanner Kamera</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 space-y-4">
        {/* Attendance Counter Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Statistik Masuk Ruangan {selectedEventId !== "ALL" ? "(Kegiatan Terpilih)" : "(Semua Kegiatan)"}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {attendedCount}
              </span>
              <span className="text-xs md:text-sm font-medium text-slate-500">
                / {currentEventAttendees.length} Mahasiswa Terdaftar
              </span>
            </div>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-base md:text-lg">
            {Math.round((attendedCount / (currentEventAttendees.length || 1)) * 100)}%
          </div>
        </div>

        {/* Event Filter & Search Bar */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Event Dropdown Filter */}
            <div className="relative flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Filter Berdasarkan Acara
              </label>
              <div className="relative">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full py-2.5 px-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Acara FTI (Global)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id.toString()}>
                      [{ev.category}] {ev.title}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Reset Filter Button */}
            {selectedEventId !== "ALL" && (
              <div className="sm:self-end">
                <button
                  type="button"
                  onClick={() => setSelectedEventId("ALL")}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Semua Acara</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari NIM, Nama Mahasiswa, atau Prodi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white outline-none transition-colors shadow-2xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all whitespace-nowrap ${
                  filter === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Semua ({currentEventAttendees.length})
              </button>
              <button
                onClick={() => setFilter("ATTENDED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all whitespace-nowrap ${
                  filter === "ATTENDED"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Sudah Hadir ({attendedCount})
              </button>
              <button
                onClick={() => setFilter("PENDING")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all whitespace-nowrap ${
                  filter === "PENDING"
                    ? "bg-amber-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Belum Hadir ({currentEventAttendees.length - attendedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Attendees Grid (1-col on mobile, 2 or 3-col on desktop) */}
        {loading && attendees.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3 animate-pulse"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-slate-100 rounded"></div>
                  <div className="h-3 w-44 bg-slate-100 rounded"></div>
                  <div className="h-3 w-24 bg-slate-100 rounded"></div>
                </div>
                <div className="w-16 h-8 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : currentEventAttendees.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center shadow-xs max-w-md mx-auto">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Belum Ada Peserta Terdaftar</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Mahasiswa yang mendaftar ke kegiatan FTI akan otomatis muncul di daftar ini secara real-time.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
            <p className="text-xs md:text-sm text-slate-500">
              Tidak ada data peserta yang cocok dengan kata kunci atau filter saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((item) => (
              <div
                key={item.ticket_id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-blue-300 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                      {item.student_name}
                    </h4>
                    {item.is_checked_in ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        Hadir
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                        Menunggu
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-mono text-blue-700 font-semibold mt-0.5">
                    NIM: {item.nim} • {item.prodi}
                  </p>

                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    Acara: {item.event_title}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {item.is_checked_in && item.checked_in_at
                      ? `Waktu Hadir: ${new Date(item.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`
                      : "Belum melakukan scan di pintu"}
                  </p>
                </div>

                {!item.is_checked_in ? (
                  <button
                    onClick={() => handleManualCheckIn(item)}
                    disabled={updatingId === item.ticket_id}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 border border-slate-200 text-xs font-semibold shrink-0 active:scale-95 transition-all flex items-center gap-1 shadow-2xs"
                    title="Klik untuk check-in manual jika HP peserta bermasalah"
                  >
                    {updatingId === item.ticket_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>Manual</span>
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

export default function AttendeesChecklistPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-8 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Memuat data kehadiran peserta...</span>
          </div>
        </AppShell>
      }
    >
      <AttendeesChecklistContent />
    </Suspense>
  );
}
