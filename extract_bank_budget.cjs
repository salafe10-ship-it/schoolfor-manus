const fs = require('fs');
let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

const bankMarker = "{activeTab === 'bank_transfers' && (";
const budgetMarker = "{activeTab === 'estimated_budget' && (";

// Extract bank
let startIdx = portal.indexOf(bankMarker);
let trueEndIdx = -1;
let braceCount = 0;
let inString = false;
let stringChar = '';

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

const bankCode = portal.substring(startIdx, trueEndIdx + 1);
fs.writeFileSync('/tmp/bank.txt', bankCode, 'utf-8');

// Extract budget
startIdx = portal.indexOf(budgetMarker);
trueEndIdx = -1;
braceCount = 0;
inString = false;

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

const budgetCode = portal.substring(startIdx, trueEndIdx + 1);
fs.writeFileSync('/tmp/budget.txt', budgetCode, 'utf-8');

console.log('Bank and budget extracted');
