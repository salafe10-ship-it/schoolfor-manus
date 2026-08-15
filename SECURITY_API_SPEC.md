# Enterprise Security Platform - API Specification

## 1. Vision
The Enterprise Security Platform API serves as the official and exclusive contract for all security-related interactions within the ecosystem. Direct database access, direct domain model manipulation, and bypassing the Security Gateway are strictly forbidden. All operations must traverse this unified, RESTful API contract.

---

## 2. API Design Principles
*   **Protocol:** RESTful, HTTPS-only (TLS 1.3).
*   **Format:** JSON-only (UTF-8).
*   **Documentation:** OpenAPI 3.1.
*   **Versioning:** URI-based (`/api/v1/security/...`).
*   **Governance:** Stateless, Idempotent, Resource-based, Secure-by-Design.

---

## 3. Base URL
`https://security-platform.enterprise.system/api/v1/security`

---

## 4. API Categories

### Authentication APIs
- `POST /auth/login` - User authentication
- `POST /auth/logout` - Session invalidation
- `POST /auth/refresh` - Token refresh
- `POST /auth/change-password` - Security operation
- `POST /auth/verify-otp` - MFA verification
- `POST /auth/mfa/start` - MFA initiation

### Identity APIs
- `GET /users`, `GET /users/{id}`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}`
- `GET /users/search`, `GET /users/profile`, `PUT /users/profile`

### Role & Permission APIs
- `GET /roles`, `POST /roles`, `PUT /roles/{id}`, `DELETE /roles/{id}`
- `GET /permissions`, `POST /permissions/assign`, `POST /permissions/revoke`, `GET /permissions/effective`

### Policy & Session APIs
- `GET /policies`, `POST /policies`, `POST /policies/publish`
- `GET /sessions/active`, `DELETE /sessions/{id}`, `POST /sessions/revoke-all`

---

## 5. Headers & Models

### Mandatory Headers
- `Authorization`: Bearer <JWT>
- `X-Tenant-ID`: UUID
- `X-Correlation-ID`: UUID (For tracing)
- `Accept-Language`: e.g., 'en-US' or 'ar-SA'

### Response Model (Standard Envelope)
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... },
  "metadata": { "pagination": { ... }, "correlationId": "..." },
  "timestamp": "2026-07-18T05:48:00Z"
}
```

### Error Model
```json
{
  "status": "error",
  "code": "SECURITY_ERROR",
  "message": "Specific error description",
  "correlationId": "...",
  "errors": [{ "field": "...", "message": "..." }]
}
```

---

## 6. Performance SLA
| Operation | Latency |
| :--- | :--- |
| GET | ≤ 100 ms |
| POST/PUT/DELETE | ≤ 300 ms |
| Search | ≤ 500 ms |
| Bulk | ≤ 2 Seconds |

---

## 7. Mandatory Governance Rules
*   **NO** execution without authentication.
*   **NO** bypassing the Authorization Engine.
*   **NO** cross-tenant data access.
*   **NO** hardcoded secrets.
*   **ALL** APIs must support Correlation ID for tracing.
*   **ALL** APIs must be versioned.
*   **ALL** APIs must be documented in OpenAPI.

---

## 8. Definition of Done
An API endpoint is complete only if:
- Fully documented in OpenAPI 3.1.
- All DTOs documented.
- All Error Codes defined.
- Security tests passed (OWASP).
- Performance benchmarks passed.
- Contract testing passed.
- Backward compatibility verified.
