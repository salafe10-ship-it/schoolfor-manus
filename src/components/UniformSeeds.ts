/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  UniformCategory, 
  UniformItem, 
  UniformSize, 
  UniformColor, 
  UniformVariant, 
  UniformSupplier, 
  UniformPurchaseOrder,
  StudentMeasurement,
  UniformReservation,
  UniformReturn,
  UniformInventoryCount,
  AccountingJournalEntry
} from '../types/uniform';

export const initialCategories: UniformCategory[] = [
  { id: 'cat_1', name: 'الزي المدرسي الأساسي - بنين', description: 'الزي الرسمي اليومي المعتمد لطلاب مجمع سحاب', schoolStage: 'All' },
  { id: 'cat_2', name: 'الزي المدرسي الأساسي - بنات', description: 'الزي الرسمي اليومي المعتمد لطالبات مجمع سحاب', schoolStage: 'All' },
  { id: 'cat_3', name: 'الملابس الرياضية الموحدة', description: 'الأطقم الرياضية المخصصة لحصص التربية البدنية', schoolStage: 'All' },
  { id: 'cat_4', name: 'الملابس والسترات الشتوية', description: 'جاكيتات وسترات ثقيلة مقاومة للبرد بختم المدرسة', schoolStage: 'All' }
];

export const initialItems: UniformItem[] = [
  {
    id: 'item_1',
    code: 'UNI-SH-B',
    barcode: '6281100220011',
    nameAr: 'قميص مدرسي أبيض كلاسيك - بنين',
    nameEn: 'Boys Classic White School Shirt',
    categoryId: 'cat_1',
    group: 'Boys',
    division: 'Regular',
    season: 'Summer',
    gender: 'Male',
    description: 'قميص أبيض بأزرار مخفية وشعار مجمع سحاب مطرز بدقة على الصدر.',
    brand: 'سحاب ستايل',
    fabricType: 'قطن مخلوط فاخر',
    cottonPercent: 65,
    weightGsm: 120,
    washInstructions: 'غسيل آلي بماء دافئ - لا تستخدم المبيضات الكيميائية',
    minPrice: 35,
    maxPrice: 60,
    marginPercent: 30
  },
  {
    id: 'item_2',
    code: 'UNI-PT-B',
    barcode: '6281100220022',
    nameAr: 'بنطال مدرسي رسمي كحلي - بنين',
    nameEn: 'Boys Classic Navy Trousers',
    categoryId: 'cat_1',
    group: 'Boys',
    division: 'Regular',
    season: 'All',
    gender: 'Male',
    description: 'بنطال كلاسيكي مريح ومقاوم للتجعد ومزود بجيوب جانبية وخلفية.',
    brand: 'سحاب ستايل',
    fabricType: 'صوف وتيريلين مقاوم للاهتراء',
    cottonPercent: 30,
    weightGsm: 240,
    washInstructions: 'غسيل جاف أو غسيل يدوي بارد - كوي بدرجة حرارة متوسطة',
    minPrice: 50,
    maxPrice: 90,
    marginPercent: 40
  },
  {
    id: 'item_3',
    code: 'UNI-DR-G',
    barcode: '6281100220033',
    nameAr: 'مريول مدرسي كحلي كامل - بنات',
    nameEn: 'Girls Navy School Pinafore',
    categoryId: 'cat_2',
    group: 'Girls',
    division: 'Regular',
    season: 'All',
    gender: 'Female',
    description: 'مريول مدرسي مريح بكسرات أمامية أنيقة وجيوب مخفية ومناسب لجميع المراحل.',
    brand: 'موضة التعليم',
    fabricType: 'تيريلين وبوليستر فاخر',
    cottonPercent: 20,
    weightGsm: 220,
    washInstructions: 'غسيل آلي بماء بارد - كوي خفيف',
    minPrice: 60,
    maxPrice: 110,
    marginPercent: 45
  },
  {
    id: 'item_4',
    code: 'UNI-SP-U',
    barcode: '6281100220044',
    nameAr: 'طقم رياضي متكامل (تيشيرت + بنطال)',
    nameEn: 'Unisex Athletic Gym Set',
    categoryId: 'cat_3',
    group: 'Unisex',
    division: 'Sports',
    season: 'All',
    gender: 'Unisex',
    description: 'طقم رياضي خفيف ومسامي يمتص العرق ومطرز بشعار المجمع واللجنة الرياضية.',
    brand: 'نشاط تيك',
    fabricType: 'بوليستر جاف ذكي وقطن',
    cottonPercent: 50,
    weightGsm: 180,
    washInstructions: 'غسيل مقلوب بماء بارد - تجفيف بالهواء الطبيعي',
    minPrice: 70,
    maxPrice: 130,
    marginPercent: 35
  },
  {
    id: 'item_5',
    code: 'UNI-JK-W',
    barcode: '6281100220055',
    nameAr: 'جاكيت شتوي مبطن بقلنسوة - للجنسين',
    nameEn: 'Unisex Padded Winter Jacket',
    categoryId: 'cat_4',
    group: 'Unisex',
    division: 'Winter',
    season: 'Winter',
    gender: 'Unisex',
    description: 'جاكيت شتوي دافئ للغاية مقاوم للماء والرياح ببطانة ناعمة لحماية الطلاب.',
    brand: 'شتاء دافئ',
    fabricType: 'نايلون مقاوم للمطر ببطانة صوفية',
    cottonPercent: 10,
    weightGsm: 350,
    washInstructions: 'تنظيف جاف فقط - لا تعرضه لدرجات حرارة كوي عالية',
    minPrice: 100,
    maxPrice: 200,
    marginPercent: 50
  }
];

export const initialSizes: UniformSize[] = [
  { id: 'sz_1', code: 'S', description: 'مقاس صغير (يناسب الابتدائي)' },
  { id: 'sz_2', code: 'M', description: 'مقاس متوسط (يناسب المتوسط)' },
  { id: 'sz_3', code: 'L', description: 'مقاس كبير (يناسب الثانوي)' },
  { id: 'sz_4', code: 'XL', description: 'مقاس كبير جداً' },
  { id: 'sz_5', code: 'XXL', description: 'مقاس ضخم خاص' }
];

export const initialColors: UniformColor[] = [
  { id: 'cl_1', name: 'أبيض ناصع', hex: '#FFFFFF' },
  { id: 'cl_2', name: 'كحلي داكن', hex: '#0F172A' },
  { id: 'cl_3', name: 'رمادي مدرسي', hex: '#64748B' },
  { id: 'cl_4', name: 'أخضر رياضي', hex: '#16A34A' }
];

export const initialVariants: UniformVariant[] = [
  // Shirts
  { id: 'var_1', itemId: 'item_1', sizeId: 'sz_1', colorId: 'cl_1', sku: 'SKU-SH-WHT-S', stockQty: 120, buyPrice: 30, sellPrice: 45, studentPrice: 42, wholesalePrice: 38, alertLimit: 15, reorderPoint: 30, maxLimit: 300, locationCode: 'A1-01' },
  { id: 'var_2', itemId: 'item_1', sizeId: 'sz_2', colorId: 'cl_1', sku: 'SKU-SH-WHT-M', stockQty: 85, buyPrice: 30, sellPrice: 45, studentPrice: 42, wholesalePrice: 38, alertLimit: 15, reorderPoint: 25, maxLimit: 250, locationCode: 'A1-02' },
  { id: 'var_3', itemId: 'item_1', sizeId: 'sz_3', colorId: 'cl_1', sku: 'SKU-SH-WHT-L', stockQty: 4, buyPrice: 32, sellPrice: 48, studentPrice: 45, wholesalePrice: 40, alertLimit: 10, reorderPoint: 20, maxLimit: 200, locationCode: 'A1-03' }, // Low Stock
  
  // Pants
  { id: 'var_4', itemId: 'item_2', sizeId: 'sz_1', colorId: 'cl_2', sku: 'SKU-PT-NVY-S', stockQty: 60, buyPrice: 45, sellPrice: 70, studentPrice: 65, wholesalePrice: 55, alertLimit: 10, reorderPoint: 20, maxLimit: 200, locationCode: 'B2-01' },
  { id: 'var_5', itemId: 'item_2', sizeId: 'sz_2', colorId: 'cl_2', sku: 'SKU-PT-NVY-M', stockQty: 40, buyPrice: 45, sellPrice: 70, studentPrice: 65, wholesalePrice: 55, alertLimit: 10, reorderPoint: 15, maxLimit: 150, locationCode: 'B2-02' },
  { id: 'var_6', itemId: 'item_2', sizeId: 'sz_3', colorId: 'cl_2', sku: 'SKU-PT-NVY-L', stockQty: 0, buyPrice: 48, sellPrice: 75, studentPrice: 70, wholesalePrice: 60, alertLimit: 8, reorderPoint: 15, maxLimit: 150, locationCode: 'B2-03' }, // Out of stock

  // Pinafores
  { id: 'var_7', itemId: 'item_3', sizeId: 'sz_1', colorId: 'cl_2', sku: 'SKU-PIN-NVY-S', stockQty: 75, buyPrice: 55, sellPrice: 90, studentPrice: 85, wholesalePrice: 75, alertLimit: 12, reorderPoint: 25, maxLimit: 200, locationCode: 'C3-01' },
  { id: 'var_8', itemId: 'item_3', sizeId: 'sz_2', colorId: 'cl_2', sku: 'SKU-PIN-NVY-M', stockQty: 62, buyPrice: 55, sellPrice: 90, studentPrice: 85, wholesalePrice: 75, alertLimit: 12, reorderPoint: 20, maxLimit: 180, locationCode: 'C3-02' },

  // PE Set
  { id: 'var_9', itemId: 'item_4', sizeId: 'sz_2', colorId: 'cl_4', sku: 'SKU-GYM-GRN-M', stockQty: 110, buyPrice: 60, sellPrice: 100, studentPrice: 95, wholesalePrice: 80, alertLimit: 15, reorderPoint: 25, maxLimit: 250, locationCode: 'D4-01' },

  // Winter Jacket
  { id: 'var_10', itemId: 'item_5', sizeId: 'sz_3', colorId: 'cl_3', sku: 'SKU-JK-GRY-L', stockQty: 30, buyPrice: 90, sellPrice: 160, studentPrice: 150, wholesalePrice: 130, alertLimit: 5, reorderPoint: 10, maxLimit: 100, locationCode: 'E5-01' }
];

export const initialSuppliers: UniformSupplier[] = [
  {
    id: 'sup_1',
    code: 'SUP-001',
    name: 'مجموعة النسيج الفاخر لليونيفورم والملابس الجاهزة',
    phone: '0112223344',
    mobile: '0501112223',
    email: 'info@premiumtextile.com',
    address: 'المنطقة الصناعية الثانية، الرياض، المملكة العربية السعودية',
    taxNumber: '310229384900003',
    bankName: 'مصرف الراجحي',
    iban: 'SA8080000001020304050607',
    paymentTerms: '30 Days',
    classification: 'A',
    status: 'active'
  },
  {
    id: 'sup_2',
    code: 'SUP-002',
    name: 'مؤسسة خطوط الخياطة المدرسية والتطريز الحديث',
    phone: '0123334455',
    mobile: '0505556667',
    email: 'sales@tailoringlines.sa',
    address: 'حي الصفا، جدة، المملكة العربية السعودية',
    taxNumber: '310459203900003',
    bankName: 'البنك الأهلي السعودي SNB',
    iban: 'SA4010000009876543210123',
    paymentTerms: 'Cash',
    classification: 'B',
    status: 'active'
  }
];

export const initialPOs: UniformPurchaseOrder[] = [
  {
    id: 'po_1',
    code: 'PO-2026-001',
    supplierId: 'sup_1',
    issueDate: '2026-05-10',
    dueDate: '2026-06-10',
    status: 'Received',
    totalAmount: 12500,
    notes: 'توريد دفعة الصيف التمهيدية من القمصان والبناطيل الكحلية لمختلف المقاسات.'
  },
  {
    id: 'po_2',
    code: 'PO-2026-002',
    supplierId: 'sup_2',
    issueDate: '2026-06-25',
    dueDate: '2026-07-25',
    status: 'Approved',
    totalAmount: 4800,
    notes: 'طلب توريد معجل لسترات شتوية وجواكيت مقاس L للأقسام الإعدادية والثانوية.'
  }
];

export const initialMeasurements: StudentMeasurement[] = [
  {
    id: 'ms_1',
    studentId: 'stud_1', // Ahmad
    heightCm: 168,
    weightKg: 58,
    chestCm: 84,
    waistCm: 76,
    pantsLengthCm: 95,
    sleeveLengthCm: 62,
    shoeSize: 41,
    recommendedSize: 'M',
    updatedAt: '2026-06-01'
  },
  {
    id: 'ms_2',
    studentId: 'stud_2', // Fatima
    heightCm: 154,
    weightKg: 46,
    chestCm: 78,
    waistCm: 68,
    pantsLengthCm: 84,
    sleeveLengthCm: 56,
    shoeSize: 38,
    recommendedSize: 'S',
    updatedAt: '2026-06-05'
  }
];

export const initialReservations: UniformReservation[] = [
  {
    id: 'res_1',
    studentId: 'stud_3', // Ali
    variantId: 'var_6', // Out of stock pants S-sz3
    qty: 2,
    date: '2026-06-20',
    status: 'Pending',
    notes: 'طالب ثانوي يحتاج قطعتين بنطال مقاس كبير، سيتم الاتصال به فور وصول الشحنة من المورد.'
  }
];

export const initialReturns: UniformReturn[] = [
  {
    id: 'ret_1',
    code: 'RET-2026-001',
    type: 'StudentReturn',
    studentId: 'stud_1',
    variantId: 'var_1',
    qty: 1,
    date: '2026-06-18',
    totalRefund: 45,
    refundMethod: 'Cash',
    reason: 'المقاس كان صغيراً جداً على الطالب تم الاستبدال وتأكيد الفاتورة',
    sizeChangeTo: 'M'
  }
];

export const initialCounts: UniformInventoryCount[] = [
  {
    id: 'cnt_1',
    code: 'JRD-2026-001',
    startDate: '2026-06-30',
    endDate: '2026-06-30',
    type: 'Full',
    status: 'Approved',
    verifiedBy: 'salafe10@gmail.com',
    notes: 'الجرد النصفي المعتمد من قبل مدير المستودعات والمالية لمطابقة الأرصدة.'
  }
];

export const initialJournals: AccountingJournalEntry[] = [
  {
    id: 'je_1',
    date: '2026-06-15',
    reference: 'SALES-UNIFORM-102',
    description: 'إثبات مبيعات الزي المدرسي النقدي - فاتورة رقم INV-U-102',
    lines: [
      { accountCode: '1101', accountName: 'الصندوق / النقدية بالمدرسة', debit: 180, credit: 0 },
      { accountCode: '4105', accountName: 'إيرادات بيع الزي المدرسي والملابس', debit: 0, credit: 180 },
      { accountCode: '5105', accountName: 'تكلفة مبيعات الزي والملابس', debit: 120, credit: 0 },
      { accountCode: '1205', accountName: 'مخزون الزي المدرسي والملابس', debit: 0, credit: 120 }
    ]
  },
  {
    id: 'je_2',
    date: '2026-06-20',
    reference: 'PURCHASE-UNIFORM-001',
    description: 'إثبات استلام وتوريد شحنة ملابس من مورد - سند استلام رقم REC-001',
    lines: [
      { accountCode: '1205', accountName: 'مخزون الزي المدرسي والملابس', debit: 12500, credit: 0 },
      { accountCode: '2101', accountName: 'ذمم الموردين - شركة النسيج الفاخر', debit: 0, credit: 12500 }
    ]
  }
];
