"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  ScanLine, 
  User, 
  Volume2, 
  VolumeX,
  Sparkles,
  Users,
  QrCode,
  Calendar
} from "lucide-react";

interface ScanResult {
  success: boolean;
  code: string;
  message: string;
  student?: {
    name: string;
    nim_nidn: string;
    prodi: string;
    angkatan: number;
  };
  event_title?: string;
  checked_in_at?: string;
}

export default function PanitiaScannerPage() {
  const supabase = createClient();
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Play synthesized audio beep
  const playBeep = (type: "success" | "error") => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low pitch A3
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // Audio not permitted without interaction
    }
  };

  useEffect(() => {
    // Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      (error) => {
        // Continuous scan errors ignored
      }
    );

    setCameraActive(true);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Call Supabase RPC function for atomic check-in
      const { data, error } = await supabase.rpc("process_ticket_checkin", {
        p_ticket_code: decodedText.trim(),
      });

      if (error) {
        playBeep("error");
        setLastResult({
          success: false,
          code: "SERVER_ERROR",
          message: error.message || "Gagal memproses tiket di database.",
        });
      } else {
        const res = data as ScanResult;
        if (res.success) {
          playBeep("success");
        } else {
          playBeep("error");
        }
        setLastResult(res);
      }
    } catch (err: unknown) {
      playBeep("error");
      const error = err as Error;
      setLastResult({
        success: false,
        code: "CLIENT_ERROR",
        message: error.message || "Format kode QR tidak valid.",
      });
    } finally {
      // Delay before next scan to prevent duplicate scans in 1.5 seconds
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            <span>Katalog Event</span>
          </Link>

          <span className="font-bold text-sm bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-1.5">
            <ScanLine className="w-4 h-4 text-emerald-400" />
            Scanner Presensi Panitia
          </span>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={soundEnabled ? "Matikan Suara Beep" : "Nyalakan Suara Beep"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-extrabold text-white">Scanner Registrasi Masuk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Arahkan kamera ke kode QR tiket mahasiswa untuk mencatat kehadiran secara otomatis.
          </p>
        </div>

        {/* Camera Box */}
        <div className="w-full max-w-sm rounded-3xl overflow-hidden border-2 border-slate-800 bg-slate-900 shadow-2xl relative p-2">
          <div id="qr-reader" className="w-full rounded-2xl overflow-hidden" />
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-semibold text-blue-300">Memvalidasi Tiket...</span>
              </div>
            </div>
          )}
        </div>

        {/* Scan Result Feedback Card */}
        {lastResult && (
          <div
            className={`mt-6 w-full max-w-sm p-6 rounded-3xl border shadow-xl transition-all ${
              lastResult.success
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                : "bg-red-950/60 border-red-500/40 text-red-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {lastResult.success ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold">
                  {lastResult.success ? "Check-In Berhasil!" : "Peringatan Presensi"}
                </h4>
                <p className="text-[11px] opacity-80">{lastResult.message}</p>
              </div>
            </div>

            {lastResult.student && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nama:</span>
                  <span className="font-bold text-white">{lastResult.student.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">NIM:</span>
                  <span className="font-mono text-blue-400 font-semibold">{lastResult.student.nim_nidn}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Prodi:</span>
                  <span className="text-slate-300">{lastResult.student.prodi}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setLastResult(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              Scan Peserta Berikutnya
            </button>
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
        <Link href="/scanner" className="flex flex-col items-center gap-1 text-emerald-400 font-semibold">
          <ScanLine className="w-5 h-5" />
          <span>Scanner</span>
        </Link>
      </div>
    </div>
  );
}
