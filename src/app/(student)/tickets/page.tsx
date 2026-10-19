"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileText, 
  Award, 
  RefreshCw,
  ArrowLeft,
  Calendar,
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
    skpi_points: number;
  };
}

const DEMO_TICKETS: TicketItem[] = [
  {
    id: 1,
    ticket_code: "e5812e9b-9c2b-4fa8-b649-6f81b1d3d5f1",
    status: "CONFIRMED",
    is_checked_in: false,
    checked_in_at: null,
    created_at: "2026-10-19T04:00:00Z",
    event: {
      id: 1,
      title: "AI Engineering & Modern Cloud Architecture at Scale",
      venue: "Auditorium FTI Lt. 8 Gedung H",
      mode: "OFFLINE",
      event_start_at: "2026-10-24T09:00:00Z",
      is_post_test_open: true,
      skpi_points: 15,
    },
  },
];

export default function MyTicketsPage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<TicketItem[]>(DEMO_TICKETS);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ name: string; nim_nidn: string } | null>({
    name: "Felix Palingan",
    nim_nidn: "065002100012",
  });

  useEffect(() => {
    fetchTickets();

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, nim_nidn")
        .eq("id", user.id)
        .single();

      if (profile) setUserProfile(profile);

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

      if (ticketsData && ticketsData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTickets(ticketsData as any);
      }
    } catch {
      // Keep demo tickets as fallback
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  return (
    <AppShell>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-slate-400 hover:text-white p-1 -ml-1 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-bold text-white tracking-tight">Tiket Saya &amp; Presensi</h1>
        </div>

        <button
          onClick={() => fetchTickets(true)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all"
          title="Sinkronisasi Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-5">
        <div className="text-center px-2">
          <p className="text-xs text-slate-400 leading-relaxed">
            Tunjukkan kode QR kepada panitia di pintu masuk. Tersimpan otomatis di perangkat dan berfungsi secara offline.
          </p>
        </div>

        {tickets.map((ticket) => {
          const eventDate = ticket.event ? new Date(ticket.event.event_start_at) : new Date();

          return (
            <div
              key={ticket.id}
              className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl relative"
            >
              {/* Event Header Card */}
              <div className="p-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-blue-400 uppercase tracking-wide">
                    Pass Masuk Kegiatan FTI
                  </span>
                  <span className="font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    +{ticket.event?.skpi_points || 15} SKPI
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white leading-snug">
                  {ticket.event?.title}
                </h2>
              </div>

              {/* QR Code Pass Body */}
              <div className="p-6 flex flex-col items-center justify-center bg-slate-950">
                <div className="p-3.5 bg-white rounded-2xl shadow-xl border-4 border-slate-200">
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
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-status-pulse" />
                      <span>SUDAH CHECK-IN DI LOKASI</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-status-pulse" />
                      <span>SIAP DI-SCAN PANITIA</span>
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 font-mono mt-2.5 tracking-widest uppercase">
                  {ticket.ticket_code}
                </p>
              </div>

              {/* Physical Boarding Pass Perforation Notch */}
              <div className="relative flex items-center bg-slate-950 py-1">
                <div className="w-5 h-5 rounded-full bg-slate-950 -ml-2.5 border-r border-slate-800" />
                <div className="flex-1 border-t-2 border-dashed border-slate-800 mx-2" />
                <div className="w-5 h-5 rounded-full bg-slate-950 -mr-2.5 border-l border-slate-800" />
              </div>

              {/* Attendee Details */}
              <div className="p-4 bg-slate-900 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">
                      Peserta
                    </span>
                    <span className="font-semibold text-white">
                      {userProfile?.name || "Mahasiswa"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-500">
                      NIM
                    </span>
                    <span className="font-mono font-bold text-blue-400">
                      {userProfile?.nim_nidn || "-"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {eventDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate max-w-[150px]">{ticket.event?.venue}</span>
                  </div>
                </div>

                {/* Practical Action Buttons */}
                <div className="pt-2.5 grid grid-cols-2 gap-2">
                  <Link
                    href={`/test/${ticket.event?.id}`}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 text-center transition-all border border-slate-700/60"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pre/Post-Test</span>
                  </Link>

                  <Link
                    href="/certificates"
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-center active:scale-95 transition-all ${
                      ticket.is_checked_in
                        ? "bg-blue-700 hover:bg-blue-600 text-white shadow-sm"
                        : "bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>E-Sertifikat</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </AppShell>
  );
}
