const fs = require('fs');
const files = [
  'src/components/hr/HumanResourcesPortal.tsx',
  'src/components/inventory/InventoryManagementPortal.tsx',
  'src/components/GeneralLedgerPortal.tsx',
  'src/components/TreasuryPlatformPortal.tsx',
  'src/components/StudentFinancialPortal.tsx',
  'src/components/LibraryPortal.tsx',
  'src/components/ExamsResultsModule.tsx',
  'src/components/SchoolUniformManagement.tsx',
  'src/components/procurement/ProcurementManagementPortal.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  // Tab patches
  code = code.replace(/text-slate-600 hover:bg-slate-100/g, 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50');
  code = code.replace(/text-slate-600 hover:bg-slate-50/g, 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50');
  
  code = code.replace(/bg-slate-900 text-white shadow-sm/g, 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md');
  code = code.replace(/bg-indigo-600 text-white shadow-sm/g, 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md');
  code = code.replace(/bg-amber-600 text-white shadow-sm/g, 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md');
  code = code.replace(/bg-sky-600 text-white shadow-sm/g, 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md');

  // Input styling
  code = code.replace(/className="([^"]*)border-slate-300([^"]*)focus:border-indigo-500([^"]*)"/g, `className="$1 border-slate-300 $2 focus:border-[#9a6a1d] $3"`);
  code = code.replace(/className="([^"]*)border-slate-300([^"]*)focus:ring-indigo-500([^"]*)"/g, `className="$1 border-slate-300 $2 focus:ring-[#9a6a1d] $3"`);
  
  fs.writeFileSync(file, code);
}
console.log('Fixed tabs and inputs');
