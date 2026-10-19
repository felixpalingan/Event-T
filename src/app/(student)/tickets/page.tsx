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
  Calendar
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
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">Tiket Saya &amp; Presensi</h1>
        </div>

        <button
          onClick={() => fetchTickets(true)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 active:scale-95 transition-all"
          title="Sinkronisasi Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        <div className="text-center px-2">
          <p className="text-xs text-slate-500 leading-relaxed">
            Tunjukkan kode QR kepada panitia di pintu masuk. Tersimpan otomatis di perangkat dan berfungsi secara offline.
          </p>
        </div>

        {tickets.map((ticket) => {
          const eventDate = ticket.event ? new Date(ticket.event.event_start_at) : new Date();

          return (
            <div
              key={ticket.id}
              className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs relative"
            >
              {/* Event Header Card */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-blue-700 uppercase tracking-wide text-[10px] block mb-1">
                  Pass Masuk Resmi
                </span>
                <h2 className="text-sm font-bold text-slate-900 leading-snug">
                  {ticket.event?.title}
                </h2>
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
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-status-pulse" />
                      <span>SUDAH CHECK-IN DI LOKASI</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-status-pulse" />
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
                    <span className="font-semibold text-slate-800">
                      {userProfile?.name || "Mahasiswa"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      NIM
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      {userProfile?.nim_nidn || "-"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {eventDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[150px]">{ticket.event?.venue}</span>
                  </div>
                </div>

                {/* Practical Action Buttons */}
                <div className="pt-2.5 grid grid-cols-2 gap-2">
                  <Link
                    href={`/test/${ticket.event?.id}`}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 text-center transition-all border border-slate-200 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pre/Post-Test</span>
                  </Link>

                  <Link
                    href="/certificates"
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-center active:scale-95 transition-all ${
                      ticket.is_checked_in
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
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
