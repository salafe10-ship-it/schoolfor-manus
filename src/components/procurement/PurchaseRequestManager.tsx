import React, { useState } from 'react';
import { 
  FileText, Plus, CheckCircle2, XCircle, Clock, 
  Search, Filter, Edit, Trash2, Copy, ArrowRightLeft, 
  Printer, AlertCircle, ShieldCheck, User 
} from 'lucide-react';
import { PurchaseRequest, ProcurementItemLine, PurchaseRequestStatus } from '../../types';

interface PurchaseRequestManagerProps {
  requests: PurchaseRequest[];
  onSaveRequest: (pr: PurchaseRequest) => void;
  onDeleteRequest: (id: string) => void;
  onConvertToOrder: (pr: PurchaseRequest) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function PurchaseRequestManager({
  requests,
  onSaveRequest,
  onDeleteRequest,
  onConvertToOrder,
  triggerNotification
}: PurchaseRequestManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingPR, setEditingPR] = useState<Partial<PurchaseRequest> | null>(null);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleOpenNew = () => {
    setEditingPR({
      requestNo: '',
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      requesterName: '',
      department: '',
      priority: 'medium',
      purpose: '',
      status: 'pending_approval',
      lines: [],
      totalEstimatedAmount: 0
    });
    setShowModal(true);
  };

  const handleAddLine = () => {
    if (!editingPR) return;
    const lines = editingPR.lines || [];
    const newLine: ProcurementItemLine = {
      id: `line_${Date.now()}`,
      itemCode: '',
      itemName: '',
      unit: '',
      quantityRequested: 0,
      estimatedUnitPrice: 0,
      totalAmount: 0
    };
    const updatedLines = [...lines, newLine];
    const total = updatedLines.reduce((s, l) => s + l.totalAmount, 0);
    setEditingPR({ ...editingPR, lines: updatedLines, totalEstimatedAmount: total });
  };

  const handleUpdateLine = (index: number, field: string, value: any) => {
    if (!editingPR || !editingPR.lines) return;
    const updatedLines = [...editingPR.lines];
    const line = { ...updatedLines[index], [field]: value };
    if (field === 'quantityRequested' || field === 'estimatedUnitPrice') {
      line.totalAmount = (line.quantityRequested || 0) * (line.estimatedUnitPrice || 0);
    }
    updatedLines[index] = line;
    const total = updatedLines.reduce((s, l) => s + l.totalAmount, 0);
    setEditingPR({ ...editingPR, lines: updatedLines, totalEstimatedAmount: total });
  };

  const handleRemoveLine = (index: number) => {
    if (!editingPR || !editingPR.lines) return;
    const updatedLines = editingPR.lines.filter((_, i) => i !== index);
    const total = updatedLines.reduce((s, l) => s + l.totalAmount, 0);
    setEditingPR({ ...editingPR, lines: updatedLines, totalEstimatedAmount: total });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPR || !editingPR.requestNo) {
      notify('يرجى إدخال رقم طلب الشراء', 'warning');
      return;
    }
    if (!editingPR.requesterName || !editingPR.department || !editingPR.purpose || !editingPR.lines?.length || editingPR.lines.some(l => !l.itemCode || !l.itemName || !Number.isInteger(l.quantityRequested) || l.quantityRequested <= 0 || !Number.isFinite(l.estimatedUnitPrice) || l.estimatedUnitPrice < 0)) {
      notify('لا يمكن حفظ الطلب دون بيانات الطالب والغرض وبنود وكميات وأسعار صحيحة', 'warning');
      return;
    }

    const prToSave: PurchaseRequest = {
      id: editingPR.id || `pr_${Date.now()}`,
      schoolId: 'school_1',
      requestNo: editingPR.requestNo,
      requestDate: editingPR.requestDate || new Date().toISOString().split('T')[0],
      requiredDate: editingPR.requiredDate || new Date().toISOString().split('T')[0],
      requesterName: editingPR.requesterName || 'المستفيد',
      department: editingPR.department || 'عام',
      priority: editingPR.priority || 'medium',
      purpose: editingPR.purpose || '',
      status: editingPR.status as PurchaseRequestStatus || 'pending_approval',
      lines: editingPR.lines || [],
      totalEstimatedAmount: editingPR.totalEstimatedAmount || 0,
      createdAt: editingPR.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveRequest(prToSave);
    notify(`✓ تم حفظ طلب الشراء رقم (${prToSave.requestNo}) بنجاح`, 'success');
    setShowModal(false);
    setEditingPR(null);
  };

  const handleApprove = (pr: PurchaseRequest) => {
    const updated: PurchaseRequest = {
      ...pr,
      status: 'approved',
      approvedBy: 'أ. عبد الله العتيبي (المدير المالي)',
      approvalDate: new Date().toISOString().split('T')[0]
    };
    onSaveRequest(updated);
    notify(`✓ تم اعتماد طلب الشراء رقم (${pr.requestNo}) تحضيراً لإصدار أمر الشراء`, 'success');
  };

  const handleReject = (pr: PurchaseRequest) => {
    const reason = prompt('يرجى كتابة سبب رفض الطلب:');
    if (reason) {
      const updated: PurchaseRequest = {
        ...pr,
        status: 'rejected',
        rejectionReason: reason
      };
      onSaveRequest(updated);
      notify(`تم رفض طلب الشراء رقم (${pr.requestNo})`, 'warning');
    }
  };

  const filtered = requests.filter(r => {
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchSearch = r.requestNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        r.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6" id="purchase-requests-manager">
      {/* Top Header Card */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" /> إدارة طلبات الشراء الداخلية (Purchase Requests - PR)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">تقديم الطلبات الداخلية، المراجعة المالية، واعتماد الميزانيات التقديرية</p>
        </div>

        <button 
          onClick={handleOpenNew}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> إنشاء طلب شراء جديد
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الطلب، اسم الطالب، الغرض..." 
            className="w-full pr-10 pl-4 py-2 bg-transparent text-sm focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-2 px-4 bg-transparent text-sm font-bold text-slate-800"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="pending_approval">بانتظار الاعتماد</option>
          <option value="approved">معتمد وجاهز للطلب</option>
          <option value="rejected">مرفوض</option>
          <option value="converted_to_po">تم تحويله لأمر شراء</option>
        </select>
      </div>

      {/* Table List */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-4">رقم الطلب</th>
                <th className="px-4 py-4">التاريخ</th>
                <th className="px-4 py-4">مقدم الطلب / القسم</th>
                <th className="px-4 py-4">الأولوية</th>
                <th className="px-4 py-4">الغرض من الطلب</th>
                <th className="px-4 py-4">المبلغ التقديري</th>
                <th className="px-4 py-4">الحالة والاعتماد</th>
                <th className="px-4 py-4 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-transparent transition">
                  <td className="px-4 py-4 font-mono font-bold text-slate-900">{r.requestNo}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-600">{r.requestDate}</td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-slate-900 block">{r.requesterName}</span>
                    <span className="text-xs text-slate-500">{r.department}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      r.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      r.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {r.priority === 'urgent' ? 'عاجل جداً' : r.priority === 'high' ? 'أولوية عالية' : 'عادي'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-700 font-semibold max-w-xs truncate">{r.purpose}</td>
                  <td className="px-4 py-4 font-black text-amber-700">{r.totalEstimatedAmount.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                      r.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      r.status === 'pending_approval' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      r.status === 'converted_to_po' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {r.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {r.status === 'approved' ? 'معتمد' : r.status === 'pending_approval' ? 'قيد الاعتماد' : r.status === 'converted_to_po' ? 'متحول لـ PO' : 'مرفوض'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center items-center gap-1">
                      {r.status === 'pending_approval' && (
                        <>
                          <button 
                            onClick={() => handleApprove(r)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                          >
                            اعتماد
                          </button>
                          <button 
                            onClick={() => handleReject(r)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition"
                          >
                            رفض
                          </button>
                        </>
                      )}

                      {r.status === 'approved' && (
                        <button 
                          onClick={() => onConvertToOrder(r)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1"
                        >
                          تحويل إلى أمر شراء PO
                        </button>
                      )}

                      <button 
                        onClick={() => {
                          setEditingPR(r);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && editingPR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" /> {editingPR.id ? 'تعديل طلب شراء' : 'إنشاء طلب شراء جديد (PR)'}
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الطلب *</label>
                  <input 
                    type="text"
                    required
                    value={editingPR.requestNo || ''}
                    onChange={(e) => setEditingPR({ ...editingPR, requestNo: e.target.value })}
                    className="w-full p-2.5 bg-transparent text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم مقدم الطلب *</label>
                  <input 
                    type="text"
                    required
                    value={editingPR.requesterName || ''}
                    onChange={(e) => setEditingPR({ ...editingPR, requesterName: e.target.value })}
                    className="w-full p-2.5 bg-transparent text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم المستفيد *</label>
                  <input 
                    type="text"
                    required
                    value={editingPR.department || ''}
                    onChange={(e) => setEditingPR({ ...editingPR, department: e.target.value })}
                    className="w-full p-2.5 bg-transparent text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الغرض والسبب الداعي للشراء *</label>
                <textarea 
                  required
                  rows={2}
                  value={editingPR.purpose || ''}
                  onChange={(e) => setEditingPR({ ...editingPR, purpose: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm"
                  placeholder="بيان مبررات الاحتياج والمجال المخصص له..."
                />
              </div>

              {/* Items Line Table */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm">تفاصيل بنود الأصناف المطلوبة</h4>
                  <button 
                    type="button"
                    onClick={handleAddLine}
                    className="px-3 py-1 bg-[#2a1d13] text-[#fce79a] font-bold text-xs rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة بند
                  </button>
                </div>

                <div className="space-y-2">
                  {(editingPR.lines || []).map((line, idx) => (
                    <div key={line.id} className="p-3 bg-transparent grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">اسم الصنف</label>
                        <input 
                          type="text"
                          value={line.itemName}
                          onChange={(e) => handleUpdateLine(idx, 'itemName', e.target.value)}
                          className="w-full p-1.5 rounded-md font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الكمية</label>
                        <input 
                          type="number"
                          min="1"
                          value={line.quantityRequested}
                          onChange={(e) => handleUpdateLine(idx, 'quantityRequested', parseFloat(e.target.value) || 1)}
                          className="w-full p-1.5 rounded-md font-bold text-center"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">السعر التقديري</label>
                        <input 
                          type="number"
                          value={line.estimatedUnitPrice}
                          onChange={(e) => handleUpdateLine(idx, 'estimatedUnitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 rounded-md font-bold text-center"
                        />
                      </div>

                      <div className="col-span-2 font-black text-amber-700 text-center">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الإجمالي</label>
                        {line.totalAmount.toLocaleString('ar-SA')} د.ل
                      </div>

                      <div className="col-span-1 text-center pt-3">
                        <button 
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-700">
                  إجمالي الميزانية التقديرية للطلب: <strong className="text-amber-700 text-lg">{(editingPR.totalEstimatedAmount || 0).toLocaleString('ar-SA')} د.ل</strong>
                </span>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-sm shadow-sm"
                  >
                    حفظ وتقديم الطلب
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
