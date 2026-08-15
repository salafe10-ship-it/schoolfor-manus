import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

content = content.replace(/csvContent \+\= row \+ "\n";/g, "csvContent += row + \"\\n\";");

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
