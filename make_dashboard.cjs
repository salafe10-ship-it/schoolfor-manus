const fs = require('fs');

const code = fs.readFileSync('/tmp/dashboard.txt', 'utf-8');

const rvTab = fs.readFileSync('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', 'utf-8');
const destructureStr = rvTab.substring(rvTab.indexOf('const {'), rvTab.indexOf('} = React.useContext(AccountingContext);') + 40);

const imports = `import React, { useMemo, useState } from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { 
  Plus, Edit, Eye, Trash2, Save, X, Printer, Search, FileDown, 
  Settings2, Filter, Calculator, Table, List, Maximize2, Minimize2, CheckCircle2, AlertTriangle, Play, ChevronLeft, ChevronRight, Share2, CornerUpLeft, BookOpen, User, Hash, CreditCard, PenTool, LayoutTemplate, Link, ArrowLeft, ArrowRight, Activity, Calendar, FileText, CheckCircle, Clock, ShieldCheck, Flag, Briefcase, Key, RefreshCw, BarChart3, Users, Landmark, Download, FilePlus, Zap, Settings, HelpCircle, ArrowUpRight, ArrowDownRight, Layers, FileSignature
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';

export const LedgerDashboardTab = () => {
  ${destructureStr}

  return (
    <>
      ${code}
    </>
  );
};
`;

fs.writeFileSync('src/modules/accounting/presentation/LedgerDashboardTab.tsx', imports, 'utf-8');
console.log('Saved');
