Warning: truncated output (original token count: 90438)
Total output lines: 6143

import { AlertTriangle, ArrowLeft, BarChart3, CalendarRange, CheckCircle2, ChevronLeft, ClipboardCheck, Coins, DollarSign, Download, FileSpreadsheet, FileText, GraduationCap, Home, Maximize2, Minimize2, Pencil, Percent, Plus, Printer, QrCode, RefreshCw, Save, Search, Settings, Settings2, Trash2, TrendingUp, Undo2, Upload, UserCheck, Users, X } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import React, { useState, useMemo } from 'react';
import { Student, Invoice, UserRole, Stage, Grade, AcademicClass, CostCenter } from '../types';
import { SQLTransactionEngine } from '../database/transactions/transactionManager';
import { SQLCommandBuilder } from '../database/transactions/SQLCommand';
import { useCurrency } from '../utils/currency';
import EnterpriseActionToolbar from './shared/EnterpriseActionToolbar';
import StudentSearchPicker from './shared/StudentSearchPicker';
import { EnterpriseAuditLogger } from '../utils/EnterpriseAuditLogger';
import { StudentAffairsValidationFramework } from '../validation/StudentAffairsValidationFramework';
import { getTrustedAccessToken } from '../utils/auth';
import { authenticatedRequest } from '../utils/authenticatedRequest';
import { feeConfigMatchesStudent, isStudentTuitionFee, resolveStudentFeeContext } from '../utils/studentFeeMatching';

interface StudentFinancialPortalProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  filteredStudents: Student[];
  handleStudentPaymentSubmit: (e: React.FormEvent, studentId: string, amount: number, method: string) => void;
  currentRole: UserRole;
  setActiveSection: (sec: string) => void;
  logAction: (action: string, details: string, module: string) => void;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  stages?: St…89438 tokens truncated…ة</div></div>

            <div className="student-installment-print-preview-actions mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400"><Printer className="h-4 w-4" />طباعة هذه المعاينة</button>
              <button type="button" onClick={() => setInstallmentPlanPrintPreview(null)} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">إغلاق المعاينة</button>
            </div>
          </div>
        </div>
      )}

      {activeSaving && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity duration-300">
          <div className="border-2 border-amber-500 shadow-2xl p-6 max-w-sm mx-auto flex flex-col items-center gap-4 text-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
               <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">العملية جارية قيد التنفيذ</h3>
            <p className="text-slate-700 font-bold text-sm">
              جاري تنفيذ [<span className="text-amber-600">{activeSaving}</span>] حالياً.
              <br />
              يرجى الانتظار وعدم النقر مجدداً لضمان عدم تكرار السجلات.
            </p>
            <div className="text-xs text-amber-600 font-black px-3 py-1 bg-amber-50 rounded-lg">
              قفل الطلبات المحمي (Idempotency Request Lock) نشط حالياً
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}

