import { useState } from 'react';

export function useStudentFees() {
  const [feesRemaining, setFeesRemaining] = useState<number>(0);

  const calculateFees = (stageType: string) => {
    // الرسوم لا تُستنتج من المرحلة؛ تُقرأ من هيكل رسوم معتمد.
    void stageType;
    return 0;
  };

  return {
    feesRemaining,
    setFeesRemaining,
    calculateFees,
  };
}
