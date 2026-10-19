"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  Sparkles, 
  ArrowRight, 
  QrCode, 
  CheckCircle2, 
  Loader2,
  Clock,
  ScanLine
} from "lucide-react";

interface EventItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  mode: string;
  venue: string;
  quota: number;
  price: number;
  skpi_points: number;
  event_start_at: string;
  banner_image: string | null;
  tickets_count?: number;
}

const CATEGORIES = ["Semua", "SEMINAR", "WORKSHOP", "KULIAH_TAMU", "LOMBA", "MAKRAB"];

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [claimedEventIds, setClaimedEventIds] = useState<number[]>([]);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    fetchEventsAndTickets();
  }, []);

  const fetchEventsAndTickets = async () => {
    setLoading(true);
    try {
      // 1. Fetch events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("is_archived", false)
        .order("event_start_at", { ascending: true });

      setEvents(eventsData || []);

      // 2. Check current user tickets
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: ticketsData } = await supabase
          .from("tickets")
          .select("event_id")
          .eq("user_id", user.id);

        if (ticketsData) {
          setClaimedEventIds(ticketsData.map((t) => Number(t.event_id)));
        }
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTicket = async (eventId: number) => {
    setClaimingId(eventId);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Call atomic booking RPC in Supabase
      const { data, error } = await supabase.rpc("claim_event_ticket", {
        p_event_id: eventId,
      });

      if (error) {
        setMessage({ type: "error", text: error.message || "Gagal mengklaim tiket." });
        setClaimingId(null);
        return;
      }

      const res = data as { success: boolean; message: string };
      if (res?.success) {
        setMessage({ type: "success", text: res.message });
        setClaimedEventIds((prev) => [...prev, eventId]);
      } else {
        setMessage({ type: "error", text: res?.message || "Klaim tiket tidak berhasil." });
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: "error", text: error.message || "Terjadi kesalahan." });
    } finally {
      setClaimingId(null);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchCategory = selectedCategory === "Semua" || ev.category.toUpperCase() === selectedCategory;
    const matchSearch = ev.title.toLowerCase().includes(search.toLowerCase()) || 
                        ev.description?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-bold text-base bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              FTI Event!t
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/tickets" className="flex items-center gap-1.5 text-slate-300 hover:text-white">
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Tiket Saya</span>
            </Link>
            <Link href="/scanner" className="hidden sm:flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300">
              <ScanLine className="w-4 h-4" />
              <span>Panitia</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kegiatan Mahasiswa</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Katalog Acara FTI</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Temukan seminar, kuliah tamu, dan workshop untuk menambah wawasan &amp; poin SKPI.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari judul seminar / topik..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat === "SEMINAR" ? "Seminar" :
               cat === "WORKSHOP" ? "Workshop" :
               cat === "KULIAH_TAMU" ? "Kuliah Tamu" :
               cat === "LOMBA" ? "Lomba / Hackathon" :
               cat === "MAKRAB" ? "Makrab" : "Semua Acara"}
            </button>
          ))}
        </div>

        {/* Feedback message banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border border-red-500/30 text-red-300"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">Belum Ada Event Aktif</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {search ? "Tidak ada acara yang cocok dengan kata kunci pencarian Anda." : "Jadwal event baru akan segera diumumkan oleh fakultas dan panitia."}
            </p>
          </div>
        ) : (
          /* Event Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const isClaimed = claimedEventIds.includes(event.id);
              const eventDate = new Date(event.event_start_at);

              return (
                <div
                  key={event.id}
                  className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col overflow-hidden shadow-lg group"
                >
                  {/* Card Header / Banner */}
                  <div className="h-40 w-full bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 relative p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                        {event.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                        +{event.skpi_points} SKPI
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {eventDate.toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <h3 className="text-base font-bold text-white line-clamp-2 mt-1 group-hover:text-blue-300 transition-colors">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{event.venue || "Auditorium FTI"} ({event.mode})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                        <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Kuota: {event.quota} Mahasiswa</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          Biaya
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {event.price === 0 ? "GRATIS" : `Rp ${event.price.toLocaleString("id-ID")}`}
                        </span>
                      </div>

                      {isClaimed ? (
                        <Link
                          href="/tickets"
                          className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tiket Anda</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleClaimTicket(event.id)}
                          disabled={claimingId === event.id}
                          className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
                        >
                          {claimingId === event.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Mendaftarkan...</span>
                            </>
                          ) : (
                            <>
                              <span>Daftar 1-Klik</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
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

      {/* Mobile Sticky Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-6 py-2.5 flex items-center justify-around text-xs">
        <Link href="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <Calendar className="w-5 h-5" />
          <span>Beranda</span>
        </Link>
        <Link href="/events" className="flex flex-col items-center gap-1 text-blue-400 font-semibold">
          <Users className="w-5 h-5" />
          <span>Event</span>
        </Link>
        <Link href="/tickets" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <QrCode className="w-5 h-5" />
          <span>Tiket</span>
        </Link>
        <Link href="/scanner" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <ScanLine className="w-5 h-5" />
          <span>Scanner</span>
        </Link>
      </div>
    </div>
  );
}
