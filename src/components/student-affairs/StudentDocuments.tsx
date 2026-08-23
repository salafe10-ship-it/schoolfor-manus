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
    if (!activePrintStudent) {
      triggerNotification('يرجى اختيار طالب قبل رفع المستند وربطه بالسجل الصحيح.', 'warning');
      return;
    }
    const statusId = `status_${Date.now()}_${file.name}`;
    setUploadStatuses(prev => [...prev, { id: statusId, name: file.name, progress: 0, status: 'scanning', file }]);

    try {
      // 1. Validation
      if (file.size > 15 * 1024 * 1024) throw new Error('حجم الملف كبير جداً');
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (['exe', 'js', 'sh'].includes(fileExt || '') || !['pdf', 'png', 'jpg', 'jpeg'].includes(fileExt || '')) {
        throw new Error('صيغة الملف غير مدعومة أو غير آمنة');
      }

      // لا نُحاكي الرفع ولا نضيف مستندًا محليًا؛ الحفظ يجب أن يتم عبر خدمة المستندات المركزية.
      throw new Error('خدمة مستندات الطلاب المركزية غير متاحة؛ لم يتم حفظ الملف.');
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
