"use client";

import { getSupabaseClient } from "@/lib/supabase/client";

export type AttendanceStatus = "present" | "late" | "half_day" | "absent";

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  workDate: string;
  checkIn: string;
  checkOut: string | null;
  status: AttendanceStatus;
}

/** Check-in after this time counts as Late. Kept simple, no per-shift schedule. */
const LATE_AFTER = { hour: 9, minute: 15 };
/** Worked hours below this on checkout downgrades the day to Half Day. */
const HALF_DAY_MAX_HOURS = 4;

function sb() {
  const c = getSupabaseClient();
  if (!c) throw new Error("Backend not configured.");
  return c;
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local
}

export function workingHours(checkIn: string, checkOut: string | null): string {
  const end = checkOut ? new Date(checkOut) : new Date();
  const ms = end.getTime() - new Date(checkIn).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function computeCheckInStatus(checkIn: Date): AttendanceStatus {
  const late =
    checkIn.getHours() > LATE_AFTER.hour ||
    (checkIn.getHours() === LATE_AFTER.hour && checkIn.getMinutes() > LATE_AFTER.minute);
  return late ? "late" : "present";
}

function mapRow(r: Record<string, unknown>): AttendanceRecord {
  const u = r.users as { full_name?: string } | null;
  return {
    id: r.id as string,
    userId: r.user_id as string,
    userName: u?.full_name ?? "",
    workDate: r.work_date as string,
    checkIn: r.check_in as string,
    checkOut: (r.check_out as string) ?? null,
    status: r.status as AttendanceStatus,
  };
}

/** Today's record for the signed-in user, or null if not checked in yet. */
export async function myTodayRecord(): Promise<AttendanceRecord | null> {
  const { data: userRes } = await sb().auth.getUser();
  const uid = userRes.user?.id;
  const { data, error } = await sb()
    .from("attendance_records")
    .select("id, user_id, work_date, check_in, check_out, status, users(full_name)")
    .eq("user_id", uid)
    .eq("work_date", todayStr())
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function checkIn(): Promise<void> {
  const { data: userRes } = await sb().auth.getUser();
  const uid = userRes.user?.id;
  const { data: profile } = await sb().from("users").select("restaurant_id").eq("id", uid).single();
  const now = new Date();
  const { error } = await sb().from("attendance_records").insert({
    restaurant_id: profile?.restaurant_id,
    user_id: uid,
    work_date: todayStr(),
    check_in: now.toISOString(),
    status: computeCheckInStatus(now),
  });
  if (error) throw error;
}

export async function checkOut(recordId: string, checkInIso: string): Promise<void> {
  const now = new Date();
  const hours = (now.getTime() - new Date(checkInIso).getTime()) / 3600000;
  const current = computeCheckInStatus(new Date(checkInIso));
  const status: AttendanceStatus = hours < HALF_DAY_MAX_HOURS ? "half_day" : current;
  const { error } = await sb()
    .from("attendance_records")
    .update({ check_out: now.toISOString(), status })
    .eq("id", recordId);
  if (error) throw error;
}

/** All records for today, across the restaurant (manager view). */
export async function listToday(): Promise<AttendanceRecord[]> {
  const { data, error } = await sb()
    .from("attendance_records")
    .select("id, user_id, work_date, check_in, check_out, status, users(full_name)")
    .eq("work_date", todayStr())
    .order("check_in", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** My own history, most recent first. */
export async function myHistory(limit = 30): Promise<AttendanceRecord[]> {
  const { data: userRes } = await sb().auth.getUser();
  const uid = userRes.user?.id;
  const { data, error } = await sb()
    .from("attendance_records")
    .select("id, user_id, work_date, check_in, check_out, status, users(full_name)")
    .eq("user_id", uid)
    .order("work_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function totalStaffCount(): Promise<number> {
  const { count, error } = await sb()
    .from("users")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}
