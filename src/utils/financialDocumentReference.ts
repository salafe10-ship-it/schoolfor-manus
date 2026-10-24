export type FinancialDocumentKind = 'invoice' | 'receipt' | 'payment' | 'journal';

export interface FinancialDocumentReference {
  value: string;
  fullId: string;
  isDocumentNumber: boolean;
  label: string;
}

const asText = (value: unknown): string => String(value ?? '').trim();

const shortenSystemId = (value: string): string => {
  if (value.length <= 24) return value;
  const uuid = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  if (uuid?.index !== undefined) return `${value.slice(0, uuid.index)}…${uuid[0].slice(-8)}`;
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
};

/**
 * Keep business document numbers distinct from database/canonical ERP keys.
 * Legacy RV/PV/JV serials remain valid document numbers; canonical ERP-JV
 * identifiers are always treated as internal keys unless an explicit number
 * field is present.
 */
export function resolveFinancialDocumentReference(
  record: Record<string, unknown> | null | undefined,
  kind: FinancialDocumentKind,
): FinancialDocumentReference {
  const source = record || {};
  const canonicalJournal = source.canonicalJournalEntry && typeof source.canonicalJournalEntry === 'object'
    ? source.canonicalJournalEntry as Record<string, unknown>
    : {};
  const canonicalSourcePayload = canonicalJournal.sourcePayload && typeof canonicalJournal.sourcePayload === 'object'
    ? canonicalJournal.sourcePayload as Record<string, unknown>
    : {};
  const id = kind === 'journal'
    ? asText(source.journalEntryId) || asText(canonicalJournal.id) || asText(source.id)
    : asText(source.id);
  const candidates: Record<FinancialDocumentKind, string[]> = {
    invoice: [asText(source.invoiceNumber), asText(source.documentNumber)],
    receipt: [
      asText(source.receiptVoucherId),
      asText(source.voucherNumber),
      asText(source.documentNumber),
      asText(canonicalJournal.sourceDocumentNumber),
      asText(canonicalSourcePayload.receiptVoucherId),
      asText(canonicalSourcePayload.voucherNumber),
    ],
    payment: [
      asText(source.voucherNumber),
      asText(source.paymentVoucherNumber),
      asText(source.documentNumber),
      asText(canonicalJournal.sourceDocumentNumber),
      asText(canonicalSourcePayload.paymentVoucherNumber),
      asText(canonicalSourcePayload.voucherNumber),
    ],
    journal: [
      asText(source.journalNumber),
      asText(source.journal_number),
      asText(source.documentNumber),
      asText(canonicalJournal.journalNumber),
      asText(canonicalJournal.journal_number),
      asText(canonicalJournal.documentNumber),
    ],
  };
  const explicitNumber = candidates[kind].find(Boolean) || '';
  const legacySerialPattern: Record<FinancialDocumentKind, RegExp> = {
    invoice: /^(?:INV|FEE|CLAIM)-\d{4}-\d{3,}$/i,
    receipt: /^(?:RCV|RV)-\d{4}-\d{3,}$/i,
    payment: /^PV-\d{4}-\d{3,}$/i,
    journal: /^JV-\d{4}-(?:(?:RV|PV|REV)-)?\d{3,}$/i,
  };
  const legacyNumber = legacySerialPattern[kind].test(id) ? id : '';
  const number = explicitNumber || legacyNumber;
  const fullId = id || number;

  if (number) {
    return {
      value: number,
      fullId,
      isDocumentNumber: true,
      label: kind === 'journal' ? 'رقم القيد' : 'رقم المستند',
    };
  }

  return {
    value: id ? `معرّف النظام · ${shortenSystemId(id)}` : 'غير متاح',
    fullId,
    isDocumentNumber: false,
    label: kind === 'journal' ? 'معرّف القيد بالنظام' : 'معرّف النظام',
  };
}
