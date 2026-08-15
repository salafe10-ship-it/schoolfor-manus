import fs from 'fs';
let content = fs.readFileSync('src/components/GeneralLedgerPortal.tsx', 'utf8');

const missingStates = `
  const [setNewYearNumberInput, closingDescriptionInput, setClosingDescriptionInput] = [()=> {}, '', ()=> {}];
  const [unapprovedAdjustmentsCount, setUnapprovedAdjustmentsCount] = useState<number>(0);
  const [expandedNodes, setExpandedNodes] = useState<any[]>([]);
  const [coaForm, setCoaForm] = useState<any>({});
  const [showCoaImportModal, setShowCoaImportModal] = useState<boolean>(false);
  const [coaImportText, setCoaImportText] = useState<string>('');
  const [isJvFullscreen, setIsJvFullscreen] = useState<boolean>(false);
  const [selectedJvId, setSelectedJvId] = useState<string | null>(null);
  const [jvEditMode, setJvEditMode] = useState<boolean>(false);
  const [activeJvTab, setActiveJvTab] = useState<string>('list');
  const [copiedJvLine, setCopiedJvLine] = useState<any | null>(null);
  const [jvTableSearch, setJvTableSearch] = useState<string>('');
  const [jvFocusedRowIndex, setJvFocusedRowIndex] = useState<number | null>(null);
`;

content = content.replace(
  "  const [calcExpr, setCalcExpr] = useState<string>('');",
  missingStates + "\n  const [calcExpr, setCalcExpr] = useState<string>('');"
);

fs.writeFileSync('src/components/GeneralLedgerPortal.tsx', content);
