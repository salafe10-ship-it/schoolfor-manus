import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("{&& (", "{isNewAssetMode && (")
# Let's check for `{&&` anywhere
text = text.replace("{&&", "{isNewAssetMode &&")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
