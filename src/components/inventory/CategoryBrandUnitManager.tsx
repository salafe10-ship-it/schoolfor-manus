import React, { useState } from 'react';
import { Tag, Tags, Ruler, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { InventoryCategory, InventoryUnit } from '../../types';

interface CategoryBrandUnitManagerProps {
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function CategoryBrandUnitManager({ triggerNotification }: CategoryBrandUnitManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'brands' | 'units'>('categories');

  const [categories, setCategories] = useState<InventoryCategory[]>([]);

  const [brands, setBrands] = useState<any[]>([]);

  const [units, setUnits] = useState<InventoryUnit[]>([]);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs switcher */}
      <div className="p-4 flex flex-wrap gap-2">
        <button 
          onClick={() => setActiveSubTab('categories')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeSubTab === 'categories' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <Tag className="w-4 h-4" /> الفئات والتصنيفات ({categories.length})
        </button>

        <button 
          onClick={() => setActiveSubTab('brands')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeSubTab === 'brands' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <Tags className="w-4 h-4" /> العلامات التجارية ({brands.length})
        </button>

        <button 
          onClick={() => setActiveSubTab('units')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeSubTab === 'units' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <Ruler className="w-4 h-4" /> وحدات القياس ({units.length})
        </button>
      </div>

      {/* Categories View */}
      {activeSubTab === 'categories' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">دليل التصنيفات الفنية للأصناف</h4>
            <button 
              onClick={() => {
                const name = prompt('أدخل اسم التصنيف الجديد:');
                if (name) {
                  setCategories([...categories, { id: `cat_${Date.now()}`, schoolId: 'school_1', name, description: '' }]);
                  notify(`✓ تم إضافة التصنيف (${name}) بنجاح`, 'success');
                }
              }}
              className="px-4 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> إضافة تصنيف
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 bg-transparent space-y-2">
                <span className="text-xs font-mono font-bold text-amber-600">{cat.id}</span>
                <h5 className="font-black text-slate-900 text-base">{cat.name}</h5>
                <p className="text-xs text-slate-500">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brands View */}
      {activeSubTab === 'brands' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">دليل العلامات التجارية والماركات</h4>
            <button 
              onClick={() => {
                const name = prompt('أدخل اسم العلامة التجارية الجديدة:');
                if (name) {
                  setBrands([...brands, { id: `brand_${Date.now()}`, name, origin: '', itemsCount: 0 }]);
                  notify(`✓ تم إضافة العلامة التجارية (${name}) بنجاح`, 'success');
                }
              }}
              className="px-4 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> إضافة علامة تجارية
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {brands.map((b) => (
              <div key={b.id} className="p-4 bg-transparent space-y-1">
                <h5 className="font-black text-slate-900 text-base">{b.name}</h5>
                <p className="text-xs text-slate-500">بلد المنشأ: {b.origin}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Units View */}
      {activeSubTab === 'units' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">دليل وحدات القياس المعتمدة</h4>
            <button 
              onClick={() => {
                const name = prompt('أدخل اسم وحدة القياس (مثل: كرتونة/طقم):');
                if (name) {
                  setUnits([...units, { id: `unit_${Date.now()}`, schoolId: 'school_1', name, symbol: name }]);
                  notify(`✓ تم إضافة وحدة القياس (${name}) بنجاح`, 'success');
                }
              }}
              className="px-4 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> إضافة وحدة قياس
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {units.map((u) => (
              <div key={u.id} className="p-4 bg-transparent text-center space-y-1">
                <span className="text-xs font-mono font-bold text-slate-400 block">{u.id}</span>
                <h5 className="font-black text-slate-900 text-lg">{u.name}</h5>
                <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded text-xs font-bold">{u.symbol}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
