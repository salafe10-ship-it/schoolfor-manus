const fs = require('fs');

const rvTab = fs.readFileSync('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', 'utf-8');
const destructureStr = rvTab.substring(rvTab.indexOf('const {'), rvTab.indexOf('} = React.useContext(AccountingContext);') + 40);

const bankCode = fs.readFileSync('/tmp/bank.txt', 'utf-8');
const budgetCode = fs.readFileSync('/tmp/budget.txt', 'utf-8');

const bankFile = `import React, { useState } from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { 
  Building2, Hash, Calendar, Layers, HelpCircle, 
  Settings2, Activity, Play, Plus, Landmark, RefreshCw
} from 'lucide-react';
import { useSchool } from '../../../context/SchoolContext';

export const BankTransfersTab = () => {
  ${destructureStr}
  const { triggerNotification } = useSchool();
  const [bankTransferSimStep, setBankTransferSimStep] = useState(1);

  return (
    <>
      ${bankCode}
    </>
  );
};
`;

const budgetFile = `import React from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { 
  ChevronLeft, PieChart, Activity, LineChart, Hash, 
  TrendingUp, RefreshCw, Flag, Settings2, BarChart3, AlertTriangle, Building2, Play, Users, FileText
} from 'lucide-react';
import { AreaChart, Area, ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { useSchool } from '../../../context/SchoolContext';

export const EstimatedBudgetTab = () => {
  ${destructureStr}
  const { triggerNotification } = useSchool();
  const performanceData = [
    { month: 'يناير', real: 15000, estimated: 14000, cumulativeReal: 15000, cumulativeEst: 14000 },
    { month: 'فبراير', real: 28000, estimated: 29000, cumulativeReal: 43000, cumulativeEst: 43000 },
    { month: 'مارس', real: 42000, estimated: 45000, cumulativeReal: 85000, cumulativeEst: 88000 },
    { month: 'أبريل', real: 60000, estimated: 58000, cumulativeReal: 145000, cumulativeEst: 146000 },
    { month: 'مايو', real: 85000, estimated: 80000, cumulativeReal: 230000, cumulativeEst: 226000 },
    { month: 'يونيو', real: 110000, estimated: 105000, cumulativeReal: 340000, cumulativeEst: 331000 },
  ];

  return (
    <>
      ${budgetCode}
    </>
  );
};
`;

fs.writeFileSync('src/modules/accounting/presentation/BankTransfersTab.tsx', bankFile, 'utf-8');
fs.writeFileSync('src/modules/accounting/presentation/EstimatedBudgetTab.tsx', budgetFile, 'utf-8');
console.log('Saved');
