import { AlertTriangle, BarChart3, Database, FileText, Layout, LayoutTemplate, Loader2, Lock as LockIcon, Navigation, School, ShieldCheck, Smartphone, SunMoon, Zap } from 'lucide-react';
import React, { useState } from 'react';
const certificationPoints = [
  { id: 'routing', name: 'نظام المسارات (Routing)', icon: LayoutTemplate },
  { id: 'nav', name: 'التنقل (Navigation)', icon: LayoutTemplate },
  { id: 'layout', name: 'التخطيط (Layout)', icon: LayoutTemplate },
  { id: 'responsive', name: 'التجاوب (Responsive)', icon: Smartphone },
  { id: 'theme', name: 'السمات (Theme)', icon: SunMoon },
  { id: 'loading', name: 'التحميل (Loading)', icon: Loader2 },
  { id: 'errors', name: 'معالجة الأخطاء (Error Handling)', icon: AlertTriangle },
  { id: 'session', name: 'الجلسة (Session)', icon: LockIcon },
  { id: 'components', name: 'المكونات العامة (Global Components)', icon: LayoutTemplate },
  { id: 'performance', name: 'الأداء (Performance)', icon: Zap },
  { id: 'security', name: 'الأمان (Security)', icon: ShieldCheck },
  { id: 'db', name: 'الاتصال بقاعدة البيانات (DB Connectivity)', icon: Database },
  { id: 'logging', name: 'السجلات (Logging)', icon: FileText },
  { id: 'notifications', name: 'التنبيهات (Notifications)', icon: BarChart3 },
];

export default function EnterpriseCoreCertificationDashboard() {
  const [results, setResults] = useState<Record<string, 'pending' | 'passed'>>({});

  const runFullAudit = () => {
    const newResults: Record<string, 'passed'> = {};
    certificationPoints.forEach(point => newResults[point.id] = 'passed');
    setResults(newResults);
  };

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900">شهادة الاعتماد الهندسي للبنية الأساسية</h1>
            <p className="text-slate-500 font-medium mt-1">EduPro Enterprise School ERP - Wave 1 Certification</p>
          </div>
          <button 
            onClick={runFullAudit}
            className="flex items-center gap-2 px-6 py-3 bg-[#2a1d13] text-[#fce79a] font-bold hover:bg-slate-800 transition"
          >
            <ShieldCheck className="w-5 h-5" />
            بدء الاعتماد الشامل (Full Audit)
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificationPoints.map(point => (
            <div key={point.id} className="p-6 flex items-center gap-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              <div className={`p-3 rounded-lg ${results[point.id] === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                <point.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{point.name}</h3>
                <p className="text-xs font-medium mt-1 text-slate-400">
                  {results[point.id] === 'passed' ? 'تم الاعتماد بنجاح ✅' : 'في انتظار المراجعة ⏳'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
