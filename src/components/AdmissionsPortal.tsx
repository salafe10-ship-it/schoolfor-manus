import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Filter, Loader2, RefreshCw, Search, ShieldCheck, UserPlus, XCircle } from 'lucide-react';
import type { Branch, School, UserRole } from '../types';

type AdmissionStatus = 'INQUIRY' | 'VERIFIED' | 'FEE_PAID' | 'ENROLLED' | 'REJECTED';

type AdmissionInquiry = {
  id: string;
  studentName: string;
  dateOfBirth: string;
  status: AdmissionStatus;
  createdAt: string;
};

type AdmissionsResponse = {
  success: boolean;
  data?: AdmissionInquiry[];
  meta?: { page: number; limit: number; totalCount: number; totalPages: number };
  message?: string;
};

interface AdmissionsPortalProps {
  selectedSchool: School;
  selectedBranch: Branch | null;
  currentRole: UserRole;
  onExit?: () => void;
  triggerNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const STATUS_LABELS: Record<AdmissionStatus, string> = {
  INQUIRY: 'استفسار جديد',
  VERIFIED: 'تم التحقق',
  FEE_PAID: 'تم دفع الرسوم',
  ENROLLED: 'تم التسجيل',
  REJECTED: 'مرفوض'
};

const STATUS_STYLES: Record<AdmissionStatus, string> = {
  INQUIRY: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900',
  VERIFIED: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900',
  FEE_PAID: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900',
  ENROLLED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900'
};

const NEXT_STATUSES: Record<AdmissionStatus, AdmissionStatus[]> = {
  INQUIRY: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['FEE_PAID', 'REJECTED'],
  FEE_PAID: ['ENROLLED', 'REJECTED'],
  ENROLLED: [],
  REJECTED: []
};

function token(): string | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem('edupro_token') || window.sessionStorage.getItem('edupro_token');
  return value?.trim() || null;
}

async function responseMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { message?: string; error?: string };
    return payload.message || payload.error || `تعذر إكمال الطلب (${response.status}).`;
  } catch {
    return `تعذر إكمال الطلب (${response.status}).`;
  }
}

export default function AdmissionsPortal({
  selectedSchool,
  selectedBranch,
  currentRole,
  onExit,
  triggerNotification
}: AdmissionsPortalProps) {
  const [inquiries, setInquiries] = useState<AdmissionInquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState<AdmissionStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const canWrite = useMemo(() => {
    const role = String(currentRole).toLowerCase();
    return role === 'schooladmin' || role === 'superadmin';
  }, [currentRole]);

  const loadInquiries = useCallback(async (signal?: AbortSignal) => {
    const accessToken = token();
    if (!accessToken) {
      setError('لا توجد جلسة موثوقة. يرجى تسجيل الدخول من جديد.');
      setLoading(false);
      return;
    }
    if (!selectedBranch?.id) {
      setError('لا يوجد فرع موثوق مرتبط بالجلسة الحالية.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const response = await fetch(`/api/admissions/inquiries?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      const payload = await response.json() as AdmissionsResponse;
      if (payload.success !== true || !Array.isArray(payload.data)) throw new Error('استجابة صندوق القبول غير صالحة.');
      setInquiries(payload.data);
      setTotalCount(payload.meta?.totalCount || 0);
      setTotalPages(payload.meta?.totalPages || 0);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError(caught instanceof Error ? caught.message : 'تعذر تحميل صندوق القبول.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, pageSize, selectedBranch?.id, statusFilter, retryKey, searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    void loadInquiries(controller.signal);
    return () => controller.abort();
  }, [loadInquiries]);

  const visibleInquiries = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return inquiries;
    return inquiries.filter((item) => item.studentName.toLowerCase().includes(normalized) || item.id.toLowerCase().includes(normalized));
  }, [inquiries, searchTerm]);

  const transition = async (inquiry: AdmissionInquiry, nextStatus: AdmissionStatus) => {
    const confirmation = window.confirm(`تأكيد نقل ملف ${inquiry.studentName} إلى حالة «${STATUS_LABELS[nextStatus]}»؟`);
    if (!confirmation) return;
    const accessToken = token();
    if (!accessToken) {
      setError('انتهت الجلسة الموثوقة. يرجى تسجيل الدخول من جديد.');
      return;
    }
    setTransitioningId(inquiry.id);
    setError(null);
    try {
      const response = await fetch(`/api/admissions/inquiries/${encodeURIComponent(inquiry.id)}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      const payload = await response.json() as { success?: boolean; data?: AdmissionInquiry };
      if (!payload.success || !payload.data) throw new Error('استجابة تحديث الحالة غير صالحة.');
      setInquiries((current) => current.map((item) => item.id === inquiry.id ? payload.data! : item));
      triggerNotification?.('تم تحديث حالة ملف القبول وتسجيل العملية في سجل التدقيق.', 'success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'تعذر تحديث حالة القبول.');
      triggerNotification?.('تعذر تحديث حالة القبول.', 'error');
    } finally {
      setTransitioningId(null);
    }
  };

  return (
    <section dir="rtl" className="min-h-[70vh] w-full space-y-5 rounded-2xl bg-slate-50 p-4 text-right dark:bg-slate-950 sm:p-6">
      <header className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-indigo-900/60 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 dark:border-indigo-800 dark:bg-indigo-950/40">Admissions Inbox</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">Trusted Scope</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">صندوق القبول والتسجيل</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إدارة الاستفسارات من الطلب الأولي حتى التسجيل، ضمن المدرسة والفرع الموثوقين فقط.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800">المدرسة: <strong>{selectedSchool.name}</strong></span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800">الفرع: <strong>{selectedBranch?.name || 'غير محدد'}</strong></span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> عزل tenant/school/branch فعال</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" aria-label="إعادة تحميل">
              <RefreshCw className="h-4 w-4" /> تحديث
            </button>
            {onExit && <button type="button" onClick={onExit} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900">خروج</button>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="text-xs text-slate-500">إجمالي النتائج</div><div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalCount}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="text-xs text-slate-500">الصفحة الحالية</div><div className="mt-1 text-2xl font-black text-indigo-600">{page}<span className="text-sm text-slate-400"> / {Math.max(totalPages, 1)}</span></div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="text-xs text-slate-500">صلاحية التعديل</div><div className="mt-1 text-sm font-black text-emerald-600">{canWrite ? 'متاحة وفق الدور' : 'قراءة فقط'}</div></div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center">
        <label className="relative flex-1"><Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="بحث باسم الطالب أو رقم الملف" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="ابحث باسم الطالب أو رقم الملف..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-950" /></label>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"><Filter className="h-4 w-4 text-indigo-500" /><select aria-label="فلترة حسب الحالة" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as AdmissionStatus | 'ALL'); setPage(1); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="ALL">كل الحالات</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>

      {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span></div><button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-3 py-2 text-xs font-bold text-white hover:bg-rose-800"><RefreshCw className="h-3.5 w-3.5" /> إعادة المحاولة</button></div>}

      {loading ? <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3 text-sm font-bold text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> جاري تحميل صندوق القبول...</div></div> : visibleInquiries.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900"><UserPlus className="h-10 w-10 text-slate-300" /><h2 className="mt-3 text-base font-black text-slate-800 dark:text-white">لا توجد استفسارات ضمن النطاق الحالي</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">جرّب تغيير الفلتر أو أعد التحميل بعد وصول طلب جديد.</p></div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="overflow-x-auto"><table className="min-w-full text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"><tr><th className="px-4 py-3 font-bold">الطالب</th><th className="px-4 py-3 font-bold">تاريخ الميلاد</th><th className="px-4 py-3 font-bold">الحالة</th><th className="px-4 py-3 font-bold">تاريخ الإنشاء</th><th className="px-4 py-3 font-bold">الإجراء التالي</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{visibleInquiries.map((inquiry) => <tr key={inquiry.id} className="transition hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"><td className="px-4 py-4"><div className="font-black text-slate-900 dark:text-white">{inquiry.studentName}</div><div className="mt-1 font-mono text-[10px] text-slate-400">{inquiry.id}</div></td><td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">{inquiry.dateOfBirth}</td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[inquiry.status]}`}>{inquiry.status === 'ENROLLED' ? <CheckCircle2 className="h-3.5 w-3.5" /> : inquiry.status === 'REJECTED' ? <XCircle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}{STATUS_LABELS[inquiry.status]}</span></td><td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">{new Date(inquiry.createdAt).toLocaleString('ar-SA')}</td><td className="px-4 py-4">{canWrite && NEXT_STATUSES[inquiry.status].length > 0 ? <div className="flex flex-wrap gap-2">{NEXT_STATUSES[inquiry.status].map((nextStatus) => <button key={nextStatus} type="button" disabled={transitioningId === inquiry.id} onClick={() => void transition(inquiry, nextStatus)} aria-label={`نقل ${inquiry.studentName} إلى ${STATUS_LABELS[nextStatus]}`} className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300">{transitioningId === inquiry.id ? <Loader2 className="inline h-3 w-3 animate-spin" /> : STATUS_LABELS[nextStatus]}</button>)}</div> : <span className="text-xs text-slate-400">لا توجد خطوة متاحة</span>}</td></tr>)}</tbody></table></div></div>}

      <footer className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex-row"><span>عرض {visibleInquiries.length} من {totalCount} ملفًا</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"><ChevronRight className="h-4 w-4" /> السابق</button><span className="rounded-lg bg-slate-100 px-3 py-2 font-black dark:bg-slate-800">{page}</span><button type="button" disabled={totalPages === 0 || page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700">التالي <ChevronLeft className="h-4 w-4" /></button></div></footer>
    </section>
  );
}
