import React from 'react';

interface StudentGuardianInformationProps {
  formStudent: {
    fatherName: string;
    fatherPhone: string;
    fatherJob: string;
    fatherWorkPlace: string;
    fatherNationalId: string;
    motherName: string;
    motherPhone: string;
    motherJob: string;
    homeAddress: string;
    emergencyPhone: string;
    emergencyContact: string;
    relationshipType: string;
  };
  setFormStudent: React.Dispatch<React.SetStateAction<any>>;
}

export default function StudentGuardianInformation({
  formStudent,
  setFormStudent
}: StudentGuardianInformationProps) {
  return (
    <div className="space-y-4" id="student-guardian-info-section">
      {/* Category 1: Father Information */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-amber-700 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="w-1.5 h-3 bg-amber-600 rounded"></span>
          بيانات الأب (الوكيل المالي بالوصاية)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Father Name */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">اسم الأب رباعي:</label>
            <input
              type="text"
              required
              value={formStudent.fatherName}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, fatherName: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-bold focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="مثال: عبدالله بن صالح السبهان"
            />
          </div>

          {/* Father Phone */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">رقم هاتف الأب:</label>
            <input
              type="tel"
              required
              value={formStudent.fatherPhone}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, fatherPhone: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-bold font-mono text-left focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="+966 50 112 2334"
            />
          </div>

          {/* Job */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">مهنة الأب الوظيفية:</label>
            <input
              type="text"
              value={formStudent.fatherJob}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, fatherJob: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-semibold focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="مثال: مهندس برمجيات"
            />
          </div>

          {/* Job Address */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">مكان العمل الجغرافي:</label>
            <input
              type="text"
              value={formStudent.fatherWorkPlace}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, fatherWorkPlace: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="مثال: شركة علم، الرياض"
            />
          </div>

          {/* Father National ID */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">الرقم الوطني للأب:</label>
            <input
              type="text"
              value={formStudent.fatherNationalId}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, fatherNationalId: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-mono focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="1029481029"
            />
          </div>

        </div>
      </div>

      {/* Category 2: Mother Information */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-amber-700 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="w-1.5 h-3 bg-amber-600 rounded"></span>
          بيانات الأم (الوكيل السند للمتابعة)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Name */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">اسم الأم بالكامل:</label>
            <input
              type="text"
              value={formStudent.motherName}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, motherName: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-bold focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="مثال: نورة بنت عبدالله الخالدي"
            />
          </div>

          {/* Mother Phone */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">رقم هاتف الأم:</label>
            <input
              type="tel"
              value={formStudent.motherPhone}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, motherPhone: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-bold font-mono text-left focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="+966 59 112 3344"
            />
          </div>

          {/* Job */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">المهنة ومقر العمل:</label>
            <input
              type="text"
              value={formStudent.motherJob}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, motherJob: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="مثال: معلمة قطاع تعليمي"
            />
          </div>

        </div>
      </div>

      {/* Category 3: Emergency and Family Links */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-amber-700 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="w-1.5 h-3 bg-amber-600 rounded"></span>
          بيانات الاتصال للطوارئ والحالة العائلية
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Family Address */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">عنوان سكن العائلة:</label>
            <input
              type="text"
              value={formStudent.homeAddress}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, homeAddress: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="الرياض، نفس عنوان السكن السابق"
            />
          </div>

          {/* Additional phone */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">رقم هاتف إضافي:</label>
            <input
              type="tel"
              value={formStudent.emergencyPhone}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, emergencyPhone: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-mono font-bold text-left focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="011 483 1244"
            />
          </div>

          {/* Emergency Contact Person */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">جهة اتصال للطوارئ (الاسم بالكامل):</label>
            <input
              type="text"
              value={formStudent.emergencyContact}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, emergencyContact: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-medium focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="مثال: العم / عبدالرحمن"
            />
          </div>

          {/* Relationship Type */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">صلة القرابة:</label>
            <select
              value={formStudent.relationshipType}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, relationshipType: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-bold focus:ring-1  focus:ring-[#9a6a1d] "
            >
              <option value="الأب">الأب (وصاية قانونية)</option>
              <option value="الأم">الأم</option>
              <option value="العم">العم</option>
              <option value="الخال">الخال</option>
              <option value="موصى به">مكتب رعاية / موصى به شرعاً</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  );
}
