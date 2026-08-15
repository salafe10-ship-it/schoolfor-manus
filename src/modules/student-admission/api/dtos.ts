// src/modules/student-admission/api/dtos.ts

export interface SubmitAdmissionInquiryRequestDto {
  schoolId: string;
  studentName: string;
  dateOfBirth: string; // ISO Date String
}

export interface AdmissionInquiryResponseDto {
  id: string;
  status: string;
  createdAt: string;
}
