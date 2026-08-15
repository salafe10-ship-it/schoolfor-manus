const fs = require('fs');
let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

portal = portal.replace(/        \{activeTab === 'bank_transfers'[\s\S]*?\}\)\)\);\n/m, '');
portal = `import React, { useState, useMemo } from 'react';
import { 
  Building2, Hash, Calendar, Layers, HelpCircle, 
  Settings2, Activity, Play, Plus, Landmark, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useCurrency } from '../context/CurrencyContext';
import { EnterpriseActionToolbar } from './EnterpriseActionToolbar';

` + portal;

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', portal, 'utf-8');
console.log('Fixed top');
