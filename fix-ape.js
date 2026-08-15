const fs = require('fs');
let content = fs.readFileSync('src/modules/accounting/application/AccountingPostingEngine.ts', 'utf8');

content = content.replace(
  "await JournalRepository.enlistCreateJournalEntry(event.tenantId, entry);",
  "await JournalRepository.enlistCreateJournalEntry(entry.id, event.tenantId, entry.date, entry.description, entry.status, entry.lines || [], entry.debitTotal || 0, entry.creditTotal || 0, 'SYS', 'SYS', new Date().toISOString(), entry as any);"
);

fs.writeFileSync('src/modules/accounting/application/AccountingPostingEngine.ts', content);
