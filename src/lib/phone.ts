/**
 * Small, dependency-free phone helpers for the Mobile OTP auth flow.
 * Mirrors the style of src/lib/validation.ts.
 */

export const DEFAULT_COUNTRY_CODE = "+91";

export const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "+91", label: "India" },
  { code: "+1", label: "US/Canada" },
  { code: "+44", label: "UK" },
  { code: "+971", label: "UAE" },
  { code: "+65", label: "Singapore" },
  { code: "+61", label: "Australia" },
];

/** Strips everything but digits. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** A local mobile number (without country code) is valid if it's 6-14 digits. */
export function isValidMobileNumber(localNumber: string): boolean {
  const digits = digitsOnly(localNumber);
  return digits.length >= 6 && digits.length <= 14;
}

/** Combines a country code and local number into E.164 form, e.g. "+919876543210". */
export function toE164(countryCode: string, localNumber: string): string {
  const code = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
  return `${code}${digitsOnly(localNumber)}`;
}
