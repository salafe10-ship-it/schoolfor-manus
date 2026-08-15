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
  
  // Replace indigo, sky, blue with amber variations to fit the gold theme
  code = code.replace(/indigo-/g, 'amber-');
  code = code.replace(/sky-/g, 'yellow-');
  code = code.replace(/blue-/g, 'orange-');
  code = code.replace(/cyan-/g, 'amber-');
  
  // Custom specific replacements
  code = code.replace(/bg-slate-900 text-white/g, 'bg-[#2a1d13] text-[#fce79a]');
  
  fs.writeFileSync(file, code);
}
console.log('Fixed colors');
