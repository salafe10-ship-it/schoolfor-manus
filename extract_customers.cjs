const fs = require('fs');

let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

const customersMarker = "{activeTab === 'customers' && (";
const suppliersMarker = "{activeTab === 'suppliers' && (";

// Extract customers
let startIdx = portal.indexOf(customersMarker);
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

const customersCode = portal.substring(startIdx, trueEndIdx + 1);
fs.writeFileSync('/tmp/customers.txt', customersCode, 'utf-8');

// Extract suppliers
startIdx = portal.indexOf(suppliersMarker);
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

const suppliersCode = portal.substring(startIdx, trueEndIdx + 1);
fs.writeFileSync('/tmp/suppliers.txt', suppliersCode, 'utf-8');

console.log('Customers and suppliers extracted');
