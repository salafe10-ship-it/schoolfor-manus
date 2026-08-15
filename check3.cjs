const fs = require('fs');
let fa = fs.readFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'utf-8');
const activeIdx = fa.indexOf("{activeTab === 'fixed_assets' && (");
console.log("Index of fixed_assets tab:", activeIdx);

const startIdx = fa.lastIndexOf("return (", activeIdx);
console.log("Index of nearest return:", startIdx);
console.log(fa.substring(startIdx, startIdx + 100));
