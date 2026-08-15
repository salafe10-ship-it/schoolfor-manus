import { EnterpriseLogger } from "../database/services/EnterpriseLogger.js";

export interface FinancialData {
  studentReceiptVouchers?: any[];
  receiptVouchers?: any[];
  journalEntries?: any[];
  chartOfAccounts?: any[];
}

export async function fetchFinancialDb(): Promise<FinancialData | null> {
  try {
    const response = await fetch('/api/financial/database', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('edupro_token') || ''}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) return null;
    const res = await response.json();
    if (res.success && res.data) {
      return res.data;
    }
  } catch (err: any) {
    EnterpriseLogger.error("Failed to fetch financial database", "financialDb", { error: err });
  }
  return null;
}

export async function saveFinancialDb(data: FinancialData): Promise<boolean> {
  try {
    // Read current state from local memory fallback if needed
    const response = await fetch('/api/financial/database', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('edupro_token') || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) return false;
    const res = await response.json();
    return res.success;
  } catch (err: any) {
    EnterpriseLogger.error("Failed to save financial database", "financialDb", { error: err });
  }
  return false;
}
