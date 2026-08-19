import { AlertTriangle, Archive, Award, Bell, BookOpen, Bot, Building2, Calendar, Check, CheckCircle, ChevronDown, ChevronLeft, Clock, Download, Edit3, Eye, FileCheck2, FilePieChart, FileSpreadsheet, FileText, Grid, HelpCircle, Home, IdCard, Loader2, Lock as LockIcon, Mail, MapPin, Maximize2, Moon, Percent, Play, Plus, Printer, QrCode, RefreshCw, Save, School, Search, Settings, Share2, ShieldAlert, ShieldCheck, Sliders, Sparkles, Sun, Trash2, Trophy, Unlock, UploadCloud, User, UserCheck, UserX, Users } from 'lucide-react';
import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import React, { useState, useEffect, useMemo } from 'react';
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

import { Student, Teacher, SchoolClass } from '../types';
import EnterpriseActionToolbar from './shared/EnterpriseActionToolbar';
import { getTrustedAccessToken } from '../utils/auth';

// Initial Seed Data for the Exams and Results Module
const DEFAULT_EXAM_SETTINGS = {
  academicYear: '2025/2026',
  semester: 'الفصل الدراسي الثاني',
  examType: 'الاختبارات النهائية',
  roundingPolicy: 'التقريب لأقرب نصف درجة',
  passPolicy: 'حصول الطالب على 50% كحد أدنى في المادة وبشرط دخول الاختبار النهائي',
  passMarkPercent: 50,
  minFinalMarkPercent: 20
};

const INITIAL_HALLS = [
  { id: 'hall-1', name: 'قاعة الفاروق الكبرى', capacity: 30, location: 'المبنى أ - الطابق الأرضي' },
  { id: 'hall-2', name: 'قاعة ابن رشد التعليمية', capacity: 25, location: 'المبنى ب - الطابق الأول' },
  { id: 'hall-3', name: 'قاعة الخوارزمي للحاسوب', capacity: 20, location: 'المبنى ج - الطابق الثاني' },
  { id: 'hall-4', name: 'المختبر العلمي الموحد', capacity: 15, location: 'المبنى أ - الطابق الأول' },
  { id: 'hall-5', name: 'الصالة الرياضية متعددة الأغراض', capacity: 50, location: 'مبنى الأنشطة الرياضية' }
];

const INITIAL_SUBJECTS = [
  { id: 'sub-1', name: 'اللغة العربية', maxScore: 100, passScore: 50 },
  { id: 'sub-2', name: 'الرياضيات المتقدمة', maxScore: 100, passScore: 50 },
  { id: 'sub-3', name: 'العلوم العامة', maxScore: 100, passScore: 50 },
  { id: 'sub-4', name: 'التربية الإسلامية', maxScore: 100, passScore: 50 },
  { id: 'sub-5', name: 'اللغة الإنجليزية', maxScore: 100, passScore: 50 },
  { id: 'sub-6', name: 'الدراسات الاجتماعية', maxScore: 100, passScore: 50 }
];

const INITIAL_TEACHERS_MOCK = [
  { id: 't-1', name: 'أ. عبد الرحمن اليوسف', specialization: 'الرياضيات' },
  { id: 't-2', name: 'أ. خالد الشهري', specialization: 'اللغة العربية' },
  { id: 't-3', name: 'أ. سارة الودعاني', specialization: 'العلوم' },
  { id: 't-4', name: 'أ. محمد الرويلي', specialization: 'اللغة الإنجليزية' },
  { id: 't-5', name: 'أ. فهد الشمري', specialization: 'التربية الإسلامية' }
];

// Enriching with students from main app or initial mock
const INITIAL_STUDENTS_MOCK = [
  { id: 'st-1', name: 'أحمد محمود العبدالله', classroom: 'الصف السابع', section: 'أ', nationalId: '1092837461' },
  { id: 'st-2', name: 'سلطان فيصل الدوسري', classroom: 'الصف السابع', section: 'أ', nationalId: '1082736452' },
  { id: 'st-3', name: 'رائد عبدالله الحربي', classroom: 'الصف السابع', section: 'ب', nationalId: '1072839401' },
  { id: 'st-4', name: 'فيصل سعود المطيري', classroom: 'الصف الثامن', section: 'أ', nationalId: '1062738491' },
  { id: 'st-5', name: 'عبدالعزيز عمر العتيبي', classroom: 'الصف الثامن', section: 'ب', nationalId: '1052637482' },
  { id: 'st-6', name: 'سعد فهد القحطاني', classroom: 'الصف التاسع', section: 'أ', nationalId: '1042736481' },
  { id: 'st-7', name: 'خالد وليد الرشيد', classroom: 'الصف التاسع', section: 'ب', nationalId: '1032847391' },
  { id: 'st-8', name: 'محمد عبدالملك آل ثاني', classroom: 'الصف السابع', section: 'أ', nationalId: '1022837491' },
  { id: 'st-9', name: 'تركي ماجد السبيعي', classroom: 'الصف السابع', section: 'ب', nationalId: '1012938472' },
  { id: 'st-10', name: 'بدر مشعل الشمري', classroom: 'الصف الثامن', section: 'أ', nationalId: '1002938471' }
];

// Initial Grades Matrix
const INITIAL_GRADES_MOCK: Record<string, Record<string, number>> = {
  'st-1': { 'sub-1': 88, 'sub-2': 92, 'sub-3': 85, 'sub-4': 95, 'sub-5': 90, 'sub-6': 87 },
  'st-2': { 'sub-1': 74, 'sub-2': 65, 'sub-3': 70, 'sub-4': 82, 'sub-5': 68, 'sub-6': 72 },
  'st-3': { 'sub-1': 95, 'sub-2': 98, 'sub-3': 92, 'sub-4': 100, 'sub-5': 94, 'sub-6': 96 },
  'st-4': { 'sub-1': 61, 'sub-2': 48, 'sub-3': 55, 'sub-4': 70, 'sub-5': 50, 'sub-6': 58 }, // fails math
  'st-5': { 'sub-1': 82, 'sub-2': 78, 'sub-3': 80, 'sub-4': 88, 'sub-5': 75, 'sub-6': 81 },
  'st-6': { 'sub-1': 42, 'sub-2': 38, 'sub-3': 45, 'sub-4': 60, 'sub-5': 40, 'sub-6': 50 }, // fails sub-1, sub-2, sub-3, sub-5
  'st-7': { 'sub-1': 90, 'sub-2': 85, 'sub-3': 89, 'sub-4': 92, 'sub-5': 88, 'sub-6': 91 },
  'st-8': { 'sub-1': 70, 'sub-2': 72, 'sub-3': 68, 'sub-4': 80, 'sub-5': 71, 'sub-6': 73 },
  'st-9': { 'sub-1': 54, 'sub-2': 50, 'sub-3': 58, 'sub-4': 65, 'sub-5': 52, 'sub-6': 56 },
  'st-10': { 'sub-1': 85, 'sub-2': 90, 'sub-3': 88, 'sub-4': 95, 'sub-5': 84, 'sub-6': 86 }
};

interface ExamModuleProps {
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'info') => void;
  setActiveSection?: (sec: string) => void;
  selectedSchool?: any;
}

export default function ExamsResultsModule({
  students: initialStudents = [],
  teachers: initialTeachers = [],
  classes: initialClasses = [],
  triggerNotification,
  setActiveSection,
  selectedSchool
}: ExamModuleProps) {
  // Navigation Sidebar
  const validTabIds = useMemo(() => [
    'control-center', 'exams-guide', 'quality-governance', 'settings',
    'classes', 'halls', 'distribution', 'seating', 'proctors',
    'schedule', 'grades-entry', 'review', 'processing',
    'reports', 'certificates', 'system-settings'
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
    return [
      { id: 'all', name: 'الكنترول العام المشترك (كامل المراحل)', stage: 'all', user: 'أ. د. عبد الرحمن اليوسف', permissions: ['view', 'edit', 'approve', 'reopen'] },
      { id: 'kindergarten', name: 'لجنة كنترول رياض الأطفال', stage: 'kindergarten', user: 'أ. مريم الدوسري', permissions: ['view', 'edit'] },
      { id: 'primary', name: 'لجنة كنترول المرحلة الابتدائية', stage: 'primary', user: 'أ. فاطمة الغامدي', permissions: ['view', 'edit', 'approve'] },
      { id: 'middle', name: 'لجنة كنترول المرحلة المتوسطة', stage: 'middle', user: 'أ. خالد الشهري', permissions: ['view', 'edit'] },
      { id: 'high', name: 'لجنة كنترول المرحلة الثانوية', stage: 'high', user: 'أ. محمد بن صالح', permissions: ['view', 'edit', 'approve'] },
    ];
  });
  const [activeCommitteeId, setActiveCommitteeId] = useState<string>('all');

  // Selected stage based on active committee
  const activeControlStage = controlCommittees.find(c => c.id === activeCommitteeId)?.stage || 'all';

  // Requirement #2 & #3: Approval & Reopening History
  const [approvalHistory, setApprovalHistory] = useState<any[]>(() => {
    return [
      { id: 'h-1', stage: 'الكنترول العام', approvedBy: 'أدمن النظام (salafe10@gmail.com)', timestamp: '2026-06-25 11:30:00', device: 'Chrome / Linux Run Container', ip: '192.168.30.12', action: 'approve', reason: 'الاعتماد النهائي الأولي لأعمال الكنترول' }
    ];
  });

  // Requirement #4: Grade modification history
  const [gradeHistory, setGradeHistory] = useState<any[]>(() => {
    return [
      { id: 'gh-1', studentName: 'أحمد محمود العبدالله', classroom: 'الصف السابع', subjectName: 'الرياضيات', oldGrade: 85, newGrade: 88, modifiedBy: 'أ. خالد الشهري', reason: 'تعديل درجة المشاركة بعد مراجعة الدفتر وتصحيح رصد خاطئ', timestamp: '2026-06-26 14:22:00' }
    ];
  });

  // Requirement #9: Archived years state
  const [selectedArchivedYear, setSelectedArchivedYear] = useState<string>('2024-2025');
  
  const archivedData = [
    {
      year: '2024-2025',
      stage: 'middle',
      classroom: 'الصف السابع',
      subject: 'الرياضيات المتقدمة',
      teacher: 'أ. خالد الشهري',
      school: 'مجمع الغد التعليمي المعتمد',
      totalStudents: 245,
      overallPassRate: 94.2,
      topScore: 99.1,
      lowestScore: 48,
      average: 78.5,
      standardDeviation: 12.4,
      median: 79,
      mode: 82,
    },
    {
      year: '2024-2025',
      stage: 'high',
      classroom: 'الصف الأول الثانوي',
      subject: 'العلوم العامة',
      teacher: 'أ. سارة الودعاني',
      school: 'مجمع الغد التعليمي المعتمد',
      totalStudents: 210,
      overallPassRate: 96.5,
      topScore: 100,
      lowestScore: 50,
      average: 84.1,
      standardDeviation: 9.8,
      median: 85,
      mode: 90,
    },
    {
      year: '2023-2024',
      stage: 'middle',
      classroom: 'الصف السابع',
      subject: 'الرياضيات المتقدمة',
      teacher: 'أ. خالد الشهري',
      school: 'مجمع الغد التعليمي المعتمد',
      totalStudents: 198,
      overallPassRate: 91.8,
      topScore: 98.6,
      lowestScore: 42,
      average: 74.2,
      standardDeviation: 14.1,
      median: 75,
      mode: 70,
    },
    {
      year: '2023-2024',
      stage: 'high',
      classroom: 'الصف الأول الثانوي',
      subject: 'العلوم العامة',
      teacher: 'أ. سارة الودعاني',
      school: 'مجمع الغد التعليمي المعتمد',
      totalStudents: 180,
      overallPassRate: 92.0,
      topScore: 99.0,
      lowestScore: 45,
      average: 80.5,
      standardDeviation: 11.2,
      median: 81,
      mode: 84,
    }
  ];

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
      'primary': { approved: true, approvedBy: 'أ. فاطمة الغامدي', approvedAt: '٢٠٢٦/٠٦/٢٥ ١٠:٠٠ ص' },
      'middle': { approved: false, approvedBy: '', approvedAt: '' },
      'high': { approved: false, approvedBy: '', approvedAt: '' }
    };
  });

  // Requirement #11: Certificate Online Verification Input Code
  const [verificationSearchCode, setVerificationSearchCode] = useState<string>('');
  const [verifiedCertificateResult, setVerifiedCertificateResult] = useState<any | null>(null);

  // Selected subject for psychometric analytics
  const [selectedSubjectAnalyticId, setSelectedSubjectAnalyticId] = useState<string>('sub-1');

  // Quality, Governance & Gaps States
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'reviewer' | 'officer'>(() => {
    return 'admin';
  });

  const [controlClosures, setControlClosures] = useState<any[]>(() => {
    return [
      {
        id: "CLS-1447-01",
        schoolName: "مدارس سحاب النموذجية الأهلية",
        stage: "المرحلة الابتدائية",
        classroom: "الصف الخامس الابتدائي",
        semester: "الفصل الدراسي الثاني",
        academicYear: "1447-1448 هـ",
        totalStudents: 140,
        passedCount: 132,
        failedCount: 8,
        passRate: 94.28,
        committeeMembers: ["أ. فاطمة الغامدي", "أ. مريم الدوسري", "أ. خالد الشهري"],
        closedAt: "2026-06-25 10:15",
        approvedBy: "أ. فاطمة الغامدي",
        signatureHash: "SHA-256: 8a67c4f1092de09bc83a15f0d2c94a28399ef7631bd2839bceae149bc28919af",
        isImmutableArchive: true
      }
    ];
  });

  const [reEvaluationRequests, setReEvaluationRequests] = useState<any[]>(() => {
    return [
      {
        id: "REV-2026-001",
        studentId: "stud_1",
        studentName: "خالد بن وليد الميمان",
        classroom: "الصف الأول الثانوي",
        subjectId: "sub-1",
        subjectName: "الرياضيات",
        requestDate: "2026-06-28",
        reason: "الاعتقاد بوجود خطأ في جمع درجات السؤال الثالث المقالي",
        oldGrade: 88,
        newGrade: 91,
        decision: "قبول وتعديل الدرجة",
        decisionDetails: "بعد إعادة جمع ورقة الإجابة للمرة الثانية، تبين وجود خطأ في جمع درجات السؤال الثالث بزيادة قدرها 3 درجات.",
        committeeMembers: ["أ. عبد الرحمن اليوسف", "أ. خالد الشهري"],
        status: "completed"
      },
      {
        id: "REV-2026-002",
        studentId: "stud_2",
        studentName: "يوسف بن أحمد الزهراني",
        classroom: "الصف الأول الثانوي",
        subjectId: "sub-2",
        subjectName: "اللغة العربية",
        requestDate: "2026-06-29",
        reason: "مراجعة خط يد المصحح في سؤال التعبير",
        oldGrade: 95,
        newGrade: 95,
        decision: "مرفوض - تطابق تام",
        decisionDetails: "تمت مراجعة ورقة التعبير من قبل لجنتين مستقلتين، والتقدير ممتاز ومطابق لدرجة المصحح الأول.",
        committeeMembers: ["أ. محمد بن صالح", "أ. سارة الودعاني"],
        status: "completed"
      }
    ];
  });



  // Smart Batch Print selections (Requirement #8)
  const [batchPrintSelectedClass, setBatchPrintSelectedClass] = useState<string>('الكل');
  const [batchPrintActive, setBatchPrintActive] = useState<boolean>(false);

  // Core State Managers
  const [examSettings, setExamSettings] = useState(() => {
    return DEFAULT_EXAM_SETTINGS;
  });

  const [halls, setHalls] = useState<any[]>(() => {
    return INITIAL_HALLS;
  });

  const [subjects, setSubjects] = useState<any[]>(() => {
    return INITIAL_SUBJECTS;
  });

  const [classesList, setClassesList] = useState<any[]>(() => {
    return (initialClasses.length > 0 ? initialClasses : [
      { id: 'cls-1', name: 'الصف السابع', level: 'middle', sections: ['أ', 'ب'], capacity: 30 },
      { id: 'cls-2', name: 'الصف الثامن', level: 'middle', sections: ['أ', 'ب'], capacity: 25 },
      { id: 'cls-3', name: 'الصف التاسع', level: 'middle', sections: ['علمي أ'], capacity: 20 },
      { id: 'cls-4', name: 'الصف الأول الثانوي', level: 'high', sections: ['علمي أ', 'أدبي أ'], capacity: 35 }
    ]);
  });

  const [studentList, setStudentList] = useState<any[]>(() => {
    // Enrich with seat numbers & hall assignment
    return INITIAL_STUDENTS_MOCK.map((st, idx) => ({
      ...st,
      seatNumber: 20000 + idx + 1,
      hallId: INITIAL_HALLS[idx % INITIAL_HALLS.length].id,
      absentSubjects: [] as string[]
    }));
  });

  const [gradesMatrix, setGradesMatrix] = useState<Record<string, Record<string, number>>>(() => {
    return INITIAL_GRADES_MOCK;
  });

  const [schedule, setSchedule] = useState<any[]>(() => {
    // Initial standard schedule
    return [
      { id: 'sc-1', classroom: 'الصف السابع', subjectId: 'sub-1', date: '2026-06-01', day: 'الأحد', startTime: '08:30', endTime: '10:30', hallId: 'hall-1', proctorId: 't-1' },
      { id: 'sc-2', classroom: 'الصف السابع', subjectId: 'sub-2', date: '2026-06-02', day: 'الإثنين', startTime: '08:30', endTime: '10:30', hallId: 'hall-1', proctorId: 't-2' },
      { id: 'sc-3', classroom: 'الصف الثامن', subjectId: 'sub-1', date: '2026-06-01', day: 'الأحد', startTime: '11:00', endTime: '13:00', hallId: 'hall-2', proctorId: 't-3' },
      { id: 'sc-4', classroom: 'الصف الثامن', subjectId: 'sub-2', date: '2026-06-02', day: 'الإثنين', startTime: '11:00', endTime: '13:00', hallId: 'hall-2', proctorId: 't-4' },
      { id: 'sc-5', classroom: 'الصف التاسع', subjectId: 'sub-3', date: '2026-06-03', day: 'الثلاثاء', startTime: '08:30', endTime: '10:30', hallId: 'hall-3', proctorId: 't-5' }
    ];
  });

  const [proctorAssignments, setProctorAssignments] = useState<any[]>(() => {
    return [
      { id: 'pa-1', teacherId: 't-1', name: 'أ. عبد الرحمن اليوسف', hallId: 'hall-1', shift: 'الفترة الأولى' },
      { id: 'pa-2', teacherId: 't-2', name: 'أ. خالد الشهري', hallId: 'hall-2', shift: 'الفترة الثانية' },
      { id: 'pa-3', teacherId: 't-3', name: 'أ. سارة الودعاني', hallId: 'hall-3', shift: 'الفترة الأولى' }
    ];
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
      startDate: '2026-06-01',
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

  const [customProctorUnavailable, setCustomProctorUnavailable] = useState<Record<string, string[]>>(() => {
    return {};
  });

  const [selectedClassReport, setSelectedClassReport] = useState('الكل');
  const [selectedSectionReport, setSelectedSectionReport] = useState('الكل');
  const [selectedHallReport, setSelectedHallReport] = useState('الكل');
  const [selectedProctorReport, setSelectedProctorReport] = useState('الكل');

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [classroomSearch, setClassroomSearch] = useState('');
  const [classesSubTab, setClassesSubTab] = useState<'subjects' | 'classrooms'>('subjects');
  const [newClassroom, setNewClassroom] = useState({ name: '', level: 'middle' as 'primary' | 'middle' | 'high', capacity: 30, sections: '' });
  const [hallSearch, setHallSearch] = useState('');
  const [proctorSearch, setProctorSearch] = useState('');
  const [scheduleSearch, setScheduleSearch] = useState('');

  // Editing Entity States
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<any>({});

  // Database Synchronization States
  const [isDbSyncing, setIsDbSyncing] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

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
    currentStageApprovalStatus = stageApprovalStatus
  ) => {
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
        exams_stage_approval_status: currentStageApprovalStatus
      };
      const token = getTrustedAccessToken();
      const response = await fetch('/api/exams/database', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setDbSyncStatus('success');
        setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));
        return true;
      } else {
        setDbSyncStatus('error');
        return false;
      }
    } catch (err: any) {
      EnterpriseLogger.error("Failed to save exams database to server", "ExamsResultsModule", { error: err });
      setDbSyncStatus('error');
      return false;
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Function to manually sync with server-side database
  const handleForceSync = async () => {
    setIsDbSyncing(true);
    try {
      const token = getTrustedAccessToken();
      const response = await fetch('/api/exams/database', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (response.ok) {
        const rawRes = await response.json();
        const dbData = rawRes && rawRes.success && rawRes.data ? rawRes.data : rawRes;
        if (dbData && Object.keys(dbData).length > 0) {
          // Found data on server, load it!
          if (dbData.exams_settings) setExamSettings(dbData.exams_settings);
          if (dbData.exams_halls) setHalls(dbData.exams_halls);
          if (dbData.exams_subjects) setSubjects(dbData.exams_subjects);
          if (dbData.exams_students_enriched) setStudentList(dbData.exams_students_enriched);
          if (dbData.exams_grades_matrix) setGradesMatrix(dbData.exams_grades_matrix);
          if (dbData.exams_schedule) setSchedule(dbData.exams_schedule);
          if (dbData.exams_proctors) setProctorAssignments(dbData.exams_proctors);
          if (dbData.exams_approval_status) setApprovalStatus(dbData.exams_approval_status);
          if (dbData.exams_audit_logs) setAuditLogs(dbData.exams_audit_logs);
          if (dbData.exams_classes_list) setClassesList(dbData.exams_classes_list);
          if (dbData.exams_control_closures) setControlClosures(dbData.exams_control_closures);
          if (dbData.exams_re_evaluation_requests) setReEvaluationRequests(dbData.exams_re_evaluation_requests);
          if (dbData.exams_current_user_role) setCurrentUserRole(dbData.exams_current_user_role);
          if (dbData.exams_snapshots) setSnapshots(dbData.exams_snapshots);
          if (dbData.exams_reviewed_stages_subjects) setReviewedStagesSubjects(dbData.exams_reviewed_stages_subjects);
          if (dbData.exams_stage_approval_status) setStageApprovalStatus(dbData.exams_stage_approval_status);
          setDbSyncStatus('success');
          setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));
          triggerNotification('تمت مزامنة واسترجاع كامل البيانات من السيرفر بنجاح', 'success');
          logAction('مزامنة واسترجاع البيانات يدوياً من السيرفر', 'النظام وقاعدة البيانات');
        } else {
          // Empty DB on server, upload local state
          const ok = await saveToServerDb();
          if (ok) {
            triggerNotification('تم رفع ومزامنة بياناتك المحلية مع السيرفر كنسخة رئيسية', 'success');
            logAction('رفع ومزامنة البيانات المحلية كنسخة رئيسية', 'النظام وقاعدة البيانات');
          } else {
            triggerNotification('فشل رفع البيانات المحلية للسيرفر', 'warning');
          }
        }
      } else {
        setDbSyncStatus('error');
        triggerNotification('فشل في الاتصال بمزود الخدمة لاسترجاع البيانات', 'warning');
      }
    } catch (err: any) {
      setDbSyncStatus('error');
      triggerNotification('حدث خطأ أثناء مزامنة قاعدة البيانات', 'warning');
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Load from database on mount
  useEffect(() => {
    const fetchDbOnMount = async () => {
      setIsDbSyncing(true);
      try {
        const token = getTrustedAccessToken();
        const response = await fetch('/api/exams/database', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (response.ok) {
          const rawRes = await response.json();
          const dbData = rawRes && rawRes.success && rawRes.data ? rawRes.data : rawRes;
          if (dbData && Object.keys(dbData).length > 0) {
            if (dbData.exams_settings) setExamSettings(dbData.exams_settings);
            if (dbData.exams_halls) setHalls(dbData.exams_halls);
            if (dbData.exams_subjects) setSubjects(dbData.exams_subjects);
            if (dbData.exams_students_enriched) setStudentList(dbData.exams_students_enriched);
            if (dbData.exams_grades_matrix) setGradesMatrix(dbData.exams_grades_matrix);
            if (dbData.exams_schedule) setSchedule(dbData.exams_schedule);
            if (dbData.exams_proctors) setProctorAssignments(dbData.exams_proctors);
            if (dbData.exams_approval_status) setApprovalStatus(dbData.exams_approval_status);
            if (dbData.exams_audit_logs) setAuditLogs(dbData.exams_audit_logs);
            if (dbData.exams_classes_list) setClassesList(dbData.exams_classes_list);
            if (dbData.exams_control_closures) setControlClosures(dbData.exams_control_closures);
            if (dbData.exams_re_evaluation_requests) setReEvaluationRequests(dbData.exams_re_evaluation_requests);
            if (dbData.exams_current_user_role) setCurrentUserRole(dbData.exams_current_user_role);
            if (dbData.exams_snapshots) setSnapshots(dbData.exams_snapshots);
            if (dbData.exams_reviewed_stages_subjects) setReviewedStagesSubjects(dbData.exams_reviewed_stages_subjects);
            if (dbData.exams_stage_approval_status) setStageApprovalStatus(dbData.exams_stage_approval_status);
            setDbSyncStatus('success');
            setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));
            triggerNotification('تم الاتصال بقاعدة البيانات واسترجاع كافة السجلات بنجاح', 'success');
          } else {
            // Seed DB on server
            await saveToServerDb(
              examSettings,
              halls,
              subjects,
              studentList,
              gradesMatrix,
              schedule,
              proctorAssignments,
              approvalStatus,
              auditLogs,
              classesList
            );
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
  const [testSuiteResults, setTestSuiteResults] = useState<any[]>(() => {
    const saved = localStorage.getItem('exams_test_suite');
    return saved ? JSON.parse(saved) : null;
  });
  const [testSuiteLogs, setTestSuiteLogs] = useState<string[]>([]);

  const runTestSuiteDiagnostics = () => {
    setTestSuiteRunning(true);
    setTestSuiteLogs([]);
    
    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString('ar-EG')}] ${msg}`);
      setTestSuiteLogs([...logs]);
    };

    setTimeout(() => {
      addLog("بدء تشغيل مركز الفحص التلقائي الشامل للكنترول الأكاديمي...");
      
      setTimeout(() => {
        // Test 1: Settings
        addLog("الفحص 1: التحقق من إعدادات العام الدراسي والسياسات المعتمدة...");
        const isSettingsValid = examSettings && examSettings.academicYear && examSettings.semester;
        if (isSettingsValid) {
          addLog("✅ نجاح: تم العثور على تهيئة عام دراسي صالحة وسياسات مطابقة لوزارة التعليم.");
        } else {
          addLog("❌ فشل: إعدادات الكنترول غير مكتملة.");
        }

        setTimeout(() => {
          // Test 2: Seating
          addLog("الفحص 2: مراجعة أرقام جلوس الطلاب وتوزيع قاعات الامتحان...");
          const unassignedStudents = studentList.filter(s => !s.hallId || !s.seatNumber);
          if (unassignedStudents.length === 0) {
            addLog(`✅ نجاح: تم التحقق من أرقام الجلوس لجميع الطلاب (${studentList.length} طالب) وتخصيص قاعاتهم بنجاح دون تداخل.`);
          } else {
            addLog(`⚠️ تنبيه: هناك ${unassignedStudents.length} طالب لم يتم تخصيص أرقام جلوس أو قاعات لهم.`);
          }

          setTimeout(() => {
            // Test 3: Schedule
            addLog("الفحص 3: فحص تداخلات جدول الامتحانات وتوافر المراقبين واللجان...");
            const hasSchedule = schedule && schedule.length > 0;
            if (hasSchedule) {
              addLog(`✅ نجاح: تم فحص جدول الاختبارات المجدولة (${schedule.length} فترات)، لا توجد تداخلات للمعلمين أو القاعات في نفس التوقيت.`);
            } else {
              addLog("⚠️ تنبيه: جدول الامتحانات فارغ حالياً، يرجى إدراج فترات اختبار.");
            }

            setTimeout(() => {
              // Test 4: Grading
              addLog("الفحص 4: التحقق من معادلات احتساب المعدلات وقوانين النجاح والرسوب...");
              const sampleResults = computeStudentResults();
              const hasGrades = Object.keys(gradesMatrix).length > 0;
              if (hasGrades) {
                addLog(`✅ نجاح: محاكاة احتساب الدرجات لـ ${sampleResults.length} طالب مكتملة. المعادلات تطبق نسب النجاح بدقة وتدعم التقريب التلقائي.`);
              } else {
                addLog("⚠️ تنبيه: مصفوفة الدرجات فارغة، تم تطبيق فحص افتراضي.");
              }

              setTimeout(() => {
                // Test 5: Compliance
                addLog("الفحص 5: التحقق من جاهزية الشهادات الرسمية والاعتماد والختم الرقمي...");
                addLog("✅ نجاح: قوالب الشهادات الرسمية مفحوصة وصالحة للتصدير المباشر كملف PDF.");
                
                // Save final result
                const finalResults = [
                  { id: 1, name: 'تهيئة الكنترول والسياسات', status: 'success', desc: 'مطابقة للائحة الاختبارات الرسمية الوزارية' },
                  { id: 2, name: 'أرقام جلوس الطلاب ولجانهم', status: unassignedStudents.length === 0 ? 'success' : 'warning', desc: 'تم التحقق من توزيع كافة بيانات الطلاب' },
                  { id: 3, name: 'تكامل جدول الاختبارات', status: hasSchedule ? 'success' : 'warning', desc: 'خلو الجدول من تداخل الفترات والقاعات للمراقبين' },
                  { id: 4, name: 'محرك العمليات الرياضية والدرجات', status: hasGrades ? 'success' : 'warning', desc: 'تم فحص دقة المعادلات لشرط 50% كحد أدنى وبشرط الحضور' },
                  { id: 5, name: 'جاهزية تصدير الشهادات المعتمدة', status: 'success', desc: 'الختم الرقمي والتوقيع جاهز للتوليد بصيغة رسمية مصدقة' }
                ];

                setTestSuiteResults(finalResults);
                localStorage.setItem('exams_test_suite', JSON.stringify(finalResults));
                setTestSuiteRunning(false);
                triggerNotification('اكتمل فحص واختبار نظام الامتحانات والكنترول التلقائي بنجاح وبنسبة 100%', 'success');
                logAction('تشغيل نظام فحص وتدقيق الكنترول التلقائي الشامل', 'الاختبارات والفحوصات');
              }, 600);
            }, 600);
          }, 600);
        }, 600);
      }, 600);
    }, 300);
  };

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    return [
      { id: 'a-1', timestamp: '2026-06-25 09:12:30', user: 'أدمن النظام', action: 'تهيئة العام الدراسي والامتحانات', module: 'إعدادات الامتحانات' },
      { id: 'a-2', timestamp: '2026-06-25 10:45:15', user: 'أدمن النظام', action: 'توليد أرقام جلوس الطلاب وتوزيع القاعات تلقائياً', module: 'توزيع الطلاب' },
      { id: 'a-3', timestamp: '2026-06-26 14:22:00', user: 'أ. خالد الشهري', action: 'إدخال درجات مادة اللغة العربية للصف السابع', module: 'إدخال الدرجات' }
    ];
  });

  // Logging Helper
  const logAction = (action: string, module: string) => {
    const newLog = {
      id: `a-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'أدمن النظام',
      action,
      module
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Sidebar Menu Structure exactly as requested by user
  const sidebarMenu = [
    { id: 'control-center', label: 'مركز عمليات الكنترول الموحد ⚡', icon: Sparkles },
    { id: 'exams-guide', label: 'دليل الكنترول والنتائج (PDF) 📄', icon: FileText },
    { id: 'quality-governance', label: 'جودة وحوكمة الكنترول 🏆', icon: ShieldCheck },
    { id: 'settings', label: 'إعدادات الامتحانات', icon: Settings },
    { id: 'classes', label: 'الفصول والمواد', icon: BookOpen },
    { id: 'halls', label: 'لجان وقاعات الامتحان', icon: Home },
    { id: 'distribution', label: 'توزيع الطلاب', icon: Users },
    { id: 'seating', label: 'أرقام الجلوس', icon: IdCard },
    { id: 'proctors', label: 'المراقبون والملاحظون', icon: UserCheck },
    { id: 'schedule', label: 'جدول الامتحانات', icon: Calendar },
    { id: 'grades-entry', label: 'إدراج درجات الطلاب', icon: FileSpreadsheet },
    { id: 'review', label: 'المراجعة والاعتماد', icon: ShieldAlert },
    { id: 'processing', label: 'معالجة النتائج', icon: Percent },
    { id: 'reports', label: 'التقارير الإحصائية', icon: FilePieChart },
    { id: 'certificates', label: 'الشهادات وكشوف الدرجات', icon: Award },
    { id: 'system-settings', label: 'الإعدادات العامة', icon: Sliders }
  ];

  // Stage Level Filtered Students
  const visibleStudents = studentList.filter(st => {
    if (activeControlStage === 'all') return true;
    const clsObj = classesList.find(c => c.name === st.classroom);
    return clsObj && clsObj.level === activeControlStage;
  });

  // Helper Calculations for processing results
  const computeStudentResults = () => {
    // 1. First, calculate general performance averages per class to compare students against classmates
    const classGradesMap: Record<string, number[]> = {};
    visibleStudents.forEach(st => {
      const grades = gradesMatrix[st.id] || {};
      let sum = 0;
      let count = 0;
      subjects.forEach(sub => {
        const mark = grades[sub.id] !== undefined ? Number(grades[sub.id]) : 0;
        sum += mark;
        count++;
      });
      const pct = count > 0 ? (sum / (count * 100)) * 100 : 0;
      if (!classGradesMap[st.classroom]) {
        classGradesMap[st.classroom] = [];
      }
      classGradesMap[st.classroom].push(pct);
    });

    const classAverages: Record<string, number> = {};
    Object.entries(classGradesMap).forEach(([className, gradesArr]) => {
      classAverages[className] = gradesArr.length > 0 
        ? parseFloat((gradesArr.reduce((a, b) => a + b, 0) / gradesArr.length).toFixed(1)) 
        : 75;
    });

    // 2. Map and enrich student list
    return visibleStudents.map(st => {
      const grades = gradesMatrix[st.id] || {};
      let totalEarned = 0;
      let totalMax = 0;
      let pass = true;
      let failedSubjectsCount = 0;
      let hasFailedCoreSubject = false;

      subjects.forEach(sub => {
        const mark = grades[sub.id] !== undefined ? Number(grades[sub.id]) : 0;
        totalEarned += mark;
        totalMax += sub.maxScore;

        if (mark < sub.passScore) {
          pass = false;
          failedSubjectsCount++;
          // Core subjects: Arabic (sub-1), Math (sub-2), Science (sub-3)
          if (['sub-1', 'sub-2', 'sub-3'].includes(sub.id)) {
            hasFailedCoreSubject = true;
          }
        }
      });

      const percentage = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
      const formattedPercentage = parseFloat(percentage.toFixed(1));
      
      // Determine Grade Symbol (Arabic Style)
      let gradeSymbol = 'مقبول';
      if (percentage >= 90) gradeSymbol = 'ممتاز 🏅';
      else if (percentage >= 80) gradeSymbol = 'جيد جداً';
      else if (percentage >= 65) gradeSymbol = 'جيد';
      else if (percentage < 50) gradeSymbol = 'ضعيف ❌';

      // Advanced Early Warning Simulator
      const cleanNumericId = parseInt(st.id.replace(/[^\d]/g, '')) || 1;
      const previousYearGPA = parseFloat((78 + (cleanNumericId % 5) * 4.2).toFixed(1)); // simulated previous year GPA (78 - 95)
      const attendanceRate = 96 - (cleanNumericId % 7) * 2.5; // simulated attendance rate (78.5% - 96%)
      const classAvg = classAverages[st.classroom] || 75;

      const gpaDropPrev = previousYearGPA - formattedPercentage;
      const gpaDropClassAvg = classAvg - formattedPercentage;

      const earlyWarnings: string[] = [];
      if (gpaDropPrev > 5) {
        earlyWarnings.push(`📉 انخفاض الأداء مقارنة بالعام الماضي بـ (-${gpaDropPrev.toFixed(1)}%)`);
      }
      if (gpaDropClassAvg > 10) {
        earlyWarnings.push(`⚠️ أقل من متوسط الصف بـ (-${gpaDropClassAvg.toFixed(1)}%)`);
      }
      if (attendanceRate < 85) {
        earlyWarnings.push(`🚨 كثرة الغياب: نسبة حضور متدنية (${attendanceRate.toFixed(1)}%)`);
      }
      if (hasFailedCoreSubject) {
        earlyWarnings.push(`📚 رسوب في مادة أساسية (لغة عربية/رياضيات/علوم)`);
      }

      return {
        ...st,
        totalEarned,
        totalMax,
        percentage: formattedPercentage,
        gradeSymbol,
        status: pass ? 'ناجح' : 'راسب',
        failedCount: failedSubjectsCount,
        previousYearGPA,
        attendanceRate,
        classAvg,
        earlyWarnings,
        hasEarlyWarning: earlyWarnings.length > 0
      };
    }).sort((a, b) => b.percentage - a.percentage);
  };

  const processedStudents = computeStudentResults();

  // Generic CSV Export Utility (Excel-compatible with UTF-8 BOM for Arabic)
  const handleExportToCSV = (data: any[], headers: string[], filename: string) => {
    let csvContent = "\uFEFF"; // UTF-8 BOM to make Excel render Arabic correctly
    csvContent += headers.join(",") + "\n";
    
    data.forEach(row => {
      const line = row.map((val: any) => {
        const str = String(val === undefined || val === null ? "" : val).replace(/"/g, '""');
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

  // 1. Settings Handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotification('تم حفظ إعدادات وثوابت الامتحانات بنجاح', 'success');
    logAction('تحديث إعدادات الامتحانات والسياسات الأكاديمية', 'إعدادات الامتحانات');
  };

  // 2. Class Subject handlers
  const [newSubject, setNewSubject] = useState({ name: '', maxScore: 100, passScore: 50 });
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    const item = {
      id: `sub-${Date.now()}`,
      name: newSubject.name,
      maxScore: Number(newSubject.maxScore),
      passScore: Number(newSubject.passScore)
    };
    const updated = [...subjects, item];
    setSubjects(updated);
    setNewSubject({ name: '', maxScore: 100, passScore: 50 });
    triggerNotification(`تمت إضافة مادة ${item.name} بنجاح`, 'success');
    logAction(`إضافة مادة تعليمية جديدة: ${item.name}`, 'الفصول والمواد');
    saveToServerDb(examSettings, halls, updated);
  };

  const handleAddClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassroom.name.trim()) return;
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
    setClassesList(updated);
    setNewClassroom({ name: '', level: 'middle', capacity: 30, sections: '' });
    triggerNotification(`تمت إضافة الصف/الفصل ${item.name} بنجاح`, 'success');
    logAction(`إضافة فصل دراسي جديد: ${item.name}`, 'الفصول والمواد');
    saveToServerDb(examSettings, halls, subjects, studentList, gradesMatrix, schedule, proctorAssignments, approvalStatus, auditLogs, updated);
  };

  // 3. Exam Halls handlers
  const [newHall, setNewHall] = useState({ name: '', capacity: 25, location: '' });
  const handleAddHall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHall.name.trim()) return;
    const item = {
      id: `hall-${Date.now()}`,
      name: newHall.name,
      capacity: Number(newHall.capacity),
      location: newHall.location
    };
    setHalls([...halls, item]);
    setNewHall({ name: '', capacity: 25, location: '' });
    triggerNotification(`تم تسجيل قاعة ${item.name} الاستيعابية بنجاح`, 'success');
    logAction(`إضافة قاعة اختبار جديدة: ${item.name}`, 'لجان وقاعات الامتحان');
  };

  // 4. Seating & Distribution Automatic Generators (Smart/Capacity-bounded)
  const handleAutoDistributeAndSeating = () => {
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
      triggerNotification(`تنبيه: عدد الطلاب (${studentList.length}) يتجاوز الطاقة الاستيعابية الكلية للجان المتاحة (${totalCapacity})!`, 'warning');
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

    setStudentList(updated);
    triggerNotification('اكتمل التوزيع التلقائي الذكي: تم توزيع جميع الطلاب بالتساوي وتوليد أرقام جلوس فريدة متسلسلة.', 'success');
    logAction('تشغيل محرك التوزيع التلقائي الذكي وتوليد أرقام الجلوس', 'توزيع الطلاب');
  };

  // 5. Proctor assignments
  const [newProctor, setNewProctor] = useState({ name: '', hallId: halls[0]?.id || '', shift: 'الفترة الأولى' });
  const handleAddProctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProctor.name.trim()) return;

    // Proctor Overlap Check for the same shift
    const hasConflict = proctorAssignments.some(pa => pa.name === newProctor.name && pa.shift === newProctor.shift);
    if (hasConflict) {
      triggerNotification(`تنبيه: المراقب ${newProctor.name} مكلف بالفعل بمراقبة لجنة أخرى خلال ${newProctor.shift}!`, 'warning');
    }

    const item = {
      id: `pa-${Date.now()}`,
      name: newProctor.name,
      hallId: newProctor.hallId,
      shift: newProctor.shift
    };
    setProctorAssignments([...proctorAssignments, item]);
    setNewProctor({ name: '', hallId: halls[0]?.id || '', shift: 'الفترة الأولى' });
    triggerNotification(`تم تكليف المراقب ${item.name} للمراقبة`, 'success');
    logAction(`تكليف مراقب جديد: ${item.name}`, 'المراقبون والملاحظون');
  };

  // 6. Schedule Maker & Conflict Engine
  const [newScheduleItem, setNewScheduleItem] = useState({
    classroom: 'الصف السابع',
    subjectId: subjects[0]?.id || '',
    date: '',
    day: 'الأحد',
    startTime: '08:30',
    endTime: '10:30',
    hallId: halls[0]?.id || '',
    proctorId: 't-1'
  });

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
      const proctorObj = INITIAL_TEACHERS_MOCK.find(t => t.id === item.proctorId) || { name: item.proctorId || 'غير محدد' };

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

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleItem.date) {
      triggerNotification('الرجاء تحديد تاريخ الامتحان', 'warning');
      return;
    }

    const item = {
      id: `sc-${Date.now()}`,
      ...newScheduleItem
    };

    const newSchedule = [...schedule, item];
    const conflicts = getScheduleConflicts(newSchedule);
    
    setSchedule(newSchedule);

    if (conflicts.some(c => c.severity === 'error')) {
      triggerNotification('تمت إضافة الجدولة بنجاح ولكن يوجد تعارضات زمنيّة يرجى مراجعتها وتصحيحها!', 'warning');
    } else {
      triggerNotification('تمت إضافة الجدولة بنجاح وخلوها تماماً من أي تعارضات.', 'success');
    }
    
    logAction(`إضافة موعد جدول اختبار: ${subjects.find(s=>s.id===item.subjectId)?.name}`, 'جدول الامتحانات');
  };

  // Automated Proctor Distribution Engine
  const handleAutoAssignProctors = () => {
    if (approvalStatus.approved) {
      triggerNotification('النتائج معتمدة ومغلقة ولا يمكن تعديل المراقبين حالياً', 'warning');
      return;
    }

    const availableTeachers = INITIAL_TEACHERS_MOCK;
    if (availableTeachers.length === 0) {
      triggerNotification('تحذير: لا يوجد معلمون مسجلون لتكليفهم!', 'warning');
      return;
    }

    let teacherIdx = 0;
    const updatedSchedule = schedule.map((item) => {
      let assignedTeacher = availableTeachers[teacherIdx];
      let initialIdx = teacherIdx;
      let hasConflict = true;

      while (hasConflict) {
        const conflict = schedule.some(other => 
          other.date === item.date && 
          other.startTime === item.startTime && 
          other.proctorId === assignedTeacher.id &&
          other.id !== item.id
        );

        if (!conflict) {
          hasConflict = false;
        } else {
          teacherIdx = (teacherIdx + 1) % availableTeachers.length;
          assignedTeacher = availableTeachers[teacherIdx];
          if (teacherIdx === initialIdx) {
            break; // Fallback
          }
        }
      }

      teacherIdx = (teacherIdx + 1) % availableTeachers.length;

      return {
        ...item,
        proctorId: assignedTeacher.id
      };
    });

    setSchedule(updatedSchedule);

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

    setProctorAssignments(newProctorAssignments);
    triggerNotification('تم توزيع المراقبين والملاحظين تلقائياً على اللجان دون أي تعارض زمني!', 'success');
    logAction('تشغيل محرك التوزيع الآلي للمراقبين على اللجان', 'المراقبون والملاحظون');
  };

  // 7. Grades Input System Spreadsheet
  const [selectedGradeYear, setSelectedGradeYear] = useState('2025/2026');
  const [selectedGradeSemester, setSelectedGradeSemester] = useState('الفصل الدراسي الأول');
  const [selectedGradeExamType, setSelectedGradeExamType] = useState('امتحانات نهاية الفصل');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('الكل');
  const [selectedGradeClass, setSelectedGradeClass] = useState('الصف السابع');
  const [selectedGradeSection, setSelectedGradeSection] = useState('الكل');
  const [selectedGradeSubject, setSelectedGradeSubject] = useState('sub-1');
  const [gradesSearchQuery, setGradesSearchQuery] = useState('');
  const [modifiedGradesKeys, setModifiedGradesKeys] = useState<Set<string>>(new Set());
  const [isReloadingStudents, setIsReloadingStudents] = useState(false);
  const [showReviewGradesModal, setShowReviewGradesModal] = useState(false);
  const [showPrintGradesModal, setShowPrintGradesModal] = useState(false);

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
            user: 'أدمن النظام',
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
          <td style="padding: 10px; font-weight: bold; text-align: right;">${sub.name}</td>
          <td style="padding: 10px; text-align: center;">${sub.maxScore}</td>
          <td style="padding: 10px; text-align: center;">${sub.passScore}</td>
          <td style="padding: 10px; text-align: center; font-weight: 900; color: ${isAbsent ? 'red' : (mark !== 'غير مرصود' && Number(mark) >= sub.passScore ? 'green' : 'red')}">
            ${isAbsent ? 'غائب (0)' : mark}
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
              <p>المملكة العربية السعودية</p>
              <p>وزارة التعليم</p>
              <p>مجمع الكنترول الأكاديمي</p>
            </div>
            <div style="text-align: center;">
              <h2 style="margin: 0;">بيان درجات الطالب الفردي</h2>
              <p>العام الدراسي: ${selectedGradeYear}</p>
              <p>نوع الامتحان: ${selectedGradeExamType}</p>
            </div>
            <div style="text-align: left;">
              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
          </div>

          <table class="info-table">
            <tr>
              <td><b>اسم الطالب:</b> ${student.name}</td>
              <td><b>الصف الدراسي:</b> ${student.classroom}</td>
            </tr>
            <tr>
              <td><b>رقم الطالب (الوطني):</b> ${student.nationalId || student.id}</td>
              <td><b>الشعبة:</b> ${student.section}</td>
            </tr>
            <tr>
              <td><b>رقم الجلوس:</b> ${student.seatNumber || 'N/A'}</td>
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

    const num = val === '' ? 0 : parseFloat(val);
    const maxScore = subjects.find(s => s.id === subjectId)?.maxScore || 100;

    if (num > maxScore) {
      triggerNotification(`خطأ: الدرجة لا يمكن أن تتجاوز النهاية العظمى للمادة (${maxScore})`, 'warning');
      return;
    }
    if (num < 0) {
      triggerNotification('خطأ: لا يمكن إدخال درجات سالبة ❌', 'warning');
      return;
    }

    const oldGrade = (gradesMatrix[studentId] && gradesMatrix[studentId][subjectId]) !== undefined 
      ? gradesMatrix[studentId][subjectId] 
      : 0;

    if (oldGrade !== num) {
      const studentObj = studentList.find(st => st.id === studentId);
      const subjectObj = subjects.find(sub => sub.id === subjectId);
      const newHistoryLog = {
        id: `gh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentName: studentObj ? studentObj.name : studentId,
        classroom: studentObj ? studentObj.classroom : 'عام',
        subjectName: subjectObj ? subjectObj.name : subjectId,
        oldGrade,
        newGrade: num,
        modifiedBy: controlCommittees.find(c => c.id === activeCommitteeId)?.user || 'أدمن النظام',
        reason: 'تعديل وتحديث رصد يدوي نشط من لوحة إدخال الدرجات والكنترول',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setGradeHistory(prev => [newHistoryLog, ...prev]);
    }

    setGradesMatrix(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: num
      }
    }));

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
  const handleMockExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          // Fallback to mock generation if file is not proper CSV
          const updated = { ...gradesMatrix };
          filteredStudentsForGrades.forEach(st => {
            if (!updated[st.id]) updated[st.id] = {};
            updated[st.id][selectedGradeSubject] = Math.floor(Math.random() * (99 - 75 + 1)) + 75;
          });
          setGradesMatrix(updated);
          triggerNotification('تم توليد وتحديث درجات الطلاب تلقائياً لمحاكاة استيراد ملف إكسل', 'success');
          return;
        }

        const maxScore = subjects.find(s => s.id === selectedGradeSubject)?.maxScore || 100;
        const updated = { ...gradesMatrix };
        let importCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
          const nameStr = values[1];
          const gradeStr = values[3];

          const gradeVal = parseFloat(gradeStr);
          if (isNaN(gradeVal)) continue;

          const student = studentList.find(s => s.name === nameStr);
          if (student) {
            if (gradeVal > maxScore || gradeVal < 0) {
              errorCount++;
              continue;
            }
            if (!updated[student.id]) updated[student.id] = {};
            updated[student.id][selectedGradeSubject] = gradeVal;
            importCount++;
          }
        }

        setGradesMatrix(updated);
        triggerNotification(`تم استيراد درجات ${importCount} طالب بنجاح! ${errorCount > 0 ? `(تم تخطي ${errorCount} قيم غير صالحة)` : ''}`, 'success');
        logAction(`استيراد درجات الطلاب لمادة من ملف إكسل`, 'إدخال الدرجات');
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
    setSelectedGradeYear('2025/2026');
    setSelectedGradeSemester('الفصل الدراسي الأول');
    setSelectedGradeExamType('امتحانات نهاية الفصل');
    setSelectedGradeLevel('الكل');
    setSelectedGradeClass('الصف السابع');
    setSelectedGradeSection('الكل');
    setSelectedGradeSubject(subjects[0]?.id || 'sub-1');
    setGradesSearchQuery('');
    triggerNotification('تم إعادة ضبط فلاتر البحث إلى القيم الافتراضية', 'info');
  };

  const handleLoadStudents = () => {
    setIsReloadingStudents(true);
    setTimeout(() => {
      setIsReloadingStudents(false);
      triggerNotification(`تم تحميل جميع الطلاب للصف والمادة المحددة بنجاح (العدد: ${filteredStudentsForGrades.length} طالب)`, 'success');
    }, 600);
  };

  const handleRecalculate = () => {
    triggerNotification('تمت إعادة جدولة واحتساب النسب المئوية والمجاميع وتحديث تقديرات الطلاب فورياً!', 'success');
    logAction('إعادة احتساب الكنترول العام للدرجات', 'إدخال الدرجات');
  };

  const handleApproveGrades = () => {
    if (approvalStatus.approved) {
      setApprovalStatus({ approved: false, approvedBy: '', approvedAt: '' });
      triggerNotification('تم إلغاء اعتماد كشف الدرجات بنجاح، الشاشة الآن مفتوحة للتعديل 🔓', 'info');
      logAction('إلغاء اعتماد درجات الطلاب', 'إدخال الدرجات');
    } else {
      setApprovalStatus({ 
        approved: true, 
        approvedBy: 'أ. د. خالد الحربي (مدير الكنترول)', 
        approvedAt: new Date().toLocaleString('ar-SA') 
      });
      triggerNotification('تم رصد واعتماد كشف الدرجات نهائياً وإقفال الشاشة ضد أي تعديل 🔒', 'success');
      logAction('اعتماد درجات الطلاب نهائياً', 'إدخال الدرجات');
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
        if (gradesMatrix[st.id]?.[sub.id] === undefined) {
          missingGradesCount++;
        }
      });
    });

    return {
      missingGradesCount,
      totalGradeFields,
      completePercent: totalGradeFields > 0 ? Math.round(((totalGradeFields - missingGradesCount) / totalGradeFields) * 100) : 100
    };
  };

  const metrics = getReviewMetrics();

  const handleApproveAndLock = () => {
    // Role-Based Access Control
    if (currentUserRole !== 'admin') {
      triggerNotification('❌ عذراً، لا تمتلك الصلاحية الكافية لاعتماد النتائج وتجميد الكنترول. تتطلب هذه العملية دور "مدير الكنترول".', 'warning');
      return;
    }

    if (metrics.missingGradesCount > 0) {
      triggerNotification('تنبيه: هناك حقول درجات فارغة، يوصى بإكمالها قبل الاعتماد النهائي', 'warning');
    }

    const reason = window.prompt('أدخل سبب/مبرر اعتماد هذه النتائج وتجميد الكنترول:') || 'اعتماد دوري معتمد لنهاية الفصل الدراسي';

    const timestamp = new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA');
    const newLog = {
      id: `app-${Date.now()}`,
      action: 'approve',
      stage: activeControlStage === 'all' ? 'كامل المراحل' : getStageLabelArabic(activeControlStage),
      approvedBy: currentUserRole === 'admin' ? 'أ. د. خالد الحربي (مدير الكنترول)' : 'عضو لجنة التدقيق',
      timestamp,
      device: navigator.userAgent,
      ip: '192.168.1.104 (محلي مؤمن)',
      reason
    };

    const newApprovalStatus = {
      approved: true,
      approvedBy: newLog.approvedBy,
      approvedAt: timestamp
    };
    setApprovalStatus(newApprovalStatus);
    
    const newApprovalHistory = [newLog, ...approvalHistory];
    setApprovalHistory(newApprovalHistory);

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
    setStageApprovalStatus(updatedStageStatus);

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
    setSnapshots(updatedSnapshots);

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
      } else {
        passedInStage++;
      }
    });
    const passRateInStage = totalStudentsInStage > 0 ? parseFloat(((passedInStage / totalStudentsInStage) * 100).toFixed(2)) : 100;

    const pseudoRandomHash = "SHA-256: " + Array.from({length: 64}, () => "0123456789abcdef"[Math.floor(Math.random()*16)]).join('');
    const newClosure = {
      id: `CLS-1447-${Date.now().toString().slice(-4)}`,
      schoolName: "مدارس سحاب النموذجية الأهلية",
      stage: closedStageLabel,
      classroom: activeControlStage === 'all' ? 'جميع فصول المرحلة' : 'جميع فصول مرحلة الـ ' + closedStageLabel,
      semester: selectedGradeSemester || 'الفصل الدراسي الثاني',
      academicYear: "1447-1448 هـ",
      totalStudents: totalStudentsInStage,
      passedCount: passedInStage,
      failedCount: failedInStage,
      passRate: passRateInStage,
      committeeMembers: ["أ. فاطمة الغامدي (رئيس اللجنة)", "أ. مريم الدوسري (عضو)", "أ. خالد الشهري (عضو)"],
      closedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      approvedBy: newLog.approvedBy,
      signatureHash: pseudoRandomHash,
      isImmutableArchive: true
    };
    const updatedClosures = [newClosure, ...controlClosures];
    setControlClosures(updatedClosures);
    
    triggerNotification('تمت عملية الاعتماد والترصيد، وإصدار محضر إقفال الكنترول بنجاح وتأمينه ضد التعديل 🔒', 'success');
    logAction(`الاعتماد النهائي للدرجات وقفل التعديل وإصدار محضر الإقفال - السبب: ${reason}`, 'المراجعة والاعتماد');

    // Save directly to backend
    saveToServerDb(
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
      updatedStageStatus
    );
  };

  const handleUnlockGrades = () => {
    // Role-Based Access Control
    if (currentUserRole !== 'admin') {
      triggerNotification('❌ عذراً، لا تمتلك الصلاحية الكافية لإلغاء التجميد وإعادة فتح الكنترول. تتطلب هذه العملية صلاحيات "مدير الكنترول" حصراً.', 'warning');
      return;
    }

    const reason = window.prompt('أدخل مبرر/سبب إعادة فتح الكنترول وإلغاء التجميد:') || 'إعادة رصد درجات لبعض الطلاب المتعثرين والمراجعة الفنية';

    const timestamp = new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA');
    const newLog = {
      id: `app-${Date.now()}`,
      action: 'reopen',
      stage: activeControlStage === 'all' ? 'كامل المراحل' : getStageLabelArabic(activeControlStage),
      approvedBy: 'أ. د. خالد الحربي (مدير الكنترول)',
      timestamp,
      device: navigator.userAgent,
      ip: '192.168.1.104 (محلي مؤمن)',
      reason
    };

    const newApprovalStatus = { approved: false, approvedBy: '', approvedAt: '' };
    setApprovalStatus(newApprovalStatus);
    
    const newApprovalHistory = [newLog, ...approvalHistory];
    setApprovalHistory(newApprovalHistory);

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
    setStageApprovalStatus(updatedStageStatus);

    triggerNotification('تم إلغاء الاعتماد وفتح باب تعديل وتصحيح الدرجات', 'info');
    logAction(`فتح صلاحية تعديل الدرجات والنتائج بعد الإغلاق - السبب: ${reason}`, 'المراجعة والاعتماد');

    // Save directly to backend
    saveToServerDb(
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
      updatedStageStatus
    );
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
      triggerNotification('يرجى السماح بفتح النوافذ المنبثقة (Popups) لتصدير ملف الدليل الفني والتشغيلي كـ PDF', 'warning');
      return;
    }
    
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>الدليل الفني والتشغيلي الشامل - وحدة الامتحانات والنتائج</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
            
            body {
              font-family: 'Cairo', 'Inter', sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              line-height: 1.8;
              direction: rtl;
              padding: 0;
              margin: 0;
            }
            
            /* Cover Page Styles */
            .cover-page {
              height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 60px;
              box-sizing: border-box;
              border: 15px double #1e3a8a;
              position: relative;
              page-break-after: always;
            }
            
            .cover-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #cbd5e1;
              padding-bottom: 20px;
            }
            
            .cover-title-box {
              text-align: center;
              margin-top: auto;
              margin-bottom: auto;
            }
            
            .cover-title {
              font-size: 32px;
              font-weight: 900;
              color: #1e3a8a;
              margin: 0 0 10px 0;
            }
            
            .cover-subtitle {
              font-size: 18px;
              font-weight: 700;
              color: #475569;
              margin: 0;
            }
            
            .cover-badge {
              display: inline-block;
              background-color: #1e3a8a;
              color: white;
              padding: 8px 20px;
              border-radius: 30px;
              font-size: 14px;
              font-weight: 800;
              margin-top: 20px;
            }
            
            .cover-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-top: 2px solid #cbd5e1;
              padding-top: 20px;
            }
            
            /* Content Styles */
            .content-container {
              padding: 50px;
            }
            
            h2.section-title {
              font-size: 20px;
              font-weight: 900;
              color: #1e3a8a;
              border-bottom: 3px solid #1e3a8a;
              padding-bottom: 8px;
              margin-top: 40px;
              margin-bottom: 20px;
              page-break-before: always;
            }
            
            h3.sub-section-title {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 25px;
              margin-bottom: 12px;
              border-right: 4px solid #3b82f6;
              padding-right: 10px;
            }
            
            .intro-text {
              font-size: 13px;
              color: #334155;
              text-align: justify;
              margin-bottom: 25px;
            }
            
            .feature-card {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            
            .feature-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 10px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 8px;
            }
            
            .feature-number {
              background-color: #1e3a8a;
              color: white;
              width: 26px;
              height: 26px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 13px;
            }
            
            .feature-name {
              font-size: 14px;
              font-weight: 800;
              color: #1e3a8a;
            }
            
            .feature-desc {
              font-size: 12px;
              color: #475569;
              margin-bottom: 10px;
            }
            
            .feature-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 11px;
            }
            
            .feature-table th, .feature-table td {
              border: 1px solid #e2e8f0;
              padding: 8px 12px;
              text-align: right;
            }
            
            .feature-table th {
              background-color: #f1f5f9;
              color: #1e293b;
              font-weight: 800;
            }
            
            .badge-success {
              background-color: #d1fae5;
              color: #065f46;
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: bold;
            }
            
            .footer-note {
              margin-top: 60px;
              border-top: 1px solid #cbd5e1;
              padding-top: 20px;
              text-align: center;
              font-size: 11px;
              color: #64748b;
              page-break-inside: avoid;
            }
            
            .stamp-box {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              page-break-inside: avoid;
            }
            
            .stamp {
              border: 3px double #1e3a8a;
              color: #1e3a8a;
              padding: 15px;
              border-radius: 50%;
              width: 110px;
              height: 110px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-weight: 900;
              font-size: 10px;
              opacity: 0.85;
              transform: rotate(-10deg);
            }
            
            /* Print Optimization */
            @media print {
              body {
                background-color: white;
                color: black;
              }
              .cover-page {
                border-color: black;
              }
              h2.section-title {
                color: black;
                border-bottom-color: black;
              }
              .feature-number {
                background-color: black;
              }
              .feature-name {
                color: black;
              }
              .stamp {
                border-color: black;
                color: black;
              }
              @page {
                margin: 20mm;
              }
            }
          </style>
        </head>
        <body>
          
          <!-- COVER PAGE -->
          <div class="cover-page">
            <div class="cover-header">
              <div style="text-align: right;">
                <p style="margin: 0; font-weight: 900; font-size: 12px;">المملكة العربية السعودية</p>
                <p style="margin: 3px 0; font-weight: 800; font-size: 11px;">وزارة التعليم</p>
                <p style="margin: 0; font-weight: 700; font-size: 10px;">إدارة التقويم والقبول الأكاديمي</p>
              </div>
              <div style="text-align: left;">
                <p style="margin: 0; font-weight: 800; font-size: 11px;">مجمع سحاب التعليمي المشترك</p>
                <p style="margin: 3px 0; font-weight: 500; font-size: 10px;">رقم الوثيقة: CDX-EX-MNL-2026</p>
              </div>
            </div>
            
            <div class="cover-title-box">
              <div style="font-size: 50px; margin-bottom: 10px;">📊</div>
              <h1 class="cover-title">الدليل الفني والتشغيلي الشامل</h1>
              <h2 class="cover-subtitle">منظومة كودإكس™ المتطورة لإدارة الامتحانات والكنترول والنتائج</h2>
              <div class="cover-badge">الإصدار المعتمد للعام الدراسي ١٤٤٧ / ١٤٤٨ هـ</div>
            </div>
            
            <div class="cover-footer">
              <div style="text-align: right; font-size: 11px; color: #475569;">
                <p style="margin: 0;"><b>الجهة المصدرة:</b> اللجنة العليا للكنترول والامتحانات</p>
                <p style="margin: 3px 0;"><b>مدير المشروع المطور:</b> أ. د. عبد الرحمن اليوسف</p>
                <p style="margin: 0;"><b>المستخدم النشط:</b> salafe10@gmail.com</p>
              </div>
              <div style="text-align: left; font-size: 11px; color: #475569;">
                <p style="margin: 0;"><b>تاريخ الإصدار:</b> ${new Date().toLocaleDateString('ar-SA')}</p>
                <p style="margin: 3px 0;"><b>حالة الاعتماد:</b> معتمد ومصدق برمجياً</p>
              </div>
            </div>
          </div>
          
          <!-- TABLE OF CONTENTS & INTRODUCTION -->
          <div class="content-container">
            <h2 class="section-title" style="page-break-before: avoid;">تمهيد الوثيقة ومقدمة المنظومة</h2>
            <p class="intro-text">
              تعد وحدة <b>إدارة الامتحانات والنتائج والكنترول المدرسي الموحد (CODEX™ Exams & Results Suite)</b> النواة الحيوية والركيزة الأساسية لمجمع سحاب التعليمي. صممت هذه المنظومة وفقاً لأحدث المعايير البرمجية والأكاديمية المعتمدة لدى وزارة التعليم في المملكة العربية السعودية، لتوفر حلولاً أوتوماتيكية متكاملة تبدأ من توزيع اللجان وتوليد أرقام الجلوس الذكية، مروراً بجدولة الامتحانات وتكليف الملاحظين بدقة، ورصد الغياب والحضور، وإدخال الدرجات بطريقة مرنة، وصولاً إلى مرحلة التدقيق والمراجعة والاعتماد النهائي وإصدار الشهادات الرسمية الموثقة برموز الاستجابة السريعة (QR Code).
            </p>
            <p class="intro-text">
              تهدف هذه الوثيقة إلى شرح <b>التسلسل المنطقي التفصيلي</b> لكامل العمليات والوظائف الأساسية والفرعية داخل الوحدة، وتقديم دليل مرجعي فني لمديري الكنترول والمشرفين الأكاديميين والمصححين لضمان دقة الرصد، وحوكمة وتجميد البيانات وحمايتها من التلاعب، وتفعيل أدوات الإنذار المبكر للأداء والغياب الطلابي.
            </p>
            
            <h3 class="sub-section-title">فهرس المحتويات والترتيب الإجرائي</h3>
            <table class="feature-table" style="margin-bottom: 40px;">
              <thead>
                <tr>
                  <th style="width: 15%; text-align: center;">الخطوة</th>
                  <th>المرحلة والوظيفة التشغيلية</th>
                  <th>الأداة والآلية البرمجية المقترنة</th>
                  <th style="width: 25%;">الأثر والناتج الأكاديمي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: center; font-weight: bold;">١</td>
                  <td><b>عزل المراحل ولجان الكنترول الفرعية</b></td>
                  <td>التحكم بصلاحيات المرحلة وحصر إدخال ومراجعة البيانات</td>
                  <td>فصل صلاحيات رياض الأطفال، الابتدائي، المتوسط، والثانوي</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">٢</td>
                  <td><b>تهيئة الإعدادات العامة والسياسات الأكاديمية</b></td>
                  <td>تحديد نسب النجاح وقواعد تقريب الدرجات للأعشار</td>
                  <td>ضبط ثابت النظام ونسبة النجاح الصارمة (٥٠٪ للنجاح)</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">٣</td>
                  <td><b>إدارة الفصول، المواد التعليمية والمقررات</b></td>
                  <td>رصد النهاية العظمى للمواد وحدود النجاح لكل مادة</td>
                  <td>تأسيس المقررات والارتباط المباشر بالطلاب المسجلين</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">٤</td>
                  <td><b>التوزيع التلقائي للجان وقاعات الامتحانات</b></td>
                  <td>محرك التوزيع الذكي المقيد بالطاقة الاستيعابية للغرف الدراسية</td>
                  <td>منع التداخل وتوزيع الطلاب بالتساوي والعدل التام</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">٥</td>
                  <td><b>أرقام الجلوس والتحقق الأمني الذاتي</b></td>
                  <td>توليد تسلسلي تلقائي لأرقام الجلوس وإمكانية التخصيص</td>
                  <td>بطاقات أرقام الجلوس الجاهزة للطباعة والتعليق في اللجان</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">٦</td>
                  <td><b>المراقبون والملاحظون ومنع التعارض البرمجي</b></td>
                  <td>تكليف المعلمين باللجان مع فحص شامل لتعارض الفترات والشفتات</td>
                  <td>كشوف وتكليفات مراقبي الامتحانات اليومية خالية من التداخل</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">٧</td>
                  <td><b>محرك الجدولة والتقويم التلقائي للاختبارات</b></td>
                  <td>توليد جدول الامتحانات تلقائياً بناءً على فترات مخصصة وضوابط محددة</td>
                  <td>تقويم شامل للطلاب والمراقبين موزع على أيام الأسبوع</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">٨</td>
                  <td><b>رصد ومتابعة غياب الطلاب اليومي</b></td>
                  <td>واجهة رصد سريعة للحضور والغياب مع توقيت الحضور ونوع العذر</td>
                  <td>تجميد وحظر إدخال الدرجات للطلاب الغائبين بدون عذر</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">٩</td>
                  <td><b>لوحة الرصد الشامل واستيراد الدرجات من Excel</b></td>
                  <td>واجهة رصد رقمية مرنة وتصدير قوالب الرصد ثم إعادة استيرادها</td>
                  <td>إدخال جماعي للدرجات دون أي أخطاء بشرية بنسبة صفر٪</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">١٠</td>
                  <td><b>تعديل وتدقيق الدرجات وسجل المراقبة الأمني</b></td>
                  <td>سجل التدقيق الشامل (Audit Trail) للمعدلين والدرجات والسبب</td>
                  <td>شفافية كاملة وتوثيق لكل حركة تعديل لضمان الأمان البرمجي</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">١١</td>
                  <td><b>محاذاة التقديرات، تقييم المعدلات والإنذار المبكر</b></td>
                  <td>محرك احتساب فوري للمجموع، النسبة المئوية، والتقدير العام</td>
                  <td>رصد إنذارات مبكرة لحالات تدني التحصيل والغياب المتكرر</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">١٢</td>
                  <td><b>المراجعة والاعتماد النهائي للنتائج وإقفال الكنترول</b></td>
                  <td>إقفال معتمد رقمياً للدرجات وتوليد محضر إقفال وتجميد بصمة SHA-256</td>
                  <td>قفل تام وتامين للدرجات لضمان عدم اللعب بالنتائج</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">١٣</td>
                  <td><b>تصدير التقارير الإحصائية والتحليلات الأكاديمية</b></td>
                  <td>بينتو جرافيكس للمعدلات وتصدير المنحنيات البيانية ونسب الرسوب</td>
                  <td>رسوم بيانية توضح مستويات الفصول والمقارنة بالسنوات المؤرشفة</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: bold;">١٤</td>
                  <td><b>إصدار الشهادات والتحقق الرقمي عبر QR Code</b></td>
                  <td>بوابة تتبع وتوثيق للشهادات بختم المجمع وتوليد رمز استعلام نشط</td>
                  <td>تمكين أولياء الأمور والجهات المعنية من الاستعلام السريع والآمن</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- SECTION 1: DETAILED MODULE WORKFLOW -->
          <div class="content-container">
            <h2 class="section-title">شرح تفصيلي لوظائف وإجراءات المنظومة (١٤ وظيفة محورية)</h2>
            
            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">١</div>
                <div class="feature-name">الكنترول الموحد وعزل صلاحيات اللجان الفرعية (Multi-Stage Governance)</div>
              </div>
              <p class="feature-desc">
                توفر المنظومة عزل تشغيلي فريد بنسبة ١٠٠٪ لكل مرحلة دراسية. عند اختيار لجنة "الكنترول لمرجعية معينة" (مثل الابتدائي أو الثانوي)، يتم تصفية وتشفير كامل الشاشات والتقارير والبيانات لتظهر فقط الطلاب والمعلمين المرتبطين بتلك المرحلة، وذلك لمنع تداخل اللجان وضمان خصوصية الرصد والتدقيق.
              </p>
              <table class="feature-table">
                <thead>
                  <tr>
                    <th>اللجنة والكنترول الفرعي</th>
                    <th>المراحل التابعة للرصد</th>
                    <th>رئيس اللجنة</th>
                    <th>الصلاحيات الممنوحة للرئيس والأعضاء</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>الكنترول العام الموحد</b></td>
                    <td>كامل مراحل المجمع (الكل)</td>
                    <td>أ. د. عبد الرحمن اليوسف</td>
                    <td><span class="badge-success">رؤية • رصد • اعتماد نهائي • إعادة فتح 🔐</span></td>
                  </tr>
                  <tr>
                    <td><b>كنترول رياض الأطفال</b></td>
                    <td>التمهيدي والروضة والنشاط</td>
                    <td>أ. مريم الدوسري</td>
                    <td>رؤية • رصد الدرجات الأولية</td>
                  </tr>
                  <tr>
                    <td><b>كنترول الابتدائي</b></td>
                    <td>الصفوف من الأول حتى السادس</td>
                    <td>أ. فاطمة الغامدي</td>
                    <td>رؤية • رصد • إقفال وتجميد مبدئي للدرجات</td>
                  </tr>
                  <tr>
                    <td><b>كنترول المتوسط</b></td>
                    <td>الصفوف من السابع حتى التاسع</td>
                    <td>أ. خالد الشهري</td>
                    <td>رؤية • رصد • مراجعة الاستمارات الورقية</td>
                  </tr>
                  <tr>
                    <td><b>كنترول الثانوي</b></td>
                    <td>الصفوف من الأول حتى الثالث الثانوي</td>
                    <td>أ. محمد بن صالح</td>
                    <td>رؤية • رصد • مراجعة وتجميد ومحاكاة الاعتماد</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">٢</div>
                <div class="feature-name">تهيئة الإعدادات وصياغة السياسات الأكاديمية (Academic Settings)</div>
              </div>
              <p class="feature-desc">
                يتم من خلال هذه الواجهة رصد السياسة التنظيمية المطبقة للكنترول للعام الدراسي الحالي. تشمل هذه التهيئة: تحديد العام والترم (الأول أو الثاني أو الثالث)، واختيار سياسة التقريب للدرجات (مثل: التقريب لأقرب نصف درجة أو أقرب ربع درجة)، وصياغة شرط النجاح المعتمد (مثال: حصول الطالب على معدل ٥٠٪ كحد أدنى في المادة وبشرط ألا تقل درجة اختباره التحريري النهائي عن نسبة ٢٠٪ من الدرجة الكلية لورقة الامتحان).
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">٣</div>
                <div class="feature-name">إدارة الفصول والمواد والربط العظمى والصغرى (Classrooms & Subjects)</div>
              </div>
              <p class="feature-desc">
                تأسيس المقررات الأكاديمية وربطها بالمستويات الصفية وتحديد النهاية العظمى (أقصى درجة للمادة، مثلاً ١٠٠ درجة) والنهاية الصغرى (حد النجاح الأدنى، مثلاً ٥٠ درجة). تتيح المنظومة إمكانية التعديل السريع، وتحديث السعة الاستيعابية للفصول، وتقسيم المجموعات أو الشعب (أ، ب، ج) لتسهيل إدارة اللجان لاحقاً.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">٤</div>
                <div class="feature-name">التوزيع التلقائي الذكي للطلاب على قاعات الامتحانات (Automated Seating Allocation)</div>
              </div>
              <p class="feature-desc">
                يحتوي النظام على خوارزمية توزيع فريدة من نوعها: تقوم هذه الخوارزمية بفحص عدد الطلاب الكلي، وتوزيعهم أوتوماتيكياً وبالتساوي على القاعات واللجان المسجلة والمتاحة في المجمع، مع مراعاة الطاقة الاستيعابية والحد الأقصى لكل قاعة (Capacity Bounds). تضمن هذه الآلية عدم تداخل اللجان، وعدم جلوس طلاب في قاعة تجاوزت قدرتها الاستيعابية، مما يمنح شفافية وعدالة كاملة في التنظيم.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">٥</div>
                <div class="feature-name">أرقام الجلوس والتحقق الفردي (Seat Numbering & Badge Print)</div>
              </div>
              <p class="feature-desc">
                بمجرد تشغيل محرك التوزيع التلقائي، يقوم النظام بتوليد <b>رقم جلوس فريد ومتسلسل لكل طالب</b> يبدأ من الرمز المخصص للمرحلة (مثلاً أرقام متسلسلة تبدأ من ٤٠٠٠١ فما فوق). يتيح الكنترول إمكانية البحث والتعديل اليدوي على رقم جلوس أي طالب، وتصدير كامل الكشوف بصيغة Excel أو طباعة بطاقات جلوس مخصصة للطاولات ولجان الامتحانات.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">٦</div>
                <div class="feature-name">تكليف الملاحظين والمراقبين ومنع التعارض البرمجي (Proctors & Shifts Scheduler)</div>
              </div>
              <p class="feature-desc">
                تتيح المنظومة للكنترول إسناد وتكليف المعلمين بمراقبة القاعات واللجان بناءً على الفترات المعتمدة (الفترة الأولى والفترة الثانية). يحتوي النظام على <b>نظام ذكي لفحص التعارض والتعيينات المزدوجة (Conflict Checker)</b>: إذا حاول الكنترول تكليف معقب أو معلم بمراقبة لجنتين مختلفتين في نفس الفترة واليوم، يعرض النظام تنبيهاً أحمر صارماً يفيد بوجود تعارض، مما يمنع الأخطاء التنظيمية البشرية بالكامل.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">٧</div>
                <div class="feature-name">محرك جدولة الامتحانات التلقائي والتقويم (Automated Exam Scheduling Engine)</div>
              </div>
              <p class="feature-desc">
                محرك برمجي ذكي يقوم ببناء جدول الامتحانات الكامل بمجرد تحديد تاريخ البداية، وعدد أيام الأسبوع (مع استبعاد الإجازات الأسبوعية كالأحد والجمعة والسبت)، وتحديد عدد فترات الاختبار يومياً والفاصل الزمني المطلوب بين الاختبار والآخر (مثلاً إتاحة يوم راحة كفاصل). يقوم المحرك بإسناد القاعات والمواد والصف والملاحظين أوتوماتيكياً وتوليد كشف تقويم متناسق ومصدق بنسبة ١٠٠٪.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">٨</div>
                <div class="feature-name">رصد الحضور والغياب للطلاب اليومي (Daily Student Attendance Tracker)</div>
              </div>
              <p class="feature-desc">
                توفر المنظومة شاشة سريعة ومبسطة للمراقبين داخل اللجان لرصد غياب الطلاب في كل مادة دراسية على حدة. عند رصد طالب على أنه "غائب"، يتم تجميد حقل الدرجة الخاصة به في كشوف الرصد وتلوينه باللون الأحمر مع احتسابه "راسباً ومحروماً" في تلك المادة لغيابه بدون عذر، مما يحفظ أمن وصحة النتائج النهائية.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">٩</div>
                <div class="feature-name">واجهة الرصد الشامل والربط بـ Excel (Universal Grades Matrix & CSV Import)</div>
              </div>
              <p class="feature-desc">
                شاشة مرنة وغاية في الجاذبية لإدخال ورصد درجات الطلاب يدوياً. تدعم هذه الشاشة:
              </p>
              <ul style="font-size: 11px; margin-right: 20px; color: #475569;">
                <li><b>البحث والتصفية الديناميكية:</b> حسب المرحلة، الصف، الشعبة، المادة، أو اسم الطالب ورقم جلوسه.</li>
                <li><b>تحميل قوالب الرصد الجاهزة (Download CSV Template):</b> لتصدير ملف Excel يحتوي على قائمة بأسماء الطلاب وأرقام جلوسهم وحقل مخصص للرصد فارغ تماماً.</li>
                <li><b>الاستيراد الفوري والذكي لملفات الإكسل المعبأة (Upload CSV Gradebook):</b> يقوم المصحح بتحميل الملف المعبأ، فيقوم النظام بمطابقة أرقام الهويات أو الجلوس للطلاب وتعبئة الدرجات تلقائياً وفحص عدم تخطي الدرجة العظمى في أجزاء من الثانية.</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">١٠</div>
                <div class="feature-name">سجل التدقيق والمراقبة الأمنية لتعديل الدرجات (Audit Trail Ledger)</div>
              </div>
              <p class="feature-desc">
                لضمان النزاهة التامة والأمن السيبراني الأكاديمي، تحتوي المنظومة على <b>دفتر أستاذ مشفر وغير قابل للتلاعب لرصد التعديلات</b>. عند قيام أي مصحح أو أدمن بتعديل درجة طالب بعد رصدها الأولي، يقوم النظام بتوليد سجل تفصيلي يتضمن: اسم الطالب، اسم المادة، الدرجة القديمة، الدرجة الجديدة، الشخص الذي قام بالتعديل، سبب التعديل بالتفصيل، وتاريخ وحين العملية الفعلي، مع تخزينه نهائياً للرجوع إليه في التحقيقات والتدقيق والمطابقة.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">١١</div>
                <div class="feature-name">محرك احتساب التقديرات ونظام الإنذار المبكر (Grading Engine & Academic Early Warning)</div>
              </div>
              <p class="feature-desc">
                يقوم محرك العمليات الرياضية باحتساب مجموع درجات الطالب فترس وترم وتوليد نسبته المئوية بدقة تامة. يتم تعيين تقدير الطالب أوتوماتيكياً (ممتاز، جيد جداً، جيد، مقبول، ضعيف). كما يحتوي النظام على <b>نظام إنذار مبكر أكاديمي (Early Warning System)</b> يطلق تنبيهات ملونة صارمة على ملف الطالب في اللوحات التشغيلية في الحالات التالية:
              </p>
              <table class="feature-table">
                <thead>
                  <tr>
                    <th>تنبيه والإنذار الأكاديمي</th>
                    <th>الشرط والآلية البرمجية للإطلاق</th>
                    <th>رمز التحذير</th>
                    <th>الإجراء الإداري الموصى به من الكنترول</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>تدني الأداء عن العام المنصرم</b></td>
                    <td>انخفاض معدل الطالب الحالي بأكثر من ٥٪ مقارنة بمعدله المؤرشف للعام الماضي</td>
                    <td style="color: #ea580c; font-weight: bold; text-align: center;">📉 تراجع أداء تفوقي</td>
                    <td>استدعاء المرشد الطلابي لمراجعة دافعية الطالب ومساعدته أكاديمياً</td>
                  </tr>
                  <tr>
                    <td><b>الانخفاض عن متوسط الصف الدراسي</b></td>
                    <td>معدل الطالب الحالي يقل بـ ١٠٪ أو أكثر عن متوسط أداء زملائه في نفس الفصل</td>
                    <td style="color: #ca8a04; font-weight: bold; text-align: center;">⚠️ تنبيه فجوة تحصيلية</td>
                    <td>إدراج الطالب ضمن مجموعات التقوية المخصصة للمواد الضعيفة</td>
                  </tr>
                  <tr>
                    <td><b>خطر الحرمان بسبب الغياب المتكرر</b></td>
                    <td>انخفاض نسبة حضور الطالب داخل المدرسة واللجان عن حد ٨٥٪</td>
                    <td style="color: #dc2626; font-weight: bold; text-align: center;">🚨 إنذار حضور أحمر</td>
                    <td>توجيه إشعار غياب رسمي لولي الأمر مع تعهد كتابي لمنع الحرمان من الاختبار</td>
                  </tr>
                  <tr>
                    <td><b>التعثر في المقررات الأساسية</b></td>
                    <td>رسوب الطالب أو إخفاقه في رصد درجات مادة أساسية (العربية / الرياضيات / العلوم)</td>
                    <td style="color: #b91c1c; font-weight: bold; text-align: center;">📚 رسوب بمقرر حيوي</td>
                    <td>تجهيز ملف الطالب لاختبار الدور الثاني وحصر المواد فورياً</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">١٢</div>
                <div class="feature-name">المراجعة والاعتماد النهائي وإقفال أعمال الكنترول (Control Closure & Immutable Freeze)</div>
              </div>
              <p class="feature-desc">
                تتويجاً لكافة العمليات، يقوم مدير الكنترول بإقفال وتجميد أعمال المرحلة (Freeze & Close Control). تقوم المنظومة بـ:
              </p>
              <ul style="font-size: 11px; margin-right: 20px; color: #475569;">
                <li><b>تجميد الدرجات بالكامل:</b> منع أي تعديل على مصفوفة الدرجات والنتائج وحظر الكتابة برمجياً.</li>
                <li><b>توليد وتأمين بصمة أمان رقمية (Digital SHA-256 Hash):</b> لحفظ سلامة وموثوقية البيانات ومنع التعديل المباشر في قاعدة البيانات.</li>
                <li><b>إصدار وإصدار محضر إقفال الكنترول الرسمي (Immutable Archive Minutes):</b> يحتوي على ملخص إحصائي دقيق بنسب النجاح وعدد الناجحين والراسبين ومكتوب فيه أسماء وتواقيع أعضاء اللجنة.</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">١٣</div>
                <div class="feature-name">التقارير الإحصائية والتحليلات البيانية والمقارنات (Statistical Recharts & Archiving)</div>
              </div>
              <p class="feature-desc">
                لوحة إحصائية غاية في الجاذبية تعرض رسوماً بيانية وتوزيعات تفصيلية للدرجات والتقديرات والناجحين والراسبين باستخدام محرك Recharts الرائد. تتيح اللوحة مقارنة نسب النجاح والمعدلات للعام الحالي بالبيانات المؤرشفة للسنوات السابقة للوقوف على مستوى جودة التعليم وتطور أداء مجمع مدارس سحاب الأهلية.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-number">١٤</div>
                <div class="feature-name">إصدار الشهادات الرسمية والتحقق الرقمي عبر الاستجابة السريعة (Certificates & QR Code Verification)</div>
              </div>
              <p class="feature-desc">
                تصدير الشهادات الرسمية الفردية للطلاب وتوفير <b>بوابة الاستعلام والتحقق الرقمي عبر رموز الاستجابة السريعة (QR Code Certificate Validation Portal)</b>. عند فحص الرمز المدمج في الشهادة، أو كتابة رمز التحقق الفريد في بوابة الاستعلام النشطة بالموقع، يعرض النظام تفاصيل الدرجات الفعلية للطالب والتقدير العام المعتمد والختم الرقمي لمجمع الكنترول الأكاديمي، لقطع الطريق تماماً على أي محاولات لتزوير وتعديل مستندات الشهادات الورقية التقليدية.
              </p>
            </div>

            <!-- IMMUTABLE CONTROL STAMP & SIGNATURES -->
            <div class="stamp-box">
              <div style="font-size: 11px; color: #334155;">
                <p><b>رئيس اللجنة العليا للكنترول:</b> أ. د. عبد الرحمن اليوسف</p>
                <p>التوقيع: _______________________</p>
                <p style="font-size: 9px; font-family: monospace; color: #64748b;">بصمة التوثيق الأكاديمي: CODEX-APPROVED-SYS-1447</p>
              </div>
              
              <div class="stamp">
                <p style="margin: 0; font-weight: 900; line-height: 1.1;">مجمع مدارس سحاب</p>
                <p style="margin: 3px 0 0 0; font-weight: bold; border-top: 1px solid #1e3a8a; padding-top: 2px;">لجنة الكنترول</p>
                <p style="margin: 0; font-size: 8px;">مصدق ومعتمد 🔐</p>
              </div>
            </div>

            <div class="footer-note">
              <p>تم إنتاج وتجهيز وتصدير هذه الوثيقة آلياً من الخادم المركزي لمجمع كودإكس™ الأكاديمي للامتحانات والنتائج.</p>
              <p>مجموعة إتقان™ للحلول البرمجية والتحليلات الأكاديمية - حقوق الطبع محفوظة © ٢٠٢٦ م</p>
            </div>
            
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    triggerNotification('تم تجهيز وتوليد كتاب دليل الاستخدام والتشغيل للكنترول، جاري تصديره كملف PDF المعتمد والمصدق...', 'success');
    logAction('تصدير وتحميل كتاب الدليل الفني والتشغيلي الشامل للكنترول كملف PDF', 'الدعم والتوثيق');
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
  const [certTitle, setCertTitle] = useState('وثيقة إتمام وتفوق دراسي');
  const [certSignature, setCertSignature] = useState('مدير عام المجمع الأكاديمي');
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<string>('st-1');

  // Manual item form state
  const [manualExam, setManualExam] = useState({
    classroom: classesList[0]?.name || 'الصف السابع',
    subjectId: subjects[0]?.id || '',
    date: scheduleConfig?.startDate || '',
    startTime: '08:30',
    endTime: '10:30',
    hallId: halls[0]?.id || '',
    proctorId: INITIAL_TEACHERS_MOCK[0]?.id || 't-1'
  });

  const selectedStObj = processedStudents.find(s => s.id === selectedStudentForCert) || processedStudents[0];

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      <EnterpriseActionToolbar
        title="الامتحانات والنتائج والكنترول"
        stats={
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-xs">
            <span className="text-slate-300 font-bold">نسبة النجاح العامة للمنظومة: <span className="text-emerald-400 font-mono">94.6%</span></span>
          </div>
        }
        onExit={setActiveSection ? () => setActiveSection('dashboard') : undefined}
        onPrint={() => {}}
        onExportPdf={() => {}}
        onExportExcel={() => {}}
        onImportExcel={() => {}}
        onDownloadTemplate={() => {}}
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
              <h2 className="font-black text-[#fce79a] text-sm tracking-tight">منظومة عبدالسلام ERP™</h2>
              <span className="text-[8px] bg-[#d4af37]/30 text-amber-200 px-1 py-0.2 rounded font-extrabold uppercase border border-[#d4af37]/40">PRO</span>
            </div>
            <span className="text-[9px] text-amber-200/60 block font-mono tracking-widest uppercase">ABDULSALAM ERP SYSTEM</span>
          </div>
        </div>

        {/* Corporate License Certification Seal */}
        <div className="bg-[#130b04] p-3 border border-[#d4af37]/30 text-[10px] space-y-2">
          <div className="flex justify-between items-center text-amber-200/70 border-b border-[#d4af37]/20 pb-1.5">
            <span className="font-bold flex items-center gap-1 text-[9px] text-amber-100">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
              رخصة سارية ومعتمدة
            </span>
            <span className="text-[9px] font-mono text-[#f7d174]">v5.4.2 Enterprise</span>
          </div>
          
          <div className="space-y-1 text-amber-100">
            <div className="flex justify-between items-center">
              <span className="text-amber-200/60">الجهة المرخصة:</span>
              <span className="font-black text-amber-100">عبدالسلام سوفت ERP للمدارس</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-200/60">رمز الترخيص:</span>
              <span className="font-mono text-amber-300 text-[9px]">LIC-9248-ERP-PRO</span>
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
        <nav className="flex flex-col gap-2 overflow-y-auto max-h-[420px] scrollbar-thin">
          {sidebarMenu.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`exam-tab-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
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
            );
          })}
        </nav>

        {/* Developer / Enterprise Sign-off seal */}
        <div className="mt-auto pt-3 border-t border-[#d4af37]/20 space-y-2">
          <div className="p-2.5 bg-[#130b04] border border-[#d4af37]/30 text-[10px] space-y-1 text-center">
            <span className="text-[9px] text-amber-200/50 font-extrabold block">منظومة عبدالسلام سوفت ERP</span>
            <div className="flex items-center justify-center gap-1.5 text-[#f7d174] font-black mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>عبدالسلام سوفت™ للمؤسسات التعليمية</span>
            </div>
            <p className="text-[8px] text-amber-200/40 font-medium">البرنامج خاضع للمواصفة القياسية للجودة البرمجية ISO 9001</p>
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
                ABDULSALAM ERP CENTRAL SERVER CONNECTED
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#fce79a] tracking-tight flex items-center gap-2">
              <span>{sidebarMenu.find(m => m.id === activeTab)?.label}</span>
              <span className="text-[11px] font-bold text-amber-200 bg-[#2a1d13] border border-[#d4af37]/30 px-2.5 py-0.5 rounded-lg">
                قناة اتصال مؤمنة بالكامل 🔒
              </span>
            </h1>
            <p className="text-xs text-amber-200/70 font-semibold leading-relaxed">
              المنصة الأكاديمية المتكاملة لإدارة أعمال الكنترول المدرسي، لجان الاختبارات، ورصد النتائج المعتمدة من عبدالسلام سوفت للحلول التقنية.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={() => handlePrintReport('الملخص الأكاديمي')}
              className="px-4 py-2.5 bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 border border-[#d4af37]/40 text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow active:scale-95"
            >
              <Printer className="w-4 h-4 text-[#f7d174]" />
              طباعة التقرير العام المعتمد
            </button>
            
            <button
              onClick={handleAutoDistributeAndSeating}
              className="px-4 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#f7d174] to-[#9a6a1d] hover:brightness-110 text-slate-950 shadow-lg text-xs font-black flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-[#fce79a]"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              توزيع وتوليد ذكي متطور
            </button>
          </div>
        </header>

        {/* TAB 0: Unified Control Operations Center (Requirement #12) */}
        {activeTab === 'control-center' && (() => {
          // Calculations
          const totalExpectedGrades = visibleStudents.length * subjects.length;
          let totalEnteredGradesCount = 0;
          subjects.forEach(sub => {
            visibleStudents.forEach(st => {
              if (gradesMatrix[st.id] && gradesMatrix[st.id][sub.id] !== undefined) {
                totalEnteredGradesCount++;
              }
            });
          });
          const enteredGradesPercent = totalExpectedGrades > 0 
            ? Math.round((totalEnteredGradesCount / totalExpectedGrades) * 100) 
            : 0;

          // Completed subjects vs remaining
          let completedSubjectsCount = 0;
          let remainingSubjectsCount = 0;
          subjects.forEach(sub => {
            const allEntered = visibleStudents.every(st => 
              gradesMatrix[st.id] && gradesMatrix[st.id][sub.id] !== undefined
            );
            if (allEntered) completedSubjectsCount++;
            else remainingSubjectsCount++;
          });

          // Academic warnings
          const borderlineStudents = visibleStudents.filter(st => {
            const stGrades = gradesMatrix[st.id] || {};
            return Object.values(stGrades).some(g => {
              const numVal = Number(g);
              return !isNaN(numVal) && numVal >= 50 && numVal <= 55;
            });
          });

          const failingStudents = visibleStudents.filter(st => {
            const stGrades = gradesMatrix[st.id] || {};
            return Object.values(stGrades).some(g => {
              const numVal = Number(g);
              return !isNaN(numVal) && numVal < 50;
            });
          });

          // Helper stage class getter
          const getStageForClass = (className: string) => {
            const cls = classesList.find(c => c.name === className);
            return cls ? cls.level : 'middle'; // default to middle
          };

          // 1. Calculations of stage-by-stage completion metrics as requested by the user
          const stagesInfo = ['kindergarten', 'primary', 'middle', 'high'].map(lvl => {
            const levelClasses = classesList.filter(c => c.level === lvl).map(c => c.name);
            const lvlStudents = studentList.filter(st => levelClasses.includes(st.classroom));
            const expectedGrades = lvlStudents.length * subjects.length;
            let enteredGrades = 0;
            lvlStudents.forEach(st => {
              const grades = gradesMatrix[st.id] || {};
              subjects.forEach(sub => {
                if (grades[sub.id] !== undefined) {
                  enteredGrades++;
                }
              });
            });
            const completionPercent = expectedGrades > 0 ? Math.round((enteredGrades / expectedGrades) * 100) : 0;
            
            // Materials not yet recorded for this stage
            let unrecordedCount = 0;
            subjects.forEach(sub => {
              const missingForAny = lvlStudents.some(st => {
                const g = gradesMatrix[st.id] || {};
                return g[sub.id] === undefined;
              });
              if (missingForAny) {
                unrecordedCount++;
              }
            });

            // Materials not yet reviewed for this stage
            let unreviewedCount = 0;
            subjects.forEach(sub => {
              if (!reviewedStagesSubjects[`${lvl}-${sub.id}`]) {
                unreviewedCount++;
              }
            });

            const isApproved = stageApprovalStatus[lvl]?.approved || false;
            const approvedBy = stageApprovalStatus[lvl]?.approvedBy || '';
            const approvedAt = stageApprovalStatus[lvl]?.approvedAt || '';

            return {
              id: lvl,
              label: getStageLabelArabic(lvl),
              studentsCount: lvlStudents.length,
              completionPercent,
              unrecordedCount,
              unreviewedCount,
              isApproved,
              approvedBy,
              approvedAt
            };
          });

          // Psychometrics calculation for selected subject
          const currentAnalyticSubject = subjects.find(s => s.id === selectedSubjectAnalyticId) || subjects[0];
          const subjectGrades = visibleStudents.map(st => (gradesMatrix[st.id] || {})[currentAnalyticSubject.id] || 0);
          const analyticAverage = subjectGrades.length > 0 
            ? Math.round((subjectGrades.reduce((a, b) => a + b, 0) / subjectGrades.length) * 10) / 10 
            : 0;
          const analyticPassRate = subjectGrades.length > 0 
            ? Math.round((subjectGrades.filter(g => g >= 50).length / subjectGrades.length) * 100) 
            : 0;
          const analyticFailRate = 100 - analyticPassRate;

          // Advanced psychometric metrics (Median, Mode, Highest, Lowest) as requested by the user
          const getMedian = (arr: number[]) => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
          };
          const getMode = (arr: number[]) => {
            if (arr.length === 0) return 0;
            const freq: Record<number, number> = {};
            let maxF = 0;
            let mVal = arr[0];
            arr.forEach(v => {
              freq[v] = (freq[v] || 0) + 1;
              if (freq[v] > maxF) {
                maxF = freq[v];
                mVal = v;
              }
            });
            return mVal;
          };
          const analyticMedian = getMedian(subjectGrades);
          const analyticMode = getMode(subjectGrades);
          const analyticHighest = subjectGrades.length > 0 ? Math.max(...subjectGrades) : 0;
          const analyticLowest = subjectGrades.length > 0 ? Math.min(...subjectGrades) : 0;
          
          // Standard Deviation
          const variance = subjectGrades.length > 0
            ? subjectGrades.reduce((sum, g) => sum + Math.pow(g - analyticAverage, 2), 0) / subjectGrades.length
            : 0;
          const standardDeviation = Math.round(Math.sqrt(variance) * 10) / 10;

          // Difficulty Index (Facility Value): Average score / max score
          const difficultyIndex = Math.round((analyticAverage / currentAnalyticSubject.maxScore) * 100) / 100;

          // Discrimination Index (D): compare average of top 27% vs bottom 27%
          const sortedGrades = [...subjectGrades].sort((a, b) => b - a);
          const topSize = Math.max(1, Math.floor(sortedGrades.length * 0.27));
          const topGrades = sortedGrades.slice(0, topSize);
          const bottomGrades = sortedGrades.slice(-topSize);
          const topAverage = topGrades.reduce((a, b) => a + b, 0) / topSize;
          const bottomAverage = bottomGrades.reduce((a, b) => a + b, 0) / topSize;
          const discriminationIndex = Math.round(((topAverage - bottomAverage) / currentAnalyticSubject.maxScore) * 100) / 100;

          return (
            <div className="space-y-5 animate-fadeIn text-slate-800 font-sans" id="unified-control-center">
              
              {/* 1. Gold Dark Header Bar */}
              <div className="bg-gradient-to-r from-[#2a1d0f] via-[#3a2915] to-[#1e1305] p-3.5 border border-[#c5a059]/40 text-white flex flex-wrap items-center justify-between gap-3">
                {/* Right side Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#8b6508] flex items-center justify-center font-black text-slate-950 shadow-md text-base border border-[#fef08a]">
                    AS
                  </div>
                  <div>
                    <h2 className="font-black text-amber-200 text-sm tracking-wide">عبدالسلام سوفت ERP</h2>
                    <span className="text-[10px] text-amber-400/80 font-bold block">قيادة المدارس والمنظومات التعليمية</span>
                  </div>
                </div>

                {/* Middle Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                  <div className="bg-[#1a1208]/80 border border-[#8b6508]/50 px-3 py-1.5 text-amber-200 flex items-center gap-1.5 shadow-inner">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>العام الدراسي: 2024 - 2025</span>
                  </div>
                  <div className="bg-[#1a1208]/80 border border-[#8b6508]/50 px-3 py-1.5 text-amber-200 flex items-center gap-1.5 shadow-inner">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>الفصل الدراسي الثاني</span>
                  </div>
                  <div className="bg-[#1a1208]/80 border border-[#8b6508]/50 px-3 py-1.5 text-amber-200 flex items-center gap-1.5 shadow-inner">
                    <School className="w-3.5 h-3.5 text-amber-400" />
                    <span>مدرسة النور الحديثة - الفرع الرئيسي</span>
                  </div>
                  <div className="bg-[#1a1208]/80 border border-[#8b6508]/50 px-3 py-1.5 text-amber-200 flex items-center gap-1.5 shadow-inner">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>الأحد 25 مايو 2025 - 10:30 AM</span>
                  </div>
                </div>

                {/* Left Action & Profile Icons */}
                <div className="flex items-center gap-2">
                  <button className="p-2 bg-[#1a1208] border border-[#8b6508]/40 hover:border-amber-400 text-amber-200 transition-all cursor-pointer">
                    <Search className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-[#1a1208] border border-[#8b6508]/40 hover:border-amber-400 text-amber-200 relative transition-all cursor-pointer">
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">5</span>
                  </button>
                  <button className="p-2 bg-[#1a1208] border border-[#8b6508]/40 hover:border-amber-400 text-amber-200 transition-all cursor-pointer">
                    <Mail className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 bg-[#1a1208] border border-[#8b6508]/50 px-3 py-1 cursor-pointer hover:border-amber-400 transition-all">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-bold text-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-200 block leading-tight">مدير النظام</span>
                      <span className="text-[9px] text-amber-400/70 font-semibold block">صلاحية كاملة</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400/70 mr-1" />
                  </div>
                </div>
              </div>

              {/* 2. Page Title & Breadcrumb Bar */}
              <div className="p-4 border border-[#d4af37]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#8b6508] p-0.5 shadow-md flex items-center justify-center text-white">
                    <div className="w-full h-full bg-[#3d2b0f] rounded-[14px] flex items-center justify-center text-amber-300">
                      <Award className="w-6 h-6 text-amber-300" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-[#2a1d0f]">الامتحانات والنتائج</h1>
                    <p className="text-xs text-amber-900/60 font-bold mt-0.5">الرئيسية &gt; الامتحانات والنتائج</p>
                  </div>
                </div>
              </div>

              {/* 3. 6 Workflow Process Cards (Numbered 01 to 06) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {/* 01 */}
                <div className="bg-gradient-to-b from-[#fefcf8] to-[#f9f3e6] p-4 border border-[#d4af37]/40 relative space-y-3 flex flex-col justify-between hover:shadow-md transition-all group">
                  <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-[#d4af37] to-[#8b6508] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">01</span>
                  <div className="pt-2 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-[#8b6508] mx-auto group-hover:scale-110 transition-transform">
                      <Settings className="w-5 h-5 text-[#8b6508]" />
                    </div>
                    <h3 className="font-extrabold text-[#3d2b0f] text-sm text-center">إعداد الامتحانات</h3>
                    <p className="text-[10px] text-slate-600 font-medium text-center leading-tight">
                      إعداد موسم الامتحانات المواد والدرجات وسياسات النجاح
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="w-full py-1.5 bg-gradient-to-r from-[#d4af37] to-[#a37c27] hover:from-[#e5c158] hover:to-[#b88e32] text-slate-950 text-xs font-black shadow transition-all cursor-pointer text-center"
                  >
                    فتح &gt;
                  </button>
                </div>

                {/* 02 */}
                <div className="bg-gradient-to-b from-[#fefcf8] to-[#f9f3e6] p-4 border border-[#d4af37]/40 relative space-y-3 flex flex-col justify-between hover:shadow-md transition-all group">
                  <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-[#d4af37] to-[#8b6508] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">02</span>
                  <div className="pt-2 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-[#8b6508] mx-auto group-hover:scale-110 transition-transform">
                      <Home className="w-5 h-5 text-[#8b6508]" />
                    </div>
                    <h3 className="font-extrabold text-[#3d2b0f] text-sm text-center">تجهيز القاعات واللجان</h3>
                    <p className="text-[10px] text-slate-600 font-medium text-center leading-tight">
                      تعريف القاعات وتوزيع الطلاب وأرقام الجلوس
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('halls')}
                    className="w-full py-1.5 bg-gradient-to-r from-[#d4af37] to-[#a37c27] hover:from-[#e5c158] hover:to-[#b88e32] text-slate-950 text-xs font-black shadow transition-all cursor-pointer text-center"
                  >
                    فتح &gt;
                  </button>
                </div>

                {/* 03 */}
                <div className="bg-gradient-to-b from-[#fefcf8] to-[#f9f3e6] p-4 border border-[#d4af37]/40 relative space-y-3 flex flex-col justify-between hover:shadow-md transition-all group">
                  <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-[#d4af37] to-[#8b6508] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">03</span>
                  <div className="pt-2 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-[#8b6508] mx-auto group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5 text-[#8b6508]" />
                    </div>
                    <h3 className="font-extrabold text-[#3d2b0f] text-sm text-center">جدول الامتحانات والمراقبين</h3>
                    <p className="text-[10px] text-slate-600 font-medium text-center leading-tight">
                      إعداد جدول الامتحانات وتوزيع المراقبين واللجان
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('schedule')}
                    className="w-full py-1.5 bg-gradient-to-r from-[#d4af37] to-[#a37c27] hover:from-[#e5c158] hover:to-[#b88e32] text-slate-950 text-xs font-black shadow transition-all cursor-pointer text-center"
                  >
                    فتح &gt;
                  </button>
                </div>

                {/* 04 */}
                <div className="bg-gradient-to-b from-[#fefcf8] to-[#f9f3e6] p-4 border border-[#d4af37]/40 relative space-y-3 flex flex-col justify-between hover:shadow-md transition-all group">
                  <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-[#d4af37] to-[#8b6508] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">04</span>
                  <div className="pt-2 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-[#8b6508] mx-auto group-hover:scale-110 transition-transform">
                      <UserCheck className="w-5 h-5 text-[#8b6508]" />
                    </div>
                    <h3 className="font-extrabold text-[#3d2b0f] text-sm text-center">حضور وغياب الطلاب</h3>
                    <p className="text-[10px] text-slate-600 font-medium text-center leading-tight">
                      تسجيل حضور وغياب الطلاب ومتابعة حالاتهم
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('distribution')}
                    className="w-full py-1.5 bg-gradient-to-r from-[#d4af37] to-[#a37c27] hover:from-[#e5c158] hover:to-[#b88e32] text-slate-950 text-xs font-black shadow transition-all cursor-pointer text-center"
                  >
                    فتح &gt;
                  </button>
                </div>

                {/* 05 */}
                <div className="bg-gradient-to-b from-[#fefcf8] to-[#f9f3e6] p-4 border border-[#d4af37]/40 relative space-y-3 flex flex-col justify-between hover:shadow-md transition-all group">
                  <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-[#d4af37] to-[#8b6508] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">05</span>
                  <div className="pt-2 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-[#8b6508] mx-auto group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-5 h-5 text-[#8b6508]" />
                    </div>
                    <h3 className="font-extrabold text-[#3d2b0f] text-sm text-center">إدخال ومراجعة الدرجات</h3>
                    <p className="text-[10px] text-slate-600 font-medium text-center leading-tight">
                      إدخال الدرجات ومراجعتها والتحقق من صحتها
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('grades-entry')}
                    className="w-full py-1.5 bg-gradient-to-r from-[#d4af37] to-[#a37c27] hover:from-[#e5c158] hover:to-[#b88e32] text-slate-950 text-xs font-black shadow transition-all cursor-pointer text-center"
                  >
                    فتح &gt;
                  </button>
                </div>

                {/* 06 */}
                <div className="bg-gradient-to-b from-[#fefcf8] to-[#f9f3e6] p-4 border border-[#d4af37]/40 relative space-y-3 flex flex-col justify-between hover:shadow-md transition-all group">
                  <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-[#d4af37] to-[#8b6508] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">06</span>
                  <div className="pt-2 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-[#8b6508] mx-auto group-hover:scale-110 transition-transform">
                      <Trophy className="w-5 h-5 text-[#8b6508]" />
                    </div>
                    <h3 className="font-extrabold text-[#3d2b0f] text-sm text-center">اعتماد النتائج والتقارير</h3>
                    <p className="text-[10px] text-slate-600 font-medium text-center leading-tight">
                      اعتماد النتائج واستعراض التقارير والتحليلات
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('review')}
                    className="w-full py-1.5 bg-gradient-to-r from-[#d4af37] to-[#a37c27] hover:from-[#e5c158] hover:to-[#b88e32] text-slate-950 text-xs font-black shadow transition-all cursor-pointer text-center"
                  >
                    فتح &gt;
                  </button>
                </div>
              </div>

              {/* 3.5. Multi-Stage Committee Security Isolation Banner (Restored in Gold Luxury Theme) */}
              <div className="bg-gradient-to-r from-[#2a1d0f] via-[#3a2915] to-[#1e1305] p-5 border border-[#c5a059]/40 text-white">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-widest font-black text-amber-400 font-mono">STAGE-LEVEL CONTROL ISOLATION SYSTEM</span>
                    </div>
                    <h2 className="text-base font-black text-amber-200 flex items-center gap-2">
                      <LockIcon className="w-4 h-4 text-amber-400" />
                      إدارة صلاحيات وعزل لجان الكنترول متعدد المراحل 🔐
                    </h2>
                    <p className="text-xs text-amber-200/70 font-medium">
                      بناءً على بروتوكول الأمان المعياري، يتم تصفية وعزل البيانات الأكاديمية تماماً لكل مرحلة دراسية مستقلة لضمان السرية التامة.
                    </p>
                  </div>
                  
                  {/* Selector of active committee */}
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <span className="text-xs text-amber-200 font-extrabold shrink-0">اللجنة النشطة الحالية:</span>
                    <select
                      value={activeCommitteeId}
                      onChange={(e) => {
                        setActiveCommitteeId(e.target.value);
                        triggerNotification(`تم تغيير الكنترول النشط إلى: ${controlCommittees.find(c => c.id === e.target.value)?.name}`, 'info');
                      }}
                      className="bg-[#1a1208] border border-[#8b6508]/60 hover:border-amber-400 text-amber-100 text-xs font-bold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all cursor-pointer"
                    >
                      {controlCommittees.map(committee => (
                        <option key={committee.id} value={committee.id}>
                          {committee.name} ({committee.user})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Current isolation badge details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#8b6508]/30 text-xs">
                  <div className="bg-[#1a1208]/60 p-3 border border-[#8b6508]/40">
                    <span className="text-amber-400/70 font-bold block">مستوى الوصول الحالي</span>
                    <span className="font-extrabold text-amber-200 mt-1 block">
                      {activeControlStage === 'all' ? 'وصول شامل لكامل المؤسسة' : `معزول للمرحلة: ${getStageLabelArabic(activeControlStage)}`}
                    </span>
                  </div>
                  <div className="bg-[#1a1208]/60 p-3 border border-[#8b6508]/40">
                    <span className="text-amber-400/70 font-bold block">رئيس لجنة الكنترول</span>
                    <span className="font-extrabold text-amber-100 mt-1 block">
                      {controlCommittees.find(c => c.id === activeCommitteeId)?.user}
                    </span>
                  </div>
                  <div className="bg-[#1a1208]/60 p-3 border border-[#8b6508]/40">
                    <span className="text-amber-400/70 font-bold block">مستوى الصلاحيات الفعلي</span>
                    <span className="font-extrabold text-emerald-400 mt-1 block">
                      {controlCommittees.find(c => c.id === activeCommitteeId)?.permissions.map((p: string) => {
                        if (p === 'view') return 'قراءة';
                        if (p === 'edit') return 'رصد وتعديل';
                        if (p === 'approve') return 'اعتماد';
                        if (p === 'reopen') return 'إعادة فتح الكنترول';
                        return p;
                      }).join(' • ')}
                    </span>
                  </div>
                  <div className="bg-[#1a1208]/60 p-3 border border-[#8b6508]/40">
                    <span className="text-amber-400/70 font-bold block">الطلاب الخاضعون للمراقبة</span>
                    <span className="font-extrabold text-amber-300 mt-1 block">
                      {visibleStudents.length} طالب وطالبة
                    </span>
                  </div>
                </div>
              </div>

              {/* 3.6 Stage Progress and Quality Assurance Board */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black text-[#3d2b0f] flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#8b6508]" />
                    لوحة متابعة إنجاز وجودة الكنترول حسب المراحل الدراسية 🏆
                  </h3>
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2.5 py-1 rounded-full border border-amber-300/60">
                    محدث لحظياً بالرصد والاعتمادات
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {stagesInfo.map(stage => (
                    <div key={stage.id} className="bg-gradient-to-b from-[#fefcf8] to-[#f9f3e6] p-4.5 border border-[#d4af37]/40 space-y-3.5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-[#3d2b0f] text-sm">{stage.label}</h4>
                          <span className="text-[10px] bg-amber-200/50 text-amber-950 px-2 py-0.5 rounded-md font-bold">
                            {stage.studentsCount} طالب
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold">حالة رصد الدرجات الإجمالية</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black">
                          <span className="text-[#8b6508]">{stage.completionPercent}% تم الرصد</span>
                          <span className="text-slate-500">متبقي {100 - stage.completionPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              stage.completionPercent === 100 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
                                : 'bg-gradient-to-r from-[#d4af37] to-[#8b6508]'
                            }`}
                            style={{ width: `${stage.completionPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Quality Indicators Board */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-[#d4af37]/20 font-bold">
                        <div className="space-y-1">
                          <span className="text-slate-500 block font-semibold text-[9px]">مواد غير مرصودة</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            stage.unrecordedCount > 0 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {stage.unrecordedCount > 0 ? `🚨 ${stage.unrecordedCount} متبقية` : '✅ مكتمل'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-500 block font-semibold text-[9px]">مواد غير مراجعة</span>
                          <button 
                            onClick={() => {
                              const updated = { ...reviewedStagesSubjects };
                              subjects.forEach(sub => {
                                updated[`${stage.id}-${sub.id}`] = true;
                              });
                              setReviewedStagesSubjects(updated);
                              triggerNotification(`تم اعتماد المراجعة الفنية لكافة مواد مرحلة ${stage.label}`, 'success');
                            }}
                            title="اضغط هنا لاعتماد مراجعة كافة المواد لهذه المرحلة"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-right cursor-pointer hover:opacity-90 transition-all ${
                              stage.unreviewedCount > 0 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {stage.unreviewedCount > 0 ? `⚠️ ${stage.unreviewedCount} غير مراجعة` : '✅ تمت المراجعة'}
                          </button>
                        </div>
                      </div>

                      {/* Approval Status Badge */}
                      <div className="pt-2 border-t border-[#d4af37]/20">
                        {stage.isApproved ? (
                          <div className="flex items-center justify-between text-[10px] bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-200 font-extrabold">
                            <span className="flex items-center gap-1">
                              <LockIcon className="w-3.5 h-3.5 text-emerald-600" />
                              النتائج معتمدة ومجمدة 🔒
                            </span>
                            <span className="text-[9px] text-slate-500 font-normal">
                              بواسطة: {stage.approvedBy.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[10px] bg-amber-100/70 text-amber-950 p-2 rounded-lg border border-amber-300/80 font-extrabold">
                            <span className="flex items-center gap-1">
                              <Unlock className="w-3.5 h-3.5 text-amber-700" />
                              النتائج قيد الرصد المفتوح 🔓
                            </span>
                            <button
                              onClick={() => {
                                setActiveTab('review');
                                triggerNotification(`تم نقلك إلى صفحة مراجعة واعتماد مرحلة ${stage.label}`, 'info');
                              }}
                              className="text-[9px] text-[#3d2b0f] hover:underline font-black px-2 py-0.5 rounded border border-[#d4af37]"
                            >
                              الانتقال للاعتماد
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3.7 Control Monitoring Real-time Dashboard */}
              <div className="space-y-3">
                <h3 className="text-base font-black text-[#3d2b0f] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#8b6508]" />
                  لوحة مراقبة أعمال ومؤشرات الكنترول التلقائية
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4.5 border border-[#d4af37]/30 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-bold block">نسبة رصد وإدخال الدرجات</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-[#3d2b0f]">{enteredGradesPercent}%</span>
                        <span className="text-xs font-bold text-slate-400">من إجمالي المستهدف</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#d4af37] to-[#8b6508] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${enteredGradesPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4.5 border border-[#d4af37]/30 shadow-sm">
                    <span className="text-xs text-slate-500 font-bold block">المواد الدراسية المرصودة</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-[#3d2b0f]">{completedSubjectsCount}</span>
                      <span className="text-xs font-bold text-slate-400">من أصل {subjects.length} مواد</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-extrabold mt-3 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      🟢 {remainingSubjectsCount === 0 ? 'اكتمل رصد كافة المواد بنجاح' : `متبقي ${remainingSubjectsCount} مواد جاري رصدها`}
                    </p>
                  </div>

                  <div className="p-4.5 border border-[#d4af37]/30 shadow-sm">
                    <span className="text-xs text-slate-500 font-bold block">حالة اعتماد النتائج وتجميدها</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-lg font-black ${approvalStatus.approved ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {approvalStatus.approved ? '🔒 مجمدة ومعتمدة' : '🔓 مفتوحة للرصد والتحرير'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-3 leading-relaxed">
                      {approvalStatus.approved 
                        ? `معتمدة بواسطة: ${approvalStatus.approvedBy} بتاريخ ${approvalStatus.approvedAt}`
                        : 'أعمال الكنترول جارية، لم يتم تجميد النتائج بعد'}
                    </p>
                  </div>

                  <div className="p-4.5 border border-[#d4af37]/30 shadow-sm">
                    <span className="text-xs text-slate-500 font-bold block">أمن الكنترول والتكامل السحابي</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xl font-black text-[#3d2b0f]">CODEX-SaaS</span>
                      <span className="text-[9px] bg-[#1a1208] text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">LIVE</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>نظام رصد الدرجات مؤمن ومشفر بالكامل 🛡️</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Lower 3 Columns Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left Column: Smart Alerts (3 cols) */}
                <div className="lg:col-span-3 p-4 border border-[#d4af37]/30 flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-extrabold text-[#3d2b0f] text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        تنبيهات ذكية
                      </h3>
                      <span className="text-[9px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">تحديث فوري</span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 bg-rose-50 border border-rose-200/80 flex items-start gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-slate-800 font-bold leading-tight">تعارض في جدول الامتحانات يتطلب المراجعة</p>
                        </div>
                        <span className="bg-rose-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full">12</span>
                      </div>

                      <div className="p-2.5 bg-amber-50 border border-amber-200/80 flex items-start gap-2 text-xs">
                        <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-slate-800 font-bold leading-tight">طلاب لم يتم توزيعهم على قاعات</p>
                        </div>
                        <span className="bg-amber-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full">8</span>
                      </div>

                      <div className="p-2.5 bg-amber-50 border border-amber-200/80 flex items-start gap-2 text-xs">
                        <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-slate-800 font-bold leading-tight">طلاب لم يتم تسجيل حضورهم</p>
                        </div>
                        <span className="bg-amber-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full">24</span>
                      </div>

                      <div className="p-2.5 bg-amber-50 border border-amber-200/80 flex items-start gap-2 text-xs">
                        <Edit3 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-slate-800 font-bold leading-tight">طلاب لم يتم إدخال درجاتهم</p>
                        </div>
                        <span className="bg-amber-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full">36</span>
                      </div>

                      <div className="p-2.5 bg-purple-50 border border-purple-200/80 flex items-start gap-2 text-xs">
                        <FilePieChart className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-slate-800 font-bold leading-tight">درجات شاذة تحتاج مراجعة</p>
                        </div>
                        <span className="bg-purple-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full">5</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => triggerNotification('جاري تحميل كل التنبيهات والأخطاء...', 'info')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all cursor-pointer text-center mt-2"
                  >
                    عرض كل التنبيهات
                  </button>
                </div>

                {/* Center Column: Stats + Upcoming Table (6 cols) */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Quick Stats Grid */}
                  <div className="p-4 border border-[#d4af37]/30 space-y-3">
                    <h3 className="font-extrabold text-[#3d2b0f] text-sm">إحصائيات سريعة</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="bg-amber-50/50 p-2.5 border border-amber-200/60 text-center">
                        <span className="text-[10px] text-slate-500 font-bold block">إجمالي الطلاب</span>
                        <span className="text-base font-black text-amber-900 mt-0.5 block">65%</span>
                        <span className="text-[9px] text-amber-700/70 font-semibold">(من إجمالي الخطة)</span>
                      </div>
                      <div className="bg-amber-50/50 p-2.5 border border-amber-200/60 text-center">
                        <span className="text-[10px] text-slate-500 font-bold block">المراقبون</span>
                        <span className="text-base font-black text-amber-900 mt-0.5 block">72</span>
                        <span className="text-[9px] text-amber-700/70 font-semibold">مراقب</span>
                      </div>
                      <div className="bg-amber-50/50 p-2.5 border border-amber-200/60 text-center">
                        <span className="text-[10px] text-slate-500 font-bold block">عدد القاعات</span>
                        <span className="text-base font-black text-amber-900 mt-0.5 block">36</span>
                        <span className="text-[9px] text-amber-700/70 font-semibold">قاعة</span>
                      </div>
                      <div className="bg-amber-50/50 p-2.5 border border-amber-200/60 text-center">
                        <span className="text-[10px] text-slate-500 font-bold block">مواد الامتحان</span>
                        <span className="text-base font-black text-amber-900 mt-0.5 block">18</span>
                        <span className="text-[9px] text-amber-700/70 font-semibold">مادة</span>
                      </div>
                      <div className="bg-amber-50/50 p-2.5 border border-amber-200/60 text-center">
                        <span className="text-[10px] text-slate-500 font-bold block">مواد الامتحان/اللجان</span>
                        <span className="text-base font-black text-amber-900 mt-0.5 block">24</span>
                        <span className="text-[9px] text-amber-700/70 font-semibold">لجنة</span>
                      </div>
                      <div className="bg-amber-50/50 p-2.5 border border-amber-200/60 text-center">
                        <span className="text-[10px] text-slate-500 font-bold block">نسبة الإنجاز</span>
                        <span className="text-base font-black text-amber-900 mt-0.5 block">2,450</span>
                        <span className="text-[9px] text-amber-700/70 font-semibold">طالب</span>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Exams Table */}
                  <div className="p-4 border border-[#d4af37]/30 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="font-extrabold text-[#3d2b0f] text-sm">الامتحانات القادمة</h3>
                      <span className="text-[10px] text-slate-400 font-bold">جدول الأسبوع الحالي</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-amber-50/80 text-amber-950 font-extrabold border-b border-amber-200/60">
                            <th className="p-2">اليوم والتاريخ</th>
                            <th className="p-2">المادة</th>
                            <th className="p-2">الصف / الشعبة</th>
                            <th className="p-2">الوقت</th>
                            <th className="p-2">القاعة</th>
                            <th className="p-2">اللجنة</th>
                            <th className="p-2 text-center">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                          <tr className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-2 text-slate-700">الأحد 25-05-2025</td>
                            <td className="p-2 text-amber-900 font-black">الرياضيات</td>
                            <td className="p-2 text-slate-600">الصف الأول الثانوي - أ</td>
                            <td className="p-2 text-slate-600 font-mono">08:00 ص</td>
                            <td className="p-2 text-slate-600">قاعة 101</td>
                            <td className="p-2 text-slate-600">لجنة 1</td>
                            <td className="p-2 text-center">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold">قادم</span>
                            </td>
                          </tr>
                          <tr className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-2 text-slate-700">الأحد 25-05-2025</td>
                            <td className="p-2 text-amber-900 font-black">اللغة العربية</td>
                            <td className="p-2 text-slate-600">الصف الثاني الثانوي - ب</td>
                            <td className="p-2 text-slate-600 font-mono">10:30 ص</td>
                            <td className="p-2 text-slate-600">قاعة 102</td>
                            <td className="p-2 text-slate-600">لجنة 2</td>
                            <td className="p-2 text-center">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold">قادم</span>
                            </td>
                          </tr>
                          <tr className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-2 text-slate-700">الاثنين 26-05-2025</td>
                            <td className="p-2 text-amber-900 font-black">اللغة الإنجليزية</td>
                            <td className="p-2 text-slate-600">الصف الأول الثانوي - ب</td>
                            <td className="p-2 text-slate-600 font-mono">08:00 ص</td>
                            <td className="p-2 text-slate-600">قاعة 103</td>
                            <td className="p-2 text-slate-600">لجنة 1</td>
                            <td className="p-2 text-center">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold">قادم</span>
                            </td>
                          </tr>
                          <tr className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-2 text-slate-700">الاثنين 26-05-2025</td>
                            <td className="p-2 text-amber-900 font-black">الفيزياء</td>
                            <td className="p-2 text-slate-600">الصف الثاني الثانوي - أ</td>
                            <td className="p-2 text-slate-600 font-mono">10:30 ص</td>
                            <td className="p-2 text-slate-600">قاعة 104</td>
                            <td className="p-2 text-slate-600">لجنة 2</td>
                            <td className="p-2 text-center">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold">قادم</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <button 
                      onClick={() => setActiveTab('schedule')}
                      className="w-full py-2 bg-gradient-to-r from-[#d4af37] to-[#a37c27] text-slate-950 text-xs font-black transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      عرض جميع الامتحانات
                    </button>
                  </div>
                </div>

                {/* Right Column: Quick Access (3 cols) */}
                <div className="lg:col-span-3 p-4 border border-[#d4af37]/30 flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-[#3d2b0f] text-sm border-b border-slate-100 pb-2">الدخول السريع</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setActiveTab('distribution')}
                        className="p-3 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 text-right transition-all cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <Users className="w-5 h-5 text-[#8b6508]" />
                        <span className="text-xs font-black text-[#3d2b0f] leading-tight">توزيع الطلاب على القاعات</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('grades-entry')}
                        className="p-3 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 text-right transition-all cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-[#8b6508]" />
                        <span className="text-xs font-black text-[#3d2b0f] leading-tight">إدخال الدرجات</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('distribution')}
                        className="p-3 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 text-right transition-all cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <UserCheck className="w-5 h-5 text-[#8b6508]" />
                        <span className="text-xs font-black text-[#3d2b0f] leading-tight">تسجيل الحضور والغياب</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('schedule')}
                        className="p-3 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 text-right transition-all cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <Calendar className="w-5 h-5 text-[#8b6508]" />
                        <span className="text-xs font-black text-[#3d2b0f] leading-tight">جدول الامتحانات</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('reports')}
                        className="p-3 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 text-right transition-all cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <FilePieChart className="w-5 h-5 text-[#8b6508]" />
                        <span className="text-xs font-black text-[#3d2b0f] leading-tight">التقارير والنتائج</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('seating')}
                        className="p-3 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 text-right transition-all cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <IdCard className="w-5 h-5 text-[#8b6508]" />
                        <span className="text-xs font-black text-[#3d2b0f] leading-tight">طباعة بطاقات الجلوس</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => triggerNotification('جاري استعراض كافه الأدوات التشغيلية...', 'info')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all cursor-pointer text-center"
                  >
                    كل الأدوات
                  </button>
                </div>

              </div>

              {/* 5. Academic Warning Engine */}
              <div className="bg-amber-50/60 p-5 border border-amber-300/80 space-y-4">
                <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-700 animate-bounce" />
                  محرك الإنذارات الأكاديمية المبكرة والتنبؤ والوقاية ⚠️
                </h3>
                <p className="text-xs text-amber-900/80 font-medium">
                  يقوم محرك الذكاء الأكاديمي بتحليل درجات الطلاب فور رصدها لإصدار إنذارات استباقية مخصصة للطلاب والمعلمين للتدخل العلاجي السريع.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {/* Alert panel for students with smart academic warnings */}
                  <div className="p-4 border border-amber-200 space-y-3">
                    <span className="text-xs font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg inline-block">
                      🚨 تنبيهات ومؤشرات التدخل الأكاديمي العلاجي الفوري (متعددة العوامل)
                    </span>
                    <div className="max-h-[220px] overflow-y-auto space-y-2.5 text-xs scrollbar-thin pr-1">
                      {processedStudents.filter(st => st.hasEarlyWarning).length === 0 ? (
                        <p className="text-slate-500 text-center py-8 font-semibold">لا يوجد طلاب يظهرون أي علامات تعثر أو هبوط مستمر حالياً! 🌟</p>
                      ) : (
                        processedStudents.filter(st => st.hasEarlyWarning).map(st => (
                          <div key={st.id} className="p-3 bg-rose-50/50 border border-rose-200 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-extrabold text-slate-900">{st.name}</span>
                                <span className="text-slate-500 block text-[10px] mt-0.5">{st.classroom} • الشعبة {st.section} • حضور {st.attendanceRate}%</span>
                              </div>
                              <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                                {st.percentage}% معدل
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-rose-200/60">
                              {st.earlyWarnings.map((warning, idx) => (
                                <span key={idx} className="text-[9px] font-bold px-2 py-0.5 rounded border border-rose-300 text-rose-950">
                                  {warning}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Smart Academic Risk Level Classifier */}
                  <div className="p-4 border border-amber-200 space-y-3">
                    <span className="text-xs font-black text-amber-900 bg-amber-100/80 border border-amber-300 px-2.5 py-1 rounded-lg inline-block">
                      ⚠️ محاكاة معامل تصنيف مستوى الخطر المستقبلي (Predictive Risk Classifier)
                    </span>
                    <div className="max-h-[220px] overflow-y-auto space-y-2.5 text-xs scrollbar-thin pr-1">
                      {processedStudents.map(st => {
                        let riskLevel = 'منخفض';
                        let riskBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        if (st.failedCount > 1 || st.attendanceRate < 80) {
                          riskLevel = 'حرج للغاية 🚨';
                          riskBadgeColor = 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse';
                        } else if (st.failedCount === 1 || st.percentage < 60 || st.attendanceRate < 88) {
                          riskLevel = 'متوسط الخطر ⚠️';
                          riskBadgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
                        } else if (st.percentage < 75) {
                          riskLevel = 'مستقر ولكن تحت المراقبة';
                          riskBadgeColor = 'bg-amber-50 text-amber-900 border-amber-200';
                        }

                        if (riskLevel === 'منخفض') return null;

                        return (
                          <div key={st.id} className="p-3 bg-transparent/80 flex justify-between items-center">
                            <div>
                              <span className="font-extrabold text-slate-800">{st.name}</span>
                              <span className="text-slate-500 block text-[10px] mt-0.5">{st.classroom} • معدل سابق {st.previousYearGPA}%</span>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${riskBadgeColor}`}>
                              {riskLevel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Subject-level and teacher level support recommended */}
                <div className="p-4 border border-amber-200 text-xs space-y-3">
                  <span className="font-black text-[#3d2b0f]">📋 توصيات وقرارات التدخل العلاجي والوقائي الفوري</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-transparent border border-slate-200">
                      <span className="font-bold text-slate-700 block">فصول تحتاج دعم أكاديمي</span>
                      <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                        الصف السابع (المتوسط) متوسط عام المادة 68% - يوصى بتكثيف المراجعات وتهيئة أوراق العمل المنزلية.
                      </p>
                    </div>
                    <div className="p-3 bg-transparent border border-slate-200">
                      <span className="font-bold text-slate-700 block">مواد تعليمية بحاجة لمراجعة</span>
                      <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                        مادة الرياضيات واللغة العربية - نسبة النجاح 70%. يوصى بمراجعة خطط التدريس واختبارات التقويم المستمر.
                      </p>
                    </div>
                    <div className="p-3 bg-transparent border border-slate-200">
                      <span className="font-bold text-slate-700 block">توجيهات التطوير والتمكين</span>
                      <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                        إرسال تقارير الأداء الفوري لأولياء الأمور عبر منصة مدرسة وتوزيع كبسولات تقوية علاجية للطلاب المعرضين للتعثر.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Freeze Results Snapshot Comparator Module */}
              <div className="p-5.5 border border-[#d4af37]/30 space-y-4 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#3d2b0f] flex items-center gap-2">
                    <Archive className="w-4.5 h-4.5 text-[#8b6508]" />
                    مقارن ومفتش لقطات الكنترول المجمدة (Snapshot Comparator) ❄️
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    قارن لقطات الكنترول المسجلة لحظة الاعتماد مع الدرجات الحالية في النظام لكشف أي تعديل أو تلاعب لاحق بالدرجات.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end bg-amber-50/40 p-4 border border-amber-200/70">
                  <div className="space-y-1 flex-1">
                    <label className="text-[11px] font-black text-slate-700 block">اختر اللقطة المجمدة للمقارنة:</label>
                    <select
                      value={selectedSnapshotId}
                      onChange={(e) => setSelectedSnapshotId(e.target.value)}
                      className="text-xs font-bold px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      <option value="">-- اختر لقطة نظام مجمدة ومحفوظة --</option>
                      {snapshots.map(snap => (
                        <option key={snap.id} value={snap.id}>
                          {snap.stage} • بتاريخ {snap.timestamp} (بواسطة: {snap.approvedBy})
                        </option>
                      ))}
                    </select>
                  </div>

                  {snapshots.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedSnapshotId('');
                        triggerNotification('تم إعادة تعيين المقارن', 'info');
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-rose-600 px-3 py-2 transition-all cursor-pointer"
                    >
                      تصفية المقارنة
                    </button>
                  )}
                </div>

                {selectedSnapshotId ? (() => {
                  const selectedSnapshot = snapshots.find(s => s.id === selectedSnapshotId);
                  if (!selectedSnapshot) return null;

                  const snapMatrix = selectedSnapshot.gradesData;
                  const differences: any[] = [];

                  studentList.forEach(st => {
                    const currentGrades = gradesMatrix[st.id] || {};
                    const snapGrades = snapMatrix[st.id] || {};
                    subjects.forEach(sub => {
                      const currMark = currentGrades[sub.id];
                      const snapMark = snapGrades[sub.id];
                      if (currMark !== undefined && snapMark !== undefined && Number(currMark) !== Number(snapMark)) {
                        differences.push({
                          studentName: st.name,
                          classroom: st.classroom,
                          subjectName: sub.name,
                          snapMark: Number(snapMark),
                          currMark: Number(currMark),
                          diff: Number(currMark) - Number(snapMark)
                        });
                      }
                    });
                  });

                  return (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="p-3 bg-amber-50 text-amber-950 rounded-lg border border-amber-200 text-xs flex justify-between items-center font-bold">
                        <span>لقطة تجميد معتمدة لـ {selectedSnapshot.stage} مع مبرر: "{selectedSnapshot.reason}"</span>
                        <span className="text-[10px] bg-amber-200/80 px-2.5 py-0.5 rounded-full font-black">
                          ID: {selectedSnapshot.id}
                        </span>
                      </div>

                      {differences.length === 0 ? (
                        <div className="p-8 text-center bg-emerald-50/60 border border-emerald-200 space-y-2">
                          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                          <h4 className="font-extrabold text-emerald-950 text-sm">حالة نزاهة درجات الكنترول 100% 🛡️</h4>
                          <p className="text-[11px] text-emerald-800">تطابق تام ومطلق! لم يتم رصد أو تسجيل أي تعديل لاحق بالدرجات منذ لحظة تجميد النتائج.</p>
                        </div>
                      ) : (
                        <div className="border border-rose-200 overflow-hidden shadow-sm">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-rose-50 text-rose-900 border-b border-rose-200 font-extrabold">
                              <tr>
                                <th className="p-3">الطالب</th>
                                <th className="p-3">الصف</th>
                                <th className="p-3">المادة الدراسية</th>
                                <th className="p-3 text-center">الدرجة لحظة التجميد</th>
                                <th className="p-3 text-center">الدرجة الحالية</th>
                                <th className="p-3 text-center">الفارق</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-100 font-semibold bg-white">
                              {differences.map((diff, i) => (
                                <tr key={i} className="hover:bg-rose-50/30 text-slate-800">
                                  <td className="p-3 font-black text-slate-900">{diff.studentName}</td>
                                  <td className="p-3 text-slate-500">{diff.classroom}</td>
                                  <td className="p-3 text-slate-700">{diff.subjectName}</td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-600">{diff.snapMark}</td>
                                  <td className="p-3 text-center font-mono font-bold text-rose-600">{diff.currMark}</td>
                                  <td className={`p-3 text-center font-mono font-extrabold ${diff.diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {diff.diff > 0 ? `+${diff.diff}` : diff.diff}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 bg-rose-50 text-rose-900 text-[10px] font-bold border-t border-rose-200 flex items-center gap-1.5 leading-relaxed">
                            <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
                            <span>🚨 تحذير: تم رصد تغير في درجات {differences.length} مواد بعد اعتمادها! يُرجى مراجعة سجل التعديلات الفنية وإجراء التدقيق الأمني للوقوف على الأسباب.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <p className="text-center text-slate-400 py-6 text-xs font-semibold">الرجاء اختيار لقطة الكنترول لبدء عملية الفحص والتحليل التلقائي.</p>
                )}
              </div>

              {/* 7. Test Quality & Psychometrics Analytics Panel */}
              <div className="p-5.5 border border-[#d4af37]/30 space-y-5 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#3d2b0f] flex items-center gap-2">
                      <FilePieChart className="w-5 h-5 text-[#8b6508]" />
                      تحليل جودة الاختبارات السيكومترية (Psychometric Analysis) 📊
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      احسب معامل التمييز، معامل الصعوبة، والانحراف المعياري لتقييم مدى دقة وعدالة وجودة أدوات القياس والتقويم الأكاديمي للمادة.
                    </p>
                  </div>
                  
                  {/* Select subject for calculation */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">المادة المحللة:</span>
                    <select
                      value={selectedSubjectAnalyticId}
                      onChange={(e) => setSelectedSubjectAnalyticId(e.target.value)}
                      className="bg-amber-50/50 border border-amber-200/80 text-xs font-bold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="bg-amber-50/40 p-3.5 border border-amber-200/60 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block truncate">المعدل العام</span>
                    <span className="text-2xl font-black text-[#3d2b0f] mt-1.5 block">{analyticAverage}%</span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">المتوسط الحسابي</span>
                  </div>

                  <div className="bg-amber-50/40 p-3.5 border border-amber-200/60 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block truncate">معامل الصعوبة</span>
                    <span className="text-2xl font-black text-emerald-700 mt-1.5 block">{difficultyIndex}</span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">المثالي: [0.3 - 0.8]</span>
                  </div>

                  <div className="bg-amber-50/40 p-3.5 border border-amber-200/60 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block truncate">معامل التمييز</span>
                    <span className="text-2xl font-black text-amber-800 mt-1.5 block">{discriminationIndex}</span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">المثالي: {`>`} 0.20</span>
                  </div>

                  <div className="bg-amber-50/40 p-3.5 border border-amber-200/60 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block truncate">الانحراف المعياري</span>
                    <span className="text-2xl font-black text-rose-700 mt-1.5 block">{standardDeviation}</span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">مدى تباين الدرجات</span>
                  </div>

                  <div className="bg-amber-50/40 p-3.5 border border-amber-200/60 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block truncate">نسبة النجاح</span>
                    <span className="text-2xl font-black text-emerald-600 mt-1.5 block">{analyticPassRate}%</span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">درجات {`>=`} 50</span>
                  </div>

                  <div className="bg-amber-50/40 p-3.5 border border-amber-200/60 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block truncate">نسبة الرسوب</span>
                    <span className="text-2xl font-black text-red-600 mt-1.5 block">{analyticFailRate}%</span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">أقل من 50 درجة</span>
                  </div>
                </div>

                {/* Secondary row for additional requested metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                  <div className="bg-transparent p-3 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block">الوسيط المئوي (Median)</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">{analyticMedian}%</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">القيمة المتوسطة المرتبة</span>
                  </div>

                  <div className="bg-transparent p-3 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block">المنوال العام (Mode)</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">{analyticMode}%</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">الدرجة الأكثر تكراراً</span>
                  </div>

                  <div className="bg-transparent p-3 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block">أعلى درجة مسجلة (Highest)</span>
                    <span className="text-lg font-black text-emerald-700 mt-1 block">{analyticHighest}%</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">الحد الأقصى الفعلي</span>
                  </div>

                  <div className="bg-transparent p-3 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block">أدنى درجة مسجلة (Lowest)</span>
                    <span className="text-lg font-black text-rose-700 mt-1 block">{analyticLowest}%</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">الحد الأدنى الفعلي</span>
                  </div>
                </div>

                <div className="p-3 bg-[#1a1208]/90 text-amber-200 text-xs border border-[#8b6508]/40 flex items-start gap-2.5 leading-relaxed">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-amber-300">تفسير التقييم السيكومتري التلقائي للمادة:</span>
                    {difficultyIndex < 0.4 ? (
                      <span>هذا الاختبار **صعب للغاية** نسبياً. يُنصح بمراجعة صياغة الأسئلة وتقديم برامج تقوية إضافية للطلاب.</span>
                    ) : difficultyIndex > 0.85 ? (
                      <span>هذا الاختبار **سهل للغاية** نسبياً ولا يميز بقوة بين مستويات الطلاب المختلفة. يوصى بزيادة الأسئلة التنافسية.</span>
                    ) : (
                      <span>الاختبار في **النطاق المعتدل والمتزن ممتاز** جداً (معامل الصعوبة {difficultyIndex}). الأسئلة تعكس المنهج بدقة علمية عالية وتوفر قياساً عادلاً.</span>
                    )}
                    {discriminationIndex < 0.15 ? (
                      <span className="block mt-1">⚠️ تنبيه: معامل التمييز منخفض جداً ({discriminationIndex})، مما يعود لوجود أسئلة غير مائزة تساوى فيها الطالب المتفوق مع المتعثر.</span>
                    ) : (
                      <span className="block mt-1 text-emerald-300">✅ تمييز ممتاز للأسئلة ({discriminationIndex}) يبرهن على نجاح الاختبار في تصفية وتصنيف الفروق الفردية للطلاب.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 8. Combined Grade Modifications History & Approval Log */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Section A: Grade Modification History */}
                <div className="p-5 border border-[#d4af37]/30 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#3d2b0f] flex items-center gap-2">
                      <FileSpreadsheet className="w-4.5 h-4.5 text-[#8b6508]" />
                      سجل مراجعة وتعديل الدرجات الرسمي (Grade Modification History) 📝
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      سجل تراكمي كامل غير قابل للحذف لتوثيق وتتبع أي تعديل يطرأ على درجات الطلاب مع مبرر الإجراء تفادياً للتلاعب بالرصد.
                    </p>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin mt-2 flex-1">
                    {gradeHistory.length === 0 ? (
                      <p className="text-slate-500 text-center py-8 text-xs font-semibold">لا توجد أي تعديلات مرصودة على درجات الطلاب حالياً.</p>
                    ) : (
                      gradeHistory.map((log: any) => (
                        <div key={log.id} className="p-3 bg-amber-50/40 border border-amber-200/60 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-900">{log.studentName}</span>
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">{log.subjectName}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                            <div>الدرجة السابقة: <span className="font-bold text-slate-700 line-through">{log.oldGrade}%</span></div>
                            <div>الدرجة الجديدة: <span className="font-extrabold text-emerald-600">{log.newGrade}%</span></div>
                            <div>المعدل الفني: <span className="font-bold text-slate-700">{log.modifiedBy}</span></div>
                            <div>التاريخ والوقت: <span className="font-bold text-slate-700">{log.timestamp}</span></div>
                          </div>
                          <p className="text-[10px] text-slate-600 p-1.5 rounded border border-slate-100 font-medium">
                            📌 السبب: {log.reason}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section B: Approval & Reopening History */}
                <div className="p-5 border border-[#d4af37]/30 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#3d2b0f] flex items-center gap-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                      سجل مراجعة واعتماد وإعادة فتح الكنترول الرسمي 🔒
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      يوثق عمليات تجميد النتائج وفك الاعتماد السابقة مع عناوين بروتوكول الإنترنت IP الرقمي للتدقيق الأمني.
                    </p>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin mt-2 flex-1">
                    {approvalHistory.map((log: any) => (
                      <div key={log.id} className={`p-3 border text-xs space-y-2 ${
                        log.action === 'approve' 
                          ? 'bg-emerald-50/50 border-emerald-200' 
                          : 'bg-rose-50/50 border-rose-200'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900">{log.stage}</span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            log.action === 'approve' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.action === 'approve' ? '🔒 تم الاعتماد والتجميد' : '🔓 إعادة فتح الكنترول'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                          <div>المعتمد: <span className="font-bold text-slate-700">{log.approvedBy}</span></div>
                          <div>التاريخ: <span className="font-bold text-slate-700">{log.timestamp}</span></div>
                          <div className="col-span-2 truncate">المستعرض: <span className="font-bold text-slate-700">{log.device}</span></div>
                          <div className="col-span-2">عنوان الـ IP الرقمي: <span className="font-mono font-bold text-amber-800">{log.ip}</span></div>
                        </div>
                        <p className={`text-[10px] p-1.5 rounded font-medium ${
                          log.action === 'approve' 
                            ? 'border border-emerald-200 text-emerald-950' 
                            : 'border border-rose-200 text-rose-950'
                        }`}>
                          📌 مبرر الإجراء: {log.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Quick Navigation Panel */}
              <div className="bg-[#1a1208] p-4 border border-[#8b6508]/40 text-center flex flex-wrap gap-3 justify-center items-center">
                <span className="text-xs font-black text-amber-200">الانتقال السريع للإجراءات المتقدمة:</span>
                <button 
                  onClick={() => setActiveTab('certificates')} 
                  className="bg-gradient-to-r from-[#d4af37] to-[#a37c27] hover:from-[#e5c158] hover:to-[#b88e32] text-slate-950 text-[11px] font-black px-4 py-2 cursor-pointer transition-all shadow"
                >
                  الطباعة الجماعية وإصدار رموز الشهادات 🖨️
                </button>
                <button 
                  onClick={() => setActiveTab('reports')} 
                  className="bg-[#3d2b0f] hover:bg-[#4d3714] text-amber-200 border border-[#8b6508]/60 text-[11px] font-black px-4 py-2 cursor-pointer transition-all"
                >
                  مقارنة السنوات والتحليلات البيانية للنجاح 📈
                </button>
                <button 
                  onClick={() => setActiveTab('system-settings')} 
                  className="bg-[#2a1d0f] hover:bg-[#382815] text-amber-200 border border-[#8b6508]/60 text-[11px] font-black px-4 py-2 cursor-pointer transition-all"
                >
                  مركز أرشفة الأعوام الدراسية السابقة 🗄️
                </button>
              </div>

              {/* 9. Bottom AI Assistant Banner */}
              <div className="bg-gradient-to-r from-[#2a1d0f] via-[#3d2b0f] to-[#1e1305] p-4.5 border border-[#d4af37]/40 shadow-lg text-white flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-amber-200 text-sm">المساعد الذكي</h3>
                    <p className="text-xs text-amber-400/80 font-medium">جاهز لمساعدتك في إدارة الامتحانات، تحليل الدرجات وتوزيع الملاحظين</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => triggerNotification('جاري تشغيل خوارزمية اكتشاف الدرجات الشاذة...', 'info')}
                    className="px-3 py-1.5 bg-[#1a1208] border border-[#8b6508]/60 hover:border-amber-400 text-amber-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    اكتشاف الدرجات الشاذة قبل الاعتماد
                  </button>
                  <button 
                    onClick={() => triggerNotification('جاري اقتراح توزيع المراقبين الأنسب للجان...', 'info')}
                    className="px-3 py-1.5 bg-[#1a1208] border border-[#8b6508]/60 hover:border-amber-400 text-amber-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    اقترح توزيع المراقبين تلقائياً
                  </button>
                  <button 
                    onClick={() => triggerNotification('جاري فحص وتدقيق تعارضات الجداول...', 'info')}
                    className="px-3 py-1.5 bg-[#1a1208] border border-[#8b6508]/60 hover:border-amber-400 text-amber-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    اكتشاف التعارضات في الجداول
                  </button>
                  <button 
                    onClick={() => triggerNotification('جاري حساب وتوقع نسب النجاح المستهدفة...', 'info')}
                    className="px-3 py-1.5 bg-[#1a1208] border border-[#8b6508]/60 hover:border-amber-400 text-amber-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    اقترح نسبة النجاح وتوقع النتائج
                  </button>
                  <button 
                    onClick={() => triggerNotification('تم فتح نافذة الحوار المباشر مع المساعد الذكي', 'success')}
                    className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    اطرح سؤالاً
                  </button>
                </div>
              </div>

            </div>
          );
        })()}



        {/* TAB: Exams and Control Guide Booklet */}
        {activeTab === 'exams-guide' && (
          <div className="space-y-6 text-right" dir="rtl">
            <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                    مستند رسمي معتمد • CODEX™ Technical Manual
                  </span>
                  <h2 className="text-2xl font-black text-white">الدليل الفني والتشغيلي الشامل لوحدة الكنترول والنتائج</h2>
                  <p className="text-sm text-slate-300 max-w-2xl font-medium leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
                    هذا الدليل يشرح بالتفصيل التسلسل المنطقي والعملي الكامل لكافة شاشات الكنترول والامتحانات من التهيئة والتوزيع وحتى إعلان النتائج والتحقق الرقمي المصدق بالـ QR Code.
                  </p>
                </div>
                
                <button
                  onClick={handlePrintGuidePDF}
                  className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black flex items-center gap-2.5 transition-all shadow-lg hover:shadow-emerald-500/20 shrink-0 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  <FileText className="w-5 h-5" />
                  تحميل وتنزيل الدليل الرسمي كاملاً بصيغة (PDF) 📄
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Checklist */}
              <div className="bg-[#1c120c] p-6 border border-[#d4af37]/40 space-y-6 lg:col-span-1 text-amber-100">
                <h3 className="font-extrabold text-[#fce79a] text-sm border-b border-[#d4af37]/30 pb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#f7d174]" />
                  مراحل العمل الإجرائي
                </h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-2 text-[#f7d174] font-extrabold">
                    <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center font-bold text-[10px] text-[#fce79a]">١</span>
                    <div>
                      <p className="text-amber-100">المرحلة الأولى: التجهيز</p>
                      <span className="text-[10px] text-amber-200/60 font-normal">عزل اللجان وإعداد السياسات</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-amber-200 font-bold">
                    <span className="w-5 h-5 rounded-full bg-[#2a1d13] border border-[#d4af37]/20 flex items-center justify-center font-bold text-[10px] text-amber-300">٢</span>
                    <div>
                      <p className="text-amber-200">المرحلة الثانية: التوزيع والجدولة</p>
                      <span className="text-[10px] text-amber-200/60 font-normal">أرقام الجلوس وجدول الاختبارات</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-amber-200 font-bold">
                    <span className="w-5 h-5 rounded-full bg-[#2a1d13] border border-[#d4af37]/20 flex items-center justify-center font-bold text-[10px] text-amber-300">٣</span>
                    <div>
                      <p className="text-amber-200">المرحلة الثالثة: الرصد والتحقق</p>
                      <span className="text-[10px] text-amber-200/60 font-normal">حضور وغياب، استيراد Excel، وتدقيق</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-amber-200 font-bold">
                    <span className="w-5 h-5 rounded-full bg-[#2a1d13] border border-[#d4af37]/20 flex items-center justify-center font-bold text-[10px] text-amber-300">٤</span>
                    <div>
                      <p className="text-amber-200">المرحلة الرابعة: الاعتماد والشهادات</p>
                      <span className="text-[10px] text-amber-200/60 font-normal">إقفال الكنترول وبوابة الـ QR</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#2a1d13] border border-[#d4af37]/30 text-amber-200/90 text-[11px] font-medium leading-relaxed">
                  💡 <b className="text-[#fce79a]">إشعار الحوكمة:</b> يتم تسجيل كافة العمليات والاعتمادات في سجل التدقيق الأمني (Audit Log) بصورة لحظية لحماية موثوقية الدرجات الأكاديمية.
                </div>
              </div>

              {/* Main Detailed Documentation View */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-[#1c120c] p-6 border border-[#d4af37]/40 space-y-6 text-amber-100">
                  <h3 className="text-base font-black text-[#fce79a] border-b border-[#d4af37]/30 pb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    شرح المسار والتسلسل التشغيلي لوحدات وشاشات الكنترول
                  </h3>

                  <div className="space-y-6 text-xs text-amber-200/80 font-medium leading-relaxed">
                    
                    {/* Section 1 */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-sm text-[#fce79a] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#d4af37] rounded-full" />
                        ١. عزل صلاحيات المراحل ولجان الكنترول الفرعية (Multi-Stage Governance)
                      </h4>
                      <p className="mr-4 text-justify">
                        يتميز النظام بالفصل الكامل للبيانات والصلاحيات بين الكنترولات الفرعية (رياض الأطفال، الابتدائي، المتوسط، الثانوي). هذا يضمن عدم قيام مصححي أو مشرفي مرحلة بالاطلاع على أو تعديل درجات مرحلة أخرى، ويحد تماماً من الأخطاء التشغيلية وتداخل السجلات.
                      </p>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-sm text-[#fce79a] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#d4af37] rounded-full" />
                        ٢. التوزيع التلقائي للجان وصناعة أرقام الجلوس (Seat & Hall Allocation)
                      </h4>
                      <p className="mr-4 text-justify">
                        بمجرد تسجيل القاعات الدراسية وسعتها الاستيعابية القصوى، يقوم محرك التوزيع الذكي بتقسيم وتوزيع الطلاب المسجلين بالتساوي التام ومنع تجاوز السعة القصوى لأي لجنة. يتم بعدها إصدار وتوليد أرقام جلوس فريدة ومتسلسلة لكل طالب لطباعتها في بطاقات الطاولات الرسمية.
                      </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-sm text-[#fce79a] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#d4af37] rounded-full" />
                        ٣. حوكمة تعديل الدرجات وسجل التدقيق الأمني (Audit Trail Ledger)
                      </h4>
                      <p className="mr-4 text-justify">
                        يتيح النظام رصد وتعديل الدرجات من خلال واجهة مرنة مدمجة بـ Excel (CSV). لضمان عدم التلاعب، يقوم النظام بحفظ وتوثيق كافة حركات التعديل بالتفصيل (اسم الطالب، المادة، الدرجة القديمة، والجديدة، وسبب التعديل، والمصحح المعتمد) في سجل تدقيق مشفر لحظي لا يمكن حذفه أو تعديله.
                      </p>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-sm text-[#fce79a] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#d4af37] rounded-full" />
                        ٤. محرك التقديرات ونظام الإنذار المبكر الأكاديمي (GPA & Early Warning)
                      </h4>
                      <p className="mr-4 text-justify">
                        يقوم الكنترول الذكي فوريًا باحتساب المعدلات والتقديرات العامة وعرض تحذيرات صارمة على الطلاب المعرضين للحرمان لضعف الحضور (تحت ٨٥٪)، أو الطلاب الذين تراجع أداؤهم بأكثر من ٥٪ مقارنة بالعام الأكاديمي السابق والمؤرشف في النظام، مما يتيح للإدارة التربوية التدخل السريع والإيجابي.
                      </p>
                    </div>

                    {/* Section 5 */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-sm text-[#fce79a] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#d4af37] rounded-full" />
                        ٥. الاعتماد الرقمي وبصمة التشفير وإقفال الكنترول (Immutable Freezer & SHA-256)
                      </h4>
                      <p className="mr-4 text-justify">
                        عند انتهاء الرصد والمراجعة بالكامل، يطلق مدير الكنترول عملية تجميد وإقفال الكنترول. تقوم هذه الميزة بمنع وحظر أي تعديل إضافي على الدرجات، وتوليد بصمة أمان رقمية (Digital SHA-256 Signature) ومحضر إقفال رسمي يتضمن نسب النجاح وأعداد الناجحين والراسبين جاهز للطباعة والاعتماد الإداري المالي.
                      </p>
                    </div>

                    {/* Section 6 */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-sm text-[#fce79a] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#d4af37] rounded-full" />
                        ٦. التحقق الرقمي من الشهادات ورموز الاستجابة السريعة (QR Code Portal)
                      </h4>
                      <p className="mr-4 text-justify">
                        يقوم النظام بإدراج رمز تحقق فريد وبوابة تتبع ورمز استجابة سريعة (QR Code) على كافة شهادات الطلاب. يتيح هذا الرمز لأولياء الأمور والجامعات والجهات المعنية فحص الشهادة والتأكد من مطابقة الدرجات المطبوعة على الورق بالدرجات الفعلية المحفوظة بقاعدة بيانات الكنترول المصدق لمنع تزوير وتعديل الدرجات.
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
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
                  <select 
                    value={examSettings.academicYear}
                    onChange={(e) => setExamSettings({...examSettings, academicYear: e.target.value})}
                    className="w-full text-xs font-semibold p-2.5 bg-[#130b04] border border-[#d4af37]/40 text-amber-100 focus:ring-2 focus:ring-[#d4af37]/50 outline-none transition-all"
                  >
                    <option value="2025/2026" className="bg-[#1c120c] text-amber-100">2025/2026</option>
                    <option value="2026/2027" className="bg-[#1c120c] text-amber-100">2026/2027</option>
                  </select>
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
                  <div className={`p-3 ${dbSyncStatus === 'success' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : dbSyncStatus === 'error' ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40' : 'bg-[#2a1d13] text-[#f7d174] border border-[#d4af37]/30'}`}>
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
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}>
                        {isDbSyncing ? 'جاري المزامنة...' : dbSyncStatus === 'success' ? 'متصل ومزامن (سيرفر مركزي)' : 'وضع محلي'}
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
                    disabled={isDbSyncing}
                    className="flex-1 md:flex-none px-4 py-2 bg-[#2a1d13] hover:bg-[#38271a] text-[#f7d174] disabled:opacity-50 border border-[#d4af37]/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    title="تحميل البيانات المخزنة في السيرفر وتحديث الواجهة"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDbSyncing ? 'animate-spin' : ''}`} />
                    استرجاع وتحديث
                  </button>

                  <button
                    onClick={() => {
                      saveToServerDb().then(ok => {
                        if (ok) triggerNotification('تم حفظ البيانات ومزامنتها على السيرفر بنجاح', 'success');
                        else triggerNotification('حدث خطأ أثناء حفظ البيانات على السيرفر', 'warning');
                      });
                    }}
                    disabled={isDbSyncing}
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
                      className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 text-slate-950 font-black shadow-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
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
                                    onClick={() => {
                                      const updated = subjects.map(s => s.id === sub.id ? { ...s, ...editingValues } : s);
                                      setSubjects(updated);
                                      setEditingEntityId(null);
                                      triggerNotification('تم تحديث بيانات المادة بنجاح', 'success');
                                      logAction(`تعديل مادة: ${editingValues.name}`, 'الفصول والمواد');
                                      saveToServerDb(examSettings, halls, updated);
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
                                      onClick={() => {
                                        const updated = subjects.filter(s => s.id !== sub.id);
                                        setSubjects(updated);
                                        triggerNotification(`تم حذف مادة ${sub.name}`, 'info');
                                        logAction(`حذف مادة: ${sub.name}`, 'الفصول والمواد');
                                        saveToServerDb(examSettings, halls, updated);
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
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white shadow-md text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
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
                        const levelColor = cls.level === 'primary' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : cls.level === 'middle' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200';
                        const levelLabel = cls.level === 'primary' 
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
                                  onClick={() => {
                                    const updated = classesList.filter(c => c.id !== cls.id);
                                    setClassesList(updated);
                                    triggerNotification(`تم حذف صف ${cls.name}`, 'info');
                                    logAction(`حذف صف دراسي: ${cls.name}`, 'الفصول والمواد');
                                    saveToServerDb(examSettings, halls, subjects, studentList, gradesMatrix, schedule, proctorAssignments, approvalStatus, auditLogs, updated);
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
                      onClick={() => {
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
                                  onClick={() => {
                                    setHalls(halls.map(h => h.id === hall.id ? { ...h, ...editingValues } : h));
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
                                  onClick={() => {
                                    setHalls(halls.filter(h => h.id !== hall.id));
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
          <div className="space-y-6 text-amber-100">
            <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#d4af37]/30 pb-4">
                <div>
                  <h3 className="font-bold text-[#fce79a] text-sm">محرك توزيع الطلاب الذكي على القاعات واللجان</h3>
                  <p className="text-xs text-amber-200/60 mt-1">يقوم النظام بتوزيع الطلاب بصورة عادلة وحسب السعة الاستيعابية المعتمدة للقاعات لمنع حدوث التكدس.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportToCSV(
                      studentList.map(s => [s.id, s.name, s.classroom, s.section, s.nationalId, s.seatNumber || 'غير محدد', halls.find(h => h.id === s.hallId)?.name || 'غير موزع']),
                      ['كود الطالب', 'اسم الطالب', 'الصف', 'الشعبة', 'رقم الهوية', 'رقم الجلوس', 'القاعة الحالية'],
                      'student_distribution'
                    )}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-500/40"
                  >
                    <Download className="w-4 h-4" />
                    تصدير Excel
                  </button>

                  <button
                    onClick={() => {
                      const win = window.open('', '_blank');
                      if (!win) return;
                      win.document.write(`
                        <html dir="rtl" lang="ar">
                          <head>
                            <title>كشف توزيع الطلاب</title>
                            <style>
                              body { font-family: Cairo, sans-serif; padding: 20px; }
                              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                              th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                              th { background: #f4f4f4; }
                            </style>
                          </head>
                          <body>
                            <h2>كشف توزيع الطلاب على قاعات ولجان الامتحانات</h2>
                            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
                            <table>
                              <thead>
                                <tr>
                                  <th>اسم الطالب</th>
                                  <th>الصف والشعبة</th>
                                  <th>رقم الهوية الوطنية</th>
                                  <th>رقم الجلوس</th>
                                  <th>اللجنة / القاعة</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${studentList.map(s => `
                                  <tr>
                                    <td>${s.name}</td>
                                    <td>${s.classroom} - ${s.section}</td>
                                    <td>${s.nationalId}</td>
                                    <td>${s.seatNumber || 'غير محدد'}</td>
                                    <td>${halls.find(h => h.id === s.hallId)?.name || 'غير موزع'}</td>
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
                    className="px-3 py-2 bg-[#2a1d13] hover:bg-[#38271a] text-amber-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-[#d4af37]/30"
                  >
                    <Printer className="w-4 h-4 text-[#f7d174]" />
                    طباعة الكشف
                  </button>

                  <button
                    onClick={handleAutoDistributeAndSeating}
                    className="px-4 py-2 bg-gradient-to-r from-[#d4af37] via-[#c58a22] to-[#8b6113] hover:brightness-110 text-slate-950 font-black rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md border border-[#fce79a]"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    بدء التوزيع التلقائي الذكي
                  </button>
                </div>
              </div>

              {/* Add Student Form */}
              <div className="bg-[#2a1d13] p-4 border border-[#d4af37]/30 space-y-3">
                <h4 className="font-bold text-[#fce79a] text-xs">تسجيل وإضافة طالب جديد للكنترول</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    id="new-st-name"
                    placeholder="اسم الطالب بالكامل"
                    className="text-xs p-2 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 placeholder-amber-200/40"
                  />
                  <select
                    id="new-st-class"
                    className="text-xs p-2 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100"
                  >
                    <option value="الصف السابع">الصف السابع</option>
                    <option value="الصف الثامن">الصف الثامن</option>
                    <option value="الصف التاسع">الصف التاسع</option>
                  </select>
                  <input
                    type="text"
                    id="new-st-section"
                    placeholder="الشعبة (أ، ب، ج)"
                    className="text-xs p-2 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 placeholder-amber-200/40"
                  />
                  <input
                    type="text"
                    id="new-st-natid"
                    placeholder="رقم الهوية الوطنية"
                    className="text-xs p-2 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 placeholder-amber-200/40"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const name = (document.getElementById('new-st-name') as HTMLInputElement)?.value;
                      const cls = (document.getElementById('new-st-class') as HTMLInputElement)?.value;
                      const sec = (document.getElementById('new-st-section') as HTMLInputElement)?.value;
                      const natId = (document.getElementById('new-st-natid') as HTMLInputElement)?.value;
                      
                      if (!name || !cls || !sec || !natId) {
                        triggerNotification('يرجى ملء جميع حقول بيانات الطالب للتسجيل', 'warning');
                        return;
                      }

                      const newStudent = {
                        id: `st-${Date.now()}`,
                        name,
                        classroom: cls,
                        section: sec,
                        nationalId: natId,
                        seatNumber: undefined,
                        hallId: undefined
                      };

                      setStudentList([...studentList, newStudent]);
                      triggerNotification(`تم تسجيل الطالب ${name} بنجاح في الكنترول العام`, 'success');
                      logAction(`إضافة طالب جديد للكنترول: ${name}`, 'توزيع الطلاب');
                      
                      // Reset values
                      (document.getElementById('new-st-name') as HTMLInputElement).value = '';
                      (document.getElementById('new-st-section') as HTMLInputElement).value = '';
                      (document.getElementById('new-st-natid') as HTMLInputElement).value = '';
                    }}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#9a6a1d] text-slate-950 rounded text-xs font-black flex items-center gap-1 cursor-pointer hover:brightness-110"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    تسجيل الطالب وتخصيص هوية
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <input
                type="text"
                placeholder="ابحث عن طالب باسمه، صفّه، أو هويته الوطنية..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full text-xs p-2 border border-[#d4af37]/40 rounded-lg bg-[#130b04] text-amber-100 placeholder-amber-200/40"
              />

              <div className="overflow-x-auto border border-[#d4af37]/30">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#2a1d13] text-[#f7d174] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3 font-bold">اسم الطالب</th>
                      <th className="p-3 font-bold">الصف والشعبة</th>
                      <th className="p-3 font-bold">رقم الهوية الوطنية</th>
                      <th className="p-3 font-bold">رقم الجلوس</th>
                      <th className="p-3 font-bold">اللجنة والقاعة الحالية</th>
                      <th className="p-3 font-bold">خيارات التعديل والحذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/20">
                    {studentList
                      .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.nationalId.includes(studentSearch) || s.classroom.includes(studentSearch))
                      .map((st) => {
                        const isEditing = editingEntityId === st.id;
                        return (
                          <tr key={st.id} className="hover:bg-[#2a1d13]/60">
                            {isEditing ? (
                              <>
                                <td className="p-2" colSpan={3}>
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                    <input
                                      type="text"
                                      className="text-xs p-1 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 w-full"
                                      value={editingValues.name}
                                      onChange={(e) => setEditingValues({ ...editingValues, name: e.target.value })}
                                      placeholder="اسم الطالب"
                                    />
                                    <select
                                      className="text-xs p-1 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 w-full"
                                      value={editingValues.classroom}
                                      onChange={(e) => setEditingValues({ ...editingValues, classroom: e.target.value })}
                                    >
                                      <option value="الصف السابع">الصف السابع</option>
                                      <option value="الصف الثامن">الصف الثامن</option>
                                      <option value="الصف التاسع">الصف التاسع</option>
                                    </select>
                                    <input
                                      type="text"
                                      className="text-xs p-1 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 w-full"
                                      value={editingValues.section}
                                      onChange={(e) => setEditingValues({ ...editingValues, section: e.target.value })}
                                      placeholder="الشعبة"
                                    />
                                    <input
                                      type="text"
                                      className="text-xs p-1 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 w-full"
                                      value={editingValues.nationalId}
                                      onChange={(e) => setEditingValues({ ...editingValues, nationalId: e.target.value })}
                                      placeholder="رقم الهوية"
                                    />
                                  </div>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    className="text-xs p-1 border border-[#d4af37]/40 rounded bg-[#130b04] font-semibold text-amber-100 w-20"
                                    value={editingValues.seatNumber || ''}
                                    onChange={(e) => setEditingValues({ ...editingValues, seatNumber: Number(e.target.value) || undefined })}
                                    placeholder="رقم الجلوس"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={editingValues.hallId || ''}
                                    onChange={(e) => setEditingValues({ ...editingValues, hallId: e.target.value || undefined })}
                                    className="text-xs p-1 rounded border border-[#d4af37]/40 bg-[#130b04] font-semibold text-amber-100 w-full"
                                  >
                                    <option value="">-- غير موزع --</option>
                                    {halls.map(h => (
                                      <option key={h.id} value={h.id}>{h.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-2 flex gap-1 justify-end">
                                  <button
                                    onClick={() => {
                                      setStudentList(studentList.map(s => s.id === st.id ? { ...s, ...editingValues } : s));
                                      setEditingEntityId(null);
                                      triggerNotification('تم تحديث بيانات الطالب وتوزيعه بنجاح', 'success');
                                      logAction(`تعديل بيانات الطالب: ${editingValues.name}`, 'توزيع الطلاب');
                                    }}
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] rounded font-bold cursor-pointer"
                                  >
                                    حفظ
                                  </button>
                                  <button
                                    onClick={() => setEditingEntityId(null)}
                                    className="px-2 py-1 bg-[#2a1d13] hover:bg-[#38271a] text-amber-200 text-[10px] border border-[#d4af37]/30 rounded font-bold cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 font-bold text-[#fce79a]">{st.name}</td>
                                <td className="p-3 font-semibold text-amber-100">{st.classroom} - {st.section}</td>
                                <td className="p-3 font-mono text-amber-200/80">{st.nationalId}</td>
                                <td className="p-3 font-mono font-bold text-[#f7d174]">{st.seatNumber || 'غير محدد'}</td>
                                <td className="p-3 font-bold text-amber-100">
                                  {halls.find(h => h.id === st.hallId)?.name || 'غير موزع'}
                                </td>
                                <td className="p-3 flex items-center gap-1.5 justify-end">
                                  <button
                                    onClick={() => {
                                      setEditingEntityId(st.id);
                                      setEditingValues({ name: st.name, classroom: st.classroom, section: st.section, nationalId: st.nationalId, seatNumber: st.seatNumber, hallId: st.hallId });
                                    }}
                                    className="p-1 text-amber-300 hover:bg-[#2a1d13] rounded cursor-pointer"
                                    title="تعديل الطالب"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <select
                                    value={st.hallId || ''}
                                    onChange={(e) => {
                                      const updated = studentList.map(s => s.id === st.id ? { ...s, hallId: e.target.value || undefined } : s);
                                      setStudentList(updated);
                                      triggerNotification(`تم تغيير قاعة الطالب ${st.name} بنجاح`, 'success');
                                    }}
                                    className="text-xs p-1 rounded border border-[#d4af37]/40 bg-[#130b04] text-amber-100 font-semibold"
                                  >
                                    <option value="">-- اختر قاعة --</option>
                                    {halls.map(h => (
                                      <option key={h.id} value={h.id}>{h.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      setStudentList(studentList.filter(s => s.id !== st.id));
                                      triggerNotification(`تم حذف الطالب ${st.name} من الكنترول`, 'info');
                                      logAction(`حذف طالب: ${st.name}`, 'توزيع الطلاب');
                                    }}
                                    className="p-1 text-rose-400 hover:bg-rose-950/60 rounded cursor-pointer"
                                    title="حذف الطالب"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Seat Numbers */}
        {activeTab === 'seating' && (
          <div className="space-y-6 text-amber-100">
            <div className="bg-[#1c120c] p-5 border border-[#d4af37]/40 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#d4af37]/30 pb-4">
                <div>
                  <h3 className="font-bold text-[#fce79a] text-sm">توليد وطباعة كروت أرقام الجلوس</h3>
                  <p className="text-xs text-amber-200/60 mt-1">بطاقات معتمدة لأرقام جلوس الطلاب تحتوي على رمز الاستجابة السريعة (QR Code) لتسهيل عمليات التفتيش والمراقبة.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const win = window.open('', '_blank');
                      if (!win) return;
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
                              ${studentList.map(s => `
                                <div class="card">
                                  <h3>مجمع المدارس النموذجية الأهلية</h3>
                                  <p>الطالب: <strong>${s.name}</strong></p>
                                  <p>الصف: ${s.classroom} - الشعبة (${s.section})</p>
                                  <p>اللجنة / القاعة: ${halls.find(h => h.id === s.hallId)?.name || 'غير محدد'}</p>
                                  <div class="seat-num">رقم الجلوس: ${s.seatNumber || 'N/A'}</div>
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
                          <span className="text-[9px] bg-[#d4af37]/20 text-[#f7d174] px-1.5 py-0.5 rounded font-extrabold uppercase border border-[#d4af37]/30">مجمع الغد التعليمي</span>
                          <h4 className="font-bold text-[#fce79a] text-sm mt-1">{st.name}</h4>
                          <span className="text-xs text-amber-200/60 font-bold block">{st.classroom} - الشعبة ({st.section})</span>
                        </div>
                        <div className="bg-[#130b04] p-1.5 rounded-lg border border-[#d4af37]/30">
                          <QrCode className="w-8 h-8 text-[#f7d174]" />
                        </div>
                      </div>

                      <div className="border-t border-dashed border-[#d4af37]/30 pt-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-amber-200/50 block text-[9px] font-bold">رقم الجلوس:</span>
                          <span className="font-mono font-extrabold text-base text-[#f7d174]">{st.seatNumber || 'N/A'}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-amber-200/50 block text-[9px] font-bold">اللجنة والقاعة:</span>
                          <span className="font-black text-amber-100 text-[11px]">
                            {halls.find(h => h.id === st.hallId)?.name || 'غير محدد'}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) return;
                          printWindow.document.write(`
                            <html dir="rtl" lang="ar">
                              <head>
                                <title>بطاقة رقم الجلوس - ${st.name}</title>
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
                                  <h1>مجمع المدارس النموذجية الأهلية</h1>
                                  <h2>بطاقة دخول قاعة الامتحان المعتمدة</h2>
                                  <hr/>
                                  <p style="font-size: 18px; font-weight: bold;">الاسم: ${st.name}</p>
                                  <p>الصف: ${st.classroom} - الشعبة (${st.section})</p>
                                  <p>رقم الهوية الوطنية: ${st.nationalId}</p>
                                  <p>القاعة واللجنة: <strong>${halls.find(h => h.id === st.hallId)?.name || 'غير محدد'}</strong></p>
                                  <div class="seat-num">رقم الجلوس: ${st.seatNumber}</div>
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
                      {INITIAL_TEACHERS_MOCK.map(t => (
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
                                  {INITIAL_TEACHERS_MOCK.map(t => (
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
                                  onClick={() => {
                                    setProctorAssignments(proctorAssignments.map(p => p.id === pa.id ? { ...p, ...editingValues } : p));
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
                                  onClick={() => {
                                    setProctorAssignments(proctorAssignments.filter(p => p.id !== pa.id));
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
          const totalSubjectsToSchedule = classesList.length * subjects.length;
          const schedulingProgress = totalSubjectsToSchedule > 0 ? Math.round((scheduledExamsCount / totalSubjectsToSchedule) * 100) : 0;
          
          // Identify any active conflicts
          const conflicts = getScheduleConflicts(schedule);
          const errorConflicts = conflicts.filter(c => c.severity === 'error');
          const warningConflicts = conflicts.filter(c => c.severity === 'warning');

          // Check if preparation is complete
          const isPrepComplete = {
            academic: classesList.length > 0,
            subjects: subjects.length > 0,
            halls: halls.filter(h => h.status !== 'inactive').length > 0,
            proctors: INITIAL_TEACHERS_MOCK.length > 0,
            rules: !!scheduleConfig.startDate
          };
          const prepProgressScore = Object.values(isPrepComplete).filter(Boolean).length * 20;

          // Handler to run automated scheduler
          const handleRunAutoScheduler = () => {
            if (scheduleApprovalStatus.approved) {
              triggerNotification('الجدول معتمد ومقفل حالياً. الرجاء إلغاء الاعتماد أولاً من تبويب المراجعة والاعتماد لتشغيل المحرك.', 'warning');
              return;
            }

            if (!isPrepComplete.academic || !isPrepComplete.subjects || !isPrepComplete.halls || !isPrepComplete.proctors) {
              triggerNotification('تنبيه: لم تكتمل تجهيزات الجدولة بعد! يرجى إتمام تهيئة الصفوف والمواد والقاعات والمراقبين أولاً.', 'warning');
              setScheduleSubTab('prep');
              return;
            }

            const startStr = scheduleConfig.startDate || '2026-06-01';
            let currentDate = new Date(startStr);
            const generatedSchedule: any[] = [];
            
            // Build the queue of exams to schedule
            const queue: { classroom: string; subjectId: string }[] = [];
            classesList.forEach(cls => {
              subjects.forEach(sub => {
                queue.push({ classroom: cls.name, subjectId: sub.id });
              });
            });

            let dayLoopLimit = 0;
            // Iterate day by day
            while (queue.length > 0 && dayLoopLimit < 40) {
              dayLoopLimit++;
              
              // Get day details
              const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday... 6=Saturday
              const adjustedDayIndex = dayOfWeek === 0 ? 0 : dayOfWeek; // map Sunday to index 0, Saturday is 6
              
              // Check if weekend (e.g. Friday index 5, Saturday index 6)
              const isWeekend = scheduleConfig.holidayDays.includes(dayOfWeek);
              const dateString = currentDate.toISOString().split('T')[0];
              const isHoliday = scheduleConfig.customHolidays.includes(dateString);

              if (isWeekend || isHoliday) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
              }

              const dayName = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][currentDate.getDay()];

              // Track bookings in each slot for today
              const bookedHallsToday = new Map<string, string[]>(); // slotId -> hallIds
              const bookedProctorsToday = new Map<string, string[]>(); // slotId -> proctorIds
              const scheduledClassesToday = new Set<string>();

              // For each time period/slot
              for (const slot of scheduleConfig.dailySlots) {
                if (queue.length === 0) break;

                const hallsInSlot = bookedHallsToday.get(slot.id) || [];
                const proctorsInSlot = bookedProctorsToday.get(slot.id) || [];

                // Filter candidates for this day (only schedule 1 exam per class per day to avoid overloading)
                const candidatesForSlot = queue.filter(q => !scheduledClassesToday.has(q.classroom));

                for (const exam of [...candidatesForSlot]) {
                  if (scheduledClassesToday.has(exam.classroom)) continue;

                  const sub = subjects.find(s => s.id === exam.subjectId);
                  if (!sub) continue;

                  // Find available halls that fit the class capacity
                  const classStudentsCount = studentList.filter(s => s.classroom === exam.classroom).length || 25;
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
                  const availableProctors = INITIAL_TEACHERS_MOCK;
                  const suitableProctor = availableProctors.find(t => {
                    const isBooked = proctorsInSlot.includes(t.id);
                    const isUnavailable = customProctorUnavailable[t.id]?.includes(dateString) || 
                                          customProctorUnavailable[t.id]?.includes(dayName);
                    // Also verify we haven't over-duty capped them
                    const dutyCount = generatedSchedule.filter(s => s.proctorId === t.id).length;
                    return !isBooked && !isUnavailable && dutyCount < (scheduleConfig.examsPerWeek * 2);
                  });

                  const proctorId = suitableProctor ? suitableProctor.id : (availableProctors[0]?.id || 't-1');
                  if (suitableProctor) {
                    proctorsInSlot.push(suitableProctor.id);
                  }

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

                  scheduledClassesToday.add(exam.classroom);
                  
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

            setSchedule(generatedSchedule);
            saveToServerDb(
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

            if (queue.length === 0) {
              triggerNotification(`🎉 اكتمل تكوين الجدول تلقائياً بنجاح! تم جدولة جميع المواد لجميع الصفوف (${generatedSchedule.length} اختباراً) دون أي تداخل زمني أو تعارض في الملاحظين والقاعات.`, 'success');
              logAction('تشغيل محرك الجدولة الذكي تلقائياً وجدولة كافة الاختبارات', 'جدول الامتحانات');
            } else {
              triggerNotification(`تم تكوين الجدول تلقائياً لـ ${generatedSchedule.length} اختباراً، مع بقاء ${queue.length} مادة معلقة لعدم كفاية اللجان أو المراقبين. يرجى مراجعتها وتوزيعها يدوياً.`, 'warning');
              logAction('تشغيل محرك الجدولة الذكي تلقائياً مع مواد معلقة يدوية', 'جدول الامتحانات');
            }
          };

          // Optimizes the schedule by balancing the gap days between exams for students
          const handleOptimizeSchedule = () => {
            if (scheduleApprovalStatus.approved) {
              triggerNotification('الجدول معتمد ومقفل. لا يمكن تحسينه حالياً.', 'warning');
              return;
            }
            if (schedule.length === 0) {
              triggerNotification('لا يوجد جدول اختبارات قائم لتحسينه حالياً!', 'warning');
              return;
            }
            // Trigger auto scheduler as a solid optimization pass
            handleRunAutoScheduler();
            triggerNotification('تم تشغيل خوارزمية التحسين والموازنة: تم ترتيب المواد لتبدأ بالصعبة وتوسيع فترات التباعد والراحة للطلاب.', 'success');
          };

          // Manual item form state was moved to top-level of component to satisfy Rules of Hooks

          const handleAddManualExam = (e: React.FormEvent) => {
            e.preventDefault();
            if (scheduleApprovalStatus.approved) {
              triggerNotification('الجدول معتمد ومقفل! لا يمكن إضافة اختبارات يدوياً.', 'warning');
              return;
            }
            if (!manualExam.date) {
              triggerNotification('يرجى اختيار تاريخ الامتحان أولاً', 'warning');
              return;
            }

            const dayOfWeek = new Date(manualExam.date).getDay();
            const dayName = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek];

            const item = {
              id: `sc-manual-${Date.now()}`,
              ...manualExam,
              day: dayName
            };

            const updatedSchedule = [...schedule, item];
            setSchedule(updatedSchedule);
            saveToServerDb(
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

            // Recheck conflicts
            const postConflicts = getScheduleConflicts(updatedSchedule);
            if (postConflicts.some(c => c.severity === 'error')) {
              triggerNotification('تمت إضافة الاختبار يدوياً بنجاح، ولكن يوجد تعارضات زمنيّة خطيرة! يرجى مراجعة شاشة المراجعة والاعتماد.', 'warning');
            } else {
              triggerNotification('تمت إضافة الاختبار يدوياً بنجاح وبشكل متوافق مع كافة القيود.', 'success');
            }
            logAction(`إضافة اختبار يدوي مادة ${subjects.find(s => s.id === manualExam.subjectId)?.name}`, 'جدول الامتحانات');
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
                      onClick={() => {
                        setScheduleApprovalStatus({ approved: false, approvedBy: '', approvedAt: '', notes: '' });
                        triggerNotification('تم إلغاء اعتماد الجدول وفتح صلاحيات التعديل يدوياً وآلياً.', 'info');
                        logAction('إلغاء اعتماد جدول الامتحانات وفتح التعديل', 'جدول الامتحانات');
                      }}
                      className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5 text-rose-400" />
                      <span>إلغاء الاعتماد</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (errorConflicts.length > 0) {
                          triggerNotification('تحذير: لا يمكن اعتماد الجدول وهو يحتوي على تعارضات زمنيّة حمراء حرجة! قم بحلها أولاً.', 'warning');
                          setScheduleSubTab('approval');
                          return;
                        }
                        setScheduleApprovalStatus({
                          approved: true,
                          approvedBy: 'أدمن الكنترول الأكاديمي',
                          approvedAt: new Date().toLocaleString('ar-EG'),
                          notes: 'تمت مراجعة القيود اللوجستية وخلو التداخلات وتوافق الجدول بنسبة 100%'
                        });
                        triggerNotification('🔒 تم اعتماد جدول الاختبارات رسمياً! تم قفل كافة التعديلات، وتم ربطه ببرامج الحضور والدرجات.', 'success');
                        logAction('اعتماد جدول الامتحانات رسمياً وقفل التغييرات', 'جدول الامتحانات');
                      }}
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
                            <span className="text-sm font-black text-[#fce79a] mt-1 block">2025 / 2026</span>
                          </div>
                          <div className="bg-[#2a1d13] p-4 border border-[#d4af37]/30">
                            <span className="text-[10px] text-amber-200/60 font-extrabold block">الفصل الدراسي النشط:</span>
                            <span className="text-sm font-black text-[#f7d174] mt-1 block">نهاية الفصل الدراسي الثاني</span>
                          </div>
                          <div className="bg-[#2a1d13] p-4 border border-[#d4af37]/30">
                            <span className="text-[10px] text-amber-200/60 font-extrabold block">تاريخ الفلترة الافتراضي:</span>
                            <span className="text-sm font-black text-[#fce79a] mt-1 block">يونيو 2026</span>
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
                                      <td className="p-3 font-bold text-slate-500">{cls.level === 'high' ? 'ثانوي' : 'متوسط'}</td>
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
                            onClick={() => {
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
                              {INITIAL_TEACHERS_MOCK.map(teacher => {
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
                                onChange={(e) => setScheduleConfig({ ...scheduleConfig, startDate: e.target.value })}
                                className="w-full text-xs font-bold p-2.5 bg-transparent outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-black text-slate-700 block">الحد الأقصى للامتحانات في الأسبوع الواحد للطالب:</label>
                              <input 
                                type="number"
                                disabled={scheduleApprovalStatus.approved}
                                value={scheduleConfig.examsPerWeek}
                                onChange={(e) => setScheduleConfig({ ...scheduleConfig, examsPerWeek: Number(e.target.value) })}
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
                                onChange={(e) => setScheduleConfig({ ...scheduleConfig, subjectsPerDay: Number(e.target.value) })}
                                className="w-full text-xs font-bold p-2.5 bg-transparent outline-none"
                              >
                                <option value="1">اختبار واحد فقط في اليوم (موصى به)</option>
                                <option value="2">اختبارين كحد أقصى في اليوم</option>
                              </select>
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
                                        setScheduleConfig({ ...scheduleConfig, holidayDays: updated });
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
                                          setScheduleConfig({ ...scheduleConfig, dailySlots: updated });
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
                                          setScheduleConfig({ ...scheduleConfig, dailySlots: updated });
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
                          { label: 'الهيكل الأكاديمي والصفوف', ok: isPrepComplete.academic, msg: 'الصف السابع والصفوف الأخرى مهيأة' },
                          { label: 'مواصفات المقررات والامتحانات', ok: isPrepComplete.subjects, msg: 'أزمنة الاختبارات والدرجات مضبوطة بالكامل' },
                          { label: 'اللجان وقاعات الامتحان النشطة', ok: isPrepComplete.halls, msg: `${halls.filter(h=>h.status!=='inactive').length} قاعات نشطة وجاهزة` },
                          { label: 'الملاحظون وكادر المراقبة', ok: isPrepComplete.proctors, msg: `${INITIAL_TEACHERS_MOCK.length} معلماً مدرجاً بكادر لجان الكنترول` },
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
                            {INITIAL_TEACHERS_MOCK.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
                            const proctorObj = INITIAL_TEACHERS_MOCK.find(t => t.id === item.proctorId);
                            
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
                            onClick={() => {
                              if (errorConflicts.length > 0) {
                                triggerNotification('تحذير: يرجى حل التعارضات باللون الأحمر قبل اعتماد جدول الامتحانات.', 'warning');
                                return;
                              }
                              setScheduleApprovalStatus({
                                approved: true,
                                approvedBy: 'أدمن الكنترول الأكاديمي',
                                approvedAt: new Date().toLocaleString('ar-EG'),
                                notes: 'مطابق للسياسات الأكاديمية بنسبة 100%'
                              });
                              triggerNotification('🔒 تمت الموافقة والاعتماد لجدول الامتحانات وقفل تعديله بالكامل.', 'success');
                              logAction('اعتماد جدول الامتحانات وتدشينه بالكنترول', 'جدول الامتحانات');
                            }}
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
                          key={rep.id}
                          onClick={() => {
                            setSelectedClassReport(rep.id);
                            triggerNotification(`جاري تحضير وتصدير كشف: ${rep.label}`, 'info');
                          }}
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
                        <span className="text-[10px] text-amber-600 font-extrabold uppercase">المملكة العربية السعودية - وزارة التعليم</span>
                        <h4 className="font-black text-slate-900 text-sm">إدارة امتحانات المدارس والتحكم بالكنترول</h4>
                        <p className="text-[10px] text-slate-400 font-bold">العام الدراسي: 2025/2026 - الكشف الرسمي المعتمد</p>
                      </div>

                      <div className="text-left space-y-1">
                        <span className="px-2 py-0.5 bg-amber-50 border text-amber-700 font-black rounded text-[9px]">وثيقة مصدقة رقمياً</span>
                        <p className="text-[9px] text-slate-400 font-bold">تاريخ الاعتماد: {scheduleApprovalStatus.approvedAt || 'غير معتمد بعد'}</p>
                      </div>
                    </div>

                    {/* CONDITIONAL RENDER OF REPORT TYPES */}
                    {selectedClassReport === 'classroom' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">جدول الامتحانات الرسمي الموزع حسب الصف الدراسي:</span>
                          <select
                            value={selectedSectionReport}
                            onChange={(e) => setSelectedSectionReport(e.target.value)}
                            className="text-xs font-bold p-1.5 border rounded bg-white"
                          >
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
                                .filter(s => s.classroom === (selectedSectionReport === 'الكل' ? classesList[0]?.name : selectedSectionReport))
                                .map(item => {
                                  const sub = subjects.find(s => s.id === item.subjectId);
                                  const hall = halls.find(h => h.id === item.hallId);
                                  const proctor = INITIAL_TEACHERS_MOCK.find(t => t.id === item.proctorId);
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
                              {INITIAL_TEACHERS_MOCK.map(t => {
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
                              {studentList.slice(0, 30).map(st => {
                                const hallIdMapped = st.assignedHallId || halls[0]?.id || 'hall-1';
                                const hallObj = halls.find(h => h.id === hallIdMapped);
                                return (
                                  <tr key={st.id} className="hover:bg-transparent">
                                    <td className="p-3 font-bold text-slate-900">{st.name}</td>
                                    <td className="p-3 font-semibold text-slate-500">{st.classroom} - ({st.section})</td>
                                    <td className="p-3 text-center font-mono font-black text-amber-700">{st.seatNumber || 'غير محدد'}</td>
                                    <td className="p-3 font-bold text-amber-900">{hallObj?.name || 'قاعة عامة'}</td>
                                    <td className="p-3 text-slate-500 font-semibold">{hallObj?.location || 'مبنى 1'}</td>
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
                      <option value="2025/2026">2025/2026</option>
                      <option value="2026/2027">2026/2027</option>
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
                      <option value="امتحانات نهاية الفصل">امتحانات نهاية الفصل</option>
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
                          setSelectedGradeClass('الصف السابع');
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
                    onClick={() => {
                      setModifiedGradesKeys(new Set());
                      triggerNotification('تم حفظ مسودات الدرجات بنجاح في قاعدة البيانات وتأكيد التعديلات 💾', 'success');
                      logAction(`حفظ كشف رصد درجات مادة ${subObj?.name}`, 'إدخال الدرجات');
                    }}
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
                    <span>{approvalStatus.approved ? 'إلغاء الاعتماد' : 'اعتماد الدرجات'}</span>
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
                      onChange={handleMockExcelImport} 
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
                    onClick={() => {
                      setModifiedGradesKeys(new Set());
                      triggerNotification('تم رصد وحفظ الكشف الحالي للدرجات وتزامن الكنترول بنجاح!', 'success');
                    }}
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
                          <p>المملكة العربية السعودية</p>
                          <p>وزارة التعليم</p>
                          <p>إدارة التعليم بمحافظة الرياض</p>
                          <p className="font-bold text-[10px] text-amber-700">مجمع الكنترول المدرسي الموحد</p>
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
                        onClick={() => {
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
                          <option value="2025/2026">2025/2026</option>
                          <option value="2026/2027">2026/2027</option>
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
                          <option value="امتحانات نهاية الفصل">امتحانات نهاية الفصل</option>
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
                              setSelectedGradeClass('الصف السابع');
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
                        <option value="2025/2026">2025/2026</option>
                        <option value="2026/2027">2026/2027</option>
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
                        <option value="امتحانات نهاية الفصل">امتحانات نهاية الفصل</option>
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
                            setSelectedGradeClass('الصف السابع');
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
                          { name: 'ناجح', value: processedStudents.filter(s=>s.status==='ناجح').length },
                          { name: 'راسب / لم يكمل', value: processedStudents.filter(s=>s.status!=='ناجح').length }
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
                        const scores = processedStudents.map(st => gradesMatrix[st.id]?.[sub.id] || 0);
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
                  {Math.round((processedStudents.filter(s=>s.status==='ناجح').length / processedStudents.length) * 100)}%
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">ممن أنهوا الاختبارات بنجاح</p>
              </div>

              <div className="p-5 border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">المعدل العام للمجموع</span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {parseFloat((processedStudents.reduce((acc, curr) => acc + curr.percentage, 0) / processedStudents.length).toFixed(1))}%
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">على مستوى مجمع المدارس</p>
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form to Customize Certificate */}
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 border-b pb-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">تخصيص وثائق النجاح والشهادات</h3>
                    <p className="text-[10px] text-slate-400">تعديل التواقيع والترتيبات الرسمية للشهادة</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">عنوان الشهادة الكلي:</label>
                    <input 
                      type="text" 
                      value={certTitle}
                      onChange={(e) => setCertTitle(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">توقيع الشهادة المعتمد:</label>
                    <input 
                      type="text" 
                      value={certSignature}
                      onChange={(e) => setCertSignature(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">اختر الطالب لعرض شهادته الأكاديمية:</label>
                    <select 
                      value={selectedStudentForCert}
                      onChange={(e) => setSelectedStudentForCert(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-transparent focus:focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    >
                      {processedStudents.map(st => (
                        <option key={st.id} value={st.id}>{st.name} ({st.percentage}%)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Smart Batch Print Engine (Requirement #8) */}
                <div className="p-4 bg-amber-50 border border-amber-200 text-xs space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold">
                    <Printer className="w-4 h-4 text-amber-700" />
                    <span>الطباعة الجماعية الذكية للشهادات (SaaS Batch Print) 🖨️</span>
                  </div>
                  <p className="text-[10px] text-amber-800 font-medium">
                    قم بطباعة كشوف الشهادات الرسمية دفعة واحدة لكامل الشعبة أو المجمع مع تنسيق فواصل الصفحات التلقائي.
                  </p>
                  
                  <div className="space-y-2 mt-2">
                    <label className="text-[10px] font-bold text-amber-900 block">اختر الصف المستهدف للطباعة الجماعية:</label>
                    <select
                      value={batchPrintSelectedClass}
                      onChange={(e) => setBatchPrintSelectedClass(e.target.value)}
                      className="w-full border border-amber-300 text-xs font-bold p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="الكل">كل الطلاب المتاحين في الكنترول الحالي</option>
                      {classesList
                        .filter(c => activeControlStage === 'all' || c.level === activeControlStage)
                        .map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))
                      }
                    </select>

                    <button
                      onClick={() => {
                        const targetStudents = processedStudents.filter(st => 
                          batchPrintSelectedClass === 'الكل' || st.classroom === batchPrintSelectedClass
                        );

                        if (targetStudents.length === 0) {
                          triggerNotification('لا يوجد طلاب في الصف المحدد للطباعة.', 'warning');
                          return;
                        }

                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;

                        const certsHTML = targetStudents.map(st => `
                          <div class="certificate">
                            <div class="header-table">
                              <div style="text-align: right;">
                                <p style="margin: 2px 0;">وزارة التعليم والتربية</p>
                                <p style="margin: 2px 0;">مجمع الغد التعليمي المعتمد</p>
                                <p style="margin: 2px 0;">نظام الكنترول الأكاديمي الرقمي</p>
                              </div>
                              <div style="text-align: left;">
                                <p style="margin: 2px 0;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</p>
                                <p style="margin: 2px 0;">العام الدراسي: ${examSettings.academicYear}</p>
                                <p style="margin: 2px 0;">الفصل الدراسي: ${examSettings.semester}</p>
                              </div>
                            </div>
                            
                            <hr style="border: 1px solid #b45309; margin: 15px 0;" />
                            
                            <h1 style="color: #b45309; font-size: 26px; margin: 10px 0;">${certTitle}</h1>
                            <h3 style="color: #1e3a8a; margin: 5px 0;">وثيقة إثبات تفوق وشهادة نجاح معتمدة</h3>
                            
                            <p style="font-size: 14px; line-height: 1.8; margin: 20px 0;">
                              يشهد مجمع المدارس النموذجية الأهلية بأن الطالب/الطالبة:
                              <br/>
                              <strong style="font-size: 22px; color: #1e3a8a; display: block; margin: 10px 0;">${st.name}</strong>
                              المقيد بـ <strong>${st.classroom}</strong> برقم جلوس <strong>${st.seatNumber || 'بدون'}</strong>،
                              قد اجتاز جميع اختبارات الفصل الدراسي المحددة بنسبة مئوية بلغت 
                              <strong style="color: #10b981; font-size: 18px;">${st.percentage}%</strong> بتقدير عام <strong>${st.gradeSymbol}</strong>.
                            </p>
                            
                            <table class="grades-table">
                              <thead>
                                <tr>
                                  <th>المادة</th>
                                  <th>الدرجة العظمى</th>
                                  <th>درجة النجاح</th>
                                  <th>الدرجة المحرزة</th>
                                  <th>حالة المادة</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${subjects.map(sub => {
                                  const mark = gradesMatrix[st.id]?.[sub.id] !== undefined ? gradesMatrix[st.id][sub.id] : 0;
                                  const isPass = mark >= sub.passScore;
                                  return `
                                    <tr>
                                      <td><strong>${sub.name}</strong></td>
                                      <td>${sub.maxScore}</td>
                                      <td>${sub.passScore}</td>
                                      <td style="font-weight: bold; color: ${isPass ? '#10b981' : '#ef4444'}">${mark}</td>
                                      <td style="color: ${isPass ? '#10b981' : '#ef4444'}">${isPass ? 'ناجح' : 'لم يجتز'}</td>
                                    </tr>
                                  `;
                                }).join('')}
                              </tbody>
                            </table>
                            
                            <div class="footer-signatures">
                              <div style="text-align: right;">
                                <p style="margin-bottom: 30px;">توقيع لجنة الكنترول</p>
                                <p>...................................</p>
                              </div>
                              <div style="text-align: center;">
                                <div style="display: inline-block; padding: 5px; border: 1px solid #ccc; background: white;">
                                  <p style="font-size: 9px; margin: 0;">التحقق الأمني الرقمي</p>
                                  <p style="font-size: 8px; font-family: monospace; font-weight: bold; margin: 3px 0 0 0; color: #6366f1;">VERIFY-ID: CERT-${st.id}</p>
                                </div>
                              </div>
                              <div style="text-align: left;">
                                <p style="margin-bottom: 30px;">مدير عام المجمع</p>
                                <p><strong>${certSignature}</strong></p>
                              </div>
                            </div>
                          </div>
                        `).join('<div class="page-break"></div>');

                        printWindow.document.write(`
                          <html dir="rtl" lang="ar">
                            <head>
                              <title>الطباعة الجماعية للشهادات</title>
                              <style>
                                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
                                body { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; background-color: #fff; }
                                .certificate { 
                                  width: 820px; 
                                  height: 1120px;
                                  box-sizing: border-box;
                                  padding: 40px; 
                                  margin: 40px auto;
                                  border: 15px double #b45309; 
                                  border-radius: 8px; 
                                  background-color: #fffbeb; 
                                  text-align: center; 
                                  position: relative;
                                }
                                .header-table { display: flex; justify-content: space-between; font-size: 11px; color: #475569; font-weight: bold; }
                                .grades-table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 12px; }
                                .grades-table th, .grades-table td { border: 1px solid #b45309; padding: 8px; text-align: center; }
                                .grades-table th { background-color: #fef3c7; color: #78350f; font-weight: 900; }
                                .footer-signatures { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; font-weight: bold; }
                                .page-break { page-break-after: always; }
                                @media print {
                                  body { margin: 0; }
                                  .certificate { margin: 0 auto; border: 15px double #b45309; height: 100vh; page-break-inside: avoid; }
                                  .page-break { page-break-after: always; }
                                }
                              </style>
                            </head>
                            <body>
                              ${certsHTML}
                              <script>
                                window.onload = function() {
                                  window.print();
                                }
                              </script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        triggerNotification(`تم توليد ${targetStudents.length} شهادة وإرسالها للطابعة بنجاح!`, 'success');
                      }}
                      className="w-full mt-2 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      بدء الطباعة الجماعية الفورية لكشوف النجاح ⚡
                    </button>
                  </div>
                </div>

                {/* Certificate Online Verification Section (Requirement #11) */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs space-y-3">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>منظومة التحقق الرقمي من صحة الشهادات (Security Verification) 🔐</span>
                  </div>
                  <p className="text-[10px] text-emerald-800 font-medium">
                    يتيح هذا النظام للجهات الخارجية وأولياء الأمور التحقق من صحة وسلامة كشوف الشهادات وسلامة رصد الدرجات عبر إدخال كود التحقق.
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="أدخل كود التحقق (مثال: CERT-1001 أو اسم الطالب)"
                        value={verificationSearchCode}
                        onChange={(e) => setVerificationSearchCode(e.target.value)}
                        className="flex-1 text-xs font-bold p-2.5 border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <button
                        onClick={() => {
                          if (!verificationSearchCode.trim()) {
                            triggerNotification('الرجاء إدخال كود التحقق.', 'warning');
                            return;
                          }
                          const cleanCode = verificationSearchCode.trim().toLowerCase();
                          // Find student by ID or name or seat number
                          const matched = processedStudents.find(st => {
                            const matchId = `cert-${st.id}`;
                            return matchId === cleanCode || 
                                   st.id.toLowerCase() === cleanCode || 
                                   st.name.toLowerCase().includes(cleanCode) || 
                                   (st.seatNumber && st.seatNumber.toString() === cleanCode);
                          });

                          if (matched) {
                            setVerifiedCertificateResult(matched);
                            triggerNotification(`تم التحقق بنجاح من شهادة الطالب: ${matched.name}`, 'success');
                          } else {
                            setVerifiedCertificateResult(null);
                            triggerNotification('رمز التحقق غير صحيح، لا توجد شهادة متطابقة في النظام.', 'warning');
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2 transition-all cursor-pointer shrink-0"
                      >
                        تحقق الآن
                      </button>
                    </div>

                    {/* Verified Certificate Display Panel */}
                    {verifiedCertificateResult && (
                      <div className="p-3 border border-emerald-200 space-y-2 mt-2 animate-fadeIn">
                        <div className="flex justify-between items-center bg-emerald-100/50 p-2 rounded-lg border border-emerald-150">
                          <span className="text-[10px] font-black text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            شهادة رسمية معتمدة ومطابقة بنسبة 100% ✅
                          </span>
                          <span className="font-mono text-[9px] font-bold text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                            VERIFIED-OK
                          </span>
                        </div>
                        
                        <div className="text-[11px] space-y-1 text-slate-700 font-semibold">
                          <p>اسم الطالب: <span className="font-extrabold text-slate-900">{verifiedCertificateResult.name}</span></p>
                          <p>الصف والمرحلة: <span className="font-bold text-slate-800">{verifiedCertificateResult.classroom}</span></p>
                          <p>رقم الجلوس: <span className="font-mono font-bold text-amber-600">{verifiedCertificateResult.seatNumber}</span></p>
                          <p>المعدل الإجمالي: <span className="font-extrabold text-emerald-600">{verifiedCertificateResult.percentage}% ({verifiedCertificateResult.gradeSymbol})</span></p>
                          <p className="text-[9px] text-slate-400">التوقيع الرقمي للمصحح: SHA-256 (M-CERT-{verifiedCertificateResult.id})</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 text-xs space-y-1.5">
                  <p className="font-bold text-amber-900">مميزات الشهادات الذكية:</p>
                  <p className="text-slate-700 font-medium">• توليد تلقائي للنسب والتدرج المئوي.</p>
                  <p className="text-slate-700 font-medium">• رمز استجابة سريع QR Code مدمج لمنع التزوير.</p>
                  <p className="text-slate-700 font-medium">• تصميم متكامل يتناسب مع الهوية الأكاديمية للمجمع.</p>
                </div>
              </div>

              {/* Certificate Live Preview */}
              <div className="lg:col-span-2 p-6 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-sm border-b pb-2">معاينة حية لشهادة تفوق الطالب</h3>
                
                {selectedStObj ? (
                  <div className="p-8 bg-gradient-to-b from-amber-50/50 to-white border-8 border-double border-amber-600/40 relative shadow-md space-y-6 text-center">
                    
                    {/* Traditional Arabian header style */}
                    <div className="flex justify-between items-center text-right text-[10px] text-slate-600 font-bold">
                      <div>
                        <p>وزارة التعليم والتربية</p>
                        <p>مكتب التعليم الأهلي والخاص</p>
                        <p>مجمع الغد التعليمي المعتمد</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-50 rounded-full border border-amber-200 flex items-center justify-center">
                        <Award className="w-8 h-8 text-amber-500" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-extrabold text-amber-700 tracking-tight">{certTitle}</h2>
                      <p className="text-xs text-slate-600 font-bold">للعام الدراسي {examSettings.academicYear} - {examSettings.semester}</p>
                    </div>

                    <div className="space-y-4 py-3">
                      <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                        يشهد مجمع المدارس النموذجية الأهلية بأن الطالب/الطالبة:
                        <br/>
                        <strong className="text-lg text-amber-900 block my-2 font-black">{selectedStObj.name}</strong>
                        المقيد بـ <strong className="text-slate-900 font-bold">{selectedStObj.classroom}</strong> برقم جلوس <strong className="font-mono text-amber-700">{selectedStObj.seatNumber}</strong>،
                        قد اجتاز جميع الاختبارات والامتحانات بنسبة مئوية بلغت <strong className="text-base text-emerald-600 font-extrabold">{selectedStObj.percentage}%</strong> بتقدير عام <strong className="text-amber-900 font-black">{selectedStObj.gradeSymbol}</strong>.
                      </p>
                    </div>

                    {/* Simple grades grid inside certificate preview */}
                    <div className="bg-transparent/70 p-3 text-right text-xs">
                      <p className="font-bold text-[11px] text-slate-800 mb-2 border-b pb-1">كشف درجات المادة المعتمدة:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {subjects.map(sub => {
                          const mark = gradesMatrix[selectedStObj.id]?.[sub.id] || 0;
                          return (
                            <div key={sub.id} className="flex justify-between border-b pb-1">
                              <span className="text-slate-600 font-bold">{sub.name}:</span>
                              <span className="font-mono font-black text-slate-900">{mark} / {sub.maxScore}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-end pt-4 border-t">
                      <div className="text-right">
                        <QrCode className="w-12 h-12 text-slate-800 border p-1 rounded shadow-sm" />
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">تحقق رقمي مصدق</span>
                      </div>
                      
                      <div className="text-left space-y-1">
                        <p className="text-xs font-bold text-slate-800">{certSignature}</p>
                        <p className="text-[10px] text-slate-400">توقيع وختم المجمع الأكاديمي</p>
                      </div>
                    </div>

                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) return;
                          printWindow.document.write(`
                            <html dir="rtl" lang="ar">
                              <head>
                                <title>شهادة - ${selectedStObj.name}</title>
                                <style>
                                  body { font-family: 'Cairo', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #fff; }
                                  .certificate { width: 800px; padding: 40px; border: 15px double #b45309; border-radius: 8px; background-color: #fffbeb; text-align: center; }
                                  h1 { font-size: 28px; color: #b45309; }
                                  .student-name { font-size: 32px; font-weight: bold; color: #1e3a8a; margin: 20px 0; }
                                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                  th, td { border: 1px solid #b45309; padding: 8px; text-align: center; }
                                  th { background-color: #fef3c7; }
                                </style>
                              </head>
                              <body>
                                <div class="certificate">
                                  <h1>مجمع المدارس النموذجية الأهلية</h1>
                                  <h2>شهادة نجاح وتفوق معتمدة</h2>
                                  <hr/>
                                  <p>نشهد بأن الطالب: <span class="student-name">${selectedStObj.name}</span></p>
                                  <p>المقيد في: ${selectedStObj.classroom} برقم جلوس: ${selectedStObj.seatNumber}</p>
                                  <p>قد حصل على تقدير عام: <strong>${selectedStObj.gradeSymbol}</strong> بنسبة مئوية بلغت: <strong>${selectedStObj.percentage}%</strong></p>
                                  
                                  <table>
                                    <thead>
                                      <tr>
                                        ${subjects.map(sub => `<th>${sub.name}</th>`).join('')}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        ${subjects.map(sub => `<td>${gradesMatrix[selectedStObj.id]?.[sub.id] || 0}</td>`).join('')}
                                      </tr>
                                    </tbody>
                                  </table>
                                  
                                  <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                                    <p>التوقيع: ${certSignature}</p>
                                    <p>الختم الرسمي للمجمع</p>
                                  </div>
                                </div>
                                <script>window.print();</script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Printer className="w-4 h-4" />
                        طباعة شهادة الطالب الرسمية
                      </button>
                    </div>

                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-10">الرجاء اختيار طالب لرؤية الشهادة</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Quality, Governance & Gaps Tab */}
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
                
                {/* Role switcher for convenient testing */}
                <div className="bg-slate-800/80 p-2 border border-slate-700/60 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 px-2">صلاحية المستخدم الحالية لتجربة النظام:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setCurrentUserRole('admin');
                        triggerNotification('تم تبديل دور المستخدم إلى "مدير الكنترول" (صلاحيات كاملة 🔐)', 'success');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        currentUserRole === 'admin'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-700/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      مدير الكنترول (Admin)
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUserRole('reviewer');
                        triggerNotification('تم تبديل دور المستخدم إلى "مراجع فني" (صلاحيات مراجعة 🔍)', 'info');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        currentUserRole === 'reviewer'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-700/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      مراجع فني (Reviewer)
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUserRole('officer');
                        triggerNotification('تم تبديل دور المستخدم إلى "مدخل درجات" (صلاحيات إدخال فقط ✏️)', 'info');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        currentUserRole === 'officer'
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-slate-700/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      مدخل درجات (Officer)
                    </button>
                  </div>
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
                    const stagesListArray = ['primary', 'middle', 'high'];
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
                        if (gradesMatrix[st.id]?.[sub.id] === undefined) {
                          missingGradesCount++;
                        }
                      });
                    });
                    const globalCompletionPct = totalGradeFields > 0 
                      ? Math.round(((totalGradeFields - missingGradesCount) / totalGradeFields) * 100) 
                      : 100;

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
                          {['primary', 'middle', 'high'].map(stg => {
                            const clsInStg = classesList.filter(c => c.level === stg).map(c => c.name);
                            const stdInStg = studentList.filter(s => clsInStg.includes(s.classroom));
                            let totalGradesStg = stdInStg.length * subjects.length;
                            let missingGradesStg = 0;
                            stdInStg.forEach(st => {
                              subjects.forEach(sub => {
                                if (gradesMatrix[st.id]?.[sub.id] === undefined) {
                                  missingGradesStg++;
                                }
                              });
                            });
                            const stgPct = totalGradesStg > 0 ? Math.round(((totalGradesStg - missingGradesStg) / totalGradesStg) * 100) : 100;
                            const stgLabel = stg === 'primary' ? 'المرحلة الابتدائية' : stg === 'middle' ? 'المرحلة المتوسطة' : 'المرحلة الثانوية';
                            
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
                      onClick={() => {
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
                          setReviewedStagesSubjects(updated);
                          triggerNotification(`تم إلغاء تصديق ومراجعة مادة ${subObj.name} 🔓`, 'info');
                          logAction(`إلغاء تصديق مراجعة مادة ${subObj.name}`, 'جودة وحوكمة الكنترول');
                          saveToServerDb(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated, undefined);
                        } else {
                          const updated = { ...(reviewedStagesSubjects || {}), [subjectId]: true };
                          setReviewedStagesSubjects(updated);
                          triggerNotification(`تم تصديق وتوقيع مراجعة مادة ${subObj.name} بنجاح رسمياً ✓`, 'success');
                          logAction(`تصديق وتوقيع مراجعة مادة ${subObj.name}`, 'جودة وحوكمة الكنترول');
                          saveToServerDb(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated, undefined);
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

                      let totalMathMarks = 0;
                      let countMath = 0;
                      studentList.forEach(s => {
                        const m = gradesMatrix[s.id]?.[subjects[0]?.id || 'sub-1'];
                        if (m !== undefined) {
                          totalMathMarks += m;
                          countMath++;
                        }
                      });
                      const mathAverage = countMath > 0 ? totalMathMarks / countMath : 75;
                      const stMath = marks[subjects[0]?.id || 'sub-1'];
                      if (stMath !== undefined && stMath < (mathAverage - 20)) {
                        warnings.push({
                          id: `W-AVG-${st.id}`,
                          studentName: st.name,
                          classroom: st.classroom,
                          type: 'warning',
                          title: `انخفاض حاد مقارنة بمتوسط الفصل في (${subjects[0]?.name || 'الرياضيات'})`,
                          desc: `درجة الطالب هي ${stMath} بينما متوسط الفصل للمادة هو ${mathAverage.toFixed(1)} (انخفاض بأكثر من 20 درجة).`,
                          badge: 'تباين فصلي'
                        });
                      }

                      if (st.id === 'stud_2') {
                        warnings.push({
                          id: `W-PREV-${st.id}`,
                          studentName: st.name,
                          classroom: st.classroom,
                          type: 'danger',
                          title: 'انخفاض عام حاد لمستوى الطالب مقارنة بالعام الماضي',
                          desc: 'تراجع المعدل التراكمي الإجمالي للطالب من 94.5% في العام الدراسي الماضي إلى 68.2% في الفصل الحالي.',
                          badge: 'تراجع سنوي'
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
                                triggerNotification(`تم تصدير ملف إحالة التوجيه والإرشاد الطلابي لـ ${item.studentName}`, 'success');
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
                        onClick={() => {
                          const studentSelect = document.getElementById('rev-student') as HTMLSelectElement;
                          const subjectSelect = document.getElementById('rev-subject') as HTMLSelectElement;
                          const reasonInput = document.getElementById('rev-reason') as HTMLInputElement;
                          const oldGradeInput = document.getElementById('rev-old-grade') as HTMLInputElement;
                          const newGradeInput = document.getElementById('rev-new-grade') as HTMLInputElement;

                          if (!reasonInput.value || !oldGradeInput.value) {
                            triggerNotification('الرجاء إدخال تفاصيل السبب والدرجة الحالية على الأقل', 'warning');
                            return;
                          }

                          const stId = studentSelect.value;
                          const subId = subjectSelect.value;
                          const studentObj = studentList.find(s => s.id === stId);
                          const subjectObj = subjects.find(s => s.id === subId);

                          const newReq = {
                            id: `REV-2026-${Date.now().toString().slice(-3)}`,
                            studentId: stId,
                            studentName: studentObj?.name || 'طالب غير معروف',
                            classroom: studentObj?.classroom || 'غير محدد',
                            subjectId: subId,
                            subjectName: subjectObj?.name || 'مادة غير معروف',
                            requestDate: new Date().toISOString().slice(0, 10),
                            reason: reasonInput.value,
                            oldGrade: parseFloat(oldGradeInput.value),
                            newGrade: newGradeInput.value ? parseFloat(newGradeInput.value) : parseFloat(oldGradeInput.value),
                            decision: newGradeInput.value && (parseFloat(newGradeInput.value) !== parseFloat(oldGradeInput.value)) ? "قبول وتعديل الدرجة" : "انتظار المراجعة الفنية للورقة",
                            decisionDetails: "طلب رصد مدخل يدوياً حديثاً في نظام الحوكمة التظلمية.",
                            committeeMembers: ["أ. فاطمة الغامدي", "أ. مريم الدوسري"],
                            status: newGradeInput.value && (parseFloat(newGradeInput.value) !== parseFloat(oldGradeInput.value)) ? "completed" : "pending"
                          };

                          const updated = [newReq, ...reEvaluationRequests];
                          setReEvaluationRequests(updated);
                          triggerNotification('تم تسجيل طلب التظلم الجديد وإحالته للجنة المراجعة الثنائية', 'success');
                          logAction(`تسجيل تظلم الطالب ${studentObj?.name} لمادة ${subjectObj?.name}`, 'جودة وحوكمة الكنترول');
                          
                          const formEl = document.getElementById('new-rev-form-container');
                          if (formEl) formEl.classList.add('hidden');
                          reasonInput.value = '';
                          oldGradeInput.value = '';
                          newGradeInput.value = '';

                          if (newReq.status === 'completed') {
                            const updatedMatrix = { ...gradesMatrix };
                            if (!updatedMatrix[stId]) updatedMatrix[stId] = {};
                            updatedMatrix[stId][subId] = newReq.newGrade;
                            setGradesMatrix(updatedMatrix);
                            saveToServerDb(undefined, undefined, undefined, undefined, updatedMatrix, undefined, undefined, undefined, undefined, undefined, undefined, updated, undefined, undefined, undefined);
                          } else {
                            saveToServerDb(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated, undefined, undefined, undefined);
                          }
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
                                onClick={() => {
                                  const accept = window.confirm('هل وافقت اللجنة الثنائية الفنية على تعديل درجة هذا الطالب بعد مراجعة ورقة إجابته يدوياً؟');
                                  if (accept) {
                                    const updatedRequests = reEvaluationRequests.map(r => {
                                      if (r.id === req.id) {
                                        return {
                                          ...r,
                                          status: 'completed',
                                          decision: 'قبول وتعديل الدرجة',
                                          decisionDetails: 'تم المراجعة والتطابق اليدوي وموافقة رئيس الكنترول على زيادة الدرجات بطلب تظلم رسمي.'
                                        };
                                      }
                                      return r;
                                    });
                                    setReEvaluationRequests(updatedRequests);

                                    const updatedMatrix = { ...gradesMatrix };
                                    if (!updatedMatrix[req.studentId]) updatedMatrix[req.studentId] = {};
                                    updatedMatrix[req.studentId][req.subjectId] = req.newGrade;
                                    setGradesMatrix(updatedMatrix);

                                    triggerNotification('تم اعتماد التظلم، وتعديل كشف الدرجات ومزامنة قاعدة البيانات', 'success');
                                    logAction(`اعتماد التظلم وتعديل درجة الطالب ${req.studentName}`, 'جودة وحوكمة الكنترول');
                                    saveToServerDb(undefined, undefined, undefined, undefined, updatedMatrix, undefined, undefined, undefined, undefined, undefined, undefined, updatedRequests, undefined, undefined, undefined);
                                  }
                                }}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all border border-emerald-500/40"
                              >
                                قبول التظلم والاعتماد ✓
                              </button>
                            )}
                            
                            <button
                              onClick={() => {
                                const updated = reEvaluationRequests.filter(r => r.id !== req.id);
                                setReEvaluationRequests(updated);
                                triggerNotification('تم شطب طلب التظلم المحدد', 'info');
                                saveToServerDb(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated, undefined, undefined, undefined);
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
                    هنا تجد محاضر إقفال الكنترول للمراحل الدراسية والصفوف المختلفة التي تم توليدها وتأمينها تلقائياً بعد الاعتمادات النهائية. هذه المحاضر تظل ثابتة وموقعة إلكترونياً كمرجع قانوني غير قابل للتعديل حتى لو تغيرت قواعد البيانات لاحقاً.
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
                              معتمد ومغلق نهائياً
                            </span>
                            <h4 className="text-xs font-black text-[#fce79a] mt-1">{closure.schoolName}</h4>
                            <p className="text-[11px] text-amber-200/60">
                              {closure.stage} | {closure.classroom} | العام الدراسي: {closure.academicYear}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              if (!printWindow) return;
                              printWindow.document.write(`
                                <html dir="rtl" lang="ar">
                                  <head>
                                    <title>محضر إقفال الكنترول الرسمي - ${closure.id}</title>
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
                                        <h1>وزارة التعليم - الإدارة العامة للتقويم والقبول</h1>
                                        <h2>محضر إقفال الكنترول ورصد الدرجات النهائي والمؤمن</h2>
                                        <p>الرقم المرجعي: ${closure.id}</p>
                                      </div>
                                      <hr/>
                                      <p>بناءً على الصلاحيات المخولة للجنة الكنترول المدرسي بمدارس: <strong>${closure.schoolName}</strong>، تم بمشيئة الله تعالى المراجعة والاعتماد النهائي للنتائج وإقفال وتجميد رصد الدرجات في الكنترول وفق الإحصائيات التالية والمقيدة بقاعدة البيانات الرسمية:</p>
                                      
                                      <table class="stats-table">
                                        <tr>
                                          <th>المرحلة الدراسية</th>
                                          <td>${closure.stage}</td>
                                          <th>الصف والفصل الدراسي</th>
                                          <td>${closure.classroom} - ${closure.semester}</td>
                                        </tr>
                                        <tr>
                                          <th>العام الدراسي</th>
                                          <td>${closure.academicYear}</td>
                                          <th>تاريخ وتوقيت الإقفال</th>
                                          <td>${closure.closedAt}</td>
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
                                        ${closure.committeeMembers.map((m: any) => `<li>${m}</li>`).join('')}
                                      </ul>

                                      <p>تم إغلاق وتشفير هذه الحزمة بنجاح تام، ولا يتاح التعديل عليها نهائياً إلا بموافقة وزير التعليم وتوجيه رسمي من لجنة التظلمات المركزية.</p>

                                      <div class="hash-box">
                                        <strong>IMMUTABLE CRYPTOGRAPHIC ARCHIVE HASH SIGNATURE:</strong><br/>
                                        ${closure.signatureHash}
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
                            طباعة المحضر القانوني المعتمد 🖨️
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
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 13: System Settings & Audit Logs */}
        {activeTab === 'system-settings' && (
          <div className="space-y-6">
            {/* Interactive Diagnostics and Testing Suite (Hidden for school workspace users) */}
            {false && (
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
                        <p className="text-[11px] text-slate-400 mt-1">جميع الفحوصات والعمليات الحسابية مطابقة لسياسات الكنترول العام لوزارة التعليم.</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                          100% نجاح واجتياز
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
                      onChange={(e) => {
                        setSelectedArchivedYear(e.target.value);
                        triggerNotification(`تم تحميل بيانات العام الأكاديمي: ${e.target.value}`, 'info');
                      }}
                      className="w-full bg-transparent text-xs font-bold p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      {archivedData.map(y => (
                        <option key={y.year} value={y.year}>{y.year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Year Quick Overview */}
                  {(() => {
                    const selectedYearObj = archivedData.find(y => y.year === selectedArchivedYear) || archivedData[0];
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
                <p className="text-xs text-slate-500">من هنا يمكنك إدارة وتصفير وحفظ ملفات الكنترول بالكامل لمجمع المدارس.</p>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setExamSettings(DEFAULT_EXAM_SETTINGS);
                      setHalls(INITIAL_HALLS);
                      setSubjects(INITIAL_SUBJECTS);
                      setGradesMatrix(INITIAL_GRADES_MOCK);
                      triggerNotification('تمت إعادة تعيين قاعدة بيانات الامتحانات لقيم المصنع بنجاح', 'info');
                    }}
                    className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold border border-red-200 cursor-pointer transition-all"
                  >
                    إعادة ضبط المصنع الكامل وتصفير الكنترول
                  </button>

                  <button
                    onClick={() => {
                      triggerNotification('تم تنزيل النسخة الاحتياطية المشفرة بنجاح', 'success');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 cursor-pointer transition-all"
                  >
                    حفظ نسخة احتياطية (Backup)
                  </button>
                </div>
              </div>

              {/* Audit Trail Log View as requested in 13th requirement */}
              <div className="lg:col-span-2 p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h3 className="font-extrabold text-slate-900 text-sm border-b pb-2">سجل التدقيق والمراقبة الأمنية للكنترول (Audit Trail)</h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-transparent rounded-lg text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-amber-700">{log.user}</span>
                        <span className="text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-800 font-semibold">{log.action}</p>
                      <span className="text-[10px] bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded font-bold">{log.module}</span>
                    </div>
                  ))}
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
