import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("else if (action assetActionModal === 'transfer') {\n                            ({\n                              fromDept: .location || '',\n                              toDept: '',\n                              fromBranch: .branch || '',\n                              toBranch: .branch || '',\n                              fromResponsible: .responsible || '',",
                    "else if (action === 'transfer') {\n                            setTransferForm({\n                              fromDept: assetForm.location || '',\n                              toDept: '',\n                              fromBranch: assetForm.branch || '',\n                              toBranch: assetForm.branch || '',\n                              fromResponsible: assetForm.responsible || '',")

text = text.replace("else if (action === 'sell') {\n                            ({\n                              price: '',",
                    "else if (action === 'sell') {\n                            setSellForm({\n                              price: '',")

text = text.replace("else if (action assetActionModal === 'discard') {\n                            ({\n                              date:",
                    "else if (action === 'discard') {\n                            setDiscardForm({\n                              date:")

text = text.replace("('maintenance');", "setAssetActionModal('maintenance');")
text = text.replace("('transfer');", "setAssetActionModal('transfer');")
text = text.replace("('sale');", "setAssetActionModal('sale');")
text = text.replace("('discard');", "setAssetActionModal('discard');")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
