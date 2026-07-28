/**
 * Data-service contract — the seam between the UI/store and persistence.
 *
 * Two implementations satisfy it:
 *   • InMemoryDataService  — demo mode; localStorage-backed (no backend).
 *   • SupabaseDataService  — real persistence, Storage uploads, audit rows.
 *
 * `getDataService()` (data/index.ts) picks one based on whether Supabase env
 * is configured. The Zustand store talks only to this interface, so the
 * screens are identical in both modes.
 */
import type { AuditEntry, Submission } from "./store";
import type { SubmissionStatus } from "./sops";

export type PhotoKind = "before" | "after" | "equipment" | "proof";

export interface PhotoUpload {
  kind: PhotoKind;
  blob: Blob;
  filename: string;
}

export interface DataService {
  /** All submissions, newest first. */
  listSubmissions(): Promise<Submission[]>;
  /** Append-only audit log, newest first. */
  listAudit(): Promise<AuditEntry[]>;
  /** Persist a new submission (+ its audit row + any captured photos). */
  createSubmission(
    submission: Submission,
    audit: AuditEntry,
    photos?: PhotoUpload[],
  ): Promise<void>;
  /** Manager resolution — new status + an audit row. */
  updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
    audit: AuditEntry,
  ): Promise<void>;
}
