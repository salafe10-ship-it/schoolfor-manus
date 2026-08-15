const fs = require('fs');

let fr = fs.readFileSync('src/modules/accounting/presentation/FinancialReportsTab.tsx', 'utf-8');

fr = fr.replace(/const \[\] = useState<string>\('2026-01-01'\);/g, "const [filterFromDate, setFilterFromDate] = useState<string>('2026-01-01');");
fr = fr.replace(/const \[\] = useState<string>\('2026-12-31'\);/g, "const [filterToDate, setFilterToDate] = useState<string>('2026-12-31');");
fr = fr.replace(/const \[\] = useState<string>\('2026'\);/g, "const [filterFiscalYear, setFilterFiscalYear] = useState<string>('2026');");
fr = fr.replace(/const \[\] = useState<string>\('سنوي'\);/g, "const [filterAccountingPeriod, setFilterAccountingPeriod] = useState<string>('سنوي');");

let allCount = 0;
fr = fr.replace(/const \[\] = useState<string>\('all'\);/g, () => {
    allCount++;
    if (allCount === 1) return "const [filterCostCenter, setFilterCostCenter] = useState<string>('all');";
    if (allCount === 2) return "const [filterAccount, setFilterAccount] = useState<string>('all');";
    return "const [] = useState<string>('all');";
});

let boolCount = 0;
fr = fr.replace(/const \[\] = useState<boolean>\(false\);/g, () => {
    boolCount++;
    if (boolCount === 1) return "const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);";
    if (boolCount === 2) return "const [filterBalanceOnly, setFilterBalanceOnly] = useState<boolean>(false);";
    return "const [] = useState<boolean>(false);";
});

fr = fr.replace(/const \[\] = useState<'code' \| 'name'>\('code'\);/g, "const [filterSortBy, setFilterSortBy] = useState<'code' | 'name'>('code');");
fr = fr.replace(/const \[\] = useState<1 \| 2 \| 3 \| 'all'>\('all'\);/g, "const [trialBalanceLevel, setTrialBalanceLevel] = useState<1 | 2 | 3 | 'all'>('all');");

fr = fr.replace(/const = \(reportType: string \| null\) => \{/g, "const handleSelectReport = (reportType: string | null) => {");
fr = fr.replace(/\(reportType\);/g, "setSelectedReport(reportType);");
fr = fr.replace(/\(\[\]\);/g, "setDrillDownStack([]);");

fs.writeFileSync('src/modules/accounting/presentation/FinancialReportsTab.tsx', fr, 'utf-8');
console.log('Fixed FR');
