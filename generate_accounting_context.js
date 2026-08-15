const fs = require('fs');

const content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');
const lines = content.split('\n');

const stateRegex = /const \[([a-zA-Z0-9]+),\s*set([a-zA-Z0-9]+)\]\s*=\s*useState(?:<[^>]+>)?\(([\s\S]*?)\);/;
const states = [];

for(let i=0; i<lines.length; i++) {
    const line = lines[i];
    if(line.includes('useState') && line.includes('const [')) {
       // Just grab the variable names
       const match = line.match(/const \[([a-zA-Z0-9_]+),\s*set([a-zA-Z0-9_]+)\]/);
       if(match) {
           states.push({
               name: match[1],
               setter: 'set' + match[2],
               originalLine: line.trim()
           });
       }
    }
}

console.log(`Found ${states.length} states.`);
