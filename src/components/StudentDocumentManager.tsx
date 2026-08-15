import { AlertTriangle, ChevronDown, Clock, FileText, ShieldCheck, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { StudentDocument, DocumentStatus } from '../types';
import { SecuritySanitizer } from '../modules/security/sanitization';

interface StudentDocumentManagerProps {
  studentId: string;
}

export default function StudentDocumentManager({ studentId }: StudentDocumentManagerProps) {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (!SecuritySanitizer.sanitizeFile(file)) {
        alert('Invalid file: Please upload PDF, JPG, or PNG under 5MB.');
        return;
      }
      console.log('Uploading secure file...', file.name);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-700 p-6" id="student-doc-manager">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          Student Document Vault
        </h2>
        <button 
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500"
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
        <input id="file-upload-input" type="file" className="hidden" multiple onChange={(e) => handleFileUpload(e.target.files)} />
      </div>

      <div className="border border-slate-800 overflow-hidden">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-right">Document Name</th>
              <th className="px-4 py-3 text-right">Category</th>
              <th className="px-4 py-3 text-right">Status</th>
              <th className="px-4 py-3 text-right">Verification</th>
              <th className="px-4 py-3 text-right">Expiry</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No documents found in vault.
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-4 py-3">{doc.fileName}</td>
                  <td className="px-4 py-3">{doc.category}</td>
                  <td className="px-4 py-3 capitalize">{doc.status}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${doc.verificationStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {doc.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{doc.expirationDate || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <button className="text-slate-400 hover:text-white">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
