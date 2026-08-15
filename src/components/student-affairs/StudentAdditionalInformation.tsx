import { Activity, Award, BookOpen, CheckCircle2, Compass, Heart, Info, ShieldAlert, Smile, Sparkles, UserCheck } from 'lucide-react';
import React from 'react';
interface StudentAdditionalInformationProps {
  formStudent: any;
  setFormStudent: React.Dispatch<React.SetStateAction<any>>;
}

export default function StudentAdditionalInformation({
  formStudent,
  setFormStudent
}: StudentAdditionalInformationProps) {

  const updateField = (key: string, value: any) => {
    setFormStudent((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6" id="student-additional-info-section">
      
      {/* 1. Medical Information Card */}
      <div className="border border-emerald-100 p-5 transition-all hover:shadow-md">
        <h3 className="text-xs font-black text-emerald-900 tracking-wider flex items-center gap-2 border-b border-emerald-100 pb-3 mb-4">
          <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>المعلومات الطبية والوقائية</span>
          {(formStudent.healthChronic || formStudent.healthAllergies || formStudent.healthSpecialNeeds) && (
            <span className="mr-auto inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 font-extrabold px-2.5 py-0.5 rounded-full text-[9px] animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              <span>حالة رعاية خاصة</span>
            </span>
          )}
        </h3>

        <div className="space-y-4 text-right" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Blood Type */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">فصيلة الدم:</label>
              <select
                value={formStudent.healthBloodType || 'O+'}
                onChange={(e) => updateField('healthBloodType', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-black focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="A+">A+ (موجب)</option>
                <option value="A-">A- (سالب)</option>
                <option value="B+">B+ (موجب)</option>
                <option value="B-">B- (سالب)</option>
                <option value="AB+">AB+ (موجب)</option>
                <option value="AB-">AB- (سالب)</option>
                <option value="O+">O+ (موجب عام)</option>
                <option value="O-">O- (سالب عام)</option>
              </select>
            </div>

            {/* Vaccines */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">حالة اللقاحات والتطعيمات:</label>
              <div className="flex items-center gap-2.5 bg-transparent p-2.5 min-h-[38px]">
                <input
                  type="checkbox"
                  id="healthVaccines_chk"
                  checked={!!formStudent.healthVaccines}
                  onChange={(e) => updateField('healthVaccines', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="healthVaccines_chk" className="text-xs font-bold text-slate-700 cursor-pointer select-none flex items-center gap-1">
                  <span>مكتمل وموثق رسمياً</span>
                  {formStudent.healthVaccines && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">وزارة الصحة</span>}
                </label>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">جهة الاتصال الطبي السريع:</label>
              <input
                type="text"
                placeholder="مثال: الأب - 05XXXXXXXX"
                value={formStudent.healthEmergencyContact || ''}
                onChange={(e) => updateField('healthEmergencyContact', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chronic diseases */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">الأمراض المزمنة أو الدائمة:</label>
              <textarea
                placeholder="اكتب الحالات بالتفصيل أو اكتب 'لا يوجد'"
                value={formStudent.healthChronic || ''}
                onChange={(e) => updateField('healthChronic', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 min-h-[70px]"
              />
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">الحساسية والمأكولات الممنوعة:</label>
              <textarea
                placeholder="مثال: حساسية البيض، حساسية البنسلين، إلخ..."
                value={formStudent.healthAllergies || ''}
                onChange={(e) => updateField('healthAllergies', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 min-h-[70px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Continuous Medications */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">الأدوية المستمرة:</label>
              <input
                type="text"
                placeholder="مثال: بخاخ الربو عند الحاجة"
                value={formStudent.healthContinuousMeds || ''}
                onChange={(e) => updateField('healthContinuousMeds', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Special Needs */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">الاحتياجات الصحية الخاصة:</label>
              <input
                type="text"
                placeholder="مثال: الجلوس في المقعد الأمامي"
                value={formStudent.healthSpecialNeeds || ''}
                onChange={(e) => updateField('healthSpecialNeeds', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Doctor Notes */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">ملاحظات العيادة المدرسية:</label>
              <input
                type="text"
                placeholder="توجيهات طبيب أو ممرض المدرسة"
                value={formStudent.healthDoctorNotes || ''}
                onChange={(e) => updateField('healthDoctorNotes', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Academic Information Card */}
      <div className="border border-amber-100 p-5 transition-all hover:shadow-md">
        <h3 className="text-xs font-black text-amber-900 tracking-wider flex items-center gap-2 border-b border-amber-100 pb-3 mb-4">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>المعلومات والتوجيهات الأكاديمية</span>
          {(formStudent.academicTalent) && (
            <span className="mr-auto inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full text-[9px]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>طالب موهوب ومتميز</span>
            </span>
          )}
        </h3>

        <div className="space-y-4 text-right" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Academic Level */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">المستوى الدراسي العام:</label>
              <select
                value={formStudent.academicLevel || 'متوسط'}
                onChange={(e) => updateField('academicLevel', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-black focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ممتاز">متفوق جداً (ممتاز) 🏆</option>
                <option value="جيد جدا">جيد جداً 🌟</option>
                <option value="متوسط">متوسط المستوي 👍</option>
                <option value="مقبول">يحتاج متابعة وتطوير (مقبول) 📈</option>
                <option value="ضعيف">تحت المتابعة المكثفة (ضعيف) ⚠️</option>
              </select>
            </div>

            {/* Talent & Excellence */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">الموهبة أو التميز الاستثنائي:</label>
              <input
                type="text"
                placeholder="مثال: الحساب الذهني السريع، الخط العربي، الإلقاء..."
                value={formStudent.academicTalent || ''}
                onChange={(e) => updateField('academicTalent', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">نقاط القوة الأكاديمية والمهارية:</label>
              <textarea
                placeholder="مثال: مهارات القيادة الفعالة، سرعة الفهم والتحليل بالرياضيات..."
                value={formStudent.academicStrengths || ''}
                onChange={(e) => updateField('academicStrengths', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-amber-500 min-h-[70px]"
              />
            </div>

            {/* Improvements */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">نقاط التطوير والتحسين المقترحة:</label>
              <textarea
                placeholder="مثال: يحتاج إلى تحسين مهارات الكتابة، الثقة بالنفس عند التحدث أمام الجمهور..."
                value={formStudent.academicWeaknesses || ''}
                onChange={(e) => updateField('academicWeaknesses', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-amber-500 min-h-[70px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enrichment Programs */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">برامج التقوية أو الإثراء المقترحة:</label>
              <input
                type="text"
                placeholder="مثال: التسجيل في منصة موهبة أو نادي الروبوت المدرسي"
                value={formStudent.academicPrograms || ''}
                onChange={(e) => updateField('academicPrograms', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Guidance Notes */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">ملاحظات المرشد الطلابي الأكاديمي:</label>
              <input
                type="text"
                placeholder="توجيهات للمتابعة الصفية من قبل منسقي المواد"
                value={formStudent.academicGuidanceNotes || ''}
                onChange={(e) => updateField('academicGuidanceNotes', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Behavioral Information Card */}
      <div className="border border-amber-100 p-5 transition-all hover:shadow-md">
        <h3 className="text-xs font-black text-amber-900 tracking-wider flex items-center gap-2 border-b border-amber-100 pb-3 mb-4">
          <Smile className="w-4 h-4 text-amber-600" />
          <span>التقييم والسلوك والانضباط</span>
          {(formStudent.behaviorPoints && formStudent.behaviorPoints >= 95) ? (
            <span className="mr-auto inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold px-2.5 py-0.5 rounded-full text-[9px]">
              <Compass className="w-3 h-3 text-emerald-600" />
              <span>انضباط مثالي: {formStudent.behaviorPoints} نقطة</span>
            </span>
          ) : (
            <span className="mr-auto inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full text-[9px]">
              <span>النقاط المتبقية: {formStudent.behaviorPoints || 100}</span>
            </span>
          )}
        </h3>

        <div className="space-y-4 text-right" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Discipline Level */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">مستوى الانضباط العام:</label>
              <select
                value={formStudent.behaviorDisciplineLevel || 'ممتاز'}
                onChange={(e) => updateField('behaviorDisciplineLevel', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-black focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ممتاز">ممتاز ومثالي (بلا مخالفات) ⭐</option>
                <option value="جيد جدا">ملتزم جـداً 👍</option>
                <option value="مقبول">مخالفات طفيفة (يحتاج توجيه) ⚠️</option>
                <option value="غير منضبط">متكرر المشاكسة (تحت الرصد) 🚨</option>
              </select>
            </div>

            {/* Commitment Level */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">مستوى الالتزام بالأنشطة والواجبات:</label>
              <select
                value={formStudent.behaviorCommitmentLevel || 'ممتاز'}
                onChange={(e) => updateField('behaviorCommitmentLevel', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-black focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ممتاز">ملتزم بالكامل ويؤدي الواجبات بشغف ✓</option>
                <option value="جيد جدا">يؤدي المطلوب منه بانتظام</option>
                <option value="مقبول">تأخيرات متفرقة في التسليم</option>
                <option value="ضعيف">غير مهتم بأداء الأنشطة والواجبات</option>
              </select>
            </div>

            {/* Cooperation Level */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">التعاون والمشاركة المجتمعية والعمل الجماعي:</label>
              <select
                value={formStudent.behaviorCooperationLevel || 'ممتاز'}
                onChange={(e) => updateField('behaviorCooperationLevel', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-black focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ممتاز">مبادر قيادي ويساعد زملائه دائماً 🤝</option>
                <option value="جيد جدا">متعاون وإيجابي جداً</option>
                <option value="متوسط">مشارك عند الطلب فقط</option>
                <option value="سلبي">يميل للانعزال أو يرفض المشاركة الجماعية</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Behavior Awards */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">الجوائز وشهادات الشكر والتقدير:</label>
              <textarea
                placeholder="مثال: شهادة شكر في الإذاعة المدرسية للسلوك المثالي، جائزة المبادرة..."
                value={formStudent.behaviorAwards || ''}
                onChange={(e) => updateField('behaviorAwards', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-amber-500 min-h-[70px]"
              />
            </div>

            {/* Infractions / Alerts */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">التنبيهات أو المخالفات المرصودة:</label>
              <textarea
                placeholder="مثال: تنبيه شفهي أول لتجاوز وقت الحضور الصباحي، كتابة تعهد التزام..."
                value={formStudent.behaviorInfractions || ''}
                onChange={(e) => updateField('behaviorInfractions', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-amber-500 min-h-[70px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Social Worker Notes */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">ملاحظات الأخصائي الاجتماعي والسلوك الاجتماعي:</label>
              <input
                type="text"
                placeholder="مثال: الطالب يحتاج تعزيز الثقة والمشاركة الإيجابية"
                value={formStudent.behaviorSocialWorkerNotes || ''}
                onChange={(e) => updateField('behaviorSocialWorkerNotes', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Behavior Notes */}
            <div>
              <label className="block text-slate-700 font-bold text-[11px] mb-1">ملاحظات عامة حول السلوك والمتابعة المنزلية:</label>
              <input
                type="text"
                placeholder="ملاحظات وتوجيهات لأولياء الأمور"
                value={formStudent.behaviorNotes || ''}
                onChange={(e) => updateField('behaviorNotes', e.target.value)}
                className="w-full bg-transparent p-2.5 text-xs font-bold focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
