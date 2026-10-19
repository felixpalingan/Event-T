"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { 
  QrCode, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileText, 
  Award, 
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Users,
  ScanLine
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
    skpi_points: number;
  };
}

export default function MyTicketsPage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ name: string; nim_nidn: string } | null>(null);

  useEffect(() => {
    fetchTickets();

    // Auto poll every 4 seconds to detect if panitia scans QR code
    const interval = setInterval(() => {
      fetchTickets(false);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, nim_nidn")
        .eq("id", user.id)
        .single();

      if (profile) setUserProfile(profile);

      // Fetch tickets with event details
      const { data: ticketsData } = await supabase
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
            skpi_points
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ticketsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTickets(ticketsData as any);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            <span>Katalog Event</span>
          </Link>

          <span className="font-bold text-sm bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Tiket Kegiatan Saya
          </span>

          <button
            onClick={() => fetchTickets(true)}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Tiket &amp; Kartu Presensi</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Tunjukkan kode QR tiket ini kepada panitia di pintu masuk auditorium kampus.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800">
            <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">Belum Ada Tiket Terdaftar</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Anda belum mendaftar ke kegiatan atau seminar apapun.
            </p>
            <Link
              href="/events"
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
            >
              Cari Event Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {tickets.map((ticket) => {
              const eventDate = ticket.event ? new Date(ticket.event.event_start_at) : new Date();

              return (
                <div
                  key={ticket.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row"
                >
                  {/* Left Column: QR Code Display */}
                  <div className="p-6 md:p-8 bg-slate-950/80 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
                    <div className="p-3 bg-white rounded-2xl shadow-xl">
                      <QRCodeSVG
                        value={ticket.ticket_code}
                        size={160}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4">
                      {ticket.is_checked_in ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>SUDAH HADIR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>SIAP DI-SCAN</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 font-mono mt-2 tracking-widest text-center">
                      {ticket.ticket_code.slice(0, 8)}...{ticket.ticket_code.slice(-6)}
                    </p>
                  </div>

                  {/* Right Column: Ticket & Event Details */}
                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Event Title */}
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                        +{ticket.event?.skpi_points || 10} SKPI
                      </span>
                      <h2 className="text-lg md:text-xl font-bold text-white mt-2">
                        {ticket.event?.title}
                      </h2>

                      {/* Student Info */}
                      <div className="mt-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                            Peserta
                          </span>
                          <span className="font-semibold text-slate-200">
                            {userProfile?.name || "Mahasiswa"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                            NIM
                          </span>
                          <span className="font-semibold text-blue-400 font-mono">
                            {userProfile?.nim_nidn || "-"}
                          </span>
                        </div>
                      </div>

                      {/* Event Meta */}
                      <div className="mt-4 space-y-2 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>
                            {eventDate.toLocaleDateString("id-ID", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>{ticket.event?.venue} ({ticket.event?.mode})</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar (Test & Certificate Links) */}
                    <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/test/${ticket.event?.id}`}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Pre-Test / Post-Test</span>
                      </Link>

                      <Link
                        href={`/certificates`}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          ticket.is_checked_in
                            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
                            : "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Klaim E-Sertifikat</span>
                      </Link>
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
        <Link href="/events" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <Users className="w-5 h-5" />
          <span>Event</span>
        </Link>
        <Link href="/tickets" className="flex flex-col items-center gap-1 text-blue-400 font-semibold">
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
