"use client";

import type { DataService, PhotoUpload } from "../data-service";
import type { AuditEntry, Submission } from "../store";
import type { SubmissionStatus } from "../sops";

/**
 * Demo-mode data service. Holds submissions + audit in localStorage so data
 * survives refreshes without any backend. Photos are ignored here (the UI
 * keeps a local object-URL preview); real uploads happen in the Supabase impl.
 */
const SUBS_KEY = "roos.submissions.v1";
const AUDIT_KEY = "roos.audit.v1";

const SEED_SUBMISSIONS: Submission[] = [
  {
    id: "seed-sub-1",
    sopId: "temp",
    sopName: "Temperature Log",
    role: "kitchen",
    roleLabel: "Kitchen",
    actor: "Ravi Kumar",
    submittedAt: "11:04 AM",
    status: "flagged",
    meta: [
      { key: "Fridge", value: "4.1°C" },
      { key: "Freezer", value: "-9°C" },
      { key: "Note", value: "Freezer above -15°C threshold" },
    ],
  },
];

const SEED_AUDIT: AuditEntry[] = [
  {
    id: "seed-a-1",
    time: "11:05 AM",
    text: "System flagged Temperature Log — freezer reading -9°C exceeds -15°C safe threshold.",
  },
  { id: "seed-a-2", time: "11:04 AM", text: "Ravi Kumar submitted Temperature Log." },
  { id: "seed-a-3", time: "7:10 AM", text: "Aisha Sen (Manager) approved Opening Checklist." },
  {
    id: "seed-a-4",
    time: "6:58 AM",
    text: "Ravi Kumar submitted Opening Checklist for approval.",
  },
];

function read<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      window.localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return seed;
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore, keep in-memory only */
  }
}

export class InMemoryDataService implements DataService {
  async listSubmissions(): Promise<Submission[]> {
    return read<Submission>(SUBS_KEY, SEED_SUBMISSIONS);
  }

  async listAudit(): Promise<AuditEntry[]> {
    return read<AuditEntry>(AUDIT_KEY, SEED_AUDIT);
  }

  async createSubmission(
    submission: Submission,
    audit: AuditEntry,
    _photos?: PhotoUpload[],
  ): Promise<void> {
    void _photos;
    const subs = await this.listSubmissions();
    write(SUBS_KEY, [submission, ...subs]);
    const log = await this.listAudit();
    write(AUDIT_KEY, [audit, ...log]);
  }

  async updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
    audit: AuditEntry,
  ): Promise<void> {
    const subs = await this.listSubmissions();
    write(
      SUBS_KEY,
      subs.map((s) => (s.id === id ? { ...s, status } : s)),
    );
    const log = await this.listAudit();
    write(AUDIT_KEY, [audit, ...log]);
  }
}
