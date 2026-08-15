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

const cardClass = 'bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300';

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  // Restore backgrounds for elements that were accidentally made transparent or lost bg-white
  code = code.replace(/className="([^"]*)bg-transparent rounded-2xl([^"]*)"/g, `className="$1 ${cardClass} $2"`);
  
  // also fix some tables that had their bg-white removed
  code = code.replace(/divide-y divide-amber-900\/10 bg-transparent/g, 'divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl');

  // Let's add cardClass to anything that is flex-1 overflow-hidden min-h-[580px] p-6 (GeneralLedger)
  code = code.replace(/className="flex-1\s+overflow-hidden\s+min-h-\[580px\]\s+p-6"/g, `className="flex-1 ${cardClass} min-h-[580px]"`);

  // Sidebars that were transparent
  code = code.replace(/className="w-full lg:w-85 bg-transparent text-slate-800 rounded-2xl/g, `className="w-full lg:w-85 ${cardClass} text-slate-800`);
  
  // For other portals' wrappers that might have lost background
  code = code.replace(/bg-transparent border-slate-200 rounded-2xl/g, cardClass);

  fs.writeFileSync(file, code);
}
console.log('Fixed transparency issues');
