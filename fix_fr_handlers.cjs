const fs = require('fs');
let fr = fs.readFileSync('src/modules/accounting/presentation/FinancialReportsTab.tsx', 'utf-8');

fr = fr.replace(/const = \(idx: number\) => \{/g, "const handleDrillDownBreadcrumbClick = (idx: number) => {");
fr = fr.replace(/const = \(accountCode: string\) => \{/g, "const handleDrillDownToAccount = (accountCode: string) => {");
fr = fr.replace(/const = \(jv: any\) => \{/g, "const handleDrillDownToOriginalDocument = (jv: any) => {");
// Oh wait, handleDrillDownToJournalEntry might be another one? Let's check `JournalEntriesTab.tsx`

fs.writeFileSync('src/modules/accounting/presentation/FinancialReportsTab.tsx', fr, 'utf-8');
console.log("Fixed FR handlers");
