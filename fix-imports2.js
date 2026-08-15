import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

const regex = /import\s+\{[\s\S]*?\}\s+from\s+['"]lucide-react['"];/g;
let match;
const imports = new Set();
let newContent = content;

// Gather all imported things
const matches = [...content.matchAll(regex)];
if (matches.length > 1) {
    let allImports = [];
    matches.forEach(m => {
        const inside = m[0].substring(m[0].indexOf('{') + 1, m[0].indexOf('}'));
        const tokens = inside.split(',').map(s => s.trim()).filter(s => s.length > 0);
        allImports.push(...tokens);
    });
    const uniqueImports = [...new Set(allImports)];
    
    // Replace the first match with the combined one
    newContent = newContent.replace(matches[0][0], `import { ${uniqueImports.join(', ')} } from 'lucide-react';`);
    
    // Remove the other matches
    for(let i=1; i<matches.length; i++) {
        newContent = newContent.replace(matches[i][0], '');
    }
}

// Remove duplicated import of useCurrency
const useCurrencyRegex = /import\s+\{\s*useCurrency\s*\}\s+from\s+['"][^'"]+currency['"];/g;
const ucMatches = [...newContent.matchAll(useCurrencyRegex)];
if(ucMatches.length > 1) {
    for(let i=1; i<ucMatches.length; i++) {
        newContent = newContent.replace(ucMatches[i][0], '');
    }
}

// Remove duplicated import of EnterpriseActionToolbar
const eatRegex = /import\s+\{\s*EnterpriseActionToolbar\s*\}\s+from\s+['"][^'"]+EnterpriseActionToolbar['"];/g;
const eatMatches = [...newContent.matchAll(eatRegex)];
if(eatMatches.length > 1) {
    for(let i=1; i<eatMatches.length; i++) {
        newContent = newContent.replace(eatMatches[i][0], '');
    }
}

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', newContent);
