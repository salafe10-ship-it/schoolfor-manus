import React from 'react';
import { AlertTriangle, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import EnterpriseActionToolbar from '../components/shared/EnterpriseActionToolbar';

const groups = [
  {
    category: 'دورة الشراء الموثقة',
    tests: [
      ['طلبات الشراء والاعتماد', 'verified', 'حفظ مركزي وتسلسل حالة موثق'],
      ['العروض والترسية وأوامر الشراء', 'verified', 'الترسية مرتبطة بمورد وعرض ومستودع حقيقي'],
      ['الفحص وإذن الاستلام', 'verified', 'الكميات المقبولة فقط تحدّث رصيد الصنف'],
      ['فواتير الموردين', 'verified', 'تُنشأ من إذن استلام موثق بحالة انتظار المطابقة'],
    ],
  },
  {
    category: 'الرقابة والتكامل',
    tests: [
      ['سجل التدقيق وعزل المدارس', 'verified', 'السياق الموثوق من الخادم مع سجل تغيير مركزي'],
      ['قفل المستندات المعتمدة', 'verified', 'الخادم يمنع تعديل المستندات المقفلة'],
      ['القيد المحاسبي للاستلام', 'blocked', 'لا يُدّعى إنشاء قيد؛ ينتظر دفتر الأستاذ القانوني'],
      ['دفع المورد من الخزينة/البنك', 'blocked', 'الزر محجوب حتى التكامل المالي القانوني'],
    ],
  },
] as const;

export default function EnterpriseProcurementQualityAudit() {
  return (
    <div className="space-y-6 w-full text-right" dir="rtl" id="procurement-quality-audit">
      <EnterpriseActionToolbar title="تقرير جاهزية وحدة المشتريات والتوريدات" onPrint={() => window.print()} />
      <div className="p-6 bg-slate-900 text-white border border-slate-800">
        <h2 className="text-2xl font-black flex items-center gap-2"><FileText className="text-amber-400" /> حالة الإغلاق المبنية على الأدلة</h2>
        <p className="text-slate-300 text-sm mt-2">لا تمنح هذه الشاشة نسبة نجاح أو شهادة آلية؛ تعرض ما تم التحقق منه وما حُجب بأمان لحين اكتمال التكامل المالي.</p>
      </div>
      {groups.map(group => (
        <div key={group.category} className="p-6 space-y-4">
          <h3 className="font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-600" />{group.category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.tests.map(([name, state, details]) => (
              <div key={name} className="p-4 border border-slate-200 bg-white/60">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  {state === 'verified' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}{name}
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">{details}</p>
                <span className={`inline-block mt-2 px-2.5 py-0.5 font-bold text-[10px] ${state === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                  {state === 'verified' ? 'متحقق بالدليل' : 'محجوب بأمان'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
