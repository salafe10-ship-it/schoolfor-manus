export type FeeInvoiceSummary = {
  amount?: unknown;
  tax_amount?: unknown;
  paid_amount?: unknown;
  status?: unknown;
};

const excludedInvoiceStatuses = new Set(['cancelled', 'void', 'written_off', 'refunded']);

function nonNegativeAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

/** Returns the percentage of active fee invoices settled, or null when it cannot be calculated. */
export function calculateFeeCollectionRate(invoices: readonly FeeInvoiceSummary[]): number | null {
  const totals = invoices.reduce(
    (current, invoice) => {
      if (excludedInvoiceStatuses.has(String(invoice.status || '').trim().toLowerCase())) return current;
      current.billed += nonNegativeAmount(invoice.amount) + nonNegativeAmount(invoice.tax_amount);
      current.paid += nonNegativeAmount(invoice.paid_amount);
      return current;
    },
    { billed: 0, paid: 0 },
  );

  if (totals.billed <= 0) return null;
  return Number(((totals.paid / totals.billed) * 100).toFixed(1));
}
