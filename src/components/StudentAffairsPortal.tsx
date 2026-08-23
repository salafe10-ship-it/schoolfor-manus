import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, UserPlus, GraduationCap, FileText, BarChart3, Settings, 
  Search, Bell, Mail, Filter, RotateCcw, Eye, Edit, Trash2, 
  MoreVertical, X, Camera, Save, Plus, Building, Clock, Check, 
  ChevronLeft, ChevronRight, User, Award, Download, Upload, 
  Printer, ArrowRightLeft, ShieldAlert, CheckCircle2, AlertTriangle, 
  Phone, Mail as MailIcon, MapPin, Calendar, FileSpreadsheet, 
  Layers, ChevronDown, UserCheck, UserX, HelpCircle, FileCheck, 
  Paperclip, ExternalLink, RefreshCw
} from 'lucide-react';
import { Student, School, UserRole } from '../types';
import { PERMISSIONS } from '../authorization/PermissionRegistry';
import { StudentRepository } from './student-affairs/repository/StudentRepository';
import { getTrustedAccessToken } from '../utils/auth';
import StudentDocumentsPortal from '../modules/student-documents/presentation/StudentDocumentsPortal';

type StudentTimelineEvent = {
  id: string;
  type?: string;
  date?: string;
  title: string;
  description: string;
  user?: string;
};

function canonicalDateInput(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const isoDate = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return isoDate?.[1] || '';
}

interface StudentAffairsPortalProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedSchool: School;
  currentRole: UserRole;
  logAction: (action: string, details: string, module: string) => void;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  setActiveSection?: (section: string) => void;
  canUseTrustedPermission?: (permission: string) => boolean;
  stages?: any[];
  setStages?: React.Dispatch<React.SetStateAction<any[]>>;
  grades?: any[];
  setGrades?: React.Dispatch<React.SetStateAction<any[]>>;
  academicClasses?: any[];
  setAcademicClasses?: React.Dispatch<React.SetStateAction<any[]>>;
  costCenters?: any[];
  setCostCenters?: React.Dispatch<React.SetStateAction<any[]>>;
  invoices?: any[];
  setInvoices?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function StudentAffairsPortal({
  students,
  setStudents,
  selectedSchool,
  currentRole,
  logAction,
  triggerNotification,
  setActiveSection,
  canUseTrustedPermission = () => false
}: StudentAffairsPortalProps) {
  const canWriteStudents = canUseTrustedPermission(PERMISSIONS.STUDENT_WRITE);
  const canDeleteStudents = canUseTrustedPermission(PERMISSIONS.STUDENT_DELETE);
  const canExportStudents = canUseTrustedPermission(PERMISSIONS.STUDENT_EXPORT);
  // Primary Navigation Sub-tabs state
  const [activeTab, setActiveTab] = useState<'student_data' | 'guardians' | 'documents' | 'reports' | 'settings'>('student_data');
  
  // Add/Edit Student Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [registrationIdempotencyKey, setRegistrationIdempotencyKey] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'basic' | 'extra' | 'guardian' | 'docs' | 'notes'>('basic');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  // View Profile & ID Card Modal State
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [showIdCardPrint, setShowIdCardPrint] = useState<boolean>(false);
  const [timelineStudent, setTimelineStudent] = useState<Student | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<StudentTimelineEvent[]>([]);
  const [timelineStatus, setTimelineStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');
  const [timelineError, setTimelineError] = useState<string>('');

  // Transfer / Promotion Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferTargetStage, setTransferTargetStage] = useState<string>('المرحلة الابتدائية');
  const [transferTargetGrade, setTransferTargetGrade] = useState<string>('الصف الثاني الابتدائي');
  const [transferTargetSection, setTransferTargetSection] = useState<string>('ب');

  // Excel Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Selected Student for View/Edit/Batch
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [printPreviewStudents, setPrintPreviewStudents] = useState<Student[] | null>(null);

  // Advanced Search Filter State
  const [searchStage, setSearchStage] = useState<string>('all');
  const [searchGrade, setSearchGrade] = useState<string>('all');
  const [searchClass, setSearchClass] = useState<string>('all');
  const [searchStatus, setSearchStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [isExportingStudents, setIsExportingStudents] = useState<boolean>(false);
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null);
  const [studentRefreshToken, setStudentRefreshToken] = useState(0);
  const [studentQueryMeta, setStudentQueryMeta] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  });
  const [studentMetrics, setStudentMetrics] = useState({
    totalCount: 0,
    activeCount: 0,
    newCount: 0,
    suspendedCount: 0,
    pendingDocsCount: 0
  });

  // Sorting State
  const [sortColumn, setSortColumn] = useState<'name' | 'code' | 'grade' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Form State for Add/Edit Modal
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    studentCode: '',
    nationalId: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    stage: '',
    grade: '',
    classSection: '',
    nationality: '',
    religion: '',
    status: '',
    phone: '',
    email: '',
    address: '',
    parentName: '',
    parentPhone: '',
    parentNationalId: '',
    parentRelation: '',
    parentJob: '',
    avatarUrl: '',
    notes: ''
  });

  // Student Affairs renders one server-authoritative page. The server derives
  // school/tenant scope from the trusted session; schoolId is only a
  // compatibility hint. Stage/grade remain disabled until their canonical
  // source is approved; section maps to the canonical enrollment reference.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const token = getTrustedAccessToken() || null;

    setStudentLoadError(null);
    if (!token) {
      setIsLoadingStudents(false);
      setStudentQueryMeta({ page: 1, limit: rowsPerPage, totalCount: 0, totalPages: 1, hasNext: false, hasPrevious: false });
      setStudentLoadError('لا توجد جلسة موثوقة لجلب بيانات الطلاب. سجّل الدخول ثم أعد المحاولة.');
      setStudents(current => current.filter(student => student.schoolId !== selectedSchool.id));
      return () => { cancelled = true; controller.abort(); };
    }

    setIsLoadingStudents(true);
    const serverSortBy = sortColumn === 'code'
      ? 'studentNumber'
      : sortColumn === 'status'
        ? 'status'
        : sortColumn === 'name'
          ? 'name'
          : 'registrationDate';
    const query = {
      page: currentPage,
      limit: rowsPerPage,
      sortBy: serverSortBy,
      sortOrder: sortDirection,
      ...(searchKeyword.trim() ? { search: searchKeyword.trim() } : {}),
      ...(searchStatus !== 'all' ? { status: searchStatus } : {}),
      ...(searchClass !== 'all' ? { section: searchClass } : {})
    };
    const loadTimer = window.setTimeout(() => StudentRepository.list(query, controller.signal)
      .then(response => {
        if (cancelled) return;
        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        const responseMeta = response?.meta || {};
        const totalCount = Number.isInteger(responseMeta.totalCount) ? responseMeta.totalCount : rows.length;
        const totalPages = Number.isInteger(responseMeta.totalPages)
          ? Math.max(1, responseMeta.totalPages)
          : Math.max(1, Math.ceil(totalCount / rowsPerPage));
        setStudentQueryMeta({
          page: Number.isInteger(responseMeta.page) ? responseMeta.page : currentPage,
          limit: Number.isInteger(responseMeta.limit) ? responseMeta.limit : rowsPerPage,
          totalCount,
          totalPages,
          hasNext: responseMeta.hasNext === true,
          hasPrevious: responseMeta.hasPrevious === true
        });
        setStudents(current => [
          ...current.filter(student => student.schoolId !== selectedSchool.id),
          ...(rows as Student[])
        ]);
      })
      .catch(error => {
        if (cancelled) return;
        if (error?.name === 'AbortError') return;
        const message = error?.message || 'تعذر جلب بيانات الطلاب من قاعدة البيانات.';
        setStudentLoadError(message);
        setStudents(current => current.filter(student => student.schoolId !== selectedSchool.id));
        void triggerNotification(message, 'warning');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStudents(false);
      }), 250);

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      controller.abort();
    };
    // triggerNotification is intentionally excluded: App supplies an inline
    // callback, and including it would refetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchool.id, searchKeyword, searchStatus, searchClass, currentPage, rowsPerPage, sortColumn, sortDirection, studentRefreshToken, setStudents]);

  // A server page change invalidates row selections from the previous page.
  // Keeping those IDs would let a later batch action target records that are
  // no longer visible in the current canonical result set.
  useEffect(() => {
    setSelectedStudentIds([]);
  }, [selectedSchool.id, searchKeyword, searchStatus, searchClass, currentPage, rowsPerPage, sortColumn, sortDirection]);

  // Dashboard metrics come from the server-side canonical scope, not the
  // currently loaded page. Never manufacture counts when the request fails.
  const currentSchoolStudents = useMemo(() => students.filter(student => student.schoolId === selectedSchool.id), [students, selectedSchool.id]);
  const totalCount = studentMetrics.totalCount;
  const visibleQueryCount = studentQueryMeta.totalCount;
  const activeCount = studentMetrics.activeCount;
  const newCount = studentMetrics.newCount;
  const suspendedCount = studentMetrics.suspendedCount;
  const pendingDocsCount = studentMetrics.pendingDocsCount;

  useEffect(() => {
    const controller = new AbortController();
    const token = getTrustedAccessToken() || null;
    if (!token) return () => controller.abort();
    fetch('/api/student-affairs/metrics', {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('تعذر تحميل مؤشرات شؤون الطلاب.')))
      .then(payload => {
        const metrics = payload?.data;
        if (!metrics) throw new Error('استجابة مؤشرات شؤون الطلاب غير صالحة.');
        setStudentMetrics({
          totalCount: Number(metrics.totalCount) || 0,
          activeCount: Number(metrics.activeCount) || 0,
          newCount: Number(metrics.newCount) || 0,
          suspendedCount: Number(metrics.suspendedCount) || 0,
          pendingDocsCount: Number(metrics.pendingDocsCount) || 0
        });
      })
      .catch(error => {
        if (error?.name !== 'AbortError') void triggerNotification(error?.message || 'تعذر تحميل مؤشرات شؤون الطلاب.', 'warning');
      });
    return () => controller.abort();
    // App supplies an inline notification callback; it must not refetch on
    // every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchool.id]);

  // The server owns filtering, sorting, and pagination. These aliases keep
  // downstream row actions/export code scoped to the current server page.
  const filteredStudents = currentSchoolStudents;
  const paginatedStudents = currentSchoolStudents;

  const handleOpenViewStudent = (student: Student) => {
    setViewStudent(student);
    setTimelineStudent(null);
    setTimelineEvents([]);
    setTimelineStatus('idle');
    setTimelineError('');
  };

  const loadStudentTimeline = async (student: Student) => {
    setTimelineStudent(student);
    setTimelineEvents([]);
    setTimelineError('');
    setTimelineStatus('loading');

    try {
      const token = getTrustedAccessToken();
      const response = await fetch(`/api/students/${encodeURIComponent(student.id)}/timeline`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const payload = await response.json().catch(() => null) as { data?: StudentTimelineEvent[]; message?: string; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'تعذر تحميل الخط الزمني للطالب.');
      }

      const events = Array.isArray(payload?.data) ? payload.data : [];
      setTimelineEvents(events);
      setTimelineStatus(events.length > 0 ? 'success' : 'empty');
    } catch (error: any) {
      setTimelineError(error?.message || 'تعذر تحميل الخط الزمني للطالب.');
      setTimelineStatus('error');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchStage('all');
    setSearchGrade('all');
    setSearchClass('all');
    setSearchStatus('all');
    setSearchKeyword('');
    setCurrentPage(1);
    triggerNotification('تم إعادة تعيين تصفية البحث بنجاح', 'info');
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      fullName: '',
      preferredName: '',
      studentCode: '',
      nationalId: '',
      gender: 'ذكر',
      birthDate: '',
      birthPlace: '',
      stage: '',
      grade: '',
      classSection: '',
      nationality: '',
      religion: '',
      status: '',
      phone: '',
      email: '',
      address: '',
      parentName: '',
      parentPhone: '',
      parentNationalId: '',
      parentRelation: 'أب',
      parentJob: '',
      avatarUrl: '',
      notes: ''
    });
    setIsEditMode(false);
    setSelectedStudent(null);
    setRegistrationIdempotencyKey(`student-affairs-registration-${crypto.randomUUID()}`);
    setModalTab('basic');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (student: Student) => {
    setSelectedStudent(student);
    setRegistrationIdempotencyKey(null);
    setFormData({
      fullName: student.name || '',
      preferredName: (student as any).preferredName || '',
      studentCode: student.studentCode || student.academicId || '',
      // National ID is not part of the canonical Student profile contract.
      nationalId: '',
      gender: student.gender || '',
      birthDate: canonicalDateInput(student.birthDate),
      birthPlace: (student as any).birthPlace || '',
      stage: '',
      grade: '',
      classSection: '',
      nationality: student.nationality || '',
      religion: '',
      status: (student.status as string) || '',
      // Do not project Guardian contact data into Student contact fields.
      phone: '',
      email: '',
      address: '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentNationalId: (student as any).parentNationalId || '',
      parentRelation: (student as any).guardianRelation || (student as any).parentRelation || '',
      parentJob: (student as any).parentJob || '',
      avatarUrl: student.avatarUrl || '',
      notes: (student as any).notes || ''
    });
    setIsEditMode(true);
    setModalTab('basic');
    setIsModalOpen(true);
  };

  // Save Student (Add / Edit)
  const handleSaveStudent = async (addAnother = false) => {
    if (!canWriteStudents) {
      triggerNotification('لا تملك صلاحية تعديل بيانات الطلاب.', 'warning');
      return;
    }
    if (!formData.fullName.trim()) {
      triggerNotification('يرجى إدخال اسم الطالب رباعي بشكل صحيح', 'warning');
      return;
    }
    if (!formData.birthDate) {
      triggerNotification('تاريخ الميلاد مطلوب للربط مع السجل canonical.', 'warning');
      return;
    }
    // Guardian identity/contact is mandatory for a new canonical registration,
    // but it must not block an unrelated student-field update. Guardian edits
    // still go through the dedicated canonical guardian workflow below.
    if (!isEditMode && (!formData.parentName.trim() || !formData.parentPhone.trim())) {
      triggerNotification('اسم ولي الأمر ورقم هاتفه مطلوبان لإتمام التسجيل الآمن.', 'warning');
      return;
    }
    if (!formData.gender || !formData.status) {
      triggerNotification('الجنس والحالة الدراسية حقول مطلوبة ولا تُملأ تلقائيًا.', 'warning');
      return;
    }

    let guardianUpdateResult: any = null;
    let guardianChanged = false;
    let guardianUpdateStarted = false;
    let guardianPersisted = false;
    let studentUpdateStarted = false;
    let studentPersisted = false;

    const studentPayload: any = {
      id: isEditMode ? selectedStudent?.id : undefined,
      version: isEditMode ? selectedStudent?.version : undefined,
      name: formData.fullName,
      preferredName: formData.preferredName,
      studentCode: formData.studentCode,
      academicId: formData.studentCode,
      gender: formData.gender,
      birthDate: formData.birthDate,
      nationality: formData.nationality,
      status: formData.status,
    };

    const persistenceNotice = 'تم حفظ بيانات الطالب الأساسية. الحقول غير المدعومة أو التابعة لوحدات أخرى لم تُحفظ من هذه الشاشة.';

    if (!isEditMode) {
      Object.assign(studentPayload, {
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        guardianRelation: formData.parentRelation
      });
    }

    try {
      if (isEditMode && selectedStudent) {
        const existingGuardianName = selectedStudent.parentName || '';
        const existingGuardianPhone = selectedStudent.parentPhone || '';
        const existingGuardianRelation = (selectedStudent as any).guardianRelation || (selectedStudent as any).parentRelation || '';
        guardianChanged = formData.parentName !== existingGuardianName
          || formData.parentPhone !== existingGuardianPhone
          || formData.parentRelation !== existingGuardianRelation;
        const unsupportedGuardianChanged = ((selectedStudent as any).parentNationalId || '') !== formData.parentNationalId
          || ((selectedStudent as any).parentJob || '') !== formData.parentJob;
        if (unsupportedGuardianChanged) {
          throw new Error('الحقول الوطنية والوظيفية لولي الأمر ليست ضمن عقد التعديل الكانوني الحالي؛ لم يتم حفظ أي تغيير.');
        }
        if (guardianChanged) {
          const guardianId = (selectedStudent as any).guardianId;
          const guardianVersion = (selectedStudent as any).guardianVersion;
          const relationshipVersion = (selectedStudent as any).guardianRelationshipVersion;
          if (!guardianId || !Number.isInteger(Number(guardianVersion)) || !Number.isInteger(Number(relationshipVersion))) {
            throw new Error('تعذر تحديث ولي الأمر لأن بيانات الإصدار الكانوني غير موجودة. أعد تحميل سجل الطالب ثم حاول مرة أخرى.');
          }
          const parts = formData.parentName.trim().split(/\s+/).filter(Boolean);
          if (parts.length < 2 || !formData.parentPhone.trim()) {
            throw new Error('يجب إدخال اسم ولي الأمر واسم العائلة ورقم الهاتف.');
          }
          guardianUpdateStarted = true;
          guardianUpdateResult = await StudentRepository.updateGuardian(selectedStudent.id, {
            guardianId,
            expectedGuardianVersion: guardianVersion,
            expectedRelationshipVersion: relationshipVersion,
            legalFirstName: parts[0],
            legalMiddleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
            legalLastName: parts[parts.length - 1],
            phone: formData.parentPhone.trim(),
            relationshipType: formData.parentRelation || undefined
          });
          guardianPersisted = true;
        }
      }
      studentUpdateStarted = true;
      const response = isEditMode
        ? await StudentRepository.saveStudent(studentPayload)
        : await StudentRepository.registerStudent(studentPayload, registrationIdempotencyKey || '');
      const persistedStudent = response?.data?.student || response?.student;
      if (!persistedStudent) {
        throw new Error('لم يُرجع الخادم سجل الطالب بعد الحفظ.');
      }
      studentPersisted = true;

      if (isEditMode && selectedStudent) {
        const updatedGuardian = guardianUpdateResult?.data?.guardian;
        const mergedStudent = updatedGuardian ? {
          ...persistedStudent,
          parentName: formData.parentName,
          parentPhone: formData.parentPhone,
          guardianRelation: formData.parentRelation,
          guardianId: updatedGuardian.guardianId,
          guardianVersion: updatedGuardian.guardianVersion,
          guardianRelationshipId: updatedGuardian.relationshipId,
          guardianRelationshipVersion: updatedGuardian.relationshipVersion
        } : persistedStudent;
        setStudents(current => current.map(student => student.id === selectedStudent.id ? mergedStudent : student));
        setStudentRefreshToken(value => value + 1);
        logAction('UPDATE_STUDENT', `تم تحديث بيانات الطالب: ${formData.fullName}`, 'شؤون الطلاب');
        triggerNotification(
          guardianChanged
            ? `${persistenceNotice} تم حفظ بيانات ولي الأمر والطالب ${formData.fullName} كعمليتين مستقلتين.`
            : `${persistenceNotice} تم تعديل الطالب ${formData.fullName}.`,
          'success'
        );
        setIsModalOpen(false);
      } else {
        // Registration returns a canonical registration summary, not a list row.
        // Reload the trusted server page so the new record is normalized and
        // can be viewed/reopened with its persisted guardian metadata.
        setStudentRefreshToken(value => value + 1);
        logAction('CREATE_STUDENT', `تسجيل طالب جديد: ${formData.fullName}`, 'شؤون الطلاب');
        triggerNotification(`${persistenceNotice} تم تسجيل الطالب الجديد ${formData.fullName}.`, 'success');

        if (addAnother) {
          setRegistrationIdempotencyKey(`student-affairs-registration-${crypto.randomUUID()}`);
          setFormData({
            fullName: '',
            preferredName: '',
            studentCode: '',
            nationalId: '',
            gender: '',
            birthDate: '',
            birthPlace: '',
            stage: '',
            grade: '',
            classSection: '',
            nationality: '',
            religion: '',
            status: '',
            phone: '',
            email: '',
            address: '',
            parentName: '',
            parentPhone: '',
            parentNationalId: '',
            parentRelation: '',
            parentJob: '',
            avatarUrl: '',
            notes: ''
          });
        } else {
          setRegistrationIdempotencyKey(null);
          setIsModalOpen(false);
        }
      }
    } catch (error: any) {
      if (isEditMode && selectedStudent && guardianChanged && guardianPersisted && !studentPersisted) {
        triggerNotification(
          'تم حفظ بيانات ولي الأمر، لكن لم تثبت نتيجة حفظ بيانات الطالب. أعد تحميل السجل للتحقق قبل إعادة المحاولة.',
          'warning'
        );
        return;
      }
      if (isEditMode && selectedStudent && guardianChanged && guardianUpdateStarted && !guardianPersisted && !studentUpdateStarted) {
        triggerNotification(
          'تعذر إثبات نتيجة تحديث ولي الأمر، لذلك لم يُرسل تحديث الطالب. أعد تحميل السجل للتحقق قبل إعادة المحاولة.',
          'warning'
        );
        return;
      }
      triggerNotification(error?.message || 'تعذر حفظ سجل الطالب في الخادم.', 'warning');
    }
  };

  // Delete Student
  const handleDeleteStudent = async (student: Student) => {
    if (!canDeleteStudents) {
      triggerNotification('لا تملك صلاحية حذف بيانات الطلاب.', 'warning');
      return;
    }
    if (window.confirm(`هل أنت تأكد من نقل الطالب (${student.name}) إلى سلة المحذوفات؟`)) {
      try {
        await StudentRepository.softDeleteStudent(student.id);
        setStudents(current => current.filter(currentStudent => currentStudent.id !== student.id));
        logAction('DELETE_STUDENT', `حذف الطالب: ${student.name}`, 'شؤون الطلاب');
        triggerNotification(`تم نقل الطالب ${student.name} إلى سلة المحذوفات`, 'info');
      } catch (error: any) {
        triggerNotification(error?.message || 'تعذر نقل الطالب إلى سلة المحذوفات.', 'warning');
      }
    }
  };

  // Suspend Student
  const handleToggleSuspendStudent = async (student: Student) => {
    if (!canWriteStudents) {
      triggerNotification('لا تملك صلاحية تغيير حالة قيد الطالب.', 'warning');
      return;
    }
    if (String(student.status) === 'suspended') {
      triggerNotification('إعادة القيد ليست عودة مباشرة؛ يجب تنفيذ مسار تصحيح/اعتماد الحالة المعتمد.', 'warning');
      return;
    }
    const newStatus = student.status === 'suspended' ? 'active' : 'suspended';
    try {
      const response = await StudentRepository.saveStudent({ id: student.id, status: newStatus });
      const persistedStudent = response?.data?.student || response?.student;
      if (!persistedStudent) {
        throw new Error('لم يُرجع الخادم سجل الطالب بعد تغيير الحالة.');
      }
      setStudents(current => current.map(currentStudent => currentStudent.id === student.id ? persistedStudent : currentStudent));
      const statusText = newStatus === 'suspended' ? 'إيقاف قيد' : 'إعادة تفعيل قيد';
      logAction('SUSPEND_STUDENT', `${statusText} الطالب: ${student.name}`, 'شؤون الطلاب');
      triggerNotification(`تم ${statusText} الطالب ${student.name} بنجاح`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر تغيير حالة الطالب في الخادم.', 'warning');
    }
  };

  // Checkbox selection
  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(paginatedStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Batch Transfer / Promote Action
  const handleBatchTransfer = async () => {
    if (selectedStudentIds.length === 0) {
      triggerNotification('يرجى تحديد طالب واحد على الأقل لنقله أو ترقيته', 'warning');
      return;
    }

    // A batch transfer must be one canonical, durable transaction. Calling the
    // legacy single-student endpoint in a loop can commit a partial batch, so
    // fail closed until the approved TransferOperation service exists.
    triggerNotification(
      'النقل الجماعي موقوف مؤقتًا حتى اعتماد العملية الذرية وسجل idempotency. لم يتم تعديل أي طالب.',
      'warning'
    );
  };

  // Student Data Export: the server owns scope, filtering, privacy, and XLSX generation.
  const handleExportExcel = async () => {
    if (!canExportStudents) {
      triggerNotification('لا تملك صلاحية تصدير بيانات الطلاب.', 'warning');
      return;
    }
    if (isExportingStudents) return;
    setIsExportingStudents(true);
    const serverSortBy = sortColumn === 'code'
      ? 'studentNumber'
      : sortColumn === 'status'
        ? 'status'
        : sortColumn === 'name'
          ? 'name'
          : 'registrationDate';
    try {
      const result = await StudentRepository.exportStudents({
        ...(searchKeyword.trim() ? { search: searchKeyword.trim() } : {}),
        ...(searchStatus !== 'all' ? { status: searchStatus } : {}),
        ...(searchClass !== 'all' ? { section: searchClass } : {}),
        sortBy: serverSortBy,
        sortOrder: sortDirection
      });
      const downloadUrl = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      triggerNotification('تم إنشاء ملف XLSX وتنزيله بنجاح بعد التحقق من الخادم.', 'success');
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        triggerNotification(error?.message || 'تعذر إنشاء ملف XLSX.', 'warning');
      }
    } finally {
      setIsExportingStudents(false);
    }
  };

  // Export PDF / Print List
  const handlePrintList = () => {
    if (isLoadingStudents) {
      triggerNotification('انتظر اكتمال تحميل الصفوف الحالية قبل الطباعة.', 'warning');
      return;
    }
    if (studentLoadError) {
      triggerNotification('لا يمكن الطباعة أثناء وجود خطأ في تحميل بيانات الطلاب. أعد المحاولة أولًا.', 'warning');
      return;
    }
    const printableStudents = selectedStudentIds.length > 0
      ? filteredStudents.filter(student => selectedStudentIds.includes(student.id))
      : filteredStudents;
    if (printableStudents.length === 0) {
      triggerNotification('لا توجد صفوف معروضة حاليًا للطباعة.', 'warning');
      return;
    }
    setPrintPreviewStudents(printableStudents);
    triggerNotification('تم إعداد معاينة كشف الطلاب الحالي. راجعها قبل الطباعة.', 'success');
  };

  return (
    <div 
      id="student-affairs-master-command-center"
      className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6"
      dir="rtl"
    >

      {/* ==========================================
          LUXURY GOLD METALLIC TOP HEADER
         ========================================== */}
      <div className="bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white rounded-3xl p-4 sm:p-5 border-2 border-[#d4af37]/40 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-20 bg-[#d4af37]/10 blur-3xl pointer-events-none" />
        
        {/* Module Title & Breadcrumbs */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#f7d174] to-[#c58a22] p-[2px] shadow-lg shadow-[#d4af37]/20 flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#2a1b10] flex items-center justify-center text-amber-300 font-black">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300/80 font-bold mb-0.5">
              <span className="cursor-pointer hover:underline" onClick={() => setActiveSection && setActiveSection('dashboard')}>الرئيسية</span>
              <span>‹</span>
              <span className="text-amber-100">شؤون الطلاب</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#ffe5a3] via-[#fce79a] to-[#d4af37] bg-clip-text text-transparent">
              منظومة شؤون الطلاب والأنشطة الأكاديمية
            </h1>
          </div>
        </div>

        {/* Center Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#2a1d13]/90 border border-[#d4af37]/40 p-1.5 rounded-2xl shadow-inner relative z-10 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('student_data')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'student_data' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>بيانات الطلاب</span>
          </button>

          <button 
            onClick={() => setActiveTab('guardians')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'guardians' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>أولياء الأمور</span>
          </button>

          <button 
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'documents' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>المستندات والملفات</span>
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'reports' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>التقارير والشهادات</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'settings' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>إعدادات التسجيل</span>
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 relative z-10">
          <button 
            onClick={handleExportExcel}
            disabled={isExportingStudents || !canExportStudents}
            aria-disabled={!canExportStudents}
            aria-busy={isExportingStudents}
            className="bg-[#2a1d13] border border-[#d4af37]/40 hover:border-[#f7d174] text-amber-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:scale-105 transition-all shadow cursor-pointer"
            title="تصدير بيانات الطلاب إلى ملف XLSX حقيقي"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{isExportingStudents ? 'جاري التصدير...' : 'تصدير XLSX'}</span>
          </button>

          <button 
            onClick={handlePrintList}
            className="bg-[#2a1d13] border border-[#d4af37]/40 hover:border-[#f7d174] text-amber-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:scale-105 transition-all shadow cursor-pointer"
            title="طباعة الكشف المعاين"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">طباعة الكشف</span>
          </button>

          <button 
            onClick={handleOpenAddModal}
            disabled={!canWriteStudents}
            aria-disabled={!canWriteStudents}
            className="bg-gradient-to-r from-[#9a6a1d] via-[#f7d174] to-[#c58a22] text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      </div>


      {/* ==========================================
          STATISTICS & KPI CARDS ROW (5 Metallic Cards)
         ========================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        
        {/* KPI 1: Total Students */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">إجمالي الطلاب المسجلين</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block mt-1">{totalCount.toLocaleString('ar-EG')}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">منتظمون بالدراسة</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#2a1a0e] text-amber-300 flex items-center justify-center border border-[#d4af37]/40 shadow-sm shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Active Students */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">الطلاب النشطون</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block mt-1">{activeCount.toLocaleString('ar-EG')}</span>
            <span className="text-[10px] font-bold text-slate-500 block mt-1">حالة القيد: نشط</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#2a1a0e] text-emerald-400 flex items-center justify-center border border-[#d4af37]/40 shadow-sm shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: New Registered */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">الطلاب الجدد (هذا العام)</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block mt-1">{newCount.toLocaleString('ar-EG')}</span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">دفعة 2024 - 2025</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#2a1a0e] text-amber-400 flex items-center justify-center border border-[#d4af37]/40 shadow-sm shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Suspended / Inactive */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">الموقوفون والمنسحبون</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block mt-1">{suspendedCount.toLocaleString('ar-EG')}</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full inline-block mt-1">موقوف / تحويل</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#2a1a0e] text-rose-400 flex items-center justify-center border border-[#d4af37]/40 shadow-sm shrink-0">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 5: Pending Documents */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-3.5 shadow-md transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-black text-slate-700 block">مستندات غير مكتملة</span>
            <span className="text-2xl font-black text-amber-700 font-mono tracking-tight block mt-1">{pendingDocsCount.toLocaleString('ar-EG')}</span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">متابعة الأوراق</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#2a1a0e] text-amber-400 flex items-center justify-center border border-[#d4af37]/40 shadow-sm shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

      </div>


      {/* ==========================================
          TAB CONTENT 1: STUDENT DATA & DATA GRID
         ========================================== */}
      {activeTab === 'student_data' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* SEARCH & FILTERS SIDEBAR (3/12) */}
          <div className="lg:col-span-3 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2a1a0e] text-amber-400 flex items-center justify-center">
                  <Filter className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-900">البحث المتقدم والتصفية</h3>
              </div>
              <button 
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Keyword Input */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الكلمة المفتاحية</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input 
                    type="text"
                    value={searchKeyword}
                    onChange={e => {
                      setSearchKeyword(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="ابحث بالاسم، رقم الطالب، الهوية..."
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 pr-9 pl-3 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* Stage Select */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">المرحلة الدراسية (سيُفعّل بعد اعتماد المصدر)</label>
                <select 
                  value={searchStage}
                  disabled
                  title="مصدر المرحلة الدراسية غير مثبت في العقد الكانوني الحالي"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                >
                  <option value="all">غير متاح حاليًا</option>
                </select>
              </div>

              {/* Grade Select */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الصف الدراسي (سيُفعّل بعد اعتماد المصدر)</label>
                <select 
                  value={searchGrade}
                  disabled
                  title="مصدر الصف الدراسي غير مثبت في العقد الكانوني الحالي"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                >
                  <option value="all">غير متاح حاليًا</option>
                </select>
              </div>

              {/* Section Select */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الشعبة / الفصل</label>
                <select 
                  value={searchClass}
                  onChange={e => {
                    setSearchClass(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                >
                  <option value="all">جميع الشعب والصفوف</option>
                  <option value="أ">شعبة أ</option>
                  <option value="ب">شعبة ب</option>
                  <option value="ج">شعبة ج</option>
                  <option value="د">شعبة د</option>
                </select>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">حالة القيد الدراسية</label>
                <select 
                  value={searchStatus}
                  onChange={e => {
                    setSearchStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="active">نشط ومنتظم</option>
                  <option value="suspended">موقوف القيد</option>
                  <option value="inactive">منسحب / منقول</option>
                </select>
              </div>

              {/* Quick Actions Card */}
              <div className="pt-2 border-t border-amber-900/10 space-y-2">
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  disabled={!canWriteStudents}
                  aria-disabled={!canWriteStudents}
                  className="w-full py-2 bg-[#2a1a0e] text-amber-200 hover:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-[#d4af37]/40 shadow hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>استيراد طلاب من Excel</span>
                </button>
              </div>

            </div>
          </div>

          {/* MAIN DATA GRID TABLE (9/12) */}
          <div className="lg:col-span-9 bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4">
            
            {/* Table Header Controls & Batch Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-900/10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-900">
                  سجل الطلاب ({totalCount.toLocaleString('ar-EG')} طالب)
                </span>
                
                {selectedStudentIds.length > 0 && (
                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                    تم تحديد {selectedStudentIds.length} طالب
                  </span>
                )}
              </div>

              {/* Batch Action Buttons */}
              {selectedStudentIds.length > 0 ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsTransferModalOpen(true)}
                    disabled={!canWriteStudents}
                    aria-disabled={!canWriteStudents}
                    className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>نقل / ترقية المحددين</span>
                  </button>

                  <button 
                    onClick={handlePrintList}
                    className="bg-[#2a1a0e] text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة بطاقات المحددين</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>ترتيب حسب:</span>
                  <button 
                    onClick={() => {
                      setSortColumn('name');
                      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-1 rounded-lg border text-[11px] ${sortColumn === 'name' ? 'bg-[#2a1a0e] text-amber-300 border-[#d4af37]' : 'bg-white text-slate-700 border-slate-300'}`}
                  >
                    الاسم {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                  <button 
                    onClick={() => {
                      setSortColumn('code');
                      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-1 rounded-lg border text-[11px] ${sortColumn === 'code' ? 'bg-[#2a1a0e] text-amber-300 border-[#d4af37]' : 'bg-white text-slate-700 border-slate-300'}`}
                  >
                    رقم الطالب {sortColumn === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              )}
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto rounded-2xl border border-amber-900/10 shadow-xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <th className="p-3 w-10 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedStudentIds.length === paginatedStudents.length && paginatedStudents.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded border-amber-400 bg-amber-950 text-amber-400 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">رقم الطالب</th>
                    <th className="p-3">اسم الطالب رباعي</th>
                    <th className="p-3">الصف / الشعبة</th>
                    <th className="p-3">ولي الأمر والتواصل</th>
                    <th className="p-3">الحالة الدراسية</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white">
                  {isLoadingStudents ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-amber-800 font-bold">
                        <div className="inline-flex items-center gap-2" role="status" aria-live="polite">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          جاري جلب السجلات من قاعدة البيانات...
                        </div>
                      </td>
                    </tr>
                   ) : paginatedStudents.length === 0 ? (
                     <tr>
                       <td colSpan={7} className="p-8 text-center font-bold">
                         {studentLoadError ? (
                           <div role="alert" className="text-rose-800">
                             {studentLoadError}
                           </div>
                         ) : (
                           <div role="status" className="text-slate-500">
                             {visibleQueryCount === 0 && !searchKeyword.trim() && searchStatus === 'all' && searchClass === 'all'
                               ? 'لا توجد سجلات طلاب محفوظة لهذا النطاق.'
                               : 'لا توجد نتائج مطابقة لخيارات التصفية الحالية'}
                           </div>
                         )}
                       </td>
                     </tr>
                  ) : (
                    paginatedStudents.map((st, idx) => {
                      const isSelected = selectedStudentIds.includes(st.id);
                      const codeDisplay = st.studentCode || st.academicId || 'غير متوفر';
                      const isSuspended = st.status === 'suspended';

                      return (
                        <tr 
                          key={st.id} 
                          className={`hover:bg-amber-50/60 transition-colors ${isSelected ? 'bg-amber-100/60' : ''}`}
                        >
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(st.id)}
                              className="rounded border-slate-300 text-amber-700 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono font-black text-amber-900">
                            {codeDisplay}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#2a1a0e] border border-[#d4af37]/50 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                                {st.name.slice(0, 1)}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 hover:text-amber-800 cursor-pointer" onClick={() => handleOpenViewStudent(st)}>
                                  {st.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-700">
                            <div>{st.classroom || 'غير محدد'}</div>
                            <div className="text-[10px] text-amber-800 font-extrabold">شعبة {st.section || 'غير محددة'}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{st.parentName || 'غير مرتبط'}</div>
                          </td>
                          <td className="p-3">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                موقوف
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                نشط
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => handleOpenViewStudent(st)}
                                title="عرض الملف والبطاقة"
                                className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button 
                                onClick={() => handleOpenEditModal(st)}
                                disabled={!canWriteStudents}
                                aria-disabled={!canWriteStudents}
                                title="تعديل البيانات"
                                className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button 
                                onClick={() => handleToggleSuspendStudent(st)}
                                title={isSuspended ? 'إعادة القيد' : 'إيقاف القيد'}
                                disabled={isSuspended || !canWriteStudents}
                                aria-disabled={isSuspended || !canWriteStudents}
                                className={`p-1.5 rounded-lg border transition-all ${isSuspended ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-rose-50 text-rose-800 border-rose-300 cursor-pointer'}`}
                              >
                                {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              </button>

                              <button 
                                onClick={() => handleDeleteStudent(st)}
                                title="حذف"
                                disabled={!canDeleteStudents}
                                aria-disabled={!canDeleteStudents}
                                className="p-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-rose-100 hover:text-rose-800 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-2">
              <div className="text-slate-600 font-extrabold">
                {visibleQueryCount === 0 ? 'لا توجد سجلات' : `عرض ${((studentQueryMeta.page - 1) * studentQueryMeta.limit) + 1} إلى ${Math.min(studentQueryMeta.page * studentQueryMeta.limit, visibleQueryCount)} من إجمالي ${visibleQueryCount} طالب`}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-bold">صفوف بالصفحة:</span>
                  <select 
                    value={rowsPerPage}
                    onChange={e => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-300 text-slate-900 rounded-lg px-2 py-1 font-bold outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-amber-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 bg-[#2a1a0e] text-amber-300 rounded-lg font-black font-mono">
                    {studentQueryMeta.page} / {studentQueryMeta.totalPages}
                  </span>

                  <button 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!studentQueryMeta.hasNext}
                    className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-amber-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}


      {/* ==========================================
          TAB CONTENT 2: GUARDIANS & PARENT RELATIONS
         ========================================== */}
      {activeTab === 'guardians' && (
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
            <div>
              <h3 className="text-sm font-black text-slate-900">سجل أولياء الأمور ووسائل الاتصال</h3>
              <p className="text-xs text-slate-500 font-bold">إدارة ملفات وربط الطلاب بأولياء الأمور</p>
            </div>
            <button
              type="button"
              disabled
              title="ربط ولي الأمر غير متاح حاليًا حتى اعتماد مسار API"
              className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border border-slate-300 shadow cursor-not-allowed"
              aria-disabled="true"
            >
              <UserPlus className="w-4 h-4" />
              <span>ربط ولي أمر (قريبًا)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {students.filter(st => Boolean(st.parentName || st.parentPhone)).slice(0, 6).map((st) => (
              <div key={st.id} className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-xs hover:border-[#d4af37] transition-all space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-black flex items-center justify-center text-sm">
                    {st.parentName ? st.parentName.slice(0, 1) : 'أ'}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{st.parentName || 'غير مرتبط'}</h4>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">صلة القرابة: {(st as any).guardianRelation || 'غير محددة'}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 font-bold pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-700" />
                    <span>الطلاب المرتبطون: <strong className="text-slate-900">{st.name}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled
                    title="الاتصال المباشر غير متاح حاليًا حتى اعتماد مزوّد اتصالات"
                    className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-not-allowed"
                    aria-disabled="true"
                  >
                    <Phone className="w-3 h-3" />
                    <span>اتصال</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    title="إرسال الرسائل غير متاح حاليًا حتى اعتماد مزوّد SMS"
                    className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-not-allowed"
                    aria-disabled="true"
                  >
                    <Mail className="w-3 h-3" />
                    <span>رسالة</span>
                  </button>
                </div>
              </div>
            ))}
            {students.filter(st => Boolean(st.parentName || st.parentPhone)).length === 0 && (
              <div className="md:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                لا توجد روابط أولياء أمور مؤكدة في قاعدة البيانات لهذا النطاق.
              </div>
            )}
          </div>
        </div>
      )}


      {/* ==========================================
          TAB CONTENT 3: DOCUMENTS & ATTACHMENTS
         ========================================== */}
      {activeTab === 'documents' && (
        <StudentDocumentsPortal students={students} currentRole={currentRole} triggerNotification={triggerNotification} />
      )}


      {/* ==========================================
          TAB CONTENT 4: REPORTS & CERTIFICATES
         ========================================== */}
      {activeTab === 'reports' && (
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="pb-3 border-b border-amber-900/10">
            <h3 className="text-sm font-black text-slate-900">مركز التقارير والبطاقات والشهادات</h3>
            <p className="text-xs text-slate-500 font-bold">طباعة وإصدار المستندات الرسمية للطلاب والصفوف</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs hover:border-[#d4af37] transition-all space-y-3 cursor-pointer" onClick={handlePrintList}>
              <div className="w-10 h-10 rounded-xl bg-[#2a1a0e] text-amber-300 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900">كشوفات أسماء الطلاب بالصفوف</h4>
              <p className="text-[10px] text-slate-500 font-bold">طباعة وتصدير القوائم الرسمية للمدرسين والإدارة</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 opacity-75">
              <div className="w-10 h-10 rounded-xl bg-[#2a1a0e] text-amber-300 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-700">بطاقات الهوية المدرسية (قريبًا)</h4>
              <p className="text-[10px] text-slate-500 font-bold">تحتاج خدمة إصدار موثقة وQR مرتبطًا بالسجل الدائم.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 opacity-75">
              <div className="w-10 h-10 rounded-xl bg-[#2a1a0e] text-amber-300 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-700">شهادات القيد (قريبًا)</h4>
              <p className="text-[10px] text-slate-500 font-bold">تحتاج خدمة إصدار وتوقيع إلكتروني معتمد قبل الإتاحة.</p>
            </div>
          </div>
        </div>
      )}


      {/* ==========================================
          TAB CONTENT 5: REGISTRATION SETTINGS
         ========================================== */}
      {activeTab === 'settings' && (
        <div className="bg-gradient-to-b from-[#fffefc] to-[#f8f3ea] border-2 border-[#d4af37]/30 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="pb-3 border-b border-amber-900/10">
            <h3 className="text-sm font-black text-slate-900">إعدادات التسجيل والترقيم التلقائي</h3>
            <p className="text-xs text-slate-500 font-bold">تحديد صيغ الأرقام الأكاديمية وشروط القيد والقبول</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-slate-800 font-black">نموذج الترقيم التلقائي للطالب</label>
              <input type="text" value="يُدار من الخادم" readOnly className="w-full bg-slate-100 border border-slate-300 p-2.5 rounded-xl text-xs font-mono text-slate-500" />
              <p className="text-[10px] text-slate-500">يتكون الترقيم من السنة والمسلسل التلقائي</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-slate-800 font-black">حد الأقصى للطلاب بالفصل الواحد</label>
              <input type="text" value="غير معتمد" readOnly className="w-full bg-slate-100 border border-slate-300 p-2.5 rounded-xl text-xs text-slate-500" />
              <p className="text-[10px] text-slate-500">تنبيه عند التجاوز أثناء التوزيع في الفصول</p>
            </div>
          </div>
        </div>
      )}


      {/* ==========================================
          MODAL 1: ADD / EDIT STUDENT WIZARD
         ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#fffefc] text-slate-900 border-2 border-[#d4af37] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#9a6a1d] via-[#f7d174] to-[#c58a22] p-[1.5px] flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-slate-950" />
                </div>
                <h3 className="text-base font-black text-amber-200">
                  {isEditMode ? `تعديل بيانات الطالب: ${formData.fullName}` : 'تسجيل طالب جديد في النظام'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bg-[#f5eeea] px-6 pt-3 border-b border-amber-900/10 flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'basic', label: 'البيانات الأساسية' },
                { id: 'guardian', label: 'بيانات ولي الأمر' },
                { id: 'extra', label: 'بيانات إضافية' },
                { id: 'docs', label: 'المستندات' },
                { id: 'notes', label: 'ملاحظات وتوصيات' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-t-xl text-xs font-black transition-all ${
                    modalTab === tab.id 
                      ? 'bg-gradient-to-r from-[#9a6a1d] to-[#d4af37] text-slate-950 shadow-md' 
                      : 'bg-white/60 text-slate-700 hover:bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body Form */}
            <div className="p-6 space-y-4">
              {modalTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  {/* Photo Frame */}
                  <div className="md:col-span-1 flex flex-col items-center space-y-3">
                    <label className="text-xs font-bold text-slate-700">الصورة الشخصية</label>
                    <div className="w-36 h-44 rounded-2xl bg-amber-50 border-2 border-dashed border-[#d4af37] p-2 flex flex-col items-center justify-center relative shadow-inner">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Student" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="flex flex-col items-center text-amber-800 space-y-1">
                          <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-[#d4af37] flex items-center justify-center">
                            <User className="w-10 h-10 text-amber-900" />
                          </div>
                          <span className="text-[10px] font-bold">لم ترفع صورة</span>
                        </div>
                      )}
                    </div>
                    <button 
                      type="button"
                      disabled
                      aria-disabled="true"
                      title="رفع صورة الطالب غير متاح حتى اعتماد مسار التخزين الموثوق"
                      className="bg-slate-200 text-slate-500 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 border border-slate-300 cursor-not-allowed"
                    >
                      <Camera className="w-4 h-4" />
                      <span>رفع صورة (غير متاح)</span>
                    </button>
                  </div>

                  {/* Input Fields */}
                  <div className="md:col-span-3 space-y-4 text-xs">
                    
                    {/* Row 1: Full Name & Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-800 font-extrabold mb-1">الاسم رباعي <span className="text-rose-600">*</span></label>
                        <input 
                          type="text"
                          value={formData.fullName}
                          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="أدخل الاسم رباعي بالكامل"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-800 font-extrabold mb-1">رقم الطالب الأكاديمي</label>
                        <input 
                          type="text"
                          value={formData.studentCode}
                          onChange={e => setFormData({ ...formData, studentCode: e.target.value })}
                          className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs font-bold font-mono text-amber-900 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-extrabold mb-1">الاسم المفضل <span className="text-slate-500">(اختياري)</span></label>
                      <input
                        type="text"
                        value={formData.preferredName}
                        onChange={e => setFormData({ ...formData, preferredName: e.target.value })}
                        placeholder="الاسم الذي يفضّل الطالب ظهوره به"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                      />
                    </div>

                    {/* Row 2: National ID, Gender, Birth Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-800 font-extrabold mb-1">رقم الهوية الوطنية / الإقامة <span className="text-slate-500">(غير مدعوم حاليًا)</span></label>
                        <input 
                          type="text"
                          value={formData.nationalId}
                          disabled
                          aria-describedby="student-national-id-support-note"
                          className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs font-bold font-mono text-slate-500 outline-none shadow-xs"
                        />
                        <p id="student-national-id-support-note" className="mt-1 text-[10px] font-bold text-slate-500">لا يتم حفظ هذا الحقل في عقد ملف الطالب الحالي.</p>
                      </div>

                      <div>
                        <label className="block text-slate-800 font-extrabold mb-1">الجنس</label>
                        <select 
                          value={formData.gender}
                          onChange={e => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                        >
                          <option value="ذكر">ذكر</option>
                          <option value="أنثى">أنثى</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-800 font-extrabold mb-1">تاريخ الميلاد</label>
                        <input 
                          type="date"
                          value={formData.birthDate}
                          onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-800 font-extrabold mb-1">حالة القيد <span className="text-rose-600">*</span></label>
                        <select
                          value={formData.status}
                          onChange={e => setFormData({ ...formData, status: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:border-[#9a6a1d] outline-none shadow-xs"
                        >
                          <option value="">اختر الحالة</option>
                          <option value="active">نشط ومنتظم</option>
                          <option value="suspended">موقوف القيد</option>
                          <option value="inactive">منسحب / منقول</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Stage, Grade, Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-800 font-extrabold mb-1">المرحلة الدراسية <span className="text-slate-500">(تُدار عبر الالتحاق)</span></label>
                        <select 
                          value={formData.stage}
                          disabled
                          className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-500 outline-none shadow-xs"
                        >
                          <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                          <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                          <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                          <option value="رياض الأطفال">رياض الأطفال</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-800 font-extrabold mb-1">الصف الدراسي <span className="text-slate-500">(يُدار عبر الالتحاق)</span></label>
                        <select 
                          value={formData.grade}
                          disabled
                          className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-500 outline-none shadow-xs"
                        >
                          <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                          <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                          <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
                          <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-800 font-extrabold mb-1">الشعبة / الفصل <span className="text-slate-500">(يُدار عبر الالتحاق)</span></label>
                        <select 
                          value={formData.classSection}
                          disabled
                          className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-500 outline-none shadow-xs"
                        >
                          <option value="أ">شعبة أ</option>
                          <option value="ب">شعبة ب</option>
                          <option value="ج">شعبة ج</option>
                        </select>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {modalTab === 'guardian' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-800 font-extrabold mb-1">اسم ولي الأمر رباعي</label>
                    <input 
                      type="text"
                      value={formData.parentName}
                      onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="أدخل اسم ولي الأمر"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-extrabold mb-1">رقم جوال ولي الأمر</label>
                    <input 
                      type="text"
                      value={formData.parentPhone}
                      onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="0500000000"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 font-mono outline-none shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-extrabold mb-1">صلة القرابة</label>
                    <select 
                      value={formData.parentRelation}
                      onChange={e => setFormData({ ...formData, parentRelation: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none shadow-xs"
                    >
                      <option value="أب">أب</option>
                      <option value="أم">أم</option>
                      <option value="عم">عم</option>
                      <option value="خال">خال</option>
                      <option value="جد">جد</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-bold text-slate-500 sm:col-span-2">
                    بيانات المهنة / جهة العمل لولي الأمر غير مدعومة في عقد الحفظ الحالي، لذلك لا تُعرض كحقل قابل للتحرير.
                  </div>
                </div>
              )}

              {modalTab !== 'basic' && modalTab !== 'guardian' && (
                <div className="p-8 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  لم يتم حفظ هذه البيانات بعد. احفظ السجل أولاً لتأكيدها.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f5eeea] border-t border-amber-900/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-black transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {!isEditMode && (
                  <button 
                    type="button"
                    onClick={() => handleSaveStudent(true)}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border-2 border-[#9a6a1d] text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs font-black transition-all cursor-pointer"
                  >
                    حفظ وإضافة جديد
                  </button>
                )}

                <button 
                  type="button"
                  onClick={() => handleSaveStudent(false)}
                  disabled={!canWriteStudents}
                  aria-disabled={!canWriteStudents}
                  className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#9a6a1d] via-[#f7d174] to-[#c58a22] text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  حفظ الحركات
                </button>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ==========================================
          MODAL 2: VIEW STUDENT PROFILE & PRINT ID CARD
         ========================================== */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#fffefc] text-slate-900 border-2 border-[#d4af37] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            
            <div className="bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-amber-200">الملف الأكاديمي وبطاقة الطالب</h3>
              </div>
              <button onClick={() => setViewStudent(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Official ID Card Box (Printable) */}
               <div className="bg-gradient-to-br from-[#1c120c] via-[#2a1d13] to-[#120a04] text-white rounded-3xl p-5 border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/40 mb-4">
                  <div>
                    <h4 className="text-sm font-black text-amber-300">{selectedSchool.name || 'SchoolForManus'}</h4>
                    <span className="text-[9px] text-amber-100/70 font-mono">بطاقة تعريف طالب معتمدة</span>
                  </div>
                  <span className="text-xs font-black font-mono text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-400/30">
                    {viewStudent.studentCode || viewStudent.academicId || 'غير متوفر'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-24 rounded-2xl bg-[#2a1a0e] border-2 border-[#d4af37] overflow-hidden flex items-center justify-center shrink-0">
                    {viewStudent.avatarUrl ? (
                      <img src={viewStudent.avatarUrl} alt={viewStudent.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-amber-300">{viewStudent.name.slice(0, 1)}</span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <h3 className="text-base font-black text-[#ffe5a3]">{viewStudent.name}</h3>
                   </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="البيانات الكانونية للطالب">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block text-[10px] font-bold text-slate-500">الاسم الكامل</span>
                    <span className="mt-1 block text-xs font-black text-slate-900">{viewStudent.name || 'غير متوفر'}</span>
                  </div>
                  {(viewStudent as any).preferredName ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <span className="block text-[10px] font-bold text-slate-500">الاسم المفضل</span>
                      <span className="mt-1 block text-xs font-black text-slate-900">{(viewStudent as any).preferredName}</span>
                    </div>
                  ) : null}
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block text-[10px] font-bold text-slate-500">رقم الطالب</span>
                    <span className="mt-1 block text-xs font-black text-slate-900 font-mono">{viewStudent.studentCode || viewStudent.academicId || 'غير متوفر'}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block text-[10px] font-bold text-slate-500">تاريخ الميلاد</span>
                    <span className="mt-1 block text-xs font-black text-slate-900">{viewStudent.birthDate || 'غير متوفر'}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block text-[10px] font-bold text-slate-500">النوع</span>
                    <span className="mt-1 block text-xs font-black text-slate-900">{viewStudent.gender || 'غير متوفر'}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block text-[10px] font-bold text-slate-500">الجنسية</span>
                    <span className="mt-1 block text-xs font-black text-slate-900">{viewStudent.nationality || 'غير متوفر'}</span>
                  </div>
                </div>

               <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3" aria-labelledby="student-timeline-title">
                 <div className="flex items-center justify-between gap-3">
                   <div>
                     <h4 id="student-timeline-title" className="text-sm font-black text-slate-900">الخط الزمني للطالب</h4>
                     <p className="text-[10px] font-bold text-slate-500">سجل الأحداث الذي يعيده الخادم ضمن نطاق الجلسة الموثوقة</p>
                   </div>
                   <button
                     type="button"
                     onClick={() => void loadStudentTimeline(viewStudent)}
                     disabled={timelineStatus === 'loading'}
                     className="rounded-xl border border-amber-400 bg-white px-3 py-2 text-xs font-black text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                   >
                     <Clock className="inline-block ml-1 h-3.5 w-3.5" />
                     {timelineStatus === 'loading' ? 'جاري التحميل...' : timelineStudent?.id === viewStudent.id ? 'تحديث الخط الزمني' : 'عرض الخط الزمني'}
                   </button>
                 </div>

                 {timelineStudent?.id === viewStudent.id && timelineStatus === 'loading' && (
                   <div role="status" className="rounded-xl bg-white p-4 text-center text-xs font-bold text-slate-600">جاري تحميل الخط الزمني...</div>
                 )}

                 {timelineStudent?.id === viewStudent.id && timelineStatus === 'error' && (
                   <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                     <p>{timelineError}</p>
                     <button type="button" onClick={() => void loadStudentTimeline(viewStudent)} className="mt-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-[11px] font-black">إعادة المحاولة</button>
                   </div>
                 )}

                 {timelineStudent?.id === viewStudent.id && timelineStatus === 'empty' && (
                   <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs font-bold text-slate-500">لا توجد أحداث زمنية لهذا الطالب ضمن النطاق الحالي.</div>
                 )}

                 {timelineStudent?.id === viewStudent.id && timelineStatus === 'success' && (
                   <ol className="space-y-3" aria-label="أحداث الخط الزمني للطالب">
                     {timelineEvents.map(event => (
                       <li key={event.id} className="relative rounded-xl border border-slate-200 bg-white p-3 pr-4">
                         <div className="flex flex-wrap items-center justify-between gap-2">
                           <strong className="text-xs text-slate-900">{event.title}</strong>
                           <time className="text-[10px] font-mono text-slate-500">{event.date ? new Date(event.date).toLocaleString('ar') : '—'}</time>
                         </div>
                         <p className="mt-1 text-[11px] leading-5 text-slate-600">{event.description}</p>
                         <p className="mt-1 text-[10px] font-bold text-amber-800">بواسطة: {event.user || 'النظام الآلي'}</p>
                       </li>
                     ))}
                   </ol>
                 )}
               </div>

             </div>

            <div className="bg-[#f5eeea] border-t border-amber-900/10 px-6 py-4 flex items-center justify-between">
              <button onClick={() => setViewStudent(null)} className="px-5 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs">إغلاق</button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="خدمة طباعة البطاقة الرسمية غير متاحة حتى اعتماد خدمة الطباعة"
                className="px-6 py-2 rounded-xl bg-slate-200 text-slate-500 font-black text-xs flex items-center gap-1.5 border border-slate-300 cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة البطاقة الرسمية (غير متاحة)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: VISIBLE PRINT PREVIEW
         ========================================== */}
      {printPreviewStudents && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="معاينة كشف الطلاب">
          <div className="bg-[#fffefc] text-slate-900 border-2 border-[#d4af37] rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-amber-200">معاينة كشف الطلاب</h3>
                <p className="mt-1 text-[10px] font-bold text-amber-100/80">معاينة الصفوف المحملة والمفلترة حاليًا — ليست تقريرًا رسميًا شاملًا</p>
              </div>
              <button type="button" onClick={() => setPrintPreviewStudents(null)} aria-label="إغلاق معاينة كشف الطلاب" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#d4af37] pb-3">
                <div>
                  <h2 className="text-lg font-black text-[#1c120c]">{selectedSchool.name || 'SchoolForManus'}</h2>
                  <p className="text-xs font-bold text-slate-600">إدارة شؤون الطلاب والنتائج الأكاديمية</p>
                </div>
                <div className="text-left text-xs font-bold text-slate-600">
                  <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</div>
                  <div>إجمالي الكشف: {printPreviewStudents.length} طالب</div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-300">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-[#2a1d13] text-[#ffe5a3]">
                    <tr>
                      <th className="p-3 border border-slate-500">#</th>
                      <th className="p-3 border border-slate-500">رقم الطالب</th>
                      <th className="p-3 border border-slate-500">اسم الطالب رباعي</th>
                      <th className="p-3 border border-slate-500">الصف / الشعبة</th>
                      <th className="p-3 border border-slate-500">ولي الأمر</th>
                      <th className="p-3 border border-slate-500">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printPreviewStudents.map((student, index) => {
                      const statusLabel = student.status === 'suspended'
                        ? 'موقوف'
                        : student.status === 'inactive' || student.status === 'withdrawn'
                          ? 'منسحب / منقول'
                          : 'نشط';
                      return (
                        <tr key={student.id} className="odd:bg-amber-50/40">
                          <td className="p-3 border border-slate-200 text-center">{index + 1}</td>
                          <td className="p-3 border border-slate-200 text-center font-mono font-black">{student.studentCode || student.academicId || 'غير متوفر'}</td>
                          <td className="p-3 border border-slate-200 font-black">{student.name}</td>
                          <td className="p-3 border border-slate-200 text-center">{student.classroom || 'غير محدد'} ({student.section || 'أ'})</td>
                          <td className="p-3 border border-slate-200">{student.parentName || 'غير مرتبط'}</td>
                          <td className="p-3 border border-slate-200 text-center">{statusLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#f5eeea] border-t border-amber-900/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button type="button" onClick={() => setPrintPreviewStudents(null)} className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-black">إغلاق المعاينة</button>
              <button type="button" onClick={() => { window.print(); triggerNotification('تم إرسال المعاينة إلى أمر الطباعة.', 'info'); }} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9a6a1d] to-[#d4af37] text-slate-950 text-xs font-black flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" />
                طباعة من المعاينة
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ==========================================
          MODAL 3: BATCH TRANSFER / PROMOTION WIZARD
         ========================================== */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fffefc] text-slate-900 border-2 border-[#d4af37] rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-amber-900/10">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-800" />
                <h3 className="text-sm font-black text-slate-900">نقل وترقية الطلاب المحددين</h3>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">المرحلة الدراسية المستهدفة</label>
                <select 
                  value={transferTargetStage}
                  onChange={e => setTransferTargetStage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl"
                >
                  <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                  <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الصف المستهدف</label>
                <select 
                  value={transferTargetGrade}
                  onChange={e => setTransferTargetGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl"
                >
                  <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                  <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                  <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الشعبة المستهدفة</label>
                <select 
                  value={transferTargetSection}
                  onChange={e => setTransferTargetSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl"
                >
                  <option value="أ">شعبة أ</option>
                  <option value="ب">شعبة ب</option>
                  <option value="ج">شعبة ج</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">إلغاء</button>
              <div className="space-y-2 text-right">
                <p role="alert" className="text-[10px] leading-5 text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  النقل الجماعي غير متاح حاليًا. سيُفتح بعد اعتماد معاملة ذرية واحدة تمنع الحفظ الجزئي وتدعم idempotency والتدقيق.
                </p>
                <button
                  onClick={handleBatchTransfer}
                  disabled
                  aria-disabled="true"
                  className="px-6 py-2 bg-slate-300 text-slate-500 font-black rounded-xl text-xs cursor-not-allowed"
                >
                  النقل الجماعي غير متاح حاليًا
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ==========================================
          MODAL 4: EXCEL IMPORT AVAILABILITY
         ========================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fffefc] text-slate-900 border-2 border-[#d4af37] rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-amber-900/10">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-800" />
                <h3 className="text-sm font-black text-slate-900">استيراد قائمة الطلاب من Excel</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            <div className="border-2 border-dashed border-[#d4af37] rounded-2xl p-8 text-center bg-amber-50/50 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-amber-800 mx-auto" />
              <div className="text-xs font-black text-slate-800">استيراد Excel غير متاح حاليًا</div>
              <div className="text-[10px] leading-5 text-slate-600">
                لم يتم تفعيل مسار استيراد قانوني يحفظ البيانات حتى الآن. لم يتم استلام ملف أو تعديل أي طالب.
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-200">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">إغلاق</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
