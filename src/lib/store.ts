"use client";

import { create } from "zustand";
import {
  ROLE_ACTOR,
  SOP_DEFS,
  isTempOutOfRange,
  type Role,
  type SopId,
  type SubmissionStatus,
} from "./sops";
import type { PhotoKind, PhotoUpload } from "./data-service";
import { getDataService } from "./data";

/* ═══════════════════════════════════════════════════════════════════════════
   Data-layer shapes. `Submission` / `AuditEntry` map 1:1 to the
   `sop_submissions` / `audit_logs` tables. The store keeps a client cache and
   delegates all persistence to the active DataService (in-memory or Supabase).
   ═══════════════════════════════════════════════════════════════════════ */

export interface MetaEntry {
  key: string;
  value: string;
}

export interface Submission {
  id: string;
  sopId: SopId;
  sopName: string;
  role: Role;
  roleLabel: string;
  actor: string;
  submittedAt: string;
  status: SubmissionStatus;
  meta: MetaEntry[];
}

export interface AuditEntry {
  id: string;
  time: string;
  text: string;
}

export interface ConfirmPayload {
  icon: string;
  title: string;
  message: string;
}

export type ResolveAction = "approve" | "reject" | "acknowledge";

export interface PhotoState {
  previewUrl: string | null;
  blob: Blob | null;
}

interface FlowState {
  checked: Record<number, boolean>;
  photos: Record<PhotoKind, PhotoState>;
  timerSeconds: number;
  timerRunning: boolean;
  fridgeTemp: string;
  freezerTemp: string;
  cashCounted: string;
  posSales: string;
}

const emptyPhotos = (): Record<PhotoKind, PhotoState> => ({
  before: { previewUrl: null, blob: null },
  after: { previewUrl: null, blob: null },
  equipment: { previewUrl: null, blob: null },
  proof: { previewUrl: null, blob: null },
});

const emptyFlow = (): FlowState => ({
  checked: {},
  photos: emptyPhotos(),
  timerSeconds: 0,
  timerRunning: false,
  fridgeTemp: "",
  freezerTemp: "",
  cashCounted: "",
  posSales: "",
});

interface StoreState extends FlowState {
  role: Role;
  submissions: Submission[];
  auditLog: AuditEntry[];
  confirm: ConfirmPayload | null;
  toast: string | null;

  initialized: boolean;
  loading: boolean;
  error: string | null;

  // lifecycle / data
  init: () => Promise<void>;
  setRole: (role: Role) => void;

  // flow
  resetFlow: () => void;
  toggleCheck: (i: number) => void;
  setPhoto: (kind: PhotoKind, blob: Blob, previewUrl: string) => void;
  clearPhoto: (kind: PhotoKind) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  tickTimer: () => void;
  setField: (
    key: "fridgeTemp" | "freezerTemp" | "cashCounted" | "posSales",
    value: string,
  ) => void;

  // mutations
  submitFlow: (sopId: SopId) => ConfirmPayload;
  resolveSubmission: (id: string, action: ResolveAction) => void;
  setToast: (msg: string) => void;
  clearToast: () => void;

  latestFor: (sopId: SopId) => Submission | null;
}

/* — helpers — */
function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function fmtDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const PHOTO_KINDS: Record<SopId, PhotoKind[]> = {
  opening: ["before", "after"],
  temp: ["equipment"],
  cash: ["proof"],
};

export const useStore = create<StoreState>((set, get) => ({
  ...emptyFlow(),
  role: "kitchen",
  submissions: [],
  auditLog: [],
  confirm: null,
  toast: null,
  initialized: false,
  loading: false,
  error: null,

  init: async () => {
    if (get().initialized || get().loading) return;
    set({ loading: true, error: null });
    try {
      const ds = getDataService();
      const [submissions, auditLog] = await Promise.all([
        ds.listSubmissions(),
        ds.listAudit(),
      ]);
      set({ submissions, auditLog, initialized: true, loading: false });
    } catch (e) {
      set({
        loading: false,
        initialized: true,
        error: e instanceof Error ? e.message : "Failed to load data.",
      });
    }
  },

  setRole: (role) => set({ role }),

  resetFlow: () => {
    // Revoke any preview URLs from the previous run to avoid leaks.
    const { photos } = get();
    Object.values(photos).forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    set({ ...emptyFlow(), confirm: null });
  },

  toggleCheck: (i) =>
    set((s) => ({ checked: { ...s.checked, [i]: !s.checked[i] } })),

  setPhoto: (kind, blob, previewUrl) =>
    set((s) => {
      const prev = s.photos[kind];
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { photos: { ...s.photos, [kind]: { blob, previewUrl } } };
    }),

  clearPhoto: (kind) =>
    set((s) => {
      const prev = s.photos[kind];
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { photos: { ...s.photos, [kind]: { previewUrl: null, blob: null } } };
    }),

  startTimer: () => set({ timerRunning: true }),
  pauseTimer: () => set({ timerRunning: false }),
  tickTimer: () => set((s) => ({ timerSeconds: s.timerSeconds + 1 })),

  setField: (key, value) => set({ [key]: value } as Partial<StoreState>),

  submitFlow: (sopId) => {
    const s = get();
    const def = SOP_DEFS[sopId];
    const actor = ROLE_ACTOR[s.role];
    const time = nowTime();

    let status: SubmissionStatus = "pending";
    let meta: MetaEntry[] = [];
    let confirm: ConfirmPayload;

    const has = (k: PhotoKind) => s.photos[k].previewUrl !== null;

    if (sopId === "opening") {
      const items = def.items ?? [];
      const checkedCount = items.filter((_, i) => s.checked[i]).length;
      const photoCount = (has("before") ? 1 : 0) + (has("after") ? 1 : 0);
      meta = [
        { key: "Checklist", value: `${checkedCount}/${items.length}` },
        { key: "Time taken", value: fmtDuration(s.timerSeconds) },
        { key: "Photos", value: `${photoCount}/2` },
      ];
      status = "pending";
      confirm = {
        icon: "HourglassMedium",
        title: "Submitted",
        message: "Sent to your manager for approval, with a full timestamped record.",
      };
    } else if (sopId === "temp") {
      const fridge = parseFloat(s.fridgeTemp);
      const freezer = parseFloat(s.freezerTemp);
      const flagged = isTempOutOfRange(
        Number.isNaN(fridge) ? null : fridge,
        Number.isNaN(freezer) ? null : freezer,
      );
      meta = [
        { key: "Fridge", value: `${s.fridgeTemp}°C` },
        { key: "Freezer", value: `${s.freezerTemp}°C` },
        { key: "Photo", value: has("equipment") ? "Captured" : "—" },
      ];
      status = flagged ? "flagged" : "logged";
      confirm = flagged
        ? {
            icon: "Warning",
            title: "Flagged",
            message:
              "Reading is outside the safe range. Your manager has been notified automatically.",
          }
        : {
            icon: "CheckCircle",
            title: "Logged",
            message: "Reading auto-logged. No manager action needed.",
          };
    } else {
      const counted = parseFloat(s.cashCounted) || 0;
      const pos = parseFloat(s.posSales) || 0;
      const diff = counted - pos;
      meta = [
        { key: "Counted", value: `₹${counted.toFixed(2)}` },
        { key: "POS total", value: `₹${pos.toFixed(2)}` },
        { key: "Difference", value: `${diff >= 0 ? "+" : ""}₹${diff.toFixed(2)}` },
        { key: "Proof", value: has("proof") ? "Attached" : "None" },
      ];
      status = "pending";
      confirm = {
        icon: "HourglassMedium",
        title: "Submitted",
        message: "Daily Excel summary generated. Sent to your manager for approval.",
      };
    }

    const submission: Submission = {
      id: uid(),
      sopId: def.id,
      sopName: def.name,
      role: s.role,
      roleLabel: def.roleLabel,
      actor,
      submittedAt: time,
      status,
      meta,
    };
    const audit: AuditEntry = {
      id: uid(),
      time,
      text: `${actor} submitted ${def.name}${
        status === "flagged" ? " — flagged out of range." : "."
      }`,
    };

    // Optimistic local update (keeps the UI instant + offline-tolerant).
    set((prev) => ({
      confirm,
      submissions: [submission, ...prev.submissions],
      auditLog: [audit, ...prev.auditLog],
    }));

    // Persist in the background; surface an error but never lose the entry.
    const photos: PhotoUpload[] = PHOTO_KINDS[sopId]
      .map((kind) => {
        const p = s.photos[kind];
        return p.blob
          ? { kind, blob: p.blob, filename: `${kind}.jpg` }
          : null;
      })
      .filter((p): p is PhotoUpload => p !== null);

    getDataService()
      .createSubmission(submission, audit, photos)
      .catch((e) =>
        set({ error: e instanceof Error ? e.message : "Failed to save submission." }),
      );

    return confirm;
  },

  resolveSubmission: (id, action) => {
    const time = nowTime();
    const sub = get().submissions.find((x) => x.id === id);
    if (!sub) return;
    const statusMap: Record<ResolveAction, SubmissionStatus> = {
      approve: "approved",
      reject: "rejected",
      acknowledge: "acknowledged",
    };
    const newStatus = statusMap[action];
    const audit: AuditEntry = {
      id: uid(),
      time,
      text: `${ROLE_ACTOR.manager} ${statusMap[action]} ${sub.sopName} from ${sub.actor}.`,
    };

    set((prev) => ({
      submissions: prev.submissions.map((x) =>
        x.id === id ? { ...x, status: newStatus } : x,
      ),
      auditLog: [audit, ...prev.auditLog],
    }));

    getDataService()
      .updateSubmissionStatus(id, newStatus, audit)
      .catch((e) =>
        set({ error: e instanceof Error ? e.message : "Failed to update submission." }),
      );
  },

  setToast: (msg) => set({ toast: msg }),
  clearToast: () => set({ toast: null }),

  latestFor: (sopId) => {
    const list = get().submissions.filter((x) => x.sopId === sopId);
    return list.length ? list[0] : null;
  },
}));
