import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("{? '🆕 تسجيل وتعريف أصل مالي جديد' : .name}", "{isNewAssetMode ? '🆕 تسجيل وتعريف أصل مالي جديد' : assetForm.name}")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
