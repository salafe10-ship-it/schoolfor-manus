import { JournalRepository } from './repositories/JournalRepository';
import { AccountRepository } from './repositories/AccountRepository';
import { GeneralLedgerRepository } from './repositories/GeneralLedgerRepository';
import { FiscalYearRepository } from './repositories/FiscalYearRepository';
import { AccountingPeriodRepository } from './repositories/AccountingPeriodRepository';
import { WorkflowRepository } from './repositories/WorkflowRepository';
import { DocumentRepository } from './repositories/DocumentRepository';
import { NotificationRepository } from './repositories/NotificationRepository';
import { AIRepository } from './repositories/AIRepository';
import { BIRepository } from './repositories/BIRepository';
import { ConfigurationRepository } from './repositories/ConfigurationRepository';
import { TenantRepository } from './repositories/TenantRepository';
import { IntegrationRepository } from './repositories/IntegrationRepository';
import { ReportRepository } from './repositories/ReportRepository';
import { MDMRepository } from './repositories/MDMRepository';
import { MonitoringRepository } from './repositories/MonitoringRepository';
import { BackgroundJobRepository } from './repositories/BackgroundJobRepository';
import { BackupRepository } from './repositories/BackupRepository';
import { SecurityRepository } from './repositories/SecurityRepository';
import { UserRepository } from './repositories/UserRepository';
import { StudentRepository } from './repositories/StudentRepository';
import { AuditRepository } from './repositories/AuditRepository';
import { FinancialConfigurationRepository } from './repositories/FinancialConfigurationRepository';

// Services
import { PostingEngine } from './services/PostingEngine';
import { WorkflowService } from './services/WorkflowService';
import { DocumentService } from './services/DocumentService';
import { NotificationService } from './services/NotificationService';
import { AIPlatformService } from './services/AIPlatformService';
import { BIService } from './services/BIService';
import { ConfigurationService } from './services/ConfigurationService';
import { TenantService } from './services/TenantService';
import { FinancialCloseService } from './services/FinancialCloseService';
import { IntegrationGateway } from './services/IntegrationGateway';
import { ReportService } from './services/ReportService';
import { MasterDataService } from './services/MasterDataService';
import { FinancialPeriodService } from './services/FinancialPeriodService';
import { MonitoringService } from './services/MonitoringService';
import { BackgroundJobService } from './services/BackgroundJobService';
import { BackupService } from './services/BackupService';
import { SecurityPlatformService } from './services/SecurityPlatformService';
import { SecurityService } from './services/SecurityService';
import { FiscalCalendarService } from './services/FiscalCalendarService';

/**
 * Enterprise IoC Container for Dependency Injection.
 * Standardizes constructor injection, scoped, and singleton lifecycles.
 */
export class IoCContainer {
  private static instance: IoCContainer;
  private services = new Map<string, { serviceClass: any; lifetime: 'singleton' | 'transient' | 'scoped'; instance?: any }>();
  private scopes = new Map<string, Map<string, any>>();

  private constructor() {
    this.bootstrap();
  }

  public static getInstance(): IoCContainer {
    if (!IoCContainer.instance) {
      IoCContainer.instance = new IoCContainer();
    }
    return IoCContainer.instance;
  }

  /**
   * Bootstraps and registers all infrastructure repositories and business services.
   */
  private bootstrap(): void {
    // 1. Repositories (Registered as Singletons)
    this.register('JournalRepository', JournalRepository, 'singleton');
    this.register('AccountRepository', AccountRepository, 'singleton');
    this.register('GeneralLedgerRepository', GeneralLedgerRepository, 'singleton');
    this.register('FiscalYearRepository', FiscalYearRepository, 'singleton');
    this.register('AccountingPeriodRepository', AccountingPeriodRepository, 'singleton');
    this.register('WorkflowRepository', WorkflowRepository, 'singleton');
    this.register('DocumentRepository', DocumentRepository, 'singleton');
    this.register('NotificationRepository', NotificationRepository, 'singleton');
    this.register('AIRepository', AIRepository, 'singleton');
    this.register('BIRepository', BIRepository, 'singleton');
    this.register('ConfigurationRepository', ConfigurationRepository, 'singleton');
    this.register('TenantRepository', TenantRepository, 'singleton');
    this.register('IntegrationRepository', IntegrationRepository, 'singleton');
    this.register('ReportRepository', ReportRepository, 'singleton');
    this.register('MDMRepository', MDMRepository, 'singleton');
    this.register('MonitoringRepository', MonitoringRepository, 'singleton');
    this.register('BackgroundJobRepository', BackgroundJobRepository, 'singleton');
    this.register('BackupRepository', BackupRepository, 'singleton');
    this.register('SecurityRepository', SecurityRepository, 'singleton');
    this.register('UserRepository', UserRepository, 'singleton');
    this.register('StudentRepository', StudentRepository, 'singleton');
    this.register('AuditRepository', AuditRepository, 'singleton');
    this.register('FinancialConfigurationRepository', FinancialConfigurationRepository, 'singleton');

    // 2. Services (Registered as Singletons)
    this.register('PostingEngine', PostingEngine, 'singleton');
    this.register('WorkflowService', WorkflowService, 'singleton');
    this.register('DocumentService', DocumentService, 'singleton');
    this.register('NotificationService', NotificationService, 'singleton');
    this.register('AIPlatformService', AIPlatformService, 'singleton');
    this.register('BIService', BIService, 'singleton');
    this.register('ConfigurationService', ConfigurationService, 'singleton');
    this.register('TenantService', TenantService, 'singleton');
    this.register('FinancialCloseService', FinancialCloseService, 'singleton');
    this.register('IntegrationGateway', IntegrationGateway, 'singleton');
    this.register('ReportService', ReportService, 'singleton');
    this.register('MasterDataService', MasterDataService, 'singleton');
    this.register('FinancialPeriodService', FinancialPeriodService, 'singleton');
    this.register('MonitoringService', MonitoringService, 'singleton');
    this.register('BackgroundJobService', BackgroundJobService, 'singleton');
    this.register('BackupService', BackupService, 'singleton');
    this.register('SecurityPlatformService', SecurityPlatformService, 'singleton');
    this.register('SecurityService', SecurityService, 'singleton');
    this.register('FiscalCalendarService', FiscalCalendarService, 'singleton');
  }

  public register<T>(
    token: string,
    serviceClass: any,
    lifetime: 'singleton' | 'transient' | 'scoped' = 'singleton'
  ): void {
    this.services.set(token, { serviceClass, lifetime });
  }

  public registerInstance<T>(token: string, instance: T): void {
    this.services.set(token, { serviceClass: null, lifetime: 'singleton', instance });
  }

  public createScope(): string {
    const scopeId = `scope_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.scopes.set(scopeId, new Map<string, any>());
    return scopeId;
  }

  public releaseScope(scopeId: string): void {
    this.scopes.delete(scopeId);
  }

  public resolve<T>(token: string, scopeId?: string): T {
    const registration = this.services.get(token);
    if (!registration) {
      throw new Error(`Dependency not registered in IoC Container: ${token}`);
    }

    if (registration.lifetime === 'singleton' && registration.instance) {
      return registration.instance;
    }

    if (registration.lifetime === 'scoped') {
      if (!scopeId) {
        throw new Error(`Cannot resolve scoped dependency '${token}' outside of a scope context.`);
      }
      const scopeMap = this.scopes.get(scopeId);
      if (!scopeMap) {
        throw new Error(`Scope context '${scopeId}' not found.`);
      }
      if (scopeMap.has(token)) {
        return scopeMap.get(token);
      }
    }

    if (!registration.serviceClass) {
      throw new Error(`No constructor/class defined for registered dependency '${token}'.`);
    }

    const instance = this.createInstance(registration.serviceClass, scopeId);

    if (registration.lifetime === 'singleton') {
      registration.instance = instance;
    } else if (registration.lifetime === 'scoped' && scopeId) {
      const scopeMap = this.scopes.get(scopeId);
      if (scopeMap) {
        scopeMap.set(token, instance);
      }
    }

    return instance;
  }

  private createInstance(serviceClass: any, scopeId?: string): any {
    const injectTokens = serviceClass.$inject || [];
    const resolvedDeps = injectTokens.map((token: string) => this.resolve(token, scopeId));
    return new serviceClass(...resolvedDeps);
  }
}
