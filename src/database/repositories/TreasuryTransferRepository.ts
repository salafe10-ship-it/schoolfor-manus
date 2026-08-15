import { FallbackStorage } from './FallbackStorage';
import { UnitOfWork } from '../UnitOfWork';
import { TreasuryTransfer, TreasuryTransactionStatus } from '../../types';

/**
 * Enterprise Treasury Transfer Repository (DAL)
 * Responsible ONLY for persistence, retrieval, and querying of TreasuryTransfer entities.
 * STRICTLY contains no business rules, validation, or ledger logic (adhering to domain separation).
 */
export class TreasuryTransferRepository {

  public static async getById(schoolId: string, id: string): Promise<TreasuryTransfer | null> {
    let transfers = FallbackStorage.getTreasuryTransfers();
    if (UnitOfWork.isTransactionActive()) {
      transfers = UnitOfWork.getPendingAll('treasury_transfers', transfers);
    }
    const transfer = transfers.find(t => t.id === id);
    if (!transfer) return null;

    if (transfer.schoolId !== schoolId) {
      throw new Error('حظر أمني للمستأجر: لا يمكن الوصول لحركة تحويل تابعة لمؤسسة أخرى.');
    }
    return transfer;
  }

  public static async getAll(schoolId: string): Promise<TreasuryTransfer[]> {
    let transfers = FallbackStorage.getTreasuryTransfers();
    if (UnitOfWork.isTransactionActive()) {
      transfers = UnitOfWork.getPendingAll('treasury_transfers', transfers);
    }
    return transfers.filter(t => t.schoolId === schoolId);
  }

  public static async query(
    schoolId: string,
    filters?: {
      sourceAccountId?: string;
      destinationAccountId?: string;
      status?: TreasuryTransactionStatus;
    }
  ): Promise<TreasuryTransfer[]> {
    let transfers = await this.getAll(schoolId);

    if (filters) {
      if (filters.sourceAccountId) {
        transfers = transfers.filter(t => t.sourceAccountId === filters.sourceAccountId);
      }
      if (filters.destinationAccountId) {
        transfers = transfers.filter(t => t.destinationAccountId === filters.destinationAccountId);
      }
      if (filters.status) {
        transfers = transfers.filter(t => t.status === filters.status);
      }
    }

    return transfers;
  }

  public static async save(schoolId: string, transfer: TreasuryTransfer): Promise<TreasuryTransfer> {
    if (transfer.schoolId !== schoolId) {
      throw new Error('حظر أمني للمستأجر: معرف المدرسة لا يطابق المستند.');
    }

    let transfers = FallbackStorage.getTreasuryTransfers();
    if (UnitOfWork.isTransactionActive()) {
      transfers = UnitOfWork.getPendingAll('treasury_transfers', transfers);
    }

    const index = transfers.findIndex(t => t.id === transfer.id);
    const now = new Date().toISOString();
    const preparedTransfer: TreasuryTransfer = {
      ...transfer,
      updatedAt: now,
      version: (transfer.version || 0) + 1
    };

    if (UnitOfWork.isTransactionActive()) {
      if (index === -1) {
        UnitOfWork.enlistCreate('treasury_transfers', preparedTransfer.id, preparedTransfer);
      } else {
        UnitOfWork.enlistUpdate('treasury_transfers', preparedTransfer.id, preparedTransfer);
      }
      return preparedTransfer;
    }

    if (index === -1) {
      transfers.push(preparedTransfer);
    } else {
      transfers[index] = preparedTransfer;
    }

    FallbackStorage.saveTreasuryTransfers(transfers);
    return preparedTransfer;
  }
}
