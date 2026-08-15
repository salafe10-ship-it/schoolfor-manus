# Security Risk Matrix

| Threat | Category | Severity | Mitigation |
| :--- | :--- | :--- | :--- |
| SQLi | Data | Critical | Drizzle/Parameterized Queries |
| XSS | Data | High | Input Sanitization/CSP |
| CSRF | Auth | High | SameSite Cookies/Anti-CSRF Tokens |
| File Abuse | File | High | Extension/Size Validation |
| Privilege Escalation | Auth | Critical | RBAC Enforcement (Identity Module) |
