"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ArrowLeft, 
  FileText,
  Calendar,
  Sparkles,
  Loader2,
  ExternalLink
} from "lucide-react";

interface CertificateItem {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  skpiPoints: number;
  isCheckedIn: boolean;
  hasPostTest: boolean;
  postTestScore: number | null;
  certificateNo: string;
  certTemplateUrl: string | null;
}

export default function CertificatesPage() {
  const supabase = createClient();
  const [items, setItems] = useState<CertificateItem[]>([]);
  const [studentProfile, setStudentProfile] = useState<{ name: string; nim_nidn: string; prodi: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCertificatesData();
  }, []);

  const fetchCertificatesData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, nim_nidn, prodi")
        .eq("id", user.id)
        .single();

      if (profile) setStudentProfile(profile);

      // 2. Fetch tickets with event details & cert_template_url
      const { data: tickets } = await supabase
        .from("tickets")
        .select(`
          event_id,
          is_checked_in,
          event:events!tickets_event_id_fkey (
            id,
            title,
            event_start_at,
            skpi_points,
            cert_template_url
          )
        `)
        .eq("user_id", user.id);

      // 3. Fetch test scores
      const { data: scores } = await supabase
        .from("user_test_scores")
        .select("event_id, post_test_score")
        .eq("user_id", user.id);

      const scoreMap = new Map<number, number | null>();
      scores?.forEach((s) => {
        scoreMap.set(Number(s.event_id), s.post_test_score);
      });

      // 4. Fetch minted certificates
      const { data: dbCerts } = await supabase
        .from("certificates")
        .select("event_id, certificate_no, issued_at")
        .eq("user_id", user.id);

      const certMap = new Map<number, string>();
      dbCerts?.forEach((c) => {
        certMap.set(Number(c.event_id), c.certificate_no);
      });

      if (tickets && tickets.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const certList: CertificateItem[] = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tickets.map(async (t: any) => {
            const ev = t.event;
            const score = scoreMap.get(Number(t.event_id));
            let certNo = certMap.get(Number(t.event_id));

            // TASK 3.3: Student gets certificate simply by checking in + submitting post-test (NO KKM required)
            if (t.is_checked_in && score !== undefined && score !== null && !certNo) {
              certNo = `CERT-FTI/${new Date().getFullYear()}/${String(t.event_id).padStart(3, "0")}/${profile?.nim_nidn?.slice(-4) || String(Math.floor(1000 + Math.random() * 9000))}`;
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await supabase.from("certificates").upsert({
                  certificate_no: certNo,
                  user_id: user.id,
                  event_id: Number(t.event_id),
                  issued_at: new Date().toISOString(),
                } as any, { onConflict: "user_id,event_id" });
              } catch {
                // Ignore upsert error
              }
            }

            return {
              eventId: Number(t.event_id),
              eventTitle: ev?.title || "Kegiatan FTI Trisakti",
              eventDate: ev?.event_start_at || new Date().toISOString(),
              skpiPoints: ev?.skpi_points || 0,
              isCheckedIn: Boolean(t.is_checked_in),
              hasPostTest: score !== undefined && score !== null,
              postTestScore: score ?? null,
              certificateNo: certNo || `DRAFT-FTI/${String(t.event_id).padStart(3, "0")}/${profile?.nim_nidn?.slice(-4) || "0001"}`,
              certTemplateUrl: ev?.cert_template_url || null,
            };
          })
        );

        setItems(certList);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to draw official institutional fallback certificate layout
  const renderFallbackTemplate = (
    doc: jsPDF,
    item: CertificateItem,
    profile: { name: string; nim_nidn: string; prodi: string },
    width: number,
    height: number
  ) => {
    // Background: Clean Academic White
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, width, height, "F");

    // Outer Royal Navy Border
    doc.setDrawColor(29, 78, 216); // #1d4ed8
    doc.setLineWidth(2.2);
    doc.rect(12, 12, width - 24, height - 24);

    // Inner Trisakti Gold Accent Border
    doc.setDrawColor(217, 119, 6); // #d97706
    doc.setLineWidth(0.7);
    doc.rect(15.5, 15.5, width - 31, height - 31);

    // Header
    doc.setFont("helvetica", "bold");
    doc.setTextColor(29, 78, 216);
    doc.setFontSize(14);
    doc.text("UNIVERSITAS TRISAKTI", width / 2, 30, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text("FAKULTAS TEKNOLOGI INFORMASI", width / 2, 36, { align: "center" });

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("SERTIFIKAT KELULUSAN KEGIATAN", width / 2, 54, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Nomor Registrasi Lisensi: ${item.certificateNo}`, width / 2, 62, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text("Diberikan sebagai penghargaan kepada mahasiswa:", width / 2, 78, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(29, 78, 216);
    doc.text(profile.name.toUpperCase(), width / 2, 90, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`NIM: ${profile.nim_nidn}  |  Program Studi: ${profile.prodi}`, width / 2, 98, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text("Telah hadir dan menyelesaikan seluruh tahapan evaluasi pada kegiatan:", width / 2, 114, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(`"${item.eventTitle}"`, width / 2, 124, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const dateStr = new Date(item.eventDate).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc.text(`Pelaksanaan: ${dateStr}`, width / 2, 134, { align: "center" });

    // Signatures
    const sigY = 160;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Ketua Pelaksana Kegiatan,", 55, sigY, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("( Panitia FTI Event!t )", 55, sigY + 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Dekan Fakultas Teknologi Informasi,", width - 55, sigY, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("( Pimpinan FTI Universitas Trisakti )", width - 55, sigY + 18, { align: "center" });

    // Official Verification Tag
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Dokumen digital ini diverifikasi sah oleh Biro Administrasi Akademik & Kemahasiswaan (BAAK) FTI Usakti", width / 2, height - 10, { align: "center" });
  };

  // TASK 3.4: PDF Generator supporting custom event template background
  const handleDownloadPDF = async (item: CertificateItem) => {
    if (!studentProfile) return;

    setDownloadingId(item.eventId);

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      if (item.certTemplateUrl) {
        try {
          // Attempt to load custom background template image
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = item.certTemplateUrl!;
          });

          // Draw the template image filling the whole A4 canvas
          doc.addImage(img, "JPEG", 0, 0, width, height);

          // Overlay personalized student metadata on template
          // 1. Student Name (Large Bold)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(24);
          doc.setTextColor(15, 23, 42);
          doc.text(studentProfile.name.toUpperCase(), width / 2, 104, { align: "center" });

          // 2. NIM & Prodi
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(51, 65, 85);
          doc.text(`NIM: ${studentProfile.nim_nidn}   |   ${studentProfile.prodi}`, width / 2, 113, { align: "center" });

          // 3. Event Title
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(29, 78, 216);
          doc.text(`"${item.eventTitle}"`, width / 2, 128, { align: "center" });

          // 4. Date
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          const dateStr = new Date(item.eventDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          doc.text(`Jakarta, ${dateStr}`, width / 2, 136, { align: "center" });

          // 5. Verification Code Footer
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(`Nomor Sertifikat: ${item.certificateNo}`, width / 2, height - 16, { align: "center" });
        } catch (imgErr) {
          console.warn("Failed loading custom template image, rendering official Trisakti fallback layout:", imgErr);
          renderFallbackTemplate(doc, item, studentProfile, width, height);
        }
      } else {
        renderFallbackTemplate(doc, item, studentProfile, width, height);
      }

      doc.save(`Sertifikat_${studentProfile.nim_nidn}_${item.eventId}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/tickets" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 hidden md:flex items-center justify-center text-amber-700 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight">Klaim E-Sertifikat Resmi</h1>
            <span className="text-[10px] md:text-xs text-amber-700 font-semibold block">
              Sertifikat Digital PDF Berlisensi Fakultas Teknologi Informasi Trisakti
            </span>
          </div>
        </div>
        <span className="text-[10px] md:text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
          Syarat: Hadir Pintu + Selesai Post-Test
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 space-y-4">
        <div className="text-center px-2 max-w-xl mx-auto">
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            Sertifikat resmi universitas diterbitkan otomatis setelah Anda melakukan presensi scan QR di pintu aula dan mengirimkan evaluasi Post-Test.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-slate-100 rounded"></div>
                  <div className="h-4 w-32 bg-slate-100 rounded"></div>
                </div>
                <div className="h-5 w-3/4 bg-slate-100 rounded"></div>
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="h-8 bg-slate-100 rounded-xl"></div>
                  <div className="h-8 bg-slate-100 rounded-xl"></div>
                </div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center shadow-xs max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Belum Ada Sertifikat Tersedia</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Anda belum memiliki tiket kegiatan FTI. Silakan daftar ke acara kampus di halaman Kegiatan, ikuti sesi, dan selesaikan evaluasi untuk mendapatkan sertifikat.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Jelajahi Kegiatan FTI</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              // TASK 3.3: Eligible as long as checked in and post-test submitted (NO KKM required)
              const isEligible = item.isCheckedIn && item.hasPostTest;

              return (
                <div
                  key={item.eventId}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                        Sertifikat Kelulusan
                      </span>
                      <span className="font-mono text-slate-400 text-[10px]">
                        {item.certificateNo}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.eventTitle}
                    </h3>

                    {/* Requirements Checklist */}
                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                      {/* 1. Door Presensi */}
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                        item.isCheckedIn 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}>
                        {item.isCheckedIn ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="font-medium text-[11px]">
                          {item.isCheckedIn ? "Presensi Hadir (Tervalidasi Panitia Pintu)" : "Belum Check-In di Pintu Masuk"}
                        </span>
                      </div>

                      {/* 2. Post-Test Evaluation */}
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                        item.hasPostTest
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}>
                        {item.hasPostTest ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="font-medium text-[11px]">
                          {item.hasPostTest 
                            ? `Post-Test Selesai (${item.postTestScore !== null ? `Nilai: ${item.postTestScore}/100` : "Terkirim"})`
                            : "Belum Mengerjakan Post-Test"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {isEligible ? (
                      <button
                        onClick={() => handleDownloadPDF(item)}
                        disabled={downloadingId === item.eventId}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-60"
                      >
                        {downloadingId === item.eventId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Membuat Berkas PDF...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Unduh E-Sertifikat (.PDF)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/test/${item.eventId}`}
                        className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Selesaikan Post-Test</span>
                      </Link>
                    )}
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
