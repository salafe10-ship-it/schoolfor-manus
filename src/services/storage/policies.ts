import { StoragePolicy } from './types';

export const STORAGE_POLICIES: Record<string, StoragePolicy> = {
  'theme': { category: 'A', persist: true },
  'dashboard_layout_mode': { category: 'A', persist: true },
  'exams_active_tab': { category: 'B', persist: false },
  'exams_test_suite': { category: 'B', persist: false },
  'active_employee_id': { category: 'C', persist: false }, // Should move to Auth/Context
  'edupro_token': { category: 'C', persist: false }, // Must move to HTTP-only cookies/Memory
  // ... add others as we refactor
};
