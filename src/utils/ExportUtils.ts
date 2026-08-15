import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

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
export const generateExcelReport = (
  title: string,
  data: any[],
  columns: { header: string; dataKey: string }[]
) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title);
  XLSX.writeFile(wb, `${title}.xlsx`);
};
