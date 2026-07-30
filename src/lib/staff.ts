"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/sops";

export interface StaffMember {
  id: string;
  fullName: string;
  email: string | null;
  role: Role;
}

function sb() {
  const c = getSupabaseClient();
  if (!c) throw new Error("Backend not configured.");
  return c;
}

export async function listStaff(): Promise<StaffMember[]> {
  const { data, error } = await sb()
    .from("users")
    .select("id, full_name, email, role")
    .is("deleted_at", null)
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    role: r.role as Role,
  }));
}

export async function updateStaffRole(userId: string, role: Role): Promise<void> {
  const { error } = await sb().from("users").update({ role }).eq("id", userId);
  if (error) throw error;
}
