const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const startStr = "{activeSection === 'audit_logs' && (";
const endStr = "          {/* ========================================================== */}";
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(startStr)) {
    startIdx = i;
  }
  if (startIdx !== -1 && i > startIdx && lines[i].includes("VIEW: BRACES & SCHOOLS")) {
    // Found the next section.
    // Let's backtrack to find the ending `)}`
    for (let j = i - 1; j >= startIdx; j--) {
      if (lines[j].trim() === ")}") {
        endIdx = j;
        break;
      }
    }
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `          {activeSection === 'audit_logs' && (
            <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل وحدة السجلات والتدقيق المؤسسي...</div>}>
              <AuditLogsPortal 
                auditLogs={auditLogs} 
                isBackingUp={isBackingUp} 
                startBackupProcess={startBackupProcess} 
                backupLogs={backupLogs} 
                selectedSchoolId={selectedSchool.id}
              />
            </React.Suspense>
          )}`;
  
  const before = lines.slice(0, startIdx);
  const after = lines.slice(endIdx + 1);
  const newContent = [...before, replacement, ...after].join('\n');
  
  fs.writeFileSync('src/App.tsx', newContent, 'utf-8');
  console.log('Successfully updated App.tsx replacing audit_logs block.');
} else {
  console.log('Failed to find bounds:', startIdx, endIdx);
}
