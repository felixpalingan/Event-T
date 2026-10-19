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
  ShieldAlert, 
  Loader2,
  Zap,
  RotateCcw,
  Lock,
  Unlock,
  Calendar,
  MapPin,
  Users,
  FileSpreadsheet,
  Check
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
  event_id: number;
  event_title: string;
}

interface EventOption {
  id: number;
  title: string;
  category: string;
  venue: string;
  quota: number;
  is_post_test_open: boolean;
  event_start_at: string | null;
  attended_count: number;
  registered_count: number;
}

interface CameraDevice {
  id: string;
  label: string;
}

interface RecentScanItem {
  name: string;
  nim: string;
  time: string;
  status: "SUCCESS" | "ALREADY_CHECKED_IN" | "WRONG_EVENT" | "ERROR";
  eventTitle?: string;
}

export function TicketScanner() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"CAMERA" | "UPLOAD" | "MANUAL" | "SIMULATION">("CAMERA");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checkInCount, setCheckInCount] = useState(0);

  // Active Events State for Event Validation
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [togglingPostTest, setTogglingPostTest] = useState(false);
  const [postTestNotice, setPostTestNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrCodeRef = useRef<any>(null);
  const readerElementRef = useRef<HTMLDivElement>(null);

  // Manual input state
  const [manualCode, setManualCode] = useState("");

  // File upload state
  const [uploadLoading, setUploadLoading] = useState(false);

  // Scan Lock & Cooldown to prevent double scanning (1.5 seconds)
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const isProcessingRef = useRef(false);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Quick tickets simulation state
  const [quickTickets, setQuickTickets] = useState<QuickTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Recent scans log with status
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>([]);

  // Role check
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
    fetchEvents();
    fetchQuickTickets();

    return () => {
      // Safe cleanup on unmount
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      safeStopCamera();
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

  // Fetch active unarchived events with live attendance counters
  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const { data: eventsData, error } = await supabase
        .from("events")
        .select("id, title, category, venue, quota, is_post_test_open, event_start_at, is_archived")
        .eq("is_archived", false)
        .order("id", { ascending: false });

      if (!error && eventsData && eventsData.length > 0) {
        const { data: ticketsData } = await supabase
          .from("tickets")
          .select("event_id, is_checked_in, status");

        const mapped: EventOption[] = eventsData.map((ev) => {
          const evTickets = ticketsData?.filter((t) => t.event_id === ev.id) || [];
          const registered = evTickets.filter((t) => t.status === "CONFIRMED" || t.status === "ATTENDED").length;
          const attended = evTickets.filter((t) => t.is_checked_in).length;

          return {
            id: ev.id,
            title: ev.title,
            category: ev.category,
            venue: ev.venue,
            quota: ev.quota,
            is_post_test_open: Boolean(ev.is_post_test_open),
            event_start_at: ev.event_start_at,
            attended_count: attended,
            registered_count: registered,
          };
        });

        setEvents(mapped);

        // Check if there was a previously remembered event
        const savedId = typeof window !== "undefined" ? localStorage.getItem("panitia_selected_event_id") : null;
        const exists = mapped.find((e) => e.id.toString() === savedId);

        if (exists) {
          setSelectedEventId(exists.id);
        } else {
          setSelectedEventId(mapped[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load events for scanner:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSelectEvent = (id: number) => {
    setSelectedEventId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("panitia_selected_event_id", id.toString());
    }
    setLastResult(null);
    resetCooldown();
  };

  // Quick 1-Click Post-Test Gate Toggle
  const handleTogglePostTest = async () => {
    if (!selectedEventId) return;
    const currentEvent = events.find((e) => e.id === selectedEventId);
    if (!currentEvent) return;

    const newStatus = !currentEvent.is_post_test_open;
    setTogglingPostTest(true);
    setPostTestNotice(null);

    try {
      const { error } = await supabase
        .from("events")
        .update({ is_post_test_open: newStatus })
        .eq("id", selectedEventId);

      if (error) {
        setPostTestNotice({
          type: "error",
          message: `Gagal mengubah status: ${error.message}`,
        });
      } else {
        setEvents((prev) =>
          prev.map((e) => (e.id === selectedEventId ? { ...e, is_post_test_open: newStatus } : e))
        );
        setPostTestNotice({
          type: "success",
          message: newStatus
            ? `Gembok Post-Test DIBUKA! Mahasiswa yang sudah hadir pada "${currentEvent.title}" kini dapat mengerjakan kuis.`
            : `Gembok Post-Test DIKUNCI kembali untuk "${currentEvent.title}".`,
        });

        setTimeout(() => {
          setPostTestNotice(null);
        }, 5000);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setPostTestNotice({
        type: "error",
        message: error.message || "Gagal mengubah status post-test.",
      });
    } finally {
      setTogglingPostTest(false);
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
          event_id,
          profile:profiles!tickets_user_id_fkey (
            name,
            nim_nidn,
            prodi
          ),
          event:events!tickets_event_id_fkey (
            id,
            title
          )
        `)
        .order("created_at", { ascending: false })
        .limit(8);

      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: QuickTicket[] = data.map((t: any) => ({
          id: t.id,
          ticket_code: t.ticket_code,
          is_checked_in: t.is_checked_in,
          student_name: t.profile?.name || "Mahasiswa",
          nim: t.profile?.nim_nidn || "-",
          prodi: t.profile?.prodi || "Teknik Informatika",
          event_id: t.event?.id || t.event_id,
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

  // Play synthesized audio beep (success, error, wrong_event)
  const playBeep = (type: "success" | "error" | "wrong_event") => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
      } else if (type === "wrong_event") {
        // Double warning buzzer for wrong event
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.setValueAtTime(320, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        // Standard error buzz
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low pitch A3
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // Audio not permitted without interaction
    }
  };

  // Reset Cooldown Manually
  const resetCooldown = () => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
    setCooldownSeconds(0);
    isProcessingRef.current = false;
    setIsProcessing(false);
  };

  // Start Cooldown Countdown (1.5 seconds)
  const startCooldown = (seconds: number = 1.5) => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    setCooldownSeconds(seconds);

    cooldownIntervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        const next = Math.round((prev - 0.1) * 10) / 10;
        if (next <= 0) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          isProcessingRef.current = false;
          setIsProcessing(false);
          return 0;
        }
        return next;
      });
    }, 100);
  };

  // Process ticket code through Supabase RPC with Event Check & Double-Scan Prevention
  const handleValidateCode = async (rawCode: string) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    const now = Date.now();

    // 1. Synchronously prevent concurrent executions
    if (isProcessingRef.current) return;

    // 2. Cooldown period: If ANY scan happened less than 1.5 seconds ago, ignore
    if (now - lastScanTimeRef.current < 1500) return;

    // 3. Same-ticket lockout: If this exact ticket was scanned less than 10 seconds ago, ignore completely!
    if (lastScannedCodeRef.current === cleanCode && now - lastScanTimeRef.current < 10000) {
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    lastScannedCodeRef.current = cleanCode;
    lastScanTimeRef.current = now;

    try {
      // Pass both ticket code AND selected event ID for gate enforcement
      const { data, error } = await supabase.rpc("process_ticket_checkin", {
        p_ticket_code: cleanCode,
        p_event_id: selectedEventId || null,
      });

      if (error) {
        playBeep("error");
        setLastResult({
          success: false,
          code: "SERVER_ERROR",
          message: error.message || "Gagal memproses tiket di database.",
        });
        startCooldown(1.5);
      } else {
        const res = data as ScanResult;

        if (res.success) {
          playBeep("success");
          setCheckInCount((prev) => prev + 1);

          // Update event local attendance count
          if (selectedEventId) {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === selectedEventId
                  ? { ...e, attended_count: (e.attended_count || 0) + 1 }
                  : e
              )
            );
          }

          if (res.student) {
            setRecentScans((prev) => [
              {
                name: res.student!.name,
                nim: res.student!.nim_nidn,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                status: "SUCCESS",
                eventTitle: res.event_title,
              },
              ...prev.slice(0, 4),
            ]);
          }

          // Update quick tickets local status
          setQuickTickets((prev) =>
            prev.map((q) => (q.ticket_code === cleanCode ? { ...q, is_checked_in: true } : q))
          );
          setLastResult(res);
          startCooldown(1.5);
        } else if (res.code === "WRONG_EVENT") {
          // Event mismatch rejected!
          playBeep("wrong_event");
          if (res.student) {
            setRecentScans((prev) => [
              {
                name: res.student!.name,
                nim: res.student!.nim_nidn,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                status: "WRONG_EVENT",
                eventTitle: res.event_title,
              },
              ...prev.slice(0, 4),
            ]);
          }
          setLastResult(res);
          startCooldown(1.5);
        } else if (res.code === "ALREADY_CHECKED_IN") {
          playBeep("error");
          if (res.student) {
            setRecentScans((prev) => [
              {
                name: res.student!.name,
                nim: res.student!.nim_nidn,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                status: "ALREADY_CHECKED_IN",
                eventTitle: res.event_title,
              },
              ...prev.slice(0, 4),
            ]);
          }
          setLastResult(res);
          startCooldown(1.5);
        } else {
          playBeep("error");
          setLastResult(res);
          startCooldown(1.5);
        }
      }
    } catch (err: unknown) {
      playBeep("error");
      const error = err as Error;
      setLastResult({
        success: false,
        code: "CLIENT_ERROR",
        message: error.message || "Format kode QR tidak valid.",
      });
      startCooldown(1.5);
    }
  };

  // Safe Stop Camera
  const safeStopCamera = async () => {
    resetCooldown();
    if (html5QrCodeRef.current) {
      try {
        const state = typeof html5QrCodeRef.current.getState === "function" 
          ? html5QrCodeRef.current.getState() 
          : 0;
        // 2: SCANNING, 3: PAUSED
        if (state === 2 || state === 3) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Ignored camera stop warning:", err);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start Camera Stream (Crash-Proof)
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);

    // 1. Check browser mediaDevices support
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Browser Anda tidak mendukung akses kamera atau koneksi tidak aman (harus HTTPS atau localhost).");
      setCameraLoading(false);
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      // 2. Stop any previous instance first
      await safeStopCamera();

      // 3. Check available devices
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id.slice(0, 5)}` })));
          if (!selectedCameraId) setSelectedCameraId(devices[0].id);
        }
      } catch {
        // Fallback to facingMode if getCameras fails
      }

      // 4. Verify DOM element exists
      const targetElement = document.getElementById("reader-viewport");
      if (!targetElement) {
        throw new Error("Elemen kamera tidak ditemukan di layar.");
      }

      // 5. Initialize instance on completely empty element
      const qrInstance = new Html5Qrcode("reader-viewport");
      html5QrCodeRef.current = qrInstance;

      const cameraConfig = selectedCameraId 
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: "environment" };

      await qrInstance.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.max(160, Math.floor(minEdge * 0.7));
            return { width: qrboxSize, height: qrboxSize };
          },
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
      console.error("Camera startup error:", err);
      const error = err as Error;
      const isDenied = error?.name === "NotAllowedError" || error?.message?.toLowerCase().includes("permission");
      setCameraError(
        isDenied
          ? "Izin akses kamera ditolak oleh browser. Buka izin kamera di ikon gembok pada URL browser Anda."
          : error?.message || "Tidak dapat mengaktifkan kamera pada perangkat ini."
      );
      setIsCameraActive(false);
      await safeStopCamera();
    } finally {
      setCameraLoading(false);
    }
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
        message: error.message || "Gambar QR tidak terbaca. Pastikan foto QR terlihat jelas dan terang.",
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

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <AppShell>
      {/* Hidden dedicated container for file scanning (Zero React Children) */}
      <div id="reader-hidden-file" className="hidden" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 md:bg-white border-b md:border border-slate-200/90 md:rounded-3xl px-4 md:px-6 py-3.5 md:py-5 flex items-center justify-between backdrop-blur-md md:backdrop-blur-none md:mt-6 shadow-2xs">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Link href="/" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 active:scale-95 transition-transform md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hidden md:flex items-center justify-center text-blue-700 shrink-0">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Presensi Pintu Panitia</span>
            </h1>
            <span className="text-[10px] md:text-xs text-blue-700 font-semibold block">
              Validasi Tiket &amp; Kontrol Akses Kegiatan FTI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
            Sesi Ini: {checkInCount} Hadir
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 active:scale-95 transition-all border border-slate-200 bg-white shadow-2xs"
            title={soundEnabled ? "Matikan Audio Beep" : "Nyalakan Audio Beep"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 flex flex-col items-center max-w-xl mx-auto w-full space-y-4">
        {/* Notice if logged in as Mahasiswa */}
        {userRole === "MAHASISWA" && (
          <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="block font-bold">Akun Terdaftar: Mahasiswa</strong>
                <span>Presensi pintu aula memerlukan akun bertugas Panitia atau Admin.</span>
              </div>
            </div>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold active:scale-95 transition-all shrink-0 shadow-xs"
            >
              Ganti Akun
            </Link>
          </div>
        )}

        {/* STEP 1: EVENT SELECTOR & POST-TEST GATE PANEL */}
        <section className="w-full rounded-3xl bg-gradient-to-br from-blue-50/70 via-white to-amber-50/40 border border-blue-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-blue-900 uppercase block">
                  Event yang Di-Scan Hari Ini
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Hanya tiket acara ini yang akan diterima di pintu
                </span>
              </div>
            </div>

            {loadingEvents && (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>

          {/* Event Dropdown */}
          <div className="relative">
            <select
              value={selectedEventId || ""}
              onChange={(e) => handleSelectEvent(Number(e.target.value))}
              disabled={loadingEvents || events.length === 0}
              className="w-full py-2.5 px-3.5 pr-8 rounded-2xl bg-white border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all appearance-none cursor-pointer"
            >
              {events.length === 0 ? (
                <option value="">Tidak ada kegiatan aktif</option>
              ) : (
                events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    [{ev.category}] {ev.title} ({ev.attended_count} Hadir)
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>

          {/* Selected Event Details & Quick Action Gate */}
          {selectedEvent && (
            <div className="pt-2 border-t border-slate-200/80 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[260px] text-[11px] font-medium text-slate-700">
                    {selectedEvent.venue}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-900 font-mono text-[11px]">
                    {selectedEvent.attended_count} / {selectedEvent.registered_count || selectedEvent.quota} Hadir
                  </span>
                </div>
              </div>

              {/* POST-TEST GATE & REPORT BUTTONS */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                {/* Post Test Toggle Status */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    selectedEvent.is_post_test_open
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {selectedEvent.is_post_test_open ? (
                      <>
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>Post-Test Terbuka</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>Post-Test Terkunci</span>
                      </>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={handleTogglePostTest}
                    disabled={togglingPostTest}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-2xs flex items-center gap-1.5 ${
                      selectedEvent.is_post_test_open
                        ? "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                        : "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                    }`}
                    title={selectedEvent.is_post_test_open ? "Kunci Post-Test" : "Buka Post-Test Sekarang"}
                  >
                    {togglingPostTest ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : selectedEvent.is_post_test_open ? (
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>{selectedEvent.is_post_test_open ? "Kunci Post-Test" : "Buka Post-Test"}</span>
                  </button>
                </div>

                {/* Quick Link to Attendees Report */}
                <Link
                  href={`/panitia/attendees?eventId=${selectedEvent.id}`}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lihat Laporan Acara</span>
                </Link>
              </div>

              {/* Status Notice */}
              {postTestNotice && (
                <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  postTestNotice.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border border-rose-200 text-rose-900"
                }`}>
                  {postTestNotice.type === "success" ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{postTestNotice.message}</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Multi-Input Tabs */}
        <div className="w-full grid grid-cols-4 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("CAMERA");
            }}
            className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "CAMERA"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kamera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("UPLOAD");
              safeStopCamera();
            }}
            className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "UPLOAD"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unggah</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("MANUAL");
              safeStopCamera();
            }}
            className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "MANUAL"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ketik</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("SIMULATION");
              safeStopCamera();
              fetchQuickTickets();
            }}
            className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "SIMULATION"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Simulasi</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Viewfinder */}
        {activeTab === "CAMERA" && (
          <div className="w-full flex flex-col items-center space-y-3">
            <div className="w-full max-w-sm rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm p-3 relative">
              {/* Outer Viewport Container */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 relative">
                {/* 
                  CRITICAL ARCHITECTURE:
                  The `#reader-viewport` element is dedicated EXCLUSIVELY to Html5Qrcode.
                  React NEVER renders any children inside this element.
                  All overlays (loading, placeholder, laser brackets, processing) are siblings with `absolute inset-0`.
                */}
                <div
                  id="reader-viewport"
                  ref={readerElementRef}
                  className="w-full h-full"
                />

                {/* Sibling Overlay 1: Inactive Placeholder */}
                {!isCameraActive && !cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-900">
                    <CameraOff className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 max-w-[200px] mb-3">
                      Kamera sedang nonaktif. Tekan tombol di bawah untuk menyalakan pemindai.
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Nyalakan Kamera</span>
                    </button>
                  </div>
                )}

                {/* Sibling Overlay 2: Connecting Spinner */}
                {cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-900/95 backdrop-blur-xs">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-300">Menghubungkan Kamera...</span>
                  </div>
                )}

                {/* Sibling Overlay 3: Laser & Viewfinder Brackets (Only when camera active and not in cooldown) */}
                {isCameraActive && cooldownSeconds === 0 && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {/* Viewfinder Target Bracket */}
                    <div className="absolute inset-8 border-2 border-blue-400/50 rounded-2xl pointer-events-none">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-blue-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-blue-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-blue-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-blue-400" />
                    </div>

                    {/* Laser Sweep */}
                    <div className="absolute inset-x-8 h-0.5 bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-laser pointer-events-none" />
                  </div>
                )}

                {/* Sibling Overlay 4: Processing State */}
                {isProcessing && cooldownSeconds === 0 && (
                  <div className="absolute inset-0 bg-white/85 flex items-center justify-center backdrop-blur-xs z-20">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs font-bold text-blue-900">Validasi Acara &amp; Tiket...</span>
                    </div>
                  </div>
                )}

                {/* Sibling Overlay 5: Cooldown / Jeda Anti-Double Scan (1.5 seconds) */}
                {cooldownSeconds > 0 && (
                  <div className={`absolute inset-0 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 transition-all ${
                    lastResult?.success 
                      ? "bg-emerald-950/90 text-white" 
                      : lastResult?.code === "WRONG_EVENT"
                      ? "bg-rose-950/90 text-white"
                      : "bg-slate-950/90 text-white"
                  }`}>
                    {lastResult?.success ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/30">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-0.5">Check-In Berhasil!</h4>
                        <p className="text-xs text-emerald-200 font-semibold mb-3 truncate max-w-[200px]">
                          {lastResult.student?.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-900/80 border border-emerald-400/40 text-[11px] font-mono font-bold text-emerald-300">
                            Jeda: {cooldownSeconds.toFixed(1)}s
                          </span>
                          <button
                            type="button"
                            onClick={resetCooldown}
                            className="px-3 py-1 rounded-full bg-white text-emerald-950 hover:bg-emerald-50 active:scale-95 text-[11px] font-bold shadow-xs transition-all flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>Scan Sekarang</span>
                          </button>
                        </div>
                      </>
                    ) : lastResult?.code === "WRONG_EVENT" ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center mb-2 shadow-lg shadow-rose-600/30 animate-pulse">
                          <ShieldAlert className="w-7 h-7" />
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-wide">
                          Presensi Ditolak: Tiket Salah Acara!
                        </h4>
                        <p className="text-[11px] text-rose-200 mb-3 max-w-[220px] leading-tight">
                          Tiket ini terdaftar untuk acara <strong className="text-white">{lastResult.event_title}</strong>.
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-rose-900/80 border border-rose-400/40 text-[11px] font-mono font-bold text-rose-200">
                            Jeda: {cooldownSeconds.toFixed(1)}s
                          </span>
                          <button
                            type="button"
                            onClick={resetCooldown}
                            className="px-3 py-1 rounded-full bg-white text-rose-950 hover:bg-rose-50 active:scale-95 text-[11px] font-bold shadow-xs transition-all"
                          >
                            <span>Lanjut Scan Berikutnya</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center mb-2 shadow-lg shadow-amber-500/30">
                          <AlertCircle className="w-7 h-7" />
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1">
                          {lastResult?.code === "ALREADY_CHECKED_IN" ? "Tiket Sudah Pernah Hadir" : "Presensi Gagal"}
                        </h4>
                        <p className="text-[11px] text-slate-300 mb-3 max-w-[200px]">
                          {lastResult?.message}
                        </p>
                        <button
                          type="button"
                          onClick={resetCooldown}
                          className="px-3 py-1 rounded-full bg-white text-slate-900 hover:bg-slate-100 active:scale-95 text-[11px] font-bold shadow-xs transition-all"
                        >
                          <span>Lanjut Scan Berikutnya</span>
                        </button>
                      </>
                    )}
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
                      if (isCameraActive) startCamera();
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
                    type="button"
                    onClick={safeStopCamera}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Matikan Kamera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={cameraLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
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
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
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
              <div className="py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 cursor-pointer text-xs font-bold text-slate-700 hover:text-blue-700 transition-all flex items-center justify-center gap-2">
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !manualCode.trim()}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
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
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Uji Coba Presensi Cepat</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Klik tiket di bawah untuk uji scan instan dan uji tolak tiket beda acara.
                </p>
              </div>
              <button
                type="button"
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
                Belum ada tiket terdaftar di sistem.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                {quickTickets.map((t) => {
                  const isMatchingEvent = selectedEventId ? t.event_id === selectedEventId : true;

                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all text-xs ${
                        isMatchingEvent
                          ? "border-blue-200 bg-blue-50/40 hover:bg-blue-50/70"
                          : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 truncate block">{t.student_name}</strong>
                          {t.is_checked_in ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                              Hadir
                            </span>
                          ) : isMatchingEvent ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
                              Acara Sesuai
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 shrink-0">
                              Acara Lain
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 block">
                          NIM: {t.nim} • {t.prodi}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          Acara: {t.event_title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleValidateCode(t.ticket_code)}
                        disabled={isProcessing}
                        className={`px-3 py-1.5 rounded-lg text-white text-[11px] font-bold shrink-0 active:scale-95 transition-all shadow-2xs ${
                          isMatchingEvent
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-rose-600 hover:bg-rose-700"
                        }`}
                      >
                        {isMatchingEvent ? "Scan Tiket" : "Uji Tolak"}
                      </button>
                    </div>
                  );
                })}
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
                : lastResult.code === "WRONG_EVENT"
                ? "bg-rose-50 border-rose-300 text-rose-950"
                : lastResult.code === "ALREADY_CHECKED_IN"
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-red-50 border-red-300 text-red-950"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {lastResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : lastResult.code === "WRONG_EVENT" ? (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  lastResult.code === "ALREADY_CHECKED_IN" ? "text-amber-600" : "text-red-600"
                }`} />
              )}
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {lastResult.success 
                    ? "Check-In Berhasil! Silakan Masuk" 
                    : lastResult.code === "WRONG_EVENT"
                    ? "Presensi Ditolak: Tiket Salah Acara!"
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
                    <span className="text-slate-500">Acara Tiket:</span>
                    <span className={`font-semibold truncate max-w-[180px] ${
                      lastResult.code === "WRONG_EVENT" ? "text-rose-700" : "text-slate-800"
                    }`}>
                      {lastResult.event_title}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setLastResult(null);
                resetCooldown();
              }}
              className="mt-3 w-full py-2 rounded-xl bg-white hover:bg-slate-50 active:scale-98 text-xs font-semibold text-slate-800 border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Tutup &amp; Siap Scan Berikutnya</span>
            </button>
          </div>
        )}

        {/* Recent Scans Log */}
        {recentScans.length > 0 && (
          <div className="w-full max-w-sm p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Riwayat Presensi Pintu Terkini
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
                    {s.status === "SUCCESS" ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Hadir
                      </span>
                    ) : s.status === "WRONG_EVENT" ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Salah Acara
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {s.status === "ALREADY_CHECKED_IN" ? "Sudah Ada" : "Ditolak"}
                      </span>
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
