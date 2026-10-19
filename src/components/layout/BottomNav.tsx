"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  FileSpreadsheet
} from "lucide-react";

type RoleType = "MAHASISWA" | "PANITIA" | "ADMIN";

export function BottomNav() {
  const pathname = usePathname();
  const supabase = createClient();
  const [role, setRole] = useState<RoleType>("MAHASISWA");

  useEffect(() => {
    // 1. Initial check from localStorage for instant render
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_role") as RoleType | null;
      if (stored) setRole(stored);
    }

    // 2. Fetch from Supabase
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (data?.role) {
            setRole(data.role as RoleType);
            if (typeof window !== "undefined") {
              localStorage.setItem("user_role", data.role);
            }
          }
        }
      } catch {
        // Fallback to current state
      }
    };

    fetchUserRole();

    // 3. Listen for role change event from profile switcher
    const handleRoleChanged = () => {
      const updated = localStorage.getItem("user_role") as RoleType | null;
      if (updated) setRole(updated);
    };

    window.addEventListener("role_changed", handleRoleChanged);
    return () => window.removeEventListener("role_changed", handleRoleChanged);
  }, []);

  // Configure navigation items strictly based on user's authorized role
  const getNavItems = () => {
    if (role === "ADMIN") {
      return [
        {
          href: "/",
          label: "Beranda",
          icon: Calendar,
          isActive: pathname === "/",
        },
        {
          href: "/admin/events",
          label: "Kelola Event",
          icon: LayoutDashboard,
          isActive: pathname.startsWith("/admin/events") || pathname === "/admin",
        },
        {
          href: "/panitia/scanner",
          label: "Scanner",
          icon: ScanLine,
          isActive: pathname.startsWith("/panitia/scanner") || pathname === "/scanner",
        },
        {
          href: "/admin/reports",
          label: "Laporan",
          icon: FileSpreadsheet,
          isActive: pathname.startsWith("/admin/reports"),
        },
        {
          href: "/profile",
          label: "Akun",
          icon: User,
          isActive: pathname.startsWith("/profile"),
        },
      ];
    }

    if (role === "PANITIA") {
      return [
        {
          href: "/",
          label: "Beranda",
          icon: Calendar,
          isActive: pathname === "/",
        },
        {
          href: "/panitia/scanner",
          label: "Scanner Pintu",
          icon: ScanLine,
          isActive: pathname.startsWith("/panitia/scanner") || pathname === "/scanner",
        },
        {
          href: "/panitia/attendees",
          label: "Kehadiran",
          icon: Users,
          isActive: pathname.startsWith("/panitia/attendees"),
        },
        {
          href: "/panitia/control",
          label: "Kontrol",
          icon: Settings2,
          isActive: pathname.startsWith("/panitia/control"),
        },
        {
          href: "/profile",
          label: "Akun",
          icon: User,
          isActive: pathname.startsWith("/profile"),
        },
      ];
    }

    // Default: MAHASISWA (Peserta)
    return [
      {
        href: "/",
        label: "Beranda",
        icon: Calendar,
        isActive: pathname === "/",
      },
      {
        href: "/events",
        label: "Event",
        icon: Ticket,
        isActive: pathname.startsWith("/events"),
      },
      {
        href: "/tickets",
        label: "Tiket Saya",
        icon: QrCode,
        isActive: pathname.startsWith("/tickets"),
      },
      {
        href: "/certificates",
        label: "Sertifikat",
        icon: Award,
        isActive: pathname.startsWith("/certificates"),
      },
      {
        href: "/profile",
        label: "Akun",
        icon: User,
        isActive: pathname.startsWith("/profile"),
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden">
      <div className="w-full max-w-md bg-white/95 border-t border-slate-200/90 px-2 pt-2 pb-safe flex items-center justify-around pointer-events-auto shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 ${
                active
                  ? "text-blue-600 font-bold"
                  : "text-slate-400 hover:text-slate-700 font-medium"
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-colors ${
                active ? "bg-blue-50 text-blue-600" : "bg-transparent text-slate-400"
              }`}>
                <Icon className={`w-5 h-5 ${active ? "text-blue-600 stroke-[2.4]" : "stroke-[1.8]"}`} />
              </div>
              <span className={`text-[10px] tracking-tight leading-none truncate max-w-[64px] text-center ${active ? "text-blue-600 font-bold" : "text-slate-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
