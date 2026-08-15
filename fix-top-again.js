import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

const topFixes = `
export const AccountingContext = React.createContext<any>(null);

const LedgerDashboardTab = React.lazy(() => import('../modules/accounting/presentation/LedgerDashboardTab').then(m => ({ default: m.LedgerDashboardTab })));
const ChartOfAccountsTab = React.lazy(() => import('../modules/accounting/presentation/ChartOfAccountsTab').then(m => ({ default: m.ChartOfAccountsTab })));
const CustomersLedgerTab = React.lazy(() => import('../modules/accounting/presentation/CustomersLedgerTab').then(m => ({ default: m.CustomersLedgerTab })));
const SuppliersLedgerTab = React.lazy(() => import('../modules/accounting/presentation/SuppliersLedgerTab').then(m => ({ default: m.SuppliersLedgerTab })));
const JournalEntriesTab = React.lazy(() => import('../modules/accounting/presentation/JournalEntriesTab').then(m => ({ default: m.JournalEntriesTab })));
const ReceiptVoucherTab = React.lazy(() => import('../modules/accounting/presentation/ReceiptVoucherTab').then(m => ({ default: m.ReceiptVoucherTab })));
const PaymentVoucherTab = React.lazy(() => import('../modules/accounting/presentation/PaymentVoucherTab').then(m => ({ default: m.PaymentVoucherTab })));
const BankTransfersTab = React.lazy(() => import('../modules/accounting/presentation/BankTransfersTab').then(m => ({ default: m.BankTransfersTab })));
const FixedAssetsTab = React.lazy(() => import('../modules/accounting/presentation/FixedAssetsTab').then(m => ({ default: m.FixedAssetsTab })));
const EstimatedBudgetTab = React.lazy(() => import('../modules/accounting/presentation/EstimatedBudgetTab').then(m => ({ default: m.EstimatedBudgetTab })));
const ClosingTab = React.lazy(() => import('../modules/accounting/presentation/ClosingTab').then(m => ({ default: m.ClosingTab })));
const FinancialReportsTab = React.lazy(() => import('../modules/accounting/presentation/FinancialReportsTab').then(m => ({ default: m.FinancialReportsTab })));
const CalcToolsTab = React.lazy(() => import('../modules/accounting/presentation/CalcToolsTab').then(m => ({ default: m.CalcToolsTab })));
`;

// Remove useCurrency from lucide-react
content = content.replace("useCurrency , ", "");

if (!content.includes('LedgerDashboardTab = React.lazy')) {
    content = content.replace("interface GeneralLedgerPortalProps", topFixes + "\ninterface GeneralLedgerPortalProps");
}

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
