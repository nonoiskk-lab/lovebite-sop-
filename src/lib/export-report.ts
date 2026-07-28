"use client";

import type { Submission } from "./store";
import { formatToday } from "./date";

/**
 * Builds the daily SOP report as CSV and triggers a browser download.
 * CSV opens directly in Excel/Sheets — dependency-free and works offline.
 * (Swap for a true .xlsx writer later if branded formatting is needed.)
 */
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildReportCsv(submissions: Submission[]): string {
  const header = ["SOP", "Role", "Submitted by", "Time", "Status", "Details"];
  const rows = submissions.map((s) => {
    const details = s.meta.map((m) => `${m.key}: ${m.value}`).join("; ");
    return [s.sopName, s.roleLabel, s.actor, s.submittedAt, s.status, details];
  });
  return [header, ...rows]
    .map((cols) => cols.map((c) => csvEscape(String(c))).join(","))
    .join("\r\n");
}

export function downloadDailyReport(submissions: Submission[]): string {
  const csv = buildReportCsv(submissions);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `roos-daily-sop-report-${stamp}.csv`;

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  void formatToday; // (date helper kept available for future report headers)
  return filename;
}
