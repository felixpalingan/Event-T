"use client";

import { Suspense } from "react";
import { TicketScanner } from "@/components/scanner/TicketScanner";
import { Loader2 } from "lucide-react";

export default function PanitiaScannerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <TicketScanner />
    </Suspense>
  );
}
