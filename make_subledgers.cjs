const fs = require('fs');

const rvTab = fs.readFileSync('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', 'utf-8');
const destructureStr = rvTab.substring(rvTab.indexOf('const {'), rvTab.indexOf('} = React.useContext(AccountingContext);') + 40);

const customersCode = fs.readFileSync('/tmp/customers.txt', 'utf-8');
const suppliersCode = fs.readFileSync('/tmp/suppliers.txt', 'utf-8');

const customersFile = `import React from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { useSchool } from '../../../context/SchoolContext';

export const CustomersLedgerTab = () => {
  ${destructureStr}
  const { students } = useSchool();

  return (
    <>
      ${customersCode}
    </>
  );
};
`;

const suppliersFile = `import React from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { Plus } from 'lucide-react';
import { useSchool } from '../../../context/SchoolContext';

export const SuppliersLedgerTab = () => {
  ${destructureStr}
  const { triggerNotification } = useSchool();

  return (
    <>
      ${suppliersCode}
    </>
  );
};
`;

fs.writeFileSync('src/modules/accounting/presentation/CustomersLedgerTab.tsx', customersFile, 'utf-8');
fs.writeFileSync('src/modules/accounting/presentation/SuppliersLedgerTab.tsx', suppliersFile, 'utf-8');
console.log('Saved');
