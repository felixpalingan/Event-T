"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // For demo: immediately redirect to login so reviewer starts with the quick account picker
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-xs border border-slate-200 mb-4 animate-pulse">
        <Image
          src="/logo.png"
          alt="Logo Universitas Trisakti"
          width={42}
          height={42}
          className="object-contain"
          priority
        />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-800">Mengarahkan ke Portal Masuk...</span>
      </div>
      <p className="text-[11px] text-slate-500 text-center max-w-xs">
        FTI Event!t — Fakultas Teknologi Informasi Universitas Trisakti
      </p>
    </div>
  );
}
