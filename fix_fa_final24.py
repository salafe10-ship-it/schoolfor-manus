import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r"onClick=\{\(\) => \(\)\}\s+disabled=\{\}", r"onClick={() => handleDeleteAsset(assetForm.id)}\n                          disabled={!assetForm.id}", text)
text = text.replace("onClick={() => ()}", "onClick={() => {}}")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
