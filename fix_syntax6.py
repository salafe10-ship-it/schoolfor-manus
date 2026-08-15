import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r"=\s*\.(filter|find|some|reduce|length|forEach)", r"= fixedAssets.\1", text)
text = text.replace("=== )", "=== assetForm.id)")
text = text.replace("=== );", "=== assetForm.id);")
text = text.replace("|| [0];", "|| fixedAssets[0];")
text = text.replace("|| [1] || [0];", "|| fixedAssets[1] || fixedAssets[0];")
text = text.replace("const asset = fixedAssets.find(a => a.id === assetForm.id);", "const asset = fixedAssets.find(a => a.id === (typeof selectedAssetId === 'string' ? selectedAssetId : assetForm.id));")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
