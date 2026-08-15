const fs = require('fs');

let rv = fs.readFileSync('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', 'utf-8');
const ctx_start = rv.indexOf("const {");
const ctx_end = rv.indexOf("} = React.useContext(AccountingContext);") + 40;
const ctx_str = rv.substring(ctx_start, ctx_end);

let fa = fs.readFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'utf-8');
const return_start = fa.indexOf("return (");
const return_block = fa.substring(return_start);

const new_fa = `import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, Printer, 
  Search, Filter, ChevronDown, CheckCircle, 
  XCircle, FileText, ArrowLeftRight, Wrench, AlertTriangle, Play
} from 'lucide-react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { triggerNotification } from '../../../components/Layout';

export const FixedAssetsTab = () => {
  ${ctx_str}
  
  const [assetActionModal, setAssetActionModal] = useState<'none' | 'maintenance' | 'transfer' | 'sale' | 'discard' | 'print_card' | 'print_schedule'>('none');
  const [selectedAssetsForAction, setSelectedAssetsForAction] = useState<string>('all_assets');
  const [fixedAssetViewMode, setFixedAssetViewMode] = useState<'management' | 'reports'>('management');
  
  const handleViewAssetDetails = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = fixedAssets.find(a => a.id === assetId);
    if (asset) {
      setAssetForm({ ...asset });
    }
    setAssetDetailTab('details');
  };

  ${return_block}
};
`;

fs.writeFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', new_fa, 'utf-8');
console.log("Restored FA");
