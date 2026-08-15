import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace all "\(\.([\w]+)" with "(assetForm.\1"
text = re.sub(r"\(\.([\w]+)", r"(assetForm.\1", text)
# Replace all "\{\(\.([\w]+)" with "{(assetForm.\1"
text = re.sub(r"\{\(\.([\w]+)", r"{(assetForm.\1", text)
# Replace `parseFloat(.` with `parseFloat(assetForm.`
text = re.sub(r"parseFloat\(\.([\w]+)", r"parseFloat(assetForm.\1", text)
# Replace `parseInt(.` with `parseInt(assetForm.`
text = re.sub(r"parseInt\(\.([\w]+)", r"parseInt(assetForm.\1", text)
# Replace `new Date(.` with `new Date(assetForm.`
text = re.sub(r"new Date\(\.([\w]+)", r"new Date(assetForm.\1", text)
# Replace `!.\w` with `!assetForm.\w`
text = re.sub(r"!\.([\w]+)", r"!assetForm.\1", text)
# Replace `{===` with `{activeAssetTab ===`
text = re.sub(r"\{===", r"{activeAssetTab ===", text)

# Let's see if there are any other `.` left without object.
# Find `\b\.\w+` which means a dot not preceded by a word character.
# Actually, it's safer to just run esbuild and see what fails.

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
