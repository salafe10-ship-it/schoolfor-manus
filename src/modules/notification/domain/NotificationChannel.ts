// src/modules/notification/domain/NotificationChannel.ts
export enum NotificationChannelType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP'
}

export interface NotificationChannel {
  type: NotificationChannelType;
  send(message: string, recipient: string, context: Record<string, any>): Promise<void>;
}
