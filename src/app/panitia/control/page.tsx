"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Settings2, 
  Lock, 
  Unlock, 
  Users, 
  Award, 
  CheckCircle2, 
  Calendar,
  AlertCircle
} from "lucide-react";

interface EventControlItem {
  id: number;
  title: string;
  category: string;
  venue: string;
  quota: number;
  registeredCount: number;
  attendedCount: number;
  is_post_test_open: boolean;
}

const DEMO_EVENTS: EventControlItem[] = [
  {
    id: 1,
    title: "AI Engineering & Modern Cloud Architecture at Scale",
    category: "SEMINAR",
    venue: "Auditorium FTI Lt. 8 Gedung H",
    quota: 120,
    registeredCount: 114,
    attendedCount: 88,
    is_post_test_open: true,
  },
  {
    id: 2,
    title: "Workshop Hands-On: Fullstack Next.js & Supabase",
    category: "WORKSHOP",
    venue: "Lab Komputer 3, Gedung H",
    quota: 50,
    registeredCount: 50,
    attendedCount: 0,
    is_post_test_open: false,
  },
];

export default function EventControlPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventControlItem[]>(DEMO_EVENTS);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleTogglePostTest = async (eventId: number, currentStatus: boolean) => {
    setUpdatingId(eventId);
    const newStatus = !currentStatus;

    try {
      await supabase
        .from("events")
        .update({ is_post_test_open: newStatus })
        .eq("id", eventId);

      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, is_post_test_open: newStatus } : e
        )
      );

      setMessage(
        newStatus
          ? "Gembok Post-Test DIBUKA! Mahasiswa yang sudah hadir kini dapat mengerjakan kuis."
          : "Gembok Post-Test DIKUNCI! Akses pengerjaan kuis ditutup sementara."
      );
    } catch {
      setMessage("Gagal mengubah status post-test.");
    } finally {
      setUpdatingId(null);
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
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              <span>Kontrol Sesi Kegiatan</span>
            </h1>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              Gembok Ujian &amp; Alur Acara
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
          <strong className="block font-semibold mb-0.5">Petunjuk Panitia Acara:</strong>
          Buka gembok Post-Test saat narasumber selesai memaparkan materi agar peserta dapat mengerjakan evaluasi untuk mengunduh e-sertifikat.
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                  {event.category}
                </span>
                <span className="text-slate-500 font-medium">
                  {event.venue}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {event.title}
              </h3>

              {/* Attendance metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Terdaftar</span>
                  <span className="text-sm font-bold text-slate-800">{event.registeredCount} / {event.quota}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="block text-[10px] text-emerald-600 uppercase font-bold">Sudah Hadir</span>
                  <span className="text-sm font-bold text-emerald-800">{event.attendedCount} Mahasiswa</span>
                </div>
              </div>

              {/* Post-Test Control Switch */}
              <div className="pt-2 flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  {event.is_post_test_open ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Unlock className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Akses Post-Test Peserta
                    </span>
                    <span className={`block text-[10px] font-medium ${
                      event.is_post_test_open ? "text-emerald-700 font-semibold" : "text-amber-700"
                    }`}>
                      {event.is_post_test_open ? "Terbuka (Bisa Dikerjakan)" : "Terkunci (Belum Dibuka)"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleTogglePostTest(event.id, event.is_post_test_open)}
                  disabled={updatingId === event.id}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-2xs ${
                    event.is_post_test_open
                      ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {event.is_post_test_open ? "Kunci Akses" : "Buka Post-Test"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
