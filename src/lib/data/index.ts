"use client";

import type { DataService } from "../data-service";
import { getSupabaseClient } from "../supabase/client";
import { InMemoryDataService } from "./in-memory";
import { SupabaseDataService } from "./supabase";

let instance: DataService | null = null;

/**
 * Returns the active data service: Supabase when configured + a client is
 * available, otherwise the in-memory (demo) service. Memoized for the session.
 */
export function getDataService(): DataService {
  if (instance) return instance;
  const sb = getSupabaseClient();
  instance = sb ? new SupabaseDataService(sb) : new InMemoryDataService();
  return instance;
}
