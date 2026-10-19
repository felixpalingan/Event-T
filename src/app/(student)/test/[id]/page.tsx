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
  Send
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

function TestScreenContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = Number(resolvedParams.id);

  const supabase = createClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [testType, setTestType] = useState<"PRE" | "POST">("PRE");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchEventAndQuestions();
  }, [eventId]);

  const fetchEventAndQuestions = async () => {
    setLoading(true);
    try {
      // 1. Fetch Event
      const { data: eventData } = await supabase
        .from("events")
        .select("title")
        .eq("id", eventId)
        .single();

      if (eventData) setEventTitle(eventData.title);

      // 2. Fetch Questions
      const { data: questionsData } = await supabase
        .from("event_questions")
        .select("*")
        .eq("event_id", eventId)
        .order("question_number", { ascending: true });

      setQuestions(questionsData || []);

      // 3. Check existing scores
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: scoreData } = await supabase
          .from("user_test_scores")
          .select("pre_test_score, post_test_score")
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .single();

        if (scoreData) {
          if (testType === "PRE" && scoreData.pre_test_score !== null) {
            setScoreResult(scoreData.pre_test_score);
          } else if (testType === "POST" && scoreData.post_test_score !== null) {
            setScoreResult(scoreData.post_test_score);
          }
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) return;

    // Check if all answered
    const unanswered = questions.filter((q) => !answers[q.question_number]);
    if (unanswered.length > 0) {
      setMessage({ type: "error", text: `Harap jawab semua soal! Masih ada ${unanswered.length} butir belum diisi.` });
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
        setScoreResult(calculatedScore);
        setMessage({
          type: "success",
          text: `Jawaban berhasil dikirim! Nilai ${testType === "PRE" ? "Pre-Test" : "Post-Test"} Anda: ${calculatedScore}/100`,
        });
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
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <Link href="/tickets" className="text-slate-400 hover:text-white p-1 -ml-1 active:scale-95 transition-transform flex items-center gap-1 text-xs">
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </Link>
        <span className="text-xs font-semibold text-slate-400">Evaluasi Pemahaman</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Title */}
        <div>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">
            Ujian Pemahaman Peserta
          </span>
          <h1 className="text-sm font-bold text-white leading-snug">
            {eventTitle || "Evaluasi Seminar / Workshop"}
          </h1>
        </div>

        {/* Tab Switcher: Pre-Test vs Post-Test */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTestType("PRE");
              setScoreResult(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold active:scale-95 transition-all ${
              testType === "PRE"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pre-Test (Awal)
          </button>
          <button
            type="button"
            onClick={() => {
              setTestType("POST");
              setScoreResult(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold active:scale-95 transition-all ${
              testType === "POST"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Post-Test (Akhir)
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                : "bg-red-950/60 border border-red-500/40 text-red-300"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Result Score Banner */}
        {scoreResult !== null && (
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-center shadow-lg">
            <h3 className="text-xs font-semibold text-slate-400">
              Hasil {testType === "PRE" ? "Pre-Test" : "Post-Test"} Anda
            </h3>
            <span className="block text-3xl font-extrabold text-amber-400 mt-1">
              {scoreResult} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </span>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {testType === "POST" 
                ? "Syarat evaluasi selesai! Anda kini dapat mengunduh E-Sertifikat jika sudah divalidasi hadir di lokasi."
                : "Nilai awal Anda telah tersimpan sebagai tolok ukur evaluasi materi."}
            </p>
            {testType === "POST" && (
              <Link
                href="/certificates"
                className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
              >
                <Award className="w-4 h-4" />
                <span>Buka Halaman E-Sertifikat</span>
              </Link>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-slate-950 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-3xl bg-slate-950 border border-slate-800">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              Panitia belum merilis butir soal evaluasi untuk acara ini.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {questions.map((q) => {
              const currentAnswer = answers[q.question_number];

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-900/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                      Soal #{q.question_number}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Bobot: {Math.round(100 / questions.length)} Poin
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-100 mb-3 leading-relaxed">
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
                              ? "bg-blue-950/60 border-blue-500 text-blue-200"
                              : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isSelected
                                ? "bg-blue-700 text-white"
                                : "bg-slate-800 text-slate-400"
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
              className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghitung Skor...</span>
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
        <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">
          Memuat data soal evaluasi...
        </div>
      }
    >
      <TestScreenContent params={params} />
    </Suspense>
  );
}
