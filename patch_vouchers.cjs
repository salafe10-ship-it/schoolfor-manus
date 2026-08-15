const fs = require('fs');

let pv = fs.readFileSync('src/modules/accounting/presentation/PaymentVoucherTab.tsx', 'utf-8');
pv = pv.replace(/const = \(pv: any\) => \{/g, "const handlePrintPV = (pv: any) => {");
fs.writeFileSync('src/modules/accounting/presentation/PaymentVoucherTab.tsx', pv, 'utf-8');

let rv = fs.readFileSync('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', 'utf-8');
rv = rv.replace(/const = \(rv: any\) => \{/g, "const handlePrintRV = (rv: any) => {");
fs.writeFileSync('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', rv, 'utf-8');
console.log('Fixed vouchers');
