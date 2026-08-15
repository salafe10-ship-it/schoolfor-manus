# DOC-002 Failure RCA

## Mission

- Mission ID: DOC-002
- Title: Student Documents Staging Identity and Live Certification
- Environment: Isolated Staging only
- Status: `ROLE-MODEL-BLOCKED`

## Executive Finding

Live certification cannot begin safely because the existing Staging role model cannot legitimately grant the six approved StudentDocument permissions without changing the authorization architecture. No synthetic user, tenant, role, permission, or business fixture was created.

## Direct Staging Evidence

A read-only query against the Staging project returned:

- `roles`: empty
- `permissions`: empty for `StudentDocument.%`
- `role_permissions`: count `0`
- `user_roles`: count `0`
- application `users`: count `2`

The application code independently confirms that `RoleResolver.ts` uses static `ROLE_DEFINITIONS` and builds `ROLE_PERMISSIONS` at module load. It does not read the database `roles`, `permissions`, `role_permissions`, or `user_roles` tables. The static definitions contain no StudentDocument permissions for `student_affairs`, `auditor`, or another bounded operational role. Only wildcard roles such as `schooladmin` can pass the existing engine without a role-model change, and DOC-002 explicitly forbids wildcard authorization as a workaround.

## Why the Mission Must Stop

DOC-002 requires all of the following simultaneously:

1. Six explicit StudentDocument permissions.
2. An existing legitimate role/permission assignment.
3. No `RoleResolver` modification.
4. No `AuthorizationEngine` modification.
5. No wildcard workaround.
6. No new permission.

The current Staging state satisfies none of the database role-assignment prerequisites, and the running authorization path does not consume those tables. Creating rows in `permissions` or `role_permissions` would not grant access to the live application and would produce a misleading certification result. Assigning a wildcard role would violate the CTO directive.

## Security Impact

Proceeding would require either bypassing centralized authorization, changing the certified role resolver, or claiming a live authorization pass that the application cannot actually enforce. None of these is acceptable. No security boundary was weakened.

## Changes and Database Impact

- Source files modified: none.
- Migrations modified: none.
- Database writes: none.
- Synthetic Auth user: not created.
- Synthetic application user/tenant/school/branch/student: not created.
- Production: not accessed.
- Secrets, tokens, passwords, and connection strings: not read or recorded.

## Required CTO Decision

Create a separate bounded authorization-model mission to make the existing role-assignment mechanism effective for the runtime, or explicitly approve a supported staging test role that the current `RoleResolver` already recognizes and that legitimately carries the six permissions. DOC-002 itself cannot resolve this without violating its stop conditions.

## Mission Decision

`ROLE-MODEL-BLOCKED`

No live Student Documents certification tests were executed because authenticated access could not be provisioned without an unauthorized core change.
