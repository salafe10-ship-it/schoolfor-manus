const fs = require('fs');
const path = require('path');

const mainWrapperClass = 'w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6';
const cardClass = 'bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300';
const tableHeaderClass = 'bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold';
const tableBodyClass = 'divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetFiles = [];
walkDir('src/components', (f) => { if (f.endsWith('.tsx')) targetFiles.push(f); });
if (fs.existsSync('src/certification')) walkDir('src/certification', (f) => { if (f.endsWith('.tsx')) targetFiles.push(f); });

for (const file of targetFiles) {
  let code = fs.readFileSync(file, 'utf8');

  // Skip files that shouldn't be touched or are already master templates
  if (file.includes('StudentAffairsPortal.tsx') || file.includes('ModernSchoolDashboard.tsx')) continue;
  
  // Patch main wrapper
  const match = code.match(/return\s*\(\s*(<[^>]*>\s*)?<div className="([^"]+min-h-screen[^"]*)"/);
  if (match) {
    code = code.replace(match[2], mainWrapperClass);
  } else if (file.includes('SuperAdminOperationsCenter.tsx') || file.includes('SuperAdminDashboard.tsx')) {
    code = code.replace(/<div className="space-y-6 text-right[^"]*"/g, `<div className="${mainWrapperClass}"`);
  }

  // Replace standard white cards
  code = code.replace(/className="([^"]*bg-white[^"]*rounded-xl[^"]*shadow-sm[^"]*)"/g, `className="$1 ${cardClass}"`);
  code = code.replace(/className="([^"]*bg-slate-900\/80[^"]*rounded-2xl[^"]*)"/g, `className="$1 ${cardClass}"`);
  code = code.replace(/className="([^"]*bg-gradient-to-br from-slate-900[^"]*rounded-2xl[^"]*)"/g, `className="$1 ${cardClass}"`);
  
  // Clean up duplicate classes after regex append
  code = code.replace(/bg-white\s/g, '');
  code = code.replace(/bg-slate-900\/80\s/g, '');
  code = code.replace(/border border-slate-200\s/g, '');
  code = code.replace(/border border-slate-800\/70\s/g, '');
  code = code.replace(/rounded-xl\s/g, '');
  code = code.replace(/rounded-2xl\s/g, '');
  code = code.replace(/shadow-sm\s/g, '');
  code = code.replace(/shadow-xl\s/g, '');
  code = code.replace(/bg-slate-50\s/g, 'bg-transparent ');
  
  // Patch Table Headers
  code = code.replace(/<thead className="bg-transparent[^"]*"/g, `<thead className="${tableHeaderClass}"`);
  code = code.replace(/<thead className="bg-slate-50[^"]*"/g, `<thead className="${tableHeaderClass}"`);
  code = code.replace(/<tr className="bg-slate-100[^"]*"/g, `<tr className="${tableHeaderClass}"`);
  code = code.replace(/className="([^"]*bg-slate-50[^"]*border-y[^"]*text-slate-500[^"]*)"/g, `className="${tableHeaderClass}"`);
  code = code.replace(/className="([^"]*bg-slate-100[^"]*text-slate-600[^"]*)"/g, `className="${tableHeaderClass}"`);
  
  // Patch Table Bodies
  code = code.replace(/className="([^"]*divide-y divide-slate-100[^"]*)"/g, `className="${tableBodyClass}"`);
  code = code.replace(/divide-y divide-amber-900\/10 bg-transparent/g, tableBodyClass);

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

  // Modals patching (if not already patched)
  code = code.replace(/className="([^"]*(max-w-md|max-w-lg|max-w-xl|max-w-2xl|max-w-3xl|max-w-4xl|max-w-5xl)[^"]*)"/g, (match, p1) => {
    if (!p1.includes('bg-') && !p1.includes('rounded-3xl')) {
      return `className="${p1} ${cardClass}"`;
    }
    return match;
  });

  // Colors patching (Generic search and replace for tailwind utilities)
  code = code.replace(/indigo-/g, 'amber-');
  code = code.replace(/sky-/g, 'yellow-');
  code = code.replace(/blue-/g, 'orange-');
  code = code.replace(/cyan-/g, 'amber-');
  code = code.replace(/bg-slate-900 text-white/g, 'bg-[#2a1d13] text-[#fce79a]');
  
  fs.writeFileSync(file, code);
}
console.log('Fixed all files in src/components and src/certification');
