/**
 * Pure age helpers. We persist only the birth date ("YYYY-MM-DD") and derive
 * the age on read so it stays current. All math is done in UTC against an
 * injected `now` so the functions are deterministic and testable.
 */

export const MIN_AGE = 13;
export const MAX_AGE = 100;

const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDob(dob: string): { y: number; m: number; d: number } | null {
  if (!DOB_RE.test(dob)) return null;
  const [y, m, d] = dob.split("-").map(Number);
  // Reject impossible calendar dates (e.g. 02-30, 02-29 on non-leap years).
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmt(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Full-year age, or null when `dob` is missing/invalid. */
export function computeAge(dob: string | null | undefined, now: Date): number | null {
  if (!dob) return null;
  const p = parseDob(dob);
  if (!p) return null;
  const yNow = now.getUTCFullYear();
  const mNow = now.getUTCMonth() + 1;
  const dNow = now.getUTCDate();
  let age = yNow - p.y;
  if (mNow < p.m || (mNow === p.m && dNow < p.d)) age--;
  return age < 0 ? null : age;
}

/**
 * Convert an inclusive age range into a DOB string window for Mongo. ISO
 * "YYYY-MM-DD" strings sort lexicographically, so $gte/$lte on the stored
 * string works without per-document computation.
 */
export function ageRangeToDobWindow(
  minAge: number | undefined,
  maxAge: number | undefined,
  now: Date,
): { gte?: string; lte?: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  const win: { gte?: string; lte?: string } = {};
  if (minAge !== undefined) {
    // age >= minAge  <=>  dob <= today - minAge years
    const minDate = new Date(Date.UTC(y - minAge, m - 1, d));
    win.lte = fmt(minDate.getUTCFullYear(), minDate.getUTCMonth() + 1, minDate.getUTCDate());
  }
  if (maxAge !== undefined) {
    // age <= maxAge  <=>  dob >= today - (maxAge+1) years + 1 day
    const base = new Date(Date.UTC(y - (maxAge + 1), m - 1, d));
    base.setUTCDate(base.getUTCDate() + 1);
    win.gte = fmt(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
  }
  return win;
}

/** True when `dob` is a real calendar date, not in the future, age in [13,100]. */
export function isValidDob(dob: string, now: Date): boolean {
  const p = parseDob(dob);
  if (!p) return false;
  const bornUTC = Date.UTC(p.y, p.m - 1, p.d);
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (bornUTC > nowUTC) return false;
  const age = computeAge(dob, now);
  return age !== null && age >= MIN_AGE && age <= MAX_AGE;
}
