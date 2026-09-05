/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface School {
  id: string;
  name: string;
  logo: string;
  type: 'government' | 'private' | 'international' | 'model';
  licenseNumber: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  subdomain?: string;
  plan?: 'Basic' | 'Business' | 'Enterprise';
  status?: 'active' | 'frozen';
  connectedDb?: string;
  region?: string;
  createdAt?: string;
  managerName?: string;
  adminName?: string;
  adminEmail?: string;
  storageUsed?: string;
  storageLimit?: string;
  country?: string;
  city?: string;
  subscriptionDuration?: string;
  userLimit?: string;
  motto?: string;
  primaryColor?: string;
  secondaryColor?: string;
  loginBackground?: string;
  watermark?: string;
  reportHeader?: string;
  certificateHeader?: string;
  /** Server-derived per-school feature flags; never populated from browser storage. */
  features?: Record<string, boolean>;
  templateId?: string;
  templateVersion?: number;
  releaseVersion?: number;
  /** Server-derived configuration manifest from the school's active release. */
  templateManifest?: Record<string, unknown>;
}

export interface Branch {
  id: string;
  schoolId: string;
  name: string;
  city: string;
  manager: string;
  studentCount: number;
  teacherCount: number;
}

export type UserRole = 'SuperAdmin' | 'SchoolAdmin' | 'Teacher' | 'Accountant' | 'Parent' | 'Control' | 'Auditor' | 'Student';

export type UserStatus = 'active' | 'inactive' | 'locked' | 'suspended';

export interface SecurityGroup {
  id: string;
  name: string;
  permissions: string[];
  schoolId: string;
}

export interface Permission {
  id?: string;
  code: string;
  title?: string;
  description: string;
  module: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

export interface User {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  permissions: string[];
  groupIds: string[];
  branchIds: string[];
  costCenterIds: string[];
  lastLogin?: string;
  passwordHash: string;
  forcePasswordChange: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}



export interface Student {
  id: string;
  schoolId: string;
  branchId: string;
  name: string;
  nationalId: string;
  classroom: string;
  section: string;
  parentName: string;
  parentPhone: string;
  registrationDate: string;
  status: 'applicant' | 'accepted' | 'enrolled' | 'active' | 'suspended' | 'dismissed' | 'graduated' | 'withdrawn' | 'archived' | 're_enrolled' | 'frozen' | 'inactive' | 'on_leave';
  feesPaid: number;
  feesRemaining: number;
  version: number;
  isDeleted: boolean;
  
  // Dynamic Academic Stage, Grade, and Class Mapping
  stageId?: string;
  gradeId?: string;
  classId?: string;
  costCenterId?: string;
  
  // Enterprise Extended Fields
  studentCode?: string;
  academicId?: string;
  gender?: 'male' | 'female';
  nationality?: string;
  religion?: string;
  birthDate?: string;
  socialStatus?: string;
  address?: string;
  healthInfo?: string;
  transportation?: string;
  academicYear?: string;
  avatarUrl?: string;
  email?: string;
  guardianOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  educationLevel?: string;
  guardianRelation?: string;
  
  // Enterprise Audit/Locking Fields
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
  
  // Multiple parent/emergency mapping fields (Family Graph)
  parentsAndGuardians?: {
    relation: 'father' | 'mother' | 'guardian' | 'emergency';
    name: string;
    phone: string;
    nid?: string;
    appAccess: boolean;
    financialLiability: boolean;
    smsNotifications: boolean;
    appAccountStatus?: 'active' | 'pending' | 'blocked';
  }[];
  
  // Document vaults
  securedDocs?: {
    id: string;
    category: 'national_id' | 'passport' | 'birth_cert' | 'transcript' | 'medical';
    fileName: string;
    fileSize: string;
    accessPermission: 'admins' | 'everyone' | 'teachers';
    ocrProcessed?: boolean;
    ocrExtractedName?: string;
    uploadedAt: string;
  }[];

  // Competitive health & safety dashboard fields
  healthBloodType?: string;
  healthChronic?: string;
  healthAllergies?: string;
  healthVaccines?: boolean;
  healthEmergencyContact?: string;
  healthContinuousMeds?: string;
  healthSpecialNeeds?: string;
  healthDoctorNotes?: string;

  // Academic additional fields
  academicLevel?: string;
  academicStrengths?: string;
  academicWeaknesses?: string;
  academicTalent?: string;
  academicPrograms?: string;
  academicGuidanceNotes?: string;

  // Competitive behavioral metrics tracking
  behaviorPoints?: number;
  behaviorNotes?: string;
  behaviorDisciplineLevel?: string;
  behaviorCommitmentLevel?: string;
  behaviorCooperationLevel?: string;
  behaviorAwards?: string;
  behaviorInfractions?: string;
  behaviorSocialWorkerNotes?: string;
  behaviorIncidents?: {
    id: string;
    date: string;
    type: 'infraction' | 'merit';
    points: number;
    title: string;
    description: string;
    resolved: boolean;
  }[];
}

export interface Stage {
  id: string; // StageID
  schoolId: string; // SchoolID
  code: string; // StageCode
  name: string; // StageName
  type: 'kindergarten' | 'primary' | 'middle' | 'secondary' | string; // StageType
  costCenterId: string; // CostCenterID
  order: number; // StageOrder
  isActive: boolean; // IsActive
}

export interface Teacher {
  id: string;
  schoolId: string;
  branchId: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  hiringDate: string;
  salary: number;
  status: 'active' | 'on_leave' | 'inactive';
  assignedClasses: string[];
}

export interface Employee {
  id: string;
  schoolId: string;
  name: string;
  role: string;
  phone: string;
  status: 'active' | 'inactive';
  salary: number;
}

export interface SchoolClass {
  id: string;
  name: string;
  level: 'kindergarten' | 'primary' | 'middle' | 'high';
  sections: string[];
  capacity: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  classId: string;
  date: string;
  maxScore: number;
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
}

export interface Transaction {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  date: string;
  method: 'cash' | 'card' | 'bank_transfer' | 'other';
  referenceNumber: string; // Bank/Transaction reference
  status: 'completed' | 'pending' | 'reversed';
  notes?: string;
  recordedBy: string; // UserId
  costCenterId?: string;
  stageId?: string;
  type?: 'fee_payment' | 'salary' | 'expense' | 'revenue' | 'discount' | 'activity' | 'transport' | 'books';
}

export interface Installment {
  id: string;
  invoiceId: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  paidDate?: string;
  notes?: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  installments: Installment[];
}

export type InvoiceStatus = 
  | 'Draft' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Issued' 
  | 'Sent'
  | 'Partially Paid' 
  | 'Paid' 
  | 'Overdue' 
  | 'Disputed' 
  | 'Cancelled' 
  | 'Void' 
  | 'Credit Issued' 
  | 'Refunded' 
  | 'Archived'
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'written_off'; // maintain backward compatibility with old lower-case statuses if any exist in fallback storage

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRatePercent?: number;
  taxAmount?: number;
  discountAmount?: number;
}

export interface InvoiceTax {
  id: string;
  taxCode: string;
  taxName: string;
  taxRatePercent: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface InvoiceDiscount {
  id: string;
  discountCode?: string;
  discountName: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  discountAmount: number;
}

export interface InvoiceCharge {
  id: string;
  chargeName: string;
  chargeAmount: number;
}

export interface InvoiceReference {
  type: 'order' | 'contract' | 'previous_invoice' | 'credit_note' | 'debit_note' | string;
  referenceId: string;
  referenceNumber: string;
}

export interface InvoiceStatusHistory {
  id: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
  userId: string;
  userName: string;
  reason?: string;
}

export interface InvoiceVersion {
  id: string;
  invoiceId: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  reason: string;
  snapshot: any;
}

export interface InvoiceAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

export interface InvoiceAudit {
  id: string;
  action: 'Create' | 'Approve' | 'Issue' | 'Cancel' | 'Void' | 'Credit Note' | 'Debit Note' | 'Print' | 'Export' | 'Version Change' | string;
  timestamp: string;
  userId: string;
  userName: string;
  details: string;
  ipAddress?: string;
}

export interface InvoiceNumberSequence {
  id: string;
  schoolId: string;
  branchId: string;
  prefix: string;
  suffix: string;
  fiscalYear: string;
  academicYear: string;
  currentSequence: number;
  paddedLength: number;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  totalAmount?: number;
  remainingAmount?: number;
  dueDate: string;
  status: InvoiceStatus;
  item: string;
  taxAmount: number;
  items?: {
    description: string;
    amount: number;
  }[];
  paymentPlan?: PaymentPlan;
  transactions?: Transaction[];
  invoiceDate: string;
  costCenterId?: string;
  stageId?: string;
  studentPaymentId?: string;
  receiptVoucherId?: string;
  journalEntryId?: string;
  costCenter?: string;
  /** Explicit ERP account links used by the canonical posting adapter. */
  revenueAccount?: string;
  receivableAccount?: string;
  financialPeriod?: string;
  user?: string;
  createdAt?: string;

  // IFRS Revenue Recognition Fields
  recognitionPolicy?: 'immediate' | 'cash' | 'deferred_revenue';
  deferredRevenueAccount?: string;
  revenueRecognitionMethod?: string;
  recognitionStartDate?: string;
  recognitionEndDate?: string;

  // Enterprise Domain Models
  schoolId?: string;
  branchId?: string;
  academicYearId?: string;
  fiscalYearId?: string;
  invoiceNumber?: string;
  currency?: string;
  version?: number;
  isDeleted?: boolean;
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;

  lines?: InvoiceLine[];
  taxes?: InvoiceTax[];
  discounts?: InvoiceDiscount[];
  charges?: InvoiceCharge[];
  references?: InvoiceReference[];
  statusHistory?: InvoiceStatusHistory[];
  versions?: InvoiceVersion[];
  attachments?: InvoiceAttachment[];
  audits?: InvoiceAudit[];
}

// ... existing types ...

export interface InventoryItem {
  id: string;
  schoolId: string;
  branchId: string;
  name: string;
  sku: string;
  categoryId: string;
  unitId: string;
  supplierId: string;
  warehouseId: string;
  quantity: number;
  minLevel: number;
  maxLevel: number;
  reorderLevel: number;
  costPrice: number;
  salePrice: number;
  vatRate: number;
  imageUrl?: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  // Accounting Mapping
  inventoryAccountId: string;
  costOfGoodsAccountId: string;
  adjustmentAccountId: string;
  costCenterId: string;
}

export interface InventoryCategory {
  id: string;
  schoolId: string;
  name: string;
  parentId?: string;
  description?: string;
}

export interface InventoryUnit {
  id: string;
  schoolId: string;
  name: string;
  symbol: string;
}

export interface InventoryWarehouse {
  id: string;
  schoolId: string;
  name: string;
  location: string;
  manager: string;
}

export interface InventorySupplier {
  id: string;
  schoolId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface InventoryTransaction {
  id: string;
  schoolId: string;
  itemId: string;
  warehouseId: string;
  type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'stocktake';
  quantity: number;
  price: number;
  date: string;
  referenceId: string;
  notes?: string;
}

export interface BusRoute {
  id: string;
  routeNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  currentStudents: number;
  status: 'active' | 'maintenance' | 'inactive';
  startPoint: string;
  endPoint: string;
}

export interface AuditLog {
  id: string;
  schoolId: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  ipAddress: string;
  details: string;
  
  // Enterprise Audit Fields
  browser?: string;
  device?: string;
  sessionId?: string;
  endpoint?: string;
  httpMethod?: string;
  affectedRecord?: string;
  valuesBefore?: any;
  valuesAfter?: any;
  executionTime?: number; // in ms
  correlationId?: string;
  result?: 'success' | 'failure' | string;
  severity?: 'low' | 'medium' | 'high' | 'critical' | string;
}

export interface AuditMetadata {
  userId: string;
  userName: string;
  userRole: string;
  ipAddress: string;
}

export interface ServiceStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  collectedFees: number;
  totalBudgets: number;
}

// Financial Engine Types

export type AccountNature = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  schoolId?: string;
  code: string;
  name: string;
  shortName?: string;
  nature: AccountNature;
  level: number;
  parentAccountId?: string;
  hierarchyPath?: string;
  isActive: boolean;
  isLeaf: boolean; // Cannot have children
  isSystemProtected?: boolean; // Requirement 3: Prevent deletion of system accounts
  balance: number;
  debitBalance?: number;
  creditBalance?: number;
  currency?: string;
  defaultCostCenter?: string;
  branchId?: string; // Add branchId
}

export interface COAAccountTemplate {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  nature: AccountNature;
  level: number;
  parentAccountId?: string;
  hierarchyPath?: string;
  isActive: boolean;
  isLeaf: boolean;
  isSystemProtected?: boolean;
  balance: number;
}

export interface COATemplate {
  id: string;
  name: string;
  country: string;
  baseCurrency: string;
  description: string;
  orgType: 'school' | 'university' | 'institute' | 'training_center';
  status: 'active' | 'inactive';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateAccount {
  id: string;
  templateId: string;
  code: string;
  name: string;
  nature: AccountNature;
  level: number;
  parentAccountId?: string;
}

export interface SystemGLMapping {
  id: string;
  schoolId: string;
  functionKey: string;
  accountId: string;
  description: string;
}

export interface FiscalYear {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  status: 'new' | 'open' | 'closed' | 'archived';
  baseCurrency?: string;
  notes?: string;
  createdAt?: string;
  createdBy?: string;
  schoolId: string;
}

export interface AccountingPeriod {
  id: string;
  fiscalYearId: string;
  periodName: string;
  periodNumber?: number;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed' | 'locked';
  schoolId: string;
}

export type PostingStatus = 'draft' | 'submitted' | 'approved' | 'posted' | 'reversed' | 'cancelled';
export type TransactionType = 'automatic' | 'manual' | 'adjustment' | 'opening_balance' | 'closing' | 'accrual' | 'reversal' | 'recurring' | 'depreciation' | 'payroll' | 'deferred_revenue' | 'inventory' | 'asset_disposal';

export interface JournalEntryDetail {
  id?: string;
  accountId: string;
  debit: number;
  credit: number;
  currency?: string;
  exchangeRate?: number;
  costCenterId?: string;
  branchId?: string;
  projectId?: string;
  notes?: string;
  reference?: string;
}

export interface JournalEntry {
  id: string;
  journalNumber?: string; // Professional sequence
  voucherNumber?: string;
  date: string;
  documentDate?: string;
  referenceNumber?: string;
  transactionType?: TransactionType;
  moduleName?: string;
  description: string;
  currency?: string;
  exchangeRate?: number;
  fiscalYearId?: string;
  accountingPeriodId?: string;
  branchId?: string;
  costCenterId?: string;
  projectId?: string;
  createdBy?: string;
  approvedBy?: string;
  postedBy?: string;
  status: PostingStatus;
  sourceScreen?: string;
  sourceDocumentId?: string;
  items: JournalEntryDetail[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  updatedAt?: string;
  referenceType?: string;
  referenceId?: string;
  schoolId?: string;
}

export type VoucherType = 'receipt' | 'payment' | 'journal' | 'contra';

export interface Voucher {
  id: string;
  voucherNumber?: string; // Professional sequence number e.g. RV-202607-0001
  type: VoucherType;
  date: string;
  amount: number;
  accountId: string; // The cash/bank account involved
  description: string;
  status: 'draft' | 'posted' | 'cancelled';
  journalEntryId?: string; // Automatically linked
  createdAt: string;
}

export interface Grade {
  id: string; // GradeID
  stageId: string; // StageID FK
  code: string; // GradeCode
  name: string; // GradeName
  order: number; // GradeOrder
  isActive: boolean; // IsActive
}

export interface AcademicClass {
  id: string; // ClassID
  gradeId: string; // GradeID FK
  code: string; // ClassCode
  name: string; // ClassName
  capacity: number; // Capacity
  isActive: boolean; // IsActive
}

export interface CostCenter {
  id: string; // CostCenterID
  code: string; // CostCenterCode
  name: string; // CostCenterName
  stageId?: string; // StageID FK
  parentCostCenterId?: string; // ParentCostCenterID
  isActive: boolean; // IsActive
}

export interface Guardian {
  id: string;
  schoolId: string;
  nationalId: string;
  name: string;
  phone: string;
  email?: string;
  occupation?: string;
  address?: string;
  appAccess: boolean;
  appAccountStatus?: 'active' | 'pending' | 'blocked';
}

export interface StudentGuardian {
  id: string;
  studentId: string;
  guardianId: string;
  relationType: 'father' | 'mother' | 'guardian' | 'emergency' | string;
  isPrimary: boolean;
  financialLiability: boolean;
  smsNotifications: boolean;
}

export interface StudentMedicalRecord {
  id: string;
  studentId: string;
  bloodType?: string;
  chronicDiseases?: string;
  allergies?: string;
  vaccinesTaken?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
}

export interface StudentTransportation {
  id: string;
  studentId: string;
  routeNumber?: string;
  pickupPoint?: string;
  dropoffPoint?: string;
  monthlyFees?: number;
  status?: 'active' | 'inactive';
}

export interface StudentLibraryAccount {
  id: string;
  studentId: string;
  libraryCardNumber: string;
  status: 'active' | 'suspended' | 'inactive';
  booksBorrowedCount: number;
  unpaidFines: number;
}

export interface StudentUniformAccount {
  id: string;
  studentId: string;
  uniformSize?: string;
  piecesReceivedCount?: number;
  totalFees?: number;
  paymentStatus?: 'paid' | 'unpaid' | 'partial';
}

export interface StudentAsset {
  id: string;
  studentId: string;
  assetName: string;
  serialNumber?: string;
  receivedDate: string;
  returnedDate?: string;
  condition?: 'excellent' | 'good' | 'damaged' | string;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  category: 'national_id' | 'passport' | 'birth_cert' | 'transcript' | 'medical' | string;
  fileName: string;
  fileSize: string;
  fileUrl: string; // Added field
  accessPermission: 'admins' | 'everyone' | 'teachers' | string;
  ocrProcessed?: boolean;
  ocrExtractedName?: string;
  uploadedAt: string;
  uploadedBy: string; // Added field
  
  // Enterprise Requirement Fields
  version: number;
  status: DocumentStatus;
  expirationDate?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  workflowStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  
  // Audit & History Tracking
  auditHistory: AuditEntry[]; // Assuming AuditEntry exists or needs definition
  versionHistory: DocumentVersion[];
}

export type DocumentStatus = 'active' | 'archived' | 'deleted' | string;

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  uploadedBy: string;
  uploadedAt: string;
  checksum: string;
  notes?: string; // Added field
}

export interface DocumentMetadata {
  id: string;
  tenantId: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedDate: string;
  status: DocumentStatus;
  checksum: string;
  version?: number;
  description?: string;
  tags?: string[];
  moduleContext?: string;
}

export interface KPIDefinition {
  id: string;
  name: string;
  code: string;
  formula: string;
  module: string;
  targetValue: number;
  currentValue: number;
  period: string;
}

export interface DashboardDefinition {
  id: string;
  name: string;
  roleRequired: string;
  widgets: any[];
}

export interface StudentContact {
  id: string;
  studentId: string;
  contactName: string;
  contactPhone: string;
  contactRelation: string;
  isEmergency: boolean;
}

export interface GeneralLedger {
  id: string;
  schoolId: string;
  accountId: string;
  date: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  referenceType: 'journal' | 'voucher' | string;
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  nature: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}


// --- ENTERPRISE MONITORING, LOGGING & OBSERVABILITY PLATFORM ---

export type LogLevel = 'trace' | 'debug' | 'info' | 'warning' | 'error' | 'critical' | 'security' | 'audit' | 'event' | 'performance' | 'integration';
export type AlertSeverity = 'healthy' | 'warning' | 'critical' | 'offline';

export interface LogEntry {
  id: string;
  correlationId: string;
  traceId: string;
  tenantId: string;
  schoolId: string;
  module: string;
  severity: LogLevel;
  message: string;
  exception?: string;
  stackTrace?: string;
  userId?: string;
  executionTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  timestamp: string;
}

export interface MetricEntry {
  id: string;
  name: string;
  value: number;
  module: string;
  timestamp: string;
}

export interface AlertEntry {
  id: string;
  severity: AlertSeverity;
  message: string;
  source: string;
  timestamp: string;
  isResolved: boolean;
}

export interface Incident {
  id: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  rootCause: string;
  assignedTo: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
}

// ==========================================
// ENTERPRISE CONFIGURATION PLATFORM
// ==========================================

export type ConfigurationLevel = 'global' | 'country' | 'organization' | 'tenant' | 'school' | 'branch' | 'department' | 'user';
export type ConfigurationStatus = 'draft' | 'submitted' | 'approved' | 'published' | 'deprecated' | 'archived';
export type ConfigValueType = 'boolean' | 'integer' | 'decimal' | 'string' | 'json' | 'encrypted';

export interface ConfigurationItem {
  id: string; // UUID
  tenantId: string;
  schoolId?: string;
  branchId?: string;
  category: string;
  group: string;
  section: string;
  key: string;
  value: any;
  valueType: ConfigValueType;
  level: ConfigurationLevel;
  version: number;
  status: ConfigurationStatus;
  
  // Audit fields (required by DATABASE_STANDARDS.md)
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
  isDeleted: boolean;
}

export interface FeatureFlag {
  id: string;
  tenantId: string;
  key: string;
  isActive: boolean;
  percentageRollout?: number;
  scheduledActivation?: string;
  scheduledExpiration?: string;
}

export interface ConfigurationAudit {
  id: string;
  configItemId: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'publish' | 'rollback';
  oldValue: any;
  newValue: any;
  userId: string;
  timestamp: string;
  reason?: string;
}

// --- ENTERPRISE REPORTING & DOCUMENT GENERATION ENGINE ---

export type ReportFormat = 'pdf' | 'excel' | 'word' | 'csv' | 'html' | 'json';
export type ReportStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ReportDefinition {
  id: string;
  schoolId: string;
  name: string;
  description: string;
  module: string;
  dataSource: string;
  query: string;
  parameters: any[];
  templateId: string;
  isActive: boolean;
}

export interface ReportTemplate {
  id: string;
  schoolId: string;
  name: string;
  type: 'document' | 'report' | 'certificate';
  content: string; // JSON or HTML template
  format: string;
}

export interface ReportExecution {
  id: string;
  schoolId: string;
  reportId: string;
  parameters: any;
  format: ReportFormat;
  status: ReportStatus;
  executedBy: string;
  executionDate: string;
  resultUrl?: string; // Path in DMS
}

// --- ENTERPRISE INTEGRATION & API GATEWAY ---

export type APIProtocol = 'rest' | 'soap' | 'graphql' | 'grpc' | 'webhook';
export type APIStatus = 'active' | 'inactive';

export interface APIConfiguration {
  id: string;
  name: string;
  version: string;
  description: string;
  provider: string;
  protocol: APIProtocol;
  baseUrl: string;
  authType: 'api_key' | 'oauth2' | 'jwt' | 'bearer' | 'basic' | 'cert' | 'mtls' | 'none';
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    delay: number;
    circuitBreaker: boolean;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  status: APIStatus;
  schoolId: string;
}

export interface WebhookRegistration {
  id: string;
  name: string;
  url: string;
  event: string;
  secret: string;
  status: 'active' | 'inactive';
  schoolId: string;
}

export interface IntegrationLog {
  id: string;
  apiId: string;
  request: string;
  response: string;
  statusCode: number;
  executionTime: number;
  timestamp: string;
  userId: string;
  schoolId: string;
}

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';
export type JobStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying' | 'paused' | 'expired';

export interface BackgroundJob {
  id: string;
  jobName: string;
  category: string;
  description: string;
  module: string;
  priority: JobPriority;
  status: JobStatus;
  executionType: 'immediate' | 'scheduled' | 'recurring' | 'batch' | 'queue' | 'manual' | 'system' | 'maintenance' | 'integration';
  queueName: string;
  createdBy: string;
  createdDate: string;
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  retryCount: number;
  maxRetry: number;
  workerName?: string;
  serverName?: string;
  tenantId: string;
  branchId: string;
}

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';
export type NotificationCanonicalChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
export type NotificationChannel = NotificationCanonicalChannel | 'system' | 'whatsapp' | 'teams' | 'slack';
export type NotificationStatus = 'queued' | 'processing' | 'delivered' | 'failed' | 'dead_letter';
export type NotificationInteractionStatus = 'unread' | 'read';

export interface NotificationQueuePayload {
  module: string;
  reference: { type: string; id: string };
  category: string;
  subject: string;
  body: string;
  language: string;
  legacyChannel?: 'whatsapp' | 'teams' | 'slack';
}

export interface NotificationQueueRecord {
  id: string;
  tenantId: string;
  recipientUserId: string;
  channel: NotificationCanonicalChannel;
  payload: NotificationQueuePayload;
  priority: number;
  status: NotificationStatus;
  retryCount: number;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  schoolId: string;
  name: string;
  category: string;
  subject: string;
  body: string; // Template with {var}
  channel: NotificationChannel;
  isActive: boolean;
}

export interface Notification {
  id: string;
  schoolId: string;
  tenantId: string;
  branchId: string;
  recipientUserId: string;
  module: string;
  referenceType: string;
  referenceId: string;
  priority: NotificationPriority;
  category: string;
  subject: string;
  body: string;
  channel: NotificationChannel;
  language: string;
  createdBy: string;
  createdDate: string;
  scheduledDate?: string;
  expirationDate?: string;
  status: NotificationStatus;
  retryCount: number;
}

export interface WorkflowDefinition {
  id: string;
  schoolId: string;
  name: string;
  module: string;
  steps: WorkflowStep[];
  isActive: boolean;
}

export type WorkflowStatus = 'submitted' | 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled' | 'draft';

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  roleRequired: UserRole;
  description: string;
  canApprove: boolean;
  canReject: boolean;
  canReturn: boolean;
  minApprovalLevels: number;
}

export interface WorkflowInstance {
  id: string;
  schoolId: string;
  definitionId: string;
  documentId: string; // e.g. Voucher ID or Invoice ID
  documentType: string;
  currentStepNumber: number;
  status: WorkflowStatus;
  history: AuditEntry[];
}

export interface ApprovalRequest {
  id: string;
  schoolId: string;
  workflowInstanceId: string;
  stepNumber: number;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  comments?: string;
  timestamp: string;
}

export interface AuditEntry {
  id: string;
  workflowInstanceId: string;
  action: string; // e.g. 'Submit', 'Approve', 'Reject'
  userId: string;
  userName: string;
  role: string;
  timestamp: string;
  ipAddress: string;
  notes?: string;
}


export type InstallmentFrequency = 'Monthly' | 'Weekly' | 'Quarterly' | 'Semi Annual' | 'Annual' | 'Custom' | 'Flexible' | 'Rolling';

export interface InstallmentPolicy {
  gracePeriodDays: number;
  penaltyRatePercent?: number;
  flatLateFee?: number;
  maxPenaltyPercent?: number;
  allowPenaltyWaiver: boolean;
}

export type InstallmentStatus = 'Draft' | 'Scheduled' | 'Due' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled' | 'Written Off';

export interface InstallmentPlan {
  id: string;
  schoolId: string;
  studentId: string;
  invoiceId: string;
  feeTemplateId: string;
  totalAmount: number;
  frequency: InstallmentFrequency;
  status: 'Draft' | 'Approved' | 'Cancelled' | 'Completed';
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
  currentVersion: number;
  policy: InstallmentPolicy;
}

export interface InstallmentSchedule {
  id: string;
  planId: string;
  version: number;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  penaltyAmount: number;
  waivedPenaltyAmount: number;
  status: InstallmentStatus;
  writeOffAmount?: number;
}

export interface InstallmentItem {
  id: string;
  scheduleId: string;
  feeItemName: string;
  amount: number;
}

export interface InstallmentPayment {
  id: string;
  planId: string;
  scheduleId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  user: string;
  type: 'Partial' | 'Full' | 'Advance' | 'Overpayment' | 'Refund' | 'Settlement' | 'Write-off';
}

export interface InstallmentHistory {
  id: string;
  planId: string;
  action: 'Create' | 'Approve' | 'Reschedule' | 'Payment' | 'Refund' | 'Write-off' | 'Cancellation';
  version: number;
  timestamp: string;
  userId: string;
  userName: string;
  details: string;
}

export interface InstallmentVersion {
  id: string;
  planId: string;
  version: number;
  createdAt: string;
  createdBy: string;
  reason: string;
  schedulesSnapshot: InstallmentSchedule[];
}

// --- ENTERPRISE REVENUE RECOGNITION DOMAIN MODELS (IFRS 15) ---

export interface AcademicCalendar {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalMonths: number;
  totalWeeks: number;
  totalDays: number;
}

export interface AcademicTerm {
  id: string;
  calendarId: string;
  name: string;
  startDate: string;
  endDate: string;
  weightPercent: number; // For Term-based recognition weights (must sum up to 100%)
}

export interface AcademicPeriod {
  id: string;
  calendarId: string;
  name: string; // e.g. "Sep 2026", "Oct 2026"
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
}

export type RevenueRecognitionPolicyType = 'Immediate' | 'Cash Basis' | 'Deferred Revenue' | 'Straight Line' | 'Daily' | 'Academic Term' | 'Custom';

export interface RevenueRecognitionPolicy {
  id: string;
  schoolId: string;
  name: string;
  type: RevenueRecognitionPolicyType;
  description: string;
  isDefault: boolean;
}

export type RevenueRecognitionStatus = 'Draft' | 'Scheduled' | 'Recognized' | 'Cancelled' | 'Pending Adjustment';

export interface RevenueRecognitionSchedule {
  id: string;
  schoolId: string;
  invoiceId: string;
  studentId: string;
  feeTemplateId: string;
  academicYearId: string; // Matches AcademicCalendar.id
  academicPeriodId: string; // Matches AcademicPeriod.id
  recognitionDate: string;
  recognitionAmount: number;
  recognitionStatus: RevenueRecognitionStatus;
  journalEntryId?: string; // Links to PostingEngine General Ledger journal
  executionDate?: string;
  executionUser?: string;
  createdAt: string;
}

export interface RevenueRecognitionEntry {
  id: string;
  scheduleId: string;
  schoolId: string;
  debitAccount: string; // Unearned/Deferred Revenue account (Liability)
  creditAccount: string; // Earned Revenue account (Revenue)
  amount: string | number;
  postedDate: string;
  journalEntryId: string;
}

export interface RevenueRecognitionHistory {
  id: string;
  schoolId: string;
  scheduleId?: string;
  invoiceId?: string;
  action: 'Create Schedule' | 'Recognize' | 'Cancel Recognition' | 'Recalculate' | 'Policy Change' | 'Calendar Change' | 'Manual Adjustment';
  timestamp: string;
  userId: string;
  userName: string;
  details: string;
}

export interface RevenueRecognitionAdjustment {
  id: string;
  schoolId: string;
  invoiceId: string;
  type: 'Withdrawal' | 'Fee Adjustment' | 'Reschedule' | 'Refund' | 'Credit Note' | 'Scholarship' | 'Discount';
  oldTotal: number;
  newTotal: number;
  timestamp: string;
  userId: string;
  userName: string;
  reason: string;
}

export interface NumberingSequenceConfig {
  prefix: string;
  suffix: string;
  useAcademicYear: boolean;
  useStageId: boolean;
  paddedLength: number;
  lastSequenceNumber: number;
}

export interface StudentNumberingConfig {
  studentCode: NumberingSequenceConfig;
  academicId: NumberingSequenceConfig;
  fileNumber: NumberingSequenceConfig;
  registrationNumber: NumberingSequenceConfig;
}

export interface FinancialConfiguration {
  id: string;
  schoolId: string;
  updatedAt: string;
  updatedBy: string;

  // General Ledger Settings
  generalLedger: {
    allowDirectJournalEdits: boolean;
    requireDoubleEntry: boolean;
  };
  
  // Student Numbering Settings
  studentNumbering: StudentNumberingConfig;

  // Rounding Settings
  rounding: {
    precision: number; // e.g. 0, 2, 3, 4
    mode: 'HalfUp' | 'HalfEven' | 'Up' | 'Down' | 'Ceiling' | 'Floor';
    allocationPolicy: 'LastPeriodAdjustment' | 'FirstPeriodAdjustment' | 'LargestAmountAdjustment' | 'CustomAllocation';
  };

  // Currency Settings
  currency: {
    code: string; // e.g. "JOD", "USD", "SAR"
    precision: number;
    symbol: string;
    negativeFormat: 'brackets' | 'minus';
    thousandsSeparator: string;
    decimalSeparator: string;
  };

  // Revenue Recognition Settings & Policies
  revenueRecognition: {
    method: 'Immediate' | 'Cash Basis' | 'Deferred Revenue' | 'Straight Line' | 'Daily' | 'Academic Terms' | 'Custom';
    deferredRevenueAccount: string; // Deferred Revenue (liability) Account code/id
    earnedRevenueAccount: string; // Earned Revenue account code/id
    frequency: 'Monthly' | 'Weekly' | 'Daily' | 'Academic Terms' | 'Manual';
    startPolicy: 'Invoice Date' | 'Academic Start Date' | 'Payment Date' | 'Custom Date';
  };

  // Posting Policies
  posting: {
    requireApprovedWorkflow: boolean;
    autoPostInvoices: boolean;
  };

  // Fiscal Settings
  fiscal: {
    currentFiscalYearId?: string;
  };

  // Collections Settings (Phase 2.5.4)
  collections?: {
    allocationPolicy: string; // e.g. 'Oldest Due First', 'FIFO', 'Oldest Invoice First', etc.
    priority?: string[]; // e.g. ['Invoice', 'Installment', 'Receivable']
    tieBreaking?: 'DueDateAsc' | 'DueDateDesc' | 'InvoiceNumberAsc' | 'AmountDesc';
    tolerance?: number; // e.g. 0.05
    partialAllocationPolicy?: 'Allow' | 'Reject' | 'RollForward';
  };
}

export interface FinancialConfigurationAuditLog {
  id: string;
  schoolId: string;
  timestamp: string;
  userId: string;
  userName: string;
  oldValue: string; // JSON string
  newValue: string; // JSON string
  changeReason: string;
}

export interface CurrencyMaster {
  id: string; // UUID
  isoCode: string; // e.g. USD, SAR, JOD, LYD
  currencyCode: string; // same as isoCode
  currencyName: string;
  nativeName: string;
  currencySymbol: string;
  decimalPrecision: number;
  minorUnit: string; // e.g. cent, halala, fils, dirham
  symbolPosition: 'Left' | 'Right';
  thousandsSeparator: string;
  decimalSeparator: string;
  negativeNumberFormat: 'brackets' | 'minus';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyProfile {
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  isoCode: string;
  decimalPrecision: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  negativeNumberFormat: 'brackets' | 'minus';
  currencyPosition: 'Left' | 'Right';
}

export interface ExchangeRate {
  id: string;
  schoolId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string; // ISO date
  isManual: boolean;
  createdAt: string;
  createdBy: string;
}

// ==========================================
// ENTERPRISE ACCOUNTS RECEIVABLE DOMAIN MODELS
// ==========================================

export type ReceivableStatus = 
  | 'Draft'
  | 'Open'
  | 'Partially Collected'
  | 'Collected'
  | 'Past Due'
  | 'In Collection'
  | 'Payment Promise'
  | 'Disputed'
  | 'Written Off'
  | 'Closed'
  | 'Archived';

export interface ReceivableAccount {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  accountNumber: string;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  currency: string;
  status: ReceivableStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  
  // Reconciliation Readiness Fields
  reconciliationStatus?: 'reconciled' | 'unreconciled' | 'discrepancy';
  lastReconciledAt?: string;
  differenceAmount?: number;
  reconciliationReference?: string;
  differenceReason?: string;
  reconciledBy?: string;
  notes?: string;
}

export interface ReceivableTransaction {
  id: string;
  schoolId: string;
  receivableAccountId: string;
  invoiceId: string;
  type: 'debit' | 'credit' | 'adjustment' | 'write_off' | 'reversal' | 'refund' | 'scholarship' | 'discount' | 'settlement' | 'transfer';
  amount: number;
  balance: number;
  currency: string;
  description: string;
  transactionDate: string;
  dueDate: string;
  status: ReceivableStatus;
  version: number;
  createdAt: string;
  createdBy: string;
  
  // Running Balance / Audit Fields
  balanceBefore?: number;
  debit?: number;
  credit?: number;
  balanceAfter?: number;
}

export interface ReceivableBalance {
  id: string;
  schoolId: string;
  receivableAccountId: string;
  totalDebit: number;
  totalCredit: number;
  outstandingBalance: number;
  lastPaymentDate?: string;
  lastBillingDate?: string;
  asOfDate: string;
}

export interface ReceivableAllocation {
  id: string;
  schoolId: string;
  settlementId: string;
  receivableTransactionId: string;
  allocatedAmount: number;
  allocationDate: string;
  allocatedBy: string;
}

export interface ReceivableSettlement {
  id: string;
  schoolId: string;
  receivableAccountId: string;
  paymentId: string;
  amountSettled: number;
  settlementDate: string;
  method: string;
  referenceNo?: string;
}

export interface ReceivableAdjustment {
  id: string;
  schoolId: string;
  receivableAccountId: string;
  invoiceId?: string;
  receivableTransactionId?: string;
  type: 'write_off' | 'waiver' | 'settlement' | 'discount' | 'correction' | 'refund_offset';
  amount: number;
  reason: string;
  approvedBy: string;
  adjustmentDate: string;
  status: 'pending' | 'approved' | 'rejected';
  ledgerVoucherId?: string;
}

export interface ReceivableWriteOff {
  id: string;
  schoolId: string;
  receivableAccountId: string;
  amount: number;
  reason: string;
  approvedBy: string;
  writeOffDate: string;
  ledgerVoucherId: string;
}

export interface ReceivableStatusHistory {
  id: string;
  schoolId: string;
  receivableAccountId: string;
  fromStatus: ReceivableStatus;
  toStatus: ReceivableStatus;
  changedAt: string;
  changedBy: string;
  reason: string;
}

export interface ReceivableAudit {
  id: string;
  schoolId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'ReceivableAccount' | 'ReceivableTransaction' | 'ReceivableAdjustment' | 'CollectionCase' | string;
  entityId: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
}

export interface CollectionCase {
  id: string;
  schoolId: string;
  receivableAccountId: string;
  caseNumber: string;
  status: 'open' | 'active' | 'escalated' | 'resolved' | 'closed';
  assignedTo: string;
  openedDate: string;
  lastContactDate?: string;
  nextActionDate?: string;
  totalOverdueAmount: number;
  notes: string;
}

export interface CollectionPromise {
  id: string;
  schoolId: string;
  collectionCaseId: string;
  receivableAccountId: string;
  promiseAmount: number;
  promisedDate: string;
  status: 'pending' | 'kept' | 'broken' | 'cancelled';
  recordedDate: string;
  recordedBy: string;
}

export interface AgingBucket {
  bucketName: 'Current' | '1-30 Days' | '31-60 Days' | '61-90 Days' | '91-120 Days' | '120+ Days';
  minDays: number;
  maxDays: number;
  amount: number;
  count: number;
}

// ==========================================
// ENTERPRISE COLLECTIONS DOMAIN MODELS (Phase 2.5)
// ==========================================

export type CollectionStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Collected'
  | 'Partially Allocated'
  | 'Allocated'
  | 'Deposited'
  | 'Reconciled'
  | 'Cancelled'
  | 'Refunded'
  | 'Reversed'
  | 'Archived';

export type CollectionSourceType =
  | 'Invoice'
  | 'Installment'
  | 'Receivable'
  | 'Opening Balance'
  | 'Manual Adjustment';

export type CollectionPaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'Cheque'
  | 'POS'
  | 'Online Payment'
  | 'Wallet'
  | 'Scholarship Offset'
  | 'Credit Balance';

export interface CollectionReceipt {
  id: string;
  schoolId: string;
  receivableAccountId: string;
  sourceType: CollectionSourceType;
  sourceId?: string; // Reference to Invoice ID, Installment Schedule ID, etc.
  amount: number;
  paymentMethod: CollectionPaymentMethod;
  paymentMethodDetails?: string; // Reference details, cheque number, bank name
  status: CollectionStatus;
  currency: string;
  exchangeRate?: number;
  collectedAt: string;
  collectedBy: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
  version: number;
  createdAt: string;
  createdBy: string;
}

export interface CollectionAllocation {
  id: string;
  schoolId: string;
  collectionId: string;
  targetType: 'Invoice' | 'Installment' | 'Receivable';
  targetId: string; // e.g. invoiceId, installmentScheduleId, receivableAccountId
  amountAllocated: number;
  allocatedAt: string;
  allocatedBy: string;
  notes?: string;
}

// ==========================================
// ENTERPRISE TREASURY & PAYMENT PLATFORM MODELS (Phase 2.6)
// ==========================================

export type TreasuryAccountType = 'Main Chest' | 'Branch Chest' | 'Bank Account' | 'Virtual Chest';

export interface TreasuryAccount {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  type: TreasuryAccountType;
  glAccountId: string; // e.g., 'acc_111', 'acc_112', etc.
  currency: string;
  balance: number;
  isActive: boolean;
  allowNegativeBalance: boolean; // Policy toggle
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TreasuryTransactionStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Executing'
  | 'Executed'
  | 'Posted'
  | 'Reconciled'
  | 'Cancelled'
  | 'Reversed'
  | 'Archived';

export type TreasuryTransactionType = 
  | 'Deposit'      // Cash-in (e.g. from collection receipts)
  | 'Withdrawal'   // Cash-out (e.g. refunds or manual cash outs)
  | 'Transfer';    // Inter-account transfer

export type PaymentInstrumentType =
  | 'Cash'
  | 'Bank Transfer'
  | 'Cheque'
  | 'POS'
  | 'Online Payment'
  | 'Wallet'
  | 'Credit Balance'
  | 'Scholarship Offset'
  | 'Voucher'
  | 'Gift Card';

export interface PaymentInstrumentConfig {
  instrument: PaymentInstrumentType;
  isActive: boolean;
  notes?: string;
}

export interface TreasuryTransaction {
  id: string;
  schoolId: string;
  type: TreasuryTransactionType;
  status: TreasuryTransactionStatus;
  
  // Accounts involved
  sourceAccountId?: string;      // Used for transfers or withdrawals
  destinationAccountId?: string; // Used for transfers or deposits
  
  amount: number;
  currency: string;
  exchangeRate: number;
  
  paymentInstrument: PaymentInstrumentType;
  paymentInstrumentDetails?: string; // Cheque #, bank reference, wallet ID, voucher code
  
  referenceType?: string; // e.g. 'collection_receipt', 'refund', 'manual'
  referenceId?: string;   // e.g. collectionId
  
  description: string;
  transactionDate: string;
  
  preparedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  executedBy?: string;
  executedAt?: string;
  postedBy?: string;
  postedAt?: string;
  reconciledBy?: string;
  reconciledAt?: string;
  
  journalEntryId?: string; // Double entry reference
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TreasuryTransferRequest {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description: string;
  paymentInstrument: PaymentInstrumentType;
  paymentInstrumentDetails?: string;
}

export interface TreasuryTransferAuditContext {
  userId: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  timestamp: string;
}

export interface TreasuryTransfer {
  id: string;
  schoolId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  status: TreasuryTransactionStatus;
  paymentInstrument: PaymentInstrumentType;
  paymentInstrumentDetails?: string;
  description: string;
  transferDate: string;
  fiscalYearId?: string;
  
  // Auditing / Trail
  preparedBy: TreasuryTransferAuditContext;
  approvedBy?: TreasuryTransferAuditContext;
  executedBy?: TreasuryTransferAuditContext;
  postedBy?: TreasuryTransferAuditContext;
  reconciledBy?: TreasuryTransferAuditContext;
  cancelledBy?: TreasuryTransferAuditContext;
  reversedBy?: TreasuryTransferAuditContext;
  
  journalEntryId?: string;
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// ENTERPRISE MASTER DATA MANAGEMENT (MDM) PLATFORM
// ==========================================

export type MasterDataLifecycle = 'active' | 'archived' | 'deprecated';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'highly_confidential' | 'restricted' | 'sensitive';

export interface MasterDataRegistry {
  id: string; // MasterID
  globalId: string;
  tenantId: string;
  domain: string; // e.g., 'student', 'employee'
  businessKey: string;
  status: MasterDataLifecycle;
  approvalStatus: ApprovalStatus;
  version: number;
  data: any; // The actual master data
  createdAt: string;
  updatedAt: string;
  owner: string;
  dataSteward: string;
}

export interface DataQualityRule {
  id: string;
  schoolId: string;
  domain: string;
  ruleCode: string; // e.g., 'REQUIRED', 'MIN_AGE'
  ruleDefinition: string; // JSON or expression
  isActive: boolean;
}

export interface DataQualityMetric {
  id: string;
  schoolId: string;
  domain: string;
  masterId: string;
  completeness: number;
  accuracy: number;
  consistency: number;
  timestamp: string;
}


export interface DataDictionaryEntry {
  id: string;
  tableName: string;
  fieldName: string;
  description: string;
  dataType: string;
  isNullable: boolean;
  isMandatory: boolean;
  defaultValue?: string;
  owner: string;
}

// ==========================================
// ENTERPRISE LICENSING, SUBSCRIPTION & TENANT MANAGEMENT PLATFORM
// ==========================================

export type TenantStatus = 'active' | 'suspended' | 'expired' | 'archived';
export type SubscriptionStatus = 'trial' | 'pending' | 'active' | 'suspended' | 'expired' | 'renewed' | 'cancelled';
export type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'multi_year';

export interface Tenant {
  id: string;
  globalTenantCode: string;
  name: string;
  country: string;
  status: TenantStatus;
  planId: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  features: { featureId: string; enabled: boolean; limit?: number }[];
  price: number;
  billingCycle: BillingCycle;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
}

export interface UsageMetric {
  id: string;
  tenantId: string;
  featureId: string;
  usageCount: number;
  timestamp: string;
}




// ==========================================
// ENTERPRISE BACKUP, DISASTER RECOVERY & BUSINESS CONTINUITY PLATFORM
// ==========================================

export type BackupType = 'full' | 'incremental' | 'differential' | 'snapshot';
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'verified';

export interface BackupDefinition {
  id: string;
  schoolId: string;
  name: string;
  schedule: string; // Cron expression
  type: BackupType;
  retentionDays: number;
  storageTarget: string;
  isActive: boolean;
}

export interface BackupJob {
  id: string;
  definitionId: string;
  status: BackupStatus;
  startTime: string;
  endTime?: string;
  size: number;
  checksum: string;
  verified: boolean;
}

export interface RecoveryObjective {
  id: string;
  schoolId: string;
  module: string;
  rpoHours: number;
  rtoHours: number;
}

// ==========================================
// ENTERPRISE SECURITY PLATFORM
// ==========================================

export type SecurityStatus = 'active' | 'suspended' | 'expired';

export interface SecurityUser {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  passwordHash: string; // MUST BE HASHED
  status: SecurityStatus;
  
  // Audit fields (required by DATABASE_STANDARDS.md)
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
  isDeleted: boolean;
}

export interface SecurityRole {
  id: string;
  tenantId: string;
  name: string;
  description: string;

  // Audit fields
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
  isDeleted: boolean;
}

export interface SecurityPermission {
  id: string;
  module: string;
  action: string;
  
  // Audit fields
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
  isDeleted: boolean;
}

export interface SecuritySession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  
  // Audit fields
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
  isDeleted: boolean;
}

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'azure_openai' | 'bedrock';
export type AIModelStatus = 'active' | 'inactive' | 'deprecated';
export type PromptStatus = 'draft' | 'review' | 'approved' | 'deprecated';
export type AgentStatus = 'active' | 'inactive';

export interface AIModel {
  id: string;
  provider: AIProvider;
  name: string;
  version: string;
  capabilities: string[];
  status: AIModelStatus;
}

export interface PromptTemplate {
  id: string;
  schoolId: string;
  title: string;
  category: string;
  template: string; // Dynamic template with {var}
  status: PromptStatus;
  version: number;
}

export interface KnowledgeEntry {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  metadata: any;
  version: number;
}

export interface AIAgent {
  id: string;
  schoolId: string;
  name: string;
  description: string;
  status: AgentStatus;
}

export interface AIUsageLog {
  id: string;
  tenantId: string;
  userId: string;
  modelId: string;
  promptId?: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: string;
}

// ==========================================
// PROCUREMENT & PURCHASING MANAGEMENT TYPES
// ==========================================

export type PurchaseRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_to_po' | 'cancelled';
export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'issued' | 'partially_received' | 'fully_received' | 'closed' | 'cancelled';
export type GoodsReceiptStatus = 'inspected_received' | 'partially_accepted' | 'rejected' | 'posted_to_gl';
export type VendorBillStatus = 'draft' | 'pending_matching' | 'approved' | 'partially_paid' | 'paid' | 'voided';

export interface ProcurementItemLine {
  id: string;
  itemId?: string;
  itemCode: string;
  itemName: string;
  description?: string;
  unit: string;
  quantityRequested: number;
  quantityApproved?: number;
  quantityOrdered?: number;
  quantityReceived?: number;
  estimatedUnitPrice: number;
  actualUnitPrice?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  warehouseId?: string;
  costCenterId?: string;
}

export interface PurchaseRequest {
  id: string;
  schoolId: string;
  branchId?: string;
  requestNo: string;
  requestDate: string;
  requiredDate: string;
  requesterName: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  purpose: string;
  status: PurchaseRequestStatus;
  lines: ProcurementItemLine[];
  totalEstimatedAmount: number;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestForQuotation {
  id: string;
  schoolId: string;
  rfqNo: string;
  purchaseRequestId?: string;
  title: string;
  issueDate: string;
  deadlineDate: string;
  vendorIds: string[];
  items: ProcurementItemLine[];
  status: 'draft' | 'sent' | 'responses_received' | 'awarded' | 'closed';
  awardedVendorId?: string;
  notes?: string;
  createdAt: string;
}

export interface VendorQuotation {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  quotationNo: string;
  quotationDate: string;
  validUntil: string;
  deliveryDays: number;
  paymentTerms: string;
  lines: {
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  }[];
  grandTotal: number;
  status: 'received' | 'under_review' | 'accepted' | 'rejected';
  evaluationScore?: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  schoolId: string;
  branchId?: string;
  poNo: string;
  poDate: string;
  expectedDeliveryDate: string;
  purchaseRequestId?: string;
  vendorId: string;
  vendorName: string;
  vendorContact?: string;
  warehouseId: string;
  costCenterId?: string;
  paymentTerms: string;
  deliveryTerms: string;
  status: PurchaseOrderStatus;
  lines: ProcurementItemLine[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  approvedBy?: string;
  approvalDate?: string;
  issuedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptNote {
  id: string;
  schoolId: string;
  grnNo: string;
  grnDate: string;
  purchaseOrderId: string;
  poNo: string;
  vendorId: string;
  vendorName: string;
  deliveryNoteNo: string;
  warehouseId: string;
  inspectorName: string;
  inspectionResult: 'passed' | 'conditional_pass' | 'failed';
  status: GoodsReceiptStatus;
  lines: {
    lineId: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    rejectionReason?: string;
    unitCost: number;
    totalCost: number;
  }[];
  totalReceivedValue: number;
  glJournalEntryId?: string;
  isPostedToGL: boolean;
  notes?: string;
  createdAt: string;
}

export interface VendorBill {
  id: string;
  schoolId: string;
  billNo: string;
  vendorInvoiceNo: string;
  billDate: string;
  dueDate: string;
  vendorId: string;
  vendorName: string;
  purchaseOrderId?: string;
  grnId?: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  status: VendorBillStatus;
  glJournalEntryId?: string;
  notes?: string;
  createdAt: string;
}

export interface VendorPayment {
  id: string;
  schoolId: string;
  paymentNo: string;
  paymentDate: string;
  vendorId: string;
  vendorName: string;
  vendorBillId: string;
  billNo: string;
  amountPaid: number;
  paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'treasury_voucher';
  bankAccountId?: string;
  treasuryId?: string;
  referenceNo: string;
  notes?: string;
  glJournalEntryId?: string;
  createdAt: string;
}

// ==========================================
// ENTERPRISE FIXED ASSETS DOMAIN MODELS
// ==========================================

export interface AssetMaintenanceLog {
  id: string;
  type: 'دورية' | 'طارئة' | 'ترميم وتحسين';
  cost: number;
  supplier: string;
  date: string;
  nextDate?: string;
  statusAfter: string;
  workOrderNo?: string;
  spareParts?: string;
  notes: string;
  createdBy?: string;
}

export interface AssetTransferLog {
  id: string;
  date: string;
  fromDept: string;
  toDept: string;
  fromBranch: string;
  toBranch: string;
  fromResponsible: string;
  toResponsible: string;
  reason: string;
  approvedBy: string;
  notes: string;
}

export interface AssetDepreciationEntry {
  id: string;
  periodDate: string;
  fiscalYear: string;
  depreciationAmount: number;
  accumulatedDepreciationAfter: number;
  bookValueAfter: number;
  jvNumber: string;
  postedAt: string;
  postedBy: string;
  isRolledBack?: boolean;
}

export interface AssetTimelineEvent {
  id: string;
  timestamp: string;
  type: 'creation' | 'edit' | 'transfer' | 'maintenance' | 'depreciation' | 'revaluation' | 'improvement' | 'sale' | 'discard';
  title: string;
  description: string;
  user: string;
  badgeColor?: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  barcode: string;
  qrCodeUrl?: string;
  name: string;
  category: string;
  group: string;
  manufacturer: string;
  model: string;
  serialNo: string;
  purchaseDate: string;
  supplier: string;
  invoiceNo: string;
  cost: number;
  capitalExp: number;
  scrapValue: number;
  usefulLife: number;
  depRate: string;
  depMethod: 'قسط ثابت' | 'قسط متناقص' | 'وحدات الإنتاج';
  depStartDate: string;
  assetAccount: string;
  accDepAccount: string;
  depExpenseAccount: string;
  accDep: number;
  netValue: number;
  isDepPaused: boolean;
  status: 'نشط / قيد التشغيل' | 'تحت الصيانة' | 'معار / مستخدم' | 'مستبعد / كلي' | 'تم بيعه';
  department: string;
  branch: string;
  location: string;
  responsible: string;
  maintenanceLogs?: AssetMaintenanceLog[];
  transferLogs?: AssetTransferLog[];
  depreciationHistory?: AssetDepreciationEntry[];
  timeline?: AssetTimelineEvent[];
  attachments?: { id: string; name: string; url: string; uploadDate: string }[];
  createdAt: string;
  updatedAt: string;
}
