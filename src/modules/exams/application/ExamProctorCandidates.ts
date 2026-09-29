export interface ExamProctorCandidate {
  id: string;
  name: string;
  specialization: string;
}

/** Return only the active staff identity fields required for exam duties. */
export function buildExamProctorCandidates(snapshot: unknown): ExamProctorCandidate[] {
  const data = snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)
    ? snapshot as Record<string, unknown>
    : {};
  const jobs = new Map<string, string>();
  if (Array.isArray(data.jobs)) {
    for (const rawJob of data.jobs) {
      if (!rawJob || typeof rawJob !== 'object') continue;
      const job = rawJob as Record<string, unknown>;
      const id = String(job.id ?? '').trim();
      const title = String(job.titleAr ?? job.titleEn ?? '').trim();
      if (id && title) jobs.set(id, title);
    }
  }

  const candidates = new Map<string, ExamProctorCandidate>();
  if (Array.isArray(data.employees)) {
    for (const rawEmployee of data.employees) {
      if (!rawEmployee || typeof rawEmployee !== 'object') continue;
      const employee = rawEmployee as Record<string, unknown>;
      const id = String(employee.id ?? '').trim();
      const name = String(employee.name ?? '').trim();
      if (!id || !name || employee.status !== 'active') continue;
      const major = String(employee.major ?? '').trim();
      const jobTitle = jobs.get(String(employee.jobId ?? '').trim()) || '';
      candidates.set(id, { id, name, specialization: major || jobTitle || 'موظف المدرسة' });
    }
  }
  return [...candidates.values()].sort((left, right) => left.name.localeCompare(right.name, 'ar'));
}
