/** Format a calendar date in the user's local time zone without shifting it through UTC. */
export function toLocalDateInputValue(date: Date): string {
  if (!Number.isFinite(date.getTime())) return '';
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
