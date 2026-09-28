/**
 * Prefixes values that spreadsheet programs could interpret as formulas.
 * Detection normalizes compatibility characters and leading controls while
 * preserving the original text after the protective apostrophe.
 */
export function escapeExamSpreadsheetFormula(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const detectionValue = text.normalize('NFKC');
  const startsWithControlCharacter = /^[\u0000-\u001F]/.test(detectionValue);
  const startsWithFormulaMarker = /^[\u0000-\u0020]*[=+\-@]/.test(detectionValue);
  return startsWithControlCharacter || startsWithFormulaMarker ? `'${text}` : text;
}
