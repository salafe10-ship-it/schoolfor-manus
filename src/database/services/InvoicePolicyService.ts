import { Invoice } from '../../types';
import { InvoiceRepository } from '../repositories/InvoiceRepository';

/**
 * Enterprise Invoice Policy Service
 * Holds and enforces complex enterprise billing rules, taxes, discounts, and state criteria.
 */
export class InvoicePolicyService {
  /**
   * Evaluates if an invoice can be modified directly in its current state.
   * Modifying after Approved or Issued is strictly forbidden. Must use Credit/Debit Notes instead.
   */
  public static canModify(invoice: Invoice): boolean {
    const status = invoice.status;
    const lockStatuses = [
      'Approved',
      'Issued',
      'Partially Paid',
      'Paid',
      'Partially Refunded',
      'Refunded',
      'Cancelled',
      'Void',
      'Archived',
      'paid', // legacy
      'partial', // legacy
      'written_off' // legacy
    ];
    return !lockStatuses.includes(status);
  }

  /**
   * Evaluates if an invoice can be deleted.
   * If it contains transactions, payment histories, or has been Issued, deletion is strictly blocked.
   */
  public static canDelete(invoice: Invoice): boolean {
    if (invoice.transactions && invoice.transactions.length > 0) {
      return false;
    }
    const safeToDelete = ['Draft', 'Pending Approval', 'unpaid'];
    return safeToDelete.includes(invoice.status);
  }

  /**
   * Checks for duplicate invoices within the same tenant.
   * Prevents issuing duplicate bills for the same student, item category, and academic period.
   */
  public static async isDuplicate(schoolId: string, studentId: string, description: string): Promise<boolean> {
    const { data: currentInvoices } = await InvoiceRepository.getAll(schoolId, { studentId });
    return currentInvoices.some(inv => 
      inv.item.trim() === description.trim() && 
      inv.status !== 'Cancelled' && 
      inv.status !== 'Void' &&
      inv.status !== 'written_off'
    );
  }

  /**
   * Recalculates subtotal, taxes, discounts, charges, and updates totals.
   */
  public static calculateTotals(invoice: Partial<Invoice>): {
    amount: number;
    taxAmount: number;
    totalAmount: number;
    remainingAmount: number;
  } {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;
    let chargeAmount = 0;

    // Calculate from lines if present
    if (invoice.lines && invoice.lines.length > 0) {
      invoice.lines.forEach(line => {
        const lineSubtotal = line.unitPrice * line.quantity;
        line.amount = lineSubtotal;
        subtotal += lineSubtotal;

        if (line.taxRatePercent) {
          const lineTax = (lineSubtotal * line.taxRatePercent) / 100;
          line.taxAmount = lineTax;
          taxAmount += lineTax;
        }

        if (line.discountAmount) {
          discountAmount += line.discountAmount;
        }
      });
    } else if (invoice.items && invoice.items.length > 0) {
      // Calculate from legacy items
      invoice.items.forEach(it => {
        subtotal += it.amount;
      });
    } else {
      subtotal = invoice.amount || 0;
    }

    // Taxes
    if (invoice.taxes && invoice.taxes.length > 0) {
      invoice.taxes.forEach(t => {
        t.taxableAmount = subtotal;
        t.taxAmount = (subtotal * t.taxRatePercent) / 100;
        taxAmount += t.taxAmount;
      });
    }

    // Discounts
    if (invoice.discounts && invoice.discounts.length > 0) {
      invoice.discounts.forEach(d => {
        if (d.discountType === 'percentage') {
          d.discountAmount = (subtotal * d.discountValue) / 100;
        } else {
          d.discountAmount = d.discountValue;
        }
        discountAmount += d.discountAmount;
      });
    }

    // Charges
    if (invoice.charges && invoice.charges.length > 0) {
      invoice.charges.forEach(c => {
        chargeAmount += c.chargeAmount;
      });
    }

    // Compute Grand Totals
    const totalAmount = Math.max(0, subtotal + taxAmount + chargeAmount - discountAmount);
    const remainingAmount = totalAmount - (invoice.amount - (invoice.remainingAmount ?? invoice.totalAmount ?? totalAmount));

    return {
      amount: subtotal,
      taxAmount,
      totalAmount,
      remainingAmount: Math.max(0, remainingAmount)
    };
  }
}
