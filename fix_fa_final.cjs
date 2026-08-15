const fs = require('fs');

let fa = fs.readFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'utf-8');

// The real JSX starts with `<>` and `{activeTab === 'fixed_assets' && (`
// Let's find `{activeTab === 'fixed_assets' && (`
const realJsxIdx = fa.indexOf("{activeTab === 'fixed_assets' && (");

// We need to find the `return (` just before `realJsxIdx`.
const returnIdx = fa.lastIndexOf("return (", realJsxIdx);

// We need to keep the context destructuring and local states up to `handleViewAssetDetails`.
// Actually, let's just rewrite the top of the file cleanly up to the real JSX.

const topOfFile = fa.substring(0, fa.indexOf("  return (${clean})`)();"));

// The real JSX part
const jsxPart = fa.substring(returnIdx);

const new_fa = topOfFile + "\n  " + jsxPart;

fs.writeFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', new_fa, 'utf-8');
console.log("Fixed FA once and for all!");
