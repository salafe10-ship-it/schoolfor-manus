import { useState } from 'react';
import { Student } from '../../../types';

export interface GuardianInformationState {
  fatherName: string;
  fatherPhone: string;
  fatherJob: string;
  fatherWorkPlace: string;
  fatherNationalId: string;
  motherName: string;
  motherPhone: string;
  motherJob: string;
  motherWorkPlace: string;
  homeAddress: string;
  emergencyPhone: string;
  guardianEmail: string;
  emergencyContact: string;
  relationshipType: string;
}

const initialGuardianState: GuardianInformationState = {
  fatherName: '',
  fatherPhone: '',
  fatherJob: '',
  fatherWorkPlace: '',
  fatherNationalId: '',
  motherName: '',
  motherPhone: '',
  motherJob: '',
  motherWorkPlace: '',
  homeAddress: '',
  emergencyPhone: '',
  guardianEmail: '',
  emergencyContact: '',
  relationshipType: '',
};

export function useGuardianInformation() {
  const [guardian, setGuardian] = useState<GuardianInformationState>(initialGuardianState);

  const selectGuardian = (student: Student) => {
    const father = student.parentsAndGuardians?.find(p => p.relation === 'father');
    setGuardian({
      fatherName: father?.name || student.parentName || '',
      fatherPhone: father?.phone || student.parentPhone || '',
      fatherJob: student.guardianOccupation || '',
      fatherWorkPlace: '',
      fatherNationalId: father?.nid || '',
      motherName: student.motherName || '',
      motherPhone: student.motherPhone || '',
      motherJob: '',
      motherWorkPlace: '',
      homeAddress: student.address || '',
      emergencyPhone: father?.phone || student.parentPhone || '',
      guardianEmail: (student as any).guardianEmail || '',
      emergencyContact: father?.name || student.parentName || '',
      relationshipType: student.guardianRelation || '',
    });
  };

  const initNewGuardian = () => {
    setGuardian(initialGuardianState);
  };

  return {
    guardian,
    setGuardian,
    selectGuardian,
    initNewGuardian,
  };
}
