/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 1. Categories
export interface UniformCategory {
  id: string;
  name: string;
  description: string;
  schoolStage: 'Kindergarten' | 'Primary' | 'Middle' | 'High' | 'All';
}

// 2. Uniform Items
export interface UniformItem {
  id: string;
  code: string;
  barcode: string;
  nameAr: string;
  nameEn: string;
  categoryId: string;
  group: string; // e.g., 'Boys', 'Girls', 'Unisex'
  division: string; // e.g., 'Regular', 'Sports', 'Winter'
  season: 'Summer' | 'Winter' | 'Spring' | 'Autumn' | 'All';
  gender: 'Male' | 'Female' | 'Unisex';
  gradeId?: string;
  description: string;
  brand: string;
  fabricType: string;
  cottonPercent: number;
  weightGsm: number;
  washInstructions: string;
  minPrice: number;
  maxPrice: number;
  marginPercent: number;
}

// 3. Sizes
export interface UniformSize {
  id: string;
  code: string; // XS, S, M, L, XL, etc.
  description: string;
}

// 4. Colors
export interface UniformColor {
  id: string;
  name: string; // أبيض، كحلي، الخ
  hex: string;
}

// 5. Variants (Bridge between Item, Size, and Color)
export interface UniformVariant {
  id: string;
  itemId: string;
  sizeId: string;
  colorId: string;
  sku: string;
  stockQty: number;
  buyPrice: number;
  sellPrice: number;
  studentPrice: number;
  wholesalePrice: number;
  alertLimit: number;
  reorderPoint: number;
  maxLimit: number;
  locationCode: string;
}

// 6. Suppliers
export interface UniformSupplier {
  id: string;
  code: string;
  name: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  taxNumber: string;
  bankName: string;
  iban: string;
  paymentTerms: string; // e.g., 'Cash', '30 Days', '60 Days'
  classification: 'A' | 'B' | 'C';
  status: 'active' | 'inactive';
}

// 7. Purchase Orders
export interface UniformPurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  issueDate: string;
  dueDate: string;
  status: 'Draft' | 'Approved' | 'PartiallyReceived' | 'Received' | 'Cancelled';
  totalAmount: number;
  notes: string;
}

// 8. Purchase Order Items
export interface UniformPurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  variantId: string;
  qtyOrdered: number;
  qtyReceived: number;
  costPrice: number;
  lineTotal: number;
}

// 9. Receipts
export interface UniformReceipt {
  id: string;
  code: string;
  purchaseOrderId: string;
  date: string;
  totalAmount: number;
  receivedBy: string;
  notes: string;
  journalEntryId?: string;
}

// 10. Stock Transactions
export interface UniformStockTransaction {
  id: string;
  variantId: string;
  type: 'PurchaseReceipt' | 'StudentSale' | 'StudentReturn' | 'SupplierReturn' | 'InventoryCountAdjustment';
  qty: number; // positive for addition, negative for deduction
  date: string;
  unitCost: number;
  referenceId: string;
  notes: string;
}

// 11. Student Measurements
export interface StudentMeasurement {
  id: string;
  studentId: string;
  heightCm: number;
  weightKg: number;
  chestCm: number;
  waistCm: number;
  pantsLengthCm: number;
  sleeveLengthCm: number;
  shoeSize: number;
  recommendedSize: string;
  updatedAt: string;
}

// 12. Student Orders
export interface UniformStudentOrder {
  id: string;
  code: string;
  studentId: string;
  date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  status: 'Pending' | 'Delivered' | 'Cancelled';
  paymentMethod: 'Cash' | 'Card' | 'BankTransfer' | 'StudentAccount';
  isPaid: boolean;
  invoiceId?: string;
  journalEntryId?: string;
}

// 13. Student Order Items
export interface UniformStudentOrderItem {
  id: string;
  studentOrderId: string;
  variantId: string;
  qty: number;
  price: number;
  lineTotal: number;
}

// 14. Reservations (Bookings when out of stock)
export interface UniformReservation {
  id: string;
  studentId: string;
  variantId: string;
  qty: number;
  date: string;
  status: 'Pending' | 'Notified' | 'Fulfilled' | 'Cancelled';
  notes: string;
}

// 15. Returns (Student or Supplier)
export interface UniformReturn {
  id: string;
  code: string;
  type: 'StudentReturn' | 'SupplierReturn';
  studentId?: string;
  supplierId?: string;
  variantId: string;
  qty: number;
  date: string;
  totalRefund: number;
  refundMethod: 'Cash' | 'Card' | 'StudentAccount' | 'CreditNote';
  reason: string;
  sizeChangeTo?: string;
  colorChangeTo?: string;
  journalEntryId?: string;
}

// 16. Inventory Counts (Jard)
export interface UniformInventoryCount {
  id: string;
  code: string;
  startDate: string;
  endDate?: string;
  type: 'Full' | 'Partial';
  status: 'Counting' | 'Approved' | 'Cancelled';
  verifiedBy: string;
  notes: string;
}

// 17. Inventory Adjustments
export interface UniformInventoryAdjustment {
  id: string;
  inventoryCountId: string;
  variantId: string;
  expectedQty: number;
  physicalQty: number;
  diffQty: number;
  adjustmentCost: number;
  status: 'Pending' | 'Approved';
  date: string;
}

// 18. Accounting Double Entry (Simulated ERP Journals)
export interface AccountingJournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
}

// Complete SQLite / PostgreSQL SQL Schema Definition as requested
export const UNIFORM_SQL_SCHEMA = `
-- 1. uniform_categories
CREATE TABLE uniform_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  school_stage VARCHAR(50) CHECK (school_stage IN ('Kindergarten', 'Primary', 'Middle', 'High', 'All')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. uniform_items
CREATE TABLE uniform_items (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50) UNIQUE NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  category_id VARCHAR(50) REFERENCES uniform_categories(id),
  item_group VARCHAR(50),
  division VARCHAR(50),
  season VARCHAR(50) CHECK (season IN ('Summer', 'Winter', 'Spring', 'Autumn', 'All')),
  gender VARCHAR(50) CHECK (gender IN ('Male', 'Female', 'Unisex')),
  grade_id VARCHAR(50),
  description TEXT,
  brand VARCHAR(100),
  fabric_type VARCHAR(100),
  cotton_percent DECIMAL(5,2),
  weight_gsm INT,
  wash_instructions TEXT,
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  margin_percent DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. uniform_sizes
CREATE TABLE uniform_sizes (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  description VARCHAR(100)
);

-- 4. uniform_colors
CREATE TABLE uniform_colors (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  hex_code VARCHAR(10)
);

-- 5. uniform_item_variants
CREATE TABLE uniform_item_variants (
  id VARCHAR(50) PRIMARY KEY,
  item_id VARCHAR(50) REFERENCES uniform_items(id) ON DELETE CASCADE,
  size_id VARCHAR(50) REFERENCES uniform_sizes(id),
  color_id VARCHAR(50) REFERENCES uniform_colors(id),
  sku VARCHAR(100) UNIQUE NOT NULL,
  stock_qty INT DEFAULT 0 CHECK (stock_qty >= 0),
  buy_price DECIMAL(10,2) NOT NULL,
  sell_price DECIMAL(10,2) NOT NULL,
  student_price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2) NOT NULL,
  alert_limit INT DEFAULT 5,
  reorder_point INT DEFAULT 10,
  max_limit INT DEFAULT 200,
  location_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_id, size_id, color_id)
);

-- 6. uniform_suppliers
CREATE TABLE uniform_suppliers (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  mobile VARCHAR(50),
  email VARCHAR(100),
  address TEXT,
  tax_number VARCHAR(50),
  bank_name VARCHAR(100),
  iban VARCHAR(100),
  payment_terms VARCHAR(100),
  classification CHAR(1) CHECK (classification IN ('A', 'B', 'C')),
  status VARCHAR(20) CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. uniform_purchase_orders
CREATE TABLE uniform_purchase_orders (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  supplier_id VARCHAR(50) REFERENCES uniform_suppliers(id),
  issue_date DATE NOT NULL,
  due_date DATE,
  status VARCHAR(50) CHECK (status IN ('Draft', 'Approved', 'PartiallyReceived', 'Received', 'Cancelled')),
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. uniform_purchase_order_items
CREATE TABLE uniform_purchase_order_items (
  id VARCHAR(50) PRIMARY KEY,
  purchase_order_id VARCHAR(50) REFERENCES uniform_purchase_orders(id) ON DELETE CASCADE,
  variant_id VARCHAR(50) REFERENCES uniform_item_variants(id),
  qty_ordered INT NOT NULL CHECK (qty_ordered > 0),
  qty_received INT DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL
);

-- 9. uniform_receipts
CREATE TABLE uniform_receipts (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  purchase_order_id VARCHAR(50) REFERENCES uniform_purchase_orders(id),
  receipt_date DATE NOT NULL,
  total_amount DECIMAL(12,2),
  received_by VARCHAR(100),
  notes TEXT,
  journal_entry_id VARCHAR(50)
);

-- 10. uniform_stock_transactions
CREATE TABLE uniform_stock_transactions (
  id VARCHAR(50) PRIMARY KEY,
  variant_id VARCHAR(50) REFERENCES uniform_item_variants(id),
  transaction_type VARCHAR(50) NOT NULL,
  qty INT NOT NULL,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unit_cost DECIMAL(10,2) NOT NULL,
  reference_id VARCHAR(50) NOT NULL,
  notes TEXT
);

-- 11. uniform_student_measurements
CREATE TABLE uniform_student_measurements (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  chest_cm DECIMAL(5,2),
  waist_cm DECIMAL(5,2),
  pants_length_cm DECIMAL(5,2),
  sleeve_length_cm DECIMAL(5,2),
  shoe_size DECIMAL(4,1),
  recommended_size VARCHAR(10),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id)
);

-- 12. uniform_student_orders
CREATE TABLE uniform_student_orders (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  order_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0.00,
  tax DECIMAL(10,2) DEFAULT 0.00,
  grand_total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('Pending', 'Delivered', 'Cancelled')),
  payment_method VARCHAR(50),
  is_paid BOOLEAN DEFAULT FALSE,
  invoice_id VARCHAR(50),
  journal_entry_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. uniform_student_order_items
CREATE TABLE uniform_student_order_items (
  id VARCHAR(50) PRIMARY KEY,
  student_order_id VARCHAR(50) REFERENCES uniform_student_orders(id) ON DELETE CASCADE,
  variant_id VARCHAR(50) REFERENCES uniform_item_variants(id),
  qty INT NOT NULL CHECK (qty > 0),
  price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL
);

-- 14. uniform_reservations
CREATE TABLE uniform_reservations (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  variant_id VARCHAR(50) REFERENCES uniform_item_variants(id),
  qty INT NOT NULL,
  reservation_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('Pending', 'Notified', 'Fulfilled', 'Cancelled')),
  notes TEXT
);

-- 15. uniform_returns
CREATE TABLE uniform_returns (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  return_type VARCHAR(20) CHECK (return_type IN ('StudentReturn', 'SupplierReturn')),
  student_id VARCHAR(50),
  supplier_id VARCHAR(50),
  variant_id VARCHAR(50) REFERENCES uniform_item_variants(id),
  qty INT NOT NULL CHECK (qty > 0),
  return_date DATE NOT NULL,
  total_refund DECIMAL(10,2) NOT NULL,
  refund_method VARCHAR(50),
  reason TEXT,
  size_change_to VARCHAR(10),
  color_change_to VARCHAR(50),
  journal_entry_id VARCHAR(50)
);

-- 16. uniform_inventory_counts
CREATE TABLE uniform_inventory_counts (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  count_type VARCHAR(20) CHECK (count_type IN ('Full', 'Partial')),
  status VARCHAR(20) CHECK (status IN ('Counting', 'Approved', 'Cancelled')),
  verified_by VARCHAR(100),
  notes TEXT
);

-- 17. uniform_inventory_adjustments
CREATE TABLE uniform_inventory_adjustments (
  id VARCHAR(50) PRIMARY KEY,
  inventory_count_id VARCHAR(50) REFERENCES uniform_inventory_counts(id) ON DELETE CASCADE,
  variant_id VARCHAR(50) REFERENCES uniform_item_variants(id),
  expected_qty INT NOT NULL,
  physical_qty INT NOT NULL,
  diff_qty INT NOT NULL,
  adjustment_cost DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('Pending', 'Approved')),
  adjustment_date DATE NOT NULL
);

CREATE INDEX idx_item_variant ON uniform_item_variants(item_id, size_id, color_id);
CREATE INDEX idx_student_order ON uniform_student_orders(student_id);
`;
