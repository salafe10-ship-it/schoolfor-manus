export interface HREmployee {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  gender: 'male' | 'female';
  profileImage?: string;
  
  // Job Info
  departmentId: string;
  jobId: string;
  hiringDate: string;
  costCenter: 'kindergarten' | 'primary' | 'middle' | 'secondary' | 'admin';
  status: 'active' | 'on_leave' | 'resigned' | 'suspended';
  
  // Qualifications
  degree: string;
  major: string;
  experienceYears: number;
  trainingCourses: string[];
  
  // Financial & Bank
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  bankName: string;
  iban: string;
  
  // Metadata
  attachments: { name: string; type: string; date: string; size: string }[];
  auditLogs: { action: string; date: string; user: string; details: string }[];
}

export interface HRDepartment {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  managerId: string;
  costCenter: 'kindergarten' | 'primary' | 'middle' | 'secondary' | 'admin';
}

export interface HRJob {
  id: string;
  titleAr: string;
  titleEn: string;
  departmentId: string;
  grade: string;
  baseSalary: number;
}

export interface HRContract {
  id: string;
  employeeId: string;
  type: 'fixed' | 'permanent' | 'seasonal';
  startDate: string;
  endDate: string;
  monthlySalary: number;
  status: 'active' | 'expired' | 'terminated';
}

export interface HRAttendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkIn?: string;
  checkOut?: string;
  delayMinutes: number;
  overtimeHours: number;
}

export interface HRLeave {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'emergency' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  attachment?: string;
}

export interface HRPenalty {
  id: string;
  employeeId: string;
  type: 'deduction' | 'warning' | 'suspension';
  date: string;
  amount: number; // deducted amount or days
  reason: string;
  status: 'applied' | 'waived';
}

export interface HRAdvance {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  installments: number;
  deductionPerMonth: number;
  remainingAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'fully_paid';
}

export interface HRBonus {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  reason: string;
  status: 'applied' | 'paid';
}

export interface HRPerformance {
  id: string;
  employeeId: string;
  date: string;
  score: number; // 0 to 100
  reviewer: string;
  strengths: string;
  improvements: string;
  trainingNeeds: string;
}

export interface HRDocument {
  id: string;
  employeeId: string;
  title: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expired' | 'warning';
}

export interface HRSettings {
  workingHoursStart: string;
  workingHoursEnd: string;
  weekends: number[]; // [5, 6] for Friday/Saturday
  lateDeductionRate: number; // e.g., 0.5 means half hour salary per hour delay
  defaultBankSafeAccount: string; // "1101" or "1102"
  defaultSalariesExpenseAccount: string; // "5101"
}
