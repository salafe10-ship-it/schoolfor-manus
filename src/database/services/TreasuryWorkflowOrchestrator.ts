import { UnitOfWork } from '../UnitOfWork';
import { CollectionsEngine, CollectionInput } from './CollectionsEngine';
import { TreasuryTransferService } from './TreasuryTransferService';
import { PaymentInstrumentService } from './PaymentInstrumentService';
import { PostingEngine } from './PostingEngine';
import { AuditRepository } from '../repositories/AuditRepository';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { CollectionsRepository } from '../repositories/CollectionsRepository';
import { TreasuryRepository } from '../repositories/TreasuryRepository';
import { TreasuryTransferRepository } from '../repositories/TreasuryTransferRepository';
import { EnterpriseLogger } from './EnterpriseLogger';

import {
  CollectionReceipt,
  TreasuryTransaction,
  TreasuryTransfer,
  PaymentInstrumentType,
  FinancialConfiguration
} from '../../types';

// =========================================================================
// 1. WORKFLOW TRACEABILITY CONTEXT
// =========================================================================
/**
 * WorkflowTraceabilityContext
 * Ensures full traceability across the entire money movement lifecycle.
 * Every step of the workflow populates or references this context.
 */
export interface WorkflowTraceabilityContext {
  workflowId: string;         // Unique orchestrator workflow execution ID
  correlationId: string;      // Co-relating ID across separate modules
  businessReference: string;  // ID of the collection receipt, invoice, etc.
  financialReference: string; // ID of the treasury transaction or transfer
  postingReference: string;   // ID of the journal entry / general ledger entry
  auditReference: string;     // ID of the generated audit trail record
}

// =========================================================================
// 2. ENTERPRISE EVENT MODEL (DOMAIN EVENTS)
// =========================================================================
/**
 * Domain event definitions for treasury & money movement.
 * Built to be completely extensible without altering the core design.
 */
export interface IDomainEvent {
  eventId: string;
  eventName: string;
  occurredAt: string;
  schoolId: string;
  payload: any;
  traceability: WorkflowTraceabilityContext;
}

export interface CollectionRecordedEvent extends IDomainEvent {
  eventName: 'CollectionRecorded';
  payload: {
    receiptId: string;
    amount: number;
    currency: string;
  };
}

export interface TreasuryTransferExecutedEvent extends IDomainEvent {
  eventName: 'TreasuryTransferExecuted';
  payload: {
    transferId: string;
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
  };
}

export interface ReceiptPostedEvent extends IDomainEvent {
  eventName: 'ReceiptPosted';
  payload: {
    receiptId: string;
    journalEntryId: string;
    totalDebit: number;
    totalCredit: number;
  };
}

export interface RefundCompletedEvent extends IDomainEvent {
  eventName: 'RefundCompleted';
  payload: {
    refundId: string;
    amount: number;
  };
}

export interface ReconciliationCompletedEvent extends IDomainEvent {
  eventName: 'ReconciliationCompleted';
  payload: {
    accountId: string;
    statementDate: string;
    reconciledAmount: number;
  };
}

// Extensible Local Event Publisher Hook
export class TreasuryDomainEventPublisher {
  private static handlers: Array<(event: IDomainEvent) => void | Promise<void>> = [];

  public static subscribe(handler: (event: IDomainEvent) => void | Promise<void>): void {
    this.handlers.push(handler);
  }

  public static async publish(event: IDomainEvent): Promise<void> {
    // Structural Logging of Published Event for Observability
    TreasuryObservability.log('INFO', `[EVENT_PUBLISHED] [${event.eventName}] event triggered for school ${event.schoolId}.`, {
      eventId: event.eventId,
      workflowId: event.traceability.workflowId,
      correlationId: event.traceability.correlationId
    });

    for (const handler of this.handlers) {
      try {
        await handler(event);
      } catch (err) {
        TreasuryObservability.log('ERROR', `Error executing handler for event [${event.eventName}]: ${(err as Error).message}`);
      }
    }
  }
}

// =========================================================================
// 3. OBSERVABILITY READINESS (LOGS, METRICS, TRACING)
// =========================================================================
export interface StructuredLog {
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
  message: string;
  context?: any;
}

export class TreasuryObservability {
  private static metrics: Record<string, number> = {};

  /**
   * Enterprise Structured Logging
   */
  public static log(severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL', message: string, context?: any): void {
    const structured: StructuredLog = {
      timestamp: new Date().toISOString(),
      severity,
      message,
      context
    };
    // Emit formatted JSON logs to container console via EnterpriseLogger
    if (severity === 'INFO') {
      EnterpriseLogger.info(message, 'TreasuryWorkflow', structured);
    } else if (severity === 'WARNING') {
      EnterpriseLogger.warn(message, 'TreasuryWorkflow', structured);
    } else {
      EnterpriseLogger.error(message, 'TreasuryWorkflow', { error: message, ...structured });
    }
  }

  /**
   * Enterprise Metrics Tracker
   */
  public static incrementCounter(metricName: string, value: number = 1): void {
    if (!this.metrics[metricName]) {
      this.metrics[metricName] = 0;
    }
    this.metrics[metricName] += value;
    this.log('INFO', `[METRIC_INCREMENTED] Counter [${metricName}] updated to ${this.metrics[metricName]}.`);
  }

  public static recordValue(metricName: string, value: number): void {
    this.log('INFO', `[METRIC_RECORDED] [${metricName}] set to ${value}.`);
  }

  /**
   * Health Monitoring Checks
   */
  public static checkHealth(): { status: 'healthy' | 'degraded'; timestamp: string; details: any } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      details: {
        activeContexts: Object.keys(this.metrics).length,
        version: '1.0.0-certified'
      }
    };
  }
}

// =========================================================================
// 4. MAIN ORCHESTRATOR
// =========================================================================
export class TreasuryWorkflowOrchestrator {

  /**
   * ORCHESTRATION WORKFLOW 1: Receipt Recording, Approval, Deposit and Allocation
   * Coordinates the full money movement path: Business Event -> Collections -> Treasury -> Posting -> General Ledger
   */
  public static async orchestrateReceiptWorkflow(
    schoolId: string,
    input: CollectionInput,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<{
    receipt: CollectionReceipt;
    treasuryTransaction: TreasuryTransaction;
    traceability: WorkflowTraceabilityContext;
  }> {
    
    // Generate Traceability IDs
    const workflowId = `wf_rcpt_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const correlationId = `corr_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    TreasuryObservability.log('INFO', `Starting orchestrated receipt workflow [${workflowId}] for school [${schoolId}].`, {
      workflowId,
      correlationId,
      paymentMethod: input.paymentMethod,
      amount: input.amount
    });

    TreasuryObservability.incrementCounter('receipt_workflow_started');

    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'ORCHESTRATE_RECEIPT_WORKFLOW',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['collection_receipts', 'treasury_transactions', 'treasury_accounts', 'journal_entries', 'general_ledger', 'audit_logs']
    }, async () => {

      // 1. Fetch Financial Configuration to confirm policies
      const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
      
      // 2. Validate Payment Instrument using PaymentInstrumentService
      await PaymentInstrumentService.validateInstrumentAvailability(input.paymentMethod as any);

      // Step A: Record Receipt via CollectionsEngine
      const receipt = await CollectionsEngine.recordReceipt(schoolId, input, operator);

      // Publish Domain Event
      const recordEvent: CollectionRecordedEvent = {
        eventId: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        eventName: 'CollectionRecorded',
        occurredAt: new Date().toISOString(),
        schoolId,
        traceability: {
          workflowId,
          correlationId,
          businessReference: receipt.id,
          financialReference: '',
          postingReference: '',
          auditReference: ''
        },
        payload: {
          receiptId: receipt.id,
          amount: receipt.amount,
          currency: receipt.currency
        }
      };
      await TreasuryDomainEventPublisher.publish(recordEvent);

      // Step B: Approve and post via CollectionsEngine (Automatically invokes TreasuryEngine and PostingEngine)
      const approvedReceipt = await CollectionsEngine.approveReceipt(schoolId, receipt.id, operator);

      // Fetch the generated treasury transaction to establish references
      const txs = await TreasuryRepository.getAllTransactions(schoolId, { type: 'Deposit' });
      const relatedTx = txs.find(t => t.referenceType === 'collection_receipt' && t.referenceId === receipt.id);
      if (!relatedTx) {
        throw new Error('فشل التنسيق: لم يتم العثور على حركة الخزينة المرتبطة بسند التحصيل.');
      }

      // Step C: Allocate receipt funds to invoices/installments
      const finalReceipt = await CollectionsEngine.collectAndAllocateReceipt(schoolId, receipt.id, operator);

      // Establish final traceability references
      const finalAuditLogs = await AuditRepository.getAll(schoolId, { userId: operator.userId });
      const recentAudit = finalAuditLogs[0];

      const traceability: WorkflowTraceabilityContext = {
        workflowId,
        correlationId,
        businessReference: finalReceipt.id,
        financialReference: relatedTx.id,
        postingReference: relatedTx.journalEntryId || '',
        auditReference: recentAudit ? recentAudit.id : ''
      };

      // Publish posted event
      const postedEvent: ReceiptPostedEvent = {
        eventId: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        eventName: 'ReceiptPosted',
        occurredAt: new Date().toISOString(),
        schoolId,
        traceability,
        payload: {
          receiptId: finalReceipt.id,
          journalEntryId: relatedTx.journalEntryId || '',
          totalDebit: finalReceipt.amount,
          totalCredit: finalReceipt.amount
        }
      };
      await TreasuryDomainEventPublisher.publish(postedEvent);

      TreasuryObservability.log('INFO', `Successfully completed receipt orchestration workflow [${workflowId}].`, {
        traceability
      });

      TreasuryObservability.incrementCounter('receipt_workflow_completed');
      TreasuryObservability.recordValue('receipt_workflow_amount', finalReceipt.amount);

      return {
        receipt: finalReceipt,
        treasuryTransaction: relatedTx,
        traceability
      };
    });
  }

  /**
   * ORCHESTRATION WORKFLOW 2: Enterprise Treasury Transfer Workflow
   * Coordinates the full transfer pipeline: Validation -> Draft -> Review -> Approval -> Execution -> Ledger Posting
   */
  public static async orchestrateTransferWorkflow(
    schoolId: string,
    input: {
      sourceAccountId: string;
      destinationAccountId: string;
      amount: number;
      paymentInstrument: PaymentInstrumentType;
      paymentInstrumentDetails?: string;
      description: string;
      transferDate?: string;
      notes?: string;
    },
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<{
    transfer: TreasuryTransfer;
    traceability: WorkflowTraceabilityContext;
  }> {

    const workflowId = `wf_trsf_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const correlationId = `corr_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    TreasuryObservability.log('INFO', `Starting orchestrated transfer workflow [${workflowId}] from account [${input.sourceAccountId}] to [${input.destinationAccountId}].`, {
      workflowId,
      correlationId,
      amount: input.amount
    });

    TreasuryObservability.incrementCounter('transfer_workflow_started');

    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'ORCHESTRATE_TRANSFER_WORKFLOW',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transfers', 'treasury_accounts', 'journal_entries', 'general_ledger', 'audit_logs']
    }, async () => {

      // 1. Double check payment instrument configs
      await PaymentInstrumentService.validateInstrumentAvailability(input.paymentInstrument);

      // Step A: Create the transfer request in Draft status
      let transfer = await TreasuryTransferService.createTransfer(schoolId, input, operator);

      // Step B: Submit for approval
      transfer = await TreasuryTransferService.submitForApproval(schoolId, transfer.id, operator);

      // Step C: Approve transfer
      transfer = await TreasuryTransferService.approveTransfer(schoolId, transfer.id, operator);

      // Step D: Execute the physical balance movement between chests
      transfer = await TreasuryTransferService.executeTransfer(schoolId, transfer.id, operator);

      // Step E: Post to Journal & General Ledger via PostingEngine
      transfer = await TreasuryTransferService.postTransfer(schoolId, transfer.id, operator);

      // Generate the traceability context
      const finalAuditLogs = await AuditRepository.getAll(schoolId, { userId: operator.userId });
      const recentAudit = finalAuditLogs[0];

      const traceability: WorkflowTraceabilityContext = {
        workflowId,
        correlationId,
        businessReference: transfer.description,
        financialReference: transfer.id,
        postingReference: transfer.journalEntryId || '',
        auditReference: recentAudit ? recentAudit.id : ''
      };

      // Publish Event
      const transferEvent: TreasuryTransferExecutedEvent = {
        eventId: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        eventName: 'TreasuryTransferExecuted',
        occurredAt: new Date().toISOString(),
        schoolId,
        traceability,
        payload: {
          transferId: transfer.id,
          sourceAccountId: transfer.sourceAccountId,
          destinationAccountId: transfer.destinationAccountId,
          amount: transfer.amount
        }
      };
      await TreasuryDomainEventPublisher.publish(transferEvent);

      TreasuryObservability.log('INFO', `Successfully completed transfer orchestration workflow [${workflowId}].`, {
        traceability
      });

      TreasuryObservability.incrementCounter('transfer_workflow_completed');
      TreasuryObservability.recordValue('transfer_workflow_amount', transfer.amount);

      return {
        transfer,
        traceability
      };
    });
  }
}
