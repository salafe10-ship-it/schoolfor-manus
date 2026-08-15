import { AlertTriangle, Calendar, CheckCircle, FileText, RefreshCw, Trash2, Upload, XCircle } from 'lucide-react';
import React, { useState } from 'react';
interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  expiryDate?: string;
  matchedStudentName: string;
  confidence: string;
}

interface UploadStatus {
  id: string;
  name: string;
  progress: number;
  status: 'scanning' | 'compressing' | 'uploading' | 'completed' | 'failed';
  error?: string;
  file: File;
}

interface StudentDocumentsProps {
  formStudent: {
    fullNameAr: string;
  };
  activePrintStudent: {
    id: string;
    securedDocs?: DocumentInfo[];
  } | null;
  setStudents: React.Dispatch<React.SetStateAction<any[]>>;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  logAction: (action: string, description: string, category: string) => void;
}

export default function StudentDocuments({
  formStudent,
  activePrintStudent,
  setStudents,
  triggerNotification,
  logAction
}: StudentDocumentsProps) {
  const [docCategory, setDocCategory] = useState<string>('national_id');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);

  const simulateProcess = async (file: File, statusId: string, type: 'scanning' | 'compressing' | 'uploading'): Promise<boolean> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setUploadStatuses(prev => prev.map(s => s.id === statusId ? { ...s, progress, status: type } : s));
        if (progress >= 100) {
          clearInterval(interval);
          resolve(true);
        }
      }, 300);
    });
  };

  const uploadFile = async (file: File, retry = false) => {
    const statusId = `status_${Date.now()}_${file.name}`;
    setUploadStatuses(prev => [...prev, { id: statusId, name: file.name, progress: 0, status: 'scanning', file }]);

    try {
      // 1. Validation
      if (file.size > 15 * 1024 * 1024) throw new Error('حجم الملف كبير جداً');
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (['exe', 'js', 'sh'].includes(fileExt || '') || !['pdf', 'png', 'jpg', 'jpeg'].includes(fileExt || '')) {
        throw new Error('صيغة الملف غير مدعومة أو غير آمنة');
      }

      // 2. Simulated Pipeline
      await simulateProcess(file, statusId, 'scanning');
      await simulateProcess(file, statusId, 'compressing');
      await simulateProcess(file, statusId, 'uploading');

      // 3. Finalize
      const newDoc: DocumentInfo = {
        id: `doc_${Date.now()}`,
        name: file.name,
        type: docCategory,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString().split('T')[0],
        uploadedBy: 'المستخدم الحالي',
        expiryDate: expiryDate || undefined,
        matchedStudentName: formStudent.fullNameAr,
        confidence: '98%'
      };

      if (activePrintStudent) {
        setStudents(prev => prev.map(s => s.id === activePrintStudent.id ? { ...s, securedDocs: [...(s.securedDocs || []), newDoc] } : s));
        logAction('DOC_UPLOAD', `تم رفع ${file.name} بنجاح`, 'شؤون الطلاب');
      }

      setUploadStatuses(prev => prev.map(s => s.id === statusId ? { ...s, status: 'completed' } : s));
      triggerNotification(`تم رفع ${file.name} بنجاح`, 'success');
    } catch (e: any) {
      setUploadStatuses(prev => prev.map(s => s.id === statusId ? { ...s, status: 'failed', error: e.message } : s));
      triggerNotification(`فشل رفع ${file.name}: ${e.message}`, 'warning');
    }
  };

  return (
    <div className="space-y-4" id="student-documents-section">
      {/* ... (keep header and upload UI) */}
      <div className="bg-transparent border border-dashed border-slate-350 p-6 text-center space-y-3">
          <input type="file" id="vault-uploader" className="hidden" multiple accept="image/*,application/pdf" onChange={(e) => Array.from(e.target.files || []).forEach(f => uploadFile(f as File))} />
          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
          <button type="button" onClick={() => document.getElementById('vault-uploader')?.click()} className="bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg">اختيار الملفات</button>
      </div>

      {/* Progress tracking */}
      {uploadStatuses.length > 0 && (
        <div className="space-y-2">
          {uploadStatuses.map(s => (
            <div key={s.id} className="border p-2 rounded flex items-center gap-2 text-xs">
              {s.status === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-500"/> : s.status === 'failed' ? <XCircle className="w-4 h-4 text-rose-500"/> : <RefreshCw className="w-4 h-4 animate-spin"/>}
              <span className="flex-1">{s.name} ({s.status}) {s.progress}%</span>
              {s.status === 'failed' && <button onClick={() => uploadFile(s.file)} className="text-amber-600 font-bold">إعادة المحاولة</button>}
            </div>
          ))}
        </div>
      )}
      
      {/* ... (keep document list) */}
    </div>
  );
}
