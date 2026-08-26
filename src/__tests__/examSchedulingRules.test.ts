import { describe, expect, it } from 'vitest';
import {
  canAssignProctorForWeek,
  countProctorDutiesInWeek,
  examTimeRangesOverlap,
  findScheduleResourceConflicts,
  getExamIntervalDurationMinutes,
  getSchedulingWeekKey
} from '../modules/exams/application/ExamSchedulingRules';

describe('exam scheduling proctor duty rules', () => {
  it('counts a proctor duty only in its calendar week', () => {
    const schedule = [
      { proctorId: 'teacher-1', date: '2026-05-18' },
      { proctorId: 'teacher-1', date: '2026-05-20' },
      { proctorId: 'teacher-1', date: '2026-05-24' },
      { proctorId: 'teacher-2', date: '2026-05-19' }
    ];

    expect(getSchedulingWeekKey('2026-05-18')).toBe('2026-05-17');
    expect(countProctorDutiesInWeek(schedule, 'teacher-1', '2026-05-17')).toBe(2);
    expect(countProctorDutiesInWeek(schedule, 'teacher-1', '2026-05-24')).toBe(1);
  });

  it('allows a new week after a proctor reaches the previous week cap', () => {
    const schedule = Array.from({ length: 10 }, (_, index) => ({
      proctorId: 'teacher-1',
      date: `2026-05-${String(17 + index % 5).padStart(2, '0')}`
    }));

    expect(canAssignProctorForWeek(schedule, 'teacher-1', '2026-05-17', 10)).toBe(false);
    expect(canAssignProctorForWeek(schedule, 'teacher-1', '2026-05-24', 10)).toBe(true);
  });

  it('detects true time overlap while allowing adjacent periods', () => {
    expect(examTimeRangesOverlap('08:30', '10:30', '09:00', '11:00')).toBe(true);
    expect(examTimeRangesOverlap('08:30', '10:30', '10:30', '12:00')).toBe(false);
    expect(examTimeRangesOverlap('invalid', '10:30', '09:00', '11:00')).toBe(false);
  });

  it('calculates a deterministic exam interval duration', () => {
    expect(getExamIntervalDurationMinutes('08:30', '10:30')).toBe(120);
    expect(getExamIntervalDurationMinutes('10:30', '08:30')).toBeNull();
    expect(getExamIntervalDurationMinutes('8:30', '10:30')).toBeNull();
  });

  it('detects overlapping classes, proctors, primary halls, and split halls', () => {
    const conflicts = findScheduleResourceConflicts([
      {
        date: '2026-05-18',
        startTime: '08:30',
        endTime: '10:30',
        classroom: 'الصف الأول',
        hallId: 'hall-a',
        splitHalls: ['hall-b'],
        proctorId: 'teacher-1'
      },
      {
        date: '2026-05-18',
        startTime: '09:00',
        endTime: '11:00',
        classroom: 'الصف الأول',
        hallId: 'hall-c',
        splitHalls: ['hall-b'],
        proctorId: 'teacher-1'
      }
    ]);

    expect(conflicts).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'classroom', resourceId: 'الصف الأول' }),
      expect.objectContaining({ type: 'proctor', resourceId: 'teacher-1' }),
      expect.objectContaining({ type: 'hall', resourceId: 'hall-b' })
    ]));
  });

  it('does not report resources reused on different dates or adjacent periods', () => {
    expect(findScheduleResourceConflicts([
      { date: '2026-05-18', startTime: '08:00', endTime: '09:00', classroom: 'A', hallId: 'H', proctorId: 'P' },
      { date: '2026-05-18', startTime: '09:00', endTime: '10:00', classroom: 'A', hallId: 'H', proctorId: 'P' },
      { date: '2026-05-19', startTime: '08:30', endTime: '09:30', classroom: 'A', hallId: 'H', proctorId: 'P' }
    ])).toEqual([]);
  });
});
