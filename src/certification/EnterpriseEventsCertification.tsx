import { Activity, AlertTriangle, ArrowRight, BookOpen, Check, Code, Cpu, Database, Download, Filter, Fingerprint, Grid, Hash, History as HistoryIcon, Key, Lock as LockIcon, Logs, Menu, Move, Navigation, Play, Plus, Printer, RefreshCcw, RefreshCw, Rows, Search, ShieldCheck, Signature, Sparkles, Store, Table, Terminal, Verified, View, XCircle, Zap } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';

interface EnterpriseEventsCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface DomainEvent {
  id: string;
  eventName: string;
  eventNameArabic: string;
  context: 'Admission' | 'Academic' | 'Billing' | 'General Ledger' | 'Security';
  producer: string;
  subscribers: string[];
  payloadTemplate: Record<string, any>;
  idempotencyStrategy: string;
  traceabilityId: string;
  isCustom?: boolean;
}

interface EventAnomaly {
  id: string;
  type: 'implicit_event' | 'hidden_trigger' | 'duplicated_notification' | 'duplicated_calculation';
  labelArabic: string;
  labelEnglish: string;
  descriptionArabic: string;
  descriptionEnglish: string;
  remedyArabic: string;
  remedyEnglish: string;
  isSolved: boolean;
  severity: 'critical' | 'warning';
}

interface PublishedEventLog {
  id: string;
  timestamp: string;
  eventName: string;
  eventNameArabic: string;
  payload: Record<string, any>;
  idempotencyKey: string;
  correlationId: string;
  status: 'processed' | 'duplicate_skipped' | 'replayed';
}

export default function EnterpriseEventsCertification({ triggerNotification }: EnterpriseEventsCertificationProps) {
  // Navigation & UI filter states
  const [activeTab, setActiveTab] = useState<'registry' | 'anomalies' | 'replay' | 'documentation'>('registry');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContext, setSelectedContext] = useState<string>('All');
  const [selectedEventId, setSelectedEventId] = useState<string>('evt_student_admitted');
  const [isRepairing, setIsRepairing] = useState(false);
  const [isReplayingAll, setIsReplayingAll] = useState(false);
  
  // Custom event builder states
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventArabic, setNewEventArabic] = useState('');
  const [newEventContext, setNewEventContext] = useState<'Admission' | 'Academic' | 'Billing' | 'General Ledger'>('Admission');
  const [newEventProducer, setNewEventProducer] = useState('');
  const [newEventSubscribers, setNewEventSubscribers] = useState('');

  // Terminal Console Logs for realistic execution tracking
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('ar-SA')}] EDA ENGINE: تم تشغيل محرك الأحداث المؤسسي الموحد بنجاح (Event Architecture Engine v17.0).`,
    `[${new Date().toLocaleTimeString('ar-SA')}] TRANSFORMATION DIRECTIVE #017: بدء مسح قنوات التراسل وفك الارتباط الوثيق (De-coupling).`,
    `[${new Date().toLocaleTimeString('ar-SA')}] جاهز لفحص الأحداث الضمنية والمحفزات المخفية وتطهير مكررات الحسابات والإشعارات.`
  ]);

  // Explicit Domain Events Registry (Immutable, Auditable, Traceable, Idempotent)
  const [domainEvents, setDomainEvents] = useState<DomainEvent[]>([
    {
      id: 'evt_student_admitted',
      eventName: 'StudentAdmittedEvent',
      eventNameArabic: 'حدث قبول طالب جديد',
      context: 'Admission',
      producer: 'AdmissionService',
      subscribers: ['StudentRegistryService', 'BillingEngine', 'NotificationGateway'],
      idempotencyStrategy: 'Admitempotency-AggId-V1 (UUID Check)',
      traceabilityId: 'TR-ADM-902341',
      payloadTemplate: {
        eventId: "evt_9a2b8c-10fd",
        version: "1.0",
        timestamp: "2026-07-19T05:00:00Z",
        aggregateId: "std_2026_8892",
        actorId: "usr_admission_officer_4",
        data: {
          studentId: "std_2026_8892",
          fullNameArabic: "عمر بن الخطاب سليمان",
          nationalId: "N-202934812",
          classLevel: "GRADE_10",
          academicYear: "2026/2027",
          initialDiscountCode: "SIBLINGS_10"
        }
      }
    },
    {
      id: 'evt_student_promoted',
      eventName: 'StudentPromotedEvent',
      eventNameArabic: 'حدث ترفيع طالب للمرحلة التالية',
      context: 'Academic',
      producer: 'AcademicControlBoard',
      subscribers: ['StudentRegistryService', 'BillingEngine', 'ParentPortalService', 'AcademicHistoryStore'],
      idempotencyStrategy: 'PromoIdempot-StdId-Year-V1',
      traceabilityId: 'TR-ACA-778912',
      payloadTemplate: {
        eventId: "evt_3d5f12-22ec",
        version: "1.1",
        timestamp: "2026-07-19T05:01:10Z",
        aggregateId: "std_2026_8892",
        actorId: "usr_academic_dean_2",
        data: {
          studentId: "std_2026_8892",
          previousGrade: "GRADE_9",
          newGrade: "GRADE_10",
          academicYear: "2026/2027",
          gpa: 3.92,
          promotedBy: "AcademicControlBoard"
        }
      }
    },
    {
      id: 'evt_invoice_issued',
      eventName: 'InvoiceIssuedEvent',
      eventNameArabic: 'حدث إصدار فاتورة مالية للرسوم',
      context: 'Billing',
      producer: 'BillingEngine',
      subscribers: ['GeneralLedgerService', 'NotificationGateway', 'ParentPortalService', 'TaxReportingEngine'],
      idempotencyStrategy: 'InvoiceId-SHA256-Hash',
      traceabilityId: 'TR-BIL-445109',
      payloadTemplate: {
        eventId: "evt_4e1a09-91bc",
        version: "2.0",
        timestamp: "2026-07-19T05:02:15Z",
        aggregateId: "inv_2026_09441",
        actorId: "sys_cron_billing_scheduler",
        data: {
          invoiceId: "inv_2026_09441",
          studentId: "std_2026_8892",
          billingPeriod: "FIRST_TERM_2026",
          amounts: {
            baseTuition: 15000.00,
            discounts: 1500.00,
            vatAmount: 2025.00,
            totalDue: 15525.00
          },
          dueDate: "2026-08-15"
        }
      }
    },
    {
      id: 'evt_payment_received',
      eventName: 'PaymentReceivedEvent',
      eventNameArabic: 'حدث استلام دفعة نقدية أو بنكية',
      context: 'Billing',
      producer: 'PaymentGateway',
      subscribers: ['BillingEngine', 'GeneralLedgerService', 'ReceiptGenerator', 'NotificationGateway'],
      idempotencyStrategy: 'TxnRefId-StrictCheck (Bank ID)',
      traceabilityId: 'TR-PAY-331289',
      payloadTemplate: {
        eventId: "evt_9f4e22-38aa",
        version: "1.0",
        timestamp: "2026-07-19T05:03:00Z",
        aggregateId: "pay_90244192",
        actorId: "sys_pay_gateway_sadad",
        data: {
          paymentId: "pay_90244192",
          invoiceId: "inv_2026_09441",
          studentId: "std_2026_8892",
          amountReceived: 15525.00,
          paymentMethod: "SADAD_ONLINE",
          bankTransactionReference: "TXN_SADAD_2026_990141"
        }
      }
    },
    {
      id: 'evt_installment_paid',
      eventName: 'InstallmentPaidEvent',
      eventNameArabic: 'حدث سداد قسط مستحق تفصيلي',
      context: 'Billing',
      producer: 'BillingEngine',
      subscribers: ['GeneralLedgerService', 'StudentContractService', 'NotificationGateway'],
      idempotencyStrategy: 'InstalId-Index-Verify-V1',
      traceabilityId: 'TR-BIL-228901',
      payloadTemplate: {
        eventId: "evt_5c6d7e-77ff",
        version: "1.0",
        timestamp: "2026-07-19T05:03:45Z",
        aggregateId: "inst_990214_q1",
        actorId: "usr_cashier_fatima",
        data: {
          installmentId: "inst_990214_q1",
          studentId: "std_2026_8892",
          installmentNumber: 1,
          totalInstallments: 4,
          amountPaid: 3881.25,
          nextDueDate: "2026-11-01"
        }
      }
    },
    {
      id: 'evt_revenue_recognized',
      eventName: 'RevenueRecognizedEvent',
      eventNameArabic: 'حدث الاعتراف بالإيرادات المحاسبية',
      context: 'General Ledger',
      producer: 'AccountingAutomator',
      subscribers: ['GeneralLedgerService', 'FinancialAuditorService', 'AnalyticsDashboardService'],
      idempotencyStrategy: 'GL-Revenue-Month-Year-Check',
      traceabilityId: 'TR-GL-110294',
      payloadTemplate: {
        eventId: "evt_6e7f8a-88cc",
        version: "1.2",
        timestamp: "2026-07-19T05:04:30Z",
        aggregateId: "rev_rec_2026_07",
        actorId: "sys_ledger_daily_cron",
        data: {
          revenueRecognitionId: "rev_rec_2026_07",
          accountingMonth: "07",
          accountingYear: "2026",
          recognizedTuitionAmount: 1250000.00,
          recognizedTransportAmount: 85000.00,
          ledgerBatchReference: "BATCH-REV-2026-JULY-01"
        }
      }
    },
    {
      id: 'evt_journal_posted',
      eventName: 'JournalPostedEvent',
      eventNameArabic: 'حدث ترحيل قيد يومية للأستاذ العام',
      context: 'General Ledger',
      producer: 'GeneralLedgerService',
      subscribers: ['FinancialAuditorService', 'TrialBalanceService', 'AnalyticsDashboardService'],
      idempotencyStrategy: 'JournalSeq-DoublePostFilter',
      traceabilityId: 'TR-GL-902144',
      payloadTemplate: {
        eventId: "evt_2b3c4d-99dd",
        version: "2.1",
        timestamp: "2026-07-19T05:05:00Z",
        aggregateId: "gl_je_2026_001994",
        actorId: "usr_chief_accountant_ahmed",
        data: {
          journalEntryId: "gl_je_2026_001994",
          ledgerDate: "2026-07-19",
          totalDebit: 15525.00,
          totalCredit: 15525.00,
          isBalanced: true,
          lines: [
            { accountId: "ACC-1010-CASH", debit: 15525.00, credit: 0.00 },
            { accountId: "ACC-4010-REVENUE", debit: 0.00, credit: 13500.00 },
            { accountId: "ACC-2050-VAT-OUT", debit: 0.00, credit: 2025.00 }
          ]
        }
      }
    },
    {
      id: 'evt_fiscal_year_closed',
      eventName: 'FiscalYearClosedEvent',
      eventNameArabic: 'حدث إغلاق السنة المالية الختامي',
      context: 'General Ledger',
      producer: 'GeneralLedgerService',
      subscribers: ['FinancialAuditorService', 'ArchiveVault', 'ExecutiveBoardNotifier'],
      idempotencyStrategy: 'FiscalYear-StrictSingleLock',
      traceabilityId: 'TR-GL-889901',
      payloadTemplate: {
        eventId: "evt_1a9b8c-00aa",
        version: "3.0",
        timestamp: "2026-07-19T05:06:00Z",
        aggregateId: "fiscal_2025_close",
        actorId: "usr_financial_director_sami",
        data: {
          fiscalYear: "2025",
          closedAt: "2026-07-19T05:06:00Z",
          retainedEarningsPostClose: 4890250.00,
          closingTrialBalanceHash: "sha256-5ea19c83bb02df491",
          auditorConsentCode: "AUD-CONSENT-2025-99214"
        }
      }
    },
    {
      id: 'evt_certificate_generated',
      eventName: 'CertificateGeneratedEvent',
      eventNameArabic: 'حدث توليد الشهادة المعتمدة للنجاح',
      context: 'Academic',
      producer: 'CertificateEngine',
      subscribers: ['StudentRegistryService', 'ParentPortalService', 'MinistrySyncGateway'],
      idempotencyStrategy: 'CertHash-StdId-Term-Unique',
      traceabilityId: 'TR-ACA-112234',
      payloadTemplate: {
        eventId: "evt_8f7e6d-55bb",
        version: "1.0",
        timestamp: "2026-07-19T05:07:00Z",
        aggregateId: "cert_std_2026_8892_term2",
        actorId: "sys_academic_batch_reporter",
        data: {
          certificateId: "cert_std_2026_8892_term2",
          studentId: "std_2026_8892",
          term: "SECOND_TERM_2025_2026",
          overallScore: 98.40,
          gradeClassification: "EXCELLENT",
          digitalSignatureHash: "sha256-ff7d8d9a01b2c3d4e5f6"
        }
      }
    },
    {
      id: 'evt_attendance_recorded',
      eventName: 'AttendanceRecordedEvent',
      eventNameArabic: 'حدث رصد حضور وغياب اليوم',
      context: 'Academic',
      producer: 'AttendanceScanner',
      subscribers: ['StudentRegistryService', 'NotificationGateway', 'ParentPortalService', 'ComplianceTracker'],
      idempotencyStrategy: 'ScanId-Fingerprint-Timestamp-Dedup',
      traceabilityId: 'TR-ACA-554433',
      payloadTemplate: {
        eventId: "evt_4b5c6d-33cc",
        version: "1.0",
        timestamp: "2026-07-19T05:08:00Z",
        aggregateId: "att_std_2026_8892_day190",
        actorId: "sys_rfid_gate_scanner_main",
        data: {
          attendanceId: "att_std_2026_8892_day190",
          studentId: "std_2026_8892",
          date: "2026-07-19",
          scanTime: "07:14:22",
          status: "PRESENT",
          gateId: "GATE_MAIN_EAST"
        }
      }
    },
    {
      id: 'evt_guardian_updated',
      eventName: 'GuardianUpdatedEvent',
      eventNameArabic: 'حدث تحديث بيانات ولي الأمر الموحدة',
      context: 'Admission',
      producer: 'ParentPortalService',
      subscribers: ['StudentRegistryService', 'NotificationGateway', 'BillingEngine'],
      idempotencyStrategy: 'GuardId-Ver-Audit-V2',
      traceabilityId: 'TR-ADM-665544',
      payloadTemplate: {
        eventId: "evt_3a2b1c-00bb",
        version: "1.0",
        timestamp: "2026-07-19T05:09:00Z",
        aggregateId: "guard_440129",
        actorId: "usr_parent_salman_1",
        data: {
          guardianId: "guard_440129",
          linkedStudents: ["std_2026_8892"],
          updatedFields: {
            mobileNumber: "+966501234567",
            email: "salman.sul@parent.sa",
            emergencyContactName: "فهد بن الخطاب (العم)"
          }
        }
      }
    }
  ]);

  // Detected anomalies matching directive requirements (Implicit, Hidden Triggers, Duplicated notifications, Duplicated calculations)
  const [anomalies, setAnomalies] = useState<EventAnomaly[]>([
    {
      id: 'an_implicit_1',
      type: 'implicit_event',
      labelArabic: 'تجميد كشوف الغيابات دون حدث صريح موثق',
      labelEnglish: 'Implicit event: Freeze of student warning list',
      descriptionArabic: 'المخاطرة: يتم تجميد قوائم إنذار غيابات الطلاب وتحديث حالتها في قاعدة البيانات مباشرة عبر تعديل يدوي دون تدوين ونشر حدث صريح بالمنظومة.',
      descriptionEnglish: 'Implicit status changes occur in backend db without publishing explicit, auditable Domain Events.',
      remedyArabic: 'الحل: تأصيل وتدوين حدث StudentWarningFrozenEvent صريح يمنع تعديل الحالة الصامت.',
      remedyEnglish: 'Remedy: Encapsulate logic inside StudentWarningFrozenEvent with complete metadata payload.',
      isSolved: false,
      severity: 'critical'
    },
    {
      id: 'an_hidden_trigger_1',
      type: 'hidden_trigger',
      labelArabic: 'تحديث الرسوم المتأخرة عبر مشغل قاعدة بيانات مخفي',
      labelEnglish: 'Hidden workflow trigger on past-due billing',
      descriptionArabic: 'المخاطرة: يقوم مشغل قاعدة بيانات تلقائي (DB Trigger) بتعديل حالة العقد المالي للطالب دون علم الطبقة البرمجية ونظام الرسائل.',
      descriptionEnglish: 'Database triggers modify parent financial status directly, bypassing event broker and decoupling principles.',
      remedyArabic: 'الحل: ترحيل منطق الحساب لطبقة التطبيق ونشر حدث BillingStatusUpdatedEvent.',
      remedyEnglish: 'Remedy: Move business execution out of raw DB triggers, replacing with application-level domain event broker.',
      isSolved: false,
      severity: 'critical'
    },
    {
      id: 'an_duplicate_notif_1',
      type: 'duplicated_notification',
      labelArabic: 'إرسال إشعارات سداد مكررة لولي الأمر',
      labelEnglish: 'Duplicated parent notification on payment receipt',
      descriptionArabic: 'المخاطرة: استهلاك حدث استلام السداد (PaymentReceivedEvent) بشكل مفرط يرسل إشعارات مكررة للبريد ورسائل SMS في آن واحد بسبب فقدان مفتاح التحقق من الهوية.',
      descriptionEnglish: 'Consumers process same event multiple times due to lack of idempotency keys in notification dispatcher.',
      remedyArabic: 'الحل: إضافة تصفية قائمة على مفتاح عدم التكرار (Idempotency Key) في بوابة الإشعارات.',
      remedyEnglish: 'Remedy: Implement strict distributed lock on (eventId + consumerId) inside NotificationGateway.',
      isSolved: false,
      severity: 'warning'
    },
    {
      id: 'an_duplicate_calc_1',
      type: 'duplicated_calculations',
      labelArabic: 'احتساب الضريبة ورسوم الأشقاء مرتين للطلاب',
      labelEnglish: 'Duplicated sibling discount and tax calculation',
      descriptionArabic: 'المخاطرة: يقوم نظام الفواتير باحتساب خصومات الأشقاء والضريبة مرتين للمسودة عند إعادة إرسال حدث القبول لعدم وجود معالجة متساوية القوة.',
      descriptionEnglish: 'Billing engine processes same student admission event twice, doubling discount application and invoice lines.',
      remedyArabic: 'الحل: التحقق من وجود الفاتورة المصاحبة للمعرف (AggregateID) ووسمها بـ "غير قابلة للتكرار".',
      remedyEnglish: 'Remedy: Enforce idempotence validation via transaction log of aggregate events inside BillingEngine.',
      isSolved: false,
      severity: 'critical'
    }
  ]);

  // Event Store for the Event Replay & Simulation Tool
  const [publishedEvents, setPublishedEvents] = useState<PublishedEventLog[]>([
    {
      id: 'pub_1',
      timestamp: '08:00:15',
      eventName: 'StudentAdmittedEvent',
      eventNameArabic: 'حدث قبول طالب جديد',
      idempotencyKey: 'IDEMP-ADM-99214-2026',
      correlationId: 'CORR-990014',
      payload: { studentId: 'std_2026_8892', name: 'عمر بن الخطاب', level: 'GRADE_10' },
      status: 'processed'
    },
    {
      id: 'pub_2',
      timestamp: '08:01:44',
      eventName: 'InvoiceIssuedEvent',
      eventNameArabic: 'حدث إصدار فاتورة مالية للرسوم',
      idempotencyKey: 'IDEMP-INV-44021-2026',
      correlationId: 'CORR-990014',
      payload: { invoiceId: 'inv_2026_09441', amount: 15525.00 },
      status: 'processed'
    }
  ]);

  // Aggregate stats dynamically
  const stats = useMemo(() => {
    const totalEvents = domainEvents.length;
    const resolvedAnomalies = anomalies.filter(an => an.isSolved).length;
    const unresolvedAnomalies = anomalies.length - resolvedAnomalies;
    const totalPublished = publishedEvents.length;
    
    // Calculate overall decoupling index (how clean the system is based on solved anomalies)
    const decouplingIndex = anomalies.length > 0 
      ? Math.round(((resolvedAnomalies) / anomalies.length) * 100) 
      : 100;

    return {
      totalEvents,
      resolvedAnomalies,
      unresolvedAnomalies,
      totalPublished,
      decouplingIndex
    };
  }, [domainEvents, anomalies, publishedEvents]);

  // Get selected event detailed data
  const selectedEvent = useMemo(() => {
    return domainEvents.find(e => e.id === selectedEventId) || domainEvents[0];
  }, [domainEvents, selectedEventId]);

  // Filter registry list
  const filteredEvents = useMemo(() => {
    return domainEvents.filter(e => {
      const matchesSearch = 
        e.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.eventNameArabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.producer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesContext = selectedContext === 'All' || e.context === selectedContext;
      return matchesSearch && matchesContext;
    });
  }, [domainEvents, searchTerm, selectedContext]);

  // Trigger console logging helper
  const addLog = (msg: string) => {
    setConsoleLogs(prev => [`[${new Date().toLocaleTimeString('ar-SA')}] ${msg}`, ...prev]);
  };

  // Safe repair for safe workflow/event inconsistencies
  const handleAutoRepair = () => {
    if (isRepairing) return;
    setIsRepairing(true);
    addLog(`⚙️ بدء بروتوكول تطهير مكررات التراسل ومعالجة الأحداث الضمنية...`);

    setTimeout(() => {
      setAnomalies(prev => prev.map(an => ({ ...an, isSolved: true })));
      
      // Update Domain Events list with the newly resolved event schemas!
      setDomainEvents(prev => {
        // Ensure the frozen status event and billing events are explicitly declared
        const existsWarning = prev.some(e => e.eventName === 'StudentWarningFrozenEvent');
        if (!existsWarning) {
          const newDeclaredEvents: DomainEvent[] = [
            {
              id: 'evt_warning_frozen',
              eventName: 'StudentWarningFrozenEvent',
              eventNameArabic: 'حدث تجميد إنذار غيابات الطالب',
              context: 'Academic',
              producer: 'ComplianceTracker',
              subscribers: ['StudentRegistryService', 'NotificationGateway', 'ParentPortalService'],
              idempotencyStrategy: 'WarningId-Lock-Strict',
              traceabilityId: 'TR-ACA-009181',
              payloadTemplate: {
                eventId: "evt_7f8g9h-11dd",
                version: "1.0",
                timestamp: "2026-07-19T05:10:00Z",
                aggregateId: "warn_90124",
                actorId: "usr_academic_dean_2",
                data: {
                  warningId: "warn_90124",
                  studentId: "std_2026_8892",
                  reason: "Medical Excuse Verified",
                  freezeDurationDays: 30
                }
              }
            },
            {
              id: 'evt_billing_status_updated',
              eventName: 'BillingStatusUpdatedEvent',
              eventNameArabic: 'حدث تحديث حالة الحساب المالي للطالب',
              context: 'Billing',
              producer: 'BillingEngine',
              subscribers: ['StudentRegistryService', 'NotificationGateway', 'ExecutiveDashboardService'],
              idempotencyStrategy: 'BillStatusHash-AggregateVer',
              traceabilityId: 'TR-BIL-554411',
              payloadTemplate: {
                eventId: "evt_0a9b8c-55ee",
                version: "1.0",
                timestamp: "2026-07-19T05:11:00Z",
                aggregateId: "inv_2026_09441",
                actorId: "sys_cron_billing_scheduler",
                data: {
                  invoiceId: "inv_2026_09441",
                  studentId: "std_2026_8892",
                  previousStatus: "PARTIALLY_PAID",
                  newStatus: "FULLY_PAID",
                  remainingBalance: 0.00
                }
              }
            }
          ];
          return [...prev, ...newDeclaredEvents];
        }
        return prev;
      });

      // Clear duplications in Published Logs
      addLog(`✓ تم فك الارتباط اليدوي والصامت: استبدال مشغلات قاعدة البيانات (DB Triggers) بأحداث صريحة.`);
      addLog(`✓ تم عزل وتصفير الإشعارات المتكررة: دمج مفاتيح التحقق Idempotency Keys لـ Parent Notification.`);
      addLog(`✓ تم تثبيت بروتوكول تصفير مكررات الحسابات: حظر الازدواج الضريبي وحساب خصومات الأشقاء للحدث الواحد.`);
      addLog(`🏆 التفكيك الهيكلي (De-coupling) اكتمل بنجاح. امتثال معمارية الأحداث: 100% ✓`);
      
      setIsRepairing(false);
      triggerNotification('تم معالجة العيوب وتطهير مكررات الحسابات والإشعارات بنجاح، وتحويل العمليات الصامتة لأحداث صريحة موثقة!', 'success');
    }, 1500);
  };

  // Replay all events in event store to test idempotency
  const handleReplayAll = () => {
    if (isReplayingAll) return;
    setIsReplayingAll(true);
    addLog(`🔄 بدء إعادة عرض تدفق الأحداث التاريخية (Event Replay Stream) لاختبار متانة المنظومة...`);
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < publishedEvents.length) {
        const log = publishedEvents[index];
        addLog(`⚡ إعادة تشغيل الحدث: [${log.eventName}] - معرف التراسل: (${log.correlationId}) - مفتاح عدم التكرار: (${log.idempotencyKey})`);
        
        // Simulate idempotency verification
        setTimeout(() => {
          addLog(`   🛡️ [تدقيق عدم التكرار] تم رصد بصمة الحدث مسجلة مسبقاً. تم تخطي تكرار ترحيل المحاسبة والإشعار بنجاح ✓.`);
        }, 300);

        index++;
      } else {
        clearInterval(interval);
        addLog(`🏆 تم الانتهاء من فحص إعادة التشغيل (Replay Verification). تم ترحيل وحفظ كافة الأحداث الموثوقة دون تكرار واحد.`);
        setIsReplayingAll(false);
        triggerNotification('اكتمل اختبار تكرار التشغيل وإعادة الفحص (Event Replay) بنجاح - تم إثبات متانة الامتثال المحاسبي والإشعاري!', 'success');
      }
    }, 1000);
  };

  // Fire a single custom domain event
  const handleFireEvent = (evt: DomainEvent) => {
    const randomTxId = 'TR-GEN-' + Math.floor(Math.random() * 900000 + 100000);
    const randomIdempKey = 'IDEMP-' + evt.eventName.toUpperCase().substring(0, 4) + '-' + Math.floor(Math.random() * 90000 + 10000);
    
    const newLog: PublishedEventLog = {
      id: 'pub_' + (publishedEvents.length + 1),
      timestamp: new Date().toLocaleTimeString('ar-SA'),
      eventName: evt.eventName,
      eventNameArabic: evt.eventNameArabic,
      payload: evt.payloadTemplate,
      idempotencyKey: randomIdempKey,
      correlationId: randomTxId,
      status: 'processed'
    };

    setPublishedEvents(prev => [...prev, newLog]);
    addLog(`🚀 تم نشر حدث فوري: [${evt.eventName}] | المعرف: (${newLog.correlationId}) | المستهلكون: [${evt.subscribers.join(', ')}]`);
    triggerNotification(`تم بث وإطلاق الحدث [${evt.eventName}] للمستهلكين فوراً وبنجاح!`, 'success');
  };

  // Handle building new custom event
  const handleCreateCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName || !newEventArabic) {
      triggerNotification('يرجى ملء الاسم باللغة العربية والإنجليزية لتأصيل الحدث.', 'warning');
      return;
    }

    const cleanedName = newEventName.trim().replace(/\s+/g, '') + 'Event';
    const subsArray = newEventSubscribers ? newEventSubscribers.split(',').map(s => s.trim()) : ['NotificationGateway', 'LoggerService'];

    const customEvt: DomainEvent = {
      id: 'evt_custom_' + Date.now(),
      eventName: cleanedName,
      eventNameArabic: newEventArabic.trim(),
      context: newEventContext,
      producer: newEventProducer.trim() || 'CustomBusinessPublisher',
      subscribers: subsArray,
      idempotencyStrategy: 'CustomIdemp-Aggregate-V1',
      traceabilityId: 'TR-CST-' + Math.floor(Math.random() * 900000 + 100000),
      isCustom: true,
      payloadTemplate: {
        eventId: "evt_custom_" + Math.random().toString(36).substring(2, 7),
        version: "1.0",
        timestamp: new Date().toISOString(),
        aggregateId: "agg_" + Math.floor(Math.random() * 900000),
        actorId: "usr_admin_portal",
        data: {
          customDescription: `تم توليد هذا الحدث المخصص لغرض المحاكاة لـ ${newEventArabic}`,
          generatedBy: "System Events Architect"
        }
      }
    };

    setDomainEvents(prev => [...prev, customEvt]);
    setShowCustomModal(false);
    
    // reset form
    setNewEventName('');
    setNewEventArabic('');
    setNewEventProducer('');
    setNewEventSubscribers('');

    addLog(`✨ تم تسجيل وتوثيق حدث أعمال مخصص جديد في المنظومة: [${customEvt.eventName}]`);
    triggerNotification('تم تسجيل وتأصيل حدث الأعمال المخصص بنجاح وإدراجه في لوحة الحوكمة!', 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="events-certification-root">
      
      {/* Dynamic Bilingual Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-850 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-amber-900/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-350 text-xs font-black">
              <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>TRANSFORMATION DIRECTIVE #017 • معمارية أحداث النطاقات المؤسسية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              اعتماد البنية التحتية للأحداث المستقلة (EDA)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-3xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              تطبيق ميثاق الحوكمة للتحول للأحداث المستقلة غير المترابطة وثيقاً (De-coupled Domain Events). يضمن هذا الاعتماد أن كل قرار أعمال حيوي يتم بثه وتوثيقه كحدث فريد، مشفر، غير قابل للتكرار (Idempotent)، وقابل لإعادة الفحص والتشغيل (Replayable).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleAutoRepair}
              disabled={isRepairing}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                stats.unresolvedAnomalies === 0 
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default' 
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg active:scale-95'
              }`}
            >
              {isRepairing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Cpu className="w-4 h-4" />
              )}
              <span>{stats.unresolvedAnomalies === 0 ? '✓ تم تفكيك وتطهير المعمارية الكلية' : 'تطهير وإصلاح مكررات الأحداث فلقياً'}</span>
            </button>
            <button
              onClick={() => setShowCustomModal(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 text-xs font-extrabold shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل حدث أعمال مخصص 📝</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800 text-slate-300">
          <div className="bg-slate-950/40 p-4 border border-slate-850">
            <div className="text-slate-400 text-xs font-semibold mb-1">الرابط الهيكلي المستقل (Decoupling Index)</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${stats.decouplingIndex === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stats.decouplingIndex}%
              </span>
              <span className="text-[10px] text-slate-500">ميثاق التفكيك الكلي</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-1000 ${stats.decouplingIndex === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${stats.decouplingIndex}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 border border-slate-850">
            <div className="text-slate-400 text-xs font-semibold mb-1">أحداث النطاقات المعتمدة</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{stats.totalEvents}</span>
              <span className="text-xs text-slate-400">حدثاً معرفاً</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">ممتثلة لـ Directive #017 ✓</span>
          </div>

          <div className="bg-slate-950/40 p-4 border border-slate-850">
            <div className="text-slate-400 text-xs font-semibold mb-1">العيوب والمكررات المكتشفة</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${stats.unresolvedAnomalies > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {stats.unresolvedAnomalies}
              </span>
              <span className="text-xs text-slate-400">معلقة</span>
            </div>
            <span className="text-[10px] text-slate-500">تم تطهير {stats.resolvedAnomalies} فجوة</span>
          </div>

          <div className="bg-slate-950/40 p-4 border border-slate-850">
            <div className="text-slate-400 text-xs font-semibold mb-1">حجم سجل الأحداث الفورية</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">{stats.totalPublished}</span>
              <span className="text-xs text-slate-400">نشاطاً فورياً</span>
            </div>
            <span className="text-[10px] text-amber-350 font-medium">قابلة للإعادة Replayable ✓</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'registry' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>مسجل النطاقات والأحداث 📋</span>
          </button>
          
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold transition-all relative cursor-pointer ${
              activeTab === 'anomalies' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>كاشف العيوب والمكررات 🔍</span>
            {stats.unresolvedAnomalies > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-rose-600 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-ping" />
            )}
            {stats.unresolvedAnomalies > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-rose-600 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {stats.unresolvedAnomalies}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('replay')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'replay' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HistoryIcon className="w-4 h-4" />
            <span>محاكي البث والتدفق الحي 🔄</span>
          </button>

          <button
            onClick={() => setActiveTab('documentation')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'documentation' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>تقارير ومستندات EDA الموحدة 📄</span>
          </button>
        </div>

        {activeTab === 'registry' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن حدث أو ناشر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 dark:bg-slate-900 border  border-slate-300  dark:border-slate-800 py-1.5 pr-8 pl-3 text-xs focus:ring-2  focus:ring-[#9a6a1d]  focus:outline-none text-slate-800 dark:text-slate-200"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            </div>
            
            <select
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
              className="dark:bg-slate-900 border  border-slate-300  dark:border-slate-800 py-1.5 px-3 text-xs focus:ring-2  focus:ring-[#9a6a1d]  focus:outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="All">كافة النطاقات</option>
              <option value="Admission">القبول والتسجيل</option>
              <option value="Academic">الشؤون الأكاديمية</option>
              <option value="Billing">الفوترة والمالية</option>
              <option value="General Ledger">الأستاذ العام</option>
            </select>
          </div>
        )}
      </div>

      {/* Main View Grid based on selected Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT COLUMN - Tab Contents */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TAB 1: EVENTS REGISTRY */}
          {activeTab === 'registry' && (
            <div className="dark:bg-slate-900 rounded-3xl border border-slate-250/60 dark:border-slate-850 p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">سجل الأحداث ومخطط التراسل غير المترابط</h3>
                  <p className="text-xs text-slate-500 mt-1">تحديد الأحداث المستقلة في المنظومة لضمان فك الارتباط الكامل (De-coupling).</p>
                </div>
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full font-bold">
                  مكتمل: {filteredEvents.length} حدث
                </span>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-3">
                  <Activity className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
                  <p className="text-sm font-medium">لا توجد أحداث مطابقة لشروط البحث والفلاتر.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvents.map((evt) => {
                    const isSelected = selectedEventId === evt.id;
                    const contextColors = {
                      'Admission': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/40',
                      'Academic': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/40',
                      'Billing': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/40',
                      'General Ledger': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/40',
                      'Security': 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/40'
                    };

                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventId(evt.id)}
                        className={`group relative p-4 border text-right transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-transparent dark:bg-slate-950 border-amber-500 ring-2 ring-amber-500/10' 
                            : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 hover:border-slate-300 dark:hover:bg-slate-950/30'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${contextColors[evt.context]}`}>
                            {evt.context}
                          </span>
                          
                          {evt.isCustom && (
                            <span className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200/40 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">
                              مخصص ⚙️
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1">
                          <h4 className="text-xs font-extrabold font-mono text-slate-800 dark:text-slate-300 tracking-wide">
                            {evt.eventName}
                          </h4>
                          <p className="text-sm font-black text-slate-950 dark:text-white">
                            {evt.eventNameArabic}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            <span>الناشر: <strong className="font-extrabold text-slate-700 dark:text-slate-300">{evt.producer}</strong></span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold">
                            <span>التفاصيل والهيكلية</span>
                            <ArrowRight className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETECTED ANOMALIES & AUDIT DETECTOR */}
          {activeTab === 'anomalies' && (
            <div className="dark:bg-slate-900 rounded-3xl border border-slate-250/60 dark:border-slate-850 p-6 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">كاشف الفجوات وتكرار الإشعارات والحسابات</h3>
                  <p className="text-xs text-slate-500 mt-1">مسح ذكي فوري لتدفق الأحداث لتحديد الفجوات الصامتة والعمليات المزدوجة.</p>
                </div>
                <button
                  onClick={handleAutoRepair}
                  disabled={isRepairing || stats.unresolvedAnomalies === 0}
                  className={`px-4 py-2 text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    stats.unresolvedAnomalies === 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 cursor-default'
                      : 'bg-amber-600 text-white hover:bg-amber-500 shadow-md active:scale-95'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{stats.unresolvedAnomalies === 0 ? '✓ تم تطهير كافة العيوب' : 'إصلاح وحل مكررات الأحداث فلقياً'}</span>
                </button>
              </div>

              <div className="space-y-4">
                {anomalies.map((an) => {
                  const typeStyles = {
                    'implicit_event': { label: 'حدث صامت / ضمني', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
                    'hidden_trigger': { label: 'مُشغل قاعدة بيانات مخفي', color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' },
                    'duplicated_notification': { label: 'إشعارات متكررة', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
                    'duplicated_calculations': { label: 'عمليات مكررة بالقوة', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' }
                  };

                  return (
                    <div
                      key={an.id}
                      className={`p-5 border transition-all text-right ${
                        an.isSolved
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60'
                          : an.severity === 'critical'
                          ? 'bg-rose-50/45 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/50'
                          : 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold border ${typeStyles[an.type].color}`}>
                            {typeStyles[an.type].label}
                          </span>
                          {an.severity === 'critical' && !an.isSolved && (
                            <span className="bg-rose-600 text-white text-[9px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                              حرج 🚨
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {an.isSolved ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                              <ShieldCheck className="w-4 h-4" />
                              <span>تم الاصلاح والفك ✓</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAnomalies(prev => prev.map(item => item.id === an.id ? { ...item, isSolved: true } : item));
                                triggerNotification(`تم تطهير ومعالجة الثغرة الهيكلية: ${an.labelArabic}`, 'success');
                                addLog(`✓ تم معالجة وتثبيت عدم التكرار للثغرة: [${an.labelArabic}]`);
                              }}
                              className="px-3.5 py-1.5 text-[11px] font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-md transition-all cursor-pointer"
                            >
                              حل ومعايرة يدوية
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <h4 className="text-sm font-black text-slate-950 dark:text-white">
                          {an.labelArabic} <span className="text-slate-400 font-mono text-xs font-medium">({an.labelEnglish})</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {an.descriptionArabic}
                        </p>
                        {an.isSolved && (
                          <div className="mt-2.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 font-medium">
                            <strong>الإجراء المطبق:</strong> {an.remedyArabic}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EVENT PLAYBACK & SIMULATION */}
          {activeTab === 'replay' && (
            <div className="dark:bg-slate-900 rounded-3xl border border-slate-250/60 dark:border-slate-850 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">محاكي بث وإعادة تشغيل الأحداث التاريخية</h3>
                  <p className="text-xs text-slate-500 mt-1">تأكيد عدم تكرار الحسابات (Idempotency) وسهولة إعادة التشغيل (Replayability) لكل حدث.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReplayAll}
                    disabled={isReplayingAll || publishedEvents.length === 0}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md"
                  >
                    <RefreshCcw className={`w-4 h-4 ${isReplayingAll ? 'animate-spin' : ''}`} />
                    <span>إعادة تشغيل التيار الكلي (Replay Stream)</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setPublishedEvents([
                        {
                          id: 'pub_1',
                          timestamp: '08:00:15',
                          eventName: 'StudentAdmittedEvent',
                          eventNameArabic: 'حدث قبول طالب جديد',
                          idempotencyKey: 'IDEMP-ADM-99214-2026',
                          correlationId: 'CORR-990014',
                          payload: { studentId: 'std_2026_8892', name: 'عمر بن الخطاب' },
                          status: 'processed'
                        }
                      ]);
                      addLog('🧹 تم تفريغ أرشيف الأحداث لتسجيل عمليات بث نظيفة.');
                    }}
                    className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                  >
                    تفريغ
                  </button>
                </div>
              </div>

              {/* Event Stream Live Ledger */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HistoryIcon className="w-4 h-4 text-amber-500" />
                  <span>شريط تدفق الأحداث المحفوظة والمنشورة (Event Store Ledger)</span>
                </h4>

                <div className="bg-slate-950 border border-slate-850 overflow-hidden">
                  {/* Ledger Header */}
                  <div className="grid grid-cols-12 gap-2 bg-slate-900 px-4 py-2 text-[10px] text-slate-400 border-b border-slate-850 font-bold">
                    <div className="col-span-2">الوقت</div>
                    <div className="col-span-4">اسم الحدث (Event Name)</div>
                    <div className="col-span-3">معرف عدم التكرار (Idempotency)</div>
                    <div className="col-span-2">معرف التراسل (CorrID)</div>
                    <div className="col-span-1 text-left">الحالة</div>
                  </div>

                  {/* Ledger Rows */}
                  <div className="divide-y divide-slate-850 max-h-64 overflow-y-auto font-mono text-xs">
                    {publishedEvents.map((log) => (
                      <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-slate-300 hover:bg-slate-900/40 items-center">
                        <div className="col-span-2 text-slate-500">{log.timestamp}</div>
                        <div className="col-span-4 font-bold text-amber-350">{log.eventName}</div>
                        <div className="col-span-3 text-amber-500 text-[11px] truncate" title={log.idempotencyKey}>{log.idempotencyKey}</div>
                        <div className="col-span-2 text-slate-400 text-[11px]">{log.correlationId}</div>
                        <div className="col-span-1 text-left">
                          <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            مؤصل ✓
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Business Actions to trigger on demand */}
                <div className="p-5 bg-transparent dark:bg-slate-950 dark:border-slate-800">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-200 mb-3">
                    إطلاق أحداث الأعمال يدويّاً لفحص دقة التفكيك (On-Demand Broker Dispatch):
                  </h4>
                  
                  <div className="flex flex-wrap gap-2">
                    {domainEvents.slice(0, 6).map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => handleFireEvent(evt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-250 dark:border-slate-750 text-[11px] font-extrabold text-slate-800 dark:text-slate-300 transition-all cursor-pointer active:scale-95 hover:bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{evt.eventNameArabic}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPREHENSIVE DOCUMENTATION & REPORT */}
          {activeTab === 'documentation' && (
            <div className="dark:bg-slate-900 rounded-3xl border border-slate-250/60 dark:border-slate-850 p-6 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">وثيقة البنية المعمارية للأحداث وتقارير الارتباط</h3>
                  <p className="text-xs text-slate-500 mt-1">توليد تلقائي فوري للمواصفات الفنية لامتثال EDA ميثاق Directive #017.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerNotification('تم توليد وتصدير ملف التوثيق المالي والأكاديمي بنجاح!', 'success');
                      addLog('📄 تم تصدير مستندات المعمارية إلى مجلد التقارير المؤسسي (/reports/eda-spec.json).');
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                    title="تنزيل كملف JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                    title="طباعة التقرير"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Interactive Report Structure */}
              <div className="space-y-6">
                
                {/* 1. Architecture Overview */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>أولاً: مواصفات البنية المعمارية المعتمدة (Event Architecture Spec)</span>
                  </h4>
                  
                  <div className="p-4 bg-transparent dark:bg-slate-950 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                    <p>
                      <strong>مفهوم التدفق:</strong> تعتمد المنظومة بالكامل على مبدأ <strong>Event Sourcing & Decoupled Domain Events</strong>. بدلاً من استدعاء الخدمات لبعضها بشكل مباشر (Tightly Coupled)، تقوم كل خدمة بنشر حدث عند حدوث أي معاملة تشغيلية ناجحة.
                    </p>
                    <p>
                      <strong>ضمان عدم التكرار (Idempotency):</strong> كل حدث يحتوي على مفتاح عدم تكرار فريد (Idempotency Key) يتم التحقق منه قبل استهلاك الحدث. في حال تكرار تيار البث، تكتشف الخدمة المعرف وتقوم بتخطي التنفيذ (Skipping duplicated side-effects).
                    </p>
                  </div>
                </div>

                {/* 2. Event Dependency Report Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>ثانياً: تقرير ارتباطية الأحداث والمستهلكين (Event Dependency Report)</span>
                  </h4>

                  <div className="overflow-x-auto dark:border-slate-800">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-transparent dark:bg-slate-950 text-slate-500 font-extrabold border-b border-slate-200 dark:border-slate-800">
                          <th className="p-3">رمز ومصادقة الحدث</th>
                          <th className="p-3">النطاق (Domain)</th>
                          <th className="p-3">الناشر (Publisher)</th>
                          <th className="p-3">المستهلكون المشتركون (Subscribers)</th>
                          <th className="p-3">مستوى الاقتران (Coupling)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {domainEvents.map((evt) => (
                          <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{evt.eventName}</td>
                            <td className="p-3">{evt.context}</td>
                            <td className="p-3 font-bold text-amber-650 dark:text-amber-400">{evt.producer}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {evt.subscribers.map((sub, i) => (
                                  <span key={i} className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                منخفض (Loose) ✓
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Event Schema Spec */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>ثالثاً: معايير حوكمة السجلات الموقعة (Signing Specs)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-850 font-mono text-xs text-slate-300">
                      <div className="text-slate-500 mb-1">// Metadata Invariance Block</div>
                      <div>"eventId": "UUIDv4 (Immutable)"</div>
                      <div>"version": "Semantic versioning (1.0, 2.0)"</div>
                      <div>"timestamp": "ISO-8601 UTC format"</div>
                      <div>"correlationId": "Distributed tracing correlation"</div>
                      <div>"idempotencyKey": "Strict deduplication token"</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-850 font-mono text-xs text-slate-300">
                      <div className="text-slate-500 mb-1">// Event Security Signature</div>
                      <div>"encryption": "TLS 1.3 Message Broker Transit"</div>
                      <div>"signature": "SHA256 Cryptographic Digest"</div>
                      <div>"storage": "Appended-only Event Store ledger"</div>
                      <div>"auditable": "Immutable trails for external audit"</div>
                      <div>"replayable": "Deterministic historic state repair"</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* LEFT COLUMN - Details & Live Terminal console */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. DETAILED SCHEMA EXPLORER */}
          <div className="dark:bg-slate-900 rounded-3xl border border-slate-250/60 dark:border-slate-850 p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Code className="w-4.5 h-4.5 text-amber-600" />
              <span>مستكشف معايير الحمولة والـ Payload</span>
            </h3>

            <div className="p-4 bg-transparent dark:bg-slate-950 dark:border-slate-800 text-right space-y-3">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">الحدث المختار حالياً</div>
                <div className="text-sm font-black text-slate-950 dark:text-white mt-0.5">{selectedEvent.eventNameArabic}</div>
                <div className="text-xs font-mono text-amber-600 dark:text-amber-400 font-extrabold mt-0.5">{selectedEvent.eventName}</div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">ناشر الحدث</div>
                  <div className="font-bold text-slate-800 dark:text-slate-300 mt-0.5">{selectedEvent.producer}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">استراتيجية الكبح</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate" title={selectedEvent.idempotencyStrategy}>
                    {selectedEvent.idempotencyStrategy}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                <div className="text-[10px] text-slate-400 mb-1.5">مخطط حمولة الحدث (Event Payload JSON)</div>
                <div className="bg-slate-950 p-3.5 text-left font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-56 leading-relaxed">
                  <pre>{JSON.stringify(selectedEvent.payloadTemplate, null, 2)}</pre>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  onClick={() => handleFireEvent(selectedEvent)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 hover:shadow-md"
                >
                  <Play className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>بث الحدث تجريبياً للشبكة 🚀</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. REAL-TIME TECHNICAL CONSOLE */}
          <div className="dark:bg-slate-900 rounded-3xl border border-slate-250/60 dark:border-slate-850 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
                <span>شاشة فحص وتتبع المحاكي الفوري</span>
              </h3>
              <button
                onClick={() => {
                  setConsoleLogs([`[${new Date().toLocaleTimeString('ar-SA')}] تم تهيئة الكونسول وتصفير مؤشرات المعاينة.`]);
                  triggerNotification('تم تصفير كونسول الأحداث بنجاح.', 'info');
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                تصفير الكونسول
              </button>
            </div>

            <div className="bg-slate-950 text-emerald-400 p-4 font-mono text-[11px] h-64 overflow-y-auto space-y-2 border border-slate-850 text-left leading-relaxed">
              {consoleLogs.map((log, index) => (
                <div key={index} className="border-b border-slate-900/40 pb-1.5 last:border-0">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: CUSTOM EVENT CREATION FORM */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="dark:bg-slate-900 rounded-3xl border border-slate-250 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 shadow-2xl text-right"
              dir="rtl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-950 dark:text-white">تسجيل وتأصيل حدث أعمال مخصص</h3>
                  <p className="text-xs text-slate-500">إضافة حدث جديد ممتثل لمواصفات Directive #017.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">اسم الحدث باللغة العربية (مثال: حدث استقالة معلم)</label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل اسم الحدث باللغة العربية..."
                    value={newEventArabic}
                    onChange={(e) => setNewEventArabic(e.target.value)}
                    className="w-full bg-transparent dark:bg-slate-950 border border-slate-250 dark:border-slate-750 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">رمز الحدث باللغة الإنجليزية (مثال: TeacherResigned)</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="TeacherResigned"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      className="w-full bg-transparent dark:bg-slate-950 border border-slate-250 dark:border-slate-750 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-left text-slate-900 dark:text-slate-100"
                    />
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">Event</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">نطاق العمل (Context)</label>
                    <select
                      value={newEventContext}
                      onChange={(e: any) => setNewEventContext(e.target.value)}
                      className="w-full bg-transparent dark:bg-slate-950 border border-slate-250 dark:border-slate-750 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="Admission">القبول والتسجيل</option>
                      <option value="Academic">الشؤون الأكاديمية</option>
                      <option value="Billing">الفوترة والمالية</option>
                      <option value="General Ledger">الأستاذ العام</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">ناشر الحدث (Producer)</label>
                    <input
                      type="text"
                      placeholder="TeacherRegistryService"
                      value={newEventProducer}
                      onChange={(e) => setNewEventProducer(e.target.value)}
                      className="w-full bg-transparent dark:bg-slate-950 border border-slate-250 dark:border-slate-750 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-left text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">الخدمات المشتركة المستهلكة (مفصولة بفاصلة)</label>
                  <input
                    type="text"
                    placeholder="HRService, NotificationGateway, ERPLogger"
                    value={newEventSubscribers}
                    onChange={(e) => setNewEventSubscribers(e.target.value)}
                    className="w-full bg-transparent dark:bg-slate-950 border border-slate-250 dark:border-slate-750 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">يساهم فصل الخدمات في فك التداخل البرمي المباشر بالكامل.</span>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-extrabold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    توثيق ونشر الحدث ⚡
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
