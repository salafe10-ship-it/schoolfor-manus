const fs = require('fs');

let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

const ctxMatch = portal.match(/const accountingContextValue = \{[\s\S]*?\};\n/);
if (ctxMatch) {
  portal = portal.replace(ctxMatch[0], '');
  portal = portal.replace('return (', ctxMatch[0] + '\n  return (');
  fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', portal, 'utf-8');
  console.log('Context fixed');
} else {
  console.log('Context not found');
}
