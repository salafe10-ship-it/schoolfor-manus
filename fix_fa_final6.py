import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("value={}", "value={assetSearchQuery}")
text = text.replace("onChange={(e) => (e.target.value)}", "onChange={(e) => setAssetSearchQuery(e.target.value)}")
# Let's see if there are any other `value={}`
text = text.replace("value={}", "value={''}")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
