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

const tableHeaderClass = 'bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold';

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace all thead classes that look like gray/transparent headers
  code = code.replace(/<thead className="bg-transparent[^"]*"/g, `<thead className="${tableHeaderClass}"`);
  code = code.replace(/<thead className="bg-slate-50[^"]*"/g, `<thead className="${tableHeaderClass}"`);
  code = code.replace(/<tr className="bg-slate-100[^"]*"/g, `<tr className="${tableHeaderClass}"`);
  
  fs.writeFileSync(file, code);
}
console.log('Fixed tables');
