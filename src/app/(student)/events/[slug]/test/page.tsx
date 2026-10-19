"use client";

import { useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function RedirectContent() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;

    const resolveAndRedirect = async () => {
      const numId = Number(slug);
      if (!isNaN(numId) && numId > 0) {
        router.replace(`/test/${numId}`);
        return;
      }

      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (event?.id) {
        router.replace(`/test/${event.id}`);
      } else {
        router.replace("/events");
      }
    };

    resolveAndRedirect();
  }, [slug, router, supabase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <span className="text-xs font-bold text-slate-700">Mengarahkan ke Halaman Ujian...</span>
    </div>
  );
}

export default function EventTestRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs font-bold text-slate-700">Mengarahkan ke Halaman Ujian...</span>
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  );
}
