import { Award, Calendar, CalendarX, Coins, Download, FileSpreadsheet, Filter, HelpCircle, Printer, Scale, Search, UserCheck, Users } from 'lucide-react';
import React, { useState } from 'react';
import { HREmployee, HRDepartment, HRJob, HRAttendance, HRLeave, HRAdvance, HRBonus, HRPenalty } from './types';
import { FallbackStorage } from '../../database/repositories/FallbackStorage';

interface ReportsTabProps {
  employees: HREmployee[];
  departments: HRDepartment[];
  jobs: HRJob[];
  attendance: HRAttendance[];
  leaves: HRLeave[];
  advances: HRAdvance[];
  rewards: HRBonus[];
  penalties: HRPenalty[];
  formatCurrency: (amount: number, showSymbol?: boolean) => string;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'error') => void;
  costCenterLabels: Record<string, string>;
  onCanonicalReportAudit?: (payload: { reportType: ReportType; format: 'csv' | 'print'; startDate: string; endDate: string; rowCount: number }) => Promise<boolean>;
}

export type ReportType = 'employees' | 'attendance' | 'leaves' | 'advances' | 'rewards' | 'penalties';

export default function ReportsTab({
  employees,
  departments,
  jobs,
  attendance,
  leaves,
  advances,
  rewards,
  penalties,
  formatCurrency,
  triggerNotification,
  costCenterLabels,
  onCanonicalReportAudit
}: ReportsTabProps) {
  const [reportType, setReportType] = useState<ReportType>('employees');
  const [searchParam, setSearchParam] = useState('');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  // Filter helper functions based on report type
  const getFilteredReportData = () => {
    switch (reportType) {
      case 'employees':
        return employees.filter(emp => {
          return emp.name.toLowerCase().includes(searchParam.toLowerCase()) || emp.id.includes(searchParam);
        });
      
      case 'attendance':
        return attendance.filter(att => {
          const empName = employees.find(e => e.id === att.employeeId)?.name || '';
          const matchesSearch = empName.toLowerCase().includes(searchParam.toLowerCase()) || att.employeeId.includes(searchParam);
          const matchesDate = att.date >= startDate && att.date <= endDate;
          return matchesSearch && matchesDate;
        });

      case 'leaves':
        return leaves.filter(lv => {
          const empName = employees.find(e => e.id === lv.employeeId)?.name || '';
          const matchesSearch = empName.toLowerCase().includes(searchParam.toLowerCase()) || lv.employeeId.includes(searchParam);
          const matchesDate = lv.startDate >= startDate && lv.endDate <= endDate;
          return matchesSearch && matchesDate;
        });

      case 'advances':
        return advances.filter(adv => {
          const empName = employees.find(e => e.id === adv.employeeId)?.name || '';
          const matchesSearch = empName.toLowerCase().includes(searchParam.toLowerCase()) || adv.employeeId.includes(searchParam);
          const matchesDate = adv.date >= startDate && adv.date <= endDate;
          return matchesSearch && matchesDate;
        });

      case 'rewards':
        return rewards.filter(rew => {
          const empName = employees.find(e => e.id === rew.employeeId)?.name || '';
          const matchesSearch = empName.toLowerCase().includes(searchParam.toLowerCase()) || rew.employeeId.includes(searchParam);
          const matchesDate = rew.date >= startDate && rew.date <= endDate;
          return matchesSearch && matchesDate;
        });

      case 'penalties':
        return penalties.filter(pen => {
          const empName = employees.find(e => e.id === pen.employeeId)?.name || '';
          const matchesSearch = empName.toLowerCase().includes(searchParam.toLowerCase()) || pen.employeeId.includes(searchParam);
          const matchesDate = pen.date >= startDate && pen.date <= endDate;
          return matchesSearch && matchesDate;
        });

      default:
        return [];
    }
  };

  const reportData = getFilteredReportData();

  // CSV Excel export simulation
  const handleExportCSV = async () => {
    if (FallbackStorage.isCanonicalPersistenceRequired() && onCanonicalReportAudit) {
      const allowed = await onCanonicalReportAudit({ reportType, format: 'csv', startDate, endDate, rowCount: reportData.length });
      if (!allowed) return;
    }
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    if (reportType === 'employees') {
      csvContent += "كود الموظف,الاسم الكامل,القسم,المسمى الوظيفي,الراتب الأساسي,تاريخ التعيين,الحالة\n";
      (reportData as HREmployee[]).forEach(e => {
        const d = departments.find(dep => dep.id === e.departmentId)?.nameAr || '';
        const j = jobs.find(jb => j.id === e.jobId)?.titleAr || '';
        csvContent += `${e.id},${e.name},${d},${j},${e.basicSalary},${e.hiringDate},${e.status}\n`;
      });
    } else if (reportType === 'attendance') {
      csvContent += "الموظف,التاريخ,الحالة,وقت الدخول,وقت الخروج,التأخير (دقيقة),الإضافي (ساعة)\n";
      (reportData as HRAttendance[]).forEach(a => {
        const empName = employees.find(e => e.id === a.employeeId)?.name || '';
        csvContent += `${empName},${a.date},${a.status},${a.checkIn || ''},${a.checkOut || ''},${a.delayMinutes},${a.overtimeHours}\n`;
      });
    } else if (reportType === 'leaves') {
      csvContent += "الموظف,نوع الإجازة,من تاريخ,إلى تاريخ,السبب,حالة الطلب\n";
      (reportData as HRLeave[]).forEach(l => {
        const empName = employees.find(e => e.id === l.employeeId)?.name || '';
        csvContent += `${empName},${l.type},${l.startDate},${l.endDate},${l.reason},${l.status}\n`;
      });
    } else if (reportType === 'advances') {
      csvContent += "الموظف,المبلغ,التاريخ,عدد الأقساط,القسط الشهري,المتبقي,الحالة\n";
      (reportData as HRAdvance[]).forEach(ad => {
        const empName = employees.find(e => e.id === ad.employeeId)?.name || '';
        csvContent += `${empName},${ad.amount},${ad.date},${ad.installments},${ad.deductionPerMonth},${ad.remainingAmount},${ad.status}\n`;
      });
    } else if (reportType === 'rewards') {
      csvContent += "الموظف,المبلغ,التاريخ,السبب,الحالة\n";
      (reportData as HRBonus[]).forEach(r => {
        const empName = employees.find(e => e.id === r.employeeId)?.name || '';
        csvContent += `${empName},${r.amount},${r.date},${r.reason},${r.status}\n`;
      });
    } else if (reportType === 'penalties') {
      csvContent += "الموظف,نوع الجزاء,التاريخ,المبلغ / الخصم,السبب,الحالة\n";
      (reportData as HRPenalty[]).forEach(p => {
        const empName = employees.find(e => e.id === p.employeeId)?.name || '';
        csvContent += `${empName},${p.type},${p.date},${p.amount},${p.reason},${p.status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_الموارد_البشرية_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('✓ تم تصدير التقرير المالي المفلتر بصيغة CSV بنجاح', 'success');
  };

  // Browser Print Preview trigger
  const handlePrintReport = async () => {
    if (FallbackStorage.isCanonicalPersistenceRequired() && onCanonicalReportAudit) {
      const allowed = await onCanonicalReportAudit({ reportType, format: 'print', startDate, endDate, rowCount: reportData.length });
      if (!allowed) return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableHTML = '';
    let reportTitle = '';

    if (reportType === 'employees') {
      reportTitle = 'تقرير قائمة كادر العاملين والموظفين والوظائف';
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>كود الموظف</th>
              <th>الاسم الكامل</th>
              <th>القسم</th>
              <th>المسمى الوظيفي</th>
              <th>الراتب الأساسي</th>
              <th>تاريخ التعيين</th>
              <th>الحالة الوظيفية</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData as HREmployee[]).map(e => `
              <tr>
                <td>${e.id}</td>
                <td>${e.name}</td>
                <td>${departments.find(d => d.id === e.departmentId)?.nameAr || '-'}</td>
                <td>${jobs.find(j => j.id === e.jobId)?.titleAr || '-'}</td>
                <td>${formatCurrency(e.basicSalary, true)}</td>
                <td>${e.hiringDate}</td>
                <td>${e.status === 'active' ? 'على رأس العمل' : 'إجازة / معلق'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'attendance') {
      reportTitle = 'تقرير سجلات وتفاصيل حضور وانصراف الموظفين';
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>الموظف</th>
              <th>التاريخ</th>
              <th>الحالة</th>
              <th>وقت الدخول</th>
              <th>وقت الخروج</th>
              <th>التأخير (دقيقة)</th>
              <th>الإضافي (ساعة)</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData as HRAttendance[]).map(a => `
              <tr>
                <td>${employees.find(e => e.id === a.employeeId)?.name || a.employeeId}</td>
                <td>${a.date}</td>
                <td>${a.status === 'present' ? 'حضور' : a.status === 'late' ? 'تأخر' : 'غياب'}</td>
                <td>${a.checkIn || '-'}</td>
                <td>${a.checkOut || '-'}</td>
                <td>${a.delayMinutes || '0'}</td>
                <td>${a.overtimeHours || '0'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'leaves') {
      reportTitle = 'تقرير بيان الإجازات والإخلاءات السنوية والمرضية';
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>الموظف</th>
              <th>نوع الإجازة</th>
              <th>من تاريخ</th>
              <th>إلى تاريخ</th>
              <th>السبب</th>
              <th>حالة الاعتماد</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData as HRLeave[]).map(l => `
              <tr>
                <td>${employees.find(e => e.id === l.employeeId)?.name || l.employeeId}</td>
                <td>${l.type === 'annual' ? 'سنوية' : l.type === 'sick' ? 'مرضية' : 'طارئة'}</td>
                <td>${l.startDate}</td>
                <td>${l.endDate}</td>
                <td>${l.reason || '-'}</td>
                <td>${l.status === 'approved' ? 'معتمدة' : 'تحت الطلب'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'advances') {
      reportTitle = 'تقرير السلف والقروض والجدولة المالية لمستحقات العاملين';
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>الموظف</th>
              <th>مبلغ السلفة</th>
              <th>التاريخ</th>
              <th>عدد الأقساط</th>
              <th>القسط الشهري</th>
              <th>الرصيد المتبقي</th>
              <th>الحالة المالية</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData as HRAdvance[]).map(ad => `
              <tr>
                <td>${employees.find(e => e.id === ad.employeeId)?.name || ad.employeeId}</td>
                <td>${formatCurrency(ad.amount, true)}</td>
                <td>${ad.date}</td>
                <td>${ad.installments}</td>
                <td>${formatCurrency(ad.deductionPerMonth, true)}</td>
                <td>${formatCurrency(ad.remainingAmount, true)}</td>
                <td>${ad.status === 'approved' ? 'نشطة ومستردة' : 'مستردة بالكامل'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'rewards') {
      reportTitle = 'تقرير المكافآت المالية والتحفيزات الاستثنائية المعتمدة';
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>الموظف</th>
              <th>قيمة المكافأة</th>
              <th>التاريخ</th>
              <th>السبب الإداري والمناسبة</th>
              <th>حالة الصرف</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData as HRBonus[]).map(r => `
              <tr>
                <td>${employees.find(e => e.id === r.employeeId)?.name || r.employeeId}</td>
                <td>${formatCurrency(r.amount, true)}</td>
                <td>${r.date}</td>
                <td>${r.reason}</td>
                <td>صُرفت ومُرحلة</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'penalties') {
      reportTitle = 'تقرير الجزاءات والخصومات والاستقطاعات المسجلة';
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>الموظف</th>
              <th>نوع الجزاء</th>
              <th>التاريخ</th>
              <th>القيمة المخصومة</th>
              <th>السبب المخالف</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData as HRPenalty[]).map(p => `
              <tr>
                <td>${employees.find(e => e.id === p.employeeId)?.name || p.employeeId}</td>
                <td>${p.type === 'deduction' ? 'خصم مالي' : 'تنبيه إداري'}</td>
                <td>${p.date}</td>
                <td>${formatCurrency(p.amount, true)}</td>
                <td>${p.reason}</td>
                <td>نافذة ومستقطعة</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #dfb55a; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 5px 0; font-size: 22px; color: #1e293b; }
          .meta-info { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
          th { background-color: #f1f5f9; color: #1e293b; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>مدرسة النور الدولية بالمنظومة الموحدة</h2>
          <h1>${reportTitle}</h1>
        </div>

        <div class="meta-info">
          <div>تاريخ استخراج التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
          <div>الفترة الزمنية المختارة: من ${startDate} إلى ${endDate}</div>
        </div>

        ${tableHTML}

        <div class="footer">
          <p>© نظام التقارير الإدارية والمالية الشامل لقطاع الموارد البشرية - ERP Suite</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Selector of Reports Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <button 
          onClick={() => setReportType('employees')}
          className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-2 ${
            reportType === 'employees' 
              ? 'bg-[#dfb55a]/10 border-[#dfb55a] text-[#dfb55a] font-bold shadow' 
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">دليل العاملين</span>
        </button>

        <button 
          onClick={() => setReportType('attendance')}
          className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-2 ${
            reportType === 'attendance' 
              ? 'bg-[#dfb55a]/10 border-[#dfb55a] text-[#dfb55a] font-bold shadow' 
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-xs">سجل الحضور</span>
        </button>

        <button 
          onClick={() => setReportType('leaves')}
          className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-2 ${
            reportType === 'leaves' 
              ? 'bg-[#dfb55a]/10 border-[#dfb55a] text-[#dfb55a] font-bold shadow' 
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <CalendarX className="w-5 h-5" />
          <span className="text-xs">بيان الإجازات</span>
        </button>

        <button 
          onClick={() => setReportType('advances')}
          className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-2 ${
            reportType === 'advances' 
              ? 'bg-[#dfb55a]/10 border-[#dfb55a] text-[#dfb55a] font-bold shadow' 
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-xs">جدولة السلف</span>
        </button>

        <button 
          onClick={() => setReportType('rewards')}
          className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-2 ${
            reportType === 'rewards' 
              ? 'bg-[#dfb55a]/10 border-[#dfb55a] text-[#dfb55a] font-bold shadow' 
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-xs">المكافآت والتحفيز</span>
        </button>

        <button 
          onClick={() => setReportType('penalties')}
          className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-2 ${
            reportType === 'penalties' 
              ? 'bg-[#dfb55a]/10 border-[#dfb55a] text-[#dfb55a] font-bold shadow' 
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-xs">الخصومات والجزاءات</span>
        </button>
      </div>

      {/* Control filters bar */}
      <div className="bg-slate-900/40 p-4 border border-slate-700 flex flex-col md:flex-row items-center gap-4 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث ضمن نتائج التقرير بالموظف..."
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-4 py-2 text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Date parameters (not applicable for basic employees list) */}
        {reportType !== 'employees' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-400 shrink-0">من:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
            />
            <span className="text-slate-400 shrink-0">إلى:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
            />
          </div>
        )}

        {/* Action triggers */}
        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          <button 
            onClick={handlePrintReport}
            className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg flex items-center gap-1.5 font-bold transition-all"
          >
            <Printer className="w-4 h-4 text-[#dfb55a]" />
            <span>معاينة للطباعة</span>
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-[#dfb55a] px-4 py-2 rounded-lg flex items-center gap-1.5 font-bold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Real-time structured report output */}
      <div className="bg-slate-900/60 border border-slate-800 overflow-hidden shadow-md">
        {reportData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-bounce" />
            <p className="font-bold">لم يتم رصد أو العثور على أي بيانات مطابقة لمعايير هذا التقرير حالياً.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-850 border-b border-slate-700 text-slate-400 font-bold uppercase">
                  {reportType === 'employees' && (
                    <>
                      <th className="p-4">كود الموظف</th>
                      <th className="p-4">الاسم الكامل</th>
                      <th className="p-4">القسم والوظيفة</th>
                      <th className="p-4 text-center">الراتب الأساسي</th>
                      <th className="p-4 text-center">تاريخ التعيين</th>
                      <th className="p-4 text-center">الحالة</th>
                    </>
                  )}
                  {reportType === 'attendance' && (
                    <>
                      <th className="p-4">الموظف</th>
                      <th className="p-4 text-center">التاريخ</th>
                      <th className="p-4 text-center">الحالة</th>
                      <th className="p-4 text-center">الدخول</th>
                      <th className="p-4 text-center">الخروج</th>
                      <th className="p-4 text-center">التأخر (د)</th>
                      <th className="p-4 text-center">الإضافي (س)</th>
                    </>
                  )}
                  {reportType === 'leaves' && (
                    <>
                      <th className="p-4">الموظف</th>
                      <th className="p-4">نوع الإجازة</th>
                      <th className="p-4 text-center">من تاريخ</th>
                      <th className="p-4 text-center">إلى تاريخ</th>
                      <th className="p-4">السبب الإداري</th>
                      <th className="p-4 text-center">الحالة المعتمدة</th>
                    </>
                  )}
                  {reportType === 'advances' && (
                    <>
                      <th className="p-4">الموظف</th>
                      <th className="p-4 text-center">قيمة السلفة</th>
                      <th className="p-4 text-center">التاريخ</th>
                      <th className="p-4 text-center">الأقساط</th>
                      <th className="p-4 text-center">الخصم الشهري</th>
                      <th className="p-4 text-center">الرصيد المتبقي</th>
                      <th className="p-4 text-center">حالة السلفة</th>
                    </>
                  )}
                  {reportType === 'rewards' && (
                    <>
                      <th className="p-4">الموظف</th>
                      <th className="p-4 text-center">قيمة المكافأة</th>
                      <th className="p-4 text-center">التاريخ المالي</th>
                      <th className="p-4">الموجب أو المناسبة</th>
                      <th className="p-4 text-center">الحالة</th>
                    </>
                  )}
                  {reportType === 'penalties' && (
                    <>
                      <th className="p-4">الموظف</th>
                      <th className="p-4 text-center">نوع المخالفة</th>
                      <th className="p-4 text-center">التاريخ</th>
                      <th className="p-4 text-center">مبلغ الخصم</th>
                      <th className="p-4">السبب الإداري المباشر</th>
                      <th className="p-4 text-center">حالة الجزاء</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {reportData.map((item: any, idx: number) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      {reportType === 'employees' && (
                        <>
                          <td className="p-4 font-mono font-bold text-slate-400">{item.id}</td>
                          <td className="p-4 font-bold text-white">{item.name}</td>
                          <td className="p-4">
                            <span className="block text-slate-200">{jobs.find(j => j.id === item.jobId)?.titleAr}</span>
                            <span className="text-[10px] text-slate-400">{departments.find(d => d.id === item.departmentId)?.nameAr}</span>
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-emerald-400">{formatCurrency(item.basicSalary, true)}</td>
                          <td className="p-4 text-center font-mono text-slate-400">{item.hiringDate}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>{item.status === 'active' ? 'نشط' : 'إجازة / موقوف'}</span>
                          </td>
                        </>
                      )}
                      {reportType === 'attendance' && (
                        <>
                          <td className="p-4 font-bold text-white">{employees.find(e => e.id === item.employeeId)?.name || item.employeeId}</td>
                          <td className="p-4 text-center font-mono text-slate-400">{item.date}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              item.status === 'present' ? 'bg-emerald-500/10 text-emerald-400' :
                              item.status === 'late' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>{item.status === 'present' ? 'حضور' : item.status === 'late' ? 'متأخر' : 'غائب'}</span>
                          </td>
                          <td className="p-4 text-center font-mono">{item.checkIn || '-'}</td>
                          <td className="p-4 text-center font-mono">{item.checkOut || '-'}</td>
                          <td className="p-4 text-center font-mono text-amber-500">{item.delayMinutes || '0'}</td>
                          <td className="p-4 text-center font-mono text-emerald-400">{item.overtimeHours || '0'}</td>
                        </>
                      )}
                      {reportType === 'leaves' && (
                        <>
                          <td className="p-4 font-bold text-white">{employees.find(e => e.id === item.employeeId)?.name || item.employeeId}</td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-200">{item.type === 'annual' ? 'إجازة سنوية ثانوية' : item.type === 'sick' ? 'إجازة مرضية معتمدة' : 'إجازة طارئة'}</span>
                          </td>
                          <td className="p-4 text-center font-mono text-slate-400">{item.startDate}</td>
                          <td className="p-4 text-center font-mono text-slate-400">{item.endDate}</td>
                          <td className="p-4 text-slate-300">{item.reason || '-'}</td>
                          <td className="p-4 text-center">
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">معتمدة ومقاصة</span>
                          </td>
                        </>
                      )}
                      {reportType === 'advances' && (
                        <>
                          <td className="p-4 font-bold text-white">{employees.find(e => e.id === item.employeeId)?.name || item.employeeId}</td>
                          <td className="p-4 text-center font-mono font-bold text-emerald-400">{formatCurrency(item.amount, true)}</td>
                          <td className="p-4 text-center font-mono text-slate-400">{item.date}</td>
                          <td className="p-4 text-center font-mono">{item.installments} شهور</td>
                          <td className="p-4 text-center font-mono text-rose-400">{formatCurrency(item.deductionPerMonth, true)}</td>
                          <td className="p-4 text-center font-mono text-amber-500">{formatCurrency(item.remainingAmount, true)}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              item.remainingAmount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>{item.remainingAmount > 0 ? 'جارية التحصيل' : 'مستردة بالكامل'}</span>
                          </td>
                        </>
                      )}
                      {reportType === 'rewards' && (
                        <>
                          <td className="p-4 font-bold text-white">{employees.find(e => e.id === item.employeeId)?.name || item.employeeId}</td>
                          <td className="p-4 text-center font-mono font-bold text-emerald-400">{formatCurrency(item.amount, true)}</td>
                          <td className="p-4 text-center font-mono text-slate-400">{item.date}</td>
                          <td className="p-4 font-semibold text-slate-300">{item.reason}</td>
                          <td className="p-4 text-center">
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">مدرجة ومسواة</span>
                          </td>
                        </>
                      )}
                      {reportType === 'penalties' && (
                        <>
                          <td className="p-4 font-bold text-white">{employees.find(e => e.id === item.employeeId)?.name || item.employeeId}</td>
                          <td className="p-4 text-center">
                            <span className="text-rose-400 font-semibold">{item.type === 'deduction' ? 'خصم مالي مباشر' : 'إنذار كتابي'}</span>
                          </td>
                          <td className="p-4 text-center font-mono text-slate-400">{item.date}</td>
                          <td className="p-4 text-center font-mono font-bold text-rose-400">{formatCurrency(item.amount, true)}</td>
                          <td className="p-4 text-slate-300">{item.reason}</td>
                          <td className="p-4 text-center">
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded text-[10px]">نافذة</span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
