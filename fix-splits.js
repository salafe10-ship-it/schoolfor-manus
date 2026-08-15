import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

// Replace literal newline between single quotes with \n
content = content.replace(/\.split\('\n'\)/g, ".split('\\n')");

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
