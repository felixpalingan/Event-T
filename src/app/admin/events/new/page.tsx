"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Plus
} from "lucide-react";

const CATEGORIES = [
  { value: "SEMINAR", label: "Seminar Utama" },
  { value: "WORKSHOP", label: "Workshop Praktik" },
  { value: "KULIAH_TAMU", label: "Kuliah Tamu Industri" },
  { value: "LOMBA", label: "Kompetisi / Hackathon" },
];

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("SEMINAR");
  const [mode, setMode] = useState("OFFLINE");
  const [venue, setVenue] = useState("");
  const [quota, setQuota] = useState(100);
  const [eventDate, setEventDate] = useState("2026-11-15T09:00");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const startDate = new Date(eventDate);
      const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
      const regOpen = new Date();
      const regClose = new Date(startDate.getTime() - 2 * 60 * 60 * 1000);

      const { data, error } = await supabase.from("events").insert([
        {
          title,
          slug,
          category,
          mode,
          venue,
          quota: Number(quota),
          description,
          event_start_at: startDate.toISOString(),
          event_end_at: endDate.toISOString(),
          reg_open_at: regOpen.toISOString(),
          reg_close_at: regClose.toISOString(),
          is_archived: false,
          is_post_test_open: false,
        },
      ]);

      if (error) {
        setErrorMsg(error.message || "Gagal membuat acara.");
      } else {
        setSuccessMsg(true);
        setTimeout(() => {
          router.push("/admin/events");
          router.refresh();
        }, 1500);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell showBottomNav={false}>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <Link href="/admin/events" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform flex items-center gap-1 text-xs">
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">Publikasi Acara Baru</span>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 px-4 py-5">
        <div className="mb-4">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Form Pembuatan Acara FTI
          </h1>
          <p className="text-xs text-slate-500">
            Acara yang diterbitkan langsung muncul pada katalog mahasiswa.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Acara berhasil diterbitkan! Mengalihkan ke daftar acara...</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Judul Acara */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Judul Kegiatan Acara
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kuliah Umum AI & Data Science 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors"
              />
            </div>

            {/* Kategori & Mode */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mode Pelaksanaan
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                >
                  <option value="OFFLINE">Tatap Muka (Offline)</option>
                  <option value="ONLINE">Daring (Online Zoom)</option>
                  <option value="HYBRID">Hybrid (Campuran)</option>
                </select>
              </div>
            </div>

            {/* Lokasi / Ruang Aula & Kuota */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tempat / Ruangan
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Auditorium Lt. 8 Gedung H"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kapasitas Kuota
                </label>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  required
                  value={quota}
                  onChange={(e) => setQuota(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Waktu Pelaksanaan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Jadwal &amp; Jam Mulai
              </label>
              <input
                type="datetime-local"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Deskripsi Singkat Acara
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rangkuman topik bahasan, pembicara tamu, dan ketentuan khusus peserta..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || successMsg}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menerbitkan Acara...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Terbitkan Kegiatan ke Mahasiswa</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </AppShell>
  );
}
