import { AlertTriangle, Award, Bell, Briefcase, Building2, Calendar, Check, CheckCircle, ChevronLeft, Clock, Coins, FileSpreadsheet, FileText, FolderOpen, Home, Info, PieChart, Play, Scale, Settings2, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import EnterpriseActionToolbar from '../shared/EnterpriseActionToolbar';

import { 
  HREmployee, HRDepartment, HRJob, HRContract, HRAttendance, 
  HRLeave, HRPenalty, HRAdvance, HRBonus, HRPerformance, HRDocument, HRSettings,
  HRPayrollRun
} from './types';

import EmployeesTab from './EmployeesTab';
import AttendanceTab from './AttendanceTab';
import PayrollTab from './PayrollTab';
import ReportsTab from './ReportsTab';
import type { ReportType } from './ReportsTab';
import OtherHRTabs from './OtherHRTabs';
import { FallbackStorage } from '../../database/repositories/FallbackStorage';
import { getTrustedAccessToken } from '../../utils/auth';
import './hr-identity.css';

// Cost Center descriptive mapping
const costCenterLabels: Record<string, string> = {
  admin: 'الإدارة والعمومية (كود: 5001)',
  primary: 'التعليم الأساسي والابتدائي (كود: 5002)',
  secondary: 'التعليم الثانوي والإعدادي (كود: 5003)',
  kindergarten: 'رياض الأطفال والتمهيدي (كود: 5004)',
  middle: 'التعليم المتوسط (كود: 5005)'
};

interface HumanResourcesPortalProps {
  setActiveSection?: (section: string) => void;
  selectedSchool?: any;
}

export default function HumanResourcesPortal({ setActiveSection, selectedSchool }: HumanResourcesPortalProps) {
  const canonicalPersistenceRequired = FallbackStorage.isCanonicalPersistenceRequired();
  const [activeGroup, setActiveGroup] = useState<'employees_group' | 'attendance_group' | 'advances_group' | 'payroll_group' | 'reports_group'>('employees_group');
  const [activeTab, setActiveTab] = useState('employees');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Core database states (loaded from localStorage or initialized with professional seed data)
  const [employees, setEmployees] = useState<HREmployee[]>([]);
  const [departments, setDepartments] = useState<HRDepartment[]>([]);
  const [jobs, setJobs] = useState<HRJob[]>([]);
  const [contracts, setContracts] = useState<HRContract[]>([]);
  const [attendance, setAttendance] = useState<HRAttendance[]>([]);
  const [leaves, setLeaves] = useState<HRLeave[]>([]);
  const [penalties, setPenalties] = useState<HRPenalty[]>([]);
  const [advances, setAdvances] = useState<HRAdvance[]>([]);
  const [rewards, setRewards] = useState<HRBonus[]>([]);
  const [performance, setPerformance] = useState<HRPerformance[]>([]);
  const [documents, setDocuments] = useState<HRDocument[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<HRPayrollRun[]>([]);
  const [settings, setSettings] = useState<HRSettings>({
    workingHoursStart: '08:00',
    workingHoursEnd: '15:00',
    weekends: [5, 6],
    lateDeductionRate: 1.0,
    defaultBankSafeAccount: '1102',
    defaultSalariesExpenseAccount: '5101',
    payrollPayableAccount: '',
    advanceReceivableAccount: '',
    deductionClearingAccount: '',
    unpaidAbsenceDeduction: false,
    overtimeMultiplier: 0,
    workingHoursPerDay: 8
  });
  const canonicalVersionRef = useRef(0);
  const canonicalBaselineRef = useRef<string | null>(null);
  const canonicalSaveInFlightRef = useRef(false);

  // Global notification trigger helper
  const triggerNotification = (message: string, type: 'success' | 'warning' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const runPayrollWorkflow = async (period: string, action: 'approve' | 'pay'): Promise<boolean> => {
    try {
      const token = getTrustedAccessToken();
      if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
      const response = await fetch(`/api/hr/payroll-runs/${period}/${action}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedVersion: canonicalVersionRef.current })
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تنفيذ مسار الرواتب.');
      canonicalVersionRef.current = Number(payload?.meta?.version || canonicalVersionRef.current + 1);
      const returnedData = payload?.data;
      if (action === 'approve' && returnedData?.period) {
        const nextRuns = [...payrollRuns.filter(run => run.period !== period), returnedData as HRPayrollRun];
        setPayrollRuns(nextRuns);
        canonicalBaselineRef.current = JSON.stringify({ employees, departments, jobs, contracts, attendance, leaves, penalties, advances, rewards, performance, documents, payrollRuns: nextRuns, settings });
      } else if (action === 'pay' && returnedData?.period) {
        const nextRuns = payrollRuns.map(run => run.period === period ? { ...run, ...returnedData, status: 'paid' as const } : run);
        setPayrollRuns(nextRuns);
        canonicalBaselineRef.current = JSON.stringify({ employees, departments, jobs, contracts, attendance, leaves, penalties, advances, rewards, performance, documents, payrollRuns: nextRuns, settings });
      }
      triggerNotification(action === 'approve' ? 'تم اعتماد المسير دون إنشاء قيد.' : `تم تنفيذ الصرف وإثبات القيد ${payload?.data?.journalId || ''}.`, 'success');
      return true;
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر تنفيذ مسار الرواتب.', 'error');
      return false;
    }
  };

  const auditHrReport = async (payload: { reportType: ReportType; format: 'csv' | 'print'; startDate: string; endDate: string; rowCount: number }) => {
    try {
      const token = getTrustedAccessToken();
      if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
      const response = await fetch('/api/hr/reports/audit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result?.success) throw new Error(result?.message || 'تعذر تدقيق التقرير الكانوني.');
      return true;
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر تدقيق التقرير؛ لم يتم التصدير.', 'error');
      return false;
    }
  };

  const runAdvanceWorkflow = async (advanceId: string) => {
    try {
      const token = getTrustedAccessToken();
      if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
      const response = await fetch(`/api/hr/advances/${encodeURIComponent(advanceId)}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedVersion: canonicalVersionRef.current })
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تنفيذ صرف السلفة.');
      const nextAdvances = advances.map(item => item.id === advanceId ? { ...item, ...(payload.data?.advance || {}), journalId: payload.data?.journalId, paidAt: payload.data?.paidAt, paidBy: payload.data?.paidBy } : item);
      canonicalVersionRef.current = Number(payload?.meta?.version || canonicalVersionRef.current + 1);
      setAdvances(nextAdvances);
      canonicalBaselineRef.current = JSON.stringify({ employees, departments, jobs, contracts, attendance, leaves, penalties, advances: nextAdvances, rewards, performance, documents, payrollRuns, settings });
      triggerNotification(`تم صرف السلفة وإثبات القيد ${payload.data?.journalId || ''} مركزياً.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر تنفيذ صرف السلفة.', 'error');
    }
  };

  const runContractSigning = async (contractId: string) => {
    try {
      const token = getTrustedAccessToken();
      if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
      const response = await fetch(`/api/hr/contracts/${encodeURIComponent(contractId)}/sign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedVersion: canonicalVersionRef.current })
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر توقيع العقد.');
      const nextContracts = contracts.map(item => item.id === contractId ? { ...item, ...(payload.data?.contract || {}) } : item);
      canonicalVersionRef.current = Number(payload?.meta?.version || canonicalVersionRef.current + 1);
      setContracts(nextContracts);
      canonicalBaselineRef.current = JSON.stringify({ employees, departments, jobs, contracts: nextContracts, attendance, leaves, penalties, advances, rewards, performance, documents, payrollRuns, settings });
      triggerNotification('تم توقيع العقد واعتماده بختم سلامة خادمي.', 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر توقيع العقد.', 'error');
    }
  };

  // 1. Load canonical records in managed environments. Local seed data remains
  // strictly a development fallback and can never populate a managed school.
  useEffect(() => {
    if (canonicalPersistenceRequired) {
      let cancelled = false;
      const list = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
      const loadCanonicalHr = async () => {
        try {
          const token = getTrustedAccessToken();
          if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
          const response = await fetch('/api/hr/database', {
            headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
          });
          const payload = await response.json();
          if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تحميل سجل الموارد البشرية.');
          if (cancelled) return;
          const data = payload.data || {};
          const loadedSettings = data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)
            ? { ...settings, ...data.settings } : settings;
          const canonicalData = {
            employees: list<HREmployee>(data.employees), departments: list<HRDepartment>(data.departments),
            jobs: list<HRJob>(data.jobs), contracts: list<HRContract>(data.contracts),
            attendance: list<HRAttendance>(data.attendance), leaves: list<HRLeave>(data.leaves),
            penalties: list<HRPenalty>(data.penalties), advances: list<HRAdvance>(data.advances),
            rewards: list<HRBonus>(data.rewards), performance: list<HRPerformance>(data.performance),
            documents: list<HRDocument>(data.documents), payrollRuns: list<HRPayrollRun>(data.payrollRuns), settings: loadedSettings
          };
          canonicalVersionRef.current = Number(payload?.meta?.version || 0);
          canonicalBaselineRef.current = JSON.stringify(canonicalData);
          setEmployees(canonicalData.employees); setDepartments(canonicalData.departments); setJobs(canonicalData.jobs);
          setContracts(canonicalData.contracts); setAttendance(canonicalData.attendance); setLeaves(canonicalData.leaves);
          setPenalties(canonicalData.penalties); setAdvances(canonicalData.advances); setRewards(canonicalData.rewards);
          setPerformance(canonicalData.performance); setDocuments(canonicalData.documents); setSettings(loadedSettings);
          setPayrollRuns(canonicalData.payrollRuns);
        } catch (error: any) {
          if (!cancelled) triggerNotification(error?.message || 'تعذر تحميل سجل الموارد البشرية المركزي.', 'error');
        }
      };
      void loadCanonicalHr();
      return () => { cancelled = true; };
    }
    // Load or Seed Departments
    const savedDepts = localStorage.getItem('erp_hr_departments');
    let deptsList: HRDepartment[] = [];
    if (savedDepts) {
      deptsList = JSON.parse(savedDepts);
    } else {
      deptsList = [
        { id: 'DEP-001', code: 'ADMIN', nameAr: 'قسم الشؤون الإدارية العامة', nameEn: 'General Administration', managerId: 'EMP-001', costCenter: 'admin' },
        { id: 'DEP-002', code: 'EDU-PRM', nameAr: 'هيئة التعليم الأساسي والابتدائي', nameEn: 'Primary Education Staff', managerId: 'EMP-002', costCenter: 'primary' },
        { id: 'DEP-003', code: 'EDU-SEC', nameAr: 'هيئة التعليم الإعدادي والثانوي', nameEn: 'Secondary Education Staff', managerId: 'EMP-003', costCenter: 'secondary' }
      ];
      localStorage.setItem('erp_hr_departments', JSON.stringify(deptsList));
    }
    setDepartments(deptsList);

    // Load or Seed Jobs
    const savedJobs = localStorage.getItem('erp_hr_jobs');
    let jobsList: HRJob[] = [];
    if (savedJobs) {
      jobsList = JSON.parse(savedJobs);
    } else {
      jobsList = [
        { id: 'JOB-001', titleAr: 'المدير المالي والمسؤول الأعلى', titleEn: 'Chief Financial Officer', departmentId: 'DEP-001', grade: 'أ', baseSalary: 7500 },
        { id: 'JOB-002', titleAr: 'معلم لغة عربية أول', titleEn: 'Senior Arabic Teacher', departmentId: 'DEP-002', grade: 'ب', baseSalary: 4500 },
        { id: 'JOB-003', titleAr: 'معلم لغة إنجليزية أول', titleEn: 'Senior English Teacher', departmentId: 'DEP-003', grade: 'ب', baseSalary: 4800 },
        { id: 'JOB-004', titleAr: 'مشرف شؤون إدارية وعلاقات', titleEn: 'Admin Officer', departmentId: 'DEP-001', grade: 'ج', baseSalary: 3800 }
      ];
      localStorage.setItem('erp_hr_jobs', JSON.stringify(jobsList));
    }
    setJobs(jobsList);

    // Load or Seed Employees
    const savedEmployees = localStorage.getItem('erp_hr_employees');
    let employeesList: HREmployee[] = [];
    if (savedEmployees) {
      employeesList = JSON.parse(savedEmployees);
    } else {
      employeesList = [
        {
          id: 'EMP-001',
          name: 'عبدالرحمن سليمان المطيري',
          gender: 'male',
          birthDate: '1985-04-12',
          nationalId: '1092837461',
          phone: '+966501112223',
          email: 'a.almutairi@alnour.edu.sa',
          address: 'الرياض، المملكة العربية السعودية',
          degree: 'ماجستير',
          major: 'العلوم المالية وإدارة الأعمال',
          experienceYears: 10,
          trainingCourses: ['دورة الإدارة القيادية للمؤسسات'],
          bankName: 'مصرف الراجحي',
          iban: 'SA8080000000012345678901',
          departmentId: 'DEP-001',
          jobId: 'JOB-001',
          hiringDate: '2020-01-15',
          basicSalary: 7500,
          allowances: [
            { name: 'بدل السكن والفرص', amount: 1500 },
            { name: 'بدل التنقل والاتصال', amount: 500 }
          ],
          costCenter: 'admin',
          status: 'active',
          attachments: [
            { name: 'البطاقة الوطنية الشخصية.pdf', type: 'application/pdf', date: '2026-06-01', size: '100 KB' },
            { name: 'شهادة الماجستير المهنية.pdf', type: 'application/pdf', date: '2026-06-01', size: '250 KB' }
          ],
          auditLogs: [
            { action: 'تعديل الراتب الأساسي', date: '2026-06-01 10:00', user: 'أ. سليمان غازي', details: 'تعديل الراتب الأساسي من 7000 إلى 7500 بموجب اللائحة الجديدة' },
            { action: 'إنشاء ملف الموظف', date: '2020-01-15 08:30', user: 'مسؤول النظام', details: 'تسجيل وبناء الملف الإلكتروني للموظف بنجاح' }
          ]
        },
        {
          id: 'EMP-002',
          name: 'سارة خالد الدوسري',
          gender: 'female',
          birthDate: '1991-09-24',
          nationalId: '1083746192',
          phone: '+966503334445',
          email: 's.aldawsari@alnour.edu.sa',
          address: 'الرياض، السعودية',
          degree: 'بكالوريوس',
          major: 'التربية واللغة العربية',
          experienceYears: 4,
          trainingCourses: [],
          bankName: 'البنك الأهلي السعودي',
          iban: 'SA8040000000098765432109',
          departmentId: 'DEP-002',
          jobId: 'JOB-002',
          hiringDate: '2022-08-20',
          basicSalary: 4500,
          allowances: [
            { name: 'بدل سكن سنوي مضاف', amount: 1000 },
            { name: 'بدل تحضير وتطوير مناهج', amount: 300 }
          ],
          costCenter: 'primary',
          status: 'active',
          attachments: [],
          auditLogs: [
            { action: 'إنشاء ملف الموظف', date: '2022-08-20 09:00', user: 'مسؤول النظام', details: 'تحرير وتأسيس الملف الإداري للموظفة' }
          ]
        },
        {
          id: 'EMP-003',
          name: 'محمد شريف المصري',
          gender: 'male',
          birthDate: '1988-11-05',
          nationalId: '2093847562',
          phone: '+966505556667',
          email: 'm.elmasry@alnour.edu.sa',
          address: 'الرياض، العليا',
          degree: 'ليسانس',
          major: 'الآداب والتربية واللغة الإنجليزية',
          experienceYears: 8,
          trainingCourses: [],
          bankName: 'بنك الرياض',
          iban: 'SA8020000000055544433322',
          departmentId: 'DEP-003',
          jobId: 'JOB-003',
          hiringDate: '2021-09-01',
          basicSalary: 4800,
          allowances: [
            { name: 'بدل تحضير مناهج إضافية', amount: 400 }
          ],
          costCenter: 'secondary',
          status: 'active',
          attachments: [],
          auditLogs: [
            { action: 'إنشاء ملف الموظف', date: '2021-09-01 09:15', user: 'مسؤول النظام', details: 'تسجيل المباشرة وبناء الملف الرقمي للموظف' }
          ]
        }
      ];
      localStorage.setItem('erp_hr_employees', JSON.stringify(employeesList));
    }
    setEmployees(employeesList);

    // Load or Seed Contracts
    const savedContracts = localStorage.getItem('erp_hr_contracts');
    let contractsList: HRContract[] = [];
    if (savedContracts) {
      contractsList = JSON.parse(savedContracts);
    } else {
      contractsList = [
        { id: 'CON-2026-0001', employeeId: 'EMP-001', type: 'permanent', startDate: '2020-01-15', endDate: '2030-01-14', monthlySalary: 7500, status: 'active' },
        { id: 'CON-2026-0002', employeeId: 'EMP-002', type: 'fixed', startDate: '2022-08-20', endDate: '2027-08-19', monthlySalary: 4500, status: 'active' },
        { id: 'CON-2026-0003', employeeId: 'EMP-003', type: 'fixed', startDate: '2021-09-01', endDate: '2026-08-31', monthlySalary: 4800, status: 'active' }
      ];
      localStorage.setItem('erp_hr_contracts', JSON.stringify(contractsList));
    }
    setContracts(contractsList);

    // Load or Seed Attendance
    const savedAttendance = localStorage.getItem('erp_hr_attendance');
    let attendanceList: HRAttendance[] = [];
    if (savedAttendance) {
      attendanceList = JSON.parse(savedAttendance);
    } else {
      attendanceList = [];
      localStorage.setItem('erp_hr_attendance', JSON.stringify(attendanceList));
    }
    setAttendance(attendanceList);

    // Load or Seed Leaves
    const savedLeaves = localStorage.getItem('erp_hr_leaves');
    let leavesList: HRLeave[] = [];
    if (savedLeaves) {
      leavesList = JSON.parse(savedLeaves);
    } else {
      leavesList = [];
      localStorage.setItem('erp_hr_leaves', JSON.stringify(leavesList));
    }
    setLeaves(leavesList);

    // Load or Seed Penalties
    const savedPenalties = localStorage.getItem('erp_hr_penalties');
    let penaltiesList: HRPenalty[] = [];
    if (savedPenalties) {
      penaltiesList = JSON.parse(savedPenalties);
    } else {
      penaltiesList = [];
      localStorage.setItem('erp_hr_penalties', JSON.stringify(penaltiesList));
    }
    setPenalties(penaltiesList);

    // Load or Seed Advances
    const savedAdvances = localStorage.getItem('erp_hr_advances');
    let advancesList: HRAdvance[] = [];
    if (savedAdvances) {
      advancesList = JSON.parse(savedAdvances);
    } else {
      advancesList = [];
      localStorage.setItem('erp_hr_advances', JSON.stringify(advancesList));
    }
    setAdvances(advancesList);

    // Load or Seed Rewards
    const savedRewards = localStorage.getItem('erp_hr_rewards');
    let rewardsList: HRBonus[] = [];
    if (savedRewards) {
      rewardsList = JSON.parse(savedRewards);
    } else {
      rewardsList = [];
      localStorage.setItem('erp_hr_rewards', JSON.stringify(rewardsList));
    }
    setRewards(rewardsList);

    // Load or Seed Performance Evaluations
    const savedPerformance = localStorage.getItem('erp_hr_performance');
    let performanceList: HRPerformance[] = [];
    if (savedPerformance) {
      performanceList = JSON.parse(savedPerformance);
    } else {
      performanceList = [
        { id: 'EV-001', employeeId: 'EMP-001', date: '2025-12-28', score: 96, reviewer: 'أ. سليمان غازي', strengths: 'انضباط تام ودقة متناهية بالتقارير المالية والتحول الرقمي المزدوج', improvements: 'تدريب موظفين مساعدين للعمليات الدورية', trainingNeeds: 'حضور ندوات قيادية عالية الجودة' }
      ];
      localStorage.setItem('erp_hr_performance', JSON.stringify(performanceList));
    }
    setPerformance(performanceList);

    // Load or Seed Documents
    const savedDocuments = localStorage.getItem('erp_hr_documents');
    let documentsList: HRDocument[] = [];
    if (savedDocuments) {
      documentsList = JSON.parse(savedDocuments);
    } else {
      documentsList = [
        { id: 'DOC-001', employeeId: 'EMP-001', title: 'جواز سفر المطيري الإلكتروني', type: 'passport', issueDate: '2022-03-01', expiryDate: '2027-02-28', status: 'valid' }
      ];
      localStorage.setItem('erp_hr_documents', JSON.stringify(documentsList));
    }
    setDocuments(documentsList);
    
  }, [canonicalPersistenceRequired]);

  useEffect(() => {
    if (!canonicalPersistenceRequired || !canonicalBaselineRef.current) return;
    const data = { employees, departments, jobs, contracts, attendance, leaves, penalties, advances, rewards, performance, documents, payrollRuns, settings };
    const serialized = JSON.stringify(data);
    if (serialized === canonicalBaselineRef.current) return;
    const timer = window.setTimeout(async () => {
      if (canonicalSaveInFlightRef.current) return;
      canonicalSaveInFlightRef.current = true;
      try {
        const token = getTrustedAccessToken();
        if (!token) throw new Error('انتهت جلسة الدخول الموثوقة قبل الحفظ.');
        const response = await fetch('/api/hr/database', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ expectedVersion: canonicalVersionRef.current, data, countryCode: 'ZZ', legalConfiguration: {} })
        });
        const payload = await response.json();
        if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر حفظ سجل الموارد البشرية.');
        canonicalVersionRef.current = Number(payload?.meta?.version || canonicalVersionRef.current + 1);
        canonicalBaselineRef.current = serialized;
        triggerNotification('تم حفظ سجل الموارد البشرية المركزي.', 'success');
      } catch (error: any) {
        triggerNotification(error?.message || 'تعذر حفظ سجل الموارد البشرية المركزي.', 'error');
      } finally {
        canonicalSaveInFlightRef.current = false;
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [canonicalPersistenceRequired, employees, departments, jobs, contracts, attendance, leaves, penalties, advances, rewards, performance, documents, payrollRuns, settings]);

  // 2. Local State synchronization to LocalStorage on modifications
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (departments.length > 0) localStorage.setItem('erp_hr_departments', JSON.stringify(departments));
  }, [canonicalPersistenceRequired, departments]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (jobs.length > 0) localStorage.setItem('erp_hr_jobs', JSON.stringify(jobs));
  }, [canonicalPersistenceRequired, jobs]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (employees.length > 0) localStorage.setItem('erp_hr_employees', JSON.stringify(employees));
  }, [canonicalPersistenceRequired, employees]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (contracts.length > 0) localStorage.setItem('erp_hr_contracts', JSON.stringify(contracts));
  }, [canonicalPersistenceRequired, contracts]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (attendance.length > 0) localStorage.setItem('erp_hr_attendance', JSON.stringify(attendance));
  }, [canonicalPersistenceRequired, attendance]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (leaves.length > 0) localStorage.setItem('erp_hr_leaves', JSON.stringify(leaves));
  }, [canonicalPersistenceRequired, leaves]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (penalties.length > 0) localStorage.setItem('erp_hr_penalties', JSON.stringify(penalties));
  }, [canonicalPersistenceRequired, penalties]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (advances.length > 0) localStorage.setItem('erp_hr_advances', JSON.stringify(advances));
  }, [canonicalPersistenceRequired, advances]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (rewards.length > 0) localStorage.setItem('erp_hr_rewards', JSON.stringify(rewards));
  }, [canonicalPersistenceRequired, rewards]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (performance.length > 0) localStorage.setItem('erp_hr_performance', JSON.stringify(performance));
  }, [canonicalPersistenceRequired, performance]);
  useEffect(() => {
    if (canonicalPersistenceRequired) return;
    if (documents.length > 0) localStorage.setItem('erp_hr_documents', JSON.stringify(documents));
  }, [canonicalPersistenceRequired, documents]);

  // Global Currency Formatting (Arabic standard)
  const formatCurrency = (amount: number, showSymbol = true) => {
    return showSymbol 
      ? `${amount.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ريال`
      : amount.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  // Helper calculation for today's attendance rate
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentTodayCount = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = employees.length > 0 ? Math.round((presentTodayCount / employees.length) * 100) : 100;

  return (
    <div id="hr-portal" className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      <EnterpriseActionToolbar
        title="شؤون المعلمين والموظفين"
        stats={
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-xs">
            <span className="text-slate-300 font-bold">إجمالي الموظفين والمعلمين: <span className="text-amber-400 font-mono">{employees.length}</span> موظفاً</span>
          </div>
        }
        onExit={setActiveSection ? () => setActiveSection('dashboard') : undefined}
        onPrint={() => {}}
        onExportPdf={() => {}}
        onExportExcel={() => {}}
        onImportExcel={() => {}}
        onDownloadTemplate={() => {}}
      />
      <div className="p-3 sm:p-4 text-slate-100 flex-1 flex flex-col">
      
      {/* Real-time Dynamic Notification Toast */}
      {notification && (
        <div className={`fixed top-4 left-4 z-50 p-4 shadow-2xl border flex items-center gap-3 transition-all animate-bounce max-w-md ${
          notification.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500 text-emerald-400' 
            : notification.type === 'warning' 
            ? 'bg-amber-950/95 border-amber-500 text-amber-400' 
            : 'bg-rose-950/95 border-rose-500 text-rose-400'
        }`}>
          <div className="p-1 rounded bg-slate-900">
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <p className="text-xs font-bold leading-relaxed">{notification.message}</p>
        </div>
      )}

      {/* Internal Grid Router Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 p-0 gap-4">

        {/* RIGHT SIDEBAR MENU - Refactored to perfectly match the beautiful dark slate & teal theme of the general ledger and financial portals */}
        <div 
          id="hr-sidebar-menu" 
          className="w-full lg:col-span-3 bg-[#0b0f19] text-slate-100 border border-slate-800/60 p-5 shadow-2xl flex flex-col justify-between shrink-0 h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-6 overflow-hidden"
        >
          <div className="flex flex-col space-y-4 overflow-hidden">
            {/* Menu Title Header */}
            <div className="text-center pb-3.5 border-b border-slate-800/60">
              <h3 className="text-base font-extrabold text-white tracking-wide">شؤون المعلمين والموظفين</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">نظام الموارد البشرية والرواتب HRMS</p>
              <div className="w-14 h-0.5 mx-auto bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded mt-2" />
            </div>

            {/* List of Navigation Buttons categorized and scrollable */}
            <div className="flex-1 space-y-4 pr-1 pl-1 py-1.5 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="space-y-1.5">
                {/* Category Header Label with a refined indicator dot */}
                <div className="flex items-center gap-1.5 px-1 pb-1">
                  <span className="w-1 h-1 rounded-full bg-[#dfb55a]" />
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider select-none">
                    الحوكمة والعمليات البشرية
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Button 1: بيانات المعلمين والموظفين */}
                  <button
                    onClick={() => {
                      setActiveGroup('employees_group');
                      setActiveTab('employees');
                    }}
                    className={`group w-full relative flex items-center justify-between h-[42px] px-3.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden border transform hover:scale-[1.01] select-none ${
                      activeGroup === 'employees_group' 
                        ? 'hr-nav-active'
                        : 'bg-gradient-to-b from-slate-700/80 via-slate-800 to-slate-900 border-slate-600 text-white/95 hover:text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.2),0_4px_6px_rgba(0,0,0,0.4)] hover:from-slate-650 hover:via-slate-750 hover:to-slate-850 hover:border-slate-500'
                    }`}
                  >
                    {activeGroup === 'employees_group' && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-teal-300 to-emerald-400 rounded-l-md shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-sm shrink-0">👤</span>
                      <span className="truncate">بيانات المعلمين والموظفين</span>
                    </div>
                  </button>

                  {/* Button 2: الحضور والانصراف */}
                  <button
                    onClick={() => {
                      setActiveGroup('attendance_group');
                      setActiveTab('attendance');
                    }}
                    className={`group w-full relative flex items-center justify-between h-[42px] px-3.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden border transform hover:scale-[1.01] select-none ${
                      activeGroup === 'attendance_group' 
                        ? 'hr-nav-active'
                        : 'bg-gradient-to-b from-slate-700/80 via-slate-800 to-slate-900 border-slate-600 text-white/95 hover:text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.2),0_4px_6px_rgba(0,0,0,0.4)] hover:from-slate-650 hover:via-slate-750 hover:to-slate-850 hover:border-slate-500'
                    }`}
                  >
                    {activeGroup === 'attendance_group' && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-teal-300 to-emerald-400 rounded-l-md shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-sm shrink-0">⏰</span>
                      <span className="truncate">الحضور والانصراف</span>
                    </div>
                  </button>

                  {/* Button 3: إدارة السلف والقروض */}
                  <button
                    onClick={() => {
                      setActiveGroup('advances_group');
                      setActiveTab('advances');
                    }}
                    className={`group w-full relative flex items-center justify-between h-[42px] px-3.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden border transform hover:scale-[1.01] select-none ${
                      activeGroup === 'advances_group' 
                        ? 'hr-nav-active'
                        : 'bg-gradient-to-b from-slate-700/80 via-slate-800 to-slate-900 border-slate-600 text-white/95 hover:text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.2),0_4px_6px_rgba(0,0,0,0.4)] hover:from-slate-650 hover:via-slate-750 hover:to-slate-850 hover:border-slate-500'
                    }`}
                  >
                    {activeGroup === 'advances_group' && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-teal-300 to-emerald-400 rounded-l-md shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-sm shrink-0">💰</span>
                      <span className="truncate">إدارة السلف والقروض</span>
                    </div>
                  </button>

                  {/* Button 4: مسير الرواتب */}
                  <button
                    onClick={() => {
                      setActiveGroup('payroll_group');
                      setActiveTab('payroll');
                    }}
                    className={`group w-full relative flex items-center justify-between h-[42px] px-3.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden border transform hover:scale-[1.01] select-none ${
                      activeGroup === 'payroll_group' 
                        ? 'hr-nav-active'
                        : 'bg-gradient-to-b from-slate-700/80 via-slate-800 to-slate-900 border-slate-600 text-white/95 hover:text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.2),0_4px_6px_rgba(0,0,0,0.4)] hover:from-slate-650 hover:via-slate-750 hover:to-slate-850 hover:border-slate-500'
                    }`}
                  >
                    {activeGroup === 'payroll_group' && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-teal-300 to-emerald-400 rounded-l-md shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-sm shrink-0">🧾</span>
                      <span className="truncate">مسير الرواتب</span>
                    </div>
                  </button>

                  {/* Button 5: تقارير الموارد البشرية */}
                  <button
                    onClick={() => {
                      setActiveGroup('reports_group');
                      setActiveTab('dashboard');
                    }}
                    className={`group w-full relative flex items-center justify-between h-[42px] px-3.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden border transform hover:scale-[1.01] select-none ${
                      activeGroup === 'reports_group' 
                        ? 'hr-nav-active'
                        : 'bg-gradient-to-b from-slate-700/80 via-slate-800 to-slate-900 border-slate-600 text-white/95 hover:text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.2),0_4px_6px_rgba(0,0,0,0.4)] hover:from-slate-650 hover:via-slate-750 hover:to-slate-850 hover:border-slate-500'
                    }`}
                  >
                    {activeGroup === 'reports_group' && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-teal-300 to-emerald-400 rounded-l-md shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-sm shrink-0">📊</span>
                      <span className="truncate">تقارير الموارد البشرية</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* LEFT WORKSPACE SCREEN RENDERING */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Dynamic Sub-tab Bar depending on active high-level Group */}
          {activeGroup === 'employees_group' && (
            <div className="hr-subtabs bg-slate-900 border border-slate-800/80 p-1.5 flex flex-wrap gap-1.5 shadow-lg">
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'employees' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                👤 دليل الكادر والوظائف
              </button>
              <button
                onClick={() => setActiveTab('org')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'org' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                🌿 المخطط الهيكلي
              </button>
              <button
                onClick={() => setActiveTab('depts')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'depts' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                🏢 شؤون الأقسام والوحدات
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'jobs' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                💼 المسميات الوظيفية
              </button>
              <button
                onClick={() => setActiveTab('contracts')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'contracts' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                📝 عقود العمل
              </button>
            </div>
          )}

          {activeGroup === 'attendance_group' && (
            <div className="hr-subtabs bg-slate-900 border border-slate-800/80 p-1.5 flex flex-wrap gap-1.5 shadow-lg">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'attendance' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                📅 سجل رصد الحضور والغياب اليومي
              </button>
              <button
                onClick={() => setActiveTab('leaves')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'leaves' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                🏖️ طلبات الإجازات والغياب
              </button>
            </div>
          )}

          {activeGroup === 'advances_group' && (
            <div className="hr-subtabs bg-slate-900 border border-slate-800/80 p-1.5 flex flex-wrap gap-1.5 shadow-lg">
              <button
                onClick={() => setActiveTab('advances')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'advances' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                💸 السلف والقروض المجدولة
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'rewards' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                🎁 المكافآت والتحفيز الاستثنائي
              </button>
              <button
                onClick={() => setActiveTab('penalties')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'penalties' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                ⚠️ المخالفات والجزاءات الإدارية
              </button>
            </div>
          )}

          {activeGroup === 'reports_group' && (
            <div className="hr-subtabs bg-slate-900 border border-slate-800/80 p-1.5 flex flex-wrap gap-1.5 shadow-lg">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'dashboard' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                📊 لوحة المؤشرات الإدارية
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'reports' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                📈 مركز التقارير والإحصاءات
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'performance' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                ⭐ تقييم الأداء والكفاءة
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'documents' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                📂 أرشيف المستندات والملفات
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'settings' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                ⚙️ إعدادات الدوام والربط
              </button>
              <button
                onClick={() => setActiveTab('certification')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === 'certification' ? 'bg-[#dfb55a] text-slate-950 font-black shadow-md' : 'text-amber-400 border border-amber-500/30 hover:text-white hover:bg-amber-500/20'
                }`}
              >
                🏆 اعتماد مطابقة HR والرواتب
              </button>
            </div>
          )}

          {activeTab === 'certification' && (
            <div className="border border-amber-500/40 bg-amber-50 p-6 text-right space-y-3">
              <h3 className="text-base font-black text-amber-900">اعتماد الموارد البشرية والرواتب غير متاح</h3>
              <p className="text-sm leading-7 text-amber-950">
                لا يمكن إصدار شهادة أو عرض قياسات أداء للموارد البشرية قبل ربط ملفات الموظفين والحضور والعقود والرواتب بمصدر مركزي موثّق، ثم تنفيذ اختبار قبول حيّ وسجل تدقيق قابل للمراجعة.
              </p>
              <p className="text-xs font-bold text-amber-800">
                لا تُنشأ سجلات أو قيود محاسبية تجريبية في بيئة Staging.
              </p>
            </div>
          )}
          
          {/* Dashboard view */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Quick stats grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                
                <div className="bg-slate-900/60 p-4 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">إجمالي الكادر البشري</span>
                    <span className="text-xl font-black text-white font-mono">{employees.length}</span>
                    <span className="text-[9px] text-emerald-400 block font-bold mt-1">✓ على رأس العمل</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400"><Users className="w-5 h-5" /></div>
                </div>

                <div className="bg-slate-900/60 p-4 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">فاتورة الرواتب الأساسية</span>
                    <span className="text-lg font-black text-white font-mono">{formatCurrency(employees.reduce((acc,e)=>acc+e.basicSalary, 0), true)}</span>
                    <span className="text-[9px] text-amber-400 block font-bold mt-1">مستحق شهري</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400"><Coins className="w-5 h-5" /></div>
                </div>

                <div className="bg-slate-900/60 p-4 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">نسبة الانضباط اليومي</span>
                    <span className="text-xl font-black text-white font-mono">{attendanceRate}%</span>
                    <span className="text-[9px] text-amber-400 block font-bold mt-1">تاريخ اليوم</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400"><Clock className="w-5 h-5" /></div>
                </div>

                <div className="bg-slate-900/60 p-4 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">المستندات المؤرشفة</span>
                    <span className="text-xl font-black text-white font-mono">{documents.length}</span>
                    <span className="text-[9px] text-yellow-400 block font-bold mt-1">الملف الرقمي</span>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-400"><FolderOpen className="w-5 h-5" /></div>
                </div>

              </div>

              {/* Bento sections layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Cost Center Allocation analysis */}
                <div className="bg-slate-900/60 p-5 border border-slate-800 space-y-4">
                  <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-[#dfb55a]" />
                    <span>توزيع الكادر البشري على مراكز التكلفة والمنهجية</span>
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(costCenterLabels).map(([key, label]) => {
                      const count = employees.filter(e => e.costCenter === key).length;
                      const percentage = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-300 font-medium">{label.split(' (')[0]}</span>
                            <span className="text-slate-400 font-mono font-bold">{count} موظف ({percentage}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-l from-[#dfb55a] to-[#c99e4c] rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Recent HR Actions Logs / Audit Trail */}
                <div className="bg-slate-900/60 p-5 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#dfb55a]" />
                      <span>سجل التدقيق والمراقبة المزدوجة (Audit Trail)</span>
                    </h4>
                    <div className="space-y-3 mt-4 max-h-[220px] overflow-y-auto pr-1">
                      {employees.flatMap(emp => emp.auditLogs.map(log => ({ ...log, empName: emp.name }))).slice(0, 4).map((log, index) => (
                        <div key={index} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg space-y-1 text-[10px]">
                          <div className="flex justify-between font-bold">
                            <span className="text-amber-400">{log.action}</span>
                            <span className="text-slate-500 font-mono">{log.date}</span>
                          </div>
                          <p className="text-slate-300">للموظف: <strong className="text-slate-200">{log.empName}</strong> • {log.details}</p>
                          <div className="text-[9px] text-slate-500 text-left">المسؤول: {log.user}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Banner alerts */}
              <div className="bg-[#dfb55a]/10 border border-[#dfb55a]/20 p-4 flex items-center gap-3 text-xs text-[#dfb55a]">
                <Info className="w-5 h-5 shrink-0" />
                <p className="leading-relaxed">
                  <strong>حالة الربط المحاسبي:</strong> مسير الرواتب يمر باعتماد HR ثم صرف مالي مركزي؛ طلبات السلف تبقى قيد المراجعة ولا تُنشئ قيوداً محلية.
                </p>
              </div>

            </div>
          )}

          {/* Renders Employees tab */}
          {activeTab === 'employees' && (
            <EmployeesTab 
              employees={employees} 
              setEmployees={setEmployees}
              departments={departments}
              jobs={jobs}
              contracts={contracts}
              leaves={leaves}
              rewards={rewards}
              penalties={penalties}
              performance={performance}
              documents={documents}
              formatCurrency={formatCurrency}
              triggerNotification={triggerNotification}
              costCenterLabels={costCenterLabels}
            />
          )}

          {/* Renders Attendance tab */}
          {activeTab === 'attendance' && (
            <AttendanceTab 
              employees={employees}
              attendance={attendance}
              setAttendance={setAttendance}
              departments={departments}
              settings={settings}
              triggerNotification={triggerNotification}
              costCenterLabels={costCenterLabels}
            />
          )}

          {/* Renders Payroll tab */}
          {activeTab === 'payroll' && (
            <PayrollTab 
              employees={employees}
              attendance={attendance}
              leaves={leaves}
              penalties={penalties}
              advances={advances}
              rewards={rewards}
              payrollRuns={payrollRuns}
              settings={settings}
              formatCurrency={formatCurrency}
              triggerNotification={triggerNotification}
              costCenterLabels={costCenterLabels}
              onApprovePayroll={(period) => runPayrollWorkflow(period, 'approve')}
              onPayPayroll={(period) => runPayrollWorkflow(period, 'pay')}
            />
          )}

          {/* Renders Reports tab */}
          {activeTab === 'reports' && (
            <ReportsTab 
              employees={employees}
              departments={departments}
              jobs={jobs}
              attendance={attendance}
              leaves={leaves}
              advances={advances}
              rewards={rewards}
              penalties={penalties}
              formatCurrency={formatCurrency}
              triggerNotification={triggerNotification}
              costCenterLabels={costCenterLabels}
              onCanonicalReportAudit={auditHrReport}
            />
          )}

          {/* Renders other consolidated sub-tabs */}
          {['org', 'depts', 'jobs', 'contracts', 'leaves', 'penalties', 'advances', 'rewards', 'performance', 'documents', 'settings'].includes(activeTab) && (
            <OtherHRTabs 
              activeTab={activeTab}
              employees={employees}
              setEmployees={setEmployees}
              departments={departments}
              setDepartments={setDepartments}
              jobs={jobs}
              setJobs={setJobs}
              contracts={contracts}
              setContracts={setContracts}
              leaves={leaves}
              setLeaves={setLeaves}
              penalties={penalties}
              setPenalties={setPenalties}
              advances={advances}
              setAdvances={setAdvances}
              rewards={rewards}
              setRewards={setRewards}
              performance={performance}
              setPerformance={setPerformance}
              documents={documents}
              setDocuments={setDocuments}
              settings={settings}
              setSettings={setSettings}
              formatCurrency={formatCurrency}
              triggerNotification={triggerNotification}
              costCenterLabels={costCenterLabels}
              onPayAdvance={runAdvanceWorkflow}
              onSignContract={runContractSigning}
            />
          )}

        </div>

      </div>

    </div>
    </div>
  );
}
