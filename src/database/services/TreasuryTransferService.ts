import { UnitOfWork } from '../UnitOfWork';
import { TreasuryRepository } from '../repositories/TreasuryRepository';
import { TreasuryTransferRepository } from '../repositories/TreasuryTransferRepository';
import { JournalRepository } from '../repositories/JournalRepository';
import { TreasuryTransferStateMachine } from './TreasuryTransferStateMachine';
import { TreasuryTransferDomainRules } from './TreasuryTransferDomainRules';
import { PostingEngine } from './PostingEngine';
import { AuditRepository } from '../repositories/AuditRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { 
  TreasuryTransfer, 
  TreasuryAccount, 
  TreasuryTransactionStatus, 
  PaymentInstrumentType,
  JournalEntry,
  AuditMetadata
} from '../../types';

// =========================================================================
// STRATEGY PATTERN FOR TRANSFER TYPES (Extensible design)
// =========================================================================
export interface ITransferTypeStrategy {
  name: string;
  canHandle(source: TreasuryAccount, destination: TreasuryAccount): boolean;
  validateStrategy(source: TreasuryAccount, destination: TreasuryAccount, amount: number): void;
}

export class CashBoxToCashBoxStrategy implements ITransferTypeStrategy {
  name = 'صندوق إلى صندوق (Cash Box → Cash Box)';
  canHandle(src: TreasuryAccount, dest: TreasuryAccount): boolean {
    const isSrcCash = src.type === 'Main Chest' || src.type === 'Branch Chest';
    const isDestCash = dest.type === 'Main Chest' || dest.type === 'Branch Chest';
    return isSrcCash && isDestCash;
  }
  validateStrategy(src: TreasuryAccount, dest: TreasuryAccount, amount: number): void {
    // Specific business constraints if any
  }
}

export class CashBoxToBankStrategy implements ITransferTypeStrategy {
  name = 'صندوق إلى حساب بنكي (Cash Box → Bank Account)';
  canHandle(src: TreasuryAccount, dest: TreasuryAccount): boolean {
    const isSrcCash = src.type === 'Main Chest' || src.type === 'Branch Chest';
    const isDestBank = dest.type === 'Bank Account';
    return isSrcCash && isDestBank;
  }
  validateStrategy(src: TreasuryAccount, dest: TreasuryAccount, amount: number): void {
    // Bank deposits might require a deposit reference
  }
}

export class BankToCashBoxStrategy implements ITransferTypeStrategy {
  name = 'حساب بنكي إلى صندوق (Bank Account → Cash Box)';
  canHandle(src: TreasuryAccount, dest: TreasuryAccount): boolean {
    const isSrcBank = src.type === 'Bank Account';
    const isDestCash = dest.type === 'Main Chest' || dest.type === 'Branch Chest';
    return isSrcBank && isDestCash;
  }
  validateStrategy(src: TreasuryAccount, dest: TreasuryAccount, amount: number): void {
    // Cheque cash-outs or withdrawal tickets validation
  }
}

export class BankToBankStrategy implements ITransferTypeStrategy {
  name = 'حساب بنكي إلى حساب بنكي (Bank Account → Bank Account)';
  canHandle(src: TreasuryAccount, dest: TreasuryAccount): boolean {
    return src.type === 'Bank Account' && dest.type === 'Bank Account';
  }
  validateStrategy(src: TreasuryAccount, dest: TreasuryAccount, amount: number): void {
    // Swift / IBAN transfers verification
  }
}

export class VirtualToCashBoxStrategy implements ITransferTypeStrategy {
  name = 'خزينة افتراضية إلى صندوق (Virtual Treasury → Cash Box)';
  canHandle(src: TreasuryAccount, dest: TreasuryAccount): boolean {
    const isSrcVirtual = src.type === 'Virtual Chest';
    const isDestCash = dest.type === 'Main Chest' || dest.type === 'Branch Chest';
    return isSrcVirtual && isDestCash;
  }
  validateStrategy(src: TreasuryAccount, dest: TreasuryAccount, amount: number): void {
    // Enforce matching currencies
  }
}

export class VirtualToBankStrategy implements ITransferTypeStrategy {
  name = 'خزينة افتراضية إلى حساب بنكي (Virtual Treasury → Bank Account)';
  canHandle(src: TreasuryAccount, dest: TreasuryAccount): boolean {
    return src.type === 'Virtual Chest' && dest.type === 'Bank Account';
  }
  validateStrategy(src: TreasuryAccount, dest: TreasuryAccount, amount: number): void {
  }
}

export class TransitToBankStrategy implements ITransferTypeStrategy {
  name = 'حساب وسيط إلى حساب بنكي (Transit Account → Bank Account)';
  canHandle(src: TreasuryAccount, dest: TreasuryAccount): boolean {
    const isTransit = src.code.toLowerCase().includes('transit') || src.name.includes('وسيط') || src.name.toLowerCase().includes('transit');
    return isTransit && dest.type === 'Bank Account';
  }
  validateStrategy(src: TreasuryAccount, dest: TreasuryAccount, amount: number): void {
  }
}

export class ClearingToCashBoxStrategy implements ITransferTypeStrategy {
  name = 'حساب مقاصة إلى صندوق (Clearing Account → Cash Box)';
  canHandle(src: TreasuryAccount, dest: TreasuryAccount): boolean {
    const isClearing = src.code.toLowerCase().includes('clearing') || src.name.includes('مقاصة') || src.name.toLowerCase().includes('clearing');
    const isDestCash = dest.type === 'Main Chest' || dest.type === 'Branch Chest';
    return isClearing && isDestCash;
  }
  validateStrategy(src: TreasuryAccount, dest: TreasuryAccount, amount: number): void {
  }
}

// Registry for strategies
const STRATEGY_REGISTRY: ITransferTypeStrategy[] = [
  new CashBoxToCashBoxStrategy(),
  new CashBoxToBankStrategy(),
  new BankToCashBoxStrategy(),
  new BankToBankStrategy(),
  new VirtualToCashBoxStrategy(),
  new VirtualToBankStrategy(),
  new TransitToBankStrategy(),
  new ClearingToCashBoxStrategy()
];

// =========================================================================
// MAIN TREASURY TRANSFER SERVICE (CORE WORKHORSE)
// =========================================================================
export class TreasuryTransferService {

  /**
   * Identifies the exact transfer strategy dynamically.
   * Promotes open-closed extensibility.
   */
  public static resolveStrategy(source: TreasuryAccount, destination: TreasuryAccount): ITransferTypeStrategy {
    for (const strategy of STRATEGY_REGISTRY) {
      if (strategy.canHandle(source, destination)) {
        return strategy;
      }
    }
    
    // Generic fallback strategy for future custom types
    return {
      name: 'تحويل مخصص (Custom Treasury Transfer)',
      canHandle: () => true,
      validateStrategy: () => {}
    };
  }

  /**
   * 1. Create a New Treasury Transfer (Initial Draft status)
   */
  public static async createTransfer(
    schoolId: string,
    input: {
      sourceAccountId: string;
      destinationAccountId: string;
      amount: number;
      paymentInstrument: PaymentInstrumentType;
      paymentInstrumentDetails?: string;
      description: string;
      transferDate?: string;
      notes?: string;
    },
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransfer> {
    
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'CREATE_TREASURY_TRANSFER',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transfers', 'audit_logs']
    }, async () => {
      
      const sourceAcc = await TreasuryRepository.getAccountById(schoolId, input.sourceAccountId);
      const destAcc = await TreasuryRepository.getAccountById(schoolId, input.destinationAccountId);

      if (!sourceAcc) throw new Error(`حساب الخزينة المصدر غير معرّف أو غير موجود: ${input.sourceAccountId}`);
      if (!destAcc) throw new Error(`حساب الخزينة المستهدف غير معرّف أو غير موجود: ${input.destinationAccountId}`);

      const dateStr = input.transferDate || new Date().toISOString().split('T')[0];

      // Prepare basic draft entity
      const transferId = `tr_trsf_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const draftTransfer: TreasuryTransfer = {
        id: transferId,
        schoolId,
        sourceAccountId: input.sourceAccountId,
        destinationAccountId: input.destinationAccountId,
        amount: input.amount,
        currency: sourceAcc.currency,
        exchangeRate: sourceAcc.currency === destAcc.currency ? 1 : 1, // default or custom
        status: 'Draft',
        paymentInstrument: input.paymentInstrument,
        paymentInstrumentDetails: input.paymentInstrumentDetails,
        description: input.description,
        transferDate: dateStr,
        notes: input.notes,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preparedBy: {
          userId: operator.userId,
          userName: operator.userName,
          userRole: operator.userRole,
          ipAddress: operator.ipAddress,
          timestamp: new Date().toISOString()
        }
      };

      // Run Domain Rules Validate
      await TreasuryTransferDomainRules.validateNewTransfer(schoolId, draftTransfer, sourceAcc, destAcc);

      // Save using repository
      const saved = await TreasuryTransferRepository.save(schoolId, draftTransfer);

      // Audit Trail Log
      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'CREATE',
        'TREASURY_TRANSFER_SERVICE',
        operator.ipAddress,
        `تم إنشاء قيد مسودة تحويل نقدية جديد رقم (${saved.id}) من [${sourceAcc.name}] إلى [${destAcc.name}] بمبلغ ${saved.amount} ${saved.currency}.`,
        { affectedRecord: saved.id }
      );

      return saved;
    });
  }

  /**
   * 2. Submit Transfer for Approval
   */
  public static async submitForApproval(
    schoolId: string,
    transferId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransfer> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'SUBMIT_TRANSFER_APPROVAL',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transfers', 'audit_logs']
    }, async () => {
      const transfer = await TreasuryTransferRepository.getById(schoolId, transferId);
      if (!transfer) throw new Error(`طلب التحويل المحدد غير موجود: ${transferId}`);

      TreasuryTransferDomainRules.validateModification(transfer);
      TreasuryTransferStateMachine.validateTransition(transfer.status, 'Pending Approval');

      transfer.status = 'Pending Approval';
      transfer.updatedAt = new Date().toISOString();

      const saved = await TreasuryTransferRepository.save(schoolId, transfer);

      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'UPDATE',
        'TREASURY_TRANSFER_SERVICE',
        operator.ipAddress,
        `تم تقديم طلب التحويل المالي رقم (${saved.id}) للمراجعة والموافقة.`,
        { affectedRecord: saved.id }
      );

      return saved;
    });
  }

  /**
   * 3. Approve Treasury Transfer
   */
  public static async approveTransfer(
    schoolId: string,
    transferId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransfer> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'APPROVE_TREASURY_TRANSFER',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transfers', 'audit_logs']
    }, async () => {
      const transfer = await TreasuryTransferRepository.getById(schoolId, transferId);
      if (!transfer) throw new Error(`طلب التحويل المحدد غير موجود: ${transferId}`);

      TreasuryTransferDomainRules.validateModification(transfer);
      TreasuryTransferStateMachine.validateTransition(transfer.status, 'Approved');

      transfer.status = 'Approved';
      transfer.approvedBy = {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress,
        timestamp: new Date().toISOString()
      };
      transfer.updatedAt = new Date().toISOString();

      const saved = await TreasuryTransferRepository.save(schoolId, transfer);

      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'APPROVE',
        'TREASURY_TRANSFER_SERVICE',
        operator.ipAddress,
        `تمت الموافقة الرسمية على طلب التحويل رقم (${saved.id}) بواسطة المدقق المالي.`,
        { affectedRecord: saved.id }
      );

      return saved;
    });
  }

  /**
   * 4. Execute Treasury Transfer (Actually moves funds between the selected cash chests/banks)
   */
  public static async executeTransfer(
    schoolId: string,
    transferId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransfer> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'EXECUTE_TREASURY_TRANSFER',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transfers', 'treasury_accounts', 'audit_logs']
    }, async () => {
      const transfer = await TreasuryTransferRepository.getById(schoolId, transferId);
      if (!transfer) throw new Error(`طلب التحويل المحدد غير موجود: ${transferId}`);

      // Run Domain validations
      TreasuryTransferDomainRules.validateIdempotency(transfer);
      TreasuryTransferStateMachine.validateTransition(transfer.status, 'Executing');

      const srcAcc = await TreasuryRepository.getAccountById(schoolId, transfer.sourceAccountId);
      const destAcc = await TreasuryRepository.getAccountById(schoolId, transfer.destinationAccountId);

      if (!srcAcc || !destAcc) throw new Error('حسابات الخزينة المرتبطة بهذا التحويل غير موجودة.');

      // Extra strategy specific validations
      const strategy = this.resolveStrategy(srcAcc, destAcc);
      strategy.validateStrategy(srcAcc, destAcc, transfer.amount);

      // Deduct from source chest (validate negative policy)
      if (!srcAcc.allowNegativeBalance && srcAcc.balance < transfer.amount) {
        throw new Error(`فشل التنفيذ الفعلي: الرصيد في [${srcAcc.name}] أصبح غير كافٍ الآن للتحويل.`);
      }
      
      transfer.status = 'Executing';
      await TreasuryTransferRepository.save(schoolId, transfer);

      // Balance deduction
      const sourceNewBalance = srcAcc.balance - transfer.amount;
      await TreasuryRepository.updateAccount(schoolId, srcAcc.id, { balance: sourceNewBalance });

      // Balance deposit
      const incomingAmount = transfer.amount * transfer.exchangeRate;
      const destNewBalance = destAcc.balance + incomingAmount;
      await TreasuryRepository.updateAccount(schoolId, destAcc.id, { balance: destNewBalance });

      // Set executed status
      transfer.status = 'Executed';
      transfer.executedBy = {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress,
        timestamp: new Date().toISOString()
      };
      transfer.updatedAt = new Date().toISOString();

      const saved = await TreasuryTransferRepository.save(schoolId, transfer);

      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'EXECUTE',
        'TREASURY_TRANSFER_SERVICE',
        operator.ipAddress,
        `تم التنفيذ والتحويل النقدي الفعلي رقم (${saved.id}) بنجاح (النوع: ${strategy.name}) بمقدار ${saved.amount} ${saved.currency}.`,
        { affectedRecord: saved.id }
      );

      return saved;
    });
  }

  /**
   * 5. Post Treasury Transfer (Double-entry Ledger Recording via PostingEngine)
   */
  public static async postTransfer(
    schoolId: string,
    transferId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransfer> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'POST_TREASURY_TRANSFER',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transfers', 'journal_entries', 'general_ledger', 'accounts', 'audit_logs']
    }, async () => {
      const transfer = await TreasuryTransferRepository.getById(schoolId, transferId);
      if (!transfer) throw new Error(`عملية التحويل غير موجودة: ${transferId}`);

      if (transfer.status !== 'Executed') {
        throw new Error('فشل الترحيل المحاسبي: لا يمكن ترحيل تحويل مالي لم يتم تنفيذه نقدياً أولاً.');
      }

      TreasuryTransferStateMachine.validateTransition(transfer.status, 'Posted');

      const srcAcc = await TreasuryRepository.getAccountById(schoolId, transfer.sourceAccountId);
      const destAcc = await TreasuryRepository.getAccountById(schoolId, transfer.destinationAccountId);

      if (!srcAcc || !destAcc) throw new Error('حسابات الخزينة المرتبطة بهذا التحويل غير موجودة.');

      // 1. Prepare Double Entry Journal draft (DOES NOT directly update GL)
      const debitGlAccount = destAcc.glAccountId;
      const creditGlAccount = srcAcc.glAccountId;
      const incomingAmount = transfer.amount * transfer.exchangeRate;

      const journalDraftId = `jrnl_tr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const journalDraft: JournalEntry = {
        id: journalDraftId,
        date: transfer.transferDate,
        description: `ترحيل قيد يومية آلي ومستقل لعملية تحويل خزينة رقم ${transfer.id}. من [${srcAcc.name}] إلى [${destAcc.name}].`,
        status: 'draft',
        items: [
          { accountId: debitGlAccount, debit: incomingAmount, credit: 0 },
          { accountId: creditGlAccount, debit: 0, credit: transfer.amount }
        ],
        totalDebit: incomingAmount,
        totalCredit: transfer.amount,
        referenceType: 'other',
        referenceId: transfer.id,
        createdAt: new Date().toISOString()
      };

      // Enlist draft Journal Entry via Repository
      JournalRepository.enlistCreateJournalEntry(
        journalDraftId,
        schoolId,
        journalDraft.date || '',
        journalDraft.description || '',
        'draft',
        journalDraft.items,
        journalDraft.totalDebit || 0,
        journalDraft.totalCredit || 0,
        'other',
        transfer.id,
        journalDraft.createdAt || '',
        { ...journalDraft, schoolId } as any
      );

      // 2. Delegate actual general ledger updating to PostingEngine
      const auditMeta: AuditMetadata = {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress
      };
      await PostingEngine.postJournalEntry(schoolId, journalDraftId, auditMeta);

      // Update transfer status
      transfer.status = 'Posted';
      transfer.journalEntryId = journalDraftId;
      transfer.postedBy = {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress,
        timestamp: new Date().toISOString()
      };
      transfer.updatedAt = new Date().toISOString();

      const saved = await TreasuryTransferRepository.save(schoolId, transfer);

      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'POST_TRANSACTION',
        'TREASURY_TRANSFER_SERVICE',
        operator.ipAddress,
        `تم قيد وترحيل الدفاتر بنجاح للتحويل المالي رقم (${saved.id}) بالاستعانة بمحرك الترحيل المركزي. قيد القبول: ${journalDraftId}.`,
        { affectedRecord: saved.id }
      );

      return saved;
    });
  }

  /**
   * 6. Cancel Treasury Transfer
   */
  public static async cancelTransfer(
    schoolId: string,
    transferId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransfer> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'CANCEL_TREASURY_TRANSFER',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transfers', 'audit_logs']
    }, async () => {
      const transfer = await TreasuryTransferRepository.getById(schoolId, transferId);
      if (!transfer) throw new Error(`عملية التحويل غير موجودة: ${transferId}`);

      TreasuryTransferDomainRules.validateModification(transfer);
      TreasuryTransferStateMachine.validateTransition(transfer.status, 'Cancelled');

      transfer.status = 'Cancelled';
      transfer.cancelledBy = {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress,
        timestamp: new Date().toISOString()
      };
      transfer.updatedAt = new Date().toISOString();

      const saved = await TreasuryTransferRepository.save(schoolId, transfer);

      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'CANCEL',
        'TREASURY_TRANSFER_SERVICE',
        operator.ipAddress,
        `تم إلغاء عملية التحويل المالي رقم (${saved.id}) بنجاح.`,
        { affectedRecord: saved.id }
      );

      return saved;
    });
  }

  /**
   * 7. Reverse Treasury Transfer (Accounting & Chest rollback)
   */
  public static async reverseTransfer(
    schoolId: string,
    transferId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransfer> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'REVERSE_TREASURY_TRANSFER',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transfers', 'treasury_accounts', 'journal_entries', 'general_ledger', 'accounts', 'audit_logs']
    }, async () => {
      const transfer = await TreasuryTransferRepository.getById(schoolId, transferId);
      if (!transfer) throw new Error(`عملية التحويل غير موجودة: ${transferId}`);

      if (transfer.status !== 'Executed' && transfer.status !== 'Posted') {
        throw new Error('فشل العكس المحاسبي: لا يمكن إرجاع أو عكس عملية لم تكتمل نقدياً أو ترحّل مسبقاً.');
      }

      TreasuryTransferStateMachine.validateTransition(transfer.status, 'Reversed');

      const srcAcc = await TreasuryRepository.getAccountById(schoolId, transfer.sourceAccountId);
      const destAcc = await TreasuryRepository.getAccountById(schoolId, transfer.destinationAccountId);

      if (!srcAcc || !destAcc) throw new Error('الحسابات المرتبطة بالتحويل مفقودة أو ملغاة.');

      // Reverse cash balances
      const updatedSrcBalance = srcAcc.balance + transfer.amount;
      await TreasuryRepository.updateAccount(schoolId, srcAcc.id, { balance: updatedSrcBalance });

      const incomingAmount = transfer.amount * transfer.exchangeRate;
      const updatedDestBalance = destAcc.balance - incomingAmount;
      await TreasuryRepository.updateAccount(schoolId, destAcc.id, { balance: updatedDestBalance });

      // If already posted, invoke Mirror-Reversal of the Journal Entry via PostingEngine
      if (transfer.status === 'Posted' && transfer.journalEntryId) {
        const auditMeta: AuditMetadata = {
          userId: operator.userId,
          userName: operator.userName,
          userRole: operator.userRole,
          ipAddress: operator.ipAddress
        };
        await PostingEngine.reversePostJournalEntry(schoolId, transfer.journalEntryId, auditMeta);
      }

      transfer.status = 'Reversed';
      transfer.reversedBy = {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress,
        timestamp: new Date().toISOString()
      };
      transfer.updatedAt = new Date().toISOString();

      const saved = await TreasuryTransferRepository.save(schoolId, transfer);

      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'REVERSE',
        'TREASURY_TRANSFER_SERVICE',
        operator.ipAddress,
        `تم عكس وعمل قيد تسوية مرتجع للتحويل رقم (${saved.id}) وإعادة الأرصدة لوضعها السابق بنجاح.`,
        { affectedRecord: saved.id }
      );

      return saved;
    });
  }

  /**
   * 8. Reconcile Treasury Transfer
   */
  public static async reconcileTransfer(
    schoolId: string,
    transferId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransfer> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'RECONCILE_TREASURY_TRANSFER',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transfers', 'audit_logs']
    }, async () => {
      const transfer = await TreasuryTransferRepository.getById(schoolId, transferId);
      if (!transfer) throw new Error(`عملية التحويل غير موجودة: ${transferId}`);

      if (transfer.status !== 'Posted') {
        throw new Error('فشل التسوية: يجب ترحيل التحويل دفترياً قبل إتمام التسوية المصرفية.');
      }

      TreasuryTransferStateMachine.validateTransition(transfer.status, 'Reconciled');

      transfer.status = 'Reconciled';
      transfer.reconciledBy = {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress,
        timestamp: new Date().toISOString()
      };
      transfer.updatedAt = new Date().toISOString();

      const saved = await TreasuryTransferRepository.save(schoolId, transfer);

      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'RECONCILE',
        'TREASURY_TRANSFER_SERVICE',
        operator.ipAddress,
        `تم مطابقة وتأكيد التسوية البنكية بالدفاتر لعملية التحويل المالي رقم (${saved.id}).`,
        { affectedRecord: saved.id }
      );

      return saved;
    });
  }
}
