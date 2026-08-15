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

const cardClass = 'bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl';

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  // Find divs after inset-0 that represent the modal box and might have lost bg-white
  // e.g., <div className="rounded-2xl max-w-md w-full...
  // We can look for rounded-2xl or rounded-3xl inside a fixed inset-0 parent
  
  // A safer general replacement: if a div has max-w-md, max-w-lg, max-w-2xl, max-w-4xl, etc and lacks a background, give it one.
  code = code.replace(/className="([^"]*(max-w-md|max-w-lg|max-w-xl|max-w-2xl|max-w-3xl|max-w-4xl|max-w-5xl)[^"]*)"/g, (match, p1, p2) => {
    if (!p1.includes('bg-')) {
      return `className="${p1} ${cardClass}"`;
    }
    return match;
  });
  
  // also some modal wrappers were `bg-white` and got converted to `bg-gradient-to-b...`. 
  // Make sure they have a nice text-slate-800 color.

  fs.writeFileSync(file, code);
}
console.log('Fixed modals');
