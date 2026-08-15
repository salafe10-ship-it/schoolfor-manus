// src/modules/notification/domain/NotificationService.ts
import { NotificationChannel, NotificationChannelType } from './NotificationChannel';

/**
 * Enterprise Notification Service.
 * Handles dispatching notifications across multiple channels.
 */
export class NotificationService {
  private channels: Map<NotificationChannelType, NotificationChannel> = new Map();

  public registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.type, channel);
  }

  public async notify(
    type: NotificationChannelType,
    message: string,
    recipient: string,
    context: Record<string, any>
  ): Promise<void> {
    const channel = this.channels.get(type);
    if (!channel) {
      throw new Error(`Notification channel ${type} not registered.`);
    }
    
    // In production, this would be queued for asynchronous processing
    await channel.send(message, recipient, context);
  }
}
