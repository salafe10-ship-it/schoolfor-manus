import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    fa = f.read()

# I see `(!.name` and `(!.code` and `.cost`. These were originally `assetForm.name`, `assetForm.code`, `assetForm.cost`.
fa = re.sub(r"!\.name", "!assetForm.name", fa)
fa = re.sub(r"!\.code", "!assetForm.code", fa)
fa = re.sub(r"parseFloat\(\.cost\)", "parseFloat(assetForm.cost)", fa)
fa = re.sub(r" parseFloat\(\.scrapValue\)", " parseFloat(assetForm.scrapValue)", fa)

# Looking at `const handlePrepareNewAsset = () => {` replacing the second one with `handleSaveAsset`
# Also need to fix `.id` or `assetForm.id`?
fa = re.sub(r"!\.id", "!assetForm.id", fa)

# Wait, the first one was `handlePrepareNewAsset`, the second was `handleSaveAsset`. Let's find them.
parts = fa.split("const handlePrepareNewAsset = () => {")
if len(parts) == 3:
    fa = parts[0] + "const handlePrepareNewAsset = () => {" + parts[1] + "const handleSaveAsset = () => {" + parts[2]

# Let's fix missing setState calls: `(true);` -> `setIsNewAssetMode(true);` or `setIsEditAssetMode(true);`?
# In handlePrepareNewAsset, we set isNewAssetMode to true, isEditAssetMode to true.
# In `parts[0]` there's:
#     netValue: 0,
#     isDepPaused: false
#   });
#   (true);
#   (true);
# };
fa = fa.replace("(true);\n    (true);", "setIsEditAssetMode(true);\n    setIsNewAssetMode(true);")

# Are there other missing variables?
# `const asset = fixedAssets.find(a => a.id === assetId);` -> yes.
# `setAssetForm({ ...asset });` -> yes.
fa = fa.replace("parseFloat(.scrapValue)", "parseFloat(assetForm.scrapValue)")
fa = fa.replace("parseFloat(.usefulLife)", "parseFloat(assetForm.usefulLife)")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(fa)

print("Fixed FA More")
