import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace `onChange={(e) => ({ ...XYZ: e.target.value })}` with `onChange={(e) => setAssetForm({ ...assetForm, XYZ: e.target.value })}`
text = re.sub(r"onChange=\{\(e\) => \(\{ \.\.\.([a-zA-Z0-9_]+): e\.target\.value \}\)\}", r"onChange={(e) => setAssetForm({ ...assetForm, \1: e.target.value })}", text)

text = text.replace("onChange={(e) => ({ ...assetForm, cost: e.target.value })}", "onChange={(e) => setAssetForm({ ...assetForm, cost: e.target.value })}")
text = text.replace("onChange={(e) => ({ ...type: e.target.value as any })}", "onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value as any })}")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
