import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r"const \[fixedAssetViewMode, setFixedAssetViewMode\] = useState[^\n]+\n", "", text)
text = text.replace("=== 'management'", "fixedAssetViewMode === 'management'")
text = text.replace("=== 'reports'", "fixedAssetViewMode === 'reports'")
text = text.replace("onClick={() => ('management')}", "onClick={() => setFixedAssetViewMode('management')}")
text = text.replace("onClick={() => ('reports')}", "onClick={() => setFixedAssetViewMode('reports')}")
text = text.replace("export const FixedAssetsTab = () => {\n  \n", "export const FixedAssetsTab = () => {\n")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
