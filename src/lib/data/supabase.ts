"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataService, PhotoUpload } from "../data-service";
import type { AuditEntry, Submission } from "../store";
import type { SopId, SubmissionStatus } from "../sops";
import { PHOTO_BUCKET } from "../supabase/config";

/**
 * Real persistence against Supabase.
 *
 * Display fields (sopName, role labels, actor, formatted time, meta) are kept
 * in `sop_submissions.data` (jsonb) so a submission renders without joins,
 * while the typed columns (sop_id, submitted_by, status, …) stay populated for
 * reporting and RLS. Requires a signed-in user whose id matches a `users` row,
 * and the `sops` catalog seeded (see supabase/seed.sql).
 */
interface SopRef {
  id: string;
  restaurant_id: string;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export class SupabaseDataService implements DataService {
  private sopRefCache = new Map<SopId, SopRef>();

  constructor(private readonly sb: SupabaseClient) {}

  private async currentUserId(): Promise<string> {
    const { data } = await this.sb.auth.getUser();
    if (!data.user) throw new Error("Not signed in.");
    return data.user.id;
  }

  private async resolveSop(sopId: SopId): Promise<SopRef> {
    const cached = this.sopRefCache.get(sopId);
    if (cached) return cached;
    const { data, error } = await this.sb
      .from("sops")
      .select("id, restaurant_id")
      .eq("slug", sopId)
      .is("deleted_at", null)
      .limit(1)
      .single();
    if (error || !data) throw new Error(`SOP "${sopId}" not found in catalog.`);
    const ref: SopRef = { id: data.id, restaurant_id: data.restaurant_id };
    this.sopRefCache.set(sopId, ref);
    return ref;
  }

  async listSubmissions(): Promise<Submission[]> {
    const { data, error } = await this.sb
      .from("sop_submissions")
      .select("id, status, data")
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const d = (row.data ?? {}) as Partial<Submission>;
      return {
        id: row.id,
        sopId: d.sopId as SopId,
        sopName: d.sopName ?? "",
        role: d.role ?? "kitchen",
        roleLabel: d.roleLabel ?? "",
        actor: d.actor ?? "",
        submittedAt: d.submittedAt ?? "",
        status: row.status as SubmissionStatus,
        meta: d.meta ?? [],
      } satisfies Submission;
    });
  }

  async listAudit(): Promise<AuditEntry[]> {
    const { data, error } = await this.sb
      .from("audit_logs")
      .select("id, action, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      time: fmtTime(row.created_at),
      text: row.action,
    }));
  }

  async createSubmission(
    submission: Submission,
    audit: AuditEntry,
    photos?: PhotoUpload[],
  ): Promise<void> {
    const uid = await this.currentUserId();
    const sop = await this.resolveSop(submission.sopId);

    const { error: subErr } = await this.sb.from("sop_submissions").insert({
      id: submission.id,
      sop_id: sop.id,
      restaurant_id: sop.restaurant_id,
      submitted_by: uid,
      submitted_at: new Date().toISOString(),
      status: submission.status,
      data: {
        sopId: submission.sopId,
        sopName: submission.sopName,
        role: submission.role,
        roleLabel: submission.roleLabel,
        actor: submission.actor,
        submittedAt: submission.submittedAt,
        meta: submission.meta,
      },
      created_by: uid,
      updated_by: uid,
    });
    if (subErr) throw subErr;

    if (photos?.length) {
      for (const p of photos) {
        const path = `${sop.restaurant_id}/${submission.id}/${p.kind}-${p.filename}`;
        const { error: upErr } = await this.sb.storage
          .from(PHOTO_BUCKET)
          .upload(path, p.blob, { upsert: true });
        if (upErr) continue; // don't fail the whole submission on a photo error
        await this.sb.from("sop_photos").insert({
          submission_id: submission.id,
          kind: p.kind,
          storage_path: path,
          created_by: uid,
        });
      }
    }

    await this.sb.from("audit_logs").insert({
      id: audit.id,
      restaurant_id: sop.restaurant_id,
      actor_id: uid,
      action: audit.text,
      entity_type: "sop_submission",
      entity_id: submission.id,
    });
  }

  async updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
    audit: AuditEntry,
  ): Promise<void> {
    const uid = await this.currentUserId();
    // Return restaurant_id so the audit row can carry it — the audit_logs RLS
    // insert policy requires restaurant_id = current_restaurant_id().
    const { data, error } = await this.sb
      .from("sop_submissions")
      .update({
        status,
        resolved_by: uid,
        resolved_at: new Date().toISOString(),
        updated_by: uid,
      })
      .eq("id", id)
      .select("restaurant_id")
      .single();
    if (error) throw error;

    await this.sb.from("audit_logs").insert({
      id: audit.id,
      restaurant_id: data.restaurant_id,
      actor_id: uid,
      action: audit.text,
      entity_type: "sop_submission",
      entity_id: id,
    });
  }
}
