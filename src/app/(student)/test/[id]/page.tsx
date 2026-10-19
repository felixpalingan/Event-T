"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  HelpCircle, 
  CheckCircle2, 
  Loader2, 
  Award,
  Send,
  Lock,
  QrCode,
  AlertTriangle,
  FileCheck2,
  Sparkles
} from "lucide-react";

interface Question {
  id: number;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

interface EventData {
  id: number;
  title: string;
  is_post_test_open: boolean;
}

interface TicketData {
  id: number;
  is_checked_in: boolean;
  status: string;
}

function TestScreenContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = Number(resolvedParams.id);

  const supabase = createClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [hasTicket, setHasTicket] = useState<boolean | null>(null);
  const [testType, setTestType] = useState<"PRE" | "POST">("PRE");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preScore, setPreScore] = useState<number | null>(null);
  const [postScore, setPostScore] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userProfile, setUserProfile] = useState<{ nim_nidn: string; name: string } | null>(null);

  useEffect(() => {
    fetchEventAndQuestions();

    // Realtime listener for event status (specifically is_post_test_open)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    try {
      channel = supabase
        .channel(`event_test_sync_${eventId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "events",
            filter: `id=eq.${eventId}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (payload?.new) {
              setEvent((prev) =>
                prev ? { ...prev, is_post_test_open: Boolean(payload.new.is_post_test_open) } : null
              );
            }
          }
        )
        .subscribe();
    } catch {
      // Fallback
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchEventAndQuestions = async () => {
    setLoading(true);
    try {
      // 1. Fetch Event
      const { data: eventData } = await supabase
        .from("events")
        .select("id, title, is_post_test_open")
        .eq("id", eventId)
        .single();

      if (eventData) {
        setEvent(eventData);
      }

      // 2. Fetch Questions
      const { data: questionsData } = await supabase
        .from("event_questions")
        .select("*")
        .eq("event_id", eventId)
        .order("question_number", { ascending: true });

      setQuestions(questionsData || []);

      // 3. Check User, Ticket & Scores
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch user profile
        const { data: prof } = await supabase
          .from("profiles")
          .select("name, nim_nidn")
          .eq("id", user.id)
          .single();
        if (prof) setUserProfile(prof);

        // Fetch ticket
        const { data: ticketData } = await supabase
          .from("tickets")
          .select("id, is_checked_in, status")
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .maybeSingle();

        if (ticketData) {
          setTicket(ticketData);
          setHasTicket(true);
        } else {
          setHasTicket(false);
        }

        // Fetch test scores
        const { data: scoreData } = await supabase
          .from("user_test_scores")
          .select("pre_test_score, post_test_score")
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .maybeSingle();

        if (scoreData) {
          setPreScore(scoreData.pre_test_score);
          setPostScore(scoreData.post_test_score);
          // If pre-test already done but post-test not done, default to POST tab
          if (scoreData.pre_test_score !== null && scoreData.post_test_score === null) {
            setTestType("POST");
          }
        }
      } else {
        setHasTicket(false);
      }
    } catch (err) {
      console.error("Error loading test:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qNum: number, choice: string) => {
    setAnswers((prev) => ({ ...prev, [qNum]: choice }));
  };

  const currentScore = testType === "PRE" ? preScore : postScore;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) return;

    // Check if all answered
    const unanswered = questions.filter((q) => !answers[q.question_number]);
    if (unanswered.length > 0) {
      setMessage({
        type: "error",
        text: `Harap jawab semua soal! Masih ada ${unanswered.length} butir belum diisi.`,
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Calculate score
      let correctCount = 0;
      questions.forEach((q) => {
        if (answers[q.question_number] === q.correct_answer) {
          correctCount++;
        }
      });

      const calculatedScore = Math.round((correctCount / questions.length) * 100);

      // Upsert into user_test_scores
      const updatePayload: Record<string, unknown> = {
        user_id: user.id,
        event_id: eventId,
      };

      if (testType === "PRE") {
        updatePayload.pre_test_score = calculatedScore;
        updatePayload.pre_test_submitted_at = new Date().toISOString();
      } else {
        updatePayload.post_test_score = calculatedScore;
        updatePayload.post_test_submitted_at = new Date().toISOString();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from("user_test_scores")
        .upsert(updatePayload as any, { onConflict: "user_id,event_id" });

      if (error) {
        setMessage({ type: "error", text: error.message || "Gagal menyimpan jawaban." });
      } else {
        if (testType === "PRE") {
          setPreScore(calculatedScore);
          setMessage({
            type: "success",
            text: `Jawaban Pre-Test berhasil dikirim! Nilai awal Anda: ${calculatedScore}/100. Silakan ikuti pemaparan materi acara.`,
          });
        } else {
          setPostScore(calculatedScore);

          // TASK 3.3: CERTIFICATE AUTO-MINT ON POST-TEST SUBMIT
          // Student gets certificate simply by being checked in and completing post-test (NO score >= 60 threshold required)
          if (ticket?.is_checked_in) {
            const certNo = `CERT-FTI/${new Date().getFullYear()}/${String(eventId).padStart(3, "0")}/${userProfile?.nim_nidn?.slice(-4) || String(Math.floor(1000 + Math.random() * 9000))}`;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await supabase.from("certificates").upsert({
                certificate_no: certNo,
                user_id: user.id,
                event_id: eventId,
                issued_at: new Date().toISOString(),
              } as any, { onConflict: "user_id,event_id" });
            } catch {
              // Ignore duplicate
            }
          }

          setMessage({
            type: "success",
            text: `Selamat! Jawaban Post-Test berhasil dikirim (Skor: ${calculatedScore}/100). E-Sertifikat resmi Anda telah diterbitkan!`,
          });
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: "error", text: error.message || "Terjadi kesalahan." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell showBottomNav={false}>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <Link href="/tickets" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform flex items-center gap-1 text-xs">
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Tiket</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">Evaluasi Pemahaman</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4 max-w-xl mx-auto w-full">
        {/* Title */}
        <div>
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block mb-0.5">
            Evaluasi Pemahaman Mahasiswa
          </span>
          <h1 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
            {event?.title || "Evaluasi Kegiatan FTI Trisakti"}
          </h1>
        </div>

        {/* Tab Switcher: Pre-Test vs Post-Test */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setTestType("PRE");
              setMessage(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
              testType === "PRE"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Pre-Test (Awal)</span>
            {preScore !== null && (
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-[10px] text-blue-700 font-mono font-bold">
                {preScore}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setTestType("POST");
              setMessage(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
              testType === "POST"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Post-Test (Akhir)</span>
            {postScore !== null && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-[10px] text-emerald-700 font-mono font-bold">
                {postScore}
              </span>
            )}
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-red-50 border border-red-200 text-red-900"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : hasTicket === false ? (
          /* GATING CASE 1: Not registered for this event */
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center shadow-xs space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Belum Terdaftar pada Acara Ini</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Anda harus mendaftar dan mengklaim tiket kegiatan ini terlebih dahulu sebelum dapat mengakses lembar evaluasi.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              Klaim Tiket di Halaman Kegiatan
            </Link>
          </div>
        ) : !ticket?.is_checked_in ? (
          /* GATING CASE 2 (TASK 3.1): PRE-TEST & POST-TEST REQUIRE DOOR CHECK-IN */
          <div className="p-6 rounded-3xl bg-white border border-amber-200 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Presensi Pintu Masuk Diperlukan</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Untuk membuka lembar <strong>{testType === "PRE" ? "Pre-Test" : "Post-Test"}</strong>, Anda harus melakukan presensi scan kode QR di pintu registrasi aula terlebih dahulu.
            </p>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 max-w-xs mx-auto">
              Tunjukkan QR tiket di ponsel Anda kepada panitia bertugas di meja gerbang aula.
            </div>
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
            >
              <QrCode className="w-4 h-4" />
              <span>Buka QR Boarding Pass Tiket</span>
            </Link>
          </div>
        ) : currentScore !== null ? (
          /* CASE 3: Already completed the active test */
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Hasil {testType === "PRE" ? "Pre-Test" : "Post-Test"} Anda
              </h3>
              <div className="text-4xl font-extrabold text-blue-600 mt-1">
                {currentScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              {testType === "POST" 
                ? "Selamat! Anda telah menyelesaikan seluruh rangkaian evaluasi kegiatan FTI Trisakti. E-Sertifikat resmi kelulusan Anda telah diterbitkan."
                : "Nilai awal Anda telah tersimpan sebagai tolok ukur pemahaman sebelum pemaparan materi dimulai. Silakan ikuti kegiatan hingga selesai."}
            </p>

            {/* If Pre-Test done, suggest Post-Test */}
            {testType === "PRE" && (
              <button
                type="button"
                onClick={() => setTestType("POST")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
              >
                <span>Lanjut ke Post-Test Akhir</span>
              </button>
            )}

            {/* If Post-Test done, directly download certificate */}
            {testType === "POST" && (
              <Link
                href="/certificates"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
              >
                <Award className="w-4 h-4" />
                <span>Unduh E-Sertifikat Resmi</span>
              </Link>
            )}
          </div>
        ) : testType === "POST" && preScore === null ? (
          /* GATING CASE 4: Post-Test requested before completing Pre-Test */
          <div className="p-6 rounded-3xl bg-white border border-blue-200 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Selesaikan Pre-Test Terlebih Dahulu</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Anda belum mengisi lembar Pre-Test awal. Silakan kerjakan Pre-Test terlebih dahulu sebelum melanjutkan ke sesi Post-Test.
            </p>
            <button
              type="button"
              onClick={() => setTestType("PRE")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
            >
              <span>Buka Lembar Pre-Test</span>
            </button>
          </div>
        ) : testType === "POST" && !event?.is_post_test_open ? (
          /* GATING CASE 5 (TASK 3.2): Post-Test locked by Panitia */
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Akses Post-Test Masih Terkunci</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Panitia acara akan membuka akses evaluasi ini secara serentak ketika narasumber selesai memaparkan materi. Halaman ini akan terbuka otomatis begitu gembok dibuka oleh panitia.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Menunggu Pembukaan Sesi oleh Panitia...</span>
            </div>
          </div>
        ) : questions.length === 0 ? (
          /* CASE 6: No questions created yet */
          <div className="text-center py-10 px-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              Panitia belum merilis butir soal evaluasi untuk acara ini.
            </p>
          </div>
        ) : (
          /* CASE 7: Ready to answer test! */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Lembar Soal {testType === "PRE" ? "Pre-Test (Awal)" : "Post-Test (Akhir)"}</span>
              </span>
              <span className="font-mono text-blue-700 font-bold">
                {Object.keys(answers).length} / {questions.length} Terjawab
              </span>
            </div>

            {questions.map((q) => {
              const currentAnswer = answers[q.question_number];

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      Soal #{q.question_number}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Bobot: {Math.round(100 / questions.length)} Poin
                    </span>
                  </div>

                  <p className="text-xs md:text-sm font-semibold text-slate-900 mb-3 leading-relaxed">
                    {q.question_text}
                  </p>

                  {/* Options A, B, C, D */}
                  <div className="space-y-2">
                    {[
                      { key: "A", text: q.option_a },
                      { key: "B", text: q.option_b },
                      { key: "C", text: q.option_c },
                      { key: "D", text: q.option_d },
                    ].map(({ key, text }) => {
                      const isSelected = currentAnswer === key;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectAnswer(q.question_number, key)}
                          className={`w-full p-3 rounded-xl text-left text-xs font-medium border flex items-center gap-2.5 active:scale-[0.99] transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-600 text-blue-900 shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {key}
                          </span>
                          <span className="leading-snug">{text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Jawaban...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Jawaban {testType === "PRE" ? "Pre-Test" : "Post-Test"}</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </AppShell>
  );
}

export default function TestScreen({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
          Memuat data soal evaluasi...
        </div>
      }
    >
      <TestScreenContent params={params} />
    </Suspense>
  );
}
