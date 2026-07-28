import type { SubmissionStatus } from "./sops";

export type TagClass = "tag-accent" | "tag-outline" | "tag-neutral";

export interface StatusStyle {
  label: string;
  tagClass: TagClass;
}

/**
 * Maps a submission status to its display label + Nocturne tag class.
 * Mirrors `statusStyle()` from the prototype.
 */
export function statusStyle(status: SubmissionStatus): StatusStyle {
  switch (status) {
    case "approved":
      return { label: "Approved", tagClass: "tag-accent" };
    case "logged":
      return { label: "Logged", tagClass: "tag-accent" };
    case "acknowledged":
      return { label: "Acknowledged", tagClass: "tag-accent" };
    case "pending":
      return { label: "Pending Approval", tagClass: "tag-outline" };
    case "flagged":
      return { label: "Flagged", tagClass: "tag-outline" };
    case "rejected":
      return { label: "Rejected", tagClass: "tag-neutral" };
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
