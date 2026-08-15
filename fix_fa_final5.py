import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("{activeAssetTab fixedAssetViewMode === 'management'", "{fixedAssetViewMode === 'management'")
text = text.replace("{fixedAssetViewMode fixedAssetViewMode === 'management'", "{fixedAssetViewMode === 'management'")
text = text.replace("{fixedAssetViewMode fixedAssetViewMode === 'reports'", "{fixedAssetViewMode === 'reports'")
text = text.replace("{activeAssetTab fixedAssetViewMode === 'reports'", "{fixedAssetViewMode === 'reports'")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
