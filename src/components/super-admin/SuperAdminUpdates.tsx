import { AlertCircle, ArrowUpCircle, CheckCircle2, Code, Download, FileText, GitBranch, History as HistoryIcon, RefreshCw, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
interface SuperAdminUpdatesProps {
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminUpdates({
  logAction,
  triggerNotification
}: SuperAdminUpdatesProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'stable' | 'beta'>('stable');

  // Releases Data
  const [releases, setReleases] = useState<any[]>(() => {
    const saved = localStorage.getItem('edupro_releases_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const handleTriggerDeploy = () => {
    triggerNotification('خدمة النشر المركزية غير متاحة؛ لم يتم نشر إصدار أو تسجيل نجاح وهمي.', 'warning');
  };

  const handleRollback = (ver: string) => {
    const confirm = window.confirm(`هل أنت متأكد من رغبتك في عمل تراجع (Rollback) للمنظومة بالكامل للإصدار ${ver}؟ قد تسبب هذه العملية إعادة ترحيل مؤقتة لجداول التخزين.`);
    if (!confirm) return;

    triggerNotification(`التراجع للإصدار ${ver} يحتاج خدمة نشر مركزية وموافقة تغيير؛ لم يتم تعديل حالة الإصدار.`, 'warning');
  };

  return (
    <div id="super-admin-updates" className="space-y-6 text-right">
      
      {/* Upper Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Active Deployment Form */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-xs font-black text-white flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <GitBranch className="w-4 h-4 text-amber-400" />
            نشر التحديثات البرمجية الفورية (Live Deploy)
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">اختر قناة النشر المعتمدة (Deployment Channel)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel('stable')}
                  className={`p-3 border text-center transition-all flex flex-col justify-between items-center ${
                    selectedChannel === 'stable' 
                      ? 'border-amber-500 bg-amber-950/20 text-amber-400' 
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-black">stable</span>
                  <span className="text-[9px] mt-1">كافة المدارس والفروع</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChannel('beta')}
                  className={`p-3 border text-center transition-all flex flex-col justify-between items-center ${
                    selectedChannel === 'beta' 
                      ? 'border-amber-500 bg-amber-950/20 text-amber-400' 
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-black">beta / alpha</span>
                  <span className="text-[9px] mt-1">مدارس تجريبية محددة</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 border border-slate-850 space-y-2">
              <h4 className="text-[10px] font-black text-slate-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                تفاصيل حزمة الترقية الفورية
              </h4>
              <ul className="text-[9px] text-slate-400 space-y-1 list-disc list-inside">
                <li>الترقية لقاعدة البيانات: Automatic Schema Migration</li>
                <li>تحديث المكونات: React Dynamic Bundle updates</li>
                <li>زمن التوقف المتوقع (Downtime): صفر ثانية ⚡</li>
              </ul>
            </div>

            <button
              onClick={handleTriggerDeploy}
              disabled={isDeploying}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black py-3 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isDeploying && 'animate-spin'}`} />
              <span>{isDeploying ? 'جاري نشر التحديث وتدقيق السجلات...' : 'نشر وترقية فروع المنظومة الآن 🚀'}</span>
            </button>
          </div>
        </div>

        {/* Releases Log & Rollback Center */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 overflow-hidden flex flex-col shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <HistoryIcon className="w-4 h-4 text-amber-400" />
              أرشيف سجل التحديثات وخطة التراجع (Rollback Center)
            </h3>
            <span className="text-[9px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-mono">
              3 إصدارات محفوظة
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[350px]">
            <div className="p-4 space-y-3">
              {releases.map((rel, index) => {
                const isActive = rel.status === 'active';
                return (
                  <div key={rel.version} className={`p-4 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                    isActive 
                      ? 'bg-slate-950 border-amber-900' 
                      : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950'
                  }`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          {rel.version}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          rel.channel === 'stable' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {rel.channel}
                        </span>
                        {isActive && (
                          <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900 px-2 py-0.5 rounded-full font-black animate-pulse">
                            النسخة النشطة حياً
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 font-semibold">{rel.desc}</p>
                      <div className="flex items-center gap-4 text-[9px] text-slate-500 font-mono">
                        <span>التاريخ: {rel.date}</span>
                        <span>بواسطة: {rel.author}</span>
                      </div>
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => handleRollback(rel.version)}
                        className="bg-rose-950/30 hover:bg-rose-950 text-rose-400 hover:text-rose-300 text-[10px] font-black px-3 py-1.5 rounded-lg border border-rose-900/40 transition-all cursor-pointer whitespace-nowrap"
                      >
                        تراجع تكتيكي (Rollback)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
