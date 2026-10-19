import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DesktopNav } from "./DesktopNav";

interface AppShellProps {
  children: ReactNode;
  showBottomNav?: boolean;
  showDesktopNav?: boolean;
  maxWidth?: "default" | "narrow" | "full";
}

export function AppShell({ 
  children, 
  showBottomNav = true,
  showDesktopNav = true,
  maxWidth = "default" 
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col antialiased">
      {/* 
        1. Desktop Top Navigation Bar:
        - Visible on Laptop/Desktop (md: and above).
        - Provides standard enterprise web navigation with role-specific tabs & fast switcher.
        - Hidden on mobile phones (md:hidden).
      */}
      {showDesktopNav && <DesktopNav />}

      {/* 
        2. Responsive Main Body Canvas:
        - Mobile: Centered smartphone enclosure (max-w-md mx-auto) with native mobile feel and bottom nav clearance.
        - Laptop/Desktop: Expands dynamically to wide layout (max-w-7xl mx-auto px-4 sm:px-6 lg:px-8), adapting to full screen width.
      */}
      <div className="w-full flex-1 flex flex-col justify-start">
        <div 
          className={`w-full mx-auto flex flex-col relative pb-24 md:pb-12 transition-all ${
            maxWidth === "narrow"
              ? "max-w-md md:max-w-3xl bg-white md:bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-xs md:my-8 md:p-6"
              : maxWidth === "full"
              ? "w-full px-4 sm:px-6 lg:px-8"
              : "max-w-md md:max-w-7xl md:px-6 lg:px-8 bg-white md:bg-transparent min-h-screen md:min-h-0 sm:border-x md:border-x-0 border-slate-200/90 shadow-sm md:shadow-none"
          }`}
        >
          {children}
        </div>
      </div>

      {/* 
        3. Mobile Bottom Navigation:
        - Visible on mobile phones (block).
        - Automatically hidden on laptop/desktop (md:hidden).
      */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
