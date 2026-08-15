const fs = require('fs');
let portal = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf-8');

portal = portal.replace(/import React, \{ useState, useMemo \} from 'react';\nimport \{\n  Building2, Hash, Calendar, Layers, HelpCircle,\n  Settings2, Activity, Play, Plus, Landmark, RefreshCw, AlertTriangle\n\} from 'lucide-react';\nimport \{ useSchool \} from '\.\.\/context\/SchoolContext';\nimport \{ useCurrency \} from '\.\.\/context\/CurrencyContext';\nimport \{ EnterpriseActionToolbar \} from '\.\/EnterpriseActionToolbar';\n\n/, '');

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', portal, 'utf-8');
console.log('Removed duplicate header');
