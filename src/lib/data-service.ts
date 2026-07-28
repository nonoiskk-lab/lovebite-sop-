/**
 * Data-service contract.
 *
 * The Phase-1 app is driven by the in-memory Zustand store (`store.ts`). This
 * interface is the seam where real persistence plugs in: implement it against
 * Supabase (queries + mutations + Storage uploads + an append to `audit_logs`)
 * and have the store call it instead of mutating local arrays. The screens
 * don't change — they already read/write through the store's action surface,
 * which mirrors these methods.
 *
 * Kept dependency-free on purpose (no `@supabase/supabase-js` import) so the
 * Phase-1 build has no backend prerequisite. See README "Wiring Supabase".
 */
import type { ResolveAction, Submission } from "./store";
import type { SopId } from "./sops";

export interface SubmitFlowInput {
  sopId: SopId;
  /** Serialized flow payload → stored in `sop_submissions.data` (jsonb). */
  data: Record<string, unknown>;
  /** Photos captured during the flow → uploaded to Storage + `sop_photos`. */
  photos?: { kind: "before" | "after" | "equipment" | "proof"; file: File }[];
}

export interface DataService {
  listSubmissions(): Promise<Submission[]>;
  latestFor(sopId: SopId): Promise<Submission | null>;
  submitFlow(input: SubmitFlowInput): Promise<Submission>;
  resolveSubmission(id: string, action: ResolveAction): Promise<Submission>;
  /** Generates + returns a URL to the daily Excel report. */
  exportDailyReport(): Promise<{ url: string }>;
}
