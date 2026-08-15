import { AlertTriangle, Award, BookOpen, Briefcase, Calendar, Check, CheckSquare, ChevronDown, Clock, CreditCard, DollarSign, Download, Edit, Eye, Filter, Grid, History as HistoryIcon, List, Mail, MapPin, Paperclip, Phone, Plus, Printer, Search, ShieldCheck, Trash2, User, X } from 'lucide-react';
import React, { useState } from 'react';
import { HREmployee, HRDepartment, HRJob, HRContract, HRLeave, HRBonus, HRPenalty, HRPerformance, HRDocument } from './types';

interface EmployeesTabProps {
  employees: HREmployee[];
  setEmployees: React.Dispatch<React.SetStateAction<HREmployee[]>>;
  departments: HRDepartment[];
  jobs: HRJob[];
  contracts?: HRContract[];
  leaves?: HRLeave[];
  rewards?: HRBonus[];
  penalties?: HRPenalty[];
  performance?: HRPerformance[];
  documents?: HRDocument[];
  formatCurrency: (amount: number, showSymbol?: boolean) => string;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'error') => void;
  costCenterLabels: Record<string, string>;
}

export default function EmployeesTab({
  employees,
  setEmployees,
  departments,
  jobs,
  contracts = [],
  leaves = [],
  rewards = [],
  penalties = [],
  performance = [],
  documents = [],
  formatCurrency,
  triggerNotification,
  costCenterLabels
}: EmployeesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [costCenterFilter, setCostCenterFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Selected employee for detail view modal
  const [selectedEmp, setSelectedEmp] = useState<HREmployee | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'timeline' | 'activity_log' | 'alerts'>('details');
  const [logSearch, setLogSearch] = useState('');

  // Create / Edit modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<HREmployee | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formJobId, setFormJobId] = useState('');
  const [formHiringDate, setFormHiringDate] = useState('');
  const [formCostCenter, setFormCostCenter] = useState<'kindergarten' | 'primary' | 'middle' | 'secondary' | 'admin'>('admin');
  const [formStatus, setFormStatus] = useState<'active' | 'on_leave' | 'resigned' | 'suspended'>('active');
  const [formDegree, setFormDegree] = useState('');
  const [formMajor, setFormMajor] = useState('');
  const [formExperienceYears, setFormExperienceYears] = useState(0);
  const [formTraining, setFormTraining] = useState('');
  const [formBasicSalary, setFormBasicSalary] = useState(0);
  const [formBankName, setFormBankName] = useState('');
  const [formIban, setFormIban] = useState('');
  const [formProfileImage, setFormProfileImage] = useState('');

  // Handle open Form Modal for Create
  const handleOpenCreate = () => {
    setEditingEmp(null);
    setFormName('');
    setFormNationalId('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormBirthDate('1990-01-01');
    setFormGender('male');
    setFormDepartmentId(departments[0]?.id || '');
    setFormJobId(jobs[0]?.id || '');
    setFormHiringDate(new Date().toISOString().split('T')[0]);
    setFormCostCenter('admin');
    setFormStatus('active');
    setFormDegree('بكالوريوس');
    setFormMajor('');
    setFormExperienceYears(3);
    setFormTraining('');
    setFormBasicSalary(3500);
    setFormBankName('مصرف الوحدة');
    setFormIban('');
    setFormProfileImage('');
    setShowFormModal(true);
  };

  // Handle open Form Modal for Edit
  const handleOpenEdit = (emp: HREmployee) => {
    setEditingEmp(emp);
    setFormName(emp.name);
    setFormNationalId(emp.nationalId);
    setFormPhone(emp.phone);
    setFormEmail(emp.email);
    setFormAddress(emp.address);
    setFormBirthDate(emp.birthDate);
    setFormGender(emp.gender);
    setFormDepartmentId(emp.departmentId);
    setFormJobId(emp.jobId);
    setFormHiringDate(emp.hiringDate);
    setFormCostCenter(emp.costCenter);
    setFormStatus(emp.status);
    setFormDegree(emp.degree);
    setFormMajor(emp.major);
    setFormExperienceYears(emp.experienceYears);
    setFormTraining(emp.trainingCourses.join(', '));
    setFormBasicSalary(emp.basicSalary);
    setFormBankName(emp.bankName);
    setFormIban(emp.iban);
    setFormProfileImage(emp.profileImage || '');
    setShowFormModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formNationalId || !formPhone || !formEmail) {
      triggerNotification('الرجاء تعبئة البيانات الأساسية المطلوبة', 'warning');
      return;
    }

    const trainingList = formTraining ? formTraining.split(',').map(s => s.trim()).filter(Boolean) : [];

    if (editingEmp) {
      // Edit mode
      const updatedList = employees.map(emp => {
        if (emp.id === editingEmp.id) {
          const changeLogs = [...emp.auditLogs];
          
          if (emp.basicSalary !== formBasicSalary) {
            changeLogs.unshift({
              action: 'تعديل الراتب',
              date: new Date().toISOString().replace('T', ' ').substring(0, 16),
              user: 'مدير الموارد البشرية',
              details: `تعديل الراتب الأساسي من ${emp.basicSalary} إلى ${formBasicSalary}`
            });
          }
          if (emp.status !== formStatus) {
            changeLogs.unshift({
              action: 'تغيير الحالة',
              date: new Date().toISOString().replace('T', ' ').substring(0, 16),
              user: 'مدير الموارد البشرية',
              details: `تغيير الحالة الوظيفية من ${emp.status} إلى ${formStatus}`
            });
          }

          return {
            ...emp,
            name: formName,
            nationalId: formNationalId,
            phone: formPhone,
            email: formEmail,
            address: formAddress,
            birthDate: formBirthDate,
            gender: formGender,
            departmentId: formDepartmentId,
            jobId: formJobId,
            hiringDate: formHiringDate,
            costCenter: formCostCenter,
            status: formStatus,
            degree: formDegree,
            major: formMajor,
            experienceYears: Number(formExperienceYears),
            trainingCourses: trainingList,
            basicSalary: Number(formBasicSalary),
            bankName: formBankName,
            iban: formIban,
            profileImage: formProfileImage,
            auditLogs: changeLogs
          };
        }
        return emp;
      });
      setEmployees(updatedList);
      triggerNotification('✓ تم تعديل بيانات الموظف بنجاح', 'success');
    } else {
      // Create mode
      const newEmp: HREmployee = {
        id: `EMP-${Date.now().toString().slice(-4)}`,
        name: formName,
        nationalId: formNationalId,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        birthDate: formBirthDate,
        gender: formGender,
        departmentId: formDepartmentId,
        jobId: formJobId,
        hiringDate: formHiringDate,
        costCenter: formCostCenter,
        status: formStatus,
        degree: formDegree,
        major: formMajor,
        experienceYears: Number(formExperienceYears),
        trainingCourses: trainingList,
        basicSalary: Number(formBasicSalary),
        bankName: formBankName,
        iban: formIban,
        profileImage: formProfileImage,
        allowances: [{ name: 'بدل نقل وسكن', amount: 350 }],
        attachments: [
          { name: 'عقد العمل المعتمد.pdf', type: 'PDF', date: new Date().toISOString().split('T')[0], size: '1.2 MB' }
        ],
        auditLogs: [
          {
            action: 'إنشاء ملف موظف',
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            user: 'مدير الموارد البشرية',
            details: 'تأسيس ملف الموظف الرقمي الجديد بالمنظومة بنجاح'
          }
        ]
      };
      setEmployees(prev => [newEmp, ...prev]);
      triggerNotification('✓ تم تعيين الموظف وإدراجه بالمنظومة بنجاح', 'success');
    }
    setShowFormModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف ملف هذا الموظف نهائياً؟')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      triggerNotification('تم حذف ملف الموظف بنجاح', 'success');
      if (selectedEmp?.id === id) {
        setSelectedEmp(null);
      }
    }
  };

  // Simulate file upload
  const handleSimulateUpload = () => {
    if (!selectedEmp) return;
    const name = prompt('أدخل اسم المستند (مثال: البطاقة الشخصية، شهادة الخبرة):');
    if (!name) return;
    
    const updated = employees.map(emp => {
      if (emp.id === selectedEmp.id) {
        const newAttachments = [
          ...emp.attachments,
          { 
            name: `${name}.pdf`, 
            type: 'PDF', 
            date: new Date().toISOString().split('T')[0], 
            size: '850 KB' 
          }
        ];
        return { ...emp, attachments: newAttachments };
      }
      return emp;
    });
    setEmployees(updated);
    // update current selected view
    const found = updated.find(e => e.id === selectedEmp.id);
    if (found) setSelectedEmp(found);
    triggerNotification('✓ تم تحميل المرفق وإدراجه بملف الموظف بنجاح', 'success');
  };

  // Export to Excel simulation (CSV)
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "كود الموظف,الاسم الكامل,الرقم الوطني,الهاتف,البريد الإلكتروني,القسم,الوظيفة,تاريخ التعيين,مركز التكلفة,الراتب الأساسي,الحالة\n";
    
    employees.forEach(e => {
      const dept = departments.find(d => d.id === e.departmentId)?.nameAr || '';
      const job = jobs.find(j => j.id === e.jobId)?.titleAr || '';
      const cc = costCenterLabels[e.costCenter] || '';
      const statusAr = e.status === 'active' ? 'نشط' : e.status === 'on_leave' ? 'إجازة' : 'معلق';
      
      csvContent += `${e.id},${e.name},${e.nationalId},${e.phone},${e.email},${dept},${job},${e.hiringDate},${cc},${e.basicSalary},${statusAr}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `سجل_بيانات_العاملين_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('✓ تم تصدير ملف بيانات الموظفين بنجاح', 'success');
  };

  // Print Profile Function
  const handlePrintProfile = (emp: HREmployee) => {
    const dept = departments.find(d => d.id === emp.departmentId)?.nameAr || 'غير محدد';
    const job = jobs.find(j => j.id === emp.jobId)?.titleAr || 'غير محدد';
    const cc = costCenterLabels[emp.costCenter] || 'غير محدد';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>ملف بيانات موظف - ${emp.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #dfb55a; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 5px 0; font-size: 24px; color: #1e293b; }
          .profile-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; }
          .field { margin-bottom: 10px; }
          .field span { font-weight: bold; color: #475569; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>مدرسة النور الدولية بالمنظومة الموحدة</h2>
          <h1>ملف التعريف المالي والوظيفي للعاملين</h1>
          <p>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        
        <div class="section-title">أولاً: البيانات الشخصية والاتصال</div>
        <div class="profile-grid">
          <div class="field"><span>كود الموظف:</span> ${emp.id}</div>
          <div class="field"><span>الاسم الكامل:</span> ${emp.name}</div>
          <div class="field"><span>الرقم الوطني:</span> ${emp.nationalId}</div>
          <div class="field"><span>الجنس:</span> ${emp.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
          <div class="field"><span>تاريخ الميلاد:</span> ${emp.birthDate}</div>
          <div class="field"><span>رقم الهاتف:</span> ${emp.phone}</div>
          <div class="field"><span>البريد الإلكتروني:</span> ${emp.email}</div>
          <div class="field"><span>العنوان السكني:</span> ${emp.address}</div>
        </div>

        <div class="section-title">ثانياً: التعيين والموقع الوظيفي</div>
        <div class="profile-grid">
          <div class="field"><span>القسم:</span> ${dept}</div>
          <div class="field"><span>المسمى الوظيفي:</span> ${job}</div>
          <div class="field"><span>تاريخ التعيين:</span> ${emp.hiringDate}</div>
          <div class="field"><span>مركز التكلفة:</span> ${cc}</div>
          <div class="field"><span>الحالة الوظيفية:</span> ${emp.status === 'active' ? 'على رأس العمل' : emp.status === 'on_leave' ? 'في إجازة رسمية' : 'موقوف / معلق'}</div>
        </div>

        <div class="section-title">ثالثاً: المؤهلات والتدريب</div>
        <div class="profile-grid">
          <div class="field"><span>المؤهل العلمي:</span> ${emp.degree}</div>
          <div class="field"><span>التخصص:</span> ${emp.major}</div>
          <div class="field"><span>سنوات الخبرة:</span> ${emp.experienceYears} سنوات</div>
          <div class="field"><span>الدورات المعتمدة:</span> ${emp.trainingCourses.join(', ') || 'لا يوجد'}</div>
        </div>

        <div class="section-title">رابعاً: الهيكل المالي والحساب البنكي</div>
        <div class="profile-grid">
          <div class="field"><span>الراتب الأساسي:</span> ${formatCurrency(emp.basicSalary, true)}</div>
          <div class="field"><span>اسم البنك:</span> ${emp.bankName}</div>
          <div class="field"><span>رقم الآيبان (IBAN):</span> ${emp.iban || 'غير متوفر'}</div>
        </div>

        <div class="footer">
          <p>تعتبر هذه الوثيقة مستنداً رقمياً داخلياً معتمداً من وحدة الموارد البشرية والرواتب بالمدرسة</p>
          <p>© منظومة إدارة الموارد البشرية المتكاملة - ERP Suite</p>
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter logic
  const filtered = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.nationalId.includes(searchTerm);
    const matchesDept = deptFilter === 'all' || emp.departmentId === deptFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchesCC = costCenterFilter === 'all' || emp.costCenter === costCenterFilter;
    
    return matchesSearch && matchesDept && matchesStatus && matchesCC;
  });

  return (
    <div className="space-y-6">
      {/* Interactive Employee Analytics Dashboard Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/40 p-5 border border-slate-800">
        <div className="relative overflow-hidden bg-slate-950/60 p-4.5 border border-slate-800 flex items-center justify-between">
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-xl" />
          <div className="space-y-1">
            <span className="text-[10px] text-amber-400 block font-bold uppercase tracking-wide">إجمالي طاقم العمل</span>
            <span className="text-2xl font-black text-white font-mono">{employees.length}</span>
            <p className="text-[9px] text-slate-500">منهم {employees.filter(e => e.gender === 'female').length} إناث و {employees.filter(e => e.gender === 'male').length} ذكور</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-950/60 p-4.5 border border-slate-800 flex items-center justify-between">
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400 block font-bold uppercase tracking-wide">النشطين بالمدرسة</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {employees.filter(e => e.status === 'active').length}
            </span>
            <p className="text-[9px] text-slate-500">حالة انضباط مستمرة بنشاط الكادر</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-950/60 p-4.5 border border-slate-800 flex items-center justify-between">
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-xl" />
          <div className="space-y-1">
            <span className="text-[10px] text-[#dfb55a] block font-bold uppercase tracking-wide">متوسط الخبرة التراكمية</span>
            <span className="text-2xl font-black text-[#dfb55a] font-mono">
              {employees.length > 0 ? (employees.reduce((acc, e) => acc + e.experienceYears, 0) / employees.length).toFixed(1) : 0} عاماً
            </span>
            <p className="text-[9px] text-slate-500">كادر تعليمي وإداري بمستوى كفاءة متميز</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-[#dfb55a]">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-950/60 p-4.5 border border-slate-800 flex items-center justify-between">
          <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-500/5 rounded-full blur-xl" />
          <div className="space-y-1">
            <span className="text-[10px] text-yellow-400 block font-bold uppercase tracking-wide">الالتزام المالي الأساسي</span>
            <span className="text-base font-black text-white font-mono">
              {formatCurrency(employees.reduce((acc, e) => acc + e.basicSalary, 0), true)}
            </span>
            <p className="text-[9px] text-slate-500">مجموع الرواتب شهرياً دون إضافات</p>
          </div>
          <div className="p-3 bg-yellow-500/10 text-yellow-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-slate-900/40 p-4 border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
          {/* Main search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم، الكود، أو الرقم الوطني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pr-9 pl-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#dfb55a]"
            />
          </div>

          {/* Department Filter */}
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">كل الأقسام</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.nameAr}</option>
            ))}
          </select>

          {/* Cost Center Filter */}
          <select 
            value={costCenterFilter}
            onChange={(e) => setCostCenterFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">كل مراكز التكلفة</option>
            {Object.entries(costCenterLabels).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">كل الحالات الوظيفية</option>
            <option value="active">على رأس العمل</option>
            <option value="on_leave">في إجازة</option>
            <option value="suspended">موقوف مؤقتاً</option>
            <option value="resigned">مستقيل / مغادر</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={exportToCSV}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-2 rounded-lg text-xs flex items-center gap-1 transition-colors"
            title="تصدير Excel"
          >
            <Download className="w-4 h-4 text-[#dfb55a]" />
            <span>تصدير Excel</span>
          </button>
          
          <div className="bg-slate-800 border border-slate-700 p-0.5 rounded-lg flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-[#dfb55a] text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-[#dfb55a] text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-[#dfb55a] to-[#c99e4c] hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>تعيين موظف جديد</span>
          </button>
        </div>
      </div>

      {/* Grid or List of Employees */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-800 p-12 text-center text-slate-400">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold">لم يتم العثور على موظفين يطابقون خيارات البحث والفلاتر</p>
          <button 
            onClick={() => { setSearchTerm(''); setDeptFilter('all'); setStatusFilter('all'); setCostCenterFilter('all'); }}
            className="text-[#dfb55a] text-xs underline mt-2 hover:text-[#ffe49e]"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(emp => {
            const dept = departments.find(d => d.id === emp.departmentId)?.nameAr || 'غير محدد';
            const job = jobs.find(j => j.id === emp.jobId)?.titleAr || 'غير محدد';
            return (
              <div 
                key={emp.id} 
                className="bg-slate-900/60 border border-slate-800 p-5 hover:border-[#dfb55a]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4">
                    {/* Employee Avatar */}
                    {emp.profileImage ? (
                      <img 
                        src={emp.profileImage} 
                        alt={emp.name} 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-[#dfb55a]/30 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-yellow-400 shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">
                          {emp.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          emp.status === 'on_leave' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          emp.status === 'suspended' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {emp.status === 'active' ? 'نشط' : emp.status === 'on_leave' ? 'إجازة' : emp.status === 'suspended' ? 'موقوف' : 'مستقيل'}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-white text-sm mt-1.5 hover:text-[#dfb55a] cursor-pointer" onClick={() => setSelectedEmp(emp)}>
                        {emp.name}
                      </h4>
                      <p className="text-xs text-[#dfb55a] font-medium mt-0.5">{job}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{dept}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">مركز التكلفة:</span>
                      <span className="font-semibold text-slate-300">{costCenterLabels[emp.costCenter]}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">الهاتف:</span>
                      <span className="font-semibold text-slate-300 font-mono">{emp.phone}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">الراتب الأساسي:</span>
                      <span className="font-bold text-white font-mono">{formatCurrency(emp.basicSalary, true)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                  <button 
                    onClick={() => setSelectedEmp(emp)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] py-1.5 rounded-md font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-yellow-400" />
                    <span>الملف التفصيلي</span>
                  </button>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-md"
                      title="تعديل البيانات"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-rose-400 rounded-md"
                      title="حذف الموظف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode - Traditional Professional Table */
        <div className="bg-slate-900/60 border border-slate-800 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-[11px] text-slate-400 uppercase font-bold">
                  <th className="p-4">الكود</th>
                  <th className="p-4">الموظف</th>
                  <th className="p-4">القسم والوظيفة</th>
                  <th className="p-4">الهاتف</th>
                  <th className="p-4">تاريخ التعيين</th>
                  <th className="p-4">مركز التكلفة</th>
                  <th className="p-4">الراتب الأساسي</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {filtered.map(emp => {
                  const dept = departments.find(d => d.id === emp.departmentId)?.nameAr || 'غير محدد';
                  const job = jobs.find(j => j.id === emp.jobId)?.titleAr || 'غير محدد';
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-400">{emp.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt="" className="w-8 h-8 rounded-full object-cover border border-[#dfb55a]/30" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-yellow-400">
                              {emp.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block hover:text-[#dfb55a] cursor-pointer" onClick={() => setSelectedEmp(emp)}>{emp.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{emp.nationalId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-semibold block">{job}</span>
                        <span className="text-[10px] text-slate-400">{dept}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">{emp.phone}</td>
                      <td className="p-4 font-mono text-slate-400">{emp.hiringDate}</td>
                      <td className="p-4 font-medium text-slate-300">{costCenterLabels[emp.costCenter]}</td>
                      <td className="p-4 font-bold text-emerald-400 font-mono">{formatCurrency(emp.basicSalary, true)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          emp.status === 'on_leave' ? 'bg-amber-500/10 text-amber-400' :
                          emp.status === 'suspended' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {emp.status === 'active' ? 'نشط' : emp.status === 'on_leave' ? 'إجازة' : emp.status === 'suspended' ? 'موقوف' : 'مستقيل'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setSelectedEmp(emp)} className="p-1 bg-slate-800 hover:bg-slate-700 text-yellow-400 rounded" title="عرض التفاصيل">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleOpenEdit(emp)} className="p-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded" title="تعديل">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(emp.id)} className="p-1 bg-slate-800 hover:bg-rose-950/40 text-rose-400 rounded" title="حذف">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== EMPLOYEE DETAIL VIEW MODAL ==================== */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
            
            {/* Modal Header */}
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-yellow-400 font-bold">
                  {selectedEmp.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedEmp.name}</h3>
                  <p className="text-xs text-slate-400">الملف الوظيفي التفصيلي المعتمد • {selectedEmp.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePrintProfile(selectedEmp)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-[#dfb55a]" />
                  <span>طباعة الملف</span>
                </button>
                <button 
                  onClick={() => setSelectedEmp(null)}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Navigation Tabs Bar inside Modal */}
              <div className="flex border-b border-slate-800 gap-2 pb-2">
                <button
                  onClick={() => setModalTab('details')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    modalTab === 'details' ? 'bg-[#dfb55a] text-slate-950 shadow-md font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>البيانات التفصيلية</span>
                </button>
                <button
                  onClick={() => setModalTab('timeline')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    modalTab === 'timeline' ? 'bg-[#dfb55a] text-slate-950 shadow-md font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>الجدول الزمني الموثق (Timeline)</span>
                </button>
                <button
                  onClick={() => setModalTab('activity_log')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    modalTab === 'activity_log' ? 'bg-[#dfb55a] text-slate-950 shadow-md font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <HistoryIcon className="w-3.5 h-3.5" />
                  <span>سجل النشاطات والأحداث ({selectedEmp.auditLogs.length})</span>
                </button>
                <button
                  onClick={() => setModalTab('alerts')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    modalTab === 'alerts' ? 'bg-[#dfb55a] text-slate-950 shadow-md font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>تنبيهات العقود والوثائق</span>
                </button>
              </div>

              {/* TAB 1: DETAILS */}
              {modalTab === 'details' && (
                <div className="space-y-6">
                  {/* Profile Top Bento summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/40 p-4 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-[#dfb55a]" />
                      <div>
                        <span className="text-[10px] text-slate-500 block">المسمى الوظيفي</span>
                        <span className="text-xs font-bold text-white">
                          {jobs.find(j => j.id === selectedEmp.jobId)?.titleAr || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-yellow-400" />
                      <div>
                        <span className="text-[10px] text-slate-500 block">القسم الإداري</span>
                        <span className="text-xs font-bold text-white">
                          {departments.find(d => d.id === selectedEmp.departmentId)?.nameAr || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="text-[10px] text-slate-500 block">الراتب الأساسي</span>
                        <span className="text-xs font-bold text-white font-mono">{formatCurrency(selectedEmp.basicSalary, true)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-amber-400" />
                      <div>
                        <span className="text-[10px] text-slate-500 block">تاريخ التعيين</span>
                        <span className="text-xs font-bold text-white font-mono">{selectedEmp.hiringDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Right Column: Personal & Financial info */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-slate-400 border-b border-slate-800 pb-1.5 mb-3">بيانات الهوية والاتصال</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-800/30">
                            <span className="text-slate-500">الرقم الوطني:</span>
                            <span className="text-white font-semibold font-mono">{selectedEmp.nationalId}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/30">
                            <span className="text-slate-500">رقم الهاتف:</span>
                            <span className="text-white font-semibold font-mono">{selectedEmp.phone}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/30">
                            <span className="text-slate-500">البريد الإلكتروني:</span>
                            <span className="text-white font-semibold font-mono">{selectedEmp.email}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/30">
                            <span className="text-slate-500">تاريخ الميلاد:</span>
                            <span className="text-white font-semibold font-mono">{selectedEmp.birthDate}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/30">
                            <span className="text-slate-500">الجنس:</span>
                            <span className="text-white font-semibold">{selectedEmp.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">العنوان السكني:</span>
                            <span className="text-white font-semibold">{selectedEmp.address}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-slate-400 border-b border-slate-800 pb-1.5 mb-3">المؤهلات العلمية والخبرة</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-800/30">
                            <span className="text-slate-500">الشهادة / الدرجة:</span>
                            <span className="text-white font-bold text-amber-400">{selectedEmp.degree}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/30">
                            <span className="text-slate-500">التخصص الرئيسي:</span>
                            <span className="text-white font-semibold">{selectedEmp.major || 'غير مدخل'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/30">
                            <span className="text-slate-500">سنوات الخبرة السابقة:</span>
                            <span className="text-white font-bold">{selectedEmp.experienceYears} سنة</span>
                          </div>
                          <div className="flex flex-col py-1">
                            <span className="text-slate-500 block mb-1">الدورات التدريبية المكتسبة:</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedEmp.trainingCourses.length === 0 ? (
                                <span className="text-slate-600 text-[10px]">لا توجد دورات تدريبية مسجلة</span>
                              ) : (
                                selectedEmp.trainingCourses.map((c, i) => (
                                  <span key={i} className="bg-slate-800 text-[#dfb55a] border border-slate-700 text-[10px] px-2 py-0.5 rounded">
                                    {c}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-slate-400 border-b border-slate-800 pb-1.5 mb-3">البيانات المصرفية والحساب البنكي</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-800/30">
                            <span className="text-slate-500">اسم المصرف والفرع:</span>
                            <span className="text-white font-semibold">{selectedEmp.bankName}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">رقم الآيبان (IBAN):</span>
                            <span className="text-emerald-400 font-bold font-mono text-[11px] select-all">{selectedEmp.iban || 'غير محدد'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Left Column: Documents & Audit trail */}
                    <div className="space-y-6">
                      {/* Attachments Section */}
                      <div className="bg-slate-850 p-4 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                            <Paperclip className="w-4 h-4 text-yellow-400" />
                            <span>وثائق ومرفقات الموظف الرقمية</span>
                          </h4>
                          <button 
                            onClick={handleSimulateUpload}
                            className="text-[10px] bg-slate-800 text-[#dfb55a] hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-md font-bold"
                          >
                            إرفاق مستند جديد
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          {selectedEmp.attachments.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-slate-300 font-medium truncate max-w-[200px]">{file.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-slate-500">{file.size}</span>
                                <button 
                                  onClick={() => triggerNotification(`تم تنزيل ${file.name} بنجاح إلى جهازك.`, 'success')}
                                  className="text-yellow-400 text-[10px] font-bold hover:underline"
                                >
                                  تنزيل
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Audit Logs / Revision History */}
                      <div className="bg-slate-850 p-4 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                          <HistoryIcon className="w-4 h-4 text-amber-500" />
                          <span>سجل العمليات والتعديلات الأمنية (Audit Trail)</span>
                        </h4>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {selectedEmp.auditLogs.map((log, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-900/50 border-r-2 border-[#dfb55a] border border-slate-800 rounded-lg text-[10px]">
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span className="font-bold text-[#dfb55a]">{log.action}</span>
                                <span className="font-mono">{log.date}</span>
                              </div>
                              <p className="text-slate-300 mt-0.5">{log.details}</p>
                              <span className="text-slate-500 text-[9px] mt-1 block">المسؤول: {log.user}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TIMELINE */}
              {modalTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#dfb55a]">الجدول الزمني التوثيقي لدورة حياة الموظف بالمنظومة</h4>
                      <p className="text-[10px] text-slate-400">تتبع متسلسل وزمني لكافة محطات الموظف (التعيين، العقود، الرواتب، الإجازات، والتقييمات)</p>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-1 rounded border border-slate-700">
                      كود الموظف: {selectedEmp.id}
                    </span>
                  </div>

                  {/* Dynamic Timeline Events */}
                  {(() => {
                    const empJob = jobs.find(j => j.id === selectedEmp.jobId)?.titleAr || 'المسمى الوظيفي';
                    const empDept = departments.find(d => d.id === selectedEmp.departmentId)?.nameAr || 'القسم الإداري';

                    const empContracts = contracts.filter(c => c.employeeId === selectedEmp.id);
                    const empLeaves = leaves.filter(l => l.employeeId === selectedEmp.id);
                    const empRewards = rewards.filter(r => r.employeeId === selectedEmp.id);
                    const empPenalties = penalties.filter(p => p.employeeId === selectedEmp.id);
                    const empPerf = performance.filter(p => p.employeeId === selectedEmp.id);

                    const events = [
                      {
                        date: selectedEmp.hiringDate,
                        title: 'التعيين الرسمي ومباشرة العمل',
                        desc: `تأسيس الملف الرقمي ومباشرة العمل بوظيفة [${empJob}] في [${empDept}] براتب أساسي قدره ${formatCurrency(selectedEmp.basicSalary, true)}`,
                        badge: 'التعيين الأول',
                        color: 'emerald'
                      },
                      ...empContracts.map(c => ({
                        date: c.startDate,
                        title: `توقيع عقد عمل رقم (${c.id})`,
                        desc: `عقد ${c.type === 'fixed' ? 'محدد المدة' : 'دائم / موسمي'} ينتهي في ${c.endDate} براتب شهري ${c.monthlySalary} د.ل`,
                        badge: 'عقد عمل',
                        color: 'indigo'
                      })),
                      ...empLeaves.map(l => ({
                        date: l.startDate,
                        title: `طلب إجازة رسمية (${l.type})`,
                        desc: `إجازة من ${l.startDate} إلى ${l.endDate} • السبب: ${l.reason} • الحالة: ${l.status === 'approved' ? 'معتمدة' : 'قيد المراجعة'}`,
                        badge: 'إجازات',
                        color: 'sky'
                      })),
                      ...empRewards.map(r => ({
                        date: r.date,
                        title: 'منح مكافأة تميز استثنائية',
                        desc: `مكافأة مالية قدرها ${formatCurrency(r.amount, true)} • السبب: ${r.reason}`,
                        badge: 'تحفيز ومكافأة',
                        color: 'amber'
                      })),
                      ...empPenalties.map(p => ({
                        date: p.date,
                        title: 'صدور قرار جزاء / تنبيه إداري',
                        desc: `قيمة الخصم/الجزاء: ${p.amount} • السبب: ${p.reason}`,
                        badge: 'جزاءات',
                        color: 'rose'
                      })),
                      ...empPerf.map(p => ({
                        date: p.date,
                        title: 'تقييم كفاءة الأداء السنوي',
                        desc: `درجة التقييم: ${p.score}/100 • المقيم: ${p.reviewer} • نقاط القوة: ${p.strengths}`,
                        badge: 'تقييم الأداء',
                        color: 'purple'
                      })),
                      ...selectedEmp.auditLogs.map(a => ({
                        date: a.date.split(' ')[0],
                        title: a.action,
                        desc: `${a.details} (المسؤول: ${a.user})`,
                        badge: 'تعديل سيستم',
                        color: 'slate'
                      }))
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    return (
                      <div className="relative border-r-2 border-[#dfb55a]/40 pr-6 mr-3 space-y-6 py-2">
                        {events.map((ev, idx) => (
                          <div key={idx} className="relative group">
                            {/* Dot */}
                            <div className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                              ev.color === 'emerald' ? 'bg-emerald-500' :
                              ev.color === 'indigo' ? 'bg-amber-500' :
                              ev.color === 'sky' ? 'bg-yellow-500' :
                              ev.color === 'amber' ? 'bg-[#dfb55a]' :
                              ev.color === 'rose' ? 'bg-rose-500' :
                              ev.color === 'purple' ? 'bg-purple-500' : 'bg-slate-500'
                            }`} />
                            
                            <div className="bg-slate-950 border border-slate-800 p-4 space-y-1.5 hover:border-slate-700 transition-all">
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  ev.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  ev.color === 'indigo' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  ev.color === 'sky' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                  ev.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  ev.color === 'rose' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  {ev.badge}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  {ev.date}
                                </span>
                              </div>
                              <h5 className="font-bold text-white text-xs">{ev.title}</h5>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{ev.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: ACTIVITY LOG */}
              {modalTab === 'activity_log' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 border border-slate-800">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="تصفية السجل بالعملية أو اسم المسؤول أو التفاصيل..." 
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#dfb55a]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
                      عدد السجلات: {selectedEmp.auditLogs.length}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {selectedEmp.auditLogs
                      .filter(l => l.action.includes(logSearch) || l.details.includes(logSearch) || l.user.includes(logSearch))
                      .map((log, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 border border-slate-800 space-y-1 text-xs">
                          <div className="flex justify-between items-center text-slate-400">
                            <span className="font-bold text-[#dfb55a] bg-amber-500/10 px-2 py-0.5 rounded text-[10px] border border-amber-500/20">
                              {log.action}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">{log.date}</span>
                          </div>
                          <p className="text-slate-200 mt-1 font-medium">{log.details}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                            <span>القائم بالتغيير: <strong className="text-slate-400">{log.user}</strong></span>
                            <span className="font-mono text-emerald-400">Status: Verified ✓</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ALERTS */}
              {modalTab === 'alerts' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>حالة توثيق المستندات والعقود الرسمية للموظف</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      نظام التنبيهات التلقائية المربوط بمواعيد انتهاء عقود العمل والإقامات وبطاقات الهوية الوطنية
                    </p>
                  </div>

                  {/* Check employee contract expiry */}
                  {(() => {
                    const empContracts = contracts.filter(c => c.employeeId === selectedEmp.id);
                    const empDocs = documents.filter(d => d.employeeId === selectedEmp.id);

                    return (
                      <div className="space-y-3">
                        {empContracts.length === 0 ? (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>تنبيه: لا يوجد عقد عمل رسمي موثق مسجل لهذا الموظف في النظام! ينصح بإنشاء عقد جديد.</span>
                          </div>
                        ) : (
                          empContracts.map(c => (
                            <div key={c.id} className="p-4 bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-white block">عقد عمل رقم ({c.id})</span>
                                <span className="text-[10px] text-slate-400">تاريخ الانتهاء: {c.endDate}</span>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[10px]">
                                ساري المفعول ✓
                              </span>
                            </div>
                          ))
                        )}

                        {empDocs.length > 0 && empDocs.map(doc => (
                          <div key={doc.id} className="p-4 bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block">{doc.title}</span>
                              <span className="text-[10px] text-slate-400">تاريخ الانتهاء: {doc.expiryDate}</span>
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[10px]">
                              موثق وساري ✓
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT EMPLOYEE FORM MODAL ==================== */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form 
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingEmp ? `تعديل ملف الموظف • ${editingEmp.id}` : 'تعيين وإدراج كادر وظيفي جديد'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowFormModal(false)}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              
              {/* Profile Image input */}
              <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-850 p-4 border border-slate-800">
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-xl text-slate-400 border border-slate-700">
                  <User className="w-7 h-7" />
                </div>
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-[11px] font-bold text-slate-400">رابط صورة الملف الشخصي للموظف (اختياري)</label>
                  <input 
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formProfileImage}
                    onChange={(e) => setFormProfileImage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a] focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 1: Personal Details */}
              <div>
                <h4 className="text-xs font-black text-slate-400 border-b border-slate-800 pb-1.5 mb-3 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#dfb55a]" />
                  <span>البيانات الأساسية والهوية الشخصية</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">الاسم الكامل بالعربية <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="أدخل الاسم الرباعي"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">الرقم الوطني المكون من 12 خانة <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={formNationalId}
                      onChange={(e) => setFormNationalId(e.target.value)}
                      placeholder="مثال: 119901234567"
                      maxLength={12}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a] font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">الجنس</label>
                      <select 
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value as 'male' | 'female')}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                      >
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">تاريخ الميلاد</label>
                      <input 
                        type="date" 
                        value={formBirthDate}
                        onChange={(e) => setFormBirthDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">رقم الهاتف الفعال <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+966 50 000 0000"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">البريد الإلكتروني المهني <span className="text-rose-500">*</span></label>
                    <input 
                      type="email" 
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="name@alnoor.edu"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">العنوان السكني الحالي</label>
                    <input 
                      type="text" 
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="مثال: طرابلس، سوق الجمعة"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Job details */}
              <div>
                <h4 className="text-xs font-black text-slate-400 border-b border-slate-800 pb-1.5 mb-3 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-yellow-400" />
                  <span>التعيين الوظيفي والمركز الإداري بالمنشأة</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">القسم المعتمد</label>
                    <select 
                      value={formDepartmentId}
                      onChange={(e) => setFormDepartmentId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.nameAr}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">المسمى الوظيفي</label>
                    <select 
                      value={formJobId}
                      onChange={(e) => setFormJobId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      {jobs.map(j => (
                        <option key={j.id} value={j.id}>{j.titleAr}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">مركز التكلفة المالي</label>
                    <select 
                      value={formCostCenter}
                      onChange={(e) => setFormCostCenter(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      {Object.entries(costCenterLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">تاريخ مباشرة العمل</label>
                    <input 
                      type="date" 
                      value={formHiringDate}
                      onChange={(e) => setFormHiringDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">المؤهل العلمي</label>
                    <input 
                      type="text" 
                      value={formDegree}
                      onChange={(e) => setFormDegree(e.target.value)}
                      placeholder="بكالوريوس، ماجستير، دكتوراه..."
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">التخصص الأكاديمي</label>
                    <input 
                      type="text" 
                      value={formMajor}
                      onChange={(e) => setFormMajor(e.target.value)}
                      placeholder="مثال: لغة عربية، محاسبة..."
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">سنوات الخبرة السابقة</label>
                    <input 
                      type="number" 
                      value={formExperienceYears}
                      onChange={(e) => setFormExperienceYears(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">الحالة الوظيفية</label>
                    <select 
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      <option value="active">على رأس العمل (نشط)</option>
                      <option value="on_leave">في إجازة رسمية</option>
                      <option value="suspended">موقوف / معلق</option>
                      <option value="resigned">مستقيل</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 mt-4">
                  <label className="text-[10px] font-bold text-slate-400 block">الدورات التدريبية المكتسبة (افصل بينها بفاصلة)</label>
                  <input 
                    type="text" 
                    value={formTraining}
                    onChange={(e) => setFormTraining(e.target.value)}
                    placeholder="شهادة لغة إنجليزية متقدمة، دورة تدريس تفاعلي، دبلوم حاسب..."
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a]"
                  />
                </div>
              </div>

              {/* Section 3: Financial & Banking */}
              <div>
                <h4 className="text-xs font-black text-slate-400 border-b border-slate-800 pb-1.5 mb-3 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الرواتب والأجور والهيكل البنكي للتحويلات</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">الراتب الشهري الأساسي <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      value={formBasicSalary}
                      onChange={(e) => setFormBasicSalary(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 font-mono text-sm font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">اسم المصرف للتحويل</label>
                    <input 
                      type="text" 
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      placeholder="مصرف الجمهورية، مصرف الوحدة..."
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">رقم الآيبان (IBAN)</label>
                    <input 
                      type="text" 
                      value={formIban}
                      onChange={(e) => setFormIban(e.target.value)}
                      placeholder="LY82003847291038472910"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-[#dfb55a] font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-800 px-6 py-4 border-t border-slate-700 flex items-center justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowFormModal(false)}
                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 px-4 py-2 rounded-lg"
              >
                إلغاء الأمر
              </button>
              <button 
                type="submit"
                className="bg-gradient-to-r from-[#dfb55a] to-[#c99e4c] hover:opacity-90 text-slate-950 font-bold px-5 py-2 rounded-lg shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>حفظ التعديلات والملف</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
