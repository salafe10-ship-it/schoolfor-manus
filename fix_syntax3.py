import re

with open('src/modules/accounting/presentation/PaymentVoucherTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("<form onSubmit={} className=\"space-y-4\">", "<form onSubmit={(e) => { e.preventDefault(); handleAddPaymentVoucher(e); }} className=\"space-y-4\">")

with open('src/modules/accounting/presentation/PaymentVoucherTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done pv")

with open('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("<form onSubmit={} className=\"space-y-4\">", "<form onSubmit={(e) => { e.preventDefault(); handleAddReceiptVoucher(e); }} className=\"space-y-4\">")

with open('src/modules/accounting/presentation/ReceiptVoucherTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done rv")

