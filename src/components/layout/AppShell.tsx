import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function AppShell({ children, showBottomNav = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-blue-600 selection:text-white">
      {/* 
        Mobile-First Viewport Shell:
        - Mobile: Full width (100vw), borderless, native app feel.
        - Tablet/Desktop: Centered smartphone enclosure (max-w-md md:max-w-lg) with subtle border & depth.
      */}
      <div className="w-full max-w-md md:max-w-lg min-h-screen bg-slate-900/50 sm:border-x sm:border-slate-800/80 flex flex-col relative pb-24 shadow-2xl">
        {children}
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
