import { FallbackStorage } from './FallbackStorage';
import { 
  AcademicCalendar, 
  AcademicTerm, 
  AcademicPeriod, 
  RevenueRecognitionPolicy, 
  RevenueRecognitionSchedule, 
  RevenueRecognitionEntry, 
  RevenueRecognitionHistory, 
  RevenueRecognitionAdjustment,
  RevenueRecognitionPolicyType
} from '../../types';

export class RevenueRecognitionRepository {
  // --- ACADEMIC CALENDAR ---
  public static async getCalendars(schoolId: string): Promise<AcademicCalendar[]> {
    const list = FallbackStorage.getAcademicCalendars();
    return list.filter(c => c.schoolId === schoolId);
  }

  public static async getActiveCalendar(schoolId: string): Promise<AcademicCalendar | undefined> {
    const list = await this.getCalendars(schoolId);
    return list.find(c => c.isActive);
  }

  public static async saveCalendar(calendar: AcademicCalendar): Promise<void> {
    const list = FallbackStorage.getAcademicCalendars();
    const idx = list.findIndex(c => c.id === calendar.id);
    if (idx >= 0) {
      list[idx] = calendar;
    } else {
      list.push(calendar);
    }
    FallbackStorage.saveAcademicCalendars(list);
  }

  // --- ACADEMIC TERMS ---
  public static async getTerms(calendarId: string): Promise<AcademicTerm[]> {
    const list = FallbackStorage.getAcademicTerms();
    return list.filter(t => t.calendarId === calendarId);
  }

  public static async saveTerm(term: AcademicTerm): Promise<void> {
    const list = FallbackStorage.getAcademicTerms();
    const idx = list.findIndex(t => t.id === term.id);
    if (idx >= 0) {
      list[idx] = term;
    } else {
      list.push(term);
    }
    FallbackStorage.saveAcademicTerms(list);
  }

  // --- ACADEMIC PERIODS ---
  public static async getPeriods(calendarId: string): Promise<AcademicPeriod[]> {
    const list = FallbackStorage.getAcademicPeriods();
    return list.filter(p => p.calendarId === calendarId);
  }

  public static async getPeriod(periodId: string): Promise<AcademicPeriod | undefined> {
    const list = FallbackStorage.getAcademicPeriods();
    return list.find(p => p.id === periodId);
  }

  public static async savePeriod(period: AcademicPeriod): Promise<void> {
    const list = FallbackStorage.getAcademicPeriods();
    const idx = list.findIndex(p => p.id === period.id);
    if (idx >= 0) {
      list[idx] = period;
    } else {
      list.push(period);
    }
    FallbackStorage.saveAcademicPeriods(list);
  }

  // --- POLICIES ---
  public static async getPolicies(schoolId: string): Promise<RevenueRecognitionPolicy[]> {
    const list = FallbackStorage.getRecognitionPolicies();
    return list.filter(p => p.schoolId === schoolId);
  }

  public static async getActivePolicy(schoolId: string): Promise<RevenueRecognitionPolicy> {
    const list = await this.getPolicies(schoolId);
    const active = list.find(p => p.isDefault);
    if (active) return active;
    
    // Return a default if none configured
    return {
      id: 'pol_def',
      schoolId,
      name: 'الإيرادات المؤجلة (IFRS 15)',
      type: 'Deferred Revenue',
      description: 'تأجيل الاعتراف بالإيرادات حتى تقديم الخدمة فعلياً طبقاً للمعيار الدولي IFRS 15',
      isDefault: true
    };
  }

  public static async updateDefaultPolicy(schoolId: string, policyId: string): Promise<void> {
    const list = FallbackStorage.getRecognitionPolicies();
    const updated = list.map(p => {
      if (p.schoolId === schoolId) {
        return { ...p, isDefault: p.id === policyId };
      }
      return p;
    });
    FallbackStorage.saveRecognitionPolicies(updated);
  }

  // --- RECOGNITION SCHEDULES ---
  public static async getSchedules(schoolId: string): Promise<RevenueRecognitionSchedule[]> {
    const list = FallbackStorage.getRecognitionSchedules();
    return list.filter(s => s.schoolId === schoolId);
  }

  public static async getSchedulesByInvoice(invoiceId: string): Promise<RevenueRecognitionSchedule[]> {
    const list = FallbackStorage.getRecognitionSchedules();
    return list.filter(s => s.invoiceId === invoiceId);
  }

  public static async saveSchedules(schedules: RevenueRecognitionSchedule[]): Promise<void> {
    const list = FallbackStorage.getRecognitionSchedules();
    const ids = new Set(schedules.map(s => s.id));
    
    // Remove old ones matching the ids to overwrite
    const filtered = list.filter(s => !ids.has(s.id));
    filtered.push(...schedules);
    FallbackStorage.saveRecognitionSchedules(filtered);
  }

  public static async deleteSchedulesByInvoice(invoiceId: string): Promise<void> {
    const list = FallbackStorage.getRecognitionSchedules();
    const filtered = list.filter(s => s.invoiceId !== invoiceId);
    FallbackStorage.saveRecognitionSchedules(filtered);
  }

  // --- RECOGNITION ENTRIES ---
  public static async getEntries(schoolId: string): Promise<RevenueRecognitionEntry[]> {
    const list = FallbackStorage.getRecognitionEntries();
    return list.filter(e => e.schoolId === schoolId);
  }

  public static async saveEntry(entry: RevenueRecognitionEntry): Promise<void> {
    const list = FallbackStorage.getRecognitionEntries();
    list.push(entry);
    FallbackStorage.saveRecognitionEntries(list);
  }

  // --- AUDIT LOGS / HISTORIES ---
  public static async getHistories(schoolId: string): Promise<RevenueRecognitionHistory[]> {
    const list = FallbackStorage.getRecognitionHistories();
    return list.filter(h => h.schoolId === schoolId);
  }

  public static async logEvent(
    schoolId: string,
    action: RevenueRecognitionHistory['action'],
    userId: string,
    userName: string,
    details: string,
    invoiceId?: string,
    scheduleId?: string
  ): Promise<void> {
    const list = FallbackStorage.getRecognitionHistories();
    const event: RevenueRecognitionHistory = {
      id: `rev_hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      schoolId,
      action,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      details,
      invoiceId,
      scheduleId
    };
    list.push(event);
    FallbackStorage.saveRecognitionHistories(list);
  }

  // --- RECOGNITION ADJUSTMENTS ---
  public static async getAdjustments(schoolId: string): Promise<RevenueRecognitionAdjustment[]> {
    const list = FallbackStorage.getRecognitionAdjustments();
    return list.filter(a => a.schoolId === schoolId);
  }

  public static async saveAdjustment(adj: RevenueRecognitionAdjustment): Promise<void> {
    const list = FallbackStorage.getRecognitionAdjustments();
    list.push(adj);
    FallbackStorage.saveRecognitionAdjustments(list);
  }
}
