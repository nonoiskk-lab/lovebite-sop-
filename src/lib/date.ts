/** "Monday, July 28" — the Today header date. Client-formatted. */
export function formatToday(d: Date = new Date()): string {
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
