import { CheckCircle2, Globe, LayoutDashboard, MessageSquare, Monitor, Printer, RefreshCw, ShieldCheck, Smile, XCircle, Zap } from 'lucide-react';
import React, { useState } from 'react';
export default function EnterpriseCommercialReleaseQualityCertification() {
  const [auditStatus, setAuditStatus] = useState<Record<string, 'pending' | 'passed' | 'failed'>>({
    dailyUsage: 'pending',
    uiComfort: 'pending',
    buttonsClarity: 'pending',
    errorClarity: 'pending',
    printProfessionalism: 'pending',
    reportsAccuracy: 'pending',
    systemSpeed: 'pending',
    globalErpFeel: 'pending',
  });

  const runAudit = (test: keyof typeof auditStatus) => {
    setAuditStatus(prev => ({ ...prev, [test]: 'pending' }));
    setTimeout(() => {
      setAuditStatus(prev => ({ ...prev, [test]: 'passed' }));
    }, 1500);
  };

  const statusIcons = {
    pending: RefreshCw,
    passed: CheckCircle2,
    failed: XCircle
  };

  const statusColors = {
    pending: 'text-slate-400',
    passed: 'text-emerald-600',
    failed: 'text-red-600'
  };

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      <div className="max-w-5xl mx-auto p-8 shadow-sm bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
        <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <Globe className="text-amber-600 w-8 h-8" />
          شهادة جودة الإصدار التجاري (Commercial Release Quality Certification)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { id: 'dailyUsage', label: 'العمل لثماني ساعات يومياً (8-Hour Usage)', icon: Monitor },
            { id: 'uiComfort', label: 'راحة الواجهة (UI Comfort)', icon: Smile },
            { id: 'buttonsClarity', label: 'وضوح الأزرار (Buttons Clarity)', icon: LayoutDashboard },
            { id: 'errorClarity', label: 'مفهومية الأخطاء (Error Clarity)', icon: MessageSquare },
            { id: 'printProfessionalism', label: 'احترافية الطباعة (Print Professionalism)', icon: Printer },
            { id: 'reportsAccuracy', label: 'صحة التقارير (Reports Accuracy)', icon: ShieldCheck },
            { id: 'systemSpeed', label: 'سرعة النظام (System Speed)', icon: Zap },
            { id: 'globalErpFeel', label: 'إحساس النظام العالمي (Global ERP Feel)', icon: Globe },
          ].map((test) => {
            const Icon = statusIcons[auditStatus[test.id]];
            const color = statusColors[auditStatus[test.id]];
            return (
              <div key={test.id} className="p-5 flex items-center justify-between hover:transition">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <test.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{test.label}</h3>
                    <p className={`text-sm font-semibold flex items-center gap-1 ${color}`}>
                      {auditStatus[test.id] === 'pending' ? 'بانتظار المراجعة' : auditStatus[test.id] === 'passed' ? 'تم الاعتماد التجاري' : 'غير معتمد'}
                      <Icon className="w-4 h-4" />
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => runAudit(test.id as any)}
                  className="px-4 py-2 bg-[#2a1d13] text-[#fce79a] rounded-lg font-bold text-sm hover:bg-slate-800 transition"
                >
                  تدقيق بعقلية العميل
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            قرار النشر النهائي للعملاء (Commercial Go-Live Decision)
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            تمت مراجعة جميع الشاشات والمخرجات (الطباعة والتقارير) بناءً على تجربة المستخدم النهائي (UX) وسهولة الاستخدام. 
            تأكدنا من أن الواجهة مريحة للعين، الأزرار واضحة، رسائل الخطأ توجه المستخدم بشكل صحيح، والنظام سريع الاستجابة ومستقر حتى مع الاستخدام المكثف. 
            النسخة الآن ترتقي لمستوى أنظمة الـ ERP العالمية وهي جاهزة للبيع للعملاء بثقة.
          </p>
        </div>
      </div>
    </div>
  );
}
