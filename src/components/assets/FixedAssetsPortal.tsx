import React, { useState, useEffect } from 'react';
import { 
  Building2, LayoutDashboard, Database, FileSpreadsheet, 
  ShieldCheck, Plus, RefreshCw, Layers, CheckCircle2, AlertTriangle, X 
} from 'lucide-react';
import { FixedAsset } from '../../types';
import { FixedAssetsRepository } from '../../database/repositories/FixedAssetsRepository';
import { FallbackStorage } from '../../database/repositories/FallbackStorage';
import FixedAssetsDashboard from './FixedAssetsDashboard';
import AssetRegistryManager from './AssetRegistryManager';
import AssetDetailCardModal from './AssetDetailCardModal';
import AssetLifecycleOperationsModal from './AssetLifecycleOperationsModal';
import AssetReportsAndDepreciation from './AssetReportsAndDepreciation';
import EnterpriseFixedAssetsQualityAudit from './EnterpriseFixedAssetsQualityAudit';
import { authenticatedRequest } from '../../utils/authenticatedRequest';

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'danger';
}

export default function FixedAssetsPortal() {
  const canonicalPersistenceRequired = FallbackStorage.isCanonicalPersistenceRequired();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registry' | 'reports' | 'audit'>('dashboard');
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  
  // Modal states
  const [activeModal, setActiveModal] = useState<'none' | 'new_asset' | 'transfer' | 'maintenance' | 'depreciation' | 'sale' | 'discard'>('none');
  const [modalTargetAsset, setModalTargetAsset] = useState<FixedAsset | null>(null);
  
  // Toast notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (message: string, type: 'success' | 'warning' | 'info' | 'danger' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const toCanonicalAsset = (row: any): FixedAsset => ({
    ...(row || {}),
    id: String(row?.id || ''), code: String(row?.code || ''), name: String(row?.name || ''), category: String(row?.category || ''),
    status: ({ active: 'نشط / قيد التشغيل', maintenance: 'تحت الصيانة', loaned: 'معار / مستخدم', disposed: 'مستبعد / كلي', sold: 'تم بيعه' } as any)[String(row?.status || 'active')] || row?.status,
    cost: Number(row?.cost || 0), capitalExp: Number(row?.capitalExp || 0), accDep: Number(row?.accDep || 0), netValue: Number(row?.netValue || 0),
    maintenanceLogs: Array.isArray(row?.maintenanceLogs) ? row.maintenanceLogs : [], transferLogs: Array.isArray(row?.transferLogs) ? row.transferLogs : [],
    depreciationHistory: Array.isArray(row?.depreciationHistory) ? row.depreciationHistory : [], timeline: Array.isArray(row?.timeline) ? row.timeline : [],
    createdAt: String(row?.createdAt || new Date().toISOString()), updatedAt: String(row?.updatedAt || new Date().toISOString())
  } as FixedAsset);

  const loadAssets = async () => {
    try {
      const data = canonicalPersistenceRequired
        ? ((await (async () => {
            const response = await authenticatedRequest('/api/fixed-assets');
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload?.success || !Array.isArray(payload.data)) throw new Error(payload?.message || 'تعذر تحميل سجل الأصول المركزي.');
            return payload.data.map(toCanonicalAsset);
          })()))
        : FixedAssetsRepository.getAll();
      setAssets(data);
      if (selectedAsset) {
        const updatedSelected = data.find(a => a.id === selectedAsset.id);
        if (updatedSelected) setSelectedAsset(updatedSelected);
      }
    } catch (e) {
      console.error('Failed to load fixed assets:', e);
      addToast('الأصول الثابتة متوقفة حتى يتم ربط مصدرها المحاسبي المركزي.', 'warning');
    }
  };

  useEffect(() => {
    void loadAssets();
  }, []);

  // Handlers
  const handleSaveAsset = async (asset: FixedAsset) => {
    if (canonicalPersistenceRequired) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(asset.id);
        const response = await authenticatedRequest(isUuid ? `/api/fixed-assets/${encodeURIComponent(asset.id)}` : '/api/fixed-assets', {
          method: isUuid ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(asset)
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success || !payload.data) throw new Error(payload?.message || 'تعذر حفظ الأصل مركزيًا.');
        await loadAssets(); setSelectedAsset(toCanonicalAsset(payload.data));
        addToast('✓ تم حفظ الأصل وربطه بالقيد والتدقيق المركزي.', 'success');
      } catch (e: any) { addToast(e.message || 'تعذر حفظ الأصل مركزيًا.', 'danger'); }
      return;
    }
    try {
      const saved = FixedAssetsRepository.save(asset);
      void loadAssets();
      setSelectedAsset(saved);
      addToast(`✓ تم حفظ ورسملة الأصل الثابت (${saved.name}) بنجاح`, 'success');
    } catch (e: any) {
      addToast(e.message || 'حدث خطأ أثناء حفظ الأصل', 'danger');
    }
  };

  const handleDeleteAsset = (id: string) => {
    if (canonicalPersistenceRequired) {
      addToast('حذف الأصول متوقف حتى يتوفر دفتر أصول مركزي مرتبط بالتدقيق المحاسبي.', 'warning');
      return;
    }
    try {
      FixedAssetsRepository.delete(id);
      loadAssets();
      if (selectedAsset?.id === id) setSelectedAsset(null);
      addToast('✓ تم حذف الأصل الثابت بنجاح', 'info');
    } catch (e: any) {
      addToast(e.message || 'تعذر حذف الأصل الثابت', 'danger');
    }
  };

  const postCanonicalEvent = async (assetId: string, type: string, payload: any = {}) => {
    const response = await authenticatedRequest(`/api/fixed-assets/${encodeURIComponent(assetId)}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, type }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.success || !result.data) throw new Error(result?.message || 'تعذر ترحيل حركة الأصل مركزيًا.');
    await loadAssets(); setSelectedAsset(toCanonicalAsset(result.data));
  };

  const handleConfirmTransfer = async (assetId: string, log: any) => {
    if (canonicalPersistenceRequired) {
      try { await postCanonicalEvent(assetId, 'transfer', log); addToast('✓ تم تسجيل نقل العهدة مركزيًا.', 'success'); } catch (e: any) { addToast(e.message || 'فشل تسجيل النقل.', 'danger'); }
      return;
    }
    try {
      const updated = FixedAssetsRepository.addTransferLog(assetId, log);
      void loadAssets();
      setSelectedAsset(updated);
      addToast('✓ تم إثبات وتحديث حركة نقل العهدة بنجاح', 'success');
    } catch (e: any) {
      addToast(e.message || 'فشلت عملية النقل', 'danger');
    }
  };

  const handleConfirmMaintenance = async (assetId: string, log: any) => {
    if (canonicalPersistenceRequired) {
      try { await postCanonicalEvent(assetId, 'maintenance', log); addToast('✓ تم تسجيل الصيانة وترحيل تكلفتها مركزيًا.', 'success'); } catch (e: any) { addToast(e.message || 'فشل تسجيل الصيانة.', 'danger'); }
      return;
    }
    try {
      const updated = FixedAssetsRepository.addMaintenanceLog(assetId, log);
      void loadAssets();
      setSelectedAsset(updated);
      addToast('✓ تم تسجيل أمر الصيانة وربطه بالتكلفة المباشرة', 'success');
    } catch (e: any) {
      addToast(e.message || 'فشلت عملية إضافة الصيانة', 'danger');
    }
  };

  const handleConfirmDepreciation = async (assetId: string, fiscalYear: string) => {
    if (canonicalPersistenceRequired) {
      try { await postCanonicalEvent(assetId, 'depreciation', { fiscalYear, eventDate: `${fiscalYear}-12-31` }); addToast(`✓ تم ترحيل إهلاك سنة ${fiscalYear} للدفتر العام.`, 'success'); } catch (e: any) { addToast(e.message || 'فشل ترحيل الإهلاك.', 'danger'); }
      return;
    }
    try {
      const updated = FixedAssetsRepository.postDepreciation(assetId, fiscalYear);
      void loadAssets();
      setSelectedAsset(updated);
      addToast(`✓ تم احتساب وقيد قسط الإهلاك السنوي لسنة ${fiscalYear} وترحيله للقيد اليومي`, 'success');
    } catch (e: any) {
      addToast(e.message || 'فشل احتساب قيد الإهلاك', 'danger');
    }
  };

  const handleConfirmSale = async (assetId: string, price: number, buyer: string, notes: string) => {
    if (canonicalPersistenceRequired) {
      try { await postCanonicalEvent(assetId, 'sale', { price, buyer, notes }); addToast('✓ تم إثبات بيع الأصل وترحيل أثره المالي مركزيًا.', 'success'); } catch (e: any) { addToast(e.message || 'فشل ترحيل بيع الأصل.', 'danger'); }
      return;
    }
    try {
      const updated = FixedAssetsRepository.sellAsset(assetId, price, buyer, notes);
      void loadAssets();
      setSelectedAsset(updated);
      addToast('✓ تم إثبات بيع الأصل الثابت وتحديث قيمته الدفترية', 'warning');
    } catch (e: any) {
      addToast(e.message || 'فشلت عملية بيع الأصل', 'danger');
    }
  };

  const handleConfirmDiscard = async (assetId: string, notes: string) => {
    if (canonicalPersistenceRequired) {
      try { await postCanonicalEvent(assetId, 'discard', { notes }); addToast('✓ تم استبعاد الأصل وترحيل الشطب مركزيًا.', 'success'); } catch (e: any) { addToast(e.message || 'فشل ترحيل استبعاد الأصل.', 'danger'); }
      return;
    }
    try {
      const updated = FixedAssetsRepository.discardAsset(assetId, notes);
      void loadAssets();
      setSelectedAsset(updated);
      addToast('✓ تم استبعاد وتكهين الأصل الثابت بنجاح', 'info');
    } catch (e: any) {
      addToast(e.message || 'فشلت عملية استبعاد الأصل', 'danger');
    }
  };

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl" id="fixed-assets-portal">
      {/* Toast Notifications Overlay */}
      <div className="fixed top-5 left-5 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-3.5 text-xs font-bold text-white flex items-center justify-between gap-3 pointer-events-auto transition-all transform animate-fade-in ${
              toast.type === 'success' ? 'bg-emerald-800' :
              toast.type === 'warning' ? 'bg-amber-800' :
              toast.type === 'danger' ? 'bg-rose-800' : 'bg-slate-900'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="p-1 hover:bg-white/20 rounded-lg text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-black rounded-full border border-amber-500/30 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> EduPro Fixed Assets & Capital Equipment
            </span>
            <span className="text-xs text-slate-400 font-mono">v2.5 Enterprise</span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة الأصول الثابتة والعهد والممتلكات المدرسية</h1>
          <p className="text-xs text-slate-300">
            تتبع الحافلات، معامل العلوم، أجهزة الطاقة، والأثاث مع الإهلاك المحاسبي الآلي وربط القيود اليومية (GL)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (canonicalPersistenceRequired) {
                addToast('تسجيل أصل جديد متوقف حتى يتم ربط دفتر الأصول المركزي.', 'warning');
                return;
              }
              setModalTargetAsset(null);
              setActiveModal('new_asset');
            }}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> تسجيل أصل جديد
          </button>

          <button
            onClick={loadAssets}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white transition"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Header Navigation Tabs */}
      <div className="p-1.5 shadow-xs flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'لوحة التحكم التنفيذية', icon: LayoutDashboard },
          { id: 'registry', label: 'سجل الأصول والعهد الرقمية', icon: Database, badge: assets.length },
          { id: 'reports', label: 'التقارير التحليلية وجداول الإهلاك', icon: FileSpreadsheet },
          { id: 'audit', label: 'اعتماد جودة الأصول (Quality Gate)', icon: ShieldCheck, badge: 'معتمد' },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
                isActive ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Sub-Tab View */}
      {activeTab === 'dashboard' && (
        <FixedAssetsDashboard
          assets={assets}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          onOpenNewAsset={() => {
            setModalTargetAsset(null);
            setActiveModal('new_asset');
          }}
          onOpenDepreciation={() => {
            setModalTargetAsset(null);
            setActiveModal('depreciation');
          }}
        />
      )}

      {activeTab === 'registry' && (
        <AssetRegistryManager
          assets={assets}
          selectedAssetId={selectedAsset?.id}
          onSelectAsset={(asset) => setSelectedAsset(asset)}
          onOpenNewAssetModal={() => {
            setModalTargetAsset(null);
            setActiveModal('new_asset');
          }}
          onOpenTransferModal={(asset) => {
            setModalTargetAsset(asset);
            setActiveModal('transfer');
          }}
          onOpenMaintenanceModal={(asset) => {
            setModalTargetAsset(asset);
            setActiveModal('maintenance');
          }}
          onOpenSaleModal={(asset) => {
            setModalTargetAsset(asset);
            setActiveModal('sale');
          }}
          onOpenDiscardModal={(asset) => {
            setModalTargetAsset(asset);
            setActiveModal('discard');
          }}
          onDeleteAsset={handleDeleteAsset}
          triggerNotification={addToast}
        />
      )}

      {activeTab === 'reports' && (
        <AssetReportsAndDepreciation assets={assets} />
      )}

      {activeTab === 'audit' && (
        <EnterpriseFixedAssetsQualityAudit assets={assets} triggerNotification={addToast} />
      )}

      {/* Selected Asset Detailed Drawer / Modal */}
      {selectedAsset && (
        <AssetDetailCardModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onSaveAsset={handleSaveAsset}
          onOpenTransferModal={(asset) => {
            setModalTargetAsset(asset);
            setActiveModal('transfer');
          }}
          onOpenMaintenanceModal={(asset) => {
            setModalTargetAsset(asset);
            setActiveModal('maintenance');
          }}
          onOpenSaleModal={(asset) => {
            setModalTargetAsset(asset);
            setActiveModal('sale');
          }}
          onOpenDiscardModal={(asset) => {
            setModalTargetAsset(asset);
            setActiveModal('discard');
          }}
          onPostDepreciation={(assetId) => {
            const a = assets.find(x => x.id === assetId);
            setModalTargetAsset(a || null);
            setActiveModal('depreciation');
          }}
          triggerNotification={addToast}
        />
      )}

      {/* Lifecycle Operations Modal */}
      {activeModal !== 'none' && (
        <AssetLifecycleOperationsModal
          modalType={activeModal}
          targetAsset={modalTargetAsset}
          assets={assets}
          onClose={() => setActiveModal('none')}
          onSaveNewAsset={handleSaveAsset}
          onConfirmTransfer={handleConfirmTransfer}
          onConfirmMaintenance={handleConfirmMaintenance}
          onConfirmDepreciation={handleConfirmDepreciation}
          onConfirmSale={handleConfirmSale}
          onConfirmDiscard={handleConfirmDiscard}
          triggerNotification={addToast}
        />
      )}
    </div>
  );
}
