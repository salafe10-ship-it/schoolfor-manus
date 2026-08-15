const fs = require('fs');

let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

const startIdx = portal.indexOf("{activeTab === 'dashboard' && (");
if (startIdx !== -1) {
  let braceCount = 0;
  let trueEndIdx = -1;
  let inString = false;
  let stringChar = '';
  let inJSX = false;
  
  for (let i = startIdx; i < portal.length; i++) {
    const char = portal[i];
    if ((char === '"' || char === "'" || char === "\`") && portal[i-1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (stringChar === char) {
        inString = false;
      }
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          trueEndIdx = i;
          break;
        }
      }
    }
  }
  
  if (trueEndIdx !== -1) {
    const dashboardCode = portal.substring(startIdx, trueEndIdx + 1);
    fs.writeFileSync('/tmp/dashboard.txt', dashboardCode, 'utf-8');
    console.log('Dashboard block extracted successfully.');
  } else {
    console.log('Dashboard trueEndIdx not found');
  }
} else {
  console.log('Dashboard condition not found');
}
