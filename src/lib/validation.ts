/**
 * Small, dependency-free form validators reused across the auth screens.
 */

/** Basic RFC-ish email shape check. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type PasswordLabel = "Weak" | "Fair" | "Good" | "Strong";

export interface PasswordCheck {
  length: boolean; // >= 8 chars
  lower: boolean;
  upper: boolean;
  number: boolean;
  symbol: boolean;
  /** 0–4, for the strength meter. */
  score: number;
  label: PasswordLabel;
  /** Meets the minimum bar to submit (length + lower + upper + number). */
  valid: boolean;
}

/** Scores password strength and reports which rules are unmet. */
export function checkPassword(pw: string): PasswordCheck {
  const length = pw.length >= 8;
  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const number = /\d/.test(pw);
  const symbol = /[^A-Za-z0-9]/.test(pw);

  const passed = [length, lower, upper, number, symbol].filter(Boolean).length;
  const valid = length && lower && upper && number;

  // Map the 5 checks onto a 0–4 meter.
  let score = 0;
  if (pw.length > 0) score = Math.max(1, passed - 1);
  score = Math.min(score, 4);

  const label: PasswordLabel =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  return { length, lower, upper, number, symbol, score, label, valid };
}

/** Human list of the still-unmet password rules (for inline hints). */
export function unmetPasswordRules(c: PasswordCheck): string[] {
  const rules: string[] = [];
  if (!c.length) rules.push("8+ characters");
  if (!c.lower) rules.push("a lowercase letter");
  if (!c.upper) rules.push("an uppercase letter");
  if (!c.number) rules.push("a number");
  return rules;
}
