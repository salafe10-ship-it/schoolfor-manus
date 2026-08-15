import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

// Remove duplicates
content = content.replace(/const \[jvSearchFilters, setJvSearchFilters\] = useState\(\{ id: '', status: '', type: '', description: '' \}\);\n/g, '');
content = content.replace(/const \[activeJvState, setActiveJvState\] = useState<any>\(null\);\n/g, '');
content = content.replace(/const \[selectedReceiptVoucher, setSelectedReceiptVoucher\] = useState<any \| null>\(null\);\n/g, '');
content = content.replace(/const \[showReceiptDetailModal, setShowReceiptDetailModal\] = useState<boolean>\(false\);\n/g, '');
content = content.replace(/const \[selectedPaymentVoucher, setSelectedPaymentVoucher\] = useState<any \| null>\(null\);\n/g, '');
content = content.replace(/const \[showPaymentDetailModal, setShowPaymentDetailModal\] = useState<boolean>\(false\);\n/g, '');

// Also setNewYearNumberInput duplicate
content = content.replace(/const \[setNewYearNumberInput, closingDescriptionInput, setClosingDescriptionInput\] = \[\(\)=> \{\}, '', \(\)=> \{\}\];\n/g, 
  "const [closingDescriptionInput, setClosingDescriptionInput] = useState<string>('');\n"
);

// add addJvAuditEvent dummy function
content = content.replace(
  "  const handleCancelCoa = () => {",
  "  const addJvAuditEvent = (jvId: string, action: string, details: string) => { setJvAuditTrail(prev => [...prev, { jvId, action, details, date: new Date().toISOString() }]); };\n  const handleCancelCoa = () => {"
);

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
