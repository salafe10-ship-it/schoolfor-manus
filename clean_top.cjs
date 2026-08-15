const fs = require('fs');
let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

const spdxIdx = portal.indexOf('* SPDX-License-Identifier: Apache-2.0 */');
if (spdxIdx !== -1) {
  // Let's find the start of the comment block
  const commentStart = portal.lastIndexOf('/*', spdxIdx);
  if (commentStart !== -1) {
    let cleanCode = portal.substring(commentStart);
    
    // Add the react imports and lazy loaded components
    const header = `import React, { useState, useMemo } from 'react';
import { 
  Building2, Hash, Calendar, Layers, HelpCircle, 
  Settings2, Activity, Play, Plus, Landmark, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useCurrency } from '../context/CurrencyContext';
import { EnterpriseActionToolbar } from './EnterpriseActionToolbar';

const FixedAssetsTab = React.lazy(() => import('../modules/accounting/presentation/FixedAssetsTab').then(m => ({ default: m.FixedAssetsTab })));
const FinancialReportsTab = React.lazy(() => import('../modules/accounting/presentation/FinancialReportsTab').then(m => ({ default: m.FinancialReportsTab })));
const PaymentVoucherTab = React.lazy(() => import('../modules/accounting/presentation/PaymentVoucherTab').then(m => ({ default: m.PaymentVoucherTab })));
const ClosingTab = React.lazy(() => import('../modules/accounting/presentation/ClosingTab').then(m => ({ default: m.ClosingTab })));
const ReceiptVoucherTab = React.lazy(() => import('../modules/accounting/presentation/ReceiptVoucherTab').then(m => ({ default: m.ReceiptVoucherTab })));
const LedgerDashboardTab = React.lazy(() => import('../modules/accounting/presentation/LedgerDashboardTab').then(m => ({ default: m.LedgerDashboardTab })));
const CalcToolsTab = React.lazy(() => import('../modules/accounting/presentation/CalcToolsTab').then(m => ({ default: m.CalcToolsTab })));
const CustomersLedgerTab = React.lazy(() => import('../modules/accounting/presentation/CustomersLedgerTab').then(m => ({ default: m.CustomersLedgerTab })));
const BankTransfersTab = React.lazy(() => import('../modules/accounting/presentation/BankTransfersTab').then(m => ({ default: m.BankTransfersTab })));
const EstimatedBudgetTab = React.lazy(() => import('../modules/accounting/presentation/EstimatedBudgetTab').then(m => ({ default: m.EstimatedBudgetTab })));
const SuppliersLedgerTab = React.lazy(() => import('../modules/accounting/presentation/SuppliersLedgerTab').then(m => ({ default: m.SuppliersLedgerTab })));
const JournalEntriesTab = React.lazy(() => import('../modules/accounting/presentation/JournalEntriesTab').then(m => ({ default: m.JournalEntriesTab })));
const ChartOfAccountsTab = React.lazy(() => import('../modules/accounting/presentation/ChartOfAccountsTab').then(m => ({ default: m.ChartOfAccountsTab })));

`;
    
    fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', header + cleanCode, 'utf-8');
    console.log('Cleaned top');
  }
}
