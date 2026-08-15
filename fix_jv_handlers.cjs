const fs = require('fs');
let text = fs.readFileSync('src/modules/accounting/presentation/JournalEntriesTab.tsx', 'utf-8');

text = text.replace(/const = \(\) => \{\n\s*let nextNum = journalEntries\.length \+ 1;/g, "const handlePrepareNewJv = () => {\n    let nextNum = journalEntries.length + 1;");
text = text.replace(/const = \(jvId: string\) => \{\n\s*const jv = journalEntries\.find\(j => j\.id === jvId\);/g, "const handleEditJv = (jvId: string) => {\n    const jv = journalEntries.find(j => j.id === jvId);");
text = text.replace(/const = \(jvId: string, action: string, user: string, details: string\) => \{/g, "const addJvAuditTrail = (jvId: string, action: string, user: string, details: string) => {");
text = text.replace(/const = \(field: string, value: any\) => \{\n\s*\(\(prev: any\) => \(\{\n\s*\.\.\.prev,/g, "const handleJvFormChange = (field: string, value: any) => {\n    setActiveJvState((prev: any) => ({\n      ...prev,");
text = text.replace(/const = \(lineId: string, field: string, value: any\) => \{\n\s*\(\(prev: any\) => \{/g, "const handleJvLineChange = (lineId: string, field: string, value: any) => {\n    setActiveJvState((prev: any) => {");
text = text.replace(/const = \(\) => \{\n\s*\(\(prev: any\) => \(\{\n\s*\.\.\.prev,/g, "const handleAddJvLine = () => {\n    setActiveJvState((prev: any) => ({\n      ...prev,");
text = text.replace(/const = \(lineId: string\) => \{\n\s*\(\(prev: any\) => \{/g, "const handleRemoveJvLine = (lineId: string) => {\n    setActiveJvState((prev: any) => {");
text = text.replace(/const = \(index: number\) => \{\n\s*\(\(prev: any\) => \{\n\s*const newLines = \[\.\.\.prev\.lines\];/g, "const handleDuplicateJvLine = (index: number) => {\n    setActiveJvState((prev: any) => {\n      const newLines = [...prev.lines];");
text = text.replace(/const = \(line: any\) => \{\n\s*\(\{\ \.\.\.line, id: undefined \}\);/g, "const handleCopyJvLine = (line: any) => {\n    setCopiedJvLine({ ...line, id: undefined });");
text = text.replace(/const = \(index: number\) => \{\n\s*if \(!\) \{/g, "const handlePasteJvLine = (index: number) => {\n    if (!copiedJvLine) {");
text = text.replace(/const = \(index: number, direction: 'up' \| 'down'\) => \{\n\s*\(\(prev: any\) => \{/g, "const handleMoveJvLine = (index: number, direction: 'up' | 'down') => {\n    setActiveJvState((prev: any) => {");
text = text.replace(/const = \(jvId: string\) => \{\n\s*const jv = journalEntries\.find\(j => j\.id === jvId\);\n\s*if \(!jv\) return;[\s\S]*?\} else \{/g, "const handleApproveJv = (jvId: string) => {\n    const jv = journalEntries.find(j => j.id === jvId);\n    if (!jv) return;\n    if (jv.status === 'مرحل') {\n      triggerNotification('لا يمكن اعتماد قيد مرحل مسبقاً', 'warning');\n      return;\n    } else {");
text = text.replace(/const = \(jvId: string\) => \{\n\s*const jv = journalEntries\.find\(j => j\.id === jvId\);\n\s*if \(!jv\) return;\n\s*if \(jv\.status === 'مرحل'\) \{/g, "const handlePostJv = (jvId: string) => {\n    const jv = journalEntries.find(j => j.id === jvId);\n    if (!jv) return;\n    if (jv.status === 'مرحل') {");
text = text.replace(/const = \(format: string, jvToExport: any = \) => \{/g, "const handleExportJv = (format: string, jvToExport: any = activeJvState) => {");
text = text.replace(/const = \(csvText: string\) => \{/g, "const handleImportJvLinesFromCSV = (csvText: string) => {");

fs.writeFileSync('src/modules/accounting/presentation/JournalEntriesTab.tsx', text, 'utf-8');
console.log("Fixed JV handlers");
