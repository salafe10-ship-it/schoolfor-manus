import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { getTrustedAccessToken } from '../../utils/auth';

export interface InventoryPrintModel {
  title: string;
  number?: string;
  date?: string;
  status?: string;
  columns: string[];
  rows: React.ReactNode[][];
  reportType: 'valuation' | 'reorder' | 'turnover' | 'variances' | 'procurement';
  summary?: string;
}
const PrintContext = createContext<((model: InventoryPrintModel) => Promise<void>) | null>(null);
export const useInventoryPrint = () => useContext(PrintContext);

export default function InventoryPrintProvider({ children, schoolName, version, notify }: {
  children: React.ReactNode; schoolName: string; version: number | null;
  notify: (message: string, type: 'warning' | 'danger') => void;
}) {
  const [model, setModel] = useState<InventoryPrintModel | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    const clear = () => { setModel(null); document.body.removeAttribute('data-inventory-print'); };
    window.addEventListener('afterprint', clear);
    return () => { window.removeEventListener('afterprint', clear); document.body.removeAttribute('data-inventory-print'); };
  }, []);
  const print = async (documentModel: InventoryPrintModel) => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (version === null) throw new Error('حمّل المصدر المركزي قبل الطباعة.');
      const token = getTrustedAccessToken();
      if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
      const response = await fetch('/api/inventory/reports/audit', { method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: documentModel.reportType, format: 'print', expectedVersion: version,
          documentId: documentModel.number, documentTitle: documentModel.title }) });
      const result = await response.json();
      if (!response.ok || !result?.success) throw new Error(result?.message || 'تعذر تدقيق المصدر قبل الطباعة.');
      flushSync(() => setModel(documentModel));
      document.body.setAttribute('data-inventory-print', 'true');
      if (document.fonts?.ready) await document.fonts.ready;
      window.print();
      // The browser chooses the printer or Save as PDF; no download is claimed.
    } catch (error: any) {
      document.body.removeAttribute('data-inventory-print'); setModel(null);
      notify(error?.message || 'تعذر تجهيز الطباعة.', 'danger');
    } finally { busy.current = false; }
  };
  return <PrintContext.Provider value={print}>
    {children}
    {model && createPortal(<article className="inventory-print-host printable-area" dir="rtl" lang="ar" aria-label={model.title}>
      <header><h1>{schoolName || 'المدرسة'}</h1><h2>{model.title}</h2>
        <p>رقم المستند: <bdi>{model.number || '—'}</bdi> | التاريخ: <bdi>{model.date || new Date().toISOString().slice(0, 10)}</bdi></p>
        <p>الحالة: {model.status || 'تقرير من المصدر المركزي'} | إصدار المصدر: <bdi>{version}</bdi></p>
      </header>
      <table><thead><tr>{model.columns.map((column, index) => <th key={index}>{column}</th>)}</tr></thead>
        <tbody>{model.rows.length ? model.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{cell ?? '—'}</td>)}</tr>)
          : <tr><td colSpan={model.columns.length}>لا توجد سجلات ضمن النطاق الحالي.</td></tr>}</tbody></table>
      {model.summary && <p>{model.summary}</p>}
      <footer><span>إعداد: ______________</span><span>مراجعة: ______________</span><span>اعتماد: ______________</span></footer>
    </article>, document.body)}
  </PrintContext.Provider>;
}
