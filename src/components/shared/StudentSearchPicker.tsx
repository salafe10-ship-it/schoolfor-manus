import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Search, UserRound, X } from 'lucide-react';
import type { Student } from '../../types';

interface StudentSearchPickerProps {
  students: Student[];
  value?: string;
  onChange: (student: Student | null) => void;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  getMeta?: (student: Student) => string;
}

const normalizeArabicSearch = (value: unknown) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u064B-\u065F\u0670]/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ؤ/g, 'و')
  .replace(/ئ/g, 'ي')
  .replace(/ة/g, 'ه')
  .toLocaleLowerCase('ar')
  .replace(/\s+/g, ' ')
  .trim();

function searchableStudentText(student: Student) {
  return normalizeArabicSearch([
    student.name,
    student.academicId,
    student.studentCode,
    student.nationalId,
    student.classroom,
    student.section,
    student.parentName,
    student.parentPhone
  ].filter(Boolean).join(' '));
}

export default function StudentSearchPicker({
  students,
  value = '',
  onChange,
  disabled = false,
  placeholder = 'اكتب اسم الطالب أو رقمه الأكاديمي...',
  helperText,
  getMeta
}: StudentSearchPickerProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedStudent = students.find(student => student.id === value) || null;
  const [query, setQuery] = useState(selectedStudent?.name || '');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) setQuery(selectedStudent?.name || '');
  }, [isOpen, selectedStudent?.id, selectedStudent?.name]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const matches = useMemo(() => {
    const normalizedQuery = normalizeArabicSearch(query);
    const ordered = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    if (!normalizedQuery || normalizeArabicSearch(selectedStudent?.name) === normalizedQuery) return ordered.slice(0, 20);
    return ordered
      .filter(student => searchableStudentText(student).includes(normalizedQuery))
      .slice(0, 20);
  }, [query, selectedStudent?.name, students]);

  useEffect(() => {
    setActiveIndex(current => Math.min(current, Math.max(matches.length - 1, 0)));
  }, [matches.length]);

  const chooseStudent = (student: Student) => {
    onChange(student);
    setQuery(student.name);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full" dir="rtl">
      <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 shadow-sm transition ${
        isOpen ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-300 hover:border-amber-400'
      } ${disabled ? 'cursor-not-allowed bg-slate-100 opacity-70' : ''}`}>
        <Search className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={isOpen && matches[activeIndex] ? `${listboxId}-${matches[activeIndex].id}` : undefined}
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setIsOpen(true);
            setActiveIndex(0);
            if (selectedStudent && normalizeArabicSearch(nextQuery) !== normalizeArabicSearch(selectedStudent.name)) {
              onChange(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex(index => Math.min(index + 1, Math.max(matches.length - 1, 0)));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex(index => Math.max(index - 1, 0));
            } else if (event.key === 'Enter' && isOpen && matches[activeIndex]) {
              event.preventDefault();
              chooseStudent(matches[activeIndex]);
            } else if (event.key === 'Escape') {
              setIsOpen(false);
              setQuery(selectedStudent?.name || '');
            }
          }}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400"
        />
        {(query || selectedStudent) && !disabled && (
          <button
            type="button"
            aria-label="مسح اختيار الطالب"
            onClick={() => {
              setQuery('');
              onChange(null);
              setIsOpen(true);
            }}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {helperText && <p className="mt-1.5 text-[10px] font-semibold text-slate-500">{helperText}</p>}

      {isOpen && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="نتائج البحث عن الطلاب"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
        >
          {matches.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <UserRound className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              <p className="text-xs font-black text-slate-600">لا يوجد طالب مطابق</p>
              <p className="mt-1 text-[10px] text-slate-400">راجع الاسم أو الرقم الأكاديمي ثم أعد البحث.</p>
            </div>
          ) : matches.map((student, index) => {
            const isSelected = student.id === value;
            const secondary = getMeta?.(student) || [student.academicId || student.studentCode, student.classroom].filter(Boolean).join(' • ');
            return (
              <button
                id={`${listboxId}-${student.id}`}
                key={student.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseStudent(student)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-right transition ${
                  index === activeIndex ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black text-slate-900">{student.name}</span>
                  <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">{secondary || 'لا توجد بيانات صفية إضافية'}</span>
                </span>
                {isSelected ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <UserRound className="h-4 w-4 shrink-0 text-slate-300" />
                )}
              </button>
            );
          })}
          {students.length > 20 && !normalizeArabicSearch(query) && (
            <p className="border-t border-slate-100 px-3 py-2 text-center text-[10px] font-semibold text-slate-500">
              اكتب جزءًا من الاسم لعرض نتائج أدق من بين {students.length} طالبًا.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
