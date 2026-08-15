import { AlertCircle, ArrowLeftRight, Calendar, Check, ChevronLeft, ChevronRight, Clock, Cpu, Database, Filter, Fingerprint, RefreshCw, Search, Sparkles, ThumbsUp, UserCheck, UserMinus, UserX, Wifi, X } from 'lucide-react';
import React, { useState } from 'react';
import { HREmployee, HRAttendance, HRDepartment, HRSettings } from './types';

interface AttendanceTabProps {
  employees: HREmployee[];
  attendance: HRAttendance[];
  setAttendance: React.Dispatch<React.SetStateAction<HRAttendance[]>>;
  departments: HRDepartment[];
  settings: HRSettings;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'error') => void;
  costCenterLabels: Record<string, string>;
}

export default function AttendanceTab({
  employees,
  attendance,
  setAttendance,
  departments,
  settings,
  triggerNotification,
  costCenterLabels
}: AttendanceTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [ccFilter, setCcFilter] = useState('all');

  // Biometric fingerprint simulator state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  const handleFingerprintSync = () => {
    setIsSyncing(true);
    setShowSyncPanel(true);
    setSyncLogs([
      "📡 جاري الاتصال بخادم بوابة قارئ البصمات البيومتري IP: 192.168.1.250...",
      "🔌 تم تأسيس اتصال مشفر وآمن TLS 1.3 مع الأجهزة (عدد 4 قارئ في المداخل والمخارج)",
      "🔍 سحب وتفريغ ملفات سجل البصمات الفورية (Logs) لتاريخ اليوم..."
    ]);

    setTimeout(() => {
      setSyncLogs(prev => [
        ...prev,
        "📦 تم جلب عدد 142 سجل بصمة خام من الذاكرة المؤقتة للأجهزة الموزعة.",
        "⚙️ جاري مطابقة كود البصمة الفريد مع الأرقام الوظيفية للكادر التعليمي والإداري...",
        "🔏 التحقق من سلامة البيانات والتحقق الرقمي المزدوج لمنع انتحال الهوية..."
      ]);
    }, 1200);

    setTimeout(() => {
      let count = 0;
      let lateCount = 0;
      const newAttendanceList = [...attendance];

      employees.forEach(emp => {
        if (emp.status === 'resigned' || emp.status === 'suspended') return;

        // Skip if already has record that is present/late/excused to protect manual custom entries
        const existingRecord = attendance.find(a => a.employeeId === emp.id && a.date === selectedDate);
        if (existingRecord && existingRecord.status !== 'absent') return;

        // Randomize attendance: 88% present, 8% late, 4% absent
        const rand = Math.random();
        let status: 'present' | 'late' | 'absent' = 'present';
        let checkIn = '07:50';
        let checkOut = '15:05';
        let delayMinutes = 0;
        let overtimeHours = 0;

        if (rand > 0.96) {
          status = 'absent';
        } else if (rand > 0.88) {
          status = 'late';
          // between 08:05 and 08:45
          const mins = Math.floor(Math.random() * 40) + 5;
          checkIn = `08:${mins.toString().padStart(2, '0')}`;
          delayMinutes = mins;
          lateCount++;
        } else {
          // present - between 07:45 and 08:00
          const mins = Math.floor(Math.random() * 15);
          checkIn = `07:${(45 + mins).toString()}`;
          // random checkout between 15:00 and 15:30
          const outMins = Math.floor(Math.random() * 30);
          checkOut = `15:${outMins.toString().padStart(2, '0')}`;
          overtimeHours = parseFloat((outMins / 60).toFixed(1));
        }

        const recordId = `ATT-${emp.id}-${selectedDate}`;
        const existingIdx = newAttendanceList.findIndex(a => a.employeeId === emp.id && a.date === selectedDate);

        if (status !== 'absent') {
          const updated: HRAttendance = {
            id: recordId,
            employeeId: emp.id,
            date: selectedDate,
            status,
            checkIn,
            checkOut,
            delayMinutes,
            overtimeHours
          };

          if (existingIdx >= 0) {
            newAttendanceList[existingIdx] = updated;
          } else {
            newAttendanceList.push(updated);
          }
          count++;
        } else {
          // explicitly mark absent in the list
          const updated: HRAttendance = {
            id: recordId,
            employeeId: emp.id,
            date: selectedDate,
            status: 'absent',
            delayMinutes: 0,
            overtimeHours: 0
          };
          if (existingIdx >= 0) {
            newAttendanceList[existingIdx] = updated;
          } else {
            newAttendanceList.push(updated);
          }
        }
      });

      setAttendance(newAttendanceList);
      setIsSyncing(false);
      setSyncLogs(prev => [
        ...prev,
        `✅ تم التزامن التام بنجاح!`,
        `📊 الملخص الإحصائي: تم سحب وإدراج حضور لعدد ${count} موظفاً (منهم ${lateCount} متأخرين عن وقت المباشرة الفعلي).`,
        `💾 تم ترحيل التغييرات تلقائياً وحفظ القيود في قاعدة البيانات وسجل العمليات المركزي للرقابة.`
      ]);
      triggerNotification(`✓ تم مزامنة وسحب بصمات الموظفين بنجاح وتحديث السجل المركزي!`, 'success');
    }, 2500);
  };

  // Change date helper
  const handleDateShift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Get attendance record for employee on selectedDate or default new record
  const getAttendanceRecord = (empId: string): HRAttendance => {
    const found = attendance.find(a => a.employeeId === empId && a.date === selectedDate);
    if (found) return found;
    
    return {
      id: `ATT-${empId}-${selectedDate}`,
      employeeId: empId,
      date: selectedDate,
      status: 'absent', // default to absent until checked in
      delayMinutes: 0,
      overtimeHours: 0
    };
  };

  // Update a single attendance attribute
  const updateAttendance = (empId: string, status: 'present' | 'absent' | 'late' | 'excused', fields: Partial<HRAttendance>) => {
    const recordId = `ATT-${empId}-${selectedDate}`;
    const existingIdx = attendance.findIndex(a => a.employeeId === empId && a.date === selectedDate);
    
    const baseRecord: HRAttendance = existingIdx >= 0 ? attendance[existingIdx] : {
      id: recordId,
      employeeId: empId,
      date: selectedDate,
      status: 'absent',
      delayMinutes: 0,
      overtimeHours: 0
    };

    const updatedRecord = {
      ...baseRecord,
      status,
      ...fields
    };

    // calculate delay if status is late
    if (updatedRecord.checkIn && status === 'late') {
      const [sh, sm] = settings.workingHoursStart.split(':').map(Number);
      const [ah, am] = updatedRecord.checkIn.split(':').map(Number);
      const delay = (ah * 60 + am) - (sh * 60 + sm);
      updatedRecord.delayMinutes = Math.max(0, delay);
    } else if (status !== 'late') {
      updatedRecord.delayMinutes = 0;
    }

    // calculate overtime
    if (updatedRecord.checkOut && (status === 'present' || status === 'late')) {
      const [eh, em] = settings.workingHoursEnd.split(':').map(Number);
      const [oh, om] = updatedRecord.checkOut.split(':').map(Number);
      const overtime = (oh * 60 + om) - (eh * 60 + em);
      updatedRecord.overtimeHours = Math.max(0, parseFloat((overtime / 60).toFixed(1)));
    } else {
      updatedRecord.overtimeHours = 0;
    }

    if (existingIdx >= 0) {
      setAttendance(prev => prev.map((item, idx) => idx === existingIdx ? updatedRecord : item));
    } else {
      setAttendance(prev => [...prev, updatedRecord]);
    }
  };

  // Batch mark all filtered employees as Present
  const handleBatchPresent = () => {
    let count = 0;
    const nowStr = settings.workingHoursStart;
    const checkOutStr = settings.workingHoursEnd;

    const newAttendanceList = [...attendance];

    filteredEmployees.forEach(emp => {
      const idx = newAttendanceList.findIndex(a => a.employeeId === emp.id && a.date === selectedDate);
      const record = idx >= 0 ? newAttendanceList[idx] : {
        id: `ATT-${emp.id}-${selectedDate}`,
        employeeId: emp.id,
        date: selectedDate,
        status: 'absent',
        delayMinutes: 0,
        overtimeHours: 0
      };

      if (record.status !== 'present' && record.status !== 'late') {
        const updated = {
          ...record,
          status: 'present' as const,
          checkIn: nowStr,
          checkOut: checkOutStr,
          delayMinutes: 0,
          overtimeHours: 0
        };

        if (idx >= 0) {
          newAttendanceList[idx] = updated;
        } else {
          newAttendanceList.push(updated);
        }
        count++;
      }
    });

    setAttendance(newAttendanceList);
    triggerNotification(`✓ تم رصد حضور جماعي لعدد ${count} موظفاً في هذا التاريخ`, 'success');
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.departmentId === deptFilter;
    const matchesCC = ccFilter === 'all' || emp.costCenter === ccFilter;
    return matchesSearch && matchesDept && matchesCC && emp.status !== 'resigned';
  });

  // Calculate daily stats for filtered
  const stats = filteredEmployees.reduce((acc, emp) => {
    const record = attendance.find(a => a.employeeId === emp.id && a.date === selectedDate);
    if (!record) {
      acc.absent++;
    } else if (record.status === 'present') {
      acc.present++;
    } else if (record.status === 'late') {
      acc.late++;
      acc.totalDelay += record.delayMinutes;
    } else if (record.status === 'excused') {
      acc.excused++;
    } else {
      acc.absent++;
    }
    return acc;
  }, { present: 0, late: 0, absent: 0, excused: 0, totalDelay: 0 });

  return (
    <div className="space-y-6">
      
      {/* Date & Batch Actions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-900/40 p-5 border border-slate-700">
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 justify-center md:justify-start">
          <button 
            onClick={() => handleDateShift(1)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            title="اليوم التالي"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <Calendar className="absolute right-3 top-2 w-4 h-4 text-[#dfb55a]" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#dfb55a] font-mono"
            />
          </div>

          <button 
            onClick={() => handleDateShift(-1)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            title="اليوم السابق"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Quick KPI stats for the day */}
        <div className="flex justify-center gap-4 text-center">
          <div className="bg-slate-800/60 border border-slate-800 px-3 py-1 rounded-lg">
            <span className="text-[10px] text-slate-500 block">الحضور</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{stats.present + stats.late}</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-800 px-3 py-1 rounded-lg">
            <span className="text-[10px] text-slate-500 block">الغياب</span>
            <span className="text-xs font-bold text-rose-400 font-mono">{stats.absent}</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-800 px-3 py-1 rounded-lg">
            <span className="text-[10px] text-slate-500 block">التأخر</span>
            <span className="text-xs font-bold text-amber-400 font-mono">{stats.late}</span>
          </div>
          {stats.late > 0 && (
            <div className="bg-slate-800/60 border border-slate-800 px-3 py-1 rounded-lg">
              <span className="text-[10px] text-slate-500 block">متوسط التأخر</span>
              <span className="text-xs font-bold text-amber-500 font-mono">{Math.round(stats.totalDelay / stats.late)} د</span>
            </div>
          )}
        </div>

        {/* Batch marking & Biometric Sync */}
        <div className="flex justify-center md:justify-end gap-2">
          <button 
            onClick={() => setShowSyncPanel(!showSyncPanel)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow transition-colors"
          >
            <Fingerprint className="w-4 h-4 text-[#dfb55a]" />
            <span>بوابة قارئ البصمة</span>
          </button>

          <button 
            onClick={handleBatchPresent}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>تسجيل حضور جماعي للمفلترين</span>
          </button>
        </div>

      </div>

      {/* Biometric Fingerprint Sync Terminal Panel */}
      {showSyncPanel && (
        <div className="bg-slate-950/80 border border-slate-800 p-5 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-[#dfb55a]/5 rounded-full blur-2xl" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#dfb55a]/10 text-[#dfb55a] rounded-lg">
                <Fingerprint className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>محاكي نظام بصمة الموظفين المتكامل الذكي</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500">مزامنة تامة فورية مع قارئات البصمة البيومترية الموزعة على مداخل ومخارج المدرسة</p>
              </div>
            </div>
            
            <button 
              disabled={isSyncing}
              onClick={handleFingerprintSync}
              type="button"
              className={`px-4.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                isSyncing 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#dfb55a] to-[#c99e4c] text-slate-950 hover:opacity-90 shadow-md'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? "جاري سحب البصمات..." : "تزامن وسحب البصمات الآن"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[10px] text-slate-400 min-h-[120px] max-h-[160px] overflow-y-auto space-y-1">
              <div className="text-slate-500 pb-1 border-b border-slate-800 flex items-center justify-between">
                <span>💻 كونسول الاتصال وبوابة البصمة الذكية</span>
                <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-[#dfb55a]">ACTIVE CONNECTION</span>
              </div>
              {syncLogs.length === 0 ? (
                <div className="text-slate-600 italic pt-6 text-center">اضغط على زر التزامن لسحب البصمات وتحديث قاعدة البيانات مباشرة لليوم المحدد.</div>
              ) : (
                syncLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    <span className="text-slate-600 select-none">❯</span>
                    <span className={log.includes('✅') ? 'text-emerald-400 font-bold' : log.includes('📊') ? 'text-[#dfb55a]' : 'text-slate-300'}>{log}</span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 block mb-2">حالة الاتصال والعتاد البيومتري</span>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">بوابة الاتصال:</span>
                  <span className="text-[#dfb55a] font-bold font-mono">192.168.1.250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">حالة الخادم:</span>
                  <span className="text-emerald-400 font-bold">متصل (Online)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">أجهزة القارئ:</span>
                  <span className="text-slate-300 font-mono">4 أجهزة بيومترية نشطة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">آخر تزامن تلقائي:</span>
                  <span className="text-slate-500 font-mono">{selectedDate} 08:30 ص</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-slate-900/30 p-4 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="ابحث باسم الموظف أو الكود لرصد الحضور..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto shrink-0">
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">كل الأقسام</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.nameAr}</option>
            ))}
          </select>

          <select 
            value={ccFilter}
            onChange={(e) => setCcFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">كل مراكز التكلفة</option>
            {Object.entries(costCenterLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Logging Table */}
      <div className="bg-slate-900/60 border border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-[11px] text-slate-400 font-bold">
                <th className="p-4">الموظف</th>
                <th className="p-4">القسم والوظيفة</th>
                <th className="p-4 text-center">الوردية الرسمية</th>
                <th className="p-4 text-center">رصد الحالة الفورية</th>
                <th className="p-4 text-center">وقت الحضور</th>
                <th className="p-4 text-center">وقت الانصراف</th>
                <th className="p-4 text-center">التأخير (دقيقة)</th>
                <th className="p-4 text-center">الإضافي (ساعة)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredEmployees.map(emp => {
                const rec = getAttendanceRecord(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <div>
                        <span>{emp.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">{emp.id} • {costCenterLabels[emp.costCenter]}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-400 block">{departments.find(d => d.id === emp.departmentId)?.nameAr}</span>
                    </td>
                    <td className="p-4 text-center font-mono text-slate-400">
                      {settings.workingHoursStart} - {settings.workingHoursEnd}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => updateAttendance(emp.id, 'present', { checkIn: settings.workingHoursStart, checkOut: settings.workingHoursEnd })}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            rec.status === 'present' 
                              ? 'bg-emerald-500 text-slate-950 font-black' 
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          حاضر
                        </button>
                        <button 
                          onClick={() => updateAttendance(emp.id, 'late', { checkIn: '08:30', checkOut: settings.workingHoursEnd })}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            rec.status === 'late' 
                              ? 'bg-amber-500 text-slate-950 font-black' 
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          متأخر
                        </button>
                        <button 
                          onClick={() => updateAttendance(emp.id, 'absent', { checkIn: undefined, checkOut: undefined, delayMinutes: 0, overtimeHours: 0 })}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            rec.status === 'absent' 
                              ? 'bg-rose-500 text-slate-100 font-black' 
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          غائب
                        </button>
                        <button 
                          onClick={() => updateAttendance(emp.id, 'excused', { checkIn: undefined, checkOut: undefined, delayMinutes: 0, overtimeHours: 0 })}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            rec.status === 'excused' 
                              ? 'bg-yellow-500 text-slate-950 font-black' 
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          بإذن
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="time" 
                        disabled={rec.status === 'absent' || rec.status === 'excused'}
                        value={rec.checkIn || ''}
                        onChange={(e) => updateAttendance(emp.id, rec.status, { checkIn: e.target.value })}
                        className="bg-slate-800 border border-slate-700 rounded p-1 text-[11px] text-white focus:outline-none font-mono disabled:opacity-40"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="time" 
                        disabled={rec.status === 'absent' || rec.status === 'excused'}
                        value={rec.checkOut || ''}
                        onChange={(e) => updateAttendance(emp.id, rec.status, { checkOut: e.target.value })}
                        className="bg-slate-800 border border-slate-700 rounded p-1 text-[11px] text-white focus:outline-none font-mono disabled:opacity-40"
                      />
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-amber-500">
                      {rec.delayMinutes > 0 ? `${rec.delayMinutes} دقيقة` : '-'}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-emerald-400">
                      {rec.overtimeHours > 0 ? `${rec.overtimeHours} س` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
