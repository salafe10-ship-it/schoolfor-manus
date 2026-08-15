import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

const missing = [
  "filterFinancialPeriod", "setFilterFinancialPeriod",
  "filterFromDate", "setFilterFromDate",
  "filterToDate", "setFilterToDate",
  "filterFiscalYear", "setFilterFiscalYear",
  "filterAccountingPeriod", "setFilterAccountingPeriod",
  "filterCostCenter", "setFilterCostCenter",
  "filterAccount", "setFilterAccount",
  "filterActiveOnly", "setFilterActiveOnly",
  "filterBalanceOnly", "setFilterBalanceOnly",
  "filterSortBy", "setFilterSortBy",
  "trialBalanceLevel", "setTrialBalanceLevel",
  "closingStep", "setClosingStep",
  "isCheckingReady", "setIsCheckingReady",
  "checkedReady", "setCheckedReady",
  "closingProgress", "setClosingProgress",
  "closingProgressMessage", "setClosingProgressMessage",
  "closingAuditLog", "setClosingAuditLog",
  "isYearClosed", "setIsYearClosed",
  "closingRefNo", "setClosingRefNo",
  "closingDate", "setClosingDate",
  "openedYear2027", "setOpenedYear2027",
  "currentClosingYear", "setCurrentClosingYear",
  "closingDateInput", "setClosingDateInput",
  "newYearStartDateInput", "setNewYearStartDateInput",
  "newYearEndDateInput", "setNewYearEndDateInput",
  "newYearNumberInput", "setNewYearNumberInput"
];

let added = [];
for(let i=0; i<missing.length; i+=2) {
  added.push(`  const [${missing[i]}, ${missing[i+1]}] = useState<any>(null);`);
}

content = content.replace(
  "  const [calcExpr, setCalcExpr] = useState<string>('');",
  added.join('\\n') + "\\n  const [calcExpr, setCalcExpr] = useState<string>('');"
);

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
