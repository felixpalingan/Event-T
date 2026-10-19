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
  LogOut 
} from "lucide-react";

type RoleType = "MAHASISWA" | "PANITIA" | "ADMIN";

export function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<RoleType>("MAHASISWA");
  const [userName, setUserName] = useState<string>("Pengguna");

  useEffect(() => {
    // 1. Check local storage for initial render
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_role") as RoleType | null;
      if (stored) setRole(stored);
    }

    // 2. Fetch authentic role from Supabase
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
        // Fallback to stored state
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_role");
    }
    router.push("/login");
    router.refresh();
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

        {/* Desktop Primary Navigation Links (Strictly Filtered by Logged-in Role) */}
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

        {/* Desktop Action Area: Verified Role Badge & Profile */}
        <div className="flex items-center gap-3">
          {/* Static Verified Role Badge (No manual dropdown) */}
          <div className="flex items-center">
            {role === "ADMIN" && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Administrator</span>
              </span>
            )}
            {role === "PANITIA" && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
                <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
                <span>Panitia Acara</span>
              </span>
            )}
            {role === "MAHASISWA" && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold shadow-2xs">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Mahasiswa</span>
              </span>
            )}
          </div>

          {/* User Account / Profile Button */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-semibold transition-all shadow-2xs"
            title="Buka Profil Akun"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="truncate max-w-[100px]">{userName.split(" ")[0]}</span>
          </Link>

          {/* Quick Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 active:scale-95 transition-all shadow-2xs"
            title="Keluar Sesi (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
