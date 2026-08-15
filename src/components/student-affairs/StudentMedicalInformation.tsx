import { Activity } from 'lucide-react';
import React from 'react';
interface StudentMedicalInformationProps {
  formStudent: any;
  setFormStudent: React.Dispatch<React.SetStateAction<any>>;
}

export default function StudentMedicalInformation({
  formStudent,
  setFormStudent
}: StudentMedicalInformationProps) {
  return (
    <div className="border border-emerald-100 p-5 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300" id="student-medical-info-section">
      <h3 className="text-xs font-black text-emerald-900 tracking-wider flex items-center gap-2 border-b border-emerald-100 pb-3 mb-4">
        <Activity className="w-4 h-4 text-emerald-600" />
        المعلومات الطبية
      </h3>
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
          <Activity className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-black text-emerald-950">لوحة المراقبة الصحية الاستباقية للمدرسة الذكية 🏥</p>
            <p className="text-emerald-700 mt-0.5">يتيح هذا النظام تعقب الحالات الطبية الحرجة، وفصائل الدم لجميع المستأجرين مع ربطها المباشر بمكتب الرعاية الأولية لسرعة التدخل في الحالات الإسعافية.</p>
            {(formStudent.healthChronic || formStudent.healthAllergies) && (
              <span className="inline-block bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full text-[9px] mt-2 animate-pulse">
                ⚠️ تنبيه طبي فعال: هذا الطالب لديه حالات طارئة مسجلة!
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Blood Type */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">فصيلة الدم:</label>
            <select
              value={formStudent.healthBloodType}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, healthBloodType: e.target.value }))}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-black focus:ring-1 focus:ring-emerald-500"
            >
              <option value="A+">A+ (موجب)</option>
              <option value="A-">A- (سالب)</option>
              <option value="B+">B+ (موجب)</option>
              <option value="B-">B- (سالب)</option>
              <option value="AB+">AB+ (موجب)</option>
              <option value="AB-">AB- (سالب)</option>
              <option value="O+">O+ (موجب مفضل)</option>
              <option value="O-">O- (سالب عام)</option>
            </select>
          </div>

          {/* Vaccines Received */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">شهادة التطعيمات وجاهزية اللقاحات:</label>
            <div className="flex items-center gap-3 bg-transparent border border-slate-300 rounded-lg p-2.5 min-h-[38px]">
              <input
                type="checkbox"
                id="healthVaccines_chk"
                checked={formStudent.healthVaccines}
                onChange={(e) => setFormStudent((prev: any) => ({ ...prev, healthVaccines: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="healthVaccines_chk" className="text-xs font-bold text-slate-700 cursor-pointer select-none flex items-center gap-1.5">
                <span>مكتمل وموثق رسمياً</span>
                {formStudent.healthVaccines && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">✓ وزارة الصحة</span>}
              </label>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">جهة الإتصال الطبي العاجل:</label>
            <input
              type="text"
              value={formStudent.healthEmergencyContact}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, healthEmergencyContact: e.target.value }))}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chronic diseases */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">الأمراض المزمنة (إن وجدت):</label>
            <textarea
              value={formStudent.healthChronic}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, healthChronic: e.target.value }))}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 min-h-[80px]"
            />
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">الحساسية والأغذية الممنوعة:</label>
            <textarea
              value={formStudent.healthAllergies}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, healthAllergies: e.target.value }))}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 min-h-[80px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
