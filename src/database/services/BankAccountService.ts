import { TreasuryRepository } from '../repositories/TreasuryRepository';
import { TreasuryValidator } from './TreasuryValidator';
import { TreasuryAccount } from '../../types';

export class BankAccountService {

  /**
   * Registers a new bank account in the system
   */
  public static async registerBankAccount(
    schoolId: string,
    accountData: {
      name: string;
      code: string;
      glAccountId: string;
      currency: string;
      isActive?: boolean;
      allowNegativeBalance?: boolean;
      notes?: string;
    }
  ): Promise<TreasuryAccount> {
    const input: Partial<TreasuryAccount> = {
      ...accountData,
      type: 'Bank Account',
      balance: 0
    };

    TreasuryValidator.validateAccountInput(schoolId, input);

    // Ensure unique code
    const existing = await TreasuryRepository.getAccountByCode(schoolId, accountData.code);
    if (existing) {
      throw new Error(`خطأ في التسجيل: الرمز البنكي (${accountData.code}) مسجل مسبقاً لحساب آخر.`);
    }

    return await TreasuryRepository.createAccount(schoolId, input);
  }

  /**
   * Retrieves all bank accounts registered for a school
   */
  public static async getBankAccounts(schoolId: string): Promise<TreasuryAccount[]> {
    const accounts = await TreasuryRepository.getAllAccounts(schoolId);
    return accounts.filter(a => a.type === 'Bank Account');
  }

  /**
   * Retrieves bank account details by ID
   */
  public static async getBankAccount(schoolId: string, id: string): Promise<TreasuryAccount> {
    const account = await TreasuryRepository.getAccountById(schoolId, id);
    if (!account || account.type !== 'Bank Account') {
      throw new Error(`الحساب البنكي المطلوب غير موجود: ${id}`);
    }
    return account;
  }

  /**
   * Toggles the active status of a bank account
   */
  public static async setAccountStatus(schoolId: string, id: string, isActive: boolean): Promise<TreasuryAccount> {
    const account = await this.getBankAccount(schoolId, id);
    return await TreasuryRepository.updateAccount(schoolId, id, { isActive });
  }
}
