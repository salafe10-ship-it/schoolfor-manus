import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const updated = .map(a => {", "const updated = fixedAssets.map(a => {")
text = text.replace("if (a.id === ) {", "if (a.id === assetForm.id) {")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
