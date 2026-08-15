import React from 'react';
import { Grade, Stage } from '../../types';

interface StudentAcademicInformationProps {
  formStudent: {
    stageId: string;
    gradeName: string;
    section: string;
    academicYear: string;
    seatNumber: string;
    enrollmentStatus: 'active' | 'suspended' | 'graduated' | 'frozen' | 'withdrawn';
    registrationDate: string;
  };
  setFormStudent: React.Dispatch<React.SetStateAction<any>>;
  actualGrades: Grade[];
  actualStages: Stage[];
  isNewRecord: boolean;
  selectedStudentId: string;
  promoteGrade: string;
  setPromoteGrade: (val: string) => void;
  promoteSection: string;
  setPromoteSection: (val: string) => void;
  promoteAcademicYear: string;
  setPromoteAcademicYear: (val: string) => void;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
}

const CLASSES = ['أ', 'ب', 'ج', 'د'];
const ACADEMIC_YEARS = ['1446-1447 هـ', '1447-1448 هـ'];

export default function StudentAcademicInformation({
  formStudent,
  setFormStudent,
  actualGrades,
  actualStages,
  isNewRecord,
  selectedStudentId,
  promoteGrade,
  setPromoteGrade,
  promoteSection,
  setPromoteSection,
  promoteAcademicYear,
  setPromoteAcademicYear,
  triggerNotification
}: StudentAcademicInformationProps) {
  return (
    <div className="space-y-4" id="student-academic-info-section">
      {/* Category 2: Academic Program & Classroom Mapping */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-amber-700 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="w-1.5 h-3 bg-amber-600 rounded"></span>
          البيانات الدراسية للتسجيل والأقسام
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Academic Stage */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">المرحلة الدراسية:</label>
            <select
              value={formStudent.stageId}
              onChange={(e) => {
                const val = e.target.value;
                const defaultG = actualGrades.find(g => g.stageId === val);
                setFormStudent((prev: any) => ({
                  ...prev,
                  stageId: val,
                  gradeName: defaultG ? defaultG.name : prev.gradeName
                }));
              }}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-bold"
            >
              {actualStages.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Grade Class */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">الصف الدراسي الحالي:</label>
            <select
              value={formStudent.gradeName}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, gradeName: e.target.value }))}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-bold"
            >
              {actualGrades.filter(g => g.stageId === formStudent.stageId).map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">شعبة الطالب:</label>
            <select
              value={formStudent.section}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, section: e.target.value }))}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-bold"
            >
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>شعبة ({cls})</option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">العام الدراسي الحالي:</label>
            <select
              value={formStudent.academicYear}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, academicYear: e.target.value }))}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-bold"
            >
              {ACADEMIC_YEARS.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Seat Number */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">رقم الجلوس (الامتحانات):</label>
            <input
              type="text"
              value={formStudent.seatNumber}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, seatNumber: e.target.value }))}
              className="w-full bg-transparent border  border-slate-300  rounded-lg p-2.5 text-xs font-bold font-mono focus:ring-1  focus:ring-[#9a6a1d] "
              placeholder="مثال: 99120"
            />
          </div>

          {/* Registration Date */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">تاريخ التسجيل بالمنشأة:</label>
            <input
              type="date"
              value={formStudent.registrationDate}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, registrationDate: e.target.value }))}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-left"
            />
          </div>

          {/* Registration Status */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">حالة القيد للدراسة:</label>
            <select
              value={formStudent.enrollmentStatus}
              onChange={(e) => setFormStudent((prev: any) => ({ ...prev, enrollmentStatus: e.target.value as any }))}
              className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 text-xs font-black"
            >
              <option value="active">نشط بالمدارس والأكاديمية 🟢</option>
              <option value="suspended">موقوف مؤقتاً (إجراءات إدارية) 🟡</option>
              <option value="frozen">إيقاف القيد مؤقتاً (مؤجل) ❄️</option>
              <option value="graduated">خريج معتمد (منهي للدراسة) 🎓</option>
              <option value="withdrawn">منسحب من الدراسة 🚪</option>
            </select>
          </div>

        </div>
      </div>

      {/* Category 5: Student Lifecycle & Academic Promotions */}
      {!isNewRecord && selectedStudentId && (
        <div className="bg-transparent border border-amber-100 p-4 mt-6 space-y-4">
          <h3 className="text-xs font-black text-amber-700 tracking-wider flex items-center gap-2 border-b border-amber-100 pb-2">
            <span className="w-1.5 h-3 bg-amber-600 rounded"></span>
            إدارة الحركة الأكاديمية ودورة حياة قيد الطالب (نقل الصفوف وحالة القيد) ⚙️
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column A: Grade Transfer & Promotions */}
            <div className="space-y-3 p-3 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>🔄</span> النقل والترقية بين الصفوف الدراسية والشعب
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                يتيح لك هذا القسم نقل الطالب وتعديل صفه الحالي أو ترحيله للشعبة والصف المستهدف بناءً على قرارات الكنترول أو الإدارة.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-600 font-bold mb-1">الصف المستهدف:</label>
                  <select
                    value={promoteGrade || formStudent.gradeName}
                    onChange={(e) => setPromoteGrade(e.target.value)}
                    className="w-full bg-transparent border border-slate-300 rounded-md p-1.5 text-[10px] font-bold"
                  >
                    <option value="">اختر الصف الدراسي</option>
                    {actualGrades.map(g => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 font-bold mb-1">الشعبة المستهدفة:</label>
                  <select
                    value={promoteSection}
                    onChange={(e) => setPromoteSection(e.target.value)}
                    className="w-full bg-transparent border border-slate-300 rounded-md p-1.5 text-[10px] font-bold"
                  >
                    {CLASSES.map(cls => (
                      <option key={cls} value={cls}>الشعبة ({cls})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetGrade = promoteGrade || formStudent.gradeName;
                    if (!targetGrade) {
                      triggerNotification('يرجى تحديد الصف الدراسي المستهدف لنقل الطالب', 'warning');
                      return;
                    }
                    setFormStudent((prev: any) => ({
                      ...prev,
                      gradeName: targetGrade,
                      section: promoteSection,
                      academicYear: promoteAcademicYear
                    }));
                    triggerNotification(`تم تجهيز ترحيل الطالب إلى ${targetGrade} - شعبة ${promoteSection} بنجاح. يرجى الضغط على حفظ في الأسفل لاعتماد التعديل بقاعدة البيانات.`, 'success');
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>ترحيل الطالب وتعديل الصف والشعبة 🚀</span>
                </button>
              </div>
            </div>

            {/* Column B: Lifecycle state transitions */}
            <div className="space-y-3 p-3 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>🛡️</span> الإجراءات الإدارية وتغيير حالة قيد الطالب
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                تحديث فوري وسهل لحالة الطالب الإدارية في النظام لدعم الأرشفة والتقارير المالية والتحصيلية.
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                {/* Freeze button */}
                <button
                  type="button"
                  onClick={() => {
                    setFormStudent((prev: any) => ({ ...prev, enrollmentStatus: 'frozen' }));
                    triggerNotification('تم تعيين حالة الطالب كـ (قيد موقوف/مؤجل ❄️). يرجى النقر على زر الحفظ لحفظ التغييرات بقاعدة البيانات.', 'info');
                  }}
                  className="bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 text-yellow-800 text-[10px] font-bold p-2.5 rounded-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="text-lg">❄️</span>
                  <span>إيقاف القيد (تأجيل)</span>
                </button>

                {/* Active button */}
                <button
                  type="button"
                  onClick={() => {
                    setFormStudent((prev: any) => ({ ...prev, enrollmentStatus: 'active' }));
                    triggerNotification('تمت إعادة تفعيل قيد الطالب كـ (نشط 🟢). يرجى النقر على زر الحفظ لحفظ التغييرات بقاعدة البيانات.', 'success');
                  }}
                  className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold p-2.5 rounded-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="text-lg">🟢</span>
                  <span>إعادة القيد (تفعيل)</span>
                </button>

                {/* Graduate button */}
                <button
                  type="button"
                  onClick={() => {
                    setFormStudent((prev: any) => ({ ...prev, enrollmentStatus: 'graduated' }));
                    triggerNotification('تم تعيين حالة الطالب كـ (خريج 🎓). يرجى النقر على زر الحفظ لحفظ التغييرات بقاعدة البيانات.', 'info');
                  }}
                  className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 text-[10px] font-bold p-2.5 rounded-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="text-lg">🎓</span>
                  <span>تخرج الطالب</span>
                </button>

                {/* Withdraw button */}
                <button
                  type="button"
                  onClick={() => {
                    setFormStudent((prev: any) => ({ ...prev, enrollmentStatus: 'withdrawn' }));
                    triggerNotification('تم تعيين حالة الطالب كـ (منسحب 🚪). يرجى النقر على زر الحفظ لحفظ التغييرات بقاعدة البيانات.', 'warning');
                  }}
                  className="bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 text-[10px] font-bold p-2.5 rounded-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="text-lg">🚪</span>
                  <span>انسحاب الطالب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
