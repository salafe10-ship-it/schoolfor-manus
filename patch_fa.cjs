const fs = require('fs');

let fa = fs.readFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'utf-8');

fa = fa.replace(/const \[\] = useState<any\[\]>\(\(\) => \{/g, "const [fixedAssets, setFixedAssets] = useState<any[]>(() => {");
fa = fa.replace(/const \[\] = useState<string>\('FA-01'\);/g, "const [selectedAssetId, setSelectedAssetId] = useState<string>('FA-01');");
fa = fa.replace(/const \[\] = useState<'basic' \| 'financial' \| 'depreciation' \| 'maintenance' \| 'transfers' \| 'attachments' \| 'operations'>\('basic'\);/g, "const [activeAssetTab, setActiveAssetTab] = useState<'basic' | 'financial' | 'depreciation' | 'maintenance' | 'transfers' | 'attachments' | 'operations'>('basic');");
fa = fa.replace(/const \[\] = useState<boolean>\(false\);/g, (match, offset, string) => {
    // we need to distinguish between isEditAssetMode and isNewAssetMode
    return offset < 5000 ? "const [isEditAssetMode, setIsEditAssetMode] = useState<boolean>(false);" : "const [isNewAssetMode, setIsNewAssetMode] = useState<boolean>(false);";
});
// actually replace all sequentially
let booleans = 0;
fa = fa.replace(/const \[\] = useState<boolean>\(false\);/g, () => {
    booleans++;
    if (booleans === 1) return "const [isEditAssetMode, setIsEditAssetMode] = useState<boolean>(false);";
    if (booleans === 2) return "const [isNewAssetMode, setIsNewAssetMode] = useState<boolean>(false);";
    return "const [] = useState<boolean>(false);";
});

let strings = 0;
fa = fa.replace(/const \[\] = useState<string>\(''\);/g, "const [assetSearchTerm, setAssetSearchTerm] = useState<string>('');");
fa = fa.replace(/const \[\] = useState<string>\('all'\);/g, () => {
    strings++;
    if (strings === 1) return "const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('all');";
    if (strings === 2) return "const [assetStatusFilter, setAssetStatusFilter] = useState<string>('all');";
    if (strings === 3) return "const [assetCostCenterFilter, setAssetCostCenterFilter] = useState<string>('all');";
    return "const [] = useState<string>('all');";
});

fa = fa.replace(/const \[\] = useState<any>\(\{/g, "const [assetForm, setAssetForm] = useState<any>({");

let forms = 0;
fa = fa.replace(/const \[\] = useState\(\{/g, (match, offset) => {
    forms++;
    if (forms === 1) return "const [assetMaintenanceForm, setAssetMaintenanceForm] = useState({";
    if (forms === 2) return "const [assetTransferForm, setAssetTransferForm] = useState({";
    if (forms === 3) return "const [assetSaleForm, setAssetSaleForm] = useState({";
    if (forms === 4) return "const [assetDiscardForm, setAssetDiscardForm] = useState({";
    return match;
});

fa = fa.replace(/const \[\] = useState<'none' \| 'maintenance' \| 'transfer' \| 'sale' \| 'discard' \| 'print_card' \| 'print_schedule'>\('none'\);/g, "const [assetActionModal, setAssetActionModal] = useState<'none' | 'maintenance' | 'transfer' | 'sale' | 'discard' | 'print_card' | 'print_schedule'>('none');");
fa = fa.replace(/const \[\] = useState<string>\('all_assets'\);/g, "const [selectedAssetsForAction, setSelectedAssetsForAction] = useState<string>('all_assets');");
fa = fa.replace(/const \[\] = useState<'management' \| 'reports'>\('management'\);/g, "const [fixedAssetViewMode, setFixedAssetViewMode] = useState<'management' | 'reports'>('management');");

fa = fa.replace(/const = \(assetId: string\) => \{/g, "const handleViewAssetDetails = (assetId: string) => {");
fa = fa.replace(/\(assetId\);/g, "setSelectedAssetId(assetId);");
fa = fa.replace(/const asset = \.find\(a => a\.id === assetId\);/g, "const asset = fixedAssets.find(a => a.id === assetId);");
fa = fa.replace(/\(\{ \.\.\.asset \}\);/g, "setAssetForm({ ...asset });");
fa = fa.replace(/\(false\);/g, "setIsEditAssetMode(false);\n    setIsNewAssetMode(false);");

fa = fa.replace(/const = \(\) => \{/g, "const handlePrepareNewAsset = () => {");
fa = fa.replace(/const = \(\) => \{/g, "const handleSaveAsset = () => {");

// this is getting messy. Let's see if we can just re-extract FixedAssetsTab from a backup? No backups available.
fs.writeFileSync('src/modules/accounting/presentation/FixedAssetsTab.tsx', fa, 'utf-8');
console.log('Fixed states');
