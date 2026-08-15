const fs = require('fs');

const file = 'src/components/StudentFinancialPortal.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix Table Headers
const tableHeaderClass = 'bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold';
code = code.replace(/<tr className="text-xs text-white">/g, `<tr className="text-xs text-amber-200 font-extrabold ${tableHeaderClass}">`);
code = code.replace(/<th className="p-3 bg-[#0284c7] border-l border-white\/10 font-bold text-center/g, `<th className="p-3 ${tableHeaderClass} border-l border-white/10 text-center`);
code = code.replace(/<th className="p-3 bg-slate-800 border-l border-white\/10 font-bold text-center/g, `<th className="p-3 ${tableHeaderClass} border-l border-white/10 text-center`);
code = code.replace(/<th className="p-3 bg-slate-800 font-bold text-center/g, `<th className="p-3 ${tableHeaderClass} text-center`);

// 2. Fix Card Styles
const cardClass = 'bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300';
code = code.replace(/className="[^"]*hover:border-slate-300[^"]*rounded-3xl[^"]*"/g, `className="${cardClass}"`);

// 3. Fix Buttons (Primary)
code = code.replace(/className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2/g, 'className="px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md');

fs.writeFileSync(file, code);
console.log('Patched StudentFinancialPortal.tsx styles');
