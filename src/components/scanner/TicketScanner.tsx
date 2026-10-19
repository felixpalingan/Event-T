"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ScanLine, 
  Volume2, 
  VolumeX,
  UserCheck,
  Camera,
  CameraOff,
  Upload,
  Keyboard,
  Sparkles,
  RefreshCw,
  Clock,
  Users,
  ShieldAlert,
  Loader2
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

interface QuickTicket {
  id: number;
  ticket_code: string;
  is_checked_in: boolean;
  student_name: string;
  nim: string;
  prodi: string;
  event_title: string;
}

interface CameraDevice {
  id: string;
  label: string;
}

export function TicketScanner() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"CAMERA" | "UPLOAD" | "MANUAL" | "SIMULATION">("CAMERA");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checkInCount, setCheckInCount] = useState(0);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrCodeRef = useRef<any>(null);

  // Manual input state
  const [manualCode, setManualCode] = useState("");

  // File upload state
  const [uploadLoading, setUploadLoading] = useState(false);

  // Quick tickets simulation state
  const [quickTickets, setQuickTickets] = useState<QuickTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Recent scans log
  const [recentScans, setRecentScans] = useState<Array<{ name: string; nim: string; time: string; success: boolean }>>([]);

  // Role check
  const [userRole, setUserRole] = useState<string | null>(null);
  const [switchingRole, setSwitchingRole] = useState(false);

  useEffect(() => {
    checkUserRole();
    fetchQuickTickets();

    return () => {
      stopCamera();
    };
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (data?.role) setUserRole(data.role);
      }
    } catch {
      // Ignore
    }
  };

  const handlePromoteToPanitia = async () => {
    setSwitchingRole(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ role: "PANITIA" })
          .eq("id", user.id);
        setUserRole("PANITIA");
        if (typeof window !== "undefined") {
          localStorage.setItem("user_role", "PANITIA");
          window.dispatchEvent(new Event("role_changed"));
        }
      }
    } catch {
      // Fallback
    } finally {
      setSwitchingRole(false);
    }
  };

  const fetchQuickTickets = async () => {
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_code,
          is_checked_in,
          profile:profiles!tickets_user_id_fkey (
            name,
            nim_nidn,
            prodi
          ),
          event:events!tickets_event_id_fkey (
            title
          )
        `)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: QuickTicket[] = data.map((t: any) => ({
          id: t.id,
          ticket_code: t.ticket_code,
          is_checked_in: t.is_checked_in,
          student_name: t.profile?.name || "Mahasiswa",
          nim: t.profile?.nim_nidn || "-",
          prodi: t.profile?.prodi || "Teknik Informatika",
          event_title: t.event?.title || "Kegiatan FTI",
        }));
        setQuickTickets(mapped);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingTickets(false);
    }
  };

  // Play synthesized audio beep
  const playBeep = (type: "success" | "error") => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
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

  // Process ticket code through Supabase RPC
  const handleValidateCode = async (rawCode: string) => {
    if (isProcessing) return;
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.rpc("process_ticket_checkin", {
        p_ticket_code: cleanCode,
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
          if (res.student) {
            setRecentScans((prev) => [
              {
                name: res.student!.name,
                nim: res.student!.nim_nidn,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                success: true,
              },
              ...prev.slice(0, 4),
            ]);
          }
          // Update quick tickets local status
          setQuickTickets((prev) =>
            prev.map((q) => (q.ticket_code === cleanCode ? { ...q, is_checked_in: true } : q))
          );
        } else {
          playBeep("error");
          if (res.student) {
            setRecentScans((prev) => [
              {
                name: res.student!.name,
                nim: res.student!.nim_nidn,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                success: false,
              },
              ...prev.slice(0, 4),
            ]);
          }
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

  // Start Camera Stream
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      // Stop existing instance if running
      await stopCamera();

      // Check available cameras
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id.slice(0, 5)}` })));
          if (!selectedCameraId) setSelectedCameraId(devices[0].id);
        }
      } catch {
        // Fallback to facingMode if getCameras fails
      }

      const qrInstance = new Html5Qrcode("reader-viewport");
      html5QrCodeRef.current = qrInstance;

      const cameraConfig = selectedCameraId 
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: "environment" };

      await qrInstance.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleValidateCode(decodedText);
        },
        () => {
          // Frame error ignored
        }
      );

      setIsCameraActive(true);
    } catch (err: unknown) {
      const error = err as Error;
      setCameraError(
        error.message || "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser."
      );
      setIsCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch {
        // Ignored
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setLastResult(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const fileScanner = new Html5Qrcode("reader-hidden-file");
      const decodedText = await fileScanner.scanFile(file, true);
      await fileScanner.clear();
      await handleValidateCode(decodedText);
    } catch (err: unknown) {
      playBeep("error");
      const error = err as Error;
      setLastResult({
        success: false,
        code: "DECODE_ERROR",
        message: error.message || "Gambar QR tidak terbaca. Pastikan gambar jelas dan tidak buram.",
      });
    } finally {
      setUploadLoading(false);
      e.target.value = "";
    }
  };

  // Manual Form Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleValidateCode(manualCode.trim());
    setManualCode("");
  };

  return (
    <AppShell>
      {/* Hidden container for file scanning */}
      <div id="reader-hidden-file" className="hidden" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 hidden md:flex items-center justify-center text-emerald-700 shrink-0">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Presensi Pintu Masuk Panitia</span>
            </h1>
            <span className="text-[10px] md:text-xs text-emerald-700 font-semibold block">
              Validasi Kode QR &amp; Check-In Peserta Acara
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
            Total Hadir: {checkInCount}
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 active:scale-95 transition-all border border-slate-200 bg-white shadow-2xs"
            title={soundEnabled ? "Matikan Beep Audio" : "Nyalakan Beep Audio"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 flex flex-col items-center max-w-xl mx-auto w-full space-y-4">
        {/* Role Warning & Quick Switch Banner if Mahasiswa */}
        {userRole === "MAHASISWA" && (
          <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="block font-bold">Peran Anda Saat Ini: Mahasiswa</strong>
                <span>Presensi pintu memerlukan wewenang Panitia.</span>
              </div>
            </div>
            <button
              onClick={handlePromoteToPanitia}
              disabled={switchingRole}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold active:scale-95 transition-all shrink-0 shadow-xs"
            >
              {switchingRole ? "Mengalihkan..." : "Aktifkan Panitia"}
            </button>
          </div>
        )}

        {/* Multi-Input Tabs */}
        <div className="w-full grid grid-cols-4 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
          <button
            onClick={() => {
              setActiveTab("CAMERA");
              if (!isCameraActive) startCamera();
            }}
            className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "CAMERA"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kamera</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("UPLOAD");
              stopCamera();
            }}
            className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "UPLOAD"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unggah</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("MANUAL");
              stopCamera();
            }}
            className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "MANUAL"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ketik</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("SIMULATION");
              stopCamera();
              fetchQuickTickets();
            }}
            className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "SIMULATION"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Simulasi</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Viewfinder */}
        {activeTab === "CAMERA" && (
          <div className="w-full flex flex-col items-center space-y-3">
            <div className="w-full max-w-sm rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm p-3 relative">
              {/* Viewport Box */}
              <div
                id="reader-viewport"
                className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 relative flex items-center justify-center"
              >
                {!isCameraActive && !cameraLoading && (
                  <div className="text-center p-6 space-y-3">
                    <CameraOff className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400 max-w-[200px]">
                      Kamera sedang nonaktif. Tekan tombol di bawah untuk menyalakan pemindai.
                    </p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Nyalakan Kamera</span>
                    </button>
                  </div>
                )}

                {cameraLoading && (
                  <div className="text-center p-6 space-y-2">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                    <span className="text-xs font-semibold text-slate-300">Menghubungkan Kamera...</span>
                  </div>
                )}

                {/* Laser animation when camera is running */}
                {isCameraActive && (
                  <>
                    {/* Viewfinder Target Bracket */}
                    <div className="absolute inset-8 border-2 border-emerald-400/60 rounded-2xl pointer-events-none">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400" />
                    </div>

                    {/* Laser Sweep */}
                    <div className="absolute inset-x-8 h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-laser pointer-events-none" />
                  </>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/85 flex items-center justify-center backdrop-blur-xs z-10">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs font-bold text-emerald-800">Validasi Tiket Presensi...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Error Alert */}
              {cameraError && (
                <div className="mt-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <strong className="block font-semibold">Izin Kamera Diperlukan</strong>
                    <span>{cameraError}</span>
                  </div>
                </div>
              )}

              {/* Camera Controls Bar */}
              <div className="mt-3 flex items-center justify-between gap-2">
                {cameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startCamera();
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium outline-none"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                )}

                {isCameraActive ? (
                  <button
                    onClick={stopCamera}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Matikan Kamera</span>
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    disabled={cameraLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Nyalakan Kamera</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Upload QR Image File */}
        {activeTab === "UPLOAD" && (
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Unggah Gambar / Foto Tiket QR</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Pilih foto atau tangkapan layar (screenshot) kode QR tiket yang dikirimkan oleh peserta.
              </p>
            </div>

            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadLoading}
                className="hidden"
              />
              <div className="py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 cursor-pointer text-xs font-bold text-slate-700 hover:text-emerald-700 transition-all flex items-center justify-center gap-2">
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Menganalisis Kode QR...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Pilih Berkas Foto QR (.JPG, .PNG)</span>
                  </>
                )}
              </div>
            </label>
          </div>
        )}

        {/* Tab 3: Manual Input Ticket Code */}
        {activeTab === "MANUAL" && (
          <form
            onSubmit={handleManualSubmit}
            className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm"
          >
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">Input Manual Kode Tiket</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ketik atau tempel (paste) kode UUID tiket peserta secara manual.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Kode Tiket (UUID / Barcode)
              </label>
              <input
                type="text"
                placeholder="Contoh: 123e4567-e89b-12d3-a456-426614174000"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !manualCode.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memvalidasi...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Validasi &amp; Check-In Presensi</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 4: Fast Simulation / Test Tickets */}
        {activeTab === "SIMULATION" && (
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Uji Coba Presensi Cepat</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Klik tiket terdaftar di bawah untuk simulasi scan instan tanpa kamera.
                </p>
              </div>
              <button
                onClick={fetchQuickTickets}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                title="Segarkan Tiket"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingTickets ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : quickTickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                Belum ada tiket terdaftar di sistem. Silakan klaim tiket di menu Kegiatan terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {quickTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-2.5 transition-all text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900 truncate block">{t.student_name}</strong>
                        {t.is_checked_in ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                            Hadir
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                            Siap
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-blue-700 block">
                        NIM: {t.nim} • {t.prodi}
                      </span>
                    </div>

                    <button
                      onClick={() => handleValidateCode(t.ticket_code)}
                      disabled={isProcessing}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 active:scale-95 transition-all shadow-2xs"
                    >
                      Scan Tiket
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scan Result Feedback Card */}
        {lastResult && (
          <div
            className={`w-full max-w-sm p-4 rounded-2xl border transition-all shadow-sm ${
              lastResult.success
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : lastResult.code === "ALREADY_CHECKED_IN"
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-red-50 border-red-300 text-red-950"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {lastResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  lastResult.code === "ALREADY_CHECKED_IN" ? "text-amber-600" : "text-red-600"
                }`} />
              )}
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {lastResult.success 
                    ? "Check-In Berhasil! Silakan Masuk" 
                    : lastResult.code === "ALREADY_CHECKED_IN"
                    ? "Tiket Sudah Pernah Hadir"
                    : "Presensi Ditolak"}
                </h4>
                <p className="text-[11px] opacity-90 mt-0.5">{lastResult.message}</p>
              </div>
            </div>

            {lastResult.student && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama:</span>
                  <span className="font-bold text-slate-900">{lastResult.student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIM:</span>
                  <span className="font-mono text-blue-700 font-bold">{lastResult.student.nim_nidn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Program Studi:</span>
                  <span className="text-slate-700">{lastResult.student.prodi} ({lastResult.student.angkatan})</span>
                </div>
                {lastResult.event_title && (
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Acara:</span>
                    <span className="text-slate-800 font-medium truncate max-w-[180px]">{lastResult.event_title}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setLastResult(null)}
              className="mt-3 w-full py-2 rounded-xl bg-white hover:bg-slate-50 active:scale-98 text-xs font-semibold text-slate-800 border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tutup &amp; Siap Scan Berikutnya</span>
            </button>
          </div>
        )}

        {/* Recent Scans Log */}
        {recentScans.length > 0 && (
          <div className="w-full max-w-sm p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Riwayat Presensi Terkini
            </span>
            <div className="space-y-1.5">
              {recentScans.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 truncate block">{s.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{s.nim}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400">{s.time}</span>
                    {s.success ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
