import { ParameterizedCommand, SQLCommandBuilder } from '../transactions/SQLCommand';
import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { AuditLog } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';

/**
 * Repository class handling CRUD and fetching operations for Audit Logs.
 * Fully conforms to the IBaseRepository<AuditLog> enterprise interface.
 */
export class AuditRepository implements IBaseRepository<AuditLog> {
  // Instance methods delegating to static methods for interface compliance

  /**
   * Retrieves an audit log by ID.
   */
  public async getById(schoolId: string, id: string): Promise<AuditLog | null> {
    return AuditRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all audit logs matching criteria.
   */
  public async getAll(schoolId: string, options?: any): Promise<AuditLog[]> {
    return AuditRepository.getAll(schoolId, options);
  }

  /**
   * Creates a new audit log.
   */
  public async create(schoolId: string, item: Partial<AuditLog>): Promise<AuditLog> {
    return AuditRepository.create(schoolId, item);
  }

  /**
   * Updates an existing audit log.
   */
  public async update(schoolId: string, id: string, item: Partial<AuditLog>): Promise<AuditLog> {
    return AuditRepository.update(schoolId, id, item);
  }

  /**
   * Deletes an audit log.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return AuditRepository.delete(schoolId, id);
  }

  /**
   * Checks if an audit log exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return AuditRepository.exists(schoolId, id);
  }

  /**
   * Counts audit logs matching the criteria.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return AuditRepository.count(schoolId, options);
  }

  // --- Static Methods ---

  /**
   * Helper to parse and reconstruct AuditLog fields from database payload safely.
   */
  public static reconstructLog(raw: any): AuditLog {
    if (!raw) return null as any;
    let detailsStr = raw.details || '';
    let extra: any = {};
    try {
      if (detailsStr.startsWith('{') && detailsStr.endsWith('}')) {
        const parsed = JSON.parse(detailsStr);
        extra = parsed;
        detailsStr = parsed.details || '';
      }
    } catch (e: any) {
      // Not JSON or parse failed, treat as regular details
    }

    return {
      id: raw.id,
      schoolId: raw.school_id || raw.schoolId,
      timestamp: raw.timestamp,
      userId: raw.user_id || raw.userId,
      userName: raw.user_name || raw.userName,
      userRole: raw.user_role || raw.userRole,
      action: raw.action,
      module: raw.module,
      ipAddress: raw.ip_address || raw.ipAddress || '',
      details: detailsStr,
      browser: raw.browser || extra.browser || '',
      device: raw.device || extra.device || '',
      sessionId: raw.sessionId || extra.sessionId || '',
      endpoint: raw.endpoint || extra.endpoint || '',
      httpMethod: raw.httpMethod || extra.httpMethod || '',
      affectedRecord: raw.affectedRecord || extra.affectedRecord || '',
      valuesBefore: raw.valuesBefore !== undefined ? raw.valuesBefore : extra.valuesBefore,
      valuesAfter: raw.valuesAfter !== undefined ? raw.valuesAfter : extra.valuesAfter,
      executionTime: raw.executionTime || extra.executionTime || 0,
      correlationId: raw.correlationId || extra.correlationId || '',
      result: raw.result || extra.result || 'success',
      severity: raw.severity || extra.severity || 'low'
    };
  }

  /**
   * Retrieves a single audit log by its unique identifier.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique audit log identifier.
   */
  public static async getById(schoolId: string, id: string): Promise<AuditLog | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('school_id', schoolId)
          .eq('id', id)
          .single();
        if (!error && data) return this.reconstructLog(data);
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch audit log by ID:", "AuditRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence(`audit read ${id}`);
    const log = FallbackStorage.getAuditLogs().find(l => l.schoolId === schoolId && l.id === id);
    return log || null;
  }

  /**
   * Retrieves all audit logs belonging to a school, with optional parameters.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Pagination and advanced filter options.
   */
  public static async getAll(
    schoolId: string,
    options?: { 
      userId?: string;
      module?: string; 
      action?: string; 
      severity?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<AuditLog[]> {
    const supabase = getSupabaseClient();
    const limit = options?.limit || 200;

    if (supabase) {
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .eq('school_id', schoolId);

        if (options?.module) {
          query = query.eq('module', options.module);
        }
        if (options?.action) {
          query = query.eq('action', options.action);
        }
        if (options?.userId) {
          query = query.eq('user_id', options.userId);
        }

        const { data, error } = await query
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (!error && data) {
          const formattedLogs = data.map(d => this.reconstructLog(d));
          
          let filtered = formattedLogs;
          if (options?.severity) {
            filtered = filtered.filter(l => l.severity === options.severity);
          }
          if (options?.startDate) {
            const start = new Date(options.startDate).getTime();
            filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= start);
          }
          if (options?.endDate) {
            const end = new Date(options.endDate).getTime();
            filtered = filtered.filter(l => new Date(l.timestamp).getTime() <= end);
          }
          return filtered;
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to query audit logs from Supabase:", "AuditRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`audit list read for ${schoolId}`);
    let logs = FallbackStorage.getAuditLogs().filter(log => log.schoolId === schoolId);
    if (options?.userId) {
      logs = logs.filter(log => log.userId === options.userId);
    }
    if (options?.module) {
      logs = logs.filter(log => log.module === options.module);
    }
    if (options?.action) {
      logs = logs.filter(log => log.action === options.action);
    }
    if (options?.severity) {
      logs = logs.filter(log => log.severity === options.severity);
    }
    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      logs = logs.filter(l => new Date(l.timestamp).getTime() >= start);
    }
    if (options?.endDate) {
      const end = new Date(options.endDate).getTime();
      logs = logs.filter(l => new Date(l.timestamp).getTime() <= end);
    }
    return logs.slice(0, limit);
  }

  /**
   * Logs a user action dynamically (helper).
   */
  public static async log(
    schoolId: string,
    userId: string,
    userName: string,
    userRole: string,
    action: string,
    moduleName: string,
    ipAddress: string,
    details: string,
    extended?: Partial<AuditLog>
  ): Promise<AuditLog> {
    return this.create(schoolId, {
      userId,
      userName,
      userRole: userRole as any,
      action,
      module: moduleName,
      ipAddress,
      details,
      ...extended
    });
  }

  /**
   * Directly creates and inserts a new audit log.
   * @param schoolId - School enterprise tenant ID.
   * @param item - Partial audit log data.
   */
  public static async create(schoolId: string, item: Partial<AuditLog>): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: item.id || `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId,
      timestamp: item.timestamp || new Date().toISOString(),
      userId: item.userId || '',
      userName: item.userName || '',
      userRole: item.userRole || 'SchoolAdmin',
      action: item.action || '',
      module: item.module || '',
      ipAddress: item.ipAddress || '',
      details: item.details || '',
      browser: item.browser || '',
      device: item.device || '',
      sessionId: item.sessionId || '',
      endpoint: item.endpoint || '',
      httpMethod: item.httpMethod || '',
      affectedRecord: item.affectedRecord || '',
      valuesBefore: item.valuesBefore,
      valuesAfter: item.valuesAfter,
      executionTime: item.executionTime || 0,
      correlationId: item.correlationId || '',
      result: item.result || 'success',
      severity: item.severity || 'low'
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const serializedDetails = JSON.stringify({
          details: newLog.details,
          browser: newLog.browser,
          device: newLog.device,
          sessionId: newLog.sessionId,
          endpoint: newLog.endpoint,
          httpMethod: newLog.httpMethod,
          affectedRecord: newLog.affectedRecord,
          valuesBefore: newLog.valuesBefore,
          valuesAfter: newLog.valuesAfter,
          executionTime: newLog.executionTime,
          correlationId: newLog.correlationId,
          result: newLog.result,
          severity: newLog.severity
        });

        const { data, error } = await supabase
          .from('audit_logs')
          .insert([{
            id: newLog.id,
            school_id: schoolId,
            timestamp: newLog.timestamp,
            user_id: newLog.userId,
            user_name: newLog.userName,
            user_role: newLog.userRole,
            action: newLog.action,
            module: newLog.module,
            ip_address: newLog.ipAddress,
            details: serializedDetails
          }])
          .select()
          .single();

        if (!error && data) return this.reconstructLog(data);
      } catch (err: any) {
        EnterpriseLogger.error("Failed to insert audit log into Supabase:", "AuditRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`audit create ${newLog.id}`);
    const all = FallbackStorage.getAuditLogs();
    all.unshift(newLog);
    FallbackStorage.saveAuditLogs(all);
    return newLog;
  }

  /**
   * Updates an existing audit log (audit logs are typically immutable, but required for the interface).
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique audit log ID.
   * @param item - Audit log updates.
   */
  public static async update(schoolId: string, id: string, item: Partial<AuditLog>): Promise<AuditLog> {
    throw new Error(`Append-only audit logs cannot be updated: ${schoolId}/${id}. Record a compensating audit event instead.`);
  }

  /**
   * Deletes an audit log by ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique audit log ID.
   */
  public static async delete(schoolId: string, id: string): Promise<boolean> {
    throw new Error(`Append-only audit logs cannot be deleted: ${schoolId}/${id}. Record a retention/legal-hold event instead.`);
  }

  /**
   * Verifies if an audit log exists.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique audit log ID.
   */
  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const log = await this.getById(schoolId, id);
    return log !== null;
  }

  /**
   * Counts the total number of logs.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Counting filter options.
   */
  public static async count(schoolId: string, options?: any): Promise<number> {
    const logs = await this.getAll(schoolId, options);
    return logs.length;
  }

  public static enlistCreateAuditLogParameterized(logId: string, schoolId: string, entry: any) {
    const serializedDetails = JSON.stringify({
      details: entry.details,
      valuesBefore: entry.valuesBefore,
      valuesAfter: entry.valuesAfter,
      reason: entry.reason,
      device: entry.device,
      severity: entry.severity || 'low',
      result: 'success'
    });
    
    const command = SQLCommandBuilder.create({
      sqlText: `INSERT INTO audit_logs (id, school_id, timestamp, user_id, user_name, user_role, action, module, ip_address, details) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9);`,
      parameters: [logId, schoolId, entry.userId, entry.userName, entry.userRole, entry.action, entry.module, entry.ipAddress, serializedDetails],
      parameterTypes: ['string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string'],
      executionContext: 'Create Audit Log'
    });
    
    UnitOfWork.enlistCreate('audit_logs', logId, entry, command);
  }
}
