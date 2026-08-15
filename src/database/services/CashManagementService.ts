import { TreasuryRepository } from '../repositories/TreasuryRepository';
import { TreasuryValidator } from './TreasuryValidator';
import { TreasuryAccount, TreasuryAccountType } from '../../types';

export class CashManagementService {

  /**
   * Registers a new cash box (Main, Branch or Virtual)
   */
  public static async registerChest(
    schoolId: string,
    chestData: {
      name: string;
      code: string;
      type: 'Main Chest' | 'Branch Chest' | 'Virtual Chest';
      glAccountId: string;
      currency: string;
      isActive?: boolean;
      allowNegativeBalance?: boolean;
      notes?: string;
    }
  ): Promise<TreasuryAccount> {
    const input: Partial<TreasuryAccount> = {
      ...chestData,
      balance: 0
    };

    TreasuryValidator.validateAccountInput(schoolId, input);

    // Ensure code uniqueness
    const existing = await TreasuryRepository.getAccountByCode(schoolId, chestData.code);
    if (existing) {
      throw new Error(`خطأ في التسجيل: رمز صندوق النقدية (${chestData.code}) مسجل مسبقاً لصندوق آخر.`);
    }

    return await TreasuryRepository.createAccount(schoolId, input);
  }

  /**
   * Returns all cash chests for a school
   */
  public static async getChests(schoolId: string): Promise<TreasuryAccount[]> {
    const accounts = await TreasuryRepository.getAllAccounts(schoolId);
    return accounts.filter(a => a.type === 'Main Chest' || a.type === 'Branch Chest' || a.type === 'Virtual Chest');
  }

  /**
   * Retrieves details of a specific chest by ID
   */
  public static async getChest(schoolId: string, id: string): Promise<TreasuryAccount> {
    const account = await TreasuryRepository.getAccountById(schoolId, id);
    if (!account || (account.type !== 'Main Chest' && account.type !== 'Branch Chest' && account.type !== 'Virtual Chest')) {
      throw new Error(`صندوق النقدية المطلوب غير موجود: ${id}`);
    }
    return account;
  }
}
