import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL_MISSING');
const pool = new Pool({ connectionString, max: 1, ssl: { rejectUnauthorized: false } });
try {
  const columns = await pool.query<{ column_name: string }>(`
    SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'schools'
     ORDER BY ordinal_position
  `);
  const available = new Set(columns.rows.map((row) => row.column_name));
  const labelColumn = ['name', 'school_name', 'legal_name', 'display_name'].find((column) => available.has(column));
  const orderColumn = available.has('created_at') ? 'created_at' : 'id';
  const selectLabel = labelColumn ? `, ${labelColumn} AS school_label` : ', id::text AS school_label';
  const result = await pool.query(`
    SELECT id${selectLabel}, status, deleted_at,
           central_metadata->'ownerWorkspace' AS owner_workspace
      FROM public.schools
     ORDER BY ${orderColumn}
  `);
  console.log(JSON.stringify({
    count: result.rowCount,
    schools: result.rows.map((row) => ({
      id: row.id,
      name: row.school_label,
      status: row.status,
      deleted: Boolean(row.deleted_at),
      ownerWorkspace: row.owner_workspace,
    })),
  }, null, 2));
} finally {
  await pool.end();
}
