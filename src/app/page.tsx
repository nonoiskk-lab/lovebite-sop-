"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/** Entry point — routes to the current role's landing screen. */
export default function Home() {
  const role = useStore((s) => s.role);
  const router = useRouter();

  useEffect(() => {
    router.replace(role === "manager" ? "/manager" : "/today");
  }, [role, router]);

  return null;
}
