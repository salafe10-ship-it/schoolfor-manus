import { EnterpriseLogger, LogSeverity } from '../../../database/services/EnterpriseLogger';
import { IdempotencyGuard } from '../../../utils/IdempotencyGuard';

export interface FormLifecycleConfig<TFormData, TDomainData, TResult> {
  formId: string;
  
  // Stage 1: Initialize Form
  initializeForm: () => Promise<TFormData> | TFormData;
  
  // Stage 2: Load Reference Data
  loadReferenceData: () => Promise<any> | any;
  
  // Stage 3: Bind Data
  bindData: (formData: TFormData, refData: any) => Promise<TDomainData> | TDomainData;
  
  // Stage 4: Validation
  validate: (formData: TFormData) => void | Promise<void>;
  
  // Stage 5: Business Rules
  applyBusinessRules: (domainData: TDomainData, refData: any) => void | Promise<void>;
  
  // Stage 6: Save Transaction
  saveTransaction: (domainData: TDomainData) => Promise<TResult>;
  
  // Stage 7: Commit
  commit: (result: TResult) => void | Promise<void>;
  
  // Stage 8: Refresh Data
  refreshData: () => void | Promise<void>;
  
  // Stage 9: Audit Log
  auditLog: (domainData: TDomainData, result: TResult) => void | Promise<void>;
  
  // Stage 10: User Notification
  notifyUser: (success: boolean, message: string) => void;
}

export class FormLifecycleOrchestrator {
  /**
   * Run the standard ERP form lifecycle workflow in strict sequential phases
   */
  public static async run<TFormData, TDomainData, TResult>(
    config: FormLifecycleConfig<TFormData, TDomainData, TResult>
  ): Promise<boolean> {
    const { formId } = config;
    
    // Acquire a non-blocking request lock for this formId to enforce idempotency
    if (!IdempotencyGuard.acquire(formId)) {
      const inProgressMsg = `العملية قيد التنفيذ حالياً... يرجى الانتظار وعدم تكرار النقر لمنع تكرار السجلات والبيانات (معرّف النموذج: ${formId})`;
      EnterpriseLogger.warn(
        `[Idempotency Block] Blocked duplicate execution for Form ID: ${formId}. Request is already in progress.`,
        'FormLifecycleOrchestrator',
        { formId }
      );
      config.notifyUser(false, inProgressMsg);
      return false;
    }
    
    EnterpriseLogger.info(
      `[ERP Form Lifecycle Orchestrator] Starting lifecycle execution for Form ID: ${formId}`,
      'FormLifecycleOrchestrator',
      { formId }
    );

    let formData: TFormData;
    let refData: any;
    let domainData: TDomainData;
    let txResult: TResult;

    try {
      // Simulate slight network transmission delay (1.2 seconds) to guarantee the "isSaving/in-progress" states and lock behavior are fully visible and active
      await new Promise(resolve => setTimeout(resolve, 1200));

      // 1. Initialize Form
      EnterpriseLogger.info(`[Phase 1/10 - Initialize Form] Initializing form parameters for ${formId}`, 'FormLifecycleOrchestrator');
      formData = await config.initializeForm();

      // 2. Load Reference Data
      EnterpriseLogger.info(`[Phase 2/10 - Load Reference Data] Loading reference registries for ${formId}`, 'FormLifecycleOrchestrator');
      refData = await config.loadReferenceData();

      // 3. Bind Data
      EnterpriseLogger.info(`[Phase 3/10 - Bind Data] Binding UI parameters to domain data entity for ${formId}`, 'FormLifecycleOrchestrator');
      domainData = await config.bindData(formData, refData);

      // 4. Validation
      EnterpriseLogger.info(`[Phase 4/10 - Validation] Verifying core field validations for ${formId}`, 'FormLifecycleOrchestrator');
      await config.validate(formData);

      // 5. Business Rules
      EnterpriseLogger.info(`[Phase 5/10 - Business Rules] Executing Enterprise Business Rules checks for ${formId}`, 'FormLifecycleOrchestrator');
      await config.applyBusinessRules(domainData, refData);

      // 6. Save Transaction
      EnterpriseLogger.info(`[Phase 6/10 - Save Transaction] Executing database transaction routines for ${formId}`, 'FormLifecycleOrchestrator');
      txResult = await config.saveTransaction(domainData);

      // 7. Commit
      EnterpriseLogger.info(`[Phase 7/10 - Commit] Committing state updates within application context for ${formId}`, 'FormLifecycleOrchestrator');
      await config.commit(txResult);

      // 8. Refresh Data
      EnterpriseLogger.info(`[Phase 8/10 - Refresh Data] Refreshing data, views and counts for ${formId}`, 'FormLifecycleOrchestrator');
      await config.refreshData();

      // 9. Audit Log
      EnterpriseLogger.info(`[Phase 9/10 - Audit Log] Registering official ledger auditing entry for ${formId}`, 'FormLifecycleOrchestrator');
      await config.auditLog(domainData, txResult);

      // 10. User Notification
      EnterpriseLogger.info(`[Phase 10/10 - User Notification] Dispatching success notification for ${formId}`, 'FormLifecycleOrchestrator');
      config.notifyUser(true, `تمت المعاملة بنجاح واستيفاء دورة حياة ${formId}`);

      return true;
    } catch (error: any) {
      EnterpriseLogger.error(
        `[ERP Form Lifecycle Orchestrator] Execution failed during lifecycle for Form ID: ${formId}`,
        'FormLifecycleOrchestrator',
        { error, formId }
      );

      let cleanMessage = error.message || String(error);
      if (cleanMessage.includes('VALIDATION_ERROR: ')) {
        cleanMessage = cleanMessage.replace('VALIDATION_ERROR: ', '');
      } else if (cleanMessage.includes('BUSINESS_RULE_ERROR: ')) {
        cleanMessage = cleanMessage.replace('BUSINESS_RULE_ERROR: ', '');
      }

      config.notifyUser(false, cleanMessage);
      return false;
    } finally {
      // Always release the idempotency lock upon completion (success or failure)
      IdempotencyGuard.release(formId);
    }
  }
}
