/** Open a printable child window without the noopener feature that makes
 * window.open return null in several browsers. Clear the opener immediately. */
export const openPrintWindow = (): Window | null => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return null;
  printWindow.opener = null;
  return printWindow;
};
