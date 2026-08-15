import { AuditEntry } from './types';

export class AuditEngine {
  // In a real system, this would write to a secure, append-only ledger/DB
  private static auditLog: AuditEntry[] = [];

  static log(entry: Omit<AuditEntry, 'timestamp'>): AuditEntry {
    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    
    this.auditLog.push(fullEntry);
    console.log('[AuditEngine] Entry persisted:', fullEntry.correlationId);
    return fullEntry;
  }

  static getAuditHistory(recordId: string): AuditEntry[] {
    // In real system, this would query the DB
    return this.auditLog.filter(e => e.operation.includes(recordId));
  }
}
