import fs from 'fs';
let content = fs.readFileSync('src/database/services/StudentAdmissionService.ts', 'utf8');

content = content.replace(
`      AuditRepository.enlistCreateAuditLogParameterized(
        auditLogId,
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'INSERT',
        'students',
        meta.ipAddress,
        auditLog.details,
        auditLog
      );`,
`      AuditRepository.enlistCreateAuditLogParameterized(
        auditLogId,
        schoolId,
        auditLog
      );`
);

fs.writeFileSync('src/database/services/StudentAdmissionService.ts', content);
