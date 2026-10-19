"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Award,
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
      setMessage({ type: "error", text: `Harap jawab semua soal! Masih ada ${unanswered.length} soal belum diisi.` });
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col py-8 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Back Link */}
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Tiket</span>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
            Evaluasi Pemahaman Acara
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-white mt-1">
            {eventTitle || "Evaluasi Seminar / Workshop"}
          </h1>
        </div>

        {/* Tab Switcher: Pre-Test vs Post-Test */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 mb-8">
          <button
            type="button"
            onClick={() => {
              setTestType("PRE");
              setScoreResult(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
              testType === "PRE"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
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
            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
              testType === "POST"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Post-Test (Akhir)
          </button>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border border-red-500/30 text-red-300"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Result Score Banner */}
        {scoreResult !== null && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 to-indigo-950/50 border border-blue-500/30 text-center">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">
              Hasil {testType === "PRE" ? "Pre-Test" : "Post-Test"} Anda:
            </h3>
            <span className="block text-4xl font-extrabold text-white mt-1">
              {scoreResult} <span className="text-lg text-slate-400">/ 100</span>
            </span>
            <p className="text-xs text-slate-400 mt-2">
              {testType === "POST" 
                ? "Syarat evaluasi selesai! Anda kini dapat mengunduh E-Sertifikat jika sudah check-in."
                : "Nilai awal Anda telah tersimpan sebagai pembanding evaluasi."}
            </p>
            {testType === "POST" && (
              <Link
                href="/certificates"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
              >
                <Award className="w-4 h-4" />
                <span>Buka Halaman E-Sertifikat</span>
              </Link>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/40 border border-slate-800">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              Panitia belum mengunggah butir soal evaluasi untuk acara ini.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((q, idx) => {
              const currentAnswer = answers[q.question_number];

              return (
                <div
                  key={q.id}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">
                      Soal #{q.question_number}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Poin: {Math.round(100 / questions.length)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-100 mb-4 leading-relaxed">
                    {q.question_text}
                  </p>

                  {/* Options A, B, C, D */}
                  <div className="space-y-2.5">
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
                          className={`w-full p-3.5 rounded-2xl text-left text-xs font-medium border flex items-center gap-3 transition-all ${
                            isSelected
                              ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-sm"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {key}
                          </span>
                          <span>{text}</span>
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghitung Skor...</span>
                </>
              ) : (
                <span>Kirim Jawaban {testType === "PRE" ? "Pre-Test" : "Post-Test"}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
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
