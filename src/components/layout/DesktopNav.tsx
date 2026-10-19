"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Calendar, 
  Ticket, 
  QrCode, 
  Award, 
  ScanLine,
  User,
  LayoutDashboard,
  Users,
  Settings2,
  FileSpreadsheet,
  Shield,
  ChevronDown,
  Sparkles,
  ExternalLink
} from "lucide-react";

type RoleType = "MAHASISWA" | "PANITIA" | "ADMIN";

export function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<RoleType>("MAHASISWA");
  const [userName, setUserName] = useState<string>("Felix");
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check local storage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_role") as RoleType | null;
      if (stored) setRole(stored);
    }

    // 2. Fetch from Supabase
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("role, name")
            .eq("id", user.id)
            .single();

          if (data) {
            if (data.role) {
              setRole(data.role as RoleType);
              if (typeof window !== "undefined") {
                localStorage.setItem("user_role", data.role);
              }
            }
            if (data.name) setUserName(data.name);
          }
        }
      } catch {
        // Fallback
      }
    };

    fetchUser();

    // 3. Listen for role change
    const handleRoleChanged = () => {
      const updated = localStorage.getItem("user_role") as RoleType | null;
      if (updated) setRole(updated);
    };

    window.addEventListener("role_changed", handleRoleChanged);
    return () => window.removeEventListener("role_changed", handleRoleChanged);
  }, []);

  const handleQuickRoleSwitch = async (newRole: RoleType) => {
    if (newRole === role) {
      setShowRoleMenu(false);
      return;
    }
    setIsSwitching(true);
    setRole(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_role", newRole);
      window.dispatchEvent(new Event("role_changed"));
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ role: newRole })
          .eq("id", user.id);
      }
    } catch {
      // Ignored for instant demo switch
    }

    setIsSwitching(false);
    setShowRoleMenu(false);

    // Contextual redirect if currently on unauthorized screen
    if (newRole === "ADMIN" && pathname === "/") {
      router.push("/admin");
    } else if (newRole === "MAHASISWA" && (pathname.startsWith("/admin") || pathname.startsWith("/panitia"))) {
      router.push("/events");
    } else {
      router.refresh();
    }
  };

  const getNavLinks = () => {
    if (role === "ADMIN") {
      return [
        { href: "/", label: "Beranda", icon: Calendar, isActive: pathname === "/" },
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard, isActive: pathname === "/admin" },
        { href: "/admin/events", label: "Kelola Event", icon: Calendar, isActive: pathname.startsWith("/admin/events") },
        { href: "/panitia/scanner", label: "Scanner QR", icon: ScanLine, isActive: pathname.startsWith("/panitia/scanner") || pathname === "/scanner" },
        { href: "/panitia/attendees", label: "Daftar Hadir", icon: Users, isActive: pathname.startsWith("/panitia/attendees") },
        { href: "/admin/reports", label: "Laporan & Rekap", icon: FileSpreadsheet, isActive: pathname.startsWith("/admin/reports") },
        { href: "/panitia/control", label: "Kontrol Sesi", icon: Settings2, isActive: pathname.startsWith("/panitia/control") },
      ];
    }

    if (role === "PANITIA") {
      return [
        { href: "/", label: "Beranda", icon: Calendar, isActive: pathname === "/" },
        { href: "/panitia/scanner", label: "Scanner Pintu", icon: ScanLine, isActive: pathname.startsWith("/panitia/scanner") || pathname === "/scanner" },
        { href: "/panitia/attendees", label: "Presensi Peserta", icon: Users, isActive: pathname.startsWith("/panitia/attendees") },
        { href: "/panitia/control", label: "Kontrol Gate & Test", icon: Settings2, isActive: pathname.startsWith("/panitia/control") },
      ];
    }

    // Default: MAHASISWA (Peserta)
    return [
      { href: "/", label: "Beranda", icon: Calendar, isActive: pathname === "/" },
      { href: "/events", label: "Jelajah Event", icon: Ticket, isActive: pathname.startsWith("/events") },
      { href: "/tickets", label: "Tiket Saya", icon: QrCode, isActive: pathname.startsWith("/tickets") },
      { href: "/certificates", label: "E-Sertifikat", icon: Award, isActive: pathname.startsWith("/certificates") },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Campus Identity */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 active:scale-98 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-xs">
              <Image 
                src="/logo.png" 
                alt="Logo Universitas Trisakti" 
                width={32} 
                height={32} 
                className="object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                  FTI Event!t
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 leading-none">
                  Trisakti
                </span>
              </div>
              <span className="block text-[11px] text-slate-500 font-medium leading-none mt-1">
                Fakultas Teknologi Informasi
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Primary Navigation Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-blue-700 stroke-[2.3]" : "text-slate-400 stroke-[1.8]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Action Area: Fast Persona Switcher & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                role === "ADMIN"
                  ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                  : role === "PANITIA"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>
                {role === "ADMIN" ? "KONSOL ADMIN" : role === "PANITIA" ? "PANITIA GATE" : "PESERTA FTI"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Dropdown Menu */}
            {showRoleMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ganti Mode Pengujian
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pilih tampilan hak akses role:
                  </span>
                </div>

                <button
                  onClick={() => handleQuickRoleSwitch("MAHASISWA")}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    role === "MAHASISWA" ? "text-blue-700 bg-blue-50/50 font-bold" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Peserta (Mahasiswa)</span>
                  </div>
                  {role === "MAHASISWA" && <span className="text-[10px] font-bold text-blue-600">Aktif</span>}
                </button>

                <button
                  onClick={() => handleQuickRoleSwitch("PANITIA")}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    role === "PANITIA" ? "text-emerald-700 bg-emerald-50/50 font-bold" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Panitia Lapangan</span>
                  </div>
                  {role === "PANITIA" && <span className="text-[10px] font-bold text-emerald-600">Aktif</span>}
                </button>

                <button
                  onClick={() => handleQuickRoleSwitch("ADMIN")}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    role === "ADMIN" ? "text-blue-700 bg-blue-50/50 font-bold" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Administrator</span>
                  </div>
                  {role === "ADMIN" && <span className="text-[10px] font-bold text-blue-600">Aktif</span>}
                </button>
              </div>
            )}
          </div>

          {/* User Account / Profile Button */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-semibold transition-all shadow-2xs"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
              {userName.charAt(0)}
            </div>
            <span className="truncate max-w-[100px]">{userName.split(" ")[0]}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
