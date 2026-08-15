import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("{activeAssetTab assetActionModal assetDetailTab === 'maintenance' && (", "{assetDetailTab === 'maintenance' && (")
text = text.replace("onClick={() => {\n                                ({\n                                  type: 'دورية',", 
                    "onClick={() => {\n                                setMaintenanceForm({\n                                  type: 'دورية',")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
