import { AlertCircle, Award, Briefcase, Building2, Calendar, Check, ChevronRight, Coins, Download, Edit, Eye, FileText, FolderOpen, HelpCircle, Plus, Scale, Settings2, ShieldCheck, Trash2, TrendingUp, User, X } from 'lucide-react';
import React, { useState } from 'react';
import { 
  HREmployee, HRDepartment, HRJob, HRContract, HRLeave, 
  HRPenalty, HRAdvance, HRBonus, HRPerformance, HRDocument, HRSettings 
} from './types';
import { SQLTransactionEngine } from '../../database/transactions/transactionManager';
import { FallbackStorage } from '../../database/repositories/FallbackStorage';

interface OtherHRTabsProps {
  activeTab: string;
  employees: HREmployee[];
  setEmployees: React.Dispatch<React.SetStateAction<HREmployee[]>>;
  departments: HRDepartment[];
  setDepartments: React.Dispatch<React.SetStateAction<HRDepartment[]>>;
  jobs: HRJob[];
  setJobs: React.Dispatch<React.SetStateAction<HRJob[]>>;
  contracts: HRContract[];
  setContracts: React.Dispatch<React.SetStateAction<HRContract[]>>;
  leaves: HRLeave[];
  setLeaves: React.Dispatch<React.SetStateAction<HRLeave[]>>;
  penalties: HRPenalty[];
  setPenalties: React.Dispatch<React.SetStateAction<HRPenalty[]>>;
  advances: HRAdvance[];
  setAdvances: React.Dispatch<React.SetStateAction<HRAdvance[]>>;
  rewards: HRBonus[];
  setRewards: React.Dispatch<React.SetStateAction<HRBonus[]>>;
  performance: HRPerformance[];
  setPerformance: React.Dispatch<React.SetStateAction<HRPerformance[]>>;
  documents: HRDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<HRDocument[]>>;
  settings: HRSettings;
  setSettings: React.Dispatch<React.SetStateAction<HRSettings>>;
  formatCurrency: (amount: number, showSymbol?: boolean) => string;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'error') => void;
  costCenterLabels: Record<string, string>;
}

export default function OtherHRTabs({
  activeTab,
  employees,
  setEmployees,
  departments,
  setDepartments,
  jobs,
  setJobs,
  contracts,
  setContracts,
  leaves,
  setLeaves,
  penalties,
  setPenalties,
  advances,
  setAdvances,
  rewards,
  setRewards,
  performance,
  setPerformance,
  documents,
  setDocuments,
  settings,
  setSettings,
  formatCurrency,
  triggerNotification,
  costCenterLabels
}: OtherHRTabsProps) {

  // Global modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states depending on activeTab
  const [deptForm, setDeptForm] = useState({ code: '', nameAr: '', nameEn: '', managerId: '', costCenter: 'admin' as any });
  const [jobForm, setJobForm] = useState({ titleAr: '', titleEn: '', departmentId: '', grade: 'أ', baseSalary: 3000 });
  const [contractForm, setContractForm] = useState({ employeeId: '', type: 'fixed' as any, startDate: '', endDate: '', monthlySalary: 3500 });
  const [leaveForm, setLeaveForm] = useState({ employeeId: '', type: 'annual' as any, startDate: '', endDate: '', reason: '' });
  const [penaltyForm, setPenaltyForm] = useState({ employeeId: '', type: 'deduction' as any, date: '', amount: 0, reason: '' });
  const [advanceForm, setAdvanceForm] = useState({ employeeId: '', amount: 1000, date: '', installments: 10, deductionPerMonth: 100, reason: '' });
  const [rewardForm, setRewardForm] = useState({ employeeId: '', amount: 0, date: '', reason: '' });
  const [perfForm, setPerfForm] = useState({ employeeId: '', date: '', score: 0, reviewer: '', strengths: '', improvements: '', trainingNeeds: '' });
  const [docForm, setDocForm] = useState({ employeeId: '', title: '', type: 'passport', issueDate: '', expiryDate: '' });

  // 1. ORGANIZATIONAL STRUCTURE
  if (activeTab === 'org') {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/40 p-4 border border-slate-800">
          <h3 className="font-bold text-white text-sm mb-1">المخطط الهيكلي التفاعلي للمؤسسة</h3>
          <p className="text-xs text-slate-400">هيكل إداري مرئي يتتبع تسلسل الأقسام ومدراء الوحدات وكامل طاقم العمل.</p>
        </div>

        {/* Visual Org Structure rendering */}
        <div className="flex flex-col items-center gap-6 py-6 border border-slate-800 bg-slate-950/20">
          {/* Node 1: Director General */}
          <div className="bg-gradient-to-r from-[#dfb55a] to-[#c99e4c] text-slate-950 p-4 text-center shadow-md border border-[#dfb55a]/50 w-64">
            <User className="w-6 h-6 mx-auto mb-1" />
            <h4 className="font-black text-xs">أ. سليمان غازي</h4>
            <p className="text-[10px] font-bold opacity-80">المدير العام والمشرف الأعلى</p>
          </div>

          <div className="w-1 h-8 bg-slate-700" />

          {/* Grid of Departments Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            {departments.map(dept => {
              const manager = employees.find(e => e.id === dept.managerId);
              const deptStaff = employees.filter(e => e.departmentId === dept.id);
              
              return (
                <div key={dept.id} className="bg-slate-900 border border-slate-800 hover:border-[#dfb55a]/30 p-4 space-y-3 relative">
                  <div className="absolute top-0 right-4 left-4 h-[1.5px] bg-[#dfb55a]/40" />
                  <div className="text-center pb-2 border-b border-slate-800">
                    <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 uppercase font-mono font-bold block mb-1">
                      {costCenterLabels[dept.costCenter]}
                    </span>
                    <h5 className="font-bold text-white text-xs">{dept.nameAr}</h5>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{dept.code}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-slate-950 p-2 rounded text-[11px] border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px]">مدير القسم:</span>
                      <span className="font-bold text-slate-300">{manager ? manager.name : 'غير محدد'}</span>
                    </div>

                    <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                      <span className="text-[10px] text-slate-500 block">طاقم القسم ({deptStaff.length}):</span>
                      {deptStaff.map(emp => (
                        <div key={emp.id} className="bg-slate-850 p-1.5 rounded text-[10px] text-slate-300 flex justify-between">
                          <span>{emp.name}</span>
                          <span className="text-slate-500 font-mono">{emp.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. DEPARTMENTS MANAGEMENT
  if (activeTab === 'depts') {
    const handleSaveDept = (e: React.FormEvent) => {
      e.preventDefault();
      if (FallbackStorage.isCanonicalPersistenceRequired()) { triggerNotification('حفظ الأقسام متوقف حتى يتم ربط مصدر الموارد البشرية المركزي.', 'warning'); return; }
      if (editingItem) {
        setDepartments(prev => prev.map(d => d.id === editingItem.id ? { ...d, ...deptForm } : d));
        triggerNotification('تم تعديل القسم الإداري بنجاح', 'success');
      } else {
        const newDept: HRDepartment = {
          id: `DEP-${Date.now().toString().slice(-3)}`,
          ...deptForm
        };
        setDepartments(prev => [...prev, newDept]);
        triggerNotification('✓ تم إضافة قسم إداري جديد للنموذج الهيكلي', 'success');
      }
      setShowAddModal(false);
      setEditingItem(null);
    };

    const handleOpenEdit = (dept: HRDepartment) => {
      setEditingItem(dept);
      setDeptForm({ code: dept.code, nameAr: dept.nameAr, nameEn: dept.nameEn, managerId: dept.managerId, costCenter: dept.costCenter });
      setShowAddModal(true);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">أقسام المؤسسة والمديرية</h3>
            <p className="text-xs text-slate-400">قسّم الأقسام، اختر المدراء، واربط كل قسم بمركز تكلفته المناسب لتوزيع التكاليف.</p>
          </div>
          <button 
            onClick={() => { setEditingItem(null); setDeptForm({ code: '', nameAr: '', nameEn: '', managerId: '', costCenter: 'admin' }); setShowAddModal(true); }}
            className="bg-gradient-to-r from-[#dfb55a] to-[#c99e4c] hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold uppercase">
                <th className="p-4">كود القسم</th>
                <th className="p-4">القسم (Ar)</th>
                <th className="p-4">القسم (En)</th>
                <th className="p-4">مدير القسم المعتمد</th>
                <th className="p-4 text-center">مركز التكلفة</th>
                <th className="p-4 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {departments.map(d => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-[#dfb55a]">{d.code}</td>
                  <td className="p-4 font-bold text-white">{d.nameAr}</td>
                  <td className="p-4 font-mono">{d.nameEn}</td>
                  <td className="p-4">{employees.find(e => e.id === d.managerId)?.name || 'غير معين'}</td>
                  <td className="p-4 text-center font-medium">{costCenterLabels[d.costCenter]}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenEdit(d)} className="p-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if(confirm('حذف القسم؟')) setDepartments(prev => prev.filter(x => x.id !== d.id)); }} className="p-1 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveDept} className="bg-slate-900 border border-slate-700 w-full max-w-md overflow-hidden text-xs text-slate-300">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                <h4 className="font-bold text-white text-sm">{editingItem ? 'تعديل بيانات القسم' : 'إضافة قسم إداري جديد'}</h4>
                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>رمز القسم (Code)</label>
                    <input type="text" required value={deptForm.code} onChange={e => setDeptForm(p=>({...p, code: e.target.value}))} placeholder="HR, FIN, IT" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label>مركز التكلفة</label>
                    <select value={deptForm.costCenter} onChange={e => setDeptForm(p=>({...p, costCenter: e.target.value as any}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                      {Object.entries(costCenterLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label>اسم القسم بالعربية</label>
                  <input type="text" required value={deptForm.nameAr} onChange={e => setDeptForm(p=>({...p, nameAr: e.target.value}))} placeholder="إدارة المالية والموازنة" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div className="space-y-1">
                  <label>اسم القسم بالإنجليزية</label>
                  <input type="text" required value={deptForm.nameEn} onChange={e => setDeptForm(p=>({...p, nameEn: e.target.value}))} placeholder="Finance and Budget Dept" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div className="space-y-1">
                  <label>مدير القسم المسؤول</label>
                  <select value={deptForm.managerId} onChange={e => setDeptForm(p=>({...p, managerId: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    <option value="">اختر مدير...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-slate-800 p-4 flex justify-end gap-2 border-t border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-700 px-4 py-2 rounded text-slate-300">إلغاء</button>
                <button type="submit" className="bg-[#dfb55a] text-slate-950 font-bold px-5 py-2 rounded">حفظ البيانات</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 3. JOBS / DESIGNATIONS
  if (activeTab === 'jobs') {
    const handleSaveJob = (e: React.FormEvent) => {
      e.preventDefault();
      if (FallbackStorage.isCanonicalPersistenceRequired()) { triggerNotification('حفظ الوظائف متوقف حتى يتم ربط مصدر الموارد البشرية المركزي.', 'warning'); return; }
      if (editingItem) {
        setJobs(prev => prev.map(j => j.id === editingItem.id ? { ...j, ...jobForm } : j));
        triggerNotification('تم تحديث المسمى الوظيفي بنجاح', 'success');
      } else {
        const newJob: HRJob = {
          id: `JOB-${Date.now().toString().slice(-3)}`,
          ...jobForm
        };
        setJobs(prev => [...prev, newJob]);
        triggerNotification('✓ تم إضافة مسمى وظيفي جديد بنجاح', 'success');
      }
      setShowAddModal(false);
      setEditingItem(null);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">المسميات والوظائف القياسية</h3>
            <p className="text-xs text-slate-400">حدد الوظائف التابعة لكل قسم، مع تحديد درجة الوظيفة والراتب الأساسي القياسي لها.</p>
          </div>
          <button 
            onClick={() => { setEditingItem(null); setJobForm({ titleAr: '', titleEn: '', departmentId: departments[0]?.id || '', grade: 'أ', baseSalary: 3500 }); setShowAddModal(true); }}
            className="bg-gradient-to-r from-[#dfb55a] to-[#c99e4c] hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>تعريف وظيفة جديدة</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold uppercase">
                <th className="p-4">رقم الوظيفة</th>
                <th className="p-4">الوظيفة (Ar)</th>
                <th className="p-4">الوظيفة (En)</th>
                <th className="p-4">القسم التابع له</th>
                <th className="p-4 text-center">الدرجة الوظيفية</th>
                <th className="p-4 text-center">الراتب الأساسي القياسي</th>
                <th className="p-4 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-500">{j.id}</td>
                  <td className="p-4 font-bold text-white">{j.titleAr}</td>
                  <td className="p-4 font-mono">{j.titleEn}</td>
                  <td className="p-4">{departments.find(d => d.id === j.departmentId)?.nameAr || '-'}</td>
                  <td className="p-4 text-center"><span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white">{j.grade}</span></td>
                  <td className="p-4 text-center font-bold text-emerald-400 font-mono">{formatCurrency(j.baseSalary, true)}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setEditingItem(j); setJobForm({ ...j }); setShowAddModal(true); }} className="p-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if(confirm('حذف المسمى الوظيفي؟')) setJobs(prev => prev.filter(x => x.id !== j.id)); }} className="p-1 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveJob} className="bg-slate-900 border border-slate-700 w-full max-w-md overflow-hidden text-xs text-slate-300">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                <h4 className="font-bold text-white text-sm">{editingItem ? 'تعديل الوظيفة' : 'تعريف وظيفة جديدة'}</h4>
                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label>القسم المعتمد</label>
                  <select value={jobForm.departmentId} onChange={e => setJobForm(p=>({...p, departmentId: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label>المسمى الوظيفي بالعربية</label>
                  <input type="text" required value={jobForm.titleAr} onChange={e => setJobForm(p=>({...p, titleAr: e.target.value}))} placeholder="معلم لغة إنجليزية" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div className="space-y-1">
                  <label>المسمى الوظيفي بالإنجليزية</label>
                  <input type="text" required value={jobForm.titleEn} onChange={e => setJobForm(p=>({...p, titleEn: e.target.value}))} placeholder="English Teacher" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>الدرجة الوظيفية</label>
                    <input type="text" required value={jobForm.grade} onChange={e => setJobForm(p=>({...p, grade: e.target.value}))} placeholder="أ، ب، ج" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label>الراتب الأساسي القياسي</label>
                    <input type="number" required value={jobForm.baseSalary} onChange={e => setJobForm(p=>({...p, baseSalary: Number(e.target.value)}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono text-emerald-400 font-bold" />
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-4 flex justify-end gap-2 border-t border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-700 px-4 py-2 rounded text-slate-300">إلغاء</button>
                <button type="submit" className="bg-[#dfb55a] text-slate-950 font-bold px-5 py-2 rounded">حفظ البيانات</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 4. CONTRACTS
  if (activeTab === 'contracts') {
    const handleSaveContract = (e: React.FormEvent) => {
      e.preventDefault();
      if (FallbackStorage.isCanonicalPersistenceRequired()) { triggerNotification('حفظ العقود متوقف حتى يتم ربط مصدر الموارد البشرية المركزي.', 'warning'); return; }
      if (editingItem) {
        setContracts(prev => prev.map(c => c.id === editingItem.id ? { ...c, ...contractForm } : c));
        triggerNotification('تم تحديث العقد بنجاح', 'success');
      } else {
        const newContract: HRContract = {
          id: `CON-2026-${String(contracts.length + 1).padStart(4, '0')}`,
          ...contractForm,
          status: 'active'
        };
        setContracts(prev => [newContract, ...prev]);
        triggerNotification('✓ تم تحرير وإبرام عقد العمل للموظف بنجاح', 'success');
      }
      setShowAddModal(false);
      setEditingItem(null);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">عقود العمل والتحقق القانوني</h3>
            <p className="text-xs text-slate-400">إبرام عقود العمل القانونية وتاريخ سريانها وانتهاء تاريخ العقود مع عد تنازلي للاستحقاق.</p>
          </div>
          <button 
            onClick={() => { setEditingItem(null); setContractForm({ employeeId: employees[0]?.id || '', type: 'fixed', startDate: new Date().toISOString().split('T')[0], endDate: '2027-06-30', monthlySalary: 3500 }); setShowAddModal(true); }}
            className="bg-gradient-to-r from-[#dfb55a] to-[#c99e4c] hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>إبرام عقد جديد</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold">
                <th className="p-4">كود العقد</th>
                <th className="p-4">الموظف المعني</th>
                <th className="p-4 text-center">نوع العقد</th>
                <th className="p-4 text-center">تاريخ المباشرة</th>
                <th className="p-4 text-center">تاريخ الانتهاء</th>
                <th className="p-4 text-center">الراتب المتفق عليه</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {contracts.map(c => {
                const emp = employees.find(e => e.id === c.employeeId);
                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#dfb55a]">{c.id}</td>
                    <td className="p-4 font-bold text-white">{emp ? emp.name : 'غير معروف'}</td>
                    <td className="p-4 text-center font-medium">{c.type === 'fixed' ? 'محدد المدة (سنوي)' : c.type === 'permanent' ? 'مستمر / دائم' : 'موسمي'}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{c.startDate}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{c.endDate}</td>
                    <td className="p-4 text-center font-bold text-emerald-400 font-mono">{formatCurrency(c.monthlySalary, true)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>{c.status === 'active' ? 'ساري' : 'منتهي / ملغي'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setEditingItem(c); setContractForm({ ...c }); setShowAddModal(true); }} className="p-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if(confirm('إلغاء أو إنهاء هذا العقد؟')) setContracts(prev => prev.map(x => x.id === c.id ? {...x, status: 'terminated'} : x)); }} className="p-1 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal for contract */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveContract} className="bg-slate-900 border border-slate-700 w-full max-w-md overflow-hidden text-xs text-slate-300">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                <h4 className="font-bold text-white text-sm">{editingItem ? 'تعديل عقد عمل' : 'تحرير عقد عمل جديد'}</h4>
                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label>الموظف المتعاقد معه</label>
                  <select value={contractForm.employeeId} onChange={e => setContractForm(p=>({...p, employeeId: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>نوع العقد</label>
                    <select value={contractForm.type} onChange={e => setContractForm(p=>({...p, type: e.target.value as any}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                      <option value="fixed">محدد المدة (سنوي)</option>
                      <option value="permanent">غير محدد (دائم)</option>
                      <option value="seasonal">موسمي / مؤقت</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>الراتب الشهري المتفق عليه</label>
                    <input type="number" required value={contractForm.monthlySalary} onChange={e => setContractForm(p=>({...p, monthlySalary: Number(e.target.value)}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono text-emerald-400 font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>تاريخ سريان العمل</label>
                    <input type="date" required value={contractForm.startDate} onChange={e => setContractForm(p=>({...p, startDate: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label>تاريخ انتهاء العقد</label>
                    <input type="date" required value={contractForm.endDate} onChange={e => setContractForm(p=>({...p, endDate: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-4 flex justify-end gap-2 border-t border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-700 px-4 py-2 rounded text-slate-300">إلغاء</button>
                <button type="submit" className="bg-[#dfb55a] text-slate-950 font-bold px-5 py-2 rounded">إبرام وتوثيق العقد</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 5. LEAVES / VACATIONS
  if (activeTab === 'leaves') {
    const handleSaveLeave = (e: React.FormEvent) => {
      e.preventDefault();
      if (FallbackStorage.isCanonicalPersistenceRequired()) { triggerNotification('اعتماد الإجازات متوقف حتى يتم ربط مصدر الموارد البشرية المركزي.', 'warning'); return; }
      const newLeave: HRLeave = {
        id: `LV-${Date.now().toString().slice(-4)}`,
        ...leaveForm,
        status: 'pending'
      };
      setLeaves(prev => [newLeave, ...prev]);
      
      // Auto update employee status to on_leave
      setEmployees(prev => prev.map(emp => emp.id === leaveForm.employeeId ? { ...emp, status: 'on_leave' } : emp));
      
      triggerNotification('✓ تم اعتماد الإجازة بنجاح، وتحديث حالة الموظف لـ (في إجازة)', 'success');
      setShowAddModal(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">إدارة الإجازات والغياب المبرر</h3>
            <p className="text-xs text-slate-400">تقديم ومراجعة طلبات الإجازة السنوية والمرضية للموظفين واعتمادها.</p>
          </div>
          <button 
            onClick={() => { setLeaveForm({ employeeId: employees[0]?.id || '', type: 'annual', startDate: new Date().toISOString().split('T')[0], endDate: '2026-06-15', reason: '' }); setShowAddModal(true); }}
            className="bg-gradient-to-r from-[#dfb55a] to-[#c99e4c] hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>تقديم طلب إجازة</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold">
                <th className="p-4">كود الطلب</th>
                <th className="p-4">الموظف المعني</th>
                <th className="p-4 text-center">نوع الإجازة</th>
                <th className="p-4 text-center">من تاريخ</th>
                <th className="p-4 text-center">إلى تاريخ</th>
                <th className="p-4">السبب الإداري</th>
                <th className="p-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {leaves.map(l => {
                const emp = employees.find(e => e.id === l.employeeId);
                return (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-500">{l.id}</td>
                    <td className="p-4 font-bold text-white">{emp ? emp.name : 'غير معروف'}</td>
                    <td className="p-4 text-center font-semibold">
                      {l.type === 'annual' ? 'إجازة سنوية' : l.type === 'sick' ? 'إجازة مرضية' : l.type === 'emergency' ? 'إجازة طارئة' : 'إجازة بدون مرتب'}
                    </td>
                    <td className="p-4 text-center font-mono text-slate-400">{l.startDate}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{l.endDate}</td>
                    <td className="p-4 max-w-[200px] truncate">{l.reason}</td>
                    <td className="p-4 text-center">
                      <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-500/20">معتمدة</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Form Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveLeave} className="bg-slate-900 border border-slate-700 w-full max-w-md overflow-hidden text-xs text-slate-300">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                <h4 className="font-bold text-white text-sm">تقديم طلب إجازة</h4>
                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label>الموظف المستفيد</label>
                  <select value={leaveForm.employeeId} onChange={e => setLeaveForm(p=>({...p, employeeId: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label>نوع الإجازة</label>
                  <select value={leaveForm.type} onChange={e => setLeaveForm(p=>({...p, type: e.target.value as any}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    <option value="annual">إجازة سنوية</option>
                    <option value="sick">إجازة مرضية معتمدة</option>
                    <option value="emergency">إجازة طارئة</option>
                    <option value="unpaid">إجازة بدون راتب</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>من تاريخ</label>
                    <input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm(p=>({...p, startDate: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label>إلى تاريخ</label>
                    <input type="date" required value={leaveForm.endDate} onChange={e => setLeaveForm(p=>({...p, endDate: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label>موجب وسبب الإجازة بالتفصيل</label>
                  <textarea required value={leaveForm.reason} onChange={e => setLeaveForm(p=>({...p, reason: e.target.value}))} rows={3} placeholder="دواعي صحية طارئة أو إجازة سنوية للراحة والفرص" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none" />
                </div>
              </div>
              <div className="bg-slate-800 p-4 flex justify-end gap-2 border-t border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-700 px-4 py-2 rounded text-slate-300">إلغاء</button>
                <button type="submit" className="bg-[#dfb55a] text-slate-950 font-bold px-5 py-2 rounded">اعتماد الإجازة فوراً</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 6. PENALTIES
  if (activeTab === 'penalties') {
    const handleSavePenalty = (e: React.FormEvent) => {
      e.preventDefault();
      if (FallbackStorage.isCanonicalPersistenceRequired()) { triggerNotification('تسجيل الجزاءات متوقف حتى يتم ربط مصدر الموارد البشرية المركزي.', 'warning'); return; }
      const newPenalty: HRPenalty = {
        id: `PEN-${Date.now().toString().slice(-4)}`,
        ...penaltyForm,
        status: 'pending'
      };
      setPenalties(prev => [newPenalty, ...prev]);
      
      // Append logs to Employee details
      setEmployees(prev => prev.map(emp => {
        if (emp.id === penaltyForm.employeeId) {
          const logs = [...emp.auditLogs];
          logs.unshift({
            action: 'تسجيل مخالفة وجزاء مالي',
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            user: 'مدير الموارد البشرية',
            details: `تسجيل جزاء خصم بقيمة ${penaltyForm.amount} لأجل ${penaltyForm.reason}`
          });
          return { ...emp, auditLogs: logs };
        }
        return emp;
      }));

      triggerNotification('✓ تم رصد المخالفة وتثبيت الخصم المالي ليرحل تلقائياً بمسير رواتب الشهر', 'success');
      setShowAddModal(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">سجل الجزاءات والمخالفات الإدارية</h3>
            <p className="text-xs text-slate-400">تسجيل العقوبات والخصومات على العاملين وتأثيرها المباشر في استقطاعات المرتب.</p>
          </div>
          <button 
            onClick={() => { setPenaltyForm({ employeeId: '', type: 'deduction', date: new Date().toISOString().split('T')[0], amount: 0, reason: '' }); setShowAddModal(true); }}
            className="bg-gradient-to-r from-rose-600 to-rose-700 hover:opacity-90 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل جزاء مالي</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold">
                <th className="p-4">كود الجزاء</th>
                <th className="p-4">الموظف المعني</th>
                <th className="p-4 text-center">نوع الجزاء</th>
                <th className="p-4 text-center">التاريخ المالي</th>
                <th className="p-4 text-center">قيمة الاستقطاع / الخصم</th>
                <th className="p-4">السبب الإداري بالتفصيل</th>
                <th className="p-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {penalties.map(p => {
                const emp = employees.find(e => e.id === p.employeeId);
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-500">{p.id}</td>
                    <td className="p-4 font-bold text-white">{emp ? emp.name : 'غير معروف'}</td>
                    <td className="p-4 text-center font-medium">{p.type === 'deduction' ? 'خصم مالي مباشر' : 'تنبيه كتابي'}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{p.date}</td>
                    <td className="p-4 text-center font-bold text-rose-400 font-mono">-{formatCurrency(p.amount, true)}</td>
                    <td className="p-4">{p.reason}</td>
                    <td className="p-4 text-center">
                      <span className="bg-rose-500/10 text-rose-400 font-bold text-[10px] px-2 py-0.5 rounded border border-rose-500/20">نافذ</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal penalty */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSavePenalty} className="bg-slate-900 border border-slate-700 w-full max-w-md overflow-hidden text-xs text-slate-300">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                <h4 className="font-bold text-white text-sm">تسجيل جزاء مالي واستقطاع للموظف</h4>
                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label>الموظف المخالف</label>
                  <select value={penaltyForm.employeeId} onChange={e => setPenaltyForm(p=>({...p, employeeId: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>نوع المخالفة والجزاء</label>
                    <select value={penaltyForm.type} onChange={e => setPenaltyForm(p=>({...p, type: e.target.value as any}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                      <option value="deduction">خصم مالي من الراتب الأساسي</option>
                      <option value="warning">إنذار وتنبيه إداري بدون خصم</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>تاريخ ارتكاب المخالفة</label>
                    <input type="date" required value={penaltyForm.date} onChange={e => setPenaltyForm(p=>({...p, date: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label>قيمة الخصم المالي المقدر</label>
                  <input type="number" required value={penaltyForm.amount} onChange={e => setPenaltyForm(p=>({...p, amount: Number(e.target.value)}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono text-rose-400 font-bold" />
                </div>
                <div className="space-y-1">
                  <label>الموجب والسبب التفصيلي للمخالفة</label>
                  <textarea required value={penaltyForm.reason} onChange={e => setPenaltyForm(p=>({...p, reason: e.target.value}))} rows={3} placeholder="مثال: غياب متكرر بدون إذن إداري أو مخالفة تعليمات العمل" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none" />
                </div>
              </div>
              <div className="bg-slate-800 p-4 flex justify-end gap-2 border-t border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-700 px-4 py-2 rounded text-slate-300">إلغاء</button>
                <button type="submit" className="bg-rose-600 text-white font-bold px-5 py-2 rounded">تثبيت الجزاء والخصم</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 7. ADVANCES / LOANS
  if (activeTab === 'advances') {
    const handleSaveAdvance = (e: React.FormEvent) => {
      e.preventDefault();

      if (FallbackStorage.isCanonicalPersistenceRequired()) {
        triggerNotification('صرف السلف متوقف حتى يتم ربط مسار السلف والقيود بمصدر محاسبي مركزي موثوق.', 'warning');
        return;
      }
      
      const newAdvance: HRAdvance = {
        id: `ADV-${Date.now().toString().slice(-4)}`,
        ...advanceForm,
        remainingAmount: advanceForm.amount,
        status: 'pending'
      };
      setAdvances(prev => [newAdvance, ...prev]);

      // Integrate with ledger to create a payment voucher (سند صرف سلفة)
      let ledgerAccounts: any[] = [];
      let paymentVouchers: any[] = [];
      try {
        const accs = localStorage.getItem('erp_chart_of_accounts_v2');
        if (accs) ledgerAccounts = JSON.parse(accs);
        const pvs = localStorage.getItem('erp_payment_vouchers_v2');
        if (pvs) paymentVouchers = JSON.parse(pvs);
      } catch (err) {}

      const bankSafe = settings.defaultBankSafeAccount || '1101';
      const pvId = `PV-2026-ADV${Date.now().toString().slice(-3)}`;

      SQLTransactionEngine.run({
        operationName: `GENERATE_ADVANCE_PAYMENT (صرف سلفة للموظف)`,
        tenantId: 'school_1',
        userId: 'mgr_hr',
        userName: 'مدير الموارد البشرية',
        ipAddress: '192.168.1.100',
        affectedTables: ['accounts_ledger', 'voucher_payments'],
        validationBlock: () => ({ valid: true }),
        authorizationBlock: () => ({ authorized: true }),
        executionBlock: () => {
          // Credit Bank/Safe
          if (ledgerAccounts.length > 0) {
            const updated = ledgerAccounts.map((a: any) => {
              if (a.code === bankSafe) return { ...a, balance: a.balance - advanceForm.amount };
              return a;
            });
            localStorage.setItem('erp_chart_of_accounts_v2', JSON.stringify(updated));
          }

          // Create Payment Voucher
          const emp = employees.find(x => x.id === advanceForm.employeeId);
          const newVoucher = {
            id: pvId,
            date: advanceForm.date,
            beneficiary: emp ? emp.name : 'موظف سلفة',
            costCenter: emp ? emp.costCenter : 'admin',
            paidFromAccount: bankSafe,
            paidToAccount: '1230', // Advances account
            amount: advanceForm.amount,
            against: `صرف سلفة للموظف بقيمة ${advanceForm.amount} تُسترد على ${advanceForm.installments} شهور`,
            attachmentName: null,
            paymentMethod: bankSafe === '1102' ? 'تحويل' : 'نقدي',
            status: 'معتمد' as const,
            notes: `سلفة مستردة • القسط الشهري: ${advanceForm.deductionPerMonth}`
          };
          localStorage.setItem('erp_payment_vouchers_v2', JSON.stringify([newVoucher, ...paymentVouchers]));
          return true;
        },
        nestedSqlQueries: []
      });

      triggerNotification(`✓ تم اعتماد طلب السلفة بنجاح، وصرف المبلغ بموجب سند الصرف ${pvId} المضاف آلياً لليومية العامة`, 'success');
      setShowAddModal(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">السلف والمستحقات المستردة</h3>
            <p className="text-xs text-slate-400">إدارة القروض والسلف المالية الممنوحة للعاملين مع الاسترداد الآلي عبر مسير الرواتب.</p>
          </div>
          <button 
            onClick={() => { setAdvanceForm({ employeeId: '', amount: 0, date: new Date().toISOString().split('T')[0], installments: 0, deductionPerMonth: 0, reason: '' }); setShowAddModal(true); }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>منح سلفة جديدة</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold">
                <th className="p-4">كود السلفة</th>
                <th className="p-4">الموظف المقترض</th>
                <th className="p-4 text-center">تاريخ المنح</th>
                <th className="p-4 text-center">مبلغ السلفة الأصلي</th>
                <th className="p-4 text-center">أشهر الاسترداد</th>
                <th className="p-4 text-center">القسط الشهري</th>
                <th className="p-4 text-center">الرصيد المتبقي</th>
                <th className="p-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {advances.map(a => {
                const emp = employees.find(e => e.id === a.employeeId);
                return (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-500">{a.id}</td>
                    <td className="p-4 font-bold text-white">{emp ? emp.name : 'غير معروف'}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{a.date}</td>
                    <td className="p-4 text-center font-bold text-emerald-400 font-mono">{formatCurrency(a.amount, true)}</td>
                    <td className="p-4 text-center font-semibold text-slate-200">{a.installments} شهور</td>
                    <td className="p-4 text-center font-mono font-bold text-rose-400">-{formatCurrency(a.deductionPerMonth, true)}</td>
                    <td className="p-4 text-center font-mono font-bold text-amber-500">{formatCurrency(a.remainingAmount, true)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.remainingAmount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>{a.remainingAmount > 0 ? 'جار التحصيل' : 'مستردة بالكامل'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal advances */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveAdvance} className="bg-slate-900 border border-slate-700 w-full max-w-md overflow-hidden text-xs text-slate-300">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                <h4 className="font-bold text-white text-sm">تقديم وإقرار سلفة مالية للموظف</h4>
                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label>الموظف المستفيد</label>
                  <select value={advanceForm.employeeId} onChange={e => setAdvanceForm(p=>({...p, employeeId: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>قيمة القرض / السلفة</label>
                    <input type="number" required value={advanceForm.amount} onChange={e => {
                      const val = Number(e.target.value);
                      setAdvanceForm(p=>({...p, amount: val, deductionPerMonth: parseFloat((val / p.installments).toFixed(1))}));
                    }} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono text-emerald-400 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label>تاريخ صرف السلفة</label>
                    <input type="date" required value={advanceForm.date} onChange={e => setAdvanceForm(p=>({...p, date: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>فترة الاسترداد (شهور)</label>
                    <input type="number" required value={advanceForm.installments} onChange={e => {
                      const inst = Math.max(1, Number(e.target.value));
                      setAdvanceForm(p=>({...p, installments: inst, deductionPerMonth: parseFloat((p.amount / inst).toFixed(1))}));
                    }} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label>الخصم والاستقطاع الشهري</label>
                    <input type="number" readOnly value={advanceForm.deductionPerMonth} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-400 font-mono font-bold" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label>موجب وسبب السلفة</label>
                  <textarea required value={advanceForm.reason} onChange={e => setAdvanceForm(p=>({...p, reason: e.target.value}))} rows={2} placeholder="دواعي عائلية أو شراء سيارة أو زواج..." className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none" />
                </div>
              </div>
              <div className="bg-slate-800 p-4 flex justify-end gap-2 border-t border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-700 px-4 py-2 rounded text-slate-300">إلغاء</button>
                <button type="submit" className="bg-[#dfb55a] text-slate-950 font-bold px-5 py-2 rounded">اعتماد السلفة وصرفها</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 8. REWARDS
  if (activeTab === 'rewards') {
    const handleSaveReward = (e: React.FormEvent) => {
      e.preventDefault();
      if (FallbackStorage.isCanonicalPersistenceRequired()) { triggerNotification('اعتماد المكافآت متوقف حتى يتم ربط مصدر الموارد البشرية المركزي.', 'warning'); return; }
      const newBonus: HRBonus = {
        id: `REW-${Date.now().toString().slice(-4)}`,
        ...rewardForm,
        status: 'pending'
      };
      setRewards(prev => [newBonus, ...prev]);

      setEmployees(prev => prev.map(emp => {
        if (emp.id === rewardForm.employeeId) {
          const logs = [...emp.auditLogs];
          logs.unshift({
            action: 'منح مكافأة تشجيعية',
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            user: 'مدير الموارد البشرية',
            details: `منح مكافأة مالية بقيمة ${rewardForm.amount} لأجل ${rewardForm.reason}`
          });
          return { ...emp, auditLogs: logs };
        }
        return emp;
      }));

      triggerNotification('✓ تم اعتماد ومنح المكافأة بنجاح، وستضاف تلقائياً لصافي مستحقات الموظف بالمرتب', 'success');
      setShowAddModal(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">المكافآت والتحفيزات المالية الاستثنائية</h3>
            <p className="text-xs text-slate-400">منح المزايا الاستثنائية والزيادات المؤقتة تحفيزاً للعاملين وإضافتها لمسير المرتبات.</p>
          </div>
          <button 
            onClick={() => { setRewardForm({ employeeId: '', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }); setShowAddModal(true); }}
            className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>منح مكافأة تشجيعية</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold">
                <th className="p-4">كود المكافأة</th>
                <th className="p-4">الموظف المتميز</th>
                <th className="p-4 text-center">تاريخ الاستحقاق</th>
                <th className="p-4 text-center">قيمة المكافأة</th>
                <th className="p-4">السبب والداعي الإداري</th>
                <th className="p-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {rewards.map(r => {
                const emp = employees.find(e => e.id === r.employeeId);
                return (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-500">{r.id}</td>
                    <td className="p-4 font-bold text-white">{emp ? emp.name : 'غير معروف'}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{r.date}</td>
                    <td className="p-4 text-center font-bold text-emerald-400 font-mono">+{formatCurrency(r.amount, true)}</td>
                    <td className="p-4 font-semibold text-slate-200">{r.reason}</td>
                    <td className="p-4 text-center">
                      <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-500/20">معتمدة</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal reward */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveReward} className="bg-slate-900 border border-slate-700 w-full max-w-md overflow-hidden text-xs text-slate-300">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                <h4 className="font-bold text-white text-sm">منح مكافأة مالية تشجيعية للموظف</h4>
                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label>الموظف المتميز</label>
                  <select value={rewardForm.employeeId} onChange={e => setRewardForm(p=>({...p, employeeId: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>قيمة المكافأة الاستثنائية</label>
                    <input type="number" required value={rewardForm.amount} onChange={e => setRewardForm(p=>({...p, amount: Number(e.target.value)}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono text-emerald-400 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label>تاريخ الاستحقاق والصرف</label>
                    <input type="date" required value={rewardForm.date} onChange={e => setRewardForm(p=>({...p, date: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label>الموجب والسبب التحفيزي للمكافأة</label>
                  <textarea required value={rewardForm.reason} onChange={e => setRewardForm(p=>({...p, reason: e.target.value}))} rows={3} placeholder="مثال: جهود استثنائية في إعداد وتنظيم لجان الامتحانات الدورية" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none" />
                </div>
              </div>
              <div className="bg-slate-800 p-4 flex justify-end gap-2 border-t border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-700 px-4 py-2 rounded text-slate-300">إلغاء</button>
                <button type="submit" className="bg-[#dfb55a] text-slate-950 font-bold px-5 py-2 rounded">منح المكافأة فوراً</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 9. PERFORMANCE EVALUATIONS
  if (activeTab === 'performance') {
    const handleSavePerf = (e: React.FormEvent) => {
      e.preventDefault();
      if (FallbackStorage.isCanonicalPersistenceRequired()) { triggerNotification('حفظ التقييمات متوقف حتى يتم ربط مصدر الموارد البشرية المركزي.', 'warning'); return; }
      const newPerf: HRPerformance = {
        id: `EV-${Date.now().toString().slice(-4)}`,
        ...perfForm
      };
      setPerformance(prev => [newPerf, ...prev]);
      triggerNotification('✓ تم رصد وتوثيق تقييم الأداء المعتمد للموظف بالملف الرقمي', 'success');
      setShowAddModal(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">تقييم الأداء السنوي والدوري</h3>
            <p className="text-xs text-slate-400">تسجيل مراجعات الكفاءة، رصد نقاط القوة، التوصيات التدريبية، والدرجة المكتسبة (0-100).</p>
          </div>
          <button 
            onClick={() => { setPerfForm({ employeeId: '', date: new Date().toISOString().split('T')[0], score: 0, reviewer: '', strengths: '', improvements: '', trainingNeeds: '' }); setShowAddModal(true); }}
            className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:opacity-90 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>إجراء تقييم أداء جديد</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold">
                <th className="p-4">كود المراجعة</th>
                <th className="p-4">الموظف المعني</th>
                <th className="p-4 text-center">التاريخ الدوري</th>
                <th className="p-4 text-center">التقييم والدرجة الكلية</th>
                <th className="p-4">أبرز نقاط القوة</th>
                <th className="p-4">المراجع المقيّم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {performance.map(p => {
                const emp = employees.find(e => e.id === p.employeeId);
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-500">{p.id}</td>
                    <td className="p-4 font-bold text-white">{emp ? emp.name : 'غير معروف'}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{p.date}</td>
                    <td className="p-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded font-mono ${
                        p.score >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                        p.score >= 80 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{p.score}% ({p.score >= 90 ? 'ممتاز' : p.score >= 80 ? 'جيد جداً' : 'جيد'})</span>
                    </td>
                    <td className="p-4 truncate max-w-[250px]">{p.strengths}</td>
                    <td className="p-4 font-semibold">{p.reviewer}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal performance */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSavePerf} className="bg-slate-900 border border-slate-700 w-full max-w-lg overflow-hidden text-xs text-slate-300">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                <h4 className="font-bold text-white text-sm">تقييم الأداء والكفاءة المهنية</h4>
                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>الموظف المقيّم</label>
                    <select value={perfForm.employeeId} onChange={e => setPerfForm(p=>({...p, employeeId: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>تاريخ التقييم</label>
                    <input type="date" required value={perfForm.date} onChange={e => setPerfForm(p=>({...p, date: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>الدرجة الممنوحة (0-100)</label>
                    <input type="number" required min="0" max="100" value={perfForm.score} onChange={e => setPerfForm(p=>({...p, score: Number(e.target.value)}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono font-bold text-yellow-400" />
                  </div>
                  <div className="space-y-1">
                    <label>المقيّم المسؤول</label>
                    <input type="text" required value={perfForm.reviewer} onChange={e => setPerfForm(p=>({...p, reviewer: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label>أهم نقاط القوة والتميز</label>
                  <input type="text" required value={perfForm.strengths} onChange={e => setPerfForm(p=>({...p, strengths: e.target.value}))} placeholder="توضيح الكفاءة والمهارات الإيجابية" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div className="space-y-1">
                  <label>جوانب التطوير والتحسين المطلوبة</label>
                  <input type="text" required value={perfForm.improvements} onChange={e => setPerfForm(p=>({...p, improvements: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div className="space-y-1">
                  <label>الاحتياجات التدريبية والتوصيات</label>
                  <input type="text" required value={perfForm.trainingNeeds} onChange={e => setPerfForm(p=>({...p, trainingNeeds: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                </div>
              </div>
              <div className="bg-slate-800 p-4 flex justify-end gap-2 border-t border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-700 px-4 py-2 rounded text-slate-300">إلغاء</button>
                <button type="submit" className="bg-[#dfb55a] text-slate-950 font-bold px-5 py-2 rounded">حفظ التقييم للملف</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 10. DOCUMENTS
  if (activeTab === 'documents') {
    const handleSaveDoc = (e: React.FormEvent) => {
      e.preventDefault();
      if (FallbackStorage.isCanonicalPersistenceRequired()) { triggerNotification('حفظ الوثائق متوقف حتى يتم ربط مصدر الموارد البشرية المركزي.', 'warning'); return; }
      const newDoc: HRDocument = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        ...docForm,
        status: 'valid'
      };
      setDocuments(prev => [newDoc, ...prev]);
      triggerNotification('✓ تم تسجيل وحفظ الوثيقة الثبوتية بملف الموظف الرقمي بنجاح', 'success');
      setShowAddModal(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">أرشيف الوثائق والمستندات الثبوتية</h3>
            <p className="text-xs text-slate-400">أرشفة جوازات السفر، البطاقات الشخصية، الرخص، المؤهلات العلمية للعاملين وتواريخ الصلاحية.</p>
          </div>
          <button 
            onClick={() => { setDocForm({ employeeId: employees[0]?.id || '', title: 'جواز السفر الإلكتروني', type: 'passport', issueDate: '2021-01-01', expiryDate: '2028-12-31' }); setShowAddModal(true); }}
            className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:opacity-90 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مستند جديد</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold">
                <th className="p-4">كود الأرشفة</th>
                <th className="p-4">الموظف صاحب المستند</th>
                <th className="p-4">عنوان المستند والوثيقة</th>
                <th className="p-4 text-center">نوع الوثيقة</th>
                <th className="p-4 text-center">تاريخ الإصدار</th>
                <th className="p-4 text-center">تاريخ الانتهاء للصلاحية</th>
                <th className="p-4 text-center">حالة الصلاحية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {documents.map(d => {
                const emp = employees.find(e => e.id === d.employeeId);
                return (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-500">{d.id}</td>
                    <td className="p-4 font-bold text-white">{emp ? emp.name : 'غير معروف'}</td>
                    <td className="p-4 font-semibold text-slate-200">{d.title}</td>
                    <td className="p-4 text-center">{d.type === 'passport' ? 'جواز سفر' : d.type === 'id' ? 'بطاقة شخصية' : 'شهادة علمية / رخصة'}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{d.issueDate}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{d.expiryDate}</td>
                    <td className="p-4 text-center">
                      <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-500/20">صالحة ونافذة</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal documents */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveDoc} className="bg-slate-900 border border-slate-700 w-full max-w-md overflow-hidden text-xs text-slate-300">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                <h4 className="font-bold text-white text-sm">أرشفة وتسجيل مستند ثبوتي للموظف</h4>
                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label>صاحب المستند</label>
                  <select value={docForm.employeeId} onChange={e => setDocForm(p=>({...p, employeeId: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label>عنوان الوثيقة</label>
                  <input type="text" required value={docForm.title} onChange={e => setDocForm(p=>({...p, title: e.target.value}))} placeholder="مثال: جواز السفر الوطني الإلكتروني" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div className="space-y-1">
                  <label>نوع الوثيقة والمستند</label>
                  <select value={docForm.type} onChange={e => setDocForm(p=>({...p, type: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                    <option value="passport">جواز سفر إلكتروني</option>
                    <option value="id">البطاقة الشخصية / الرقم الوطني</option>
                    <option value="degree">الشهادة الجامعية / الأكاديمية</option>
                    <option value="license">رخصة القيادة / فحص طبي</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label>تاريخ إصدار المستند</label>
                    <input type="date" required value={docForm.issueDate} onChange={e => setDocForm(p=>({...p, issueDate: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label>تاريخ انتهاء الصلاحية</label>
                    <input type="date" required value={docForm.expiryDate} onChange={e => setDocForm(p=>({...p, expiryDate: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-4 flex justify-end gap-2 border-t border-slate-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-700 px-4 py-2 rounded text-slate-300">إلغاء</button>
                <button type="submit" className="bg-[#dfb55a] text-slate-950 font-bold px-5 py-2 rounded">حفظ وأرشفة الوثيقة</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 11. SETTINGS
  if (activeTab === 'settings') {
    const handleSaveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      if (FallbackStorage.isCanonicalPersistenceRequired()) { triggerNotification('حفظ إعدادات الموارد البشرية متوقف حتى يتم ربط المصدر المركزي.', 'warning'); return; }
      triggerNotification('✓ تم حفظ الإعدادات وقواعد الاحتساب ووحدة الحسابات العامة للموارد البشرية بنجاح', 'success');
    };

    return (
      <div className="space-y-6">
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 overflow-hidden text-xs text-slate-300">
          <div className="bg-slate-800 p-5 border-b border-slate-700">
            <h3 className="font-bold text-white text-sm">تهيئة قواعد وإعدادات الموارد البشرية والرواتب</h3>
            <p className="text-slate-400 mt-1">اضبط مواعيد الحضور، معدل الخصم، واربط الحسابات المقابلة لتسهيل عملية الترحيل التلقائي.</p>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Standard Work hours */}
            <div>
              <h4 className="font-bold text-[#dfb55a] border-b border-slate-800 pb-1.5 mb-4 uppercase">أولاً: الوردية الدورية ومواعيد الدوام</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">ساعة بدء الدوام الرسمي</label>
                  <input type="time" value={settings.workingHoursStart} onChange={e => setSettings(p=>({...p, workingHoursStart: e.target.value}))} className="w-full bg-slate-850 border border-slate-700 rounded p-2 text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">ساعة الانصراف المعتمدة</label>
                  <input type="time" value={settings.workingHoursEnd} onChange={e => setSettings(p=>({...p, workingHoursEnd: e.target.value}))} className="w-full bg-slate-850 border border-slate-700 rounded p-2 text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">معدل اقتطاع التأخير الفوري (ساعة/ساعة)</label>
                  <input type="number" step="0.1" value={settings.lateDeductionRate} onChange={e => setSettings(p=>({...p, lateDeductionRate: Number(e.target.value)}))} className="w-full bg-slate-850 border border-slate-700 rounded p-2 text-white font-mono" />
                </div>
              </div>
            </div>

            {/* General Ledger Syncing */}
            <div>
              <h4 className="font-bold text-[#dfb55a] border-b border-slate-800 pb-1.5 mb-4 uppercase">ثانياً: ربط الحسابات المزدوجة بالدفتر العام للشركة</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">حساب أصل السداد المالي (صندوق الخزينة أو البنك الجاري)</label>
                  <select value={settings.defaultBankSafeAccount} onChange={e => setSettings(p=>({...p, defaultBankSafeAccount: e.target.value}))} className="w-full bg-slate-850 border border-slate-700 rounded p-2.5 text-white">
                    <option value="1101">1101 • صندوق الخزينة الرئيسي المدرسية (كاش)</option>
                    <option value="1102">1102 • حساب مصرف الوحدة الجاري الرئيسي</option>
                    <option value="1110">1110 • صندوق الروضة (كاش فرعي)</option>
                    <option value="1120">1120 • صندوق الابتدائي (كاش فرعي)</option>
                  </select>
                  <p className="text-[10px] text-slate-500">الحساب الذي سُتقتطع منه السيولة النقدية تلقائياً عند اعتماد مسير الرواتب أو صرف سلفة.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">حساب مصروفات الرواتب والأجور والمزايا</label>
                  <select value={settings.defaultSalariesExpenseAccount} onChange={e => setSettings(p=>({...p, defaultSalariesExpenseAccount: e.target.value}))} className="w-full bg-slate-850 border border-slate-700 rounded p-2.5 text-white">
                    <option value="5101">5101 • مصروف رواتب وأجور المعلمين والأكاديميين الكلي</option>
                    <option value="5100">5100 • مصروف الرواتب والأجور والمزايا العامة</option>
                  </select>
                  <p className="text-[10px] text-slate-500">حساب المصروف الذي سيُحمّل بالقيمة المدينة الكلية للمرتبات المعتمدة.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-slate-850 p-4 border-t border-slate-700 flex justify-end gap-3">
            <button type="submit" className="bg-gradient-to-r from-[#dfb55a] to-[#c99e4c] hover:opacity-90 text-slate-950 font-bold px-6 py-2 rounded-lg shadow">
              حفظ وتطبيق إعدادات الربط
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Fallback for unexpected tab names
  return (
    <div className="p-12 text-center text-slate-500">
      <HelpCircle className="w-12 h-12 mx-auto mb-3" />
      <p className="font-bold">يرجى اختيار علامة التبويب المراد استعراضها.</p>
    </div>
  );
}
