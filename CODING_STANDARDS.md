# Enterprise Coding Standards & Software Engineering Framework

## 1. Vision
Code is a strategic organizational asset. It must be Readable, Maintainable, Testable, Secure, Extensible, Scalable, Documented, Observable, and Auditable. Any code that is difficult to understand, test, or maintain is forbidden.

## 2. Solution Structure
The solution is structured to separate concerns clearly:
- Core
- Shared Kernel
- Infrastructure
- Application
- Domain
- Persistence
- API
- Background Workers
- Integrations
- Reporting
- AI
- Tests
- Documentation
- Tools
- Scripts

*Business Logic must reside exclusively in Domain and Application layers.*

## 3. Naming Conventions
### Project Naming
`Company.Product.Module.Layer`
Example: `EduPro.Accounting.Domain`

### File Naming
- One class per file.
- `FileName` = `ClassName`.
- Avoid generic names: `Helper`, `Utils`, `Common`, `Temp`, `New`, `Final`, `Test1`, `Copy`.

## 4. Coding Standards
*   Follow SOLID, DRY, KISS, YAGNI.
*   Composition over Inheritance.
*   Dependency Injection is mandatory.
*   Use Immutable Objects where appropriate.
*   Use Guard Clauses.
*   Fail Fast.
*   **Forbidden:** Magic numbers, hardcoded strings, duplicated logic.

### Methods
- Short, clear, Single Responsibility Principle.
- Avoid over-complex methods.
- Minimize number of arguments.

### Classes
- Single Responsibility Principle.
- High Cohesion, Low Coupling.
- Dependency Injection (no static state).
- Interfaces First.

## 5. Error Handling
- Global Exception Handler.
- Use specialized exceptions: Business, Validation, Security, Infrastructure, External API.
- Always use Correlation ID for logging/tracing.
- Provide User-Friendly messages.

## 6. Layered Standards
### Validation
- All validation must occur in the Validation Layer.
- Forbidden: Writing validation logic inside UI components.

### DTOs
- Use separate DTOs for: Request, Response, Command, Query, Event.
- Forbidden: Using database entities directly in the API.

### Repositories
- No Business Logic allowed.
- Limited to: CRUD, Queries, Persistence.

### Services
- Application Services: Coordinate operations.
- Domain Services: Contain business logic.
- Infrastructure Services: Handle external systems.

## 7. Platform Integration Rules
*   **Logging:** All logs must pass through the Monitoring Platform. (Forbidden: `console.log`).
*   **Configuration:** All configurations must pass through the Configuration Platform. (Forbidden: Hardcoding Connection Strings, API Keys, Secrets).
*   **External Integration:** All external system calls must pass through the Integration Gateway.
*   **AI Integration:** All AI/LLM calls must pass through the AI Platform. (Forbidden: Direct calls to OpenAI, Gemini, etc.).

## 8. Security
- Never store passwords in plain text.
- Encrypt sensitive data.
- Principle of Least Privilege.
- Validate all inputs.
- Prevent: SQL Injection, XSS, CSRF.

## 9. Performance
- Pagination.
- Caching.
- Asynchronous processing.
- Lazy loading.
- Cancellation Tokens.
- Connection Pooling.
- Query Optimization.

## 10. Documentation & Testing
- Every Public API and Service must be documented.
- Every Module requires an Architecture Document.
- Every architectural decision requires an ADR (Architecture Decision Record).
- Testing is mandatory: Unit, Integration, Contract, Performance, Security, Regression.
- **Merge Blockers:** Code cannot be merged without passing all required tests.

## 11. Code Review Checklist
- Correctness
- Architecture
- Security
- Performance
- Maintainability
- Naming
- Documentation
- Testing
- Logging
- Error Handling

## 12. Definition of Done (DoD)
A feature is complete ONLY if:
- All tests passed.
- Documentation updated.
- Code reviewed.
- Security reviewed.
- Performance reviewed.
- Changelog updated.
- Approved.
