import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("onClick={() => ()}\n                          disabled={}", 
                    "onClick={() => handleDeleteAsset(assetForm.id)}\n                          disabled={!assetForm.id}")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
