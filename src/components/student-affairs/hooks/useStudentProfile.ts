import { useState, useMemo } from 'react';
import { Student } from '../../../types';

export interface StudentProfileState {
  studentCode: string;
  academicId: string;
  fullNameAr: string;
  fullNameEn: string;
  gender: 'male' | 'female';
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
  gender: 'male',
  birthDate: '2015-01-01',
  nationality: 'سعودي',
  nationalId: '',
  religion: 'مسلم',
  socialStatus: 'أعزب / يعيش مع الوالدين',
  stageId: 'primary',
  gradeName: 'الصف الأول الابتدائي',
  section: 'أ',
  academicYear: '1447-1448 هـ',
  seatNumber: '',
  enrollmentStatus: 'active',
  registrationDate: new Date().toISOString().split('T')[0],
  phone: '',
  email: '',
  address: '',
  city: 'الرياض',
  state: 'منطقة الرياض',
  notes: '',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
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
      studentCode: student.studentCode || student.id.replace(/\D/g, '').slice(-4) || '0001',
      academicId: student.academicId || `SAH-${student.id}`,
      fullNameAr: student.name,
      fullNameEn: student.name.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '),
      gender: student.gender || 'male',
      birthDate: student.birthDate || '2015-06-15',
      nationality: student.nationality || 'سعودي',
      nationalId: student.nationalId,
      religion: student.religion || 'مسلم',
      socialStatus: student.socialStatus || 'أعزب / يعيش مع الوالدين',
      stageId: inferredStage,
      gradeName: student.classroom,
      section: student.section,
      academicYear: student.academicYear || '1447-1448 هـ',
      seatNumber: student.academicId?.replace(/\D/g, '') || '7721',
      enrollmentStatus: student.status,
      registrationDate: student.registrationDate || new Date().toISOString().split('T')[0],
      phone: student.parentPhone || '',
      email: student.email || `${student.id}@school-erp.edu`,
      address: student.address || '',
      city: 'الرياض',
      state: 'منطقة الرياض',
      notes: student.healthInfo || '',
      avatarUrl: student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
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
