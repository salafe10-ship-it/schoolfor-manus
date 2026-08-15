import { MapPin } from 'lucide-react';
import React from 'react';
interface StudentAddressInformationProps {
  formStudent: {
    nationality: string;
    state: string;
    city: string;
    address: string;
  };
  setFormStudent: React.Dispatch<React.SetStateAction<any>>;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
}

export default function StudentAddressInformation({
  formStudent,
  setFormStudent,
  triggerNotification
}: StudentAddressInformationProps) {
  return (
    <div className="space-y-4" id="student-address-info-section">
      <div className="bg-transparent p-6">
        <div className="flex items-center gap-3 border-b pb-4 mb-4">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">تفاصيل العنوان السكني ومطابقة الموقع الجغرافي</h4>
            <p className="text-[10px] text-slate-500 font-semibold">تأكيد الإحداثيات لربط خطوط حافلات المدارس الذكية وتحديد أقرب فرع</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4 text-right">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] mb-1">البلد / الدولة:</label>
                <input 
                  type="text" 
                  value={formStudent.nationality === 'سعودي' ? 'المملكة العربية السعودية' : 'أخرى'} 
                  disabled 
                  className="w-full bg-slate-100 rounded-lg p-2.5 text-xs font-bold text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-[10px] mb-1">المنطقة / المحافظة:</label>
                <input 
                  type="text" 
                  value={formStudent.state} 
                  onChange={(e) => setFormStudent((prev: any) => ({ ...prev, state: e.target.value }))}
                  className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] mb-1">المدينة:</label>
                <input 
                  type="text" 
                  value={formStudent.city} 
                  onChange={(e) => setFormStudent((prev: any) => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold" 
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-[10px] mb-1">الحي السكني:</label>
                <input 
                  type="text" 
                  placeholder="مثال: حي الياسمين" 
                  value={formStudent.address.split(' - ')[0] || ''} 
                  onChange={(e) => {
                    const district = e.target.value;
                    const rest = formStudent.address.split(' - ')[1] || '';
                    setFormStudent((prev: any) => ({ ...prev, address: district + (rest ? ` - ${rest}` : '') }));
                  }}
                  className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold" 
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-[10px] mb-1">العنوان الوطني التفصيلي (الشارع / رقم المبنى):</label>
              <input 
                type="text" 
                placeholder="مثال: شارع العليا العام، مبنى رقم 7281" 
                value={formStudent.address} 
                onChange={(e) => setFormStudent((prev: any) => ({ ...prev, address: e.target.value }))}
                className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold" 
              />
            </div>
          </div>

          <div className="p-4 bg-[#2a1d13] text-[#fce79a] flex flex-col justify-between relative overflow-hidden h-52 text-right">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="z-10 text-right">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
                GIS INTERACTIVE MAP
              </span>
              <h5 className="font-extrabold text-xs mt-2 text-amber-200">الربط الجغرافي الذكي</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-semibold">العنوان مدعوم بنظام الخرائط ومطابقة الإحداثيات بشكل تلقائي.</p>
            </div>
            <div className="z-10 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Lat: 24.7136, Lng: 46.6753</span>
            </div>
            <div className="z-10 mt-2">
              <button
                type="button"
                onClick={() => triggerNotification('جاري التكامل والاتصال بخرائط Google Maps لتحديث الإحداثيات الجغرافية لموقع الطالب...', 'info')}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black py-2 rounded-lg cursor-pointer transition-colors"
              >
                🗺️ تفعيل مطابقة Google Maps
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
