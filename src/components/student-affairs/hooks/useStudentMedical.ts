import { useState } from 'react';
import { Student } from '../../../types';

export interface StudentMedicalState {
  // Medical
  healthBloodType: string;
  healthChronic: string;
  healthAllergies: string;
  healthVaccines?: boolean;
  healthEmergencyContact: string;
  healthContinuousMeds: string;
  healthSpecialNeeds: string;
  healthDoctorNotes: string;
  
  // Academic
  academicLevel: string;
  academicStrengths: string;
  academicWeaknesses: string;
  academicTalent: string;
  academicPrograms: string;
  academicGuidanceNotes: string;

  // Behavioral
  behaviorPoints: number;
  behaviorNotes: string;
  behaviorDisciplineLevel: string;
  behaviorCommitmentLevel: string;
  behaviorCooperationLevel: string;
  behaviorAwards: string;
  behaviorInfractions: string;
  behaviorSocialWorkerNotes: string;
}

const initialMedicalState: StudentMedicalState = {
  healthBloodType: '',
  healthChronic: '',
  healthAllergies: '',
  healthVaccines: undefined,
  healthEmergencyContact: '',
  healthContinuousMeds: '',
  healthSpecialNeeds: '',
  healthDoctorNotes: '',

  academicLevel: '',
  academicStrengths: '',
  academicWeaknesses: '',
  academicTalent: '',
  academicPrograms: '',
  academicGuidanceNotes: '',

  behaviorPoints: 0,
  behaviorNotes: '',
  behaviorDisciplineLevel: '',
  behaviorCommitmentLevel: '',
  behaviorCooperationLevel: '',
  behaviorAwards: '',
  behaviorInfractions: '',
  behaviorSocialWorkerNotes: '',
};

export function useStudentMedical() {
  const [medical, setMedical] = useState<StudentMedicalState>(initialMedicalState);

  const selectMedical = (student: any) => {
    setMedical({
      healthBloodType: student.healthBloodType || '',
      healthChronic: student.healthChronic || '',
      healthAllergies: student.healthAllergies || '',
      healthVaccines: student.healthVaccines !== undefined ? student.healthVaccines : undefined,
      healthEmergencyContact: student.healthEmergencyContact || '',
      healthContinuousMeds: student.healthContinuousMeds || '',
      healthSpecialNeeds: student.healthSpecialNeeds || '',
      healthDoctorNotes: student.healthDoctorNotes || '',

      academicLevel: student.academicLevel || '',
      academicStrengths: student.academicStrengths || '',
      academicWeaknesses: student.academicWeaknesses || '',
      academicTalent: student.academicTalent || '',
      academicPrograms: student.academicPrograms || '',
      academicGuidanceNotes: student.academicGuidanceNotes || '',

      behaviorPoints: student.behaviorPoints !== undefined ? student.behaviorPoints : 0,
      behaviorNotes: student.behaviorNotes || '',
      behaviorDisciplineLevel: student.behaviorDisciplineLevel || '',
      behaviorCommitmentLevel: student.behaviorCommitmentLevel || '',
      behaviorCooperationLevel: student.behaviorCooperationLevel || '',
      behaviorAwards: student.behaviorAwards || '',
      behaviorInfractions: student.behaviorInfractions || '',
      behaviorSocialWorkerNotes: student.behaviorSocialWorkerNotes || '',
    });
  };

  const initNewMedical = () => {
    setMedical(initialMedicalState);
  };

  return {
    medical,
    setMedical,
    selectMedical,
    initNewMedical,
  };
}
