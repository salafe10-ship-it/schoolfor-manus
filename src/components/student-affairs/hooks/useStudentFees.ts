import { useCallback, useState } from 'react';
import { getTrustedAccessToken } from '../../../utils/auth';

export function useStudentFees() {
  const [feesRemaining, setFeesRemaining] = useState<number>(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudentFees = useCallback(async (studentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/financial/students/${encodeURIComponent(studentId)}/account`, {
        headers: { Authorization: `Bearer ${getTrustedAccessToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر قراءة كشف الحساب المركزي.');
      const nextInvoices = Array.isArray(result.data?.invoices) ? result.data.invoices : [];
      const nextReceipts = Array.isArray(result.data?.receipts) ? result.data.receipts : [];
      setInvoices(nextInvoices);
      setReceipts(nextReceipts);
      setFeesRemaining(Number(result.data?.totals?.remainingAmount || 0));
      setLastSyncAt(new Date().toISOString());
      return result.data;
    } catch (cause: any) {
      setInvoices([]);
      setReceipts([]);
      setFeesRemaining(0);
      setError(cause?.message || 'تعذر قراءة كشف الحساب المركزي.');
      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateFees = () => {
    if (!Number.isFinite(feesRemaining)) return 0;
    return feesRemaining;
  };

  return {
    feesRemaining,
    setFeesRemaining,
    invoices,
    receipts,
    lastSyncAt,
    loading,
    error,
    loadStudentFees,
    calculateFees,
  };
}
