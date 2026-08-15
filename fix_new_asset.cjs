const fs = require('fs');
let fa = fs.readFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'utf-8');

fa = fa.replace(/\.\.\.cost:/, "...assetForm,\n        cost:");
fs.writeFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', fa, 'utf-8');
console.log("Fixed newAsset spread");
