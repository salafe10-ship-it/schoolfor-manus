import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

const missingStates = `
  const [jvSearchFilters, setJvSearchFilters] = useState({ id: '', status: '', type: '', description: '' });
  const [activeJvState, setActiveJvState] = useState<any>(null);
  const [selectedReceiptVoucher, setSelectedReceiptVoucher] = useState<any | null>(null);
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState<boolean>(false);
  const [selectedPaymentVoucher, setSelectedPaymentVoucher] = useState<any | null>(null);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState<boolean>(false);
`;

content = content.replace(
  "  const [calcExpr, setCalcExpr] = useState<string>('');",
  missingStates + "\n  const [calcExpr, setCalcExpr] = useState<string>('');"
);

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
