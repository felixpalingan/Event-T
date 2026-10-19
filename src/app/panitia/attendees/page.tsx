"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  Clock, 
  Users, 
  UserCheck, 
  ScanLine, 
  Loader2,
  RefreshCw
} from "lucide-react";

interface AttendeeItem {
  ticket_id: number;
  ticket_code: string;
  is_checked_in: boolean;
  checked_in_at: string | null;
  student_name: string;
  nim: string;
  prodi: string;
  event_title: string;
}

const DEMO_ATTENDEES: AttendeeItem[] = [
  {
    ticket_id: 1,
    ticket_code: "e5812e9b-9c2b-4fa8-b649-6f81b1d3d5f1",
    is_checked_in: true,
    checked_in_at: "2026-10-24T08:52:10Z",
    student_name: "Felix Palingan",
    nim: "065002100012",
    prodi: "Teknik Informatika",
    event_title: "AI Engineering & Modern Cloud Architecture",
  },
  {
    ticket_id: 2,
    ticket_code: "b2189d12-10fa-4b11-9a77-448123fa9901",
    is_checked_in: false,
    checked_in_at: null,
    student_name: "Aditya Pratama",
    nim: "065002100034",
    prodi: "Sistem Informasi",
    event_title: "AI Engineering & Modern Cloud Architecture",
  },
  {
    ticket_id: 3,
    ticket_code: "c7712a44-55cc-4822-bb12-9901823abce1",
    is_checked_in: false,
    checked_in_at: null,
    student_name: "Siti Nurhaliza",
    nim: "065002200088",
    prodi: "Teknik Komputer",
    event_title: "AI Engineering & Modern Cloud Architecture",
  },
];

export default function AttendeesChecklistPage() {
  const supabase = createClient();
  const [attendees, setAttendees] = useState<AttendeeItem[]>(DEMO_ATTENDEES);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ATTENDED" | "PENDING">("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleManualCheckIn = async (item: AttendeeItem) => {
    setUpdatingId(item.ticket_id);
    try {
      // In live DB, call process_ticket_checkin or update ticket
      setAttendees((prev) =>
        prev.map((a) =>
          a.ticket_id === item.ticket_id
            ? { ...a, is_checked_in: true, checked_in_at: new Date().toISOString() }
            : a
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = attendees.filter((a) => {
    const matchSearch =
      a.student_name.toLowerCase().includes(search.toLowerCase()) ||
      a.nim.toLowerCase().includes(search.toLowerCase());

    if (filter === "ATTENDED") return matchSearch && a.is_checked_in;
    if (filter === "PENDING") return matchSearch && !a.is_checked_in;
    return matchSearch;
  });

  const attendedCount = attendees.filter((a) => a.is_checked_in).length;

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
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Daftar Kehadiran Peserta</span>
            </h1>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              Portal Operasional Panitia
            </span>
          </div>
        </div>

        <Link
          href="/scanner"
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white flex items-center gap-1 shadow-xs active:scale-95 transition-all"
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>Kamera</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Attendance Counter Card */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Statistik Masuk Aula
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900">
                {attendedCount}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / {attendees.length} Mahasiswa Terdaftar
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold text-sm">
            {Math.round((attendedCount / (attendees.length || 1)) * 100)}%
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari NIM atau Nama Mahasiswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all ${
              filter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            Semua ({attendees.length})
          </button>
          <button
            onClick={() => setFilter("ATTENDED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all ${
              filter === "ATTENDED"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            Sudah Hadir ({attendedCount})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all ${
              filter === "PENDING"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            Belum Hadir ({attendees.length - attendedCount})
          </button>
        </div>

        {/* Attendees List */}
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.ticket_id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {item.student_name}
                  </h4>
                  {item.is_checked_in ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      Hadir
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                      Menunggu
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-mono text-blue-700 font-semibold mt-0.5">
                  NIM: {item.nim} • {item.prodi}
                </p>

                <p className="text-[10px] text-slate-400 mt-0.5">
                  {item.is_checked_in && item.checked_in_at
                    ? `Waktu Scan: ${new Date(item.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`
                    : "Belum melakukan scan di pintu"}
                </p>
              </div>

              {!item.is_checked_in ? (
                <button
                  onClick={() => handleManualCheckIn(item)}
                  disabled={updatingId === item.ticket_id}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 border border-slate-200 text-xs font-semibold shrink-0 active:scale-95 transition-all flex items-center gap-1"
                  title="Klik untuk check-in manual jika HP peserta habis baterai"
                >
                  {updatingId === item.ticket_id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Manual</span>
                </button>
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
