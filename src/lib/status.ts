import type { SubmissionStatus } from "./sops";

export type TagClass =
  | "tag-success"
  | "tag-warning"
  | "tag-danger"
  | "tag-info"
  | "tag-neutral"
  // legacy aliases (kept for back-compat)
  | "tag-accent"
  | "tag-outline";

export interface StatusStyle {
  label: string;
  tagClass: TagClass;
}

/**
 * Maps a submission status to its display label + status-pill class.
 * Completed → green, pending → amber, flagged/rejected → red, in-progress → blue.
 */
export function statusStyle(status: SubmissionStatus): StatusStyle {
  switch (status) {
    case "approved":
      return { label: "Approved", tagClass: "tag-success" };
    case "logged":
      return { label: "Logged", tagClass: "tag-success" };
    case "acknowledged":
      return { label: "Acknowledged", tagClass: "tag-success" };
    case "pending":
      return { label: "Pending Approval", tagClass: "tag-warning" };
    case "flagged":
      return { label: "Flagged", tagClass: "tag-danger" };
    case "rejected":
      return { label: "Rejected", tagClass: "tag-danger" };
    case "not_started":
    default:
      return { label: "Not Started", tagClass: "tag-neutral" };
  }
}

/** Statuses that count as "done" for the manager's Completed-Today stat. */
export const COMPLETED_STATUSES: SubmissionStatus[] = [
  "approved",
  "logged",
  "acknowledged",
];

/** Statuses that land in the manager's "Needs Attention" queue. */
export const ATTENTION_STATUSES: SubmissionStatus[] = ["pending", "flagged"];
