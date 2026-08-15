import { JournalEntry, JournalEntryDetail, PostingStatus, TransactionType } from '../../types';
import { PostingEngine } from './PostingEngine';
import { JournalRepository } from '../repositories/JournalRepository';

export class AccountingPostingService {
  public static async createJournal(
    entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'totalDebit' | 'totalCredit'>
  ): Promise<JournalEntry> {
    this.validateEntry(entry);

    const schoolId = entry.schoolId;
    if (!schoolId) {
      throw new Error('لا يمكن إنشاء قيد محاسبي دون schoolId موثوق.');
    }

    // The canonical adapter owns ID generation, totals, validation and persistence.
    // This service must never return an in-memory journal as if it were saved.
    return PostingEngine.createJournalEntryDraft(schoolId, {
      ...entry,
      status: entry.status || 'draft'
    });
  }

  private static validateEntry(entry: any) {
    if (!entry.items || entry.items.length === 0) {
      throw new Error("القيد يجب أن يحتوي على بنود");
    }
    // Additional validation rules...
  }

  public static async approveJournal(schoolId: string, journalId: string, approvedBy: string): Promise<JournalEntry> {
    if (!schoolId || !approvedBy) {
      throw new Error('لا يمكن اعتماد القيد دون schoolId وهوية معتمد موثوقة.');
    }

    const repository = new JournalRepository();
    const current = await repository.getById(schoolId, journalId);
    if (!current) {
      throw new Error(`قيد اليومية غير موجود للاعتماد: ${journalId}`);
    }
    if (current.status !== 'draft' && current.status !== 'submitted') {
      throw new Error(`لا يمكن اعتماد قيد حالته الحالية ${current.status}: ${journalId}`);
    }

    const approved = await PostingEngine.updateJournalEntryDraft(schoolId, journalId, {
      status: 'approved',
      approvedBy,
      updatedAt: new Date().toISOString(),
      meta: { userId: approvedBy, userName: approvedBy, userRole: 'accounting_approver', ipAddress: 'server' }
    });

    if (approved.status !== 'approved') {
      throw new Error(`فشل إثبات اعتماد قيد اليومية: ${journalId}`);
    }
    return approved;
  }

  public static async postJournal(schoolId: string, journalId: string, postedBy: string): Promise<JournalEntry> {
    if (!schoolId || !postedBy) {
      throw new Error('لا يمكن ترحيل القيد دون schoolId وهوية مرحّل موثوقة.');
    }

    const repository = new JournalRepository();
    const current = await repository.getById(schoolId, journalId);
    if (!current) {
      throw new Error(`قيد اليومية غير موجود للترحيل: ${journalId}`);
    }
    if (current.status !== 'approved') {
      throw new Error(`يجب اعتماد القيد قبل ترحيله: ${journalId}`);
    }

    await PostingEngine.postJournalEntry(schoolId, journalId, {
      userId: postedBy,
      userName: postedBy,
      userRole: 'accounting_poster',
      ipAddress: 'server'
    });

    const posted = await repository.getById(schoolId, journalId);
    if (!posted || posted.status !== 'posted') {
      throw new Error(`فشل إثبات ترحيل قيد اليومية: ${journalId}`);
    }
    return { ...posted, postedBy };
  }

  public static async reverseJournal(schoolId: string, journalId: string, reversedBy: string): Promise<JournalEntry> {
    throw new Error(
      `ACCOUNTING DECISION REQUIRED: لا يمكن عكس القيد ${journalId} قبل اعتماد سياسة العكس وهوية المدرسة ${schoolId} والمستخدم ${reversedBy}.`
    );
  }
}
