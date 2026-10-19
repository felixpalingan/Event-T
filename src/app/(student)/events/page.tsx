"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  X,
  Award,
  Sparkles,
  Users,
  ExternalLink,
  ChevronRight,
  ShieldCheck
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
  banner_image?: string | null;
  skpi_points?: number | null;
  has_certificate?: boolean | null;
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
        .select("id, title, slug, description, category, mode, venue, quota, price, event_start_at, banner_image, skpi_points, has_certificate")
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

  const getPosterFallback = (category: string) => {
    if (category === "WORKSHOP") return "/posters/workshop-web-cloud.jpg";
    if (category === "LOMBA") return "/posters/hackathon-fti.jpg";
    return "/posters/seminar-ai-cloud.jpg";
  };

  return (
    <AppShell>
      {/* Top Academic Header */}
      <header className="sticky top-0 z-40 bg-white/90 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-4 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 hidden md:flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-xl font-black text-slate-900 tracking-tight">Katalog Kegiatan FTI</h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Terakreditasi SKPI</span>
              </span>
            </div>
            <span className="text-[11px] md:text-xs text-slate-500 font-medium block">
              Jelajahi Seminar, Workshop, &amp; Lomba Resmi Fakultas Teknologi Industri
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
            {loading ? "Memuat..." : `${events.length} Kegiatan Aktif`}
          </span>
        </div>
      </header>

      {/* Search & Category Filter Toolbar */}
      <div className="px-4 md:px-0 pt-4 pb-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari seminar AI, workshop cloud, hackathon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 outline-none transition-colors shadow-2xs"
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

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all shadow-2xs ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat === "SEMINAR" ? "Seminar Nasional" :
               cat === "WORKSHOP" ? "Hands-on Workshop" :
               cat === "KULIAH_TAMU" ? "Kuliah Tamu" :
               cat === "LOMBA" ? "Kompetisi & Hackathon" : "Semua Kegiatan"}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`mx-4 md:mx-0 mt-2 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold border shadow-xs animate-shake ${
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

      {/* Events Feed Grid (Rich Visual Cards with Poster Mockups) */}
      <main className="flex-1 px-4 md:px-0 py-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/9] w-full bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-20 bg-slate-100 rounded-md" />
                    <div className="h-4 w-16 bg-slate-100 rounded-md" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-100 rounded-md" />
                  <div className="h-10 w-full bg-slate-100 rounded-md" />
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                    <div className="h-4 w-2/3 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center shadow-xs">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Tidak Ada Kegiatan Ditemukan</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedCategory !== "Semua"
                ? "Tidak ada kegiatan yang sesuai dengan filter atau pencarian Anda. Coba reset kata kunci."
                : "Belum ada agenda seminar atau workshop yang aktif saat ini."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const isClaimed = claimedEventIds.includes(event.id);
              const eventDate = new Date(event.event_start_at);
              const posterUrl = event.banner_image || getPosterFallback(event.category);
              const skpi = event.skpi_points || (event.category === "WORKSHOP" ? 25 : event.category === "LOMBA" ? 35 : 15);

              return (
                <div
                  key={event.id}
                  className="rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Poster Mockup Header */}
                  <div>
                    <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
                      <Image
                        src={posterUrl}
                        alt={event.title}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Gradient Backdrop Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/30 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/20 shadow-md">
                          {event.category.replace("_", " ")}
                        </span>
                        
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-md">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>+{skpi} SKPI</span>
                        </span>
                      </div>

                      {/* Bottom Image Overlay Badges */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Mode {event.mode}</span>
                        </span>

                        <span className="text-[11px] font-bold text-slate-200 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                          {event.price === 0 ? "GRATIS" : `Rp ${event.price.toLocaleString("id-ID")}`}
                        </span>
                      </div>
                    </div>

                    {/* Card Content Area */}
                    <div className="p-5 space-y-3.5">
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Schedule & Location Pills */}
                      <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-700">
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
                          <span className="truncate text-slate-500">{event.venue}</span>
                        </div>
                      </div>

                      {/* Quota Progress Indicator */}
                      <div className="pt-1 space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Users className="w-3 h-3 text-slate-400" /> Kuota Peserta
                          </span>
                          <span className="font-bold text-slate-800">Tersedia {event.quota} kursi</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full w-3/4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Claim Footer */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link
                      href={`/events/${event.slug}/test`}
                      className="text-[11px] font-bold text-slate-600 hover:text-blue-700 flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-white transition-colors"
                    >
                      <span>Uji Soal &amp; Sertifikat</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {isClaimed ? (
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Terdaftar</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimTicket(event.id)}
                        disabled={claimingId === event.id}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                      >
                        {claimingId === event.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mendaftarkan...</span>
                          </>
                        ) : (
                          <>
                            <Ticket className="w-3.5 h-3.5" />
                            <span>Klaim Tiket</span>
                          </>
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
