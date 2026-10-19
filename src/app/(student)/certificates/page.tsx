"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import { createClient } from "@/lib/supabase/client";
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ArrowLeft, 
  Clock, 
  ShieldCheck,
  FileText,
  Calendar,
  Users,
  QrCode,
  ScanLine
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
}

export default function CertificatesPage() {
  const supabase = createClient();
  const [items, setItems] = useState<CertificateItem[]>([]);
  const [studentProfile, setStudentProfile] = useState<{ name: string; nim_nidn: string; prodi: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, nim_nidn, prodi")
        .eq("id", user.id)
        .single();

      if (profile) setStudentProfile(profile);

      // Fetch user's tickets
      const { data: tickets } = await supabase
        .from("tickets")
        .select(`
          event_id,
          is_checked_in,
          event:events (
            id,
            title,
            event_start_at,
            skpi_points
          )
        `)
        .eq("user_id", user.id);

      // Fetch user's test scores
      const { data: scores } = await supabase
        .from("user_test_scores")
        .select("event_id, post_test_score")
        .eq("user_id", user.id);

      const scoreMap = new Map<number, number | null>();
      scores?.forEach((s) => {
        scoreMap.set(Number(s.event_id), s.post_test_score);
      });

      if (tickets) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const certList: CertificateItem[] = tickets.map((t: any) => {
          const ev = t.event;
          const score = scoreMap.get(Number(t.event_id));
          return {
            eventId: Number(t.event_id),
            eventTitle: ev?.title || "Seminar FTI",
            eventDate: ev?.event_start_at || new Date().toISOString(),
            skpiPoints: ev?.skpi_points || 10,
            isCheckedIn: Boolean(t.is_checked_in),
            hasPostTest: score !== undefined && score !== null,
            postTestScore: score ?? null,
            certificateNo: `CERT-FTI/2026/${String(t.event_id).padStart(3, "0")}/${profile?.nim_nidn?.slice(-4) || "0001"}`,
          };
        });

        setItems(certList);
      }
    } catch (err) {
      console.error("Error loading certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (item: CertificateItem) => {
    if (!studentProfile) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Background styling
    doc.setFillColor(11, 17, 32); // Slate 950
    doc.rect(0, 0, width, height, "F");

    // Outer decorative border
    doc.setDrawColor(30, 64, 175); // Blue 800
    doc.setLineWidth(2);
    doc.rect(10, 10, width - 20, height - 20);

    // Inner gold border
    doc.setDrawColor(217, 119, 6); // Amber 600
    doc.setLineWidth(0.8);
    doc.rect(14, 14, width - 28, height - 28);

    // Header Faculty
    doc.setFont("helvetica", "bold");
    doc.setTextColor(147, 197, 253); // Blue 300
    doc.setFontSize(14);
    doc.text("UNIVERSITAS TRISAKTI", width / 2, 28, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text("FAKULTAS TEKNOLOGI INFORMASI", width / 2, 34, { align: "center" });

    // Certificate Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text("SERTIFIKAT PENGHARGAAN", width / 2, 54, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Nomor Lisensi: ${item.certificateNo}`, width / 2, 62, { align: "center" });

    // Recipient line
    doc.setFontSize(12);
    doc.text("Diberikan kepada mahasiswa:", width / 2, 78, { align: "center" });

    // Student Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11); // Amber 500
    doc.text(studentProfile.name.toUpperCase(), width / 2, 90, { align: "center" });

    // Student NIM & Prodi
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(203, 213, 225);
    doc.text(`NIM: ${studentProfile.nim_nidn}  |  Program Studi: ${studentProfile.prodi}`, width / 2, 98, { align: "center" });

    // Event description
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text("Atas partisipasi dan kelulusan evaluasi pada kegiatan seminar / workshop:", width / 2, 114, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`"${item.eventTitle}"`, width / 2, 124, { align: "center" });

    // SKPI & Date Badges
    doc.setFontSize(11);
    doc.setTextColor(147, 197, 253);
    const dateStr = new Date(item.eventDate).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc.text(`Bobot SKPI: +${item.skpiPoints} Poin  •  Tanggal Pelaksanaan: ${dateStr}`, width / 2, 136, { align: "center" });

    // Signatures
    const sigY = 160;
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("Ketua Pelaksana Kegiatan,", 50, sigY, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("( Panitia FTI Event!t )", 50, sigY + 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Dekan Fakultas Teknologi Informasi,", width - 50, sigY, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("( Pimpinan FTI Universitas Trisakti )", width - 50, sigY + 20, { align: "center" });

    // Download file
    doc.save(`Sertifikat_${studentProfile.nim_nidn}_${item.eventId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/tickets" className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Tiket</span>
          </Link>

          <span className="font-bold text-sm bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            E-Sertifikat &amp; SKPI
          </span>

          <div className="w-8" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mode Ketat: Hadir + Post-Test</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">E-Sertifikat Resmi</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Unduh sertifikat PDF ber-SKPI setelah memenuhi dua syarat: presensi hadir dan menyelesaikan post-test.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">Belum Ada Riwayat Kegiatan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Daftar dan ikuti seminar atau workshop FTI terlebih dahulu untuk memperoleh sertifikat.
            </p>
            <Link
              href="/events"
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
            >
              Jelajahi Event
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => {
              const isEligible = item.isCheckedIn && item.hasPostTest;

              return (
                <div
                  key={item.eventId}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                        +{item.skpiPoints} Poin SKPI
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {item.certificateNo}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-3">
                      {item.eventTitle}
                    </h3>

                    {/* Checklist Requirements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Requirement 1: Checked In */}
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                        item.isCheckedIn 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-slate-950/60 border-slate-800 text-slate-400"
                      }`}>
                        {item.isCheckedIn ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>{item.isCheckedIn ? "Presensi Hadir (Valid)" : "Belum Check-In di Lokasi"}</span>
                      </div>

                      {/* Requirement 2: Post Test */}
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                        item.hasPostTest 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-slate-950/60 border-slate-800 text-slate-400"
                      }`}>
                        {item.hasPostTest ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>
                          {item.hasPostTest 
                            ? `Post-Test Selesai (${item.postTestScore}/100)`
                            : "Belum Mengerjakan Post-Test"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Download Action */}
                  <div className="shrink-0 w-full md:w-auto">
                    {isEligible ? (
                      <button
                        onClick={() => handleDownloadPDF(item)}
                        className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh PDF (.PDF)</span>
                      </button>
                    ) : (
                      <Link
                        href={`/test/${item.eventId}`}
                        className="w-full md:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700"
                      >
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>Selesaikan Syarat</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-6 py-2.5 flex items-center justify-around text-xs">
        <Link href="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <Calendar className="w-5 h-5" />
          <span>Beranda</span>
        </Link>
        <Link href="/events" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <Users className="w-5 h-5" />
          <span>Event</span>
        </Link>
        <Link href="/tickets" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <QrCode className="w-5 h-5" />
          <span>Tiket</span>
        </Link>
        <Link href="/scanner" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <ScanLine className="w-5 h-5" />
          <span>Scanner</span>
        </Link>
      </div>
    </div>
  );
}
