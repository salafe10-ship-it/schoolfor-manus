import React, { useMemo, useState } from 'react';
import { Archive, CheckCircle, Download, FileText, Printer, ShieldAlert, ShieldCheck } from 'lucide-react';

type NotificationType = 'success' | 'warning' | 'info';

interface ExamsCertificatesPanelProps {
  schoolName: string;
  settings: { academicYear?: string; semester?: string; examType?: string };
  students: any[];
  subjects: any[];
  gradesMatrix: Record<string, Record<string, number>>;
  approvalStatus: { approved: boolean; approvedBy?: string; approvedAt?: string };
  closures: any[];
  classes: any[];
  notify: (message: string, type: NotificationType) => void;
}

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const csvCell = (value: unknown): string => {
  const text = String(value ?? '').replaceAll('"', '""');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe}"`;
};

export default function ExamsCertificatesPanel({
  schoolName,
  settings,
  students,
  subjects,
  gradesMatrix,
  approvalStatus,
  closures,
  classes,
  notify
}: ExamsCertificatesPanelProps) {
  const immutableArchive = closures.find(closure => closure?.isImmutableArchive && /^[0-9a-f]{64}$/i.test(String(closure.signatureHash || '')));
  const canIssue = Boolean(approvalStatus.approved && immutableArchive);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClass, setSelectedClass] = useState('الكل');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifiedStudentId, setVerifiedStudentId] = useState<string | null>(null);
  const selectedStudent = students.find(student => student.id === selectedStudentId) || students[0];
  const verifiedStudent = students.find(student => student.id === verifiedStudentId);

  const targetStudents = useMemo(
    () => students.filter(student => selectedClass === 'الكل' || student.classroom === selectedClass),
    [selectedClass, students]
  );

  const certificateCode = (student: any): string => `${immutableArchive?.archiveId || 'unarchived'}:${student.id}`;

  const buildStudentRows = (student: any): string => subjects.map(subject => {
    const isAbsent = student.absentSubjects?.includes(subject.id);
    const grade = gradesMatrix[student.id]?.[subject.id];
    const recorded = Number.isFinite(grade);
    const passed = recorded && grade >= subject.passScore;
    return `<tr>
      <td>${escapeHtml(subject.name)}</td>
      <td>${escapeHtml(subject.maxScore)}</td>
      <td>${escapeHtml(subject.passScore)}</td>
      <td>${isAbsent ? 'غائب' : recorded ? escapeHtml(grade) : 'غير مرصود'}</td>
      <td>${isAbsent ? 'غياب موثق' : recorded ? (passed ? 'اجتاز' : 'لم يجتز') : 'غير مكتمل'}</td>
    </tr>`;
  }).join('');

  const printCertificates = (printStudents: any[]) => {
    if (!canIssue) {
      notify('لا يمكن إصدار إفادات نتائج قبل اعتماد النتائج ووجود أرشيف خادم غير قابل للتعديل.', 'warning');
      return;
    }
    if (printStudents.length === 0) {
      notify('لا يوجد طلاب مطابقون للطباعة.', 'warning');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notify('يرجى السماح بالنوافذ المنبثقة لفتح الطباعة.', 'warning');
      return;
    }
    const pages = printStudents.map(student => `<section class="certificate">
      <header>
        <div><strong>${escapeHtml(schoolName)}</strong><br/>وحدة الامتحانات والنتائج — SchoolForManus</div>
        <div>العام: ${escapeHtml(settings.academicYear)}<br/>الفصل: ${escapeHtml(settings.semester)}</div>
      </header>
      <h1>إفادة نتيجة دراسية معتمدة</h1>
      <p>تفيد المدرسة بأن نتيجة الطالب/الطالبة <strong>${escapeHtml(student.name)}</strong> في ${escapeHtml(student.classroom)} محفوظة ضمن أرشيف النتائج المعتمد.</p>
      <table><thead><tr><th>المادة</th><th>العظمى</th><th>النجاح</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody>${buildStudentRows(student)}</tbody></table>
      <div class="evidence"><b>رمز التحقق الداخلي:</b> ${escapeHtml(certificateCode(student))}<br/><b>معرف الأرشيف:</b> ${escapeHtml(immutableArchive.archiveId)}<br/><b>بصمة الخادم SHA-256:</b> ${escapeHtml(immutableArchive.signatureHash)}</div>
      <footer><span>اعتمد بواسطة: ${escapeHtml(immutableArchive.approvedBy || approvalStatus.approvedBy)}</span><span>تاريخ الاعتماد: ${escapeHtml(immutableArchive.serverSignedAt || approvalStatus.approvedAt)}</span></footer>
    </section>`).join('<div class="page-break"></div>');
    printWindow.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>إفادات النتائج المعتمدة</title><style>
      @page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#172033}.certificate{border:5px double #9a6a1d;padding:28px;min-height:245mm;box-sizing:border-box}.certificate header,.certificate footer{display:flex;justify-content:space-between;gap:20px;font-size:11px}.certificate h1{text-align:center;color:#7c5417;margin:28px 0}.certificate p{line-height:1.9}table{width:100%;border-collapse:collapse;margin:22px 0;font-size:11px}th,td{border:1px solid #9ca3af;padding:8px;text-align:center}th{background:#fff8e5}.evidence{direction:ltr;text-align:left;overflow-wrap:anywhere;border:1px dashed #9ca3af;background:#f8fafc;padding:10px;font:9px monospace}.certificate footer{margin-top:28px;border-top:1px solid #d1d5db;padding-top:12px}.page-break{page-break-after:always}@media print{.certificate{page-break-inside:avoid}.page-break{page-break-after:always}}
    </style></head><body>${pages}<script>window.onload=()=>window.print()</script></body></html>`);
    printWindow.document.close();
    notify(`تم فتح ${printStudents.length} إفادة نتيجة معتمدة للطباعة.`, 'success');
  };

  const exportTranscript = (student: any) => {
    if (!student) return;
    const rows = subjects.map(subject => {
      const grade = gradesMatrix[student.id]?.[subject.id];
      const absent = student.absentSubjects?.includes(subject.id);
      return [student.id, student.name, student.classroom, subject.name, subject.maxScore, subject.passScore, absent ? 'غائب' : grade ?? 'غير مرصود'];
    });
    const csv = '\uFEFF' + [['معرف الطالب', 'اسم الطالب', 'الصف', 'المادة', 'العظمى', 'درجة النجاح', 'الدرجة'], ...rows]
      .map(row => row.map(csvCell).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript-${student.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('تم تصدير كشف الدرجات الفعلي بصيغة CSV.', 'success');
  };

  const verify = () => {
    if (!canIssue) {
      setVerifiedStudentId(null);
      notify('لا يوجد أرشيف نتائج معتمد يمكن التحقق منه.', 'warning');
      return;
    }
    const student = students.find(item => certificateCode(item).toLowerCase() === verificationCode.trim().toLowerCase());
    setVerifiedStudentId(student?.id || null);
    notify(student ? `تمت مطابقة الرمز مع أرشيف نتيجة ${student.name}.` : 'رمز التحقق لا يطابق أرشيف النتائج الحالي.', student ? 'success' : 'warning');
  };

  return (
    <div className="space-y-6" dir="rtl">
      <section className="border border-[#d4af37]/40 bg-[#1c120c] p-6 text-amber-50 shadow-xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div><span className="text-[10px] font-black text-amber-300">CERTIFICATES & TRANSCRIPTS</span><h2 className="mt-1 text-xl font-black text-white">إفادات النتائج وكشوف الدرجات</h2><p className="mt-1 text-xs text-amber-100/60">الإصدار مرتبط حصراً بأرشيف نتائج موقع من الخادم.</p></div>
          <div className={canIssue ? 'border border-emerald-500/40 bg-emerald-950/50 px-4 py-2 text-xs font-black text-emerald-300' : 'border border-amber-500/40 bg-amber-950/50 px-4 py-2 text-xs font-black text-amber-300'}>{canIssue ? 'جاهز للإصدار المعتمد' : 'الإصدار المعتمد مقفل'}</div>
        </div>
      </section>

      {!canIssue && <div className="flex items-start gap-3 border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-100"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"/><div><b>لا توجد نتائج مغلقة بأرشيف خادم.</b><p className="mt-1 text-xs text-amber-100/70">يمكن معاينة البيانات وتصدير كشف داخلي، لكن الطباعة المعتمدة والتحقق يظلان محجوبين حتى الاعتماد النهائي.</p></div></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="space-y-4 border border-[#d4af37]/35 bg-[#1c120c] p-5 shadow-xl">
          <h3 className="border-b border-[#d4af37]/20 pb-3 text-sm font-black text-[#fce79a]">اختيار الطالب والإجراء</h3>
          <select value={selectedStudent?.id || ''} onChange={event => setSelectedStudentId(event.target.value)} className="w-full border border-[#d4af37]/35 bg-[#130b04] p-2.5 text-xs font-bold text-amber-50 outline-none"><option value="">اختر طالباً</option>{students.map(student => <option key={student.id} value={student.id}>{student.name} — {student.classroom}</option>)}</select>
          <button type="button" disabled={!selectedStudent || !canIssue} onClick={() => printCertificates(selectedStudent ? [selectedStudent] : [])} className="flex w-full items-center justify-center gap-2 bg-gradient-to-l from-[#f7d174] to-[#9a6a1d] py-2.5 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"><Printer className="h-4 w-4"/>طباعة إفادة النتيجة المعتمدة</button>
          <button type="button" disabled={!selectedStudent} onClick={() => exportTranscript(selectedStudent)} className="flex w-full items-center justify-center gap-2 border border-[#d4af37]/35 bg-[#130b04] py-2.5 text-xs font-black text-amber-100 transition hover:bg-[#2a1d13] disabled:opacity-40"><Download className="h-4 w-4"/>تصدير كشف الدرجات CSV</button>

          <div className="border-t border-[#d4af37]/20 pt-4"><label className="mb-1 block text-[10px] font-black text-amber-100/60">الطباعة الجماعية حسب الصف</label><select value={selectedClass} onChange={event => setSelectedClass(event.target.value)} className="w-full border border-[#d4af37]/35 bg-[#130b04] p-2 text-xs font-bold text-amber-50 outline-none"><option value="الكل">كل الطلاب</option>{classes.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select><button type="button" disabled={!canIssue || targetStudents.length === 0} onClick={() => printCertificates(targetStudents)} className="mt-2 flex w-full items-center justify-center gap-2 border border-amber-500/40 bg-amber-950/40 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-900/50 disabled:opacity-40"><Printer className="h-4 w-4"/>طباعة {targetStudents.length} إفادة</button></div>
        </section>

        <section className="space-y-4 border border-[#d4af37]/35 bg-[#1c120c] p-5 shadow-xl lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-[#d4af37]/20 pb-3"><FileText className="h-5 w-5 text-[#f7d174]"/><h3 className="text-sm font-black text-[#fce79a]">معاينة كشف الطالب</h3></div>
          {selectedStudent ? <><div className="grid grid-cols-2 gap-3 text-xs text-amber-50 md:grid-cols-4"><div><span className="block text-amber-100/50">الطالب</span><b>{selectedStudent.name}</b></div><div><span className="block text-amber-100/50">الصف</span><b>{selectedStudent.classroom}</b></div><div><span className="block text-amber-100/50">رقم الجلوس</span><b>{selectedStudent.seatNumber || 'غير مولد'}</b></div><div><span className="block text-amber-100/50">الحالة</span><b>{selectedStudent.status || 'تُحسب من الدرجات'}</b></div></div><div className="overflow-x-auto border border-[#d4af37]/20"><table className="w-full border-collapse text-xs text-amber-50"><thead><tr className="bg-gradient-to-l from-[#9a6a1d] via-[#c58a22] to-[#8b6113] text-[#fff8d6]"><th className="border border-[#d4af37]/25 p-2">المادة</th><th className="border border-[#d4af37]/25 p-2">العظمى</th><th className="border border-[#d4af37]/25 p-2">النجاح</th><th className="border border-[#d4af37]/25 p-2">الدرجة</th></tr></thead><tbody>{subjects.map(subject => { const absent = selectedStudent.absentSubjects?.includes(subject.id); const grade = gradesMatrix[selectedStudent.id]?.[subject.id]; return <tr key={subject.id} className="border-b border-[#d4af37]/15 hover:bg-[#2a1d13]/70"><td className="border border-[#d4af37]/15 p-2 font-bold">{subject.name}</td><td className="border border-[#d4af37]/15 p-2 text-center">{subject.maxScore}</td><td className="border border-[#d4af37]/15 p-2 text-center">{subject.passScore}</td><td className="border border-[#d4af37]/15 p-2 text-center font-black text-[#f7d174]">{absent ? 'غائب' : Number.isFinite(grade) ? grade : 'غير مرصود'}</td></tr>; })}</tbody></table></div>{canIssue && <div className="flex items-start gap-2 border border-emerald-500/40 bg-emerald-950/40 p-3 text-[10px] text-emerald-100"><Archive className="h-4 w-4 shrink-0"/><span className="break-all">رمز التحقق: <b>{certificateCode(selectedStudent)}</b><br/>بصمة الأرشيف: {immutableArchive.signatureHash}</span></div>}</> : <p className="py-16 text-center text-xs font-semibold text-amber-100/50">لا يوجد طلاب لعرض كشف الدرجات.</p>}
        </section>
      </div>

      <section className="border border-emerald-500/35 bg-emerald-950/30 p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300"/><h3 className="text-sm font-black text-emerald-100">التحقق من إفادة نتيجة</h3></div><p className="mt-1 text-[11px] text-emerald-100/70">أدخل الرمز الكامل المطبوع في الإفادة لمطابقته مع أرشيف الجلسة الحالية.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={verificationCode} onChange={event => setVerificationCode(event.target.value)} placeholder="معرف الأرشيف:معرف الطالب" className="flex-1 border border-emerald-500/40 bg-[#130b04] p-2.5 text-xs font-bold text-emerald-50 placeholder:text-emerald-100/35 outline-none"/><button type="button" onClick={verify} className="bg-emerald-700 px-5 py-2.5 text-xs font-black text-white transition hover:bg-emerald-600">تحقق</button></div>{verifiedStudent && <div className="mt-3 flex items-center gap-2 border border-emerald-500/40 bg-[#130b04] p-3 text-xs font-bold text-emerald-100"><CheckCircle className="h-5 w-5"/>تمت مطابقة الرمز مع الطالب {verifiedStudent.name} والأرشيف {immutableArchive.archiveId}.</div>}</section>
    </div>
  );
}
