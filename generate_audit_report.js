const fs = require('fs');
const execSync = require('child_process').execSync;

const reportPath = 'docs/type-safety-audit-report.md';

const findUsages = (keyword) => {
  try {
    const res = execSync(`grep -rnw "${keyword}" src/ | wc -l`).toString().trim();
    return parseInt(res, 10);
  } catch (e) {
    return 0;
  }
};

const anyCount = findUsages('any');
const tsIgnoreCount = findUsages('@ts-ignore');
const unknownCount = findUsages('unknown');

const report = `# Enterprise Type Safety Audit Report

## 1. Current State Overview
- **Implicit/Explicit \`any\` Usages**: ${anyCount}
- **\`@ts-ignore\` Usages**: ${tsIgnoreCount}
- **\`unknown\` Usages**: ${unknownCount}

## 2. Classification of Risk
- **Critical Risk (Database/Auth Layer)**: Use of \`any\` in database repositories (e.g. \`UnitOfWork\`, \`AuditRepository\`) bypasses schema validation.
- **High Risk (API/Service Layer)**: Form submissions and JSON parsing lack runtime type checks.
- **Medium Risk (UI/State Layer)**: React props and Contexts typed as \`any\` leading to potential render crashes.

## 3. Progress & POC (Phase 1-3)
- ✅ Refactored \`AuditLogEntry\` and \`AuditEntry\` to use strongly typed generics (\`<T = Record<string, unknown>>\`).
- ✅ Replaced \`any\` with \`unknown\` in \`ExaminationAuditor\` parameters.
- ✅ Updated \`src/modules/examination/types.ts\` to use \`Record<string, unknown>\` for metadata fields.

## 4. Path to 100% Strict Mode (Phases 4-13)
To fully eliminate the remaining \`any\` types across the codebase, the following domain models are scheduled to be fully fleshed out:
- \`finance/Invoice.ts\`, \`finance/Receipt.ts\`, \`finance/JournalEntry.ts\`
- \`student/StudentProfile.ts\`, \`attendance/AttendanceLog.ts\`

### Recommended Action Plan:
1. **Enable \`noImplicitAny\`** in \`tsconfig.json\`.
2. **Replace UI generic \`any\`** in components like tables/lists with bounded generics (e.g., \`<T extends BaseEntity>\`).
3. **Migrate Supabase queries** to use auto-generated types from the Database schema (e.g., \`Database['public']['Tables']['students']['Row']\`).
`;

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync(reportPath, report);
console.log('Report generated at ' + reportPath);
