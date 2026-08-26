export interface ScheduledProctorDuty {
  proctorId?: string;
  date?: string;
}

export interface ScheduledExamInterval extends ScheduledProctorDuty {
  classroom?: string;
  hallId?: string;
  splitHalls?: unknown[];
  startTime?: string;
  endTime?: string;
}

export interface ScheduleResourceConflict {
  type: 'classroom' | 'hall' | 'proctor';
  resourceId: string;
  date: string;
  firstIndex: number;
  secondIndex: number;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const examTimeToMinutes = (value: string): number | null => {
  if (!TIME_PATTERN.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getExamIntervalDurationMinutes = (startTime: string, endTime: string): number | null => {
  const start = examTimeToMinutes(startTime);
  const end = examTimeToMinutes(endTime);
  return start !== null && end !== null && end > start ? end - start : null;
};

export const examTimeRangesOverlap = (
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
): boolean => {
  if (![firstStart, firstEnd, secondStart, secondEnd].every(value => TIME_PATTERN.test(value))) return false;
  return firstStart < secondEnd && secondStart < firstEnd;
};

const scheduleHallIds = (item: ScheduledExamInterval): string[] => [...new Set([
  String(item.hallId || '').trim(),
  ...(Array.isArray(item.splitHalls) ? item.splitHalls.map(value => String(value || '').trim()) : [])
].filter(Boolean))];

/**
 * Detects overlapping use of a class, hall (including split halls), or proctor.
 * Adjacent intervals such as 08:00-09:00 and 09:00-10:00 are valid.
 */
export const findScheduleResourceConflicts = (
  schedule: ScheduledExamInterval[]
): ScheduleResourceConflict[] => {
  const conflicts: ScheduleResourceConflict[] = [];

  for (let firstIndex = 0; firstIndex < schedule.length; firstIndex += 1) {
    const first = schedule[firstIndex];
    const firstDate = String(first.date || '').trim();
    const firstStart = String(first.startTime || '').trim();
    const firstEnd = String(first.endTime || '').trim();
    if (!ISO_DATE_PATTERN.test(firstDate) || !TIME_PATTERN.test(firstStart) || !TIME_PATTERN.test(firstEnd)) continue;

    for (let secondIndex = firstIndex + 1; secondIndex < schedule.length; secondIndex += 1) {
      const second = schedule[secondIndex];
      const secondDate = String(second.date || '').trim();
      if (secondDate !== firstDate) continue;

      const secondStart = String(second.startTime || '').trim();
      const secondEnd = String(second.endTime || '').trim();
      if (!examTimeRangesOverlap(firstStart, firstEnd, secondStart, secondEnd)) continue;

      const firstClass = String(first.classroom || '').trim();
      const secondClass = String(second.classroom || '').trim();
      if (firstClass && firstClass === secondClass) {
        conflicts.push({ type: 'classroom', resourceId: firstClass, date: firstDate, firstIndex, secondIndex });
      }

      const firstProctor = String(first.proctorId || '').trim();
      const secondProctor = String(second.proctorId || '').trim();
      if (firstProctor && firstProctor === secondProctor) {
        conflicts.push({ type: 'proctor', resourceId: firstProctor, date: firstDate, firstIndex, secondIndex });
      }

      const secondHalls = new Set(scheduleHallIds(second));
      for (const hallId of scheduleHallIds(first)) {
        if (secondHalls.has(hallId)) {
          conflicts.push({ type: 'hall', resourceId: hallId, date: firstDate, firstIndex, secondIndex });
        }
      }
    }
  }

  return conflicts;
};

/**
 * Returns the Sunday that starts the calendar week containing an ISO date.
 * UTC parsing keeps scheduling behavior deterministic on every client timezone.
 */
export const getSchedulingWeekKey = (date: string): string => {
  if (!ISO_DATE_PATTERN.test(date)) return '';

  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(value.getTime())) return '';

  value.setUTCDate(value.getUTCDate() - value.getUTCDay());
  return value.toISOString().slice(0, 10);
};

export const countProctorDutiesInWeek = (
  schedule: ScheduledProctorDuty[],
  proctorId: string,
  weekKey: string
): number => schedule.reduce((total, item) => (
  item.proctorId === proctorId && item.date && getSchedulingWeekKey(item.date) === weekKey
    ? total + 1
    : total
), 0);

export const canAssignProctorForWeek = (
  schedule: ScheduledProctorDuty[],
  proctorId: string,
  weekKey: string,
  maximumWeeklyDuties: number
): boolean => countProctorDutiesInWeek(schedule, proctorId, weekKey) < maximumWeeklyDuties;
