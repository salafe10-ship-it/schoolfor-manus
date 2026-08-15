import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("if (action === 'depreciate') {\n                            ();\n                          } else if (action === 'recalculate') {\n                            ();\n                          } else if (action assetActionModal assetDetailTab === 'maintenance') {\n                            ({\n                              type: 'دورية',\n                              cost: '',\n                              supplier: .supplier || '',\n                              date: new Date().toISOString().split('T')[0],", 
                    "if (action === 'depreciate') {\n                            handlePostAssetDepreciation();\n                          } else if (action === 'recalculate') {\n                            handleRecalculateAssetDepreciation();\n                          } else if (action === 'maintenance') {\n                            setMaintenanceForm({\n                              type: 'دورية',\n                              cost: '',\n                              supplier: assetForm.supplier || '',\n                              date: new Date().toISOString().split('T')[0],")

text = text.replace("else if (action assetActionModal assetDetailTab === 'maintenance') {", "else if (action === 'maintenance') {")
text = text.replace("supplier: .supplier || '',", "supplier: assetForm.supplier || '',")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
