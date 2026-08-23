import { useState } from 'react';

export function useStudentTransport() {
  // لا يُفترض وجود مسار أو فترة قبل تحميلها من مصدر النقل المركزي.
  const [assignedRoute, setAssignedRoute] = useState<string>('');
  const [deliveryPeriod, setDeliveryPeriod] = useState<string>('');

  return {
    assignedRoute,
    setAssignedRoute,
    deliveryPeriod,
    setDeliveryPeriod,
  };
}
