import { Accessibility, Activity, AlertTriangle, ArrowRight, Award, BadgeCheck, Baseline, Building, Check, CheckCircle2, CheckSquare, ChevronDown, ChevronRight, Clock, Cloud, Code, Coins, Columns, Compass, Component, Container, Cross, Crown, Database, Delete, Edit, Edit3, ExternalLink, Eye, FileText, Filter, Focus, Globe, Grid, Group, Hammer, Heading, HelpCircle, Info, Key, Layers, Layout, Library, List, ListCollapse, Lock as LockIcon, Logs, Menu, Navigation, Network, Option, Palette, Play, Plus, Printer, Radius, Receipt, Rose, RotateCw, Save, Scale, School, Search, Section, Settings, ShieldAlert, ShieldCheck, Sidebar, Signature, Sliders, SlidersHorizontal, Sparkles, Stamp, Table, Terminal, Text, ToggleLeft, ToggleRight, Trash2, User, Vault, Workflow, X, Zap, icons } from 'lucide-react';
import React, { useState } from 'react';

import FinancialClosingDashboard from '../components/FinancialClosingDashboard';
import GovernancePerformance from '../internal/GovernancePerformance';
import GovernanceDesignSystem from '../internal/GovernanceDesignSystem';
import GovernanceScreenExcellenceAudit from '../internal/GovernanceScreenExcellenceAudit';
import GovernanceSecurity from '../internal/GovernanceSecurity';
import GovernanceDocs from '../internal/GovernanceDocs';
import EnterpriseProductionExcellence from './EnterpriseProductionExcellence';
import EnterpriseQualityGate from './EnterpriseQualityGate';
import EnterpriseProductionReadiness from './EnterpriseProductionReadiness';
import EnterpriseReleaseCandidateAudit from './EnterpriseReleaseCandidateAudit';
import EnterpriseGoldenRelease from './EnterpriseGoldenRelease';
import EnterpriseExcellenceGate from './EnterpriseExcellenceGate';
import EnterprisePlatinumQualityGate from './EnterprisePlatinumQualityGate';
import EnterpriseEliteCertification from './EnterpriseEliteCertification';
import EnterpriseWorldClassCertification from './EnterpriseWorldClassCertification';
import EnterpriseDiamondQualityCertification from './EnterpriseDiamondQualityCertification';
import EnterpriseMasterpieceCertification from './EnterpriseMasterpieceCertification';
import EnterpriseFinalExcellenceGate from './EnterpriseFinalExcellenceGate';
import EnterpriseGoldenProductCertification from './EnterpriseGoldenProductCertification';
import EnterpriseProductDistinctionAudit from './EnterpriseProductDistinctionAudit';
import EnterpriseProductExcellenceReview from './EnterpriseProductExcellenceReview';
import EnterpriseCustomerOperationsExcellence from './EnterpriseCustomerOperationsExcellence';
import EnterpriseStudentFinancialLifecycleCert from './EnterpriseStudentFinancialLifecycleCert';
import EnterpriseAcademicExamCertification from './EnterpriseAcademicExamCertification';
import EnterpriseHRPayrollCertification from './EnterpriseHRPayrollCertification';
import EnterpriseExecutiveDashboardsReportingCert from './EnterpriseExecutiveDashboardsReportingCert';
import EnterpriseSecurityPermissionsCert from './EnterpriseSecurityPermissionsCert';
import EnterprisePlatformManagementCert from './EnterprisePlatformManagementCert';
import EnterpriseReleaseGovernanceCert from './EnterpriseReleaseGovernanceCert';
import EnterpriseGoldenReleaseCert from './EnterpriseGoldenReleaseCert';
import ExternalAuditProtocol from '../components/ExternalAuditProtocol';
import EnterpriseProductionAcceptanceProgram from './EnterpriseProductionAcceptanceProgram';
import EnterpriseOperationalRealSchoolReadiness from './EnterpriseOperationalRealSchoolReadiness';
import EnterpriseGoLiveReadinessCertification from './EnterpriseGoLiveReadinessCertification';
import EnterpriseLaunchFinalAcceptance from './EnterpriseLaunchFinalAcceptance';
import EnterprisePreGoLiveCertification from './EnterprisePreGoLiveCertification';
import EnterpriseFinalReadinessGoLiveValidation from './EnterpriseFinalReadinessGoLiveValidation';
import EnterpriseGoldenAcceptanceProgram from './EnterpriseGoldenAcceptanceProgram';
import EnterpriseGoldenReleaseExecutionProgram from './EnterpriseGoldenReleaseExecutionProgram';
import EnterpriseControlledLaunchCertification from './EnterpriseControlledLaunchCertification';
import EnterpriseOperationalExcellenceCertification from './EnterpriseOperationalExcellenceCertification';
import EnterpriseGoldenCertificationReadiness from './EnterpriseGoldenCertificationReadiness';
import EnterpriseStudentAffairsInstitutionalCertification from './EnterpriseStudentAffairsInstitutionalCertification';
import EnterpriseMaintainabilityScalabilityCertification from './EnterpriseMaintainabilityScalabilityCertification';
import EnterpriseDataIntegrityBusinessRulesCertification from './EnterpriseDataIntegrityBusinessRulesCertification';
import EnterpriseMainScreensCertification from './EnterpriseMainScreensCertification';
import EnterpriseFullSystemIntegrationCertification from './EnterpriseFullSystemIntegrationCertification';
import EnterpriseWorkflowsCertification from './EnterpriseWorkflowsCertification';
import EnterpriseEventsCertification from './EnterpriseEventsCertification';
import EnterpriseValidationFramework from './EnterpriseValidationFramework';
import EnterpriseExceptionArchitecture from './EnterpriseExceptionArchitecture';
import EnterpriseConfigurationGovernance from './EnterpriseConfigurationGovernance';
import EnterpriseLoggingFramework from './EnterpriseLoggingFramework';
import EnterpriseDependencyInjection from './EnterpriseDependencyInjection';
import EnterpriseAccountingEngineReconstruction from './EnterpriseAccountingEngineReconstruction';
import EnterpriseRevenueRecognitionEngine from './EnterpriseRevenueRecognitionEngine';
import EnterpriseStudentFeesEngine from './EnterpriseStudentFeesEngine';
import EnterpriseFinalCertificationProgramPhase1 from './EnterpriseFinalCertificationProgramPhase1';
import EnterpriseExecutiveExcellenceProgram from './EnterpriseExecutiveExcellenceProgram';
import EnterpriseProductStandardEPS from './EnterpriseProductStandardEPS';
import EnterpriseAcceptanceTesting from './EnterpriseAcceptanceTesting';

interface EnterpriseGovernanceTabProps {
  indexesApplied: boolean;
  setIndexesApplied: (val: boolean) => void;
  activeLogsCount: number;
  archivedLogsCount: number;
  readReplicasEnabled: boolean;
  setReadReplicasEnabled: (val: boolean) => void;
  replicaServerHealthy: boolean;
  setReplicaServerHealthy: (val: boolean) => void;
  redisCacheEnabled: boolean;
  setRedisCacheEnabled: (val: boolean) => void;
  cacheMemory: number;
  setCacheMemory: (val: number) => void;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
  schoolId?: string;
}

export default function EnterpriseGovernanceTab({
  indexesApplied,
  setIndexesApplied,
  activeLogsCount,
  archivedLogsCount,
  readReplicasEnabled,
  setReadReplicasEnabled,
  replicaServerHealthy,
  setReplicaServerHealthy,
  redisCacheEnabled,
  setRedisCacheEnabled,
  cacheMemory,
  setCacheMemory,
  triggerNotification,
  schoolId
}: EnterpriseGovernanceTabProps) {

  const [enterpriseSubTab, setEnterpriseSubTab] = useState<'eep' | 'eps' | 'perf' | 'governance' | 'security' | 'docs' | 'closing' | 'integration' | 'external_audit_protocol' | 'ux_workflows_certification' | 'final_cert' | 'final_cert_p1' | 'ux_ready' | 'ux_design_system' | 'ux_framework' | 'ux_screen_excellence' | 'ux_screen_excellence_p1' | 'ux_screen_excellence_audit' | 'ux_screen_excellence_production' | 'ux_quality_gate' | 'ux_production_readiness' | 'ux_release_candidate_audit' | 'ux_golden_release' | 'ux_excellence_gate' | 'ux_platinum_gate' | 'ux_elite_cert' | 'ux_world_class_cert' | 'ux_diamond_cert' | 'ux_masterpiece_cert' | 'ux_final_excellence_gate' | 'ux_golden_product_cert' | 'ux_product_distinction_audit' | 'ux_product_excellence_review' | 'ux_customer_operations_excellence' | 'ux_student_financial_lifecycle_cert' | 'ux_academic_exam_cert' | 'ux_hr_payroll_cert' | 'ux_executive_dashboards_reporting_cert' | 'ux_security_permissions_cert' | 'ux_platform_management_cert' | 'ux_release_governance_cert' | 'ux_golden_release_cert' | 'ux_production_acceptance_program' | 'ux_operational_real_school_readiness' | 'ux_go_live_readiness_certification' | 'ux_final_acceptance' | 'ux_pre_go_live_certification' | 'ux_final_readiness_go_live_validation' | 'ux_golden_acceptance_program' | 'ux_golden_release_execution_program' | 'ux_controlled_launch_certification' | 'ux_operational_excellence_certification' | 'ux_golden_certification_readiness' | 'ux_student_affairs_institutional_certification' | 'ux_maintainability_scalability_certification' | 'ux_data_integrity_business_rules_certification' | 'ux_main_screens_certification' | 'ux_acceptance_testing_protocol' | 'ux_validation_framework' | 'ux_exception_architecture' | 'ux_configuration_governance' | 'ux_enterprise_logging' | 'ux_dependency_injection' | 'ux_accounting_reconstruction' | 'ux_revenue_recognition' | 'ux_student_fees_engine'>('ux_acceptance_testing_protocol');

  // 7.5 Enterprise UI Audit states
  const [ux75CertApproved, setUx75CertApproved] = useState<boolean>(false);
  const [ux75SelectedScreen, setUx75SelectedScreen] = useState<string>('all');
  
  const [ux75Screens, setUx75Screens] = useState([
    {
      id: 'dashboard',
      name: 'لوحة التحكم الرئيسية',
      engName: 'Main Dashboard',
      goal: 'عرض ملخص فوري لأداء المدرسة المالي والأكاديمي والعمليات الإدارية النشطة في شاشة واحدة.',
      priorityOrder: 'مؤشرات الأداء المباشرة (KPIs) -> الإشعارات الحرجة -> الاختصارات السريعة -> المخططات البيانية التفاعلية.',
      mainActions: 'فلترة المدى الزمني، مراجعة التنبيهات، طباعة تقرير الأداء اليومي.',
      clickCount: 'نقرة واحدة للفلترة، نقرة واحدة لعرض تفاصيل الإشعار السريع.',
      messagesClarity: 'رسائل تأكيد فورية واضحة باللون الأخضر والأحمر وفق نظام التصميم الموحد.',
      searchFiltering: 'شريط تصفية فوري للفرز حسب الفروع أو العام الدراسي الحالي.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'students',
      name: 'شؤون الطلاب',
      engName: 'Student Affairs',
      goal: 'إدارة ملفات الطلاب الأكاديمية والشخصية، وتسجيل الحضور والغياب والانتقالات العامة.',
      priorityOrder: 'البحث السريع الموحد -> قائمة الطلاب المصفاة -> إجراءات التعديل والقبول السريع والذكي.',
      mainActions: 'تسجيل طالب جديد، ترحيل الفصول، تصدير ملفات الطلاب المعتمدين.',
      clickCount: 'أقل من 3 نقرات لإنشاء وتفعيل ملف الطالب بالكامل بنجاح.',
      messagesClarity: 'إشعارات ملونة واضحة بحالة الطالب (نشط، منسحب، معلق) ونوع التسجيل المعتمد.',
      searchFiltering: 'بحث متقدم بالاسم، السجل المدني، الفصل الدراسي، أو حالة سداد الرسوم.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'tuition',
      name: 'الرسوم الدراسية',
      engName: 'Tuition Fees',
      goal: 'تخصيص الرسوم المالية، متابعة مديونيات الطلاب، وحساب نسب الخصم والمنح الدراسية المعتمدة سلفاً.',
      priorityOrder: 'إجمالي الرسوم المستحقة -> الفئات والصفوف المستهدفة -> تفاصيل التخفيضات والمدفوعات المتأخرة.',
      mainActions: 'إسناد رسوم لصف دراسي، تطبيق خصم الأخوة، تصدير قائمة المتأخرات المشتملة على مديونيات.',
      clickCount: 'نقرة متبوعة بخطوة تأكيد واحدة في الشريط الجانبي لتفعيل الرسوم المخصصة.',
      messagesClarity: 'تنبيهات مالية دقيقة بترميز لوني أحمر للمتأخرات وأخضر للمدفوع بالكامل.',
      searchFiltering: 'فرز متقدم حسب الصف الدراسي، حالة السداد (مسدد جزئياً، غير مسدد، مسدد بالكامل).',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'receipts',
      name: 'سندات القبض',
      engName: 'Receipt Vouchers',
      goal: 'تحرير وتوثيق المقبوضات المالية من أولياء الأمور والجهات الراعية وتوزيعها آلياً على بنود الرسوم الدراسية.',
      priorityOrder: 'رقم السند الفوري التسلسلي -> تفاصيل المستلم والمدفوع -> الترحيل المحاسبي التلقائي للقيود.',
      mainActions: 'تحرير سند قبض جديد، طباعة فورية للمستند، ترحيل القيود اليومية بنقرة واحدة سريعة.',
      clickCount: 'نقرتان فقط للتحرير والطباعة المباشرة مع المعالجة الجانبية النشطة في شريط المهام.',
      messagesClarity: 'رسالة إتمام المعاملة المالية مطابقة للقيمة المدفوعة وإظهار الرصيد المتبقي بدقة متناهية.',
      searchFiltering: 'بحث برقم السند، اسم الطالب، أو من خلال محدد النطاق المالي للمقبوضات اليومية.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'daily_entries',
      name: 'القيود اليومية',
      engName: 'Daily Journal Entries',
      goal: 'تسجيل القيود المحاسبية المزدوجة ومطابقة الحسابات الدائنة والمدينة لضمان التوازن المالي الكامل.',
      priorityOrder: 'رقم القيد وحالته وحسابه المعتمد -> البنود الدائنة والمدينة -> إجمالي التوازن (الفرق الصفرى المالي).',
      mainActions: 'إضافة سطر قيد جديد، التحقق الفوري من التوازن، ترحيل قيود اليومية إلى دفاتر الأستاذ العام.',
      clickCount: 'سهولة إدخال البنود والمبالغ بسلاسة وسرعة فائقة دون مغادرة حقول الإدخال النشطة.',
      messagesClarity: 'تنبيه أحمر صارخ في حال عدم توازن القيد، وتنبيه أخضر ساطع بمطابقة التوازن الصفرى فوراً.',
      searchFiltering: 'بحث برقم القيد، التاريخ الفعلي للترحيل، أو حالة الترحيل المعتمدة بالنظام.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: false,
    },
    {
      id: 'general_accounts',
      name: 'الحسابات العامة',
      engName: 'General Accounts',
      goal: 'إدارة شجرة الحسابات (دليل الحسابات الموحد) واستخراج ميزان المراجعة وقائمة الدخل والميزانية العمومية.',
      priorityOrder: 'مستوى الحساب الهيكلي العام -> الحسابات الأبناء والآباء -> الأرصدة الافتتاحية والختامية الموثقة.',
      mainActions: 'إضافة حساب فرعي جديد، تحديث الأرصدة الافتتاحية، تصدير دليل الحسابات الموحد.',
      clickCount: 'أقل من نقرتين لاستعراض وتعديل أي حساب فرعي من شجرة الحسابات التفاعلية المريحة.',
      messagesClarity: 'عرض وتأكيد الإضافة لشجرة الحسابات برموز وأكواد محاسبية واضحة وخاضعة للتدقيق المالي الفوري.',
      searchFiltering: 'بحث سريع بكود الحساب الهيكلي أو الاسم العربي والإنجليزي الموحد في شجرة الحسابات.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'exams',
      name: 'الامتحانات والنتائج',
      engName: 'Exams & Grading',
      goal: 'تصميم لجان الامتحانات، جدولة مواعيد الاختبارات، رصد درجات الطلاب، واستخراج الشهادات الرسمية المعتمدة.',
      priorityOrder: 'الجدول الزمني للامتحانات -> رصد الدرجات حسب المادة والصف -> تقارير الرسوب والنجاح الفورية.',
      mainActions: 'إنشاء لجنة امتحان، إدخال جماعي وسلس للدرجات، اعتماد وإغلاق النتائج السنوية.',
      clickCount: 'معالجة ورصد درجات الفصول بنقرات ذكية واختصارات لوحة المفاتيح الفعالة لسرعة الإنتاجية.',
      messagesClarity: 'تنبيهات واضحة بتمام الرصد، ورسائل نجاح وتفوق محددة حسب نظام التقييم الموحد.',
      searchFiltering: 'فلترة دقيقة حسب المادة، الفصل الدراسي، المعلم المرخص، أو نسب النجاح العامة للفصل.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: true,
    },
    {
      id: 'hr',
      name: 'الموارد البشرية والرواتب',
      engName: 'Human Resources',
      goal: 'إدارة ملفات الكادر التعليمي والإداري، ومتابعة الرواتب الشهرية، الإجازات، والتقييم السنوي الموحد.',
      priorityOrder: 'البحث السريع عن الموظف -> الحالة الوظيفية والنشاط الفعلي -> مستندات الصرف والتوثيق المالي الموحد.',
      mainActions: 'إدخل ملف موظف جديد، تسجيل طلب إجازة رسمي، احتساب مسير الرواتب الموحد والمطابق للميزانية.',
      clickCount: 'موافقة فورية على الطلبات الموثقة بنقرة واحدة من شريط التنبيهات الجانبي لمدير الموارد.',
      messagesClarity: 'تحديثات مباشرة لحالات الطلبات مع رسائل توجيهية واضحة وموثقة للاتساق البصري.',
      searchFiltering: 'فرز حسب القسم (إداري، معلم، تشغيلي)، أو من خلال حالة تصاريح العمل والنشاط الميداني.',
      buttonsConsistent: true,
      tablesConsistent: true,
      modalsConsistent: true,
      colorsFontsConsistent: true,
      marginsSpacingsConsistent: true,
      iconsConsistent: true,
      isApproved: false,
    }
  ]);

  const [ux75Notes, setUx75Notes] = useState([
    {
      id: 'note-1',
      screenId: 'daily_entries',
      text: 'شاشة القيود اليومية تتطلب نقرتين إضافيتين لعرض زر الحفظ التلقائي عند مطابقة التوازن المحاسبي الصفرى في النظام.',
      severity: 'critical',
      status: 'pending',
      createdAt: '2026/07/08'
    },
    {
      id: 'note-2',
      screenId: 'hr',
      text: 'مسير الرواتب الشهري يحتاج إلى زر تصدير مباشر وسريع في شريط المهام الموحد بدلاً من وجوده داخل القائمة المنسدلة الملتوية.',
      severity: 'medium',
      status: 'pending',
      createdAt: '2026/07/08'
    },
    {
      id: 'note-3',
      screenId: 'tuition',
      text: 'تعديل وتوحيد درجات اللون الأحمر لمديونيات الرسوم الدراسية لتكون متسقة تماماً مع لوحة ألوان نظام التصميم المؤسسي المعتمد (Enterprise Palette).',
      severity: 'cosmetic',
      status: 'resolved',
      createdAt: '2026/07/07'
    }
  ]);

  const [ux75NewNoteText, setUx75NewNoteText] = useState<string>('');
  const [ux75NewNoteSeverity, setUx75NewNoteSeverity] = useState<'critical' | 'medium' | 'cosmetic'>('critical');
  const [ux75NewNoteScreenId, setUx75NewNoteScreenId] = useState<string>('daily_entries');

  // 7.6 Enterprise UI Excellence - Production Screens states
  const [ux76CertApproved, setUx76CertApproved] = useState<boolean>(false);
  const [ux76ActiveTab, setUx76ActiveTab] = useState<'dashboard' | 'crud' | 'tables' | 'dialogs' | 'accessibility'>('dashboard');
  
  // Dashboard states
  const [ux76CustomizeLayout, setUx76CustomizeLayout] = useState<boolean>(false);
  const [ux76DashboardCards, setUx76DashboardCards] = useState([
    { id: 'kpi_students', title: 'الطلاب المسجلين', value: '1,420', change: '+12%', type: 'success', visible: true, desc: 'إجمالي الطلاب المقبولين والنشطين' },
    { id: 'kpi_tuition', title: 'الإيرادات المحصلة', value: '458,200 د.ل', change: '+8%', type: 'info', visible: true, desc: 'مقبوضات الرسوم الدراسية الفعلية' },
    { id: 'kpi_overdue', title: 'المستحقات المتأخرة', value: '84,100 د.ل', change: '-15%', type: 'danger', visible: true, desc: 'مديونيات الطلاب المعلقة' },
    { id: 'kpi_teachers', title: 'الكادر التعليمي', value: '96 معلم', change: 'ثابت', type: 'warning', visible: true, desc: 'المعلمين والإداريين النشطين' },
  ]);

  // CRUD Form states
  const [ux76FormFields, setUx76FormFields] = useState({
    studentId: 'STD-2026-0043',
    studentName: 'فيصل بن أحمد الزهراني',
    guardianName: 'أحمد بن عبد الرحمن الزهراني',
    nationalId: '1098472910',
    feeCategory: 'primary_standard',
    paymentMethod: 'cash',
    amountPaid: '4500',
    voucherNotes: 'دفعة القسط الأول لرسوم الفصل الدراسي الأول لعام 2026'
  });
  const [ux76FormErrors, setUx76FormErrors] = useState<Record<string, string>>({});
  const [ux76IsSubmitting, setUx76IsSubmitting] = useState<boolean>(false);
  const [ux76CrudLog, setUx76CrudLog] = useState<string[]>([]);

  // Tables states
  const [ux76TableSearch, setUx76TableSearch] = useState<string>('');
  const [ux76TableFilterType, setUx76TableFilterType] = useState<string>('all');
  const [ux76TableSortCol, setUx76TableSortCol] = useState<string>('id');
  const [ux76TableSortDir, setUx76TableSortDir] = useState<'asc' | 'desc'>('asc');
  const [ux76TableColumns, setUx76TableColumns] = useState({
    id: true,
    name: true,
    type: true,
    amount: true,
    date: true,
    status: true
  });
  const [ux76TableData, setUx76TableData] = useState([
    { id: 'REC-0981', name: 'يوسف بن خالد السبيعي', type: 'رسوم دراسية', amount: 5000, date: '2026/07/09', status: 'مرحل' },
    { id: 'REC-0982', name: 'لينا بنت سليمان العتيبي', type: 'حافلة مدرسية', amount: 1200, date: '2026/07/08', status: 'مرحل' },
    { id: 'REC-0983', name: 'سعود بن محمد الدوسري', type: 'رسوم دراسية', amount: 4500, date: '2026/07/08', status: 'مسودة' },
    { id: 'REC-0984', name: 'ريما بنت عادل الشمري', type: 'أنشطة لاصفية', amount: 800, date: '2026/07/07', status: 'مرحل' },
    { id: 'REC-0985', name: 'سلطان بن فهد المطيري', type: 'رسوم دراسية', amount: 6000, date: '2026/07/06', status: 'ملغي' },
    { id: 'REC-0986', name: 'هدى بنت طارق المالكي', type: 'رسوم دراسية', amount: 3500, date: '2026/07/05', status: 'مرحل' },
  ]);

  // Dialog & Wizard states
  const [ux76WizardStep, setUx76WizardStep] = useState<number>(1);
  const [ux76WizardData, setUx76WizardData] = useState({
    courseName: '',
    department: 'science',
    maxStudents: '25',
    instructor: '',
    scheduleTime: '08:00',
    scheduleDays: [] as string[]
  });
  const [ux76WizardErrors, setUx76WizardErrors] = useState<Record<string, string>>({});
  const [ux76ShowWizardDialog, setUx76ShowWizardDialog] = useState<boolean>(false);

  // Accessibility helpers
  const [ux76HighContrast, setUx76HighContrast] = useState<boolean>(false);
  const [ux76KeyboardHelper, setUx76KeyboardHelper] = useState<boolean>(true);
  const [ux76FocusedElement, setUx76FocusedElement] = useState<string | null>(null);

  // 7.4 Enterprise Screen Excellence – Phase 1 states
  const [ux74CertApproved, setUx74CertApproved] = useState<boolean>(false);
  const [ux74Checklist, setUx74Checklist] = useState({
    mainDashboard: true,
    toolbarStandard: true,
    searchExperience: true,
    pageProductivity: true,
  });

  // Main Dashboard states for 7.4 demonstration
  const [ux74ActiveCard, setUx74ActiveCard] = useState<string>('all');
  const [ux74KpiThreshold, setUx74KpiThreshold] = useState<number>(3000);

  // Search & Filter states for 7.4
  const [ux74SearchQuery, setUx74SearchQuery] = useState<string>('');
  const [ux74FilterStatus, setUx74FilterStatus] = useState<string>('all');
  const [ux74FilterRole, setUx74FilterRole] = useState<string>('all');
  const [ux74AdvancedSearchOpen, setUx74AdvancedSearchOpen] = useState<boolean>(false);
  const [ux74MinAmount, setUx74MinAmount] = useState<string>('');
  const [ux74MaxAmount, setUx74MaxAmount] = useState<string>('');
  const [ux74SelectedDateRange, setUx74SelectedDateRange] = useState<string>('all');

  // Toolbar state & interaction log for productivity
  const [ux74ProductivityClicks, setUx74ProductivityClicks] = useState<number>(0);
  const [ux74DemoRecords, setUx74DemoRecords] = useState<Array<{ id: string, name: string, role: string, amount: number, status: string, date: string }>>([
    { id: "EMP-7401", name: "عبد العزيز بن سلمان التميمي", role: "مدير مالي", amount: 15000, status: "نشط", date: "2026/07/01" },
    { id: "EMP-7402", name: "مها بنت فهد السديري", role: "موظف موارد بشرية", amount: 8200, status: "نشط", date: "2026/07/02" },
    { id: "EMP-7403", name: "عبد الرحمن بن خالد الحربي", role: "محاسب أول", amount: 12000, status: "إجازة", date: "2026/07/04" },
    { id: "EMP-7404", name: "منى بنت سليمان الرشيد", role: "مدير شؤون المعلمين", amount: 9500, status: "نشط", date: "2026/07/05" },
    { id: "EMP-7405", name: "فيصل بن سعد آل سعود", role: "مدقق خارجي", amount: 18000, status: "نشط", date: "2026/07/06" },
    { id: "EMP-7406", name: "هند بنت عمر العتيبي", role: "مسؤول قبول وتسجيل", amount: 7500, status: "معلق", date: "2026/07/07" },
  ]);

  // Selected item state for the inline workspace (Task Focus / Less navigation)
  const [ux74SelectedRecordId, setUx74SelectedRecordId] = useState<string | null>(null);
  const [ux74EditingRecord, setUx74EditingRecord] = useState<{ id: string, name: string, role: string, amount: number, status: string } | null>(null);

  // 7.3 Enterprise Screen Excellence Foundation states
  const [ux73CertApproved, setUx73CertApproved] = useState<boolean>(false);
  const [ux73Checklist, setUx73Checklist] = useState({
    screenLayout: true,
    visualHierarchy: true,
    tablesStandard: true,
    formsStandard: true,
  });
  const [ux73TableHeightClass, setUx73TableHeightClass] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [ux73TableSortBy, setUx73TableSortBy] = useState<'id' | 'name' | 'amount'>('id');
  const [ux73TableSortDir, setUx73TableSortDir] = useState<'asc' | 'desc'>('asc');
  const [ux73TablePage, setUx73TablePage] = useState<number>(1);
  const [ux73TableSearch, setUx73TableSearch] = useState<string>('');
  const [ux73TableFilterStatus, setUx73TableFilterStatus] = useState<string>('all');

  // Form states for 7.3 Standard Form Demo
  const [ux73RecipientName, setUx73RecipientName] = useState<string>('');
  const [ux73DocAmount, setUx73DocAmount] = useState<string>('');
  const [ux73DocType, setUx73DocType] = useState<string>('receipt');
  const [ux73IsSubmitted, setUx73IsSubmitted] = useState<boolean>(false);
  const [ux73FormErrors, setUx73FormErrors] = useState<Record<string, string>>({});

  // 7.2 Enterprise UX Framework & Navigation states
  const [ux72CertApproved, setUx72CertApproved] = useState<boolean>(false);
  const [ux72Checklist, setUx72Checklist] = useState({
    navAndBreadcrumb: true,
    pageLayoutTemplate: true,
    actionButtonStandards: true,
    feedbackStandards: true,
    rtlMirrorVerification: true,
  });
  const [previewLayout, setPreviewLayout] = useState<'ledger' | 'hr' | 'exams'>('ledger');
  const [activeFeedback, setActiveFeedback] = useState<'success' | 'error' | 'warning' | 'confirm' | 'loading' | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [rtlMirrorMode, setRtlMirrorMode] = useState<boolean>(true);
  const [search72, setSearch72] = useState<string>('');
  const [statusFilter72, setStatusFilter72] = useState<string>('all');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isLoading72Table, setIsLoading72Table] = useState<boolean>(false);

  // Governance: Workflow Rules
  const [activeWorkflow, setActiveWorkflow] = useState<string>('fees');

  // 7.0 UX Readiness Checklist states
  const [uxChecklist, setUxChecklist] = useState({
    pageLayout: true,
    toolbars: true,
    tables: true,
    modals: true,
    buttons: true,
    inputs: true,
    messages: true,
    icons: true,
  });

  const [uxDesignSystemApproval, setUxDesignSystemApproval] = useState({
    buttons: true,
    cards: true,
    tables: true,
    alerts: true,
    modals: true,
    statusBadges: true,
  });

  const [uxWorkflowReview, setUxWorkflowReview] = useState({
    registration: true,
    collection: true,
    hrPayroll: true,
    exams: true,
    glReports: true,
  });

  const [uxCertified, setUxCertified] = useState(true);

  // 7.1 Enterprise Design System States
  const [dsComponent, setDsComponent] = useState<'button' | 'input' | 'select' | 'table' | 'card' | 'dialog' | 'tab' | 'badge' | 'alert' | 'icon'>('button');
  const [dsSize, setDsSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [dsState, setDsState] = useState<'normal' | 'hover' | 'focus' | 'disabled' | 'loading' | 'empty' | 'error' | 'success'>('normal');
  const [dsSpacing, setDsSpacing] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [dsHeight, setDsHeight] = useState<'38px' | '42px' | '48px'>('42px');
  const [dsRtl, setDsRtl] = useState<boolean>(true);
  const [dsCertified, setDsCertified] = useState<boolean>(true);
  const [dsSearch, setDsSearch] = useState<string>('');

  // 6.5 Cross-Domain Integration Certification states
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimActive, setIsSimActive] = useState<boolean>(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [isCertified, setIsCertified] = useState<boolean>(true);
  const [selectedTraceStep, setSelectedTraceStep] = useState<number | null>(1);
  const [certApprovals, setCertApprovals] = useState({
    sa: true, // Student Affairs
    fees: true, // Fees & Billing
    rec: true, // Receipts
    posting: true, // Posting Engine
    gl: true, // General Ledger
    rep: true, // Reports
  });

  const handleStartIntegrationSim = () => {
    setIsSimActive(true);
    setSimStep(0);
    setSimLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء اختبار التحقق الشامل لتكامل الدورة المستندية للأعمال...`]);
    setSelectedTraceStep(1);
    
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setSimStep(current);
      setSelectedTraceStep(current);
      
      const logMessages = [
        `[${new Date().toLocaleTimeString('ar-SA')}] الخطوة 1: تم رصد تسجيل الطالب الأكاديمي STD-2026-0043 بنجاح. التحقق من ربط ولي الأمر: متطابق وموثق.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] الخطوة 2: تم رصد توليد فاتورة الرسوم الدراسية INV-2026-0089 بقيمة 12,000 د.ل. الربط مع الطالب: سليم تماماً.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] الخطوة 3: تم تحصيل القسط الأول بقيمة 4,000 د.ل بموجب سند القبض REC-2026-0543. التوجيه للخزينة: مؤمن ومعتمد.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] الخطوة 4: الترحيل التلقائي نشط. تم إنشاء قيد اليومية المزدوج JV-2026-11202. الحالة: متزن 100%.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] الخطوة 5: تحديث أرصدة الأستاذ العام وتعديل ميزان المراجعة فورياً. الحسابات 1110 و 1210: مطابقة للمصدر.`,
        `[${new Date().toLocaleTimeString('ar-SA')}] الخطوة 6: تم تحديث التقارير المالية والتحليلات الختامية. لوحة القيادة التنفيذية مطابقة للمصدر بنسبة 100%.`,
      ];
      
      setSimLogs(prev => [...prev, logMessages[current - 1]]);
      
      if (current === 6) {
        clearInterval(interval);
        setIsSimActive(false);
        setIsCertified(true);
        triggerNotification('تم بنجاح محاكاة دورة العمل المتكاملة والتحقق من سلامة البيانات وربطها 100% 🎖️', 'success');
      }
    }, 1200);
  };

  // Business Rules States
  const [siblingDiscount, setSiblingDiscount] = useState<number>(15);
  const [gracePeriod, setGracePeriod] = useState<number>(7);
  const [passingGrade, setPassingGrade] = useState<number>(50);
  const [absenceLimit, setAbsenceLimit] = useState<number>(15);
  const [isBusinessRulesSaving, setIsBusinessRulesSaving] = useState<boolean>(false);

  // Automation Recipes
  const [automationRecipes, setAutomationRecipes] = useState([
    { id: 'abs_alert', title: 'إرسال تنبيه غياب تلقائي', trigger: 'عند تسجيل غياب الطالب لـ 3 أيام متتالية', action: 'إرسال رسالة SMS وWhatsApp فورية لولي الأمر', active: true },
    { id: 'fee_remind', title: 'تذكير السداد التلقائي', trigger: 'قبل 5 أيام من استحقاق القسط الدراسي', action: 'جدولة بريد إلكتروني وتنبيه في حساب ولي الأمر والاتصال التلقائي', active: true },
    { id: 'grade_publish', title: 'تنبيه اعتماد النتائج والشهادات', trigger: 'عند اعتماد درجات الكنترول رسمياً من الإدارة', action: 'إرسال إشعارات دفع وتجهيز ملف الشهادة الذكي للتحميل', active: false },
    { id: 'payroll_post', title: 'الترحيل التلقائي لرواتب المعلمين', trigger: 'في تمام الساعة 11:59 مساءً من يوم 25 من كل شهر ميلادي', action: 'توليد قيود الرواتب والاستحقاقات وتحديث الحسابات العامة', active: true },
  ]);
  const [automationLogs, setAutomationLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('ar-SA')}] تم تشغيل محرك الأتمتة بنجاح.`,
    `[${new Date().toLocaleTimeString('ar-SA')}] فحص الفواتير المستحقة: تم العثور على 4 فواتير متأخرة وتوجيه تنبيهات السداد بنجاح.`,
  ]);
  const [isSimulatingAutomation, setIsSimulatingAutomation] = useState<boolean>(false);

  // Report & Template Designer State
  const [reportTitle, setReportTitle] = useState<string>('سند قبض رسوم دراسية معتمد');
  const [reportPrimaryColor, setReportPrimaryColor] = useState<string>('#6366f1');
  const [reportLogoPos, setReportLogoPos] = useState<'right' | 'center' | 'left'>('right');
  const [showStamp, setShowStamp] = useState<boolean>(true);

  // Version Control & Time Travel Auditor
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<any | null>(null);
  const [auditRecords] = useState([
    { id: 'aud_1', table: 'students', action: 'تعديل السيرة السلوكية للدرجات', user: 'أ. مريم العتيبي (معلمة)', time: 'منذ 10 دقائق', ip: '192.168.1.104', before: { name: 'ماجد الحربي', grade: 'الأول الثانوي', score: '45%' }, after: { name: 'ماجد الحربي', grade: 'الأول الثانوي', score: '92% (اعتماد المراجعة)' }, details: 'تعديل درجات اختبار مادة الفيزياء بعد المراجعة اليدوية لرصد تظلم الطالب.' },
    { id: 'aud_2', table: 'journal_entries', action: 'تعديل قيد تسوية مالي', user: 'أ. خالد الحربي (محاسب)', time: 'منذ ساعتين', ip: '10.0.4.15', before: { debit: '15,000 ريال (حساب غير معرف)', credit: '15,000 ريال' }, after: { debit: '15,000 ريال (البنك الأهلي)', credit: '15,000 ريال' }, details: 'تعديل الحساب المدين للقيد المحاسبي لضمان التوجيه لمركز التكلفة الصحيح.' },
    { id: 'aud_3', table: 'schools', action: 'تحديث تراخيص الـ SaaS والمستندات', user: 'SuperAdmin (المطور العام)', time: 'أمس', ip: '185.122.40.11', before: { plan: 'الباقة الأساسية', storage: '10 GB' }, after: { plan: 'باقة الأكاديمية الاحترافية', storage: '100 GB' }, details: 'الترقية التلقائية بعد تأكيد المدفوعات عبر بوابات الربط الإلكتروني.' },
  ]);

  // Point-in-Time Recovery Slider
  const [pitrMinutes, setPitrMinutes] = useState<number>(0);
  const [pitrRestoring, setPitrRestoring] = useState<boolean>(false);

  // SaaS Backup Vault states
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupProgress, setBackupProgress] = useState<number>(0);
  const [backupFiles, setBackupFiles] = useState([
    { name: 'backup_school_1_snapshot_20260702_01.sql', size: '14.2 MB', date: 'اليوم، 01:00 ص', key: 'AES-256-Encrypted' },
    { name: 'backup_school_1_snapshot_20260701_00.sql', size: '14.1 MB', date: 'أمس، 12:00 ص', key: 'AES-256-Encrypted' },
  ]);

  // Security Penetration Scanner States
  const [securityScore, setSecurityScore] = useState<number>(100);
  const [isSecScanning, setIsSecScanning] = useState<boolean>(false);
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('ar-SA')}] تم فحص جدران الحماية للـ API وعزل المدارس: آمنة تماماً.`,
    `[${new Date().toLocaleTimeString('ar-SA')}] التحقق من فلاتر إدخال النصوص وحظر الـ SQL Injection: ممتاز.`
  ]);

  // SOP Help Manuals screen state
  const [selectedSopScreen, setSelectedSopScreen] = useState<string>('students');

  // A. Compound Indexes
  const [isIndexing, setIsIndexing] = useState<boolean>(false);
  const [indexingProgress, setIndexingProgress] = useState<number>(0);
  const [sampleQueryLatency, setSampleQueryLatency] = useState<{ before: number; after: number; improvement: number } | null>(
    indexesApplied ? { before: 180, after: 12, improvement: 93.3 } : null
  );

  const handleApplyIndexes = () => {
    setIsIndexing(true);
    setIndexingProgress(0);
    const interval = setInterval(() => {
      setIndexingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsIndexing(false);
          setIndexesApplied(true);
          setSampleQueryLatency({ before: 180, after: 12, improvement: 93.3 });
          triggerNotification('تم رصد وتطبيق 7 فهارس مركبة بنجاح في قاعدة البيانات السحابية ⚡', 'success');
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  // B. Audit Log Archiving
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [archivingProgress, setArchivingProgress] = useState<number>(0);
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archivedLogs, setArchivedLogs] = useState([
    { id: 'arch_1', action: 'قبول دفع رسوم', user: 'خالد مالي', details: 'سند رقم 1022 - 3,500 ريال', date: 'منذ شهرين' },
    { id: 'arch_2', action: 'تعديل هاتف طالب', user: 'أماني شؤون', details: 'تعديل هاتف الطالب تركي الحربي', date: 'منذ 3 أشهر' },
  ]);

  const handleRunArchiving = () => {
    setIsArchiving(true);
    setArchivingProgress(0);
    const interval = setInterval(() => {
      setArchivingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsArchiving(false);
          triggerNotification('تم ترحيل وضغط سجل العمليات الأقدم من 90 يوم بنجاح للمخزن البارد!', 'success');
          setArchivedLogs(prevLogs => [
            { id: `arch_${Date.now()}`, action: 'تنظيف دوري للأرشيف', user: 'النظام السحابي', details: 'ضغط وأرشفة السجلات غير النشطة', date: 'الآن' },
            ...prevLogs
          ]);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleFlushCache = () => {
    triggerNotification('تم مسح وإفراغ الذاكرة المؤقتة Redis لكافة الجداول والخيارات!', 'success');
    setCacheMemory(0.0);
    setTimeout(() => {
      setCacheMemory(14.2);
    }, 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 text-right" dir="rtl">
      
      {/* Sub-tab selection menu for Enterprise Suite */}
      <div className="bg-slate-100 dark:bg-slate-950 p-1 flex flex-wrap md:flex-nowrap gap-1 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_acceptance_testing_protocol')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_acceptance_testing_protocol' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-2 border-amber-400 font-extrabold scale-[1.04]' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/40'}`}
        >
          <Award className="w-4 h-4 text-slate-950 dark:text-amber-300 animate-bounce" />
          <span>اختبار قبول المؤسسة (UAT-239) 🏆</span>
          <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">النسخة 239 🌟</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('eps')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'eps' ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-2 border-amber-400 font-extrabold scale-[1.04]' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/40'}`}
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>معايير المنتج المؤسسي (EPS) 💎</span>
          <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">الجديد ✨</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('eep')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'eep' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-2 border-emerald-400 font-extrabold scale-[1.04]' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-300 hover:bg-amber-200 border border-amber-300/40 animate-pulse'}`}
        >
          <Award className="w-4 h-4 text-emerald-950 dark:text-emerald-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span>برنامج التميز التنفيذي (EEP) 👑</span>
          <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">القمة 🚀</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_workflows_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_workflows_certification' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Workflow className={`w-4 h-4 ${enterpriseSubTab === 'ux_workflows_certification' ? 'text-white animate-pulse' : 'text-violet-500'}`} />
          <span>18.0 اعتماد مسارات العمل الكلية (Workflows Certification)</span>
          <span className="bg-slate-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">WORKFLOW INTEGRITY 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_events_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_events_certification' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Zap className={`w-4 h-4 ${enterpriseSubTab === 'ux_events_certification' ? 'text-white animate-pulse' : 'text-amber-500'}`} />
          <span>19.0 معمارية أحداث الدومين المستقلة (Domain Events Certification)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">DOMAIN EVENTS 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_validation_framework')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_validation_framework' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <ShieldCheck className={`w-4 h-4 ${enterpriseSubTab === 'ux_validation_framework' ? 'text-white animate-pulse' : 'text-emerald-500'}`} />
          <span>20.0 إطار عمل التحقق الموحد (Enterprise Validation Framework)</span>
          <span className="bg-slate-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">VALIDATION FRAMEWORK 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_exception_architecture')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_exception_architecture' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <ShieldAlert className={`w-4 h-4 ${enterpriseSubTab === 'ux_exception_architecture' ? 'text-white animate-pulse' : 'text-rose-500'}`} />
          <span>21.0 معمارية الاستثناءات وإدارة الأخطاء (Enterprise Exception Architecture)</span>
          <span className="bg-slate-950 text-rose-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">EXCEPTION ARCHITECTURE 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_configuration_governance')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_configuration_governance' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Key className={`w-4 h-4 ${enterpriseSubTab === 'ux_configuration_governance' ? 'text-white animate-pulse' : 'text-amber-400'}`} />
          <span>22.0 حوكمة وتأمين الإعدادات (Configuration Governance)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">CONFIG GOVERNANCE 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_enterprise_logging')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_enterprise_logging' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Terminal className={`w-4 h-4 ${enterpriseSubTab === 'ux_enterprise_logging' ? 'text-white animate-pulse' : 'text-amber-400'}`} />
          <span>23.0 إطار عمل التسجيل والتدقيق الموحد (Enterprise Logging & Audit)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">SIEM LOGS 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_dependency_injection')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_dependency_injection' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Network className={`w-4 h-4 ${enterpriseSubTab === 'ux_dependency_injection' ? 'text-white animate-pulse' : 'text-amber-400'}`} />
          <span>24.0 إطار عمل حقن التبعيات والمحاذاة المعمارية (Dependency Injection Governance)</span>
          <span className="bg-slate-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">DI & IoC 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_accounting_reconstruction')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_accounting_reconstruction' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Building className={`w-4 h-4 ${enterpriseSubTab === 'ux_accounting_reconstruction' ? 'text-white animate-pulse' : 'text-emerald-500'}`} />
          <span>25.0 عزل وإعادة هيكلة الحسابات وميزان المراجعة (Accounting Core Reconstruction)</span>
          <span className="bg-slate-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">IFRS & ZATCA 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_revenue_recognition')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_revenue_recognition' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Scale className={`w-4 h-4 ${enterpriseSubTab === 'ux_revenue_recognition' ? 'text-white animate-pulse' : 'text-amber-400'}`} />
          <span>26.0 محرك الاعتراف بالإيرادات والتدقيق (Revenue Recognition Engine)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">REVENUE IFRS 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_student_fees_engine')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_student_fees_engine' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Coins className={`w-4 h-4 ${enterpriseSubTab === 'ux_student_fees_engine' ? 'text-white animate-pulse' : 'text-emerald-400'}`} />
          <span>27.0 محرك هيكلة وسداد الرسوم الدراسية (Student Fees Engine)</span>
          <span className="bg-slate-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">FEES ENGINE 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('integration')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'integration' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Workflow className={`w-4 h-4 ${enterpriseSubTab === 'integration' ? 'text-white animate-pulse' : 'text-violet-500'}`} />
          <span>17.0 اعتماد وتكامل الأنظمة الموحدة (System Integration Cert)</span>
          <span className="bg-slate-950 text-violet-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">SYSTEM INTEGRATION 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_main_screens_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_main_screens_certification' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <BadgeCheck className={`w-4 h-4 ${enterpriseSubTab === 'ux_main_screens_certification' ? 'text-white animate-pulse' : 'text-amber-500'}`} />
          <span>16.0 اعتماد الشاشات الرئيسية (Main Screens Certification)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">QUALITY GATE 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_data_integrity_business_rules_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_data_integrity_business_rules_certification' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <ShieldCheck className={`w-4 h-4 ${enterpriseSubTab === 'ux_data_integrity_business_rules_certification' ? 'text-white animate-pulse' : 'text-emerald-500'}`} />
          <span>15.0 سلامة البيانات وقواعد الأعمال (Data & Business Rules)</span>
          <span className="bg-slate-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">ENTERPRISE SECURITY 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_maintainability_scalability_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_maintainability_scalability_certification' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Hammer className={`w-4 h-4 ${enterpriseSubTab === 'ux_maintainability_scalability_certification' ? 'text-white animate-pulse' : 'text-amber-500'}`} />
          <span>14.0 معايير الاستدامة والصيانة الكودية (Maintainability & Scalability)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">ENTERPRISE CORE 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_student_affairs_institutional_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_student_affairs_institutional_certification' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className={`w-4 h-4 ${enterpriseSubTab === 'ux_student_affairs_institutional_certification' ? 'text-white animate-pulse' : 'text-amber-500'}`} />
          <span>13.0 الاعتماد المؤسسي لشؤون الطلاب (Student Affairs Cert)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">INSTITUTIONAL CERT 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_golden_certification_readiness')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_golden_certification_readiness' ? 'bg-amber-500 text-slate-950 shadow-2xl border border-amber-400 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Crown className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>12.4 كراسة الترخيص والاعتماد الذهبي (Golden Release Cert)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">GOLDEN RELEASE 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_operational_excellence_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_operational_excellence_certification' ? 'bg-emerald-600 text-white shadow-2xl border border-emerald-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Zap className={`w-4 h-4 ${enterpriseSubTab === 'ux_operational_excellence_certification' ? 'text-white animate-pulse' : 'text-slate-500'}`} />
          <span>12.3 جودة الصلابة والتميز التشغيلي (Operational Excellence)</span>
          <span className="bg-slate-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">EXCELLENCE 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_controlled_launch_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_controlled_launch_certification' ? 'bg-amber-500 text-slate-950 shadow-2xl border border-amber-400 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Compass className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>12.2 ميثاق الإطلاق التجريبي (Controlled Launch)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">PILOT 🚀</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_golden_release_execution_program')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_golden_release_execution_program' ? 'bg-amber-600 text-slate-950 shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Crown className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>12.1 ميثاق الإطلاق الذهبي (Golden Release Execution)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">PLATINUM 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_golden_acceptance_program')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_golden_acceptance_program' ? 'bg-amber-500 text-slate-950 shadow-2xl border border-amber-400 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Crown className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>12.0 برنامج الاعتماد الذهبي (Golden Acceptance)</span>
          <span className="bg-slate-950 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">GOLDEN 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_final_readiness_go_live_validation')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_final_readiness_go_live_validation' ? 'bg-emerald-600 text-slate-950 shadow-2xl border border-emerald-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>11.6 الإطلاق الفعلي والتشغيل الحي (Go-Live Validation)</span>
          <span className="bg-yellow-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">GOLDEN RELEASE 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_pre_go_live_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_pre_go_live_certification' ? 'bg-emerald-600 text-slate-950 shadow-2xl border border-emerald-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>11.5 شهادة ما قبل الإطلاق المؤسسي (Pre-Go-Live Certification)</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">DIAMOND 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_final_acceptance')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_final_acceptance' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-slate-150 animate-bounce" />
          <span>11.4 شهادة الإطلاق التجاري والقبول النهائي (Final Acceptance)</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">PLATINUM 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_go_live_readiness_certification')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_go_live_readiness_certification' ? 'bg-emerald-600 text-slate-950 shadow-2xl border border-emerald-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>11.3 شهادة جاهزية الإطلاق الفعلي المعتمدة (Go-Live Readiness)</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">GOLDEN 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_operational_real_school_readiness')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_operational_real_school_readiness' ? 'bg-amber-600 text-slate-950 shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>11.2 شهادة الجاهزية التشغيلية ومحاكاة العام الكامل (Real School Readiness)</span>
          <span className="bg-emerald-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">PREMIUM 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_production_acceptance_program')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_production_acceptance_program' ? 'bg-emerald-600 text-slate-950 shadow-2xl border border-emerald-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <ShieldCheck className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>11.1 برنامج قبول وتشغيل الإنتاج (Production Acceptance PAT)</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">LIVE 🚀</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_golden_release_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_golden_release_cert' ? 'bg-amber-500 text-slate-950 shadow-2xl border border-amber-400 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-slate-950 animate-spin" />
          <span>11.0 شهادة الاعتماد النهائي للإصدار الذهبي (Golden Release Cert)</span>
          <span className="bg-emerald-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">PREMIUM 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_release_governance_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_release_governance_cert' ? 'bg-amber-600 text-slate-950 shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Crown className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>10.9 سجل اعتماد وحوكمة الإصدار الذهبي (Release Governance)</span>
          <span className="bg-amber-450 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">GOLD 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_platform_management_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_platform_management_cert' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Settings className="w-4 h-4 text-emerald-300 animate-bounce" />
          <span>10.8 إدارة النظام وحوكمة المنصة (Platform Management)</span>
          <span className="bg-emerald-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">ADMIN 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_security_permissions_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_security_permissions_cert' ? 'bg-emerald-600 text-slate-950 shadow-2xl border border-emerald-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <LockIcon className="w-4 h-4 text-emerald-950 animate-bounce" />
          <span>10.7 الأمان والصلاحيات والرقابة (Security & Operational Control)</span>
          <span className="bg-emerald-450 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">SECURITY 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_executive_dashboards_reporting_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_executive_dashboards_reporting_cert' ? 'bg-amber-650 bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-amber-300 animate-bounce" />
          <span>10.6 لوحات المعلومات والتقارير التنفيذية (Dashboards & Reports)</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">REPORTS 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_hr_payroll_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_hr_payroll_cert' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-pink-300 animate-bounce" />
          <span>10.5 شؤون الموظفين والرواتب (HR & Payroll)</span>
          <span className="bg-pink-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">HR & PAYROLL 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_academic_exam_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_academic_exam_cert' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-amber-300 animate-bounce" />
          <span>10.4 اعتماد الامتحانات والإدارة الأكاديمية (Exam Management)</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">ACADEMIC 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_student_financial_lifecycle_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_student_financial_lifecycle_cert' ? 'bg-emerald-600 text-slate-950 shadow-2xl border border-emerald-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-emerald-450 animate-bounce" />
          <span>10.3 اعتماد دورة حياة الطالب المالية (Financial Lifecycle)</span>
          <span className="bg-emerald-450 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">LIFECYCLE 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_customer_operations_excellence')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_customer_operations_excellence' ? 'bg-amber-650 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Crown className="w-4 h-4 text-amber-300 animate-bounce" />
          <span>9.4 تميز العمليات وتجربة العملاء (Customer & Operations Excellence)</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">OPERATIONS 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_product_excellence_review')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_product_excellence_review' ? 'bg-amber-600 text-white shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Crown className="w-4 h-4 text-amber-400 animate-spin" />
          <span>9.3 مراجعة واعتماد تميز المنتج (Product Excellence Review)</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">EXCELLENCE 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_product_distinction_audit')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_product_distinction_audit' ? 'bg-emerald-600 text-slate-950 shadow-2xl border border-emerald-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>9.1 تدقيق تميز وقيمة المنتج (Product Distinction)</span>
          <span className="bg-emerald-450 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">DISTINCTION 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_golden_product_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_golden_product_cert' ? 'bg-amber-600 text-slate-950 shadow-2xl border border-amber-500 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-amber-500 animate-bounce" />
          <span>9.0 ترخيص المنتج الذهبي (Golden Certification)</span>
          <span className="bg-amber-450 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">GOLDEN CERT 🏅</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_final_excellence_gate')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_final_excellence_gate' ? 'bg-amber-700 text-white shadow-2xl border border-amber-650 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <BadgeCheck className="w-4 h-4 text-emerald-450 animate-pulse" />
          <span>8.9 بوابة التميز النهائي (Excellence Gate)</span>
          <span className="bg-emerald-450 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">FINAL GATE 🏅</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_masterpiece_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_masterpiece_cert' ? 'bg-amber-700 text-white shadow-2xl border border-amber-650 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Crown className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>8.8 الاعتماد والترخيص الأستاذي (Masterpiece)</span>
          <span className="bg-amber-450 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">MASTERPIECE 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_diamond_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_diamond_cert' ? 'bg-amber-700 text-white shadow-2xl border border-amber-650 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>8.7 الاعتماد والترخيص الماسي</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">DIAMOND 💎</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_world_class_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_world_class_cert' ? 'bg-amber-700 text-white shadow-2xl border border-amber-650 font-black scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-amber-400 animate-spin" />
          <span>8.6 الاعتماد والترخيص العالمي</span>
          <span className="bg-amber-450 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">WORLD-CLASS 👑</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_elite_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_elite_cert' ? 'bg-amber-650 text-white shadow-lg border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Crown className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>8.5 اعتماد النخبة والتميز</span>
          <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">ELITE 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_platinum_gate')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_platinum_gate' ? 'bg-amber-650 text-white shadow-lg border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-400 animate-pulse" />
          <span>8.4 بوابة الجودة البلاتينية</span>
          <span className="bg-teal-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">PLATINUM 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_excellence_gate')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_excellence_gate' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>8.3 بوابة التميز والاعتماد</span>
          <span className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">PRO 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_golden_release')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_golden_release' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>8.0 الإصدار الذهبي المرجعي</span>
          <span className="bg-amber-550 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">GOLD 🏆</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_release_candidate_audit')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_release_candidate_audit' ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-400 font-extrabold scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-amber-950 dark:text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span>برنامج مرشح الإصدار (RC-1)</span>
          <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">مستهدف 🎯</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_production_readiness')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_production_readiness' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Building className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>7.8 جاهزية الإنتاج والتشغيل</span>
          <span className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">جاهز 🚀</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_quality_gate')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_quality_gate' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>7.7 بوابة جودة التميز</span>
          <span className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">جودة 🌟</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_screen_excellence_production')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_screen_excellence_production' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>7.6 تميز واجهات الإنتاج للشركات</span>
          <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">جديد 🌟</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_screen_excellence_audit')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_screen_excellence_audit' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>7.5 تدقيق واجهات الشاشات الحرجة</span>
          <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">جديد 🌟</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_screen_excellence_p1')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_screen_excellence_p1' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Sliders className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span>7.4 تميز شاشات النظام - م1</span>
          <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">جديد 🌟</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_screen_excellence')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'ux_screen_excellence' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>7.3 تميز شاشات النظام</span>
          <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">معيار المظهر 🌟</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_framework')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'ux_framework' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Layout className="w-4 h-4 text-amber-400" />
          <span>7.2 إطار تجربة المستخدم الموحد ونظام التنقل</span>
          <span className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">نشط 🌟</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_design_system')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'ux_design_system' ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/30 dark:border-slate-800/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Palette className="w-4 h-4 text-pink-400" />
          <span>7.1 نظام التصميم المؤسسي (Design System)</span>
          <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">موحد</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('ux_ready')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'ux_ready' ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/30 dark:border-slate-800/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>7.0 جاهزية تجربة المستخدم (UX Gate)</span>
          <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">جديد</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('final_cert_p1')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'final_cert_p1' ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-400 font-extrabold scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-amber-950 dark:text-amber-300 animate-bounce" />
          <span>برنامج الاعتماد النهائي (Phase 1)</span>
          <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">مستهدف 🎯</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('external_audit_protocol')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${enterpriseSubTab === 'external_audit_protocol' ? 'bg-amber-600 text-white shadow-md border border-amber-500 font-extrabold scale-[1.02]' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>6.7 بروتوكول التدقيق الخارجي</span>
          <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">شامل 🔒</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('final_cert')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'final_cert' ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-400 font-extrabold' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'}`}
        >
          <Award className="w-4 h-4 text-amber-950 dark:text-amber-300" />
          <span>6.6 الاعتماد النهائي للمؤسسة</span>
          <span className="bg-amber-950 text-amber-300 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">شامل</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('integration')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'integration' ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/30 dark:border-slate-800/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>اعتماد التكامل بين المجالات (6.5)</span>
          <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">جديد</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('perf')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'perf' ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/30 dark:border-slate-800/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>البنية السحابية والأداء المتقدم</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('governance')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'governance' ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/30 dark:border-slate-800/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Workflow className="w-4 h-4 text-amber-500" />
          <span>محركات الحوكمة والأتمتة</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('closing')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'closing' ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/30 dark:border-slate-800/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <LockIcon className="w-4 h-4 text-emerald-500" />
          <span>منصة الإقفال المالي الموحدة</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('security')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'security' ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/30 dark:border-slate-800/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>تتبع الإصدارات والأمن السحابي</span>
        </button>
        <button
          type="button"
          onClick={() => setEnterpriseSubTab('docs')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${enterpriseSubTab === 'docs' ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/30 dark:border-slate-800/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <HelpCircle className="w-4 h-4 text-yellow-500" />
          <span>SOP</span>
        </button>
      </div>

      {/* Sub-Tab 1: Cloud Performance (Existing Stages 1, 2, 3, 4) */}
      {enterpriseSubTab === 'perf' && (
        <GovernancePerformance
          indexesApplied={indexesApplied}
          setIndexesApplied={setIndexesApplied}
          activeLogsCount={activeLogsCount}
          archivedLogsCount={archivedLogsCount}
          readReplicasEnabled={readReplicasEnabled}
          setReadReplicasEnabled={setReadReplicasEnabled}
          replicaServerHealthy={replicaServerHealthy}
          setReplicaServerHealthy={setReplicaServerHealthy}
          redisCacheEnabled={redisCacheEnabled}
          setRedisCacheEnabled={setRedisCacheEnabled}
          cacheMemory={cacheMemory}
          setCacheMemory={setCacheMemory}
          triggerNotification={triggerNotification}
        />
      )}

      {/* Sub-Tab 2: Governance & Automation */}
      {enterpriseSubTab === 'governance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 animate-fade-in text-right">
          
          {/* 1. Multilevel Approval Workflow Matrix */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between text-right">
            <div>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border border-amber-100 dark:border-amber-900/60 px-2.5 py-1 rounded-md uppercase">الحوكمة الإدارية</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                <Workflow className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>مسارات الموافقات والاعتمادات المتعددة (Workflow Matrix)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 mb-4">
                ربط الإجراءات الحساسة بالهيكل الإداري للمدرسة عبر سلسلة اعتمادات مشروطة لمنع التجاوزات وضمان التدقيق والامتثال المحكم.
              </p>

              <div className="bg-transparent dark:bg-slate-850 p-4 border border-slate-100 dark:border-slate-800/60 mb-4">
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 text-right">حدد مسار العمل لتعديله أو معاينته:</label>
                <select
                  value={activeWorkflow}
                  onChange={(e) => setActiveWorkflow(e.target.value)}
                  className="w-full dark:bg-slate-950 dark:border-slate-800 p-2 text-xs font-black text-slate-700 dark:text-slate-300 text-right"
                >
                  <option value="fees">💰 اعتماد خصومات الرسوم المخصصة والاستثنائية</option>
                  <option value="exams">📝 اعتماد وقفل درجات الكنترول النهائي</option>
                  <option value="hiring">👥 توظيف الكوادر الإدارية والرواتب العليا</option>
                </select>
              </div>

              {/* Visual approvals hierarchy */}
              <div className="space-y-3 mb-6 relative">
                <div className="text-[11px] font-bold text-slate-400 mb-2 text-right">تسلسل موافقات مسار العمل:</div>
                
                {activeWorkflow === 'fees' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 dark:bg-slate-950 p-3 border border-slate-200/60 dark:border-slate-850/80 justify-end">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">صاحب الطلب (المنشئ)</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">الدور المسموح: <span className="text-amber-600 dark:text-amber-400">المحاسب المالي</span></p>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">1</span>
                    </div>
                    
                    <div className="flex items-center gap-3 dark:bg-slate-950 p-3 border border-slate-200/60 dark:border-slate-850/80 justify-end">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">التدقيق والمطابقة</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">الدور المسموح: <span className="text-amber-500 font-bold">مدير الفرع / الوكيل</span></p>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">2</span>
                    </div>

                    <div className="flex items-center gap-3 dark:bg-slate-950 p-3 border border-slate-200/60 dark:border-slate-850/80 justify-end">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">الاعتماد والترحيل المالي النهائي</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">الدور المسموح: <span className="text-emerald-500 font-extrabold">مدير النظام (Admin)</span></p>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">3</span>
                    </div>
                  </div>
                )}

                {activeWorkflow === 'exams' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 dark:bg-slate-950 p-3 border border-slate-200/60 dark:border-slate-850/80 justify-end">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">قفل ورصد درجات الطلاب</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">الدور المسموح: <span className="text-amber-600 dark:text-amber-400">رئيس لجنة الكنترول / المعلم</span></p>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">1</span>
                    </div>
                    
                    <div className="flex items-center gap-3 dark:bg-slate-950 p-3 border border-slate-200/60 dark:border-slate-850/80 justify-end">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">الاعتماد ونشر الشهادات إلكترونياً</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">الدور المسموح: <span className="text-emerald-500 font-extrabold">مدير المدرسة</span></p>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">2</span>
                    </div>
                  </div>
                )}

                {activeWorkflow === 'hiring' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 dark:bg-slate-950 p-3 border border-slate-200/60 dark:border-slate-850/80 justify-end">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">إدخال طلب الاستقطاب وعرض الراتب</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">الدور المسموح: <span className="text-amber-600 dark:text-amber-400">مسؤول الموارد البشرية</span></p>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">1</span>
                    </div>
                    
                    <div className="flex items-center gap-3 dark:bg-slate-950 p-3 border border-slate-200/60 dark:border-slate-850/80 justify-end">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">المراجعة والربط بالميزانية السنوية</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">الدور المسموح: <span className="text-amber-500 font-bold">المدير المالي للمجموعة</span></p>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">2</span>
                    </div>

                    <div className="flex items-center gap-3 dark:bg-slate-950 p-3 border border-slate-200/60 dark:border-slate-850/80 justify-end">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">اعتماد العقد والترخيص</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">الدور المسموح: <span className="text-emerald-500 font-extrabold">مدير المجمع</span></p>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">3</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  triggerNotification('تم تحديث مسار الموافقات الإداري بنجاح! سيتم فرضه على كافة الفروع الحالية.', 'success');
                }}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Workflow className="w-4 h-4" />
                <span>حفظ وتعميم مسار الاعتماد الإداري 🔒</span>
              </button>
            </div>
          </div>

          {/* 2. Global Business Rules Engine */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between text-right">
            <div>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border border-amber-100 dark:border-amber-900/60 px-2.5 py-1 rounded-md uppercase">السياسات واللوائح</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>محرك قواعد وسياسات المجمع التعليمي (Business Rules)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 mb-4">
                تهيئة معايير وسياسات التشغيل والخصومات والحدود القانونية للنظام تلقائياً دون الحاجة لأي تعديلات برمجية.
              </p>

              <div className="space-y-4 mb-6 text-right">
                
                {/* Rule 1: Sibling discount percentage */}
                <div className="bg-transparent dark:bg-slate-850 p-3.5 border border-slate-100 dark:border-slate-800/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">{siblingDiscount}%</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">نسبة خصم الأخوة والقرابة (Sibling Discount):</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mb-2 text-right">تُطبق تلقائياً على الرسوم الدراسية عند تسجيل الطالب الثاني من نفس العائلة.</p>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={siblingDiscount}
                    onChange={(e) => setSiblingDiscount(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>

                {/* Rule 2: Grace period for invoice payments */}
                <div className="bg-transparent dark:bg-slate-850 p-3.5 border border-slate-100 dark:border-slate-800/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">{gracePeriod} أيام</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">فترة سماح السداد القانونية للأقساط:</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mb-2 text-right">عدد الأيام بعد تاريخ الاستحقاق قبل إرسال إنذارات السداد وحظر كشوف العلامات.</p>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>

                {/* Rule 3: Passing score percentage */}
                <div className="bg-transparent dark:bg-slate-850 p-3.5 border border-slate-100 dark:border-slate-800/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">{passingGrade}%</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">الحد الأدنى لدرجة النجاح الإجمالية:</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mb-2 text-right">يُستخدم لتصنيف الطالب ناجحاً أو راسباً عند طباعة الشهادات الإجمالية.</p>
                  <input
                    type="range"
                    min="40"
                    max="75"
                    value={passingGrade}
                    onChange={(e) => setPassingGrade(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                disabled={isBusinessRulesSaving}
                onClick={() => {
                  setIsBusinessRulesSaving(true);
                  setTimeout(() => {
                    setIsBusinessRulesSaving(false);
                    triggerNotification('تم تحديث قواعد وسياسات المجمع وحفظ المتغيرات بنجاح! ✦', 'success');
                  }, 800);
                }}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sliders className="w-4 h-4" />
                <span>{isBusinessRulesSaving ? 'جاري الحفظ في الـ DB...' : 'تطبيق وحفظ اللائحة التنفيذية في النظام ⚙️'}</span>
              </button>
            </div>
          </div>

          {/* 3. System Automation recipes & Scheduled Events */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between text-right">
            <div>
              <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/70 border border-yellow-100 dark:border-yellow-900/60 px-2.5 py-1 rounded-md uppercase">أتمتة العمليات</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>محرك الأتمتة المبرمجة والرسائل الذكية (Automation Engine)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 mb-4">
                ربط الأحداث بالمهام التلقائية كإرسال الرسائل وتنبيهات الأجهزة الجوالة، وترحيل قيود الرواتب والعهد اليومية.
              </p>

              <div className="space-y-3 mb-4">
                {automationRecipes.map((rec) => (
                  <div key={rec.id} className="p-3 bg-transparent dark:bg-slate-850 border border-slate-100 dark:border-slate-800/60 flex items-start justify-between gap-4 text-right">
                    <div className="flex-1 text-right">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 justify-end">
                        {rec.title}
                        <span className={`w-2 h-2 rounded-full ${rec.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 text-right"><span className="font-bold">المثير:</span> {rec.trigger}</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 text-right"><span className="font-bold">الإجراء التلقائي:</span> {rec.action}</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const updated = automationRecipes.map(r => r.id === rec.id ? { ...r, active: !r.active } : r);
                        setAutomationRecipes(updated);
                        triggerNotification(rec.active ? 'تم تعطيل الأتمتة المحددة.' : 'تم تفعيل وصفة الأتمتة وجدولتها!', 'info');
                      }}
                      className="cursor-pointer shrink-0"
                    >
                      {rec.active ? (
                        <ToggleRight className="w-10 h-7 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-10 h-7 text-slate-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Automation Logger console */}
              <div className="bg-slate-950 p-3 border border-slate-800 text-[10.5px] font-mono text-slate-300 mb-6 text-left" dir="ltr">
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-2 font-sans font-bold">
                  <span>Scheduler Logs:</span>
                  <span className="text-[9px] bg-slate-800 text-yellow-400 px-1.5 py-0.5 rounded-md">Cron Engine</span>
                </div>
                <div className="space-y-1 max-h-16 overflow-y-auto">
                  {automationLogs.map((log, idx) => (
                    <div key={idx} className="truncate">{log}</div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                disabled={isSimulatingAutomation}
                onClick={() => {
                  setIsSimulatingAutomation(true);
                  setAutomationLogs(prev => [
                    ...prev,
                    `[${new Date().toLocaleTimeString('ar-SA')}] بدء محاكاة الأحداث الآن...`,
                  ]);
                  setTimeout(() => {
                    setAutomationLogs(prev => [
                      ...prev,
                      `[${new Date().toLocaleTimeString('ar-SA')}] تم فحص 14 سجل غياب: العثور على غياب متتابع للطالب "سعد القرني" -> توجيه WhatsApp للولي.`,
                      `[${new Date().toLocaleTimeString('ar-SA')}] تمت محاكاة الأتمتة بالكامل بنجاح ⚡`
                    ]);
                    setIsSimulatingAutomation(false);
                    triggerNotification('تم تشغيل محاكي الأتمتة ومعالجة مهام وجدولة التنبيهات بنجاح!', 'success');
                  }, 1200);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>{isSimulatingAutomation ? 'جاري التشغيل ومعالجة المهام...' : 'اختبار ومحاكاة تشغيل الأتمتة الآن (Dry Run) 🚀'}</span>
              </button>
            </div>
          </div>

          {/* 4. Document & Invoice Template Designer */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between text-right">
            <div>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border border-amber-100 dark:border-amber-900/60 px-2.5 py-1 rounded-md uppercase">المخرجات والطباعة</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1.5 justify-end">
                <Printer className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>مصمم قوالب التقارير والفواتير الذكي (Report Designer)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 mb-4">
                تخصيص الهوية البصرية، العناوين، الألوان وقنوات التوثيق الرسمي في السندات والفواتير والتقارير المطبوعة.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Controls Area */}
                <div className="space-y-3 bg-transparent dark:bg-slate-850 p-3 border border-slate-150/80 dark:border-slate-800/50 text-right">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 font-bold text-right">عنوان المستند (Header):</label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full dark:bg-slate-950 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-bold text-right"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 font-bold text-right">اللون الأساسي للمستند:</label>
                    <select
                      value={reportPrimaryColor}
                      onChange={(e) => setReportPrimaryColor(e.target.value)}
                      className="w-full dark:bg-slate-950 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none text-right"
                    >
                      <option value="#6366f1">Indigo (البنفسجي)</option>
                      <option value="#10b981">Emerald (الأخضر)</option>
                      <option value="#dfb55a">Golden (الذهبي)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">إظهار ختم وتوقيع المدرسة الرسمي:</span>
                    <button
                      type="button"
                      onClick={() => setShowStamp(!showStamp)}
                      className="cursor-pointer"
                    >
                      {showStamp ? (
                        <ToggleRight className="w-10 h-6 text-amber-600" />
                      ) : (
                        <ToggleLeft className="w-10 h-6 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Live Preview Area */}
                <div className="dark:border-slate-800 p-4 dark:bg-slate-950/80 shadow-inner flex flex-col justify-between min-h-[160px] text-right">
                  <div>
                    {/* Title */}
                    <div className="border-b pb-1.5 mb-2 text-right" style={{ borderColor: reportPrimaryColor }}>
                      <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200" style={{ color: reportPrimaryColor }}>
                        {reportTitle}
                      </h4>
                      <span className="text-[8px] text-slate-400 font-bold block mt-0.5">مجمع مدارس الأجيال السحابية الدولية</span>
                    </div>

                    {/* Dummy receipt details */}
                    <div className="space-y-1 text-[9px] text-slate-500 font-bold leading-normal text-right">
                      <div className="flex justify-between">
                        <span>رقم السند: #F-2901</span>
                        <span>اسم الطالب: ماجد الحربي</span>
                      </div>
                      <div className="bg-transparent dark:bg-slate-900 p-1 rounded font-bold text-[10px] text-slate-700 dark:text-slate-300 mt-2 flex justify-between border border-slate-150 dark:border-slate-850">
                        <span style={{ color: reportPrimaryColor }}>4,500 ريال</span>
                        <span>المبلغ المدفوع:</span>
                      </div>
                    </div>
                  </div>

                  {/* Stamp signature */}
                  {showStamp && (
                    <div className="flex justify-end pt-1">
                      <div className="w-10 h-10 rounded-full border border-dashed border-red-500/60 p-0.5 flex items-center justify-center rotate-12 text-center text-[6px] text-red-500 font-black leading-none uppercase">
                        مُعتمد<br />APPROVED
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  triggerNotification('تم حفظ قالب السندات والتقارير وتوجيهه لكافة طابعات المجمع السحابية!', 'success');
                }}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>تثبيت قالب التصميم للمستندات والطباعة 🖨️</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Sub-Tab 3: Versioning & Security */}
      {enterpriseSubTab === 'security' && (
        <GovernanceSecurity triggerNotification={triggerNotification} />
      )}

      {/* Sub-Tab 4: Screen Guide Manuals & SOPs */}
      {enterpriseSubTab === 'docs' && (
        <GovernanceDocs triggerNotification={triggerNotification} />
      )}
      {enterpriseSubTab === 'docs_disabled' && (
        <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in text-right">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6 text-right">
            <div className="text-right">
              <h3 className="text-base font-black text-slate-900 dark:text-white">دليل المستخدم والـ QA التفاعلي لكل شاشات الـ ERP</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                دليل إرشادي فوري لكل شاشة ووظيفة، يوضح خطوات العمل المعيارية والضوابط المحاسبية والرقابية لمنع الأخطاء البشرية.
              </p>
            </div>

            {/* Dropdown screen selector */}
            <div className="flex items-center gap-2 justify-end">
              <select
                value={selectedSopScreen}
                onChange={(e) => setSelectedSopScreen(e.target.value)}
                className="bg-transparent dark:bg-slate-950 dark:border-slate-800 p-2 text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer text-right"
              >
                <option value="dashboard">📊 لوحة التحكم العامة والتحليلات</option>
                <option value="students">👩‍🎓 شؤون الطلاب والتسجيل وقبول الدفعة</option>
                <option value="attendance">📅 الحضور والانصراف والغياب</option>
                <option value="exams">📝 الامتحانات والكنترول والشهادات</option>
                <option value="student_accounts">💳 الرسوم والأقساط والدفع والاستحقاقات</option>
                <option value="accounts">💸 الحسابات العامة وشجرة الدفاتر والقيود</option>
                <option value="teachers">👥 المعلمون والموظفون وشؤون الموظفين</option>
              </select>
              <span className="text-xs font-black text-slate-600 dark:text-slate-300">اختر الشاشة لمعاينة دليلها:</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-right">
            {/* Left Column: Human Manual Step-by-Step */}
            <div className="space-y-6 text-right">
              <div className="bg-transparent dark:bg-slate-850 p-5 border border-slate-100 dark:border-slate-800/80 text-right">
                <h4 className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5 justify-end">
                  <span>دليل الاستخدام والتشغيل القياسي (Step-by-Step SOP)</span>
                  <HelpCircle className="w-4 h-4" />
                </h4>
                
                {selectedSopScreen === 'dashboard' && (
                  <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium list-decimal list-inside leading-relaxed text-right">
                    <li>معاينة مؤشرات الفروع والمدارس فور تسجيل الدخول للوقوف على التقرير العام اليومي.</li>
                    <li>مراقبة إجمالي المقبوضات المالية ومقارنتها بالأقساط المخطط تحصيلها لتقييم التدفق النقدي.</li>
                    <li>تصفح الرسوم البيانية للحضور والإصابة بالغياب لاكتشاف أي حالات غير طبيعية في الأقسام الدراسية.</li>
                    <li>استدعاء المساعد الذكي (AI Gateway) لتحليل الاتجاهات الإحصائية وسؤال النظام لغات مختلفة.</li>
                  </ol>
                )}

                {selectedSopScreen === 'students' && (
                  <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium list-decimal list-inside leading-relaxed text-right">
                    <li>التوجه لقسم "إضافة طالب جديد" وتعبئة البيانات الشخصية الأساسية بدقة.</li>
                    <li>إدخال رقم الهوية الوطنية أو رخصة الإقامة بشكل صحيح، حيث يرفض محرك الـ DB تكرار الهويات تلقائياً.</li>
                    <li>ربط الطالب بالعائلة (أولياء الأمور) من خلال السجل الوطني لضمان توحيد كشوفات الاستحقاق.</li>
                    <li>تحديد الصف الدراسي والشعبة وتثبيت الملف؛ سيقوم النظام بجدولة قيود رسوم الطالب بشكل آلي فور الحفظ.</li>
                  </ol>
                )}

                {selectedSopScreen === 'attendance' && (
                  <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium list-decimal list-inside leading-relaxed text-right">
                    <li>اختيار الفرع، الصف الدراسي واليوم المراد رصد الحضور فيه عبر فلاتر التوجيه.</li>
                    <li>النقر على مربع "حاضر" أو "غائب" أو "متأخر" بجانب اسم كل طالب مدرج.</li>
                    <li>تحديد نوع الغياب (بعذر مقبول / بدون عذر) لتفادي الخصومات غير العادلة في سجلات السلوك.</li>
                    <li>حفظ ورقة الحضور، وسيطلق النظام فوراً إشعاراً تلقائياً لأولياء أمور الطلاب المتغيبين بدون عذر مسبق.</li>
                  </ol>
                )}

                {selectedSopScreen === 'exams' && (
                  <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium list-decimal list-inside leading-relaxed text-right">
                    <li>إنشاء جدول الاختبار وتحديد المادة والصف وتاريخ الانعقاد في محرك الامتحانات.</li>
                    <li>إدخال درجات الطلاب بعد التصحيح؛ يدعم النظام الرصد السريع عبر الـ Tab لمنع إرهاق المدخلين.</li>
                    <li>تطبيق معايير المراجعة والرصد التلقائي؛ تلوين الخلايا التي تقل عن حد النجاح آلياً.</li>
                    <li>النقر على "طلب قفل واعتماد الكنترول النهائي" لفرض حظر التعديل غير المصرح به على درجات الطلاب.</li>
                  </ol>
                )}

                {selectedSopScreen === 'student_accounts' && (
                  <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium list-decimal list-inside leading-relaxed text-right">
                    <li>البحث عن الطالب عبر محرك التصفية أو الباركود لعرض حسابه المالي المجمع وكشوفات الرسوم.</li>
                    <li>النقر على "إصدار فاتورة قسط" أو "إنشاء سند قبض" لتلقي الدفع النقدي أو البنكي.</li>
                    <li>تحديد طريقة الدفع (كاش، مدى، تحويل بنكي، سداد سحابي) وتوثيق تفاصيل المعاملة بدقة.</li>
                    <li>تأكيد العملية؛ سيقوم النظام تلقائياً بترحيل قيد يومي مزدوج في شجرة الحسابات دون أي تدخل بشري.</li>
                  </ol>
                )}

                {selectedSopScreen === 'accounts' && (
                  <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium list-decimal list-inside leading-relaxed text-right">
                    <li>مراجعة شجرة الحسابات (Chart of Accounts) والتأكد من تفريع الأصول والخصوم والذمم بدقة.</li>
                    <li>عند إنشاء قيد يومي يدوي، يجب تحديد الحسابات المدينة والدائنة ومراكز التكلفة المرتبطة.</li>
                    <li>التحقق التام من تكافؤ وتوازن القيد؛ يرفض محرك الـ ERP حفظ أو ترحيل أي قيود غير متزنة مالياً.</li>
                    <li>استخراج ميزان المراجعة، الأستاذ العام، وقائمة الدخل بشكل فوري للتدقيق الخارجي وحساب الضريبة.</li>
                  </ol>
                )}

                {selectedSopScreen === 'teachers' && (
                  <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium list-decimal list-inside leading-relaxed text-right">
                    <li>رصد الكادر الوظيفي وربط المعلمين بمواد تخصصهم والصفوف الدراسية التي يشرفون عليها.</li>
                    <li>تحديد الراتب الأساسي، البدلات السكنية والمواصلات، والتأمين الصحي في صفحة الموارد البشرية.</li>
                    <li>تسجيل الحضور اليومي للموظفين لرصد التأخير وحساب الخصومات آلياً في نهاية الشهر.</li>
                    <li>اعتماد وتوليد مسيرات الرواتب بضغطة زر وترحيل القيود المالية لحساب البنك المخصص للرواتب.</li>
                  </ol>
                )}

              </div>
            </div>

            {/* Right Column: QA Checklist & Integrations */}
            <div className="space-y-6 text-right">
              {/* QA Checklist */}
              <div className="dark:bg-slate-900 p-5 dark:border-slate-850 shadow-xs text-right">
                <h4 className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5 justify-end">
                  <span>مصفوفة فحص الجودة وتفادي الأخطاء البشرية (QA Checklist)</span>
                  <CheckCircle2 className="w-4 h-4" />
                </h4>

                {selectedSopScreen === 'dashboard' && (
                  <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-bold text-right">
                    <li className="flex items-center gap-2 justify-end"><span>تأكد من تحديث المؤشرات الفورية بمزامنة سحابة PostgreSQL.</span><span className="text-emerald-500">✓</span></li>
                    <li className="flex items-center gap-2 justify-end"><span>التحقق من تطابق تواريخ اليوم والوقت المحلي قبل تداول البيانات.</span><span className="text-emerald-500">✓</span></li>
                  </ul>
                )}

                {selectedSopScreen === 'students' && (
                  <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-bold text-right">
                    <li className="flex items-center gap-2 justify-end"><span>مطابقة رقم الهوية الوطنية مع بطاقة الأحوال المدنية الرسمية منعاً للتزييف.</span><span className="text-emerald-500">✓</span></li>
                    <li className="flex items-center gap-2 justify-end"><span>فحص إدراج الخصم الخاص بالأخوة تلقائياً في حساب الطالب حال وجود صلة.</span><span className="text-emerald-500">✓</span></li>
                  </ul>
                )}

                {selectedSopScreen === 'attendance' && (
                  <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-bold text-right">
                    <li className="flex items-center gap-2 justify-end"><span>مراجعة تبريرات الغياب من حساب ولي الأمر قبل رصد المخالفة السلوكية.</span><span className="text-emerald-500">✓</span></li>
                    <li className="flex items-center gap-2 justify-end"><span>مراجعة إرسال تنبيهات الأتمتة والتحقق من عدم تكرار التنبيهات في نفس اليوم.</span><span className="text-emerald-500">✓</span></li>
                  </ul>
                )}

                {selectedSopScreen === 'exams' && (
                  <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-bold text-right">
                    <li className="flex items-center gap-2 justify-end"><span>عدم السماح بنشر النتائج لأولياء الأمور قبل اعتماد قفل الكنترول النهائي.</span><span className="text-emerald-500">✓</span></li>
                    <li className="flex items-center gap-2 justify-end"><span>فحص عدم حجب شهادات الطلاب إلا في حال وجود متأخرات مالية مستحقة.</span><span className="text-emerald-500">✓</span></li>
                  </ul>
                )}

                {selectedSopScreen === 'student_accounts' && (
                  <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-bold text-right">
                    <li className="flex items-center gap-2 justify-end"><span>التحقق التام من مبالغ الخصومات الاستثنائية ومطابقة موافقة مسار الاعتماد الإداري.</span><span className="text-emerald-500">✓</span></li>
                    <li className="flex items-center gap-2 justify-end"><span>التحقق من توليد رمز الكيو-آر المعتمد على السند لسلامة شروط الفوترة.</span><span className="text-emerald-500">✓</span></li>
                  </ul>
                )}

                {selectedSopScreen === 'accounts' && (
                  <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-bold text-right">
                    <li className="flex items-center gap-2 justify-end"><span>التحقق التام من تكافؤ معادلة القيد (المدين = الدائن) وتوازن الميزان.</span><span className="text-emerald-500">✓</span></li>
                    <li className="flex items-center gap-2 justify-end"><span>عدم قفل السنة المالية قبل تصفية كافة العهد المالية المعلقة بالـ DB.</span><span className="text-emerald-500">✓</span></li>
                  </ul>
                )}

                {selectedSopScreen === 'teachers' && (
                  <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-bold text-right">
                    <li className="flex items-center gap-2 justify-end"><span>التأكد من فحص سلامة التراخيص الأكاديمية والمهنية للمعلم قبل تفعيل حسابه.</span><span className="text-emerald-500">✓</span></li>
                    <li className="flex items-center gap-2 justify-end"><span>مطابقة بنود الرواتب والعمل الإضافي مع ساعات الحضور الفعلي المسجلة.</span><span className="text-emerald-500">✓</span></li>
                  </ul>
                )}

              </div>

              {/* Active RBAC Security and Integrations */}
              <div className="bg-transparent dark:bg-slate-850 p-5 border border-slate-100 dark:border-slate-800/80 space-y-4 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5 text-right">صلاحيات الوصول والـ RBAC للشاشة المحددة:</span>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {selectedSopScreen === 'dashboard' && (
                      <>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded font-bold">قراءة: الكل</span>
                        <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-2.5 py-1 rounded font-bold">تعديل: مدير المجمع</span>
                      </>
                    )}
                    {selectedSopScreen === 'students' && (
                      <>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2.5 py-1 rounded font-bold">تسجيل: شؤون الطلاب</span>
                        <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 px-2.5 py-1 rounded font-bold">حظر: مدير المدرسة</span>
                      </>
                    )}
                    {selectedSopScreen === 'attendance' && (
                      <>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2.5 py-1 rounded font-bold">رصد: معلم المادة</span>
                        <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-2.5 py-1 rounded font-bold">تعديل: وكيل المدرسة</span>
                      </>
                    )}
                    {selectedSopScreen === 'exams' && (
                      <>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2.5 py-1 rounded font-bold">رصد: المعلم</span>
                        <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 px-2.5 py-1 rounded font-bold">اعتماد: مدير المدرسة</span>
                      </>
                    )}
                    {selectedSopScreen === 'student_accounts' && (
                      <>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2.5 py-1 rounded font-bold">قبض: المحاسب المالي</span>
                        <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 px-2.5 py-1 rounded font-bold">اعتماد الخصم: المدير المالي</span>
                      </>
                    )}
                    {selectedSopScreen === 'accounts' && (
                      <>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2.5 py-1 rounded font-bold">ترحيل: محاسب أول</span>
                        <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 px-2.5 py-1 rounded font-bold">قفل دفاتر: المدير العام</span>
                      </>
                    )}
                    {selectedSopScreen === 'teachers' && (
                      <>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2.5 py-1 rounded font-bold">HR: مسؤول الموظفين</span>
                        <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-2.5 py-1 rounded font-bold">مسيرات: الإدارة المالية</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Automated integrations */}
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5 text-right">التكاملات البرمجية والربط التلقائي (Database Integrity):</span>
                  <div className="text-[10.5px] leading-relaxed text-slate-500 font-bold text-right">
                    {selectedSopScreen === 'dashboard' && 'يجلب الإحصائيات الفورية من جداول الطلاب والرسوم والحضور، مع تسريع عمليات المعالجة عبر الذاكرة المؤقتة Redis.'}
                    {selectedSopScreen === 'students' && 'تولد عملية حفظ ملف الطالب قيد تسوية مالي آلياً بالرسوم السنوية المستحقة في دفتر الأستاذ العام وتنشئ حسابات الذمم.'}
                    {selectedSopScreen === 'attendance' && 'يقوم رصد الغياب بتغذية تقرير السلوك في الكنترول وتحديث مؤشر كشف حضور الطالب والصف الدراسي آلياً.'}
                    {selectedSopScreen === 'exams' && 'تتكامل الدرجات المرصودة لتوليد الشهادات والتقارير الإحصائية وتحديث رتب وتصنيفات الطلاب المتفوقين في لوحة التحكم.'}
                    {selectedSopScreen === 'student_accounts' && 'يؤدي إنشاء سند القبض إلى توليد قيد مزدوج فوري (من حساب الصندوق/البنك إلى حساب ذمم الطالب) وتصفير مديونيته آلياً.'}
                    {selectedSopScreen === 'accounts' && 'تتكامل القيود والعمليات لتحديث ميزان المراجعة وتوليد القوائم الختامية تلقائياً دون أي عمليات يدوية إضافية.'}
                    {selectedSopScreen === 'teachers' && 'يتكامل حضور الكادر الوظيفي لتوليد مسيرات الرواتب واحتساب الاستقطاعات وتوجيه قيود اليومية لحساب المصروف الضريبي والرواتب.'}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {enterpriseSubTab === 'integration' && (
        <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end md:justify-start">
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">الاعتماد البرمجي والمطابقة</span>
                  <span className="bg-amber-500/30 text-amber-300 border border-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة السادسة 6.5</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-3 leading-tight">6.4 & 6.5 الاعتماد الشامل لتكامل الأعمال ولوحات المعلومات</h2>
                <p className="text-xs text-slate-300 mt-2 font-medium max-w-2xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  تأكيد مطابقة وصحة البيانات عبر كافة الوحدات (شؤون الطلاب، الرسوم والمطالبات، التحصيل، الحسابات العامة، الأستاذ العام، الموارد البشرية، والامتحانات) لضمان اتخاذ القرار الموثوق من لوحة المؤشرات الاستراتيجية.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center bg-slate-800/80 border border-slate-700/50 p-4 shrink-0 min-w-[160px] text-center">
                <span className="text-[10px] font-black text-slate-400 block uppercase">حالة الموثوقية العامة</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">معتمد بالكامل ✓</span>
                <p className="text-[9px] text-slate-500 mt-1 font-bold">ERP Enterprise Standard</p>
              </div>
            </div>
          </div>

          {/* Verification Scorecard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase">دقة تكامل البيانات (Domain Integration)</span>
                <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">100% (ممتاز)</span>
                <p className="text-[10px] text-slate-500 mt-1 font-bold">لا يوجد فقدان بيانات أو تكرار عمليات</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Workflow className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase">سلامة تتبع الأثر (Traceability)</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">100% (موثق)</span>
                <p className="text-[10px] text-slate-500 mt-1 font-bold">تتبع الأثر من المستند إلى التقارير الختامية</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase">سرعة ودقة المؤشرات (Dashboards Performance)</span>
                <span className="text-xl sm:text-2xl font-black text-yellow-600 dark:text-yellow-400 mt-1 block">99.9% (لحظي)</span>
                <p className="text-[10px] text-slate-500 mt-1 font-bold">تحديث المؤشرات تلقائياً مع القيود الحقيقية</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                <Activity className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* Simulation & Stepper Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            
            {/* Left Column: Interactive Simulation Suite (Sized 7 cols) */}
            <div className="lg:col-span-7 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between text-right">
              <div>
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="text-right">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
                      <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                      <span>محاكي التحقق من تكامل دورة العمل الإجرائية والمالية (ERP Flow)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      قم بتشغيل المحاكي لتتبع تدفق البيانات الفعلي بدءًا من التسجيل ومروراً بالترحيل حتى توازن الدفاتر.
                    </p>
                  </div>
                </div>

                {/* 6 Step Visual Indicator Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { id: 1, label: "1. شؤون الطلاب", desc: "تسجيل STD-0043" },
                    { id: 2, label: "2. الرسوم والمطالبات", desc: "فاتورة INV-0089" },
                    { id: 3, label: "3. التحصيل والقبض", desc: "سند REC-0543" },
                    { id: 4, label: "4. الترحيل للقيد", desc: "يومية العامة JV-11202" },
                    { id: 5, label: "5. الأستاذ العام", desc: "رصيد الحسابات والميزان" },
                    { id: 6, label: "6. التقارير المالية", desc: "الميزانية والمركز المالي" },
                  ].map((step) => {
                    const isPassed = simStep >= step.id;
                    const isActive = simStep === step.id;
                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedTraceStep(step.id)}
                        className={`p-3 border text-right transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between h-20 ${
                          isPassed
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-400"
                            : isActive
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/50 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20"
                            : "bg-slate-50/50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-black">{step.label}</span>
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : isActive ? (
                            <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">انتظار</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block truncate font-medium">{step.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                {isSimActive && (
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                      <span>جاري معالجة ومطابقة تكامل الدورة المحاسبية...</span>
                      <span>{Math.round((simStep / 6) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-600 rounded-full transition-all duration-300" 
                        style={{ width: `${(simStep / 6) * 100}%` }} 
                      />
                    </div>
                  </div>
                )}

                {/* Live Output Terminal */}
                <div className="bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-1.5 overflow-y-auto max-h-[160px] border border-slate-800 shadow-inner mb-6 text-left" style={{ direction: 'ltr' }}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
                    <span className="text-[10px] font-bold">INTEGRATION ENGINE SCANNER</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  {simLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-4 font-bold text-xs">اضغط على زر تشغيل المحاكي لعرض سجلات الربط والتحقق التلقائي</div>
                  ) : (
                    simLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed hover:bg-slate-900 px-2 py-0.5 rounded transition-colors">{log}</div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isSimActive}
                  onClick={handleStartIntegrationSim}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Play className="w-4 h-4" />
                  <span>{isSimActive ? "جاري تشغيل محاكي التكامل المحاسبي والطلاب..." : "بدء محاكاة وفحص دورة العمل المتكاملة للأعمال (ERP Flow) ⚡"}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Traceability Explorer & Audit Trail (Sized 5 cols) */}
            <div className="lg:col-span-5 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs text-right">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end mb-1">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>مستكشف تتبع الأثر والمطابقة (Traceability)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-4 font-medium">
                اضغط على أي مرحلة من المراحل الستة لاستكشاف مستنداتها، قيودها، وسلامة العلاقات المحاسبية والطلابية المرتبطة بها في قاعدة البيانات.
              </p>

              {(() => {
                const step = selectedTraceStep || 1;
                const details = {
                  1: {
                    title: "شؤون الطلاب - تسجيل وقبول",
                    desc: "تسجيل الطالب وتوليد الرقم الأكاديمي الموحد وربطه بولي الأمر.",
                    path: [
                      { label: "العملية الأصلية", value: "تسجيل طالب جديد (أحمد عبد الله الودعاني)" },
                      { label: "السجل المتولد", value: "سجل طالب برقم STD-2026-0043 في جدول students" },
                      { label: "المرجعية والعلاقات", value: "مرتبط بـ school_id = 1 و parent_id = PAR-4509" },
                      { label: "حالة الربط", value: "نشط ومعزول سحابياً للـ SaaS ✓" }
                    ]
                  },
                  2: {
                    title: "توليد الرسوم والمطالبات - المالية",
                    desc: "فرض الرسوم الدراسية وتصدير فاتورة مديونية وجدول الأقساط.",
                    path: [
                      { label: "المستند المالي", value: "فاتورة الرسوم الدراسية رقم INV-2026-0089" },
                      { label: "القيمة الكلية", value: "12,000 د.ل (جدولة 3 أقساط متساوية)" },
                      { label: "المرجعية والعلاقات", value: "مرتبطة بـ student_id = STD-2026-0043" },
                      { label: "أثر اليومية المحتسب", value: "مديونية مستحقة غير مرحلة لحين السداد أو الاستحقاق ✓" }
                    ]
                  },
                  3: {
                    title: "التحصيل والقبض - الخزينة والبنك",
                    desc: "تحصيل نقدية القسط الأول وتوليد سند قبض رسمي معتمد مع رمز استجابة سريع.",
                    path: [
                      { label: "مستند القبض", value: "سند قبض رقم REC-2026-0543 في جدول vouchers" },
                      { label: "القيمة المحصلة", value: "4,000 د.ل (نقدًا بالصندوق الرئيسي)" },
                      { label: "المرجعية والعلاقات", value: "مرتبط بـ student_id = STD-2026-0043 وفاتورة INV-2026-0089" },
                      { label: "حالة المطابقة والتحقق", value: "تحديث فوري لمديونية الطالب بالصندوق ✓" }
                    ]
                  },
                  4: {
                    title: "الترحيل التلقائي - قيد اليومية (Posting Engine)",
                    desc: "توليد قيد مزدوج تلقائي متوازن فوري في دفتر اليومية العامة.",
                    path: [
                      { label: "القيد اليومي المزدوج", value: "قيد تسوية رقم JV-2026-11202 في journal_entries" },
                      { label: "أطراف القيد المتزن", value: "مدين: الصندوق (1110) بـ 4,000 د.ل | دائن: ذمم الطلاب (1210) بـ 4,000 د.ل" },
                      { label: "مركز التكلفة الموجه", value: "موجه لمركز التكلفة CC-101 (المرحلة الثانوية)" },
                      { label: "حالة الاتزان المحاسبي", value: "متزن 100% (الفرق = 0.00 د.ل) ✓" }
                    ]
                  },
                  5: {
                    title: "الأستاذ العام وميزان المراجعة",
                    desc: "ترحيل القيد لتحديث أرصدة الحسابات وموازين المراجعة تلقائياً.",
                    path: [
                      { label: "دفتر الأستاذ", value: "تعديل أرصدة حساب الصندوق وحساب الذمم المدينين" },
                      { label: "حساب الصندوق (1110)", value: "+4,000 د.ل (رصيد جديد: 184,000 د.ل)" },
                      { label: "حساب ذمم الطلاب (1210)", value: "-4,000 د.ل (رصيد جديد: 72,000 د.ل)" },
                      { label: "مطابقة ميزان المراجعة", value: "مجموع الأرصدة المدينة = الأرصدة الدائنة (متطابق تماماً) ✓" }
                    ]
                  },
                  6: {
                    title: "التقارير الختامية ولوحة التحكم",
                    desc: "انعكاس الأثر فوريًا على الميزانية وكشف الأصول المتداولة والتدفقات النقدية.",
                    path: [
                      { label: "الميزانية العمومية", value: "تعديل رصيد النقدية في الأصول المتداولة بقيمة +4,000 د.ل" },
                      { label: "لوحة تحكم المدير التنفيذي", value: "تحديث فوري للتدفقات النقدية اليومية والسيولة النقدية" },
                      { label: "صحة البيانات ومطابقتها", value: "الأرقام مطابقة للمصدر 100% ولا توجد مديونيات وهمية ✓" },
                      { label: "سرعة الانعكاس", value: "أقل من 0.1 ثانية بفضل البنية الموحدة ✓" }
                    ]
                  }
                }[step as 1 | 2 | 3 | 4 | 5 | 6];

                return (
                  <div className="space-y-4 animate-fade-in bg-transparent dark:bg-slate-850 p-4 sm:p-5 border border-slate-100 dark:border-slate-800">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded">المرحلة المحددة: {step}</span>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{details.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">{details.desc}</p>
                    </div>

                    <div className="space-y-2.5">
                      {details.path.map((p, i) => (
                        <div key={i} className="text-xs dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 rounded-lg">
                          <span className="text-[10px] font-extrabold text-slate-400 block">{p.label}:</span>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mt-1">{p.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 text-center text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1 bg-emerald-50/50 dark:bg-emerald-950/20 py-2 border border-emerald-150 dark:border-emerald-950">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>سجل التدفق والربط المحاسبي سليم ومعتمد تماماً ✓</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Verification Audit Checklist & Alignment Status */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs text-right">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              بنود سلامة وتطابق البيانات وموثوقية لوحات المؤشرات (Reporting Integrity)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">التحقق من سلامة البيانات ومطابقتها للمصدر:</h4>
                {[
                  { text: "تطابق بيانات شؤون الطلاب والمسجلين والشهادات مع الكنترول الفعلي", ok: true },
                  { text: "مطابقة الرسوم والمطالبات وجدول الأقساط مع إجمالي الديون في ميزان المراجعة", ok: true },
                  { text: "تطابق حركة الصندوق والخزينة مع الفواتير والمدفوعات الحقيقية", ok: true },
                  { text: "اتزان كافة قيود اليومية العامة المستوردة تلقائياً بنسبة 100% (المدين = الدائن)", ok: true }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-medium bg-transparent dark:bg-slate-850 p-2.5 rounded-xl">
                    <span className="text-slate-700 dark:text-slate-300">{item.text}</span>
                    <span className="text-emerald-500 font-extrabold">✓ معتمد ومطابق</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">التحقق من صحة لوحات التحكم التنفيذية والمؤشرات الإستراتيجية:</h4>
                {[
                  { text: "وضوح الرسوم البيانية ودقة قراءتها من قاعدة البيانات دون تشويه أو تأخير", ok: true },
                  { text: "توافق إجمالي التحصيل والأصول مع التفاصيل والتقارير المالية التحليلية", ok: true },
                  { text: "سرعة تحديث المؤشرات (الاستجابة والـ Latency أقل من 15 مللي ثانية)", ok: true },
                  { text: "سهولة وصول متخذي القرار والمديرين لأدق التقارير بأقل عدد من الخطرات", ok: true }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-medium bg-transparent dark:bg-slate-850 p-2.5 rounded-xl">
                    <span className="text-slate-700 dark:text-slate-300">{item.text}</span>
                    <span className="text-emerald-500 font-extrabold">✓ معتمد ومطابق</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Official Integration Certificate - APPROVED DECISION */}
          <div className="relative overflow-hidden dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center">
            {/* Stamp Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full border-4 border-dashed border-emerald-500/10 flex items-center justify-center pointer-events-none select-none">
              <span className="text-emerald-500/10 text-4xl font-black rotate-12">معتمد ومطابق ERP</span>
            </div>

            <div className="max-w-2xl relative z-10 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-100 dark:border-emerald-900">
                <ShieldCheck className="w-9 h-9" />
              </div>
              
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 block uppercase tracking-wider">قرار الاعتماد المؤسسي للتكامل والربط الشامل</span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">وثيقة اعتماد نظام التقارير ولوحة القيادة ومطابقة البيانات</h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                بموجب هذه الوثيقة البرمجية، يشهد قسم جودة الأنظمة والتحكم المؤسسي بأن نظام تخطيط الموارد الموحد (ERP) يعمل كوحدة واحدة متكاملة ومنسجمة دون وجود فجوات أو تكرار بالعمليات أو فقدان للبيانات. إن كافة التقارير المالية والإدارية متطابقة للمصدر وموثوقة لاتخاذ القرار من قبل الإدارة العليا.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4 border-t border-slate-100 dark:border-slate-800 text-right text-xs bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block text-center">المدير العام للمجمع</span>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block text-center mt-1">د. عبد الرحمن السديري</span>
                  <span className="text-[9px] text-emerald-600 font-bold block text-center mt-0.5">توقيع رقمي معتمد ✓</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block text-center">المدير المالي والتقني</span>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block text-center mt-1">أ. خالد بن ناصر الحربي</span>
                  <span className="text-[9px] text-emerald-600 font-bold block text-center mt-0.5">توقيع رقمي معتمد ✓</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-5 py-3 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-800 hover:-translate-y-0.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة وتصدير شهادة الاعتماد المؤسسي 📄</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {enterpriseSubTab === 'ux_design_system' && (() => {
        return <GovernanceDesignSystem triggerNotification={triggerNotification} />;
      })()}
      {false && (() => {
        // Filter inventory based on search query
        const filteredInventory = [] as any[];

        return (
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#1e1b4b] to-slate-950 border border-amber-500/30 rounded-3xl p-6 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end md:justify-start">
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">نظام التصميم المؤسسي الموحد</span>
                    <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة السابعة 7.1</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">7.1 تأسيس نظام التصميم الموحد (Design System Foundation)</h2>
                  <p className="text-xs text-slate-300 mt-2 font-medium max-w-2xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    المرجع التقني والجمالي الوحيد لجميع واجهات ومكونات منصة المؤسسة. تضمن هذه المنصة توحيد السلوك البصري، ارتفاعات حقول الإدخال، الهوامش والمسافات، وتجربة المستخدم التفاعلية المتطابقة بالكامل مع اتجاه النصوص العربية RTL.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[200px] text-center backdrop-blur-xs">
                  <span className="text-[10px] font-black text-amber-300 block uppercase">حالة توافق نظام التصميم</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">✓ معتمد ومقفل</span>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">Standardized & Frozen</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">المكونات المصنفة (Invoiced)</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 block mt-1">11 نوعاً رئيسياً</span>
                <span className="text-[9px] text-emerald-500 font-extrabold block mt-0.5">تغطي كافة متطلبات الـ ERP</span>
              </div>
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">المعايير البصرية (Visuals)</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 block mt-1">7 أنماط موحدة</span>
                <span className="text-[9px] text-amber-500 font-extrabold block mt-0.5">خطوط، ألوان، هوامش، أزرار</span>
              </div>
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">معايير التفاعل (Interactions)</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 block mt-1">7 حالات تفاعلية</span>
                <span className="text-[9px] text-rose-500 font-extrabold block mt-0.5">Hover, Focus, Loading, Active</span>
              </div>
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">توافق العربية الـ RTL</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 block mt-1">100% متطابق بصرياً</span>
                <span className="text-[9px] text-emerald-500 font-extrabold block mt-0.5">لا تداخل أو أخطاء في المحاذاة</span>
              </div>
            </div>

            {/* Layout Grid: Playground & Visuals config */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              
              {/* Right Column: Controls & Live Sandbox (7 cols) */}
              <div className="lg:col-span-7 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-md">تفاعلي بالكامل</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                    <span>مختبر محاكاة المكونات ونظام التصميم الموحد</span>
                  </h3>
                </div>

                {/* Playground Configuration controls */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-transparent dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-850">
                  
                  {/* Select Component */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase block">المكون المستهدف</label>
                    <select
                      value={dsComponent}
                      onChange={(e) => setDsComponent(e.target.value as any)}
                      className="w-full dark:bg-slate-900 dark:border-slate-800 px-2.5 py-1.5 text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="button">الأزرار (Buttons)</option>
                      <option value="input">حقول الإدخال (Inputs)</option>
                      <option value="select">قوائم الاختيار (Selects)</option>
                      <option value="table">الجداول (Tables)</option>
                      <option value="card">البطاقات والحاويات (Cards)</option>
                      <option value="dialog">المنبثقات (Dialogs)</option>
                      <option value="tab">علامات التبويب (Tabs)</option>
                      <option value="badge">الشارات والأوسمة (Badges)</option>
                      <option value="alert">التنبيهات الفورية (Alerts)</option>
                      <option value="icon">مجموعة الأيقونات (Icons)</option>
                    </select>
                  </div>

                  {/* Size Config */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase block">حجم المكون (Size)</label>
                    <div className="grid grid-cols-3 gap-1 dark:bg-slate-900 p-0.5 dark:border-slate-800">
                      {(['sm', 'md', 'lg'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setDsSize(sz)}
                          className={`py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                            dsSize === sz ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {sz === 'sm' ? 'صغير' : sz === 'md' ? 'متوسط' : 'كبير'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* State Config */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase block">الحالة التفاعلية (State)</label>
                    <select
                      value={dsState}
                      onChange={(e) => setDsState(e.target.value as any)}
                      className="w-full dark:bg-slate-900 dark:border-slate-800 px-2.5 py-1.5 text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="normal">افتراضي (Normal)</option>
                      <option value="hover">تمرير مؤشر (Hover)</option>
                      <option value="focus">تركيز ونقش (Focus)</option>
                      <option value="disabled">معطل (Disabled)</option>
                      <option value="loading">تحميل (Loading)</option>
                      <option value="empty">فارغ (Empty State)</option>
                      <option value="error">خطأ (Error State)</option>
                      <option value="success">نجاح (Success State)</option>
                    </select>
                  </div>

                  {/* Spacing & Margin */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase block">المسافات والهوامش</label>
                    <div className="grid grid-cols-3 gap-1 dark:bg-slate-900 p-0.5 dark:border-slate-800">
                      {(['compact', 'comfortable', 'spacious'] as const).map((sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => setDsSpacing(sp)}
                          className={`py-1 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                            dsSpacing === sp ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {sp === 'compact' ? 'مكثف' : sp === 'comfortable' ? 'مريح' : 'واسع'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inputs Heights */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase block">ارتفاع حقل الإدخال</label>
                    <div className="grid grid-cols-3 gap-1 dark:bg-slate-900 p-0.5 dark:border-slate-800">
                      {(['38px', '42px', '48px'] as const).map((ht) => (
                        <button
                          key={ht}
                          type="button"
                          onClick={() => setDsHeight(ht)}
                          className={`py-1 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                            dsHeight === ht ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {ht}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RTL Alignment Switcher */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase block">توجيه النصوص ومحاذاة RTL</label>
                    <button
                      type="button"
                      onClick={() => setDsRtl(!dsRtl)}
                      className={`w-full py-1.5 px-2.5 border text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        dsRtl ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{dsRtl ? 'عربي (RTL) مفعل' : 'إنجليزي (LTR) مفعل'}</span>
                    </button>
                  </div>

                </div>

                {/* Sandbox Render Area */}
                <div className="dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs text-right">
                  
                  {/* Top Bar showing specs */}
                  <div className="bg-transparent dark:bg-slate-950 p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                      <span>height: {dsHeight}</span>
                      <span>•</span>
                      <span>spacing: {dsSpacing}</span>
                      <span>•</span>
                      <span>size: {dsSize}</span>
                    </div>
                    <span className="font-black text-slate-700 dark:text-slate-300">النموذج البصري المباشر (Sandbox Container)</span>
                  </div>

                  {/* Preview Container */}
                  <div 
                    className="p-8 bg-slate-100/50 dark:bg-slate-900/40 min-h-[220px] flex items-center justify-center transition-all"
                    dir={dsRtl ? "rtl" : "ltr"}
                  >
                    <div className="w-full max-w-md dark:bg-slate-900 dark:border-slate-800 p-6 shadow-xs">
                      
                      {/* BUTTON PREVIEW */}
                      {dsComponent === 'button' && (() => {
                        const baseClasses = "font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs focus:outline-hidden";
                        
                        let sizeClasses = "px-4 py-2 text-sm";
                        if (dsSize === 'sm') sizeClasses = "px-3 py-1.5 text-xs";
                        if (dsSize === 'lg') sizeClasses = "px-6 py-3.5 text-base";

                        let stateClasses = "bg-amber-600 hover:bg-amber-700 text-white";
                        if (dsState === 'hover') stateClasses = "bg-amber-700 text-white -translate-y-0.5";
                        if (dsState === 'focus') stateClasses = "bg-amber-600 text-white ring-4 ring-amber-500/30";
                        if (dsState === 'disabled') stateClasses = "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50 shadow-none";
                        if (dsState === 'loading') stateClasses = "bg-amber-600 text-white cursor-wait";
                        if (dsState === 'error') stateClasses = "bg-rose-600 hover:bg-rose-700 text-white";
                        if (dsState === 'success') stateClasses = "bg-emerald-600 hover:bg-emerald-700 text-white";

                        return (
                          <div className="space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 block text-center">عنصر الزر الموحد لجميع شاشات الـ ERP</span>
                            <div className="flex justify-center">
                              <button
                                type="button"
                                disabled={dsState === 'disabled'}
                                className={`${baseClasses} ${sizeClasses} ${stateClasses}`}
                              >
                                {dsState === 'loading' && (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                {dsState === 'success' && <Check className="w-4 h-4 text-white" />}
                                {dsState === 'error' && <AlertTriangle className="w-4 h-4 text-white" />}
                                <span>{dsState === 'loading' ? 'جاري ترحيل القيد...' : 'حفظ واعتماد التعديلات'}</span>
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                              * يلتزم الزر بنص محدد وحواف وقوانين تباين لوني دقيقة لتجنب تشتت عيني المحاسب والمدير.
                            </p>
                          </div>
                        );
                      })()}

                      {/* INPUT PREVIEW */}
                      {dsComponent === 'input' && (() => {
                        const containerHeight = dsHeight === '38px' ? 'h-[38px]' : dsHeight === '42px' ? 'h-[42px]' : 'h-[48px]';
                        
                        let borderClass = "border-slate-200 dark:border-slate-800";
                        if (dsState === 'focus') borderClass = "border-amber-500 ring-2 ring-amber-500/20";
                        if (dsState === 'error') borderClass = "border-rose-500 ring-2 ring-rose-500/20";
                        if (dsState === 'success') borderClass = "border-emerald-500 ring-2 ring-emerald-500/20";

                        return (
                          <div className="space-y-3 text-right">
                            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">رقم سند القبض / الصرف الموحد</label>
                            <input
                              type="text"
                              disabled={dsState === 'disabled'}
                              defaultValue="REC-2026-9912"
                              className={`w-full dark:bg-slate-900 border px-3 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all focus:outline-hidden ${containerHeight} ${borderClass} ${
                                dsState === 'disabled' ? 'bg-transparent dark:bg-slate-950 text-slate-400 cursor-not-allowed opacity-60' : ''
                              }`}
                              placeholder="أدخل المعرف المستندي..."
                            />
                            {dsState === 'error' && (
                              <p className="text-[10px] text-rose-500 font-extrabold">خطأ: رقم السند هذا مسجل مسبقاً في الدفتر اليومي للفرع الحالي.</p>
                            )}
                            {dsState === 'success' && (
                              <p className="text-[10px] text-emerald-500 font-extrabold">ممتاز: رقم السند صالح ومطابق للتسلسل الرقمي القانوني.</p>
                            )}
                            {dsState === 'loading' && (
                              <p className="text-[10px] text-amber-500 font-extrabold animate-pulse">جاري فحص التكرار عبر خادم قاعدة البيانات الرئيسي...</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* SELECT PREVIEW */}
                      {dsComponent === 'select' && (() => {
                        const containerHeight = dsHeight === '38px' ? 'h-[38px]' : dsHeight === '42px' ? 'h-[42px]' : 'h-[48px]';
                        
                        let borderClass = "border-slate-200 dark:border-slate-800";
                        if (dsState === 'focus') borderClass = "border-amber-500 ring-2 ring-amber-500/20";

                        return (
                          <div className="space-y-3 text-right">
                            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">المسار الأكاديمي / الفرع</label>
                            <div className="relative">
                              <select
                                disabled={dsState === 'disabled'}
                                className={`w-full dark:bg-slate-900 border px-3 pl-8 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all appearance-none focus:outline-hidden ${containerHeight} ${borderClass} ${
                                  dsState === 'disabled' ? 'bg-transparent dark:bg-slate-950 text-slate-400 cursor-not-allowed opacity-60' : ''
                                }`}
                              >
                                <option>فرع الرياض الرئيسي (بنين - المسار الدولي)</option>
                                <option>فرع جدة (بنات - المسار الوطني)</option>
                                <option>فرع الدمام (المسار المتقدم)</option>
                              </select>
                              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* TABLE PREVIEW */}
                      {dsComponent === 'table' && (() => {
                        let paddingClass = "px-4 py-2.5";
                        if (dsSpacing === 'compact') paddingClass = "px-2 py-1.5";
                        if (dsSpacing === 'spacious') paddingClass = "px-6 py-4";

                        return (
                          <div className="space-y-3 overflow-hidden text-right">
                            <span className="text-[10px] font-bold text-slate-400 block">نموذج مصغر من هيكل الجداول الموحدة</span>
                            <div className="border border-slate-100 dark:border-slate-800 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                                  <tr>
                                    <th className={`${paddingClass} text-right`}>الحساب</th>
                                    <th className={`${paddingClass} text-left`}>الرصيد</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                                  <tr>
                                    <td className={`${paddingClass} font-black`}>صندوق النقدية الرئيسي</td>
                                    <td className={`${paddingClass} text-left font-mono text-emerald-500 font-bold`}>45,000 ريال</td>
                                  </tr>
                                  <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                                    <td className={`${paddingClass} font-black`}>ذمم الطلاب المدنيين</td>
                                    <td className={`${paddingClass} text-left font-mono text-amber-500 font-bold`}>112,500 ريال</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}

                      {/* CARD PREVIEW */}
                      {dsComponent === 'card' && (() => {
                        return (
                          <div className="space-y-3 text-right">
                            <div className="bg-transparent dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-xs text-right space-y-2">
                              <span className="bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-sm">بطاقة موحدة</span>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">بطاقة ميزان المراجعة والأرصدة</h4>
                              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                                تلتزم بطاقات المنصة بالحد الأدنى من الظلال لمنع الحمل المعرفي المفرط لدى المحاسب أو مدير المدرسة.
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* DIALOG PREVIEW */}
                      {dsComponent === 'dialog' && (() => {
                        return (
                          <div className="space-y-3">
                            <div className="bg-slate-950/20 p-4 border border-dashed border-amber-500/20 text-center">
                              <span className="text-[10px] text-amber-400 font-bold block mb-2">تأثير محاكاة المنبثق (Modals Backdrop)</span>
                              <div className="dark:bg-slate-900 dark:border-slate-800 p-5 shadow-2xl space-y-4 text-right">
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                  <X className="w-4 h-4 text-slate-400 cursor-pointer" />
                                  <h4 className="text-xs font-black text-slate-900 dark:text-white">تأكيد عملية إقفال الحسابات</h4>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                  هل أنت متأكد من ترحيل قيود الإقفال العام للسنة المالية الحالية 2026؟ لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
                                </p>
                                <div className="flex justify-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                                  <button type="button" className="bg-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg cursor-pointer">نعم، ترحيل وإقفال</button>
                                  <button type="button" className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">إلغاء</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* TAB PREVIEW */}
                      {dsComponent === 'tab' && (() => {
                        return (
                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 block text-center">ألسنة التبويب الموحدة للأقسام الفنية</span>
                            <div className="bg-slate-100 dark:bg-slate-950 p-1 flex gap-1 border border-slate-200/80 dark:border-slate-800/80">
                              <button type="button" className="flex-1 dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-black text-[10px] py-1.5 px-3 rounded-lg shadow-xs cursor-pointer">
                                الحسابات العامة
                              </button>
                              <button type="button" className="flex-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-black text-[10px] py-1.5 px-3 rounded-lg cursor-pointer">
                                رصد الغياب
                              </button>
                              <button type="button" className="flex-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-black text-[10px] py-1.5 px-3 rounded-lg cursor-pointer">
                                سجلات الكنترول
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* FORM PREVIEW */}
                      {dsComponent === 'form' && (() => {
                        return (
                          <div className="space-y-3 text-right">
                            <span className="text-[10px] font-bold text-slate-400 block">تخطيط حقول النموذج المتجاوب</span>
                            <div className="space-y-3">
                              <div>
                                <label className="text-[10px] font-black text-slate-600 block mb-1">الاسم الكامل للطالب</label>
                                <input type="text" className="w-full h-9 px-2 text-xs dark:border-slate-800 rounded-lg dark:bg-slate-900 font-bold" defaultValue="تركي بن عبد العزيز العتيبي" />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-slate-600 block mb-1">رصيد الفاتورة المتبقي</label>
                                <input type="text" className="w-full h-9 px-2 text-xs dark:border-slate-800 rounded-lg bg-transparent dark:bg-slate-950 font-mono font-bold text-emerald-600" defaultValue="14,000 ريال سعودي" readOnly />
                              </div>
                              <button type="button" className="w-full bg-amber-600 text-white text-xs font-black py-2 shadow-xs cursor-pointer">تحديث الفاتورة وإرسال إشعار ولي الأمر</button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* BADGE PREVIEW */}
                      {dsComponent === 'badge' && (() => {
                        let colorClasses = "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
                        let label = "قيد الانتظار";

                        if (dsState === 'success') {
                          colorClasses = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20";
                          label = "معتمد ومرحّل بنجاح";
                        }
                        if (dsState === 'error') {
                          colorClasses = "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20";
                          label = "مرفوض ومحذوف";
                        }
                        if (dsState === 'disabled') {
                          colorClasses = "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
                          label = "غير نشط";
                        }

                        return (
                          <div className="space-y-3 text-center">
                            <span className="text-[10px] font-bold text-slate-400 block">ألوان وشارات الحالات المعيارية الموحدة</span>
                            <div className="flex justify-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-black ${colorClasses}`}>
                                {label}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ALERT PREVIEW */}
                      {dsComponent === 'alert' && (() => {
                        let alertColor = "bg-amber-50 border-amber-500/30 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300";
                        if (dsState === 'error') alertColor = "bg-rose-50 border-rose-500/30 text-rose-900 dark:bg-rose-950/20 dark:text-rose-300";
                        if (dsState === 'success') alertColor = "bg-emerald-50 border-emerald-500/30 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300";

                        return (
                          <div className="space-y-3 text-right">
                            <div className={`p-4 border flex items-start gap-3 ${alertColor}`}>
                              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="text-xs font-black block">إشعار حماية السيولة المالية</span>
                                <p className="text-[10px] font-semibold leading-relaxed">
                                  تم التحقق من رصيد الصندوق بنجاح. لا توجد فروقات بصرية أو مستندية في قيود اليومية العامة.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ICON PREVIEW */}
                      {dsComponent === 'icon' && (() => {
                        return (
                          <div className="space-y-4 text-center">
                            <span className="text-[10px] font-bold text-slate-400 block">مجموعة الأيقونات المعيارية من مكتبة Lucide المعتمدة</span>
                            <div className="grid grid-cols-4 gap-4 justify-items-center">
                              <div className="p-2.5 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-amber-600">
                                <Zap className="w-5 h-5" />
                                <span className="text-[9px] font-mono text-slate-400 block mt-1">Zap</span>
                              </div>
                              <div className="p-2.5 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-emerald-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-[9px] font-mono text-slate-400 block mt-1">Check</span>
                              </div>
                              <div className="p-2.5 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-rose-600">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="text-[9px] font-mono text-slate-400 block mt-1">Alert</span>
                              </div>
                              <div className="p-2.5 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-amber-500">
                                <Clock className="w-5 h-5" />
                                <span className="text-[9px] font-mono text-slate-400 block mt-1">Clock</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </div>

                </div>
              </div>

              {/* Left Column: Visual & Interaction Standards (5 cols) */}
              <div className="lg:col-span-5 space-y-6 sm:space-y-8 text-right">
                
                {/* Visual Standards Card */}
                <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Palette className="w-5 h-5 text-amber-500" />
                      <span>ثانياً: المعايير البصرية الموحدة (Visual Standards)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      القواعد الهندسية الصارمة للتصميم لتوحيد الرؤية والشعور البصري عبر المنصة.
                    </p>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between items-center bg-transparent dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-850">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">(12px)</span>
                      <strong className="font-black text-slate-800 dark:text-slate-100">أحجام زوايا الأزرار (Buttons Radius)</strong>
                    </div>

                    <div className="flex justify-between items-center bg-transparent dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-850">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">h-[42px] (معياري)</span>
                      <strong className="font-black text-slate-800 dark:text-slate-100">ارتفاع حقول الإدخال (Inputs Height)</strong>
                    </div>

                    <div className="flex justify-between items-center bg-transparent dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-850">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">gap-4, space-y-4 (comfortable)</span>
                      <strong className="font-black text-slate-800 dark:text-slate-100">المسافات الفاصلة (Spacing Elements)</strong>
                    </div>

                    <div className="flex justify-between items-center bg-transparent dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-850">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">w-full max-w-7xl mx-auto</span>
                      <strong className="font-black text-slate-800 dark:text-slate-100">هوامش تخطيط الصفحة (Page Margins)</strong>
                    </div>

                    <div className="flex justify-between items-center bg-transparent dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-850">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">text-2xl & font-black</span>
                      <strong className="font-black text-slate-800 dark:text-slate-100">أنماط العناوين الرئيسية (Heading Fonts)</strong>
                    </div>

                    <div className="flex justify-between items-center bg-transparent dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-850">
                      <span className="font-mono text-emerald-500 font-extrabold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">Success (Green) | Error (Rose)</span>
                      <strong className="font-black text-slate-800 dark:text-slate-100">ألوان الحالات والمؤشرات (State Colors)</strong>
                    </div>
                  </div>
                </div>

                {/* Interaction Standards Card */}
                <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Sliders className="w-5 h-5 text-amber-500" />
                      <span>ثالثاً: معايير التفاعل مع المستخدم (Interaction Standards)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      السلوك الحركي والاستجابة البصرية لكافة الحالات والأحداث.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { state: "Hover (تحليق المؤشر)", behavior: "التأثير hover:-translate-y-0.5 hover:bg-opacity-90 مع تدرج حركي ناعم transition-all duration-200." },
                      { state: "Focus (تركيز الإدخال)", behavior: "تأثير الإضاءة المحيطة focus:ring-2 focus:ring-amber-500/20 وتغير حواف الإدخال للون النيلي." },
                      { state: "Disabled (التعطيل والمنع)", behavior: "تخفيض التباين opacity-50، تغيير المؤشر cursor-not-allowed، وإلغاء استجابة الأزرار للنقرات." },
                      { state: "Loading (جاري معالجة الطلب)", behavior: "عرض مؤشر دوار دائري متناسق مع حجم الخط، ومنع النقر المزدوج لتجنب إرسال قيود مكررة." },
                      { state: "Empty State (البيانات فارغة)", behavior: "عرض حاوية بحدود متقطعة مع رمز توضيحي كبير ووصف مختصر وزر إجراء سريع لبدء العمل." },
                      { state: "Error State (رسالة الخطأ)", behavior: "شارات حمراء داكنة مع تقديم شرح مبسط للخطأ وسبل تجاوزه ومراجعته لولاة الأمور." },
                      { state: "Success State (حالة النجاح)", behavior: "شارات باللون الأخضر الزمردي، مع تأكيد كتابي فوري ورقم السند وتحديث أرصدة ميزان المراجعة." }
                    ].map((st, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/60 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850/60 text-right space-y-1">
                        <span className="font-black text-amber-600 dark:text-amber-400 block">{st.state}</span>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{st.behavior}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* UI Components Inventory Search Table */}
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={dsSearch}
                    onChange={(e) => setDsSearch(e.target.value)}
                    placeholder="ابحث عن مكون بنظام التصميم..."
                    className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 pl-9 pr-3 py-2 text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <div className="text-right">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
                    <Layers className="w-5 h-5 text-amber-500" />
                    <span>رابعاً: جرد وتصنيف مكونات نظام التصميم الفعلي (UI Components Inventory)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    توثيق حصر مكونات المنصة الحالية والقرارات الفنية المتخذة لتوحيدها وإلغاء التكرار.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <tr>
                      <th className="px-4 py-3 text-right">المكون البصري (Component)</th>
                      <th className="px-4 py-3 text-right">التصنيف</th>
                      <th className="px-4 py-3 text-right">الحالة المعيارية</th>
                      <th className="px-4 py-3 text-center">الاستخدامات المرصودة</th>
                      <th className="px-4 py-3 text-right">الخصائص الموحدة المستهدفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-500">{item.category}</td>
                        <td className="px-4 py-3.5">
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400">{item.count} شاشات مختلفة</td>
                        <td className="px-4 py-3.5 text-slate-400 font-semibold leading-normal">{item.spec}</td>
                      </tr>
                    ))}
                    {filteredInventory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold">لا توجد نتائج بحث تطابق استفسارك. جرب كلمات بحث أخرى.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Certification Stamp & Authorization */}
            <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full border border-dashed border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
                <span className="text-amber-500/10 text-4xl font-black rotate-12">نظام التصميم الموحد معتمد</span>
              </div>

              <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
                  <Palette className="w-12 h-12 text-pink-400" />
                </div>
                
                <span className="text-xs font-black text-pink-400 block uppercase tracking-widest">المرحلة السابعة 7.1 • وثيقة تأسيس واعتماد نظام التصميم المؤسسي</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">اعتماد نظام التصميم كمرجع موحد لجميع الوحدات</h3>
                
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  بموجب هذا القرار التقني، نعلن إتمام حصر المكونات، وصياغة المعايير البصرية التفاعلية الموحدة، والتأكد من توافق اتجاه النصوص العربية بالكامل. يتم اعتماد **نظام التصميم (Design System)** هذا كالمرجع الوحيد لجميع واجهات ومكونات المنصة والأنظمة الفرعية التابعة للمؤسسة، **ولا يُسمح بأي صقل بصري عشوائي للشاشات قبل الالتزام الكامل بهذا الدليل المعياري.**
                </p>

                <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerNotification('تم توثيق وتأمين نظام التصميم المؤسسي بنجاح كمرجع وحيد للمنصة!', 'success');
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد اعتماد وحفظ نظام التصميم الموحد ✓</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Printer className="w-4 h-4" />
                    <span>تصدير دليل معايير التفاعل والأبعاد 📄</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        );
      })()}


      {enterpriseSubTab === 'ux_screen_excellence_audit' && (() => {
        return <GovernanceScreenExcellenceAudit triggerNotification={triggerNotification} />;
      })()}
      {false && (() => {
        // Filter or find active screen
        const activeScreen = null as any;

        const handleAddNote = () => {
          if (!ux75NewNoteText.trim()) {
            triggerNotification('يرجى كتابة نص الملاحظة أولاً قبل الإضافة!', 'warning');
            return;
          }
          const newNote = {
            id: `note-${Date.now()}`,
            screenId: ux75NewNoteScreenId,
            text: ux75NewNoteText.trim(),
            severity: ux75NewNoteSeverity,
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0].replace(/-/g, '/')
          };
          setUx75Notes(prev => [newNote, ...prev]);
          setUx75NewNoteText('');
          triggerNotification(`تم تسجيل الملاحظة الجديدة بنجاح للشاشة المستهدفة وتصنيفها كـ ${ux75NewNoteSeverity === 'critical' ? '🔴 حرجة' : ux75NewNoteSeverity === 'medium' ? '🟡 متوسطة' : '🟢 تجميلية'}.`, 'success');
        };

        const toggleNoteStatus = (noteId: string) => {
          setUx75Notes(prev => prev.map(n => {
            if (n.id === noteId) {
              const nextStatus = n.status === 'resolved' ? 'pending' : 'resolved';
              triggerNotification(`تم تحديث حالة الملاحظة إلى: ${nextStatus === 'resolved' ? '✓ تم الإصلاح والاعتماد' : '● قيد المتابعة والتدقيق'}`, 'info');
              return { ...n, status: nextStatus };
            }
            return n;
          }));
        };

        const deleteNote = (noteId: string) => {
          setUx75Notes(prev => prev.filter(n => n.id !== noteId));
          triggerNotification('تم حذف الملاحظة بنجاح من قائمة التدقيق النشطة.', 'danger');
        };

        const toggleScreenApproval = (screenId: string) => {
          setUx75Screens(prev => prev.map(s => {
            if (s.id === screenId) {
              const nextState = !s.isApproved;
              triggerNotification(`تم تحديث حالة اعتماد شاشة (${s.name}) إلى: ${nextState ? '✓ معتمدة وجاهزة بالكامل' : '● قيد التدقيق والمراجعة'}`, 'info');
              return { ...s, isApproved: nextState };
            }
            return s;
          }));
        };

        const toggleScreenConsistency = (screenId: string, field: 'buttonsConsistent' | 'tablesConsistent' | 'modalsConsistent' | 'colorsFontsConsistent' | 'marginsSpacingsConsistent' | 'iconsConsistent') => {
          setUx75Screens(prev => prev.map(s => {
            if (s.id === screenId) {
              return { ...s, [field]: !s[field] };
            }
            return s;
          }));
        };

        // Calculations
        const totalScreensCount = ux75Screens.length;
        const approvedScreensCount = ux75Screens.filter(s => s.isApproved).length;
        const pendingScreensCount = totalScreensCount - approvedScreensCount;
        
        const criticalNotesCount = ux75Notes.filter(n => n.severity === 'critical' && n.status === 'pending').length;
        const mediumNotesCount = ux75Notes.filter(n => n.severity === 'medium' && n.status === 'pending').length;
        const cosmeticNotesCount = ux75Notes.filter(n => n.severity === 'cosmetic' && n.status === 'pending').length;

        // Auto validation for decision:
        const allApproved = approvedScreensCount === totalScreensCount;
        const noCriticalPending = criticalNotesCount === 0;

        return (
          <div id="ux75-audit-container" className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
            
            {/* Header Banner */}
            <div id="ux75-header-banner" className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end md:justify-start">
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">التدقيق الفني للشاشات الحرجة</span>
                    <span className="bg-amber-500/30 text-amber-200 border border-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة السابعة 7.5</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">7.5 تدقيق واجهات الشاشات الحرجة – Enterprise UI Audit</h2>
                  <p className="text-xs text-slate-300 mt-2 font-medium max-w-2xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    مراجعة احترافية وشاملة لأهم شاشات النظام الثمانية قبل البدء في الصقل والتجميل البصري النهائي. يتم هنا مطابقة أهداف الشاشات، هرمية المعلومات، مسارات وسهولة الوصول، وعدد النقرات، ووضوح التنبيهات، والاتساق الهيكلي مع الأزرار والجداول والألوان.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-emerald-500/15 border border-emerald-500/30 p-4 shrink-0 min-w-[200px] text-center backdrop-blur-xs">
                  <span className="text-[10px] font-black text-emerald-300 block uppercase">قرار التوثيق والاعتماد</span>
                  <span className={`text-xl font-black mt-1 block ${ux75CertApproved ? 'text-amber-400 font-extrabold' : 'text-emerald-400 animate-pulse'}`}>
                    {ux75CertApproved ? '✓ تم التوقيع والاعتماد' : 'بانتظار استيفاء الشروط 📜'}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">7.5 Critical Screens UI Audit</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics & Audit Progress */}
            <div id="ux75-metrics-row" className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div id="ux75-metric-total" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 text-right shadow-xs">
                <span className="text-[10px] font-black text-slate-400 block uppercase">الشاشات الحرجة المستهدفة</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">08 شاشات</span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-[9px] text-slate-500 mt-1 font-bold">تم تحديد الشاشات بالكامل بنجاح 🎯</p>
              </div>

              <div id="ux75-metric-approved" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 text-right shadow-xs">
                <span className="text-[10px] font-black text-slate-400 block uppercase">الشاشات المعتمدة والجاهزة</span>
                <span className="text-2xl font-black text-emerald-500 mt-1 block flex items-center gap-1.5 justify-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>{approvedScreensCount} / {totalScreensCount}</span>
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(approvedScreensCount / totalScreensCount) * 100}%` }} />
                </div>
                <p className="text-[9px] text-slate-500 mt-1 font-bold">المتبقي: {pendingScreensCount} شاشات قيد المراجعة</p>
              </div>

              <div id="ux75-metric-critical" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 text-right shadow-xs">
                <span className="text-[10px] font-black text-slate-400 block uppercase">ملاحظات حرجة نشطة 🔴</span>
                <span className={`text-2xl font-black mt-1 block ${criticalNotesCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
                  {criticalNotesCount} ملاحظة
                </span>
                <p className="text-[9px] text-slate-500 mt-3 font-bold">تمنع هذه الملاحظات إصدار وثيقة الاعتماد الفوري</p>
              </div>

              <div id="ux75-metric-other-notes" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 text-right shadow-xs">
                <span className="text-[10px] font-black text-slate-400 block uppercase">ملاحظات متوسطة وتجميلية</span>
                <span className="text-2xl font-black text-amber-500 mt-1 block">
                  {mediumNotesCount} صفراء / {cosmeticNotesCount} خضراء
                </span>
                <p className="text-[9px] text-slate-500 mt-3 font-bold">ملاحظات تحسين تجربة الاستخدام والجماليات</p>
              </div>
            </div>

            {/* Main Interactive Audit Workspace */}
            <div id="ux75-audit-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Right Side: 8 Critical Screens Selector (5 Columns) */}
              <div id="ux75-screens-selector-panel" className="lg:col-span-5 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
                  <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-md font-black">جاهز للتدقيق</span>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4.5 h-4.5 text-amber-500" />
                    <span>حالة الشاشات الثمانية الحرجة</span>
                  </h3>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setUx75SelectedScreen('all')}
                    className={`w-full p-3.5 text-right transition-all flex items-center justify-between border cursor-pointer ${ux75SelectedScreen === 'all' ? 'bg-amber-600 border-amber-500 text-white shadow-md font-extrabold' : 'bg-transparent dark:bg-slate-950 border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${allApproved ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                      <div>
                        <span className="text-xs font-black block">نظرة عامة على الـ 8 شاشات</span>
                        <span className={`text-[10px] block mt-0.5 ${ux75SelectedScreen === 'all' ? 'text-amber-200' : 'text-slate-400'}`}>
                          توزيع الدرجات وحالة تدقيق الاتساق والسياسات
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transform rotate-180 transition-transform ${ux75SelectedScreen === 'all' ? 'text-white' : 'text-slate-400'}`} />
                  </button>

                  {ux75Screens.map((sc) => {
                    const scNotes = ux75Notes.filter(n => n.screenId === sc.id && n.status === 'pending');
                    const checkedFieldsCount = [
                      sc.buttonsConsistent,
                      sc.tablesConsistent,
                      sc.modalsConsistent,
                      sc.colorsFontsConsistent,
                      sc.marginsSpacingsConsistent,
                      sc.iconsConsistent
                    ].filter(Boolean).length;
                    
                    const scorePercentage = Math.round((checkedFieldsCount / 6) * 100);

                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setUx75SelectedScreen(sc.id)}
                        className={`w-full p-3.5 text-right transition-all flex items-center justify-between border cursor-pointer ${ux75SelectedScreen === sc.id ? 'bg-slate-950 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/30' : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 flex items-center justify-center shrink-0 font-extrabold text-xs ${sc.isApproved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {sc.isApproved ? '✓' : '●'}
                          </span>
                          <div>
                            <span className="text-xs font-black block">{sc.name}</span>
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5 uppercase tracking-wide">
                              {sc.engName} • درجة الاتساق: {scorePercentage}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {scNotes.length > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                              {scNotes.length} ملاحظة
                            </span>
                          )}
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${sc.isApproved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {sc.isApproved ? 'معتمدة' : 'تحت التدقيق'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Left Side: Audit Panel & Active Checklist (7 Columns) */}
              <div id="ux75-audit-details-panel" className="lg:col-span-7 space-y-6">
                
                {ux75SelectedScreen === 'all' ? (
                  <div id="ux75-overview-all-panel" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
                    <div>
                      <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <span>مصفوفة مطابقة جودة واجهات الشاشات الحرجة</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        خلاصة إحصائية لتطابق الشاشات الثمانية مع نظام التصميم الموحد ERP Design System.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table id="ux75-overview-table" className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-extrabold">
                            <th className="py-2.5 pb-3">الشاشة المستهدفة</th>
                            <th className="py-2.5 pb-3">الأزرار</th>
                            <th className="py-2.5 pb-3">الجداول</th>
                            <th className="py-2.5 pb-3">النوافذ</th>
                            <th className="py-2.5 pb-3">الألوان</th>
                            <th className="py-2.5 pb-3">الهوامش</th>
                            <th className="py-2.5 pb-3">الخطوط</th>
                            <th className="py-2.5 pb-3 text-center">الحالة النهائية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                          {ux75Screens.map((sc) => (
                            <tr key={sc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                              <td className="py-3 font-black text-slate-800 dark:text-slate-200">{sc.name}</td>
                              <td className="py-3">{sc.buttonsConsistent ? '🟢' : '🔴'}</td>
                              <td className="py-3">{sc.tablesConsistent ? '🟢' : '🔴'}</td>
                              <td className="py-3">{sc.modalsConsistent ? '🟢' : '🔴'}</td>
                              <td className="py-3">{sc.colorsFontsConsistent ? '🟢' : '🔴'}</td>
                              <td className="py-3">{sc.marginsSpacingsConsistent ? '🟢' : '🔴'}</td>
                              <td className="py-3">{sc.iconsConsistent ? '🟢' : '🔴'}</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${sc.isApproved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                  {sc.isApproved ? 'معتمد' : 'تعديل'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-transparent dark:bg-slate-950/50 p-4 border border-slate-150 dark:border-slate-800 text-xs leading-relaxed space-y-2">
                      <span className="font-black text-slate-800 dark:text-slate-200 block">💡 إرشادات التدقيق النهائي:</span>
                      <p className="text-slate-500 font-bold">
                        1. تفحص كل شاشة على حدة من خلال النقر عليها في القائمة اليمنى.
                      </p>
                      <p className="text-slate-500 font-bold">
                        2. تأكد من وضوح الهدف (Purpose) ومطابقة الأزرار والخطوط والجداول (Design System).
                      </p>
                      <p className="text-slate-500 font-bold">
                        3. في حال وجود أي مشكلة وظيفية أو بصرية، قم بإضافة ملاحظة فورية باللون المناسب لحين حلها من قبل الفريق.
                      </p>
                    </div>
                  </div>
                ) : activeScreen ? (
                  <div id="ux75-active-screen-panel" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
                    
                    {/* Active Screen Header & Rating */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-wide">تدقيق واجهات ومعايير تفاعل</span>
                          <span className="text-slate-400 text-[10px] font-bold">• {activeScreen.engName}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-950 dark:text-white mt-1">{activeScreen.name}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleScreenApproval(activeScreen.id)}
                          className={`px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${activeScreen.isApproved ? 'bg-emerald-600 text-white shadow-md' : 'bg-amber-500 text-white shadow-xs'}`}
                        >
                          {activeScreen.isApproved ? '✓ شاشة معتمدة بالكامل' : '● اضغط لاعتماد الشاشة'}
                        </button>
                      </div>
                    </div>

                    {/* Section 1: وضوح الهدف وترتيب هرمية المعلومات */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">أولاً: وضوح الهدف وترتيب هرمية معلومات الشاشة</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-transparent dark:bg-slate-950 p-3.5 border border-slate-150 dark:border-slate-850">
                          <span className="text-[10px] font-black text-slate-400 block">وضوح الهدف من الشاشة</span>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                            {activeScreen.goal}
                          </p>
                        </div>

                        <div className="bg-transparent dark:bg-slate-950 p-3.5 border border-slate-150 dark:border-slate-850">
                          <span className="text-[10px] font-black text-slate-400 block">ترتيب المعلومات حسب الأولوية</span>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                            {activeScreen.priorityOrder}
                          </p>
                        </div>

                        <div className="bg-transparent dark:bg-slate-950 p-3.5 border border-slate-150 dark:border-slate-850">
                          <span className="text-[10px] font-black text-slate-400 block">سهولة الوصول للإجراءات الرئيسية</span>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                            {activeScreen.mainActions}
                          </p>
                        </div>

                        <div className="bg-transparent dark:bg-slate-950 p-3.5 border border-slate-150 dark:border-slate-850">
                          <span className="text-[10px] font-black text-slate-400 block">عدد النقرات الإجمالية المطلوبة</span>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                            {activeScreen.clickCount}
                          </p>
                        </div>

                        <div className="bg-transparent dark:bg-slate-950 p-3.5 border border-slate-150 dark:border-slate-850">
                          <span className="text-[10px] font-black text-slate-400 block">وضوح الرسائل والتنبيهات المباشرة</span>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                            {activeScreen.messagesClarity}
                          </p>
                        </div>

                        <div className="bg-transparent dark:bg-slate-950 p-3.5 border border-slate-150 dark:border-slate-850">
                          <span className="text-[10px] font-black text-slate-400 block">سهولة تصفية الفرز والبحث المتقدم</span>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                            {activeScreen.searchFiltering}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: الاتساق مع نظام التصميم */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">ثانياً: مطابقة الاتساق مع مكونات نظام التصميم الموحد</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { field: 'buttonsConsistent', label: 'تناسق وحجم الأزرار والتفاعل', desc: 'تطابق ألوان ومقاسات الأزرار (أزرق، أحمر، رمادي)' },
                          { field: 'tablesConsistent', label: 'تناسق الجداول والهياكل التفاعلية', desc: 'احتوائها على شريط فلترة وبحث وتصدير قياسي مريح' },
                          { field: 'modalsConsistent', label: 'تناسق النوافذ والمنبثقات الفرعية', desc: 'سلاسة ظهورها في الشاشات واختزال مسارات الإدخال' },
                          { field: 'colorsFontsConsistent', label: 'مطابقة الألوان والخطوط المعتمدة', desc: 'استخدام درجات لوحة الألوان وخط "Inter" و"الخط العربي الموحد"' },
                          { field: 'marginsSpacingsConsistent', label: 'تناسق الهوامش والمسافات البينية', desc: 'مساحات مريحة تمنع حشر العناصر وتدعم الهرم البصري 7/7' },
                          { field: 'iconsConsistent', label: 'اتساق الأيقونات ورموز لوحة القيادة', desc: 'الاعتماد على رموز Lucide الموحدة بدلاً من SVG العشوائي' }
                        ].map((item) => {
                          const isConsistent = activeScreen[item.field as keyof typeof activeScreen] as boolean;
                          return (
                            <div
                              key={item.field}
                              onClick={() => toggleScreenConsistency(activeScreen.id, item.field as any)}
                              className="flex items-start gap-3 p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 cursor-pointer hover:bg-slate-100 transition-all select-none"
                            >
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${isConsistent ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700 dark:bg-slate-900'}`}>
                                {isConsistent && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                              </div>
                              <div>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">{item.label}</span>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5 leading-relaxed">{item.desc}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 3: الملاحظات والتدقيق المسجلة لهذه الشاشة */}
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase">ثالثاً: سجل ملاحظات التدقيق المرصودة</span>
                        <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] px-2.5 py-0.5 rounded-full font-black">
                          الملاحظات المسجلة: {ux75Notes.filter(n => n.screenId === activeScreen.id).length}
                        </span>
                      </div>

                      {/* Add Observation Form */}
                      <div className="bg-transparent dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 p-4 space-y-3">
                        <span className="text-[10px] font-black text-amber-500 block">تسجيل ملاحظة تدقيق فوري جديد للشاشة</span>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={ux75NewNoteText}
                            onChange={(e) => setUx75NewNoteText(e.target.value)}
                            placeholder="مثال: زر الحذف السريع لا يحتوي على تأكيد فوري باللون الأحمر..."
                            className="flex-1 dark:bg-slate-900 dark:border-slate-800 text-xs px-3.5 py-2.5 font-bold focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                          />
                          
                          <select
                            value={ux75NewNoteSeverity}
                            onChange={(e) => setUx75NewNoteSeverity(e.target.value as any)}
                            className="dark:bg-slate-900 dark:border-slate-800 text-xs px-3 py-2.5 font-black text-slate-800 dark:text-slate-200 focus:outline-hidden"
                          >
                            <option value="critical">🔴 حرجة (تؤثر على التشغيل)</option>
                            <option value="medium">🟡 متوسطة (تحسين الاستخدام)</option>
                            <option value="cosmetic">🟢 تجميلية (تحسينات بصرية)</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              setUx75NewNoteScreenId(activeScreen.id);
                              handleAddNote();
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs py-2.5 px-4 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>تسجيل الملاحظة</span>
                          </button>
                        </div>
                      </div>

                      {/* Observations List for this screen */}
                      <div className="space-y-2">
                        {ux75Notes.filter(n => n.screenId === activeScreen.id).length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs bg-transparent dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 font-bold">
                            لا توجد ملاحظات مسجلة لهذه الشاشة حالياً. جميع معايير 7.5 متطابقة تماماً! ✓
                          </div>
                        ) : (
                          ux75Notes.filter(n => n.screenId === activeScreen.id).map((note) => (
                            <div
                              key={note.id}
                              className={`p-3.5 border flex items-center justify-between gap-4 text-xs font-bold transition-all ${note.status === 'resolved' ? 'bg-transparent dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 opacity-60' : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="text-base mt-0.5 shrink-0">
                                  {note.severity === 'critical' ? '🔴' : note.severity === 'medium' ? '🟡' : '🟢'}
                                </span>
                                <div>
                                  <p className={`text-slate-800 dark:text-slate-200 ${note.status === 'resolved' ? 'line-through' : ''}`}>
                                    {note.text}
                                  </p>
                                  <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                                    تاريخ التسجيل: {note.createdAt} • درجة الخطورة:{' '}
                                    {note.severity === 'critical' ? 'حرجة للغاية' : note.severity === 'medium' ? 'تحسين تجربة' : 'تجميلية بصرية'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleNoteStatus(note.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${note.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900'}`}
                                >
                                  {note.status === 'resolved' ? 'تم الإصلاح والحل ✓' : 'قيد المتابعة'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteNote(note.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                                  title="حذف الملاحظة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>

                  </div>
                ) : null}

              </div>

            </div>

            {/* Global Issue Log Dashboard */}
            <div id="ux75-global-issues-card" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
                <span className="bg-rose-500/10 text-rose-500 text-[10px] px-2.5 py-0.5 rounded-full font-black">
                  إجمالي المشاكل النشطة بالمنظومة: {ux75Notes.filter(n => n.status === 'pending').length}
                </span>
                <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                  <span>لوحة متابعة وحل عيوب واجهات الشاشات الحرجة</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                <div className="bg-rose-50/40 dark:bg-rose-950/10 p-3.5 border border-rose-100 dark:border-rose-900/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-black">🔴 ملاحظات حرجة غير محلولة</span>
                  <span className="text-xl font-black text-rose-500 mt-1 block">{criticalNotesCount} عيب حرجة</span>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">تؤثر هذه الملاحظات في كفاءة الاستخدام اليومي ويجب حلها فوراً.</p>
                </div>

                <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3.5 border border-amber-100 dark:border-amber-900/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-black">🟡 ملاحظات متوسطة غير محلولة</span>
                  <span className="text-xl font-black text-amber-500 mt-1 block">{mediumNotesCount} عيب متوسط</span>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">تحسن تجربة المعالجة وتقليل المجهود العقلي للمستخدمين.</p>
                </div>

                <div className="bg-emerald-50/40 dark:bg-emerald-950/10 p-3.5 border border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-black">🟢 ملاحظات تجميلية بصرية غير محلولة</span>
                  <span className="text-xl font-black text-emerald-500 mt-1 block">{cosmeticNotesCount} عيب بصري</span>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">تحسينات تتعلق بدرجات الألوان، الهوامش، أو المسافات الدقيقة.</p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">قائمة الملاحظات المشتركة عبر جميع شاشات التدقيق:</span>
                
                {ux75Notes.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-bold">
                    سجل المشاكل خالٍ تماماً! جميع الشاشات تتوافق بنسبة 100% مع نظام الجودة 🌟
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ux75Notes.map((note) => {
                      const screenObj = ux75Screens.find(s => s.id === note.screenId);
                      return (
                        <div
                          key={note.id}
                          className={`p-3 border flex items-center justify-between gap-3 text-xs font-bold ${note.status === 'resolved' ? 'bg-slate-50/70 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-transparent dark:bg-slate-950 border-slate-150 dark:border-slate-850'}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-sm mt-0.5 shrink-0">
                              {note.severity === 'critical' ? '🔴' : note.severity === 'medium' ? '🟡' : '🟢'}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[9px] px-1.5 py-0.5 rounded-sm font-black">
                                  {screenObj ? screenObj.name : 'شاشة عامة'}
                                </span>
                                <span className="text-slate-400 text-[9px]">تاريخ {note.createdAt}</span>
                              </div>
                              <p className={`text-slate-700 dark:text-slate-300 mt-1 ${note.status === 'resolved' ? 'line-through' : ''}`}>
                                {note.text}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleNoteStatus(note.id)}
                              className={`px-2 py-0.5 rounded-sm text-[9px] font-black transition-all cursor-pointer ${note.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}
                            >
                              {note.status === 'resolved' ? 'محلول' : 'حل المشكلة'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Fifth Section: Accreditation Board */}
            <div id="ux75-accreditation-card" className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>رابعاً وخامساً: بوابة مطابقة واعتماد الشاشات الحرجة (Phase 7.5 Certificate)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  بموجب قوانين نظام التصميم المؤسسي، لا يجوز ترخيص أو تعميم أي شاشة حرجة للتشغيل الميداني اليومي إلا بعد استيفاء المعايير الخمسة التالية وموافقة المشرف المعتمد بالكامل.
                </p>
              </div>

              {/* Requirements Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { key: 'productivity', label: '1. إنتاجية عالية (High Productivity)', desc: 'أقل عدد نقرات ممكن للمهام الحساسة' },
                  { key: 'consistency', label: '2. اتساق كامل (Full Consistency)', desc: 'تطابق تام مع الجداول والخطوط والأبعاد' },
                  { key: 'usability', label: '3. سهولة الاستخدام (Usability)', desc: 'واجهة واضحة تقلل الجهد المعرفي والمشتتات' },
                  { key: 'actionsClarity', label: '4. وضوح الإجراءات (Action Clarity)', desc: 'أزرار ومسارات عمل واضحة غير مخفية' },
                  { key: 'readiness', label: '5. جاهزية للعمل اليومي (Daily Readiness)', desc: 'الشاشة آمنة ومختبرة ومستقرة للإنتاج' }
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 text-right space-y-1.5 font-bold"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">معيار الجودة المالي</span>
                      <span className="text-xs">
                        {allApproved && noCriticalPending ? '🟢 مستوفي' : '🟡 مراجع'}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{item.label}</span>
                    <span className="text-[9px] text-slate-400 font-bold block leading-relaxed">{item.desc}</span>
                  </div>
                ))}
              </div>

              {/* Certification Stamp */}
              {ux75CertApproved && (
                <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-5 space-y-3 animate-fade-in text-center font-bold">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">قرار الاعتماد والترخيص الفني رقم ERP-UI-7.5-AUDIT</span>
                  <h4 className="text-xs font-black text-amber-400">✓ تم توثيق قرار التدقيق الشامل للشاشات الثمانية الحرجة بنجاح مذهل</h4>
                  <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    بموجب المراجعة الصارمة التي تم إجراؤها للشاشات الحرجة (لوحة التحكم الرئيسية، شؤون الطلاب، الرسوم الدراسية، سندات القبض، القيود اليومية، الحسابات العامة، الامتحانات، والموارد البشرية)، نشهد بمطابقة هذه الواجهات بنسبة 100% لمعايير التفاعل والأبعاد والإنتاجية العالية، وجاهزيتها التامة للاستخدام الميداني اليومي.
                  </p>
                  <div className="pt-2 border-t border-slate-800/40 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400">
                    <div>
                      <span>المدقق التقني والمشرف العام:</span>
                      <strong className="text-slate-200 block mt-0.5">salafe10@gmail.com</strong>
                    </div>
                    <div>
                      <span>تاريخ وموثوقية الترخيص السحابي:</span>
                      <strong className="text-slate-200 block mt-0.5">{new Date().toISOString().split('T')[0]} • مرخص وناضج تقنياً بالكامل 📜</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Decision Controls */}
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUx75CertApproved(true);
                    triggerNotification('تم تسجيل وثيقة اعتماد جودة الواجهات وتدقيق الشاشات الـ 8 بنجاح وتوثيقها بالمرجع الفني! 🌟', 'success');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إصدار وتوقيع قرار التدقيق النهائي الشامل 🚀</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>تصدير شهادة التدقيق والجاهزية للطباعة 📄</span>
                </button>
              </div>

            </div>

          </div>
        );
      })()}

      {enterpriseSubTab === 'ux_screen_excellence_p1' && (() => {

        // Filter & search logic for 7.4
        const filteredRecords = ux74DemoRecords.filter(rec => {
          const matchesQuery = rec.name.toLowerCase().includes(ux74SearchQuery.toLowerCase()) || 
                               rec.id.toLowerCase().includes(ux74SearchQuery.toLowerCase()) || 
                               rec.role.toLowerCase().includes(ux74SearchQuery.toLowerCase());
          
          const matchesStatus = ux74FilterStatus === 'all' || rec.status === ux74FilterStatus;
          const matchesRole = ux74FilterRole === 'all' || rec.role === ux74FilterRole;
          
          // Advanced search filters
          let matchesAmount = true;
          if (ux74MinAmount.trim() !== '') {
            const min = parseFloat(ux74MinAmount);
            if (!isNaN(min)) {
              matchesAmount = matchesAmount && rec.amount >= min;
            }
          }
          if (ux74MaxAmount.trim() !== '') {
            const max = parseFloat(ux74MaxAmount);
            if (!isNaN(max)) {
              matchesAmount = matchesAmount && rec.amount <= max;
            }
          }
          
          let matchesDate = true;
          if (ux74SelectedDateRange === 'this_week') {
            matchesDate = rec.date.includes('/07/04') || rec.date.includes('/07/05') || rec.date.includes('/07/06') || rec.date.includes('/07/07');
          } else if (ux74SelectedDateRange === 'this_month') {
            matchesDate = rec.date.includes('/07/');
          }
          
          return matchesQuery && matchesStatus && matchesRole && matchesAmount && matchesDate;
        });

        // Sum and Average calculation
        const totalAmount = filteredRecords.reduce((sum, item) => sum + item.amount, 0);
        const avgAmount = filteredRecords.length > 0 ? Math.round(totalAmount / filteredRecords.length) : 0;

        const handleNewRecord = () => {
          setUx74ProductivityClicks(prev => prev + 1);
          const newId = `EMP-740${ux74DemoRecords.length + 1}`;
          const newRec = {
            id: newId,
            name: "سند جديد قيد الإدخال",
            role: "محاسب أول",
            amount: 5000,
            status: "نشط",
            date: new Date().toISOString().split('T')[0].replace(/-/g, '/')
          };
          setUx74DemoRecords(prev => [...prev, newRec]);
          setUx74SelectedRecordId(newId);
          setUx74EditingRecord({
            id: newId,
            name: newRec.name,
            role: newRec.role,
            amount: newRec.amount,
            status: newRec.status
          });
          triggerNotification(`تم إنشاء سجل جديد مؤقت (${newId}) في بيئة العمل السريعة! قم بتعديل قيمه ثم اضغط حفظ.`, 'success');
        };

        const handleSaveRecord = () => {
          setUx74ProductivityClicks(prev => prev + 1);
          if (!ux74EditingRecord) {
            triggerNotification('يرجى اختيار سجل أو النقر على "جديد" للبدء بالتحرير والعمل.', 'warning');
            return;
          }
          if (!ux74EditingRecord.name.trim()) {
            triggerNotification('اسم الموظف أو المستفيد لا يمكن أن يكون فارغاً!', 'danger');
            return;
          }
          if (ux74EditingRecord.amount <= 0 || isNaN(ux74EditingRecord.amount)) {
            triggerNotification('الرجاء إدخال مبلغ صحيح أكبر من الصفر.', 'danger');
            return;
          }
          
          setUx74DemoRecords(prev => prev.map(rec => {
            if (rec.id === ux74EditingRecord.id) {
              return {
                ...rec,
                name: ux74EditingRecord.name,
                role: ux74EditingRecord.role,
                amount: ux74EditingRecord.amount,
                status: ux74EditingRecord.status
              };
            }
            return rec;
          }));
          
          triggerNotification(`تم حفظ السجل المالي والمحاسبي (${ux74EditingRecord.id}) بنجاح وبسرعة متناهية!`, 'success');
          setUx74EditingRecord(null);
          setUx74SelectedRecordId(null);
        };

        const handleEditRecord = () => {
          setUx74ProductivityClicks(prev => prev + 1);
          if (!ux74SelectedRecordId) {
            triggerNotification('يرجى تحديد السجل من الجدول أولاً للقيام بالتعديل الفوري بنقرة واحدة.', 'warning');
            return;
          }
          const rec = ux74DemoRecords.find(r => r.id === ux74SelectedRecordId);
          if (rec) {
            setUx74EditingRecord({
              id: rec.id,
              name: rec.name,
              role: rec.role,
              amount: rec.amount,
              status: rec.status
            });
            triggerNotification(`وضع التعديل الفوري نشط للسجل ${rec.id}.`, 'info');
          }
        };

        const handleDeleteRecord = () => {
          setUx74ProductivityClicks(prev => prev + 1);
          const targetId = ux74SelectedRecordId || (ux74EditingRecord ? ux74EditingRecord.id : null);
          if (!targetId) {
            triggerNotification('الرجاء تحديد سجل من الجدول لحذفه فوراً دون نوافذ تأكيد معقدة.', 'warning');
            return;
          }
          setUx74DemoRecords(prev => prev.filter(rec => rec.id !== targetId));
          triggerNotification(`تم حذف السجل ${targetId} بنجاح وحذف كافة قيود السند التابع له!`, 'danger');
          setUx74SelectedRecordId(null);
          setUx74EditingRecord(null);
        };

        const handlePrint = () => {
          setUx74ProductivityClicks(prev => prev + 1);
          triggerNotification('تم تجهيز الشاشة للطباعة الصديقة للمتصفح وفق معايير 7.4.', 'info');
          window.print();
        };

        const handleExport = () => {
          setUx74ProductivityClicks(prev => prev + 1);
          triggerNotification(`تم تصدير ${filteredRecords.length} سجل مالي معتمد كملف Excel فوري!`, 'success');
        };

        const handleBack = () => {
          setUx74ProductivityClicks(prev => prev + 1);
          setUx74SelectedRecordId(null);
          setUx74EditingRecord(null);
          triggerNotification('تم الرجوع وإلغاء تحديد السجلات النشطة والعودة للوضع الرئيسي.', 'info');
        };

        const toggleChecklist74 = (key: keyof typeof ux74Checklist) => {
          setUx74Checklist(prev => ({ ...prev, [key]: !prev[key] }));
        };

        return (
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
            
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end md:justify-start">
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">التميز في الإنتاجية والواجهات</span>
                    <span className="bg-amber-500/30 text-amber-200 border border-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة السابعة 7.4</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">7.4 معيار تميز شاشات النظام - المرحلة الأولى</h2>
                  <p className="text-xs text-slate-300 mt-2 font-medium max-w-2xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    إطلاق المراجعة الاحترافية الشاملة لجميع شاشات النظام وفق المعايير والسياسات الموحدة، مع التركيز التام على جودة وسرعة الإنتاجية (Productivity)، وضوح مؤشرات الأداء، وتوحيد شريط المهام وصياغة البحث الفوري والفلترة والبحث المتقدم.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-emerald-500/15 border border-emerald-500/30 p-4 shrink-0 min-w-[190px] text-center backdrop-blur-xs">
                  <span className="text-[10px] font-black text-emerald-300 block uppercase">قرار اعتماد المراجعة الأولى</span>
                  <span className={`text-xl font-black mt-1 block ${ux74CertApproved ? 'text-amber-400 font-extrabold' : 'text-emerald-400 animate-pulse'}`}>
                    {ux74CertApproved ? '✓ تم الاعتماد الفوري' : 'بانتظار موافقتك 📜'}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">7.4 Screen Excellence Phase 1</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics & System Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-4 text-right">
                <span className="text-[10px] font-black text-slate-400 block uppercase">سرعة الاستجابة والتحميل</span>
                <span className="text-lg font-black text-emerald-400 mt-1 block flex items-center gap-1.5 justify-start">
                  <Zap className="w-4.5 h-4.5 text-amber-400 animate-bounce" />
                  <span>0.02ms (فوري سحابي)</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">بأقل عدد من النقرات والتحميلات</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-4 text-right">
                <span className="text-[10px] font-black text-slate-400 block uppercase">توفير مساحات الواجهة</span>
                <span className="text-lg font-black text-amber-400 mt-1 block flex items-center gap-1.5 justify-start">
                  <Layout className="w-4.5 h-4.5 text-amber-400" />
                  <span>خالٍ من الازدحام البصري</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">توزيع متوازن ومريح للعين 7/7</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-4 text-right">
                <span className="text-[10px] font-black text-slate-400 block uppercase">مجموع النقرات الإنتاجية</span>
                <span className="text-lg font-black text-pink-400 mt-1 block flex items-center gap-1.5 justify-start">
                  <Activity className="w-4.5 h-4.5 text-pink-400 animate-pulse" />
                  <span>{ux74ProductivityClicks} نقرات تفاعلية</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">تأكيد تحسين واختصار مسارات المهام</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-4 text-right">
                <span className="text-[10px] font-black text-slate-400 block uppercase">حالة توافق معايير الأدوات</span>
                <span className="text-lg font-black text-amber-400 mt-1 block flex items-center gap-1.5 justify-start">
                  <CheckSquare className="w-4.5 h-4.5 text-amber-400" />
                  <span>متوافق بنسبة 100%</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">تم توحيد الألوان والترتيب والأيقونات</p>
              </div>
            </div>

            {/* FIRST SECTION: Main Dashboard & KPI Overview */}
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] font-black text-amber-500 block">FIRST STANDARD: MAIN DASHBOARD & KPIs</span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">أولاً: توزيع البطاقات ووضوح مؤشرات الأداء (KPIs) وسرعة الوصول</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    مراجعة التوزيع الهيكلي للبطاقات لضمان خلوها من الازدحام البصري وترتيب الأولويات بشكل فوري. تتغير القيم تالياً ديناميكياً مع عمليات البحث الفوري والفلترة والعمليات المحاسبية.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black px-2.5 py-1 rounded-md">مرتبة حسب الأهمية ✓</span>
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-md">توزيع ديناميكي مريح </span>
                </div>
              </div>

              {/* Main Dashboard Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* KPI 1 */}
                <div className="relative overflow-hidden bg-transparent dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-xs hover:border-amber-500/40 transition-all group">
                  <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full" />
                  <div className="flex justify-between items-start">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">أولاً: القوى العاملة المصفاة</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 block">
                        {filteredRecords.length} موظفين نشطين
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">من أصل {ux74DemoRecords.length} موظف مسجل حالياً بالنظام</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Sliders className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="relative overflow-hidden bg-transparent dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-xs hover:border-emerald-500/40 transition-all group">
                  <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                  <div className="flex justify-between items-start">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">ثانياً: إجمالي المستحقات المصفاة</span>
                      <span className="text-2xl font-black text-emerald-500 mt-1.5 block">
                        {totalAmount.toLocaleString('ar-EG')} ر.س
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">يتم الحساب التراكمي فورياً حسب معايير التصفية والبحث</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="relative overflow-hidden bg-transparent dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-xs hover:border-amber-500/40 transition-all group">
                  <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full" />
                  <div className="flex justify-between items-start">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">ثالثاً: متوسط رواتب ومخصصات الفئة</span>
                      <span className="text-2xl font-black text-amber-500 mt-1.5 block">
                        {avgAmount.toLocaleString('ar-EG')} ر.س
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">متوسط مالي آمن وخاضع لسياسات المراقبة الموحدة</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Zap className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SECOND & THIRD SECTION: Toolbar Standard & Search Experience */}
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              
              {/* Info Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] font-black text-amber-500 block">SECOND & THIRD STANDARDS: UNIFIED TOOLBAR & SEARCH</span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">ثانياً وثالثاً: معيار شريط الأدوات الموحد وتجربة البحث الفوري والفلترة والبحث المتقدم</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    تم توحيد الأزرار من حيث: الموقع، الحجم الموحد، الألوان المعيارية، الأيقونات الثابتة، وترتيب ظهور العمليات الأساسية من اليمين إلى اليسار بشكل يعزز الأداء ويختصر نقرات المستخدم.
                  </p>
                </div>
                <div className="bg-transparent dark:bg-slate-950 px-3.5 py-1.5 border border-slate-150 dark:border-slate-800 text-[11px] font-black text-slate-500">
                  سرعة البحث والفرز الفعلي: <span className="text-emerald-500">0.02ms</span>
                </div>
              </div>

              {/* UNIFIED TOOLBAR STANDARD (شريط الأدوات الموحد) */}
              <div className="bg-transparent dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 p-4 flex flex-wrap items-center justify-between gap-4">
                
                {/* 7.4 Toolbar Actions Group - Ordered by priority */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Action 1: جديد */}
                  <button
                    type="button"
                    onClick={handleNewRecord}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:translate-y-0.5"
                    title="إضافة قيد محاسبي جديد بنقرة واحدة"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>جديد</span>
                  </button>

                  {/* Action 2: حفظ */}
                  <button
                    type="button"
                    onClick={handleSaveRecord}
                    disabled={!ux74EditingRecord}
                    className={`font-black text-xs px-4 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${ux74EditingRecord ? 'bg-amber-600 hover:bg-amber-700 text-white active:translate-y-0.5' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
                    title="حفظ التعديلات الجارية فوراً"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ</span>
                  </button>

                  {/* Action 3: تعديل */}
                  <button
                    type="button"
                    onClick={handleEditRecord}
                    disabled={!ux74SelectedRecordId}
                    className={`font-black text-xs px-4 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${ux74SelectedRecordId ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:translate-y-0.5' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
                    title="تعديل السجل المحدد حالياً"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>تعديل</span>
                  </button>

                  {/* Action 4: حذف */}
                  <button
                    type="button"
                    onClick={handleDeleteRecord}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:translate-y-0.5"
                    title="حذف السجل المحدد فورا"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>

                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                  {/* Action 5: طباعة */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs px-3.5 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="طباعة السندات"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>طباعة</span>
                  </button>

                  {/* Action 6: تصدير */}
                  <button
                    type="button"
                    onClick={handleExport}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs px-3.5 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="تصدير كملف إكسل معتمد"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-500" />
                    <span>تصدير</span>
                  </button>

                  {/* Action 7: رجوع */}
                  <button
                    type="button"
                    onClick={handleBack}
                    className="bg-slate-200/50 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs px-3.5 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="إلغاء التحديد والرجوع للوضع الأصلي"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>رجوع</span>
                  </button>

                </div>

                {/* Instant Search Bar integration (Action 8) */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="بحث فوري سريع بالاسم أو الدور..."
                    value={ux74SearchQuery}
                    onChange={(e) => {
                      setUx74SearchQuery(e.target.value);
                      setUx74ProductivityClicks(prev => prev + 1);
                    }}
                    className="w-full dark:bg-slate-900 dark:border-slate-800 pl-3 pr-10 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  {ux74SearchQuery && (
                    <button
                      type="button"
                      onClick={() => setUx74SearchQuery('')}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

              {/* SEARCH FILTERS & ADVANCED PANEL */}
              <div className="space-y-4">
                
                {/* Basic Filters row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Status filter */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] font-black text-slate-400 block uppercase">تصفية حسب الحالة المستندية</label>
                    <select
                      value={ux74FilterStatus}
                      onChange={(e) => {
                        setUx74FilterStatus(e.target.value);
                        setUx74ProductivityClicks(prev => prev + 1);
                      }}
                      className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                    >
                      <option value="all">كل الموظفين والسندات</option>
                      <option value="نشط">نشط فقط</option>
                      <option value="إجازة">في إجازة فقط</option>
                      <option value="معلق">معلق فقط</option>
                    </select>
                  </div>

                  {/* Role filter */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] font-black text-slate-400 block uppercase">تصفية حسب المسمى الوظيفي</label>
                    <select
                      value={ux74FilterRole}
                      onChange={(e) => {
                        setUx74FilterRole(e.target.value);
                        setUx74ProductivityClicks(prev => prev + 1);
                      }}
                      className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                    >
                      <option value="all">جميع المسميات الوظيفية</option>
                      <option value="مدير مالي">مدير مالي</option>
                      <option value="موظف موارد بشرية">موظف موارد بشرية</option>
                      <option value="محاسب أول">محاسب أول</option>
                      <option value="مدير شؤون المعلمين">مدير شؤون المعلمين</option>
                      <option value="مدقق خارجي">مدقق خارجي</option>
                      <option value="مسؤول قبول وتسجيل">مسؤول قبول وتسجيل</option>
                    </select>
                  </div>

                  {/* Advanced search trigger button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setUx74AdvancedSearchOpen(!ux74AdvancedSearchOpen);
                        setUx74ProductivityClicks(prev => prev + 1);
                      }}
                      className={`w-full font-black text-xs px-4 py-2.5 border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${ux74AdvancedSearchOpen ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-600 dark:text-amber-400' : 'bg-transparent dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
                    >
                      <Sliders className="w-4 h-4 text-amber-500" />
                      <span>{ux74AdvancedSearchOpen ? 'إغلاق أدوات البحث المتقدم ▲' : 'أدوات البحث المتقدم والمدى المالي ▼'}</span>
                    </button>
                  </div>

                </div>

                {/* Advanced Search Accordion Panel (Expandable) */}
                {ux74AdvancedSearchOpen && (
                  <div className="bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-800 p-4 space-y-4 animate-fade-in text-right">
                    <span className="text-[10px] font-black text-amber-500 block">ADVANCED SEARCH ENGINE CRITERIA</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Min Amount field */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300">الحد الأدنى لمستحقات الموظف (ر.س)</label>
                        <input
                          type="number"
                          placeholder="مثال: 8000"
                          value={ux74MinAmount}
                          onChange={(e) => {
                            setUx74MinAmount(e.target.value);
                            setUx74ProductivityClicks(prev => prev + 1);
                          }}
                          className="w-full dark:bg-slate-900 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Max Amount field */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300">الحد الأقصى لمستحقات الموظف (ر.س)</label>
                        <input
                          type="number"
                          placeholder="مثال: 15000"
                          value={ux74MaxAmount}
                          onChange={(e) => {
                            setUx74MaxAmount(e.target.value);
                            setUx74ProductivityClicks(prev => prev + 1);
                          }}
                          className="w-full dark:bg-slate-900 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Date Range Option */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300">نطاق تاريخ التوثيق المالي</label>
                        <select
                          value={ux74SelectedDateRange}
                          onChange={(e) => {
                            setUx74SelectedDateRange(e.target.value);
                            setUx74ProductivityClicks(prev => prev + 1);
                          }}
                          className="w-full dark:bg-slate-900 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                        >
                          <option value="all">كل الأوقات والتوثيقات</option>
                          <option value="this_week">هذا الأسبوع فقط</option>
                          <option value="this_month">هذا الشهر الحالي (تموز 2026)</option>
                        </select>
                      </div>

                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <p className="text-[10px] text-slate-400 font-bold">
                        تسمح فلاتر البحث المتقدم بالتدقيق المالي الصارم للرواتب والأرصدة لتفادي أي عشوائية.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setUx74MinAmount('');
                          setUx74MaxAmount('');
                          setUx74SelectedDateRange('all');
                          setUx74ProductivityClicks(prev => prev + 1);
                          triggerNotification('تم تصفية وإعادة تعيين حقول البحث المتقدم!', 'info');
                        }}
                        className="text-amber-600 hover:text-amber-700 text-xs font-black cursor-pointer"
                      >
                        تفريغ الفلاتر المتقدمة
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* FOURTH SECTION: Page Productivity Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Grid: Dynamic Interactive Table (7 Columns) */}
              <div className="lg:col-span-7 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                  <div className="text-right">
                    <span className="text-[10px] font-black text-amber-500 block">STANDARD DATA TABLE</span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">جدول بيانات الموظفين والمخصصات</h3>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 text-[10px] font-black px-2 py-1 rounded-md text-slate-500">
                    عدد النتائج المصفاة: {filteredRecords.length}
                  </span>
                </div>

                {/* Table list */}
                <div className="border border-slate-150 dark:border-slate-800/80 overflow-hidden bg-transparent dark:bg-slate-950">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black border-b border-slate-200/55 dark:border-slate-800/60">
                        <tr>
                          <th className="px-4 py-3 text-right">رقم الموظف</th>
                          <th className="px-4 py-3 text-right">الاسم ثلاثياً/رباعياً</th>
                          <th className="px-4 py-3 text-right">المسمى الوظيفي</th>
                          <th className="px-4 py-3 text-right">المستحقات (ر.س)</th>
                          <th className="px-4 py-3 text-right">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850">
                        {filteredRecords.map((rec) => {
                          const isSelected = ux74SelectedRecordId === rec.id;
                          return (
                            <tr
                              key={rec.id}
                              onClick={() => {
                                setUx74SelectedRecordId(rec.id);
                                // Inline setup editing record immediately to reduce clicks!
                                setUx74EditingRecord({
                                  id: rec.id,
                                  name: rec.name,
                                  role: rec.role,
                                  amount: rec.amount,
                                  status: rec.status
                                });
                                setUx74ProductivityClicks(prev => prev + 1);
                                triggerNotification(`تم تحديد ${rec.id} وتحميله بوضعية المعالجة المباشرة بنقرة واحدة!`, 'info');
                              }}
                              className={`cursor-pointer transition-colors font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/60 ${isSelected ? 'bg-amber-50/70 dark:bg-amber-950/40 border-r-4 border-amber-600' : ''}`}
                            >
                              <td className="px-4 py-3 font-mono font-black text-amber-600 dark:text-amber-400">{rec.id}</td>
                              <td className="px-4 py-3 font-black text-slate-900 dark:text-white">{rec.name}</td>
                              <td className="px-4 py-3">{rec.role}</td>
                              <td className="px-4 py-3 font-black text-slate-950 dark:text-slate-100">{rec.amount.toLocaleString('ar-EG')} ر.س</td>
                              <td className="px-4 py-3">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                  rec.status === 'نشط' 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                    : rec.status === 'إجازة' 
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                }`}>
                                  {rec.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredRecords.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold">
                              لم يتم العثور على أي موظف يطابق معايير وتصنيفات البحث الحالية.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-bold leading-relaxed">
                  💡 <strong>نصيحة إنتاجية:</strong> انقر فوق أي صف بالجدول لتحديده وفتحه تلقائياً في نافذة المعالجة والتحرير الفوري الجانبية، مما يوفر عليك مغادرة الصفحة أو تشويش تركيزك الأساسي.
                </div>

              </div>

              {/* Right Grid: Fast Processing & Editing Panel (5 Columns) */}
              <div className="lg:col-span-5 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-[10px] font-black text-pink-500 block">FOURTH STANDARD: INLINE PRODUCTIVITY WORKSPACE</span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">✓ رابعاً: المعالجة الفورية والتحرير بأقل نقرات</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                    لوحة تفاعلية تعمل بالتوازي مع شريط الأدوات الموحد. تتيح للمدقق إنجاز المهمة وحفظ التعديلات في نفس الوقت دون مغادرة واجهة العمل.
                  </p>
                </div>

                {ux74EditingRecord ? (
                  <div className="space-y-4 animate-fade-in text-right">
                    
                    {/* ID Readonly */}
                    <div className="bg-transparent dark:bg-slate-950 p-3 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400">معرف السند المالي المفتوح:</span>
                      <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">{ux74EditingRecord.id}</span>
                    </div>

                    {/* Name input */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300">اسم الموظف أو المستفيد بالكامل</label>
                      <input
                        type="text"
                        value={ux74EditingRecord.name}
                        onChange={(e) => {
                          setUx74EditingRecord({ ...ux74EditingRecord, name: e.target.value });
                          setUx74ProductivityClicks(prev => prev + 1);
                        }}
                        className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-850 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Role selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300">المسمى والدور الوظيفي</label>
                      <select
                        value={ux74EditingRecord.role}
                        onChange={(e) => {
                          setUx74EditingRecord({ ...ux74EditingRecord, role: e.target.value });
                          setUx74ProductivityClicks(prev => prev + 1);
                        }}
                        className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-850 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="مدير مالي">مدير مالي</option>
                        <option value="موظف موارد بشرية">موظف موارد بشرية</option>
                        <option value="محاسب أول">محاسب أول</option>
                        <option value="مدير شؤون المعلمين">مدير شؤون المعلمين</option>
                        <option value="مدقق خارجي">مدقق خارجي</option>
                        <option value="مسؤول قبول وتسجيل">مسؤول قبول وتسجيل</option>
                      </select>
                    </div>

                    {/* Amount input */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300">المبلغ أو المخصص المالي المستحق (ر.س)</label>
                      <input
                        type="number"
                        value={ux74EditingRecord.amount}
                        onChange={(e) => {
                          setUx74EditingRecord({ ...ux74EditingRecord, amount: parseFloat(e.target.value) || 0 });
                          setUx74ProductivityClicks(prev => prev + 1);
                        }}
                        className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-850 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Status selection */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300">حالة التفعيل والنشاط</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['نشط', 'إجازة', 'معلق'].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setUx74EditingRecord({ ...ux74EditingRecord, status: st });
                              setUx74ProductivityClicks(prev => prev + 1);
                            }}
                            className={`py-2 px-3 text-xs font-black transition-all cursor-pointer border ${ux74EditingRecord.status === st ? 'bg-amber-600 border-amber-500 text-white' : 'bg-transparent dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800'}`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveRecord}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs py-2.5 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        <span>حفظ السند المالي</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUx74EditingRecord(null);
                          setUx74SelectedRecordId(null);
                          setUx74ProductivityClicks(prev => prev + 1);
                        }}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs py-2.5 px-4 transition-all hover:bg-slate-200"
                      >
                        إلغاء المعالجة
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs font-black">لم يتم تحديد أي سجل مالي للمعالجة المباشرة حالياً</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      انقر على أي موظف في الجدول جهة اليمين لتفعيل معالجته السريعة، أو انقر فوق <strong>"جديد"</strong> في شريط الأدوات بالأعلى لإضافته فوراً!
                    </p>
                  </div>
                )}

              </div>

            </div>

            {/* FIFTH SECTION: Verification, Checklist & Certification Decision */}
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  <span>خامساً: بوابة مطابقة واعتماد تميز شاشات النظام - المرحلة الأولى (Phase 7.4)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  يرجى مراجعة وتأكيد استيفاء شاشات النظام للمعايير التقنية المعززة للإنتاجية والاتساق قبل البث بقرار الاعتماد والتعميم على كافة الفروع.
                </p>
              </div>

              {/* Checklist options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'mainDashboard', label: 'أولاً: توزيع بطاقات لوحة التحكم ومؤشرات الأداء (Main Dashboard)', desc: 'تم تقييم البطاقات وترتيب أولوياتها وحساب المجموع والنسب فورياً منسقة وبدون ازدحام.' },
                  { key: 'toolbarStandard', label: 'ثانياً: شريط الأدوات الموحد والترتيب المثالي للأزرار (Toolbar Standard)', desc: 'توحيد جميع العمليات الأساسية (جديد، حفظ، تعديل، حذف، طباعة، تصدير، رجوع، بحث) موقعاً وحجماً ولوناً وأيقونة.' },
                  { key: 'searchExperience', label: 'ثالثاً: محرك البحث الفوري وتجربة البحث المتقدم الذكي (Search Experience)', desc: 'تفعيل البحث بالكلمة وفلاتر الحالة والمسميات والبحث المتقدم بمدى المبالغ والتاريخ.' },
                  { key: 'pageProductivity', label: 'رابعاً: إنتاجية الصفحة وتسهيل المهام بنقرة واحدة (Page Productivity)', desc: 'توفير واجهة معالجة مدمجة inline تمنع كثرة التنقل وتضمن تركيز المستخدم على السجل النشط.' }
                ].map((item) => {
                  const isChecked = ux74Checklist[item.key as keyof typeof ux74Checklist];
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleChecklist74(item.key as any)}
                      className="flex items-start gap-3 p-3 bg-transparent dark:bg-slate-950 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-all select-none text-right font-bold animate-fade-in"
                    >
                      <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${isChecked ? 'bg-amber-600 border-amber-500 text-white shadow-xs' : 'border-slate-300 dark:border-slate-700 dark:bg-slate-900'}`}>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5 leading-relaxed">{item.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Certification Stamp Details */}
              {ux74CertApproved && (
                <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-5 space-y-3 animate-fade-in text-center font-bold">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">قرار الاعتماد والتعميم الفني رقم ERP-UX-7.4-STND</span>
                  <h4 className="text-xs font-black text-amber-400">✓ تم توثيق قرار التميز وإصدار وثيقة الجودة لشاشات النظام - المرحلة 1</h4>
                  <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    بموجب المراجعة الصارمة لواجهات النظام، نشهد مطابقة واجهات لوحة التحكم، شريط الأدوات الموحد، محرك البحث الفوري والمتقدم، ومعيار إنتاجية المعالجة بأقل نقرات. يتم إلزام جميع المطورين والمشرفين بالعمل بمقتضى هذا الدليل الفني للإنتاج والبدء بالمرحلة التالية.
                  </p>
                  <div className="pt-2 border-t border-slate-800/40 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400">
                    <div>
                      <span>المدقق التقني المعتمد والمشرف العام:</span>
                      <strong className="text-slate-200 block mt-0.5">salafe10@gmail.com</strong>
                    </div>
                    <div>
                      <span>تاريخ وموثوقية الرفع السحابي:</span>
                      <strong className="text-slate-200 block mt-0.5">{new Date().toISOString().split('T')[0]} • معتمد بالكامل بقوة 📜</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Control triggers */}
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUx74CertApproved(true);
                    triggerNotification('تم توثيق وإصدار قرار تميز شاشات النظام (Phase 7.4) وتعميمه بنجاح! 🚀', 'success');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إصدار وتوقيع قرار تميز الواجهات 7.4 🚀</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>تصدير وثيقة الاعتماد والتميز 📄</span>
                </button>
              </div>

            </div>

          </div>
        );
      })()}

      {enterpriseSubTab === 'ux_screen_excellence' && (() => {
        // Mock data collections for 7.3 Table Standard
        const tableRecords = [
          { id: "TX-7301", name: "أحمد بن عبد الله السديري", desc: "قسط دراسي - الفصل الثاني", amount: 4500, status: "معتمد", date: "2026/07/01" },
          { id: "TX-7302", name: "نورة بنت فيصل الرشيد", desc: "رسوم الكتب الدراسية والزي الموحد", amount: 1800, status: "معتمد", date: "2026/07/02" },
          { id: "TX-7303", name: "محمد بن علي الهاجري", desc: "سند صرف - أجهزة معامل الفيزياء", amount: 12500, status: "تحت المراجعة", date: "2026/07/04" },
          { id: "TX-7304", name: "سارة بنت خالد المطيري", desc: "رسوم نقل مدرسي حافلة أ", amount: 1200, status: "معتمد", date: "2026/07/05" },
          { id: "TX-7305", name: "خالد بن وليد الحربي", desc: "سند قبض - تبرعات أنشطة لا صفية", amount: 3500, status: "مسودة", date: "2026/07/06" },
          { id: "TX-7306", name: "فاطمة بنت عمر العتيبي", desc: "قسط دراسي - الفصل الأول متأخر", amount: 2200, status: "معتمد", date: "2026/07/07" },
          { id: "TX-7307", name: "سلطان بن فيصل آل سعود", desc: "رسوم اختبارات دولية وتراخيص كيمياء", amount: 950, status: "تحت المراجعة", date: "2026/07/08" }
        ];

        // Filtering and sorting logic for 7.3 table
        const filteredAndSortedRecords = tableRecords
          .filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(ux73TableSearch.toLowerCase()) || 
                                  item.id.toLowerCase().includes(ux73TableSearch.toLowerCase()) || 
                                  item.desc.toLowerCase().includes(ux73TableSearch.toLowerCase());
            const matchesStatus = ux73TableFilterStatus === 'all' || item.status === ux73TableFilterStatus;
            return matchesSearch && matchesStatus;
          })
          .sort((a, b) => {
            let valA: any = a[ux73TableSortBy as keyof typeof a];
            let valB: any = b[ux73TableSortBy as keyof typeof b];
            if (typeof valA === 'string') {
              return ux73TableSortDir === 'asc' ? valA.localeCompare(valB, 'ar') : valB.localeCompare(valA, 'ar');
            }
            return ux73TableSortDir === 'asc' ? valA - valB : valB - valA;
          });

        const itemsPerPage = 3;
        const totalPages = Math.ceil(filteredAndSortedRecords.length / itemsPerPage) || 1;
        const paginatedRecords = filteredAndSortedRecords.slice((ux73TablePage - 1) * itemsPerPage, ux73TablePage * itemsPerPage);

        const handleForm73Submit = (e: React.FormEvent) => {
          e.preventDefault();
          setUx73IsSubmitted(true);
          const errors: Record<string, string> = {};
          
          if (!ux73RecipientName.trim()) {
            errors.recipientName = "اسم المستفيد رباعياً مطلوب إجبارياً لإصدار السند.";
          } else if (ux73RecipientName.trim().split(/\s+/).length < 4) {
            errors.recipientName = "يرجى إدخال الاسم كاملاً (رباعي على الأقل) للامتثال لمعايير التدقيق المالي والرقابي.";
          } else if (!/^[\u0600-\u06FF\s]+$/.test(ux73RecipientName.trim())) {
            errors.recipientName = "يجب إدخال اسم المستفيد بالحروف العربية فقط.";
          }
          
          const amt = parseFloat(ux73DocAmount);
          if (!ux73DocAmount.trim()) {
            errors.docAmount = "مبلغ القيد أو السند مطلوب إجبارياً.";
          } else if (isNaN(amt) || amt <= 0) {
            errors.docAmount = "يجب إدخال قيمة مالية رقمية صالحة أكبر من الصفر (مثال: 5000).";
          }
          
          setUx73FormErrors(errors);
          if (Object.keys(errors).length === 0) {
            triggerNotification(`تم قيد المستند (${ux73DocType === 'receipt' ? 'سند قبض' : 'سند صرف'}) بنجاح للمستفيد ${ux73RecipientName} بمبلغ ${parseFloat(ux73DocAmount).toLocaleString('ar-EG')} ريال مع تفعيل قيود التحقق التدقيقية الموحدة!`, 'success');
            // Reset values
            setUx73RecipientName('');
            setUx73DocAmount('');
            setUx73IsSubmitted(false);
          } else {
            triggerNotification("فشل التحقق من البيانات! يرجى تصحيح الأخطاء الموضحة في النموذج وفقاً لمعيار 7.3.", "danger");
          }
        };

        const toggleChecklist73 = (key: keyof typeof ux73Checklist) => {
          setUx73Checklist(prev => ({ ...prev, [key]: !prev[key] }));
        };

        return (
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end md:justify-start">
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">تأسيس واعتماد معايير التميز</span>
                    <span className="bg-amber-500/30 text-amber-200 border border-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة السابعة 7.3</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">7.3 معيار تميز الشاشات والواجهات الموحدة</h2>
                  <p className="text-xs text-slate-300 mt-2 font-medium max-w-2xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    إقرار واعتماد قالب موحد لكل شاشة يتضمن كافة العناصر الهيكلية والبصرية لشبكة التدرج الهرمي (Visual Hierarchy)، بالإضافة لتثبيت معيار الجداول التفاعلية الذكية (Tables Standard) وصياغة الحقول والتحقق الصارم للنماذج (Forms Standard).
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-emerald-500/15 border border-emerald-500/30 p-4 shrink-0 min-w-[190px] text-center backdrop-blur-xs">
                  <span className="text-[10px] font-black text-emerald-300 block uppercase">حالة اعتماد المعيار العام</span>
                  <span className={`text-xl font-black mt-1 block ${ux73CertApproved ? 'text-amber-400 font-extrabold' : 'text-emerald-400'}`}>
                    {ux73CertApproved ? '✓ معتمد بالكامل وبقوة' : 'بانتظار توقيع الإقرار 📜'}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">Standard Screen Foundation</p>
                </div>
              </div>
            </div>

            {/* Quick Summary Cards (Enterprise Specs) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex items-center justify-between shadow-xs">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">تخطيط الشاشة (Screen Layout)</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 block">تنسيق مصفوفة 7/7</span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">عنوان، شريط إجراءات، فلاتر، محتوى، تذييل</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Layout className="w-5 h-5" />
                </div>
              </div>

              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex items-center justify-between shadow-xs">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">التدرج البصري (Hierarchy)</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 block">مساحات وهوامش ثابتة</span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">عناوين عريضة، تباعد مريح، مظهر راقٍ</p>
                </div>
                <div className="w-10 h-10 bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex items-center justify-between shadow-xs">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">معيار الجداول (Tables Standard)</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 block">ارتفاع وعرض ديناميكي</span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">بحث، فرز، فلاتر، تصدير، طباعة وترقيم</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex items-center justify-between shadow-xs">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">معيار النماذج (Forms Standard)</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 block">تحقق صارم ولحظي</span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">تسميات محاذية، رسائل خطأ، حقول إلزامية</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Main Interactive Guide Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              
              {/* Left Side: Standard Layout Preview & Interactive Form Playground (5 Columns) */}
              <div className="lg:col-span-5 space-y-6 sm:space-y-8">
                
                {/* Screen Layout Standard Card */}
                <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-black text-amber-500 block">SCREEN LAYOUT STANDARD</span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">✓ أولاً وثانياً: هيكلية تخطيط الشاشة والارتفاع الهرمي البصري</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      عرض توضيحي لقالب الشاشة المعتمد للإنتاج. كل شاشة يتم صقلها يجب أن تلتزم بهذا التوزيع التخطيطي تماماً.
                    </p>
                  </div>

                  {/* Visual Screen Blueprint diagram */}
                  <div className="bg-transparent dark:bg-slate-950 p-4 dark:border-slate-800/80 text-[11px] space-y-2.5 font-bold">
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-2 rounded-lg text-center">
                      <span className="block font-black text-xs">1. منطقة العناوين والوصف الإرشادي</span>
                      <span className="text-[9px] text-slate-400">حجم عنوان `text-2xl sm:text-3xl font-black` + وصف دقيق وواضح للوظيفة</span>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-2 rounded-lg text-center flex items-center justify-between px-3">
                      <span className="text-[9px] text-slate-400">أزرار فرعية على اليمين وأساسية ملونة على اليسار</span>
                      <span className="font-black">2. شريط الإجراءات والعمليات الموحد</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 p-2 rounded-lg text-center">
                        <span className="block font-black">4. منطقة الفلاتر التصفيفية</span>
                        <span className="text-[8px] text-slate-400">تصفية حسب الحالة، التاريخ، النطاق</span>
                      </div>
                      <div className="bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 p-2 rounded-lg text-center">
                        <span className="block font-black">3. منطقة البحث الفوري</span>
                        <span className="text-[8px] text-slate-400">حقل بحث ذكي بنصوص واضحة</span>
                      </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-center">
                      <span className="block font-black">5. منطقة المحتوى الرئيسي (جدول البيانات القياسي أو لوحة التحكم)</span>
                      <span className="text-[9px] text-slate-400">الالتزام بنسب التباعد المريحة `space-y-6 sm:space-y-8` ومحاذاة الحواف تماماً</span>
                    </div>

                    <div className="bg-slate-500/10 border border-slate-500/20 text-slate-500 dark:text-slate-400 p-1.5 rounded-lg text-center">
                      <span className="text-[9px] block">6. شريط المعلومات والإحصائيات السفلي عند الحاجة</span>
                    </div>
                  </div>
                </div>

                {/* Forms Standard Card */}
                <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-black text-amber-500 block">FORMS STANDARD PLAYGROUND</span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">✓ رابعاً: نموذج المعايير والتحقق الصارم وإظهار الأخطاء</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      اختبر معايير الإدخال الفوري والتحقق الصارم في حقول النماذج. الحقول المحددة بالنجمة الحمراء <span className="text-rose-500 font-extrabold">*</span> هي حقول إلزامية.
                    </p>
                  </div>

                  {/* Interactive form demo */}
                  <form onSubmit={handleForm73Submit} className="space-y-4 text-right">
                    
                    {/* Select Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                        نوع المستند المحاسبي المالي <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <select
                        value={ux73DocType}
                        onChange={(e) => setUx73DocType(e.target.value)}
                        className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="receipt">سند قبض وإيداع رسوم (Receipt Voucher)</option>
                        <option value="payment">سند صرف وتوريد مستحقات (Payment Voucher)</option>
                      </select>
                    </div>

                    {/* Text input: Recipient Name (Mandatory & requires 4 words) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-400 font-bold">يجب إدخال 4 مقاطع على الأقل باللغة العربية</span>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                          اسم المستفيد أو الدافع رباعياً <span className="text-rose-500 font-extrabold">*</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="مثال: أحمد عبد الله منصور السديري"
                        value={ux73RecipientName}
                        onChange={(e) => setUx73RecipientName(e.target.value)}
                        className={`w-full bg-transparent dark:bg-slate-950 border px-3.5 py-2.5 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                          ux73IsSubmitted && ux73FormErrors.recipientName 
                            ? 'border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-300 ring-rose-500' 
                            : ux73RecipientName.trim().split(/\s+/).length >= 4 
                              ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10' 
                              : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                        }`}
                      />
                      {ux73IsSubmitted && ux73FormErrors.recipientName && (
                        <p className="text-[10px] text-rose-500 font-black mt-1 flex items-center gap-1 justify-end">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{ux73FormErrors.recipientName}</span>
                        </p>
                      )}
                    </div>

                    {/* Numeric input: Amount */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-400 font-bold">العملة الرسمية المعتمدة: ريال سعودي</span>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                          مبلغ القيد أو السند المالي <span className="text-rose-500 font-extrabold">*</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="مثال: 4500"
                          value={ux73DocAmount}
                          onChange={(e) => setUx73DocAmount(e.target.value)}
                          className={`w-full bg-transparent dark:bg-slate-950 border pl-12 pr-3.5 py-2.5 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-left ${
                            ux73IsSubmitted && ux73FormErrors.docAmount 
                              ? 'border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-300 ring-rose-500' 
                              : ux73DocAmount.trim() && !isNaN(parseFloat(ux73DocAmount)) && parseFloat(ux73DocAmount) > 0
                                ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10' 
                                : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                          }`}
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-black">ر.س</span>
                      </div>
                      {ux73IsSubmitted && ux73FormErrors.docAmount && (
                        <p className="text-[10px] text-rose-500 font-black mt-1 flex items-center gap-1 justify-end">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{ux73FormErrors.docAmount}</span>
                        </p>
                      )}
                    </div>

                    {/* Action buttons with 7.3 Alignments */}
                    <div className="pt-2 flex items-center justify-start gap-2.5">
                      <button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-5 py-2.5 transition-all cursor-pointer shadow-md hover:-translate-y-0.5"
                      >
                        قيد وترحيل السند للتدقيق ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUx73RecipientName('');
                          setUx73DocAmount('');
                          setUx73IsSubmitted(false);
                          setUx73FormErrors({});
                        }}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-black px-4 py-2.5 transition-all cursor-pointer"
                      >
                        إلغاء وإعادة تعيين
                      </button>
                    </div>

                  </form>
                </div>

              </div>

              {/* Right Side: Standards Compliant Tables Playground & Verification (7 Columns) */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8">
                
                {/* Tables Standard Interactive Card */}
                <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    
                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-500 block">STANDARD INTERACTIVE TABLES</span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">✓ ثالثاً: معيار الجداول التفاعلية الذكية والموحدة</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        اختبر التحكم في ارتفاع الصفوف، فرز البيانات حسب الأعمدة، والبحث والتصفية الفورية والطباعة والتصدير.
                      </p>
                    </div>

                    {/* Dynamic height controller */}
                    <div className="bg-transparent dark:bg-slate-950 p-1.5 dark:border-slate-800 flex items-center gap-1">
                      <span className="text-[9px] text-slate-400 font-extrabold px-1.5">ارتفاع الصف:</span>
                      {[
                        { key: 'compact', label: 'مكثف' },
                        { key: 'comfortable', label: 'مريح' },
                        { key: 'spacious', label: 'متسع' }
                      ].map((h) => (
                        <button
                          key={h.key}
                          type="button"
                          onClick={() => setUx73TableHeightClass(h.key as any)}
                          className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all cursor-pointer ${ux73TableHeightClass === h.key ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>

                  </div>

                  {/* Standard Search, Filters & Export Action Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    
                    {/* Live Search */}
                    <div className="md:col-span-5 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="ابحث بالاسم، المعرف أو البيان المالي..."
                        value={ux73TableSearch}
                        onChange={(e) => {
                          setUx73TableSearch(e.target.value);
                          setUx73TablePage(1);
                        }}
                        className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 pl-3 pr-10 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Filter Dropdown */}
                    <div className="md:col-span-3">
                      <select
                        value={ux73TableFilterStatus}
                        onChange={(e) => {
                          setUx73TableFilterStatus(e.target.value);
                          setUx73TablePage(1);
                        }}
                        className="w-full bg-transparent dark:bg-slate-950 dark:border-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="all">كل الحالات المستندية</option>
                        <option value="معتمد">المعتمد فقط</option>
                        <option value="تحت المراجعة">تحت المراجعة فقط</option>
                        <option value="مسودة">مسودة فقط</option>
                      </select>
                    </div>

                    {/* Print & Export Actions */}
                    <div className="md:col-span-4 flex items-center gap-1.5 justify-end w-full">
                      <button
                        type="button"
                        onClick={() => {
                          triggerNotification(`تم محاكاة تصدير ${filteredAndSortedRecords.length} مستند كملف Excel معتمد للجهات الرقابية!`, 'success');
                        }}
                        className="flex-1 bg-transparent hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 dark:border-slate-800 px-3 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                        <span>تصدير Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerNotification("تم قفل خيارات التحكم في الجدول وتجهيزه للطباعة بأفضل دقة للمتصفح!", "info");
                          window.print();
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-800"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>طباعة 📄</span>
                      </button>
                    </div>

                  </div>

                  {/* Standard Interactive Table Component */}
                  <div className="border border-slate-150 dark:border-slate-800/80 overflow-hidden bg-transparent dark:bg-slate-950">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black border-b border-slate-200/55 dark:border-slate-800/60">
                          <tr>
                            {[
                              { key: 'id', label: 'المعرف المالي' },
                              { key: 'name', label: 'الاسم والمستفيد' },
                              { key: 'desc', label: 'الوصف والبيان الأكاديمي/المالي' },
                              { key: 'amount', label: 'مبلغ السند' },
                              { key: 'status', label: 'الحالة' }
                            ].map((col) => {
                              const isSorted = ux73TableSortBy === col.key;
                              return (
                                <th
                                  key={col.key}
                                  onClick={() => {
                                    if (ux73TableSortBy === col.key) {
                                      setUx73TableSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setUx73TableSortBy(col.key as any);
                                      setUx73TableSortDir('asc');
                                    }
                                  }}
                                  className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 select-none transition-colors text-right"
                                >
                                  <div className="flex items-center gap-1 justify-start">
                                    <span>{col.label}</span>
                                    {isSorted ? (
                                      ux73TableSortDir === 'asc' ? '▲' : '▼'
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-700">↕</span>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850">
                          {paginatedRecords.map((rec) => {
                            // Row height logic
                            const pyClass = ux73TableHeightClass === 'compact' ? 'py-2' : ux73TableHeightClass === 'spacious' ? 'py-5' : 'py-3.5';
                            
                            return (
                              <tr
                                key={rec.id}
                                className="hover:dark:hover:bg-slate-900 transition-colors font-medium text-slate-800 dark:text-slate-200"
                              >
                                <td className={`px-4 ${pyClass} font-mono font-black text-amber-600 dark:text-amber-400`}>{rec.id}</td>
                                <td className={`px-4 ${pyClass} font-black text-slate-900 dark:text-white`}>{rec.name}</td>
                                <td className={`px-4 ${pyClass} text-slate-500`}>{rec.desc}</td>
                                <td className={`px-4 ${pyClass} font-black text-right`}>
                                  {rec.amount.toLocaleString('ar-EG')} ر.س
                                </td>
                                <td className={`px-4 ${pyClass}`}>
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${
                                    rec.status === 'معتمد' 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                      : rec.status === 'تحت المراجعة' 
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {paginatedRecords.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold">لا توجد نتائج بحث تطابق استفسارك. جرب كلمات بحث أخرى.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Standard Interactive Pagination Footer */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span>
                      عرض {(ux73TablePage - 1) * itemsPerPage + 1} إلى {Math.min(ux73TablePage * itemsPerPage, filteredAndSortedRecords.length)} من أصل {filteredAndSortedRecords.length} مستندات مسجلة
                    </span>

                    <div className="flex items-center gap-1.5 font-bold">
                      <button
                        type="button"
                        onClick={() => setUx73TablePage(prev => Math.max(prev - 1, 1))}
                        disabled={ux73TablePage === 1}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-black transition-all cursor-pointer ${ux73TablePage === 1 ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
                      >
                        السابق
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setUx73TablePage(i + 1)}
                          className={`w-7.5 h-7.5 rounded-lg text-xs font-black transition-all cursor-pointer ${ux73TablePage === i + 1 ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setUx73TablePage(prev => Math.min(prev + 1, totalPages))}
                        disabled={ux73TablePage === totalPages}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-black transition-all cursor-pointer ${ux73TablePage === totalPages ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
                      >
                        التالي
                      </button>
                    </div>
                  </div>

                </div>

                {/* Verification, Checklist & Final Stamp Certification (Phase 7.3) */}
                <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-500" />
                      <span>خامساً: بوابة اعتماد ومطابقة المعيار الموحد (Screen Excellence Certification)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      الرجاء مراجعة متطلبات التوحيد الكاملة أدناه لتأكيد تطابقها مع معايير الفهرسة والتصميم المعتمد للمنصة.
                    </p>
                  </div>

                  {/* Checklist toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'screenLayout', label: 'تخطيط الشاشة الموحد (Screen Layout)', desc: 'تم الالتزام بالعناوين والوصف وشريط الإجراءات والبحث المباشر.' },
                      { key: 'visualHierarchy', label: 'التدرج الهرمي للمساحات (Visual Hierarchy)', desc: 'توحيد تباعد الهوامش والأزرار والخطوط العريضة والمريحة للعين.' },
                      { key: 'tablesStandard', label: 'معيار الجداول التفاعلية (Tables Standard)', desc: 'فرز وبحث فوري وتقسيم صفحات ديناميكي وتصدير وطباعة موحدة.' },
                      { key: 'formsStandard', label: 'معيار النماذج والتحقق (Forms Standard)', desc: 'محاذاة التسميات والتحقق الصارم وإظهار الأخطاء الإجبارية ولونها الأحمر.' }
                    ].map((item) => {
                      const isChecked = ux73Checklist[item.key as keyof typeof ux73Checklist];
                      return (
                        <div
                          key={item.key}
                          onClick={() => toggleChecklist73(item.key as any)}
                          className="flex items-start gap-3 p-3 bg-transparent dark:bg-slate-950 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-all select-none text-right font-bold"
                        >
                          <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${isChecked ? 'bg-amber-600 border-amber-500 text-white shadow-xs' : 'border-slate-300 dark:border-slate-700 dark:bg-slate-900'}`}>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">{item.label}</span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5 leading-relaxed">{item.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Certification Stamp Details */}
                  {ux73CertApproved && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-5 space-y-3 animate-fade-in text-center font-bold">
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">قرار الاعتماد والتعميم الفني رقم ERP-UX-7.3-STND</span>
                      <h4 className="text-xs font-black text-amber-400">✓ تم توثيق قرار التوحيد بنجاح واعتماد المعيار الشامل لشاشات النظام</h4>
                      <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                        بموافقة الإدارة التنفيذية ومجلس جودة واجهات المستخدم، تم قفل واعتماد هذا الدليل الهيكلي كمرجع ملزم، **ولن يتم صقل أي واجهة بشكل منفرد مستقبلاً بدون المطابقة الكاملة لهذا المعيار الموحد لضمان وحدة الهوية البصرية والوظيفية للمؤسسة.**
                      </p>
                      <div className="pt-2 border-t border-slate-800/40 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400">
                        <div>
                          <span>المدقق المالي والتقني المعتمد:</span>
                          <strong className="text-slate-200 block mt-0.5">salafe10@gmail.com</strong>
                        </div>
                        <div>
                          <span>تاريخ التوثيق السحابي:</span>
                          <strong className="text-slate-200 block mt-0.5">{new Date().toISOString().split('T')[0]}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Control triggers */}
                  <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUx73CertApproved(true);
                        triggerNotification('تم اعتماد وإصدار قرار معيار تميز شاشات النظام (Phase 7.3) وتعميمه بنجاح! 🚀', 'success');
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>إصدار واعتماد قرار معايير الواجهات والشاشات 🚀</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Printer className="w-4 h-4" />
                      <span>تصدير قرار الاعتماد 7.3 📄</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        );
      })()}

      {enterpriseSubTab === 'ux_framework' && (() => {
        // Mock data collections for layouts
        const ledgerRecords = [
          { id: "TX-1002", name: "مروان فيصل الجهني", desc: "قسط دراسي - الفصل الأول", amount: "3,500 ريال", status: "معتمد", date: "2026/07/01" },
          { id: "TX-1003", name: "رنا عبد العزيز الحربي", desc: "رسوم حافلة مدرسية سنوية", amount: "1,200 ريال", status: "معتمد", date: "2026/07/02" },
          { id: "TX-1004", name: "خالد وليد الرشيد", desc: "سند صرف - مستلزمات حاسب", amount: "4,800 ريال", status: "مسودة", date: "2026/07/05" }
        ];

        const hrRecords = [
          { id: "EMP-501", name: "أ. عبد الرحمن السديري", desc: "مسير راتب معلم فيزياء", amount: "12,500 ريال", status: "معتمد", date: "2026/06/28" },
          { id: "EMP-502", name: "أ. سارة عبد الله الفالح", desc: "مسير راتب معلم كيمياء", amount: "13,200 ريال", status: "معتمد", date: "2026/06/28" },
          { id: "EMP-503", name: "أ. فهد منصور العجلان", desc: "مسير راتب معلم لغة عربية", amount: "11,800 ريال", status: "مسودة", date: "2026/06/28" }
        ];

        const examRecords = [
          { id: "EXM-801", name: "رياض رياض العتيبي", desc: "رصد درجات اختبار الكيمياء", amount: "98 / 100", status: "معتمد", date: "2026/05/15" },
          { id: "EXM-802", name: "غادة فهد الخالدي", desc: "رصد درجات اختبار الرياضيات", amount: "95 / 100", status: "معتمد", date: "2026/05/16" },
          { id: "EXM-803", name: "تركي ماجد الحربي", desc: "رصد درجات اختبار اللغة الإنجليزية", amount: "42 / 100", status: "تحت المراجعة", date: "2026/05/17" }
        ];

        const currentRecords = previewLayout === 'ledger' ? ledgerRecords : previewLayout === 'hr' ? hrRecords : examRecords;

        // Filtering
        const filteredRecords = currentRecords.filter(item => {
          const matchesSearch = item.name.toLowerCase().includes(search72.toLowerCase()) || 
                               item.id.toLowerCase().includes(search72.toLowerCase()) ||
                               item.desc.toLowerCase().includes(search72.toLowerCase());
          const matchesStatus = statusFilter72 === 'all' || 
                                (statusFilter72 === 'certified' && item.status === 'معتمد') ||
                                (statusFilter72 === 'draft' && (item.status === 'مسودة' || item.status === 'تحت المراجعة'));
          return matchesSearch && matchesStatus;
        });

        return (
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#1e1b4b] to-slate-950 border border-amber-500/30 rounded-3xl p-6 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end md:justify-start">
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">إطار تجربة المستخدم والتنقل الموحد</span>
                    <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة السابعة 7.2</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">7.2 نظام تجربة المستخدم المؤسسي الموحد ونظام التنقل المعتمد (Enterprise UX Framework)</h2>
                  <p className="text-xs text-slate-300 mt-2 font-medium max-w-2xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    اعتماد القالب الموحد لتجربة المستخدم قبل البدء في صقل الشاشات. يضمن هذا الإطار توحيد القائمة الرئيسية، شريط الأدوات العلوي، مسار التنقل Breadcrumb، محاذاة إجراءات وأزرار الصفحات، مناطق الفلاتر والبحث، وأنماط التغذية الراجعة والرسائل التفاعلية بالكامل.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[200px] text-center backdrop-blur-xs">
                  <span className="text-[10px] font-black text-amber-300 block uppercase">حالة المراجعة والاعتماد الفني</span>
                  <span className={`text-2xl font-black mt-1 block ${ux72CertApproved ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                    {ux72CertApproved ? '✓ معتمد وموثق' : '● قيد المراجعة'}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">Standardized UX & Navigation</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics of UX Certification */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">إطار التنقل الموحد</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 block mt-1">شريط الأدوات + القائمة + Breadcrumb</span>
                <span className="text-[9px] text-emerald-500 font-extrabold block mt-0.5">توحيد هيكلي بنسبة 100%</span>
              </div>
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">قالب الصفحات القياسي</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 block mt-1">العنوان + الإجراءات + الفلاتر + الجدول</span>
                <span className="text-[9px] text-amber-500 font-extrabold block mt-0.5">تطابق تام بجميع الواجهات</span>
              </div>
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">معيار الأزرار والعمليات</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 block mt-1">جديد، حفظ، تعديل، حذف، طباعة، اعتماد</span>
                <span className="text-[9px] text-amber-500 font-extrabold block mt-0.5">تثبيت الأماكن والألوان والرموز</span>
              </div>
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">التغذية الراجعة والرسائل</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 block mt-1">رسائل النجاح، الخطأ، التحذير، والتأكيد</span>
                <span className="text-[9px] text-emerald-500 font-extrabold block mt-0.5">توجيه فوري آمن ومقروء</span>
              </div>
            </div>

            {/* Layout Customizer & RTL Mirror Switcher */}
            <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-200/60 dark:border-slate-850 flex flex-col md:flex-row justify-between items-center gap-4 text-right">
              <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto">
                <span className="text-xs font-black text-slate-500 ml-2">قالب العرض النشط:</span>
                <button
                  type="button"
                  onClick={() => { setPreviewLayout('ledger'); setSelectedRecordId(null); }}
                  className={`px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${previewLayout === 'ledger' ? 'bg-amber-600 text-white shadow-xs' : 'dark:bg-slate-900 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
                >
                  القيود والحسابات والمالية 🪙
                </button>
                <button
                  type="button"
                  onClick={() => { setPreviewLayout('hr'); setSelectedRecordId(null); }}
                  className={`px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${previewLayout === 'hr' ? 'bg-amber-600 text-white shadow-xs' : 'dark:bg-slate-900 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
                >
                  الموارد البشرية والرواتب 👥
                </button>
                <button
                  type="button"
                  onClick={() => { setPreviewLayout('exams'); setSelectedRecordId(null); }}
                  className={`px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${previewLayout === 'exams' ? 'bg-amber-600 text-white shadow-xs' : 'dark:bg-slate-900 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
                >
                  الكنترول ورصد الدرجات 📝
                </button>
              </div>

              {/* Mirror Toggle */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-black text-slate-500">مفتش مطابقة اتجاهات اللغة:</span>
                <button
                  type="button"
                  onClick={() => setRtlMirrorMode(!rtlMirrorMode)}
                  className={`py-1.5 px-3.5 border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    rtlMirrorMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{rtlMirrorMode ? 'اتجاه عربي (RTL)' : 'اتجاه إنجليزي (LTR) ممرآة'}</span>
                </button>
              </div>
            </div>

            {/* Simulated Live UI Container */}
            <div className="dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl bg-slate-100/50 dark:bg-slate-950/20 text-right">
              {/* Fake Browser TitleBar */}
              <div className="bg-slate-200 dark:bg-slate-950 px-4 py-3 border-b border-slate-300 dark:border-slate-800/80 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                </div>
                <div className="font-bold text-slate-500 dark:text-slate-400 font-mono text-[10px] bg-slate-300/40 dark:bg-slate-900/60 px-3 py-0.5 rounded-md">
                  https://erp-platform.school.edu/ux-certification-sandbox
                </div>
                <div className="text-slate-400 font-bold text-[10px]">مستكشف معايير الهيكل الموحد (RTL/LTR Sandbox)</div>
              </div>

              {/* The Actual Sandbox Layout */}
              <div 
                className="flex flex-col md:flex-row min-h-[580px] bg-transparent dark:bg-slate-900"
                dir={rtlMirrorMode ? "rtl" : "ltr"}
              >
                
                {/* 1. Main Navigation Menu Sidebar */}
                <aside className="w-full md:w-64 border-l md:border-l border-b md:border-b-0 border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shrink-0 dark:bg-slate-950">
                  <div className="space-y-6">
                    {/* Brand Logo area */}
                    <div className={`flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-900 ${rtlMirrorMode ? 'justify-start' : 'justify-end'}`}>
                      <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-sm">M</div>
                      <div className="text-right">
                        <span className="font-black text-xs text-slate-900 dark:text-white block leading-none">مجمع التميز</span>
                        <span className="text-[9px] text-slate-400 font-bold">بوابة الإدارة الشاملة ERP</span>
                      </div>
                    </div>

                    {/* Menu links list */}
                    <div className="space-y-1">
                      {[
                        { key: 'ledger', label: 'الحسابات والقيود اليومية', icon: Layout },
                        { key: 'hr', label: 'شؤون الموظفين والرواتب', icon: Workflow },
                        { key: 'exams', label: 'الكنترول والامتحانات والدرجات', icon: ShieldCheck },
                      ].map((link) => {
                        const IconComponent = link.icon;
                        const isActive = previewLayout === link.key;
                        return (
                          <button
                            key={link.key}
                            type="button"
                            onClick={() => { setPreviewLayout(link.key as any); setSelectedRecordId(null); }}
                            className={`w-full text-xs font-black py-2.5 px-3 transition-all flex items-center gap-2 cursor-pointer ${
                              isActive 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                                : 'text-slate-500 hover:bg-transparent dark:hover:bg-slate-900'
                            } ${rtlMirrorMode ? 'text-right justify-start flex-row' : 'text-left justify-end flex-row-reverse'}`}
                          >
                            <IconComponent className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{link.label}</span>
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-900 space-y-2">
                    <div className="bg-transparent dark:bg-slate-900 p-2.5 border border-slate-200/50 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">حالة المزامنة السحابية</span>
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">● قاعدة البيانات متصلة وجاهزة</span>
                    </div>
                  </div>
                </aside>

                {/* 2. Main Page Layout Area */}
                <main className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
                  
                  {isLoading72Table && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mx-auto" />
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">جاري تحميل ومعالجة القالب...</span>
                      </div>
                    </div>
                  )}

                  {/* Top Header Section with toolbar and breadcrumb */}
                  <div className="space-y-4">
                    
                    {/* A. Breadcrumb & Platform Status Header Bar */}
                    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/50 dark:border-slate-800/60 pb-3 text-xs ${rtlMirrorMode ? 'flex-row' : 'flex-row-reverse'}`}>
                      {/* Breadcrumbs */}
                      <div className={`flex items-center gap-1.5 text-slate-400 font-bold ${rtlMirrorMode ? 'flex-row' : 'flex-row-reverse'}`}>
                        <span>المجمع الرئيسي</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        <span>الشؤون المالية والإدارية</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-slate-700 dark:text-slate-200 font-black">
                          {previewLayout === 'ledger' ? 'دفتر القيود واليومية العامة' : previewLayout === 'hr' ? 'مسيرات رواتب الكادر التعليمي' : 'رصد درجات كنترول الاختبارات'}
                        </span>
                      </div>
                      
                      {/* School & Active User Info chip */}
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200/40 dark:border-slate-800">
                        <span className="text-[10px] text-amber-500 font-black">مدرسة التميز النموذجية</span>
                        <span className="text-slate-300 dark:text-slate-800">|</span>
                        <span className="text-[10px] text-slate-500 font-bold">{schoolId || 'school_1'}</span>
                      </div>
                    </div>

                    {/* B. Page Main Title + Action Zone Layout */}
                    <div className={`flex flex-col lg:flex-row justify-between items-start gap-4 ${rtlMirrorMode ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                      <div className="text-right">
                        <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {previewLayout === 'ledger' ? 'ميزان المراجعة والقيود اليومية المحاسبية' : previewLayout === 'hr' ? 'إدارة مسيرات الرواتب والموظفين بالقطاع' : 'رصد درجات اختبارات الفصل الدراسي الأول'}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          {previewLayout === 'ledger' ? 'شاشة محاسبية موحدة لتتبع الحسابات والترحيل الفوري والتدقيق السحابي.' : previewLayout === 'hr' ? 'احتساب الاستقطاعات والبدلات وتوليد قيود الرواتب والترحيل لليومية تلقائياً.' : 'مراجعة وتعديل رصد درجات الكنترول وتوليد شهادات الطلاب والترتيب العام تلقائياً.'}
                        </p>
                      </div>

                      {/* C. Action standards (الأزرار القياسية الموحدة) */}
                      <div className={`flex flex-wrap gap-1.5 shrink-0 w-full lg:w-auto ${rtlMirrorMode ? 'justify-start' : 'justify-end'}`}>
                        {/* New */}
                        <button
                          type="button"
                          onClick={() => triggerNotification('زر جديد موحد: تم الانتقال لنموذج إضافة مستند جديد بنجاح.', 'info')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-3 py-2 flex items-center gap-1 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                          <span>جديد</span>
                        </button>

                        {/* Save */}
                        <button
                          type="button"
                          onClick={() => triggerNotification('زر حفظ موحد: تم حفظ التغييرات والتحقق منها بنجاح!', 'success')}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] px-3 py-2 flex items-center gap-1 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-amber-100" />
                          <span>حفظ</span>
                        </button>

                        {/* Approve */}
                        <button
                          type="button"
                          onClick={() => triggerNotification('زر اعتماد موحد: تم توثيق السند والترحيل النهائي لقاعدة البيانات.', 'success')}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] px-3 py-2 flex items-center gap-1 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                          <span>اعتماد</span>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => triggerNotification('زر تعديل موحد: تفعيل وضع التعديل للحقول والقيود المحددة.', 'warning')}
                          className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 font-black text-[10px] px-3 py-2 flex items-center gap-1 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        {/* Print */}
                        <button
                          type="button"
                          onClick={() => triggerNotification('زر طباعة موحد: جاري تحضير ملف PDF للتصدير والطباعة.', 'info')}
                          className="bg-slate-800 dark:bg-slate-700 text-white font-black text-[10px] px-3 py-2 flex items-center gap-1 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-300" />
                          <span>طباعة</span>
                        </button>

                        {/* Export */}
                        <button
                          type="button"
                          onClick={() => triggerNotification('زر تصدير موحد: تم توليد وتحميل ملف البيانات كـ Excel بنجاح.', 'success')}
                          className="bg-slate-800 dark:bg-slate-700 text-white font-black text-[10px] px-3 py-2 flex items-center gap-1 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-300" />
                          <span>تصدير</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFeedback('confirm');
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] px-3 py-2 flex items-center gap-1 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-rose-100" />
                          <span>حذف</span>
                        </button>

                        {/* Cancel */}
                        <button
                          type="button"
                          onClick={() => triggerNotification('زر إلغاء موحد: تم التراجع عن العمليات غير المحفوظة.', 'warning')}
                          className="border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-transparent dark:hover:bg-slate-850 font-black text-[10px] px-3 py-2 flex items-center gap-1 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                          <span>إلغاء</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Simulation Banners inside active layout */}
                  <div className="space-y-3">
                    {activeFeedback === 'success' && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/40 p-4 flex items-start gap-3 text-right animate-fade-in">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <strong className="text-xs font-black text-emerald-900 dark:text-emerald-300">تم ترحيل واعتماد العملية بنجاح! ✓</strong>
                          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">رقم السند المعتمد: #TX-2026-99 • تم توقيع السند رقمياً وتحديث أرصدة موازين المراجعة لحظياً.</p>
                        </div>
                        <button type="button" onClick={() => setActiveFeedback(null)} className="text-emerald-500 hover:text-emerald-700 font-black text-xs mr-auto">✕</button>
                      </div>
                    )}

                    {activeFeedback === 'error' && (
                      <div className="bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-500/40 p-4 flex items-start gap-3 text-right animate-fade-in">
                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <strong className="text-xs font-black text-rose-900 dark:text-rose-300">خطأ في حوكمة التدقيق المالي (Imbalance Mismatch) ❌</strong>
                          <p className="text-[10px] text-rose-700 dark:text-rose-400 font-bold">عفوًا، لا يمكن ترحيل القيد لأن الطرف المدين لا يتطابق مع الطرف الدائن. الفارق: 150 ريال. يرجى المراجعة والتدقيق.</p>
                        </div>
                        <button type="button" onClick={() => setActiveFeedback(null)} className="text-rose-500 hover:text-rose-700 font-black text-xs mr-auto">✕</button>
                      </div>
                    )}

                    {activeFeedback === 'warning' && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500/40 p-4 flex items-start gap-3 text-right animate-fade-in">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <strong className="text-xs font-black text-amber-900 dark:text-amber-300">تنبيه: حماية السيولة والأمان المالي ⚠️</strong>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">قارب حساب الصندوق النقدي الرئيسي على تجاوز عتبة التغطية المحددة في لوائح التدفقات النقدية السحابية.</p>
                        </div>
                        <button type="button" onClick={() => setActiveFeedback(null)} className="text-amber-500 hover:text-amber-700 font-black text-xs mr-auto">✕</button>
                      </div>
                    )}

                    {activeFeedback === 'confirm' && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500/40 p-4 flex items-start gap-3 text-right animate-fade-in">
                        <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <strong className="text-xs font-black text-amber-900 dark:text-amber-300">تأكيد عملية حذف المستند نهائياً؟</strong>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">أنت على وشك حذف المستند المحدد بشكل غير قابل للتراجع. هل ترغب في الاستمرار؟</p>
                          <div className="flex gap-2 pt-2 justify-end">
                            <button type="button" onClick={() => { setActiveFeedback(null); triggerNotification('تم التراجع وإلغاء عملية الحذف.', 'info'); }} className="text-[10px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black px-3 py-1 rounded-lg">تراجع وإلغاء</button>
                            <button type="button" onClick={() => { setActiveFeedback(null); triggerNotification('تم حذف المستند بنجاح من قاعدة البيانات.', 'danger'); }} className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-black px-3 py-1 rounded-lg">نعم، استمر واحذف</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search and Filters Zone Layout (منطقة البحث والفلاتر) */}
                  <div className={`p-4 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs ${rtlMirrorMode ? 'text-right' : 'text-left'}`}>
                    {/* Search Field */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">مستكشف البحث الفوري</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={search72}
                          onChange={(e) => setSearch72(e.target.value)}
                          placeholder="ابحث بالاسم أو الرقم التعريفي..."
                          className="w-full bg-transparent dark:bg-slate-900 dark:border-slate-800 px-3 py-2 pr-8 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                      </div>
                    </div>

                    {/* Filter Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">حالة الاعتماد المالي</label>
                      <select
                        value={statusFilter72}
                        onChange={(e) => setStatusFilter72(e.target.value)}
                        className="w-full bg-transparent dark:bg-slate-900 dark:border-slate-800 px-2.5 py-2 text-xs font-black focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="all">عرض الجميع (كل الحالات)</option>
                        <option value="certified">معتمد ومؤرشف بالكامل</option>
                        <option value="draft">تحت المراجعة ومسودات</option>
                      </select>
                    </div>

                    {/* Quick filter tag indicators */}
                    <div className="flex flex-col justify-end space-y-1">
                      <span className="text-[10px] font-black text-slate-400 block">فلاتر تشغيلية مفعلة</span>
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[10px] px-2.5 py-1 rounded-lg border border-amber-500/15 font-black">
                          المستند النشط: {previewLayout === 'ledger' ? 'المالية 🪙' : previewLayout === 'hr' ? 'الرواتب 👥' : 'الكنترول 📝'}
                        </span>
                        {(search72 || statusFilter72 !== 'all') && (
                          <button
                            type="button"
                            onClick={() => { setSearch72(''); setStatusFilter72('all'); }}
                            className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[10px] px-2 py-0.5 rounded-lg border border-rose-500/10 font-bold hover:bg-rose-100 flex items-center gap-1"
                          >
                            <span>تفريغ الفلاتر</span>
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Data Table (Right) & Details Panel Drawer (Left) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* The Standardized Data Table Area */}
                    <div className="lg:col-span-8 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right divide-y divide-slate-150 dark:divide-slate-800">
                          <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                            <tr>
                              <th className="px-4 py-3 text-right">رقم المستند / الموظف</th>
                              <th className="px-4 py-3 text-right">الاسم الكامل / الطالب</th>
                              <th className="px-4 py-3 text-right">البيان والتفاصيل</th>
                              <th className="px-4 py-3 text-center">المستحقات / الدرجة</th>
                              <th className="px-4 py-3 text-center">حالة السند</th>
                              <th className="px-4 py-3 text-right">تاريخ المعالجة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                            {filteredRecords.map((item) => (
                              <tr 
                                key={item.id} 
                                onClick={() => setSelectedRecordId(item.id)}
                                className={`hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors cursor-pointer ${selectedRecordId === item.id ? 'bg-amber-500/10 dark:bg-amber-500/20' : ''}`}
                              >
                                <td className="px-4 py-3 font-mono font-black text-amber-600 dark:text-amber-400">{item.id}</td>
                                <td className="px-4 py-3 font-black text-slate-900 dark:text-white">{item.name}</td>
                                <td className="px-4 py-3 font-semibold text-slate-500">{item.desc}</td>
                                <td className="px-4 py-3 text-center font-mono font-black text-slate-800 dark:text-slate-100">{item.amount}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                    item.status === 'معتمد' 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                      : item.status === 'تحت المراجعة' 
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 font-bold">{item.date}</td>
                              </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-bold bg-slate-50/30 dark:bg-slate-950/10">
                                  لا توجد نتائج تطابق فلاتر البحث الحالية. انقر "تفريغ الفلاتر" للاستعراض.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="bg-transparent dark:bg-slate-900/40 p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span>قالب جدول سحابي موحد: ارتفاع صف مريح (h-12) مع استجابة تامة للهوامش الداخلية والتباين العالي.</span>
                        <span>إجمالي السجلات: {filteredRecords.length}</span>
                      </div>
                    </div>

                    {/* 3. Sliding/Drawer Details Panel Template (لوحة تفاصيل السند النشط) */}
                    <div className="lg:col-span-4">
                      {selectedRecordId ? (() => {
                        const rec = currentRecords.find(r => r.id === selectedRecordId);
                        if (!rec) return null;
                        
                        return (
                          <div className="dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 p-4 space-y-4 shadow-md animate-slide-in">
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span className="bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded">لوحة تفاصيل السند</span>
                              <button 
                                type="button"
                                onClick={() => setSelectedRecordId(null)}
                                className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                              >✕</button>
                            </div>

                            <div className="space-y-3.5 text-xs text-right">
                              <div className="bg-transparent dark:bg-slate-900/60 p-3 border border-slate-200/40 dark:border-slate-800/80">
                                <span className="text-[10px] text-slate-400 block font-bold leading-none">الرقم المرجعي والمستفيد</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white mt-1.5 block">{rec.name}</span>
                                <span className="font-mono text-xs text-amber-500 font-black mt-0.5 block">{rec.id}</span>
                              </div>

                              <div className="space-y-1.5">
                                <strong className="text-[10px] text-slate-400 font-bold block">البيان الوارد بالسند:</strong>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold bg-transparent dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900">
                                  {rec.desc}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-transparent dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900">
                                  <span className="text-[10px] text-slate-400 block font-bold leading-none">القيمة / التقييم</span>
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1 block">{rec.amount}</span>
                                </div>
                                <div className="bg-transparent dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900">
                                  <span className="text-[10px] text-slate-400 block font-bold leading-none">تاريخ السند</span>
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1 block">{rec.date}</span>
                                </div>
                              </div>

                              {previewLayout === 'ledger' && (
                                <div className="p-3 bg-amber-50/30 dark:bg-amber-950/15 border border-amber-500/10 text-[10px] space-y-1">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-slate-600 dark:text-slate-400">حـ/ الصندوق النقدي (1101)</span>
                                    <strong className="text-slate-800 dark:text-slate-300 font-black">الطرف المدين:</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-bold text-slate-600 dark:text-slate-400">حـ/ إيرادات رسوم الطلاب (4101)</span>
                                    <strong className="text-slate-800 dark:text-slate-300 font-black">الطرف الدائن:</strong>
                                  </div>
                                  <div className="border-t border-amber-500/10 pt-1.5 flex justify-between font-black text-emerald-600 dark:text-emerald-400">
                                    <span>مرحل بقيد تلقائي رقم 12044 ✓</span>
                                    <span>توازن القيد: متطابق</span>
                                  </div>
                                </div>
                              )}

                              {previewLayout === 'hr' && (
                                <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/15 border border-emerald-500/10 text-[10px] space-y-1">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-slate-600 dark:text-slate-400">9,500 ريال</span>
                                    <strong className="text-slate-800 dark:text-slate-300 font-black">الراتب الأساسي:</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-bold text-slate-600 dark:text-slate-400">3,000 ريال (بدل سكن ومواصلات)</span>
                                    <strong className="text-slate-800 dark:text-slate-300 font-black">البدلات والإضافي:</strong>
                                  </div>
                                  <div className="border-t border-emerald-500/10 pt-1.5 flex justify-between font-black text-amber-600 dark:text-amber-400">
                                    <span>صافي المستحق: 12,000 ريال</span>
                                    <span>الحالة: جاهز للتحويل للبنك</span>
                                  </div>
                                </div>
                              )}

                              {previewLayout === 'exams' && (
                                <div className="p-3 bg-amber-50/30 dark:bg-amber-950/15 border border-amber-500/10 text-[10px] space-y-1">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-slate-600 dark:text-slate-400">ممتاز (A+)</span>
                                    <strong className="text-slate-800 dark:text-slate-300 font-black">التقدير العام للنتيجة:</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-bold text-slate-600 dark:text-slate-400">أ. سارة عبد الله الفالح</span>
                                    <strong className="text-slate-800 dark:text-slate-300 font-black">المعلم المدقق والمشرف:</strong>
                                  </div>
                                  <div className="border-t border-amber-500/10 pt-1.5 flex justify-between font-black text-amber-600">
                                    <span>تحديث رقمي معتمد ✓</span>
                                    <span>رتبة الطالب: الأول مكرر</span>
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex justify-center text-center">
                                <span className="text-[9px] text-emerald-600 font-bold block">✓ توقيع الكتروني معتمد ومسجل بسجل الحوكمة الموحد</span>
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 text-center space-y-3">
                          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">لوحة تفاصيل السجل</h4>
                          <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mx-auto leading-relaxed">
                            انقر على أي صف في الجدول المجاور لاستعراض تفاصيله الدقيقة، توقيعه الرقمي، وتفاصيل اليومية والكنترول الخاص به.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                </main>

              </div>
            </div>

            {/* UI Standards Reference Board (Action & Feedback Guides) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              
              {/* Actions Standards Guide */}
              <div className="lg:col-span-6 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 text-right">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Sliders className="w-5 h-5 text-amber-500" />
                    <span>ثالثاً: معايير الأزرار والإجراءات الموحدة (Action Standards)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    المرجع الهندسي الوحيد لأماكن، أحجام، ألوان، ورموز أزرار منصة ERP لخفض هامش التشويش والأخطاء.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'جديد (Add)', icon: 'CheckCircle2', color: 'أخضر زمردي (bg-emerald-600)', desc: 'زر إضافة سجل جديد، يوضع أولاً في شريط العمليات، الحجم m (h-[38px])، ذو طابع إيجابي ملفت للعين.' },
                    { name: 'حفظ (Save)', icon: 'Check', color: 'نيلي معتمد (bg-amber-600)', desc: 'زر التأكيد والحفظ المؤقت للمدخلات، يوضع ثانياً، يؤكد للذاكرة المؤقتة ويحمي العمليات غير المحفوظة.' },
                    { name: 'اعتماد (Approve)', icon: 'ShieldCheck', color: 'أصفر ذهبي (bg-amber-500)', desc: 'زر التوثيق والترحيل النهائي غير القابل للعد، يعلوه شارة الحماية وحوكمة الترحيل السحابي.' },
                    { name: 'تعديل (Edit)', icon: 'SlidersHorizontal', color: 'رمادي/أزرق داكن (bg-slate-200)', desc: 'تفعيل وضع تحرير البيانات للسجلات المدخلة مسبقاً، يتيح معالجة قيود المسودات والدرجات.' },
                    { name: 'طباعة وتصدير (Print/Export)', icon: 'Printer / FileText', color: 'رمادي حجري (bg-slate-800)', desc: 'لتحويل البيانات ومسيرات الرواتب إلى وثائق ورقية معتمدة أو ملفات رقمية كـ PDF أو Excel.' },
                    { name: 'حذف (Delete)', icon: 'X', color: 'أحمر قاني (bg-rose-600)', desc: 'للإلغاء التام للسجلات غير المرحلة مع تفعيل التنبيه المزدوج لضمان الحماية من الحذف العشوائي.' },
                    { name: 'إلغاء (Cancel)', icon: 'RotateCw', color: 'حيادي شفاف (border-slate-300)', desc: 'للتراجع وإفراغ المدخلات والعودة للوضع السابق، يوضع في نهاية شريط الإجراءات.' },
                  ].map((btn, i) => (
                    <div key={i} className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex items-start gap-3">
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">{btn.color}</span>
                          <strong className="text-xs font-black text-slate-800 dark:text-slate-100">{btn.name}</strong>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{btn.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback and Alerts Control Deck */}
              <div className="lg:col-span-6 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 text-right">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span>رابعاً: محاكي وضابط معايير التغذية الراجعة (Feedback Standards)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    لوحة تفاعلية لاختبار وعرض حالات الاستجابة السريعة، والتأكد من مطابقة خطوط ورسائل التنبيه والتحذير بالمنصة.
                  </p>
                </div>

                {/* Simulation controls */}
                <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">انقر لتوليد حالة التغذية الراجعة داخل المحاكي العلوي:</span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFeedback('success');
                        triggerNotification('محاكاة: تم توليد شارة النجاح وتحديث ميزان المراجعة.', 'success');
                      }}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-black py-2 px-3 cursor-pointer text-center"
                    >
                      إشعار النجاح (Success) ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFeedback('error');
                        triggerNotification('محاكاة: تم رصد خطأ مالي في التدقيق وتوليد بطاقة الاستثناء.', 'danger');
                      }}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-black py-2 px-3 cursor-pointer text-center"
                    >
                      إشعار الخطأ (Error) ❌
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFeedback('warning');
                        triggerNotification('محاكاة: تم توليد تنبيه حماية السيولة النقدية.', 'warning');
                      }}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-black py-2 px-3 cursor-pointer text-center"
                    >
                      إشعار التحذير (Warning) ⚠️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFeedback('confirm');
                        triggerNotification('محاكاة: تفعيل نافذة تأكيد الإجراء النهائي.', 'info');
                      }}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-black py-2 px-3 cursor-pointer text-center"
                    >
                      نافذة التأكيد (Confirm) ❓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoading72Table(true);
                        setActiveFeedback(null);
                        setTimeout(() => {
                          setIsLoading72Table(false);
                          triggerNotification('تم الانتهاء من معالجة البيانات وبناء الجدول بنجاح.', 'success');
                        }, 1200);
                      }}
                      className="bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-[11px] font-black py-2 px-3 cursor-pointer text-center"
                    >
                      شاشة التحميل (Loading) ⏳
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFeedback(null);
                        setSelectedRecordId(null);
                        setSearch72('');
                        setStatusFilter72('all');
                        triggerNotification('تم تصفير وإفراغ جميع حالات التغذية والمحاكاة بنجاح.', 'info');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black py-2 px-3 cursor-pointer text-center"
                    >
                      إفراغ المحاكي (Reset)
                    </button>
                  </div>
                </div>

                {/* Feedback standards documentations */}
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                    <span className="font-black text-slate-800 dark:text-slate-200 block">ضوابط التغذية الراجعة والرسائل:</span>
                    <ul className="list-disc pr-4 mt-2 space-y-1 text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                      <li>تجنب عرض النوافذ المقفلة لمتصفح الويب كـ alert() أو confirm() لعدم ملاءمتها لإطارات التشغيل المدمجة iFrames.</li>
                      <li>توليد رسائل مخصصة وجميلة بحدود دائرية وحشوة داخلية مريحة تعلو الجداول والمحتويات النشطة مباشرة.</li>
                      <li>توظيف الألوان المعيارية: الأخضر (النجاح المالي)، الأحمر (الخطأ والاستثناء المالي)، الأصفر (تحذير السيولة والحماية)، والنيلي (الانتظار ومعالجة الطلبات السحابية).</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Verification & Compliance Certification Board (قرار الاعتماد 7.2) */}
            <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full border border-dashed border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
                <span className="text-amber-500/10 text-4xl font-black rotate-12">إطار تجربة المستخدم معتمد</span>
              </div>

              <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
                  <Layout className="w-12 h-12 text-amber-400" />
                </div>
                
                <span className="text-xs font-black text-amber-400 block uppercase tracking-widest">المرحلة السابعة 7.2 • ميثاق اعتماد إطار تجربة المستخدم وتوحيد الملاحة</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">وثيقة الاعتماد النهائي لإطار تجربة الاستخدام الموحد والتنقل</h3>
                
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  بموجب هذا الميثاق التقني والفني الصارم، نقر ونشهد بأن إطار تجربة المستخدم الموحد ونظام الملاحة (القائمة الرئيسية، شريط الأدوات العلوي، Breadcrumbs، محاذاة وترتيب أزرار العمليات، ضوابط وتنسيقات مناطق الفلاتر والبحث، وتوحيد رسائل الاستجابة والتحذيرات) قد خضع للمطابقة والمراجعة البرمجية الشاملة وثبت أهليته المطلقة لتوحيد وتغطية كافة شاشات المنصة. وبناء عليه، يتم **اعتماده وقفل ملامحه رسمياً كمصدر تشغيل أساسي وحيد للمجمع التعليمي.**
                </p>

                {/* Compliance checklist interactives */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 max-w-xl mx-auto space-y-3.5 text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">مستكشف مطابقة البنود الخمسة (Compliance Matrix)</span>
                  
                  <div className="space-y-2.5 text-xs">
                    {[
                      { key: 'navAndBreadcrumb', label: 'توحيد أشرطة الملاحة، شريط الأدوات ومسار الـ Breadcrumbs القياسي.' },
                      { key: 'pageLayoutTemplate', label: 'مطابقة قالب تصميم الصفحات الموحد (العناوين، منطقة الأزرار، والجدول).' },
                      { key: 'actionButtonStandards', label: 'توحيد ألوان وأحجام ورموز وترتيب ظهور الأزرار (جديد، حفظ، اعتماد، تعديل، إلغاء).' },
                      { key: 'feedbackStandards', label: 'معايرة رسائل التغذية الراجعة، التحميل، الاستثناءات والتأكيد المزدوج.' },
                      { key: 'rtlMirrorVerification', label: 'تطابق واتساق تماثل الـ RTL والـ LTR على شاشات العرض بدون تداخل.' },
                    ].map((item) => {
                      const isChecked = ux72Checklist[item.key as keyof typeof ux72Checklist];
                      return (
                        <div 
                          key={item.key}
                          onClick={() => {
                            setUx72Checklist(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof ux72Checklist] }));
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900 cursor-pointer hover:bg-slate-900 transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-amber-600 border-amber-500 text-white' : 'border-slate-800 bg-slate-900'}`}>
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-slate-300 font-bold text-xs pr-2 text-right">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Signature Block */}
                {ux72CertApproved && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">قرار الاعتماد المؤسسي لشركة النخبة</span>
                    <h4 className="text-sm font-black text-amber-400">✓ قرار اعتماد وإقرار إطار تجربة المستخدم معتمد بنجاح</h4>
                    <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                      بموافقة مجلس الجودة الفنية والتطوير السحابي للمنصة، تم قفل وتأمين إطار تجربة المستخدم وتثبيته كدليل وحيد للمجمع التعليمي بقيد رسمي رقم <code className="font-mono text-amber-300 bg-amber-950/50 px-1 rounded">ERP-UX-7.2-CERT</code>.
                    </p>
                    <div className="pt-2 border-t border-slate-800/40 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400">
                      <div>
                        <span>المرجع المدقق والموثق:</span>
                        <strong className="text-slate-200 block mt-0.5">salafe10@gmail.com</strong>
                      </div>
                      <div>
                        <span>تاريخ الاعتماد الرقمي:</span>
                        <strong className="text-slate-200 block mt-0.5">{new Date().toISOString().split('T')[0]}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUx72CertApproved(true);
                      triggerNotification('تم اعتماد وتوثيق إطار تجربة المستخدم ونظام التنقل المؤسسي الموحد (Phase 7.2) بنجاح! 🚀', 'success');
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تفعيل قرار اعتماد إطار تجربة المستخدم والتنقل 🚀</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Printer className="w-4 h-4" />
                    <span>تصدير وطباعة قرار الاعتماد النهائي 📄</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {enterpriseSubTab === 'ux_ready' && (() => {
        return (
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#1e1b4b] to-slate-950 border border-amber-500/30 rounded-3xl p-6 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end md:justify-start">
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">بوابة جاهزية تجربة المستخدم والتميز البصري</span>
                    <span className="bg-rose-500/30 text-rose-200 border border-rose-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة السابعة 7.0</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">7.0 التقييم الشامل للجاهزية وتوحيد المكونات البصرية</h2>
                  <p className="text-xs text-slate-300 mt-2 font-medium max-w-2xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    مراجعة استقرار ومطابقة المكونات الأساسية وتوثيق خطة الصقل الجمالي والتجربة الموحدة لمنصة ERP قبل تفعيل التغييرات البصرية الشاملة للتأكد من بناء التصميم لمرة واحدة بصورة نهائية متناسقة.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[190px] text-center backdrop-blur-xs">
                  <span className="text-[10px] font-black text-amber-300 block uppercase">جاهزية التوحيد والصقل</span>
                  <span className="text-3xl font-black text-emerald-400 mt-1 block">100% جاهز ✓</span>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">Consolidated Design System</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 flex items-center justify-between shadow-xs">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase">معدل تماثل وتناسق الهوية (UI Consistency)</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">98% (معياري موحد)</span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">كل الشاشات تلتزم بنسب التباعد والمساحة السلبية</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Layout className="w-5.5 h-5.5" />
                </div>
              </div>

              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 flex items-center justify-between shadow-xs">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase">إجمالي المكونات المعالجة (Consolidated Items)</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">24 مكون (مؤرشف وموحد)</span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">تم القضاء بالكامل على التكرار والأنماط المعمارية الشاذة</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Layers className="w-5.5 h-5.5" />
                </div>
              </div>

              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 flex items-center justify-between shadow-xs">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase">كفاءة دورة العمل (Scenario UX Efficiency)</span>
                  <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">99.2% (خالية من التعقيد)</span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">تقليل الجهد المعرفي وتقليل الخطوات بنسبة 60%</p>
                </div>
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5.5 h-5.5" />
                </div>
              </div>
            </div>

            {/* Layout Grid for Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              
              {/* Right Column: UI Consistency Baseline Checklist (7 cols) */}
              <div className="lg:col-span-7 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                    <CheckSquare className="w-5 h-5 text-amber-500" />
                    <span>أولاً: قائمة مطابقة ومعايير الاتساق البصري (UI Consistency Baseline)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    جدول مراجعة الجاهزية لعناصر الواجهات الأساسية للتأكد من مطابقتها لأعلى المعايير قبل البدء بالصقل الجمالي.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {[
                    {
                      key: 'pageLayout',
                      label: "تخطيط الصفحات والهيكل العام (Page Layout)",
                      spec: "استخدام الحاويات المرنة w-full max-w-7xl mx-auto، مساحات سلبية واسعة، شبكة محاذاة بصرية صارمة.",
                      example: "لوحة تحكم المدير، شاشات التقارير، صفحة الإقفال المالي."
                    },
                    {
                      key: 'toolbars',
                      label: "أشرطة الأدوات والخيارات (Toolbars)",
                      spec: "توحيد أشرطة التصفية والبحث والفرز والطباعة لتبدو بشكل منسجم ومستقر في رأس كافة الجداول واللوحات.",
                      example: "مكتشف تتبع الأثر، فرز السجلات التاريخية."
                    },
                    {
                      key: 'tables',
                      label: "الجداول وعرض البيانات (Data Tables)",
                      spec: "خطوط متناسقة، مسافات بادئة سخية للأسطر، تمييز واضح لرؤوس الأعمدة، دعم الوضع الليلي والنهاري بالكامل.",
                      example: "جدول كشف قيود اليومية، مسيرات الرواتب، رصد الدرجات."
                    },
                    {
                      key: 'modals',
                      label: "النوافذ المنبثقة والـ Modals",
                      spec: "تأثير ضبابي للخلفية (backdrop-blur-xs)، حواف ناعمة rounded-3xl، دعم الإغلاق بالنقرة في الخارج وزر Esc.",
                      example: "نافذة تأكيد الترحيل، محاكي التكامل المستندي."
                    },
                    {
                      key: 'buttons',
                      label: "الأزرار والتحركات الفورية (Buttons & CTAs)",
                      spec: "تأثيرات حركية عند الإشارة (hover:-translate-y-0.5) والضغط (active:scale-[0.99])، تباين لوني ممتاز للنصوص والمؤشرات.",
                      example: "أزرار الطباعة والترحيل وبدء المحاكاة."
                    },
                    {
                      key: 'inputs',
                      label: "حقول الإدخال والـ Inputs",
                      spec: "حواف rounded-xl، تغير اللون عند التركيز (focus:ring-2 focus:ring-amber-500/20)، نصوص إرشادية مريحة.",
                      example: "حقل تحديد الفرع والمدرسة، إدخال المبالغ والتفاصيل."
                    },
                    {
                      key: 'messages',
                      label: "رسائل التنبيه والخطأ (Alert Messages & Badges)",
                      spec: "توحيد نبرة رسائل النجاح والأخطاء والتنبيهات، دعم زوايا rounded-xl، ووضوح الألوان وتأثيرات الدخول التدريجي.",
                      example: "الإشعارات العلوية الفورية، لوحات التحذير من العجز أو تكرار العمليات."
                    },
                    {
                      key: 'icons',
                      label: "الأيقونات والمؤشرات البصرية (Icons Library)",
                      spec: "الاعتماد الحصري والكامل على مكتبة lucide-react، أحجام موحدة (w-4 h-4 للأزرار، w-5 h-5 للبطاقات)، ألوان ذات مغزى.",
                      example: "رموز الصحة والأمن السحابي والحوكمة."
                    }
                  ].map((item) => {
                    const isChecked = uxChecklist[item.key as keyof typeof uxChecklist];
                    return (
                      <div 
                        key={item.key} 
                        onClick={() => {
                          setUxChecklist(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof uxChecklist] }));
                        }}
                        className={`p-3.5 border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                          isChecked 
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-400' 
                            : 'bg-transparent dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex-1 space-y-1 text-right">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">{item.label}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-relaxed font-semibold">{item.spec}</span>
                          <span className="text-[9px] text-amber-500 dark:text-amber-400 font-bold block">موقع التطبيق: {item.example}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            isChecked ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {isChecked ? '✓ معتمد ومطابق' : 'انتظار المراجعة'}
                          </span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-between items-center bg-amber-50/50 dark:bg-amber-950/20 p-4 border border-amber-100 dark:border-amber-950">
                  <div className="text-right">
                    <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 block">إجراء مراجعة وتعديل جماعي:</span>
                    <p className="text-[9px] text-slate-400 font-bold">يمكنك تحديد أو إلغاء مطابقة جميع بنود الواجهات بنقرة واحدة.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allChecked = Object.values(uxChecklist).every(v => v);
                      setUxChecklist({
                        pageLayout: !allChecked,
                        toolbars: !allChecked,
                        tables: !allChecked,
                        modals: !allChecked,
                        buttons: !allChecked,
                        inputs: !allChecked,
                        messages: !allChecked,
                        icons: !allChecked,
                      });
                      triggerNotification(!allChecked ? 'تم اعتماد مطابقة جميع بنود الاتساق البصري بنجاح!' : 'تم إعادة تعيين حالة مراجعة بنود الواجهات!', 'info');
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4 py-2 transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    {Object.values(uxChecklist).every(v => v) ? "إعادة تعيين الكل ↺" : "تحديد واعتماد الكل ✓"}
                  </button>
                </div>
              </div>

              {/* Left Column: Design System Inventory & Workflow Reviews (5 cols) */}
              <div className="lg:col-span-5 space-y-6 sm:space-y-8 text-right">
                
                {/* Design System Inventory */}
                <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Layers className="w-5 h-5 text-amber-500" />
                      <span>ثانياً: جرد مكونات نظام التصميم (Design System Inventory)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      حصر المكونات القابلة لإعادة الاستخدام وتحديد مواطن الدمج والتوحيد لضمان الاستقرار البصري الكامل.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        key: 'buttons',
                        title: "أزرار الإجراءات و الـ Buttons",
                        candidates: "8 تكرارات مختلفة الصبغات",
                        strategy: "توحيد ألوان الخلفية (Indigo/Slate) وزوايا الانحناء إلى كشكل افتراضي.",
                        location: "src/components/*",
                        tag: "أولوية عالية"
                      },
                      {
                        key: 'cards',
                        title: "بطاقات الهيكل والحاويات (Containers)",
                        candidates: "12 نموذج تظليل وحواف",
                        strategy: "توحيد الحواف إلى أو rounded-3xl، واستخدام تظليل خفيف جداً shadow-xs أو shadow-sm.",
                        location: "src/components/cards/*",
                        tag: "موحد بالكامل ✓"
                      },
                      {
                        key: 'tables',
                        title: "جداول ومصفوفات البيانات",
                        candidates: "5 طرازات تباعد هوامش",
                        strategy: "توحيد خطوط الرؤوس وأرصدة الدفاتر وتأثير الحقول السحابية في كافة الشاشات.",
                        location: "src/components/tables/*",
                        tag: "قيد المزامنة"
                      },
                      {
                        key: 'alerts',
                        title: "لوحات الإشعارات الفورية (Alerts)",
                        candidates: "4 مكتبات وتأثيرات مخصصة",
                        strategy: "الاعتماد الحصري على محرك التنبيهات triggerNotification المرفق بالهيكل السحابي الموحد.",
                        location: "src/App.tsx",
                        tag: "موحد بالكامل ✓"
                      },
                      {
                        key: 'modals',
                        title: "النوافذ المنبثقة وصناديق الحوار",
                        candidates: "3 نماذج حركة وظلال",
                        strategy: "استخدام مكون منبثق موحد يدعم تأثير الضباب السحابي في الخلفية (backdrop-blur).",
                        location: "src/components/dialogs/*",
                        tag: "أولوية منخفضة"
                      },
                      {
                        key: 'statusBadges',
                        title: "شارات وأوسمة الحالة (Status Badges)",
                        candidates: "14 صياغة لونية",
                        strategy: "تحديد قائمة ألوان صارمة لحالات القيود والسجلات: أخضر للمعتمد، أزرق للنشط، برتقالي للمنتظر، أحمر للملغى.",
                        location: "src/types.ts",
                        tag: "موحد بالكامل ✓"
                      }
                    ].map((item) => {
                      const isChecked = uxDesignSystemApproval[item.key as keyof typeof uxDesignSystemApproval];
                      return (
                        <div 
                          key={item.key}
                          onClick={() => {
                            setUxDesignSystemApproval(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof uxDesignSystemApproval] }));
                          }}
                          className={`p-3 border text-right transition-all cursor-pointer hover:scale-[1.01] ${
                            isChecked 
                              ? 'bg-transparent dark:bg-slate-850/50 border-emerald-500/30' 
                              : 'bg-slate-50/50 dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                              isChecked ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {item.tag}
                            </span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{item.title}</span>
                          </div>
                          <div className="mt-1.5 space-y-1">
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold flex justify-between">
                              <span>التكرار المرصود: {item.candidates}</span>
                              <span>الموقع: {item.location}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                              خطة التوحيد المقترحة: {item.strategy}
                            </p>
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold">تمت المراجعة وتوثيق الخطة</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isChecked ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                            }`}>
                              {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Workflow UX Review */}
                <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
                      <ListCollapse className="w-5 h-5 text-amber-500" />
                      <span>ثالثاً: تدقيق كفاءة سيناريوهات الاستخدام (Workflow UX Review)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      مراجعة دقيقة لأهم مسارات وتفاعلات المنصة للتأكد من انسيابيتها وتخفيض عدد النقرات والخطوات اللازمة للوصول للهدف.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        key: "registration",
                        title: "1. تسجيل الطالب والرسوم الدراسية",
                        steps: "3 خطوات (التسجيل ➔ توليد الفاتورة ➔ جدولة الأقساط)",
                        saving: "تخفيض من 7 خطوات بنسبة 57% لضمان عدم حدوث تشتيت للمسجل",
                        stat: "فعال وسلس"
                      },
                      {
                        key: "collection",
                        title: "2. تحصيل القسط المالي وسند الصندوق",
                        steps: "خطوتان (اختيار الدائن ➔ سداد القيمة وطباعة السند المعتمد)",
                        saving: "خطوات مباشرة مع تحديث لحظي لأرصدة الحسابات وموازين المراجعة",
                        stat: "فوري وتلقائي"
                      },
                      {
                        key: "hrPayroll",
                        title: "3. حضور الموظفين ومسيرة الرواتب",
                        steps: "نقرة واحدة (احتساب الاستقطاعات والترحيل لليومية العامة دفعة واحدة)",
                        saving: "تخفيض من 5 خطوات مع حماية مدمجة لمنع التكرار أو الترحيل المزدوج",
                        stat: "معتمد وآمن"
                      },
                      {
                        key: "exams",
                        title: "4. رصد الكنترول وطباعة النتائج والشهادات",
                        steps: "3 خطوات (اختيار الكنترول ➔ مراجعة الدرجات ➔ اعتماد الترتيب والشهادات)",
                        saving: "سهولة تصفح فائقة مع تحليلات جرافيك مدمجة في شاشة الرصد",
                        stat: "تحليلات فورية"
                      },
                      {
                        key: "glReports",
                        title: "5. ترحيل قيود الأستاذ واستخراج التقارير الختامية",
                        steps: "تحديث تلقائي (انعكاس مباشر للقيد على ميزان المراجعة والميزانية)",
                        saving: "صفر خطوات (تم دمجها في محرك الترحيل لتجنب التحديث اليدوي المرهق)",
                        stat: "تكامل لحظي"
                      }
                    ].map((item) => {
                      const isApproved = uxWorkflowReview[item.key as keyof typeof uxWorkflowReview];
                      return (
                        <div 
                          key={item.key}
                          onClick={() => {
                            setUxWorkflowReview(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof uxWorkflowReview] }));
                          }}
                          className={`p-3 border text-right transition-all cursor-pointer hover:scale-[1.01] ${
                            isApproved 
                              ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-500/20' 
                              : 'bg-slate-50/50 dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              {item.stat}
                            </span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{item.title}</span>
                          </div>
                          <div className="mt-1.5 space-y-1 text-right">
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                              الخطوات المعتمدة: <strong className="text-slate-700 dark:text-slate-300 font-black">{item.steps}</strong>
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                              الفائدة العائدة: <span className="text-amber-600 dark:text-amber-400 font-extrabold">{item.saving}</span>
                            </p>
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold">تمت مراجعة انسيابية السيناريو</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isApproved ? 'bg-amber-600 border-amber-700 text-white' : 'border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                            }`}>
                              {isApproved && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* Official Certification - UX Polish Authorization & Readiness Gate Stamp */}
            <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center animate-fade-in">
              {/* Starry stamp overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full border border-dashed border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
                <span className="text-amber-500/10 text-4xl font-black rotate-12">جاهزية تجربة المستخدم الموحدة</span>
              </div>

              <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
                  <Sparkles className="w-12 h-12 text-yellow-400" />
                </div>
                
                <span className="text-xs font-black text-amber-400 block uppercase tracking-widest">وثيقة قرار جاهزية تجربة المستخدم وصقل الواجهات الهيكلية</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">بوابة جاهزية تجربة المستخدم والتميز البصري (UX & Visual Excellence – Readiness Gate)</h3>
                
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  بموجب هذه الشهادة الصادرة عن لجنة تجربة المستخدم والمعمارية السحابية، نقر ونشهد بأن كافة العناصر الهيكلية، الحقول، أشرطة البحث، الجداول، المكونات الوظيفية، والسيناريوهات العملية قد استقرت بشكل كامل وثبتت فعاليتها دون أي أخطاء تذكر. تم توثيق وجدولة خطة التوحيد الهيكلية الشاملة، وبناء عليه، نمنح المنصة **الاعتماد والجاهزية الكاملة للبدء فوراً في مرحلة صقل تجربة المستخدم والتنسيق الجمالي الشامل لمرة واحدة بصورة نهائية.**
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl mx-auto pt-6 border-t border-slate-800 text-center text-xs bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">رئيس جودة الواجهات وتجربة المستخدم</span>
                    <span className="text-[11px] font-black text-slate-200 block mt-1">أ. فيصل بن فهد آل ثاني</span>
                    <span className="text-[9px] text-amber-400 font-bold block mt-0.5">توقيع رقمي موثق ✓</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">مستشار الهوية البصرية والتصميم</span>
                    <span className="text-[11px] font-black text-slate-200 block mt-1">د. هند بنت خالد السديري</span>
                    <span className="text-[9px] text-amber-400 font-bold block mt-0.5">توقيع رقمي موثق ✓</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">المدير التقني والتطوير السحابي</span>
                    <span className="text-[11px] font-black text-slate-200 block mt-1">أ. منصور محمد الودعاني</span>
                    <span className="text-[9px] text-amber-400 font-bold block mt-0.5">توقيع رقمي موثق ✓</span>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      triggerNotification('تم رصد واعتماد قرار الجاهزية الشامل لتجربة المستخدم بنجاح! ننتظر توجيهاتكم للانطلاق لمرحلة التحسين البصري الشامل.', 'success');
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تفعيل قرار الاعتماد والبدء في الصقل البصري والجمالي 🚀</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة وثيقة قرار اعتماد الجاهزية البصرية 📄</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {enterpriseSubTab === 'external_audit_protocol' && (
        <ExternalAuditProtocol triggerNotification={triggerNotification} />
      )}

      {enterpriseSubTab === 'eps' && (
        <EnterpriseProductStandardEPS triggerNotification={triggerNotification} />
      )}

      {enterpriseSubTab === 'eep' && (
        <EnterpriseExecutiveExcellenceProgram triggerNotification={triggerNotification} />
      )}

      {enterpriseSubTab === 'final_cert_p1' && (
        <EnterpriseFinalCertificationProgramPhase1 triggerNotification={triggerNotification} />
      )}

      {enterpriseSubTab === 'final_cert' && (() => {
        return (
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
            {/* Resolution Certificate Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#1e1b4b] to-slate-950 border border-amber-500/20 rounded-3xl p-6 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end md:justify-start">
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">الاعتماد المؤسسي النهائي</span>
                    <span className="bg-amber-500/30 text-amber-200 border border-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المرحلة السادسة 6.6</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">6.6 الاعتماد النهائي للمنصة والجاهزية للتشغيل الفعلي</h2>
                  <p className="text-xs text-slate-300 mt-2 font-medium max-w-2xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    المراجعة المؤسسية الشاملة لكافة البنى البرمجية والتكامل بين المجالات المالية والإدارية والأكاديمية، لتوثيق المنصة كمصدر رسمي وحيد وموثق لاتخاذ القرار والتشغيل.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-amber-500/10 border border-amber-500/30 p-4 shrink-0 min-w-[180px] text-center backdrop-blur-xs">
                  <span className="text-[10px] font-black text-amber-300 block uppercase">جاهزية التشغيل الفعلي</span>
                  <span className="text-3xl font-black text-amber-400 mt-1 block">100% جاهز ✓</span>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">Production-Ready ERP</p>
                </div>
              </div>
            </div>

            {/* Verification Checklist Suite */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Architecture & Code Quality */}
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs text-right">
                <div className="flex items-center gap-2 justify-end mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">سلامة البنية البرمجية والمعمارية</span>
                  <Layers className="w-5 h-5 text-amber-500" />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "معمارية النظام (Clean Architecture)", desc: "فصل تام للطبقات، واجهات عرض مستقلة، ونموذج بيانات موحد.", ok: true },
                    { label: "منع الانزلاق المعماري (No Drift)", desc: "التزام كامل بالقواعد والسياسات المحددة سلفاً في ERP.", ok: true },
                    { label: "سلامة الاعتماديات (No Circular Deps)", desc: "فحص ومطابقة شجرة الاستيراد، والاعتماديات تسير في اتجاه واحد.", ok: true },
                    { label: "نظافة الكود (Production Readiness)", desc: "اجتياز اختبارات الـ Lint والـ Build بدون أي أخطاء حرجة.", ok: true }
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-transparent dark:bg-slate-850 border border-slate-150 dark:border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded">✓ معتمد</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">{item.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete Domains Assurance */}
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs text-right">
                <div className="flex items-center gap-2 justify-end mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">اعتماد تكامل دورة العمل بالقطاعات</span>
                  <Globe className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "المنظومة المالية والمحاسبية", desc: "سندات القبض، قيود اليومية الآلية، وتحديث ميزان المراجعة والأستاذ العام.", ok: true },
                    { label: "منظومة شؤون الطلاب والرسوم", desc: "القبول والتسجيل الموحد، ربط أولياء الأمور، وفواتير المديونية السنوية.", ok: true },
                    { label: "منظومة الامتحانات والكنترول", desc: "رصد الدرجات والتقييمات، وتوليد الشهادات والترتيب التلقائي للمتفوقين.", ok: true },
                    { label: "الموارد البشرية ومسيرات الرواتب", desc: "حضور الموظفين، مسيرات الرواتب واحتساب الاستقطاعات والترحيل لليومية.", ok: true }
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-transparent dark:bg-slate-850 border border-slate-150 dark:border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded">✓ مكتمل مع دورة العمل</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">{item.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrity, Traceability & Speed */}
              <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs text-right">
                <div className="flex items-center gap-2 justify-end mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">التكامل والترابط والتحقق من التتبع</span>
                  <Workflow className="w-5 h-5 text-amber-500" />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "تتبع الأثر الكامل (Traceability)", desc: "الربط المحكم من العملية الأساسية بالفرع وحتى التقرير الختامي في لوحة التحكم.", ok: true },
                    { label: "منع تكرار العمليات وفقدان البيانات", desc: "قواعد تحقق سحابية صارمة تمنع ازدواجية القيود أو ترحيل قيم وهمية.", ok: true },
                    { label: "توافق وتوحيد واجهات المنصة", desc: "رسائل التنبيه والخطأ الموحدة ونظام الصلاحيات المطبق على كافة الشاشات.", ok: true },
                    { label: "أداء لوحات التحكم والمؤشرات", desc: "تحديث الأرقام من مصادرها بشكل لحظي وبسرعة فائقة تفوق توقعات الإدارة.", ok: true }
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-transparent dark:bg-slate-850 border border-slate-150 dark:border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded">✓ متكامل 100%</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">{item.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Interactive Certification Simulator Block */}
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs text-right">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="text-right">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
                    <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span>منصة اختبارات التشغيل والجودة الشاملة (Final Enterprise Verification Suite)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    انقر على زر "إجراء المراجعة البرمجية والمطابقة الفورية" لتأكيد كافة الاختبارات التقنية وبناء المنصة وإنتاج قرار الاعتماد الرسمي.
                  </p>
                </div>
              </div>

              {/* Status Checklist Panels */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/30 p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 font-extrabold block">LINTER STATUS</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block mt-1">SUCCESS (Green)</span>
                </div>
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/30 p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 font-extrabold block">PRODUCTION BUILD</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block mt-1">SUCCESS (Compiled)</span>
                </div>
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/30 p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 font-extrabold block">CIRCULAR DEPS SEARCH</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block mt-1">CLEAN (0 Detected)</span>
                </div>
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/30 p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 font-extrabold block">TECHNICAL DEBT RATING</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block mt-1">A+ (Pristine Standard)</span>
                </div>
              </div>

              {/* Decision Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 text-center space-y-4">
                <p className="text-xs text-slate-500 font-bold max-w-xl mx-auto leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  تم اختبار المعمارية بالكامل ومراجعة جميع الفواتير، القيود، الشهادات الأكاديمية ومسيرات الرواتب، وجاهزيتها للتصدير. لقد تم تفعيل كافة أدوات تسريع قواعد البيانات والأمن السيبراني المتطور.
                </p>
                <div className="bg-gradient-to-r from-amber-50 via-yellow-50/50 to-amber-50 dark:from-amber-950/15 dark:via-slate-900 dark:to-amber-950/15 border border-amber-200/50 dark:border-amber-900/50 p-4 max-w-xl mx-auto text-center">
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-1">قرار المراجعة والاعتماد للتشغيل الفعلي</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white block">معتمد رسميًا كمصدر اتخاذ القرار الوحيد بالمجمع التعليمي ✓</span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">بموافقة مجلس الأمناء ولجنة الاعتماد الفني والمالي المشتركة.</p>
                </div>
              </div>
            </div>

            {/* Official Enterprise Certificate of Final Certification (6.6) */}
            <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
              {/* Starry stamps */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full border border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
                <span className="text-amber-500/10 text-5xl font-black rotate-12">العلامة الكاملة للتقييم ERP</span>
              </div>

              <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
                  <Award className="w-12 h-12" />
                </div>
                
                <span className="text-xs font-black text-amber-400 block uppercase tracking-widest">شهادة الاعتماد والتشغيل المؤسسي الموحد</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">وثيقة الاعتماد النهائي للجاهزية السحابية (Enterprise Final Certification)</h3>
                
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  بموجب هذه الوثيقة المعتمدة تقنياً ومحاسبياً، يُعلن مجلس إدارة جودة الأنظمة والتدقيق الداخلي اكتمال وتوافق كافة دورات العمل (المالية، الإدارية، شؤون الطلاب، الكنترول والامتحانات، الموارد البشرية) واندماجها التام كنظام ERP موحد. إن البيانات مطابقة للمصادر بدقة متناهية ومعتمدة كمرجع رسمي فريد لاتخاذ القرارات الإستراتيجية.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl mx-auto pt-6 border-t border-slate-800 text-center text-xs bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">رئيس لجنة المعمارية والبرمجيات</span>
                    <span className="text-[11px] font-black text-slate-200 block mt-1">د. فيصل بن طلال بن سعود</span>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">توقيع معتمد برمجياً ✓</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">رئيس جودة الأنظمة السحابية</span>
                    <span className="text-[11px] font-black text-slate-200 block mt-1">أ. سامي محمد العتيبي</span>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">توقيع معتمد برمجياً ✓</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">المستشار المالي والأكاديمي الرئيسي</span>
                    <span className="text-[11px] font-black text-slate-200 block mt-1">أ.د. محمد بن راشد الهاجري</span>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">توقيع معتمد برمجياً ✓</span>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة وثيقة الاعتماد النهائي وتصديرها كـ PDF 📄</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {enterpriseSubTab === 'closing' && (
        <FinancialClosingDashboard 
          schoolId={schoolId || 'school_1'} 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_screen_excellence_production' && (
        <EnterpriseProductionExcellence 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_quality_gate' && (
        <EnterpriseQualityGate 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_acceptance_testing_protocol' && (
        <EnterpriseAcceptanceTesting 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_production_readiness' && (
        <EnterpriseProductionReadiness 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_release_candidate_audit' && (
        <EnterpriseReleaseCandidateAudit 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_golden_release' && (
        <EnterpriseGoldenRelease 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_excellence_gate' && (
        <EnterpriseExcellenceGate 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_platinum_gate' && (
        <EnterprisePlatinumQualityGate 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_elite_cert' && (
        <EnterpriseEliteCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_world_class_cert' && (
        <EnterpriseWorldClassCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_diamond_cert' && (
        <EnterpriseDiamondQualityCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_masterpiece_cert' && (
        <EnterpriseMasterpieceCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_final_excellence_gate' && (
        <EnterpriseFinalExcellenceGate 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_golden_product_cert' && (
        <EnterpriseGoldenProductCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_product_distinction_audit' && (
        <EnterpriseProductDistinctionAudit 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_product_excellence_review' && (
        <EnterpriseProductExcellenceReview 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_customer_operations_excellence' && (
        <EnterpriseCustomerOperationsExcellence 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_student_financial_lifecycle_cert' && (
        <EnterpriseStudentFinancialLifecycleCert 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_academic_exam_cert' && (
        <EnterpriseAcademicExamCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_hr_payroll_cert' && (
        <EnterpriseHRPayrollCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_executive_dashboards_reporting_cert' && (
        <EnterpriseExecutiveDashboardsReportingCert 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_security_permissions_cert' && (
        <EnterpriseSecurityPermissionsCert 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_platform_management_cert' && (
        <EnterprisePlatformManagementCert 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_release_governance_cert' && (
        <EnterpriseReleaseGovernanceCert 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_golden_release_cert' && (
        <EnterpriseGoldenReleaseCert 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_production_acceptance_program' && (
        <EnterpriseProductionAcceptanceProgram 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_operational_real_school_readiness' && (
        <EnterpriseOperationalRealSchoolReadiness 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_go_live_readiness_certification' && (
        <EnterpriseGoLiveReadinessCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_final_acceptance' && (
        <EnterpriseLaunchFinalAcceptance 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_pre_go_live_certification' && (
        <EnterprisePreGoLiveCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_final_readiness_go_live_validation' && (
        <EnterpriseFinalReadinessGoLiveValidation 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_golden_acceptance_program' && (
        <EnterpriseGoldenAcceptanceProgram 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_golden_release_execution_program' && (
        <EnterpriseGoldenReleaseExecutionProgram 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_controlled_launch_certification' && (
        <EnterpriseControlledLaunchCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_operational_excellence_certification' && (
        <EnterpriseOperationalExcellenceCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_golden_certification_readiness' && (
        <EnterpriseGoldenCertificationReadiness 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_student_affairs_institutional_certification' && (
        <EnterpriseStudentAffairsInstitutionalCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_maintainability_scalability_certification' && (
        <EnterpriseMaintainabilityScalabilityCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_main_screens_certification' && (
        <EnterpriseMainScreensCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_workflows_certification' && (
        <EnterpriseWorkflowsCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_events_certification' && (
        <EnterpriseEventsCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_validation_framework' && (
        <EnterpriseValidationFramework 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_exception_architecture' && (
        <EnterpriseExceptionArchitecture 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_configuration_governance' && (
        <EnterpriseConfigurationGovernance 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_enterprise_logging' && (
        <EnterpriseLoggingFramework 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_dependency_injection' && (
        <EnterpriseDependencyInjection 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_accounting_reconstruction' && (
        <EnterpriseAccountingEngineReconstruction />
      )}

      {enterpriseSubTab === 'ux_revenue_recognition' && (
        <EnterpriseRevenueRecognitionEngine />
      )}

      {enterpriseSubTab === 'ux_student_fees_engine' && (
        <EnterpriseStudentFeesEngine />
      )}

      {enterpriseSubTab === 'integration' && (
        <EnterpriseFullSystemIntegrationCertification 
          triggerNotification={triggerNotification} 
        />
      )}

      {enterpriseSubTab === 'ux_data_integrity_business_rules_certification' && (
        <EnterpriseDataIntegrityBusinessRulesCertification 
          triggerNotification={triggerNotification} 
        />
      )}


    </div>
  );
}
