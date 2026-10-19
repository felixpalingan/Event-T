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

export default function AdminEventsListPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminEvents();
  }, []);

  const fetchAdminEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, category, mode, venue, quota, is_archived, event_start_at")
        .order("event_start_at", { ascending: false });

      if (data) {
        setEvents(data);
      }
    } catch {
      // Clean fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/admin" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Kelola Kegiatan Acara FTI</span>
            </h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Publikasi Acara, Penjadwalan &amp; Pengaturan Kuota
            </span>
          </div>
        </div>

        <Link
          href="/admin/events/new"
          className="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Acara</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => {
              const date = new Date(event.event_start_at);

              return (
                <div
                  key={event.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 uppercase">
                        {event.category.replace("_", " ")}
                      </span>
                      <span className="text-slate-500 font-medium">
                        Kuota: {event.quota} Kursi
                      </span>
                    </div>

                    <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
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
          </div>
        )}
      </main>
    </AppShell>
  );
}
