"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/carer");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-500 font-medium animate-pulse">Loading Aegis Portal...</p>
      </div>
    </Tabs>
  );
}
