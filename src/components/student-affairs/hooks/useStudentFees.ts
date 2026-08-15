import { useState } from 'react';

export function useStudentFees() {
  const [feesRemaining, setFeesRemaining] = useState<number>(0);

  const calculateFees = (stageType: string) => {
    let defaultStageFee = 8000;
    if (stageType === 'kindergarten') defaultStageFee = 6000;
    else if (stageType === 'middle') defaultStageFee = 10000;
    else if (stageType === 'secondary' || stageType === 'high') defaultStageFee = 12000;
    return defaultStageFee;
  };

  return {
    feesRemaining,
    setFeesRemaining,
    calculateFees,
  };
}
