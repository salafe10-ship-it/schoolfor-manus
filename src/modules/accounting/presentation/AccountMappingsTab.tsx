import React, { useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../../utils/authenticatedRequest';

type MappingRow = {
  key: string;
  label: string;
  source: string;
  required: boolean;
  accountCode: string;
  accountName: string;
  nature: string;
  valid: boolean;
};

export function AccountMappingsTab({
  canWrite,
  triggerNotification
}: {
  canWrite: boolean;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
}) {
  const [rows, setRows] = useState<MappingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [readiness, setReadiness] = useState<{ ready: boolean; schemaReady: boolean; missing: string[]; invalid: string[]; optionalMissing: string[] }>({ ready: false, schemaReady: false, missing: [], invalid: [], optionalMissing: [] });

  const grouped = useMemo(() => rows.reduce<Record<string, MappingRow[]>>((acc, row) => {
    (acc[row.source] ||= []).push(row);
    return acc;
  }, {}), [rows]);

  const load = async () => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await authenticatedRequest('/api/financial/account-mappings', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر قراءة خرائط الحسابات.');
      setRows(Array.isArray(payload.data?.mappings) ? payload.data.mappings : []);
      setReadiness({
        ready: payload.data?.ready === true,
        schemaReady: payload.data?.schemaReady === true,
        missing: Array.isArray(payload.data?.missing) ? payload.data.missing : [],
        invalid: Array.isArray(payload.data?.invalid) ? payload.data.invalid : [],
        optionalMissing: Array.isArray(payload.data?.optionalMissing) ? payload.data.optionalMissing : []
      });
    } catch (error: any) {
      triggerNotification(controller.signal.aborted ? 'انتهت مهلة قراءة خرائط الحسابات؛ أعد الفحص.' : error?.message || 'تعذر قراءة خرائط الحسابات.', 'warning');
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!canWrite) {
      triggerNotification('تحتاج صلاحية الكتابة المالية لاعتماد خرائط الحسابات.', 'warning');
      return;
    }
    const mappings = rows.filter(row => row.accountCode.trim()).map(row => ({ key: row.key, accountCode: row.accountCode.trim() }));
    if (mappings.length === 0) {
      triggerNotification('أدخل حساباً واحداً على الأقل قبل الحفظ.', 'warning');
      return;
    }
    setSaving(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await authenticatedRequest('/api/financial/account-mappings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mappings }), signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر اعتماد خرائط الحسابات.');
      triggerNotification('تم اعتماد خرائط الحسابات دون إنشاء قيود؛ أصبحت جاهزية الترحيل قابلة للفحص.', 'success');
      await load();
    } catch (error: any) {
      triggerNotification(controller.signal.aborted ? 'لم يصل تأكيد اعتماد الخرائط خلال المهلة. أعد الفحص قبل إعادة الحفظ.' : error?.message || 'تعذر اعتماد خرائط الحسابات.', 'warning');
    } finally {
      window.clearTimeout(timeoutId);
      setSaving(false);
    }
  };

  const sourceLabels: Record<string, string> = { fees: 'الرسوم الطلابية', hr: 'الموارد البشرية والرواتب', inventory: 'المخزون والمشتريات', treasury: 'الخزينة والبنوك' };

  return (
    <div className="space-y-5 text-right" dir="rtl">
      <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-slate-950 to-slate-900 p-5 text-white shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black">خرائط الترحيل إلى دفتر الأستاذ</h2>
            <p className="mt-1 text-xs text-slate-300">اربط كل مصدر بحساب فرعي نشط قبل فتح الكتابة المالية. لا ينشئ هذا الإجراء قيداً ولا يغير أرصدة.</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${readiness.ready ? 'border-emerald-300/40 bg-emerald-500/15 text-emerald-200' : 'border-amber-300/40 bg-amber-500/15 text-amber-100'}`}>
            {readiness.ready ? 'الربط مكتمل' : readiness.schemaReady ? 'الربط يحتاج استكمالاً' : 'دفتر الأستاذ غير مهيأ'}
          </span>
        </div>
      </section>

      {loading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">جاري قراءة الخرائط المركزية...</div> : (
        <>
          {!readiness.ready && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900">{[...readiness.missing, ...readiness.invalid].join('، ') || 'أكمل الخرائط ثم أعد الفحص.'}</div>}
          <div className="grid gap-5 lg:grid-cols-2">
            {Object.entries(grouped).map(([source, sourceRows]) => (
              <section key={source} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 border-b border-slate-100 pb-2 text-sm font-black text-slate-900">{sourceLabels[source] || source}</h3>
                <div className="space-y-3">
                  {(sourceRows as MappingRow[]).map(row => (
                    <label key={row.key} className="grid grid-cols-[1fr_9rem] items-center gap-3 text-xs">
                      <span className="font-bold text-slate-700">{row.label}{row.required ? <em className="mr-1 text-rose-500">*</em> : null}<small className="block font-mono text-[10px] text-slate-400">{row.key} • {row.nature}</small></span>
                      <input value={row.accountCode} disabled={!canWrite || saving} onChange={event => setRows(previous => previous.map(item => item.key === row.key ? { ...item, accountCode: event.target.value } : item))} placeholder="رمز الحساب" className={`rounded-lg border px-2 py-2 text-left font-mono text-xs ${row.valid ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-white'}`} />
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => void load()} disabled={loading || saving} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-50">إعادة الفحص</button>
            <button type="button" onClick={() => void save()} disabled={!canWrite || saving || loading} className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-black text-slate-950 shadow disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'جاري الاعتماد...' : 'اعتماد الخرائط'}</button>
          </div>
        </>
      )}
    </div>
  );
}

export default AccountMappingsTab;
