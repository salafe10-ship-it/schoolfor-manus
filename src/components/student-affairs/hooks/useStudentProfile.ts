import { useState, useMemo } from 'react';
import { Student } from '../../../types';

export interface StudentProfileState {
  studentCode: string;
  academicId: string;
  fullNameAr: string;
  fullNameEn: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  nationality: string;
  nationalId: string;
  religion: string;
  socialStatus: string;
  stageId: string;
  gradeName: string;
  section: string;
  academicYear: string;
  seatNumber: string;
  enrollmentStatus: 'active' | 'suspended' | 'graduated' | 'frozen' | 'withdrawn';
  registrationDate: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  notes: string;
  avatarUrl: string;
}

const initialProfileState: StudentProfileState = {
  studentCode: '',
  academicId: '',
  fullNameAr: '',
  fullNameEn: '',
  gender: '',
  birthDate: '',
  nationality: '',
  nationalId: '',
  religion: '',
  socialStatus: '',
  stageId: '',
  gradeName: '',
  section: '',
  academicYear: '',
  seatNumber: '',
  enrollmentStatus: 'active',
  registrationDate: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  notes: '',
  avatarUrl: '',
};

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfileState>(initialProfileState);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const calculatedAge = useMemo(() => {
    if (!profile.birthDate) return 0;
    const birth = new Date(profile.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }, [profile.birthDate]);

  const selectProfile = (student: Student, inferredStage: string) => {
    setProfile({
      studentCode: student.studentCode || '',
      academicId: student.academicId || '',
      fullNameAr: student.name,
      fullNameEn: (student as any).nameEn || '',
      gender: student.gender === 'male' || student.gender === 'female' ? student.gender : '',
      birthDate: student.birthDate || '',
      nationality: student.nationality || '',
      nationalId: student.nationalId,
      religion: student.religion || '',
      socialStatus: student.socialStatus || '',
      stageId: inferredStage,
      gradeName: student.classroom,
      section: student.section,
      academicYear: student.academicYear || '',
      seatNumber: (student as any).seatNumber || '',
      enrollmentStatus: student.status,
      registrationDate: student.registrationDate || '',
      phone: student.parentPhone || '',
      email: student.email || '',
      address: student.address || '',
      city: '',
      state: '',
      notes: student.healthInfo || '',
      avatarUrl: student.avatarUrl || '',
    });
  };

  const initNewProfile = (nextCode: string, nextId: string, nextSeat: string) => {
    setProfile({
      ...initialProfileState,
      studentCode: nextCode,
      academicId: nextId,
      seatNumber: nextSeat,
      registrationDate: new Date().toISOString().split('T')[0],
    });
  };

  return {
    profile,
    setProfile,
    selectedStudentId,
    setSelectedStudentId,
    isNewRecord,
    setIsNewRecord,
    isLoading,
    setIsLoading,
    calculatedAge,
    selectProfile,
    initNewProfile,
  };
}
