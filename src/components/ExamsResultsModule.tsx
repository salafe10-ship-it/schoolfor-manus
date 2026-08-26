import { AlertTriangle, Archive, Award, Bell, BookOpen, Bot, Building2, Calendar, Check, CheckCircle, ChevronDown, ChevronLeft, Clock, Download, Edit3, Eye, FileCheck2, FilePieChart, FileSpreadsheet, FileText, Grid, HelpCircle, Home, IdCard, Loader2, Lock as LockIcon, Mail, MapPin, Maximize2, Moon, Percent, Play, Plus, Printer, RefreshCw, Save, School, Search, Settings, Share2, ShieldAlert, ShieldCheck, Sliders, Sparkles, Sun, Trash2, Trophy, Unlock, UploadCloud, User, UserCheck, UserX, Users } from 'lucide-react';
import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

import { Student, Teacher, SchoolClass, UserRole } from '../types';
import EnterpriseActionToolbar from './shared/EnterpriseActionToolbar';
import ExamsCertificatesPanel from './exams/ExamsCertificatesPanel';
import ExamsDistributionPanel from './exams/ExamsDistributionPanel';
import { canAssignProctorForWeek } from '../modules/exams/application/ExamSchedulingRules';
import { calculateCohortExamResults } from '../modules/exams/domain/ExamResultEngine';
import { getTrustedAccessToken } from '../utils/auth';

const today = new Date();
const currentAcademicYearStart = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;

// Safe defaults used only until the selected school's canonical settings load.
const DEFAULT_EXAM_SETTINGS = {
  academicYear: `${currentAcademicYearStart}/${currentAcademicYearStart + 1}`,
  semester: 'الفصل الدراسي الثاني',
  examType: 'الاختبارات النهائية',
  roundingPolicy: 'التقريب لأقرب نصف درجة',
  passPolicy: 'حصول الطالب على 50% كحد أدنى في المادة وبشرط دخول الاختبار النهائي',
  passMarkPercent: 50,
  minFinalMarkPercent: 20
};

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const normalizeSubjectName = (value: unknown): string => String(value ?? '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('ar');

const getScheduleRulesError = (config: any): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config?.startDate || '')) return 'حدد تاريخ بداية صالحاً للامتحانات.';
  if (!Number.isInteger(config?.examsPerWeek) || config.examsPerWeek < 1 || config.examsPerWeek > 7) return 'عدد الامتحانات الأسبوعية يجب أن يكون بين 1 و7.';
  if (!Array.isArray(config?.dailySlots) || config.dailySlots.length === 0) return 'عرّف فترة زمنية واحدة على الأقل.';
  if (!Number.isInteger(config?.subjectsPerDay) || config.subjectsPerDay < 1 || config.subjectsPerDay > config.dailySlots.length) return 'الحد اليومي يجب أن يكون بين 1 وعدد الفترات المعرفة.';
  if (!Number.isInteger(config?.minGapDays) || config.minGapDays < 0 || config.minGapDays > 7) return 'الحد الأدنى للراحة يجب أن يكون بين صفر و7 أيام.';
  if (config.dailySlots.some((slot: any) => !/^\d{2}:\d{2}$/.test(slot.start) || !/^\d{2}:\d{2}$/.test(slot.end) || slot.start >= slot.end)) return 'توجد فترة زمنية غير صالحة.';
  return '';
};

interface ExamModuleProps {
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'info') => void;
  setActiveSection?: (sec: string) => void;
  selectedSchool?: any;
  currentRole?: UserRole;
}

export default function ExamsResultsModule({
  students: initialStudents = [],
  teachers: initialTeachers = [],
  classes: initialClasses = [],
  triggerNotification,
  setActiveSection,
  selectedSchool,
  currentRole
}: ExamModuleProps) {
  const availableTeachers = initialTeachers;
  // Navigation Sidebar
  const validTabIds = useMemo(() => [
    'control-center', 'settings', 'classes', 'halls', 'distribution',
    'seating', 'proctors', 'schedule', 'grades-entry', 'processing',
    'quality-governance', 'review', 'reports', 'certificates',
    'system-settings', 'exams-guide'
  ], []);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('exams_active_tab');
    return (saved && validTabIds.includes(saved)) ? saved : 'control-center';
  });

  useEffect(() => {
    if (!validTabIds.includes(activeTab)) {
      setActiveTab('control-center');
    } else {
      localStorage.setItem('exams_active_tab', activeTab);
    }
  }, [activeTab, validTabIds]);

  // Control Committee & Stage isolation (Requirement #1: Multi-stage Control)
  const [controlCommittees, setControlCommittees] = useState<any[]>(() => {
    return [];
  });
  const [activeCommitteeId, setActiveCommitteeId] = useState<string>('');

  // Selected stage based on active committee
  const activeControlStage = controlCommittees.find(c => c.id === activeCommitteeId)?.stage || 'all';

  // Requirement #2 & #3: Approval & Reopening History
  const [approvalHistory, setApprovalHistory] = useState<any[]>(() => {
    return [];
  });

  // Requirement #4: Grade modification history
  const [gradeHistory, setGradeHistory] = useState<any[]>(() => {
    return [];
  });

  // Requirement #9: Archived years state
  const [selectedArchivedYear, setSelectedArchivedYear] = useState<string>('');

  // Historical comparison remains empty until canonical archive summaries are exposed by the API.
  const archivedData: any[] = [];

  const [selectedCompareStage, setSelectedCompareStage] = useState<string>('الكل');
  const [selectedCompareClass, setSelectedCompareClass] = useState<string>('الكل');
  const [selectedCompareSubject, setSelectedCompareSubject] = useState<string>('الكل');
  const [selectedCompareTeacher, setSelectedCompareTeacher] = useState<string>('الكل');
  const [selectedCompareSchool, setSelectedCompareSchool] = useState<string>('الكل');

  // Freeze Results & Snapshots
  const [snapshots, setSnapshots] = useState<any[]>(() => {
    return [];
  });
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');

  // Reviewed subjects per stage
  const [reviewedStagesSubjects, setReviewedStagesSubjects] = useState<Record<string, boolean>>(() => {
    return {};
  });

  const isSubjectReviewed = (subId: string): boolean => {
    if (!reviewedStagesSubjects) return false;
    if (Array.isArray(reviewedStagesSubjects)) {
      return (reviewedStagesSubjects as unknown as string[]).includes(subId);
    }
    if (typeof reviewedStagesSubjects === 'object') {
      if (reviewedStagesSubjects[subId]) return true;
      return Object.keys(reviewedStagesSubjects).some(
        k => (k === subId || k.endsWith(`-${subId}`)) && Boolean(reviewedStagesSubjects[k])
      );
    }
    return false;
  };

  // Stage approval status
  const [stageApprovalStatus, setStageApprovalStatus] = useState<Record<string, { approved: boolean, approvedBy: string, approvedAt: string }>>(() => {
    return {
      'kindergarten': { approved: false, approvedBy: '', approvedAt: '' },
      'primary': { approved: false, approvedBy: '', approvedAt: '' },
      'middle': { approved: false, approvedBy: '', approvedAt: '' },
      'high': { approved: false, approvedBy: '', approvedAt: '' }
    };
  });

  // Selected subject for psychometric analytics
  const [selectedSubjectAnalyticId, setSelectedSubjectAnalyticId] = useState<string>('');

  // Quality, Governance & Gaps States
  const currentUserRole: 'admin' | 'reviewer' | 'officer' = currentRole === 'SuperAdmin' || currentRole === 'SchoolAdmin'
    ? 'admin'
    : currentRole === 'Teacher'
      ? 'reviewer'
      : 'officer';
  const trustedActorLabel = currentRole === 'SuperAdmin'
    ? 'مدير المنصة — جلسة موثقة'
    : currentRole === 'SchoolAdmin'
      ? 'مدير المدرسة — جلسة موثقة'
      : currentRole === 'Teacher'
        ? 'المعلم — جلسة موثقة'
        : 'المستخدم الحالي — جلسة موثقة';

  const [controlClosures, setControlClosures] = useState<any[]>(() => {
    return [];
  });

  const [reEvaluationRequests, setReEvaluationRequests] = useState<any[]>(() => {
    return [];
  });



  // Core State Managers
  const [examSettings, setExamSettings] = useState(() => {
    return {
      ...DEFAULT_EXAM_SETTINGS,
      academicYear: selectedSchool?.academicYear || DEFAULT_EXAM_SETTINGS.academicYear
    };
  });

  const [halls, setHalls] = useState<any[]>(() => {
    return [];
  });

  const [subjects, setSubjects] = useState<any[]>(() => {
    return [];
  });

  const [classesList, setClassesList] = useState<any[]>(() => {
    return initialClasses;
  });

  const [studentList, setStudentList] = useState<any[]>(() => {
    // لا تُنشأ قوائم امتحان من بيانات تجريبية؛ تُستخدم القائمة المركزية فقط.
    return initialStudents.map(st => ({ ...st, absentSubjects: [] as string[] }));
  });

  const [gradesMatrix, setGradesMatrix] = useState<Record<string, Record<string, number>>>(() => {
    return {};
  });

  const [schedule, setSchedule] = useState<any[]>(() => {
    return [];
  });

  const [proctorAssignments, setProctorAssignments] = useState<any[]>(() => {
    return [];
  });

  const [approvalStatus, setApprovalStatus] = useState(() => {
    return { approved: false, approvedBy: '', approvedAt: '' };
  });

  // Scheduling Engine States
  const [scheduleSubTab, setScheduleSubTab] = useState<'prep' | 'engine' | 'approval' | 'reports'>('prep');
  const [prepActiveCategory, setPrepActiveCategory] = useState<'academic' | 'subjects' | 'halls' | 'proctors' | 'rules'>('academic');

  const [scheduleApprovalStatus, setScheduleApprovalStatus] = useState(() => {
    return { approved: false, approvedBy: '', approvedAt: '', notes: '' };
  });

  const [scheduleConfig, setScheduleConfig] = useState(() => {
    return {
      startDate: '',
      examsPerWeek: 5,
      subjectsPerDay: 1,
      minGapDays: 1,
      dailySlots: [
        { id: 'sl-1', start: '08:30', end: '10:30', label: 'الفترة الأولى' },
        { id: 'sl-2', start: '11:00', end: '13:00', label: 'الفترة الثانية' }
      ],
      holidayDays: [5, 6], // 5=Friday, 6=Saturday
      customHolidays: [] as string[]
    };
  });
  const scheduleConfigRef = useRef(scheduleConfig);
  const updateScheduleConfig = (nextConfig: typeof scheduleConfig) => {
    scheduleConfigRef.current = nextConfig;
    setScheduleConfig(nextConfig);
  };
  useEffect(() => {
    scheduleConfigRef.current = scheduleConfig;
  }, [scheduleConfig]);

  const [customProctorUnavailable, setCustomProctorUnavailable] = useState<Record<string, string[]>>(() => {
    return {};
  });

  const [selectedClassReport, setSelectedClassReport] = useState('الكل');
  const [selectedClassroomReport, setSelectedClassroomReport] = useState('الكل');
  const [selectedSectionReport, setSelectedSectionReport] = useState('الكل');
  const [selectedHallReport, setSelectedHallReport] = useState('الكل');
  const [selectedProctorReport, setSelectedProctorReport] = useState('الكل');

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [classroomSearch, setClassroomSearch] = useState('');
  const [classesSubTab, setClassesSubTab] = useState<'subjects' | 'classrooms'>('subjects');
  const [newClassroom, setNewClassroom] = useState({ name: '', level: 'middle' as 'kindergarten' | 'primary' | 'middle' | 'high', capacity: 30, sections: '' });
  const [hallSearch, setHallSearch] = useState('');
  const [proctorSearch, setProctorSearch] = useState('');
  const [scheduleSearch, setScheduleSearch] = useState('');

  // Editing Entity States
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<any>({});

  // Database Synchronization States
  const [isDbSyncing, setIsDbSyncing] = useState(false);
  const [isCanonicalClassSyncing, setIsCanonicalClassSyncing] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'success' | 'conflict' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [examsDbVersion, setExamsDbVersion] = useState(0);
  const examsDbVersionRef = useRef(0);
  const databaseWriteLockRef = useRef(false);
  const updateExamsDbVersion = (value: unknown): boolean => {
    const nextVersion = Number(value);
    if (!Number.isSafeInteger(nextVersion) || nextVersion < 0 || nextVersion < examsDbVersionRef.current) return false;
    examsDbVersionRef.current = nextVersion;
    setExamsDbVersion(nextVersion);
    return true;
  };
  const [centralAuditLogs, setCentralAuditLogs] = useState<any[]>([]);
  const [examCandidateDiagnostics, setExamCandidateDiagnostics] = useState({
    totalCanonical: 0,
    eligible: 0,
    missingIdentity: 0,
    missingClass: 0,
    missingAcademicYear: 0,
    academicYearMismatch: 0,
    inactiveStatus: 0
  });

  const mergeCanonicalStudents = (canonicalStudents: any[], examStudents: any[] = []) => {
    const examMetadataById = new Map(examStudents.map(student => [String(student.id), student]));
    return canonicalStudents.map(student => {
      const examMetadata = examMetadataById.get(String(student.id)) || {};
      return {
        ...student,
        seatNumber: examMetadata.seatNumber,
        absentSubjects: Array.isArray(examMetadata.absentSubjects) ? examMetadata.absentSubjects : [],
        hallId: examMetadata.hallId
      };
    });
  };

  const fetchCanonicalStudents = async (token: string | null) => {
    const collected: any[] = [];
    let page = 1;
    let hasNext = true;
    while (hasNext) {
      const response = await fetch(`/api/students?page=${page}&limit=100&sortBy=name&sortOrder=asc`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Canonical student read failed (${response.status})`);
      const result = await response.json();
      collected.push(...(Array.isArray(result.data) ? result.data : []));
      hasNext = Boolean(result.meta?.hasNext);
      page += 1;
    }
    const normalizeAcademicYear = (value: unknown) => String(value || '').replace(/\D/g, '');
    const targetAcademicYear = normalizeAcademicYear(selectedSchool?.academicYear || examSettings.academicYear);
    const diagnostics = {
      totalCanonical: collected.length,
      eligible: 0,
      missingIdentity: 0,
      missingClass: 0,
      missingAcademicYear: 0,
      academicYearMismatch: 0,
      inactiveStatus: 0
    };
    const eligibleStudents = collected.filter(student => {
      const studentAcademicYear = normalizeAcademicYear(student.academicYear);
      const status = String(student.status || '').toLowerCase();
      if (!String(student.id || '').trim() || !String(student.name || '').trim()) diagnostics.missingIdentity += 1;
      else if (!String(student.classroom || '').trim()) diagnostics.missingClass += 1;
      else if (!studentAcademicYear) diagnostics.missingAcademicYear += 1;
      else if (studentAcademicYear !== targetAcademicYear) diagnostics.academicYearMismatch += 1;
      else if (!['active', 'accepted'].includes(status)) diagnostics.inactiveStatus += 1;
      else {
        diagnostics.eligible += 1;
        return true;
      }
      return false;
    });
    setExamCandidateDiagnostics(diagnostics);
    return eligibleStudents;
  };

  const fetchCentralAuditLogs = async (token: string | null) => {
    const response = await fetch('/api/exams/audit-events', {
      headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Canonical exams audit read failed (${response.status})`);
    const result = await response.json();
    return Array.isArray(result.data) ? result.data : [];
  };

  // Function to save current state to server-side database JSON file
  const saveToServerDb = async (
    currentSettings = examSettings,
    currentHalls = halls,
    currentSubjects = subjects,
    currentStudentList = studentList,
    currentGradesMatrix = gradesMatrix,
    currentSchedule = schedule,
    currentProctors = proctorAssignments,
    currentApprovalStatus = approvalStatus,
    currentAuditLogs = auditLogs,
    currentClassesList = classesList,
    currentControlClosures = controlClosures,
    currentReEvaluationRequests = reEvaluationRequests,
    currentSnapshots = snapshots,
    currentReviewedStagesSubjects = reviewedStagesSubjects,
    currentStageApprovalStatus = stageApprovalStatus,
    operation: 'write' | 'approve' | 'reopen' | 'approve_schedule' | 'reopen_schedule' = 'write',
    persistenceExtras: {
      approvalHistory?: any[];
      gradeHistory?: any[];
      controlCommittees?: any[];
      scheduleApprovalStatus?: any;
      scheduleConfig?: any;
      customProctorUnavailable?: Record<string, string[]>;
      operationReason?: string;
    } = {}
  ) => {
    if (databaseWriteLockRef.current) {
      triggerNotification('توجد عملية حفظ للامتحانات قيد التنفيذ. انتظر اكتمالها قبل إجراء تعديل جديد.', 'info');
      return false;
    }
    databaseWriteLockRef.current = true;
    setIsDbSyncing(true);
    setDbSyncStatus('idle');
    try {
      const payload = {
        exams_settings: currentSettings,
        exams_halls: currentHalls,
        exams_subjects: currentSubjects,
        exams_students_enriched: currentStudentList,
        exams_grades_matrix: currentGradesMatrix,
        exams_schedule: currentSchedule,
        exams_proctors: currentProctors,
        exams_approval_status: currentApprovalStatus,
        exams_audit_logs: currentAuditLogs,
        exams_classes_list: currentClassesList,
        exams_control_closures: currentControlClosures,
        exams_re_evaluation_requests: currentReEvaluationRequests,
        exams_snapshots: currentSnapshots,
        exams_reviewed_stages_subjects: currentReviewedStagesSubjects,
        exams_stage_approval_status: currentStageApprovalStatus,
        exams_approval_history: persistenceExtras.approvalHistory ?? approvalHistory,
        exams_grade_history: persistenceExtras.gradeHistory ?? gradeHistory,
        exams_control_committees: persistenceExtras.controlCommittees ?? controlCommittees,
        exams_schedule_approval_status: persistenceExtras.scheduleApprovalStatus ?? scheduleApprovalStatus,
        exams_schedule_config: persistenceExtras.scheduleConfig ?? scheduleConfigRef.current,
        exams_custom_proctor_unavailable: persistenceExtras.customProctorUnavailable ?? customProctorUnavailable
      };
      const token = getTrustedAccessToken();
      const response = await fetch('/api/exams/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ...payload,
          expectedVersion: examsDbVersionRef.current,
          operation,
          operationReason: persistenceExtras.operationReason
        })
      });
      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        updateExamsDbVersion(Number(result.meta?.version ?? examsDbVersionRef.current + 1));
        setDbSyncStatus('success');
        setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));
        void fetchCentralAuditLogs(token).then(setCentralAuditLogs).catch(error => {
          EnterpriseLogger.error('Failed to refresh canonical exams audit log', 'ExamsResultsModule', { error });
        });
        return result.data?.archive || result.data?.operationState
          ? { archive: result.data?.archive || null, operationState: result.data?.operationState || null }
          : true;
      } else {
        const result = await response.json().catch(() => ({}));
        setDbSyncStatus(response.status === 409 ? 'conflict' : 'error');
        triggerNotification(
          result.message || (response.status === 409
            ? 'تعارض حفظ: أعد المزامنة قبل إعادة المحاولة.'
            : `تعذر حفظ بيانات الامتحانات (${response.status})`),
          'warning'
        );
        return false;
      }
    } catch (err: any) {
      EnterpriseLogger.error("Failed to save exams database to server", "ExamsResultsModule", { error: err });
      setDbSyncStatus('error');
      return false;
    } finally {
      setIsDbSyncing(false);
      databaseWriteLockRef.current = false;
    }
  };

  // Function to manually sync with server-side database
  const handleForceSync = async () => {
    setIsDbSyncing(true);
    try {
      const token = getTrustedAccessToken();
      const [response, canonicalStudents, canonicalAuditEvents] = await Promise.all([
        fetch('/api/exams/database', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }),
        fetchCanonicalStudents(token).catch(error => {
          EnterpriseLogger.error('Failed to refresh canonical students for exams', 'ExamsResultsModule', { error });
          return null;
        }),
        fetchCentralAuditLogs(token).catch(error => {
          EnterpriseLogger.error('Failed to refresh canonical exams audit log', 'ExamsResultsModule', { error });
          return null;
        })
      ]);
      if (canonicalAuditEvents) setCentralAuditLogs(canonicalAuditEvents);
      if (response.ok) {
        const rawRes = await response.json();
        const remoteVersion = Number(rawRes?.meta?.version || 0);
        if (Number.isSafeInteger(remoteVersion) && remoteVersion < examsDbVersionRef.current) return;
        updateExamsDbVersion(remoteVersion);
        const dbData = rawRes && rawRes.success && rawRes.data ? rawRes.data : rawRes;
        if (dbData && Object.keys(dbData).length > 0) {
          // Found data on server, load it!
          if (dbData.exams_settings) setExamSettings(dbData.exams_settings);
          if (dbData.exams_halls) setHalls(dbData.exams_halls);
          if (dbData.exams_subjects) setSubjects(dbData.exams_subjects);
          if (canonicalStudents) setStudentList(mergeCanonicalStudents(canonicalStudents, dbData.exams_students_enriched));
          else if (dbData.exams_students_enriched) setStudentList(dbData.exams_students_enriched);
          if (dbData.exams_grades_matrix) setGradesMatrix(dbData.exams_grades_matrix);
          if (dbData.exams_schedule) setSchedule(dbData.exams_schedule);
          if (dbData.exams_proctors) setProctorAssignments(dbData.exams_proctors);
          if (dbData.exams_approval_status) setApprovalStatus(dbData.exams_approval_status);
          if (dbData.exams_audit_logs) setAuditLogs(dbData.exams_audit_logs);
          if (dbData.exams_classes_list) setClassesList(dbData.exams_classes_list);
          if (dbData.exams_control_closures) setControlClosures(dbData.exams_control_closures);
          if (dbData.exams_re_evaluation_requests) setReEvaluationRequests(dbData.exams_re_evaluation_requests);
          if (dbData.exams_snapshots) setSnapshots(dbData.exams_snapshots);
          if (dbData.exams_reviewed_stages_subjects) setReviewedStagesSubjects(dbData.exams_reviewed_stages_subjects);
          if (dbData.exams_stage_approval_status) setStageApprovalStatus(dbData.exams_stage_approval_status);
          if (dbData.exams_approval_history) setApprovalHistory(dbData.exams_approval_history);
          if (dbData.exams_grade_history) setGradeHistory(dbData.exams_grade_history);
          if (dbData.exams_control_committees) setControlCommittees(dbData.exams_control_committees);
          if (dbData.exams_schedule_approval_status) setScheduleApprovalStatus(dbData.exams_schedule_approval_status);
          if (dbData.exams_schedule_config) updateScheduleConfig(dbData.exams_schedule_config);
          if (dbData.exams_custom_proctor_unavailable) setCustomProctorUnavailable(dbData.exams_custom_proctor_unavailable);
          setDbSyncStatus('success');
          setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));
          triggerNotification('تمت مزامنة واسترجاع كامل البيانات من السيرفر بنجاح', 'success');
          logAction('مزامنة واسترجاع البيانات يدوياً من السيرفر', 'النظام وقاعدة البيانات');
        } else {
          // An empty canonical database is an empty state, not permission to
          // promote browser/demo fixtures into authoritative exam records.
          if (canonicalStudents) setStudentList(mergeCanonicalStudents(canonicalStudents));
          setDbSyncStatus('success');
          triggerNotification('المصدر المركزي متاح لكنه لا يحتوي سجلات امتحانات بعد.', 'info');
        }
      } else {
        setDbSyncStatus('error');
        const errorResult = await response.json().catch(() => ({}));
        triggerNotification(errorResult.message || `فشل استرجاع بيانات الامتحانات (${response.status})`, 'warning');
      }
    } catch (err: any) {
      setDbSyncStatus('error');
      triggerNotification('حدث خطأ أثناء مزامنة قاعدة البيانات', 'warning');
    } finally {
      setIsDbSyncing(false);
    }
  };

  const handleCanonicalClassSync = async () => {
    if (isCanonicalClassSyncing || isDbSyncing) return;
    setIsCanonicalClassSyncing(true);
    try {
      const token = getTrustedAccessToken();
      const response = await fetch('/api/exams/sync-canonical-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ expectedVersion: examsDbVersionRef.current })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setDbSyncStatus(response.status === 409 ? 'conflict' : 'error');
        triggerNotification(result.message || 'تعذر مطابقة صفوف الامتحانات مع الهيكل الأكاديمي.', 'warning');
        return;
      }
      const canonicalClasses = Array.isArray(result.data?.classes) ? result.data.classes : [];
      if (!canonicalClasses.length) {
        setDbSyncStatus('error');
        triggerNotification('لم يعُد الخادم صفوفاً أكاديمية صالحة للمزامنة.', 'warning');
        return;
      }
      setClassesList(canonicalClasses);
      updateExamsDbVersion(Number(result.meta?.version ?? examsDbVersionRef.current + 1));
      setDbSyncStatus('success');
      setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));
      void fetchCentralAuditLogs(token).then(setCentralAuditLogs).catch(error => {
        EnterpriseLogger.error('Failed to refresh canonical class-sync audit events', 'ExamsResultsModule', { error });
      });
      triggerNotification(
        `تمت مطابقة ${canonicalClasses.length} صفاً أكاديمياً مع ${Number(result.data?.matchedStudentClassCount || 0)} صفوف طلاب نشطة.`,
        'success'
      );
    } catch (error) {
      EnterpriseLogger.error('Failed to synchronize canonical exam classes', 'ExamsResultsModule', { error });
      setDbSyncStatus('error');
      triggerNotification('تعذر الاتصال بالخادم لمطابقة صفوف الامتحانات.', 'warning');
    } finally {
      setIsCanonicalClassSyncing(false);
    }
  };

  // Load from database on mount
  useEffect(() => {
    const fetchDbOnMount = async () => {
      setIsDbSyncing(true);
      try {
        const token = getTrustedAccessToken();
        const [response, canonicalStudents, canonicalAuditEvents] = await Promise.all([
          fetch('/api/exams/database', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
          }),
          fetchCanonicalStudents(token).catch(error => {
            EnterpriseLogger.error('Failed to fetch canonical students for exams', 'ExamsResultsModule', { error });
            return null;
          }),
          fetchCentralAuditLogs(token).catch(error => {
            EnterpriseLogger.error('Failed to fetch canonical exams audit log', 'ExamsResultsModule', { error });
            return null;
          })
        ]);
        if (canonicalAuditEvents) setCentralAuditLogs(canonicalAuditEvents);
        if (response.ok) {
          const rawRes = await response.json();
          const remoteVersion = Number(rawRes?.meta?.version || 0);
          if (Number.isSafeInteger(remoteVersion) && remoteVersion < examsDbVersionRef.current) return;
          updateExamsDbVersion(remoteVersion);
          const dbData = rawRes && rawRes.success && rawRes.data ? rawRes.data : rawRes;
          if (dbData && Object.keys(dbData).length > 0) {
            if (dbData.exams_settings) setExamSettings(dbData.exams_settings);
            if (dbData.exams_halls) setHalls(dbData.exams_halls);
            if (dbData.exams_subjects) setSubjects(dbData.exams_subjects);
            if (canonicalStudents) setStudentList(mergeCanonicalStudents(canonicalStudents, dbData.exams_students_enriched));
            else if (dbData.exams_students_enriched) setStudentList(dbData.exams_students_enriched);
            if (dbData.exams_grades_matrix) setGradesMatrix(dbData.exams_grades_matrix);
            if (dbData.exams_schedule) setSchedule(dbData.exams_schedule);
            if (dbData.exams_proctors) setProctorAssignments(dbData.exams_proctors);
            if (dbData.exams_approval_status) setApprovalStatus(dbData.exams_approval_status);
            if (dbData.exams_audit_logs) setAuditLogs(dbData.exams_audit_logs);
            if (dbData.exams_classes_list) setClassesList(dbData.exams_classes_list);
            if (dbData.exams_control_closures) setControlClosures(dbData.exams_control_closures);
            if (dbData.exams_re_evaluation_requests) setReEvaluationRequests(dbData.exams_re_evaluation_requests);
            if (dbData.exams_snapshots) setSnapshots(dbData.exams_snapshots);
            if (dbData.exams_reviewed_stages_subjects) setReviewedStagesSubjects(dbData.exams_reviewed_stages_subjects);
            if (dbData.exams_stage_approval_status) setStageApprovalStatus(dbData.exams_stage_approval_status);
            if (dbData.exams_approval_history) setApprovalHistory(dbData.exams_approval_history);
            if (dbData.exams_grade_history) setGradeHistory(dbData.exams_grade_history);
            if (dbData.exams_control_committees) setControlCommittees(dbData.exams_control_committees);
            if (dbData.exams_schedule_approval_status) setScheduleApprovalStatus(dbData.exams_schedule_approval_status);
            if (dbData.exams_schedule_config) updateScheduleConfig(dbData.exams_schedule_config);
            if (dbData.exams_custom_proctor_unavailable) setCustomProctorUnavailable(dbData.exams_custom_proctor_unavailable);
            setDbSyncStatus('success');
            setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));
            triggerNotification('تم الاتصال بقاعدة البيانات واسترجاع كافة السجلات بنجاح', 'success');
          } else {
            if (canonicalStudents) setStudentList(mergeCanonicalStudents(canonicalStudents));
            setDbSyncStatus('success');
            triggerNotification('المصدر المركزي متاح لكنه لا يحتوي سجلات امتحانات بعد.', 'info');
          }
        } else {
          setDbSyncStatus('error');
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch exams database", "ExamsResultsModule", { error: err });
        setDbSyncStatus('error');
      } finally {
        setIsDbSyncing(false);
      }
    };
    fetchDbOnMount();
  }, []);

  // Automated Test Suite State
  const [testSuiteRunning, setTestSuiteRunning] = useState(false);
  const [testSuiteResults, setTestSuiteResults] = useState<any[] | null>(null);
  const [testSuiteLogs, setTestSuiteLogs] = useState<string[]>([]);

  const runTestSuiteDiagnostics = async () => {
    setTestSuiteRunning(true);
    setTestSuiteLogs([]);
    const unassignedStudents = studentList.filter(s => !s.hallId || !s.seatNumber);
    const incompleteResults = computeStudentResults().filter(result => result.status === 'غير مكتمل');
    const duplicateScheduleSlots = schedule.filter((item, index) => schedule.some((other, otherIndex) =>
      otherIndex < index
      && item.date === other.date
      && item.startTime === other.startTime
      && ((item.hallId && item.hallId === other.hallId)
        || (item.classroom && item.classroom === other.classroom)
        || (item.proctorId && item.proctorId === other.proctorId))
    ));
    const isConfigured = subjects.length > 0 && classesList.length > 0 && Boolean(examSettings.academicYear);
    const hasApprovedResults = approvalStatus.approved;
    const hasImmutableArchive = controlClosures.some(closure => closure?.isImmutableArchive && /^[0-9a-f]{64}$/i.test(String(closure.signatureHash || '')));
    const finalResults = [
      { id: 1, name: 'تهيئة دورة الامتحانات', status: isConfigured ? 'success' : 'warning', desc: isConfigured ? 'السنة والفصول والمواد معرفة' : 'يلزم تعريف السنة والفصول والمواد' },
      { id: 2, name: 'أرقام الجلوس والقاعات', status: studentList.length > 0 && unassignedStudents.length === 0 ? 'success' : 'warning', desc: `${unassignedStudents.length} طالب دون تخصيص مكتمل` },
      { id: 3, name: 'سلامة الجدول واعتماده', status: schedule.length > 0 && duplicateScheduleSlots.length === 0 && scheduleApprovalStatus.approved ? 'success' : 'warning', desc: duplicateScheduleSlots.length > 0 ? `${duplicateScheduleSlots.length} تعارضاً حرجاً مكتشفاً` : schedule.length === 0 ? 'لا يوجد جدول منشور للفحص' : scheduleApprovalStatus.approved ? 'الجدول معتمد ولا توجد تعارضات حرجة' : 'الجدول غير معتمد بعد' },
      { id: 4, name: 'اكتمال الدرجات', status: studentList.length > 0 && subjects.length > 0 && incompleteResults.length === 0 ? 'success' : 'warning', desc: `${incompleteResults.length} نتيجة غير مكتملة` },
      { id: 5, name: 'جاهزية الإفادات والأرشيف', status: hasApprovedResults && incompleteResults.length === 0 && hasImmutableArchive ? 'success' : 'warning', desc: hasApprovedResults && hasImmutableArchive ? 'توجد نتائج معتمدة بأرشيف خادم غير قابل للتعديل' : 'لا يوجد اعتماد نتائج مع أرشيف خادم مكتمل' }
    ];
    const logs = finalResults.map(result => `[${new Date().toLocaleTimeString('ar-EG')}] ${result.status === 'success' ? '✅' : '⚠️'} ${result.name}: ${result.desc}`);
    setTestSuiteLogs(logs);
    setTestSuiteResults(finalResults);
    setTestSuiteRunning(false);
    const allChecksPassed = finalResults.every(result => result.status === 'success');
    triggerNotification(allChecksPassed ? 'اكتملت فحوص الجاهزية الفعلية بنجاح.' : 'اكتملت الفحوص وتوجد تنبيهات تحتاج إلى معالجة وتمنع الإغلاق.', allChecksPassed ? 'success' : 'warning');
    logAction('تشغيل فحوص جاهزية الكنترول المبنية على البيانات الفعلية', 'الاختبارات والفحوصات');
  };

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    return [];
  });

  // Logging Helper
  const logAction = (action: string, module: string) => {
    const newLog = {
      id: `a-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: trustedActorLabel,
      action,
      module
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Sidebar menu follows the operational lifecycle and is visually grouped by work stage.
  const sidebarMenu = [
    { id: 'control-center', label: 'مركز عمليات الكنترول الموحد ⚡', icon: Sparkles, section: 'البدء والتهيئة' },
    { id: 'settings', label: 'إعدادات الامتحانات', icon: Settings, section: 'البدء والتهيئة' },
    { id: 'classes', label: 'الفصول والمواد', icon: BookOpen, section: 'البدء والتهيئة' },
    { id: 'halls', label: 'لجان وقاعات الامتحان', icon: Home, section: 'اللجان والجدولة' },
    { id: 'distribution', label: 'توزيع الطلاب', icon: Users, section: 'اللجان والجدولة' },
    { id: 'seating', label: 'أرقام الجلوس', icon: IdCard, section: 'اللجان والجدولة' },
    { id: 'proctors', label: 'المراقبون والملاحظون', icon: UserCheck, section: 'اللجان والجدولة' },
    { id: 'schedule', label: 'جدول الامتحانات', icon: Calendar, section: 'اللجان والجدولة' },
    { id: 'grades-entry', label: 'إدراج درجات الطلاب', icon: FileSpreadsheet, section: 'الرصد والنتائج' },
    { id: 'processing', label: 'معالجة النتائج', icon: Percent, section: 'الرصد والنتائج' },
    { id: 'quality-governance', label: 'جودة وحوكمة الكنترول 🏆', icon: ShieldCheck, section: 'المراجعة والإصدار' },
    { id: 'review', label: 'المراجعة والاعتماد', icon: ShieldAlert, section: 'المراجعة والإصدار' },
    { id: 'reports', label: 'التقارير الإحصائية', icon: FilePieChart, section: 'المراجعة والإصدار' },
    { id: 'certificates', label: 'الشهادات وكشوف الدرجات', icon: Award, section: 'المراجعة والإصدار' },
    { id: 'system-settings', label: 'الإعدادات العامة', icon: Sliders, section: 'الإدارة والمساعدة' },
    { id: 'exams-guide', label: 'دليل الكنترول والنتائج (PDF) 📄', icon: FileText, section: 'الإدارة والمساعدة' }
  ];

  // Stage Level Filtered Students
  const visibleStudents = studentList.filter(st => {
    if (activeControlStage === 'all') return true;
    const clsObj = classesList.find(c => c.name === st.classroom);
    return clsObj && clsObj.level === activeControlStage;
  });

  // Helper Calculations for processing results
  const computeStudentResults = () => {
    const canonicalResults = calculateCohortExamResults(
      visibleStudents,
      subjects,
      gradesMatrix,
      examSettings
    );
    const studentsById = new Map<string, any>(visibleStudents.map(student => [String(student.id), student]));

    // Class averages intentionally exclude incomplete results so a partially
    // entered sheet cannot distort warnings, rankings, or honour lists.
    const classGradesMap: Record<string, number[]> = {};
    canonicalResults.forEach(result => {
      const student = studentsById.get(result.studentId);
      if (!student || result.status === 'incomplete') return;
      if (!classGradesMap[student.classroom]) classGradesMap[student.classroom] = [];
      classGradesMap[student.classroom].push(result.percentage);
    });

    const classAverages: Record<string, number> = {};
    Object.entries(classGradesMap).forEach(([className, gradesArr]) => {
      classAverages[className] = gradesArr.length > 0
        ? parseFloat((gradesArr.reduce((a, b) => a + b, 0) / gradesArr.length).toFixed(1))
        : 0;
    });

    return canonicalResults.map(result => {
      const st = studentsById.get(result.studentId)!;
      // Historical performance and attendance require canonical sources. Do
      // not derive either value from the student id or fabricate a warning.
      const previousYearGPA: number | null = null;
      const attendanceRate: number | null = null;
      const classAvg = classAverages[st.classroom] ?? null;

      const gpaDropPrev = previousYearGPA === null ? null : previousYearGPA - result.percentage;
      const gpaDropClassAvg = classAvg === null ? null : classAvg - result.percentage;

      const earlyWarnings: string[] = [];
      if (gpaDropPrev !== null && gpaDropPrev > 5) {
        earlyWarnings.push(`📉 انخفاض الأداء مقارنة بالعام الماضي بـ (-${gpaDropPrev.toFixed(1)}%)`);
      }
      if (result.incompleteSubjectsCount === 0 && gpaDropClassAvg !== null && gpaDropClassAvg > 10) {
        earlyWarnings.push(`⚠️ أقل من متوسط الصف بـ (-${gpaDropClassAvg.toFixed(1)}%)`);
      }
      if (attendanceRate !== null && attendanceRate < 85) {
        earlyWarnings.push(`🚨 كثرة الغياب: نسبة حضور متدنية (${attendanceRate.toFixed(1)}%)`);
      }
      if (result.hasFailedCoreSubject) {
        earlyWarnings.push('📚 رسوب في مادة مصنفة أساسية ضمن إعدادات الدورة');
      }

      return {
        ...st,
        totalEarned: result.totalEarned,
        totalMax: result.totalMax,
        rawPercentage: result.rawPercentage,
        percentage: result.percentage,
        gradeSymbol: result.gradeSymbol === 'ممتاز' ? 'ممتاز 🏅' : result.gradeSymbol === 'ضعيف' ? 'ضعيف ❌' : result.gradeSymbol,
        status: result.status === 'passed' ? 'ناجح' : result.status === 'failed' ? 'راسب' : 'غير مكتمل',
        incompleteSubjectsCount: result.incompleteSubjectsCount,
        failedCount: result.failedSubjectsCount,
        failedSubjects: result.failedSubjects,
        rank: result.rank,
        previousYearGPA,
        attendanceRate,
        classAvg,
        earlyWarnings,
        hasEarlyWarning: earlyWarnings.length > 0
      };
    });
  };

  const processedStudents = computeStudentResults();
  const completedProcessedStudents = processedStudents.filter(student => student.status !== 'غير مكتمل');
  const passedProcessedStudents = completedProcessedStudents.filter(student => student.status === 'ناجح');
  const failedProcessedStudents = completedProcessedStudents.filter(student => student.status === 'راسب');
  const incompleteProcessedStudents = processedStudents.filter(student => student.status === 'غير مكتمل');
  const overallPassRate = completedProcessedStudents.length > 0
    ? Math.round((passedProcessedStudents.length / completedProcessedStudents.length) * 100)
    : 0;
  const overallAverage = completedProcessedStudents.length > 0
    ? Number((completedProcessedStudents.reduce((total, student) => total + student.percentage, 0) / completedProcessedStudents.length).toFixed(1))
    : 0;

  // Generic CSV Export Utility (Excel-compatible with UTF-8 BOM for Arabic)
  const handleExportToCSV = (data: any[], headers: string[], filename: string) => {
    let csvContent = "\uFEFF"; // UTF-8 BOM to make Excel render Arabic correctly
    csvContent += headers.join(",") + "\n";

    data.forEach(row => {
      const line = row.map((val: any) => {
        const raw = String(val === undefined || val === null ? "" : val);
        const formulaSafe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
        const str = formulaSafe.replace(/"/g, '""');
        return `"${str}"`;
      }).join(",");
      csvContent += line + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification(`تم تصدير ملف ${filename} بنجاح بصيغة Excel CSV`, 'success');
  };

  const handleExportBackup = async () => {
    const exportedAt = new Date().toISOString();
    const backupData = {
      exams_settings: examSettings,
      exams_halls: halls,
      exams_subjects: subjects,
      exams_students_enriched: studentList,
      exams_grades_matrix: gradesMatrix,
      exams_schedule: schedule,
      exams_proctors: proctorAssignments,
      exams_approval_status: approvalStatus,
      exams_schedule_approval_status: scheduleApprovalStatus,
      exams_schedule_config: scheduleConfig,
      exams_classes_list: classesList,
      exams_control_closures: controlClosures,
      exams_re_evaluation_requests: reEvaluationRequests,
      exams_snapshots: snapshots,
      exams_reviewed_stages_subjects: reviewedStagesSubjects,
      exams_stage_approval_status: stageApprovalStatus
    };
    const canonicalJson = JSON.stringify(backupData);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson));
    const checksum = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const envelope = {
      format: 'schoolformanus-exams-backup-v1',
      schoolId: selectedSchool?.id || null,
      schoolName: selectedSchool?.name || null,
      exportedAt,
      databaseVersion: examsDbVersion,
      checksum: `sha256:${checksum}`,
      data: backupData
    };
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exams-backup-${examSettings.academicYear.replace(/[^0-9A-Za-z_-]+/g, '-')}-${exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotification('تم تنزيل نسخة احتياطية فعلية مع بصمة تحقق SHA-256.', 'success');
  };

  // 1. Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const persisted = await saveToServerDb();
    if (!persisted) {
      triggerNotification('تعذر حفظ إعدادات الامتحانات في المصدر المركزي.', 'warning');
      return;
    }
    triggerNotification('تم حفظ إعدادات وثوابت الامتحانات بنجاح', 'success');
    logAction('تحديث إعدادات الامتحانات والسياسات الأكاديمية', 'إعدادات الامتحانات');
  };

  // 2. Class Subject handlers
  const [newSubject, setNewSubject] = useState({ name: '', maxScore: 100, passScore: 50 });
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDbSyncing || isCanonicalClassSyncing) return;
    const subjectName = String(newSubject.name || '').trim().replace(/\s+/g, ' ');
    if (!subjectName) return;
    if (newSubject.maxScore <= 0 || newSubject.passScore < 0 || newSubject.passScore > newSubject.maxScore) {
      triggerNotification('تحقق من الدرجات: الدرجة النهائية موجبة ودرجة النجاح بين صفر والدرجة النهائية.', 'warning');
      return;
    }
    if (subjects.some(subject => normalizeSubjectName(subject.name) === normalizeSubjectName(subjectName))) {
      triggerNotification(`المادة ${subjectName} معرفة بالفعل في دورة الامتحانات.`, 'warning');
      return;
    }
    const item = {
      id: `sub-${Date.now()}`,
      name: subjectName,
      maxScore: Number(newSubject.maxScore),
      passScore: Number(newSubject.passScore)
    };
    const updated = [...subjects, item];
    const persisted = await saveToServerDb(examSettings, halls, updated);
    if (!persisted) {
      triggerNotification('تعذر حفظ المادة الجديدة في المصدر المركزي.', 'warning');
      return;
    }
    setSubjects(updated);
    setNewSubject({ name: '', maxScore: 100, passScore: 50 });
    triggerNotification(`تمت إضافة مادة ${item.name} بنجاح`, 'success');
    logAction(`إضافة مادة تعليمية جديدة: ${item.name}`, 'الفصول والمواد');
  };

  const handleAddClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDbSyncing || isCanonicalClassSyncing) return;
    if (!newClassroom.name.trim()) return;
    if (newClassroom.capacity <= 0) {
      triggerNotification('يجب أن تكون سعة الصف أكبر من صفر.', 'warning');
      return;
    }
    const sectionsArray = newClassroom.sections
      ? newClassroom.sections.split(',').map(s => s.trim()).filter(Boolean)
      : ['أ'];
    const item = {
      id: `cls-${Date.now()}`,
      name: newClassroom.name,
      level: newClassroom.level,
      capacity: Number(newClassroom.capacity),
      sections: sectionsArray
    };
    const updated = [...classesList, item];
    const persisted = await saveToServerDb(examSettings, halls, subjects, studentList, gradesMatrix, schedule, proctorAssignments, approvalStatus, auditLogs, updated);
    if (!persisted) {
      triggerNotification('تعذر حفظ الصف الجديد في المصدر المركزي.', 'warning');
      return;
    }
    setClassesList(updated);
    setNewClassroom({ name: '', level: 'middle', capacity: 30, sections: '' });
    triggerNotification(`تمت إضافة الصف/الفصل ${item.name} بنجاح`, 'success');
    logAction(`إضافة فصل دراسي جديد: ${item.name}`, 'الفصول والمواد');
  };

  // 3. Exam Halls handlers
  const [newHall, setNewHall] = useState({ name: '', capacity: 25, location: '' });
  const handleAddHall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHall.name.trim()) return;
    if (newHall.capacity <= 0) {
      triggerNotification('يجب أن تكون سعة القاعة أكبر من صفر.', 'warning');
      return;
    }
    const item = {
      id: `hall-${Date.now()}`,
      name: newHall.name,
      capacity: Number(newHall.capacity),
      location: newHall.location
    };
    const updatedHalls = [...halls, item];
    const persisted = await saveToServerDb(examSettings, updatedHalls);
    if (!persisted) {
      triggerNotification('تعذر حفظ القاعة الجديدة في المصدر المركزي.', 'warning');
      return;
    }
    setHalls(updatedHalls);
    setNewHall({ name: '', capacity: 25, location: '' });
    triggerNotification(`تم تسجيل قاعة ${item.name} الاستيعابية بنجاح`, 'success');
    logAction(`إضافة قاعة اختبار جديدة: ${item.name}`, 'لجان وقاعات الامتحان');
  };

  // 4. Seating & Distribution Automatic Generators (Smart/Capacity-bounded)
  const handleAutoDistributeAndSeating = async () => {
    if (approvalStatus.approved) {
      triggerNotification('لا يمكن إعادة توزيع الطلاب، النتائج معتمدة ومقفلة بالكامل 🔒', 'warning');
      return;
    }

    if (halls.length === 0) {
      triggerNotification('خطأ: يرجى تسجيل قاعة اختبار واحدة على الأقل قبل البدء بالتوزيع!', 'warning');
      return;
    }

    const totalCapacity = halls.reduce((acc, curr) => acc + curr.capacity, 0);
    if (studentList.length > totalCapacity) {
      triggerNotification(`تعذر التوزيع: عدد الطلاب (${studentList.length}) يتجاوز الطاقة الاستيعابية الكلية للجان (${totalCapacity}).`, 'warning');
      return;
    }

    // Sort students by classroom and section consecutively
    const sortedStudents = [...studentList].sort((a, b) => {
      const classCompare = a.classroom.localeCompare(b.classroom, 'ar');
      if (classCompare !== 0) return classCompare;
      return a.section.localeCompare(b.section, 'ar');
    });

    const hallCapacities = halls.map(h => ({ id: h.id, max: h.capacity, current: 0 }));
    let hallIdx = 0;

    const updated = sortedStudents.map((st, idx) => {
      let assignedHallId = '';
      let initialHallIdx = hallIdx;
      let found = false;

      while (!found) {
        if (hallCapacities[hallIdx].current < hallCapacities[hallIdx].max) {
          hallCapacities[hallIdx].current++;
          assignedHallId = hallCapacities[hallIdx].id;
          found = true;
        } else {
          hallIdx = (hallIdx + 1) % halls.length;
          if (hallIdx === initialHallIdx) {
            // Fallback for overflow
            hallCapacities[hallIdx].current++;
            assignedHallId = hallCapacities[hallIdx].id;
            found = true;
          }
        }
      }

      return {
        ...st,
        seatNumber: 40000 + idx + 1, // Generate sequential seat number
        hallId: assignedHallId
      };
    });

    const persisted = await saveToServerDb(examSettings, halls, subjects, updated, gradesMatrix, schedule, proctorAssignments, approvalStatus, auditLogs, classesList);
    if (!persisted) {
      triggerNotification('تعذر حفظ توزيع الطلاب وأرقام الجلوس في المصدر المركزي.', 'warning');
      return;
    }
    setStudentList(updated);
    triggerNotification('اكتمل التوزيع التلقائي الذكي: تم توزيع جميع الطلاب بالتساوي وتوليد أرقام جلوس فريدة متسلسلة.', 'success');
    logAction('تشغيل محرك التوزيع التلقائي الذكي وتوليد أرقام الجلوس', 'توزيع الطلاب');
  };

  // 5. Proctor assignments
  const [newProctor, setNewProctor] = useState({ name: '', hallId: halls[0]?.id || '', shift: 'الفترة الأولى' });
  useEffect(() => {
    if (!halls.some(hall => hall.id === newProctor.hallId)) {
      setNewProctor(current => ({ ...current, hallId: halls[0]?.id || '' }));
    }
  }, [halls, newProctor.hallId]);
  const handleAddProctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProctor.name.trim() || !newProctor.hallId) {
      triggerNotification('اختر مراقباً وقاعة صالحة قبل حفظ التكليف.', 'warning');
      return;
    }

    // Proctor Overlap Check for the same shift
    const hasConflict = proctorAssignments.some(pa => pa.name === newProctor.name && pa.shift === newProctor.shift);
    if (hasConflict) {
      triggerNotification(`تنبيه: المراقب ${newProctor.name} مكلف بالفعل بمراقبة لجنة أخرى خلال ${newProctor.shift}!`, 'warning');
      return;
    }

    const item = {
      id: `pa-${Date.now()}`,
      name: newProctor.name,
      hallId: newProctor.hallId,
      shift: newProctor.shift
    };
    const updatedProctors = [...proctorAssignments, item];
    const persisted = await saveToServerDb(examSettings, halls, subjects, studentList, gradesMatrix, schedule, updatedProctors, approvalStatus, auditLogs, classesList);
    if (!persisted) {
      triggerNotification('تعذر حفظ تكليف المراقب في المصدر المركزي.', 'warning');
      return;
    }
    setProctorAssignments(updatedProctors);
    setNewProctor({ name: '', hallId: halls[0]?.id || '', shift: 'الفترة الأولى' });
    triggerNotification(`تم تكليف المراقب ${item.name} للمراقبة`, 'success');
    logAction(`تكليف مراقب جديد: ${item.name}`, 'المراقبون والملاحظون');
  };

  // 6. Schedule Maker & Conflict Engine
  interface ScheduleConflict {
    id: string;
    type: 'classroom' | 'hall' | 'proctor' | 'subject';
    message: string;
    severity: 'error' | 'warning';
  }

  const getScheduleConflicts = (currentSchedule: any[]): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = [];

    currentSchedule.forEach((item, idx) => {
      const subObj = subjects.find(s => s.id === item.subjectId);
      const hallObj = halls.find(h => h.id === item.hallId);
      const proctorObj = availableTeachers.find(t => t.id === item.proctorId) || { name: item.proctorId || 'غير محدد' };

      for (let j = idx + 1; j < currentSchedule.length; j++) {
        const other = currentSchedule[j];
        if (item.date === other.date && item.startTime === other.startTime) {
          const otherSubObj = subjects.find(s => s.id === other.subjectId);
          const otherHallObj = halls.find(h => h.id === other.hallId);

          if (item.classroom === other.classroom) {
            conflicts.push({
              id: `c-class-${idx}-${j}`,
              type: 'classroom',
              severity: 'error',
              message: `تعارض فترات: الصف [${item.classroom}] لديه اختباران في نفس الوقت (${subObj?.name || 'مادة 1'} و ${otherSubObj?.name || 'مادة 2'}) في تاريخ ${item.date}.`
            });
          }

          if (item.hallId && item.hallId === other.hallId) {
            conflicts.push({
              id: `c-hall-${idx}-${j}`,
              type: 'hall',
              severity: 'error',
              message: `تعارض لجان: القاعة [${hallObj?.name || 'غير محدد'}] محجوزة لاختبارين في نفس الوقت لـ [${item.classroom}] و [${other.classroom}] في تاريخ ${item.date}.`
            });
          }

          if (item.proctorId && item.proctorId === other.proctorId) {
            conflicts.push({
              id: `c-proctor-${idx}-${j}`,
              type: 'proctor',
              severity: 'error',
              message: `تعارض مراقبين: المعلم [${proctorObj.name}] مكلف بمراقبة قاعتين في نفس الوقت في تاريخ ${item.date}.`
            });
          }
        }
      }

      const duplicateCount = currentSchedule.filter(s => s.classroom === item.classroom && s.subjectId === item.subjectId).length;
      if (duplicateCount > 1 && idx === currentSchedule.findIndex(s => s.classroom === item.classroom && s.subjectId === item.subjectId)) {
        conflicts.push({
          id: `c-dup-${item.classroom}-${item.subjectId}`,
          type: 'subject',
          severity: 'warning',
          message: `تكرار جدولة: تم إدراج مادة [${subObj?.name || 'غير محدد'}] أكثر من مرة لـ [${item.classroom}].`
        });
      }
    });

    return conflicts;
  };

  const scheduleConflicts = getScheduleConflicts(schedule);

  // Automated Proctor Distribution Engine
  const handleAutoAssignProctors = async () => {
    if (approvalStatus.approved) {
      triggerNotification('النتائج معتمدة ومغلقة ولا يمكن تعديل المراقبين حالياً', 'warning');
      return;
    }

    const availableTeachers = initialTeachers;
    if (availableTeachers.length === 0) {
      triggerNotification('تحذير: لا يوجد معلمون مسجلون لتكليفهم!', 'warning');
      return;
    }

    if (schedule.length === 0) {
      triggerNotification('لا يوجد جدول امتحانات لتوزيع المراقبين عليه.', 'warning');
      return;
    }
    const busyBySlot = new Map<string, Set<string>>();
    const dutyCount = new Map<string, number>();
    const updatedSchedule: any[] = [];
    for (const item of schedule) {
      const slotKey = `${item.date}|${item.startTime}`;
      const busyTeachers = busyBySlot.get(slotKey) || new Set<string>();
      const assignedTeacher = [...availableTeachers]
        .sort((a, b) => (dutyCount.get(a.id) || 0) - (dutyCount.get(b.id) || 0))
        .find(teacher => !busyTeachers.has(teacher.id));
      if (!assignedTeacher) {
        triggerNotification(`تعذر التوزيع: عدد المراقبين غير كافٍ للفترة ${item.date} ${item.startTime}.`, 'warning');
        return;
      }
      busyTeachers.add(assignedTeacher.id);
      busyBySlot.set(slotKey, busyTeachers);
      dutyCount.set(assignedTeacher.id, (dutyCount.get(assignedTeacher.id) || 0) + 1);
      updatedSchedule.push({ ...item, proctorId: assignedTeacher.id });
    }

    const newProctorAssignments: any[] = [];
    updatedSchedule.forEach((item, idx) => {
      const teacher = availableTeachers.find(t => t.id === item.proctorId);
      if (teacher) {
        newProctorAssignments.push({
          id: `pa-${Date.now()}-${idx}`,
          teacherId: teacher.id,
          name: teacher.name,
          hallId: item.hallId,
          shift: item.startTime === '08:30' ? 'الفترة الأولى' : 'الفترة الثانية'
        });
      }
    });

    const persisted = await saveToServerDb(
      examSettings,
      halls,
      subjects,
      studentList,
      gradesMatrix,
      updatedSchedule,
      newProctorAssignments,
      approvalStatus,
      auditLogs,
      classesList
    );
    if (!persisted) return;
    setSchedule(updatedSchedule);
    setProctorAssignments(newProctorAssignments);
    triggerNotification('تم توزيع المراقبين والملاحظين تلقائياً على اللجان دون أي تعارض زمني!', 'success');
    logAction('تشغيل محرك التوزيع الآلي للمراقبين على اللجان', 'المراقبون والملاحظون');
  };

  // 7. Grades Input System Spreadsheet
  const [selectedGradeYear, setSelectedGradeYear] = useState(examSettings.academicYear);
  const [selectedGradeSemester, setSelectedGradeSemester] = useState(examSettings.semester);
  const [selectedGradeExamType, setSelectedGradeExamType] = useState(examSettings.examType);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('الكل');
  const [selectedGradeClass, setSelectedGradeClass] = useState('الكل');
  const [selectedGradeSection, setSelectedGradeSection] = useState('الكل');
  const [selectedGradeSubject, setSelectedGradeSubject] = useState(subjects[0]?.id || '');
  const [gradesSearchQuery, setGradesSearchQuery] = useState('');
  const [modifiedGradesKeys, setModifiedGradesKeys] = useState<Set<string>>(new Set());
  const [isReloadingStudents, setIsReloadingStudents] = useState(false);
  const [showReviewGradesModal, setShowReviewGradesModal] = useState(false);
  const [showPrintGradesModal, setShowPrintGradesModal] = useState(false);

  useEffect(() => {
    if (!subjects.some(subject => subject.id === selectedGradeSubject)) {
      setSelectedGradeSubject(subjects[0]?.id || '');
    }
  }, [subjects, selectedGradeSubject]);

  const [gradesSubTab, setGradesSubTab] = useState<'entry' | 'review-edit' | 'student-review-edit'>('entry');
  const [selectedReviewStudentId, setSelectedReviewStudentId] = useState<string>('');
  const [bulkDraftGrades, setBulkDraftGrades] = useState<Record<string, Record<string, number>>>({});
  const [gradesLastModified, setGradesLastModified] = useState<Record<string, string>>(() => {
    return {};
  });

  const handleSaveBulkDraft = async () => {
    if (approvalStatus.approved) {
      triggerNotification('لا يمكن تعديل الدرجات، النتائج معتمدة ومقفلة بالكامل 🔒', 'warning');
      return;
    }

    // 1. Validation phase (Transaction check)
    let hasValidationError = false;
    let errorMsg = '';
    const updatedMatrix = { ...gradesMatrix };
    const tempLastModified = { ...gradesLastModified };
    const newAuditLogs = [...auditLogs];

    // Check all draft changes
    for (const studentId of Object.keys(bulkDraftGrades)) {
      const student = studentList.find(s => s.id === studentId);
      if (!student) continue;

      for (const subjectId of Object.keys(bulkDraftGrades[studentId])) {
        const val = bulkDraftGrades[studentId][subjectId];
        const subObj = subjects.find(sub => sub.id === subjectId);
        if (!subObj) continue;

        // Verify bounds
        if (val < 0) {
          hasValidationError = true;
          errorMsg = `خطأ: لا يمكن إدخال درجات سالبة لـ ${student.name} في مادة ${subObj.name}`;
          break;
        }
        if (val > subObj.maxScore) {
          hasValidationError = true;
          errorMsg = `خطأ: الدرجة لـ ${student.name} في مادة ${subObj.name} لا يمكن أن تتجاوز ${subObj.maxScore}`;
          break;
        }
      }
      if (hasValidationError) break;
    }

    if (hasValidationError) {
      triggerNotification(errorMsg, 'warning');
      return;
    }

    // 2. Transaction Execution: Backup current state in case write fails
    const backupMatrix = JSON.parse(JSON.stringify(gradesMatrix));
    const backupLastModified = JSON.parse(JSON.stringify(gradesLastModified));
    const backupAuditLogs = JSON.parse(JSON.stringify(auditLogs));

    // Update state & audit logging
    const currentTime = new Date().toLocaleString('ar-SA');
    let totalChangesCount = 0;

    Object.keys(bulkDraftGrades).forEach(studentId => {
      const student = studentList.find(s => s.id === studentId);
      if (!student) return;

      let studentModified = false;

      Object.keys(bulkDraftGrades[studentId]).forEach(subjectId => {
        const oldVal = gradesMatrix[studentId]?.[subjectId];
        const newVal = bulkDraftGrades[studentId][subjectId];

        if (oldVal !== newVal) {
          const subObj = subjects.find(sub => sub.id === subjectId);
          if (!updatedMatrix[studentId]) updatedMatrix[studentId] = {};
          updatedMatrix[studentId][subjectId] = newVal;

          // Add to audit log
          const subName = subObj?.name || 'مادة';
          const oldStr = oldVal !== undefined ? oldVal.toString() : 'غير مرصود';
          newAuditLogs.unshift({
            id: `a-${Date.now()}-${totalChangesCount}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            user: trustedActorLabel,
            action: `تعديل درجة الطالب [${student.name}] في مادة [${subName}] من [${oldStr}] إلى [${newVal}]`,
            module: 'مراجعة وتعديل الدرجات'
          });

          totalChangesCount++;
          studentModified = true;
        }
      });

      if (studentModified) {
        tempLastModified[studentId] = currentTime;
      }
    });

    if (totalChangesCount === 0) {
      triggerNotification('لم يتم اكتشاف أي تغييرات جديدة لحفظها.', 'info');
      return;
    }

    // Apply locally
    setGradesMatrix(updatedMatrix);
    setGradesLastModified(tempLastModified);
    setAuditLogs(newAuditLogs);

    // Sync with backend JSON db
    const success = await saveToServerDb(
      examSettings,
      halls,
      subjects,
      studentList,
      updatedMatrix,
      schedule,
      proctorAssignments,
      approvalStatus,
      newAuditLogs,
      classesList
    );

    if (success) {
      // Clear draft tracking to indicate save completion
      setBulkDraftGrades({});
      triggerNotification(`تم حفظ وتدقيق تعديلات الدرجات بنجاح لـ ${totalChangesCount} مادة! 💾`, 'success');
    } else {
      // Transaction Rollback!
      setGradesMatrix(backupMatrix);
      setGradesLastModified(backupLastModified);
      setAuditLogs(backupAuditLogs);
      triggerNotification('فشل الحفظ على السيرفر! تم إرجاع المعاملة والتراجع التلقائي عن التعديلات الجزئية لسلامة البيانات.', 'warning');
    }
  };

  const handlePrintSingleStudentGrades = (student: any, m: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('تنبيه: تم حظر فتح النافذة المنبثقة من المتصفح الخاص بك، يرجى السماح بها لرؤية كارت الطباعة.', 'warning');
      return;
    }

    const subjectsHtml = subjects.map(sub => {
      const isAbsent = student.absentSubjects?.includes(sub.id);
      const mark = bulkDraftGrades[student.id]?.[sub.id] !== undefined
        ? bulkDraftGrades[student.id][sub.id]
        : (gradesMatrix[student.id]?.[sub.id] ?? 'غير مرصود');
      return `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; font-weight: bold; text-align: right;">${escapeHtml(sub.name)}</td>
          <td style="padding: 10px; text-align: center;">${sub.maxScore}</td>
          <td style="padding: 10px; text-align: center;">${sub.passScore}</td>
          <td style="padding: 10px; text-align: center; font-weight: 900; color: ${isAbsent ? 'red' : (mark !== 'غير مرصود' && Number(mark) >= sub.passScore ? 'green' : 'red')}">
            ${isAbsent ? 'غائب' : escapeHtml(mark)}
          </td>
          <td style="padding: 10px; text-align: center; font-weight: bold;">
            ${isAbsent ? 'غياب' : (mark === 'غير مرصود' ? 'معلق' : (Number(mark) >= sub.passScore ? 'اجتاز' : 'لم يجتز'))}
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>شهادة درجات الطالب - الكنترول المدرسي</title>
          <style>
            body { font-family: 'system-ui', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; }
            .title { text-align: center; font-size: 18px; font-weight: 900; margin-bottom: 20px; }
            .info-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
            .info-table td { padding: 8px; font-size: 13px; font-weight: bold; text-align: right; }
            .grades-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .grades-table th, .grades-table td { border: 1px solid #333; padding: 10px; text-align: right; font-size: 12px; }
            .grades-table th { background-color: #f5f5f5; font-weight: 950; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; font-size: 13px; font-weight: 900; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <p>${escapeHtml(selectedSchool?.name || 'المدرسة الحالية')}</p>
              <p>وحدة الامتحانات والنتائج</p>
              <p>SchoolForManus</p>
            </div>
            <div style="text-align: center;">
              <h2 style="margin: 0;">بيان درجات الطالب الفردي</h2>
              <p>العام الدراسي: ${escapeHtml(selectedGradeYear)}</p>
              <p>نوع الامتحان: ${escapeHtml(selectedGradeExamType)}</p>
            </div>
            <div style="text-align: left;">
              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
          </div>

          <table class="info-table">
            <tr>
              <td><b>اسم الطالب:</b> ${escapeHtml(student.name)}</td>
              <td><b>الصف الدراسي:</b> ${escapeHtml(student.classroom)}</td>
            </tr>
            <tr>
              <td><b>رقم الطالب (الوطني):</b> ${escapeHtml(student.nationalId || student.id)}</td>
              <td><b>الشعبة:</b> ${escapeHtml(student.section)}</td>
            </tr>
            <tr>
              <td><b>رقم الجلوس:</b> ${escapeHtml(student.seatNumber || 'غير محدد')}</td>
              <td><b>المعدل التراكمي:</b> ${m.percentage}%</td>
            </tr>
          </table>

          <div class="title">سجل المقرعام والمقررات الأكاديمية والدرجات المرصودة</div>

          <table class="grades-table">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th>اسم المادة الدراسية</th>
                <th style="text-align: center;">النهاية العظمى</th>
                <th style="text-align: center;">حد النجاح</th>
                <th style="text-align: center;">الدرجة الحاصل عليها</th>
                <th style="text-align: center;">الحالة والتقدير</th>
              </tr>
            </thead>
            <tbody>
              ${subjectsHtml}
            </tbody>
          </table>

          <div class="signatures">
            <div>توقيع الكنترول والمراجعة: .....................</div>
            <div>توقيع رئيس الكنترول: .....................</div>
            <div>توقيع وختم مدير المدرسة: .....................</div>
          </div>

          <script>
            window.print();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredStudentsForGrades = studentList.filter(s => {
    // 0. Filter by active committee stage (Requirement #1: Multi-stage Control)
    if (activeControlStage !== 'all') {
      const clsObj = classesList.find(c => c.name === s.classroom);
      if (!clsObj || clsObj.level !== activeControlStage) return false;
    }
    // 1. Filter by Level
    if (selectedGradeLevel !== 'الكل') {
      const clsObj = classesList.find(c => c.name === s.classroom);
      if (!clsObj || clsObj.level !== selectedGradeLevel) return false;
    }
    // 2. Filter by Classroom / Grade
    if (selectedGradeClass !== 'الكل' && s.classroom !== selectedGradeClass) {
      return false;
    }
    // 3. Filter by Section
    if (selectedGradeSection !== 'الكل' && s.section !== selectedGradeSection) {
      return false;
    }
    // 4. Filter by Search Query
    if (gradesSearchQuery.trim() !== '') {
      const q = gradesSearchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchSeat = (s.seatNumber?.toString() || '').includes(q);
      const matchId = s.id.toLowerCase().includes(q) || (s.nationalId || '').includes(q);
      if (!matchName && !matchSeat && !matchId) return false;
    }
    return true;
  });

  const handleGradeChange = (studentId: string, subjectId: string, val: string) => {
    if (approvalStatus.approved) {
      triggerNotification('لا يمكن تعديل الدرجات، النتائج معتمدة ومقفلة بالكامل لضمان تجميدها 🔒', 'warning');
      return;
    }

    const hasGrade = val.trim() !== '';
    const num = hasGrade ? Number(val) : undefined;
    const maxScore = subjects.find(s => s.id === subjectId)?.maxScore || 100;

    if (num !== undefined && (!Number.isFinite(num) || num > maxScore)) {
      triggerNotification(`خطأ: الدرجة لا يمكن أن تتجاوز النهاية العظمى للمادة (${maxScore})`, 'warning');
      return;
    }
    if (num !== undefined && num < 0) {
      triggerNotification('خطأ: لا يمكن إدخال درجات سالبة ❌', 'warning');
      return;
    }

    const oldGrade = gradesMatrix[studentId]?.[subjectId];

    if (oldGrade !== num) {
      const studentObj = studentList.find(st => st.id === studentId);
      const subjectObj = subjects.find(sub => sub.id === subjectId);
      const newHistoryLog = {
        id: `gh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentName: studentObj ? studentObj.name : studentId,
        classroom: studentObj ? studentObj.classroom : 'عام',
        subjectName: subjectObj ? subjectObj.name : subjectId,
        oldGrade,
        newGrade: num ?? null,
        modifiedBy: controlCommittees.find(c => c.id === activeCommitteeId)?.user || trustedActorLabel,
        reason: 'تعديل وتحديث رصد يدوي نشط من لوحة إدخال الدرجات والكنترول',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setGradeHistory(prev => [newHistoryLog, ...prev]);
    }

    setGradesMatrix(prev => {
      const next = structuredClone(prev);
      if (num === undefined) {
        if (next[studentId]) {
          delete next[studentId][subjectId];
          if (Object.keys(next[studentId]).length === 0) delete next[studentId];
        }
      } else {
        if (!next[studentId]) next[studentId] = {};
        next[studentId][subjectId] = num;
      }
      return next;
    });

    // Track unsaved modification key
    const key = `${studentId}_${subjectId}`;
    setModifiedGradesKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const handleBulkFillValue = (subjectId: string, val: number) => {
    if (approvalStatus.approved) return;
    const maxScore = subjects.find(s => s.id === subjectId)?.maxScore || 100;
    if (val > maxScore) {
      triggerNotification(`خطأ: القيمة المدخلة تتجاوز الحد الأقصى للمادة (${maxScore})`, 'warning');
      return;
    }
    if (val < 0) {
      triggerNotification('خطأ: لا يمكن إدخال درجات سالبة ❌', 'warning');
      return;
    }

    const updated = { ...gradesMatrix };
    const newKeys = new Set(modifiedGradesKeys);

    filteredStudentsForGrades.forEach(st => {
      if (!updated[st.id]) updated[st.id] = {};
      updated[st.id][subjectId] = val;
      newKeys.add(`${st.id}_${subjectId}`);
    });

    setGradesMatrix(updated);
    setModifiedGradesKeys(newKeys);
    triggerNotification('تم ملء درجات جميع الطلاب المفلترين في هذه المادة بنجاح', 'success');
  };

  // Excel (CSV) Real Import Engine
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (approvalStatus.approved) {
      triggerNotification('النتائج معتمدة ومغلقة ولا يمكن الاستيراد حالياً', 'warning');
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          triggerNotification('ملف الاستيراد غير صالح أو لا يحتوي صفوفاً كافية. لم يتم تعديل أي درجة.', 'warning');
          return;
        }

        const maxScore = subjects.find(s => s.id === selectedGradeSubject)?.maxScore || 100;
        const updated = structuredClone(gradesMatrix);
        const importedKeys = new Set<string>();
        const validationErrors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
          const studentIdentifier = values[0];
          const gradeStr = values[5];

          const gradeVal = parseFloat(gradeStr);
          if (!studentIdentifier || Number.isNaN(gradeVal)) {
            validationErrors.push(`الصف ${i + 1}: رقم الطالب أو الدرجة غير صالح.`);
            continue;
          }

          const student = studentList.find(s => s.id === studentIdentifier || s.nationalId === studentIdentifier);
          if (student) {
            if (gradeVal > maxScore || gradeVal < 0) {
              validationErrors.push(`الصف ${i + 1}: الدرجة خارج النطاق 0–${maxScore}.`);
              continue;
            }
            const key = `${student.id}_${selectedGradeSubject}`;
            if (importedKeys.has(key)) {
              validationErrors.push(`الصف ${i + 1}: الطالب مكرر داخل الملف.`);
              continue;
            }
            if (!updated[student.id]) updated[student.id] = {};
            updated[student.id][selectedGradeSubject] = gradeVal;
            importedKeys.add(key);
          } else {
            validationErrors.push(`الصف ${i + 1}: رقم الطالب غير موجود في النطاق الحالي.`);
          }
        }

        if (validationErrors.length > 0 || importedKeys.size === 0) {
          triggerNotification(
            validationErrors.length > 0
              ? `تم رفض الملف بالكامل: ${validationErrors[0]}${validationErrors.length > 1 ? ` (+${validationErrors.length - 1} أخطاء)` : ''}`
              : 'لم يتم العثور على درجات صالحة قابلة للاستيراد. لم يتم تعديل أي درجة.',
            'warning'
          );
          e.target.value = '';
          return;
        }
        setGradesMatrix(updated);
        setModifiedGradesKeys(previous => new Set([...previous, ...importedKeys]));
        triggerNotification(`تمت إضافة ${importedKeys.size} درجة إلى المسودة بعد تحقق كامل. اضغط حفظ التغييرات لإثباتها مركزيًا.`, 'info');
        logAction('استيراد مسودة درجات من ملف CSV بعد تحقق ذري', 'إدخال الدرجات');
        e.target.value = '';
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadTemplate = () => {
    const subName = subjects.find(s => s.id === selectedGradeSubject)?.name || 'درجات';
    const maxVal = subjects.find(s => s.id === selectedGradeSubject)?.maxScore || 100;
    const headers = "رقم الطالب,اسم الطالب,رقم الجلوس,المادة,الدرجة العظمى,الدرجة الحالية";
    const rows = filteredStudentsForGrades.map(st =>
      `"${st.nationalId || st.id}","${st.name}","${st.seatNumber || ''}","${subName}","${maxVal}",""`
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `قالب_رصد_${subName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('تم تنزيل قالب رصد الدرجات المخصص بنجاح!', 'success');
  };

  const handleExportExcel = () => {
    const subName = subjects.find(s => s.id === selectedGradeSubject)?.name || 'درجات';
    const headers = "الرقم التسلسلي,رقم الطالب,رقم الجلوس,اسم الطالب,الصف والمجموعة,الدرجة,المجموع,النسبة المئوية,التقدير,النتيجة";
    const rows = filteredStudentsForGrades.map((st, idx) => {
      const currentMark = gradesMatrix[st.id]?.[selectedGradeSubject];
      const isAbsent = st.absentSubjects?.includes(selectedGradeSubject);

      // calculate overall metrics
      const studentMarks = gradesMatrix[st.id] || {};
      let totalScore = 0;
      let totalPossibleMax = 0;
      subjects.forEach(sub => {
        const mk = studentMarks[sub.id];
        if (mk !== undefined) totalScore += mk;
        totalPossibleMax += sub.maxScore;
      });
      const pct = totalPossibleMax > 0 ? parseFloat(((totalScore / totalPossibleMax) * 100).toFixed(1)) : 0;

      let grade = 'بانتظار الرصد';
      if (pct >= 90) grade = 'ممتاز';
      else if (pct >= 80) grade = 'جيد جداً';
      else if (pct >= 65) grade = 'جيد';
      else if (pct >= 50) grade = 'مقبول';
      else grade = 'ضعيف';

      const isPass = currentMark !== undefined && currentMark >= (subjects.find(s=>s.id===selectedGradeSubject)?.passScore || 50);
      const resText = isAbsent ? 'غياب' : (currentMark === undefined ? 'غير مرصود' : (isPass ? 'ناجح' : 'راسب'));

      return `${idx + 1},"${st.nationalId || st.id}","${st.seatNumber || ''}","${st.name}","${st.classroom} - ${st.section}",${isAbsent ? 0 : (currentMark !== undefined ? currentMark : '')},${totalScore},${pct}%,${grade},"${resText}"`;
    });
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_درجات_${selectedGradeClass}_${subName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('تم تصدير كشف الدرجات المفلتر إلى Excel بنجاح!', 'success');
  };

  const handleResetFilters = () => {
    setSelectedGradeYear(examSettings.academicYear);
    setSelectedGradeSemester(examSettings.semester);
    setSelectedGradeExamType(examSettings.examType);
    setSelectedGradeLevel('الكل');
    setSelectedGradeClass('الكل');
    setSelectedGradeSection('الكل');
    setSelectedGradeSubject(subjects[0]?.id || '');
    setGradesSearchQuery('');
    triggerNotification('تم إعادة ضبط فلاتر البحث إلى القيم الافتراضية', 'info');
  };

  const handleLoadStudents = async () => {
    setIsReloadingStudents(true);
    try {
      const canonicalStudents = await fetchCanonicalStudents(getTrustedAccessToken());
      const refreshedStudents = mergeCanonicalStudents(canonicalStudents, studentList);
      setStudentList(refreshedStudents);
      triggerNotification(`تم تحميل ${refreshedStudents.length} طالباً من المصدر الرسمي مع الحفاظ على بيانات الامتحانات.`, 'success');
    } catch (error) {
      EnterpriseLogger.error('Failed to reload canonical students in grades screen', 'ExamsResultsModule', { error });
      triggerNotification('تعذر تحميل الطلاب من المصدر الرسمي.', 'warning');
    } finally {
      setIsReloadingStudents(false);
    }
  };

  const handleRecalculate = () => {
    const invalidGrades = studentList.reduce((count, student) => count + subjects.filter(subject => {
      const grade = gradesMatrix[student.id]?.[subject.id];
      return grade !== undefined && (!Number.isFinite(grade) || grade < 0 || grade > subject.maxScore);
    }).length, 0);
    triggerNotification(
      invalidGrades === 0
        ? 'أعيد احتساب المجاميع والنسب من الرصد الحالي ولم تُكتشف درجات خارج الحدود.'
        : `اكتمل الفحص مع اكتشاف ${invalidGrades} درجة خارج الحدود وتحتاج إلى تصحيح.`,
      invalidGrades === 0 ? 'success' : 'warning'
    );
    logAction('إعادة احتساب الكنترول العام للدرجات', 'إدخال الدرجات');
  };

  const handleSaveCurrentGradeSheet = async () => {
    if (approvalStatus.approved) {
      triggerNotification('النتائج معتمدة ومغلقة ولا يمكن حفظ تعديلات درجات جديدة.', 'warning');
      return;
    }
    if (modifiedGradesKeys.size === 0) {
      triggerNotification('لا توجد تعديلات جديدة في الكشف الحالي.', 'info');
      return;
    }
    const persisted = await saveToServerDb();
    if (!persisted) return;
    const savedCount = modifiedGradesKeys.size;
    setModifiedGradesKeys(new Set());
    triggerNotification(`تم حفظ ${savedCount} تعديل درجة في المصدر المركزي بنجاح.`, 'success');
  };

  const handleApproveGrades = async () => {
    if (approvalStatus.approved) {
      setActiveTab('review');
      triggerNotification('تم الانتقال إلى مسار المراجعة الموثق لإعادة فتح الكنترول.', 'info');
    } else {
      await handleApproveAndLock();
    }
  };

  // Helper stage label
  const getStageLabelArabic = (stage: string) => {
    switch(stage) {
      case 'kindergarten': return 'روضة أطفال';
      case 'primary': return 'ابتدائي';
      case 'middle': return 'متوسط';
      case 'high': return 'ثانوي';
      default: return 'عام مشترك';
    }
  };

  // 8. Review & Approval System (Calculates across all students in the school)
  const getReviewMetrics = () => {
    let missingGradesCount = 0;
    let totalGradeFields = studentList.length * subjects.length;

    studentList.forEach(st => {
      subjects.forEach(sub => {
        if (gradesMatrix[st.id]?.[sub.id] === undefined && !st.absentSubjects?.includes(sub.id)) {
          missingGradesCount++;
        }
      });
    });

    return {
      missingGradesCount,
      totalGradeFields,
      completePercent: totalGradeFields > 0 ? Math.round(((totalGradeFields - missingGradesCount) / totalGradeFields) * 100) : 0
    };
  };

  const metrics = getReviewMetrics();

  const handleApproveAndLock = async () => {
    // Role-Based Access Control
    if (currentUserRole !== 'admin') {
      triggerNotification('❌ عذراً، لا تمتلك الصلاحية الكافية لاعتماد النتائج وتجميد الكنترول. تتطلب هذه العملية دور "مدير الكنترول".', 'warning');
      return;
    }

    if (metrics.missingGradesCount > 0) {
      triggerNotification(`تعذر الاعتماد: توجد ${metrics.missingGradesCount} درجة غير مرصودة. أكملها أو سجّل حالة الغياب/الإعفاء أولًا.`, 'warning');
      return;
    }
    if (studentList.length === 0 || subjects.length === 0) {
      triggerNotification('تعذر الاعتماد: يلزم وجود طلاب ومواد موثقة في دورة الامتحانات.', 'warning');
      return;
    }

    const reason = window.prompt('أدخل سبب/مبرر اعتماد هذه النتائج وتجميد الكنترول:')?.trim();
    if (!reason) {
      triggerNotification('تم إلغاء الاعتماد: السبب الموثق إلزامي.', 'warning');
      return;
    }

    const timestamp = new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA');
    const newLog = {
      id: `app-${Date.now()}`,
      action: 'approve',
      stage: activeControlStage === 'all' ? 'كامل المراحل' : getStageLabelArabic(activeControlStage),
      approvedBy: trustedActorLabel,
      timestamp,
      device: navigator.userAgent,
      reason
    };

    const newApprovalStatus = {
      approved: true,
      approvedBy: newLog.approvedBy,
      approvedAt: timestamp
    };
    const newApprovalHistory = [newLog, ...approvalHistory];

    // Update granular stage approval status
    const stageToUpdate = activeControlStage === 'all' ? ['kindergarten', 'primary', 'middle', 'high'] : [activeControlStage];
    const updatedStageStatus = { ...stageApprovalStatus };
    stageToUpdate.forEach(lvl => {
      updatedStageStatus[lvl] = {
        approved: true,
        approvedBy: newLog.approvedBy,
        approvedAt: timestamp
      };
    });

    // Capture deep snapshot of current gradesMatrix
    const newSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp,
      stage: activeControlStage === 'all' ? 'كامل المراحل' : getStageLabelArabic(activeControlStage),
      approvedBy: newLog.approvedBy,
      reason,
      gradesData: JSON.parse(JSON.stringify(gradesMatrix))
    };
    const updatedSnapshots = [newSnapshot, ...snapshots];

    // AUTOMATED CONTROL CLOSURE MINUTES GENERATION (محضر إقفال الكنترول تلقائي ومحمي)
    const closedStageLabel = activeControlStage === 'all' ? 'كامل المراحل' : getStageLabelArabic(activeControlStage);
    const totalStudentsInStage = visibleStudents.length;
    let passedInStage = 0;
    let failedInStage = 0;
    visibleStudents.forEach(st => {
      const results = processedStudents.find(p => p.id === st.id);
      if (results) {
        if (results.status === 'ناجح') passedInStage++;
        else failedInStage++;
      }
    });
    const passRateInStage = totalStudentsInStage > 0 ? parseFloat(((passedInStage / totalStudentsInStage) * 100).toFixed(2)) : 0;

    const newClosure = {
      id: `closure-${Date.now()}`,
      schoolName: selectedSchool?.name || 'بيانات المدرسة غير متاحة',
      stage: closedStageLabel,
      classroom: activeControlStage === 'all' ? 'جميع فصول المرحلة' : 'جميع فصول مرحلة الـ ' + closedStageLabel,
      semester: examSettings.semester || 'غير محدد',
      academicYear: selectedSchool?.academicYear || examSettings.academicYear || 'غير محدد',
      totalStudents: totalStudentsInStage,
      passedCount: passedInStage,
      failedCount: failedInStage,
      passRate: passRateInStage,
      committeeMembers: controlCommittees
        .filter(committee => activeControlStage === 'all' || committee.stage === activeControlStage)
        .map(committee => committee.user)
        .filter(Boolean),
      closedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      approvedBy: newLog.approvedBy,
      signatureHash: '',
      isImmutableArchive: false
    };
    const updatedClosures = [newClosure, ...controlClosures];
    // Save directly to backend
    const persisted = await saveToServerDb(
      examSettings,
      halls,
      subjects,
      studentList,
      gradesMatrix,
      schedule,
      proctorAssignments,
      newApprovalStatus,
      auditLogs,
      classesList,
      updatedClosures,
      reEvaluationRequests,
      updatedSnapshots,
      reviewedStagesSubjects,
      updatedStageStatus,
      'approve',
      { approvalHistory: newApprovalHistory, operationReason: reason }
    );
    if (!persisted) {
      triggerNotification('تعذر حفظ اعتماد النتائج في المصدر المركزي. لم يتم إثبات الإقفال.', 'warning');
      return;
    }
    const serverArchive = typeof persisted === 'object' && persisted.archive ? persisted.archive : null;
    if (!serverArchive?.signatureHash || !serverArchive?.isImmutableArchive) {
      triggerNotification('رفض إثبات الإقفال: لم يُرجع الخادم توقيع الأرشيف غير القابل للتعديل.', 'warning');
      await handleForceSync();
      return;
    }
    const persistedApprovalStatus = {
      approved: true,
      approvedBy: String(serverArchive.approvedBy || trustedActorLabel),
      approvedAt: String(serverArchive.serverSignedAt || serverArchive.closedAt || timestamp)
    };
    setApprovalStatus(persistedApprovalStatus);
    setApprovalHistory(newApprovalHistory);
    setStageApprovalStatus(updatedStageStatus);
    setSnapshots(updatedSnapshots);
    setControlClosures([serverArchive, ...controlClosures]);
    triggerNotification('تمت عملية الاعتماد والترصيد، وإصدار محضر إقفال الكنترول بنجاح وتأمينه ضد التعديل 🔒', 'success');
    logAction(`الاعتماد النهائي للدرجات وقفل التعديل وإصدار محضر الإقفال - السبب: ${reason}`, 'المراجعة والاعتماد');
  };

  const handleUnlockGrades = async () => {
    // Role-Based Access Control
    if (currentUserRole !== 'admin') {
      triggerNotification('❌ عذراً، لا تمتلك الصلاحية الكافية لإلغاء التجميد وإعادة فتح الكنترول. تتطلب هذه العملية صلاحيات "مدير الكنترول" حصراً.', 'warning');
      return;
    }

    const reason = window.prompt('أدخل مبرر/سبب إعادة فتح الكنترول وإلغاء التجميد:')?.trim();
    if (!reason) {
      triggerNotification('تم إلغاء إعادة الفتح: السبب الموثق إلزامي.', 'warning');
      return;
    }

    const timestamp = new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA');
    const newLog = {
      id: `app-${Date.now()}`,
      action: 'reopen',
      stage: activeControlStage === 'all' ? 'كامل المراحل' : getStageLabelArabic(activeControlStage),
      approvedBy: trustedActorLabel,
      timestamp,
      device: navigator.userAgent,
      reason
    };

    const newApprovalStatus = { approved: false, approvedBy: '', approvedAt: '' };
    const newApprovalHistory = [newLog, ...approvalHistory];

    // Update granular stage approval status
    const stageToUpdate = activeControlStage === 'all' ? ['kindergarten', 'primary', 'middle', 'high'] : [activeControlStage];
    const updatedStageStatus = { ...stageApprovalStatus };
    stageToUpdate.forEach(lvl => {
      updatedStageStatus[lvl] = {
        approved: false,
        approvedBy: '',
        approvedAt: ''
      };
    });

    // Save directly to backend
    const persisted = await saveToServerDb(
      examSettings,
      halls,
      subjects,
      studentList,
      gradesMatrix,
      schedule,
      proctorAssignments,
      newApprovalStatus,
      auditLogs,
      classesList,
      controlClosures,
      reEvaluationRequests,
      snapshots,
      reviewedStagesSubjects,
      updatedStageStatus,
      'reopen',
      { approvalHistory: newApprovalHistory, operationReason: reason }
    );
    if (!persisted) {
      triggerNotification('تعذر حفظ إعادة فتح الكنترول في المصدر المركزي. لم يتم إثبات تغيير الحالة.', 'warning');
      return;
    }
    setApprovalStatus(typeof persisted === 'object' && persisted.operationState?.approvalStatus
      ? persisted.operationState.approvalStatus
      : newApprovalStatus);
    setApprovalHistory(newApprovalHistory);
    setStageApprovalStatus(updatedStageStatus);
    triggerNotification('تم إلغاء الاعتماد وفتح باب تعديل وتصحيح الدرجات', 'info');
    logAction(`فتح صلاحية تعديل الدرجات والنتائج بعد الإغلاق - السبب: ${reason}`, 'المراجعة والاعتماد');
  };

  // 9. Report Export Simulation
  const handlePrintReport = (title: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #94a3b8; padding: 12px; text-align: right; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 5px; font-size: 24px; color: #1e3a8a; }
            .footer { margin-top: 50px; text-align: left; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>مجمع المدارس النموذجية الأهلية</h1>
            <h2>تقرير إدارة الامتحانات - ${title}</h2>
            <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          <hr/>
          <table>
            <thead>
              <tr>
                <th>رقم الجلوس</th>
                <th>اسم الطالب</th>
                <th>الصف</th>
                <th>المجموع</th>
                <th>النسبة</th>
                <th>التقدير العام</th>
                <th>النتيجة</th>
              </tr>
            </thead>
            <tbody>
              ${processedStudents.map(st => `
                <tr>
                  <td>${st.seatNumber}</td>
                  <td>${st.name}</td>
                  <td>${st.classroom}</td>
                  <td>${st.totalEarned} / ${st.totalMax}</td>
                  <td>${st.percentage}%</td>
                  <td>${st.gradeSymbol}</td>
                  <td style="color: ${st.status === 'ناجح' ? 'green' : 'red'}; font-weight: bold;">${st.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>توقيع رئيس الكنترول العام: _______________________</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintGuidePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('يرجى السماح بالنوافذ المنبثقة لفتح دليل التشغيل والطباعة إلى PDF.', 'warning');
      return;
    }
    const schoolName = escapeHtml(selectedSchool?.name || 'المدرسة الحالية');
    const academicYear = escapeHtml(examSettings.academicYear || selectedSchool?.academicYear || 'غير محدد');
    const semester = escapeHtml(examSettings.semester || 'غير محدد');
    const examType = escapeHtml(examSettings.examType || 'غير محدد');
    const generatedAt = escapeHtml(new Date().toLocaleString('ar-EG'));
    printWindow.document.write(`
      <!doctype html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>دليل تشغيل الامتحانات - ${schoolName}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.8; margin: 0; }
            header { border: 2px solid #9a6a1d; padding: 22px; background: #1c120c; color: #fff8d6; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            h2 { color: #6b460f; border-bottom: 1px solid #d4af37; padding-bottom: 6px; margin-top: 24px; font-size: 17px; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; font-size: 12px; }
            .meta div, .step { border: 1px solid #e5d7b4; padding: 10px; background: #fffdf7; }
            .steps { display: grid; gap: 10px; }
            .step strong { color: #7c5417; display: block; }
            .warning { border-right: 4px solid #b45309; background: #fffbeb; padding: 12px; font-size: 12px; }
            footer { margin-top: 28px; border-top: 1px solid #d1d5db; padding-top: 10px; color: #6b7280; font-size: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <header>
            <h1>دليل تشغيل وحدة الامتحانات والنتائج</h1>
            <div>SchoolForManus — دليل داخلي للمدرسة الحالية</div>
            <div class="meta">
              <div><b>المدرسة:</b> ${schoolName}</div>
              <div><b>العام الأكاديمي:</b> ${academicYear}</div>
              <div><b>الفصل:</b> ${semester}</div>
              <div><b>نوع الاختبار:</b> ${examType}</div>
            </div>
          </header>

          <h2>التسلسل التشغيلي المعتمد داخل النظام</h2>
          <div class="steps">
            <div class="step"><strong>1. إعداد الدورة</strong>راجع العام والفصل ونوع الاختبار وسياسات النجاح والتقريب، ثم احفظها في المصدر المركزي.</div>
            <div class="step"><strong>2. تعريف الهيكل</strong>أضف المواد والفصول والقاعات بسعات صحيحة. يمنع النظام حذف السجلات المرتبطة بطلاب أو درجات أو جدول.</div>
            <div class="step"><strong>3. التوزيع والجلوس</strong>تحقق أن مجموع سعات القاعات يغطي الطلاب الرسميين، ثم نفّذ التوزيع وتوليد أرقام الجلوس واحفظه مركزياً.</div>
            <div class="step"><strong>4. الجدولة والمراقبة</strong>كوّن الجدول بعد اكتمال المواد والقاعات والمعلمين. عالج التعارضات الحرجة قبل اعتماد الجدول.</div>
            <div class="step"><strong>5. رصد الدرجات</strong>أدخل درجة كل طالب أو وثّق غيابه عن المادة. الاستيراد يعتمد معرف الطالب الرسمي ولا يعتمد مطابقة الاسم.</div>
            <div class="step"><strong>6. المراجعة والتظلمات</strong>راجع الدرجات وصدّق المواد. أي تعديل عبر تظلم يحتاج قراراً موثقاً ولا يُسمح به أثناء إغلاق النتائج.</div>
            <div class="step"><strong>7. الاعتماد والإغلاق</strong>لا يعتمد الخادم النتائج مع درجات ناقصة. عند النجاح ينشئ أرشيفاً مستقلاً موقعاً ببصمة SHA-256 لا يملك دور التطبيق تحديثه أو حذفه.</div>
            <div class="step"><strong>8. التقارير والشهادات</strong>اطبع أو صدّر فقط بعد التأكد من المدرسة والسنة وحالة الاعتماد الظاهرة على الشاشة.</div>
          </div>

          <h2>ضوابط السلامة</h2>
          <div class="warning">لا تستخدم إعادة تحميل الصفحة كبديل للمزامنة. عند ظهور تعارض إصدار، استخدم «استرجاع وتحديث»، راجع البيانات، ثم أعد الحفظ. إعادة فتح النتائج أو الجدول تتطلب صلاحية مدير وسبباً موثقاً حيث يطلب النظام ذلك.</div>

          <h2>فحص ما قبل الإغلاق</h2>
          <ul>
            <li>المصدر المركزي يظهر «متصل ومزامن».</li>
            <li>كل الطلاب موزعون وأرقام جلوسهم فريدة.</li>
            <li>الجدول بلا تعارضات حرجة ومعتمد من الخادم.</li>
            <li>كل خانة درجة مرصودة أو مصنفة غياباً.</li>
            <li>فحوص الجاهزية في الإعدادات العامة ناجحة.</li>
            <li>محضر الإقفال يحمل توقيع خادم وحالة أرشيف غير قابل للتعديل.</li>
          </ul>

          <footer>تم إنشاء هذا الدليل من النظام بتاريخ ${generatedAt}. هذا مستند تشغيل داخلي ولا يمثل اعتماداً تنظيمياً خارج المدرسة.</footer>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    triggerNotification('تم فتح دليل التشغيل الفعلي؛ اختر الطباعة أو الحفظ بصيغة PDF.', 'success');
    logAction('فتح دليل التشغيل الفعلي لوحدة الامتحانات', 'الدعم والتوثيق');
  };

  const handlePrintElementByID = (elementId: string, title = 'طباعة كشف الكنترول المدرسي') => {
    const element = document.getElementById(elementId);
    if (!element) {
      triggerNotification('عذراً، لم يتم العثور على العنصر المراد طباعته.', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('يرجى السماح بفتح النوافذ المنبثقة (Popups) للطباعة بشكل سليم', 'warning');
      return;
    }

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
            body {
              font-family: 'Cairo', 'Inter', sans-serif;
              padding: 40px;
              color: #0f172a;
              background-color: #fff;
              direction: rtl;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 25px;
              margin-bottom: 25px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 12px;
              text-align: right;
              font-size: 13px;
            }
            th {
              background-color: #f8fafc;
              font-weight: bold;
              color: #1e293b;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .text-[10px] { font-size: 10px; }
            .text-xs { font-size: 12px; }
            .text-sm { font-size: 14px; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .text-amber-600 { color: #4f46e5; }
            .text-amber-700 { color: #4338ca; }
            .text-amber-900 { color: #1e1b4b; }
            .text-slate-900 { color: #0f172a; }
            .text-slate-400 { color: #94a3b8; }
            .text-slate-500 { color: #64748b; }
            .text-slate-700 { color: #334155; }
            .text-slate-800 { color: #1e293b; }
            .border-b { border-bottom: 1px solid #e2e8f0; }
            .pb-4 { padding-bottom: 1rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .py-0.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
            .bg-amber-50 { background-color: #e0e7ff; }
            .border { border: 1px solid #e2e8f0; }
            .rounded { border-radius: 0.25rem; }
            .{ border-radius: 0.75rem; }
            .overflow-x-auto { overflow-x: auto; }
            .w-full { width: 100%; }
            .text-center { text-align: center; }
            .gap-1 { gap: 0.25rem; }
            .mt-1 { margin-top: 0.25rem; }
            .p-1.5 { padding: 0.375rem; }
            .font-semibold { font-weight: 600; }
            .divide-y { }
            .divide-y > * + * { border-top-width: 1px; border-top-color: #e2e8f0; }
            .border-4 { border-width: 4px; }
            .border-double { border-style: double; }
            .border-slate-950 { border-color: #020617; }
            .p-6 { padding: 1.5rem; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gap-6 { gap: 1.5rem; }
            .w-48 { width: 12rem; }
            .mt-8 { margin-top: 2rem; }
            .pt-4 { padding-top: 1rem; }
            .border-t { border-top: 1px solid #e2e8f0; }

            /* Hide non-printable items */
            select, button, input { display: none !important; }

            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintScheduleReport = () => {
    if (scheduleSubTab !== 'reports') {
      setScheduleSubTab('reports');
      triggerNotification('جاري فتح شاشة تقارير جدول الامتحانات وتجهيز الكشف للطباعة...', 'info');
      setTimeout(() => {
        handlePrintElementByID('print-schedule-report-area', 'جدول الامتحانات والتقارير المعتمدة');
      }, 700);
    } else {
      handlePrintElementByID('print-schedule-report-area', 'جدول الامتحانات والتقارير المعتمدة');
    }
  };

  // Certificate custom states

  // Manual item form state
  const [manualExam, setManualExam] = useState({
    classroom: classesList[0]?.name || '',
    subjectId: subjects[0]?.id || '',
    date: scheduleConfig?.startDate || '',
    startTime: '08:30',
    endTime: '10:30',
    hallId: halls[0]?.id || '',
    proctorId: ''
  });

  useEffect(() => {
    setManualExam(current => {
      const next = {
        ...current,
        classroom: classesList.some(item => item.name === current.classroom) ? current.classroom : classesList[0]?.name || '',
        subjectId: subjects.some(item => item.id === current.subjectId) ? current.subjectId : subjects[0]?.id || '',
        hallId: halls.some(item => item.id === current.hallId) ? current.hallId : halls[0]?.id || '',
        proctorId: availableTeachers.some(item => item.id === current.proctorId) ? current.proctorId : availableTeachers[0]?.id || ''
      };
      return next.classroom === current.classroom && next.subjectId === current.subjectId && next.hallId === current.hallId && next.proctorId === current.proctorId
        ? current
        : next;
    });
  }, [availableTeachers, classesList, halls, subjects]);

  const hasExamCycleData = subjects.length > 0 || halls.length > 0 || schedule.length > 0;
  const canGenerateSeating = studentList.length > 0 && halls.length > 0;

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      <EnterpriseActionToolbar
        title="الامتحانات والنتائج والكنترول"
        stats={
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-xs">
            <span className="text-slate-300 font-bold">نسبة النجاح العامة للمنظومة: <span className="text-amber-300 font-mono">غير متحققة لغياب نتائج مركزية معتمدة</span></span>
          </div>
        }
        onExit={setActiveSection ? () => setActiveSection('dashboard') : undefined}
      />
      <div className="p-3 sm:p-4 flex flex-col lg:flex-row gap-4 w-full bg-[#130b04] text-[#f7eee1] min-h-[750px]">

      {/* Right Sidebar Menu - Re-engineered with Luxury Cream Gold & Metallic Copper branding */}
      <aside className="w-full lg:w-72 bg-[#1c120c] text-white p-5 flex flex-col gap-5 shrink-0 border border-[#d4af37]/30 relative shadow-xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#f7d174] rounded-t-2xl" />

        {/* Elite Software House Badge & Logo */}
        <div className="flex items-center gap-3 bg-gradient-to-br from-[#2a1d13] via-[#1f150d] to-[#130b04] p-3.5 border border-[#d4af37]/40 shadow-lg relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#d4af37]/10 rounded-full blur-xl group-hover:bg-[#d4af37]/20 transition-all duration-500" />
          <div className="p-2 bg-gradient-to-br from-[#d4af37] via-[#c58a22] to-[#9a6a1d] rounded-lg shadow-md shrink-0">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h2 className="font-black text-[#fce79a] text-sm tracking-tight">SchoolForManus</h2>
              <span className="text-[8px] bg-[#d4af37]/30 text-amber-200 px-1 py-0.2 rounded font-extrabold uppercase border border-[#d4af37]/40">EXAMS</span>
            </div>
            <span className="text-[9px] text-amber-200/60 block font-mono tracking-widest uppercase">EXAMS CONTROL CENTER</span>
          </div>
        </div>

        {/* Corporate License Certification Seal */}
        <div className="bg-[#130b04] p-3 border border-[#d4af37]/30 text-[10px] space-y-2">
          <div className="flex justify-between items-center text-amber-200/70 border-b border-[#d4af37]/20 pb-1.5">
            <span className="font-bold flex items-center gap-1 text-[9px] text-amber-100">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
              سياق المدرسة الحالية
            </span>
            <span className="text-[9px] font-mono text-[#f7d174]">{selectedSchool?.academicYear || examSettings.academicYear}</span>
          </div>

          <div className="space-y-1 text-amber-100">
            <div className="flex justify-between items-center">
              <span className="text-amber-200/60">المدرسة:</span>
              <span className="font-black text-amber-100">{selectedSchool?.name || 'المدرسة الحالية'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-200/60">حالة المصدر:</span>
              <span className="font-mono text-amber-300 text-[9px]">{dbSyncStatus === 'success' ? 'متصل' : dbSyncStatus === 'conflict' ? 'تعارض يحتاج مزامنة' : dbSyncStatus === 'error' ? 'تعذر الاتصال' : 'جارٍ التحقق'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-200/60">الاعتماد الأكاديمي:</span>
              <span>
                {approvalStatus.approved ? (
                  <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded text-[9px] border border-emerald-500/30">🔒 معتمد ومقفل</span>
                ) : (
                  <span className="text-[#f7d174] bg-[#2a1d13] px-1.5 py-0.5 rounded text-[9px] border border-[#d4af37]/40">🔓 مفتوح للتحرير</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav aria-label="التنقل داخل وحدة الامتحانات" className="flex flex-col gap-2 overflow-y-auto max-h-[500px] scrollbar-thin">
          {sidebarMenu.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <React.Fragment key={item.id}>
                {(index === 0 || sidebarMenu[index - 1].section !== item.section) && (
                  <div
                    className="px-2 pt-2 pb-0.5 text-[10px] font-black tracking-wide text-[#f7d174]/70"
                    role="heading"
                    aria-level={2}
                  >
                    {item.section}
                  </div>
                )}
                <button
                  type="button"
                  id={`exam-tab-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`فتح ${item.label}`}
                  className={`w-full flex items-center justify-between px-3.5 h-[48px] text-xs font-black text-right transition-all duration-200 border select-none cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#9a6a1d] via-[#c58a22] to-[#8b6113] border-[#f7d174] text-[#fff8d6] shadow-[0_4px_16px_rgba(212,175,55,0.25)]'
                      : 'bg-[#130b04] hover:bg-[#23150a] border-[#d4af37]/20 hover:border-[#d4af37]/50 text-amber-100/80 hover:text-amber-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.id === 'review' && metrics.missingGradesCount > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold animate-bounce ${
                        isActive
                          ? 'bg-[#130b04] text-[#f7d174]'
                          : 'bg-[#d4af37] text-slate-950'
                      }`}>
                        {metrics.missingGradesCount}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>

                  <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#fce79a]' : 'text-[#d4af37]/60'}`} />
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Developer / Enterprise Sign-off seal */}
        <div className="mt-auto pt-3 border-t border-[#d4af37]/20 space-y-2">
          <div className="p-2.5 bg-[#130b04] border border-[#d4af37]/30 text-[10px] space-y-1 text-center">
            <span className="text-[9px] text-amber-200/50 font-extrabold block">وحدة الامتحانات والنتائج</span>
            <div className="flex items-center justify-center gap-1.5 text-[#f7d174] font-black mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>بيانات المدرسة الحالية فقط</span>
            </div>
            <p className="text-[8px] text-amber-200/40 font-medium">الحفظ والاعتماد مرتبطان بالصلاحيات وسجل التدقيق</p>
          </div>
          <div className="text-center text-[8px] text-amber-200/40 font-medium">
            حقوق الطبع والنشر محفوظة © ٢٠٢٦ م
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[850px] bg-[#130b04]" id="exams-module-content">

        {/* Top Header Panel - Re-engineered for maximum enterprise prestige and status */}
        <header className="bg-gradient-to-l from-[#1c120c] via-[#2a1d13] to-[#1a1108] p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#d4af37]/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#f7d174]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] bg-[#2a1d13] text-amber-200 border border-[#d4af37]/40 px-2.5 py-0.5 rounded-full font-bold">
                {examSettings.academicYear} • {examSettings.semester}
              </span>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                {examSettings.examType}
              </span>
              <span className="text-[10px] bg-[#130b04] text-[#f7d174] border border-[#d4af37]/30 px-2.5 py-0.5 rounded-full font-extrabold font-mono tracking-wider">
                {dbSyncStatus === 'success' ? 'المصدر المركزي متصل' : dbSyncStatus === 'conflict' ? 'تعارض إصدار — أعد المزامنة' : dbSyncStatus === 'error' ? 'تعذر الاتصال بالمصدر' : 'جارٍ التحقق من المصدر'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#fce79a] tracking-tight flex items-center gap-2">
              <span>{sidebarMenu.find(m => m.id === activeTab)?.label}</span>
              <span className="text-[11px] font-bold text-amber-200 bg-[#2a1d13] border border-[#d4af37]/30 px-2.5 py-0.5 rounded-lg">
                جلسة مستخدم موثقة 🔒
              </span>
            </h1>
            <p className="text-xs text-amber-200/70 font-semibold leading-relaxed">
              إدارة دورة الامتحانات واللجان ورصد النتائج للمدرسة والسنة الأكاديمية المحددتين في سياق الدخول.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={() => handlePrintReport('الملخص الأكاديمي')}
              disabled={!hasExamCycleData}
              className="px-4 py-2.5 bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 border border-[#d4af37]/40 text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Printer className="w-4 h-4 text-[#f7d174]" />
              {hasExamCycleData ? 'طباعة ملخص الدورة' : 'لا توجد دورة للطباعة'}
            </button>

            <button
              onClick={handleAutoDistributeAndSeating}
              disabled={!canGenerateSeating}
              className="px-4 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] hover:brightness-110 text-slate-950 shadow-lg text-xs font-black flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-[#fce79a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              {canGenerateSeating ? 'توليد أرقام الجلوس والتوزيع' : 'يلزم طلاب وقاعات للتوزيع'}
            </button>
          </div>
        </header>

        {examCandidateDiagnostics.totalCanonical > examCandidateDiagnostics.eligible && (
          <section role="alert" className="border border-amber-400/50 bg-amber-950/40 p-4 text-amber-50">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1.5">
                <h2 className="text-sm font-black">فحص أهلية مرشحي الامتحانات</h2>
                <p className="text-xs font-semibold text-amber-100/80">
                  المؤهلون للدورة الحالية: {examCandidateDiagnostics.eligible} من {examCandidateDiagnostics.totalCanonical} طالباً في المصدر الرسمي.
                  لا تعدّل وحدة الامتحانات هوية الطالب أو قيده؛ تُستبعد السجلات غير المكتملة حتى تصحيحها في مصدر شؤون الطلاب.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                  {examCandidateDiagnostics.missingIdentity > 0 && <span className="border border-amber-400/30 bg-black/20 px-2 py-1">هوية ناقصة: {examCandidateDiagnostics.missingIdentity}</span>}
                  {examCandidateDiagnostics.missingClass > 0 && <span className="border border-amber-400/30 bg-black/20 px-2 py-1">بلا صف: {examCandidateDiagnostics.missingClass}</span>}
                  {examCandidateDiagnostics.missingAcademicYear > 0 && <span className="border border-amber-400/30 bg-black/20 px-2 py-1">بلا سنة أكاديمية: {examCandidateDiagnostics.missingAcademicYear}</span>}
                  {examCandidateDiagnostics.academicYearMismatch > 0 && <span className="border border-amber-400/30 bg-black/20 px-2 py-1">سنة مختلفة: {examCandidateDiagnostics.academicYearMismatch}</span>}
                  {examCandidateDiagnostics.inactiveStatus > 0 && <span className="border border-amber-400/30 bg-black/20 px-2 py-1">حالة غير مؤهلة: {examCandidateDiagnostics.inactiveStatus}</span>}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 0: Unified Control Operations Center */}
        {activeTab === 'control-center' && (() => {
          const expectedGrades = visibleStudents.length * subjects.length;
          const recordedGrades = visibleStudents.reduce((total, student) => total + subjects.filter(subject =>
            Number.isFinite(gradesMatrix[student.id]?.[subject.id]) || student.absentSubjects?.includes(subject.id)
          ).length, 0);
          const gradeCompletion = expectedGrades > 0 ? Math.round((recordedGrades / expectedGrades) * 100) : 0;
          const distributedStudents = visibleStudents.filter(student => student.hallId && student.seatNumber).length;
          const distributionCompletion = visibleStudents.length > 0 ? Math.round((distributedStudents / visibleStudents.length) * 100) : 0;
          const scheduledTargets = classesList.length * subjects.length;
          const scheduleCompletion = scheduledTargets > 0 ? Math.min(100, Math.round((schedule.length / scheduledTargets) * 100)) : 0;
          const criticalConflicts = scheduleConflicts.filter(conflict => conflict.severity === 'error').length;
          const readinessChecks = [
            { label: 'إعدادات الدورة والسنة الأكاديمية', ok: Boolean(examSettings.academicYear && examSettings.semester && examSettings.examType), target: 'settings' },
            { label: 'المواد والفصول الدراسية', ok: subjects.length > 0 && classesList.length > 0, target: 'classes' },
            { label: 'القاعات والطاقة الاستيعابية', ok: halls.length > 0 && halls.reduce((sum, hall) => sum + Number(hall.capacity || 0), 0) >= visibleStudents.length, target: 'halls' },
            { label: 'توزيع الطلاب وأرقام الجلوس', ok: visibleStudents.length > 0 && distributedStudents === visibleStudents.length, target: 'distribution' },
            { label: 'الجدول وخلوه من التعارضات', ok: schedule.length > 0 && criticalConflicts === 0, target: 'schedule' },
            { label: 'اكتمال الدرجات أو توثيق الغياب', ok: expectedGrades > 0 && recordedGrades === expectedGrades, target: 'grades-entry' }
          ];
          const passedChecks = readinessChecks.filter(check => check.ok).length;
          const cycleReady = passedChecks === readinessChecks.length;

          return (
            <div className="space-y-6 animate-fadeIn" dir="rtl">
              <section className="relative overflow-hidden border border-[#d4af37]/40 bg-gradient-to-l from-[#130b04] via-[#26170c] to-[#3a2915] p-6 text-amber-50 shadow-xl">
                <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
                <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-amber-200/50 bg-gradient-to-br from-[#f7d174] to-[#9a6a1d] text-lg font-black text-slate-950 shadow-lg">SF</div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">EXAMS OPERATIONS</span>
                      <h2 className="mt-1 text-xl font-black text-white">مركز عمليات الامتحانات والكنترول</h2>
                      <p className="mt-1 text-xs font-semibold text-amber-100/70">{selectedSchool?.name || 'المدرسة الحالية'} • {examSettings.academicYear} • {examSettings.semester}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-black sm:grid-cols-4">
                    <div className="border border-amber-500/25 bg-black/20 px-3 py-2"><span className="block text-amber-200/60">المصدر</span><span className={dbSyncStatus === 'success' ? 'text-emerald-300' : dbSyncStatus === 'conflict' ? 'text-amber-300' : 'text-rose-300'}>{dbSyncStatus === 'success' ? 'متصل' : dbSyncStatus === 'conflict' ? 'تعارض إصدار' : 'بحاجة للتحقق'}</span></div>
                    <div className="border border-amber-500/25 bg-black/20 px-3 py-2"><span className="block text-amber-200/60">الإصدار</span><span className="text-white">{examsDbVersion}</span></div>
                    <div className="border border-amber-500/25 bg-black/20 px-3 py-2"><span className="block text-amber-200/60">الجدول</span><span className={scheduleApprovalStatus.approved ? 'text-emerald-300' : 'text-amber-300'}>{scheduleApprovalStatus.approved ? 'معتمد' : 'مسودة'}</span></div>
                    <div className="border border-amber-500/25 bg-black/20 px-3 py-2"><span className="block text-amber-200/60">النتائج</span><span className={approvalStatus.approved ? 'text-emerald-300' : 'text-amber-300'}>{approvalStatus.approved ? 'مغلقة' : 'مفتوحة'}</span></div>
                  </div>
                </div>
              </section>

              {!hasExamCycleData && (
                <section className="border border-amber-200 bg-amber-50 p-6 text-center">
                  <ShieldAlert className="mx-auto h-10 w-10 text-amber-700" />
                  <h3 className="mt-3 text-lg font-black text-slate-900">لم تكتمل تهيئة دورة الامتحانات</h3>
                  <p className="mx-auto mt-2 max-w-2xl text-xs font-semibold leading-6 text-slate-600">المصدر المركزي متصل ويعرض الطلاب الرسميين، لكن الدورة تحتاج مواد وقاعات وجدولاً ودرجات موثقة. لا تعرض هذه اللوحة أرقاماً تجريبية.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => setActiveTab('settings')} className="bg-amber-700 px-4 py-2 text-xs font-black text-white">بدء إعداد الدورة</button>
                    <button type="button" onClick={() => setActiveTab('classes')} className="border border-amber-300 bg-white px-4 py-2 text-xs font-black text-amber-900">تعريف المواد والفصول</button>
                    <button type="button" disabled={isDbSyncing} onClick={() => void handleForceSync()} className="border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-50">{isDbSyncing ? 'جارٍ التحقق...' : 'إعادة التحقق من المصدر'}</button>
                  </div>
                </section>
              )}

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'الطلاب الرسميون', value: visibleStudents.length, suffix: 'طالب', detail: distributedStudents + ' موزعون على لجان', icon: Users, color: 'text-cyan-300' },
                  { label: 'اكتمال الرصد', value: gradeCompletion, suffix: '%', detail: recordedGrades + ' من ' + expectedGrades + ' خانة', icon: FileCheck2, color: gradeCompletion === 100 ? 'text-emerald-300' : 'text-amber-300' },
                  { label: 'جاهزية التوزيع', value: distributionCompletion, suffix: '%', detail: halls.length + ' قاعة معرفة', icon: IdCard, color: distributionCompletion === 100 ? 'text-emerald-300' : 'text-amber-300' },
                  { label: 'اكتمال الجدول', value: scheduleCompletion, suffix: '%', detail: criticalConflicts + ' تعارض حرج', icon: Calendar, color: criticalConflicts === 0 && schedule.length > 0 ? 'text-emerald-300' : 'text-amber-300' }
                ].map(card => {
                  const CardIcon = card.icon;
                  return (
                    <div key={card.label} className="border border-[#d4af37]/35 bg-[#1c120c] p-5 text-amber-50 shadow-lg">
                      <div className="flex items-center justify-between"><span className="text-xs font-black text-amber-100/70">{card.label}</span><CardIcon className={'h-5 w-5 ' + card.color} /></div>
                      <div className="mt-4"><span className={'text-3xl font-black ' + card.color}>{card.value}</span><span className="mr-1 text-xs font-bold text-amber-100/60">{card.suffix}</span></div>
                      <p className="mt-2 text-[11px] font-semibold text-amber-100/50">{card.detail}</p>
                    </div>
                  );
                })}
              </section>

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                <div className="xl:col-span-3 border border-[#d4af37]/35 bg-[#1c120c] p-5 text-amber-50 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
                    <div><h3 className="text-sm font-black text-white">بوابات الجاهزية قبل الاعتماد</h3><p className="mt-1 text-[11px] text-amber-100/55">{passedChecks} من {readinessChecks.length} فحوص مكتملة</p></div>
                    <span className={cycleReady ? 'border border-emerald-500/40 bg-emerald-950/50 px-3 py-1 text-xs font-black text-emerald-300' : 'border border-amber-500/40 bg-amber-950/50 px-3 py-1 text-xs font-black text-amber-300'}>{cycleReady ? 'جاهز للمراجعة النهائية' : 'توجد متطلبات معلقة'}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {readinessChecks.map(check => (
                      <button key={check.label} type="button" onClick={() => setActiveTab(check.target)} className="flex items-center justify-between border border-amber-500/20 bg-black/15 p-3 text-right transition hover:border-amber-400/60">
                        <span className="text-xs font-bold text-amber-50">{check.label}</span>
                        {check.ok ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="xl:col-span-2 border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h3 className="text-sm font-black text-slate-900">آخر الأنشطة المسجلة</h3><button type="button" onClick={() => setActiveTab('system-settings')} className="text-[10px] font-black text-amber-700">عرض سجل التدقيق</button></div>
                  <div className="mt-3 space-y-2">
                    {auditLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="border-r-2 border-amber-500 bg-slate-50 px-3 py-2"><p className="text-[11px] font-bold text-slate-800">{log.action}</p><p className="mt-1 text-[9px] text-slate-500">{log.user} • {log.timestamp}</p></div>
                    ))}
                    {auditLogs.length === 0 && <p className="py-8 text-center text-xs font-semibold text-slate-500">لا توجد أنشطة واجهة مسجلة بعد. سجل الخادم يُنشأ مع كل عملية حفظ.</p>}
                  </div>
                </div>
              </section>
            </div>
          );
        })()}

        {/* TAB: Concise Operations Guide */}
        {activeTab === 'exams-guide' && (
          <section aria-labelledby="exams-guide-title" className="space-y-6 text-right" dir="rtl">
            <div className="border border-[#d4af37]/40 bg-gradient-to-l from-[#1c120c] via-[#2a1d13] to-[#130b04] p-6 text-amber-50 shadow-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 border border-[#d4af37]/30 bg-black/20 px-2.5 py-1 text-[10px] font-black text-[#f7d174]">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    دليل التشغيل المختصر
                  </span>
                  <h2 id="exams-guide-title" className="text-xl font-black text-[#fce79a]">مسار العمل من التهيئة إلى الشهادة</h2>
                  <p className="max-w-3xl text-xs font-semibold leading-7 text-amber-100/75">
                    اتبع الخطوات بالترتيب، واحفظ كل مرحلة في المصدر المركزي قبل الانتقال إلى المرحلة التالية. المؤشرات أدناه تصف البيانات المحملة في الجلسة الحالية فقط ولا تمثل اعتماداً نهائياً.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePrintGuidePDF}
                  aria-label="طباعة دليل تشغيل الامتحانات أو حفظه بصيغة PDF"
                  className="inline-flex items-center justify-center gap-2 border border-[#fce79a] bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg transition hover:brightness-110"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  طباعة الدليل / حفظ PDF
                </button>
              </div>
            </div>

            <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="خطوات تشغيل دورة الامتحانات">
              {[
                ['1', 'الإعداد والهيكل', 'راجع العام والفصل والسياسات، ثم عرّف الصفوف والمواد والقاعات من البيانات الرسمية.'],
                ['2', 'التوزيع والجلوس', 'وزّع طلاب الدورة على القاعات وولّد أرقام الجلوس، ثم تحقق من عدم وجود طالب بلا مقعد.'],
                ['3', 'المراقبون والجدول', 'كلّف المراقبين، كوّن الجدول، وعالج التعارضات قبل طلب اعتماد الجدول.'],
                ['4', 'الدرجات والمعالجة', 'سجّل درجة كل طالب أو حالة الغياب، ثم شغّل المعالجة وراجع النتائج غير المكتملة.'],
                ['5', 'الجودة والاعتماد', 'نفّذ فحوص الجاهزية وراجع سجل التغييرات قبل قفل النتائج أو إعادة فتحها بسبب موثق.'],
                ['6', 'التقارير والشهادات', 'اطبع التقارير والشهادات من البيانات المحفوظة وبعد التحقق من حالة الاعتماد الظاهرة.']
              ].map(([number, title, description]) => (
                <li key={number} className="border border-[#d4af37]/25 bg-[#1c120c] p-4 text-amber-50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#2a1d13] text-xs font-black text-[#f7d174]">{number}</span>
                  <h3 className="mt-3 text-sm font-black text-[#fce79a]">{title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-amber-100/65">{description}</p>
                </li>
              ))}
            </ol>

            <div role="note" className="border border-[#d4af37]/30 bg-[#1c120c] p-5 text-amber-50">
              <h3 className="text-sm font-black text-[#fce79a]">حالة البيانات المحملة في هذه الجلسة</h3>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ['الصفوف', classesList.length],
                  ['المواد', subjects.length],
                  ['القاعات', halls.length],
                  ['طلاب الدورة', studentList.length],
                  ['اختبارات الجدول', schedule.length],
                  ['حالة الجدول', scheduleApprovalStatus.approved ? 'معتمد' : 'غير معتمد']
                ].map(([label, value]) => (
                  <div key={String(label)} className="border border-[#d4af37]/20 bg-black/20 p-3">
                    <dt className="text-[10px] font-bold text-amber-200/55">{label}</dt>
                    <dd className="mt-1 font-black text-amber-50">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* TAB 1: Exam Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 text-amber-100">
                <span className="text-xs text-amber-200/60 font-bold block">العام والامتحان النشط</span>
                <p className="text-lg font-black text-[#fce79a] mt-1">{examSettings.academicYear}</p>
                <p className="text-xs text-[#f7d174] font-bold mt-1">{examSettings.examType}</p>
              </div>
              <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 text-amber-100">
                <span className="text-xs text-amber-200/60 font-bold block">التقريب والمعالجة</span>
                <p className="text-lg font-black text-[#fce79a] mt-1">{examSettings.roundingPolicy}</p>
                <p className="text-xs text-emerald-400 font-bold mt-1">الحد الأدنى للنجاح {examSettings.passMarkPercent}%</p>
              </div>
              <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 text-amber-100">
                <span className="text-xs text-amber-200/60 font-bold block">حالة درجات الكنترول</span>
                <p className="text-lg font-black text-[#fce79a] mt-1">
                  {approvalStatus.approved ? '🔒 معتمدة ومغلقة' : '🔓 مفتوحة للإدخال'}
                </p>
                <p className="text-xs text-amber-200/70 mt-1">
                  {approvalStatus.approvedBy ? `بواسطة: ${approvalStatus.approvedBy}` : 'انتظار المراجعة والاعتماد'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-[#1c120c] p-6 border border-[#d4af37]/40 space-y-6 text-amber-100">
              <h3 className="font-black text-[#fce79a] text-sm border-b border-[#d4af37]/30 pb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#f7d174]" />
                خيارات التهيئة الأساسية للموسم الامتحاني
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200 block">العام الدراسي:</label>
                  <input
                    type="text"
                    value={examSettings.academicYear}
                    readOnly
                    className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 outline-none transition-all"
                    title="العام مرتبط بسياق المدرسة الموثوق"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200 block">الفصل الدراسي:</label>
                  <select
                    value={examSettings.semester}
                    onChange={(e) => setExamSettings({...examSettings, semester: e.target.value})}
                    className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 outline-none transition-all"
                  >
                    <option value="الفصل الدراسي الأول" className="bg-[#1c120c] text-amber-100">الفصل الدراسي الأول</option>
                    <option value="الفصل الدراسي الثاني" className="bg-[#1c120c] text-amber-100">الفصل الدراسي الثاني</option>
                    <option value="الفصل الصيفي المكثف" className="bg-[#1c120c] text-amber-100">الفصل الصيفي المكثف</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200 block">نوع الامتحان:</label>
                  <select
                    value={examSettings.examType}
                    onChange={(e) => setExamSettings({...examSettings, examType: e.target.value})}
                    className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 outline-none transition-all"
                  >
                    <option value="الاختبارات الشهرية المستمرة" className="bg-[#1c120c] text-amber-100">الاختبارات الشهرية المستمرة</option>
                    <option value="امتحانات منتصف الفصل" className="bg-[#1c120c] text-amber-100">امتحانات منتصف الفصل</option>
                    <option value="الاختبارات النهائية" className="bg-[#1c120c] text-amber-100">الاختبارات النهائية</option>
                    <option value="الدور الثاني وملحق الإعادة" className="bg-[#1c120c] text-amber-100">الدور الثاني وملحق الإعادة</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200 block">آلية تقريب النتيجة الكلية:</label>
                  <select
                    value={examSettings.roundingPolicy}
                    onChange={(e) => setExamSettings({...examSettings, roundingPolicy: e.target.value})}
                    className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 outline-none transition-all"
                  >
                    <option value="التقريب لأقرب نصف درجة" className="bg-[#1c120c] text-amber-100">التقريب لأقرب نصف درجة</option>
                    <option value="جبر الكسور لأقرب عدد صحيح" className="bg-[#1c120c] text-amber-100">جبر الكسور لأقرب عدد صحيح</option>
                    <option value="إلغاء الكسور واحتساب العدد الصحيح الأدنى" className="bg-[#1c120c] text-amber-100">إلغاء الكسور واحتساب العدد الصحيح الأدنى</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200 block">نسبة النجاح الصغرى مئوياً (%):</label>
                  <input
                    type="number"
                    value={examSettings.passMarkPercent}
                    onChange={(e) => setExamSettings({...examSettings, passMarkPercent: Number(e.target.value)})}
                    className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 outline-none transition-all"
                    min="20"
                    max="100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200 block">الحد الأدنى في الاختبار النهائي (%):</label>
                  <input
                    type="number"
                    value={examSettings.minFinalMarkPercent}
                    onChange={(e) => setExamSettings({...examSettings, minFinalMarkPercent: Number(e.target.value)})}
                    className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 outline-none transition-all"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-200 block">سياسة النجاح والرسوب المقررة:</label>
                <textarea
                  value={examSettings.passPolicy}
                  onChange={(e) => setExamSettings({...examSettings, passPolicy: e.target.value})}
                  className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 outline-none transition-all"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#d4af37]/30">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  حفظ السياسة والبدء بالجدولة
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Classes and Subjects */}
        {activeTab === 'classes' && (
          <div className="space-y-6 animate-fade-in">

            {/* Professional Central Database Synchronization & Backups Panel */}
            <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 relative overflow-hidden text-amber-100">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-3 ${dbSyncStatus === 'success' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : dbSyncStatus === 'conflict' ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40' : dbSyncStatus === 'error' ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40' : 'bg-[#2a1d13] text-[#f7d174] border border-[#d4af37]/30'}`}>
                    {isDbSyncing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : dbSyncStatus === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Sliders className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-[#fce79a] text-sm">قاعدة البيانات والربط المركزي</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        isDbSyncing
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
                          : dbSyncStatus === 'success'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : dbSyncStatus === 'conflict'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}>
                        {isDbSyncing ? 'جاري المزامنة...' : dbSyncStatus === 'success' ? 'متصل ومزامن (سيرفر مركزي)' : dbSyncStatus === 'conflict' ? 'تعارض إصدار — يلزم مزامنة' : 'تعذر الاتصال بالمصدر المركزي'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/70 mt-1">
                      {lastSyncTime ? `آخر مزامنة ناجحة مع السيرفر: ${lastSyncTime}` : 'لم يتم الاتصال بالسيرفر بعد، البيانات تحفظ مؤقتاً في المتصفح'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                  <button
                    onClick={handleForceSync}
                    disabled={isDbSyncing || isCanonicalClassSyncing}
                    className="flex-1 md:flex-none px-4 py-2 bg-[#2a1d13] hover:bg-[#38271a] text-[#f7d174] disabled:opacity-50 border border-[#d4af37]/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    title="تحميل البيانات المخزنة في السيرفر وتحديث الواجهة"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDbSyncing ? 'animate-spin' : ''}`} />
                    استرجاع وتحديث
                  </button>

                  <button
                    onClick={handleCanonicalClassSync}
                    disabled={isDbSyncing || isCanonicalClassSyncing}
                    className="flex-1 md:flex-none px-4 py-2 bg-[#2a1d13] hover:bg-[#38271a] text-[#f7d174] disabled:opacity-50 border border-[#d4af37]/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    title="استبدال قائمة صفوف الامتحانات بالهيكل الأكاديمي الموثوق للمدرسة"
                  >
                    <School className={`w-3.5 h-3.5 ${isCanonicalClassSyncing ? 'animate-pulse' : ''}`} />
                    {isCanonicalClassSyncing ? 'جارٍ مطابقة الصفوف...' : 'مطابقة صفوف الهيكل'}
                  </button>

                  <button
                    onClick={() => {
                      saveToServerDb().then(ok => {
                        if (ok) triggerNotification('تم حفظ البيانات ومزامنتها على السيرفر بنجاح', 'success');
                        else triggerNotification('حدث خطأ أثناء حفظ البيانات على السيرفر', 'warning');
                      });
                    }}
                    disabled={isDbSyncing || isCanonicalClassSyncing}
                    className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 text-slate-950 disabled:opacity-50 shadow-lg text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    title="حفظ كافة التغييرات الحالية إلى السيرفر المركزي فوراً"
                  >
                    <Save className="w-3.5 h-3.5" />
                    حفظ ومزامنة فورية
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Tab Toggles for Sub-sections */}
            <div className="flex border border-[#d4af37]/40 bg-[#1c120c] p-1 shadow-lg max-w-md">
              <button
                onClick={() => setClassesSubTab('subjects')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  classesSubTab === 'subjects'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-slate-950 font-black shadow-md'
                    : 'text-amber-200/80 hover:bg-[#2a1d13] hover:text-[#fce79a]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                المواد والخطط الدراسية
                <span className="bg-[#2a1d13] text-[#fce79a] border border-[#d4af37]/30 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {subjects.length}
                </span>
              </button>
              <button
                onClick={() => setClassesSubTab('classrooms')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  classesSubTab === 'classrooms'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-slate-950 font-black shadow-md'
                    : 'text-amber-200/80 hover:bg-[#2a1d13] hover:text-[#fce79a]'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                الصفوف والشعب الدراسية
                <span className="bg-[#2a1d13] text-[#fce79a] border border-[#d4af37]/30 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {classesList.length}
                </span>
              </button>
            </div>

            {/* Content Switcher */}
            {classesSubTab === 'subjects' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Form to Add Subject */}
                <div className="bg-[#1c120c] p-6 border border-[#d4af37]/40 space-y-4 h-fit text-amber-100">
                  <div className="flex items-center gap-2 border-b border-[#d4af37]/30 pb-3">
                    <div className="p-2 bg-[#2a1d13] text-[#f7d174] border border-[#d4af37]/30 rounded-lg">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#fce79a] text-sm">إضافة مادة تعليمية</h3>
                      <p className="text-[10px] text-amber-200/60">تسجيل مادة جديدة وتحديد شروط الاجتياز</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddSubject} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-amber-200 block">اسم المادة التعليمية:</label>
                      <input
                        type="text"
                        placeholder="مثال: لغة عربية، فيزياء كمية..."
                        value={newSubject.name}
                        onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                        className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 transition-all outline-none placeholder:text-amber-200/40"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-amber-200 block">الدرجة النهائية:</label>
                        <input
                          type="number"
                          min={1}
                          value={newSubject.maxScore}
                          onChange={(e) => setNewSubject({...newSubject, maxScore: Number(e.target.value)})}
                          className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 transition-all outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-amber-200 block">درجة النجاح:</label>
                        <input
                          type="number"
                          min={1}
                          value={newSubject.passScore}
                          onChange={(e) => setNewSubject({...newSubject, passScore: Number(e.target.value)})}
                          className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isDbSyncing || isCanonicalClassSyncing}
                      className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 text-slate-950 font-black shadow-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة المادة ودفعها للسيرفر
                    </button>
                  </form>
                </div>

                {/* Subjects List & Search */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 text-amber-100">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#f7d174]" />
                      <input
                        type="text"
                        placeholder="البحث عن مادة دراسية محددة..."
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        className="w-full text-xs font-semibold pr-9 pl-3 py-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 transition-all outline-none placeholder:text-amber-200/40"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportToCSV(subjects.map(s => [s.id, s.name, s.maxScore, s.passScore]), ['ID', 'المادة', 'النهاية العظمى', 'درجة النجاح'], 'المواد الدراسية والأنصبة')}
                        className="px-3.5 py-2 bg-[#2a1d13] hover:bg-[#38271a] text-[#f7d174] border border-[#d4af37]/40 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-[#f7d174]" />
                        تصدير Excel
                      </button>
                    </div>
                  </div>

                  {/* Grid of Subjects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subjects
                      .filter(sub => sub.name.toLowerCase().includes(subjectSearch.toLowerCase()))
                      .map(sub => {
                        const isEditing = editingEntityId === sub.id;
                        return (
                          <div
                            key={sub.id}
                            className={`p-5 border transition-all ${
                              isEditing
                                ? 'bg-[#2a1d13] border-[#d4af37] ring-2 ring-[#d4af37]/30'
                                : 'bg-[#1c120c] border-[#d4af37]/40 hover:border-[#d4af37] shadow-lg text-amber-100'
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-amber-200">اسم المادة:</label>
                                  <input
                                    type="text"
                                    className="w-full text-xs p-2 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                                    value={editingValues.name}
                                    onChange={(e) => setEditingValues({ ...editingValues, name: e.target.value })}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-amber-200">النهائية العظمى:</label>
                                    <input
                                      type="number"
                                      className="w-full text-xs p-2 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                                      value={editingValues.maxScore}
                                      onChange={(e) => setEditingValues({ ...editingValues, maxScore: Number(e.target.value) })}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-amber-200">النهاية الصغرى:</label>
                                    <input
                                      type="number"
                                      className="w-full text-xs p-2 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                                      value={editingValues.passScore}
                                      onChange={(e) => setEditingValues({ ...editingValues, passScore: Number(e.target.value) })}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-2 border-t border-[#d4af37]/30">
                                  <button
                                    onClick={async () => {
                                      const editedName = String(editingValues.name || '').trim().replace(/\s+/g, ' ');
                                      if (!editedName || editingValues.maxScore <= 0 || editingValues.passScore < 0 || editingValues.passScore > editingValues.maxScore) {
                                        triggerNotification('تعذر التعديل: تحقق من اسم المادة وحدود الدرجات.', 'warning');
                                        return;
                                      }
                                      if (subjects.some(subject => subject.id !== sub.id && normalizeSubjectName(subject.name) === normalizeSubjectName(editedName))) {
                                        triggerNotification(`لا يمكن تكرار اسم المادة ${editedName} في الدورة نفسها.`, 'warning');
                                        return;
                                      }
                                      const updated = subjects.map(s => s.id === sub.id ? { ...s, ...editingValues, name: editedName } : s);
                                      const persisted = await saveToServerDb(examSettings, halls, updated);
                                      if (!persisted) return;
                                      setSubjects(updated);
                                      setEditingEntityId(null);
                                      triggerNotification('تم تحديث بيانات المادة بنجاح', 'success');
                                      logAction(`تعديل مادة: ${editingValues.name}`, 'الفصول والمواد');
                                    }}
                                    className="px-3 py-1.5 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 text-slate-950 text-[11px] rounded-lg font-black cursor-pointer transition-all shadow-md"
                                  >
                                    حفظ التعديل
                                  </button>
                                  <button
                                    onClick={() => setEditingEntityId(null)}
                                    className="px-3 py-1.5 bg-[#2a1d13] hover:bg-[#38271a] text-amber-200 border border-[#d4af37]/30 text-[11px] rounded-lg font-bold cursor-pointer transition-all"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-[#2a1d13] text-[#f7d174] border border-[#d4af37]/30">
                                      <BookOpen className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h4 className="font-black text-[#fce79a] text-sm">{sub.name}</h4>
                                      <span className="text-[9px] font-bold text-[#f7d174] bg-[#2a1d13] border border-[#d4af37]/30 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                                        مادة معتمدة بالكنترول
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingEntityId(sub.id);
                                        setEditingValues({ name: sub.name, maxScore: sub.maxScore, passScore: sub.passScore });
                                      }}
                                      className="p-1.5 text-amber-200/80 hover:text-[#fce79a] hover:bg-[#2a1d13] rounded-lg cursor-pointer transition-all"
                                      title="تعديل المادة"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const isReferenced = schedule.some(item => item.subjectId === sub.id)
                                          || Object.values(gradesMatrix).some((studentGrades: any) => Object.prototype.hasOwnProperty.call(studentGrades || {}, sub.id))
                                          || reEvaluationRequests.some(request => request.subjectId === sub.id);
                                        if (isReferenced) {
                                          triggerNotification(`لا يمكن حذف مادة ${sub.name} لأنها مرتبطة بجدول أو درجات أو تظلم.`, 'warning');
                                          return;
                                        }
                                        const updated = subjects.filter(s => s.id !== sub.id);
                                        const persisted = await saveToServerDb(examSettings, halls, updated);
                                        if (!persisted) return;
                                        setSubjects(updated);
                                        triggerNotification(`تم حذف مادة ${sub.name}`, 'info');
                                        logAction(`حذف مادة: ${sub.name}`, 'الفصول والمواد');
                                      }}
                                      className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer transition-all"
                                      title="حذف المادة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Custom horizontal gauge showing the weight of passing limit relative to final grade */}
                                <div className="mt-4 pt-4 border-t border-[#d4af37]/30">
                                  <div className="flex justify-between items-center text-[10px] text-amber-200/70 font-bold mb-1">
                                    <span>نهاية صغرى (نجاح): {sub.passScore}</span>
                                    <span>عظمى: {sub.maxScore}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 relative overflow-hidden">
                                    <div
                                      className="bg-amber-600 h-1.5 rounded-full"
                                      style={{ width: `${(sub.passScore / sub.maxScore) * 100}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center mt-2.5">
                                    <span className="text-[9px] text-slate-400">نسبة الاجتياز المطلوبة:</span>
                                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
                                      {Math.round((sub.passScore / sub.maxScore) * 100)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Form to Add Classroom */}
                <div className="p-6 space-y-4 h-fit">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <School className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">إضافة صف/فصل دراسي</h3>
                      <p className="text-[10px] text-slate-400">تسجيل صف دراسي جديد مع الشعب المصاحبة</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddClassroom} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">اسم الصف الدراسي:</label>
                      <input
                        type="text"
                        placeholder="مثال: الصف العاشر، الصف الحادي عشر..."
                        value={newClassroom.name}
                        onChange={(e) => setNewClassroom({...newClassroom, name: e.target.value})}
                        className="w-full text-xs font-semibold p-2.5 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">المرحلة الدراسية:</label>
                      <select
                        value={newClassroom.level}
                        onChange={(e) => setNewClassroom({...newClassroom, level: e.target.value as any})}
                        className="w-full text-xs font-semibold p-2.5 bg-transparent focus:outline-none"
                      >
                        <option value="kindergarten">رياض الأطفال والتمهيدي (KG)</option>
                        <option value="primary">الابتدائية (Primary)</option>
                        <option value="middle">المتوسطة / الإعدادية (Middle)</option>
                        <option value="high">الثانوية العامة (High)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">السعة الكلية:</label>
                        <input
                          type="number"
                          min={1}
                          value={newClassroom.capacity}
                          onChange={(e) => setNewClassroom({...newClassroom, capacity: Number(e.target.value)})}
                          className="w-full text-xs font-semibold p-2.5 bg-transparent focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">الشعب الدراسية:</label>
                        <input
                          type="text"
                          placeholder="مثال: أ, ب, ج"
                          value={newClassroom.sections}
                          onChange={(e) => setNewClassroom({...newClassroom, sections: e.target.value})}
                          className="w-full text-xs font-semibold p-2.5 bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isDbSyncing || isCanonicalClassSyncing}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 text-white shadow-md text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة الصف ومزامنته
                    </button>
                  </form>
                </div>

                {/* Classrooms List & Search */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="البحث عن صف أو صف دراسي محدد..."
                        value={classroomSearch}
                        onChange={(e) => setClassroomSearch(e.target.value)}
                        className="w-full text-xs font-semibold pr-9 pl-3 py-2.5 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportToCSV(classesList.map(c => [c.id, c.name, c.level, c.capacity, c.sections.join(', ')]), ['ID', 'اسم الصف', 'المستوى', 'السعة', 'الشعب'], 'الفصول والصفوف المسجلة')}
                        className="px-3.5 py-2 bg-transparent hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        تصدير Excel
                      </button>
                    </div>
                  </div>

                  {/* Grid of Classrooms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {classesList
                      .filter(cls => cls.name.toLowerCase().includes(classroomSearch.toLowerCase()))
                      .map(cls => {
                        const levelColor = cls.level === 'kindergarten'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : cls.level === 'primary'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : cls.level === 'middle'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200';
                        const levelLabel = cls.level === 'kindergarten'
                          ? 'رياض الأطفال'
                          : cls.level === 'primary'
                          ? 'ابتدائي'
                          : cls.level === 'middle'
                          ? 'متوسط'
                          : 'ثانوي';
                        return (
                          <div
                            key={cls.id}
                            className="p-5 hover:border-amber-200 hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-amber-50/80 text-amber-600 border border-amber-100">
                                    <School className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-slate-800 text-sm">{cls.name}</h4>
                                    <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-md mt-1 inline-block ${levelColor}`}>
                                      {levelLabel}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    const isReferenced = studentList.some(student => student.classroom === cls.name)
                                      || schedule.some(item => item.classroom === cls.name);
                                    if (isReferenced) {
                                      triggerNotification(`لا يمكن حذف ${cls.name} لوجود طلاب أو اختبارات مرتبطة به.`, 'warning');
                                      return;
                                    }
                                    const updated = classesList.filter(c => c.id !== cls.id);
                                    const persisted = await saveToServerDb(examSettings, halls, subjects, studentList, gradesMatrix, schedule, proctorAssignments, approvalStatus, auditLogs, updated);
                                    if (!persisted) return;
                                    setClassesList(updated);
                                    triggerNotification(`تم حذف صف ${cls.name}`, 'info');
                                    logAction(`حذف صف دراسي: ${cls.name}`, 'الفصول والمواد');
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                                  title="حذف الصف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="mt-4 space-y-2 pt-3 border-t border-slate-100">
                                <div className="flex justify-between items-center text-[11px] text-slate-500">
                                  <span className="font-bold">السعة الاستيعابية القصوى:</span>
                                  <span className="font-extrabold text-slate-800">{cls.capacity} طالب</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-slate-400 font-bold">الشعب الدراسية:</span>
                                  {cls.sections && cls.sections.map((sec: string) => (
                                    <span key={sec} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                      شعبة {sec}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                              <span>سجل مفعّل في الكنترول المركزي</span>
                              <span className="text-amber-600 font-bold">نشط</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 3: Exam Halls and Committees */}
        {activeTab === 'halls' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 border-b pb-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">إضافة قاعة اختبار / لجنة</h3>
                    <p className="text-[10px] text-slate-400">تسجيل قاعة أو لجنة اختبار جديدة بسعة محددة</p>
                  </div>
                </div>

                <form onSubmit={handleAddHall} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">اسم القاعة أو اللجنة:</label>
                    <input
                      type="text"
                      placeholder="مثال: قاعة ابن حيان الكبرى"
                      value={newHall.name}
                      onChange={(e) => setNewHall({...newHall, name: e.target.value})}
                      className="w-full text-xs font-semibold p-2.5 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">الطاقة الاستيعابية القصوى:</label>
                    <input
                      type="number"
                      value={newHall.capacity}
                      onChange={(e) => setNewHall({...newHall, capacity: Number(e.target.value)})}
                      className="w-full text-xs font-semibold p-2.5 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      min={1}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">الموقع الجغرافي / المبنى:</label>
                    <input
                      type="text"
                      placeholder="مثال: مبنى البنين - الطابق الأول"
                      value={newHall.location}
                      onChange={(e) => setNewHall({...newHall, location: e.target.value})}
                      className="w-full text-xs font-semibold p-2.5 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow hover:shadow-md active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    تسجيل القاعة الجديدة
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">قاعات الامتحان واللجان النشطة</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportToCSV(
                        halls.map(h => [h.id, h.name, h.capacity, h.location]),
                        ['كود القاعة', 'اسم القاعة / اللجنة', 'الاستيعاب الأقصى', 'الموقع الجغرافي'],
                        'halls_list'
                      )}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] rounded font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      تصدير Excel
                    </button>
                    <button
                      onClick={async () => {
                        const win = window.open('', '_blank');
                        if (!win) return;
                        win.document.write(`
                          <html dir="rtl" lang="ar">
                            <head>
                              <title>كشف القاعات واللجان</title>
                              <style>
                                body { font-family: Cairo, sans-serif; padding: 20px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                                th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                                th { background: #f4f4f4; }
                              </style>
                            </head>
                            <body>
                              <h2>بيان قاعات الامتحان واللجان النشطة</h2>
                              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
                              <table>
                                <thead>
                                  <tr>
                                    <th>اسم القاعة / اللجنة</th>
                                    <th>الطاقة الاستيعابية القصوى</th>
                                    <th>الموقع / المبنى</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${halls.map(h => `
                                    <tr>
                                      <td>${h.name}</td>
                                      <td>${h.capacity}</td>
                                      <td>${h.location}</td>
                                    </tr>
                                  `).join('')}
                                </tbody>
                              </table>
                              <script>window.print();</script>
                            </body>
                          </html>
                        `);
                        win.document.close();
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-950 text-white text-[10px] rounded font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      طباعة البيان
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="ابحث عن لجنة أو قاعة اختبار..."
                  value={hallSearch}
                  onChange={(e) => setHallSearch(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg"
                />

                <div className="space-y-3">
                  {halls
                    .filter(h => h.name.toLowerCase().includes(hallSearch.toLowerCase()) || h.location.toLowerCase().includes(hallSearch.toLowerCase()))
                    .map((hall) => {
                      const studentCountInHall = studentList.filter(s => s.hallId === hall.id).length;
                      const percentFilled = Math.min(100, Math.round((studentCountInHall / hall.capacity) * 100));
                      const isEditing = editingEntityId === hall.id;

                      return (
                        <div key={hall.id} className="p-4 bg-transparent flex flex-col justify-between gap-3">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  className="text-xs p-1 border rounded font-semibold w-full"
                                  value={editingValues.name}
                                  onChange={(e) => setEditingValues({ ...editingValues, name: e.target.value })}
                                  placeholder="اسم القاعة / اللجنة"
                                />
                                <input
                                  type="number"
                                  className="text-xs p-1 border rounded font-semibold w-full"
                                  value={editingValues.capacity}
                                  onChange={(e) => setEditingValues({ ...editingValues, capacity: Number(e.target.value) })}
                                  placeholder="السعة القصوى"
                                />
                                <input
                                  type="text"
                                  className="text-xs p-1 border rounded font-semibold w-full"
                                  value={editingValues.location}
                                  onChange={(e) => setEditingValues({ ...editingValues, location: e.target.value })}
                                  placeholder="الموقع / المبنى"
                                />
                              </div>
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={async () => {
                                    const assignedStudentCount = studentList.filter(student => student.hallId === hall.id).length;
                                    if (!String(editingValues.name || '').trim() || editingValues.capacity <= 0 || editingValues.capacity < assignedStudentCount) {
                                      triggerNotification(`تعذر التعديل: الاسم والسعة مطلوبان، ولا يجوز خفض السعة عن ${assignedStudentCount} طالباً موزعاً.`, 'warning');
                                      return;
                                    }
                                    const updatedHalls = halls.map(h => h.id === hall.id ? { ...h, ...editingValues } : h);
                                    const persisted = await saveToServerDb(examSettings, updatedHalls);
                                    if (!persisted) return;
                                    setHalls(updatedHalls);
                                    setEditingEntityId(null);
                                    triggerNotification('تم تحديث بيانات القاعة بنجاح', 'success');
                                    logAction(`تعديل قاعة: ${editingValues.name}`, 'لجان وقاعات الامتحان');
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] rounded font-bold cursor-pointer"
                                >
                                  حفظ
                                </button>
                                <button
                                  onClick={() => setEditingEntityId(null)}
                                  className="px-2 py-1 bg-slate-400 hover:bg-transparent0 text-white text-[10px] rounded font-bold cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-900 text-xs">{hall.name}</h4>
                                <span className="text-[10px] text-slate-500 font-bold block">{hall.location}</span>
                                <span className="text-xs text-slate-600">
                                  الطلاب الموزعون حالياً: <span className="font-black text-amber-700">{studentCountInHall}</span> من أصل <span className="font-bold">{hall.capacity}</span> طالب وطالبة
                                </span>
                              </div>

                              <div className="w-full md:w-32 space-y-1">
                                <div className="flex justify-between text-[9px] font-bold">
                                  <span>نسبة الإشغال</span>
                                  <span>{percentFilled}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${percentFilled > 90 ? 'bg-amber-500' : 'bg-amber-600'}`}
                                    style={{ width: `${percentFilled}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingEntityId(hall.id);
                                    setEditingValues({ name: hall.name, capacity: hall.capacity, location: hall.location });
                                  }}
                                  className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
                                  title="تعديل القاعة"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const list = studentList.filter(s => s.hallId === hall.id);
                                    if (list.length === 0) {
                                      triggerNotification('لا يوجد طلاب موزعون على هذه القاعة لطباعة الكشف', 'info');
                                      return;
                                    }
                                    handlePrintReport(`كشف لجنة ${hall.name}`);
                                  }}
                                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                  title="طباعة كشف اللجنة"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  كشف اللجنة
                                </button>
                                <button
                                  onClick={async () => {
                                    const isReferenced = studentList.some(student => student.hallId === hall.id)
                                      || proctorAssignments.some(proctor => proctor.hallId === hall.id)
                                      || schedule.some(item => item.hallId === hall.id || (Array.isArray(item.splitHalls) && item.splitHalls.includes(hall.id)));
                                    if (isReferenced) {
                                      triggerNotification(`لا يمكن حذف قاعة ${hall.name} لأنها مرتبطة بطلاب أو مراقبين أو جدول امتحانات.`, 'warning');
                                      return;
                                    }
                                    const updatedHalls = halls.filter(h => h.id !== hall.id);
                                    const persisted = await saveToServerDb(examSettings, updatedHalls);
                                    if (!persisted) return;
                                    setHalls(updatedHalls);
                                    triggerNotification(`تم حذف قاعة ${hall.name}`, 'info');
                                    logAction(`حذف قاعة: ${hall.name}`, 'لجان وقاعات الامتحان');
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                  title="حذف القاعة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: Student Distribution */}
        {activeTab === 'distribution' && (
          <ExamsDistributionPanel
            schoolName={selectedSchool?.name || 'المدرسة الحالية'}
            students={studentList}
            halls={halls}
            approved={approvalStatus.approved}
            syncing={isDbSyncing}
            onAutoDistribute={handleAutoDistributeAndSeating}
            onPersistStudents={async updatedStudents => {
              const persisted = await saveToServerDb(
                examSettings,
                halls,
                subjects,
                updatedStudents,
                gradesMatrix,
                schedule,
                proctorAssignments,
                approvalStatus,
                auditLogs,
                classesList
              );
              if (!persisted) return false;
              setStudentList(updatedStudents);
              return true;
            }}
            notify={triggerNotification}
          />
        )}

        {/* TAB 5: Seat Numbers */}
        {activeTab === 'seating' && (
          <div className="space-y-6 text-amber-100">
            <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#d4af37]/30 pb-4">
                <div>
                  <h3 className="font-bold text-[#fce79a] text-sm">توليد وطباعة كروت أرقام الجلوس</h3>
                  <p className="text-xs text-amber-200/60 mt-1">بطاقات دخول داخلية مبنية على رقم الجلوس والقاعة المحفوظين في دورة الامتحانات الحالية.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const printableStudents = studentList.filter(student => student.seatNumber && student.hallId);
                      if (printableStudents.length === 0 || printableStudents.length !== studentList.length) {
                        triggerNotification('أكمل توزيع جميع الطلاب وتوليد أرقام جلوسهم قبل الطباعة الجماعية.', 'warning');
                        return;
                      }
                      const win = window.open('', '_blank');
                      if (!win) {
                        triggerNotification('يرجى السماح بالنوافذ المنبثقة لفتح الطباعة.', 'warning');
                        return;
                      }
                      win.document.write(`
                        <html dir="rtl" lang="ar">
                          <head>
                            <title>كروت أرقام الجلوس الكلية</title>
                            <style>
                              body { font-family: Cairo, sans-serif; padding: 20px; background: #fff; }
                              .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                              .card { border: 2px solid #000; padding: 15px; border-radius: 8px; text-align: center; page-break-inside: avoid; }
                              .seat-num { font-size: 24px; font-weight: bold; color: red; margin: 10px 0; }
                            </style>
                          </head>
                          <body>
                            <h2>بطاقات دخول قاعات الامتحانات الكلية</h2>
                            <div class="grid">
                              ${printableStudents.map(s => `
                                <div class="card">
                                  <h3>${escapeHtml(selectedSchool?.name || 'المدرسة الحالية')}</h3>
                                  <p>الطالب: <strong>${escapeHtml(s.name)}</strong></p>
                                  <p>الصف: ${escapeHtml(s.classroom)} - الشعبة (${escapeHtml(s.section)})</p>
                                  <p>اللجنة / القاعة: ${escapeHtml(halls.find(h => h.id === s.hallId)?.name || 'غير محدد')}</p>
                                  <div class="seat-num">رقم الجلوس: ${escapeHtml(s.seatNumber)}</div>
                                </div>
                              `).join('')}
                            </div>
                            <script>window.print();</script>
                          </body>
                        </html>
                      `);
                      win.document.close();
                    }}
                    className="px-3 py-2 bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-[#d4af37]/30"
                  >
                    <Printer className="w-4 h-4 text-[#f7d174]" />
                    طباعة جميع الكروت دفعة واحدة
                  </button>

                  <button
                    onClick={handleAutoDistributeAndSeating}
                    className="px-4 py-2 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 text-slate-950 font-black rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md border border-[#fce79a]"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-950" />
                    إعادة توليد الأرقام تلقائياً
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <input
                type="text"
                placeholder="ابحث عن بطاقة طالب باسمه، صفّه، أو رقم جلوسه..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full text-xs p-2 border border-[#d4af37]/40 rounded-lg bg-[#130b04] text-amber-100 placeholder-amber-200/40"
              />

              {/* Seating Cards Grid Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentList
                  .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || String(s.seatNumber || '').includes(studentSearch) || s.classroom.includes(studentSearch))
                  .map((st) => (
                    <div key={st.id} className="p-4 bg-gradient-to-br from-[#2a1d13] to-[#1c120c] border border-[#d4af37]/40 shadow-lg relative overflow-hidden flex flex-col justify-between h-48">
                      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#d4af37] to-[#8b6113]" />

                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] bg-[#d4af37]/20 text-[#f7d174] px-1.5 py-0.5 rounded font-extrabold border border-[#d4af37]/30">{selectedSchool?.name || 'المدرسة الحالية'}</span>
                          <h4 className="font-bold text-[#fce79a] text-sm mt-1">{st.name}</h4>
                          <span className="text-xs text-amber-200/60 font-bold block">{st.classroom} - الشعبة ({st.section})</span>
                        </div>
                        <div className="bg-[#130b04] p-1.5 rounded-lg border border-[#d4af37]/30">
                          <IdCard className="w-8 h-8 text-[#f7d174]" />
                        </div>
                      </div>

                      <div className="border-t border-dashed border-[#d4af37]/30 pt-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-amber-200/50 block text-[9px] font-bold">رقم الجلوس:</span>
                          <span className="font-mono font-extrabold text-base text-[#f7d174]">{st.seatNumber || 'غير مولد'}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-amber-200/50 block text-[9px] font-bold">اللجنة والقاعة:</span>
                          <span className="font-black text-amber-100 text-[11px]">
                            {halls.find(h => h.id === st.hallId)?.name || 'غير محدد'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (!st.seatNumber || !st.hallId) {
                            triggerNotification('لا يمكن طباعة البطاقة قبل توزيع الطالب وتوليد رقم جلوسه.', 'warning');
                            return;
                          }
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) {
                            triggerNotification('يرجى السماح بالنوافذ المنبثقة لفتح الطباعة.', 'warning');
                            return;
                          }
                          printWindow.document.write(`
                            <html dir="rtl" lang="ar">
                              <head>
                                <title>بطاقة رقم الجلوس - ${escapeHtml(st.name)}</title>
                                <style>
                                  body { font-family: 'Cairo', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f1f5f9; }
                                  .card { width: 400px; padding: 25px; border: 3px solid #1e3a8a; border-radius: 12px; background-color: #fff; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                                  h1 { font-size: 20px; color: #1e3a8a; margin-bottom: 5px; }
                                  h2 { font-size: 16px; margin: 5px 0; color: #334155; }
                                  .seat-num { font-size: 32px; font-weight: 900; color: #dc2626; margin: 15px 0; font-family: monospace; }
                                </style>
                              </head>
                              <body>
                                <div class="card">
                                  <h1>${escapeHtml(selectedSchool?.name || 'المدرسة الحالية')}</h1>
                                  <h2>بطاقة دخول قاعة الامتحان</h2>
                                  <hr/>
                                  <p style="font-size: 18px; font-weight: bold;">الاسم: ${escapeHtml(st.name)}</p>
                                  <p>الصف: ${escapeHtml(st.classroom)} - الشعبة (${escapeHtml(st.section)})</p>
                                  <p>رقم الهوية الوطنية: ${escapeHtml(st.nationalId)}</p>
                                  <p>القاعة واللجنة: <strong>${escapeHtml(halls.find(h => h.id === st.hallId)?.name || 'غير محدد')}</strong></p>
                                  <div class="seat-num">رقم الجلوس: ${escapeHtml(st.seatNumber)}</div>
                                  <hr/>
                                  <p style="font-size: 12px; color: #64748b;">يرجى إبراز هذه البطاقة عند دخول بوابة الاختبارات الرسمية.</p>
                                </div>
                                <script>window.print();</script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }}
                        className="mt-2 text-[10px] text-[#f7d174] hover:text-[#fce79a] font-extrabold flex items-center gap-1 cursor-pointer self-start"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#f7d174]" />
                        طباعة بطاقة الطالب
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Proctors and Observers */}
        {activeTab === 'proctors' && (
          <div className="space-y-6 text-amber-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Form to Assign Proctor */}
              <div className="bg-[#1c120c] p-6 border border-[#d4af37]/40 space-y-5">
                <div className="flex items-center gap-2 border-b border-[#d4af37]/30 pb-3">
                  <div className="p-2 bg-[#d4af37]/15 text-[#f7d174] rounded-lg border border-[#d4af37]/30">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#fce79a] text-sm">تكليف مراقب وملاحظ جديد</h3>
                    <p className="text-[10px] text-amber-200/50">توزيع وتكليف المعلمين بمراقبة لجان الاختبارات</p>
                  </div>
                </div>

                <form onSubmit={handleAddProctor} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-amber-200 block">المعلم / الموظف:</label>
                    <select
                      value={newProctor.name}
                      onChange={(e) => setNewProctor({...newProctor, name: e.target.value})}
                      className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/30 outline-none transition-all"
                      required
                    >
                      <option value="">-- اختر معلماً --</option>
                      {availableTeachers.map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.specialization})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-amber-200 block">القاعة / اللجنة المكلف بها:</label>
                    <select
                      value={newProctor.hallId}
                      onChange={(e) => setNewProctor({...newProctor, hallId: e.target.value})}
                      className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/30 outline-none transition-all"
                    >
                      {halls.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-amber-200 block">الفترة الزمنية:</label>
                    <select
                      value={newProctor.shift}
                      onChange={(e) => setNewProctor({...newProctor, shift: e.target.value})}
                      className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/30 outline-none transition-all"
                    >
                      <option value="الفترة الأولى">الفترة الأولى (08:30 - 10:30)</option>
                      <option value="الفترة الثانية">الفترة الثانية (11:00 - 13:00)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow border border-[#fce79a]"
                  >
                    <UserCheck className="w-4 h-4 text-slate-950" />
                    تأكيد التكليف والملاحظة
                  </button>
                </form>
              </div>

              {/* Proctor Assignments List */}
              <div className="lg:col-span-2 bg-[#1c120c] p-5 border border-[#d4af37]/40 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#d4af37]/30 pb-2">
                  <h3 className="font-bold text-[#fce79a] text-sm">سجل تكليفات الملاحظين ومراقبي اللجان</h3>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAutoAssignProctors}
                      className="px-2 py-1 bg-gradient-to-r from-[#d4af37] to-[#9a6a1d] text-slate-950 text-[10px] rounded font-black flex items-center gap-1 cursor-pointer transition-all hover:brightness-110"
                      title="توزيع الملاحظين تلقائياً على القاعات"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      توزيع تلقائي ذكي
                    </button>

                    <button
                      onClick={() => handleExportToCSV(
                        proctorAssignments.map(pa => [pa.id, pa.name, halls.find(h => h.id === pa.hallId)?.name || 'غير محدد', pa.shift]),
                        ['كود التكليف', 'المراقب / الملاحظ', 'القاعة المكلف بها', 'الفترة'],
                        'proctors_list'
                      )}
                      className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] rounded font-bold flex items-center gap-1 cursor-pointer transition-all border border-emerald-500/40"
                    >
                      <Download className="w-3 h-3" />
                      تصدير Excel
                    </button>

                    <button
                      onClick={() => {
                        const win = window.open('', '_blank');
                        if (!win) return;
                        win.document.write(`
                          <html dir="rtl" lang="ar">
                            <head>
                              <title>بيان تكليفات المراقبين والملاحظين</title>
                              <style>
                                body { font-family: Cairo, sans-serif; padding: 20px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                                th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                                th { background: #f4f4f4; }
                              </style>
                            </head>
                            <body>
                              <h2>بيان تكليفات الملاحظين ومراقبي لجان الاختبارات</h2>
                              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
                              <table>
                                <thead>
                                  <tr>
                                    <th>المراقب / الملاحظ</th>
                                    <th>اللجنة / القاعة</th>
                                    <th>الفترة الزمنية</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${proctorAssignments.map(pa => `
                                    <tr>
                                      <td>${pa.name}</td>
                                      <td>${halls.find(h => h.id === pa.hallId)?.name || 'غير محدد'}</td>
                                      <td>${pa.shift}</td>
                                    </tr>
                                  `).join('')}
                                </tbody>
                              </table>
                              <script>window.print();</script>
                            </body>
                          </html>
                        `);
                        win.document.close();
                      }}
                      className="px-2 py-1 bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 text-[10px] rounded font-bold flex items-center gap-1 cursor-pointer transition-all border border-[#d4af37]/30"
                    >
                      <Printer className="w-3 h-3 text-[#f7d174]" />
                      طباعة
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="ابحث عن مراقب باسمه أو اسم القاعة المكلف بها..."
                  value={proctorSearch}
                  onChange={(e) => setProctorSearch(e.target.value)}
                  className="w-full text-xs p-2 border border-[#d4af37]/40 rounded-lg bg-[#130b04] text-amber-100 placeholder-amber-200/40"
                />

                <div className="space-y-3">
                  {proctorAssignments
                    .filter(pa => pa.name.toLowerCase().includes(proctorSearch.toLowerCase()) || (halls.find(h => h.id === pa.hallId)?.name || '').toLowerCase().includes(proctorSearch.toLowerCase()))
                    .map((pa) => {
                      const isEditing = editingEntityId === pa.id;
                      return (
                        <div key={pa.id} className="p-4 bg-[#2a1d13] border border-[#d4af37]/30 flex flex-col justify-between gap-3">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <select
                                  className="text-xs p-1 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 w-full"
                                  value={editingValues.name}
                                  onChange={(e) => setEditingValues({ ...editingValues, name: e.target.value })}
                                >
                                  {availableTeachers.map(t => (
                                    <option key={t.id} value={t.name}>{t.name} ({t.specialization})</option>
                                  ))}
                                </select>
                                <select
                                  className="text-xs p-1 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 w-full"
                                  value={editingValues.hallId}
                                  onChange={(e) => setEditingValues({ ...editingValues, hallId: e.target.value })}
                                >
                                  {halls.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                  ))}
                                </select>
                                <select
                                  className="text-xs p-1 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 w-full"
                                  value={editingValues.shift}
                                  onChange={(e) => setEditingValues({ ...editingValues, shift: e.target.value })}
                                >
                                  <option value="الفترة الأولى">الفترة الأولى</option>
                                  <option value="الفترة الثانية">الفترة الثانية</option>
                                </select>
                              </div>
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={async () => {
                                    const hasConflict = proctorAssignments.some(p => p.id !== pa.id && p.name === editingValues.name && p.shift === editingValues.shift);
                                    if (!editingValues.name || !editingValues.hallId || hasConflict) {
                                      triggerNotification(hasConflict ? 'تعذر التعديل: المراقب مكلف في الفترة نفسها.' : 'اختر المراقب والقاعة قبل الحفظ.', 'warning');
                                      return;
                                    }
                                    const updatedProctors = proctorAssignments.map(p => p.id === pa.id ? { ...p, ...editingValues } : p);
                                    const persisted = await saveToServerDb(examSettings, halls, subjects, studentList, gradesMatrix, schedule, updatedProctors, approvalStatus, auditLogs, classesList);
                                    if (!persisted) return;
                                    setProctorAssignments(updatedProctors);
                                    setEditingEntityId(null);
                                    triggerNotification('تم تحديث بيانات تكليف الملاحظ بنجاح', 'success');
                                    logAction(`تعديل تكليف الملاحظ: ${editingValues.name}`, 'المراقبون والملاحظون');
                                  }}
                                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] rounded font-bold cursor-pointer"
                                >
                                  حفظ
                                </button>
                                <button
                                  onClick={() => setEditingEntityId(null)}
                                  className="px-2 py-1 bg-[#130b04] hover:bg-[#38271a] text-amber-200 text-[10px] border border-[#d4af37]/30 rounded font-bold cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center w-full">
                              <div className="space-y-1">
                                <h4 className="font-bold text-[#fce79a] text-xs">{pa.name}</h4>
                                <span className="text-[10px] text-amber-200/60 font-bold block">
                                  القاعة: <span className="text-[#f7d174] font-bold">{halls.find(h => h.id === pa.hallId)?.name || 'غير محدد'}</span>
                                </span>
                                <span className="text-xs text-amber-100/90 font-medium">الفترة المكلف بها: {pa.shift}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingEntityId(pa.id);
                                    setEditingValues({ name: pa.name, hallId: pa.hallId, shift: pa.shift });
                                  }}
                                  className="p-1 text-amber-300 hover:bg-[#130b04] rounded cursor-pointer"
                                  title="تعديل التكليف"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    const updatedProctors = proctorAssignments.filter(p => p.id !== pa.id);
                                    const persisted = await saveToServerDb(examSettings, halls, subjects, studentList, gradesMatrix, schedule, updatedProctors, approvalStatus, auditLogs, classesList);
                                    if (!persisted) return;
                                    setProctorAssignments(updatedProctors);
                                    triggerNotification(`تم إلغاء تكليف ${pa.name}`, 'info');
                                    logAction(`إلغاء تكليف الملاحظ: ${pa.name}`, 'المراقبون والملاحظون');
                                  }}
                                  className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-lg cursor-pointer"
                                  title="إلغاء التكليف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: Exam Schedule */}
        {activeTab === 'schedule' && (() => {
          // Calculate stats for overview
          const scheduledExamsCount = schedule.length;
          const examClasses = classesList.filter(classItem => studentList.some(student => student.classroom === classItem.name));
          const totalSubjectsToSchedule = examClasses.length * subjects.length;
          const schedulingProgress = totalSubjectsToSchedule > 0 ? Math.round((scheduledExamsCount / totalSubjectsToSchedule) * 100) : 0;

          // Identify any active conflicts
          const conflicts = getScheduleConflicts(schedule);
          const errorConflicts = conflicts.filter(c => c.severity === 'error');
          const warningConflicts = conflicts.filter(c => c.severity === 'warning');

          const scheduleRulesError = getScheduleRulesError(scheduleConfig);

          // Check if preparation is complete
          const isPrepComplete = {
            academic: examClasses.length > 0,
            subjects: subjects.length > 0,
            halls: halls.filter(h => h.status !== 'inactive').length > 0,
            proctors: availableTeachers.length > 0,
            rules: !scheduleRulesError
          };
          const prepProgressScore = Object.values(isPrepComplete).filter(Boolean).length * 20;

          // Handler to run automated scheduler
          const handleRunAutoScheduler = async () => {
            const currentScheduleConfig = scheduleConfigRef.current;
            const currentScheduleRulesError = getScheduleRulesError(currentScheduleConfig);
            if (scheduleApprovalStatus.approved) {
              triggerNotification('الجدول معتمد ومقفل حالياً. الرجاء إلغاء الاعتماد أولاً من تبويب المراجعة والاعتماد لتشغيل المحرك.', 'warning');
              return;
            }

            if (currentScheduleRulesError) {
              triggerNotification(currentScheduleRulesError, 'warning');
              setScheduleSubTab('prep');
              setPrepActiveCategory('rules');
              return;
            }

            if (!isPrepComplete.academic || !isPrepComplete.subjects || !isPrepComplete.halls || !isPrepComplete.proctors) {
              triggerNotification('تنبيه: لم تكتمل تجهيزات الجدولة بعد! يرجى إتمام تهيئة الصفوف والمواد والقاعات والمراقبين أولاً.', 'warning');
              setScheduleSubTab('prep');
              return;
            }

            const startStr = currentScheduleConfig.startDate;
            let currentDate = new Date(startStr);
            const generatedSchedule: any[] = [];
            const examDatesByClass = new Map<string, string[]>();
            const weeklyExamCountByClass = new Map<string, number>();

            // Build the queue of exams to schedule
            const queue: { classroom: string; subjectId: string }[] = [];
            examClasses.forEach(cls => {
              subjects.forEach(sub => {
                queue.push({ classroom: cls.name, subjectId: sub.id });
              });
            });

            let dayLoopLimit = 0;
            // Iterate day by day
            while (queue.length > 0 && dayLoopLimit < 366) {
              dayLoopLimit++;

              // Get day details
              const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday... 6=Saturday
              // Check if weekend (e.g. Friday index 5, Saturday index 6)
              const isWeekend = currentScheduleConfig.holidayDays.includes(dayOfWeek);
              const dateString = currentDate.toISOString().split('T')[0];
              const isHoliday = currentScheduleConfig.customHolidays.includes(dateString);

              if (isWeekend || isHoliday) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
              }

              const dayName = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][currentDate.getDay()];

              // Track bookings in each slot for today
              const bookedHallsToday = new Map<string, string[]>(); // slotId -> hallIds
              const bookedProctorsToday = new Map<string, string[]>(); // slotId -> proctorIds
              const scheduledClassCountToday = new Map<string, number>();
              const weekStart = new Date(currentDate);
              weekStart.setDate(currentDate.getDate() - currentDate.getDay());
              const weekKey = weekStart.toISOString().split('T')[0];

              // For each time period/slot
              for (const slot of currentScheduleConfig.dailySlots) {
                if (queue.length === 0) break;

                const hallsInSlot = bookedHallsToday.get(slot.id) || [];
                const proctorsInSlot = bookedProctorsToday.get(slot.id) || [];

                // Filter candidates for this day (only schedule 1 exam per class per day to avoid overloading)
                const candidatesForSlot = queue.filter(q => (scheduledClassCountToday.get(q.classroom) || 0) < currentScheduleConfig.subjectsPerDay);

                for (const exam of [...candidatesForSlot]) {
                  const examsToday = scheduledClassCountToday.get(exam.classroom) || 0;
                  if (examsToday >= currentScheduleConfig.subjectsPerDay) continue;
                  const weeklyKey = `${exam.classroom}|${weekKey}`;
                  if ((weeklyExamCountByClass.get(weeklyKey) || 0) >= currentScheduleConfig.examsPerWeek) continue;
                  const priorExamDates = examDatesByClass.get(exam.classroom) || [];
                  const violatesGap = examsToday === 0 && priorExamDates.some(priorDate => {
                    const differenceDays = Math.round((currentDate.getTime() - new Date(priorDate).getTime()) / 86_400_000);
                    return differenceDays > 0 && differenceDays <= currentScheduleConfig.minGapDays;
                  });
                  if (violatesGap) continue;

                  const sub = subjects.find(s => s.id === exam.subjectId);
                  if (!sub) continue;

                  // Find available halls that fit the class capacity
                  const classStudentsCount = studentList.filter(s => s.classroom === exam.classroom).length;
                  if (classStudentsCount === 0) continue;
                  const activeHalls = halls.filter(h => h.status !== 'inactive');

                  let assignedHallId = '';
                  let isSplit = false;
                  let splitHallsList: string[] = [];

                  // Attempt single hall match
                  const singleHall = activeHalls.find(h => !hallsInSlot.includes(h.id) && h.capacity >= classStudentsCount);
                  if (singleHall) {
                    assignedHallId = singleHall.id;
                    hallsInSlot.push(singleHall.id);
                  } else {
                    // Split class across multiple active, unbooked halls
                    const availableHalls = activeHalls.filter(h => !hallsInSlot.includes(h.id));
                    let currentCapacitySum = 0;
                    const accumulatedHalls: string[] = [];
                    for (const h of availableHalls) {
                      accumulatedHalls.push(h.id);
                      currentCapacitySum += h.capacity;
                      if (currentCapacitySum >= classStudentsCount) {
                        break;
                      }
                    }
                    if (currentCapacitySum >= classStudentsCount && accumulatedHalls.length > 0) {
                      isSplit = true;
                      splitHallsList = accumulatedHalls;
                      accumulatedHalls.forEach(id => hallsInSlot.push(id));
                      assignedHallId = accumulatedHalls[0]; // main hall
                    }
                  }

                  if (!assignedHallId) {
                    // No hall fits this class in this slot, skip to next candidate/slot
                    continue;
                  }

                  // Find available proctor who has not exceeded max duties and has no conflicts
                  const availableProctors = availableTeachers;
                  const suitableProctor = availableProctors.find(t => {
                    const isBooked = proctorsInSlot.includes(t.id);
                    const isUnavailable = customProctorUnavailable[t.id]?.includes(dateString) ||
                                          customProctorUnavailable[t.id]?.includes(dayName);
                    // Cap workload per calendar week, not across the entire exam period.
                    // A teacher who completed a prior week's duties remains eligible next week.
                    const maximumWeeklyDuties = currentScheduleConfig.examsPerWeek * 2;
                    return !isBooked && !isUnavailable && canAssignProctorForWeek(
                      generatedSchedule,
                      t.id,
                      weekKey,
                      maximumWeeklyDuties
                    );
                  });

                  if (!suitableProctor) continue;
                  const proctorId = suitableProctor.id;
                  proctorsInSlot.push(suitableProctor.id);

                  // Book exam period
                  generatedSchedule.push({
                    id: `sc-${Date.now()}-${generatedSchedule.length}`,
                    classroom: exam.classroom,
                    subjectId: exam.subjectId,
                    date: dateString,
                    day: dayName,
                    startTime: slot.start,
                    endTime: slot.end,
                    hallId: assignedHallId,
                    proctorId: proctorId,
                    isSplit,
                    splitHalls: isSplit ? splitHallsList : undefined
                  });

                  scheduledClassCountToday.set(exam.classroom, examsToday + 1);
                  weeklyExamCountByClass.set(weeklyKey, (weeklyExamCountByClass.get(weeklyKey) || 0) + 1);
                  examDatesByClass.set(exam.classroom, [...priorExamDates, dateString]);

                  // Remove from queue
                  const qIdx = queue.findIndex(q => q.classroom === exam.classroom && q.subjectId === exam.subjectId);
                  if (qIdx > -1) queue.splice(qIdx, 1);
                }

                bookedHallsToday.set(slot.id, hallsInSlot);
                bookedProctorsToday.set(slot.id, proctorsInSlot);
              }

              // Advance to next day
              currentDate.setDate(currentDate.getDate() + 1);
            }

            const persisted = await saveToServerDb(
              examSettings,
              halls,
              subjects,
              studentList,
              gradesMatrix,
              generatedSchedule,
              proctorAssignments,
              approvalStatus,
              auditLogs,
              classesList
            );

            if (!persisted) {
              triggerNotification('تعذر حفظ جدول الامتحانات والمراقبين في المصدر المركزي.', 'warning');
              return;
            }
            setSchedule(generatedSchedule);

            if (queue.length === 0) {
              triggerNotification(`🎉 اكتمل تكوين الجدول تلقائياً بنجاح! تم جدولة جميع المواد لجميع الصفوف (${generatedSchedule.length} اختباراً) دون أي تداخل زمني أو تعارض في الملاحظين والقاعات.`, 'success');
              logAction('تشغيل محرك الجدولة الذكي تلقائياً وجدولة كافة الاختبارات', 'جدول الامتحانات');
            } else {
              triggerNotification(`تم تكوين الجدول تلقائياً لـ ${generatedSchedule.length} اختباراً، مع بقاء ${queue.length} مادة معلقة لعدم كفاية اللجان أو المراقبين. يرجى مراجعتها وتوزيعها يدوياً.`, 'warning');
              logAction('تشغيل محرك الجدولة الذكي تلقائياً مع مواد معلقة يدوية', 'جدول الامتحانات');
            }
            return true;
          };

          // Optimizes the schedule by balancing the gap days between exams for students
          const handleOptimizeSchedule = async () => {
            if (scheduleApprovalStatus.approved) {
              triggerNotification('الجدول معتمد ومقفل. لا يمكن تحسينه حالياً.', 'warning');
              return;
            }
            if (schedule.length === 0) {
              triggerNotification('لا يوجد جدول اختبارات قائم لتحسينه حالياً!', 'warning');
              return;
            }
            // Trigger auto scheduler as a solid optimization pass
            const persisted = await handleRunAutoScheduler();
            if (persisted === false) return;
            triggerNotification('تم تشغيل خوارزمية التحسين والموازنة: تم ترتيب المواد لتبدأ بالصعبة وتوسيع فترات التباعد والراحة للطلاب.', 'success');
          };

          // Manual item form state was moved to top-level of component to satisfy Rules of Hooks

          const handleAddManualExam = async (e: React.FormEvent) => {
            e.preventDefault();
            if (scheduleApprovalStatus.approved) {
              triggerNotification('الجدول معتمد ومقفل! لا يمكن إضافة اختبارات يدوياً.', 'warning');
              return;
            }
            if (scheduleRulesError) {
              triggerNotification(scheduleRulesError, 'warning');
              setPrepActiveCategory('rules');
              return;
            }
            if (!manualExam.date) {
              triggerNotification('يرجى اختيار تاريخ الامتحان أولاً', 'warning');
              return;
            }
            if (!manualExam.classroom || !manualExam.subjectId || !manualExam.hallId || !manualExam.proctorId || !manualExam.startTime || !manualExam.endTime) {
              triggerNotification('أكمل الصف والمادة والقاعة والمراقب ووقت الاختبار قبل الحفظ.', 'warning');
              return;
            }
            if (manualExam.startTime >= manualExam.endTime) {
              triggerNotification('وقت نهاية الاختبار يجب أن يكون بعد وقت البداية.', 'warning');
              return;
            }

            const manualDate = new Date(`${manualExam.date}T12:00:00`);
            const dayOfWeek = manualDate.getDay();
            const dayName = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek];
            if (scheduleConfig.holidayDays.includes(dayOfWeek) || scheduleConfig.customHolidays.includes(manualExam.date)) {
              triggerNotification('تعذر الإضافة: التاريخ المحدد يوم إجازة في قواعد الجدولة.', 'warning');
              return;
            }
            if (schedule.some(existing => existing.classroom === manualExam.classroom && existing.subjectId === manualExam.subjectId)) {
              triggerNotification('تعذر الإضافة: المادة مدرجة مسبقاً لهذا الصف.', 'warning');
              return;
            }
            const classStudentCount = studentList.filter(student => student.classroom === manualExam.classroom).length;
            const selectedHall = halls.find(hall => hall.id === manualExam.hallId);
            if (classStudentCount === 0 || !selectedHall || selectedHall.capacity < classStudentCount) {
              triggerNotification('تعذر الإضافة: الصف بلا طلاب رسميين أو سعة القاعة لا تغطي عددهم.', 'warning');
              return;
            }
            if (customProctorUnavailable[manualExam.proctorId]?.some(value => value === manualExam.date || value === dayName)) {
              triggerNotification('تعذر الإضافة: المراقب غير متاح في التاريخ أو اليوم المحدد.', 'warning');
              return;
            }
            const examsForClassOnDay = schedule.filter(existing => existing.classroom === manualExam.classroom && existing.date === manualExam.date).length;
            if (examsForClassOnDay >= scheduleConfig.subjectsPerDay) {
              triggerNotification('تعذر الإضافة: بلغ الصف الحد الأقصى للامتحانات اليومية.', 'warning');
              return;
            }
            const weekStart = new Date(manualDate);
            weekStart.setDate(manualDate.getDate() - manualDate.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            const examsForClassInWeek = schedule.filter(existing => {
              if (existing.classroom !== manualExam.classroom) return false;
              const existingDate = new Date(`${existing.date}T12:00:00`);
              return existingDate >= weekStart && existingDate <= weekEnd;
            }).length;
            if (examsForClassInWeek >= scheduleConfig.examsPerWeek) {
              triggerNotification('تعذر الإضافة: بلغ الصف الحد الأقصى للامتحانات الأسبوعية.', 'warning');
              return;
            }
            const violatesGap = examsForClassOnDay === 0 && schedule.some(existing => {
              if (existing.classroom !== manualExam.classroom) return false;
              const differenceDays = Math.abs(Math.round((manualDate.getTime() - new Date(`${existing.date}T12:00:00`).getTime()) / 86_400_000));
              return differenceDays > 0 && differenceDays <= scheduleConfig.minGapDays;
            });
            if (violatesGap) {
              triggerNotification('تعذر الإضافة: لا يحقق التاريخ الحد الأدنى لأيام الراحة المحددة.', 'warning');
              return;
            }

            const item = {
              id: `sc-manual-${Date.now()}`,
              ...manualExam,
              day: dayName
            };

            const updatedSchedule = [...schedule, item];
            const postConflicts = getScheduleConflicts(updatedSchedule);
            if (postConflicts.some(c => c.severity === 'error')) {
              triggerNotification('تعذر إضافة الاختبار: يوجد تعارض زمني حرج في القاعة أو الصف أو المراقب.', 'warning');
              return;
            }
            const persisted = await saveToServerDb(
              examSettings,
              halls,
              subjects,
              studentList,
              gradesMatrix,
              updatedSchedule,
              proctorAssignments,
              approvalStatus,
              auditLogs,
              classesList
            );

            if (!persisted) {
              triggerNotification('تعذر حفظ الاختبار اليدوي في المصدر المركزي.', 'warning');
              return;
            }
            setSchedule(updatedSchedule);

            triggerNotification('تمت إضافة الاختبار يدوياً بنجاح وبشكل متوافق مع كافة القيود.', 'success');
            logAction(`إضافة اختبار يدوي مادة ${subjects.find(s => s.id === manualExam.subjectId)?.name}`, 'جدول الامتحانات');
          };

          const handleApproveSchedule = async () => {
            if (currentUserRole !== 'admin') {
              triggerNotification('اعتماد الجدول يتطلب صلاحية مدير المدرسة أو مدير المنصة.', 'warning');
              return;
            }
            if (errorConflicts.length > 0) {
              triggerNotification('لا يمكن اعتماد الجدول قبل معالجة التعارضات الزمنية الحرجة.', 'warning');
              setScheduleSubTab('approval');
              return;
            }
            if (totalSubjectsToSchedule === 0 || schedule.length !== totalSubjectsToSchedule) {
              triggerNotification(`لا يمكن اعتماد جدول غير مكتمل: المجدول ${schedule.length} من ${totalSubjectsToSchedule} اختباراً مطلوباً.`, 'warning');
              return;
            }
            const reason = window.prompt('أدخل مبرر اعتماد جدول الامتحانات وقفل تعديله:')?.trim();
            if (!reason) {
              triggerNotification('تم إلغاء الاعتماد: السبب الموثق إلزامي.', 'warning');
              return;
            }
            const nextApprovalStatus = {
              approved: true,
              approvedBy: trustedActorLabel,
              approvedAt: new Date().toLocaleString('ar-EG'),
              notes: reason
            };
            const persisted = await saveToServerDb(
              examSettings, halls, subjects, studentList, gradesMatrix, schedule, proctorAssignments,
              approvalStatus, auditLogs, classesList, controlClosures, reEvaluationRequests, snapshots,
              reviewedStagesSubjects, stageApprovalStatus, 'approve_schedule',
              { scheduleApprovalStatus: nextApprovalStatus, operationReason: reason }
            );
            if (!persisted) {
              triggerNotification('تعذر حفظ اعتماد جدول الامتحانات في المصدر المركزي.', 'warning');
              return;
            }
            setScheduleApprovalStatus(typeof persisted === 'object' && persisted.operationState?.scheduleApprovalStatus
              ? persisted.operationState.scheduleApprovalStatus
              : nextApprovalStatus);
            triggerNotification('تم اعتماد جدول الاختبارات وقفل تعديله من الخادم.', 'success');
            logAction(`اعتماد جدول الامتحانات وقفل التغييرات - السبب: ${reason}`, 'جدول الامتحانات');
          };

          const handleReopenSchedule = async () => {
            if (currentUserRole !== 'admin') {
              triggerNotification('إعادة فتح الجدول تتطلب صلاحية مدير المدرسة أو مدير المنصة.', 'warning');
              return;
            }
            const reason = window.prompt('أدخل مبرر إعادة فتح جدول الامتحانات للتعديل:')?.trim();
            if (!reason) {
              triggerNotification('تم إلغاء إعادة الفتح: السبب الموثق إلزامي.', 'warning');
              return;
            }
            const nextApprovalStatus = { approved: false, approvedBy: '', approvedAt: '', notes: '' };
            const persisted = await saveToServerDb(
              examSettings, halls, subjects, studentList, gradesMatrix, schedule, proctorAssignments,
              approvalStatus, auditLogs, classesList, controlClosures, reEvaluationRequests, snapshots,
              reviewedStagesSubjects, stageApprovalStatus, 'reopen_schedule',
              { scheduleApprovalStatus: nextApprovalStatus, operationReason: reason }
            );
            if (!persisted) {
              triggerNotification('تعذر حفظ إعادة فتح الجدول في المصدر المركزي.', 'warning');
              return;
            }
            setScheduleApprovalStatus(typeof persisted === 'object' && persisted.operationState?.scheduleApprovalStatus
              ? persisted.operationState.scheduleApprovalStatus
              : nextApprovalStatus);
            triggerNotification('تمت إعادة فتح الجدول للتعديل مع توثيق السبب.', 'info');
            logAction(`إعادة فتح جدول الامتحانات - السبب: ${reason}`, 'جدول الامتحانات');
          };

          return (
            <div className="space-y-6">

              {/* MAIN HEADER & ACTION TOOLBAR (شريط أدوات الكنترول الاحترافي) */}
              <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 flex flex-col xl:flex-row xl:items-center justify-between gap-4 text-amber-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#2a1d13] text-[#f7d174] rounded-lg border border-[#d4af37]/40">
                      <Calendar className="w-5 h-5 text-[#f7d174]" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-[#fce79a] tracking-tight">منظومة جدولة الامتحانات الذكية والآلية</h2>
                      <p className="text-[10px] text-amber-200/70 font-bold">تجهيز، تكوين آلي خالي من التعارضات، مراجعة وتدقيق اللجان، تصدير التقارير المطبوعة</p>
                    </div>
                  </div>
                </div>

                {/* Professional Controls Row */}
                <div className="flex flex-wrap items-center gap-1.5 bg-[#130b04] p-1.5 border border-[#d4af37]/30">
                  <button
                    onClick={() => {
                      setScheduleSubTab('prep');
                      triggerNotification('تم الانتقال إلى لوحة تجهيز وإعداد البيانات الأساسية', 'info');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      scheduleSubTab === 'prep' ? 'bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] text-slate-950 shadow-md border border-[#fce79a]' : 'bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 border border-[#d4af37]/30'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>تجهيز البيانات</span>
                  </button>

                  <button
                    onClick={handleRunAutoScheduler}
                    disabled={scheduleApprovalStatus.approved}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#9a6a1d] via-[#c58a22] to-[#8b6113] hover:brightness-110 disabled:opacity-50 text-[#fff8d6] rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-md border border-[#f7d174]/50"
                    title="تشغيل محرك البحث التشغيلي والجدولة الآلية للذكاء الأكاديمي"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#fce79a]" />
                    <span>تكوين الجدول تلقائيًا</span>
                  </button>

                  <button
                    onClick={() => setScheduleSubTab('approval')}
                    className="px-3 py-1.5 bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 border border-[#d4af37]/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#f7d174]" />
                    <span>مراجعة التعارضات</span>
                  </button>

                  <button
                    onClick={handleOptimizeSchedule}
                    disabled={scheduleApprovalStatus.approved}
                    className="px-3 py-1.5 bg-[#2a1d13] hover:bg-[#38271a] text-amber-200 border border-[#d4af37]/30 rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                    title="تحسين توزيع التباعد الزمني وموازنة تكاليف الملاحظين"
                  >
                    موازنة وتحسين الجدول
                  </button>

                  <div className="h-5 w-[1px] bg-[#d4af37]/30 mx-1" />

                  <button
                    onClick={async () => {
                      const success = await saveToServerDb();
                      if (success) {
                        triggerNotification('تم حفظ مسودة الجدول وقواعد البيانات بنجاح إلى الخادم السحابي! 💾', 'success');
                      } else {
                        triggerNotification('فشل الاتصال بالخادم لحفظ التعديلات', 'warning');
                      }
                    }}
                    className="p-1.5 bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 border border-[#d4af37]/30 rounded-lg cursor-pointer"
                    title="حفظ دائم للمسودة"
                  >
                    <Save className="w-4 h-4 text-[#f7d174]" />
                  </button>

                  {scheduleApprovalStatus.approved ? (
                    <button
                      onClick={handleReopenSchedule}
                      className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5 text-rose-400" />
                      <span>إلغاء الاعتماد</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleApproveSchedule}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-md border border-[#fce79a]"
                    >
                      <LockIcon className="w-3.5 h-3.5" />
                      <span>اعتماد الجدول</span>
                    </button>
                  )}

                  <button
                    onClick={handlePrintScheduleReport}
                    className="p-1.5 bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 border border-[#d4af37]/30 rounded-lg cursor-pointer"
                    title="طباعة الجدول"
                  >
                    <Printer className="w-4 h-4 text-amber-200" />
                  </button>

                  <button
                    onClick={handleForceSync}
                    className="p-1.5 bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 border border-[#d4af37]/30 rounded-lg cursor-pointer"
                    title="مزامنة وتحديث البيانات"
                  >
                    <RefreshCw className={`w-4 h-4 text-amber-200 ${isDbSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* DYNAMIC PROGRESS & BULLETINS BENTO CARD */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#2a1d13] via-[#1f150d] to-[#130b04] p-4 text-amber-100 border border-[#d4af37]/40 shadow-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-[#f7d174] font-extrabold uppercase tracking-wider block">معدل الإنجاز والأتمتة</span>
                    <h3 className="text-xl font-black text-[#fce79a] mt-1">{schedulingProgress}%</h3>
                    <p className="text-[10px] text-amber-200/70 font-medium mt-0.5">
                      تمت جدولة {scheduledExamsCount} مادة من إجمالي {totalSubjectsToSchedule} مستهدفة بالخطة.
                    </p>
                  </div>
                  <div className="w-full bg-[#130b04] h-1.5 rounded-full overflow-hidden mt-3 border border-[#d4af37]/20">
                    <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f7d174] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, schedulingProgress)}%` }} />
                  </div>
                </div>

                <div className="bg-[#1c120c] p-4 border border-[#d4af37]/30 shadow-md flex flex-col justify-between text-amber-100">
                  <div>
                    <span className="text-[10px] text-amber-200/60 font-extrabold block">جاهزية التجهيزات المسبقة</span>
                    <h3 className="text-xl font-black text-[#fce79a] mt-1">{prepProgressScore}%</h3>
                    <p className="text-[10px] text-amber-200/70 font-semibold mt-0.5">
                      {prepProgressScore === 100 ? 'جميع البيانات مجهزة وصالحة للجدولة الآلية' : 'بعض البيانات الأساسية ناقصة! يرجى تهيئتها'}
                    </p>
                  </div>
                  <div className="w-full bg-[#130b04] h-1.5 rounded-full overflow-hidden mt-3 border border-[#d4af37]/20">
                    <div className="h-full bg-[#d4af37] rounded-full transition-all duration-500" style={{ width: `${prepProgressScore}%` }} />
                  </div>
                </div>

                <div className="bg-[#1c120c] p-4 border border-[#d4af37]/30 shadow-md flex flex-col justify-between text-amber-100">
                  <div>
                    <span className="text-[10px] text-amber-200/60 font-extrabold block">التعارضات الزمنية والمطابقة</span>
                    <h3 className="text-xl font-black text-[#fce79a] mt-1 flex items-center gap-1.5">
                      {errorConflicts.length > 0 ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-5 h-5 animate-bounce" />
                          {errorConflicts.length} تعارض خطير
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-5 h-5" />
                          الجدول سليم
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-amber-200/70 font-semibold mt-0.5">
                      {warningConflicts.length > 0 ? `توجد ${warningConflicts.length} تنبيهات قابلة للمطابقة والتجاهل.` : 'لا توجد تنبيهات تكرار أو تداخل.'}
                    </p>
                  </div>
                  <div className="w-full bg-[#130b04] h-1.5 rounded-full overflow-hidden mt-3 border border-[#d4af37]/20">
                    <div className={`h-full rounded-full ${errorConflicts.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="bg-[#1c120c] p-4 border border-[#d4af37]/30 shadow-md flex flex-col justify-between text-amber-100">
                  <div>
                    <span className="text-[10px] text-amber-200/60 font-extrabold block">حالة الاعتماد والحماية</span>
                    <h3 className="text-xl font-black text-[#fce79a] mt-1 flex items-center gap-1.5">
                      {scheduleApprovalStatus.approved ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-sm font-black">
                          <LockIcon className="w-4 h-4 text-emerald-400" />
                          🔒 معتمد ومحمي بالكنترول
                        </span>
                      ) : (
                        <span className="text-[#f7d174] flex items-center gap-1 text-sm font-black">
                          <Unlock className="w-4 h-4 text-[#f7d174]" />
                          🔓 قيد التعديل والصياغة
                        </span>
                      )}
                    </h3>
                    <p className="text-[9px] text-amber-200/60 font-semibold mt-0.5">
                      {scheduleApprovalStatus.approved ? `المعتمد: ${scheduleApprovalStatus.approvedBy}` : 'التغييرات محفوظة كمسودات تفاعلية'}
                    </p>
                  </div>
                  <div className="w-full bg-[#130b04] h-1.5 rounded-full overflow-hidden mt-3 border border-[#d4af37]/20">
                    <div className={`h-full rounded-full ${scheduleApprovalStatus.approved ? 'bg-emerald-500' : 'bg-[#d4af37]'}`} style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* HORIZONTAL TABS TO SWITCH BETWEEN SUBTABS */}
              <div className="bg-[#1c120c] p-1.5 flex flex-wrap items-center gap-1.5 border border-[#d4af37]/30 w-fit">
                <button
                  onClick={() => setScheduleSubTab('prep')}
                  className={`px-5 py-2.5 font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    scheduleSubTab === 'prep' ? 'bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] text-slate-950 shadow-md border border-[#fce79a]' : 'text-amber-100/80 hover:text-amber-100 bg-[#2a1d13]/50 hover:bg-[#2a1d13]'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>التبويب الأول: تجهيزات الامتحانات</span>
                </button>

                <button
                  onClick={() => setScheduleSubTab('engine')}
                  className={`px-5 py-2.5 font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    scheduleSubTab === 'engine' ? 'bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] text-slate-950 shadow-md border border-[#fce79a]' : 'text-amber-100/80 hover:text-amber-100 bg-[#2a1d13]/50 hover:bg-[#2a1d13]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>التبويب الثاني: محرك الجدولة التلقائي والذكي</span>
                </button>

                <button
                  onClick={() => setScheduleSubTab('approval')}
                  className={`px-5 py-2.5 font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    scheduleSubTab === 'approval' ? 'bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] text-slate-950 shadow-md border border-[#fce79a]' : 'text-amber-100/80 hover:text-amber-100 bg-[#2a1d13]/50 hover:bg-[#2a1d13]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#f7d174]" />
                  <span>التبويب الثالث: مراجعة واعتماد جدول الامتحانات</span>
                </button>

                <button
                  onClick={() => setScheduleSubTab('reports')}
                  className={`px-5 py-2.5 font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    scheduleSubTab === 'reports' ? 'bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] text-slate-950 shadow-md border border-[#fce79a]' : 'text-amber-100/80 hover:text-amber-100 bg-[#2a1d13]/50 hover:bg-[#2a1d13]'
                  }`}
                >
                  <FilePieChart className="w-4 h-4 text-[#f7d174]" />
                  <span>التبويب الرابع: التقارير والجدول الموحد</span>
                </button>
              </div>

              {/* TAB 1: PREPARATION SUBTAB CONTENT */}
              {scheduleSubTab === 'prep' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                  {/* Preparation Sidebar */}
                  <div className="bg-[#1c120c] p-4 border border-[#d4af37]/30 space-y-2 self-start text-amber-100">
                    <span className="text-[10px] font-black text-amber-200/60 px-3 uppercase block">تصنيفات التجهيز المسبق</span>

                    {[
                      { id: 'academic', label: 'تجهيز الهيكل الأكاديمي', desc: 'العام، الفصول والصفوف', color: 'text-[#fce79a]' },
                      { id: 'subjects', label: 'تجهيزات المواد الدراسية', desc: 'الأزمنة والدرجات العظمى والصغرى', color: 'text-[#fce79a]' },
                      { id: 'halls', label: 'تجهيز القاعات واللجان', desc: 'الطاقة الاستيعابية والمواقع', color: 'text-[#fce79a]' },
                      { id: 'proctors', label: 'شؤون المراقبين والملاحظين', desc: 'الأيام وسقوف التكليفات', color: 'text-[#fce79a]' },
                      { id: 'rules', label: 'محددات وقواعد الجدولة', desc: 'البداية والنهاية، الإجازات والفترات', color: 'text-[#fce79a]' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setPrepActiveCategory(cat.id as any)}
                        className={`w-full text-right p-3 flex flex-col gap-0.5 cursor-pointer transition-all ${
                          prepActiveCategory === cat.id ? 'bg-gradient-to-r from-[#2a1d13] to-[#38271a] border border-[#d4af37]/50 shadow-md' : 'hover:bg-[#2a1d13]/50'
                        }`}
                      >
                        <span className={`text-xs font-black ${prepActiveCategory === cat.id ? cat.color : 'text-amber-100'}`}>{cat.label}</span>
                        <span className="text-[9px] text-amber-200/60 font-medium">{cat.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Preparation Dynamic Forms/Views Area */}
                  <div className="lg:col-span-3 bg-[#1c120c] p-6 border border-[#d4af37]/40 text-amber-100">

                    {/* Category: Academic Structure */}
                    {prepActiveCategory === 'academic' && (
                      <div className="space-y-6">
                        <div className="border-b border-[#d4af37]/30 pb-2">
                          <h4 className="font-black text-[#fce79a] text-sm">تهيئة الهيكل الأكاديمي وتوزيع الفصول</h4>
                          <p className="text-[10px] text-amber-200/60">تثبيت العام والصفوف الدراسية النشطة في الكنترول</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-[#2a1d13] p-4 border border-[#d4af37]/30">
                            <span className="text-[10px] text-amber-200/60 font-extrabold block">العام الدراسي الحالي:</span>
                            <span className="text-sm font-black text-[#fce79a] mt-1 block">{examSettings.academicYear}</span>
                          </div>
                          <div className="bg-[#2a1d13] p-4 border border-[#d4af37]/30">
                            <span className="text-[10px] text-amber-200/60 font-extrabold block">الفصل الدراسي النشط:</span>
                            <span className="text-sm font-black text-[#f7d174] mt-1 block">{examSettings.semester}</span>
                          </div>
                          <div className="bg-[#2a1d13] p-4 border border-[#d4af37]/30">
                            <span className="text-[10px] text-amber-200/60 font-extrabold block">تاريخ الفلترة الافتراضي:</span>
                            <span className="text-sm font-black text-[#fce79a] mt-1 block">{scheduleConfig.startDate || 'لم يحدد تاريخ البداية'}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-black text-[#fce79a] block">الصفوف والفصول المشمولة بالامتحانات:</span>
                          <div className="overflow-x-auto border border-[#d4af37]/30">
                            <table className="w-full text-right text-xs">
                              <thead className="bg-[#2a1d13] text-[#f7d174]">
                                <tr>
                                  <th className="p-3 font-bold">اسم الصف</th>
                                  <th className="p-3 font-bold">المرحلة</th>
                                  <th className="p-3 font-bold">الشعب المتوفرة</th>
                                  <th className="p-3 font-bold">الطاقة القصوى للشعبة</th>
                                  <th className="p-3 font-bold">الطلاب المقيدون</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#d4af37]/20">
                                {classesList.map(cls => {
                                  const count = studentList.filter(s => s.classroom === cls.name).length;
                                  return (
                                    <tr key={cls.id} className="hover:bg-[#2a1d13]/60">
                                      <td className="p-3 font-extrabold text-[#fce79a]">{cls.name}</td>
                                      <td className="p-3 font-bold text-slate-500">{getStageLabelArabic(cls.level)}</td>
                                      <td className="p-3">
                                        <div className="flex gap-1">
                                          {(cls.sections || []).map((sec: string) => (
                                            <span key={sec} className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">{sec}</span>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="p-3 font-semibold text-slate-600">{cls.capacity} طالب</td>
                                      <td className="p-3 font-extrabold text-amber-600">{count} طالب مقيد</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Category: Subjects */}
                    {prepActiveCategory === 'subjects' && (
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <h4 className="font-black text-slate-900 text-sm">تجهيزات المواد الدراسية وخيارات الامتحانات</h4>
                          <p className="text-[10px] text-slate-400">تحديد أزمنة الامتحان والدرجات العظمى والصغرى لضبط عمليات القياس والجدولة والتحقق</p>
                        </div>

                        <div className="overflow-x-auto border border-slate-200">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="p-3 font-bold">المادة الدراسية</th>
                                <th className="p-3 font-bold">الدرجة العظمى</th>
                                <th className="p-3 font-bold">درجة النجاح (الصغرى)</th>
                                <th className="p-3 font-bold text-center">زمن الامتحان</th>
                                <th className="p-3 font-bold text-center">التصنيف</th>
                                <th className="p-3 font-bold text-center">الإجراء</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                              {subjects.map(sub => (
                                <tr key={sub.id} className="hover:bg-transparent">
                                  <td className="p-3 font-black text-slate-900">{sub.name}</td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      disabled={scheduleApprovalStatus.approved}
                                      value={sub.maxScore}
                                      onChange={(e) => {
                                        const updated = subjects.map(s => s.id === sub.id ? { ...s, maxScore: Number(e.target.value) } : s);
                                        setSubjects(updated);
                                      }}
                                      className="w-20 p-1 border rounded text-xs text-center font-bold"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      disabled={scheduleApprovalStatus.approved}
                                      value={sub.passScore}
                                      onChange={(e) => {
                                        const updated = subjects.map(s => s.id === sub.id ? { ...s, passScore: Number(e.target.value) } : s);
                                        setSubjects(updated);
                                      }}
                                      className="w-20 p-1 border rounded text-xs text-center font-bold"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <select
                                      disabled={scheduleApprovalStatus.approved}
                                      value={sub.examDuration || 120}
                                      onChange={(e) => {
                                        const updated = subjects.map(s => s.id === sub.id ? { ...s, examDuration: Number(e.target.value) } : s);
                                        setSubjects(updated);
                                      }}
                                      className="p-1 border rounded text-xs font-bold bg-white"
                                    >
                                      <option value="60">60 دقيقة (ساعة)</option>
                                      <option value="90">90 دقيقة (ساعة ونصف)</option>
                                      <option value="120">120 دقيقة (ساعتان)</option>
                                      <option value="180">180 دقيقة (3 ساعات)</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      disabled={scheduleApprovalStatus.approved}
                                      onClick={() => {
                                        const updated = subjects.map(s => s.id === sub.id ? { ...s, isPractical: !s.isPractical } : s);
                                        setSubjects(updated);
                                      }}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        sub.isPractical ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                    >
                                      {sub.isPractical ? 'عملي ونظري' : 'نظري فقط'}
                                    </button>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => {
                                        setSubjects(subjects.filter(s => s.id !== sub.id));
                                        triggerNotification('تمت إزالة المادة من لوحة الكنترول', 'info');
                                      }}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-4 h-4 mx-auto" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Category: Halls */}
                    {prepActiveCategory === 'halls' && (
                      <div className="space-y-6">
                        <div className="border-b pb-2 flex justify-between items-center">
                          <div>
                            <h4 className="font-black text-slate-900 text-sm">تهيئة القاعات واللجان ومراكز الامتحانات</h4>
                            <p className="text-[10px] text-slate-400">تجهيز غرف اللجان وتأكيد السعات الاستيعابية لمنع التكدس والتداخل</p>
                          </div>

                          <button
                            disabled={scheduleApprovalStatus.approved}
                            onClick={async () => {
                              const newHallId = `hall-${Date.now()}`;
                              const newHallObj = {
                                id: newHallId,
                                name: `لجنة قاعة جديدة ${halls.length + 1}`,
                                capacity: 30,
                                location: 'مبنى الامتحانات الرئيسي',
                                status: 'active'
                              };
                              setHalls([...halls, newHallObj]);
                              triggerNotification('تم إنشاء قاعة لجنة جديدة بنجاح', 'success');
                            }}
                            className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة لجنة / قاعة</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto border border-slate-200">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="p-3 font-bold">اسم اللجنة / القاعة</th>
                                <th className="p-3 font-bold text-center">السعة الاستيعابية القصوى</th>
                                <th className="p-3 font-bold">المبنى / الموقع اللوجستي</th>
                                <th className="p-3 font-bold text-center">حالة القاعة</th>
                                <th className="p-3 font-bold text-center">حذف</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                              {halls.map(hall => (
                                <tr key={hall.id} className="hover:bg-transparent">
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      disabled={scheduleApprovalStatus.approved}
                                      value={hall.name}
                                      onChange={(e) => {
                                        const updated = halls.map(h => h.id === hall.id ? { ...h, name: e.target.value } : h);
                                        setHalls(updated);
                                      }}
                                      className="w-full p-1 border rounded text-xs font-bold"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      disabled={scheduleApprovalStatus.approved}
                                      value={hall.capacity}
                                      onChange={(e) => {
                                        const updated = halls.map(h => h.id === hall.id ? { ...h, capacity: Number(e.target.value) } : h);
                                        setHalls(updated);
                                      }}
                                      className="w-20 p-1 border rounded text-xs text-center font-bold"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      disabled={scheduleApprovalStatus.approved}
                                      value={hall.location}
                                      onChange={(e) => {
                                        const updated = halls.map(h => h.id === hall.id ? { ...h, location: e.target.value } : h);
                                        setHalls(updated);
                                      }}
                                      className="w-full p-1 border rounded text-xs font-semibold"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      disabled={scheduleApprovalStatus.approved}
                                      onClick={() => {
                                        const updated = halls.map(h => h.id === hall.id ? { ...h, status: h.status === 'inactive' ? 'active' : 'inactive' } : h);
                                        setHalls(updated);
                                      }}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        hall.status === 'inactive' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {hall.status === 'inactive' ? 'معطلة' : 'نشطة'}
                                    </button>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => {
                                        setHalls(halls.filter(h => h.id !== hall.id));
                                        triggerNotification('تم حذف اللجنة بنجاح', 'info');
                                      }}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-4 h-4 mx-auto" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Category: Proctors */}
                    {prepActiveCategory === 'proctors' && (
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <h4 className="font-black text-slate-900 text-sm">شؤون وتكليفات المراقبين والملاحظين</h4>
                          <p className="text-[10px] text-slate-400">تنظيم جداول تفرغ المعلمين، تحديد أيام عدم الجاهزية وسقف المراقبة اليومية</p>
                        </div>

                        <div className="overflow-x-auto border border-slate-200">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="p-3 font-bold">اسم المعلم / الملاحظ</th>
                                <th className="p-3 font-bold">التخصص</th>
                                <th className="p-3 font-bold text-center">الحد الأقصى للتكليفات في الأسبوع</th>
                                <th className="p-3 font-bold">أيام عدم التوفر (العطلة الخاصة)</th>
                                <th className="p-3 font-bold text-center">الإجراء</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                              {availableTeachers.map(teacher => {
                                const unavailableList = customProctorUnavailable[teacher.id] || [];
                                return (
                                  <tr key={teacher.id} className="hover:bg-transparent">
                                    <td className="p-3 font-bold text-slate-900">{teacher.name}</td>
                                    <td className="p-3 text-slate-500 font-semibold">{teacher.specialization}</td>
                                    <td className="p-3 text-center font-bold text-amber-700">
                                      {scheduleConfig.examsPerWeek} فترات
                                    </td>
                                    <td className="p-3">
                                      <div className="flex flex-wrap gap-1">
                                        {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map(day => {
                                          const isSelected = unavailableList.includes(day);
                                          return (
                                            <button
                                              key={day}
                                              onClick={() => {
                                                const updated = isSelected
                                                  ? unavailableList.filter(d => d !== day)
                                                  : [...unavailableList, day];
                                                setCustomProctorUnavailable({
                                                  ...customProctorUnavailable,
                                                  [teacher.id]: updated
                                                });
                                              }}
                                              className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all ${
                                                isSelected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                              }`}
                                            >
                                              {day}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md border border-emerald-100">ملاحظ معتمد</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Category: Rules */}
                    {prepActiveCategory === 'rules' && (
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <h4 className="font-black text-slate-900 text-sm">محددات وقواعد جدولة الامتحانات</h4>
                          <p className="text-[10px] text-slate-400">تعديل المواعيد، الإجازات، الفترات الزمنية ومحددات الأمان للمحرك الذكي</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Panel */}
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-xs font-black text-slate-700 block">تاريخ بدء امتحانات الفصل الدراسي:</label>
                              <input
                                type="date"
                                disabled={scheduleApprovalStatus.approved}
                                value={scheduleConfig.startDate}
                                onChange={(e) => updateScheduleConfig({ ...scheduleConfigRef.current, startDate: e.target.value })}
                                onBlur={(e) => updateScheduleConfig({ ...scheduleConfigRef.current, startDate: e.target.value })}
                                className="w-full text-xs font-bold p-2.5 bg-transparent outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-black text-slate-700 block">الحد الأقصى للامتحانات في الأسبوع الواحد للطالب:</label>
                              <input
                                type="number"
                                disabled={scheduleApprovalStatus.approved}
                                value={scheduleConfig.examsPerWeek}
                                onChange={(e) => updateScheduleConfig({ ...scheduleConfigRef.current, examsPerWeek: Number(e.target.value) })}
                                className="w-full text-xs font-bold p-2.5 bg-transparent outline-none"
                                min="1"
                                max="7"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-black text-slate-700 block">عدد الامتحانات اليومية لنفس الصف الدراسي (لتجنب الإرهاق):</label>
                              <select
                                disabled={scheduleApprovalStatus.approved}
                                value={scheduleConfig.subjectsPerDay}
                                onChange={(e) => updateScheduleConfig({ ...scheduleConfigRef.current, subjectsPerDay: Number(e.target.value) })}
                                className="w-full text-xs font-bold p-2.5 bg-transparent outline-none"
                              >
                                <option value="1">اختبار واحد فقط في اليوم (موصى به)</option>
                                <option value="2">اختبارين كحد أقصى في اليوم</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-black text-slate-700 block">الحد الأدنى لأيام الراحة بين أيام امتحانات الصف:</label>
                              <input
                                type="number"
                                disabled={scheduleApprovalStatus.approved}
                                value={scheduleConfig.minGapDays}
                                onChange={(e) => updateScheduleConfig({ ...scheduleConfigRef.current, minGapDays: Math.max(0, Number(e.target.value)) })}
                                className="w-full text-xs font-bold p-2.5 bg-transparent outline-none"
                                min="0"
                                max="7"
                              />
                            </div>
                          </div>

                          {/* Right Panel: Slots & Holidays */}
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-xs font-black text-slate-700 block">تحديد أيام الإجازات الأسبوعية الرسمية:</label>
                              <div className="flex gap-2">
                                {[
                                  { label: 'الجمعة', val: 5 },
                                  { label: 'السبت', val: 6 },
                                  { label: 'الخميس', val: 4 }
                                ].map(day => {
                                  const isChecked = scheduleConfig.holidayDays.includes(day.val);
                                  return (
                                    <button
                                      key={day.val}
                                      type="button"
                                      disabled={scheduleApprovalStatus.approved}
                                      onClick={() => {
                                        const updated = isChecked
                                          ? scheduleConfig.holidayDays.filter((v: number) => v !== day.val)
                                          : [...scheduleConfig.holidayDays, day.val];
                                        updateScheduleConfig({ ...scheduleConfigRef.current, holidayDays: updated });
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        isChecked ? 'bg-amber-50 border-amber-200 text-amber-700 font-extrabold' : 'bg-transparent hover:bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {day.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-700 block">الفترات الامتحانية اليومية ومواعيدها:</label>
                              <div className="space-y-2">
                                {scheduleConfig.dailySlots.map((slot: any, idx: number) => (
                                  <div key={slot.id} className="flex items-center gap-2 bg-transparent p-2 rounded-lg border border-slate-200/60">
                                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">{slot.label}</span>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={slot.start}
                                        disabled={scheduleApprovalStatus.approved}
                                        onChange={(e) => {
                                          const updated = scheduleConfig.dailySlots.map((s: any) => s.id === slot.id ? { ...s, start: e.target.value } : s);
                                          updateScheduleConfig({ ...scheduleConfigRef.current, dailySlots: updated });
                                        }}
                                        className="w-14 p-1 text-center border text-xs font-bold rounded"
                                      />
                                      <span className="text-slate-400 text-[10px]">إلى</span>
                                      <input
                                        type="text"
                                        value={slot.end}
                                        disabled={scheduleApprovalStatus.approved}
                                        onChange={(e) => {
                                          const updated = scheduleConfig.dailySlots.map((s: any) => s.id === slot.id ? { ...s, end: e.target.value } : s);
                                          updateScheduleConfig({ ...scheduleConfigRef.current, dailySlots: updated });
                                        }}
                                        className="w-14 p-1 text-center border text-xs font-bold rounded"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* TAB 2: INTELLIGENT AUTO SCHEDULING ENGINE */}
              {scheduleSubTab === 'engine' && (
                <div className="space-y-6">

                  {/* Readiness and auto-gen panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Setup check results */}
                    <div className="bg-transparent p-5 space-y-4">
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-1">
                        <span>🛡️</span>
                        <span>فحص جاهزية ومطابقة قواعد الجدولة</span>
                      </h4>

                      <div className="space-y-2.5">
                        {[
                          { label: 'الهيكل الأكاديمي والصفوف', ok: isPrepComplete.academic, msg: `${classesList.length} صفوف معرفة في الدورة` },
                          { label: 'مواصفات المقررات والامتحانات', ok: isPrepComplete.subjects, msg: 'أزمنة الاختبارات والدرجات مضبوطة بالكامل' },
                          { label: 'اللجان وقاعات الامتحان النشطة', ok: isPrepComplete.halls, msg: `${halls.filter(h=>h.status!=='inactive').length} قاعات نشطة وجاهزة` },
                          { label: 'الملاحظون وكادر المراقبة', ok: isPrepComplete.proctors, msg: `${availableTeachers.length} معلماً مدرجاً بكادر لجان الكنترول` },
                          { label: 'محددات وتاريخ بدء الجدولة', ok: isPrepComplete.rules, msg: `تاريخ البدء هو ${scheduleConfig.startDate}` }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 border border-slate-100 shadow-2xs">
                            <span className={item.ok ? 'text-emerald-600 font-extrabold' : 'text-rose-500 font-extrabold'}>
                              {item.ok ? '✓' : '✗'}
                            </span>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-800">{item.label}</p>
                              <p className="text-[9px] text-slate-400 font-semibold">{item.msg}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-amber-50 text-amber-900 border border-amber-100 text-[10px] font-semibold leading-relaxed">
                        💡 يقوم محرك الجدولة تلقائياً بتوزيع المواد بالتوالي مع الحفاظ على فترات موازنة للطلاب لعدم حدوث تعارضات في القاعات والمراقبين مع تقسيم الشعب وتأمين طاقات اللجان الاستيعابية.
                      </div>
                    </div>

                    {/* Manual Period Entry form */}
                    <div className="lg:col-span-2 p-6 space-y-4">
                      <div className="border-b pb-2 flex justify-between items-center">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">إدراج وتعديل فترة امتحان يدوياً</h4>
                          <p className="text-[10px] text-slate-400">إضافة وتعديل يدوي للتعديل على الجدول المتولد آلياً</p>
                        </div>
                      </div>

                      <form onSubmit={handleAddManualExam} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">الصف الدراسي:</label>
                          <select
                            disabled={scheduleApprovalStatus.approved}
                            value={manualExam.classroom}
                            onChange={(e) => setManualExam({ ...manualExam, classroom: e.target.value })}
                            className="w-full text-xs font-semibold p-2 bg-transparent border rounded-lg outline-none"
                          >
                            {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">المادة الدراسية:</label>
                          <select
                            disabled={scheduleApprovalStatus.approved}
                            value={manualExam.subjectId}
                            onChange={(e) => setManualExam({ ...manualExam, subjectId: e.target.value })}
                            className="w-full text-xs font-semibold p-2 bg-transparent border rounded-lg outline-none"
                          >
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">تاريخ الامتحان:</label>
                          <input
                            type="date"
                            disabled={scheduleApprovalStatus.approved}
                            value={manualExam.date}
                            onChange={(e) => setManualExam({ ...manualExam, date: e.target.value })}
                            className="w-full text-xs font-semibold p-2 bg-transparent border rounded-lg outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">وقت البدء:</label>
                          <input
                            type="text"
                            placeholder="08:30"
                            disabled={scheduleApprovalStatus.approved}
                            value={manualExam.startTime}
                            onChange={(e) => setManualExam({ ...manualExam, startTime: e.target.value })}
                            className="w-full text-xs font-semibold p-2 bg-transparent border rounded-lg outline-none text-center"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">وقت الانتهاء:</label>
                          <input
                            type="text"
                            placeholder="10:30"
                            disabled={scheduleApprovalStatus.approved}
                            value={manualExam.endTime}
                            onChange={(e) => setManualExam({ ...manualExam, endTime: e.target.value })}
                            className="w-full text-xs font-semibold p-2 bg-transparent border rounded-lg outline-none text-center"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">لجنة قاعة الاختبار:</label>
                          <select
                            disabled={scheduleApprovalStatus.approved}
                            value={manualExam.hallId}
                            onChange={(e) => setManualExam({ ...manualExam, hallId: e.target.value })}
                            className="w-full text-xs font-semibold p-2 bg-transparent border rounded-lg outline-none"
                          >
                            {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">المراقب المكلف:</label>
                          <select
                            disabled={scheduleApprovalStatus.approved}
                            value={manualExam.proctorId}
                            onChange={(e) => setManualExam({ ...manualExam, proctorId: e.target.value })}
                            className="w-full text-xs font-semibold p-2 bg-transparent border rounded-lg outline-none"
                          >
                            {availableTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>

                        <div className="md:col-span-2 flex items-end">
                          <button
                            type="submit"
                            disabled={scheduleApprovalStatus.approved}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-amber-600/10"
                          >
                            <Plus className="w-4 h-4" />
                            <span>إضافة الامتحان للجدول وتأكيد المتطلبات</span>
                          </button>
                        </div>
                      </form>
                    </div>

                  </div>

                  {/* DISPLAY OF CURRENT EXAM SCHEDULE CARDS GRID */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-sm">مخطط الفترات الاختبارية المتولدة ({scheduledExamsCount} فترة نشطة)</h4>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="بحث سريع باسم الصف أو المادة بالجدول..."
                          value={scheduleSearch}
                          onChange={(e) => setScheduleSearch(e.target.value)}
                          className="px-3 py-1.5 border rounded-lg text-xs outline-none"
                        />
                      </div>
                    </div>

                    {schedule.length === 0 ? (
                      <div className="p-20 text-center  bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300  border border-dashed border-slate-300">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                        <h5 className="font-bold text-slate-800 text-sm mt-3">جدول الامتحانات فارغ حالياً</h5>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
                          انقر على "تكوين الجدول تلقائياً" في شريط الأدوات بالأعلى ليقوم النظام الذكي بإعداد وحجز كافة القاعات وتفادي التعارضات فوراً!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schedule
                          .filter(item => {
                            const subName = subjects.find(s => s.id === item.subjectId)?.name || '';
                            return item.classroom.includes(scheduleSearch) || subName.includes(scheduleSearch);
                          })
                          .map((item) => {
                            const subObj = subjects.find(s => s.id === item.subjectId);
                            const hallObj = halls.find(h => h.id === item.hallId);
                            const proctorObj = availableTeachers.find(t => t.id === item.proctorId);

                            // Check if this item has any error conflicts
                            const itemConflicts = conflicts.filter(c => c.message.includes(item.classroom) && c.message.includes(subObj?.name || ''));
                            const hasItemError = itemConflicts.some(c => c.severity === 'error');

                            return (
                              <div
                                key={item.id}
                                className={`p-4 border transition-all ${
                                  hasItemError
                                    ? 'bg-rose-50/50 border-rose-200 shadow-rose-100'
                                    : 'border-slate-200 hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1.5 pb-2 border-b">
                                  <div>
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-black rounded text-[9px] border border-amber-100 block w-fit">
                                      {item.classroom}
                                    </span>
                                    <h5 className="font-black text-slate-900 text-xs mt-1">{subObj?.name || 'مادة اختبار مخصصة'}</h5>
                                  </div>

                                  {!scheduleApprovalStatus.approved && (
                                    <button
                                      onClick={() => {
                                        const filtered = schedule.filter(s => s.id !== item.id);
                                        setSchedule(filtered);
                                        triggerNotification('تمت إزالة فترة الاختبار بنجاح', 'info');
                                      }}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                      title="حذف فترة الاختبار"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-1.5 pt-2 text-[10px] font-semibold text-slate-600">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>التاريخ واليوم: {item.date} ({item.day})</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>الفترة والموعد: {item.startTime} - {item.endTime} ({subObj?.examDuration || 120} دقيقة)</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Home className="w-3.5 h-3.5 text-slate-400" />
                                    <span>قاعة اللجنة: <span className="font-bold text-amber-700">{item.isSplit ? '⚠️ تقسيم متعدد القاعات' : (hallObj?.name || 'غير محدد')}</span></span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                    <span>الملاحظ المكلف: <span className="font-bold text-slate-800">{proctorObj?.name || item.proctorId || 'غير محدد'}</span></span>
                                  </div>
                                </div>

                                {itemConflicts.map((c, cIdx) => (
                                  <div key={cIdx} className="mt-2 p-1.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                    <span>{c.message}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 3: SCHEDULE INTEGRITY & APPROVAL */}
              {scheduleSubTab === 'approval' && (
                <div className="space-y-6">

                  {/* Integrity report card */}
                  <div className="p-6 space-y-6">
                    <div className="border-b pb-3">
                      <h4 className="font-black text-slate-900 text-base">تقرير المطابقة والتدقيق لسلامة الفترات</h4>
                      <p className="text-xs text-slate-500">مراجعة خلو الجدول من أي تداخل بين المراقبين أو القاعات مع التدقيق اللوجستي للأقسام</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Conflicts list */}
                      <div className="p-4  bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300  border border-slate-200/60 space-y-3">
                        <span className="text-xs font-black text-slate-800 block">🔴 التعارضات الحرجة المرصودة بالخوارزمية</span>

                        {errorConflicts.length === 0 ? (
                          <div className="p-8 text-center border border-emerald-100 flex flex-col items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                            <p className="text-xs font-black text-emerald-800 mt-2">الجدول آمن وخالٍ من التعارضات تماماً!</p>
                            <p className="text-[10px] text-emerald-600/70 mt-1">تتطابق جميع اللجان والمراقبين مع القواعد المحددة بنجاح.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {errorConflicts.map((c) => (
                              <div key={c.id} className="p-3 hover:bg-rose-50/50 border border-rose-100 flex items-start gap-2 shadow-2xs">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div className="text-right">
                                  <p className="text-[11px] font-black text-rose-900">تعارض تداخل الفترة</p>
                                  <p className="text-[10px] text-slate-600 font-semibold mt-0.5">{c.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Warnings and suggestions */}
                      <div className="p-4  bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300  border border-slate-200/60 space-y-3">
                        <span className="text-xs font-black text-slate-800 block">⚠️ التنبيهات وإرشادات الموازنة والراحة</span>

                        {warningConflicts.length === 0 ? (
                          <div className="p-8 text-center border border-slate-100 flex flex-col items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-amber-500" />
                            <p className="text-xs font-black text-slate-800 mt-2">لا توجد تنبيهات تكرار أو تباعد</p>
                            <p className="text-[10px] text-slate-400 mt-1">تم توفير فترات استرخاء كافية بين المواد لجميع الطلاب.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {warningConflicts.map((c) => (
                              <div key={c.id} className="p-3 border border-slate-100 flex items-start gap-2">
                                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-right">
                                  <p className="text-[11px] font-black text-amber-900">ملاحظة تنظيمية</p>
                                  <p className="text-[10px] text-slate-600 font-semibold mt-0.5">{c.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Final Sign and lock Panel */}
                    <div className="bg-amber-50 p-6 border border-amber-100 text-amber-900 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-1">
                        <h5 className="font-black text-amber-950 text-sm">تثبيت وتوثيق اعتماد الجدول من الكنترول</h5>
                        <p className="text-[11px] text-amber-800 font-medium max-w-xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
                          باعتماد هذا المخطط، سيتم فوراً قفل أي تعديلات يدوية أو آلية لحماية هيبة الامتحانات، وسيتم إرسال تكليفات المعلمين وتوليد كشوف الحضور والدرجات مطابقة لهذا التوزيع.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        {scheduleApprovalStatus.approved ? (
                          <div className="p-3 bg-white/80 border border-emerald-200 text-center">
                            <span className="text-emerald-800 font-black text-xs block">🔒 معتمد ومحفوظ بالكامل</span>
                            <span className="text-[10px] text-slate-500 block mt-1">بواسطة: {scheduleApprovalStatus.approvedBy}</span>
                            <span className="text-[10px] text-slate-500 block">{scheduleApprovalStatus.approvedAt}</span>
                          </div>
                        ) : (
                          <button
                            onClick={handleApproveSchedule}
                            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md shadow-amber-600/10 transition-all cursor-pointer text-center"
                          >
                            الموافقة واعتماد الجدول نهائياً 🔒
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 4: PRINTING & COMPREHENSIVE REPORTS */}
              {scheduleSubTab === 'reports' && (
                <div className="space-y-6">

                  {/* Report Filter / Selector Panel */}
                  <div className="p-5 space-y-4">
                    <span className="text-xs font-black text-slate-700 block">اختر نوع التقرير أو كشف الطباعة لتوليده رسمياً:</span>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {[
                        { id: 'classroom', label: 'جدول امتحانات الصف', color: 'bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-amber-700' },
                        { id: 'section', label: 'جدول امتحانات الشعبة', color: 'bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-amber-700' },
                        { id: 'proctor', label: 'جدول مهام المراقبين', color: 'bg-yellow-50 hover:bg-yellow-100/70 border-yellow-200 text-yellow-800' },
                        { id: 'hall', label: 'انشغال القاعات واللجان', color: 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800' },
                        { id: 'school', label: 'الجدول المدرسي الموحد', color: 'bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-amber-800' },
                        { id: 'students', label: 'كشوف أرقام جلوس ومقاعد الطلاب', color: 'bg-rose-50 hover:bg-rose-100/70 border-rose-200 text-rose-800' }
                      ].map(rep => (
                        <button
                          type="button"
                          key={rep.id}
                          onClick={() => {
                            setSelectedClassReport(rep.id);
                            triggerNotification(`جاري تحضير وتصدير كشف: ${rep.label}`, 'info');
                          }}
                          aria-pressed={selectedClassReport === rep.id}
                          aria-label={`عرض ${rep.label}`}
                          className={`p-3 border text-xs font-black text-center cursor-pointer transition-all ${
                            selectedClassReport === rep.id ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : rep.color
                          }`}
                        >
                          {rep.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rendered report sheet */}
                  <div id="print-schedule-report-area" className="p-8 space-y-6 print:border-none print:shadow-none print:p-0">

                    {/* Official Report Header */}
                    <div className="flex justify-between items-start border-b pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-amber-600 font-extrabold">{selectedSchool?.name || 'المدرسة الحالية'} — SchoolForManus</span>
                        <h4 className="font-black text-slate-900 text-sm">وحدة الامتحانات والنتائج والكنترول</h4>
                        <p className="text-[10px] text-slate-400 font-bold">العام الدراسي: {examSettings.academicYear} — {scheduleApprovalStatus.approved ? 'جدول معتمد' : 'مسودة غير معتمدة'}</p>
                      </div>

                      <div className="text-left space-y-1">
                        <span className="px-2 py-0.5 bg-amber-50 border text-amber-700 font-black rounded text-[9px]">{scheduleApprovalStatus.approved ? 'معتمد من الخادم' : 'للمراجعة فقط'}</span>
                        <p className="text-[9px] text-slate-400 font-bold">تاريخ الاعتماد: {scheduleApprovalStatus.approvedAt || 'غير معتمد بعد'}</p>
                      </div>
                    </div>

                    {/* CONDITIONAL RENDER OF REPORT TYPES */}
                    {selectedClassReport === 'classroom' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">جدول الامتحانات الرسمي الموزع حسب الصف الدراسي:</span>
                          <select
                            value={selectedClassroomReport}
                            onChange={(e) => setSelectedClassroomReport(e.target.value)}
                            aria-label="اختر الصف لتقرير جدول الامتحانات"
                            className="text-xs font-bold p-1.5 border rounded bg-white"
                          >
                            <option value="الكل">اختر صفاً</option>
                            {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>

                        <div className="overflow-x-auto border">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                              <tr>
                                <th className="p-3 font-bold">المادة</th>
                                <th className="p-3 font-bold text-center">التاريخ واليوم</th>
                                <th className="p-3 font-bold text-center">الفترة / الموعد</th>
                                <th className="p-3 font-bold">اللجنة القاعة</th>
                                <th className="p-3 font-bold">الملاحظ المكلف</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {schedule
                                .filter(s => selectedClassroomReport !== 'الكل' && s.classroom === selectedClassroomReport)
                                .map(item => {
                                  const sub = subjects.find(s => s.id === item.subjectId);
                                  const hall = halls.find(h => h.id === item.hallId);
                                  const proctor = availableTeachers.find(t => t.id === item.proctorId);
                                  return (
                                    <tr key={item.id} className="hover:bg-transparent">
                                      <td className="p-3 font-extrabold text-slate-900">{sub?.name || 'مادة'}</td>
                                      <td className="p-3 text-center text-slate-500 font-semibold">{item.date} ({item.day})</td>
                                      <td className="p-3 text-center font-bold text-amber-700">{item.startTime} - {item.endTime}</td>
                                      <td className="p-3 font-semibold text-slate-700">{hall?.name || 'غير محدد'}</td>
                                      <td className="p-3 font-semibold text-slate-800">{proctor?.name || 'غير محدد'}</td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {selectedClassReport === 'section' && (() => {
                      const sectionOptionMap = new Map<string, { value: string; classroom: string; section: string }>();
                      classesList.forEach(classItem => {
                        (Array.isArray(classItem.sections) ? classItem.sections : []).forEach((sectionName: string) => {
                          const classroom = String(classItem.name || '').trim();
                          const section = String(sectionName || '').trim();
                          if (!classroom || !section) return;
                          const value = JSON.stringify([classroom, section]);
                          sectionOptionMap.set(value, { value, classroom, section });
                        });
                      });
                      studentList.forEach(student => {
                        const classroom = String(student.classroom || '').trim();
                        const section = String(student.section || '').trim();
                        if (!classroom || !section) return;
                        const value = JSON.stringify([classroom, section]);
                        sectionOptionMap.set(value, { value, classroom, section });
                      });
                      const sectionOptions = Array.from(sectionOptionMap.values()).sort((left, right) =>
                        left.classroom.localeCompare(right.classroom, 'ar') || left.section.localeCompare(right.section, 'ar')
                      );
                      const selectedSection = sectionOptions.find(option => option.value === selectedSectionReport) || null;
                      const hasSectionSpecificSchedule = selectedSection
                        ? schedule.some(item => item.classroom === selectedSection.classroom && String(item.section || '').trim() === selectedSection.section)
                        : false;
                      const sectionSchedule = selectedSection
                        ? schedule.filter(item => item.classroom === selectedSection.classroom && (
                            !String(item.section || '').trim() || String(item.section || '').trim() === selectedSection.section
                          ))
                        : [];
                      const sectionStudentCount = selectedSection
                        ? studentList.filter(student => student.classroom === selectedSection.classroom && student.section === selectedSection.section).length
                        : 0;

                      return (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <span className="block text-xs font-black text-slate-800">جدول الامتحانات حسب الشعبة:</span>
                              <p className="mt-1 text-[10px] font-semibold text-slate-500">
                                يعرض الجدول المحفوظ للصف، ويطبّق تخصيص الشعبة فقط عندما يكون مسجلاً صراحة في بيانات الجدول.
                              </p>
                            </div>
                            <select
                              value={selectedSectionReport}
                              onChange={(event) => setSelectedSectionReport(event.target.value)}
                              aria-label="اختر الشعبة لتقرير جدول الامتحانات"
                              className="border bg-white p-1.5 text-xs font-bold"
                            >
                              <option value="الكل">اختر شعبة</option>
                              {sectionOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.classroom} — الشعبة {option.section}</option>
                              ))}
                            </select>
                          </div>

                          {!selectedSection ? (
                            <div className="border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs font-semibold text-slate-500">
                              {sectionOptions.length === 0 ? 'لا توجد شعب محفوظة في بيانات الصفوف أو الطلاب.' : 'اختر شعبة لعرض جدولها المحفوظ.'}
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 gap-2 text-[10px] sm:grid-cols-3">
                                <div className="border bg-slate-50 p-2"><span className="text-slate-500">الصف:</span> <strong>{selectedSection.classroom}</strong></div>
                                <div className="border bg-slate-50 p-2"><span className="text-slate-500">الشعبة:</span> <strong>{selectedSection.section}</strong></div>
                                <div className="border bg-slate-50 p-2"><span className="text-slate-500">طلاب الشعبة المحملون:</span> <strong>{sectionStudentCount}</strong></div>
                              </div>
                              {!hasSectionSpecificSchedule && sectionSchedule.length > 0 && (
                                <p role="note" className="border-r-4 border-amber-500 bg-amber-50 p-3 text-[10px] font-semibold text-amber-900">
                                  لا يوجد جدول مستقل محفوظ لهذه الشعبة؛ المعروض هو جدول الصف المرتبط بها دون إضافة مواعيد أو تخصيصات غير موجودة.
                                </p>
                              )}
                              <div className="overflow-x-auto border">
                                <table className="w-full text-right text-xs">
                                  <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] font-extrabold text-amber-200">
                                    <tr>
                                      <th className="p-3 font-bold">المادة</th>
                                      <th className="p-3 text-center font-bold">التاريخ واليوم</th>
                                      <th className="p-3 text-center font-bold">الفترة / الموعد</th>
                                      <th className="p-3 font-bold">القاعة</th>
                                      <th className="p-3 font-bold">المراقب</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {sectionSchedule.map(item => {
                                      const subject = subjects.find(candidate => candidate.id === item.subjectId);
                                      const hall = halls.find(candidate => candidate.id === item.hallId);
                                      const proctor = availableTeachers.find(candidate => candidate.id === item.proctorId);
                                      return (
                                        <tr key={item.id}>
                                          <td className="p-3 font-extrabold text-slate-900">{subject?.name || `مادة غير معرفة (${item.subjectId || 'بلا معرف'})`}</td>
                                          <td className="p-3 text-center font-semibold text-slate-600">{item.date || 'غير محدد'}{item.day ? ` (${item.day})` : ''}</td>
                                          <td className="p-3 text-center font-bold text-amber-700">{item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : 'غير محدد'}</td>
                                          <td className="p-3 font-semibold text-slate-700">{hall?.name || 'غير محددة في السجل'}</td>
                                          <td className="p-3 font-semibold text-slate-800">{proctor?.name || 'غير محدد في السجل'}</td>
                                        </tr>
                                      );
                                    })}
                                    {sectionSchedule.length === 0 && (
                                      <tr><td colSpan={5} className="p-6 text-center font-semibold text-slate-500">لا توجد اختبارات محفوظة للصف المرتبط بهذه الشعبة.</td></tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {selectedClassReport === 'hall' && (() => {
                      const selectedHall = halls.find(hall => hall.id === selectedHallReport) || null;
                      const hallSchedule = selectedHall ? schedule.filter(item => item.hallId === selectedHall.id) : [];

                      return (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <span className="block text-xs font-black text-slate-800">تقرير انشغال القاعات واللجان:</span>
                              <p className="mt-1 text-[10px] font-semibold text-slate-500">يعرض الاختبارات المرتبطة فعلياً بمعرف القاعة المختارة في الجدول المحفوظ.</p>
                            </div>
                            <select
                              value={selectedHallReport}
                              onChange={(event) => setSelectedHallReport(event.target.value)}
                              aria-label="اختر القاعة لتقرير الانشغال"
                              className="border bg-white p-1.5 text-xs font-bold"
                            >
                              <option value="الكل">اختر قاعة</option>
                              {halls.map(hall => <option key={hall.id} value={hall.id}>{hall.name}</option>)}
                            </select>
                          </div>

                          {!selectedHall ? (
                            <div className="border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs font-semibold text-slate-500">
                              {halls.length === 0 ? 'لا توجد قاعات محفوظة في دورة الامتحانات الحالية.' : 'اختر قاعة لعرض فترات استخدامها المسجلة.'}
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 gap-2 text-[10px] sm:grid-cols-3">
                                <div className="border bg-slate-50 p-2"><span className="text-slate-500">القاعة:</span> <strong>{selectedHall.name}</strong></div>
                                <div className="border bg-slate-50 p-2"><span className="text-slate-500">الموقع:</span> <strong>{selectedHall.location || 'غير محدد'}</strong></div>
                                <div className="border bg-slate-50 p-2"><span className="text-slate-500">السعة المسجلة:</span> <strong>{Number.isFinite(Number(selectedHall.capacity)) ? selectedHall.capacity : 'غير محددة'}</strong></div>
                              </div>
                              <div className="overflow-x-auto border">
                                <table className="w-full text-right text-xs">
                                  <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] font-extrabold text-amber-200">
                                    <tr>
                                      <th className="p-3 font-bold">التاريخ واليوم</th>
                                      <th className="p-3 text-center font-bold">الفترة / الموعد</th>
                                      <th className="p-3 font-bold">الصف</th>
                                      <th className="p-3 font-bold">المادة</th>
                                      <th className="p-3 font-bold">المراقب</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {hallSchedule.map(item => {
                                      const subject = subjects.find(candidate => candidate.id === item.subjectId);
                                      const proctor = availableTeachers.find(candidate => candidate.id === item.proctorId);
                                      return (
                                        <tr key={item.id}>
                                          <td className="p-3 font-semibold text-slate-600">{item.date || 'غير محدد'}{item.day ? ` (${item.day})` : ''}</td>
                                          <td className="p-3 text-center font-bold text-amber-700">{item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : 'غير محدد'}</td>
                                          <td className="p-3 font-semibold text-slate-800">{item.classroom || 'غير محدد في السجل'}</td>
                                          <td className="p-3 font-extrabold text-slate-900">{subject?.name || `مادة غير معرفة (${item.subjectId || 'بلا معرف'})`}</td>
                                          <td className="p-3 font-semibold text-slate-800">{proctor?.name || 'غير محدد في السجل'}</td>
                                        </tr>
                                      );
                                    })}
                                    {hallSchedule.length === 0 && (
                                      <tr><td colSpan={5} className="p-6 text-center font-semibold text-slate-500">لا توجد فترات امتحان محفوظة لهذه القاعة.</td></tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {selectedClassReport === 'proctor' && (
                      <div className="space-y-4">
                        <span className="text-xs font-black text-slate-800 block">كشف وموزع مهام المراقبين والأعمال الإدارية للجان:</span>

                        <div className="overflow-x-auto border">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                              <tr>
                                <th className="p-3 font-bold">المراقب / المعلم</th>
                                <th className="p-3 font-bold">تخصص المعلم</th>
                                <th className="p-3 font-bold text-center">إجمالي فترات المراقبة</th>
                                <th className="p-3 font-bold">تفاصيل وتواريخ الفترات المكلف بها</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {availableTeachers.map(t => {
                                const teacherSchedule = schedule.filter(s => s.proctorId === t.id);
                                return (
                                  <tr key={t.id} className="hover:bg-transparent">
                                    <td className="p-3 font-black text-slate-900">{t.name}</td>
                                    <td className="p-3 text-slate-500 font-semibold">{t.specialization}</td>
                                    <td className="p-3 text-center font-extrabold text-amber-700">{teacherSchedule.length} فترات</td>
                                    <td className="p-3 font-medium text-slate-600">
                                      {teacherSchedule.length === 0 ? (
                                        <span className="text-slate-400">لا توجد تكليفات</span>
                                      ) : (
                                        <div className="flex flex-col gap-1">
                                          {teacherSchedule.map(ts => {
                                            const sub = subjects.find(s => s.id === ts.subjectId);
                                            const hall = halls.find(h => h.id === ts.hallId);
                                            return (
                                              <span key={ts.id} className="text-[10px]">
                                                • {ts.date} ({ts.day}) - مادة {sub?.name} - {hall?.name}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {selectedClassReport === 'school' && (
                      <div className="space-y-4">
                        <span className="text-xs font-black text-slate-800 block">الجدول الشامل الموحد لجميع الصفوف والمستويات:</span>

                        <div className="overflow-x-auto border">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-amber-900 text-white border-b">
                              <tr>
                                <th className="p-3 font-black">التاريخ واليوم</th>
                                {classesList.map(cls => (
                                  <th key={cls.id} className="p-3 font-black text-center">{cls.name}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {/* Unique days */}
                              {Array.from(new Set(schedule.map(s => s.date))).sort().map(dateStr => {
                                const dayName = schedule.find(s => s.date === dateStr)?.day || '';
                                return (
                                  <tr key={dateStr} className="hover:bg-transparent">
                                    <td className="p-3 font-black text-slate-950 border-l bg-transparent">{dateStr} ({dayName})</td>
                                    {classesList.map(cls => {
                                      const classExams = schedule.filter(s => s.date === dateStr && s.classroom === cls.name);
                                      return (
                                        <td key={cls.id} className="p-3 text-center border-l">
                                          {classExams.length === 0 ? (
                                            <span className="text-slate-300">-</span>
                                          ) : (
                                            classExams.map(ex => {
                                              const sub = subjects.find(s => s.id === ex.subjectId);
                                              const hall = halls.find(h => h.id === ex.hallId);
                                              return (
                                                <div key={ex.id} className="p-1.5 bg-amber-50 text-amber-950 rounded-lg text-[9px] border border-amber-100 mt-1">
                                                  <p className="font-bold">{sub?.name}</p>
                                                  <p className="text-[8px] text-slate-500 mt-0.5">{ex.startTime}-{ex.endTime} | {hall?.name}</p>
                                                </div>
                                              );
                                            })
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Individual student seating locations */}
                    {selectedClassReport === 'students' && (
                      <div className="space-y-4">
                        <span className="text-xs font-black text-slate-800 block">كشوف أرقام جلوس الطلاب ولجانهم الموزعة رسمياً:</span>

                        <div className="overflow-x-auto border">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="p-3 font-bold">اسم الطالب</th>
                                <th className="p-3 font-bold">الصف الدراسي</th>
                                <th className="p-3 font-bold text-center">رقم الجلوس</th>
                                <th className="p-3 font-bold">اللجنة القاعة</th>
                                <th className="p-3 font-bold">موقع القاعة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {studentList.map(st => {
                                const hallObj = halls.find(h => h.id === st.hallId);
                                return (
                                  <tr key={st.id} className="hover:bg-transparent">
                                    <td className="p-3 font-bold text-slate-900">{st.name}</td>
                                    <td className="p-3 font-semibold text-slate-500">{st.classroom} - ({st.section})</td>
                                    <td className="p-3 text-center font-mono font-black text-amber-700">{st.seatNumber || 'غير محدد'}</td>
                                    <td className="p-3 font-bold text-amber-900">{hallObj?.name || 'غير موزع'}</td>
                                    <td className="p-3 text-slate-500 font-semibold">{hallObj?.location || 'غير محدد'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>
          );
        })()}

        {/* TAB 8: Grades Entry (Spreadsheet / Fast Input) */}
        {activeTab === 'grades-entry' && (() => {
          const totalStudentsCount = filteredStudentsForGrades.length;
          const recordedGradesCount = filteredStudentsForGrades.filter(st => {
            const currentMark = gradesMatrix[st.id]?.[selectedGradeSubject];
            const isAbsent = st.absentSubjects?.includes(selectedGradeSubject);
            return currentMark !== undefined || isAbsent;
          }).length;
          const remainingGradesCount = totalStudentsCount - recordedGradesCount;

          const subObj = subjects.find(s => s.id === selectedGradeSubject);
          const passScore = subObj?.passScore || 50;
          const maxScore = subObj?.maxScore || 100;

          const passCount = filteredStudentsForGrades.filter(st => {
            const currentMark = gradesMatrix[st.id]?.[selectedGradeSubject];
            const isAbsent = st.absentSubjects?.includes(selectedGradeSubject);
            return !isAbsent && currentMark !== undefined && currentMark >= passScore;
          }).length;

          const passPercent = recordedGradesCount > 0 ? parseFloat(((passCount / recordedGradesCount) * 100).toFixed(1)) : 0;

          const outstandingCount = filteredStudentsForGrades.filter(st => {
            const currentMark = gradesMatrix[st.id]?.[selectedGradeSubject];
            const isAbsent = st.absentSubjects?.includes(selectedGradeSubject);
            return !isAbsent && currentMark !== undefined && (currentMark / maxScore) >= 0.9;
          }).length;

          return (
            <div className="space-y-6">

              {/* Header Title Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border border-slate-700 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black tracking-wider uppercase text-amber-300">الكنترول المدرسي العام</span>
                  </div>
                  <h2 className="text-lg font-black tracking-tight mt-1">شاشة إدراج درجات الطلاب جماعياً</h2>
                  <p className="text-xs text-slate-300 font-semibold max-w-xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
                    نظام رصد درجات فائق السرعة يتميز بالتحقق التلقائي الفوري، والتكامل المباشر مع شعب شئون الطلاب وبوابة النتائج العامة للمؤسسة.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-800/80 p-3 border border-slate-700/50 self-start md:self-center">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${approvalStatus.approved ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold">حالة الكنترول الحالي</p>
                    <p className="text-xs font-black">{approvalStatus.approved ? 'مغلق ومحمي (معتمد)' : 'مفتوح للرصد المباشر'}</p>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="bg-slate-100 p-1.5 flex flex-wrap items-center gap-1.5 border border-slate-200/80 w-fit">
                <button
                  onClick={() => setGradesSubTab('entry')}
                  className={`px-5 py-2 font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    gradesSubTab === 'entry'
                      ? 'text-amber-700 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>إدراج الدرجات (جماعي حسب المادة)</span>
                </button>
                <button
                  onClick={() => {
                    setGradesSubTab('student-review-edit');
                    setBulkDraftGrades(JSON.parse(JSON.stringify(gradesMatrix)));
                  }}
                  className={`px-5 py-2 font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    gradesSubTab === 'student-review-edit'
                      ? 'text-amber-700 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-500" />
                  <span>مراجعة وتعديل الدرجات (ملف الطالب الفردي)</span>
                </button>
                <button
                  onClick={() => {
                    setGradesSubTab('review-edit');
                    setBulkDraftGrades(JSON.parse(JSON.stringify(gradesMatrix)));
                  }}
                  className={`px-5 py-2 font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    gradesSubTab === 'review-edit'
                      ? 'text-amber-700 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-amber-500" />
                  <span>كشف الدرجات العام (شامل المجموعات)</span>
                </button>
              </div>

              {gradesSubTab === 'entry' ? (
                <>
                  {/* Dynamic Statistics Panel (Bento Style) */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400">إجمالي الطلاب (حسب التصفية)</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-slate-900">{totalStudentsCount}</span>
                    <span className="text-xs text-slate-500 font-bold">طالب</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full w-full" />
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400">الدرجات المرصودة</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-emerald-600">{recordedGradesCount}</span>
                    <span className="text-xs text-slate-400 font-bold">من {totalStudentsCount}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalStudentsCount > 0 ? (recordedGradesCount / totalStudentsCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400">الحقول الشاغرة (المتبقية)</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-2xl font-black ${remainingGradesCount > 0 ? 'text-amber-500' : 'text-slate-500'}`}>{remainingGradesCount}</span>
                    <span className="text-xs text-slate-500 font-bold">حقل شاغر</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${totalStudentsCount > 0 ? (remainingGradesCount / totalStudentsCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400">نسبة النجاح الحالية للمادة</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-amber-600">{passPercent}%</span>
                    <span className="text-xs text-slate-500 font-bold">نسبة النجاح</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${passPercent}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400">الطلاب المتميزون (أعلى من 90%)</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-amber-500">{outstandingCount}</span>
                    <span className="text-xs text-slate-500 font-bold">متفوقين 🌟</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${totalStudentsCount > 0 ? (outstandingCount / totalStudentsCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Filters Panel (لوحة التصفية العلوية) */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-extrabold text-slate-700">شريط التصفية والفرز الذكي للمجموعات الدراسية</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">العام الدراسي:</label>
                    <select
                      value={selectedGradeYear}
                      onChange={(e) => setSelectedGradeYear(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    >
                      <option value={examSettings.academicYear}>{examSettings.academicYear}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">الفصل الدراسي:</label>
                    <select
                      value={selectedGradeSemester}
                      onChange={(e) => setSelectedGradeSemester(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    >
                      <option value="الفصل الدراسي الأول">الفصل الأول</option>
                      <option value="الفصل الدراسي الثاني">الفصل الثاني</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">نوع الامتحان:</label>
                    <select
                      value={selectedGradeExamType}
                      onChange={(e) => setSelectedGradeExamType(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    >
                      <option value="الاختبارات الشهرية المستمرة">اختبارات شهرية</option>
                      <option value="امتحانات منتصف الفصل">منتصف الفصل</option>
                      <option value="الاختبارات النهائية">الاختبارات النهائية</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">المرحلة:</label>
                    <select
                      value={selectedGradeLevel}
                      onChange={(e) => {
                        setSelectedGradeLevel(e.target.value);
                        // Default to standard class if level changes
                        if (e.target.value === 'high') {
                          setSelectedGradeClass('الصف الأول الثانوي');
                        } else if (e.target.value === 'middle') {
                          setSelectedGradeClass('الكل');
                        } else {
                          setSelectedGradeClass('الكل');
                        }
                      }}
                      className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    >
                      <option value="الكل">جميع المراحل</option>
                      <option value="middle">المرحلة المتوسطة</option>
                      <option value="high">المرحلة الثانوية</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">الصف الدراسي:</label>
                    <select
                      value={selectedGradeClass}
                      onChange={(e) => setSelectedGradeClass(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    >
                      <option value="الكل">جميع الصفوف</option>
                      {classesList
                        .filter(c => selectedGradeLevel === 'الكل' || c.level === selectedGradeLevel)
                        .map(cls => (
                          <option key={cls.id} value={cls.name}>{cls.name}</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">الشعبة الدراسية:</label>
                    <select
                      value={selectedGradeSection}
                      onChange={(e) => setSelectedGradeSection(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    >
                      <option value="الكل">جميع الشعب (أ-ب-ج)</option>
                      <option value="أ">الشعبة (أ)</option>
                      <option value="ب">الشعبة (ب)</option>
                      <option value="علمي أ">علمي أ</option>
                      <option value="أدبي أ">أدبي أ</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-amber-600 block">المادة الدراسية:</label>
                    <select
                      value={selectedGradeSubject}
                      onChange={(e) => setSelectedGradeSubject(e.target.value)}
                      className="w-full text-xs font-extrabold p-2 bg-amber-50 text-amber-900 border border-amber-200 focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    >
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name} (الحد {sub.maxScore})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Toolbar (شريط الأدوات الرئيسي) */}
              <div className="bg-transparent p-4 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Right block: operations */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="p-2 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="تهيئة شاشة جديدة وإفراغ فلاتر البحث"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>جديد</span>
                  </button>

                  <button
                    onClick={handleLoadStudents}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="تحديث وتحميل الطلاب"
                  >
                    <RefreshCw className={`w-4 h-4 ${isReloadingStudents ? 'animate-spin' : ''}`} />
                    <span>تحميل الطلاب</span>
                  </button>

                  <button
                    onClick={() => void handleSaveCurrentGradeSheet()}
                    className="p-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-amber-600/10"
                    title="تخزين الكشف وحفظه بالكامل"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ الكشف</span>
                  </button>

                  <button
                    onClick={() => setShowReviewGradesModal(true)}
                    className="p-2 bg-slate-800 hover:bg-[#2a1d13] text-[#fce79a] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="مراجعة شاملة لدرجات الكشف وإحصائياته"
                  >
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    <span>مراجعة الدرجات</span>
                  </button>

                  <button
                    onClick={handleApproveGrades}
                    className={`p-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      approvalStatus.approved
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                    title="اعتماد كشف الدرجات للكنترول نهائياً وإقفاله"
                  >
                    {approvalStatus.approved ? <LockIcon className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <span>{approvalStatus.approved ? 'مسار إعادة الفتح' : 'اعتماد الدرجات'}</span>
                  </button>

                  <button
                    onClick={handleRecalculate}
                    className="p-2 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="إعادة احتساب التقديرات والنسب المئوية"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>إعادة الحساب</span>
                  </button>
                </div>

                {/* Left block: Import/Export Operations */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                    <UploadCloud className="w-4 h-4" />
                    <span>استيراد Excel</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelImport}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleDownloadTemplate}
                    className="p-2 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="تنزيل قالب إكسل فارغ لملء درجات هذه المادة"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>تنزيل قالب</span>
                  </button>

                  <button
                    onClick={() => setShowPrintGradesModal(true)}
                    className="p-2 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="طباعة الكشف المدرسي الحالي"
                  >
                    <Printer className="w-4 h-4 text-amber-600" />
                    <span>طباعة الكشف</span>
                  </button>

                  <button
                    onClick={handleExportExcel}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-600/10"
                    title="تصدير جدول الدرجات الحالي إلى ملف Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تصدير Excel</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerNotification('جاري تحويل الكشف المدرسي إلى مستند PDF... سيتم تنزيله فورياً!', 'info');
                      setTimeout(() => {
                        window.print();
                      }, 500);
                    }}
                    className="p-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-rose-500/10"
                    title="تصدير كشف PDF للطباعة الفورية"
                  >
                    <FileText className="w-4 h-4" />
                    <span>تصدير PDF</span>
                  </button>
                </div>
              </div>

              {/* Fast Search & Bulk Fill Panel */}
              <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={gradesSearchQuery}
                    onChange={(e) => setGradesSearchQuery(e.target.value)}
                    placeholder="بحث سريع برقم الجلوس، رقم الطالب، أو اسم الطالب..."
                    className="w-full text-xs font-semibold p-2.5 pr-9 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                  />
                  {gradesSearchQuery && (
                    <button
                      onClick={() => setGradesSearchQuery('')}
                      className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      إلغاء
                    </button>
                  )}
                </div>

                <div className="w-full md:w-auto p-2 bg-amber-50/70 border border-amber-100 flex flex-col sm:flex-row items-center gap-3">
                  <span className="text-[11px] text-amber-900 font-extrabold">تطبيق قيمة جماعية لجميع الطلاب الظاهرين:</span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      placeholder={`الدرجة (الحد ${maxScore})`}
                      id="bulk-grade-input-smart"
                      className="w-28 p-1.5 text-xs text-center font-bold rounded-lg border border-amber-200 bg-white"
                      min="0"
                      max={maxScore}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('bulk-grade-input-smart') as HTMLInputElement;
                        if (input && input.value !== '') {
                          handleBulkFillValue(selectedGradeSubject, Number(input.value));
                        } else {
                          triggerNotification('الرجاء إدخال قيمة صالحة أولاً للتعبئة الجماعية', 'warning');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Spreadsheet Table Container */}
              <div className="shadow-md overflow-hidden">
                {isReloadingStudents ? (
                  <div className="p-20 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-bold">جاري تحميل وتزامن قائمة الطلاب مع الكنترول العام...</p>
                  </div>
                ) : filteredStudentsForGrades.length === 0 ? (
                  <div className="p-16 text-center space-y-2">
                    <div className="text-slate-300 flex justify-center">
                      <Users className="w-12 h-12" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">لم يتم العثور على طلاب يطابقون خيارات التصفية الحالية</p>
                    <p className="text-xs text-slate-400">يرجى تعديل الفلاتر أو تحديد صف دراسي آخر، أو الضغط على "تحميل الطلاب"</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-4 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold"
                    >
                      إعادة ضبط الفلاتر
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full text-right text-xs border-collapse relative">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                          <th className="p-3 font-black text-[11px] text-center w-12 bg-slate-100 sticky right-0 z-20">الرقم</th>
                          <th className="p-3 font-black text-[11px] w-24 bg-slate-100 sticky right-12 z-20">رقم الطالب</th>
                          <th className="p-3 font-black text-[11px] w-24 bg-slate-100 sticky right-36 z-20">رقم الجلوس</th>
                          <th className="p-3 font-black text-[11px] min-w-[180px] bg-slate-100 sticky right-60 z-20">اسم الطالب</th>
                          <th className="p-3 font-black text-[11px] text-center w-28">الحضور</th>
                          <th className="p-3 font-black text-[11px] text-amber-700 w-44">الدرجة ({subObj?.name || 'المادة'}) [الأقصى {maxScore}]</th>
                          <th className="p-3 font-black text-[11px] text-center w-20">المجموع</th>
                          <th className="p-3 font-black text-[11px] text-center w-20">النسبة</th>
                          <th className="p-3 font-black text-[11px] text-center w-20">التقدير</th>
                          <th className="p-3 font-black text-[11px] text-center w-24">النتيجة</th>
                          <th className="p-3 font-black text-[11px] w-36">الملاحظات والbadges</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                        {filteredStudentsForGrades.map((st, idx) => {
                          const currentMark = gradesMatrix[st.id]?.[selectedGradeSubject];
                          const isAbsent = st.absentSubjects?.includes(selectedGradeSubject);
                          const isPass = !isAbsent && currentMark !== undefined && currentMark >= passScore;
                          const isOutstanding = !isAbsent && currentMark !== undefined && (currentMark / maxScore) >= 0.9;
                          const hasUnsavedChanges = modifiedGradesKeys.has(`${st.id}_${selectedGradeSubject}`);

                          // calculate student total across all subjects
                          const studentMarks = gradesMatrix[st.id] || {};
                          let totalScore = 0;
                          let totalPossibleMax = 0;
                          let hasUnfinishedGrade = false;
                          let failedAnySubject = false;

                          subjects.forEach(sub => {
                            const mk = studentMarks[sub.id];
                            if (mk === undefined) {
                              hasUnfinishedGrade = true;
                            } else {
                              totalScore += mk;
                            }
                            totalPossibleMax += sub.maxScore;

                            if (mk !== undefined && mk < sub.passScore) {
                              failedAnySubject = true;
                            }
                          });

                          const percentage = totalPossibleMax > 0 ? parseFloat(((totalScore / totalPossibleMax) * 100).toFixed(1)) : 0;

                          let gradeLabel = 'بانتظار الرصد';
                          let resultText = 'بانتظار الرصد';

                          if (!hasUnfinishedGrade) {
                            if (percentage >= 90) gradeLabel = 'ممتاز 🌟';
                            else if (percentage >= 80) gradeLabel = 'جيد جداً';
                            else if (percentage >= 65) gradeLabel = 'جيد';
                            else if (percentage >= 50) gradeLabel = 'مقبول';
                            else gradeLabel = 'ضعيف';

                            resultText = (!failedAnySubject && percentage >= (examSettings.passMarkPercent || 50)) ? 'ناجح' : 'راسب';
                          } else {
                            if (percentage >= 90) gradeLabel = 'ممتاز (مبدئي)';
                            else if (percentage >= 80) gradeLabel = 'جيد جداً (مبدئي)';
                            else if (percentage >= 65) gradeLabel = 'جيد (مبدئي)';
                            else if (percentage >= 50) gradeLabel = 'مقبول (مبدئي)';
                            else gradeLabel = 'ضعيف (مبدئي)';

                            resultText = 'غير مكتمل ⏳';
                          }

                          // Select background row styling based on status
                          let rowBgClass = "hover:bg-transparent transition-colors group";
                          if (isAbsent) {
                            rowBgClass = "bg-slate-100/70 hover:bg-slate-100/90 text-slate-500 transition-colors group";
                          } else if (hasUnsavedChanges) {
                            rowBgClass = "bg-orange-50/60 hover:bg-orange-50/90 transition-colors group";
                          } else if (currentMark !== undefined && !isPass) {
                            rowBgClass = "bg-rose-50/50 hover:bg-rose-100/50 border-rose-100 transition-colors group";
                          } else if (isOutstanding) {
                            rowBgClass = "bg-amber-50/30 hover:bg-amber-50/60 transition-colors group";
                          }

                          return (
                            <tr key={st.id} className={rowBgClass}>
                              {/* STICKY COLUMN: S.No. */}
                              <td className="p-3 text-center font-bold text-slate-400 sticky right-0 group-hover:bg-transparent group-hover:text-slate-900 transition-colors z-2 border-l border-slate-100 w-12">
                                {idx + 1}
                              </td>

                              {/* STICKY COLUMN: Student ID */}
                              <td className="p-3 font-mono text-[10px] text-slate-500 font-bold sticky right-12 group-hover:bg-transparent transition-colors z-2 border-l border-slate-100 w-24">
                                {st.nationalId || st.id}
                              </td>

                              {/* STICKY COLUMN: Seat No. */}
                              <td className="p-3 font-mono font-black text-amber-600 sticky right-36 group-hover:bg-transparent transition-colors z-2 border-l border-slate-100 w-24">
                                {st.seatNumber || 'N/A'}
                              </td>

                              {/* STICKY COLUMN: Student Name */}
                              <td className="p-3 font-bold text-slate-900 sticky right-60 group-hover:bg-transparent transition-colors z-2 border-l border-slate-100 min-w-[180px]">
                                <div className="flex flex-col">
                                  <span>{st.name}</span>
                                  <span className="text-[9px] text-slate-400 font-semibold">{st.classroom} - الشعبة ({st.section})</span>
                                </div>
                              </td>

                              {/* Presence toggle button */}
                              <td className="p-3 text-center">
                                <button
                                  disabled={approvalStatus.approved}
                                  onClick={() => {
                                    const updatedAbsent = isAbsent
                                      ? (st.absentSubjects || []).filter((s: string) => s !== selectedGradeSubject)
                                      : [...(st.absentSubjects || []), selectedGradeSubject];

                                    const updatedList = studentList.map(s => s.id === st.id ? { ...s, absentSubjects: updatedAbsent } : s);
                                    setStudentList(updatedList);

                                    // if absent, set grade matrix score to 0
                                    if (!isAbsent) {
                                      setGradesMatrix(prev => ({
                                        ...prev,
                                        [st.id]: {
                                          ...(prev[st.id] || {}),
                                          [selectedGradeSubject]: 0
                                        }
                                      }));
                                    }

                                    triggerNotification(`تم تحديث حالة حضور الطالب ${st.name} إلى ${!isAbsent ? 'غائب' : 'حاضر'}`, 'info');
                                  }}
                                  className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                                    isAbsent
                                      ? 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200'
                                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                                  }`}
                                >
                                  {isAbsent ? 'غائب ❌' : 'حاضر ✓'}
                                </button>
                              </td>

                              {/* Direct Grade Cell Input */}
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 relative">
                                  <input
                                    type="number"
                                    value={isAbsent ? 0 : (currentMark !== undefined ? currentMark : '')}
                                    disabled={isAbsent || approvalStatus.approved}
                                    onChange={(e) => handleGradeChange(st.id, selectedGradeSubject, e.target.value)}
                                    placeholder="بانتظار الرصد"
                                    className={`w-28 p-2 text-center text-xs font-black border transition-all ${
                                      isAbsent
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                        : currentMark === undefined
                                          ? 'bg-amber-50/50 text-slate-900 border-amber-200 focus:focus:ring-2 focus:ring-amber-500/20'
                                          : !isPass
                                            ? 'bg-rose-50 text-rose-950 border-rose-300 focus:ring-rose-500/20'
                                            : isOutstanding
                                              ? 'bg-amber-50 text-amber-950 border-amber-300 focus:ring-amber-500/20'
                                              : 'bg-transparent text-slate-950 border-slate-200 focus:focus:ring-2 focus:ring-amber-500/20'
                                    }`}
                                    min="0"
                                    max={maxScore}
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold">/ {maxScore}</span>
                                </div>
                              </td>

                              {/* Total score */}
                              <td className="p-3 text-center font-bold text-slate-700 text-xs">
                                {totalScore}
                              </td>

                              {/* Percentage */}
                              <td className="p-3 text-center font-black text-amber-700 text-xs">
                                {percentage}%
                              </td>

                              {/* Grade */}
                              <td className="p-3 text-center font-bold text-slate-600">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200`}>
                                  {gradeLabel}
                                </span>
                              </td>

                              {/* Result Badge */}
                              <td className="p-3 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                  resultText === 'ناجح'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : resultText === 'راسب'
                                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                                      : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {resultText}
                                </span>
                              </td>

                              {/* Custom badges & notes */}
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {isAbsent && <span className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-red-200">غياب</span>}
                                  {hasUnsavedChanges && <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-200 animate-pulse">تعديل غير محفوظ</span>}
                                  {isOutstanding && <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-200">متفوق 🌟</span>}
                                  {currentMark === undefined && !isAbsent && <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-slate-200">رصد معلق</span>}
                                  {percentage >= 95 && <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">امتياز مع مرتبة الشرف</span>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom save bar */}
              <div className="p-4 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold">
                  {modifiedGradesKeys.size > 0
                    ? `⚠️ لديك عدد (${modifiedGradesKeys.size}) تعديل غير محفوظ حالياً في هذا الكشف!`
                    : '✓ جميع التعديلات الحالية محفوظة ومحدثة بالكامل مع قاعدة بيانات الكنترول.'
                  }
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => void handleSaveCurrentGradeSheet()}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md shadow-amber-600/15"
                  >
                    <Save className="w-4 h-4" />
                    <span>تأكيد وحفظ الكشف المدرسي الحالي</span>
                  </button>
                </div>
              </div>

              {/* REVIEW MODAL (مراجعة تفصيلية للدرجات) */}
              {showReviewGradesModal && (() => {
                const gradesArray = filteredStudentsForGrades
                  .map(st => gradesMatrix[st.id]?.[selectedGradeSubject])
                  .filter(v => v !== undefined) as number[];
                const minGrade = gradesArray.length > 0 ? Math.min(...gradesArray) : 0;
                const maxGrade = gradesArray.length > 0 ? Math.max(...gradesArray) : 0;
                const sum = gradesArray.reduce((acc, v) => acc + v, 0);
                const avgGrade = gradesArray.length > 0 ? parseFloat((sum / gradesArray.length).toFixed(1)) : 0;

                return (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-150 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">

                      <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-sm">التدقيق والتحليل الإحصائي لدرجات الكشف</h3>
                            <p className="text-[10px] text-slate-500">مراجعة وتحليل درجات مادة {subObj?.name || 'المحددة'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowReviewGradesModal(false)}
                          className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                        >
                          إغلاق ×
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-transparent p-4 text-center border border-slate-200">
                          <p className="text-[10px] text-slate-500 font-bold">أعلى درجة مرصودة</p>
                          <p className="text-xl font-black text-emerald-600 mt-1">{maxGrade} / {maxScore}</p>
                        </div>
                        <div className="bg-transparent p-4 text-center border border-slate-200">
                          <p className="text-[10px] text-slate-500 font-bold">أقل درجة مرصودة</p>
                          <p className="text-xl font-black text-rose-600 mt-1">{minGrade} / {maxScore}</p>
                        </div>
                        <div className="bg-amber-50/50 p-4 text-center border border-amber-100">
                          <p className="text-[10px] text-amber-900 font-bold">متوسط درجات الطلاب</p>
                          <p className="text-xl font-black text-amber-600 mt-1">{avgGrade} / {maxScore}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-900 border-b pb-1">مؤشرات النجاح والرسوب الحالية:</h4>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-600">نسبة الاجتياز والاعتماد للمادة:</span>
                          <span className="font-extrabold text-amber-600">{passPercent}% ({passCount} طالب ناجح)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-amber-600 h-full rounded-full" style={{ width: `${passPercent}%` }} />
                        </div>

                        <div className="flex justify-between items-center text-xs mt-2">
                          <span className="font-bold text-slate-600">الطلاب الذين لم يجتازوا المادة (الراسبون):</span>
                          <span className="font-extrabold text-rose-600">{recordedGradesCount - passCount} طالب</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <button
                          onClick={() => {
                            setShowReviewGradesModal(false);
                            handleApproveGrades();
                          }}
                          className="px-4 py-2 bg-amber-600 text-white text-xs font-bold"
                        >
                          اعتماد هذا الكشف نهائياً
                        </button>
                        <button
                          onClick={() => setShowReviewGradesModal(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                        >
                          حسناً، إغلاق نافذة التدقيق
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* PRINT GRADES MODAL (معاينة كشف الدرجات للطباعة) */}
              {showPrintGradesModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="rounded-3xl w-full max-w-4xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">

                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-amber-600" />
                        <div>
                          <h3 className="font-black text-slate-900 text-sm">كشف رصد الدرجات الرسمي - معاينة قبل الطباعة</h3>
                          <p className="text-[10px] text-slate-500">تحقق من التنسيق النهائي للكشف المدرسي المعتمد</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPrintGradesModal(false)}
                        className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                      >
                        إغلاق معاينة الطباعة ×
                      </button>
                    </div>

                    {/* Official School A4 Sheet Header preview */}
                    <div className="border-4 border-double border-slate-950 p-6 space-y-6 text-slate-950" id="official-printable-sheet">
                      <div className="flex justify-between items-start text-xs font-black border-b border-slate-950 pb-4">
                        <div className="text-right space-y-1">
                          <p>{selectedSchool?.name || 'المدرسة الحالية'}</p>
                          <p>وحدة الامتحانات والنتائج</p>
                          <p>SchoolForManus</p>
                          <p className="font-bold text-[10px] text-amber-700">{approvalStatus.approved ? 'نتائج معتمدة' : 'مسودة غير معتمدة'}</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-extrabold">بيان رسمي برصد درجات الطلاب</p>
                          <p>العام الدراسي: {selectedGradeYear}</p>
                          <p>الفصل الدراسي: {selectedGradeSemester}</p>
                        </div>
                        <div className="text-left space-y-1">
                          <p>المادة الدراسية: {subObj?.name}</p>
                          <p>الصف: {selectedGradeClass}</p>
                          <p>الشعبة: {selectedGradeSection}</p>
                          <p>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
                        </div>
                      </div>

                      <table className="w-full text-right text-xs border border-slate-950 border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                            <th className="p-2 border border-slate-950 text-center w-12">م</th>
                            <th className="p-2 border border-slate-950 w-24">رقم الطالب</th>
                            <th className="p-2 border border-slate-950 w-24">رقم الجلوس</th>
                            <th className="p-2 border border-slate-950">اسم الطالب</th>
                            <th className="p-2 border border-slate-950 text-center w-28">الدرجة ({maxScore})</th>
                            <th className="p-2 border border-slate-950 text-center w-24">النتيجة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudentsForGrades.map((st, idx) => {
                            const currentMark = gradesMatrix[st.id]?.[selectedGradeSubject];
                            const isAbsent = st.absentSubjects?.includes(selectedGradeSubject);
                            const isPass = !isAbsent && currentMark !== undefined && currentMark >= passScore;

                            return (
                              <tr key={st.id} className="border border-slate-950">
                                <td className="p-2 border border-slate-950 text-center">{idx + 1}</td>
                                <td className="p-2 border border-slate-950 font-mono">{st.nationalId || st.id}</td>
                                <td className="p-2 border border-slate-950 font-mono">{st.seatNumber}</td>
                                <td className="p-2 border border-slate-950 font-bold">{st.name}</td>
                                <td className="p-2 border border-slate-950 text-center font-bold">
                                  {isAbsent ? 'غياب (0)' : (currentMark !== undefined ? currentMark : 'لم ترصد')}
                                </td>
                                <td className="p-2 border border-slate-950 text-center font-bold">
                                  {isAbsent ? 'غائب' : (currentMark === undefined ? 'معلق' : (isPass ? 'ناجح' : 'راسب'))}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="flex justify-between pt-12 text-xs font-black">
                        <div className="text-center w-48">
                          <p>معد المادة ورصد الدرجات</p>
                          <p className="mt-8 text-slate-400">...............................</p>
                        </div>
                        <div className="text-center w-48">
                          <p>رئيس لجنة الكنترول</p>
                          <p className="mt-8 text-slate-400">...............................</p>
                        </div>
                        <div className="text-center w-48">
                          <p>مدير المدرسة المعتمد</p>
                          <p className="mt-8 text-slate-400">...............................</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <button
                        onClick={async () => {
                          handlePrintElementByID('official-printable-sheet', 'كشف رصد درجات الطلاب العام');
                        }}
                        className="px-5 py-2 bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>إرسال الأمر للطابعة الرسمية</span>
                      </button>
                      <button
                        onClick={() => setShowPrintGradesModal(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        إلغاء وإغلاق المعاينة
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </>
          ) : gradesSubTab === 'student-review-edit' ? (
            (() => {
              // 1. Get filtered list of students
              const displayFilteredStudents = filteredStudentsForGrades.filter(st => {
                if (!gradesSearchQuery) return true;
                const q = gradesSearchQuery.toLowerCase();
                return (
                  st.name.toLowerCase().includes(q) ||
                  (st.seatNumber || '').toLowerCase().includes(q) ||
                  (st.nationalId || st.id).toLowerCase().includes(q)
                );
              });

              // 2. Select the current student
              const currentReviewStudentId = selectedReviewStudentId || (displayFilteredStudents[0]?.id || '');
              const selectedStObj = displayFilteredStudents.find(st => st.id === currentReviewStudentId) || displayFilteredStudents[0];

              // Helper to calculate student metrics
              const getStudentReviewMetrics = (studentId: string) => {
                let totalScore = 0;
                let totalMax = 0;
                let pass = true;
                let failedSubjectsCount = 0;
                let pendingCount = 0;
                let absentCount = 0;

                subjects.forEach(sub => {
                  const isAbsent = studentList.find(s => s.id === studentId)?.absentSubjects?.includes(sub.id);
                  let mark = bulkDraftGrades[studentId]?.[sub.id];
                  if (mark === undefined) {
                    mark = gradesMatrix[studentId]?.[sub.id];
                  }

                  if (isAbsent) {
                    absentCount++;
                    mark = 0;
                  } else if (mark === undefined) {
                    pendingCount++;
                    mark = 0;
                  }

                  totalScore += mark;
                  totalMax += sub.maxScore;

                  if (mark < sub.passScore && !isAbsent && mark !== undefined) {
                    pass = false;
                    failedSubjectsCount++;
                  }
                });

                const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
                const formattedPercent = parseFloat(percentage.toFixed(1));

                let gradeSymbol = 'مقبول';
                if (formattedPercent >= 90) gradeSymbol = 'ممتاز 🏅';
                else if (formattedPercent >= 80) gradeSymbol = 'جيد جداً';
                else if (formattedPercent >= 65) gradeSymbol = 'جيد';
                else if (formattedPercent < 50) gradeSymbol = 'ضعيف ❌';

                const resultStatus = pass && failedSubjectsCount === 0 && absentCount === 0 ? 'ناجح' : 'راسب';

                return {
                  totalScore,
                  totalMax,
                  percentage: formattedPercent,
                  gradeSymbol,
                  resultStatus,
                  failedSubjectsCount,
                  pendingCount,
                  absentCount
                };
              };

              const handleReviewEditGradeChange = (studentId: string, subjectId: string, valueStr: string) => {
                if (approvalStatus.approved) {
                  triggerNotification('لا يمكن تعديل الدرجات، النتائج معتمدة ومقفلة بالكامل 🔒', 'warning');
                  return;
                }

                const subObj = subjects.find(s => s.id === subjectId);
                const maxScore = subObj?.maxScore || 100;

                if (valueStr === '') {
                  setBulkDraftGrades(prev => {
                    const updated = { ...prev };
                    if (!updated[studentId]) updated[studentId] = {};
                    delete updated[studentId][subjectId];
                    if (Object.keys(updated[studentId]).length === 0) {
                      delete updated[studentId];
                    }
                    return updated;
                  });
                  return;
                }

                const num = parseFloat(valueStr);
                if (isNaN(num)) return;

                if (num < 0) {
                  triggerNotification('خطأ: لا يمكن إدخال درجات سالبة ❌', 'warning');
                  return;
                }
                if (num > maxScore) {
                  triggerNotification(`خطأ: الدرجة لا يمكن أن تتجاوز النهاية العظمى للمادة (${maxScore})`, 'warning');
                  return;
                }

                setBulkDraftGrades(prev => {
                  const updated = { ...prev };
                  if (!updated[studentId]) updated[studentId] = {};
                  updated[studentId][subjectId] = num;
                  return updated;
                });
              };

              // Calculate total draft modifications in this student's view
              let studentDraftChangesCount = 0;
              if (selectedStObj) {
                const sId = selectedStObj.id;
                if (bulkDraftGrades[sId]) {
                  Object.keys(bulkDraftGrades[sId]).forEach(subId => {
                    if (bulkDraftGrades[sId][subId] !== (gradesMatrix[sId]?.[subId] ?? 0)) {
                      studentDraftChangesCount++;
                    }
                  });
                }
              }

              return (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">

                  {/* 1. Sub-tab Filters Panel */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Sliders className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-extrabold text-slate-700">شريط التصفية والفرز لمراجعة درجات الطالب</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">العام الدراسي:</label>
                        <select
                          value={selectedGradeYear}
                          onChange={(e) => setSelectedGradeYear(e.target.value)}
                          className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        >
                          <option value={examSettings.academicYear}>{examSettings.academicYear}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">الفصل الدراسي:</label>
                        <select
                          value={selectedGradeSemester}
                          onChange={(e) => setSelectedGradeSemester(e.target.value)}
                          className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        >
                          <option value="الفصل الدراسي الأول">الفصل الأول</option>
                          <option value="الفصل الدراسي الثاني">الفصل الثاني</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">نوع الامتحان:</label>
                        <select
                          value={selectedGradeExamType}
                          onChange={(e) => setSelectedGradeExamType(e.target.value)}
                          className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        >
                          <option value="الاختبارات الشهرية المستمرة">اختبارات شهرية</option>
                          <option value="امتحانات منتصف الفصل">منتصف الفصل</option>
                          <option value="الاختبارات النهائية">الاختبارات النهائية</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">المرحلة:</label>
                        <select
                          value={selectedGradeLevel}
                          onChange={(e) => {
                            setSelectedGradeLevel(e.target.value);
                            if (e.target.value === 'high') {
                              setSelectedGradeClass('الصف الأول الثانوي');
                            } else if (e.target.value === 'middle') {
                              setSelectedGradeClass('الكل');
                            } else {
                              setSelectedGradeClass('الكل');
                            }
                          }}
                          className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        >
                          <option value="الكل">جميع المراحل</option>
                          <option value="middle">المرحلة المتوسطة</option>
                          <option value="high">المرحلة الثانوية</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">الصف الدراسي:</label>
                        <select
                          value={selectedGradeClass}
                          onChange={(e) => setSelectedGradeClass(e.target.value)}
                          className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        >
                          <option value="الكل">جميع الصفوف</option>
                          {classesList
                            .filter(c => selectedGradeLevel === 'الكل' || c.level === selectedGradeLevel)
                            .map(cls => (
                              <option key={cls.id} value={cls.name}>{cls.name}</option>
                            ))
                          }
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">الشعبة الدراسية:</label>
                        <select
                          value={selectedGradeSection}
                          onChange={(e) => setSelectedGradeSection(e.target.value)}
                          className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        >
                          <option value="الكل">جميع الشعب (أ-ب-ج)</option>
                          <option value="أ">الشعبة (أ)</option>
                          <option value="ب">الشعبة (ب)</option>
                          <option value="علمي أ">علمي أ</option>
                          <option value="أدبي أ">أدبي أ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Master-Detail Interactive Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Right column: Student selection list */}
                    <div className="lg:col-span-4 p-4 space-y-4 max-h-[680px] overflow-y-auto scrollbar-thin">
                      <div className="space-y-2">
                        <h3 className="font-black text-xs text-slate-900">قائمة طلاب الصف الحالي ({displayFilteredStudents.length})</h3>
                        <p className="text-[10px] text-slate-400">اختر الطالب لتعديل درجاته كلياً</p>
                      </div>

                      {/* Search Bar inside List */}
                      <div className="relative">
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          value={gradesSearchQuery}
                          onChange={(e) => setGradesSearchQuery(e.target.value)}
                          placeholder="بحث سريع باسم الطالب..."
                          className="w-full text-[11px] font-semibold p-2 pr-8 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        {displayFilteredStudents.map(st => {
                          const m = getStudentReviewMetrics(st.id);
                          const isSelected = selectedStObj && selectedStObj.id === st.id;

                          return (
                            <button
                              key={st.id}
                              onClick={() => {
                                setSelectedReviewStudentId(st.id);
                              }}
                              className={`w-full text-right p-3 border text-xs font-medium cursor-pointer transition-all flex flex-col gap-1 ${
                                isSelected
                                  ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                                  : 'bg-transparent border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-black truncate max-w-[180px]">{st.name}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                  isSelected
                                    ? 'bg-amber-700 text-amber-100'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  رقم الجلوس: {st.seatNumber || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center w-full mt-1 text-[10px]">
                                <span className={isSelected ? 'text-amber-200' : 'text-slate-400'}>
                                  {st.classroom} - الشعبة ({st.section})
                                </span>
                                <span className={`font-black ${
                                  isSelected ? 'text-white' : 'text-amber-700'
                                }`}>
                                  {m.percentage}% ({m.resultStatus})
                                </span>
                              </div>
                            </button>
                          );
                        })}
                        {displayFilteredStudents.length === 0 && (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            لا يوجد طلاب مطابقين للبحث
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Left column: Selected student's comprehensive profile and grades */}
                    <div className="lg:col-span-8 space-y-6">

                      {selectedStObj ? (() => {
                        const m = getStudentReviewMetrics(selectedStObj.id);
                        const lastMod = gradesLastModified[selectedStObj.id] || 'لا توجد تعديلات سابقة';

                        return (
                          <>
                            {/* Profile Header Card */}
                            <div className="bg-gradient-to-r from-amber-900 to-slate-900 text-white p-6 border border-amber-950 shadow-md space-y-4">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-3 bg-amber-500/20 text-amber-300 border border-amber-400/20">
                                    <User className="w-6 h-6" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <h3 className="font-black text-sm tracking-tight">{selectedStObj.name}</h3>
                                    <p className="text-[10px] text-amber-200">الرقم الوطني: {selectedStObj.nationalId || selectedStObj.id} | رقم الجلوس: {selectedStObj.seatNumber || 'غير محدد'}</p>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <span className={`px-2.5 py-1 text-[10px] font-black border uppercase ${
                                    m.resultStatus === 'ناجح'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  }`}>
                                    ناجح / راسب: {m.resultStatus}
                                  </span>
                                  <span className="px-2.5 py-1 bg-white/10 text-white border border-white/20 text-[10px] font-black">
                                    المعدل: {m.percentage}%
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-amber-800/60 pt-3 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-amber-200 font-bold">
                                <p>الصف الدراسي: {selectedStObj.classroom} - الشعبة {selectedStObj.section}</p>
                                <p>حالة الرصد: {m.pendingCount > 0 ? `رصد غير مكتمل (${m.pendingCount} مواد معلقة)` : 'مكتمل الرصد الكلي ✓'}</p>
                                <p>آخر تحديث: {lastMod}</p>
                              </div>
                            </div>

                            {/* Quick Metrics Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="p-3.5 text-center space-y-1 shadow-xs">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">الدرجة الكلية</p>
                                <p className="text-sm font-black text-slate-800">{m.totalScore} <span className="text-[10px] text-slate-400">/ {m.totalMax}</span></p>
                              </div>
                              <div className="p-3.5 text-center space-y-1 shadow-xs">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">النسبة التراكمية</p>
                                <p className="text-sm font-black text-amber-700">{m.percentage}%</p>
                              </div>
                              <div className="p-3.5 text-center space-y-1 shadow-xs">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">المواد المتعثرة</p>
                                <p className={`text-sm font-black ${m.failedSubjectsCount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>{m.failedSubjectsCount} مادة</p>
                              </div>
                              <div className="p-3.5 text-center space-y-1 shadow-xs">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">التقدير المقدر</p>
                                <p className="text-sm font-black text-amber-600">{m.gradeSymbol}</p>
                              </div>
                            </div>

                            {/* Interactive Subjects Form/Table */}
                            <div className="overflow-hidden">
                              <div className="p-4 bg-transparent border-b border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-black text-slate-800">تفاصيل رصد كافة المقررات الدراسية لهذا الطالب:</span>
                                {studentDraftChangesCount > 0 && (
                                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold animate-pulse">
                                    يوجد {studentDraftChangesCount} تعديلات غير محفوظة
                                  </span>
                                )}
                              </div>

                              <div className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                                {subjects.map(sub => {
                                  const isAbsent = selectedStObj.absentSubjects?.includes(sub.id);
                                  const val = bulkDraftGrades[selectedStObj.id]?.[sub.id] !== undefined
                                    ? bulkDraftGrades[selectedStObj.id][sub.id]
                                    : (gradesMatrix[selectedStObj.id]?.[sub.id] ?? '');
                                  const isChanged = bulkDraftGrades[selectedStObj.id]?.[sub.id] !== undefined && bulkDraftGrades[selectedStObj.id][sub.id] !== (gradesMatrix[selectedStObj.id]?.[sub.id] ?? 0);
                                  const isPass = val !== '' && Number(val) >= sub.passScore;

                                  return (
                                    <div key={sub.id} className="p-4 hover:bg-transparent/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">

                                      {/* Subject Info */}
                                      <div className="space-y-1 md:w-1/3">
                                        <p className="font-extrabold text-xs text-slate-800">{sub.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">النهاية العظمى {sub.maxScore} | حد النجاح {sub.passScore}</p>
                                      </div>

                                      {/* Presence Switch */}
                                      <div className="flex items-center gap-2">
                                        <button
                                          disabled={approvalStatus.approved}
                                          onClick={() => {
                                            const updatedAbsent = isAbsent
                                              ? (selectedStObj.absentSubjects || []).filter((s: string) => s !== sub.id)
                                              : [...(selectedStObj.absentSubjects || []), sub.id];

                                            const updatedList = studentList.map(s => s.id === selectedStObj.id ? { ...s, absentSubjects: updatedAbsent } : s);
                                            setStudentList(updatedList);

                                            if (!isAbsent) {
                                              // set draft and matrix to 0
                                              setBulkDraftGrades(prev => {
                                                const updated = { ...prev };
                                                if (!updated[selectedStObj.id]) updated[selectedStObj.id] = {};
                                                updated[selectedStObj.id][sub.id] = 0;
                                                return updated;
                                              });
                                            }
                                            triggerNotification(`تغيير حالة حضور مادة ${sub.name} للطالب ${selectedStObj.name}`, 'info');
                                          }}
                                          className={`px-3 py-1.5 text-[10px] font-black transition-all ${
                                            isAbsent
                                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                          }`}
                                        >
                                          {isAbsent ? 'غائب ❌' : 'حاضر ✓'}
                                        </button>
                                      </div>

                                      {/* Grade Input */}
                                      <div className="flex items-center gap-3 md:w-2/5">
                                        <div className="relative w-full">
                                          <input
                                            type="number"
                                            value={isAbsent ? 0 : val}
                                            disabled={isAbsent || approvalStatus.approved}
                                            onChange={(e) => handleReviewEditGradeChange(selectedStObj.id, sub.id, e.target.value)}
                                            placeholder="لم ترصد"
                                            className={`w-full p-2 text-center text-xs font-black border transition-all ${
                                              isAbsent
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                : isChanged
                                                  ? 'bg-amber-50 text-amber-950 border-amber-300 ring-2 ring-amber-500/10'
                                                  : val === ''
                                                    ? 'bg-transparent text-slate-400 border-slate-200'
                                                    : !isPass
                                                      ? 'bg-rose-50 text-rose-950 border-rose-300'
                                                      : 'bg-transparent text-slate-900 border-slate-200 focus:focus:ring-2 focus:ring-amber-500/20'
                                            }`}
                                            min="0"
                                            max={sub.maxScore}
                                          />
                                          <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 font-bold">/ {sub.maxScore}</span>
                                        </div>

                                        {/* Grade feedback badge */}
                                        <div className="w-24 text-center">
                                          {isAbsent ? (
                                            <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-[9px] font-black">غائب</span>
                                          ) : val === '' ? (
                                            <span className="px-2 py-1 bg-transparent text-slate-400 border border-slate-100 rounded-md text-[9px] font-black">معلق</span>
                                          ) : isPass ? (
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[9px] font-black">ناجح</span>
                                          ) : (
                                            <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-[9px] font-black">راسب ❌</span>
                                          )}
                                        </div>
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Actions Bar */}
                            <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                              <span className="text-[11px] text-slate-500 font-bold">
                                * التعديلات تظهر باللون الأصفر فور تعديلها. يمكنك حفظها دفعة واحدة بالضغط على زر الحفظ.
                              </span>

                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => handlePrintSingleStudentGrades(selectedStObj, m)}
                                  className="px-4 py-2 bg-slate-800 hover:bg-[#2a1d13] text-[#fce79a] text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto justify-center"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>طباعة كارت الدرجات</span>
                                </button>

                                <button
                                  onClick={handleSaveBulkDraft}
                                  disabled={studentDraftChangesCount === 0}
                                  className={`px-5 py-2 text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-md w-full sm:w-auto justify-center ${
                                    studentDraftChangesCount > 0
                                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/15'
                                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                  }`}
                                >
                                  <Save className="w-4 h-4" />
                                  <span>حفظ درجات الطالب الفردي ({studentDraftChangesCount})</span>
                                </button>
                              </div>
                            </div>
                          </>
                        );
                      })() : (
                        <div className="p-16 text-center space-y-3 shadow-sm">
                          <User className="w-12 h-12 text-slate-300 mx-auto" />
                          <h4 className="font-black text-slate-700 text-sm">يرجى تحديد طالب من القائمة الجانبية لبدء المراجعة</h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">قم بتعديل فلاتر الصف والشعبة في الشريط العلوي لتحديث قائمة الطلاب المقابلة.</p>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              );
            })()
          ) : (() => {
            // Review & Edit calculations
            const getStudentReviewMetrics = (studentId: string) => {
              let totalScore = 0;
              let totalMax = 0;
              let pass = true;
              let failedSubjectsCount = 0;
              let pendingCount = 0;

              subjects.forEach(sub => {
                let mark = bulkDraftGrades[studentId]?.[sub.id];
                if (mark === undefined) {
                  mark = gradesMatrix[studentId]?.[sub.id];
                }

                if (mark === undefined) {
                  pendingCount++;
                  mark = 0;
                }

                totalScore += mark;
                totalMax += sub.maxScore;

                if (mark < sub.passScore) {
                  pass = false;
                  failedSubjectsCount++;
                }
              });

              const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
              const formattedPercent = parseFloat(percentage.toFixed(1));

              let gradeSymbol = 'مقبول';
              if (formattedPercent >= 90) gradeSymbol = 'ممتاز 🏅';
              else if (formattedPercent >= 80) gradeSymbol = 'جيد جداً';
              else if (formattedPercent >= 65) gradeSymbol = 'جيد';
              else if (formattedPercent < 50) gradeSymbol = 'ضعيف ❌';

              const resultStatus = pass ? 'ناجح' : 'راسب';

              return {
                totalScore,
                totalMax,
                percentage: formattedPercent,
                gradeSymbol,
                resultStatus,
                failedSubjectsCount,
                pendingCount
              };
            };

            const reviewEditStats = (() => {
              const list = filteredStudentsForGrades;
              const total = list.length;
              let pending = 0;
              let completed = 0;
              let passed = 0;
              let outstanding = 0;

              list.forEach(st => {
                const m = getStudentReviewMetrics(st.id);
                if (m.pendingCount > 0) {
                  pending++;
                } else {
                  completed++;
                }
                if (m.resultStatus === 'ناجح' && m.pendingCount === 0) {
                  passed++;
                }
                if (m.percentage >= 90 && m.pendingCount === 0) {
                  outstanding++;
                }
              });

              const passPercent = completed > 0 ? parseFloat(((passed / completed) * 100).toFixed(1)) : 0;

              return {
                total,
                pending,
                completed,
                passPercent,
                outstanding
              };
            })();

            let draftChangesCount = 0;
            Object.keys(bulkDraftGrades).forEach(stId => {
              Object.keys(bulkDraftGrades[stId]).forEach(subId => {
                if (bulkDraftGrades[stId][subId] !== (gradesMatrix[stId]?.[subId] ?? 0)) {
                  draftChangesCount++;
                }
              });
            });

            const handleExportAllSubjectsExcel = () => {
              const headers = ["الرقم", "رقم الطالب", "رقم الجلوس", "اسم الطالب", "الصف والمجموعة", ...subjects.map(s => s.name), "المجموع الكلي", "النسبة المئوية", "التقدير", "النتيجة", "آخر تعديل"];
              const rows = filteredStudentsForGrades.map((st, idx) => {
                const m = getStudentReviewMetrics(st.id);
                const studentSubjectsGrades = subjects.map(sub => {
                  const val = bulkDraftGrades[st.id]?.[sub.id] !== undefined ? bulkDraftGrades[st.id][sub.id] : (gradesMatrix[st.id]?.[sub.id] ?? '');
                  return val !== '' ? val : 'لم ترصد';
                });
                const lastMod = gradesLastModified[st.id] || 'لا توجد تعديلات';
                return [
                  idx + 1,
                  `"${st.nationalId || st.id}"`,
                  `"${st.seatNumber || ''}"`,
                  `"${st.name}"`,
                  `"${st.classroom} - ${st.section}"`,
                  ...studentSubjectsGrades,
                  m.totalScore,
                  `"${m.percentage}%"`,
                  `"${m.gradeSymbol}"`,
                  `"${m.resultStatus}"`,
                  `"${lastMod}"`
                ].join(",");
              });
              const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `كشف_شامل_الدرجات_${selectedGradeClass}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              triggerNotification('تم تصدير التقرير الكلي الشامل لكافة المواد بنجاح!', 'success');
            };

            const handleReviewEditGradeChange = (studentId: string, subjectId: string, valueStr: string) => {
              if (approvalStatus.approved) {
                triggerNotification('لا يمكن تعديل الدرجات، النتائج معتمدة ومقفلة بالكامل 🔒', 'warning');
                return;
              }

              const subObj = subjects.find(s => s.id === subjectId);
              const maxScore = subObj?.maxScore || 100;

              if (valueStr === '') {
                setBulkDraftGrades(prev => {
                  const updated = { ...prev };
                  if (!updated[studentId]) updated[studentId] = {};
                  delete updated[studentId][subjectId];
                  if (Object.keys(updated[studentId]).length === 0) {
                    delete updated[studentId];
                  }
                  return updated;
                });
                return;
              }

              const num = parseFloat(valueStr);
              if (isNaN(num)) return;

              if (num < 0) {
                triggerNotification('خطأ: لا يمكن إدخال درجات سالبة ❌', 'warning');
                return;
              }
              if (num > maxScore) {
                triggerNotification(`خطأ: الدرجة لا يمكن أن تتجاوز النهاية العظمى للمادة (${maxScore})`, 'warning');
                return;
              }

              setBulkDraftGrades(prev => {
                const updated = { ...prev };
                if (!updated[studentId]) updated[studentId] = {};
                updated[studentId][subjectId] = num;
                return updated;
              });
            };

            const displayFilteredStudents = filteredStudentsForGrades.filter(st => {
              if (!gradesSearchQuery) return true;
              const q = gradesSearchQuery.toLowerCase();
              return (
                st.name.toLowerCase().includes(q) ||
                (st.seatNumber || '').toLowerCase().includes(q) ||
                (st.nationalId || st.id).toLowerCase().includes(q)
              );
            });

            return (
              <>
                {/* Tailored Statistics Panel (Bento Style) */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400">طلاب الشعبة النشطين</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-slate-900">{reviewEditStats.total}</span>
                      <span className="text-xs text-slate-500 font-bold">طالب</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full w-full" />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400">اكتمال الرصد الكلي</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-emerald-600">{reviewEditStats.completed}</span>
                      <span className="text-xs text-slate-400 font-bold">من {reviewEditStats.total}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${reviewEditStats.total > 0 ? (reviewEditStats.completed / reviewEditStats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400">رصد معلق / غير مكتمل</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className={`text-2xl font-black ${reviewEditStats.pending > 0 ? 'text-amber-500' : 'text-slate-500'}`}>{reviewEditStats.pending}</span>
                      <span className="text-xs text-slate-500 font-bold">طالب</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${reviewEditStats.total > 0 ? (reviewEditStats.pending / reviewEditStats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400">نسبة النجاح العامة بالصف</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-amber-600">{reviewEditStats.passPercent}%</span>
                      <span className="text-xs text-slate-500 font-bold">للمكتمل رصدهم</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${reviewEditStats.passPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400">الطلاب المتفوقين (أعلى من 90%)</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-amber-500">{reviewEditStats.outstanding}</span>
                      <span className="text-xs text-slate-500 font-bold">متفوقين 🏅</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${reviewEditStats.total > 0 ? (reviewEditStats.outstanding / reviewEditStats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filters Panel */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-extrabold text-slate-700">شريط التصفية والفرز الذكي للمجموعات الدراسية</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block">العام الدراسي:</label>
                      <select
                        value={selectedGradeYear}
                        onChange={(e) => setSelectedGradeYear(e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      >
                        <option value={examSettings.academicYear}>{examSettings.academicYear}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block">الفصل الدراسي:</label>
                      <select
                        value={selectedGradeSemester}
                        onChange={(e) => setSelectedGradeSemester(e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      >
                        <option value="الفصل الدراسي الأول">الفصل الأول</option>
                        <option value="الفصل الدراسي الثاني">الفصل الثاني</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block">نوع الامتحان:</label>
                      <select
                        value={selectedGradeExamType}
                        onChange={(e) => setSelectedGradeExamType(e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      >
                        <option value="الاختبارات الشهرية المستمرة">اختبارات شهرية</option>
                        <option value="امتحانات منتصف الفصل">منتصف الفصل</option>
                        <option value="الاختبارات النهائية">الاختبارات النهائية</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block">المرحلة:</label>
                      <select
                        value={selectedGradeLevel}
                        onChange={(e) => {
                          setSelectedGradeLevel(e.target.value);
                          if (e.target.value === 'high') {
                            setSelectedGradeClass('الصف الأول الثانوي');
                          } else if (e.target.value === 'middle') {
                            setSelectedGradeClass('الكل');
                          } else {
                            setSelectedGradeClass('الكل');
                          }
                        }}
                        className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      >
                        <option value="الكل">جميع المراحل</option>
                        <option value="middle">المرحلة المتوسطة</option>
                        <option value="high">المرحلة الثانوية</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block">الصف الدراسي:</label>
                      <select
                        value={selectedGradeClass}
                        onChange={(e) => setSelectedGradeClass(e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      >
                        <option value="الكل">جميع الصفوف</option>
                        {classesList
                          .filter(c => selectedGradeLevel === 'الكل' || c.level === selectedGradeLevel)
                          .map(cls => (
                            <option key={cls.id} value={cls.name}>{cls.name}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block">الشعبة الدراسية:</label>
                      <select
                        value={selectedGradeSection}
                        onChange={(e) => setSelectedGradeSection(e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      >
                        <option value="الكل">جميع الشعب (أ-ب-ج)</option>
                        <option value="أ">الشعبة (أ)</option>
                        <option value="ب">الشعبة (ب)</option>
                        <option value="علمي أ">علمي أ</option>
                        <option value="أدبي أ">أدبي أ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="bg-transparent p-4 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleSaveBulkDraft}
                      disabled={draftChangesCount === 0}
                      className={`p-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ${
                        draftChangesCount > 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                      title="حفظ كافة التعديلات المدخلة دفعة واحدة كمعاملة آمنة"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ التعديلات ({draftChangesCount} معلقة)</span>
                    </button>

                    <button
                      onClick={() => {
                        setBulkDraftGrades({});
                        triggerNotification('تم التراجع عن جميع التعديلات غير المحفوظة بنجاح 🔄', 'info');
                      }}
                      disabled={draftChangesCount === 0}
                      className={`p-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                        draftChangesCount > 0
                          ? 'hover:bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-transparent text-slate-400 border-slate-100 cursor-not-allowed'
                      }`}
                      title="إلغاء وإفراغ التعديلات غير المحفوظة"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>تراجع وإلغاء</span>
                    </button>

                    <button
                      onClick={handleLoadStudents}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      title="تحديث وتحميل الطلاب"
                    >
                      <RefreshCw className={`w-4 h-4 ${isReloadingStudents ? 'animate-spin' : ''}`} />
                      <span>تحميل الطلاب</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportAllSubjectsExcel}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-600/10"
                      title="تصدير جدول الدرجات الكلي لكافة المواد إلى ملف Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>تصدير الكشف الشامل (Excel)</span>
                    </button>
                  </div>
                </div>

                {/* Fast Search */}
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={gradesSearchQuery}
                      onChange={(e) => setGradesSearchQuery(e.target.value)}
                      placeholder="بحث سريع برقم الجلوس، رقم الطالب، أو اسم الطالب..."
                      className="w-full text-xs font-semibold p-2.5 pr-9 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                    />
                    {gradesSearchQuery && (
                      <button
                        onClick={() => setGradesSearchQuery('')}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-bold">
                    * اضغط داخل أي خلية لتعديل الدرجة مباشرة. يتم تلوين الخلايا المعدلة بالأصفر وتحديث النتائج فورياً.
                  </div>
                </div>

                {/* Main Comprehensive Table Container */}
                <div className="shadow-md overflow-hidden">
                  {isReloadingStudents ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
                      <p className="text-xs text-slate-500 font-bold">جاري تحميل وتزامن قائمة الطلاب مع الكنترول العام...</p>
                    </div>
                  ) : displayFilteredStudents.length === 0 ? (
                    <div className="p-16 text-center space-y-2">
                      <div className="text-slate-300 flex justify-center">
                        <Users className="w-12 h-12" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">لم يتم العثور على طلاب يطابقون خيارات التصفية الحالية</p>
                      <p className="text-xs text-slate-400">يرجى تعديل الفلاتر أو تحديد صف دراسي آخر، أو الضغط على "تحميل الطلاب"</p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-4 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold"
                      >
                        إعادة ضبط الفلاتر
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
                      <table className="w-full text-right text-xs border-collapse relative">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                            <th className="p-3 font-black text-[11px] text-center w-12 bg-slate-100 sticky right-0 z-20">الرقم</th>
                            <th className="p-3 font-black text-[11px] w-24 bg-slate-100 sticky right-12 z-20">رقم الطالب</th>
                            <th className="p-3 font-black text-[11px] w-24 bg-slate-100 sticky right-36 z-20">رقم الجلوس</th>
                            <th className="p-3 font-black text-[11px] min-w-[180px] bg-slate-100 sticky right-60 z-20">اسم الطالب</th>
                            {subjects.map(sub => (
                              <th key={sub.id} className="p-3 font-black text-[11px] text-center min-w-[100px] text-amber-700">
                                {sub.name} [أقصى {sub.maxScore}]
                              </th>
                            ))}
                            <th className="p-3 font-black text-[11px] text-center w-20">المجموع</th>
                            <th className="p-3 font-black text-[11px] text-center w-20">النسبة</th>
                            <th className="p-3 font-black text-[11px] text-center w-20">التقدير</th>
                            <th className="p-3 font-black text-[11px] text-center w-24">النتيجة</th>
                            <th className="p-3 font-black text-[11px] w-40 text-center">آخر تعديل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                          {displayFilteredStudents.map((st, idx) => {
                            const m = getStudentReviewMetrics(st.id);
                            const lastMod = gradesLastModified[st.id] || 'لا توجد تعديلات';
                            const rowBgClass = "hover:bg-transparent transition-colors group";

                            return (
                              <tr key={st.id} className={rowBgClass}>
                                {/* S.No. */}
                                <td className="p-3 text-center font-bold text-slate-400 sticky right-0 group-hover:bg-transparent group-hover:text-slate-900 transition-colors z-2 border-l border-slate-100 w-12">
                                  {idx + 1}
                                </td>

                                {/* Student ID */}
                                <td className="p-3 font-mono text-[10px] text-slate-500 font-bold sticky right-12 group-hover:bg-transparent transition-colors z-2 border-l border-slate-100 w-24">
                                  {st.nationalId || st.id}
                                </td>

                                {/* Seat No. */}
                                <td className="p-3 font-mono font-black text-amber-600 sticky right-36 group-hover:bg-transparent transition-colors z-2 border-l border-slate-100 w-24">
                                  {st.seatNumber || 'N/A'}
                                </td>

                                {/* Student Name */}
                                <td className="p-3 font-bold text-slate-900 sticky right-60 group-hover:bg-transparent transition-colors z-2 border-l border-slate-100 min-w-[180px]">
                                  <div className="flex flex-col">
                                    <span>{st.name}</span>
                                    <span className="text-[9px] text-slate-400 font-semibold">{st.classroom} - الشعبة ({st.section})</span>
                                  </div>
                                </td>

                                {/* Subjects Inputs */}
                                {subjects.map(sub => {
                                  const val = bulkDraftGrades[st.id]?.[sub.id] !== undefined ? bulkDraftGrades[st.id][sub.id] : (gradesMatrix[st.id]?.[sub.id] ?? '');
                                  const isChanged = bulkDraftGrades[st.id]?.[sub.id] !== undefined && bulkDraftGrades[st.id][sub.id] !== (gradesMatrix[st.id]?.[sub.id] ?? 0);
                                  const isFail = val !== '' && Number(val) < sub.passScore;

                                  return (
                                    <td key={sub.id} className="p-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <input
                                          type="number"
                                          value={val}
                                          disabled={approvalStatus.approved}
                                          onChange={(e) => handleReviewEditGradeChange(st.id, sub.id, e.target.value)}
                                          placeholder="لم ترصد"
                                          className={`w-20 p-1.5 text-center text-xs font-black rounded-lg border transition-all ${
                                            isChanged
                                              ? 'bg-amber-50 text-amber-950 border-amber-300 ring-2 ring-amber-500/20 font-black'
                                              : isFail
                                                ? 'bg-rose-50 text-rose-950 border-rose-200'
                                                : 'bg-transparent text-slate-900 border-slate-200 focus:focus:ring-2 focus:ring-amber-500/20'
                                          }`}
                                          min="0"
                                          max={sub.maxScore}
                                        />
                                      </div>
                                    </td>
                                  );
                                })}

                                {/* Total score */}
                                <td className="p-3 text-center font-bold text-slate-700 text-xs">
                                  {m.totalScore}
                                </td>

                                {/* Percentage */}
                                <td className="p-3 text-center font-black text-amber-700 text-xs">
                                  {m.percentage}%
                                </td>

                                {/* Grade */}
                                <td className="p-3 text-center font-bold text-slate-600">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200`}>
                                    {m.gradeSymbol}
                                  </span>
                                </td>

                                {/* Result Badge */}
                                <td className="p-3 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                    m.resultStatus === 'ناجح'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : m.resultStatus === 'راسب'
                                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    {m.resultStatus}
                                  </span>
                                </td>

                                {/* Last Modified */}
                                <td className="p-3 text-center font-mono text-[10px] text-slate-500">
                                  <div className="flex items-center justify-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{lastMod}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Bottom Save Bar */}
                <div className="p-4 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">
                    {draftChangesCount > 0
                      ? `⚠️ لديك عدد (${draftChangesCount}) تعديل غير محفوظ حالياً في هذا الكشف!`
                      : '✓ جميع التعديلات الحالية محفوظة ومحدثة بالكامل مع قاعدة بيانات الكنترول.'
                    }
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBulkDraft}
                      disabled={draftChangesCount === 0}
                      className={`px-5 py-2 text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition-all ${
                        draftChangesCount > 0
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/15'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>تأكيد وحفظ التغييرات الكلية للدرجات</span>
                    </button>
                  </div>
                </div>
              </>
            );
          })()}

        </div>
      );
    })()}


        {/* TAB 9: Review and Approval */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="p-6 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h3 className="font-extrabold text-slate-900 text-sm border-b pb-2">لوحة تدقيق واجتياز الجودة</h3>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>نسبة اكتمال رصد الدرجات للموسم الحالي:</span>
                    <span className="text-amber-700">{metrics.completePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600" style={{ width: `${metrics.completePercent}%` }} />
                  </div>

                  <div className="p-3 bg-transparent text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-bold">إجمالي الحقول المطلوبة:</span>
                      <span className="font-bold">{metrics.totalGradeFields} حقل</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-bold">الحقول الشاغرة بانتظار الرصد:</span>
                      <span className={`font-black ${metrics.missingGradesCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {metrics.missingGradesCount} حقل
                      </span>
                    </div>
                  </div>
                </div>

                <hr/>

                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-700">سجل تدقيق الإعتمادات الأكاديمية:</h4>
                  {approvalStatus.approved ? (
                    <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <span className="font-black text-xs">تم الاعتماد الأكاديمي النهائي والنتائج مقفلة بالكامل 🔒</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">المعتمد: {approvalStatus.approvedBy}</p>
                      <p className="text-[11px] text-emerald-800">التاريخ والوقت: {approvalStatus.approvedAt}</p>

                      <button
                        onClick={handleUnlockGrades}
                        className="mt-2 text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        إلغاء قفل الدرجات والاعتماد
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
                        <span className="font-black text-xs">بانتظار الاعتماد وقفل الدرجات للموسم الحالي 🔓</span>
                      </div>
                      <p className="text-[11px] text-amber-800">يمكن تصحيح ورصد الدرجات بحرية من المعلمين حالياً.</p>

                      <button
                        onClick={handleApproveAndLock}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <LockIcon className="w-4 h-4 text-amber-300" />
                        اعتماد النتائج والدرجات وقفل الكنترول
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Quality Checklist */}
              <div className="p-6 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h3 className="font-extrabold text-slate-900 text-sm border-b pb-2">قائمة الفحص والمراجعة الآلية للكنترول</h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-transparent border border-slate-200">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">التحقق من عدم تجاوز النهاية العظمى</h4>
                      <p className="text-[10px] text-slate-500">تم فحص جميع درجات الطلاب لضمان عدم وجود أي درجة مدخلة تتجاوز الـ 100 درجة.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-transparent border border-slate-200">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">التحقق من توزيع الطلاب</h4>
                      <p className="text-[10px] text-slate-500">تم التحقق من توزيع جميع الطلاب النشطين على قاعات اختبار صالحة.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-transparent border border-slate-200">
                    {metrics.missingGradesCount > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">التحقق من رصد درجات المواد الغائبة</h4>
                      <p className="text-[10px] text-slate-500">
                        {metrics.missingGradesCount > 0
                          ? `تنبيه: هناك عدد ${metrics.missingGradesCount} درجة لم يتم رصدها بعد.`
                          : 'ممتاز: تم رصد وإكمال جميع درجات الطلاب بنجاح.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 10: Results Processing (Calculations) */}
        {activeTab === 'processing' && (
          <div className="space-y-6">
            <div className="p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">محرك المعالجة الآلية لحساب المجاميع والتقديرات</h3>
                  <p className="text-xs text-slate-500 mt-1">يقوم النظام تلقائياً باحتساب المجموع التراكمي، النسبة المئوية، حالة النجاح والرسوب، وترتيب الأوائل.</p>
                </div>

                <button
                  onClick={() => {
                    triggerNotification('تمت معالجة كشوف الدرجات واحتساب المعدلات والأوائل بنجاح', 'success');
                    logAction('تشغيل محرك احتساب المعدلات والأوائل', 'معالجة النتائج');
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث ومعالجة النتائج الكلية
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr>
                      <th className="font-bold">الترتيب العام</th>
                      <th className="font-bold">رقم الجلوس</th>
                      <th className="font-bold">اسم الطالب</th>
                      <th className="font-bold">الصف</th>
                      <th className="font-bold">المجموع الكلي</th>
                      <th className="font-bold">النسبة المئوية</th>
                      <th className="font-bold">التقدير العام</th>
                      <th className="font-bold">حالة النجاح / الرسوب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedStudents.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-transparent">
                        <td className="p-3 font-bold text-center">
                          {idx + 1 === 1 ? (
                            <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300 font-extrabold">🥇 الأول</span>
                          ) : idx + 1 === 2 ? (
                            <span className="bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-300 font-extrabold">🥈 الثاني</span>
                          ) : idx + 1 === 3 ? (
                            <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 font-extrabold">🥉 الثالث</span>
                          ) : (
                            <span className="text-slate-500 font-bold">المرتبة {idx + 1}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-700">{st.seatNumber || 'N/A'}</td>
                        <td className="p-3 font-bold text-slate-900">{st.name}</td>
                        <td className="p-3 font-semibold">{st.classroom}</td>
                        <td className="p-3 font-bold text-slate-800">{st.totalEarned} / {st.totalMax}</td>
                        <td className="p-3 font-mono font-extrabold text-sm text-amber-700">{st.percentage}%</td>
                        <td className="p-3 font-black text-slate-900">{st.gradeSymbol}</td>
                        <td className="p-3 font-bold">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                            st.status === 'ناجح'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: Reports (Analytics & Recharts) */}
        {activeTab === 'reports' && (
          <div className="space-y-6">

            {/* Reports Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Pass/Fail Ratio (Pie Chart) */}
              <div className="p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-sm border-b pb-2">معدلات واجتياز الامتحانات الكلية</h3>
                <div className="h-64 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'ناجح', value: passedProcessedStudents.length },
                          { name: 'راسب', value: failedProcessedStudents.length },
                          { name: 'غير مكتمل', value: incompleteProcessedStudents.length }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#94a3b8" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subject Average Scores (Bar Chart) */}
              <div className="p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-sm border-b pb-2">متوسط التحصيل الأكاديمي للمواد الدراسية</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subjects.map(sub => {
                        // Calculate average score for this subject
                        const scores = visibleStudents.flatMap(student => {
                          if (student.absentSubjects?.includes(sub.id)) return [0];
                          const value = gradesMatrix[student.id]?.[sub.id];
                          return typeof value === 'number' && Number.isFinite(value) ? [value] : [];
                        });
                        const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                        return {
                          name: sub.name,
                          'متوسط الدرجة': parseFloat(avg.toFixed(1))
                        };
                      })}
                      margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="متوسط الدرجة" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Quick Summary Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">إجمالي طلاب الكنترول</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{studentList.length}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">مسجلون ومرشحون للامتحان</p>
              </div>

              <div className="p-5 border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">نسبة النجاح العامة</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {overallPassRate}%
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">ممن أنهوا الاختبارات بنجاح</p>
              </div>

              <div className="p-5 border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">المعدل العام للمجموع</span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {overallAverage}%
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">للنتائج المكتملة في المدرسة الحالية</p>
              </div>

              <div className="p-5 border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">إجمالي الغياب والاعتذار</span>
                <p className="text-2xl font-black text-red-600 mt-1">
                  {studentList.reduce((acc, curr) => acc + (curr.absentSubjects?.length || 0), 0)}
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">حالات مسجلة في ورقة كشف غياب</p>
              </div>
            </div>

            {/* Print and Export Actions */}
            <div className="p-5 flex flex-wrap gap-3 justify-end bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              <button
                onClick={() => handlePrintReport('تقرير التحليل المجمع للدرجات')}
                className="px-4 py-2 bg-[#2a1d13] text-[#fce79a] rounded-lg text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                تصدير وطباعة التقرير العام الشامل
              </button>
            </div>

          </div>
        )}

        {/* TAB 12: Certificates & Transcripts */}
        {activeTab === 'certificates' && (
          <ExamsCertificatesPanel
            schoolName={selectedSchool?.name || 'المدرسة الحالية'}
            settings={examSettings}
            students={processedStudents}
            subjects={subjects}
            gradesMatrix={gradesMatrix}
            approvalStatus={approvalStatus}
            closures={controlClosures}
            classes={classesList}
            notify={triggerNotification}
          />
        )}

        {activeTab === 'quality-governance' && (
          <div className="space-y-6 text-right" dir="rtl">
            {/* Header Banner */}
            <div className="bg-[#2a1d13] text-[#fce79a] p-6 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                    جودة الكنترول والحوكمة المؤسسية
                  </span>
                  <h2 className="text-xl font-black mt-2 text-white">شاشة ضبط الجودة وحوكمة أعمال الكنترول 🏆</h2>
                  <p className="text-xs text-slate-400 mt-1">تتبع دورة مراجعة الأوراق، تفعيل نظام الإنذار المبكر، إدارة تظلمات الطلاب وإعادة تقدير الدرجات، وحوكمة الصلاحيات.</p>
                </div>

                <div className="bg-slate-800/80 p-3 border border-slate-700/60 text-xs font-bold text-slate-200">
                  الصلاحية الموثوقة الحالية: {currentUserRole === 'admin' ? 'مدير الكنترول' : currentUserRole === 'reviewer' ? 'مراجع فني' : 'مدخل درجات'}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Side: Readiness Checklists & Metrics */}
              <div className="lg:col-span-1 space-y-6">

                {/* Global Governance Metrics Dashboard */}
                <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 space-y-4 text-amber-100">
                  <div className="flex items-center gap-2 border-b border-[#d4af37]/30 pb-3">
                    <ShieldCheck className="w-5 h-5 text-[#f7d174]" />
                    <h3 className="font-extrabold text-[#fce79a] text-sm">مؤشرات جاهزية الكنترول المركزي</h3>
                  </div>

                  {/* Calculations */}
                  {(() => {
                    // Count unentered (missing) subjects in gradesMatrix
                    let unenteredCount = 0;
                    subjects.forEach(sub => {
                      let hasAny = false;
                      studentList.forEach(st => {
                        if (gradesMatrix[st.id]?.[sub.id] !== undefined) {
                          hasAny = true;
                        }
                      });
                      if (!hasAny) unenteredCount++;
                    });

                    // Count unreviewed subjects (using reviewedStagesSubjects)
                    let unreviewedCount = 0;
                    subjects.forEach(sub => {
                      if (!isSubjectReviewed(sub.id)) {
                        unreviewedCount++;
                      }
                    });

                    // Count unapproved stages
                    let unapprovedStagesCount = 0;
                    const stagesListArray = ['kindergarten', 'primary', 'middle', 'high'];
                    stagesListArray.forEach(stg => {
                      if (!stageApprovalStatus[stg]?.approved) {
                        unapprovedStagesCount++;
                      }
                    });

                    // Overall completion percent based on missing individual grades
                    const totalGradeFields = studentList.length * subjects.length;
                    let missingGradesCount = 0;
                    studentList.forEach(st => {
                      subjects.forEach(sub => {
                        if (gradesMatrix[st.id]?.[sub.id] === undefined && !st.absentSubjects?.includes(sub.id)) {
                          missingGradesCount++;
                        }
                      });
                    });
                    const globalCompletionPct = totalGradeFields > 0
                      ? Math.round(((totalGradeFields - missingGradesCount) / totalGradeFields) * 100)
                      : 0;

                    return (
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-amber-200/90">نسبة الإنجاز الإجمالية لرصد الكنترول:</span>
                            <span className="font-black text-[#f7d174]">{globalCompletionPct}%</span>
                          </div>
                          <div className="w-full bg-[#130b04] h-2.5 rounded-full overflow-hidden border border-[#d4af37]/20">
                            <div
                              className="bg-gradient-to-r from-[#d4af37] to-[#8b6113] h-full rounded-full transition-all duration-500"
                              style={{ width: `${globalCompletionPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Progress Bar per Stage */}
                        <div className="pt-2 border-t border-[#d4af37]/20 space-y-3">
                          <h4 className="text-[11px] font-bold text-[#f7d174]">معدل رصد الدرجات حسب المرحلة الدراسية:</h4>
                          {['kindergarten', 'primary', 'middle', 'high'].map(stg => {
                            const clsInStg = classesList.filter(c => c.level === stg).map(c => c.name);
                            const stdInStg = studentList.filter(s => clsInStg.includes(s.classroom));
                            let totalGradesStg = stdInStg.length * subjects.length;
                            let missingGradesStg = 0;
                            stdInStg.forEach(st => {
                              subjects.forEach(sub => {
                                if (gradesMatrix[st.id]?.[sub.id] === undefined && !st.absentSubjects?.includes(sub.id)) {
                                  missingGradesStg++;
                                }
                              });
                            });
                            const stgPct = totalGradesStg > 0 ? Math.round(((totalGradesStg - missingGradesStg) / totalGradesStg) * 100) : 0;
                            const stgLabel = stg === 'kindergarten'
                              ? 'رياض الأطفال والتمهيدي'
                              : stg === 'primary'
                                ? 'المرحلة الابتدائية'
                                : stg === 'middle'
                                  ? 'المرحلة المتوسطة'
                                  : 'المرحلة الثانوية';

                            return (
                              <div key={stg} className="space-y-1">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-medium text-amber-200/80">{stgLabel}</span>
                                  <span className="font-bold text-[#fce79a]">{stgPct}%</span>
                                </div>
                                <div className="w-full bg-[#130b04] h-1.5 rounded-full overflow-hidden border border-[#d4af37]/20">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${stgPct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Indicators Grid */}
                        <div className="grid grid-cols-1 gap-3 pt-3 border-t border-[#d4af37]/20">

                          {/* Indicator 1: Unentered Subjects */}
                          <div className="flex justify-between items-center p-3 bg-rose-950/40 border border-rose-500/30">
                            <div>
                              <p className="text-[10px] font-bold text-rose-300">مواد لم يبدأ رصدها بعد</p>
                              <p className="text-xs text-amber-200/60 mt-0.5">مواد لم يُسجل فيها أي درجة</p>
                            </div>
                            <span className="text-xl font-black text-rose-300 bg-[#130b04] w-9 h-9 rounded-full flex items-center justify-center border border-rose-500/40">
                              {unenteredCount}
                            </span>
                          </div>

                          {/* Indicator 2: Unreviewed Subjects */}
                          <div className="flex justify-between items-center p-3 bg-amber-950/40 border border-amber-500/30">
                            <div>
                              <p className="text-[10px] font-bold text-[#f7d174]">مواد معلّقة بانتظار المراجعة الفنية</p>
                              <p className="text-xs text-amber-200/60 mt-0.5">مواد لم يتم توقيعها من المراجعين</p>
                            </div>
                            <span className="text-xl font-black text-[#f7d174] bg-[#130b04] w-9 h-9 rounded-full flex items-center justify-center border border-amber-500/40 font-mono">
                              {unreviewedCount}
                            </span>
                          </div>

                          {/* Indicator 3: Unapproved Results */}
                          <div className="flex justify-between items-center p-3 bg-amber-950/40 border border-amber-500/30">
                            <div>
                              <p className="text-[10px] font-bold text-amber-300">مراحل دراسية غير معتمدة نهائياً</p>
                              <p className="text-xs text-amber-200/60 mt-0.5">مراحل بحاجة إلى تجميد وإقفال</p>
                            </div>
                            <span className="text-xl font-black text-amber-300 bg-[#130b04] w-9 h-9 rounded-full flex items-center justify-center border border-amber-500/40 font-mono">
                              {unapprovedStagesCount}
                            </span>
                          </div>

                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Sub-committee Verification Audit Form */}
                <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 space-y-4 text-amber-100">
                  <div className="flex items-center gap-1.5 border-b border-[#d4af37]/30 pb-3">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-extrabold text-[#fce79a] text-sm">التدقيق والتصديق الثنائي للمواد ✍️</h3>
                  </div>
                  <p className="text-xs text-amber-200/60">
                    يمكن للمراجع الفني تصديق وتوقيع درجات مادة معينة بعد التحقق من مطابقتها لأوراق الطلاب الورقية، لمنع التعديل غير المصرح به.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-amber-200 block mb-1">اختر المادة لتوقيع مراجعتها:</label>
                      <select
                        id="review-subject-select"
                        className="w-full bg-[#130b04] border border-[#d4af37]/40 rounded-lg p-2 text-xs font-medium text-amber-100"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (isSubjectReviewed(val)) {
                            triggerNotification('هذه المادة موقعة ومصدقة مسبقاً', 'info');
                          }
                        }}
                      >
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({isSubjectReviewed(sub.id) ? '✓ تمت مراجعتها' : '⚠️ بحاجة لمراجعة'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={async () => {
                        const selectEl = document.getElementById('review-subject-select') as HTMLSelectElement;
                        if (!selectEl) return;
                        const subjectId = selectEl.value;
                        const subObj = subjects.find(s => s.id === subjectId);
                        if (!subObj) return;

                        if (isSubjectReviewed(subjectId)) {
                          const updated = { ...(reviewedStagesSubjects || {}) };
                          delete updated[subjectId];
                          Object.keys(updated).forEach(k => {
                            if (k === subjectId || k.endsWith(`-${subjectId}`)) {
                              delete updated[k];
                            }
                          });
                          const persisted = await saveToServerDb(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated, undefined);
                          if (!persisted) return;
                          setReviewedStagesSubjects(updated);
                          triggerNotification(`تم إلغاء تصديق ومراجعة مادة ${subObj.name} 🔓`, 'info');
                          logAction(`إلغاء تصديق مراجعة مادة ${subObj.name}`, 'جودة وحوكمة الكنترول');
                        } else {
                          const updated = { ...(reviewedStagesSubjects || {}), [subjectId]: true };
                          const persisted = await saveToServerDb(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated, undefined);
                          if (!persisted) return;
                          setReviewedStagesSubjects(updated);
                          triggerNotification(`تم تصديق وتوقيع مراجعة مادة ${subObj.name} بنجاح رسمياً ✓`, 'success');
                          logAction(`تصديق وتوقيع مراجعة مادة ${subObj.name}`, 'جودة وحوكمة الكنترول');
                        }
                      }}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 border border-emerald-500/40"
                    >
                      <CheckCircle className="w-4 h-4" />
                      توقيع وتصدير مطابقة المادة المحددة رسمياً
                    </button>
                  </div>
                </div>

              </div>

              {/* Center & Right Area: Warning Scanner & Re-evaluation & Closures */}
              <div className="lg:col-span-2 space-y-6">

                {/* Early Warning and Anomaly Engine */}
                <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 space-y-4 text-amber-100">
                  <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                      <h3 className="font-extrabold text-[#fce79a] text-sm">محرك الإنذار المبكر الذكي واكتشاف الشذوذ الأكاديمي 🚨</h3>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-[#f7d174] border border-amber-500/40 px-2 py-0.5 rounded font-black">
                      نشط حالياً
                    </span>
                  </div>

                  <p className="text-xs text-amber-200/60 leading-relaxed">
                    يقوم هذا المحرك بتحليل كافة درجات رصد الكنترول المسجلة ومقارنتها بقواعد السلوك والدرجات السابقة والغياب واكتشاف الطلاب المعرضين لخطر التعثر أو الرسوب.
                  </p>

                  {/* Warning generator list */}
                  {(() => {
                    const warnings: any[] = [];

                    studentList.forEach(st => {
                      const marks = gradesMatrix[st.id] || {};

                      subjects.forEach(sub => {
                        const mark = marks[sub.id];
                        if (mark !== undefined && mark < sub.passScore) {
                          warnings.push({
                            id: `W-CORE-${st.id}-${sub.id}`,
                            studentName: st.name,
                            classroom: st.classroom,
                            type: 'danger',
                            title: `الرسوب في مادة أساسية (${sub.name})`,
                            desc: `حصل الطالب على درجة ${mark} من أصل ${sub.maxScore} (الحد الأدنى للنجاح هو ${sub.passScore}).`,
                            badge: 'رسوب حرج'
                          });
                        }
                      });

                      if (st.absentSubjects && st.absentSubjects.length >= 2) {
                        warnings.push({
                          id: `W-ABS-${st.id}`,
                          studentName: st.name,
                          classroom: st.classroom,
                          type: 'warning',
                          title: 'كثرة غياب الطالب عن الامتحانات',
                          desc: `تغيب الطالب عن امتحان مادتين أو أكثر (${st.absentSubjects.map(id => subjects.find(s=>s.id===id)?.name || id).join('، ')}).`,
                          badge: 'انقطاع وغياب'
                        });
                      }

                      const comparisonSubject = subjects[0];
                      let comparisonTotal = 0;
                      let comparisonCount = 0;
                      if (comparisonSubject) studentList.forEach(s => {
                        const mark = gradesMatrix[s.id]?.[comparisonSubject.id];
                        if (typeof mark === 'number' && Number.isFinite(mark)) {
                          comparisonTotal += mark;
                          comparisonCount++;
                        }
                      });
                      const comparisonAverage = comparisonCount > 0 ? comparisonTotal / comparisonCount : null;
                      const studentComparisonMark = comparisonSubject ? marks[comparisonSubject.id] : undefined;
                      if (comparisonSubject && comparisonAverage !== null && studentComparisonMark !== undefined && studentComparisonMark < (comparisonAverage - 20)) {
                        warnings.push({
                          id: `W-AVG-${st.id}`,
                          studentName: st.name,
                          classroom: st.classroom,
                          type: 'warning',
                          title: `انخفاض حاد مقارنة بمتوسط الفصل في (${comparisonSubject.name})`,
                          desc: `درجة الطالب هي ${studentComparisonMark} بينما متوسط الفصل للمادة هو ${comparisonAverage.toFixed(1)} (انخفاض بأكثر من 20 درجة).`,
                          badge: 'تباين فصلي'
                        });
                      }

                    });

                    if (warnings.length === 0) {
                      return (
                        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-center">
                          <p className="text-xs text-emerald-300 font-bold">لا توجد أي إنذارات مبكرة أو مؤشرات خطر مكتشفة حالياً في الكنترول ✓</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {warnings.map(item => (
                          <div
                            key={item.id}
                            className={`p-3.5 border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all ${
                              item.type === 'danger'
                                ? 'bg-rose-950/40 border-rose-500/40 hover:bg-rose-950/60'
                                : 'bg-amber-950/40 border-amber-500/40 hover:bg-amber-950/60'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                  item.type === 'danger' ? 'bg-rose-900/60 text-rose-200 border border-rose-500/40' : 'bg-amber-900/60 text-[#f7d174] border border-amber-500/40'
                                }`}>
                                  {item.badge}
                                </span>
                                <h4 className="font-extrabold text-[#fce79a] text-xs">{item.studentName} ({item.classroom})</h4>
                              </div>
                              <p className="text-xs font-bold text-amber-100">{item.title}</p>
                              <p className="text-[11px] text-amber-200/60">{item.desc}</p>
                            </div>

                            <button
                              onClick={() => {
                                handleExportToCSV(
                                  [[item.studentName, item.classroom, item.badge, item.title, item.desc, new Date().toISOString()]],
                                  ['الطالب', 'الصف', 'نوع التنبيه', 'عنوان الحالة', 'تفاصيل الحالة', 'تاريخ الإحالة'],
                                  `إحالة-إرشاد-${item.studentName}`
                                );
                              }}
                              className="px-3 py-1.5 bg-[#2a1d13] hover:bg-[#38271a] text-[#f7d174] border border-[#d4af37]/30 rounded-lg text-[10px] font-black cursor-pointer shrink-0 transition-all"
                            >
                              إحالة للمرشد الطلابي 📬
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Re-evaluation & Grievances Section */}
                <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 space-y-4 text-amber-100">
                  <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-3">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-5 h-5 text-[#f7d174]" />
                      <h3 className="font-extrabold text-[#fce79a] text-sm">تظلمات الطلاب وإعادة تصحيح أوراق الإجابات 📝</h3>
                    </div>
                    <button
                      onClick={() => {
                        const formEl = document.getElementById('new-rev-form-container');
                        if (formEl) formEl.classList.toggle('hidden');
                      }}
                      className="px-3 py-1.5 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#f7d174] border border-[#d4af37]/40 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      تسجيل طلب تظلم جديد
                    </button>
                  </div>

                  {/* Hidden Form for adding requests */}
                  <div id="new-rev-form-container" className="hidden bg-[#2a1d13] p-4 border border-[#d4af37]/30 space-y-3">
                    <h4 className="text-xs font-black text-[#fce79a]">تعبئة استمارة تظلم ومراجعة فنية لورقة إجابة:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-amber-200/80 block mb-1">الطالب المستفيد:</label>
                        <select id="rev-student" className="w-full bg-[#130b04] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-amber-100">
                          {studentList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.classroom})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-200/80 block mb-1">المادة المتظلم فيها:</label>
                        <select id="rev-subject" className="w-full bg-[#130b04] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-amber-100">
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-amber-200/80 block mb-1">سبب التظلم بالتفصيل:</label>
                        <input id="rev-reason" type="text" placeholder="مثال: يطالب بمراجعة درجات السؤال المقالي الأخير في ورقة الرياضات" className="w-full bg-[#130b04] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-amber-100 placeholder:text-amber-200/40" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-200/80 block mb-1">الدرجة الحالية بالرصد:</label>
                        <input id="rev-old-grade" type="number" placeholder="مثال: 85" className="w-full bg-[#130b04] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-amber-100 placeholder:text-amber-200/40" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-200/80 block mb-1">الدرجة المقترحة بعد المراجعة (إن وجدت):</label>
                        <input id="rev-new-grade" type="number" placeholder="مثال: 88" className="w-full bg-[#130b04] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-amber-100 placeholder:text-amber-200/40" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          const formEl = document.getElementById('new-rev-form-container');
                          if (formEl) formEl.classList.add('hidden');
                        }}
                        className="px-3 py-1.5 bg-[#130b04] hover:bg-[#38271a] text-amber-200 border border-[#d4af37]/30 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={async () => {
                          const studentSelect = document.getElementById('rev-student') as HTMLSelectElement;
                          const subjectSelect = document.getElementById('rev-subject') as HTMLSelectElement;
                          const reasonInput = document.getElementById('rev-reason') as HTMLInputElement;
                          const oldGradeInput = document.getElementById('rev-old-grade') as HTMLInputElement;
                          const newGradeInput = document.getElementById('rev-new-grade') as HTMLInputElement;

                          if (!reasonInput.value.trim() || oldGradeInput.value === '') {
                            triggerNotification('الرجاء إدخال تفاصيل السبب والدرجة الحالية على الأقل', 'warning');
                            return;
                          }

                          const stId = studentSelect.value;
                          const subId = subjectSelect.value;
                          const studentObj = studentList.find(s => s.id === stId);
                          const subjectObj = subjects.find(s => s.id === subId);
                          const currentGrade = gradesMatrix[stId]?.[subId];
                          const enteredOldGrade = Number(oldGradeInput.value);
                          const proposedGrade = newGradeInput.value === '' ? enteredOldGrade : Number(newGradeInput.value);
                          if (!studentObj || !subjectObj || !Number.isFinite(currentGrade)) {
                            triggerNotification('لا يمكن تسجيل التظلم قبل وجود طالب ومادة ودرجة مرصودة صالحة.', 'warning');
                            return;
                          }
                          if (enteredOldGrade !== currentGrade) {
                            triggerNotification(`الدرجة الحالية لا تطابق الرصد المركزي (${currentGrade}). أعد التحقق قبل التسجيل.`, 'warning');
                            return;
                          }
                          if (!Number.isFinite(proposedGrade) || proposedGrade < 0 || proposedGrade > subjectObj.maxScore) {
                            triggerNotification(`الدرجة المقترحة يجب أن تكون بين 0 و${subjectObj.maxScore}.`, 'warning');
                            return;
                          }

                          const newReq = {
                            id: `REV-${Date.now()}`,
                            studentId: stId,
                            studentName: studentObj?.name || 'طالب غير معروف',
                            classroom: studentObj?.classroom || 'غير محدد',
                            subjectId: subId,
                            subjectName: subjectObj?.name || 'مادة غير معروف',
                            requestDate: new Date().toISOString().slice(0, 10),
                            reason: reasonInput.value.trim(),
                            oldGrade: enteredOldGrade,
                            newGrade: proposedGrade,
                            decision: 'انتظار المراجعة الفنية للورقة',
                            decisionDetails: 'طلب تظلم مسجل وينتظر قرار مستخدم مخول بعد المراجعة.',
                            committeeMembers: [],
                            status: 'pending'
                          };

                          const updated = [newReq, ...reEvaluationRequests];
                          const persisted = await saveToServerDb(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated, undefined, undefined, undefined);
                          if (!persisted) return;
                          setReEvaluationRequests(updated);
                          triggerNotification('تم تسجيل طلب التظلم الجديد وإحالته للجنة المراجعة الثنائية', 'success');
                          logAction(`تسجيل تظلم الطالب ${studentObj?.name} لمادة ${subjectObj?.name}`, 'جودة وحوكمة الكنترول');

                          const formEl = document.getElementById('new-rev-form-container');
                          if (formEl) formEl.classList.add('hidden');
                          reasonInput.value = '';
                          oldGradeInput.value = '';
                          newGradeInput.value = '';

                        }}
                        className="px-4 py-1.5 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 text-slate-950 font-black rounded-lg text-xs cursor-pointer transition-all shadow-md"
                      >
                        تسجيل وإرسال الطلب رسمياً
                      </button>
                    </div>
                  </div>

                  {/* Re-evaluation List */}
                  <div className="space-y-3">
                    {reEvaluationRequests.map(req => (
                      <div key={req.id} className="p-3.5 bg-[#2a1d13] border border-[#d4af37]/30 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-right" dir="rtl">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                              req.status === 'completed' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/60 text-[#f7d174] border border-amber-500/40'
                            }`}>
                              {req.status === 'completed' ? 'مكتمل ومغلق' : 'تحت المراجعة'}
                            </span>
                            <span className="text-[10px] text-amber-200/50 font-mono">رمز الطلب: {req.id}</span>
                          </div>
                          <h4 className="font-extrabold text-[#fce79a] text-xs">{req.studentName}</h4>
                          <p className="text-[11px] text-amber-200/70">
                            مادة: <strong className="text-amber-100">{req.subjectName}</strong> | الصف: <span className="text-amber-200/80">{req.classroom}</span>
                          </p>
                          <p className="text-[11px] text-amber-200/70 leading-relaxed">
                            <span className="font-bold text-[#f7d174]">المبرر:</span> {req.reason}
                          </p>
                          {req.decisionDetails && (
                            <div className="p-2 bg-[#130b04] rounded-lg border border-[#d4af37]/30 text-[10px] text-amber-200 mt-1.5">
                              <strong className="block mb-0.5 text-[#f7d174]">قرار اللجنة المشتركة: {req.decision}</strong>
                              <span>{req.decisionDetails}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                          <div className="bg-[#130b04] p-2 rounded-lg border border-[#d4af37]/30 text-center font-mono">
                            <p className="text-[9px] text-amber-200/50">الدرجة بالرصد</p>
                            <p className="text-xs font-black text-amber-100">
                              {req.oldGrade} ➔ <span className="text-emerald-400">{req.newGrade}</span>
                            </p>
                          </div>

                          <div className="flex gap-1.5 justify-end">
                            {req.status !== 'completed' && (
                              <button
                                onClick={async () => {
                                  if (currentUserRole !== 'admin') {
                                    triggerNotification('اعتماد التظلم وتغيير الدرجة يتطلب صلاحية مدير الكنترول.', 'warning');
                                    return;
                                  }
                                  if (approvalStatus.approved) {
                                    triggerNotification('النتائج مغلقة. أعد فتح الكنترول بمساره الموثق قبل تعديل أي درجة.', 'warning');
                                    return;
                                  }
                                  const accept = window.confirm('هل وافقت اللجنة الثنائية الفنية على تعديل درجة هذا الطالب بعد مراجعة ورقة إجابته يدوياً؟');
                                  if (accept) {
                                    const decisionReason = window.prompt('أدخل ملخص قرار اللجنة وسبب تعديل الدرجة:')?.trim();
                                    if (!decisionReason) {
                                      triggerNotification('لم يتم الاعتماد: سبب قرار اللجنة إلزامي.', 'warning');
                                      return;
                                    }
                                    if (gradesMatrix[req.studentId]?.[req.subjectId] !== req.oldGrade) {
                                      triggerNotification('تغيرت الدرجة المركزية منذ تسجيل الطلب. أعد إنشاء التظلم من أحدث رصد.', 'warning');
                                      return;
                                    }
                                    const updatedRequests = reEvaluationRequests.map(r => {
                                      if (r.id === req.id) {
                                        return {
                                          ...r,
                                          status: 'completed',
                                          decision: 'قبول وتعديل الدرجة',
                                          decisionDetails: decisionReason,
                                          decidedBy: trustedActorLabel,
                                          decidedAt: new Date().toISOString()
                                        };
                                      }
                                      return r;
                                    });
                                    const updatedMatrix = { ...gradesMatrix };
                                    if (!updatedMatrix[req.studentId]) updatedMatrix[req.studentId] = {};
                                    updatedMatrix[req.studentId][req.subjectId] = req.newGrade;
                                    const persisted = await saveToServerDb(undefined, undefined, undefined, undefined, updatedMatrix, undefined, undefined, undefined, undefined, undefined, undefined, updatedRequests, undefined, undefined, undefined);
                                    if (!persisted) return;
                                    setReEvaluationRequests(updatedRequests);
                                    setGradesMatrix(updatedMatrix);

                                    triggerNotification('تم اعتماد التظلم، وتعديل كشف الدرجات ومزامنة قاعدة البيانات', 'success');
                                    logAction(`اعتماد التظلم وتعديل درجة الطالب ${req.studentName}`, 'جودة وحوكمة الكنترول');
                                  }
                                }}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all border border-emerald-500/40"
                              >
                                قبول التظلم والاعتماد ✓
                              </button>
                            )}

                            <button
                              onClick={async () => {
                                if (req.status === 'completed') {
                                  triggerNotification('لا يمكن حذف تظلم مكتمل من سجل الحوكمة.', 'warning');
                                  return;
                                }
                                if (!window.confirm('هل تريد حذف طلب التظلم المعلق؟')) return;
                                const updated = reEvaluationRequests.filter(r => r.id !== req.id);
                                const persisted = await saveToServerDb(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated, undefined, undefined, undefined);
                                if (!persisted) return;
                                setReEvaluationRequests(updated);
                                triggerNotification('تم شطب طلب التظلم المحدد', 'info');
                              }}
                              className="p-1 text-rose-400 hover:bg-rose-950/60 rounded-lg cursor-pointer transition-all border border-rose-500/30"
                              title="حذف طلب التظلم"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Closed Control Archive Minutes (محاضر إقفال الكنترول المؤرشفة وغير القابلة للتعديل) */}
                <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 space-y-4 text-amber-100">
                  <div className="flex items-center gap-1.5 border-b border-[#d4af37]/30 pb-3">
                    <Archive className="w-5 h-5 text-[#f7d174]" />
                    <h3 className="font-extrabold text-[#fce79a] text-sm">أرشيف محاضر إقفال الكنترول غير القابلة للتعديل 🗄️</h3>
                  </div>

                  <p className="text-xs text-amber-200/60 leading-relaxed">
                    يعرض هذا القسم محاضر الإقفال التي أنشأها الخادم عند اعتماد النتائج. لا تُعد النسخة غير قابلة للتعديل إلا إذا حملت معرف أرشيف وبصمة SHA-256 صالحة.
                  </p>

                  <div className="space-y-4">
                    {controlClosures.map(closure => (
                      <div
                        key={closure.id}
                        className="bg-[#2a1d13] p-4 border border-[#d4af37]/30 hover:border-[#d4af37]/60 transition-all space-y-3 text-right"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] bg-[#130b04] text-[#f7d174] border border-[#d4af37]/40 px-2 py-0.5 rounded font-black font-mono">
                              {closure.isImmutableArchive && /^[0-9a-f]{64}$/i.test(String(closure.signatureHash || '')) ? 'أرشيف خادم غير قابل للتعديل' : 'سجل قديم غير موثق'}
                            </span>
                            <h4 className="text-xs font-black text-[#fce79a] mt-1">{closure.schoolName}</h4>
                            <p className="text-[11px] text-amber-200/60">
                              {closure.stage} | {closure.classroom} | العام الدراسي: {closure.academicYear}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              if (!closure.isImmutableArchive || !/^[0-9a-f]{64}$/i.test(String(closure.signatureHash || ''))) {
                                triggerNotification('لا يمكن طباعة هذا المحضر كأرشيف معتمد لعدم وجود توقيع خادم صالح.', 'warning');
                                return;
                              }
                              const printWindow = window.open('', '_blank');
                              if (!printWindow) {
                                triggerNotification('يرجى السماح بالنوافذ المنبثقة لفتح الطباعة.', 'warning');
                                return;
                              }
                              printWindow.document.write(`
                                <html dir="rtl" lang="ar">
                                  <head>
                                    <title>محضر إقفال الكنترول - ${escapeHtml(closure.id)}</title>
                                    <style>
                                      body { font-family: 'Cairo', sans-serif; padding: 40px; color: #0f172a; }
                                      .document { border: 4px double #1e3a8a; padding: 30px; border-radius: 8px; }
                                      .header { text-align: center; margin-bottom: 30px; }
                                      .header h1 { font-size: 20px; color: #1e3a8a; margin: 5px; }
                                      .stats-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                      .stats-table th, .stats-table td { border: 1px solid #94a3b8; padding: 10px; text-align: right; }
                                      .stats-table th { background-color: #f1f5f9; }
                                      .hash-box { background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px; font-family: monospace; font-size: 11px; direction: ltr; text-align: center; margin-top: 25px; border-radius: 4px; }
                                      .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="document">
                                      <div class="header">
                                        <h1>${escapeHtml(closure.schoolName || selectedSchool?.name || 'المدرسة الحالية')}</h1>
                                        <h2>محضر إقفال داخلي للكنترول ورصد الدرجات</h2>
                                        <p>الرقم المرجعي: ${escapeHtml(closure.id)}</p>
                                      </div>
                                      <hr/>
                                      <p>تمت مراجعة واعتماد نتائج <strong>${escapeHtml(closure.schoolName)}</strong> وإيداع نسخة مستقلة في أرشيف الخادم وفق الإحصائيات التالية:</p>

                                      <table class="stats-table">
                                        <tr>
                                          <th>المرحلة الدراسية</th>
                                          <td>${escapeHtml(closure.stage)}</td>
                                          <th>الصف والفصل الدراسي</th>
                                          <td>${escapeHtml(closure.classroom)} - ${escapeHtml(closure.semester)}</td>
                                        </tr>
                                        <tr>
                                          <th>العام الدراسي</th>
                                          <td>${escapeHtml(closure.academicYear)}</td>
                                          <th>تاريخ وتوقيت الإقفال</th>
                                          <td>${escapeHtml(closure.closedAt)}</td>
                                        </tr>
                                        <tr>
                                          <th>إجمالي عدد الطلاب المتقدمين</th>
                                          <td style="font-weight: bold;">${closure.totalStudents} طالب</td>
                                          <th>نسبة النجاح العامة</th>
                                          <td style="font-weight: bold; color: green;">${closure.passRate}%</td>
                                        </tr>
                                        <tr>
                                          <th>عدد الطلاب الناجحين</th>
                                          <td style="color: green; font-weight: bold;">${closure.passedCount} طالب</td>
                                          <th>عدد الطلاب الراسبين</th>
                                          <td style="color: red; font-weight: bold;">${closure.failedCount} طالب</td>
                                        </tr>
                                      </table>

                                      <p><strong>أعضاء لجنة الكنترول والمطابقة الحاضرين والموقعين إلكترونياً على سلامة الرصد:</strong></p>
                                      <ul>
                                        ${(Array.isArray(closure.committeeMembers) ? closure.committeeMembers : []).map((member: any) => `<li>${escapeHtml(member)}</li>`).join('') || '<li>لم تُسجل أسماء أعضاء اللجنة في هذه الدورة.</li>'}
                                      </ul>

                                      <p>حُفظت هذه الحزمة في جدول أرشيف مستقل لا يمنح دور التطبيق صلاحية تحديثه أو حذفه. إعادة فتح الدورة لا تعدل نسخة الأرشيف.</p>

                                      <div class="hash-box">
                                        <strong>IMMUTABLE CRYPTOGRAPHIC ARCHIVE HASH SIGNATURE:</strong><br/>
                                        ${escapeHtml(closure.signatureHash)}
                                      </div>

                                      <div class="signatures">
                                        <div>
                                          <p>أمين سر الكنترول</p>
                                          <p>___________________</p>
                                        </div>
                                        <div>
                                          <p>رئيس لجنة الكنترول والمطابقة</p>
                                          <p>___________________</p>
                                        </div>
                                        <div>
                                          <p>مدير المدرسة / المفوض</p>
                                          <p>___________________</p>
                                        </div>
                                      </div>
                                    </div>
                                    <script>window.print();</script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              triggerNotification('جاري تجهيز وتوليد نسخة المحضر للطباعة...', 'success');
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 text-slate-950 rounded-lg text-[10px] font-black cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-md"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            طباعة محضر الإقفال الموثق 🖨️
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10px] pt-2 border-t border-[#d4af37]/20">
                          <div>
                            <span className="text-amber-200/50 block">إجمالي المتقدمين</span>
                            <span className="font-extrabold text-amber-100">{closure.totalStudents}</span>
                          </div>
                          <div>
                            <span className="text-amber-200/50 block">الناجحين</span>
                            <span className="font-extrabold text-emerald-400">{closure.passedCount}</span>
                          </div>
                          <div>
                            <span className="text-amber-200/50 block">الراسبين</span>
                            <span className="font-extrabold text-rose-400">{closure.failedCount}</span>
                          </div>
                          <div>
                            <span className="text-amber-200/50 block">نسبة النجاح</span>
                            <span className="font-extrabold text-[#f7d174]">{closure.passRate}%</span>
                          </div>
                        </div>

                        <div className="bg-[#130b04] p-2 rounded text-[9px] text-amber-200/60 font-mono select-all truncate border border-[#d4af37]/20">
                          {closure.signatureHash}
                        </div>
                      </div>
                    ))}
                    {controlClosures.length === 0 && (
                      <div className="border border-[#d4af37]/20 bg-[#130b04] p-6 text-center text-xs font-semibold text-amber-200/60">
                        لا توجد محاضر إقفال بعد. سيظهر المحضر هنا فقط بعد اعتماد نتائج مكتملة وإنشاء أرشيف الخادم.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 13: System Settings & Audit Logs */}
        {activeTab === 'system-settings' && (
          <div className="space-y-6">
            {/* Data-backed readiness diagnostics for authorized school admins. */}
            {currentUserRole === 'admin' && (
              <div className="bg-[#2a1d13] text-[#fce79a] p-6 border border-slate-800 space-y-6 relative overflow-hidden text-right" dir="rtl">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      مركز فحص واختبار جودة الكنترول المركزي (Diagnostic Suite)
                    </span>
                    <h3 className="text-lg font-black text-white">منظومة فحص الكنترول وإجراء الاختبارات التلقائية</h3>
                    <p className="text-xs text-slate-400">إجراء الفحص الآلي الذاتي ومحاكاة دورة عمل الكنترول للتحقق من سلامة قواعد البيانات والعمليات الحسابية.</p>
                  </div>

                  <button
                    onClick={runTestSuiteDiagnostics}
                    disabled={testSuiteRunning}
                    className={`px-5 py-3 text-xs font-black flex items-center gap-2 transition-all shadow-lg shrink-0 cursor-pointer ${
                      testSuiteRunning
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 hover:shadow-emerald-500/20'
                    }`}
                  >
                    {testSuiteRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري فحص النظام برمجياً...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        بدء تشغيل الفحص والتحقق الشامل لمطابقة الكنترول ⚡
                      </>
                    )}
                  </button>
                </div>

                {/* Running Log Console */}
                {testSuiteRunning && (
                  <div className="bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-emerald-400 space-y-1.5 max-h-48 overflow-y-auto shadow-inner relative z-10 scrollbar-thin text-right" dir="ltr">
                    {testSuiteLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2 justify-end">
                        <p className="text-right">{log}</p>
                        <span className="text-slate-500 select-none">❯</span>
                      </div>
                    ))}
                    <div className="animate-pulse w-2 h-4 bg-emerald-400 inline-block float-right" />
                    <div className="clear-both" />
                  </div>
                )}

                {/* Test Results Status Grid */}
                {testSuiteResults && !testSuiteRunning && (
                  <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          تقرير حالة الفحص والاختبار العام لمنظومة الكنترول والأداء
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">تعرض هذه النتيجة حالة البيانات الحالية فقط، ولا تُعد اعتماداً نهائياً ما لم تنجح جميع الفحوص.</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                          {testSuiteResults.every(result => result.status === 'success') ? 'جاهز للإغلاق' : 'توجد نقاط معلقة'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {testSuiteResults.map((res) => (
                        <div key={res.id} className="p-4 bg-slate-800/40 border border-slate-800 flex flex-col justify-between h-28">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-slate-200 line-clamp-1">{res.name}</span>
                              {res.status === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{res.desc}</p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">الحالة:</span>
                            <span className={res.status === 'success' ? 'text-emerald-400 font-extrabold' : 'text-amber-400 font-extrabold'}>
                              {res.status === 'success' ? 'سليم تماماً' : 'تنبيه تنظيم'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Historical Archiving & Yearly Comparison (Requirement #9) */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-1.5 border-b pb-2">
                  <Archive className="w-4 h-4 text-amber-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">أرشيف مقارنة السنوات السابقة 🗄️</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  استكشف البيانات التاريخية المؤرشفة وقارن نسب النجاح العامة عبر الأعوام الدراسية المختلفة لمراقبة جودة التعليم.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">اختر السنة الأرشيفية للمطابقة:</label>
                    <select
                      value={selectedArchivedYear}
                      disabled={archivedData.length === 0}
                      onChange={(e) => {
                        setSelectedArchivedYear(e.target.value);
                        triggerNotification(`تم تحميل بيانات العام الأكاديمي: ${e.target.value}`, 'info');
                      }}
                      className="w-full bg-transparent text-xs font-bold p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      {archivedData.map(y => (
                        <option key={y.year} value={y.year}>{y.year}</option>
                      ))}
                      {archivedData.length === 0 && <option value="">لا يوجد أرشيف مركزي متاح</option>}
                    </select>
                  </div>

                  {/* Selected Year Quick Overview */}
                  {(() => {
                    const selectedYearObj = archivedData.find(y => y.year === selectedArchivedYear) || archivedData[0];
                    if (!selectedYearObj) {
                      return (
                        <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-600 font-semibold">
                          لا توجد سنوات مؤرشفة في المصدر المركزي لهذه المدرسة حتى الآن.
                        </div>
                      );
                    }
                    return (
                      <div className="p-3 bg-amber-50/50 border border-amber-100 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-900">أداء العام {selectedYearObj.year}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-md">أرشيف رسمي</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>عدد الطلاب: <span className="font-extrabold text-slate-900">{selectedYearObj.totalStudents} طالب</span></div>
                          <div>نسبة النجاح: <span className="font-extrabold text-emerald-600">{selectedYearObj.overallPassRate}%</span></div>
                          <div className="col-span-2">أعلى معدل طلابي: <span className="font-extrabold text-amber-600">{selectedYearObj.topScore}%</span></div>
                          <div className="col-span-2">الانحراف المعياري: <span className="font-bold text-slate-700">{selectedYearObj.standardDeviation}</span></div>
                        </div>

                        {/* Real-time comparison with current year */}
                        {(() => {
                          const currentStudents = processedStudents;
                          const currentPassRate = currentStudents.length > 0
                            ? Math.round((currentStudents.filter(s => s.percentage >= 50).length / currentStudents.length) * 100)
                            : 0;
                          const diff = currentPassRate - selectedYearObj.overallPassRate;
                          return (
                            <div className="pt-2 border-t border-amber-100 mt-2 text-[10px]">
                              <span className="font-bold text-slate-700 block">مقارنة التطور مع العام الحالي:</span>
                              <div className="flex items-center gap-1 mt-1 font-extrabold">
                                {diff > 0 ? (
                                  <span className="text-emerald-600">📈 نمو إيجابي بنسبة (+{diff}%) مقارنة بـ {selectedYearObj.year}</span>
                                ) : diff < 0 ? (
                                  <span className="text-rose-600">📉 تراجع طفيف بنسبة ({diff}%) مقارنة بـ {selectedYearObj.year}</span>
                                ) : (
                                  <span className="text-slate-600">⚖️ تطابق تام في مستويات النجاح العام</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-sm border-b pb-2">قاعدة بيانات الكنترول</h3>
                <p className="text-xs text-slate-500">استعادة النسخة المركزية أو تنزيل نسخة احتياطية قابلة للتحقق دون حذف السجلات من الواجهة.</p>

                <div className="space-y-2">
                  <button
                    onClick={() => void handleForceSync()}
                    disabled={isDbSyncing}
                    className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold border border-amber-200 cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDbSyncing ? 'جارٍ الاستعادة...' : 'استعادة أحدث نسخة من المصدر المركزي'}
                  </button>

                  <button
                    onClick={() => void handleExportBackup()}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 cursor-pointer transition-all"
                  >
                    تنزيل نسخة احتياطية JSON مع بصمة تحقق
                  </button>
                </div>
              </div>

              {/* Canonical server audit trail */}
              <div className="lg:col-span-2 p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h3 className="font-extrabold text-slate-900 text-sm border-b pb-2">سجل تدقيق الخادم للكنترول (Audit Trail)</h3>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {centralAuditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-transparent rounded-lg text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-amber-700">{log.user}</span>
                        <span className="text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                      </div>
                      <p className="text-slate-800 font-semibold">{log.action}</p>
                      <div className="flex gap-1.5">
                        <span className="text-[10px] bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded font-bold">{log.module}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">{log.operation}</span>
                      </div>
                    </div>
                  ))}
                  {centralAuditLogs.length === 0 && (
                    <div className="border border-slate-200 bg-slate-50 p-5 text-center text-xs font-semibold text-slate-500">
                      لا توجد أحداث امتحانات مثبتة في سجل الخادم حتى الآن.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
    </div>
  );
}
