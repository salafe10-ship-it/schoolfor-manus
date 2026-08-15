import { TreasuryTransactionStatus } from '../../types';

/**
 * Enterprise Treasury Transfer State Machine
 * Establishes strict state transition guards.
 * Throws clean Arabic domain exceptions when a violation occurs.
 */
export class TreasuryTransferStateMachine {
  
  // Define valid next states for each starting state
  private static readonly VALID_TRANSITIONS: Record<TreasuryTransactionStatus, TreasuryTransactionStatus[]> = {
    'Draft': ['Pending Approval', 'Cancelled'],
    'Pending Approval': ['Approved', 'Cancelled'],
    'Approved': ['Executing', 'Cancelled'],
    'Executing': ['Executed', 'Cancelled'],
    'Executed': ['Posted', 'Reversed'],
    'Posted': ['Reconciled', 'Reversed'],
    'Reconciled': ['Archived', 'Reversed'],
    'Cancelled': ['Archived'],
    'Reversed': ['Posted', 'Archived'],
    'Archived': [] // Terminal state
  };

  /**
   * Asserts whether a transition from one state to another is allowed.
   * Throws detailed Arabic error if not allowed.
   */
  public static validateTransition(current: TreasuryTransactionStatus, next: TreasuryTransactionStatus): void {
    if (current === next) return; // No-op for same-state updates

    const allowed = this.VALID_TRANSITIONS[current];
    if (!allowed || !allowed.includes(next)) {
      throw new Error(
        `فشل انتقال حالة التحويل: غير مسموح بالانتقال من حالة [${this.getStateNameArabic(current)}] إلى حالة [${this.getStateNameArabic(next)}].`
      );
    }
  }

  /**
   * Map status keys to elegant human-readable Arabic translations.
   */
  public static getStateNameArabic(status: TreasuryTransactionStatus): string {
    switch (status) {
      case 'Draft': return 'مسودة';
      case 'Pending Approval': return 'قيد المراجعة والموافقة';
      case 'Approved': return 'تمت الموافقة عليه';
      case 'Executing': return 'قيد التنفيذ والتحويل';
      case 'Executed': return 'تم التنفيذ الفعلي';
      case 'Posted': return 'مرحّل دفترياً';
      case 'Reconciled': return 'تمت التسوية البنكية';
      case 'Cancelled': return 'ملغي';
      case 'Reversed': return 'عكسي / مرتجع';
      case 'Archived': return 'مؤرشف ومغلق';
      default: return status;
    }
  }
}
