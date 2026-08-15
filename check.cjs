const fs = require('fs');
let fa = fs.readFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'utf-8');
console.log(fa.substring(54700, 54850));
