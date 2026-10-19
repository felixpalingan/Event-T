"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ScanLine, 
  Volume2, 
  VolumeX,
  UserCheck
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
  const [checkInCount, setCheckInCount] = useState(0);
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
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      () => {
        // Continuous scan error ignored
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
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
          setCheckInCount((prev) => prev + 1);
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
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    }
  };

  return (
    <AppShell>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <ScanLine className="w-4 h-4 text-emerald-600" />
            <span>Presensi Pintu Panitia</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
            Hadir: {checkInCount}
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 active:scale-95 transition-all"
            title={soundEnabled ? "Matikan Beep" : "Nyalakan Beep"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 flex flex-col items-center">
        <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
          Arahkan kamera ke QR tiket peserta. Validasi kehadiran diproses secara otomatis &lt;150ms.
        </p>

        {/* Camera Viewfinder */}
        <div className="w-full max-w-xs rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm relative p-2">
          <div id="qr-reader" className="w-full rounded-2xl overflow-hidden bg-slate-900" />
          
          {/* Laser Scanner Sweep Line */}
          <div className="absolute inset-x-4 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-laser pointer-events-none" />

          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl backdrop-blur-xs">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-semibold text-emerald-800">Validasi Tiket...</span>
              </div>
            </div>
          )}
        </div>

        {/* Scan Result Card */}
        {lastResult && (
          <div
            className={`mt-4 w-full p-4 rounded-2xl border transition-all ${
              lastResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              {lastResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {lastResult.success ? "Check-In Berhasil" : "Presensi Ditolak"}
                </h4>
                <p className="text-[11px] opacity-90">{lastResult.message}</p>
              </div>
            </div>

            {lastResult.student && (
              <div className="mt-2.5 p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama:</span>
                  <span className="font-bold text-slate-900">{lastResult.student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIM:</span>
                  <span className="font-mono text-blue-700 font-bold">{lastResult.student.nim_nidn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prodi / Angkatan:</span>
                  <span className="text-slate-700">{lastResult.student.prodi} ({lastResult.student.angkatan})</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setLastResult(null)}
              className="mt-3 w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 active:scale-98 text-xs font-semibold text-slate-800 border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Scan Peserta Berikutnya</span>
            </button>
          </div>
        )}
      </main>
    </AppShell>
  );
}
