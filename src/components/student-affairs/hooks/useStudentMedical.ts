import { useState } from 'react';
import { Student } from '../../../types';

export interface StudentMedicalState {
  // Medical
  healthBloodType: string;
  healthChronic: string;
  healthAllergies: string;
  healthVaccines: boolean;
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
  healthBloodType: 'O+',
  healthChronic: '',
  healthAllergies: '',
  healthVaccines: true,
  healthEmergencyContact: '',
  healthContinuousMeds: '',
  healthSpecialNeeds: '',
  healthDoctorNotes: '',

  academicLevel: 'متوسط',
  academicStrengths: '',
  academicWeaknesses: '',
  academicTalent: '',
  academicPrograms: '',
  academicGuidanceNotes: '',

  behaviorPoints: 100,
  behaviorNotes: '',
  behaviorDisciplineLevel: 'ممتاز',
  behaviorCommitmentLevel: 'ممتاز',
  behaviorCooperationLevel: 'ممتاز',
  behaviorAwards: '',
  behaviorInfractions: '',
  behaviorSocialWorkerNotes: '',
};

export function useStudentMedical() {
  const [medical, setMedical] = useState<StudentMedicalState>(initialMedicalState);

  const selectMedical = (student: any) => {
    setMedical({
      healthBloodType: student.healthBloodType || 'O+',
      healthChronic: student.healthChronic || '',
      healthAllergies: student.healthAllergies || '',
      healthVaccines: student.healthVaccines !== undefined ? student.healthVaccines : true,
      healthEmergencyContact: student.healthEmergencyContact || '',
      healthContinuousMeds: student.healthContinuousMeds || '',
      healthSpecialNeeds: student.healthSpecialNeeds || '',
      healthDoctorNotes: student.healthDoctorNotes || '',

      academicLevel: student.academicLevel || 'متوسط',
      academicStrengths: student.academicStrengths || '',
      academicWeaknesses: student.academicWeaknesses || '',
      academicTalent: student.academicTalent || '',
      academicPrograms: student.academicPrograms || '',
      academicGuidanceNotes: student.academicGuidanceNotes || '',

      behaviorPoints: student.behaviorPoints !== undefined ? student.behaviorPoints : 100,
      behaviorNotes: student.behaviorNotes || '',
      behaviorDisciplineLevel: student.behaviorDisciplineLevel || 'ممتاز',
      behaviorCommitmentLevel: student.behaviorCommitmentLevel || 'ممتاز',
      behaviorCooperationLevel: student.behaviorCooperationLevel || 'ممتاز',
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
