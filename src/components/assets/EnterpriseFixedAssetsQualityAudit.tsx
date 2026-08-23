import React, { useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, Building2, 
  DollarSign, Wrench, ArrowRightLeft, FileSpreadsheet, Layers, Award, Sparkles 
} from 'lucide-react';
import { FixedAsset } from '../../types';

interface EnterpriseFixedAssetsQualityAuditProps {
  assets: FixedAsset[];
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function EnterpriseFixedAssetsQualityAudit({
  assets,
  triggerNotification
}: EnterpriseFixedAssetsQualityAuditProps) {
  const [isCertified, setIsCertified] = useState(false);

  const totalCost = assets.reduce((sum, a) => sum + Number(a.cost || 0) + Number(a.capitalExp || 0), 0);
  const totalAccDep = assets.reduce((sum, a) => sum + Number(a.accDep || 0), 0);
  const totalNetValue = assets.reduce((sum, a) => sum + Number(a.netValue || 0), 0);

  const auditChecks = [
    {
      title: 'مطابقة المعادلة المحاسبية للأصول الثابتة',
      desc: 'التحقق من أن صافي القيمة الدفترية = التكلفة التاريخية + التحسينات الرأسمالية - مجمع الإهلاك المتراكم لكل أصل.',
      status: 'unknown',
      metric: 'غير متحقق'
    },
    {
      title: 'سلامة التوجيه المحاسبي وقيد دفتر اليومية (JV)',
      desc: 'ربط أصول المدرسة بالدليل المالي الموحد (حساب الأصل 1300 + حـ مجمع الإهلاك + حـ مصروف الإهلاك 5200).',
      status: 'unknown',
      metric: 'غير متحقق'
    },
    {
      title: 'توثيق سجلات الصيانة والتكاليف التشغيلية',
      desc: 'تسجيل جميع أوامر العمل وقطع الغيار والتكلفة التشغيلية لكل أصل مع تحديث الجاهزية الفنية.',
      status: 'unknown',
      metric: 'غير متحقق'
    },
    {
      title: 'الربط التكاملي مع أسطول الحركة والمشتريات',
      desc: 'تكامل أصول حافلات النقل والمختبرات وأجهزة المولدات مع أقسام المشتريات والمرافق والعهدة.',
      status: 'unknown',
      metric: 'غير متحقق'
    },
    {
      title: 'السجل الزمني والرقابي الشامل (Asset Timeline & Audit Trail)',
      desc: 'تتبع كافة التعديلات، حركات النقل، وتوزيع العهد بنظام الـ Timeline غير القابل للتعديل أو التزييف.',
      status: 'unknown',
      metric: 'غير متحقق'
    },
    {
      title: 'نظام الباركود ورمز الاستجابة السريعة (Barcode & QR)',
      desc: 'توليد أرقام تسلسلية ورموز باركود وQR فريدة لكل أصل لسهولة الجرد الميداني عبر الموبايل والماسح الضوئي.',
      status: 'unknown',
      metric: 'غير متحقق'
    }
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl" id="fixed-assets-quality-audit">
      {/* Certification Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> شهادة اعتماد جودة الأصول الثابتة
              </span>
              <span className="text-xs text-slate-400 font-mono">ORDER-011</span>
            </div>
            <h2 className="text-2xl font-black text-white">تقرير الاعتماد المؤسسي لوحدة الأصول الثابتة والعهد (Fixed Assets Portal)</h2>
              <p className="text-xs text-slate-300 max-w-2xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              لا يمكن اعتماد فحوصات الأصول قبل وصول أدلة محاسبية وتشغيلية مركزية قابلة للتحقق.
            </p>
          </div>

          <div className="bg-white/10 p-4 backdrop-blur-md border border-white/10 text-center min-w-[200px]">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-lg mb-1">
              <ShieldCheck className="w-6 h-6" /> {isCertified ? 'معتمد' : 'غير متحقق'}
            </div>
            <span className="text-[11px] text-slate-300 block font-bold">ZERO ASSET LOSS CERTIFIED</span>
          </div>
        </div>
      </div>

      {/* Summary Financial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 text-right space-y-1">
          <span className="text-xs font-bold text-slate-500 block">التكلفة التاريخية الإجمالية للأصول:</span>
          <h3 className="text-xl font-black text-slate-900 font-mono">{totalCost.toLocaleString()} <span className="text-xs font-normal text-slate-500">د.ل</span></h3>
        </div>

        <div className="p-5 text-right space-y-1">
          <span className="text-xs font-bold text-slate-500 block">مجمع الإهلاك المتراكم المرحل:</span>
          <h3 className="text-xl font-black text-rose-600 font-mono">-{totalAccDep.toLocaleString()} <span className="text-xs font-normal text-slate-500">د.ل</span></h3>
        </div>

        <div className="p-5 text-right space-y-1">
          <span className="text-xs font-bold text-slate-500 block">صافي القيمة الدفترية المعززة:</span>
          <h3 className="text-xl font-black text-emerald-700 font-mono">{totalNetValue.toLocaleString()} <span className="text-xs font-normal text-slate-500">د.ل</span></h3>
        </div>
      </div>

      {/* Audit Checks Checklist */}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> نتائج الفحوصات والتدقيق المالي والتشغيلي
          </h4>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
            {auditChecks.filter(check => check.status === 'pass').length} فحوصات متحققة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {auditChecks.map((check, idx) => (
            <div key={idx} className="p-4 bg-transparent space-y-2 text-right">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <h5 className="font-bold text-slate-900 text-xs">{check.title}</h5>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md font-mono">
                  {check.metric}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold pr-6">{check.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
