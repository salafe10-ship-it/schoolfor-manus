import React, { useState } from 'react';
import { 
  Building2, Search, Filter, Plus, Edit, Trash2, 
  Barcode, QrCode, Eye, Wrench, ArrowRightLeft, DollarSign, 
  Trash, Printer, RefreshCw, Layers, CheckCircle2, AlertTriangle, ChevronLeft 
} from 'lucide-react';
import { FixedAsset } from '../../types';

interface AssetRegistryManagerProps {
  assets: FixedAsset[];
  selectedAssetId?: string;
  onSelectAsset: (asset: FixedAsset) => void;
  onOpenNewAssetModal: () => void;
  onOpenTransferModal: (asset: FixedAsset) => void;
  onOpenMaintenanceModal: (asset: FixedAsset) => void;
  onOpenSaleModal: (asset: FixedAsset) => void;
  onOpenDiscardModal: (asset: FixedAsset) => void;
  onDeleteAsset: (id: string) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function AssetRegistryManager({
  assets,
  selectedAssetId,
  onSelectAsset,
  onOpenNewAssetModal,
  onOpenTransferModal,
  onOpenMaintenanceModal,
  onOpenSaleModal,
  onOpenDiscardModal,
  onDeleteAsset,
  triggerNotification
}: AssetRegistryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedBarcodeAsset, setSelectedBarcodeAsset] = useState<FixedAsset | null>(null);

  const categories = Array.from(new Set(assets.map(a => a.category).filter(Boolean)));

  const filteredAssets = assets.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      a.name.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.barcode.toLowerCase().includes(q) ||
      a.serialNo.toLowerCase().includes(q) ||
      (a.responsible && a.responsible.toLowerCase().includes(q)) ||
      (a.department && a.department.toLowerCase().includes(q));

    const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 text-right" dir="rtl" id="asset-registry-manager">
      {/* Search & Filter Header Toolbar */}
      <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Search input */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="البحث بالاسم، الكود، الباركود، المسؤول، أو القسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent p-2.5 pr-10 text-xs font-bold text-slate-800 focus:focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        {/* Center: Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">كل التصنيفات ({assets.length})</option>
              {categories.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">كل الحالات</option>
              <option value="نشط / قيد التشغيل">نشط / قيد التشغيل</option>
              <option value="تحت الصيانة">تحت الصيانة</option>
              <option value="تم بيعه">تم بيعه</option>
              <option value="مستبعد / كلي">مستبعد / كلي</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'table' ? 'text-amber-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              جدول
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid' ? 'text-amber-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              بطاقات
            </button>
          </div>

          <button
            onClick={onOpenNewAssetModal}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer mr-auto md:mr-0"
          >
            <Plus className="w-4 h-4" /> إضافة أصل جديد
          </button>
        </div>
      </div>

      {/* Main Content Area: Table View vs Grid View */}
      {viewMode === 'table' ? (
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-transparent text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3.5">الكود والباركود</th>
                  <th className="p-3.5">اسم الأصل الثابت</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">القسم والمسؤول</th>
                  <th className="p-3.5 text-left">التكلفة (د.ل)</th>
                  <th className="p-3.5 text-left">مجمع الإهلاك</th>
                  <th className="p-3.5 text-left">القيمة الدفترية</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                {filteredAssets.map((asset) => {
                  const isSelected = asset.id === selectedAssetId;
                  return (
                    <tr 
                      key={asset.id}
                      className={`hover:bg-transparent transition cursor-pointer ${
                        isSelected ? 'bg-amber-50/50 font-semibold' : ''
                      }`}
                      onClick={() => onSelectAsset(asset)}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBarcodeAsset(asset);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="عرض وتنزيل الباركود وQR Code"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900 block">{asset.code}</span>
                            <span className="font-mono text-[10px] text-slate-400">{asset.barcode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-xs">{asset.name}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{asset.manufacturer} {asset.model}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md">
                          {asset.category}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="text-slate-800 font-bold">{asset.department || 'عام'}</div>
                        <div className="text-[10px] text-slate-500">{asset.responsible || 'غير محدد'}</div>
                      </td>

                      <td className="p-3.5 text-left font-mono font-bold text-slate-800">
                        {(Number(asset.cost || 0) + Number(asset.capitalExp || 0)).toLocaleString()}
                      </td>

                      <td className="p-3.5 text-left font-mono text-rose-600 font-bold">
                        -{Number(asset.accDep || 0).toLocaleString()}
                      </td>

                      <td className="p-3.5 text-left font-mono font-black text-emerald-700">
                        {Number(asset.netValue || 0).toLocaleString()}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                          asset.status === 'نشط / قيد التشغيل' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          asset.status === 'تحت الصيانة' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          asset.status === 'تم بيعه' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                          'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {asset.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectAsset(asset)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="بطاقة الأصل والسجل التفصيلي"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenTransferModal(asset)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                            title="نقل الأصل والعهدة"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenMaintenanceModal(asset)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                            title="صيانة وأمر عمل"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenSaleModal(asset)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                            title="بيع الأصل"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`هل أنت تأكد من رغبتك في حذف الأصل (${asset.name})؟`)) {
                                onDeleteAsset(asset.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            title="حذف الأصل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAssets.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                      لا توجد أصول ثابتة مطابقة لخيارات البحث المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const isSelected = asset.id === selectedAssetId;
            return (
              <div 
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className={`p-5 border transition-all duration-200 cursor-pointer relative space-y-4 ${
                  isSelected ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 block">{asset.code}</span>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{asset.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                    asset.status === 'نشط / قيد التشغيل' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {asset.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-transparent text-center text-[10px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[9px]">التكلفة:</span>
                    <span className="font-bold text-slate-800">{Number(asset.cost).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">مجمع الإهلاك:</span>
                    <span className="font-bold text-rose-600">-{Number(asset.accDep).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">صافي الدفتري:</span>
                    <span className="font-black text-emerald-700">{Number(asset.netValue).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">القسم:</span>
                    <span className="font-bold text-slate-800">{asset.department || 'عام'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">المسؤول عن العهدة:</span>
                    <span className="font-bold text-slate-800">{asset.responsible || 'غير محدد'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAsset(asset);
                    }}
                    className="text-amber-600 font-bold hover:underline flex items-center gap-1"
                  >
                    تفاصيل الأصل <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBarcodeAsset(asset);
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1"
                  >
                    <Barcode className="w-3.5 h-3.5" /> باركود
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barcode & QR Preview Modal */}
      {selectedBarcodeAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl text-center">
            <div className="space-y-1">
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                بطاقة الباركود والترميز الرقمي للأصل
              </span>
              <h3 className="text-base font-black text-slate-900">{selectedBarcodeAsset.name}</h3>
              <p className="text-xs font-mono text-slate-500">{selectedBarcodeAsset.code}</p>
            </div>

            {/* Visual Barcode Simulation */}
            <div className="p-4 bg-transparent space-y-3">
              <div className="flex justify-center items-center py-3 border border-slate-200">
                <div className="font-mono text-2xl tracking-[0.3em] font-black text-slate-900">
                  |||| ||| ||||| || |||
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800 block">
                {selectedBarcodeAsset.barcode || '629100088101'}
              </span>

              <div className="flex justify-center items-center py-3 border border-slate-200">
                <QrCode className="w-16 h-16 text-slate-800" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-[#2a1d13] text-[#fce79a] font-bold text-xs hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> طباعة الملصق
              </button>
              <button
                onClick={() => setSelectedBarcodeAsset(null)}
                className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
