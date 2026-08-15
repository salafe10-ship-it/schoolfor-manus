import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    fa = f.read()

# Fix the double isNewAssetMode
fa = re.sub(r"const \[isNewAssetMode, setIsNewAssetMode\] = useState<boolean>setIsEditAssetMode\(false\);\n    setIsNewAssetMode\(false\);\nconst \[isNewAssetMode, setIsNewAssetMode\] = useState<boolean>setIsEditAssetMode\(false\);\n    setIsNewAssetMode\(false\);", "const [isEditAssetMode, setIsEditAssetMode] = useState<boolean>(false);\nconst [isNewAssetMode, setIsNewAssetMode] = useState<boolean>(false);", fa)
fa = re.sub(r"const \[isNewAssetMode, setIsNewAssetMode\] = useState<boolean>setIsEditAssetMode\(false\);\n    setIsNewAssetMode\(false\);", "const [isEditAssetMode, setIsEditAssetMode] = useState<boolean>(false);\nconst [isNewAssetMode, setIsNewAssetMode] = useState<boolean>(false);", fa)

# Fix .length
fa = fa.replace("const nextNum = .length + 1;", "const nextNum = fixedAssets.length + 1;")

# Wait, `(false);setIsEditAssetMode(false);\n    setIsNewAssetMode(false);` might be the string.
# Let's just fix it generally.
fa = re.sub(r"const \[isEditAssetMode, setIsEditAssetMode\] = useState<boolean>\(false\);.*?const \[isNewAssetMode, setIsNewAssetMode\] = useState<boolean>.*?false\);", "const [isEditAssetMode, setIsEditAssetMode] = useState<boolean>(false);\nconst [isNewAssetMode, setIsNewAssetMode] = useState<boolean>(false);", fa, flags=re.DOTALL)

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(fa)

print("Fixed FA")
