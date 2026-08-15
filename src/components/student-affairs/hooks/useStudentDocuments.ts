import { useState } from 'react';

export function useStudentDocuments() {
  const [docCategory, setDocCategory] = useState<string>('national_id');
  const [isDocUploading, setIsDocUploading] = useState<boolean>(false);
  const [ocrLogStatus, setOcrLogStatus] = useState<string>('');

  return {
    docCategory,
    setDocCategory,
    isDocUploading,
    setIsDocUploading,
    ocrLogStatus,
    setOcrLogStatus,
  };
}
