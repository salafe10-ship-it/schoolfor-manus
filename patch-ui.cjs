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

const mainWrapperClass = 'w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6';

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Skipping missing file:', file);
    continue;
  }
  let code = fs.readFileSync(file, 'utf8');
  
  // 1. Patch main wrapper
  if (file.includes('GeneralLedgerPortal')) {
    code = code.replace(/<div className="space-y-0 w-full text-right" dir="rtl">/, `<div className="${mainWrapperClass}" dir="rtl">`);
  } else if (file.includes('TreasuryPlatformPortal') || file.includes('StudentFinancialPortal') || file.includes('SchoolUniformManagement')) {
    code = code.replace(/<div className="space-y-0 text-right w-full font-sans bg-slate-50 min-h-screen" dir="rtl">/, `<div className="${mainWrapperClass}" dir="rtl">`);
  } else {
    // Try generic replace for the first div after return (
    // Regex might be tricky, let's use a replacer function
    const match = code.match(/return\s*\(\s*(<AccountingContext\.Provider[^>]*>\s*)?<div className="([^"]+)"/);
    if (match) {
      code = code.replace(match[2], mainWrapperClass);
    }
  }

  // 2. Patch Cards (bg-white border border-slate-200 rounded-xl/2xl ...)
  // We want them to use the master template card style:
  const cardClass = 'bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300';
  
  // Replace standard white cards
  code = code.replace(/className="([^"]*bg-white[^"]*rounded-xl[^"]*shadow-sm[^"]*)"/g, `className="$1 ${cardClass}"`);
  
  // Clean up duplicate classes after regex append
  code = code.replace(/bg-white\s/g, '');
  code = code.replace(/border border-slate-200\s/g, '');
  code = code.replace(/rounded-xl\s/g, '');
  code = code.replace(/shadow-sm\s/g, '');
  code = code.replace(/bg-slate-50/g, 'bg-transparent'); // Remove nested gray backgrounds

  // 3. Patch Table Headers
  const tableHeaderClass = 'bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold';
  code = code.replace(/className="([^"]*bg-slate-50[^"]*border-y[^"]*text-slate-500[^"]*)"/g, `className="${tableHeaderClass}"`);
  code = code.replace(/className="([^"]*bg-slate-100[^"]*text-slate-600[^"]*)"/g, `className="${tableHeaderClass}"`);
  
  // 4. Patch Table Bodies
  const tableBodyClass = 'divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl';
  code = code.replace(/className="([^"]*divide-y divide-slate-100[^"]*)"/g, `className="${tableBodyClass}"`);

  fs.writeFileSync(file, code);
  console.log('Patched UI for:', file);
}
