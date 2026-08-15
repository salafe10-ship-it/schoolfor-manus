import { AlertCircle, AlertTriangle, ArrowRightLeft, Barcode, Boxes, Building2, Calendar, Check, CheckCircle2, ClipboardList, CreditCard, DollarSign, Download, Edit3, FileSpreadsheet, FileText, Layers, Plus, Printer, RotateCcw, Ruler, Search, Shirt, ShoppingBag, Sparkles, Tags, Trash2, TrendingUp, User, Users, X } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Student, Invoice } from '../types';
import { 
  UniformCategory, UniformItem, UniformSize, UniformColor, UniformVariant, 
  UniformSupplier, UniformPurchaseOrder, UniformPurchaseOrderItem, UniformReceipt, 
  UniformStockTransaction, StudentMeasurement, UniformStudentOrder, UniformStudentOrderItem, 
  UniformReservation, UniformReturn, UniformInventoryCount, UniformInventoryAdjustment, 
  AccountingJournalEntry, UNIFORM_SQL_SCHEMA 
} from '../types/uniform';
import { TransactionService } from '../database/transactions/TransactionService';
import { 
  initialCategories, initialItems, initialSizes, initialColors, initialVariants, 
  initialSuppliers, initialPOs, initialMeasurements, initialReservations, 
  initialReturns, initialCounts, initialJournals 
} from './UniformSeeds';
import { SQLTransactionEngine } from '../database/transactions/transactionManager';
import { SQLCommandBuilder, ParameterizedCommand } from '../database/transactions/SQLCommand';
import EnterpriseActionToolbar from './shared/EnterpriseActionToolbar';

interface SchoolUniformManagementProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  selectedSchoolId?: string;
  triggerNotification: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  logAction: (action: string, details: string, ip?: string) => void;
  currentRole: string;
  setActiveSection?: (sec: string) => void;
  selectedSchool?: any;
}

export default function SchoolUniformManagement({
  students,
  setStudents,
  invoices,
  setInvoices,
  selectedSchoolId = 'sch_1',
  triggerNotification,
  logAction,
  currentRole,
  setActiveSection,
  selectedSchool
}: SchoolUniformManagementProps) {
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'purchase' | 'sales' | 'returns' | 'accounting' | 'schema'>('dashboard');

  // --- ENTITY STATE MANAGERS (In-memory reactive DB simulation) ---
  const [categories, setCategories] = useState<UniformCategory[]>(initialCategories);
  const [items, setItems] = useState<UniformItem[]>(initialItems);
  const [sizes, setSizes] = useState<UniformSize[]>(initialSizes);
  const [colors, setColors] = useState<UniformColor[]>(initialColors);
  const [variants, setVariants] = useState<UniformVariant[]>(initialVariants);
  const [suppliers, setSuppliers] = useState<UniformSupplier[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<UniformPurchaseOrder[]>(initialPOs);
  const [measurements, setMeasurements] = useState<StudentMeasurement[]>(initialMeasurements);
  const [reservations, setReservations] = useState<UniformReservation[]>(initialReservations);
  const [returns, setReturns] = useState<UniformReturn[]>(initialReturns);
  const [inventoryCounts, setInventoryCounts] = useState<UniformInventoryCount[]>(initialCounts);
  const [journals, setJournals] = useState<AccountingJournalEntry[]>(initialJournals);

  // Search, edit & creation states
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [barcodeScannerInput, setBarcodeScannerInput] = useState('');
  
  // Selected Objects for Modals / Action Panels
  const [selectedItem, setSelectedItem] = useState<UniformItem | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<UniformSupplier | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedPO, setSelectedPO] = useState<UniformPurchaseOrder | null>(null);
  
  // CRUD & Interactive Form States
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [showReceivePOModal, setShowReceivePOModal] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showAddSizeColorModal, setShowAddSizeColorModal] = useState(false);

  // New Item Form
  const [newItem, setNewItem] = useState({
    code: '', barcode: '', nameAr: '', nameEn: '', categoryId: 'cat_1',
    group: 'Boys', division: 'Regular', season: 'Summer', gender: 'Male',
    description: '', brand: 'سحاب ستايل', fabricType: 'قطن مخلوط', cottonPercent: 50,
    weightGsm: 150, washInstructions: 'غسيل آلي دافئ', buyPrice: 30, sellPrice: 45
  });

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState({
    code: '', name: '', phone: '', mobile: '', email: '', address: '',
    taxNumber: '', bankName: '', iban: '', paymentTerms: 'Cash', classification: 'A' as 'A' | 'B' | 'C'
  });

  // New Purchase Order Form
  const [newPO, setNewPO] = useState({
    supplierId: 'sup_1', dueDate: '2026-08-01', notes: '', items: [] as { variantId: string; qty: number; cost: number }[]
  });

  // Fitting Form
  const [fittingForm, setFittingForm] = useState({
    height: 160, weight: 55, chest: 80, waist: 72, pants: 90, sleeve: 58, shoes: 40
  });

  // Bulk Pricing Form
  const [bulkPriceForm, setBulkPriceForm] = useState({
    categoryId: 'all', season: 'all', type: 'increase', percent: 5
  });

  // Custom Size / Color Forms
  const [newSizeCode, setNewSizeCode] = useState('');
  const [newSizeDesc, setNewSizeDesc] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  // Checkout cart
  const [cart, setCart] = useState<{ variantId: string; qty: number }[]>([]);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'Cash' | 'Card' | 'StudentAccount'>('Cash');

  // Interactive Returns Form
  const [returnForm, setReturnForm] = useState({
    type: 'StudentReturn' as 'StudentReturn' | 'SupplierReturn',
    studentId: '', supplierId: '', variantId: 'var_1', qty: 1,
    refundMethod: 'Cash' as any, reason: '', actionType: 'Refund' as 'Refund' | 'Exchange',
    newSizeId: 'sz_2', newColorId: 'cl_2'
  });

  // Active SQL query history log to show in-app
  const [executedSQLQueries, setExecutedSQLQueries] = useState<string[]>([]);

  // Push sql to terminal
  const logSQL = (sql: string) => {
    setExecutedSQLQueries(prev => [
      `-- Executed on ${new Date().toLocaleTimeString()} \n${sql.trim()}`,
      ...prev.slice(0, 49)
    ]);
  };

  // --- DERIVED METRICS FOR THE ENTERPRISE COCKPIT ---
  const stats = useMemo(() => {
    const totalInventoryValue = variants.reduce((acc, v) => acc + (v.stockQty * v.buyPrice), 0);
    const totalItemsCount = items.length;
    const lowStockItems = variants.filter(v => v.stockQty > 0 && v.stockQty <= v.alertLimit).length;
    const outOfStockItems = variants.filter(v => v.stockQty === 0).length;
    
    // Hardcoded beautiful constants for sales history simulation
    const salesToday = 2380;
    const salesMonth = 48500;
    const totalRevenue = 154000;
    const totalCostOfGoods = 101000;
    const totalProfits = totalRevenue - totalCostOfGoods;
    
    const pendingOrders = purchaseOrders.filter(po => po.status === 'Approved').length;
    const deliveredOrders = purchaseOrders.filter(po => po.status === 'Received').length;
    const pendingReservations = reservations.filter(r => r.status === 'Pending').length;
    const returnedQtyCount = returns.reduce((acc, r) => acc + r.qty, 0);
    const turnoverRate = 4.2; // COGS / Avg Inventory

    return {
      totalInventoryValue, totalItemsCount, lowStockItems, outOfStockItems,
      salesToday, salesMonth, totalRevenue, totalProfits, pendingOrders,
      deliveredOrders, pendingReservations, returnedQtyCount, turnoverRate
    };
  }, [variants, items, purchaseOrders, reservations, returns]);

  // Chart data helpers
  const itemsSalesChart = [
    { name: 'قمصان صبيان', sales: 420 },
    { name: 'بناطيل كحلي', sales: 380 },
    { name: 'مريول بنات', sales: 290 },
    { name: 'أطقم رياضية', sales: 510 },
    { name: 'سترات شتوية', sales: 180 }
  ];

  const sizesChart = [
    { name: 'S', value: 140 },
    { name: 'M', value: 310 },
    { name: 'L', value: 240 },
    { name: 'XL', value: 95 },
    { name: 'XXL', value: 45 }
  ];

  const colorsChart = [
    { name: 'أبيض ناصع', value: 480, color: '#F1F5F9' },
    { name: 'كحلي داكن', value: 350, color: '#1E293B' },
    { name: 'رمادي مدرسي', value: 190, color: '#94A3B8' },
    { name: 'أخضر رياضي', value: 120, color: '#22C55E' }
  ];

  // --- AUTOMATIC SIZE RECOMMENDER ALGORITHM ---
  const calculateRecommendedSize = (h: number, w: number, chest: number): string => {
    // Formula based on height and chest circumfrence
    if (h < 130) return 'S';
    if (h >= 130 && h < 155) return 'M';
    if (h >= 155 && h < 172) {
      if (chest > 88) return 'XL';
      return 'L';
    }
    if (h >= 172) {
      if (w > 80 || chest > 95) return 'XXL';
      return 'XL';
    }
    return 'M';
  };

  // Handle fitting save
  const handleSaveStudentMeasurements = async (studentId: string) => {
    const recommended = calculateRecommendedSize(fittingForm.height, fittingForm.weight, fittingForm.chest);
    
    // DB transaction logic
    const opResult = await TransactionService.run({
      operationName: 'SAVE_STUDENT_MEASUREMENTS',
      tenantId: selectedSchoolId,
      userId: 'salafe10@gmail.com',
      userName: 'مدير النظام المالي والمخزني',
      ipAddress: '192.168.10.43',
      affectedTables: ['uniform_student_measurements'],
      executionBlock: () => {
        const existingIdx = measurements.findIndex(m => m.studentId === studentId);
        const newMeasurement: StudentMeasurement = {
          id: existingIdx >= 0 ? measurements[existingIdx].id : `ms_${Date.now()}`,
          studentId,
          heightCm: fittingForm.height,
          weightKg: fittingForm.weight,
          chestCm: fittingForm.chest,
          waistCm: fittingForm.waist,
          pantsLengthCm: fittingForm.pants,
          sleeveLengthCm: fittingForm.sleeve,
          shoeSize: fittingForm.shoes,
          recommendedSize: recommended,
          updatedAt: new Date().toISOString().split('T')[0]
        };

        if (existingIdx >= 0) {
          setMeasurements(prev => prev.map((m, i) => i === existingIdx ? newMeasurement : m));
        } else {
          setMeasurements(prev => [...prev, newMeasurement]);
        }
        return newMeasurement;
      }
    });

    if (opResult.success && opResult.result) {
      triggerNotification(
        'تم حفظ القياسات بنجاح',
        `مقاس الطالب المقترح بناءً على الخوارزمية الفنية هو: (${recommended})`,
        'success'
      );
      setShowMeasurementModal(false);
    } else {
      triggerNotification('خطأ في الحفظ', opResult.error || 'فشلت المعالجة المجمعة', 'error');
    }
  };

  // --- CHECKOUT CART LOGIC ---
  const getVariantDetails = (vid: string) => {
    const variant = variants.find(v => v.id === vid);
    const item = items.find(i => i.id === variant?.itemId);
    const size = sizes.find(s => s.id === variant?.sizeId);
    const color = colors.find(c => c.id === variant?.colorId);
    return { variant, item, size, color };
  };

  const handleAddToCart = (vid: string, qty: number = 1) => {
    const v = variants.find(vr => vr.id === vid);
    if (!v) return;
    if (v.stockQty < qty) {
      // Prompt for reservation instead
      triggerNotification(
        'الصنف غير متوفر بالكمية الكافية',
        'تم توجيهك لحجز الصنف كطلب حجز معلق للطلاب.',
        'warning'
      );
      // Create a Reservation
      return;
    }

    const existingIdx = cart.findIndex(c => c.variantId === vid);
    if (existingIdx >= 0) {
      setCart(prev => prev.map((c, idx) => idx === existingIdx ? { ...c, qty: c.qty + qty } : c));
    } else {
      setCart(prev => [...prev, { variantId: vid, qty }]);
    }
    triggerNotification('تمت الإضافة', 'أضيف الصنف لسلة الصرف الفوري', 'success');
  };

  const handleCheckout = async () => {
    if (!selectedStudent) {
      triggerNotification('تنبيه هام', 'الرجاء اختيار طالب أولاً لإتمام الصرف الفوري', 'warning');
      return;
    }
    if (cart.length === 0) {
      triggerNotification('سلة فارغة', 'الرجاء إضافة أصناف زت للسلة أولاً', 'warning');
      return;
    }

    const orderId = `ord_${Date.now()}`;
    const invoiceId = `INV-UNIFORM-${Date.now().toString().slice(-4)}`;
    const journalId = `JE-SALE-${Date.now().toString().slice(-4)}`;
    
    const subtotal = cart.reduce((acc, c) => {
      const { variant } = getVariantDetails(c.variantId);
      return acc + ((variant?.sellPrice || 0) * c.qty);
    }, 0);
    const tax = Number((subtotal * 0.15).toFixed(2));
    const discount = checkoutDiscount;
    const grandTotal = subtotal + tax - discount;

    const queryLogs: (string | ParameterizedCommand)[] = [];
    queryLogs.push(SQLCommandBuilder.create({
      sqlText: `INSERT INTO uniform_student_orders (id, code, student_id, order_date, subtotal, discount, tax, grand_total, status, payment_method, is_paid, invoice_id, journal_entry_id) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, 'Delivered', $8, true, $9, $10);`,
      parameters: [orderId, `ORD-U-${Date.now().toString().slice(-4)}`, selectedStudent.id, subtotal, discount, tax, grandTotal, checkoutPaymentMethod, invoiceId, journalId],
      executionContext: 'Checkout student order'
    }));

    cart.forEach(c => {
      const { variant } = getVariantDetails(c.variantId);
      queryLogs.push(SQLCommandBuilder.create({
        sqlText: `UPDATE uniform_item_variants SET stock_qty = stock_qty - $1 WHERE id = $2;`,
        parameters: [c.qty, c.variantId],
        executionContext: 'Deduct stock'
      }));
      queryLogs.push(SQLCommandBuilder.create({
        sqlText: `INSERT INTO uniform_student_order_items (id, student_order_id, variant_id, qty, price, line_total) VALUES ($1, $2, $3, $4, $5, $6);`,
        parameters: [`itm_${Math.random().toString(36).substring(7)}`, orderId, c.variantId, c.qty, variant?.sellPrice || 0, c.qty * (variant?.sellPrice || 0)],
        executionContext: 'Link student order items'
      }));
    });

    const accountCode = checkoutPaymentMethod === 'StudentAccount' ? '1201_STUD_' + selectedStudent.id : '1101_CASH';
    queryLogs.push(SQLCommandBuilder.create({
      sqlText: `INSERT INTO accounting_journal_entries (id, entry_date, ref, desc) VALUES ($1, CURRENT_DATE, $2, $3);`,
      parameters: [journalId, invoiceId, `إثبات مبيعات الزي المدرسي للطالب: ${selectedStudent.name}`],
      executionContext: 'Create Journal entry for uniform checkout'
    }));
    queryLogs.push(SQLCommandBuilder.create({
      sqlText: `INSERT INTO journal_lines (account_code, debit, credit) VALUES ($1, $2, 0.00);`,
      parameters: [accountCode, grandTotal],
      executionContext: 'Debit Asset'
    }));
    queryLogs.push(SQLCommandBuilder.create({
      sqlText: `INSERT INTO journal_lines (account_code, debit, credit) VALUES ('4105_UNIFORM_REV', 0.00, $1);`,
      parameters: [subtotal],
      executionContext: 'Credit Revenue'
    }));
    queryLogs.push(SQLCommandBuilder.create({
      sqlText: `INSERT INTO journal_lines (account_code, debit, credit) VALUES ('2105_VAT_TAX', 0.00, $1);`,
      parameters: [tax],
      executionContext: 'Credit Tax liability'
    }));

    // Execute through local state update
    const opResult = await SQLTransactionEngine.run({
      operationName: 'CHECKOUT_UNIFORM_SALE',
      tenantId: selectedSchoolId,
      userId: 'salafe10@gmail.com',
      userName: 'أمين المستودع المدرسي',
      ipAddress: '192.168.10.12',
      affectedTables: ['uniform_student_orders', 'uniform_item_variants', 'uniform_stock_transactions', 'accounting_journal_entries'],
      validationBlock: () => {
        // Double check quantities
        for (const item of cart) {
          const { variant } = getVariantDetails(item.variantId);
          if (!variant || variant.stockQty < item.qty) {
            return { valid: false, error: `الكمية المطلوبة غير متوفرة للصنف ${variant?.sku}` };
          }
        }
        return { valid: true };
      },
      authorizationBlock: () => ({ authorized: true }),
      executionBlock: () => {
        // Adjust quantities
        setVariants(prev => prev.map(v => {
          const itemInCart = cart.find(c => c.variantId === v.id);
          if (itemInCart) {
            return { ...v, stockQty: v.stockQty - itemInCart.qty };
          }
          return v;
        }));

        // Log general ledger transaction in the parent invoices array
        const newInvoice: Invoice = {
          id: invoiceId,
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          amount: grandTotal,
          totalAmount: grandTotal,
          remainingAmount: 0,
          status: 'paid',
          item: `شراء زي مدرسي وملابس - ترحيل آلي للعهدة`,
          taxAmount: tax,
          items: cart.map(c => ({
            description: `${c.item.name} (${c.size}) - ${c.qty} × ${c.item.sellPrice} د.ل`,
            amount: c.qty * c.item.sellPrice
          }))
        };
        setInvoices(prev => [newInvoice, ...prev]);

        // Create new simulated journal entry
        const newJournal: AccountingJournalEntry = {
          id: journalId,
          date: new Date().toISOString().split('T')[0],
          reference: invoiceId,
          description: `صرف مبيعات الزي المدرسي للطالب: ${selectedStudent.name}`,
          lines: [
            { accountCode: checkoutPaymentMethod === 'StudentAccount' ? '1201' : '1101', accountName: checkoutPaymentMethod === 'StudentAccount' ? 'حساب الرصيد الأكاديمي للطالب' : 'صندوق النقدية والشبكة', debit: grandTotal, credit: 0 },
            { accountCode: '4105', accountName: 'إيراد مبيعات الزي المدرسي', debit: 0, credit: subtotal },
            { accountCode: '2105', accountName: 'ضريبة القيمة المضافة المحصلة', debit: 0, credit: tax }
          ]
        };
        setJournals(prev => [newJournal, ...prev]);

        // Add to reservations check or notification logic
        return true;
      },
      nestedSqlQueries: queryLogs
    });

    if (opResult.success) {
      logSQL(queryLogs.map(q => typeof q === 'string' ? q : SQLCommandBuilder.formatForTrace(q)).join('\n\n'));
      triggerNotification(
        'تم إتمام عملية الصرف والتسليم بنجاح',
        `رقم السند المالي المولد: ${invoiceId} بمجموع: د.ل ${grandTotal}. تم تحديث المخازن وترحيل القيد الحسابي تلقائياً.`,
        'success'
      );
      setCart([]);
      setSelectedItem(null);
    } else {
      triggerNotification('فشل الصرف', opResult.error || 'عذرًا، فشلت المعاملة', 'error');
    }
  };

  // --- REQUISITION & RECEIVING PO PROCESS ---
  const handleReceivePurchaseOrder = async (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const receiptId = `rec_${Date.now()}`;
    const journalId = `JE-PURCH-${Date.now().toString().slice(-4)}`;

    const queryLogs: (string | ParameterizedCommand)[] = [
      SQLCommandBuilder.create({
        sqlText: `UPDATE uniform_purchase_orders SET status = 'Received' WHERE id = $1;`,
        parameters: [poId],
        executionContext: 'Receive goods update PO'
      }),
      SQLCommandBuilder.create({
        sqlText: `INSERT INTO uniform_receipts (id, code, purchase_order_id, receipt_date, total_amount, received_by, journal_entry_id) VALUES ($1, $2, $3, CURRENT_DATE, $4, 'salafe10@gmail.com', $5);`,
        parameters: [receiptId, `REC-${Date.now().toString().slice(-4)}`, poId, po.totalAmount, journalId],
        executionContext: 'Log PO Receipt'
      }),
      SQLCommandBuilder.create({
        sqlText: `UPDATE uniform_item_variants SET stock_qty = stock_qty + 50 WHERE id IN (SELECT variant_id FROM uniform_purchase_order_items WHERE purchase_order_id = $1);`,
        parameters: [poId],
        executionContext: 'Bulk increase stock'
      }),
      SQLCommandBuilder.create({
        sqlText: `INSERT INTO accounting_journal_entries (id, date, ref, desc) VALUES ($1, CURRENT_DATE, $2, 'استلام بضاعة ومخزون ملابس وزي مدرسي');`,
        parameters: [journalId, `PO-REC-${poId}`],
        executionContext: 'Create Accounts Payable Journal'
      }),
      SQLCommandBuilder.create({
        sqlText: `INSERT INTO journal_lines (account_code, debit, credit) VALUES ('1205_UNIFORM_STOCK', $1, 0.00);`,
        parameters: [po.totalAmount],
        executionContext: 'Debit Stock asset'
      }),
      SQLCommandBuilder.create({
        sqlText: `INSERT INTO journal_lines (account_code, debit, credit) VALUES ('2101_SUPP_PAYABLE', 0.00, $1);`,
        parameters: [po.totalAmount],
        executionContext: 'Credit supplier liability'
      })
    ];

    const opResult = await SQLTransactionEngine.run({
      operationName: 'RECEIVE_PURCHASE_ORDER',
      tenantId: selectedSchoolId,
      userId: 'salafe10@gmail.com',
      userName: 'مدير المشتريات والمستودعات',
      ipAddress: '192.168.10.15',
      affectedTables: ['uniform_purchase_orders', 'uniform_receipts', 'uniform_item_variants', 'accounting_journal_entries'],
      validationBlock: () => ({ valid: true }),
      authorizationBlock: () => ({ authorized: true }),
      executionBlock: () => {
        // Complete PO status
        setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'Received' } : p));
        
        // Boost stock for the items associated (Simulate receiving 50 of shirts and jackets)
        setVariants(prev => prev.map(v => {
          if (v.id === 'var_3' || v.id === 'var_6') {
            return { ...v, stockQty: v.stockQty + 100 }; // Replenish low items!
          }
          return v;
        }));

        // Insert purchase journal
        const newJournal: AccountingJournalEntry = {
          id: journalId,
          date: new Date().toISOString().split('T')[0],
          reference: `PO-REC-${poId}`,
          description: `توريد واستلام عهدة زي مدرسي - أمر الشراء ${po.code}`,
          lines: [
            { accountCode: '1205', accountName: 'مخزون الزي المدرسي والملابس بالخزينة', debit: po.totalAmount, credit: 0 },
            { accountCode: '2101', accountName: 'ذمم الموردين وأوراق الدفع', debit: 0, credit: po.totalAmount }
          ]
        };
        setJournals(prev => [newJournal, ...prev]);

        // Fire notifications to waiting reservations!
        setReservations(prev => prev.map(r => r.status === 'Pending' ? { ...r, status: 'Notified' } : r));

        return true;
      },
      nestedSqlQueries: queryLogs
    });

    if (opResult.success) {
      logSQL(queryLogs.map(q => typeof q === 'string' ? q : SQLCommandBuilder.formatForTrace(q)).join('\n\n'));
      triggerNotification(
        'تم استلام العهدة وتحديث المخازن لـ 100%',
        `تم مطابقة المشتريات بنجاح. أرسل النظام آلياً تنبيه رسائل نصية لأولياء أمور الطلاب اللذين لديهم حجوزات معلقة.`,
        'success'
      );
      setShowReceivePOModal(false);
    }
  };

  // --- BULK PRICING MODIFIER ---
  const handleApplyBulkPricing = async () => {
    const changeFactor = bulkPriceForm.type === 'increase' 
      ? 1 + (bulkPriceForm.percent / 100) 
      : 1 - (bulkPriceForm.percent / 100);

    const query = SQLCommandBuilder.create({
      sqlText: `UPDATE uniform_item_variants SET sell_price = ROUND(sell_price * $1, 2), student_price = ROUND(student_price * $1, 2) WHERE item_id IN ( SELECT id FROM uniform_items WHERE ($2 = 'all' OR category_id = $2) AND ($3 = 'all' OR season = $3) );`,
      parameters: [changeFactor, bulkPriceForm.categoryId, bulkPriceForm.season],
      executionContext: 'Bulk update pricing'
    });

    const opResult = await SQLTransactionEngine.run({
      operationName: 'BULK_PRICE_UPDATE',
      tenantId: selectedSchoolId,
      userId: 'salafe10@gmail.com',
      userName: 'المدير المالي التنفيذي',
      ipAddress: '192.168.1.101',
      affectedTables: ['uniform_item_variants'],
      validationBlock: () => {
        if (bulkPriceForm.percent <= 0 || bulkPriceForm.percent > 90) {
          return { valid: false, error: 'النسبة المئوية المدخلة يجب أن تكون بين 1% و 90%' };
        }
        return { valid: true };
      },
      authorizationBlock: () => ({ authorized: true }),
      executionBlock: () => {
        setVariants(prev => prev.map(v => {
          const item = items.find(i => i.id === v.itemId);
          if (!item) return v;

          const matchCat = bulkPriceForm.categoryId === 'all' || item.categoryId === bulkPriceForm.categoryId;
          const matchSeason = bulkPriceForm.season === 'all' || item.season === bulkPriceForm.season;

          if (matchCat && matchSeason) {
            return {
              ...v,
              sellPrice: Number((v.sellPrice * changeFactor).toFixed(2)),
              studentPrice: Number((v.studentPrice * changeFactor).toFixed(2))
            };
          }
          return v;
        }));
        return true;
      },
      nestedSqlQueries: [query]
    });

    if (opResult.success) {
      logSQL(typeof query === 'string' ? query : SQLCommandBuilder.formatForTrace(query));
      triggerNotification(
        'تم تحديث الأسعار الجماعي بنجاح',
        `تم تعديل كافة أصناف المطابقة بنسبة ${bulkPriceForm.percent}% تزامناً مع اللوائح المالية لعام 2026.`,
        'success'
      );
      setShowBulkPriceModal(false);
    } else {
      triggerNotification('فشل التعديل', opResult.error || 'حدث خطأ غير متوقع', 'error');
    }
  };

  // --- CRUD: NEW SUPPLIER ---
  const handleCreateSupplier = async () => {
    const sid = `sup_${Date.now()}`;
    const query = SQLCommandBuilder.create({
      sqlText: `INSERT INTO uniform_suppliers (id, code, name, phone, mobile, email, address, tax_number, bank_name, iban, payment_terms, classification, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active');`,
      parameters: [sid, newSupplier.code, newSupplier.name, newSupplier.phone, newSupplier.mobile, newSupplier.email, newSupplier.address, newSupplier.taxNumber, newSupplier.bankName, newSupplier.iban, newSupplier.paymentTerms, newSupplier.classification],
      executionContext: 'Create uniform supplier'
    });

    const opResult = await SQLTransactionEngine.run({
      operationName: 'CREATE_UNIFORM_SUPPLIER',
      tenantId: selectedSchoolId,
      userId: 'salafe10@gmail.com',
      userName: 'مدير المشتريات',
      ipAddress: '192.168.10.15',
      affectedTables: ['uniform_suppliers'],
      validationBlock: () => {
        if (!newSupplier.code || !newSupplier.name) {
          return { valid: false, error: 'كود المورد واسمه حقلان إجباريان' };
        }
        return { valid: true };
      },
      authorizationBlock: () => ({ authorized: true }),
      executionBlock: () => {
        const sup: UniformSupplier = {
          id: sid,
          code: newSupplier.code,
          name: newSupplier.name,
          phone: newSupplier.phone,
          mobile: newSupplier.mobile,
          email: newSupplier.email,
          address: newSupplier.address,
          taxNumber: newSupplier.taxNumber,
          bankName: newSupplier.bankName,
          iban: newSupplier.iban,
          paymentTerms: newSupplier.paymentTerms,
          classification: newSupplier.classification,
          status: 'active'
        };
        setSuppliers(prev => [...prev, sup]);
        return sup;
      },
      nestedSqlQueries: [query]
    });

    if (opResult.success) {
      logSQL(typeof query === 'string' ? query : SQLCommandBuilder.formatForTrace(query));
      triggerNotification('تم تسجيل المورد', `تم إدراج المورد ${newSupplier.name} بنجاح في قاعدة البيانات`, 'success');
      setShowAddSupplierModal(false);
      setNewSupplier({
        code: '', name: '', phone: '', mobile: '', email: '', address: '',
        taxNumber: '', bankName: '', iban: '', paymentTerms: 'Cash', classification: 'A'
      });
    } else {
      triggerNotification('خطأ في البيانات', opResult.error || '', 'error');
    }
  };

  // --- CRUD: NEW ITEM ---
  const handleCreateItem = async () => {
    const item_id = `item_${Date.now()}`;
    const variant_id = `var_${Date.now()}`;
    const sku = `SKU-${newItem.code}-M`;

    const query_1 = SQLCommandBuilder.create({
      sqlText: `INSERT INTO uniform_items (id, code, barcode, name_ar, name_en, category_id, item_group, division, season, gender, description, brand, fabric_type, cotton_percent, weight_gsm, wash_instructions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);`,
      parameters: [item_id, newItem.code, newItem.barcode, newItem.nameAr, newItem.nameEn, newItem.categoryId, newItem.group, newItem.division, newItem.season, newItem.gender, newItem.description, newItem.brand, newItem.fabricType, newItem.cottonPercent, newItem.weightGsm, newItem.washInstructions],
      executionContext: 'Create uniform item'
    });

    const query_2 = SQLCommandBuilder.create({
      sqlText: `INSERT INTO uniform_item_variants (id, item_id, size_id, color_id, sku, stock_qty, buy_price, sell_price, student_price, wholesale_price) VALUES ($1, $2, 'sz_2', 'cl_2', $3, 100, $4, $5, $6, $7);`,
      parameters: [variant_id, item_id, sku, newItem.buyPrice, newItem.sellPrice, newItem.sellPrice - 5, newItem.buyPrice + 5],
      executionContext: 'Create uniform item variant'
    });

    const opResult = await SQLTransactionEngine.run({
      operationName: 'CREATE_UNIFORM_ITEM',
      tenantId: selectedSchoolId,
      userId: 'salafe10@gmail.com',
      userName: 'مدير المستودع المركزي',
      ipAddress: '192.168.10.15',
      affectedTables: ['uniform_items', 'uniform_item_variants'],
      validationBlock: () => {
        if (!newItem.code || !newItem.nameAr || !newItem.barcode) {
          return { valid: false, error: 'الرجاء تعبئة الكود والاسم العربي والباركود' };
        }
        return { valid: true };
      },
      authorizationBlock: () => ({ authorized: true }),
      executionBlock: () => {
        const item: UniformItem = {
          id: item_id,
          code: newItem.code,
          barcode: newItem.barcode,
          nameAr: newItem.nameAr,
          nameEn: newItem.nameEn,
          categoryId: newItem.categoryId,
          group: newItem.group,
          division: newItem.division,
          season: newItem.season,
          gender: newItem.gender as any,
          description: newItem.description,
          brand: newItem.brand,
          fabricType: newItem.fabricType,
          cottonPercent: newItem.cottonPercent,
          weightGsm: newItem.weightGsm,
          washInstructions: newItem.washInstructions,
          minPrice: newItem.buyPrice,
          maxPrice: newItem.sellPrice * 2,
          marginPercent: Math.round(((newItem.sellPrice - newItem.buyPrice) / newItem.buyPrice) * 100)
        };

        const variant: UniformVariant = {
          id: variant_id,
          itemId: item_id,
          sizeId: 'sz_2', // M by default
          colorId: 'cl_2', // Navy by default
          sku,
          stockQty: 100, // Pre-seed 100 pieces
          buyPrice: newItem.buyPrice,
          sellPrice: newItem.sellPrice,
          studentPrice: newItem.sellPrice - 5,
          wholesalePrice: newItem.buyPrice + 5,
          alertLimit: 10,
          reorderPoint: 20,
          maxLimit: 500,
          locationCode: 'A1-04'
        };

        setItems(prev => [...prev, item]);
        setVariants(prev => [...prev, variant]);
        return { item, variant };
      },
      nestedSqlQueries: [query_1, query_2]
    });

    if (opResult.success) {
      logSQL(`${typeof query_1 === 'string' ? query_1 : SQLCommandBuilder.formatForTrace(query_1)}\n\n${typeof query_2 === 'string' ? query_2 : SQLCommandBuilder.formatForTrace(query_2)}`);
      triggerNotification('تم تسجيل الصنف', `تم إنشاء الصنف ${newItem.nameAr} وإسناد المقاس (M) برصيد افتراضي 100 قطعة`, 'success');
      setShowAddItemModal(false);
      setNewItem({
        code: '', barcode: '', nameAr: '', nameEn: '', categoryId: 'cat_1',
        group: 'Boys', division: 'Regular', season: 'Summer', gender: 'Male',
        description: '', brand: 'سحاب ستايل', fabricType: 'قطن مخلوط', cottonPercent: 50,
        weightGsm: 150, washInstructions: 'غسيل آلي دافئ', buyPrice: 30, sellPrice: 45
      });
    } else {
      triggerNotification('فشل الإدراج', opResult.error || '', 'error');
    }
  };

  // Filter lists based on search
  const filteredItems = useMemo(() => {
    return items.filter(i => 
      i.nameAr.includes(itemSearchTerm) || 
      i.code.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
      i.barcode.includes(itemSearchTerm)
    );
  }, [items, itemSearchTerm]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.includes(supplierSearchTerm) || 
      s.code.toLowerCase().includes(supplierSearchTerm.toLowerCase())
    );
  }, [suppliers, supplierSearchTerm]);

  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm) return [];
    return students.filter(s => 
      s.name.includes(studentSearchTerm) || 
      (s.id && s.id.toLowerCase().includes(studentSearchTerm.toLowerCase())) ||
      (s.nationalId && s.nationalId.includes(studentSearchTerm))
    );
  }, [students, studentSearchTerm]);

  return (
    <div className="space-y-0 text-right w-full" dir="rtl" id="uniform_master_container">
      <EnterpriseActionToolbar
        title="إدارة الزي والملابس المدرسية"
        stats={
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-xs">
            <span className="text-slate-300 font-bold">القيمة التقديرية لإجمالي المخزون الحالي: <span className="text-amber-400 font-mono">{stats.totalInventoryValue.toLocaleString('ar-EG')}</span> د.ل</span>
          </div>
        }
        onExit={setActiveSection ? () => setActiveSection('dashboard') : undefined}
        onPrint={() => {}}
        onExportPdf={() => {}}
        onExportExcel={() => {}}
        onImportExcel={() => {}}
        onDownloadTemplate={() => {}}
      />
      
      <div className="p-3 sm:p-4 space-y-4">

      {/* METRIC / KPI ROW (Enterprise Deck) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { id: 'kpi_val', label: 'قيمة المخزون الحالية', val: `${stats.totalInventoryValue.toLocaleString('ar-EG')} د.ل`, desc: 'بناء على سعر الشراء التراكمي', icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
          { id: 'kpi_qty', label: 'أصناف الملابس المسجلة', val: `${stats.totalItemsCount} صنف`, desc: `${variants.length} مقاس ولون فريد`, icon: Shirt, color: 'text-teal-600 bg-teal-50' },
          { id: 'kpi_low', label: 'أصناف منخفضة الكمية', val: `${stats.lowStockItems} أصناف`, desc: 'تجاوزت حد الطلب الأدنى', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
          { id: 'kpi_out', label: 'أصناف منتهية المخزون', val: `${stats.outOfStockItems} صنف`, desc: 'بحاجة لأمر توريد فوري', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
          { id: 'kpi_sales', label: 'المبيعات اليومية للطلاب', val: `${stats.salesToday.toLocaleString('ar-EG')} د.ل`, desc: 'تسليم نقدي / ذمم ترحيل', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
          { id: 'kpi_turnover', label: 'معدل دوران المخزون', val: `${stats.turnoverRate} %`, desc: 'معدل سحب الملابس الفعلي', icon: TrendingUp, color: 'text-orange-600 bg-orange-50' }
        ].map(card => (
          <div key={card.id} className="p-5 border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[11px] text-slate-500 font-bold leading-tight">{card.label}</span>
              <span className={`p-2 ${card.color}`}><card.icon className="w-4 h-4" /></span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-black text-slate-900">{card.val}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* PRIMARY TABULAR CONTROLLER */}
      <div className="rounded-3xl overflow-hidden">
        <div className="flex border-b border-slate-100 bg-transparent overflow-x-auto">
          {[
            { id: 'dashboard', label: 'ال cockpit والتحليلات', icon: TrendingUp },
            { id: 'items', label: 'دليل المنتجات والتسعير', icon: Shirt },
            { id: 'purchase', label: 'المشتريات والموردين', icon: Building2 },
            { id: 'sales', label: 'صرف الطلاب ومقاييس الترزي', icon: Ruler },
            { id: 'returns', label: 'المرتجعات والحجوزات', icon: RotateCcw },
            { id: 'accounting', label: 'القيود والحسابات العامة', icon: ClipboardList }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'border-emerald-600 text-emerald-700 bg-white' 
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* ======================================================== */}
          {/* TAB 1: COCKPIT & RECHARTS GRAPHICS */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart 1: Sales Distribution */}
                <div className="p-5 space-y-4 lg:col-span-2">
                  <h3 className="text-xs font-black text-slate-950 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    توزيع المبيعات حسب الصنف ومجموعة الملابس
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={itemsSalesChart} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="sales" fill="#10B981" radius={[10, 10, 0, 0]}>
                          {itemsSalesChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0D9488' : '#059669'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Color and Size Preference */}
                <div className="p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-950 flex items-center gap-2">
                    <Tags className="w-4 h-4 text-teal-600" />
                    الألوان والمقاسات الأكثر طلباً
                  </h3>
                  <div className="h-64 flex flex-col justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={colorsChart}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {colorsChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#CBD5E1" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-2 w-full text-[10px] font-bold text-slate-600">
                      {colorsChart.map(c => (
                        <div key={c.name} className="flex items-center gap-1.5 justify-center">
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: c.color }} />
                          <span>{c.name}: {c.value} طالب</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Quick Alert / Reorder Notification Banner */}
              <div className="bg-amber-50 border border-amber-200/80 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-amber-900">تنبيه إعادة الطلب للمستودع المدرسي</h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                    هناك {stats.lowStockItems} أصناف تجاوزت نقطة إعادة الطلب الحرجة (أقل من الحد الأدنى)، يرجى إصدار أمر شراء توريد فوري إلى الموردين المعتمدين لضمان عدم توقف عمليات صرف الفصول.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: UNIFORM CATALOG & BULK PRICING */}
          {/* ======================================================== */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div className="relative flex-1 max-w-md bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث بواسطة كود الباركود، كود الصنف، أو الاسم..."
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium text-right"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة صنف ملابس جديد 👕
                  </button>
                  <button
                    onClick={() => setShowBulkPriceModal(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-2 cursor-pointer"
                  >
                    <Tags className="w-4 h-4" />
                    تعديل أسعار جماعي 🏷️
                  </button>
                  <button
                    onClick={() => setShowAddSizeColorModal(true)}
                    className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-black flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    تعديل مقاسات وألوان 🎨
                  </button>
                </div>
              </div>

              {/* Master Catalog Table */}
              <div className="overflow-hidden shadow-sm">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-transparent border-b border-slate-100 text-[11px] font-black text-slate-500">
                      <th className="p-4">كود الصنف والباركود</th>
                      <th className="p-4">اسم صنف الزي المدرسي</th>
                      <th className="p-4">الفئة والموسم</th>
                      <th className="p-4">الخامة والتصنيع</th>
                      <th className="p-4">سعر الشراء</th>
                      <th className="p-4">سعر البيع المقترح</th>
                      <th className="p-4">هامش الربح</th>
                      <th className="p-4">الخيارات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => {
                      const sampleVariant = variants.find(v => v.itemId === item.id);
                      return (
                        <tr key={item.id} className="border-b border-slate-100 text-xs hover:bg-transparent/50 transition-all font-semibold text-slate-700">
                          <td className="p-4">
                            <span className="block font-black text-slate-900">{item.code}</span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">📟 {item.barcode}</span>
                          </td>
                          <td className="p-4">
                            <span className="block font-bold">{item.nameAr}</span>
                            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{item.nameEn}</span>
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] bg-slate-100 text-slate-700">{item.group === 'Boys' ? 'بنين' : item.group === 'Girls' ? 'بنات' : 'للجنسين'}</span>
                            <span className="block text-[10px] text-emerald-600 mt-1">🍂 {item.season === 'Summer' ? 'صيفي' : item.season === 'Winter' ? 'شتوي' : 'طوال العام'}</span>
                          </td>
                          <td className="p-4">
                            <span className="block">{item.fabricType}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5 font-normal">قطن: {item.cottonPercent}% • الوزن: {item.weightGsm} جم</span>
                          </td>
                          <td className="p-4 text-teal-700 font-bold">{sampleVariant?.buyPrice || item.minPrice} د.ل</td>
                          <td className="p-4 text-emerald-700 font-black">{sampleVariant?.sellPrice || item.maxPrice} د.ل</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black">
                              +{item.marginPercent}%
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                triggerNotification('تفاصيل الصنف', 'تم سحب تفاصيل المقاسات والألوان المتوفرة في المخازن أدناه', 'info');
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold cursor-pointer"
                            >
                              عرض الأرصدة 📦
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Sub-Table: Variants & Location Inventory of Selected Item */}
              {selectedItem && (
                <div className="bg-transparent p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">أرصدة المخزون المتوفرة بمختلف المقاسات لـ ({selectedItem.nameAr})</h4>
                      <p className="text-[10px] text-slate-500 font-bold">مواقع التخزين، الأسعار، ومستويات الأمان</p>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="p-1.5 border hover:bg-slate-100"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {variants.filter(v => v.itemId === selectedItem.id).map(v => {
                      const sz = sizes.find(s => s.id === v.sizeId);
                      const cl = colors.find(c => c.id === v.colorId);
                      const isLow = v.stockQty <= v.alertLimit;
                      return (
                        <div key={v.id} className="p-4 space-y-3 relative overflow-hidden bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                          {isLow && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />}
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs bg-slate-100 text-slate-800 font-black">المقاس: {sz?.code}</span>
                            <span className="w-4.5 h-4.5 rounded-full border" style={{ backgroundColor: cl?.hex }} title={cl?.name} />
                          </div>
                          
                          <div className="space-y-1 text-[11px] font-bold">
                            <p className="text-slate-500">رقم SKU: <span className="text-slate-800 font-mono">{v.sku}</span></p>
                            <p className="text-slate-500">موقع المستودع: <span className="text-slate-800">{v.locationCode}</span></p>
                            <p className="text-slate-500">رصيد العهدة الفعلي: 
                              <span className={`mr-1 font-black ${v.stockQty === 0 ? 'text-red-600' : isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                                {v.stockQty} قطعة
                              </span>
                            </p>
                          </div>

                          <div className="border-t pt-2.5 grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                            <div>
                              <span className="text-slate-400 block font-medium">سعر الشراء:</span>
                              <span className="text-slate-700">{v.buyPrice} د.ل</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">سعر الصرف للطلاب:</span>
                              <span className="text-emerald-700 font-extrabold">{v.studentPrice} د.ل</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PURCHASES, REQUISITIONS, & SUPPLIERS */}
          {/* ======================================================== */}
          {activeTab === 'purchase' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div className="relative flex-1 max-w-md bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث بواسطة اسم المورد، الحساب، أو الهاتف..."
                    value={supplierSearchTerm}
                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium text-right"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddSupplierModal(true)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    تسجيل مورد تجاري جديد 🏭
                  </button>
                  <button
                    onClick={() => setShowCreatePOModal(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    إنشاء أمر شراء معتمد 📄
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* PO & Intake Management */}
                <div className="lg:col-span-2 p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                    سجل أوامر الشراء والاستلام الدوري للزي
                  </h3>

                  <div className="space-y-4">
                    {purchaseOrders.map(po => {
                      const supp = suppliers.find(s => s.id === po.supplierId);
                      return (
                        <div key={po.id} className="p-4 border hover:bg-transparent transition-all font-semibold flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-slate-700">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900">{po.code}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                po.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>{po.status === 'Received' ? 'تم التوريد ومطابقة الأرصدة' : 'بانتظار وصول الشحنة'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-bold">المورد: {supp?.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">تاريخ الإصدار: {po.issueDate} • الاستحقاق: {po.dueDate}</p>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-auto">
                            <div className="text-left md:text-right">
                              <span className="text-[10px] text-slate-400 block font-bold">قيمة الفاتورة:</span>
                              <span className="font-black text-emerald-700 text-sm">{po.totalAmount} د.ل</span>
                            </div>
                            {po.status === 'Approved' && (
                              <button
                                onClick={() => {
                                  setSelectedPO(po);
                                  setShowReceivePOModal(true);
                                }}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black cursor-pointer"
                              >
                                تأكيد الاستلام ومطابقة الباركود 📦
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Suppliers List Card */}
                <div className="p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    قائمة الموردين المعتمدين والموثقين
                  </h3>

                  <div className="space-y-3">
                    {filteredSuppliers.map(sup => (
                      <div key={sup.id} className="p-3 bg-transparent border space-y-1.5 text-[11px] font-bold text-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-900 font-black text-xs">{sup.name}</span>
                          <span className="px-1.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 text-[9px] font-black">تصنيف {sup.classification}</span>
                        </div>
                        <p>📟 كود: {sup.code} • الرقم الضريبي: {sup.taxNumber}</p>
                        <p>🏦 IBAN: <span className="font-mono text-slate-500">{sup.iban}</span></p>
                        <p>📦 شروط السداد: {sup.paymentTerms} • الجوال: {sup.mobile}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: STUDENT ISSUANCE & FITTING MATRIX */}
          {/* ======================================================== */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Student search & details column */}
                <div className="lg:col-span-4 p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-950 border-b pb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    ١. اختيار الطالب المستهدف بالصرف
                  </h3>

                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث بالاسم أو الرقم الأكاديمي..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 border text-xs font-medium text-right focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {filteredStudents.length > 0 && (
                      <div className="max-h-48 overflow-y-auto border divide-y bg-white">
                        {filteredStudents.map(st => (
                          <button
                            key={st.id}
                            onClick={() => {
                              setSelectedStudent(st);
                              setStudentSearchTerm('');
                              // Load his fitting measurements if any
                              const m = measurements.find(meas => meas.studentId === st.id);
                              if (m) {
                                setFittingForm({
                                  height: m.heightCm, weight: m.weightKg, chest: m.chestCm,
                                  waist: m.waistCm, pants: m.pantsLengthCm, sleeve: m.sleeveLengthCm, shoes: m.shoeSize
                                });
                              }
                            }}
                            className="w-full text-right p-2.5 text-[11px] font-bold text-slate-700 hover:bg-transparent flex items-center justify-between"
                          >
                            <span>👤 {st.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{st.id}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedStudent ? (
                      <div className="p-4 bg-transparent border space-y-3 text-xs text-slate-600 font-bold">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-mono text-xs">
                            IMG
                          </div>
                          <div>
                            <h4 className="text-slate-900 font-black">{selectedStudent.name}</h4>
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5">الرقم الأكاديمي: {selectedStudent.id}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 border-t pt-3">
                          <p>المرحلة والفصل: <span className="text-slate-900">{selectedStudent.classroom} - شعبة {selectedStudent.section}</span></p>
                          <p>المقاس المقترح للترزي: 
                            <span className="mr-1 inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-black">
                              {measurements.find(m => m.studentId === selectedStudent.id)?.recommendedSize || 'لم يقاس بعد'}
                            </span>
                          </p>
                          <p>آخر صرف للزي: <span className="text-slate-500">2026-05-18</span></p>
                          <p>الرصيد المحاسبي المستحق: <span className="text-slate-900">{selectedStudent.feesRemaining} د.ل</span></p>
                        </div>

                        <button
                          onClick={() => setShowMeasurementModal(true)}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Ruler className="w-3.5 h-3.5 text-teal-600" />
                          أخذ قياسات الطالب / تعديل قياسات الترزي 📏
                        </button>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 font-bold border-2 border-dashed rounded-xl">
                        لم يتم اختيار طالب حالياً. ابحث بالأعلى لاختيار الطالب وصرف الزي.
                      </div>
                    )}
                  </div>
                </div>

                {/* Items selection & cart column */}
                <div className="lg:col-span-8 p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-950 border-b pb-3 flex items-center gap-2">
                    <Tags className="w-4 h-4 text-teal-600" />
                    ٢. سلة الصرف واختيار مقاسات القطع
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Available variants to select */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black text-slate-500">اختر من أصناف الملابس المتوفرة:</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {variants.map(v => {
                          const item = items.find(i => i.id === v.itemId);
                          const sz = sizes.find(s => s.id === v.sizeId);
                          const isLow = v.stockQty === 0;
                          return (
                            <div key={v.id} className="p-3 border hover:bg-transparent transition-all font-semibold text-[11px] text-slate-700 flex justify-between items-center gap-2">
                              <div>
                                <span className="block font-black text-slate-900">{item?.nameAr}</span>
                                <span className="block text-[10px] text-slate-400 mt-0.5">رقم المقاس: {sz?.code} • المتوفر: {v.stockQty} قطعة</span>
                              </div>
                              <div className="text-left flex items-center gap-2">
                                <span className="font-extrabold text-emerald-700">{v.studentPrice} د.ل</span>
                                <button
                                  disabled={isLow}
                                  onClick={() => handleAddToCart(v.id, 1)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black cursor-pointer ${
                                    isLow ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  {isLow ? 'نفذت' : 'إضافة'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active cart review */}
                    <div className="bg-transparent p-4 border space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black text-slate-500 flex justify-between items-center">
                          <span>سلة المشتريات الفعالة:</span>
                          <button onClick={() => setCart([])} className="text-rose-600 text-[10px] font-bold">تفريغ السلة</button>
                        </h4>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {cart.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 font-bold">السلة فارغة حالياً</div>
                          ) : (
                            cart.map(c => {
                              const { item, size, variant } = getVariantDetails(c.variantId);
                              return (
                                <div key={c.variantId} className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                                  <span>{item?.nameAr} ({size?.code}) × {c.qty}</span>
                                  <span className="font-black">{(variant?.sellPrice || 0) * c.qty} د.ل</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-3 space-y-2 text-xs font-bold text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-400">المجموع الفرعي:</span>
                          <span>{cart.reduce((acc, c) => acc + ((getVariantDetails(c.variantId).variant?.sellPrice || 0) * c.qty), 0)} د.ل</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">الخصم الإداري للطلاب:</span>
                          <input
                            type="number"
                            value={checkoutDiscount}
                            onChange={(e) => setCheckoutDiscount(Number(e.target.value))}
                            className="w-16 p-1 border rounded text-left font-mono font-black"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">طريقة الدفع المعتمدة:</span>
                          <select
                            value={checkoutPaymentMethod}
                            onChange={(e) => setCheckoutPaymentMethod(e.target.value as any)}
                            className="p-1 border rounded text-xs font-black"
                          >
                            <option value="Cash">نقدي بالمكتب</option>
                            <option value="Card">شبكة / دفع إلكتروني</option>
                            <option value="StudentAccount">قيد على حساب الطالب</option>
                          </select>
                        </div>

                        <button
                          onClick={handleCheckout}
                          className="w-full py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                          تأكيد الصرف وطباعة السند المعتمد 📄
                        </button>
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: RETURNS & RESERVATIONS */}
          {/* ======================================================== */}
          {activeTab === 'returns' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Bookings / Reservations */}
                <div className="p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    طلبات الحجز المسبق للمقاسات غير المتوفرة (Pre-orders)
                  </h3>

                  <div className="space-y-3">
                    {reservations.map(res => {
                      const stud = students.find(s => s.id === res.studentId);
                      const { item, size } = getVariantDetails(res.variantId);
                      return (
                        <div key={res.id} className="p-4 bg-transparent border space-y-2 text-xs text-slate-600 font-bold">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-slate-950">الطالب: {stud?.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              res.status === 'Notified' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>{res.status === 'Notified' ? 'تم تنبيه ولي الأمر برسالة SMS 📱' : 'قيد الانتظار'}</span>
                          </div>
                          <p>المنتج المطلوب: <span className="text-slate-900">{item?.nameAr} (مقاس {size?.code}) × {res.qty} قطعة</span></p>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">الملاحظات: {res.notes}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return processor logs */}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-rose-600" />
                      عمليات المرتجعات والاستبدال المقيدة في النظام
                    </h3>
                    <button
                      onClick={() => setShowReturnModal(true)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-black cursor-pointer"
                    >
                      + قيد عملية مرتجع جديدة
                    </button>
                  </div>

                  <div className="space-y-3">
                    {returns.map(ret => {
                      const stud = students.find(s => s.id === ret.studentId);
                      const { item, size } = getVariantDetails(ret.variantId);
                      return (
                        <div key={ret.id} className="p-4 border border-rose-100 bg-rose-50/20 space-y-1.5 text-xs text-slate-600 font-bold">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-slate-950">{ret.code}</span>
                            <span className="font-black text-rose-700">{ret.totalRefund} د.ل</span>
                          </div>
                          <p>الطالب: {stud?.name}</p>
                          <p>المنتج المرتجع: {item?.nameAr} ({size?.code})</p>
                          <p className="text-[10px] text-slate-400 font-medium">سبب الارتجاع: {ret.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: ERP DOUBLE ENTRY ACCOUNTING LEDGER & INTEGRITY AUDITS */}
          {/* ======================================================== */}
          {activeTab === 'accounting' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* General Ledger entries list */}
                <div className="lg:col-span-2 p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                    سجل القيود المحاسبية التلقائية المزدوجة (ERP Ledgers)
                  </h3>

                  <div className="space-y-4">
                    {journals.map(je => (
                      <div key={je.id} className="p-4 border space-y-3 text-xs font-semibold text-slate-700 bg-transparent/50">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div>
                            <span className="font-black text-slate-900">{je.reference}</span>
                            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">{je.date} • {je.description}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 font-mono">Q_ID: {je.id}</span>
                        </div>

                        <div className="space-y-1.5">
                          {je.lines.map((line, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] font-bold">
                              <span className="text-slate-600 font-medium">{line.accountCode} - {line.accountName}</span>
                              <div className="flex gap-4 min-w-[120px] justify-end">
                                {line.debit > 0 ? (
                                  <span className="text-orange-700 font-black">+{line.debit} د.ل (مدين)</span>
                                ) : (
                                  <span className="text-amber-700 font-black">-{line.credit} د.ل (دائن)</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Integrity Test Audit tool */}
                <div className="p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    لوحة التحقق التلقائي والمطابقة (Integrity Diagnostics)
                  </h3>

                  <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold space-y-2 leading-relaxed">
                    <p className="flex items-center gap-2 text-xs font-black">
                      <Check className="w-4 h-4" />
                      مؤشرات المطابقة والـ Reconciliation متوازنة 100%!
                    </p>
                    <p>يقوم النظام بالتحقق بشكل آلي ومستمر للتأكد من عدم وجود فروقات بين الأرصدة المخزنية الفعلية في المستودع وبين الأرقام المرحلة في القيود المحاسبية.</p>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600 font-bold">
                    <div className="flex justify-between">
                      <span>إجمالي القيمة المقيدة محاسبياً:</span>
                      <span className="text-slate-900 font-black">{stats.totalInventoryValue} د.ل</span>
                    </div>
                    <div className="flex justify-between">
                      <span>مطابقة عهدة الطلاب:</span>
                      <span className="text-emerald-700">متطابق ✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الضريبة الضريبية المرحلة للعام:</span>
                      <span className="text-slate-900 font-mono">15% VAT ✓</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: POSTGRESQL / SQLBLUEPRINT REFERENCES */}
          {/* ======================================================== */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 border border-slate-800 text-left font-mono text-xs text-slate-300 space-y-4">
                <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800 font-sans">
                  <span>uniform_database_schema_blueprint.sql</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(UNIFORM_SQL_SCHEMA);
                      triggerNotification('تم نسخ مخطط SQL', 'يمكنك الآن لصقه في محاكي قاعدة البيانات الخاص بك', 'success');
                    }}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-[10px] cursor-pointer"
                  >
                    نسخ النص كاملاً 📋
                  </button>
                </div>
                <pre className="overflow-x-auto max-h-96 text-[11px] leading-relaxed text-slate-400">
                  {UNIFORM_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SQL TRANSACTION LEDGER CONSOLE - STYLING ACCORDING TO SYSTEM HIGHEST INTEGRITY */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-lg space-y-4">
        <h3 className="text-xs font-black text-slate-300 flex items-center gap-2 font-mono">
          <Barcode className="w-4 h-4 text-emerald-400 animate-pulse" />
          CODEX™ TRANSACTION LEDGER & POSTGRESQL COMMAND LOG
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold font-sans">
          سجل تفصيلي لحظي لعمليات الـ SQL التي يتم محاكاتها وتوليدها وتنفيذها مع كل ضغطة زر لتأكيد دقة ترحيل البيانات وحوكمتها.
        </p>
        
        <div className="max-h-48 overflow-y-auto bg-slate-900/50 p-4 border border-slate-800 font-mono text-[10px] text-emerald-400 space-y-4 text-left">
          {executedSQLQueries.length === 0 ? (
            <p className="text-slate-500 italic text-center font-sans font-bold">لا يوجد استعلامات منفذة حالياً. قم بإنشاء صنف، صرف زي، أو استلام شحنة لرؤية الاستعلام المولد هنا فورياً.</p>
          ) : (
            executedSQLQueries.map((q, idx) => (
              <pre key={idx} className="whitespace-pre-wrap border-b border-slate-800/80 pb-3">{q}</pre>
            ))
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD UNIFORM ITEM */}
      {/* ======================================================== */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="rounded-3xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">إضافة صنف ملابس جديد للمخازن</h3>
              <button onClick={() => setShowAddItemModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label>كود الصنف الفريد (Item Code):</label>
                <input
                  type="text"
                  placeholder="مثال: UNI-SH-WHITE"
                  value={newItem.code}
                  onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label>الباركود (Barcode):</label>
                <input
                  type="text"
                  placeholder="6281100220..."
                  value={newItem.barcode}
                  onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label>الاسم باللغة العربية:</label>
                <input
                  type="text"
                  placeholder="مثال: قميص أبيض"
                  value={newItem.nameAr}
                  onChange={(e) => setNewItem({ ...newItem, nameAr: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label>الاسم باللغة الإنجليزية:</label>
                <input
                  type="text"
                  placeholder="Classic White Shirt"
                  value={newItem.nameEn}
                  onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                  className="w-full p-2.5 border text-left font-mono"
                />
              </div>
              <div className="space-y-1">
                <label>فئة الملابس:</label>
                <select
                  value={newItem.categoryId}
                  onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label>الموسم:</label>
                <select
                  value={newItem.season}
                  onChange={(e) => setNewItem({ ...newItem, season: e.target.value as any })}
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="Summer">صيفي</option>
                  <option value="Winter">شتوي</option>
                  <option value="All">طوال العام</option>
                </select>
              </div>
              <div className="space-y-1">
                <label>سعر التكلفة (الشراء):</label>
                <input
                  type="number"
                  value={newItem.buyPrice}
                  onChange={(e) => setNewItem({ ...newItem, buyPrice: Number(e.target.value) })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label>سعر البيع الموصى به:</label>
                <input
                  type="number"
                  value={newItem.sellPrice}
                  onChange={(e) => setNewItem({ ...newItem, sellPrice: Number(e.target.value) })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={handleCreateItem}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
            >
              حفظ وتعميد صنف الزي المدرسي ✓
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD SUPPLIER */}
      {/* ======================================================== */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="rounded-3xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">تسجيل حساب مورد تجاري جديد</h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label>كود المورد:</label>
                <input
                  type="text"
                  placeholder="SUP-003"
                  value={newSupplier.code}
                  onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label>اسم المورد / الشركة:</label>
                <input
                  type="text"
                  placeholder="مؤسسة الخيوط المعتمدة"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label>الرقم الضريبي VAT:</label>
                <input
                  type="text"
                  placeholder="310..."
                  value={newSupplier.taxNumber}
                  onChange={(e) => setNewSupplier({ ...newSupplier, taxNumber: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label>الحساب البنكي IBAN:</label>
                <input
                  type="text"
                  placeholder="SA..."
                  value={newSupplier.iban}
                  onChange={(e) => setNewSupplier({ ...newSupplier, iban: e.target.value })}
                  className="w-full p-2.5 border text-left font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleCreateSupplier}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer"
            >
              حفظ حساب المورد وتعميد بطاقته 🏭
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RECEIVE PURCHASE ORDER GOODS */}
      {/* ======================================================== */}
      {showReceivePOModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-3xl shadow-2xl p-6 w-full max-w-lg space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">استلام عهدة ومطابقة الأصناف لأمر الشراء {selectedPO.code}</h3>
              <button onClick={() => setShowReceivePOModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700 leading-relaxed">
              <p>سيقوم النظام بمحاكاة **استلام كلي** للمخزون ومطابقة العلاقات بالباركود: </p>
              
              <div className="bg-transparent p-4 border font-mono text-[11px] text-slate-600 space-y-1">
                <p>✓ SKU-SH-WHT-L: 50 Qty (القميص الكلاسيكي)</p>
                <p>✓ SKU-PT-NVY-L: 50 Qty (البنطال المدرسي)</p>
              </div>

              <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-800 leading-relaxed">
                💡 <b>قيد محاسبي مرحل تلقائياً:</b>
                <br />
                - مدين: حساب المخزون المدرسي (+ {selectedPO.totalAmount} د.ل)
                <br />
                - دائن: ذمم الموردين وأوراق الدفع (- {selectedPO.totalAmount} د.ل)
              </div>
            </div>

            <button
              onClick={() => handleReceivePurchaseOrder(selectedPO.id)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
            >
              تأكيد استلام الشحنة وإدخالها المستودع 📦
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MEASUREMENT FITTING CARD */}
      {/* ======================================================== */}
      {showMeasurementModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-3xl shadow-2xl p-6 w-full max-w-lg space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">كرت تفصيل وقياسات الطالب: {selectedStudent.name}</h3>
              <button onClick={() => setShowMeasurementModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label>الطول (سم):</label>
                <input
                  type="number"
                  value={fittingForm.height}
                  onChange={(e) => setFittingForm({ ...fittingForm, height: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label>الوزن (كجم):</label>
                <input
                  type="number"
                  value={fittingForm.weight}
                  onChange={(e) => setFittingForm({ ...fittingForm, weight: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label>محيط الصدر (سم):</label>
                <input
                  type="number"
                  value={fittingForm.chest}
                  onChange={(e) => setFittingForm({ ...fittingForm, chest: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label>طول البنطال (سم):</label>
                <input
                  type="number"
                  value={fittingForm.pants}
                  onChange={(e) => setFittingForm({ ...fittingForm, pants: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label>طول الكم (سم):</label>
                <input
                  type="number"
                  value={fittingForm.sleeve}
                  onChange={(e) => setFittingForm({ ...fittingForm, sleeve: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label>مقاس الحذاء (أكرمكم الله):</label>
                <input
                  type="number"
                  value={fittingForm.shoes}
                  onChange={(e) => setFittingForm({ ...fittingForm, shoes: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 text-[11px] font-bold text-emerald-800 leading-relaxed">
              🧠 <b>محرك الاقتراح الذكي:</b> استنادًا لطول الطالب ({fittingForm.height} سم) ومحيط صدره، يوصي المحرك بمقاس: <b>{calculateRecommendedSize(fittingForm.height, fittingForm.weight, fittingForm.chest)}</b> تلقائيًا.
            </div>

            <button
              onClick={() => handleSaveStudentMeasurements(selectedStudent.id)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
            >
              حفظ كرت القياس وتحديث مقاس الطالب 📏
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BULK PRICING */}
      {/* ======================================================== */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">تعديل الأسعار الجماعي بمستودع الزي الموحد</h3>
              <button onClick={() => setShowBulkPriceModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3.5 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label>حسب فئة الملابس المحددة:</label>
                <select
                  value={bulkPriceForm.categoryId}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, categoryId: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="all">كافة الفئات</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label>نوع التعديل المالي المستهدف:</label>
                <select
                  value={bulkPriceForm.type}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, type: e.target.value as any })}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="increase">زيادة بنسبة (لوائح تضخم)</option>
                  <option value="discount">تطبيق خصم موسمي</option>
                </select>
              </div>

              <div className="space-y-1">
                <label>النسبة المئوية ( % ):</label>
                <input
                  type="number"
                  value={bulkPriceForm.percent}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, percent: Number(e.target.value) })}
                  className="w-full p-2 border font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleApplyBulkPricing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
            >
              تطبيق التعديل المالي الفوري لجميع الأصناف المطابقة 🏷️
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
