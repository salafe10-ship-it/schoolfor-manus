import type { TransactionSession } from "../../src/database/transactions/TransactionContracts.js";

export interface ConnectionIdentity {
  current_user: string;
  session_user: string;
  rolsuper: boolean;
  rolbypassrls: boolean;
}

export const CONNECTION_IDENTITY_QUERY = `
  SELECT
    current_user::text AS current_user,
    session_user::text AS session_user,
    r.rolsuper AS rolsuper,
    r.rolbypassrls AS rolbypassrls
  FROM pg_roles AS r
  WHERE r.rolname = current_user
`;

type IdentityQueryable = {
  query: (sqlText: string, parameters?: readonly unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

export async function readConnectionIdentity(queryable: IdentityQueryable | TransactionSession): Promise<ConnectionIdentity> {
  const result = await queryable.query(CONNECTION_IDENTITY_QUERY);
  const row = result.rows[0];
  if (!row || typeof row.current_user !== "string" || typeof row.session_user !== "string") {
    throw new Error("PostgreSQL connection identity could not be determined.");
  }

  return {
    current_user: row.current_user,
    session_user: row.session_user,
    rolsuper: row.rolsuper === true,
    rolbypassrls: row.rolbypassrls === true,
  };
}

export function isStagingConnectionDiagnosticsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.EDUPRO_ENVIRONMENT === "staging" && env.CONN_DIAGNOSTIC_ENABLED === "true";
}

export function getDiagnosticSampleCount(env: NodeJS.ProcessEnv = process.env): number {
  const configured = Number(env.CONN_DIAGNOSTIC_SAMPLE_COUNT || 3);
  if (!Number.isFinite(configured)) return 3;
  return Math.min(5, Math.max(1, Math.floor(configured)));
}
