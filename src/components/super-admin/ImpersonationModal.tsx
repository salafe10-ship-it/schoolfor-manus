import React, { useState } from 'react';
import { ShieldAlert, Key, X, CheckCircle2, Lock, AlertTriangle, FileText } from 'lucide-react';

interface ImpersonationModalProps {
  isOpen: boolean;
  school: any | null;
  onClose: () => void;
  onConfirm: (school: any, fullReason: string) => void;
}

const PRESET_REASONS = [
  '🛠️ دعم فني وحل مشكلة تشغيلية في البوابة',
  '⚙️ مراجعة وتعديل إعدادات الرخصة والنطاق',
  '🎓 تدريب ومساعدة كادر المدرسة الإداري',
  '📊 مراجعة وتدقيق الحسابات والترحيل المالي',
  '📝 سبب آخر (يرجى توضيحه في الملاحظات)'
];

export default function ImpersonationModal({
  isOpen,
  school,
  onClose,
  onConfirm
}: ImpersonationModalProps) {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(false);

  if (!isOpen || !school) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    const fullReason = `${selectedReason}${notes ? ` - تفاصيل: ${notes}` : ''}`;
    onConfirm(school, fullReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border-b border-rose-900/40 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Key className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>الدخول بوضع المشرف المؤقت</span>
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-bold">
                  SuperAdmin Only
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                جلسة دعم فني وإشراف مركزي لمستأجر: <strong className="text-white">{school.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-950 p-2 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Security Notice */}
          <div className="bg-rose-950/30 border border-rose-900/50 p-3.5 flex items-start gap-2.5 text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-slate-300 leading-relaxed space-y-1">
              <p className="font-bold text-rose-200">سجل تدقيق أمني مباشر (Enterprise Audit Trail):</p>
              <p className="text-slate-400 text-[10px]">
                سيتم تتبع هذه الجلسة وتسجيل هويتك، عنوان IP، الوقت، وسبب الدخول في سجلاّت الأمان المركزية للمنصة.
              </p>
            </div>
          </div>

          {/* School Summary */}
          <div className="bg-slate-950 p-3 border border-slate-850 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">رمز المستأجر والنطاق:</span>
              <span className="font-mono text-amber-400 font-bold" dir="ltr">
                {school.subdomain}.erpcloud.com
              </span>
            </div>
            <div className="text-left">
              <span className="text-slate-500 text-[10px] block">حالة الخدمة:</span>
              <span className="text-emerald-400 font-bold text-[10px]">نشط وجاهز</span>
            </div>
          </div>

          {/* Preset Reason Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">
              سبب الدخول المباشر <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-sans"
            >
              {PRESET_REASONS.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Detailed Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">
              تفاصيل وملاحظات التذكرة / المشكلة
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب تفاصيل الدعم الفني، رقم التذكرة، أو اسم الإداري الذي طلب المساعدة..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 p-2.5 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-sans"
            />
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-2 bg-slate-950/60 border border-slate-800 p-3 cursor-pointer hover:bg-slate-950 transition-colors">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
            />
            <span className="text-[10px] text-slate-300 leading-normal font-bold">
              أقر بصفتي مسؤول نظام أعلى (Super Administrator) بأن هذه الجلسة مخصصة لغرض العمل والتأكد من جودة التشغيل فقط، وأتحمل المسؤولية عن أي تغييرات تتم خلال وضع المحاكاة.
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء الأمر
            </button>
            <button
              type="submit"
              disabled={!agreed}
              className={`px-5 py-2.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                agreed
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>تأكيد وبدء جلسة المحاكاة</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
