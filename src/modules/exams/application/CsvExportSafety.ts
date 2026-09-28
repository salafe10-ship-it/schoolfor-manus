/** Quote CSV fields and neutralize spreadsheet formula markers, including
 * markers preceded by whitespace or control characters. */
export function csvEscapeField(value: unknown): string {
  const text = String(value ?? '');
  const formulaSafe = /^[\u0000-\u0020]*[=+\-@]/.test(text.normalize('NFKC')) ? `'${text}` : text;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}
