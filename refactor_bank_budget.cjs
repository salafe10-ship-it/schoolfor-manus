const fs = require('fs');
let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

const bankCode = fs.readFileSync('/tmp/bank.txt', 'utf-8');
const budgetCode = fs.readFileSync('/tmp/budget.txt', 'utf-8');

portal = portal.replace(bankCode, `        {activeTab === 'bank_transfers' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل حوالات البنك...</div>}>
            <BankTransfersTab />
          </React.Suspense>
        )}`);

portal = portal.replace(budgetCode, `        {activeTab === 'estimated_budget' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل الموازنة التقديرية...</div>}>
            <EstimatedBudgetTab />
          </React.Suspense>
        )}`);

// Remove local states/data from GeneralLedgerPortal if they exist
portal = portal.replace(/const \[bankTransferSimStep, setBankTransferSimStep\] = useState\(1\);/g, '');
portal = portal.replace(/const performanceData = \[\s+.*\s+.*\s+.*\s+.*\s+.*\s+.*\s+\];/g, '');


const lazyMarker = "const CustomersLedgerTab = React.lazy(() => import('../modules/accounting/presentation/CustomersLedgerTab').then(m => ({ default: m.CustomersLedgerTab })));";
portal = portal.replace(lazyMarker, lazyMarker + "\nconst BankTransfersTab = React.lazy(() => import('../modules/accounting/presentation/BankTransfersTab').then(m => ({ default: m.BankTransfersTab })));\nconst EstimatedBudgetTab = React.lazy(() => import('../modules/accounting/presentation/EstimatedBudgetTab').then(m => ({ default: m.EstimatedBudgetTab })));");

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', portal, 'utf-8');
console.log('Bank and budget refactored');
