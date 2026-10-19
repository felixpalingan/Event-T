"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Calendar, 
  Ticket, 
  QrCode, 
  Award, 
  ScanLine 
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
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
      label: "Tiket",
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
      href: "/scanner",
      label: "Scanner",
      icon: ScanLine,
      isActive: pathname.startsWith("/scanner"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md md:max-w-lg bg-slate-950/95 border-t border-slate-800/90 px-3 pt-2 pb-safe flex items-center justify-around pointer-events-auto shadow-2xl backdrop-blur-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 ${
                active
                  ? "text-blue-500 font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-colors ${
                active ? "bg-blue-600/15" : "bg-transparent"
              }`}>
                <Icon className={`w-5 h-5 ${active ? "text-blue-500 stroke-[2.4]" : "text-slate-400 stroke-[1.8]"}`} />
              </div>
              <span className={`text-[10px] tracking-tight leading-none ${active ? "text-blue-400 font-bold" : "text-slate-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
