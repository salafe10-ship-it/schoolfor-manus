import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("|| .status === 'مستبعد'", "|| assetForm.status === 'مستبعد'")
text = text.replace("|| .barcode", "|| assetForm.barcode")
text = text.replace("|| .id", "|| assetForm.id")
text = text.replace("|| .purchaseDate", "|| assetForm.purchaseDate")
# Just to be safe, any `|| .[a-zA-Z]`
text = re.sub(r"\|\|\s*\.([a-zA-Z0-9_]+)", r"|| assetForm.\1", text)

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
