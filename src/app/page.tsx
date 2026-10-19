"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { 
  Calendar, 
  QrCode, 
  MapPin, 
  Clock, 
  ScanLine,
  User,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard,
  Users,
  Settings2,
  FileSpreadsheet
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface EventItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  mode: string;
  venue: string;
  quota: number;
  price: number;
  event_start_at: string;
}

type RoleType = "MAHASISWA" | "PANITIA" | "ADMIN";

export default function Home() {
  const supabase = createClient();
  const [role, setRole] = useState<RoleType>("MAHASISWA");
  const [userName, setUserName] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    // 1. Initial local storage check
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_role") as RoleType | null;
      if (stored) setRole(stored);
    }

    // 2. Fetch profile from Supabase
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("role, name")
            .eq("id", user.id)
            .single();

          if (data) {
            setRole(data.role as RoleType);
            setUserName(data.name);
            if (typeof window !== "undefined") {
              localStorage.setItem("user_role", data.role);
            }
          }
        }
      } catch {
        // Fallback
      }
    };

    // 3. Fetch active events from Supabase
    const fetchEvents = async () => {
      try {
        const { data } = await supabase
          .from("events")
          .select("id, title, slug, description, category, mode, venue, quota, price, event_start_at")
          .eq("is_archived", false)
          .order("event_start_at", { ascending: true })
          .limit(4);

        if (data) {
          setEvents(data);
        }
      } catch {
        // Fallback
      } finally {
        setLoadingEvents(false);
      }
    };

    checkUser();
    fetchEvents();

    // 4. Listen for role change event
    const handleRoleChanged = () => {
      const updated = localStorage.getItem("user_role") as RoleType | null;
      if (updated) setRole(updated);
    };

    window.addEventListener("role_changed", handleRoleChanged);
    return () => window.removeEventListener("role_changed", handleRoleChanged);
  }, []);

  return (
    <AppShell>
      {/* Top App Bar with Role Badge (Mobile Only, Desktop uses DesktopNav) */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 p-1 flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
            <Image 
              src="/logo.png" 
              alt="Logo Universitas Trisakti" 
              width={28} 
              height={28} 
              className="object-contain" 
            />
          </div>
          <div>
            <span className="block font-bold text-sm tracking-tight text-slate-900 leading-tight">
              FTI Event!t
            </span>
            <span className="block text-[11px] text-slate-500 font-medium leading-tight">
              Universitas Trisakti
            </span>
          </div>
        </div>

        {/* Dynamic Right Header Action based on Role */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          {role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-700" />
              <span>KONSOL ADMIN</span>
            </Link>
          )}

          {role === "PANITIA" && (
            <Link
              href="/panitia/attendees"
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs"
            >
              <ScanLine className="w-3.5 h-3.5 text-emerald-700" />
              <span>PANITIA</span>
            </Link>
          )}

          {role === "MAHASISWA" && (
            <Link
              href="/profile"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1.5 border border-slate-200"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>{userName ? userName.split(" ")[0] : "Akun"}</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Feed */}
      <main className="flex-1 px-4 md:px-0 py-4 md:py-6 space-y-4 md:space-y-6">
        
        {/* Desktop Welcome Banner */}
        <div className="hidden md:flex items-center justify-between bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
                Portal FTI Trisakti
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Sistem Terpadu Presensi &amp; Sertifikasi
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Selamat Datang, {userName || "Mahasiswa FTI"}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Jelajahi agenda akademik, validasi tiket QR di lokasi seminar, dan unduh sertifikat resmi berlisensi fakultas.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {role === "ADMIN" && (
              <Link
                href="/admin/events/new"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-98"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Buat Event Baru</span>
              </Link>
            )}
            {role === "PANITIA" && (
              <Link
                href="/panitia/scanner"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-98"
              >
                <ScanLine className="w-4 h-4" />
                <span>Buka Scanner Kamera</span>
              </Link>
            )}
            {role === "MAHASISWA" && (
              <Link
                href="/events"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-98"
              >
                <Calendar className="w-4 h-4" />
                <span>Katalog Lengkap Acara</span>
              </Link>
            )}
          </div>
        </div>

        {/* Role-Specific Operational Quick Banner */}
        {role === "ADMIN" && (
          <section className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] md:text-xs font-bold text-blue-800 uppercase tracking-wide block">
                Hak Akses Administrator Aktif
              </span>
              <p className="text-xs md:text-sm text-blue-900 font-medium">
                Pusat kendali operasional dekanat: publikasi acara, bank soal, dan ekspor rekapitulasi BAAK.
              </p>
            </div>
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold shrink-0 shadow-2xs active:scale-95 transition-all ml-4"
            >
              Buka Konsol Admin
            </Link>
          </section>
        )}

        {role === "PANITIA" && (
          <section className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] md:text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                Hak Akses Panitia Lapangan Aktif
              </span>
              <p className="text-xs md:text-sm text-emerald-900 font-medium">
                Scanner pintu presensi dan kontrol gembok soal evaluasi post-test siap digunakan.
              </p>
            </div>
            <Link
              href="/panitia/scanner"
              className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-2xs active:scale-95 transition-all ml-4"
            >
              Buka Scanner Pintu
            </Link>
          </section>
        )}

        {/* Quick Utility Actions Bar - Adapted for Persona (2-col mobile, 4-col desktop) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {role === "ADMIN" ? (
            <>
              <Link
                href="/admin/events"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Kelola Event</span>
                  <span className="block text-[11px] text-blue-700 font-medium truncate">Publikasi Acara</span>
                </div>
              </Link>

              <Link
                href="/admin/events/new"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Buat Event</span>
                  <span className="block text-[11px] text-blue-600 font-medium truncate">Formulir Baru</span>
                </div>
              </Link>

              <Link
                href="/panitia/scanner"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Scanner QR</span>
                  <span className="block text-[11px] text-emerald-700 font-medium truncate">Pintu Presensi</span>
                </div>
              </Link>

              <Link
                href="/admin/reports"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Ekspor CSV</span>
                  <span className="block text-[11px] text-emerald-700 font-medium truncate">Rekap Data BAAK</span>
                </div>
              </Link>
            </>
          ) : role === "PANITIA" ? (
            <>
              <Link
                href="/panitia/scanner"
                className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Scanner Pintu</span>
                  <span className="block text-[11px] text-emerald-700 font-medium truncate">Validasi Kamera</span>
                </div>
              </Link>

              <Link
                href="/panitia/attendees"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Daftar Hadir</span>
                  <span className="block text-[11px] text-slate-500 font-medium truncate">Check-In Manual</span>
                </div>
              </Link>

              <Link
                href="/panitia/control"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Gembok Soal</span>
                  <span className="block text-[11px] text-amber-700 font-medium truncate">Akses Pre/Post-Test</span>
                </div>
              </Link>

              <Link
                href="/events"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Daftar Kegiatan</span>
                  <span className="block text-[11px] text-blue-700 font-medium truncate">Jadwal Acara</span>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/events"
                className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 hover:bg-blue-50 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Jelajah Event</span>
                  <span className="block text-[11px] text-blue-700 font-medium truncate">Daftar Acara Baru</span>
                </div>
              </Link>

              <Link
                href="/tickets"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Tiket Saya</span>
                  <span className="block text-[11px] text-slate-600 font-medium truncate">Akses QR Offline</span>
                </div>
              </Link>

              <Link
                href="/certificates"
                className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-50 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">E-Sertifikat</span>
                  <span className="block text-[11px] text-amber-800 font-medium truncate">Unduh PDF Resmi</span>
                </div>
              </Link>

              <Link
                href="/profile"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs md:text-sm font-bold text-slate-900 truncate">Akun Saya</span>
                  <span className="block text-[11px] text-slate-500 font-medium truncate">NIM &amp; Profil FTI</span>
                </div>
              </Link>
            </>
          )}
        </section>

        {/* Content Layout Grid (Mobile: Stack, Desktop: 2-column or 3-column) */}
        {loadingEvents ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured skeleton */}
            <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-slate-100 rounded-md"></div>
                <div className="h-5 w-16 bg-slate-100 rounded-md"></div>
              </div>
              <div className="h-7 w-3/4 bg-slate-100 rounded-lg"></div>
              <div className="h-16 w-full bg-slate-100 rounded-xl"></div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
              </div>
              <div className="h-11 w-full bg-slate-100 rounded-xl mt-4"></div>
            </div>
            {/* Agenda list skeleton */}
            <div className="space-y-3 lg:col-span-1">
              <div className="h-5 w-32 bg-slate-100 rounded-md"></div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs animate-pulse h-20"></div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs animate-pulse h-20"></div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xs">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm md:text-base font-bold text-slate-900">Belum Ada Acara Mendatang</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Saat ini belum ada agenda kegiatan akademik atau seminar yang dipublikasikan. Silakan cek kembali nanti.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Campus Event Card (Spans 2 columns on Desktop) */}
            {events[0] && (
              <section className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-5 md:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] md:text-xs font-bold tracking-wide uppercase">
                      {events[0].category.replace("_", " ")} • {events[0].mode}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      {events[0].price === 0 ? "GRATIS" : `Rp ${events[0].price.toLocaleString("id-ID")}`}
                    </span>
                  </div>

                  <h2 className="text-base md:text-xl font-bold text-slate-900 leading-snug">
                    {events[0].title}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
                    {events[0].description}
                  </p>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        {new Date(events[0].event_start_at).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })} • Pukul {new Date(events[0].event_start_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{events[0].venue}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Link
                    href="/events"
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs md:text-sm font-bold text-center transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{role === "MAHASISWA" ? "Klaim Tiket Masuk" : "Lihat Detail Acara"}</span>
                  </Link>
                  <Link
                    href="/events"
                    className="px-5 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-700 text-xs md:text-sm font-semibold transition-all border border-slate-200"
                  >
                    Detail
                  </Link>
                </div>
              </section>
            )}

            {/* Agenda Acara FTI (Spans 1 column on Desktop) */}
            <section className="space-y-3 lg:col-span-1">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Agenda Terdekat FTI
                </h3>
                <Link href="/events" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {events.slice(1).length > 0 ? (
                events.slice(1).map((ev) => {
                  const evDate = new Date(ev.event_start_at);
                  const monthShort = evDate.toLocaleDateString("id-ID", { month: "short" }).toUpperCase();
                  const dayNum = evDate.getDate();

                  return (
                    <Link
                      key={ev.id}
                      href="/events"
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 active:scale-[0.99] transition-all flex items-center justify-between gap-3 block shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0 text-center">
                          <span className="text-[9px] uppercase font-bold text-blue-600 leading-none">{monthShort}</span>
                          <span className="text-sm font-extrabold text-slate-900 leading-none mt-1">{dayNum}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                            {ev.category.replace("_", " ")}
                          </span>
                          <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate">{ev.title}</h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{ev.venue}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 shrink-0 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        {ev.price === 0 ? "GRATIS" : `Rp ${ev.price.toLocaleString("id-ID")}`}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-xs">
                  Tidak ada agenda lain yang terjadwal.
                </div>
              )}
            </section>
          </div>
        )}

      </main>
    </AppShell>
  );
}
