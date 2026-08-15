import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

const missingStates = `
  const [jvColWidths, setJvColWidths] = useState<any>({});
  const [activeJvState, setActiveJvState] = useState<any>(null);
  const [jvSearchFilters, setJvSearchFilters] = useState<any>({});
  const [jvAuditTrail, setJvAuditTrail] = useState<any[]>([]);
  const [jvAttachmentsList, setJvAttachmentsList] = useState<any[]>([]);
  const [jvTableMaximized, setJvTableMaximized] = useState<boolean>(false);
  const [receiptVouchers, setReceiptVouchers] = useState<any[]>([]);
  const [paymentVouchers, setPaymentVouchers] = useState<any[]>([]);
  const [receiptVoucherForm, setReceiptVoucherForm] = useState<any>({});
  const [paymentVoucherForm, setPaymentVoucherForm] = useState<any>({});
  const [selectedReceiptVoucher, setSelectedReceiptVoucher] = useState<any | null>(null);
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState<boolean>(false);
  const [selectedPaymentVoucher, setSelectedPaymentVoucher] = useState<any | null>(null);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState<boolean>(false);
  const [receiptSearch, setReceiptSearch] = useState<string>('');
  const [receiptCostCenterFilter, setReceiptCostCenterFilter] = useState<string>('');
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [paymentCostCenterFilter, setPaymentCostCenterFilter] = useState<string>('');
  const [fixedAssets, setFixedAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeAssetTab, setActiveAssetTab] = useState<string>('details');
  const [isEditAssetMode, setIsEditAssetMode] = useState<boolean>(false);
  const [isNewAssetMode, setIsNewAssetMode] = useState<boolean>(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('');
  const [assetStatusFilter, setAssetStatusFilter] = useState<string>('');
  const [assetCostCenterFilter, setAssetCostCenterFilter] = useState<string>('');
  const [assetForm, setAssetForm] = useState<any>({});
  const [maintenanceForm, setMaintenanceForm] = useState<any>({});
  const [transferForm, setTransferForm] = useState<any>({});
  const [saleForm, setSaleForm] = useState<any>({});
  const [discardForm, setDiscardForm] = useState<any>({});
  const [activeAssetModal, setActiveAssetModal] = useState<string | null>(null);
  const [fixedAssetReportType, setFixedAssetReportType] = useState<string>('all');
  const [fixedAssetViewMode, setFixedAssetViewMode] = useState<string>('list');
  const [budgets, setBudgets] = useState<any[]>([]);
`;

content = content.replace(
  "  const [calcExpr, setCalcExpr] = useState<string>('');",
  missingStates + "\n  const [calcExpr, setCalcExpr] = useState<string>('');"
);

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
