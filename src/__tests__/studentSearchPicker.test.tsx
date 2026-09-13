import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StudentSearchPicker from '../components/shared/StudentSearchPicker';
import type { Student } from '../types';

const students = [
  { id: 'student-1', name: 'أحمد محمد', academicId: 'STD-1001', classroom: 'الصف الأول', schoolId: 'school-1' },
  { id: 'student-2', name: 'سارة علي', academicId: 'STD-1002', classroom: 'الصف الثاني', schoolId: 'school-1' }
] as Student[];

describe('StudentSearchPicker', () => {
  it('finds Arabic names without requiring the exact hamza form and selects the result', () => {
    const onChange = vi.fn();
    render(<StudentSearchPicker students={students} onChange={onChange} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'احمد' } });
    fireEvent.click(screen.getByRole('option', { name: /أحمد محمد/ }));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'student-1' }));
  });

  it('supports academic-number search and keyboard selection', () => {
    const onChange = vi.fn();
    render(<StudentSearchPicker students={students} onChange={onChange} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'STD-1002' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'student-2' }));
  });
});
