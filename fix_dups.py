import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's write a smarter cleanup for FixedAssetsTab.tsx.
# The component starts at line 8.
# It seems there are multiple copies of the state and handlers.
# Maybe we can just extract the return(...) statement, and rebuild the context destructuring.

start_return = text.find("return (")
if start_return != -1:
    return_block = text[start_return:]
    
    # get context destructure from ReceiptVoucherTab
    with open('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', 'r', encoding='utf-8') as f2:
        rv_text = f2.read()
        ctx_start = rv_text.find("const {")
        ctx_end = rv_text.find("} = React.useContext(AccountingContext);") + 40
        ctx_str = rv_text[ctx_start:ctx_end]
        
    new_text = """import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, Printer, 
  Search, Filter, ChevronDown, CheckCircle, 
  XCircle, FileText, ArrowLeftRight, Wrench, AlertTriangle, Play
} from 'lucide-react';
import { AccountingContext } from '../AccountingContext';
import { triggerNotification } from '../../../../components/Layout';

export const FixedAssetsTab = () => {
""" + "  " + ctx_str + "\n\n  " + return_block

    with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as fw:
        fw.write(new_text)
    print("Cleaned up FixedAssetsTab.tsx")
else:
    print("Could not find return (")
