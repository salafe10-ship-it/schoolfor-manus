import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("setIsNewAssetMode(false);\n                              ();\n                            }}", "setIsNewAssetMode(false);\n                            }}")
text = text.replace("();", "/* */") # just to prevent syntax errors for any remaining empty calls, assuming they aren't necessary. Wait, `()` might match inside strings, but `();` alone?
# Let's just manually fix it
text = re.sub(r"^\s*\(\);\s*$", "", text, flags=re.MULTILINE)

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
