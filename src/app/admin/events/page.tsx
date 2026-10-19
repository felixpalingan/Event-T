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
  Lock, 
  Unlock,
  ChevronRight,
  Archive
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
}

const DEMO_EVENTS: EventItem[] = [
  {
    id: 1,
    title: "AI Engineering & Modern Cloud Architecture at Scale",
    category: "SEMINAR",
    mode: "OFFLINE",
    venue: "Auditorium FTI Lt. 8 Gedung H",
    quota: 120,
    is_archived: false,
    event_start_at: "2026-10-24T09:00:00Z",
  },
  {
    id: 2,
    title: "Workshop Hands-On: Fullstack Next.js & Supabase",
    category: "WORKSHOP",
    mode: "OFFLINE",
    venue: "Lab Komputer 3, Gedung H",
    quota: 50,
    is_archived: false,
    event_start_at: "2026-10-26T13:00:00Z",
  },
  {
    id: 3,
    title: "Trisakti Tech Hackathon 2026: Campus Efficiency",
    category: "LOMBA",
    mode: "HYBRID",
    venue: "Hall Syarif Thajib Kampus A",
    quota: 200,
    is_archived: false,
    event_start_at: "2026-11-02T08:30:00Z",
  },
];

export default function AdminEventsListPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventItem[]>(DEMO_EVENTS);

  return (
    <AppShell>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Link href="/admin" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Kelola Kegiatan Acara</span>
            </h1>
            <span className="text-[10px] text-blue-700 font-semibold block">
              Publikasi &amp; Pengaturan Kuota
            </span>
          </div>
        </div>

        <Link
          href="/admin/events/new"
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white flex items-center gap-1 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-3">
        {events.map((event) => {
          const date = new Date(event.event_start_at);

          return (
            <div
              key={event.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                  {event.category}
                </span>
                <span className="text-slate-500 font-medium">
                  Kuota: {event.quota} Kursi
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {event.title}
              </h3>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
                  <span className="truncate max-w-[150px]">{event.venue}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link
                  href={`/events`}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold text-center border border-slate-200 transition-all"
                >
                  Lihat Publik
                </Link>
                <Link
                  href={`/panitia/control`}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold text-center border border-blue-200 transition-all"
                >
                  Kontrol Sesi
                </Link>
              </div>
            </div>
          );
        })}
      </main>
    </AppShell>
  );
}
