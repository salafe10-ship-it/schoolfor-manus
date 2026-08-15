const fs = require('fs');
let fa = fs.readFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'utf-8');

// Replace second handlePrepareNewAsset with handleSaveAsset
const firstIdx = fa.indexOf("const handlePrepareNewAsset = () => {");
const secondIdx = fa.indexOf("const handlePrepareNewAsset = () => {", firstIdx + 1);
if (secondIdx !== -1) {
  fa = fa.substring(0, secondIdx) + "const handleSaveAsset = () => {" + fa.substring(secondIdx + 37);
}

// Fix missing "assetForm" references
fa = fa.replace(/parseFloat\(\.capitalExp\)/g, "parseFloat(assetForm.capitalExp)");
fa = fa.replace(/parseFloat\(\.accDep\)/g, "parseFloat(assetForm.accDep)");
fa = fa.replace(/parseInt\(\.usefulLife\)/g, "parseInt(assetForm.usefulLife)");

// Fix "if () {"
fa = fa.replace(/if \(\) \{\n\s*\/\/ Check duplicate ID\n\s*if \(\.some\(a => a\.id === \.id\)\) \{/g, "if (isNewAssetMode) {\n      // Check duplicate ID\n      if (fixedAssets.some(a => a.id === assetForm.id)) {");

fa = fa.replace(/const newAsset = \{\n\s*\.\.\.,\n\s*cost: costNum,\n\s*capitalExp: capNum,\n\s*scrapValue: scrapNum,\n\s*accDep: accDepNum,\n\s*netValue: computedNetValue,\n\s*usefulLife: life,\n\s*depRate: ratePercent\n\s*\};/g, `const newAsset = {
        ...assetForm,
        cost: costNum,
        capitalExp: capNum,
        scrapValue: scrapNum,
        accDep: accDepNum,
        netValue: computedNetValue,
        usefulLife: life,
        depRate: ratePercent
      };`);

fa = fa.replace(/triggerNotification\('❌ رقم الأصل مكرر.', 'warning'\);\n\s*return;\n\s*\}\n\s*\(\[\.\.\., newAsset\]\);/g, `triggerNotification('❌ رقم الأصل مكرر.', 'warning');
        return;
      }
      setFixedAssets([...fixedAssets, newAsset]);`);
      
fa = fa.replace(/\} else \{\n\s*const updated = \.map\(a => a\.id === \.id \? \{ \.\.\.a, \.\.\.newAsset \} : a\);\n\s*\(updated\);\n\s*\}\n\s*triggerNotification\(`\+` تم حفظ بيانات الأصل \$\{newAsset\.name\} بنجاح`, 'success'\);\n\s*\(false\);\n\s*\(false\);/g, `} else {
      const updated = fixedAssets.map(a => a.id === assetForm.id ? { ...a, ...newAsset } : a);
      setFixedAssets(updated);
    }
    triggerNotification(\`تم حفظ بيانات الأصل \${newAsset.name} بنجاح\`, 'success');
    setIsEditAssetMode(false);
    setIsNewAssetMode(false);`);

fs.writeFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', fa, 'utf-8');
console.log("Fixed FA");
