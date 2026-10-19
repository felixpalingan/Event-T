import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function AppShell({ children, showBottomNav = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center selection:bg-blue-600 selection:text-white">
      {/* 
        Mobile-First Viewport Shell (Light Mode):
        - Mobile: Full width (100vw), clean white surface, native app feel.
        - Tablet/Desktop: Centered smartphone enclosure (max-w-md md:max-w-lg) with subtle border & shadow.
      */}
      <div className="w-full max-w-md md:max-w-lg min-h-screen bg-white sm:border-x sm:border-slate-200/90 flex flex-col relative pb-24 shadow-sm">
        {children}
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
