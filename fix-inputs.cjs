const fs = require('fs');

const file = 'src/components/StudentFinancialPortal.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix input styles
code = code.replace(/focus:ring-yellow-500/g, 'focus:ring-[#9a6a1d] focus:border-[#9a6a1d]');
code = code.replace(/focus:outline-\[\#1e3a8a\]/g, 'focus:outline-none');
code = code.replace(/bg-white/g, 'bg-slate-50'); // for inputs
code = code.replace(/text-slate-600/g, 'text-slate-700');

fs.writeFileSync(file, code);
