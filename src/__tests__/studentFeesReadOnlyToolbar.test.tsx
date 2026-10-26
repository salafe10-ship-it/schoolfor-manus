import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import EnterpriseActionToolbar from '../components/shared/EnterpriseActionToolbar';

afterEach(cleanup);

function renderToolbar(overrides: Partial<React.ComponentProps<typeof EnterpriseActionToolbar>> = {}) {
  const handlers = {
    onNew: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onSave: vi.fn(),
    onCancel: vi.fn(), onRefresh: vi.fn(), onSearch: vi.fn(), onPrint: vi.fn(),
    onExportPdf: vi.fn(), onExportExcel: vi.fn(), onImportExcel: vi.fn(),
    onDownloadTemplate: vi.fn(),
  };
  render(<EnterpriseActionToolbar {...handlers} userRole="SuperAdmin" selectedId="receipt-1" {...overrides} />);
  return handlers;
}

describe('financial toolbar in read-only mode', () => {
  it('allows verified reports and refresh while blocking every data-changing action', () => {
    const handlers = renderToolbar({ mutationsDisabled: true });
    for (const title of ['إضافة سجل جديد', 'تعديل السجل المحدد', 'حذف السجل المحدد', 'استيراد بيانات']) {
      const button = screen.getByTitle(title);
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    for (const [title, handler] of [
      ['تحديث البيانات', handlers.onRefresh], ['بحث وتصفية', handlers.onSearch],
      ['طباعة التقرير', handlers.onPrint], ['تصدير بصيغة PDF', handlers.onExportPdf],
      ['تصدير بصيغة Excel', handlers.onExportExcel], ['تحميل قالب', handlers.onDownloadTemplate],
    ] as const) {
      const button = screen.getByTitle(title);
      expect(button).toBeEnabled();
      fireEvent.click(button);
      expect(handler).toHaveBeenCalledOnce();
    }
    for (const handler of [handlers.onNew, handlers.onEdit, handlers.onDelete, handlers.onImportExcel]) {
      expect(handler).not.toHaveBeenCalled();
    }
  });

  it('still blocks reports and mutations when the source has not been verified', () => {
    renderToolbar({ disabled: true, mutationsDisabled: true });
    for (const title of ['إضافة سجل جديد', 'تعديل السجل المحدد', 'حذف السجل المحدد', 'استيراد بيانات',
      'طباعة التقرير', 'تصدير بصيغة PDF', 'تصدير بصيغة Excel', 'تحميل قالب', 'تحديث البيانات']) {
      expect(screen.getByTitle(title)).toBeDisabled();
    }
  });

  it('prevents saving after a write lock while allowing the user to cancel the edit', () => {
    const handlers = renderToolbar({ mutationsDisabled: true, isEditing: true });
    fireEvent.click(screen.getByTitle('حفظ التغييرات'));
    expect(screen.getByTitle('حفظ التغييرات')).toBeDisabled();
    expect(handlers.onSave).not.toHaveBeenCalled();
    expect(screen.getByTitle('إلغاء التعديل')).toBeEnabled();
    fireEvent.click(screen.getByTitle('إلغاء التعديل'));
    expect(handlers.onCancel).toHaveBeenCalledOnce();
  });

  it('preserves existing permissions and global loading protection', () => {
    renderToolbar({ userRole: 'Accountant', isLoading: true });
    for (const title of ['إضافة سجل جديد', 'تعديل السجل المحدد', 'حذف السجل المحدد',
      'طباعة التقرير', 'تصدير بصيغة PDF', 'تصدير بصيغة Excel', 'استيراد بيانات']) {
      expect(screen.getByTitle(title)).toBeDisabled();
    }
  });
});
