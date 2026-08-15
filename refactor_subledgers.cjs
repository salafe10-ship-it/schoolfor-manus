const fs = require('fs');
let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

const customersCode = fs.readFileSync('/tmp/customers.txt', 'utf-8');
const suppliersCode = fs.readFileSync('/tmp/suppliers.txt', 'utf-8');

portal = portal.replace(customersCode, `        {activeTab === 'customers' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل دفتر العملاء...</div>}>
            <CustomersLedgerTab />
          </React.Suspense>
        )}`);

portal = portal.replace(suppliersCode, `        {activeTab === 'suppliers' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل قسم الموردين...</div>}>
            <SuppliersLedgerTab />
          </React.Suspense>
        )}`);

const lazyMarker = "const CalcToolsTab = React.lazy(() => import('../modules/accounting/presentation/CalcToolsTab').then(m => ({ default: m.CalcToolsTab })));";
portal = portal.replace(lazyMarker, lazyMarker + "\nconst CustomersLedgerTab = React.lazy(() => import('../modules/accounting/presentation/CustomersLedgerTab').then(m => ({ default: m.CustomersLedgerTab })));\nconst SuppliersLedgerTab = React.lazy(() => import('../modules/accounting/presentation/SuppliersLedgerTab').then(m => ({ default: m.SuppliersLedgerTab })));");

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', portal, 'utf-8');
console.log('Subledgers refactored');
