import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import * as errors from '../utils/errors';
import * as policy from '../modules/inventory/domain/InventoryWritePolicy';
import { validateInventoryProcurementSnapshot } from '../modules/inventory/domain/InventoryProcurementValidation';
import { PERMISSIONS } from '../authorization/PermissionRegistry';

const source = readFileSync('server.ts', 'utf8');
const ast = ts.createSourceFile('server.ts', source, ts.ScriptTarget.Latest, true);
function functionSource(name: string) {
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  if (!declaration) throw new Error(`Missing function ${name}`);
  return declaration.getText(ast);
}
let routeSource = '';
function visit(node: ts.Node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'app.post' && node.arguments[0]?.getText(ast) === '"/api/inventory/database"') routeSource = node.arguments.at(-1)!.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
const financialCollections = ast.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => declaration.name.getText(ast) === 'INVENTORY_FINANCIAL_COLLECTIONS'));
if (!financialCollections) throw new Error('Missing financial collection protection');
const body = ts.transpileModule(`${financialCollections.getText(ast)}\n${functionSource('validateInventoryPostingMetadata')}\n${functionSource('validateInventoryQuantityLedger')}\n${functionSource('isPurchaseOrderReceiptProgression')}\nglobalThis.handler = ${routeSource};`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const empty = () => ({ items: [], categories: [], brands: [], units: [], suppliers: [], warehouses: [], movements: [], stocktakes: [], purchaseRequests: [], rfqs: [], quotations: [], purchaseOrders: [], goodsReceipts: [], vendorBills: [], vendorPayments: [], settings: {}, procurementSettings: {} });
function harness() {
  const state: any = { data: empty(), version: 0, receipts: [], snapshotWrites: 0, auditWrites: 0 };
  const transaction = { query: vi.fn(async (sql: string, params: any[]) => {
    if (sql.includes('SELECT id FROM public.users')) return { rows: [{ id: 'actor' }] };
    if (sql.includes('SELECT data, version')) return { rows: [{ data: clone(state.data), version: state.version }] };
    if (sql.includes("metadata->'operation' AS operation")) return { rows: state.receipts.filter((row: any) => row.operation.id === params[3]).map((row: any) => ({ operation: clone(row.operation) })) };
    if (sql.includes('INSERT INTO public.inventory_database') && !sql.includes('DO NOTHING')) { state.data = JSON.parse(params[2]); state.version = params[3]; state.snapshotWrites++; }
    if (sql.includes('INSERT INTO public.audit_events')) { state.receipts.push(JSON.parse(params[4])); state.auditWrites++; }
    return { rows: [] };
  }) };
  const posting = { isProvisioned: vi.fn(async () => false), getReadiness: vi.fn(async () => ({ sourceSupport: { inventory: true }, missing: [], invalid: [] })), syncInventoryProcurementSnapshot: vi.fn() };
  const context: any = vm.createContext({ ...errors, ...policy, createHash, validateInventoryProcurementSnapshot, PERMISSIONS,
    stableJsonStringify: policy.inventoryStableJson, CanonicalErpPostingService: posting, authorizationEngine: { can: () => true },
    UnitOfWork: { runInTransaction: async (_id: any, _audit: any, work: any) => work(), getActiveContext: () => ({ databaseTransaction: transaction }) } });
  vm.runInContext(body, context);
  const invoke = async (data: any, expectedVersion: number, operationId: string) => {
    const req = { body: { data, expectedVersion, operationId }, user: { id: 'auth-user', tenantId: 'tenant', schoolId: 'school', name: 'اسم موثوق' }, tenantContext: { tenantId: 'tenant', schoolId: 'school' }, ip: 'test' };
    let payload: any; let error: any;
    await context.handler(req, { json: (value: any) => { payload = value; } }, (value: any) => { error = value; });
    return { payload, error };
  };
  return { state, posting, invoke };
}
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
describe('actual inventory POST durable operation receipts', () => {
  it('saves directory data without requiring or posting a financial journal', async () => {
    const { state, posting, invoke } = harness(); const data = empty(); data.categories.push({ id: 'category', name: 'تصنيف اختبار' } as never);
    const result = await invoke(data, 0, 'operation-000000000001');
    expect(result.error).toBeUndefined(); expect(result.payload.success).toBe(true);
    expect(state.snapshotWrites).toBe(1); expect(state.auditWrites).toBe(1); expect(posting.syncInventoryProcurementSnapshot).not.toHaveBeenCalled();
    expect(result.payload.meta.operation).toMatchObject({ id: 'operation-000000000001', expectedVersion: 0, committedVersion: 1, actorId: 'actor' });
  });
  it('confirms identical replay before version check without duplicate effects or audit', async () => {
    const { state, posting, invoke } = harness(); const data = empty();
    const first = await invoke(clone(data), 0, 'operation-000000000001'); expect(first.error).toBeUndefined();
    const replay = await invoke(clone(data), 0, 'operation-000000000001');
    expect(replay.error).toBeUndefined(); expect(replay.payload.meta.version).toBe(1);
    expect(state.snapshotWrites).toBe(1); expect(state.auditWrites).toBe(1); expect(posting.syncInventoryProcurementSnapshot).not.toHaveBeenCalled();
  });
  it('returns current snapshot and original receipt even after a later save', async () => {
    const { state, invoke } = harness(); const data = empty(); await invoke(clone(data), 0, 'operation-000000000001');
    const later = clone(data); later.categories.push({ id: 'c', name: 'لاحق' } as never); await invoke(later, 1, 'operation-000000000002');
    const replay = await invoke(clone(data), 0, 'operation-000000000001');
    expect(replay.error).toBeUndefined(); expect(replay.payload.meta.version).toBe(2); expect(replay.payload.meta.operation.committedVersion).toBe(1);
    expect(replay.payload.data.categories).toHaveLength(1); expect(state.snapshotWrites).toBe(2);
  });
  it('rejects a reused operation ID with changed content or base version', async () => {
    const { state, invoke } = harness(); const data = empty(); await invoke(clone(data), 0, 'operation-000000000001');
    const changed = clone(data); changed.categories.push({ id: 'c', name: 'مختلف' } as never);
    expect((await invoke(changed, 0, 'operation-000000000001')).error).toBeInstanceOf(errors.ConflictError);
    expect((await invoke(data, 1, 'operation-000000000001')).error).toBeInstanceOf(errors.ConflictError); expect(state.snapshotWrites).toBe(1);
  });
  it('rejects stale writers and unknown posting keys without mutating state', async () => {
    const { state, invoke } = harness();
    expect((await invoke(empty(), 1, 'operation-000000000001')).error).toBeInstanceOf(errors.ConflictError);
    expect((await invoke({ ...empty(), inventorySales: [{ id: 'inject' }] }, 0, 'operation-000000000002')).error).toBeInstanceOf(errors.ValidationError);
    expect(state.snapshotWrites).toBe(0);
  });
});
