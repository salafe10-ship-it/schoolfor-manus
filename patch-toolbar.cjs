const fs = require('fs');
const path = 'src/components/shared/EnterpriseActionToolbar.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<div className=\{`bg-\[#1c120c\][^`]+`\}>/;
const replacement = `<div className={\`bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white rounded-3xl p-4 sm:p-5 border-2 border-[#d4af37]/40 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden z-30 \${minimal ? 'mb-4' : 'mb-6'}\`}>
      <div className="absolute top-0 right-1/4 w-96 h-20 bg-[#d4af37]/10 blur-3xl pointer-events-none" />`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
console.log('Patched Toolbar correctly');
