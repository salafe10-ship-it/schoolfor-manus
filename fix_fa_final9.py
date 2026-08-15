import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("asset.id === ;", "asset.id === selectedAssetId;")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
