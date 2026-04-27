/**
 * Formats a `Date` using its **local** calendar components as `YYYY-MM-DD`.
 * Avoids UTC day-shift issues from `toISOString()` for date-of-birth style values.
 */
export function formatLocalDateAsIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
