const fs = require('fs');
let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

const calcCode = fs.readFileSync('/tmp/calc.txt', 'utf-8');

portal = portal.replace(calcCode, `        {activeTab === 'calc_tools' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل أدوات الحاسبة...</div>}>
            <CalcToolsTab />
          </React.Suspense>
        )}`);

// insert lazy import at the top
const lazyMarker = "const LedgerDashboardTab = React.lazy(() => import('../modules/accounting/presentation/LedgerDashboardTab').then(m => ({ default: m.LedgerDashboardTab })));";
portal = portal.replace(lazyMarker, lazyMarker + "\nconst CalcToolsTab = React.lazy(() => import('../modules/accounting/presentation/CalcToolsTab').then(m => ({ default: m.CalcToolsTab })));");

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', portal, 'utf-8');
console.log('Calc refactored');
