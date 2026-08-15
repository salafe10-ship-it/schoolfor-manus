# Enterprise Architecture Audit & Refactoring Strategy

## 1. Project Structure & God Component Audit
The project currently suffers from extreme "God Component" anti-patterns. The presentation layer is heavily bloated with business logic, database calls, and state management.

### Top Offenders (Files violating Single Responsibility Principle)
1. \`src/components/GeneralLedgerPortal.tsx\` - 18,801 lines
2. \`src/components/ExamsResultsModule.tsx\` - 11,090 lines
3. \`src/certification/EnterpriseGovernanceTab.tsx\` - 6,984 lines
4. \`src/components/StudentAffairsPortal.tsx\` - 6,745 lines
5. \`src/components/StudentFinancialPortal.tsx\` - 4,513 lines
6. \`src/App.tsx\` - 4,010 lines

**Conclusion:** The presentation layer is acting as the Application, Domain, and Infrastructure layer simultaneously.

## 2. Target Clean Architecture (Module Isolation)

To achieve Enterprise SaaS scalability, we are shifting to a **Domain-Driven Design (DDD)** folder structure.

Every module will follow strict separation:
\`\`\`
src/modules/[module-name]/
├── presentation/      # React components, Pages, Views
├── application/       # Use cases, Services (e.g., StudentLifecycleService)
├── domain/            # Entities, Value Objects, Domain Services, Interfaces
└── infrastructure/    # Database Repositories, External APIs
\`\`\`

### Defined ERP Modules
1. **student-affairs** (Admissions, Attendance, Profiles)
2. **examination** (Grades, Marks, Certificates)
3. **finance** (Student Fees, Invoicing, Receipts)
4. **accounting** (Ledgers, Journals, Chart of Accounts)
5. **hr** (Employees, Payroll, Roles)
6. **audit** (Audit Logs, System Health)
7. **tenant** (Schools, Branches, Academic Years)

## 3. Dependency Rules & Enforcement
- **Presentation** -> depends on -> **Application**
- **Application** -> depends on -> **Domain** & **Infrastructure** (via interfaces)
- **Infrastructure** -> depends on -> **Domain** (implements repositories)
- **Domain** -> depends on -> **Nothing** (Pure TypeScript)

*Forbidden Patterns:*
- No \`useEffect\` directly calling Supabase clients.
- No raw SQL inside React components.
- No \`localStorage\` usage in components (must go through \`StorageService\`).

## 4. Multi-Tenant Validation
All Database operations MUST route through \`UnitOfWork\` and the established Repositories which inherently inject:
- \`school_id\` (Tenant)
- \`branch_id\` (Sub-Tenant)
- \`academic_year_id\` (Temporal Scope)

## 5. Phased Refactoring Plan
Due to the sheer size of the components (e.g., 18k lines), refactoring will be done via **Code Splitting**:
1. **Phase A (Infrastructure Setup)**: Establish Repositories and Application Services for Finance and Examinations (already started).
2. **Phase B (Extraction)**: Extract monolithic Tabs from \`GeneralLedgerPortal\` and \`ExamsResultsModule\` into lazy-loaded sub-components in \`presentation\` folders.
3. **Phase C (State Migration)**: Migrate local component state (\`useState\`) into centralized Contexts/Stores that interact purely with Application Services.
4. **Phase D (Routing)**: Implement \`React.lazy()\` and \`Suspense\` in \`App.tsx\` to drastically reduce initial bundle size.

## 6. Security Architecture
- RBAC is enforced at the UI level (Sidebar rendering).
- Row Level Security (RLS) policies are active at the DB level.
- Audit trailing is hooked into \`UnitOfWork\` for critical transitions.
