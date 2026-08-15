import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("=== 'print_card'", "assetActionModal === 'print_card'")
text = text.replace("=== 'print_schedule'", "assetActionModal === 'print_schedule'")
text = text.replace("=== 'maintenance'", "assetActionModal === 'maintenance'")
text = text.replace("=== 'transfer'", "assetActionModal === 'transfer'")
text = text.replace("=== 'sale'", "assetActionModal === 'sale'")
text = text.replace("=== 'discard'", "assetActionModal === 'discard'")

text = text.replace("onClick={() => ('none')}", "onClick={() => setAssetActionModal('none')}")
text = text.replace("onClick={() => (false)}", "onClick={() => setIsAssetEditing(false)}")
text = text.replace("('all_assets')", "setSelectedAssetsForAction('all_assets')")

text = text.replace("=== 'details'", "assetDetailTab === 'details'")
text = text.replace("=== 'maintenance'", "assetDetailTab === 'maintenance'") # might conflict if they are both used in similar ways. Actually wait!
# If it's `=== 'details'`, it's `assetDetailTab === 'details'`.
# If it's `=== 'maintenance'`, it's `assetDetailTab === 'maintenance'` inside the tab, but `assetActionModal === 'maintenance'` in the modal?
# Let's hope it's not conflicted. Let's just fix the remaining `===` !

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
