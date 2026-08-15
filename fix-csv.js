import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

// Replace literal newlines inside strings that end with a quote or start with a quote
// Or just replace all \n followed by " or '
content = content.replace(/الرصيد\n";/g, "الرصيد\\n\";");
content = content.replace(/row.join\(','\)\n/g, "row.join(',') + '\\n'");
content = content.replace(/row.join\(','\) \+\n/g, "row.join(',') + '\\n'");

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
