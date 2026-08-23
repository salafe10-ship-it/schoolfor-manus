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
  private static assertAuthoritativePersistence(operation: string): void {
    FallbackStorage.assertCanonicalPersistence(`revenue recognition ${operation}`);
  }
  // --- ACADEMIC CALENDAR ---
  public static async getCalendars(schoolId: string): Promise<AcademicCalendar[]> {
    this.assertAuthoritativePersistence('calendar read');
    const list = FallbackStorage.getAcademicCalendars();
    return list.filter(c => c.schoolId === schoolId);
  }

  public static async getActiveCalendar(schoolId: string): Promise<AcademicCalendar | undefined> {
    const list = await this.getCalendars(schoolId);
    return list.find(c => c.isActive);
  }

  public static async saveCalendar(calendar: AcademicCalendar): Promise<void> {
    this.assertAuthoritativePersistence('calendar write');
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
    this.assertAuthoritativePersistence('terms read');
    const list = FallbackStorage.getAcademicTerms();
    return list.filter(t => t.calendarId === calendarId);
  }

  public static async saveTerm(term: AcademicTerm): Promise<void> {
    this.assertAuthoritativePersistence('term write');
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
    this.assertAuthoritativePersistence('periods read');
    const list = FallbackStorage.getAcademicPeriods();
    return list.filter(p => p.calendarId === calendarId);
  }

  public static async getPeriod(periodId: string): Promise<AcademicPeriod | undefined> {
    this.assertAuthoritativePersistence('period read');
    const list = FallbackStorage.getAcademicPeriods();
    return list.find(p => p.id === periodId);
  }

  public static async savePeriod(period: AcademicPeriod): Promise<void> {
    this.assertAuthoritativePersistence('period write');
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
    this.assertAuthoritativePersistence('policy read');
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
    this.assertAuthoritativePersistence('policy write');
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
    this.assertAuthoritativePersistence('schedules read');
    const list = FallbackStorage.getRecognitionSchedules();
    return list.filter(s => s.schoolId === schoolId);
  }

  public static async getSchedulesByInvoice(invoiceId: string): Promise<RevenueRecognitionSchedule[]> {
    this.assertAuthoritativePersistence('invoice schedules read');
    const list = FallbackStorage.getRecognitionSchedules();
    return list.filter(s => s.invoiceId === invoiceId);
  }

  public static async saveSchedules(schedules: RevenueRecognitionSchedule[]): Promise<void> {
    this.assertAuthoritativePersistence('schedules write');
    const list = FallbackStorage.getRecognitionSchedules();
    const ids = new Set(schedules.map(s => s.id));
    
    // Remove old ones matching the ids to overwrite
    const filtered = list.filter(s => !ids.has(s.id));
    filtered.push(...schedules);
    FallbackStorage.saveRecognitionSchedules(filtered);
  }

  public static async deleteSchedulesByInvoice(invoiceId: string): Promise<void> {
    this.assertAuthoritativePersistence('schedules delete');
    const list = FallbackStorage.getRecognitionSchedules();
    const filtered = list.filter(s => s.invoiceId !== invoiceId);
    FallbackStorage.saveRecognitionSchedules(filtered);
  }

  // --- RECOGNITION ENTRIES ---
  public static async getEntries(schoolId: string): Promise<RevenueRecognitionEntry[]> {
    this.assertAuthoritativePersistence('entries read');
    const list = FallbackStorage.getRecognitionEntries();
    return list.filter(e => e.schoolId === schoolId);
  }

  public static async saveEntry(entry: RevenueRecognitionEntry): Promise<void> {
    this.assertAuthoritativePersistence('entry write');
    const list = FallbackStorage.getRecognitionEntries();
    list.push(entry);
    FallbackStorage.saveRecognitionEntries(list);
  }

  // --- AUDIT LOGS / HISTORIES ---
  public static async getHistories(schoolId: string): Promise<RevenueRecognitionHistory[]> {
    this.assertAuthoritativePersistence('history read');
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
    this.assertAuthoritativePersistence('history write');
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
    this.assertAuthoritativePersistence('adjustments read');
    const list = FallbackStorage.getRecognitionAdjustments();
    return list.filter(a => a.schoolId === schoolId);
  }

  public static async saveAdjustment(adj: RevenueRecognitionAdjustment): Promise<void> {
    this.assertAuthoritativePersistence('adjustment write');
    const list = FallbackStorage.getRecognitionAdjustments();
    list.push(adj);
    FallbackStorage.saveRecognitionAdjustments(list);
  }
}
