const fs = require('fs');

const file = 'src/components/StudentFinancialPortal.tsx';
let code = fs.readFileSync(file, 'utf8');

const mainWrapperClass = 'w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6';

// 1. Replace the root div
code = code.replace(/<div className="space-y-0 w-full text-right" dir="rtl">/, `<div className="${mainWrapperClass}" dir="rtl">`);

// 2. Add the Luxury Gold Header BEFORE the EnterpriseActionToolbar
const luxuryHeader = `
      {/* ==========================================
          LUXURY GOLD METALLIC TOP HEADER
         ========================================== */}
      <div className="bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white rounded-3xl p-4 sm:p-5 border-2 border-[#d4af37]/40 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-20 bg-[#d4af37]/10 blur-3xl pointer-events-none" />
        
        {/* Module Title & Breadcrumbs */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#f7d174] to-[#c58a22] p-[2px] shadow-lg shadow-[#d4af37]/20 flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#2a1b10] flex items-center justify-center text-amber-300 font-black">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300/80 font-bold mb-0.5">
              <span className="cursor-pointer hover:underline" onClick={() => setActiveSection && setActiveSection('dashboard')}>الرئيسية</span>
              <span>‹</span>
              <span className="text-amber-100">الحسابات والرسوم</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#ffe5a3] via-[#fce79a] to-[#d4af37] bg-clip-text text-transparent">
              منظومة حسابات الطلاب والرسوم الدراسية
            </h1>
          </div>
        </div>
      </div>
`;

// Insert it right after the root div
code = code.replace(/(<div className="[^"]+" dir="rtl">)/, `$1\n${luxuryHeader}`);

// 3. Fix standard cards (if any are left)
const cardClass = 'bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300';
code = code.replace(/className="([^"]*bg-white[^"]*rounded-lg[^"]*shadow-sm[^"]*)"/g, `className="$1 ${cardClass}"`);
code = code.replace(/className="([^"]*bg-white[^"]*rounded-xl[^"]*shadow-sm[^"]*)"/g, `className="$1 ${cardClass}"`);
code = code.replace(/bg-white\s/g, '');
code = code.replace(/rounded-lg\s/g, '');
code = code.replace(/shadow-sm\s/g, '');

// 4. Fix side navigation to match tabs pattern or keep it as side nav but themed
// Let's theme the side nav items
code = code.replace(/text-slate-600 hover:bg-slate-100/g, 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50');
code = code.replace(/bg-orange-600 text-white shadow-sm/g, 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md');
code = code.replace(/bg-blue-600 text-white shadow-sm/g, 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md');
code = code.replace(/bg-orange-800 text-white/g, 'bg-[#2a1d13] text-[#fce79a]');
code = code.replace(/from-orange-700 to-amber-900/g, 'from-[#1c120c] to-[#2d1e12]');

// 5. Tables
const tableHeaderClass = 'bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold';
code = code.replace(/<thead className="bg-slate-100 text-slate-700[^"]*"/g, `<thead className="${tableHeaderClass}"`);
code = code.replace(/<thead className="bg-slate-50 text-slate-600[^"]*"/g, `<thead className="${tableHeaderClass}"`);

// 6. Buttons
// Re-theme primary buttons
code = code.replace(/bg-orange-500 hover:bg-orange-600/g, 'bg-gradient-to-r from-[#d4af37] to-[#f7d174] hover:brightness-110 text-slate-950');
code = code.replace(/bg-blue-600 hover:bg-blue-700/g, 'bg-gradient-to-r from-[#d4af37] to-[#f7d174] hover:brightness-110 text-slate-950');
code = code.replace(/bg-green-600 hover:bg-green-700/g, 'bg-gradient-to-r from-[#d4af37] to-[#f7d174] hover:brightness-110 text-slate-950');
code = code.replace(/bg-\[\#16a34a\] hover:bg-green-700/g, 'bg-gradient-to-r from-[#d4af37] to-[#f7d174] hover:brightness-110 text-slate-950');

fs.writeFileSync(file, code);
console.log('Patched StudentFinancialPortal.tsx');
