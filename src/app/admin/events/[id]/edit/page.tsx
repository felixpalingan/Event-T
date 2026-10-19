"use client";

import { useState, useEffect, use, Suspense } from "react";
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
  Save,
  Clock,
  Sparkles,
  Ticket,
  Upload,
  Bell,
  Lock,
  Unlock,
  Archive,
  ArchiveRestore,
  FileSpreadsheet,
  Image as ImageIcon
} from "lucide-react";

const CATEGORIES = [
  { value: "SEMINAR", label: "Seminar Utama" },
  { value: "WORKSHOP", label: "Workshop Praktik" },
  { value: "KULIAH_TAMU", label: "Kuliah Tamu Industri" },
  { value: "LOMBA", label: "Kompetisi / Hackathon" },
];

function EditEventContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = Number(resolvedParams.id);

  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("SEMINAR");
  const [mode, setMode] = useState("OFFLINE");
  const [venue, setVenue] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [quota, setQuota] = useState(100);
  const [skpiPoints, setSkpiPoints] = useState(2);
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [certTemplateUrl, setCertTemplateUrl] = useState("");
  const [isPostTestOpen, setIsPostTestOpen] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error || !data) {
        setErrorMsg("Kegiatan tidak ditemukan atau telah dihapus.");
        return;
      }

      setTitle(data.title || "");
      setCategory(data.category || "SEMINAR");
      setMode(data.mode || "OFFLINE");
      setVenue(data.venue || "");
      setMeetingUrl(data.meeting_url || "");
      setQuota(data.quota || 100);
      setSkpiPoints(data.skpi_points || 2);
      setDescription(data.description || "");
      setCertTemplateUrl(data.cert_template_url || "");
      setIsPostTestOpen(Boolean(data.is_post_test_open));
      setIsArchived(Boolean(data.is_archived));

      if (data.event_start_at) {
        const d = new Date(data.event_start_at);
        // Format to YYYY-MM-DDTHH:mm
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
        setEventDate(localISOTime);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Gagal memuat detail kegiatan.");
    } finally {
      setLoading(false);
    }
  };

  // Upload certificate template image to Supabase Storage
  const handleUploadCertTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTemplate(true);
    setErrorMsg("");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `template_${eventId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("certificates-templates")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("certificates-templates")
        .getPublicUrl(fileName);

      setCertTemplateUrl(publicUrl);
      setFeedbackMsg("Gambar template sertifikat berhasil diunggah!");
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(`Gagal mengunggah template: ${error.message}`);
    } finally {
      setUploadingTemplate(false);
      e.target.value = "";
    }
  };

  // Broadcast in-app notification to all students
  const handleBroadcastNotification = async () => {
    if (!confirm(`Kirimkan notifikasi pengumuman acara "${title}" ke SELURUH akun mahasiswa sekarang?`)) {
      return;
    }

    setBroadcasting(true);
    try {
      const { data, error } = await supabase.rpc("broadcast_event_notification", {
        p_event_id: eventId,
      });

      if (error) {
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = data as any;
      setFeedbackMsg(res?.message || "Notifikasi berhasil disiarkan ke seluruh mahasiswa!");
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(`Gagal menyiarkan notifikasi: ${error.message}`);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const startDate = new Date(eventDate);
      const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
      const regClose = new Date(startDate.getTime() - 2 * 60 * 60 * 1000);

      const { error } = await supabase
        .from("events")
        .update({
          title,
          slug,
          category,
          mode,
          venue,
          meeting_url: mode !== "OFFLINE" ? meetingUrl : null,
          quota: Number(quota),
          skpi_points: Number(skpiPoints),
          description,
          cert_template_url: certTemplateUrl.trim() || null,
          event_start_at: startDate.toISOString(),
          event_end_at: endDate.toISOString(),
          reg_close_at: regClose.toISOString(),
          is_post_test_open: isPostTestOpen,
          is_archived: isArchived,
        })
        .eq("id", eventId);

      if (error) {
        setErrorMsg(error.message || "Gagal memperbarui kegiatan.");
      } else {
        setFeedbackMsg("Perubahan acara berhasil disimpan!");
        setTimeout(() => {
          router.push("/admin/events");
          router.refresh();
        }, 1200);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell maxWidth="default">
      {/* Header & Breadcrumb */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/admin/events" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden" title="Kembali ke Kelola Acara">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <Link href="/admin" className="hover:text-blue-600 transition-colors">Dashboard Admin</Link>
              <span>/</span>
              <Link href="/admin/events" className="hover:text-blue-600 transition-colors">Kelola Acara</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Edit Acara #{eventId}</span>
            </div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Edit Informasi Kegiatan Acara</span>
            </h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Pengaturan Jadwal, Kuota, Gembok Tes &amp; Template Sertifikat
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/events"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 hidden md:inline-flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </Link>

          <button
            type="button"
            onClick={handleBroadcastNotification}
            disabled={broadcasting}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs"
            title="Kirim pengumuman acara ini ke lonceng notifikasi seluruh mahasiswa"
          >
            {broadcasting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="hidden sm:inline">Broadcast Notifikasi</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
            <span className="text-sm">Memuat data kegiatan...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Form Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 md:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
                {errorMsg && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-medium">{errorMsg}</span>
                  </div>
                )}

                {feedbackMsg && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs font-semibold shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{feedbackMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {/* Title */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Judul Kegiatan Acara <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Seminar Nasional AI & Rekayasa Cloud 2026"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {/* Category & Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Kategori Kegiatan</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 outline-none shadow-2xs cursor-pointer font-medium"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pelaksanaan</label>
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-center font-semibold text-[11px]">
                        {["OFFLINE", "ONLINE", "HYBRID"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={`py-1.5 rounded-lg transition-all ${
                              mode === m ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-500"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Venue & Meeting Link */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Lokasi / Ruangan Kampus <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="Contoh: Auditorium Gedung H Lantai 8, Kampus A Usakti"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {mode !== "OFFLINE" && (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tautan Zoom / GMeet Acara</label>
                      <input
                        type="url"
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                        placeholder="https://zoom.us/j/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all shadow-2xs"
                      />
                    </div>
                  )}

                  {/* Quota & SKPI Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Kuota Kursi Mahasiswa</label>
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={quota}
                        onChange={(e) => setQuota(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 outline-none shadow-2xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Poin SKPI Trisakti</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={skpiPoints}
                        onChange={(e) => setSkpiPoints(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 outline-none shadow-2xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Event Start Date */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Waktu Mulai Acara <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 outline-none shadow-2xs font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Deskripsi Singkat &amp; Silabus</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Uraikan agenda materi, profil narasumber, dan informasi penting bagi peserta..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all shadow-2xs leading-relaxed"
                    />
                  </div>

                  {/* CERTIFICATE TEMPLATE SECTION */}
                  <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span>Background Template E-Sertifikat Acara</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Rekomendasi A4 Landscape (1920x1080 / JPG/PNG)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={certTemplateUrl}
                        onChange={(e) => setCertTemplateUrl(e.target.value)}
                        placeholder="Tempel URL gambar atau unggah berkas template di samping..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 outline-none text-xs font-mono shadow-2xs"
                      />

                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadCertTemplate}
                          disabled={uploadingTemplate}
                          className="hidden"
                        />
                        <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95">
                          {uploadingTemplate ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>Unggah</span>
                        </div>
                      </label>
                    </div>

                    {certTemplateUrl && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                        <img
                          src={certTemplateUrl}
                          alt="Pratinjau Template"
                          className="w-20 h-14 object-cover rounded-lg border border-slate-300 shadow-2xs"
                        />
                        <div className="min-w-0 flex-1 text-[11px]">
                          <span className="font-semibold text-slate-800 block truncate">Template Sertifikat Aktif</span>
                          <span className="text-slate-400 font-mono truncate block text-[10px]">{certTemplateUrl}</span>
                          <button
                            type="button"
                            onClick={() => setCertTemplateUrl("")}
                            className="text-red-600 hover:text-red-800 font-semibold mt-0.5 text-[10px]"
                          >
                            Hapus Template (Gunakan Fallback Trisakti)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operational Controls: Post-Test Gate & Archive Toggle */}
                  <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Gembok Post-Test</span>
                        <span className="text-[10px] text-slate-500">Buka akses pengerjaan kuis peserta</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPostTestOpen(!isPostTestOpen)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                          isPostTestOpen
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-700 border border-slate-300"
                        }`}
                      >
                        {isPostTestOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{isPostTestOpen ? "Terbuka" : "Terkunci"}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Status Katalog</span>
                        <span className="text-[10px] text-slate-500">Sembunyikan dari jelajah publik</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsArchived(!isArchived)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                          isArchived
                            ? "bg-amber-600 text-white"
                            : "bg-white text-slate-700 border border-slate-300"
                        }`}
                      >
                        {isArchived ? <Archive className="w-3.5 h-3.5" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
                        <span>{isArchived ? "Diarsipkan" : "Aktif"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan Perubahan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Simpan Perubahan Kegiatan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Live Information Card & Quick Links (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Aksi Cepat Acara Ini
                </span>

                <div className="space-y-2">
                  <Link
                    href={`/admin/reports?eventId=${eventId}`}
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-between transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Data Presensi &amp; Rekap BAAK</span>
                    </div>
                    <span>→</span>
                  </Link>

                  <Link
                    href="/panitia/scanner"
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex items-center justify-between transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Buka Scanner Presensi Pintu</span>
                    </div>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/60 to-white border border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                    {category}
                  </span>
                  <span className="text-slate-500 font-medium">{mode}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {title || "Judul Acara Belum Diisi"}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {description || "Belum ada deskripsi acara yang diinputkan."}
                </p>

                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{venue || "Lokasi belum ditentukan"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Kuota Maksimal: {quota} Mahasiswa</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Poin SKPI: {skpiPoints} Poin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <EditEventContent params={params} />
    </Suspense>
  );
}
