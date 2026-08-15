const fs = require('fs');
let content = fs.readFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'utf8');
console.log(content.includes('setIsEditAssetMode'));
console.log(content.includes('activeAssetTab'));
