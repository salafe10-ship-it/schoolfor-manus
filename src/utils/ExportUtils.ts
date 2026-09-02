import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { writeXlsxBuffer } from './ExcelWorkbookUtils';

/**
 * Utility to generate PDF reports with RTL and branding.
 */
export const generatePDFReport = (
  title: string,
  data: any[],
  columns: { header: string; dataKey: string }[],
  schoolName: string
) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Add Branding
  doc.setFontSize(18);
  doc.text(schoolName, 200, 20, { align: "center" });
  doc.setFontSize(14);
  doc.text(title, 200, 30, { align: "center" });

  // @ts-ignore
  doc.autoTable({
    columns: columns,
    body: data,
    startY: 40,
    styles: { font: "helvetica", fontSize: 10, halign: 'right' },
    headStyles: { fillColor: [43, 63, 107], halign: 'right' },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.text("نظام إدارة الشؤون الطلابية الذكي", 15, 200);
    }
  });

  doc.save(`${title}.pdf`);
};

/**
 * Utility to generate Excel reports.
 */
export const generateExcelReport = async (
  title: string,
  data: any[],
  columns: { header: string; dataKey: string }[]
) => {
  const buffer = await writeXlsxBuffer([{
    name: title,
    headers: columns.map(column => column.header),
    rows: data.map(row => columns.map(column => row[column.dataKey])),
    columnWidths: columns.map(() => 24)
  }]);
  const downloadUrl = URL.createObjectURL(new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }));
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${title}.xlsx`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
};
