import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

// The file has multiple 'lucide-react' imports and duplicated variables because it was combined or sed replaced badly.
// Let's just remove the duplicates in the second block
const toRemove = [
  "Building2", "Calendar", "Layers", "HelpCircle", "Activity", "Plus", "RefreshCw", "AlertTriangle"
];

for(const name of toRemove) {
  content = content.replace(new RegExp(name + ",\\\\s*", "g"), "");
  // Actually we need to make sure we only remove the second occurrences!
}
fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
