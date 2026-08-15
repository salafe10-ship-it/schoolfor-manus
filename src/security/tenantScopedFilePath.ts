import path from 'node:path';

const SAFE_STORAGE_KEY = /^[A-Za-z0-9_-]{1,128}$/;

export function tenantScopedDatabaseFilePath(
  dataDirectory: string,
  filePrefix: string,
  schoolId: string
): string {
  const directory = dataDirectory.trim();
  const prefix = filePrefix.trim();
  const tenantKey = schoolId.trim();

  if (!directory || !SAFE_STORAGE_KEY.test(prefix) || !SAFE_STORAGE_KEY.test(tenantKey)) {
    throw new Error('Invalid tenant-scoped database file path.');
  }

  return path.join(directory, `${prefix}_${tenantKey}.json`);
}
