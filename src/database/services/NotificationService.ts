import { Notification, NotificationTemplate, NotificationStatus } from '../../types';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { EnterpriseAuditLogger } from '../../utils/EnterpriseAuditLogger';
import { v4 as uuidv4 } from 'uuid';
import { IoCContainer } from '../IoCContainer';

export class NotificationService {
  public static $inject = ['NotificationRepository'];

  constructor(private repo: NotificationRepository) {}

  private static get repoInstance(): NotificationRepository {
    return IoCContainer.getInstance().resolve<NotificationRepository>('NotificationRepository');
  }

  public static async create(
    notification: Omit<Notification, 'id' | 'createdDate' | 'status' | 'retryCount'>
  ): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      createdDate: new Date().toISOString(),
      status: 'queued',
      retryCount: 0
    };

    await this.repoInstance.create(newNotification);

    await EnterpriseAuditLogger.log(
        'CREATE',
        'NOTIFICATION',
        newNotification.id,
        newNotification.createdBy,
        `تم إنشاء إشعار: ${newNotification.subject}`
    );

    return newNotification;
  }

  public static renderTemplate(template: NotificationTemplate, variables: Record<string, string>): string {
    let body = template.body;
    for (const [key, value] of Object.entries(variables)) {
        body = body.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return body;
  }

  public static async send(notificationId: string): Promise<void> {
    // 1. Logic for channel-specific delivery (Email/SMS/WhatsApp/Push)
    // 2. Update status in DB
    // 3. Log activity
  }

  // المزيد من الوظائف: Schedule, MarkAsRead, etc.
}
