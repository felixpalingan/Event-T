"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  Calendar, 
  MapPin, 
  Search, 
  QrCode, 
  Ticket,
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Clock,
  ArrowLeft,
  X
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
  event_start_at: string;
}

const CATEGORIES = ["Semua", "SEMINAR", "WORKSHOP", "KULIAH_TAMU", "LOMBA"];

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [claimedEventIds, setClaimedEventIds] = useState<number[]>([]);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchEventsAndTickets();
  }, []);

  const fetchEventsAndTickets = async () => {
    setLoading(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, title, slug, description, category, mode, venue, quota, price, event_start_at")
        .eq("is_archived", false)
        .order("event_start_at", { ascending: true });

      if (eventsData) {
        setEvents(eventsData);
      }

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
    } catch {
      // Retain clean state
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

      const { data, error } = await supabase.rpc("claim_event_ticket", {
        p_event_id: eventId,
      });

      if (error) {
        setMessage({ type: "error", text: error.message || "Gagal mengklaim tiket." });
      } else {
        const res = data as { success: boolean; message: string };
        if (res?.success) {
          setMessage({ type: "success", text: res.message });
          setClaimedEventIds((prev) => [...prev, eventId]);
        } else {
          setMessage({ type: "error", text: res?.message || "Klaim tiket tidak berhasil." });
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: "error", text: error.message || "Terjadi kesalahan koneksi." });
    } finally {
      setClaimingId(null);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchCategory = selectedCategory === "Semua" || ev.category.toUpperCase() === selectedCategory;
    const matchSearch = ev.title.toLowerCase().includes(search.toLowerCase()) || 
                        ev.description?.toLowerCase().includes(search.toLowerCase()) ||
                        ev.venue.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight">Katalog Kegiatan FTI</h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Jelajahi Seminar, Workshop &amp; Lomba Resmi Kampus
            </span>
          </div>
        </div>

        <Link 
          href="/tickets" 
          className="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs"
        >
          <QrCode className="w-4 h-4" />
          <span>Tiket Saya</span>
        </Link>
      </header>

      {/* Search & Category Filter Toolbar */}
      <div className="px-4 md:px-0 pt-3 md:pt-4 pb-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari seminar, workshop, lab..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 outline-none transition-colors shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap active:scale-95 transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat === "SEMINAR" ? "Seminar" :
               cat === "WORKSHOP" ? "Workshop" :
               cat === "KULIAH_TAMU" ? "Kuliah Tamu" :
               cat === "LOMBA" ? "Lomba" : "Semua Acara"}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`mx-4 md:mx-0 mt-2 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Events Feed Grid (1-col on mobile, 2 or 3-col on desktop) */}
      <main className="flex-1 px-4 md:px-0 py-3 md:py-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-20 bg-slate-100 rounded-md"></div>
                  <div className="h-4 w-16 bg-slate-100 rounded-md"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-100 rounded-md"></div>
                <div className="h-10 w-full bg-slate-100 rounded-md"></div>
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                  <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <div className="h-6 w-16 bg-slate-100 rounded"></div>
                  <div className="h-9 w-24 bg-slate-100 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center shadow-xs">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Tidak Ada Kegiatan</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedCategory !== "Semua"
                ? "Tidak ada kegiatan yang sesuai dengan filter atau pencarian Anda. Coba reset kata kunci."
                : "Belum ada agenda seminar atau workshop yang aktif saat ini."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((event) => {
              const isClaimed = claimedEventIds.includes(event.id);
              const eventDate = new Date(event.event_start_at);

              return (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Meta Header */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 uppercase tracking-wide">
                        {event.category.replace("_", " ")}
                      </span>
                      <span className="font-medium text-slate-500">
                        Mode: {event.mode}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {event.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Venue & Time */}
                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          {eventDate.toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })} • Pukul {eventDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Claim */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {event.price === 0 ? "GRATIS" : `Rp ${event.price.toLocaleString("id-ID")}`}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Sisa Kuota: {event.quota}
                      </span>
                    </div>

                    {isClaimed ? (
                      <Link
                        href="/tickets"
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tiket Anda</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleClaimTicket(event.id)}
                        disabled={claimingId === event.id}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-xs"
                      >
                        {claimingId === event.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mendaftarkan...</span>
                          </>
                        ) : (
                          <span>Klaim Tiket</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
