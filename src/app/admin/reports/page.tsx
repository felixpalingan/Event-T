"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  Clock, 
  Users, 
  Search,
  Filter
} from "lucide-react";

interface ReportRow {
  nim: string;
  name: string;
  prodi: string;
  angkatan: number;
  eventTitle: string;
  registeredAt: string;
  status: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  postTestScore: number | null;
}

const DEMO_REPORTS: ReportRow[] = [
  {
    nim: "065002100012",
    name: "Felix Palingan",
    prodi: "Teknik Informatika",
    angkatan: 2024,
    eventTitle: "AI Engineering & Modern Cloud Architecture",
    registeredAt: "2026-10-19T04:00:00Z",
    status: "ATTENDED",
    isCheckedIn: true,
    checkedInAt: "2026-10-24T08:52:10Z",
    postTestScore: 90,
  },
  {
    nim: "065002100034",
    name: "Aditya Pratama",
    prodi: "Sistem Informasi",
    angkatan: 2024,
    eventTitle: "AI Engineering & Modern Cloud Architecture",
    registeredAt: "2026-10-19T06:30:00Z",
    status: "CONFIRMED",
    isCheckedIn: false,
    checkedInAt: null,
    postTestScore: null,
  },
  {
    nim: "065002200088",
    name: "Siti Nurhaliza",
    prodi: "Teknik Komputer",
    angkatan: 2023,
    eventTitle: "AI Engineering & Modern Cloud Architecture",
    registeredAt: "2026-10-19T07:15:00Z",
    status: "CONFIRMED",
    isCheckedIn: false,
    checkedInAt: null,
    postTestScore: null,
  },
];

export default function AdminReportsPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<ReportRow[]>(DEMO_REPORTS);
  const [search, setSearch] = useState("");

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = [
      "NIM",
      "Nama Mahasiswa",
      "Program Studi",
      "Angkatan",
      "Nama Acara",
      "Waktu Mendaftar",
      "Status Kehadiran",
      "Waktu Check-In",
      "Skor Post-Test",
    ];

    const csvLines = [headers.join(",")];

    rows.forEach((r) => {
      const line = [
        `"${r.nim}"`,
        `"${r.name}"`,
        `"${r.prodi}"`,
        r.angkatan,
        `"${r.eventTitle}"`,
        `"${r.registeredAt}"`,
        `"${r.isCheckedIn ? "HADIR" : "TIDAK HADIR"}"`,
        `"${r.checkedInAt || "-"}"`,
        r.postTestScore ?? "Belum Tes",
      ];
      csvLines.push(line.join(","));
    });

    const csvBlob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rekap_Kehadiran_FTI_Trisakti_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.nim.toLowerCase().includes(search.toLowerCase()) ||
      r.prodi.toLowerCase().includes(search.toLowerCase())
  );

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
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Laporan &amp; Rekapitulasi</span>
            </h1>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              Ekspor Data Peserta &amp; Evaluasi
            </span>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>CSV</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari NIM, Nama, atau Program Studi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 outline-none transition-colors"
          />
        </div>

        {/* Quick Summary Pill */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Total Baris Terdata:</span>
            <span className="font-bold text-slate-900 ml-1.5">{filtered.length} Mahasiswa</span>
          </div>
          <button
            onClick={handleExportCSV}
            className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Excel (.CSV)</span>
          </button>
        </div>

        {/* Table Rows Card */}
        <div className="space-y-2.5">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                  <span className="text-[11px] font-mono text-blue-700 font-semibold">
                    NIM: {item.nim} • {item.prodi}
                  </span>
                </div>
                {item.isCheckedIn ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    HADIR
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    TIDAK HADIR
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Skor Tes:{" "}
                  <strong className={item.postTestScore ? "text-slate-800" : "text-slate-400"}>
                    {item.postTestScore ? `${item.postTestScore}/100` : "Belum Mengerjakan"}
                  </strong>
                </span>
                <span>
                  Check-in:{" "}
                  {item.checkedInAt
                    ? new Date(item.checkedInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                    : "-"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
