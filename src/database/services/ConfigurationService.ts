import { ConfigurationItem, ConfigurationStatus } from '../../types';
import { ConfigurationRepository } from '../repositories/ConfigurationRepository';
import { EnterpriseAuditLogger } from '../../utils/EnterpriseAuditLogger';
import { v4 as uuidv4 } from 'uuid';
import { IoCContainer } from '../IoCContainer';

export class ConfigurationService {
  public static $inject = ['ConfigurationRepository'];

  constructor(private repo: ConfigurationRepository) {}

  private static get repoInstance(): ConfigurationRepository {
    return IoCContainer.getInstance().resolve<ConfigurationRepository>('ConfigurationRepository');
  }

  public static async getEffectiveConfig(key: string, context: { tenantId: string, schoolId?: string, branchId?: string, userId?: string }): Promise<any> {
    return await this.repoInstance.getEffectiveConfig(key, context);
  }

  public static async updateConfig(item: Omit<ConfigurationItem, 'id' | 'createdAt' | 'createdBy' | 'modifiedAt' | 'modifiedBy' | 'isDeleted'>, userId: string): Promise<string> {
    const newItem: ConfigurationItem = {
      ...item,
      id: uuidv4(),
      version: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      createdBy: userId,
      modifiedAt: new Date().toISOString(),
      modifiedBy: userId,
      isDeleted: false
    };

    await this.repoInstance.saveConfig(newItem, userId);

    await EnterpriseAuditLogger.log(
        'CREATE',
        'CONFIGURATION',
        newItem.id,
        userId,
        `تم إنشاء إعداد جديد: ${item.key}`
    );

    return newItem.id;
  }

  public static async publishConfig(id: string, userId: string): Promise<void> {
    // Logic to update status to 'published' and create a new version
    await EnterpriseAuditLogger.log(
        'PUBLISH',
        'CONFIGURATION',
        id,
        userId,
        `تم نشر الإعداد: ${id}`
    );
  }
}
