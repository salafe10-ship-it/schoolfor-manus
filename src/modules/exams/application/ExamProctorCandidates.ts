export interface ExamProctorCandidate {
  id: string;
  name: string;
  specialization: string;
}

/** Project only the staff details needed for exam duties, never HR private data. */
export function buildExamProctorCandidates(snapshot: any): ExamProctorCandidate[] {
  const jobs = new Map<string, string>((Array.isArray(snapshot?.jobs) ? snapshot.jobs : [])
    .map((job: any) => [String(job?.id || ''), String(job?.titleAr || job?.titleEn || '').trim()]));
  const candidates = new Map<string, ExamProctorCandidate>();
  for (const employee of Array.isArray(snapshot?.employees) ? snapshot.employees : []) {
    const id = String(employee?.id || '').trim();
    const name = String(employee?.name || '').trim();
    if (!id || !name || employee.status !== 'active') continue;
    candidates.set(id, {
      id,
      name,
      specialization: String(employee.major || jobs.get(String(employee.jobId || '')) || 'موظف المدرسة').trim(),
    });
  }
  return [...candidates.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}
