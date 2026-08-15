import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("onClick={() => {\n                                ({\n                                  fromDept: .location || '',\n                                  toDept: '',\n                                  fromBranch: .branch || '',\n                                  toBranch: .branch || '',\n                                  fromResponsible: .responsible || '',",
                    "onClick={() => {\n                                setTransferForm({\n                                  fromDept: assetForm.location || '',\n                                  toDept: '',\n                                  fromBranch: assetForm.branch || '',\n                                  toBranch: assetForm.branch || '',\n                                  fromResponsible: assetForm.responsible || '',")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
