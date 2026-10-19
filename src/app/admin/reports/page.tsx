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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/admin" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 hidden md:flex items-center justify-center text-emerald-700 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Laporan &amp; Rekapitulasi Mahasiswa</span>
            </h1>
            <span className="text-[10px] md:text-xs text-emerald-700 font-semibold block">
              Ekspor Data Presensi, Hasil Evaluasi &amp; Validasi Kelulusan BAAK
            </span>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-xs active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor CSV</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 space-y-4">
        {/* Search & Export Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari NIM, Nama, atau Program Studi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 outline-none transition-colors shadow-2xs"
            />
          </div>

          <div className="p-3 md:py-2 md:px-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-slate-500">Total Baris:</span>
              <span className="font-bold text-slate-900 ml-1.5">{filtered.length} Peserta Terdata</span>
            </div>
            <button
              onClick={handleExportCSV}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Spreadsheet (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="space-y-2.5 md:hidden">
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

        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-6">Mahasiswa</th>
                <th className="py-3.5 px-6">NIM</th>
                <th className="py-3.5 px-6">Program Studi</th>
                <th className="py-3.5 px-6">Presensi Pintu</th>
                <th className="py-3.5 px-6">Waktu Masuk</th>
                <th className="py-3.5 px-6">Skor Post-Test</th>
                <th className="py-3.5 px-6 text-right">Kelayakan E-Sertifikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-6 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-6 font-mono font-semibold text-blue-700">{item.nim}</td>
                  <td className="py-3 px-6">{item.prodi}</td>
                  <td className="py-3 px-6">
                    {item.isCheckedIn ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        HADIR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                        BELUM HADIR
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-slate-500 font-mono text-[11px]">
                    {item.checkedInAt
                      ? new Date(item.checkedInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                      : "-"}
                  </td>
                  <td className="py-3 px-6 font-semibold">
                    {item.postTestScore ? (
                      <span className="text-slate-900 font-mono">{item.postTestScore}/100</span>
                    ) : (
                      <span className="text-slate-400 italic">Belum Mengisi</span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-right">
                    {item.isCheckedIn && item.postTestScore ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]">
                        LULUS &amp; SIAP UNDUH
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                        BELUM MEMENUHI
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </AppShell>
  );
}
