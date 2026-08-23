import { AlertCircle, BarChart3, Bell, CheckCircle, Filter, Mail, MessageSquare, Send, ShieldAlert, Users, Volume2 } from 'lucide-react';
import React, { useState } from 'react';
interface SuperAdminCentralNotificationsProps {
  schools: any[];
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminCentralNotifications({
  schools = [],
  logAction,
  triggerNotification
}: SuperAdminCentralNotificationsProps) {
  const [targetAudience, setTargetAudience] = useState('all');
  const [targetSchoolId, setTargetSchoolId] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [notificationChannel, setNotificationChannel] = useState<'all' | 'in_app' | 'email' | 'sms'>('all');
  const [isSending, setIsSending] = useState(false);

  // BroadCast History / Logs
  const [broadcastLogs, setBroadcastLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('edupro_broadcast_logs_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) {
      triggerNotification('يرجى كتابة عنوان وتفاصيل الإشعار الفيدرالي', 'warning');
      return;
    }

    setIsSending(false);
    triggerNotification('خدمة الإرسال المركزي غير متاحة؛ لم يتم بث الإشعار أو تسجيل نجاح وهمي.', 'warning');
  };

  return (
    <div id="super-admin-central-notifications" className="space-y-6 text-right">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold block">إجمالي الرسائل المرسلة</span>
          <span className="text-lg font-black text-white mt-1 block font-mono">{broadcastLogs.length ? broadcastLogs.length.toLocaleString() : 'غير متحقق'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold block">معدل التسليم الناجح (Delivery)</span>
          <span className="text-lg font-black text-emerald-400 mt-1 block font-mono">غير متحقق</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold block">معدل الفتح والمشاهدة (Open Rate)</span>
          <span className="text-lg font-black text-amber-400 mt-1 block font-mono">غير متحقق</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold block">متوسط سرعة الإرسال (Delivery Speed)</span>
          <span className="text-lg font-black text-amber-400 mt-1 block font-mono">غير متحقق</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* BroadCast Form */}
        <form onSubmit={handleSendBroadcast} className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-xs font-black text-white flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <Volume2 className="w-4 h-4 text-amber-400" />
            صياغة وبث إشعار إداري فيدرالي جديد
          </h3>

          <div className="space-y-3.5 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">الشريحة المستهدفة بالبث</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">كافة المدارس والفروع (All Tenants)</option>
                  <option value="specific">مستأجر مدرسة محددة</option>
                </select>
              </div>

              {targetAudience === 'specific' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">اختر مدرسة المستأجر</label>
                  <select
                    required
                    value={targetSchoolId}
                    onChange={(e) => setTargetSchoolId(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">تحديد مدرسة المستأجر ...</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">قناة البث الرئيسية</label>
              <select
                value={notificationChannel}
                onChange={(e) => setNotificationChannel(e.target.value as any)}
                className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">كافة القنوات (بث لوحة التحكم + البريد الإلكتروني + SMS)</option>
                <option value="in_app">لوحات التحكم والتطبيقات فقط (In-App Only)</option>
                <option value="email">البريد الإلكتروني فقط (Email Only)</option>
                <option value="sms">الرسائل القصيرة والواتساب (SMS & WhatsApp)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">عنوان الإعلان الرئيسي</label>
              <input
                required
                type="text"
                placeholder="مثال: ترقية هامة مجدولة لخوادم النظام الليلة"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">مضمون وجسم الرسالة الموحد</label>
              <textarea
                required
                rows={4}
                placeholder="تفاصيل وجسم التنبيه، يُرجى الكتابة بصيغة واضحة ومهنية مع توجيه الإجراءات المطلوبة من مديري المدارس..."
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500 font-medium"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black py-3 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'جاري البث الإعلاني الفيدرالي...' : 'بث وإرسال الإشعار المركزي فوراً 🚀'}</span>
          </button>
        </form>

        {/* Transmission Tracker */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              سجل التتبع وتدقيق استلام البث الفيدرالي
            </h3>
            <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900 px-2 py-0.5 rounded">
              تتبع فيدرالي مباشر
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px] p-4 space-y-3">
            {broadcastLogs.map((log) => (
              <div key={log.id} className="bg-slate-950/50 border border-slate-850 p-4 space-y-2 hover:bg-slate-950 transition-colors">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-100">{log.title}</h4>
                  <span className="text-[9px] font-mono text-slate-500">{log.date}</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 font-semibold pt-1">
                  <div>
                    <span className="block text-slate-500 text-[8px] font-bold">الجمهور:</span>
                    <span>{log.target}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[8px] font-bold">القنوات:</span>
                    <span>{log.channel}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[8px] font-bold">مستلم بنجاح:</span>
                    <span className="text-emerald-400 font-mono font-bold">{log.delivered}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[8px] font-bold">فشل الإرسال:</span>
                    <span className="text-rose-400 font-mono font-bold">{log.failed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
