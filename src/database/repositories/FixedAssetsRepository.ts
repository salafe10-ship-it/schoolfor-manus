import { FixedAsset, AssetMaintenanceLog, AssetTransferLog, AssetDepreciationEntry, AssetTimelineEvent } from '../../types';
import { FallbackStorage } from './FallbackStorage';

const STORAGE_KEY = 'erp_fixed_assets_v2';

const SEED_ASSETS: FixedAsset[] = [
  {
    id: 'FA-001',
    code: 'AST-BUS-01',
    barcode: '629100088101',
    name: 'حافلة نقل طلاب هيونداي County (30 راكب)',
    category: 'سيارات وحافلات',
    group: 'أسطول النقل والمواصلات',
    manufacturer: 'Hyundai',
    model: 'County 2024',
    serialNo: 'VIN-HYU-88291039',
    purchaseDate: '2024-01-15',
    supplier: 'شركة هيونداي للسيارات - وكيل طرابلس',
    invoiceNo: 'INV-2024-9912',
    cost: 180000,
    capitalExp: 15000, // مثلا تكييف إضافي
    scrapValue: 20000,
    usefulLife: 10,
    depRate: '10%',
    depMethod: 'قسط ثابت',
    depStartDate: '2024-02-01',
    assetAccount: '130101 - حافلات ووسائل النقل',
    accDepAccount: '130102 - مجمع إهلاك حافلات النقل',
    depExpenseAccount: '520101 - مصروف إهلاك حافلات النقل',
    accDep: 39000,
    netValue: 156000, // 180000 + 15000 - 39000
    isDepPaused: false,
    status: 'نشط / قيد التشغيل',
    department: 'قسم الحركة والمواصلات',
    branch: 'الفرع الرئيسي - طرابلس',
    location: 'جراج الحافلات الرئيسي',
    responsible: 'أ. سالم عمران (مدير أسطول الحركة)',
    maintenanceLogs: [
      {
        id: 'mnt_01',
        type: 'دورية',
        cost: 2500,
        supplier: 'مركز خدمة هيونداي المعتمد',
        date: '2026-03-10',
        nextDate: '2026-09-10',
        statusAfter: 'ممتاز',
        workOrderNo: 'WO-2026-104',
        spareParts: 'تغيير زيت المحرك، الفلاتر، فحص الفرامل والتكييف',
        notes: 'تمت الصيانة الدورية بنجاح والصلاحية الفنية ممتازة',
        createdBy: 'أ. سالم عمران'
      }
    ],
    transferLogs: [
      {
        id: 'trf_01',
        date: '2025-09-01',
        fromDept: 'قسم المشتريات',
        toDept: 'قسم الحركة والمواصلات',
        fromBranch: 'الفرع الرئيسي - طرابلس',
        toBranch: 'الفرع الرئيسي - طرابلس',
        fromResponsible: 'أ. خالد المفتي',
        toResponsible: 'أ. سالم عمران',
        reason: 'تسليم الحافلة لأسطول النقل المدرسي بعد الشراء',
        approvedBy: 'المدير العام',
        notes: 'تسليم كامل المفاتيح وأوراق التعديل الرأسمالي'
      }
    ],
    depreciationHistory: [
      {
        id: 'dep_2024',
        periodDate: '2024-12-31',
        fiscalYear: '2024',
        depreciationAmount: 18500,
        accumulatedDepreciationAfter: 18500,
        bookValueAfter: 176500,
        jvNumber: 'JV-2024-DEP-01',
        postedAt: '2024-12-31',
        postedBy: 'المدير المالي'
      },
      {
        id: 'dep_2025',
        periodDate: '2025-12-31',
        fiscalYear: '2025',
        depreciationAmount: 19500,
        accumulatedDepreciationAfter: 38000,
        bookValueAfter: 157000,
        jvNumber: 'JV-2025-DEP-01',
        postedAt: '2025-12-31',
        postedBy: 'المدير المالي'
      }
    ],
    timeline: [
      {
        id: 'tl_1',
        timestamp: '2024-01-15 10:00',
        type: 'creation',
        title: 'تسجيل الأصل ورسملته بالشراء',
        description: 'تم تسجيل الحافلة بالفاتورة INV-2024-9912 بمبلغ 180,000 د.ل',
        user: 'أ. خالد المفتي'
      },
      {
        id: 'tl_2',
        timestamp: '2024-03-10 12:30',
        type: 'improvement',
        title: 'تحسين وتطوير رأسمالي',
        description: 'تركيب منظومة تكييف مركزية وكاميرات تتبع بقيمة 15,000 د.ل',
        user: 'أ. خالد المفتي'
      },
      {
        id: 'tl_3',
        timestamp: '2026-03-10 14:00',
        type: 'maintenance',
        title: 'صيانة دورية معتمدة',
        description: 'تغيير الزيوت والفلاتر بمركز هيونداي بقيمة 2,500 د.ل',
        user: 'أ. سالم عمران'
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2026-03-10T14:00:00Z'
  },
  {
    id: 'FA-002',
    code: 'AST-LAB-02',
    barcode: '629100088102',
    name: 'منظومة مختبر الفيزياء والكيمياء التفاعلي المتقدم',
    category: 'أجهزة ومعدات مختبرية',
    group: 'معدات المعامل العلمية',
    manufacturer: 'PASCO Scientific',
    model: 'LabStation Pro 2025',
    serialNo: 'PAS-88192-LY',
    purchaseDate: '2024-09-01',
    supplier: 'شركة ليبيا للتجهيزات العلمية والتقنية',
    invoiceNo: 'INV-2024-1180',
    cost: 120000,
    capitalExp: 0,
    scrapValue: 5000,
    usefulLife: 8,
    depRate: '12.5%',
    depMethod: 'قسط ثابت',
    depStartDate: '2024-09-15',
    assetAccount: '130201 - الأجهزة والمعدات العلمية',
    accDepAccount: '130202 - مجمع إهلاك الأجهزة العلمية',
    depExpenseAccount: '520201 - مصروف إهلاك الأجهزة العلمية',
    accDep: 22500,
    netValue: 97500,
    isDepPaused: false,
    status: 'نشط / قيد التشغيل',
    department: 'قسم العلوم والمختبرات',
    branch: 'الفرع الرئيسي - طرابلس',
    location: 'مختبر الكيمياء والفيزياء - الدور الثاني',
    responsible: 'د. عثمان الغرياني (رئيس قسم العلوم)',
    maintenanceLogs: [
      {
        id: 'mnt_02',
        type: 'دورية',
        cost: 1200,
        supplier: 'شركة ليبيا للتجهيزات العلمية',
        date: '2026-01-20',
        nextDate: '2026-07-20',
        statusAfter: 'ممتاز',
        workOrderNo: 'WO-2026-012',
        spareParts: 'معايرة الحساسات الرقمية واستبدال الموازين الإلكترونية',
        notes: 'تمت المعايرة وصلاحيات الأجهزة 100%',
        createdBy: 'د. عثمان الغرياني'
      }
    ],
    transferLogs: [],
    depreciationHistory: [
      {
        id: 'dep_lab_2025',
        periodDate: '2025-12-31',
        fiscalYear: '2025',
        depreciationAmount: 15000,
        accumulatedDepreciationAfter: 22500,
        bookValueAfter: 97500,
        jvNumber: 'JV-2025-DEP-02',
        postedAt: '2025-12-31',
        postedBy: 'المدير المالي'
      }
    ],
    timeline: [
      {
        id: 'tl_lab_1',
        timestamp: '2024-09-01 09:00',
        type: 'creation',
        title: 'شراء وتوريد معامل العلوم',
        description: 'تسجيل التوريد بالفاتورة INV-2024-1180 بقيمة 120,000 د.ل',
        user: 'د. عثمان الغرياني'
      }
    ],
    createdAt: '2024-09-01T09:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'FA-003',
    code: 'AST-PWR-03',
    barcode: '629100088103',
    name: 'مولد كهرباء كاتم للصوت كبرس بقدرة 250 KVA',
    category: 'أجهزة ومولدات طاقة',
    group: 'أنظمة الطاقة والطوارئ',
    manufacturer: 'Perkins / Stamford',
    model: 'PK-250 Silent',
    serialNo: 'SNL-PERK-991204',
    purchaseDate: '2023-05-10',
    supplier: 'شركة الطاقة والطاقات المتجددة',
    invoiceNo: 'INV-2023-441',
    cost: 160000,
    capitalExp: 20000, // مفتاح تحويل تلقائي ATS
    scrapValue: 15000,
    usefulLife: 10,
    depRate: '10%',
    depMethod: 'قسط ثابت',
    depStartDate: '2023-06-01',
    assetAccount: '130301 - المولدات والمعدات الكهروميكانيكية',
    accDepAccount: '130302 - مجمع إهلاك المولدات',
    depExpenseAccount: '520301 - مصروف إهلاك المولدات',
    accDep: 49500,
    netValue: 130500, // 160000 + 20000 - 49500
    isDepPaused: false,
    status: 'نشط / قيد التشغيل',
    department: 'إدارة الصيانة والمرافق',
    branch: 'الفرع الرئيسي - طرابلس',
    location: 'غرفة المولدات الكهربائية - الفناء الخارجي',
    responsible: 'م. عبد السلام الزوي (مدير الصيانة)',
    maintenanceLogs: [
      {
        id: 'mnt_03',
        type: 'طارئة',
        cost: 3800,
        supplier: 'شركة الطاقة المعتمدة',
        date: '2026-05-15',
        nextDate: '2026-11-15',
        statusAfter: 'ممتاز',
        workOrderNo: 'WO-2026-302',
        spareParts: 'استبدال طلمبة الديزل وفلاتر الزيت والوقود وتحسين العازل',
        notes: 'صيانة طارئة بعد الانقطاع الكهربائي والجاهزية الفنية ممتازة',
        createdBy: 'م. عبد السلام الزوي'
      }
    ],
    transferLogs: [],
    depreciationHistory: [],
    timeline: [
      {
        id: 'tl_pwr_1',
        timestamp: '2023-05-10 11:00',
        type: 'creation',
        title: 'شراء مولد الكهرباء الرئيسي',
        description: 'توريد مولد بيركنز بقيمة 160,000 د.ل',
        user: 'م. عبد السلام الزوي'
      }
    ],
    createdAt: '2023-05-10T11:00:00Z',
    updatedAt: '2026-05-15T12:00:00Z'
  },
  {
    id: 'FA-004',
    code: 'AST-FUR-04',
    barcode: '629100088104',
    name: 'تجهيزات وأثاث المسرح المدرسي والقاعة الكبرى (300 مقعد)',
    category: 'أثاث وتجهيزات مدرسية',
    group: 'الأثاث المكتبي والمدرسي',
    manufacturer: 'شركة الرواد للتجهيزات الفندقية والمدرسية',
    model: 'Auditorium Luxe 2024',
    serialNo: 'FUR-AUD-300-SET',
    purchaseDate: '2024-02-20',
    supplier: 'شركة الرواد للتأثيث',
    invoiceNo: 'INV-2024-5501',
    cost: 95000,
    capitalExp: 0,
    scrapValue: 5000,
    usefulLife: 10,
    depRate: '10%',
    depMethod: 'قسط ثابت',
    depStartDate: '2024-03-01',
    assetAccount: '130401 - الأثاث والتجهيزات المدرسية',
    accDepAccount: '130402 - مجمع إهلاك الأثاث المدرسي',
    depExpenseAccount: '520401 - مصروف إهلاك الأثاث المدرسي',
    accDep: 19000,
    netValue: 76000,
    isDepPaused: false,
    status: 'نشط / قيد التشغيل',
    department: 'إدارة النشاط المدرسي',
    branch: 'الفرع الرئيسي - طرابلس',
    location: 'المسرح المدرسي الرئيسي',
    responsible: 'أ. إلهام الشريف (مسؤولة النشاط)',
    maintenanceLogs: [],
    transferLogs: [],
    depreciationHistory: [],
    timeline: [],
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z'
  }
];

export class FixedAssetsRepository {
  private static assertAuthoritativePersistence(operation: string): void {
    FallbackStorage.assertCanonicalPersistence(`fixed assets ${operation}`);
  }

  private static getAssets(): FixedAsset[] {
    this.assertAuthoritativePersistence('read');
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading fixed assets storage:', e);
    }
    // لا تُزرع أصول أو تكاليف أو سجلات إهلاك محليًا؛ المصدر المحاسبي المركزي وحده.
    return [];
  }

  private static saveAssets(assets: FixedAsset[]): void {
    this.assertAuthoritativePersistence('write');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    } catch (e) {
      console.error('Error saving fixed assets:', e);
    }
  }

  public static getAll(): FixedAsset[] {
    return this.getAssets();
  }

  public static getById(id: string): FixedAsset | undefined {
    return this.getAssets().find(a => a.id === id);
  }

  public static save(asset: FixedAsset): FixedAsset {
    const assets = this.getAssets();
    const index = assets.findIndex(a => a.id === asset.id);

    // Calculate Net Value
    const cost = Number(asset.cost || 0);
    const capitalExp = Number(asset.capitalExp || 0);
    const accDep = Number(asset.accDep || 0);
    const updatedAsset: FixedAsset = {
      ...asset,
      netValue: Math.max(0, cost + capitalExp - accDep),
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      assets[index] = updatedAsset;
    } else {
      assets.unshift(updatedAsset);
    }

    this.saveAssets(assets);
    return updatedAsset;
  }

  public static delete(id: string): boolean {
    const assets = this.getAssets();
    const asset = assets.find(a => a.id === id);
    if (!asset) return false;

    // Protection rule: cannot delete asset if it has posted depreciation JV entries or financial history
    if (asset.depreciationHistory && asset.depreciationHistory.length > 0) {
      throw new Error('لا يمكن حذف الأصل الثابت نظراً لوجود قيود إهلاك مرحلة بالنظام المالي. يُرجى بيع أو استبعاد الأصل بدلاً من الحذف للحفاظ على السلامة المحاسبية.');
    }

    const filtered = assets.filter(a => a.id !== id);
    this.saveAssets(filtered);
    return true;
  }

  public static addMaintenanceLog(assetId: string, log: Omit<AssetMaintenanceLog, 'id'>): FixedAsset {
    const asset = this.getById(assetId);
    if (!asset) throw new Error('الأصل غير موجود');

    const newLog: AssetMaintenanceLog = {
      ...log,
      id: `mnt_${Date.now()}`
    };

    const newTimelineEvent: AssetTimelineEvent = {
      id: `tl_${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-LY'),
      type: 'maintenance',
      title: 'تسجيل صيانة ومصاريف تشغيل',
      description: `صيانة ${log.type} بقيمة ${log.cost} د.ل (${log.notes || 'لا توجد ملاحظات'})`,
      user: log.createdBy || 'المستخدم الحالي'
    };

    const updated: FixedAsset = {
      ...asset,
      maintenanceLogs: [newLog, ...(asset.maintenanceLogs || [])],
      timeline: [newTimelineEvent, ...(asset.timeline || [])],
      updatedAt: new Date().toISOString()
    };

    return this.save(updated);
  }

  public static addTransferLog(assetId: string, log: Omit<AssetTransferLog, 'id'>): FixedAsset {
    const asset = this.getById(assetId);
    if (!asset) throw new Error('الأصل غير موجود');

    const newLog: AssetTransferLog = {
      ...log,
      id: `trf_${Date.now()}`
    };

    const newTimelineEvent: AssetTimelineEvent = {
      id: `tl_trf_${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-LY'),
      type: 'transfer',
      title: 'نقل الأصل وتعديل العهدة',
      description: `نقل من (${log.fromDept || 'القسم السابق'}) إلى (${log.toDept}) | المسؤول الجديد: (${log.toResponsible})`,
      user: log.approvedBy || 'المستخدم الحالي'
    };

    const updated: FixedAsset = {
      ...asset,
      department: log.toDept || asset.department,
      branch: log.toBranch || asset.branch,
      responsible: log.toResponsible || asset.responsible,
      transferLogs: [newLog, ...(asset.transferLogs || [])],
      timeline: [newTimelineEvent, ...(asset.timeline || [])],
      updatedAt: new Date().toISOString()
    };

    return this.save(updated);
  }

  public static postDepreciation(assetId: string, fiscalYear: string, user: string = 'المدير المالي'): FixedAsset {
    const asset = this.getById(assetId);
    if (!asset) throw new Error('الأصل غير موجود');

    if (asset.isDepPaused) {
      throw new Error('حساب الإهلاك متوقف لهذا الأصل بناءً على الإعدادات الحالية.');
    }

    if (asset.status === 'تم بيعه' || asset.status === 'مستبعد / كلي') {
      throw new Error('لا يمكن احتساب إهلاك لأصل مستبعد أو تم بيعه.');
    }

    const cost = Number(asset.cost || 0) + Number(asset.capitalExp || 0);
    const scrap = Number(asset.scrapValue || 0);
    const depreciableBase = Math.max(0, cost - scrap);
    const life = Number(asset.usefulLife || 1);

    // Straight Line Depreciation Annual Amount
    const annualDep = depreciableBase / life;
    const currentAccDep = Number(asset.accDep || 0);
    const newAccDep = Math.min(depreciableBase, currentAccDep + annualDep);
    const newNetValue = Math.max(scrap, cost - newAccDep);

    const depEntry: AssetDepreciationEntry = {
      id: `dep_${Date.now()}`,
      periodDate: new Date().toISOString().split('T')[0],
      fiscalYear,
      depreciationAmount: Math.round(annualDep),
      accumulatedDepreciationAfter: Math.round(newAccDep),
      bookValueAfter: Math.round(newNetValue),
      jvNumber: `JV-${fiscalYear}-DEP-${Math.floor(100 + Math.random() * 900)}`,
      postedAt: new Date().toLocaleString('ar-LY'),
      postedBy: user
    };

    const newTimelineEvent: AssetTimelineEvent = {
      id: `tl_dep_${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-LY'),
      type: 'depreciation',
      title: `قيد إهلاك سنة ${fiscalYear}`,
      description: `تم قيد وترحيل قسط إهلاك بقيمة ${Math.round(annualDep).toLocaleString()} د.ل بالقيد (${depEntry.jvNumber})`,
      user
    };

    const updated: FixedAsset = {
      ...asset,
      accDep: Math.round(newAccDep),
      netValue: Math.round(newNetValue),
      depreciationHistory: [depEntry, ...(asset.depreciationHistory || [])],
      timeline: [newTimelineEvent, ...(asset.timeline || [])],
      updatedAt: new Date().toISOString()
    };

    return this.save(updated);
  }

  public static sellAsset(assetId: string, price: number, buyer: string, notes: string, user: string = 'المدير المالي'): FixedAsset {
    const asset = this.getById(assetId);
    if (!asset) throw new Error('الأصل غير موجود');

    const netValue = Number(asset.netValue || 0);
    const gainOrLoss = price - netValue;

    const newTimelineEvent: AssetTimelineEvent = {
      id: `tl_sale_${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-LY'),
      type: 'sale',
      title: 'إثبات بيع الأصل الثابت',
      description: `تم بيع الأصل للمشتري (${buyer}) بسعر ${price.toLocaleString()} د.l. (${gainOrLoss >= 0 ? `أرباح رأسمالية: +${gainOrLoss.toLocaleString()}` : `خسائر رأسمالية: ${gainOrLoss.toLocaleString()}`})`,
      user
    };

    const updated: FixedAsset = {
      ...asset,
      status: 'تم بيعه',
      timeline: [newTimelineEvent, ...(asset.timeline || [])],
      updatedAt: new Date().toISOString()
    };

    return this.save(updated);
  }

  public static discardAsset(assetId: string, notes: string, user: string = 'المدير المالي'): FixedAsset {
    const asset = this.getById(assetId);
    if (!asset) throw new Error('الأصل غير موجود');

    const newTimelineEvent: AssetTimelineEvent = {
      id: `tl_discard_${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-LY'),
      type: 'discard',
      title: 'استبعاد وتكهين الأصل',
      description: `تم استبعاد الأصل الثابت وشطب صافي القيمة الدفترية (${asset.netValue.toLocaleString()} د.ل). الملاحظات: ${notes}`,
      user
    };

    const updated: FixedAsset = {
      ...asset,
      status: 'مستبعد / كلي',
      timeline: [newTimelineEvent, ...(asset.timeline || [])],
      updatedAt: new Date().toISOString()
    };

    return this.save(updated);
  }
}
