import re

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("if (=== 'all_assets')", "if (fixedAssetReportType === 'all_assets')")
text = text.replace("if (=== 'depreciation')", "if (fixedAssetReportType === 'depreciation')")
text = text.replace("if (=== 'acc_dep')", "if (fixedAssetReportType === 'acc_dep')")
text = text.replace("if (=== 'category')", "if (fixedAssetReportType === 'category')")
text = text.replace("if (=== 'location')", "if (fixedAssetReportType === 'location')")
text = text.replace("if (=== 'cost_center')", "if (fixedAssetReportType === 'cost_center')")
text = text.replace("if (=== 'discarded_sold')", "if (fixedAssetReportType === 'discarded_sold')")

text = text.replace("else if (=== 'all_assets')", "else if (fixedAssetReportType === 'all_assets')")
text = text.replace("else if (=== 'depreciation')", "else if (fixedAssetReportType === 'depreciation')")
text = text.replace("else if (=== 'acc_dep')", "else if (fixedAssetReportType === 'acc_dep')")
text = text.replace("else if (=== 'category')", "else if (fixedAssetReportType === 'category')")
text = text.replace("else if (=== 'location')", "else if (fixedAssetReportType === 'location')")
text = text.replace("else if (=== 'cost_center')", "else if (fixedAssetReportType === 'cost_center')")
text = text.replace("else if (=== 'discarded_sold')", "else if (fixedAssetReportType === 'discarded_sold')")

with open('src/modules/accounting/presentation/FixedAssetsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
