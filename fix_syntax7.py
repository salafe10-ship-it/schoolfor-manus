import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(".maintenanceLogs.length", "assetForm.maintenanceLogs.length")
text = text.replace(".transferLogs.length", "assetForm.transferLogs.length")
text = text.replace(".attachments.length", "assetForm.attachments.length")
text = text.replace(".operations.length", "assetForm.operations.length")
text = text.replace("{.every(", "{fixedAssets.every(")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
