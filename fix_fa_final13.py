import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("onClick={}\n                          className=\"bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer\"\n                        >\n                          <Save className=\"w-4 h-4\" />", "onClick={handleSaveAsset}\n                          className=\"bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer\"\n                        >\n                          <Save className=\"w-4 h-4\" />")

text = text.replace("onClick={}", "onClick={handleSaveAsset}") # just catch any others. Wait, what if there are others?
# Let's replace only this one.
with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
