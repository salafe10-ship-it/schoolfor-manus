const fs = require('fs');

let fr = fs.readFileSync('src/modules/accounting/presentation/FinancialReportsTab.tsx', 'utf-8');

fr = fr.replace(/const \[\] = useState<string \| null>\(null\);/g, "const [selectedReport, setSelectedReport] = useState<string | null>(null);");
fr = fr.replace(/const \[\] = useState<DrillDownStep\[\]>setDrillDownStack\(\[\]\);/g, "const [drillDownStack, setDrillDownStack] = useState<any[]>([]);");

fs.writeFileSync('src/modules/accounting/presentation/FinancialReportsTab.tsx', fr, 'utf-8');
console.log("Fixed FR");
