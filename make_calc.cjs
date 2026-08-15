const fs = require('fs');
const code = fs.readFileSync('/tmp/calc.txt', 'utf-8');

const rvTab = fs.readFileSync('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', 'utf-8');
const destructureStr = rvTab.substring(rvTab.indexOf('const {'), rvTab.indexOf('} = React.useContext(AccountingContext);') + 40);

const imports = `import React from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { 
  Calculator, Receipt, RefreshCw, BarChart, Percent
} from 'lucide-react';

export const CalcToolsTab = () => {
  ${destructureStr}

  return (
    <>
      ${code}
    </>
  );
};
`;

fs.writeFileSync('src/modules/accounting/presentation/CalcToolsTab.tsx', imports, 'utf-8');
console.log('Saved');
