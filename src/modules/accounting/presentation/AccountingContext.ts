import React from 'react';

export const AccountingContext = React.createContext<any>(null);

export interface AccountNode {
  id: string; // AccountID
  code: string; // AccountCode
  name: string; // compatibility (maps to nameAr)
  nameAr: string; // AccountNameAr
  nameEn: string; // AccountNameEn
  parentAccountId?: string; // ParentAccountID
  type: 'رئيسي' | 'فرعي'; // AccountType
  classification: 'أصول' | 'خصوم' | 'حقوق ملكية' | 'إيرادات' | 'مصروفات';
  level: number; // AccountLevel
  natureType: 'مدين' | 'دائن'; // NatureType
  costCenterId?: string; // CostCenterID (kindergarten, primary, etc.)
  isActive: boolean; // IsActive
  notes?: string; // Notes
  balance: number; // Balance
  currency: string;
  annualBudget?: number; // Advanced Budget limit
  dimensionSplit?: { costCenterId: string; percentage: number }[]; // Multi-dimensional allocation splits
  lastReconciliationDate?: string; // Last bank statement match date
  isReconciled?: boolean; // Is matched with external bank books
  reconciliationTargetBalance?: number; // Target ending balance
}
