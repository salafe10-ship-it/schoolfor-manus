import React, { useMemo, useState } from 'react';
import { Download, Printer, RefreshCw, Search, ShieldAlert, Sparkles, UserX, Users } from 'lucide-react';

interface ExamsDistributionPanelProps {
  schoolName: string;
  students: any[];
  halls: any[];
  approved: boolean;
  syncing: boolean;
  onAutoDistribute: () => Promise<void>;
  onPersistStudents: (students: any[]) => Promise<boolean>;
  notify: (message: string, type: 'success' | 'warning' | 'info') => void;
}

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const csvCell = (value: unknown): string => {
  const raw = String(value ?? '').replaceAll('"', '""');
  return `"${/^[=+\-@]/.test(raw) ? `'${raw}` : raw}"`;
};

export default function ExamsDistributionPanel({
  schoolName,
  students,
  halls,
  approved,
  syncing,
  onAutoDistribute,
  onPersistStudents,
  notify
}: ExamsDistributionPanelProps) {
  const [search, setSearch] = useState('');
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(student =>
      String(student.name || '').toLowerCase().includes(query)
      || String(student.classroom || '').toLowerCase().includes(query)
      || String(student.nationalId || '').toLowerCase().includes(query)
      || String(student.seatNumber || '').includes(query)
    );
  }, [search, students]);
  const distributedCount = students.filter(student => student.hallId && student.seatNumber).length;
  const totalCapacity = halls.reduce((sum, hall) => sum + Number(hall.capacity || 0), 0);

  const assignHall = async (student: any, hallId: string) => {
    if (approved) {
      notify('النتائج معتمدة ومغلقة ولا يمكن تعديل توزيع الطلاب.', 'warning');
      return;
    }
    if (hallId) {
      const hall = halls.find(item => item.id === hallId);
      const occupancy = students.filter(item => item.hallId === hallId && item.id !== student.id).length;
      if (!hall || occupancy >= Number(hall.capacity || 0)) {
        notify('تعذر التعيين: القاعة غير صالحة أو بلغت سعتها القصوى.', 'warning');
        return;
      }
    }
    const updated = students.map(item => item.id === student.id ? { ...item, hallId: hallId || undefined } : item);
    if (!await onPersistStudents(updated)) {
      notify('تعذر حفظ توزيع الطلاب وأرقام الجلوس في المصدر المركزي.', 'warning');
      return;
    }
    notify(`تم حفظ قاعة الطالب ${student.name} في المصدر المركزي.`, 'success');
  };

  const unassign = async (student: any) => {
    if (approved) return;
    const updated = students.map(item => item.id === student.id ? { ...item, hallId: undefined, seatNumber: undefined } : item);
    if (!await onPersistStudents(updated)) {
      notify('تعذر حفظ توزيع الطلاب وأرقام الجلوس في المصدر المركزي.', 'warning');
      return;
    }
    notify(`تم إلغاء توزيع ${student.name} مع بقائه في قائمة الطلاب الرسمية.`, 'info');
  };

  const exportCsv = () => {
    const rows = students.map(student => [
      student.id,
      student.name,
      student.classroom,
      student.section,
      student.nationalId,
      student.seatNumber || 'غير مولد',
      halls.find(hall => hall.id === student.hallId)?.name || 'غير موزع'
    ]);
    const csv = '\uFEFF' + [['معرف الطالب', 'الاسم', 'الصف', 'الشعبة', 'الهوية', 'رقم الجلوس', 'القاعة'], ...rows]
      .map(row => row.map(csvCell).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exam-student-distribution.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('تم تصدير توزيع الطلاب الفعلي بصيغة CSV.', 'success');
  };

  const printDistribution = () => {
    if (students.length === 0) {
      notify('لا يوجد طلاب لطباعة كشف التوزيع.', 'warning');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notify('يرجى السماح بالنوافذ المنبثقة لفتح الطباعة.', 'warning');
      return;
    }
    const rows = students.map((student, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.classroom)}</td><td>${escapeHtml(student.section)}</td><td>${escapeHtml(student.seatNumber || 'غير مولد')}</td><td>${escapeHtml(halls.find(hall => hall.id === student.hallId)?.name || 'غير موزع')}</td></tr>`).join('');
    printWindow.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>كشف توزيع الطلاب</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#1f2937}h1{font-size:20px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #9ca3af;padding:7px;text-align:right}th{background:#fff8e5}</style></head><body><h1>${escapeHtml(schoolName)} — كشف توزيع طلاب الامتحانات</h1><p>هذا الكشف يعكس البيانات المحفوظة في دورة الامتحانات الحالية.</p><table><thead><tr><th>م</th><th>الطالب</th><th>الصف</th><th>الشعبة</th><th>رقم الجلوس</th><th>القاعة</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <section className="border border-[#d4af37]/40 bg-[#1c120c] p-5 text-amber-50 shadow-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div><span className="text-[10px] font-black text-amber-300">CANONICAL STUDENT DISTRIBUTION</span><h2 className="mt-1 text-lg font-black text-white">توزيع الطلاب الرسميين على اللجان</h2><p className="mt-1 text-xs text-amber-100/60">هوية الطالب للقراءة فقط؛ هذه الشاشة تحفظ رقم الجلوس والقاعة داخل دورة الامتحانات.</p></div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black"><div className="border border-amber-500/30 bg-black/20 px-3 py-2"><span className="block text-amber-100/50">الطلاب</span>{students.length}</div><div className="border border-amber-500/30 bg-black/20 px-3 py-2"><span className="block text-amber-100/50">الموزعون</span>{distributedCount}</div><div className="border border-amber-500/30 bg-black/20 px-3 py-2"><span className="block text-amber-100/50">السعة</span>{totalCapacity}</div></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={approved || syncing || students.length === 0 || halls.length === 0} onClick={() => void onAutoDistribute()} className="flex items-center gap-2 bg-gradient-to-l from-[#f7d174] to-[#9a6a1d] px-4 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="h-4 w-4"/>التوزيع التلقائي وتوليد الجلوس</button><button type="button" onClick={printDistribution} className="flex items-center gap-2 border border-amber-500/30 bg-black/20 px-4 py-2 text-xs font-black text-amber-100"><Printer className="h-4 w-4"/>طباعة الكشف</button><button type="button" onClick={exportCsv} className="flex items-center gap-2 border border-amber-500/30 bg-black/20 px-4 py-2 text-xs font-black text-amber-100"><Download className="h-4 w-4"/>تصدير CSV</button></div>
      </section>

      {students.length > totalCapacity && <div className="flex items-start gap-2 border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-bold text-rose-100"><ShieldAlert className="h-5 w-5 shrink-0 text-rose-300"/>عدد الطلاب يتجاوز السعة المتاحة؛ التوزيع التلقائي محظور حتى إضافة قاعات كافية.</div>}

      <section className="overflow-hidden border border-[#d4af37]/35 bg-[#1c120c] shadow-xl">
        <div className="relative border-b border-[#d4af37]/20 bg-[#2a1d13]/60 p-4">
          <Search className="absolute right-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f7d174]/70"/>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو الصف أو الهوية أو رقم الجلوس"
            className="w-full border border-[#d4af37]/35 bg-[#130b04] py-2.5 pl-3 pr-10 text-xs font-semibold text-amber-50 placeholder:text-amber-100/40 outline-none transition focus:border-[#f7d174]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead><tr className="bg-gradient-to-l from-[#9a6a1d] via-[#c58a22] to-[#8b6113] text-[#fff8d6]"><th className="p-3 text-right">الطالب الرسمي</th><th className="p-3 text-right">الصف والشعبة</th><th className="p-3 text-right">رقم الجلوس</th><th className="p-3 text-right">القاعة</th><th className="p-3 text-center">إجراء</th></tr></thead>
            <tbody>
              {filteredStudents.map(student => <tr key={student.id} className="border-b border-[#d4af37]/15 text-amber-50 transition hover:bg-[#2a1d13]/70"><td className="p-3"><b className="block text-[#fce79a]">{student.name}</b><span className="text-[10px] text-amber-100/45">{student.nationalId || student.id}</span></td><td className="p-3 font-semibold text-amber-100/80">{student.classroom} — {student.section}</td><td className="p-3 font-mono font-black text-[#f7d174]">{student.seatNumber || 'غير مولد'}</td><td className="p-3"><select value={student.hallId || ''} disabled={approved || syncing || halls.length === 0} onChange={event => void assignHall(student, event.target.value)} className="min-w-40 border border-[#d4af37]/35 bg-[#130b04] p-2 text-xs font-bold text-amber-50 outline-none disabled:opacity-50"><option value="">غير موزع</option>{halls.map(hall => <option key={hall.id} value={hall.id}>{hall.name}</option>)}</select></td><td className="p-3 text-center"><button type="button" disabled={approved || syncing || (!student.hallId && !student.seatNumber)} onClick={() => void unassign(student)} title="إلغاء التوزيع مع إبقاء الطالب الرسمي" className="inline-flex items-center gap-1 border border-rose-500/40 bg-rose-950/40 px-2 py-1 text-[10px] font-black text-rose-200 transition hover:bg-rose-900/60 disabled:opacity-30"><UserX className="h-3.5 w-3.5"/>إلغاء التوزيع</button></td></tr>)}
            </tbody>
          </table>
          {filteredStudents.length === 0 && <div className="py-14 text-center text-xs font-semibold text-amber-100/50"><Users className="mx-auto mb-2 h-8 w-8 text-[#d4af37]/40"/>لا توجد نتائج مطابقة.</div>}
        </div>
      </section>
      <div className="flex items-center gap-2 border border-[#d4af37]/20 bg-[#130b04] px-3 py-2 text-[10px] font-semibold text-amber-100/55"><RefreshCw className="h-3.5 w-3.5 text-[#f7d174]/70"/>تُقرأ هوية الطالب من المصدر الرسمي ولا يمكن إنشاؤها أو تعديلها أو حذفها من وحدة الامتحانات.</div>
    </div>
  );
}
