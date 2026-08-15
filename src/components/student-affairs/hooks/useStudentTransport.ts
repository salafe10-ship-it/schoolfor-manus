import { useState } from 'react';

export function useStudentTransport() {
  const [assignedRoute, setAssignedRoute] = useState<string>('route_north');
  const [deliveryPeriod, setDeliveryPeriod] = useState<string>('both');

  return {
    assignedRoute,
    setAssignedRoute,
    deliveryPeriod,
    setDeliveryPeriod,
  };
}
