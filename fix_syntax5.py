import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace all "\s\.map" with " fixedAssets.map"
text = re.sub(r"=\s*\.map", r"= fixedAssets.map", text)
text = re.sub(r"const updatedAssets = \.map", r"const updatedAssets = fixedAssets.map", text)
text = re.sub(r"^\s*\.map", r"                        fixedAssets.map", text, flags=re.MULTILINE)
text = re.sub(r"rows = \.map", r"rows = fixedAssets.map", text)

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
