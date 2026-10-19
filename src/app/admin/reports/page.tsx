"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  Users, 
  Search,
  RefreshCw,
  X,
  Copy,
  Check
} from "lucide-react";

interface ReportRow {
  ticketId: number;
  nim: string;
  name: string;
  prodi: string;
  angkatan: number;
  eventId: number;
  eventTitle: string;
  registeredAt: string;
  status: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  postTestScore: number | null;
  certificateNo: string | null;
}

interface EventOption {
  id: number;
  title: string;
}

function AdminReportsContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const urlEventId = searchParams.get("eventId");

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [eventsList, setEventsList] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId || "ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [copiedNim, setCopiedNim] = useState<string | null>(null);

  // Sync if URL param changes
  useEffect(() => {
    if (urlEventId) {
      setSelectedEventId(urlEventId);
    }
  }, [urlEventId]);

  useEffect(() => {
    fetchReportData(true);

    // Setup realtime listener for tickets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    try {
      channel = supabase
        .channel("admin_reports_realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tickets",
          },
          () => {
            fetchReportData(false);
          }
        )
        .subscribe();
    } catch {
      // Ignore
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchReportData = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      // 1. Fetch Events for filter dropdown
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title")
        .order("id", { ascending: true });

      if (eventsData) setEventsList(eventsData);

      // 2. Fetch Tickets joined with profiles and events
      const { data: ticketsData, error: tErr } = await supabase
        .from("tickets")
        .select(`
          id,
          user_id,
          event_id,
          ticket_code,
          status,
          is_checked_in,
          checked_in_at,
          created_at,
          profile:profiles!tickets_user_id_fkey (
            name,
            nim_nidn,
            prodi,
            angkatan
          ),
          event:events!tickets_event_id_fkey (
            id,
            title
          )
        `)
        .order("created_at", { ascending: false });

      if (tErr) throw tErr;

      // 3. Fetch Test Scores
      const { data: scoresData } = await supabase
        .from("user_test_scores")
        .select("user_id, event_id, post_test_score");

      const scoreMap = new Map<string, number | null>();
      scoresData?.forEach((s) => {
        scoreMap.set(`${s.user_id}_${s.event_id}`, s.post_test_score);
      });

      // 4. Fetch Minted Certificates
      const { data: certsData } = await supabase
        .from("certificates")
        .select("user_id, event_id, certificate_no");

      const certMap = new Map<string, string>();
      certsData?.forEach((c) => {
        certMap.set(`${c.user_id}_${c.event_id}`, c.certificate_no);
      });

      if (ticketsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: ReportRow[] = ticketsData.map((t: any) => {
          const key = `${t.user_id}_${t.event_id}`;
          const postScore = scoreMap.get(key) ?? null;
          const certNo = certMap.get(key) ?? null;

          return {
            ticketId: t.id,
            nim: t.profile?.nim_nidn || "-",
            name: t.profile?.name || "Mahasiswa FTI",
            prodi: t.profile?.prodi || "Teknik Informatika",
            angkatan: t.profile?.angkatan || 2024,
            eventId: Number(t.event_id),
            eventTitle: t.event?.title || "Kegiatan FTI",
            registeredAt: t.created_at,
            status: t.status,
            isCheckedIn: Boolean(t.is_checked_in),
            checkedInAt: t.checked_in_at,
            postTestScore: postScore,
            certificateNo: certNo,
          };
        });

        setRows(mapped);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNim = (nim: string) => {
    navigator.clipboard.writeText(nim);
    setCopiedNim(nim);
    setTimeout(() => setCopiedNim(null), 2000);
  };

  const handleExportCSV = () => {
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
      "Status E-Sertifikat",
      "Nomor Sertifikat",
    ];

    const csvLines = [headers.join(",")];

    filtered.forEach((r) => {
      const isCertified = r.isCheckedIn && (r.postTestScore ?? 0) >= 60;
      const line = [
        `"${r.nim}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.prodi.replace(/"/g, '""')}"`,
        r.angkatan,
        `"${r.eventTitle.replace(/"/g, '""')}"`,
        `"${new Date(r.registeredAt).toLocaleString("id-ID")}"`,
        `"${r.isCheckedIn ? "HADIR" : "BELUM HADIR"}"`,
        `"${r.checkedInAt ? new Date(r.checkedInAt).toLocaleString("id-ID") : "-"}"`,
        r.postTestScore !== null ? r.postTestScore : "Belum Mengisi",
        `"${isCertified ? "LULUS" : "BELUM LULUS"}"`,
        `"${r.certificateNo || "-"}"`,
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

  // Filter pipeline
  const filtered = rows.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.nim.toLowerCase().includes(search.toLowerCase()) ||
      r.prodi.toLowerCase().includes(search.toLowerCase()) ||
      r.eventTitle.toLowerCase().includes(search.toLowerCase());

    const matchEvent = selectedEventId === "ALL" || r.eventId === Number(selectedEventId);

    let matchStatus = true;
    if (selectedStatus === "HADIR") matchStatus = r.isCheckedIn;
    if (selectedStatus === "BELUM_HADIR") matchStatus = !r.isCheckedIn;
    if (selectedStatus === "LULUS") matchStatus = r.isCheckedIn && (r.postTestScore ?? 0) >= 60;

    return matchSearch && matchEvent && matchStatus;
  });

  const totalRegistered = filtered.length;
  const totalAttended = filtered.filter((r) => r.isCheckedIn).length;
  const totalCertified = filtered.filter((r) => r.isCheckedIn && (r.postTestScore ?? 0) >= 60).length;

  const activeFilteredEventObj = eventsList.find((e) => String(e.id) === selectedEventId);

  return (
    <AppShell>
      {/* Header & Breadcrumb */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/admin" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden" title="Kembali ke Dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 hidden md:flex items-center justify-center text-emerald-700 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <Link href="/admin" className="hover:text-emerald-700 transition-colors">Dashboard Admin</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Laporan &amp; Rekapitulasi</span>
            </div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Laporan &amp; Rekapitulasi Mahasiswa</span>
            </h1>
            <span className="text-[10px] md:text-xs text-emerald-700 font-semibold block">
              Ekspor Data Presensi, Hasil Evaluasi &amp; Validasi Kelulusan BAAK
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchReportData(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
            title="Muat Ulang Data Live"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center gap-2 shadow-xs active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 space-y-4">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Pendaftar
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{totalRegistered}</span>
              <span className="text-xs text-slate-500">Mahasiswa</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Hadir di Pintu
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-emerald-700">{totalAttended}</span>
              <span className="text-xs text-slate-500">
                ({totalRegistered ? Math.round((totalAttended / totalRegistered) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Lulus Sertifikat
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-blue-700">{totalCertified}</span>
              <span className="text-xs text-slate-500">
                ({totalAttended ? Math.round((totalCertified / totalAttended) * 100) : 0}% Hadir)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
              Belum Hadir
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-amber-700">
                {totalRegistered - totalAttended}
              </span>
              <span className="text-xs text-slate-500">Peserta</span>
            </div>
          </div>
        </div>

        {/* Active Event Filter Notice */}
        {selectedEventId !== "ALL" && activeFilteredEventObj && (
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-700">Filter Aktif Acara:</span>
              <span className="font-bold">{activeFilteredEventObj.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEventId("ALL")}
              className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:bg-blue-100/50 text-blue-700 font-bold flex items-center gap-1 transition-all active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tampilkan Semua Kegiatan</span>
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari NIM, Nama, atau Prodi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 outline-none transition-colors shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Event Dropdown */}
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 shadow-2xs max-w-[200px] truncate"
            >
              <option value="ALL">Semua Kegiatan</option>
              {eventsList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR">Hadir di Lokasi</option>
              <option value="BELUM_HADIR">Belum Hadir</option>
              <option value="LULUS">Lulus E-Sertifikat</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && rows.length === 0 ? (
          <div className="p-8 bg-white border border-slate-200 rounded-3xl space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center shadow-xs max-w-md mx-auto space-y-2">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">Belum Ada Rekaman Pendaftar</h3>
            <p className="text-xs text-slate-500">
              Pendaftaran mahasiswa baru akan otomatis muncul di sini secara real-time.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
            <p className="text-xs md:text-sm text-slate-500">
              Tidak ada data yang cocok dengan filter atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="space-y-2.5 md:hidden">
              {filtered.map((item) => {
                const isCertified = item.isCheckedIn && (item.postTestScore ?? 0) >= 60;

                return (
                  <div
                    key={item.ticketId}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-mono text-blue-700 font-semibold">
                            NIM: {item.nim}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyNim(item.nim)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 active:scale-95"
                            title="Salin NIM"
                          >
                            {copiedNim === item.nim ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <span className="text-[10px] text-slate-400">• {item.prodi}</span>
                        </div>
                      </div>
                      {item.isCheckedIn ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          HADIR
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          BELUM HADIR
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <strong className="block text-slate-800 truncate mb-1">{item.eventTitle}</strong>
                      <div className="flex items-center justify-between">
                        <span>
                          Post-Test:{" "}
                          <strong>
                            {item.postTestScore !== null ? `${item.postTestScore}/100` : "Belum Isi"}
                          </strong>
                        </span>
                        <span className={`font-bold ${isCertified ? "text-emerald-700" : "text-amber-700"}`}>
                          {isCertified ? "LULUS SERTIFIKAT" : "BELUM MEMENUHI"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Data Table */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-6">Mahasiswa</th>
                    <th className="py-3.5 px-6">NIM</th>
                    <th className="py-3.5 px-6">Program Studi</th>
                    <th className="py-3.5 px-6">Kegiatan</th>
                    <th className="py-3.5 px-6">Presensi Pintu</th>
                    <th className="py-3.5 px-6">Skor Post-Test</th>
                    <th className="py-3.5 px-6 text-right">E-Sertifikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((item) => {
                    const isCertified = item.isCheckedIn && (item.postTestScore ?? 0) >= 60;

                    return (
                      <tr key={item.ticketId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3.5 px-6 font-mono font-semibold text-blue-700">
                          <div className="flex items-center gap-1.5">
                            <span>{item.nim}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyNim(item.nim)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                              title="Salin NIM"
                            >
                              {copiedNim === item.nim ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          {item.prodi} ({item.angkatan})
                        </td>
                        <td className="py-3.5 px-6 max-w-[220px] truncate" title={item.eventTitle}>
                          {item.eventTitle}
                        </td>
                        <td className="py-3.5 px-6">
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
                        <td className="py-3.5 px-6 font-semibold">
                          {item.postTestScore !== null ? (
                            <span className={`font-mono ${item.postTestScore >= 60 ? "text-slate-900" : "text-red-600"}`}>
                              {item.postTestScore}/100
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Belum Mengisi</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          {isCertified ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>LULUS &amp; TERBIT</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                              BELUM MEMENUHI
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="p-12 text-center text-xs font-semibold text-slate-400 animate-pulse">
          Memuat Laporan &amp; Rekapitulasi...
        </div>
      </AppShell>
    }>
      <AdminReportsContent />
    </Suspense>
  );
}

