export const triggerNotification = (message: string, type: 'info' | 'warning' | 'success' | 'error') => {
  console.log(`Notification: ${type} - ${message}`);
};
