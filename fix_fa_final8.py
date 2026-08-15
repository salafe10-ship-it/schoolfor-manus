import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("assetForm.toLowerCase()", "assetSearchQuery.toLowerCase()")
text = text.replace("=== 'all' || asset.category ===", "assetCategoryFilter === 'all' || asset.category === assetCategoryFilter")
text = text.replace("=== 'all' || asset.status ===", "assetStatusFilter === 'all' || asset.status === assetStatusFilter")
text = text.replace("assetCategoryFilter === 'all' || asset.category === assetCategoryFilter ;", "assetCategoryFilter === 'all' || asset.category === assetCategoryFilter;")
text = text.replace("assetStatusFilter === 'all' || asset.status === assetStatusFilter ;", "assetStatusFilter === 'all' || asset.status === assetStatusFilter;")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
