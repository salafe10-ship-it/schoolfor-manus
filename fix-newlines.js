import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

content = content.replace(/\.join\('\n'\)/g, ".join('\\n')");

// Also check for `\n` inside other strings that broke.
// Specifically lines like:
// const csvContent = "\uFEFF" \n + ... \n ... \n
// Wait, I can just replace the literal newline inside the `.join('`
content = content.replace(/\.join\('\n'\)/g, ".join('\\n')");
content = content.replace(/\.replace\(\/\\s\+\/g, '_'\)/g, ".replace(/\\s+/g, '_')");
fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
