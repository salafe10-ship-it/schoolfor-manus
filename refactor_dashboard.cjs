const fs = require('fs');
let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

const dashboardCode = fs.readFileSync('/tmp/dashboard.txt', 'utf-8');

portal = portal.replace(dashboardCode, `        {activeTab === 'dashboard' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل لوحة المؤشرات...</div>}>
            <LedgerDashboardTab />
          </React.Suspense>
        )}`);

// insert lazy import at the top (after other lazy imports)
const lazyMarker = "const ReceiptVoucherTab = React.lazy(() => import('../modules/accounting/presentation/ReceiptVoucherTab').then(m => ({ default: m.ReceiptVoucherTab })));";
portal = portal.replace(lazyMarker, lazyMarker + "\nconst LedgerDashboardTab = React.lazy(() => import('../modules/accounting/presentation/LedgerDashboardTab').then(m => ({ default: m.LedgerDashboardTab })));");

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', portal, 'utf-8');
console.log('Dashboard refactored');
