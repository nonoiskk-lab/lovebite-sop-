"use client";

import { useEffect, useRef, useState } from "react";

export const DEFAULT_COOLDOWN_SECONDS = 45;

/** Countdown-seconds hook backing every "resend" control (reasonable cooldown, not unlimited). */
export function useCooldown(seconds: number = DEFAULT_COOLDOWN_SECONDS) {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = () => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  return { cooldown, start };
}
