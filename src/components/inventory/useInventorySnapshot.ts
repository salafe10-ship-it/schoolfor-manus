import { useRef, useState } from 'react';
import { getTrustedAccessToken } from '../../utils/auth';
import { emptyInventoryCanonicalDatabase, normalizeInventoryCanonicalDatabase, type InventoryCanonicalDatabase } from './inventoryCanonical';
import type { InventoryCapabilities } from './inventoryUiPolicy';

type Attempt = { id: string; version: number; data: InventoryCanonicalDatabase };
type Snapshot = { data: InventoryCanonicalDatabase; meta: { version: number; operation?: { id: string; expectedVersion: number; committedVersion?: number; actorId?: string; payloadHash?: string }; capabilities?: InventoryCapabilities } };
const UNKNOWN = 'نتيجة الحفظ غير محسومة؛ أعد التحقق قبل أي محاولة أخرى.';

export function operationMatchesAttempt(operation: Snapshot['meta']['operation'], attempt: Pick<Attempt, 'id' | 'version'>) {
  return operation?.id === attempt.id && operation.expectedVersion === attempt.version
    && Number.isInteger(operation.committedVersion) && operation.committedVersion! > attempt.version;
}

export function useInventorySnapshot() {
  const [database, setDatabase] = useState<InventoryCanonicalDatabase>(emptyInventoryCanonicalDatabase);
  const [version, setVersion] = useState<number | null>(null);
  const [capabilities, setCapabilities] = useState<InventoryCapabilities>({});
  const [isLoading, setLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [unknownSave, setUnknownSave] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const versionRef = useRef<number | null>(null);
  const readyRef = useRef(false);
  const inFlight = useRef(false);
  const pending = useRef<Attempt | null>(null);
  const generation = useRef(0);

  const reset = () => {
    generation.current += 1;
    readyRef.current = false;
    versionRef.current = null;
    pending.current = null;
    setVersion(null); setDatabase(emptyInventoryCanonicalDatabase()); setCapabilities({}); setCheckedAt(null); setUnknownSave(false);
  };
  const headers = () => {
    const token = getTrustedAccessToken();
    if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };
  const apply = (snapshot: Snapshot, epoch: number) => {
    if (epoch !== generation.current) throw new Error('تغير سياق المدرسة؛ أعد تحميل المصدر.');
    if (!Number.isInteger(snapshot.meta?.version) || snapshot.meta.version < 0 || !snapshot.data) throw new Error('استجابة المصدر المركزي غير مكتملة.');
    versionRef.current = snapshot.meta.version;
    readyRef.current = true;
    setVersion(snapshot.meta.version);
    setDatabase(normalizeInventoryCanonicalDatabase(snapshot.data));
    setCapabilities(snapshot.meta.capabilities || {});
    setCheckedAt(new Date().toISOString());
  };
  const read = async (epoch: number, operationId?: string): Promise<Snapshot> => {
    try {
      const url = operationId ? `/api/inventory/database?operationId=${encodeURIComponent(operationId)}` : '/api/inventory/database';
      const response = await fetch(url, { headers: headers(), cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تحميل المخزون والمشتريات.');
      apply(payload, epoch);
      return payload;
    } catch (error) {
      if (epoch === generation.current) { readyRef.current = false; setCheckedAt(null); setCapabilities({}); }
      throw error;
    }
  };
  const refresh = async () => {
    setLoading(true);
    try { return await read(generation.current); }
    finally { setLoading(false); }
  };
  const commit = async (nextDatabase: InventoryCanonicalDatabase) => {
    if (inFlight.current) throw new Error('جارٍ حفظ عملية أخرى؛ انتظر اكتمال التحقق.');
    if (!pending.current && (!readyRef.current || versionRef.current === null)) throw new Error('يلزم تحميل المصدر المركزي بنجاح قبل الحفظ.');
    inFlight.current = true; setSaving(true);
    const epoch = generation.current;
    let attempt = pending.current;
    const confirmed = (snapshot: Snapshot) => operationMatchesAttempt(snapshot.meta?.operation, attempt!);
    const finish = () => {
      if (epoch !== generation.current) throw new Error('تغير سياق المدرسة؛ أعد تحميل المصدر.');
      pending.current = null; setUnknownSave(false);
    };
    try {
      if (attempt) {
        if (JSON.stringify(nextDatabase) !== JSON.stringify(attempt.data)) throw new Error('توجد عملية سابقة غير محسومة؛ تحقق منها أو أعد محاولتها قبل حفظ بيانات مختلفة.');
        const snapshot = await read(epoch, attempt.id);
        if (confirmed(snapshot)) { finish(); return; }
        // Only retry the original immutable payload at its original version.
        if (snapshot.meta.version !== attempt.version) { setUnknownSave(true); throw new Error(UNKNOWN); }
      } else {
        attempt = { id: crypto.randomUUID(), version: versionRef.current!, data: JSON.parse(JSON.stringify(nextDatabase)) };
        pending.current = attempt;
      }
      let response: Response;
      let payload: any;
      try {
        response = await fetch('/api/inventory/database', {
          method: 'POST', headers: headers(),
          body: JSON.stringify({ operationId: attempt.id, expectedVersion: attempt.version, data: attempt.data })
        });
        payload = await response.json();
      } catch {
        setUnknownSave(true);
        const snapshot = await read(epoch, attempt.id).catch(() => null);
        if (snapshot && confirmed(snapshot)) { finish(); return; }
        throw new Error(UNKNOWN);
      }
      if (!response.ok || !payload?.success) {
        if (response.status < 500) {
          finish();
          if (response.status === 409) await read(epoch).catch(() => undefined);
          throw new Error(payload?.message || 'رُفض الحفظ؛ احتُفظ بالنموذج للمراجعة.');
        }
      } else if (confirmed(payload)) {
        apply(payload, epoch); finish(); return;
      }
      setUnknownSave(true);
      const snapshot = await read(epoch, attempt.id).catch(() => null);
      if (snapshot && confirmed(snapshot)) { finish(); return; }
      throw new Error(UNKNOWN);
    } finally { inFlight.current = false; setSaving(false); }
  };
  const recover = async () => {
    if (!pending.current) { await refresh(); return; }
    if (inFlight.current) return;
    inFlight.current = true; setLoading(true);
    try {
      const snapshot = await read(generation.current, pending.current.id);
      if (operationMatchesAttempt(snapshot.meta.operation, pending.current)) {
        pending.current = null; setUnknownSave(false);
      } else throw new Error(UNKNOWN);
    } finally { inFlight.current = false; setLoading(false); }
  };
  const retryPending = async () => {
    if (!pending.current) throw new Error('لا توجد عملية معلقة لإعادة المحاولة.');
    await commit(pending.current.data);
  };
  return { database, version, capabilities, isLoading, isSaving, unknownSave, checkedAt, reset, refresh, commit, recover, retryPending };
}
