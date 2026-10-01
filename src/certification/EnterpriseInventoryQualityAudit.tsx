import React from 'react';
import { AlertTriangle, CheckCircle2, Database, FileText, Lock as LockIcon, Zap } from 'lucide-react';

const checks = [
  { label: 'قراءة اللقطة المركزية لهذه المدرسة', icon: Database },
  { label: 'دليل تدقيق التقارير والطباعة', icon: FileText },
  { label: 'اختبار عزل المدرسة وقفل السجلات المعتمدة', icon: LockIcon },
  { label: 'اختبار الضغط في بيئة مماثلة للإنتاج', icon: Zap },
] as const;

export default function EnterpriseInventoryQualityAudit({ checkedAt = null, version = null, schoolName = '' }: {
  checkedAt?: string | null; version?: number | null; schoolName?: string;
}) {
  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] p-2 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-[#fffefc] border-2 border-[#d4af37]/30 rounded-3xl p-5 sm:p-8 shadow-md">
        <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2">
          <FileText className="text-amber-700" /> تقرير جاهزية وحدة المخزون
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          هذه قائمة أدلة تشغيل وليست شهادة تلقائية. الاعتماد النهائي مرتبط بنتائج الاختبارات الآلية والمراجعة الحية الموثقة.
        </p>
        <p className="text-sm mb-4">المدرسة: {schoolName || 'غير محددة'} | إصدار اللقطة: {version ?? 'غير متاح'} | وقت القراءة: {checkedAt || 'لم تنجح قراءة موثقة'}</p>
        <div className="space-y-3">
          {checks.map(({ label, icon: Icon }, index) => (
            <div key={label} className="flex items-center justify-between gap-4 p-4 border border-slate-200 bg-white/60">
              <div className="flex items-center gap-3"><Icon className="text-slate-500" /><span className="font-bold text-slate-700">{label}</span></div>
              <span className="px-3 py-1 text-xs font-black bg-amber-100 text-amber-900">
                <AlertTriangle className="inline w-4 h-4 ml-1" />{index === 0 && checkedAt ? 'قراءة ناجحة فقط — ليست شهادة جاهزية' : 'غير مفحوص — يلزم دليل موثق'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
