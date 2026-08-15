/**
 * Enterprise Parameterized SQL Command Model
 */

export interface ParameterizedCommand {
  sqlText: string;
  parameters: any[];
  parameterTypes?: string[];
  executionContext?: string;
  correlationId?: string;
  transactionContext?: string;
  tenantContext?: string;
  auditContext?: string;
  failIfNoRows?: boolean;
}

export class SQLCommandBuilder {
  /**
   * Constructs a ParameterizedCommand to eliminate any raw SQL string interpolation.
   */
  public static create(params: {
    sqlText: string;
    parameters: any[];
    parameterTypes?: string[];
    executionContext?: string;
    correlationId?: string;
    transactionContext?: string;
    tenantContext?: string;
    auditContext?: string;
    failIfNoRows?: boolean;
  }): ParameterizedCommand {
    const correlationId = params.correlationId || `corr_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const tenantContext = params.tenantContext || 'TENANT_SYSTEM_DEFAULT';
    return {
      sqlText: params.sqlText,
      parameters: params.parameters,
      parameterTypes: params.parameterTypes || params.parameters.map(p => {
        if (p === null || p === undefined) return 'null';
        return typeof p;
      }),
      executionContext: params.executionContext || 'Enterprise SQL Service Layer',
      correlationId: correlationId,
      transactionContext: params.transactionContext || 'ACTIVE_TRANSACTION_SCOPE',
      tenantContext: tenantContext,
      auditContext: params.auditContext || `AUDIT_LOG_ENTRY_${correlationId}`
      ,failIfNoRows: params.failIfNoRows
    };
  }

  /**
   * Formats the SQL query for display by replacing placeholders $1, $2, etc.,
   * with safely quoted and escaped string values.
   * Note: This is exclusively used for secure transaction tracing and visual rendering in the audit log interface.
   */
  public static formatForTrace(command: ParameterizedCommand): string {
    let formatted = command.sqlText;
    
    // Sort parameters in descending order of index (e.g. $10, $9, $8... $1)
    // so we don't accidentally replace part of a multi-digit placeholder (like replacing $1 inside $10)
    const indexedParams = command.parameters.map((p, i) => ({ val: p, idx: i + 1 }));
    indexedParams.sort((a, b) => b.idx - a.idx);

    for (const item of indexedParams) {
      const placeholder = `$${item.idx}`;
      let safeVal = '';
      if (item.val === null || item.val === undefined) {
        safeVal = 'NULL';
      } else if (typeof item.val === 'string') {
        safeVal = `'${item.val.replace(/'/g, "''")}'`;
      } else {
        safeVal = String(item.val);
      }
      formatted = formatted.replace(new RegExp('\\$' + item.idx + '\\b', 'g'), safeVal);
    }

    return formatted;
  }
}
