import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

// Insert AccountingContext definition before the component
if (!content.includes('export const AccountingContext')) {
    content = content.replace("export function GeneralLedgerPortal", "export const AccountingContext = React.createContext<any>(null);\n\nexport function GeneralLedgerPortal");
}

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
