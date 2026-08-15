import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

content = content.replace(
  "const addJvAuditEvent = (jvId: string, action: string, details: string) => { setJvAuditTrail(prev => [...prev, { jvId, action, details, date: new Date().toISOString() }]); };",
  "const addJvAuditEvent = (jvId: string, action: string, userName?: string, details?: string) => { setJvAuditTrail(prev => [...prev, { jvId, action, details: details || userName, date: new Date().toISOString() }]); };"
);

// Also fix the duplicate jvSearchFilters
content = content.replace(/const \[jvSearchFilters, setJvSearchFilters\] = useState\(\{ id: '', status: '', type: '', description: '' \}\);\n/g, '');

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
