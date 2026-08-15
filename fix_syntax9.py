import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace all occurrences of `{\.([a-zA-Z0-9_]+)` with `{assetForm.\1`
text = re.sub(r"\{\.([a-zA-Z0-9_]+)", r"{assetForm.\1", text)
# And `\.([a-zA-Z0-9_]+)` when preceded by `${`
text = re.sub(r"\$\{\.([a-zA-Z0-9_]+)", r"${assetForm.\1", text)
# And inside `value={.XXX}`
text = re.sub(r"value=\{\.([a-zA-Z0-9_]+)", r"value={assetForm.\1", text)
# And `disabled={.XXX`
text = re.sub(r"disabled=\{\.([a-zA-Z0-9_]+)", r"disabled={assetForm.\1", text)

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
