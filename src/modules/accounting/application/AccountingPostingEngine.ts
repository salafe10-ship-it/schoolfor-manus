import { AccountingEvent } from '../domain/AccountingEvents';

export class AccountingPostingEngine {
  /**
   * Central entry point for all accounting operations.
   * Modules MUST NOT create journal entries directly.
   */
  public static async post(event: AccountingEvent): Promise<void> {
    // Do not manufacture account mappings or report a financial success without
    // an approved canonical mapping and persistence contract.
    throw new Error(
      `ACCOUNTING DECISION REQUIRED: لا يمكن ترحيل الحدث ${event.type} قبل اعتماد Account Mapping والحفظ المحاسبي الكانوني.`
    );
  }

}
