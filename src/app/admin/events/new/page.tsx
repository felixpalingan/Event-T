"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Plus,
  Clock,
  Sparkles,
  Ticket
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
  const [eventDate, setEventDate] = useState("2026-11-20T09:00");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    setEventDate(d.toISOString().slice(0, 16));
  }, []);

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

      const { error } = await supabase.from("events").insert([
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
        }, 1200);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const previewDate = new Date(eventDate || "2026-11-20T09:00");

  return (
    <AppShell maxWidth="default">
      {/* Header & Breadcrumbs */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/admin/events" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden" title="Kembali ke Kelola Acara">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <Link href="/admin" className="hover:text-blue-600 transition-colors">Dashboard Admin</Link>
              <span>/</span>
              <Link href="/admin/events" className="hover:text-blue-600 transition-colors">Kelola Acara</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Buat Acara Baru</span>
            </div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Publikasi Acara FTI Baru</span>
            </h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Formulir Agenda Kegiatan Kampus &amp; Kuota Mahasiswa
            </span>
          </div>
        </div>

        <Link
          href="/admin/events"
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 hidden md:inline-flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar</span>
        </Link>
      </header>

      {/* Main Content: 2-Column on Desktop (Form on Left, Live Preview on Right) */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 md:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
              {errorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>Acara berhasil diterbitkan! Mengalihkan ke katalog kelola acara...</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Judul Acara */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Judul Kegiatan Acara <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Kuliah Umum AI &amp; Generative Data Science 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors shadow-2xs"
                  />
                </div>

                {/* Kategori & Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kategori Kegiatan
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs md:text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors shadow-2xs font-medium"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mode Pelaksanaan
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs md:text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors shadow-2xs font-medium"
                    >
                      <option value="OFFLINE">Tatap Muka (Offline Kampus)</option>
                      <option value="ONLINE">Daring (Online Zoom / Teams)</option>
                      <option value="HYBRID">Hybrid (Campuran Offline &amp; Online)</option>
                    </select>
                  </div>
                </div>

                {/* Ruangan & Kuota */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tempat / Ruangan Aula <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="Contoh: Auditorium Gedung H Lt. 8"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kapasitas Kuota Kursi
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="2000"
                      required
                      value={quota}
                      onChange={(e) => setQuota(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors shadow-2xs"
                    />
                    {/* Quick preset chips */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {[50, 100, 200, 500].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQuota(q)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                            quota === q 
                              ? "bg-blue-600 text-white border-blue-600" 
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Waktu Pelaksanaan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jadwal &amp; Jam Mulai Acara <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors shadow-2xs font-medium"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Pendaftaran mahasiswa akan otomatis dibuka sekarang dan ditutup 2 jam sebelum acara dimulai.
                  </span>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Deskripsi &amp; Detail Kegiatan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Rangkuman topik bahasan, profil pembicara industri, poin SKP yang didapat mahasiswa, dan ketentuan pakaian/persiapan..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors resize-none shadow-2xs"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading || successMsg}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menerbitkan Acara ke Mahasiswa...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Terbitkan Agenda Kegiatan ke Mahasiswa</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Live Preview Column (5 cols) */}
          <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-24">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Pratinjau Kartu Mahasiswa</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Tampilan di Katalog</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 uppercase text-[11px]">
                  {category.replace("_", " ")}
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                  {mode === "OFFLINE" ? "Tatap Muka" : mode === "ONLINE" ? "Zoom Online" : "Hybrid"}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {title || "Judul Acara Belum Diisi..."}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                  {description || "Deskripsi singkat topik acara dan pemaparan pembicara akan muncul di bagian ini..."}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {previewDate.toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {previewDate.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{venue || "Tempat / Ruangan Belum Diisi"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Kapasitas: {quota} Kursi Mahasiswa</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="w-full py-2.5 rounded-xl bg-blue-600/20 text-blue-800 text-xs font-bold text-center border border-blue-200 flex items-center justify-center gap-1.5">
                  <Ticket className="w-4 h-4" />
                  <span>Tombol &quot;Daftar Acara&quot; (Sisi Mahasiswa)</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-800 text-xs leading-relaxed">
              <strong className="block font-semibold mb-0.5">ℹ️ Catatan Sistem:</strong>
              Setelah diterbitkan, acara langsung dapat didaftar oleh mahasiswa FTI. Panitia dapat mengakses kontrol presensi &amp; scanner melalui menu yang disediakan.
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

