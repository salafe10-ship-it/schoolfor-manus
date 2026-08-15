export interface StudentUpdateDTO {
  name?: string;
  classroom?: string;
  status?: 'active' | 'inactive' | 'on_leave' | 'graduated' | 'dismissed';
  feesPaid?: number;
  feesRemaining?: number;
  phone?: string;
  email?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
}

export const ALLOWED_STUDENT_UPDATE_FIELDS = [
  'name', 'classroom', 'status', 'feesPaid', 'feesRemaining', 
  'phone', 'email', 'address', 'parentName', 'parentPhone'
];

export function filterStudentUpdateData(data: any): StudentUpdateDTO {
  const filtered: any = {};
  for (const key of ALLOWED_STUDENT_UPDATE_FIELDS) {
    if (data[key] !== undefined) {
      filtered[key] = data[key];
    }
  }
  return filtered;
}
