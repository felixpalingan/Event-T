"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  CheckCircle2, 
  MapPin, 
  FileText, 
  Award, 
  RefreshCw, 
  ArrowLeft, 
  Calendar, 
  QrCode, 
  Ticket, 
  WifiOff, 
  Lock,
  Sparkles
} from "lucide-react";

interface TicketItem {
  id: number;
  ticket_code: string;
  status: string;
  is_checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  event: {
    id: number;
    title: string;
    venue: string;
    mode: string;
    event_start_at: string;
    is_post_test_open: boolean;
    banner_image?: string | null;
    category?: string;
    slug?: string;
  };
}

export default function MyTicketsPage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; nim_nidn: string } | null>(null);

  // 1. Initial offline cache restore and network status listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);

      const cached = localStorage.getItem("fti_cached_tickets");
      const cachedProfile = localStorage.getItem("fti_cached_profile");

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTickets(parsed);
            setLoading(false);
          }
        } catch {
          // Ignore parse errors
        }
      }

      if (cachedProfile) {
        try {
          setUserProfile(JSON.parse(cachedProfile));
        } catch {
          // Ignore
        }
      }

      const handleOnline = () => {
        setIsOffline(false);
        fetchTickets(false);
      };
      const handleOffline = () => setIsOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // 2. Fetch live tickets and setup realtime listener
  useEffect(() => {
    fetchTickets(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    const setupRealtime = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        channel = supabase
          .channel(`tickets_realtime_${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "tickets",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              fetchTickets(false);
            }
          )
          .subscribe();
      } catch {
        // Fallback to polling
      }
    };

    setupRealtime();

    // 5-second polling fallback
    const interval = setInterval(() => {
      fetchTickets(false);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async (showLoading = true) => {
    if (showLoading && tickets.length === 0) setLoading(true);
    setSyncing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsGuest(true);
        setLoading(false);
        setSyncing(false);
        return;
      }

      setIsGuest(false);

      // Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, nim_nidn")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("fti_cached_profile", JSON.stringify(profile));
        }
      }

      // Fetch Tickets Join Events
      const { data: ticketsData, error } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_code,
          status,
          is_checked_in,
          checked_in_at,
          created_at,
          event:events (
            id,
            title,
            venue,
            mode,
            event_start_at,
            is_post_test_open,
            banner_image,
            category,
            slug
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && ticketsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTickets(ticketsData as any);
        if (typeof window !== "undefined") {
          localStorage.setItem("fti_cached_tickets", JSON.stringify(ticketsData));
        }
      }
    } catch {
      // In case of network failure, keep cached tickets
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight">Tiket Saya &amp; Akses Masuk</h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Boarding Pass QR Offline &amp; Status Presensi Pintu
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchTickets(true)}
          disabled={syncing}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:scale-95 transition-all border border-slate-200 bg-white shadow-2xs flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
          title="Sinkronisasi Status"
        >
          <RefreshCw className={`w-4 h-4 text-blue-600 ${syncing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{syncing ? "Memuat..." : "Sinkronisasi"}</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 space-y-4">
        {/* Offline Alert Banner */}
        {isOffline && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2.5 shadow-2xs">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mode Offline Aktif • Boarding pass QR dimuat aman dari penyimpanan perangkat Anda.</span>
          </div>
        )}

        <div className="text-center px-2 max-w-xl mx-auto">
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            Tunjukkan kode QR kepada panitia di pintu masuk. Boarding pass tersimpan otomatis di perangkat dan dapat diakses tanpa koneksi internet.
          </p>
        </div>

        {/* State: Guest / Not Logged In */}
        {isGuest ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center shadow-xs max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-200 shadow-2xs">
              <QrCode className="w-7 h-7" />
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">Masuk untuk Melihat Tiket</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Boarding pass digital Anda akan tersimpan di sini. Silakan masuk menggunakan akun mahasiswa Trisakti Anda.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
              >
                Masuk ke Akun
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all"
              >
                Daftar Baru
              </Link>
            </div>
          </div>
        ) : loading && tickets.length === 0 ? (
          /* State: Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
                  <div className="h-3 w-20 bg-slate-200 rounded"></div>
                  <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
                </div>
                <div className="p-6 flex flex-col items-center justify-center space-y-4">
                  <div className="w-44 h-44 bg-slate-100 rounded-2xl border-2 border-slate-200"></div>
                  <div className="h-7 w-48 bg-slate-200 rounded-full"></div>
                  <div className="h-3 w-36 bg-slate-100 rounded"></div>
                </div>
                <div className="p-4 bg-slate-50 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-9 bg-slate-200 rounded-xl"></div>
                    <div className="h-9 bg-slate-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          /* State: Empty State */
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center shadow-xs max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Ticket className="w-7 h-7" />
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">Belum Ada Tiket Kegiatan</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Anda belum terdaftar pada kegiatan atau seminar manapun. Jelajahi katalog kegiatan kampus dan klaim tiket Anda secara gratis.
            </p>
            <div className="mt-5">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Katalog Kegiatan FTI</span>
              </Link>
            </div>
          </div>
        ) : (
          /* State: Live Tickets Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => {
              const eventDate = ticket.event ? new Date(ticket.event.event_start_at) : new Date();

              return (
                <div
                  key={ticket.id}
                  className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs relative flex flex-col justify-between"
                >
                  {/* Event Poster Header Banner */}
                  <div className="relative aspect-[21/8] w-full bg-slate-950 overflow-hidden">
                    <Image
                      src={ticket.event?.banner_image || "/posters/seminar-ai-cloud.jpg"}
                      alt={ticket.event?.title || "Poster Acara"}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/30" />
                    <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600/90 text-white backdrop-blur-md">
                        {ticket.event?.category?.replace("_", " ") || "EVENT RESMI"}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-black/60 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                        Mode {ticket.event?.mode}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-300 block">
                        Boarding Pass Digital Sivitas FTI
                      </span>
                      <h2 className="text-xs sm:text-sm font-extrabold line-clamp-1 leading-tight">
                        {ticket.event?.title}
                      </h2>
                    </div>
                  </div>

                  {/* QR Code Pass Body */}
                  <div className="p-6 flex flex-col items-center justify-center bg-white">
                    <div className="p-3.5 bg-white rounded-2xl shadow-xs border-2 border-slate-200">
                      <QRCodeSVG
                        value={ticket.ticket_code}
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    {/* Status Indicator with Live Pulse */}
                    <div className="mt-4">
                      {ticket.is_checked_in ? (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>SUDAH CHECK-IN DI LOKASI</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>SIAP DI-SCAN PANITIA</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono mt-2.5 tracking-wider uppercase">
                      {ticket.ticket_code}
                    </p>
                  </div>

                  {/* Physical Boarding Pass Perforation Notch */}
                  <div className="relative flex items-center bg-white py-1">
                    <div className="w-5 h-5 rounded-full bg-slate-100 -ml-2.5 border-r border-slate-200" />
                    <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2" />
                    <div className="w-5 h-5 rounded-full bg-slate-100 -mr-2.5 border-l border-slate-200" />
                  </div>

                  {/* Attendee Details */}
                  <div className="p-4 bg-slate-50/70 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                          Peserta
                        </span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {userProfile?.name || "Mahasiswa"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                          NIM
                        </span>
                        <span className="font-mono font-bold text-blue-700 truncate block">
                          {userProfile?.nim_nidn || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {eventDate.toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{ticket.event?.venue}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2.5 grid grid-cols-2 gap-2">
                      <Link
                        href={`/test/${ticket.event?.id}`}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 text-center transition-all border border-slate-200 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pre/Post-Test</span>
                      </Link>

                      {ticket.is_checked_in ? (
                        <Link
                          href="/certificates"
                          className="py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-center active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>E-Sertifikat</span>
                        </Link>
                      ) : (
                        <div
                          className="py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-center bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                          title="E-sertifikat dapat diklaim setelah check-in fisik di pintu dan post-test selesai."
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Sertifikat</span>
                        </div>
                      )}
                    </div>
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
